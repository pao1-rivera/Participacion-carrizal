'use client';

import React, { useState, useEffect } from 'react';
import {
  Users, Globe, Cpu, Target, Activity, ShieldCheck, CheckCircle2,
  Calendar, ArrowLeft, Clock, XCircle, BarChart3, AlertCircle,
  FileText, Eye, ChevronLeft, ChevronRight, Loader2, File, FileArchive,
  FileSpreadsheet, FileImage, FileCode, MailCheck, Clock as ClockIcon
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/app/lib/utils';
import { supabase } from '@/app/lib/supabaseClient';
import { useAuth } from '@/context/AuthContext';
import { AlertModal } from '@/app/components/AlertModal';

// ==================== TIPOS ====================
interface Direccion {
  name: string;
  director: string;
  directorId: string | null;
  progress: number;
  status: string;
  icon: any;
  color: string;
  kpi: string;
  tableKey: string;
}

interface PlanificacionSemanal {
  id: number;
  dia_semana: string;
  actividad: string;
  responsable: string;
  fecha_ejecucion: string;
  cumplido: boolean | null;
  motivo_incumplimiento: string | null;
  hora: string;
  id_usuario: string | null;
}

interface ObjetivoSemanal {
  id: number;
  semana_inicio: string;
  objetivos: string;
}

interface Reporte {
  id: number;
  nombre: string;
  archivo_url: string;
  tipo_mime: string;
  tamaño: number;
  created_at: string;
  enviado: boolean;
  id_usuario: string | null;
}

const DIRECTOR_CONFIG: Record<string, { name: string; icon: any; color: string; tableKey: string }> = {
  director_comunas: { name: 'Dirección de Comunas', icon: Globe, color: 'bg-indigo-500', tableKey: 'comunas' },
  director_digitalizacion: { name: 'Dirección de Digitalización', icon: Cpu, color: 'bg-blue-500', tableKey: 'digitalizacion' },
  director_adulto_mayor: { name: 'Dirección de Adulto Mayor', icon: Users, color: 'bg-rose-500', tableKey: 'adulto_mayor' },
  director_formacion_planificacion: { name: 'Dirección de Planificación', icon: Target, color: 'bg-emerald-500', tableKey: 'planificacion' }
};

const diasSemana = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo'];
const ROLES_SUPERIORES = ['secretario', 'alcaldesa', 'admin'];

const getMonday = (date: Date): Date => {
  const d = new Date(date);
  const day = d.getDay();
  const diff = (day === 0 ? 6 : day - 1);
  d.setDate(d.getDate() - diff);
  d.setHours(0, 0, 0, 0);
  return d;
};

const formatDate = (date: Date): string => date.toISOString().split('T')[0];
const addWeeks = (date: Date, weeks: number): Date => {
  const result = new Date(date);
  result.setDate(result.getDate() + weeks * 7);
  return result;
};

// ==================== FUNCIÓN PARA OBTENER URL FIRMADA DE REPORTES ====================
const getSignedUrlReporte = async (path: string): Promise<string | null> => {
  if (!path) return null;
  if (path.startsWith('http')) return path;
  try {
    const { data, error } = await supabase.storage
      .from('reportes_direccion')
      .createSignedUrl(path, 3600);
    if (error) {
      console.error('Error al firmar URL del reporte:', error);
      return null;
    }
    return data.signedUrl;
  } catch (err) {
    console.error('Error inesperado:', err);
    return null;
  }
};

// ==================== VISTA DETALLE ====================
const DireccionDetalleVista = ({ direction, onBack }: { direction: Direccion; onBack: () => void }) => {
  const { user: currentUser } = useAuth();
  const [stats, setStats] = useState<any>(null);
  const [planificacion, setPlanificacion] = useState<PlanificacionSemanal[]>([]);
  const [objetivos, setObjetivos] = useState<ObjetivoSemanal[]>([]);
  const [reportes, setReportes] = useState<Reporte[]>([]);
  const [loadingInicial, setLoadingInicial] = useState(true);
  const [loadingAgenda, setLoadingAgenda] = useState(false);
  const [cumplimientoGlobal, setCumplimientoGlobal] = useState(direction.progress);
  const [selectedActividad, setSelectedActividad] = useState<PlanificacionSemanal | null>(null);
  const [errorAcceso, setErrorAcceso] = useState<string | null>(null);
  const [userIds, setUserIds] = useState<string[]>([]);
  const [currentWeekStart, setCurrentWeekStart] = useState<Date>(() => getMonday(new Date()));
  const [modalAlert, setModalAlert] = useState({ open: false, title: '', message: '', type: 'info' as 'info' | 'success' | 'warning' | 'danger' });

  const showAlert = (title: string, message: string, type: 'info'|'success'|'warning'|'danger') => 
    setModalAlert({ open: true, title, message, type });

  const esRolSuperior = currentUser && ROLES_SUPERIORES.includes(currentUser.rolNombre.toLowerCase());
  const esDirectorDeEstaDireccion = () => currentUser?.id === direction.directorId;
  const accesoPermitido = esRolSuperior || esDirectorDeEstaDireccion();

  const goToPreviousWeek = () => setCurrentWeekStart(prev => addWeeks(prev, -1));
  const goToNextWeek = () => setCurrentWeekStart(prev => addWeeks(prev, 1));
  const weekEnd = new Date(currentWeekStart);
  weekEnd.setDate(weekEnd.getDate() + 6);
  const weekRangeText = `${currentWeekStart.toLocaleDateString('es-ES')} - ${weekEnd.toLocaleDateString('es-ES')}`;

  const handleVerReporte = async (url: string) => {
    if (!url) return;
    const signedUrl = await getSignedUrlReporte(url);
    if (signedUrl) {
      window.open(signedUrl, '_blank');
    } else {
      showAlert('Error', 'No se pudo acceder al reporte. Verifica que el archivo exista.', 'danger');
    }
  };

  useEffect(() => {
    if (!accesoPermitido) {
      setLoadingInicial(false);
      setErrorAcceso(`No tienes permisos para ver la ${direction.name}. Solo el director correspondiente o un usuario superior puede acceder.`);
      return;
    }

    const fetchStaticData = async () => {
      setLoadingInicial(true);
      try {
        const rolEsperado = Object.keys(DIRECTOR_CONFIG).find(key => DIRECTOR_CONFIG[key].name === direction.name);
        if (rolEsperado) {
          const { data: rolData } = await supabase.from('rol_usuario').select('id_rol').eq('nombre_rol', rolEsperado).maybeSingle();
          if (rolData) {
            const { data: perfiles } = await supabase.from('perfil_usuario').select('id_usuario').eq('id_rol', rolData.id_rol);
            setUserIds(perfiles?.map(p => p.id_usuario) || []);
          }
        }

        let statsData: any = {};
        switch (direction.tableKey) {
          case 'comunas':
            const { count: totalConsejos } = await supabase.from('datos_consejo_comunal').select('*', { count: 'exact', head: true });
            const { data: validados } = await supabase.from('datos_consejo_comunal').select('estatus_validacion');
            statsData = { totalConsejos, aprobados: validados?.filter(v => v.estatus_validacion === 'APROBADO').length || 0,  rechazados: validados?.filter(v => v.estatus_validacion === 'RECHAZADO').length || 0 };
            break;
          case 'digitalizacion':
            const { count: totalRegistros } = await supabase.from('analfabetismo_digital').select('*', { count: 'exact', head: true });
            const { data: internetData } = await supabase.from('analfabetismo_digital').select('posee_internet, nivel_tecnologico, interes_capacitacion');
            statsData = { totalRegistros, sinInternet: internetData?.filter(i => i.posee_internet?.toLowerCase() === 'no').length || 0, nivelIntermedioAvanzado: internetData?.filter(i => i.nivel_tecnologico?.toLowerCase().startsWith('intermedio') || i.nivel_tecnologico?.toLowerCase().startsWith('avanzado')).length || 0, interesados: internetData?.filter(i => i.interes_capacitacion?.toLowerCase() === 'si').length || 0 };
            break;
          case 'adulto_mayor':
            const { count: totalAdultos } = await supabase.from('adultos_mayores').select('*', { count: 'exact', head: true });
            const { data: generos } = await supabase.from('adultos_mayores').select('genero, convivencia, enfermedad_cronica');
            statsData = { totalAdultos, femenino: generos?.filter(g => g.genero?.toLowerCase() === 'femenino').length || 0, masculino: generos?.filter(g => g.genero?.toLowerCase() === 'masculino').length || 0, vivenSolos: generos?.filter(g => g.convivencia === 'Solo/a').length || 0, conEnfermedad: generos?.filter(g => g.enfermedad_cronica === 'SI').length || 0 };
            break;
          case 'planificacion':
            const { count: totalCursos } = await supabase.from('cursos').select('*', { count: 'exact', head: true });
            const { count: totalParticipantes } = await supabase.from('participantes_curso').select('*', { count: 'exact', head: true });
            const { count: totalFacilitadores } = await supabase.from('facilitadores').select('*', { count: 'exact', head: true });
            statsData = { totalCursos, totalParticipantes, totalFacilitadores };
            break;
        }
        setStats(statsData);
      } catch (err) { console.error(err); } finally { setLoadingInicial(false); }
    };
    fetchStaticData();
  }, [direction, accesoPermitido]);

  useEffect(() => {
    if (!accesoPermitido || userIds.length === 0) return;
    const fetchReportes = async () => {
      try {
        let query = supabase.from('reportes_direccion').select('*').order('created_at', { ascending: false });
        if (esRolSuperior) query = query.in('id_usuario', userIds);
        else query = query.eq('id_usuario', currentUser?.id || '');
        const { data } = await query;
        setReportes(data || []);
      } catch (err) { console.error(err); }
    };
    fetchReportes();
  }, [userIds, esRolSuperior, currentUser, accesoPermitido]);

  useEffect(() => {
    if (!accesoPermitido || userIds.length === 0) return;
    const fetchAgenda = async () => {
      setLoadingAgenda(true);
      try {
        const startDate = formatDate(currentWeekStart);
        const endDate = formatDate(weekEnd);
        let query = supabase.from('planificacion_semanal').select('*').gte('fecha_ejecucion', startDate).lte('fecha_ejecucion', endDate).order('fecha_ejecucion', { ascending: true }).order('hora', { ascending: true });
        if (userIds.length > 0) query = query.in('id_usuario', userIds);
        else { setPlanificacion([]); setObjetivos([]); setLoadingAgenda(false); return; }
        const { data: planData } = await query;
        setPlanificacion(planData || []);
        const cumplidas = (planData || []).filter(p => p.cumplido === true).length;
        setCumplimientoGlobal(planData?.length ? (cumplidas / planData.length) * 100 : 0);
        const { data: objData } = await supabase.from('planificacion_objetivos_semana').select('*').eq('semana_inicio', startDate).maybeSingle();
        setObjetivos(objData ? [objData] : []);
      } catch (err) { console.error(err); } finally { setLoadingAgenda(false); }
    };
    fetchAgenda();
  }, [currentWeekStart, userIds, accesoPermitido]);

  const actividadesPorDia = () => {
    const mapa: Record<string, PlanificacionSemanal[]> = {};
    diasSemana.forEach(dia => mapa[dia.toLowerCase()] = []);
    planificacion.forEach(act => {
      const diaOriginal = act.dia_semana;
      if (!diaOriginal) return;
      const diaNormalizado = diaOriginal.toLowerCase();
      if (mapa[diaNormalizado]) mapa[diaNormalizado].push(act);
      else mapa[diaNormalizado] = [act];
    });
    const resultado: Record<string, PlanificacionSemanal[]> = {};
    diasSemana.forEach(dia => { const clave = dia.toLowerCase(); resultado[dia] = mapa[clave] || []; });
    Object.keys(mapa).forEach(key => { if (!diasSemana.some(d => d.toLowerCase() === key)) resultado[key] = mapa[key]; });
    return resultado;
  };
  const agenda = actividadesPorDia();

  const tarjetasCaracterizacion = () => {
    if (!stats) return [];
    const entries = Object.entries(stats);
    const labels: Record<string, string> = {
      totalConsejos: 'Total Consejos', aprobados: 'Aprobados', pendientes: 'Pendientes', rechazados: 'Rechazados',
      totalRegistros: 'Total Registros', sinInternet: 'Sin Internet', nivelIntermedioAvanzado: 'Nivel Intermedio/Avanzado', interesados: 'Interesados',
      totalAdultos: 'Total Adultos', femenino: 'Femenino', masculino: 'Masculino', vivenSolos: 'Viven Solos', conEnfermedad: 'Enfermedad Crónica',
      totalCursos: 'Cursos', totalParticipantes: 'Participantes', totalFacilitadores: 'Facilitadores'
    };
    return entries.slice(0, 4).map(([key, value]) => ({ titulo: labels[key] || key, valor: value, color: 'text-indigo-600' }));
  };

  if (loadingInicial) return <div className="flex justify-center items-center min-h-[60vh]"><Loader2 className="animate-spin h-12 w-12 text-indigo-500" /></div>;
  if (errorAcceso) return <div className="flex flex-col items-center justify-center min-h-[60vh]"><div className="bg-red-50 p-8 rounded-3xl"><p className="text-red-700">{errorAcceso}</p><button onClick={onBack} className="mt-4 px-6 py-2 bg-slate-800 text-white rounded-xl">Volver</button></div></div>;

  // 🔥 Obtener icono según tipo de archivo
  const getFileIcon = (mimeType: string) => {
    if (!mimeType) return <FileText size={16} />;
    if (mimeType.includes('pdf')) return <FileText size={16} className="text-red-500" />;
    if (mimeType.includes('word') || mimeType.includes('document')) return <FileText size={16} className="text-blue-500" />;
    if (mimeType.includes('excel') || mimeType.includes('sheet')) return <FileSpreadsheet size={16} className="text-emerald-500" />;
    if (mimeType.includes('image')) return <FileImage size={16} className="text-purple-500" />;
    if (mimeType.includes('zip') || mimeType.includes('rar')) return <FileArchive size={16} className="text-amber-500" />;
    if (mimeType.includes('text')) return <FileCode size={16} className="text-slate-500" />;
    return <File size={16} className="text-slate-400" />;
  };

  // 🔥 Formatear fecha de forma legible
  const formatFechaLegible = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('es-ES', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
  };

  // 🔥 Formatear tamaño de archivo
  const formatTamaño = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 20 }} className="space-y-8 pb-12">
      <div className="flex items-center gap-4">
        <button onClick={onBack} className="flex items-center gap-2 px-4 py-2 bg-slate-100 rounded-xl text-xs font-black"><ArrowLeft size={14} /> Volver</button>
        <div className={cn("h-10 w-10 rounded-xl flex items-center justify-center text-white", direction.color)}><direction.icon size={20} /></div>
        <div><h1 className="text-2xl font-black italic">{direction.name}</h1><p className="text-xs text-slate-500">Titular: {direction.director}</p></div>
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-1">
          <h2 className="text-sm font-black uppercase tracking-wider text-slate-500 mb-4"><BarChart3 size={16} className="inline mr-2" /> Caracterización</h2>
          <div className="grid grid-cols-2 gap-4">
            {tarjetasCaracterizacion().map((item, idx) => (
              <div key={idx} className="bg-white p-5 rounded-2xl border border-slate-100">
                <p className="text-[10px] font-black uppercase text-slate-400">{item.titulo}</p>
                <p className="text-xl font-black italic text-slate-800">{item.valor}</p>
              </div>
            ))}
          </div>
          <div className="mt-4 p-3 bg-slate-100 rounded-xl text-center">Cumplimiento General: {Math.round(cumplimientoGlobal)}%</div>
          <div className="mt-4 p-3 bg-slate-100 rounded-xl text-center">Actividades: {planificacion.length}</div>
        </div>
        <div className="lg:col-span-2">
          <h2 className="text-sm font-black uppercase tracking-wider text-slate-500 mb-4"><Calendar size={16} className="inline mr-2" /> Agenda Semanal</h2>
          <div className="flex items-center justify-between bg-white py-2 px-3 rounded-xl border mb-5">
            <button onClick={goToPreviousWeek} className="p-1.5 rounded-lg bg-slate-100"><ChevronLeft size={16} /></button>
            <div className="flex items-center gap-1.5"><Calendar size={14} className="text-brand-primary" /><span className="text-xs font-black">{weekRangeText}</span></div>
            <button onClick={goToNextWeek} className="p-1.5 rounded-lg bg-slate-100"><ChevronRight size={16} /></button>
          </div>
          {loadingAgenda ? <div className="bg-slate-50 rounded-2xl p-12 text-center"><Loader2 className="animate-spin h-8 w-8 text-indigo-500 mx-auto" /></div> : planificacion.length === 0 ? <div className="bg-slate-50 rounded-2xl p-8 text-center"><AlertCircle className="mx-auto h-8 w-8 text-slate-400 mb-2" /><p>No hay actividades</p></div> : (
            <div className="grid grid-cols-1 md:grid-cols-7 gap-3">
              {diasSemana.map(dia => {
                const actividades = agenda[dia] || [];
                return (
                  <div key={dia} className="bg-slate-50 rounded-2xl overflow-hidden border border-slate-100">
                    <div className={cn("p-2 text-center font-black text-xs uppercase text-white", direction.color)}>{dia}</div>
                    <div className="p-2 space-y-2 max-h-96 overflow-y-auto">
                      {actividades.length === 0 ? <p className="text-[10px] text-slate-400 text-center py-4">Sin actividades</p> :
                        actividades.map(act => (
                          <div key={act.id} onClick={() => setSelectedActividad(act)} className="bg-white rounded-xl p-2 shadow-sm border-l-4 border-l-indigo-300 cursor-pointer">
                            <div className="flex items-center gap-1 text-[10px] font-mono"><Clock size={10} /> {act.hora?.slice(0,5)}</div>
                            <p className="text-xs font-semibold mt-1">{act.actividad}</p>
                            <div className="flex justify-between mt-1"><span className="text-[9px] text-slate-400">{act.responsable}</span>{act.cumplido === true ? <CheckCircle2 size={12} className="text-emerald-500" /> : act.cumplido === false ? <XCircle size={12} className="text-rose-400" /> : <AlertCircle size={12} className="text-amber-400" />}</div>
                          </div>
                        ))}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
      {objetivos.length > 0 && <div className="bg-indigo-50/30 rounded-3xl p-6"><h3 className="text-sm font-black uppercase tracking-wider flex items-center gap-2"><Target size={16} /> Objetivos de la Semana</h3>{objetivos.map(obj => <div key={obj.id} className="bg-white p-4 rounded-xl mt-2"><p className="text-xs font-bold text-indigo-700">Semana del {new Date(obj.semana_inicio).toLocaleDateString()}</p><p className="text-sm">{obj.objetivos}</p></div>)}</div>}
      
      {/* 🔥 SECCIÓN REPORTES ENVIADOS (REDISEÑADA) */}
      <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100 bg-gradient-to-r from-slate-50 to-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <FileText size={18} className="text-brand-primary" />
            <h3 className="text-sm font-black uppercase tracking-tight">Reportes Enviados</h3>
            <span className="text-[10px] font-bold bg-slate-200 text-slate-600 px-2 py-0.5 rounded-full">{reportes.length}</span>
          </div>
          <div className="flex items-center gap-1 text-[9px] text-slate-400">
            <MailCheck size={14} /> 
            <span>{reportes.filter(r => r.enviado).length} enviados</span>
          </div>
        </div>
        <div className="p-4">
          {reportes.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8 text-slate-400">
              <FileText size={32} className="mb-2 opacity-30" />
              <p className="text-xs font-medium">No hay reportes subidos aún</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {reportes.map(rep => {
                const icono = getFileIcon(rep.tipo_mime);
                const colorFondo = rep.enviado ? 'bg-emerald-50 border-emerald-100' : 'bg-amber-50 border-amber-100';
                const estadoTexto = rep.enviado ? 'Enviado' : 'Pendiente';
                const estadoColor = rep.enviado ? 'text-emerald-600' : 'text-amber-600';
                const estadoIcon = rep.enviado ? <CheckCircle2 size={14} className="text-emerald-500" /> : <ClockIcon size={14} className="text-amber-500" />;
                return (
                  <div key={rep.id} className={cn("flex items-center gap-3 p-3 rounded-xl border transition-all hover:shadow-sm", colorFondo)}>
                    <div className="w-10 h-10 rounded-xl bg-white border border-slate-200 flex items-center justify-center shadow-sm">
                      {icono}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5">
                        <p className="text-xs font-bold truncate" title={rep.nombre}>{rep.nombre}</p>
                        <span className={cn("text-[8px] font-black uppercase flex items-center gap-0.5", estadoColor)}>
                          {estadoIcon} {estadoTexto}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 mt-0.5 text-[9px] text-slate-400">
                        <span>{formatFechaLegible(rep.created_at)}</span>
                        <span className="w-1 h-1 rounded-full bg-slate-300" />
                        <span>{formatTamaño(rep.tamaño)}</span>
                      </div>
                    </div>
                    <button 
                      onClick={() => handleVerReporte(rep.archivo_url)}
                      className="p-2 rounded-lg bg-white border border-slate-200 text-slate-500 hover:text-brand-primary hover:border-brand-primary/30 transition-all"
                      title="Ver reporte"
                    >
                      <Eye size={16} />
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      <AnimatePresence>{selectedActividad && <ModalDetalle actividad={selectedActividad} direction={direction} onClose={() => setSelectedActividad(null)} />}</AnimatePresence>
      <AlertModal
        isOpen={modalAlert.open}
        onClose={() => setModalAlert(prev => ({ ...prev, open: false }))}
        title={modalAlert.title}
        message={modalAlert.message}
        type={modalAlert.type}
        confirmText="Aceptar"
      />
    </motion.div>
  );
};

const ModalDetalle = ({ actividad, direction, onClose }: any) => (
  <div className="fixed inset-0 z-100 flex items-center justify-center p-4">
    <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={onClose} />
    <motion.div initial={{ scale: 0.9 }} animate={{ scale: 1 }} exit={{ scale: 0.9 }} className="relative w-full max-w-lg bg-white rounded-3xl overflow-hidden">
      <div className={cn("p-4 text-white", direction.color)}>
        <div className="flex justify-between">
          <h4 className="text-base font-black">Detalle de Actividad</h4>
          <button onClick={onClose}><XCircle size={20} /></button>
        </div>
      </div>
      <div className="p-6 space-y-4">
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-slate-50 p-3 rounded-xl"><p className="text-[9px] font-black uppercase">Actividad</p><p className="text-sm font-bold">{actividad.actividad}</p></div>
          <div className="bg-slate-50 p-3 rounded-xl"><p className="text-[9px] font-black uppercase">Día / Fecha</p><p className="text-sm font-bold">{actividad.dia_semana} - {new Date(actividad.fecha_ejecucion).toLocaleDateString()}</p></div>
          <div className="bg-slate-50 p-3 rounded-xl"><p className="text-[9px] font-black uppercase">Hora</p><p className="text-sm font-bold">{actividad.hora?.slice(0,5)}</p></div>
          <div className="bg-slate-50 p-3 rounded-xl"><p className="text-[9px] font-black uppercase">Responsable</p><p className="text-sm font-bold">{actividad.responsable}</p></div>
          <div className="bg-slate-50 p-3 rounded-xl col-span-2"><p className="text-[9px] font-black uppercase">Estado</p><div className="flex items-center gap-2 mt-1">{actividad.cumplido === true ? <><CheckCircle2 size={16} className="text-emerald-500" /><span>Completada</span></> : actividad.cumplido === false ? <><XCircle size={16} className="text-rose-500" /><span>No cumplida</span></> : <><AlertCircle size={16} className="text-amber-500" /><span>Pendiente</span></>}</div></div>
          {actividad.motivo_incumplimiento && <div className="bg-rose-50 p-3 rounded-xl col-span-2"><p className="text-[9px] font-black text-rose-600 uppercase">Motivo</p><p className="text-xs">{actividad.motivo_incumplimiento}</p></div>}
        </div>
      </div>
    </motion.div>
  </div>
);

// ==================== COMPONENTE PRINCIPAL ====================
export const SupervisionDirectores = () => {
  const [vistaActual, setVistaActual] = useState<'lista' | 'detalle'>('lista');
  const [direccionSeleccionada, setDireccionSeleccionada] = useState<Direccion | null>(null);
  const [direcciones, setDirecciones] = useState<Direccion[]>([]);
  const [cargando, setCargando] = useState(true);
  const [solicitandoReporte, setSolicitandoReporte] = useState(false);
  const [modalReporte, setModalReporte] = useState({ open: false, title: '', message: '', type: 'info' as 'info' | 'success' | 'warning' | 'danger' });

  const showAlert = (title: string, message: string, type: 'info'|'success'|'warning'|'danger') => 
    setModalReporte({ open: true, title, message, type });

  useEffect(() => {
    const cargarDirectores = async () => {
      setCargando(true);
      try {
        const rolesNombres = Object.keys(DIRECTOR_CONFIG);
        const { data: rolesData } = await supabase.from('rol_usuario').select('id_rol, nombre_rol').in('nombre_rol', rolesNombres);
        if (!rolesData) return;
        const direccionesTemp: Direccion[] = [];
        for (const rol of rolesData) {
          const config = DIRECTOR_CONFIG[rol.nombre_rol];
          if (!config) continue;
          const { data: perfiles } = await supabase.from('perfil_usuario').select('id_usuario, nombre, apellido').eq('id_rol', rol.id_rol);
          if (!perfiles || perfiles.length === 0) continue;
          const director = perfiles[0];
          const nombreCompleto = `${director.nombre} ${director.apellido}`;
          const { data: tareas } = await supabase.from('planificacion_semanal').select('cumplido').eq('id_usuario', director.id_usuario);
          const total = tareas?.length || 0;
          const completadas = tareas?.filter(t => t.cumplido === true).length || 0;
          const progreso = total > 0 ? (completadas / total) * 100 : 0;
          let status = 'En Ejecución';
          if (progreso >= 80) status = 'Excelente';
          else if (progreso <= 30) status = 'Crítico';
          else status = 'Operativo';
          direccionesTemp.push({ name: config.name, director: nombreCompleto, directorId: director.id_usuario, progress: Math.round(progreso), status, icon: config.icon, color: config.color, kpi: `${total - completadas} tareas pendientes`, tableKey: config.tableKey });
        }
        setDirecciones(direccionesTemp);
      } catch (err) { console.error(err); } finally { setCargando(false); }
    };
    cargarDirectores();
  }, []);

  const solicitarReporteATodos = async () => {
    if (direcciones.length === 0) return;
    setSolicitandoReporte(true);
    try {
      const { data: { user: currentUser } } = await supabase.auth.getUser();
      if (!currentUser) throw new Error('No autenticado');
      const solicitudes = direcciones.map(d => ({ id_usuario: d.directorId, solicitado_por: currentUser.id, estado: 'pendiente' }));
      const { error } = await supabase.from('solicitudes_reportes').insert(solicitudes);
      if (error) throw error;
      showAlert('Solicitud enviada', 'Se ha solicitado a todos los directores que envíen los reportes semanales.', 'success');
    } catch (err) {
      console.error(err);
      showAlert('Error', 'No se pudo enviar la solicitud', 'danger');
    } finally {
      setSolicitandoReporte(false);
    }
  };

  const abrirDetalle = (dir: Direccion) => { setDireccionSeleccionada(dir); setVistaActual('detalle'); };
  const cerrarDetalle = () => { setVistaActual('lista'); setDireccionSeleccionada(null); };

  if (cargando) return <div className="flex justify-center items-center min-h-[60vh]"><Loader2 className="animate-spin h-12 w-12 text-indigo-500" /></div>;
  if (vistaActual === 'detalle' && direccionSeleccionada) return <DireccionDetalleVista direction={direccionSeleccionada} onBack={cerrarDetalle} />;

  return (
    <>
      <motion.div initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} className="space-y-8 pb-12">
        <div className="flex items-center justify-between">
          <div><h2 className="text-xl font-black uppercase italic">Supervisión de Direcciones</h2><p className="text-[10px] text-slate-500 font-bold uppercase mt-1">Control de Metas y Desempeño Operativo</p></div>
          <button onClick={solicitarReporteATodos} disabled={solicitandoReporte} className="flex items-center gap-2 px-6 py-2.5 bg-brand-primary text-white rounded-xl text-[10px] font-black uppercase tracking-widest shadow-xl hover:bg-brand-primary/80 transition-all">
            {solicitandoReporte && <Loader2 className="animate-spin h-3 w-3" />}
            Solicitar Reporte Semanal
          </button>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {direcciones.map((dir, i) => (
            <div key={i} onClick={() => abrirDetalle(dir)} className="bg-white p-8 rounded-[40px] border border-slate-100 shadow-sm group hover:border-brand-primary/20 transition-all cursor-pointer">
              <div className="flex justify-between items-start mb-8">
                <div className="flex items-center gap-5">
                  <div className={cn("w-14 h-14 rounded-2xl flex items-center justify-center text-white shadow-lg transition-transform group-hover:scale-110", dir.color)}><dir.icon size={28} /></div>
                  <div><h3 className="text-sm font-black uppercase italic tracking-tighter">{dir.name}</h3><p className="text-[10px] text-slate-400 font-bold uppercase mt-1">Titular: {dir.director}</p></div>
                </div>
                <div className={cn("px-3 py-1 rounded-full text-[8px] font-black uppercase tracking-widest border", dir.status === 'Crítico' ? 'bg-red-50 text-red-600 border-red-100' : dir.status === 'Excelente' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 'bg-blue-50 text-blue-600 border-blue-100')}>{dir.status}</div>
              </div>
              <div className="space-y-6">
                <div><div className="flex justify-between items-end mb-2"><span className="text-[10px] font-black text-slate-400 uppercase tracking-[0.1em]">Cumplimiento de Metas</span><span className="text-sm font-black italic">{dir.progress}%</span></div><div className="h-2 w-full bg-slate-50 rounded-full overflow-hidden"><motion.div initial={{ width: 0 }} animate={{ width: `${dir.progress}%` }} className={cn("h-full rounded-full transition-all duration-1000", dir.color)} /></div></div>
                <div className="grid grid-cols-2 gap-4"><div className="p-4 bg-slate-50 border border-slate-100 rounded-2xl"><p className="text-xs font-black italic">{dir.kpi}</p></div><div className="p-4 bg-slate-50 border border-slate-100 rounded-2xl flex items-center justify-between"><CheckCircle2 size={16} className="text-emerald-500" /></div></div>
              </div>
            </div>
          ))}
        </div>
      </motion.div>
      <AlertModal isOpen={modalReporte.open} onClose={() => setModalReporte(prev => ({ ...prev, open: false }))} title={modalReporte.title} message={modalReporte.message} type={modalReporte.type} confirmText="Aceptar" />
    </>
  );
};