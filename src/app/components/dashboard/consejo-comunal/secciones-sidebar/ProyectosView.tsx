"use client";
import React, { useState, useEffect, useRef, useMemo } from "react";
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Plus, X, Construction, Camera, CheckCircle2,
  Loader2, Eye, FileText, ArrowLeft, Trash2, MessageSquare, Edit,
  FileBarChart2, UserCheck, Calendar, ChevronDown, FileCheck, AlertCircle, RefreshCw
} from "lucide-react";
import { supabase } from "@/app/lib/supabaseClient";
import type { User } from "@supabase/supabase-js";
import { useAuth } from "@/context/AuthContext";
import { cn } from "@/app/lib/utils";
import { AlertModal } from "@/app/components/AlertModal";
import { 
  RendicionModal,  
  ViewResponseModal, 
  PaginationComponent,
  RendicionDetailModal
} from "./RendicionModal";
import { ProrrogaModal } from "./ProrrogaModal";

type Proyecto = {
  id_proyecto: number;
  codigo: string | null;
  nombre: string;
  categoria_7t: string;
  presupuesto: number | null;
  presupuesto_asignado: number | null;
  estado: string;
  respuesta: string | null;
  motivo_rechazo: string | null;
  created_at: string;
  acta_url?: string | null;
  fotos_antes_urls?: string[] | null;
  desc_antes?: string | null;
  desc_durante?: string | null;
  desc_despues?: string | null;
  fecha_antes?: string | null;
  fecha_durante?: string | null;
  fecha_despues?: string | null;
  [key: string]: any;
};

type RegistroUnificado = {
  id: number;
  tipo: 'rendicion' | 'prorroga';
  proyecto: Proyecto;
  categoriaSeleccionada?: string;
  fechaInicio?: string;
  fechaFin?: string;
  tiempoEstimado?: string;
  estado?: string;
  datos: any;
};

export const ProyectosView = () => {
  const { user } = useAuth() as { user: User | null };
  const [consejoId, setConsejoId] = useState<number | null>(null);
  const [noConsejo, setNoConsejo] = useState(false);
  const [proyectos, setProyectos] = useState<Proyecto[]>([]);
  const [rendiciones, setRendiciones] = useState<any[]>([]);
  const [solicitudesProrroga, setSolicitudesProrroga] = useState<any[]>([]);
  const [registrosUnificados, setRegistrosUnificados] = useState<RegistroUnificado[]>([]);
  const [nudos, setNudos] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isNewOpen, setIsNewOpen] = useState(false);
  const [editingProject, setEditingProject] = useState<Proyecto | null>(null);
  const [step, setStep] = useState(1);
  const [saving, setSaving] = useState(false);
  const [nudosFiltrados, setNudosFiltrados] = useState<any[]>([]);
  const [isRendicionOpen, setIsRendicionOpen] = useState(false);
  const [currentProyecto, setCurrentProyecto] = useState<Proyecto | null>(null);
  const [viewResponseOpen, setViewResponseOpen] = useState(false);
  const [activeSection, setActiveSection] = useState<'proyectos' | 'rendicion'>('proyectos');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(5);
  const [selectedCategoria, setSelectedCategoria] = useState<string>('Todas');
  const [selectedRendicionProyecto, setSelectedRendicionProyecto] = useState<{ id_proyecto: number; nombre: string; codigo?: string } | null>(null);
  const [isProrrogaOpen, setIsProrrogaOpen] = useState(false);
  const [currentProrrogaProyecto, setCurrentProrrogaProyecto] = useState<Proyecto | null>(null);
  const [showFinalRendicion, setShowFinalRendicion] = useState(false);
  const [finalRendicionProyecto, setFinalRendicionProyecto] = useState<{ id_proyecto: number; nombre: string; codigo?: string } | null>(null);
  const [requerimientos, setRequerimientos] = useState('');
  const [duracion, setDuracion] = useState('');
  const [detailModalOpen, setDetailModalOpen] = useState(false);
  const [selectedRendicionForDetail, setSelectedRendicionForDetail] = useState<{ rendicion: any | null; proyecto: Proyecto | null }>({ rendicion: null, proyecto: null });
  const [editingRegistro, setEditingRegistro] = useState<RegistroUnificado | null>(null);
  const [isEditRendicionOpen, setIsEditRendicionOpen] = useState(false);
  const [isEditProrrogaOpen, setIsEditProrrogaOpen] = useState(false);
  const [showRegistroDropdown, setShowRegistroDropdown] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Alert modal
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

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowRegistroDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    if (isNewOpen || editingProject || isRendicionOpen || viewResponseOpen || isProrrogaOpen || showFinalRendicion || detailModalOpen || modalState.isOpen || isEditRendicionOpen || isEditProrrogaOpen) {
      document.body.classList.add('modal-open');
    } else {
      document.body.classList.remove('modal-open');
    }
    return () => document.body.classList.remove('modal-open');
  }, [isNewOpen, editingProject, isRendicionOpen, viewResponseOpen, isProrrogaOpen, showFinalRendicion, detailModalOpen, modalState.isOpen, isEditRendicionOpen, isEditProrrogaOpen]);

  const [formData, setFormData] = useState({
    nombre: '',
    id_nudo: '',
    categoria_7t: 'T2',
    beneficiarios_familias: '',
    diagnostico: '',
    presupuesto: '',
    ente_financiamiento: '',
    tecnico_nombre: '',   
    tecnico_apellido: '',   
    tecnico_cedula: '',     
    duracion: '',
  });

  const [selectedNudo, setSelectedNudo] = useState<any>(null);
  const [actaFile, setActaFile] = useState<File | null>(null);
  const [fotosFiles, setFotosFiles] = useState<File[]>([]);
  const actaInputRef = useRef<HTMLInputElement>(null);
  const fotosInputRef = useRef<HTMLInputElement>(null);

  const openDetailModal = (rendicion: any, proyecto: Proyecto) => {
    setSelectedRendicionForDetail({ rendicion, proyecto });
    setDetailModalOpen(true);
  };

  // Carga de proyectos (se usará también para refrescar)
  const fetchProyectos = async () => {
    if (!consejoId) return;
    setLoading(true);
    const { data, error } = await supabase
      .from('proyectos')
      .select('*')
      .eq('id_consejo', consejoId)
      .order('created_at', { ascending: false });
    if (error) {
      console.error('Error cargando proyectos:', error);
    } else {
      setProyectos(data || []);
      setSelectedCategoria('Todas');
      setCurrentPage(1);
    }
    setLoading(false);
  };

  const fetchRendiciones = async () => {
    if (!consejoId) return;
    const { data, error } = await supabase
      .from('rendiciones')
      .select(`
        *,
        proyecto:proyectos!fk_rendiciones_proyecto (
          id_proyecto,
          nombre,
          codigo,
          categoria_7t
        )
      `)
      .eq('id_consejo', consejoId)
      .order('created_at', { ascending: false });
    if (error) {
      console.error('Error cargando rendiciones:', error);
      return;
    }
    if (data) {
      const mapped = data.map((r: any) => ({
        ...r,
        proyecto_nombre: r.proyecto?.nombre || 'Desconocido',
        proyecto_codigo: r.proyecto?.codigo || '',
        proyecto_categoria: r.proyecto?.categoria_7t || ''
      }));
      setRendiciones(mapped);
    } else {
      setRendiciones([]);
    }
  };

  const fetchSolicitudesProrroga = async () => {
    if (!consejoId) return;
    const { data, error } = await supabase
      .from('solicitudes_prorroga')
      .select(`
        *,
        proyecto:proyectos!solicitudes_prorroga_id_proyecto_fkey (
          id_proyecto,
          nombre,
          codigo,
          categoria_7t,
          ente_financiamiento
        )
      `)
      .eq('id_consejo', consejoId)
      .order('created_at', { ascending: false });
    if (error) {
      console.error('Error cargando solicitudes de prórroga:', error);
      return;
    }
    setSolicitudesProrroga(data || []);
  };

  // Función para refrescar todos los datos (proyectos, rendiciones, prórrogas)
  const refreshAllData = async () => {
    if (!consejoId) return;
    await Promise.all([fetchProyectos(), fetchRendiciones(), fetchSolicitudesProrroga()]);
  };

  const unificarRegistros = () => {
    const rendicionesUnificadas: RegistroUnificado[] = rendiciones.map(rend => ({
      id: rend.id_rendicion,
      tipo: 'rendicion',
      proyecto: rend.proyecto,
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
    const fetchData = async () => {
      if (!user?.id) return;
      const { data: consejoData, error } = await supabase
        .from('datos_consejo_comunal')
        .select('id_consejo')
        .or(`id_usuario.eq.${user.id},id_usuario_auxiliar.eq.${user.id}`)
        .maybeSingle();
      if (!consejoData) {
        setNoConsejo(true);
        setLoading(false);
      } else if (error) {
        console.error('Error obteniendo consejo:', error);
        setLoading(false);
      } else {
        setConsejoId(consejoData.id_consejo);
        const { data: nudosData, error: nudosError } = await supabase
          .from('nudos_criticos')
          .select('id_nudo, titulo, categoria_7t, personas_afectadas, descripcion')
          .eq('id_consejo', consejoData.id_consejo)
          .is('id_proyecto', null);
        setNoConsejo(false);
        if (nudosError) console.error('Error cargando nudos:', nudosError);
        else setNudos(nudosData || []);
      }
    };
    fetchData();
  }, [user]);

  useEffect(() => {
    if (consejoId) {
      refreshAllData();
    }
  }, [consejoId]);

  // Refrescar automáticamente al cambiar a la pestaña "proyectos"
  useEffect(() => {
    if (activeSection === 'proyectos' && consejoId) {
      refreshAllData();
    }
  }, [activeSection, consejoId]);

  useEffect(() => {
    unificarRegistros();
  }, [rendiciones, solicitudesProrroga]);

  useEffect(() => {
    if (formData.categoria_7t && nudos.length > 0) {
      const filtrados = nudos.filter(n => n.categoria_7t === formData.categoria_7t);
      setNudosFiltrados(filtrados);
    } else {
      setNudosFiltrados(nudos);
    }
  }, [formData.categoria_7t, nudos]);

  useEffect(() => {
    if (formData.id_nudo && nudos.length > 0) {
      const nudoSeleccionado = nudos.find(n => n.id_nudo.toString() === formData.id_nudo);
      if (nudoSeleccionado) {
        setSelectedNudo(nudoSeleccionado);
        setFormData(prev => ({
          ...prev,
          categoria_7t: nudoSeleccionado.categoria_7t,
          beneficiarios_familias: nudoSeleccionado.personas_afectadas?.toString() || '',
          diagnostico: nudoSeleccionado.descripcion || ''
        }));
      }
    } else {
      setSelectedNudo(null);
    }
  }, [formData.id_nudo, nudos]);

  const resetPagination = () => setCurrentPage(1);
  const proyectosFiltrados = selectedCategoria === 'Todas' 
    ? proyectos 
    : proyectos.filter(p => p.categoria_7t === selectedCategoria);
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentProyectos = proyectosFiltrados.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(proyectosFiltrados.length / itemsPerPage);

  const registrosFiltrados = selectedCategoria === 'Todas'
    ? registrosUnificados
    : registrosUnificados.filter(reg => reg.proyecto?.categoria_7t === selectedCategoria);
  
  const indexOfLastRegistro = currentPage * itemsPerPage;
  const indexOfFirstRegistro = indexOfLastRegistro - itemsPerPage;
  const currentRegistros = registrosFiltrados.slice(indexOfFirstRegistro, indexOfLastRegistro);
  const totalPagesRegistros = Math.ceil(registrosFiltrados.length / itemsPerPage);

  // ============================================================
  // PROYECTOS CULMINADOS (para rendición y prórroga)
  // ============================================================
  const proyectosCulminados = useMemo(() => {
    return proyectos.filter(p => p.estado === 'Culminado');
  }, [proyectos]);

  // ============================================================
  // MANEJADORES DE RENDICIÓN Y PRÓRROGA (con validación de estado)
  // ============================================================
  const handleRendicion = (proyecto: Proyecto) => {
    if (proyecto.estado !== 'Culminado') {
      showAlert('Proyecto no culminado', 'Solo se puede rendir un proyecto que esté en estado "Culminado".', 'warning');
      return;
    }
    setCurrentProyecto(proyecto);
    setSelectedRendicionProyecto({
      id_proyecto: proyecto.id_proyecto,
      nombre: proyecto.nombre,
      codigo: proyecto.codigo || undefined
    });
    setIsRendicionOpen(true);
  };

  const handleProrroga = (proyecto: Proyecto) => {
    if (proyecto.estado !== 'Culminado') {
      showAlert('Proyecto no culminado', 'Solo se puede solicitar prórroga de un proyecto que esté en estado "Culminado".', 'warning');
      return;
    }
    setCurrentProrrogaProyecto(proyecto);
    setIsProrrogaOpen(true);
  };

  const handleNuevoRegistro = (tipo: 'rendicion' | 'prorroga') => {
    setShowRegistroDropdown(false);
    if (tipo === 'rendicion') {
      if (proyectosCulminados.length === 0) {
        showAlert('Sin proyectos culminados', 'No hay proyectos en estado "Culminado" para rendir.', 'warning');
        return;
      }
      setSelectedRendicionProyecto(null);
      setIsRendicionOpen(true);
    } else {
      if (proyectosCulminados.length === 0) {
        showAlert('Sin proyectos culminados', 'No hay proyectos en estado "Culminado" para solicitar prórroga.', 'warning');
        return;
      }
      setCurrentProrrogaProyecto(null);
      setIsProrrogaOpen(true);
    }
  };

  // ============================================================
  // CRUD Y OTRAS FUNCIONES
  // ============================================================
  const uploadActa = async (file: File, proyectoId: number): Promise<string | null> => {
    if (!consejoId) return null;
    const fileExt = file.name.split('.').pop();
    const fileName = `acta_${Date.now()}.${fileExt}`;
    const filePath = `${consejoId}/proyectos/${proyectoId}/${fileName}`;
    const { error } = await supabase.storage.from('proyectos_docs').upload(filePath, file);
    if (error) return null;
    return filePath;
  };

  const uploadFotos = async (files: File[], proyectoId: number): Promise<string[]> => {
    if (!consejoId) return [];
    const uploadedPaths: string[] = [];
    for (const file of files) {
      const fileExt = file.name.split('.').pop();
      const fileName = `${Date.now()}_${Math.random().toString(36).substring(7)}.${fileExt}`;
      const filePath = `${consejoId}/proyectos/${proyectoId}/fotos/${fileName}`;
      const { error } = await supabase.storage.from('proyectos_docs').upload(filePath, file);
      if (error) continue;
      uploadedPaths.push(filePath);
    }
    return uploadedPaths;
  };

  const deleteProjectFiles = async (proyecto: Proyecto): Promise<void> => {
    if (!consejoId) return;
    const bucketName = 'proyectos_docs';
    const folderPath = `${consejoId}/proyectos/${proyecto.id_proyecto}/`;
    const { data: files, error: listError } = await supabase.storage.from(bucketName).list(folderPath, { limit: 100 });
    if (listError) return;
    if (files && files.length > 0) {
      const filePaths = files.map(file => `${folderPath}${file.name}`);
      await supabase.storage.from(bucketName).remove(filePaths);
    }
  };

  const getSignedUrl = async (relativePath: string, bucketName: string): Promise<string | null> => {
    const { data, error } = await supabase.storage.from(bucketName).createSignedUrl(relativePath, 3600);
    if (error) return null;
    return data.signedUrl;
  };

  const generarCodigoProyecto = async (categoria: string, consejoId: number): Promise<string> => {
    const año = new Date().getFullYear();
    const prefijo = `${categoria}-${año}-${consejoId}`;
    const { data, error } = await supabase
      .from('proyectos')
      .select('codigo')
      .ilike('codigo', `${prefijo}-%`)
      .order('id_proyecto', { ascending: false })
      .limit(1);
    let numero = 1;
    if (data && data.length > 0 && data[0].codigo) {
      const partes = data[0].codigo.split('-');
      const ultimoNumero = parseInt(partes[partes.length - 1]);
      if (!isNaN(ultimoNumero)) numero = ultimoNumero + 1;
    }
    return `${prefijo}-${numero}`;
  };

  const verificarNudoDisponible = async (idNudo: number): Promise<boolean> => {
    if (!idNudo) return true;
    const { data, error } = await supabase
      .from('nudos_criticos')
      .select('id_proyecto')
      .eq('id_nudo', idNudo)
      .single();
    if (error && error.code !== 'PGRST116') return false;
    return !data?.id_proyecto;
  };

  const handleCreateSubmit = async () => {
    if (!consejoId) {
      showAlert('Datos incompletos', 'Debe registrar primero los datos legales del consejo', 'warning');
      return;
    }
    if (formData.id_nudo) {
      const disponible = await verificarNudoDisponible(parseInt(formData.id_nudo));
      if (!disponible) {
        showAlert('Nudo ya vinculado', 'Este nudo crítico ya tiene un proyecto asignado.', 'warning');
        return;
      }
    }
    setSaving(true);
    try {
      const codigoProyecto = await generarCodigoProyecto(formData.categoria_7t, consejoId);
      const nuevoProyecto = {
        id_consejo: consejoId,
        codigo: codigoProyecto,
        nombre: formData.nombre,
        id_nudo: formData.id_nudo ? parseInt(formData.id_nudo) : null,
        categoria_7t: formData.categoria_7t,
        presupuesto: formData.presupuesto ? parseFloat(formData.presupuesto) : null,
        ente_financiamiento: formData.ente_financiamiento || null,
        tecnico_nombre: formData.tecnico_nombre || null,
        tecnico_apellido: formData.tecnico_apellido || null,
        tecnico_cedula: formData.tecnico_cedula || null,
        beneficiarios_familias: formData.beneficiarios_familias ? parseInt(formData.beneficiarios_familias) : null,
        diagnostico: formData.diagnostico || null,
        requerimientos: requerimientos || null,
        duracion: duracion || null,
        estado: formData.ente_financiamiento === 'Financiamiento externo' ? 'En Ejecución' : 'Propuesto',
        progreso: 0,
      };
      const { data: proyectoData, error: insertError } = await supabase
        .from('proyectos')
        .insert([nuevoProyecto])
        .select()
        .single();
      if (insertError) throw insertError;
      const proyectoId = proyectoData.id_proyecto;

      let actaPath = null;
      let fotosPaths: string[] = [];
      if (actaFile) actaPath = await uploadActa(actaFile, proyectoId);
      if (fotosFiles.length > 0) fotosPaths = await uploadFotos(fotosFiles, proyectoId);
      
      const updateData: any = {};
      if (actaPath) updateData.acta_url = actaPath;
      if (fotosPaths.length > 0) updateData.fotos_antes_urls = fotosPaths;
      if (Object.keys(updateData).length > 0) {
        await supabase.from('proyectos').update(updateData).eq('id_proyecto', proyectoId);
      }      
      if (formData.id_nudo) {
        await supabase.from('nudos_criticos').update({ id_proyecto: proyectoId }).eq('id_nudo', parseInt(formData.id_nudo));
      }
      await refreshAllData();
      showAlert('Proyecto creado', '✅ Proyecto creado exitosamente', 'success');
      setIsNewOpen(false);
      resetForm();
    } catch (error: any) {
      console.error(error);
      showAlert('Error', 'Error al crear el proyecto: ' + error.message, 'danger');
    } finally {
      setSaving(false);
    }
  };

  const resetForm = () => {
    setFormData({
      nombre: '', id_nudo: '', categoria_7t: 'T2', beneficiarios_familias: '', diagnostico: '',
      presupuesto: '', ente_financiamiento: '', tecnico_nombre: '', tecnico_apellido: '', tecnico_cedula: '', duracion: '',
    });
    setSelectedNudo(null);
    setActaFile(null);
    setFotosFiles([]);
    setRequerimientos('');
    setDuracion('');
    setStep(1);
  };

  const handleUpdateStatus = async (proyecto: Proyecto, nuevoEstado: string, nuevoProgreso: number, datos: any) => {
    const { error } = await supabase
      .from('proyectos')
      .update({ estado: nuevoEstado, progreso: nuevoProgreso, ...datos })
      .eq('id_proyecto', proyecto.id_proyecto);
    if (!error) {
      setEditingProject(null);
      refreshAllData();
      showAlert('Actualizado', 'Estado del proyecto actualizado correctamente', 'success');
    }
  };

  const handleDelete = async (proyecto: Proyecto) => {
    showConfirm(
      'Confirmar eliminación',
      '¿Eliminar este proyecto y todos sus documentos? Esta acción no se puede deshacer.',
      async () => {
        try {
          await deleteProjectFiles(proyecto);
          await supabase.from('proyectos').delete().eq('id_proyecto', proyecto.id_proyecto);
          setProyectos(prev => prev.filter(p => p.id_proyecto !== proyecto.id_proyecto));
          showAlert('Eliminado', 'Proyecto eliminado correctamente', 'success');
        } catch (error) {
          console.error(error);
          showAlert('Error', 'Error al eliminar el proyecto', 'danger');
        }
      }
    );
  };

  const handleViewDocument = async (relativePath: string | null | undefined, bucket: string) => {
    if (!relativePath) return;
    const signedUrl = await getSignedUrl(relativePath as string, bucket);
    if (signedUrl) window.open(signedUrl, '_blank');
    else showAlert('Error', 'No se pudo abrir el documento', 'danger');
  };

  const handleViewResponse = (proyecto: Proyecto) => {
    let proyectoToShow = proyecto;
    if (proyecto.estado === 'Rechazado' && proyecto.motivo_rechazo) {
      proyectoToShow = { ...proyecto, respuesta: proyecto.motivo_rechazo };
    }
    setCurrentProyecto(proyectoToShow);
    setViewResponseOpen(true);
  };

  const handleProrrogaAccepted = (proyecto: { id_proyecto: number; nombre: string; codigo?: string }) => {
    setFinalRendicionProyecto(proyecto);
    setShowFinalRendicion(true);
    showAlert('Prórroga aceptada', 'Ahora debe completar la Rendición Final.', 'info');
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
      showAlert('Detalle de Prórroga', `Motivo: ${registro.datos.motivo}\nPresupuesto: ${registro.datos.presupuesto_estimado}\nTiempo: ${registro.tiempoEstimado}\nEstado: ${registro.estado}`, 'info');
    }
  };

  const isStep1Valid = () => formData.nombre.trim() !== '' && (selectedNudo || formData.diagnostico.trim().length > 0);
  const isStep2Valid = () => requerimientos.trim().length > 0 && formData.tecnico_nombre.trim().length > 0 && formData.tecnico_apellido.trim().length > 0 && formData.tecnico_cedula.trim().length > 0;
  const isStep3Valid = () => !!actaFile;

  if (loading && proyectos.length === 0) {
    return <div className="flex justify-center p-8"><Loader2 className="animate-spin text-brand-primary" size={28} /></div>;
  }

  if (noConsejo) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center p-8 bg-white rounded-3xl border border-gray-100 shadow-sm">
        <div className="h-20 w-20 rounded-full bg-amber-100 flex items-center justify-center mb-6">
          <AlertCircle className="h-10 w-10 text-amber-600" />
        </div>
        <h3 className="text-xl font-black text-slate-800 uppercase tracking-tighter mb-2">
          Aún no has registrado tu Consejo Comunal
        </h3>
        <p className="text-slate-500 max-w-md mb-8">
          Para acceder a las estadísticas y funcionalidades del dashboard, primero debes completar los datos legales de tu consejo comunal.
        </p>
        <button
          onClick={() => {}} 
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
      {/* CABECERA Y PESTAÑAS */}
      <div className="flex flex-col sm:flex-row gap-3 bg-gradient-to-r from-slate-50 to-gray-50 p-4 rounded-xl border border-gray-100 shadow-sm">
        <div className="flex-1">
          <h3 className="text-base font-black text-slate-800 italic uppercase tracking-tighter mb-1">Gestión de Proyectos 7T</h3>
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

      <AnimatePresence mode="wait">
        {activeSection === 'proyectos' && (
          <motion.div key="proyectos" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} transition={{ duration: 0.2 }}>
            <div className="flex items-center justify-between flex-wrap gap-3">
              <div>
                <h3 className="text-sm font-black text-slate-800 italic uppercase">Proyectos de Obra</h3>
                <p className="text-[8px] text-slate-400 font-bold uppercase mt-0.5">Página {currentPage} de {totalPages} • {proyectosFiltrados.length} proyectos</p>
              </div>
              <div className="flex flex-col sm:flex-row gap-2">
                <select value={selectedCategoria} onChange={(e) => { setSelectedCategoria(e.target.value); resetPagination(); }} className="w-full sm:w-auto px-3 py-1.5 rounded-lg bg-white border border-brand-primary text-[9px] font-black text-slate-800">
                  <option value="Todas">Todas las Transformaciones ({proyectos.length})</option>
                  {['T1','T2','T3','T4','T5','T6','T7'].map(t => <option key={t} value={t}>{t} ({proyectos.filter(p => p.categoria_7t === t).length})</option>)}
                </select>
                <button onClick={() => refreshAllData()} className="flex items-center gap-1.5 rounded-lg bg-white border border-brand-primary/20 px-3 py-1.5 text-[8px] font-black text-brand-primary shadow-sm hover:bg-brand-primary/5">
                  <RefreshCw className="h-3 w-3" /> Refrescar
                </button>
                <button onClick={() => { resetForm(); setIsNewOpen(true); }} className="flex items-center gap-1.5 rounded-lg bg-brand-primary px-4 py-1.5 text-[8px] font-black text-white shadow-md hover:scale-105"><Plus className="h-3 w-3" /> Nuevo Proyecto</button>
              </div>
            </div>
            <div className="grid gap-3 mt-3">
              {currentProyectos.map(p => (
                <ProyectoCard 
                  key={p.id_proyecto} 
                  proyecto={p} 
                  onEdit={setEditingProject} 
                  onDelete={handleDelete} 
                  onViewDocument={handleViewDocument} 
                  onViewResponse={handleViewResponse} 
                  onRendicion={handleRendicion}
                  onProrroga={handleProrroga}
                />
              ))}
              {currentProyectos.length === 0 && !loading && <div className="text-center py-6 text-slate-400 text-xs">No hay proyectos en esta categoría</div>}
            </div>
            {totalPages > 1 && <PaginationComponent currentPage={currentPage} totalPages={totalPages} onPageChange={setCurrentPage} totalItems={proyectosFiltrados.length} section="proyectos" />}
          </motion.div>
        )}

        {activeSection === 'rendicion' && (
          <motion.div key="rendicion" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }} transition={{ duration: 0.2 }}>
            <div className="flex items-center justify-between flex-wrap gap-3">
              <div>
                <h3 className="text-sm font-black text-slate-800 italic uppercase">Registros de Rendición y Prórroga</h3>
                <p className="text-[8px] text-slate-400 font-bold uppercase mt-0.5">{registrosUnificados.length} registros totales • Página {currentPage} de {totalPagesRegistros}</p>
              </div>
              <div className="flex flex-col sm:flex-row gap-2">
                <select value={selectedCategoria} onChange={(e) => { setSelectedCategoria(e.target.value); resetPagination(); }} className="w-full sm:w-auto px-3 py-1.5 rounded-lg bg-white border border-brand-primary text-[9px] font-black">
                  <option value="Todas">Todas las categorías ({registrosUnificados.length})</option>
                  {['T1','T2','T3','T4','T5','T6','T7'].map(t => {
                    const count = registrosUnificados.filter(r => r.proyecto?.categoria_7t === t).length;
                    return <option key={t} value={t}>{t} ({count})</option>;
                  })}
                </select>
                <div className="relative" ref={dropdownRef}>
                  <button
                    onClick={() => setShowRegistroDropdown(!showRegistroDropdown)}
                    className="flex items-center gap-1.5 rounded-lg bg-brand-primary px-4 py-1.5 text-[8px] font-black text-white shadow-md hover:scale-105"
                  >
                    <Plus className="h-3 w-3" /> Nuevo Registro <ChevronDown className="h-3 w-3" />
                  </button>
                  {showRegistroDropdown && (
                    <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-100 z-20">
                      <button
                        onClick={() => handleNuevoRegistro('rendicion')}
                        className="w-full text-left px-4 py-2 text-[10px] font-bold text-slate-700 hover:bg-gray-50 rounded-t-lg"
                      >
                        Rendición de Cuentas
                      </button>
                      <button
                        onClick={() => handleNuevoRegistro('prorroga')}
                        className="w-full text-left px-4 py-2 text-[10px] font-bold text-slate-700 hover:bg-gray-50 rounded-b-lg"
                      >
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
                  {currentRegistros.map((registro) => (
                    <tr key={`${registro.tipo}-${registro.id}`} className="border-b border-gray-50 hover:bg-gray-50/30 transition-colors">
                      <td className="px-4 py-3 text-xs font-bold">
                        <span className="inline-block px-2 py-0.5 rounded-full bg-brand-primary/10 text-brand-primary text-[9px] font-black">
                          {registro.proyecto?.categoria_7t || 'N/A'}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="text-xs font-bold text-slate-800">{registro.proyecto?.nombre}</div>
                        <div className="text-[9px] text-slate-400 font-mono">{registro.proyecto?.codigo}</div>
                      </td>
                      <td className="px-4 py-3 text-xs text-slate-600">
                        {registro.tipo === 'rendicion' 
                          ? (registro.categoriaSeleccionada?.toUpperCase() || '—') 
                          : 'Prórroga'}
                      </td>
                      <td className="px-4 py-3 text-xs text-slate-600">
                        {registro.tipo === 'rendicion' 
                          ? `${new Date(registro.fechaInicio!).toLocaleDateString()} - ${new Date(registro.fechaFin!).toLocaleDateString()}`
                          : registro.tiempoEstimado}
                      </td>
                      <td className="px-4 py-3">
                        <span className={cn(
                          "inline-block px-2 py-0.5 rounded-full text-[9px] font-black uppercase",
                          registro.tipo === 'rendicion' ? "bg-emerald-100 text-emerald-700" : "bg-amber-100 text-amber-700"
                        )}>
                          {registro.tipo === 'rendicion' ? 'Rendición' : 'Prórroga'}
                        </span>
                        {registro.tipo === 'prorroga' && (
                          <span className="ml-2 text-[8px] font-bold text-slate-400">
                            ({registro.estado})
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-center">
                        <div className="flex items-center justify-center gap-2">
                          <button 
                            onClick={() => handleViewRegistro(registro)}
                            className="p-1.5 rounded-lg bg-blue-50 text-blue-600 hover:bg-blue-100 transition-colors"
                            title="Ver detalle"
                          >
                            <Eye className="h-3.5 w-3.5" />
                          </button>
                          <button 
                            onClick={() => handleEditRegistro(registro)}
                            className="p-1.5 rounded-lg bg-amber-50 text-amber-600 hover:bg-amber-100 transition-colors"
                            title="Editar"
                          >
                            <Edit className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {currentRegistros.length === 0 && (
                <div className="col-span-full text-center py-8 text-slate-400 border border-dashed border-gray-200 rounded-xl mt-4">
                  <FileText className="h-10 w-10 mx-auto mb-2 text-slate-300" />
                  <h4 className="text-sm font-black text-slate-500 mb-1">No hay registros de rendición o prórroga</h4>
                  <button onClick={() => setActiveSection('proyectos')} className="px-4 py-1.5 bg-brand-primary text-white text-[8px] font-black uppercase rounded-lg">Ver Proyectos</button>
                </div>
              )}
            </div>

            {totalPagesRegistros > 1 && (
              <PaginationComponent 
                currentPage={currentPage} 
                totalPages={totalPagesRegistros} 
                onPageChange={setCurrentPage} 
                totalItems={registrosFiltrados.length} 
                section="rendicion" 
              />
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* MODALES */}
      <AnimatePresence>
        {isNewOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }} 
              animate={{ opacity: 1 }} 
              exit={{ opacity: 0 }} 
              onClick={() => setIsNewOpen(false)} 
              className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" 
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }} 
              animate={{ opacity: 1, scale: 1, y: 0 }} 
              exit={{ opacity: 0, scale: 0.95, y: 20 }} 
              className="relative w-full max-w-xl bg-white rounded-3xl shadow-2xl overflow-hidden max-h-[90vh] overflow-y-auto"
            >
              <div className="bg-slate-50 p-5 border-b border-gray-100 sticky top-0 z-10">
                <div className="flex items-center justify-between mb-3">
                  <h4 className="text-sm font-black text-slate-800 italic uppercase">Nuevo Proyecto Comunal</h4>
                  <button onClick={() => setIsNewOpen(false)} className="p-1 rounded-lg hover:bg-gray-200"><X className="h-3.5 w-3.5 text-slate-400"/></button>
                </div>
                <div className="flex items-center gap-2">
                  {[1, 2, 3, 4].map(s => (
                    <div key={s} className="flex-1 flex flex-col gap-0.5">
                      <div className={cn("h-0.5 rounded-full transition-all", step >= s ? "bg-brand-primary" : "bg-gray-200")} />
                      <span className={cn("text-[8px] font-bold uppercase text-center", step === s ? "text-brand-primary" : "text-slate-300")}>Paso {s}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="p-5 space-y-4">
                {step === 1 && (
                  <div className="space-y-3">
                    <div>
                      <label className="text-[9px] font-black text-slate-400 uppercase tracking-wider">Nombre del proyecto *</label>
                      <input 
                        className="w-full p-3 mt-1 rounded-xl bg-gray-50 ring-1 ring-gray-100 focus:ring-2 focus:ring-brand-primary/20 outline-none text-[10px] font-bold transition-all" 
                        placeholder="Ej: Rehabilitación de red de agua"
                        value={formData.nombre} 
                        onChange={e => setFormData({...formData, nombre: e.target.value})}
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="text-[9px] font-black text-slate-400 uppercase">Vincular a nudo crítico</label>
                        <select 
                          className="w-full p-3 mt-1 rounded-xl bg-gray-50 text-[10px] font-bold outline-none" 
                          value={formData.id_nudo} 
                          onChange={e => setFormData({...formData, id_nudo: e.target.value})}
                        >
                          <option value="">Ninguno (crear proyecto sin nudo)</option>
                          {nudosFiltrados.map(n => (
                            <option key={n.id_nudo} value={n.id_nudo}>
                              {n.titulo} ({n.categoria_7t})
                            </option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label className="text-[9px] font-black text-slate-400 uppercase">Transformación 7T</label>
                        <select 
                          className={cn("w-full p-3 mt-1 rounded-xl bg-gray-50 text-[10px] font-bold outline-none", !!selectedNudo && "bg-gray-100 text-slate-500 cursor-not-allowed")} 
                          value={formData.categoria_7t} 
                          onChange={e => setFormData({...formData, categoria_7t: e.target.value})}
                          disabled={!!selectedNudo}
                        >
                          <option value="T1">T1 - Económica</option>
                          <option value="T2">T2 - Servicios</option>
                          <option value="T3">T3 - Seguridad</option>
                          <option value="T4">T4 - Social</option>
                          <option value="T5">T5 - Política</option>
                          <option value="T6">T6 - Ciencia</option>
                          <option value="T7">T7 - Geopolítica</option>
                        </select>
                      </div>
                    </div>
                    <div className="grid grid-cols-1 gap-3">
                      <div>
                        <label className="text-[9px] font-black text-slate-400 uppercase">Familias beneficiadas</label>
                        <input 
                          type="number" 
                          className="w-full p-3 mt-1 rounded-xl bg-gray-50 text-[10px] font-bold outline-none" 
                          placeholder="Cantidad de familias"
                          value={formData.beneficiarios_familias} 
                          onChange={e => setFormData({...formData, beneficiarios_familias: e.target.value})}
                        />
                      </div>
                      <div>
                        <label className="text-[9px] font-black text-slate-400 uppercase">Diagnóstico *</label>
                        <textarea 
                          rows={3} 
                          className={cn("w-full p-3 mt-1 rounded-xl bg-gray-50 text-[10px] font-bold resize-none outline-none", !!selectedNudo && "bg-gray-100 text-slate-500 cursor-not-allowed")} 
                          placeholder="Descripción del problema"
                          value={formData.diagnostico} 
                          onChange={e => setFormData({...formData, diagnostico: e.target.value})}
                          readOnly={!!selectedNudo}
                          disabled={!!selectedNudo}
                        />
                      </div>
                    </div>
                  </div>
                )}

                {step === 2 && (
                  <div className="space-y-3">
                    <div>
                      <label className="text-[9px] font-black text-slate-400 uppercase tracking-wider">Listado de requerimientos *</label>
                      <textarea 
                        rows={3} 
                        className="w-full p-3 mt-1 rounded-xl bg-gray-50 text-[10px] font-bold resize-none outline-none" 
                        placeholder="Materiales, mano de obra, equipos..."
                        value={requerimientos}
                        onChange={e => setRequerimientos(e.target.value)}
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="text-[9px] font-black text-slate-400 uppercase">Presupuesto (USD)</label>
                        <input 
                          type="number" 
                          step="0.01" 
                          className="w-full p-3 mt-1 rounded-xl bg-gray-50 text-[10px] font-bold outline-none" 
                          placeholder="0.00"
                          value={formData.presupuesto} 
                          onChange={e => setFormData({...formData, presupuesto: e.target.value})}
                        />
                      </div>
                      <div>
                        <label className="text-[9px] font-black text-slate-400 uppercase">Ente financiero</label>
                        <select 
                          className="w-full p-3 mt-1 rounded-xl bg-gray-50 text-[10px] font-bold outline-none" 
                          value={formData.ente_financiamiento} 
                          onChange={e => setFormData({...formData, ente_financiamiento: e.target.value})}
                        >
                          <option value="">Seleccione</option>
                          <option value="Alcaldía">Alcaldía</option>
                          <option value="Financiamiento externo">Financiamiento externo</option>
                        </select>
                      </div>
                    </div>
                    <div className="pt-1">
                      <label className="text-[9px] font-black text-slate-400 uppercase block mb-1">Técnico Responsable *</label>
                      <div className="grid grid-cols-3 gap-2 bg-gray-50/50 p-3 rounded-xl border border-gray-100">
                        <input className="w-full p-2.5 rounded-lg bg-white border border-gray-200 text-[9px] font-semibold outline-none" placeholder="Nombre" value={formData.tecnico_nombre} onChange={e => setFormData({...formData, tecnico_nombre: e.target.value})}/>
                        <input className="w-full p-2.5 rounded-lg bg-white border border-gray-200 text-[9px] font-semibold outline-none" placeholder="Apellido" value={formData.tecnico_apellido} onChange={e => setFormData({...formData, tecnico_apellido: e.target.value})}/>
                        <input type="text" className="w-full p-2.5 rounded-lg bg-white border border-gray-200 text-[9px] font-semibold outline-none" placeholder="Cédula" value={formData.tecnico_cedula} onChange={e => setFormData({...formData, tecnico_cedula: e.target.value})}/>
                      </div>
                    </div>
                    <div>
                      <label className="text-[9px] font-black text-slate-400 uppercase">Duración</label>
                      <input type="text" className="w-full p-3 mt-1 rounded-xl bg-gray-50 text-[10px] font-bold outline-none" placeholder="Ej: 3 meses" value={duracion} onChange={e => setDuracion(e.target.value)}/>
                    </div>
                  </div>
                )}

                {step === 3 && (
                  <div className="grid grid-cols-2 gap-3">
                    <div className="p-4 border-2 border-dashed border-gray-100 rounded-xl flex flex-col items-center text-center cursor-pointer hover:border-brand-primary/20 transition-all group" onClick={() => actaInputRef.current?.click()}>
                      <input type="file" ref={actaInputRef} className="hidden" accept=".pdf" onChange={e => setActaFile(e.target.files?.[0] || null)} />
                      <FileText className="h-8 w-8 text-slate-300 mb-1 group-hover:text-brand-primary" />
                      <h5 className="text-[10px] font-black uppercase mb-0.5">Acta de asamblea *</h5>
                      <p className="text-[8px] text-slate-400">{actaFile ? actaFile.name : "Requerido (PDF)"}</p>
                    </div>
                    <div className="p-4 border-2 border-dashed border-gray-100 rounded-xl flex flex-col items-center text-center cursor-pointer hover:border-brand-primary/20 transition-all group" onClick={() => fotosInputRef.current?.click()}>
                      <input type="file" ref={fotosInputRef} className="hidden" multiple accept="image/*" onChange={e => setFotosFiles(e.target.files ? Array.from(e.target.files) : [])} />
                      <Camera className="h-8 w-8 text-slate-300 mb-1 group-hover:text-brand-primary" />
                      <h5 className="text-[10px] font-black uppercase mb-0.5">Fotos soporte</h5>
                      <p className="text-[8px] text-slate-400">{fotosFiles.length > 0 ? `${fotosFiles.length} selec.` : "Opcional"}</p>
                    </div>
                  </div>
                )}

                {step === 4 && (
                  <div className="flex flex-col items-center justify-center py-6 text-center space-y-3">
                    <div className="h-16 w-16 rounded-xl bg-emerald-100 border-2 border-emerald-200 flex items-center justify-center">
                      <CheckCircle2 className="h-8 w-8 text-emerald-600" />
                    </div>
                    <div>
                      <h4 className="text-base font-black text-slate-800 italic uppercase tracking-tight mb-0.5">¡Listo para registro!</h4>
                      <p className="text-slate-500 text-[10px] max-w-xs mx-auto">
                        Su proyecto quedará registrado en estado <span className="font-black text-brand-primary">"Propuesto"</span>.
                      </p>
                    </div>
                  </div>
                )}
              </div>

              <div className="p-4 bg-slate-50 border-t border-gray-100 flex items-center justify-between gap-2">
                {step > 1 && step < 4 && (
                  <button onClick={() => setStep(step - 1)} className="px-4 py-2 rounded-lg border border-gray-200 text-[9px] font-black uppercase text-slate-400 hover:bg-white transition-colors">
                    Anterior
                  </button>
                )}
                {step < 4 ? (
                  <button 
                    onClick={() => setStep(step + 1)} 
                    disabled={
                      (step === 1 && !isStep1Valid()) ||
                      (step === 2 && !isStep2Valid()) ||
                      (step === 3 && !isStep3Valid())
                    }
                    className="ml-auto px-5 py-2.5 rounded-lg bg-brand-primary text-white text-[9px] font-black uppercase tracking-wider shadow-md active:scale-95 transition-all disabled:opacity-50"
                  >
                    Siguiente Paso
                  </button>
                ) : (
                  <button 
                    onClick={handleCreateSubmit} 
                    disabled={saving || !formData.nombre.trim() || !actaFile || 
                              !formData.tecnico_nombre.trim() || 
                              !formData.tecnico_apellido.trim() || 
                              !formData.tecnico_cedula.trim()}  
                    className="w-full py-2.5 rounded-lg bg-brand-primary text-white text-[9px] font-black uppercase tracking-wider shadow-md disabled:opacity-70 flex items-center justify-center gap-1.5 transition-all"
                  >
                    {saving ? <Loader2 className="animate-spin" size={14} /> : "Listo Registro"}
                  </button>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {editingProject && (
          <div className="fixed inset-0 z-[300] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setEditingProject(null)}
              className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.98, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.98, y: 10 }}
              className="relative w-full max-w-xl bg-white rounded-xl shadow-xl overflow-hidden flex flex-col max-h-[85vh] border border-slate-100"
            >
              <div className="px-4 py-3 border-b border-slate-100 bg-white sticky top-0 z-10">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-[9px] font-bold tracking-wider text-amber-600 uppercase bg-amber-50 px-1.5 py-0.5 rounded border border-amber-100">
                        {editingProject.codigo || "CÓDIGO"}
                      </span>
                      <h4 className="text-base font-bold text-slate-800">Actualizar Proyecto</h4>
                    </div>
                    <p className="text-[10px] text-slate-400 mt-0.5 truncate max-w-md font-medium">
                      {editingProject.nombre}
                    </p>
                  </div>
                  <button onClick={() => setEditingProject(null)} className="p-1 rounded-lg text-slate-400 hover:bg-slate-50"><X className="h-3.5 w-3.5" /></button>
                </div>
              </div>
              <div className="flex-1 overflow-y-auto px-4 py-3">
                <EditProjectForm
                  proyecto={editingProject}
                  consejoId={consejoId}
                  onUpdate={handleUpdateStatus}
                  onCancel={() => setEditingProject(null)}
                />
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* MODALES EXTERNOS */}
      <ProrrogaModal 
        isOpen={isProrrogaOpen}
        onClose={() => { setIsProrrogaOpen(false); setCurrentProrrogaProyecto(null); }}
        proyectoName={currentProrrogaProyecto?.nombre || ''}
        proyectos={proyectosCulminados.map(p => ({ 
          id_proyecto: p.id_proyecto, 
          nombre: p.nombre, 
          codigo: p.codigo || '', 
          categoria_7t: p.categoria_7t, 
          ente_financiamiento: p.ente_financiamiento || '' ,
          estado: p.estado || ''
        }))}
        onSelectProyecto={(proy) => setCurrentProrrogaProyecto(proyectos.find(p => p.id_proyecto === proy.id_proyecto) || null)}
        selectedProyecto={currentProrrogaProyecto ? { 
          id_proyecto: currentProrrogaProyecto.id_proyecto, 
          nombre: currentProrrogaProyecto.nombre, 
          codigo: currentProrrogaProyecto.codigo || '', 
          categoria_7t: currentProrrogaProyecto.categoria_7t, 
          ente_financiamiento: currentProrrogaProyecto.ente_financiamiento || '' 
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
      <ViewResponseModal isOpen={viewResponseOpen} onClose={() => setViewResponseOpen(false)} proyecto={currentProyecto} />
      
      <RendicionModal 
        isOpen={isRendicionOpen} 
        onClose={() => { setIsRendicionOpen(false); setSelectedRendicionProyecto(null); }} 
        proyectos={proyectosCulminados.map(p => ({ 
          id_proyecto: p.id_proyecto, 
          nombre: p.nombre, 
          codigo: p.codigo || '', 
          categoria_7t: p.categoria_7t, 
          ente_financiamiento: p.ente_financiamiento || '' ,
          estado: p.estado || ''
        }))}
        onSelectProyecto={setSelectedRendicionProyecto}
        selectedProyecto={selectedRendicionProyecto}
        onSuccess={() => { fetchRendiciones(); }}
        consejoId={consejoId}
        editMode={!!editingRegistro && editingRegistro.tipo === 'rendicion'}
        initialData={editingRegistro?.datos}
        onEditSuccess={() => {
          fetchRendiciones();
          setEditingRegistro(null);
          setIsEditRendicionOpen(false);
        }}
      />

      {isEditRendicionOpen && editingRegistro && editingRegistro.tipo === 'rendicion' && (
        <RendicionModal
          isOpen={isEditRendicionOpen}
          onClose={() => { setIsEditRendicionOpen(false); setEditingRegistro(null); }}
          proyectos={proyectosCulminados.map(p => ({ 
            id_proyecto: p.id_proyecto, 
            nombre: p.nombre, 
            codigo: p.codigo || '', 
            categoria_7t: p.categoria_7t, 
            ente_financiamiento: p.ente_financiamiento || '' ,
            estado: p.estado || ''
          }))}
          onSelectProyecto={() => {}}
          selectedProyecto={{ id_proyecto: editingRegistro.proyecto.id_proyecto, nombre: editingRegistro.proyecto.nombre, codigo: editingRegistro.proyecto.codigo }}
          onSuccess={() => {
            fetchRendiciones();
            setIsEditRendicionOpen(false);
            setEditingRegistro(null);
          }}
          consejoId={consejoId}
          editMode={true}
          initialData={editingRegistro.datos}
        />
      )}

      {isEditProrrogaOpen && editingRegistro && editingRegistro.tipo === 'prorroga' && (
        <ProrrogaModal
          isOpen={isEditProrrogaOpen}
          onClose={() => { setIsEditProrrogaOpen(false); setEditingRegistro(null); }}
          proyectoName={editingRegistro.proyecto.nombre}
          proyectos={proyectosCulminados.map(p => ({ 
            id_proyecto: p.id_proyecto, 
            nombre: p.nombre, 
            codigo: p.codigo || '', 
            categoria_7t: p.categoria_7t, 
            ente_financiamiento: p.ente_financiamiento || '' ,
            estado: p.estado || ''
          }))}
          onSelectProyecto={() => {}}
          selectedProyecto={{ id_proyecto: editingRegistro.proyecto.id_proyecto, nombre: editingRegistro.proyecto.nombre, codigo: editingRegistro.proyecto.codigo, categoria_7t: editingRegistro.proyecto.categoria_7t, ente_financiamiento: editingRegistro.proyecto.ente_financiamiento }}
          onProrrogaAccepted={() => {
            fetchSolicitudesProrroga();
            setIsEditProrrogaOpen(false);
            setEditingRegistro(null);
          }}
          editMode={true}
          initialData={editingRegistro.datos}
        />
      )}

      <RendicionDetailModal
        isOpen={detailModalOpen}
        onClose={() => setDetailModalOpen(false)}
        rendicion={selectedRendicionForDetail.rendicion}
        proyecto={selectedRendicionForDetail.proyecto}
      />

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

// ========== COMPONENTES AUXILIARES ==========
const ProyectoCard = ({ 
  proyecto, 
  onEdit, 
  onDelete, 
  onViewDocument, 
  onViewResponse,
  onRendicion,
  onProrroga 
}: { 
  proyecto: Proyecto; 
  onEdit: (p: Proyecto) => void; 
  onDelete: (p: Proyecto) => void;
  onViewDocument: (url: string | null | undefined, bucket: string) => void;
  onViewResponse: (p: Proyecto) => void;
  onRendicion: (p: Proyecto) => void;
  onProrroga: (p: Proyecto) => void;
}) => {
  const [firstPhotoUrl, setFirstPhotoUrl] = useState<string | null>(null);
  const [loadingPhoto, setLoadingPhoto] = useState(false);

  useEffect(() => {
    const loadPhoto = async () => {
      if (proyecto.fotos_antes_urls && proyecto.fotos_antes_urls.length > 0) {
        setLoadingPhoto(true);
        const relativePath = proyecto.fotos_antes_urls[0];
        const { data, error } = await supabase.storage
          .from('proyectos_docs')
          .createSignedUrl(relativePath, 60);
        if (data?.signedUrl) {
          setFirstPhotoUrl(data.signedUrl);
        } else {
          console.error('Error al generar signed URL:', error);
          setFirstPhotoUrl(null);
        }
        setLoadingPhoto(false);
      }
    };
    loadPhoto();
  }, [proyecto.fotos_antes_urls]);

  const statusColors: Record<string, string> = {
    'Propuesto': 'bg-slate-100 text-slate-600 border-slate-200',
    'En Ejecución': 'bg-brand-primary/10 text-brand-primary border-brand-primary/20',
    'Culminado': 'bg-emerald-50 text-emerald-600 border-emerald-100',
    'Aceptado': 'bg-emerald-100 text-emerald-700 border-emerald-200',
    'Rechazado': 'bg-rose-100 text-rose-700 border-rose-200',
    'En revisión': 'bg-amber-100 text-amber-700 border-amber-200'
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
    <div className="bg-white rounded-xl border border-gray-100 shadow-sm group hover:shadow-md transition-all overflow-hidden">
      <div className="p-4 flex flex-col lg:flex-row gap-4 lg:items-start">
        <div 
          className="h-24 lg:w-36 rounded-lg overflow-hidden bg-slate-100 flex items-center justify-center shrink-0 border border-gray-50 relative cursor-pointer group/photo"
          onClick={() => {
            if (proyecto.fotos_antes_urls && proyecto.fotos_antes_urls.length > 0) {
              onViewDocument(proyecto.fotos_antes_urls[0], 'proyectos_docs');
            }
          }}
        >
          {loadingPhoto ? (
            <Loader2 className="h-5 w-5 text-slate-300 animate-spin" />
          ) : firstPhotoUrl ? (
            <>
              <img src={firstPhotoUrl} alt="Vista previa" className="w-full h-full object-cover" />
              <div className="absolute inset-0 bg-black/0 group-hover/photo:bg-black/20 transition-colors flex items-center justify-center">
                <Eye className="h-4 w-4 text-white opacity-0 group-hover/photo:opacity-100" />
              </div>
            </>
          ) : (
            <Construction className="h-6 w-6 text-slate-300" />
          )}
        </div>

        <div className="flex-1 space-y-2">
          <div className="flex items-center justify-between flex-wrap gap-1">
            <span className="text-[8px] font-black text-brand-primary uppercase">{proyecto.codigo || `ID: ${proyecto.id_proyecto}`}</span>
            <div className="flex items-center gap-1">
              <span className="text-[7px] font-black px-1.5 py-0.5 rounded-full bg-green-100 text-green-600 border border-green-200 uppercase">{proyecto.categoria_7t}</span>
              <span className={cn("text-[7px] font-black px-1.5 py-0.5 rounded-full uppercase border", statusColors[proyecto.estado ?? 'Propuesto'] || statusColors['Propuesto'])}>
                {proyecto.estado || 'Propuesto'}
              </span>
            </div>
          </div>
          <h4 className="text-sm font-black text-slate-800 tracking-tight italic leading-tight">{proyecto.nombre}</h4>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-2 pt-2">
            {[
              { label: 'Antes', text: (proyecto as any).desc_antes, color: 'text-amber-600' },
              { label: 'Durante', text: (proyecto as any).desc_durante, color: 'text-brand-primary' },
              { label: 'Después', text: (proyecto as any).desc_despues, color: 'text-emerald-600' }
            ].map((etapa, idx) => (
              <div key={idx} className="bg-gray-50/50 p-1.5 rounded-lg border border-gray-100">
                <p className={cn("text-[7px] font-black uppercase mb-0.5", etapa.color)}>{etapa.label}</p>
                <p className="text-[8px] text-slate-500 leading-tight line-clamp-2 italic">{etapa.text || "Sin descripción..."}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="lg:w-36 flex lg:flex-col justify-between items-end gap-2 self-stretch">
          <div className="text-right">
            <p className="text-[8px] font-bold text-slate-400 uppercase">Presupuesto</p>
            <p className="text-[10px] font-black text-slate-800">{presupuestoDisplay}</p>
            <p className="text-[8px] font-bold text-slate-400 uppercase mt-1">Fecha</p>
            <p className="text-[8px] font-black text-slate-800 italic">{new Date(proyecto.created_at).toLocaleDateString()}</p>
          </div>
          <div className="flex gap-1 flex-wrap justify-end">
            <button onClick={() => onViewResponse(proyecto)} className="p-1.5 text-slate-400 hover:text-brand-primary rounded-lg">
              <MessageSquare className="h-3.5 w-3.5" />
            </button>
            {/* Edición solo permitida si NO es Propuesto, En revisión, Aceptado ni Rechazado */}
            {proyecto.estado !== 'Propuesto' && 
             proyecto.estado !== 'En revisión' && 
             proyecto.estado !== 'Aceptado' && 
             proyecto.estado !== 'Rechazado' && (
              <button onClick={() => onEdit(proyecto)} className="p-1.5 text-slate-400 hover:text-brand-primary rounded-lg">
                <Edit className="h-3.5 w-3.5" />
              </button>
            )}
            {proyecto.acta_url && (
              <button onClick={() => onViewDocument(proyecto.acta_url, 'proyectos_docs')} className="p-1.5 text-slate-400 hover:text-brand-primary rounded-lg">
                <FileText className="h-3.5 w-3.5" />
              </button>
            )}
            <button onClick={() => onDelete(proyecto)} className="p-1.5 text-slate-400 hover:text-rose-500 rounded-lg">
              <Trash2 className="h-3.5 w-3.5" />
            </button>
            {/* Botones de Rendición y Prórroga SOLO si está culminado */}
            {proyecto.estado === 'Culminado' && (
              <>
                <button onClick={() => onRendicion(proyecto)} className="p-1.5 text-emerald-600 hover:text-emerald-800 rounded-lg" title="Rendir">
                  <FileText className="h-3.5 w-3.5" />
                </button>
                <button onClick={() => onProrroga(proyecto)} className="p-1.5 text-amber-600 hover:text-amber-800 rounded-lg" title="Prórroga">
                  <Calendar className="h-3.5 w-3.5" />
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

const EditProjectForm = ({ proyecto, consejoId, onUpdate, onCancel }: { 
  proyecto: Proyecto; 
  consejoId: number | null;
  onUpdate: (p: Proyecto, estado: string, progreso: number, datos: any) => void; 
  onCancel: () => void 
}) => {
  const getCurrentStep = () => {
    if ((proyecto as any).desc_despues && (proyecto as any).desc_despues.length >= 100) return 2;
    if ((proyecto as any).desc_durante && (proyecto as any).desc_durante.length >= 100) return 2;
    if ((proyecto as any).desc_antes && (proyecto as any).desc_antes.length >= 100) return 1;
    return 0;
  };
  const [currentStep, _setCurrentStep] = useState<number>(getCurrentStep());
  const [descActual, setDescActual] = useState<string>(
    currentStep === 0 ? ((proyecto as any).desc_antes || "") :
    currentStep === 1 ? ((proyecto as any).desc_durante || "") :
    ((proyecto as any).desc_despues || "")
  );
  const [fechaActual, setFechaActual] = useState<string>(
    currentStep === 0 ? ((proyecto as any).fecha_antes || "") :
    currentStep === 1 ? ((proyecto as any).fecha_durante || "") :
    ((proyecto as any).fecha_despues || "")
  );
  const etapas = [
    { step: 0, label: "Situación Inicial (ANTES)", color: "text-amber-600", estadoSiguiente: "En Ejecución", progreso: 33 },
    { step: 1, label: "Proceso de Obra (DURANTE)", color: "text-brand-primary", estadoSiguiente: "Culminado", progreso: 66 },
    { step: 2, label: "Resultado Final (DESPUÉS)", color: "text-emerald-600", estadoSiguiente: "Culminado", progreso: 100 }
  ];
  const etapaActual = etapas[currentStep];

  const handleSave = async () => {
    if (descActual.length < 100) {
      showAlert('Descripción insuficiente', 'La descripción debe tener al menos 100 caracteres', 'warning');
      return;
    }
    const etapaKey = ['antes', 'durante', 'despues'][currentStep];
    const datosActualizar: any = {
      [`desc_${etapaKey}`]: descActual,
      [`fecha_${etapaKey}`]: fechaActual?.trim() || null,
    };
    let nuevoEstado: string = proyecto.estado || 'Propuesto';
    let nuevoProgreso: number = proyecto.progreso || 0;
    if (currentStep === 0) { nuevoEstado = 'En Ejecución'; nuevoProgreso = 33; }
    else if (currentStep === 1) { nuevoEstado = 'Culminado'; nuevoProgreso = 66; }
    else if (currentStep === 2) { nuevoEstado = 'Culminado'; nuevoProgreso = 100; }
    onUpdate(proyecto, nuevoEstado, nuevoProgreso, datosActualizar);
  };
  const isValid = descActual.length >= 100;

  return (
    <div className="space-y-5 max-h-[85vh] overflow-y-auto pr-2">
      <div className="text-center space-y-2">
        <div className="flex items-center justify-center gap-2 mb-2">
          <div className={cn("w-8 h-8 rounded-xl flex items-center justify-center", currentStep>=0 ? "bg-amber-100 border-2 border-amber-400" : "bg-gray-100")}><span className="text-sm font-black text-amber-600">1</span></div>
          <div className={cn("w-12 h-0.5 rounded-full", currentStep>=1 ? "bg-amber-500" : "bg-gray-200")} />
          <div className={cn("w-8 h-8 rounded-xl flex items-center justify-center", currentStep>=1 ? "bg-brand-primary/20 border-2 border-brand-primary" : "bg-gray-100")}><span className="text-sm font-black text-brand-primary">2</span></div>
          <div className={cn("w-12 h-0.5 rounded-full", currentStep>=2 ? "bg-emerald-500" : "bg-gray-200")} />
          <div className={cn("w-8 h-8 rounded-xl flex items-center justify-center", currentStep>=2 ? "bg-emerald-100 border-2 border-emerald-400" : "bg-gray-100")}><span className="text-sm font-black text-emerald-600">3</span></div>
        </div>
        <h4 className="text-base font-black text-slate-800 tracking-tight">{etapaActual.label}</h4>
        <p className="text-[8px] text-slate-500 font-medium uppercase tracking-wider">Paso {currentStep+1} de 3 • {proyecto.nombre}</p>
      </div>
      <div className="space-y-3 p-4 bg-linear-to-br from-slate-50 to-gray-50 rounded-xl border border-gray-200">
        <div><label className="text-[8px] font-black text-slate-400 uppercase tracking-wider">Fecha</label><input type="date" className="w-full p-3 rounded-xl bg-white border border-gray-100 text-sm font-bold outline-none focus:ring-2 focus:ring-brand-primary/20" value={fechaActual} onChange={e=>setFechaActual(e.target.value)} /></div>
        <div className="space-y-1">
          <div className="flex justify-between"><label className={cn("text-[9px] font-black uppercase tracking-wider", etapaActual.color)}>Descripción (mín. 100)</label><span className={cn("text-[8px] font-black px-1.5 py-0.5 rounded-full", descActual.length>=100 ? "bg-emerald-100 text-emerald-700" : "bg-rose-100 text-rose-700")}>{descActual.length}/100</span></div>
          <textarea className="w-full p-4 rounded-xl bg-white border border-gray-100 text-[10px] font-semibold outline-none focus:ring-2 focus:ring-brand-primary/20 resize-none h-32" placeholder="Describe..." value={descActual} onChange={e=>setDescActual(e.target.value)} />
        </div>
      </div>
      <div className="flex gap-3 pt-4 sticky bottom-0 bg-white pb-3 border-t border-gray-100">
        <button onClick={onCancel} className="flex-1 py-2.5 px-4 rounded-xl border border-gray-200 text-slate-700 text-[10px] font-black uppercase hover:bg-gray-50">Cancelar</button>
        <button onClick={handleSave} disabled={!isValid} className={cn("flex-1 py-2.5 px-4 rounded-xl text-white text-[10px] font-black uppercase shadow-lg transition-all", isValid ? "bg-brand-primary hover:scale-[1.02]" : "bg-gray-400 cursor-not-allowed")}>{currentStep < 2 ? "Guardar y Siguiente" : "Completar Proyecto"}</button>
      </div>
    </div>
  );
};

function showAlert(title: string, message: string, type: 'info' | 'success' | 'warning' | 'danger' = 'info') {
  const prefix = {
    info: 'ℹ️',
    success: '✅',
    warning: '⚠️',
    danger: '❌'
  }[type];
  if (typeof window !== 'undefined') {
    window.alert(`${prefix} ${title}\n\n${message}`);
  } else {
    console.log(`${prefix} ${title}: ${message}`);
  }
}