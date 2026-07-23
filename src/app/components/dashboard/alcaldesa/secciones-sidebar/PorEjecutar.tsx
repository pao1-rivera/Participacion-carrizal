'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { 
  HardHat, Clock, TrendingUp, AlertCircle, CheckCircle2, 
  ArrowRight, Zap, BarChart3, MapPin, MoreVertical, Loader2, Construction,
  ChevronLeft, ChevronRight, Calendar
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/app/lib/utils';
import { supabase } from '@/app/lib/supabaseClient';
import { useAuth } from '@/context/AuthContext';
import { AlertModal } from '@/app/components/AlertModal';

interface ProyectoBase {
  id: number;
  nombre: string;
  presupuesto: number | null;
  presupuesto_asignado: number | null;
  beneficiarios_familias: number | null;
  foto_antes_url: string | null;
  fotos_antes_urls: string[] | null;
  foto_despues_url: string | null;
  estado: string;
  diagnostico: string | null;
  desc_antes: string | null;
  desc_durante: string | null;
  desc_despues: string | null;
  ente_financiamiento?: string | null;
  duracion?: string | null;
  progreso: number;
  tipo: 'consejo' | 'comuna';
  nudo_gravedad?: string;
  updated_at?: string;
  instancia_nombre?: string;
  instancia_id?: number;
}

// Limpieza robusta de rutas de imágenes
const cleanImagePath = (rawPath: string | null): string | null => {
  if (!rawPath) return null;
  if (rawPath.startsWith('[') && rawPath.endsWith(']')) {
    try {
      const parsed = JSON.parse(rawPath);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed[0];
      }
      if (typeof parsed === 'string') {
        return parsed;
      }
    } catch {
      const match = rawPath.match(/^\[\s*"([^"]+)"\s*\]$/);
      if (match) return match[1];
    }
  }
  let cleaned = rawPath.replace(/^\[|\]$/g, '').replace(/^"|"$/g, '').trim();
  return cleaned || null;
};

const getSignedUrl = async (tipo: 'consejo' | 'comuna', storedPath: string): Promise<string | null> => {
  if (!storedPath) return null;
  const cleanedPath = cleanImagePath(storedPath);
  if (!cleanedPath) return null;
  
  const bucket = tipo === 'consejo' ? 'proyectos_docs' : 'rendiciones_comuna';
  let relativePath = cleanedPath;
  const publicUrlPattern = new RegExp(`/storage/v1/object/public/${bucket}/`);
  if (publicUrlPattern.test(cleanedPath)) {
    const parts = cleanedPath.split(`/storage/v1/object/public/${bucket}/`);
    relativePath = parts[parts.length - 1];
  } else if (cleanedPath.startsWith('http')) {
    const match = cleanedPath.match(/\/storage\/v1\/object\/public\/[^/]+\/(.+)$/);
    if (match) relativePath = match[1];
    else return cleanedPath;
  }
  
  try {
    const { data, error } = await supabase.storage
      .from(bucket)
      .createSignedUrl(relativePath, 60 * 5);
    if (error) {
      console.error(`Error generando URL firmada para ${tipo} (${relativePath}):`, error.message);
      return null;
    }
    return data.signedUrl;
  } catch (err) {
    console.error(`Excepción en getSignedUrl para ${tipo}:`, err);
    return null;
  }
};

export const PorEjecutar = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [proyectosActuales, setProyectosActuales] = useState<ProyectoBase[]>([]);
  const [proyectosCulminados, setProyectosCulminados] = useState<ProyectoBase[]>([]);
  const [proyectoImagenesActuales, setProyectoImagenesActuales] = useState<Record<string, { antes: string | null }>>({});
  const [proyectoImagenesCulminados, setProyectoImagenesCulminados] = useState<Record<string, { antes: string | null }>>({});
  
  const [actualPage, setActualPage] = useState(1);
  const [culminadosPage, setCulminadosPage] = useState(1);
  const itemsPerPage = 6;
  const [activeView, setActiveView] = useState<'actuales' | 'culminados'>('actuales');

  const [modalState, setModalState] = useState({
    isOpen: false,
    title: '',
    message: '',
    type: 'info' as any,
    showInput: false,
    inputPlaceholder: '',
    onConfirm: null as (() => void) | null,
  });

  const showAlert = (title: string, message: string, type?: any) => {
    setModalState({ ...modalState, isOpen: true, title, message, type: type || 'info', showInput: false, onConfirm: null });
  };
  const closeModal = () => setModalState(prev => ({ ...prev, isOpen: false }));

  const formatearFecha = (fecha: string | undefined) => {
    if (!fecha) return 'No registrada';
    const date = new Date(fecha);
    return date.toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit', year: 'numeric' });
  };

  const obtenerNombreInstancia = async (tipo: 'consejo' | 'comuna', id: number): Promise<string | null> => {
    if (!id) return null;
    try {
      if (tipo === 'consejo') {
        const { data, error } = await supabase
          .from('datos_consejo_comunal')
          .select('nombre_consejo')
          .eq('id_consejo', id)
          .single();
        if (error) {
          console.error(`Error obteniendo consejo ${id}:`, error);
          return null;
        }
        return data?.nombre_consejo || null;
      } else {
        const { data, error } = await supabase
          .from('datos_comuna')
          .select('nombre_comuna')
          .eq('id_comuna', id)
          .single();
        if (error) {
          console.error(`Error obteniendo comuna ${id}:`, error);
          return null;
        }
        return data?.nombre_comuna || null;
      }
    } catch (err) {
      console.error(`Excepción obteniendo nombre de instancia:`, err);
      return null;
    }
  };

  const cargarProyectos = useCallback(async () => {
    setLoading(true);
    try {
      const { data: consejosActuales, error: err1 } = await supabase
        .from('proyectos')
        .select('*')
        .in('estado', ['Aprobado', 'En Ejecución'])
        .order('created_at', { ascending: false });
      if (err1) throw err1;

      const { data: comunasActuales, error: err2 } = await supabase
        .from('proyectos_comuna')
        .select('*')
        .in('estado', ['Aprobado', 'En Ejecución'])
        .order('created_at', { ascending: false });
      if (err2) throw err2;

      const { data: consejosCulminados, error: err3 } = await supabase
        .from('proyectos')
        .select('*')
        .eq('estado', 'Culminado')
        .order('created_at', { ascending: false });
      if (err3) throw err3;

      const { data: comunasCulminados, error: err4 } = await supabase
        .from('proyectos_comuna')
        .select('*')
        .eq('estado', 'Culminado')
        .order('created_at', { ascending: false });
      if (err4) throw err4;

      const consejosActualesConNombre = await Promise.all(
        (consejosActuales || []).map(async (p) => {
          const idInstancia = p.id_consejo;
          const nombre = idInstancia ? await obtenerNombreInstancia('consejo', idInstancia) : null;
          return { ...p, instancia_nombre: nombre, instancia_id: idInstancia };
        })
      );
      const comunasActualesConNombre = await Promise.all(
        (comunasActuales || []).map(async (p) => {
          const idInstancia = p.id_comuna;
          const nombre = idInstancia ? await obtenerNombreInstancia('comuna', idInstancia) : null;
          return { ...p, instancia_nombre: nombre, instancia_id: idInstancia };
        })
      );
      const consejosCulminadosConNombre = await Promise.all(
        (consejosCulminados || []).map(async (p) => {
          const idInstancia = p.id_consejo;
          const nombre = idInstancia ? await obtenerNombreInstancia('consejo', idInstancia) : null;
          return { ...p, instancia_nombre: nombre, instancia_id: idInstancia };
        })
      );
      const comunasCulminadosConNombre = await Promise.all(
        (comunasCulminados || []).map(async (p) => {
          const idInstancia = p.id_comuna;
          const nombre = idInstancia ? await obtenerNombreInstancia('comuna', idInstancia) : null;
          return { ...p, instancia_nombre: nombre, instancia_id: idInstancia };
        })
      );

      const unificar = (items: any[], tipo: 'consejo' | 'comuna'): ProyectoBase[] =>
        (items || []).map(p => ({
          id: p.id_proyecto || p.id_proyecto_comuna,
          nombre: p.nombre,
          presupuesto: p.presupuesto,
          presupuesto_asignado: p.presupuesto_asignado,
          beneficiarios_familias: p.beneficiarios_familias,
          foto_antes_url: p.foto_antes_url,
          fotos_antes_urls: p.fotos_antes_urls,
          foto_despues_url: p.foto_despues_url,
          estado: p.estado,
          diagnostico: p.diagnostico,
          desc_antes: p.desc_antes,
          desc_durante: p.desc_durante,
          desc_despues: p.desc_despues,
          ente_financiamiento: p.ente_financiamiento,
          duracion: p.duracion,
          progreso: p.progreso || 0,
          tipo,
          updated_at: p.updated_at,
          instancia_nombre: p.instancia_nombre,
          instancia_id: p.instancia_id,
        }));

      const actuales = [...unificar(consejosActualesConNombre, 'consejo'), ...unificar(comunasActualesConNombre, 'comuna')];
      const culminados = [...unificar(consejosCulminadosConNombre, 'consejo'), ...unificar(comunasCulminadosConNombre, 'comuna')];

      const generarImagenes = async (proyectos: ProyectoBase[]) => {
        const imagenes: Record<string, { antes: string | null }> = {};
        for (const proy of proyectos) {
          const key = `${proy.tipo}-${proy.id}`;
          let rawPath = proy.foto_antes_url;
          if (!rawPath && proy.fotos_antes_urls?.length) {
            rawPath = proy.fotos_antes_urls[0];
          }
          const url = rawPath ? await getSignedUrl(proy.tipo, rawPath) : null;
          imagenes[key] = { antes: url };
        }
        return imagenes;
      };

      const [imagenesActuales, imagenesCulminados] = await Promise.all([
        generarImagenes(actuales),
        generarImagenes(culminados),
      ]);

      setProyectosActuales(actuales);
      setProyectosCulminados(culminados);
      setProyectoImagenesActuales(imagenesActuales);
      setProyectoImagenesCulminados(imagenesCulminados);
    } catch (error) {
      console.error('Error cargando proyectos:', error);
      showAlert('Error', 'No se pudieron cargar los proyectos', 'danger');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    cargarProyectos();
  }, [cargarProyectos]);

  const totalPlanificado = proyectosActuales.reduce((sum, p) => sum + (p.presupuesto || 0), 0);
  const totalEjecutado = proyectosActuales.reduce((sum, p) => {
    const asignado = p.presupuesto_asignado ?? 0;
    if (asignado > 0) return sum + asignado;
    return sum + ((p.presupuesto || 0) * (p.progreso / 100));
  }, 0);
  const porcentajeEjecutado = totalPlanificado > 0 ? (totalEjecutado / totalPlanificado) * 100 : 0;
  const avancePromedio = proyectosActuales.length
    ? Math.round(proyectosActuales.reduce((sum, p) => sum + p.progreso, 0) / proyectosActuales.length)
    : 0;

  const generarCurvaS = (porcentaje: number) => {
    const startX = 0, startY = 180, endX = 700, endY = 20;
    const cp1x = 200, cp1y = startY - (startY - endY) * (porcentaje / 100) * 0.7;
    const cp2x = 500, cp2y = startY - (startY - endY) * (porcentaje / 100) * 0.3;
    const finalX = endX * (porcentaje / 100);
    const finalY = startY - (startY - endY) * (porcentaje / 100);
    return `M ${startX},${startY} C ${cp1x},${cp1y} ${cp2x},${cp2y} ${finalX},${finalY}`;
  };
  const curvaPlanificada = `M 0,180 C 200,140 500,40 700,20`;

  const actualTotalPages = Math.ceil(proyectosActuales.length / itemsPerPage);
  const culminadosTotalPages = Math.ceil(proyectosCulminados.length / itemsPerPage);
  const startActual = (actualPage - 1) * itemsPerPage;
  const currentActuales = proyectosActuales.slice(startActual, startActual + itemsPerPage);
  const startCulminados = (culminadosPage - 1) * itemsPerPage;
  const currentCulminados = proyectosCulminados.slice(startCulminados, startCulminados + itemsPerPage);

  // Componente de tarjeta sin enlace
  const ProjectCard = ({ proyecto, imagenUrl }: { proyecto: ProyectoBase; imagenUrl: string | null }) => {
    const presupuestoMostrar = proyecto.presupuesto_asignado || proyecto.presupuesto || 0;
    let statusBadgeColor = '';
    if (proyecto.estado === 'En Ejecución') statusBadgeColor = 'bg-brand-primary/10 text-brand-primary border-brand-primary/20';
    else if (proyecto.estado === 'Aprobado') statusBadgeColor = 'bg-blue-50 text-blue-600 border-blue-100';
    else if (proyecto.estado === 'Culminado') statusBadgeColor = 'bg-emerald-50 text-emerald-600 border-emerald-100';
    else statusBadgeColor = 'bg-slate-100 text-slate-600 border-slate-200';

    const tipoInstancia = proyecto.tipo === 'consejo' ? 'Consejo Comunal' : 'Comuna';

    return (
      <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm hover:shadow-md transition-all group flex flex-col justify-between h-full cursor-default">
        <div className="flex justify-between items-start mb-3">
          <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center text-white shadow-md",
            proyecto.progreso < 30 ? "bg-rose-500" : proyecto.progreso >= 80 ? "bg-emerald-500" : "bg-brand-primary"
          )}>
            <HardHat size={20} />
          </div>
          <div className={cn("px-2 py-0.5 rounded-lg text-[7px] font-black uppercase tracking-wider border", statusBadgeColor)}>
            {proyecto.estado}
          </div>
        </div>
        
        <div className="mb-3">
          <div className="w-14 h-14 rounded-lg overflow-hidden bg-slate-100 mb-2 flex items-center justify-center">
            {imagenUrl ? (
              <img 
                src={imagenUrl} 
                className="w-full h-full object-cover" 
                alt={proyecto.nombre}
                onError={(e) => {
                  (e.target as HTMLImageElement).style.display = 'none';
                }}
              />
            ) : (
              <Construction className="w-full h-full p-3 text-slate-300" />
            )}
          </div>
          <h4 className="text-sm font-black text-slate-900 leading-tight uppercase italic mb-0.5 line-clamp-2">{proyecto.nombre}</h4>
          <div className="flex items-center gap-1 mt-1">
            <MapPin size={8} className="text-slate-400" />
            <p className="text-[8px] font-bold text-slate-500 uppercase tracking-tighter">
              {tipoInstancia}: {proyecto.instancia_nombre || 'No especificada'}
            </p>
          </div>
          <p className="text-[8px] text-slate-400 font-bold uppercase tracking-tighter mt-1">USD. {presupuestoMostrar.toLocaleString()}</p>
        </div>
        
        <div className="space-y-2">
          <div>
            <div className="flex justify-between items-end mb-0.5">
              <span className="text-[7px] font-black text-slate-400 uppercase">Avance</span>
              <span className="text-[9px] font-black italic text-slate-900">{proyecto.progreso}%</span>
            </div>
            <div className="h-1 w-full bg-slate-50 rounded-full overflow-hidden border border-slate-100">
              <motion.div 
                initial={{ width: 0 }}
                animate={{ width: `${proyecto.progreso}%` }}
                className={cn("h-full rounded-full", 
                  proyecto.progreso < 30 ? "bg-rose-500" : proyecto.progreso >= 80 ? "bg-emerald-500" : "bg-brand-primary"
                )}
              />
            </div>
          </div>
          <div className="flex items-center justify-between pt-1">
            <div className="flex items-center gap-1">
              <Calendar size={8} className="text-slate-500" />
              <span className="text-[9px] font-bold text-slate-600 uppercase">Actualización: {formatearFecha(proyecto.updated_at)}</span>
            </div>
          </div>
        </div>
      </div>
    );
  };

  const SectionWithArrows = ({ title, proyectos, imagenes, page, setPage, totalPages }: { 
    title: string; 
    proyectos: ProyectoBase[]; 
    imagenes: Record<string, { antes: string | null }>;
    page: number;
    setPage: (p: number) => void;
    totalPages: number;
  }) => {
    if (proyectos.length === 0) {
      return (
        <div className="text-center py-12 bg-white rounded-3xl border border-slate-100">
          <p className="text-slate-400 text-sm font-bold">No hay proyectos en esta categoría</p>
        </div>
      );
    }
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h3 className="text-xl font-black text-slate-800 uppercase tracking-tighter italic">{title}</h3>
          <span className="text-[9px] text-slate-400 font-bold">Total: {proyectos.length} proyectos</span>
        </div>
        <div className="relative flex items-center gap-2">
          <button
            onClick={() => setPage(Math.max(1, page - 1))}
            disabled={page === 1}
            className="p-2 rounded-full bg-white border border-slate-200 shadow-sm disabled:opacity-40 hover:bg-slate-50 transition shrink-0"
          >
            <ChevronLeft size={18} />
          </button>
          <div className="flex-1 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {proyectos.map((proy) => {
              const imagenUrl = imagenes[`${proy.tipo}-${proy.id}`]?.antes;
              return <ProjectCard key={`${proy.tipo}-${proy.id}`} proyecto={proy} imagenUrl={imagenUrl} />;
            })}
          </div>
          <button
            onClick={() => setPage(Math.min(totalPages, page + 1))}
            disabled={page === totalPages}
            className="p-2 rounded-full bg-white border border-slate-200 shadow-sm disabled:opacity-40 hover:bg-slate-50 transition shrink-0"
          >
            <ChevronRight size={18} />
          </button>
        </div>
        {totalPages > 1 && (
          <div className="flex justify-center gap-1 mt-2">
            {Array.from({ length: totalPages }).map((_, i) => (
              <button
                key={i}
                onClick={() => setPage(i+1)}
                className={cn("w-2 h-2 rounded-full transition-all", page === i+1 ? "bg-brand-primary w-4" : "bg-slate-300")}
              />
            ))}
          </div>
        )}
      </div>
    );
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[400px]">
        <Loader2 className="animate-spin text-brand-primary h-8 w-8" />
      </div>
    );
  }

  return (
    <motion.div 
      initial={{ opacity: 0, scale: 0.98 }}
      animate={{ opacity: 1, scale: 1 }}
      className="space-y-10 pb-12"
    >
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-black text-slate-900 uppercase tracking-tighter italic">Monitoreo de Proyectos</h2>
          <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mt-1">Ejecución y seguimiento de obras</p>
        </div>
        <div className="flex gap-2 bg-white p-1 rounded-xl border border-slate-200 shadow-sm">
          <button
            onClick={() => { setActiveView('actuales'); setActualPage(1); }}
            className={cn(
              "px-5 py-2 rounded-lg text-[10px] font-black uppercase tracking-wider transition-all",
              activeView === 'actuales' ? "bg-brand-primary text-white shadow-md" : "text-slate-500 hover:bg-slate-50"
            )}
          >
            En Ejecución / Aprobados
          </button>
          <button
            onClick={() => { setActiveView('culminados'); setCulminadosPage(1); }}
            className={cn(
              "px-5 py-2 rounded-lg text-[10px] font-black uppercase tracking-wider transition-all",
              activeView === 'culminados' ? "bg-brand-primary text-white shadow-md" : "text-slate-500 hover:bg-slate-50"
            )}
          >
            Culminados
          </button>
        </div>
      </div>

      <AnimatePresence mode="wait">
        {activeView === 'actuales' && (
          <motion.div
            key="actuales"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
            className="space-y-12"
          >
            <SectionWithArrows
              title="Proyectos en Ejecución / Aprobados"
              proyectos={currentActuales}
              imagenes={proyectoImagenesActuales}
              page={actualPage}
              setPage={setActualPage}
              totalPages={actualTotalPages}
            />

            <div className="grid grid-cols-1 xl:grid-cols-3 gap-10 mt-8">
              <div className="xl:col-span-2 bg-white rounded-4xl border border-slate-100 shadow-xl p-8">
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <h3 className="text-xl font-black text-slate-900 italic uppercase leading-none">Curva S de Ejecución Global</h3>
                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-[0.2em] mt-2">Planificado vs Ejecutado </p>
                  </div>
                  <div className="flex gap-3">
                    <div className="flex items-center gap-1.5"><div className="w-3 h-3 rounded-full bg-slate-300" /><span className="text-[8px] font-black text-slate-500">Planificado</span></div>
                    <div className="flex items-center gap-1.5"><div className="w-3 h-3 rounded-full bg-brand-primary" /><span className="text-[8px] font-black text-slate-500">Ejecutado</span></div>
                  </div>
                </div>
                <div className="h-64 w-full bg-slate-50 rounded-3xl border border-slate-100 relative overflow-hidden">
                  <div className="absolute inset-0 grid grid-cols-6 pointer-events-none"><div className="border-r border-slate-200/50" /><div className="border-r border-slate-200/50" /><div className="border-r border-slate-200/50" /><div className="border-r border-slate-200/50" /><div className="border-r border-slate-200/50" /></div>
                  <div className="absolute inset-0 grid grid-rows-4 pointer-events-none"><div className="border-b border-slate-200/50" /><div className="border-b border-slate-200/50" /><div className="border-b border-slate-200/50" /></div>
                  <svg className="w-full h-full" viewBox="0 0 700 200" preserveAspectRatio="none">
                    <motion.path
                      initial={{ pathLength: 0 }}
                      animate={{ pathLength: 1 }}
                      transition={{ duration: 1.5 }}
                      d={curvaPlanificada}
                      fill="none"
                      stroke="#cbd5e1"
                      strokeWidth="4"
                      strokeDasharray="6 6"
                    />
                    <motion.path
                      initial={{ pathLength: 0 }}
                      animate={{ pathLength: 1 }}
                      transition={{ duration: 2 }}
                      d={generarCurvaS(porcentajeEjecutado)}
                      fill="none"
                      stroke="#042D5F"
                      strokeWidth="6"
                      strokeLinecap="round"
                    />
                    <circle 
                      cx={700 * (porcentajeEjecutado / 100)} 
                      cy={180 - (180 - 20) * (porcentajeEjecutado / 100)} 
                      r="5" 
                      fill="#042D5F" 
                    />
                  </svg>
                </div>
                <div className="mt-6 flex justify-between items-center pt-4 border-t border-slate-50">
                  <div className="flex gap-6">
                    <div><p className="text-[8px] font-black text-slate-400 uppercase">Obras Activas</p><p className="text-base font-black text-slate-900 italic">{proyectosActuales.length}</p></div>
                  </div>
                </div>
              </div>

              <div className="bg-slate-900 rounded-4xl p-8 text-white shadow-2xl flex flex-col justify-between group overflow-hidden relative">
                <div className="relative z-10">
                  <h3 className="text-lg font-black italic uppercase tracking-tighter text-brand-primary leading-none mb-6">Resumen de Progreso</h3>
                  <div className="space-y-5">
                    <div className="flex justify-between items-center p-4 bg-white/5 border border-white/5 rounded-2xl">
                      <span className="text-[9px] font-black uppercase tracking-tight text-white/60">Proyectos en Ejecución</span>
                      <span className="text-sm font-black italic text-brand-primary">{proyectosActuales.length}</span>
                    </div>
                    <div className="flex justify-between items-center p-4 bg-white/5 border border-white/5 rounded-2xl">
                      <span className="text-[9px] font-black uppercase tracking-tight text-white/60">Proyectos Culminados</span>
                      <span className="text-sm font-black italic text-brand-primary">{proyectosCulminados.length}</span>
                    </div>
                    <div className="flex justify-between items-center p-4 bg-white/5 border border-white/5 rounded-2xl">
                      <span className="text-[9px] font-black uppercase tracking-tight text-white/60">Avance Promedio (Activos)</span>
                      <span className="text-sm font-black italic text-brand-primary">{avancePromedio}%</span>
                    </div>
                  </div>
                </div>
                <div className="absolute -bottom-20 -right-20 w-80 h-80 bg-brand-primary/10 rounded-full blur-[100px] group-hover:scale-125 transition-transform duration-1000" />
              </div>
            </div>
          </motion.div>
        )}

        {activeView === 'culminados' && (
          <motion.div
            key="culminados"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
          >
            <SectionWithArrows
              title="Proyectos Culminados"
              proyectos={currentCulminados}
              imagenes={proyectoImagenesCulminados}
              page={culminadosPage}
              setPage={setCulminadosPage}
              totalPages={culminadosTotalPages}
            />
          </motion.div>
        )}
      </AnimatePresence>

      <AlertModal isOpen={modalState.isOpen} onClose={closeModal} title={modalState.title} message={modalState.message} type={modalState.type} showInput={modalState.showInput} inputPlaceholder={modalState.inputPlaceholder} confirmText="Aceptar" onConfirm={modalState.onConfirm || (() => closeModal())} />
    </motion.div>
  );
};