'use client';
import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  TrendingUp, CheckCircle, Clock, AlertCircle, BarChart3, 
  Globe, Users, Shield, Heart, Zap, Droplets, 
  ChevronRight, Loader2, FileText, MapPin, X, Layers
} from 'lucide-react';
import { cn } from '@/app/lib/utils';
import { supabase } from '@/app/lib/supabaseClient';
import { useAuth } from '@/context/AuthContext';

// ==================== TIPOS ====================
interface Nudo {
  id: string;
  id_real: number;
  tabla: 'consejo' | 'comuna';
  titulo: string;
  categoria_7t: string;
  gravedad: string;
  estado: string;
  latitud?: number | null;
  longitud?: number | null;
}

interface Proyecto {
  id: string;
  id_real: number;
  tabla: 'consejo' | 'comuna';
  nombre: string;
  categoria_7t: string;
  estado: string;
  progreso: number;
  presupuesto?: number | null;
}

const TRANSFORMACIONES = [
  { id: 'T1', nombre: 'Transformación Económica', icon: TrendingUp, color: 'blue', gradient: 'from-blue-500 to-blue-600', eje: 'Emprendimiento, EPS y UPF' },
  { id: 'T2', nombre: 'Independencia Plena', icon: Zap, color: 'amber', gradient: 'from-amber-500 to-amber-600', eje: 'Formación, Ciencia y Tecnología Comunal' },
  { id: 'T3', nombre: 'Paz, Seguridad e Integridad', icon: Shield, color: 'red', gradient: 'from-red-500 to-red-600', eje: 'Cuadrantes de Paz y prevención comunitaria' },
  { id: 'T4', nombre: 'Transformación Social', icon: Heart, color: 'pink', gradient: 'from-pink-500 to-pink-600', eje: 'Salud, Adulto Mayor y Vivienda' },
  { id: 'T5', nombre: 'Transformación Política', icon: Users, color: 'indigo', gradient: 'from-indigo-500 to-indigo-600', eje: 'Elecciones de Voceros y Renovación de Vocerías' },
  { id: 'T6', nombre: 'Transformación Ecológica', icon: Droplets, color: 'green', gradient: 'from-green-500 to-green-600', eje: 'Gestión de Riesgos y recolección de desechos' },
  { id: 'T7', nombre: 'Transformación Geopolítica', icon: Globe, color: 'purple', gradient: 'from-purple-500 to-purple-600', eje: 'Alianzas e intercambio institucional' }
];

// ==================== COMPONENTE PRINCIPAL ====================
export const Seguimiento = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [nudos, setNudos] = useState<Nudo[]>([]);
  const [proyectos, setProyectos] = useState<Proyecto[]>([]);
  const [selectedTransformacion, setSelectedTransformacion] = useState<string | null>(null);
  const [modalOpen, setModalOpen] = useState(false);

  // Ocultar sidebar al abrir modal
  useEffect(() => {
    if (modalOpen) {
      document.body.classList.add('modal-open');
      const styleId = 'modal-sidebar-hide';
      if (!document.getElementById(styleId)) {
        const style = document.createElement('style');
        style.id = styleId;
        style.textContent = `
          .modal-open .sidebar,
          .modal-open [class*="sidebar"],
          .modal-open aside {
            display: none !important;
          }
          .modal-open .main-content,
          .modal-open [class*="main"] {
            margin-left: 0 !important;
            width: 100% !important;
          }
        `;
        document.head.appendChild(style);
      }
    } else {
      document.body.classList.remove('modal-open');
      const styleElement = document.getElementById('modal-sidebar-hide');
      if (styleElement) styleElement.remove();
    }
    return () => {
      document.body.classList.remove('modal-open');
      const styleElement = document.getElementById('modal-sidebar-hide');
      if (styleElement) styleElement.remove();
    };
  }, [modalOpen]);

  const cargarDatos = useCallback(async () => {
    setLoading(true);
    try {
      const [nudosConsejo, nudosComuna, proyectosConsejo, proyectosComuna] = await Promise.all([
        supabase.from('nudos_criticos').select('*'),
        supabase.from('nudos_criticos_comuna').select('*'),
        supabase.from('proyectos').select('*'),
        supabase.from('proyectos_comuna').select('*')
      ]);

      const nudosUnificados: Nudo[] = [
        ...(nudosConsejo.data || []).map((n: any) => ({
          id: `consejo-${n.id_nudo}`,
          id_real: n.id_nudo,
          tabla: 'consejo' as const,
          titulo: n.titulo,
          categoria_7t: n.categoria_7t,
          gravedad: n.gravedad,
          estado: n.estado,
          latitud: n.latitud,
          longitud: n.longitud,
        })),
        ...(nudosComuna.data || []).map((n: any) => ({
          id: `comuna-${n.id_nudo_comuna}`,
          id_real: n.id_nudo_comuna,
          tabla: 'comuna' as const,
          titulo: n.titulo,
          categoria_7t: n.categoria_7t,
          gravedad: n.gravedad,
          estado: n.estado || 'activo',
          latitud: n.latitud,
          longitud: n.longitud,
        }))
      ];

      const proyectosUnificados: Proyecto[] = [
        ...(proyectosConsejo.data || []).map((p: any) => ({
          id: `consejo-${p.id_proyecto}`,
          id_real: p.id_proyecto,
          tabla: 'consejo' as const,
          nombre: p.nombre,
          categoria_7t: p.categoria_7t,
          estado: p.estado,
          progreso: p.progreso || 0,
          presupuesto: p.presupuesto,
        })),
        ...(proyectosComuna.data || []).map((p: any) => ({
          id: `comuna-${p.id_proyecto_comuna}`,
          id_real: p.id_proyecto_comuna,
          tabla: 'comuna' as const,
          nombre: p.nombre,
          categoria_7t: p.categoria_7t,
          estado: p.estado,
          progreso: p.progreso || 0,
          presupuesto: p.presupuesto,
        }))
      ];

      setNudos(nudosUnificados);
      setProyectos(proyectosUnificados);
    } catch (error) {
      console.error('Error cargando datos:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    cargarDatos();
  }, [cargarDatos]);

  const estadisticas = useMemo(() => {
    const totalPropuestas = nudos.length + proyectos.length;
    const proyectosAprobados = proyectos.filter(p => ['Aprobado', 'Ejecución', 'Finalizado'].includes(p.estado)).length;
    const porcentajeAprobados = totalPropuestas > 0 ? Math.round((proyectosAprobados / totalPropuestas) * 100) : 0;
    
    const frecuencias: Record<string, number> = {};
    [...nudos, ...proyectos].forEach(item => {
      const cat = item.categoria_7t;
      frecuencias[cat] = (frecuencias[cat] || 0) + 1;
    });
    let categoriaMasDemandada = '';
    let maxFrecuencia = 0;
    for (const [cat, freq] of Object.entries(frecuencias)) {
      if (freq > maxFrecuencia) {
        maxFrecuencia = freq;
        categoriaMasDemandada = cat;
      }
    }
    const transformacionMasDemandada = TRANSFORMACIONES.find(t => t.id === categoriaMasDemandada);
    return {
      totalPropuestas,
      proyectosAprobados,
      porcentajeAprobados,
      categoriaMasDemandada,
      transformacionMasDemandada
    };
  }, [nudos, proyectos]);

  const statsPorTransformacion = useMemo(() => {
    return TRANSFORMACIONES.map(t => {
      const nudosT = nudos.filter(n => n.categoria_7t === t.id);
      const proyectosT = proyectos.filter(p => p.categoria_7t === t.id);
      const totalNudos = nudosT.length;
      const totalProyectos = proyectosT.length;
      const proyectosAvanzados = proyectosT.filter(p => p.progreso >= 50).length;
      return {
        ...t,
        totalNudos,
        totalProyectos,
        proyectosAvanzados,
        progresoGeneral: totalProyectos > 0 ? Math.round((proyectosAvanzados / totalProyectos) * 100) : 0
      };
    });
  }, [nudos, proyectos]);

  const handleCardClick = (transformacionId: string) => {
    setSelectedTransformacion(transformacionId);
    setModalOpen(true);
  };

  const closeModal = () => {
    setModalOpen(false);
    setSelectedTransformacion(null);
  };

  const selectedData = useMemo(() => {
    if (!selectedTransformacion) return null;
    const transformacion = TRANSFORMACIONES.find(t => t.id === selectedTransformacion);
    const nudosFiltrados = nudos.filter(n => n.categoria_7t === selectedTransformacion);
    const proyectosFiltrados = proyectos.filter(p => p.categoria_7t === selectedTransformacion);
    return { transformacion, nudos: nudosFiltrados, proyectos: proyectosFiltrados };
  }, [selectedTransformacion, nudos, proyectos]);

  if (loading) {
    return <div className="flex justify-center p-12"><Loader2 className="animate-spin text-brand-primary" size={32} /></div>;
  }

  return (
    <div className="space-y-6 p-4 md:p-6 max-w-7xl mx-auto">
      {/* Tarjetas de resumen global */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <ResumenCard 
          icon={<BarChart3 size={20} />}
          label="Total de propuestas"
          value={estadisticas.totalPropuestas}
          subtext="Nudos + Proyectos"
          color="emerald"
        />
        <ResumenCard 
          icon={<CheckCircle size={20} />}
          label="Proyectos aprobados / vinculados"
          value={`${estadisticas.proyectosAprobados} (${estadisticas.porcentajeAprobados}%)`}
          subtext="Del total registrado"
          color="blue"
        />
        <ResumenCard 
          icon={<TrendingUp size={20} />}
          label="7T con mayor demanda"
          value={estadisticas.transformacionMasDemandada?.nombre || '—'}
          subtext={`${estadisticas.categoriaMasDemandada} · ${estadisticas.transformacionMasDemandada?.eje || ''}`}
          color="amber"
        />
      </div>

      {/* Grid de tarjetas de las 7 Transformaciones (sin cambios) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {statsPorTransformacion.map((t) => (
          <div
            key={t.id}
            onClick={() => handleCardClick(t.id)}
            className="group bg-white rounded-2xl border border-slate-100 shadow-xs hover:shadow-xl hover:border-slate-200 transition-all duration-300 cursor-pointer overflow-hidden transform hover:scale-[1.01]"
          >
            <div className={cn("h-1.5 w-full bg-gradient-to-r", t.gradient)} />
            <div className="p-5">
              <div className="flex items-center justify-between mb-3">
                <div className={cn("p-2 rounded-xl text-xs font-semibold", 
                  t.color === 'blue' ? 'bg-blue-50 text-blue-600' :
                  t.color === 'amber' ? 'bg-amber-50 text-amber-600' :
                  t.color === 'red' ? 'bg-red-50 text-red-600' :
                  t.color === 'pink' ? 'bg-pink-50 text-pink-600' :
                  t.color === 'indigo' ? 'bg-indigo-50 text-indigo-600' :
                  t.color === 'green' ? 'bg-green-50 text-green-600' : 'bg-purple-50 text-purple-600'
                )}>
                  {React.createElement(t.icon, { size: 18 })}
                </div>
                <span className="text-xs font-bold font-mono text-slate-300">{t.id}</span>
              </div>
              <h3 className="font-bold text-slate-800 text-sm mb-1">{t.nombre}</h3>
              <p className="text-[11px] text-slate-400 mb-4 line-clamp-1">{t.eje}</p>
              
              <div className="grid grid-cols-2 gap-3 mb-4 bg-slate-50 p-2.5 rounded-xl border border-slate-100/50">
                <div>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Nudos</p>
                  <p className="text-base font-extrabold text-slate-700">{t.totalNudos}</p>
                </div>
                <div>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Proyectos</p>
                  <p className="text-base font-extrabold text-slate-700">{t.totalProyectos}</p>
                </div>
              </div>
              
              <div className="space-y-1">
                <div className="flex justify-between text-[11px] font-medium">
                  <span className="text-slate-500">Avance general</span>
                  <span className="text-slate-700 font-bold font-mono">{t.progresoGeneral}%</span>
                </div>
                <div className="w-full bg-slate-100 rounded-full h-1.5">
                  <div 
                    className={cn("h-1.5 rounded-full bg-gradient-to-r", t.gradient)} 
                    style={{ width: `${t.progresoGeneral}%` }}
                  />
                </div>
              </div>
            </div>
            <div className="px-5 py-3 bg-slate-50/50 border-t border-slate-100 flex justify-between items-center text-xs font-medium text-slate-500 group-hover:bg-slate-50 transition-colors">
              <span>Ver análisis detallado</span>
              <ChevronRight size={14} className="group-hover:translate-x-1 transition-transform text-slate-400" />
            </div>
          </div>
        ))}
      </div>

      {/* Modal reducida y optimizada, con sidebar oculto */}
      <AnimatePresence>
        {modalOpen && selectedData && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6">
            {/* Backdrop */}
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" 
              onClick={closeModal} 
            />
            
            {/* Contenedor del Modal - Tamaño reducido */}
            <motion.div
              initial={{ opacity: 0, scale: 0.96, y: 8 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.96, y: 8 }}
              transition={{ type: 'spring', duration: 0.35 }}
              className="relative w-full max-w-2xl max-h-[85vh] bg-white rounded-xl shadow-lg border border-slate-200 overflow-hidden flex flex-col z-10"
            >
              {/* Cabecera compacta */}
              <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-slate-50/80">
                <div className="flex gap-3 items-center">
                  <div className={cn("p-2 rounded-lg text-white shadow-sm bg-gradient-to-r", selectedData.transformacion?.gradient)}>
                    {selectedData.transformacion && React.createElement(selectedData.transformacion.icon, { size: 16 })}
                  </div>
                  <div>
                    <div className="flex items-center gap-1.5">
                      <span className="text-[9px] font-bold font-mono bg-slate-200/80 text-slate-600 px-1.5 py-0.5 rounded">
                        {selectedData.transformacion?.id}
                      </span>
                      <h3 className="font-extrabold text-slate-800 text-sm">{selectedData.transformacion?.nombre}</h3>
                    </div>
                    <p className="text-[10px] font-medium text-slate-400 mt-0.5">{selectedData.transformacion?.eje}</p>
                  </div>
                </div>
                <button onClick={closeModal} className="p-1 rounded-lg text-slate-400 hover:bg-slate-200/60 hover:text-slate-600 transition-all">
                  <X size={14} strokeWidth={2} />
                </button>
              </div>

              {/* Cuerpo del Modal - con scroll y padding reducido */}
              <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-white">
                
                {/* Micro KPIs compactos */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-rose-50/50 border border-rose-100/50 p-2.5 rounded-lg flex items-center justify-between">
                    <div>
                      <p className="text-[9px] font-bold text-rose-500 uppercase tracking-wider">Nudos</p>
                      <p className="text-xl font-black text-rose-700">{selectedData.nudos.length}</p>
                    </div>
                    <AlertCircle className="text-rose-400/70" size={18} strokeWidth={1.5} />
                  </div>
                  <div className="bg-emerald-50/50 border border-emerald-100/50 p-2.5 rounded-lg flex items-center justify-between">
                    <div>
                      <p className="text-[9px] font-bold text-emerald-500 uppercase tracking-wider">Proyectos</p>
                      <p className="text-xl font-black text-emerald-700">{selectedData.proyectos.length}</p>
                    </div>
                    <CheckCircle className="text-emerald-400/70" size={18} strokeWidth={1.5} />
                  </div>
                </div>

                {/* Nudos - formato lista compacta */}
                {selectedData.nudos.length > 0 && (
                  <div className="space-y-2">
                    <h4 className="font-bold text-[10px] text-slate-400 uppercase tracking-wider flex items-center gap-1">
                      <AlertCircle size={12} className="text-slate-400" /> Nudos reportados
                    </h4>
                    <div className="space-y-1.5">
                      {selectedData.nudos.map(n => (
                        <div key={n.id} className="flex items-center justify-between p-2.5 bg-white border border-slate-100 rounded-lg gap-2">
                          <div className="space-y-0.5 flex-1">
                            <p className="text-[11px] font-bold text-slate-800 leading-snug">{n.titulo}</p>
                            <div className="flex items-center gap-1.5 text-[10px] text-slate-400">
                              <span className={cn("inline-flex items-center gap-0.5", n.tabla === 'consejo' ? 'text-blue-500' : 'text-emerald-500')}>
                                <Users size={10} /> {n.tabla === 'consejo' ? 'Consejo' : 'Comuna'}
                              </span>
                              <span>•</span>
                              <span className="capitalize font-mono">{n.estado}</span>
                            </div>
                          </div>
                          <span className={cn(
                            "px-2 py-0.5 rounded text-[9px] font-bold uppercase",
                            n.gravedad === 'Alta' ? "bg-rose-50 text-rose-700 border border-rose-100" :
                            n.gravedad === 'Media' ? "bg-amber-50 text-amber-700 border border-amber-100" : "bg-emerald-50 text-emerald-700 border border-emerald-100"
                          )}>
                            {n.gravedad}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Proyectos - lista compacta */}
                {selectedData.proyectos.length > 0 && (
                  <div className="space-y-2">
                    <h4 className="font-bold text-[10px] text-slate-400 uppercase tracking-wider flex items-center gap-1">
                      <Layers size={12} className="text-slate-400" /> Proyectos vinculados
                    </h4>
                    <div className="space-y-1.5">
                      {selectedData.proyectos.map(p => (
                        <div key={p.id} className="p-2.5 bg-white border border-slate-100 rounded-lg space-y-1">
                          <div className="flex items-start justify-between gap-2">
                            <p className="text-[11px] font-bold text-slate-800 leading-snug">{p.nombre}</p>
                            <span className={cn(
                              "px-1.5 py-0.5 rounded text-[9px] font-bold shrink-0",
                              p.estado === 'Finalizado' ? "bg-emerald-50 text-emerald-700" :
                              p.estado === 'Ejecución' ? "bg-blue-50 text-blue-700" : "bg-amber-50 text-amber-700"
                            )}>
                              {p.estado}
                            </span>
                          </div>
                          <p className="text-[10px] text-slate-400 font-mono">
                            Presupuesto: ${p.presupuesto?.toLocaleString() || 'N/A'}
                          </p>
                          
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {selectedData.nudos.length === 0 && selectedData.proyectos.length === 0 && (
                  <div className="text-center py-8 bg-slate-50 rounded-lg border border-dashed border-slate-200">
                    <FileText size={24} className="mx-auto mb-1.5 text-slate-300" />
                    <p className="text-[10px] font-medium text-slate-400">Sin registros para esta transformación</p>
                  </div>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

// ==================== COMPONENTES AUXILIARES ====================
const ResumenCard = ({ icon, label, value, subtext, color }: any) => {
  const colorClasses: Record<string, string> = {
    emerald: "bg-emerald-50 text-emerald-600 border-emerald-100/50",
    blue: "bg-blue-50 text-blue-600 border-blue-100/50",
    amber: "bg-amber-50 text-amber-600 border-amber-100/50"
  };
  return (
    <div className="bg-white p-4 rounded-xl border border-slate-100 shadow-xs hover:shadow-md hover:border-slate-200/80 transition-all">
      <div className="flex items-start justify-between">
        <div className={cn("p-1.5 rounded-lg border", colorClasses[color])}>
          {icon}
        </div>
      </div>
      <div className="mt-2.5">
        <p className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">{label}</p>
        <p className="text-base font-black text-slate-800 tracking-tight mt-0.5">{value}</p>
        <p className="text-[10px] font-medium text-slate-400 mt-0.5 leading-relaxed">{subtext}</p>
      </div>
    </div>
  );
};