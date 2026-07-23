// app/components/AsambleasG.tsx
'use client';
import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Calendar, Clock, MapPin, FileText, Image, Plus, 
  X, Loader2, Edit, Trash2, AlertCircle, Upload
} from 'lucide-react';
import { cn } from '@/app/lib/utils';
import { supabase } from '@/app/lib/supabaseClient';
import { useAuth } from '@/context/AuthContext';
import { AlertModal } from "@/app/components/AlertModal";

interface Asamblea {
  id: string; // combinación: tabla + id real
  id_real: number;
  tabla: 'consejo' | 'comuna';
  motivo: string;
  descripcion: string;
  fecha: string;
  hora: string;
  lugar: string;
  foto_url: string | null;   // ruta relativa al bucket o URL pública
  acta_url: string | null;   // ruta relativa al bucket o URL pública
  created_at: string;
}

export const AsambleasG = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [asambleas, setAsambleas] = useState<Asamblea[]>([]);
  const [signedUrls, setSignedUrls] = useState<Record<string, { foto?: string; acta?: string }>>({});
  const [modalOpen, setModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<Asamblea | null>(null);
  const [formData, setFormData] = useState({
    motivo: '',
    descripcion: '',
    fecha: '',
    hora: '',
    lugar: '',
    fotoFile: null as File | null,
    actaFile: null as File | null,
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [consejoId, setConsejoId] = useState<number | null>(null);
  const [comunaId, setComunaId] = useState<number | null>(null);
  const [userTipo, setUserTipo] = useState<'consejo' | 'comuna' | null>(null);

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

  const closeModal = () => setModalState(prev => ({ ...prev, isOpen: false }));

  // 🔥 Función para normalizar la ruta: extrae la parte relativa al bucket
  const normalizeFilePath = (value: any): string | null => {
    if (!value) return null;
    let path = typeof value === 'string' ? value : '';
    if (!path) return null;
    
    // Buscar patrones típicos de URL pública de Supabase
    // Ejemplo: https://project.supabase.co/storage/v1/object/public/documentos_comunas/15/asambleas/10/foto.png
    const match = path.match(/\/storage\/v1\/object\/public\/[^/]+\/(.+)$/);
    if (match) {
      return match[1]; // Devuelve la parte después del bucket
    }
    // Si es una ruta que empieza con el nombre del bucket, eliminarlo
    const bucketNames = ['documentos_consejos', 'documentos_comuna'];
    for (const bucket of bucketNames) {
      if (path.startsWith(`${bucket}/`)) {
        return path.substring(bucket.length + 1);
      }
    }
    // Si no coincide, asumimos que ya es ruta relativa
    return path;
  };

  // 🔥 Función para obtener URL firmada con normalización de ruta
  const getSignedUrl = async (bucket: string, filePath: string): Promise<string | null> => {
    if (!filePath) return null;
    const normalized = normalizeFilePath(filePath);
    if (!normalized) {
      console.warn('No se pudo normalizar la ruta:', filePath);
      return null;
    }
    try {
      const { data, error } = await supabase.storage
        .from(bucket)
        .createSignedUrl(normalized, 3600); // 1 hora
      if (error) {
        console.error(`Error al firmar URL (bucket ${bucket}, ruta ${normalized}):`, error);
        return null;
      }
      return data.signedUrl;
    } catch (err) {
      console.error('Error inesperado:', err);
      return null;
    }
  };

  // === Obtener ID del consejo/comuna del usuario ===
  useEffect(() => {
    const fetchUserEntity = async () => {
      if (!user?.id) {
        setErrorMsg('No hay usuario autenticado');
        setLoading(false);
        return;
      }
      const { data: consejoData } = await supabase
        .from('datos_consejo_comunal')
        .select('id_consejo')
        .or(`id_usuario.eq.${user.id},id_usuario_auxiliar.eq.${user.id}`)
        .maybeSingle();
      if (consejoData) {
        setConsejoId(consejoData.id_consejo);
        setUserTipo('consejo');
        return;
      }
      const { data: comunaData } = await supabase
        .from('datos_comuna')
        .select('id_comuna')
        .eq('id_usuario', user.id)
        .maybeSingle();
      if (comunaData) {
        setComunaId(comunaData.id_comuna);
        setUserTipo('comuna');
        return;
      }
      setErrorMsg('No tienes un consejo o comuna asociado. No puedes crear asambleas.');
    };
    fetchUserEntity();
  }, [user]);

  // === Cargar asambleas y sus URLs firmadas ===
  const cargarAsambleas = useCallback(async () => {
    setLoading(true);
    try {
      const { data: consejoAsambleas, error: err1 } = await supabase
        .from('asambleas')
        .select('*')
        .order('fecha', { ascending: false });
      if (err1) throw err1;

      const { data: comunaAsambleas, error: err2 } = await supabase
        .from('asambleas_comuna')
        .select('*')
        .order('fecha', { ascending: false });
      if (err2) throw err2;

      const unificadas: Asamblea[] = [
        ...(consejoAsambleas || []).map((a: any) => ({
          id: `consejo-${a.id_asamblea}`,
          id_real: a.id_asamblea,
          tabla: 'consejo' as const,
          motivo: a.motivo,
          descripcion: a.descripcion || '',
          fecha: a.fecha,
          hora: a.hora,
          lugar: a.lugar,
          foto_url: a.foto_url,
          acta_url: a.acta_url,
          created_at: a.created_at,
        })),
        ...(comunaAsambleas || []).map((a: any) => ({
          id: `comuna-${a.id_asamblea}`,
          id_real: a.id_asamblea,
          tabla: 'comuna' as const,
          motivo: a.motivo,
          descripcion: a.descripcion || '',
          fecha: a.fecha,
          hora: a.hora,
          lugar: a.lugar,
          foto_url: a.foto_url,
          acta_url: a.acta_url,
          created_at: a.created_at,
        })),
      ];
      unificadas.sort((a, b) => new Date(b.fecha).getTime() - new Date(a.fecha).getTime());
      setAsambleas(unificadas);

      // Cargar URLs firmadas en paralelo con normalización
      const urlsMap: Record<string, { foto?: string; acta?: string }> = {};
      const bucketMap: Record<string, string> = {};
      for (const a of unificadas) {
        bucketMap[a.id] = a.tabla === 'consejo' ? 'documentos_consejos' : 'documentos_comuna';
      }
      
      const promises = unificadas.map(async (a) => {
        const bucket = bucketMap[a.id];
        const urls: { foto?: string; acta?: string } = {};
        if (a.foto_url) {
          const signed = await getSignedUrl(bucket, a.foto_url);
          if (signed) urls.foto = signed;
        }
        if (a.acta_url) {
          const signed = await getSignedUrl(bucket, a.acta_url);
          if (signed) urls.acta = signed;
        }
        urlsMap[a.id] = urls;
      });
      await Promise.all(promises);
      setSignedUrls(urlsMap);
    } catch (error) {
      console.error('Error cargando asambleas:', error);
      showAlert('Error', 'No se pudieron cargar las asambleas', 'danger');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    cargarAsambleas();
  }, [cargarAsambleas]);

  // === Subir archivo a Storage ===
  const uploadFile = async (file: File, bucket: string, folder: string): Promise<string | null> => {
    if (!file) return null;
    const ext = file.name.split('.').pop();
    const fileName = `${folder}/${Date.now()}_${Math.random().toString(36).substring(2, 8)}.${ext}`;
    const { error } = await supabase.storage.from(bucket).upload(fileName, file, {
      cacheControl: '3600',
      upsert: false
    });
    if (error) {
      console.error('Error subiendo archivo:', error);
      return null;
    }
    return fileName;
  };

  // === Guardar (crear o editar) ===
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.motivo || !formData.fecha || !formData.hora || !formData.lugar) {
      showAlert('Campos requeridos', 'Complete motivo, fecha, hora y lugar', 'warning');
      return;
    }
    if (!userTipo || (!consejoId && !comunaId)) {
      showAlert('Sin permisos', 'No tienes un consejo o comuna asociado para crear asambleas', 'warning');
      return;
    }
    setIsSubmitting(true);
    try {
      const bucket = userTipo === 'consejo' ? 'documentos_consejos' : 'documentos_comuna';
      const folder = userTipo === 'consejo' ? `asambleas_consejo/${consejoId}` : `asambleas_comuna/${comunaId}`;

      let fotoPath: string | null = null;
      let actaPath: string | null = null;

      if (formData.fotoFile) {
        fotoPath = await uploadFile(formData.fotoFile, bucket, folder);
        if (!fotoPath) throw new Error('Error al subir la foto');
      }
      if (formData.actaFile) {
        actaPath = await uploadFile(formData.actaFile, bucket, folder);
        if (!actaPath) throw new Error('Error al subir el acta');
      }

      // Si estamos editando y no se sube nuevo archivo, conservar el existente
      if (editingItem) {
        if (!fotoPath && editingItem.foto_url) fotoPath = normalizeFilePath(editingItem.foto_url) || editingItem.foto_url;
        if (!actaPath && editingItem.acta_url) actaPath = normalizeFilePath(editingItem.acta_url) || editingItem.acta_url;
      }

      const payload = {
        motivo: formData.motivo,
        descripcion: formData.descripcion,
        fecha: formData.fecha,
        hora: formData.hora,
        lugar: formData.lugar,
        foto_url: fotoPath,
        acta_url: actaPath,
      };

      if (editingItem) {
        // Actualizar
        if (editingItem.tabla === 'consejo') {
          const { error } = await supabase
            .from('asambleas')
            .update(payload)
            .eq('id_asamblea', editingItem.id_real);
          if (error) throw error;
        } else {
          const { error } = await supabase
            .from('asambleas_comuna')
            .update(payload)
            .eq('id_asamblea', editingItem.id_real);
          if (error) throw error;
        }
        showAlert('Éxito', 'Asamblea actualizada', 'success');
      } else {
        // Crear nueva
        if (userTipo === 'consejo' && consejoId) {
          const { error } = await supabase
            .from('asambleas')
            .insert([{ ...payload, id_consejo: consejoId }]);
          if (error) throw error;
        } else if (userTipo === 'comuna' && comunaId) {
          const { error } = await supabase
            .from('asambleas_comuna')
            .insert([{ ...payload, id_comuna: comunaId }]);
          if (error) throw error;
        } else {
          throw new Error('No se pudo determinar el tipo de entidad');
        }
        showAlert('Éxito', 'Asamblea creada', 'success');
      }
      setModalOpen(false);
      resetForm();
      cargarAsambleas();
    } catch (error) {
      console.error('Error guardando asamblea:', error);
      showAlert('Error', 'No se pudo guardar la asamblea', 'danger');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = (item: Asamblea) => {
    const confirmDelete = async () => {
      try {
        if (item.tabla === 'consejo') {
          await supabase.from('asambleas').delete().eq('id_asamblea', item.id_real);
        } else {
          await supabase.from('asambleas_comuna').delete().eq('id_asamblea', item.id_real);
        }
        showAlert('Eliminado', 'Asamblea eliminada correctamente', 'success');
        cargarAsambleas();
      } catch (error) {
        showAlert('Error', 'No se pudo eliminar', 'danger');
      }
    };
    setModalState({
      ...modalState,
      isOpen: true,
      title: 'Confirmar eliminación',
      message: '¿Estás seguro de eliminar esta asamblea?',
      type: 'warning',
      showInput: false,
      onConfirm: () => { confirmDelete(); closeModal(); },
      confirmText: 'Eliminar',
      cancelText: 'Cancelar',
    });
  };

  const resetForm = () => {
    setEditingItem(null);
    setFormData({
      motivo: '',
      descripcion: '',
      fecha: '',
      hora: '',
      lugar: '',
      fotoFile: null,
      actaFile: null,
    });
  };

  const openEdit = (item: Asamblea) => {
    setEditingItem(item);
    setFormData({
      motivo: item.motivo,
      descripcion: item.descripcion,
      fecha: item.fecha,
      hora: item.hora,
      lugar: item.lugar,
      fotoFile: null,
      actaFile: null,
    });
    setModalOpen(true);
  };

  if (loading) return <div className="flex justify-center p-12"><Loader2 className="animate-spin text-brand-primary" size={32} /></div>;
  if (errorMsg && asambleas.length === 0) return (
    <div className="bg-amber-50 border border-amber-200 rounded-2xl p-8 text-center">
      <AlertCircle className="h-8 w-8 text-amber-500 mx-auto mb-2" />
      <p className="text-sm font-bold text-amber-700">{errorMsg}</p>
    </div>
  );

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h3 className="text-[10px] font-black text-[#004d46] uppercase tracking-widest">
          Asambleas (Consejos y Comunas)
        </h3>
        <button
          onClick={() => { resetForm(); setModalOpen(true); }}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-brand-primary text-white rounded-lg text-[9px] font-black uppercase"
        >
          <Plus size={12} /> Nueva Asamblea
        </button>
      </div>

      {asambleas.length === 0 ? (
        <div className="bg-white rounded-2xl border border-gray-100 p-8 text-center text-gray-400">
          No hay asambleas disponibles
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {asambleas.map((a) => {
            const urls = signedUrls[a.id] || {};
            return (
              <div key={a.id} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 hover:shadow-md transition">
                <div className="flex justify-between items-start">
                  <div>
                    <div className="flex items-center gap-2">
                      <h4 className="font-black text-gray-800 text-sm">{a.motivo}</h4>
                      <span className={cn(
                        "text-[8px] font-bold px-1.5 py-0.5 rounded-full",
                        a.tabla === 'consejo' ? "bg-blue-100 text-blue-700" : "bg-emerald-100 text-emerald-700"
                      )}>
                        {a.tabla === 'consejo' ? 'Consejo' : 'Comuna'}
                      </span>
                    </div>
                    <p className="text-[9px] text-gray-500 mt-0.5">{a.descripcion}</p>
                  </div>
                  <div className="flex gap-1">
                    <button onClick={() => openEdit(a)} className="p-1.5 text-gray-400 hover:text-brand-primary"><Edit size={14} /></button>
                    <button onClick={() => handleDelete(a)} className="p-1.5 text-gray-400 hover:text-red-500"><Trash2 size={14} /></button>
                  </div>
                </div>
                <div className="flex flex-wrap gap-3 mt-3 text-[9px] text-gray-500">
                  <span className="flex items-center gap-1"><Calendar size={10} /> {new Date(a.fecha).toLocaleDateString()}</span>
                  <span className="flex items-center gap-1"><Clock size={10} /> {a.hora}</span>
                  <span className="flex items-center gap-1"><MapPin size={10} /> {a.lugar}</span>
                </div>
                {(urls.foto || urls.acta) && (
                  <div className="flex gap-2 mt-3 pt-2 border-t border-gray-100">
                    {urls.foto && <a href={urls.foto} target="_blank" className="text-[8px] text-brand-primary font-bold flex items-center gap-1"><Image size={10} /> Foto</a>}
                    {urls.acta && <a href={urls.acta} target="_blank" className="text-[8px] text-brand-primary font-bold flex items-center gap-1"><FileText size={10} /> Acta</a>}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Modal de formulario con subida de archivos */}
      <AnimatePresence>
        {modalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={() => setModalOpen(false)} />
            <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }} className="relative w-full max-w-md bg-white rounded-2xl shadow-2xl overflow-hidden">
              <div className="p-4 bg-[#004d46] text-white flex justify-between">
                <h3 className="font-black text-sm">{editingItem ? 'Editar Asamblea' : 'Nueva Asamblea'}</h3>
                <button onClick={() => setModalOpen(false)}><X size={18} /></button>
              </div>
              <form onSubmit={handleSubmit} className="p-5 space-y-4 max-h-[70vh] overflow-y-auto">
                <input type="text" placeholder="Motivo *" value={formData.motivo} onChange={e => setFormData({...formData, motivo: e.target.value})} className="w-full p-2 border rounded-lg text-sm" required />
                <textarea placeholder="Descripción" value={formData.descripcion} onChange={e => setFormData({...formData, descripcion: e.target.value})} className="w-full p-2 border rounded-lg text-sm" rows={3} />
                <div className="grid grid-cols-2 gap-3">
                  <input type="date" placeholder="Fecha *" value={formData.fecha} onChange={e => setFormData({...formData, fecha: e.target.value})} className="p-2 border rounded-lg text-sm" required />
                  <input type="time" placeholder="Hora *" value={formData.hora} onChange={e => setFormData({...formData, hora: e.target.value})} className="p-2 border rounded-lg text-sm" required />
                </div>
                <input type="text" placeholder="Lugar *" value={formData.lugar} onChange={e => setFormData({...formData, lugar: e.target.value})} className="w-full p-2 border rounded-lg text-sm" required />
                
                {/* Subida de archivos */}
                <div className="space-y-2">
                  <label className="block text-[10px] font-bold text-gray-600 uppercase">Foto (opcional)</label>
                  <div className="flex items-center gap-2">
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => setFormData({...formData, fotoFile: e.target.files?.[0] || null})}
                      className="text-sm w-full"
                    />
                    {editingItem?.foto_url && !formData.fotoFile && (
                      <span className="text-[8px] text-brand-primary">(actual: {editingItem.foto_url.split('/').pop()})</span>
                    )}
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="block text-[10px] font-bold text-gray-600 uppercase">Acta (PDF, opcional)</label>
                  <div className="flex items-center gap-2">
                    <input
                      type="file"
                      accept=".pdf,image/*"
                      onChange={(e) => setFormData({...formData, actaFile: e.target.files?.[0] || null})}
                      className="text-sm w-full"
                    />
                    {editingItem?.acta_url && !formData.actaFile && (
                      <span className="text-[8px] text-brand-primary">(actual: {editingItem.acta_url.split('/').pop()})</span>
                    )}
                  </div>
                </div>

                <div className="flex justify-end gap-2 pt-2">
                  <button type="button" onClick={() => setModalOpen(false)} className="px-4 py-2 bg-gray-200 rounded-lg text-xs font-bold">Cancelar</button>
                  <button type="submit" disabled={isSubmitting} className="px-4 py-2 bg-brand-primary text-white rounded-lg text-xs font-bold flex items-center gap-1">
                    {isSubmitting ? <Loader2 size={14} className="animate-spin" /> : (editingItem ? 'Actualizar' : 'Crear')}
                  </button>
                </div>
              </form>
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
        cancelText={modalState.cancelText}
        confirmText={modalState.confirmText}
        onConfirm={modalState.onConfirm || (() => closeModal())}
      />
    </div>
  );
};