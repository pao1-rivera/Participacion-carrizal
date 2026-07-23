"use client";

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Save, 
  AlertCircle, 
  Plus, 
  Trash2, 
  MapPin, 
  Target, 
  Zap,
  X,
  PlusCircle,
  Loader2,
  Eye,
  Upload,
  FileText,
  FileCheck
} from 'lucide-react';
import { supabase } from '@/app/lib/supabaseClient';
import { useAuth } from '@/context/AuthContext';
import { cn } from "@/app/lib/utils";
import { AlertModal } from "@/app/components/AlertModal";

interface AcaSolucion {
  id_aca: number;
  id_nudo: number;
  area_trabajo: string;
  solucion_propuesta: string;
  nombre_responsable: string;
  apellido_responsable: string;
  cedula_responsable: string;
  direccion_exacta: string;
  fortaleza: string;
  transformacion_7t: string;
  nudo_titulo?: string;
  nudo_categoria?: string;
  nudo_descripcion?: string;
}

export const AcaView = () => {
  const { user } = useAuth();
  const [consejoId, setConsejoId] = useState<number | null>(null);
  const [noConsejo, setNoConsejo] = useState(false);
  const [soluciones, setSoluciones] = useState<AcaSolucion[]>([]);
  const [nudosDisponibles, setNudosDisponibles] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [selectedSolucion, setSelectedSolucion] = useState<AcaSolucion | null>(null);
  const [descripcionLength, setDescripcionLength] = useState(0);
  const [actaFile, setActaFile] = useState<File | null>(null);
  const actaInputRef = React.useRef<HTMLInputElement>(null);

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

  // ========== OCULTAR SIDEBAR CUANDO MODAL ABIERTO ==========
  useEffect(() => {
    if (isModalOpen || selectedSolucion) {
      document.body.classList.add('modal-open');
    } else {
      document.body.classList.remove('modal-open');
    }
    return () => document.body.classList.remove('modal-open');
  }, [isModalOpen, selectedSolucion]);

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

  const isResponsableComplete = () => {
    const nombre = formData.nombre_responsable.trim();
    const apellido = formData.apellido_responsable.trim();
    const cedulaNum = formData.cedula_numero.trim();
    return nombre && apellido && cedulaNum && /^\d{7,8}$/.test(cedulaNum);
  };

  const getCedulaCompleta = () => `${formData.cedula_tipo}-${formData.cedula_numero}`;

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

  useEffect(() => {
    if (!consejoId) return;
    const fetchData = async () => {
      setLoading(true);
      const { data: acaData, error: acaError } = await supabase
        .from('aca')
        .select(`
          *,
          nudo:nudos_criticos (
            titulo,
            categoria_7t,
            descripcion
          )
        `)
        .eq('id_consejo', consejoId);
      if (acaError) console.error('Error cargando ACA:', acaError);
      else if (acaData) {
        const solucionesFormateadas = acaData.map((item: any) => ({
          ...item,
          nudo_titulo: item.nudo?.titulo,
          nudo_categoria: item.nudo?.categoria_7t,
          nudo_descripcion: item.nudo?.descripcion
        }));
        setSoluciones(solucionesFormateadas);
      }

      const { data: nudosData, error: nudosError } = await supabase
        .from('nudos_criticos')
        .select('id_nudo, titulo, categoria_7t')
        .eq('id_consejo', consejoId);
      if (nudosError) console.error('Error cargando nudos:', nudosError);
      else setNudosDisponibles(nudosData || []);

      setLoading(false);
    };
    fetchData();
  }, [consejoId]);

  const nudosFiltrados = nudosDisponibles.filter(
    n => n.categoria_7t === formData.transformacion_7t.split(':')[0]
  );

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (name === 'descripcion_nudo') setDescripcionLength(value.length);
  };

  const resetForm = () => {
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
  };

  // ========== SUBIDA DE ACTA (CORREGIDA) ==========
  const uploadActa = async (file: File, nudoId: number): Promise<string> => {
    if (!user?.id || !consejoId) throw new Error('Faltan datos de usuario o consejo');
    const fileExt = file.name.split('.').pop();
    // Nombre de archivo más simple y consistente
    const fileName = `acta_${nudoId}_${Date.now()}.${fileExt}`;
    const filePath = `${consejoId}/nudos_criticos/${nudoId}/${fileName}`;
    
    const { error } = await supabase.storage
      .from('documentos_consejos')
      .upload(filePath, file, { upsert: false });
      
    if (error) {
      console.error('Error en uploadActa:', error);
      throw new Error(`Error al subir acta: ${error.message}`);
    }
    
    // Devolver la ruta relativa (sin el bucket)
    return filePath;
  };

  // ========== MANEJAR ENVÍO DEL FORMULARIO ==========
  const handleSubmit = async () => {
    if (!consejoId) {
      showAlert('Datos faltantes', 'Debe registrar primero los datos legales del consejo', 'warning');
      return;
    }
    if (!formData.area_trabajo.trim()) {
      showAlert('Campos incompletos', 'Complete el campo: Área de trabajo', 'warning');
      return;
    }
    if (!formData.solucion_propuesta.trim()) {
      showAlert('Campos incompletos', 'Complete el campo: Solución propuesta', 'warning');
      return;
    }
    if (!formData.transformacion_7t) {
      showAlert('Campos incompletos', 'Complete el campo: Transformación 7T', 'warning');
      return;
    }
    if (!isResponsableComplete()) {
      showAlert('Responsable incompleto', 'Complete TODOS los campos del RESPONSABLE (nombre, apellido, cédula)', 'warning');
      return;
    }

    setSaving(true);
    let id_nudo: number;

    try {
      if (formData.tipo === 'nuevo') {
        if (!formData.titulo_nudo.trim()) {
          showAlert('Campos incompletos', 'Debe ingresar un título para el nudo crítico', 'warning');
          setSaving(false);
          return;
        }
        if (formData.descripcion_nudo.length < 100) {
          showAlert('Descripción insuficiente', 'La descripción del problema debe tener al menos 100 caracteres', 'warning');
          setSaving(false);
          return;
        }
        if (!actaFile) {
          showAlert('Acta requerida', 'Debe subir el acta que respalda el nudo crítico (obligatorio)', 'warning');
          setSaving(false);
          return;
        }

        // Insertar el nudo crítico
        const nuevoNudo = {
          id_consejo: consejoId,
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
          .from('nudos_criticos')
          .insert([nuevoNudo])
          .select()
          .single();
        if (error) {
          console.error('Error creando nudo:', error);
          showAlert('Error', 'No se pudo crear el nudo crítico: ' + error.message, 'danger');
          setSaving(false);
          return;
        }
        const insertedNudoId = data?.id_nudo;
        if (insertedNudoId == null) {
          showAlert('Error', 'No se pudo obtener el ID del nudo', 'danger');
          setSaving(false);
          return;
        }
        id_nudo = insertedNudoId;

        // Subir el acta y actualizar el nudo con la ruta
        try {
          const actaPath = await uploadActa(actaFile, insertedNudoId);
          
          const { error: updateError } = await supabase
            .from('nudos_criticos')
            .update({ acta_url: actaPath })
            .eq('id_nudo', insertedNudoId);
          if (updateError) {
            console.error('Error actualizando acta_url:', updateError);
            throw new Error('No se pudo guardar la ruta del acta');
          }
        } catch (err: any) {
          console.error('Error en subida de acta:', err);
          // Si falla la subida, eliminamos el nudo para no dejar registros huérfanos
          await supabase.from('nudos_criticos').delete().eq('id_nudo', insertedNudoId);
          showAlert('Error', 'No se pudo subir el acta: ' + err.message, 'danger');
          setSaving(false);
          return;
        }
      } else {
        // Tipo existente
        if (!formData.id_nudo) {
          showAlert('Campos incompletos', 'Seleccione un nudo crítico', 'warning');
          setSaving(false);
          return;
        }
        id_nudo = parseInt(formData.id_nudo);
      }

      // Crear la solución ACA
      const nuevaSolucion = {
        id_consejo: consejoId,
        id_nudo: id_nudo,
        area_trabajo: formData.area_trabajo,
        solucion_propuesta: formData.solucion_propuesta,
        nombre_responsable: formData.nombre_responsable,
        apellido_responsable: formData.apellido_responsable,
        cedula_responsable: getCedulaCompleta(),
        direccion_exacta: formData.direccion_exacta || null,
        fortaleza: formData.fortaleza || null,
        transformacion_7t: formData.transformacion_7t
      };

      const { error: acaError } = await supabase
        .from('aca')
        .insert([nuevaSolucion]);

      if (acaError) {
        console.error(acaError);
        showAlert('Error', 'No se pudo guardar la solución: ' + acaError.message, 'danger');
      } else {
        // Recargar la lista
        const { data: refreshed } = await supabase
          .from('aca')
          .select(`
            *,
            nudo:nudos_criticos (
              titulo,
              categoria_7t,
              descripcion
            )
          `)
          .eq('id_consejo', consejoId);
        if (refreshed) {
          const solucionesFormateadas = refreshed.map((item: any) => ({
            ...item,
            nudo_titulo: item.nudo?.titulo,
            nudo_categoria: item.nudo?.categoria_7t,
            nudo_descripcion: item.nudo?.descripcion
          }));
          setSoluciones(solucionesFormateadas);
        }
        showAlert('Éxito', 'Registro guardado exitosamente', 'success');
        setIsModalOpen(false);
        resetForm();
      }
    } catch (error: any) {
      console.error('Error en handleSubmit:', error);
      showAlert('Error', 'Ocurrió un error inesperado: ' + error.message, 'danger');
    } finally {
      setSaving(false);
    }
  };

  const eliminarSolucion = async (id_aca: number) => {
    showConfirm(
      'Confirmar eliminación',
      '¿Eliminar esta solución ACA? No se eliminará el nudo crítico asociado.',
      async () => {
        const { error } = await supabase.from('aca').delete().eq('id_aca', id_aca);
        if (error) {
          showAlert('Error', 'No se pudo eliminar', 'danger');
        } else {
          setSoluciones(prev => prev.filter(s => s.id_aca !== id_aca));
          showAlert('Eliminado', 'Solución eliminada correctamente', 'success');
        }
      }
    );
  };

  if (loading) return <div className="flex justify-center p-12"><Loader2 className="animate-spin text-brand-primary" size={28} /></div>;

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
    <div className="space-y-3 p-2 md:p-5 min-h-screen">
      {/* CABECERA REDUCIDA */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-2">
        <div>
          <h2 className="text-base md:text-lg font-black text-slate-800 italic uppercase tracking-tighter flex items-center gap-2">
            <Target className="h-5 w-5 text-brand-primary" /> Agenda Concreta de Acción (ACA)
          </h2>
          <p className="text-[8px] md:text-[9px] text-slate-400 font-bold uppercase tracking-[0.15em] mt-0.5">
            Sistematización de Nudos Críticos
          </p>
        </div>
        <button
          onClick={() => { resetForm(); setIsModalOpen(true); }}
          className="flex items-center gap-1.5 bg-brand-primary text-white px-4 py-2 rounded-xl text-[9px] font-black uppercase tracking-wider shadow-md hover:scale-105 transition-all"
        >
          <PlusCircle size={14} /> Registrar ACA
        </button>
      </div>

      {/* ======= MODAL DE REGISTRO (REDUCIDO) ======= */}
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
              className="relative w-full max-w-2xl bg-white rounded-2xl shadow-2xl overflow-hidden max-h-[90vh] overflow-y-auto grid grid-cols-4 gap-2 p-3"
            >
              {/* CABECERA DEL MODAL */}
              <div className="col-span-4 p-3 border-b border-gray-100 bg-linear-to-r from-brand-primary/5 to-slate-50/50 flex items-center justify-between">
                <div>
                  <h4 className="text-base font-black text-slate-800 italic uppercase tracking-tight flex items-center gap-2">
                    <Zap className="h-5 w-5 text-brand-primary" /> Registrar ACA
                  </h4>
                  <p className="text-[9px] text-slate-500 font-bold mt-0.5">Agenda Concreta de Acción</p>
                </div>
                <button onClick={() => setIsModalOpen(false)} className="p-1.5 rounded-xl hover:bg-gray-100 transition-all">
                  <X className="h-4 w-4 text-slate-400 hover:text-slate-600" />
                </button>
              </div>

              {/* TIPO DE REGISTRO (nuevo/existente) */}
              <div className="col-span-4 flex gap-2 p-2 bg-gray-50/50 rounded-xl border border-gray-100">
                <label className="flex items-center gap-1.5 cursor-pointer p-1.5 bg-white rounded-lg shadow-sm hover:shadow-md transition-all flex-1 justify-center text-[10px]">
                  <input type="radio" name="tipo" value="nuevo" checked={formData.tipo === 'nuevo'} onChange={handleInputChange} className="w-3.5 h-3.5 accent-brand-primary" />
                  <span className="font-black text-slate-700">Nuevo nudo</span>
                </label>
                <label className="flex items-center gap-1.5 cursor-pointer p-1.5 bg-white rounded-lg shadow-sm hover:shadow-md transition-all flex-1 justify-center text-[10px]">
                  <input type="radio" name="tipo" value="existente" checked={formData.tipo === 'existente'} onChange={handleInputChange} className="w-3.5 h-3.5 accent-brand-primary" />
                  <span className="font-black text-slate-700">Nudo existente</span>
                </label>
              </div>

              {/* COLUMNA IZQUIERDA */}
              <div className="col-span-2 space-y-2">
                <div className="space-y-1.5 p-2.5 bg-linear-to-br from-blue-50/50 rounded-xl border border-blue-100">
                  <h5 className="text-[9px] font-black text-brand-primary uppercase tracking-wide">DATOS BÁSICOS</h5>
                  <div className="space-y-1.5">
                    <div>
                      <label className="text-[7px] font-black text-slate-500 uppercase tracking-widest block mb-0.5">Área de trabajo</label>
                      <input name="area_trabajo" value={formData.area_trabajo} onChange={handleInputChange} className="w-full p-2 rounded-lg bg-white shadow-sm border border-gray-200 text-[10px] font-medium focus:ring-2 focus:ring-brand-primary" />
                    </div>
                    <div>
                      <label className="text-[7px] font-black text-slate-500 uppercase tracking-widest block mb-0.5">Transformación 7T</label>
                      <select name="transformacion_7t" value={formData.transformacion_7t} onChange={handleInputChange} className="w-full p-2 rounded-lg bg-white shadow-sm border border-gray-200 text-[10px] font-medium focus:ring-2 focus:ring-brand-primary">
                        <option value="">Seleccione...</option>
                        {transformaciones7T.map(t => <option key={t} value={t}>{t}</option>)}
                      </select>
                    </div>
                  </div>
                </div>

                {formData.tipo === 'nuevo' && (
                  <div className="space-y-1.5 p-2.5 bg-linear-to-br from-blue-50/50 rounded-xl border border-blue-100">
                    <h5 className="text-[9px] font-black text-brand-primary uppercase tracking-wide">NUDO CRÍTICO</h5>
                    <div className="space-y-1.5">
                      <input name="titulo_nudo" value={formData.titulo_nudo} onChange={handleInputChange} placeholder="Título del problema" className="w-full p-2 rounded-lg bg-white shadow-sm border border-gray-200 text-[10px] font-semibold" />
                      <textarea name="descripcion_nudo" rows={2} value={formData.descripcion_nudo} onChange={handleInputChange} placeholder="Descripción (mín 100 chars)..." className="w-full p-2 rounded-lg bg-white shadow-sm border border-gray-200 text-[10px] resize-vertical" />
                      <div className="text-right">
                        <span className={`text-[8px] font-bold ${descripcionLength >= 100 ? 'text-emerald-600' : 'text-slate-400'}`}>
                          {descripcionLength}/100
                        </span>
                      </div>
                      <div>
                        <label className="text-[7px] font-black text-slate-500 uppercase tracking-widest mb-0.5 flex items-center gap-1">
                          Acta de respaldo *
                          <span className="text-rose-500 text-[7px]">(PDF)</span>
                        </label>
                        <input type="file" ref={actaInputRef} className="hidden" accept=".pdf,.doc,.docx" onChange={(e) => setActaFile(e.target.files?.[0] || null)} />
                        <div
                          onClick={() => actaInputRef.current?.click()}
                          className="border-2 border-dashed border-gray-200 rounded-lg p-1.5 flex items-center justify-between cursor-pointer hover:border-brand-primary/30 transition-all bg-white"
                        >
                          <span className="text-[8px] font-medium text-slate-600 truncate max-w-[120px]">
                            {actaFile ? actaFile.name : "Seleccionar archivo"}
                          </span>
                          <Upload className="h-3.5 w-3.5 text-slate-400" />
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* COLUMNA DERECHA */}
              <div className="col-span-2 space-y-2">
                <div className="space-y-1.5 p-2.5 bg-linear-to-br from-blue-50/50 rounded-xl border border-blue-100 shadow-md">
                  <h5 className="text-[9px] font-black text-brand-primary uppercase tracking-wide">RESPONSABLE</h5>
                  <div className="grid grid-cols-2 gap-1.5">
                    <div>
                      <label className="text-[7px] font-black text-slate-500 uppercase block mb-0.5">Nombre</label>
                      <input 
                        name="nombre_responsable" 
                        value={formData.nombre_responsable} 
                        onChange={handleInputChange} 
                        placeholder="Juan" 
                        className="w-full p-2 rounded-lg bg-white shadow-sm border border-gray-200 text-[10px] font-bold focus:ring-2 focus:ring-rose-400" 
                      />
                    </div>
                    <div>
                      <label className="text-[7px] font-black text-slate-500 uppercase block mb-0.5">Apellido</label>
                      <input 
                        name="apellido_responsable" 
                        value={formData.apellido_responsable} 
                        onChange={handleInputChange} 
                        placeholder="Pérez" 
                        className="w-full p-2 rounded-lg bg-white shadow-sm border border-gray-200 text-[10px] font-bold focus:ring-2 focus:ring-rose-400" 
                      />
                    </div>
                  </div>
                  <div>
                    <label className="text-[7px] font-black text-slate-500 uppercase block mb-0.5">Cédula</label>
                    <div className="flex gap-1.5 items-center">
                      <select 
                        value={formData.cedula_tipo} 
                        onChange={(e) => setFormData(prev => ({ ...prev, cedula_tipo: e.target.value }))}
                        className="w-14 p-2 rounded-lg bg-white shadow-sm border border-gray-200 text-[10px] font-bold focus:ring-2 focus:ring-rose-400"
                      >
                        <option value="V">V-</option>
                        <option value="E">E-</option>
                        <option value="J">J-</option>
                        <option value="G">G-</option>
                      </select>
                      <input 
                        name="cedula_numero" 
                        value={formData.cedula_numero} 
                        onChange={(e) => {
                          const onlyNumbers = e.target.value.replace(/\D/g, '');
                          setFormData(prev => ({ ...prev, cedula_numero: onlyNumbers }));
                        }}
                        placeholder="12345678"
                        maxLength={8}
                        className="flex-1 p-2 rounded-lg bg-white shadow-sm border border-gray-200 text-[10px] font-mono font-bold focus:ring-2 focus:ring-rose-400"
                      />
                    </div>
                  </div>
                  
                  {/* Resumen del responsable */}
                  {(() => {
                    const nombre = formData.nombre_responsable.trim();
                    const apellido = formData.apellido_responsable.trim();
                    const cedulaNum = formData.cedula_numero.trim();
                    const tipoDoc = formData.cedula_tipo;
                    if (nombre && apellido && cedulaNum && /^\d{7,8}$/.test(cedulaNum)) {
                      const cedulaCompleta = `${tipoDoc}-${cedulaNum}`;
                      
                    } else {
                      
                    }
                  })()}
                </div>

                <div className="space-y-1.5">
                  <div>
                    <label className="text-[7px] font-black text-slate-500 uppercase tracking-widest block mb-0.5">Solución propuesta *</label>
                    <textarea name="solucion_propuesta" rows={2} value={formData.solucion_propuesta} onChange={handleInputChange} className="w-full p-2 rounded-lg bg-white shadow-sm border border-gray-200 text-[10px] font-medium focus:ring-2 focus:ring-brand-primary resize-vertical" />
                  </div>
                  <div>
                    <label className="text-[7px] font-black text-slate-500 uppercase tracking-widest block mb-0.5">Dirección</label>
                    <input
                      type="text"
                      name="direccion_exacta"
                      value={formData.direccion_exacta}
                      onChange={handleInputChange}
                      placeholder="Calle / Avenida / Número / Sector"
                      className="w-full p-2 rounded-lg bg-white shadow-sm border border-gray-200 text-[10px] font-medium"
                    />
                  </div>
                  <div>
                    <label className="text-[7px] font-black text-slate-500 uppercase tracking-widest block mb-0.5">Fortaleza</label>
                    <input
                      type="text"
                      name="fortaleza"
                      value={formData.fortaleza}
                      onChange={handleInputChange}
                      placeholder="Ej: Organización comunitaria, acceso a recursos, etc."
                      className="w-full p-2 rounded-lg bg-white shadow-sm border border-gray-200 text-[10px] font-medium"
                    />
                  </div>
                  {formData.tipo === 'nuevo' && (
                    <div className="grid grid-cols-2 gap-1.5 p-2 bg-linear-to-r from-purple-50/50 rounded-lg border border-purple-100">
                      <div>
                        <label className="text-[7px] font-black text-slate-500 uppercase block mb-0.5">Gravedad</label>
                        <select name="gravedad" value={formData.gravedad} onChange={handleInputChange} className="w-full p-2 rounded-lg bg-white shadow-sm border border-gray-200 text-[10px]">
                          <option value="Bajo">Bajo</option>
                          <option value="Medio">Medio</option>
                          <option value="Alto/Crítico">Alto/Crítico</option>
                        </select>
                      </div>
                      <div className="space-y-1">
                        <label className="text-[7px] font-black text-slate-500 uppercase block mb-0.5">Familias/Personas</label>
                        <div className="grid grid-cols-2 gap-1">
                          <input type="number" name="familias_afectadas" value={formData.familias_afectadas} onChange={handleInputChange} placeholder="0" className="p-1.5 rounded-lg bg-white shadow-sm border border-gray-200 text-[10px] text-center" />
                          <input type="number" name="personas_afectadas" value={formData.personas_afectadas} onChange={handleInputChange} placeholder="0" className="p-1.5 rounded-lg bg-white shadow-sm border border-gray-200 text-[10px] text-center" />
                        </div>
                      </div>
                    </div>
                  )}

                  {formData.tipo === 'existente' && (
                    <div>
                      <label className="text-[7px] font-black text-slate-500 uppercase tracking-widest block mb-0.5">Nudo crítico</label>
                      <select name="id_nudo" value={formData.id_nudo} onChange={handleInputChange} className="w-full p-2 rounded-lg bg-white shadow-sm border border-gray-200 text-[10px]">
                        <option value="">Seleccione...</option>
                        {nudosFiltrados.map(n => (
                          <option key={n.id_nudo} value={n.id_nudo}>{n.titulo} ({n.categoria_7t})</option>
                        ))}
                      </select>
                    </div>
                  )}
                </div>
              </div>

              {/* BOTONES */}
              <div className="col-span-4 grid grid-cols-2 gap-2 pt-3 border-t border-gray-100">
                <button onClick={() => setIsModalOpen(false)} className="p-2.5 rounded-xl bg-gray-100 text-slate-600 font-black uppercase tracking-wide hover:bg-gray-200 transition-all shadow-sm hover:shadow-md text-[9px]">
                  Cancelar
                </button>
                <button 
                  onClick={handleSubmit} 
                  disabled={saving || !formData.area_trabajo || !formData.solucion_propuesta || !formData.transformacion_7t || !isResponsableComplete() || (formData.tipo === 'nuevo' && !actaFile)}
                  className="group flex items-center justify-center gap-1.5 p-2.5 bg-linear-to-r from-brand-primary to-brand-primary/80 text-white font-black uppercase tracking-wide rounded-xl shadow-xl hover:shadow-2xl hover:scale-[1.02] active:scale-[0.98] transition-all text-[9px] disabled:opacity-50 disabled:cursor-not-allowed disabled:shadow-none"
                >
                  {saving ? (
                    <>
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      Guardando...
                    </>
                  ) : (
                    <>
                      <Save className="h-3.5 w-3.5 group-hover:scale-110 transition-transform" />
                      Guardar ACA
                    </>
                  )}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* TABLA REDUCIDA */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="p-4 border-b border-gray-100 bg-gray-50/30 flex items-center justify-between">
          <div>
            <h3 className="text-sm font-black text-slate-800 italic uppercase tracking-tighter">Matriz de Soluciones</h3>
            <p className="text-[9px] text-slate-400 font-bold uppercase mt-0.5">Sistematización Territorial</p>
          </div>
          <AlertCircle className="h-5 w-5 text-brand-primary opacity-20" />
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50/50 border-b border-gray-100 text-[9px] font-black text-slate-400 uppercase tracking-[0.15em]">
                <th className="px-4 py-3">Área / 7T</th>
                <th className="px-4 py-3">Nudo Crítico</th>
                <th className="px-4 py-3">Solución</th>
                <th className="px-4 py-3">Responsable</th>
                <th className="px-4 py-3">Dirección</th>
                <th className="px-4 py-3">Fortaleza</th>
                <th className="px-4 py-3 text-right">Acción</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {soluciones.length === 0 ? (
                <tr><td colSpan={7} className="px-4 py-12 text-center"><p className="text-xs font-bold text-slate-300 italic uppercase">No hay registros</p></td></tr>
              ) : (
                soluciones.map((sol) => (
                  <tr key={sol.id_aca}>
                    <td className="px-4 py-3"><p className="text-xs font-black text-brand-primary italic uppercase tracking-tighter">{sol.area_trabajo}</p><span className="text-[8px] bg-brand-primary/5 text-brand-primary px-1.5 py-0.5 rounded-lg font-black uppercase">{sol.transformacion_7t.split(':')[0]}</span></td>
                    <td className="px-4 py-3"><p className="text-[10px] font-bold text-slate-800">{sol.nudo_titulo}</p><span className="text-[8px] text-slate-400">{sol.nudo_categoria}</span></td>
                    <td className="px-4 py-3 text-[10px] font-bold text-slate-500 max-w-xs">{sol.solucion_propuesta}</td>
                    <td className="px-4 py-3"><p className="text-[9px] font-black text-slate-800 uppercase italic break-all">{sol.nombre_responsable} {sol.apellido_responsable} - {sol.cedula_responsable}</p></td>
                    <td className="px-4 py-3"><div className="flex items-center gap-1 text-[8px] font-bold text-slate-400 uppercase italic"><MapPin size={9} className="text-rose-500" /> {sol.direccion_exacta || '—'}</div></td>
                    <td className="px-4 py-3"><p className="text-[9px] font-medium text-slate-700">{sol.fortaleza || '—'}</p></td>
                    <td className="px-4 py-3 text-right"><div className="flex justify-end gap-1.5"><button onClick={() => setSelectedSolucion(sol)} className="p-1 text-slate-400 hover:text-brand-primary"><Eye size={16} /></button><button onClick={() => eliminarSolucion(sol.id_aca)} className="p-1 text-slate-400 hover:text-rose-500"><Trash2 size={16} /></button></div></td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* MODAL DE DETALLE (sin cambios) */}
      <AnimatePresence>
        {selectedSolucion && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setSelectedSolucion(null)} className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" />
            <motion.div initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 20 }} className="relative w-full max-w-xl bg-white rounded-[2.5rem] shadow-2xl p-10">
              <div className="flex justify-between items-center mb-6">
                <h4 className="text-xl font-black text-slate-800 italic uppercase tracking-tighter">Detalle de la Solución</h4>
                <button onClick={() => setSelectedSolucion(null)}><X /></button>
              </div>
              <div className="space-y-4">
                <div className="border-b pb-3"><p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Área de trabajo</p><p className="text-sm font-black text-slate-800">{selectedSolucion.area_trabajo}</p></div>
                <div className="border-b pb-3"><p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Transformación 7T</p><p className="text-sm font-black text-slate-800">{selectedSolucion.transformacion_7t}</p></div>
                <div className="border-b pb-3"><p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Nudo crítico vinculado</p><p className="text-sm font-black text-brand-primary">{selectedSolucion.nudo_titulo}</p><p className="text-xs text-slate-500 mt-1 line-clamp-2">{selectedSolucion.nudo_descripcion}</p></div>
                <div className="border-b pb-3"><p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Solución propuesta</p><p className="text-sm text-slate-700">{selectedSolucion.solucion_propuesta}</p></div>
                <div className="grid grid-cols-2 gap-3">
                  <div><p className="text-[9px] font-bold text-slate-400 uppercase">Responsable</p><p className="text-xs font-black break-all">{selectedSolucion.nombre_responsable} {selectedSolucion.apellido_responsable}<br/>{selectedSolucion.cedula_responsable && `C.I: ${selectedSolucion.cedula_responsable}`}</p></div>
                  <div><p className="text-[9px] font-bold text-slate-400 uppercase">Ubicación</p><p className="text-xs font-black">{selectedSolucion.direccion_exacta || '—'}</p></div>
                </div>
                <div><p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Fortaleza</p><p className="text-sm font-medium">{selectedSolucion.fortaleza || '—'}</p></div>
              </div>
              <div className="mt-8 flex justify-end">
                <button onClick={() => setSelectedSolucion(null)} className="px-6 py-3 rounded-xl bg-brand-primary text-white text-[10px] font-black uppercase">Cerrar</button>
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
        cancelText={modalState.cancelText}
        confirmText={modalState.confirmText}
        onConfirm={modalState.onConfirm || (() => closeModal())}
      />
    </div>
  );
};

export default AcaView;