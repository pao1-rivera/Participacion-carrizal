"use client";

import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Save, 
  AlertCircle, 
  Plus, 
  Trash2, 
  Target, 
  Zap,
  X,
  PlusCircle,
  Camera,
  Image as ImageIcon,
  Loader2,
  Eye,
  Upload,
  Edit,
  FileText,
  FileCheck
} from 'lucide-react';
import { supabase } from '@/app/lib/supabaseClient';
import { useAuth } from '@/context/AuthContext';
import { cn } from "@/app/lib/utils";
import { AlertModal } from "@/app/components/AlertModal";

interface Sueno {
  id_sueno: number;
  area_trabajo: string;
  problema: string;
  solucion: string | null;
  nombre_responsable: string | null;
  apellido_responsable: string | null;
  cedula_responsable: string | null;
  ubicacion: string | null;
  fortaleza: string | null;
  transformacion_7t: string | null;
}

// Helper para obtener URL firmada desde URL pública
const getSignedUrlFromPublicUrl = async (storedPath: string, bucketName: string): Promise<string | null> => {
  if (!storedPath) return null;

  let cleanPath = storedPath;

  if (storedPath.includes('http')) {
    const searchString = `/storage/v1/object/public/${bucketName}/`;
    const pathStart = storedPath.indexOf(searchString);
    if (pathStart !== -1) {
      cleanPath = storedPath.substring(pathStart + searchString.length);
    }
  }

  const { data, error } = await supabase.storage
    .from(bucketName)
    .createSignedUrl(cleanPath, 3600);

  if (error) {
    console.error("Error firmando URL:", error.message);
    return null;
  }
  return data.signedUrl;
};

export const MapaSuenos = () => {
  const { user } = useAuth();
  const [consejoId, setConsejoId] = useState<number | null>(null);
  const [noConsejo, setNoConsejo] = useState(false);
  const [suenos, setSuenos] = useState<Sueno[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  
  // Estados para la imagen global del mapa
  const [mapaImagenUrl, setMapaImagenUrl] = useState<string | null>(null);
  const [mapaImagenPublica, setMapaImagenPublica] = useState<string | null>(null);
  const [mapaDescripcion, setMapaDescripcion] = useState<string>("");
  const [uploadingImage, setUploadingImage] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // Estado para controlar el modal del mapa
  const [isMapaModalOpen, setIsMapaModalOpen] = useState(false);
  const [tempDescripcion, setTempDescripcion] = useState("");
  const [tempImagenPreview, setTempImagenPreview] = useState<string | null>(null);
  const [tempImagenFile, setTempImagenFile] = useState<File | null>(null);
  const [updatingMapa, setUpdatingMapa] = useState(false);
  const mapaFileInputRef = useRef<HTMLInputElement>(null);

  // Estado del formulario para sueños
  const [formData, setFormData] = useState({
    area_trabajo: '',
    problema: '',
    solucion: '',
    nombre_responsable: '',
    apellido_responsable: '',
    cedula_responsable: '',
    ubicacion: '',
    fortaleza: '',
    transformacion_7t: '',
  });

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
      confirmText: 'Sí, continuar',
      cancelText: 'Cancelar',
    });
  };

  const closeModal = () => setModalState(prev => ({ ...prev, isOpen: false }));

  // ==================== OCULTAR SIDEBAR CUANDO MODAL ESTÁ ABIERTO ====================
  useEffect(() => {
    if (isModalOpen || isMapaModalOpen) {
      document.body.classList.add('modal-open');
    } else {
      document.body.classList.remove('modal-open');
    }
    return () => document.body.classList.remove('modal-open');
  }, [isModalOpen, isMapaModalOpen]);

  const transformaciones7T = [
    "T1: Económica (Producción)",
    "T2: Servicios Públicos",
    "T3: Seguridad y Paz",
    "T4: Social",
    "T5: Participación Política",
    "T6: Ecología",
    "T7: Geopolítica"
  ];

  // ========== Obtener ID del consejo y cargar datos ==========
  useEffect(() => {
    const cargarDatos = async () => {
      if (!user?.id) {
        setLoading(false);
        setNoConsejo(true);
        return;
      }

      setLoading(true);

      // 1. Obtener consejo y sus datos de imagen/descripción
      const { data: consejoData, error: consejoError } = await supabase
        .from('datos_consejo_comunal')
        .select('id_consejo, mapa_imagen_url, mapa_descripcion')
        .or(`id_usuario.eq.${user.id},id_usuario_auxiliar.eq.${user.id}`)
        .maybeSingle();

      if (consejoError) {
        console.error('Error obteniendo consejo:', consejoError);
        setNoConsejo(true);
        setLoading(false);
        return;
      }

      if (!consejoData) {
        setNoConsejo(true);
        setLoading(false);
        return;
      }

      // Consejo existe
      setNoConsejo(false);
      const id = consejoData.id_consejo;
      setConsejoId(id);

      // Procesar imagen/descripción del mapa
      setMapaImagenPublica(consejoData.mapa_imagen_url);
      setMapaDescripcion(consejoData.mapa_descripcion || "");
      setTempDescripcion(consejoData.mapa_descripcion || "");

      if (consejoData.mapa_imagen_url) {
        const signed = await getSignedUrlFromPublicUrl(consejoData.mapa_imagen_url, 'documentos_consejos');
        setMapaImagenUrl(signed);
      } else {
        setMapaImagenUrl(null);
      }

      // 2. Cargar sueños del consejo
      const { data: suenosData, error: suenosError } = await supabase
        .from('mapa_suenos')
        .select('*')
        .eq('id_consejo', id)
        .order('created_at', { ascending: false });

      if (suenosError) {
        console.error('Error cargando sueños:', suenosError);
      } else {
        setSuenos(suenosData || []);
      }

      setLoading(false);
    };

    cargarDatos();
  }, [user?.id]); // Se ejecuta solo cuando cambia el usuario

  // ========== Funciones para la imagen global del mapa ==========
  const uploadMapaImagen = async (file: File): Promise<string | null> => {
    if (!user?.id || !consejoId) return null;

    const fileExt = file.name.split('.').pop();
    const fileName = `mapa_${Date.now()}.${fileExt}`;
    const filePath = `${consejoId}/${fileName}`;

    const { error } = await supabase.storage
      .from('documentos_consejos')
      .upload(filePath, file, { upsert: true });

    if (error) {
      console.error('Error subiendo imagen del mapa:', error);
      return null;
    }

    return filePath; 
  };

  const handleMapaImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setTempImagenFile(file);
      const reader = new FileReader();
      reader.onloadend = () => setTempImagenPreview(reader.result as string);
      reader.readAsDataURL(file);
    }
  };

  const saveMapaChanges = async () => {
    if (!consejoId) return;
    setUpdatingMapa(true);

    let newPathRelativo = mapaImagenPublica;

    if (tempImagenFile) {
      const uploadedPath = await uploadMapaImagen(tempImagenFile);
      if (uploadedPath) newPathRelativo = uploadedPath;
    }

    const { error } = await supabase
      .from('datos_consejo_comunal')
      .update({
        mapa_imagen_url: newPathRelativo,
        mapa_descripcion: tempDescripcion
      })
      .eq('id_consejo', consejoId);

    if (!error) {
      setMapaImagenPublica(newPathRelativo);
      setMapaDescripcion(tempDescripcion);

      if (newPathRelativo) {
        const signed = await getSignedUrlFromPublicUrl(newPathRelativo, 'documentos_consejos');
        setMapaImagenUrl(signed);
      }
      
      showAlert('Éxito', 'Cambios guardados correctamente', 'success');
      setIsMapaModalOpen(false);
      setTempImagenFile(null);
      setTempImagenPreview(null);
    } else {
      console.error("Error al guardar cambios:", error.message);
      showAlert('Error', 'Ocurrió un error al guardar los cambios', 'danger');
    }
    setUpdatingMapa(false);
  };

  const openMapaModal = async () => {
    setTempDescripcion(mapaDescripcion);
    if (mapaImagenPublica) {
      const nuevaSigned = await getSignedUrlFromPublicUrl(mapaImagenPublica, 'documentos_consejos');
      setTempImagenPreview(nuevaSigned);
    } else {
      setTempImagenPreview(null);
    }
    setTempImagenFile(null);
    setIsMapaModalOpen(true);
  };

  // ========== CRUD de sueños ==========
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const resetForm = () => {
    setFormData({
      area_trabajo: '',
      problema: '',
      solucion: '',
      nombre_responsable: '',
      apellido_responsable: '',
      cedula_responsable: '',
      ubicacion: '',
      fortaleza: '',
      transformacion_7t: '',
    });
    setEditMode(false);
    setEditingId(null);
  };

  const handleEdit = (sueno: Sueno) => {
    setEditMode(true);
    setEditingId(sueno.id_sueno);
    setFormData({
      area_trabajo: sueno.area_trabajo,
      problema: sueno.problema,
      solucion: sueno.solucion || '',
      nombre_responsable: sueno.nombre_responsable || '',
      apellido_responsable: sueno.apellido_responsable || '',
      cedula_responsable: sueno.cedula_responsable || '',
      ubicacion: sueno.ubicacion || '',
      fortaleza: sueno.fortaleza || '',
      transformacion_7t: sueno.transformacion_7t || '',
    });
    setIsModalOpen(true);
  };

  const agregarSueno = async () => {
    if (!consejoId) {
      showAlert('Datos faltantes', 'Debe registrar primero los datos legales del consejo', 'warning');
      return;
    }
    if (!formData.area_trabajo || !formData.problema) {
      showAlert('Campos requeridos', 'Complete al menos el Área de trabajo y el Problema', 'warning');
      return;
    }
    setSaving(true);

    const nuevoSueno = {
      id_consejo: consejoId,
      area_trabajo: formData.area_trabajo,
      problema: formData.problema,
      solucion: formData.solucion || null,
      nombre_responsable: formData.nombre_responsable || null,
      apellido_responsable: formData.apellido_responsable || null,
      cedula_responsable: formData.cedula_responsable || null,
      ubicacion: formData.ubicacion || null,
      fortaleza: formData.fortaleza || null,
      transformacion_7t: formData.transformacion_7t || null,
    };

    let error;
    if (editMode && editingId) {
      const { error: updateError } = await supabase
        .from('mapa_suenos')
        .update(nuevoSueno)
        .eq('id_sueno', editingId);
      error = updateError;
    } else {
      const { error: insertError } = await supabase
        .from('mapa_suenos')
        .insert([nuevoSueno]);
      error = insertError;
    }

    if (error) {
      console.error('Error guardando sueño:', error);
      showAlert('Error', 'No se pudo guardar el sueño', 'danger');
    } else {
      const { data: refreshed } = await supabase
        .from('mapa_suenos')
        .select('*')
        .eq('id_consejo', consejoId)
        .order('created_at', { ascending: false });
      if (refreshed) setSuenos(refreshed);
      resetForm();
      setIsModalOpen(false);
      showAlert('Éxito', editMode ? 'Sueño actualizado' : 'Sueño registrado', 'success');
    }
    setSaving(false);
  };

  const eliminarSueno = async (id_sueno: number) => {
    showConfirm(
      'Confirmar eliminación',
      '¿Estás seguro de eliminar este sueño? Esta acción no se puede deshacer.',
      async () => {
        const { error } = await supabase
          .from('mapa_suenos')
          .delete()
          .eq('id_sueno', id_sueno);
        if (error) {
          console.error('Error eliminando:', error);
          showAlert('Error', 'No se pudo eliminar el sueño', 'danger');
        } else {
          setSuenos(prev => prev.filter(s => s.id_sueno !== id_sueno));
          showAlert('Eliminado', 'Sueño eliminado correctamente', 'success');
        }
      }
    );
  };

  if (loading) {
    return (
      <div className="flex justify-center p-12">
        <Loader2 className="animate-spin text-brand-primary h-8 w-8" />
      </div>
    );
  }

  const descripcionResumen = mapaDescripcion.length > 100
    ? mapaDescripcion.substring(0, 100) + "..."
    : mapaDescripcion;

      if (noConsejo) {
        function onNavigate(arg0: string): void {
          throw new Error('Function not implemented.');
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
    <div className="space-y-6 p-4 md:p-8 min-h-screen">
      {/* CABECERA */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-black text-slate-800 italic uppercase tracking-tighter flex items-center gap-2">
            <Target className="h-5 w-5 text-brand-primary" /> Mapa de los Sueños (ACA)
          </h2>
          <p className="text-[9px] text-slate-400 font-bold uppercase tracking-[0.2em] mt-0.5 ml-7">
            Plan de Desarrollo Comunitario
          </p>
        </div>
      </div>

      {/* TARJETA COMPACTA DEL MAPA */}
      <div className="bg-white rounded-4xl border border-gray-100 shadow-sm p-5 flex flex-col sm:flex-row items-center justify-between gap-4 transition-all hover:shadow-md">
        <div className="flex items-center gap-4 w-full sm:w-auto">
          <div className="h-14 w-14 rounded-2xl bg-brand-primary/10 flex items-center justify-center text-brand-primary shrink-0">
            {mapaImagenUrl ? (
              <ImageIcon className="h-6 w-6" />
            ) : (
              <Camera className="h-6 w-6" />
            )}
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Mapa de Sueños</span>
              {mapaImagenUrl && (
                <span className="text-[8px] font-black px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-600 border border-emerald-100">
                  Imagen cargada
                </span>
              )}
            </div>
            <p className="text-sm font-bold text-slate-700 mt-1 line-clamp-2">
              {descripcionResumen || "Sin descripción aún..."}
            </p>
          </div>
        </div>
        <button
          onClick={openMapaModal}
          className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-brand-primary text-white text-[10px] font-black uppercase tracking-widest shadow-md hover:scale-105 transition-all shrink-0"
        >
          <Eye className="h-3 w-3" />
          Ver Mapa
        </button>
      </div>

      {/* SECCIÓN: LISTA DE SUEÑOS */}
      <div className="bg-white rounded-[2.5rem] border border-gray-100 shadow-sm overflow-hidden">
        <div className="p-6 border-b border-gray-100 bg-gray-50/30 flex items-center justify-between">
          <div>
            <h3 className="text-lg font-black text-slate-800 italic uppercase tracking-tighter">Sueños y Nudos Críticos</h3>
            <p className="text-[10px] text-slate-400 font-bold uppercase mt-1">{suenos.length} elementos registrados</p>
          </div>
          <button
            onClick={() => { resetForm(); setIsModalOpen(true); }}
            className="flex items-center gap-2 bg-brand-primary text-white px-6 py-3 rounded-2xl text-[10px] font-black italic uppercase tracking-widest shadow-lg shadow-brand-primary/20 hover:scale-[1.02] transition-all"
          >
            <PlusCircle size={16} /> Agregar Sueño / Nudo
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50/50 border-b border-gray-100 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">
                <th className="px-6 py-5">Área / 7T</th>
                <th className="px-6 py-5">Sueño / Nudo</th>
                <th className="px-6 py-5">Solución</th>
                <th className="px-6 py-5 min-w-40">Responsable</th>
                <th className="px-6 py-5">Ubicación</th>
                <th className="px-6 py-5">Fortaleza</th>
                <th className="px-6 py-5 text-right">Acción</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {suenos.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-8 py-20 text-center">
                    <p className="text-sm font-bold text-slate-300 italic uppercase tracking-widest">No hay sueños registrados</p>
                  </td>
                </tr>
              ) : (
                suenos.map((sueno) => (
                  <tr key={sueno.id_sueno} className="hover:bg-gray-50/80 transition-colors group">
                    <td className="px-6 py-5">
                      <p className="text-sm font-black text-brand-primary italic uppercase tracking-tighter">{sueno.area_trabajo}</p>
                      <span className="text-[9px] bg-brand-primary/5 text-brand-primary px-2 py-0.5 rounded-lg font-black uppercase">
                        {sueno.transformacion_7t ? sueno.transformacion_7t.split(':')[0] : 'S/T'}
                      </span>
                    </td>
                    <td className="px-6 py-5 text-xs font-bold text-slate-600 max-w-50 leading-relaxed">{sueno.problema}</td>
                    <td className="px-6 py-5 text-xs font-bold text-slate-500 max-w-50 leading-relaxed">{sueno.solucion || '-'}</td>
                    <td className="px-6 py-5 text-[10px] font-black text-slate-800 uppercase italic min-w-40">
                      {sueno.nombre_responsable || sueno.apellido_responsable ? (
                        <div className="space-y-0.5">
                          <div>{sueno.nombre_responsable} {sueno.apellido_responsable}</div>
                          {sueno.cedula_responsable && (
                            <div className="text-slate-500 font-normal text-[9px]">{sueno.cedula_responsable}</div>
                          )}
                        </div>
                      ) : (
                        '-'
                      )}
                    </td>
                    <td className="px-6 py-5 text-[10px] text-slate-400 font-bold uppercase tracking-wider min-w-35">{sueno.ubicacion || 'Sin ubicación'}</td>
                    <td className="px-6 py-5 text-[10px] text-slate-500 font-medium italic min-w-30">{sueno.fortaleza || '-'}</td>
                    <td className="px-6 py-5 text-right">
                      <div className="flex items-center gap-2 justify-end">
                        <button
                          onClick={() => handleEdit(sueno)}
                          className="p-2 rounded-xl text-slate-400 hover:text-brand-primary transition-all"
                          title="Editar"
                        >
                          <Edit size={18} />
                        </button>
                        <button
                          onClick={() => eliminarSueno(sueno.id_sueno)}
                          className="p-2 rounded-xl text-rose-500 hover:bg-rose-50 transition-all"
                          title="Eliminar"
                        >
                          <Trash2 size={18} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* MODAL DE REGISTRO/EDICIÓN DE SUEÑO */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }} 
              animate={{ opacity: 1 }} 
              exit={{ opacity: 0 }} 
              onClick={() => setIsModalOpen(false)} 
              className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" 
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }} 
              animate={{ opacity: 1, scale: 1, y: 0 }} 
              exit={{ opacity: 0, scale: 0.95, y: 20 }} 
              className="relative w-full max-w-2xl bg-white rounded-4xl shadow-2xl overflow-hidden"
            >
              {/* contenido del modal sin cambios */}
              <div className="p-6 border-b border-gray-50 flex items-center justify-between bg-gray-50/30">
                <div>
                  <h4 className="text-base font-black text-slate-800 italic uppercase tracking-tighter flex items-center gap-2">
                    <Zap className="h-5 w-5 text-brand-primary" /> {editMode ? "Editar Sueño" : "Registrar Sueño / Nudo"}
                  </h4>
                  <p className="text-[10px] text-slate-400 font-bold uppercase">Complete los datos del sueño</p>
                </div>
                <button onClick={() => setIsModalOpen(false)} className="p-2 rounded-xl hover:bg-gray-100 transition-colors">
                  <X className="h-5 w-5 text-slate-400" />
                </button>
              </div>

              <div className="p-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  {/* Columna Izquierda */}
                  <div className="space-y-3">
                    <div>
                      <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Área de Trabajo</label>
                      <input
                        name="area_trabajo"
                        value={formData.area_trabajo}
                        onChange={handleInputChange}
                        placeholder="Ej: Servicios Públicos..."
                        className="w-full p-3 mt-1 rounded-xl bg-gray-50 ring-1 ring-gray-100 focus:ring-2 focus:ring-brand-primary/20 outline-none text-xs font-bold transition-all"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Problema / Oportunidad</label>
                      <textarea
                        name="problema"
                        rows={2}
                        value={formData.problema}
                        onChange={handleInputChange}
                        className="w-full p-3 mt-1 rounded-xl bg-gray-50 ring-1 ring-gray-100 focus:ring-2 focus:ring-brand-primary/20 outline-none text-xs font-bold transition-all resize-none"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Ubicación Exacta</label>
                      <input 
                        name="ubicacion" 
                        value={formData.ubicacion} 
                        onChange={handleInputChange} 
                        className="w-full p-3 mt-1 rounded-xl bg-gray-50 ring-1 ring-gray-100 focus:ring-2 focus:ring-brand-primary/20 outline-none text-xs font-bold transition-all" 
                        placeholder="Dirección exacta"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1 block">Fortaleza</label>
                      <input 
                        name="fortaleza" 
                        value={formData.fortaleza} 
                        onChange={handleInputChange} 
                        className="w-full p-3 mt-1 rounded-xl bg-gray-50 ring-1 ring-gray-100 text-xs font-bold focus:ring-2 focus:ring-brand-primary/20 outline-none" 
                        placeholder="Habilidad especial"
                      />
                    </div>
                  </div>

                  {/* Columna Derecha */}
                  <div className="space-y-3">
                    <div>
                      <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Solución Propuesta</label>
                      <textarea
                        name="solucion"
                        rows={2}
                        value={formData.solucion}
                        onChange={handleInputChange}
                        className="w-full p-3 mt-1 rounded-xl bg-gray-50 ring-1 ring-gray-100 focus:ring-2 focus:ring-brand-primary/20 outline-none text-xs font-bold transition-all resize-none"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Vinculación 7T</label>
                      <select
                        name="transformacion_7t"
                        value={formData.transformacion_7t}
                        onChange={handleInputChange}
                        className="w-full p-3 mt-1 rounded-xl bg-gray-50 ring-1 ring-gray-100 outline-none text-xs font-bold appearance-none"
                      >
                        <option value="">Seleccione una T</option>
                        {transformaciones7T.map(t => <option key={t} value={t}>{t}</option>)}
                      </select>
                    </div>
                    
                    <div className="space-y-2">
                      <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1 block">Responsable</label>
                      <div className="grid grid-cols-2 gap-2">
                        <input 
                          name="nombre_responsable" 
                          value={formData.nombre_responsable} 
                          onChange={handleInputChange} 
                          className="p-3 rounded-xl bg-gray-50 ring-1 ring-gray-100 text-xs font-bold focus:ring-2 focus:ring-brand-primary/20 outline-none" 
                          placeholder="Nombre"
                        />
                        <input 
                          name="apellido_responsable" 
                          value={formData.apellido_responsable} 
                          onChange={handleInputChange} 
                          className="p-3 rounded-xl bg-gray-50 ring-1 ring-gray-100 text-xs font-bold focus:ring-2 focus:ring-brand-primary/20 outline-none" 
                          placeholder="Apellido"
                        />
                      </div>
                      <input 
                        name="cedula_responsable" 
                        value={formData.cedula_responsable} 
                        onChange={handleInputChange} 
                        className="w-full p-3 rounded-xl bg-gray-50 ring-1 ring-gray-100 text-xs font-bold focus:ring-2 focus:ring-brand-primary/20 outline-none" 
                        placeholder="Cédula (V-12345678)"
                      />
                    </div>
                  </div>
                </div>

                <div className="mt-6 flex gap-3 justify-end border-t border-gray-50 pt-4">
                  <button onClick={() => { setIsModalOpen(false); resetForm(); }} className="px-6 py-3 rounded-xl text-[10px] font-bold uppercase text-slate-400 hover:bg-gray-50 transition-all">
                    Cancelar
                  </button>
                  <button
                    onClick={agregarSueno}
                    disabled={saving}
                    className="flex items-center gap-2 bg-brand-primary text-white px-6 py-3 rounded-xl text-[10px] font-black italic uppercase tracking-widest shadow-xl shadow-brand-primary/20 transition-all hover:scale-[1.02] disabled:opacity-70"
                  >
                    {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : (editMode ? "Actualizar" : "Agregar")}
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* MODAL PARA VER/EDITAR EL MAPA COMPLETO */}
      <AnimatePresence>
        {isMapaModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }} 
              animate={{ opacity: 1 }} 
              exit={{ opacity: 0 }} 
              onClick={() => setIsMapaModalOpen(false)} 
              className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" 
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }} 
              animate={{ opacity: 1, scale: 1, y: 0 }} 
              exit={{ opacity: 0, scale: 0.95, y: 20 }} 
              className="relative w-full max-w-xl bg-white rounded-4xl shadow-2xl overflow-hidden"
            >
              <div className="p-6 border-b border-gray-50 flex items-center justify-between bg-gray-50/30">
                <div>
                  <h4 className="text-lg font-black text-slate-800 italic uppercase tracking-tighter flex items-center gap-2">
                    <ImageIcon className="h-5 w-5 text-brand-primary" /> Mapa de Sueños - Detalle
                  </h4>
                  <p className="text-[10px] text-slate-400 font-bold uppercase">Imagen y descripción del mapa</p>
                </div>
                <button onClick={() => setIsMapaModalOpen(false)} className="p-2 rounded-xl hover:bg-gray-100 transition-colors">
                  <X className="h-5 w-5 text-slate-400" />
                </button>
              </div>

              <div className="p-6 space-y-5">
                {/* Imagen */}
                <div>
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Imagen del Mapa</label>
                  <div className="mt-2 flex flex-col items-center gap-3">
                    {tempImagenPreview ? (
                      <div className="relative group w-full flex justify-center">
                        <img 
                          src={tempImagenPreview} 
                          alt="Mapa de Sueños" 
                          className="w-full max-h-60 object-contain rounded-2xl border border-gray-200 shadow-md"
                        />
                        <button
                          onClick={() => window.open(tempImagenPreview, '_blank')}
                          className="absolute top-2 right-2 p-2 bg-white/80 rounded-xl shadow-md hover:bg-white transition-all"
                        >
                          <Eye className="h-4 w-4 text-slate-600" />
                        </button>
                      </div>
                    ) : (
                      <div className="w-full h-32 bg-gray-100 rounded-2xl flex flex-col items-center justify-center border-2 border-dashed border-gray-300">
                        <Camera className="h-7 w-7 text-gray-400 mb-1" />
                        <p className="text-xs text-gray-500">Sin imagen cargada</p>
                      </div>
                    )}
                    <input
                      type="file"
                      ref={mapaFileInputRef}
                      className="hidden"
                      accept="image/*"
                      onChange={handleMapaImageSelect}
                    />
                    <button
                      onClick={() => mapaFileInputRef.current?.click()}
                      className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white text-[10px] font-black uppercase rounded-xl shadow-md hover:scale-105 transition-all"
                    >
                      <Upload className="h-3 w-3" />
                      {tempImagenPreview ? "Cambiar Imagen" : "Subir Imagen"}
                    </button>
                  </div>
                </div>

                {/* Descripción */}
                <div>
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Descripción del Mapa</label>
                  <textarea
                    rows={4}
                    className="w-full mt-1 p-4 rounded-2xl bg-gray-50 ring-1 ring-gray-100 focus:ring-2 focus:ring-brand-primary/20 outline-none text-sm font-bold resize-none"
                    placeholder="Describa el Mapa de Sueños general, sus objetivos y alcance..."
                    value={tempDescripcion}
                    onChange={(e) => setTempDescripcion(e.target.value)}
                  />
                </div>

                {/* Botones de acción */}
                <div className="flex justify-end gap-3 pt-4 border-t border-gray-100">
                  <button
                    onClick={() => setIsMapaModalOpen(false)}
                    className="px-5 py-3 rounded-xl border border-gray-200 text-slate-600 text-[10px] font-black uppercase hover:bg-gray-50 transition-all"
                  >
                    Cancelar
                  </button>
                  <button
                    onClick={saveMapaChanges}
                    disabled={updatingMapa}
                    className="flex items-center gap-2 px-5 py-3 rounded-xl bg-brand-primary text-white text-[10px] font-black uppercase shadow-lg shadow-brand-primary/20 hover:scale-105 transition-all disabled:opacity-50"
                  >
                    {updatingMapa ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                    Guardar Cambios
                  </button>
                </div>
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

export default MapaSuenos;