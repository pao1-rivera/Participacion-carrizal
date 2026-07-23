"use client";

import React, { useState, useEffect, useRef, useMemo } from "react";
import { motion, AnimatePresence } from 'framer-motion';
import {
  Megaphone, FileCheck, Clock, X, Plus, Upload, Video,
  ImageIcon, FileText, Calendar, MapPin, Eye, AlertCircle,
  ChevronLeft, ChevronRight, Users, Building2, Loader2, Trash2
} from "lucide-react";
import { cn } from "@/app/lib/utils";
import { supabase } from "@/app/lib/supabaseClient";
import { useAuth } from "@/context/AuthContext";
import { AlertModal } from "@/app/components/AlertModal";

// Tipos unificados
interface AsambleaItem {
  id: number;
  motivo: string;
  descripcion: string | null;
  fecha: string;
  hora: string;
  lugar: string;
  foto_url: string | null;
  acta_url: string | null;
  instancia: 'Comuna' | 'Consejo Comunal';
  nombreInstancia: string;      // "Comuna" o nombre del consejo
  idConsejo?: number;           // Solo si es consejo
  idComuna?: number;            // Solo si es comuna
}

interface Consejo {
  id_consejo: number;
  nombre_consejo: string;
}

const BUCKET_COMUNA = 'documentos_comuna';
const BUCKET_CONSEJO = 'documentos_consejos';

export const AsambleasC = () => {
  const { user } = useAuth();
  const [comunaId, setComunaId] = useState<number | null>(null);
  const [noComuna, setNoComuna] = useState(false);
  const [consejos, setConsejos] = useState<Consejo[]>([]);
  const [asambleas, setAsambleas] = useState<AsambleaItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [isNewConvoOpen, setIsNewConvoOpen] = useState(false);
  const [selectedAsamblea, setSelectedAsamblea] = useState<AsambleaItem | null>(null);
  const [saving, setSaving] = useState(false);
  const [fotoSignedUrl, setFotoSignedUrl] = useState<string | null>(null);
  const [cargandoFoto, setCargandoFoto] = useState(false);
  const [actaSignedUrl, setActaSignedUrl] = useState<string | null>(null);
  const [cargandoActa, setCargandoActa] = useState(false);

  // Paginación
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;

  const [formData, setFormData] = useState({
    motivo: '',
    descripcion: '',
    fecha: '',
    hora: '',
    lugar: '',
  });
  const [fotoFile, setFotoFile] = useState<File | null>(null);
  const [actaFile, setActaFile] = useState<File | null>(null);
  const fotoInputRef = useRef<HTMLInputElement>(null);
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
    if (isNewConvoOpen || selectedAsamblea || modalState.isOpen) {
      document.body.classList.add('modal-open');
    } else {
      document.body.classList.remove('modal-open');
    }
    return () => document.body.classList.remove('modal-open');
  }, [isNewConvoOpen, selectedAsamblea, modalState.isOpen]);

  // Obtener id_comuna
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
        setLoading(false);
      }
    };
    fetchComuna();
  }, [user]);

  // Cargar consejos comunales
  useEffect(() => {
    if (!comunaId) return;
    const fetchConsejos = async () => {
      const { data: sectores, error: sectoresError } = await supabase
        .from('sectores')
        .select('id_sector')
        .eq('id_datos_comuna', comunaId)
        .eq('activo', true);
      if (sectoresError || !sectores || sectores.length === 0) {
        setConsejos([]);
        return;
      }
      const sectorIds = sectores.map(s => s.id_sector);
      const { data: consejosData, error: consejosError } = await supabase
        .from('datos_consejo_comunal')
        .select('id_consejo, nombre_consejo')
        .in('id_sector', sectorIds);
      if (consejosError) console.error('Error cargando consejos:', consejosError);
      else setConsejos(consejosData || []);
    };
    fetchConsejos();
  }, [comunaId]);

  // Cargar todas las asambleas (comuna + consejos) y combinarlas
  const cargarAsambleas = async () => {
    if (!comunaId) {
      setAsambleas([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      // Asambleas de la comuna
      const { data: asambleasComuna, error: errorComuna } = await supabase
        .from('asambleas_comuna')
        .select('*')
        .eq('id_comuna', comunaId);
      if (errorComuna) throw errorComuna;

      const itemsComuna: AsambleaItem[] = (asambleasComuna || []).map(a => ({
        id: a.id_asamblea,
        motivo: a.motivo,
        descripcion: a.descripcion,
        fecha: a.fecha,
        hora: a.hora,
        lugar: a.lugar,
        foto_url: a.foto_url,
        acta_url: a.acta_url,
        instancia: 'Comuna',
        nombreInstancia: 'Comuna',
        idComuna: comunaId,
      }));

      // Asambleas de todos los consejos
      if (consejos.length === 0) {
        setAsambleas(itemsComuna.sort((a,b) => new Date(b.fecha).getTime() - new Date(a.fecha).getTime()));
        setLoading(false);
        return;
      }

      const consejoIds = consejos.map(c => c.id_consejo);
      const { data: asambleasConsejo, error: errorConsejo } = await supabase
        .from('asambleas')
        .select('*, datos_consejo_comunal!inner(nombre_consejo)')
        .in('id_consejo', consejoIds);
      if (errorConsejo) throw errorConsejo;

      const itemsConsejo: AsambleaItem[] = (asambleasConsejo || []).map((a: any) => ({
        id: a.id_asamblea,
        motivo: a.motivo,
        descripcion: a.descripcion,
        fecha: a.fecha,
        hora: a.hora,
        lugar: a.lugar,
        foto_url: a.foto_url,
        acta_url: a.acta_url,
        instancia: 'Consejo Comunal',
        nombreInstancia: a.datos_consejo_comunal?.nombre_consejo || 'Consejo',
        idConsejo: a.id_consejo,
      }));

      const todas = [...itemsComuna, ...itemsConsejo];
      todas.sort((a,b) => new Date(b.fecha).getTime() - new Date(a.fecha).getTime());
      setAsambleas(todas);
    } catch (err) {
      console.error(err);
      showAlert('Error', 'No se pudieron cargar las asambleas', 'danger');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (comunaId && consejos.length > 0) {
      cargarAsambleas();
    } else if (comunaId) {
      cargarAsambleas(); // también se llama cuando consejos está vacío
    }
  }, [comunaId, consejos]);

  // Cargar URLs firmadas para el detalle
  useEffect(() => {
    const loadSignedUrls = async () => {
      if (!selectedAsamblea) return;

      if (selectedAsamblea.foto_url) {
        setCargandoFoto(true);
        const bucket = selectedAsamblea.instancia === 'Comuna' ? BUCKET_COMUNA : BUCKET_CONSEJO;
        const signed = await getSignedUrlFromRelativePath(selectedAsamblea.foto_url, bucket);
        setFotoSignedUrl(signed);
        setCargandoFoto(false);
      } else {
        setFotoSignedUrl(null);
      }

      if (selectedAsamblea.acta_url) {
        setCargandoActa(true);
        const bucket = selectedAsamblea.instancia === 'Comuna' ? BUCKET_COMUNA : BUCKET_CONSEJO;
        const signed = await getSignedUrlFromRelativePath(selectedAsamblea.acta_url, bucket);
        setActaSignedUrl(signed);
        setCargandoActa(false);
      } else {
        setActaSignedUrl(null);
      }
    };
    loadSignedUrls();
  }, [selectedAsamblea]);

  // Subir archivo (para comuna)
  const uploadFile = async (
    entidadId: number,
    tipoEntidad: 'comuna' | 'consejo',
    asambleaId: number,
    file: File,
    tipoArchivo: 'foto' | 'acta'
  ): Promise<string | null> => {
    const bucket = tipoEntidad === 'comuna' ? BUCKET_COMUNA : BUCKET_CONSEJO;
    const fileExt = file.name.split('.').pop();
    const fileName = `${tipoArchivo}_${Date.now()}.${fileExt}`;
    const relativePath = `${entidadId}/asambleas/${asambleaId}/${fileName}`;

    const { error } = await supabase.storage
      .from(bucket)
      .upload(relativePath, file, { upsert: true });

    if (error) {
      console.error(`Error subiendo ${tipoArchivo}:`, error);
      showAlert('Error', `No se pudo subir el archivo. Verifica el bucket '${bucket}'.`, 'danger');
      return null;
    }
    return relativePath;
  };

  // Registrar nueva asamblea (solo para comuna)
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!comunaId) {
      showAlert('Error', 'Debe registrar la comuna primero', 'warning');
      return;
    }
    if (formData.descripcion.length < 100) {
      showAlert('Descripción insuficiente', 'La descripción debe tener al menos 100 caracteres', 'warning');
      return;
    }
    setSaving(true);

    const { data, error } = await supabase
      .from('asambleas_comuna')
      .insert({
        id_comuna: comunaId,
        motivo: formData.motivo,
        descripcion: formData.descripcion,
        fecha: formData.fecha,
        hora: formData.hora,
        lugar: formData.lugar,
      })
      .select()
      .single();

    if (error) {
      console.error(error);
      showAlert('Error', 'Error al guardar la asamblea', 'danger');
      setSaving(false);
      return;
    }

    const savedId = data.id_asamblea;
    let fotoPath: string | null = null;
    let actaPath: string | null = null;

    if (fotoFile) {
      fotoPath = await uploadFile(comunaId, 'comuna', savedId, fotoFile, 'foto');
    }
    if (actaFile) {
      actaPath = await uploadFile(comunaId, 'comuna', savedId, actaFile, 'acta');
    }

    if (fotoPath || actaPath) {
      await supabase
        .from('asambleas_comuna')
        .update({ foto_url: fotoPath, acta_url: actaPath })
        .eq('id_asamblea', savedId);
    }

    resetForm();
    setIsNewConvoOpen(false);
    setSaving(false);
    showAlert('Éxito', 'Asamblea registrada correctamente', 'success');
    cargarAsambleas(); // recargar lista
  };

  const resetForm = () => {
    setFormData({
      motivo: '',
      descripcion: '',
      fecha: '',
      hora: '',
      lugar: '',
    });
    setFotoFile(null);
    setActaFile(null);
  };

  // Eliminar asamblea de comuna
  const handleDelete = async (asamblea: AsambleaItem) => {
    if (asamblea.instancia !== 'Comuna') {
      showAlert('Acción no permitida', 'Solo se pueden eliminar asambleas de la comuna', 'warning');
      return;
    }
    showConfirm(
      'Confirmar eliminación',
      `¿Estás seguro de eliminar la asamblea "${asamblea.motivo}"? Se perderán todos los archivos asociados.`,
      async () => {
        try {
          // Eliminar archivos de storage
          if (asamblea.foto_url) {
            await deleteFileFromStorage(asamblea.foto_url, BUCKET_COMUNA);
          }
          if (asamblea.acta_url) {
            await deleteFileFromStorage(asamblea.acta_url, BUCKET_COMUNA);
          }
          // Eliminar registro de la base de datos
          const { error } = await supabase
            .from('asambleas_comuna')
            .delete()
            .eq('id_asamblea', asamblea.id);
          if (error) throw error;
          showAlert('Eliminado', 'Asamblea eliminada correctamente', 'success');
          cargarAsambleas(); // recargar lista
        } catch (err) {
          console.error(err);
          showAlert('Error', 'No se pudo eliminar la asamblea', 'danger');
        }
      }
    );
  };

  const deleteFileFromStorage = async (relativePath: string, bucketName: string): Promise<void> => {
    const { error } = await supabase.storage.from(bucketName).remove([relativePath]);
    if (error) console.error('Error eliminando archivo:', error);
  };

  const handleViewDocument = async (relativePath: string | null, tipoInstancia: 'Comuna' | 'Consejo Comunal') => {
    if (!relativePath) return;
    const bucket = tipoInstancia === 'Comuna' ? BUCKET_COMUNA : BUCKET_CONSEJO;
    const signedUrl = await getSignedUrlFromRelativePath(relativePath, bucket);
    if (signedUrl) window.open(signedUrl, '_blank');
    else showAlert('Error', 'No se pudo abrir el documento', 'danger');
  };

  // Paginación
  const totalPages = Math.ceil(asambleas.length / itemsPerPage);
  const paginatedAsambleas = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return asambleas.slice(start, start + itemsPerPage);
  }, [asambleas, currentPage]);

  if (loading) {
    return <div className="flex justify-center p-8"><Loader2 className="animate-spin text-brand-primary" size={28} /></div>;
  }

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
    <div className="space-y-6">
      {/* HEADER */}
      <div className="bg-white rounded-xl p-4 border border-gray-100 shadow-sm flex flex-col md:flex-row items-center gap-4">
        <div className="h-12 w-12 rounded-xl bg-indigo-50 flex items-center justify-center text-brand-primary shadow-md shrink-0">
          <Megaphone className="h-6 w-6" />
        </div>
        <div className="text-center md:text-left">
          <h3 className="text-sm font-black text-slate-800 italic uppercase tracking-tighter">
            Participación y Asamblea
          </h3>
          <p className="text-slate-400 text-[9px] font-medium mt-0.5">
            Gestione las convocatorias comunitarias y la carga de actas validadas.
          </p>
        </div>
        <button
          onClick={() => { resetForm(); setIsNewConvoOpen(true); }}
          className="md:ml-auto px-4 py-2 rounded-xl bg-brand-primary text-white text-[9px] font-black uppercase tracking-wider shadow-md hover:scale-105 transition-all"
        >
          REGISTRO ASAMBLEA (Comuna)
        </button>
      </div>

      {/* Tabla única de asambleas */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="p-4 border-b border-gray-50 bg-gray-50/30">
          <h5 className="text-[9px] font-black text-slate-800 uppercase tracking-wider italic flex items-center gap-2">
            <Calendar className="h-3.5 w-3.5 text-brand-primary" /> Histórico de Asambleas
          </h5>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50/40">
                <th className="px-4 py-2 text-left text-[9px] font-black uppercase text-slate-500">Título</th>
                <th className="px-4 py-2 text-left text-[9px] font-black uppercase text-slate-500">Instancia</th>
                <th className="px-4 py-2 text-right text-[9px] font-black uppercase text-slate-500">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {paginatedAsambleas.map((asam) => (
                <tr key={`${asam.instancia}-${asam.id}`} className="hover:bg-gray-50/50 transition-colors">
                  <td className="px-4 py-3">
                    <div>
                      <p className="text-[10px] font-black text-slate-800 italic uppercase">{asam.motivo}</p>
                      <p className="text-[8px] font-bold text-slate-400 uppercase tracking-wider mt-0.5">
                        {new Date(asam.fecha).toLocaleDateString()} • {asam.hora.slice(0,5)} • {asam.lugar}
                      </p>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <span className={cn(
                      "text-[8px] font-black uppercase px-2 py-1 rounded-full",
                      asam.instancia === 'Comuna' ? "bg-brand-primary/10 text-brand-primary" : "bg-indigo-50 text-indigo-600"
                    )}>
                      {asam.nombreInstancia}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex justify-end gap-2">
                      <button
                        onClick={() => setSelectedAsamblea(asam)}
                        className="p-1.5 rounded-lg bg-blue-50 text-blue-600 hover:bg-blue-100 transition-colors"
                        title="Ver detalles"
                      >
                        <Eye className="h-3.5 w-3.5" />
                      </button>
                      {asam.instancia === 'Comuna' && (
                        <button
                          onClick={() => handleDelete(asam)}
                          className="p-1.5 rounded-lg bg-rose-50 text-rose-600 hover:bg-rose-100 transition-colors"
                          title="Eliminar asamblea"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
              {asambleas.length === 0 && (
                <tr>
                  <td colSpan={3} className="px-4 py-8 text-center text-slate-400 text-xs">
                    No hay asambleas registradas
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        {totalPages > 1 && (
          <div className="p-3 border-t border-gray-100 flex items-center justify-between bg-gray-50/30">
            <p className="text-[8px] font-black text-slate-400 uppercase">Página {currentPage} de {totalPages}</p>
            <div className="flex gap-1.5">
              <button
                onClick={() => setCurrentPage(p => Math.max(1, p-1))}
                disabled={currentPage === 1}
                className="p-1.5 rounded-lg bg-white border border-gray-100 text-slate-400 disabled:opacity-50"
              >
                <ChevronLeft className="h-3 w-3" />
              </button>
              <button
                onClick={() => setCurrentPage(p => Math.min(totalPages, p+1))}
                disabled={currentPage === totalPages}
                className="p-1.5 rounded-lg bg-white border border-gray-100 text-slate-400 disabled:opacity-50"
              >
                <ChevronRight className="h-3 w-3" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* MODAL DE REGISTRO (solo para comuna) */}
      <AnimatePresence>
        {isNewConvoOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setIsNewConvoOpen(false)} className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" />
            <motion.div initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 20 }} className="relative w-full max-w-xl bg-white rounded-4xl shadow-2xl p-5 overflow-hidden">
              <div className="flex justify-between items-center mb-4">
                <h4 className="text-sm font-black text-slate-800 italic uppercase tracking-wider">Registrar Nueva Asamblea (Comuna)</h4>
                <button onClick={() => setIsNewConvoOpen(false)} className="p-1.5 rounded-xl hover:bg-gray-100"><X className="h-4 w-4 text-slate-400" /></button>
              </div>
              <form onSubmit={handleSubmit} className="space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Motivo</label>
                    <input name="motivo" value={formData.motivo} onChange={(e) => setFormData(prev => ({ ...prev, motivo: e.target.value }))} className="w-full p-2.5 rounded-xl bg-gray-50 text-xs font-bold outline-none ring-1 ring-gray-100 focus:ring-2 focus:ring-brand-primary/20" required />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Lugar</label>
                    <input name="lugar" value={formData.lugar} onChange={(e) => setFormData(prev => ({ ...prev, lugar: e.target.value }))} className="w-full p-2.5 rounded-xl bg-gray-50 text-xs font-bold outline-none ring-1 ring-gray-100 focus:ring-2 focus:ring-brand-primary/20" required />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Fecha</label>
                    <input type="date" name="fecha" value={formData.fecha} onChange={(e) => setFormData(prev => ({ ...prev, fecha: e.target.value }))} className="w-full p-2.5 rounded-xl bg-gray-50 text-xs font-bold outline-none ring-1 ring-gray-100 focus:ring-2 focus:ring-brand-primary/20" required />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Hora</label>
                    <input type="time" name="hora" value={formData.hora} onChange={(e) => setFormData(prev => ({ ...prev, hora: e.target.value }))} className="w-full p-2.5 rounded-xl bg-gray-50 text-xs font-bold outline-none ring-1 ring-gray-100 focus:ring-2 focus:ring-brand-primary/20" required />
                  </div>
                </div>
                <div className="space-y-1">
                  <div className="flex justify-between">
                    <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Descripción (mín. 100 car.)</label>
                    <span className={cn("text-[8px] font-black uppercase px-1.5 py-0.5 rounded-full", formData.descripcion.length < 100 ? "bg-rose-100 text-rose-700" : "bg-emerald-100 text-emerald-700")}>
                      {formData.descripcion.length}/100
                    </span>
                  </div>
                  <textarea
                    name="descripcion"
                    rows={2}
                    value={formData.descripcion}
                    onChange={(e) => setFormData(prev => ({ ...prev, descripcion: e.target.value }))}
                    className="w-full p-2.5 rounded-xl bg-gray-50 text-xs font-medium outline-none ring-1 ring-gray-100 focus:ring-2 focus:ring-brand-primary/20 resize-none"
                    placeholder="Describa los puntos tratados en la asamblea..."
                    required
                  />
                </div>
                <div className="grid grid-cols-2 gap-3 pt-1">
                  <div className="space-y-1">
                    <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Foto de Reunión</label>
                    <input type="file" ref={fotoInputRef} className="hidden" accept="image/*" onChange={(e) => setFotoFile(e.target.files?.[0] || null)} />
                    <button type="button" onClick={() => fotoInputRef.current?.click()} className="w-full p-2 h-11 rounded-xl bg-gray-50 border border-gray-200 flex items-center justify-between gap-2 hover:border-brand-primary transition-colors text-left overflow-hidden">
                      <span className="text-[9px] font-black text-slate-500 uppercase flex items-center gap-1 truncate max-w-30">
                        <ImageIcon className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                        {fotoFile ? fotoFile.name : "Subir Foto"}
                      </span>
                      {!fotoFile && <span className="text-[8px] bg-white border px-1.5 py-0.5 rounded text-slate-400 font-bold uppercase">Adjuntar</span>}
                    </button>
                  </div>
                  <div className="space-y-1">
                    <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Acta (PDF)</label>
                    <input type="file" ref={actaInputRef} className="hidden" accept=".pdf" onChange={(e) => setActaFile(e.target.files?.[0] || null)} />
                    <button type="button" onClick={() => actaInputRef.current?.click()} className="w-full p-2 h-11 rounded-xl bg-gray-50 border border-gray-200 flex items-center justify-between gap-2 hover:border-emerald-500 transition-colors text-left overflow-hidden">
                      <span className="text-[9px] font-black text-emerald-600 uppercase flex items-center gap-1 truncate max-w-30">
                        <Upload className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                        {actaFile ? actaFile.name : "Subir Acta"}
                      </span>
                      {!actaFile && <span className="text-[8px] bg-white border px-1.5 py-0.5 rounded text-slate-400 font-bold uppercase">Adjuntar</span>}
                    </button>
                  </div>
                </div>
                <button
                  type="submit"
                  disabled={saving || formData.descripcion.length < 100}
                  className="w-full py-3 rounded-xl bg-brand-primary text-white text-[10px] font-black uppercase tracking-wider shadow-lg shadow-brand-primary/10 active:scale-98 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {saving ? <Loader2 className="animate-spin mx-auto" size={16} /> : "Finalizar Registro"}
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* MODAL DE DETALLE CON SCROLL EN DESCRIPCIÓN */}
      <AnimatePresence>
        {selectedAsamblea && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSelectedAsamblea(null)}
              className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="relative w-full max-w-lg bg-white rounded-[2.5rem] shadow-2xl p-10 overflow-y-auto max-h-[90vh]"
            >
              <div className="flex justify-between items-center mb-8">
                <span className="px-4 py-1.5 rounded-full bg-emerald-50 text-emerald-600 text-[9px] font-black uppercase tracking-widest italic">
                  Finalizada
                </span>
                <button onClick={() => setSelectedAsamblea(null)} className="p-2 rounded-xl hover:bg-gray-100">
                  <X className="h-5 w-5 text-slate-400" />
                </button>
              </div>
              <div className="space-y-6">
                <div>
                  <h4 className="text-xl font-black text-slate-800 italic uppercase leading-tight">{selectedAsamblea.motivo}</h4>
                  {/* DESCRIPCIÓN CON SCROLL */}
                  {selectedAsamblea.descripcion && (
                    <div className="mt-2 max-h-32 overflow-y-auto pr-2 scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-transparent">
                      <p className="text-sm text-gray-600 whitespace-pre-wrap">{selectedAsamblea.descripcion}</p>
                    </div>
                  )}
                  <div className="mt-4 flex flex-wrap gap-4">
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4 text-brand-primary" />
                      <span className="text-[11px] font-bold text-slate-600">
                        {selectedAsamblea.fecha} - {selectedAsamblea.hora}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <MapPin className="h-4 w-4 text-brand-primary" />
                      <span className="text-[11px] font-bold text-slate-600">{selectedAsamblea.lugar}</span>
                    </div>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4 pt-6 border-t border-gray-50">
                  <div className="space-y-2">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Soporte Fotográfico</p>
                    <button
                      onClick={() => {
                        if (selectedAsamblea.foto_url) {
                          handleViewDocument(selectedAsamblea.foto_url, selectedAsamblea.instancia);
                        }
                      }}
                      className="w-full h-24 rounded-2xl bg-gray-100 flex items-center justify-center border border-gray-200 hover:bg-brand-primary/10 transition-all overflow-hidden"
                    >
                      {cargandoFoto ? (
                        <Loader2 className="h-6 w-6 text-slate-400 animate-spin" />
                      ) : fotoSignedUrl ? (
                        <img src={fotoSignedUrl} className="w-full h-full object-cover" alt="Foto asamblea" />
                      ) : (
                        <div className="flex flex-col items-center">
                          <ImageIcon className="h-6 w-6 text-slate-300" />
                          <p className="text-[9px] text-slate-400 mt-1">Sin foto</p>
                        </div>
                      )}
                    </button>
                  </div>
                  <div className="space-y-2">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Acta Generada</p>
                    <button
                      onClick={() => {
                        if (selectedAsamblea.acta_url) {
                          handleViewDocument(selectedAsamblea.acta_url, selectedAsamblea.instancia);
                        }
                      }}
                      className="w-full h-24 rounded-2xl bg-indigo-50 flex items-center justify-center border border-indigo-100 group hover:bg-indigo-100 transition-all"
                    >
                      {cargandoActa ? (
                        <Loader2 className="h-6 w-6 text-brand-primary animate-spin" />
                      ) : actaSignedUrl ? (
                        <FileText className="h-6 w-6 text-brand-primary" />
                      ) : (
                        <div className="flex flex-col items-center">
                          <FileText className="h-6 w-6 text-slate-300" />
                          <p className="text-[9px] text-slate-400 mt-1">Sin acta</p>
                        </div>
                      )}
                    </button>
                  </div>
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

// Función auxiliar para obtener URL firmada
const getSignedUrlFromRelativePath = async (relativePath: string, bucketName: string): Promise<string | null> => {
  if (!relativePath) return null;
  const { data, error } = await supabase.storage
    .from(bucketName)
    .createSignedUrl(relativePath, 3600);
  if (error) {
    console.error('Error generando signed URL:', error);
    return null;
  }
  return data.signedUrl;
};