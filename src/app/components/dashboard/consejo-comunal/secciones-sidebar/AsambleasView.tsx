"use client";

import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Megaphone, FileCheck, Clock, X, Plus, Upload, Video,
  Image as ImageIcon, FileText, Calendar, MapPin, Eye,
  ChevronLeft, ChevronRight, Loader2, Trash2, AlertCircle
} from "lucide-react";
import { supabase } from "@/app/lib/supabaseClient";
import { useAuth } from "@/context/AuthContext";
import { cn } from "@/app/lib/utils";
import { AlertModal } from "@/app/components/AlertModal";

interface Asamblea {
  id_asamblea: number;
  motivo: string;
  descripcion: string;
  fecha: string;
  hora: string;
  lugar: string;
  foto_url: string | null;
  acta_url: string | null;
  created_at: string;
}

export const AsambleasView = () => {
  const { user } = useAuth();
  const [consejoId, setConsejoId] = useState<number | null>(null);
  const [noConsejo, setNoConsejo] = useState(false);
  const [asambleas, setAsambleas] = useState<Asamblea[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [isNewOpen, setIsNewOpen] = useState(false);
  const [selectedAsamblea, setSelectedAsamblea] = useState<Asamblea | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [fotoSignedUrl, setFotoSignedUrl] = useState<string | null>(null);
  const [cargandoFoto, setCargandoFoto] = useState(false);
  const itemsPerPage = 5;

  // Estado para AlertModal
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

  // Formulario
  const [formData, setFormData] = useState({
    motivo: '',
    lugar: '',
    fecha: '',
    hora: '',
    descripcion: '',
  });
  const [fotoFile, setFotoFile] = useState<File | null>(null);
  const [actaFile, setActaFile] = useState<File | null>(null);
  const fotoInputRef = useRef<HTMLInputElement>(null);
  const actaInputRef = useRef<HTMLInputElement>(null);

  // Ocultar sidebar cuando modal está abierto
  useEffect(() => {
    if (isNewOpen || selectedAsamblea) {
      document.body.classList.add('modal-open');
    } else {
      document.body.classList.remove('modal-open');
    }
    return () => document.body.classList.remove('modal-open');
  }, [isNewOpen, selectedAsamblea]);

  // Cargar foto signed URL para detalle
  useEffect(() => {
    const loadFotoSignedUrl = async () => {
      if (selectedAsamblea?.foto_url) {
        setCargandoFoto(true);
        const signedUrl = await getSignedUrlFromPublicUrl(selectedAsamblea.foto_url, 'documentos_consejos');
        setFotoSignedUrl(signedUrl);
        setCargandoFoto(false);
      } else {
        setFotoSignedUrl(null);
      }
    };
    loadFotoSignedUrl();
  }, [selectedAsamblea]);

  // Obtener id_consejo
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

  // Cargar asambleas
  useEffect(() => {
    if (!consejoId) return;
    const fetchAsambleas = async () => {
      setLoading(true);
      const { data } = await supabase
        .from('asambleas')
        .select('*')
        .eq('id_consejo', consejoId)
        .order('fecha', { ascending: false });
      setAsambleas(data || []);
      setLoading(false);
    };
    fetchAsambleas();
  }, [consejoId]);

  // Paginación
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = asambleas.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(asambleas.length / itemsPerPage);

  const handlePageChange = (page: number) => setCurrentPage(page);

  // Subir archivos
  const uploadFile = async (file: File, consejoId: string | number, asambleaId: number, tipo: 'foto' | 'acta'): Promise<string | null> => {
    if (!consejoId) return null;

    const fileExt = file.name.split('.').pop();
    const fileName = `${tipo}_${Date.now()}.${fileExt}`;
    const filePath = `${consejoId}/asambleas/${asambleaId}/${fileName}`;

    const { error } = await supabase.storage
      .from('documentos_consejos')
      .upload(filePath, file, { upsert: true });

    if (error) {
      console.error('Error subiendo archivo de asamblea:', error.message);
      return null;
    }
    return filePath;
  };

  // Registrar asamblea
  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!consejoId || !fotoFile || !actaFile || formData.descripcion.length < 100) {
      showAlert('Campos incompletos', 'Complete todos los campos requeridos (foto, acta y descripción mínima 100 caracteres)', 'warning');
      return;
    }
    
    setSaving(true);
    const nuevaAsamblea = {
      id_consejo: consejoId,
      motivo: formData.motivo,
      descripcion: formData.descripcion,
      fecha: formData.fecha,
      hora: formData.hora,
      lugar: formData.lugar,
      foto_url: null,
      acta_url: null,
    };

    const { data, error } = await supabase
      .from('asambleas')
      .insert([nuevaAsamblea])
      .select()
      .single();

    if (error || !data) {
      showAlert('Error', 'Error al guardar la asamblea', 'danger');
      setSaving(false);
      return;
    }

    const asambleaId = data.id_asamblea;
    const [fotoUrl, actaUrl] = await Promise.all([
      uploadFile(fotoFile, consejoId, asambleaId, 'foto'),
      uploadFile(actaFile, consejoId, asambleaId, 'acta')
    ]);

    if (fotoUrl || actaUrl) {
      await supabase
        .from('asambleas')
        .update({ foto_url: fotoUrl, acta_url: actaUrl })
        .eq('id_asamblea', asambleaId);
      data.foto_url = fotoUrl;
      data.acta_url = actaUrl;
    }

    setAsambleas(prev => [data, ...prev]);
    resetForm();
    setIsNewOpen(false);
    setSaving(false);
    showAlert('Éxito', 'Asamblea registrada correctamente', 'success');
  };

  // Eliminar asamblea
  const handleDelete = async (asamblea: any) => {
    showConfirm(
      'Confirmar eliminación',
      '¿Está seguro de eliminar esta asamblea? Se borrarán también sus actas y fotos asociadas.',
      async () => {
        try {
          const bucketName = 'documentos_consejos';
          const archivosAEliminar: string[] = [];

          const limpiarPath = (path: string | null) => {
            if (!path) return null;
            if (path.includes('http')) {
              const searchString = `/storage/v1/object/public/${bucketName}/`;
              const start = path.indexOf(searchString);
              return start !== -1 ? path.substring(start + searchString.length) : null;
            }
            return path.startsWith('/') ? path.substring(1) : path;
          };

          const pathActa = limpiarPath(asamblea.acta_url);
          const pathFoto = limpiarPath(asamblea.foto_url);

          if (pathActa) archivosAEliminar.push(pathActa);
          if (pathFoto) archivosAEliminar.push(pathFoto);

          if (archivosAEliminar.length > 0) {
            const { error: storageError } = await supabase.storage
              .from(bucketName)
              .remove(archivosAEliminar);
            if (storageError) console.error('Error borrando archivos:', storageError.message);
          }

          const { error: dbError } = await supabase
            .from('asambleas')
            .delete()
            .eq('id_asamblea', asamblea.id_asamblea);

          if (dbError) throw dbError;

          setAsambleas(prev => prev.filter(a => a.id_asamblea !== asamblea.id_asamblea));
          if (selectedAsamblea?.id_asamblea === asamblea.id_asamblea) setSelectedAsamblea(null);
          showAlert('Eliminado', 'Asamblea y documentos eliminados con éxito', 'success');
        } catch (error: any) {
          console.error('Error al eliminar:', error.message);
          showAlert('Error', 'No se pudo eliminar la asamblea', 'danger');
        }
      }
    );
  };

  // Ver documento
  const handleViewDocument = async (url: string | null) => {
    if (!url) return;
    const signedUrl = await getSignedUrlFromPublicUrl(url, 'documentos_consejos');
    if (signedUrl) window.open(signedUrl, '_blank');
    else showAlert('Error', 'No se pudo cargar el documento', 'danger');
  };

  const resetForm = () => {
    setFormData({
      motivo: '',
      lugar: '',
      fecha: '',
      hora: '',
      descripcion: '',
    });
    setFotoFile(null);
    setActaFile(null);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const triggerFotoUpload = () => fotoInputRef.current?.click();
  const triggerActaUpload = () => actaInputRef.current?.click();

  const handleFotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files?.[0]) setFotoFile(e.target.files[0]);
  };
  const handleActaChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files?.[0]) setActaFile(e.target.files[0]);
  };

  if (loading) {
    return <div className="flex justify-center p-12"><Loader2 className="animate-spin text-brand-primary" size={32} /></div>;
  }

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
      {/* Header reducido */}
      <div className="bg-white rounded-2xl p-4 border border-gray-100 shadow-sm flex flex-col md:flex-row items-center gap-4">
        <div className="h-12 w-12 rounded-xl bg-indigo-50 flex items-center justify-center text-brand-primary shadow-md shrink-0">
          <Megaphone className="h-5 w-5" />
        </div>
        <div className="text-center md:text-left">
          <h3 className="text-base font-black text-slate-800 italic uppercase tracking-tighter">
            Participación y Asamblea
          </h3>
          <p className="text-slate-400 text-[10px] font-medium mt-0.5">
            Gestione las convocatorias comunitarias y actas validadas.
          </p>
        </div>
        <button 
          onClick={() => { resetForm(); setIsNewOpen(true); }}
          className="md:ml-auto px-4 py-2 rounded-xl bg-brand-primary text-white text-[9px] font-black uppercase tracking-wider shadow-md hover:scale-105 transition-all"
        >
          REGISTRO ASAMBLEA
        </button>
      </div>

      {/* Lista de asambleas reducida */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="p-4 border-b border-gray-50 bg-gray-50/30">
          <h4 className="text-[10px] font-black text-slate-800 uppercase tracking-widest italic flex items-center gap-2">
            <Calendar className="h-3.5 w-3.5 text-brand-primary" /> Histórico de Asambleas
          </h4>
        </div>
        <div className="p-4 space-y-2">
          {currentItems.map((asam) => (
            <div key={asam.id_asamblea} className="p-3 rounded-xl bg-gray-50 border border-gray-100 flex items-center justify-between group hover:shadow-md transition-all">
              <div>
                <p className="text-[11px] font-black text-slate-800 italic uppercase">{asam.motivo}</p>
                <p className="text-[8px] font-bold text-slate-400 uppercase tracking-wider mt-0.5">
                  {new Date(asam.fecha).toLocaleDateString()} • {asam.lugar}
                </p>
              </div>
              <button 
                onClick={() => setSelectedAsamblea(asam)}
                className="p-2 rounded-lg bg-white border border-gray-100 text-brand-primary hover:bg-brand-primary hover:text-white transition-all shadow-sm"
              >
                <Eye className="h-3.5 w-3.5" />
              </button>
            </div>
          ))}
          {asambleas.length === 0 && (
            <div className="text-center py-8 text-slate-400 text-xs">No hay asambleas registradas</div>
          )}
        </div>
        {totalPages > 1 && (
          <div className="p-3 border-t border-gray-100 flex items-center justify-between bg-gray-50/30">
            <p className="text-[8px] font-black text-slate-400 uppercase">Página {currentPage} de {totalPages}</p>
            <div className="flex gap-1.5">
              <button onClick={() => handlePageChange(currentPage - 1)} disabled={currentPage === 1}
                className="p-1.5 rounded-lg bg-white border border-gray-100 text-slate-400 hover:text-brand-primary disabled:opacity-50 transition-all">
                <ChevronLeft className="h-3 w-3" />
              </button>
              <button onClick={() => handlePageChange(currentPage + 1)} disabled={currentPage === totalPages}
                className="p-1.5 rounded-lg bg-white border border-gray-100 text-slate-400 hover:text-brand-primary disabled:opacity-50 transition-all">
                <ChevronRight className="h-3 w-3" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* MODAL DE REGISTRO (con corrección para nombres de archivos) */}
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
              className="relative w-full max-w-lg bg-white rounded-[2.5rem] shadow-2xl overflow-hidden max-h-[90vh] overflow-y-auto"
            >
              <div className="p-6 border-b border-gray-50 flex items-center justify-between sticky top-0 bg-white z-10">
                <h4 className="text-lg font-black text-slate-800 uppercase tracking-wider">Nueva Asamblea</h4>
                <button onClick={() => setIsNewOpen(false)} className="p-2 rounded-xl hover:bg-gray-100">
                  <X className="h-5 w-5 text-slate-400" />
                </button>
              </div>
              
              <form onSubmit={handleRegister} className="p-6 space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">Motivo</label>
                    <input 
                      name="motivo" 
                      value={formData.motivo} 
                      onChange={handleInputChange} 
                      className="w-full p-3 rounded-xl bg-gray-50 text-sm font-bold focus:ring-2 focus:ring-brand-primary/20" 
                      required 
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">Lugar</label>
                    <input 
                      name="lugar" 
                      value={formData.lugar} 
                      onChange={handleInputChange} 
                      className="w-full p-3 rounded-xl bg-gray-50 text-sm font-bold focus:ring-2 focus:ring-brand-primary/20" 
                      required 
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">Fecha</label>
                    <input 
                      type="date" 
                      name="fecha" 
                      value={formData.fecha} 
                      onChange={handleInputChange} 
                      className="w-full p-3 rounded-xl bg-gray-50 text-xs font-black" 
                      required 
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">Hora</label>
                    <input 
                      type="time" 
                      name="hora" 
                      value={formData.hora} 
                      onChange={handleInputChange} 
                      className="w-full p-3 rounded-xl bg-gray-50 text-xs font-black" 
                      required 
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <label className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">Descripción * (mín. 100)</label>
                    <span className={cn(
                      "text-[8px] font-bold px-2 py-0.5 rounded-full",
                      formData.descripcion.length >= 100 ? "bg-emerald-100 text-emerald-700" : "bg-rose-100 text-rose-700"
                    )}>
                      {formData.descripcion.length}/100
                    </span>
                  </div>
                  <textarea 
                    name="descripcion"
                    rows={3}
                    value={formData.descripcion}
                    onChange={handleInputChange}
                    className="w-full p-3 rounded-xl bg-gray-50 text-sm font-bold resize-none focus:ring-2 focus:ring-brand-primary/20" 
                    placeholder="Puntos clave y acuerdos..." 
                    required
                  />
                </div>

                {/* Evidencias - corregido para nombres de archivos */}
                <div className="space-y-3">
                  <label className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">Evidencias (Obligatorias)</label>
                  <div className="grid grid-cols-2 gap-3">
                    {/* Foto */}
                    <div>
                      <input type="file" ref={fotoInputRef} className="hidden" accept="image/*" onChange={handleFotoChange} required />
                      <button 
                        type="button" 
                        onClick={triggerFotoUpload}
                        className="w-full p-3 bg-gray-50 border-2 border-dashed border-gray-200 rounded-xl text-xs font-bold text-slate-400 hover:border-brand-primary hover:bg-brand-primary/5 flex flex-col items-center gap-1 transition-all overflow-hidden"
                      >
                        {fotoFile ? (
                          <span className="text-brand-primary w-full truncate" title={fotoFile.name}>
                            {fotoFile.name}
                          </span>
                        ) : (
                          <>
                            <ImageIcon className="h-4 w-4" />
                            <span>Foto</span>
                          </>
                        )}
                      </button>
                    </div>
                    {/* Acta */}
                    <div>
                      <input type="file" ref={actaInputRef} className="hidden" accept=".pdf" onChange={handleActaChange} required />
                      <button 
                        type="button" 
                        onClick={triggerActaUpload}
                        className="w-full p-3 bg-gray-50 border-2 border-dashed border-gray-200 rounded-xl text-xs font-bold text-slate-400 hover:border-emerald-500 hover:bg-emerald-50 flex flex-col items-center gap-1 transition-all overflow-hidden"
                      >
                        {actaFile ? (
                          <span className="text-emerald-600 w-full truncate" title={actaFile.name}>
                            {actaFile.name}
                          </span>
                        ) : (
                          <>
                            <FileText className="h-4 w-4" />
                            <span>Acta PDF</span>
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                </div>

                <button 
                  type="submit"
                  disabled={saving || formData.descripcion.length < 100 || !fotoFile || !actaFile}
                  className="w-full py-4 rounded-xl bg-brand-primary text-white text-[10px] font-black uppercase tracking-wider shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2"
                >
                  {saving ? <Loader2 className="animate-spin" size={18} /> : "Registrar Asamblea"}
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* MODAL DE DETALLE (sin cambios) */}
      <AnimatePresence>
        {selectedAsamblea && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setSelectedAsamblea(null)} className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" />
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="relative w-full max-w-lg bg-white rounded-[2.5rem] shadow-2xl p-10">
              <div className="flex justify-between items-center mb-8">
                <span className="px-4 py-1.5 rounded-full bg-emerald-50 text-emerald-600 text-[9px] font-black uppercase tracking-widest italic">Finalizada</span>
                <div className="flex gap-2">
                  <button onClick={() => handleDelete(selectedAsamblea)} className="p-2 rounded-xl hover:bg-rose-50">
                    <Trash2 className="h-5 w-5 text-rose-500" />
                  </button>
                  <button onClick={() => setSelectedAsamblea(null)} className="p-2 rounded-xl hover:bg-gray-100">
                    <X className="h-5 w-5 text-slate-400" />
                  </button>
                </div>
              </div>
              
              <div className="space-y-6">
                <div>
                  <h4 className="text-xl font-black text-slate-800 italic uppercase leading-tight">{selectedAsamblea.motivo}</h4>
                  <div className="mt-4 flex flex-wrap gap-4">
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4 text-brand-primary" />
                      <span className="text-[11px] font-bold text-slate-600">
                        {new Date(selectedAsamblea.fecha).toLocaleDateString()} - {selectedAsamblea.hora.slice(0,5)}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <MapPin className="h-4 w-4 text-brand-primary" />
                      <span className="text-[11px] font-bold text-slate-600">{selectedAsamblea.lugar}</span>
                    </div>
                  </div>
                  <div className="mt-4 p-4 bg-gray-50 rounded-xl">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Descripción</p>
                    <p className="text-sm font-medium text-slate-700">{selectedAsamblea.descripcion}</p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 pt-6 border-t border-gray-50">
                  <div className="space-y-2">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Foto</p>
                    <div 
                      onClick={() => handleViewDocument(selectedAsamblea.foto_url)}
                      className="h-24 rounded-2xl bg-gray-100 flex items-center justify-center border border-gray-200 cursor-pointer hover:bg-brand-primary/10 transition-all overflow-hidden"
                    >
                      {cargandoFoto ? (
                        <Loader2 className="h-6 w-6 text-slate-400 animate-spin" />
                      ) : fotoSignedUrl ? (
                        <img src={fotoSignedUrl} className="h-full w-full object-cover" alt="Foto" />
                      ) : (
                        <ImageIcon className="h-6 w-6 text-slate-300" />
                      )}
                    </div>
                  </div>
                  <div className="space-y-2">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Acta</p>
                    <div 
                      onClick={() => handleViewDocument(selectedAsamblea.acta_url)}
                      className="h-24 rounded-2xl bg-indigo-50 flex items-center justify-center border border-indigo-100 cursor-pointer hover:bg-indigo-100 transition-all"
                    >
                      <FileText className="h-6 w-6 text-brand-primary" />
                    </div>
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

// Función auxiliar para signed URL
const getSignedUrlFromPublicUrl = async (storedPath: string | null, bucketName: string): Promise<string | null> => {
  if (!storedPath) return null;
  let cleanPath = storedPath;
  if (storedPath.includes('http')) {
    const searchString = `/storage/v1/object/public/${bucketName}/`;
    const pathStart = storedPath.indexOf(searchString);
    if (pathStart !== -1) {
      cleanPath = storedPath.substring(pathStart + searchString.length);
    }
  }
  cleanPath = cleanPath.startsWith('/') ? cleanPath.substring(1) : cleanPath;
  const { data, error } = await supabase.storage
    .from(bucketName)
    .createSignedUrl(cleanPath, 3600);
  if (error) {
    console.error('Error generando URL firmada:', error.message);
    return null;
  }
  return data.signedUrl;
};