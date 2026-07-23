"use client";

import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Shield, FileCheck, Activity, Upload, PlusCircle,
  FileText, Building2, X, CheckCircle2, Loader2, Eye,
  Users, ChevronDown, MapPin
} from "lucide-react";
import { supabase } from "@/app/lib/supabaseClient";
import { useAuth } from "@/context/AuthContext";
import { UbicacionG } from "./UbicacionG";
import { AlertModal } from "@/app/components/AlertModal";

// ==================== UTILIDADES ====================
const getSignedUrlForSala = async (filePath: string): Promise<string | null> => {
  if (!filePath) return null;
  const { data, error } = await supabase.storage
    .from('documentos_salas')
    .createSignedUrl(filePath, 60);
  if (error) {
    console.error('Error generando signed URL:', error);
    return null;
  }
  return data.signedUrl;
};

const FileUploadSection = ({ label, file, existingPath, onTrigger, onChange, inputRef }: any) => (
  <div className="space-y-1">
    <label className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">{label}</label>
    <input type="file" ref={inputRef} className="hidden" accept=".pdf,.jpg,.jpeg,.png" onChange={onChange} />
    <div className="flex items-center gap-1.5 p-2.5 bg-gray-50 rounded-xl ring-1 ring-gray-100">
      <button
        type="button"
        onClick={onTrigger}
        className={`text-[8px] font-black uppercase px-2.5 py-1.5 rounded-lg border transition-all ${file || existingPath ? "bg-emerald-50 text-emerald-600 border-emerald-100" : "bg-white text-brand-primary border-gray-100"}`}
      >
        {file || existingPath ? <CheckCircle2 className="inline h-2.5 w-2.5 mr-0.5" /> : <Upload className="inline h-2.5 w-2.5 mr-0.5" />}
        {file ? "Nuevo" : (existingPath ? "Existe" : "Subir")}
      </button>
      <span className="text-[8px] font-bold text-slate-400 italic truncate max-w-20">
        {file ? file.name : (existingPath ? "Actual" : "Ninguno")}
      </span>
    </div>
  </div>
);

// ==================== TIPOS ====================
interface Comuna {
  id_comuna: number;
  nombre_comuna: string;
}

interface Sector {
  id_sector: number;
  nombre_sector: string;
}

interface ConsejoComunal {
  id_consejo: number;
  nombre_consejo: string;
}

interface SalaRecord {
  id_sala?: number;
  nombre_sala: string;
  ubicacion: string;
  estatus: string;
  id_comuna?: number;
  id_sector?: number;
  // id_consejo?: number;
  acta_constitutiva_url: string | null;
  id_usuario: string;
}

// ==================== COMPONENTE PRINCIPAL ====================
export const DatosL = () => {
  const { user } = useAuth();
  const [sala, setSala] = useState<SalaRecord | null>(null);
  const [isRegistered, setIsRegistered] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [showUbicacion, setShowUbicacion] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Datos de catálogos
  const [comunas, setComunas] = useState<Comuna[]>([]);
  const [sectores, setSectores] = useState<Sector[]>([]);
  const [consejos, setConsejos] = useState<ConsejoComunal[]>([]);
  const [selectedComunaId, setSelectedComunaId] = useState<number | null>(null);
  const [selectedSectorId, setSelectedSectorId] = useState<number | null>(null);
  const [selectedConsejoId, setSelectedConsejoId] = useState<number | null>(null);

  // Archivos
  const [actaFile, setActaFile] = useState<File | null>(null);
  const actaInputRef = useRef<HTMLInputElement>(null!);

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

  const closeModal = () => setModalState(prev => ({ ...prev, isOpen: false }));

  // ========== OCULTAR SIDEBAR CUANDO MODAL O UBICACIÓN ESTÁN ABIERTOS ==========
  useEffect(() => {
    if (showModal || showUbicacion || modalState.isOpen) {
      document.body.classList.add('modal-open');
    } else {
      document.body.classList.remove('modal-open');
    }
    return () => document.body.classList.remove('modal-open');
  }, [showModal, showUbicacion, modalState.isOpen]);

  // ==================== CATÁLOGOS ====================
  const fetchComunas = async () => {
    // Consultamos directo a la tabla aprovechando que el RLS lo permite para la Sala
    const { data, error } = await supabase
      .from('datos_comuna')
      .select('id_comuna, nombre_comuna')
      .eq('activo', true)
      .order('nombre_comuna', { ascending: true });

    if (error) {
      console.error("Error cargando comunas desde la tabla:", error);
      return;
    }

    if (data) {
      setComunas(data);
    }
  };

  const fetchSectores = async (comunaId: number) => {
    if (!comunaId) {
      setSectores([]);
      return;
    }
    const { data } = await supabase
      .from('sectores')
      .select('id_sector, nombre_sector')
      .eq('id_datos_comuna', comunaId)
      .eq('activo', true);
    setSectores(data || []);
  };

  const fetchConsejos = async (comunaId: number) => {
    if (!comunaId) {
      setConsejos([]);
      return;
    }
    const { data: sectoresData } = await supabase
      .from('sectores')
      .select('id_sector')
      .eq('id_datos_comuna', comunaId)
      .eq('activo', true);
    if (!sectoresData || sectoresData.length === 0) {
      setConsejos([]);
      return;
    }
    const sectorIds = sectoresData.map(s => s.id_sector);
    const { data: consejosData } = await supabase
      .from('datos_consejo_comunal')
      .select('id_consejo, nombre_consejo')
      .in('id_sector', sectorIds);
    setConsejos(consejosData || []);
  };

  useEffect(() => {
    fetchComunas();
  }, []);

  useEffect(() => {
    if (selectedComunaId) {
      fetchSectores(selectedComunaId);
      fetchConsejos(selectedComunaId);
    } else {
      setSectores([]);
      setConsejos([]);
    }
  }, [selectedComunaId]);

  // Cargar datos de la sala del usuario
  useEffect(() => {
    if (!user?.id) {
      setLoading(false);
      return;
    }
    const fetchSala = async () => {
      setLoading(true);
      const { data, error } = await supabase
        .from('datos_sala_autogobierno')
        .select('*')
        .eq('id_usuario', user.id)
        .maybeSingle();

      if (data) {
        setSala(data);
        setIsRegistered(true);
        if (data.id_comuna) setSelectedComunaId(data.id_comuna);
        if (data.id_sector) setSelectedSectorId(data.id_sector);
        if (data.id_consejo) setSelectedConsejoId(data.id_consejo);
      } else {
        setIsRegistered(false);
      }
      setLoading(false);
    };
    fetchSala();
  }, [user]);

  const uploadActa = async (file: File, salaId: number): Promise<string | null> => {
    if (!user?.id) return null;
    const fileExt = file.name.split('.').pop();
    const fileName = `acta_constitutiva_${Date.now()}.${fileExt}`;
    const filePath = `${user.id}/${fileName}`;
    const { error } = await supabase.storage
      .from('documentos_salas')
      .upload(filePath, file, { upsert: true });
    if (error) {
      console.error('Error subiendo acta:', error);
      return null;
    }
    return filePath;
  };

  const handleRegister = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!user?.id) return;
    setSaving(true);

    const form = e.currentTarget;
    const formData = new FormData(form);

    const nuevaSala: Partial<SalaRecord> = {
      nombre_sala: formData.get('nombre_sala') as string,
      ubicacion: formData.get('ubicacion') as string,
      estatus: formData.get('estatus') as string,
      id_comuna: selectedComunaId || undefined,
      id_sector: selectedSectorId || undefined,
      // id_consejo: selectedConsejoId || undefined,
      id_usuario: user.id,
    };

    let actaPath = sala?.acta_constitutiva_url || null;
    let savedId = sala?.id_sala;
    let error = null;

    if (savedId) {
      const { error: updateError } = await supabase
        .from('datos_sala_autogobierno')
        .update(nuevaSala)
        .eq('id_sala', savedId);
      error = updateError;
    } else {
      const { data, error: insertError } = await supabase
        .from('datos_sala_autogobierno')
        .insert([nuevaSala])
        .select()
        .single();
      if (data) savedId = data.id_sala;
      error = insertError;
    }

    if (error || !savedId) {
      console.error('Error guardando sala:', error);
      showAlert('Error', 'No se pudo guardar la información', 'danger');
      setSaving(false);
      return;
    }

    if (actaFile) {
      const uploadedPath = await uploadActa(actaFile, savedId);
      if (uploadedPath) {
        actaPath = uploadedPath;
        await supabase
          .from('datos_sala_autogobierno')
          .update({ acta_constitutiva_url: actaPath })
          .eq('id_sala', savedId);
      }
    }

    const { data: refreshed } = await supabase
      .from('datos_sala_autogobierno')
      .select('*')
      .eq('id_sala', savedId)
      .single();
    if (refreshed) {
      setSala(refreshed);
      setIsRegistered(true);
    }

    setShowModal(false);
    setActaFile(null);
    setSaving(false);
    showAlert('Éxito', 'Datos guardados correctamente', 'success');
  };

  const triggerUpload = (ref: React.RefObject<HTMLInputElement>) => ref.current?.click();
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>, setter: React.Dispatch<React.SetStateAction<File | null>>) => {
    if (e.target.files?.[0]) setter(e.target.files[0]);
  };

  if (loading) return <div className="flex justify-center items-center p-8"><Loader2 className="animate-spin text-brand-primary" size={28} /></div>;

  // Si mostramos ubicación, renderizamos UbicacionG con onBack
  if (showUbicacion) {
    return <UbicacionG onBack={() => setShowUbicacion(false)} />;
  }

  const comunaNombre = comunas.find(c => c.id_comuna === sala?.id_comuna)?.nombre_comuna || '';
  const sectorNombre = sectores.find(s => s.id_sector === sala?.id_sector)?.nombre_sector || '';
  // const consejoNombre = consejos.find(c => c.id_consejo === sala?.id_consejo)?.nombre_consejo || '';

  return (
    <div className="space-y-4">
      {/* CABECERA REDUCIDA */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 bg-white p-4 rounded-xl border border-gray-100 shadow-sm">
        <div>
          <h2 className="text-base font-black text-slate-800 italic uppercase tracking-tighter flex items-center gap-2">
            <Shield className="h-5 w-5 text-brand-primary" /> Datos de identificación – Sala de Autogobierno
          </h2>
          <p className="text-[8px] text-slate-400 font-bold uppercase tracking-[0.15em] mt-0.5">Registro de la sala y acta constitutiva</p>
        </div>
        <div className="flex gap-2">
          <button onClick={() => setShowModal(true)} className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-[9px] font-black italic uppercase tracking-wider transition-all ${isRegistered ? "text-slate-400 border border-gray-100 hover:bg-gray-50" : "bg-brand-primary text-white shadow-md hover:scale-105"}`}>
            {isRegistered ? "Actualizar" : <><PlusCircle className="h-3.5 w-3.5" /> Registrar</>}
          </button>
        </div>
      </div>

      {/* BOTÓN UBICACIÓN GEOGRÁFICA (TIPO ENLACE, A LA DERECHA) */}
      <div className="flex justify-end">
        <button
          onClick={() => setShowUbicacion(true)}
          className="text-brand-primary hover:text-brand-primary/80 text-[9px] font-bold uppercase tracking-wider flex items-center gap-1 transition-colors"
        >
          <MapPin className="h-3 w-3" />
          Ubicación Geográfica
        </button>
      </div>

      {/* VISTA DE DATOS REGISTRADOS (REDUCIDA) */}
      {isRegistered && sala && (
        <>
          <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm">
            <h3 className="text-sm font-black text-slate-800 italic uppercase tracking-tighter flex items-center gap-2 mb-3">
              <Building2 className="h-4 w-4 text-brand-primary" /> Identificación de la Sala
            </h3>
            <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
              <div>
                <p className="text-[8px] font-bold text-slate-400 uppercase tracking-wider mb-0.5">Nombre Oficial</p>
                <p className="text-[11px] font-black text-slate-800 uppercase italic">{sala.nombre_sala}</p>
              </div>
              <div>
                <p className="text-[8px] font-bold text-slate-400 uppercase tracking-wider mb-0.5">Ubicación</p>
                <p className="text-[11px] font-black text-slate-800">{sala.ubicacion || '—'}</p>
              </div>
              <div>
                <p className="text-[8px] font-bold text-slate-400 uppercase tracking-wider mb-0.5">Estatus</p>
                <span className="text-[8px] font-black px-2 py-0.5 bg-brand-primary/10 text-brand-primary rounded-lg uppercase">{sala.estatus}</span>
              </div>
              {sala.id_comuna && (
                <div>
                  <p className="text-[8px] font-bold text-slate-400 uppercase tracking-wider mb-0.5">Comuna</p>
                  <p className="text-[11px] font-black text-slate-800">{comunaNombre}</p>
                </div>
              )}
              {sala.id_sector && (
                <div>
                  <p className="text-[8px] font-bold text-slate-400 uppercase tracking-wider mb-0.5">Sector</p>
                  <p className="text-[11px] font-black text-slate-800">{sectorNombre}</p>
                </div>
              )}

            </div>
          </div>

          {/* Tarjeta de acta constitutiva (reducida) */}
          <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm">
            <div className="flex justify-between items-start">
              <div>
                <h4 className="text-sm font-black text-slate-800 italic">Acta Constitutiva</h4>
                <p className="text-[8px] text-slate-400 font-bold mt-0.5 uppercase">Documento legal fundamental</p>
              </div>
              <span className="text-[8px] font-black px-2 py-0.5 bg-emerald-50 text-emerald-600 rounded-lg uppercase">VALIDADA</span>
            </div>
            <div className="mt-3 pt-2 border-t border-gray-50 flex justify-between items-center">
              <span className="text-[9px] font-bold text-slate-500 uppercase">Archivo PDF</span>
              {sala.acta_constitutiva_url && (
                <button
                  onClick={async () => {
                    const signed = await getSignedUrlForSala(sala.acta_constitutiva_url!);
                    if (signed) window.open(signed, '_blank');
                  }}
                  className="p-1.5 rounded-lg bg-gray-50 text-slate-400 hover:bg-brand-primary/10 hover:text-brand-primary transition-all"
                >
                  <Eye className="h-3 w-3" />
                </button>
              )}
            </div>
          </div>
        </>
      )}

      {/* MODAL DE REGISTRO/EDICIÓN (TAMAÑO ORIGINAL, SIN REDUCIR) */}
      <AnimatePresence>
        {showModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setShowModal(false)} className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative w-full max-w-2xl bg-white rounded-[2.5rem] shadow-2xl overflow-hidden border border-gray-100 max-h-[85vh] overflow-y-auto"
            >
              <div className="p-6 border-b border-gray-50 flex items-center justify-between sticky top-0 bg-white z-10">
                <h4 className="text-lg font-black text-slate-800 italic uppercase tracking-tighter">{sala ? "Editar Datos" : "Registrar Datos"}</h4>
                <button onClick={() => setShowModal(false)} className="p-2 rounded-xl hover:bg-gray-100"><X className="h-4 w-4 text-slate-400" /></button>
              </div>
              <form onSubmit={handleRegister} className="p-6 space-y-6">
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="md:col-span-2 space-y-1">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Nombre Oficial de la Sala de Autogobierno</label>
                    <input name="nombre_sala" defaultValue={sala?.nombre_sala} className="w-full p-3 rounded-2xl bg-gray-50 ring-1 ring-gray-100 text-sm font-bold" placeholder="Ej: Sala de Autogobierno Territorial Eje Sur" required />
                  </div>
                  <div className="md:col-span-2 space-y-1">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Ubicación (Dirección / Referencia)</label>
                    <input name="ubicacion" defaultValue={sala?.ubicacion} className="w-full p-3 rounded-2xl bg-gray-50 ring-1 ring-gray-100 text-sm font-bold" placeholder="Ej: Sector 1, calle principal, casa #12" />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Estatus Actual</label>
                    <select name="estatus" defaultValue={sala?.estatus || "En Proceso de Formación"} className="w-full p-3 rounded-2xl bg-gray-50 ring-1 ring-gray-100 text-sm font-bold">
                      <option value="En Proceso de Formación">En Proceso de Formación</option>
                      <option value="Activa">Activa</option>
                      <option value="Inactiva">Inactiva</option>
                    </select>
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Comuna / Circuito</label>
                    <select
                      value={selectedComunaId || ""}
                      onChange={(e) => {
                        const newComunaId = Number(e.target.value);
                        setSelectedComunaId(newComunaId);
                        setSelectedSectorId(null);
                        setSelectedConsejoId(null);
                      }}
                      className="w-full p-3 rounded-2xl bg-gray-50 ring-1 ring-gray-100 text-sm font-bold"
                      required
                    >
                      <option value="">Seleccione comuna</option>
                      {comunas.map(c => <option key={c.id_comuna} value={c.id_comuna}>{c.nombre_comuna}</option>)}
                    </select>
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Sector Territorial</label>
                    <select
                      value={selectedSectorId || ""}
                      onChange={(e) => setSelectedSectorId(Number(e.target.value))}
                      className="w-full p-3 rounded-2xl bg-gray-50 ring-1 ring-gray-100 text-sm font-bold"
                      required
                      disabled={!selectedComunaId}
                    >
                      <option value="">Seleccione sector</option>
                      {sectores.map(s => <option key={s.id_sector} value={s.id_sector}>{s.nombre_sector}</option>)}
                    </select>
                  </div>
                </div>
                <div className="pt-4 border-t border-gray-50">
                  <FileUploadSection
                    label="Acta Constitutiva"
                    file={actaFile}
                    existingPath={sala?.acta_constitutiva_url}
                    onTrigger={() => triggerUpload(actaInputRef)}
                    onChange={(e: any) => handleFileChange(e, setActaFile)}
                    inputRef={actaInputRef}
                  />
                </div>
                <button type="submit" disabled={saving} className="w-full py-3 bg-brand-primary text-white rounded-2xl uppercase font-black tracking-widest shadow-2xl shadow-brand-primary/15 disabled:opacity-50 transition-all hover:scale-[1.02] flex items-center justify-center gap-2">
                  {saving ? <Loader2 className="animate-spin" size={15} /> : (sala ? "Actualizar Registro" : "Confirmar Registro")}
                </button>
              </form>
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