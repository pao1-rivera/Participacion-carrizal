"use client";

import React, { useState, useEffect, useRef, useMemo } from "react";
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Shield, FileCheck, Activity, Upload, PlusCircle, FileText, Building2,
  X, CheckCircle2, Plus, Loader2, Eye, Calendar, Users, User, Phone, IdCard, RefreshCw, MapPin
} from "lucide-react";
import { supabase } from "@/app/lib/supabaseClient";
import { useAuth } from "@/context/AuthContext";
import { cn } from "@/app/lib/utils";
import { AlertModal } from "@/app/components/AlertModal";
import { UbiComuna } from "./UbiComuna";

// -----------------------------------------------------------------------------
// Utilidades (signed URL, etc.)
// -----------------------------------------------------------------------------
const getSignedUrlFromPublicUrl = async (storedPath: string | null): Promise<string | null> => {
  if (!storedPath) return null;
  let bucketName = 'documentos_comuna';
  let cleanPath = storedPath;
  if (storedPath.includes('http')) {
    if (storedPath.includes('/documentos_consejos/')) bucketName = 'documentos_consejos';
    const searchString = `/storage/v1/object/public/${bucketName}/`;
    const pathStart = storedPath.indexOf(searchString);
    if (pathStart !== -1) cleanPath = storedPath.substring(pathStart + searchString.length);
  }
  cleanPath = cleanPath.startsWith('/') ? cleanPath.substring(1) : cleanPath;
  const { data, error } = await supabase.storage.from(bucketName).createSignedUrl(cleanPath, 3600);
  if (error) { console.error(`Error signed URL: ${error.message}`); return null; }
  return data.signedUrl;
};

// -----------------------------------------------------------------------------
// Componente DocumentCardCompact (versión reducida)
// -----------------------------------------------------------------------------
interface DocumentCardCompactProps {
  title: string;
  desc: string;
  icon: React.ElementType;
  status: string;
  detail: string;
  fileUrl: string | null;
}
const DocumentCardCompact = ({ title, desc, icon: Icon, status, detail, fileUrl }: DocumentCardCompactProps) => {
  const [isLoading, setIsLoading] = useState(false);
  const handleView = async () => {
    if (!fileUrl) return;
    setIsLoading(true);
    const signedUrl = await getSignedUrlFromPublicUrl(fileUrl);
    setIsLoading(false);
    if (signedUrl) window.open(signedUrl, '_blank');
    else alert('No se pudo acceder al documento');
  };
  return (
    <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm flex items-center justify-between group">
      <div className="flex items-center gap-3">
        <div className="h-9 w-9 rounded-lg bg-brand-primary/10 flex items-center justify-center text-brand-primary group-hover:bg-brand-primary group-hover:text-white transition-all">
          <Icon className="h-4 w-4" />
        </div>
        <div>
          <h4 className="text-sm font-black text-slate-800 italic">{title}</h4>
          <p className="text-[8px] text-slate-400 font-bold uppercase">{desc}</p>
          <span className="text-[9px] font-bold text-slate-500 mt-0.5 block">{detail}</span>
        </div>
      </div>
      {fileUrl && (
        <button onClick={handleView} disabled={isLoading} className="p-1.5 rounded-lg bg-gray-50 hover:bg-brand-primary/10 disabled:opacity-50">
          {isLoading ? <Loader2 className="h-3 w-3 animate-spin" /> : <Eye className="h-3 w-3" />}
        </button>
      )}
    </div>
  );
};

// -----------------------------------------------------------------------------
// Componente FileUploadSection (compacto)
// -----------------------------------------------------------------------------
interface FileUploadSectionProps {
  label: string;
  file: File | null;
  existingUrl: string | null;
  onTrigger: () => void;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  inputRef: React.RefObject<HTMLInputElement | null>;
}
const FileUploadSection = ({ label, file, existingUrl, onTrigger, onChange, inputRef }: FileUploadSectionProps) => (
  <div className="space-y-0.5">
    <label className="text-[8px] font-bold text-slate-400 uppercase tracking-wider">{label}</label>
    <input type="file" ref={inputRef} className="hidden" accept=".pdf,.jpg,.jpeg,.png" onChange={onChange} />
    <div className="flex items-center gap-1 p-1.5 bg-gray-50 rounded-lg ring-1 ring-gray-100">
      <button
        type="button"
        onClick={onTrigger}
        className={`text-[7px] font-black uppercase px-2 py-1 rounded-md border transition-all ${file || existingUrl ? "bg-emerald-50 text-emerald-600 border-emerald-100" : "bg-white text-brand-primary border-gray-100"}`}
      >
        {file || existingUrl ? <CheckCircle2 className="inline h-2 w-2 mr-0.5" /> : <Upload className="inline h-2 w-2 mr-0.5" />}
        {file ? "Nuevo" : (existingUrl ? "Existe" : "Subir")}
      </button>
      <span className="text-[7px] font-bold text-slate-400 italic truncate max-w-16">
        {file ? file.name : (existingUrl ? "Actual" : "Ninguno")}
      </span>
    </div>
  </div>
);

// -----------------------------------------------------------------------------
// Tipos para voceros de comuna
// -----------------------------------------------------------------------------
interface VoceroFirmante {
  id_voceroc?: number;
  nombre_completo: string;
  cedula: string;
  telefono: string;
  unidad: string;
  tipo: string;
  comite: string | null;
  profesion: string | null;
  grado_instruccion: string | null;
  rif_fecha_vencimiento: string | null;
  rif_url: string | null;
  cedula_url: string | null;
  id_comuna: number;
}

// -----------------------------------------------------------------------------
// Componente VoceroCardCompact (reducido)
// -----------------------------------------------------------------------------
interface VoceroCardProps {
  vocero: VoceroFirmante;
  onUpdate: (vocero: VoceroFirmante) => void;
}
const VoceroCardCompact = ({ vocero, onUpdate }: VoceroCardProps) => {
  const [isLoadingRif, setIsLoadingRif] = useState(false);
  const [isLoadingCedula, setIsLoadingCedula] = useState(false);
  const handleViewRif = async () => {
    if (!vocero.rif_url) return;
    setIsLoadingRif(true);
    const url = await getSignedUrlFromPublicUrl(vocero.rif_url);
    setIsLoadingRif(false);
    if (url) window.open(url, '_blank');
    else alert('No se pudo acceder al RIF');
  };
  const handleViewCedula = async () => {
    if (!vocero.cedula_url) return;
    setIsLoadingCedula(true);
    const url = await getSignedUrlFromPublicUrl(vocero.cedula_url);
    setIsLoadingCedula(false);
    if (url) window.open(url, '_blank');
    else alert('No se pudo acceder a la cédula');
  };
  return (
    <div className="bg-white p-3 rounded-xl border border-gray-100 shadow-sm group">
      <div className="flex justify-between items-start mb-2">
        <div className="h-8 w-8 rounded-lg bg-brand-primary/10 flex items-center justify-center text-brand-primary group-hover:bg-brand-primary group-hover:text-white transition-all">
          <User className="h-4 w-4" />
        </div>
        <span className="text-[8px] font-black px-1.5 py-0.5 bg-emerald-50 text-emerald-600 rounded-md uppercase">{vocero.tipo}</span>
      </div>
      <h4 className="text-sm font-black text-slate-800 italic leading-tight">{vocero.nombre_completo}</h4>
      <p className="text-[9px] text-slate-400 font-bold uppercase tracking-wider mt-0.5">{vocero.unidad}</p>
      <div className="mt-2 pt-2 border-t border-gray-50 grid grid-cols-2 gap-x-2 gap-y-1">
        <div className="flex items-center gap-1">
          <IdCard className="h-2.5 w-2.5 text-slate-400 shrink-0" />
          <span className="text-[9px] font-bold text-slate-600 truncate">{vocero.cedula}</span>
        </div>
        <div className="flex items-center gap-1">
          <Phone className="h-2.5 w-2.5 text-slate-400 shrink-0" />
          <span className="text-[9px] font-bold text-slate-600 truncate">{vocero.telefono}</span>
        </div>
      </div>
      {vocero.comite && (
        <div className="mt-1 flex items-start gap-1">
          <div className="w-1 h-1 bg-slate-400 rounded-full mt-0.5 shrink-0" />
          <span className="text-[8px] font-bold text-slate-500 leading-tight line-clamp-2">{vocero.comite}</span>
        </div>
      )}
      <div className="mt-2 pt-2 border-t border-gray-50 space-y-1.5">
        <div className="flex gap-1">
          {vocero.rif_url && (
            <button onClick={handleViewRif} disabled={isLoadingRif} className="flex-1 py-1 rounded-md bg-gray-50 hover:bg-brand-primary/10 disabled:opacity-50 text-[8px] text-slate-600 font-bold flex items-center justify-center gap-1">
              {isLoadingRif ? <Loader2 className="h-2 w-2 animate-spin" /> : <><FileCheck className="h-2 w-2" />RIF</>}
            </button>
          )}
          {vocero.cedula_url && (
            <button onClick={handleViewCedula} disabled={isLoadingCedula} className="flex-1 py-1 rounded-md bg-gray-50 hover:bg-brand-primary/10 disabled:opacity-50 text-[8px] text-slate-600 font-bold flex items-center justify-center gap-1">
              {isLoadingCedula ? <Loader2 className="h-2 w-2 animate-spin" /> : <><IdCard className="h-2 w-2" />Cédula</>}
            </button>
          )}
        </div>
        <div className="flex justify-center pt-0.5">
          <button type="button" onClick={() => onUpdate(vocero)} className="text-[8px] font-black uppercase tracking-wider text-brand-primary hover:text-brand-primary/80 hover:underline flex items-center gap-0.5 transition-all">
            <RefreshCw className="h-2 w-2" /> Actualizar
          </button>
        </div>
      </div>
    </div>
  );
};

// -----------------------------------------------------------------------------
// Componente principal OrganizacionSection (con voceros firmantes)
// -----------------------------------------------------------------------------
export const OrganizacionSection = () => {
  const { user } = useAuth();
  const [comunaId, setComunaId] = useState<number | null>(null);
  const [isRegistered, setIsRegistered] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [showVocerosModal, setShowVocerosModal] = useState(false);
  const [showUbicacion, setShowUbicacion] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [savingVocero, setSavingVocero] = useState(false);
  const [editingVoceroId, setEditingVoceroId] = useState<number | null>(null);
  const [comiteSearchTerm, setComiteSearchTerm] = useState('');
  const [showComiteDropdown, setShowComiteDropdown] = useState(false);
  const [comiteDropdownIndex, setComiteDropdownIndex] = useState(-1);
  const [existingCedulaUrl, setExistingCedulaUrl] = useState<string | null>(null);
  
  // AlertModal state
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

  // Ocultar sidebar cuando hay modal abierto
  useEffect(() => {
    if (showModal || showVocerosModal || showUbicacion) {
      document.body.classList.add('modal-open');
    } else {
      document.body.classList.remove('modal-open');
    }
    return () => document.body.classList.remove('modal-open');
  }, [showModal, showVocerosModal, showUbicacion]);

  // Voceros firmantes
  const [vocerosFirmantes, setVocerosFirmantes] = useState<VoceroFirmante[]>([]);

  // Datos del formulario de la comuna
  const [formData, setFormData] = useState({
    nombre_comuna: "",
    rif: "",
    codigo_situr: "",
    cuenta_bancaria: "",
    fecha_vencimiento_voceros: "",
    fecha_vencimiento_rif: "",
  });

  // Sectores
  const [sectores, setSectores] = useState<string[]>([]);
  const [sectorInput, setSectorInput] = useState("");

  // Archivos de la comuna
  const [certificadoFile, setCertificadoFile] = useState<File | null>(null);
  const [rifFile, setRifFile] = useState<File | null>(null);
  const [cartaFile, setCartaFile] = useState<File | null>(null);
  const [existingCertificadoUrl, setExistingCertificadoUrl] = useState<string | null>(null);
  const [existingRifUrl, setExistingRifUrl] = useState<string | null>(null);
  const [existingCartaUrl, setExistingCartaUrl] = useState<string | null>(null);

  const certificadoInputRef = useRef<HTMLInputElement>(null);
  const rifInputRef = useRef<HTMLInputElement>(null);
  const cartaInputRef = useRef<HTMLInputElement>(null);

  // Formulario de vocero
  const [voceroForm, setVoceroForm] = useState({
    nombre: '',
    apellido: '',
    cedulaTipo: 'V',
    cedulaNumero: '',
    telefono: '',
    operadora: '',
    unidad: '',
    tipo: '',
    comite: '',
    profesion: '',
    grado_instruccion: '',
    rif_fecha_vencimiento: '',
  });
  const [voceroRifFile, setVoceroRifFile] = useState<File | null>(null);
  const [voceroCedulaFile, setVoceroCedulaFile] = useState<File | null>(null);
  const voceroRifInputRef = useRef<HTMLInputElement>(null);
  const voceroCedulaInputRef = useRef<HTMLInputElement>(null);

  // Opciones para selects
  const units = [
    "Unidad Ejecutiva",
    "Unidad Administrativa y Financiera",
    "Unidad de Contraloría",
    "Comisión Electoral Permanente",
  ];
  const comites = [
    "Comité de salud", "Comité de tierra urbana", "Comité de vivienda y hábitat",
    "Comité de economía comunal", "Comité de seguridad y defensa integral",
    "Comité de medios alternativos comunitarios", "Comité de recreación y deportes",
    "Comité de alimentación y defensa del consumidor", "Comité de mesa técnica de agua",
    "Comité de mesa técnica de energía y gas", "Comité de protección social de niños, niñas y adolescentes",
    "Comité comunitario de personas con discapacidad", "Comité de educación, cultura y formación ciudadana",
    "Comité de familia e igualdad de género", "Comité de ecosocialismo",
    "Comité de tecnología e innovación", "Comité de mesa técnica de telecomunicaciones",
    "Comité de transporte", "Comité de gestión de riesgos", "Comité de justicia de paz comunal",
    "Comité de planificación comunal y sistema de indicadores de seguimiento",
    "Comité de mujer e igualdad de género", "Comité de juventud recreación y deportes",
    "Comité para el desarrollo integral de las personas adultas mayores",
    "Comité para la protección integral de las familias",
    "Comité para la promoción del parto y nacimiento humanizado, lactancia materna y crianza amorosa",
    "Comité de cultura", "Comité de legislación"
  ];
  const gradosInstruccion = [
    "Sin Instrucción", "Primaria", "Secundaria", "Técnico Medio",
    "Técnico Superior", "Universitario", "Postgrado"
  ];
  const operadoras = [
    { codigo: '0424', nombre: 'Movistar' },
    { codigo: '0414', nombre: 'Digitel' },
    { codigo: '0426', nombre: 'Movilnet' },
    { codigo: '0416', nombre: 'Movistar' },
    { codigo: '0422', nombre: 'Digitel' },
    { codigo: '0412', nombre: 'Movilnet' }
  ];

  const validateCedula = (tipo: string, numero: string): boolean => {
    const numClean = numero.replace(/\D/g, '');
    return (tipo === 'V' || tipo === 'E') && numClean.length >= 7 && numClean.length <= 8;
  };

  const filteredComites = useMemo(() => {
    if (!comiteSearchTerm.trim()) return comites;
    const term = comiteSearchTerm.toLowerCase();
    return comites.filter(c => c.toLowerCase().includes(term));
  }, [comiteSearchTerm]);

  const selectComite = (comite: string) => {
    setVoceroForm(prev => ({ ...prev, comite }));
    setComiteSearchTerm('');
    setShowComiteDropdown(false);
    setComiteDropdownIndex(-1);
  };

  const handleComiteKeyDown = (e: React.KeyboardEvent) => {
    if (!showComiteDropdown) return;
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setComiteDropdownIndex(prev => (prev + 1) % filteredComites.length);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setComiteDropdownIndex(prev => (prev - 1 + filteredComites.length) % filteredComites.length);
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (comiteDropdownIndex >= 0 && filteredComites[comiteDropdownIndex]) {
        selectComite(filteredComites[comiteDropdownIndex]);
      }
    } else if (e.key === 'Escape') {
      setShowComiteDropdown(false);
      setComiteDropdownIndex(-1);
    }
  };

  // ---------------------------------------------------------------------------
  // Carga inicial de la comuna y sus voceros
  // ---------------------------------------------------------------------------
  useEffect(() => {
    const fetchComuna = async () => {
      if (!user?.id) return;
      const { data, error } = await supabase
        .from('datos_comuna')
        .select('*')
        .or(`id_usuario.eq.${user.id},id_usuario_auxiliar.eq.${user.id}`)
        .maybeSingle();
      if (error) {
        console.error('Error cargando comuna:', error);
        setIsRegistered(false);
      } else if (data) {
        setComunaId(data.id_comuna);
        setIsRegistered(true);
        setFormData({
          nombre_comuna: data.nombre_comuna || "",
          rif: data.rif || "",
          codigo_situr: data.codigo_situr || "",
          cuenta_bancaria: data.cuenta_bancaria || "",
          fecha_vencimiento_voceros: data.fecha_vencimiento_voceros || "",
          fecha_vencimiento_rif: data.fecha_vencimiento_rif || "",
        });
        setExistingCertificadoUrl(data.certificado_cuenta_url);
        setExistingRifUrl(data.rif_url);
        setExistingCartaUrl(data.carta_fundacional_url);
        // Cargar sectores
        const { data: sectoresData } = await supabase
          .from('sectores')
          .select('nombre_sector')
          .eq('id_datos_comuna', data.id_comuna)
          .eq('activo', true);
        if (sectoresData) setSectores(sectoresData.map(s => s.nombre_sector));
        // Cargar voceros firmantes
        await fetchVocerosFirmantes(data.id_comuna);
      } else {
        setIsRegistered(false);
      }
      setLoading(false);
    };
    fetchComuna();
  }, [user]);

  const fetchVocerosFirmantes = async (comunaId: number) => {
    const { data, error } = await supabase
      .from('voceros_comuna')
      .select('*')
      .eq('id_comuna', comunaId)
      .order('created_at', { ascending: false });
    if (!error) setVocerosFirmantes(data || []);
    else console.error("Error cargando voceros:", error.message);
  };

  // ---------------------------------------------------------------------------
  // Subida de archivos (comuna y voceros)
  // ---------------------------------------------------------------------------
  const uploadFileComuna = async (file: File, tipo: 'certificado' | 'rif' | 'carta', idComuna: number): Promise<string | null> => {
    if (!user?.id || !idComuna) return null;
    const fileExt = file.name.split('.').pop();
    const prefijoCorto = tipo === 'certificado' ? 'cert' : tipo;
    const fileName = `${prefijoCorto}_${Date.now()}.${fileExt}`;
    const filePath = `${idComuna}/${fileName}`;
    const { error } = await supabase.storage.from('documentos_comuna').upload(filePath, file, { upsert: true });
    if (error) { console.error(`Error subiendo archivo (${tipo}):`, error.message); return null; }
    return filePath;
  };

  const uploadFileVocero = async (file: File, tipo: 'vocero_rif' | 'vocero_cedula', comunaId: number, voceroId: number): Promise<string | null> => {
    if (!user?.id) return null;
    const fileExt = file.name.split('.').pop();
    const fileName = `${tipo}_${Date.now()}.${fileExt}`;
    const filePath = `${comunaId}/voceros/${voceroId}/${fileName}`;
    const { error } = await supabase.storage.from('documentos_comuna').upload(filePath, file, { upsert: true });
    if (error) { console.error(`Error subiendo archivo vocero:`, error.message); return null; }
    return filePath;
  };

  // ---------------------------------------------------------------------------
  // Guardar / actualizar comuna
  // ---------------------------------------------------------------------------
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user?.id) return;
    setSaving(true);
    
    const { data: existing, error: checkError } = await supabase
      .from('datos_comuna')
      .select('id_comuna')
      .eq('id_usuario', user.id)
      .maybeSingle();
      
    if (checkError) {
      console.error('Error verificando existencia:', checkError);
      showAlert('Error', 'Error al verificar existencia de la comuna', 'danger');
      setSaving(false);
      return;
    }
    
    const existingId = existing?.id_comuna;
    if (existingId && !comunaId) setComunaId(existingId);
    
    const dataToSave: any = {
      id_usuario: user.id,
      nombre_comuna: formData.nombre_comuna,
      rif: formData.rif,
      codigo_situr: formData.codigo_situr,
      cuenta_bancaria: formData.cuenta_bancaria,
      fecha_vencimiento_voceros: formData.fecha_vencimiento_voceros || null,
      fecha_vencimiento_rif: formData.fecha_vencimiento_rif || null,
      activo: true,
    };
    
    let comunaIdGuardado = existingId || comunaId;
    let dbError;
    
    if (comunaIdGuardado) {
      const { error } = await supabase.from('datos_comuna').update(dataToSave).eq('id_comuna', comunaIdGuardado);
      dbError = error;
    } else {
      const { data, error } = await supabase.from('datos_comuna').insert([dataToSave]).select('id_comuna').single();
      if (!error && data) {
        comunaIdGuardado = data.id_comuna;
        setComunaId(data.id_comuna);
      }
      dbError = error;
    }
    
    if (dbError) {
      if (dbError.code === '23505') {
        showAlert('Registro duplicado', 'Ya existe un registro para esta comuna. Por favor, recarga la página y actualiza los datos.', 'warning');
      } else {
        showAlert('Error', 'Error al guardar los datos de la comuna: ' + dbError.message, 'danger');
      }
      setSaving(false);
      return;
    }
    
    if (comunaIdGuardado) {
      let certificadoUrl = existingCertificadoUrl, rifUrl = existingRifUrl, cartaUrl = existingCartaUrl;
      let huboCambios = false;
      if (certificadoFile) { const path = await uploadFileComuna(certificadoFile, 'certificado', comunaIdGuardado); if (path) { certificadoUrl = path; setExistingCertificadoUrl(path); huboCambios = true; } }
      if (rifFile) { const path = await uploadFileComuna(rifFile, 'rif', comunaIdGuardado); if (path) { rifUrl = path; setExistingRifUrl(path); huboCambios = true; } }
      if (cartaFile) { const path = await uploadFileComuna(cartaFile, 'carta', comunaIdGuardado); if (path) { cartaUrl = path; setExistingCartaUrl(path); huboCambios = true; } }
      if (huboCambios) {
        await supabase.from('datos_comuna').update({ certificado_cuenta_url: certificadoUrl, rif_url: rifUrl, carta_fundacional_url: cartaUrl }).eq('id_comuna', comunaIdGuardado);
      }
      // Sincronizar sectores
      const { data: existingSectores } = await supabase.from('sectores').select('nombre_sector').eq('id_datos_comuna', comunaIdGuardado).eq('activo', true);
      const existingNames = existingSectores?.map(s => s.nombre_sector) || [];
      const toDelete = existingNames.filter(n => !sectores.includes(n));
      for (const nombre of toDelete) { await supabase.from('sectores').update({ activo: false }).eq('id_datos_comuna', comunaIdGuardado).eq('nombre_sector', nombre); }
      const toAdd = sectores.filter(n => !existingNames.includes(n));
      for (const nombre of toAdd) { await supabase.from('sectores').insert({ nombre_sector: nombre, id_datos_comuna: comunaIdGuardado, activo: true }); }
    }
    
    setIsRegistered(true);
    setShowModal(false);
    setSaving(false);
    showAlert('Éxito', 'Datos guardados correctamente', 'success');
  };

  // ---------------------------------------------------------------------------
  // CRUD de voceros firmantes
  // ---------------------------------------------------------------------------
  const handleVoceroChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    if (name === 'telefono') {
      const onlyNumbers = value.replace(/\D/g, '').slice(0, 7);
      setVoceroForm(prev => ({ ...prev, telefono: onlyNumbers }));
    } else if (name === 'cedula') {
      const raw = value.toUpperCase();
      let newValue = raw;
      if (raw.length > 10) newValue = raw.slice(0, 10);
      setVoceroForm(prev => ({ ...prev, cedula: newValue }));
    } else {
      setVoceroForm(prev => ({ ...prev, [name]: value }));
    }
  };
  const handleOperadoraChange = (codigo: string) => {
    setVoceroForm(prev => ({ ...prev, operadora: codigo }));
  };

  const resetVoceroForm = () => {
    setVoceroForm({
      nombre: '',
      apellido: '',
      cedulaTipo: 'V',
      cedulaNumero: '',
      telefono: '',
      operadora: '',
      unidad: '',
      tipo: '',
      comite: '',
      profesion: '',
      grado_instruccion: '',
      rif_fecha_vencimiento: '',
    });
    setVoceroRifFile(null);
    setVoceroCedulaFile(null);
    setComiteSearchTerm('');
    setShowComiteDropdown(false);
    setComiteDropdownIndex(-1);
    setExistingRifUrl(null);
    setExistingCedulaUrl(null);
    setEditingVoceroId(null);
  };

  const getMissingFields = () => {
    const missing: string[] = [];
    if (!voceroForm.nombre.trim()) missing.push('Nombre');
    if (!voceroForm.apellido.trim()) missing.push('Apellido');
    if (!validateCedula(voceroForm.cedulaTipo, voceroForm.cedulaNumero)) missing.push('Cédula (formato V-12345678)');
    if (!voceroForm.unidad) missing.push('Unidad');
    if (!voceroForm.tipo) missing.push('Tipo');
    if (!voceroForm.telefono || voceroForm.telefono.length !== 7) missing.push('Teléfono (7 dígitos)');
    if (!voceroForm.operadora) missing.push('Código de área telefónica');
    if (editingVoceroId) {
      if (!existingRifUrl && !voceroRifFile) missing.push('RIF digitalizado (debe existir o subir uno nuevo)');
      if (!existingCedulaUrl && !voceroCedulaFile) missing.push('Fotografía de la cédula (debe existir o subir una nueva)');
    } else {
      if (!voceroRifFile) missing.push('Archivo RIF');
      if (!voceroCedulaFile) missing.push('Archivo de la cédula');
    }
    return missing;
  };

  const handleEditVocero = (vocero: VoceroFirmante) => {
    // Descomponer cédula
    let cedulaTipo = 'V';
    let cedulaNumero = '';
    if (vocero.cedula) {
      const match = vocero.cedula.match(/^([VE])-?(\d+)$/i);
      if (match) {
        cedulaTipo = match[1].toUpperCase();
        cedulaNumero = match[2];
      } else {
        cedulaNumero = vocero.cedula.replace(/\D/g, '');
      }
    }

    // Descomponer teléfono
    let telefonoNumero = '';
    let operadoraParseada = '';
    if (vocero.telefono) {
      for (const op of operadoras) {
        if (vocero.telefono.startsWith(op.codigo)) {
          operadoraParseada = op.codigo;
          telefonoNumero = vocero.telefono.substring(op.codigo.length);
          break;
        }
      }
    }

    const nombreCompleto = vocero.nombre_completo || '';
    const nombreParts = nombreCompleto.trim().split(/\s+/);
    const nombre = nombreParts[0] || '';
    const apellido = nombreParts.slice(1).join(' ') || '';
    setExistingRifUrl(vocero.rif_url);
    setExistingCedulaUrl(vocero.cedula_url);

    setVoceroForm({
      nombre,
      apellido,
      cedulaTipo,
      cedulaNumero,
      telefono: telefonoNumero,
      operadora: operadoraParseada,
      unidad: vocero.unidad,
      tipo: vocero.tipo,
      comite: vocero.comite || '',
      profesion: vocero.profesion || '',
      grado_instruccion: vocero.grado_instruccion || '',
      rif_fecha_vencimiento: vocero.rif_fecha_vencimiento || '',
    });

    setEditingVoceroId(vocero.id_voceroc || null);
    setVoceroRifFile(null);
    setVoceroCedulaFile(null);
    setComiteSearchTerm(vocero.comite || '');
    setShowVocerosModal(true);
  };

    const handleSaveVocero = async (e: React.FormEvent) => {
      e.preventDefault();
      const missingFields = getMissingFields();
      if (missingFields.length > 0) {
        const message = `Faltan los siguientes campos obligatorios:\n${missingFields.map(f => `• ${f}`).join('\n')}`;
        showAlert('Campos incompletos', message, 'warning');
        return;
      }
      if (!comunaId) {
        showAlert('Error', 'No se ha identificado la comuna', 'danger');
        return;
      }
      if (!validateCedula(voceroForm.cedulaTipo, voceroForm.cedulaNumero)) {
        showAlert('Cédula inválida', 'Formato correcto: V-12345678 o E-12345678 (hasta 8 dígitos)', 'danger');
        return;
      }
      if (!editingVoceroId && vocerosFirmantes.length >= 3) {
        showAlert('Límite alcanzado', 'Solo se pueden registrar máximo 3 voceros firmantes', 'warning');
        return;
      }
      setSavingVocero(true);
      try {
        const telefonoCompleto = `${voceroForm.operadora}-${voceroForm.telefono}`;
        const nombreCompleto = `${voceroForm.nombre} ${voceroForm.apellido}`.trim();
        const cedulaCompleta = `${voceroForm.cedulaTipo}-${voceroForm.cedulaNumero}`;

        if (editingVoceroId) {
          // Actualización de vocero existente
          const { data, error } = await supabase
            .from('voceros_comuna')
            .update({
              nombre_completo: nombreCompleto,
              cedula: cedulaCompleta,
              telefono: telefonoCompleto,
              unidad: voceroForm.unidad,
              tipo: voceroForm.tipo,
              comite: voceroForm.comite || null,
              profesion: voceroForm.profesion || null,
              grado_instruccion: voceroForm.grado_instruccion || null,
              rif_fecha_vencimiento: voceroForm.rif_fecha_vencimiento || null,
            })
            .eq('id_voceroc', editingVoceroId)
            .select()
            .single();
          if (error) throw error;

          let rifUrl = data.rif_url;
          let cedulaUrl = data.cedula_url;
          if (voceroRifFile) {
            rifUrl = await uploadFileVocero(voceroRifFile, 'vocero_rif', comunaId!, editingVoceroId);
          }
          if (voceroCedulaFile) {
            cedulaUrl = await uploadFileVocero(voceroCedulaFile, 'vocero_cedula', comunaId!, editingVoceroId);
          }
          if (rifUrl || cedulaUrl) {
            await supabase.from('voceros_comuna').update({ rif_url: rifUrl, cedula_url: cedulaUrl }).eq('id_voceroc', editingVoceroId);
          }
          setVocerosFirmantes(prev => prev.map(v => v.id_voceroc === editingVoceroId ? { ...data, rif_url: rifUrl, cedula_url: cedulaUrl } : v));
          setExistingRifUrl(rifUrl);
          setExistingCedulaUrl(cedulaUrl);
          showAlert('Éxito', 'Vocero actualizado correctamente', 'success');
        } else {
          // Nuevo vocero
          const nuevoVocero = {
            nombre_completo: nombreCompleto,
            cedula: cedulaCompleta,
            telefono: telefonoCompleto,
            unidad: voceroForm.unidad,
            tipo: voceroForm.tipo,
            comite: voceroForm.comite || null,
            profesion: voceroForm.profesion || null,
            grado_instruccion: voceroForm.grado_instruccion || null,
            rif_fecha_vencimiento: voceroForm.rif_fecha_vencimiento || null,
            id_comuna: comunaId!,
            rif_url: null,
            cedula_url: null,
          };
          const { data, error } = await supabase.from('voceros_comuna').insert([nuevoVocero]).select().single();
          if (error) throw error;

          let rifUrl = null, cedulaUrl = null;
          if (voceroRifFile) {
            rifUrl = await uploadFileVocero(voceroRifFile, 'vocero_rif', comunaId!, data.id_voceroc);
          }
          if (voceroCedulaFile) {
            cedulaUrl = await uploadFileVocero(voceroCedulaFile, 'vocero_cedula', comunaId!, data.id_voceroc);
          }
          if (rifUrl || cedulaUrl) {
            const { data: updated, error: upError } = await supabase
              .from('voceros_comuna')
              .update({ rif_url: rifUrl, cedula_url: cedulaUrl })
              .eq('id_voceroc', data.id_voceroc)
              .select()
              .single();
            if (upError) throw upError;
            setVocerosFirmantes([updated, ...vocerosFirmantes]);
          } else {
            setVocerosFirmantes([data, ...vocerosFirmantes]);
          }
          showAlert('Éxito', 'Vocero registrado correctamente', 'success');
        }
        resetVoceroForm();
        setEditingVoceroId(null);
        setShowVocerosModal(false);
      } catch (error: any) {
        console.error('Error guardando vocero:', error);
        showAlert('Error', 'Error al guardar el vocero: ' + (error.message || 'Error desconocido'), 'danger');
      } finally {
        setSavingVocero(false);
      }
    };
           

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };
  const addSector = () => {
    if (sectorInput.trim() && !sectores.includes(sectorInput.trim())) {
      setSectores([...sectores, sectorInput.trim()]);
      setSectorInput("");
    }
  };
  const removeSector = (index: number) => {
    setSectores(sectores.filter((_, i) => i !== index));
  };
  const triggerUpload = (ref: React.RefObject<HTMLInputElement | null>) => ref.current?.click();
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>, setter: React.Dispatch<React.SetStateAction<File | null>>) => {
    if (e.target.files?.[0]) setter(e.target.files[0]);
  };
  const formatFecha = (fecha: string | null) => {
    if (!fecha) return "No establecida";
    const [year, month, day] = fecha.split('-');
    return `${day}/${month}/${year}`;
  };
  const getTimeRemaining = (fechaISO: string | null) => {
    if (!fechaISO) return { text: "No establecida", color: "gray", daysLeft: null };
    const hoy = new Date(); hoy.setHours(0,0,0,0);
    const [year, month, day] = fechaISO.split('-').map(Number);
    const fechaVenc = new Date(year, month-1, day); fechaVenc.setHours(0,0,0,0);
    if (fechaVenc < hoy) return { text: "VENCIDO", color: "rose", daysLeft: 0 };
    const diffDays = Math.ceil((fechaVenc.getTime() - hoy.getTime()) / (1000*60*60*24));
    let years = fechaVenc.getFullYear() - hoy.getFullYear();
    let months = fechaVenc.getMonth() - hoy.getMonth();
    let days = fechaVenc.getDate() - hoy.getDate();
    if (days < 0) { months--; days += new Date(fechaVenc.getFullYear(), fechaVenc.getMonth(), 0).getDate(); }
    if (months < 0) { years--; months += 12; }
    let text = "";
    if (years > 0) text += `${years} año${years!==1?'s':''} `;
    if (months > 0) text += `${months} mes${months!==1?'es':''} `;
    if (days > 0) text += `${days} día${days!==1?'s':''}`;
    if (!text) text = "Hoy expira";
    text = `Expira en ${text.trim()}`;
    let color = "emerald";
    if (diffDays <= 180 && diffDays > 0) color = "amber";
    if (diffDays <= 0) color = "rose";
    return { text, color, daysLeft: diffDays };
  };

  if (loading) {
    return <div className="flex justify-center p-12"><Loader2 className="animate-spin text-brand-primary" size={32} /></div>;
  }

  // Si showUbicacion está activo, mostrar el componente de ubicación
  if (showUbicacion) {
    return <UbiComuna onBack={() => setShowUbicacion(false)} />;
  }

  return (
    <div className="space-y-4">
      {/* CABECERA */}
      <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div>
          <h2 className="text-base font-black text-slate-800 italic uppercase tracking-tighter flex items-center gap-2">
            <Shield className="h-5 w-5 text-brand-primary" /> Datos de identificación legal
          </h2>
          <p className="text-[8px] text-slate-400 font-bold uppercase tracking-[0.15em] mt-0.5">
            Gestión de documentación y registros oficiales
          </p>
        </div>
        <div className="flex gap-2">
          {isRegistered && (
            <button
              type="button"
              onClick={() => setShowVocerosModal(true)}
              disabled={vocerosFirmantes.length >= 3}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[9px] font-black italic uppercase tracking-wider transition-all bg-linear-to-r from-brand-primary to-brand-primary/90 text-white shadow-md hover:shadow-lg hover:scale-[1.02] disabled:opacity-50"
            >
              <Users className="h-3.5 w-3.5" />
              Voceros ({vocerosFirmantes.length}/3)
            </button>
          )}
          <button
            onClick={() => setShowModal(true)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[9px] font-black italic uppercase tracking-wider transition-all ${
              isRegistered ? "text-slate-400 border border-gray-100 hover:bg-gray-50" : "bg-brand-primary text-white shadow-md hover:scale-105"
            }`}
          >
            {isRegistered ? <>Actualizar</> : <><PlusCircle className="h-3.5 w-3.5" /> Registrar</>}
          </button>
        </div>
      </div>

      {/* Botón Ubicación Geográfica */}
      <div className="flex justify-end">
        <button
          onClick={() => setShowUbicacion(true)}
          className="text-brand-primary hover:text-brand-primary/80 text-[9px] font-bold uppercase tracking-wider flex items-center gap-1 transition-colors"
        >
          <MapPin className="h-3 w-3" />
          Ubicación Geográfica
        </button>
      </div>

      {isRegistered && comunaId && (
  <>
    {/* Layout de dos columnas: izquierda identificación, derecha documentos */}
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
      {/* Columna izquierda: Identificación Institucional */}
      <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm">
        <h3 className="text-sm font-black text-slate-800 italic uppercase tracking-tighter flex items-center gap-2 mb-3">
          <Building2 className="h-4 w-4 text-brand-primary" /> Identificación Institucional
        </h3>
        <div className="grid gap-3 md:grid-cols-2">
          <div><p className="text-[8px] font-bold text-slate-400 uppercase tracking-wider mb-0.5">Nombre de la Comuna</p><p className="text-xs font-black text-slate-800 uppercase italic">{formData.nombre_comuna || '—'}</p></div>
          <div><p className="text-[8px] font-bold text-slate-400 uppercase tracking-wider mb-0.5">Código SITUR</p><p className="text-xs font-black text-slate-800 uppercase italic">{formData.codigo_situr || '—'}</p></div>
          <div><p className="text-[8px] font-bold text-slate-400 uppercase tracking-wider mb-0.5">RIF</p><p className="text-xs font-black text-slate-800 uppercase italic">{formData.rif || '—'}</p></div>
          <div><p className="text-[8px] font-bold text-slate-400 uppercase tracking-wider mb-0.5">Cuenta Bancaria</p><p className="text-xs font-black text-slate-800 uppercase italic">{formData.cuenta_bancaria ? `**** ${formData.cuenta_bancaria.slice(-4)}` : '—'}</p></div>
        </div>
        <div className="mt-3 pt-3 border-t border-gray-50">
          <div className="grid md:grid-cols-2 gap-3">
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4 text-amber-600" />
              <div className="flex-1">
                <p className="text-[8px] font-bold text-slate-400 uppercase tracking-wider">Vencimiento de vocerías</p>
                <div className="flex items-center justify-between mt-1 flex-wrap gap-2">
                  <p className="text-xs font-black text-slate-800">{formData.fecha_vencimiento_voceros ? formatFecha(formData.fecha_vencimiento_voceros) : "No establecida"}</p>
                  {formData.fecha_vencimiento_voceros && (() => {
                    const { text, color } = getTimeRemaining(formData.fecha_vencimiento_voceros);
                    const colorClasses = { emerald: "bg-emerald-50 text-emerald-700 border-emerald-100", amber: "bg-amber-50 text-amber-700 border-amber-100", rose: "bg-rose-50 text-rose-700 border-rose-100", gray: "bg-gray-50 text-gray-500 border-gray-100" };
                    return <span className={`px-2 py-0.5 rounded-md text-[8px] font-black uppercase border ${colorClasses[color as keyof typeof colorClasses]}`}>{text}</span>;
                  })()}
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4 text-blue-600" />
              <div className="flex-1">
                <p className="text-[8px] font-bold text-slate-400 uppercase tracking-wider">Vencimiento de RIF</p>
                <div className="flex items-center justify-between mt-1 flex-wrap gap-2">
                  <p className="text-xs font-black text-slate-800">{formData.fecha_vencimiento_rif ? formatFecha(formData.fecha_vencimiento_rif) : "No establecida"}</p>
                  {formData.fecha_vencimiento_rif && (() => {
                    const { text, color } = getTimeRemaining(formData.fecha_vencimiento_rif);
                    const colorClasses = { emerald: "bg-emerald-50 text-emerald-700 border-emerald-100", amber: "bg-amber-50 text-amber-700 border-amber-100", rose: "bg-rose-50 text-rose-700 border-rose-100", gray: "bg-gray-50 text-gray-500 border-gray-100" };
                    return <span className={`px-2 py-0.5 rounded-md text-[8px] font-black uppercase border ${colorClasses[color as keyof typeof colorClasses]}`}>{text}</span>;
                  })()}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Columna derecha: Documentos en vertical */}
      <div className="flex flex-col gap-3">
        <DocumentCardCompact title="Certificado Cuenta Bancaria" desc="Constancia bancaria" icon={FileText} status={existingCertificadoUrl ? "CARGADO" : "PENDIENTE"} detail={existingCertificadoUrl ? "Ver documento" : "No subido"} fileUrl={existingCertificadoUrl} />
        <DocumentCardCompact title="RIF Digitalizado" desc="Registro de Información Fiscal" icon={FileCheck} status={existingRifUrl ? "CARGADO" : "PENDIENTE"} detail={existingRifUrl ? "Ver documento" : "No subido"} fileUrl={existingRifUrl} />
        <DocumentCardCompact title="Carta Fundacional" desc="Documento Legal" icon={Activity} status={existingCartaUrl ? "CARGADO" : "PENDIENTE"} detail={existingCartaUrl ? "Ver documento" : "No subido"} fileUrl={existingCartaUrl} />
      </div>
    </div>

    {/* Sección de Sectores Asociados - debajo de las dos columnas */}
    <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm">
      <h3 className="text-sm font-black text-slate-800 italic uppercase tracking-tighter mb-2">Sectores Asociados</h3>
      <div className="flex flex-wrap gap-1.5">
        {sectores.map((s, idx) => <span key={idx} className="px-2 py-1 bg-brand-primary/10 text-brand-primary rounded-lg text-[8px] font-black uppercase italic">{s}</span>)}
        {sectores.length === 0 && <p className="text-slate-400 italic text-[8px]">No hay sectores registrados</p>}
      </div>
    </div>

    {/* Sección de Voceros Firmantes */}
    {vocerosFirmantes.length > 0 && (
      <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm">
        <h3 className="text-sm font-black text-slate-800 italic uppercase tracking-tighter flex items-center gap-2 mb-3">
          <Users className="h-4 w-4 text-brand-primary" /> Voceros Firmantes
        </h3>
        <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
          {vocerosFirmantes.map((vocero) => (
            <VoceroCardCompact key={vocero.id_voceroc} vocero={vocero} onUpdate={handleEditVocero} />
          ))}
        </div>
        {vocerosFirmantes.length < 3 && (
          <p className="text-[9px] text-emerald-600 font-bold mt-3 flex items-center gap-1.5">
            <CheckCircle2 className="h-3 w-3" />
            Puedes registrar {3 - vocerosFirmantes.length} vocero(s) firmante(s) más
          </p>
        )}
      </div>
    )}
  </>
)}

      {/* MODAL PRINCIPAL (Comuna) - TAMAÑO ORIGINAL */}
      <AnimatePresence>
        {showModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-3">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setShowModal(false)} className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" />
            <motion.div initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 20 }} className="relative w-full max-w-2xl max-h-[90vh] bg-white rounded-4xl shadow-2xl overflow-hidden border border-gray-100 flex flex-col">
              <div className="p-4 border-b border-gray-50 flex items-center justify-between shrink-0">
                <h4 className="text-sm font-black text-slate-800 italic uppercase tracking-tighter">{comunaId ? "Actualizar Datos Legales" : "Registrar Datos"}</h4>
                <button onClick={() => setShowModal(false)} className="p-2 rounded-xl hover:bg-gray-100"><X className="h-5 w-5 text-slate-400" /></button>
              </div>
              <div className="flex-1 p-4 space-y-3 overflow-hidden">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div className="space-y-1"><label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Nombre Comuna</label><input name="nombre_comuna" value={formData.nombre_comuna} onChange={handleInputChange} className="w-full p-2.5 rounded-xl bg-gray-50 ring-1 ring-gray-100 focus:ring-brand-primary/20 text-sm font-bold h-11" required /></div>
                  <div className="space-y-1"><label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">RIF</label><div className="flex gap-1.5"><select className="w-20 p-2.5 rounded-xl bg-gray-50 ring-1 ring-gray-100 text-sm font-bold h-11" value={formData.rif?.slice(0,1) || "J"} onChange={(e) => setFormData(prev => ({ ...prev, rif: e.target.value + (prev.rif?.slice(1) || "") }))}><option value="C">C</option><option value="G">G</option></select><input type="text" value={formData.rif?.slice(1) || ""} onChange={(e) => setFormData(prev => ({ ...prev, rif: (prev.rif?.slice(0,1) || "J") + e.target.value }))} maxLength={9} className="flex-1 p-2.5 rounded-xl bg-gray-50 ring-1 ring-gray-100 text-sm font-bold h-11" placeholder="000000000" required /></div></div>
                  <div className="space-y-1"><label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Código SITUR</label><input name="codigo_situr" value={formData.codigo_situr} onChange={handleInputChange} maxLength={20} className="w-full p-2.5 rounded-xl bg-gray-50 ring-1 ring-gray-100 text-sm font-bold h-11" placeholder="00-00-00-000-0000" required /></div>
                  <div className="space-y-1"><label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Cuenta Bancaria</label><input name="cuenta_bancaria" value={formData.cuenta_bancaria} onChange={handleInputChange} className="w-full p-2.5 rounded-xl bg-gray-50 ring-1 ring-gray-100 text-sm font-bold h-11" maxLength={20} required /></div>
                </div>
                <div className="space-y-1.5"><label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Sectores</label><div className="flex gap-1.5"><input type="text" value={sectorInput} onChange={(e) => setSectorInput(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addSector())} className="flex-1 p-2.5 rounded-xl bg-gray-50 ring-1 ring-gray-100 text-sm font-bold h-11" placeholder="Escribe sector + Enter" /><button type="button" onClick={addSector} className="w-11 h-11 bg-brand-primary text-white rounded-xl hover:scale-105 flex items-center justify-center"><Plus className="h-4 w-4" /></button></div><div className="flex flex-wrap gap-1.5 p-1.5 bg-gray-50 rounded-xl min-h-8 max-h-16 overflow-y-auto">{sectores.map((s, idx) => (<span key={idx} className="flex items-center gap-1 px-2 py-0.5 bg-white border border-brand-primary/20 text-brand-primary rounded-lg text-[9px] font-bold">{s}<button type="button" onClick={() => removeSector(idx)} className="hover:text-rose-500 ml-1 p-0.5"><X className="h-2.5 w-2.5" /></button></span>))}</div></div>
                <div className="grid grid-cols-2 gap-3"><div className="space-y-1"><label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1 block">Vencimiento de Vocerías</label><input name="fecha_vencimiento_voceros" type="date" value={formData.fecha_vencimiento_voceros} onChange={handleInputChange} className="w-full p-2.5 rounded-xl bg-gray-50 ring-1 ring-gray-100 text-sm font-bold h-11" /></div><div className="space-y-1"><label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1 block">Vencimiento RIF</label><input name="fecha_vencimiento_rif" type="date" value={formData.fecha_vencimiento_rif} onChange={handleInputChange} className="w-full p-2.5 rounded-xl bg-gray-50 ring-1 ring-gray-100 text-sm font-bold h-11" /></div></div>
                <div><label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1 mb-2 block">Documentos</label><div className="grid grid-cols-3 gap-2">
                  <FileUploadSection label="Certificado" file={certificadoFile} existingUrl={existingCertificadoUrl} onTrigger={() => triggerUpload(certificadoInputRef)} onChange={(e) => handleFileChange(e, setCertificadoFile)} inputRef={certificadoInputRef} />
                  <FileUploadSection label="RIF" file={rifFile} existingUrl={existingRifUrl} onTrigger={() => triggerUpload(rifInputRef)} onChange={(e) => handleFileChange(e, setRifFile)} inputRef={rifInputRef} />
                  <FileUploadSection label="Carta" file={cartaFile} existingUrl={existingCartaUrl} onTrigger={() => triggerUpload(cartaInputRef)} onChange={(e) => handleFileChange(e, setCartaFile)} inputRef={cartaInputRef} />
                </div></div>
                <button type="button" onClick={handleSubmit} disabled={saving} className="w-full py-3 rounded-xl bg-brand-primary text-white text-sm font-black uppercase tracking-wider shadow-lg hover:scale-[1.02] disabled:opacity-70 h-12 flex items-center justify-center">{saving ? <Loader2 className="animate-spin" size={18} /> : (comunaId ? "Actualizar" : "Guardar")}</button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* MODAL VOCEROS FIRMANTES (tamaño original) */}
      <AnimatePresence>
        {showVocerosModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => { setShowVocerosModal(false); setEditingVoceroId(null); resetVoceroForm(); }}
              className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative w-full max-w-2xl bg-white rounded-2xl shadow-2xl overflow-hidden border border-gray-100 max-h-[85vh] overflow-y-auto"
            >
              <div className="p-6 border-b border-gray-50 flex items-center justify-between sticky top-0 bg-white z-10">
                <h4 className="text-lg font-black text-slate-800 italic uppercase tracking-tight">
                  {editingVoceroId ? "Editar Vocero" : `Vocero Firmante ${vocerosFirmantes.length + 1}/3`}
                </h4>
                <button onClick={() => { setShowVocerosModal(false); setEditingVoceroId(null); resetVoceroForm(); }} className="p-1.5 rounded-lg hover:bg-gray-100">
                  <X className="h-4 w-4 text-slate-400" />
                </button>
              </div>

              <form onSubmit={handleSaveVocero} className="p-6 space-y-4">
                {/* Fila 1: Nombre, Apellido, Cédula */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <div>
                    <label className="text-[9px] font-bold text-slate-400 uppercase tracking-widest block mb-1">Nombre</label>
                    <input
                      name="nombre"
                      value={voceroForm.nombre}
                      onChange={handleVoceroChange}
                      className="w-full p-3 rounded-xl bg-gray-50 text-sm disabled:bg-gray-100 disabled:text-slate-500"
                      required
                      disabled={!!editingVoceroId}
                    />
                  </div>
                  <div>
                    <label className="text-[9px] font-bold text-slate-400 uppercase tracking-widest block mb-1">Apellido</label>
                    <input
                      name="apellido"
                      value={voceroForm.apellido}
                      onChange={handleVoceroChange}
                      className="w-full p-3 rounded-xl bg-gray-50 text-sm disabled:bg-gray-100"
                      required
                      disabled={!!editingVoceroId}
                    />
                  </div>
                  <div>
                    <label className="text-[9px] font-bold text-slate-400 uppercase tracking-widest block mb-1">Cédula *</label>
                    <div className="flex gap-2">
                      <select
                        value={voceroForm.cedulaTipo || 'V'}
                        onChange={(e) => setVoceroForm(prev => ({ ...prev, cedulaTipo: e.target.value }))}
                        className="w-16 p-3 rounded-xl bg-gray-50 text-sm"
                        disabled={!!editingVoceroId}
                      >
                        <option value="V">V-</option>
                        <option value="E">E-</option>
                      </select>
                      <input
                        type="text"
                        value={voceroForm.cedulaNumero || ''}
                        onChange={(e) => {
                          const onlyNumbers = e.target.value.replace(/\D/g, '').slice(0, 8);
                          setVoceroForm(prev => ({ ...prev, cedulaNumero: onlyNumbers }));
                        }}
                        placeholder="12345678"
                        className="flex-1 min-w-0 p-3 rounded-xl bg-gray-50 text-sm disabled:bg-gray-100"
                        required
                        disabled={!!editingVoceroId}
                      />
                    </div>
                  </div>
                </div>

                {/* Fila 2: Unidad, Tipo, Teléfono (ahora aislado) */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <div>
                    <label className="text-[9px] font-bold text-slate-400 uppercase tracking-widest block mb-1">Unidad</label>
                    <select
                      name="unidad"
                      value={voceroForm.unidad}
                      onChange={handleVoceroChange}
                      className="w-full p-3 rounded-xl bg-gray-50 text-sm"
                      required
                    >
                      <option value="">Seleccione</option>
                      {units.map(u => <option key={u} value={u}>{u}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="text-[9px] font-bold text-slate-400 uppercase tracking-widest block mb-1">Tipo</label>
                    <select
                      name="tipo"
                      value={voceroForm.tipo}
                      onChange={handleVoceroChange}
                      className="w-full p-3 rounded-xl bg-gray-50 text-sm"
                      required
                    >
                      <option value="">Seleccione</option>
                      <option value="Principal">Principal</option>
                      <option value="Suplente">Suplente</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-[9px] font-bold text-slate-400 uppercase tracking-widest block mb-1">Teléfono</label>
                    <div className="flex gap-1.5">
                      <select
                        value={voceroForm.operadora}
                        onChange={(e) => handleOperadoraChange(e.target.value)}
                        className="w-20 p-3 rounded-xl bg-gray-50 text-sm"
                      >
                        <option value="">Cód</option>
                        {operadoras.map(op => <option key={op.codigo} value={op.codigo}>{op.codigo}</option>)}
                      </select>
                      <input
                        name="telefono"
                        value={voceroForm.telefono}
                        onChange={(e) => {
                          const onlyNumbers = e.target.value.replace(/\D/g, '').slice(0, 7);
                          setVoceroForm(prev => ({ ...prev, telefono: onlyNumbers }));
                        }}
                        placeholder="1234567"
                        className="flex-1 min-w-0 p-3 rounded-xl bg-gray-50 text-sm"
                      />
                    </div>
                  </div>
                </div>

                {/* Comité (con búsqueda) */}
                <div>
                  <label className={`text-[9px] font-bold uppercase tracking-widest block mb-1 ${voceroForm.unidad === "Unidad Ejecutiva" ? "text-slate-400" : "text-slate-300"}`}>
                    Comité
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      value={comiteSearchTerm || voceroForm.comite || ''}
                      onChange={(e) => {
                        setComiteSearchTerm(e.target.value);
                        setShowComiteDropdown(true);
                        if (e.target.value === '') {
                          setVoceroForm(prev => ({ ...prev, comite: '' }));
                        }
                      }}
                      onFocus={() => {
                        setShowComiteDropdown(true);
                        setComiteSearchTerm(voceroForm.comite || '');
                      }}
                      onBlur={() => setTimeout(() => setShowComiteDropdown(false), 200)}
                      onKeyDown={handleComiteKeyDown}
                      disabled={voceroForm.unidad !== "Unidad Ejecutiva"}
                      placeholder={voceroForm.unidad === "Unidad Ejecutiva" ? "Buscar o seleccionar comité..." : "No aplica"}
                      className="w-full p-3 rounded-xl bg-gray-50 text-sm disabled:bg-gray-100 disabled:text-slate-400 transition-all focus:ring-2 focus:ring-brand-primary/20 outline-none"
                    />
                    {showComiteDropdown && filteredComites.length > 0 && voceroForm.unidad === "Unidad Ejecutiva" && (
                      <div className="absolute z-10 mt-1 w-full max-h-48 overflow-y-auto bg-white border border-gray-200 rounded-xl shadow-lg">
                        {filteredComites.map((comite, idx) => (
                          <div
                            key={comite}
                            className={`px-4 py-2 text-xs font-medium cursor-pointer hover:bg-brand-primary/10 ${idx === comiteDropdownIndex ? 'bg-brand-primary/20' : ''}`}
                            onClick={() => selectComite(comite)}
                            onMouseEnter={() => setComiteDropdownIndex(idx)}
                          >
                            {comite}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                  {voceroForm.unidad === "Unidad Ejecutiva" && !voceroForm.comite && comiteSearchTerm && filteredComites.length === 0 && (
                    <p className="text-[8px] text-amber-600 mt-1">No se encontraron comités. Escribe el nombre exacto.</p>
                  )}
                </div>

                {/* Profesión, Grado, Rif Vencimiento */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <div>
                    <label className="text-[9px] font-bold text-slate-400 uppercase tracking-widest block mb-1">Profesión</label>
                    <input
                      name="profesion"
                      value={voceroForm.profesion}
                      onChange={handleVoceroChange}
                      className="w-full p-3 rounded-xl bg-gray-50 text-sm"
                    />
                  </div>
                  <div>
                    <label className="text-[9px] font-bold text-slate-400 uppercase tracking-widest block mb-1">Grado Instrucción</label>
                    <select
                      name="grado_instruccion"
                      value={voceroForm.grado_instruccion}
                      onChange={handleVoceroChange}
                      className="w-full p-3 rounded-xl bg-gray-50 text-sm"
                    >
                      <option value="">Seleccione</option>
                      {gradosInstruccion.map(g => <option key={g} value={g}>{g}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="text-[9px] font-bold text-slate-400 uppercase tracking-widest block mb-1">Rif Vencimiento</label>
                    <input
                      type="date"
                      name="rif_fecha_vencimiento"
                      value={voceroForm.rif_fecha_vencimiento}
                      onChange={handleVoceroChange}
                      className="w-full p-3 rounded-xl bg-gray-50 text-sm"
                    />
                  </div>
                </div>

                {/* Documentos */}
                <div className="grid md:grid-cols-2 gap-3">
                  <FileUploadSection
                    label="RIF Digitalizado"
                    file={voceroRifFile}
                    existingUrl={existingRifUrl}
                    onTrigger={() => triggerUpload(voceroRifInputRef)}
                    onChange={(e) => handleFileChange(e, setVoceroRifFile)}
                    inputRef={voceroRifInputRef}
                  />
                  <FileUploadSection
                    label="Fotografía Cédula"
                    file={voceroCedulaFile}
                    existingUrl={existingCedulaUrl}
                    onTrigger={() => triggerUpload(voceroCedulaInputRef)}
                    onChange={(e) => handleFileChange(e, setVoceroCedulaFile)}
                    inputRef={voceroCedulaInputRef}
                  />
                </div>

                <button
                  type="submit"
                  disabled={savingVocero}
                  className="w-full py-3 px-6 bg-brand-primary text-white rounded-xl uppercase font-black text-sm disabled:opacity-70 hover:scale-[1.02] transition-all"
                >
                  {savingVocero ? <Loader2 className="animate-spin mx-auto" size={16} /> : (editingVoceroId ? "Actualizar Vocero" : "Guardar Vocero")}
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