// components/dashboard/admin/Alertas.tsx
"use client";

import React, { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  LifeBuoy, AlertCircle, 
  ExternalLink, Send, 
  Clock, User, 
  X, Loader2, ChevronLeft, ChevronRight
} from "lucide-react";
import { cn } from "@/app/lib/utils";
import { supabase } from "@/app/lib/supabaseClient";
import { useAuth } from "@/context/AuthContext";

// Componentes Reutilizables
const CardContainer = ({ children, className = "" }: { children: React.ReactNode; className?: string }) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    className={`bg-white p-8 rounded-[2.5rem] border border-gray-100 shadow-sm hover:shadow-md transition-all ${className}`}
  >
    {children}
  </motion.div>
);

const SectionHeader = ({ icon: Icon, title, subtitle }: any) => (
  <div className="flex items-center gap-4 mb-8">
    <div className="h-12 w-12 rounded-2xl bg-brand-primary/10 flex items-center justify-center text-brand-primary">
      <Icon size={24} />
    </div>
    <div>
      <h3 className="text-sm font-black text-slate-800 uppercase italic tracking-tight">{title}</h3>
      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{subtitle}</p>
    </div>
  </div>
);

interface Ticket {
  id_soporte: number;
  id_usuario: string;
  problema: string;
  evidencia_url: string | null;
  estatus: "pendiente" | "en revision" | "resuelto";
  respuesta: string | null;
  fecha_creacion: string;
  fecha_respuesta: string | null;
  usuario_nombre?: string;
  usuario_apellido?: string;
  usuario_rol?: string;
}

export const Alertas = () => {
  const { user } = useAuth();

  // Estados para tickets
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null);
  const [modalType, setModalType] = useState<"descripcion" | "respuesta" | null>(null);
  const [updatingStatus, setUpdatingStatus] = useState(false);
  const [respuestaTexto, setRespuestaTexto] = useState("");

  // Paginación
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  // Determinar si es admin o director
  const [esAdmin, setEsAdmin] = useState(false);
  const [esDirector, setEsDirector] = useState(false);

  // Verificar permisos del usuario actual
  const verificarPermisos = useCallback(async () => {
    if (!user?.id) return;
    
    try {
      const { data, error } = await supabase
        .from("perfil_usuario")
        .select(`
          id_rol,
          rol_usuario!inner (
            nombre_rol
          )
        `)
        .eq("id_usuario", user.id)
        .single();

      if (error) {
        console.error("Error verificando permisos:", error);
        return;
      }

      const rolNombre = data?.rol_usuario?.nombre_rol || "";
      
      // Admin: id_rol 1, 2, 3
      const adminRoles = [1, 2, 3];
      setEsAdmin(adminRoles.includes(data?.id_rol));
      
      // Director: rol que empieza con "director_"
      setEsDirector(rolNombre?.startsWith("director_") || false);

      console.log("🔍 Permisos del usuario:", {
        id_rol: data?.id_rol,
        rol_nombre: rolNombre,
        esAdmin: adminRoles.includes(data?.id_rol),
        esDirector: rolNombre?.startsWith("director_")
      });

    } catch (error) {
      console.error("Error verificando permisos:", error);
    }
  }, [user]);

  // Cargar tickets con datos de usuario
  const cargarTickets = useCallback(async () => {
    if (!user) {
      console.warn("⚠️ Usuario no autenticado");
      return;
    }
    
    setLoading(true);
    try {
      console.log("🔍 Cargando tickets para usuario:", user.id);

      // Primero obtener los tickets
      let query = supabase
        .from("soporte")
        .select("*")
        .order("fecha_creacion", { ascending: false });

      // Si es admin o director, ve todos los tickets
      // Si no, solo sus propios tickets (la política RLS se encarga)
      
      const { data: ticketsData, error: ticketsError } = await query;
      
      if (ticketsError) {
        console.error("❌ Error en consulta de tickets:", ticketsError);
        throw ticketsError;
      }

      console.log("📋 Tickets obtenidos:", ticketsData?.length || 0);

      if (!ticketsData || ticketsData.length === 0) {
        setTickets([]);
        setLoading(false);
        return;
      }

      // Obtener IDs de usuarios únicos
      const userIds = [...new Set(ticketsData.map((t) => t.id_usuario))];
      console.log("👥 Usuarios a buscar:", userIds);

      // Obtener perfiles de usuarios
      const { data: perfilesData, error: perfilesError } = await supabase
        .from("perfil_usuario")
        .select(`
          id_usuario, 
          nombre, 
          apellido, 
          id_rol,
          rol_usuario!inner (
            id_rol,
            nombre_rol,
            ambito
          )
        `)
        .in("id_usuario", userIds);

      if (perfilesError) {
        console.error("❌ Error en consulta de perfiles:", perfilesError);
        throw perfilesError;
      }

      console.log("👤 Perfiles obtenidos:", perfilesData?.length || 0);

      // Crear mapa de perfiles
      const perfilMap = new Map();
      perfilesData?.forEach((p) => {
        perfilMap.set(p.id_usuario, {
          nombre: p.nombre || "",
          apellido: p.apellido || "",
          rol: p.rol_usuario?.nombre_rol || "Sin rol",
          id_rol: p.id_rol,
        });
      });

      // Mapear tickets con información de usuario
      const ticketsConUsuario: Ticket[] = ticketsData.map((ticket) => {
        const perfil = perfilMap.get(ticket.id_usuario);
        return {
          ...ticket,
          usuario_nombre: perfil?.nombre || "Desconocido",
          usuario_apellido: perfil?.apellido || "",
          usuario_rol: perfil?.rol || "Sin rol",
        };
      });

      console.log("✅ Tickets procesados:", ticketsConUsuario.length);
      setTickets(ticketsConUsuario);
      setCurrentPage(1);
    } catch (error: any) {
      console.error("❌ Error cargando tickets:", error);
      alert("Error al cargar tickets: " + error.message);
    } finally {
      setLoading(false);
    }
  }, [user]);

  // Cargar permisos y tickets al inicio
  useEffect(() => {
    if (user) {
      verificarPermisos();
      cargarTickets();
    }
  }, [user, verificarPermisos, cargarTickets]);

  // Suscripción en tiempo real
  useEffect(() => {
    if (!user) return;

    const channel = supabase
      .channel("soporte-changes-a")
      .on(
        "postgres_changes", 
        { event: "*", schema: "public", table: "soporte" }, 
        () => {
          console.log("🔄 Cambio detectado en soporte, recargando...");
          cargarTickets();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, cargarTickets]);

  // Actualizar estado del ticket
  const actualizarEstado = async (nuevoEstatus: "pendiente" | "en revision" | "resuelto") => {
    if (!selectedTicket) return;
    
    // Verificar permisos
    if (!esAdmin && !esDirector) {
      alert("No tienes permisos para cambiar el estado de este ticket");
      return;
    }
    
    setUpdatingStatus(true);
    try {
      const { error } = await supabase
        .from("soporte")
        .update({
          estatus: nuevoEstatus,
          updated_at: new Date().toISOString(),
          ...(nuevoEstatus === "resuelto" && { fecha_respuesta: new Date().toISOString() }),
        })
        .eq("id_soporte", selectedTicket.id_soporte);

      if (error) {
        console.error("❌ Error actualizando estado:", error);
        throw error;
      }

      setSelectedTicket({ ...selectedTicket, estatus: nuevoEstatus });
      await cargarTickets();
      alert(`✅ Estado actualizado a "${nuevoEstatus}"`);
    } catch (error: any) {
      console.error("❌ Error al actualizar estado:", error);
      alert("Error al actualizar estado: " + error.message);
    } finally {
      setUpdatingStatus(false);
    }
  };

  // Responder ticket
  const handleResponder = async () => {
    if (!selectedTicket) return;
    
    // Verificar permisos
    if (!esAdmin && !esDirector) {
      alert("No tienes permisos para responder este ticket");
      return;
    }
    
    if (!respuestaTexto.trim()) {
      alert("Escribe una respuesta.");
      return;
    }
    
    setUpdatingStatus(true);
    try {
      const { error } = await supabase
        .from("soporte")
        .update({
          respuesta: respuestaTexto,
          estatus: "resuelto",
          fecha_respuesta: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .eq("id_soporte", selectedTicket.id_soporte);

      if (error) {
        console.error("❌ Error enviando respuesta:", error);
        throw error;
      }

      alert("✅ Respuesta enviada. Ticket resuelto.");
      setRespuestaTexto("");
      closeModal();
      await cargarTickets();
    } catch (error: any) {
      console.error("❌ Error al responder:", error);
      alert("Error al responder: " + error.message);
    } finally {
      setUpdatingStatus(false);
    }
  };

  const openModal = (ticket: Ticket, type: "descripcion" | "respuesta") => {
    setSelectedTicket(ticket);
    setModalType(type);
    if (type === "respuesta") setRespuestaTexto(ticket.respuesta || "");
  };

  const closeModal = () => {
    setSelectedTicket(null);
    setModalType(null);
    setRespuestaTexto("");
  };

  const totalPages = Math.ceil(tickets.length / itemsPerPage);
  const paginatedTickets = tickets.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString("es-ES", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  // Verificar si puede gestionar tickets (admin o director)
  const puedeGestionarTickets = esAdmin || esDirector;

  return (
    <div className="space-y-8 p-4 md:p-0">
      {/* HEADER PRINCIPAL */}
      <div className="bg-white p-8 rounded-[2.5rem] border border-gray-100 shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <h2 className="text-xl font-black text-slate-800 italic uppercase tracking-tighter flex items-center gap-3">
              <LifeBuoy className="h-6 w-6 text-brand-primary" /> Centro de Soporte
            </h2>
            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-[0.2em] mt-1">
              Mesa de Ayuda y Asistencia Técnica
            </p>
            <div className="flex items-center gap-2 mt-2">
              <span className={cn(
                "text-[8px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full",
                puedeGestionarTickets 
                  ? "bg-emerald-100 text-emerald-700"
                  : "bg-slate-100 text-slate-500"
              )}>
                {puedeGestionarTickets ? "👑 Gestor de tickets" : "👤 Usuario"}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">
              {tickets.length} {tickets.length === 1 ? 'ticket' : 'tickets'}
            </span>
          </div>
        </div>
      </div>

      {/* BANDEJA DE INCIDENCIAS */}
      <CardContainer>
        <SectionHeader icon={AlertCircle} title="Incidencias" subtitle="Seguimiento de reportes" />

        {loading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="h-6 w-6 animate-spin text-brand-primary" />
          </div>
        ) : tickets.length === 0 ? (
          <div className="text-center py-12">
            <AlertCircle className="h-12 w-12 text-slate-200 mx-auto mb-3" />
            <p className="text-sm font-bold text-slate-400">No hay tickets registrados</p>
            <p className="text-[10px] text-slate-300 mt-1">Los tickets de soporte aparecerán aquí</p>
          </div>
        ) : (
          <>
            <div className="space-y-3">
              {paginatedTickets.map((ticket) => (
                <div
                  key={ticket.id_soporte}
                  className="group flex items-center justify-between p-4 rounded-2xl border border-gray-50 hover:border-brand-primary/20 hover:bg-brand-primary/5 transition-all cursor-pointer"
                  onClick={() => openModal(ticket, "descripcion")}
                >
                  <div className="flex items-center gap-4 flex-1">
                    <div
                      className={`h-2 w-2 rounded-full ${
                        ticket.estatus === "pendiente"
                          ? "bg-red-500 animate-pulse"
                          : ticket.estatus === "en revision"
                          ? "bg-amber-500"
                          : "bg-emerald-500"
                      }`}
                    />
                    <div className="flex-1">
                      <p className="text-[11px] font-black text-slate-800 uppercase italic line-clamp-1">
                        {ticket.problema}
                      </p>
                      <div className="flex flex-wrap gap-3 mt-1">
                        <span className="text-[9px] font-bold text-slate-400 uppercase tracking-tighter flex items-center gap-1">
                          <Clock size={10} /> {formatDate(ticket.fecha_creacion)}
                        </span>
                        <span className="text-[9px] font-bold text-slate-400 uppercase tracking-tighter flex items-center gap-1">
                          <User size={10} /> {ticket.usuario_nombre} {ticket.usuario_apellido} 
                        </span>
                        <span className="text-[8px] font-bold text-brand-primary uppercase px-2 py-0.5 rounded bg-brand-primary/10">
                          {ticket.usuario_rol}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span
                      className={`px-3 py-1 rounded-lg text-[8px] font-black uppercase italic ${
                        ticket.estatus === "pendiente"
                          ? "bg-amber-100 text-amber-600"
                          : ticket.estatus === "en revision"
                          ? "bg-blue-100 text-blue-600"
                          : "bg-emerald-100 text-emerald-600"
                      }`}
                    >
                      {ticket.estatus}
                    </span>
                    {/* Botón para ver respuesta si existe */}
                    {ticket.respuesta && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          openModal(ticket, "respuesta");
                        }}
                        className="p-2 rounded-lg bg-brand-primary/5 text-brand-primary hover:bg-brand-primary hover:text-white transition-all"
                        title="Ver respuesta"
                      >
                        <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
                        </svg>
                      </button>
                    )}
                    {/* Botón para responder (solo admin/director y si no está resuelto) */}
                    {puedeGestionarTickets && ticket.estatus !== "resuelto" && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          openModal(ticket, "respuesta");
                        }}
                        className="p-2 rounded-lg bg-amber-50 text-amber-600 hover:bg-amber-100 transition-all"
                        title="Responder ticket"
                      >
                        <Send size={14} />
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>

            {totalPages > 1 && (
              <div className="flex justify-center items-center gap-3 mt-8 pt-4 border-t border-gray-100">
                <button
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                  className="p-2 rounded-xl bg-gray-100 text-slate-500 hover:bg-brand-primary/10 disabled:opacity-40 transition-all"
                >
                  <ChevronLeft size={16} />
                </button>
                <span className="text-[10px] font-black text-slate-400 uppercase">
                  Página {currentPage} de {totalPages}
                </span>
                <button
                  onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                  disabled={currentPage === totalPages}
                  className="p-2 rounded-xl bg-gray-100 text-slate-500 hover:bg-brand-primary/10 disabled:opacity-40 transition-all"
                >
                  <ChevronRight size={16} />
                </button>
              </div>
            )}
          </>
        )}
      </CardContainer>

      {/* MODAL PARA VER DESCRIPCIÓN O RESPONDER */}
      <AnimatePresence>
        {selectedTicket && modalType && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={closeModal}
              className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="relative w-full max-w-lg bg-white rounded-3xl shadow-2xl overflow-hidden"
            >
              <div className="p-6 border-b border-gray-100 flex justify-between items-center">
                <h3 className="text-sm font-black uppercase tracking-wider">
                  {modalType === "descripcion" ? "Detalle de la Incidencia" : "Responder Ticket"}
                </h3>
                <button onClick={closeModal} className="p-1 rounded-lg hover:bg-gray-100">
                  <X size={18} />
                </button>
              </div>

              <div className="p-6 space-y-4">
                {modalType === "descripcion" ? (
                  <>
                    <div className="bg-brand-primary/5 p-3 rounded-xl flex items-center gap-3">
                      <User size={18} className="text-brand-primary" />
                      <div>
                        <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Reportado por</p>
                        <p className="text-sm font-black text-slate-800">
                          {selectedTicket.usuario_nombre} {selectedTicket.usuario_apellido}
                        </p>
                        <p className="text-[9px] font-bold text-brand-primary uppercase">{selectedTicket.usuario_rol}</p>
                      </div>
                    </div>

                    {/* Selector de estado para admin/director */}
                    {puedeGestionarTickets && (
                      <div className="bg-gray-50 p-4 rounded-xl">
                        <label className="text-[10px] font-bold text-slate-400 uppercase block mb-2">Estado del ticket</label>
                        <div className="flex gap-2">
                          <select
                            value={selectedTicket.estatus}
                            onChange={(e) => actualizarEstado(e.target.value as any)}
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
                        <a
                          href={selectedTicket.evidencia_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-xs text-brand-primary font-bold underline flex items-center gap-1"
                        >
                          Ver archivo <ExternalLink size={12} />
                        </a>
                      </div>
                    )}

                    <div className="flex items-center gap-2 pt-2">
                      <span
                        className={`text-[9px] font-black uppercase px-2 py-1 rounded-full ${
                          selectedTicket.estatus === "pendiente"
                            ? "bg-amber-100 text-amber-600"
                            : selectedTicket.estatus === "en revision"
                            ? "bg-blue-100 text-blue-600"
                            : "bg-emerald-100 text-emerald-600"
                        }`}
                      >
                        {selectedTicket.estatus}
                      </span>
                      <span className="text-[9px] text-slate-400">Creado el {formatDate(selectedTicket.fecha_creacion)}</span>
                    </div>
                  </>
                ) : (
                  // Modal de respuesta
                  <div>
                    {selectedTicket.respuesta ? (
                      <div className="bg-gray-50 p-4 rounded-2xl">
                        <p className="text-sm font-bold text-slate-700 leading-relaxed">{selectedTicket.respuesta}</p>
                        {selectedTicket.fecha_respuesta && (
                          <p className="text-[9px] text-slate-400 mt-2">Respondido el {formatDate(selectedTicket.fecha_respuesta)}</p>
                        )}
                      </div>
                    ) : puedeGestionarTickets ? (
                      <div>
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 block">
                          Tu respuesta *
                        </label>
                        <textarea
                          className="w-full p-3 rounded-xl bg-gray-50 border-none ring-1 ring-gray-100 focus:ring-2 focus:ring-brand-primary/20 outline-none text-xs font-bold min-h-25 resize-none"
                          placeholder="Escribe la solución al problema..."
                          value={respuestaTexto}
                          onChange={(e) => setRespuestaTexto(e.target.value)}
                        />
                        <button
                          onClick={handleResponder}
                          disabled={updatingStatus}
                          className="mt-4 w-full py-3 rounded-xl bg-brand-primary text-white text-[10px] font-black uppercase tracking-widest flex items-center justify-center gap-2 disabled:opacity-50"
                        >
                          {updatingStatus ? <Loader2 className="h-3 w-3 animate-spin" /> : <Send className="h-3 w-3" />}
                          Enviar Respuesta y Resolver
                        </button>
                      </div>
                    ) : (
                      <div className="text-center text-slate-500">
                        <AlertCircle className="h-8 w-8 text-slate-300 mx-auto mb-2" />
                        <p className="text-sm font-bold">No hay respuesta disponible</p>
                        <p className="text-[10px] mt-1">El ticket está siendo revisado por el equipo de soporte</p>
                      </div>
                    )}
                  </div>
                )}
              </div>

              <div className="p-6 bg-gray-50 border-t border-gray-100">
                <button
                  onClick={closeModal}
                  className="w-full py-3 rounded-xl bg-white border border-gray-200 text-slate-500 text-[10px] font-black uppercase tracking-widest hover:bg-gray-100 transition-all"
                >
                  Cerrar
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};