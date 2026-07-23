"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Save, AlertCircle, Plus, Trash2, Target, Zap, X, PlusCircle, FileCheck,
  Camera, ImageIcon, LayoutGrid, ChevronRight, Loader2, Eye, Edit, Upload, CheckCircle2
} from "lucide-react";
import { supabase } from "@/app/lib/supabaseClient";
import { useAuth } from "@/context/AuthContext";
import { cn } from "@/app/lib/utils";
import { AlertModal } from "@/app/components/AlertModal";

// ==================== TIPOS ====================
interface Sueno {
  id_sueno: number;
  id_consejo: number;
  area_trabajo: string;
  problema: string;
  solucion: string;
  responsable: string;
  ubicacion: string;
  fortaleza: string;
  transformacion_7t: string;
  imagen_url: string | null;
}

interface SuenoComuna {
  id_sueno_comuna: number;
  id_comuna: number;
  area_trabajo: string;
  problema: string;
  solucion: string | null;
  ubicacion: string | null;
  fortaleza: string | null;
  transformacion_7t: string | null;
  imagen_url: string | null;
  nombre_responsable: string | null;
  apellido_responsable: string | null;
  cedula_responsable: string | null;
  created_at?: string;
}

interface Consejo {
  id_consejo: number;
  nombre_consejo: string;
}

// ========== FUNCIÓN PARA OBTENER URL FIRMADA (compatible con rutas relativas) ==========
const getSignedUrlFromPath = async (path: string | null, defaultBucket: string = 'documentos_comuna'): Promise<string | null> => {
  if (!path) return null;
  let cleanPath = path;
  if (path.startsWith('http')) {
    try {
      const url = new URL(path);
      const pathParts = url.pathname.split('/');
      const publicIndex = pathParts.indexOf('public');
      if (publicIndex !== -1 && publicIndex + 1 < pathParts.length) {
        const bucket = pathParts[publicIndex + 1];
        const relative = pathParts.slice(publicIndex + 2).join('/');
        const { data, error } = await supabase.storage.from(bucket).createSignedUrl(relative, 3600);
        if (error) return null;
        return data.signedUrl;
      } else {
        return path;
      }
    } catch (err) {
      console.error('Error parseando URL:', err);
      return null;
    }
  } else {
    // Ruta relativa: usar bucket por defecto
    cleanPath = cleanPath.replace(/^\/+/, '');
    const { data, error } = await supabase.storage.from(defaultBucket).createSignedUrl(cleanPath, 3600);
    if (error) {
      console.error(`Error generando URL firmada:`, error.message);
      return null;
    }
    return data.signedUrl;
  }
};

// ==================== COMPONENTE PRINCIPAL ====================
export const MapaSuenosC = () => {
  const { user } = useAuth();
  const [comunaId, setComunaId] = useState<number | null>(null);
  const [noComuna, setNoComuna] = useState(false);
  const [consejos, setConsejos] = useState<Consejo[]>([]);
  const [suenosConsejos, setSuenosConsejos] = useState<Sueno[]>([]);
  const [suenosComuna, setSuenosComuna] = useState<SuenoComuna[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedConsejo, setSelectedConsejo] = useState<Consejo | null>(null);
  const [openModal, setOpenModal] = useState(false);
  const [viewSueno, setViewSueno] = useState<Sueno | null>(null);

  // Estados para gestión de sueños de la comuna
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({
    area_trabajo: '',
    problema: '',
    solucion: '',
    ubicacion: '',
    fortaleza: '',
    transformacion_7t: '',
    nombre_responsable: '',
    apellido_responsable: '',
    cedula_responsable: '',
  });

  // === ESTADOS PARA MAPA COMUNAL ===
  const [mapaComunaImagenUrl, setMapaComunaImagenUrl] = useState<string | null>(null);
  const [mapaComunaDescripcion, setMapaComunaDescripcion] = useState<string>("");
  const [isMapaComunaModalOpen, setIsMapaComunaModalOpen] = useState(false);
  const [tempComunaDescripcion, setTempComunaDescripcion] = useState("");
  const [tempComunaImagenPreview, setTempComunaImagenPreview] = useState<string | null>(null);
  const [tempComunaImagenFile, setTempComunaImagenFile] = useState<File | null>(null);
  const [updatingComunaMapa, setUpdatingComunaMapa] = useState(false);
  const comunaMapaFileInputRef = useRef<HTMLInputElement>(null);
  const [currentMapaImagenPath, setCurrentMapaImagenPath] = useState<string | null>(null);

  const transformaciones7T = [
    "T1: Económica (Producción)",
    "T2: Servicios Públicos",
    "T3: Seguridad y Paz",
    "T4: Social",
    "T5: Participación Política",
    "T6: Ecología",
    "T7: Geopolítica"
  ];

  // ==================== ESTADO PARA ALERT MODAL ====================
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
    if (isFormOpen || isMapaComunaModalOpen || selectedConsejo || openModal || modalState.isOpen) {
      document.body.classList.add('modal-open');
    } else {
      document.body.classList.remove('modal-open');
    }
    return () => document.body.classList.remove('modal-open');
  }, [isFormOpen, isMapaComunaModalOpen, selectedConsejo, openModal, modalState.isOpen]);

  // ========== CARGAR COMUNA DEL USUARIO ==========
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
      if (error) {
        console.error('Error cargando comuna:', error);
        setLoading(false);
      } else if (data) {
        setComunaId(data.id_comuna);
      } else {
        setNoComuna(true);
        setLoading(false);
      }
    };
    fetchComuna();
  }, [user]);

  // ========== CARGAR CONSEJOS Y SUS SUEÑOS ==========
  useEffect(() => {
    if (!comunaId) return;
    const fetchConsejosYSuenos = async () => {
      setLoading(true);
      try {
        const { data: sectores, error: sectError } = await supabase
          .from('sectores')
          .select('id_sector')
          .eq('id_datos_comuna', comunaId)
          .eq('activo', true);
        if (sectError) throw sectError;
        if (!sectores || sectores.length === 0) {
          setConsejos([]);
          setSuenosConsejos([]);
          setLoading(false);
          return;
        }
        const sectorIds = sectores.map(s => s.id_sector);
        const { data: consejosData, error: conseError } = await supabase
          .from('datos_consejo_comunal')
          .select('id_consejo, nombre_consejo')
          .in('id_sector', sectorIds);
        if (conseError) throw conseError;
        setConsejos(consejosData || []);
        if (consejosData && consejosData.length) {
          const consejoIds = consejosData.map(c => c.id_consejo);
          const { data: suenosData, error: suenosError } = await supabase
            .from('mapa_suenos')
            .select('*')
            .in('id_consejo', consejoIds)
            .order('created_at', { ascending: false });
          if (suenosError) throw suenosError;
          setSuenosConsejos(suenosData || []);
        } else {
          setSuenosConsejos([]);
        }
      } catch (error) {
        console.error('Error cargando consejos/sueños:', error);
        setConsejos([]);
        setSuenosConsejos([]);
      } finally {
        setLoading(false);
      }
    };
    fetchConsejosYSuenos();
  }, [comunaId]);

  // ========== CARGAR SUEÑOS DE LA COMUNA ==========
  useEffect(() => {
    if (!comunaId) return;
    const fetchSuenosComuna = async () => {
      const { data, error } = await supabase
        .from('mapa_suenos_comuna')
        .select('*')
        .eq('id_comuna', comunaId)
        .order('created_at', { ascending: false });
      if (error) {
        console.error('Error cargando sueños de la comuna:', error);
      } else {
        setSuenosComuna(data || []);
      }
    };
    fetchSuenosComuna();
  }, [comunaId]);

  // ========== CARGAR MAPA COMUNAL ==========
  useEffect(() => {
    if (!comunaId) return;

    const fetchMapaComunal = async () => {
      try {
        const { data, error } = await supabase
          .from('datos_comuna')
          .select('mapa_imagen_url, mapa_descripcion')
          .eq('id_comuna', comunaId)
          .maybeSingle();

        if (error && error.code !== 'PGRST116') {
          console.error('Error cargando mapa comunal:', error);
          return;
        }

        const imagenRelativa = data?.mapa_imagen_url || null;
        const descripcion = data?.mapa_descripcion || "";
        setCurrentMapaImagenPath(imagenRelativa);
        setMapaComunaDescripcion(descripcion);
        setTempComunaDescripcion(descripcion);

        if (imagenRelativa) {
          const signedUrl = await getSignedUrlFromPath(imagenRelativa);
          if (signedUrl) {
            setMapaComunaImagenUrl(signedUrl);
            setTempComunaImagenPreview(signedUrl);
          } else {
            setMapaComunaImagenUrl(null);
            setTempComunaImagenPreview(null);
          }
        } else {
          setMapaComunaImagenUrl(null);
          setTempComunaImagenPreview(null);
        }
      } catch (error) {
        console.error('Error inesperado cargando mapa comunal:', error);
        setMapaComunaImagenUrl(null);
        setMapaComunaDescripcion("");
        setTempComunaDescripcion("");
      }
    };

    fetchMapaComunal();
  }, [comunaId]);

  // ========== SUBIR IMAGEN (devuelve ruta relativa) ==========
  const uploadComunaMapaImagen = async (file: File): Promise<string | null> => {
    if (!user?.id || !comunaId) return null;

    const fileExt = file.name.split('.').pop();
    const fileName = `mapa_${Date.now()}.${fileExt}`;
    const filePath = `${comunaId}/${fileName}`;

    const { error } = await supabase.storage
      .from('documentos_comuna')
      .upload(filePath, file, { upsert: true });

    if (error) {
      console.error('Error subiendo imagen del mapa comunal:', error);
      return null;
    }

    return filePath;
  };

  const handleComunaMapaImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setTempComunaImagenFile(file);
      const reader = new FileReader();
      reader.onloadend = () => setTempComunaImagenPreview(reader.result as string);
      reader.readAsDataURL(file);
    }
  };

  const saveComunaMapaChanges = async () => {
    if (!comunaId) return;
    setUpdatingComunaMapa(true);

    try {
      let nuevaRutaRelativa: string | null = currentMapaImagenPath;

      if (tempComunaImagenFile) {
        if (currentMapaImagenPath) {
          const { error: deleteError } = await supabase.storage
            .from('documentos_comuna')
            .remove([currentMapaImagenPath]);
          if (deleteError) {
            console.error('Error eliminando imagen anterior:', deleteError);
          }
        }
        const relativePath = await uploadComunaMapaImagen(tempComunaImagenFile);
        if (!relativePath) {
          showAlert('Error', 'No se pudo subir la nueva imagen', 'danger');
          return;
        }
        nuevaRutaRelativa = relativePath;
      }

      const { error } = await supabase
        .from('datos_comuna')
        .update({
          mapa_imagen_url: nuevaRutaRelativa,
          mapa_descripcion: tempComunaDescripcion
        })
        .eq('id_comuna', comunaId);

      if (error) {
        console.error('Error guardando cambios del mapa comunal:', error);
        showAlert('Error', 'No se pudieron guardar los cambios', 'danger');
        return;
      }

      setCurrentMapaImagenPath(nuevaRutaRelativa);
      if (nuevaRutaRelativa) {
        const signed = await getSignedUrlFromPath(nuevaRutaRelativa);
        setMapaComunaImagenUrl(signed);
        setTempComunaImagenPreview(signed);
      } else {
        setMapaComunaImagenUrl(null);
        setTempComunaImagenPreview(null);
      }
      setMapaComunaDescripcion(tempComunaDescripcion);
      showAlert('Éxito', 'Cambios guardados con éxito', 'success');
      setIsMapaComunaModalOpen(false);
      setTempComunaImagenFile(null);
    } catch (err) {
      console.error('Error inesperado:', err);
      showAlert('Error', 'Ocurrió un error al guardar', 'danger');
    } finally {
      setUpdatingComunaMapa(false);
    }
  };

  const openComunaMapaModal = () => {
    setTempComunaDescripcion(mapaComunaDescripcion);
    setTempComunaImagenPreview(mapaComunaImagenUrl);
    setTempComunaImagenFile(null);
    setIsMapaComunaModalOpen(true);
  };

  // ========== FUNCIONES CRUD PARA SUEÑOS DE COMUNA ==========
  const resetForm = () => {
    setFormData({
      area_trabajo: '',
      problema: '',
      solucion: '',
      ubicacion: '',
      fortaleza: '',
      transformacion_7t: '',
      nombre_responsable: '',
      apellido_responsable: '',
      cedula_responsable: '',
    });
    setEditMode(false);
    setEditingId(null);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!comunaId) {
      showAlert('Error', 'Comuna no identificada', 'danger');
      return;
    }
    if (!formData.area_trabajo || !formData.problema) {
      showAlert('Campos requeridos', 'Complete al menos el Área de trabajo y el Problema', 'warning');
      return;
    }
    const cedula = formData.cedula_responsable.trim();
    if (cedula && !/^[VEve]-?\d{1,8}$/.test(cedula)) {
      showAlert('Formato inválido', 'La cédula debe tener formato V-12345678 o E-12345678', 'danger');
      return;
    }

    setSaving(true);
    try {
      const suenoData = {
        id_comuna: comunaId,
        area_trabajo: formData.area_trabajo,
        problema: formData.problema,
        solucion: formData.solucion || null,
        ubicacion: formData.ubicacion || null,
        fortaleza: formData.fortaleza || null,
        transformacion_7t: formData.transformacion_7t || null,
        nombre_responsable: formData.nombre_responsable.trim() || null,
        apellido_responsable: formData.apellido_responsable.trim() || null,
        cedula_responsable: cedula || null,
      };

      let newSueno: SuenoComuna;
      if (editMode && editingId) {
        const { data, error } = await supabase
          .from('mapa_suenos_comuna')
          .update(suenoData)
          .eq('id_sueno_comuna', editingId)
          .select()
          .single();
        if (error) throw error;
        newSueno = data;
        setSuenosComuna(prev => prev.map(s => s.id_sueno_comuna === editingId ? newSueno : s));
        showAlert('Éxito', 'Sueño actualizado correctamente', 'success');
      } else {
        const { data, error } = await supabase
          .from('mapa_suenos_comuna')
          .insert([suenoData])
          .select()
          .single();
        if (error) throw error;
        newSueno = data;
        setSuenosComuna(prev => [newSueno, ...prev]);
        showAlert('Éxito', 'Sueño registrado correctamente', 'success');
      }
      resetForm();
      setIsFormOpen(false);
    } catch (error) {
      console.error('Error guardando sueño:', error);
      showAlert('Error', 'Error al guardar el sueño', 'danger');
    } finally {
      setSaving(false);
    }
  };

  const handleEdit = (sueno: SuenoComuna) => {
    setEditMode(true);
    setEditingId(sueno.id_sueno_comuna);
    setFormData({
      area_trabajo: sueno.area_trabajo,
      problema: sueno.problema,
      solucion: sueno.solucion || '',
      ubicacion: sueno.ubicacion || '',
      fortaleza: sueno.fortaleza || '',
      transformacion_7t: sueno.transformacion_7t || '',
      nombre_responsable: sueno.nombre_responsable || '',
      apellido_responsable: sueno.apellido_responsable || '',
      cedula_responsable: sueno.cedula_responsable || '',
    });
    setIsFormOpen(true);
  };

  const handleDelete = async (id_sueno_comuna: number) => {
    showConfirm(
      'Confirmar eliminación',
      '¿Eliminar este sueño? No se podrá recuperar.',
      async () => {
        const { error } = await supabase
          .from('mapa_suenos_comuna')
          .delete()
          .eq('id_sueno_comuna', id_sueno_comuna);
        if (error) {
          console.error('Error eliminando:', error);
          showAlert('Error', 'No se pudo eliminar el sueño', 'danger');
        } else {
          setSuenosComuna(prev => prev.filter(s => s.id_sueno_comuna !== id_sueno_comuna));
          showAlert('Eliminado', 'Sueño eliminado correctamente', 'success');
        }
      }
    );
  };

  const verDetalleSueno = async (sueno: Sueno) => {
    let imagenUrl = sueno.imagen_url;
    if (imagenUrl) {
      const signed = await getSignedUrlFromPath(imagenUrl);
      if (signed) imagenUrl = signed;
    }
    setViewSueno({ ...sueno, imagen_url: imagenUrl });
    setOpenModal(true);
  };

  const descripcionComunaResumen = mapaComunaDescripcion.length > 100
    ? mapaComunaDescripcion.substring(0, 100) + "..."
    : mapaComunaDescripcion;

  if (loading) {
    return (
      <div className="flex justify-center p-8">
        <Loader2 className="animate-spin text-brand-primary h-7 w-7" />
      </div>
    );
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
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div>
          <h2 className="text-base font-black text-slate-800 italic uppercase tracking-tighter flex items-center gap-2">
            <Target className="h-5 w-5 text-brand-primary" /> Mapa de los Sueños (ACA)
          </h2>
          <p className="text-[8px] text-slate-400 font-bold uppercase tracking-[0.15em] mt-0.5 ml-7">
            Plan de Desarrollo Comunitario
          </p>
        </div>
      </div>

      {/* TARJETA DEL MAPA COMUNAL (REDUCIDA) */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-3 flex flex-col sm:flex-row items-center justify-between gap-3 transition-all hover:shadow-md">
        <div className="flex items-center gap-3 w-full sm:w-auto">
          <div className="h-10 w-10 rounded-xl bg-brand-primary/10 flex items-center justify-center text-brand-primary shrink-0">
            {mapaComunaImagenUrl ? <ImageIcon className="h-4 w-4" /> : <Camera className="h-4 w-4" />}
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="text-[8px] font-black text-slate-400 uppercase tracking-wider">Mapa de Sueños Comunal</span>
              {mapaComunaImagenUrl && (
                <span className="text-[7px] font-black px-1.5 py-0.5 rounded-full bg-emerald-50 text-emerald-600 border border-emerald-100">
                  Imagen cargada
                </span>
              )}
            </div>
            <p className="text-[11px] font-bold text-slate-700 mt-0.5 line-clamp-2">
              {descripcionComunaResumen || "Sin descripción del mapa comunal aún..."}
            </p>
          </div>
        </div>
        <button
          onClick={openComunaMapaModal}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-brand-primary text-white text-[9px] font-black uppercase tracking-wider shadow-sm hover:scale-105 transition-all shrink-0"
        >
          <Eye className="h-3 w-3" />
          Ver Mapa Comunal
        </button>
      </div>

      {/* TABLA DE SUEÑOS DE LA COMUNA (REDUCIDA) */}
      <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-3 mb-4">
          <div>
            <h2 className="text-sm font-black text-slate-800 italic uppercase tracking-tighter flex items-center gap-2">
              Sueños y Nudos Críticos
            </h2>
          </div>
          <button
            onClick={() => { resetForm(); setIsFormOpen(true); }}
            className="flex items-center gap-1.5 bg-brand-primary text-white px-3 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-wider shadow-md hover:scale-105 transition-all"
          >
            <PlusCircle size={13} /> Agregar Sueño Comunal
          </button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50/50 border-b border-gray-100 text-[8px] font-black text-slate-400 uppercase tracking-[0.15em]">
                <th className="px-3 py-2">Área / 7T</th>
                <th className="px-3 py-2">Sueño / Nudo</th>
                <th className="px-3 py-2">Solución</th>
                <th className="px-3 py-2">Responsable</th>
                <th className="px-3 py-2">Ubicación</th>
                <th className="px-3 py-2">Fortaleza</th>
                <th className="px-3 py-2 text-right">Acción</th>
              </tr>
            </thead>
            <tbody>
              {suenosComuna.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-3 py-8 text-center">
                    <p className="text-[10px] font-bold text-slate-300 italic uppercase">No hay sueños registrados para la comuna</p>
                  </td>
                </tr>
              ) : (
                suenosComuna.map((s) => (
                  <tr key={s.id_sueno_comuna} className="hover:bg-gray-50/80 transition-colors">
                    <td className="px-3 py-2">
                      <p className="text-[10px] font-black text-brand-primary italic uppercase tracking-tighter">{s.area_trabajo}</p>
                      <span className="text-[7px] bg-brand-primary/5 text-brand-primary px-1.5 py-0.5 rounded-lg font-black uppercase">
                        {s.transformacion_7t ? s.transformacion_7t.split(':')[0] : 'S/T'}
                      </span>
                    </td>
                    <td className="px-3 py-2 text-[9px] font-bold text-slate-600 max-w-40 leading-relaxed">{s.problema}</td>
                    <td className="px-3 py-2 text-[9px] font-bold text-slate-500 max-w-40 leading-relaxed">{s.solucion || '-'}</td>
                    <td className="px-3 py-2 text-[8px] font-black text-slate-800 uppercase italic min-w-25">
                      {s.nombre_responsable && s.apellido_responsable 
                        ? `${s.nombre_responsable} ${s.apellido_responsable}` 
                        : s.nombre_responsable || s.apellido_responsable || '-'}
                      {s.cedula_responsable && <span className="block text-[7px] text-slate-500 normal-case">C.I: {s.cedula_responsable}</span>}
                    </td>
                    <td className="px-3 py-2 text-[8px] text-slate-400 font-bold uppercase tracking-wider min-w-30">{s.ubicacion || 'Sin ubicación'}</td>
                    <td className="px-3 py-2 text-[8px] text-slate-500 font-medium italic min-w-25">{s.fortaleza || '-'}</td>
                    <td className="px-3 py-2 text-right">
                      <div className="flex items-center gap-1 justify-end">
                        <button onClick={() => handleEdit(s)} className="p-1 rounded-lg text-slate-400 hover:text-brand-primary"><Edit size={13} /></button>
                        <button onClick={() => handleDelete(s.id_sueno_comuna)} className="p-1 rounded-lg text-rose-500 hover:bg-rose-50"><Trash2 size={13} /></button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* MODAL DE REGISTRO/EDICIÓN DE SUEÑO COMUNAL (tamaño original, sin reducir) */}
      <AnimatePresence>
        {isFormOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => { setIsFormOpen(false); resetForm(); }}
              className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="relative w-full max-w-2xl bg-white rounded-3xl shadow-2xl overflow-hidden max-h-[90vh] overflow-y-auto"
            >
              <div className="p-5 border-b border-gray-100 flex justify-between items-center bg-gray-50/50 sticky top-0 z-10">
                <h4 className="text-base font-black text-slate-800 italic uppercase">
                  {editMode ? "Editar Sueño Comunal" : "Registrar Sueño Comunal"}
                </h4>
                <button onClick={() => { setIsFormOpen(false); resetForm(); }} className="p-1.5 rounded-xl hover:bg-gray-200 transition-colors">
                  <X className="h-4 w-4 text-slate-400" />
                </button>
              </div>
              <form onSubmit={handleSubmit} className="p-5 space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-3">
                    <div><label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5 block">Área de Trabajo</label><input name="area_trabajo" value={formData.area_trabajo} onChange={handleInputChange} className="w-full p-2.5 rounded-xl bg-gray-50 border border-gray-100 text-xs font-bold outline-none focus:ring-2 focus:ring-brand-primary/20" required /></div>
                    <div><label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5 block">Problema / Nudo</label><textarea name="problema" rows={2} value={formData.problema} onChange={handleInputChange} className="w-full p-2.5 rounded-xl bg-gray-50 border border-gray-100 text-xs font-bold resize-none outline-none focus:ring-2 focus:ring-brand-primary/20" required /></div>
                    <div><label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5 block">Ubicación Exacta</label><input name="ubicacion" value={formData.ubicacion} onChange={handleInputChange} className="w-full p-2.5 rounded-xl bg-gray-50 border border-gray-100 text-xs font-bold outline-none" /></div>
                  </div>
                  <div className="space-y-3">
                    <div><label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5 block">Solución Propuesta</label><textarea name="solucion" rows={2} value={formData.solucion} onChange={handleInputChange} className="w-full p-2.5 rounded-xl bg-gray-50 border border-gray-100 text-xs font-bold resize-none" /></div>
                    <div><label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5 block">Transformación 7T</label><select name="transformacion_7t" value={formData.transformacion_7t} onChange={handleInputChange} className="w-full p-2.5 rounded-xl bg-gray-50 border border-gray-100 text-xs font-bold outline-none"><option value="">Seleccione</option>{transformaciones7T.map(t => <option key={t} value={t}>{t}</option>)}</select></div>
                    <div><label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5 block">Fortaleza</label><input name="fortaleza" value={formData.fortaleza} onChange={handleInputChange} className="w-full p-2.5 rounded-xl bg-gray-50 border border-gray-100 text-xs font-bold outline-none" /></div>
                  </div>
                </div>
                <div className="pt-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-1.5">Responsable (opcional)</label>
                  <div className="grid grid-cols-3 gap-3 bg-gray-50/50 p-3 rounded-xl border border-gray-100">
                    <input name="nombre_responsable" className="w-full p-2.5 rounded-lg bg-white border border-gray-200 text-xs font-semibold outline-none" placeholder="Nombre" value={formData.nombre_responsable} onChange={handleInputChange} />
                    <input name="apellido_responsable" className="w-full p-2.5 rounded-lg bg-white border border-gray-200 text-xs font-semibold outline-none" placeholder="Apellido" value={formData.apellido_responsable} onChange={handleInputChange} />
                    <input name="cedula_responsable" type="text" className={cn("w-full p-2.5 rounded-lg bg-white border text-xs font-semibold outline-none focus:ring-2", formData.cedula_responsable && !/^[VEve]-?\d{1,8}$/.test(formData.cedula_responsable) ? "border-rose-300 bg-rose-50/50 focus:ring-rose-500/20 text-rose-700" : "border-gray-200 focus:ring-brand-primary/20")} placeholder="V-12345678" value={formData.cedula_responsable} onChange={handleInputChange} />
                  </div>
                  {formData.cedula_responsable && !/^[VEve]-?\d{1,8}$/.test(formData.cedula_responsable) && <p className="text-[9px] text-rose-500 mt-1 font-bold uppercase tracking-wider">Formato inválido (use V- o E- seguido de números)</p>}
                </div>
                <div className="pt-2">
                  <button type="submit" disabled={saving || (formData.cedula_responsable ? !/^[VEve]-?\d{1,8}$/.test(formData.cedula_responsable) : false)} className="w-full py-3.5 rounded-xl bg-brand-primary text-white text-xs font-black uppercase tracking-widest shadow-md shadow-brand-primary/10 hover:shadow-lg active:scale-[0.99] transition-all disabled:opacity-50 disabled:cursor-not-allowed">
                    {saving ? <Loader2 className="animate-spin mx-auto" size={16} /> : (editMode ? "Actualizar" : "Registrar Sueño")}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* MODAL PARA VER/EDITAR EL MAPA COMUNAL (tamaño original) */}
      <AnimatePresence>
        {isMapaComunaModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setIsMapaComunaModalOpen(false)} className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" />
            <motion.div initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 20 }} className="relative w-full max-w-lg bg-white rounded-[2.5rem] shadow-2xl overflow-hidden">
              <div className="p-6 border-b border-gray-50 flex items-center justify-between bg-gray-50/30">
                <div><h4 className="text-base font-black text-slate-800 italic uppercase tracking-tighter flex items-center gap-2"><ImageIcon className="h-5 w-5 text-brand-primary" /> Mapa de Sueños Comunal</h4><p className="text-[10px] text-slate-400 font-bold uppercase">Imagen y descripción</p></div>
                <button onClick={() => setIsMapaComunaModalOpen(false)} className="p-2 rounded-xl hover:bg-gray-100 transition-colors"><X className="h-5 w-5 text-slate-400" /></button>
              </div>
              <div className="p-6 space-y-5">
                <div>
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Imagen del Mapa</label>
                  <div className="mt-2 flex flex-col items-center gap-3">
                    {tempComunaImagenPreview ? (
                      <div className="relative group w-full flex justify-center">
                        <img src={tempComunaImagenPreview} alt="Mapa de Sueños Comunal" className="w-auto max-h-48 object-contain rounded-2xl border border-gray-200 shadow-sm" />
                        <button onClick={() => window.open(tempComunaImagenPreview, '_blank')} className="absolute top-2 right-2 p-2 bg-white/80 rounded-xl shadow-md hover:bg-white transition-all"><Eye className="h-4 w-4 text-slate-600" /></button>
                      </div>
                    ) : (
                      <div className="w-full h-28 bg-gray-100 rounded-2xl flex flex-col items-center justify-center border-2 border-dashed border-gray-300"><Camera className="h-6 w-6 text-gray-400 mb-1" /><p className="text-[11px] text-gray-500">Sin imagen cargada</p></div>
                    )}
                    <input type="file" ref={comunaMapaFileInputRef} className="hidden" accept="image/*" onChange={handleComunaMapaImageSelect} />
                    <button onClick={() => comunaMapaFileInputRef.current?.click()} className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white text-[10px] font-black uppercase rounded-xl shadow-md hover:scale-105 transition-all"><Upload className="h-3 w-3" /> {tempComunaImagenPreview ? "Cambiar Imagen" : "Subir Imagen"}</button>
                  </div>
                </div>
                <div>
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Descripción del Mapa</label>
                  <textarea rows={4} className="w-full mt-1 p-3 rounded-2xl bg-gray-50 ring-1 ring-gray-100 focus:ring-2 focus:ring-brand-primary/20 outline-none text-sm font-bold resize-none" placeholder="Describa el Mapa de Sueños comunal, sus objetivos y alcance..." value={tempComunaDescripcion} onChange={(e) => setTempComunaDescripcion(e.target.value)} />
                </div>
                <div className="flex justify-end gap-3 pt-4 border-t border-gray-100">
                  <button onClick={() => setIsMapaComunaModalOpen(false)} className="px-5 py-2.5 rounded-xl border border-gray-200 text-slate-600 text-[10px] font-black uppercase hover:bg-gray-50">Cancelar</button>
                  <button onClick={saveComunaMapaChanges} disabled={updatingComunaMapa} className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-brand-primary text-white text-[10px] font-black uppercase shadow-lg shadow-brand-primary/20 hover:scale-105 disabled:opacity-50">{updatingComunaMapa ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />} Guardar Cambios</button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* SECCIÓN DE CONSEJOS COMUNALES (reducida) */}
      <div className="space-y-4">
        <div className="flex items-center gap-2"><div className="h-5 w-0.5 bg-brand-primary rounded-full" /><h3 className="text-[10px] font-black text-slate-800 uppercase italic tracking-wider">Mapas de Sueños por Consejo Comunal</h3></div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {consejos.map((consejo) => {
            const suenosDelConsejo = suenosConsejos.filter(s => s.id_consejo === consejo.id_consejo);
            const tieneSuenos = suenosDelConsejo.length > 0;
            return (
              <motion.div key={consejo.id_consejo} whileHover={{ y: -3 }} className="group bg-white p-4 rounded-xl border border-gray-100 shadow-sm hover:shadow-md transition-all cursor-pointer" onClick={() => { if (tieneSuenos) setSelectedConsejo(consejo); else showAlert('Sin sueños', 'Este consejo aún no ha registrado sueños.', 'info'); }}>
                <div className="flex justify-between items-start mb-3">
                  <div className="h-9 w-9 rounded-xl bg-brand-primary/5 flex items-center justify-center text-brand-primary group-hover:bg-brand-primary group-hover:text-white transition-colors"><LayoutGrid size={16} /></div>
                  <span className="text-[7px] font-black uppercase text-emerald-500 bg-emerald-50 px-2 py-0.5 rounded-full">{tieneSuenos ? `${suenosDelConsejo.length} sueños` : "Sin sueños"}</span>
                </div>
                <h4 className="text-xs font-black text-slate-800 uppercase italic leading-tight mb-0.5">{consejo.nombre_consejo}</h4>
                <p className="text-[8px] font-bold text-slate-400 uppercase tracking-wider mb-4">Mapa de los Sueños Comunitario</p>
                <div className="flex items-center justify-between pt-2 border-t border-gray-50">
                  <div className="flex -space-x-1">{suenosDelConsejo.slice(0, 3).map((_, idx) => (<div key={idx} className="h-5 w-5 rounded-full border-2 border-white bg-brand-primary/20 flex items-center justify-center text-[7px] font-bold text-brand-primary uppercase">{suenosDelConsejo[idx].transformacion_7t?.split(':')[0] || "T"}</div>))}</div>
                  <div className="flex items-center gap-0.5 text-[8px] font-black text-brand-primary uppercase italic group-hover:gap-1 transition-all">Ver Detalles <ChevronRight size={12} /></div>
                </div>
              </motion.div>
            );
          })}
          {consejos.length === 0 && <div className="col-span-full text-center py-6 text-slate-400 text-xs">No hay consejos registrados en tu comuna.</div>}
        </div>
      </div>

      {/* MODAL DE DETALLE DE CONSEJOS (tamaño original) */}
      <AnimatePresence>
        {selectedConsejo && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setSelectedConsejo(null)} className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" />
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="relative w-full max-w-4xl max-h-[80vh] overflow-y-auto bg-white rounded-[2.5rem] shadow-2xl p-8">
              <div className="flex justify-between items-center mb-6 sticky top-0 bg-white z-10 pb-4 border-b"><h3 className="text-xl font-black text-slate-800 italic">Sueños de {selectedConsejo.nombre_consejo}</h3><button onClick={() => setSelectedConsejo(null)} className="p-2 rounded-xl hover:bg-gray-100"><X className="h-5 w-5 text-slate-400" /></button></div>
              <div className="space-y-4">
                {suenosConsejos.filter(s => s.id_consejo === selectedConsejo.id_consejo).map((sueno) => (
                  <div key={sueno.id_sueno} className="border border-gray-100 rounded-2xl p-5 hover:bg-gray-50 transition-all cursor-pointer" onClick={() => verDetalleSueno(sueno)}>
                    <div className="flex justify-between items-start"><div><p className="text-xs font-black text-brand-primary uppercase">{sueno.area_trabajo}</p><p className="text-sm font-bold text-slate-800 mt-1">{sueno.problema}</p></div><span className="text-[9px] bg-brand-primary/10 text-brand-primary px-2 py-0.5 rounded-full">{sueno.transformacion_7t?.split(':')[0] || "T"}</span></div>
                    {sueno.imagen_url && <div className="mt-3 h-20 w-20 rounded-lg overflow-hidden bg-gray-100"><img src={sueno.imagen_url} className="h-full w-full object-cover" alt="Evidencia" /></div>}
                  </div>
                ))}
                {suenosConsejos.filter(s => s.id_consejo === selectedConsejo.id_consejo).length === 0 && <p className="text-center py-12 text-slate-400">Este consejo no tiene sueños registrados.</p>}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* MODAL DETALLE SUEÑO ESPECÍFICO (tamaño original) */}
      <AnimatePresence>
        {openModal && viewSueno && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setOpenModal(false)} className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" />
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="relative w-full max-w-2xl bg-white rounded-[2.5rem] shadow-2xl p-8">
              <div className="flex justify-between items-center mb-6"><h4 className="text-xl font-black text-slate-800 italic">Detalle del Sueño</h4><button onClick={() => setOpenModal(false)} className="p-2 rounded-xl hover:bg-gray-100"><X className="h-5 w-5 text-slate-400" /></button></div>
              <div className="space-y-4">
                <div><span className="text-[10px] font-bold text-slate-400 uppercase">Área de trabajo</span><p className="text-sm font-black">{viewSueno.area_trabajo}</p></div>
                <div><span className="text-[10px] font-bold text-slate-400 uppercase">Problema / Nudo</span><p className="text-sm">{viewSueno.problema}</p></div>
                <div><span className="text-[10px] font-bold text-slate-400 uppercase">Solución</span><p className="text-sm">{viewSueno.solucion || '-'}</p></div>
                <div><span className="text-[10px] font-bold text-slate-400 uppercase">Responsable</span><p className="text-sm font-semibold">{viewSueno.responsable || '-'}</p></div>
                <div><span className="text-[10px] font-bold text-slate-400 uppercase">Ubicación</span><p className="text-sm">{viewSueno.ubicacion || '-'}</p></div>
                <div><span className="text-[10px] font-bold text-slate-400 uppercase">Fortaleza</span><p className="text-sm">{viewSueno.fortaleza || '-'}</p></div>
                <div><span className="text-[10px] font-bold text-slate-400 uppercase">Transformación 7T</span><p className="text-sm">{viewSueno.transformacion_7t || '-'}</p></div>
                {viewSueno.imagen_url && <div><span className="text-[10px] font-bold text-slate-400 uppercase">Evidencia</span><img src={viewSueno.imagen_url} className="mt-2 rounded-xl max-h-60 w-auto object-contain border" alt="Evidencia" /></div>}
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

export default MapaSuenosC;