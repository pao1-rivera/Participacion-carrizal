"use client";

import React, { useState, useEffect } from "react";
import {
  Shield, Activity, Upload, FileText, Building2,
  ChevronRight, ChevronLeft, Search, MapPin, FileCheck,
  Eye, AlertCircle, Loader2, Calendar, User, Phone, IdCard
} from "lucide-react";
import { cn } from "@/app/lib/utils";
import { supabase } from "@/app/lib/supabaseClient";
import { useAuth } from "@/context/AuthContext";
import { AlertModal } from "@/app/components/AlertModal";

// Interfaces (sin cambios)
interface Consejo {
  id_consejo: number;
  nombre_consejo: string;
  rif: string;
  codigo_situr: string;
  cuenta_bancaria: string;
  acta_constitutiva_url: string | null;
  rif_url: string | null;
  certificado_cuenta_url: string | null;
  id_sector: number;
  fecha_vencimiento_voceros: string | null;
  id_usuario: string | null;
  id_usuario_auxiliar: string | null;
}

interface Vocero {
  id_vocero: number;
  nombre_completo: string;
  cedula: string;
  unidad: string;
  comite: string | null;
  tipo: 'Principal' | 'Suplente';
  profesion: string | null;
  grado_instruccion: string | null;
  telefono: string | null;
  rif_url: string | null;
  rif_fecha_vencimiento: string | null;
  cedula_url: string | null;
}

interface ResponsablePerfil {
  nombre: string;
  apellido: string;
  cedula: string;
  telefono: string;
}

// Función para URL firmada (sin cambios)
const getSignedUrlFromPublicUrl = async (storedPath: string | null): Promise<string | null> => {
  if (!storedPath) return null;

  let bucketName = 'documentos_consejos';
  let relativePath = storedPath;

  if (storedPath.includes('http')) {
    const match = storedPath.match(/\/storage\/v1\/object\/public\/([^\/]+)\/(.+)$/);
    if (match && match.length >= 3) {
      bucketName = match[1];
      relativePath = match[2];
    } else {
      console.error('Estructura de URL pública irreconocible:', storedPath);
      return null;
    }
  } else {
    const pathPattern = storedPath.replace(/^\/+/, '');
    if (/^\d+\/(cedula|rif|avatar)\//.test(pathPattern)) {
      bucketName = 'profile-photos';
      relativePath = pathPattern;
    } else if (/^\d+\/voceros\//.test(pathPattern)) {
      bucketName = 'documentos_consejos';
      relativePath = pathPattern;
    } else {
      relativePath = pathPattern;
    }
  }

  relativePath = relativePath.replace(/^\/+/, '');

  try {
    const { data, error } = await supabase.storage
      .from(bucketName)
      .createSignedUrl(relativePath, 60);
    if (error) {
      console.error(`Error generando signed URL (bucket: ${bucketName}, path: ${relativePath}):`, error.message);
      return null;
    }
    return data.signedUrl;
  } catch (err) {
    console.error('Error inesperado:', err);
    return null;
  }
};

const formatFecha = (fecha: string | null) => {
  if (!fecha) return "No establecida";
  const [year, month, day] = fecha.split('-');
  return `${day}/${month}/${year}`;
};

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
  if (years > 0) text += `${years} año${years !== 1 ? 's' : ''} `;
  if (months > 0) text += `${months} mes${months !== 1 ? 'es' : ''} `;
  if (days > 0) text += `${days} día${days !== 1 ? 's' : ''}`;
  if (!text) text = "Hoy expira";
  text = `Expira en ${text.trim()}`;
  let color = "emerald";
  if (diffDays <= 180 && diffDays > 0) color = "amber";
  if (diffDays <= 0) color = "rose";
  return { text, color, daysLeft: diffDays };
};

export const Consejosc = () => {
  const { user } = useAuth();
  const [comunaId, setComunaId] = useState<number | null>(null);
  const [noComuna, setNoComuna] = useState(false);
  const [consejos, setConsejos] = useState<Consejo[]>([]);
  const [selectedConsejo, setSelectedConsejo] = useState<Consejo | null>(null);
  const [voceros, setVoceros] = useState<Vocero[]>([]);
  const [responsablePerfil, setResponsablePerfil] = useState<ResponsablePerfil | null>(null);
  const [responsableAuxiliarPerfil, setResponsableAuxiliarPerfil] = useState<ResponsablePerfil | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadingResponsable, setLoadingResponsable] = useState(false);
  const [loadingAuxiliar, setLoadingAuxiliar] = useState(false);
  const [selectedUnidad, setSelectedUnidad] = useState<string>("TODAS");
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [loadingDocs, setLoadingDocs] = useState<{ [key: string]: boolean }>({});
  const itemsPerPage = 5;

  // Estado para AlertModal
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

  // Ocultar sidebar cuando la alerta está abierta
  useEffect(() => {
    if (modalState.isOpen) {
      document.body.classList.add('modal-open');
    } else {
      document.body.classList.remove('modal-open');
    }
    return () => document.body.classList.remove('modal-open');
  }, [modalState.isOpen]);

  // Obtener comuna
  useEffect(() => {
    const fetchComuna = async () => {
      if (!user?.id) return;
      const { data, error } = await supabase
        .from('datos_comuna')
        .select('id_comuna')
        .or(`id_usuario.eq.${user.id},id_usuario_auxiliar.eq.${user.id}`)
        .maybeSingle();
      if (error) console.error('Error cargando comuna:', error);
      else if (data) setComunaId(data.id_comuna);
      else setNoComuna(true);
      setLoading(false);
    };
    fetchComuna();
  }, [user]);

  // Cargar consejos
  useEffect(() => {
    if (!comunaId) return;
    const fetchConsejos = async () => {
      setLoading(true);
      const { data: sectores } = await supabase
        .from('sectores')
        .select('id_sector')
        .eq('id_datos_comuna', comunaId)
        .eq('activo', true);
      if (!sectores || sectores.length === 0) {
        setConsejos([]);
        setLoading(false);
        return;
      }
      const sectorIds = sectores.map(s => s.id_sector);
      const { data: consejosData, error } = await supabase
        .from('datos_consejo_comunal')
        .select('*')
        .in('id_sector', sectorIds)
        .order('nombre_consejo');
      if (error) {
        console.error("Error cargando consejos:", error);
        setConsejos([]);
      } else {
        setConsejos(consejosData || []);
      }
      setLoading(false);
    };
    fetchConsejos();
  }, [comunaId]);

  // Cargar voceros y responsables al seleccionar consejo
  useEffect(() => {
    if (!selectedConsejo) {
      setVoceros([]);
      setResponsablePerfil(null);
      setResponsableAuxiliarPerfil(null);
      return;
    }

    // Cargar voceros (sin cambios)
    const fetchVoceros = async () => {
      const { data, error } = await supabase
        .from('voceros')
        .select('*')
        .eq('id_consejo', selectedConsejo.id_consejo)
        .order('unidad', { ascending: true });
      if (error) console.error("Error cargando voceros:", error);
      else setVoceros(data || []);
    };
    fetchVoceros();

    // Cargar responsable principal
    const fetchResponsable = async () => {
      if (!selectedConsejo.id_usuario) {
        setResponsablePerfil(null);
        return;
      }
      setLoadingResponsable(true);
      const { data: perfil, error } = await supabase
        .from('perfil_usuario')
        .select('nombre, apellido, cedula, telefono')
        .eq('id_usuario', selectedConsejo.id_usuario)
        .maybeSingle();
      setLoadingResponsable(false);
      if (error) {
        console.error("Error cargando perfil del responsable:", error);
        setResponsablePerfil(null);
      } else if (perfil) {
        setResponsablePerfil({
          nombre: perfil.nombre || "",
          apellido: perfil.apellido || "",
          cedula: perfil.cedula || "",
          telefono: perfil.telefono || "",
        });
      } else {
        setResponsablePerfil(null);
      }
    };

    // Cargar responsable auxiliar (con estado independiente)
    const fetchResponsableAuxiliar = async () => {
      if (!selectedConsejo.id_usuario_auxiliar) {
        setResponsableAuxiliarPerfil(null);
        return;
      }
      setLoadingAuxiliar(true);
      const { data: perfil, error } = await supabase
        .from('perfil_usuario')
        .select('nombre, apellido, cedula, telefono')
        .eq('id_usuario', selectedConsejo.id_usuario_auxiliar)
        .maybeSingle();
      setLoadingAuxiliar(false);
      if (error) {
        console.error("Error cargando perfil del auxiliar:", error);
        setResponsableAuxiliarPerfil(null);
      } else if (perfil) {
        setResponsableAuxiliarPerfil({
          nombre: perfil.nombre || "",
          apellido: perfil.apellido || "",
          cedula: perfil.cedula || "",
          telefono: perfil.telefono || "",
        });
      } else {
        setResponsableAuxiliarPerfil(null);
      }
    };

    fetchResponsable();
    fetchResponsableAuxiliar();
  }, [selectedConsejo]);

  const handleSelectConsejo = (id_consejo: number) => {
    const consejo = consejos.find(c => c.id_consejo === id_consejo);
    setSelectedConsejo(consejo || null);
    setCurrentPage(1);
    setSelectedUnidad("TODAS");
    setSearchTerm("");
  };

  const filteredVoceros = voceros.filter(v => {
    const matchUnidad = selectedUnidad === "TODAS" || v.unidad === selectedUnidad;
    const matchSearch = v.nombre_completo.toLowerCase().includes(searchTerm.toLowerCase()) ||
                        v.cedula.toLowerCase().includes(searchTerm.toLowerCase());
    return matchUnidad && matchSearch;
  });
  const totalPages = Math.ceil(filteredVoceros.length / itemsPerPage);
  const currentItems = filteredVoceros.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  const handleViewFile = async (url: string | null, tipo: string) => {
    if (!url) return;
    setLoadingDocs(prev => ({ ...prev, [tipo]: true }));
    const signedUrl = await getSignedUrlFromPublicUrl(url);
    setLoadingDocs(prev => ({ ...prev, [tipo]: false }));
    if (signedUrl) window.open(signedUrl, '_blank');
    else showAlert('Error', 'No se pudo abrir el documento', 'danger');
  };

  const formatCuenta = (cuenta: string) => {
    if (!cuenta) return '—';
    const visible = cuenta.slice(-4);
    const asteriscos = '*'.repeat(Math.min(cuenta.length - 4, 12));
    return `${asteriscos}${visible}`;
  };

  const getDaysUntilExpiration = (fecha: string | null): number | null => {
    if (!fecha) return null;
    const parts = fecha.split('-');
    if (parts.length !== 3) return null;
    const [anio, mes, dia] = parts;
    const date = new Date(parseInt(anio), parseInt(mes)-1, parseInt(dia));
    if (isNaN(date.getTime())) return null;
    const hoy = new Date();
    hoy.setHours(0,0,0,0);
    const diff = date.getTime() - hoy.getTime();
    return Math.ceil(diff / (1000*60*60*24));
  };

  const RifStatusBadge = ({ fecha }: { fecha: string | null }) => {
    const dias = getDaysUntilExpiration(fecha);
    if (dias === null) return null;
    if (dias < 0) return <span className="text-[8px] font-black px-1.5 py-0.5 rounded-full bg-rose-100 text-rose-700">VENCIDO</span>;
    if (dias <= 30) return <span className="text-[8px] font-black px-1.5 py-0.5 rounded-full bg-amber-100 text-amber-700">Vence en {dias} días</span>;
    return <span className="text-[8px] font-black px-1.5 py-0.5 rounded-full bg-emerald-100 text-emerald-700">Vigente</span>;
  };

  if (loading) return <div className="flex justify-center p-8"><Loader2 className="animate-spin text-brand-primary" size={28} /></div>;

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
      {/* Cabecera y selector de consejo - REDUCIDO */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 border-b border-gray-50 pb-2">
        <div>
          <h4 className="text-base font-black text-slate-800 italic uppercase tracking-tighter">
            Consejos Comunales
          </h4>
          <p className="text-[8px] text-slate-400 font-bold uppercase tracking-wider">
            Gestión y Control Comunitario
          </p>
        </div>
        <div className="relative group min-w-60">
          <div className="absolute left-3 top-1/2 -translate-y-1/2 flex items-center gap-1 pointer-events-none">
            <MapPin className="h-3 w-3 text-brand-primary" />
            <div className="h-3 w-px bg-gray-200 ml-0.5" />
          </div>
          <select
            className="w-full pl-9 pr-8 py-2 rounded-xl bg-white border border-gray-100 shadow-sm focus:ring-2 focus:ring-brand-primary/5 focus:border-brand-primary/20 outline-none text-[9px] font-black uppercase tracking-wider text-slate-700 appearance-none cursor-pointer transition-all"
            value={selectedConsejo?.id_consejo || ""}
            onChange={(e) => handleSelectConsejo(Number(e.target.value))}
          >
            <option value="">Seleccionar Consejo</option>
            {consejos.map(c => (
              <option key={c.id_consejo} value={c.id_consejo}>{c.nombre_consejo}</option>
            ))}
          </select>
        </div>
      </div>

      {selectedConsejo ? (
        <>
          {/* Identificación Institucional - REDUCIDA */}
          <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm">
            <h3 className="text-sm font-black text-slate-800 italic uppercase tracking-tighter flex items-center gap-2 mb-4">
              <Building2 className="h-4 w-4 text-brand-primary" /> Identificación Institucional
            </h3>
            
            <div className="grid gap-2 md:grid-cols-2 lg:grid-cols-4 mb-4">
              <div>
                <p className="text-[8px] font-bold text-slate-400 uppercase tracking-wider mb-0.5">Nombre del Consejo</p>
                <p className="text-[11px] font-black text-slate-800 uppercase italic">{selectedConsejo.nombre_consejo}</p>
              </div>
              <div>
                <p className="text-[8px] font-bold text-slate-400 uppercase tracking-wider mb-0.5">Código SITUR</p>
                <p className="text-[11px] font-black text-slate-800 uppercase italic">{selectedConsejo.codigo_situr}</p>
              </div>
              <div>
                <p className="text-[8px] font-bold text-slate-400 uppercase tracking-wider mb-0.5">RIF</p>
                <p className="text-[11px] font-black text-slate-800 uppercase italic">{selectedConsejo.rif}</p>
              </div>
              <div>
                <p className="text-[8px] font-bold text-slate-400 uppercase tracking-wider mb-0.5">Cuenta Bancaria</p>
                <p className="text-[11px] font-black text-slate-800 uppercase italic">{formatCuenta(selectedConsejo.cuenta_bancaria)}</p>
              </div>
            </div>

            {/* Responsables - REDUCIDO */}
            <div className="border-t border-gray-100 pt-3 mb-4">
              <div className="flex items-center gap-1.5 mb-2">
                <User className="h-3.5 w-3.5 text-brand-primary" />
                <p className="text-[8px] font-bold text-slate-400 uppercase tracking-wider">Responsables del Consejo</p>
                {loadingResponsable && <Loader2 className="h-2.5 w-2.5 animate-spin text-slate-400" />}
              </div>
              
              {!loadingResponsable && (
                <div className="space-y-2">
                  {responsablePerfil ? (
                    <div className="bg-linear-to-r from-gray-50 to-white rounded-lg p-2 shadow-sm border border-gray-100">
                      <div className="grid gap-2 md:grid-cols-4 text-[10px]">
                        <div>
                          <p className="text-[7px] font-bold text-slate-400 uppercase">Nombre (Principal)</p>
                          <p className="text-[10px] font-black text-slate-800 flex items-center gap-1">
                            <User className="h-2.5 w-2.5 text-brand-primary" />
                            {responsablePerfil.nombre} {responsablePerfil.apellido}
                          </p>
                        </div>
                        <div>
                          <p className="text-[7px] font-bold text-slate-400 uppercase">Cédula</p>
                          <p className="text-[10px] font-black text-slate-800 flex items-center gap-1">
                            <IdCard className="h-2.5 w-2.5 text-brand-primary" />
                            {responsablePerfil.cedula}
                          </p>
                        </div>
                        <div>
                          <p className="text-[7px] font-bold text-slate-400 uppercase">Teléfono</p>
                          <p className="text-[10px] font-black text-slate-800 flex items-center gap-1">
                            <Phone className="h-2.5 w-2.5 text-brand-primary" />
                            {responsablePerfil.telefono || "No registrado"}
                          </p>
                        </div>
                        <div>
                          <p className="text-[7px] font-bold text-slate-400 uppercase">Rol</p>
                          <p className="text-[10px] font-black text-brand-primary italic">Responsable Principal</p>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="bg-amber-50 text-amber-700 p-2 rounded-lg text-[8px] font-black uppercase flex items-center gap-1">
                      <AlertCircle className="h-3 w-3" />
                      {selectedConsejo.id_usuario 
                        ? "No se encontró el perfil del responsable principal."
                        : "Este consejo no tiene responsable principal asignado."}
                    </div>
                  )}

{/* Responsable Auxiliar */}
{loadingAuxiliar ? (
  <div className="bg-indigo-50/30 rounded-lg p-2 shadow-sm border border-indigo-100 flex items-center gap-2">
    <Loader2 className="h-3 w-3 animate-spin text-indigo-500" />
    <span className="text-[8px] font-bold text-indigo-600">Cargando auxiliar...</span>
  </div>
) : responsableAuxiliarPerfil ? (
  <div className="bg-linear-to-r from-indigo-50/30 to-white rounded-lg p-2 shadow-sm border border-indigo-100">
    <div className="grid gap-2 md:grid-cols-4 text-[10px]">
      <div>
        <p className="text-[7px] font-bold text-indigo-500 uppercase">Nombre (Auxiliar)</p>
        <p className="text-[10px] font-black text-slate-800 flex items-center gap-1">
          <User className="h-2.5 w-2.5 text-indigo-500" />
          {responsableAuxiliarPerfil.nombre} {responsableAuxiliarPerfil.apellido}
        </p>
      </div>
      <div>
        <p className="text-[7px] font-bold text-indigo-500 uppercase">Cédula</p>
        <p className="text-[10px] font-black text-slate-800 flex items-center gap-1">
          <IdCard className="h-2.5 w-2.5 text-indigo-500" />
          {responsableAuxiliarPerfil.cedula}
        </p>
      </div>
      <div>
        <p className="text-[7px] font-bold text-indigo-500 uppercase">Teléfono</p>
        <p className="text-[10px] font-black text-slate-800 flex items-center gap-1">
          <Phone className="h-2.5 w-2.5 text-indigo-500" />
          {responsableAuxiliarPerfil.telefono || "No registrado"}
        </p>
      </div>
      <div>
        <p className="text-[7px] font-bold text-indigo-500 uppercase">Rol</p>
        <p className="text-[10px] font-black text-indigo-600 italic">Responsable Auxiliar</p>
      </div>
    </div>
  </div>
) : selectedConsejo.id_usuario_auxiliar ? (
  <div className="bg-amber-50 text-amber-700 p-2 rounded-lg text-[8px] font-black uppercase flex items-center gap-1">
    <AlertCircle className="h-3 w-3" />
    No se encontró el perfil del responsable auxiliar. Verifica en el sistema.
  </div>
) : null}
                </div>
              )}
            </div>

            {/* Vencimiento de vocerías - REDUCIDO */}
            <div className="mb-4 pt-2 border-t border-gray-100">
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-amber-600" />
                <div className="flex-1">
                  <p className="text-[8px] font-bold text-slate-400 uppercase tracking-wider">Vencimiento de vocerías</p>
                  <div className="flex items-center justify-between mt-0.5 flex-wrap gap-1">
                    <p className="text-[10px] font-black text-slate-800">
                      {selectedConsejo.fecha_vencimiento_voceros ? formatFecha(selectedConsejo.fecha_vencimiento_voceros) : "No establecida"}
                    </p>
                    {selectedConsejo.fecha_vencimiento_voceros && (
                      (() => {
                        const { text, color } = getTimeRemaining(selectedConsejo.fecha_vencimiento_voceros);
                        const colorClasses = {
                          emerald: "bg-emerald-50 text-emerald-700 border-emerald-100",
                          amber: "bg-amber-50 text-amber-700 border-amber-100",
                          rose: "bg-rose-50 text-rose-700 border-rose-100",
                          gray: "bg-gray-50 text-gray-500 border-gray-100"
                        };
                        return (
                          <span className={`px-2 py-0.5 rounded-md text-[7px] font-black uppercase border ${colorClasses[color as keyof typeof colorClasses]}`}>
                            {text}
                          </span>
                        );
                      })()
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Documentos - REDUCIDO */}
            <div className="grid gap-3 md:grid-cols-2 pt-3 border-t border-gray-100">
              <div className="flex items-center gap-2 p-2 bg-gray-50 rounded-lg cursor-pointer hover:bg-brand-primary/5 transition-all" onClick={() => handleViewFile(selectedConsejo.acta_constitutiva_url, 'acta')}>
                <FileText className="h-4 w-4 text-brand-primary" />
                <div>
                  <p className="text-[7px] font-bold text-slate-400 uppercase tracking-wider">Acta Constitutiva</p>
                  <p className="text-[9px] font-black text-slate-800 uppercase italic truncate max-w-37.5">
                    {selectedConsejo.acta_constitutiva_url ? "Ver documento" : "No cargado"}
                  </p>
                </div>
                {loadingDocs['acta'] ? <Loader2 className="ml-auto h-2.5 w-2.5 animate-spin text-brand-primary" /> : <Upload className="ml-auto h-2.5 w-2.5 text-slate-300" />}
              </div>
              <div className="flex items-center gap-2 p-2 bg-gray-50 rounded-lg cursor-pointer hover:bg-brand-primary/5 transition-all" onClick={() => handleViewFile(selectedConsejo.certificado_cuenta_url, 'certificado')}>
                <Activity className="h-4 w-4 text-brand-primary" />
                <div>
                  <p className="text-[7px] font-bold text-slate-400 uppercase tracking-wider">Certificado Bancario</p>
                  <p className="text-[9px] font-black text-slate-800 uppercase italic truncate">
                    {selectedConsejo.certificado_cuenta_url ? "Ver documento" : "No cargado"}
                  </p>
                </div>
                {loadingDocs['certificado'] ? <Loader2 className="ml-auto h-2.5 w-2.5 animate-spin text-brand-primary" /> : <Upload className="ml-auto h-2.5 w-2.5 text-slate-300" />}
              </div>
            </div>
          </div>

          {/* Listado de vocerías - REDUCIDO */}
          <div className="space-y-4">
            <div>
              <h2 className="text-base font-black text-slate-800 italic uppercase tracking-tighter flex items-center gap-2">
                <Shield className="h-5 w-5 text-brand-primary" /> Listado de Vocerías
              </h2>
              <p className="text-[8px] text-slate-400 font-bold uppercase tracking-[0.15em] mt-0.5">
                Estructura organizativa del consejo comunal
              </p>
            </div>

            <div className="flex flex-wrap gap-1.5 mb-3">
              <button onClick={() => { setSelectedUnidad("TODAS"); setCurrentPage(1); }} className={cn("px-3 py-1 rounded-lg text-[8px] font-black uppercase tracking-wider", selectedUnidad === "TODAS" ? "bg-brand-primary text-white" : "bg-white text-slate-400 border border-gray-100 hover:bg-gray-50")}>Todas</button>
              {["Unidad Ejecutiva", "Unidad Administrativa y Financiera", "Unidad de Contraloría", "Comisión Electoral Permanente"].map(unit => (
                <button key={unit} onClick={() => { setSelectedUnidad(unit); setCurrentPage(1); }} className={cn("px-3 py-1 rounded-lg text-[8px] font-black uppercase tracking-wider", selectedUnidad === unit ? "bg-brand-primary text-white" : "bg-white text-slate-400 border border-gray-100 hover:bg-gray-50")}>{unit}</button>
              ))}
            </div>

            <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
              <div className="p-3 border-b border-gray-100 flex flex-col md:flex-row items-center justify-between gap-2 bg-gray-50/30">
                <div><h3 className="text-sm font-black text-slate-800 italic">Estructura de Vocerías</h3><p className="text-[8px] text-slate-400 font-bold uppercase mt-0.5">Registro de {voceros.length} Líderes</p></div>
                <div className="relative w-full md:w-64">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3 w-3 text-slate-400" />
                  <input type="text" placeholder="BUSCAR VOCERO O C.I..." value={searchTerm} onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }} className="w-full pl-8 pr-3 py-1.5 rounded-xl bg-white border border-gray-100 text-[9px] font-black uppercase tracking-wider outline-none focus:ring-2 focus:ring-brand-primary/5" />
                </div>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-gray-50/50 border-b border-gray-100 text-[8px] font-black text-slate-400 uppercase tracking-[0.15em]">
                      <th className="px-3 py-2">Vocero</th>
                      <th className="px-3 py-2">Instancia</th>
                      <th className="px-3 py-2">Comité</th>
                      <th className="px-3 py-2">Tipo</th>
                      <th className="px-3 py-2">Formación</th>
                      <th className="px-3 py-2">Contacto</th>
                      <th className="px-3 py-2 text-right">RIF</th>
                      <th className="px-3 py-2 text-right">Cédula</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {currentItems.map(v => (
                      <tr key={v.id_vocero} className="hover:bg-gray-50/80 transition-colors">
                        <td className="px-3 py-2"><p className="text-[10px] font-black text-slate-800">{v.nombre_completo}</p><p className="text-[7px] text-slate-400 font-bold uppercase tracking-tighter">C.I: {v.cedula}</p></td>
                        <td className="px-3 py-2"><p className="text-[8px] font-black text-slate-500 uppercase italic leading-tight">{v.unidad}</p></td>
                        <td className="px-3 py-2">{v.comite ? <span className="text-[7px] font-bold text-slate-600 italic bg-indigo-50 px-1.5 py-0.5 rounded-full">{v.comite}</span> : <span className="text-[7px] text-slate-400 italic">—</span>}</td>
                        <td className="px-3 py-2"><span className={cn("text-[7px] font-black px-1.5 py-0.5 rounded-full uppercase border", v.tipo === 'Principal' ? 'bg-indigo-50 text-indigo-600 border-indigo-100' : 'bg-slate-50 text-slate-600 border-slate-100')}>{v.tipo}</span></td>
                        <td className="px-3 py-2"><p className="text-[9px] font-bold text-slate-700 italic">{v.profesion || '—'}</p><p className="text-[7px] text-slate-400 font-black uppercase tracking-wider">{v.grado_instruccion || '—'}</p></td>
                        <td className="px-3 py-2 text-[9px] font-bold text-slate-500">{v.telefono || '—'}</td>
                        <td className="px-3 py-2 text-right">
                          <div className="flex flex-col items-end gap-0.5">
                            {v.rif_url ? (
                              <button onClick={() => handleViewFile(v.rif_url, `rif_${v.id_vocero}`)} className="inline-flex items-center justify-center h-6 w-6 rounded-lg bg-emerald-50 text-emerald-500 border border-emerald-100 hover:bg-emerald-100">
                                {loadingDocs[`rif_${v.id_vocero}`] ? <Loader2 className="h-3 w-3 animate-spin" /> : <Eye className="h-3 w-3" />}
                              </button>
                            ) : (
                              <div className="inline-flex items-center justify-center h-6 w-6 rounded-lg bg-rose-50 text-rose-500 border border-rose-100">
                                <AlertCircle className="h-3 w-3" />
                              </div>
                            )}
                            <RifStatusBadge fecha={v.rif_fecha_vencimiento} />
                          </div>
                        </td>
                        <td className="px-3 py-2 text-right">
                          {v.cedula_url ? (
                            <button onClick={() => handleViewFile(v.cedula_url, `cedula_${v.id_vocero}`)} className="inline-flex items-center justify-center h-6 w-6 rounded-lg bg-emerald-50 text-emerald-500 border border-emerald-100 hover:bg-emerald-100">
                              {loadingDocs[`cedula_${v.id_vocero}`] ? <Loader2 className="h-3 w-3 animate-spin" /> : <Eye className="h-3 w-3" />}
                            </button>
                          ) : (
                            <div className="inline-flex items-center justify-center h-6 w-6 rounded-lg bg-rose-50 text-rose-500 border border-rose-100">
                              <AlertCircle className="h-3 w-3" />
                            </div>
                          )}
                        </td>
                      </tr>
                    ))}
                    {currentItems.length === 0 && (
                      <tr><td colSpan={8} className="p-6 text-center text-slate-400 text-xs">No hay voceros registrados</td></tr>
                    )}
                  </tbody>
                </table>
              </div>
              {totalPages > 1 && (
                <div className="p-3 border-t border-gray-100 flex items-center justify-between bg-gray-50/30">
                  <p className="text-[8px] font-bold text-slate-400 uppercase">Página {currentPage} de {totalPages}</p>
                  <div className="flex gap-1.5">
                    <button onClick={() => setCurrentPage(p => Math.max(1, p-1))} disabled={currentPage === 1} className="p-1 rounded-lg bg-white border border-gray-100 text-slate-400 disabled:opacity-50"><ChevronLeft className="h-3 w-3" /></button>
                    <button onClick={() => setCurrentPage(p => Math.min(totalPages, p+1))} disabled={currentPage === totalPages} className="p-1 rounded-lg bg-white border border-gray-100 text-slate-400 disabled:opacity-50"><ChevronRight className="h-3 w-3" /></button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </>
      ) : (
        <div className="bg-white p-8 rounded-xl text-center text-slate-400">
          <AlertCircle className="h-8 w-8 mx-auto mb-2 text-amber-400" />
          <p className="font-black uppercase text-xs">Selecciona un consejo comunal para ver sus datos</p>
        </div>
      )}

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