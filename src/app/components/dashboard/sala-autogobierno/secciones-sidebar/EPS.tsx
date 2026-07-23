"use client";

import React, { useState, useEffect, useMemo, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Building2, MapPin, User, Phone, Mail, Briefcase, 
  ChevronLeft, ChevronRight, X, CheckCircle2, FileCheck,
  Users, Loader2, Search, Eye, Factory, HandCoins,
  TrendingUp, Clock, PlusCircle, AlertCircle, RefreshCw
} from "lucide-react";
import { cn } from "@/app/lib/utils";
import { supabase } from "@/app/lib/supabaseClient";
import { useAuth } from "@/context/AuthContext";
import { AlertModal } from "@/app/components/AlertModal";

// ==================== TIPOS ====================
interface EPSProps {
  onNavigate: (section: string) => void;
}

interface ConsejoComunal {
  id_consejo: number;
  nombre_consejo: string;
}

interface EPSRecord {
  id_eps: number;
  id_comuna: number;
  id_consejo: number;
  nombre_eps: string;
  rif_registro: string | null;
  tipo_eps: string;
  direccion: string;
  latitud: number | null;
  longitud: number | null;
  responsable_nombre: string;
  responsable_cedula: string;
  responsable_telefono: string;
  responsable_correo: string | null;
  rol_organizacion: string | null;
  numero_integrantes: number;
  integrantes_hombres: number | null;
  integrantes_mujeres: number | null;
  integrantes_jovenes: number | null;
  sector_economico: string;
  descripcion_actividad: string;
  estatus_actual: string;
  created_at: string;
  updated_at: string;
  id_usuario: string;
}

// ==================== CONSTANTES ====================
const TIPOS_EPS = [
  "Directa (manejada por la propia Comuna/Consejo Comunal)",
  "Indirecta (manejada por el Estado en coordinación con la comuna)",
  "Emprendimiento Familiar / Socio-productivo"
];

const SECTORES_ECONOMICOS = [
  "Agropecuario / Producción primaria",
  "Manufactura / Transformación (textil, calzado, alimentos artesanales)",
  "Servicios (peluquería, reparación, transporte)",
  "Comercio"
];

const ESTATUS = ["Activa", "Inactiva", "En fase de proyecto"];

const OPERADORAS = ["0424", "0414", "0412", "0422", "0416", "0426"];

const RIF_TIPOS = ["J", "G"];
const CEDULA_TIPOS = ["V", "E"];

// ==================== COMPONENTES UI ====================
const CardContainer = ({ children }: { children: React.ReactNode }) => (
  <motion.div 
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    className="bg-white p-3 rounded-xl border border-gray-100 shadow-sm hover:shadow-md transition-all"
  >
    {children}
  </motion.div>
);

const SectionHeader = ({ icon: Icon, title, subtitle }: any) => (
  <div className="flex items-center gap-2 mb-3">
    <div className="h-8 w-8 rounded-xl bg-brand-primary/10 flex items-center justify-center text-brand-primary">
      <Icon size={16} />
    </div>
    <div>
      <h3 className="text-[10px] font-black text-slate-800 italic uppercase tracking-tight">{title}</h3>
      <p className="text-[7px] font-bold text-slate-400 uppercase tracking-wider">{subtitle}</p>
    </div>
  </div>
);

const InputField = React.memo(({ label, value, onChange, placeholder, type = "text", required = true, maxLength }: any) => {
  const isNumber = type === "number";
  const noSpinnerClass = "[appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none [-moz-appearance:textfield]";
  return (
    <div className="space-y-1">
      <label className="text-[7px] font-bold text-slate-400 uppercase ml-1 block">{label} {required && '*'}</label>
      <input 
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        maxLength={maxLength}
        className={cn(
          "w-full p-1.5 px-3 rounded-xl bg-gray-50 border-none ring-1 ring-gray-100 text-[10px] font-bold outline-none focus:ring-2 focus:ring-brand-primary transition-all",
          isNumber && noSpinnerClass
        )}
      />
    </div>
  );
});

const SelectField = React.memo(({ label, value, onChange, options, required = true }: any) => (
  <div className="space-y-1">
    <label className="text-[7px] font-bold text-slate-400 uppercase ml-1 block">{label} {required && '*'}</label>
    <select 
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="w-full p-1.5 px-3 rounded-xl bg-gray-50 border-none ring-1 ring-gray-100 text-[10px] font-bold outline-none focus:ring-2 focus:ring-brand-primary transition-all appearance-none"
    >
      <option value="">Seleccione...</option>
      {options.map((opt: any) => (
        <option key={typeof opt === 'object' ? opt.value : opt} value={typeof opt === 'object' ? opt.value : opt}>
          {typeof opt === 'object' ? opt.label : opt}
        </option>
      ))}
    </select>
  </div>
));

// ==================== DetailItem MODIFICADO (más grande y oscuro) ====================
const DetailItem = ({ label, value }: { label: string; value: any }) => (
  <div className="border-b border-gray-100 pb-2">
    <p className="text-[11px] font-bold text-slate-600 uppercase tracking-widest">{label}</p>
    <p className="text-sm font-medium text-slate-800 mt-0.5">{value || '—'}</p>
  </div>
);

// ==================== COMPONENTE PRINCIPAL ====================
export const EPS = ({ onNavigate }: EPSProps) => {
  const { user } = useAuth();
  
  const [noSala, setNoSala] = useState(false);
  const [comunaId, setComunaId] = useState<number | null>(null);
  const [consejos, setConsejos] = useState<ConsejoComunal[]>([]);
  const [epsList, setEpsList] = useState<EPSRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingData, setLoadingData] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const ITEMS_PER_PAGE = 5;
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  
  const [showModal, setShowModal] = useState(false);
  const [currentStep, setCurrentStep] = useState(1);
  const [saving, setSaving] = useState(false);
  const [selectedEPS, setSelectedEPS] = useState<EPSRecord | null>(null);
  
  // Formulario
  const [formData, setFormData] = useState({
    // Paso 1 - Identificación EPS
    nombre_eps: '',
    rif_tipo: '',
    rif_numero: '',
    rif_digito: '',
    tipo_eps: '',
    consejoId: '',
    direccion: '',
    // Paso 2 - Vocero/Responsable
    responsable_nombre: '',
    cedula_tipo: '',
    cedula_numero: '',
    codTel: '',
    responsable_telefono: '',
    responsable_correo: '',
    rol_organizacion: '',
    numero_integrantes: '',
    integrantes_hombres: '',
    integrantes_mujeres: '',
    integrantes_jovenes: '',
    // Paso 3 - Actividad Económica
    sector_economico: '',
    descripcion_actividad: '',
    estatus_actual: '',
  });

  const steps = [
    { title: "Identificación EPS", subtitle: "Datos de la organización", icon: Building2 },
    { title: "Vocero Responsable", subtitle: "Persona de contacto", icon: User },
    { title: "Actividad Económica", subtitle: "Capacidad productiva", icon: Briefcase },
  ];

  // Alert Modal
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

  // Ocultar sidebar cuando modal abierto
  useEffect(() => {
    if (showModal || selectedEPS || modalState.isOpen) {
      document.body.classList.add('modal-open');
    } else {
      document.body.classList.remove('modal-open');
    }
    return () => document.body.classList.remove('modal-open');
  }, [showModal, selectedEPS, modalState.isOpen]);

  // Handlers
  const handleInputChange = useCallback((field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  }, []);

  const handleRifNumeroChange = useCallback((value: string) => {
    handleInputChange('rif_numero', value.replace(/\D/g, '').slice(0, 8));
  }, [handleInputChange]);

  const handleRifDigitoChange = useCallback((value: string) => {
    handleInputChange('rif_digito', value.replace(/\D/g, '').slice(0, 1));
  }, [handleInputChange]);

  const handleCedulaNumeroChange = useCallback((value: string) => {
    handleInputChange('cedula_numero', value.replace(/\D/g, '').slice(0, 8));
  }, [handleInputChange]);

  const handleTelefonoChange = useCallback((value: string) => {
    handleInputChange('responsable_telefono', value.replace(/\D/g, '').slice(0, 7));
  }, [handleInputChange]);

  // Validación de pasos
  const validateStep = useCallback((step: number): boolean => {
    switch (step) {
      case 1:
        if (!formData.nombre_eps.trim()) return false;
        if (!formData.tipo_eps) return false;
        if (!formData.consejoId || !/^\d+$/.test(formData.consejoId)) return false;
        if (!formData.direccion.trim()) return false;
        return true;
      case 2:
        if (!formData.responsable_nombre.trim()) return false;
        if (!formData.cedula_tipo) return false;
        if (!formData.cedula_numero || formData.cedula_numero.length < 7) return false;
        if (!formData.codTel || !formData.responsable_telefono || !/^\d{7}$/.test(formData.responsable_telefono)) return false;
        if (!formData.numero_integrantes || parseInt(formData.numero_integrantes) <= 0) return false;
        return true;
      case 3:
        if (!formData.sector_economico) return false;
        if (!formData.descripcion_actividad.trim()) return false;
        if (!formData.estatus_actual) return false;
        return true;
      default: return true;
    }
  }, [formData]);

  const handleNext = useCallback(() => {
    if (validateStep(currentStep)) {
      setCurrentStep(prev => prev + 1);
    } else {
      showAlert('Campos incompletos', 'Completa todos los campos obligatorios antes de continuar.', 'warning');
    }
  }, [currentStep, validateStep]);

  // Carga inicial: obtener comuna del usuario y sus consejos
  useEffect(() => {
    if (!user?.id) return;
    const fetchComuna = async () => {
      setLoadingData(true);
      setErrorMsg(null);
      const { data: sala, error: salaError } = await supabase
        .from('datos_sala_autogobierno')
        .select('id_comuna')
        .eq('id_usuario', user.id)
        .maybeSingle();
      if (salaError) {
        console.error("Error al obtener sala:", salaError);
        setErrorMsg("Error al obtener la sala de autogobierno");
        setLoadingData(false);
        return;
      }
      if (sala?.id_comuna) {
        console.log("Comuna encontrada:", sala.id_comuna);
        setComunaId(sala.id_comuna);
        const { data: sectores } = await supabase
          .from('sectores')
          .select('id_sector')
          .eq('id_datos_comuna', sala.id_comuna)
          .eq('activo', true);
        if (sectores && sectores.length) {
          const sectorIds = sectores.map(s => s.id_sector);
          const { data: consejosData } = await supabase
            .from('datos_consejo_comunal')
            .select('id_consejo, nombre_consejo')
            .in('id_sector', sectorIds);
          setConsejos(consejosData || []);
        } else setConsejos([]);
      } else {
        console.log("No se encontró comuna para el usuario");
        setNoSala(true);
      }
      setLoadingData(false);
    };
    fetchComuna();
  }, [user]);

  // Cargar lista de EPS
  const fetchEPS = useCallback(async () => {
    if (!comunaId) {
      console.log("fetchEPS: comunaId es null, no se ejecuta");
      setLoading(false);
      return;
    }
    console.log("Fetching EPS para comunaId:", comunaId);
    setLoading(true);
    setErrorMsg(null);
    const { data, error } = await supabase
      .from('eps_emprendimientos')
      .select('*')
      .eq('id_comuna', comunaId)
      .order('created_at', { ascending: false });
    if (error) {
      console.error("Error en fetchEPS:", error);
      setErrorMsg(`Error al cargar registros: ${error.message}`);
      setEpsList([]);
    } else {
      console.log(`EPS encontrados: ${data?.length || 0}`, data);
      setEpsList(data || []);
    }
    setLoading(false);
  }, [comunaId]);

  useEffect(() => {
    if (comunaId) {
      fetchEPS();
    } else {
      setLoading(false);
    }
  }, [comunaId, fetchEPS]);

  // Recarga manual
  const handleRefresh = () => {
    fetchEPS();
  };

  // Obtener nombre del consejo
  const getConsejoName = useCallback((consejoId: number) => {
    const consejo = consejos.find(c => c.id_consejo === consejoId);
    return consejo?.nombre_consejo || 'Desconocido';
  }, [consejos]);

  // Submit
  const handleSubmit = async () => {
    if (!validateStep(3)) {
      showAlert('Paso incompleto', 'Completa todos los campos del último paso.', 'warning');
      return;
    }
    if (!comunaId) {
      showAlert('Error', 'No se pudo identificar la comuna.', 'danger');
      return;
    }
    if (!formData.consejoId || !/^\d+$/.test(formData.consejoId)) {
      showAlert('Error', 'Debes seleccionar un consejo comunal válido.', 'danger');
      return;
    }

    // Construir RIF y Cédula
    const rifCompleto = formData.rif_tipo && formData.rif_numero && formData.rif_digito
      ? `${formData.rif_tipo}-${formData.rif_numero}-${formData.rif_digito}`
      : null;
    const cedulaCompleta = `${formData.cedula_tipo}${formData.cedula_numero}`;

    // Verificar duplicado por nombre
    const { data: existing, error: checkError } = await supabase
      .from('eps_emprendimientos')
      .select('id_eps')
      .eq('id_comuna', comunaId)
      .eq('nombre_eps', formData.nombre_eps.trim())
      .maybeSingle();

    if (checkError) console.error(checkError);
    if (existing) {
      showAlert('Nombre duplicado', 'Ya existe una EPS/emprendimiento con este nombre en tu comuna.', 'warning');
      return;
    }

    setSaving(true);

    const telefonoCompleto = `${formData.codTel}${formData.responsable_telefono}`;
    const newEPS = {
      id_comuna: comunaId,
      id_consejo: parseInt(formData.consejoId, 10),
      nombre_eps: formData.nombre_eps.trim(),
      rif_registro: rifCompleto,
      tipo_eps: formData.tipo_eps,
      direccion: formData.direccion.trim(),
      latitud: null,
      longitud: null,
      responsable_nombre: formData.responsable_nombre.trim(),
      responsable_cedula: cedulaCompleta,
      responsable_telefono: telefonoCompleto,
      responsable_correo: formData.responsable_correo.trim() || null,
      rol_organizacion: formData.rol_organizacion.trim() || null,
      numero_integrantes: parseInt(formData.numero_integrantes),
      integrantes_hombres: formData.integrantes_hombres ? parseInt(formData.integrantes_hombres) : null,
      integrantes_mujeres: formData.integrantes_mujeres ? parseInt(formData.integrantes_mujeres) : null,
      integrantes_jovenes: formData.integrantes_jovenes ? parseInt(formData.integrantes_jovenes) : null,
      sector_economico: formData.sector_economico,
      descripcion_actividad: formData.descripcion_actividad.trim(),
      estatus_actual: formData.estatus_actual,
      id_usuario: user?.id || null,
    };

    const { error } = await supabase.from('eps_emprendimientos').insert([newEPS]);
    if (error) {
      console.error(error);
      showAlert('Error al guardar', error.message, 'danger');
    } else {
      showAlert('Registro exitoso', 'EPS/Emprendimiento registrado correctamente.', 'success');
      setShowModal(false);
      // Resetear formulario
      setFormData({
        nombre_eps: '', rif_tipo: '', rif_numero: '', rif_digito: '', tipo_eps: '', consejoId: '', direccion: '',
        responsable_nombre: '', cedula_tipo: '', cedula_numero: '', codTel: '', responsable_telefono: '',
        responsable_correo: '', rol_organizacion: '', numero_integrantes: '',
        integrantes_hombres: '', integrantes_mujeres: '', integrantes_jovenes: '',
        sector_economico: '', descripcion_actividad: '', estatus_actual: '',
      });
      setCurrentStep(1);
      await fetchEPS(); // Refrescar lista
    }
    setSaving(false);
  };

  // Contenido de pasos (Ajuste de tamaños y colores en el formulario modal)
  const stepContent = useMemo(() => {
    // Clases comunes para inputs y selects dentro del modal
    const inputClass = "w-full p-1.5 px-3 rounded-xl bg-gray-50 border-none ring-1 ring-gray-100 text-[12px] font-bold outline-none focus:ring-2 focus:ring-brand-primary transition-all";
    const selectClass = "w-full p-1.5 px-3 rounded-xl bg-gray-50 border-none ring-1 ring-gray-100 text-[12px] font-bold outline-none focus:ring-2 focus:ring-brand-primary transition-all appearance-none";
    const labelClass = "text-[9px] font-bold text-slate-600 uppercase ml-1 block";
    const noSpinnerClass = "[appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none [-moz-appearance:textfield]";

    switch (currentStep) {
      case 1:
        return (
          <div key="step1" className="grid grid-cols-1 lg:grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className={labelClass}>Nombre de la EPS / Emprendimiento *</label>
              <input className={inputClass} value={formData.nombre_eps} onChange={(e) => handleInputChange('nombre_eps', e.target.value)} placeholder="Ej: Panadería Comunal 'Fuerza Rebelde'" />
            </div>
            
            <div className="space-y-1">
              <label className={labelClass}>RIF / Registro Legal</label>
              <div className="flex gap-1.5 items-center">
                <select 
                  value={formData.rif_tipo} 
                  onChange={(e) => handleInputChange('rif_tipo', e.target.value)}
                  className="w-16 p-1.5 rounded-xl bg-gray-50 ring-1 ring-gray-100 text-[12px] font-bold outline-none focus:ring-2 focus:ring-brand-primary"
                >
                  <option value="">Tipo</option>
                  {RIF_TIPOS.map(tipo => <option key={tipo} value={tipo}>{tipo}</option>)}
                </select>
                <input 
                  type="text"
                  placeholder="12345678"
                  value={formData.rif_numero}
                  onChange={(e) => handleRifNumeroChange(e.target.value)}
                  maxLength={8}
                  className={cn(inputClass, "w-28")}
                />
                <span className="text-slate-500 font-bold">-</span>
                <input 
                  type="text"
                  placeholder="9"
                  value={formData.rif_digito}
                  onChange={(e) => handleRifDigitoChange(e.target.value)}
                  maxLength={1}
                  className={cn(inputClass, "w-12 text-center")}
                />
              </div>
            </div>

            <div className="space-y-1">
              <label className={labelClass}>Tipo de EPS *</label>
              <select className={selectClass} value={formData.tipo_eps} onChange={(e) => handleInputChange('tipo_eps', e.target.value)}>
                <option value="">Seleccione...</option>
                {TIPOS_EPS.map(opt => <option key={opt} value={opt}>{opt}</option>)}
              </select>
            </div>

            <div className="space-y-1">
              <label className={labelClass}>Consejo Comunal de Base *</label>
              <select className={selectClass} value={formData.consejoId} onChange={(e) => handleInputChange('consejoId', e.target.value)}>
                <option value="">Seleccione...</option>
                {consejos.map(c => <option key={c.id_consejo} value={c.id_consejo}>{c.nombre_consejo}</option>)}
              </select>
            </div>

            {consejos.length === 0 && (
              <div className="lg:col-span-2 flex items-center gap-2 p-2 bg-amber-50 rounded-lg text-amber-700 text-[9px] font-bold">
                <AlertCircle className="h-3 w-3" />
                No hay consejos comunales disponibles. Es necesario registrar al menos un consejo en tu comuna.
              </div>
            )}
            <div className="lg:col-span-2 space-y-1">
              <label className={labelClass}>Dirección Exacta *</label>
              <input className={inputClass} value={formData.direccion} onChange={(e) => handleInputChange('direccion', e.target.value)} placeholder="Calle, sector, punto de referencia" />
            </div>
          </div>
        );
      case 2:
        return (
          <div key="step2" className="grid grid-cols-1 lg:grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className={labelClass}>Nombre y Apellido *</label>
              <input className={inputClass} value={formData.responsable_nombre} onChange={(e) => handleInputChange('responsable_nombre', e.target.value)} />
            </div>
            
            <div className="space-y-1">
              <label className={labelClass}>Cédula de Identidad *</label>
              <div className="flex gap-1.5">
                <select 
                  value={formData.cedula_tipo} 
                  onChange={(e) => handleInputChange('cedula_tipo', e.target.value)}
                  className="w-16 p-1.5 rounded-xl bg-gray-50 ring-1 ring-gray-100 text-[12px] font-bold outline-none focus:ring-2 focus:ring-brand-primary"
                >
                  <option value="">Tipo</option>
                  {CEDULA_TIPOS.map(tipo => <option key={tipo} value={tipo}>{tipo}</option>)}
                </select>
                <input 
                  type="text"
                  placeholder="12345678"
                  value={formData.cedula_numero}
                  onChange={(e) => handleCedulaNumeroChange(e.target.value)}
                  maxLength={8}
                  className={inputClass}
                />
              </div>
            </div>

            <div className="space-y-1">
              <label className={labelClass}>Teléfono *</label>
              <div className="flex gap-1.5">
                <select 
                  value={formData.codTel} 
                  onChange={(e) => handleInputChange('codTel', e.target.value)}
                  className="w-20 p-1.5 rounded-xl bg-gray-50 ring-1 ring-gray-100 text-[12px] font-bold outline-none focus:ring-2 focus:ring-brand-primary"
                >
                  <option value="">Cód.</option>
                  {OPERADORAS.map(op => <option key={op} value={op}>{op}</option>)}
                </select>
                <input 
                  type="number" 
                  placeholder="Número"
                  value={formData.responsable_telefono} 
                  onChange={(e) => handleTelefonoChange(e.target.value)}
                  className={cn(inputClass, noSpinnerClass)}
                />
              </div>
            </div>
            <div className="space-y-1">
              <label className={labelClass}>Correo de contacto</label>
              <input className={inputClass} type="email" value={formData.responsable_correo} onChange={(e) => handleInputChange('responsable_correo', e.target.value)} />
            </div>
            <div className="space-y-1">
              <label className={labelClass}>Rol en la organización</label>
              <input className={inputClass} value={formData.rol_organizacion} onChange={(e) => handleInputChange('rol_organizacion', e.target.value)} placeholder="Ej: Vocero principal, Coordinador" />
            </div>
            <div className="space-y-1">
              <label className={labelClass}>Número de integrantes / Socios *</label>
              <input type="number" className={cn(inputClass, noSpinnerClass)} value={formData.numero_integrantes} onChange={(e) => handleInputChange('numero_integrantes', e.target.value)} />
            </div>
            <div className="space-y-1">
              <label className={labelClass}>Integrantes hombres</label>
              <input type="number" className={cn(inputClass, noSpinnerClass)} value={formData.integrantes_hombres} onChange={(e) => handleInputChange('integrantes_hombres', e.target.value)} />
            </div>
            <div className="space-y-1">
              <label className={labelClass}>Integrantes mujeres</label>
              <input type="number" className={cn(inputClass, noSpinnerClass)} value={formData.integrantes_mujeres} onChange={(e) => handleInputChange('integrantes_mujeres', e.target.value)} />
            </div>
            <div className="space-y-1">
              <label className={labelClass}>Integrantes jóvenes (≤30 años)</label>
              <input type="number" className={cn(inputClass, noSpinnerClass)} value={formData.integrantes_jovenes} onChange={(e) => handleInputChange('integrantes_jovenes', e.target.value)} />
            </div>
          </div>
        );
      case 3:
        return (
          <div key="step3" className="grid grid-cols-1 gap-3">
            <div className="space-y-1">
              <label className={labelClass}>Sector Económico *</label>
              <select className={selectClass} value={formData.sector_economico} onChange={(e) => handleInputChange('sector_economico', e.target.value)}>
                <option value="">Seleccione...</option>
                {SECTORES_ECONOMICOS.map(opt => <option key={opt} value={opt}>{opt}</option>)}
              </select>
            </div>
            <div className="space-y-1">
              <label className={labelClass}>Descripción de la actividad *</label>
              <textarea rows={3} className="w-full p-1.5 px-3 rounded-xl bg-gray-50 border-none ring-1 ring-gray-100 text-[12px] font-bold outline-none focus:ring-2 focus:ring-brand-primary" value={formData.descripcion_actividad} onChange={(e) => handleInputChange('descripcion_actividad', e.target.value)} placeholder="¿Qué produce, fabrica o vende exactamente?" />
            </div>
            <div className="space-y-1">
              <label className={labelClass}>Estatus Actual *</label>
              <select className={selectClass} value={formData.estatus_actual} onChange={(e) => handleInputChange('estatus_actual', e.target.value)}>
                <option value="">Seleccione...</option>
                {ESTATUS.map(opt => <option key={opt} value={opt}>{opt}</option>)}
              </select>
            </div>
          </div>
        );
      default: return null;
    }
  }, [currentStep, formData, handleInputChange, handleRifNumeroChange, handleRifDigitoChange, handleCedulaNumeroChange, handleTelefonoChange, consejos]);

  // Estadísticas para caracterización
  const totalEPS = epsList.length;
  const activas = epsList.filter(e => e.estatus_actual === 'Activa').length;
  const enProyecto = epsList.filter(e => e.estatus_actual === 'En fase de proyecto').length;
  const totalIntegrantes = epsList.reduce((acc, e) => acc + (e.numero_integrantes || 0), 0);
  const sectorPrincipal = epsList.reduce((acc, e) => {
    acc[e.sector_economico] = (acc[e.sector_economico] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);
  const sectorTop = Object.entries(sectorPrincipal).sort((a,b) => b[1] - a[1])[0]?.[0] || 'Ninguno';

  // Filtrado y paginación
  const filteredEPS = useMemo(() => {
    const term = searchTerm.toLowerCase();
    return epsList.filter(e => 
      e.nombre_eps.toLowerCase().includes(term) || 
      e.responsable_nombre.toLowerCase().includes(term) ||
      e.responsable_cedula.includes(term)
    );
  }, [epsList, searchTerm]);

  const totalPages = Math.ceil(filteredEPS.length / ITEMS_PER_PAGE);
  const paginatedEPS = filteredEPS.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE);

  if (loadingData) return <div className="flex justify-center p-8"><Loader2 className="animate-spin text-brand-primary" size={28} /></div>;

    if (noSala) {
      return (
        <div className="flex flex-col items-center justify-center min-h-[60vh] text-center p-8 bg-white rounded-3xl border border-gray-100 shadow-sm">
          <div className="h-20 w-20 rounded-full bg-amber-100 flex items-center justify-center mb-6">
            <AlertCircle className="h-10 w-10 text-amber-600" />
          </div>
          <h3 className="text-xl font-black text-slate-800 uppercase tracking-tighter mb-2">
            Aún no has registrado tu Sala de Autogobierno
          </h3>
          <p className="text-slate-500 max-w-md mb-8">
            Para acceder a las estadísticas y funcionalidades del dashboard, primero debes completar los datos legales de tu sala.
          </p>
          <button
            onClick={() => onNavigate("datosl")}
            className="px-8 py-3 bg-brand-primary text-white rounded-xl font-black text-sm shadow-lg hover:scale-[1.02] transition-all flex items-center gap-2"
          >
            <FileCheck className="h-4 w-4" />
            Completar Datos Legales
          </button>
        </div>
      );
    }

  return (
    <div className="space-y-4 p-3 md:p-0">
      {/* HEADER */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 bg-white p-4 rounded-xl border border-gray-100 shadow-sm">
        <div>
          <h2 className="text-sm font-black text-slate-800 italic uppercase tracking-tighter flex items-center gap-2">
            <Factory className="h-4 w-4 text-brand-primary" /> EPS y Emprendimientos Comunitarios
          </h2>
          <p className="text-[8px] text-slate-400 font-bold uppercase tracking-[0.15em] mt-0.5">
            Registro de Unidades Productivas
          </p>
        </div>
        <div className="flex gap-2">
          <button 
            onClick={handleRefresh}
            className="p-1.5 rounded-lg bg-gray-100 text-slate-600 hover:bg-gray-200 transition-all"
            title="Recargar lista"
          >
            <RefreshCw className="h-3 w-3" />
          </button>
          <button 
            onClick={() => { setShowModal(true); setCurrentStep(1); }}
            disabled={consejos.length === 0}
            className={cn(
              "px-4 py-1.5 text-white rounded-lg text-[8px] font-black italic uppercase tracking-wider transition-all shadow-sm flex items-center gap-1",
              consejos.length === 0 ? "bg-gray-300 cursor-not-allowed" : "bg-brand-primary hover:bg-brand-primary/90"
            )}
          >
            <PlusCircle className="h-3 w-3" /> Nuevo Registro
          </button>
        </div>
      </div>
      
      {/* DASHBOARD PREVIEW - CARACTERIZACIÓN */}
      <div className="grid gap-3 md:grid-cols-4">
        <CardContainer>
          <SectionHeader icon={Building2} title="Total EPS" subtitle="Unidades Registradas" />
          <div className="text-2xl font-black italic text-slate-800">{totalEPS}</div>
          <div className="flex gap-2 mt-1 text-[8px] font-bold">
            <span className="text-emerald-600">Activas: {activas}</span>
            <span className="text-amber-600">Proyecto: {enProyecto}</span>
          </div>
        </CardContainer>
        <CardContainer>
          <SectionHeader icon={Users} title="Integrantes" subtitle="Personas involucradas" />
          <div className="text-2xl font-black italic text-slate-800">{totalIntegrantes}</div>
        </CardContainer>
        <CardContainer>
          <SectionHeader icon={TrendingUp} title="Sector Principal" subtitle="Actividad predominante" />
          <div className="text-sm font-black italic text-slate-800 truncate">{sectorTop}</div>
        </CardContainer>
        <CardContainer>
          <SectionHeader icon={HandCoins} title="EPS por estatus" subtitle="Distribución" />
          <div className="flex justify-between text-[10px] font-black">
            <span className="text-emerald-600">Act: {activas}</span>
            <span className="text-rose-600">Inact: {totalEPS - activas - enProyecto}</span>
            <span className="text-amber-600">Proy: {enProyecto}</span>
          </div>
        </CardContainer>
      </div>
      
      {/* LISTADO */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <SectionHeader icon={Briefcase} title="EPS Registradas" subtitle="Gestión de unidades productivas" />
          <div className="relative w-56">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3 w-3 text-slate-400" />
            <input
              type="text"
              placeholder="Buscar por nombre, responsable o cédula"
              value={searchTerm}
              onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }}
              className="w-full pl-8 pr-3 py-1.5 rounded-lg border border-gray-100 bg-gray-50 text-[9px] font-medium focus:ring-1 focus:ring-brand-primary/20 outline-none"
            />
          </div>
        </div>
        {loading ? (
          <div className="flex justify-center py-8"><Loader2 className="animate-spin text-brand-primary" size={24} /></div>
        ) : errorMsg ? (
          <div className="bg-amber-50 p-4 rounded-lg text-center">
            <AlertCircle className="h-5 w-5 text-amber-600 mx-auto mb-1" />
            <p className="text-[10px] font-bold text-amber-700">{errorMsg}</p>
            <button onClick={handleRefresh} className="mt-2 text-[8px] font-bold text-brand-primary underline">Intentar de nuevo</button>
          </div>
        ) : filteredEPS.length === 0 ? (
          <div className="text-center py-6 text-slate-400 text-xs">No hay EPS o emprendimientos registrados.</div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 max-h-112.5 overflow-y-auto pr-1">
            {paginatedEPS.map((eps) => (
              <div 
                key={eps.id_eps} 
                onClick={() => setSelectedEPS(eps)}
                className="bg-white p-3 rounded-xl border border-gray-100 shadow-sm hover:shadow-md hover:border-brand-primary/50 transition-all cursor-pointer"
              >
                <div className="flex items-start justify-between">
                  <div className="space-y-0.5 flex-1">
                    <h4 className="font-black text-[11px] text-slate-800">{eps.nombre_eps}</h4>
                    <p className="text-[9px] text-slate-500">{eps.tipo_eps}</p>
                    <div className="flex items-center gap-1 text-[8px] text-slate-400">
                      <MapPin className="h-2 w-2" />
                      <span className="truncate">{getConsejoName(eps.id_consejo)}</span>
                    </div>
                    <div className="flex items-center gap-1 text-[8px] text-slate-400 mt-0.5">
                      <User className="h-2 w-2" />
                      <span>{eps.responsable_nombre}</span>
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-1">
                    <span className={cn(
                      "text-[6px] font-black px-1.5 py-0.5 rounded-full uppercase",
                      eps.estatus_actual === 'Activa' ? "bg-emerald-100 text-emerald-700" :
                      eps.estatus_actual === 'Inactiva' ? "bg-rose-100 text-rose-700" :
                      "bg-amber-100 text-amber-700"
                    )}>
                      {eps.estatus_actual}
                    </span>
                    <Eye className="h-3 w-3 text-slate-400" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
        {totalPages > 1 && (
          <div className="flex justify-center gap-2 mt-2">
            <button onClick={() => setCurrentPage(p => Math.max(1, p-1))} disabled={currentPage === 1} className="px-2 py-1 rounded-lg bg-gray-100 text-slate-600 text-[9px] disabled:opacity-50">Anterior</button>
            <span className="px-2 py-1 text-[9px] font-black text-slate-500">Página {currentPage} de {totalPages}</span>
            <button onClick={() => setCurrentPage(p => Math.min(totalPages, p+1))} disabled={currentPage === totalPages} className="px-2 py-1 rounded-lg bg-gray-100 text-slate-600 text-[9px] disabled:opacity-50">Siguiente</button>
          </div>
        )}
      </div>
      
      {/* ==================== MODAL DE DETALLE (con fuentes más grandes y oscuras) ==================== */}
      <AnimatePresence>
        {selectedEPS && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSelectedEPS(null)}
              className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative w-full max-w-2xl max-h-[85vh] bg-white rounded-[3rem] shadow-2xl overflow-hidden flex flex-col"
            >
              <div className="p-6 border-b border-gray-100 bg-gray-50/50 flex justify-between items-center sticky top-0 z-10">
                <div>
                  <h4 className="text-xl font-black text-slate-800 italic uppercase tracking-tighter">Detalles de la EPS</h4>
                  <p className="text-[11px] font-bold text-slate-500 uppercase tracking-widest mt-1">{selectedEPS.nombre_eps}</p>
                </div>
                <button onClick={() => setSelectedEPS(null)} className="p-2 rounded-xl hover:bg-white transition-colors">
                  <X size={20} className="text-slate-400" />
                </button>
              </div>
              
              <div className="flex-1 overflow-y-auto p-6 space-y-6">
                {/* Identificación EPS */}
                <div className="space-y-3">
                  <div className="flex items-center gap-2 mb-3">
                    <div className="h-8 w-8 rounded-xl bg-brand-primary/10 flex items-center justify-center text-brand-primary">
                      <Building2 size={18} />
                    </div>
                    <div>
                      <h3 className="text-[10px] font-black text-slate-800 italic uppercase tracking-tight">Identificación EPS</h3>
                      <p className="text-[7px] font-bold text-slate-500 uppercase tracking-wider">Datos de la organización</p>
                    </div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <DetailItem label="Nombre" value={selectedEPS.nombre_eps} />
                    <DetailItem label="RIF / Registro" value={selectedEPS.rif_registro} />
                    <DetailItem label="Tipo" value={selectedEPS.tipo_eps} />
                    <DetailItem label="Consejo Comunal" value={getConsejoName(selectedEPS.id_consejo)} />
                    <DetailItem label="Dirección" value={selectedEPS.direccion} />
                    <DetailItem label="Estatus" value={selectedEPS.estatus_actual} />
                  </div>
                </div>

                {/* Vocero Responsable */}
                <div className="space-y-3">
                  <div className="flex items-center gap-2 mb-3">
                    <div className="h-8 w-8 rounded-xl bg-brand-primary/10 flex items-center justify-center text-brand-primary">
                      <User size={18} />
                    </div>
                    <div>
                      <h3 className="text-[12px] font-black text-slate-800 italic uppercase tracking-tight">Vocero Responsable</h3>
                      <p className="text-[9px] font-bold text-slate-500 uppercase tracking-wider">Persona de contacto</p>
                    </div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <DetailItem label="Nombre completo" value={selectedEPS.responsable_nombre} />
                    <DetailItem label="Cédula" value={selectedEPS.responsable_cedula} />
                    <DetailItem label="Teléfono" value={selectedEPS.responsable_telefono} />
                    <DetailItem label="Correo" value={selectedEPS.responsable_correo} />
                    <DetailItem label="Rol en la organización" value={selectedEPS.rol_organizacion} />
                    <DetailItem label="Número de integrantes" value={selectedEPS.numero_integrantes} />
                    {(selectedEPS.integrantes_hombres !== null || selectedEPS.integrantes_mujeres !== null) && (
                      <DetailItem label="Desglose por sexo" value={`H: ${selectedEPS.integrantes_hombres || 0} / M: ${selectedEPS.integrantes_mujeres || 0}`} />
                    )}
                    {selectedEPS.integrantes_jovenes !== null && (
                      <DetailItem label="Jóvenes (≤30)" value={selectedEPS.integrantes_jovenes} />
                    )}
                  </div>
                </div>

                {/* Actividad Económica */}
                <div className="space-y-3">
                  <div className="flex items-center gap-2 mb-3">
                    <div className="h-8 w-8 rounded-xl bg-brand-primary/10 flex items-center justify-center text-brand-primary">
                      <Briefcase size={18} />
                    </div>
                    <div>
                      <h3 className="text-[12px] font-black text-slate-800 italic uppercase tracking-tight">Actividad Económica</h3>
                      <p className="text-[9px] font-bold text-slate-500 uppercase tracking-wider">Capacidad productiva</p>
                    </div>
                  </div>
                  <div className="grid grid-cols-1 gap-4">
                    <DetailItem label="Sector Económico" value={selectedEPS.sector_economico} />
                    <DetailItem label="Descripción de la actividad" value={selectedEPS.descripcion_actividad} />
                  </div>
                </div>
              </div>

              <div className="p-6 bg-gray-50/50 border-t border-gray-100 flex justify-end">
                <button 
                  onClick={() => setSelectedEPS(null)}
                  className="px-6 py-2 rounded-xl bg-brand-primary text-white text-[10px] font-black uppercase tracking-widest shadow-md hover:scale-[1.02] transition-all"
                >
                  Cerrar
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
      
      {/* ==================== MODAL MULTIPASO (con fuentes más grandes y oscuras) ==================== */}
      <AnimatePresence>
        {showModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-6">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setShowModal(false)} className="absolute inset-0 bg-slate-900/60 backdrop-blur-md" />
            <motion.div initial={{ scale: 0.9, opacity: 0, y: 20 }} animate={{ scale: 1, opacity: 1, y: 0 }} exit={{ scale: 0.9, opacity: 0, y: 20 }} className="relative w-full max-w-2xl max-h-[85vh] bg-white rounded-[3rem] shadow-2xl overflow-hidden flex flex-col">
              
              <div className="p-8 border-b border-gray-50 flex justify-between items-center bg-gray-50/50">
                <div>
                  <h4 className="text-xl font-black text-slate-800 italic uppercase tracking-tighter">Registro de EPS / Emprendimiento</h4>
                  <p className="text-[11px] font-bold text-slate-500 uppercase tracking-widest mt-1">Paso {currentStep} de 3</p>
                </div>
                <button onClick={() => setShowModal(false)} className="p-3 bg-white rounded-2xl shadow-sm hover:text-red-500 transition-colors"><X size={20} /></button>
              </div>

              <div className="px-8 py-4 border-b border-gray-50 bg-white">
                <div className="flex items-center justify-between gap-2 overflow-x-auto pb-2">
                  {steps.map((step, index) => (
                    <div key={index} className={`flex items-center gap-2 min-w-fit ${currentStep === index + 1 ? 'opacity-100' : 'opacity-40'}`}>
                      <div className={`w-8 h-8 rounded-xl flex items-center justify-center text-[11px] font-black ${currentStep >= index + 1 ? 'bg-brand-primary text-white' : 'bg-gray-100'}`}>
                        {index + 1}
                      </div>
                      <span className="text-[9px] font-black uppercase tracking-tighter">{step.title}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex-1 p-8 overflow-y-auto">
                <div className="flex items-center gap-2 mb-3">
                  <div className="h-8 w-8 rounded-xl bg-brand-primary/10 flex items-center justify-center text-brand-primary">
                    {React.createElement(steps[currentStep-1].icon, { size: 18 })}
                  </div>
                  <div>
                    <h3 className="text-[12px] font-black text-slate-800 italic uppercase tracking-tight">{steps[currentStep-1].title}</h3>
                    <p className="text-[9px] font-bold text-slate-500 uppercase tracking-wider">{steps[currentStep-1].subtitle}</p>
                  </div>
                </div>
                {stepContent}
              </div>

              <div className="p-8 bg-gray-50/50 border-t border-gray-50 flex items-center justify-between">
                <button 
                  disabled={currentStep === 1}
                  onClick={() => setCurrentStep(prev => prev - 1)}
                  className="flex items-center gap-2 px-6 py-3 text-slate-500 font-black uppercase text-[10px] disabled:opacity-0"
                >
                  <ChevronLeft size={16} /> Anterior
                </button>
                <div className="flex gap-3">
                  {currentStep < 3 ? (
                    <button 
                      onClick={handleNext}
                      className="flex items-center gap-2 px-8 py-4 bg-slate-800 text-white rounded-2xl font-black italic uppercase text-[11px]"
                    >
                      Siguiente <ChevronRight size={16} />
                    </button>
                  ) : (
                    <button 
                      onClick={handleSubmit}
                      disabled={saving}
                      className="flex items-center gap-3 px-10 py-4 bg-brand-primary text-white rounded-2xl font-black italic uppercase text-[12px] shadow-lg shadow-brand-primary/20 disabled:opacity-50"
                    >
                      {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle2 size={18} />}
                      Finalizar Registro
                    </button>
                  )}
                </div>
              </div>
            </motion.div>
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

export default EPS;