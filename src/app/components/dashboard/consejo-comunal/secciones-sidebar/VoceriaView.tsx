"use client";

import React, { useState, useEffect, useMemo, useRef } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Plus, X, Upload, CheckCircle2, AlertCircle, ChevronRight, ChevronLeft, 
  Shield, Eye, Loader2, Trash2, Edit, UserPlus, FileCheck
} from "lucide-react";
import { supabase } from "@/app/lib/supabaseClient";
import { useAuth } from "@/context/AuthContext";
import { cn } from "@/app/lib/utils";
import { AlertModal } from "@/app/components/AlertModal";

interface Vocero {
  id_vocero: number;
  nombre: string;
  apellido: string;
  nombre_completo: string;
  cedula: string;
  cedula_url: string | null;
  unidad: string;
  comite?: string | null;
  tipo: 'Principal' | 'Suplente';
  profesion: string | null;
  grado_instruccion: string | null;
  telefono: string | null;
  rif_url: string | null;
  rif_fecha_vencimiento: string | null;
  rif_ultima_actualizacion: string | null;
  es_auxiliar?: boolean;
  id_usuario?: string;
}

export const VoceriaView = () => {
  const { user } = useAuth();
  const [consejoId, setConsejoId] = useState<number | null>(null);
  const [noConsejo, setNoConsejo] = useState(false);
  const [voceros, setVoceros] = useState<Vocero[]>([]);
  const [loading, setLoading] = useState(true);
  const [isRegisterOpen, setIsRegisterOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [editingVocero, setEditingVocero] = useState<Vocero | null>(null);
  const [selectedUnit, setSelectedUnit] = useState<string>("TODAS");
  const [currentPage, setCurrentPage] = useState(1);
  const [saving, setSaving] = useState(false);
  const [hasAuxiliar, setHasAuxiliar] = useState(false);

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

  const [manualVencimiento, setManualVencimiento] = useState<string>('');

  const [formData, setFormData] = useState({
    nombre: '',
    apellido: '',
    cedulaTipo: 'V',
    cedulaNumero: '',
    unidad: 'Unidad Ejecutiva',
    comite: '',
    tipo: 'Principal' as 'Principal' | 'Suplente',
    profesion: '',
    grado_instruccion: '',
    telefono: '',
    operadora: '' as string,
  });
  const [rifFile, setRifFile] = useState<File | null>(null);
  const [cedulaFile, setCedulaFile] = useState<File | null>(null);
  const [existingRifUrl, setExistingRifUrl] = useState<string | null>(null);
  const [existingCedulaUrl, setExistingCedulaUrl] = useState<string | null>(null);
  const rifFileInputRef = useRef<HTMLInputElement>(null);
  const cedulaFileInputRef = useRef<HTMLInputElement>(null);

  const itemsPerPage = 8;
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

  const [showAuxiliarModal, setShowAuxiliarModal] = useState(false);
  const [selectedVocero, setSelectedVocero] = useState<Vocero | null>(null);
  const [auxEmail, setAuxEmail] = useState('');
  const [auxPassword, setAuxPassword] = useState('');
  const [auxConfirm, setAuxConfirm] = useState('');
  const [isOwner, setIsOwner] = useState(false);
  const [ownerCedula, setOwnerCedula] = useState<string | null>(null);

  useEffect(() => {
    const checkOwner = async () => {
      if (!user?.id || !consejoId) return;
      const { data } = await supabase
        .from('datos_consejo_comunal')
        .select('id_usuario')
        .eq('id_consejo', consejoId)
        .single();
      setIsOwner(data?.id_usuario === user.id);
    };
    checkOwner();
  }, [user, consejoId]);

  useEffect(() => {
    const fetchOwnerCedula = async () => {
      if (!user?.id || !consejoId) return;
      const { data: consejoData } = await supabase
        .from('datos_consejo_comunal')
        .select('id_usuario')
        .eq('id_consejo', consejoId)
        .single();
      if (consejoData?.id_usuario) {
        const { data: perfil } = await supabase
          .from('perfil_usuario')
          .select('cedula')
          .eq('id_usuario', consejoData.id_usuario)
          .single();
        if (perfil) setOwnerCedula(perfil.cedula);
      }
    };
    fetchOwnerCedula();
  }, [user, consejoId]);

  const handleOpenAuxiliarModal = (vocero: Vocero) => {
    setSelectedVocero(vocero);
    setAuxEmail('');
    setAuxPassword('');
    setAuxConfirm('');
    setShowAuxiliarModal(true);
  };

 const handleCreateAuxiliar = async () => {
  if (!selectedVocero) return;
  if (auxPassword !== auxConfirm) {
    showAlert('Error', 'Las contraseñas no coinciden', 'danger');
    return;
  }
  if (!auxEmail || !auxPassword) {
    showAlert('Error', 'Correo y contraseña son requeridos', 'danger');
    return;
  }

  setSaving(true);

  try {
    const { data: { session } } = await supabase.auth.getSession();
    const token = session?.access_token;

    if (!token) {
      throw new Error('No hay sesión activa. Por favor, inicia sesión nuevamente.');
    }

    const nombreCompleto = selectedVocero.nombre_completo.split(' ');
    const nombre = nombreCompleto[0] || '';
    const apellido = nombreCompleto.slice(1).join(' ') || '';

    const response = await fetch(`${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/create-auxiliar`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({
        tipo: 'consejo',
        email: auxEmail,
        password: auxPassword,
        nombre: nombre,
        apellido: apellido,
        cedula: selectedVocero.cedula,
        consejoId: consejoId,
        responsableId: selectedVocero.id_vocero
      })
    });

    const result = await response.json();

    if (!response.ok) {
      console.error('Error response from edge function:', result);
      const errorMsg = result.error || 'Error al crear el auxiliar';

      // Detectar errores específicos
      if (
        errorMsg.toLowerCase().includes('already been registered') ||
        errorMsg.toLowerCase().includes('ya registrado')
      ) {
        throw new Error('El correo electrónico ya está registrado. Por favor, prueba con otro.');
      }

      if (
        errorMsg.toLowerCase().includes('duplicate key') &&
        errorMsg.toLowerCase().includes('cedula')
      ) {
        throw new Error('El vocero ya está registrado, por favor seleccione otro.');
      }

      throw new Error(errorMsg);
    }

    showAlert('Éxito', 'Auxiliar asignado correctamente', 'success');
    setShowAuxiliarModal(false);

    // Recargar voceros
    const { data: refreshed } = await supabase
      .from('voceros')
      .select('*')
      .eq('id_consejo', consejoId)
      .order('unidad');

    if (refreshed) setVoceros(refreshed);
    setHasAuxiliar(true);

  } catch (err: any) {
    console.error('Error completo en handleCreateAuxiliar:', err);
    let errorMsg = err.message || 'Error al crear el auxiliar';

    if (
      errorMsg.toLowerCase().includes('already been registered') ||
      errorMsg.toLowerCase().includes('ya registrado')
    ) {
      errorMsg = 'El correo electrónico ya está registrado. Por favor, prueba con otro.';
    } else if (
      errorMsg.toLowerCase().includes('duplicate key') &&
      errorMsg.toLowerCase().includes('cedula')
    ) {
      errorMsg = 'El vocero ya está registrado, por favor seleccione otro.';
    }

    showAlert('Error', errorMsg, 'danger');
  } finally {
    setSaving(false);
  }
};
  const validateCedula = (tipo: string, numero: string): boolean => {
    const numClean = numero.replace(/\D/g, '');
    return (tipo === 'V' || tipo === 'E') && numClean.length >= 7 && numClean.length <= 8;
  };

  const getCedulaCompleta = () => {
    const num = formData.cedulaNumero.replace(/\D/g, '');
    if (!num) return '';
    return `${formData.cedulaTipo}-${num}`;
  };

  const filteredComites = useMemo(() => {
    if (!comiteSearchTerm.trim()) return comites;
    const term = comiteSearchTerm.toLowerCase();
    return comites.filter(c => c.toLowerCase().includes(term));
  }, [comiteSearchTerm]);

  const selectComite = (comite: string) => {
    setFormData(prev => ({ ...prev, comite }));
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

  const getDaysUntilExpiration = (fechaVencimiento: string | null): number | null => {
    if (!fechaVencimiento) return null;
    let fecha: Date;
    if (fechaVencimiento.includes('-')) {
      const [anio, mes, dia] = fechaVencimiento.split('-');
      fecha = new Date(parseInt(anio), parseInt(mes) - 1, parseInt(dia));
    } 
    else if (fechaVencimiento.includes('/')) {
      const [dia, mes, anio] = fechaVencimiento.split('/');
      fecha = new Date(parseInt(anio), parseInt(mes) - 1, parseInt(dia));
    } 
    else return null;
    if (isNaN(fecha.getTime())) return null;
    const hoy = new Date();
    hoy.setHours(0, 0, 0, 0);
    const diffTime = fecha.getTime() - hoy.getTime();
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  };

  const RifStatusBadge = ({ fechaVencimiento }: { fechaVencimiento: string | null }) => {
    const dias = getDaysUntilExpiration(fechaVencimiento);
    if (dias === null) return null;
    if (dias < 0) return <span className="text-[8px] font-black px-1.5 py-0.5 rounded-full bg-rose-100 text-rose-700">VENCIDO</span>;
    if (dias <= 30) return <span className="text-[8px] font-black px-1.5 py-0.5 rounded-full bg-amber-100 text-amber-700">Vence en {dias} días</span>;
    return <span className="text-[8px] font-black px-1.5 py-0.5 rounded-full bg-emerald-100 text-emerald-700">Vigente</span>;
  };

  const uploadFile = async (file: File, voceroId: number, type: 'rif' | 'cedula'): Promise<string | null> => {
    if (!user?.id || !consejoId) return null;
    const fileExt = file.name.split('.').pop();
    const fileName = `vocero_${type}_${Date.now()}.${fileExt}`;
    const filePath = `${consejoId}/voceros/${voceroId}/${fileName}`;

    const { error } = await supabase.storage
      .from('documentos_consejos')
      .upload(filePath, file, { upsert: true });
    if (error) {
      console.error(`Error subiendo ${type} del vocero:`, error.message);
      return null;
    }
    return filePath;
  };

  const deleteFileFromStorage = async (pathOrUrl: string): Promise<void> => {
    const bucketName = 'documentos_consejos';
    let relativePath = pathOrUrl;
    if (pathOrUrl.includes('http')) {
      const searchString = `/storage/v1/object/public/${bucketName}/`;
      const pathStart = pathOrUrl.indexOf(searchString);
      if (pathStart !== -1) {
        relativePath = pathOrUrl.substring(pathStart + searchString.length);
      }
    }
    await supabase.storage.from(bucketName).remove([relativePath]);
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateCedula(formData.cedulaTipo, formData.cedulaNumero)) {
      showAlert('Formato inválido', 'Cédula debe ser V-XXXXXXX o E-XXXXXXX (7 u 8 dígitos)', 'danger');
      return;
    }
    if (!formData.nombre.trim() || !formData.apellido.trim()) {
      showAlert('Campos requeridos', 'Nombre y apellido son obligatorios', 'warning');
      return;
    }
    if (!consejoId) {
      showAlert('Error', 'No se detectó el ID del consejo', 'danger');
      return;
    }
    setSaving(true);

    try {
      const nombreCompleto = `${formData.nombre.trim()} ${formData.apellido.trim()}`;
      const telefonoCompleto = formData.operadora && formData.telefono 
        ? `${formData.operadora}-${formData.telefono}` 
        : null;

      const datosParaInsertar = {
        id_consejo: consejoId,
        nombre_completo: nombreCompleto,
        cedula: getCedulaCompleta(),
        unidad: formData.unidad,
        comite: formData.unidad === 'Unidad Ejecutiva' ? formData.comite : null,
        tipo: formData.tipo,
        profesion: formData.profesion || null,
        grado_instruccion: formData.grado_instruccion || null,
        telefono: telefonoCompleto,
        es_firmante: false,
        cedula_url: null,
        rif_url: null,
        rif_fecha_vencimiento: null,
        rif_ultima_actualizacion: null
      };

      const { data: nuevoVocero, error: insertError } = await supabase
        .from('voceros')
        .insert([datosParaInsertar])
        .select()
        .single();
      if (insertError) throw insertError;

      let updates: any = {};
      const voceroId = nuevoVocero.id_vocero;

      if (cedulaFile) {
        const path = await uploadFile(cedulaFile, voceroId, 'cedula');
        if (path) updates.cedula_url = path;
      }
      if (rifFile) {
        const path = await uploadFile(rifFile, voceroId, 'rif');
        if (path) updates.rif_url = path;
      }

      if (manualVencimiento) {
        updates.rif_fecha_vencimiento = manualVencimiento;
      }

      if (Object.keys(updates).length > 0) {
        const { error: updateError } = await supabase
          .from('voceros')
          .update(updates)
          .eq('id_vocero', voceroId);
        if (updateError) throw updateError;
      }

      showAlert('Éxito', 'Vocero registrado exitosamente', 'success');
      setRifFile(null);
      setCedulaFile(null);
      setFormData({
        nombre: '',
        apellido: '',
        cedulaTipo: 'V',
        cedulaNumero: '',
        unidad: 'Unidad Ejecutiva',
        comite: '',
        tipo: 'Principal',
        profesion: '',
        grado_instruccion: '',
        telefono: '',
        operadora: '',
      });
      setIsRegisterOpen(false);
      const { data: refreshedVoceros } = await supabase
        .from('voceros')
        .select('*')
        .eq('id_consejo', consejoId);
      if (refreshedVoceros) setVoceros(refreshedVoceros);
    } catch (error: any) {
      console.error('Error en el proceso:', error.message);
      showAlert('Error', error.message, 'danger');
    } finally {
      setSaving(false);
    }
  };

  const handleEditClick = (vocero: Vocero) => {
    const nombreCompletoParts = vocero.nombre_completo.split(' ');
    const nombre = nombreCompletoParts[0] || '';
    const apellido = nombreCompletoParts.slice(1).join(' ') || '';

    let operadora = '';
    let telefono = '';
    if (vocero.telefono) {
      const parts = vocero.telefono.split('-');
      if (parts.length === 2) {
        operadora = parts[0];
        telefono = parts[1];
      } else {
        telefono = vocero.telefono;
      }
    }

    let cedulaTipo = 'V';
    let cedulaNumero = '';
    if (vocero.cedula) {
      const match = vocero.cedula.match(/^([VE])\-?(\d+)$/i);
      if (match) {
        cedulaTipo = match[1].toUpperCase();
        cedulaNumero = match[2];
      } else {
        cedulaNumero = vocero.cedula.replace(/\D/g, '');
      }
    }

    setEditingVocero(vocero);
    setFormData({
      nombre,
      apellido,
      cedulaTipo,
      cedulaNumero,
      unidad: vocero.unidad,
      comite: vocero.comite || '',
      tipo: vocero.tipo,
      profesion: vocero.profesion || '',
      grado_instruccion: vocero.grado_instruccion || '',
      telefono,
      operadora,
    });
    setExistingRifUrl(vocero.rif_url);
    setExistingCedulaUrl(vocero.cedula_url);
    setRifFile(null);
    setCedulaFile(null);
    setComiteSearchTerm(vocero.comite || '');
    setShowComiteDropdown(false);
    if (vocero.rif_fecha_vencimiento) {
      setManualVencimiento(vocero.rif_fecha_vencimiento);
    } else {
      setManualVencimiento('');
    }
    setIsEditOpen(true);
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateCedula(formData.cedulaTipo, formData.cedulaNumero)) {
      showAlert('Formato inválido', 'Cédula debe ser V-XXXXXXX o E-XXXXXXX (7 u 8 dígitos)', 'danger');
      return;
    }
    if (!editingVocero) return;
    setSaving(true);

    const nombreCompleto = `${formData.nombre.trim()} ${formData.apellido.trim()}`;
    const telefonoCompleto = formData.operadora && formData.telefono
      ? `${formData.operadora}-${formData.telefono}`
      : null;

    const updatedData: any = {
      nombre_completo: nombreCompleto,
      cedula: getCedulaCompleta(),
      unidad: formData.unidad,
      comite: formData.unidad === 'Unidad Ejecutiva' ? formData.comite || null : null,
      tipo: formData.tipo,
      profesion: formData.profesion || null,
      grado_instruccion: formData.grado_instruccion || null,
      telefono: telefonoCompleto,
      rif_fecha_vencimiento: manualVencimiento || null,
    };

    let newRifUrl = existingRifUrl;
    let newCedulaUrl = existingCedulaUrl;

    if (rifFile) {
      if (existingRifUrl) await deleteFileFromStorage(existingRifUrl);
      const uploadedUrl = await uploadFile(rifFile, editingVocero.id_vocero, 'rif');
      if (uploadedUrl) newRifUrl = uploadedUrl;
    }
    if (cedulaFile) {
      if (existingCedulaUrl) await deleteFileFromStorage(existingCedulaUrl);
      const uploadedUrl = await uploadFile(cedulaFile, editingVocero.id_vocero, 'cedula');
      if (uploadedUrl) newCedulaUrl = uploadedUrl;
    }

    updatedData.rif_url = newRifUrl;
    updatedData.cedula_url = newCedulaUrl;

    updatedData.rif_fecha_vencimiento = manualVencimiento || null;
    
    const { error } = await supabase
      .from('voceros')
      .update(updatedData)
      .eq('id_vocero', editingVocero.id_vocero);

    if (error) {
      console.error('Error actualizando vocero:', error);
      showAlert('Error', 'Error al actualizar', 'danger');
    } else {
      setVoceros(prev => prev.map(v => 
        v.id_vocero === editingVocero.id_vocero 
          ? { ...v, ...updatedData, nombre: formData.nombre, apellido: formData.apellido }
          : v
      ));
      setIsEditOpen(false);
      setEditingVocero(null);
      resetForm();
      showAlert('Éxito', 'Vocero actualizado correctamente', 'success');
    }
    setSaving(false);
  };

  const handleDelete = (id_vocero: number, rifUrl: string | null, cedulaUrl: string | null) => {
    showConfirm(
      'Confirmar eliminación',
      '¿Estás seguro de eliminar este vocero?',
      async () => {
        if (rifUrl) await deleteFileFromStorage(rifUrl);
        if (cedulaUrl) await deleteFileFromStorage(cedulaUrl);
        const { error } = await supabase
          .from('voceros')
          .delete()
          .eq('id_vocero', id_vocero);
        if (error) {
          console.error('Error eliminando vocero:', error);
          showAlert('Error', 'Error al eliminar', 'danger');
        } else {
          setVoceros(prev => prev.filter(v => v.id_vocero !== id_vocero));
          showAlert('Eliminado', 'Vocero eliminado correctamente', 'success');
        }
      }
    );
  };

  const handleViewFile = async (publicUrl: string | null) => {
    if (!publicUrl) return;
    const signedUrl = await getSignedUrlFromPublicUrl(publicUrl);
    if (signedUrl) window.open(signedUrl, '_blank');
    else showAlert('Error', 'No se pudo acceder al documento', 'warning');
  };

  const resetForm = () => {
    setFormData({
      nombre: '',
      apellido: '',
      cedulaTipo: 'V',
      cedulaNumero: '',
      unidad: 'Unidad Ejecutiva',
      comite: '',
      tipo: 'Principal',
      profesion: '',
      grado_instruccion: '',
      telefono: '',
      operadora: '',
    });
    setRifFile(null);
    setCedulaFile(null);
    setExistingRifUrl(null);
    setExistingCedulaUrl(null);
    setEditingVocero(null);
    setManualVencimiento('');
    setComiteSearchTerm('');
    setShowComiteDropdown(false);
    setComiteDropdownIndex(-1);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    if (name === 'unidad') {
      setFormData({ 
        ...formData, 
        [name]: value,
        comite: value === 'Unidad Ejecutiva' ? formData.comite : ''
      });
    } else {
      setFormData({ ...formData, [name]: value });
    }
  };

  const handleTelefonoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const numero = e.target.value.replace(/[^0-9]/g, '').slice(0, 7);
    setFormData({ ...formData, telefono: numero });
  };

  const handleCedulaNumeroChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const digits = e.target.value.replace(/\D/g, '').slice(0, 8);
    setFormData({ ...formData, cedulaNumero: digits });
  };

  const handleOperadoraChange = (codigo: string) => {
    setFormData({ ...formData, operadora: codigo });
  };

  const triggerRifFileUpload = () => rifFileInputRef.current?.click();
  const triggerCedulaFileUpload = () => cedulaFileInputRef.current?.click();
  const handleRifFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files?.[0]) setRifFile(e.target.files[0]);
  };
  const handleCedulaFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files?.[0]) setCedulaFile(e.target.files[0]);
  };

  const showComiteField = formData.unidad === 'Unidad Ejecutiva';

  useEffect(() => {
    if (isRegisterOpen || isEditOpen || showAuxiliarModal) {
      document.body.classList.add('modal-open');
    } else {
      document.body.classList.remove('modal-open');
    }
    return () => document.body.classList.remove('modal-open');
  }, [isRegisterOpen, isEditOpen, showAuxiliarModal]);

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
    const fetchVoceros = async () => {
      setLoading(true);
      const { data, error } = await supabase
        .from('voceros')
        .select('*')
        .eq('id_consejo', consejoId)
        .order('unidad', { ascending: true });
      if (error) console.error('Error cargando voceros:', error);
      else setVoceros(data || []);
      setLoading(false);
    };
    fetchVoceros();
  }, [consejoId]);

  useEffect(() => {
    const auxExists = voceros.some(v => v.es_auxiliar === true);
    setHasAuxiliar(auxExists);
  }, [voceros, consejoId]);

  const filteredVoceros = selectedUnit === "TODAS" ? voceros : voceros.filter(v => v.unidad === selectedUnit);
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = filteredVoceros.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(filteredVoceros.length / itemsPerPage);
  const handlePageChange = (page: number) => setCurrentPage(page);

  if (loading) return <div className="flex justify-center p-8"><Loader2 className="animate-spin text-brand-primary" size={28} /></div>;

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
    <div className="space-y-4 max-sm:space-y-2">
      <div>
        <h2 className="text-base font-black text-slate-800 italic uppercase tracking-tighter flex items-center gap-2 max-sm:text-sm max-sm:gap-1">
          <Shield className="h-5 w-5 text-brand-primary max-sm:h-4 max-sm:w-4" /> Listado de Vocerías
        </h2>
        <p className="text-[9px] text-slate-400 font-bold uppercase tracking-[0.15em] mt-0.5 max-sm:text-[8px]">
          Nombre y Responsabilidad de los líderes de las 4 unidades principales
        </p>
      </div>

      <div className="flex flex-wrap gap-1.5 mb-3 max-sm:gap-1 max-sm:mb-2">
        <button onClick={() => { setSelectedUnit("TODAS"); setCurrentPage(1); }} className={cn("px-3 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-wider max-sm:px-2 max-sm:py-1 max-sm:text-[8px]", selectedUnit === "TODAS" ? "bg-brand-primary text-white" : "bg-white text-slate-400 border border-gray-100 hover:bg-gray-50")}>Todas</button>
        {units.map(unit => <button key={unit} onClick={() => { setSelectedUnit(unit); setCurrentPage(1); }} className={cn("px-3 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-wider max-sm:px-2 max-sm:py-1 max-sm:text-[8px]", selectedUnit === unit ? "bg-brand-primary text-white" : "bg-white text-slate-400 border border-gray-100 hover:bg-gray-50")}>{unit}</button>)}
      </div>

      <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden max-sm:rounded-lg">
        <div className="p-4 border-b border-gray-100 flex items-center justify-between bg-gray-50/30 max-sm:p-2 max-sm:flex-wrap max-sm:gap-2">
          <div><h3 className="text-sm font-black text-slate-800 italic max-sm:text-xs">Estructura de Vocerías</h3><p className="text-[9px] text-slate-400 font-bold uppercase mt-0.5 max-sm:text-[8px]">Registro de {filteredVoceros.length} Líderes Comunitarios</p></div>
          <button onClick={() => { resetForm(); setIsRegisterOpen(true); }} className="flex items-center gap-1.5 rounded-xl bg-brand-primary px-4 py-2 text-[9px] font-black text-white shadow-md hover:scale-105 transition-all uppercase tracking-wider max-sm:px-2 max-sm:py-1 max-sm:text-[8px] max-sm:gap-1"><Plus className="h-3.5 w-3.5 max-sm:h-3 max-sm:w-3" /> Registrar Vocero</button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50/50 border-b border-gray-100 text-[9px] font-black text-slate-400 uppercase tracking-[0.15em] max-sm:text-[8px]">
                <th className="px-4 py-3 max-sm:px-2 max-sm:py-2">Vocero</th>
                <th className="px-4 py-3 max-sm:px-2 max-sm:py-2">Instancia</th>
                <th className="px-4 py-3 max-sm:px-2 max-sm:py-2">Comité</th>
                <th className="px-4 py-3 max-sm:px-2 max-sm:py-2">Tipo</th>
                <th className="px-4 py-3 max-sm:px-2 max-sm:py-2">Formación</th>
                <th className="px-3 py-3 text-center max-sm:px-2 max-sm:py-2">Contacto</th>
                <th className="px-4 py-3 text-right max-sm:px-2 max-sm:py-2">RIF</th>
                <th className="px-4 py-3 text-right max-sm:px-2 max-sm:py-2">Cédula</th>
                <th className="px-4 py-3 text-right max-sm:px-2 max-sm:py-2">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {currentItems.map(v => (
                <tr key={v.id_vocero} className="hover:bg-gray-50/80 transition-colors">
                  <td className="px-4 py-3 max-sm:px-2 max-sm:py-2">
                    <p className="text-xs font-black text-slate-800 max-sm:text-[10px]">{v.nombre_completo}</p>
                    <p className="text-[9px] text-slate-400 font-bold uppercase tracking-tighter max-sm:text-[8px]">C.I: {v.cedula}</p>
                  </td>
                  <td className="px-4 py-3 max-sm:px-2 max-sm:py-2"><p className="text-[9px] font-black text-slate-500 uppercase leading-tight max-sm:text-[8px]">{v.unidad}</p></td>
                  <td className="px-3 py-3 max-sm:px-2 max-sm:py-2">
                    {v.comite ? (
                      <p className="text-[8px] font-bold text-slate-600 uppercase leading-tight whitespace-normal break-word max-w-32 max-sm:text-[7px]" title={v.comite}>{v.comite}</p>
                    ) : <span className="text-[8px] text-slate-400 italic max-sm:text-[7px]">—</span>}
                  </td>
                  <td className="px-4 py-3 max-sm:px-2 max-sm:py-2"><span className={cn("text-[8px] font-black px-2 py-0.5 rounded-full uppercase border max-sm:text-[7px] max-sm:px-1", v.tipo === 'Principal' ? 'bg-indigo-50 text-indigo-600 border-indigo-100' : 'bg-slate-50 text-slate-600 border-slate-100')}>{v.tipo}</span></td>
                  <td className="px-4 py-3 max-sm:px-2 max-sm:py-2"><p className="text-[10px] font-bold text-slate-700 italic max-sm:text-[9px]">{v.profesion || '—'}</p><p className="text-[8px] text-slate-400 font-black uppercase tracking-wider max-sm:text-[7px]">{v.grado_instruccion || '—'}</p></td>
                  <td className="px-3 py-3 text-[10px] font-bold text-slate-500 text-center max-w-16 truncate max-sm:px-2 max-sm:py-2 max-sm:text-[9px]">{v.telefono || '—'}</td>
                  <td className="px-4 py-3 text-right max-sm:px-2 max-sm:py-2">
                    <div className="flex flex-col items-end gap-1">
                      {v.rif_url ? (
                        <>
                          <button onClick={() => handleViewFile(v.rif_url)} className="inline-flex items-center justify-center h-7 w-7 rounded-lg bg-emerald-50 text-emerald-500 border border-emerald-100 hover:bg-emerald-100 transition-all max-sm:h-6 max-sm:w-6"><Eye className="h-3.5 w-3.5 max-sm:h-3 max-sm:w-3" /></button>
                          <RifStatusBadge fechaVencimiento={v.rif_fecha_vencimiento} />
                        </>
                      ) : <div className="inline-flex items-center justify-center h-7 w-7 rounded-lg bg-rose-50 text-rose-500 border border-rose-100 max-sm:h-6 max-sm:w-6"><AlertCircle className="h-3.5 w-3.5 max-sm:h-3 max-sm:w-3" /></div>}
                    </div>
                  </td>
                  <td className="px-4 py-3 text-right max-sm:px-2 max-sm:py-2">
                    {v.cedula_url ? <button onClick={() => handleViewFile(v.cedula_url)} className="inline-flex items-center justify-center h-7 w-7 rounded-lg bg-emerald-50 text-emerald-500 border border-emerald-100 hover:bg-emerald-100 transition-all max-sm:h-6 max-sm:w-6"><Eye className="h-3.5 w-3.5 max-sm:h-3 max-sm:w-3" /></button> : <div className="inline-flex items-center justify-center h-7 w-7 rounded-lg bg-rose-50 text-rose-500 border border-rose-100 max-sm:h-6 max-sm:w-6"><AlertCircle className="h-3.5 w-3.5 max-sm:h-3 max-sm:w-3" /></div>}
                  </td>
                  <td className="px-4 py-3 text-right max-sm:px-2 max-sm:py-2"><div className="flex gap-1.5 justify-end max-sm:gap-1">
                    <button onClick={() => handleEditClick(v)} className="p-1 text-slate-400 hover:text-brand-primary transition-colors"><Edit className="h-3.5 w-3.5 max-sm:h-3 max-sm:w-3" /></button>
                    <button onClick={() => handleDelete(v.id_vocero, v.rif_url, v.cedula_url)} className="p-1 text-slate-400 hover:text-rose-500 transition-colors"><Trash2 className="h-3.5 w-3.5 max-sm:h-3 max-sm:w-3" /></button>
                    {isOwner && !hasAuxiliar && !v.es_auxiliar && v.cedula !== ownerCedula && (
                      <button onClick={() => handleOpenAuxiliarModal(v)} className="p-1 text-slate-400 hover:text-brand-primary transition-colors" title="Asignar como auxiliar">
                        <UserPlus className="h-3.5 w-3.5 max-sm:h-3 max-sm:w-3" />
                      </button>
                    )}
                  </div>
                  </td>
                </tr>
              ))}
              {filteredVoceros.length === 0 && <tr><td colSpan={9} className="text-center py-8 text-slate-400 text-xs max-sm:py-4">No hay voceros registrados</td></tr>}
            </tbody>
          </table>
        </div>

        {totalPages > 1 && (
          <div className="p-3 border-t border-gray-100 bg-gray-50/30 flex items-center justify-between max-sm:p-2">
            <p className="text-[9px] font-bold text-slate-400 uppercase max-sm:text-[8px]">Página {currentPage} de {totalPages}</p>
            <div className="flex gap-1.5 max-sm:gap-1"><button onClick={() => handlePageChange(currentPage - 1)} disabled={currentPage === 1} className="p-1.5 rounded-lg bg-white border border-gray-100 text-slate-400 disabled:opacity-50 max-sm:p-1"><ChevronLeft className="h-3.5 w-3.5 max-sm:h-3 max-sm:w-3" /></button><div className="flex gap-1 max-sm:gap-0.5">{Array.from({ length: totalPages }, (_, i) => i + 1).map(num => <button key={num} onClick={() => handlePageChange(num)} className={cn("h-6 w-6 rounded-lg text-[9px] font-black max-sm:h-5 max-sm:w-5 max-sm:text-[8px]", currentPage === num ? "bg-brand-primary text-white" : "bg-white text-slate-400 border")}>{num}</button>)}</div><button onClick={() => handlePageChange(currentPage + 1)} disabled={currentPage === totalPages} className="p-1.5 rounded-lg bg-white border border-gray-100 text-slate-400 disabled:opacity-50 max-sm:p-1"><ChevronRight className="h-3.5 w-3.5 max-sm:h-3 max-sm:w-3" /></button></div>
          </div>
        )}
      </div>

      {/* MODAL DE REGISTRO */}
      <AnimatePresence>
        {isRegisterOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setIsRegisterOpen(false)} className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" />
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="relative w-full max-w-2xl bg-white rounded-2xl shadow-2xl overflow-hidden max-h-[85vh] overflow-y-auto">
              <div className="p-6 border-b border-gray-50 flex justify-between">
                <h4 className="text-lg font-black text-slate-800 italic">Nuevo Vocero</h4>
                <button onClick={() => setIsRegisterOpen(false)} className="p-1.5 rounded-lg hover:bg-gray-100"><X className="h-4 w-4 text-slate-400" /></button>
              </div>
              <form onSubmit={handleRegister} className="p-6 space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1.5 block">Nombre</label>
                    <input name="nombre" value={formData.nombre} onChange={handleInputChange} className="w-full p-3 rounded-xl bg-gray-50 border border-gray-100 focus:border-brand-primary focus:ring-1 focus:ring-brand-primary/20 transition-all text-xs font-semibold" required />
                  </div>
                  <div>
                    <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1.5 block">Apellido</label>
                    <input name="apellido" value={formData.apellido} onChange={handleInputChange} className="w-full p-3 rounded-xl bg-gray-50 border border-gray-100 focus:border-brand-primary focus:ring-1 focus:ring-brand-primary/20 transition-all text-xs font-semibold" required />
                  </div>
                  <div>
                    <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1.5 block">Cédula <span className="text-rose-500">*</span></label>
                    <div className="flex gap-2">
                      <select value={formData.cedulaTipo} onChange={(e) => setFormData({ ...formData, cedulaTipo: e.target.value })} className="w-16 p-3 rounded-xl bg-gray-50 border border-gray-100 focus:border-brand-primary focus:ring-1 focus:ring-brand-primary/20 text-xs font-semibold">
                        <option value="V">V-</option>
                        <option value="E">E-</option>
                      </select>
                      <input type="text" value={formData.cedulaNumero} onChange={handleCedulaNumeroChange} placeholder="12345678" maxLength={8} className="w-32 p-3 rounded-xl bg-gray-50 border border-gray-100 focus:border-brand-primary focus:ring-1 focus:ring-brand-primary/20 transition-all text-xs font-semibold" required />
                    </div>
                    {!validateCedula(formData.cedulaTipo, formData.cedulaNumero) && formData.cedulaNumero && (
                      <p className="text-[8px] text-rose-500 mt-1">Debe tener entre 7 y 8 dígitos</p>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <div><label className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1.5 block">Teléfono</label><div className="flex gap-1.5"><select value={formData.operadora} onChange={(e) => handleOperadoraChange(e.target.value)} className="w-16 p-2 rounded-lg bg-gray-50 border border-gray-100 focus:border-brand-primary text-xs font-semibold"><option value="">Cód</option>{operadoras.map(op => <option key={op.codigo} value={op.codigo}>{op.codigo}</option>)}</select><input name="telefono" value={formData.telefono} onChange={handleTelefonoChange} placeholder="1234567" className="w-32 p-3 rounded-lg bg-gray-50 border border-gray-100 focus:border-brand-primary focus:ring-1 focus:ring-brand-primary/20 transition-all text-xs font-semibold" /></div></div>
                  <div><label className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1.5 block">Unidad</label><select name="unidad" value={formData.unidad} onChange={handleInputChange} className="w-full p-3 rounded-xl bg-gray-50 border border-gray-100 focus:border-brand-primary focus:ring-1 focus:ring-brand-primary/20 transition-all text-xs font-semibold">{units.map(u => <option key={u}>{u}</option>)}</select></div>
                  <div><label className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1.5 block">Tipo</label><select name="tipo" value={formData.tipo} onChange={handleInputChange} className="w-full p-3 rounded-xl bg-gray-50 border border-gray-100 focus:border-brand-primary focus:ring-1 focus:ring-brand-primary/20 transition-all text-xs font-semibold"><option>Principal</option><option>Suplente</option></select></div>
                </div>

                {showComiteField && (
                  <div className="relative">
                    <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1.5 block">Comité</label>
                    <div className="relative">
                      <input type="text" value={comiteSearchTerm || formData.comite || ''} onChange={(e) => { setComiteSearchTerm(e.target.value); setShowComiteDropdown(true); if (e.target.value === '') setFormData(prev => ({ ...prev, comite: '' })); }} onFocus={() => { setShowComiteDropdown(true); setComiteSearchTerm(formData.comite || ''); }} onBlur={() => setTimeout(() => setShowComiteDropdown(false), 200)} onKeyDown={handleComiteKeyDown} placeholder="Buscar o seleccionar comité..." className="w-full p-3 rounded-xl bg-gray-50 border border-gray-100 focus:border-brand-primary focus:ring-1 focus:ring-brand-primary/20 transition-all text-xs font-semibold" required />
                      {showComiteDropdown && filteredComites.length > 0 && (<div className="absolute z-10 mt-1 w-full max-h-48 overflow-y-auto bg-white border border-gray-200 rounded-xl shadow-lg">{filteredComites.map((comite, idx) => (<div key={comite} className={`px-4 py-2 text-xs font-medium cursor-pointer hover:bg-brand-primary/10 ${idx === comiteDropdownIndex ? 'bg-brand-primary/20' : ''}`} onClick={() => selectComite(comite)} onMouseEnter={() => setComiteDropdownIndex(idx)}>{comite}</div>))}</div>)}
                    </div>
                    {!formData.comite && (comiteSearchTerm && filteredComites.length === 0) && (<p className="text-[8px] text-amber-600 mt-1">No se encontraron comités. Escribe el nombre exacto para crearlo.</p>)}
                  </div>
                )}

                <div className="grid grid-cols-3 gap-4">
                  <div><label className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1.5 block">Profesión</label><input name="profesion" value={formData.profesion} onChange={handleInputChange} className="w-full p-3 rounded-xl bg-gray-50 border border-gray-100 focus:border-brand-primary focus:ring-1 focus:ring-brand-primary/20 transition-all text-xs font-semibold" /></div>
                  <div><label className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1.5 block">Grado</label><select name="grado_instruccion" value={formData.grado_instruccion} onChange={handleInputChange} className="w-full p-3 rounded-xl bg-gray-50 border border-gray-100 focus:border-brand-primary focus:ring-1 focus:ring-brand-primary/20 transition-all text-xs font-semibold"><option value="">Seleccione</option>{gradosInstruccion.map(g => <option key={g}>{g}</option>)}</select></div>
                  <div><label className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1.5 block">Vencimento RIF</label><input type="date" value={manualVencimiento} onChange={(e) => setManualVencimiento(e.target.value)} className="w-full p-3 rounded-xl bg-gray-50 border border-gray-100 focus:border-brand-primary focus:ring-1 focus:ring-brand-primary/20 transition-all text-xs font-semibold" /></div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div><label className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1.5 block">RIF</label><input type="file" ref={rifFileInputRef} className="hidden" accept=".pdf,.jpg,.png" onChange={handleRifFileChange} /><button type="button" onClick={triggerRifFileUpload} className="w-full p-3 bg-gray-50 border border-gray-100 rounded-xl hover:border-gray-200 text-xs font-semibold text-slate-600 flex items-center justify-center gap-1.5 transition-all"><Upload className="h-3 w-3" />{rifFile ? 'Cambiar' : 'Subir'} RIF</button>{rifFile && <p className="text-[8px] text-slate-500 mt-1 truncate">{rifFile.name}</p>}</div>
                  <div><label className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1.5 block">Cédula</label><input type="file" ref={cedulaFileInputRef} className="hidden" accept=".pdf,.jpg,.png" onChange={handleCedulaFileChange} /><button type="button" onClick={triggerCedulaFileUpload} className="w-full p-3 bg-gray-50 border border-gray-100 rounded-xl hover:border-gray-200 text-xs font-semibold text-slate-600 flex items-center justify-center gap-1.5 transition-all"><Upload className="h-3 w-3" />{cedulaFile ? 'Cambiar' : 'Subir'} Cédula</button>{cedulaFile && <p className="text-[8px] text-slate-500 mt-1 truncate">{cedulaFile.name}</p>}</div>
                </div>

                <button type="submit" disabled={saving || !validateCedula(formData.cedulaTipo, formData.cedulaNumero) || !formData.nombre.trim() || !formData.apellido.trim()} className="w-full py-3.5 rounded-xl bg-linear-to-r from-brand-primary to-brand-primary/90 text-white text-xs font-black uppercase shadow-lg hover:shadow-xl hover:from-brand-primary/90 transition-all duration-300 hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none">{saving ? <Loader2 className="animate-spin mx-auto h-4 w-4" /> : "Completar"}</button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* MODAL DE EDICIÓN */}
      <AnimatePresence>
        {isEditOpen && editingVocero && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => { setIsEditOpen(false); resetForm(); }} className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" />
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="relative w-full max-w-2xl bg-white rounded-2xl shadow-2xl overflow-hidden max-h-[85vh] overflow-y-auto">
              <div className="p-6 border-b border-gray-50 flex justify-between">
                <h4 className="text-lg font-black text-slate-800 italic">Editar Vocero</h4>
                <button onClick={() => { setIsEditOpen(false); resetForm(); }} className="p-1.5 rounded-lg hover:bg-gray-100"><X className="h-4 w-4 text-slate-400" /></button>
              </div>
              <form onSubmit={handleUpdate} className="p-6 space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1.5 block">Nombre</label>
                    <input name="nombre" value={formData.nombre} disabled className="w-full p-3 rounded-xl bg-gray-100 border border-gray-200 text-slate-500 cursor-not-allowed text-xs font-semibold" />
                  </div>
                  <div>
                    <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1.5 block">Apellido</label>
                    <input name="apellido" value={formData.apellido} disabled className="w-full p-3 rounded-xl bg-gray-100 border border-gray-200 text-slate-500 cursor-not-allowed text-xs font-semibold" />
                  </div>
                  <div>
                    <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1.5 block">Cédula</label>
                    <div className="flex gap-2">
                      <select value={formData.cedulaTipo} disabled className="w-15 p-3 rounded-xl bg-gray-100 border border-gray-200 text-slate-500 cursor-not-allowed text-xs font-semibold">
                        <option value="V">V-</option>
                        <option value="E">E-</option>
                      </select>
                      <input type="text" value={formData.cedulaNumero} disabled className="w-32 p-3 rounded-xl bg-gray-100 border border-gray-200 text-slate-500 cursor-not-allowed text-xs font-semibold" />
                    </div>
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-4">
                  <div><label className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1.5 block">Teléfono</label><div className="flex gap-1.5"><select value={formData.operadora} onChange={(e) => handleOperadoraChange(e.target.value)} className="w-16 p-2 rounded-lg bg-gray-50 border border-gray-100 focus:border-brand-primary text-xs font-semibold"><option value="">Cód</option>{operadoras.map(op => <option key={op.codigo} value={op.codigo}>{op.codigo}</option>)}</select><input name="telefono" value={formData.telefono} onChange={handleTelefonoChange} placeholder="1234567" className="w-32 p-3 rounded-lg bg-gray-50 border border-gray-100 focus:border-brand-primary focus:ring-1 focus:ring-brand-primary/20 transition-all text-xs font-semibold" /></div></div>
                  <div><label className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1.5 block">Unidad</label><select name="unidad" value={formData.unidad} onChange={handleInputChange} className="w-full p-3 rounded-xl bg-gray-50 border border-gray-100 focus:border-brand-primary focus:ring-1 focus:ring-brand-primary/20 transition-all text-xs font-semibold">{units.map(u => <option key={u}>{u}</option>)}</select></div>
                  <div><label className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1.5 block">Tipo</label><select name="tipo" value={formData.tipo} onChange={handleInputChange} className="w-full p-3 rounded-xl bg-gray-50 border border-gray-100 focus:border-brand-primary focus:ring-1 focus:ring-brand-primary/20 transition-all text-xs font-semibold"><option>Principal</option><option>Suplente</option></select></div>
                </div>
                {showComiteField && (
                  <div className="relative">
                    <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1.5 block">Comité</label>
                    <div className="relative">
                      <input type="text" value={comiteSearchTerm || formData.comite || ''} onChange={(e) => { setComiteSearchTerm(e.target.value); setShowComiteDropdown(true); if (e.target.value === '') setFormData(prev => ({ ...prev, comite: '' })); }} onFocus={() => { setShowComiteDropdown(true); setComiteSearchTerm(formData.comite || ''); }} onBlur={() => setTimeout(() => setShowComiteDropdown(false), 200)} onKeyDown={handleComiteKeyDown} placeholder="Buscar o seleccionar comité..." className="w-full p-3 rounded-xl bg-gray-50 border border-gray-100 focus:border-brand-primary focus:ring-1 focus:ring-brand-primary/20 transition-all text-xs font-semibold" required />
                      {showComiteDropdown && filteredComites.length > 0 && (<div className="absolute z-10 mt-1 w-full max-h-48 overflow-y-auto bg-white border border-gray-200 rounded-xl shadow-lg">{filteredComites.map((comite, idx) => (<div key={comite} className={`px-4 py-2 text-xs font-medium cursor-pointer hover:bg-brand-primary/10 ${idx === comiteDropdownIndex ? 'bg-brand-primary/20' : ''}`} onClick={() => selectComite(comite)} onMouseEnter={() => setComiteDropdownIndex(idx)}>{comite}</div>))}</div>)}
                    </div>
                  </div>
                )}
                <div className="grid grid-cols-3 gap-4">
                  <div><label className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1.5 block">Profesión</label><input name="profesion" value={formData.profesion} onChange={handleInputChange} className="w-full p-3 rounded-xl bg-gray-50 border border-gray-100 focus:border-brand-primary focus:ring-1 focus:ring-brand-primary/20 transition-all text-xs font-semibold" /></div>
                  <div><label className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1.5 block">Grado</label><select name="grado_instruccion" value={formData.grado_instruccion} onChange={handleInputChange} className="w-full p-3 rounded-xl bg-gray-50 border border-gray-100 focus:border-brand-primary focus:ring-1 focus:ring-brand-primary/20 transition-all text-xs font-semibold"><option value="">Seleccione</option>{gradosInstruccion.map(g => <option key={g}>{g}</option>)}</select></div>
                  <div><label className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1.5 block">RIF Vencimiento</label><input type="date" value={manualVencimiento} onChange={(e) => setManualVencimiento(e.target.value)} className="w-full p-3 rounded-xl bg-gray-50 border border-gray-100 focus:border-brand-primary focus:ring-1 focus:ring-brand-primary/20 transition-all text-xs font-semibold" /></div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="grid grid-cols-2 gap-4">
                    {/* RIF */}
                    <div>
                      <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1.5 block">RIF</label>
                      {existingRifUrl && !rifFile && (
                        <div className="flex items-center gap-2 mb-2">
                          <button type="button" onClick={() => handleViewFile(existingRifUrl)} className="text-xs font-semibold text-brand-primary hover:underline">Ver actual</button>
                          <span className="text-[8px] text-slate-400">|</span>
                          <button type="button" onClick={triggerRifFileUpload} className="text-xs font-semibold text-slate-500 hover:text-brand-primary">Reemplazar</button>
                        </div>
                      )}
                      <input type="file" ref={rifFileInputRef} className="hidden" accept=".pdf,.jpg,.png" onChange={handleRifFileChange} />
                      {!existingRifUrl && !rifFile && (
                        <button type="button" onClick={triggerRifFileUpload} className="w-full p-3 bg-gray-50 border border-gray-100 rounded-xl hover:border-gray-200 text-xs font-semibold text-slate-600 flex items-center justify-center gap-1.5 transition-all">
                          <Upload className="h-3 w-3" /> Subir RIF
                        </button>
                      )}
                      {rifFile && <p className="text-[8px] text-slate-500 mt-1 truncate">{rifFile.name}</p>}
                    </div>

                    {/* Cédula */}
                    <div>
                      <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1.5 block">Cédula</label>
                      {existingCedulaUrl && !cedulaFile && (
                        <div className="flex items-center gap-2 mb-2">
                          <button type="button" onClick={() => handleViewFile(existingCedulaUrl)} className="text-xs font-semibold text-brand-primary hover:underline">Ver actual</button>
                          <span className="text-[8px] text-slate-400">|</span>
                          <button type="button" onClick={triggerCedulaFileUpload} className="text-xs font-semibold text-slate-500 hover:text-brand-primary">Reemplazar</button>
                        </div>
                      )}
                      <input type="file" ref={cedulaFileInputRef} className="hidden" accept=".pdf,.jpg,.png" onChange={handleCedulaFileChange} />
                      {!existingCedulaUrl && !cedulaFile && (
                        <button type="button" onClick={triggerCedulaFileUpload} className="w-full p-3 bg-gray-50 border border-gray-100 rounded-xl hover:border-gray-200 text-xs font-semibold text-slate-600 flex items-center justify-center gap-1.5 transition-all">
                          <Upload className="h-3 w-3" /> Subir Cédula
                        </button>
                      )}
                      {cedulaFile && <p className="text-[8px] text-slate-500 mt-1 truncate">{cedulaFile.name}</p>}
                    </div>
                  </div>
                </div>
                <button type="submit" disabled={saving || !validateCedula(formData.cedulaTipo, formData.cedulaNumero)} className="w-full py-3.5 rounded-xl bg-linear-to-r from-brand-primary to-brand-primary/90 text-white text-xs font-black uppercase shadow-lg hover:shadow-xl hover:from-brand-primary/90 transition-all duration-300 hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none">{saving ? <Loader2 className="animate-spin mx-auto h-4 w-4" /> : "Actualizar"}</button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Modal de asignación auxiliar */}
      <AnimatePresence>
        {showAuxiliarModal && selectedVocero && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="fixed inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setShowAuxiliarModal(false)} />
            <div className="relative w-full max-w-md bg-white rounded-2xl shadow-2xl p-6">
              <h3 className="text-xl font-black text-slate-800 uppercase tracking-wider mb-4">Asignar como Vocero Auxiliar</h3>
              <p className="text-sm text-slate-600 mb-4">Se creará una cuenta para <strong>{selectedVocero.nombre_completo}</strong></p>
              <div className="space-y-4">
                <div><label className="text-[10px] font-black text-slate-500 uppercase">Correo Electrónico *</label><input type="email" value={auxEmail} onChange={(e) => setAuxEmail(e.target.value)} className="w-full p-3 rounded-xl bg-gray-50 border border-gray-200" /></div>
                <div><label className="text-[10px] font-black text-slate-500 uppercase">Contraseña *</label><input type="password" value={auxPassword} onChange={(e) => setAuxPassword(e.target.value)} className="w-full p-3 rounded-xl bg-gray-50 border border-gray-200" /></div>
                <div><label className="text-[10px] font-black text-slate-500 uppercase">Confirmar Contraseña *</label><input type="password" value={auxConfirm} onChange={(e) => setAuxConfirm(e.target.value)} className="w-full p-3 rounded-xl bg-gray-50 border border-gray-200" /></div>
                <div className="flex gap-3 pt-4">
                  <button onClick={handleCreateAuxiliar} disabled={saving || !auxEmail || !auxPassword || auxPassword !== auxConfirm} className="flex-1 py-3 bg-brand-primary text-white rounded-xl text-sm font-black uppercase disabled:opacity-50">
                    {saving ? <Loader2 className="animate-spin mx-auto h-4 w-4" /> : "Crear y Asignar"}
                  </button>
                  <button onClick={() => setShowAuxiliarModal(false)} className="px-6 py-3 border border-gray-200 rounded-xl text-sm font-black">Cancelar</button>
                </div>
              </div>
            </div>
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

const getSignedUrlFromPublicUrl = async (storedPath: string | null): Promise<string | null> => {
  if (!storedPath) return null;

  let cleanPath = storedPath;
  let bucket = null;

  if (storedPath.includes('http')) {
    const buckets = ['documentos_consejos', 'profile-photos'];
    for (const b of buckets) {
      const searchString = `/storage/v1/object/public/${b}/`;
      if (storedPath.includes(searchString)) {
        bucket = b;
        cleanPath = storedPath.substring(storedPath.indexOf(searchString) + searchString.length);
        break;
      }
    }
  } else {
    if (/^\d+\/(cedula|rif|avatar)\//.test(storedPath)) {
      bucket = 'profile-photos';
    } else if (/^\d+\/voceros\//.test(storedPath)) {
      bucket = 'documentos_consejos';
    } else {
      bucket = 'documentos_consejos';
    }
  }

  if (!bucket) {
    console.error('No se pudo determinar el bucket para la ruta:', storedPath);
    return null;
  }

  cleanPath = cleanPath.replace(/^\/+/, '');
  const { data, error } = await supabase.storage.from(bucket).createSignedUrl(cleanPath, 3600);
  if (error) {
    console.error(`Error firmando (bucket: ${bucket}, path: ${cleanPath}):`, error.message);
    return null;
  }
  return data.signedUrl;
};