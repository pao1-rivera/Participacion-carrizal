"use client";

import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Save, AlertCircle, Plus, Trash2, MapPin, Target, Zap,
  X, PlusCircle, Loader2, Eye, Edit, Upload, FileCheck
} from 'lucide-react';
import { supabase } from '@/app/lib/supabaseClient';
import { useAuth } from '@/context/AuthContext';
import { AlertModal } from '@/app/components/AlertModal';

// ==================== TIPOS ====================
interface NudoComuna {
  id_nudo_comuna: number;
  titulo: string;
  descripcion: string;
  categoria_7t: string;
  gravedad: string;
  familias_afectadas: number | null;
  personas_afectadas: number | null;
  acta_url?: string | null;
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

interface ConsejoAca {
  id_aca: number;
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
}

// ========== FUNCIÓN PARA OBTENER URL FIRMADA ==========
const getSignedUrlFromPath = async (path: string | null, bucket: string = 'documentos_comuna'): Promise<string | null> => {
  if (!path) return null;
  let cleanPath = path;
  if (path.includes('/storage/v1/object/public/')) {
    const match = path.match(/\/storage\/v1\/object\/public\/[^/]+\/(.+)$/);
    if (match) cleanPath = match[1];
  }
  cleanPath = cleanPath.replace(/^\/+/, '');
  const { data, error } = await supabase.storage
    .from(bucket)
    .createSignedUrl(cleanPath, 3600);
  if (error) {
    console.error('Error generando URL firmada:', error);
    return null;
  }
  return data.signedUrl;
};

// ==================== COMPONENTE PRINCIPAL ====================
export const AgendaC = () => {
  const { user } = useAuth();
  const [comunaId, setComunaId] = useState<number | null>(null);
  const [noComuna, setNoComuna] = useState(false);

  // --- Estado para ACA Comunal ---
  const [solucionesComuna, setSolucionesComuna] = useState<SolucionComuna[]>([]);
  const [nudosDisponiblesComuna, setNudosDisponiblesComuna] = useState<NudoComuna[]>([]);
  const [loadingComuna, setLoadingComuna] = useState(true);
  const [isModalComunaOpen, setIsModalComunaOpen] = useState(false);
  const [savingComuna, setSavingComuna] = useState(false);
  const [selectedSolucionComuna, setSelectedSolucionComuna] = useState<SolucionComuna | null>(null);
  const [editModeComuna, setEditModeComuna] = useState(false);
  const [editingIdComuna, setEditingIdComuna] = useState<number | null>(null);
  const [descripcionLength, setDescripcionLength] = useState(0);
  const [actaFile, setActaFile] = useState<File | null>(null);
  const actaInputRef = useRef<HTMLInputElement>(null);

  // --- Estado para ACA de Consejos ---
  const [consejos, setConsejos] = useState<{ id_consejo: number; nombre_consejo: string }[]>([]);
  const [selectedConsejoId, setSelectedConsejoId] = useState<number | null>(null);
  const [solucionesConsejo, setSolucionesConsejo] = useState<ConsejoAca[]>([]);
  const [loadingConsejo, setLoadingConsejo] = useState(false);

  // --- Estado del formulario (comuna) ---
  const [formData, setFormData] = useState({
    tipo: 'nuevo' as 'nuevo' | 'existente',
    id_nudo: '',
    area_trabajo: '',
    titulo_nudo: '',
    descripcion_nudo: '',
    solucion_propuesta: '',
    nombre_responsable: '',
    apellido_responsable: '',
    cedula_tipo: 'V',
    cedula_numero: '',
    direccion_exacta: '',
    fortaleza: '',
    transformacion_7t: '',
    familias_afectadas: 0,
    personas_afectadas: 0,
    gravedad: 'Bajo' as 'Bajo' | 'Medio' | 'Alto/Crítico'
  });

  const transformaciones7T = [
    "T1: Económica (Producción)",
    "T2: Servicios Públicos",
    "T3: Seguridad y Paz",
    "T4: Social",
    "T5: Participación Política",
    "T6: Ecología",
    "T7: Geopolítica"
  ];

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
    if (isModalComunaOpen || selectedSolucionComuna || modalState.isOpen) {
      document.body.classList.add('modal-open');
    } else {
      document.body.classList.remove('modal-open');
    }
    return () => document.body.classList.remove('modal-open');
  }, [isModalComunaOpen, selectedSolucionComuna, modalState.isOpen]);

  // ========== UTILIDADES ==========
  const isResponsableComplete = () => {
    const nombre = formData.nombre_responsable.trim();
    const apellido = formData.apellido_responsable.trim();
    const cedulaNum = formData.cedula_numero.trim();
    return nombre && apellido && cedulaNum && /^\d{7,8}$/.test(cedulaNum);
  };

  const getCedulaCompleta = () => `${formData.cedula_tipo}-${formData.cedula_numero}`;

  // ========== OBTENER ID_COMUNA ==========
  useEffect(() => {
    const fetchComuna = async () => {
      if (!user?.id) return;
      const { data, error } = await supabase
        .from('datos_comuna')
        .select('id_comuna')
        .or(`id_usuario.eq.${user.id},id_usuario_auxiliar.eq.${user.id}`)
        .maybeSingle();
      if (error) console.error('Error cargando comuna:', error);
      else if (data) setComunaId(data.id_comuna);
      else {
        setNoComuna(true);
        setLoadingComuna(false);
      }
    };
    fetchComuna();
  }, [user]);

  // ========== CARGAR ACA COMUNAL ==========
  useEffect(() => {
    if (!comunaId) return;
    const fetchDataComuna = async () => {
      setLoadingComuna(true);
      const { data: acaData, error: acaError } = await supabase
        .from('aca_comuna')
        .select(`
          *,
          nudo:nudos_criticos_comuna (
            titulo,
            categoria_7t,
            descripcion
          )
        `)
        .eq('id_comuna', comunaId);
      if (acaError) console.error('Error cargando ACA comuna:', acaError);
      else {
        const solucionesFormateadas = (acaData || []).map((item: any) => ({
          ...item,
          nudo_titulo: item.nudo?.titulo,
          nudo_categoria: item.nudo?.categoria_7t,
          nudo_descripcion: item.nudo?.descripcion
        }));
        setSolucionesComuna(solucionesFormateadas);
      }

      const { data: nudosData, error: nudosError } = await supabase
        .from('nudos_criticos_comuna')
        .select('id_nudo_comuna, titulo, categoria_7t, descripcion, gravedad, familias_afectadas, personas_afectadas')
        .eq('id_comuna', comunaId);
      if (nudosError) console.error('Error cargando nudos comuna:', nudosError);
      else setNudosDisponiblesComuna(nudosData || []);

      setLoadingComuna(false);
    };
    fetchDataComuna();
  }, [comunaId]);

  // ========== CARGAR CONSEJOS Y ACA DE CONSEJOS ==========
  useEffect(() => {
    if (!comunaId) return;
    const fetchConsejos = async () => {
      const { data: sectores } = await supabase
        .from('sectores')
        .select('id_sector')
        .eq('id_datos_comuna', comunaId)
        .eq('activo', true);
      if (!sectores || sectores.length === 0) {
        setConsejos([]);
        return;
      }
      const sectorIds = sectores.map(s => s.id_sector);
      const { data: consejosData } = await supabase
        .from('datos_consejo_comunal')
        .select('id_consejo, nombre_consejo')
        .in('id_sector', sectorIds);
      setConsejos(consejosData || []);
    };
    fetchConsejos();
  }, [comunaId]);

  useEffect(() => {
    if (!selectedConsejoId) {
      setSolucionesConsejo([]);
      return;
    }
    const fetchSolucionesConsejo = async () => {
      setLoadingConsejo(true);
      const { data, error } = await supabase
        .from('aca')
        .select(`
          id_aca,
          area_trabajo,
          solucion_propuesta,
          nombre_responsable,
          apellido_responsable,
          cedula_responsable,
          direccion_exacta,
          fortaleza,
          transformacion_7t,
          nudos_criticos (
            titulo,
            categoria_7t
          )
        `)
        .eq('id_consejo', selectedConsejoId);
      if (error) {
        console.error('Error cargando ACA consejo:', error.message);
      } else {
        const mapped = (data || []).map((item: any) => {
          const nudoData = Array.isArray(item.nudos_criticos) 
            ? item.nudos_criticos[0] 
            : item.nudos_criticos;
          return {
            id_aca: item.id_aca,
            area_trabajo: item.area_trabajo,
            solucion_propuesta: item.solucion_propuesta,
            nombre_responsable: item.nombre_responsable,
            apellido_responsable: item.apellido_responsable,
            cedula_responsable: item.cedula_responsable,
            direccion_exacta: item.direccion_exacta,
            fortaleza: item.fortaleza,
            transformacion_7t: item.transformacion_7t,
            nudo_titulo: nudoData?.titulo || 'Sin nudo crítico asociado',
            nudo_categoria: nudoData?.categoria_7t || item.transformacion_7t
          };
        });
        setSolucionesConsejo(mapped);
      }
      setLoadingConsejo(false);
    };
    fetchSolucionesConsejo();
  }, [selectedConsejoId]);

  // ========== FUNCIONES PARA ACA COMUNAL ==========
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (name === 'descripcion_nudo') setDescripcionLength(value.length);
  };

  const resetFormComuna = () => {
    setFormData({
      tipo: 'nuevo',
      id_nudo: '',
      area_trabajo: '',
      titulo_nudo: '',
      descripcion_nudo: '',
      solucion_propuesta: '',
      nombre_responsable: '',
      apellido_responsable: '',
      cedula_tipo: 'V',
      cedula_numero: '',
      direccion_exacta: '',
      fortaleza: '',
      transformacion_7t: '',
      familias_afectadas: 0,
      personas_afectadas: 0,
      gravedad: 'Bajo'
    });
    setActaFile(null);
    setDescripcionLength(0);
    setEditModeComuna(false);
    setEditingIdComuna(null);
  };

  const handleEditComuna = (solucion: SolucionComuna) => {
    setEditModeComuna(true);
    setEditingIdComuna(solucion.id_aca_comuna);
    setFormData({
      tipo: 'existente',
      id_nudo: solucion.id_nudo_comuna.toString(),
      area_trabajo: solucion.area_trabajo,
      titulo_nudo: '',
      descripcion_nudo: '',
      solucion_propuesta: solucion.solucion_propuesta,
      nombre_responsable: solucion.nombre_responsable || '',
      apellido_responsable: solucion.apellido_responsable || '',
      cedula_tipo: solucion.cedula_responsable ? solucion.cedula_responsable.split('-')[0] : 'V',
      cedula_numero: solucion.cedula_responsable ? solucion.cedula_responsable.split('-')[1] || '' : '',
      direccion_exacta: solucion.direccion_exacta || '',
      fortaleza: solucion.fortaleza || '',
      transformacion_7t: solucion.transformacion_7t,
      familias_afectadas: 0,
      personas_afectadas: 0,
      gravedad: 'Bajo'
    });
    setIsModalComunaOpen(true);
  };

  const handleDeleteComuna = async (id_aca_comuna: number) => {
    showConfirm(
      'Confirmar eliminación',
      '¿Eliminar esta solución ACA? No se eliminará el nudo asociado.',
      async () => {
        const { error } = await supabase
          .from('aca_comuna')
          .delete()
          .eq('id_aca_comuna', id_aca_comuna);
        if (error) {
          console.error('Error eliminando:', error);
          showAlert('Error', 'No se pudo eliminar la solución', 'danger');
        } else {
          setSolucionesComuna(prev => prev.filter(s => s.id_aca_comuna !== id_aca_comuna));
          showAlert('Eliminado', 'Solución eliminada correctamente', 'success');
        }
      }
    );
  };

  const uploadActa = async (file: File, nudoId: number): Promise<string> => {
    if (!user?.id || !comunaId) throw new Error('Faltan datos');
    const fileExt = file.name.split('.').pop();
    const fileName = `acta_${Date.now()}_${Math.random().toString(36).substring(7)}.${fileExt}`;
    const filePath = `${comunaId}/nudos_criticos/${nudoId}/${fileName}`;
    const { error } = await supabase.storage
      .from('documentos_comuna')
      .upload(filePath, file);
    if (error) throw error;
    return filePath;
  };

  const handleSubmitComuna = async () => {
    if (!comunaId) {
      showAlert('Error', 'No se ha identificado la comuna', 'danger');
      return;
    }
    if (!formData.area_trabajo || !formData.solucion_propuesta || !formData.transformacion_7t) {
      showAlert('Campos incompletos', 'Complete los campos obligatorios: Área de trabajo, Solución y Transformación 7T', 'warning');
      return;
    }
    if (!isResponsableComplete()) {
      showAlert('Responsable incompleto', 'Complete TODOS los campos del RESPONSABLE (nombre, apellido, cédula)', 'warning');
      return;
    }

    setSavingComuna(true);
    let id_nudo: number | null = null;

    if (formData.tipo === 'nuevo') {
      if (!formData.titulo_nudo) {
        showAlert('Campos incompletos', 'Debe ingresar un título para el nudo crítico', 'warning');
        setSavingComuna(false);
        return;
      }
      if (formData.descripcion_nudo.length < 100) {
        showAlert('Descripción insuficiente', 'La descripción del problema debe tener al menos 100 caracteres', 'warning');
        setSavingComuna(false);
        return;
      }
      if (!actaFile) {
        showAlert('Acta requerida', 'Debe subir el acta que respalda el nudo crítico (obligatorio)', 'warning');
        setSavingComuna(false);
        return;
      }

      const nuevoNudo = {
        id_comuna: comunaId,
        titulo: formData.titulo_nudo,
        descripcion: formData.descripcion_nudo,
        categoria_7t: formData.transformacion_7t.split(':')[0],
        gravedad: formData.gravedad,
        familias_afectadas: formData.familias_afectadas || null,
        personas_afectadas: formData.personas_afectadas || null,
        justificacion_critico: formData.gravedad === 'Alto/Crítico' ? 'Justificación pendiente' : null,
        fotos_urls: []
      };
      const { data, error } = await supabase
        .from('nudos_criticos_comuna')
        .insert([nuevoNudo])
        .select()
        .single();
      if (error) {
        console.error('Error creando nudo comuna:', error);
        showAlert('Error', 'No se pudo crear el nudo crítico', 'danger');
        setSavingComuna(false);
        return;
      }
      id_nudo = data.id_nudo_comuna;

      try {
        if (id_nudo !== null) {
  const actaPath = await uploadActa(actaFile, id_nudo);
  await supabase.from('nudos_criticos_comuna').update({ acta_url: actaPath }).eq('id_nudo_comuna', id_nudo);
}
      } catch (err) {
        showAlert('Error', 'No se pudo subir el acta', 'danger');
        setSavingComuna(false);
        return;
      }
    } else {
      if (!formData.id_nudo) {
        showAlert('Selección requerida', 'Seleccione un nudo crítico', 'warning');
        setSavingComuna(false);
        return;
      }
      id_nudo = parseInt(formData.id_nudo);
    }

    const nuevaSolucion = {
      id_comuna: comunaId,
      id_nudo_comuna: id_nudo,
      area_trabajo: formData.area_trabajo,
      solucion_propuesta: formData.solucion_propuesta,
      nombre_responsable: formData.nombre_responsable,
      apellido_responsable: formData.apellido_responsable,
      cedula_responsable: getCedulaCompleta(),
      direccion_exacta: formData.direccion_exacta || null,
      fortaleza: formData.fortaleza || null,
      transformacion_7t: formData.transformacion_7t
    };

    let error: any = null;
    if (editModeComuna && editingIdComuna) {
      const { error: updateError } = await supabase
        .from('aca_comuna')
        .update(nuevaSolucion)
        .eq('id_aca_comuna', editingIdComuna);
      error = updateError;
    } else {
      const { error: insertError } = await supabase
        .from('aca_comuna')
        .insert([nuevaSolucion]);
      error = insertError;
    }

    if (error) {
      console.error('Error guardando solución ACA comuna:', error);
      showAlert('Error', 'No se pudo guardar la solución', 'danger');
    } else {
      const { data: refreshed } = await supabase
        .from('aca_comuna')
        .select(`
          *,
          nudo:nudos_criticos_comuna (
            titulo,
            categoria_7t,
            descripcion
          )
        `)
        .eq('id_comuna', comunaId);
      if (refreshed) {
        const solucionesFormateadas = refreshed.map((item: any) => ({
          ...item,
          nudo_titulo: item.nudo?.titulo,
          nudo_categoria: item.nudo?.categoria_7t,
          nudo_descripcion: item.nudo?.descripcion
        }));
        setSolucionesComuna(solucionesFormateadas);
      }
      showAlert('Éxito', 'Registro guardado exitosamente', 'success');
      setIsModalComunaOpen(false);
      resetFormComuna();
    }
    setSavingComuna(false);
  };

  const nudosFiltrados = nudosDisponiblesComuna.filter(
    n => n.categoria_7t === formData.transformacion_7t.split(':')[0]
  );

  if (loadingComuna && comunaId === null) {
    return <div className="flex justify-center p-8"><Loader2 className="animate-spin text-brand-primary" size={28} /></div>;
  }

        if (noComuna) {
          const onNavigate = (route: string) => {
            try {
              // Navegar a la ruta relativa dentro de la app
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
    <div className="max-w-7xl mx-auto space-y-4 p-3 font-sans min-h-screen">
      {/* ==================== SECCIÓN 1: ACA COMUNAL ==================== */}
      <div className="space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div>
            <h2 className="text-base font-black text-slate-800 italic uppercase tracking-tighter flex items-center gap-2">
              <Target className="h-5 w-5 text-brand-primary" /> Agenda Concreta de Acción (ACA) - Comunal
            </h2>
            <p className="text-[8px] text-slate-400 font-bold uppercase tracking-[0.15em] mt-0.5 ml-7">
              Nudos críticos y propuestas de soluciones a nivel de comuna
            </p>
          </div>
          <button
            onClick={() => { resetFormComuna(); setIsModalComunaOpen(true); }}
            className="flex items-center gap-1.5 bg-brand-primary text-white px-4 py-1.5 rounded-xl text-[9px] font-black uppercase tracking-wider shadow-md hover:scale-105 transition-all"
          >
            <PlusCircle size={14} /> Registrar Solución
          </button>
        </div>

        <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="p-3 border-b border-gray-100 bg-gray-50/30 flex items-center justify-between">
            <div>
              <h3 className="text-sm font-black text-slate-800 italic uppercase tracking-tighter">Matriz ACA - Comuna</h3>
              <p className="text-[8px] text-slate-400 font-bold uppercase mt-0.5">Sistematización Territorial</p>
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
                  <th className="px-3 py-2 text-right">Acción</th>
                </tr>
              </thead>
              <tbody>
                {solucionesComuna.length === 0 ? (
                  <tr><td colSpan={7} className="px-3 py-8 text-center text-slate-400 text-xs">No hay soluciones registradas a nivel comuna</td></tr>
                ) : (
                  solucionesComuna.map(sol => (
                    <tr key={sol.id_aca_comuna} className="hover:bg-gray-50/80 transition-colors">
                      <td className="px-3 py-2">
                        <p className="text-[11px] font-black text-brand-primary italic uppercase tracking-tighter">{sol.area_trabajo}</p>
                        <span className="text-[7px] bg-brand-primary/5 text-brand-primary px-1.5 py-0.5 rounded-lg font-black uppercase">{sol.transformacion_7t.split(':')[0]}</span>
                      </td>
                      <td className="px-3 py-2">
                        <p className="text-[10px] font-bold text-slate-800">{sol.nudo_titulo}</p>
                        <span className="text-[7px] text-slate-400">{sol.nudo_categoria}</span>
                      </td>
                      <td className="px-3 py-2 text-[9px] font-bold text-slate-500 max-w-xs">{sol.solucion_propuesta}</td>
                      <td className="px-3 py-2 text-[9px] font-black text-slate-800 uppercase italic min-w-27.5">{sol.nombre_responsable} {sol.apellido_responsable} - {sol.cedula_responsable || '-'}</td>
                      <td className="px-3 py-2 text-[9px] text-slate-400 font-bold uppercase tracking-wider min-w-30">{sol.direccion_exacta || '—'}</td>
                      <td className="px-3 py-2 text-[9px] text-slate-500 font-medium italic min-w-25">{sol.fortaleza || '-'}</td>
                      <td className="px-3 py-2 text-right">
                        <div className="flex justify-end gap-1.5">
                          <button onClick={() => setSelectedSolucionComuna(sol)} className="p-1 rounded-lg text-brand-primary hover:bg-brand-primary/10"><Eye size={14} /></button>
                          <button onClick={() => handleEditComuna(sol)} className="p-1 rounded-lg text-slate-500 hover:text-brand-primary hover:bg-brand-primary/10"><Edit size={14} /></button>
                          <button onClick={() => handleDeleteComuna(sol.id_aca_comuna)} className="p-1 rounded-lg text-rose-500 hover:bg-rose-50"><Trash2 size={14} /></button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* ==================== SECCIÓN 2: ACA POR CONSEJO COMUNAL ==================== */}
      <div className="space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div>
            <h2 className="text-base font-black text-slate-800 italic uppercase tracking-tighter flex items-center gap-2">
              <Target className="h-5 w-5 text-brand-primary" /> ACA por Consejo Comunal
            </h2>
            <p className="text-[8px] text-slate-400 font-bold uppercase tracking-[0.15em] mt-0.5 ml-7">
              Propuestas registradas por los consejos (solo lectura)
            </p>
          </div>
          <select
            value={selectedConsejoId || ""}
            onChange={(e) => setSelectedConsejoId(e.target.value ? parseInt(e.target.value) : null)}
            className="px-3 py-1.5 rounded-xl bg-white border border-gray-100 text-[9px] font-black uppercase tracking-wider min-w-45"
          >
            <option value="">Seleccionar Consejo</option>
            {consejos.map(c => (
              <option key={c.id_consejo} value={c.id_consejo}>{c.nombre_consejo}</option>
            ))}
          </select>
        </div>

        {loadingConsejo && selectedConsejoId ? (
          <div className="flex justify-center py-8"><Loader2 className="animate-spin text-brand-primary" size={24} /></div>
        ) : selectedConsejoId ? (
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
            <div className="p-3 border-b border-gray-100 bg-gray-50/30">
              <h3 className="text-sm font-black text-slate-800 italic uppercase tracking-tighter">Matriz ACA - Consejo Comunal</h3>
              <p className="text-[8px] text-slate-400 font-bold uppercase mt-0.5">(solo lectura)</p>
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
                  </tr>
                </thead>
                <tbody>
                  {solucionesConsejo.length === 0 ? (
                    <tr><td colSpan={6} className="px-3 py-8 text-center text-slate-400 text-xs">Este consejo no tiene propuestas registradas</td></tr>
                  ) : (
                    solucionesConsejo.map(sol => (
                      <tr key={sol.id_aca} className="hover:bg-gray-50/80">
                        <td className="px-3 py-2">
                          <p className="text-[11px] font-black text-brand-primary italic uppercase tracking-tighter">{sol.area_trabajo}</p>
                          <span className="text-[7px] bg-brand-primary/5 text-brand-primary px-1.5 py-0.5 rounded-lg font-black uppercase">{sol.transformacion_7t.split(':')[0]}</span>
                        </td>
                        <td className="px-3 py-2">
                          <p className="text-[10px] font-bold text-slate-800">{sol.nudo_titulo}</p>
                          <span className="text-[7px] text-slate-400">{sol.nudo_categoria}</span>
                        </td>
                        <td className="px-3 py-2 text-[9px] font-bold text-slate-500 max-w-xs">{sol.solucion_propuesta}</td>
                        <td className="px-3 py-2 text-[9px] font-black text-slate-800 uppercase italic">{sol.nombre_responsable} {sol.apellido_responsable} - {sol.cedula_responsable || '-'}</td>
                        <td className="px-3 py-2 text-[9px] text-slate-400 font-bold uppercase tracking-wider">{sol.direccion_exacta || '—'}</td>
                        <td className="px-3 py-2 text-[9px] text-slate-500 font-medium italic">{sol.fortaleza || '-'}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        ) : (
          <div className="text-center py-8 text-slate-400 text-xs">Selecciona un consejo comunal para ver sus soluciones</div>
        )}
      </div>

      {/* MODAL DE REGISTRO/EDICIÓN */}
      <AnimatePresence>
        {isModalComunaOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsModalComunaOpen(false)}
              className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative w-full max-w-3xl bg-white rounded-[2.5rem] shadow-2xl overflow-hidden max-h-[90vh] overflow-y-auto grid grid-cols-4 gap-3 p-4"
            >
              {/* contenido del modal igual que antes (sin reducir) */}
              <div className="col-span-4 p-4 border-b border-gray-100 bg-linear-to-r from-brand-primary/5 to-slate-50/50 flex items-center justify-between">
                <div>
                  <h4 className="text-lg font-black text-slate-800 italic uppercase tracking-tight flex items-center gap-2">
                    <Zap className="h-6 w-6 text-brand-primary" /> {editModeComuna ? "Editar ACA Comunal" : "Registrar ACA Comunal"}
                  </h4>
                  <p className="text-[10px] text-slate-500 font-bold mt-0.5">Agenda Concreta de Acción - Comuna</p>
                </div>
                <button onClick={() => setIsModalComunaOpen(false)} className="p-2 rounded-xl hover:bg-gray-100 transition-all">
                  <X className="h-5 w-5 text-slate-400 hover:text-slate-600" />
                </button>
              </div>

              {!editModeComuna && (
                <div className="col-span-4 flex gap-3 p-3 bg-gray-50/50 rounded-xl border border-gray-100">
                  <label className="flex items-center gap-2 cursor-pointer p-2 bg-white rounded-lg shadow-sm hover:shadow-md transition-all flex-1 justify-center text-xs">
                    <input type="radio" name="tipo" value="nuevo" checked={formData.tipo === 'nuevo'} onChange={handleInputChange} className="w-4 h-4 accent-brand-primary" />
                    <div className="font-black text-slate-800 text-[11px]">Nuevo nudo</div>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer p-2 bg-white rounded-lg shadow-sm hover:shadow-md transition-all flex-1 justify-center text-xs">
                    <input type="radio" name="tipo" value="existente" checked={formData.tipo === 'existente'} onChange={handleInputChange} className="w-4 h-4 accent-brand-primary" />
                    <div className="font-black text-slate-800 text-[11px]">Nudo existente</div>
                  </label>
                </div>
              )}

              <div className="col-span-2 space-y-3">
                <div className="space-y-1.5 p-3 bg-linear-to-br from-blue-50/50 rounded-xl border border-blue-100">
                  <h5 className="text-[10px] font-black text-brand-primary uppercase tracking-wide">DATOS BÁSICOS</h5>
                  <div className="space-y-2">
                    <div>
                      <label className="text-[8px] font-black text-slate-500 uppercase tracking-widest block mb-0.5">Área de trabajo</label>
                      <input name="area_trabajo" value={formData.area_trabajo} onChange={handleInputChange} className="w-full p-2.5 rounded-lg bg-white shadow-sm border border-gray-200 text-xs font-medium focus:ring-2 focus:ring-brand-primary" />
                    </div>
                    <div>
                      <label className="text-[8px] font-black text-slate-500 uppercase tracking-widest block mb-0.5">Transformación 7T</label>
                      <select name="transformacion_7t" value={formData.transformacion_7t} onChange={handleInputChange} className="w-full p-2.5 rounded-lg bg-white shadow-sm border border-gray-200 text-xs font-medium focus:ring-2 focus:ring-brand-primary">
                        <option value="">Seleccione...</option>
                        {transformaciones7T.map(t => <option key={t} value={t}>{t}</option>)}
                      </select>
                    </div>
                  </div>
                </div>

                {formData.tipo === 'nuevo' && !editModeComuna && (
                  <div className="space-y-1.5 p-3 bg-linear-to-br from-blue-50/50 rounded-xl border border-blue-100">
                    <h5 className="text-[10px] font-black text-brand-primary uppercase tracking-wide">NUDO CRÍTICO</h5>
                    <div className="space-y-2">
                      <input name="titulo_nudo" value={formData.titulo_nudo} onChange={handleInputChange} placeholder="Título del problema" className="w-full p-2.5 rounded-lg bg-white shadow-sm border border-gray-200 text-xs font-semibold" />
                      <textarea name="descripcion_nudo" rows={2} value={formData.descripcion_nudo} onChange={handleInputChange} placeholder="Descripción (mín 100 chars)..." className="w-full p-2.5 rounded-lg bg-white shadow-sm border border-gray-200 text-xs resize-vertical" />
                      <div className="text-right">
                        <span className={`text-[9px] font-bold ${descripcionLength >= 100 ? 'text-emerald-600' : 'text-slate-400'}`}>
                          {descripcionLength}/100
                        </span>
                      </div>
                      <div>
                        <label className="text-[8px] font-black text-slate-500 uppercase tracking-widest mb-1 flex items-center gap-1">
                          Acta de respaldo *
                          <span className="text-rose-500 text-[8px]">(PDF)</span>
                        </label>
                        <input type="file" ref={actaInputRef} className="hidden" accept=".pdf,.doc,.docx" onChange={(e) => setActaFile(e.target.files?.[0] || null)} />
                        <div
                          onClick={() => actaInputRef.current?.click()}
                          className="border-2 border-dashed border-gray-200 rounded-lg p-2 flex items-center justify-between cursor-pointer hover:border-brand-primary/30 transition-all bg-white"
                        >
                          <span className="text-[9px] font-medium text-slate-600 truncate">
                            {actaFile ? actaFile.name : "Seleccionar archivo"}
                          </span>
                          <Upload className="h-4 w-4 text-slate-400" />
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              <div className="col-span-2 space-y-3">
                <div className="space-y-1.5 p-3 bg-linear-to-br from-blue-50/50 rounded-xl border border-blue-100 shadow-md">
                  <h5 className="text-[10px] font-black text-brand-primary uppercase tracking-wide">RESPONSABLE</h5>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="text-[8px] font-black text-slate-500 uppercase block mb-0.5">Nombre</label>
                      <input name="nombre_responsable" value={formData.nombre_responsable} onChange={handleInputChange} placeholder="Juan" className="w-full p-2.5 rounded-lg bg-white shadow-sm border border-gray-200 text-xs font-bold focus:ring-2 focus:ring-rose-400" />
                    </div>
                    <div>
                      <label className="text-[8px] font-black text-slate-500 uppercase block mb-0.5">Apellido</label>
                      <input name="apellido_responsable" value={formData.apellido_responsable} onChange={handleInputChange} placeholder="Pérez" className="w-full p-2.5 rounded-lg bg-white shadow-sm border border-gray-200 text-xs font-bold focus:ring-2 focus:ring-rose-400" />
                    </div>
                  </div>
                  <div>
                    <label className="text-[8px] font-black text-slate-500 uppercase block mb-0.5">Cédula</label>
                    <div className="flex gap-2 items-center">
                      <select value={formData.cedula_tipo} onChange={(e) => setFormData(prev => ({ ...prev, cedula_tipo: e.target.value }))} className="w-16 p-2.5 rounded-lg bg-white shadow-sm border border-gray-200 text-xs font-bold focus:ring-2 focus:ring-rose-400">
                        <option value="V">V-</option><option value="E">E-</option><option value="J">J-</option><option value="G">G-</option>
                      </select>
                      <input name="cedula_numero" value={formData.cedula_numero} onChange={(e) => { const onlyNumbers = e.target.value.replace(/\D/g, ''); setFormData(prev => ({ ...prev, cedula_numero: onlyNumbers })); }} placeholder="12345678" maxLength={8} className="flex-1 p-2.5 rounded-lg bg-white shadow-sm border border-gray-200 text-xs font-mono font-bold focus:ring-2 focus:ring-rose-400" />
                    </div>
                  </div>
                </div>

                <div>
                  <label className="text-[8px] font-black text-slate-500 uppercase tracking-widest block mb-0.5">Solución propuesta *</label>
                  <textarea name="solucion_propuesta" rows={3} value={formData.solucion_propuesta} onChange={handleInputChange} className="w-full p-2.5 rounded-lg bg-white shadow-sm border border-gray-200 text-xs font-medium focus:ring-2 focus:ring-brand-primary resize-vertical" />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-[8px] font-black text-slate-500 uppercase tracking-widest block mb-0.5">Dirección exacta</label>
                    <input name="direccion_exacta" value={formData.direccion_exacta} onChange={handleInputChange} placeholder="Calle, sector, referencia" className="w-full p-2.5 rounded-lg bg-white shadow-sm border border-gray-200 text-xs font-medium" />
                  </div>
                  <div>
                    <label className="text-[8px] font-black text-slate-500 uppercase tracking-widest block mb-0.5">Fortaleza</label>
                    <input name="fortaleza" value={formData.fortaleza} onChange={handleInputChange} placeholder="Capacidades existentes" className="w-full p-2.5 rounded-lg bg-white shadow-sm border border-gray-200 text-xs font-medium" />
                  </div>
                </div>

                {formData.tipo === 'nuevo' && !editModeComuna && (
                  <div className="grid grid-cols-2 gap-2 p-3 bg-linear-to-r from-purple-50/50 rounded-lg border border-purple-100">
                    <div>
                      <label className="text-[8px] font-black text-slate-500 uppercase block mb-0.5">Gravedad</label>
                      <select name="gravedad" value={formData.gravedad} onChange={handleInputChange} className="w-full p-2.5 rounded-lg bg-white shadow-sm border border-gray-200 text-xs">
                        <option value="Bajo">Bajo</option><option value="Medio">Medio</option><option value="Alto/Crítico">Alto/Crítico</option>
                      </select>
                    </div>
                    <div className="space-y-1">
                      <label className="text-[8px] font-black text-slate-500 uppercase block mb-0.5">Familias/Personas</label>
                      <div className="grid grid-cols-2 gap-1">
                        <input type="number" name="familias_afectadas" value={formData.familias_afectadas} onChange={handleInputChange} placeholder="0" className="p-2 rounded-lg bg-white shadow-sm border border-gray-200 text-xs text-center" />
                        <input type="number" name="personas_afectadas" value={formData.personas_afectadas} onChange={handleInputChange} placeholder="0" className="p-2 rounded-lg bg-white shadow-sm border border-gray-200 text-xs text-center" />
                      </div>
                    </div>
                  </div>
                )}

                {formData.tipo === 'existente' && (
                  <div>
                    <label className="text-[8px] font-black text-slate-500 uppercase tracking-widest block mb-0.5">Nudo crítico</label>
                    <select name="id_nudo" value={formData.id_nudo} onChange={handleInputChange} className="w-full p-2.5 rounded-lg bg-white shadow-sm border border-gray-200 text-xs">
                      <option value="">Seleccione...</option>
                      {nudosFiltrados.map(n => (
                        <option key={n.id_nudo_comuna} value={n.id_nudo_comuna}>{n.titulo} ({n.categoria_7t})</option>
                      ))}
                    </select>
                  </div>
                )}
              </div>

              <div className="col-span-4 grid grid-cols-2 gap-3 pt-4 border-t border-gray-100">
                <button onClick={() => setIsModalComunaOpen(false)} className="p-3 rounded-xl bg-gray-100 text-slate-600 font-black uppercase tracking-wide hover:bg-gray-200 transition-all shadow-sm hover:shadow-md text-[10px]">
                  Cancelar
                </button>
                <button
                  onClick={handleSubmitComuna}
                  disabled={savingComuna || !formData.area_trabajo || !formData.solucion_propuesta || !formData.transformacion_7t || !isResponsableComplete() || (formData.tipo === 'nuevo' && !editModeComuna && !actaFile)}
                  className="group flex items-center justify-center gap-2 p-3 bg-linear-to-r from-brand-primary to-brand-primary/80 text-white font-black uppercase tracking-wide rounded-xl shadow-xl hover:shadow-2xl hover:scale-[1.02] active:scale-[0.98] transition-all text-[10px] disabled:opacity-50 disabled:cursor-not-allowed disabled:shadow-none"
                >
                  {savingComuna ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4 group-hover:scale-110 transition-transform" />}
                  Guardar ACA
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* MODAL DE DETALLE CON SCROLL EN DESCRIPCIÓN */}
      <AnimatePresence>
        {selectedSolucionComuna && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSelectedSolucionComuna(null)}
              className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="relative w-full max-w-xl bg-white rounded-[2.5rem] shadow-2xl p-6 overflow-y-auto max-h-[90vh]"
            >
              <div className="flex justify-between items-center mb-6">
                <h4 className="text-xl font-black text-slate-800 italic uppercase tracking-tighter">Detalle de la Solución</h4>
                <button onClick={() => setSelectedSolucionComuna(null)} className="p-2 rounded-xl hover:bg-gray-100">
                  <X className="h-5 w-5 text-slate-400" />
                </button>
              </div>
              <div className="space-y-4">
                <div className="border-b pb-3">
                  <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Área de trabajo</p>
                  <p className="text-sm font-black">{selectedSolucionComuna.area_trabajo}</p>
                </div>
                <div className="border-b pb-3">
                  <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Transformación 7T</p>
                  <p className="text-sm font-black">{selectedSolucionComuna.transformacion_7t}</p>
                </div>
                <div className="border-b pb-3">
                  <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Nudo crítico vinculado</p>
                  <p className="text-sm font-black text-brand-primary">{selectedSolucionComuna.nudo_titulo}</p>
                  {/* DESCRIPCIÓN CON SCROLL */}
                  {selectedSolucionComuna.nudo_descripcion && (
                    <div className="mt-1 max-h-32 overflow-y-auto pr-2 scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-transparent">
                      <p className="text-xs text-slate-600 whitespace-pre-wrap">{selectedSolucionComuna.nudo_descripcion}</p>
                    </div>
                  )}
                </div>
                <div className="border-b pb-3">
                  <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Solución propuesta</p>
                  <p className="text-sm text-slate-700">{selectedSolucionComuna.solucion_propuesta}</p>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <p className="text-[9px] font-bold text-slate-400 uppercase">Responsable</p>
                    <p className="text-xs font-black">{selectedSolucionComuna.nombre_responsable} {selectedSolucionComuna.apellido_responsable} - {selectedSolucionComuna.cedula_responsable || '—'}</p>
                  </div>
                  <div>
                    <p className="text-[9px] font-bold text-slate-400 uppercase">Ubicación</p>
                    <p className="text-xs font-black">{selectedSolucionComuna.direccion_exacta || '—'}</p>
                  </div>
                </div>
                <div>
                  <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Fortaleza</p>
                  <p className="text-sm font-medium">{selectedSolucionComuna.fortaleza || '—'}</p>
                </div>
              </div>
              <div className="mt-8 flex justify-end">
                <button onClick={() => setSelectedSolucionComuna(null)} className="px-6 py-3 rounded-xl bg-brand-primary text-white text-[10px] font-black uppercase">
                  Cerrar
                </button>
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

export default AgendaC;