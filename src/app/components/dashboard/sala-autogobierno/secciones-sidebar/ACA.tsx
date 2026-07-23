"use client";

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Save, AlertCircle, Plus, Trash2, MapPin, Target, X, PlusCircle,
  Building2, Activity, Construction, Upload, Loader2, Users, FileCheck,
  PieChart, MessageSquare, Edit, FileText, Eye, Calendar, UserCheck, Camera, ChevronRight
} from 'lucide-react';
import { cn } from "@/app/lib/utils";
import { supabase } from "@/app/lib/supabaseClient";
import { useAuth } from "@/context/AuthContext";
import { AlertModal } from "@/app/components/AlertModal";

// ==================== TIPOS ====================
interface ACAProps {
  onNavigate: (section: string) => void;
}

interface NudoComunaReal {
  id_nudo_comuna: number;
  titulo: string;
  descripcion: string;
  categoria_7t: string;
  gravedad: 'Bajo' | 'Medio' | 'Alto/Crítico';
  familias_afectadas: number | null;
  personas_afectadas: number | null;
  justificacion_critico: string | null;
  fotos_urls: string[];
  acta_url?: string | null;
  created_at: string;
}

interface NudoConsejoReal {
  id_nudo: number;
  titulo: string;
  descripcion: string | null;
  categoria_7t: string;
  gravedad: 'Bajo' | 'Medio' | 'Alto/Crítico';
  familias_afectadas: number | null;
  personas_afectadas: number | null;
  justificacion_critico: string | null;
  fotos_urls: string[] | null;
  acta_url?: string | null;
  id_consejo: number;
  created_at: string;
}

interface NudoUnificado {
  id: number;
  titulo: string;
  instanciaTexto: string;
  instanciaNombre: string;
  instanciaTipo: 'comuna' | 'consejo';
  categoria_7t: string;
  gravedad: 'Bajo' | 'Medio' | 'Alto/Crítico';
  familias_afectadas: number | null;
  personas_afectadas: number | null;
  descripcion: string | null;
  justificacion_critico: string | null;
  fotos_urls: string[];
  acta_url?: string | null;
  created_at: string;
  datosOriginales: NudoComunaReal | NudoConsejoReal;
}

interface Consejo {
  id_consejo: number;
  nombre_consejo: string;
}

interface Proyecto {
  id: string;
  name: string;
  nudo: string;
  t: string;
  budget: string;
  status: string;
  progress: number;
  date: string;
  consejoComunal?: string;
  tipo: 'comuna' | 'consejo';
  instanciaTexto: string;
  instanciaNombre: string;
  instanciaTipo: 'comuna' | 'consejo';
  desc_antes?: string;
  desc_durante?: string;
  desc_despues?: string;
  fecha_antes?: string;
  fecha_durante?: string;
  fecha_despues?: string;
  requerimientos?: string;
  duracion?: string;
  tecnico_nombre?: string;
  tecnico_apellido?: string;
  tecnico_cedula?: string;
  acta_url?: string;
  foto_antes_url?: string;
  foto_durante_url?: string;
  foto_despues_url?: string;
  respuesta?: string;
  fecha_respuesta?: string;
}

interface SolucionComuna {
  id_aca_comuna: number;
  id_nudo_comuna: number;
  area_trabajo: string;
  solucion_propuesta: string;
  nombre_responsable: string | null;
  apellido_responsable: string | null;
  cedula_responsable: string | null;
  direccion_exacta: string | null;
  fortaleza: string | null;
  transformacion_7t: string;
  nudo_titulo?: string;
  nudo_categoria?: string;
  nudo_descripcion?: string;
}

// ==================== COMPONENTE PRINCIPAL ====================
export const ACA = ({ onNavigate }: ACAProps) => {
  const { user } = useAuth();
  const [activeSection, setActiveSection] = useState<'nudos' | 'matriz' | 'proyectos'>('nudos');
  
  // Estados para Nudos Críticos
  const [noSala, setNoSala] = useState(false);
  const [comunaId, setComunaId] = useState<number | null>(null);
  const [comunaNombre, setComunaNombre] = useState<string>("");
  const [loadingComuna, setLoadingComuna] = useState(true);
  const [errorComuna, setErrorComuna] = useState<string | null>(null);
  const [consejos, setConsejos] = useState<Consejo[]>([]);
  const [nudosUnificados, setNudosUnificados] = useState<NudoUnificado[]>([]);
  const [loadingNudos, setLoadingNudos] = useState(true);
  const [selectedNudo, setSelectedNudo] = useState<NudoUnificado | null>(null);
  const [isReportOpen, setIsReportOpen] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [currentType, setCurrentType] = useState<'comuna' | 'consejo'>('comuna');
  const [currentConsejoId, setCurrentConsejoId] = useState<number | null>(null);
  const [saving, setSaving] = useState(false);
  const [descripcionLength, setDescripcionLength] = useState(0);
  
  // Estados para Matriz ACA
  const [solucionesComuna, setSolucionesComuna] = useState<SolucionComuna[]>([]);
  const [loadingSoluciones, setLoadingSoluciones] = useState(false);
  const [selectedSolucion, setSelectedSolucion] = useState<SolucionComuna | null>(null);

  // Estados para Proyectos
  const [proyectosUnificados, setProyectosUnificados] = useState<Proyecto[]>([]);
  const [loadingProyectos, setLoadingProyectos] = useState(false);
  const [selectedProjectForDetail, setSelectedProjectForDetail] = useState<Proyecto | null>(null);
  const [detailModalOpen, setDetailModalOpen] = useState(false);

  // Formulario para nudos (simplificado)
  const [nudoFormData, setNudoFormData] = useState({
    categoria_7t: "T2",
    gravedad: "Bajo" as "Bajo" | "Medio" | "Alto/Crítico",
    titulo: "",
    descripcion: "",
    justificacion_critico: "",
    familias_afectadas: 0,
    personas_afectadas: 0
  });
  const [fotosFiles, setFotosFiles] = useState<File[]>([]);
  const [actaFile, setActaFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const actaInputRef = useRef<HTMLInputElement>(null);

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
    const anyModalOpen = isReportOpen || selectedNudo !== null || selectedSolucion !== null || detailModalOpen || modalState.isOpen;
    if (anyModalOpen) {
      document.body.classList.add('modal-open');
    } else {
      document.body.classList.remove('modal-open');
    }
    return () => document.body.classList.remove('modal-open');
  }, [isReportOpen, selectedNudo, selectedSolucion, detailModalOpen, modalState.isOpen]);

  // ========== CARGA DE DATOS ==========
  useEffect(() => {
    const fetchComunaFromSala = async () => {
      if (!user?.id) {
        setLoadingComuna(false);
        setErrorComuna("Usuario no autenticado");
        return;
      }
      try {
        const { data: salaData, error: salaError } = await supabase
          .from('datos_sala_autogobierno')
          .select('id_comuna')
          .eq('id_usuario', user.id)
          .maybeSingle();

        if (salaError) throw salaError;

        if (salaData?.id_comuna) {
          setComunaId(salaData.id_comuna);
          const { data: comunaData } = await supabase
            .from('datos_comuna')
            .select('nombre_comuna')
            .eq('id_comuna', salaData.id_comuna)
            .single();
          if (comunaData?.nombre_comuna) {
            setComunaNombre(comunaData.nombre_comuna);
          }
          setErrorComuna(null);
        } else {
          // Si no tiene sala, verificar si es responsable directo de comuna
          const { data: comunaData, error: comunaError } = await supabase
            .from('datos_comuna')
            .select('id_comuna, nombre_comuna')
            .eq('id_usuario', user.id)
            .maybeSingle();
          if (comunaError) throw comunaError;
          if (comunaData?.id_comuna) {
            setComunaId(comunaData.id_comuna);
            setComunaNombre(comunaData.nombre_comuna || "Comuna");
            setErrorComuna(null);
          } else {
            setNoSala(true);
            setErrorComuna(null);
          }
        }
      } catch (err: any) {
        console.error(err);
        setErrorComuna(err.message || "Error al cargar la comuna");
      } finally {
        setLoadingComuna(false);
      }
    };
    fetchComunaFromSala();
  }, [user]);

  // Cargar consejos
  useEffect(() => {
    if (!comunaId) return;
    const fetchConsejos = async () => {
      try {
        const { data: sectores, error: sectoresError } = await supabase
          .from('sectores')
          .select('id_sector')
          .eq('id_datos_comuna', comunaId)
          .eq('activo', true);
        if (sectoresError) throw sectoresError;
        if (!sectores || sectores.length === 0) { setConsejos([]); return; }
        const sectorIds = sectores.map(s => s.id_sector);
        const { data: consejosData, error: consejosError } = await supabase
          .from('datos_consejo_comunal')
          .select('id_consejo, nombre_consejo')
          .in('id_sector', sectorIds);
        if (consejosError) throw consejosError;
        setConsejos(consejosData || []);
      } catch (err) {
        console.error(err);
        setConsejos([]);
      }
    };
    fetchConsejos();
  }, [comunaId]);

  // Cargar nudos unificados (comuna + consejos)
  useEffect(() => {
    if (!comunaId) {
      setLoadingNudos(false);
      return;
    }
    
    const fetchAllNudos = async () => {
      setLoadingNudos(true);
      const nudosUnificadosTemp: NudoUnificado[] = [];
      
      try {
        // 1. Cargar nudos de la comuna
        const { data: nudosComuna, error: errorComuna } = await supabase
          .from('nudos_criticos_comuna')
          .select('*')
          .eq('id_comuna', comunaId)
          .order('created_at', { ascending: false });
        
        if (errorComuna) throw errorComuna;
        
        if (nudosComuna) {
          nudosComuna.forEach((nudo: NudoComunaReal) => {
            nudosUnificadosTemp.push({
              id: nudo.id_nudo_comuna,
              titulo: nudo.titulo,
              instanciaTexto: 'Comuna',
              instanciaNombre: comunaNombre || 'Comuna',
              instanciaTipo: 'comuna',
              categoria_7t: nudo.categoria_7t,
              gravedad: nudo.gravedad,
              familias_afectadas: nudo.familias_afectadas,
              personas_afectadas: nudo.personas_afectadas,
              descripcion: nudo.descripcion,
              justificacion_critico: nudo.justificacion_critico,
              fotos_urls: nudo.fotos_urls || [],
              acta_url: nudo.acta_url,
              created_at: nudo.created_at,
              datosOriginales: nudo
            });
          });
        }
        
        // 2. Cargar nudos de todos los consejos
        if (consejos.length > 0) {
          const consejosIds = consejos.map(c => c.id_consejo);
          const { data: nudosConsejos, error: errorConsejos } = await supabase
            .from('nudos_criticos')
            .select('*')
            .in('id_consejo', consejosIds)
            .order('created_at', { ascending: false });
          
          if (errorConsejos) throw errorConsejos;
          
          if (nudosConsejos) {
            nudosConsejos.forEach((nudo: NudoConsejoReal) => {
              const consejoNombreReal = consejos.find(c => c.id_consejo === nudo.id_consejo)?.nombre_consejo || `Consejo #${nudo.id_consejo}`;
              nudosUnificadosTemp.push({
                id: nudo.id_nudo,
                titulo: nudo.titulo,
                instanciaTexto: 'Consejo Comunal',
                instanciaNombre: consejoNombreReal,
                instanciaTipo: 'consejo',
                categoria_7t: nudo.categoria_7t,
                gravedad: nudo.gravedad,
                familias_afectadas: nudo.familias_afectadas,
                personas_afectadas: nudo.personas_afectadas,
                descripcion: nudo.descripcion,
                justificacion_critico: nudo.justificacion_critico,
                fotos_urls: nudo.fotos_urls || [],
                acta_url: nudo.acta_url,
                created_at: nudo.created_at,
                datosOriginales: nudo
              });
            });
          }
        }
        
        // Ordenar por fecha (más reciente primero)
        nudosUnificadosTemp.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
        setNudosUnificados(nudosUnificadosTemp);
        
      } catch (err) {
        console.error('Error cargando nudos:', err);
        setNudosUnificados([]);
      } finally {
        setLoadingNudos(false);
      }
    };
    
    fetchAllNudos();
  }, [comunaId, consejos, comunaNombre]);

  // Cargar soluciones ACA comuna
  useEffect(() => {
    if (!comunaId) {
      setSolucionesComuna([]);
      return;
    }
    const fetchSolucionesComuna = async () => {
      setLoadingSoluciones(true);
      try {
        const { data: acaData, error: acaError } = await supabase
          .from('aca_comuna')
          .select('*')
          .eq('id_comuna', comunaId)
          .order('created_at', { ascending: false });
        if (acaError) throw acaError;
        
        if (!acaData || acaData.length === 0) {
          setSolucionesComuna([]);
          setLoadingSoluciones(false);
          return;
        }
        
        const nudoIds = acaData.map((item: any) => item.id_nudo_comuna).filter(Boolean);
        let nudosMap = new Map();
        if (nudoIds.length > 0) {
          const { data: nudosData, error: nudosError } = await supabase
            .from('nudos_criticos_comuna')
            .select('id_nudo_comuna, titulo, categoria_7t, descripcion')
            .in('id_nudo_comuna', nudoIds);
          if (!nudosError && nudosData) {
            nudosData.forEach((n: any) => {
              nudosMap.set(n.id_nudo_comuna, n);
            });
          }
        }
        
        const solucionesFormateadas = acaData.map((item: any) => ({
          ...item,
          nudo_titulo: nudosMap.get(item.id_nudo_comuna)?.titulo || null,
          nudo_categoria: nudosMap.get(item.id_nudo_comuna)?.categoria_7t || null,
          nudo_descripcion: nudosMap.get(item.id_nudo_comuna)?.descripcion || null
        }));
        setSolucionesComuna(solucionesFormateadas);
      } catch (err) {
        console.error('Error cargando soluciones ACA comuna:', err);
        setSolucionesComuna([]);
      } finally {
        setLoadingSoluciones(false);
      }
    };
    fetchSolucionesComuna();
  }, [comunaId]);

  // Cargar proyectos unificados (comuna + consejos)
  useEffect(() => {
    if (!comunaId) {
      setProyectosUnificados([]);
      setLoadingProyectos(false);
      return;
    }
    
    const fetchAllProyectos = async () => {
      setLoadingProyectos(true);
      const proyectosTemp: Proyecto[] = [];
      
      try {
        // 1. Proyectos de la comuna
        const { data: proyectosComuna, error: errorComuna } = await supabase
          .from('proyectos_comuna')
          .select('*')
          .eq('id_comuna', comunaId)
          .order('created_at', { ascending: false });
        
        if (errorComuna) throw errorComuna;
        
        if (proyectosComuna) {
          proyectosComuna.forEach((proy: any) => {
            proyectosTemp.push({
              id: proy.codigo || `PRY-${proy.id_proyecto_comuna}`,
              name: proy.nombre,
              nudo: proy.id_nudo_comuna ? `Nudo-${proy.id_nudo_comuna}` : 'Sin nudo',
              t: proy.categoria_7t,
              budget: proy.presupuesto ? `$${Number(proy.presupuesto).toLocaleString()}` : 'N/D',
              status: proy.estado || 'En planificación',
              progress: proy.progreso || 0,
              date: proy.created_at ? new Date(proy.created_at).toLocaleDateString() : 'Fecha no disponible',
              tipo: 'comuna',
              instanciaTexto: 'Comuna',
              instanciaNombre: comunaNombre || 'Comuna',
              instanciaTipo: 'comuna',
              desc_antes: proy.desc_antes || undefined,
              desc_durante: proy.desc_durante || undefined,
              desc_despues: proy.desc_despues || undefined,
              fecha_antes: proy.fecha_antes || undefined,
              fecha_durante: proy.fecha_durante || undefined,
              fecha_despues: proy.fecha_despues || undefined,
              requerimientos: proy.requerimientos || undefined,
              duracion: proy.duracion || undefined,
              tecnico_nombre: proy.tecnico_nombre || undefined,
              tecnico_apellido: proy.tecnico_apellido || undefined,
              tecnico_cedula: proy.tecnico_cedula || undefined,
              acta_url: proy.acta_url || undefined,
              foto_antes_url: proy.foto_antes_url || undefined,
              foto_durante_url: proy.foto_durante_url || undefined,
              foto_despues_url: proy.foto_despues_url || undefined,
              respuesta: proy.respuesta || undefined,
              fecha_respuesta: proy.fecha_respuesta || undefined,
            });
          });
        }
        
        // 2. Proyectos de consejos
        if (consejos.length > 0) {
          const consejosIds = consejos.map(c => c.id_consejo);
          const { data: proyectosConsejos, error: errorConsejos } = await supabase
            .from('proyectos')
            .select('*')
            .in('id_consejo', consejosIds)
            .order('created_at', { ascending: false });
          
          if (errorConsejos) throw errorConsejos;
          
          if (proyectosConsejos) {
            proyectosConsejos.forEach((proy: any) => {
              const consejoNombreReal = consejos.find(c => c.id_consejo === proy.id_consejo)?.nombre_consejo || `Consejo #${proy.id_consejo}`;
              proyectosTemp.push({
                id: proy.codigo || `PRY-${proy.id_proyecto}`,
                name: proy.nombre,
                nudo: proy.id_nudo ? `Nudo-${proy.id_nudo}` : 'Sin nudo',
                t: proy.categoria_7t,
                budget: proy.presupuesto ? `$${Number(proy.presupuesto).toLocaleString()}` : 'N/D',
                status: proy.estado || 'En planificación',
                progress: proy.progreso || 0,
                date: proy.created_at ? new Date(proy.created_at).toLocaleDateString() : 'Fecha no disponible',
                tipo: 'consejo',
                instanciaTexto: 'Consejo Comunal',
                instanciaNombre: consejoNombreReal,
                instanciaTipo: 'consejo',
                consejoComunal: consejoNombreReal,
                desc_antes: proy.desc_antes || undefined,
                desc_durante: proy.desc_durante || undefined,
                desc_despues: proy.desc_despues || undefined,
                fecha_antes: proy.fecha_antes || undefined,
                fecha_durante: proy.fecha_durante || undefined,
                fecha_despues: proy.fecha_despues || undefined,
                requerimientos: proy.requerimientos || undefined,
                duracion: proy.duracion || undefined,
                tecnico_nombre: proy.tecnico_nombre || undefined,
                tecnico_apellido: proy.tecnico_apellido || undefined,
                tecnico_cedula: proy.tecnico_cedula || undefined,
                acta_url: proy.acta_url || undefined,
                foto_antes_url: proy.foto_antes_url || undefined,
                foto_durante_url: proy.foto_durante_url || undefined,
                foto_despues_url: proy.foto_despues_url || undefined,
                respuesta: proy.respuesta || undefined,
                fecha_respuesta: proy.fecha_respuesta || undefined,
              });
            });
          }
        }
        
        // Ordenar por fecha (más reciente primero)
        proyectosTemp.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
        setProyectosUnificados(proyectosTemp);
        
      } catch (err) {
        console.error('Error cargando proyectos:', err);
        setProyectosUnificados([]);
      } finally {
        setLoadingProyectos(false);
      }
    };
    
    fetchAllProyectos();
  }, [comunaId, consejos, comunaNombre]);

  // ==================== FUNCIÓN PARA OBTENER URL FIRMADA (CORREGIDA) ====================
  // 🔥 Ahora usa los buckets correctos: documentos_comuna y documentos_consejos
  const getSignedUrl = async (filePath: string, tipo: 'comuna' | 'consejo'): Promise<string | null> => {
    try {
      const bucketName = tipo === 'comuna' ? 'documentos_comuna' : 'documentos_consejos';
      const { data, error } = await supabase.storage.from(bucketName).createSignedUrl(filePath, 60);
      if (error) {
        console.error('Error al firmar URL:', error);
        showAlert('Error al acceder al documento', `No se pudo generar el enlace. Verifique que el archivo exista en el bucket "${bucketName}".`, 'danger');
        return null;
      }
      return data.signedUrl;
    } catch (err) {
      console.error('Error en getSignedUrl:', err);
      showAlert('Error inesperado', 'No se pudo obtener el documento. Intente más tarde.', 'danger');
      return null;
    }
  };

  const handleOpenCreate = (type: 'comuna' | 'consejo', consejoId?: number) => {
    setIsReportOpen(true);
    setCurrentType(type);
    setCurrentConsejoId(consejoId || null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    showAlert("Información", "Creación/edición no implementada en esta versión", "info");
    setIsReportOpen(false);
  };

  const openProjectDetail = (proyecto: Proyecto) => {
    setSelectedProjectForDetail(proyecto);
    setDetailModalOpen(true);
  };

  if (loadingComuna) {
    return <div className="flex justify-center items-center p-8"><Loader2 className="animate-spin text-brand-primary h-7 w-7" /></div>;
  }
  if (errorComuna) {
    return (
      <div className="flex flex-col items-center p-8 text-center">
        <AlertCircle className="h-10 w-10 text-rose-500 mb-3" />
        <p className="text-slate-600">{errorComuna}</p>
        <p className="text-[11px] text-slate-400 mt-2">Asegúrate de tener una sala de autogobierno registrada con su comuna correspondiente.</p>
      </div>
    );
  }

  if (noSala) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center p-8 bg-white rounded-3xl border border-gray-100 shadow-sm">
        <div className="h-20 w-20 rounded-full bg-amber-100 flex items-center justify-center mb-6">
          <AlertCircle className="h-10 w-10 text-amber-600" />
        </div>
        <h3 className="text-xl font-black text-slate-800 uppercase tracking-tighter mb-2">
          Aún no has registrado tu Sala de Autogobierno
        </h3>
        <p className="text-slate-500 max-w-md mb-8">
          Para acceder a las estadísticas y funcionalidades del dashboard, primero debes completar los datos legales de tu sala.
        </p>
        <button
          onClick={() => onNavigate("datosl")}
          className="px-8 py-3 bg-brand-primary text-white rounded-xl font-black text-sm shadow-lg hover:scale-[1.02] transition-all flex items-center gap-2"
        >
          <FileCheck className="h-4 w-4" />
          Completar Datos Legales
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-4 p-3 md:p-4 max-w-340 mx-auto w-full">
      {/* CABECERA PRINCIPAL */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
        <div>
          <h1 className="text-base md:text-lg font-black text-slate-800 italic uppercase tracking-tight flex items-center gap-2">
            <Target className="h-5 w-5 text-brand-primary" /> Nudos Críticos y Soluciones 7T
          </h1>
          <p className="text-[8px] md:text-[9px] text-slate-400 font-bold uppercase tracking-[0.15em] mt-0.5">
            Sistematización de Nudos Críticos y Soluciones 7T
          </p>
        </div>
        <div className="flex items-center gap-1.5 flex-wrap">
          <button onClick={() => setActiveSection('nudos')} className={cn("px-3 py-1.5 rounded-lg text-[9px] font-black uppercase shadow-sm transition-all", activeSection === 'nudos' ? "bg-brand-primary text-white" : "bg-white text-slate-600 border")}>Nudos Críticos</button>
          <button onClick={() => setActiveSection('matriz')} className={cn("px-3 py-1.5 rounded-lg text-[9px] font-black uppercase shadow-sm transition-all", activeSection === 'matriz' ? "bg-emerald-500 text-white" : "bg-white text-slate-600 border")}>Matriz ACA</button>
          <button onClick={() => setActiveSection('proyectos')} className={cn("px-3 py-1.5 rounded-lg text-[9px] font-black uppercase shadow-sm transition-all", activeSection === 'proyectos' ? "bg-blue-500 text-white" : "bg-white text-slate-600 border")}>Proyectos</button>
        </div>
      </div>

      <AnimatePresence mode="wait">
        {/* SECCIÓN NUDOS CRÍTICOS */}
        {activeSection === 'nudos' && (
          <motion.div key="nudos" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-4">
            <div className="bg-brand-primary/10 border border-brand-primary/20 rounded-2xl p-4 flex flex-col md:flex-row items-center gap-4 shadow-sm">
              <div className="h-12 w-12 rounded-xl bg-indigo-50 flex items-center justify-center text-brand-primary shadow-md shrink-0">
                <AlertCircle className="h-6 w-6" />
              </div>
              <div className="text-center md:text-left">
                <h3 className="text-base font-black text-900 italic uppercase tracking-tighter">Gestión de Nudos Críticos</h3>
                <p className="text-700/70 text-[9px] font-bold uppercase tracking-wider mt-0.5">Identificación de obstáculos prioritarios (Agenda ACA)</p>
              </div>
            </div>

            <div className="space-y-3">
               {loadingNudos ? (
                <div className="flex justify-center py-8"><Loader2 className="animate-spin text-brand-primary h-6 w-6" /></div>
              ) : nudosUnificados.length === 0 ? (
                <div className="text-center py-6 text-slate-400 text-xs border rounded-lg">No hay nudos críticos registrados</div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-[9px]">
                    <thead className="text-[7px] font-black text-slate-400 uppercase tracking-wider border-b border-gray-100">
                      <tr>
                        <th className="text-left py-2 px-2">Título</th>
                        <th className="text-left py-2 px-2">Instancia</th>
                        <th className="text-left py-2 px-2">Categoría</th>
                        <th className="text-left py-2 px-2">Gravedad</th>
                        <th className="text-right py-2 px-2">Acción</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50">
                      {nudosUnificados.map((nudo, idx) => (
                        <tr key={`${nudo.instanciaTipo}-${nudo.id}-${idx}`} className="hover:bg-gray-50 transition-colors">
                          <td className="py-2 px-2 font-bold text-slate-800 max-w-[250px] truncate">{nudo.titulo}</td>
                          <td className="py-2 px-2">
                            <span className={cn("text-[7px] font-black px-2 py-0.5 rounded-full",
                              nudo.instanciaTipo === 'comuna' 
                                ? "bg-brand-primary/10 text-brand-primary" 
                                : "bg-amber-50 text-amber-600"
                            )}>
                              {nudo.instanciaTexto}
                            </span>
                          </td>
                          <td className="py-2 px-2 text-slate-500">{nudo.categoria_7t}</td>
                          <td className="py-2 px-2">
                            <span className={cn("text-[7px] font-black px-1.5 py-0.5 rounded-full",
                              nudo.gravedad === "Alto/Crítico" ? "text-rose-600 bg-rose-50" : "text-amber-600 bg-amber-50"
                            )}>{nudo.gravedad}</span>
                          </td>
                          <td className="py-2 px-2 text-right">
                            <button onClick={() => setSelectedNudo(nudo)} className="p-1.5 rounded-lg text-brand-primary hover:bg-brand-primary/10 transition-all">
                              <Eye className="h-3.5 w-3.5" />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </motion.div>
        )}

        {/* SECCIÓN MATRIZ ACA */}
        {activeSection === 'matriz' && (
          <motion.div key="matriz" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-4">
            <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
              <div className="p-3 border-b border-gray-100 bg-gray-50/30 flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-black text-slate-800 italic uppercase tracking-tighter">Matriz ACA - Comuna</h3>
                  <p className="text-[8px] text-slate-400 font-bold uppercase mt-0.5">Sistematización Territorial – Agenda Concreta de Acción</p>
                </div>
                <AlertCircle className="h-5 w-5 text-brand-primary opacity-20" />
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-gray-50/50 border-b border-gray-100 text-[8px] font-black text-slate-400 uppercase tracking-[0.15em]">
                      <th className="px-3 py-2">Área / 7T</th>
                      <th className="px-3 py-2">Nudo Crítico</th>
                      <th className="px-3 py-2">Solución</th>
                      <th className="px-3 py-2">Responsable</th>
                      <th className="px-3 py-2">Ubicación</th>
                      <th className="px-3 py-2">Fortaleza</th>
                      <th className="px-3 py-2 text-right">Detalle</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {loadingSoluciones ? (
                      <tr>
                        <td colSpan={7} className="px-3 py-8 text-center">
                          <Loader2 className="animate-spin mx-auto text-brand-primary h-6 w-6" />
                        </td>
                      </tr>
                    ) : solucionesComuna.length === 0 ? (
                      <tr>
                        <td colSpan={7} className="px-3 py-8 text-center text-slate-400 text-xs">
                          No hay soluciones registradas para esta comuna
                        </td>
                      </tr>
                    ) : (
                      solucionesComuna.map((sol) => (
                        <tr key={sol.id_aca_comuna} className="hover:bg-gray-50/80 transition-colors">
                          <td className="px-3 py-2">
                            <p className="text-[10px] font-black text-brand-primary italic uppercase tracking-tighter">{sol.area_trabajo}</p>
                            <span className="text-[7px] bg-brand-primary/5 text-brand-primary px-1.5 py-0.5 rounded-lg font-black uppercase">{sol.transformacion_7t.split(':')[0]}</span>
                          </td>
                          <td className="px-3 py-2">
                            <p className="text-[9px] font-bold text-slate-800 line-clamp-2">{sol.nudo_titulo || '—'}</p>
                            <span className="text-[7px] text-slate-400">{sol.nudo_categoria || sol.transformacion_7t.split(':')[0]}</span>
                           </td>
                          <td className="px-3 py-2 text-[9px] font-bold text-slate-500 max-w-xs">{sol.solucion_propuesta}</td>
                          <td className="px-3 py-2 text-[8px] font-black text-slate-800 uppercase italic min-w-30">
                            {sol.nombre_responsable} {sol.apellido_responsable}{' '}
                            <span className="text-[7px] text-slate-400 font-mono">{sol.cedula_responsable || '—'}</span>
                           </td>
                          <td className="px-3 py-2 text-[8px] text-slate-400 font-bold uppercase tracking-wider min-w-30">{sol.direccion_exacta || '—'}</td>
                          <td className="px-3 py-2 text-[8px] text-slate-500 font-medium italic min-w-25">{sol.fortaleza || '-'}</td>
                          <td className="px-3 py-2 text-right">
                            <button onClick={() => setSelectedSolucion(sol)} className="p-1 rounded-lg text-brand-primary hover:bg-brand-primary/10 transition-all" title="Ver detalles">
                              <Eye size={14} />
                            </button>
                           </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </motion.div>
        )}

        {/* SECCIÓN PROYECTOS */}
        {activeSection === 'proyectos' && (
          <motion.div key="proyectos" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-4">
            <div className="bg-blue-50 border border-blue-100 rounded-xl p-4 flex flex-col md:flex-row items-center gap-4 shadow-sm">
              <div className="h-12 w-12 rounded-xl bg-blue-500 flex items-center justify-center text-white shadow-md shrink-0">
                <Construction className="h-6 w-6" />
              </div>
              <div className="text-center md:text-left">
                <h3 className="text-sm font-black text-blue-900 italic uppercase tracking-tighter">Gestión de Proyectos</h3>
                <p className="text-blue-700/70 text-[9px] font-bold uppercase tracking-wider mt-0.5">Seguimiento de proyectos comunitarios</p>
              </div>
            </div>

            <div className="space-y-3">
              {loadingProyectos ? (
                <div className="flex justify-center py-8"><Loader2 className="animate-spin text-brand-primary h-6 w-6" /></div>
              ) : proyectosUnificados.length === 0 ? (
                <div className="text-center py-6 text-slate-400 text-xs border rounded-lg">No hay proyectos registrados</div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-[9px]">
                    <thead className="text-[7px] font-black text-slate-400 uppercase tracking-wider border-b border-gray-100">
                      <tr>
                        <th className="text-left py-2 px-2">Nombre del Proyecto</th>
                        <th className="text-left py-2 px-2">Instancia</th>
                        <th className="text-left py-2 px-2">7T</th>
                        <th className="text-left py-2 px-2">Estado</th>
                        <th className="text-right py-2 px-2">Acción</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50">
                      {proyectosUnificados.map((proyecto, idx) => (
                        <tr key={`${proyecto.tipo}-${proyecto.id}-${idx}`} className="hover:bg-gray-50 transition-colors">
                          <td className="py-2 px-2 font-bold text-slate-800 max-w-[250px] truncate">{proyecto.name}</td>
                          <td className="py-2 px-2">
                            <span className={cn("text-[7px] font-black px-2 py-0.5 rounded-full",
                              proyecto.instanciaTipo === 'comuna' 
                                ? "bg-brand-primary/10 text-brand-primary" 
                                : "bg-amber-50 text-amber-600"
                            )}>
                              {proyecto.instanciaTexto}
                            </span>
                          </td>
                          <td className="py-2 px-2">
                            <span className="text-[7px] font-black px-1.5 py-0.5 rounded-full bg-blue-100 text-blue-600">
                              {proyecto.t}
                            </span>
                          </td>
                          <td className="py-2 px-2">
                            <span className={cn("text-[7px] font-black px-1.5 py-0.5 rounded-full",
                              proyecto.status === "En Ejecución" ? "bg-amber-50 text-amber-600" :
                              proyecto.status === "Culminado" ? "bg-emerald-50 text-emerald-600" :
                              "bg-slate-100 text-slate-500"
                            )}>
                              {proyecto.status}
                            </span>
                          </td>
                          <td className="py-2 px-2 text-right">
                            <button onClick={() => openProjectDetail(proyecto)} className="p-1.5 rounded-lg text-brand-primary hover:bg-brand-primary/10 transition-all">
                              <Eye className="h-3.5 w-3.5" />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ============================================================ */}
      {/* MODAL DETALLE NUDO - CON SCROLL EN DESCRIPCIONES */}
      {/* ============================================================ */}
      <AnimatePresence>
        {selectedNudo && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-3">
            <motion.div 
              initial={{ opacity: 0 }} 
              animate={{ opacity: 1 }} 
              exit={{ opacity: 0 }} 
              onClick={() => setSelectedNudo(null)} 
              className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" 
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }} 
              animate={{ opacity: 1, scale: 1 }} 
              exit={{ opacity: 0, scale: 0.95 }} 
              className="relative w-full max-w-lg bg-white rounded-2xl shadow-2xl p-4 max-h-[90vh] overflow-y-auto"
            >
              <div className="flex justify-between items-start mb-3">
                <div className="h-10 w-10 rounded-xl bg-brand-primary/10 flex items-center justify-center text-brand-primary">
                  <AlertCircle className="h-5 w-5" />
                </div>
                <button onClick={() => setSelectedNudo(null)} className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors">
                  <X className="h-4 w-4 text-slate-400" />
                </button>
              </div>

              <h4 className="text-base font-black text-slate-800 italic uppercase leading-tight mb-2 pr-6">
                {selectedNudo.titulo}
              </h4>

              <div className="flex items-center gap-2 mb-4 flex-wrap">
                <span className={cn("text-[8px] font-black px-2 py-0.5 rounded-full uppercase", 
                  selectedNudo.gravedad === "Alto/Crítico" ? "bg-rose-50 text-rose-600" : "bg-amber-50 text-amber-600"
                )}>
                  {selectedNudo.gravedad}
                </span>
                <span className="text-[8px] font-black px-2 py-0.5 bg-slate-100 text-slate-500 rounded-full uppercase">
                  {selectedNudo.categoria_7t}
                </span>
                <span className={cn("text-[7px] font-black px-2 py-0.5 rounded-full",
                  selectedNudo.instanciaTipo === 'comuna' ? "bg-brand-primary/10 text-brand-primary" : "bg-amber-50 text-amber-600"
                )}>
                  {selectedNudo.instanciaNombre}
                </span>
              </div>

              {/* 🔥 Descripción con scroll */}
              <div className="max-h-36 overflow-y-auto text-justify pr-2 mb-3 border-b border-gray-100 pb-3">
                <p className="text-slate-600 text-[11px] leading-relaxed">
                  {selectedNudo.descripcion || 'Sin descripción'}
                </p>
              </div>

              <div className="grid grid-cols-2 gap-3 py-3 border-y border-gray-100 mb-3">
                <div>
                  <p className="text-[7.5px] font-black text-slate-600 uppercase tracking-wider">Familias afectadas</p>
                  <p className="text-sm font-black text-slate-800">{selectedNudo.familias_afectadas ?? '—'}</p>
                </div>
                <div>
                  <p className="text-[7px] font-black text-slate-600 uppercase tracking-wider">Personas afectadas</p>
                  <p className="text-sm font-black text-slate-800">{selectedNudo.personas_afectadas ?? '—'}</p>
                </div>
              </div>

              {selectedNudo.justificacion_critico && (
                <div className="mb-3 p-3 bg-rose-50 rounded-xl">
                  <p className="text-[7px] font-black text-rose-500 uppercase tracking-wider mb-1">Justificación crítica</p>
                  {/* 🔥 Justificación con scroll */}
                  <div className="max-h-28 overflow-y-auto text-justify pr-1">
                    <p className="text-[10px] font-medium text-rose-800 leading-relaxed">{selectedNudo.justificacion_critico}</p>
                  </div>
                </div>
              )}

              <div className="mb-3">
                <p className="text-[7px] font-black text-slate-600 uppercase tracking-wider mb-1.5">Fotos</p>
                {selectedNudo.fotos_urls && selectedNudo.fotos_urls.length > 0 ? (
                  <div className="flex gap-1.5 overflow-x-auto pb-1">
                    {selectedNudo.fotos_urls.map((path, i) => (
                      <button 
                        key={i} 
                        onClick={async () => { 
                          const signed = await getSignedUrl(path, selectedNudo.instanciaTipo); 
                          if (signed) window.open(signed, '_blank'); 
                        }} 
                        className="px-2.5 py-1.5 bg-gray-100 rounded-lg text-[8px] font-bold hover:bg-brand-primary/10 transition-all whitespace-nowrap"
                      >
                        Ver foto {i+1}
                      </button>
                    ))}
                  </div>
                ) : (
                  <p className="text-[9px] text-slate-400 italic">No hay fotos cargadas</p>
                )}
              </div>

              {selectedNudo.acta_url && (
                <div className="mb-4 pt-3 border-t border-gray-100">
                  <p className="text-[7px] font-black text-emerald-600 uppercase tracking-wider mb-1.5 flex items-center gap-1">
                    <FileText className="h-3 w-3" /> Acta oficial
                  </p>
                  <button 
                    onClick={async () => { 
                      const signed = await getSignedUrl(selectedNudo.acta_url!, selectedNudo.instanciaTipo); 
                      if (signed) window.open(signed, '_blank'); 
                    }} 
                    className="w-full py-2.5 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-700 text-[9px] font-bold hover:bg-emerald-100 transition-all flex items-center justify-center gap-1.5"
                  >
                    <FileText className="h-3 w-3" /> Ver acta oficial (PDF)
                  </button>
                </div>
              )}

              <div className="flex justify-end pt-2">
                <button 
                  onClick={() => setSelectedNudo(null)} 
                  className="px-4 py-2 rounded-xl bg-slate-100 text-slate-600 text-[8px] font-black uppercase tracking-wider hover:bg-slate-200 transition-all"
                >
                  Cerrar
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ============================================================ */}
      {/* MODAL DETALLE SOLUCIÓN - CON SCROLL EN DESCRIPCIONES */}
      {/* ============================================================ */}
      <AnimatePresence>
        {selectedSolucion && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setSelectedSolucion(null)} className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" />
            <motion.div initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 20 }} className="relative w-full max-w-xl bg-white rounded-[2.5rem] shadow-2xl p-8 max-h-[90vh] overflow-y-auto">
              <div className="flex justify-between items-start mb-6">
                <div className="h-14 w-14 rounded-2xl bg-brand-primary/10 flex items-center justify-center">
                  <Target className="h-7 w-7 text-brand-primary" />
                </div>
                <button onClick={() => setSelectedSolucion(null)} className="p-2 rounded-xl hover:bg-gray-100"><X className="h-5 w-5 text-slate-400" /></button>
              </div>
              <h4 className="text-xl font-black text-slate-800 italic uppercase tracking-tighter mb-1">Detalle de la Solución ACA</h4>
              <p className="text-[9px] text-slate-400 uppercase font-bold mb-6">Agenda Concreta de Acción – Comuna</p>
              <div className="space-y-4">
                <div className="border-b pb-3">
                  <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Área de trabajo</p>
                  <p className="text-base font-black text-brand-primary">{selectedSolucion.area_trabajo}</p>
                </div>
                <div className="border-b pb-3">
                  <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Transformación 7T</p>
                  <p className="text-sm font-black">{selectedSolucion.transformacion_7t}</p>
                </div>
                <div className="border-b pb-3">
                  <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Nudo crítico vinculado</p>
                  <p className="text-sm font-black text-brand-primary">{selectedSolucion.nudo_titulo || '—'}</p>
                  {/* 🔥 Descripción del nudo con scroll */}
                  <div className="max-h-24 overflow-y-auto text-justify pr-1 mt-1">
                    <p className="text-xs text-slate-500 leading-relaxed">{selectedSolucion.nudo_descripcion || 'Sin descripción'}</p>
                  </div>
                </div>
                <div className="border-b pb-3">
                  <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Solución propuesta</p>
                  {/* 🔥 Solución propuesta con scroll */}
                  <div className="max-h-24 overflow-y-auto text-justify pr-1">
                    <p className="text-sm text-slate-700 leading-relaxed">{selectedSolucion.solucion_propuesta}</p>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <p className="text-[9px] font-bold text-slate-400 uppercase">Responsable</p>
                    <p className="text-xs font-black">{selectedSolucion.nombre_responsable} {selectedSolucion.apellido_responsable}</p>
                    <p className="text-[10px] font-mono text-slate-500">{selectedSolucion.cedula_responsable || '—'}</p>
                  </div>
                  <div>
                    <p className="text-[9px] font-bold text-slate-400 uppercase">Ubicación</p>
                    <p className="text-xs font-black">{selectedSolucion.direccion_exacta || '—'}</p>
                  </div>
                </div>
                <div>
                  <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Fortaleza</p>
                  <p className="text-sm font-medium">{selectedSolucion.fortaleza || '—'}</p>
                </div>
              </div>
              <div className="mt-8 flex justify-end">
                <button onClick={() => setSelectedSolucion(null)} className="px-6 py-3 rounded-xl bg-brand-primary text-white text-[10px] font-black uppercase tracking-widest shadow-md hover:scale-[1.02] transition-all">
                  Cerrar
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* MODAL DETALLE PROYECTO */}
      <ProyectoDetailModal
        isOpen={detailModalOpen}
        onClose={() => setDetailModalOpen(false)}
        proyecto={selectedProjectForDetail}
      />

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

// ==================== MODAL DE DETALLE DE PROYECTO (CORREGIDO) ====================
const ProyectoDetailModal = ({ isOpen, onClose, proyecto }: { isOpen: boolean; onClose: () => void; proyecto: Proyecto | null }) => {
  const [loadingDocs, setLoadingDocs] = useState(false);
  const [urls, setUrls] = useState<{
    foto_antes?: string;
    foto_durante?: string;
    foto_despues?: string;
    acta?: string;
  }>({});

  // 🔥 Función para normalizar la ruta: extrae la parte relativa al bucket
  const normalizeFilePath = (value: any): string | null => {
    if (!value) return null;
    
    let path: string | null = null;
    
    // Si es un string, verificar si es un array en formato JSON
    if (typeof value === 'string') {
      // Si comienza con '[' intentamos parsear como JSON
      if (value.trim().startsWith('[')) {
        try {
          const parsed = JSON.parse(value);
          if (Array.isArray(parsed) && parsed.length > 0) {
            path = parsed[0];
          }
        } catch (e) {
          // Si falla el parseo, usamos el string tal cual
          path = value;
        }
      } else {
        path = value;
      }
    } else if (Array.isArray(value) && value.length > 0) {
      // Si es un array directamente
      path = value[0];
    } else if (typeof value === 'string') {
      path = value;
    }
    
    if (!path || typeof path !== 'string') return null;
    
    // Si es una URL pública completa, extraer la parte después del bucket
    // Ejemplo: https://.../storage/v1/object/public/rendiciones_comuna/15/proyectos/11/acta.pdf
    // -> 15/proyectos/11/acta.pdf
    const match = path.match(/\/storage\/v1\/object\/public\/[^/]+\/(.*)/);
    if (match) {
      return match[1];
    }
    
    // Si no coincide, asumimos que ya es ruta relativa
    return path;
  };

  const getSignedUrl = async (filePath: string, tipo: 'comuna' | 'consejo'): Promise<string | null> => {
    if (!filePath) return null;
    const normalized = normalizeFilePath(filePath);
    if (!normalized) {
      console.warn('No se pudo normalizar la ruta:', filePath);
      return null;
    }
    try {
      // 🔥 Bucket correcto: consejo -> proyectos_docs, comuna -> rendiciones_comuna
      const bucketName = tipo === 'comuna' ? 'rendiciones_comuna' : 'proyectos_docs';
      const { data, error } = await supabase.storage.from(bucketName).createSignedUrl(normalized, 60);
      if (error) {
        console.error(`Error al firmar URL en bucket ${bucketName}:`, error);
        return null;
      }
      return data.signedUrl;
    } catch (err) {
      console.error('Error en getSignedUrl proyecto:', err);
      return null;
    }
  };

  // Cargar URLs cuando se abre el modal
  useEffect(() => {
    if (!isOpen || !proyecto) return;
    const loadUrls = async () => {
      setLoadingDocs(true);
      const tipo = proyecto.tipo;
      const newUrls: typeof urls = {};
      
      if (proyecto.foto_antes_url) {
        const url = await getSignedUrl(proyecto.foto_antes_url, tipo);
        if (url) newUrls.foto_antes = url;
      }
      if (proyecto.foto_durante_url) {
        const url = await getSignedUrl(proyecto.foto_durante_url, tipo);
        if (url) newUrls.foto_durante = url;
      }
      if (proyecto.foto_despues_url) {
        const url = await getSignedUrl(proyecto.foto_despues_url, tipo);
        if (url) newUrls.foto_despues = url;
      }
      if (proyecto.acta_url) {
        const url = await getSignedUrl(proyecto.acta_url, tipo);
        if (url) newUrls.acta = url;
      }
      
      setUrls(newUrls);
      setLoadingDocs(false);
    };
    loadUrls();
  }, [isOpen, proyecto]);

  if (!isOpen || !proyecto) return null;

  return (
    <AnimatePresence>
      {isOpen && proyecto && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm"
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="relative w-full max-w-2xl bg-white rounded-2xl shadow-xl overflow-hidden max-h-[80vh] overflow-y-auto"
          >
            {/* Cabecera */}
            <div className="sticky top-0 z-10 bg-white border-b border-gray-100 px-4 py-2 flex items-center justify-between">
              <div>
                <div className="flex items-center gap-1">
                  <span className="text-[8px] font-black text-brand-primary bg-brand-primary/10 px-1.5 py-0.5 rounded-md">{proyecto.id}</span>
                  <span className="text-[7px] font-black px-1.5 py-0.5 rounded-full bg-blue-100 text-blue-600 border border-blue-200 uppercase">{proyecto.t}</span>
                  <span className={cn("text-[7px] font-black px-1.5 py-0.5 rounded-md uppercase border", 
                    proyecto.status === "En Ejecución" ? "bg-amber-50 text-amber-700 border-amber-200" :
                    proyecto.status === "Culminado" ? "bg-emerald-50 text-emerald-700 border-emerald-200" :
                    "bg-slate-50 text-slate-700 border-slate-200"
                  )}>
                    {proyecto.status}
                  </span>
                </div>
                <h3 className="text-sm font-black text-slate-800 italic uppercase tracking-tight mt-1 leading-tight">{proyecto.name}</h3>
                <p className="text-[8px] text-slate-400 mt-0.5">Instancia: {proyecto.instanciaNombre}</p>
              </div>
              <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-gray-100 transition-all">
                <X className="h-4 w-4 text-slate-400" />
              </button>
            </div>

            {/* Contenido */}
            <div className="p-4 space-y-4">
              {/* Resumen */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                <div className="bg-slate-50 p-2 rounded-lg border border-slate-100">
                  <p className="text-[7px] font-black text-slate-600 uppercase">Presupuesto</p>
                  <p className="text-[10px] font-black text-slate-800">{proyecto.budget}</p>
                </div>
                <div className="bg-slate-50 p-2 rounded-lg border border-slate-100">
                  <p className="text-[7px] font-black text-slate-600 uppercase">Inicio</p>
                  <p className="text-[10px] font-black text-slate-800">{proyecto.date}</p>
                </div>
                <div className="bg-slate-50 p-2 rounded-lg border border-slate-100">
                  <p className="text-[7px] font-black text-slate-600 uppercase">Duración</p>
                  <p className="text-[10px] font-black text-slate-800">{proyecto.duracion || 'N/E'}</p>
                </div>
                <div className="bg-slate-50 p-2 rounded-lg border border-slate-100">
                  <p className="text-[7px] font-black text-slate-600 uppercase">Progreso</p>
                  <p className="text-[10px] font-black text-slate-800">{proyecto.progress}%</p>
                </div>
              </div>

              {/* Requerimientos */}
              {proyecto.requerimientos && (
                <div className="bg-amber-50/30 p-2.5 rounded-lg border border-amber-100">
                  <h5 className="text-[9px] font-black text-amber-700 uppercase tracking-wider flex items-center gap-1 mb-1">
                    <FileText className="h-2.5 w-2.5" /> Requerimientos
                  </h5>
                  <p className="text-[8px] text-slate-700">{proyecto.requerimientos}</p>
                </div>
              )}

              {/* Línea de tiempo con fotos (usando URLs firmadas) */}
              <div className="space-y-2">
                <h4 className="text-[9px] font-black text-slate-800 uppercase tracking-wider flex items-center gap-1">
                  <Calendar className="h-3 w-3 text-brand-primary" /> Línea de tiempo
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                  {[
                    { fase: 'Antes', fecha: proyecto.fecha_antes, desc: proyecto.desc_antes, url: urls.foto_antes, exists: proyecto.foto_antes_url },
                    { fase: 'Durante', fecha: proyecto.fecha_durante, desc: proyecto.desc_durante, url: urls.foto_durante, exists: proyecto.foto_durante_url },
                    { fase: 'Después', fecha: proyecto.fecha_despues, desc: proyecto.desc_despues, url: urls.foto_despues, exists: proyecto.foto_despues_url }
                  ].map((item, idx) => (
                    <div key={idx} className={cn(
                      "p-2 rounded-lg border",
                      idx === 0 ? "bg-amber-50/20 border-amber-100" :
                      idx === 1 ? "bg-brand-primary/5 border-brand-primary/20" :
                      "bg-emerald-50/20 border-emerald-100"
                    )}>
                      <p className={cn(
                        "text-[7px] font-black uppercase",
                        idx === 0 ? "text-amber-600" :
                        idx === 1 ? "text-brand-primary" :
                        "text-emerald-600"
                      )}>{item.fase}</p>
                      {item.fecha && <p className="text-[6px] text-slate-400">{item.fecha}</p>}
                      <p className="text-[7px] text-slate-600 mt-0.5 line-clamp-2">{item.desc || '—'}</p>
                      {loadingDocs ? (
                        <Loader2 className="h-3 w-3 animate-spin text-brand-primary mt-1" />
                      ) : item.url ? (
                        <a href={item.url} target="_blank" rel="noreferrer" className="inline-flex items-center gap-0.5 mt-1 text-[7px] text-brand-primary font-bold">
                          <Camera className="h-2 w-2" /> Ver foto
                        </a>
                      ) : item.exists && (
                        <span className="inline-block mt-1 text-[7px] text-slate-400 italic">No disponible</span>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Técnico responsable */}
              {(proyecto.tecnico_nombre || proyecto.tecnico_apellido || proyecto.tecnico_cedula) && (
                <div className="bg-slate-50 p-2 rounded-lg border border-slate-100">
                  <h5 className="text-[9px] font-black text-slate-700 uppercase tracking-wider flex items-center gap-1">
                    <UserCheck className="h-2.5 w-2.5" /> Técnico responsable
                  </h5>
                  <p className="text-[9px] font-semibold text-slate-700">
                    {[proyecto.tecnico_nombre, proyecto.tecnico_apellido].filter(Boolean).join(' ') || '—'}
                    {proyecto.tecnico_cedula && <span className="text-[9px] text-slate-600 ml-1">CI: {proyecto.tecnico_cedula}</span>}
                  </p>
                </div>
              )}

              {/* Acta (con URL firmada) */}
              {proyecto.acta_url && (
                <div className="bg-emerald-50/30 p-2 rounded-lg border border-emerald-100">
                  <h5 className="text-[7px] font-black text-emerald-700 uppercase tracking-wider flex items-center gap-1">
                    <FileText className="h-2.5 w-2.5" /> Documentación
                  </h5>
                  {loadingDocs ? (
                    <Loader2 className="h-3 w-3 animate-spin text-brand-primary" />
                  ) : urls.acta ? (
                    <a href={urls.acta} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-[8px] font-bold text-brand-primary hover:underline">
                      Ver acta del proyecto (PDF)
                    </a>
                  ) : (
                    <span className="text-[8px] text-slate-400 italic">Acta no disponible</span>
                  )}
                </div>
              )}

              {/* Respuesta institucional */}
              {proyecto.respuesta && (
                <div className="bg-blue-50/30 p-2 rounded-lg border border-blue-100">
                  <h5 className="text-[7px] font-black text-blue-700 uppercase tracking-wider flex items-center gap-1">
                    <MessageSquare className="h-2.5 w-2.5" /> Respuesta institucional
                  </h5>
                  <p className="text-[8px] text-slate-600">{proyecto.respuesta}</p>
                  {proyecto.fecha_respuesta && <p className="text-[6px] text-slate-400 mt-0.5">{proyecto.fecha_respuesta}</p>}
                </div>
              )}
            </div>

            <div className="sticky bottom-0 bg-white border-t border-gray-100 px-4 py-2 flex justify-end">
              <button onClick={onClose} className="px-4 py-1.5 rounded-lg bg-brand-primary text-white text-[8px] font-black uppercase shadow-md hover:scale-[1.02] transition-all">
                Cerrar
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

export default ACA;