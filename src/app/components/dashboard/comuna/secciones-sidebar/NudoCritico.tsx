"use client";

import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from 'framer-motion';
import { 
  AlertCircle, Building2, Activity, Construction, X, Plus, Edit,
  Trash2, Eye, Loader2, Users, FileText, MapPin, Navigation, ImageIcon, FileCheck
} from "lucide-react";
import { supabase } from "@/app/lib/supabaseClient";
import { useAuth } from "@/context/AuthContext";
import { cn } from "@/app/lib/utils";
import { AlertModal } from "@/app/components/AlertModal";
import dynamic from 'next/dynamic';

// ==================== COMPONENTE DE MAPA (SOLO PARA LA MODAL) ====================
let Leaflet: any = null;
let MapContainer: any = null;
let TileLayer: any = null;
let Marker: any = null;
let Popup: any = null;
let useMapEvents: any = null;

const LocationSelector = ({ onLocationSelect, initialLat, initialLng }: { 
  onLocationSelect: (lat: number, lng: number) => void;
  initialLat?: number;
  initialLng?: number;
}) => {
  const [position, setPosition] = useState<[number, number] | null>(
    initialLat && initialLng ? [initialLat, initialLng] : null
  );
  const [isMounted, setIsMounted] = useState(false);
  const [componentsReady, setComponentsReady] = useState(false);
  const [mapZoom, setMapZoom] = useState(14);

  useEffect(() => {
    setIsMounted(true);
    const loadLeaflet = async () => {
      const L = await import('leaflet');
      const ReactLeaflet = await import('react-leaflet');
      Leaflet = L.default;
      MapContainer = ReactLeaflet.MapContainer;
      TileLayer = ReactLeaflet.TileLayer;
      Marker = ReactLeaflet.Marker;
      Popup = ReactLeaflet.Popup;
      useMapEvents = ReactLeaflet.useMapEvents;
      
      delete (Leaflet.Icon.Default.prototype as any)._getIconUrl;
      Leaflet.Icon.Default.mergeOptions({
        iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
        iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
        shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
      });
      setComponentsReady(true);
    };
    loadLeaflet();
  }, []);

  const LocationMarker = () => {
    if (!componentsReady) return null;
    const map = useMapEvents({
      click(e: any) {
        const { lat, lng } = e.latlng;
        setPosition([lat, lng]);
        onLocationSelect(lat, lng);
      },
      zoomend() { setMapZoom(map.getZoom()); },
    });
    return position === null ? null : (
      <Marker position={position}>
        <Popup>Nudo crítico</Popup>
      </Marker>
    );
  };

  const getCurrentLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const { latitude, longitude } = pos.coords;
          setPosition([latitude, longitude]);
          onLocationSelect(latitude, longitude);
        },
        () => alert("No se pudo obtener tu ubicación")
      );
    } else {
      alert("Geolocalización no soportada");
    }
  };

  const CARRIZAL: [number, number] = [10.3489, -66.9903];
  const center: [number, number] = position || [initialLat || CARRIZAL[0], initialLng || CARRIZAL[1]];

  if (!isMounted || !componentsReady || !MapContainer) {
    return <div className="h-64 bg-gray-100 animate-pulse rounded-xl flex items-center justify-center text-slate-400">Cargando mapa...</div>;
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-3">
        <label className="text-[8px] font-bold text-slate-400 uppercase flex items-center gap-1">
          <MapPin className="h-3 w-3" /> Haz clic en el mapa
        </label>
        <button type="button" onClick={getCurrentLocation} className="flex items-center gap-1 px-2 py-1 bg-indigo-50 text-indigo-600 rounded-lg text-[8px] font-black">
          <Navigation className="h-3 w-3" /> Mi ubicación
        </button>
      </div>
      <div className="h-64 rounded-xl overflow-hidden border border-gray-200">
        <MapContainer center={center} zoom={mapZoom} style={{ height: '100%', width: '100%' }}>
          <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" attribution='© OpenStreetMap' />
          <LocationMarker />
        </MapContainer>
      </div>
      {position && (
        <div className="mt-2 p-2 bg-indigo-50 rounded-lg">
          <p className="text-[8px] text-indigo-700 font-medium">
            <MapPin className="h-3 w-3 inline mr-1" />
            {position[0].toFixed(6)}, {position[1].toFixed(6)}
          </p>
        </div>
      )}
    </div>
  );
};

// ==================== TIPOS ====================
interface NudoComuna {
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
  latitud: number | null;
  longitud: number | null;
  direccion: string | null;
}

interface NudoConsejo {
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
  latitud: number | null;
  longitud: number | null;
  direccion: string | null;
}

interface Consejo {
  id_consejo: number;
  nombre_consejo: string;
}

// ==================== COMPONENTE PRINCIPAL ====================
export const NudoCritico = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [comunaId, setComunaId] = useState<number | null>(null);
  const [noComuna, setNoComuna] = useState(false);
  const [consejos, setConsejos] = useState<Consejo[]>([]);
  const [selectedConsejoId, setSelectedConsejoId] = useState<number | null>(null);
  
  const [nudosComuna, setNudosComuna] = useState<NudoComuna[]>([]);
  const [loadingComuna, setLoadingComuna] = useState(true);
  const [nudosConsejo, setNudosConsejo] = useState<NudoConsejo[]>([]);
  const [loadingConsejo, setLoadingConsejo] = useState(false);
  
  const [isReportOpen, setIsReportOpen] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [currentType, setCurrentType] = useState<'comuna' | 'consejo'>('comuna');
  const [currentConsejoId, setCurrentConsejoId] = useState<number | null>(null);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [saving, setSaving] = useState(false);
  const [descripcionLength, setDescripcionLength] = useState(0);
  
  // Formulario (incluye ubicación)
  const [formData, setFormData] = useState({
    titulo: '',
    descripcion: '',
    categoria_7t: 'T2',
    gravedad: 'Bajo' as 'Bajo' | 'Medio' | 'Alto/Crítico',
    familias_afectadas: 0,
    personas_afectadas: 0,
    justificacion_critico: '',
  });
  const [latitud, setLatitud] = useState<number | null>(null);
  const [longitud, setLongitud] = useState<number | null>(null);
  const [direccion, setDireccion] = useState('');
  const [fotosFiles, setFotosFiles] = useState<File[]>([]);
  const [actaFile, setActaFile] = useState<File | null>(null);
  const [existingFotosPaths, setExistingFotosPaths] = useState<string[]>([]);
  const [existingActaPath, setExistingActaPath] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const actaInputRef = useRef<HTMLInputElement>(null);

  const [selectedNudo, setSelectedNudo] = useState<NudoComuna | NudoConsejo | null>(null);
  const [selectedNudoType, setSelectedNudoType] = useState<'comuna' | 'consejo'>('comuna');

  // Alert Modal
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
    setModalState({ ...modalState, isOpen: true, title, message, type: type || 'info', showInput: false, onConfirm: null });
  };
  const showConfirm = (title: string, message: string, onConfirm: () => void) => {
    setModalState({ ...modalState, isOpen: true, title, message, type: 'warning', showInput: false, onConfirm: () => { onConfirm(); setModalState(prev => ({ ...prev, isOpen: false })); }, confirmText: 'Sí, eliminar', cancelText: 'Cancelar' });
  };
  const closeModal = () => setModalState(prev => ({ ...prev, isOpen: false }));

  // Ocultar sidebar cuando hay modal
  useEffect(() => {
    if (isReportOpen || selectedNudo || modalState.isOpen) document.body.classList.add('modal-open');
    else document.body.classList.remove('modal-open');
    return () => document.body.classList.remove('modal-open');
  }, [isReportOpen, selectedNudo, modalState.isOpen]);

  // Cargar comuna del usuario
  useEffect(() => {
    const fetchComuna = async () => {
      if (!user?.id) {
        setLoading(false);
        return;
      }
      const { data, error } = await supabase
        .from('datos_comuna')
        .select('id_comuna')
        .or(`id_usuario.eq.${user.id},id_usuario_auxiliar.eq.${user.id}`)
        .maybeSingle();
      if (error) console.error(error);
      else if (data) {
        setComunaId(data.id_comuna);
        setNoComuna(false);
      } else {
        setNoComuna(true);
      }
      setLoading(false);
    };
    fetchComuna();
  }, [user]);

  // Cargar consejos solo si hay comunaId y no estamos en estado "sin comuna"
  useEffect(() => {
    if (!comunaId || noComuna) return;
    const fetchConsejos = async () => {
      const { data: sectores } = await supabase
        .from('sectores')
        .select('id_sector')
        .eq('id_datos_comuna', comunaId)
        .eq('activo', true);
      if (!sectores?.length) { setConsejos([]); return; }
      const sectorIds = sectores.map(s => s.id_sector);
      const { data: consejosData } = await supabase
        .from('datos_consejo_comunal')
        .select('id_consejo, nombre_consejo')
        .in('id_sector', sectorIds);
      setConsejos(consejosData || []);
    };
    fetchConsejos();
  }, [comunaId, noComuna]);

  // Cargar nudos de comuna solo si hay comunaId y no estamos en "sin comuna"
  useEffect(() => {
    if (!comunaId || noComuna) return;
    const fetchNudosComuna = async () => {
      setLoadingComuna(true);
      const { data, error } = await supabase
        .from('nudos_criticos_comuna')
        .select('*')
        .eq('id_comuna', comunaId)
        .order('created_at', { ascending: false });
      if (error) console.error(error);
      else setNudosComuna(data || []);
      setLoadingComuna(false);
    };
    fetchNudosComuna();
  }, [comunaId, noComuna]);

  // Cargar nudos de consejo seleccionado (depende de selectedConsejoId, pero también requiere comunaId existente)
  useEffect(() => {
    if (!selectedConsejoId || !comunaId || noComuna) { 
      setNudosConsejo([]); 
      return; 
    }
    const fetchNudosConsejo = async () => {
      setLoadingConsejo(true);
      const { data, error } = await supabase
        .from('nudos_criticos')
        .select('*')
        .eq('id_consejo', selectedConsejoId)
        .order('created_at', { ascending: false });
      if (error) console.error(error);
      else setNudosConsejo(data || []);
      setLoadingConsejo(false);
    };
    fetchNudosConsejo();
  }, [selectedConsejoId, comunaId, noComuna]);

  // ========== FUNCIONES DE STORAGE ==========
  const uploadFotos = async (files: File[], nudoId: number, tipo: 'comuna' | 'consejo'): Promise<string[]> => {
    if (!user?.id) return [];
    const bucketName = tipo === 'comuna' ? 'documentos_comuna' : 'documentos_consejos';
    const prefix = tipo === 'comuna' 
      ? `${comunaId}/nudos_criticos/${nudoId}`
      : `${currentConsejoId || selectedConsejoId}/nudos_criticos/${nudoId}`;
    const uploadedPaths: string[] = [];
    for (const file of files) {
      const fileExt = file.name.split('.').pop();
      const fileName = `${Date.now()}_${Math.random().toString(36).substring(7)}.${fileExt}`;
      const filePath = `${prefix}/${fileName}`;
      const { error } = await supabase.storage.from(bucketName).upload(filePath, file);
      if (error) continue;
      uploadedPaths.push(filePath);
    }
    return uploadedPaths;
  };

  const uploadActa = async (file: File, nudoId: number, tipo: 'comuna' | 'consejo'): Promise<string> => {
    if (!user?.id) throw new Error('Usuario no encontrado');
    const bucketName = tipo === 'comuna' ? 'documentos_comuna' : 'documentos_consejos';
    const prefix = tipo === 'comuna' 
      ? `${comunaId}/nudos_criticos/${nudoId}`
      : `${currentConsejoId || selectedConsejoId}/nudos_criticos/${nudoId}`;
    const fileExt = file.name.split('.').pop();
    const fileName = `acta_${Date.now()}_${Math.random().toString(36).substring(7)}.${fileExt}`;
    const filePath = `${prefix}/${fileName}`;
    const { error } = await supabase.storage.from(bucketName).upload(filePath, file);
    if (error) throw error;
    return filePath;
  };

  const deleteStorageFiles = async (paths: string[], tipo: 'comuna' | 'consejo') => {
    if (!paths.length) return;
    const bucketName = tipo === 'comuna' ? 'documentos_comuna' : 'documentos_consejos';
    for (const path of paths) {
      await supabase.storage.from(bucketName).remove([path]);
    }
  };

  const getSignedUrl = async (filePath: string, tipo: 'comuna' | 'consejo'): Promise<string | null> => {
    const bucketName = tipo === 'comuna' ? 'documentos_comuna' : 'documentos_consejos';
    const { data, error } = await supabase.storage.from(bucketName).createSignedUrl(filePath, 60);
    if (error) return null;
    return data.signedUrl;
  };

  // ========== CRUD ==========
  const resetForm = () => {
    setFormData({
      titulo: '',
      descripcion: '',
      categoria_7t: 'T2',
      gravedad: 'Bajo',
      familias_afectadas: 0,
      personas_afectadas: 0,
      justificacion_critico: '',
    });
    setLatitud(null);
    setLongitud(null);
    setDireccion('');
    setFotosFiles([]);
    setActaFile(null);
    setExistingFotosPaths([]);
    setExistingActaPath(null);
    setEditMode(false);
    setEditingId(null);
    setDescripcionLength(0);
  };

  const handleOpenCreate = (type: 'comuna' | 'consejo', consejoId?: number) => {
    resetForm();
    setCurrentType(type);
    setCurrentConsejoId(consejoId || null);
    setIsReportOpen(true);
  };

  const handleEdit = (nudo: NudoComuna | NudoConsejo, type: 'comuna' | 'consejo') => {
    resetForm();
    setCurrentType(type);
    setEditMode(true);
    setEditingId(type === 'comuna' ? (nudo as NudoComuna).id_nudo_comuna : (nudo as NudoConsejo).id_nudo);
    setFormData({
      titulo: nudo.titulo,
      descripcion: nudo.descripcion || '',
      categoria_7t: nudo.categoria_7t,
      gravedad: nudo.gravedad,
      familias_afectadas: nudo.familias_afectadas || 0,
      personas_afectadas: nudo.personas_afectadas || 0,
      justificacion_critico: nudo.justificacion_critico || '',
    });
    setLatitud(nudo.latitud || null);
    setLongitud(nudo.longitud || null);
    setDireccion(nudo.direccion || '');
    setExistingFotosPaths(nudo.fotos_urls || []);
    setExistingActaPath((nudo as any).acta_url || null);
    setDescripcionLength(nudo.descripcion?.length || 0);
    setIsReportOpen(true);
  };

  const handleDelete = async (nudo: NudoComuna | NudoConsejo, type: 'comuna' | 'consejo') => {
    showConfirm('Eliminar nudo', '¿Eliminar este nudo crítico? También se borrarán archivos.', async () => {
      try {
        if (type === 'comuna') {
          const { error } = await supabase.from('nudos_criticos_comuna').delete().eq('id_nudo_comuna', (nudo as NudoComuna).id_nudo_comuna);
          if (error) throw error;
          setNudosComuna(prev => prev.filter(n => n.id_nudo_comuna !== (nudo as NudoComuna).id_nudo_comuna));
        } else {
          const { error } = await supabase.from('nudos_criticos').delete().eq('id_nudo', (nudo as NudoConsejo).id_nudo);
          if (error) throw error;
          setNudosConsejo(prev => prev.filter(n => n.id_nudo !== (nudo as NudoConsejo).id_nudo));
        }
        if (nudo.fotos_urls?.length) await deleteStorageFiles(nudo.fotos_urls, type);
        if ((nudo as any).acta_url) await deleteStorageFiles([(nudo as any).acta_url], type);
        if (selectedNudo && ((type === 'comuna' && (selectedNudo as NudoComuna).id_nudo_comuna === (nudo as NudoComuna).id_nudo_comuna) ||
            (type === 'consejo' && (selectedNudo as NudoConsejo).id_nudo === (nudo as NudoConsejo).id_nudo))) {
          setSelectedNudo(null);
        }
        showAlert('Eliminado', 'Nudo eliminado', 'success');
      } catch (err) {
        showAlert('Error', 'No se pudo eliminar', 'danger');
      }
    });
  };

  const handleLocationSelect = (lat: number, lng: number) => {
    setLatitud(lat);
    setLongitud(lng);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (formData.descripcion.length < 100) {
      showAlert('Descripción insuficiente', 'Mínimo 100 caracteres', 'warning');
      return;
    }
    if (!editMode && !actaFile) {
      showAlert('Acta requerida', 'Debes subir el acta de respaldo', 'warning');
      return;
    }
    if (formData.gravedad === 'Alto/Crítico' && !formData.justificacion_critico.trim()) {
      showAlert('Justificación requerida', 'Explica por qué es crítico', 'warning');
      return;
    }

    setSaving(true);
    const baseData = {
      titulo: formData.titulo,
      descripcion: formData.descripcion,
      categoria_7t: formData.categoria_7t,
      gravedad: formData.gravedad,
      familias_afectadas: formData.familias_afectadas || null,
      personas_afectadas: formData.personas_afectadas || null,
      justificacion_critico: formData.gravedad === 'Alto/Crítico' ? formData.justificacion_critico : null,
      latitud: latitud,
      longitud: longitud,
      direccion: direccion || null,
    };

    let savedId: number | null = null;
    let error = null;

    if (currentType === 'comuna') {
      if (!comunaId) { showAlert('Error', 'Comuna no encontrada', 'danger'); setSaving(false); return; }
      if (editMode && editingId) {
        const { error: updError } = await supabase.from('nudos_criticos_comuna').update(baseData).eq('id_nudo_comuna', editingId);
        error = updError;
        savedId = editingId;
      } else {
        const { data, error: insError } = await supabase.from('nudos_criticos_comuna').insert([{ ...baseData, id_comuna: comunaId }]).select().single();
        error = insError;
        if (data) savedId = data.id_nudo_comuna;
      }
    } else {
      if (!currentConsejoId) { showAlert('Selecciona un consejo', '', 'warning'); setSaving(false); return; }
      if (editMode && editingId) {
        const { error: updError } = await supabase.from('nudos_criticos').update(baseData).eq('id_nudo', editingId);
        error = updError;
        savedId = editingId;
      } else {
        const { data, error: insError } = await supabase.from('nudos_criticos').insert([{ ...baseData, id_consejo: currentConsejoId }]).select().single();
        error = insError;
        if (data) savedId = data.id_nudo;
      }
    }

    if (error || !savedId) {
      showAlert('Error', 'No se pudo guardar el nudo', 'danger');
      setSaving(false);
      return;
    }

    // Subir archivos
    let finalFotos = [...existingFotosPaths];
    if (fotosFiles.length) {
      const newPaths = await uploadFotos(fotosFiles, savedId, currentType);
      finalFotos = [...finalFotos, ...newPaths];
    }
    let finalActa = existingActaPath;
    if (actaFile) {
      finalActa = await uploadActa(actaFile, savedId, currentType);
    }
    const updateData: any = {};
    if (finalFotos.length !== existingFotosPaths.length) updateData.fotos_urls = finalFotos;
    if (finalActa !== existingActaPath) updateData.acta_url = finalActa;
    if (Object.keys(updateData).length) {
      if (currentType === 'comuna') {
        await supabase.from('nudos_criticos_comuna').update(updateData).eq('id_nudo_comuna', savedId);
      } else {
        await supabase.from('nudos_criticos').update(updateData).eq('id_nudo', savedId);
      }
    }

    // Recargar listas
    if (currentType === 'comuna') {
      const { data } = await supabase.from('nudos_criticos_comuna').select('*').eq('id_comuna', comunaId).order('created_at', { ascending: false });
      if (data) setNudosComuna(data);
    } else {
      const { data } = await supabase.from('nudos_criticos').select('*').eq('id_consejo', currentConsejoId!).order('created_at', { ascending: false });
      if (data) setNudosConsejo(data);
    }

    setIsReportOpen(false);
    resetForm();
    showAlert('Éxito', editMode ? 'Actualizado' : 'Reportado', 'success');
    setSaving(false);
  };

  // ========== RENDER ==========
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
    <div className="max-w-7xl mx-auto space-y-4 p-3 font-sans min-h-screen">
      {/* Header */}
      <div className="bg-white border border-gray-100 rounded-2xl p-4 flex flex-col md:flex-row items-center gap-4 shadow-sm">
        <div className="h-12 w-12 rounded-xl bg-indigo-50 flex items-center justify-center text-brand-primary shadow-md shrink-0">
          <AlertCircle className="h-6 w-6" />
        </div>
        <div className="text-center md:text-left">
          <h3 className="text-base font-black text-900 italic uppercase tracking-tighter">
            Gestión de Nudos Críticos
          </h3>
          <p className="text-700/70 text-[8px] font-bold uppercase tracking-wider mt-0.5">Identificación de obstáculos prioritarios (Agenda ACA)</p>
        </div>
        <button onClick={() => handleOpenCreate('comuna')} className="md:ml-auto bg-brand-primary text-white px-4 py-2 rounded-lg text-[8px] font-black uppercase shadow-md hover:scale-105 transition-all">
          Reportar Nudo Crítico
        </button>
      </div>

      {/* SECCIÓN 1: NUDOS DE LA COMUNA (tarjetas) */}
      <div className="space-y-4">
        <div className="flex items-center gap-2 px-2">
          <Users className="h-4 w-4 text-brand-primary" />
          <h4 className="text-[9px] font-black text-slate-800 uppercase italic tracking-wider">Nudos Críticos de la Comuna</h4>
          <div className="h-px bg-gray-100 flex-1" />
        </div>
        <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
          {loadingComuna ? (
            <div className="col-span-full flex justify-center py-8"><Loader2 className="animate-spin text-brand-primary" size={24} /></div>
          ) : nudosComuna.length === 0 ? (
            <div className="col-span-full text-center py-6 text-slate-400 text-xs">No hay nudos registrados a nivel comuna</div>
          ) : (
            nudosComuna.map(nudo => (
              <NudoCardComuna
                key={nudo.id_nudo_comuna}
                nudo={nudo}
                onView={() => { setSelectedNudo(nudo); setSelectedNudoType('comuna'); }}
                onEdit={() => handleEdit(nudo, 'comuna')}
                onDelete={() => handleDelete(nudo, 'comuna')}
              />
            ))
          )}
        </div>
      </div>

      {/* SECCIÓN 2: NUDOS DE CONSEJOS */}
      <div className="space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 px-2">
          <div className="flex items-center gap-2 flex-1">
            <Building2 className="h-4 w-4 text-brand-primary" />
            <h4 className="text-[9px] font-black text-slate-800 uppercase italic tracking-wider whitespace-nowrap">Nudos Críticos de Consejos Comunales</h4>
            <div className="h-px bg-gray-100 flex-1 hidden md:block" />
          </div>
          <div className="relative group min-w-60">
            <div className="absolute left-3 top-1/2 -translate-y-1/2 flex items-center gap-1 pointer-events-none">
              <MapPin className="h-3 w-3 text-brand-primary" />
              <div className="h-3 w-px bg-gray-200 ml-0.5" />
            </div>
            <select
              className="w-full pl-8 pr-8 py-1.5 rounded-lg bg-white border border-gray-100 shadow-sm focus:ring-2 focus:ring-brand-primary/5 text-[8px] font-black uppercase tracking-wider text-slate-700 appearance-none cursor-pointer"
              value={selectedConsejoId || ""}
              onChange={(e) => setSelectedConsejoId(e.target.value ? parseInt(e.target.value) : null)}
            >
              <option value="">Seleccionar Consejo Comunal</option>
              {consejos.map(c => <option key={c.id_consejo} value={c.id_consejo}>{c.nombre_consejo}</option>)}
            </select>
          </div>
        </div>
        <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
          {!selectedConsejoId ? (
            <div className="col-span-full text-center py-6 text-slate-400 text-xs">Selecciona un consejo comunal</div>
          ) : loadingConsejo ? (
            <div className="col-span-full flex justify-center py-8"><Loader2 className="animate-spin text-brand-primary" size={24} /></div>
          ) : nudosConsejo.length === 0 ? (
            <div className="col-span-full text-center py-6 text-slate-400 text-xs">Este consejo no tiene nudos críticos reportados</div>
          ) : (
            nudosConsejo.map(nudo => (
              <NudoCardConsejo
                key={nudo.id_nudo}
                nudo={nudo}
                onView={() => { setSelectedNudo(nudo); setSelectedNudoType('consejo'); }}
                onEdit={() => handleEdit(nudo, 'consejo')}
                onDelete={() => handleDelete(nudo, 'consejo')}
              />
            ))
          )}
        </div>
        
      </div>

      {/* MODAL DE CREACIÓN/EDICIÓN (con mapa) */}
      <AnimatePresence>
        {isReportOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setIsReportOpen(false)} className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" />
            <motion.div initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 20 }} className="relative w-full max-w-5xl bg-white rounded-[2.5rem] shadow-2xl overflow-hidden max-h-[90vh] overflow-y-auto">
              <div className="p-4 border-b border-gray-50 flex items-center justify-between sticky top-0 bg-white z-10">
                <h4 className="text-base font-black text-slate-800 uppercase tracking-wider">{editMode ? "Editar" : "Reportar"} Nudo {currentType === 'consejo' && "(Consejo)"}</h4>
                <button onClick={() => setIsReportOpen(false)} className="p-2 rounded-xl hover:bg-gray-100"><X className="h-5 w-5 text-slate-400" /></button>
              </div>
              <form onSubmit={handleSubmit} className="p-5">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
                  {/* Columna izquierda: datos generales */}
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-3">
                      <div><label className="text-[8px] font-bold text-slate-400 uppercase">Transformación</label>
                        <select name="categoria_7t" value={formData.categoria_7t} onChange={(e) => setFormData(p => ({ ...p, categoria_7t: e.target.value }))} className="w-full p-2.5 rounded-xl bg-gray-50 text-[10px] font-bold uppercase">
                          <option value="T1">T1 Económica</option><option value="T2">T2 Servicios</option><option value="T3">T3 Seguridad</option>
                          <option value="T4">T4 Social</option><option value="T5">T5 Política</option><option value="T6">T6 Ciencia</option>
                          <option value="T7">T7 Geopolítica</option>
                        </select>
                      </div>
                      <div><label className="text-[8px] font-bold text-slate-400 uppercase">Gravedad</label>
                        <div className="flex gap-1">
                          {["Bajo","Medio","Alto/Crítico"].map(g => (
                            <button key={g} type="button" onClick={() => setFormData(p => ({ ...p, gravedad: g as any }))} className={cn("flex-1 py-2 rounded-lg text-[8px] font-black uppercase border", formData.gravedad === g ? "border-brand-primary bg-brand-primary text-white" : "border-gray-200 bg-gray-50 text-slate-500")}>
                              {g}
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>
                    <div><label className="text-[8px] font-bold text-slate-400 uppercase">Título</label>
                      <input name="titulo" value={formData.titulo} onChange={(e) => setFormData(p => ({ ...p, titulo: e.target.value }))} className="w-full p-2.5 rounded-xl bg-gray-50 text-xs font-bold" required />
                    </div>
                    <div><div className="flex justify-between"><label className="text-[8px] font-bold text-slate-400 uppercase">Descripción *</label><span className={cn("text-[7px] font-bold px-2 py-0.5 rounded-full", descripcionLength >= 100 ? "bg-emerald-100 text-emerald-700" : "bg-rose-100 text-rose-700")}>{descripcionLength}/100</span></div>
                      <textarea name="descripcion" rows={3} value={formData.descripcion} onChange={(e) => { setFormData(p => ({ ...p, descripcion: e.target.value })); setDescripcionLength(e.target.value.length); }} className={cn("w-full p-2.5 rounded-xl bg-gray-50 text-xs font-bold resize-none", descripcionLength >= 100 ? "ring-emerald-200 ring-2" : "ring-rose-200 ring-2")} required />
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div><label className="text-[8px] font-bold text-slate-400 block mb-1">Familias</label><input type="number" value={formData.familias_afectadas} onChange={(e) => setFormData(p => ({ ...p, familias_afectadas: parseInt(e.target.value) || 0 }))} className="w-full p-2.5 rounded-xl bg-gray-50 text-xs font-bold" /></div>
                      <div><label className="text-[8px] font-bold text-slate-400 block mb-1">Personas</label><input type="number" value={formData.personas_afectadas} onChange={(e) => setFormData(p => ({ ...p, personas_afectadas: parseInt(e.target.value) || 0 }))} className="w-full p-2.5 rounded-xl bg-gray-50 text-xs font-bold" /></div>
                    </div>
                    <div><label className="text-[8px] font-bold text-slate-400 uppercase">Evidencias</label>
                      {(existingFotosPaths.length > 0 || existingActaPath) && <div className="flex gap-2 p-2 bg-gray-50 rounded-xl my-2">{existingFotosPaths.map((_, i) => <button key={i} type="button" className="px-2 py-1 bg-blue-100 text-[9px] rounded-lg flex items-center gap-1"><ImageIcon className="h-3 w-3" /> {i+1}</button>)}{existingActaPath && <button type="button" className="px-2 py-1 bg-emerald-100 text-[9px] rounded-lg flex items-center gap-1"><FileText className="h-3 w-3" /> Acta</button>}</div>}
                      <div className="grid grid-cols-2 gap-2">
                        <div><input type="file" multiple accept="image/*" ref={fileInputRef} className="hidden" onChange={(e) => setFotosFiles(e.target.files ? Array.from(e.target.files) : [])} /><button type="button" onClick={() => fileInputRef.current?.click()} className="w-full p-2 bg-white border border-brand-primary/20 text-brand-primary text-[9px] font-bold uppercase rounded-lg flex items-center justify-center gap-1"><ImageIcon className="h-3 w-3" /> Fotos</button>{fotosFiles.length > 0 && <p className="text-[7px] text-emerald-600">{fotosFiles.length} foto(s)</p>}</div>
                        <div><input type="file" accept=".pdf,.doc,.docx" ref={actaInputRef} className="hidden" onChange={(e) => setActaFile(e.target.files?.[0] || null)} /><button type="button" onClick={() => actaInputRef.current?.click()} className="w-full p-2 bg-white border border-emerald-200 text-emerald-600 text-[9px] font-bold uppercase rounded-lg flex items-center justify-center gap-1"><FileText className="h-3 w-3" /> Acta</button>{actaFile && <p className="text-[7px] text-emerald-600 truncate">{actaFile.name}</p>}</div>
                      </div>
                    </div>
                    {formData.gravedad === 'Alto/Crítico' && <div><label className="text-[8px] font-bold text-slate-400 uppercase">Justificación Crítica</label><textarea rows={2} value={formData.justificacion_critico} onChange={(e) => setFormData(p => ({ ...p, justificacion_critico: e.target.value }))} className="w-full p-2.5 rounded-xl bg-rose-50 text-xs" placeholder="Explica por qué es crítico..." /></div>}
                  </div>
                  {/* Columna derecha: mapa y dirección */}
                  <div className="space-y-4">
                    <div className="bg-gradient-to-r from-indigo-50 to-blue-50 p-3 rounded-xl border border-indigo-100">
                      <div className="flex items-center gap-2 mb-2"><MapPin className="h-3.5 w-3.5 text-indigo-600" /><label className="text-[8px] font-bold text-indigo-700 uppercase">Ubicación del Nudo</label></div>
                      <LocationSelector onLocationSelect={handleLocationSelect} initialLat={latitud || undefined} initialLng={longitud || undefined} />
                      <div className="mt-3"><label className="text-[8px] font-bold text-slate-400 uppercase block mb-1">Dirección / Referencia</label><input type="text" value={direccion} onChange={(e) => setDireccion(e.target.value)} placeholder="Ej: Calle Principal, Casa #123" className="w-full p-2.5 rounded-xl bg-white border border-gray-200 text-xs" /></div>
                    </div>
                    <button type="submit" disabled={saving} className="w-full py-3 rounded-xl bg-brand-primary text-white text-[9px] font-black uppercase shadow-lg disabled:opacity-70">
                      {saving ? <Loader2 className="animate-spin mx-auto" size={16} /> : (editMode ? "Actualizar" : "Reportar")}
                    </button>
                  </div>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* MODAL DE DETALLE CON SCROLL Y SIN BOTONES PARA CONSEJOS */}
      <AnimatePresence>
        {selectedNudo && !isReportOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setSelectedNudo(null)} className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" />
            <motion.div initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 20 }} className="relative w-full max-w-xl bg-white rounded-[2.5rem] shadow-2xl p-6 max-h-[90vh] overflow-y-auto">
              <div className="flex justify-between items-start mb-6">
                <div className="h-12 w-12 rounded-2xl bg-brand-primary/10 flex items-center justify-center text-brand-primary"><AlertCircle className="h-6 w-6" /></div>
                <button onClick={() => setSelectedNudo(null)} className="p-2 rounded-xl hover:bg-gray-100"><X className="h-5 w-5 text-slate-400" /></button>
              </div>
              <h4 className="text-lg font-black text-slate-800 italic uppercase leading-tight mb-2">{selectedNudo.titulo}</h4>
              <div className="flex gap-2 mb-4">
                <span className={cn("text-[9px] font-black px-3 py-1 rounded-lg uppercase border", selectedNudo.gravedad === "Alto/Crítico" ? "bg-rose-50 text-rose-500" : "bg-amber-50 text-amber-600")}>{selectedNudo.gravedad}</span>
                <span className="text-[9px] font-black px-3 py-1 bg-slate-50 text-slate-400 rounded-lg uppercase">{selectedNudo.categoria_7t}</span>
              </div>

              {/* DESCRIPCIÓN CON SCROLL */}
              <div className="max-h-32 overflow-y-auto pr-2 mb-4">
                <p className="text-xs text-gray-600 whitespace-pre-wrap">{selectedNudo.descripcion}</p>
              </div>

              {selectedNudo.direccion && (
                <div className="mb-4 p-3 bg-gray-50 rounded-lg">
                  <p className="text-[8px] font-bold text-slate-400 uppercase flex items-center gap-1"><MapPin className="h-3 w-3" /> Dirección</p>
                  <p className="text-xs">{selectedNudo.direccion}</p>
                </div>
              )}
              {selectedNudo.latitud && selectedNudo.longitud && (
                <div className="mb-4 p-3 bg-indigo-50 rounded-lg">
                  <p className="text-[8px] font-bold text-indigo-600 uppercase flex items-center gap-1"><MapPin className="h-3 w-3" /> Coordenadas</p>
                  <p className="text-xs font-mono">{selectedNudo.latitud.toFixed(6)}, {selectedNudo.longitud.toFixed(6)}</p>
                </div>
              )}
              <div className="grid gap-3 py-4 border-y border-gray-50">
                <div className="flex justify-between"><span className="text-[9px] font-bold text-slate-400">Familias afectadas</span><span className="text-xs font-black">{selectedNudo.familias_afectadas ?? '—'}</span></div>
                <div className="flex justify-between"><span className="text-[9px] font-bold text-slate-400">Personas afectadas</span><span className="text-xs font-black">{selectedNudo.personas_afectadas ?? '—'}</span></div>
              </div>
              {selectedNudo.justificacion_critico && (
                <div className="mt-4 p-4 bg-rose-50 rounded-xl">
                  <p className="text-[8px] font-bold text-rose-500 uppercase">Justificación crítica</p>
                  <p className="text-xs">{selectedNudo.justificacion_critico}</p>
                </div>
              )}
              <div className="mt-4">
                <p className="text-[9px] font-bold text-slate-400 uppercase mb-2">Fotos</p>
                <div className="flex gap-2 flex-wrap">
                  {selectedNudo.fotos_urls?.map((url, i) => (
                    <button key={i} onClick={async () => { const signed = await getSignedUrl(url, selectedNudoType); if (signed) window.open(signed); }} className="px-3 py-1.5 bg-gray-100 rounded-xl text-[10px] flex items-center gap-1">
                      <ImageIcon className="h-3 w-3" /> Ver foto {i+1}
                    </button>
                  ))}
                  {(!selectedNudo.fotos_urls || selectedNudo.fotos_urls.length === 0) && <span className="text-xs text-slate-400">Sin fotos</span>}
                </div>
              </div>
              {(selectedNudo as any).acta_url && (
                <div className="mt-4">
                  <button onClick={async () => { const url = await getSignedUrl((selectedNudo as any).acta_url, selectedNudoType); if (url) window.open(url); }} className="w-full p-3 bg-emerald-50 rounded-xl text-xs font-bold text-emerald-700 flex items-center justify-center gap-1">
                    <FileText className="h-4 w-4" /> Ver Acta
                  </button>
                </div>
              )}
              <div className="mt-6 flex gap-3">
                {selectedNudoType === 'comuna' ? (
                  <>
                    <button onClick={() => { const n = selectedNudo; setSelectedNudo(null); handleEdit(n, 'comuna'); }} className="flex-1 py-2.5 rounded-xl bg-slate-100 text-slate-600 text-[9px] font-black uppercase">Editar</button>
                    <button onClick={() => { const n = selectedNudo; setSelectedNudo(null); handleDelete(n, 'comuna'); }} className="flex-1 py-2.5 rounded-xl bg-rose-50 text-rose-600 text-[9px] font-black uppercase">Eliminar</button>
                  </>
                ) : (
                  <button onClick={() => setSelectedNudo(null)} className="flex-1 py-2.5 rounded-xl bg-brand-primary text-white text-[9px] font-black uppercase">Cerrar</button>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <AlertModal isOpen={modalState.isOpen} onClose={closeModal} title={modalState.title} message={modalState.message} type={modalState.type} showInput={modalState.showInput} inputPlaceholder={modalState.inputPlaceholder} cancelText={modalState.cancelText} confirmText={modalState.confirmText} onConfirm={modalState.onConfirm || (() => closeModal())} />
    </div>
  );
};

// ==================== TARJETAS REDUCIDAS ====================
const NudoCardComuna = ({ nudo, onView, onEdit, onDelete }: { nudo: NudoComuna; onView: () => void; onEdit: () => void; onDelete: () => void }) => {
  const Icon = nudo.categoria_7t === 'T1' ? Building2 : (nudo.categoria_7t === 'T2' ? Construction : Activity);
  return (
    <div className="bg-white p-3 rounded-xl border border-gray-100 shadow-sm group hover:shadow-md transition-all">
      <div className="flex justify-between items-start mb-2">
        <div className="h-8 w-8 rounded-lg bg-gray-50 flex items-center justify-center text-slate-400 group-hover:text-brand-primary group-hover:bg-brand-primary/10"><Icon className="h-4 w-4" /></div>
        <span className={cn("text-[7px] font-black px-1.5 py-0.5 rounded-full uppercase border", nudo.gravedad === "Alto/Crítico" ? "bg-rose-50 text-rose-600" : "bg-amber-50 text-amber-600")}>{nudo.gravedad}</span>
      </div>
      <p className="text-[7px] font-black text-slate-400 uppercase mb-0.5">{nudo.categoria_7t} • ID:{nudo.id_nudo_comuna}</p>
      <h4 className="text-[10px] font-black text-slate-800 leading-tight mb-2 line-clamp-2">{nudo.titulo}</h4>
      <div className="flex items-center justify-between pt-2 border-t border-gray-50">
        <p className="text-[8px] font-bold text-slate-400 italic">{nudo.familias_afectadas ?? 0} Familias</p>
        <div className="flex gap-1.5"><button onClick={onView} className="p-1 text-slate-400 hover:text-brand-primary"><Eye className="h-3 w-3" /></button><button onClick={onEdit} className="p-1 text-slate-400 hover:text-brand-primary"><Edit className="h-3 w-3" /></button><button onClick={onDelete} className="p-1 text-slate-400 hover:text-rose-500"><Trash2 className="h-3 w-3" /></button></div>
      </div>
    </div>
  );
};

const NudoCardConsejo = ({ nudo, onView, onEdit, onDelete }: { nudo: NudoConsejo; onView: () => void; onEdit: () => void; onDelete: () => void }) => {
  const Icon = nudo.categoria_7t === 'T1' ? Building2 : (nudo.categoria_7t === 'T2' ? Construction : Activity);
  return (
    <div className="bg-white p-3 rounded-xl border border-gray-100 shadow-sm group hover:shadow-md transition-all">
      <div className="flex justify-between items-start mb-2">
        <div className="h-8 w-8 rounded-lg bg-gray-50 flex items-center justify-center text-slate-400 group-hover:text-brand-primary group-hover:bg-brand-primary/10"><Icon className="h-4 w-4" /></div>
        <span className={cn("text-[7px] font-black px-1.5 py-0.5 rounded-full uppercase border", nudo.gravedad === "Alto/Crítico" ? "bg-rose-50 text-rose-600" : "bg-amber-50 text-amber-600")}>{nudo.gravedad}</span>
      </div>
      <p className="text-[7px] font-black text-slate-400 uppercase mb-0.5">{nudo.categoria_7t} • ID:{nudo.id_nudo}</p>
      <h4 className="text-[10px] font-black text-slate-800 leading-tight mb-2 line-clamp-2">{nudo.titulo}</h4>
      <div className="flex items-center justify-between pt-2 border-t border-gray-50">
        <p className="text-[8px] font-bold text-slate-400 italic">{nudo.familias_afectadas ?? 0} Familias</p>
        <div className="flex gap-1.5"><button onClick={onView} className="p-1 text-slate-400 hover:text-brand-primary"><Eye className="h-3 w-3" /></button><button onClick={onEdit} className="p-1 text-slate-400 hover:text-brand-primary"><Edit className="h-3 w-3" /></button><button onClick={onDelete} className="p-1 text-slate-400 hover:text-rose-500"><Trash2 className="h-3 w-3" /></button></div>
      </div>
    </div>
  );
};