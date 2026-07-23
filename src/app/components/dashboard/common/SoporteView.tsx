"use client";

import React, { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  MessageSquare, 
  Info, 
  Send, 
  Paperclip, 
  Clock, 
  CheckCircle, 
  Eye, 
  ChevronLeft, 
  ChevronRight,
  FileText,
  X,
  PlusCircle,
  Activity as ActivityIcon,
  Loader2,
  AlertCircle,
  User
} from "lucide-react";
import { cn } from "@/app/lib/utils";
import { supabase } from "@/app/lib/supabaseClient";
import { useAuth } from "@/context/AuthContext";
import { AlertModal } from "@/app/components/AlertModal"; // <-- Importar AlertModal

interface Ticket {
  id_soporte: number;
  id_usuario: string;
  problema: string;
  evidencia_url: string | null;
  estatus: 'pendiente' | 'en revision' | 'resuelto';
  respuesta: string | null;
  fecha_creacion: string;
  fecha_respuesta: string | null;
  usuario_nombre?: string;
  usuario_apellido?: string;
  usuario_rol?: string;
}

export const SoporteView = () => {
  const { user } = useAuth();
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;
  const [submitting, setSubmitting] = useState(false);
  
  // Formulario nuevo ticket
  const [problema, setProblema] = useState("");
  const [archivo, setArchivo] = useState<File | null>(null);

  // Modal
  const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null);
  const [modalType, setModalType] = useState<"descripcion" | "respuesta" | null>(null);
  
  // Para cambiar estado (solo administradores)
  const [updatingStatus, setUpdatingStatus] = useState(false);

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

  const showConfirm = (title: string, message: string, onConfirm: () => void) => {
    setModalState({
      ...modalState,
      isOpen: true,
      title,
      message,
      type: 'warning',
      showInput: false,
      onConfirm: () => { onConfirm(); setModalState(prev => ({ ...prev, isOpen: false })); },
      confirmText: 'Sí, continuar',
      cancelText: 'Cancelar',
    });
  };

  const closeModalAlert = () => setModalState(prev => ({ ...prev, isOpen: false }));

  // ========== OCULTAR SIDEBAR CUANDO HAY MODAL ==========
  useEffect(() => {
    // Se oculta el sidebar cuando el modal de detalles o el AlertModal están abiertos
    if (selectedTicket || modalState.isOpen) {
      document.body.classList.add('modal-open');
    } else {
      document.body.classList.remove('modal-open');
    }
    return () => document.body.classList.remove('modal-open');
  }, [selectedTicket, modalState.isOpen]);

  // Definición de roles
  const adminRoles = ['director_general', 'administrador', 'director_tecnologia'];
  const baseRoles = [
    'alcaldesa', 'secretario', 'director_adulto_mayor',
    'director_formacion_planificacion', 'director_digitalizacion',
    'director_comunas', 'sala_autogobierno', 'comuna', 'consejo_comunal'
  ];

  // Verificar si el usuario puede gestionar tickets (responder y cambiar estado)
  const canManageTickets = user?.rolNombre ? adminRoles.includes(user.rolNombre) : false;
  
  // Verificar si el usuario puede ver todos los tickets (gestión completa)
  const canViewAllTickets = user?.rolNombre ? adminRoles.includes(user.rolNombre) : false;
  
  // Todos los usuarios autenticados pueden enviar tickets
  const canSendTickets = true;
  const canViewOwnTickets = true;

  // Cargar tickets con datos de usuario
  const cargarTickets = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    try {
      let query = supabase
        .from('soporte')
        .select('*')
        .order('fecha_creacion', { ascending: false });
      
      if (!canViewAllTickets) {
        query = query.eq('id_usuario', user.id);
      }
      
      const { data: ticketsData, error: ticketsError } = await query;
      if (ticketsError) throw ticketsError;

      if (!ticketsData || ticketsData.length === 0) {
        setTickets([]);
        setLoading(false);
        return;
      }

      const userIds = [...new Set(ticketsData.map(t => t.id_usuario))];
      
      // Obtener perfiles de usuario
      const { data: perfilesData, error: perfilesError } = await supabase
        .from('perfil_usuario')
        .select('id_usuario, nombre, apellido, id_rol')
        .in('id_usuario', userIds);
      
      if (perfilesError) throw perfilesError;

      // Obtener los nombres de los roles
      const rolesIds = [...new Set(perfilesData.map(p => p.id_rol).filter(Boolean))];
      let rolesMap = new Map();
      if (rolesIds.length > 0) {
        const { data: rolesData, error: rolesError } = await supabase
          .from('rol_usuario')
          .select('id_rol, nombre_rol')
          .in('id_rol', rolesIds);
        if (!rolesError && rolesData) {
          rolesData.forEach(r => rolesMap.set(r.id_rol, r.nombre_rol));
        }
      }

      const perfilMap = new Map();
      perfilesData?.forEach(p => {
        const rolNombre = rolesMap.get(p.id_rol) || 'Sin rol';
        perfilMap.set(p.id_usuario, {
          nombre: p.nombre || '',
          apellido: p.apellido || '',
          rol: rolNombre
        });
      });

      const ticketsConUsuario: Ticket[] = ticketsData.map(ticket => ({
        ...ticket,
        usuario_nombre: perfilMap.get(ticket.id_usuario)?.nombre || 'Desconocido',
        usuario_apellido: perfilMap.get(ticket.id_usuario)?.apellido || '',
        usuario_rol: perfilMap.get(ticket.id_usuario)?.rol || 'Sin rol'
      }));

      setTickets(ticketsConUsuario);
    } catch (error: any) {
      console.error('Error cargando tickets:', error);
      showAlert('Error', 'No se pudieron cargar los tickets.', 'danger');
    } finally {
      setLoading(false);
    }
  }, [user, canViewAllTickets]);

  // Suscripción en tiempo real
  useEffect(() => {
    if (!user) return;
    cargarTickets();

    const channel = supabase
      .channel('soporte-changes-view')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'soporte' }, () => {
        cargarTickets();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, cargarTickets]);

  // Enviar nuevo ticket
  const handleSubmitTicket = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    if (!problema.trim()) {
      showAlert('Campo requerido', 'Por favor describe el problema.', 'warning');
      return;
    }
    setSubmitting(true);
    try {
      let evidencia_url = null;
      if (archivo) {
        const fileExt = archivo.name.split('.').pop();
        const fileName = `${user.id}/${Date.now()}.${fileExt}`;
        const { error: uploadError } = await supabase.storage
          .from('soportes')
          .upload(fileName, archivo);
        if (uploadError) throw uploadError;
        const { data: urlData } = await supabase.storage
          .from('soportes')
          .createSignedUrl(fileName, 60 * 60 * 24 * 365);
        evidencia_url = urlData?.signedUrl || null;
      }

      const { error: insertError } = await supabase
        .from('soporte')
        .insert({
          id_usuario: user.id,
          problema: problema,
          evidencia_url: evidencia_url,
          estatus: 'pendiente'
        });
      if (insertError) throw insertError;

      showAlert('Ticket enviado', 'Tu solicitud ha sido registrada exitosamente.', 'success');
      setProblema("");
      setArchivo(null);
      await cargarTickets();
      setCurrentPage(1);
    } catch (err: any) {
      showAlert('Error al enviar', err.message, 'danger');
    } finally {
      setSubmitting(false);
    }
  };

  // Actualizar estado del ticket (solo roles con permisos)
  const actualizarEstado = async (ticket: Ticket, nuevoEstatus: 'pendiente' | 'en revision' | 'resuelto') => {
    if (!canManageTickets) return;
    setUpdatingStatus(true);
    try {
      const { error } = await supabase
        .from('soporte')
        .update({ 
          estatus: nuevoEstatus,
          updated_at: new Date().toISOString(),
          ...(nuevoEstatus === 'resuelto' && { fecha_respuesta: new Date().toISOString() })
        })
        .eq('id_soporte', ticket.id_soporte);
      if (error) throw error;
      
      setSelectedTicket(null);
      setModalType(null);
      showAlert('Estado actualizado', `El ticket ahora está en estado "${nuevoEstatus}".`, 'success');
      await cargarTickets();
    } catch (error: any) {
      showAlert('Error al actualizar', error.message, 'danger');
    } finally {
      setUpdatingStatus(false);
    }
  };

  // Responder ticket (solo roles con permisos)
  const handleResponder = async (ticket: Ticket, respuesta: string) => {
    if (!canManageTickets) return;
    if (!respuesta.trim()) {
      showAlert('Campo vacío', 'Escribe una respuesta antes de enviar.', 'warning');
      return;
    }
    setUpdatingStatus(true);
    try {
      const { error } = await supabase
        .from('soporte')
        .update({
          respuesta: respuesta,
          estatus: 'resuelto',
          fecha_respuesta: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .eq('id_soporte', ticket.id_soporte);
      if (error) throw error;
      setSelectedTicket(null);
      setModalType(null);
      showAlert('Ticket resuelto', 'La respuesta ha sido enviada y el ticket se marcó como resuelto.', 'success');
      await cargarTickets();
    } catch (error: any) {
      showAlert('Error al responder', error.message, 'danger');
    } finally {
      setUpdatingStatus(false);
    }
  };

  // Paginación
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = tickets.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(tickets.length / itemsPerPage);

  const openModal = (ticket: Ticket, type: "descripcion" | "respuesta") => {
    setSelectedTicket(ticket);
    setModalType(type);
  };

  const closeModal = () => {
    setSelectedTicket(null);
    setModalType(null);
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' });
  };

  if (!user) return null;

  return (
    <div className="space-y-8 p-4 md:p-0">
      <div className="grid lg:grid-cols-3 gap-8">
        
        {/* COLUMNA IZQUIERDA: CREAR SOLICITUD */}
        <div className="lg:col-span-1 space-y-6">
          <div className="bg-white rounded-[2.5rem] p-8 border border-gray-100 shadow-sm">
            <div className="h-10 w-10 rounded-xl bg-brand-primary/10 flex items-center justify-center text-brand-primary mb-4">
              <PlusCircle className="h-5 w-5" />
            </div>
            <h4 className="text-lg font-black text-slate-800 italic uppercase tracking-tighter">
              Nueva Solicitud
            </h4>
            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-1 mb-6">
              Describe tu requerimiento técnico
            </p>

            <form onSubmit={handleSubmitTicket} className="space-y-4">
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2">
                  Descripción del problema *
                </label>
                <textarea 
                  className="w-full p-4 rounded-2xl bg-gray-50 border-none ring-1 ring-gray-100 focus:ring-2 focus:ring-brand-primary/20 outline-none text-xs font-bold min-h-30 resize-none"
                  placeholder="Ej: No puedo subir el acta constitutiva..."
                  value={problema}
                  onChange={(e) => setProblema(e.target.value)}
                  required
                />
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2">
                  Evidencia (Opcional)
                </label>
                <div className="relative group cursor-pointer">
                  <div className="flex items-center justify-between p-4 rounded-2xl bg-gray-50 border-2 border-dashed border-gray-200 group-hover:border-brand-primary/40 transition-colors">
                    <span className="text-[10px] font-black text-slate-400 uppercase">
                      {archivo ? archivo.name : "Seleccionar archivo"}
                    </span>
                    <Paperclip className="h-4 w-4 text-slate-300 group-hover:text-brand-primary" />
                  </div>
                  <input 
                    type="file" 
                    className="absolute inset-0 opacity-0 cursor-pointer" 
                    onChange={(e) => setArchivo(e.target.files?.[0] || null)}
                  />
                </div>
              </div>

              <button 
                type="submit" 
                disabled={submitting}
                className="w-full py-4 rounded-2xl bg-brand-primary text-white text-[10px] font-black uppercase tracking-widest hover:scale-[1.02] transition-all shadow-lg shadow-brand-primary/20 flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {submitting ? <Loader2 className="h-3 w-3 animate-spin" /> : <Send className="h-3 w-3" />} 
                Enviar Ticket
              </button>
            </form>
          </div>

          
        </div>

        {/* COLUMNA DERECHA: LISTADO DE SOLICITUDES */}
        <div className="lg:col-span-2">
          <div className="bg-white rounded-[2.5rem] border border-gray-100 shadow-sm overflow-hidden h-full flex flex-col">
            <div className="p-8 border-b border-gray-50 bg-gray-50/30">
              <h4 className="text-lg font-black text-slate-800 italic uppercase tracking-tighter">
                {canViewAllTickets ? 'Tickets de Soporte' : 'Mi Historial de Soporte'}
              </h4>
              <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-1">
                {canViewAllTickets 
                  ? 'Gestión y seguimiento de todos los requerimientos' 
                  : 'Seguimiento de tus requerimientos realizados'}
              </p>
            </div>

            <div className="flex-1 overflow-x-auto">
              {loading ? (
                <div className="flex justify-center items-center py-20">
                  <Loader2 className="h-8 w-8 animate-spin text-brand-primary" />
                </div>
              ) : tickets.length === 0 ? (
                <div className="text-center py-20 text-slate-400 text-sm italic">
                  No hay solicitudes de soporte.
                </div>
              ) : (
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-gray-50/50 border-b border-gray-100 text-[9px] font-black text-slate-400 uppercase tracking-[0.2em]">
                      <th className="px-8 py-5">Fecha</th>
                      {canViewAllTickets && <th className="px-8 py-5">Usuario</th>}
                      <th className="px-8 py-5">Estatus</th>
                      <th className="px-8 py-5">Acciones</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {currentItems.map((ticket) => (
                      <tr key={ticket.id_soporte} className="hover:bg-gray-50/80 transition-colors group">
                        <td className="px-8 py-5">
                          <div className="flex items-center gap-3">
                            <div className="h-8 w-8 rounded-lg bg-gray-100 flex items-center justify-center">
                              <Clock className="h-4 w-4 text-slate-400" />
                            </div>
                            <span className="text-xs font-black text-slate-700">
                              {formatDate(ticket.fecha_creacion)}
                            </span>
                          </div>
                        </td>
                        {canViewAllTickets && (
                          <td className="px-8 py-5">
                            <div className="flex flex-col">
                              <span className="text-xs font-bold text-slate-700">
                                {ticket.usuario_nombre} {ticket.usuario_apellido}
                              </span>
                              <span className="text-[8px] font-bold text-brand-primary uppercase">
                                {ticket.usuario_rol}
                              </span>
                            </div>
                          </td>
                        )}
                        <td className="px-8 py-5">
                          <span className={cn(
                            "px-3 py-1 rounded-lg text-[8px] font-black uppercase tracking-widest flex items-center gap-2 w-fit",
                            ticket.estatus === "resuelto" ? "bg-emerald-50 text-emerald-600" : 
                            ticket.estatus === "en revision" ? "bg-amber-50 text-amber-600" : "bg-slate-100 text-slate-600"
                          )}>
                            {ticket.estatus === "resuelto" ? <CheckCircle className="h-3 w-3" /> : <ActivityIcon className="h-3 w-3" />}
                            {ticket.estatus}
                          </span>
                        </td>
                        <td className="px-8 py-5">
                          <div className="flex items-center gap-2">
                            <button 
                              onClick={() => openModal(ticket, "descripcion")}
                              className="p-2 rounded-lg bg-gray-50 hover:bg-brand-primary hover:text-white transition-all group/btn" 
                              title="Ver descripción"
                            >
                              <Eye className="h-3.5 w-3.5" />
                            </button>
                            {ticket.respuesta && (
                              <button 
                                onClick={() => openModal(ticket, "respuesta")}
                                className="p-2 rounded-lg bg-brand-primary/5 text-brand-primary hover:bg-brand-primary hover:text-white transition-all" 
                                title="Ver respuesta"
                              >
                                <MessageSquare className="h-3.5 w-3.5" />
                              </button>
                            )}
                            {canManageTickets && ticket.estatus !== 'resuelto' && (
                              <button 
                                onClick={() => openModal(ticket, "respuesta")}
                                className="p-2 rounded-lg bg-amber-50 text-amber-600 hover:bg-amber-100 transition-all"
                                title="Responder ticket"
                              >
                                <MessageSquare className="h-3.5 w-3.5" />
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>

            {totalPages > 1 && (
              <div className="p-6 border-t border-gray-100 flex items-center justify-between bg-gray-50/30">
                <p className="text-[9px] font-black text-slate-400 uppercase">
                  Página {currentPage} de {totalPages}
                </p>
                <div className="flex gap-2">
                  <button 
                    onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                    disabled={currentPage === 1}
                    className="p-2.5 rounded-xl bg-white border border-gray-100 text-slate-400 hover:text-brand-primary disabled:opacity-50 transition-all shadow-sm"
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </button>
                  <button 
                    onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                    disabled={currentPage === totalPages}
                    className="p-2.5 rounded-xl bg-white border border-gray-100 text-slate-400 hover:text-brand-primary disabled:opacity-50 transition-all shadow-sm"
                  >
                    <ChevronRight className="h-4 w-4" />
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* MODAL DE DETALLES (sin cambios) */}
      <AnimatePresence>
        {selectedTicket && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }} 
              animate={{ opacity: 1 }} 
              exit={{ opacity: 0 }} 
              onClick={closeModal} 
              className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" 
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }} 
              animate={{ opacity: 1, scale: 1, y: 0 }} 
              exit={{ opacity: 0, scale: 0.95, y: 20 }} 
              className="relative w-full max-w-lg bg-white rounded-[2.5rem] shadow-2xl overflow-hidden"
            >
              <div className="p-6 border-b border-gray-100 flex justify-between items-center">
                <div className="flex items-center gap-3">
                  <div className={cn(
                    "h-10 w-10 rounded-xl flex items-center justify-center",
                    modalType === "descripcion" ? "bg-slate-100 text-slate-600" : "bg-brand-primary/10 text-brand-primary"
                  )}>
                    {modalType === "descripcion" ? <Eye className="h-5 w-5" /> : <MessageSquare className="h-5 w-5" />}
                  </div>
                  <div>
                    <h4 className="text-lg font-black text-slate-800 italic uppercase tracking-tighter">
                      {modalType === "descripcion" ? "Detalle del Problema" : 
                       (selectedTicket.respuesta ? "Respuesta de Soporte" : "Responder Ticket")}
                    </h4>
                    <p className="text-[9px] text-slate-400 font-bold uppercase tracking-widest">
                      Ticket #{selectedTicket.id_soporte} - {formatDate(selectedTicket.fecha_creacion)}
                    </p>
                  </div>
                </div>
                <button onClick={closeModal} className="p-1.5 rounded-xl hover:bg-gray-100 transition-colors">
                  <X className="h-5 w-5 text-slate-400" />
                </button>
              </div>

              <div className="p-6 space-y-4">
                {modalType === "descripcion" ? (
                  <>
                    <div className="bg-brand-primary/5 p-3 rounded-xl flex items-center gap-3">
                      <User size={18} className="text-brand-primary" />
                      <div>
                        <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Reportado por</p>
                        <p className="text-sm font-black text-slate-800">{selectedTicket.usuario_nombre} {selectedTicket.usuario_apellido}</p>
                      </div>
                    </div>
                    
                    {canManageTickets && (
                      <div className="bg-gray-50 p-4 rounded-xl">
                        <label className="text-[10px] font-bold text-slate-400 uppercase block mb-2">Estado del ticket</label>
                        <div className="flex gap-2">
                          <select
                            value={selectedTicket.estatus}
                            onChange={(e) => actualizarEstado(selectedTicket, e.target.value as any)}
                            disabled={updatingStatus}
                            className="flex-1 p-2 rounded-xl bg-white border border-gray-200 text-xs font-bold outline-none focus:ring-2 focus:ring-brand-primary"
                          >
                            <option value="pendiente">Pendiente</option>
                            <option value="en revision">En revisión</option>
                            <option value="resuelto">Resuelto</option>
                          </select>
                          {updatingStatus && <Loader2 className="h-5 w-5 animate-spin text-brand-primary" />}
                        </div>
                      </div>
                    )}

                    <div className="bg-gray-50 p-4 rounded-2xl">
                      <p className="text-sm font-bold text-slate-700 leading-relaxed">{selectedTicket.problema}</p>
                    </div>

                    {selectedTicket.evidencia_url && (
                      <div>
                        <label className="text-[10px] font-bold text-slate-400 uppercase block mb-2">Evidencia adjunta</label>
                        <a href={selectedTicket.evidencia_url} target="_blank" rel="noopener noreferrer" className="text-xs text-brand-primary font-bold underline flex items-center gap-1">
                          Ver archivo <FileText size={12} />
                        </a>
                      </div>
                    )}

                    <div className="flex items-center gap-2 pt-2">
                      <span className={`text-[9px] font-black uppercase px-2 py-1 rounded-full ${
                        selectedTicket.estatus === 'pendiente' ? 'bg-amber-100 text-amber-600' :
                        selectedTicket.estatus === 'en revision' ? 'bg-blue-100 text-blue-600' : 'bg-emerald-100 text-emerald-600'
                      }`}>
                        {selectedTicket.estatus}
                      </span>
                      <span className="text-[9px] text-slate-400">Creado el {formatDate(selectedTicket.fecha_creacion)}</span>
                    </div>
                  </>
                ) : (
                  <div>
                    {selectedTicket.respuesta ? (
                      <div className="bg-gray-50 p-4 rounded-2xl">
                        <p className="text-sm font-bold text-slate-700 leading-relaxed">{selectedTicket.respuesta}</p>
                        {selectedTicket.fecha_respuesta && (
                          <p className="text-[9px] text-slate-400 mt-2">Respondido el {formatDate(selectedTicket.fecha_respuesta)}</p>
                        )}
                      </div>
                    ) : canManageTickets ? (
                      <div>
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 block">
                          Tu respuesta *
                        </label>
                        <textarea
                          className="w-full p-3 rounded-xl bg-gray-50 border-none ring-1 ring-gray-100 focus:ring-2 focus:ring-brand-primary/20 outline-none text-xs font-bold min-h-25 resize-none"
                          placeholder="Escribe la solución al problema..."
                          id="respuestaTexto"
                        />
                        <button
                          onClick={() => {
                            const textarea = document.getElementById('respuestaTexto') as HTMLTextAreaElement;
                            handleResponder(selectedTicket, textarea.value);
                          }}
                          disabled={updatingStatus}
                          className="mt-4 w-full py-3 rounded-xl bg-brand-primary text-white text-[10px] font-black uppercase tracking-widest flex items-center justify-center gap-2 disabled:opacity-50"
                        >
                          {updatingStatus ? <Loader2 className="h-3 w-3 animate-spin" /> : <Send className="h-3 w-3" />}
                          Enviar Respuesta y Resolver
                        </button>
                      </div>
                    ) : (
                      <div className="bg-amber-50 p-4 rounded-xl text-center">
                        <AlertCircle className="h-6 w-6 text-amber-600 mx-auto mb-2" />
                        <p className="text-xs font-bold text-amber-800">Este ticket aún no tiene respuesta</p>
                        <p className="text-[9px] text-amber-700 mt-1">El equipo de soporte atenderá tu solicitud próximamente.</p>
                      </div>
                    )}
                  </div>
                )}
              </div>

              <div className="p-6 bg-gray-50/50 border-t border-gray-100">
                <button 
                  onClick={closeModal}
                  className="w-full py-3 rounded-xl bg-white border border-gray-200 text-slate-500 text-[10px] font-black uppercase tracking-widest hover:bg-gray-100 transition-all"
                >
                  Cerrar Ventana
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ==================== ALERT MODAL GLOBAL ==================== */}
      <AlertModal
        isOpen={modalState.isOpen}
        onClose={closeModalAlert}
        title={modalState.title}
        message={modalState.message}
        type={modalState.type}
        showInput={modalState.showInput}
        inputPlaceholder={modalState.inputPlaceholder}
        cancelText={modalState.cancelText}
        confirmText={modalState.confirmText}
        onConfirm={modalState.onConfirm || (() => closeModalAlert())}
      />
    </div>
  );
};