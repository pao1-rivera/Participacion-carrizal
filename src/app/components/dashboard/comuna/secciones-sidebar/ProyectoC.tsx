"use client";

import React, { useState, useRef, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Plus, X, Construction, Upload, Camera, CheckCircle2, FileCheck,
  MapPin, ChevronRight, Users, FileText, MessageSquare, Edit,
  Trash2, Loader2, PieChart, Calendar, UserCheck, Building2, FileBarChart2,
  ArrowLeft, Eye, File, Receipt, ShieldCheck, Layers, Search, AlertCircle
} from "lucide-react";
import { cn } from "@/app/lib/utils";
import { supabase } from "@/app/lib/supabaseClient";
import { useAuth } from "@/context/AuthContext";
import { RendicionModalC } from "./RendicionModalC";
import { ProrrogaModalC } from "./ProrrogaModalC";
import { AlertModal } from "@/app/components/AlertModal"; // Importar AlertModal

// ==================== FUNCIÓN PARA OBTENER URL FIRMADA ====================
const getSignedImageUrl = async (bucketName: string, publicUrl: string): Promise<string | null> => {
  if (!publicUrl) return null;
  
  try {
    // Extraer la ruta del archivo de la URL pública
    const match = publicUrl.match(/\/object\/public\/[^/]+\/(.+)$/);
    if (!match) return publicUrl;
    
    const filePath = match[1];
    const { data, error } = await supabase.storage
      .from(bucketName)
      .createSignedUrl(filePath, 60 * 15); // 15 minutos de validez
    
    if (error || !data?.signedUrl) return publicUrl;
    return data.signedUrl;
  } catch (error) {
    console.error("Error generando URL firmada:", error);
    return publicUrl;
  }
};

// ==================== COMPONENTE DE IMAGEN CON URL FIRMADA ====================
const SignedImage = ({ src, alt, className, bucketName = "rendiciones_comuna" }: { src: string | null; alt: string; className?: string; bucketName?: string }) => {
  const [signedUrl, setSignedUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadImage = async () => {
      if (!src) {
        setLoading(false);
        return;
      }
      setLoading(true);
      const url = await getSignedImageUrl(bucketName, src);
      setSignedUrl(url);
      setLoading(false);
    };
    loadImage();
  }, [src, bucketName]);

  if (loading) {
    return (
      <div className={cn("bg-slate-100 flex items-center justify-center", className)}>
        <Loader2 className="h-4 w-4 animate-spin text-slate-400" />
      </div>
    );
  }

  if (!signedUrl) {
    return (
      <div className={cn("bg-slate-100 flex items-center justify-center", className)}>
        <Construction className="h-5 w-5 text-slate-300" />
      </div>
    );
  }

  return <img src={signedUrl} alt={alt} className={className} />;
};

// ==================== TIPOS ====================
export interface ProyectoComuna {
  id_proyecto_comuna: number;
  id_comuna: number;
  nombre: string;
  id_nudo_comuna: number | null;
  categoria_7t: string;
  presupuesto: number | null;
  presupuesto_asignado: number | null;
  ente_financiamiento: string | null;
  beneficiarios_familias: number | null;
  diagnostico: string | null;
  estado: string;
  progreso: number;
  acta_url: string | null;
  fotos_antes_urls: string[] | null;
  created_at: string;
  updated_at: string;
  codigo?: string;
  desc_antes: string | null;
  desc_durante: string | null;
  desc_despues: string | null;
  foto_antes_url: string | null;
  foto_durante_url: string | null;
  foto_despues_url: string | null;
  fecha_antes: string | null;
  fecha_durante: string | null;
  fecha_despues: string | null;
  respuesta: string | null;
  fecha_respuesta: string | null;
  requerimientos: string | null;
  duracion: string | null;
  tecnico_nombre: string | null;
  tecnico_apellido: string | null;
  tecnico_cedula: string | null;
}

interface RendicionComunaConProyecto {
  id_rendicion: number;
  id_proyecto_comuna: number;
  id_comuna: number;
  es_rendicion_final: boolean;
  categoria_seleccionada: string;
  fecha_inicio: string;
  fecha_fin: string;
  ingresos: number;
  egresos: number;
  id_voceros_firmantes: number[];
  fotos_evidencia_urls: string[];
  informe_gestion: string;
  acta_asamblea_url: string;
  facturas_legales_url: string;
  informe_contraloria_url: string;
  estado_cuenta_url: string;
  acepto_terminos: boolean;
  created_at?: string;
  proyecto_nombre: string;
  proyecto_codigo: string;
  proyecto_categoria: string;
  proyecto?: ProyectoComuna;
}

interface ProyectoConsejo {
  id_proyecto: number;
  nombre: string;
  estado: string;
  progreso: number;
  codigo: string | null;
  categoria_7t: string;
  presupuesto: number | null;
  presupuesto_asignado: number | null;
  fecha_antes: string | null;
  fecha_durante: string | null;
  fecha_despues: string | null;
  desc_antes: string | null;
  desc_durante: string | null;
  desc_despues: string | null;
  respuesta: string | null;
  fecha_respuesta: string | null;
  created_at: string;
  id_consejo: number;
  consejo_nombre?: string;
}

interface Consejo {
  id_consejo: number;
  nombre_consejo: string;
}

type RegistroUnificado = {
  id: number;
  tipo: 'rendicion' | 'prorroga';
  proyecto: ProyectoComuna;
  categoriaSeleccionada?: string;
  fechaInicio?: string;
  fechaFin?: string;
  tiempoEstimado?: string;
  estado?: string;
  datos: any;
};

// ==================== COMPONENTE PRINCIPAL ====================
export const ProyectoC = () => {
  const { user } = useAuth();
  const [comunaId, setComunaId] = useState<number | null>(null);
  const [noComuna, setNoComuna] = useState(false);
  const [proyectosComuna, setProyectosComuna] = useState<ProyectoComuna[]>([]);
  const [consejos, setConsejos] = useState<Consejo[]>([]);
  const [proyectosConsejos, setProyectosConsejos] = useState<ProyectoConsejo[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Estados de UI
  const [selectedConsejo, setSelectedConsejo] = useState<string>("all");
  const [activeSection, setActiveSection] = useState<'proyectos' | 'rendicion'>('proyectos');
  const [selectedCategoria, setSelectedCategoria] = useState<string>('Todas');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(9);
  const [searchTerm, setSearchTerm] = useState("");
  const [showRegistroDropdown, setShowRegistroDropdown] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Estados de modales
  const [isNewOpen, setIsNewOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [editingProject, setEditingProject] = useState<ProyectoComuna | null>(null);
  const [viewResponseOpen, setViewResponseOpen] = useState(false);
  const [isRendicionOpen, setIsRendicionOpen] = useState(false);
  const [isProrrogaOpen, setIsProrrogaOpen] = useState(false);
  const [showFinalRendicion, setShowFinalRendicion] = useState(false);
  const [currentProyecto, setCurrentProyecto] = useState<ProyectoComuna | null>(null);
  const [currentProrrogaProyecto, setCurrentProrrogaProyecto] = useState<ProyectoComuna | null>(null);
  const [finalRendicionProyecto, setFinalRendicionProyecto] = useState<{ id_proyecto: number; nombre: string; codigo?: string } | null>(null);
  const [prorrogaDetailOpen, setProrrogaDetailOpen] = useState(false);
  const [selectedProrroga, setSelectedProrroga] = useState<any>(null);
  const [selectedProrrogaProyecto, setSelectedProrrogaProyecto] = useState<ProyectoComuna | null>(null);

  // Estados del formulario stepper
  const [step, setStep] = useState(1);
  const [actaFile, setActaFile] = useState<File | null>(null);
  const [fotosFiles, setFotosFiles] = useState<File[]>([]);
  const [nudosDisponibles, setNudosDisponibles] = useState<any[]>([]);

  // Rendiciones y prórrogas de la comuna
  const [rendicionesComuna, setRendicionesComuna] = useState<RendicionComunaConProyecto[]>([]);
  const [solicitudesProrroga, setSolicitudesProrroga] = useState<any[]>([]);
  const [registrosUnificados, setRegistrosUnificados] = useState<RegistroUnificado[]>([]);
  
  // Detalle de rendición
  const [detailModalOpen, setDetailModalOpen] = useState(false);
  const [selectedRendicionForDetail, setSelectedRendicionForDetail] = useState<{ rendicion: any | null; proyecto: ProyectoComuna | null }>({ rendicion: null, proyecto: null });
  
  // Edición de registros
  const [editingRegistro, setEditingRegistro] = useState<RegistroUnificado | null>(null);
  const [isEditRendicionOpen, setIsEditRendicionOpen] = useState(false);
  const [isEditProrrogaOpen, setIsEditProrrogaOpen] = useState(false);
  
  // Formulario nuevo proyecto
  const [formNew, setFormNew] = useState({
    nombre: '',
    id_nudo_comuna: '',
    categoria_7t: 'T1',
    familias_beneficiadas: '',
    diagnostico: '',
    requerimientos: '',
    presupuesto: '',
    ente_financiamiento: 'Alcaldía',
    tecnico_nombre: '',
    tecnico_apellido: '',
    tecnico_cedula: '',
    duracion: '',
  });

  // ========== ESTADO PARA ALERT MODAL ==========
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
      confirmText: 'Sí, eliminar',
      cancelText: 'Cancelar',
    });
  };

  const closeModal = () => setModalState(prev => ({ ...prev, isOpen: false }));

  // ========== OCULTAR SIDEBAR CUANDO HAY MODAL ==========
  useEffect(() => {
    if (isNewOpen || editingProject || viewResponseOpen || isRendicionOpen || isProrrogaOpen || 
        showFinalRendicion || detailModalOpen || prorrogaDetailOpen || isEditRendicionOpen || 
        isEditProrrogaOpen || modalState.isOpen) {
      document.body.classList.add('modal-open');
    } else {
      document.body.classList.remove('modal-open');
    }
    return () => document.body.classList.remove('modal-open');
  }, [
    isNewOpen, editingProject, viewResponseOpen, isRendicionOpen, isProrrogaOpen,
    showFinalRendicion, detailModalOpen, prorrogaDetailOpen, isEditRendicionOpen,
    isEditProrrogaOpen, modalState.isOpen
  ]);

  // Cerrar dropdown al hacer clic fuera
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowRegistroDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // ========== OBTENER ID_COMUNA Y CONSEJOS ==========
  useEffect(() => {
    const fetchComunaYConsejos = async () => {
      if (!user?.id) {
        setLoading(false);
        return;
      }

      setLoading(true);
      try {
        // Obtener comuna del usuario
        const { data: comunaData, error: comunaError } = await supabase
          .from('datos_comuna')
          .select('id_comuna')
          .or(`id_usuario.eq.${user.id},id_usuario_auxiliar.eq.${user.id}`)
          .maybeSingle();

        if (comunaError) {
          console.error('Error cargando comuna:', comunaError);
          setNoComuna(true);
          setLoading(false);
          return;
        }

        if (!comunaData) {
          setNoComuna(true);
          setLoading(false);
          return;
        }

        const idComuna = comunaData.id_comuna;
        setComunaId(idComuna);
        setNoComuna(false);

        // Obtener sectores activos
        const { data: sectores, error: sectError } = await supabase
          .from('sectores')
          .select('id_sector')
          .eq('id_datos_comuna', idComuna)
          .eq('activo', true);

        if (sectError) {
          console.error('Error cargando sectores:', sectError);
          setConsejos([]);
          setLoading(false);
          return;
        }

        if (!sectores || sectores.length === 0) {
          setConsejos([]);
          setLoading(false);
          return;
        }

        const sectorIds = sectores.map(s => s.id_sector);
        const { data: consejosData, error: consejosError } = await supabase
          .from('datos_consejo_comunal')
          .select('id_consejo, nombre_consejo')
          .in('id_sector', sectorIds);

        if (consejosError) {
          console.error('Error cargando consejos:', consejosError);
          setConsejos([]);
        } else {
          setConsejos(consejosData || []);
        }
      } catch (error) {
        console.error('Error inesperado:', error);
        setNoComuna(true);
      } finally {
        setLoading(false);
      }
    };

    fetchComunaYConsejos();
  }, [user]);

  // ========== CARGAR PROYECTOS DE LA COMUNA ==========
  const fetchProyectosComuna = useCallback(async () => {
    if (!comunaId) return;
    const { data, error } = await supabase
      .from('proyectos_comuna')
      .select('*')
      .eq('id_comuna', comunaId)
      .order('created_at', { ascending: false });
    if (error) console.error('Error cargando proyectos comuna:', error);
    else setProyectosComuna(data || []);
  }, [comunaId]);

  // ========== CARGAR PROYECTOS DE CONSEJOS ==========
  const fetchProyectosConsejos = useCallback(async () => {
    if (!consejos.length) {
      setProyectosConsejos([]);
      return;
    }
    const consejoIds = consejos.map(c => c.id_consejo);
    const { data, error } = await supabase
      .from('proyectos')
      .select('*')
      .in('id_consejo', consejoIds)
      .order('created_at', { ascending: false });
    if (error) {
      console.error('Error cargando proyectos consejos:', error);
      setProyectosConsejos([]);
    } else {
      const proyectosConNombre = (data || []).map(p => ({
        ...p,
        consejo_nombre: consejos.find(c => c.id_consejo === p.id_consejo)?.nombre_consejo || 'Desconocido'
      }));
      setProyectosConsejos(proyectosConNombre);
    }
  }, [consejos]);

  // ========== CARGAR RENDICIONES Y PRÓRROGAS ==========
  const fetchRendicionesComuna = async () => {
    if (!comunaId) return;
    const { data, error } = await supabase
      .from('rendiciones_comuna')
      .select(`
        *,
        proyecto:proyectos_comuna!rendiciones_comuna_id_proyecto_comuna_fkey (
          id_proyecto_comuna,
          nombre,
          codigo,
          categoria_7t
        )
      `)
      .eq('id_comuna', comunaId)
      .order('created_at', { ascending: false });
    if (error) {
      console.error('Error cargando rendiciones comuna:', error);
      return;
    }
    const mapped: RendicionComunaConProyecto[] = (data || []).map((r: any) => ({
      ...r,
      proyecto_nombre: r.proyecto?.nombre || 'Desconocido',
      proyecto_codigo: r.proyecto?.codigo || '',
      proyecto_categoria: r.proyecto?.categoria_7t || '',
      proyecto: r.proyecto
    }));
    setRendicionesComuna(mapped);
  };

  const fetchSolicitudesProrroga = async () => {
    if (!comunaId) return;
    const { data, error } = await supabase
      .from('solicitudes_prorroga_comuna')
      .select(`
        *,
        proyecto:proyectos_comuna!solicitudes_prorroga_comuna_id_proyecto_comuna_fkey (
          id_proyecto_comuna,
          nombre,
          codigo,
          categoria_7t
        )
      `)
      .eq('id_comuna', comunaId)
      .order('created_at', { ascending: false });
    if (error) {
      console.error('Error cargando solicitudes de prórroga:', error);
      return;
    }
    setSolicitudesProrroga(data || []);
  };

  const unificarRegistros = () => {
    const rendicionesUnificadas: RegistroUnificado[] = rendicionesComuna.map(rend => ({
      id: rend.id_rendicion,
      tipo: 'rendicion',
      proyecto: rend.proyecto as ProyectoComuna,
      categoriaSeleccionada: rend.categoria_seleccionada,
      fechaInicio: rend.fecha_inicio,
      fechaFin: rend.fecha_fin,
      datos: rend
    }));
    const prorrogasUnificadas: RegistroUnificado[] = solicitudesProrroga.map(pr => ({
      id: pr.id_solicitud,
      tipo: 'prorroga',
      proyecto: pr.proyecto,
      tiempoEstimado: pr.tiempo_estimado,
      estado: pr.estado,
      datos: pr
    }));
    const todos = [...rendicionesUnificadas, ...prorrogasUnificadas];
    todos.sort((a, b) => {
      const fechaA = a.tipo === 'rendicion' ? a.datos.created_at : a.datos.created_at;
      const fechaB = b.tipo === 'rendicion' ? b.datos.created_at : b.datos.created_at;
      return new Date(fechaB).getTime() - new Date(fechaA).getTime();
    });
    setRegistrosUnificados(todos);
  };

  useEffect(() => {
    if (comunaId) {
      fetchProyectosComuna();
      fetchRendicionesComuna();
      fetchSolicitudesProrroga();
    }
  }, [comunaId, fetchProyectosComuna]);

  useEffect(() => {
    if (consejos.length) fetchProyectosConsejos();
  }, [consejos, fetchProyectosConsejos]);

  useEffect(() => {
    unificarRegistros();
  }, [rendicionesComuna, solicitudesProrroga]);

  // ========== NUDOS CRÍTICOS ==========
  const fetchNudosPorCategoria = useCallback(async (categoria: string) => {
    if (!comunaId) return;
    const { data, error } = await supabase
      .from('nudos_criticos_comuna')
      .select('id_nudo_comuna, titulo, categoria_7t, familias_afectadas, descripcion')
      .eq('id_comuna', comunaId)
      .eq('categoria_7t', categoria);
    if (error) {
      console.error('Error cargando nudos:', error);
      setNudosDisponibles([]);
    } else {
      setNudosDisponibles(data || []);
    }
  }, [comunaId]);

  useEffect(() => {
    if (isNewOpen || editingProject) {
      const cat = editingProject ? editingProject.categoria_7t : formNew.categoria_7t;
      fetchNudosPorCategoria(cat);
    }
  }, [isNewOpen, editingProject, formNew.categoria_7t, fetchNudosPorCategoria]);

  const handleNudoChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const nudoId = e.target.value;
    setFormNew(prev => ({ ...prev, id_nudo_comuna: nudoId }));
    if (nudoId === "") {
      setFormNew(prev => ({ ...prev, familias_beneficiadas: '', diagnostico: '' }));
    } else {
      const nudoSeleccionado = nudosDisponibles.find(n => n.id_nudo_comuna === parseInt(nudoId));
      if (nudoSeleccionado) {
        setFormNew(prev => ({
          ...prev,
          familias_beneficiadas: nudoSeleccionado.familias_afectadas?.toString() || '',
          diagnostico: nudoSeleccionado.descripcion || '',
        }));
      }
    }
  };

  // ========== SUBIR ARCHIVOS ==========
  const uploadActa = async (file: File, proyectoId: number): Promise<string | null> => {
    if (!comunaId) return null;
    const fileExt = file.name.split('.').pop();
    const fileName = `proyecto_${proyectoId}_acta_${Date.now()}.${fileExt}`;
    const filePath = `${comunaId}/proyectos/${proyectoId}/${fileName}`;
    const { error } = await supabase.storage
      .from('rendiciones_comuna')
      .upload(filePath, file, { upsert: true });
    if (error) return null;
    const { data } = supabase.storage.from('rendiciones_comuna').getPublicUrl(filePath);
    return data.publicUrl;
  };

  const uploadFotos = async (files: File[], proyectoId: number): Promise<string[]> => {
    const urls: string[] = [];
    for (const file of files) {
      const fileExt = file.name.split('.').pop();
      const fileName = `proyecto_${proyectoId}_foto_${Date.now()}_${Math.random()}.${fileExt}`;
      const filePath = `${comunaId}/proyectos/${proyectoId}/${fileName}`;
      const { error } = await supabase.storage
        .from('rendiciones_comuna')
        .upload(filePath, file, { upsert: true });
      if (error) continue;
      const { data } = supabase.storage.from('rendiciones_comuna').getPublicUrl(filePath);
      urls.push(data.publicUrl);
    }
    return urls;
  };

  // ========== CREAR NUEVO PROYECTO ==========
  const handleSubmitProject = async () => {
    if (!comunaId) {
      showAlert('Error', 'No se ha identificado la comuna', 'danger');
      return;
    }
    if (!actaFile) {
      showAlert('Acta requerida', 'El acta de asamblea es obligatoria', 'warning');
      return;
    }
    if (!formNew.nombre || !formNew.categoria_7t || !formNew.diagnostico || !formNew.requerimientos) {
      showAlert('Campos incompletos', 'Complete todos los campos obligatorios (*)', 'warning');
      return;
    }
    setSaving(true);
    try {
      const nuevoProyecto = {
        id_comuna: comunaId,
        nombre: formNew.nombre,
        id_nudo_comuna: formNew.id_nudo_comuna ? parseInt(formNew.id_nudo_comuna) : null,
        categoria_7t: formNew.categoria_7t,
        presupuesto: formNew.presupuesto ? parseFloat(formNew.presupuesto) : null,
        ente_financiamiento: formNew.ente_financiamiento || null,
        beneficiarios_familias: formNew.familias_beneficiadas ? parseInt(formNew.familias_beneficiadas) : null,
        diagnostico: formNew.diagnostico,
        requerimientos: formNew.requerimientos,
        duracion: formNew.duracion || null,
        tecnico_nombre: formNew.tecnico_nombre || null,
        tecnico_apellido: formNew.tecnico_apellido || null,
        tecnico_cedula: formNew.tecnico_cedula || null,
        estado: 'Propuesto',
        progreso: 0,
      };
      const { data: inserted, error: insertError } = await supabase
        .from('proyectos_comuna')
        .insert([nuevoProyecto])
        .select()
        .single();
      if (insertError) throw insertError;
      const proyectoId = inserted.id_proyecto_comuna;
      const actaUrl = await uploadActa(actaFile, proyectoId);
      if (actaUrl) await supabase.from('proyectos_comuna').update({ acta_url: actaUrl }).eq('id_proyecto_comuna', proyectoId);
      if (fotosFiles.length) {
        const fotosUrls = await uploadFotos(fotosFiles, proyectoId);
        if (fotosUrls.length) await supabase.from('proyectos_comuna').update({ fotos_antes_urls: fotosUrls }).eq('id_proyecto_comuna', proyectoId);
      }
      showAlert('Éxito', 'Proyecto registrado exitosamente', 'success');
      await fetchProyectosComuna();
      setIsNewOpen(false);
      resetFormNew();
    } catch (error) {
      console.error(error);
      showAlert('Error', 'Error al guardar el proyecto', 'danger');
    } finally {
      setSaving(false);
    }
  };

  const resetFormNew = () => {
    setFormNew({
      nombre: '',
      id_nudo_comuna: '',
      categoria_7t: 'T1',
      familias_beneficiadas: '',
      diagnostico: '',
      requerimientos: '',
      presupuesto: '',
      ente_financiamiento: 'Alcaldía',
      tecnico_nombre: '',
      tecnico_apellido: '',
      tecnico_cedula: '',
      duracion: '',
    });
    setActaFile(null);
    setFotosFiles([]);
    setStep(1);
    setNudosDisponibles([]);
  };

  // ========== EDITAR / ELIMINAR PROYECTO ==========
  const handleUpdateProject = async (proyecto: ProyectoComuna, estado: string, progreso: number, datos: any) => {
    const { error } = await supabase
      .from('proyectos_comuna')
      .update({ estado, progreso, ...datos })
      .eq('id_proyecto_comuna', proyecto.id_proyecto_comuna);
    if (error) {
      showAlert('Error', 'No se pudo actualizar el proyecto', 'danger');
    } else {
      await fetchProyectosComuna();
      showAlert('Éxito', 'Proyecto actualizado correctamente', 'success');
    }
    setEditingProject(null);
  };

  const handleDeleteProject = async (id: number) => {
    showConfirm('Eliminar proyecto', '¿Eliminar este proyecto permanentemente?', async () => {
      const { error } = await supabase.from('proyectos_comuna').delete().eq('id_proyecto_comuna', id);
      if (error) {
        showAlert('Error', 'No se pudo eliminar el proyecto', 'danger');
      } else {
        await fetchProyectosComuna();
        showAlert('Eliminado', 'Proyecto eliminado correctamente', 'success');
      }
    });
  };

  // ========== HANDLERS DE RENDICIÓN Y PRÓRROGA ==========
  const handleViewResponse = (proyecto: ProyectoComuna) => { setCurrentProyecto(proyecto); setViewResponseOpen(true); };
  const handleRendicion = (proyecto: ProyectoComuna) => { setCurrentProyecto(proyecto); setIsRendicionOpen(true); };
  const handleProrroga = (proyecto: ProyectoComuna) => { setCurrentProrrogaProyecto(proyecto); setIsProrrogaOpen(true); };
  const handleProrrogaAccepted = (proyecto: { id_proyecto: number; nombre: string; codigo?: string }) => {
    setFinalRendicionProyecto(proyecto);
    setShowFinalRendicion(true);
  };
  const openDetailModal = (rendicion: any, proyecto: ProyectoComuna) => {
    setSelectedRendicionForDetail({ rendicion, proyecto });
    setDetailModalOpen(true);
  };
  const handleEditRegistro = (registro: RegistroUnificado) => {
    if (registro.tipo === 'rendicion') {
      setEditingRegistro(registro);
      setIsEditRendicionOpen(true);
    } else {
      setEditingRegistro(registro);
      setIsEditProrrogaOpen(true);
    }
  };
  const handleViewRegistro = (registro: RegistroUnificado) => {
    if (registro.tipo === 'rendicion') {
      openDetailModal(registro.datos, registro.proyecto);
    } else {
      setSelectedProrroga(registro.datos);
      setSelectedProrrogaProyecto(registro.proyecto);
      setProrrogaDetailOpen(true);
    }
  };

  // ========== FILTRADO Y PAGINACIÓN ==========
  const resetPagination = () => setCurrentPage(1);
  const filterBySearch = (p: any) => {
    if (!searchTerm) return true;
    const term = searchTerm.toLowerCase();
    return p.nombre?.toLowerCase().includes(term) || p.codigo?.toLowerCase().includes(term);
  };
  const comunaFiltrados = proyectosComuna
    .filter(p => selectedCategoria === 'Todas' || p.categoria_7t === selectedCategoria)
    .filter(filterBySearch);
  const indexOfLastComuna = currentPage * itemsPerPage;
  const indexOfFirstComuna = indexOfLastComuna - itemsPerPage;
  const currentProyectosComuna = comunaFiltrados.slice(indexOfFirstComuna, indexOfLastComuna);
  const totalPagesComuna = Math.ceil(comunaFiltrados.length / itemsPerPage);
  
  const consejosFiltradosPorConsejo = selectedConsejo === 'all'
    ? proyectosConsejos
    : proyectosConsejos.filter(p => p.consejo_nombre === selectedConsejo);
  const consejosFiltrados = consejosFiltradosPorConsejo
    .filter(p => selectedCategoria === 'Todas' || p.categoria_7t === selectedCategoria)
    .filter(filterBySearch);
  const indexOfLastConsejos = currentPage * itemsPerPage;
  const indexOfFirstConsejos = indexOfLastConsejos - itemsPerPage;
  const currentProyectosConsejos = consejosFiltrados.slice(indexOfFirstConsejos, indexOfLastConsejos);
  const totalPagesConsejos = Math.ceil(consejosFiltrados.length / itemsPerPage);
  
  const registrosFiltrados = selectedCategoria === 'Todas'
    ? registrosUnificados
    : registrosUnificados.filter(r => r.proyecto?.categoria_7t === selectedCategoria);
  const indexOfLastRegistro = currentPage * itemsPerPage;
  const indexOfFirstRegistro = indexOfLastRegistro - itemsPerPage;
  const currentRegistros = registrosFiltrados.slice(indexOfFirstRegistro, indexOfLastRegistro);
  const totalPagesRegistros = Math.ceil(registrosFiltrados.length / itemsPerPage);
  
  const totalProyectos = proyectosComuna.length + proyectosConsejos.length;
  const totalComuna = proyectosComuna.length;
  const totalConsejos = proyectosConsejos.length;
  const totalRendiciones = rendicionesComuna.length + solicitudesProrroga.length;

  const handleActaUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && file.type === 'application/pdf') setActaFile(file);
    else showAlert('Formato no válido', 'Solo se permiten archivos PDF para el acta', 'warning');
  };
  const handleFotosUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    const imageFiles = files.filter(file => file.type.startsWith('image/'));
    setFotosFiles(prev => [...prev, ...imageFiles.slice(0, 5)]);
  };
  const nextStep = () => { if (step < 4) setStep(step + 1); };
  const prevStep = () => { if (step > 1) setStep(step - 1); };

  // ========== RECARGAR PROYECTOS AL CAMBIAR DE PESTAÑA ==========
  useEffect(() => {
    if (activeSection === 'proyectos') {
      fetchProyectosComuna();
      fetchProyectosConsejos();
    }
  }, [activeSection, fetchProyectosComuna, fetchProyectosConsejos]);

  // ========== ESCUCHAR EVENTO DE AUTORIZACIÓN DESDE PorAprobar ==========
  useEffect(() => {
    const handleProjectChange = () => {
      if (activeSection === 'proyectos') {
        fetchProyectosComuna();
        fetchProyectosConsejos();
      }
    };
    window.addEventListener('projectStatusChanged', handleProjectChange);
    return () => window.removeEventListener('projectStatusChanged', handleProjectChange);
  }, [activeSection, fetchProyectosComuna, fetchProyectosConsejos]);

  if (loading) return <div className="flex justify-center p-8"><Loader2 className="animate-spin text-brand-primary" size={28} /></div>;

  if (noComuna) {
    const onNavigate = (route: string) => {
      try {
        const base = '/dashboard/comuna';
        const target = route.startsWith('/') ? route : `${base}/${route}`;
        if (typeof window !== 'undefined') window.location.href = target;
      } catch (err) {
        console.error('Error navegando:', err);
      }
    };

    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center p-8 bg-white rounded-3xl border border-gray-100 shadow-sm">
        <div className="h-20 w-20 rounded-full bg-amber-100 flex items-center justify-center mb-6">
          <AlertCircle className="h-10 w-10 text-amber-600" />
        </div>
        <h3 className="text-xl font-black text-slate-800 uppercase tracking-tighter mb-2">
          Aún no has registrado tu Comuna
        </h3>
        <p className="text-slate-500 max-w-md mb-8">
          Para acceder a las estadísticas y funcionalidades del dashboard, primero debes completar los datos legales de tu comuna.
        </p>
        <button
          onClick={() => onNavigate("documentacion")}
          className="px-8 py-3 bg-brand-primary text-white rounded-xl font-black text-sm shadow-lg hover:scale-[1.02] transition-all flex items-center gap-2"
        >
          <FileCheck className="h-4 w-4" />
          Completar Datos Legales
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* CABECERA */}
      <div className="flex flex-col sm:flex-row gap-3 bg-gradient-to-r from-slate-50 to-gray-50 p-4 rounded-xl border border-gray-100 shadow-sm">
        <div className="flex-1">
          <h3 className="text-sm font-black text-slate-800 italic uppercase tracking-tighter mb-1">Gestión de Proyectos 7T</h3>
          <p className="text-[8px] text-slate-400 font-bold uppercase tracking-wider">Seguimiento y Rendición de Cuentas</p>
        </div>
        <div className="flex gap-2">
          <button onClick={() => { setActiveSection('proyectos'); setCurrentPage(1); }} className={cn("flex-1 px-4 py-2 rounded-lg text-[8px] font-black uppercase tracking-wider shadow-md flex items-center justify-center gap-1.5", activeSection === 'proyectos' ? "bg-brand-primary text-white shadow-brand-primary/20 hover:scale-105" : "bg-white text-brand-primary border border-brand-primary/20 hover:bg-brand-primary/5")}>
            <FileBarChart2 className="h-3 w-3" /> Proyectos
          </button>
          <button onClick={() => { setActiveSection('rendicion'); setCurrentPage(1); }} className={cn("flex-1 px-4 py-2 rounded-lg text-[8px] font-black uppercase tracking-wider shadow-md flex items-center justify-center gap-1.5", activeSection === 'rendicion' ? "bg-brand-primary text-white shadow-brand-primary/20 hover:scale-105" : "bg-white text-brand-primary border border-brand-primary/20 hover:bg-brand-primary/5")}>
            <FileText className="h-3 w-3" /> Rendición
          </button>
        </div>
      </div>

      {/* CARACTERIZACIÓN compacta */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="bg-white p-3 rounded-xl border border-gray-100 shadow-sm flex items-center gap-3">
          <div className="h-8 w-8 rounded-lg bg-blue-50 text-blue-500 flex items-center justify-center"><Construction className="h-4 w-4" /></div>
          <div><p className="text-[8px] font-bold text-slate-400 uppercase">Total Proyectos</p><p className="text-sm font-black text-slate-800">{totalProyectos}</p><p className="text-[7px] font-bold text-slate-400">comunas: {totalComuna}  consejos: {totalConsejos}</p></div>
        </div>
        <div className="bg-white p-3 rounded-xl border border-gray-100 shadow-sm flex items-center gap-3">
          <div className="h-8 w-8 rounded-lg bg-orange-50 text-orange-500 flex items-center justify-center"><Calendar className="h-4 w-4" /></div>
          <div><p className="text-[8px] font-bold text-slate-400 uppercase">Prórrogas</p><p className="text-sm font-black text-slate-800">{solicitudesProrroga.length}</p></div>
        </div>
        <div className="bg-white p-3 rounded-xl border border-gray-100 shadow-sm flex items-center gap-3">
          <div className="h-8 w-8 rounded-lg bg-emerald-50 text-emerald-500 flex items-center justify-center"><PieChart className="h-4 w-4" /></div>
          <div><p className="text-[8px] font-bold text-slate-400 uppercase">Rendiciones</p><p className="text-sm font-black text-slate-800">{totalRendiciones}</p></div>
        </div>
      </div>

      {/* SECCIÓN PROYECTOS */}
      <AnimatePresence mode="wait">
        {activeSection === 'proyectos' && (
          <motion.div key="proyectos" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} transition={{ duration: 0.2 }}>
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 mb-6">
              <div className="relative flex-1 max-w-md">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <input type="text" placeholder="Buscar proyecto por nombre o código..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="w-full pl-9 pr-4 py-2 rounded-xl border border-gray-200 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-brand-primary/20" />
              </div>
              <div className="flex flex-col sm:flex-row gap-3 items-end">
                <select value={selectedCategoria} onChange={(e) => { setSelectedCategoria(e.target.value); resetPagination(); }} className="w-full sm:w-auto px-3 py-1.5 rounded-lg bg-white border border-brand-primary text-[9px] font-black text-slate-800">
                  <option value="Todas">Todas las Transformaciones ({totalProyectos})</option>
                  {['T1','T2','T3','T4','T5','T6','T7'].map(t => <option key={t} value={t}>{t} ({[...proyectosComuna, ...proyectosConsejos].filter(p => p.categoria_7t === t).length})</option>)}
                </select>
                <button onClick={() => setIsNewOpen(true)} className="flex items-center gap-1.5 rounded-lg bg-brand-primary px-4 py-1.5 text-[8px] font-black text-white shadow-md hover:scale-105"><Plus className="h-3 w-3" /> Nuevo Proyecto</button>
              </div>
            </div>

            {/* PROYECTOS COMUNA (estilo horizontal) - CON SignedImage */}
            <div className="space-y-6 mb-8">
              <div className="grid gap-3 grid-cols-1">
                {currentProyectosComuna.map(p => (
                  <ProyectoCardComunaHorizontal 
                    key={p.id_proyecto_comuna} 
                    proyecto={p} 
                    onEdit={() => setEditingProject(p)} 
                    onDelete={() => handleDeleteProject(p.id_proyecto_comuna)} 
                    onViewResponse={() => handleViewResponse(p)} 
                    onRendicion={() => handleRendicion(p)} 
                  />
                ))}
              </div>
              {totalPagesComuna > 1 && <PaginationComponent currentPage={currentPage} totalPages={totalPagesComuna} onPageChange={setCurrentPage} totalItems={comunaFiltrados.length} />}

              <div className="grid gap-3 grid-cols-1">
                {currentProyectosConsejos.map(p => <ProyectoCardConsejoHorizontal key={p.id_proyecto} proyecto={p} />)}
              </div>
              {totalPagesConsejos > 1 && <PaginationComponent currentPage={currentPage} totalPages={totalPagesConsejos} onPageChange={setCurrentPage} totalItems={consejosFiltrados.length} />}
            </div>
          </motion.div>
        )}

        {/* SECCIÓN RENDICIÓN - TABLA UNIFICADA */}
        {activeSection === 'rendicion' && (
          <motion.div key="rendicion" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }} transition={{ duration: 0.2 }}>
            <div className="flex items-center justify-between flex-wrap gap-3 mb-4">
              <div><h3 className="text-sm font-black text-slate-800 italic uppercase">Registros de Rendición y Prórroga</h3><p className="text-[8px] text-slate-400 font-bold uppercase mt-0.5">{registrosUnificados.length} registros totales • Página {currentPage} de {totalPagesRegistros}</p></div>
              <div className="flex flex-col sm:flex-row gap-2">
                <select value={selectedCategoria} onChange={e => { setSelectedCategoria(e.target.value); resetPagination(); }} className="w-full sm:w-auto px-3 py-1.5 rounded-lg bg-white border border-brand-primary text-[9px] font-black">
                  <option value="Todas">Todas las categorías ({registrosUnificados.length})</option>
                  {['T1','T2','T3','T4','T5','T6','T7'].map(t => <option key={t} value={t}>{t} ({registrosUnificados.filter(r => r.proyecto?.categoria_7t === t).length})</option>)}
                </select>
                <div className="relative" ref={dropdownRef}>
                  <button onClick={() => setShowRegistroDropdown(!showRegistroDropdown)} className="flex items-center gap-1.5 rounded-lg bg-brand-primary px-4 py-1.5 text-[8px] font-black text-white shadow-md hover:scale-105">
                    <Plus className="h-3 w-3" /> Nuevo Registro
                  </button>
                  {showRegistroDropdown && (
                    <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-100 z-20">
                      <button onClick={() => { setShowRegistroDropdown(false); setIsRendicionOpen(true); }} className="w-full text-left px-4 py-2 text-[10px] font-bold text-slate-700 hover:bg-gray-50 rounded-t-lg">
                        Rendición de Cuentas
                      </button>
                      <button onClick={() => { setShowRegistroDropdown(false); setIsProrrogaOpen(true); }} className="w-full text-left px-4 py-2 text-[10px] font-bold text-slate-700 hover:bg-gray-50 rounded-b-lg">
                        Solicitar Prórroga o Refinanciamiento
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="mt-4 overflow-x-auto">
              <table className="min-w-full bg-white border border-gray-100 rounded-xl shadow-sm">
                <thead className="bg-gray-50 border-b border-gray-100">
                  <tr>
                    <th className="px-4 py-2 text-left text-[9px] font-black uppercase text-slate-500">Transformación</th>
                    <th className="px-4 py-2 text-left text-[9px] font-black uppercase text-slate-500">Proyecto</th>
                    <th className="px-4 py-2 text-left text-[9px] font-black uppercase text-slate-500">Categoría</th>
                    <th className="px-4 py-2 text-left text-[9px] font-black uppercase text-slate-500">Lapso contable / Tiempo</th>
                    <th className="px-4 py-2 text-left text-[9px] font-black uppercase text-slate-500">Registro</th>
                    <th className="px-4 py-2 text-center text-[9px] font-black uppercase text-slate-500">Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {currentRegistros.map(reg => (
                    <tr key={`${reg.tipo}-${reg.id}`} className="border-b border-gray-50 hover:bg-gray-50/30">
                      <td className="px-4 py-3"><span className="inline-block px-2 py-0.5 rounded-full bg-brand-primary/10 text-brand-primary text-[9px] font-black">{reg.proyecto?.categoria_7t || 'N/A'}</span></td>
                      <td className="px-4 py-3"><div className="text-xs font-bold text-slate-800">{reg.proyecto?.nombre}</div><div className="text-[9px] text-slate-400 font-mono">{reg.proyecto?.codigo}</div></td>
                      <td className="px-4 py-3 text-xs">{reg.tipo === 'rendicion' ? reg.categoriaSeleccionada?.toUpperCase() || '—' : 'Prórroga'}</td>
                      <td className="px-4 py-3 text-xs">{reg.tipo === 'rendicion' ? `${new Date(reg.fechaInicio!).toLocaleDateString()} - ${new Date(reg.fechaFin!).toLocaleDateString()}` : reg.tiempoEstimado}</td>
                      <td className="px-4 py-3"><span className={cn("inline-block px-2 py-0.5 rounded-full text-[9px] font-black uppercase", reg.tipo === 'rendicion' ? "bg-emerald-100 text-emerald-700" : "bg-amber-100 text-amber-700")}>{reg.tipo === 'rendicion' ? 'Rendición' : 'Prórroga'}</span>{reg.tipo === 'prorroga' && <span className="ml-2 text-[8px] font-bold text-slate-400">({reg.estado})</span>}</td>
                      <td className="px-4 py-3 text-center"><div className="flex justify-center gap-2"><button onClick={() => handleViewRegistro(reg)} className="p-1.5 rounded-lg bg-blue-50 text-blue-600 hover:bg-blue-100"><Eye className="h-3.5 w-3.5" /></button><button onClick={() => handleEditRegistro(reg)} className="p-1.5 rounded-lg bg-amber-50 text-amber-600 hover:bg-amber-100"><Edit className="h-3.5 w-3.5" /></button></div></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {totalPagesRegistros > 1 && <PaginationComponent currentPage={currentPage} totalPages={totalPagesRegistros} onPageChange={setCurrentPage} totalItems={registrosFiltrados.length} />}
          </motion.div>
        )}
      </AnimatePresence>

      {/* MODALES */}
      <ViewResponseModalComuna isOpen={viewResponseOpen} onClose={()=>setViewResponseOpen(false)} proyecto={currentProyecto} />
      <RendicionModalC isOpen={isRendicionOpen} onClose={()=>{setIsRendicionOpen(false); fetchRendicionesComuna();}} proyecto={currentProyecto} proyectoName={currentProyecto?.nombre||""} onSuccess={()=>{fetchRendicionesComuna();}} />
      <ProrrogaModalC
        isOpen={isProrrogaOpen}
        onClose={() => { setIsProrrogaOpen(false); setCurrentProrrogaProyecto(null); }}
        proyectoName={currentProrrogaProyecto?.nombre || ''}
        proyectos={proyectosComuna.map(p => ({
          id_proyecto_comuna: p.id_proyecto_comuna,
          nombre: p.nombre,
          codigo: p.codigo || '',
          categoria_7t: p.categoria_7t,
          ente_financiamiento: p.ente_financiamiento || '',
          estado: p.estado || ''
        }))}
        onSelectProyecto={(proy) => setCurrentProrrogaProyecto(proyectosComuna.find(p => p.id_proyecto_comuna === proy.id_proyecto_comuna) || null)}
        selectedProyecto={currentProrrogaProyecto ? {
          id_proyecto_comuna: currentProrrogaProyecto.id_proyecto_comuna,
          nombre: currentProrrogaProyecto.nombre,
          codigo: currentProrrogaProyecto.codigo || '',
          categoria_7t: currentProrrogaProyecto.categoria_7t,
          ente_financiamiento: currentProrrogaProyecto.ente_financiamiento || '',
          estado: currentProrrogaProyecto.estado || ''
        } : null}
        onProrrogaAccepted={handleProrrogaAccepted}
        editMode={!!editingRegistro && editingRegistro.tipo === 'prorroga'}
        initialData={editingRegistro?.datos}
        onSuccess={() => {
          fetchSolicitudesProrroga();
          setEditingRegistro(null);
          setIsEditProrrogaOpen(false);
        }}
      />
      <FinalRendicionConfirmationComuna isOpen={showFinalRendicion} proyecto={finalRendicionProyecto!} onConfirm={()=>{setShowFinalRendicion(false); setIsRendicionOpen(true);}} onCancel={()=>{setShowFinalRendicion(false); setFinalRendicionProyecto(null);}} />
      <RendicionDetailModalComuna isOpen={detailModalOpen} onClose={()=>setDetailModalOpen(false)} rendicion={selectedRendicionForDetail.rendicion} proyecto={selectedRendicionForDetail.proyecto} />
      <ProrrogaDetailModalComuna isOpen={prorrogaDetailOpen} onClose={() => { setProrrogaDetailOpen(false); setSelectedProrroga(null); setSelectedProrrogaProyecto(null); }} prorroga={selectedProrroga} proyecto={selectedProrrogaProyecto} />

      {/* MODALES DE EDICIÓN */}
      {isEditRendicionOpen && editingRegistro && editingRegistro.tipo==='rendicion' && (
        <RendicionModalC isOpen={isEditRendicionOpen} onClose={()=>{setIsEditRendicionOpen(false); setEditingRegistro(null);}} proyecto={editingRegistro.proyecto} proyectoName={editingRegistro.proyecto.nombre} onSuccess={()=>{fetchRendicionesComuna(); setIsEditRendicionOpen(false); setEditingRegistro(null);}} editMode={true} initialData={editingRegistro.datos} />
      )}
      {isEditProrrogaOpen && editingRegistro && editingRegistro.tipo==='prorroga' && (
        <ProrrogaModalC isOpen={isEditProrrogaOpen} onClose={()=>{setIsEditProrrogaOpen(false); setEditingRegistro(null);}} proyectoName={editingRegistro.proyecto.nombre} proyectos={[]} onSelectProyecto={()=>{}} selectedProyecto={null} onProrrogaAccepted={()=>{}} editMode={true} initialData={editingRegistro.datos} onSuccess={()=>{fetchSolicitudesProrroga(); setIsEditProrrogaOpen(false); setEditingRegistro(null);}} />
      )}

      {/* MODAL NUEVO PROYECTO (z-index alto para estar por encima del sidebar) */}
      <AnimatePresence>
        {isNewOpen && (
          <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setIsNewOpen(false)} className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" />
            <motion.div initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 20 }} className="relative w-full max-w-xl bg-white rounded-3xl shadow-2xl overflow-hidden max-h-[90vh] overflow-y-auto">
              <div className="bg-slate-50 p-5 border-b border-gray-100 sticky top-0 z-10"><div className="flex justify-between mb-3"><h4 className="text-sm font-black text-slate-800 italic uppercase">Nuevo Proyecto Comunal</h4><button onClick={() => setIsNewOpen(false)}><X className="h-3.5 w-3.5 text-slate-400"/></button></div><div className="flex gap-2">{ [1,2,3,4].map(s => <div key={s} className="flex-1"><div className={cn("h-0.5 rounded-full", step >= s ? "bg-brand-primary" : "bg-gray-200")} /><span className={cn("text-[8px] font-bold uppercase text-center block", step === s ? "text-brand-primary" : "text-slate-300")}>Paso {s}</span></div>)}</div></div>
              <div className="p-5 space-y-4">
                {step === 1 && (<div className="space-y-3"><input className="w-full p-3 rounded-xl bg-gray-50 text-[10px] font-bold" placeholder="Nombre del proyecto *" value={formNew.nombre} onChange={e=>setFormNew({...formNew,nombre:e.target.value})} /><select className="w-full p-3 rounded-xl bg-gray-50 text-[10px] font-bold" value={formNew.id_nudo_comuna} onChange={handleNudoChange}><option value="">Vincular a nudo crítico</option>{nudosDisponibles.map(n=> <option key={n.id_nudo_comuna} value={n.id_nudo_comuna}>{n.titulo} ({n.categoria_7t})</option>)}</select><select className="w-full p-3 rounded-xl bg-gray-50 text-[10px] font-bold" value={formNew.categoria_7t} onChange={e=>setFormNew({...formNew,categoria_7t:e.target.value})}><option value="T1">T1 - Económica</option><option value="T2">T2 - Servicios</option><option value="T3">T3 - Seguridad</option><option value="T4">T4 - Social</option><option value="T5">T5 - Política</option><option value="T6">T6 - Ciencia</option><option value="T7">T7 - Geopolítica</option></select><input type="number" className="w-full p-3 rounded-xl bg-gray-50 text-[10px] font-bold" placeholder="Familias beneficiadas" value={formNew.familias_beneficiadas} onChange={e=>setFormNew({...formNew,familias_beneficiadas:e.target.value})} disabled={formNew.id_nudo_comuna !== ""} /><textarea rows={2} className="w-full p-3 rounded-xl bg-gray-50 text-[10px] font-bold resize-none" placeholder="Diagnóstico *" value={formNew.diagnostico} onChange={e=>setFormNew({...formNew,diagnostico:e.target.value})} disabled={formNew.id_nudo_comuna !== ""} /></div>)}
                {step === 2 && (<div className="space-y-3"><textarea rows={3} className="w-full p-3 rounded-xl bg-gray-50 text-[10px] font-bold resize-none" placeholder="Requerimientos *" value={formNew.requerimientos} onChange={e=>setFormNew({...formNew,requerimientos:e.target.value})} /><input type="number" step="0.01" className="w-full p-3 rounded-xl bg-gray-50 text-[10px] font-bold" placeholder="Presupuesto USD" value={formNew.presupuesto} onChange={e=>setFormNew({...formNew,presupuesto:e.target.value})} /><select className="w-full p-3 rounded-xl bg-gray-50 text-[10px] font-bold" value={formNew.ente_financiamiento} onChange={e=>setFormNew({...formNew,ente_financiamiento:e.target.value})}><option value="Alcaldía">Alcaldía</option><option value="Autogestión">Autogestión</option></select><div className="grid grid-cols-3 gap-2"><input placeholder="Nombre técnico" className="p-3 rounded-xl bg-gray-50 text-[10px] font-bold" value={formNew.tecnico_nombre} onChange={e=>setFormNew({...formNew,tecnico_nombre:e.target.value})} /><input placeholder="Apellido" className="p-3 rounded-xl bg-gray-50 text-[10px] font-bold" value={formNew.tecnico_apellido} onChange={e=>setFormNew({...formNew,tecnico_apellido:e.target.value})} /><input placeholder="Cédula" className="p-3 rounded-xl bg-gray-50 text-[10px] font-bold" value={formNew.tecnico_cedula} onChange={e=>setFormNew({...formNew,tecnico_cedula:e.target.value})} /></div><input placeholder="Duración (ej: 3 meses)" className="w-full p-3 rounded-xl bg-gray-50 text-[10px] font-bold" value={formNew.duracion} onChange={e=>setFormNew({...formNew,duracion:e.target.value})} /></div>)}
                {step === 3 && (<div className="grid grid-cols-2 gap-3"><div className="p-4 border-2 border-dashed rounded-xl text-center cursor-pointer" onClick={()=>document.getElementById('actaInput')?.click()}><input id="actaInput" type="file" className="hidden" accept=".pdf" onChange={handleActaUpload} /><FileText className="h-8 w-8 text-slate-300 mx-auto mb-1"/><p className="text-[10px] font-black uppercase">Acta de asamblea *</p><p className="text-[8px] text-slate-400">{actaFile ? actaFile.name : "Requerido (PDF)"}</p></div><div className="p-4 border-2 border-dashed rounded-xl text-center cursor-pointer" onClick={()=>document.getElementById('fotosInput')?.click()}><input id="fotosInput" type="file" className="hidden" multiple accept="image/*" onChange={handleFotosUpload} /><Camera className="h-8 w-8 text-slate-300 mx-auto mb-1"/><p className="text-[10px] font-black uppercase">Fotos soporte</p><p className="text-[8px] text-slate-400">{fotosFiles.length} selec.</p></div></div>)}
                {step === 4 && (<div className="flex flex-col items-center py-6"><div className="h-16 w-16 rounded-xl bg-emerald-100 flex items-center justify-center"><CheckCircle2 className="h-8 w-8 text-emerald-600" /></div><h4 className="text-base font-black text-slate-800 mt-3">¡Listo para registro!</h4><p className="text-slate-500 text-[10px] text-center">Estado inicial: <span className="font-black text-brand-primary">"Propuesto"</span></p></div>)}
              </div>
              <div className="p-4 bg-slate-50 border-t flex justify-between"><button onClick={prevStep} disabled={step===1} className="px-4 py-2 rounded-lg border text-[9px] font-black disabled:opacity-50">Anterior</button><button onClick={step===4 ? handleSubmitProject : nextStep} disabled={saving} className="px-5 py-2.5 rounded-lg bg-brand-primary text-white text-[9px] font-black">{saving ? <Loader2 className="h-3 w-3 animate-spin"/> : (step===4 ? "Registrar" : "Siguiente")}</button></div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* MODAL EDICIÓN PROYECTO (z-index alto) */}
      <AnimatePresence>
        {editingProject && (
          <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
            <motion.div initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}} onClick={()=>setEditingProject(null)} className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"/>
            <motion.div initial={{scale:0.95}} animate={{scale:1}} exit={{scale:0.95}} className="relative w-full max-w-lg bg-white rounded-2xl shadow-2xl p-6">
              <div className="flex justify-between mb-5"><h4 className="text-base font-black text-slate-800">Actualizar Proyecto</h4><button onClick={()=>setEditingProject(null)}><X className="h-4 w-4"/></button></div>
              <EditProjectFormComuna proyecto={editingProject} onUpdate={handleUpdateProject} onCancel={()=>setEditingProject(null)} />
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

// ========== COMPONENTES AUXILIARES (sin cambios, solo se mantienen) ==========

// Tarjeta horizontal para proyectos de comuna - CON SignedImage para bucket privado
const ProyectoCardComunaHorizontal = ({ proyecto, onEdit, onDelete, onViewResponse, onRendicion }: any) => {
  const [firstPhotoUrl, setFirstPhotoUrl] = useState<string | null>(null);
  
  useEffect(() => {
    const loadFirstPhoto = async () => {
      if (proyecto.fotos_antes_urls?.length) {
        const signedUrl = await getSignedImageUrl("rendiciones_comuna", proyecto.fotos_antes_urls[0]);
        setFirstPhotoUrl(signedUrl);
      }
    };
    loadFirstPhoto();
  }, [proyecto.fotos_antes_urls]);
  
  const statusColors: Record<string,string> = {
    'Propuesto': 'bg-slate-100 text-slate-600',
    'En revisión': 'bg-amber-100 text-amber-700',
    'En Ejecución': 'bg-brand-primary/10 text-brand-primary',
    'Culminado': 'bg-emerald-50 text-emerald-600',
    'Aceptado': 'bg-emerald-100 text-emerald-700',
    'Rechazado': 'bg-rose-100 text-rose-700'
  };

  const presupuestoDisplay = proyecto.presupuesto_asignado ? (
    <>
      Asignado: ${proyecto.presupuesto_asignado.toLocaleString()}
      <br />
      <span className="text-[8px] text-slate-400 line-through">Sol: ${proyecto.presupuesto?.toLocaleString() || 0}</span>
    </>
  ) : (
    `$${proyecto.presupuesto?.toLocaleString() || 0}`
  );

  return (
    <div className="bg-white rounded-xl border border-gray-100 shadow-sm hover:shadow-md transition-all overflow-hidden">
      <div className="p-3 flex flex-col lg:flex-row gap-3 lg:items-start">
        <div className="h-20 lg:w-28 rounded-lg overflow-hidden bg-slate-100 flex items-center justify-center shrink-0 border relative cursor-pointer" onClick={()=>firstPhotoUrl && window.open(firstPhotoUrl,'_blank')}>
          {firstPhotoUrl ? (
            <img 
              src={firstPhotoUrl} 
              className="w-full h-full object-cover"
              alt={proyecto.nombre}
              onError={(e) => {
                console.error("Error cargando imagen:", firstPhotoUrl);
                (e.target as HTMLImageElement).style.display = 'none';
                const parent = (e.target as HTMLImageElement).parentElement;
                if (parent) {
                  const fallback = document.createElement('div');
                  fallback.className = "w-full h-full flex items-center justify-center";
                  fallback.innerHTML = '<svg class="h-5 w-5 text-slate-300" ...></svg>';
                }
              }}
            />
          ) : (
            <Construction className="h-5 w-5 text-slate-300"/>
          )}
        </div>
        <div className="flex-1 space-y-1.5">
          <div className="flex justify-between"><span className="text-[8px] font-black text-brand-primary uppercase">{proyecto.codigo || `ID: ${proyecto.id_proyecto_comuna}`}</span><div><span className="text-[7px] font-black px-1.5 py-0.5 rounded-full bg-green-100 text-green-600">{proyecto.categoria_7t}</span><span className={cn("ml-1 text-[7px] font-black px-1.5 py-0.5 rounded-full", statusColors[proyecto.estado])}>{proyecto.estado}</span></div></div>
          <h4 className="text-sm font-black text-slate-800 italic">{proyecto.nombre}</h4>
          <div className="grid grid-cols-3 gap-2 pt-1">
            {['desc_antes','desc_durante','desc_despues'].map((key,i)=>(
              <div key={i} className="bg-gray-50/50 p-1.5 rounded-lg"><p className={cn("text-[7px] font-black uppercase", i===0?'text-amber-600':i===1?'text-brand-primary':'text-emerald-600')}>{i===0?'Antes':i===1?'Durante':'Después'}</p><p className="text-[8px] text-slate-500 line-clamp-2 italic">{(proyecto as any)[key] || "Sin registro"}</p></div>
            ))}
          </div>
        </div>
        <div className="lg:w-32 flex lg:flex-col justify-between items-end gap-2 self-stretch">
          <div className="text-right">
            <p className="text-[8px] font-bold text-slate-400 uppercase">Presupuesto</p>
            <p className="text-[10px] font-black">{presupuestoDisplay}</p>
            <p className="text-[8px] font-bold text-slate-400 mt-1">Fecha</p>
            <p className="text-[8px] font-black">{new Date(proyecto.created_at).toLocaleDateString()}</p>
          </div>
          <div className="flex gap-1">
            <button onClick={onViewResponse} className="p-1.5 text-slate-400 hover:text-brand-primary"><MessageSquare className="h-3.5 w-3.5"/></button>
            {(proyecto.estado === 'Propuesto' || proyecto.estado === 'En revisión') && (
              <button onClick={onEdit} className="p-1.5 text-slate-400 hover:text-brand-primary"><Edit className="h-3.5 w-3.5"/></button>
            )}
            <button onClick={onDelete} className="p-1.5 text-slate-400 hover:text-rose-500"><Trash2 className="h-3.5 w-3.5"/></button>
          </div>
        </div>
      </div>
    </div>
  );
};

// Tarjeta horizontal para proyectos de consejo
const ProyectoCardConsejoHorizontal = ({ proyecto }: any) => {
  const statusColors: Record<string, string> = {
    'Propuesto': 'bg-slate-100 text-slate-600',
    'En revisión': 'bg-amber-100 text-amber-700',
    'En Ejecución': 'bg-brand-primary/10 text-brand-primary',
    'Culminado': 'bg-emerald-50 text-emerald-600',
    'Aceptado': 'bg-emerald-100 text-emerald-700',
    'Rechazado': 'bg-rose-100 text-rose-700'
  };

  const presupuestoDisplay = proyecto.presupuesto_asignado ? (
    <>
      Asignado: ${proyecto.presupuesto_asignado.toLocaleString()}
      <br />
      <span className="text-[8px] text-slate-400 line-through">Sol: ${proyecto.presupuesto?.toLocaleString() || 0}</span>
    </>
  ) : (
    `$${proyecto.presupuesto?.toLocaleString() || 0}`
  );

  return (
    <div className="bg-white rounded-xl border border-gray-100 shadow-sm hover:shadow-md transition-all overflow-hidden">
      <div className="p-3 flex flex-col lg:flex-row gap-3 lg:items-start">
        <div className="h-20 lg:w-28 rounded-lg bg-slate-100 flex items-center justify-center shrink-0"><Construction className="h-5 w-5 text-slate-300"/></div>
        <div className="flex-1 space-y-1.5">
          <div className="flex justify-between"><span className="text-[8px] font-black text-brand-primary uppercase">{proyecto.codigo || `ID: ${proyecto.id_proyecto}`}</span><div><span className="text-[7px] font-black px-1.5 py-0.5 rounded-full bg-green-100 text-green-600">{proyecto.categoria_7t}</span><span className={cn("ml-1 text-[7px] font-black px-1.5 py-0.5 rounded-full", statusColors[proyecto.estado])}>{proyecto.estado}</span></div></div>
          <h4 className="text-sm font-black text-slate-800 italic">{proyecto.nombre}</h4>
          <div className="grid grid-cols-3 gap-2 pt-1">
            {['desc_antes','desc_durante','desc_despues'].map((key,i)=>(
              <div key={i} className="bg-gray-50/50 p-1.5 rounded-lg"><p className={cn("text-[7px] font-black uppercase", i===0?'text-amber-600':i===1?'text-brand-primary':'text-emerald-600')}>{i===0?'Antes':i===1?'Durante':'Después'}</p><p className="text-[8px] text-slate-500 line-clamp-2 italic">{(proyecto as any)[key] || "Sin registro"}</p></div>
            ))}
          </div>
        </div>
        <div className="lg:w-32 flex lg:flex-col justify-between items-end gap-2 self-stretch">
          <div className="text-right">
            <p className="text-[8px] font-bold text-slate-400 uppercase">Presupuesto</p>
            <p className="text-[10px] font-black">{presupuestoDisplay}</p>
            <p className="text-[8px] font-bold text-slate-400 mt-1">Consejo</p>
            <p className="text-[8px] font-black truncate max-w-32">{proyecto.consejo_nombre}</p>
          </div>
        </div>
      </div>
    </div>
  );
};

// Formulario de edición de proyecto comuna
const EditProjectFormComuna = ({ proyecto, onUpdate, onCancel }: any) => {
  const getCurrentStep = () => {
    if (proyecto.desc_despues?.length >= 100) return 2;
    if (proyecto.desc_durante?.length >= 100) return 1;
    return 0;
  };
  const [currentStep, setCurrentStep] = useState(getCurrentStep());
  const [descActual, setDescActual] = useState(currentStep===0?proyecto.desc_antes||"": currentStep===1?proyecto.desc_durante||"": proyecto.desc_despues||"");
  const [fechaActual, setFechaActual] = useState(currentStep===0?proyecto.fecha_antes||"": currentStep===1?proyecto.fecha_durante||"": proyecto.fecha_despues||"");
  const etapas = [{step:0,label:"ANTES",color:"text-amber-600"},{step:1,label:"DURANTE",color:"text-brand-primary"},{step:2,label:"DESPUÉS",color:"text-emerald-600"}];
  const handleSave = async () => {
    if (descActual.length < 100) {
      alert('Mínimo 100 caracteres');
      return;
    }
    const key = ['antes','durante','despues'][currentStep];
    const datos = { [`desc_${key}`]: descActual, [`fecha_${key}`]: fechaActual||null };
    let nuevoEstado = proyecto.estado, progreso = proyecto.progreso;
    if (currentStep===0) { nuevoEstado='En Ejecución'; progreso=33; }
    else if (currentStep===1) { nuevoEstado='Culminado'; progreso=66; }
    else { nuevoEstado='Culminado'; progreso=100; }
    onUpdate(proyecto, nuevoEstado, progreso, datos);
  };
  return (
    <div className="space-y-4">
      <div className="flex justify-center gap-2 mb-2">{etapas.map((e,i)=> <div key={i} className={cn("px-2 py-1 rounded-full text-[9px] font-black", currentStep===i ? "bg-brand-primary text-white" : "bg-gray-100")}>{e.label}</div>)}</div>
      <div><label className="text-[8px] font-black">Fecha</label><input type="date" className="w-full p-2 rounded-lg bg-gray-50 text-sm" value={fechaActual} onChange={e=>setFechaActual(e.target.value)} /></div>
      <div><label className="text-[9px] font-black">Descripción (mín. 100)</label><textarea className="w-full p-3 rounded-lg bg-gray-50 text-xs resize-none h-28" value={descActual} onChange={e=>setDescActual(e.target.value)} /></div>
      <div className="flex gap-3"><button onClick={onCancel} className="flex-1 py-2 rounded-lg border text-[10px] font-black">Cancelar</button><button onClick={handleSave} disabled={descActual.length<100} className="flex-1 py-2 rounded-lg bg-brand-primary text-white text-[10px] font-black">Guardar</button></div>
    </div>
  );
};

// ========== MODALES MEJORADOS (sin cambios) ==========

const ViewResponseModalComuna = ({ isOpen, onClose, proyecto }: any) => {
  if (!isOpen) return null;
  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose} className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" />
          <motion.div initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 20 }} className="relative w-full max-w-lg bg-white rounded-[2.5rem] shadow-2xl overflow-hidden">
            <div className="p-8 border-b border-gray-50 flex items-center justify-between bg-gray-50/50">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-xl bg-brand-primary/10 flex items-center justify-center">
                  <MessageSquare className="h-5 w-5 text-brand-primary" />
                </div>
                <div>
                  <h4 className="text-lg font-black text-slate-800 italic uppercase">Respuesta del Proyecto</h4>
                  <p className="text-[10px] text-slate-400 font-bold uppercase">Seguimiento Institucional</p>
                </div>
              </div>
              <button onClick={onClose} className="p-2 rounded-xl hover:bg-white hover:shadow-sm text-slate-400 transition-all">
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="p-8 space-y-6">
              <div>
                <label className="text-[10px] font-bold text-slate-400 uppercase mb-2 block">Proyecto</label>
                <p className="text-sm font-black text-slate-800 uppercase italic">{proyecto?.nombre || "Proyecto"}</p>
              </div>
              <div className="bg-brand-primary/5 rounded-3xl p-6 border border-brand-primary/10">
                <label className="text-[10px] font-bold text-brand-primary uppercase mb-3 block">Comentario / Respuesta</label>
                <p className="text-sm text-slate-700 leading-relaxed">{proyecto?.respuesta || "No hay respuesta registrada."}</p>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 bg-gray-50 rounded-2xl">
                  <Calendar className="h-3 w-3 text-slate-400 mb-1" />
                  <p className="text-[9px] font-bold text-slate-400 uppercase">Fecha Respuesta</p>
                  <p className="text-xs font-black text-slate-800">{proyecto?.fecha_respuesta || "Pendiente"}</p>
                </div>
                <div className="p-4 bg-gray-50 rounded-2xl">
                  <UserCheck className="h-3 w-3 text-slate-400 mb-1" />
                  <p className="text-[9px] font-bold text-slate-400 uppercase">Estado Actual</p>
                  <p className="text-xs font-black text-slate-800 uppercase italic">{proyecto?.estado || "Propuesto"}</p>
                </div>
              </div>
            </div>
            <div className="p-6 bg-gray-50/50 border-t border-gray-50 flex justify-end">
              <button onClick={onClose} className="px-8 py-3 rounded-xl bg-brand-primary text-white text-[10px] font-black uppercase shadow-lg hover:scale-[1.02] transition-all">
                Cerrar
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

const FinalRendicionConfirmationComuna = ({ isOpen, proyecto, onConfirm, onCancel }: any) => {
  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[101] flex items-center justify-center p-4">
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onCancel} className="absolute inset-0 bg-slate-900/70 backdrop-blur-sm" />
          <motion.div initial={{ opacity: 0, scale: 0.9, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.9, y: 20 }} className="relative w-full max-w-md bg-white rounded-[2.5rem] shadow-2xl overflow-hidden">
            <div className="p-8 text-center bg-gradient-to-r from-emerald-50 to-blue-50">
              <div className="w-20 h-20 mx-auto mb-6 rounded-[2.5rem] bg-emerald-100 border-4 border-emerald-200 flex items-center justify-center">
                <CheckCircle2 className="h-10 w-10 text-emerald-600" />
              </div>
              <h3 className="text-xl font-black text-slate-800 italic uppercase tracking-tighter mb-4">Prórroga Aceptada ✅</h3>
              <div className="bg-white/50 p-4 rounded-2xl border border-emerald-100 mb-6">
                <p className="text-sm font-bold text-slate-700 mb-2">{proyecto.codigo ? `${proyecto.codigo} - ` : ''}{proyecto.nombre}</p>
                <p className="text-[10px] text-emerald-700 font-bold uppercase tracking-wider">OBLIGATORIO: Rendición Final</p>
              </div>
              <p className="text-sm text-slate-600 leading-relaxed mb-8 max-w-sm mx-auto">
                Para <strong>finalizar el proyecto</strong> con prórroga aprobada, debe completar la{' '}
                <span className="font-black text-emerald-600">Rendición Final de Cuentas</span>.
              </p>
            </div>
            <div className="p-6 bg-slate-50 border-t border-gray-100 space-y-3">
              <button onClick={onConfirm} className="w-full py-4 px-6 bg-gradient-to-r from-emerald-500 to-emerald-600 text-white text-[11px] font-black uppercase tracking-widest rounded-2xl shadow-xl shadow-emerald-500/25 hover:scale-[1.02] active:scale-98 transition-all">
                Completar Rendición Final
              </button>
              <button onClick={onCancel} className="w-full py-3 px-6 border-2 border-slate-200 text-slate-600 text-[11px] font-black uppercase tracking-widest rounded-xl hover:bg-slate-50 transition-all">
                Cancelar
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

const RendicionDetailModalComuna = ({ isOpen, onClose, rendicion, proyecto }: any) => {
  const [vocerosData, setVocerosData] = useState<{ nombre_completo: string; cedula: string }[]>([]);
  const [signedPhotoUrls, setSignedPhotoUrls] = useState<string[]>([]);
  const [loadingVoceros, setLoadingVoceros] = useState(false);
  const [loadingImages, setLoadingImages] = useState(true);

  useEffect(() => {
    const fetchVoceros = async () => {
      if (!rendicion?.id_voceros_firmantes?.length) { setVocerosData([]); setLoadingVoceros(false); return; }
      setLoadingVoceros(true);
      try {
        const { data, error } = await supabase.from('voceros_comuna').select('nombre_completo, cedula').in('id_voceroc', rendicion.id_voceros_firmantes);
        if (error) throw error;
        setVocerosData(data || []);
      } catch { setVocerosData([]); } finally { setLoadingVoceros(false); }
    };
    if (isOpen && rendicion) fetchVoceros();
  }, [rendicion, isOpen]);

  useEffect(() => {
    const generateSignedUrls = async () => {
      if (!rendicion?.fotos_evidencia_urls?.length) { setSignedPhotoUrls([]); setLoadingImages(false); return; }
      setLoadingImages(true);
      const bucketName = 'rendiciones_comuna';
      const urls: string[] = [];
      for (const publicUrl of rendicion.fotos_evidencia_urls) {
        const signedUrl = await getSignedImageUrl(bucketName, publicUrl);
        if (signedUrl) urls.push(signedUrl);
        else urls.push(publicUrl);
      }
      setSignedPhotoUrls(urls);
      setLoadingImages(false);
    };
    if (isOpen && rendicion) generateSignedUrls();
  }, [rendicion, isOpen]);

  if (!isOpen || !rendicion || !proyecto) return null;

  const saldo = rendicion.ingresos - rendicion.egresos;
  let facturasUrls: string[] = [];
  if (rendicion.facturas_legales_url) {
    try { const parsed = JSON.parse(rendicion.facturas_legales_url); facturasUrls = Array.isArray(parsed) ? parsed : [rendicion.facturas_legales_url]; } catch { facturasUrls = [rendicion.facturas_legales_url]; }
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose} className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" />
          <motion.div initial={{ opacity: 0, scale: 0.98, y: 10 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.98, y: 10 }} className="relative w-full max-w-2xl bg-white rounded-xl shadow-xl overflow-hidden flex flex-col max-h-[80vh]">
            <div className="px-4 py-3.5 border-b border-slate-100 bg-white sticky top-0 z-10">
              <div className="flex items-center justify-between">
                <div><div className="flex items-center gap-2"><span className="text-[9px] font-bold tracking-wider text-brand-primary uppercase bg-brand-primary/10 px-1.5 py-0.5 rounded">{rendicion.proyecto_codigo || proyecto.codigo || "PROYECTO"}</span><h4 className="text-base font-bold text-slate-800">Detalle de Rendición</h4></div><p className="text-xs text-slate-400 mt-0.5 truncate max-w-md font-medium">{proyecto.nombre}</p></div>
                <button onClick={onClose} className="p-1 rounded-lg text-slate-400 hover:bg-slate-50"><X className="h-4 w-4" /></button>
              </div>
            </div>
            <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-slate-50 p-2.5 rounded-lg border"><p className="text-[9px] font-bold text-slate-400 uppercase">Categoría</p><p className="text-xs font-semibold text-slate-700">{rendicion.categoria_seleccionada?.toUpperCase() || '—'}</p></div>
                <div className="bg-slate-50 p-2.5 rounded-lg border"><p className="text-[9px] font-bold text-slate-400 uppercase">Lapso contable</p><p className="text-xs font-semibold text-slate-700">{new Date(rendicion.fecha_inicio).toLocaleDateString()} — {new Date(rendicion.fecha_fin).toLocaleDateString()}</p></div>
              </div>
              <div className="grid grid-cols-3 gap-2.5">
                <div className="bg-emerald-50/40 border p-2.5 rounded-lg"><p className="text-[9px] font-bold text-emerald-600 uppercase">Ingresos</p><p className="text-sm font-bold text-emerald-700">${rendicion.ingresos?.toLocaleString()}</p></div>
                <div className="bg-rose-50/40 border p-2.5 rounded-lg"><p className="text-[9px] font-bold text-rose-600 uppercase">Egresos</p><p className="text-sm font-bold text-rose-700">${rendicion.egresos?.toLocaleString()}</p></div>
                <div className="bg-slate-100/50 border p-2.5 rounded-lg"><p className="text-[9px] font-bold text-slate-500 uppercase">Saldo</p><p className={`text-sm font-bold ${saldo>=0?'text-emerald-600':'text-rose-600'}`}>${saldo.toLocaleString()}</p></div>
              </div>
              <div><h5 className="text-[10px] font-bold text-slate-400 uppercase mb-1.5">Voceros firmantes</h5>{loadingVoceros ? <Loader2 className="h-3 w-3 animate-spin"/> : vocerosData.length>0 ? vocerosData.map((v,i)=><div key={i} className="flex justify-between bg-slate-50 px-3 py-1.5 rounded-lg"><span>{v.nombre_completo}</span><span className="text-[9px] font-mono">C.I: {v.cedula}</span></div>) : <p className="text-xs italic">No hay voceros</p>}</div>
              {rendicion.informe_gestion && <div><h5 className="text-[10px] font-bold uppercase mb-1.5">Informe de gestión</h5><div className="bg-slate-50 p-2.5 rounded-lg text-xs max-h-20 overflow-auto">{rendicion.informe_gestion}</div></div>}
              <div className="grid sm:grid-cols-2 gap-4 pt-2 border-t">
                <div><h5 className="text-[10px] font-bold uppercase mb-1.5">Documentación</h5><div className="flex flex-wrap gap-2">{rendicion.acta_asamblea_url && <a href={rendicion.acta_asamblea_url} target="_blank" className="flex items-center gap-1 text-[11px] bg-white border p-1 px-2 rounded-md"><FileText className="h-3 w-3"/> Acta</a>}{facturasUrls.length>0 && <a href={facturasUrls[0]} target="_blank" className="flex items-center gap-1 text-[11px] bg-white border p-1 px-2 rounded-md"><Receipt className="h-3 w-3"/> Facturas ({facturasUrls.length})</a>}{rendicion.informe_contraloria_url && <a href={rendicion.informe_contraloria_url} target="_blank" className="flex items-center gap-1"><ShieldCheck className="h-3 w-3"/> Contraloría</a>}{rendicion.estado_cuenta_url && <a href={rendicion.estado_cuenta_url} target="_blank" className="flex items-center gap-1"><Layers className="h-3 w-3"/> Estado Cta.</a>}</div></div>
                {rendicion.fotos_evidencia_urls?.length>0 && <div><h5 className="text-[10px] font-bold uppercase mb-1.5">Evidencias ({rendicion.fotos_evidencia_urls.length})</h5>{loadingImages ? <Loader2 className="h-3 w-3 animate-spin"/> : <div className="flex flex-wrap gap-2">{signedPhotoUrls.slice(0,4).map((url,i)=>(
                  <a key={i} href={url} target="_blank" className="w-16 h-16 rounded-lg overflow-hidden border">
                    <img src={url} className="w-full h-full object-cover" alt={`Evidencia ${i+1}`} />
                  </a>
                ))}{signedPhotoUrls.length>4 && <div className="w-16 h-16 bg-slate-100 flex items-center justify-center text-xs font-bold">+{signedPhotoUrls.length-4}</div>}</div>}</div>}
              </div>
            </div>
            <div className="px-4 py-3 bg-slate-50 border-t flex justify-end"><button onClick={onClose} className="px-4 py-1.5 rounded-lg bg-white border hover:bg-slate-100">Cerrar</button></div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

const ProrrogaDetailModalComuna = ({ isOpen, onClose, prorroga, proyecto }: any) => {
  const [vocerosData, setVocerosData] = useState<{ nombre_completo: string; cedula: string }[]>([]);
  const [loadingVoceros, setLoadingVoceros] = useState(false);

  useEffect(() => {
    const fetchVoceros = async () => {
      if (!prorroga?.id_voceros_firmantes?.length) return;
      setLoadingVoceros(true);
      try {
        const { data, error } = await supabase.from('voceros_comuna').select('nombre_completo, cedula').in('id_voceroc', prorroga.id_voceros_firmantes);
        if (error) throw error;
        setVocerosData(data || []);
      } catch { } finally { setLoadingVoceros(false); }
    };
    if (isOpen && prorroga) fetchVoceros();
  }, [prorroga, isOpen]);

  if (!isOpen || !prorroga || !proyecto) return null;
  const estadoColors: Record<string, string> = { pendiente: 'bg-amber-100 text-amber-700', aprobado: 'bg-emerald-100 text-emerald-700', rechazado: 'bg-rose-100 text-rose-700' };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose} className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" />
          <motion.div initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.98 }} className="relative w-full max-w-lg bg-white rounded-xl shadow-xl flex flex-col max-h-[80vh]">
            <div className="px-4 py-3.5 border-b flex justify-between items-center"><div className="flex items-center gap-2"><Calendar className="h-4 w-4 text-orange-500"/><h4 className="text-base font-bold">Detalle de Prórroga</h4></div><button onClick={onClose}><X className="h-4 w-4"/></button></div>
            <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4">
              <div><p className="text-[9px] font-bold uppercase">Proyecto</p><p className="text-sm font-bold">{proyecto.nombre}</p><p className="text-[10px] text-slate-500">{proyecto.codigo}</p></div>
              <div className="flex justify-between"><p className="text-[9px] font-bold uppercase">Estado</p><span className={cn("px-2 py-0.5 rounded-full text-[9px] font-bold", estadoColors[prorroga.estado]||"bg-gray-100")}>{prorroga.estado||"pendiente"}</span></div>
              <div><p className="text-[9px] font-bold uppercase">Motivo</p><p className="text-sm bg-slate-50 p-2.5 rounded-lg">{prorroga.motivo}</p></div>
              <div className="grid grid-cols-2 gap-3"><div><p className="text-[9px] font-bold uppercase">Presupuesto estimado</p><p className="text-sm font-black text-emerald-700">${prorroga.presupuesto_estimado?.toLocaleString()}</p></div><div><p className="text-[9px] font-bold uppercase">Tiempo estimado</p><p className="text-sm font-black text-orange-700">{prorroga.tiempo_estimado}</p></div></div>
              <div><p className="text-[9px] font-bold uppercase mb-1.5">Voceros firmantes</p>{loadingVoceros ? <Loader2 className="h-3 w-3 animate-spin"/> : vocerosData.length>0 ? vocerosData.map((v,i)=><div key={i} className="flex justify-between bg-slate-50 px-3 py-1.5 rounded-lg"><span className="text-xs font-medium">{v.nombre_completo}</span><span className="text-[9px] font-mono">C.I: {v.cedula}</span></div>) : <p className="text-xs italic">No hay voceros</p>}</div>
              {(prorroga.acta_url || prorroga.evidencia_url) && <div><p className="text-[9px] font-bold uppercase mb-1.5">Documentos</p><div className="flex gap-2">{prorroga.acta_url && <a href={prorroga.acta_url} target="_blank" className="flex items-center gap-1 text-[11px] bg-white border p-1 px-2 rounded-md"><FileText className="h-3 w-3"/> Acta</a>}{prorroga.evidencia_url && <a href={prorroga.evidencia_url} target="_blank" className="flex items-center gap-1 text-[11px] bg-white border p-1 px-2 rounded-md"><Camera className="h-3 w-3"/> Evidencia</a>}</div></div>}
            </div>
            <div className="px-4 py-3 bg-slate-50 border-t flex justify-end"><button onClick={onClose} className="px-4 py-1.5 rounded-lg bg-white border hover:bg-slate-100">Cerrar</button></div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

const PaginationComponent = ({ currentPage, totalPages, onPageChange, totalItems }: any) => {
  if (totalPages <= 1) return null;
  return <div className="flex justify-center items-center gap-2 mt-6"><button disabled={currentPage===1} onClick={()=>onPageChange(currentPage-1)} className="px-3 py-1 rounded border disabled:opacity-50">Anterior</button><span className="text-sm">{currentPage} de {totalPages}</span><button disabled={currentPage===totalPages} onClick={()=>onPageChange(currentPage+1)} className="px-3 py-1 rounded border disabled:opacity-50">Siguiente</button></div>;
};