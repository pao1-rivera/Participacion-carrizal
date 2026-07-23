'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { 
  FileCheck, Clock, MapPin, Users, AlertCircle, CheckCircle2, XCircle,
  Eye, TrendingUp, Zap, MoreVertical, ShieldAlert, Loader2, X, Trash2, Construction
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/app/lib/utils';
import { supabase } from '@/app/lib/supabaseClient';
import { useAuth } from '@/context/AuthContext';
import { AlertModal } from '@/app/components/AlertModal';

interface ProyectoBase {
  id: number;
  nombre: string;
  presupuesto: number | null;
  beneficiarios_familias: number | null;
  fotos_antes_urls: string[] | null;
  estado: string;
  diagnostico: string | null;
  desc_antes: string | null;
  desc_durante: string | null;
  desc_despues: string | null;
  ente_financiamiento?: string | null;
  duracion?: string | null;
  id_nudo: number | null;
  tipo: 'consejo' | 'comuna';
  nudo_titulo?: string;
  nudo_gravedad?: string;
  motivo_rechazo?: string | null;
}

// Función para mapear la gravedad desde la BD
const mapGravedadToTexto = (gravedad: string | null | undefined): string => {
  if (!gravedad) return 'No definida';
  
  switch(gravedad) {
    case 'Alto':
    case 'Crítico':
    case 'Alto/Crítico':
      return 'Alta';
    case 'Medio':
      return 'Media';
    case 'Bajo':
      return 'Baja';
    default:
      const gravedadLower = gravedad.toLowerCase();
      if (gravedadLower === 'alto' || gravedadLower === 'crítico' || gravedadLower === 'alto/crítico') return 'Alta';
      if (gravedadLower === 'medio') return 'Media';
      if (gravedadLower === 'bajo') return 'Baja';
      return gravedad;
  }
};

// Función para limpiar y codificar la ruta del archivo
const sanitizeAndEncodePath = (path: string): string => {
  let decodedPath;
  try {
    decodedPath = decodeURIComponent(path);
  } catch {
    decodedPath = path;
  }
  
  let sanitized = decodedPath.replace(/ /g, '_');
  sanitized = sanitized.replace(/[#?&]/g, '_');
  const encoded = encodeURIComponent(sanitized).replace(/%2F/g, '/');
  
  return encoded;
};

// Función mejorada que determina el bucket según el tipo de proyecto
const getSignedUrl = async (proyecto: ProyectoBase, storedPath: string): Promise<string | null> => {
  if (!storedPath) return null;
  
  // Determinar el bucket según el tipo de proyecto
  const bucket = proyecto.tipo === 'consejo' ? 'proyectos_docs' : 'rendiciones_comuna';
  
  try {
    let relativePath = storedPath;
    
    // Si es una URL pública completa, extraer la ruta relativa
    const publicUrlPattern = new RegExp(`/storage/v1/object/public/${bucket}/`);
    if (publicUrlPattern.test(storedPath)) {
      const parts = storedPath.split(`/storage/v1/object/public/${bucket}/`);
      relativePath = parts[parts.length - 1];
    } 
    // Si es una URL completa de storage
    else if (storedPath.startsWith('http')) {
      const match = storedPath.match(/\/storage\/v1\/object\/(?:public|sign)\/[^/]+\/(.+)$/);
      if (match) {
        relativePath = match[1];
      } else {
        return storedPath;
      }
    }
    
    // Limpiar y codificar la ruta
    const cleanPath = sanitizeAndEncodePath(relativePath);
    
    // Intentar primero con la ruta limpia
    let { data, error } = await supabase.storage
      .from(bucket)
      .createSignedUrl(cleanPath, 60 * 30);
    
    // Si falla, intentar con la ruta original
    if (error) {
      const result = await supabase.storage
        .from(bucket)
        .createSignedUrl(relativePath, 60 * 30);
      
      if (result.error) {
        console.error('Error generando URL firmada:', result.error);
        return null;
      }
      return result.data.signedUrl;
    }
    return data.signedUrl;
  } catch (err) {
    console.error(`Excepción generando URL firmada para ${relativePath}:`, err);
    return null;
  }
};

export const PorAprobar = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [propuestosList, setPropuestosList] = useState<ProyectoBase[]>([]);
  const [enRevisionList, setEnRevisionList] = useState<ProyectoBase[]>([]);
  const [rechazadosList, setRechazadosList] = useState<ProyectoBase[]>([]);
  const [selectedProject, setSelectedProject] = useState<ProyectoBase | null>(null);
  const [proyectoImagenes, setProyectoImagenes] = useState<Record<string, string | null>>({});
  const [activeTab, setActiveTab] = useState<'propuestos' | 'revision' | 'rechazados'>('propuestos');
  const [imageLoading, setImageLoading] = useState<Record<string, boolean>>({});
  const [imageErrors, setImageErrors] = useState<Record<string, boolean>>({});
  
  // Paginación
  const [currentPagePropuestos, setCurrentPagePropuestos] = useState(1);
  const itemsPerPage = 10;
  const totalPagesPropuestos = Math.ceil(propuestosList.length / itemsPerPage);
  const startPropuestos = (currentPagePropuestos - 1) * itemsPerPage;
  const currentPropuestos = propuestosList.slice(startPropuestos, startPropuestos + itemsPerPage);
  
  const [currentPageRevision, setCurrentPageRevision] = useState(1);
  const totalPagesRevision = Math.ceil(enRevisionList.length / itemsPerPage);
  const startRevision = (currentPageRevision - 1) * itemsPerPage;
  const currentRevision = enRevisionList.slice(startRevision, startRevision + itemsPerPage);
  
  const [currentPageRechazados, setCurrentPageRechazados] = useState(1);
  const totalPagesRechazados = Math.ceil(rechazadosList.length / itemsPerPage);
  const startRechazados = (currentPageRechazados - 1) * itemsPerPage;
  const currentRechazados = rechazadosList.slice(startRechazados, startRechazados + itemsPerPage);
  
  // Modal de autorización
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [authProject, setAuthProject] = useState<ProyectoBase | null>(null);
  const [respuesta, setRespuesta] = useState('');
  const [presupuestoAsignado, setPresupuestoAsignado] = useState<number | null>(null);
  
  // Modal de alerta general
  const [modalState, setModalState] = useState({
    isOpen: false,
    title: '',
    message: '',
    type: 'info' as 'info' | 'success' | 'warning' | 'danger',
    showInput: false,
    inputPlaceholder: '',
    onConfirm: null as ((value?: string) => void) | null,
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

  // Función para cargar imagen de un proyecto específico - AHORA PASA EL PROYECTO COMPLETO
  const cargarImagenProyecto = useCallback(async (proyecto: ProyectoBase) => {
    const key = `${proyecto.tipo}-${proyecto.id}`;
    
    // Si ya tenemos la imagen, está cargando o tuvo error, no hacer nada
    if (proyectoImagenes[key] !== undefined || imageLoading[key] || imageErrors[key]) return;
    
    if (!proyecto.fotos_antes_urls || proyecto.fotos_antes_urls.length === 0) {
      setImageErrors(prev => ({ ...prev, [key]: true }));
      return;
    }
    
    setImageLoading(prev => ({ ...prev, [key]: true }));
    
    // Tomar la primera imagen del array - PASAR EL PROYECTO COMPLETO
    const primeraImagen = proyecto.fotos_antes_urls[0];
    const urlFirmada = await getSignedUrl(proyecto, primeraImagen);
    
    if (urlFirmada) {
      setProyectoImagenes(prev => ({ ...prev, [key]: urlFirmada }));
    } else {
      setImageErrors(prev => ({ ...prev, [key]: true }));
    }
    
    setImageLoading(prev => ({ ...prev, [key]: false }));
  }, [proyectoImagenes, imageLoading, imageErrors]);

  // Cargar proyectos
  const cargarProyectos = useCallback(async () => {
    setLoading(true);
    try {
      
      const { data: consejosPropuestos, error: err1 } = await supabase
        .from('proyectos')
        .select('*')
        .eq('estado', 'Propuesto')
        .order('created_at', { ascending: false });
      if (err1) throw err1;
      
      const { data: comunasPropuestos, error: err2 } = await supabase
        .from('proyectos_comuna')
        .select('*')
        .eq('estado', 'Propuesto')
        .order('created_at', { ascending: false });
      if (err2) throw err2;

      const { data: consejosRevision, error: err3 } = await supabase
        .from('proyectos')
        .select('*')
        .eq('estado', 'En Revisión')
        .order('created_at', { ascending: false });
      if (err3) throw err3;
      
      const { data: comunasRevision, error: err4 } = await supabase
        .from('proyectos_comuna')
        .select('*')
        .eq('estado', 'En Revisión')
        .order('created_at', { ascending: false });
      if (err4) throw err4;

      const { data: consejosRechazados, error: err5 } = await supabase
        .from('proyectos')
        .select('*')
        .eq('estado', 'Rechazado')
        .order('created_at', { ascending: false });
      if (err5) throw err5;
      
      const { data: comunasRechazados, error: err6 } = await supabase
        .from('proyectos_comuna')
        .select('*')
        .eq('estado', 'Rechazado')
        .order('created_at', { ascending: false });
      if (err6) throw err6;

      const todosProyectos = [
        ...(consejosPropuestos || []), ...(comunasPropuestos || []),
        ...(consejosRevision || []), ...(comunasRevision || []),
        ...(consejosRechazados || []), ...(comunasRechazados || [])
      ];
      
      const nudoIdsConsejos = [...new Set(todosProyectos
        .filter(p => p.id_nudo !== null && p.id_nudo !== undefined)
        .map(p => p.id_nudo)
      )];
      
      const nudoIdsComunas = [...new Set(todosProyectos
        .filter(p => p.id_nudo_comuna !== null && p.id_nudo_comuna !== undefined)
        .map(p => p.id_nudo_comuna)
      )];
      
      let nudosConsejosMap = new Map();
      if (nudoIdsConsejos.length) {
        const { data: nudosData, error: nudosError } = await supabase
          .from('nudos_criticos')
          .select('id_nudo, titulo, gravedad')
          .in('id_nudo', nudoIdsConsejos);
        if (!nudosError && nudosData) {
          nudosData.forEach(n => nudosConsejosMap.set(n.id_nudo, { 
            titulo: n.titulo, 
            gravedad: n.gravedad 
          }));
        }
      }
      
      let nudosComunasMap = new Map();
      if (nudoIdsComunas.length) {
        const { data: nudosData, error: nudosError } = await supabase
          .from('nudos_criticos_comuna')
          .select('id_nudo_comuna, titulo, gravedad')
          .in('id_nudo_comuna', nudoIdsComunas);
        if (!nudosError && nudosData) {
          nudosData.forEach(n => nudosComunasMap.set(n.id_nudo_comuna, { 
            titulo: n.titulo, 
            gravedad: n.gravedad 
          }));
        }
      }

      const formatear = (p: any, tipo: 'consejo' | 'comuna') => {
        let nudoInfo = null;
        if (tipo === 'consejo') {
          nudoInfo = nudosConsejosMap.get(p.id_nudo);
        } else {
          nudoInfo = nudosComunasMap.get(p.id_nudo_comuna);
        }
        
        return {
          id: p.id_proyecto || p.id_proyecto_comuna,
          nombre: p.nombre,
          presupuesto: p.presupuesto,
          beneficiarios_familias: p.beneficiarios_familias,
          fotos_antes_urls: p.fotos_antes_urls,
          estado: p.estado,
          diagnostico: p.diagnostico,
          desc_antes: p.desc_antes,
          desc_durante: p.desc_durante,
          desc_despues: p.desc_despues,
          ente_financiamiento: p.ente_financiamiento,
          duracion: p.duracion,
          id_nudo: p.id_nudo || p.id_nudo_comuna,
          tipo,
          nudo_titulo: nudoInfo?.titulo || null,
          nudo_gravedad: nudoInfo?.gravedad || null,
          motivo_rechazo: p.motivo_rechazo,
        };
      };

      const propuestosUnificados: ProyectoBase[] = [
        ...(consejosPropuestos || []).map(p => formatear(p, 'consejo')),
        ...(comunasPropuestos || []).map(p => formatear(p, 'comuna')),
      ];
      const revisionUnificados: ProyectoBase[] = [
        ...(consejosRevision || []).map(p => formatear(p, 'consejo')),
        ...(comunasRevision || []).map(p => formatear(p, 'comuna')),
      ];
      const rechazadosUnificados: ProyectoBase[] = [
        ...(consejosRechazados || []).map(p => formatear(p, 'consejo')),
        ...(comunasRechazados || []).map(p => formatear(p, 'comuna')),
      ];

      setPropuestosList(propuestosUnificados);
      setEnRevisionList(revisionUnificados);
      setRechazadosList(rechazadosUnificados);

      // Limpiar estados de imágenes
      setProyectoImagenes({});
      setImageLoading({});
      setImageErrors({});
      
    } catch (error) {
      console.error(error);
      showAlert('Error', 'No se pudieron cargar los proyectos', 'danger');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    cargarProyectos();
  }, [cargarProyectos]);

  // Cargar imágenes de los proyectos cuando se muestran
  useEffect(() => {
    if (!loading && propuestosList.length > 0 && activeTab === 'propuestos') {
      currentPropuestos.forEach(proyecto => {
        cargarImagenProyecto(proyecto);
      });
    }
  }, [loading, propuestosList, currentPropuestos, activeTab, cargarImagenProyecto]);

  useEffect(() => {
    if (!loading && enRevisionList.length > 0 && activeTab === 'revision') {
      currentRevision.forEach(proyecto => {
        cargarImagenProyecto(proyecto);
      });
    }
  }, [loading, enRevisionList, currentRevision, activeTab, cargarImagenProyecto]);

  useEffect(() => {
    if (!loading && rechazadosList.length > 0 && activeTab === 'rechazados') {
      currentRechazados.forEach(proyecto => {
        cargarImagenProyecto(proyecto);
      });
    }
  }, [loading, rechazadosList, currentRechazados, activeTab, cargarImagenProyecto]);

  useEffect(() => {
    if (selectedProject) {
      cargarImagenProyecto(selectedProject);
    }
  }, [selectedProject, cargarImagenProyecto]);

  const handleAutorizar = (proyecto: ProyectoBase) => {
    setAuthProject(proyecto);
    setRespuesta('');
    setPresupuestoAsignado(null);
    setShowAuthModal(true);
  };

  const confirmarAutorizacion = async () => {
    if (!authProject) return;
    if (!presupuestoAsignado || presupuestoAsignado <= 0) {
      showAlert('Presupuesto requerido', 'Debe asignar un presupuesto válido (mayor a 0)', 'warning');
      return;
    }
    if (!respuesta.trim()) {
      showAlert('Respuesta requerida', 'Debe escribir una respuesta para el proyecto', 'warning');
      return;
    }
    try {
      const tabla = authProject.tipo === 'consejo' ? 'proyectos' : 'proyectos_comuna';
      const idField = authProject.tipo === 'consejo' ? 'id_proyecto' : 'id_proyecto_comuna';
      const updateData = {
        estado: 'Aprobado',
        respuesta: respuesta.trim(),
        presupuesto_asignado: presupuestoAsignado,
        fecha_respuesta: new Date().toISOString().split('T')[0],
      };
      const { error } = await supabase
        .from(tabla)
        .update(updateData)
        .eq(idField, authProject.id);
      if (error) throw error;
      showAlert('Éxito', 'Proyecto aprobado correctamente', 'success');
      setShowAuthModal(false);
      setAuthProject(null);
      await cargarProyectos();
      setSelectedProject(null);
    } catch (error) {
      console.error(error);
      showAlert('Error', 'No se pudo aprobar el proyecto', 'danger');
    }
  };

  const handleEnRevision = async (proyecto: ProyectoBase) => {
    try {
      const tabla = proyecto.tipo === 'consejo' ? 'proyectos' : 'proyectos_comuna';
      const idField = proyecto.tipo === 'consejo' ? 'id_proyecto' : 'id_proyecto_comuna';
      const { error } = await supabase
        .from(tabla)
        .update({ estado: 'En Revisión' })
        .eq(idField, proyecto.id);
      if (error) throw error;
      showAlert('Éxito', 'Proyecto enviado a revisión', 'success');
      await cargarProyectos();
      setSelectedProject(null);
    } catch (error) {
      console.error(error);
      showAlert('Error', 'No se pudo cambiar el estado', 'danger');
    }
  };

  const handleRechazar = (proyecto: ProyectoBase) => {
    setModalState({
      isOpen: true,
      title: 'Rechazar Proyecto',
      message: 'Indique el motivo del rechazo:',
      type: 'warning',
      showInput: true,
      inputPlaceholder: 'Ej. Presupuesto insuficiente, documentación incompleta...',
      onConfirm: async (motivo) => {
        if (motivo && motivo.trim()) {
          const tabla = proyecto.tipo === 'consejo' ? 'proyectos' : 'proyectos_comuna';
          const idField = proyecto.tipo === 'consejo' ? 'id_proyecto' : 'id_proyecto_comuna';
          try {
            const { error } = await supabase
              .from(tabla)
              .update({ estado: 'Rechazado', motivo_rechazo: motivo.trim() })
              .eq(idField, proyecto.id);
            if (error) throw error;
            showAlert('Rechazado', 'Proyecto rechazado correctamente', 'success');
            await cargarProyectos();
            setSelectedProject(null);
          } catch (err) {
            console.error(err);
            showAlert('Error', 'No se pudo rechazar el proyecto', 'danger');
          }
        } else {
          showAlert('Motivo requerido', 'Debe escribir un motivo para rechazar', 'warning');
        }
        closeModal();
      },
    });
  };

  const totalPropuestos = propuestosList.length;
  const totalRevision = enRevisionList.length;
  const totalRechazados = rechazadosList.length;

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[400px]">
        <Loader2 className="animate-spin text-brand-primary h-8 w-8" />
      </div>
    );
  }

  const renderCard = (proy: ProyectoBase, isRejected: boolean) => {
    const prioridad = mapGravedadToTexto(proy.nudo_gravedad);
    const key = `${proy.tipo}-${proy.id}`;
    const imagenUrl = proyectoImagenes[key];
    const isLoadingImage = imageLoading[key];
    const hasError = imageErrors[key];
    let cardBg = 'bg-white';
    if (isRejected) {
      cardBg = 'bg-red-50 border-red-200';
    } else if (proy.estado === 'En Revisión') {
      cardBg = 'bg-amber-50 border-amber-200';
    }
    
    const getPriorityColor = (prioridad: string) => {
      switch(prioridad) {
        case 'Alta': return "bg-rose-50 text-rose-600";
        case 'Media': return "bg-amber-50 text-amber-600";
        case 'Baja': return "bg-emerald-50 text-emerald-600";
        default: return "bg-slate-100 text-slate-500";
      }
    };
    
    return (
      <motion.div
        key={key}
        initial={{ opacity: 0, x: -10 }}
        animate={{ opacity: 1, x: 0 }}
        onClick={() => setSelectedProject(proy)}
        className={cn(
          "p-3 rounded-xl border cursor-pointer transition-all hover:shadow-md",
          cardBg,
          selectedProject?.id === proy.id && selectedProject?.tipo === proy.tipo
            ? "border-brand-primary shadow-lg ring-2 ring-brand-primary/20"
            : "border-slate-100 hover:border-slate-300"
        )}
      >
        <div className="flex gap-3">
          <div className="w-16 h-16 rounded-lg overflow-hidden shrink-0 bg-slate-100 flex items-center justify-center">
            {isLoadingImage ? (
              <Loader2 className="h-6 w-6 text-slate-300 animate-spin" />
            ) : hasError ? (
              <div className="flex flex-col items-center justify-center">
                <Construction className="h-6 w-6 text-slate-300" />
                <span className="text-[8px] text-slate-400 mt-1">Sin imagen</span>
              </div>
            ) : imagenUrl ? (
              <img 
                src={imagenUrl} 
                alt={proy.nombre} 
                className="w-full h-full object-cover"
                onError={() => {
                  setImageErrors(prev => ({ ...prev, [key]: true }));
                  setProyectoImagenes(prev => ({ ...prev, [key]: null }));
                }}
              />
            ) : (
              <Construction className="h-6 w-6 text-slate-300" />
            )}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex justify-between items-start gap-1">
              <h4 className="text-xs font-black text-slate-800 uppercase tracking-tight line-clamp-2">{proy.nombre}</h4>
              <span className={cn(
                "px-1.5 py-0.5 rounded-full text-[7px] font-black uppercase whitespace-nowrap",
                getPriorityColor(prioridad)
              )}>
                {prioridad}
              </span>
            </div>
            <div className="flex items-center gap-2 mt-1 text-[9px] text-slate-500">
              <Users size={10} />
              <span>{proy.beneficiarios_familias || 0} familias</span>
              <span className="text-slate-300">|</span>
              <span className="font-black text-brand-primary">Bs. {(proy.presupuesto || 0).toLocaleString()}</span>
            </div>
            {proy.nudo_titulo && (
              <div className="mt-1 text-[8px] text-slate-400 truncate">
                {proy.nudo_titulo}
              </div>
            )}
            <div className="mt-1">
              <span className={cn(
                "text-[7px] font-black px-1.5 py-0.5 rounded-full",
                proy.tipo === 'consejo' ? "bg-blue-100 text-blue-600" : "bg-purple-100 text-purple-600"
              )}>
                {proy.tipo === 'consejo' ? 'Consejo Comunal' : 'Comuna'}
              </span>
            </div>
          </div>
        </div>
      </motion.div>
    );
  };

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="space-y-8"
    >
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h2 className="text-xl font-black text-slate-900 uppercase tracking-tighter italic">Gestión de Proyectos</h2>
          <p className="text-[9px] text-slate-500 font-bold uppercase tracking-widest mt-1">Autorización, revisión y seguimiento de rechazos</p>
        </div>
        <div className="flex gap-4">
          <div className="bg-white px-4 py-2 rounded-xl border border-slate-100 shadow-sm text-center">
            <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Propuestos</p>
            <p className="text-lg font-black text-blue-500 italic">{totalPropuestos}</p>
          </div>
          <div className="bg-white px-4 py-2 rounded-xl border border-slate-100 shadow-sm text-center">
            <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest">En Revisión</p>
            <p className="text-lg font-black text-amber-500 italic">{totalRevision}</p>
          </div>
          <div className="bg-white px-4 py-2 rounded-xl border border-slate-100 shadow-sm text-center">
            <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Rechazados</p>
            <p className="text-lg font-black text-rose-500 italic">{totalRechazados}</p>
          </div>
        </div>
      </div>

      <div className="flex gap-2 border-b border-slate-100 pb-2">
        <button
          onClick={() => { setActiveTab('propuestos'); setSelectedProject(null); }}
          className={cn(
            "px-5 py-2 rounded-t-xl text-[10px] font-black uppercase tracking-widest transition-all",
            activeTab === 'propuestos' ? "bg-brand-primary text-white shadow-md" : "bg-white text-slate-500 hover:text-brand-primary"
          )}
        >
          Propuestos ({totalPropuestos})
        </button>
        <button
          onClick={() => { setActiveTab('revision'); setSelectedProject(null); }}
          className={cn(
            "px-5 py-2 rounded-t-xl text-[10px] font-black uppercase tracking-widest transition-all",
            activeTab === 'revision' ? "bg-brand-primary text-white shadow-md" : "bg-white text-slate-500 hover:text-brand-primary"
          )}
        >
          En Revisión ({totalRevision})
        </button>
        <button
          onClick={() => { setActiveTab('rechazados'); setSelectedProject(null); }}
          className={cn(
            "px-5 py-2 rounded-t-xl text-[10px] font-black uppercase tracking-widest transition-all",
            activeTab === 'rechazados' ? "bg-brand-primary text-white shadow-md" : "bg-white text-slate-500 hover:text-brand-primary"
          )}
        >
          Rechazados ({totalRechazados})
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1 space-y-3">
          {activeTab === 'propuestos' && (
            <>
              {currentPropuestos.length === 0 ? (
                <div className="bg-white p-8 rounded-3xl text-center border border-slate-100">
                  <AlertCircle className="mx-auto h-8 w-8 text-slate-300 mb-2" />
                  <p className="text-xs text-slate-500">No hay proyectos propuestos pendientes</p>
                </div>
              ) : (
                currentPropuestos.map(proy => renderCard(proy, false))
              )}
              {totalPagesPropuestos > 1 && (
                <div className="flex justify-between items-center pt-4 border-t border-slate-100">
                  <span className="text-[8px] text-slate-500">Página {currentPagePropuestos} de {totalPagesPropuestos}</span>
                  <div className="flex gap-2">
                    <button onClick={() => setCurrentPagePropuestos(p => Math.max(1, p-1))} disabled={currentPagePropuestos === 1} className="px-2 py-1 rounded-lg bg-white border border-slate-200 text-[8px] font-black disabled:opacity-50 hover:bg-slate-50">Anterior</button>
                    <button onClick={() => setCurrentPagePropuestos(p => Math.min(totalPagesPropuestos, p+1))} disabled={currentPagePropuestos === totalPagesPropuestos} className="px-2 py-1 rounded-lg bg-white border border-slate-200 text-[8px] font-black disabled:opacity-50 hover:bg-slate-50">Siguiente</button>
                  </div>
                </div>
              )}
            </>
          )}
          {activeTab === 'revision' && (
            <>
              {currentRevision.length === 0 ? (
                <div className="bg-white p-8 rounded-3xl text-center border border-slate-100">
                  <AlertCircle className="mx-auto h-8 w-8 text-slate-300 mb-2" />
                  <p className="text-xs text-slate-500">No hay proyectos en revisión</p>
                </div>
              ) : (
                currentRevision.map(proy => renderCard(proy, false))
              )}
              {totalPagesRevision > 1 && (
                <div className="flex justify-between items-center pt-4 border-t border-slate-100">
                  <span className="text-[8px] text-slate-500">Página {currentPageRevision} de {totalPagesRevision}</span>
                  <div className="flex gap-2">
                    <button onClick={() => setCurrentPageRevision(p => Math.max(1, p-1))} disabled={currentPageRevision === 1} className="px-2 py-1 rounded-lg bg-white border border-slate-200 text-[8px] font-black disabled:opacity-50 hover:bg-slate-50">Anterior</button>
                    <button onClick={() => setCurrentPageRevision(p => Math.min(totalPagesRevision, p+1))} disabled={currentPageRevision === totalPagesRevision} className="px-2 py-1 rounded-lg bg-white border border-slate-200 text-[8px] font-black disabled:opacity-50 hover:bg-slate-50">Siguiente</button>
                  </div>
                </div>
              )}
            </>
          )}
          {activeTab === 'rechazados' && (
            <>
              {currentRechazados.length === 0 ? (
                <div className="bg-white p-8 rounded-3xl text-center border border-slate-100">
                  <AlertCircle className="mx-auto h-8 w-8 text-slate-300 mb-2" />
                  <p className="text-xs text-slate-500">No hay proyectos rechazados</p>
                </div>
              ) : (
                currentRechazados.map(proy => renderCard(proy, true))
              )}
              {totalPagesRechazados > 1 && (
                <div className="flex justify-between items-center pt-4 border-t border-slate-100">
                  <span className="text-[8px] text-slate-500">Página {currentPageRechazados} de {totalPagesRechazados}</span>
                  <div className="flex gap-2">
                    <button onClick={() => setCurrentPageRechazados(p => Math.max(1, p-1))} disabled={currentPageRechazados === 1} className="px-2 py-1 rounded-lg bg-white border border-slate-200 text-[8px] font-black disabled:opacity-50 hover:bg-slate-50">Anterior</button>
                    <button onClick={() => setCurrentPageRechazados(p => Math.min(totalPagesRechazados, p+1))} disabled={currentPageRechazados === totalPagesRechazados} className="px-2 py-1 rounded-lg bg-white border border-slate-200 text-[8px] font-black disabled:opacity-50 hover:bg-slate-50">Siguiente</button>
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        <div className="lg:col-span-2">
          <AnimatePresence mode="wait">
            {selectedProject ? (
              <motion.div
                key={`${selectedProject.tipo}-${selectedProject.id}`}
                initial={{ opacity: 0, scale: 0.96 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.96 }}
                className="bg-white rounded-3xl p-6 shadow-xl border border-slate-100"
              >
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className="text-lg font-black uppercase tracking-tighter leading-tight text-slate-900">{selectedProject.nombre}</h3>
                    <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mt-1">
                      Prioridad: {mapGravedadToTexto(selectedProject.nudo_gravedad)}
                    </p>
                  </div>
                  <ShieldAlert size={24} className="text-brand-primary" />
                </div>

                <div className="relative h-64 rounded-2xl overflow-hidden mb-5 border border-slate-200 bg-slate-100">
                  {(() => {
                    const key = `${selectedProject.tipo}-${selectedProject.id}`;
                    const isLoading = imageLoading[key];
                    const hasError = imageErrors[key];
                    const imagenUrl = proyectoImagenes[key];
                    
                    if (isLoading) {
                      return (
                        <div className="w-full h-full flex items-center justify-center">
                          <Loader2 className="h-8 w-8 text-brand-primary animate-spin" />
                        </div>
                      );
                    }
                    
                    if (hasError || !imagenUrl) {
                      return (
                        <div className="w-full h-full flex flex-col items-center justify-center text-slate-400">
                          <Construction size={48} className="mb-2" />
                          <span className="text-xs">Imagen no disponible</span>
                        </div>
                      );
                    }
                    
                    return (
                      <img 
                        src={imagenUrl} 
                        className="w-full h-full object-cover" 
                        alt={selectedProject.nombre}
                        onError={() => {
                          setImageErrors(prev => ({ ...prev, [key]: true }));
                          setProyectoImagenes(prev => ({ ...prev, [key]: null }));
                        }}
                      />
                    );
                  })()}
                </div>

                <div className="grid grid-cols-2 gap-3 mb-4">
                  <div className="bg-slate-50 rounded-xl p-3 border border-slate-100">
                    <p className="text-[8px] font-black uppercase text-slate-400 tracking-wider">Familias beneficiarias</p>
                    <p className="text-base font-black text-slate-800">{selectedProject.beneficiarios_familias || 0}</p>
                  </div>
                  <div className="bg-slate-50 rounded-xl p-3 border border-slate-100">
                    <p className="text-[8px] font-black uppercase text-slate-400 tracking-wider">Presupuesto solicitado</p>
                    <p className="text-base font-black text-brand-primary">Bs. {(selectedProject.presupuesto || 0).toLocaleString()}</p>
                  </div>
                </div>

                {selectedProject.nudo_titulo && (
                  <div className="mb-4 p-3 bg-slate-50 rounded-xl border border-slate-100">
                    <p className="text-[8px] font-black uppercase text-slate-400 tracking-wider">Nudo crítico asociado</p>
                    <p className="text-xs font-bold text-slate-800">{selectedProject.nudo_titulo}</p>
                    <p className="text-[9px] text-slate-500">Gravedad: {mapGravedadToTexto(selectedProject.nudo_gravedad)}</p>
                  </div>
                )}

                {selectedProject.diagnostico && (
                  <div className="mb-4 p-3 bg-slate-50 rounded-xl border border-slate-100">
                    <p className="text-[8px] font-black uppercase text-slate-400 tracking-wider">Diagnóstico / Justificación</p>
                    <p className="text-xs text-slate-700">{selectedProject.diagnostico}</p>
                  </div>
                )}

                {selectedProject.desc_antes && (
                  <div className="mb-3">
                    <p className="text-[8px] font-black uppercase text-slate-400 tracking-wider">Situación actual</p>
                    <p className="text-[10px] text-slate-600">{selectedProject.desc_antes}</p>
                  </div>
                )}
                {selectedProject.desc_despues && (
                  <div className="mb-4">
                    <p className="text-[8px] font-black uppercase text-slate-400 tracking-wider">Beneficio esperado</p>
                    <p className="text-[10px] text-slate-600">{selectedProject.desc_despues}</p>
                  </div>
                )}

                <div className="grid grid-cols-2 gap-3 mb-4 text-[10px]">
                  {selectedProject.ente_financiamiento && (
                    <div className="p-2 bg-slate-50 rounded-lg">
                      <p className="font-black uppercase text-slate-400">Ente financiador</p>
                      <p className="text-slate-700">{selectedProject.ente_financiamiento}</p>
                    </div>
                  )}
                  {selectedProject.duracion && (
                    <div className="p-2 bg-slate-50 rounded-lg">
                      <p className="font-black uppercase text-slate-400">Duración estimada</p>
                      <p className="text-slate-700">{selectedProject.duracion}</p>
                    </div>
                  )}
                </div>

                {selectedProject.estado === 'Rechazado' && selectedProject.motivo_rechazo && (
                  <div className="mb-4 p-3 bg-red-50 rounded-xl border border-red-200">
                    <p className="text-[8px] font-black uppercase text-rose-600 tracking-wider">Motivo de rechazo</p>
                    <p className="text-xs text-rose-800">{selectedProject.motivo_rechazo}</p>
                  </div>
                )}

                {selectedProject.estado !== 'Rechazado' && (
                  <div className="flex gap-3 mt-6">
                    <button
                      onClick={() => handleAutorizar(selectedProject)}
                      className="flex-1 py-3 bg-brand-primary text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-brand-primary/80 transition-all flex items-center justify-center gap-2"
                    >
                      <CheckCircle2 size={14} /> Autorizar
                    </button>
                    {selectedProject.estado !== 'En Revisión' && (
                      <button
                        onClick={() => handleEnRevision(selectedProject)}
                        className="flex-1 py-3 bg-amber-500 text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-amber-600 transition-all flex items-center justify-center gap-2"
                      >
                        <Clock size={14} /> En Revisión
                      </button>
                    )}
                    <button
                      onClick={() => handleRechazar(selectedProject)}
                      className="flex-1 py-3 bg-rose-600 text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-rose-700 transition-all flex items-center justify-center gap-2"
                    >
                      <XCircle size={14} /> Rechazar
                    </button>
                  </div>
                )}
              </motion.div>
            ) : (
              <div className="bg-slate-50 rounded-3xl border-2 border-dashed border-slate-200 p-12 flex flex-col items-center justify-center text-center h-full min-h-[400px]">
                <Eye size={48} className="text-slate-300 mb-4" />
                <h3 className="text-base font-black text-slate-500 uppercase italic mb-2">Inspección de obra</h3>
                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest max-w-xs">
                  Seleccione un proyecto de la bandeja para desplegar el expediente técnico, la comparativa de impacto social y el aval de las direcciones.
                </p>
              </div>
            )}
          </AnimatePresence>
        </div>
      </div>

      <AnimatePresence>
        {showAuthModal && authProject && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={() => setShowAuthModal(false)} />
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="relative w-full max-w-md bg-white rounded-2xl shadow-2xl overflow-hidden"
            >
              <div className="p-5 border-b bg-brand-primary text-white">
                <h3 className="text-lg font-black uppercase tracking-tighter">Autorizar Proyecto</h3>
                <p className="text-[10px] text-white/70 mt-1">{authProject.nombre}</p>
              </div>
              <div className="p-5 space-y-4">
                <div>
                  <label className="text-[10px] font-black uppercase text-slate-500 block mb-1">Respuesta *</label>
                  <textarea
                    rows={3}
                    value={respuesta}
                    onChange={(e) => setRespuesta(e.target.value)}
                    className="w-full p-2 rounded-xl bg-slate-50 border border-slate-200 text-sm font-medium outline-none focus:ring-2 focus:ring-brand-primary/20"
                    placeholder="Ej: Proyecto aprobado con financiamiento del 80%..."
                  />
                </div>
                <div>
                  <label className="text-[10px] font-black uppercase text-slate-500 block mb-1">Presupuesto asignado (Bs.) *</label>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={presupuestoAsignado ?? ''}
                    onChange={(e) => setPresupuestoAsignado(e.target.value ? parseFloat(e.target.value) : null)}
                    className="w-full p-2 rounded-xl bg-slate-50 border border-slate-200 text-sm font-bold outline-none focus:ring-2 focus:ring-brand-primary/20"
                    placeholder="Ej: 500000"
                  />
                </div>
              </div>
              <div className="p-4 bg-slate-50 border-t flex justify-end gap-3">
                <button onClick={() => setShowAuthModal(false)} className="px-4 py-2 rounded-lg bg-white border border-slate-200 text-slate-600 text-[10px] font-black uppercase">Cancelar</button>
                <button onClick={confirmarAutorizacion} className="px-5 py-2 rounded-lg bg-brand-primary text-white text-[10px] font-black uppercase shadow-md hover:bg-brand-primary/90">Confirmar Autorización</button>
              </div>
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
        confirmText="Confirmar"
        onConfirm={modalState.onConfirm || (() => closeModal())}
      />
    </motion.div>
  );
};