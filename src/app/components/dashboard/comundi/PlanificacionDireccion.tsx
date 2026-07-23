'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Calendar, CheckCircle2, XCircle, FileText, PlusCircle, 
  Loader2, ChevronLeft, ChevronRight, AlertCircle, 
  Edit, Trash2, Clock, Save, X, History, Eye, Upload, Download, Trash, Send
} from 'lucide-react';
import { cn } from '@/app/lib/utils';
import { supabase } from '@/app/lib/supabaseClient';
import { useAuth } from '@/context/AuthContext';
import { AlertModal } from '@/app/components/AlertModal';

// ==================== TIPOS ====================
interface ActividadSemanal {
  id: number;
  dia_semana: string;
  actividad: string;
  responsable: string;
  fecha_ejecucion: string;
  hora: string;
  cumplido: boolean | null;
  motivo_incumplimiento: string | null;
  id_usuario: string;
}

interface SemanaResumen {
  semanaInicio: Date;
  fechaInicioStr: string;
  fechaFinStr: string;
  totalActividades: number;
  cumplidas: number;
  noCumplidas: number;
  pendientes: number;
}

interface Reporte {
  id: number;
  nombre: string;
  archivo_url: string;
  tipo_mime: string;
  tamaño: number;
  created_at: string;
  id_usuario: string;
  enviado?: boolean;
}

// ==================== COMPONENTES UI ====================
const TabButton = ({ active, onClick, icon: Icon, label }: any) => (
  <button
    onClick={onClick}
    className={cn(
      "flex items-center gap-2 px-4 py-2 rounded-lg text-[10px] font-black uppercase tracking-wider transition-all",
      active ? "bg-white text-brand-primary shadow-sm" : "text-slate-500 hover:text-slate-800"
    )}
  >
    <Icon size={14} />
    {label}
  </button>
);

// Componente para la agenda semanal (matriz días x horas)
const AgendaSemanal = ({ 
  actividades,
  objetivosSemana,
  onGuardarObjetivos,
  onMarcarCumplimiento,
  onEditar,
  onEliminar,
  semanaInicio,
  onCambiarSemana,
  soloLectura = false
}: { 
  actividades: ActividadSemanal[];
  objetivosSemana: string;
  onGuardarObjetivos: (texto: string) => void;
  onMarcarCumplimiento: (act: ActividadSemanal, nuevoEstado: boolean, motivo?: string) => void;
  onEditar: (act: ActividadSemanal) => void;
  onEliminar: (id: number) => void;
  semanaInicio: Date;
  onCambiarSemana: (direccion: 'prev' | 'next') => void;
  soloLectura?: boolean;
}) => {
  // DÍAS CON ACENTOS, tal como los espera la BD (en minúscula)
  const dias = ['lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado', 'domingo'];
  // Etiquetas para mostrar al usuario (con mayúscula inicial)
  const diasLabels = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo'];
  const horas = Array.from({ length: 15 }, (_, i) => {
    const h = 7 + i;
    return `${h.toString().padStart(2, '0')}:00`;
  });

  const getRangoSemana = (inicio: Date): string => {
    const fin = new Date(inicio);
    fin.setDate(fin.getDate() + 6);
    const formatDate = (d: Date) => d.toLocaleDateString('es-ES', { day: 'numeric', month: 'numeric', year: 'numeric' });
    return `${formatDate(inicio)} - ${formatDate(fin)}`;
  };
  const rangoSemana = getRangoSemana(semanaInicio);

  const actividadesMap = new Map<string, ActividadSemanal>();
  actividades.forEach(act => {
    const horaStr = (act.hora || '09:00').substring(0,5);
    const key = `${act.dia_semana}|${horaStr}`;
    actividadesMap.set(key, act);
  });

  const getActividadStatus = (act: ActividadSemanal | undefined) => {
    if (!act) return { color: 'bg-white', border: 'border-slate-100', textColor: 'text-slate-400', icon: null, disabled: false };
    if (act.cumplido === true) {
      return { color: 'bg-green-50', border: 'border-green-200', textColor: 'text-green-700', icon: <CheckCircle2 size={12} className="text-green-600" />, disabled: false };
    }
    if (act.cumplido === false) {
      return { color: 'bg-red-50', border: 'border-red-200', textColor: 'text-red-700', icon: <XCircle size={12} className="text-red-600" />, disabled: true };
    }
    const ahora = new Date();
    const [year, month, day] = act.fecha_ejecucion.split('-').map(Number);
    const [hour, minute] = act.hora.split(':').map(Number);
    const fechaAct = new Date(year, month-1, day, hour, minute);
    if (fechaAct < ahora) {
      return { color: 'bg-amber-50', border: 'border-amber-200', textColor: 'text-amber-700', icon: <AlertCircle size={12} className="text-amber-600" />, disabled: false };
    }
    return { color: 'bg-white', border: 'border-slate-100', textColor: 'text-slate-600', icon: null, disabled: false };
  };

  const [editandoObjetivos, setEditandoObjetivos] = useState(false);
  const [objetivosTemp, setObjetivosTemp] = useState(objetivosSemana);

  const handleGuardarObjetivos = () => {
    onGuardarObjetivos(objetivosTemp);
    setEditandoObjetivos(false);
  };

  return (
    <div className="overflow-x-auto">
      <div className="min-w-250">
        <table className="w-full border-collapse">
          <thead>
            <tr>
              <th colSpan={10} className="p-2 bg-brand-primary/5 text-brand-primary text-[10px] font-black uppercase tracking-wider text-center">
                <div className="flex items-center justify-center gap-3">
                  <button 
                    onClick={() => onCambiarSemana('prev')}
                    className="p-1 rounded hover:bg-brand-primary/10 transition-colors"
                    title="Semana anterior"
                  >
                    <ChevronLeft size={14} />
                  </button>
                  <span>Semana del {rangoSemana}</span>
                  <button 
                    onClick={() => onCambiarSemana('next')}
                    className="p-1 rounded hover:bg-brand-primary/10 transition-colors"
                    title="Semana siguiente"
                  >
                    <ChevronRight size={14} />
                  </button>
                </div>
              </th>
            </tr>
            <tr>
              <th className="p-2 bg-slate-100 border border-slate-200 text-[9px] font-black text-slate-500 uppercase">Hora</th>
              {diasLabels.map(dia => (
                <th key={dia} className="p-2 bg-slate-100 border border-slate-200 text-[9px] font-black text-slate-500 uppercase">{dia}</th>
              ))}
              <th className="p-2 bg-brand-primary/20 border border-brand-primary/30 text-[9px] font-black text-brand-primary uppercase w-64">Objetivos de la semana</th>
            </tr>
          </thead>
          <tbody>
            {horas.map(hora => (
              <tr key={hora}>
                <td className="p-2 bg-slate-50 border border-slate-200 text-[10px] font-bold text-slate-500 text-center">{hora}</td>
                {dias.map(dia => {
                  const key = `${dia}|${hora}`;
                  const act = actividadesMap.get(key);
                  const status = getActividadStatus(act);
                  return (
                    <td key={dia} className={cn("p-1 border border-slate-200 align-top", status.color)}>
                      {act ? (
                        <div className={cn("p-1 rounded-md text-[9px] font-medium", status.border, status.textColor)}>
                          <div className="flex justify-between items-start gap-1">
                            <div className="flex-1">
                              <p className="font-black truncate">{act.actividad}</p>
                              <p className="text-[8px] truncate">Resp: {act.responsable}</p>
                              {act.motivo_incumplimiento && (
                                <div className="mt-1 text-[7px] text-amber-600 bg-amber-100 rounded p-0.5 truncate">📌 {act.motivo_incumplimiento}</div>
                              )}
                            </div>
                            {!soloLectura && (
                              <div className="flex flex-col gap-0.5 shrink-0">
                                <button
                                  onClick={() => {
                                    if (act.cumplido === true) {
                                      onMarcarCumplimiento(act, false, '');
                                    } else if (act.cumplido === false) {
                                      return;
                                    } else {
                                      onMarcarCumplimiento(act, true, undefined);
                                    }
                                  }}
                                  disabled={status.disabled}
                                  className="p-0.5 rounded hover:bg-white/50 disabled:opacity-50 disabled:cursor-not-allowed"
                                  title={act.cumplido === true ? "Marcar como no cumplido" : act.cumplido === false ? "No se puede cambiar a cumplido" : "Marcar como cumplido"}
                                >
                                  {status.icon || <CheckCircle2 size={10} className="text-slate-400" />}
                                </button>
                                {act.cumplido !== false && (
                                  <button onClick={() => onEditar(act)} className="p-0.5 rounded hover:bg-white/50 text-indigo-500" title="Editar">
                                    <Edit size={10} />
                                  </button>
                                )}
                                <button onClick={() => onEliminar(act.id)} className="p-0.5 rounded hover:bg-white/50 text-rose-500" title="Eliminar">
                                  <Trash2 size={10} />
                                </button>
                              </div>
                            )}
                            {soloLectura && (
                              <div className="flex flex-col gap-0.5 shrink-0">
                                <div className="p-0.5">
                                  {status.icon || <CheckCircle2 size={10} className="text-slate-400" />}
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                      ) : (
                        <div className="h-12 flex items-center justify-center text-[8px] text-slate-300">—</div>
                      )}
                    </td>
                  );
                })}
                {hora === '07:00' && (
                  <td rowSpan={horas.length} className="bg-brand-primary/5 border border-brand-primary/20 align-top p-2">
                    {!soloLectura && editandoObjetivos ? (
                      <div className="space-y-2">
                        <textarea
                          value={objetivosTemp}
                          onChange={(e) => setObjetivosTemp(e.target.value)}
                          rows={12}
                          className="w-full p-2 text-[10px] rounded-lg border border-brand-primary/30 focus:ring-1 focus:ring-brand-primary"
                          placeholder="Objetivos estratégicos de la semana..."
                        />
                        <div className="flex gap-1">
                          <button onClick={handleGuardarObjetivos} className="p-1 bg-brand-primary text-white rounded text-[9px] flex items-center gap-1"><Save size={10} /> Guardar</button>
                          <button onClick={() => { setEditandoObjetivos(false); setObjetivosTemp(objetivosSemana); }} className="p-1 bg-gray-200 rounded text-[9px]"><X size={10} /> Cancelar</button>
                        </div>
                      </div>
                    ) : (
                      <div className="min-h-75">
                        <div className="flex justify-between items-center mb-2">
                          <span className="text-[9px] font-black text-brand-primary uppercase">Objetivos semanales</span>
                          {!soloLectura && (
                            <button onClick={() => setEditandoObjetivos(true)} className="p-1 hover:bg-brand-primary/10 rounded"><Edit size={12} className="text-brand-primary" /></button>
                          )}
                        </div>
                        <div className="text-[10px] text-slate-700 whitespace-pre-wrap">
                          {objetivosSemana || (soloLectura ? 'No hay objetivos registrados.' : 'Haz clic en editar para agregar los objetivos de esta semana.')}
                        </div>
                      </div>
                    )}
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

// Componente para el listado de semanas anteriores
const HistorialSemanas = ({ semanas, onSelectSemana, onVolver }: { semanas: SemanaResumen[]; onSelectSemana: (semanaInicio: Date) => void; onVolver: () => void }) => {
  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <button onClick={onVolver} className="flex items-center gap-1 text-[10px] font-black text-brand-primary bg-brand-primary/10 px-3 py-1.5 rounded-full">
          <ChevronLeft size={12} /> Volver a semana actual
        </button>
        <h3 className="text-sm font-black text-slate-700 uppercase tracking-tight">Historial de semanas</h3>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {semanas.map((semana, idx) => (
          <div
            key={idx}
            onClick={() => onSelectSemana(semana.semanaInicio)}
            className="bg-white rounded-2xl border border-slate-100 shadow-sm p-4 hover:shadow-md hover:border-brand-primary/50 transition-all cursor-pointer"
          >
            <div className="flex justify-between items-start mb-2">
              <div className="flex items-center gap-2">
                <Calendar size={16} className="text-brand-primary" />
                <span className="text-[11px] font-black text-slate-700">{semana.fechaInicioStr} al {semana.fechaFinStr}</span>
              </div>
              <Eye size={14} className="text-slate-400" />
            </div>
            <div className="grid grid-cols-4 gap-2 mt-3">
              <div className="text-center">
                <p className="text-[8px] font-black text-slate-400 uppercase">Total</p>
                <p className="text-sm font-black text-slate-800">{semana.totalActividades}</p>
              </div>
              <div className="text-center">
                <p className="text-[8px] font-black text-slate-400 uppercase">Cumplidas</p>
                <p className="text-sm font-black text-green-600">{semana.cumplidas}</p>
              </div>
              <div className="text-center">
                <p className="text-[8px] font-black text-slate-400 uppercase">No cumpl.</p>
                <p className="text-sm font-black text-red-600">{semana.noCumplidas}</p>
              </div>
              <div className="text-center">
                <p className="text-[8px] font-black text-slate-400 uppercase">Pendientes</p>
                <p className="text-sm font-black text-amber-600">{semana.pendientes}</p>
              </div>
            </div>
          </div>
        ))}
        {semanas.length === 0 && (
          <div className="col-span-2 text-center py-8 text-slate-400">No hay semanas anteriores registradas.</div>
        )}
      </div>
    </div>
  );
};

// ==================== COMPONENTE PRINCIPAL ====================
export const PlanificacionDireccion = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<'semanal' | 'reportes'>('semanal');
  
  // Estados planificación semanal
  const [actividades, setActividades] = useState<ActividadSemanal[]>([]);
  const [loadingSemanal, setLoadingSemanal] = useState(true);
  const [showModalSemanal, setShowModalSemanal] = useState(false);
  const [editandoActividad, setEditandoActividad] = useState<ActividadSemanal | null>(null);
  const [semanaInicio, setSemanaInicio] = useState<Date>(() => {
    const fecha = new Date();
    const dia = fecha.getDay();
    const diff = fecha.getDate() - dia + (dia === 0 ? -6 : 1);
    return new Date(fecha.setDate(diff));
  });
  const [formSemanal, setFormSemanal] = useState({
    dia_semana: '',
    actividad: '',
    responsable: '',
    fecha_ejecucion: new Date().toISOString().split('T')[0],
    hora: '09:00'
  });
  const [saving, setSaving] = useState(false);
  const [motivoModal, setMotivoModal] = useState<{ id: number; motivo: string } | null>(null);
  const [objetivosSemana, setObjetivosSemana] = useState<string>('');
  const [loadingObjetivos, setLoadingObjetivos] = useState(false);
  const [mostrarHistorial, setMostrarHistorial] = useState(false);
  const [semanasHistorial, setSemanasHistorial] = useState<SemanaResumen[]>([]);
  const [loadingHistorial, setLoadingHistorial] = useState(false);
  const [semanaSeleccionada, setSemanaSeleccionada] = useState<Date | null>(null);
  const [actividadesSemanaSeleccionada, setActividadesSemanaSeleccionada] = useState<ActividadSemanal[]>([]);
  const [objetivosSemanaSeleccionada, setObjetivosSemanaSeleccionada] = useState<string>('');
  const [loadingSemanaSeleccionada, setLoadingSemanaSeleccionada] = useState(false);

  // Reportes
  const [reportes, setReportes] = useState<Reporte[]>([]);
  const [loadingReportes, setLoadingReportes] = useState(false);
  const [subiendo, setSubiendo] = useState(false);

  // Alert Modal
  const [modalState, setModalState] = useState({
    isOpen: false,
    title: '',
    message: '',
    type: 'info' as 'info' | 'success' | 'warning' | 'danger',
    showInput: false,
    inputPlaceholder: '',
    onConfirm: null as ((value?: string) => void) | null,
    cancelText: 'Cancelar',
    confirmText: 'Aceptar',
  });

  const showAlert = (title: string, message: string, type?: 'info'|'success'|'warning'|'danger') => {
    setModalState({
      ...modalState,
      isOpen: true,
      title,
      message,
      type: type || 'info',
      showInput: false,
      onConfirm: null,
    });
  };

  const closeModal = () => setModalState(prev => ({ ...prev, isOpen: false }));

  // ========== FUNCIÓN CORREGIDA: Devuelve el día con acentos (tal como lo espera la BD) ==========
  const obtenerDiaSemanaDesdeFecha = (fechaStr: string): string => {
    const [year, month, day] = fechaStr.split('-').map(Number);
    const fechaLocal = new Date(year, month - 1, day);
    const numeroDia = fechaLocal.getDay(); // 0 domingo, 1 lunes, ..., 6 sábado
    const diasMap = ['domingo', 'lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado'];
    return diasMap[numeroDia];
  };

  const actualizarDiaDesdeFecha = (fecha: string) => {
    if (fecha) {
      const diaCalculado = obtenerDiaSemanaDesdeFecha(fecha);
      setFormSemanal(prev => ({ ...prev, dia_semana: diaCalculado }));
    }
  };

  const esFechaPasada = (fechaStr: string): boolean => {
    const hoy = new Date();
    hoy.setHours(0, 0, 0, 0);
    const fecha = new Date(fechaStr);
    fecha.setHours(0, 0, 0, 0);
    return fecha < hoy;
  };
  // Estado para solicitud pendiente
const [solicitudPendiente, setSolicitudPendiente] = useState<any>(null);
const [cargandoSolicitud, setCargandoSolicitud] = useState(false);

useEffect(() => {
  const verificarSolicitud = async () => {
    if (!user?.id) return;
    setCargandoSolicitud(true);
    const { data, error } = await supabase
      .from('solicitudes_reportes')
      .select('id, solicitado_por, fecha_solicitud')
      .eq('id_usuario', user.id)
      .eq('estado', 'pendiente')
      .maybeSingle();
    if (!error && data) {
      setSolicitudPendiente({ id: data.id, solicitado_por: data.solicitado_por, fecha: data.fecha_solicitud });
    } else {
      setSolicitudPendiente(null);
    }
    setCargandoSolicitud(false);
  };
  verificarSolicitud();
}, [user]);

  const cambiarSemana = (direccion: 'prev' | 'next') => {
    const nuevaSemana = new Date(semanaInicio);
    nuevaSemana.setDate(nuevaSemana.getDate() + (direccion === 'next' ? 7 : -7));
    setSemanaInicio(nuevaSemana);
    setSemanaSeleccionada(null);
    setMostrarHistorial(false);
  };

  useEffect(() => {
    if (showModalSemanal || motivoModal || modalState.isOpen) {
      document.body.classList.add('modal-open');
    } else {
      document.body.classList.remove('modal-open');
    }
  }, [showModalSemanal, motivoModal, modalState.isOpen]);

  const getFechaFinSemana = (inicio: Date): Date => {
    const fin = new Date(inicio);
    fin.setDate(fin.getDate() + 6);
    return fin;
  };

  // ========== PLANIFICACIÓN SEMANAL (con filtro) ==========
  const fetchActividades = async (filtroFecha: Date) => {
    if (!user?.id) return;
    setLoadingSemanal(true);
    const fechaInicio = filtroFecha.toISOString().split('T')[0];
    const fechaFin = getFechaFinSemana(filtroFecha).toISOString().split('T')[0];
    
    const { data, error } = await supabase
      .from('planificacion_semanal')
      .select('*')
      .eq('id_usuario', user.id)
      .gte('fecha_ejecucion', fechaInicio)
      .lte('fecha_ejecucion', fechaFin)
      .order('fecha_ejecucion', { ascending: true });
    
    if (error) {
      console.error(error);
      showAlert('Error', 'No se pudieron cargar las actividades', 'danger');
      setActividades([]);
    } else {
      const actividadesConHora = (data || []).map(act => ({
        ...act,
        hora: act.hora || '09:00:00'
      }));
      setActividades(actividadesConHora);
    }
    setLoadingSemanal(false);
  };

  const fetchObjetivosSemana = async (inicio: Date, paraSemanaSeleccionada = false) => {
    if (!user?.id) return;
    setLoadingObjetivos(true);
    const inicioStr = inicio.toISOString().split('T')[0];
    const { data, error } = await supabase
      .from('planificacion_objetivos_semana')
      .select('objetivos')
      .eq('id_usuario', user.id)
      .eq('semana_inicio', inicioStr)
      .maybeSingle();
    const objetivos = (!error && data) ? (data.objetivos || '') : '';
    if (paraSemanaSeleccionada) {
      setObjetivosSemanaSeleccionada(objetivos);
    } else {
      setObjetivosSemana(objetivos);
    }
    setLoadingObjetivos(false);
  };

  const cargarHistorial = async () => {
    if (!user?.id) return;
    setLoadingHistorial(true);
    const { data, error } = await supabase
      .from('planificacion_semanal')
      .select('id, fecha_ejecucion, cumplido')
      .eq('id_usuario', user.id)
      .order('fecha_ejecucion', { ascending: false });
    
    if (error) {
      console.error(error);
      showAlert('Error', 'No se pudo cargar el historial', 'danger');
      setLoadingHistorial(false);
      return;
    }
    
    const semanasMap = new Map<string, { total: number; cumplidas: number; noCumplidas: number; pendientes: number }>();
    
    for (const act of data || []) {
      const fecha = new Date(act.fecha_ejecucion);
      const dia = fecha.getDay();
      const diff = fecha.getDate() - dia + (dia === 0 ? -6 : 1);
      const inicioSemana = new Date(fecha.setDate(diff));
      const key = inicioSemana.toISOString().split('T')[0];
      
      const cumplido = act.cumplido;
      const existing = semanasMap.get(key) || { total: 0, cumplidas: 0, noCumplidas: 0, pendientes: 0 };
      existing.total++;
      if (cumplido === true) existing.cumplidas++;
      else if (cumplido === false) existing.noCumplidas++;
      else existing.pendientes++;
      semanasMap.set(key, existing);
    }
    
    const semanasArray: SemanaResumen[] = Array.from(semanasMap.entries())
      .map(([key, stats]) => {
        const inicio = new Date(key);
        const fin = getFechaFinSemana(inicio);
        return {
          semanaInicio: inicio,
          fechaInicioStr: inicio.toLocaleDateString('es-ES'),
          fechaFinStr: fin.toLocaleDateString('es-ES'),
          totalActividades: stats.total,
          cumplidas: stats.cumplidas,
          noCumplidas: stats.noCumplidas,
          pendientes: stats.pendientes
        };
      })
      .sort((a, b) => b.semanaInicio.getTime() - a.semanaInicio.getTime());
    
    setSemanasHistorial(semanasArray);
    setLoadingHistorial(false);
  };

  const verSemanaHistorial = async (inicio: Date) => {
    setSemanaSeleccionada(inicio);
    setLoadingSemanaSeleccionada(true);
    const fechaInicio = inicio.toISOString().split('T')[0];
    const fechaFin = getFechaFinSemana(inicio).toISOString().split('T')[0];
    const { data, error } = await supabase
      .from('planificacion_semanal')
      .select('*')
      .eq('id_usuario', user.id)
      .gte('fecha_ejecucion', fechaInicio)
      .lte('fecha_ejecucion', fechaFin)
      .order('fecha_ejecucion', { ascending: true });
    if (!error && data) {
      setActividadesSemanaSeleccionada(data.map(act => ({ ...act, hora: act.hora || '09:00:00' })));
    } else {
      setActividadesSemanaSeleccionada([]);
    }
    await fetchObjetivosSemana(inicio, true);
    setLoadingSemanaSeleccionada(false);
    setMostrarHistorial(false);
  };

  const volverSemanaActual = () => {
    setSemanaSeleccionada(null);
    setActividadesSemanaSeleccionada([]);
    setObjetivosSemanaSeleccionada('');
    setMostrarHistorial(false);
    fetchActividades(semanaInicio);
    fetchObjetivosSemana(semanaInicio);
  };

  useEffect(() => {
    if (user?.id) {
      fetchActividades(semanaInicio);
    }
  }, [user, semanaInicio]);

  useEffect(() => {
    if (user?.id && !semanaSeleccionada) {
      fetchObjetivosSemana(semanaInicio);
    }
  }, [semanaInicio, user, semanaSeleccionada]);

  const guardarObjetivosSemana = async (texto: string) => {
    if (!user?.id) return;
    const inicioStr = semanaInicio.toISOString().split('T')[0];
    const { error } = await supabase
      .from('planificacion_objetivos_semana')
      .upsert({
        semana_inicio: inicioStr,
        objetivos: texto,
        id_usuario: user.id,
        updated_at: new Date().toISOString()
      }, { onConflict: 'semana_inicio, id_usuario' });
    if (error) {
      showAlert('Error', 'No se pudieron guardar los objetivos', 'danger');
    } else {
      setObjetivosSemana(texto);
      showAlert('Éxito', 'Objetivos guardados', 'success');
    }
  };

  const handleGuardarSemanal = async () => {
    if (!formSemanal.actividad.trim() || !formSemanal.responsable.trim() || !formSemanal.hora) {
      showAlert('Campos incompletos', 'Complete actividad, responsable y hora', 'warning');
      return;
    }

    if (esFechaPasada(formSemanal.fecha_ejecucion)) {
      showAlert('Fecha no válida', 'Solo se pueden agendar actividades en días próximos (fecha actual o futura).', 'warning');
      return;
    }

    const diaCalculado = obtenerDiaSemanaDesdeFecha(formSemanal.fecha_ejecucion);
    
    setSaving(true);
    const data = {
      dia_semana: diaCalculado,
      actividad: formSemanal.actividad.trim(),
      responsable: formSemanal.responsable.trim(),
      fecha_ejecucion: formSemanal.fecha_ejecucion,
      hora: formSemanal.hora + ':00',
      id_usuario: user?.id,
      cumplido: null,
      motivo_incumplimiento: null
    };
    let error;
    if (editandoActividad) {
      ({ error } = await supabase
        .from('planificacion_semanal')
        .update(data)
        .eq('id', editandoActividad.id));
    } else {
      ({ error } = await supabase.from('planificacion_semanal').insert([data]));
    }
    if (error) {
      console.error(error);
      showAlert('Error', 'No se pudo guardar la actividad', 'danger');
    } else {
      showAlert('Éxito', editandoActividad ? 'Actividad actualizada' : 'Actividad registrada', 'success');
      setShowModalSemanal(false);
      setEditandoActividad(null);
      const fechaDefecto = new Date().toISOString().split('T')[0];
      setFormSemanal({ 
        dia_semana: obtenerDiaSemanaDesdeFecha(fechaDefecto), 
        actividad: '', 
        responsable: '', 
        fecha_ejecucion: fechaDefecto, 
        hora: '09:00' 
      });
      await fetchActividades(semanaInicio);
      await fetchObjetivosSemana(semanaInicio);
    }
    setSaving(false);
  };

  const handleEliminarSemanal = async (id: number) => {
    const { error } = await supabase.from('planificacion_semanal').delete().eq('id', id);
    if (error) showAlert('Error', 'No se pudo eliminar', 'danger');
    else {
      showAlert('Eliminado', 'Actividad eliminada', 'success');
      await fetchActividades(semanaInicio);
    }
  };

  const handleCambiarCumplimiento = async (actividad: ActividadSemanal, nuevoCumplido: boolean, motivo?: string | null) => {
    if (actividad.cumplido === false && nuevoCumplido === true) {
      showAlert('No permitido', 'No se puede cambiar una actividad no cumplida a cumplida', 'warning');
      return;
    }
    if (nuevoCumplido === false && (!motivo || motivo.trim() === '')) {
      setMotivoModal({ id: actividad.id, motivo: '' });
      return;
    }
    const updateData: any = { cumplido: nuevoCumplido };
    if (nuevoCumplido === false) {
      updateData.motivo_incumplimiento = motivo?.trim() || null;
    } else {
      updateData.motivo_incumplimiento = null;
    }
    const { error } = await supabase
      .from('planificacion_semanal')
      .update(updateData)
      .eq('id', actividad.id);
    if (error) showAlert('Error', 'No se pudo actualizar', 'danger');
    else fetchActividades(semanaInicio);
  };

  const handleGuardarMotivo = async () => {
    if (!motivoModal) return;
    if (!motivoModal.motivo.trim()) {
      showAlert('Motivo requerido', 'Debe indicar el motivo de incumplimiento', 'warning');
      return;
    }
    const { error } = await supabase
      .from('planificacion_semanal')
      .update({ cumplido: false, motivo_incumplimiento: motivoModal.motivo.trim() })
      .eq('id', motivoModal.id);
    if (error) showAlert('Error', 'No se pudo guardar el motivo', 'danger');
    else fetchActividades(semanaInicio);
    setMotivoModal(null);
  };

  // ========== REPORTES ==========
  const fetchReportes = async () => {
    if (!user?.id) return;
    setLoadingReportes(true);
    const { data, error } = await supabase
      .from('reportes_direccion')
      .select('*')
      .eq('id_usuario', user.id)
      .order('created_at', { ascending: false });
    if (error) {
      console.error(error);
      showAlert('Error', 'No se pudieron cargar los reportes', 'danger');
    } else {
      setReportes(data || []);
    }
    setLoadingReportes(false);
  };

  useEffect(() => {
    fetchReportes();
  }, [user]);

const subirReporte = async (event: React.ChangeEvent<HTMLInputElement>) => {
  const file = event.target.files?.[0];
  if (!file) return;
  if (!user?.id) return;

  const tiposPermitidos = ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'text/plain'];
  if (!tiposPermitidos.includes(file.type)) {
    showAlert('Formato no válido', 'Solo se permiten archivos PDF, Word (DOC/DOCX) o TXT', 'warning');
    return;
  }

  setSubiendo(true);
  const nombreArchivo = `${Date.now()}_${file.name.replace(/\s/g, '_')}`;
  const rutaArchivo = `${user.id}/${nombreArchivo}`;

  const { error: uploadError } = await supabase.storage
    .from('reportes_direccion')
    .upload(rutaArchivo, file);
  if (uploadError) {
    console.error(uploadError);
    showAlert('Error', 'No se pudo subir el archivo', 'danger');
    setSubiendo(false);
    return;
  }

  const { error: dbError } = await supabase
    .from('reportes_direccion')
    .insert({
      nombre: file.name,
      archivo_url: rutaArchivo,
      tipo_mime: file.type,
      tamaño: file.size,
      id_usuario: user.id,
      enviado: false
    });
  if (dbError) {
    console.error(dbError);
    showAlert('Error', 'No se pudo guardar el registro del reporte', 'danger');
    await supabase.storage.from('reportes_direccion').remove([rutaArchivo]);
  } else {
    showAlert('Éxito', 'Reporte subido correctamente', 'success');
    await fetchReportes();

    // *** NUEVO: Si había una solicitud pendiente, marcarla como completada ***
    if (solicitudPendiente) {
      const { error: updateError } = await supabase
        .from('solicitudes_reportes')
        .update({ estado: 'completado' })
        .eq('id', solicitudPendiente.id);
      if (!updateError) {
        setSolicitudPendiente(null); // Limpiar la notificación
      } else {
        console.error('Error al actualizar solicitud:', updateError);
      }
    }
  }
  setSubiendo(false);
  event.target.value = '';
};

  const enviarASecretaria = async (reporte: Reporte) => {
    const { error } = await supabase
      .from('reportes_direccion')
      .update({ enviado: true })
      .eq('id', reporte.id);
    if (error) {
      showAlert('Error', 'No se pudo enviar el reporte a secretaría', 'danger');
    } else {
      showAlert('Enviado', `El reporte "${reporte.nombre}" ha sido enviado a secretaría`, 'success');
      await fetchReportes();
    }
  };

  const descargarReporte = async (reporte: Reporte) => {
    const { data, error } = await supabase.storage
      .from('reportes_direccion')
      .createSignedUrl(reporte.archivo_url, 60);
    if (error) {
      showAlert('Error', 'No se pudo obtener el enlace de descarga', 'danger');
      return;
    }
    window.open(data.signedUrl, '_blank');
  };

  const eliminarReporte = async (id: number, archivoUrl: string) => {
    const { error: deleteStorageError } = await supabase.storage
      .from('reportes_direccion')
      .remove([archivoUrl]);
    if (deleteStorageError) {
      console.error(deleteStorageError);
      showAlert('Error', 'No se pudo eliminar el archivo', 'danger');
      return;
    }
    const { error: deleteDbError } = await supabase
      .from('reportes_direccion')
      .delete()
      .eq('id', id);
    if (deleteDbError) {
      showAlert('Error', 'No se pudo eliminar el registro', 'danger');
    } else {
      showAlert('Eliminado', 'Reporte eliminado correctamente', 'success');
      await fetchReportes();
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1048576) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / 1048576).toFixed(1) + ' MB';
  };

  const formatearDiaParaMostrar = (dia: string): string => {
    const mapa: Record<string, string> = {
      'lunes': 'Lunes',
      'martes': 'Martes',
      'miércoles': 'Miércoles',
      'jueves': 'Jueves',
      'viernes': 'Viernes',
      'sábado': 'Sábado',
      'domingo': 'Domingo'
    };
    return mapa[dia] || dia;
  };

  // ========== RENDER PRINCIPAL ==========
  return (
    <>
      <div className="space-y-6 animate-in fade-in duration-500">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-black text-slate-900 uppercase tracking-tighter italic">Planificación de la Dirección</h2>
            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mt-1">Gestión semanal y reportes</p>
          </div>
          <div className="flex bg-slate-100 p-1 rounded-xl gap-1">
            <TabButton active={activeTab === 'semanal'} onClick={() => setActiveTab('semanal')} icon={Calendar} label="Planificación Semanal" />
            <TabButton active={activeTab === 'reportes'} onClick={() => setActiveTab('reportes')} icon={FileText} label="Reportes" />
          </div>
        </div>

        <AnimatePresence mode="wait">
          {activeTab === 'semanal' && (
            <motion.div key="semanal" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="space-y-4">
              <div className="flex justify-between items-center">
                <div className="flex gap-2">
                  <button 
                    onClick={() => { 
                      setEditandoActividad(null); 
                      const fechaDefecto = new Date().toISOString().split('T')[0];
                      setFormSemanal({ 
                        dia_semana: obtenerDiaSemanaDesdeFecha(fechaDefecto), 
                        actividad: '', 
                        responsable: '', 
                        fecha_ejecucion: fechaDefecto, 
                        hora: '09:00' 
                      }); 
                      setShowModalSemanal(true); 
                    }} 
                    className="px-4 py-2 bg-brand-primary text-white rounded-lg text-[10px] font-black uppercase tracking-wider flex items-center gap-2"
                  >
                    <PlusCircle size={14} /> Nueva Actividad
                  </button>
                  <button 
                    onClick={() => { setMostrarHistorial(true); cargarHistorial(); }} 
                    className="px-4 py-2 bg-slate-200 text-slate-700 rounded-lg text-[10px] font-black uppercase tracking-wider flex items-center gap-2"
                  >
                    <History size={14} /> Historial
                  </button>
                </div>
              </div>

              {mostrarHistorial ? (
                loadingHistorial ? (
                  <div className="flex justify-center py-8"><Loader2 className="animate-spin text-brand-primary" size={24} /></div>
                ) : (
                  <HistorialSemanas 
                    semanas={semanasHistorial}
                    onSelectSemana={verSemanaHistorial}
                    onVolver={() => { setMostrarHistorial(false); volverSemanaActual(); }}
                  />
                )
              ) : semanaSeleccionada ? (
                loadingSemanaSeleccionada ? (
                  <div className="flex justify-center py-8"><Loader2 className="animate-spin text-brand-primary" size={24} /></div>
                ) : (
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <button onClick={volverSemanaActual} className="flex items-center gap-1 text-[10px] font-black text-brand-primary bg-brand-primary/10 px-3 py-1.5 rounded-full">
                        <ChevronLeft size={12} /> Volver a semana actual
                      </button>
                      <div className="text-[9px] text-slate-400">Semana del {semanaSeleccionada.toLocaleDateString('es-ES')}</div>
                    </div>
                    <AgendaSemanal
                      actividades={actividadesSemanaSeleccionada}
                      objetivosSemana={objetivosSemanaSeleccionada}
                      onGuardarObjetivos={guardarObjetivosSemana}
                      onMarcarCumplimiento={() => {}}
                      onEditar={() => {}}
                      onEliminar={() => {}}
                      semanaInicio={semanaSeleccionada}
                      onCambiarSemana={() => {}}
                      soloLectura={true}
                    />
                  </div>
                )
              ) : (
                <>
                  {loadingSemanal || loadingObjetivos ? (
                    <div className="flex justify-center py-8"><Loader2 className="animate-spin text-brand-primary" size={24} /></div>
                  ) : (
                    <AgendaSemanal
                      actividades={actividades}
                      objetivosSemana={objetivosSemana}
                      onGuardarObjetivos={guardarObjetivosSemana}
                      onMarcarCumplimiento={handleCambiarCumplimiento}
                      onEditar={(act) => {
                        if (act.cumplido === false) return;
                        setEditandoActividad(act);
                        const diaCorrecto = obtenerDiaSemanaDesdeFecha(act.fecha_ejecucion);
                        setFormSemanal({
                          dia_semana: diaCorrecto,
                          actividad: act.actividad,
                          responsable: act.responsable,
                          fecha_ejecucion: act.fecha_ejecucion,
                          hora: act.hora.substring(0,5)
                        });
                        setShowModalSemanal(true);
                      }}
                      onEliminar={handleEliminarSemanal}
                      semanaInicio={semanaInicio}
                      onCambiarSemana={cambiarSemana}
                      soloLectura={false}
                    />
                  )}
                </>
              )}
            </motion.div>
          )}

          {activeTab === 'reportes' && (
            <motion.div key="reportes" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="space-y-4">
              <div className="flex justify-between items-center">
                <div className="relative">
                  <input
                    type="file"
                    id="subir-reporte"
                    className="hidden"
                    accept=".pdf,.doc,.docx,.txt"
                    onChange={subirReporte}
                    disabled={subiendo}
                  />
                  <label
                    htmlFor="subir-reporte"
                    className={cn(
                      "px-4 py-2 rounded-lg text-[10px] font-black uppercase tracking-wider flex items-center gap-2 cursor-pointer transition-all",
                      subiendo ? "bg-gray-300 cursor-not-allowed" : "bg-brand-primary text-white hover:bg-brand-primary/90"
                    )}
                  >
                    {subiendo ? <Loader2 className="animate-spin" size={14} /> : <Upload size={14} />}
                    Subir Reporte
                  </label>
                </div>
              </div>
              {solicitudPendiente && (
  <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 mb-6">
    <div className="flex items-start gap-3">
      <AlertCircle className="h-5 w-5 text-amber-600 mt-0.5" />
      <div>
        <p className="text-sm font-bold text-amber-800">¡Solicitud de reporte pendiente!</p>
        <p className="text-xs text-amber-700">Se te ha solicitado que envíes los reportes semanales a la secretaría. Sube los reportes requeridos lo antes posible.</p>
        <p className="text-[10px] text-amber-600 mt-1">Solicitado el {new Date(solicitudPendiente.fecha).toLocaleDateString('es-ES')}</p>
      </div>
    </div>
  </div>
)}

              {loadingReportes ? (
                <div className="flex justify-center py-8"><Loader2 className="animate-spin text-brand-primary" size={24} /></div>
              ) : reportes.length === 0 ? (
                <div className="bg-white rounded-2xl border border-slate-100 p-12 text-center">
                  <FileText className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                  <p className="text-slate-400">No hay reportes subidos</p>
                </div>
              ) : (
                <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="w-full text-left">
                      <thead className="bg-slate-50/30 border-b border-slate-100">
                        <tr>
                          <th className="px-4 py-3 text-[9px] font-black text-slate-400 uppercase tracking-wider">Nombre</th>
                          <th className="px-4 py-3 text-[9px] font-black text-slate-400 uppercase tracking-wider">Fecha</th>
                          <th className="px-4 py-3 text-[9px] font-black text-slate-400 uppercase tracking-wider">Tamaño</th>
                          <th className="px-4 py-3 text-[9px] font-black text-slate-400 uppercase tracking-wider">Acciones</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-50">
                        {reportes.map(reporte => (
                          <tr key={reporte.id} className="hover:bg-slate-50/50 transition-colors">
                            <td className="px-4 py-3">
                              <div className="flex items-center gap-2">
                                <FileText size={14} className="text-brand-primary" />
                                <span className="text-[11px] font-bold text-slate-800 truncate max-w-50">{reporte.nombre}</span>
                              </div>
                            </td>
                            <td className="px-4 py-3 text-[10px] text-slate-600 whitespace-nowrap">
                              {new Date(reporte.created_at).toLocaleDateString('es-ES')}
                            </td>
                            <td className="px-4 py-3 text-[10px] text-slate-600">
                              {formatFileSize(reporte.tamaño)}
                            </td>
                            <td className="px-4 py-3">
                              <div className="flex items-center gap-2">
                                {reporte.enviado ? (
                                  <CheckCircle2 size={14} className="text-green-600" />
                                ) : (
                                  <Clock size={14} className="text-slate-400" />
                                )}
                                <button
                                  onClick={() => enviarASecretaria(reporte)}
                                  className="p-1.5 rounded-lg bg-emerald-50 text-emerald-600 hover:bg-emerald-100 transition-colors"
                                  title="Enviar a secretaria"
                                >
                                  <Send size={14} />
                                </button>
                                <button
                                  onClick={() => descargarReporte(reporte)}
                                  className="p-1.5 rounded-lg bg-blue-50 text-blue-600 hover:bg-blue-100 transition-colors"
                                  title="Descargar"
                                >
                                  <Download size={14} />
                                </button>
                                <button
                                  onClick={() => {
                                    if (confirm('¿Estás seguro de eliminar este reporte?')) {
                                      eliminarReporte(reporte.id, reporte.archivo_url);
                                    }
                                  }}
                                  className="p-1.5 rounded-lg bg-rose-50 text-rose-600 hover:bg-rose-100 transition-colors"
                                  title="Eliminar"
                                >
                                  <Trash size={14} />
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* MODAL SEMANAL */}
      <AnimatePresence>
        {showModalSemanal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setShowModalSemanal(false)} />
            <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }} className="relative bg-white rounded-2xl w-full max-w-lg p-6 shadow-2xl">
              <h3 className="text-lg font-black text-brand-primary mb-4">{editandoActividad ? 'Editar Actividad' : 'Nueva Actividad Semanal'}</h3>
              <div className="space-y-4">
                <div>
                  <label className="text-[9px] font-black text-slate-400 uppercase">Día de la semana</label>
                  <input 
                    type="text" 
                    value={formSemanal.dia_semana ? formatearDiaParaMostrar(formSemanal.dia_semana) : ''} 
                    disabled 
                    className="w-full p-2 rounded-xl bg-gray-100 border ring-1 ring-gray-200 text-[11px] font-bold text-slate-600"
                  />
                  <p className="text-[8px] text-slate-400 mt-1">* Se calcula automáticamente desde la fecha</p>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-[9px] font-black text-slate-400 uppercase">Fecha de ejecución</label>
                    <input 
                      type="date" 
                      value={formSemanal.fecha_ejecucion} 
                      onChange={(e) => {
                        const nuevaFecha = e.target.value;
                        setFormSemanal({ ...formSemanal, fecha_ejecucion: nuevaFecha });
                        actualizarDiaDesdeFecha(nuevaFecha);
                      }} 
                      className="w-full p-2 rounded-xl bg-gray-50 border ring-1 ring-gray-100 text-[11px] font-bold" 
                    />
                  </div>
                  <div>
                    <label className="text-[9px] font-black text-slate-400 uppercase">Hora</label>
                    <input 
                      type="time" 
                      value={formSemanal.hora} 
                      onChange={(e) => setFormSemanal({ ...formSemanal, hora: e.target.value })} 
                      className="w-full p-2 rounded-xl bg-gray-50 border ring-1 ring-gray-100 text-[11px] font-bold" 
                    />
                  </div>
                </div>
                <div>
                  <label className="text-[9px] font-black text-slate-400 uppercase">Actividad</label>
                  <textarea 
                    rows={3} 
                    value={formSemanal.actividad} 
                    onChange={(e) => setFormSemanal({ ...formSemanal, actividad: e.target.value })} 
                    className="w-full p-2 rounded-xl bg-gray-50 border ring-1 ring-gray-100 text-[11px] font-bold" 
                    placeholder="Describa la actividad..." 
                  />
                </div>
                <div>
                  <label className="text-[9px] font-black text-slate-400 uppercase">Responsable (nombre y apellido)</label>
                  <input 
                    type="text" 
                    value={formSemanal.responsable} 
                    onChange={(e) => setFormSemanal({ ...formSemanal, responsable: e.target.value })} 
                    className="w-full p-2 rounded-xl bg-gray-50 border ring-1 ring-gray-100 text-[11px] font-bold" 
                    placeholder="Ej: Juan Pérez" 
                  />
                </div>
              </div>
              <div className="flex justify-end gap-3 mt-6">
                <button onClick={() => setShowModalSemanal(false)} className="px-4 py-2 rounded-lg bg-gray-100 text-slate-600 text-[10px] font-black">Cancelar</button>
                <button onClick={handleGuardarSemanal} disabled={saving} className="px-4 py-2 rounded-lg bg-brand-primary text-white text-[10px] font-black flex items-center gap-2">{saving && <Loader2 className="animate-spin" size={12} />} Guardar</button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* MODAL MOTIVO INCUMPLIMIENTO */}
      <AnimatePresence>
        {motivoModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setMotivoModal(null)} />
            <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }} className="relative bg-white rounded-2xl w-full max-w-md p-6 shadow-2xl">
              <h3 className="text-lg font-black text-slate-800 mb-2">Motivo de incumplimiento</h3>
              <p className="text-[10px] text-slate-500 mb-4">Indique por qué no se realizó esta actividad</p>
              <textarea rows={4} value={motivoModal.motivo} onChange={(e) => setMotivoModal({ ...motivoModal, motivo: e.target.value })} className="w-full p-3 rounded-xl bg-gray-50 border ring-1 ring-gray-100 text-[11px] font-bold" placeholder="Describa el motivo..." />
              <div className="flex justify-end gap-3 mt-6"><button onClick={() => setMotivoModal(null)} className="px-4 py-2 rounded-lg bg-gray-100 text-slate-600 text-[10px] font-black">Cancelar</button><button onClick={handleGuardarMotivo} className="px-4 py-2 rounded-lg bg-rose-600 text-white text-[10px] font-black">Guardar incumplimiento</button></div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <AlertModal
        isOpen={modalState.isOpen}
        onClose={closeModal}
        title={modalState.title}
        message={modalState.message}
        type={modalState.type}
        showInput={modalState.showInput}
        inputPlaceholder={modalState.inputPlaceholder}
        cancelText={modalState.cancelText}
        confirmText={modalState.confirmText}
        onConfirm={modalState.onConfirm || (() => closeModal())}
      />
    </>
  );
};