"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  XCircle,
  Search,
  ShieldCheck,
  Loader2,
  ThumbsUp,
  ThumbsDown,
  Building2,
  Users,
  Home,
} from "lucide-react";
import { cn } from "@/app/lib/utils";
import { supabase } from "@/app/lib/supabaseClient";
import { AlertModal } from "../../../AlertModal";

interface SolicitudValidacion {
  id_instancia: number;
  id_usuario: string;
  nombre_instancia: string;
  tipo_instancia: "consejo_comunal" | "comuna" | "sala_autogobierno";
  motivo_rechazo: string | null;
  created_at: string;
  email: string;
  nombre_completo: string;
  activo: boolean;
}

const getTipoIcon = (tipo: string) => {
  switch (tipo) {
    case "consejo_comunal":
      return Users;
    case "comuna":
      return Building2;
    case "sala_autogobierno":
      return Home;
    default:
      return ShieldCheck;
  }
};

const getTipoLabel = (tipo: string) => {
  switch (tipo) {
    case "consejo_comunal":
      return "Consejo Comunal";
    case "comuna":
      return "Comuna";
    case "sala_autogobierno":
      return "Sala de Autogobierno";
    default:
      return tipo;
  }
};

export const Validacion = () => {
  const [solicitudes, setSolicitudes] = useState<SolicitudValidacion[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [updatingId, setUpdatingId] = useState<number | null>(null);

  const [modalConfig, setModalConfig] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    type?: "info" | "success" | "warning" | "danger";
    showInput?: boolean;
    inputPlaceholder?: string;
    confirmText?: string;
    onConfirm?: (inputValue?: string) => void;
  }>({
    isOpen: false,
    title: "",
    message: "",
    type: "info",
  });

  const closeModal = () =>
    setModalConfig((prev) => ({ ...prev, isOpen: false }));

  useEffect(() => {
    fetchSolicitudes();
  }, []);

  const fetchSolicitudes = async () => {
    setLoading(true);
    try {
      // Obtener todas las instancias
      const [consejosRes, comunasRes, salasRes] = await Promise.all([
        supabase.from("datos_consejo_comunal").select("*"),
        supabase.from("datos_comuna").select("*"),
        supabase.from("datos_sala_autogobierno").select("*"),
      ]);

      const userIds: string[] = [];
      const rawItems: any[] = [];

      const addItems = (
        data: any[],
        tipo: string,
        idCol: string,
        nombreCol: string,
      ) => {
        (data || []).forEach((item) => {
          if (item.id_usuario) {
            userIds.push(item.id_usuario);
            rawItems.push({
              id_instancia: item[idCol],
              id_usuario: item.id_usuario,
              nombre_instancia: item[nombreCol] || "Sin nombre",
              tipo_instancia: tipo,
              motivo_rechazo: item.motivo_rechazo || null,
              created_at: item.created_at || new Date().toISOString(),
            });
          }
        });
      };

      addItems(
        consejosRes.data,
        "consejo_comunal",
        "id_consejo",
        "nombre_consejo",
      );
      addItems(comunasRes.data, "comuna", "id_comuna", "nombre_comuna");
      addItems(
        salasRes.data,
        "sala_autogobierno",
        "id_sala_autogobierno",
        "nombre_sala",
      );

      // Obtener perfiles de todos los usuarios involucrados
      let perfilesMap: Record<
        string,
        { email: string; nombre_completo: string; activo: boolean }
      > = {};
      if (userIds.length > 0) {
        const { data: perfiles, error: perfilesError } = await supabase
          .from("perfil_usuario")
          .select("id_usuario, email, nombre, apellido, activo")
          .in("id_usuario", userIds);
        if (!perfilesError && perfiles) {
          perfilesMap = perfiles.reduce(
            (acc, p) => {
              acc[p.id_usuario] = {
                email: p.email || "sin-email",
                nombre_completo:
                  `${p.nombre || ""} ${p.apellido || ""}`.trim() || "Usuario",
                activo: p.activo ?? false,
              };
              return acc;
            },
            {} as Record<
              string,
              { email: string; nombre_completo: string; activo: boolean }
            >,
          );
        }
      }

      // Construir lista final y filtrar solo inactivos
      const solicitudesFinal: SolicitudValidacion[] = rawItems
        .map((item) => {
          const perfil = perfilesMap[item.id_usuario] || {
            email: "sin-email",
            nombre_completo: "Usuario desconocido",
            activo: false,
          };
          return {
            id_instancia: item.id_instancia,
            id_usuario: item.id_usuario,
            nombre_instancia: item.nombre_instancia,
            tipo_instancia: item.tipo_instancia,
            motivo_rechazo: item.motivo_rechazo,
            created_at: item.created_at,
            email: perfil.email,
            nombre_completo: perfil.nombre_completo,
            activo: perfil.activo,
          };
        })
        .filter((item) => !item.activo); // Solo inactivos

      setSolicitudes(solicitudesFinal);
    } catch (err) {
      console.error("Error en fetchSolicitudes:", err);
      setModalConfig({
        isOpen: true,
        title: "Error",
        message: "No se pudieron cargar las solicitudes. Intente nuevamente.",
        type: "danger",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleAprobar = async (solicitud: SolicitudValidacion) => {
    setUpdatingId(solicitud.id_instancia);
    try {
      const { data, error: fnError } = await supabase.functions.invoke(
        "validate-user",
        {
          body: {
            userId: solicitud.id_usuario,
            action: "aprobar",
          },
        },
      );
      if (fnError) throw fnError;
      if (data?.error) throw new Error(data.error);

      await fetchSolicitudes();
      setModalConfig({
        isOpen: true,
        title: "¡Aprobado!",
        message:
          data?.message ||
          `El usuario "${solicitud.nombre_completo}" ha sido activado. Recibirá un correo de notificación.`,
        type: "success",
      });
    } catch (err: any) {
      console.error("Error activando usuario:", err);
      setModalConfig({
        isOpen: true,
        title: "Error al activar usuario",
        message: err.message || "No se pudo activar el usuario.",
        type: "danger",
      });
    } finally {
      setUpdatingId(null);
    }
  };

  const handleRechazar = async (
    solicitud: SolicitudValidacion,
    motivo?: string,
  ) => {
    if (!motivo?.trim()) {
      setModalConfig({
        isOpen: true,
        title: "Motivo Requerido",
        message: "Debe escribir un motivo para rechazar la solicitud.",
        type: "warning",
      });
      return;
    }

    setUpdatingId(solicitud.id_instancia);
    try {
      const { data, error: fnError } = await supabase.functions.invoke(
        "validate-user",
        {
          body: {
            userId: solicitud.id_usuario,
            action: "rechazar",
            motivo: motivo.trim(),
            tipoInstancia: solicitud.tipo_instancia,
            idInstancia: solicitud.id_instancia,
          },
        },
      );
      if (fnError) throw fnError;
      if (data?.error) throw new Error(data.error);

      await fetchSolicitudes();
      setModalConfig({
        isOpen: true,
        title: "Rechazado",
        message: data?.message || "Se ha registrado el rechazo correctamente.",
        type: "info",
      });
    } catch (err: any) {
      console.error("Error al rechazar:", err);
      setModalConfig({
        isOpen: true,
        title: "Error",
        message: err.message || "No se pudo procesar el rechazo.",
        type: "danger",
      });
    } finally {
      setUpdatingId(null);
    }
  };

  const triggerRechazoModal = (solicitud: SolicitudValidacion) => {
    setModalConfig({
      isOpen: true,
      title: "Rechazar Solicitud",
      message: "Indique el motivo del rechazo:",
      type: "warning",
      showInput: true,
      inputPlaceholder: "Ej. Datos inconsistentes...",
      confirmText: "Rechazar",
      onConfirm: (inputValue) => handleRechazar(solicitud, inputValue),
    });
  };

  // Filtro de búsqueda
  const filteredItems = solicitudes.filter((item) => {
    const matchesSearch =
      item.nombre_instancia.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.nombre_completo.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesSearch;
  });

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[400px]">
        <Loader2 className="animate-spin text-brand-primary h-8 w-8" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
            <ShieldCheck className="h-6 w-6 text-brand-primary" />
            Validación de Registros
          </h2>
          <p className="text-xs text-slate-500">
            Revisa y activa las cuentas de nuevos actores comunales
          </p>
        </div>

        {/* Eliminado el filtro de estado */}
      </div>

      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
        <input
          type="text"
          placeholder="Buscar por nombre o responsable..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full pl-10 pr-4 py-2 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-brand-primary/20 focus:border-brand-primary"
        />
      </div>

      <div className="space-y-3">
        <AnimatePresence mode="popLayout">
          {filteredItems.map((item) => {
            const TipoIcon = getTipoIcon(item.tipo_instancia);

            return (
              <motion.div
                key={`${item.tipo_instancia}-${item.id_instancia}`}
                layout
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="bg-white rounded-xl border border-slate-200 p-4 hover:shadow-md transition-all"
              >
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="font-semibold text-slate-900">
                        {item.nombre_instancia}
                      </h3>
                    </div>
                    <div className="flex items-center gap-3 text-xs text-slate-500 mt-1">
                      <span className="flex items-center gap-1">
                        <TipoIcon className="h-3 w-3" />
                        {getTipoLabel(item.tipo_instancia)}
                      </span>
                      <span>•</span>
                      <span>Responsable: {item.nombre_completo}</span>
                    </div>
                    <p className="text-xs text-slate-400 mt-1">
                      Registrado:{" "}
                      {new Date(item.created_at).toLocaleDateString()}
                    </p>
                    {item.motivo_rechazo && (
                      <p className="text-xs text-rose-600 mt-1 flex items-center gap-1">
                        <XCircle className="h-3 w-3" />
                        Motivo: {item.motivo_rechazo}
                      </p>
                    )}
                  </div>

                  {/* Siempre mostramos los botones porque solo hay inactivos */}
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleAprobar(item)}
                      disabled={updatingId === item.id_instancia}
                      className="px-4 py-2 rounded-lg bg-emerald-500 text-white text-sm font-medium hover:bg-emerald-600 transition-colors disabled:opacity-50 flex items-center gap-2"
                    >
                      <ThumbsUp className="h-4 w-4" />
                      Activar
                    </button>
                    <button
                      onClick={() => triggerRechazoModal(item)}
                      disabled={updatingId === item.id_instancia}
                      className="px-4 py-2 rounded-lg border border-rose-200 text-rose-600 text-sm font-medium hover:bg-rose-50 transition-colors disabled:opacity-50 flex items-center gap-2"
                    >
                      <ThumbsDown className="h-4 w-4" />
                      Rechazar
                    </button>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </AnimatePresence>

        {filteredItems.length === 0 && (
          <div className="text-center py-12">
            <div className="inline-flex h-12 w-12 items-center justify-center rounded-full bg-slate-100 text-slate-400 mb-3">
              <Search className="h-6 w-6" />
            </div>
            <h3 className="text-sm font-medium text-slate-700">
              No hay solicitudes pendientes
            </h3>
            <p className="text-xs text-slate-500 mt-1">
              Todos los usuarios han sido activados
            </p>
          </div>
        )}
      </div>

      <AlertModal
        isOpen={modalConfig.isOpen}
        onClose={closeModal}
        title={modalConfig.title}
        message={modalConfig.message}
        type={modalConfig.type}
        showInput={modalConfig.showInput}
        inputPlaceholder={modalConfig.inputPlaceholder}
        confirmText={modalConfig.confirmText}
        onConfirm={modalConfig.onConfirm}
      />
    </div>
  );
};
