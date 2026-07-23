import React, { useState, useEffect, useMemo, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import {
  Shield, FileCheck, Activity, Upload, PlusCircle, MapPin,
  FileText, Building2, X, CheckCircle2, Loader2, Eye,
  Calendar, Users, User, Phone, IdCard, AlertCircle, RefreshCw,
  ShieldCheck
} from "lucide-react";
import { supabase } from "@/app/lib/supabaseClient";
import { useAuth } from "@/context/AuthContext";
import { cn } from "@/app/lib/utils";
import { AlertModal } from "@/app/components/AlertModal";
import { UbicacionComunalView } from './UbicacionComunalView';

const getSignedUrlFromPublicUrl = async (storedPath: string | null): Promise<string | null> => {
  if (!storedPath) return null;

  const bucketName = 'documentos_consejos';

  let cleanPath = storedPath;
  if (storedPath.includes('http')) {
    const bucketFragment = `/${bucketName}/`;
    const pathStart = storedPath.indexOf(bucketFragment);
    if (pathStart !== -1) {
      cleanPath = storedPath.substring(pathStart + bucketFragment.length);
    }
  }

  const { data, error } = await supabase.storage
    .from(bucketName)
    .createSignedUrl(cleanPath, 3600); 

  if (error) {
    console.error("Error generando Signed URL:", error.message);
    return null;
  }

  return data.signedUrl;
};

// Componente de subida de archivos (ya reducido)
interface FileUploadSectionProps {
  label: string;
  file: File | null;
  existingUrl: string | null;
  onTrigger: () => void;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  inputRef: React.RefObject<HTMLInputElement | null>;
}

const FileUploadSection = ({ 
  label, file, existingUrl, onTrigger, onChange, inputRef 
}: FileUploadSectionProps) => (
  <div className="space-y-0.5">
    <label className="text-[8px] font-bold text-slate-400 uppercase tracking-wider max-sm:text-[7px]">{label}</label>
    <input type="file" ref={inputRef} className="hidden" accept=".pdf,.jpg,.jpeg,.png" onChange={onChange} />
    <div className="flex items-center gap-1 p-2 bg-gray-50 rounded-lg ring-1 ring-gray-100 max-sm:p-1.5">
      <button
        type="button"
        onClick={onTrigger}
        className={`text-[7px] font-black uppercase px-2 py-1 rounded-md border transition-all max-sm:text-[6px] max-sm:px-1.5 ${file || existingUrl ? "bg-emerald-50 text-emerald-600 border-emerald-100" : "bg-white text-brand-primary border-gray-100"}`}
      >
        {file || existingUrl ? <CheckCircle2 className="inline h-2 w-2 mr-0.5 max-sm:h-1.5 max-sm:w-1.5" /> : <Upload className="inline h-2 w-2 mr-0.5 max-sm:h-1.5 max-sm:w-1.5" />}
        {file ? "Nuevo" : (existingUrl ? "Existe" : "Subir")}
      </button>
      <span className="text-[7px] font-bold text-slate-400 italic truncate max-w-16 max-sm:text-[6px] max-sm:max-w-12">
        {file ? file.name : (existingUrl ? "Actual" : "Ninguno")}
      </span>
    </div>
  </div>
);

// Interfaces (sin cambios)
interface DatosComuna {
  id_comuna: number;
  nombre_comuna: string;
}

interface Sector {
  id_sector: number;
  nombre_sector: string;
}

interface ConsejoRecord {
  id_consejo?: number;
  nombre_consejo: string;
  rif: string;
  codigo_situr: string;
  id_sector?: number;
  cuenta_bancaria: string;
  rif_url: string | null;
  certificado_cuenta_url: string | null;
  acta_constitutiva_url: string | null;
  fecha_vencimiento_voceros: string | null;
  fecha_vencimiento_rif: string | null;
  id_usuario: string;
  created_at?: string;
  estatus_validacion?: string;
  motivo_rechazo?: string | null;
}

interface VoceroFirmante {
  id_vocero?: number;
  nombre: string;
  apellido: string;
  nombre_completo: string;
  cedula: string;
  telefono: string;
  operadora: string;
  unidad: string;
  tipo: string;
  comite: string | null;
  profesion: string | null;
  grado_instruccion: string | null;
  rif_fecha_vencimiento: string | null;
  rif_url: string | null;
  cedula_url: string | null;
  id_consejo: number;
}

// Función para calcular tiempo restante hasta una fecha
const getTimeRemaining = (fechaISO: string | null) => {
  if (!fechaISO) return { text: "No establecida", color: "gray", daysLeft: null };
  
  const hoy = new Date();
  hoy.setHours(0, 0, 0, 0);
  const [year, month, day] = fechaISO.split('-').map(Number);
  const fechaVenc = new Date(year, month - 1, day);
  fechaVenc.setHours(0, 0, 0, 0);
  
  if (fechaVenc < hoy) return { text: "VENCIDO", color: "rose", daysLeft: 0 };
  
  const diffDays = Math.ceil((fechaVenc.getTime() - hoy.getTime()) / (1000 * 60 * 60 * 24));
  
  let years = fechaVenc.getFullYear() - hoy.getFullYear();
  let months = fechaVenc.getMonth() - hoy.getMonth();
  let days = fechaVenc.getDate() - hoy.getDate();
  
  if (days < 0) {
    months--;
    days += new Date(fechaVenc.getFullYear(), fechaVenc.getMonth(), 0).getDate();
  }
  if (months < 0) {
    years--;
    months += 12;
  }
  
  let text = "";
  if (years > 0) text += `${years}a `;
  if (months > 0) text += `${months}m `;
  if (days > 0) text += `${days}d`;
  if (!text) text = "Hoy";
  text = `En ${text.trim()}`;
  
  let color = "emerald";
  if (diffDays <= 180 && diffDays > 0) color = "amber";
  if (diffDays <= 0) color = "rose";
  
  return { text, color, daysLeft: diffDays };
};

export const DatosLegalesView = () => {
  const { user } = useAuth();
  const [consejo, setConsejo] = useState<ConsejoRecord | null>(null);
  const [isRegistered, setIsRegistered] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [showVocerosModal, setShowVocerosModal] = useState(false);
  const [vocerosFirmantes, setVocerosFirmantes] = useState<VoceroFirmante[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [savingVocero, setSavingVocero] = useState(false);
  const [editingVoceroId, setEditingVoceroId] = useState<number | null>(null);
  const [showUbicacion, setShowUbicacion] = useState(false);

  // Estados para AlertModal
  const [alertConfig, setAlertConfig] = useState({
    isOpen: false,
    title: '',
    message: '',
    type: 'success' as 'info' | 'success' | 'warning' | 'danger',
    showInput: false,
    inputPlaceholder: '',
    cancelText: 'Cancelar',
    confirmText: 'Aceptar',
    onConfirm: undefined as ((inputValue?: string) => void) | undefined,
  });

  const closeAlert = () => {
    setAlertConfig(prev => ({ ...prev, isOpen: false }));
  };

  const showAlert = (title: string, message: string, type: 'info' | 'success' | 'warning' | 'danger' = 'success') => {
    setAlertConfig({
      isOpen: true,
      title,
      message,
      type,
      showInput: false,
      inputPlaceholder: '',
      cancelText: 'Cancelar',
      confirmText: 'Aceptar',
      onConfirm: closeAlert,
    });
  };

  const [comunas, setComunas] = useState<DatosComuna[]>([]);
  const [sectores, setSectores] = useState<Sector[]>([]);
  const [selectedComunaId, setSelectedComunaId] = useState<number | null>(null);
  const [selectedSectorId, setSelectedSectorId] = useState<number | null>(null);

  // Estados controlados para el formulario de consejo
  const [formNombre, setFormNombre] = useState("");
  const [formCodigoSitur, setFormCodigoSitur] = useState("");
  const [formRifLetra, setFormRifLetra] = useState("C");
  const [formRifNumero, setFormRifNumero] = useState("");
  const [formCuentaBancaria, setFormCuentaBancaria] = useState("");
  const [fechaVencimientoVoceros, setFechaVencimientoVoceros] = useState<string>("");
  const [fechaVencimientoRif, setFechaVencimientoRif] = useState<string>("");

  const [rifFile, setRifFile] = useState<File | null>(null);
  const [certificadoFile, setCertificadoFile] = useState<File | null>(null);
  const [actaFile, setActaFile] = useState<File | null>(null);

  const rifInputRef = useRef<HTMLInputElement>(null);
  const certificadoInputRef = useRef<HTMLInputElement>(null);
  const actaInputRef = useRef<HTMLInputElement>(null);

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

  const units = [
    "Unidad Ejecutiva",
    "Unidad Administrativa y Financiera",
    "Unidad de Contraloría",
    "Comisión Electoral Permanente",
  ];

  const comites = [
    "Comité de salud",
    "Comité de tierra urbana",
    "Comité de vivienda y hábitat",
    "Comité de economía comunal",
    "Comité de seguridad y defensa integral",
    "Comité de medios alternativos comunitarios",
    "Comité de recreación y deportes",
    "Comité de alimentación y defensa del consumidor",
    "Comité de mesa técnica de agua",
    "Comité de mesa técnica de energía y gas",
    "Comité de protección social de niños, niñas y adolescentes",
    "Comité comunitario de personas con discapacidad",
    "Comité de educación, cultura y formación ciudadana",
    "Comité de familia e igualdad de género",
    "Comité de ecosocialismo",
    "Comité de tecnología e innovación",
    "Comité de mesa técnica de telecomunicaciones",
    "Comité de transporte",
    "Comité de gestión de riesgos",
    "Comité de justicia de paz comunal",
    "Comité de planificación comunal y sistema de indicadores de seguimiento",
    "Comité de mujer e igualdad de género",
    "Comité de juventud, recreación y deportes",
    "Comité para el desarrollo integral de las personas adultas mayores",
    "Comité para la protección integral de las familias",
    "Comité para la promoción del parto y nacimiento humanizado, lactancia materna y crianza amorosa",
    "Comité de cultura"
  ];

  const [comiteSearchTerm, setComiteSearchTerm] = useState('');
  const [showComiteDropdown, setShowComiteDropdown] = useState(false);
  const [comiteDropdownIndex, setComiteDropdownIndex] = useState(-1);

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

  const fetchComunas = async () => {
    const { data, error } = await supabase
      .from('datos_comuna')
      .select('id_comuna, nombre_comuna')
      .eq('activo', true);

    if (error) {
      console.error("ERROR EN LECTURA DE COMUNAS:", error);
      return;
    }

    if (data) {
      setComunas(data);
    }
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

  useEffect(() => {
    fetchComunas();
  }, [showModal]);

  useEffect(() => {
    if (!selectedComunaId) {
      setSectores([]);
      return;
    }
    const fetchSectores = async () => {
      const { data, error } = await supabase
        .from('sectores')
        .select('id_sector, nombre_sector')
        .eq('id_datos_comuna', selectedComunaId)
        .eq('activo', true);
      if (!error) setSectores(data || []);
    };
    fetchSectores();
  }, [selectedComunaId]);

  useEffect(() => {
    if (showModal || showVocerosModal) {
      document.body.classList.add('modal-open');
    } else {
      document.body.classList.remove('modal-open');
    }
    return () => document.body.classList.remove('modal-open');
  }, [showModal, showVocerosModal]);

  // Cargar datos del consejo al montar
  useEffect(() => {
    if (!user?.id) {
      setLoading(false);
      return;
    }
    const fetchConsejo = async () => {
      setLoading(true);
      const { data, error } = await supabase
        .from('datos_consejo_comunal')
        .select('*')
        .or(`id_usuario.eq.${user.id},id_usuario_auxiliar.eq.${user.id}`)
        .maybeSingle();
      if (!error && data) {
        setConsejo(data);
        setIsRegistered(true);
        if (data.id_sector) {
          setSelectedSectorId(data.id_sector);
          const { data: sectorData } = await supabase
            .from('sectores')
            .select('id_datos_comuna')
            .eq('id_sector', data.id_sector)
            .single();
          if (sectorData) setSelectedComunaId(sectorData.id_datos_comuna);
        }
        if (data.fecha_vencimiento_voceros) {
          setFechaVencimientoVoceros(data.fecha_vencimiento_voceros);
        }
        if (data.fecha_vencimiento_rif) {
          setFechaVencimientoRif(data.fecha_vencimiento_rif);
        }
        await fetchVocerosFirmantes(data.id_consejo);
      } else {
        setIsRegistered(false);
      }
      setLoading(false);
    };
    fetchConsejo();
  }, [user]);

  // Cargar voceros
  const fetchVocerosFirmantes = async (consejoId: number) => {
    const { data, error } = await supabase
      .from('voceros')
      .select('*')
      .eq('id_consejo', consejoId)
      .eq('es_firmante', true)
      .order('created_at', { ascending: false });

    if (!error) {
      setVocerosFirmantes(data || []);
    } else {
      console.error("Error al cargar firmantes:", error.message);
    }
  };

  // Subir archivos
  const uploadFile = async (
    file: File,
    tipo: 'rif' | 'certificado' | 'acta' | 'vocero_rif' | 'vocero_cedula',
    consejoId: number,
    voceroId?: number | string
  ): Promise<string | null> => {
    if (!user?.id) return null;

    const fileExt = file.name.split('.').pop();
    const fileName = `${tipo}_${Date.now()}.${fileExt}`;
    let filePath = '';

    if (tipo === 'vocero_rif' || tipo === 'vocero_cedula' || voceroId) {
      filePath = `${consejoId}/voceros/${voceroId}/${fileName}`;
    } else {
      filePath = `${consejoId}/${fileName}`;
    }

    const { error } = await supabase.storage
      .from('documentos_consejos')
      .upload(filePath, file, { upsert: true });

    if (error) {
      console.error("Error real en Supabase Storage:", error.message);
      return null;
    }

    return filePath;
  };

  // Registrar/Actualizar consejo
  const handleRegister = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!user?.id || !selectedSectorId) return;

    setSaving(true);

    try {
      const rifCompleto = `${formRifLetra}-${formRifNumero}`;
      const hasNewFiles = !!(rifFile || certificadoFile || actaFile);
      const isEditing = !!consejo?.id_consejo;

      const payload: any = {
        nombre_consejo: formNombre,
        rif: rifCompleto,
        codigo_situr: formCodigoSitur,
        id_sector: selectedSectorId,
        cuenta_bancaria: formCuentaBancaria,
        fecha_vencimiento_voceros: fechaVencimientoVoceros || null,
        fecha_vencimiento_rif: fechaVencimientoRif || null,
        id_usuario: user.id,
      };

      if (hasNewFiles) {
        payload.estatus_validacion = 'PENDIENTE';
        payload.motivo_rechazo = null;
      }

      const { data: savedRecord, error: dbError } = await supabase
        .from('datos_consejo_comunal')
        .upsert({
          ...(consejo?.id_consejo ? { id_consejo: consejo.id_consejo } : {}),
          ...payload
        })
        .select()
        .single();

      if (dbError) throw dbError;

      const currentId = savedRecord.id_consejo;

      if (hasNewFiles) {
        const uploadPromises = [];
        if (rifFile) uploadPromises.push(uploadFile(rifFile, 'rif', currentId, user.id).then(url => ({ rif_url: url })));
        if (certificadoFile) uploadPromises.push(uploadFile(certificadoFile, 'certificado', currentId, user.id).then(url => ({ certificado_cuenta_url: url })));
        if (actaFile) uploadPromises.push(uploadFile(actaFile, 'acta', currentId, user.id).then(url => ({ acta_constitutiva_url: url })));

        const results = await Promise.all(uploadPromises);
        const fileUrls = Object.assign({}, ...results);

        if (Object.keys(fileUrls).length > 0) {
          const { data: finalRecord, error: updateError } = await supabase
            .from('datos_consejo_comunal')
            .update(fileUrls)
            .eq('id_consejo', currentId)
            .select()
            .single();

          if (updateError) throw updateError;
          setConsejo(finalRecord);
          window.dispatchEvent(new CustomEvent('refreshNotifications'));
        } else {
          setConsejo(savedRecord);
        }
      } else {
        setConsejo(savedRecord);
      }

      setIsRegistered(true);
      setShowModal(false);
      setRifFile(null);
      setCertificadoFile(null);
      setActaFile(null);

      showAlert(
        isEditing ? "¡Actualización Exitosa!" : "¡Registro Exitoso!",
        isEditing 
          ? "Los datos del consejo comunal han sido actualizados correctamente."
          : "Los datos del consejo comunal han sido registrados correctamente.",
        "success"
      );

    } catch (err: any) {
      console.error("Error en el registro:", err);
      const isPolicyError = err.message?.includes("estatus") || err.code === "P0001";
      showAlert(
        "Error",
        isPolicyError
          ? "Se detectó un cambio de estatus no permitido por las políticas de seguridad."
          : "Error al guardar los datos.",
        "danger"
      );
    } finally {
      setSaving(false);
    }
  };

  // Manejo de voceros
  const handleVoceroChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setVoceroForm(prev => ({ ...prev, [name]: value }));
  };

  const handleOperadoraChange = (codigo: string) => {
    setVoceroForm(prev => ({
      ...prev,
      operadora: codigo,
    }));
  };

  const handleSaveVocero = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user?.id || !consejo?.id_consejo) return;

    if (!editingVoceroId && vocerosFirmantes.length >= 3) {
      showAlert(
        "Límite Alcanzado",
        "Solo se pueden registrar máximo 3 voceros firmantes.",
        "warning"
      );
      return;
    }

    if (!validateCedula(voceroForm.cedulaTipo, voceroForm.cedulaNumero)) {
      showAlert(
        "Cédula Inválida",
        "La cédula debe tener el formato V-XXXXXXXX o E-XXXXXXXX (7-8 dígitos).",
        "danger"
      );
      return;
    }

    setSavingVocero(true);

    try {
      const currentConsejoId = consejo.id_consejo;
      const telefonoCompleto = `${voceroForm.operadora}-${voceroForm.telefono}`;
      const cedulaCompleta = `${voceroForm.cedulaTipo || 'V'}-${voceroForm.cedulaNumero}`;

      const payload: any = {
        cedula: cedulaCompleta,
        telefono: telefonoCompleto,
        unidad: voceroForm.unidad,
        tipo: voceroForm.tipo,
        comite: voceroForm.comite || null,
        profesion: voceroForm.profesion || null,
        grado_instruccion: voceroForm.grado_instruccion || null,
        rif_fecha_vencimiento: voceroForm.rif_fecha_vencimiento || null,
        rif_ultima_actualizacion: new Date().toISOString(),
      };

      if (editingVoceroId) {
        const { data, error } = await supabase
          .from('voceros')
          .update(payload)
          .eq('id_vocero', editingVoceroId)
          .select()
          .single();

        if (error) throw error;

        let rifUrl = data.rif_url;
        let cedulaUrl = data.cedula_url;

        if (voceroRifFile) {
          rifUrl = await uploadFile(voceroRifFile, 'vocero_rif', currentConsejoId, editingVoceroId);
        }
        if (voceroCedulaFile) {
          cedulaUrl = await uploadFile(voceroCedulaFile, 'vocero_cedula', currentConsejoId, editingVoceroId);
        }

        if (rifUrl || cedulaUrl) {
          await supabase
            .from('voceros')
            .update({ rif_url: rifUrl, cedula_url: cedulaUrl })
            .eq('id_vocero', editingVoceroId);
        }

        setVocerosFirmantes(prev => prev.map(v => v.id_vocero === editingVoceroId ? { ...data, rif_url: rifUrl, cedula_url: cedulaUrl } : v));
        window.dispatchEvent(new CustomEvent('refreshNotifications'));

        showAlert(
          "¡Vocero Actualizado!",
          `El vocero ${voceroForm.nombre} ${voceroForm.apellido} ha sido actualizado correctamente.`,
          "success"
        );
      } else {
        const nombreCompleto = `${voceroForm.nombre} ${voceroForm.apellido}`.trim();

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
          rif_ultima_actualizacion: new Date().toISOString(),
          id_consejo: currentConsejoId,
          es_firmante: true,
          rif_url: null,
          cedula_url: null,
        };

        const { data, error } = await supabase
          .from('voceros')
          .insert([nuevoVocero])
          .select()
          .single();

        if (error) throw error;

        let rifUrl = null;
        let cedulaUrl = null;

        if (voceroRifFile) {
          rifUrl = await uploadFile(voceroRifFile, 'vocero_rif', currentConsejoId, data.id_vocero);
        }
        if (voceroCedulaFile) {
          cedulaUrl = await uploadFile(voceroCedulaFile, 'vocero_cedula', currentConsejoId, data.id_vocero);
        }

        if (rifUrl || cedulaUrl) {
          const { data: updatedData, error: updateError } = await supabase
            .from('voceros')
            .update({ rif_url: rifUrl, cedula_url: cedulaUrl })
            .eq('id_vocero', data.id_vocero)
            .select()
            .single();

          if (updateError) throw updateError;
          setVocerosFirmantes([updatedData, ...vocerosFirmantes]);
          window.dispatchEvent(new CustomEvent('refreshNotifications'));
        } else {
          setVocerosFirmantes([data, ...vocerosFirmantes]);
        }

        showAlert(
          "¡Vocero Registrado!",
          `El vocero ${voceroForm.nombre} ${voceroForm.apellido} ha sido registrado correctamente.`,
          "success"
        );
      }

      resetVoceroForm();
      setEditingVoceroId(null);
      setShowVocerosModal(false);

    } catch (error: any) {
      console.error('Error al guardar el vocero:', error);
      showAlert(
        "Error",
        "Error al guardar el vocero: " + (error.message || "Error desconocido"),
        "danger"
      );
    } finally {
      setSavingVocero(false);
    }
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
  };

  const handleEditVocero = (vocero: VoceroFirmante) => {
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

    setVoceroForm({
      nombre: vocero.nombre || vocero.nombre_completo?.split(' ')[0] || '',
      apellido: vocero.apellido || vocero.nombre_completo?.split(' ').slice(1).join(' ') || '',
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

    setEditingVoceroId(vocero.id_vocero || null);
    setVoceroRifFile(null);
    setVoceroCedulaFile(null);
    setComiteSearchTerm(vocero.comite || '');
    setShowVocerosModal(true);
  };

  const triggerUpload = (ref: React.RefObject<HTMLInputElement | null>) => ref.current?.click();
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>, setter: React.Dispatch<React.SetStateAction<File | null>>) => {
    if (e.target.files?.[0]) setter(e.target.files[0]);
  };

  const handleVoceroRifChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files?.[0]) setVoceroRifFile(e.target.files[0]);
  };

  const handleVoceroCedulaChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files?.[0]) setVoceroCedulaFile(e.target.files[0]);
  };

  // Resetear formulario de consejo al abrir modal
  useEffect(() => {
    if (showModal) {
      if (consejo) {
        setFormNombre(consejo.nombre_consejo || "");
        setFormCodigoSitur(consejo.codigo_situr || "");
        const rifParts = consejo.rif ? consejo.rif.split('-') : ['', ''];
        setFormRifLetra(rifParts[0] || "C");
        setFormRifNumero(rifParts[1] || "");
        setFormCuentaBancaria(consejo.cuenta_bancaria || "");
        setFechaVencimientoVoceros(consejo.fecha_vencimiento_voceros || "");
        setFechaVencimientoRif(consejo.fecha_vencimiento_rif || "");
        if (consejo.id_sector) {
          setSelectedSectorId(consejo.id_sector);
          // Cargar comuna asociada
          (async () => {
            const { data: sectorData } = await supabase
              .from('sectores')
              .select('id_datos_comuna')
              .eq('id_sector', consejo.id_sector)
              .single();
            if (sectorData) setSelectedComunaId(sectorData.id_datos_comuna);
          })();
        }
      } else {
        // Nuevo registro
        setFormNombre("");
        setFormCodigoSitur("");
        setFormRifLetra("C");
        setFormRifNumero("");
        setFormCuentaBancaria("");
        setFechaVencimientoVoceros("");
        setFechaVencimientoRif("");
        setSelectedComunaId(null);
        setSelectedSectorId(null);
      }
      // Resetear archivos
      setRifFile(null);
      setCertificadoFile(null);
      setActaFile(null);
    }
  }, [showModal, consejo]);

  // Validaciones para el formulario de consejo
  const isConsejoFormValid = 
    formNombre.trim().length > 0 &&
    formCodigoSitur.trim().length > 0 &&
    selectedComunaId !== null &&
    selectedSectorId !== null;

  // Validaciones para el formulario de vocero
  const isVoceroFormValid = 
    voceroForm.nombre.trim().length > 0 &&
    voceroForm.apellido.trim().length > 0 &&
    voceroForm.cedulaNumero.trim().length > 0 &&
    validateCedula(voceroForm.cedulaTipo, voceroForm.cedulaNumero) &&
    voceroForm.unidad.trim().length > 0 &&
    voceroForm.tipo.trim().length > 0;

  // Determinar si el consejo está completo
  const isConsejoComplete = consejo && 
    consejo.nombre_consejo?.trim() &&
    consejo.codigo_situr?.trim() &&
    consejo.id_sector;

  if (loading) {
    return <div className="flex justify-center items-center p-12"><Loader2 className="animate-spin text-brand-primary" size={32} /></div>;
  }
  if (showUbicacion) {
    return <UbicacionComunalView onBack={() => setShowUbicacion(false)} />;
  }
  const sectorNombre = sectores.find(s => s.id_sector === selectedSectorId)?.nombre_sector || '';
  const comunaNombre = comunas.find(c => c.id_comuna === selectedComunaId)?.nombre_comuna || '';

  const formatFecha = (fecha: string | null) => {
    if (!fecha) return "No establecida";
    const [year, month, day] = fecha.split('-');
    return `${day}/${month}/${year}`;
  };

  return (
    <div className="space-y-6 max-sm:space-y-3">
      {/* Alert Modal */}
      <AlertModal
        isOpen={alertConfig.isOpen}
        onClose={closeAlert}
        title={alertConfig.title}
        message={alertConfig.message}
        type={alertConfig.type}
        showInput={alertConfig.showInput}
        inputPlaceholder={alertConfig.inputPlaceholder}
        cancelText={alertConfig.cancelText}
        confirmText={alertConfig.confirmText}
        onConfirm={alertConfig.onConfirm}
      />

      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-2 bg-white p-4 rounded-2xl border border-gray-100 shadow-sm max-sm:p-2 max-sm:gap-1">
        <div>
          <h2 className="text-lg font-black text-slate-800 italic uppercase tracking-tighter flex items-center gap-2 max-sm:text-base max-sm:gap-1">
            <Shield className="h-5 w-5 text-brand-primary max-sm:h-4 max-sm:w-4" /> Datos de identificación legal
          </h2>
          <p className="text-[9px] text-slate-400 font-bold uppercase tracking-[0.15em] mt-1 max-sm:text-[8px] max-sm:mt-0.5">
            Gestión de documentación y registros oficiales
          </p>
        </div>
        <div className="flex gap-2 max-sm:gap-1">
          {isRegistered && (
            <button
              type="button"
              onClick={() => setShowVocerosModal(true)}
              disabled={vocerosFirmantes.length >= 3}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-[10px] font-black italic uppercase tracking-wider transition-all bg-linear-to-r from-brand-primary to-brand-primary/90 text-white shadow-lg shadow-brand-primary/20 hover:shadow-xl hover:scale-[1.02] hover:from-brand-primary/90 disabled:opacity-50 disabled:pointer-events-none disabled:shadow-none max-sm:px-2 max-sm:py-1 max-sm:text-[8px] max-sm:gap-1"
            >
              <Users className="h-3.5 w-3.5 max-sm:h-3 max-sm:w-3" />
              Voceros ({vocerosFirmantes.length}/3)
            </button>
          )}
          <button
            onClick={() => setShowModal(true)}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-[10px] font-black italic uppercase tracking-wider transition-all max-sm:px-2 max-sm:py-1 max-sm:text-[8px] max-sm:gap-1 ${
              isRegistered
                ? "text-slate-400 border border-gray-100 hover:bg-gray-50"
                : "bg-brand-primary text-white shadow-lg shadow-brand-primary/20 hover:scale-105"
            }`}
          >
            {isRegistered ? (
              isConsejoComplete ? "Actualizar" : "Completar registro"
            ) : (
              <><PlusCircle className="h-3.5 w-3.5 max-sm:h-3 max-sm:w-3" /> Registrar</>
            )}
          </button>
        </div>
      </div>

      <div className="flex justify-end max-sm:justify-center">
        <button
          onClick={() => setShowUbicacion(true)}
          className="text-brand-primary hover:text-brand-primary/80 text-[11px] font-bold uppercase tracking-wider flex items-center gap-1 transition-colors max-sm:text-[9px]"
        >
          <MapPin className="h-3 w-3 max-sm:h-2.5 max-sm:w-2.5" />
          Ubicación Geográfica
        </button>
      </div>

      {isRegistered && consejo && (
        <>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 max-sm:gap-4">
            {/* Columna Izquierda: Identificación Institucional */}
            <div className="space-y-4 max-sm:space-y-2">
              <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm max-sm:p-3">
                <h3 className="text-base font-black text-slate-800 italic uppercase tracking-tighter flex items-center gap-2 mb-3 max-sm:text-sm max-sm:mb-2">
                  <Building2 className="h-4 w-4 text-brand-primary max-sm:h-3 max-sm:w-3" /> Identificación Institucional
                </h3>
                <div className="grid gap-3 md:grid-cols-2 max-sm:gap-1.5">
                  <div><p className="text-[8px] font-bold text-slate-400 uppercase tracking-wider mb-0.5 max-sm:text-[7px]">Nombre del Consejo</p><p className="text-xs font-black text-slate-800 uppercase italic max-sm:text-[10px]">{consejo.nombre_consejo}</p></div>
                  <div><p className="text-[8px] font-bold text-slate-400 uppercase tracking-wider mb-0.5 max-sm:text-[7px]">Comuna</p><p className="text-xs font-black text-slate-800 uppercase italic max-sm:text-[10px]">{comunaNombre}</p></div>
                  <div><p className="text-[8px] font-bold text-slate-400 uppercase tracking-wider mb-0.5 max-sm:text-[7px]">Sector</p><p className="text-xs font-black text-slate-800 uppercase italic max-sm:text-[10px]">{sectorNombre}</p></div>
                  <div><p className="text-[8px] font-bold text-slate-400 uppercase tracking-wider mb-0.5 max-sm:text-[7px]">Código SITUR</p><p className="text-xs font-black text-slate-800 uppercase italic max-sm:text-[10px]">{consejo.codigo_situr}</p></div>
                </div>

                <div className="mt-3 pt-3 border-t border-gray-50 max-sm:mt-2 max-sm:pt-2">
                  <div className="grid md:grid-cols-2 gap-3 max-sm:gap-2">
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4 text-amber-600 max-sm:h-3 max-sm:w-3" />
                      <div className="flex-1">
                        <p className="text-[8px] font-bold text-slate-400 uppercase tracking-wider max-sm:text-[7px]">Vencimiento de vocerías</p>
                        <div className="flex items-center justify-between mt-1 flex-wrap gap-2 max-sm:mt-0.5">
                          <p className="text-xs font-black text-slate-800 max-sm:text-[10px]">
                            {consejo.fecha_vencimiento_voceros ? formatFecha(consejo.fecha_vencimiento_voceros) : "No establecida"}
                          </p>
                          {consejo.fecha_vencimiento_voceros && (
                            (() => {
                              const { text, color } = getTimeRemaining(consejo.fecha_vencimiento_voceros);
                              const colorClasses = {
                                emerald: "bg-emerald-50 text-emerald-700 border-emerald-100",
                                amber: "bg-amber-50 text-amber-700 border-amber-100",
                                rose: "bg-rose-50 text-rose-700 border-rose-100",
                                gray: "bg-gray-50 text-gray-500 border-gray-100"
                              };
                              return (
                                <span className={`px-2 py-0.5 rounded-md text-[8px] font-black uppercase border max-sm:text-[7px] max-sm:px-1 max-sm:py-0 ${colorClasses[color as keyof typeof colorClasses]}`}>
                                  {text}
                                </span>
                              );
                            })()
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4 text-blue-600 max-sm:h-3 max-sm:w-3" />
                      <div className="flex-1">
                        <p className="text-[8px] font-bold text-slate-400 uppercase tracking-wider max-sm:text-[7px]">Vencimiento de RIF</p>
                        <div className="flex items-center justify-between mt-1 flex-wrap gap-2 max-sm:mt-0.5">
                          <p className="text-xs font-black text-slate-800 max-sm:text-[10px]">
                            {consejo.fecha_vencimiento_rif ? formatFecha(consejo.fecha_vencimiento_rif) : "No establecida"}
                          </p>
                          {consejo.fecha_vencimiento_rif && (
                            (() => {
                              const { text, color } = getTimeRemaining(consejo.fecha_vencimiento_rif);
                              const colorClasses = {
                                emerald: "bg-emerald-50 text-emerald-700 border-emerald-100",
                                amber: "bg-amber-50 text-amber-700 border-amber-100",
                                rose: "bg-rose-50 text-rose-700 border-rose-100",
                                gray: "bg-gray-50 text-gray-500 border-gray-100"
                              };
                              return (
                                <span className={`px-2 py-0.5 rounded-md text-[8px] font-black uppercase border max-sm:text-[7px] max-sm:px-1 max-sm:py-0 ${colorClasses[color as keyof typeof colorClasses]}`}>
                                  {text}
                                </span>
                              );
                            })()
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="mt-3 pt-3 border-t border-gray-50 max-sm:mt-2 max-sm:pt-2">
                  <div className="flex items-center gap-2">
                    <ShieldCheck className="h-4 w-4 text-brand-primary max-sm:h-3 max-sm:w-3" />
                    <div className="flex-1">
                      <p className="text-[8px] font-bold text-slate-400 uppercase tracking-wider max-sm:text-[7px]">Estado de validación</p>
                      <div className="flex items-center gap-2 mt-1 flex-wrap max-sm:mt-0.5">
                        <span className={cn(
                          "px-2 py-0.5 rounded-md text-[9px] font-black uppercase border max-sm:text-[8px] max-sm:px-1",
                          consejo.estatus_validacion === "APROBADO" && "bg-emerald-50 text-emerald-700 border-emerald-100",
                          consejo.estatus_validacion === "PENDIENTE" && "bg-amber-50 text-amber-700 border-amber-100",
                          consejo.estatus_validacion === "RECHAZADO" && "bg-rose-50 text-rose-700 border-rose-100",
                          (!consejo.estatus_validacion) && "bg-gray-50 text-gray-500 border-gray-100"
                        )}>
                          {consejo.estatus_validacion || "PENDIENTE"}
                        </span>
                        {consejo.estatus_validacion === "RECHAZADO" && consejo.motivo_rechazo && (
                          <span className="text-[9px] font-bold text-rose-600 flex items-center gap-1 max-sm:text-[8px]">
                            <AlertCircle className="h-3 w-3 max-sm:h-2 max-sm:w-2" />
                            Motivo: {consejo.motivo_rechazo}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Columna Derecha: Documentos */}
            <div className="flex flex-col gap-3 max-sm:gap-2">
              <DocumentCardCompact 
                title="RIF Comunal" 
                desc="Registro de Información Fiscal" 
                icon={FileCheck} 
                detail={consejo.rif || "No registrado"} 
                fileUrl={consejo.rif_url} 
              />
              <DocumentCardCompact 
                title="Certificado Cuenta" 
                desc="Constancia bancaria" 
                icon={FileText} 
                detail={consejo.certificado_cuenta_url ? "Ver documento" : "No subido"} 
                fileUrl={consejo.certificado_cuenta_url} 
              />
              <DocumentCardCompact 
                title="Acta Constitutiva" 
                desc="Documento Legal" 
                icon={Activity} 
                detail={`Registrada: ${new Date(consejo.created_at || Date.now()).getFullYear()}`} 
                fileUrl={consejo.acta_constitutiva_url} 
              />
            </div>
          </div>

          {/* Sección de Voceros Firmantes */}
          {vocerosFirmantes.length > 0 && (
            <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm max-sm:p-2">
              <h3 className="text-base font-black text-slate-800 italic uppercase tracking-tighter flex items-center gap-2 mb-2 max-sm:text-sm max-sm:mb-1">
                <Users className="h-4 w-4 text-brand-primary max-sm:h-3 max-sm:w-3" /> Voceros Firmantes
              </h3>
              <div className="grid gap-4 md:grid-cols-3 max-sm:gap-2">
                {vocerosFirmantes.map((vocero) => (
                  <VoceroCard
                    key={vocero.id_vocero}
                    vocero={vocero}
                    onUpdate={handleEditVocero}
                  />
                ))}
              </div>
              {vocerosFirmantes.length < 3 && (
                <p className="text-[9px] text-emerald-600 font-bold mt-3 flex items-center gap-1.5 max-sm:text-[8px] max-sm:mt-2">
                  <CheckCircle2 className="h-3 w-3 max-sm:h-2 max-sm:w-2" />
                  Puedes registrar {3 - vocerosFirmantes.length} vocero(s) firmante(s) más
                </p>
              )}
            </div>
          )}
        </>
      )}

      {/* MODAL DE CONSEJO */}
      <AnimatePresence>
        {showModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowModal(false)}
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
                  {consejo ? "Editar Datos" : "Registrar Datos"}
                </h4>
                <button onClick={() => setShowModal(false)} className="p-1.5 rounded-lg hover:bg-gray-100"><X className="h-4 w-4 text-slate-400" /></button>
              </div>
              <form onSubmit={handleRegister} className="p-6 space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                  <div>
                    <label className="text-[9px] font-bold text-slate-400 uppercase tracking-widest block mb-1">Nombre Consejo *</label>
                    <input
                      type="text"
                      value={formNombre}
                      onChange={(e) => setFormNombre(e.target.value)}
                      className="w-full p-3 rounded-xl bg-gray-50 text-sm"
                      required
                    />
                  </div>
                  <div>
                    <label className="text-[9px] font-bold text-slate-400 uppercase tracking-widest block mb-1">RIF <span className="text-slate-300">(Opcional)</span></label>
                    <div className="flex gap-1.5">
                      <select
                        value={formRifLetra}
                        onChange={(e) => setFormRifLetra(e.target.value)}
                        className="w-11 p-3 rounded-xl bg-gray-50 text-sm"
                      >
                        <option>C</option><option>G</option>
                      </select>
                      <input
                        type="text"
                        value={formRifNumero}
                        onChange={(e) => setFormRifNumero(e.target.value.replace(/\D/g, ''))}
                        maxLength={9}
                        className="w-37 p-3 rounded-xl bg-gray-50 text-sm"
                        placeholder="00000000"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="text-[9px] font-bold text-slate-400 uppercase tracking-widest block mb-1">Código SITUR *</label>
                    <input
                      type="text"
                      value={formCodigoSitur}
                      onChange={(e) => setFormCodigoSitur(e.target.value)}
                      maxLength={20}
                      className="w-full p-3 rounded-xl bg-gray-50 text-sm"
                      placeholder="00-00-00-00-00"
                      required
                    />
                  </div>
                  <div>
                    <label className="text-[9px] font-bold text-slate-400 uppercase tracking-widest block mb-1">Comuna *</label>
                    <select
                      value={selectedComunaId || ""}
                      onChange={(e) => {
                        setSelectedComunaId(Number(e.target.value));
                        setSelectedSectorId(null);
                      }}
                      className="w-full p-3 rounded-xl bg-gray-50 text-sm"
                      required
                    >
                      <option value="">Comuna</option>
                      {comunas.map(c => <option key={c.id_comuna} value={c.id_comuna}>{c.nombre_comuna}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="text-[9px] font-bold text-slate-400 uppercase tracking-widest block mb-1">Sector *</label>
                    <select
                      value={selectedSectorId || ""}
                      onChange={(e) => setSelectedSectorId(Number(e.target.value))}
                      className="w-full p-3 rounded-xl bg-gray-50 text-sm"
                      required
                      disabled={!selectedComunaId}
                    >
                      <option value="">Sector</option>
                      {sectores.map(s => <option key={s.id_sector} value={s.id_sector}>{s.nombre_sector}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="text-[9px] font-bold text-slate-400 uppercase tracking-widest block mb-1">N° Cuenta <span className="text-slate-300">(Opcional)</span></label>
                    <input
                      type="text"
                      value={formCuentaBancaria}
                      onChange={(e) => setFormCuentaBancaria(e.target.value)}
                      className="w-full p-3 rounded-xl bg-gray-50 text-sm"
                      maxLength={20}
                    />
                  </div>
                </div>

                <div className="grid md:grid-cols-2 gap-3">
                  <div>
                    <label className="text-[9px] font-bold text-slate-400 uppercase tracking-widest block mb-1">Vencimiento de Vocerías</label>
                    <input
                      type="date"
                      value={fechaVencimientoVoceros}
                      onChange={(e) => setFechaVencimientoVoceros(e.target.value)}
                      className="w-full p-3 rounded-xl bg-gray-50 text-sm"
                    />
                  </div>
                  <div>
                    <label className="text-[9px] font-bold text-slate-400 uppercase tracking-widest block mb-1">Vencimiento de RIF</label>
                    <input
                      type="date"
                      value={fechaVencimientoRif}
                      onChange={(e) => setFechaVencimientoRif(e.target.value)}
                      className="w-full p-3 rounded-xl bg-gray-50 text-sm"
                    />
                  </div>
                </div>

                <div className="grid md:grid-cols-3 gap-3">
                  <FileUploadSection
                    label="Certificado de Cuenta"
                    file={certificadoFile}
                    existingUrl={consejo?.certificado_cuenta_url || null}
                    onTrigger={() => triggerUpload(certificadoInputRef)}
                    onChange={(e) => handleFileChange(e, setCertificadoFile)}
                    inputRef={certificadoInputRef}
                  />
                  <FileUploadSection
                    label="RIF Digitalizado"
                    file={rifFile}
                    existingUrl={consejo?.rif_url || null}
                    onTrigger={() => triggerUpload(rifInputRef)}
                    onChange={(e) => handleFileChange(e, setRifFile)}
                    inputRef={rifInputRef}
                  />
                  <FileUploadSection
                    label="Acta Constitutiva"
                    file={actaFile}
                    existingUrl={consejo?.acta_constitutiva_url || null}
                    onTrigger={() => triggerUpload(actaInputRef)}
                    onChange={(e) => handleFileChange(e, setActaFile)}
                    inputRef={actaInputRef}
                  />
                </div>

                <button
                  type="submit"
                  disabled={saving || !isConsejoFormValid}
                  className="w-full py-3 px-6 bg-brand-primary text-white rounded-xl uppercase font-black text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:scale-[1.02] transition-all"
                >
                  {saving ? <Loader2 className="animate-spin mx-auto" size={16} /> : (consejo ? "Actualizar" : "Guardar")}
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* MODAL DE VOCEROS */}
      <AnimatePresence>
        {showVocerosModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowVocerosModal(false)}
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
                <button onClick={() => {
                  setShowVocerosModal(false);
                  setEditingVoceroId(null);
                  resetVoceroForm();
                }} className="p-1.5 rounded-lg hover:bg-gray-100">
                  <X className="h-4 w-4 text-slate-400" />
                </button>
              </div>
              <form onSubmit={handleSaveVocero} className="p-6 space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                  <div>
                    <label className="text-[9px] font-bold text-slate-400 uppercase tracking-widest block mb-1">Nombre *</label>
                    <input
                      name="nombre"
                      value={voceroForm.nombre}
                      onChange={handleVoceroChange}
                      className="w-full p-3 rounded-xl bg-gray-50 text-sm disabled:bg-gray-100 disabled:text-slate-500 disabled:cursor-not-allowed"
                      required
                      disabled={!!editingVoceroId}
                    />
                  </div>
                  <div>
                    <label className="text-[9px] font-bold text-slate-400 uppercase tracking-widest block mb-1">Apellido *</label>
                    <input
                      name="apellido"
                      value={voceroForm.apellido}
                      onChange={handleVoceroChange}
                      className="w-full p-3 rounded-xl bg-gray-50 text-sm disabled:bg-gray-100 disabled:text-slate-500 disabled:cursor-not-allowed"
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
                        className="flex-1 min-w-0 p-3 rounded-xl bg-gray-50 text-sm disabled:bg-gray-100 disabled:text-slate-500 disabled:cursor-not-allowed"
                        required
                        disabled={!!editingVoceroId}
                      />
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                  <div>
                    <label className="text-[9px] font-bold text-slate-400 uppercase tracking-widest block mb-1">Teléfono</label>
                    <div className="flex gap-1.5">
                      <select
                        value={voceroForm.operadora}
                        onChange={(e) => handleOperadoraChange(e.target.value)}
                        className="w-20 p-3 rounded-xl bg-gray-50 text-sm"
                      >
                        <option value="">Cód</option>
                        {operadoras.map(op => (
                          <option key={op.codigo} value={op.codigo}>{op.codigo}</option>
                        ))}
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
                  <div>
                    <label className="text-[9px] font-bold text-slate-400 uppercase tracking-widest block mb-1">Unidad *</label>
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
                    <label className="text-[9px] font-bold text-slate-400 uppercase tracking-widest block mb-1">Tipo *</label>
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
                </div>

                {/* Comité */}
                <div className="mt-2">
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
                      className="w-full p-3 rounded-xl bg-gray-50 text-sm disabled:bg-gray-100 disabled:text-slate-400 disabled:cursor-not-allowed transition-all focus:ring-2 focus:ring-brand-primary/20 outline-none"
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
                    existingUrl={null}
                    onTrigger={() => triggerUpload(voceroRifInputRef)}
                    onChange={handleVoceroRifChange}
                    inputRef={voceroRifInputRef}
                  />
                  <FileUploadSection
                    label="Fotografía Cédula"
                    file={voceroCedulaFile}
                    existingUrl={null}
                    onTrigger={() => triggerUpload(voceroCedulaInputRef)}
                    onChange={handleVoceroCedulaChange}
                    inputRef={voceroCedulaInputRef}
                  />
                </div>

                <button
                  type="submit"
                  disabled={savingVocero || !isVoceroFormValid || (!editingVoceroId && vocerosFirmantes.length >= 3)}
                  className="w-full py-3 px-6 bg-brand-primary text-white rounded-xl uppercase font-black text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:scale-[1.02] transition-all"
                >
                  {savingVocero ? <Loader2 className="animate-spin mx-auto" size={16} /> : (editingVoceroId ? "Actualizar Vocero" : "Guardar Vocero")}
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

// Componente DocumentCardCompact (sin cambios)
interface DocumentCardCompactProps {
  title: string;
  desc: string;
  icon: React.ElementType;
  detail: string;
  fileUrl: string | null;
}

const DocumentCardCompact = ({ title, desc, icon: Icon, detail, fileUrl }: DocumentCardCompactProps) => {
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
    <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm flex items-center justify-between group max-sm:p-2 max-sm:rounded-lg">
      <div className="flex items-center gap-3 max-sm:gap-2">
        <div className="h-8 w-8 rounded-lg bg-brand-primary/10 flex items-center justify-center text-brand-primary group-hover:bg-brand-primary group-hover:text-white transition-all max-sm:h-6 max-sm:w-6">
          <Icon className="h-4 w-4 max-sm:h-3 max-sm:w-3" />
        </div>
        <div>
          <h4 className="text-sm font-black text-slate-800 italic max-sm:text-xs">{title}</h4>
          <p className="text-[8px] text-slate-400 font-bold uppercase max-sm:text-[7px]">{desc}</p>
          <span className="text-[9px] font-bold text-slate-500 mt-0.5 block max-sm:text-[8px]">{detail}</span>
        </div>
      </div>
      {fileUrl && (
        <button onClick={handleView} disabled={isLoading} className="p-1.5 rounded-lg bg-gray-50 hover:bg-brand-primary/10 disabled:opacity-50 max-sm:p-1">
          {isLoading ? <Loader2 className="h-3 w-3 animate-spin max-sm:h-2.5 max-sm:w-2.5" /> : <Eye className="h-3 w-3 max-sm:h-2.5 max-sm:w-2.5" />}
        </button>
      )}
    </div>
  );
};

// Componente VoceroCard (sin cambios)
interface VoceroCardProps {
  vocero: VoceroFirmante;
  onUpdate?: (vocero: VoceroFirmante) => void;
}

const VoceroCard = ({ vocero, onUpdate }: VoceroCardProps) => {
  const [isLoadingRif, setIsLoadingRif] = useState(false);
  const [isLoadingCedula, setIsLoadingCedula] = useState(false);

  const handleViewRif = async () => {
    if (!vocero.rif_url) return;
    setIsLoadingRif(true);
    const signedUrl = await getSignedUrlFromPublicUrl(vocero.rif_url);
    setIsLoadingRif(false);
    if (signedUrl) window.open(signedUrl, '_blank');
    else alert('No se pudo acceder al documento');
  };

  const handleViewCedula = async () => {
    if (!vocero.cedula_url) return;
    setIsLoadingCedula(true);
    const signedUrl = await getSignedUrlFromPublicUrl(vocero.cedula_url);
    setIsLoadingCedula(false);
    if (signedUrl) window.open(signedUrl, '_blank');
    else alert('No se pudo acceder al documento');
  };

  return (
    <div className="bg-white p-3 rounded-xl border border-gray-100 shadow-sm group max-sm:p-2 max-sm:rounded-lg">
      <div className="flex justify-between items-start mb-2 max-sm:mb-1">
        <div className="h-8 w-8 rounded-lg bg-brand-primary/10 flex items-center justify-center text-brand-primary group-hover:bg-brand-primary group-hover:text-white transition-all max-sm:h-6 max-sm:w-6">
          <User className="h-4 w-4 max-sm:h-3 max-sm:w-3" />
        </div>
        <span className="text-[8px] font-black px-1.5 py-0.5 bg-emerald-50 text-emerald-600 rounded-md uppercase max-sm:text-[7px] max-sm:px-1">
          {vocero.tipo}
        </span>
      </div>

      <h4 className="text-sm font-black text-slate-800 italic leading-tight max-sm:text-xs">
        {vocero.nombre_completo || `${vocero.nombre} ${vocero.apellido}`}
      </h4>
      <p className="text-[9px] text-slate-400 font-bold uppercase tracking-wider mt-0.5 max-sm:text-[8px]">
        {vocero.unidad}
      </p>

      <div className="mt-2 pt-2 border-t border-gray-50 grid grid-cols-2 gap-x-2 gap-y-1 max-sm:mt-1 max-sm:pt-1">
        <div className="flex items-center gap-1">
          <IdCard className="h-2.5 w-2.5 text-slate-400 shrink-0 max-sm:h-2 max-sm:w-2" />
          <span className="text-[9px] font-bold text-slate-600 truncate max-sm:text-[8px]">{vocero.cedula}</span>
        </div>
        <div className="flex items-center gap-1">
          <Phone className="h-2.5 w-2.5 text-slate-400 shrink-0 max-sm:h-2 max-sm:w-2" />
          <span className="text-[9px] font-bold text-slate-600 truncate max-sm:text-[8px]">{vocero.telefono}</span>
        </div>
      </div>

      {vocero.comite && (
        <div className="mt-1 flex items-start gap-1">
          <div className="w-1 h-1 bg-slate-400 rounded-full mt-0.5 shrink-0" />
          <span className="text-[9px] font-bold text-slate-500 leading-tight line-clamp-2 max-sm:text-[8px]">{vocero.comite}</span>
        </div>
      )}

      <div className="mt-2 pt-2 border-t border-gray-50 space-y-1.5 max-sm:mt-1 max-sm:pt-1">
        <div className="flex gap-1">
          {vocero.rif_url && (
            <button
              onClick={handleViewRif}
              disabled={isLoadingRif}
              className="flex-1 py-1 rounded-md bg-gray-50 hover:bg-brand-primary/10 disabled:opacity-50 text-[8px] text-slate-600 font-bold flex items-center justify-center gap-1 max-sm:text-[7px] max-sm:py-0.5"
              title="Ver RIF"
            >
              {isLoadingRif ? <Loader2 className="h-2 w-2 animate-spin max-sm:h-1.5 max-sm:w-1.5" /> : <FileCheck className="h-2 w-2 max-sm:h-1.5 max-sm:w-1.5" />}
              RIF
            </button>
          )}
          {vocero.cedula_url && (
            <button
              onClick={handleViewCedula}
              disabled={isLoadingCedula}
              className="flex-1 py-1 rounded-md bg-gray-50 hover:bg-brand-primary/10 disabled:opacity-50 text-[8px] text-slate-600 font-bold flex items-center justify-center gap-1 max-sm:text-[7px] max-sm:py-0.5"
              title="Ver Cédula"
            >
              {isLoadingCedula ? <Loader2 className="h-2 w-2 animate-spin max-sm:h-1.5 max-sm:w-1.5" /> : <IdCard className="h-2 w-2 max-sm:h-1.5 max-sm:w-1.5" />}
              Cédula
            </button>
          )}
        </div>

        <div className="flex justify-center">
          <button
            type="button"
            onClick={() => onUpdate && onUpdate(vocero)}
            className="text-[8px] font-black uppercase tracking-wider text-brand-primary hover:text-brand-primary/80 hover:underline flex items-center gap-0.5 transition-all max-sm:text-[7px]"
          >
            <RefreshCw className="h-2 w-2 max-sm:h-1.5 max-sm:w-1.5" />
            Actualizar
          </button>
        </div>
      </div>
    </div>
  );
};