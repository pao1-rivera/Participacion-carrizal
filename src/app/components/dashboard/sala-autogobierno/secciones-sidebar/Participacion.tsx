"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from 'framer-motion';
import { 
  GraduationCap, 
  Calendar, 
  Users, 
  Award, 
  FileCheck, 
  MapPin, 
  Clock, 
  User, 
  Upload, 
  X, 
  CheckCircle2, 
  ClipboardList,
  BookOpen,
  Loader2,
  ChevronLeft,
  ChevronRight as ChevronRightIcon,
  Building2,
  AlertCircle,
  UserPlus,
  CalendarDays,
  CheckSquare,
  ListChecks,
  Ban
} from "lucide-react";
import { cn } from "@/app/lib/utils";
import { supabase } from "@/app/lib/supabaseClient";
import { useAuth } from "@/context/AuthContext";
import { AlertModal } from "@/app/components/AlertModal";

interface Curso {
  id_cursos: number;
  titulo: string;
  tipo: string;
  modalidad: string;
  duracion: string;
  fecha_inicio: string;
  fecha_fin: string | null;
  horario: string;
  lugar: string;
  facilitador: string;
  institucion: string;
  cupos: number;
  cupos_disponibles?: number;
  descripcion: string | null;
  publicado: boolean;
  dias_semana?: string[];
  numero_sesiones?: number;
}

interface DatosSala {
  id_sala: number;
  nombre_sala: string;
  ubicacion: string;
  id_comuna: number;
  comuna_nombre?: string;
}

interface PostulacionExistente {
  id_postulacion: number;
  estado: string;
  curso_titulo: string;
  id_curso: number;
  curso?: Curso;
}

interface Participante {
  id_participante: number;
  nombre_participante: string;
  apellido_participante: string;
  cedula_participante: string;
  id_postulacion: number;
  id_curso: number;
}

export const Participacion = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<'calendario'>('calendario');
  const [showInscripcionModal, setShowInscripcionModal] = useState(false);
  const [showParticipantesModal, setShowParticipantesModal] = useState(false);
  const [selectedCurso, setSelectedCurso] = useState<Curso | null>(null);
  const [selectedPostulacion, setSelectedPostulacion] = useState<PostulacionExistente | null>(null);
  
  // Estados para cursos
  const [cursos, setCursos] = useState<Curso[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Estados para datos de la Sala de Autogobierno
  const [datosSala, setDatosSala] = useState<DatosSala | null>(null);
  const [loadingSala, setLoadingSala] = useState(true);
  
  // Estado para verificar si ya está postulado
  const [postulacionesExistentes, setPostulacionesExistentes] = useState<PostulacionExistente[]>([]);
  
  // Estados para participantes
  const [participantes, setParticipantes] = useState<Participante[]>([]);
  const [loadingParticipantes, setLoadingParticipantes] = useState(false);
  
  // Formulario de inscripción
  const [submitting, setSubmitting] = useState(false);
  const [submittingParticipante, setSubmittingParticipante] = useState(false);
  
  // Formulario de nuevo participante
  const [nuevoParticipante, setNuevoParticipante] = useState({
    nombre: '',
    apellido: '',
    cedula: ''
  });

  // Paginación
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 6;

  // ==================== ALERT MODAL ====================
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

  // ========== OCULTAR SIDEBAR CUANDO MODAL ESTÁ ABIERTO ==========
  useEffect(() => {
    if (showInscripcionModal || showParticipantesModal || modalState.isOpen) {
      document.body.classList.add('modal-open');
    } else {
      document.body.classList.remove('modal-open');
    }
    return () => document.body.classList.remove('modal-open');
  }, [showInscripcionModal, showParticipantesModal, modalState.isOpen]);

  // Función para contar participantes de un curso
  const contarParticipantesCurso = async (idCurso: number): Promise<number> => {
    try {
      const { count, error } = await supabase
        .from('participantes_curso')
        .select('*', { count: 'exact', head: true })
        .eq('id_curso', idCurso);
      
      if (error) throw error;
      return count || 0;
    } catch (error) {
      console.error('Error contando participantes:', error);
      return 0;
    }
  };

  // Cargar cursos desde Supabase con cupos disponibles
  const cargarCursos = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('cursos')
        .select('*')
        .eq('publicado', true)
        .order('fecha_inicio', { ascending: true });
      
      if (error) throw error;
      
      const cursosConCupos = await Promise.all((data || []).map(async (curso) => {
        const participantesCount = await contarParticipantesCurso(curso.id_cursos);
        return {
          ...curso,
          cupos_disponibles: Math.max(0, curso.cupos - participantesCount)
        };
      }));
      
      setCursos(cursosConCupos);
    } catch (error) {
      console.error('Error cargando cursos:', error);
    } finally {
      setLoading(false);
    }
  };

  // Cargar datos de la Sala de Autogobierno del usuario logueado
  const cargarDatosSala = async () => {
    if (!user?.id) return;
    setLoadingSala(true);
    try {
      const { data: salaData, error: salaError } = await supabase
        .from('datos_sala_autogobierno')
        .select('id_sala, nombre_sala, ubicacion, id_comuna')
        .eq('id_usuario', user.id)
        .maybeSingle();
      
      if (salaError) throw salaError;
      
      if (salaData && salaData.id_comuna) {
        const { data: comunaData, error: comunaError } = await supabase
          .from('datos_comuna')
          .select('nombre_comuna')
          .eq('id_comuna', salaData.id_comuna)
          .maybeSingle();
        
        if (comunaError) throw comunaError;
        
        setDatosSala({
          id_sala: salaData.id_sala,
          nombre_sala: salaData.nombre_sala || 'No especificado',
          ubicacion: salaData.ubicacion || 'No especificada',
          id_comuna: salaData.id_comuna,
          comuna_nombre: comunaData?.nombre_comuna || 'No especificada'
        });
      } else {
        setDatosSala(null);
      }
    } catch (error) {
      console.error('Error cargando datos de la sala:', error);
      setDatosSala(null);
    } finally {
      setLoadingSala(false);
    }
  };

  // Cargar todas las postulaciones existentes de la sala
  const cargarPostulacionesExistentes = async () => {
    if (!datosSala?.id_sala) return;
    
    try {
      const { data, error } = await supabase
        .from('postulaciones_sala')
        .select(`
          id_postulacion,
          estado,
          id_curso,
          cursos: id_curso (id_cursos, titulo, fecha_inicio, fecha_fin, horario, lugar, duracion, cupos)
        `)
        .eq('id_sala', datosSala.id_sala);
      
      if (error) throw error;
      
      const postulaciones = data?.map(item => {
        const cursoData = item.cursos as any;
        return {
          id_postulacion: item.id_postulacion,
          estado: item.estado,
          id_curso: item.id_curso,
          curso_titulo: cursoData?.titulo || 'Curso no disponible',
          curso: cursoData ? {
            ...cursoData,
            cupos_disponibles: cursoData.cupos
          } : undefined
        };
      }) || [];
      
      setPostulacionesExistentes(postulaciones);
    } catch (error) {
      console.error('Error cargando postulaciones:', error);
    }
  };

  // Cargar participantes de una postulación
  const cargarParticipantes = async (idPostulacion: number) => {
    setLoadingParticipantes(true);
    try {
      const { data, error } = await supabase
        .from('participantes_curso')
        .select('*')
        .eq('id_postulacion', idPostulacion);
      
      if (error) throw error;
      
      setParticipantes(data || []);
    } catch (error) {
      console.error('Error cargando participantes:', error);
    } finally {
      setLoadingParticipantes(false);
    }
  };

  // Registrar nuevo participante
  const registrarParticipante = async () => {
    if (!selectedPostulacion) return;
    
    if (!nuevoParticipante.nombre.trim() || !nuevoParticipante.apellido.trim()) {
      showAlert("Campos incompletos", "Complete nombre y apellido del participante", "warning");
      return;
    }
    
    if (!nuevoParticipante.cedula.trim()) {
      showAlert("Cédula requerida", "Ingrese la cédula del participante", "warning");
      return;
    }
    
    const cursoActual = cursos.find(c => c.id_cursos === selectedPostulacion.id_curso);
    if (cursoActual && cursoActual.cupos_disponibles !== undefined && cursoActual.cupos_disponibles <= 0) {
      showAlert("Cupos agotados", `No hay cupos disponibles para el curso "${cursoActual.titulo}". Cupos agotados.`, "warning");
      return;
    }
    
    setSubmittingParticipante(true);
    
    try {
      const { data, error } = await supabase
        .from('participantes_curso')
        .insert({
          id_postulacion: selectedPostulacion.id_postulacion,
          nombre_participante: nuevoParticipante.nombre.trim(),
          apellido_participante: nuevoParticipante.apellido.trim(),
          cedula_participante: nuevoParticipante.cedula.trim(),
          id_comuna: datosSala?.id_comuna,
          nombre_comuna: datosSala?.comuna_nombre,
          id_curso: selectedPostulacion.id_curso,
          estado: 'inscrito'
        })
        .select()
        .single();
      
      if (error) throw error;
      
      setParticipantes(prev => [...prev, data]);
      setNuevoParticipante({ nombre: '', apellido: '', cedula: '' });
      await cargarCursos();
      showAlert("Registro exitoso", "Participante registrado exitosamente", "success");
    } catch (error: any) {
      console.error('Error registrando participante:', error);
      showAlert("Error", error.message || "No se pudo registrar el participante", "danger");
    } finally {
      setSubmittingParticipante(false);
    }
  };

  useEffect(() => {
    cargarCursos();
    cargarDatosSala();
  }, [user]);

  useEffect(() => {
    if (datosSala?.id_sala) {
      cargarPostulacionesExistentes();
    }
  }, [datosSala]);

  const totalPages = Math.ceil(cursos.length / itemsPerPage);
  const paginatedCursos = cursos.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);
  
  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const formatFecha = (fechaISO: string) => {
    const fecha = new Date(fechaISO);
    return fecha.toLocaleDateString('es-ES', { day: 'numeric', month: 'long', year: 'numeric' });
  };

  const handleAbrirModalInscripcion = async (curso: Curso) => {
    if (curso.cupos_disponibles !== undefined && curso.cupos_disponibles <= 0) {
      showAlert("Cupos agotados", `Lo sentimos, el curso "${curso.titulo}" tiene los cupos agotados.`, "warning");
      return;
    }
    
    const yaExiste = postulacionesExistentes.some(p => p.id_curso === curso.id_cursos);
    if (yaExiste) {
      showAlert("Ya postulado", `Ya estás postulado al curso "${curso.titulo}"`, "info");
      return;
    }
    setSelectedCurso(curso);
    setShowInscripcionModal(true);
  };

  const handleAbrirModalParticipantes = async (postulacion: PostulacionExistente) => {
    const cursoActual = cursos.find(c => c.id_cursos === postulacion.id_curso);
    if (cursoActual && cursoActual.cupos_disponibles !== undefined && cursoActual.cupos_disponibles <= 0) {
      showAlert("Cupos agotados", `El curso "${cursoActual.titulo}" tiene los cupos agotados. No se pueden registrar más participantes.`, "warning");
    }
    setSelectedPostulacion(postulacion);
    await cargarParticipantes(postulacion.id_postulacion);
    setShowParticipantesModal(true);
  };

  const handleInscripcion = async () => {
    if (!selectedCurso || !user?.id) {
      showAlert("Error", "No se pudo identificar el curso o el usuario", "danger");
      return;
    }
    
    if (!datosSala) {
      showAlert("Datos insuficientes", "No se encontraron datos de tu Sala de Autogobierno. Contacta al administrador.", "danger");
      return;
    }
    
    if (selectedCurso.cupos_disponibles !== undefined && selectedCurso.cupos_disponibles <= 0) {
      showAlert("Cupos agotados", `Lo sentimos, los cupos para "${selectedCurso.titulo}" se agotaron mientras realizabas la postulación.`, "warning");
      setShowInscripcionModal(false);
      return;
    }
    
    setSubmitting(true);
    
    try {
      const { data: postulacionData, error: postulacionError } = await supabase
        .from('postulaciones_sala')
        .insert({
          id_sala: datosSala.id_sala,
          id_curso: selectedCurso.id_cursos,
          nombre_sala: datosSala.nombre_sala,
          ubicacion_sala: datosSala.ubicacion,
          id_comuna: datosSala.id_comuna,
          nombre_comuna: datosSala.comuna_nombre,
          estado: 'pendiente'
        })
        .select()
        .single();
      
      if (postulacionError) throw postulacionError;
      
      showAlert("Postulación exitosa", `¡Postulación exitosa para ${selectedCurso.titulo}!`, "success");
      await cargarPostulacionesExistentes();
      await cargarCursos();
      setShowInscripcionModal(false);
      
    } catch (error: any) {
      console.error('Error en inscripción:', error);
      showAlert("Error", `Error al procesar la inscripción: ${error.message}`, "danger");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-5 p-3 md:p-5 min-h-screen">
      
      {/* CABECERA REDUCIDA */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div>
          <h2 className="text-base font-black text-slate-800 italic uppercase tracking-tighter flex items-center gap-2">
            <GraduationCap className="h-5 w-5 text-brand-primary" /> Formación y Capacitación
          </h2>
          
        </div>
      </div>
      
      <AnimatePresence mode="wait">
        {/* VISTA CALENDARIO / TALLERES (REDUCIDA) */}
        {activeTab === 'calendario' && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}>
            {loading ? (
              <div className="flex justify-center py-10"><Loader2 className="h-6 w-6 animate-spin text-brand-primary" /></div>
            ) : cursos.length === 0 ? (
              <div className="text-center py-10 text-slate-400 text-xs">No hay talleres disponibles en este momento.</div>
            ) : (
              <>
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                  {paginatedCursos.map((curso) => {
                    const postulacion = postulacionesExistentes.find(p => p.id_curso === curso.id_cursos);
                    const yaPostulado = !!postulacion;
                    const cuposAgotados = curso.cupos_disponibles !== undefined && curso.cupos_disponibles <= 0;
                    
                    return (
                      <div key={curso.id_cursos} className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow flex flex-col justify-between">
                        <div>
                          <div className="flex justify-between items-start mb-4">
                            <span className={cn(
                              "px-2 py-0.5 rounded-full text-[7px] font-black uppercase tracking-wider",
                              curso.tipo === "Diplomado" ? "bg-purple-50 text-purple-600" : 
                              curso.tipo === "Taller" ? "bg-amber-50 text-amber-600" : 
                              "bg-blue-50 text-blue-500"
                            )}>
                              {curso.tipo}
                            </span>
                            <div className="flex flex-col items-end gap-0.5">
                              <div className="h-5 w-5 rounded-full border-2 border-white bg-gray-200 flex items-center justify-center text-[7px] font-bold text-gray-500">
                                {curso.cupos}
                              </div>
                            </div>
                          </div>
                          
                          <h3 className="text-sm font-black text-slate-800 italic uppercase leading-tight mb-3">{curso.titulo}</h3>
                          
                          <div className="space-y-2 mb-6">
                            <div className="flex items-center gap-2 text-slate-500">
                              <Calendar className="h-3 w-3 text-brand-primary" />
                              <span className="text-[9px] font-bold">{formatFecha(curso.fecha_inicio)}</span>
                            </div>
                            <div className="flex items-center gap-2 text-slate-500">
                              <Clock className="h-3 w-3 text-brand-primary" />
                              <span className="text-[9px] font-bold">{curso.horario}</span>
                            </div>
                            <div className="flex items-center gap-2 text-slate-500">
                              <MapPin className="h-3 w-3 text-brand-primary" />
                              <span className="text-[9px] font-bold">{curso.lugar}</span>
                            </div>
                            <div className="flex items-center gap-2 text-slate-500">
                              <BookOpen className="h-3 w-3 text-brand-primary" />
                              <span className="text-[9px] font-bold">{curso.duracion}</span>
                            </div>
                          </div>

                          <div className="p-3 bg-gray-50 rounded-xl flex items-center gap-3 mb-4">
                            <div className="h-8 w-8 rounded-lg bg-white flex items-center justify-center text-brand-primary shadow-sm">
                              <User className="h-4 w-4" />
                            </div>
                            <div>
                              <p className="text-[7px] font-black text-slate-400 uppercase tracking-wider">Facilitador</p>
                              <p className="text-[9px] font-black text-slate-800">{curso.facilitador}</p>
                              <p className="text-[7px] font-bold text-brand-primary uppercase italic">{curso.institucion}</p>
                            </div>
                          </div>
                        </div>
                        
                        {cuposAgotados ? (
                          <button disabled className="w-full py-2.5 rounded-xl bg-red-100 text-red-600 text-[8px] font-black uppercase tracking-wider cursor-not-allowed flex items-center justify-center gap-1.5">
                            <Ban className="h-3 w-3" />
                            Cupos agotados
                          </button>
                        ) : yaPostulado ? (
                          <div className="space-y-2">
                            <button disabled className="w-full py-2.5 rounded-xl bg-green-100 text-green-600 text-[8px] font-black uppercase tracking-wider cursor-not-allowed flex items-center justify-center gap-1.5">
                              <CheckCircle2 className="h-3 w-3" />
                              Ya postulado
                            </button>
                            <button onClick={() => handleAbrirModalParticipantes(postulacion!)} className="w-full py-2 rounded-xl text-brand-primary text-[8px] font-black uppercase tracking-wider transition-all flex items-center justify-center gap-1.5">
                              <UserPlus className="h-3 w-3" />
                              Registrar Participantes
                            </button>
                          </div>
                        ) : (
                          <button onClick={() => handleAbrirModalInscripcion(curso)} className="w-full py-2.5 rounded-xl bg-brand-primary text-white text-[8px] font-black uppercase tracking-wider shadow-md hover:scale-[1.02] transition-transform">
                            Postularme ahora
                          </button>
                        )}
                      </div>
                    );
                  })}
                </div>

                {totalPages > 1 && (
                  <div className="flex justify-center items-center gap-2 mt-6 pt-4 border-t border-gray-100">
                    <button onClick={() => handlePageChange(currentPage - 1)} disabled={currentPage === 1} className="p-1.5 rounded-lg bg-gray-100 text-slate-500 hover:bg-brand-primary/10 disabled:opacity-40">
                      <ChevronLeft className="h-3 w-3" />
                    </button>
                    <span className="text-[8px] font-black text-slate-400 uppercase">Página {currentPage} de {totalPages}</span>
                    <button onClick={() => handlePageChange(currentPage + 1)} disabled={currentPage === totalPages} className="p-1.5 rounded-lg bg-gray-100 text-slate-500 hover:bg-brand-primary/10 disabled:opacity-40">
                      <ChevronRightIcon className="h-3 w-3" />
                    </button>
                  </div>
                )}
              </>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* MODAL INSCRIPCION (TAMAÑO ORIGINAL) */}
      <AnimatePresence>
        {showInscripcionModal && selectedCurso && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setShowInscripcionModal(false)} className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" />
            <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.9 }} className="relative w-full max-w-lg bg-white rounded-[2.5rem] shadow-2xl overflow-hidden">
              <div className="p-6 border-b border-gray-50 flex items-center justify-between bg-brand-primary">
                <h4 className="text-lg font-black text-white italic uppercase">Formulario de Postulación</h4>
                <button onClick={() => setShowInscripcionModal(false)} className="p-2 rounded-xl bg-white/10 text-white hover:bg-white/20"><X className="h-5 w-5" /></button>
              </div>
              <div className="p-6 space-y-6">
                <div className="bg-gray-50 p-4 rounded-2xl">
                  <p className="text-[10px] font-black text-slate-400 uppercase">Taller Seleccionado</p>
                  <p className="text-sm font-black text-slate-800 italic uppercase">{selectedCurso.titulo}</p>
                  <p className="text-[9px] text-slate-500 mt-1">Cupos disponibles: {selectedCurso.cupos_disponibles} / {selectedCurso.cupos}</p>
                </div>

                <div className="bg-brand-primary/5 p-4 rounded-2xl border border-brand-primary/10">
                  <p className="text-[10px] font-black text-brand-primary uppercase tracking-wider mb-3 flex items-center gap-2">
                    <Building2 className="h-3.5 w-3.5" /> Datos de tu Sala de Autogobierno
                  </p>
                  {loadingSala ? (
                    <div className="flex justify-center py-2"><Loader2 className="h-4 w-4 animate-spin text-brand-primary" /></div>
                  ) : datosSala ? (
                    <div className="space-y-2">
                      <div><p className="text-[8px] font-bold text-slate-400 uppercase">Nombre de la Sala</p><p className="text-sm font-black text-slate-800">{datosSala.nombre_sala}</p></div>
                      <div><p className="text-[8px] font-bold text-slate-400 uppercase">Ubicación</p><p className="text-sm font-bold text-slate-700">{datosSala.ubicacion}</p></div>
                      <div><p className="text-[8px] font-bold text-slate-400 uppercase">Comuna</p><p className="text-sm font-bold text-slate-700">{datosSala.comuna_nombre}</p></div>
                    </div>
                  ) : (
                    <p className="text-xs text-amber-600 italic flex items-center gap-2"><AlertCircle className="h-3 w-3" /> No se encontraron datos de tu Sala.</p>
                  )}
                </div>

                <button onClick={handleInscripcion} disabled={submitting || !datosSala} className="w-full py-5 rounded-2xl bg-brand-primary text-white text-[10px] font-black uppercase tracking-[0.2em] shadow-xl shadow-brand-primary/20 hover:scale-[1.02] transition-transform disabled:opacity-50">
                  {submitting ? <Loader2 className="h-4 w-4 animate-spin mx-auto" /> : "Confirmar Postulación de la Sala"}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* MODAL REGISTRAR PARTICIPANTES (TAMAÑO ORIGINAL) */}
      <AnimatePresence>
        {showParticipantesModal && selectedPostulacion && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setShowParticipantesModal(false)} className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" />
            <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.9 }} className="relative w-full max-w-lg bg-white rounded-3xl shadow-2xl overflow-hidden max-h-[80vh] flex flex-col">
              
              <div className="p-4 border-b border-gray-50 flex items-center justify-between bg-brand-primary">
                <h4 className="text-base font-black text-white italic uppercase">Registrar Participantes</h4>
                <button onClick={() => setShowParticipantesModal(false)} className="p-1.5 rounded-xl bg-white/10 text-white hover:bg-white/20"><X className="h-4 w-4" /></button>
              </div>

              <div className="p-4 overflow-y-auto flex-1 space-y-4">
                <div className="bg-gray-50 p-3 rounded-xl">
                  <p className="text-[9px] font-black text-slate-400 uppercase">Curso</p>
                  <p className="text-xs font-black text-slate-800 italic uppercase">{selectedPostulacion.curso_titulo}</p>
                  {(() => {
                    const cursoActual = cursos.find(c => c.id_cursos === selectedPostulacion.id_curso);
                    const cuposDisponibles = cursoActual?.cupos_disponibles ?? 0;
                    return (
                      <p className={`text-[8px] font-bold mt-1 ${cuposDisponibles <= 0 ? 'text-red-500' : 'text-green-600'}`}>
                        Cupos disponibles: {cuposDisponibles}
                      </p>
                    );
                  })()}
                </div>

                <div className="bg-brand-primary/5 p-3 rounded-xl border border-brand-primary/10">
                  <p className="text-[9px] font-black text-brand-primary uppercase tracking-wider mb-2 flex items-center gap-1.5">
                    <UserPlus className="h-3 w-3" /> Agregar Participante
                  </p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    <input type="text" placeholder="Nombre" value={nuevoParticipante.nombre} onChange={(e) => setNuevoParticipante({...nuevoParticipante, nombre: e.target.value})} className="p-2.5 rounded-xl bg-white border border-gray-200 text-xs font-bold outline-none focus:ring-2 focus:ring-brand-primary" />
                    <input type="text" placeholder="Apellido" value={nuevoParticipante.apellido} onChange={(e) => setNuevoParticipante({...nuevoParticipante, apellido: e.target.value})} className="p-2.5 rounded-xl bg-white border border-gray-200 text-xs font-bold" />
                    <div className="flex gap-2 sm:col-span-2">
                      <input type="text" placeholder="Cédula" value={nuevoParticipante.cedula} onChange={(e) => setNuevoParticipante({...nuevoParticipante, cedula: e.target.value})} className="flex-1 p-2.5 rounded-xl bg-white border border-gray-200 text-xs font-bold" />
                      <button onClick={registrarParticipante} disabled={submittingParticipante} className="px-4 py-2.5 rounded-xl bg-brand-primary text-white text-[10px] font-black uppercase tracking-wider hover:scale-102 transition-all disabled:opacity-50">
                        {submittingParticipante ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : "Agregar"}
                      </button>
                    </div>
                  </div>
                </div>

                <div>
                  <p className="text-[9px] font-black text-slate-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                    <Users className="h-3 w-3" /> Participantes ({participantes.length})
                  </p>
                  {loadingParticipantes ? (
                    <div className="flex justify-center py-4"><Loader2 className="h-5 w-5 animate-spin text-brand-primary" /></div>
                  ) : participantes.length === 0 ? (
                    <div className="text-center py-4 text-xs text-slate-400">No hay participantes registrados aún.</div>
                  ) : (
                    <div className="space-y-1.5">
                      {participantes.map((p) => (
                        <div key={p.id_participante} className="flex items-center justify-between p-2.5 bg-gray-50 rounded-xl">
                          <div>
                            <p className="text-xs font-bold text-slate-800">{p.nombre_participante} {p.apellido_participante}</p>
                            <p className="text-[9px] text-slate-500">{p.cedula_participante}</p>
                          </div>
                          <span className="text-[8px] font-bold px-2 py-0.5 rounded-full bg-green-100 text-green-600 uppercase tracking-wider">Inscrito</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* AlertModal global */}
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
    </div>
  );
};