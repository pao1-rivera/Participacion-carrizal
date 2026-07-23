"use client";

import React, { useState, useEffect, useMemo, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  User, MapPin, Smartphone, Laptop, Award, FileCheck,
  ChevronLeft, ChevronRight, X, CheckCircle2, AlertCircle,
  Users, Loader2, Search, Eye, HelpCircle, Briefcase, Wifi, TrendingUp
} from "lucide-react";
import { cn } from "@/app/lib/utils";
import { supabase } from "@/app/lib/supabaseClient";
import { useAuth } from "@/context/AuthContext";
import { AlertModal } from "@/app/components/AlertModal";

// ==================== CONSTANTES ====================
const OPERADORAS = ["0424", "0414", "0412", "0422", "0416", "0426"];

const DISPOSITIVOS = [
  "Teléfono Inteligente (Smartphone)",
  "Teléfono Básico (Flecha)",
  "Computadora de Escritorio / Laptop",
  "Tablet",
  "No posee ningún dispositivo"
];

const NIVEL_CONOCIMIENTO = [
  "NULO (No sabe encender ni usar un dispositivo)",
  "BÁSICO (Solo llamadas, mensajes de texto o WhatsApp básico)",
  "INTERMEDIO (Navega en internet, usa redes sociales, maneja correo)",
  "AVANZADO (Maneja herramientas de oficina, aplicaciones bancarias, trámites en línea)"
];

const BARRERAS_ACCESO = [
  "Falta de equipo/dispositivo propio",
  "Falta de conectividad / Internet deficiente",
  "Falta de conocimientos / Miedo a la tecnología",
  "Limitaciones físicas o visuales",
  "Costos elevados de los servicios"
];

const TRAMITES_DIGITALES = [
  "Sistema Patria (Bonos, gasolina, servicios)",
  "Banca en Línea / Pago Móvil",
  "Trámites del SAIME / INTT",
  "Registro Civil / CNE",
  "Ninguno (Depende de un tercero)"
];

const noSpinnerClass = "[appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none [-moz-appearance:textfield]";

interface DigitalizacionProps {
  onNavigate: (section: string) => void;
}

interface Consejo {
  id_consejo: number;
  nombre_consejo: string;
}

interface DigitalData {
  id_registro: number;
  id_consejo: number | null;
  nombre: string;
  apellido: string;
  tipo_cedula: string;
  cedula: string;
  edad: number;
  genero: string;
  cod_tel: string;
  telefono: string;
  comunidad: string;
  calle: string;
  dispositivos_uso: string[];
  nivel_tecnologico: string;
  posee_internet: string;
  barreras: string[];
  maneja_pago_movil: string;
  realiza_tramites: string[];
  interes_capacitacion: string;
  cargo_sala_autogobierno?: string;
}

// ==================== COMPONENTES UI ====================
const CardContainer = ({ children }: { children: React.ReactNode }) => (
  <motion.div 
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm hover:shadow-md transition-all"
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

interface InputFieldProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  type?: string;
  required?: boolean;
  maxLength?: number;
}

const InputField: React.FC<InputFieldProps> = React.memo(({ label, value, onChange, placeholder, type = "text", required = true, maxLength }) => {
  const isNumber = type === "number";
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

interface SelectFieldProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: string[] | { value: string; label: string }[];
  required?: boolean;
}

const SelectField: React.FC<SelectFieldProps> = React.memo(({ label, value, onChange, options, required = true }) => (
  <div className="space-y-1">
    <label className="text-[7px] font-bold text-slate-400 uppercase ml-1 block">{label} {required && '*'}</label>
    <select 
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="w-full p-1.5 px-3 rounded-xl bg-gray-50 border-none ring-1 ring-gray-100 text-[10px] font-bold outline-none focus:ring-2 focus:ring-brand-primary transition-all appearance-none"
    >
      <option value="">Seleccione...</option>
      {options.map((opt) => (
        <option key={typeof opt === 'object' ? opt.value : opt} value={typeof opt === 'object' ? opt.value : opt}>
          {typeof opt === 'object' ? opt.label : opt}
        </option>
      ))}
    </select>
  </div>
));

interface MultiSelectButtonsProps {
  label: string;
  options: string[];
  selected: string[];
  onChange: (selected: string[]) => void;
}

const MultiSelectButtons: React.FC<MultiSelectButtonsProps> = React.memo(({ label, options, selected, onChange }) => (
  <div className="space-y-1">
    <label className="text-[7px] font-bold text-slate-400 uppercase ml-1 block">{label}</label>
    <div className="flex flex-wrap gap-1">
      {options.map((opt) => (
        <button
          key={opt}
          type="button"
          onClick={() => {
            const isSelected = selected.includes(opt);
            if (isSelected) onChange(selected.filter((s) => s !== opt));
            else onChange([...selected, opt]);
          }}
          className={cn(
            "px-2 py-0.5 rounded-full text-[8px] font-black uppercase transition-all",
            selected.includes(opt) ? "bg-brand-primary text-white shadow-sm" : "bg-gray-100 text-slate-500 hover:bg-gray-200"
          )}
        >
          {opt.length > 30 ? opt.substring(0, 27) + '...' : opt}
        </button>
      ))}
    </div>
  </div>
));

const DetailItem = ({ label, value }: { label: string; value: any }) => (
  <div className="border-b border-gray-100 pb-1.5">
    <p className="text-[8px] font-bold text-slate-400 uppercase tracking-wider">{label}</p>
    <p className="text-[10px] font-medium text-slate-700 mt-0.5">
      {Array.isArray(value) ? value.join(", ") : value || '—'}
    </p>
  </div>
);

// ==================== COMPONENTE PRINCIPAL ====================
export const Digitalizacion = ({ onNavigate }: DigitalizacionProps) => {
  const { user } = useAuth();
  
  const [noSala, setNoSala] = useState(false);
  const [comunaId, setComunaId] = useState<number | null>(null);
  const [consejos, setConsejos] = useState<Consejo[]>([]);
  const [loadingData, setLoadingData] = useState(true);
  const [registros, setRegistros] = useState<DigitalData[]>([]);
  const [loadingRegistros, setLoadingRegistros] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const ITEMS_PER_PAGE = 5;
  
  const [showModal, setShowModal] = useState(false);
  const [currentStep, setCurrentStep] = useState(1);
  const [saving, setSaving] = useState(false);
  const [selectedPerson, setSelectedPerson] = useState<DigitalData | null>(null);
  
  const [formData, setFormData] = useState({
    nombre: '', apellido: '', tipoCedula: 'V', cedula: '', edad: '', genero: '', codTel: '', telefono: '', cargoSala: '',
    consejoId: '', comunidad: '', calle: '',
    dispositivosUso: [] as string[], nivelTecnologico: '', poseeInternet: '',
    barreras: [] as string[], manejaPagoMovil: '', realizaTramites: [] as string[],
    interesCapacitacion: ''
  });
  
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

  const closeModalAlert = () => setModalState(prev => ({ ...prev, isOpen: false }));

  // ========== OCULTAR SIDEBAR CUANDO HAY MODAL ==========
  useEffect(() => {
    if (showModal || selectedPerson || modalState.isOpen) {
      document.body.classList.add('modal-open');
    } else {
      document.body.classList.remove('modal-open');
    }
    return () => document.body.classList.remove('modal-open');
  }, [showModal, selectedPerson, modalState.isOpen]);
  
  const steps = [
    { title: "Identificación", subtitle: "Datos Ciudadano", icon: User },
    { title: "Ubicación", subtitle: "Lugar de Residencia", icon: MapPin },
    { title: "Entorno Digital", subtitle: "Acceso y Dispositivos", icon: Smartphone },
    { title: "Habilidades", subtitle: "Uso y Limitaciones", icon: Laptop },
    { title: "Formación", subtitle: "Interés de Aprendizaje", icon: Award },
  ];
  
  const handleInputChange = useCallback((field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  }, []);
  
  const handleCedulaChange = useCallback((value: string) => {
    handleInputChange('cedula', value.replace(/\D/g, '').slice(0, 8));
  }, [handleInputChange]);
  
  const handleTelefonoChange = useCallback((value: string) => {
    handleInputChange('telefono', value.replace(/\D/g, '').slice(0, 7));
  }, [handleInputChange]);

  const validateStep = useCallback((step: number): boolean => {
    switch (step) {
      case 1:
        if (!formData.nombre.trim() || !formData.apellido.trim()) return false;
        if (!formData.cedula || !/^\d{7,8}$/.test(formData.cedula)) return false;
        if (!formData.edad || parseInt(formData.edad) <= 0) return false;
        if (!formData.genero || !formData.codTel || !formData.telefono || !/^\d{7}$/.test(formData.telefono)) return false;
        return true;
      case 2:
        if (!formData.consejoId || !formData.comunidad.trim() || !formData.calle.trim()) return false;
        return true;
      case 3:
        if (formData.dispositivosUso.length === 0 || !formData.nivelTecnologico || !formData.poseeInternet) return false;
        return true;
      case 4:
        if (formData.barreras.length === 0 || !formData.manejaPagoMovil || formData.realizaTramites.length === 0) return false;
        return true;
      case 5:
        if (!formData.interesCapacitacion) return false;
        return true;
      default: return true;
    }
  }, [formData]);
  
  const handleNext = useCallback(() => {
    if (validateStep(currentStep)) {
      setCurrentStep(prev => prev + 1);
    } else {
      showAlert("Campos incompletos", "Completa todos los campos obligatorios antes de continuar.", "warning");
    }
  }, [currentStep, validateStep]);

  const stepContent = useMemo(() => {
    switch (currentStep) {
      case 1:
        return (
          <div key="step1" className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <InputField label="Nombre" value={formData.nombre} onChange={(val) => handleInputChange('nombre', val)} />
            <InputField label="Apellido" value={formData.apellido} onChange={(val) => handleInputChange('apellido', val)} />
            <div className="space-y-1">
              <label className="text-[7px] font-bold text-slate-400 uppercase ml-1 block">Cédula *</label>
              <div className="flex gap-1.5">
                <select 
                  value={formData.tipoCedula} 
                  onChange={(e) => handleInputChange('tipoCedula', e.target.value)}
                  className="w-16 p-1.5 rounded-xl bg-gray-50 ring-1 ring-gray-100 text-[10px] font-bold outline-none focus:ring-2 focus:ring-brand-primary"
                >
                  <option value="V">V-</option>
                  <option value="E">E-</option>
                </select>
                <input 
                  type="number" 
                  placeholder="Cédula"
                  value={formData.cedula} 
                  onChange={(e) => handleCedulaChange(e.target.value)}
                  className={cn("flex-1 p-1.5 px-3 rounded-xl bg-gray-50 ring-1 ring-gray-100 text-[10px] font-bold outline-none focus:ring-2 focus:ring-brand-primary", noSpinnerClass)}
                />
              </div>
            </div>
            <InputField label="Edad" type="number" value={formData.edad} onChange={(val) => handleInputChange('edad', val)} />
            <SelectField label="Género" value={formData.genero} onChange={(val) => handleInputChange('genero', val)} options={['Femenino', 'Masculino', 'Otro']} />
            <div className="space-y-1">
              <label className="text-[7px] font-bold text-slate-400 uppercase ml-1 block">Teléfono *</label>
              <div className="flex gap-1.5">
                <select 
                  value={formData.codTel} 
                  onChange={(e) => handleInputChange('codTel', e.target.value)}
                  className="w-20 p-1.5 rounded-xl bg-gray-50 ring-1 ring-gray-100 text-[10px] font-bold outline-none focus:ring-2 focus:ring-brand-primary"
                >
                  <option value="">Cód.</option>
                  {OPERADORAS.map(op => <option key={op} value={op}>{op}</option>)}
                </select>
                <input 
                  type="number" 
                  placeholder="Número"
                  value={formData.telefono} 
                  onChange={(e) => handleTelefonoChange(e.target.value)}
                  className={cn("flex-1 p-1.5 px-3 rounded-xl bg-gray-50 ring-1 ring-gray-100 text-[10px] font-bold outline-none focus:ring-2 focus:ring-brand-primary", noSpinnerClass)}
                />
              </div>
            </div>
            <div className="md:col-span-2">
              <InputField 
                label="Cargo / Puesto en la Sala de Autogobierno" 
                value={formData.cargoSala} 
                onChange={(val) => handleInputChange('cargoSala', val)} 
                placeholder="Ej: Vocero(a) de Comunicaciones"
                required={false}
              />
            </div>
          </div>
        );
      case 2:
        return (
          <div key="step2" className="grid grid-cols-1 gap-3">
            <SelectField 
              label="Consejo Comunal" 
              value={formData.consejoId} 
              onChange={(val) => handleInputChange('consejoId', val)} 
              options={consejos.map(c => ({ value: c.id_consejo.toString(), label: c.nombre_consejo }))} 
            />
            <InputField label="Comunidad" value={formData.comunidad} onChange={(val) => handleInputChange('comunidad', val)} />
            <InputField label="Avenida o Calle" value={formData.calle} onChange={(val) => handleInputChange('calle', val)} />
          </div>
        );
      case 3:
        return (
          <div key="step3" className="grid grid-cols-1 gap-3">
            <MultiSelectButtons 
              label="¿Qué dispositivos tecnológicos utiliza con frecuencia? *" 
              options={DISPOSITIVOS} 
              selected={formData.dispositivosUso} 
              onChange={(val) => handleInputChange('dispositivosUso', val)} 
            />
            <SelectField label="¿Cómo autocalifica su nivel de conocimiento digital? *" value={formData.nivelTecnologico} onChange={(val) => handleInputChange('nivelTecnologico', val)} options={NIVEL_CONOCIMIENTO} />
            <SelectField label="¿Posee acceso a conectividad estable a Internet en su hogar? *" value={formData.poseeInternet} onChange={(val) => handleInputChange('poseeInternet', val)} options={['SI', 'NO', 'A VECES / INTERMITENTE']} />
          </div>
        );
      case 4:
        return (
          <div key="step4" className="grid grid-cols-1 gap-3">
            <MultiSelectButtons 
              label="¿Cuáles considera que son sus principales barreras tecnológicas? *" 
              options={BARRERAS_ACCESO} 
              selected={formData.barreras} 
              onChange={(val) => handleInputChange('barreras', val)} 
            />
            <SelectField label="¿Sabe realizar transacciones mediante Pago Móvil de manera independiente? *" value={formData.manejaPagoMovil} onChange={(val) => handleInputChange('manejaPagoMovil', val)} options={['SI', 'NO', 'SÓLO CON AYUDA']} />
            <MultiSelectButtons 
              label="¿Qué trámites públicos en línea sabe ejecutar de forma independiente? *" 
              options={TRAMITES_DIGITALES} 
              selected={formData.realizaTramites} 
              onChange={(val) => handleInputChange('realizaTramites', val)} 
            />
          </div>
        );
      case 5:
        return (
          <div key="step5" className="grid grid-cols-1 gap-3">
            <SelectField label="¿Estaría dispuesto/a a participar en talleres gratuitos de Alfabetización y Capacitación Digital en su comunidad? *" value={formData.interesCapacitacion} onChange={(val) => handleInputChange('interesCapacitacion', val)} options={['SI', 'NO', 'TAL VEZ']} />
          </div>
        );
      default: return null;
    }
  }, [currentStep, formData, handleInputChange, handleCedulaChange, handleTelefonoChange, consejos]);

  useEffect(() => {
    if (!user?.id) return;
    const fetchSalaData = async () => {
      setLoadingData(true);
      const { data: sala } = await supabase
        .from('datos_sala_autogobierno')
        .select('id_comuna')
        .eq('id_usuario', user.id)
        .maybeSingle();
      
      if (sala?.id_comuna) {
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
        }
      } else {
        setNoSala(true);
      }
      setLoadingData(false);
    };
    fetchSalaData();
  }, [user]);

  const fetchRegistros = useCallback(async () => {
    if (!comunaId) return;
    setLoadingRegistros(true);
    const { data, error } = await supabase
      .from('analfabetismo_digital')
      .select('*')
      .eq('id_comuna', comunaId)
      .order('created_at', { ascending: false });
    if (!error && data) setRegistros(data);
    setLoadingRegistros(false);
  }, [comunaId]);

  useEffect(() => {
    fetchRegistros();
  }, [comunaId, fetchRegistros]);

  // ==================== HANDLE SUBMIT CORREGIDO ====================
  const handleSubmit = async () => {
    if (!validateStep(5)) {
      showAlert("Campos incompletos", "Completa todos los campos del último paso.", "warning");
      return;
    }
    if (!comunaId) {
      showAlert("Error de identificación", "No se pudo identificar la comuna de tu sala.", "danger");
      return;
    }

    setSaving(true);

    // Construir el payload asegurando tipos correctos
    const payload = {
      id_comuna: comunaId,
      id_consejo: formData.consejoId ? parseInt(formData.consejoId) : null,
      nombre: formData.nombre.trim(),
      apellido: formData.apellido.trim(),
      tipo_cedula: formData.tipoCedula,
      cedula: formData.cedula.trim(),
      edad: parseInt(formData.edad) || 0,
      genero: formData.genero,
      cod_tel: formData.codTel,
      telefono: formData.telefono.trim(),
      comunidad: formData.comunidad.trim(),
      calle: formData.calle.trim(),
      dispositivos_uso: formData.dispositivosUso,
      nivel_tecnologico: formData.nivelTecnologico,
      posee_internet: formData.poseeInternet,
      barreras: formData.barreras,
      maneja_pago_movil: formData.manejaPagoMovil,
      realiza_tramites: formData.realizaTramites,
      interes_capacitacion: formData.interesCapacitacion,
      cargo_sala_autogobierno: formData.cargoSala.trim() || null,
    };

    // Insertar con .select() para obtener el registro insertado y detectar errores
    const { data, error } = await supabase
      .from('analfabetismo_digital')
      .insert([payload])
      .select();

    if (error) {
      console.error("Error en inserción:", error);
      showAlert("Error al guardar", `Detalle: ${error.message}`, "danger");
    } else {
      showAlert("Diagnóstico digital guardado", "El registro se ha completado exitosamente.", "success");
      setShowModal(false);
      // Resetear formulario
      setFormData({
        nombre: '', apellido: '', tipoCedula: 'V', cedula: '', edad: '', genero: '', codTel: '', telefono: '', cargoSala: '',
        consejoId: '', comunidad: '', calle: '',
        dispositivosUso: [], nivelTecnologico: '', poseeInternet: '',
        barreras: [], manejaPagoMovil: '', realizaTramites: [], interesCapacitacion: ''
      });
      setCurrentStep(1);
      // Refrescar lista
      await fetchRegistros();
    }
    setSaving(false);
  };

  const getConsejoName = useCallback((consejoId: number | null) => {
    if (!consejoId) return 'No asignado';
    const consejo = consejos.find(c => c.id_consejo === consejoId);
    return consejo?.nombre_consejo || 'Desconocido';
  }, [consejos]);

  // ==================== MÉTRICAS ====================
  const totalRegistros = registros.length;
  const sinInternet = registros.filter(r => r.posee_internet === 'NO').length;
  const nivelIntermedioAvanzado = registros.filter(r => 
    r.nivel_tecnologico.startsWith("INTERMEDIO") || r.nivel_tecnologico.startsWith("AVANZADO")
  ).length;
  const interesadosTalleres = registros.filter(r => r.interes_capacitacion === "SI").length;

  const filteredRegistros = useMemo(() => {
    const term = searchTerm.toLowerCase();
    return registros.filter(r => 
      r.nombre.toLowerCase().includes(term) || 
      r.apellido.toLowerCase().includes(term) || 
      r.cedula.includes(term)
    );
  }, [registros, searchTerm]);

  const totalPages = Math.ceil(filteredRegistros.length / ITEMS_PER_PAGE);
  const paginatedRegistros = filteredRegistros.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE);

  if (loadingData) return <div className="flex justify-center p-8"><Loader2 className="animate-spin text-brand-primary h-7 w-7" /></div>;

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
    <div className="space-y-4 max-w-7xl mx-auto p-3">
      {/* SECCIÓN KPI MÉTRICAS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        <div className="bg-white p-3 rounded-xl border border-gray-100 flex items-center justify-between shadow-sm">
          <div>
            <p className="text-[8px] font-bold text-slate-400 uppercase tracking-wider">Total Personal</p>
            <h4 className="text-xl font-black text-slate-800 mt-0.5">{totalRegistros}</h4>
          </div>
          <div className="h-9 w-9 rounded-xl bg-brand-primary/10 flex items-center justify-center text-brand-primary"><Users size={18} /></div>
        </div>
        
        <div className="bg-white p-3 rounded-xl border border-gray-100 flex items-center justify-between shadow-sm">
          <div>
            <p className="text-[8px] font-bold text-slate-400 uppercase tracking-wider">Sin Acceso a Internet</p>
            <h4 className="text-xl font-black text-slate-800 mt-0.5">{sinInternet}</h4>
          </div>
          <div className="h-9 w-9 rounded-xl bg-red-50 flex items-center justify-center text-brand-primary"><Wifi size={18} /></div>
        </div>

        <div className="bg-white p-3 rounded-xl border border-gray-100 flex items-center justify-between shadow-sm">
          <div>
            <p className="text-[8px] font-bold text-slate-400 uppercase tracking-wider">Nivel Intermedio o Avanzado</p>
            <h4 className="text-xl font-black text-slate-800 mt-0.5">{nivelIntermedioAvanzado}</h4>
          </div>
          <div className="h-9 w-9 rounded-xl bg-blue-50 flex items-center justify-center text-brand-primary"><TrendingUp size={18} /></div>
        </div>

        <div className="bg-white p-3 rounded-xl border border-gray-100 flex items-center justify-between shadow-sm">
          <div>
            <p className="text-[8px] font-bold text-slate-400 uppercase tracking-wider">Aptos para Capacitación</p>
            <h4 className="text-xl font-black text-slate-800 mt-0.5">{interesadosTalleres}</h4>
          </div>
          <div className="h-9 w-9 rounded-xl bg-emerald-50 flex items-center justify-center text-brand-primary"><Award size={18} /></div>
        </div>
      </div>

      <CardContainer>
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 mb-4">
          <SectionHeader icon={Laptop} title="Analfabetismo y Apropiación Digital" subtitle="Evaluación de destrezas tecnológicas" />
          <button 
            onClick={() => setShowModal(true)}
            className="p-1.5 px-4 rounded-xl bg-brand-primary text-white text-[9px] font-black uppercase tracking-wider shadow-md hover:scale-[1.02] transition-all"
          >
            Nuevo Diagnóstico
          </button>
        </div>

        {/* TABLA PRINCIPAL */}
        <div className="space-y-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3 w-3 text-slate-400" />
            <input 
              type="text" 
              placeholder="Buscar por nombre, apellido o cédula..." 
              value={searchTerm}
              onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }}
              className="w-full pl-8 p-2 rounded-xl bg-gray-50 border-none ring-1 ring-gray-100 text-[9px] font-bold outline-none focus:ring-2 focus:ring-brand-primary"
            />
          </div>

          {loadingRegistros ? (
            <div className="text-center py-8"><Loader2 className="animate-spin text-brand-primary mx-auto h-5 w-5" /></div>
          ) : filteredRegistros.length === 0 ? (
            <div className="text-center py-8 text-[10px] italic text-slate-400">No se encontraron diagnósticos registrados.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-gray-100">
                    <th className="p-2 text-[8px] font-black uppercase tracking-wider text-slate-400">Ciudadano</th>
                    <th className="p-2 text-[8px] font-black uppercase tracking-wider text-slate-400">Cédula</th>
                    <th className="p-2 text-[8px] font-black uppercase tracking-wider text-slate-400">Consejo Comunal</th>
                    <th className="p-2 text-[8px] font-black uppercase tracking-wider text-slate-400">Nivel Digital</th>
                    <th className="p-2 text-[8px] font-black uppercase tracking-wider text-slate-400 text-center">Acción</th>
                  </tr>
                </thead>
                <tbody>
                  {paginatedRegistros.map((reg) => (
                    <tr key={reg.id_registro} className="border-b border-gray-50 hover:bg-gray-50/50">
                      <td className="p-2 text-[10px] font-bold text-slate-700">{reg.nombre} {reg.apellido}</td>
                      <td className="p-2 text-[10px] font-bold text-slate-500">{reg.tipo_cedula}-{reg.cedula}</td>
                      <td className="p-2 text-[10px] font-bold text-slate-500 truncate max-w-40">{getConsejoName(reg.id_consejo)}</td>
                      <td className="p-2">
                        <span className={cn(
                          "px-2 py-0.5 rounded-full text-[8px] font-black uppercase",
                          reg.nivel_tecnologico.startsWith("NULO") && "bg-red-50 text-red-500",
                          reg.nivel_tecnologico.startsWith("BÁSICO") && "bg-amber-50 text-amber-600",
                          reg.nivel_tecnologico.startsWith("INTERMEDIO") && "bg-blue-50 text-blue-500",
                          reg.nivel_tecnologico.startsWith("AVANZADO") && "bg-emerald-50 text-emerald-500"
                        )}>
                          {reg.nivel_tecnologico.split(" ")[0]}
                        </span>
                      </td>
                      <td className="p-2 text-center">
                        <button 
                          onClick={() => setSelectedPerson(reg)}
                          className="p-1 rounded-lg bg-gray-50 hover:bg-brand-primary/10 text-slate-400 hover:text-brand-primary"
                        >
                          <Eye size={12} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {totalPages > 1 && (
                <div className="flex justify-between items-center pt-3">
                  <button disabled={currentPage === 1} onClick={() => setCurrentPage(p => p - 1)} className="p-1 rounded-lg bg-gray-100 disabled:opacity-40"><ChevronLeft size={14} /></button>
                  <span className="text-[9px] font-bold text-slate-400 uppercase">Página {currentPage} de {totalPages}</span>
                  <button disabled={currentPage === totalPages} onClick={() => setCurrentPage(p => p + 1)} className="p-1 rounded-lg bg-gray-100 disabled:opacity-40"><ChevronRight size={14} /></button>
                </div>
              )}
            </div>
          )}
        </div>
      </CardContainer>

      {/* MODAL DE REGISTRO */}
      <AnimatePresence>
        {showModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-5">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setShowModal(false)} className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" />
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="relative w-full max-w-2xl bg-white rounded-4xl shadow-2xl overflow-hidden max-h-[85vh] flex flex-col">
              <div className="p-4 border-b border-gray-50 flex items-center justify-between bg-brand-primary text-white">
                <div>
                  <h4 className="text-sm font-black italic uppercase tracking-wider">Nuevo Diagnóstico Tecnológico</h4>
                  <p className="text-[8px] text-white/70 font-bold uppercase tracking-widest mt-0.5">{steps[currentStep - 1].title} — {steps[currentStep - 1].subtitle}</p>
                </div>
                <button onClick={() => setShowModal(false)} className="p-1.5 rounded-xl bg-white/10 hover:bg-white/20"><X size={16} /></button>
              </div>
              <div className="w-full h-1 bg-gray-100 flex">
                {steps.map((_, idx) => (
                  <div key={idx} className={cn("h-full flex-1 transition-all", idx + 1 <= currentStep ? "bg-brand-primary" : "bg-gray-100")} />
                ))}
              </div>
              <div className="p-5 overflow-y-auto flex-1 bg-white">
                <AnimatePresence mode="wait">
                  {stepContent}
                </AnimatePresence>
              </div>
              <div className="p-3 border-t border-gray-50 bg-gray-50/50 flex justify-between items-center">
                <button 
                  disabled={currentStep === 1 || saving} 
                  onClick={() => setCurrentStep(p => p - 1)}
                  className="p-1.5 px-3 rounded-lg text-[9px] font-bold text-slate-500 hover:bg-gray-100 disabled:opacity-30 flex items-center gap-1"
                >
                  <ChevronLeft size={12} /> Atrás
                </button>
                {currentStep < 5 ? (
                  <button onClick={handleNext} className="p-1.5 px-4 rounded-lg bg-brand-primary text-white text-[9px] font-black uppercase tracking-wider flex items-center gap-1 shadow-sm">
                    Siguiente <ChevronRight size={12} />
                  </button>
                ) : (
                  <button disabled={saving} onClick={handleSubmit} className="p-1.5 px-5 rounded-lg bg-emerald-500 text-white text-[9px] font-black uppercase tracking-wider flex items-center gap-1 shadow-sm disabled:opacity-50">
                    {saving ? <Loader2 className="h-3 w-3 animate-spin" /> : <CheckCircle2 size={12} />}
                    Finalizar Censo
                  </button>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* MODAL DE VISTA DETALLADA */}
      <AnimatePresence>
        {selectedPerson && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setSelectedPerson(null)} className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" />
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="relative w-full max-w-2xl bg-white rounded-3xl shadow-2xl overflow-hidden max-h-[85vh] flex flex-col">
              <div className="p-4 border-b border-gray-50 flex items-center justify-between bg-slate-800 text-white">
                <div className="flex items-center gap-2">
                  <HelpCircle size={18} />
                  <h4 className="text-xs font-black uppercase tracking-wider">Ficha de Caracterización Digital</h4>
                </div>
                <button onClick={() => setSelectedPerson(null)} className="p-1.5 rounded-xl bg-white/10 hover:bg-white/20"><X size={14} /></button>
              </div>
              <div className="p-6 overflow-y-auto space-y-4 bg-white grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-3">
                <div className="md:col-span-2 border-b border-slate-100 pb-1 mt-2">
                  <span className="text-[10px] font-black text-brand-primary uppercase tracking-widest">1. Datos Personales & Geográficos</span>
                </div>
                <DetailItem label="Nombre Completo" value={`${selectedPerson.nombre} ${selectedPerson.apellido}`} />
                <DetailItem label="Cédula de Identidad" value={`${selectedPerson.tipo_cedula}-${selectedPerson.cedula}`} />
                <DetailItem label="Edad / Género" value={`${selectedPerson.edad} años — ${selectedPerson.genero}`} />
                <DetailItem label="Teléfono" value={`(${selectedPerson.cod_tel}) ${selectedPerson.telefono}`} />
                <div className="md:col-span-2">
                  <DetailItem label="Cargo en Sala de Autogobierno" value={selectedPerson.cargo_sala_autogobierno || 'No especificado'} />
                </div>
                <DetailItem label="Consejo Comunal" value={getConsejoName(selectedPerson.id_consejo)} />
                <DetailItem label="Dirección / Comunidad" value={`${selectedPerson.comunidad}, ${selectedPerson.calle}`} />

                <div className="md:col-span-2 border-b border-slate-100 pb-1 mt-4">
                  <span className="text-[10px] font-black text-brand-primary uppercase tracking-widest">2. Diagnóstico Técnico Interno</span>
                </div>
                <DetailItem label="Dispositivos que domina o usa" value={selectedPerson.dispositivos_uso} />
                <DetailItem label="Nivel Tecnológico Autocalificado" value={selectedPerson.nivel_tecnologico} />
                <DetailItem label="Conectividad a Internet en Casa" value={selectedPerson.posee_internet} />
                <DetailItem label="Barreras Declaradas" value={selectedPerson.barreras} />
                <DetailItem label="¿Maneja Pago Móvil Autónomamente?" value={selectedPerson.maneja_pago_movil} />
                <DetailItem label="Trámites que domina" value={selectedPerson.realiza_tramites} />
                
                <div className="md:col-span-2 border-b border-slate-100 pb-1 mt-4">
                  <span className="text-[10px] font-black text-brand-primary uppercase tracking-widest">3. Plan de Acción Comunitario</span>
                </div>
                <div className="md:col-span-2 bg-gray-50 p-3 rounded-xl border border-gray-100">
                  <p className="text-[8px] font-bold text-slate-400 uppercase tracking-wider">¿Interesado en capacitarse de forma gratuita?</p>
                  <p className={cn(
                    "text-[10px] font-black uppercase mt-1",
                    selectedPerson.interes_capacitacion === 'SI' ? "text-emerald-600" : "text-slate-600"
                  )}>{selectedPerson.interes_capacitacion}</p>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* AlertModal global */}
      <AlertModal
        isOpen={modalState.isOpen}
        onClose={closeModalAlert}
        title={modalState.title}
        message={modalState.message}
        type={modalState.type}
        showInput={modalState.showInput}
        inputPlaceholder={modalState.inputPlaceholder}
        cancelText={modalState.cancelText}
        confirmText={modalState.confirmText}
        onConfirm={modalState.onConfirm || (() => closeModalAlert())}
      />
    </div>
  );
};