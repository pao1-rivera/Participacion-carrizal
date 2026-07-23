"use client";

import React, { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  X, Upload, CheckCircle2, AlertCircle, Trash2,
  ChevronLeft, Loader2, FileText, MessageSquare,
  Calendar, UserCheck, ArrowLeft, Camera, Receipt, ShieldCheck, Layers
} from "lucide-react";
import { cn } from "@/app/lib/utils";
import { useAuth } from "@/context/AuthContext";
import { ProyectoComuna } from "./ProyectoC";
import { supabase } from "@/app/lib/supabaseClient";

// ----------------------------------------------------------------------
// Tipos
// ----------------------------------------------------------------------
interface VoceroComuna {
  id_voceroc: number;
  nombre_completo: string;
  cedula: string;
  unidad: string;
  tipo: string;
  es_firmante: boolean;
}

// ----------------------------------------------------------------------
// Props del modal
// ----------------------------------------------------------------------
interface RendicionModalCProps {
  isOpen: boolean;
  onClose: () => void;
  proyecto: ProyectoComuna | null;
  proyectoName: string;
  onSuccess?: () => void;
}

// ----------------------------------------------------------------------
// Componente principal
// ----------------------------------------------------------------------
export const RendicionModalC = ({ isOpen, onClose, proyecto, proyectoName, onSuccess }: RendicionModalCProps) => {
  const { user } = useAuth();
  const [step, setStep] = useState(1);
  const [comunaId, setComunaId] = useState<number | null>(null);
  const [proyectos, setProyectos] = useState<ProyectoComuna[]>([]);
  const [proyectosConRendicionesIds, setProyectosConRendicionesIds] = useState<number[]>([]);
  const [vocerosFirmantes, setVocerosFirmantes] = useState<VoceroComuna[]>([]);
  const [loadingData, setLoadingData] = useState(false);
  const [internalSelectedProyecto, setInternalSelectedProyecto] = useState<ProyectoComuna | null>(null);
  const [selectedCategoria, setSelectedCategoria] = useState<string>('');
  const [ingresos, setIngresos] = useState(0);
  const [egresos, setEgresos] = useState(0);
  const [selectedVoceros, setSelectedVoceros] = useState<{ id_voceroc: string }[]>([{ id_voceroc: "" }]);
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [fechaInicio, setFechaInicio] = useState("");
  const [fechaFin, setFechaFin] = useState("");
  const [informeGestion, setInformeGestion] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [files, setFiles] = useState<Record<string, string | null>>({
    "Acta de Asamblea": null, "Facturas Legales": null,
    "Informe Contraloría": null, "Estado de Cuenta": null,
  });
  const [fileObjects, setFileObjects] = useState<Record<string, File | null>>({});
  const [photos, setPhotos] = useState<{ id: number, preview: string | null }[]>([
    { id: 1, preview: null }, { id: 2, preview: null }, { id: 3, preview: null }
  ]);
  const [photoFiles, setPhotoFiles] = useState<(File | null)[]>([null, null, null]);
  const photoInputsRef = useRef<(HTMLInputElement | null)[]>([]);

  // Categorías por transformación
  const categoriasPorTransformacion: Record<string, string[]> = {
    T1: ['economia'],
    T2: ['agua', 'electricidad', 'gas', 'recoleccion de desechos', 'telecomunicaciones', 'transporte', 'vialidad', 'vivienda'],
    T3: ['seguridad'],
    T4: ['alimentacion', 'cultura', 'deporte', 'educacion', 'misiones', 'pobreza', 'salud'],
    T5: ['politico'],
    T6: ['ciencia y tecnologia', 'ecosocialismo'],
    T7: ['geopolitica']
  };

  // Obtener id_comuna del usuario
  useEffect(() => {
    const fetchComuna = async () => {
      if (!user?.id) return;
      const { data, error } = await supabase
        .from('datos_comuna')
        .select('id_comuna')
        .eq('id_usuario', user.id)
        .maybeSingle();
      if (error) console.error('Error cargando comuna:', error);
      else if (data) setComunaId(data.id_comuna);
    };
    fetchComuna();
  }, [user]);

  // Cargar proyectos de la comuna y voceros, además de las rendiciones existentes
  useEffect(() => {
    const fetchData = async () => {
      if (!isOpen || !comunaId) return;
      setLoadingData(true);

      // Proyectos de la comuna
      const { data: projData } = await supabase
        .from('proyectos_comuna')
        .select('*')
        .eq('id_comuna', comunaId);
      if (projData) setProyectos(projData);

      // Rendiciones ya existentes (para evitar duplicados)
      const { data: rendicionesData } = await supabase
        .from('rendiciones_comuna')
        .select('id_proyecto_comuna')
        .eq('id_comuna', comunaId);
      const idsConRendicion = rendicionesData ? [...new Set(rendicionesData.map(r => r.id_proyecto_comuna))] : [];
      setProyectosConRendicionesIds(idsConRendicion);

      // Voceros firmantes de la comuna
      const { data: vocData } = await supabase
        .from('voceros_comuna')
        .select('*')
        .eq('id_comuna', comunaId)
        .eq('es_firmante', true);
      if (vocData) setVocerosFirmantes(vocData);

      setLoadingData(false);
    };
    fetchData();
  }, [isOpen, comunaId]);

  const proyectosDisponibles = proyectos.filter(p => !proyectosConRendicionesIds.includes(p.id_proyecto_comuna));

  // Sincronizar con la prop proyecto externa (si se pasa)
  useEffect(() => {
    if (proyecto) {
      setInternalSelectedProyecto(proyecto);
    } else {
      setInternalSelectedProyecto(null);
    }
  }, [proyecto]);

  const saldo = ingresos - egresos;
  const categoriasDisponibles = internalSelectedProyecto?.categoria_7t ? categoriasPorTransformacion[internalSelectedProyecto.categoria_7t] || [] : [];

  // Subida de archivos a Supabase Storage
  const uploadToSupabase = async (file: File, folder: string) => {
    if (!comunaId) throw new Error("Comuna no identificada");
    const fileExt = file.name.split('.').pop();
    const fileName = `${Math.random().toString(36).substring(2)}.${fileExt}`;
    const filePath = `comuna_${comunaId}/rendiciones/${folder}/${fileName}`;
    const { error: uploadError } = await supabase.storage
      .from('rendiciones_comuna')
      .upload(filePath, file);
    if (uploadError) throw uploadError;
    const { data } = supabase.storage.from('rendiciones_comuna').getPublicUrl(filePath);
    return data.publicUrl;
  };

  const handleFileUpload = (label: string, file: File) => {
    setFiles(prev => ({ ...prev, [label]: file.name }));
    setFileObjects(prev => ({ ...prev, [label]: file }));
  };

  const handlePhotoChange = (index: number, file: File) => {
    setPhotoFiles(prev => { const newFiles = [...prev]; newFiles[index] = file; return newFiles; });
    const reader = new FileReader();
    reader.onload = (e) => setPhotos(prev => prev.map((p, i) => i === index ? { ...p, preview: e.target?.result as string } : p));
    reader.readAsDataURL(file);
  };

  const handleSubmit = async () => {
    // Validaciones previas
    if (!internalSelectedProyecto) {
      alert("Debe seleccionar un proyecto.");
      return;
    }
    if (!selectedCategoria) {
      alert("Debe seleccionar una categoría.");
      return;
    }
    if (!fechaInicio || !fechaFin) {
      alert("Debe indicar el lapso contable (fecha inicio y fin).");
      return;
    }
    if (!informeGestion.trim()) {
      alert("Debe redactar el informe de gestión.");
      return;
    }
    const vocerosIdsValidos = selectedVoceros
      .map(v => parseInt(v.id_voceroc))
      .filter(id => !isNaN(id) && id > 0);
    if (vocerosIdsValidos.length === 0) {
      alert("Debe seleccionar al menos un vocero firmante.");
      return;
    }
    if (!acceptedTerms) {
      alert("Debe aceptar los términos legales.");
      return;
    }
    if (!comunaId) {
      alert("No se pudo identificar la comuna.");
      return;
    }

    try {
      setIsSubmitting(true);

      // Subir documentos (opcionales) – si no hay archivo, se envía cadena vacía
      const uploadPromises = Object.entries(fileObjects).map(async ([label, file]) => {
        if (!file) return { label, url: "" };
        const url = await uploadToSupabase(file, 'documentos');
        return { label, url };
      });
      const uploadedDocs = await Promise.all(uploadPromises);
      const docUrls = Object.fromEntries(uploadedDocs.map(d => [d.label, d.url]));

      // Subir fotos (opcionales)
      const validPhotoFiles = photoFiles.filter((f): f is File => f !== null);
      const photoUrls = await Promise.all(validPhotoFiles.map(file => uploadToSupabase(file, 'evidencia')));

      // Guardar en tabla rendiciones_comuna
      const { error } = await supabase.from('rendiciones_comuna').insert([{
        id_proyecto_comuna: internalSelectedProyecto.id_proyecto_comuna,
        id_comuna: comunaId,
        es_rendicion_final: false,
        categoria_seleccionada: selectedCategoria,
        fecha_inicio: fechaInicio,
        fecha_fin: fechaFin,
        ingresos,
        egresos,
        id_voceros_firmantes: vocerosIdsValidos,   // Array de enteros (id_voceroc)
        fotos_evidencia_urls: photoUrls,
        informe_gestion: informeGestion,
        acta_asamblea_url: docUrls["Acta de Asamblea"] || "",
        facturas_legales_url: docUrls["Facturas Legales"] || "",
        informe_contraloria_url: docUrls["Informe Contraloría"] || "",
        estado_cuenta_url: docUrls["Estado de Cuenta"] || "",
        acepto_terminos: acceptedTerms
      }]);
      if (error) throw error;

      alert("¡Rendición guardada exitosamente!");
      onSuccess?.();
      onClose();
    } catch (error: any) {
      console.error(error);
      alert(`Error al guardar: ${error.message}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const addVoceroRow = () => setSelectedVoceros([...selectedVoceros, { id_voceroc: "" }]);
  const updateVoceroSelection = (index: number, id: string) => {
    const newVoceros = [...selectedVoceros];
    newVoceros[index].id_voceroc = id;
    setSelectedVoceros(newVoceros);
  };
  const removeVoceroRow = (index: number) => setSelectedVoceros(selectedVoceros.filter((_, i) => i !== index));

  const FileUploader = ({ label }: { label: string }) => {
    const inputRef = useRef<HTMLInputElement>(null);
    const isUploaded = !!files[label];
    return (
      <div onClick={() => inputRef.current?.click()} className={cn("flex items-center justify-between p-3 rounded-xl border cursor-pointer transition-all", isUploaded ? "bg-emerald-50 border-emerald-100" : "bg-gray-50 border-gray-100 hover:bg-gray-100")}>
        <span className={cn("text-[10px] font-black uppercase truncate mr-2", isUploaded ? "text-emerald-700" : "text-slate-500")}>{isUploaded ? files[label] : label}</span>
        <input type="file" ref={inputRef} className="hidden" onChange={(e) => e.target.files?.[0] && handleFileUpload(label, e.target.files[0])} />
        {isUploaded ? <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0" /> : <Upload className="h-4 w-4 text-slate-300 shrink-0" />}
      </div>
    );
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-100 flex items-center justify-center p-4">
          <motion.div 
            initial={{ opacity: 0 }} 
            animate={{ opacity: 1 }} 
            exit={{ opacity: 0 }} 
            onClick={onClose} 
            className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" 
          />
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }} 
            animate={{ opacity: 1, scale: 1 }} 
            exit={{ opacity: 0, scale: 0.95 }} 
            className="relative w-full max-w-2xl bg-white rounded-4xl shadow-2xl overflow-hidden flex flex-col max-h-[85vh]"
          >
            {/* Cabecera compactada */}
            <div className="p-5 border-b border-gray-50 flex items-center justify-between bg-gray-50/30">
              <div className="flex items-center gap-3">
                <div className="h-9 w-9 rounded-xl bg-brand-primary/10 flex items-center justify-center text-brand-primary font-black text-xs">
                  {step}
                </div>
                <div>
                  <h4 className="text-base font-black text-slate-800 uppercase tracking-tight">Rendición de Cuentas</h4>
                  <p className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">{user?.nombreComuna || 'Comuna'}</p>
                </div>
              </div>
              <button onClick={onClose} className="p-2 rounded-xl hover:bg-gray-100 transition-colors">
                <X className="h-4 w-4 text-slate-400" />
              </button>
            </div>

            {/* Contenido scrollable */}
            <div className="flex-1 overflow-y-auto p-6 space-y-5">
              {/* PASO 1 */}
              {step === 1 && (
                <div className="space-y-4">
                  <div className="grid sm:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">Proyecto a Rendir</label>
                      <select
                        value={internalSelectedProyecto?.id_proyecto_comuna || ''}
                        onChange={(e) => {
                          const proy = proyectosDisponibles.find(p => p.id_proyecto_comuna === parseInt(e.target.value)) || null;
                          setInternalSelectedProyecto(proy);
                        }}
                        className="w-full p-3 rounded-xl bg-gray-50 border-2 border-transparent focus:border-brand-primary outline-none font-bold text-xs"
                      >
                        <option value="">{loadingData ? "Cargando..." : "Seleccionar Proyecto"}</option>
                        {proyectosDisponibles.map(p => (
                          <option key={p.id_proyecto_comuna} value={p.id_proyecto_comuna}>{p.codigo} - {p.nombre}</option>
                        ))}
                      </select>
                      {proyectosDisponibles.length === 0 && !loadingData && (
                        <p className="text-[9px] text-amber-600 font-bold mt-1">
                          ⚠️ Todos los proyectos ya poseen rendición activa.
                        </p>
                      )}
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">Categoría</label>
                      <select value={selectedCategoria} onChange={(e) => setSelectedCategoria(e.target.value)} className="w-full p-3 rounded-xl bg-gray-50 border-2 border-transparent focus:border-brand-primary outline-none font-bold text-xs">
                        <option value="">Seleccionar Categoría</option>
                        {categoriasDisponibles.map(c => <option key={c} value={c}>{c.toUpperCase()}</option>)}
                      </select>
                    </div>
                  </div>
                  <div className="grid sm:grid-cols-2 gap-4 pt-1">
                    <div className="p-3.5 rounded-xl bg-emerald-50 text-emerald-700 font-black text-xs border border-emerald-100 flex flex-col justify-center">
                      <p className="text-[8px] uppercase text-emerald-600/60 mb-0.5 tracking-wider">Ente Financiador</p>
                      <span className="truncate">{internalSelectedProyecto?.ente_financiamiento || "Seleccione un proyecto"}</span>
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">Lapso Contable</label>
                      <div className="flex gap-2">
                        <input type="date" value={fechaInicio} onChange={(e) => setFechaInicio(e.target.value)} className="w-full p-2.5 rounded-xl bg-gray-50 text-xs font-bold outline-none border border-transparent focus:border-gray-200" />
                        <input type="date" value={fechaFin} onChange={(e) => setFechaFin(e.target.value)} className="w-full p-2.5 rounded-xl bg-gray-50 text-xs font-bold outline-none border border-transparent focus:border-gray-200" />
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* PASO 2 */}
              {step === 2 && (
                <div className="space-y-5">
                  <div className="grid grid-cols-3 gap-3">
                    <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-100">
                      <label className="text-[8px] font-black text-emerald-600 uppercase tracking-wider block mb-0.5">Ingresos</label>
                      <input type="number" value={ingresos} onChange={(e) => setIngresos(Number(e.target.value))} className="w-full bg-transparent text-lg font-black outline-none p-0 text-emerald-800" />
                    </div>
                    <div className="p-3 rounded-xl bg-rose-50 border border-rose-100">
                      <label className="text-[8px] font-black text-rose-600 uppercase tracking-wider block mb-0.5">Egresos</label>
                      <input type="number" value={egresos} onChange={(e) => setEgresos(Number(e.target.value))} className="w-full bg-transparent text-lg font-black outline-none p-0 text-rose-800" />
                    </div>
                    <div className="p-3 rounded-xl bg-slate-900 text-white flex flex-col justify-between">
                      <label className="text-[8px] font-black text-slate-400 uppercase tracking-wider block">Saldo</label>
                      <p className="text-base font-black text-emerald-400 truncate">{saldo.toLocaleString()} BS</p>
                    </div>
                  </div>
                  <div className="space-y-2.5">
                    <div className="flex justify-between items-center border-b border-gray-100 pb-1.5">
                      <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">Voceros Firmantes</label>
                      <button onClick={addVoceroRow} className="text-[9px] font-black text-brand-primary tracking-wider hover:opacity-80">+ AÑADIR FILA</button>
                    </div>
                    <div className="space-y-2 max-h-40 overflow-y-auto pr-1">
                      {selectedVoceros.map((sv, index) => {
                        const voceroInfo = vocerosFirmantes.find(v => v.id_voceroc.toString() === sv.id_voceroc);
                        return (
                          <div key={index} className="flex gap-2 items-center">
                            <div className="flex-1 grid grid-cols-2 gap-2 p-2.5 bg-gray-50 rounded-xl border border-gray-100">
                              <select value={sv.id_voceroc} onChange={(e) => updateVoceroSelection(index, e.target.value)} className="bg-transparent text-xs font-bold outline-none cursor-pointer">
                                <option value="">Seleccionar Vocero...</option>
                                {vocerosFirmantes.map(v => <option key={v.id_voceroc} value={v.id_voceroc}>{v.nombre_completo}</option>)}
                              </select>
                              <div className="text-xs font-bold text-slate-400 flex items-center px-2 border-l border-gray-200 truncate">
                                {voceroInfo ? `${voceroInfo.cedula}` : "Cédula"}
                              </div>
                            </div>
                            {selectedVoceros.length > 1 && (
                              <button onClick={() => removeVoceroRow(index)} className="p-2 text-rose-500 hover:bg-rose-50 rounded-lg transition-colors shrink-0">
                                <Trash2 className="h-4 w-4" />
                              </button>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              )}

              {/* PASO 3 */}
              {step === 3 && (
                <div className="space-y-4">
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wide block">Registro Fotográfico</label>
                    <div className="grid grid-cols-3 gap-3">
                      {photos.map((photo, index) => (
                        <div key={photo.id} className="aspect-video rounded-xl border-2 border-dashed border-gray-200 flex flex-col items-center justify-center relative overflow-hidden bg-gray-50 group hover:border-brand-primary/30 transition-colors">
                          {photo.preview ? (
                            <>
                              <img src={photo.preview} className="w-full h-full object-cover" />
                              <button onClick={() => {
                                setPhotos(prev => prev.map((p, i) => i === index ? { ...p, preview: null } : p));
                                setPhotoFiles(prev => prev.map((f, i) => i === index ? null : f));
                              }} className="absolute top-1.5 right-1.5 p-1 bg-rose-500 text-white rounded-full hover:bg-rose-600 transition-colors">
                                <X className="h-2.5 w-2.5" />
                              </button>
                            </>
                          ) : (
                            <div onClick={() => photoInputsRef.current[index]?.click()} className="cursor-pointer flex flex-col items-center justify-center w-full h-full p-2">
                              <Upload className="h-4 w-4 text-slate-300 group-hover:text-brand-primary transition-colors" />
                              <input type="file" ref={el => { if (el) photoInputsRef.current[index] = el; }} className="hidden" accept="image/*" onChange={e => e.target.files?.[0] && handlePhotoChange(index, e.target.files[0])} />
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">Informe de Gestión</label>
                    <textarea value={informeGestion} onChange={(e) => setInformeGestion(e.target.value)} placeholder="Describa los avances cualitativos y cuantitativos..." className="w-full p-3 rounded-xl bg-gray-50 border-2 border-transparent focus:border-brand-primary outline-none font-bold text-xs min-h-22.5 resize-none" />
                  </div>
                </div>
              )}

              {/* PASO 4 */}
              {step === 4 && (
                <div className="space-y-4">
                  <div className="grid sm:grid-cols-2 gap-3">
                    <FileUploader label="Acta de Asamblea" />
                    <FileUploader label="Facturas Legales" />
                    <FileUploader label="Informe Contraloría" />
                    <FileUploader label="Estado de Cuenta" />
                  </div>
                  <div className="p-4 rounded-2xl bg-slate-900 text-white space-y-3 shadow-md">
                    <div className="flex gap-3">
                      <AlertCircle className="h-4 w-4 text-brand-primary shrink-0 mt-0.5" />
                      <div>
                        <p className="text-[9px] font-black uppercase tracking-widest text-brand-primary">Declaración Jurada</p>
                        <p className="text-[10px] text-slate-400 leading-normal">Responsabilidad civil, penal y administrativa correspondiente por el manejo de los fondos asignados.</p>
                      </div>
                    </div>
                    <label className="flex items-center gap-2.5 p-2.5 rounded-xl bg-white/5 cursor-pointer hover:bg-white/10 transition-colors select-none">
                      <input type="checkbox" checked={acceptedTerms} onChange={e => setAcceptedTerms(e.target.checked)} className="w-4 h-4 accent-brand-primary cursor-pointer" />
                      <span className="text-[9px] font-black uppercase tracking-wide">Acepto la responsabilidad legal de los datos</span>
                    </label>
                  </div>
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="p-4 bg-gray-50/50 border-t border-gray-100 flex justify-between items-center">
              <button onClick={() => step > 1 ? setStep(step - 1) : onClose()} className="flex items-center gap-1.5 text-[10px] font-black uppercase text-slate-500 hover:text-slate-700 transition-colors">
                <ChevronLeft className="h-3.5 w-3.5" /> {step === 1 ? 'Cancelar' : 'Anterior'}
              </button>
              <button 
                onClick={() => step < 4 ? setStep(step + 1) : handleSubmit()} 
                disabled={isSubmitting || (step === 4 && !acceptedTerms)} 
                className="px-6 py-2.5 rounded-xl bg-brand-primary text-white font-black text-[10px] uppercase tracking-wider disabled:opacity-40 flex items-center gap-2 transition-transform active:scale-[0.98]"
              >
                {isSubmitting ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : (step === 4 ? 'Finalizar' : 'Siguiente')}
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};