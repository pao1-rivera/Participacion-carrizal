'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Bell, Menu, LogOut, Settings, ExternalLink, User, CheckCircle, Circle } from 'lucide-react';
import { UserBase } from '@/types';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from "@/app/lib/supabaseClient";
import { useAuth } from "@/context/AuthContext";
import { useRouter } from 'next/navigation';

interface DashboardNavbarProps {
  user: UserBase | any;
  title?: string;
  subtitle?: string;
  onMobileMenuOpen?: () => void;
  onLogout: () => void;
  onNavigateToProfile?: () => void;
  actions?: React.ReactNode;
  roleIcon?: React.ReactNode;
  hideRole?: boolean;
}

interface Notification {
  id: string;
  title: string;
  type: 'warning' | 'error' | 'info' | 'success';
  date: string;
  read: boolean;
  route: string;
  daysLeft: number;
}

const getSignedUrlFromPublicUrl = async (storedPath: string | null): Promise<string | null> => {
  if (!storedPath) return null;
  const bucketName = 'profile-photos';
  let cleanPath = storedPath;
  if (storedPath.includes('http')) {
    const searchString = `/storage/v1/object/public/${bucketName}/`;
    const pathStart = storedPath.indexOf(searchString);
    if (pathStart !== -1) cleanPath = storedPath.substring(pathStart + searchString.length);
  }
  cleanPath = cleanPath.startsWith('/') ? cleanPath.substring(1) : cleanPath;
  const { data, error } = await supabase.storage.from(bucketName).createSignedUrl(cleanPath, 3600);
  if (error) return null;
  return data.signedUrl;
};

export const DashboardNavbar: React.FC<DashboardNavbarProps> = ({ 
  user, 
  onMobileMenuOpen,
  onLogout,
  onNavigateToProfile,
  actions,
  subtitle,
  hideRole,
}) => {
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [showNotifications, setShowNotifications] = useState(false);
  const [readNotifications, setReadNotifications] = useState<Set<string>>(new Set());
  const { user: authUser } = useAuth();
  const router = useRouter();
  const notificationsRef = useRef<HTMLDivElement>(null);
  const bellButtonRef = useRef<HTMLButtonElement>(null);
  
  const [profilePhotoSignedUrl, setProfilePhotoSignedUrl] = useState<string | null>(null);
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [consejoNombre, setConsejoNombre] = useState<string | null>(null);
  const [comunaNombre, setComunaNombre] = useState<string | null>(null);

    const fetchConsejoDataForUser = useCallback(async (userId: string) => {
    if (!userId) return null;

    // Buscar primero como usuario principal
    let { data, error } = await supabase
      .from('datos_consejo_comunal')
      .select('id_consejo, nombre_consejo, id_usuario, id_usuario_auxiliar')
      .eq('id_usuario', userId)
      .maybeSingle();

    // Si no se encontró, buscar como auxiliar
    if (!data && !error) {
      const { data: auxData } = await supabase
        .from('datos_consejo_comunal')
        .select('id_consejo, nombre_consejo, id_usuario, id_usuario_auxiliar')
        .eq('id_usuario_auxiliar', userId)
        .maybeSingle();
      data = auxData;
    }

    return data;
  }, []);

    const fetchComunaDataForUser = useCallback(async (userId: string) => {
    if (!userId) return null;

    // Buscar como usuario principal
    let { data, error } = await supabase
      .from('datos_comuna')
      .select('*')
      .eq('id_usuario', userId)
      .maybeSingle();

    // Si no, buscar como auxiliar
    if (!data && !error) {
      const { data: auxData } = await supabase
        .from('datos_comuna')
        .select('*')
        .eq('id_usuario_auxiliar', userId)
        .maybeSingle();
      data = auxData;
    }

    return data;
  }, []);

  // Determinar rol
  const rolNombre = user?.rolNombre?.toLowerCase() || '';
  const esDirectorComunas = rolNombre === 'director_comunas' || rolNombre.includes('director_comunas') || (rolNombre.includes('direccion') && rolNombre.includes('comunas'));
  const esDirectorDigitalizacion = rolNombre === 'director_digitalizacion' || rolNombre.includes('digitalizacion');
  const esDirectorAdultoMayor = rolNombre === 'director_adulto_mayor' || (rolNombre.includes('direccion') && rolNombre.includes('adulto_mayor'));
  const esDirectorFormacionPlanificacion = rolNombre === 'director_formacion_planificacion' || 
                                           (rolNombre.includes('formacion') && rolNombre.includes('planificacion')) ||
                                           (rolNombre.includes('planificacion') && rolNombre.includes('formacion'));
  const esConsejo = !esDirectorComunas && !esDirectorDigitalizacion && !esDirectorAdultoMayor && !esDirectorFormacionPlanificacion && 
                  (rolNombre === 'vocero_cc' || rolNombre.includes('vocero_cc') || rolNombre === 'consejo_comunal' || rolNombre.includes('consejo_comunal'));
  const esComuna = !esDirectorComunas && !esDirectorDigitalizacion && !esDirectorAdultoMayor && !esDirectorFormacionPlanificacion && !esConsejo && 
                   (rolNombre.includes('vocero_c') || rolNombre === 'vocero_c' || rolNombre.includes('comuna') || rolNombre === 'comuna');
  const esSala = !esDirectorComunas && !esDirectorDigitalizacion && !esDirectorAdultoMayor && !esDirectorFormacionPlanificacion && !esConsejo && !esComuna && 
                 (rolNombre.includes('coordinador_s') || rolNombre === 'coordinador_s' || rolNombre.includes('sala_autogobierno') || rolNombre === 'sala_autogobierno');

  // ========== CARGAR FOTO DE PERFIL ==========
  const fetchProfilePhoto = useCallback(async () => {
    if (!authUser?.id) return;
    const { data, error } = await supabase
      .from('perfil_usuario')
      .select('avatar_url')
      .eq('id_usuario', authUser.id)
      .maybeSingle();
    if (error) {
      console.error('Error obteniendo avatar_url:', error);
      return;
    }
    if (data?.avatar_url) {
      setAvatarUrl(data.avatar_url);
      const signed = await getSignedUrlFromPublicUrl(data.avatar_url);
      setProfilePhotoSignedUrl(signed);
    } else {
      setAvatarUrl(null);
      setProfilePhotoSignedUrl(null);
    }
  }, [authUser?.id]);

  useEffect(() => {
    fetchProfilePhoto();
  }, [fetchProfilePhoto]);

  useEffect(() => {
    const handleProfileUpdate = () => {
      fetchProfilePhoto();
    };
    window.addEventListener('profilePhotoUpdated', handleProfileUpdate);
    return () => window.removeEventListener('profilePhotoUpdated', handleProfileUpdate);
  }, [fetchProfilePhoto]);

  // ========== NOTIFICACIONES LEÍDAS ==========
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem(`readNotifications_${authUser?.id}`);
      if (saved) {
        setReadNotifications(new Set(JSON.parse(saved)));
      }
    }
  }, [authUser?.id]);

  const saveReadNotifications = (ids: string[]) => {
    if (typeof window !== 'undefined' && authUser?.id) {
      localStorage.setItem(`readNotifications_${authUser.id}`, JSON.stringify(ids));
      setReadNotifications(new Set(ids));
      window.dispatchEvent(new CustomEvent('notificationsUpdated'));
    }
  };

  const toggleNotificationRead = (e: React.MouseEvent, notificationId: string) => {
    e.stopPropagation();
    let updatedIds: string[];
    if (readNotifications.has(notificationId)) {
      updatedIds = Array.from(readNotifications).filter(id => id !== notificationId);
    } else {
      updatedIds = Array.from(readNotifications).concat(notificationId);
    }
    saveReadNotifications(updatedIds);
    setNotifications(prev => prev.map(n => 
      n.id === notificationId ? { ...n, read: !n.read } : n
    ));
  };

  // Función para calcular tiempo restante
  const getTimeRemaining = (fechaISO: string | null) => {
    if (!fechaISO) return { text: "No establecida", color: "gray", daysLeft: null };
    const hoy = new Date();
    hoy.setHours(0, 0, 0, 0);
    const [year, month, day] = fechaISO.split('-').map(Number);
    const fechaVenc = new Date(year, month - 1, day);
    fechaVenc.setHours(0, 0, 0, 0);
    if (fechaVenc < hoy) return { text: "VENCIDA", color: "rose", daysLeft: 0 };
    const diffDays = Math.ceil((fechaVenc.getTime() - hoy.getTime()) / (1000 * 60 * 60 * 24));
    let years = fechaVenc.getFullYear() - hoy.getFullYear();
    let months = fechaVenc.getMonth() - hoy.getMonth();
    let days = fechaVenc.getDate() - hoy.getDate();
    if (days < 0) { months--; days += new Date(fechaVenc.getFullYear(), fechaVenc.getMonth(), 0).getDate(); }
    if (months < 0) { years--; months += 12; }
    let text = "";
    if (years > 0) text += `${years} año${years !== 1 ? 's' : ''} `;
    if (months > 0) text += `${months} mes${months !== 1 ? 'es' : ''} `;
    if (days > 0) text += `${days} día${days !== 1 ? 's' : ''}`;
    if (!text) text = "HOY";
    let status = diffDays <= 0 ? "VENCIDA" : "POR VENCERSE";
    let color = "emerald";
    if (diffDays <= 30) color = "rose";
    else if (diffDays <= 60) color = "amber";
    else color = "emerald";
    return { text: `${status} en ${text}`, color, daysLeft: diffDays };
  };

  useEffect(() => {
    const loadConsejoName = async () => {
      if (!esConsejo) return;
      if (user?.nombreConsejo) {
        setConsejoNombre(user.nombreConsejo);
        return;
      }
      if (authUser?.id) {                     // ✅ control de undefined
        const consejo = await fetchConsejoDataForUser(authUser.id);
        if (consejo?.nombre_consejo) {
          setConsejoNombre(consejo.nombre_consejo);
        }
      }
    };
    loadConsejoName();
  }, [esConsejo, user?.nombreConsejo, authUser?.id, fetchConsejoDataForUser]);

    useEffect(() => {
    const loadComunaName = async () => {
      if (!esComuna) return;
      if (user?.nombreComuna) {
        setComunaNombre(user.nombreComuna);
        return;
      }
      if (authUser?.id) {
        const comuna = await fetchComunaDataForUser(authUser.id);
        if (comuna?.nombre_comuna) {
          setComunaNombre(comuna.nombre_comuna);
        }
      }
    };
    loadComunaName();
  }, [esComuna, user?.nombreComuna, authUser?.id, fetchComunaDataForUser]);

  // ========== FUNCIONES PARA CONSEJO COMUNAL (sin cambios) ==========
  const checkMissingFieldsConsejo = (data: any) => {
    const requiredFields = [
      { field: 'codigo', label: 'Código', route: 'organizacion' },
      { field: 'nombre_consejo', label: 'Nombre del Consejo', route: 'organizacion' },
      { field: 'fecha_creacion', label: 'Fecha de Creación', route: 'organizacion' },
      { field: 'domicilio', label: 'Domicilio', route: 'organizacion' },
      { field: 'parroquia', label: 'Parroquia', route: 'organizacion' },
      { field: 'municipio', label: 'Municipio', route: 'organizacion' },
      { field: 'estado', label: 'Estado', route: 'organizacion' },
      { field: 'rif', label: 'RIF', route: 'datos-legales' },
      { field: 'fecha_vencimiento_rif', label: 'Fecha de Vencimiento del RIF', route: 'datos-legales' }
    ];
    return requiredFields.filter(req => !data[req.field] || data[req.field] === '');
  };

  const checkMissingConsejoDocuments = (consejoData: any) => {
    const missingDocs = [];
    if (!consejoData.acta_constitutiva_url) missingDocs.push({ tipo: 'acta_constitutiva', label: 'Acta Constitutiva', route: 'documentacion' });
    if (!consejoData.rif_url) missingDocs.push({ tipo: 'rif', label: 'Documento RIF', route: 'documentacion' });
    return missingDocs;
  };

  const checkVoceroConsejoMissingFields = (vocero: any) => {
    const missing = [];
    if (!vocero.nombre_completo) missing.push({ field: 'nombre_completo', label: 'Nombre completo', route: 'voceros' });
    if (!vocero.cedula) missing.push({ field: 'cedula', label: 'Cédula', route: 'voceros' });
    if (!vocero.unidad) missing.push({ field: 'unidad', label: 'Unidad', route: 'voceros' });
    if (!vocero.tipo) missing.push({ field: 'tipo', label: 'Tipo', route: 'voceros' });
    if (!vocero.profesion) missing.push({ field: 'profesion', label: 'Profesión', route: 'voceros' });
    if (!vocero.telefono) missing.push({ field: 'telefono', label: 'Teléfono', route: 'voceros' });
    return missing;
  };

  const checkVoceroConsejoRifVencimiento = async (idConsejo: number) => {
    if (!idConsejo) return [];
    const { data: voceros, error } = await supabase
      .from('voceros')
      .select('id_vocero, nombre_completo, rif_fecha_vencimiento')
      .eq('id_consejo', idConsejo);
    if (error || !voceros) return [];
    const vencimientos = [];
    const hoy = new Date(); hoy.setHours(0, 0, 0, 0);
    for (const vocero of voceros) {
      if (vocero.rif_fecha_vencimiento) {
        const fechaVenc = new Date(vocero.rif_fecha_vencimiento); fechaVenc.setHours(0, 0, 0, 0);
        const diffDays = Math.ceil((fechaVenc.getTime() - hoy.getTime()) / (1000 * 60 * 60 * 24));
        if (diffDays <= 90) {
          const status = diffDays <= 0 ? 'VENCIDO' : `Vence en ${diffDays} días`;
          vencimientos.push({
            id: `vocero_consejo_rif_venc_${vocero.id_vocero}`,
            title: `📄 RIF de vocero ${vocero.nombre_completo}: ${status}`,
            type: diffDays <= 0 ? 'error' : diffDays <= 30 ? 'error' : 'warning' as 'error' | 'warning',
            daysLeft: diffDays,
            route: 'voceros'
          });
        }
      }
    }
    return vencimientos;
  };

  const checkVoceroConsejoMissingDocuments = async (idConsejo: number) => {
    if (!idConsejo) return [];
    const { data: voceros, error } = await supabase
      .from('voceros')
      .select('id_vocero, nombre_completo, rif_url, cedula_url')
      .eq('id_consejo', idConsejo);
    if (error || !voceros) return [];
    const missingDocs = [];
    for (const vocero of voceros) {
      if (!vocero.rif_url) {
        missingDocs.push({
          id: `vocero_consejo_rif_doc_${vocero.id_vocero}`,
          title: `📄 Falta RIF del vocero: ${vocero.nombre_completo}`,
          type: 'error' as const,
          route: 'voceros',
          daysLeft: 0
        });
      }
      if (!vocero.cedula_url) {
        missingDocs.push({
          id: `vocero_consejo_cedula_doc_${vocero.id_vocero}`,
          title: `🆔 Falta Cédula del vocero: ${vocero.nombre_completo}`,
          type: 'error' as const,
          route: 'voceros',
          daysLeft: 0
        });
      }
    }
    return missingDocs;
  };

  const checkVocerosConsejoVencimiento = async (idConsejo: number) => {
    if (!idConsejo) return [];
    const { data: consejoData, error } = await supabase
      .from('datos_consejo_comunal')
      .select('fecha_vencimiento_voceros')
      .eq('id_consejo', idConsejo)
      .maybeSingle();
    if (error || !consejoData) return [];
    const vencimientos = [];
    if (consejoData.fecha_vencimiento_voceros) {
      const { text, daysLeft } = getTimeRemaining(consejoData.fecha_vencimiento_voceros);
      if (daysLeft !== null && daysLeft <= 90) {
        vencimientos.push({
          id: `consejo_voceros_venc_${idConsejo}`,
          title: `⏰ Vocerías del Consejo: ${text}`,
          type: daysLeft <= 0 ? 'error' : daysLeft <= 30 ? 'error' : 'warning' as 'error' | 'warning',
          daysLeft: daysLeft,
          route: 'voceros'
        });
      }
    }
    return vencimientos;
  };

  const checkConsejoRifVencimiento = (consejoData: any) => {
    const vencimientos = [];
    if (consejoData.fecha_vencimiento_rif) {
      const { text, daysLeft } = getTimeRemaining(consejoData.fecha_vencimiento_rif);
      if (daysLeft !== null && daysLeft <= 90) {
        vencimientos.push({
          id: `consejo_rif_venc_${consejoData.id_consejo}`,
          title: `📄 RIF del Consejo: ${text}`,
          type: daysLeft <= 0 ? 'error' : daysLeft <= 30 ? 'error' : 'warning' as 'error' | 'warning',
          daysLeft: daysLeft,
          route: 'datos-legales'
        });
      }
    }
    return vencimientos;
  };

  // ========== FUNCIONES PARA COMUNA ==========
  const checkMissingFieldsComuna = (data: any) => {
    const requiredFields = [
      { field: 'nombre_comuna', label: 'Nombre de la Comuna', route: 'documentacion' },
      { field: 'rif', label: 'RIF', route: 'documentacion' },
      { field: 'codigo_situr', label: 'Código SITUR', route: 'documentacion' },
      { field: 'cuenta_bancaria', label: 'Cuenta Bancaria', route: 'documentacion' },
      { field: 'fecha_vencimiento_rif', label: 'Fecha de Vencimiento del RIF', route: 'documentacion' },
      { field: 'fecha_vencimiento_voceros', label: 'Fecha de Vencimiento de Vocerías', route: 'documentacion' }
    ];
    return requiredFields.filter(req => !data[req.field] || data[req.field] === '');
  };

  const checkMissingComunaDocuments = (comunaData: any) => {
    const missingDocs = [];
    if (!comunaData.certificado_cuenta_url) missingDocs.push({ tipo: 'certificado_cuenta', label: 'Certificado de Cuenta Bancaria', route: 'documentacion' });
    if (!comunaData.rif_url) missingDocs.push({ tipo: 'rif', label: 'Documento RIF', route: 'documentacion' });
    if (!comunaData.carta_fundacional_url) missingDocs.push({ tipo: 'carta_fundacional', label: 'Carta Fundacional', route: 'documentacion' });
    return missingDocs;
  };

  const checkVoceroComunaMissingFields = (vocero: any) => {
    const missing = [];
    if (!vocero.nombre_completo) missing.push({ field: 'nombre_completo', label: 'Nombre completo', route: 'vocerias' });
    if (!vocero.cedula) missing.push({ field: 'cedula', label: 'Cédula', route: 'vocerias' });
    if (!vocero.unidad) missing.push({ field: 'unidad', label: 'Unidad', route: 'vocerias' });
    if (!vocero.tipo) missing.push({ field: 'tipo', label: 'Tipo', route: 'vocerias' });
    return missing;
  };

  const checkVoceroComunaRifVencimiento = async (idComuna: number) => {
    if (!idComuna) return [];
    const { data: voceros, error } = await supabase
      .from('voceros_comuna')
      .select('id_voceroc, nombre_completo, rif_fecha_vencimiento')
      .eq('id_comuna', idComuna);
    if (error || !voceros) return [];
    const vencimientos = [];
    const hoy = new Date(); hoy.setHours(0, 0, 0, 0);
    for (const vocero of voceros) {
      if (vocero.rif_fecha_vencimiento) {
        const fechaVenc = new Date(vocero.rif_fecha_vencimiento); fechaVenc.setHours(0, 0, 0, 0);
        const diffDays = Math.ceil((fechaVenc.getTime() - hoy.getTime()) / (1000 * 60 * 60 * 24));
        if (diffDays <= 90) {
          const status = diffDays <= 0 ? 'VENCIDO' : `Vence en ${diffDays} días`;
          vencimientos.push({
            id: `vocero_comuna_rif_venc_${vocero.id_voceroc}`,
            title: `📄 RIF del vocero ${vocero.nombre_completo}: ${status}`,
            type: diffDays <= 0 ? 'error' : diffDays <= 30 ? 'error' : 'warning' as 'error' | 'warning',
            daysLeft: diffDays,
            route: 'vocerias'
          });
        }
      }
    }
    return vencimientos;
  };

  const checkVoceroComunaMissingDocuments = async (idComuna: number) => {
    if (!idComuna) return [];
    const { data: voceros, error } = await supabase
      .from('voceros_comuna')
      .select('id_voceroc, nombre_completo, rif_url, cedula_url')
      .eq('id_comuna', idComuna);
    if (error || !voceros) return [];
    const missingDocs = [];
    for (const vocero of voceros) {
      if (!vocero.rif_url) {
        missingDocs.push({
          id: `vocero_comuna_rif_doc_${vocero.id_voceroc}`,
          title: `📄 Falta RIF del vocero: ${vocero.nombre_completo}`,
          type: 'error' as const,
          route: 'vocerias',
          daysLeft: 0
        });
      }
      if (!vocero.cedula_url) {
        missingDocs.push({
          id: `vocero_comuna_cedula_doc_${vocero.id_voceroc}`,
          title: `🆔 Falta Cédula del vocero: ${vocero.nombre_completo}`,
          type: 'error' as const,
          route: 'vocerias',
          daysLeft: 0
        });
      }
    }
    return missingDocs;
  };

  const checkVoceriasVencimientoComuna = (comunaData: any) => {
    const vencimientos = [];
    if (comunaData.fecha_vencimiento_voceros) {
      const { text, daysLeft } = getTimeRemaining(comunaData.fecha_vencimiento_voceros);
      if (daysLeft !== null && daysLeft <= 90) {
        vencimientos.push({
          id: `vocerias_venc_comuna_${comunaData.id_comuna}`,
          title: `⏰ Vocerías de la Comuna: ${text}`,
          type: daysLeft <= 0 ? 'error' : daysLeft <= 30 ? 'error' : 'warning' as 'error' | 'warning',
          daysLeft: daysLeft,
          route: 'documentacion'
        });
      }
    }
    return vencimientos;
  };

  const checkComunaRifVencimiento = (comunaData: any) => {
    const vencimientos = [];
    if (comunaData.fecha_vencimiento_rif) {
      const { text, daysLeft } = getTimeRemaining(comunaData.fecha_vencimiento_rif);
      if (daysLeft !== null && daysLeft <= 90) {
        vencimientos.push({
          id: `comuna_rif_venc_${comunaData.id_comuna}`,
          title: `📄 RIF de la Comuna: ${text}`,
          type: daysLeft <= 0 ? 'error' : daysLeft <= 30 ? 'error' : 'warning' as 'error' | 'warning',
          daysLeft: daysLeft,
          route: 'documentacion'
        });
      }
    }
    return vencimientos;
  };

  const checkResponsableMissingFields = (responsable: any) => {
    const missing = [];
    if (!responsable.nombre_g) missing.push({ field: 'nombre_g', label: 'Nombre', route: 'consejopec' });
    if (!responsable.apellido_g) missing.push({ field: 'apellido_g', label: 'Apellido', route: 'consejopec' });
    if (!responsable.cedula) missing.push({ field: 'cedula', label: 'Cédula', route: 'consejopec' });
    if (!responsable.unidad) missing.push({ field: 'unidad', label: 'Unidad', route: 'consejopec' });
    if (!responsable.tipo) missing.push({ field: 'tipo', label: 'Tipo', route: 'consejopec' });
    return missing;
  };

  const checkResponsableRifVencimiento = async (idComuna: number) => {
    if (!idComuna) return [];
    const { data: responsables, error } = await supabase
      .from('responsables_gestion_comuna')
      .select('id_responsable, nombre_g, apellido_g, rif_fecha_vencimiento')
      .eq('id_comuna', idComuna);
    if (error || !responsables) return [];
    const vencimientos = [];
    const hoy = new Date(); hoy.setHours(0, 0, 0, 0);
    for (const responsable of responsables) {
      if (responsable.rif_fecha_vencimiento) {
        const fechaVenc = new Date(responsable.rif_fecha_vencimiento); fechaVenc.setHours(0, 0, 0, 0);
        const diffDays = Math.ceil((fechaVenc.getTime() - hoy.getTime()) / (1000 * 60 * 60 * 24));
        if (diffDays <= 90) {
          const status = diffDays <= 0 ? 'VENCIDO' : `Vence en ${diffDays} días`;
          vencimientos.push({
            id: `responsable_rif_venc_${responsable.id_responsable}`,
            title: `📄 RIF del responsable ${responsable.nombre_g} ${responsable.apellido_g}: ${status}`,
            type: diffDays <= 0 ? 'error' : diffDays <= 30 ? 'error' : 'warning' as 'error' | 'warning',
            daysLeft: diffDays,
            route: 'consejopec'
          });
        }
      }
    }
    return vencimientos;
  };

  const checkResponsableMissingDocuments = async (idComuna: number) => {
    if (!idComuna) return [];
    const { data: responsables, error } = await supabase
      .from('responsables_gestion_comuna')
      .select('id_responsable, nombre_g, apellido_g, rif_url, cedula_url')
      .eq('id_comuna', idComuna);
    if (error || !responsables) return [];
    const missingDocs = [];
    for (const responsable of responsables) {
      if (!responsable.rif_url) {
        missingDocs.push({
          id: `responsable_rif_doc_${responsable.id_responsable}`,
          title: `📄 Falta RIF del responsable: ${responsable.nombre_g} ${responsable.apellido_g}`,
          type: 'error' as const,
          route: 'consejopec',
          daysLeft: 0
        });
      }
      if (!responsable.cedula_url) {
        missingDocs.push({
          id: `responsable_cedula_doc_${responsable.id_responsable}`,
          title: `🆔 Falta Cédula del responsable: ${responsable.nombre_g} ${responsable.apellido_g}`,
          type: 'error' as const,
          route: 'consejopec',
          daysLeft: 0
        });
      }
    }
    return missingDocs;
  };

  // ========== FUNCIONES PARA SALA DE AUTOGOBIERNO ==========
  const checkMissingSalaFields = (salaData: any) => {
    const requiredFields = [
      { field: 'nombre_sala', label: 'Nombre de la Sala', route: 'organizacion' },
      { field: 'estatus', label: 'Estatus', route: 'organizacion' },
      { field: 'acta_constitutiva_url', label: 'Acta Constitutiva', route: 'documentacion' }
    ];
    return requiredFields.filter(req => !salaData[req.field] || salaData[req.field] === '');
  };

  const checkSalaInfraestructura = async (idSala: number) => {
    const { data: infra, error } = await supabase
      .from('infraestructura_sala')
      .select('id_infraestructura')
      .eq('id_sala', idSala)
      .maybeSingle();
    
    if (error || !infra) {
      return [{
        id: `sala_sin_infra_${idSala}`,
        title: `🔧 La Sala no tiene evaluación de infraestructura registrada`,
        type: 'warning' as const,
        daysLeft: 0,
        route: 'infraestructura'
      }];
    }
    return [];
  };

  const checkSalaEquipos = async (idSala: number) => {
    const { data: infra, error } = await supabase
      .from('infraestructura_sala')
      .select('equipos_funcionales, estado_hardware')
      .eq('id_sala', idSala)
      .maybeSingle();
    
    if (error || !infra) return [];
    
    const issues = [];
    if (!infra.equipos_funcionales || infra.equipos_funcionales === '—') {
      issues.push({
        id: `sala_sin_equipos_${idSala}`,
        title: `💻 La Sala no tiene registrados equipos funcionales`,
        type: 'warning' as const,
        daysLeft: 0,
        route: 'infraestructura'
      });
    }
    if (infra.estado_hardware === 'Malo' || infra.estado_hardware === 'Crítico') {
      issues.push({
        id: `sala_hardware_critico_${idSala}`,
        title: `⚠️ El hardware de la Sala está en estado ${infra.estado_hardware}`,
        type: 'error' as const,
        daysLeft: 0,
        route: 'infraestructura'
      });
    }
    return issues;
  };

  // ========== FUNCIONES PARA DIRECTORES ==========
  const checkSalasInactivas = async () => {
    const { data: salas, error } = await supabase
      .from('datos_sala_autogobierno')
      .select('id_sala, nombre_sala, estatus');
    
    if (error || !salas) return [];
    
    const salasInactivas = salas.filter(s => s.estatus?.toLowerCase() === 'inactiva' || s.estatus?.toLowerCase() === 'inactivo');
    
    return salasInactivas.map(sala => ({
      id: `sala_inactiva_${sala.id_sala}`,
      title: `🏢 La sala "${sala.nombre_sala}" se encuentra INACTIVA`,
      type: 'warning' as const,
      route: 'infraestructura',
      daysLeft: 0
    }));
  };

  const checkConsejosDocumentosFaltantes = async () => {
    const { data: consejos, error } = await supabase
      .from('datos_consejo_comunal')
      .select('id_consejo, nombre_consejo, acta_constitutiva_url, rif_url');
    
    if (error || !consejos) return [];
    
    const faltantes = [];
    for (const consejo of consejos) {
      const missingDocs = [];
      if (!consejo.acta_constitutiva_url) missingDocs.push('Acta Constitutiva');
      if (!consejo.rif_url) missingDocs.push('RIF');
      
      if (missingDocs.length > 0) {
        faltantes.push({
          id: `consejo_docs_${consejo.id_consejo}`,
          title: `📄 Consejo "${consejo.nombre_consejo}" le falta: ${missingDocs.join(', ')}`,
          type: 'error' as const,
          route: 'gestion',
          daysLeft: 0
        });
      }
    }
    return faltantes;
  };

  const checkComunasDocumentosFaltantes = async () => {
    const { data: comunas, error } = await supabase
      .from('datos_comuna')
      .select('id_comuna, nombre_comuna, certificado_cuenta_url, rif_url, carta_fundacional_url');
    
    if (error || !comunas) return [];
    
    const faltantes = [];
    for (const comuna of comunas) {
      const missingDocs = [];
      if (!comuna.certificado_cuenta_url) missingDocs.push('Certificado de Cuenta');
      if (!comuna.rif_url) missingDocs.push('RIF');
      if (!comuna.carta_fundacional_url) missingDocs.push('Carta Fundacional');
      
      if (missingDocs.length > 0) {
        faltantes.push({
          id: `comuna_docs_${comuna.id_comuna}`,
          title: `📄 Comuna "${comuna.nombre_comuna}" le falta: ${missingDocs.join(', ')}`,
          type: 'error' as const,
          route: 'liderazgo',
          daysLeft: 0
        });
      }
    }
    return faltantes;
  };

  const checkRifVencidoGeneral = async () => {
    const vencimientos = [];
    const hoy = new Date();
    
    const { data: consejos } = await supabase
      .from('datos_consejo_comunal')
      .select('id_consejo, nombre_consejo, fecha_vencimiento_rif');
    
    if (consejos) {
      for (const consejo of consejos) {
        if (consejo.fecha_vencimiento_rif && new Date(consejo.fecha_vencimiento_rif) < hoy) {
          vencimientos.push({
            id: `consejo_rif_vencido_gen_${consejo.id_consejo}`,
            title: `📄 RIF vencido del consejo "${consejo.nombre_consejo}"`,
            type: 'error' as const,
            route: 'gestion',
            daysLeft: 0
          });
        }
      }
    }
    
    const { data: comunas } = await supabase
      .from('datos_comuna')
      .select('id_comuna, nombre_comuna, fecha_vencimiento_rif');
    
    if (comunas) {
      for (const comuna of comunas) {
        if (comuna.fecha_vencimiento_rif && new Date(comuna.fecha_vencimiento_rif) < hoy) {
          vencimientos.push({
            id: `comuna_rif_vencido_gen_${comuna.id_comuna}`,
            title: `📄 RIF vencido de la comuna "${comuna.nombre_comuna}"`,
            type: 'error' as const,
            route: 'liderazgo',
            daysLeft: 0
          });
        }
      }
    }
    
    return vencimientos;
  };

  const checkNuevosRegistros = async () => {
    const nuevos: any[] = [];
    const semanaAtras = new Date();
    semanaAtras.setDate(semanaAtras.getDate() - 7);
    
    const { data: nuevasSalas } = await supabase
      .from('datos_sala_autogobierno')
      .select('id_sala, nombre_sala, created_at')
      .gte('created_at', semanaAtras.toISOString());
    
    if (nuevasSalas) {
      nuevasSalas.forEach(sala => {
        nuevos.push({
          id: `nueva_sala_${sala.id_sala}`,
          title: `🏢 Nueva Sala de Autogobierno registrada: "${sala.nombre_sala}"`,
          type: 'success' as const,
          route: 'infraestructura',
          daysLeft: 0,
          date: sala.created_at
        });
      });
    }
    
    const { data: nuevasComunas } = await supabase
      .from('datos_comuna')
      .select('id_comuna, nombre_comuna, created_at')
      .gte('created_at', semanaAtras.toISOString());
    
    if (nuevasComunas) {
      nuevasComunas.forEach(comuna => {
        nuevos.push({
          id: `nueva_comuna_${comuna.id_comuna}`,
          title: `🏘️ Nueva Comuna registrada: "${comuna.nombre_comuna}"`,
          type: 'success' as const,
          route: 'liderazgo',
          daysLeft: 0,
          date: comuna.created_at
        });
      });
    }
    
    const { data: nuevosConsejos } = await supabase
      .from('datos_consejo_comunal')
      .select('id_consejo, nombre_consejo, created_at')
      .gte('created_at', semanaAtras.toISOString());
    
    if (nuevosConsejos) {
      nuevosConsejos.forEach(consejo => {
        nuevos.push({
          id: `nuevo_consejo_${consejo.id_consejo}`,
          title: `🏛️ Nuevo Consejo Comunal registrado: "${consejo.nombre_consejo}"`,
          type: 'success' as const,
          route: 'gestion',
          daysLeft: 0,
          date: consejo.created_at
        });
      });
    }
    
    return nuevos;
  };

  const checkSalasSinEvaluar = async () => {
    const { data: salasConInfra } = await supabase
      .from('infraestructura_sala')
      .select('id_sala');
    
    const salasConInfraIds = salasConInfra?.map(s => s.id_sala) || [];
    
    const { data: todasSalas } = await supabase
      .from('datos_sala_autogobierno')
      .select('id_sala, nombre_sala');
    
    if (!todasSalas) return [];
    
    const salasSinEvaluar = todasSalas.filter(sala => !salasConInfraIds.includes(sala.id_sala));
    
    return salasSinEvaluar.map(sala => ({
      id: `sala_sin_evaluar_${sala.id_sala}`,
      title: `🔧 La sala "${sala.nombre_sala}" no ha sido evaluada en infraestructura`,
      type: 'warning' as const,
      route: 'infraestructura',
      daysLeft: 0
    }));
  };

  const checkNuevosNudosProyectosRendiciones = async () => {
    const nuevos: any[] = [];
    const semanaAtras = new Date();
    semanaAtras.setDate(semanaAtras.getDate() - 7);
    
    const { data: nuevosNudos } = await supabase
      .from('nudos_criticos')
      .select('id_nudo, titulo, created_at')
      .gte('created_at', semanaAtras.toISOString())
      .limit(10);
    
    if (nuevosNudos) {
      nuevosNudos.forEach(nudo => {
        nuevos.push({
          id: `nuevo_nudo_${nudo.id_nudo}`,
          title: `⚠️ Nuevo nudo crítico registrado: "${nudo.titulo.substring(0, 50)}"`,
          type: 'warning' as const,
          route: 'gestion',
          daysLeft: 0,
          date: nudo.created_at
        });
      });
    }
    
    const { data: nuevosProyectos } = await supabase
      .from('proyectos')
      .select('id_proyecto, nombre, created_at')
      .gte('created_at', semanaAtras.toISOString())
      .limit(10);
    
    if (nuevosProyectos) {
      nuevosProyectos.forEach(proyecto => {
        nuevos.push({
          id: `nuevo_proyecto_${proyecto.id_proyecto}`,
          title: `📊 Nuevo proyecto registrado: "${proyecto.nombre}"`,
          type: 'info' as const,
          route: 'gestion',
          daysLeft: 0,
          date: proyecto.created_at
        });
      });
    }
    
    const { data: nuevasRendiciones } = await supabase
      .from('rendiciones')
      .select('id_rendicion, created_at')
      .gte('created_at', semanaAtras.toISOString())
      .limit(10);
    
    if (nuevasRendiciones) {
      nuevasRendiciones.forEach(rendicion => {
        nuevos.push({
          id: `nueva_rendicion_${rendicion.id_rendicion}`,
          title: `📑 Nueva rendición de cuenta registrada`,
          type: 'info' as const,
          route: 'gestion',
          daysLeft: 0,
          date: rendicion.created_at
        });
      });
    }
    
    return nuevos;
  };

  const checkNuevosRegistrosAlfabetizacion = async () => {
    const semanaAtras = new Date();
    semanaAtras.setDate(semanaAtras.getDate() - 7);
    
    const { data: nuevosRegistros } = await supabase
      .from('analfabetismo_digital')
      .select('id_registro, nombre, apellido, created_at')
      .gte('created_at', semanaAtras.toISOString())
      .limit(10);
    
    if (!nuevosRegistros) return [];
    
    return nuevosRegistros.map(reg => ({
      id: `alfabetizacion_${reg.id_registro}`,
      title: `📝 Nuevo diagnóstico de alfabetización digital: ${reg.nombre} ${reg.apellido}`,
      type: 'info' as const,
      route: 'alfa',
      daysLeft: 0,
      date: reg.created_at
    }));
  };

  // ========== FUNCIONES PARA DIRECTOR ADULTO MAYOR ==========
  const checkNuevosAdultosMayores = async () => {
    const semanaAtras = new Date();
    semanaAtras.setDate(semanaAtras.getDate() - 7);
    
    const { data: nuevosRegistros, error } = await supabase
      .from('adultos_mayores')
      .select('id_adulto, nombre, apellido, created_at')
      .gte('created_at', semanaAtras.toISOString())
      .limit(10);
    
    if (error || !nuevosRegistros) return [];
    
    return nuevosRegistros.map(adulto => ({
      id: `nuevo_adulto_${adulto.id_adulto}`,
      title: `👴 Nuevo Adulto Mayor Encuestado: ${adulto.nombre} ${adulto.apellido}`,
      type: 'info' as const,
      route: 'social',
      daysLeft: 0,
      date: adulto.created_at
    }));
  };

  // ========== NUEVA FUNCIÓN PARA DIRECTOR FORMACIÓN Y PLANIFICACIÓN ==========
  const checkNuevosCursosTalleres = async () => {
    const semanaAtras = new Date();
    semanaAtras.setDate(semanaAtras.getDate() - 7);
    
    const { data: nuevosCursos, error } = await supabase
      .from('cursos')
      .select('id_cursos, titulo, tipo, created_at')
      .gte('created_at', semanaAtras.toISOString())
      .order('created_at', { ascending: false })
      .limit(10);
    
    if (error || !nuevosCursos) return [];
    
    return nuevosCursos.map(curso => ({
      id: `nuevo_curso_${curso.id_cursos}`,
      title: `🎓 Nuevo ${curso.tipo || 'curso'} registrado: "${curso.titulo}"`,
      type: 'info' as const,
      route: 'formacion',
      daysLeft: 0,
      date: curso.created_at
    }));
  };

  const checkRespuestasSoporte = async () => {
    const semanaAtras = new Date();
    semanaAtras.setDate(semanaAtras.getDate() - 7);
    
    const { data: respuestas } = await supabase
      .from('soporte')
      .select('id_soporte, problema, respuesta, fecha_respuesta')
      .not('respuesta', 'is', null)
      .gte('fecha_respuesta', semanaAtras.toISOString())
      .limit(10);
    
    if (!respuestas) return [];
    
    return respuestas.map(ticket => ({
      id: `soporte_respuesta_${ticket.id_soporte}`,
      title: `💬 Nueva respuesta a ticket de soporte: "${ticket.problema.substring(0, 50)}..."`,
      type: 'success' as const,
      route: 'ayuda',
      daysLeft: 0,
      date: ticket.fecha_respuesta
    }));
  };

  const checkNuevosConsejosPendientes = async () => {
    const semanaAtras = new Date();
    semanaAtras.setDate(semanaAtras.getDate() - 7);
    
    const { data: nuevosConsejos, error } = await supabase
      .from('datos_consejo_comunal')
      .select('id_consejo, nombre_consejo, created_at, estatus_validacion')
      .or('estatus_validacion.is.null,estatus_validacion.eq.PENDIENTE')
      .gte('created_at', semanaAtras.toISOString());
    
    if (error) {
      console.error('Error consultando consejos pendientes:', error);
      return [];
    }
    
    if (!nuevosConsejos || nuevosConsejos.length === 0) return [];
    
    return nuevosConsejos.map(consejo => ({
      id: `nuevo_consejo_pendiente_${consejo.id_consejo}`,
      title: `📋 Nuevo Consejo Comunal pendiente por aprobación: "${consejo.nombre_consejo}"`,
      type: 'warning' as const,
      route: 'validacion',
      daysLeft: 0,
      date: consejo.created_at
    }));
  };

  const checkNuevasRespuestasSoporte = async (userId: string) => {
    if (!userId) return [];
    const { data: tickets, error } = await supabase
      .from('soporte')
      .select('id_soporte, problema, respuesta, estatus, fecha_respuesta, updated_at')
      .eq('id_usuario', userId)
      .neq('respuesta', null)
      .order('fecha_respuesta', { ascending: false });
    if (error || !tickets) return [];
    const nuevasRespuestas = [];
    const hoy = new Date(); hoy.setHours(0, 0, 0, 0);
    for (const ticket of tickets) {
      const fechaRespuesta = ticket.fecha_respuesta ? new Date(ticket.fecha_respuesta) : null;
      if (fechaRespuesta) {
        const diffDays = Math.ceil((hoy.getTime() - fechaRespuesta.getTime()) / (1000 * 60 * 60 * 24));
        if (diffDays <= 7) {
          nuevasRespuestas.push({
            id: `soporte_respuesta_${ticket.id_soporte}`,
            title: `💬 Respuesta a tu ticket: "${ticket.problema.substring(0, 50)}..."`,
            type: 'info' as const,
            daysLeft: 0,
            route: 'soporte',
            date: ticket.fecha_respuesta
          });
        }
      }
    }
    return nuevasRespuestas;
  };

  // ==================== FUNCIÓN PRINCIPAL PARA CARGAR NOTIFICACIONES ====================
  const fetchNotifications = useCallback(async () => {
    if (!authUser?.id) return;
    const notifs: Notification[] = [];

    // NOTIFICACIONES PARA DIRECTOR DE COMUNAS
    if (esDirectorComunas) {      
      const [
        salasInactivas,
        consejosDocs,
        comunasDocs,
        rifVencido,
        nuevosRegistrosEntidades,
        salasSinEvaluar,
        nudosProyectosRendiciones,
        nuevosConsejosPendientes,
        respuestasSoporte
      ] = await Promise.all([
        checkSalasInactivas(),
        checkConsejosDocumentosFaltantes(),
        checkComunasDocumentosFaltantes(),
        checkRifVencidoGeneral(),
        checkNuevosRegistros(),
        checkSalasSinEvaluar(),
        checkNuevosNudosProyectosRendiciones(),
        checkNuevosConsejosPendientes(),
        checkRespuestasSoporte()
      ]);
      
      const addMeta = (notif: any) => ({
        ...notif,
        date: notif.date || new Date().toISOString(),
        read: readNotifications.has(notif.id)
      });
      
      notifs.push(...salasInactivas.map(addMeta));
      notifs.push(...consejosDocs.map(addMeta));
      notifs.push(...comunasDocs.map(addMeta));
      notifs.push(...rifVencido.map(addMeta));
      notifs.push(...nuevosRegistrosEntidades.map(addMeta));
      notifs.push(...salasSinEvaluar.map(addMeta));
      notifs.push(...nudosProyectosRendiciones.map(addMeta));
      notifs.push(...nuevosConsejosPendientes.map(addMeta));
      notifs.push(...respuestasSoporte.map(addMeta));
      
    } 
    // NOTIFICACIONES PARA DIRECTOR DE DIGITALIZACIÓN
    else if (esDirectorDigitalizacion) {
      const [
        salasInactivas,
        consejosDocs,
        comunasDocs,
        rifVencido,
        nuevosRegistrosEntidades,
        salasSinEvaluar,
        nudosProyectosRendiciones,
        registrosAlfabetizacion,
        respuestasSoporte
      ] = await Promise.all([
        checkSalasInactivas(),
        checkConsejosDocumentosFaltantes(),
        checkComunasDocumentosFaltantes(),
        checkRifVencidoGeneral(),
        checkNuevosRegistros(),
        checkSalasSinEvaluar(),
        checkNuevosNudosProyectosRendiciones(),
        checkNuevosRegistrosAlfabetizacion(),
        checkRespuestasSoporte()
      ]);
      
      const addMeta = (notif: any) => ({
        ...notif,
        date: notif.date || new Date().toISOString(),
        read: readNotifications.has(notif.id)
      });
      
      notifs.push(...salasInactivas.map(addMeta));
      notifs.push(...consejosDocs.map(addMeta));
      notifs.push(...comunasDocs.map(addMeta));
      notifs.push(...rifVencido.map(addMeta));
      notifs.push(...nuevosRegistrosEntidades.map(addMeta));
      notifs.push(...salasSinEvaluar.map(addMeta));
      notifs.push(...nudosProyectosRendiciones.map(addMeta));
      notifs.push(...registrosAlfabetizacion.map(addMeta));
      notifs.push(...respuestasSoporte.map(addMeta));
      
    }
    // NOTIFICACIONES PARA DIRECTOR ADULTO MAYOR
    else if (esDirectorAdultoMayor) {      
      const [
        salasInactivas,
        consejosDocs,
        comunasDocs,
        rifVencido,
        nuevosRegistrosEntidades,
        salasSinEvaluar,
        nudosProyectosRendiciones,
        nuevosAdultosMayores,
        respuestasSoporte
      ] = await Promise.all([
        checkSalasInactivas(),
        checkConsejosDocumentosFaltantes(),
        checkComunasDocumentosFaltantes(),
        checkRifVencidoGeneral(),
        checkNuevosRegistros(),
        checkSalasSinEvaluar(),
        checkNuevosNudosProyectosRendiciones(),
        checkNuevosAdultosMayores(),
        checkRespuestasSoporte()
      ]);
      
      const addMeta = (notif: any) => ({
        ...notif,
        date: notif.date || new Date().toISOString(),
        read: readNotifications.has(notif.id)
      });
      
      notifs.push(...salasInactivas.map(addMeta));
      notifs.push(...consejosDocs.map(addMeta));
      notifs.push(...comunasDocs.map(addMeta));
      notifs.push(...rifVencido.map(addMeta));
      notifs.push(...nuevosRegistrosEntidades.map(addMeta));
      notifs.push(...salasSinEvaluar.map(addMeta));
      notifs.push(...nudosProyectosRendiciones.map(addMeta));
      notifs.push(...nuevosAdultosMayores.map(addMeta));
      notifs.push(...respuestasSoporte.map(addMeta));
      
    }
    // NOTIFICACIONES PARA DIRECTOR FORMACIÓN Y PLANIFICACIÓN
    else if (esDirectorFormacionPlanificacion) {
      const [
        salasInactivas,
        consejosDocs,
        comunasDocs,
        rifVencido,
        nuevosRegistrosEntidades,
        salasSinEvaluar,
        nudosProyectosRendiciones,
        nuevosCursosTalleres,
        respuestasSoporte
      ] = await Promise.all([
        checkSalasInactivas(),
        checkConsejosDocumentosFaltantes(),
        checkComunasDocumentosFaltantes(),
        checkRifVencidoGeneral(),
        checkNuevosRegistros(),
        checkSalasSinEvaluar(),
        checkNuevosNudosProyectosRendiciones(),
        checkNuevosCursosTalleres(),
        checkRespuestasSoporte()
      ]);
      
      const addMeta = (notif: any) => ({
        ...notif,
        date: notif.date || new Date().toISOString(),
        read: readNotifications.has(notif.id)
      });
      
      notifs.push(...salasInactivas.map(addMeta));
      notifs.push(...consejosDocs.map(addMeta));
      notifs.push(...comunasDocs.map(addMeta));
      notifs.push(...rifVencido.map(addMeta));
      notifs.push(...nuevosRegistrosEntidades.map(addMeta));
      notifs.push(...salasSinEvaluar.map(addMeta));
      notifs.push(...nudosProyectosRendiciones.map(addMeta));
      notifs.push(...nuevosCursosTalleres.map(addMeta));
      notifs.push(...respuestasSoporte.map(addMeta));
      
    }
    // NOTIFICACIONES PARA CONSEJO COMUNAL
    else if (esConsejo) {
      try {
        // ✅ Usar la función que busca por principal o auxiliar
        const consejoData = await fetchConsejoDataForUser(authUser.id);
        
        if (consejoData) {
          const idConsejo = consejoData.id_consejo;
          // Campos faltantes del consejo
          const missingFields = checkMissingFieldsConsejo(consejoData);
          missingFields.forEach(field => {
            notifs.push({
              id: `consejo_campo_${field.field}`,
              title: `⚠️ Campo faltante en consejo: ${field.label}`,
              type: 'warning',
              date: new Date().toISOString(),
              read: readNotifications.has(`consejo_campo_${field.field}`),
              route: field.route,
              daysLeft: 0
            });
          });
          
          // RIF del consejo próximo a vencer
          checkConsejoRifVencimiento(consejoData).forEach(venc => {
            notifs.push({ ...venc, date: new Date().toISOString(), read: readNotifications.has(venc.id) });
          });
          
          // Documentos faltantes
          checkMissingConsejoDocuments(consejoData).forEach(doc => {
            notifs.push({
              id: `consejo_doc_${doc.tipo}`,
              title: ` ${doc.label} faltante`,
              type: 'error',
              date: new Date().toISOString(),
              read: readNotifications.has(`consejo_doc_${doc.tipo}`),
              route: doc.route,
              daysLeft: 0
            });
          });
          
          // Vencimiento de vocerías del consejo
          (await checkVocerosConsejoVencimiento(idConsejo)).forEach(venc => {
            notifs.push({ ...venc, date: new Date().toISOString(), read: readNotifications.has(venc.id) });
          });

          // Obtener voceros
          const { data: voceros } = await supabase
            .from('voceros')
            .select('*')
            .eq('id_consejo', idConsejo);
          
          if (voceros?.length) {
            for (const vocero of voceros) {
              checkVoceroConsejoMissingFields(vocero).forEach(field => {
                notifs.push({
                  id: `vocero_consejo_campo_${vocero.id_vocero}_${field.field}`,
                  title: `⚠️ Vocero ${vocero.nombre_completo}: falta ${field.label}`,
                  type: 'warning',
                  date: new Date().toISOString(),
                  read: readNotifications.has(`vocero_consejo_campo_${vocero.id_vocero}_${field.field}`),
                  route: field.route,
                  daysLeft: 0
                });
              });
            }
            
            (await checkVoceroConsejoRifVencimiento(idConsejo)).forEach(venc => {
              notifs.push({ ...venc, date: new Date().toISOString(), read: readNotifications.has(venc.id) });
            });
            
            (await checkVoceroConsejoMissingDocuments(idConsejo)).forEach(doc => {
              notifs.push({ ...doc, date: new Date().toISOString(), read: readNotifications.has(doc.id) });
            });
          }
        }
        
        (await checkNuevasRespuestasSoporte(authUser.id)).forEach(resp => {
          notifs.push({ ...resp, date: new Date().toISOString(), read: readNotifications.has(resp.id) });
        });
        
      } catch (error) {
        console.error('Error fetching consejo notifications:', error);
      }
      
    } 
    // NOTIFICACIONES PARA COMUNA
    else if (esComuna) {
      try {
        const comunaData = await fetchComunaDataForUser(authUser.id);
        if (comunaData) {
          const idComuna = comunaData.id_comuna;
          
          const missingFields = checkMissingFieldsComuna(comunaData);
          missingFields.forEach(field => {
            notifs.push({
              id: `comuna_campo_${field.field}`,
              title: `⚠️ Campo faltante en comuna: ${field.label}`,
              type: 'warning',
              date: new Date().toISOString(),
              read: readNotifications.has(`comuna_campo_${field.field}`),
              route: field.route,
              daysLeft: 0
            });
          });
          
          checkVoceriasVencimientoComuna(comunaData).forEach(venc => {
            notifs.push({ ...venc, date: new Date().toISOString(), read: readNotifications.has(venc.id) });
          });
          
          checkComunaRifVencimiento(comunaData).forEach(venc => {
            notifs.push({ ...venc, date: new Date().toISOString(), read: readNotifications.has(venc.id) });
          });
          
          checkMissingComunaDocuments(comunaData).forEach(doc => {
            notifs.push({
              id: `comuna_doc_${doc.tipo}`,
              title: ` ${doc.label} faltante`,
              type: 'error',
              date: new Date().toISOString(),
              read: readNotifications.has(`comuna_doc_${doc.tipo}`),
              route: doc.route,
              daysLeft: 0
            });
          });

          const { data: responsables } = await supabase
            .from('responsables_gestion_comuna')
            .select('*')
            .eq('id_comuna', idComuna);
          
          if (responsables?.length) {
            for (const responsable of responsables) {
              checkResponsableMissingFields(responsable).forEach(field => {
                notifs.push({
                  id: `responsable_campo_${responsable.id_responsable}_${field.field}`,
                  title: `⚠️ Responsable ${responsable.nombre_g}: falta ${field.label}`,
                  type: 'warning',
                  date: new Date().toISOString(),
                  read: readNotifications.has(`responsable_campo_${responsable.id_responsable}_${field.field}`),
                  route: field.route,
                  daysLeft: 0
                });
              });
            }
            
            (await checkResponsableRifVencimiento(idComuna)).forEach(venc => {
              notifs.push({ ...venc, date: new Date().toISOString(), read: readNotifications.has(venc.id) });
            });
            
            (await checkResponsableMissingDocuments(idComuna)).forEach(doc => {
              notifs.push({ ...doc, date: new Date().toISOString(), read: readNotifications.has(doc.id) });
            });
          }

          const { data: vocerosComuna } = await supabase
            .from('voceros_comuna')
            .select('*')
            .eq('id_comuna', idComuna);
          
          if (vocerosComuna?.length) {
            for (const vocero of vocerosComuna) {
              checkVoceroComunaMissingFields(vocero).forEach(field => {
                notifs.push({
                  id: `vocero_comuna_campo_${vocero.id_voceroc}_${field.field}`,
                  title: `⚠️ Vocero ${vocero.nombre_completo}: falta ${field.label}`,
                  type: 'warning',
                  date: new Date().toISOString(),
                  read: readNotifications.has(`vocero_comuna_campo_${vocero.id_voceroc}_${field.field}`),
                  route: field.route,
                  daysLeft: 0
                });
              });
            }
            
            (await checkVoceroComunaRifVencimiento(idComuna)).forEach(venc => {
              notifs.push({ ...venc, date: new Date().toISOString(), read: readNotifications.has(venc.id) });
            });
            
            (await checkVoceroComunaMissingDocuments(idComuna)).forEach(doc => {
              notifs.push({ ...doc, date: new Date().toISOString(), read: readNotifications.has(doc.id) });
            });
          }
        }
        
        (await checkNuevasRespuestasSoporte(authUser.id)).forEach(resp => {
          notifs.push({ ...resp, date: new Date().toISOString(), read: readNotifications.has(resp.id) });
        });
        
      } catch (error) {
        console.error('Error fetching comuna notifications:', error);
      }
      
    } 
    // NOTIFICACIONES PARA SALA DE AUTOGOBIERNO
    else if (esSala) {
      try {
        const { data: salaData } = await supabase
          .from('datos_sala_autogobierno')
          .select('*')
          .eq('id_usuario', authUser.id)
          .maybeSingle();
        
        if (salaData) {
          const idSala = salaData.id_sala;
          
          const missingFields = checkMissingSalaFields(salaData);
          missingFields.forEach(field => {
            notifs.push({
              id: `sala_campo_${field.field}`,
              title: `⚠️ Campo faltante en sala: ${field.label}`,
              type: 'warning',
              date: new Date().toISOString(),
              read: readNotifications.has(`sala_campo_${field.field}`),
              route: field.route,
              daysLeft: 0
            });
          });
          
          (await checkSalaInfraestructura(idSala)).forEach(notif => {
            notifs.push({ ...notif, date: new Date().toISOString(), read: readNotifications.has(notif.id) });
          });
          
          (await checkSalaEquipos(idSala)).forEach(notif => {
            notifs.push({ ...notif, date: new Date().toISOString(), read: readNotifications.has(notif.id) });
          });
        }
        
        (await checkNuevasRespuestasSoporte(authUser.id)).forEach(resp => {
          notifs.push({ ...resp, date: new Date().toISOString(), read: readNotifications.has(resp.id) });
        });
        
      } catch (error) {
        console.error('Error fetching sala notifications:', error);
      }
    }

    // Eliminar duplicados y ordenar
    const uniqueNotifs = notifs.filter((notif, index, self) => 
      index === self.findIndex(n => n.id === notif.id)
    );
    
    const sortedNotifs = uniqueNotifs.sort((a, b) => 
      new Date(b.date).getTime() - new Date(a.date).getTime()
    );
    
    setNotifications(sortedNotifs);
  }, [authUser?.id, readNotifications, esDirectorComunas, esDirectorDigitalizacion, esDirectorAdultoMayor, esDirectorFormacionPlanificacion, esConsejo, esComuna, esSala, fetchComunaDataForUser]);

  // Escuchar evento de actualización de notificaciones
  useEffect(() => {
    const handleNotificationsUpdate = () => {
      if (typeof window !== 'undefined' && authUser?.id) {
        const saved = localStorage.getItem(`readNotifications_${authUser.id}`);
        if (saved) {
          const parsed = JSON.parse(saved);
          if (Array.isArray(parsed) && parsed.every(item => typeof item === 'string')) {
            setReadNotifications(new Set(parsed));
            }
          const newReadSet = new Set(JSON.parse(saved));
          setNotifications(prev => prev.map(n => ({
            ...n,
            read: newReadSet.has(n.id)
          })));
        }
      }
    };
    
    window.addEventListener('notificationsUpdated', handleNotificationsUpdate);
    return () => window.removeEventListener('notificationsUpdated', handleNotificationsUpdate);
  }, [authUser?.id]);
  
  // Suscripciones en tiempo real
  useEffect(() => {
    if (!authUser?.id) return;
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 5 * 60 * 1000);

    let channel: any;
    
    if (esDirectorComunas) {
      channel = supabase
        .channel('dashboard-notifications-director-comunas')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'datos_sala_autogobierno' }, () => fetchNotifications())
        .on('postgres_changes', { event: '*', schema: 'public', table: 'datos_consejo_comunal' }, () => fetchNotifications())
        .on('postgres_changes', { event: '*', schema: 'public', table: 'datos_comuna' }, () => fetchNotifications())
        .on('postgres_changes', { event: '*', schema: 'public', table: 'voceros' }, () => fetchNotifications())
        .on('postgres_changes', { event: '*', schema: 'public', table: 'voceros_comuna' }, () => fetchNotifications())
        .on('postgres_changes', { event: '*', schema: 'public', table: 'infraestructura_sala' }, () => fetchNotifications())
        .on('postgres_changes', { event: '*', schema: 'public', table: 'nudos_criticos' }, () => fetchNotifications())
        .on('postgres_changes', { event: '*', schema: 'public', table: 'proyectos' }, () => fetchNotifications())
        .on('postgres_changes', { event: '*', schema: 'public', table: 'rendiciones' }, () => fetchNotifications())
        .on('postgres_changes', { event: '*', schema: 'public', table: 'soporte' }, () => fetchNotifications())
        .subscribe();
    } else if (esDirectorDigitalizacion) {
      channel = supabase
        .channel('dashboard-notifications-director')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'datos_sala_autogobierno' }, () => fetchNotifications())
        .on('postgres_changes', { event: '*', schema: 'public', table: 'datos_consejo_comunal' }, () => fetchNotifications())
        .on('postgres_changes', { event: '*', schema: 'public', table: 'datos_comuna' }, () => fetchNotifications())
        .on('postgres_changes', { event: '*', schema: 'public', table: 'voceros' }, () => fetchNotifications())
        .on('postgres_changes', { event: '*', schema: 'public', table: 'voceros_comuna' }, () => fetchNotifications())
        .on('postgres_changes', { event: '*', schema: 'public', table: 'infraestructura_sala' }, () => fetchNotifications())
        .on('postgres_changes', { event: '*', schema: 'public', table: 'nudos_criticos' }, () => fetchNotifications())
        .on('postgres_changes', { event: '*', schema: 'public', table: 'proyectos' }, () => fetchNotifications())
        .on('postgres_changes', { event: '*', schema: 'public', table: 'rendiciones' }, () => fetchNotifications())
        .on('postgres_changes', { event: '*', schema: 'public', table: 'analfabetismo_digital' }, () => fetchNotifications())
        .on('postgres_changes', { event: '*', schema: 'public', table: 'soporte' }, () => fetchNotifications())
        .subscribe();
    } else if (esDirectorAdultoMayor) {
      channel = supabase
        .channel('dashboard-notifications-director-adulto-mayor')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'datos_sala_autogobierno' }, () => fetchNotifications())
        .on('postgres_changes', { event: '*', schema: 'public', table: 'datos_consejo_comunal' }, () => fetchNotifications())
        .on('postgres_changes', { event: '*', schema: 'public', table: 'datos_comuna' }, () => fetchNotifications())
        .on('postgres_changes', { event: '*', schema: 'public', table: 'voceros' }, () => fetchNotifications())
        .on('postgres_changes', { event: '*', schema: 'public', table: 'voceros_comuna' }, () => fetchNotifications())
        .on('postgres_changes', { event: '*', schema: 'public', table: 'infraestructura_sala' }, () => fetchNotifications())
        .on('postgres_changes', { event: '*', schema: 'public', table: 'nudos_criticos' }, () => fetchNotifications())
        .on('postgres_changes', { event: '*', schema: 'public', table: 'proyectos' }, () => fetchNotifications())
        .on('postgres_changes', { event: '*', schema: 'public', table: 'rendiciones' }, () => fetchNotifications())
        .on('postgres_changes', { event: '*', schema: 'public', table: 'adultos_mayores' }, () => fetchNotifications())
        .on('postgres_changes', { event: '*', schema: 'public', table: 'soporte' }, () => fetchNotifications())
        .subscribe();
    } else if (esDirectorFormacionPlanificacion) {
      channel = supabase
        .channel('dashboard-notifications-director-formacion-planificacion')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'datos_sala_autogobierno' }, () => fetchNotifications())
        .on('postgres_changes', { event: '*', schema: 'public', table: 'datos_consejo_comunal' }, () => fetchNotifications())
        .on('postgres_changes', { event: '*', schema: 'public', table: 'datos_comuna' }, () => fetchNotifications())
        .on('postgres_changes', { event: '*', schema: 'public', table: 'voceros' }, () => fetchNotifications())
        .on('postgres_changes', { event: '*', schema: 'public', table: 'voceros_comuna' }, () => fetchNotifications())
        .on('postgres_changes', { event: '*', schema: 'public', table: 'infraestructura_sala' }, () => fetchNotifications())
        .on('postgres_changes', { event: '*', schema: 'public', table: 'nudos_criticos' }, () => fetchNotifications())
        .on('postgres_changes', { event: '*', schema: 'public', table: 'proyectos' }, () => fetchNotifications())
        .on('postgres_changes', { event: '*', schema: 'public', table: 'rendiciones' }, () => fetchNotifications())
        .on('postgres_changes', { event: '*', schema: 'public', table: 'cursos' }, () => fetchNotifications())
        .on('postgres_changes', { event: '*', schema: 'public', table: 'soporte' }, () => fetchNotifications())
        .subscribe();
    } else if (esConsejo) {
      channel = supabase
        .channel('dashboard-notifications-consejo')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'datos_consejo_comunal', filter: `id_usuario=eq.${authUser.id}` }, () => fetchNotifications())
        .on('postgres_changes', { event: '*', schema: 'public', table: 'voceros', filter: `id_consejo=in.(select id_consejo from datos_consejo_comunal where id_usuario='${authUser.id}')` }, () => fetchNotifications())
        .on('postgres_changes', { event: '*', schema: 'public', table: 'soporte', filter: `id_usuario=eq.${authUser.id}` }, () => fetchNotifications())
        .subscribe();
    } else if (esComuna) {
      channel = supabase
        .channel('dashboard-notifications-comuna')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'datos_comuna' }, () => fetchNotifications())
        .on('postgres_changes', { event: '*', schema: 'public', table: 'responsables_gestion_comuna' }, () => fetchNotifications())
        .on('postgres_changes', { event: '*', schema: 'public', table: 'voceros_comuna' }, () => fetchNotifications())
        .on('postgres_changes', { event: '*', schema: 'public', table: 'soporte', filter: `id_usuario=eq.${authUser.id}` }, () => fetchNotifications())
        .subscribe();
    } else if (esSala) {
      channel = supabase
        .channel('dashboard-notifications-sala')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'datos_sala_autogobierno', filter: `id_usuario=eq.${authUser.id}` }, () => fetchNotifications())
        .on('postgres_changes', { event: '*', schema: 'public', table: 'infraestructura_sala', filter: `id_sala=in.(select id_sala from datos_sala_autogobierno where id_usuario='${authUser.id}')` }, () => fetchNotifications())
        .on('postgres_changes', { event: '*', schema: 'public', table: 'soporte', filter: `id_usuario=eq.${authUser.id}` }, () => fetchNotifications())
        .subscribe();
    }

    return () => {
      clearInterval(interval);
      if (channel) supabase.removeChannel(channel);
    };
  }, [fetchNotifications, authUser?.id, esDirectorComunas, esDirectorDigitalizacion, esDirectorAdultoMayor, esDirectorFormacionPlanificacion, esConsejo, esComuna, esSala]);

  // Manejo de clic fuera del panel
  const handleClickOutside = useCallback((event: MouseEvent) => {
    if (showNotifications && notificationsRef.current && bellButtonRef.current &&
        !notificationsRef.current.contains(event.target as Node) &&
        !bellButtonRef.current.contains(event.target as Node)) {
      setShowNotifications(false);
    }
  }, [showNotifications]);

  useEffect(() => {
    if (showNotifications) document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [handleClickOutside, showNotifications]);

  const getRoleLabel = () => {
    const rol = user?.rolNombre?.toLowerCase().trim() || '';
    if (rol.includes('digitalizacion') || rol.includes('digitalización')) return 'Dirección Digitalización';
    if (rol === 'director_comunas' || rol.includes('director_comunas') || (rol.includes('direccion') && rol.includes('comunas'))) return 'Dirección de Comunas y Consejos Comunales';
    if (rol === 'director_adulto_mayor' || rol.includes('director_adulto_mayor') || (rol.includes('direccion') && rol.includes('adulto_mayor'))) return 'Dirección de Adulto Mayor';
    if (rol === 'director_formacion_planificacion' || rol.includes('director_formacion_planificacion') || (rol.includes('planificacion') && rol.includes('formacion'))) return 'Dirección de Formación y Planificación';
    if (rol === 'vocero_cc' || rol.includes('vocero_cc') || rol === 'consejo_comunal' || rol.includes('consejo_comunal')) return 'Consejo Comunal';
    if (rol === 'vocero_c' || rol.includes('vocero_c') || rol === 'comuna' || rol.includes('comuna')) return 'Comuna';
    if (rol.includes('sala')) return '';
    const roleNames: Record<string, string> = {
      'coordinador_s': 'Sala de Autogobierno',
      'direccion': 'Dirección',
      'secretario': 'Secretaria de Participación Ciudadana y Poder Popular',
      'alcaldesa': 'Alcaldía del Municipio Carrizal',
      'admin': 'Administrador'
      //'super_admin': 'Administrador'
    };
    if (roleNames[rol]) return roleNames[rol];
    return 'Dirección';
  };

  const getComunaConsejoName = () => {
    const rol = user?.rolNombre?.toLowerCase().trim() || '';
    if (rol.includes('vocero_c')) {
      return comunaNombre || user?.nombreComuna || null;
    }
    if ((rol === 'vocero_cc' || rol.includes('consejo_comunal'))) {
      return consejoNombre || user?.nombreConsejo || null;
    }
    if (rol.includes('coordinador_s') && user?.nombreSala) return user.nombreSala;
    return null;
  };

  const roleLabel = getRoleLabel();
  const comunaConsejoName = getComunaConsejoName();
  const unreadCount = notifications.filter(n => !readNotifications.has(n.id)).length;

  const handleNotificationClick = (notification: Notification) => {
    setShowNotifications(false);
    
    const routeMap: Record<string, string> = {
      'organizacion': 'organizacion',
      'documentacion': 'documentacion',
      'voceros': 'vocerias',
      'vocerias': 'vocerias',
      'consejopec': 'consejopec',
      'datos-legales': 'documentacion',
      'soporte': 'soporte',
      'infraestructura': 'infraestructura',
      'gestion': 'gestion',
      'liderazgo': 'liderazgo',
      'validacion': 'validacion',
      'notificaciones': 'notificaciones',
      'alfa': 'alfa',
      'ayuda': 'ayuda',
      'social': 'salud',
      'formacion': 'formacion'
    };
    
    const section = routeMap[notification.route] || notification.route;
    
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('navigateToSection', { detail: { section } }));
    }
    
    router.push('/dashboard');
  };

  const handleViewAllNotifications = () => {
    setShowNotifications(false);
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('navigateToSection', { detail: { section: 'notificaciones' } }));
    }
    router.push('/dashboard?section=notificaciones');
  };

  const toggleNotifications = () => setShowNotifications(prev => !prev);
  const displayedNotifications = notifications.slice(0, 5);

  return (
    <header className="h-20 bg-white/80 backdrop-blur-md sticky top-0 z-40 px-4 md:px-8 flex items-center justify-between border-b border-slate-100">
      <div className="flex items-center gap-4 md:gap-6">
        {onMobileMenuOpen && (
          <button onClick={onMobileMenuOpen} className="p-2 rounded-xl hover:bg-slate-50 lg:hidden shadow-sm">
            <Menu size={24} className="text-slate-600" />
          </button>
        )}
          <div className="flex items-center gap-2 md:gap-4">
            {!hideRole && (
              <h2 className="text-base md:text-xl font-black text-slate-900 tracking-normal leading-none uppercase font-sans">
                {roleLabel}
              </h2>
            )}
            {subtitle && (
              <span className="text-base md:text-xl font-black text-slate-900 tracking-normal leading-none uppercase font-sans">
                {subtitle}
              </span>
            )}
            {!subtitle && comunaConsejoName && (
              <span className="text-base md:text-xl font-black text-slate-900 tracking-normal leading-none uppercase font-sans">
                {comunaConsejoName}
              </span>
            )}
          </div>
        {actions && <div className="ml-4 hidden md:flex items-center gap-3">{actions}</div>}
      </div>

      <div className="flex items-center gap-3 md:gap-6">
        <div className="flex items-center gap-2 md:gap-3 pr-3 md:pr-6 border-r border-slate-100">
          <div className="relative" ref={notificationsRef}>
            <button ref={bellButtonRef} onClick={toggleNotifications} className="w-9 h-9 md:w-10 md:h-10 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-center text-slate-400 hover:text-brand-primary hover:bg-brand-primary/5 transition-all relative group shadow-sm">
              <Bell size={18} className="group-hover:scale-110 transition-transform" />
              {unreadCount > 0 && (
                <div className="absolute -top-1 -right-1 w-5 h-5 bg-rose-500 rounded-full border-2 border-white flex items-center justify-center animate-pulse">
                  <span className="text-[8px] font-black text-white">{unreadCount}</span>
                </div>
              )}
            </button>
            <AnimatePresence>
              {showNotifications && (
                <motion.div initial={{ opacity: 0, scale: 0.95, y: 10 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 10 }} className="absolute right-0 mt-2 w-96 bg-white rounded-2xl border border-slate-100 shadow-xl z-20 overflow-hidden max-h-96">
                  <div className="p-2 border-b border-slate-100 bg-linear-to-r from-slate-50 to-gray-50">
                    <h5 className="font-black text-xs uppercase tracking-wider text-slate-700 flex items-center gap-1"><Bell className="h-3 w-3" /> Notificaciones</h5>
                  </div>
                  <div className="overflow-y-auto max-h-80">
                    {notifications.length === 0 ? (
                      <div className="p-8 text-center text-slate-400"><Bell className="mx-auto h-12 w-12 mb-4 opacity-30" /><p className="text-xs font-medium">No hay notificaciones pendientes</p><p className="text-[8px] mt-1 opacity-75">Todo está al día ✅</p></div>
                    ) : (
                      <>
                        {displayedNotifications.map((notification) => {
                          const isRead = readNotifications.has(notification.id);
                          return (
                            <motion.div 
                              key={notification.id} 
                              initial={{ opacity: 0, x: 20 }} 
                              animate={{ opacity: 1, x: 0 }} 
                              className={`p-4 border-b border-slate-50 hover:bg-slate-50 cursor-pointer flex items-start gap-3 group transition-all ${
                                !isRead 
                                  ? 'bg-linear-to-r from-rose-50 to-amber-50/50 border-l-4 border-rose-400 shadow-sm' 
                                  : 'bg-white hover:shadow-md border-l-4 border-transparent'
                              }`}
                              onClick={() => handleNotificationClick(notification)}
                            >
                              <div className="shrink-0 flex flex-col items-center gap-1">
                                <button
                                  onClick={(e) => toggleNotificationRead(e, notification.id)}
                                  className="hover:scale-110 transition-transform"
                                  title={isRead ? "Marcar como no leída" : "Marcar como leída"}
                                >
                                  {isRead ? (
                                    <CheckCircle className="h-4 w-4 text-slate-400 hover:text-brand-primary" />
                                  ) : (
                                    <Circle className="h-4 w-4 text-rose-400 hover:text-brand-primary" />
                                  )}
                                </button>
                                <div className={`w-2 h-2 rounded-full ${
                                  isRead 
                                    ? 'bg-slate-300' 
                                    : notification.type === 'error' ? 'bg-rose-500' : notification.type === 'warning' ? 'bg-amber-500' : notification.type === 'success' ? 'bg-emerald-500' : 'bg-blue-500'
                                }`} />
                              </div>
                              <div className="flex-1 min-w-0">
                                <div className="flex items-start justify-between mb-1">
                                  <p className={`text-xs font-black truncate ${
                                    isRead 
                                      ? 'text-slate-500 font-semibold' 
                                      : notification.type === 'error' ? 'text-rose-800' : notification.type === 'warning' ? 'text-amber-800' : notification.type === 'success' ? 'text-emerald-800' : 'text-blue-800'
                                  }`}>{notification.title}</p>
                                  {!isRead && <span className="text-[8px] font-bold px-1.5 py-0.5 bg-rose-100 text-rose-700 rounded-full uppercase tracking-wider">NUEVO</span>}
                                </div>
                                <p className="text-[8px] text-slate-500 uppercase tracking-wider mb-1">Haz clic para ir a la sección</p>
                                <div className="flex items-center gap-1 text-[8px] font-bold text-slate-400 group-hover:text-brand-primary transition-colors">
                                  <span>Ir a {notification.route}</span>
                                  <ExternalLink className="h-2.5 w-2.5 group-hover:translate-x-1 transition-transform" />
                                </div>
                              </div>
                            </motion.div>
                          );
                        })}
                        <div className="p-2 border-t border-slate-100 bg-linear-to-r from-slate-50 to-gray-50 sticky bottom-0">
                          <button
                            onClick={handleViewAllNotifications}
                            className="w-full py-2.5 rounded-xl bg-white border border-gray-200 text-brand-primary text-[9px] font-black uppercase tracking-wider flex items-center justify-center gap-2 hover:bg-brand-primary hover:text-white hover:border-brand-primary transition-all group"
                          >
                            <span>Ver todas las notificaciones ({notifications.length})</span>
                            <ExternalLink className="h-3 w-3 group-hover:translate-x-1 transition-transform" />
                          </button>
                        </div>
                      </>
                    )}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
          
        </div>

        {/* Perfil del usuario */}
        <div className="relative">
          <button onClick={() => setIsProfileOpen(!isProfileOpen)} className="flex items-center gap-3 md:gap-4 hover:opacity-80 transition-opacity">
            <div className="text-right hidden sm:block">
              <p className="text-sm font-black text-slate-900 tracking-tighter leading-none">
                {user?.nombre} {user?.apellido}
              </p>
              <p className="text-[10px] text-brand-primary font-bold uppercase mt-1 tracking-widest leading-none">
                Online
              </p>
            </div>
            <div className="w-9 h-9 md:w-10 md:h-10 rounded-xl bg-linear-to-tr from-slate-100 to-slate-200 border border-slate-200 flex items-center justify-center text-slate-500 overflow-hidden font-black text-sm shadow-inner">
              {profilePhotoSignedUrl ? (
                <img src={profilePhotoSignedUrl} alt="Foto de perfil" className="w-full h-full object-cover rounded-xl" />
              ) : (
                user?.nombre?.[0] || 'U'
              )}
            </div>
          </button>

          <AnimatePresence>
            {isProfileOpen && (
              <>
                <div className="fixed inset-0 z-10" onClick={() => setIsProfileOpen(false)} />
                <motion.div initial={{ opacity: 0, y: 10, scale: 0.95 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: 10, scale: 0.95 }} className="absolute right-0 mt-4 w-56 bg-white rounded-2xl border border-slate-100 shadow-xl z-20 overflow-hidden p-2">
                  <button onClick={() => { setIsProfileOpen(false); if (onNavigateToProfile) onNavigateToProfile(); }} className="flex items-center gap-3 w-full px-4 py-3 text-[10px] font-black uppercase tracking-widest text-slate-600 hover:bg-slate-50 rounded-xl transition-all">
                    <Settings size={18} className="text-slate-400" />
                    Administrar Perfil
                  </button>
                  <button onClick={() => { setIsProfileOpen(false); onLogout(); }} className="flex items-center gap-3 w-full px-4 py-3 text-[10px] font-black uppercase tracking-widest text-rose-500 hover:bg-rose-50 rounded-xl transition-all mt-1">
                    <LogOut size={18} className="text-rose-400" />
                    Cerrar Sesión
                  </button>
                </motion.div>
              </>
            )}
          </AnimatePresence>
        </div>
      </div>
    </header>
  );
};