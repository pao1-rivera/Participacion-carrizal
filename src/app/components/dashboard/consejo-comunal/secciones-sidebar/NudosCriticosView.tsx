"use client";

import React, { useState, useEffect, useRef } from "react";
import type { LeafletMouseEvent } from 'leaflet';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  AlertCircle, Building2, Activity, CheckCircle2, Construction, X, Plus, Edit,
  Trash2, Eye, Loader2, Upload, FileText, MapPin, Navigation, FileCheck
} from "lucide-react";
import { supabase } from "@/app/lib/supabaseClient";
import { useAuth } from "@/context/AuthContext";
import { cn } from "@/app/lib/utils";
import { AlertModal } from "@/app/components/AlertModal";
import dynamic from 'next/dynamic';

// Importar Leaflet y componentes solo en el cliente
let Leaflet: any = null;
let MapContainer: any = null;
let TileLayer: any = null;
let Marker: any = null;
let Popup: any = null;
let useMapEvents: any = null;

// Componente para seleccionar ubicación en el mapa (sin cambios)
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
      zoomend() {
        setMapZoom(map.getZoom());
      },
    });
    
    return position === null ? null : (
      <Marker position={position}>
        <Popup>
          <div className="text-center">
            <p className="font-bold text-[10px]">Nudo Crítico</p>
            <p className="text-[8px] text-gray-500">{position[0].toFixed(6)}, {position[1].toFixed(6)}</p>
          </div>
        </Popup>
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
        (error) => {
          console.error("Error obteniendo ubicación:", error);
          alert("No se pudo obtener tu ubicación. Por favor, selecciona manualmente en el mapa.");
        }
      );
    } else {
      alert("Tu navegador no soporta geolocalización.");
    }
  };

  const CARRIZAL_COORDS: [number, number] = [10.3489, -66.9903];
  const centerPosition: [number, number] = position || [initialLat || CARRIZAL_COORDS[0], initialLng || CARRIZAL_COORDS[1]];

  if (!isMounted || !componentsReady || !MapContainer) {
    return (
      <div className="h-full">
        <div className="flex justify-between items-center mb-2">
          <label className="text-[8px] font-bold text-slate-400 uppercase tracking-wider"> Ubicación en el mapa</label>
          <button
            type="button"
            onClick={getCurrentLocation}
            className="flex items-center gap-1 px-1.5 py-1 bg-indigo-50 text-indigo-600 rounded-lg text-[8px] font-black hover:bg-indigo-100 transition-colors"
          >
            <Navigation className="h-3 w-3" /> Mi ubicación
          </button>
        </div>
        <div className="h-48 rounded-xl overflow-hidden border border-gray-200 bg-gray-100 animate-pulse flex items-center justify-center text-slate-400 text-xs">
          Cargando mapa...
        </div>
      </div>
    );
  }

  return (
    <div className="h-full">
      <div className="flex justify-between items-center mb-2">
        <label className="text-[8px] font-bold text-slate-400 uppercase tracking-wider"> Haz clic en el mapa para marcar la ubicación</label>
        <button
          type="button"
          onClick={getCurrentLocation}
          className="flex items-center gap-1 px-1.5 py-1 bg-indigo-50 text-indigo-600 rounded-lg text-[8px] font-black hover:bg-indigo-100 transition-colors"
        >
          <Navigation className="h-3 w-3" /> Mi ubicación
        </button>
      </div>
      <div className="h-48 rounded-xl overflow-hidden border border-gray-200 shadow-sm">
        <MapContainer
          key={`map-${centerPosition[0]}-${centerPosition[1]}`}
          center={centerPosition}
          zoom={mapZoom}
          style={{ height: '100%', width: '100%' }}
        >
          <TileLayer
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          />
          <LocationMarker />
        </MapContainer>
      </div>
      {position && (
        <div className="mt-1.5 p-1.5 bg-indigo-50 rounded-lg">
          <p className="text-[8px] text-indigo-700 font-medium">
             Coordenadas: {position[0].toFixed(6)}, {position[1].toFixed(6)}
          </p>
        </div>
      )}
      {!position && (
        <p className="text-[8px] text-slate-400 mt-1.5 italic">
          Haz clic en el mapa para marcar la ubicación del nudo crítico
        </p>
      )}
    </div>
  );
};

interface Nudo {
  id_nudo: number;
  titulo: string;
  descripcion: string | null;
  categoria_7t: string;
  gravedad: 'Bajo' | 'Medio' | 'Alto/Crítico';
  familias_afectadas: number | null;
  personas_afectadas: number | null;
  justificacion_critico: string | null;
  fotos_urls: string[] | null;
  acta_url: string | null;
  id_proyecto: number | null;
  estado: string;
  created_at: string;
  latitud: number | null;
  longitud: number | null;
  direccion: string | null;
}

interface ProyectoSimple {
  id_proyecto: number;
  nombre: string;
  codigo: string;
  estado: string;
}

// ========== FUNCIÓN DE URL FIRMADA ==========
const getSignedUrlFromStorage = async (storedPath: string | null, bucketName: string = 'documentos_consejos'): Promise<string | null> => {
  if (!storedPath) return null;
  
  let cleanPath = storedPath;
  let bucket = bucketName;

  if (storedPath.includes('http')) {
    const match = storedPath.match(/\/storage\/v1\/object\/public\/([^\/]+)\/(.+)$/);
    if (match && match.length >= 3) {
      bucket = match[1];
      cleanPath = match[2];
    } else {
      const altMatch = storedPath.match(/\/storage\/v1\/object\/public\/(.+)$/);
      if (altMatch && altMatch.length >= 2) {
        const full = altMatch[1];
        const parts = full.split('/');
        if (parts.length > 1) {
          bucket = parts[0];
          cleanPath = parts.slice(1).join('/');
        } else {
          cleanPath = full;
        }
      } else {
        console.error('Estructura de URL pública irreconocible:', storedPath);
        return null;
      }
    }
  } else {
    cleanPath = storedPath.replace(/^\/+/, '');
  }

  try {
    const { data, error } = await supabase.storage
      .from(bucket)
      .createSignedUrl(cleanPath, 3600);
    if (error) {
      console.error(`Error generando signed URL (bucket: ${bucket}, path: ${cleanPath}):`, error.message);
      return null;
    }
    return data.signedUrl;
  } catch (err) {
    console.error('Error inesperado generando signed URL:', err);
    return null;
  }
};

// ========== ELIMINAR ARCHIVOS ==========
const deleteFilesFromStorage = async (filePaths: string[], bucketName: string = 'documentos_consejos'): Promise<void> => {
  if (!filePaths.length) return;
  const relativePaths: string[] = [];
  for (const path of filePaths) {
    let clean = path;
    if (path.includes('http')) {
      const match = path.match(/\/storage\/v1\/object\/public\/[^\/]+\/(.+)$/);
      if (match) clean = match[1];
      else continue;
    }
    relativePaths.push(clean.replace(/^\/+/, ''));
  }
  if (relativePaths.length === 0) return;
  const { error } = await supabase.storage.from(bucketName).remove(relativePaths);
  if (error) console.error('Error eliminando archivos:', error.message);
};

export const NudosCriticosView = () => {
  const { user } = useAuth();
  const [consejoId, setConsejoId] = useState<number | null>(null);
  const [noConsejo, setNoConsejo] = useState(false);
  const [nudos, setNudos] = useState<Nudo[]>([]);
  const [loading, setLoading] = useState(true);
  const [isReportOpen, setIsReportOpen] = useState(false);
  const [selectedNudo, setSelectedNudo] = useState<Nudo | null>(null);
  const [editMode, setEditMode] = useState(false);
  const [editingNudoId, setEditingNudoId] = useState<number | null>(null);
  const [saving, setSaving] = useState(false);
  const [showLinkModal, setShowLinkModal] = useState(false);
  const [proyectosDisponibles, setProyectosDisponibles] = useState<ProyectoSimple[]>([]);
  const [selectedProjectId, setSelectedProjectId] = useState<number | null>(null);
  const [linkingNudo, setLinkingNudo] = useState<Nudo | null>(null);
  const [proyectoVinculado, setProyectoVinculado] = useState<{ codigo: string; nombre: string } | null>(null);
  const [cargandoProyecto, setCargandoProyecto] = useState(false);
  const [descripcionLength, setDescripcionLength] = useState(0);

  const [latitud, setLatitud] = useState<number | null>(null);
  const [longitud, setLongitud] = useState<number | null>(null);
  const [direccion, setDireccion] = useState('');

  const [formData, setFormData] = useState({
    titulo: '',
    descripcion: '',
    categoria_7t: 'T2',
    gravedad: 'Bajo' as 'Bajo' | 'Medio' | 'Alto/Crítico',
    familias_afectadas: 0,
    personas_afectadas: 0,
    justificacion_critico: '',
  });
  const [fotosFiles, setFotosFiles] = useState<File[]>([]);
  const [actaFile, setActaFile] = useState<File | null>(null);
  const [existingFotosUrls, setExistingFotosUrls] = useState<string[]>([]);
  const [existingActaUrl, setExistingActaUrl] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const actaInputRef = useRef<HTMLInputElement>(null);

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
    if (isReportOpen || selectedNudo || showLinkModal) {
      document.body.classList.add('modal-open');
    } else {
      document.body.classList.remove('modal-open');
    }
    return () => document.body.classList.remove('modal-open');
  }, [isReportOpen, selectedNudo, showLinkModal]);

  useEffect(() => {
    const fetchConsejoId = async () => {
      if (!user?.id) return;
      const { data, error } = await supabase
        .from('datos_consejo_comunal')
        .select('id_consejo')
        .or(`id_usuario.eq.${user.id},id_usuario_auxiliar.eq.${user.id}`)
        .maybeSingle();
        if (error) {
          console.error('Error obteniendo consejo:', error);
          setLoading(false);
        } else if (data) {
          setConsejoId(data.id_consejo);
          setNoConsejo(false);
        } else {
          setNoConsejo(true);
          setLoading(false);
        }
    };
    fetchConsejoId();
  }, [user]);

  useEffect(() => {
    if (!consejoId) return;
    const fetchNudos = async () => {
      setLoading(true);
      const { data, error } = await supabase
        .from('nudos_criticos')
        .select('*')
        .eq('id_consejo', consejoId)
        .order('created_at', { ascending: false });
      if (error) console.error('Error cargando nudos:', error);
      else setNudos(data || []);
      setLoading(false);
    };
    fetchNudos();
  }, [consejoId]);

  useEffect(() => {
    if (selectedNudo?.id_proyecto) {
      setCargandoProyecto(true);
      supabase
        .from('proyectos')
        .select('codigo, nombre')
        .eq('id_proyecto', selectedNudo.id_proyecto)
        .single()
        .then(({ data, error }) => {
          if (data) setProyectoVinculado(data);
          else setProyectoVinculado(null);
          setCargandoProyecto(false);
        });
    } else {
      setProyectoVinculado(null);
    }
  }, [selectedNudo]);

  const fetchProyectosDisponibles = async (nudo: Nudo) => {
    if (!consejoId) return;
    const { data, error } = await supabase
      .from('proyectos')
      .select('id_proyecto, nombre, codigo, estado')
      .eq('id_consejo', consejoId)
      .order('created_at', { ascending: false });
    if (error) console.error(error);
    else {
      setProyectosDisponibles(data || []);
      setLinkingNudo(nudo);
      setSelectedProjectId(nudo.id_proyecto || null);
      setShowLinkModal(true);
    }
  };

  const linkProjectToNudo = async () => {
    if (!linkingNudo) return;
    const { error } = await supabase
      .from('nudos_criticos')
      .update({ id_proyecto: selectedProjectId || null })
      .eq('id_nudo', linkingNudo.id_nudo);
    if (error) showAlert('Error', 'No se pudo vincular el proyecto', 'danger');
    else {
      const { data: nudoActualizado } = await supabase
        .from('nudos_criticos')
        .select('*')
        .eq('id_nudo', linkingNudo.id_nudo)
        .single();
      setNudos(prev => prev.map(n => n.id_nudo === linkingNudo.id_nudo ? nudoActualizado : n));
      if (selectedNudo?.id_nudo === linkingNudo.id_nudo) setSelectedNudo(nudoActualizado);
      setShowLinkModal(false);
      setLinkingNudo(null);
      showAlert('Éxito', 'Proyecto vinculado correctamente', 'success');
    }
  };

  const uploadFotos = async (files: File[], nudoId: number): Promise<string[]> => {
    if (!consejoId) return [];
    const bucketName = 'documentos_consejos';
    const uploadedPaths: string[] = [];
    for (const file of files) {
      const fileExt = file.name.split('.').pop();
      const fileName = `${Date.now()}_${Math.random().toString(36).substring(7)}.${fileExt}`;
      const filePath = `${consejoId}/nudos_criticos/${nudoId}/${fileName}`;
      const { error } = await supabase.storage.from(bucketName).upload(filePath, file);
      if (error) {
        console.error('Error subiendo foto:', error);
        throw new Error(`Error al subir foto: ${error.message}`);
      }
      uploadedPaths.push(filePath);
    }
    return uploadedPaths;
  };

  const uploadActa = async (file: File, nudoId: number): Promise<string> => {
    if (!consejoId) throw new Error('Faltan datos');
    const bucketName = 'documentos_consejos';
    const fileExt = file.name.split('.').pop();
    const fileName = `${Date.now()}_acta_nudo_${nudoId}.${fileExt}`;
    const filePath = `${consejoId}/nudos_criticos/${nudoId}/${fileName}`;
    const { error } = await supabase.storage.from(bucketName).upload(filePath, file);
    if (error) throw new Error(`Error al subir acta: ${error.message}`);
    return filePath;
  };

  const eliminarArchivosAntiguos = async (nudoId: number) => {
    const { data: nudoActual } = await supabase
      .from('nudos_criticos')
      .select('fotos_urls, acta_url')
      .eq('id_nudo', nudoId)
      .single();
    if (nudoActual) {
      if (nudoActual.fotos_urls && nudoActual.fotos_urls.length) {
        await deleteFilesFromStorage(nudoActual.fotos_urls);
      }
      if (nudoActual.acta_url) {
        await deleteFilesFromStorage([nudoActual.acta_url]);
      }
    }
  };

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
    setFotosFiles([]);
    setActaFile(null);
    setExistingFotosUrls([]);
    setExistingActaUrl(null);
    setLatitud(null);
    setLongitud(null);
    setDireccion('');
    setEditMode(false);
    setEditingNudoId(null);
    setDescripcionLength(0);
  };

  const handleOpenCreate = () => {
    resetForm();
    setSelectedNudo(null);
    setIsReportOpen(true);
  };

  const handleViewDetail = (nudo: Nudo) => {
    setSelectedNudo(nudo);
    setIsReportOpen(false);
  };

  const handleEdit = (nudo: Nudo) => {
    setSelectedNudo(null);
    setEditingNudoId(nudo.id_nudo);
    setFormData({
      titulo: nudo.titulo,
      descripcion: nudo.descripcion || '',
      categoria_7t: nudo.categoria_7t,
      gravedad: nudo.gravedad,
      familias_afectadas: nudo.familias_afectadas || 0,
      personas_afectadas: nudo.personas_afectadas || 0,
      justificacion_critico: nudo.justificacion_critico || '',
    });
    setExistingFotosUrls(nudo.fotos_urls || []);
    setExistingActaUrl(nudo.acta_url || null);
    setLatitud(nudo.latitud || null);
    setLongitud(nudo.longitud || null);
    setDireccion(nudo.direccion || '');
    setFotosFiles([]);
    setActaFile(null);
    setEditMode(true);
    setIsReportOpen(true);
  };

  const handleDelete = async (nudo: Nudo) => {
    showConfirm(
      'Confirmar eliminación',
      '¿Eliminar este nudo crítico? También se borrarán las fotos y el acta.',
      async () => {
        if (nudo.fotos_urls && nudo.fotos_urls.length) {
          await deleteFilesFromStorage(nudo.fotos_urls);
        }
        if (nudo.acta_url) {
          await deleteFilesFromStorage([nudo.acta_url]);
        }
        const { error } = await supabase
          .from('nudos_criticos')
          .delete()
          .eq('id_nudo', nudo.id_nudo);
        if (error) showAlert('Error', 'No se pudo eliminar el nudo', 'danger');
        else {
          setNudos(prev => prev.filter(n => n.id_nudo !== nudo.id_nudo));
          if (selectedNudo?.id_nudo === nudo.id_nudo) setSelectedNudo(null);
          showAlert('Eliminado', 'Nudo crítico eliminado', 'success');
        }
      }
    );
  };

  const handleLocationSelect = (lat: number, lng: number) => {
    setLatitud(lat);
    setLongitud(lng);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (formData.descripcion.length < 100) {
      showAlert('Campos incompletos', 'La descripción debe tener al menos 100 caracteres', 'warning');
      return;
    }
    setSaving(true);
    try {
      let savedId: number | null = null;
      if (editMode && editingNudoId) {
        const { error: updateError } = await supabase
          .from('nudos_criticos')
          .update({
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
          })
          .eq('id_nudo', editingNudoId);
        if (updateError) throw updateError;
        savedId = editingNudoId;

        let newFotosPaths: string[] = [];
        if (fotosFiles.length > 0) {
          try {
            newFotosPaths = await uploadFotos(fotosFiles, savedId);
            if (existingFotosUrls.length > 0) {
              await deleteFilesFromStorage(existingFotosUrls);
            }
          } catch (uploadErr) {
            throw new Error(`Error al subir fotos: ${uploadErr}`);
          }
        }

        let newActaPath: string | null = null;
        if (actaFile) {
          try {
            newActaPath = await uploadActa(actaFile, savedId);
            if (existingActaUrl) {
              await deleteFilesFromStorage([existingActaUrl]);
            }
          } catch (uploadErr) {
            throw new Error(`Error al subir acta: ${uploadErr}`);
          }
        }

        const updateData: any = {};
        if (newFotosPaths.length > 0) updateData.fotos_urls = newFotosPaths;
        if (newActaPath) updateData.acta_url = newActaPath;
        if (Object.keys(updateData).length > 0) {
          await supabase.from('nudos_criticos').update(updateData).eq('id_nudo', savedId);
        }
      } else {
        const { data, error: insertError } = await supabase
          .from('nudos_criticos')
          .insert({
            id_consejo: consejoId,
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
          })
          .select()
          .single();
        if (insertError) throw insertError;
        savedId = data.id_nudo;

        let newFotosPaths: string[] = [];
        if (fotosFiles.length > 0) {
          newFotosPaths = await uploadFotos(fotosFiles, savedId);
        }
        let newActaPath: string | null = null;
        if (actaFile) {
          newActaPath = await uploadActa(actaFile, savedId);
        }

        const updateData: any = {};
        if (newFotosPaths.length > 0) updateData.fotos_urls = newFotosPaths;
        if (newActaPath) updateData.acta_url = newActaPath;
        if (Object.keys(updateData).length > 0) {
          await supabase.from('nudos_criticos').update(updateData).eq('id_nudo', savedId);
        }
      }

      const { data: refreshed } = await supabase
        .from('nudos_criticos')
        .select('*')
        .eq('id_consejo', consejoId)
        .order('created_at', { ascending: false });
      if (refreshed) setNudos(refreshed);

      setIsReportOpen(false);
      resetForm();
      showAlert('Éxito', editMode ? 'Nudo actualizado' : 'Nudo reportado', 'success');
    } catch (err: any) {
      console.error(err);
      showAlert('Error', err.message || 'Ocurrió un error al guardar', 'danger');
    } finally {
      setSaving(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    if (name === 'descripcion') setDescripcionLength(value.length);
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) setFotosFiles(Array.from(e.target.files));
  };

  const handleActaChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) setActaFile(e.target.files[0]);
  };

  const handleViewPhoto = async (publicUrl: string) => {
    const signedUrl = await getSignedUrlFromStorage(publicUrl);
    if (signedUrl) window.open(signedUrl, '_blank');
    else showAlert('Error', 'No se pudo cargar la foto', 'danger');
  };

  const handleViewActa = async (publicUrl: string | null) => {
    if (!publicUrl) return;
    const signedUrl = await getSignedUrlFromStorage(publicUrl);
    if (signedUrl) window.open(signedUrl, '_blank');
    else showAlert('Error', 'No se pudo cargar el acta', 'danger');
  };

  if (loading) return <div className="flex justify-center p-12"><Loader2 className="animate-spin text-brand-primary" size={32} /></div>;

  if (noConsejo) {
    function onNavigate(arg0: string): void {
      throw new Error("Function not implemented.");
    }
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
      {/* Cabecera */}
      <div className="bg-white border border-gray-100 rounded-2xl p-4 flex flex-col md:flex-row items-center gap-4 shadow-sm">
        <div className="h-12 w-12 rounded-xl bg-indigo-50 flex items-center justify-center text-brand-primary shadow-md shrink-0">
          <AlertCircle className="h-6 w-6" />
        </div>
        <div className="text-center md:text-left">
          <h3 className="text-base font-black text-900 italic uppercase tracking-tighter">
            Gestión de Nudos Críticos
          </h3>
          <p className="text-700/70 text-[9px] font-bold uppercase tracking-wider mt-0.5">
            Identificación de obstáculos prioritarios (Agenda ACA)
          </p>
        </div>
        <button onClick={handleOpenCreate} className="md:ml-auto bg-brand-primary text-white px-4 py-2 rounded-lg text-[9px] font-black uppercase tracking-wider shadow-md hover:scale-105 transition-all">
          Reportar Nudo Crítico
        </button>
      </div>

      {/* Lista de nudos */}
      <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
        {nudos.map((nudo) => (
          <NudoCard key={nudo.id_nudo} nudo={nudo} onView={handleViewDetail} onEdit={handleEdit} onDelete={handleDelete} />
        ))}
        {nudos.length === 0 && <div className="col-span-full text-center py-8 text-slate-400 text-xs">No hay nudos críticos reportados</div>}
      </div>

      {/* MODAL DE CREACIÓN/EDICIÓN - REDUCIDO */}
      <AnimatePresence>
        {isReportOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setIsReportOpen(false)} className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" />
            <motion.div initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 20 }} className="relative w-full max-w-4xl bg-white rounded-2xl shadow-2xl overflow-hidden max-h-[90vh] overflow-y-auto">
              <div className="p-4 border-b border-gray-50 flex items-center justify-between sticky top-0 bg-white z-10">
                <h4 className="text-base font-black text-slate-800 uppercase tracking-wider">{editMode ? "Editar" : "Reportar"} Nudo</h4>
                <button onClick={() => setIsReportOpen(false)} className="p-1.5 rounded-xl hover:bg-gray-100"><X className="h-4 w-4 text-slate-400" /></button>
              </div>
              <form onSubmit={handleSubmit} className="p-4">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                  {/* COLUMNA IZQUIERDA */}
                  <div className="space-y-3">
                    <div className="grid grid-cols-2 gap-2">
                      <div className="space-y-1">
                        <label className="text-[8px] font-bold text-slate-400 uppercase tracking-wider">Transformación</label>
                        <select name="categoria_7t" value={formData.categoria_7t} onChange={handleInputChange} className="w-full p-2 rounded-lg bg-gray-50 text-[10px] font-bold uppercase focus:ring-2 focus:ring-brand-primary/20">
                          <option value="T1">T1 Económica</option>
                          <option value="T2">T2 Servicios</option>
                          <option value="T3">T3 Seguridad</option>
                          <option value="T4">T4 Social</option>
                          <option value="T5">T5 Política</option>
                          <option value="T6">T6 Ciencia</option>
                          <option value="T7">T7 Geopolítica</option>
                        </select>
                      </div>
                      <div className="space-y-1">
                        <label className="text-[8px] font-bold text-slate-400 uppercase tracking-wider">Gravedad</label>
                        <div className="flex gap-1">
                          {["Bajo","Medio","Alto/Crítico"].map(g => (
                            <button key={g} type="button" onClick={() => setFormData(prev => ({ ...prev, gravedad: g as any }))} className={cn("flex-1 py-1.5 rounded-lg text-[8px] font-black uppercase border", formData.gravedad === g ? "border-brand-primary bg-brand-primary text-white" : "border-gray-200 bg-gray-50 text-slate-500")}>
                              {g}
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>

                    <div className="space-y-1">
                      <label className="text-[8px] font-bold text-slate-400 uppercase tracking-wider">Título</label>
                      <input name="titulo" value={formData.titulo} onChange={handleInputChange} className="w-full p-2 rounded-lg bg-gray-50 text-[10px] font-bold focus:ring-2 focus:ring-brand-primary/20" required />
                    </div>

                    <div className="space-y-1">
                      <div className="flex justify-between items-center">
                        <label className="text-[8px] font-bold text-slate-400 uppercase tracking-wider">Descripción *</label>
                        <span className={cn("text-[7px] font-bold px-1.5 py-0.5 rounded-full", descripcionLength >= 100 ? "bg-emerald-100 text-emerald-700" : "bg-rose-100 text-rose-700")}>
                          {descripcionLength}/100
                        </span>
                      </div>
                      <textarea name="descripcion" rows={2} value={formData.descripcion} onChange={handleInputChange} className={cn("w-full p-2 rounded-lg bg-gray-50 text-[10px] font-bold resize-none", descripcionLength >= 100 ? "ring-emerald-200 ring-2" : "ring-rose-200 ring-2")} required />
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      <div><label className="text-[8px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Familias</label><input name="familias_afectadas" type="number" value={formData.familias_afectadas} onChange={handleInputChange} className="w-full p-2 rounded-lg bg-gray-50 text-[10px] font-bold" /></div>
                      <div><label className="text-[8px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Personas</label><input name="personas_afectadas" type="number" value={formData.personas_afectadas} onChange={handleInputChange} className="w-full p-2 rounded-lg bg-gray-50 text-[10px] font-bold" /></div>
                    </div>

                    <div className="space-y-2">
                      <label className="text-[8px] font-bold text-slate-400 uppercase tracking-wider">Evidencias</label>
                      {(existingFotosUrls.length > 0 || existingActaUrl) && (
                        <div className="flex flex-wrap gap-1.5 p-2 bg-gray-50 rounded-lg">
                          {existingFotosUrls.map((url, idx) => <button key={idx} type="button" onClick={() => handleViewPhoto(url)} className="px-1.5 py-1 bg-blue-100 text-[8px] rounded-lg"> {idx+1}</button>)}
                          {existingActaUrl && <button type="button" onClick={() => handleViewActa(existingActaUrl)} className="px-1.5 py-1 bg-emerald-100 text-[8px] rounded-lg"> Acta</button>}
                        </div>
                      )}
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <input type="file" multiple accept="image/*" ref={fileInputRef} className="hidden" onChange={handleFileChange} />
                          <button type="button" onClick={() => fileInputRef.current?.click()} className="w-full p-1.5 bg-white border border-brand-primary/20 text-brand-primary text-[8px] font-bold uppercase rounded-lg"> Fotos</button>
                          {fotosFiles.length > 0 && <p className="text-[7px] text-emerald-600 mt-1">{fotosFiles.length} foto(s)</p>}
                        </div>
                        <div>
                          <input type="file" accept=".pdf,.doc,.docx" ref={actaInputRef} className="hidden" onChange={handleActaChange} />
                          <button type="button" onClick={() => actaInputRef.current?.click()} className="w-full p-1.5 bg-white border border-emerald-200 text-emerald-600 text-[8px] font-bold uppercase rounded-lg"> Acta</button>
                          {actaFile && <p className="text-[7px] text-emerald-600 mt-1 truncate">{actaFile.name}</p>}
                        </div>
                      </div>
                    </div>
                    
                    {formData.gravedad === 'Alto/Crítico' && (
                      <div className="space-y-1">
                        <label className="text-[8px] font-bold text-slate-400 uppercase tracking-wider">Justificación Crítica</label>
                        <textarea name="justificacion_critico" rows={2} value={formData.justificacion_critico} onChange={handleInputChange} className="w-full p-2 rounded-lg bg-rose-50 text-[10px]" placeholder="Explica por qué es crítico..." />
                      </div>
                    )}
                  </div>

                  {/* COLUMNA DERECHA - Mapa */}
                  <div className="space-y-3">
                    <div className="bg-gradient-to-r from-indigo-50 to-blue-50 p-3 rounded-xl border border-indigo-100">
                      <div className="flex items-center gap-1.5 mb-2">
                        <MapPin className="h-3.5 w-3.5 text-indigo-600" />
                        <label className="text-[8px] font-bold text-indigo-700 uppercase tracking-wider">Ubicación del Nudo</label>
                      </div>
                      <LocationSelector 
                        onLocationSelect={handleLocationSelect}
                        initialLat={latitud || undefined}
                        initialLng={longitud || undefined}
                      />
                      <div className="mt-2">
                        <label className="text-[8px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Dirección / Referencia</label>
                        <input 
                          type="text" 
                          value={direccion} 
                          onChange={(e) => setDireccion(e.target.value)}
                          placeholder="Ej: Calle Principal, Casa #123..."
                          className="w-full p-2 rounded-lg bg-white border border-gray-200 text-[10px] focus:ring-2 focus:ring-indigo-500"
                        />
                      </div>
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

      {/* MODAL DE DETALLE - REDUCIDO Y CON BOTONES EN MISMA LÍNEA */}
      <AnimatePresence>
        {selectedNudo && !isReportOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setSelectedNudo(null)} className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" />
            <motion.div initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 20 }} className="relative w-full max-w-xl bg-white rounded-2xl shadow-2xl p-6 max-h-[80vh] overflow-y-auto">
              <div className="flex justify-between items-start mb-4">
                <div className="h-12 w-12 rounded-xl bg-brand-primary/10 flex items-center justify-center text-brand-primary">
                  <AlertCircle className="h-6 w-6" />
                </div>
                <button onClick={() => setSelectedNudo(null)} className="p-1.5 rounded-xl hover:bg-gray-100"><X className="h-4 w-4 text-slate-400" /></button>
              </div>
              <h4 className="text-lg font-black text-slate-800 italic uppercase leading-tight mb-2">{selectedNudo.titulo}</h4>
              <div className="flex items-center gap-2 mb-4">
                <span className={cn("text-[9px] font-black px-2 py-0.5 rounded-lg uppercase border", selectedNudo.gravedad === "Alto/Crítico" ? "bg-rose-50 text-rose-500 border-rose-100" : "bg-amber-50 text-amber-600 border-amber-100")}>{selectedNudo.gravedad}</span>
                <span className="text-[9px] font-black px-2 py-0.5 bg-slate-50 text-slate-400 rounded-lg uppercase">{selectedNudo.categoria_7t}</span>
              </div>
              
              {/* Descripción con scroll */}
              <div className="max-h-32 overflow-y-auto mb-3 p-2 bg-gray-50 rounded-lg">
                <p className="text-xs text-gray-600">{selectedNudo.descripcion}</p>
              </div>
              
              {selectedNudo.direccion && (
                <div className="mb-3 p-2 bg-gray-50 rounded-lg">
                  <p className="text-[8px] font-bold text-slate-400 uppercase mb-1"> Dirección</p>
                  <p className="text-[10px] text-slate-700">{selectedNudo.direccion}</p>
                </div>
              )}
              
              {(selectedNudo.latitud && selectedNudo.longitud) && (
                <div className="mb-3 p-2 bg-indigo-50 rounded-lg">
                  <p className="text-[8px] font-bold text-indigo-600 uppercase mb-1">Coordenadas</p>
                  <p className="text-[10px] font-mono">{selectedNudo.latitud.toFixed(6)}, {selectedNudo.longitud.toFixed(6)}</p>
                </div>
              )}
              
              <div className="grid grid-cols-2 gap-3 py-3 border-y border-gray-50">
                <div className="flex justify-between"><span className="text-[8px] font-bold text-slate-400">Familias afectadas</span><span className="text-[10px] font-black">{selectedNudo.familias_afectadas ?? '—'}</span></div>
                <div className="flex justify-between"><span className="text-[8px] font-bold text-slate-400">Personas afectadas</span><span className="text-[10px] font-black">{selectedNudo.personas_afectadas ?? '—'}</span></div>
              </div>
              {selectedNudo.justificacion_critico && <div className="mt-3 p-3 bg-rose-50 rounded-lg"><p className="text-[8px] font-bold text-rose-500 uppercase">Justificación crítica</p><p className="text-[10px] font-medium mt-1">{selectedNudo.justificacion_critico}</p></div>}
              
              {/* Fotos y Acta en misma línea */}
              <div className="mt-4">
                <p className="text-[8px] font-bold text-slate-400 uppercase mb-2">Documentos</p>
                <div className="flex gap-2">
                  {selectedNudo.fotos_urls && selectedNudo.fotos_urls.length > 0 ? (
                    selectedNudo.fotos_urls.map((path, i) => (
                      <button key={i} onClick={() => handleViewPhoto(path)} className="flex-1 py-1.5 px-2 bg-gray-100 rounded-lg text-[8px] font-bold hover:bg-brand-primary/10 text-center truncate">
                        Foto {i+1}
                      </button>
                    ))
                  ) : (
                    <div className="flex-1 py-1.5 px-2 bg-gray-100 rounded-lg text-[8px] text-slate-400 text-center">Sin fotos</div>
                  )}
                  {selectedNudo.acta_url ? (
                    <button onClick={() => handleViewActa(selectedNudo.acta_url)} className="flex-1 py-1.5 px-2 bg-emerald-50 text-emerald-700 rounded-lg text-[8px] font-bold hover:bg-emerald-100 text-center truncate">
                      Acta
                    </button>
                  ) : (
                    <div className="flex-1 py-1.5 px-2 bg-gray-100 rounded-lg text-[8px] text-slate-400 text-center">Sin acta</div>
                  )}
                </div>
              </div>
              
              <div className="mt-4 pt-3 border-t border-gray-100">
                <p className="text-[8px] font-bold text-slate-400 uppercase mb-2">Proyecto</p>
                {selectedNudo.id_proyecto ? (
                  cargandoProyecto ? <div className="flex justify-center py-2"><Loader2 className="animate-spin text-brand-primary" size={16} /></div> : proyectoVinculado ? (
                    <div className="p-2 bg-brand-primary/5 rounded-lg border border-brand-primary/10"><p className="text-[8px] font-black text-brand-primary uppercase">{proyectoVinculado.codigo}</p><p className="text-[10px] font-bold text-slate-800 mt-0.5">{proyectoVinculado.nombre}</p></div>
                  ) : <p className="text-[10px] text-slate-400 italic">Proyecto no encontrado</p>
                ) : <p className="text-[10px] text-slate-400 italic">Sin proyecto vinculado</p>}
              </div>
              <div className="mt-4 flex gap-2">
                <button onClick={() => { setSelectedNudo(null); handleEdit(selectedNudo!); }} className="flex-1 py-2 rounded-lg bg-slate-100 text-slate-600 text-[8px] font-black uppercase">Editar</button>
                <button onClick={() => handleDelete(selectedNudo!)} className="flex-1 py-2 rounded-lg bg-rose-50 text-rose-600 text-[8px] font-black uppercase">Eliminar</button>
                <button onClick={() => { setSelectedNudo(null); fetchProyectosDisponibles(selectedNudo!); }} className="flex-1 py-2 rounded-lg bg-brand-primary text-white text-[8px] font-black uppercase shadow-lg">Vincular Proyecto</button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* MODAL VINCULACIÓN PROYECTOS (reducido) */}
      <AnimatePresence>
        {showLinkModal && linkingNudo && (
          <div className="fixed inset-0 z-100 flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setShowLinkModal(false)} className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" />
            <motion.div initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 20 }} className="relative w-full max-w-lg bg-white rounded-2xl shadow-2xl p-6">
              <div className="flex justify-between items-center mb-4">
                <div><h4 className="text-base font-black text-slate-800 italic uppercase">Vincular Proyecto</h4><p className="text-[9px] text-slate-400 mt-1">{linkingNudo.titulo}</p></div>
                <button onClick={() => setShowLinkModal(false)} className="p-1.5 rounded-xl hover:bg-gray-100"><X className="h-4 w-4 text-slate-400" /></button>
              </div>
              <div className="space-y-4">
                <div>
                  <label className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Seleccionar Proyecto</label>
                  <select className="w-full p-3 rounded-xl bg-gray-50 mt-1 text-[10px]" value={selectedProjectId || ""} onChange={(e) => setSelectedProjectId(e.target.value ? parseInt(e.target.value) : null)}>
                    <option value="">Ninguno (Desvincular)</option>
                    {proyectosDisponibles.map(p => <option key={p.id_proyecto} value={p.id_proyecto}>{p.codigo} - {p.nombre} ({p.estado})</option>)}
                  </select>
                </div>
                <div className="flex gap-2 pt-2">
                  <button onClick={() => setShowLinkModal(false)} className="flex-1 py-2.5 rounded-xl border border-gray-200 text-slate-600 text-[8px] font-black uppercase">Cancelar</button>
                  <button onClick={linkProjectToNudo} className="flex-1 py-2.5 rounded-xl bg-brand-primary text-white text-[8px] font-black uppercase">Vincular</button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* AlertModal */}
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

// Componente tarjeta (sin cambios)
const NudoCard = ({ nudo, onView, onEdit, onDelete }: { nudo: Nudo; onView: (n: Nudo) => void; onEdit: (n: Nudo) => void; onDelete: (n: Nudo) => void }) => {
  const getIcon = () => {
    switch (nudo.categoria_7t) {
      case 'T1': return Building2;
      case 'T2': return Construction;
      default: return Activity;
    }
  };
  const Icon = getIcon();
  return (
    <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm group hover:shadow-md transition-all">
      <div className="flex justify-between items-start mb-3">
        <div className="h-9 w-9 rounded-xl bg-gray-50 flex items-center justify-center text-slate-400 group-hover:text-brand-primary group-hover:bg-brand-primary/10 transition-all">
          <Icon className="h-4 w-4" />
        </div>
        <div className="flex items-center gap-1.5 flex-wrap">
          {nudo.id_proyecto && <span className="text-[7px] font-black px-1.5 py-0.5 rounded-full bg-green-100 text-green-600 border border-green-200">Vinculado</span>}
          <span className={cn("text-[7px] font-black px-1.5 py-0.5 rounded-full uppercase border", nudo.gravedad === "Alto/Crítico" ? "bg-rose-50 text-rose-600 border-rose-100" : "bg-amber-50 text-amber-600 border-amber-100")}>{nudo.gravedad}</span>
        </div>
      </div>
      <p className="text-[8px] font-black text-slate-400 uppercase tracking-wider mb-0.5">{nudo.categoria_7t} • ID:{nudo.id_nudo}</p>
      <h4 className="text-xs font-black text-slate-800 leading-tight mb-3 line-clamp-2">{nudo.titulo}</h4>
      <div className="flex items-center justify-between pt-2 border-t border-gray-50">
        <p className="text-[9px] font-bold text-slate-400 italic">{nudo.familias_afectadas ?? 0} Familias</p>
        <div className="flex gap-1.5">
          <button onClick={() => onView(nudo)} className="p-1 text-slate-400 hover:text-brand-primary transition-colors"><Eye className="h-3 w-3" /></button>
          <button onClick={() => onEdit(nudo)} className="p-1 text-slate-400 hover:text-brand-primary transition-colors"><Edit className="h-3 w-3" /></button>
          <button onClick={() => onDelete(nudo)} className="p-1 text-slate-400 hover:text-rose-500 transition-colors"><Trash2 className="h-3 w-3" /></button>
        </div>
      </div>
    </div>
  );
};