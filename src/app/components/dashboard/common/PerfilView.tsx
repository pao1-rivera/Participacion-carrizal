"use client";

import React, { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  User, ShieldCheck, Lock, Camera, CreditCard, Briefcase, FileSignature, 
  Smartphone, Bell, CheckCircle2, ChevronRight, Building2,
  Loader2, Eye, EyeOff, ImagePlus, Upload, X, Calendar,
  AlertCircle, UserPlus
} from "lucide-react";
import { cn } from "@/app/lib/utils";
import { supabase } from "@/app/lib/supabaseClient";
import { AlertModal } from "@/app/components/AlertModal";

interface PerfilViewProps {
  user: any;
}

export const PerfilView = ({ user: authUser }: PerfilViewProps) => {
  const [activeTab, setActiveTab] = useState("personales");
  const [entityName, setEntityName] = useState("");
  const [loading, setLoading] = useState(true);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [showProfilePhotoModal, setShowProfilePhotoModal] = useState(false);
  const [showDocumentModal, setShowDocumentModal] = useState(false);
  const [selectedDocumentType, setSelectedDocumentType] = useState<'cedula' | 'rif'>('cedula');
  const [passwordData, setPasswordData] = useState({ current: '', new: '', confirm: '' });
  const [passwordErrors, setPasswordErrors] = useState({ current: '', new: '', confirm: '' });
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [changingPassword, setChangingPassword] = useState(false);
  
  // Foto de perfil
  const [profilePhotoUrl, setProfilePhotoUrl] = useState<string | null>(null);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [dragActive, setDragActive] = useState(false);

  // Documentos del usuario
  const [uploadingDocument, setUploadingDocument] = useState(false);
  const [selectedDocumentFile, setSelectedDocumentFile] = useState<File | null>(null);
  const [fotoCedulaUrl, setFotoCedulaUrl] = useState<string | null>(null);
  const [soporteRifUrl, setSoporteRifUrl] = useState<string | null>(null);
  const [profilePhotoSignedUrl, setProfilePhotoSignedUrl] = useState<string | null>(null);

  // Datos editables
  const [isSaved, setIsSaved] = useState(true);
  const [rif, setRif] = useState("");
  const [rifTipo, setRifTipo] = useState<'J' | 'C' | 'G'>('J');
  const [rifNumero, setRifNumero] = useState("");
  const [rifExpiration, setRifExpiration] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  
  // Datos de solo lectura
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [cedula, setCedula] = useState("");
  const [lastLogin, setLastLogin] = useState<string>("");

  // === ESTADOS PARA VOCEROS (CONSEJO COMUNAL) ===
  const [consejoId, setConsejoId] = useState<number | null>(null);
  const [voceroExists, setVoceroExists] = useState<boolean>(false);
  const [creatingVocero, setCreatingVocero] = useState<boolean>(false);

  // === ESTADOS PARA RESPONSABLES DE COMUNA ===
  const [comunaId, setComunaId] = useState<number | null>(null);
  const [responsableExists, setResponsableExists] = useState<boolean>(false);
  const [creatingResponsable, setCreatingResponsable] = useState<boolean>(false);
  const [showResponsableModal, setShowResponsableModal] = useState(false);
  const [responsableForm, setResponsableForm] = useState({
    unidad: '',
    tipo: 'Principal',
    profesion: '',
    grado_instruccion: ''
  });

  // Opciones para selects
  const unidadesComuna = [
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

  const [esAuxiliar, setEsAuxiliar] = useState(false);
  const [nombrePrincipal, setNombrePrincipal] = useState('');
  const [esAuxiliarConsejo, setEsAuxiliarConsejo] = useState(false);
  const [nombrePrincipalConsejo, setNombrePrincipalConsejo] = useState('');
  // ========== ALERT MODAL ==========
  const [modal, setModal] = useState({
    isOpen: false,
    title: '',
    message: '',
    type: 'info' as 'info' | 'success' | 'warning' | 'danger',
  });

  const showAlert = (title: string, message: string, type: 'info' | 'success' | 'warning' | 'danger' = 'info') => {
    setModal({ isOpen: true, title, message, type });
  };

  const closeAlert = () => {
    setModal(prev => ({ ...prev, isOpen: false }));
  };

  // ========== FUNCIONES AUXILIARES ==========
  const getSignedUrlFromPublicUrl = async (storedPath: string | null): Promise<string | null> => {
    if (!storedPath) return null;
    
    let bucketName = 'profile-photos'; // Default
    let cleanPath = storedPath;

    // Si es URL pública, extraer bucket y ruta
    if (storedPath.includes('http')) {
      const match = storedPath.match(/\/storage\/v1\/object\/public\/([^\/]+)\/(.+)$/);
      if (match) {
        bucketName = match[1];
        cleanPath = match[2];
      } else {
        // Si no coincide, devolver la URL tal cual (puede ser externa)
        return storedPath;
      }
    } else {
      // Si es ruta relativa, asumimos que está en profile-photos
      cleanPath = storedPath.replace(/^\/+/, '');
    }

    try {
      const { data, error } = await supabase.storage
        .from(bucketName)
        .createSignedUrl(cleanPath, 3600);
      if (error) {
        console.error(`Error generando URL firmada para ${cleanPath}:`, error.message);
        return null;
      }
      return data.signedUrl;
    } catch (err) {
      console.error('Excepción:', err);
      return null;
    }
  };

  const normalizeCedula = (ced: string): string => {
    return ced.trim().toUpperCase();
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0];
      if (file.type.startsWith('image/')) {
        setSelectedFile(file);
      }
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      if (file.type.startsWith('image/')) {
        setSelectedFile(file);
      }
    }
  };

  const handleDocumentDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDocumentDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0];
      if (file.type.match(/image\/|application\/(pdf|msword|postscript|vnd\.)/)) {
        setSelectedDocumentFile(file);
      }
    }
  };

  const handleDocumentFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      if (file.type.match(/image\/|application\/(pdf|msword|postscript|vnd\.)/)) {
        setSelectedDocumentFile(file);
      }
    }
  };

  const handleUploadProfilePhoto = async () => {
    if (!selectedFile) return;
    setUploadingPhoto(true);
    try {
      const cedulaLimpia = cedula.replace(/[^0-9]/g, '');
      if (!cedulaLimpia) throw new Error('No se encontró la cédula del usuario');

      const fileExt = selectedFile.name.split('.').pop();
      const fileName = `${Date.now()}.${fileExt}`;
      const filePath = `${cedulaLimpia}/avatar/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('profile-photos')
        .upload(filePath, selectedFile, { cacheControl: '3600', upsert: true });
      if (uploadError) throw uploadError;

      setProfilePhotoUrl(filePath);
      await supabase.from('perfil_usuario').update({ avatar_url: filePath }).eq('id_usuario', authUser.id);
      window.dispatchEvent(new CustomEvent('profilePhotoUpdated'));
      showAlert("Éxito", "Foto de perfil actualizada correctamente", "success");
      setShowProfilePhotoModal(false);
      setSelectedFile(null);
    } catch (error) {
      console.error('Error uploading photo:', error);
      showAlert("Error", "Error al subir la foto. Inténtalo de nuevo.", "danger");
    } finally {
      setUploadingPhoto(false);
    }
  };

  const handleUploadDocument = async () => {
    if (!selectedDocumentFile) return;
    setUploadingDocument(true);
    try {
      const cedulaLimpia = cedula.replace(/[^0-9]/g, '');
      if (!cedulaLimpia) throw new Error('No se encontró la cédula del usuario');

      // 1. Obtener la URL actual del documento (si existe)
      const currentDocUrl = selectedDocumentType === 'cedula' ? fotoCedulaUrl : soporteRifUrl;

      // 2. Si existe, eliminar el archivo anterior del Storage
      if (currentDocUrl) {
        // Determinar bucket y ruta
        let bucket = null;
        let path = currentDocUrl;

        // Si es URL pública, extraer bucket y ruta
        const buckets = ['profile-photos', 'documentos_consejos', 'documentos_comuna'];
        for (const b of buckets) {
          const searchString = `/storage/v1/object/public/${b}/`;
          if (currentDocUrl.includes(searchString)) {
            bucket = b;
            path = currentDocUrl.substring(currentDocUrl.indexOf(searchString) + searchString.length);
            break;
          }
        }

        // Si no se encontró bucket (quizá es ruta relativa), intentar adivinar
        if (!bucket) {
          if (currentDocUrl.match(/^\d+\/cedula\//) || currentDocUrl.match(/^\d+\/rif\//)) {
            bucket = 'profile-photos';
          } else if (currentDocUrl.match(/^\d+\/voceros\//)) {
            bucket = 'documentos_consejos';
          } else if (currentDocUrl.match(/^\d+\/responsables\//)) {
            bucket = 'documentos_comuna';
          }
        }

        if (bucket) {
          // Limpiar posibles caracteres iniciales
          path = path.replace(/^\/+/, '');
          const { error: deleteError } = await supabase.storage
            .from(bucket)
            .remove([path]);
          if (deleteError) {
            console.error(`Error eliminando archivo antiguo (${bucket}/${path}):`, deleteError.message);
            // No detenemos el proceso, solo logueamos
          } else {
            console.log(`Archivo antiguo eliminado: ${bucket}/${path}`);
          }
        }
      }

      // 3. Subir el nuevo archivo a profile-photos
      const fileExt = selectedDocumentFile.name.split('.').pop();
      const fileName = `${Date.now()}.${fileExt}`;
      const tipoCarpeta = selectedDocumentType === 'cedula' ? 'cedula' : 'rif';
      const filePath = `${cedulaLimpia}/${tipoCarpeta}/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('profile-photos')
        .upload(filePath, selectedDocumentFile, { cacheControl: '3600', upsert: true });
      if (uploadError) throw uploadError;

      // 4. Actualizar perfil_usuario
      const updateData: any = {};
      if (selectedDocumentType === 'cedula') {
        updateData.foto_cedula_url = filePath;
        setFotoCedulaUrl(filePath);
      } else {
        updateData.soporte_rif_url = filePath;
        setSoporteRifUrl(filePath);
      }
      await supabase.from('perfil_usuario').update(updateData).eq('id_usuario', authUser.id);

      // 5. Sincronizar con responsables_gestion_comuna si es comuna
      const userRole = authUser?.role || authUser?.rolNombre || 'consejo_comunal';
      if (userRole === 'comuna' && comunaId) {
        const cedulaNormalizada = normalizeCedula(cedula);
        const { data: responsable } = await supabase
          .from('responsables_gestion_comuna')
          .select('id_responsable')
          .eq('id_comuna', comunaId)
          .eq('cedula', cedulaNormalizada)
          .maybeSingle();
        if (responsable) {
          const docUpdate = selectedDocumentType === 'cedula'
            ? { cedula_url: filePath }
            : { rif_url: filePath };
          await supabase
            .from('responsables_gestion_comuna')
            .update(docUpdate)
            .eq('id_responsable', responsable.id_responsable);
        }
      }

      // 6. Sincronizar con voceros si es consejo
      if (userRole === 'consejo_comunal' && consejoId) {
        const cedulaNormalizada = normalizeCedula(cedula);
        const { data: vocero } = await supabase
          .from('voceros')
          .select('id_vocero')
          .eq('id_consejo', consejoId)
          .eq('cedula', cedulaNormalizada)
          .maybeSingle();
        if (vocero) {
          const docUpdate = selectedDocumentType === 'cedula'
            ? { cedula_url: filePath }
            : { rif_url: filePath };
          await supabase
            .from('voceros')
            .update(docUpdate)
            .eq('id_vocero', vocero.id_vocero);
        }
      }

      await cargarPerfil();
      showAlert("Éxito", "Documento subido correctamente", "success");
      setShowDocumentModal(false);
      setSelectedDocumentFile(null);
    } catch (error) {
      console.error('Error uploading document:', error);
      showAlert("Error", "Error al subir el documento. Inténtalo de nuevo.", "danger");
    } finally {
      setUploadingDocument(false);
    }
  };

  const updateRifCompleto = () => {
    const digitoVerificador = rifTipo === 'G' ? '0' : '1';
    setRif(`${rifTipo}-${rifNumero}-${digitoVerificador}`);
  };

  useEffect(() => {
    if (rifNumero) updateRifCompleto();
  }, [rifTipo, rifNumero]);

  useEffect(() => {
    const loadProfilePhoto = async () => {
      if (!profilePhotoUrl) {
        setProfilePhotoSignedUrl(null);
        return;
      }
      const signed = await getSignedUrlFromPublicUrl(profilePhotoUrl);
      setProfilePhotoSignedUrl(signed);
    };
    loadProfilePhoto();
  }, [profilePhotoUrl]);

  const handleSaveData = async () => {
    try {
      const updateData: any = { telefono: phone, email: email, updated_at: new Date().toISOString() };
      if (rifNumero) { updateData.rif = rif; updateData.rif_expiration = rifExpiration; }
      
      // Actualizar perfil_usuario
      const { error } = await supabase.from('perfil_usuario').update(updateData).eq('id_usuario', authUser.id);
      if (error) throw error;
      
      // Sincronizar con responsables_gestion_comuna si el rol es comuna y ya existe
      const userRole = authUser?.role || authUser?.rolNombre || 'consejo_comunal';
      if (userRole === 'comuna' && responsableExists && comunaId) {
        const cedulaNormalizada = normalizeCedula(cedula);
        const updateResponsable: any = {
          nombre_g: firstName,
          apellido_g: lastName,
          telefono: phone || null,
          rif_url: soporteRifUrl || null,
          cedula_url: fotoCedulaUrl || null,
          rif_fecha_vencimiento: rifExpiration || null,
          rif_ultima_actualizacion: new Date().toISOString(),
          updated_at: new Date().toISOString()
        };
        if (rif) updateResponsable.rif_url = soporteRifUrl;
        
        const { error: respError } = await supabase
          .from('responsables_gestion_comuna')
          .update(updateResponsable)
          .eq('id_comuna', comunaId)
          .eq('cedula', cedulaNormalizada);
        if (respError) console.error('Error actualizando responsable:', respError);
      }
      
      // Sincronizar con voceros si el rol es consejo_comunal y ya existe vocero
      if (userRole === 'consejo_comunal' && voceroExists && consejoId) {
        const cedulaNormalizada = normalizeCedula(cedula);
        const nombreCompleto = `${firstName} ${lastName}`.trim();
        const telefonoCompleto = phone || null;
        const updateVocero: any = {
          nombre_completo: nombreCompleto,
          telefono: telefonoCompleto,
          cedula_url: fotoCedulaUrl || null,
          rif_url: soporteRifUrl || null,
          updated_at: new Date().toISOString()
        };
        
        const { error: voceroError } = await supabase
          .from('voceros')
          .update(updateVocero)
          .eq('id_consejo', consejoId)
          .eq('cedula', cedulaNormalizada);
        if (voceroError) console.error('Error actualizando vocero:', voceroError);
      }
      
      setIsSaved(true);
      await cargarPerfil();
      showAlert("Éxito", "Datos guardados correctamente", "success");
    } catch (error) {
      console.error('Error saving data:', error);
      showAlert("Error", "Error al guardar los datos", "danger");
    }
  };

  // Detectar si el usuario es auxiliar de consejo comunal
  useEffect(() => {
    const verificarAuxiliarConsejo = async () => {
      if (!consejoId || !authUser?.id) return;
      const { data: auxData, error } = await supabase
        .from('voceros')
        .select('es_auxiliar, id_consejo, nombre_completo')
        .eq('id_consejo', consejoId)
        .eq('id_usuario', authUser.id)
        .maybeSingle();
      if (!error && auxData) {
        setEsAuxiliarConsejo(auxData.es_auxiliar || false);
        if (auxData.es_auxiliar) {
          // Obtener el nombre del consejo principal (dueño)
          const { data: principal } = await supabase
            .from('datos_consejo_comunal')
            .select('nombre_consejo')
            .eq('id_consejo', consejoId)
            .maybeSingle();
          if (principal) setNombrePrincipalConsejo(principal.nombre_consejo);
        }
      } else {
        setEsAuxiliarConsejo(false);
        setNombrePrincipalConsejo('');
      }
    };
    verificarAuxiliarConsejo();
  }, [consejoId, authUser?.id]);

  const handleEditData = () => setIsSaved(false);

  const validatePasswordStrength = (password: string): { valid: boolean; message: string } => {
    if (password.length < 8) return { valid: false, message: 'Mínimo 8 caracteres' };
    if (!/[a-z]/.test(password)) return { valid: false, message: 'Debe contener al menos una letra minúscula' };
    if (!/[A-Z]/.test(password)) return { valid: false, message: 'Debe contener al menos una letra mayúscula' };
    if (!/\d/.test(password)) return { valid: false, message: 'Debe contener al menos un número' };
    if (!/[!@#$%^&*(),.?":{}|<>]/.test(password)) return { valid: false, message: 'Debe contener al menos un carácter especial' };
    return { valid: true, message: '' };
  };

  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const strength = validatePasswordStrength(passwordData.new);
    if (!strength.valid) { setPasswordErrors(prev => ({ ...prev, new: strength.message })); return; }
    if (passwordData.new !== passwordData.confirm) { setPasswordErrors(prev => ({ ...prev, confirm: 'Las contraseñas no coinciden' })); return; }
    if (!passwordData.current) { setPasswordErrors(prev => ({ ...prev, current: 'Debes ingresar tu contraseña actual' })); return; }
    setChangingPassword(true);
    setPasswordErrors({ current: '', new: '', confirm: '' });
    try {
      const email = authUser.email;
      if (!email) throw new Error('No se encontró el correo del usuario');
      const { error: signInError } = await supabase.auth.signInWithPassword({ email, password: passwordData.current });
      if (signInError) { if (signInError.message.includes('Invalid login credentials')) setPasswordErrors(prev => ({ ...prev, current: 'Contraseña actual incorrecta' })); else throw signInError; return; }
      const { error: updateError } = await supabase.auth.updateUser({ password: passwordData.new });
      if (updateError) throw updateError;
      showAlert("Éxito", "Contraseña actualizada correctamente", "success");
      setShowPasswordModal(false);
      setPasswordData({ current: '', new: '', confirm: '' });
    } catch (error: any) {
      console.error('Error updating password:', error);
      showAlert("Error", error.message || "Error al actualizar la contraseña", "danger");
    } finally {
      setChangingPassword(false);
    }
  };

  const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setPasswordData(prev => ({ ...prev, [name]: value }));
    setPasswordErrors(prev => ({ ...prev, [name]: '' }));
  };

  // 🔥 CORREGIDO: Función que mapea roles a nombres legibles
  const getRoleDisplayName = (role: string) => {
    const roleNames: Record<string, string> = {
      // Roles existentes
      'consejo_comunal': 'VOCERO CONSEJO COMUNAL',
      'comuna': 'RESPONSABLE DE GESTIÓN DE LA COMUNA',
      'sala_autogobierno': 'COORDINADOR SALA',
      'alcaldesa': 'ALCALDESA',
      'secretario': 'SECRETARIO',
      'director': 'DIRECTOR EJECUTIVO',
      'director_digitalizacion': 'DIRECTOR DE DIGITALIZACIÓN',
      'director_tecnologia': 'DIRECTOR DE TECNOLOGÍA',
      'director_comunas': 'DIRECTOR DE COMUNAS',
      'director_adulto_mayor': 'DIRECTOR DE ADULTO MAYOR',
      'admin': 'ADMINISTRADOR',
      // 🔥 Nuevos roles
      'vocero_cc': 'VOCERO DEL CONSEJO COMUNAL',
      'vocero_c': 'VOCERO DE LA COMUNA',
      'coordinador_s': 'COORDINADOR SALA AUTOGOBIERNO',
    };
    return roleNames[role] || role.toUpperCase();
  };

  const formatLastLogin = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('es-VE', { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' });
  };

  // ========== OBTENER DATOS DEL PERFIL Y VERIFICAR REGISTROS ==========
  const cargarPerfil = useCallback(async () => {
    if (!authUser?.id) return;
    setLoading(true);
      
      // Obtener datos del usuario desde la tabla perfil_usuario
      const { data: profileData, error: profileError } = await supabase
        .from('perfil_usuario')
        .select('*')
        .eq('id_usuario', authUser.id)
        .maybeSingle();

      if (profileError) console.error('Error fetching profile:', profileError);
      if (profileData) {
        setFirstName(profileData.nombre || "");
        setLastName(profileData.apellido || "");
        setCedula(profileData.cedula || "");
        setEmail(profileData.email || authUser?.email || "");
        setPhone(profileData.telefono || "");
        setLastLogin(profileData.ultimo_acceso || new Date().toISOString());
        
        if (profileData.rif) {
          const rifMatch = profileData.rif.match(/^([JCG])-?(\d+)-?(\d)$/);
          if (rifMatch) {
            setRifTipo(rifMatch[1] as 'J' | 'C' | 'G');
            setRifNumero(rifMatch[2]);
            setRif(profileData.rif);
          }
        }
        if (profileData.rif_expiration) setRifExpiration(profileData.rif_expiration);
        if (profileData.avatar_url) setProfilePhotoUrl(profileData.avatar_url);
        if (profileData.foto_cedula_url) setFotoCedulaUrl(profileData.foto_cedula_url);
        if (profileData.soporte_rif_url) setSoporteRifUrl(profileData.soporte_rif_url);
      }

      // Obtener nombre de entidad según rol
      let nombre = "";
      const userRole = authUser?.role || authUser?.rolNombre || 'consejo_comunal';
      if (userRole === 'consejo_comunal') {
        const { data } = await supabase.from('datos_consejo_comunal').select('nombre_consejo').or(`id_usuario.eq.${authUser.id},id_usuario_auxiliar.eq.${authUser.id}`).maybeSingle();
        nombre = data?.nombre_consejo || "";
      } else if (userRole === 'comuna') {
        let comunaEncontrada = null;
        const { data: comunaDirecta } = await supabase
          .from('datos_comuna')
          .select('nombre_comuna')
          .eq('id_usuario', authUser.id)
          .maybeSingle();
        
        if (comunaDirecta) {
          comunaEncontrada = comunaDirecta;
        } else if (comunaId) {
          const { data: comunaAux } = await supabase
            .from('datos_comuna')
            .select('nombre_comuna')
            .eq('id_comuna', comunaId)
            .maybeSingle();
          comunaEncontrada = comunaAux;
        }
        nombre = comunaEncontrada?.nombre_comuna || "";
      } else if (userRole === 'director_digitalizacion') {
        nombre = "Dirección de Digitalización";
      } else if (userRole === 'director') {
        nombre = authUser.entity || "";
      } else if (userRole === 'alcaldesa' || userRole === 'secretario') {
        nombre = authUser.entity || "";
      } else {
        // 🔥 ELIMINADO: ya no se muestra "Organización" como fallback
        nombre = "";
      }
      setEntityName(nombre);
      
  // ========== VERIFICAR VOCERO PRINCIPAL (solo para consejo comunal) ==========
  if (userRole === 'consejo_comunal') {
    // Buscar consejo donde el usuario sea dueño o auxiliar
    const { data: consejoData, error: consejoError } = await supabase
      .from('datos_consejo_comunal')
      .select('id_consejo')
      .or(`id_usuario.eq.${authUser.id},id_usuario_auxiliar.eq.${authUser.id}`)
      .maybeSingle();
    if (consejoError) console.error('Error obteniendo consejo:', consejoError);
    else if (consejoData) {
      setConsejoId(consejoData.id_consejo);
      if (cedula) {
        const { data: voceroData, error: voceroError } = await supabase
          .from('voceros')
          .select('id_vocero')
          .eq('id_consejo', consejoData.id_consejo)
          .eq('cedula', cedula)
          .maybeSingle();
        if (voceroError) console.error('Error verificando vocero:', voceroError);
        setVoceroExists(!!voceroData);
      } else {
        setVoceroExists(false);
      }
    } else {
      setConsejoId(null);
      setVoceroExists(false);
    }
  }

      // ========== VERIFICAR RESPONSABLE DE GESTIÓN DE COMUNA (solo para comuna) ==========
      if (userRole === 'comuna') {
        const { data: comunaData, error: comunaError } = await supabase
          .from('datos_comuna')
          .select('id_comuna, nombre_comuna')
          .or(`id_usuario.eq.${authUser.id},id_usuario_auxiliar.eq.${authUser.id}`)
          .maybeSingle();
        if (comunaError) console.error('Error obteniendo comuna:', comunaError);
        else if (comunaData) {
          setComunaId(comunaData.id_comuna);
          if (profileData?.cedula) {
            const cedulaNormalizada = normalizeCedula(profileData.cedula);
            const { data: responsableData, error: respError } = await supabase
              .from('responsables_gestion_comuna')
              .select('id_responsable')
              .eq('id_comuna', comunaData.id_comuna)
              .eq('cedula', cedulaNormalizada)
              .maybeSingle();
            if (respError) console.error('Error verificando responsable:', respError);
            setResponsableExists(!!responsableData);
          } else {
            setResponsableExists(false);
          }
        } else {
          setComunaId(null);
          setResponsableExists(false);
        }
      }
      
      setLoading(false);
  }, [authUser]);

  useEffect(() => {
    cargarPerfil();
  }, [cargarPerfil]);

  // Detectar si el usuario es auxiliar
  useEffect(() => {
    const verificarAuxiliar = async () => {
      if (!comunaId || !authUser?.id) return;
      const { data: auxData, error } = await supabase
        .from('responsables_gestion_comuna')
        .select('es_auxiliar, nombre_g, apellido_g')
        .eq('id_comuna', comunaId)
        .eq('id_usuario', authUser.id)
        .maybeSingle();
      if (!error && auxData) {
        setEsAuxiliar(auxData.es_auxiliar || false);
        if (auxData.es_auxiliar) {
          const { data: principal } = await supabase
            .from('responsables_gestion_comuna')
            .select('nombre_g, apellido_g')
            .eq('id_comuna', comunaId)
            .eq('es_auxiliar', false)
            .maybeSingle();
          if (principal) setNombrePrincipal(`${principal.nombre_g} ${principal.apellido_g}`);
        }
      } else {
        setEsAuxiliar(false);
        setNombrePrincipal('');
      }
    };
    verificarAuxiliar();
  }, [comunaId, authUser?.id]);

  // Efectos para actualizar existencia cuando cambien IDs o cédula
  useEffect(() => {
    const verificarVocero = async () => {
      if (!consejoId || !cedula) {
        setVoceroExists(false);
        return;
      }
      const { data, error } = await supabase
        .from('voceros')
        .select('id_vocero')
        .eq('id_consejo', consejoId)
        .eq('cedula', cedula)
        .maybeSingle();
      if (error) console.error('Error verificando vocero:', error);
      setVoceroExists(!!data);
    };
    verificarVocero();
  }, [consejoId, cedula]);

  useEffect(() => {
    const verificarResponsable = async () => {
      if (!comunaId || !cedula) {
        setResponsableExists(false);
        return;
      }
      const cedulaNormalizada = normalizeCedula(cedula);
      const { data, error } = await supabase
        .from('responsables_gestion_comuna')
        .select('id_responsable')
        .eq('id_comuna', comunaId)
        .eq('cedula', cedulaNormalizada)
        .maybeSingle();
      if (error) console.error('Error verificando responsable:', error);
      setResponsableExists(!!data);
    };
    verificarResponsable();
  }, [comunaId, cedula]);

  // ========== FUNCIONES PARA CREAR VOCERO (CONSEJO) ==========
  const crearVoceroDesdePerfil = async () => {
    if (!authUser?.id || !consejoId || !cedula) {
      showAlert("Alert", "Debes completar primero el registro del consejo comunal y tener cédula registrada.", "warning");
      return;
    }
    
    const { data: existing } = await supabase
      .from('voceros')
      .select('id_vocero')
      .eq('id_consejo', consejoId)
      .eq('cedula', cedula)
      .maybeSingle();
    if (existing) {
      showAlert("Alert", "Ya existe un vocero con esta cédula en este consejo.", "warning");
      setVoceroExists(true);
      return;
    }

    setCreatingVocero(true);
    try {
      const nombreCompleto = `${firstName} ${lastName}`.trim();
      const telefonoCompleto = phone || null;
      const nuevoVocero = {
        id_consejo: consejoId,
        nombre_completo: nombreCompleto,
        cedula: cedula,
        telefono: telefonoCompleto,
        unidad: 'Unidad Ejecutiva',
        comite: 'Comité de planificación comunal y sistema de indicadores de seguimiento',
        tipo: 'Principal',
        cedula_url: fotoCedulaUrl || null,
        rif_url: soporteRifUrl || null,
      };
      const { error } = await supabase.from('voceros').insert([nuevoVocero]);
      if (error) throw error;
      showAlert("Éxito", "Perfil de vocero principal creado exitosamente.", "success");
      setVoceroExists(true);
    } catch (error: any) {
      console.error(error);
      showAlert("Error", error.message || "Error al crear el perfil de vocero", "danger");
    } finally {
      setCreatingVocero(false);
    }
  };

  // ========== FUNCIONES PARA CREAR RESPONSABLE DE COMUNA ==========
  const crearResponsableDesdePerfil = async () => {
    if (!authUser?.id || !comunaId || !cedula) {
      showAlert("Alert", "Debes completar primero el registro de la comuna y tener cédula registrada.", "warning");
      return;
    }
    if (!responsableForm.unidad || !responsableForm.tipo) {
      showAlert("Alert", "Los campos Unidad y Tipo son obligatorios.", "warning");
      return;
    }

    setCreatingResponsable(true);
    try {
      const cedulaNormalizada = normalizeCedula(cedula);
      const nuevoResponsable = {
        id_comuna: comunaId,
        nombre_g: firstName,
        apellido_g: lastName,
        cedula: cedulaNormalizada,
        unidad: responsableForm.unidad,
        tipo: responsableForm.tipo,
        profesion: responsableForm.profesion || null,
        grado_instruccion: responsableForm.grado_instruccion || null,
        telefono: phone || null,
        rif_url: soporteRifUrl || null,
        cedula_url: fotoCedulaUrl || null,
        rif_fecha_vencimiento: rifExpiration || null,
        rif_ultima_actualizacion: new Date().toISOString(),
      };
      const { error } = await supabase.from('responsables_gestion_comuna').insert([nuevoResponsable]);
      if (error) throw error;
      showAlert("Éxito", "Perfil de responsable de gestión creado exitosamente.", "success");
      setResponsableExists(true);
      setShowResponsableModal(false);
      setResponsableForm({ unidad: '', tipo: 'Principal', profesion: '', grado_instruccion: '' });
    } catch (error: any) {
      console.error(error);
      showAlert("Error", error.message || "Error al crear el perfil de responsable", "danger");
    } finally {
      setCreatingResponsable(false);
    }
  };

  // ========== RENDER ==========
  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[60vh]">
        <Loader2 className="animate-spin text-brand-primary" size={48} />
      </div>
    );
  }

  const userRole = authUser?.role || authUser?.rolNombre || 'consejo_comunal';
  
  // CORREGIDO: Incluir director_digitalizacion en la pestaña de organización
  const showOrganizationTab = userRole === 'alcaldesa' || 
                               userRole === 'secretario' || 
                               userRole === 'director_digitalizacion' ||
                               userRole === 'director_tecnologia' ||
                               userRole === 'director_comunas' ||
                               userRole === 'director_adulto_mayor' ||
                               userRole === 'admin';
  
  const tabs = [
    { id: "personales", label: "Datos Personales", icon: User },
    { id: "seguridad", label: "Seguridad y Notificaciones", icon: ShieldCheck },
  ];

  return (
    <div className="space-y-8 max-w-6xl mx-auto w-full">
      {/* Cabecera de perfil */}
      <div className="bg-white rounded-[2.5rem] p-8 border border-gray-100 shadow-sm overflow-hidden relative">
        <div className="absolute top-0 right-0 w-32 h-32 bg-brand-primary/5 rounded-full -mr-16 -mt-16 blur-3xl" />
        <div className="flex flex-col md:flex-row items-center gap-8 relative z-10">
          <div className="relative group cursor-pointer" onClick={() => setShowProfilePhotoModal(true)}>
            <div className="w-24 h-24 rounded-full bg-linear-to-br from-gray-100 to-gray-200 flex items-center justify-center border-4 border-white shadow-lg group-hover:shadow-xl transition-all duration-300 overflow-hidden">
              {profilePhotoSignedUrl ? (
                <img src={profilePhotoSignedUrl} alt="Foto de perfil" className="w-full h-full object-cover rounded-full" />
              ) : (
                <User className="h-12 w-12 text-gray-400" />
              )}
              <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center rounded-full">
                <Camera className="h-6 w-6 text-white" />
              </div>
            </div>
          </div>

          <div className="text-center md:text-left flex-1">
            <div className="flex flex-col md:flex-row md:items-center gap-3 mb-2">
              <h2 className="text-3xl font-black text-slate-800 italic uppercase tracking-tighter">
                {firstName} {lastName}
              </h2>
              <span className="px-4 py-1.5 rounded-full bg-linear-to-r from-brand-primary to-blue-600 text-white text-[11px] font-black uppercase tracking-widest shadow-lg self-center">
                { esAuxiliar 
                ? 'RESPONSABLE AUXILIAR' 
                : (esAuxiliarConsejo ? 'VOCERO AUXILIAR' : getRoleDisplayName(userRole))}
              </span>
            </div>
            {/* 🔥 SOLO MOSTRAR ENTITYNAME SI NO ESTÁ VACÍO */}
            {entityName && (
              <p className="text-slate-400 font-bold uppercase tracking-widest text-xs flex items-center justify-center md:justify-start gap-2">
                <Building2 className="h-3 w-3" /> {entityName}
              </p>
            )}
            <div className="mt-4 flex flex-wrap justify-center md:justify-start gap-2">
              <div className="flex items-center gap-2 px-3 py-1.5 bg-emerald-50 rounded-lg text-emerald-600 text-[10px] font-black uppercase">
                <CheckCircle2 className="h-3 w-3" /> Identidad Verificada
              </div>
            </div>
          </div>
          <div className="hidden lg:block text-right">
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Última Sesión</p>
            <p className="text-sm font-black text-slate-800 italic">{formatLastLogin(lastLogin)}</p>
          </div>
        </div>
      </div>

      {/* Pestañas */}
      <div className="flex gap-2 p-1.5 bg-white rounded-2xl border border-gray-100 shadow-sm w-fit flex-wrap">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={cn(
              "flex items-center gap-2 px-6 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all",
              activeTab === tab.id 
                ? "bg-brand-primary text-white shadow-lg shadow-brand-primary/20" 
                : "text-slate-400 hover:bg-gray-50"
            )}
          >
            <tab.icon className="h-4 w-4" />
            {tab.label}
          </button>
        ))}
      </div>

      {/* Contenido dinámico */}
      <AnimatePresence mode="wait">
        <motion.div
          key={activeTab}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          transition={{ duration: 0.2 }}
        >
          {activeTab === "personales" && (
            <div className="bg-white p-8 rounded-[2.5rem] border border-gray-100 shadow-sm">
              <h3 className="text-sm font-black text-slate-800 uppercase italic tracking-widest border-b border-gray-50 pb-4 flex items-center gap-2">
                <User className="h-4 w-4 text-brand-primary" /> Datos de Contacto
              </h3>
              
              {/* Banner para vocero faltante (solo consejo comunal) */}
              {userRole === 'consejo_comunal' && !voceroExists && (
                <div className="mt-6 mb-4 p-4 rounded-2xl bg-amber-50 border border-amber-200">
                  <div className="flex items-start gap-3">
                    <AlertCircle className="h-5 w-5 text-amber-600 shrink-0 mt-0.5" />
                    <div className="flex-1">
                      <p className="text-sm font-black text-amber-800 uppercase tracking-wider">Perfil de vocero no registrado</p>
                      <p className="text-xs text-amber-700 mt-1">
                        Tu cuenta de usuario no está vinculada como vocero del consejo comunal. 
                        Para poder gestionar el consejo (voceros, censo, proyectos, etc.), debes crear tu perfil de vocero principal.
                      </p>
                      <button
                        onClick={crearVoceroDesdePerfil}
                        disabled={creatingVocero || !consejoId}
                        className="mt-3 px-4 py-2 bg-amber-600 text-white text-[10px] font-black uppercase rounded-xl hover:bg-amber-700 transition-all flex items-center gap-2"
                      >
                        {creatingVocero ? <Loader2 className="h-3 w-3 animate-spin" /> : <UserPlus className="h-3 w-3" />}
                        {creatingVocero ? "Creando..." : "Completar registro como vocero principal"}
                      </button>
                      {!consejoId && (
                        <p className="text-xs text-amber-600 mt-2">* Antes debes completar el registro del consejo comunal en "Datos Legales".</p>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* Banner para responsable de comuna faltante */}
              {userRole === 'comuna' && !responsableExists && comunaId && (
                <div className="mt-6 mb-4 p-4 rounded-2xl bg-amber-50 border border-amber-200">
                  <div className="flex items-start gap-3">
                    <AlertCircle className="h-5 w-5 text-amber-600 shrink-0 mt-0.5" />
                    <div className="flex-1">
                      <p className="text-sm font-black text-amber-800 uppercase tracking-wider">Perfil de responsable de gestión no registrado</p>
                      <p className="text-xs text-amber-700 mt-1">
                        Tu cuenta de usuario no está vinculada como responsable de gestión de la comuna. 
                        Para gestionar la comuna (censos, proyectos, etc.), debes crear tu perfil de responsable.
                      </p>
                      <button
                        onClick={() => setShowResponsableModal(true)}
                        className="mt-3 px-4 py-2 bg-amber-600 text-white text-[10px] font-black uppercase rounded-xl hover:bg-amber-700 transition-all flex items-center gap-2"
                      >
                        <UserPlus className="h-3 w-3" />
                        Completar registro como responsable
                      </button>
                    </div>
                  </div>
                </div>
              )}

              <div className="grid gap-6 md:grid-cols-3 mt-6">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase">Nombre</label>
                  <div className="flex items-center gap-2 p-4 rounded-2xl bg-gray-100 border border-gray-200 text-sm font-bold text-slate-500">
                    <User className="h-4 w-4" /> {firstName || "No registrado"}
                  </div>
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase">Apellido</label>
                  <div className="flex items-center gap-2 p-4 rounded-2xl bg-gray-100 border border-gray-200 text-sm font-bold text-slate-500">
                    <User className="h-4 w-4" /> {lastName || "No registrado"}
                  </div>
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase">Cédula</label>
                  <div className="flex items-center gap-2 p-4 rounded-2xl bg-gray-100 border border-gray-200 text-sm font-bold text-slate-500">
                    <CreditCard className="h-4 w-4" /> {cedula || "No registrada"}
                  </div>
                </div>
              </div>
              
              <div className="grid gap-6 md:grid-cols-2 mt-6">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase">Teléfono</label>
                  <div className={cn(
                    "flex items-center p-4 rounded-2xl border text-sm font-bold",
                    isSaved ? "bg-gray-100 border-gray-200 text-slate-400" : "bg-white ring-1 ring-gray-100 focus-within:ring-2 focus-within:ring-brand-primary/20"
                  )}>
                    <Smartphone className="h-4 w-4 mr-2 shrink-0 text-slate-400" />
                    {isSaved ? (
                      <span>{phone || "No registrado"}</span>
                    ) : (
                      <input type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="0412-1234567" className="flex-1 bg-transparent outline-none" />
                    )}
                  </div>
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase">Correo Electrónico</label>
                  <div className={cn(
                    "flex items-center p-4 rounded-2xl border text-sm font-bold",
                    isSaved ? "bg-gray-100 border-gray-200 text-slate-400" : "bg-white ring-1 ring-gray-100 focus-within:ring-2 focus-within:ring-brand-primary/20"
                  )}>
                    <User className="h-4 w-4 mr-2 shrink-0 text-slate-400" />
                    {isSaved ? (
                      <span>{email}</span>
                    ) : (
                      <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} className="flex-1 bg-transparent outline-none" />
                    )}
                  </div>
                </div>
              </div>

              <div className="grid gap-6 md:grid-cols-2 mt-6">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase">RIF</label>
                  <div className={cn(
                    "flex items-center gap-2 p-4 rounded-2xl border text-sm font-bold",
                    isSaved ? "bg-gray-100 border-gray-200 text-slate-400" : "bg-white border-gray-100 focus-within:border-brand-primary/30"
                  )}>
                    <CreditCard className="h-4 w-4 text-slate-400" />
                    {!isSaved ? (
                      <div className="flex items-center gap-2 flex-1">
                        <select value={rifTipo} onChange={(e) => setRifTipo(e.target.value as 'J' | 'C' | 'G')} className="w-14 h-10 bg-gray-50 border border-gray-200 rounded-xl text-sm font-bold text-center focus:ring-2 focus:ring-brand-primary/20 outline-none">
                          <option value="J">J</option>
                          <option value="C">C</option>
                          <option value="G">G</option>
                        </select>
                        <span className="text-gray-300 font-black">-</span>
                        <input type="text" value={rifNumero} onChange={(e) => setRifNumero(e.target.value.replace(/\D/g, ''))} placeholder="12345678" maxLength={9} className="flex-1 bg-transparent outline-none" />
                        <span className="text-gray-300 font-black">-</span>
                        <span className="w-6 text-center font-black">{rifTipo === 'G' ? '0' : '1'}</span>
                      </div>
                    ) : (
                      <span>{rif || "No registrado"}</span>
                    )}
                  </div>
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase">Fecha Vencimiento RIF</label>
                  <div className={cn(
                    "flex items-center gap-2 p-4 rounded-2xl border text-sm font-bold",
                    isSaved ? "bg-gray-100 border-gray-200 text-slate-400" : "bg-white border-gray-100 focus-within:border-brand-primary/30"
                  )}>
                    <Calendar className="h-4 w-4 text-slate-400" />
                    {isSaved ? (
                      <span>{rifExpiration || "No registrada"}</span>
                    ) : (
                      <input type="date" value={rifExpiration} onChange={(e) => setRifExpiration(e.target.value)} className="flex-1 bg-transparent outline-none text-sm" />
                    )}
                  </div>
                </div>
              </div>

              <div className="grid gap-6 md:grid-cols-2 mt-6">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase">Foto de Cédula</label>
                  {fotoCedulaUrl ? (
                    <div className="flex items-center gap-2 p-3 rounded-2xl bg-emerald-50 border border-emerald-200">
                      <a
                        href="#"
                        onClick={async (e) => {
                          e.preventDefault();
                          const url = await getSignedUrlFromPublicUrl(fotoCedulaUrl);
                          if (url) window.open(url, '_blank');
                          else showAlert("Error", "No se pudo acceder al documento", "danger");
                        }}
                        className="flex-1 text-sm font-bold text-emerald-600 hover:underline truncate"
                      >
                        Ver documento
                      </a>
                      <button onClick={() => { setSelectedDocumentType('cedula'); setShowDocumentModal(true); }} className="px-3 py-1.5 bg-emerald-600 text-white text-[9px] font-black uppercase rounded-xl hover:bg-emerald-700 transition-colors">Reemplazar</button>
                    </div>
                  ) : (
                    <button onClick={() => { setSelectedDocumentType('cedula'); setShowDocumentModal(true); }} className="flex items-center justify-center gap-2 w-full p-4 rounded-2xl bg-emerald-50/50 border-2 border-dashed border-emerald-200 text-sm font-bold text-emerald-600 hover:bg-emerald-50 hover:border-emerald-300 transition-all group"><Upload className="h-4 w-4 group-hover:-translate-y-0.5 transition-transform" /> Subir Cédula</button>
                  )}
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase">Soporte RIF</label>
                  {soporteRifUrl ? (
                    <div className="flex items-center gap-2 p-3 rounded-2xl bg-emerald-50 border border-emerald-200">
                      <a
                        href="#"
                        onClick={async (e) => {
                          e.preventDefault();
                          const url = await getSignedUrlFromPublicUrl(soporteRifUrl);
                          if (url) window.open(url, '_blank');
                          else showAlert("Error", "No se pudo acceder al documento", "danger");
                        }}
                        className="flex-1 text-sm font-bold text-emerald-600 hover:underline truncate"
                      >
                        Ver documento
                      </a>
                      <button onClick={() => { setSelectedDocumentType('rif'); setSelectedDocumentFile(null); setShowDocumentModal(true); }} className="px-3 py-1.5 bg-emerald-600 text-white text-[9px] font-black uppercase rounded-xl hover:bg-emerald-700 transition-colors">Reemplazar</button>
                    </div>
                  ) : (
                    <button onClick={() => { setSelectedDocumentType('rif'); setSelectedDocumentFile(null); setShowDocumentModal(true); }} className="flex items-center justify-center gap-2 w-full p-4 rounded-2xl bg-emerald-50/50 border-2 border-dashed border-emerald-200 text-sm font-bold text-emerald-600 hover:bg-emerald-50 hover:border-emerald-300 transition-all group"><Upload className="h-4 w-4 group-hover:-translate-y-0.5 transition-transform" /> Subir RIF</button>
                  )}
                </div>
              </div>

              <button onClick={isSaved ? handleEditData : handleSaveData} className={cn("w-full mt-6 py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all shadow-lg flex items-center justify-center gap-2", !isSaved ? "bg-brand-primary text-white hover:bg-brand-primary/90 hover:shadow-xl" : "bg-gray-100 text-gray-400 border border-gray-200 cursor-pointer hover:bg-gray-200")}>
                {!isSaved ? "Guardar Cambios" : "Actualizar Datos"}
              </button>
            </div>
          )}

          {activeTab === "seguridad" && (
            <div className="grid gap-6 md:grid-cols-2">
              <div className="bg-white p-8 rounded-[2.5rem] border border-gray-100 shadow-sm space-y-6">
                <h3 className="text-sm font-black text-slate-800 uppercase italic tracking-widest border-b border-gray-50 pb-4 flex items-center gap-2">
                  <Lock className="h-4 w-4 text-brand-primary" /> Seguridad de Cuenta
                </h3>
                <button onClick={() => setShowPasswordModal(true)} className="w-full flex items-center justify-between p-4 rounded-2xl bg-linear-to-r from-orange-50 to-amber-50 hover:from-orange-100 hover:to-amber-100 border border-orange-100 transition-all group">
                  <div className="flex items-center gap-4">
                    <Lock className="h-5 w-5 text-orange-500" />
                    <div className="text-left">
                      <p className="text-[10px] font-black text-slate-800 uppercase">Cambiar Contraseña</p>
                      <p className="text-[9px] text-slate-400 font-bold uppercase">Actualiza tu contraseña</p>
                    </div>
                  </div>
                  <ChevronRight className="h-4 w-4 text-slate-300 group-hover:translate-x-1 transition-transform" />
                </button>
              </div>
            </div>
          )}
        </motion.div>
      </AnimatePresence>

      {/* ========== MODALES ========== */}
      {/* Modal cambio de contraseña */}
      <AnimatePresence>
        {showPasswordModal && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={() => setShowPasswordModal(false)}>
            <div className="bg-white rounded-3xl p-8 max-w-md w-full shadow-2xl border border-gray-100" onClick={e => e.stopPropagation()}>
              <h3 className="text-xl font-black text-slate-800 uppercase tracking-wider mb-6">Cambiar Contraseña</h3>
              <form onSubmit={handlePasswordSubmit} className="space-y-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-slate-500 uppercase">Contraseña Actual</label>
                  <div className="relative">
                    <input type={showCurrentPassword ? "text" : "password"} name="current" value={passwordData.current} onChange={handlePasswordChange} className="w-full p-4 rounded-2xl bg-gray-50 border border-gray-200 pr-12" placeholder="Ingresa tu contraseña actual" autoComplete="current-password" />
                    <button type="button" onClick={() => setShowCurrentPassword(!showCurrentPassword)} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400">{showCurrentPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}</button>
                  </div>
                  {passwordErrors.current && <p className="text-red-500 text-[10px]">{passwordErrors.current}</p>}
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-slate-500 uppercase">Nueva Contraseña</label>
                  <div className="relative">
                    <input type={showNewPassword ? "text" : "password"} name="new" value={passwordData.new} onChange={handlePasswordChange} className="w-full p-4 rounded-2xl bg-gray-50 border border-gray-200 pr-12" placeholder="Mínimo 8 caracteres, mayúscula, minúscula, número y especial" autoComplete="new-password" />
                    <button type="button" onClick={() => setShowNewPassword(!showNewPassword)} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400">{showNewPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}</button>
                  </div>
                  <div className="mt-1 text-[9px] text-slate-500 space-y-0.5">
                    <p className={passwordData.new && /[a-z]/.test(passwordData.new) ? 'text-emerald-600' : ''}>✓ Letra minúscula</p>
                    <p className={passwordData.new && /[A-Z]/.test(passwordData.new) ? 'text-emerald-600' : ''}>✓ Letra mayúscula</p>
                    <p className={passwordData.new && /\d/.test(passwordData.new) ? 'text-emerald-600' : ''}>✓ Número</p>
                    <p className={passwordData.new && /[!@#$%^&*(),.?":{}|<>]/.test(passwordData.new) ? 'text-emerald-600' : ''}>✓ Carácter especial</p>
                    <p className={passwordData.new.length >= 8 ? 'text-emerald-600' : ''}>✓ Mínimo 8 caracteres</p>
                  </div>
                  {passwordErrors.new && <p className="text-red-500 text-[10px]">{passwordErrors.new}</p>}
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-slate-500 uppercase">Confirmar Nueva Contraseña</label>
                  <div className="relative">
                    <input type={showConfirmPassword ? "text" : "password"} name="confirm" value={passwordData.confirm} onChange={handlePasswordChange} className="w-full p-4 rounded-2xl bg-gray-50 border border-gray-200 pr-12" autoComplete="new-password" />
                    <button type="button" onClick={() => setShowConfirmPassword(!showConfirmPassword)} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400">{showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}</button>
                  </div>
                  {passwordErrors.confirm && <p className="text-red-500 text-[10px]">{passwordErrors.confirm}</p>}
                </div>
                <div className="flex gap-3 pt-4">
                  <button type="submit" disabled={changingPassword} className="flex-1 py-4 bg-brand-primary text-white rounded-2xl text-[11px] font-black uppercase disabled:opacity-50 flex items-center justify-center gap-2">{changingPassword && <Loader2 className="h-4 w-4 animate-spin" />}{changingPassword ? "Verificando..." : "Actualizar"}</button>
                  <button type="button" onClick={() => setShowPasswordModal(false)} disabled={changingPassword} className="px-6 py-4 border border-gray-200 rounded-2xl text-sm font-black">Cancelar</button>
                </div>
              </form>
            </div>
          </div>
        )}
      </AnimatePresence>

      {/* Modal foto de perfil */}
      <AnimatePresence>
        {showProfilePhotoModal && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={() => setShowProfilePhotoModal(false)}>
            <div className="bg-white rounded-3xl p-8 max-w-md w-full shadow-2xl border border-gray-100" onClick={e => e.stopPropagation()}>
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-black text-slate-800 uppercase tracking-wider">Foto de Perfil</h3>
                <button onClick={() => setShowProfilePhotoModal(false)} className="p-2 hover:bg-gray-100 rounded-xl"><X className="h-5 w-5 text-slate-400" /></button>
              </div>
              <div className="mb-6 text-center">
                <div className="w-32 h-32 mx-auto rounded-full bg-linear-to-br from-gray-100 to-gray-200 flex items-center justify-center border-4 border-white shadow-lg mb-4 overflow-hidden">
                  {selectedFile ? <img src={URL.createObjectURL(selectedFile)} alt="Vista previa" className="w-full h-full object-cover" /> : profilePhotoSignedUrl ? <img src={profilePhotoSignedUrl} alt="Foto actual" className="w-full h-full object-cover" /> : <User className="h-12 w-12 text-gray-400" />}
                </div>
              </div>
              <div className={cn("border-2 border-dashed rounded-2xl p-8 text-center transition-all cursor-pointer", dragActive ? "border-brand-primary bg-brand-primary/10" : "border-gray-200 bg-gray-50")} onDragEnter={handleDrag} onDragLeave={handleDrag} onDragOver={handleDrag} onDrop={handleDrop} onClick={() => document.getElementById('file-upload')?.click()}>
                <input id="file-upload" type="file" accept="image/*" className="hidden" onChange={handleFileSelect} />
                <ImagePlus className="h-12 w-12 mx-auto text-gray-400 mb-4" />
                <p className="text-sm font-black text-slate-700 mb-1">Haz clic o arrastra una imagen</p>
                <p className="text-xs text-slate-400 font-bold uppercase">JPG, PNG • Máx. 5MB</p>
              </div>
              <div className="flex gap-3 pt-6">
                <button onClick={handleUploadProfilePhoto} disabled={!selectedFile || uploadingPhoto} className="flex-1 py-4 bg-brand-primary text-white rounded-2xl text-[11px] font-black uppercase disabled:opacity-50 flex items-center justify-center gap-2">{uploadingPhoto ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}{uploadingPhoto ? "Subiendo..." : (profilePhotoUrl ? "Cambiar Foto" : "Establecer Foto")}</button>
                <button onClick={() => setShowProfilePhotoModal(false)} disabled={uploadingPhoto} className="px-6 py-4 border border-gray-200 rounded-2xl text-sm font-black">Cancelar</button>
              </div>
            </div>
          </div>
        )}
      </AnimatePresence>

      {/* Modal subir documentos */}
      <AnimatePresence>
        {showDocumentModal && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={() => setShowDocumentModal(false)}>
            <div className="bg-white rounded-3xl p-8 max-w-md w-full shadow-2xl border border-gray-100" onClick={e => e.stopPropagation()}>
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-black text-slate-800 uppercase tracking-wider">Subir {selectedDocumentType === 'cedula' ? 'Cédula' : 'RIF'}</h3>
                <button onClick={() => setShowDocumentModal(false)} className="p-2 hover:bg-gray-100 rounded-xl"><X className="h-5 w-5 text-slate-400" /></button>
              </div>
              {selectedDocumentFile && (<div className="mb-6 p-4 bg-gray-50 rounded-xl border border-gray-200"><p className="text-sm font-bold text-slate-700 truncate">{selectedDocumentFile.name}</p><p className="text-[10px] text-slate-500">{Math.round(selectedDocumentFile.size / 1024)} KB</p></div>)}
              <div className="border-2 border-dashed rounded-2xl p-8 text-center transition-all cursor-pointer hover:border-emerald-500/50 hover:bg-emerald-500/5" onDragEnter={handleDocumentDrag} onDragLeave={handleDocumentDrag} onDragOver={handleDocumentDrag} onDrop={handleDocumentDrop} onClick={() => document.getElementById('document-upload')?.click()}>
                <input id="document-upload" type="file" accept="image/*,application/pdf" className="hidden" onChange={handleDocumentFileSelect} />
                <Upload className="h-12 w-12 mx-auto text-gray-400 mb-4" />
                <p className="text-sm font-black text-slate-700 mb-1">Haz clic o arrastra el documento</p>
                <p className="text-xs text-slate-400 font-bold uppercase">JPG, PNG, PDF • Máx. 10MB</p>
              </div>
              <div className="flex gap-3 pt-6">
                <button onClick={handleUploadDocument} disabled={!selectedDocumentFile || uploadingDocument} className="flex-1 py-4 bg-emerald-500 text-white rounded-2xl text-[11px] font-black uppercase disabled:opacity-50 flex items-center justify-center gap-2">{uploadingDocument ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}{uploadingDocument ? "Subiendo..." : "Subir Documento"}</button>
                <button onClick={() => setShowDocumentModal(false)} className="px-6 py-4 border border-gray-200 rounded-2xl text-sm font-black">Cancelar</button>
              </div>
            </div>
          </div>
        )}
      </AnimatePresence>

      {/* Modal para registrar responsable de comuna */}
      <AnimatePresence>
        {showResponsableModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="fixed inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setShowResponsableModal(false)} />
            <div className="relative w-full max-w-md bg-white rounded-2xl shadow-2xl p-6">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-xl font-black text-slate-800 uppercase tracking-wider">Registrar Responsable de Comuna</h3>
                <button onClick={() => setShowResponsableModal(false)} className="p-2 hover:bg-gray-100 rounded-xl">
                  <X className="h-5 w-5 text-slate-400" />
                </button>
              </div>
              <div className="space-y-4">
                <div>
                  <label className="text-[10px] font-black text-slate-500 uppercase">Unidad *</label>
                  <select
                    value={responsableForm.unidad}
                    onChange={(e) => setResponsableForm({ ...responsableForm, unidad: e.target.value })}
                    className="w-full p-3 rounded-xl bg-gray-50 border border-gray-200 focus:ring-2 focus:ring-brand-primary/20"
                    required
                  >
                    <option value="">Selecciona una unidad</option>
                    {unidadesComuna.map(unit => (
                      <option key={unit} value={unit}>{unit}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-[10px] font-black text-slate-500 uppercase">Tipo *</label>
                  <select
                    value={responsableForm.tipo}
                    onChange={(e) => setResponsableForm({ ...responsableForm, tipo: e.target.value })}
                    className="w-full p-3 rounded-xl bg-gray-50 border border-gray-200 focus:ring-2 focus:ring-brand-primary/20"
                  >
                    <option value="Principal">Principal</option>
                    <option value="Suplente">Suplente</option>
                  </select>
                </div>
                <div>
                  <label className="text-[10px] font-black text-slate-500 uppercase">Profesión (opcional)</label>
                  <input
                    type="text"
                    value={responsableForm.profesion}
                    onChange={(e) => setResponsableForm({ ...responsableForm, profesion: e.target.value })}
                    className="w-full p-3 rounded-xl bg-gray-50 border border-gray-200 focus:ring-2 focus:ring-brand-primary/20"
                    placeholder="Ej. Ingeniero"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-black text-slate-500 uppercase">Grado de Instrucción (opcional)</label>
                  <select
                    value={responsableForm.grado_instruccion}
                    onChange={(e) => setResponsableForm({ ...responsableForm, grado_instruccion: e.target.value })}
                    className="w-full p-3 rounded-xl bg-gray-50 border border-gray-200 focus:ring-2 focus:ring-brand-primary/20"
                  >
                    <option value="">Selecciona</option>
                    {gradosInstruccion.map(grado => (
                      <option key={grado} value={grado}>{grado}</option>
                    ))}
                  </select>
                </div>
                <button
                  onClick={crearResponsableDesdePerfil}
                  disabled={creatingResponsable || !responsableForm.unidad}
                  className="w-full py-3 bg-brand-primary text-white rounded-xl text-sm font-black uppercase disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {creatingResponsable ? <Loader2 className="h-4 w-4 animate-spin" /> : <UserPlus className="h-4 w-4" />}
                  {creatingResponsable ? "Registrando..." : "Registrar Responsable"}
                </button>
              </div>
            </div>
          </div>
        )}
      </AnimatePresence>

      <AlertModal
        isOpen={modal.isOpen}
        onClose={closeAlert}
        title={modal.title}
        message={modal.message}
        type={modal.type}
        confirmText="Aceptar"
      />
    </div>
  );
};