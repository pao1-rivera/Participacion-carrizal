'use client';

import React, { useState, useEffect, useCallback } from 'react';
import {
  FileCheck, Download, ShieldCheck, Clock, ExternalLink, Eye,
  CheckCircle2, TrendingUp, Target, FileText, Filter, RefreshCw,
  DollarSign, Calendar, ThumbsUp, FileSignature, Users, X,
  AlertCircle, Trash2, ChevronLeft, Loader2, MessageSquare, Edit,
  Receipt, Layers, UserCheck, ArrowLeft, Plus, Building2
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/app/lib/utils';
import { supabase } from '@/app/lib/supabaseClient';
import { useAuth } from '@/context/AuthContext';
import { AlertModal } from '@/app/components/AlertModal';

// ============================================
// TIPOS
// ============================================
interface Proyecto {
  id_proyecto: number;
  nombre: string;
  codigo?: string;
  categoria_7t?: string;
  ente_financiamiento?: string;
  presupuesto?: number;
  estado?: string;
  duracion?: string;
  id_consejo?: number;
  id_comuna?: number;
  instancia_nombre?: string;
}

interface SolicitudProrroga {
  id_solicitud: number;
  id_proyecto: number;
  id_consejo: number;
  motivo: string;
  presupuesto_estimado: number;
  tiempo_estimado: string;
  acta_url: string;
  evidencia_url: string;
  id_voceros_firmantes: number[];
  estado: 'pendiente' | 'aprobada' | 'rechazada';
  respuesta?: string;
  nuevo_presupuesto?: number;
  nuevo_plazo?: string;
  created_at: string;
  proyecto?: Proyecto;
}

interface Rendicion {
  id_rendicion: number;
  id_proyecto: number;
  id_consejo?: number | null;
  id_comuna?: number | null;
  categoria_seleccionada: string;
  fecha_inicio: string;
  fecha_fin: string;
  ingresos: number;
  egresos: number;
  id_voceros_firmantes: number[];
  fotos_evidencia_urls: string[];
  informe_gestion: string;
  acta_asamblea_url: string | null;
  facturas_legales_url: string | null;
  informe_contraloria_url: string | null;
  estado_cuenta_url: string | null;
  acepto_terminos: boolean;
  created_at: string;
  proyecto?: Proyecto | null;
  tipo?: 'consejo' | 'comuna';
  instancia_nombre?: string;
}

interface Vocero {
  id_vocero: number;
  nombre_completo: string;
  cedula: string;
}

// ============================================
// FUNCIONES PARA GENERAR URLs DE DOCUMENTOS
// ============================================
const cleanPath = (path: string): string => {
  if (!path) return '';

  let cleaned = path.trim();

  if (cleaned.startsWith('[') && cleaned.endsWith(']')) {
    try {
      const parsed = JSON.parse(cleaned);
      if (Array.isArray(parsed) && parsed.length > 0) {
        cleaned = parsed[0];
      } else if (typeof parsed === 'string') {
        cleaned = parsed;
      }
    } catch {
      const match = cleaned.match(/^\[\s*"([^"]+)"\s*\]$/);
      if (match) cleaned = match[1];
    }
  }

  cleaned = cleaned.replace(/^\[|\]$/g, '').replace(/^"|"$/g, '').trim();
  cleaned = cleaned.replace(/^["']|["']$/g, '');
  return cleaned;
};

// Obtener URL pública (bucket público, sin firma)
const getPublicDocumentUrl = (bucket: string, path: string): string | null => {
  const cleaned = cleanPath(path);
  if (!cleaned) return null;
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://dqpuwdgfunwzrejkjmhi.supabase.co';
  return `${supabaseUrl}/storage/v1/object/public/${bucket}/${cleaned}`;
};

// Obtener URL firmada (bucket privado)
const getSignedUrlForDocument = async (bucket: string, path: string): Promise<string | null> => {
  const cleaned = cleanPath(path);
  if (!cleaned) return null;

  let relativePath = cleaned;
  const publicPattern = new RegExp(`/storage/v1/object/public/${bucket}/`);
  if (publicPattern.test(cleaned)) {
    relativePath = cleaned.split(`/storage/v1/object/public/${bucket}/`)[1];
  } else if (cleaned.startsWith('http')) {
    const match = cleaned.match(/\/storage\/v1\/object\/public\/[^/]+\/(.+)$/);
    if (match) relativePath = match[1];
    else return cleaned;
  }

  relativePath = relativePath.replace(/\s/g, '');

  try {
    const { data, error } = await supabase.storage
      .from(bucket)
      .createSignedUrl(relativePath, 60 * 5);
    if (error) {
      console.error(`Error generando URL firmada para ${bucket} (${relativePath}):`, error.message);
      return cleaned;
    }
    return data.signedUrl;
  } catch (err) {
    console.error(`Excepción en getSignedUrlForDocument:`, err);
    return cleaned;
  }
};

// ============================================
// COMPONENTE PRINCIPAL
// ============================================
export const RendicionCuentas = () => {
  const { user } = useAuth();
  const [consejoId, setConsejoId] = useState<number | null>(null);
  const [comunaId, setComunaId] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [initialLoading, setInitialLoading] = useState(true);
  const [activeView, setActiveView] = useState<'prorrogas' | 'rendicion'>('prorrogas');
  const [isSuperUser, setIsSuperUser] = useState(false);
  const [isRoleSuperior, setIsRoleSuperior] = useState(false);
  const [nivelJerarquia, setNivelJerarquia] = useState(0);

  const [solicitudes, setSolicitudes] = useState<SolicitudProrroga[]>([]);
  const [rendiciones, setRendiciones] = useState<Rendicion[]>([]);
  const [proyectos, setProyectos] = useState<Proyecto[]>([]);
  const [vocerosConsejo, setVocerosConsejo] = useState<Vocero[]>([]);
  const [vocerosComuna, setVocerosComuna] = useState<Vocero[]>([]);

  const [prorrogasPage, setProrrogasPage] = useState(1);
  const [rendicionesPage, setRendicionesPage] = useState(1);
  const itemsPerPage = 5;

  const [modalProrrogaOpen, setModalProrrogaOpen] = useState(false);
  const [selectedProrroga, setSelectedProrroga] = useState<SolicitudProrroga | null>(null);
  const [modalRendicionOpen, setModalRendicionOpen] = useState(false);
  const [selectedRendicion, setSelectedRendicion] = useState<Rendicion | null>(null);

  const [alert, setAlert] = useState<{ open: boolean; title: string; message: string; type: string }>({
    open: false, title: '', message: '', type: 'info'
  });

  useEffect(() => {
    const fetchUserRole = async () => {
      if (!user?.id) {
        setInitialLoading(false);
        return;
      }

      const { data: { user: userData } } = await supabase.auth.getUser();
      const appMetadata = userData?.app_metadata as any;
      const nivel = appMetadata?.nivel_jerarquia || 0;
      setNivelJerarquia(nivel);

      setIsSuperUser(nivel >= 5);
      setIsRoleSuperior(nivel <= 2);

      const { data: consejoData } = await supabase
        .from('datos_consejo_comunal')
        .select('id_consejo')
        .or(`id_usuario.eq.${user.id},id_usuario_auxiliar.eq.${user.id}`)
        .maybeSingle();
      if (consejoData) setConsejoId(consejoData.id_consejo);

      const { data: comunaData } = await supabase
        .from('datos_comuna')
        .select('id_comuna')
        .or(`id_usuario.eq.${user.id},id_usuario_auxiliar.eq.${user.id}`)
        .maybeSingle();
      if (comunaData) setComunaId(comunaData.id_comuna);

      setInitialLoading(false);
    };
    fetchUserRole();
  }, [user]);

  const cargarDatos = useCallback(async () => {
    setLoading(true);
    try {
      // Proyectos consejo
      let proyectosQuery = supabase.from('proyectos').select('*');
      if (!isSuperUser && !isRoleSuperior && consejoId) {
        proyectosQuery = proyectosQuery.eq('id_consejo', consejoId);
      }
      const { data: proyectosData, error: proyectosError } = await proyectosQuery;
      if (proyectosError) console.error('Error proyectos:', proyectosError);

      // Proyectos comuna
      let proyectosComunaQuery = supabase.from('proyectos_comuna').select('*');
      if (!isSuperUser && !isRoleSuperior && comunaId) {
        proyectosComunaQuery = proyectosComunaQuery.eq('id_comuna', comunaId);
      }
      const { data: proyectosComunaData, error: proyectosComunaError } = await proyectosComunaQuery;
      if (proyectosComunaError) console.error('Error proyectos comuna:', proyectosComunaError);

      // Mapas de nombres de instancias
      const consejoIds = [...new Set((proyectosData || []).map(p => p.id_consejo).filter(Boolean))];
      let consejoMap: Record<number, string> = {};
      if (consejoIds.length) {
        const { data: consejos, error: e } = await supabase
          .from('datos_consejo_comunal')
          .select('id_consejo, nombre_consejo')
          .in('id_consejo', consejoIds);
        if (!e && consejos) {
          consejoMap = Object.fromEntries(consejos.map(c => [c.id_consejo, c.nombre_consejo]));
        }
      }

      const comunaIds = [...new Set((proyectosComunaData || []).map(p => p.id_comuna).filter(Boolean))];
      let comunaMap: Record<number, string> = {};
      if (comunaIds.length) {
        const { data: comunas, error: e } = await supabase
          .from('datos_comuna')
          .select('id_comuna, nombre_comuna')
          .in('id_comuna', comunaIds);
        if (!e && comunas) {
          comunaMap = Object.fromEntries(comunas.map(c => [c.id_comuna, c.nombre_comuna]));
        }
      }

      const proyectosConNombre: Proyecto[] = (proyectosData || []).map(p => ({
        ...p,
        instancia_nombre: p.id_consejo ? consejoMap[p.id_consejo] || null : null
      }));
      const proyectosComunaConNombre: Proyecto[] = (proyectosComunaData || []).map(p => ({
        ...p,
        instancia_nombre: p.id_comuna ? comunaMap[p.id_comuna] || null : null
      }));
      const todosProyectos = [...proyectosConNombre, ...proyectosComunaConNombre];
      setProyectos(todosProyectos);

      // Solicitudes de prórroga (solo consejo)
      let solicitudesQuery = supabase
        .from('solicitudes_prorroga')
        .select(`
          *,
          proyecto:proyectos!solicitudes_prorroga_id_proyecto_fkey(
            id_proyecto, nombre, codigo, categoria_7t, ente_financiamiento, presupuesto, duracion, id_consejo
          )
        `);
      if (!isSuperUser && !isRoleSuperior && consejoId) {
        solicitudesQuery = solicitudesQuery.eq('id_consejo', consejoId);
      }
      const { data: solicitudesData, error: solicitudesError } = await solicitudesQuery.order('created_at', { ascending: false });
      if (solicitudesError) console.error('Error solicitudes:', solicitudesError);
      const solicitudesEnriquecidas = (solicitudesData || []).map(s => {
        if (s.proyecto && s.proyecto.id_consejo) {
          s.proyecto.instancia_nombre = consejoMap[s.proyecto.id_consejo] || null;
        }
        return s;
      });
      setSolicitudes(solicitudesEnriquecidas);

      // Rendiciones
      const rendicionesConTipo: Rendicion[] = [];

      // --- Rendiciones de consejo (bucket: rendiciones, público) ---
      const { data: rendConsejo, error: err1 } = await supabase
        .from('rendiciones')
        .select(`
          *,
          proyecto:proyectos!rendiciones_id_proyecto_fkey(
            id_proyecto, nombre, codigo, categoria_7t, ente_financiamiento, presupuesto, id_consejo
          )
        `)
        .order('created_at', { ascending: false });
      if (err1) console.error('Error rendiciones consejo:', err1);
      if (rendConsejo) {
        rendicionesConTipo.push(...rendConsejo.map(r => {
          const proy = r.proyecto as Proyecto;
          if (proy && proy.id_consejo) {
            proy.instancia_nombre = consejoMap[proy.id_consejo] || null;
          }
          return { ...r, tipo: 'consejo' as const, instancia_nombre: proy?.instancia_nombre || null };
        }));
      }

      // --- Rendiciones de comuna (bucket: rendiciones_comuna, privado) ---
      const { data: rendComunaRaw, error: err2 } = await supabase
        .from('rendiciones_comuna')
        .select('*')
        .order('created_at', { ascending: false });
      if (err2) console.error('Error rendiciones comuna:', err2);
      if (rendComunaRaw && rendComunaRaw.length) {
        const proyectoIds = [...new Set(rendComunaRaw.map(r => r.id_proyecto).filter(Boolean))];
        let proyectosComunaMap: Record<number, Proyecto> = {};
        if (proyectoIds.length) {
          const { data: proyComuna } = await supabase
            .from('proyectos_comuna')
            .select('id_proyecto, nombre, codigo, categoria_7t, ente_financiamiento, presupuesto, id_comuna')
            .in('id_proyecto', proyectoIds);
          if (proyComuna) {
            proyectosComunaMap = Object.fromEntries(
              proyComuna.map(p => {
                const nombreInstancia = p.id_comuna ? comunaMap[p.id_comuna] || null : null;
                return [p.id_proyecto, { ...p, instancia_nombre: nombreInstancia }];
              })
            );
          }
        }
        rendicionesConTipo.push(...rendComunaRaw.map(r => {
          const proy = proyectosComunaMap[r.id_proyecto] || null;
          return {
            ...r,
            tipo: 'comuna' as const,
            proyecto: proy,
            instancia_nombre: proy?.instancia_nombre || null
          };
        }));
      }

      setRendiciones(rendicionesConTipo);

      // Voceros consejo
      if (isSuperUser || isRoleSuperior) {
        const { data: vocC, error: errVocC } = await supabase
          .from('voceros')
          .select('id_vocero, nombre_completo, cedula')
          .eq('es_firmante', true);
        if (errVocC) console.error('Error cargando voceros consejo:', errVocC);
        setVocerosConsejo(vocC || []);
      } else {
        if (consejoId) {
          const { data: vocC, error: errVocC } = await supabase
            .from('voceros')
            .select('id_vocero, nombre_completo, cedula')
            .eq('id_consejo', consejoId)
            .eq('es_firmante', true);
          if (errVocC) console.error('Error cargando voceros consejo:', errVocC);
          setVocerosConsejo(vocC || []);
        }
      }

      // Voceros comuna
      if (isSuperUser || isRoleSuperior) {
        const { data: vocCm, error: errVocCm } = await supabase
          .from('voceros_comuna')
          .select('id_voceroc, nombre_completo, cedula');
        if (errVocCm) console.error('Error cargando voceros comuna:', errVocCm);
        else {
          const mapped = (vocCm || []).map(v => ({
            id_vocero: v.id_voceroc,
            nombre_completo: v.nombre_completo,
            cedula: v.cedula
          }));
          setVocerosComuna(mapped);
        }
      } else {
        if (comunaId) {
          const { data: vocCm, error: errVocCm } = await supabase
            .from('voceros_comuna')
            .select('id_voceroc, nombre_completo, cedula')
            .eq('id_comuna', comunaId);
          if (errVocCm) console.error('Error cargando voceros comuna:', errVocCm);
          else {
            const mapped = (vocCm || []).map(v => ({
              id_vocero: v.id_voceroc,
              nombre_completo: v.nombre_completo,
              cedula: v.cedula
            }));
            setVocerosComuna(mapped);
          }
        }
      }

    } catch (error) {
      console.error('Error cargando datos:', error);
      setAlert({ open: true, title: 'Error', message: 'Error al cargar los datos', type: 'danger' });
    } finally {
      setLoading(false);
    }
  }, [consejoId, comunaId, isSuperUser, isRoleSuperior]);

  useEffect(() => {
    if (!initialLoading && (consejoId || comunaId || isSuperUser || isRoleSuperior)) {
      cargarDatos();
    } else if (!initialLoading && !consejoId && !comunaId && !isSuperUser && !isRoleSuperior) {
      setLoading(false);
    }
  }, [consejoId, comunaId, cargarDatos, initialLoading, isSuperUser, isRoleSuperior]);

  const estadisticas = {
    total: solicitudes.length,
    pendientes: solicitudes.filter(s => s.estado === 'pendiente').length,
    aprobadas: solicitudes.filter(s => s.estado === 'aprobada').length,
    rechazadas: solicitudes.filter(s => s.estado === 'rechazada').length,
  };

  const paginatedProrrogas = solicitudes.slice(
    (prorrogasPage - 1) * itemsPerPage,
    prorrogasPage * itemsPerPage
  );
  const totalProrrogasPages = Math.ceil(solicitudes.length / itemsPerPage) || 1;

  const paginatedRendiciones = rendiciones.slice(
    (rendicionesPage - 1) * itemsPerPage,
    rendicionesPage * itemsPerPage
  );
  const totalRendicionesPages = Math.ceil(rendiciones.length / itemsPerPage) || 1;

  const handleAceptarProrroga = async (
    solicitud: SolicitudProrroga,
    nuevoPresupuesto?: number,
    nuevoPlazo?: string
  ) => {
    try {
      if (!isSuperUser && !isRoleSuperior) {
        setAlert({ open: true, title: 'Sin permisos', message: 'No tiene permisos para aprobar prórrogas', type: 'warning' });
        return;
      }

      const { error: updateError } = await supabase
        .from('solicitudes_prorroga')
        .update({
          estado: 'aprobada',
          respuesta: 'Solicitud aprobada',
          nuevo_presupuesto: nuevoPresupuesto || solicitud.presupuesto_estimado,
          nuevo_plazo: nuevoPlazo || solicitud.tiempo_estimado
        })
        .eq('id_solicitud', solicitud.id_solicitud);

      if (updateError) throw updateError;

      if (nuevoPresupuesto && nuevoPresupuesto !== solicitud.presupuesto_estimado) {
        const { error: projError } = await supabase
          .from('proyectos')
          .update({ presupuesto_asignado: nuevoPresupuesto })
          .eq('id_proyecto', solicitud.id_proyecto);
        if (projError) throw projError;
        setProyectos(prev =>
          prev.map(p =>
            p.id_proyecto === solicitud.id_proyecto
              ? { ...p, presupuesto_asignado: nuevoPresupuesto }
              : p
          )
        );
      }

      setSolicitudes(prev =>
        prev.map(s =>
          s.id_solicitud === solicitud.id_solicitud
            ? {
                ...s,
                estado: 'aprobada',
                nuevo_presupuesto: nuevoPresupuesto || s.presupuesto_estimado,
                nuevo_plazo: nuevoPlazo || s.tiempo_estimado,
                respuesta: 'Solicitud aprobada'
              }
            : s
        )
      );

      setAlert({ open: true, title: 'Éxito', message: 'Prórroga aprobada correctamente', type: 'success' });
      setModalProrrogaOpen(false);
      setSelectedProrroga(null);
    } catch (error) {
      console.error('Error al aprobar:', error);
      setAlert({
        open: true,
        title: 'Error',
        message: error instanceof Error ? error.message : 'Error al aprobar la prórroga',
        type: 'danger'
      });
    }
  };

  const handleRechazarProrroga = async (solicitud: SolicitudProrroga, motivo: string) => {
    try {
      if (!isSuperUser && !isRoleSuperior) {
        setAlert({ open: true, title: 'Sin permisos', message: 'No tiene permisos para rechazar prórrogas', type: 'warning' });
        return;
      }
      const { error } = await supabase
        .from('solicitudes_prorroga')
        .update({
          estado: 'rechazada',
          respuesta: motivo
        })
        .eq('id_solicitud', solicitud.id_solicitud);
      if (error) throw error;
      setAlert({ open: true, title: 'Éxito', message: 'Prórroga rechazada', type: 'warning' });
      cargarDatos();
      setModalProrrogaOpen(false);
      setSelectedProrroga(null);
    } catch (error) {
      setAlert({ open: true, title: 'Error', message: 'Error al rechazar la prórroga', type: 'danger' });
    }
  };

  const formatearFecha = (fecha: string) => {
    if (!fecha) return 'N/A';
    return new Date(fecha).toLocaleDateString('es-ES', {
      day: '2-digit', month: '2-digit', year: 'numeric'
    });
  };

  if (initialLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px]">
        <Loader2 className="animate-spin text-brand-primary h-10 w-10 mb-4" />
        <p className="text-slate-500 text-sm font-medium">Cargando información del usuario...</p>
      </div>
    );
  }

  if (loading && solicitudes.length === 0 && rendiciones.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px]">
        <Loader2 className="animate-spin text-brand-primary h-10 w-10 mb-4" />
        <p className="text-slate-500 text-sm font-medium">Cargando datos...</p>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.98 }}
      animate={{ opacity: 1, scale: 1 }}
      className="space-y-8 pb-12"
    >
      {/* Cabecera */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-black text-slate-900 uppercase tracking-tighter italic">
            Rendición de Cuentas y Transparencia
          </h2>
          <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mt-1">
            Gestión de Prórrogas y Rendiciones
            {isSuperUser && <span className="ml-2 text-brand-primary">(Superusuario)</span>}
            {!isSuperUser && !isRoleSuperior && consejoId && <span className="ml-2 text-slate-400">(Consejo ID: {consejoId})</span>}
          </p>
        </div>
      </div>

      {/* Pestañas */}
      <div className="flex gap-2 bg-white p-1 rounded-xl border border-slate-200 shadow-sm w-fit">
        <button
          onClick={() => { setActiveView('prorrogas'); setProrrogasPage(1); }}
          className={cn(
            "px-6 py-2.5 rounded-lg text-[10px] font-black uppercase tracking-wider transition-all flex items-center gap-2",
            activeView === 'prorrogas' ? "bg-brand-primary text-white shadow-md" : "text-slate-500 hover:bg-slate-50"
          )}
        >
          <RefreshCw size={14} /> Prórrogas y Refinanciamiento
          {solicitudes.length > 0 && (
            <span className="ml-1 text-[8px] bg-white/20 rounded-full px-1.5 py-0.5">
              {solicitudes.length}
            </span>
          )}
        </button>
        <button
          onClick={() => { setActiveView('rendicion'); setRendicionesPage(1); }}
          className={cn(
            "px-6 py-2.5 rounded-lg text-[10px] font-black uppercase tracking-wider transition-all flex items-center gap-2",
            activeView === 'rendicion' ? "bg-brand-primary text-white shadow-md" : "text-slate-500 hover:bg-slate-50"
          )}
        >
          <FileCheck size={14} /> Rendición de Cuentas
          {rendiciones.length > 0 && (
            <span className="ml-1 text-[8px] bg-white/20 rounded-full px-1.5 py-0.5">
              {rendiciones.length}
            </span>
          )}
        </button>
      </div>

      <AnimatePresence mode="wait">
        {/* VISTA DE PRÓRROGAS */}
        {activeView === 'prorrogas' && (
          <motion.div
            key="prorrogas"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="space-y-8"
          >
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center">
                    <FileSignature className="h-5 w-5 text-slate-500" />
                  </div>
                  <div>
                    <p className="text-[8px] font-black text-slate-400 uppercase">Total Solicitudes</p>
                    <h4 className="text-2xl font-black text-slate-800">{estadisticas.total}</h4>
                  </div>
                </div>
              </div>
              <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-amber-100 flex items-center justify-center">
                    <Clock className="h-5 w-5 text-amber-600" />
                  </div>
                  <div>
                    <p className="text-[8px] font-black text-slate-400 uppercase">Pendientes</p>
                    <h4 className="text-2xl font-black text-amber-600">{estadisticas.pendientes}</h4>
                  </div>
                </div>
              </div>
              <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-emerald-100 flex items-center justify-center">
                    <ThumbsUp className="h-5 w-5 text-emerald-600" />
                  </div>
                  <div>
                    <p className="text-[8px] font-black text-slate-400 uppercase">Aprobadas</p>
                    <h4 className="text-2xl font-black text-emerald-600">{estadisticas.aprobadas}</h4>
                  </div>
                </div>
              </div>
              <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-rose-100 flex items-center justify-center">
                    <X className="h-5 w-5 text-rose-600" />
                  </div>
                  <div>
                    <p className="text-[8px] font-black text-slate-400 uppercase">Rechazadas</p>
                    <h4 className="text-2xl font-black text-rose-600">{estadisticas.rechazadas}</h4>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
            
              <div className="overflow-x-auto">
                {solicitudes.length === 0 ? (
                  <div className="text-center py-12">
                    <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-slate-100 flex items-center justify-center">
                      <FileSignature className="h-8 w-8 text-slate-300" />
                    </div>
                    <p className="text-slate-400 text-sm">No hay solicitudes de prórroga registradas</p>
                  </div>
                ) : (
                  <table className="w-full">
                    <thead className="bg-slate-50/50 border-b border-slate-100">
                      <tr>
                        <th className="text-left p-4 text-[8px] font-black text-slate-400 uppercase">Proyecto</th>
                        <th className="text-left p-4 text-[8px] font-black text-slate-400 uppercase">Instancia</th>
                        <th className="text-left p-4 text-[8px] font-black text-slate-400 uppercase">Tipo</th>
                        <th className="text-left p-4 text-[8px] font-black text-slate-400 uppercase">Solicitud</th>
                        <th className="text-left p-4 text-[8px] font-black text-slate-400 uppercase">Modificación</th>
                        <th className="text-left p-4 text-[8px] font-black text-slate-400 uppercase">Estado</th>
                        <th className="text-center p-4 text-[8px] font-black text-slate-400 uppercase">Acciones</th>
                      </tr>
                    </thead>
                    <tbody>
                      {paginatedProrrogas.map((solicitud) => {
                        const proyecto = solicitud.proyecto;
                        const esRefinanciamiento = (solicitud.presupuesto_estimado || 0) > (proyecto?.presupuesto || 0);
                        const tipo = esRefinanciamiento ? 'Refinanciamiento' : 'Prórroga';
                        return (
                          <tr key={`prorroga-${solicitud.id_solicitud}`} className="border-b border-slate-50 hover:bg-slate-50/30 transition-colors">
                            <td className="p-4">
                              <p className="text-xs font-black text-slate-800">{proyecto?.nombre || 'N/A'}</p>
                              <p className="text-[8px] text-slate-400 font-mono">{proyecto?.codigo}</p>
                            </td>
                            <td className="p-4">
                              <span className="text-[9px] font-bold text-slate-700">
                                {proyecto?.instancia_nombre || 'No especificada'}
                              </span>
                            </td>
                            <td className="p-4">
                              <span className={cn(
                                "px-2 py-1 rounded-full text-[8px] font-black uppercase",
                                esRefinanciamiento ? "bg-purple-100 text-purple-600" : "bg-blue-100 text-blue-600"
                              )}>
                                {tipo}
                              </span>
                            </td>
                            <td className="p-4">
                              <p className="text-[10px] text-slate-600 max-w-[200px] truncate">{solicitud.motivo}</p>
                              <p className="text-[8px] text-slate-400">{formatearFecha(solicitud.created_at)}</p>
                            </td>
                            <td className="p-4">
                              {esRefinanciamiento ? (
                                <div className="flex flex-col gap-0.5">
                                  <div className="flex items-center gap-1">
                                    <DollarSign size={10} className="text-slate-400" />
                                    <span className="text-[9px] font-bold text-slate-700">
                                      Bs. {proyecto?.presupuesto?.toLocaleString() || 0} → Bs. {solicitud.presupuesto_estimado.toLocaleString()}
                                    </span>
                                  </div>
                                  <span className="text-[7px] font-bold text-emerald-500">
                                    +{Math.round(((solicitud.presupuesto_estimado - (proyecto?.presupuesto || 0)) / (proyecto?.presupuesto || 1)) * 100)}%
                                  </span>
                                </div>
                              ) : (
                                <div className="flex items-center gap-1">
                                  <Calendar size={10} className="text-slate-400" />
                                  <span className="text-[9px] font-bold text-slate-700">{solicitud.tiempo_estimado}</span>
                                </div>
                              )}
                            </td>
                            <td className="p-4">
                              <span className={cn(
                                "px-2 py-1 rounded-full text-[8px] font-black uppercase",
                                solicitud.estado === 'aprobada' ? "bg-emerald-100 text-emerald-600" :
                                  solicitud.estado === 'rechazada' ? "bg-rose-100 text-rose-600" :
                                    "bg-amber-100 text-amber-600"
                              )}>
                                {solicitud.estado === 'pendiente' ? 'Pendiente' : solicitud.estado}
                              </span>
                            </td>
                            <td className="p-4 text-center">
                              <button
                                onClick={() => {
                                  setSelectedProrroga(solicitud);
                                  setModalProrrogaOpen(true);
                                }}
                                className="p-1.5 rounded-lg bg-brand-primary/10 text-brand-primary hover:bg-brand-primary/20 transition-colors"
                              >
                                <Eye size={16} />
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                )}
              </div>

              {totalProrrogasPages > 1 && (
                <div className="flex justify-center gap-1 p-4 border-t border-slate-100">
                  {Array.from({ length: totalProrrogasPages }).map((_, i) => (
                    <button
                      key={`prorroga-page-${i}`}
                      onClick={() => setProrrogasPage(i + 1)}
                      className={cn(
                        "w-8 h-8 rounded-lg text-xs font-bold transition-all",
                        prorrogasPage === i + 1 ? "bg-brand-primary text-white" : "bg-slate-100 text-slate-500 hover:bg-slate-200"
                      )}
                    >
                      {i + 1}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </motion.div>
        )}

        {/* VISTA DE RENDICIÓN DE CUENTAS */}
        {activeView === 'rendicion' && (
          <motion.div
            key="rendicion"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="space-y-8"
          >
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-emerald-100 flex items-center justify-center">
                    <FileText className="h-5 w-5 text-emerald-600" />
                  </div>
                  <div>
                    <p className="text-[8px] font-black text-slate-400 uppercase">Informes Emitidos</p>
                    <h4 className="text-2xl font-black text-slate-800">{rendiciones.length}</h4>
                  </div>
                </div>
              </div>
              <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-blue-100 flex items-center justify-center">
                    <Users className="h-5 w-5 text-blue-600" />
                  </div>
                  <div>
                    <p className="text-[8px] font-black text-slate-400 uppercase">Proyectos Auditados</p>
                    <h4 className="text-2xl font-black text-slate-800">
                      {new Set(rendiciones.map(r => r.id_proyecto)).size}
                    </h4>
                  </div>
                </div>
              </div>
              <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-emerald-100 flex items-center justify-center">
                    <CheckCircle2 className="h-5 w-5 text-emerald-600" />
                  </div>
                  <div>
                    <p className="text-[8px] font-black text-slate-400 uppercase">Observaciones</p>
                    <h4 className="text-2xl font-black text-emerald-600">00</h4>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
              <div className="divide-y divide-slate-50">
                {rendiciones.length === 0 ? (
                  <div className="text-center py-12">
                    <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-slate-100 flex items-center justify-center">
                      <FileCheck className="h-8 w-8 text-slate-300" />
                    </div>
                    <p className="text-slate-400 text-sm">No hay rendiciones registradas</p>
                  </div>
                ) : (
                  paginatedRendiciones.map((rendicion) => (
                    <div key={`rendicion-${rendicion.id_rendicion}`} className="p-4 hover:bg-slate-50/50 transition-colors cursor-pointer"
                      onClick={() => { setSelectedRendicion(rendicion); setModalRendicionOpen(true); }}>
                      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="text-[8px] font-black px-1.5 py-0.5 rounded-full bg-brand-primary/10 text-brand-primary uppercase">
                              {rendicion.proyecto?.categoria_7t || 'N/A'}
                            </span>
                            <span className="text-[8px] font-black text-slate-400 font-mono">
                              {rendicion.proyecto?.codigo}
                            </span>
                            <span className={cn(
                              "text-[7px] font-bold px-1.5 py-0.5 rounded-full",
                              rendicion.tipo === 'comuna' ? "bg-purple-100 text-purple-600" : "bg-blue-100 text-blue-600"
                            )}>
                              {rendicion.tipo === 'comuna' ? 'Comuna' : 'Consejo'}
                            </span>
                            {rendicion.instancia_nombre && (
                              <span className="text-[8px] font-bold text-slate-500">
                                {rendicion.instancia_nombre}
                              </span>
                            )}
                          </div>
                          <p className="text-sm font-black text-slate-800">{rendicion.proyecto?.nombre}</p>
                          <div className="flex items-center gap-3 mt-1">
                            <span className="text-[8px] font-bold text-slate-400 uppercase">
                              {formatearFecha(rendicion.fecha_inicio)} - {formatearFecha(rendicion.fecha_fin)}
                            </span>
                            <span className="w-1 h-1 rounded-full bg-slate-300" />
                            <span className="text-[8px] font-bold text-emerald-600">
                              Saldo: Bs. {(rendicion.ingresos - rendicion.egresos).toLocaleString()}
                            </span>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <button className="p-1.5 rounded-lg bg-brand-primary/10 text-brand-primary">
                            <Eye size={14} />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>

              {totalRendicionesPages > 1 && (
                <div className="flex justify-center gap-1 p-4 border-t border-slate-100">
                  {Array.from({ length: totalRendicionesPages }).map((_, i) => (
                    <button
                      key={`rendicion-page-${i}`}
                      onClick={() => setRendicionesPage(i + 1)}
                      className={cn(
                        "w-8 h-8 rounded-lg text-xs font-bold transition-all",
                        rendicionesPage === i + 1 ? "bg-brand-primary text-white" : "bg-slate-100 text-slate-500 hover:bg-slate-200"
                      )}
                    >
                      {i + 1}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* MODALES */}
      <AnimatePresence>
        {modalProrrogaOpen && selectedProrroga && (
          <ProrrogaDetailModal
            solicitud={selectedProrroga}
            onClose={() => { setModalProrrogaOpen(false); setSelectedProrroga(null); }}
            onAceptar={handleAceptarProrroga}
            onRechazar={handleRechazarProrroga}
            voceros={vocerosConsejo}
            canApprove={isSuperUser || isRoleSuperior}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {modalRendicionOpen && selectedRendicion && (
          <RendicionDetailModal
            rendicion={selectedRendicion}
            onClose={() => { setModalRendicionOpen(false); setSelectedRendicion(null); }}
            vocerosConsejo={vocerosConsejo}
            vocerosComuna={vocerosComuna}
          />
        )}
      </AnimatePresence>

      <AlertModal
        isOpen={alert.open}
        onClose={() => setAlert({ ...alert, open: false })}
        title={alert.title}
        message={alert.message}
        type={alert.type as any}
        confirmText="Aceptar"
      />
    </motion.div>
  );
};

// ============================================
// MODAL DE DETALLE DE PRÓRROGA
// ============================================
interface ProrrogaDetailModalProps {
  solicitud: SolicitudProrroga;
  onClose: () => void;
  onAceptar: (solicitud: SolicitudProrroga, nuevoPresupuesto?: number, nuevoPlazo?: string) => void;
  onRechazar: (solicitud: SolicitudProrroga, motivo: string) => void;
  voceros: Vocero[];
  canApprove: boolean;
}

const ProrrogaDetailModal = ({ solicitud, onClose, onAceptar, onRechazar, voceros, canApprove }: ProrrogaDetailModalProps) => {
  const [action, setAction] = useState<'view' | 'aceptar' | 'rechazar'>('view');
  const [nuevoPresupuesto, setNuevoPresupuesto] = useState(solicitud.presupuesto_estimado);
  const [nuevoPlazo, setNuevoPlazo] = useState(solicitud.tiempo_estimado);
  const [motivoRechazo, setMotivoRechazo] = useState('');
  const [loading, setLoading] = useState(false);
  const [signedActaUrl, setSignedActaUrl] = useState<string | null>(null);
  const [signedEvidenciaUrl, setSignedEvidenciaUrl] = useState<string | null>(null);

  const proyecto = solicitud.proyecto;
  const esRefinanciamiento = (solicitud.presupuesto_estimado || 0) > (proyecto?.presupuesto || 0);

  useEffect(() => {
    const fetchSignedUrls = async () => {
      if (solicitud.acta_url) {
        const url = await getSignedUrlForDocument('proyectos_docs', solicitud.acta_url);
        setSignedActaUrl(url);
      }
      if (solicitud.evidencia_url) {
        const url = await getSignedUrlForDocument('proyectos_docs', solicitud.evidencia_url);
        setSignedEvidenciaUrl(url);
      }
    };
    fetchSignedUrls();
  }, [solicitud.acta_url, solicitud.evidencia_url]);

  const idsValidos = (solicitud.id_voceros_firmantes || []).filter(id => id !== null);
  const vocerosFirmantes = voceros.filter(v => idsValidos.includes(v.id_vocero));

  const handleConfirmar = async () => {
    setLoading(true);
    if (action === 'aceptar') {
      await onAceptar(solicitud, nuevoPresupuesto, nuevoPlazo);
    } else if (action === 'rechazar') {
      await onRechazar(solicitud, motivoRechazo);
    }
    setLoading(false);
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
      />
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        className="relative w-full max-w-lg bg-white rounded-2xl shadow-2xl overflow-hidden"
      >
        <div className="p-5 border-b border-slate-100 bg-gradient-to-r from-slate-50 to-white">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              {esRefinanciamiento ? <DollarSign className="h-5 w-5 text-purple-500" /> : <Calendar className="h-5 w-5 text-blue-500" />}
              <h3 className="text-lg font-black text-slate-800 uppercase italic">
                {esRefinanciamiento ? 'Refinanciamiento' : 'Prórroga'}
              </h3>
            </div>
            <button onClick={onClose} className="p-1 rounded-lg hover:bg-slate-100"><X className="h-5 w-5 text-slate-400" /></button>
          </div>
          <p className="text-[10px] text-slate-400 mt-1 font-mono">{proyecto?.codigo} - {proyecto?.nombre}</p>
          {proyecto?.instancia_nombre && (
            <p className="text-[9px] text-slate-500 mt-0.5">Consejo: {proyecto.instancia_nombre}</p>
          )}
        </div>

        <div className="p-5 max-h-[60vh] overflow-y-auto space-y-4">
          {action === 'view' ? (
            <>
              <div className="flex justify-between items-center p-3 rounded-xl bg-slate-50">
                <span className="text-[9px] font-bold text-slate-400 uppercase">Estado actual</span>
                <span className={cn("px-2 py-0.5 rounded-full text-[8px] font-black uppercase",
                  solicitud.estado === 'aprobada' ? "bg-emerald-100 text-emerald-600" :
                    solicitud.estado === 'rechazada' ? "bg-rose-100 text-rose-600" :
                      "bg-amber-100 text-amber-600")}>
                  {solicitud.estado === 'pendiente' ? 'Pendiente' : solicitud.estado}
                </span>
              </div>

              <div>
                <label className="text-[9px] font-bold text-slate-400 uppercase">Motivo de la solicitud</label>
                <div className="mt-1 p-3 bg-slate-50 rounded-xl max-h-32 overflow-y-auto text-xs text-slate-600 whitespace-pre-wrap">
                  {solicitud.motivo}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                {esRefinanciamiento ? (
                  <>
                    <div className="p-3 rounded-xl bg-slate-50">
                      <p className="text-[8px] font-bold text-slate-400 uppercase">Presupuesto original</p>
                      <p className="text-sm font-black text-slate-700">Bs. {proyecto?.presupuesto?.toLocaleString() || 0}</p>
                    </div>
                    <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-100">
                      <p className="text-[8px] font-bold text-emerald-600 uppercase">Presupuesto solicitado</p>
                      <p className="text-sm font-black text-emerald-700">Bs. {solicitud.presupuesto_estimado.toLocaleString()}</p>
                    </div>
                  </>
                ) : (
                  <>
                    <div className="p-3 rounded-xl bg-slate-50">
                      <p className="text-[8px] font-bold text-slate-400 uppercase">Plazo original</p>
                      <p className="text-sm font-black text-slate-700">{proyecto?.duracion || 'No especificado'}</p>
                    </div>
                    <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-100">
                      <p className="text-[8px] font-bold text-emerald-600 uppercase">Plazo solicitado</p>
                      <p className="text-sm font-black text-emerald-700">{solicitud.tiempo_estimado}</p>
                    </div>
                  </>
                )}
              </div>

              <div>
                <label className="text-[9px] font-bold text-slate-400 uppercase">Voceros firmantes</label>
                <div className="mt-1 space-y-1">
                  {vocerosFirmantes.length === 0 ? (
                    <div className="text-xs text-slate-400 italic p-2 bg-slate-50 rounded-lg">No hay voceros firmantes registrados para esta solicitud</div>
                  ) : (
                    vocerosFirmantes.map(v => (
                      <div key={`firmante-${v.id_vocero}`} className="flex items-center gap-2 p-2 bg-slate-50 rounded-lg">
                        <UserCheck size={12} className="text-slate-400" />
                        <span className="text-xs font-medium">{v.nombre_completo}</span>
                        <span className="text-[9px] text-slate-400">C.I. {v.cedula}</span>
                      </div>
                    ))
                  )}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                {solicitud.acta_url && signedActaUrl && (
                  <a href={signedActaUrl} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 p-2 rounded-lg bg-slate-50 text-xs font-medium hover:bg-slate-100">
                    <FileText size={14} /> Acta de Asamblea
                  </a>
                )}
                {solicitud.evidencia_url && signedEvidenciaUrl && (
                  <a href={signedEvidenciaUrl} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 p-2 rounded-lg bg-slate-50 text-xs font-medium hover:bg-slate-100">
                    <Eye size={14} /> Evidencia de avance
                  </a>
                )}
              </div>

              {solicitud.estado === 'pendiente' && canApprove && (
                <div className="flex gap-3 pt-2">
                  <button onClick={() => setAction('aceptar')} className="flex-1 py-2.5 rounded-xl bg-emerald-500 text-white text-[10px] font-black uppercase flex items-center justify-center gap-2">
                    <ThumbsUp size={14} /> Aprobar
                  </button>
                  <button onClick={() => setAction('rechazar')} className="flex-1 py-2.5 rounded-xl bg-rose-500 text-white text-[10px] font-black uppercase flex items-center justify-center gap-2">
                    <X size={14} /> Rechazar
                  </button>
                </div>
              )}
            </>
          ) : action === 'aceptar' ? (
            <div className="space-y-4">
              <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-100 text-center">
                <CheckCircle2 className="h-8 w-8 text-emerald-500 mx-auto mb-2" />
                <p className="text-sm font-black text-emerald-700">Confirmar aprobación</p>
                <p className="text-[10px] text-slate-500">Puedes ajustar el presupuesto y/o plazo si lo consideras necesario.</p>
              </div>

              <div>
                <label className="text-[9px] font-bold text-slate-400 uppercase">Nuevo presupuesto asignado (opcional)</label>
                <div className="relative mt-1">
                  <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                  <input
                    type="number"
                    value={nuevoPresupuesto}
                    onChange={(e) => setNuevoPresupuesto(Number(e.target.value))}
                    className="w-full p-2.5 pl-9 rounded-xl border border-slate-200 text-sm font-bold"
                  />
                </div>
              </div>

              <div>
                <label className="text-[9px] font-bold text-slate-400 uppercase">Nuevo plazo (opcional)</label>
                <input
                  type="text"
                  value={nuevoPlazo}
                  onChange={(e) => setNuevoPlazo(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-slate-200 text-sm font-bold"
                  placeholder="Ej: 3 meses"
                />
              </div>

              <div className="flex gap-3 pt-2">
                <button onClick={() => setAction('view')} className="flex-1 py-2.5 rounded-xl border border-slate-200 text-slate-600 text-[10px] font-black uppercase">Cancelar</button>
                <button onClick={handleConfirmar} disabled={loading} className="flex-1 py-2.5 rounded-xl bg-emerald-500 text-white text-[10px] font-black uppercase flex items-center justify-center gap-2">
                  {loading ? <Loader2 className="animate-spin h-4 w-4" /> : 'Confirmar'}
                </button>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="p-3 rounded-xl bg-rose-50 border border-rose-100 text-center">
                <AlertCircle className="h-8 w-8 text-rose-500 mx-auto mb-2" />
                <p className="text-sm font-black text-rose-700">Confirmar rechazo</p>
              </div>
              <div>
                <label className="text-[9px] font-bold text-slate-400 uppercase">Motivo del rechazo</label>
                <textarea rows={4} value={motivoRechazo} onChange={(e) => setMotivoRechazo(e.target.value)} className="w-full p-2.5 rounded-xl border border-slate-200 text-sm" placeholder="Explique el motivo del rechazo..." />
              </div>
              <div className="flex gap-3 pt-2">
                <button onClick={() => setAction('view')} className="flex-1 py-2.5 rounded-xl border border-slate-200 text-slate-600 text-[10px] font-black uppercase">Cancelar</button>
                <button onClick={handleConfirmar} disabled={loading || !motivoRechazo.trim()} className="flex-1 py-2.5 rounded-xl bg-rose-500 text-white text-[10px] font-black uppercase flex items-center justify-center gap-2">
                  {loading ? <Loader2 className="animate-spin h-4 w-4" /> : 'Confirmar'}
                </button>
              </div>
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );
};

// ============================================
// MODAL DE DETALLE DE RENDICIÓN
// ============================================
interface RendicionDetailModalProps {
  rendicion: Rendicion;
  onClose: () => void;
  vocerosConsejo: Vocero[];
  vocerosComuna: Vocero[];
}

const RendicionDetailModal = ({ rendicion, onClose, vocerosConsejo, vocerosComuna }: RendicionDetailModalProps) => {
  const proyecto = rendicion.proyecto;
  const vocerosDisponibles = rendicion.tipo === 'comuna' ? vocerosComuna : vocerosConsejo;
  const [documentUrls, setDocumentUrls] = useState<Record<string, string | null>>({});

  useEffect(() => {
    const fetchUrls = async () => {
      const tipo = rendicion.tipo || 'consejo';
      const urls: Record<string, string | null> = {};

      const fields = [
        'acta_asamblea_url',
        'informe_contraloria_url',
        'facturas_legales_url',
        'estado_cuenta_url'
      ] as const;

      for (const field of fields) {
        const path = rendicion[field];
        if (path) {
          if (tipo === 'consejo') {
            urls[field] = getPublicDocumentUrl('rendiciones', path);
          } else {
            urls[field] = await getSignedUrlForDocument('rendiciones_comuna', path);
          }
        }
      }

      if (rendicion.fotos_evidencia_urls && rendicion.fotos_evidencia_urls.length > 0) {
        const photoUrls = await Promise.all(
          rendicion.fotos_evidencia_urls.map(async (url) => {
            if (tipo === 'consejo') {
              return getPublicDocumentUrl('rendiciones', url);
            } else {
              return await getSignedUrlForDocument('rendiciones_comuna', url);
            }
          })
        );
        urls['fotos_evidencia_urls'] = photoUrls.filter(Boolean) as string[];
      }

      setDocumentUrls(urls);
    };

    fetchUrls();
  }, [rendicion]);

  const saldo = (rendicion.ingresos || 0) - (rendicion.egresos || 0);

  const formatearFecha = (fecha: string) => {
    if (!fecha) return 'N/A';
    return new Date(fecha).toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit', year: 'numeric' });
  };

  const idsValidos = (rendicion.id_voceros_firmantes || []).filter(id => id !== null);
  const vocerosFirmantes = vocerosDisponibles.filter(v => idsValidos.includes(v.id_vocero));

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
      />
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        className="relative w-full max-w-lg bg-white rounded-2xl shadow-2xl overflow-hidden max-h-[80vh] flex flex-col"
      >
        <div className="p-5 border-b border-slate-100 bg-gradient-to-r from-slate-50 to-white sticky top-0 z-10">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <FileCheck className="h-5 w-5 text-brand-primary" />
              <h3 className="text-lg font-black text-slate-800 uppercase italic">Detalle de Rendición</h3>
            </div>
            <button onClick={onClose} className="p-1 rounded-lg hover:bg-slate-100"><X className="h-5 w-5 text-slate-400" /></button>
          </div>
          <p className="text-[10px] text-slate-400 mt-1">{proyecto?.codigo} - {proyecto?.nombre}</p>
          {rendicion.instancia_nombre && (
            <p className="text-[9px] text-slate-500 mt-0.5">
              {rendicion.tipo === 'consejo' ? 'Consejo' : 'Comuna'}: {rendicion.instancia_nombre}
            </p>
          )}
          <div className="mt-1">
            <span className={cn(
              "text-[8px] font-bold px-2 py-0.5 rounded-full",
              rendicion.tipo === 'comuna' ? "bg-purple-100 text-purple-600" : "bg-blue-100 text-blue-600"
            )}>
              {rendicion.tipo === 'comuna' ? 'Rendición de Comuna' : 'Rendición de Consejo'}
            </span>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-5 space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div className="p-3 rounded-xl bg-slate-50"><p className="text-[8px] font-bold text-slate-400 uppercase">Transformación</p><p className="text-sm font-black text-slate-800">{proyecto?.categoria_7t || 'N/A'}</p></div>
            <div className="p-3 rounded-xl bg-slate-50"><p className="text-[8px] font-bold text-slate-400 uppercase">Categoría</p><p className="text-sm font-black text-slate-800 capitalize">{rendicion.categoria_seleccionada || 'N/A'}</p></div>
          </div>

          <div className="p-3 rounded-xl bg-slate-50"><p className="text-[8px] font-bold text-slate-400 uppercase">Lapso contable</p><p className="text-xs font-bold text-slate-700">{formatearFecha(rendicion.fecha_inicio)} - {formatearFecha(rendicion.fecha_fin)}</p></div>

          <div className="grid grid-cols-3 gap-2">
            <div className="p-2 rounded-xl bg-emerald-50 text-center"><p className="text-[7px] font-bold text-emerald-600 uppercase">Ingresos</p><p className="text-xs font-black text-emerald-700">Bs. {(rendicion.ingresos || 0).toLocaleString()}</p></div>
            <div className="p-2 rounded-xl bg-rose-50 text-center"><p className="text-[7px] font-bold text-rose-600 uppercase">Egresos</p><p className="text-xs font-black text-rose-700">Bs. {(rendicion.egresos || 0).toLocaleString()}</p></div>
            <div className="p-2 rounded-xl bg-slate-800 text-center"><p className="text-[7px] font-bold text-slate-400 uppercase">Saldo</p><p className={cn("text-xs font-black", saldo >= 0 ? "text-emerald-400" : "text-rose-400")}>Bs. {saldo.toLocaleString()}</p></div>
          </div>

          {rendicion.informe_gestion && (
            <div>
              <p className="text-[9px] font-bold text-slate-400 uppercase mb-1">Informe de gestión</p>
              <div className="p-3 rounded-xl bg-slate-50 text-xs text-slate-600 max-h-32 overflow-y-auto whitespace-pre-wrap">
                {rendicion.informe_gestion}
              </div>
            </div>
          )}

          <div>
            <p className="text-[9px] font-bold text-slate-400 uppercase mb-1">Voceros firmantes</p>
            <div className="space-y-1">
              {vocerosFirmantes.length === 0 ? (
                <div className="text-xs text-slate-400 italic p-2 bg-slate-50 rounded-lg">No hay voceros firmantes registrados para esta rendición</div>
              ) : (
                vocerosFirmantes.map(v => (
                  <div key={`rend-firmante-${v.id_vocero}`} className="flex items-center gap-2 p-2 bg-slate-50 rounded-lg">
                    <UserCheck size={12} className="text-slate-400" />
                    <span className="text-xs font-medium">{v.nombre_completo}</span>
                    <span className="text-[9px] text-slate-400">C.I. {v.cedula}</span>
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="space-y-2">
            <p className="text-[9px] font-bold text-slate-400 uppercase">Documentos adjuntos</p>
            <div className="grid grid-cols-2 gap-2">
              {documentUrls['acta_asamblea_url'] && (
                <a href={documentUrls['acta_asamblea_url']} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 p-2 rounded-lg bg-slate-50 text-xs font-medium hover:bg-slate-100">
                  <FileText size={12} /> Acta Asamblea
                </a>
              )}
              {documentUrls['informe_contraloria_url'] && (
                <a href={documentUrls['informe_contraloria_url']} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 p-2 rounded-lg bg-slate-50 text-xs font-medium hover:bg-slate-100">
                  <ShieldCheck size={12} /> Informe Contraloría
                </a>
              )}
              {documentUrls['facturas_legales_url'] && (
                <a href={documentUrls['facturas_legales_url']} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 p-2 rounded-lg bg-slate-50 text-xs font-medium hover:bg-slate-100">
                  <Receipt size={12} /> Facturas
                </a>
              )}
              {documentUrls['estado_cuenta_url'] && (
                <a href={documentUrls['estado_cuenta_url']} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 p-2 rounded-lg bg-slate-50 text-xs font-medium hover:bg-slate-100">
                  <FileText size={12} /> Estado Cuenta
                </a>
              )}
            </div>
          </div>

          {rendicion.fotos_evidencia_urls && rendicion.fotos_evidencia_urls.length > 0 && (
            <div>
              <p className="text-[9px] font-bold text-slate-400 uppercase mb-1">Evidencias ({rendicion.fotos_evidencia_urls.length})</p>
              <div className="grid grid-cols-3 gap-2">
                {(documentUrls['fotos_evidencia_urls'] as string[] || []).slice(0, 3).map((url, idx) => (
                  <img key={`evidencia-${idx}`} src={url} alt={`Evidencia ${idx+1}`} className="w-full h-20 object-cover rounded-lg" />
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="p-4 border-t border-slate-100 bg-slate-50/50">
          <button onClick={onClose} className="w-full py-2.5 rounded-xl bg-brand-primary text-white text-[10px] font-black uppercase hover:bg-brand-primary/90 transition-colors">Cerrar</button>
        </div>
      </motion.div>
    </div>
  );
};