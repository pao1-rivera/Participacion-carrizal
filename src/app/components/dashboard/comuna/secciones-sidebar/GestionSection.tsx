"use client";

import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Plus, X, Upload, CheckCircle2, AlertCircle, ChevronRight, ChevronLeft,
  Shield, Eye, Loader2, Trash2, Edit, FileText, Calendar, Clock, Landmark, 
  Users, Building2, UserPlus, FileCheck
} from "lucide-react";
import { cn } from "@/app/lib/utils";
import { supabase } from "@/app/lib/supabaseClient";
import { useAuth } from "@/context/AuthContext";
import { AlertModal } from "@/app/components/AlertModal";

// ==================== TIPOS ====================
interface ResponsableGestion {
  id_responsable: number;
  nombre_g: string;
  apellido_g: string;
  cedula: string;
  unidad: string;
  tipo: 'Principal' | 'Suplente';
  profesion: string | null;
  grado_instruccion: string | null;
  telefono: string | null;
  rif_url: string | null;
  cedula_url: string | null;
  rif_fecha_vencimiento: string | null;
  es_auxiliar?: boolean;
  id_usuario?: string;
}

// ==================== FUNCIONES AUXILIARES (sin cambios) ====================
const getSignedUrlFromPublicUrl = async (pathOrUrl: string | null): Promise<string | null> => {
  if (!pathOrUrl) return null;
  const buckets = ['documentos_comuna', 'profile-photos'];
  let relativePath = pathOrUrl;
  let bucketName = null;

  for (const bucket of buckets) {
    const searchString = `/storage/v1/object/public/${bucket}/`;
    if (pathOrUrl.includes(searchString)) {
      bucketName = bucket;
      const pathStart = pathOrUrl.indexOf(searchString);
      if (pathStart !== -1) {
        relativePath = pathOrUrl.substring(pathStart + searchString.length);
      }
      break;
    }
  }

  if (!bucketName) {
    if (pathOrUrl.match(/^\d+\/(cedula|rif|avatar)\//)) {
      bucketName = 'profile-photos';
    } else if (pathOrUrl.match(/^\d+\/responsables\//)) {
      bucketName = 'documentos_comuna';
    } else {
      bucketName = 'documentos_comuna';
    }
    relativePath = relativePath.replace(/^\/+/, '');
  }

  const { data, error } = await supabase.storage
    .from(bucketName)
    .createSignedUrl(relativePath, 3600);

  if (error) {
    console.error(`Error firmando (bucket: ${bucketName}, path: ${relativePath}):`, error.message);
    return null;
  }
  return data.signedUrl;
};

const getDaysUntilExpiration = (fechaVencimiento: string | null): number | null => {
  if (!fechaVencimiento) return null;
  const [anio, mes, dia] = fechaVencimiento.split('-');
  const date = new Date(parseInt(anio), parseInt(mes) - 1, parseInt(dia));
  if (isNaN(date.getTime())) return null;
  const hoy = new Date();
  hoy.setHours(0, 0, 0, 0);
  const diff = date.getTime() - hoy.getTime();
  return Math.ceil(diff / (1000 * 60 * 60 * 24));
};

const RifStatusBadge = ({ fechaVencimiento }: { fechaVencimiento: string | null }) => {
  const dias = getDaysUntilExpiration(fechaVencimiento);
  if (dias === null) return null;
  if (dias < 0) return <span className="text-[8px] font-black px-1.5 py-0.5 rounded-full bg-rose-100 text-rose-700">VENCIDO</span>;
  if (dias <= 30) return <span className="text-[8px] font-black px-1.5 py-0.5 rounded-full bg-amber-100 text-amber-700">Vence en {dias} días</span>;
  return <span className="text-[8px] font-black px-1.5 py-0.5 rounded-full bg-emerald-100 text-emerald-700">Vigente</span>;
};

// ==================== COMPONENTE PRINCIPAL ====================
export const GestionSection = () => {
  const { user } = useAuth();
  const [comunaId, setComunaId] = useState<number | null>(null);
  const [noComuna, setNoComuna] = useState(false);
  const [responsables, setResponsables] = useState<ResponsableGestion[]>([]);
  const [loading, setLoading] = useState(true);
  const [isRegisterOpen, setIsRegisterOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<ResponsableGestion | null>(null);
  const [selectedUnit, setSelectedUnit] = useState<string>("TODAS");
  const [currentPage, setCurrentPage] = useState(1);
  const [saving, setSaving] = useState(false);

  // Estado para el modal de alerta
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
  const [showAuxiliarModal, setShowAuxiliarModal] = useState(false);
  const [selectedAuxResponsable, setSelectedAuxResponsable] = useState<ResponsableGestion | null>(null);
  const [auxEmail, setAuxEmail] = useState('');
  const [auxPassword, setAuxPassword] = useState('');
  const [auxConfirm, setAuxConfirm] = useState('');
  const [auxTelefono, setAuxTelefono] = useState('');

  const [hasAuxiliar, setHasAuxiliar] = useState(false);
  const [userCedula, setUserCedula] = useState('');
  const [isOwner, setIsOwner] = useState(false);

  // ==================== OCULTAR SIDEBAR CUANDO ALGÚN MODAL ESTÁ ABIERTO ====================
 useEffect(() => {
  if (isRegisterOpen || isEditOpen || showAuxiliarModal || modalState.isOpen) {
    document.body.classList.add('modal-open');
  } else {
    document.body.classList.remove('modal-open');
  }
  return () => document.body.classList.remove('modal-open');
}, [isRegisterOpen, isEditOpen, showAuxiliarModal, modalState.isOpen]);

  // Estados del formulario (sin cambios)
  const [formData, setFormData] = useState({
    nombre: '',
    apellido: '',
    cedulaTipo: 'V',
    cedulaNumero: '',
    unidad: 'Planificación Comunal',
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
  const [manualVencimiento, setManualVencimiento] = useState<string>('');

  const rifFileInputRef = useRef<HTMLInputElement>(null);
  const cedulaFileInputRef = useRef<HTMLInputElement>(null);

  const itemsPerPage = 5;
  const units = [
    "Parlamento Comunal",
    "Planificación Comunal",
    "Economía Comunal",
    "Consejo Ejecutivo",
    "Contraloría Comunitaria",
    "Banco de la Comuna",
  ];

  const gradosInstruccion = [
    "Sin Instrucción", "Primaria", "Secundaria", "Técnico Medio",
    "Técnico Superior", "Universitario", "Postgrado"
  ];

  const operadoras = [
    { codigo: '0424', nombre: 'Movistar' },
    { codigo: '0414', nombre: 'Digitel' },
    { codigo: '0412', nombre: 'Movilnet' },
    { codigo: '0426', nombre: 'Movistar' },
    { codigo: '0416', nombre: 'Digitel' },
  ];

  useEffect(() => {
    const fetchUserData = async () => {
      if (!user?.id) return;
      const { data: perfil } = await supabase
        .from('perfil_usuario')
        .select('cedula')
        .eq('id_usuario', user.id)
        .single();
      if (perfil) setUserCedula(perfil.cedula);
      
      const { data: comuna } = await supabase
        .from('datos_comuna')
        .select('id_usuario')
        .eq('id_comuna', comunaId)
        .single();
      setIsOwner(comuna?.id_usuario === user.id);
    };
    if (comunaId) fetchUserData();
  }, [user, comunaId]);

  useEffect(() => {
    const aux = responsables.some(r => r.es_auxiliar === true);
    setHasAuxiliar(aux);
  }, [responsables]);

  const handleOpenAuxiliarModal = (responsable: ResponsableGestion) => {
    setSelectedAuxResponsable(responsable);
    setAuxEmail('');
    setAuxPassword('');
    setAuxConfirm('');
    setAuxTelefono(responsable.telefono || '');
    setShowAuxiliarModal(true);
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

  // Obtener comuna (dueño o auxiliar)
  useEffect(() => {
    const fetchComunaId = async () => {
      if (!user?.id) return;
      const { data, error } = await supabase
        .from('datos_comuna')
        .select('id_comuna, id_usuario')
        .or(`id_usuario.eq.${user.id},id_usuario_auxiliar.eq.${user.id}`)
        .maybeSingle();
      if (error) console.error('Error obteniendo comuna:', error);
      else if (data) {
        setComunaId(data.id_comuna);
        setIsOwner(data.id_usuario === user.id);
      }
        else {
        setNoComuna(true);
        setLoading(false);
        }
    };
    fetchComunaId();
  }, [user]);

  // Cargar responsables
  useEffect(() => {
    if (!comunaId) return;
    const fetchResponsables = async () => {
      setLoading(true);
      const { data, error } = await supabase
        .from('responsables_gestion_comuna')
        .select('*')
        .eq('id_comuna', comunaId)
        .order('unidad', { ascending: true });
      if (error) console.error('Error cargando responsables:', error);
      else setResponsables(data || []);
      setLoading(false);
    };
    fetchResponsables();
  }, [comunaId]);

  // Subir archivos
  const uploadFile = async (file: File, responsableId: number, type: 'rif' | 'cedula'): Promise<string | null> => {
    if (!user?.id || !comunaId) return null;
    const fileExt = file.name.split('.').pop();
    const fileName = `responsable_${responsableId}_${type}_${Date.now()}.${fileExt}`;
    const filePath = `${comunaId}/responsables/${fileName}`;

    const { error } = await supabase.storage
      .from('documentos_comuna')
      .upload(filePath, file, { upsert: true });

    if (error) {
      console.error(`Error subiendo ${type}:`, error.message);
      return null;
    }
    return filePath;
  };

  const deleteFileFromStorage = async (pathOrUrl: string): Promise<void> => {
    if (!pathOrUrl) return;
    const bucketName = 'documentos_comuna';
    let relativePath = pathOrUrl;

    const searchString = `/storage/v1/object/public/${bucketName}/`;
    if (pathOrUrl.includes(searchString)) {
      const pathStart = pathOrUrl.indexOf(searchString);
      if (pathStart !== -1) {
        relativePath = pathOrUrl.substring(pathStart + searchString.length);
      }
    }

    const { error } = await supabase.storage
      .from(bucketName)
      .remove([relativePath]);

    if (error) {
      console.error(`Error eliminando archivo físico (${relativePath}):`, error.message);
    }
  };

  // Registro
  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.nombre.trim()) {
      showAlert('Campo requerido', 'El nombre es obligatorio', 'warning');
      return;
    }
    if (!formData.apellido.trim()) {
      showAlert('Campo requerido', 'El apellido es obligatorio', 'warning');
      return;
    }
    if (!formData.cedulaNumero.trim()) {
      showAlert('Campo requerido', 'La cédula es obligatoria', 'warning');
      return;
    }
    if (!validateCedula(formData.cedulaTipo, formData.cedulaNumero)) {
      showAlert('Formato inválido', 'La cédula debe tener el formato V-12345678 o E-12345678', 'danger');
      return;
    }
    
    if (!comunaId) {
      showAlert('Error', 'No se ha identificado la comuna', 'danger');
      return;
    }
    
    setSaving(true);

    const telefonoCompleto = formData.operadora && formData.telefono 
      ? `${formData.operadora}${formData.telefono}` 
      : formData.telefono || null;

    const nuevoResponsable = {
      id_comuna: comunaId,
      nombre_g: formData.nombre.trim(),
      apellido_g: formData.apellido.trim(),
      cedula: getCedulaCompleta(),
      unidad: formData.unidad,
      tipo: formData.tipo,
      profesion: formData.profesion.trim() || null,
      grado_instruccion: formData.grado_instruccion || null,
      telefono: telefonoCompleto,
      rif_url: null,
      cedula_url: null,
      rif_fecha_vencimiento: null,
      rif_ultima_actualizacion: null,
    };

    const { data, error } = await supabase
      .from('responsables_gestion_comuna')
      .insert([nuevoResponsable])
      .select()
      .single();

    if (error) {
      console.error('Error insertando responsable:', error.message);
      showAlert('Error', 'Error al guardar el responsable', 'danger');
      setSaving(false);
      return;
    }

    const responsableId = data.id_responsable;
    let rifUrl = null;
    let cedulaUrl = null;

    if (rifFile) {
      rifUrl = await uploadFile(rifFile, responsableId, 'rif');
    }
    if (cedulaFile) {
      cedulaUrl = await uploadFile(cedulaFile, responsableId, 'cedula');
    }

    const updateData: any = {};
    if (rifUrl) updateData.rif_url = rifUrl;
    if (cedulaUrl) updateData.cedula_url = cedulaUrl;
    if (manualVencimiento) {
      updateData.rif_fecha_vencimiento = manualVencimiento; // YYYY-MM-DD
    }

    if (Object.keys(updateData).length > 0) {
      const { error: updateError } = await supabase
        .from('responsables_gestion_comuna')
        .update(updateData)
        .eq('id_responsable', responsableId);

      if (updateError) {
        console.error('Error actualizando adjuntos del responsable:', updateError.message);
      } else {
        Object.assign(data, updateData);
      }
    }

    setResponsables(prev => [data, ...prev]);
    resetForm();
    setIsRegisterOpen(false);
    setSaving(false);
    showAlert('Éxito', 'Responsable registrado correctamente', 'success');
  };

  const handleCreateAuxiliar = async () => {
    if (!selectedAuxResponsable) return;
    if (auxPassword !== auxConfirm) {
      showAlert('Error', 'Las contraseñas no coinciden', 'danger');
      return;
    }
    if (!auxEmail || !auxPassword) {
      showAlert('Error', 'Correo y contraseña son requeridos', 'danger');
      return;
    }

    try {
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      if (sessionError) {
        console.error('Error obteniendo sesión:', sessionError);
        showAlert('Error', 'Error de sesión. Por favor, recarga la página.', 'danger');
        return;
      }
      if (!session) {
        showAlert('Error', 'No hay sesión activa. Inicia sesión nuevamente.', 'danger');
        return;
      }
      await supabase.auth.refreshSession();
      const { data: { session: refreshedSession } } = await supabase.auth.getSession();
      const token = refreshedSession?.access_token || session.access_token;

      const response = await fetch(`${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/create-auxiliar`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          tipo: 'comuna',
          email: auxEmail,
          password: auxPassword,
          nombre: selectedAuxResponsable.nombre_g,
          apellido: selectedAuxResponsable.apellido_g,
          cedula: selectedAuxResponsable.cedula,
          comunaId: comunaId,
          responsableId: selectedAuxResponsable.id_responsable
        })
      });

      const result = await response.json();
      if (!response.ok) {
  const result = await response.json();
  console.error('Respuesta error:', result);
  // Mostrar el mensaje de error que viene del backend
  showAlert('Error', result.error || 'Error al asignar auxiliar', 'danger');
  return;
}
      
      showAlert('Éxito', 'Auxiliar asignado correctamente', 'success');
      setShowAuxiliarModal(false);
      
      const { data: refreshed } = await supabase
        .from('responsables_gestion_comuna')
        .select('*')
        .eq('id_comuna', comunaId)
        .order('unidad');
      setResponsables(refreshed || []);
    } catch (err: any) {
      console.error(err);
      showAlert('Error', `Error: ${err.message}`, 'danger');
    }
  };

  // Edición
  const handleEditClick = (item: ResponsableGestion) => {
    const telefonoCompleto = item.telefono || '';
    const operadoraMatch = telefonoCompleto.match(/^(0424|0414|0412|0426|0416)/);
    let cedulaTipo = 'V';
    let cedulaNumero = '';
    if (item.cedula) {
      const match = item.cedula.match(/^([VE])\-?(\d+)$/i);
      if (match) {
        cedulaTipo = match[1].toUpperCase();
        cedulaNumero = match[2];
      } else {
        cedulaNumero = item.cedula.replace(/\D/g, '');
      }
    }

    setEditingItem(item);
    setFormData({
      nombre: item.nombre_g,
      apellido: item.apellido_g,
      cedulaTipo,
      cedulaNumero,
      unidad: item.unidad,
      tipo: item.tipo,
      profesion: item.profesion || '',
      grado_instruccion: item.grado_instruccion || '',
      telefono: telefonoCompleto.replace(/^(0424|0414|0412|0426|0416)/, ''),
      operadora: operadoraMatch ? operadoraMatch[1] : '',
    });
    
    setExistingRifUrl(item.rif_url);
    setExistingCedulaUrl(item.cedula_url);
    setRifFile(null);
    setCedulaFile(null);
    
    if (item.rif_fecha_vencimiento) {
      // Asignar directamente en YYYY-MM-DD (input type="date" lo espera)
      setManualVencimiento(item.rif_fecha_vencimiento);
    } else {
      setManualVencimiento('');
    }
    setIsEditOpen(true);
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingItem) return;

    if (!formData.nombre.trim()) {
      showAlert('Campo requerido', 'El nombre es obligatorio', 'warning');
      return;
    }
    if (!formData.apellido.trim()) {
      showAlert('Campo requerido', 'El apellido es obligatorio', 'warning');
      return;
    }
    if (!formData.cedulaNumero.trim()) {
      showAlert('Campo requerido', 'La cédula es obligatoria', 'warning');
      return;
    }
    const validateCedula = (tipo: string, numero: string): boolean => {
      const numClean = numero.replace(/\D/g, '');
      return (tipo === 'V' || tipo === 'E') && numClean.length >= 7 && numClean.length <= 8;
    };

    setSaving(true);

    const telefonoCompleto = formData.operadora && formData.telefono 
      ? `${formData.operadora}${formData.telefono}` 
      : formData.telefono || null;

    const updatedData: any = {
      nombre_g: formData.nombre.trim(),
      apellido_g: formData.apellido.trim(),
      cedula: getCedulaCompleta(),
      unidad: formData.unidad,
      tipo: formData.tipo,
      profesion: formData.profesion.trim() || null,
      grado_instruccion: formData.grado_instruccion || null,
      telefono: telefonoCompleto,
    };

    let newRifUrl = existingRifUrl;
    let newCedulaUrl = existingCedulaUrl;

    if (rifFile) {
      if (existingRifUrl) await deleteFileFromStorage(existingRifUrl);
      const uploadedUrl = await uploadFile(rifFile, editingItem.id_responsable, 'rif');
      if (uploadedUrl) newRifUrl = uploadedUrl;
    }
    
    if (cedulaFile) {
      if (existingCedulaUrl) await deleteFileFromStorage(existingCedulaUrl);
      const uploadedUrl = await uploadFile(cedulaFile, editingItem.id_responsable, 'cedula');
      if (uploadedUrl) newCedulaUrl = uploadedUrl;
    }

    updatedData.rif_url = newRifUrl;
    updatedData.cedula_url = newCedulaUrl;
    updatedData.rif_fecha_vencimiento = manualVencimiento || null;

    const { error } = await supabase
      .from('responsables_gestion_comuna')
      .update(updatedData)
      .eq('id_responsable', editingItem.id_responsable);

    if (error) {
      console.error('Error actualizando responsable:', error.message);
      showAlert('Error', 'Error al actualizar los datos en el servidor', 'danger');
    } else {
      setResponsables(prev => prev.map(r =>
        r.id_responsable === editingItem.id_responsable
          ? { ...r, ...updatedData }
          : r
      ));
      setIsEditOpen(false);
      setEditingItem(null);
      resetForm();
      showAlert('Éxito', 'Responsable actualizado correctamente', 'success');
    }
    setSaving(false);
  };

  // Eliminar
  const handleDelete = (id_responsable: number, rifUrl: string | null, cedulaUrl: string | null) => {
    showConfirm(
      'Confirmar eliminación',
      '¿Está seguro de eliminar este responsable? Esta acción también borrará sus documentos adjuntos de forma permanente.',
      async () => {
        const { error } = await supabase
          .from('responsables_gestion_comuna')
          .delete()
          .eq('id_responsable', id_responsable); 
        if (error) {
          console.error('Error eliminando responsable de la BD:', error.message);
          showAlert('Error', 'No se pudo eliminar el registro. Verifique sus permisos.', 'danger');
          return;
        }

        if (rifUrl) await deleteFileFromStorage(rifUrl);
        if (cedulaUrl) await deleteFileFromStorage(cedulaUrl);

        setResponsables(prev => prev.filter(r => r.id_responsable !== id_responsable));
        showAlert('Eliminado', 'El responsable ha sido eliminado.', 'success');
      }
    );
  };

  const handleViewFile = async (url: string | null) => {
    if (!url) return;
    const signedUrl = await getSignedUrlFromPublicUrl(url);
    if (signedUrl) window.open(signedUrl, '_blank');
    else showAlert('Error', 'No se pudo abrir el documento', 'warning');
  };

  const resetForm = () => {
    setFormData({
      nombre: '',
      apellido: '',
      cedulaTipo: 'V',
      cedulaNumero: '',
      unidad: 'Planificación Comunal',
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
    setEditingItem(null);
    setManualVencimiento('');
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const triggerRifUpload = () => rifFileInputRef.current?.click();
  const triggerCedulaUpload = () => cedulaFileInputRef.current?.click();
  const handleRifChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files?.[0]) setRifFile(e.target.files[0]);
  };
  const handleCedulaChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files?.[0]) setCedulaFile(e.target.files[0]);
  };

  // Paginación
  const filteredResponsables = selectedUnit === "TODAS"
    ? responsables
    : responsables.filter(r => r.unidad === selectedUnit);
  const totalPages = Math.ceil(filteredResponsables.length / itemsPerPage);
  const currentItems = filteredResponsables.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  if (loading) {
    return <div className="flex justify-center p-8"><Loader2 className="animate-spin text-brand-primary" size={28} /></div>;
  }

      if (noComuna) {
        const onNavigate = (route: string) => {
          try {
            // Navegar a la ruta relativa dentro de la app
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
    <div className="space-y-4">
      {/* Header reducido */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div>
          <h2 className="text-base font-black text-slate-800 italic uppercase tracking-tighter flex items-center gap-2">
            <Shield className="h-5 w-5 text-brand-primary" /> Órganos de Gestión
          </h2>
          <p className="text-[8px] text-slate-400 font-bold uppercase tracking-[0.15em] mt-0.5">
            Responsables de las áreas estratégicas de la comuna
          </p>
        </div>
        <select
          value={selectedUnit}
          onChange={(e) => { setSelectedUnit(e.target.value); setCurrentPage(1); }}
          className="px-3 py-1.5 rounded-lg bg-white border border-gray-100 text-[9px] font-black uppercase tracking-wider outline-none focus:ring-2 focus:ring-brand-primary/20 appearance-none cursor-pointer text-slate-600 min-w-45"
        >
          <option value="TODAS">Todas las unidades</option>
          {units.map(unit => <option key={unit} value={unit}>{unit}</option>)}
        </select>
      </div>

      {/* Tabla reducida */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="p-3 border-b border-gray-100 flex items-center justify-between bg-gray-50/30">
          <div>
            <h3 className="text-sm font-black text-slate-800 italic uppercase">Responsables de Gestión</h3>
            <p className="text-[8px] text-slate-400 font-bold uppercase mt-0.5">{filteredResponsables.length} miembros registrados</p>
          </div>
          <button
            onClick={() => { resetForm(); setIsRegisterOpen(true); }}
            className="flex items-center gap-1.5 rounded-xl bg-brand-primary px-3 py-1.5 text-[9px] font-black text-white shadow-md hover:scale-105 transition-all uppercase tracking-wider"
          >
            <Plus className="h-3 w-3" /> Agregar Responsable
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50/50 border-b border-gray-100 text-[8px] font-black text-slate-400 uppercase tracking-[0.15em]">
                <th className="px-3 py-2">Responsable</th>
                <th className="px-3 py-2">Área</th>
                <th className="px-3 py-2">Cargo</th>
                <th className="px-3 py-2">Formación</th>
                <th className="px-3 py-2">Contacto</th>
                <th className="px-3 py-2 text-right">RIF</th>
                <th className="px-3 py-2 text-right">Cédula</th>
                <th className="px-3 py-2 text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {currentItems.map(r => (
                <tr key={r.id_responsable} className="hover:bg-gray-50/80 transition-colors">
                  <td className="px-3 py-2">
                    <p className="text-[11px] font-black text-slate-800">{r.nombre_g} {r.apellido_g}</p>
                    <p className="text-[8px] text-slate-400 font-bold uppercase tracking-tighter">C.I: {r.cedula}</p>
                  </td>
                  <td className="px-3 py-2">
                    <p className="text-[9px] font-black text-brand-primary uppercase leading-tight">{r.unidad}</p>
                  </td>
                  <td className="px-3 py-2">
                    <span className={cn(
                      "text-[8px] font-black px-1.5 py-0.5 rounded-full uppercase border",
                      r.tipo === 'Principal' ? 'bg-indigo-50 text-indigo-600 border-indigo-100' : 'bg-slate-50 text-slate-600 border-slate-100'
                    )}>{r.tipo}</span>
                  </td>
                  <td className="px-3 py-2">
                    <p className="text-[9px] font-bold text-slate-700 italic">{r.profesion || '—'}</p>
                    <p className="text-[7px] text-slate-400 font-black uppercase tracking-wider">{r.grado_instruccion || '—'}</p>
                  </td>
                  <td className="px-3 py-2 text-[9px] font-bold text-slate-500">{r.telefono || '—'}</td>
                  <td className="px-3 py-2 text-right">
                    <div className="flex flex-col items-end gap-0.5">
                      {r.rif_url ? (
                        <>
                          <button onClick={() => handleViewFile(r.rif_url)} className="inline-flex items-center justify-center h-6 w-6 rounded-lg bg-emerald-50 text-emerald-500 border border-emerald-100 hover:bg-emerald-100">
                            <Eye className="h-3 w-3" />
                          </button>
                          <RifStatusBadge fechaVencimiento={r.rif_fecha_vencimiento} />
                        </>
                      ) : (
                        <div className="inline-flex items-center justify-center h-6 w-6 rounded-lg bg-rose-50 text-rose-500 border border-rose-100">
                          <AlertCircle className="h-3 w-3" />
                        </div>
                      )}
                    </div>
                  </td>
                  <td className="px-3 py-2 text-right">
                    {r.cedula_url ? (
                      <button onClick={() => handleViewFile(r.cedula_url)} className="inline-flex items-center justify-center h-6 w-6 rounded-lg bg-emerald-50 text-emerald-500 border border-emerald-100 hover:bg-emerald-100">
                        <Eye className="h-3 w-3" />
                      </button>
                    ) : (
                      <div className="inline-flex items-center justify-center h-6 w-6 rounded-lg bg-rose-50 text-rose-500 border border-rose-100">
                        <AlertCircle className="h-3 w-3" />
                      </div>
                    )}
                  </td>
                  <td className="px-3 py-2 text-right">
                    <div className="flex gap-1 justify-end">
                      <button onClick={() => handleEditClick(r)} className="p-1 text-slate-400 hover:text-brand-primary transition-colors"><Edit className="h-3 w-3" /></button>
                      <button onClick={() => handleDelete(r.id_responsable, r.rif_url, r.cedula_url)} className="p-1 text-slate-400 hover:text-rose-500 transition-colors"><Trash2 className="h-3 w-3" /></button>
                      {isOwner && !hasAuxiliar && !r.es_auxiliar && r.cedula !== userCedula && (
                        <button
                          onClick={() => handleOpenAuxiliarModal(r)}
                          className="p-1 text-slate-400 hover:text-brand-primary transition-colors"
                          title="Asignar como auxiliar"
                        >
                          <UserPlus className="h-3 w-3" />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
              {currentItems.length === 0 && (
                <tr><td colSpan={8} className="text-center py-6 text-slate-400 text-xs">No hay responsables registrados en esta unidad</td></tr>
              )}
            </tbody>
          </table>
        </div>

        {totalPages > 1 && (
          <div className="p-3 border-t border-gray-100 bg-gray-50/30 flex items-center justify-between">
            <p className="text-[8px] font-bold text-slate-400 uppercase">Página {currentPage} de {totalPages}</p>
            <div className="flex gap-1.5">
              <button onClick={() => setCurrentPage(p => Math.max(1, p-1))} disabled={currentPage === 1} className="p-1 rounded-lg bg-white border border-gray-100 text-slate-400 disabled:opacity-50"><ChevronLeft className="h-3 w-3" /></button>
              <button onClick={() => setCurrentPage(p => Math.min(totalPages, p+1))} disabled={currentPage === totalPages} className="p-1 rounded-lg bg-white border border-gray-100 text-slate-400 disabled:opacity-50"><ChevronRight className="h-3 w-3" /></button>
            </div>
          </div>
        )}
      </div>

      {/* MODAL DE REGISTRO (sin cambios estructurales, solo mantiene tamaño original) */}
      <AnimatePresence>
        {isRegisterOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }} 
              animate={{ opacity: 1 }} 
              exit={{ opacity: 0 }} 
              onClick={() => setIsRegisterOpen(false)} 
              className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" 
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }} 
              animate={{ opacity: 1, scale: 1 }} 
              exit={{ opacity: 0, scale: 0.95 }} 
              className="relative w-full max-w-xl bg-white rounded-3xl shadow-2xl overflow-hidden max-h-[90vh] overflow-y-auto"
            >
              {/* Contenido del modal de registro (idéntico al original, sin reducción) */}
              <div className="p-5 border-b border-gray-100 flex justify-between items-center bg-slate-50 sticky top-0 z-10">
                <h4 className="text-base font-black text-slate-800 italic uppercase">Registrar Responsable de Gestión</h4>
                <button onClick={() => setIsRegisterOpen(false)} className="p-1.5 rounded-xl hover:bg-gray-200 transition-colors">
                  <X className="h-4 w-4 text-slate-400" />
                </button>
              </div>
              <form onSubmit={handleRegister} className="p-5 space-y-4">
                {/* ... (formulario sin cambios) ... */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5 block">Nombre</label>
                    <input name="nombre" value={formData.nombre} onChange={handleInputChange} className="w-full p-3 rounded-xl bg-gray-50 border border-gray-100 text-xs font-bold outline-none focus:ring-2 focus:ring-brand-primary/20" required />
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5 block">Apellido</label>
                    <input name="apellido" value={formData.apellido} onChange={handleInputChange} className="w-full p-3 rounded-xl bg-gray-50 border border-gray-100 text-xs font-bold outline-none focus:ring-2 focus:ring-brand-primary/20" required />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5 block">Cédula <span className="text-rose-500">*</span></label>
                    <div className="flex gap-2">
                      <select
                        value={formData.cedulaTipo}
                        onChange={(e) => setFormData({ ...formData, cedulaTipo: e.target.value })}
                        className="w-16 p-3 rounded-xl bg-gray-50 border border-gray-100 text-xs font-bold outline-none focus:ring-2 focus:ring-brand-primary/20"
                      >
                        <option value="V">V</option>
                        <option value="E">E</option>
                      </select>
                      <input
                        type="text"
                        placeholder="Número de cédula"
                        value={formData.cedulaNumero}
                        onChange={(e) => {
                          const digits = e.target.value.replace(/\D/g, '').slice(0, 8);
                          setFormData({ ...formData, cedulaNumero: digits });
                        }}
                        className="flex-1 p-3 rounded-xl bg-gray-50 border border-gray-100 text-xs font-bold outline-none focus:ring-2 focus:ring-brand-primary/20"
                        required
                      />
                    </div>
                    {!validateCedula(formData.cedulaTipo, formData.cedulaNumero) && formData.cedulaNumero && (
                      <p className="text-[9px] text-rose-500 mt-1 font-medium">Debe tener entre 7 y 8 dígitos</p>
                    )}
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5 block">Teléfono</label>
                    <div className="flex gap-2">
                      <select name="operadora" value={formData.operadora} onChange={handleInputChange} className="w-20 p-3 rounded-xl bg-gray-50 border border-gray-100 text-[11px] font-bold outline-none">
                        <option value="">Cód.</option>
                        {operadoras.map(op => (<option key={op.codigo} value={op.codigo}>{op.codigo}</option>))}
                      </select>
                      <input name="telefono" value={formData.telefono} onChange={handleInputChange} className="w-43 p-3 rounded-xl bg-gray-50 border border-gray-100 text-xs font-bold outline-none focus:ring-2 focus:ring-brand-primary/20" placeholder="1234567" maxLength={7} />
                    </div>
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-3">
                  <div><label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5 block">Unidad</label><select name="unidad" value={formData.unidad} onChange={handleInputChange} className="w-full p-3 rounded-xl bg-gray-50 border border-gray-100 text-xs font-bold outline-none">{units.map(u => <option key={u}>{u}</option>)}</select></div>
                  <div><label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5 block">Tipo</label><select name="tipo" value={formData.tipo} onChange={handleInputChange} className="w-full p-3 rounded-xl bg-gray-50 border border-gray-100 text-xs font-bold outline-none"><option>Principal</option><option>Suplente</option></select></div>
                  <div><label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5 block">Profesión</label><input name="profesion" value={formData.profesion} onChange={handleInputChange} className="w-full p-3 rounded-xl bg-gray-50 border border-gray-100 text-xs font-bold outline-none focus:ring-2 focus:ring-brand-primary/20" /></div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div><label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5 block">Grado de Instrucción</label><select name="grado_instruccion" value={formData.grado_instruccion} onChange={handleInputChange} className="w-full p-3 rounded-xl bg-gray-50 border border-gray-100 text-xs font-bold outline-none"><option value="">Seleccione</option>{gradosInstruccion.map(g => <option key={g}>{g}</option>)}</select></div>
                    <div>
                      <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5 block">Vencimiento RIF</label>
                      <input
                        type="date"
                        value={manualVencimiento}
                        onChange={(e) => setManualVencimiento(e.target.value)}
                        className="w-full p-3 rounded-xl bg-gray-50 border border-gray-100 text-xs font-bold outline-none focus:ring-2 focus:ring-brand-primary/20"
                      />
                    </div>
                </div>
                <div className="grid grid-cols-2 gap-3 pt-1">
                  <div><label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5 block">RIF Digitalizado</label><input type="file" ref={rifFileInputRef} className="hidden" accept=".pdf,.jpg,.png" onChange={handleRifChange} /><div className="flex items-center gap-3 p-2.5 bg-gray-50 border border-gray-100 rounded-xl"><button type="button" onClick={triggerRifUpload} className="bg-white text-brand-primary px-4 py-2 rounded-lg text-[10px] font-black uppercase border border-brand-primary/30 shadow-sm active:scale-95 transition-all"><Upload className="h-3 w-3 inline mr-1" /> Subir</button><span className="text-[10px] text-slate-400 font-bold truncate flex-1">{rifFile ? rifFile.name : "Ningún archivo"}</span></div></div>
                  <div><label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5 block">Fotografía de la Cédula</label><input type="file" ref={cedulaFileInputRef} className="hidden" accept=".pdf,.jpg,.png" onChange={handleCedulaChange} /><div className="flex items-center gap-3 p-2.5 bg-gray-50 border border-gray-100 rounded-xl"><button type="button" onClick={triggerCedulaUpload} className="bg-white text-brand-primary px-4 py-2 rounded-lg text-[10px] font-black uppercase border border-brand-primary/30 shadow-sm active:scale-95 transition-all"><Upload className="h-3 w-3 inline mr-1" /> Subir</button><span className="text-[10px] text-slate-400 font-bold truncate flex-1">{cedulaFile ? cedulaFile.name : "Ningún archivo"}</span></div></div>
                </div>
                <div className="pt-2 sticky bottom-0 bg-white"><button type="submit" disabled={saving} className="w-full py-3.5 rounded-xl bg-brand-primary text-white text-xs font-black uppercase tracking-wider shadow-md shadow-brand-primary/10 hover:shadow-lg active:scale-[0.99] transition-all disabled:opacity-50">{saving ? <Loader2 className="animate-spin mx-auto h-4 w-4" /> : "Registrar Responsable"}</button></div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* MODAL DE EDICIÓN */}
      <AnimatePresence>
        {isEditOpen && editingItem && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => { setIsEditOpen(false); resetForm(); }}
              className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="relative w-full max-w-xl bg-white rounded-3xl shadow-2xl overflow-hidden max-h-[90vh] overflow-y-auto"
            >
              <div className="p-5 border-b border-gray-100 flex justify-between items-center bg-slate-50 sticky top-0 z-10">
                <h4 className="text-base font-black text-slate-800 italic uppercase">Editar Responsable de Gestión</h4>
                <button onClick={() => { setIsEditOpen(false); resetForm(); }} className="p-1.5 rounded-xl hover:bg-gray-200 transition-colors">
                  <X className="h-4 w-4 text-slate-400" />
                </button>
              </div>

              <form onSubmit={handleUpdate} className="p-5 space-y-4">
                {/* Nombre y Apellido */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5 block">Nombre</label>
                    <input
                      name="nombre"
                      value={formData.nombre}
                      onChange={handleInputChange}
                      className="w-full p-3 rounded-xl bg-gray-50 border border-gray-100 text-xs font-bold outline-none focus:ring-2 focus:ring-brand-primary/20"
                      required
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5 block">Apellido</label>
                    <input
                      name="apellido"
                      value={formData.apellido}
                      onChange={handleInputChange}
                      className="w-full p-3 rounded-xl bg-gray-50 border border-gray-100 text-xs font-bold outline-none focus:ring-2 focus:ring-brand-primary/20"
                      required
                    />
                  </div>
                </div>

                {/* Cédula (separada, deshabilitada) */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5 block">Cédula <span className="text-rose-500">*</span></label>
                    <div className="flex gap-2">
                      <select
                        value={formData.cedulaTipo}
                        onChange={(e) => setFormData({ ...formData, cedulaTipo: e.target.value })}
                        disabled
                        className="w-16 p-3 rounded-xl bg-gray-100 border border-gray-200 text-slate-500 cursor-not-allowed text-xs font-bold outline-none"
                      >
                        <option value="V">V</option>
                        <option value="E">E</option>
                      </select>
                      <input
                        type="text"
                        placeholder="Número de cédula"
                        value={formData.cedulaNumero}
                        onChange={(e) => {
                          const digits = e.target.value.replace(/\D/g, '').slice(0, 8);
                          setFormData({ ...formData, cedulaNumero: digits });
                        }}
                        disabled
                        className="flex-1 p-3 rounded-xl bg-gray-100 border border-gray-200 text-slate-500 cursor-not-allowed text-xs font-bold outline-none"
                        required
                      />
                    </div>
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5 block">Teléfono</label>
                    <div className="flex gap-2">
                      <select
                        name="operadora"
                        value={formData.operadora}
                        onChange={handleInputChange}
                        className="w-20 p-3 rounded-xl bg-gray-50 border border-gray-100 text-[11px] font-bold outline-none focus:ring-2 focus:ring-brand-primary/20"
                      >
                        <option value="">Cód.</option>
                        {operadoras.map(op => (<option key={op.codigo} value={op.codigo}>{op.codigo}</option>))}
                      </select>
                      <input
                        name="telefono"
                        value={formData.telefono}
                        onChange={handleInputChange}
                        className="flex-1 p-3 rounded-xl bg-gray-50 border border-gray-100 text-xs font-bold outline-none focus:ring-2 focus:ring-brand-primary/20"
                        placeholder="1234567"
                        maxLength={7}
                      />
                    </div>
                  </div>
                </div>

                {/* Unidad, Tipo, Profesión */}
                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5 block">Unidad</label>
                    <select name="unidad" value={formData.unidad} onChange={handleInputChange} className="w-full p-3 rounded-xl bg-gray-50 border border-gray-100 text-xs font-bold outline-none focus:ring-2 focus:ring-brand-primary/20">
                      {units.map(u => <option key={u}>{u}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5 block">Tipo</label>
                    <select name="tipo" value={formData.tipo} onChange={handleInputChange} className="w-full p-3 rounded-xl bg-gray-50 border border-gray-100 text-xs font-bold outline-none focus:ring-2 focus:ring-brand-primary/20">
                      <option>Principal</option>
                      <option>Suplente</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5 block">Profesión</label>
                    <input name="profesion" value={formData.profesion} onChange={handleInputChange} className="w-full p-3 rounded-xl bg-gray-50 border border-gray-100 text-xs font-bold outline-none focus:ring-2 focus:ring-brand-primary/20" />
                  </div>
                </div>

                {/* Grado Instrucción y Fecha Vencimiento RIF */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5 block">Grado de Instrucción</label>
                    <select name="grado_instruccion" value={formData.grado_instruccion} onChange={handleInputChange} className="w-full p-3 rounded-xl bg-gray-50 border border-gray-100 text-xs font-bold outline-none focus:ring-2 focus:ring-brand-primary/20">
                      <option value="">Seleccione</option>
                      {gradosInstruccion.map(g => <option key={g}>{g}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5 block">Vencimiento RIF</label>
                    <input
                      type="date"
                      value={manualVencimiento}
                      onChange={(e) => setManualVencimiento(e.target.value)}
                      className="w-full p-3 rounded-xl bg-gray-50 border border-gray-100 text-xs font-bold outline-none focus:ring-2 focus:ring-brand-primary/20"
                    />
                  </div>
                </div>

                {/* Documentos (RIF y Cédula en la misma fila) */}
                <div className="grid grid-cols-2 gap-3 pt-1">
                  <div>
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5 block">RIF Digitalizado</label>
                    {existingRifUrl && !rifFile && (
                      <div className="mb-2 flex items-center gap-2">
                        <button type="button" onClick={() => handleViewFile(existingRifUrl)} className="text-[9px] font-bold text-brand-primary underline">Ver actual</button>
                        <span className="text-[8px] text-slate-400">|</span>
                        <button type="button" onClick={triggerRifUpload} className="text-[9px] font-bold text-slate-500 hover:text-brand-primary">Reemplazar</button>
                      </div>
                    )}
                    <input type="file" ref={rifFileInputRef} className="hidden" accept=".pdf,.jpg,.png" onChange={handleRifChange} />
                    {!existingRifUrl && !rifFile && (
                      <button type="button" onClick={triggerRifUpload} className="w-full p-3 bg-gray-50 border border-gray-100 rounded-xl hover:border-gray-200 text-xs font-semibold text-slate-600 flex items-center justify-center gap-1.5 transition-all">
                        <Upload className="h-3 w-3" /> Subir RIF
                      </button>
                    )}
                    {rifFile && <p className="text-[8px] text-slate-500 mt-1 truncate">{rifFile.name}</p>}
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5 block">Fotografía de la Cédula</label>
                    {existingCedulaUrl && !cedulaFile && (
                      <div className="mb-2 flex items-center gap-2">
                        <button type="button" onClick={() => handleViewFile(existingCedulaUrl)} className="text-[9px] font-bold text-brand-primary underline">Ver actual</button>
                        <span className="text-[8px] text-slate-400">|</span>
                        <button type="button" onClick={triggerCedulaUpload} className="text-[9px] font-bold text-slate-500 hover:text-brand-primary">Reemplazar</button>
                      </div>
                    )}
                    <input type="file" ref={cedulaFileInputRef} className="hidden" accept=".pdf,.jpg,.png" onChange={handleCedulaChange} />
                    {!existingCedulaUrl && !cedulaFile && (
                      <button type="button" onClick={triggerCedulaUpload} className="w-full p-3 bg-gray-50 border border-gray-100 rounded-xl hover:border-gray-200 text-xs font-semibold text-slate-600 flex items-center justify-center gap-1.5 transition-all">
                        <Upload className="h-3 w-3" /> Subir Cédula
                      </button>
                    )}
                    {cedulaFile && <p className="text-[8px] text-slate-500 mt-1 truncate">{cedulaFile.name}</p>}
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={saving || !validateCedula(formData.cedulaTipo, formData.cedulaNumero)}
                  className="w-full py-3.5 rounded-xl bg-brand-primary text-white text-xs font-black uppercase tracking-wider shadow-md shadow-brand-primary/10 hover:shadow-lg active:scale-[0.99] transition-all disabled:opacity-50"
                >
                  {saving ? <Loader2 className="animate-spin mx-auto h-4 w-4" /> : "Actualizar Responsable"}
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Modal de asignación auxiliar (sin cambios) */}
      <AnimatePresence>
        {showAuxiliarModal && selectedAuxResponsable && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="fixed inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setShowAuxiliarModal(false)} />
            <div className="relative w-full max-w-md bg-white rounded-2xl shadow-2xl p-6">
              <h3 className="text-xl font-black text-slate-800 uppercase tracking-wider mb-4">Asignar como Responsable Auxiliar</h3>
              <p className="text-sm text-slate-600 mb-4">Se creará una cuenta para <strong>{selectedAuxResponsable.nombre_g} {selectedAuxResponsable.apellido_g}</strong>.<br />Complete los datos de acceso.</p>
              <div className="space-y-4">
                <div><label className="text-[10px] font-black text-slate-500 uppercase">Correo Electrónico *</label><input type="email" value={auxEmail} onChange={(e) => setAuxEmail(e.target.value)} className="w-full p-3 rounded-xl bg-gray-50 border border-gray-200" required /></div>
                <div><label className="text-[10px] font-black text-slate-500 uppercase">Contraseña *</label><input type="password" value={auxPassword} onChange={(e) => setAuxPassword(e.target.value)} className="w-full p-3 rounded-xl bg-gray-50 border border-gray-200" required /></div>
                <div><label className="text-[10px] font-black text-slate-500 uppercase">Confirmar Contraseña *</label><input type="password" value={auxConfirm} onChange={(e) => setAuxConfirm(e.target.value)} className="w-full p-3 rounded-xl bg-gray-50 border border-gray-200" /></div>
                <div><label className="text-[10px] font-black text-slate-500 uppercase">Teléfono (opcional)</label><input type="tel" value={auxTelefono} onChange={(e) => setAuxTelefono(e.target.value)} className="w-full p-3 rounded-xl bg-gray-50 border border-gray-200" /></div>
                <div className="flex gap-3 pt-4"><button onClick={handleCreateAuxiliar} disabled={!auxEmail || !auxPassword || auxPassword !== auxConfirm} className="flex-1 py-3 bg-brand-primary text-white rounded-xl text-sm font-black uppercase">Crear y Asignar</button><button onClick={() => setShowAuxiliarModal(false)} className="px-6 py-3 border border-gray-200 rounded-xl text-sm font-black">Cancelar</button></div>
              </div>
            </div>
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