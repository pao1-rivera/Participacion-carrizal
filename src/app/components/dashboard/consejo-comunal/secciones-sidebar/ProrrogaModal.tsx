"use client";

import React, { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  X, Upload, DollarSign, Calendar, CheckCircle2, AlertCircle, 
  User, CreditCard, Trash2, ChevronLeft, Loader2
} from "lucide-react";
import { cn } from "@/app/lib/utils";
import { supabase } from "@/app/lib/supabaseClient";
import { useAuth } from "@/context/AuthContext";

interface ProyectoSimple {
  id_proyecto: number;
  nombre: string;
  codigo?: string;
  categoria_7t?: string;
  ente_financiamiento?: string;
  estado?: string;
}

interface ProrrogaModalProps {
  isOpen: boolean;
  onClose: () => void;
  proyectoName: string;
  proyectos: ProyectoSimple[];
  onSelectProyecto: (proyecto: ProyectoSimple) => void;
  selectedProyecto: ProyectoSimple | null;
  onProrrogaAccepted?: (proyecto: { id_proyecto: number; nombre: string; codigo?: string }) => void;
  // Nuevas props para edición
  editMode?: boolean;
  initialData?: any;
  onSuccess?: () => void;
}

export const ProrrogaModal = ({ 
  isOpen, 
  onClose, 
  proyectos = [], 
  onSelectProyecto, 
  selectedProyecto,
  onProrrogaAccepted,
  editMode = false,
  initialData,
  onSuccess
}: ProrrogaModalProps) => {
  const { user } = useAuth();
  const [consejoId, setConsejoId] = useState<number | null>(null);
  const [voceros, setVoceros] = useState<{ id_vocero: number; nombre_completo: string; cedula: string }[]>([]);
  const [selectedVocerosIds, setSelectedVocerosIds] = useState<number[]>([]);
  
  const [step, setStep] = useState(1);
  const [motivo, setMotivo] = useState("");
  const [presupuestoEstimado, setPresupuestoEstimado] = useState(0);
  const [tiempoEstimado, setTiempoEstimado] = useState("");
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  
  // Manejo de archivos: para cada tipo guardamos el nombre (para mostrar) y el File object (si es nuevo)
  const [files, setFiles] = useState<{ [key: string]: string | null }>({
    "Acta de Asamblea": null,
    "Evidencia del Avance": null,
  });
  const [fileObjects, setFileObjects] = useState<{ [key: string]: File | null }>({});
  // Guardamos las rutas existentes en modo edición para no perderlas si no se reemplazan
  const [existingFilePaths, setExistingFilePaths] = useState<{ [key: string]: string | null }>({
    acta_url: null,
    evidencia_url: null,
  });
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Obtener consejoId
  useEffect(() => {
    const fetchConsejoId = async () => {
      if (!user?.id) return;
      const { data, error } = await supabase
        .from('datos_consejo_comunal')
        .select('id_consejo')
        .or(`id_usuario.eq.${user.id},id_usuario_auxiliar.eq.${user.id}`)
        .maybeSingle();
      if (data) setConsejoId(data.id_consejo);
    };
    fetchConsejoId();
  }, [user]);

  // Cargar voceros firmantes
  useEffect(() => {
    const fetchVoceros = async () => {
      if (!isOpen || !consejoId) return;
      const { data, error } = await supabase
        .from('voceros')
        .select('id_vocero, nombre_completo, cedula')
        .eq('id_consejo', consejoId)
        .eq('es_firmante', true);
      if (error) {
        console.error("Error cargando voceros:", error);
        setError("No se pudieron cargar los voceros");
      } else {
        setVoceros(data || []);
      }
    };
    fetchVoceros();
  }, [isOpen, consejoId]);

  // Cargar datos iniciales en modo edición
  useEffect(() => {
    if (isOpen && editMode && initialData) {
      // Proyecto
      const proyectoEdit = proyectos.find(p => p.id_proyecto === initialData.id_proyecto);
      if (proyectoEdit && !selectedProyecto) {
        onSelectProyecto(proyectoEdit);
      }
      setMotivo(initialData.motivo || "");
      setPresupuestoEstimado(initialData.presupuesto_estimado || 0);
      setTiempoEstimado(initialData.tiempo_estimado || "");
      setSelectedVocerosIds(initialData.id_voceros_firmantes || []);
      // Guardar rutas de archivos existentes
      setExistingFilePaths({
        acta_url: initialData.acta_url || null,
        evidencia_url: initialData.evidencia_url || null,
      });
      // Mostrar nombres de los archivos existentes en la UI
      if (initialData.acta_url) {
        const actaName = initialData.acta_url.split('/').pop() || "Acta existente";
        setFiles(prev => ({ ...prev, "Acta de Asamblea": actaName }));
      }
      if (initialData.evidencia_url) {
        const evidenciaName = initialData.evidencia_url.split('/').pop() || "Evidencia existente";
        setFiles(prev => ({ ...prev, "Evidencia del Avance": evidenciaName }));
      }
      // No se requiere re-subir archivos a menos que se cambien
    }
  }, [isOpen, editMode, initialData, proyectos, onSelectProyecto, selectedProyecto]);

  // Resetear formulario al cerrar
  useEffect(() => {
    if (!isOpen) {
      setStep(1);
      setMotivo("");
      setPresupuestoEstimado(0);
      setTiempoEstimado("");
      setAcceptedTerms(false);
      setFiles({ "Acta de Asamblea": null, "Evidencia del Avance": null });
      setFileObjects({});
      setSelectedVocerosIds([]);
      setError("");
      setExistingFilePaths({ acta_url: null, evidencia_url: null });
    }
  }, [isOpen]);

  const handleFileUpload = (label: string, file: File) => {
    setFiles(prev => ({ ...prev, [label]: file.name }));
    setFileObjects(prev => ({ ...prev, [label]: file }));
  };

  const toggleVocero = (id: number) => {
    setSelectedVocerosIds(prev =>
      prev.includes(id) ? prev.filter(v => v !== id) : [...prev, id]
    );
  };

  const FileUploader = ({ label }: { label: string }) => {
    const inputRef = useRef<HTMLInputElement>(null);
    const isUploaded = !!files[label];
    return (
      <div 
        onClick={() => inputRef.current?.click()}
        className={cn(
          "flex items-center justify-between p-3 rounded-xl border cursor-pointer transition-all",
          isUploaded ? "bg-emerald-50 border-emerald-100" : "bg-gray-50 border-gray-100 hover:bg-gray-100"
        )}
      >
        <span className={cn("text-[10px] font-black uppercase", isUploaded ? "text-emerald-700" : "text-slate-500")}>
          {isUploaded ? files[label] : label}
        </span>
        <input type="file" ref={inputRef} className="hidden" accept=".pdf,.jpg,.png" onChange={(e) => e.target.files?.[0] && handleFileUpload(label, e.target.files[0])} />
        {isUploaded ? <CheckCircle2 className="h-4 w-4 text-emerald-500" /> : <Upload className="h-4 w-4 text-slate-300" />}
      </div>
    );
  };

  const uploadFile = async (file: File, folder: string): Promise<string | null> => {
    if (!consejoId) return null;
    const fileExt = file.name.split('.').pop();
    const fileName = `${Date.now()}_${Math.random().toString(36).substring(7)}.${fileExt}`;
    const filePath = `${consejoId}/prorrogas/${folder}/${fileName}`;
    const { error } = await supabase.storage.from('proyectos_docs').upload(filePath, file);
    if (error) {
      console.error("Error subiendo archivo:", error);
      return null;
    }
    return filePath;
  };

  const deleteOldFile = async (filePath: string | null) => {
    if (!filePath) return;
    const { error } = await supabase.storage.from('proyectos_docs').remove([filePath]);
    if (error) console.error("Error eliminando archivo antiguo:", error);
  };

  const handleSubmit = async () => {
    if (!selectedProyecto) {
      setError("Seleccione un proyecto");
      return;
    }
    if (selectedVocerosIds.length === 0) {
      setError("Seleccione al menos un vocero firmante");
      return;
    }
    if (!motivo.trim()) {
      setError("Complete el motivo de la prórroga");
      return;
    }
    if (presupuestoEstimado <= 0) {
      setError("Ingrese un presupuesto estimado válido");
      return;
    }
    if (!tiempoEstimado.trim()) {
      setError("Indique el tiempo estimado");
      return;
    }
    // Validar que se hayan subido los archivos (nuevos o existentes)
    const hasActa = fileObjects["Acta de Asamblea"] || existingFilePaths.acta_url;
    const hasEvidencia = fileObjects["Evidencia del Avance"] || existingFilePaths.evidencia_url;
    if (!hasActa || !hasEvidencia) {
      setError("Debe subir el Acta y la Evidencia de avance (o mantener los existentes)");
      return;
    }
    if (!acceptedTerms) {
      setError("Debe aceptar los términos legales");
      return;
    }

    setLoading(true);
    setError("");

    try {
      let actaPath = existingFilePaths.acta_url;
      let evidenciaPath = existingFilePaths.evidencia_url;

      // Subir nuevos archivos si se seleccionaron
      if (fileObjects["Acta de Asamblea"]) {
        // Opcional: eliminar el anterior si existe
        if (actaPath) await deleteOldFile(actaPath);
        const newActaPath = await uploadFile(fileObjects["Acta de Asamblea"]!, "actas");
        if (!newActaPath) throw new Error("Error al subir el acta");
        actaPath = newActaPath;
      }
      if (fileObjects["Evidencia del Avance"]) {
        if (evidenciaPath) await deleteOldFile(evidenciaPath);
        const newEvidenciaPath = await uploadFile(fileObjects["Evidencia del Avance"]!, "evidencias");
        if (!newEvidenciaPath) throw new Error("Error al subir la evidencia");
        evidenciaPath = newEvidenciaPath;
      }

      if (editMode && initialData?.id_solicitud) {
        // Actualizar solicitud existente
        const { error: updateError } = await supabase
          .from('solicitudes_prorroga')
          .update({
            motivo: motivo,
            presupuesto_estimado: presupuestoEstimado,
            tiempo_estimado: tiempoEstimado,
            acta_url: actaPath,
            evidencia_url: evidenciaPath,
            id_voceros_firmantes: selectedVocerosIds,
            // No cambiamos el estado; se mantiene el que tenga
          })
          .eq('id_solicitud', initialData.id_solicitud);

        if (updateError) throw updateError;
        
        // Notificar éxito
        if (onSuccess) onSuccess();
        if (onProrrogaAccepted && selectedProyecto) {
          onProrrogaAccepted({ id_proyecto: selectedProyecto.id_proyecto, nombre: selectedProyecto.nombre, codigo: selectedProyecto.codigo });
        }
      } else {
        // Crear nueva solicitud
        const { error: insertError } = await supabase
          .from('solicitudes_prorroga')
          .insert({
            id_proyecto: selectedProyecto.id_proyecto,
            id_consejo: consejoId,
            motivo: motivo,
            presupuesto_estimado: presupuestoEstimado,
            tiempo_estimado: tiempoEstimado,
            acta_url: actaPath,
            evidencia_url: evidenciaPath,
            id_voceros_firmantes: selectedVocerosIds,
            estado: 'pendiente'
          });

        if (insertError) throw insertError;

        if (onProrrogaAccepted && selectedProyecto) {
          onProrrogaAccepted({ id_proyecto: selectedProyecto.id_proyecto, nombre: selectedProyecto.nombre, codigo: selectedProyecto.codigo });
        }
      }
      
      onClose();
    } catch (err: any) {
      setError(err.message || "Error al guardar la solicitud");
    } finally {
      setLoading(false);
    }
  };

  const canGoNext = () => {
    if (step === 1) return selectedProyecto !== null && motivo.trim() !== "";
    if (step === 2) {
      const hasActa = fileObjects["Acta de Asamblea"] || existingFilePaths.acta_url;
      const hasEvidencia = fileObjects["Evidencia del Avance"] || existingFilePaths.evidencia_url;
      return presupuestoEstimado > 0 && 
             tiempoEstimado.trim() !== "" && 
             hasActa && 
             hasEvidencia &&
             selectedVocerosIds.length > 0;
    }
    if (step === 3) return acceptedTerms;
    return false;
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <motion.div 
            initial={{ opacity: 0 }} 
            animate={{ opacity: 1 }} 
            exit={{ opacity: 0 }} 
            onClick={onClose} 
            className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" 
          />
          <motion.div 
            initial={{ opacity: 0, scale: 0.98, y: 15 }} 
            animate={{ opacity: 1, scale: 1, y: 0 }} 
            exit={{ opacity: 0, scale: 0.98, y: 15 }} 
            className="relative w-full max-w-xl bg-white rounded-3xl shadow-xl overflow-hidden flex flex-col max-h-[85vh] border border-slate-100"
          >
            <div className="px-5 py-3.5 border-b border-slate-100 bg-white sticky top-0 z-10">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-base font-bold text-slate-800 flex items-center gap-1.5">
                    <Calendar className="h-4 w-4 text-orange-500" /> 
                    {editMode ? "Editar Solicitud de Prórroga" : "Solicitud de Prórroga"}
                  </h4>
                  <div className="flex gap-1 mt-1.5">
                    {[1, 2, 3].map((i) => (
                      <div key={i} className={cn("h-1 w-8 rounded-full transition-all", step >= i ? "bg-orange-500" : "bg-slate-100")} />
                    ))}
                  </div>
                </div>
                <button onClick={onClose} className="p-1 rounded-lg text-slate-400 hover:bg-slate-50 transition-colors">
                  <X className="h-4 w-4" />
                </button>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto px-5 py-4 space-y-4">
              {error && (
                <div className="p-2 bg-rose-50 border border-rose-100 rounded-lg flex items-center gap-2">
                  <AlertCircle className="h-3 w-3 text-rose-600" />
                  <p className="text-[10px] text-rose-600">{error}</p>
                </div>
              )}

              {step === 1 && (
                <div className="space-y-4">
                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Proyecto a prorrogar *</label>
                    <select 
  value={selectedProyecto?.id_proyecto || ''} 
  onChange={(e) => {
    const proyecto = proyectos.find(p => p.id_proyecto === parseInt(e.target.value));
    if (proyecto) onSelectProyecto(proyecto);
  }} 
  className="w-full p-2.5 rounded-xl bg-slate-50 border border-slate-200/60 text-xs font-semibold text-slate-700 focus:border-orange-500 outline-none"
  disabled={editMode}
>
  <option value="">Seleccionar proyecto</option>
  {proyectos
    .filter(p => !editMode ? p.estado === 'Culminado' : true)
    .map(p => (
      <option key={p.id_proyecto} value={p.id_proyecto}>
        {p.codigo ? `${p.codigo} - ${p.nombre}` : p.nombre}
      </option>
    ))}
</select>
                  </div>

                  {selectedProyecto && (
                    <div className="grid grid-cols-2 gap-2">
                      <div className="p-2.5 rounded-xl bg-emerald-50/50 border border-emerald-100">
                        <p className="text-[9px] font-bold text-slate-400 uppercase">Ente Financiador</p>
                        <p className="text-xs font-bold text-emerald-700 truncate">{selectedProyecto.ente_financiamiento || "No especificado"}</p>
                      </div>
                      <div className="p-2.5 rounded-xl bg-orange-50/50 border border-orange-100">
                        <p className="text-[9px] font-bold text-slate-400 uppercase">Transformación</p>
                        <p className="text-xs font-bold text-orange-700">{selectedProyecto.categoria_7t ? `${selectedProyecto.categoria_7t}` : "—"}</p>
                      </div>
                    </div>
                  )}

                  <div>
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Motivo de la prórroga *</label>
                    <textarea 
                      rows={3} 
                      value={motivo} 
                      onChange={(e) => setMotivo(e.target.value)} 
                      placeholder="Explique detalladamente el motivo..." 
                      className="w-full mt-1 p-2.5 rounded-xl bg-slate-50 border border-slate-200/60 text-xs text-slate-600 focus:border-orange-500 outline-none resize-none" 
                    />
                  </div>
                </div>
              )}

              {step === 2 && (
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-[10px] font-bold text-slate-400 uppercase">Presupuesto estimado *</label>
                      <div className="relative mt-1">
                        <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-orange-500" />
                        <input type="number" value={presupuestoEstimado} onChange={(e) => setPresupuestoEstimado(Number(e.target.value))} className="w-full p-2 pl-8 text-xs rounded-xl bg-slate-50 border border-slate-200/60 outline-none focus:border-orange-500" placeholder="0.00" />
                      </div>
                    </div>
                    <div>
                      <label className="text-[10px] font-bold text-slate-400 uppercase">Tiempo estimado *</label>
                      <div className="relative mt-1">
                        <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-orange-500" />
                        <input type="text" value={tiempoEstimado} onChange={(e) => setTiempoEstimado(e.target.value)} className="w-full p-2 pl-8 text-xs rounded-xl bg-slate-50 border border-slate-200/60 outline-none focus:border-orange-500" placeholder="Ej: 3 meses" />
                      </div>
                    </div>
                  </div>

                  <div>
                    <label className="text-[10px] font-bold text-slate-400 uppercase">Documentos de soporte *</label>
                    <div className="grid grid-cols-2 gap-2 mt-1">
                      <FileUploader label="Acta de Asamblea" />
                      <FileUploader label="Evidencia del Avance" />
                    </div>
                    {editMode && (
                      <p className="text-[8px] text-slate-400 mt-1">
                        * Si no selecciona nuevos archivos, se mantendrán los actuales.
                      </p>
                    )}
                  </div>

                  <div>
                    <label className="text-[10px] font-bold text-slate-400 uppercase block mb-2">Voceros firmantes *</label>
                    <div className="max-h-48 overflow-y-auto space-y-2 border border-gray-100 rounded-xl p-2 bg-gray-50/50">
                      {voceros.length === 0 ? (
                        <p className="text-xs text-slate-400 text-center py-2">No hay voceros registrados</p>
                      ) : (
                        voceros.map(vocero => (
                          <label key={vocero.id_vocero} className="flex items-center gap-2 p-2 rounded-lg bg-white border border-gray-100 cursor-pointer hover:bg-gray-50">
                            <input
                              type="checkbox"
                              checked={selectedVocerosIds.includes(vocero.id_vocero)}
                              onChange={() => toggleVocero(vocero.id_vocero)}
                              className="w-4 h-4 accent-orange-500"
                            />
                            <div className="flex-1">
                              <p className="text-xs font-bold">{vocero.nombre_completo}</p>
                              <p className="text-[9px] text-slate-500">C.I. {vocero.cedula}</p>
                            </div>
                          </label>
                        ))
                      )}
                    </div>
                    {selectedVocerosIds.length > 0 && (
                      <p className="text-[8px] text-orange-600 mt-1">✓ {selectedVocerosIds.length} vocero(s) seleccionado(s)</p>
                    )}
                  </div>
                </div>
              )}

              {step === 3 && (
                <div className="space-y-4">
                  <div className="p-3.5 rounded-2xl bg-slate-900 text-white">
                    <div className="flex items-start gap-2.5">
                      <AlertCircle className="h-4 w-4 text-orange-400 flex-shrink-0 mt-0.5" />
                      <div>
                        <p className="text-[9px] font-bold uppercase tracking-wider text-orange-400">Aviso Legal</p>
                        <p className="text-xs text-slate-300 mt-0.5 leading-snug">La solicitud debe estar justificada. Los voceros certifican la veracidad de la información aportada.</p>
                      </div>
                    </div>
                  </div>
                  
                  <label className="flex items-center gap-2.5 cursor-pointer p-3 bg-slate-50 rounded-xl border border-slate-100">
                    <input type="checkbox" checked={acceptedTerms} onChange={(e) => setAcceptedTerms(e.target.checked)} className="w-4 h-4 accent-orange-500 flex-shrink-0" />
                    <span className="text-[11px] font-medium text-slate-600 leading-tight">Certifico la veracidad de la información y los soportes adjuntos</span>
                  </label>

                  <div className="text-xs bg-orange-50/60 border border-orange-100 p-3 rounded-2xl">
                    <p className="font-bold text-slate-800">Resumen de solicitud:</p>
                    <ul className="mt-1 space-y-0.5 text-slate-600 list-none pl-0">
                      <li className="truncate">📁 <span className="font-medium text-slate-700">Proyecto:</span> {selectedProyecto?.nombre || "—"}</li>
                      <li>💰 <span className="font-medium text-slate-700">Presupuesto:</span> ${presupuestoEstimado.toLocaleString()}</li>
                      <li>⏱️ <span className="font-medium text-slate-700">Tiempo:</span> {tiempoEstimado || "—"}</li>
                      <li>👥 <span className="font-medium text-slate-700">Voceros:</span> {selectedVocerosIds.length} firmantes</li>
                      <li>📄 <span className="font-medium text-slate-700">Documentos:</span> Acta ✓, Evidencia ✓</li>
                    </ul>
                  </div>
                </div>
              )}
            </div>

            <div className="px-5 py-3 bg-slate-50 border-t border-slate-100 flex justify-between items-center">
              <button onClick={() => step > 1 ? setStep(step - 1) : onClose()} className="flex items-center gap-1 text-[11px] font-bold uppercase text-slate-400 hover:text-slate-600 transition-colors">
                <ChevronLeft className="h-3.5 w-3.5" /> {step === 1 ? 'Cancelar' : 'Anterior'}
              </button>
              {step < 3 ? (
                <button onClick={() => canGoNext() && setStep(step + 1)} disabled={!canGoNext()} className="px-5 py-2 text-xs rounded-xl bg-orange-500 text-white font-bold uppercase disabled:opacity-40 shadow-sm transition-opacity">
                  Siguiente
                </button>
              ) : (
                <button onClick={handleSubmit} disabled={loading || !canGoNext()} className="px-5 py-2 text-xs rounded-xl bg-emerald-600 text-white font-bold uppercase disabled:opacity-40 shadow-sm transition-opacity flex items-center gap-1">
                  {loading && <Loader2 className="h-3 w-3 animate-spin" />}
                  {editMode ? "Actualizar solicitud" : "Enviar solicitud"}
                </button>
              )}
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};