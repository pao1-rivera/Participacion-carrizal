"use client";

import React, { useState, useEffect, useMemo, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  User, MapPin, Home, HeartPulse, Briefcase, FileCheck,
  ChevronLeft, ChevronRight, X, CheckCircle2, 
  Users, Loader2, Search, Stethoscope, Eye, AlertCircle,
  UserPlus
} from "lucide-react";
import { cn } from "@/app/lib/utils";
import { supabase } from "@/app/lib/supabaseClient";
import { useAuth } from "@/context/AuthContext";
import { AlertModal } from "@/app/components/AlertModal";

// ==================== CONSTANTES ====================
const OPERADORAS = ["0424", "0414", "0412", "0422", "0416", "0426"];

const CENTROS_SALUD = [
  "Clínica Popular Tipo I 'Santa Carmen Rendiles'",
  "Maternidad de Carrizal / Materno Infantil de Carrizal",
  "Ambulatorio de Barrio Adentro / Consultorios Populares 'La Ladera I y II'",
  "CDI (Centro de Diagnóstico Integral) 'Villa Josefina'",
  "Centro Médico Docente Los Altos",
  "Clínica Los Altos (Planes de Medicina Prepagada/SISPSA)",
  "Ambulatorio de Brisas de Oriente",
  "Ambulatorio 'María Isabel de Rodríguez'",
  "Ambulatorio de José Manuel Álvarez",
  "Consultorio Popular 'Llano Alto'",
  "Centro Odontológico y de Especialidades en el C.C. La Cascada",
  "Unidad Integradora de Salud (UIS) 'Carrizal'",
  "Sede de Protección Civil Carrizal y Paramédicos",
  "Módulos de Atención Inmediata (Policarrizal/Salud)"
];

const ENFERMEDADES = [
  "NO APLICA","ASMA",
  "ARTRITIS O ARTRISTIS REUMATOIDE","ARTROSIS",
  "ALZHEIMER","ANEMIA MEGALOBLÁSTICA","AORTOESCLEROSIS","CÁNCER","CATARATAS","CERVICALGIA",
  "CEGUERA","COLELITIASIS","DIABETES","DISCAPACIDAD MUSCULOESQUELETICA","DESCLACIFICACION",
  "DIVERTICULOSIS","DISCAPACIDAD OSTEOTENDINOSA","ENFERMEDADES CARDIACAS","ENFERMEDAD PULMONAR OBSTRUCTIVA CRONICA (EPOC)",
  "ENFERMEDADES RENALES","ESCLEROSIS MULTIPLE","ESPOLON CALCANEO","EPILEPSIA",
  "ESTEATOSIS HEPÁTICA (HIGADO GRASO)","ESCOLIOSIS",
  "GASTRITIS","GLIOMA DEL NERVIO ÓPTICO",
  "GLUCOMA","HIPERTENSION","HIPOTIROIDISMO","HIPERTIROIDISMO",
  "HIPERPLASIA PROSTATICA BENIGNA","HERNIA DISCAL","HERNIA INGUINAL","HERNIA UMBILICAL","HERNIA DIAFRAGMÁTICA ADQUIRIDA","LUPUS","NEURAPATÍA MOTORA MULTIFOCAL",
  "OSTEOPOROSIS","PARKINSON",
  "PROSTATITIS CRONICA","PSORIASIS",
  "RETINOPATÍA OCULAR","SÍNDROME POSTROMBÓTICO",
  "SÍNDROME DEL TÚNEL CARPIANO","TRASTORNOS DE SALUD MENTAL",
  "TIROIDITIS DE HASHIMOTO","ÚLCERAS VARICOSAS",
  "ÚLCERAS ARTERIAL","ÚVEITIS",
  "VITILIGO","OTRO"
];

const MEDICAMENTOS = [
  "NO APLICA",
  "LOSARTÁN POTÁSICO 50 mg","LOSARTÁN POTÁSICO 100 mg","ENALAPRIL 10 mg","ENALAPRIL 20 mg","AMLODIPINA 5 mg",
  "CANDESARTÁN 8 mg","CANDESARTÁN 16 mg","CANDESARTÁN 32 mg","AMLODIPINA 10 mg","VALSARTÁN 80 mg","VALSARTÁN 160 mg","OLMESARTÁN 20 mg",
  "OLMESARTÁN 40 mg","TELMISARTÁN","NIFIDIPINA 10 mg","NIFIDIPINA 20 mg","NIFIDIPINA 30 mg",
  "CARVEDILOL 6.25 mg","CARVEDILOL 12.5 mg","BISOPROLOL 2.5 mg","BISOPROLOL 5 mg","ATENOLOL 50 mg",
  "ATENOLOL 100 mg","PROPRANOLOL 40 mg","LISINOPRIL","HIDROCLOROTIAZIDA 12 mg","HIDROCLOROTIAZIDA 25 mg","FUROSEMIDA",
  "ESPIRONOLACTONA","DILTIAZEM","ASPIRINA 80 mg","ASPIRINA 81 mg","ASPIRINA 100 mg","CLOPIDOGREL 75 mg",
  "RIVAROXABÁN","APIXABÁN","PENTOXIFILINA","METFORMINA 500 mg","METFORMINA 850 mg","METFORMINA 1000 mg",
  "GLIMEPIRIDA","SITAGLIPTINA + METFORMINA (SITAGLIMET)","INSULINA (INCLUYENDO TOUJEO)","EMPAGLIFLOZINA",
  "DAPAGLIFLOZINA","LEVOTIROXINA (EUTIROX) 50 mg","LEVOTIROXINA (EUTIROX) 75 mg","LEVOTIROXINA (EUTIROX) 100 mg",
  "LEVOTIROXINA (EUTIROX) 150 mg","LEVOTIROXINA (EUTIROX) 200 mg","DICLOFENAC (POTASICO / SODICO / INTRAVENOSO)","IBUPROFEN",
  "NAPROXENO","KETOPROFENO","MELOXICAM","ACETAMINOFÉN","TORCILAX / TORSILAX","TIOCOLCHICÓSICO",
  "OMEPRAZOL 20 mg","OMEPRAZOL 40 mg","LANSOPRAZOL","RANITIDINA","FAMOTIDINA","LORATADINA 10 mg",
  "DESLORATADINA","CETIRIZINA","MONTELUKAST","SALBUTAMOL (INAHALADOR Y GOTAS)","BUDESONIDA + FORMOTEROL","BERODUAL (GOTAS)",
  "CARBAMAZEPINA 200 mg","PREGABALINA 75 mg","PREGABALINA 150 mg","ÁCIDO VALPROICO","FENITOÍNA","LEVETIRACETAM (KEPPRA)",
  "QUETIAPINA 100 mg","QUETIAPINA 200 mg","RISPERIDONA","ALPRAZOLAM","CLONAZEPAM","MIRTAZAPINA","MEMANTINA","LEVODOPA+CARBIDOPA",
  "ATORVASTATINA 20 mg","ATORVASTATINA 40 mg","ROSUVASTATINA","SIMVASTATINA","GEMFIBROZIL","OMEGA 3","TAMSULOSINA 0.4 mg","DUTASTERIDA","TADALAFIL",
  "COMPLEJO B / VITAMINA B12","VITAMINA C","VITAMINA D","ÁCIDO FÓLICO","CALCIO","HIERRO (SULFATO FERROSO)","MAGNESIO","POLIVITAMÍNICOS",
  "DIOSMINA+HESPERIDINA (DAFLON)","CASTAÑO DE INDIAS","METOTREXATO","PREDNISONA / DEFLAZACORT","ETANERCEPT","AMIODARONA","SACUBITRIL",
  "ONDANSETRÓN","DOMPERIDONA","ANTIBIÓTICOS (AMOXICILINA, AZITROMICIDA)","ACICLOVIR","RADIOTERAPIA","FISIOTERAPIA","INFILTRACIONES","TERAPIAS RESPIRATORIAS","OTRO"
];

const AYUDAS_TECNICAS = [
  "NO REQUIERE", "ANDADERA", "BASTÓN DE APOYO", "BASTÓN DE RASTREO", 
  "CAMA CLÍNICA", "COLCHÓN ANTI-ESCARAS", "LENTES", "MULETAS", 
  "PAÑALES DE ADULTO", "PRÓTESIS AUDITIVA", "PRÓTESIS DENTAL", 
  "PRÓTESIS DE MIEMBRO", "SILLA DE RUEDAS", "SILLA DE BAÑO"
];

const SERVICIOS_BASICOS = ['Agua Potable', 'Electricidad', 'Gas', 'Internet', 'Transporte'];

// Clase CSS para quitar spinners en inputs number
const noSpinnerClass = "[appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none [-moz-appearance:textfield]";

interface AdultoProps {
  onNavigate: (section: string) => void;
}

interface Consejo {
  id_consejo: number;
  nombre_consejo: string;
}

interface AdultoData {
  id_adulto: number;
  id_consejo: number | null;
  nombre: string;
  apellido: string;
  tipo_cedula: string;
  cedula: string;
  edad: number;
  genero: string;
  estado_civil: string;
  cod_tel: string;
  telefono: string;
  cod_emerg: string;
  emergencia: string;
  comunidad: string;
  calle: string;
  vereda: string;
  residencia: string;
  nro_casa: string;
  correo: string;
  red_social: string;
  propiedad: string;
  servicios: string[];
  convivencia: string;
  integrantes: string;
  enfermedad_cronica: string;
  cual_enfermedad: string;
  otra_enfermedad: string;
  tratamiento: string;
  cual_tratamiento: string;
  otra_medicamento: string;
  ayuda_tecnica: string;
  centro_salud: string;
  situacion_laboral: string;
  fuente_ingreso: string;
  programa_social: string;
  participacion_comunitaria: string;
  recreacion: string;
  urgencias: string[];
  camisa: string;
  pantalon: string;
  calzado: string;
  peso: string;
  estatura: string;
  registro_nacional: string;
}

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
    <div className="flex flex-wrap gap-1.5">
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
            "px-2 py-1 rounded-full text-[8px] font-black uppercase transition-all",
            selected.includes(opt) ? "bg-brand-primary text-white shadow-sm" : "bg-gray-100 text-slate-500 hover:bg-gray-200"
          )}
        >
          {opt}
        </button>
      ))}
    </div>
    {selected.length > 0 && (
      <p className="text-[7px] text-slate-500 italic ml-1">Seleccionados: {selected.join(', ')}</p>
    )}
  </div>
));

const DetailItem = ({ label, value }: { label: string; value: any }) => (
  <div className="border-b border-gray-100 pb-2">
    <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">{label}</p>
    <p className="text-xs font-medium text-slate-700 mt-0.5">{value || '—'}</p>
  </div>
);

// ==================== COMPONENTE PRINCIPAL ====================
export const Adulto = ({ onNavigate }: AdultoProps) => {
  const { user } = useAuth();
  
  const [noSala, setNoSala] = useState(false);
  const [comunaId, setComunaId] = useState<number | null>(null);
  const [consejos, setConsejos] = useState<Consejo[]>([]);
  const [loadingData, setLoadingData] = useState(true);
  const [adultos, setAdultos] = useState<AdultoData[]>([]);
  const [loadingAdults, setLoadingAdults] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const ITEMS_PER_PAGE = 5;
  
  const [showModal, setShowModal] = useState(false);
  const [currentStep, setCurrentStep] = useState(1);
  const [saving, setSaving] = useState(false);
  
  const [selectedPerson, setSelectedPerson] = useState<AdultoData | null>(null);
  
  // --- Estados para búsqueda por cédula ---
  const [buscarCedulaTipo, setBuscarCedulaTipo] = useState("V");
  const [buscarCedulaNumero, setBuscarCedulaNumero] = useState("");
  const [buscando, setBuscando] = useState(false);
  // ----------------------------------------------

  const [formData, setFormData] = useState({
    // Paso 1
    nombre: '', apellido: '', tipoCedula: 'V', cedulaNumero: '', edad: '', genero: '', estadoCivil: '', 
    codTel: '', telefono: '', codEmerg: '', emergencia: '',
    // Paso 2
    consejoId: '', comunidad: '', calle: '', vereda: '', residencia: '', nroCasa: '', correo: '', redSocial: '',
    // Paso 3
    propiedad: '', servicios: [] as string[], convivencia: '', integrantes: '',
    // Paso 4
    enfermedadCronica: '', cualEnfermedad: '', otraEnfermedad: '', tratamiento: '', cualTratamiento: '', otraMedicamento: '', ayudaTecnica: '', centroSalud: '',
    // Paso 5
    situacionLaboral: '', camisa: '', pantalon: '', calzado: '', peso: '', estatura: '', registroNacional: ''
  });
  
  const steps = [
    { title: "Identificación", subtitle: "Datos Personales", icon: User },
    { title: "Ubicación", subtitle: "Georeferencia", icon: MapPin },
    { title: "Socio-Vivienda", subtitle: "Condiciones de Vida", icon: Home },
    { title: "Salud", subtitle: "Condición Médica", icon: HeartPulse },
    { title: "Social y Tallas", subtitle: "Bienestar y Medidas", icon: Briefcase },
  ];

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

  // ========== OCULTAR SIDEBAR CUANDO MODAL ESTÁ ABIERTO ==========
  useEffect(() => {
    if (showModal || selectedPerson || modalState.isOpen) {
      document.body.classList.add('modal-open');
    } else {
      document.body.classList.remove('modal-open');
    }
    return () => document.body.classList.remove('modal-open');
  }, [showModal, selectedPerson, modalState.isOpen]);
  
  // Manejadores estables
  const handleInputChange = useCallback((field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  }, []);
  
  const handleCedulaChange = useCallback((value: string) => {
    handleInputChange('cedulaNumero', value.replace(/\D/g, '').slice(0,8));
  }, [handleInputChange]);
  
  const handleTelefonoChange = useCallback((value: string) => {
    handleInputChange('telefono', value.replace(/\D/g, '').slice(0,7));
  }, [handleInputChange]);
  
  const handleEmergenciaChange = useCallback((value: string) => {
    handleInputChange('emergencia', value.replace(/\D/g, '').slice(0,7));
  }, [handleInputChange]);

  // --- Función para buscar por cédula en el censo (CORREGIDA) ---
  const handleBuscarPorCedula = useCallback(async () => {
    if (!buscarCedulaNumero || buscarCedulaNumero.length < 7) {
      showAlert('Cédula incompleta', 'Ingrese al menos 7 dígitos.', 'warning');
      return;
    }
    if (!comunaId) {
      showAlert('Sin comuna', 'No se ha identificado la comuna.', 'danger');
      return;
    }

    const idsConsejos = consejos.map(c => c.id_consejo);
    if (idsConsejos.length === 0) {
      showAlert('Sin consejos', 'No hay consejos en esta comuna.', 'warning');
      return;
    }

    // 🔧 CORRECCIÓN: buscar solo con el número, sin la letra
    const soloNumero = buscarCedulaNumero;
    setBuscando(true);

    try {
      // 1. Buscar en censo_fichas
      const { data: fichas, error: errFichas } = await supabase
        .from('censo_fichas')
        .select('*')
        .in('id_consejo', idsConsejos)
        .eq('cedula', soloNumero)  // 🔧 solo número
        .maybeSingle();

      if (errFichas) throw errFichas;

      if (fichas) {
        if (fichas.edad < 55) {
          showAlert('Edad no válida', 'La persona debe tener 55 años o más.', 'warning');
          setBuscando(false);
          return;
        }
        // Extraer tipo y número (si la cédula tiene letra, se extrae; si no, tipo 'V')
        const cedulaStr = fichas.cedula || '';
        const tipoMatch = cedulaStr.match(/^[VE]/);
        const tipo = tipoMatch ? tipoMatch[0] : 'V';
        const numero = cedulaStr.replace(/^[VE]/, '') || cedulaStr;

        setFormData(prev => ({
          ...prev,
          nombre: fichas.nombres || '',
          apellido: fichas.apellidos || '',
          tipoCedula: tipo,
          cedulaNumero: numero,
          edad: fichas.edad?.toString() || '',
          genero: fichas.sexo || '',
          comunidad: fichas.comunidad || '',
          calle: fichas.direccion || '',
        }));
        if (fichas.id_consejo && consejos.some(c => c.id_consejo === fichas.id_consejo)) {
          setFormData(prev => ({ ...prev, consejoId: fichas.id_consejo.toString() }));
        }
        showAlert('Registro encontrado', 'Datos cargados desde el censo de la comuna.', 'success');
        setBuscando(false);
        return;
      }

      // 2. Buscar en censo_familiares con join a censo_fichas para filtrar por consejo
      // 🔧 CORRECCIÓN: usar la sintaxis correcta de join y filtrar por id_consejo
      const { data: familiar, error: errFam } = await supabase
        .from('censo_familiares')
        .select(`*, censo_fichas!inner(id_ficha) ( id_consejo )`)  // join por id_ficha
        .eq('cedula', soloNumero)   // 🔧 solo número
        .in('censo_fichas.id_consejo', idsConsejos)
        .maybeSingle();

      if (errFam) throw errFam;

      if (familiar) {
        if (familiar.edad < 55) {
          showAlert('Edad no válida', 'La persona debe tener 55 años o más.', 'warning');
          setBuscando(false);
          return;
        }
        const cedulaStr = familiar.cedula || '';
        const tipoMatch = cedulaStr.match(/^[VE]/);
        const tipo = tipoMatch ? tipoMatch[0] : 'V';
        const numero = cedulaStr.replace(/^[VE]/, '') || cedulaStr;

        setFormData(prev => ({
          ...prev,
          nombre: familiar.nombre_familiar || '',
          apellido: familiar.apellido_familiar || '',
          tipoCedula: tipo,
          cedulaNumero: numero,
          edad: familiar.edad?.toString() || '',
          genero: familiar.sexo || '',
        }));
        // Si el familiar tiene id_ficha, obtener el consejo de la ficha
        if (familiar.id_ficha) {
          const { data: fichaRel, error: errRel } = await supabase
            .from('censo_fichas')
            .select('id_consejo')
            .eq('id_ficha', familiar.id_ficha)
            .maybeSingle();
          if (!errRel && fichaRel && consejos.some(c => c.id_consejo === fichaRel.id_consejo)) {
            setFormData(prev => ({ ...prev, consejoId: fichaRel.id_consejo.toString() }));
          }
        }
        showAlert('Registro encontrado', 'Datos cargados desde el censo de la comuna (familiar).', 'success');
        setBuscando(false);
        return;
      }

      // No encontrado
      showAlert('No encontrado', 'No se encontró a esta persona en el censo de la comuna.', 'info');
    } catch (error) {
      console.error(error);
      showAlert('Error', 'Ocurrió un error al buscar.', 'danger');
    } finally {
      setBuscando(false);
    }
  }, [buscarCedulaNumero, comunaId, consejos, showAlert]);

  // --- Fin de búsqueda ---
  
  // Validación de pasos (edad mínima 55)
  const validateStep = useCallback((step: number): boolean => {
    switch (step) {
      case 1:
        if (!formData.nombre.trim()) return false;
        if (!formData.apellido.trim()) return false;
        if (!formData.tipoCedula || !/^\d{7,8}$/.test(formData.cedulaNumero)) return false;
        if (!formData.edad || parseInt(formData.edad) < 55) return false;
        if (!formData.genero) return false;
        if (!formData.estadoCivil) return false;
        if (!formData.codTel || !formData.telefono || !/^\d{7}$/.test(formData.telefono)) return false;
        if (!formData.codEmerg || !formData.emergencia || !/^\d{7}$/.test(formData.emergencia)) return false;
        return true;
      case 2:
        if (!formData.consejoId) return false;
        if (!formData.comunidad.trim()) return false;
        if (!formData.calle.trim()) return false;
        if (!formData.residencia.trim()) return false;
        return true;
      case 3:
        if (!formData.propiedad) return false;
        if (!formData.convivencia) return false;
        if (!formData.integrantes || parseInt(formData.integrantes) <= 0) return false;
        return true;
      case 4:
        if (!formData.enfermedadCronica) return false;
        if (formData.enfermedadCronica === 'SI' && !formData.cualEnfermedad) return false;
        if (!formData.tratamiento) return false;
        if (formData.tratamiento === 'SI' && !formData.cualTratamiento) return false;
        return true;
      case 5:
        if (!formData.situacionLaboral) return false;
        if (!formData.camisa || !formData.pantalon || !formData.calzado) return false;
        if (!formData.peso || !formData.estatura) return false;
        if (!formData.registroNacional) return false;
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
  
  // Contenido de cada paso (se añade el buscador en el paso 1)
  const stepContent = useMemo(() => {
    switch (currentStep) {
      case 1:
        return (
          <div key="step1" className="space-y-4">
            {/* Buscador por cédula */}
            <div className="bg-gray-50/70 p-3 rounded-xl border border-gray-200">
              <div className="flex items-center gap-2 mb-2">
                <Search className="h-4 w-4 text-brand-primary" />
                <span className="text-[9px] font-bold text-slate-600 uppercase">Buscar en el censo</span>
              </div>
              <div className="flex flex-wrap items-end gap-2">
                <div className="flex-1 min-w-[200px]">
                  <label className="text-[7px] font-bold text-slate-400 uppercase ml-1 block">Cédula (solo número)</label>
                  <div className="flex gap-1.5">
                    <select 
                      value={buscarCedulaTipo} 
                      onChange={(e) => setBuscarCedulaTipo(e.target.value)}
                      className="w-16 p-1.5 rounded-xl bg-white ring-1 ring-gray-200 text-[10px] font-bold outline-none focus:ring-2 focus:ring-brand-primary"
                    >
                      <option value="V">V</option>
                      <option value="E">E</option>
                    </select>
                    <input 
                      type="number" 
                      placeholder="Número de cédula"
                      value={buscarCedulaNumero} 
                      onChange={(e) => setBuscarCedulaNumero(e.target.value.replace(/\D/g, '').slice(0,8))}
                      className={cn("flex-1 p-1.5 px-3 rounded-xl bg-white ring-1 ring-gray-200 text-[10px] font-bold outline-none focus:ring-2 focus:ring-brand-primary", noSpinnerClass)}
                    />
                  </div>
                </div>
                <button
                  onClick={handleBuscarPorCedula}
                  disabled={buscando}
                  className="px-4 py-1.5 bg-brand-primary text-white rounded-xl text-[8px] font-black uppercase tracking-wider hover:bg-brand-primary/90 transition-all disabled:opacity-50 shadow-sm flex items-center gap-1.5"
                >
                  {buscando ? <Loader2 className="h-3 w-3 animate-spin" /> : <UserPlus className="h-3 w-3" />}
                  Buscar
                </button>
              </div>
              <p className="text-[6px] text-slate-400 mt-1.5">Busca en el censo de tu comuna (personas ≥ 55 años). Los datos se autocompletarán.</p>
            </div>

            {/* Campos de identificación */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
              <InputField label="Nombre" value={formData.nombre} onChange={(val: string) => handleInputChange('nombre', val)} />
              <InputField label="Apellido" value={formData.apellido} onChange={(val: string) => handleInputChange('apellido', val)} />
              <div className="space-y-1">
                <label className="text-[7px] font-bold text-slate-400 uppercase ml-1 block">Cédula *</label>
                <div className="flex gap-1.5">
                  <select 
                    value={formData.tipoCedula} 
                    onChange={(e) => handleInputChange('tipoCedula', e.target.value)}
                    className="w-16 p-1.5 rounded-xl bg-gray-50 ring-1 ring-gray-100 text-[10px] font-bold outline-none focus:ring-2 focus:ring-brand-primary"
                  >
                    <option value="V">V</option>
                    <option value="E">E</option>
                  </select>
                  <input 
                    type="number" 
                    placeholder="Número de cédula"
                    value={formData.cedulaNumero} 
                    onChange={(e) => handleCedulaChange(e.target.value)}
                    className={cn("flex-1 p-1.5 px-3 rounded-xl bg-gray-50 ring-1 ring-gray-100 text-[10px] font-bold outline-none focus:ring-2 focus:ring-brand-primary", noSpinnerClass)}
                  />
                </div>
              </div>
              <InputField label="Edad" type="number" value={formData.edad} onChange={(val: string) => handleInputChange('edad', val)} />
              <SelectField label="Género" value={formData.genero} onChange={(val: string) => handleInputChange('genero', val)} options={['Femenino', 'Masculino', 'Otro']} />
              <SelectField label="Estado Civil" value={formData.estadoCivil} onChange={(val: string) => handleInputChange('estadoCivil', val)} options={['Soltero/a', 'Casado/a', 'Divorciado/a', 'Viudo/a', 'Concubinato']} />
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
              <div className="space-y-1">
                <label className="text-[7px] font-bold text-slate-400 uppercase ml-1 block">Contacto Emergencia *</label>
                <div className="flex gap-1.5">
                  <select 
                    value={formData.codEmerg} 
                    onChange={(e) => handleInputChange('codEmerg', e.target.value)}
                    className="w-20 p-1.5 rounded-xl bg-gray-50 ring-1 ring-gray-100 text-[10px] font-bold outline-none focus:ring-2 focus:ring-brand-primary"
                  >
                    <option value="">Cód.</option>
                    {OPERADORAS.map(op => <option key={op} value={op}>{op}</option>)}
                  </select>
                  <input 
                    type="number" 
                    placeholder="Número"
                    value={formData.emergencia} 
                    onChange={(e) => handleEmergenciaChange(e.target.value)}
                    className={cn("flex-1 p-1.5 px-3 rounded-xl bg-gray-50 ring-1 ring-gray-100 text-[10px] font-bold outline-none focus:ring-2 focus:ring-brand-primary", noSpinnerClass)}
                  />
                </div>
              </div>
            </div>
          </div>
        );
      case 2:
        return (
          <div key="step2" className="grid grid-cols-1 lg:grid-cols-2 gap-3">
            <SelectField 
              label="Consejo Comunal" 
              value={formData.consejoId} 
              onChange={(val: string) => handleInputChange('consejoId', val)} 
              options={consejos.map(c => ({ value: c.id_consejo.toString(), label: c.nombre_consejo }))} 
            />
            <InputField label="Comunidad" value={formData.comunidad} onChange={(val: string) => handleInputChange('comunidad', val)} />
            <InputField label="Avenida o Calle" value={formData.calle} onChange={(val: string) => handleInputChange('calle', val)} />
            <InputField label="Vereda" value={formData.vereda} onChange={(val: string) => handleInputChange('vereda', val)} />
            <InputField label="Residencia / Urb" value={formData.residencia} onChange={(val: string) => handleInputChange('residencia', val)} />
            <InputField label="N° Casa / Apto" value={formData.nroCasa} onChange={(val: string) => handleInputChange('nroCasa', val)} />
            <InputField label="Correo Electrónico" value={formData.correo} onChange={(val: string) => handleInputChange('correo', val)} required={false} />
            <SelectField label="Red Social más utilizada" value={formData.redSocial} onChange={(val: string) => handleInputChange('redSocial', val)} options={['WhatsApp', 'Facebook', 'Instagram', 'TikTok', 'No posee']} required={false} />
          </div>
        );
      case 3:
        return (
          <div key="step3" className="grid grid-cols-1 lg:grid-cols-2 gap-3">
            <SelectField label="Relación Propiedad" value={formData.propiedad} onChange={(val: string) => handleInputChange('propiedad', val)} options={['Propia', 'Herencia', 'Alquilada', 'Prestada']} />
            <SelectField label="¿Con quién vive?" value={formData.convivencia} onChange={(val: string) => handleInputChange('convivencia', val)} options={['Solo/a', 'Pareja', 'Hijos/as', 'Familiares', 'Amigos/as']} />
            <InputField label="Integrantes del hogar" type="number" value={formData.integrantes} onChange={(val: string) => handleInputChange('integrantes', val)} />
            <div className="lg:col-span-2">
              <MultiSelectButtons 
                label="Servicios Básicos" 
                options={SERVICIOS_BASICOS} 
                selected={formData.servicios} 
                onChange={(val: string[]) => handleInputChange('servicios', val)} 
              />
            </div>
          </div>
        );
      case 4:
        return (
          <div key="step4" className="grid grid-cols-1 lg:grid-cols-2 gap-3">
            <SelectField label="¿Padece enfermedad crónica?" value={formData.enfermedadCronica} onChange={(val: string) => handleInputChange('enfermedadCronica', val)} options={['SI', 'NO']} />
            {formData.enfermedadCronica === 'SI' && (
              <>
                <SelectField label="Indique enfermedad" value={formData.cualEnfermedad} onChange={(val: string) => handleInputChange('cualEnfermedad', val)} options={ENFERMEDADES} />
                {formData.cualEnfermedad === 'OTRO' && (
                  <InputField label="Especifique enfermedad" value={formData.otraEnfermedad} onChange={(val: string) => handleInputChange('otraEnfermedad', val)} placeholder="Escriba la enfermedad..." />
                )}
              </>
            )}
            <SelectField label="¿Recibe tratamiento?" value={formData.tratamiento} onChange={(val: string) => handleInputChange('tratamiento', val)} options={['SI', 'NO']} />
            {formData.tratamiento === 'SI' && (
              <>
                <SelectField label="Indique medicamento" value={formData.cualTratamiento} onChange={(val: string) => handleInputChange('cualTratamiento', val)} options={MEDICAMENTOS} />
                {formData.cualTratamiento === 'OTRO' && (
                  <InputField label="Especifique medicamento" value={formData.otraMedicamento} onChange={(val: string) => handleInputChange('otraMedicamento', val)} placeholder="Escriba el medicamento..." />
                )}
              </>
            )}
            <SelectField label="Ayuda Técnica" value={formData.ayudaTecnica} onChange={(val: string) => handleInputChange('ayudaTecnica', val)} options={AYUDAS_TECNICAS} required={false} />
            <SelectField label="Centro de Salud frecuente" value={formData.centroSalud} onChange={(val: string) => handleInputChange('centroSalud', val)} options={CENTROS_SALUD} required={false} />
          </div>
        );
      case 5:
        return (
          <div key="step5" className="grid grid-cols-1 lg:grid-cols-2 gap-3">
            <SelectField label="Situación Laboral" value={formData.situacionLaboral} onChange={(val: string) => handleInputChange('situacionLaboral', val)} options={['Jubilado/a', 'Pensionado/a', 'Desempleado/a', 'Cuenta Propia']} />
            <InputField label="Camisa (talla)" value={formData.camisa} onChange={(val: string) => handleInputChange('camisa', val)} />
            <InputField label="Pantalón (talla)" value={formData.pantalon} onChange={(val: string) => handleInputChange('pantalon', val)} />
            <InputField label="Calzado (talla)" value={formData.calzado} onChange={(val: string) => handleInputChange('calzado', val)} />
            <InputField label="Peso (Kg)" type="number" value={formData.peso} onChange={(val: string) => handleInputChange('peso', val)} />
            <InputField label="Estatura (cm)" type="number" value={formData.estatura} onChange={(val: string) => handleInputChange('estatura', val)} />
            <SelectField label="Registro Nacional" value={formData.registroNacional} onChange={(val: string) => handleInputChange('registroNacional', val)} options={['SI', 'NO']} />
          </div>
        );
      default: return null;
    }
  }, [currentStep, formData, handleInputChange, handleCedulaChange, handleTelefonoChange, handleEmergenciaChange, consejos, buscarCedulaTipo, buscarCedulaNumero, buscando, handleBuscarPorCedula]);
  
  // Carga inicial
  useEffect(() => {
    if (!user?.id) return;
    const fetchSalaData = async () => {
      setLoadingData(true);
      const { data: sala, error: salaError } = await supabase
        .from('datos_sala_autogobierno')
        .select('id_comuna')
        .eq('id_usuario', user.id)
        .maybeSingle();
      if (salaError) console.error(salaError);
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
        } else setConsejos([]);
      } else {
        setNoSala(true);
      }
      setLoadingData(false);
    };
    fetchSalaData();
  }, [user]);
  
  useEffect(() => {
    if (!comunaId) return;
    const fetchAdultos = async () => {
      setLoadingAdults(true);
      const { data, error } = await supabase
        .from('adultos_mayores')
        .select('*')
        .eq('id_comuna', comunaId)
        .order('created_at', { ascending: false });
      if (error) console.error(error);
      else setAdultos(data || []);
      setLoadingAdults(false);
    };
    fetchAdultos();
  }, [comunaId]);
  
  const handleSubmit = async () => {
    if (!validateStep(5)) {
      showAlert('Paso incompleto', 'Completa todos los campos del último paso.', 'warning');
      return;
    }
    if (!comunaId) {
      showAlert('Error de identificación', 'No se pudo identificar la comuna de tu sala.', 'danger');
      return;
    }

    const cedulaCompleta = `${formData.tipoCedula}${formData.cedulaNumero}`;
    
    // Verificar duplicado
    const { data: existing, error: checkError } = await supabase
      .from('adultos_mayores')
      .select('cedula')
      .eq('cedula', cedulaCompleta)
      .maybeSingle();

    if (checkError) {
      console.error(checkError);
      showAlert('Error de verificación', 'Error al verificar la cédula. Intenta de nuevo.', 'danger');
      return;
    }

    if (existing) {
      showAlert('Cédula duplicada', 'Ya existe un adulto mayor registrado con esta cédula.', 'danger');
      return;
    }

    setSaving(true);

    const newAdulto = {
      id_comuna: comunaId,
      id_consejo: parseInt(formData.consejoId),
      nombre: formData.nombre,
      apellido: formData.apellido,
      cedula: cedulaCompleta,
      edad: parseInt(formData.edad),
      genero: formData.genero,
      estado_civil: formData.estadoCivil,
      cod_tel: formData.codTel,
      telefono: formData.telefono,
      cod_emerg: formData.codEmerg,
      emergencia: formData.emergencia,
      comunidad: formData.comunidad,
      calle: formData.calle,
      vereda: formData.vereda || null,
      residencia: formData.residencia,
      nro_casa: formData.nroCasa || null,
      correo: formData.correo || null,
      red_social: formData.redSocial || null,
      propiedad: formData.propiedad,
      servicios: formData.servicios,
      convivencia: formData.convivencia,
      integrantes: formData.integrantes,
      enfermedad_cronica: formData.enfermedadCronica,
      cual_enfermedad: formData.enfermedadCronica === 'SI' ? (formData.cualEnfermedad === 'OTRO' ? formData.otraEnfermedad : formData.cualEnfermedad) : null,
      otra_enfermedad: formData.enfermedadCronica === 'SI' && formData.cualEnfermedad === 'OTRO' ? formData.otraEnfermedad : null,
      tratamiento: formData.tratamiento,
      cual_tratamiento: formData.tratamiento === 'SI' ? (formData.cualTratamiento === 'OTRO' ? formData.otraMedicamento : formData.cualTratamiento) : null,
      otra_medicamento: formData.tratamiento === 'SI' && formData.cualTratamiento === 'OTRO' ? formData.otraMedicamento : null,
      ayuda_tecnica: formData.ayudaTecnica,
      centro_salud: formData.centroSalud || null,
      situacion_laboral: formData.situacionLaboral,
      fuente_ingreso: null,
      programa_social: null,
      participacion_comunitaria: null,
      recreacion: null,
      urgencias: [],
      camisa: formData.camisa,
      pantalon: formData.pantalon,
      calzado: formData.calzado,
      peso: formData.peso,
      estatura: formData.estatura,
      registro_nacional: formData.registroNacional,
    };

    const { error } = await supabase.from('adultos_mayores').insert([newAdulto]);
    if (error) {
      console.error(error);
      showAlert('Error al guardar', error.message, 'danger');
    } else {
      showAlert('Registro exitoso', 'Registro completado exitosamente.', 'success');
      setShowModal(false);
      const resetForm = () => {
        setFormData({
          nombre: '', apellido: '', tipoCedula: 'V', cedulaNumero: '', edad: '', genero: '', estadoCivil: '', 
          codTel: '', telefono: '', codEmerg: '', emergencia: '',
          consejoId: '', comunidad: '', calle: '', vereda: '', residencia: '', nroCasa: '', correo: '', redSocial: '',
          propiedad: '', servicios: [], convivencia: '', integrantes: '',
          enfermedadCronica: '', cualEnfermedad: '', otraEnfermedad: '', tratamiento: '', cualTratamiento: '', otraMedicamento: '', ayudaTecnica: '', centroSalud: '',
          situacionLaboral: '', camisa: '', pantalon: '', calzado: '', peso: '', estatura: '', registroNacional: ''
        });
      };
      resetForm();
      setCurrentStep(1);
      const { data: refreshed } = await supabase
        .from('adultos_mayores')
        .select('*')
        .eq('id_comuna', comunaId)
        .order('created_at', { ascending: false });
      if (refreshed) setAdultos(refreshed);
    }
    setSaving(false);
  };
  
  const getConsejoName = useCallback((consejoId: number | null) => {
    if (!consejoId) return 'No asignado';
    const consejo = consejos.find(c => c.id_consejo === consejoId);
    return consejo?.nombre_consejo || 'Desconocido';
  }, [consejos]);
  
  // Estadísticas
  const totalAdultos = adultos.length;
  const totalFemenino = adultos.filter(a => a.genero === 'Femenino').length;
  const totalMasculino = adultos.filter(a => a.genero === 'Masculino').length;
  const conEnfermedadCronica = adultos.filter(a => a.enfermedad_cronica === 'SI').length;
  const conAyudasTecnicas = adultos.filter(a => a.ayuda_tecnica && a.ayuda_tecnica !== 'NO REQUIERE').length;
  
  // Filtrado y paginación
  const filteredAdultos = useMemo(() => {
    const term = searchTerm.toLowerCase();
    return adultos.filter(a => 
      a.nombre.toLowerCase().includes(term) || 
      a.apellido.toLowerCase().includes(term) || 
      a.cedula.includes(term)
    );
  }, [adultos, searchTerm]);
  
  const totalPages = Math.ceil(filteredAdultos.length / ITEMS_PER_PAGE);
  const paginatedAdultos = filteredAdultos.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE);
  
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
            <Users className="h-4 w-4 text-brand-primary" /> Caracterización Adulto Mayor
          </h2>
          <p className="text-[8px] text-slate-400 font-bold uppercase tracking-[0.15em] mt-0.5">
            Registro Integral de Ciudadanos y Necesidades
          </p>
        </div>
        <button 
          onClick={() => { setShowModal(true); setCurrentStep(1); setBuscarCedulaNumero(''); setBuscarCedulaTipo('V'); }}
          className="px-4 py-1.5 bg-brand-primary text-white rounded-lg text-[8px] font-black italic uppercase tracking-wider hover:bg-brand-primary/90 transition-all shadow-sm"
        >
          Iniciar Registro
        </button>
      </div>
      
      {/* DASHBOARD PREVIEW */}
      <div className="grid gap-3 md:grid-cols-3">
        <CardContainer>
          <SectionHeader icon={User} title="Población" subtitle="Adultos Registrados" />
          <div className="text-2xl font-black italic text-slate-800">{totalAdultos}</div>
          <div className="flex gap-2 mt-1 text-[8px] font-bold">
            <span className="text-pink-500">♀ {totalFemenino}</span>
            <span className="text-blue-500">♂ {totalMasculino}</span>
          </div>
        </CardContainer>
        <CardContainer>
          <SectionHeader icon={HeartPulse} title="Enfermedad Crónica" subtitle="Casos activos" />
          <div className="text-2xl font-black italic text-rose-600">{conEnfermedadCronica}</div>
        </CardContainer>
        <CardContainer>
          <SectionHeader icon={Stethoscope} title="Ayudas Técnicas" subtitle="Requieren apoyo" />
          <div className="text-2xl font-black italic text-emerald-600">{conAyudasTecnicas}</div>
        </CardContainer>
      </div>
      
      {/* LISTADO */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <SectionHeader icon={Users} title="Personas Registradas" subtitle="Registros del sistema" />
          <div className="relative w-56">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3 w-3 text-slate-400" />
            <input
              type="text"
              placeholder="Buscar por nombre o cédula"
              value={searchTerm}
              onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }}
              className="w-full pl-8 pr-3 py-1.5 rounded-lg border border-gray-100 bg-gray-50 text-[9px] font-medium focus:ring-1 focus:ring-brand-primary/20 outline-none"
            />
          </div>
        </div>
        {loadingAdults ? (
          <div className="flex justify-center py-8"><Loader2 className="animate-spin text-brand-primary" size={24} /></div>
        ) : filteredAdultos.length === 0 ? (
          <div className="text-center py-6 text-slate-400 text-xs">No hay adultos mayores registrados.</div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 max-h-112.5 overflow-y-auto pr-1">
            {paginatedAdultos.map((persona, idx) => (
              <div 
                key={persona.id_adulto ?? idx} 
                onClick={() => setSelectedPerson(persona)}
                className="bg-white p-3 rounded-xl border border-gray-100 shadow-sm hover:shadow-md hover:border-brand-primary/50 transition-all cursor-pointer"
              >
                <div className="flex items-start justify-between">
                  <div className="space-y-0.5">
                    <h4 className="font-black text-[11px] text-slate-800">{persona.nombre} {persona.apellido}</h4>
                    <p className="text-[9px] text-slate-500">{persona.cedula}</p>
                    <div className="flex items-center gap-1 text-[8px] text-slate-400">
                      <span>{persona.edad} años</span>
                      <span>•</span>
                      <span>{persona.genero}</span>
                    </div>
                  </div>
                  <div className="text-[7px] font-bold text-brand-primary bg-brand-primary/10 px-1.5 py-0.5 rounded-lg">
                    {persona.cod_tel}-{persona.telefono}
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
      
      {/* MODAL DE DETALLE */}
      <AnimatePresence>
        {selectedPerson && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSelectedPerson(null)}
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
                  <h4 className="text-xl font-black text-slate-800 italic uppercase tracking-tighter">Detalles del Adulto Mayor</h4>
                  <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mt-1">Información completa del registro</p>
                </div>
                <button onClick={() => setSelectedPerson(null)} className="p-2 rounded-xl hover:bg-white transition-colors">
                  <X size={20} className="text-slate-400" />
                </button>
              </div>
              
              <div className="flex-1 overflow-y-auto p-6 space-y-6">
                <div className="space-y-3">
                  <SectionHeader icon={User} title="Identificación" subtitle="Datos Personales" />
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <DetailItem label="Nombre completo" value={`${selectedPerson.nombre} ${selectedPerson.apellido}`} />
                    <DetailItem label="Cédula" value={`${selectedPerson.cedula}`} />
                    <DetailItem label="Edad" value={`${selectedPerson.edad} años`} />
                    <DetailItem label="Género" value={selectedPerson.genero} />
                    <DetailItem label="Estado Civil" value={selectedPerson.estado_civil} />
                    <DetailItem label="Teléfono" value={`${selectedPerson.cod_tel}-${selectedPerson.telefono}`} />
                    <DetailItem label="Contacto Emergencia" value={`${selectedPerson.cod_emerg}-${selectedPerson.emergencia}`} />
                  </div>
                </div>

                <div className="space-y-3">
                  <SectionHeader icon={MapPin} title="Ubicación" subtitle="Georeferencia" />
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <DetailItem label="Consejo Comunal" value={getConsejoName(selectedPerson.id_consejo)} />
                    <DetailItem label="Comunidad" value={selectedPerson.comunidad} />
                    <DetailItem label="Avenida / Calle" value={selectedPerson.calle} />
                    <DetailItem label="Vereda" value={selectedPerson.vereda || '—'} />
                    <DetailItem label="Residencia / Urb" value={selectedPerson.residencia} />
                    <DetailItem label="N° Casa / Apto" value={selectedPerson.nro_casa || '—'} />
                    <DetailItem label="Correo Electrónico" value={selectedPerson.correo || '—'} />
                    <DetailItem label="Red Social" value={selectedPerson.red_social || '—'} />
                  </div>
                </div>

                <div className="space-y-3">
                  <SectionHeader icon={Home} title="Socio-Vivienda" subtitle="Condiciones de Vida" />
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <DetailItem label="Relación Propiedad" value={selectedPerson.propiedad} />
                    <DetailItem label="Convivencia" value={selectedPerson.convivencia} />
                    <DetailItem label="Integrantes del hogar" value={selectedPerson.integrantes} />
                    <DetailItem label="Servicios Básicos" value={selectedPerson.servicios?.join(', ') || '—'} />
                  </div>
                </div>

                <div className="space-y-3">
                  <SectionHeader icon={HeartPulse} title="Salud" subtitle="Condición Médica" />
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <DetailItem label="Enfermedad Crónica" value={selectedPerson.enfermedad_cronica === 'SI' ? 'Sí' : 'No'} />
                    {selectedPerson.enfermedad_cronica === 'SI' && (
                      <DetailItem label="Diagnóstico" value={selectedPerson.cual_enfermedad || selectedPerson.otra_enfermedad || '—'} />
                    )}
                    <DetailItem label="Tratamiento" value={selectedPerson.tratamiento === 'SI' ? 'Sí' : 'No'} />
                    {selectedPerson.tratamiento === 'SI' && (
                      <DetailItem label="Medicamento" value={selectedPerson.cual_tratamiento || selectedPerson.otra_medicamento || '—'} />
                    )}
                    <DetailItem label="Ayuda Técnica" value={selectedPerson.ayuda_tecnica || 'No requiere'} />
                    <DetailItem label="Centro de Salud" value={selectedPerson.centro_salud || '—'} />
                  </div>
                </div>

                <div className="space-y-3">
                  <SectionHeader icon={Briefcase} title="Social y Tallas" subtitle="Bienestar y Medidas" />
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <DetailItem label="Situación Laboral" value={selectedPerson.situacion_laboral} />
                    <DetailItem label="Camisa" value={selectedPerson.camisa} />
                    <DetailItem label="Pantalón" value={selectedPerson.pantalon} />
                    <DetailItem label="Calzado" value={selectedPerson.calzado} />
                    <DetailItem label="Peso" value={`${selectedPerson.peso} Kg`} />
                    <DetailItem label="Estatura" value={`${selectedPerson.estatura} cm`} />
                    <DetailItem label="Registro Nacional" value={selectedPerson.registro_nacional === 'SI' ? 'Sí' : 'No'} />
                  </div>
                </div>
              </div>

              <div className="p-6 bg-gray-50/50 border-t border-gray-100 flex justify-end">
                <button 
                  onClick={() => setSelectedPerson(null)}
                  className="px-6 py-2 rounded-xl bg-brand-primary text-white text-[10px] font-black uppercase tracking-widest shadow-md hover:scale-[1.02] transition-all"
                >
                  Cerrar
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
      
      {/* MODAL MULTIPASO */}
      <AnimatePresence>
        {showModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-6">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setShowModal(false)} className="absolute inset-0 bg-slate-900/60 backdrop-blur-md" />
            <motion.div initial={{ scale: 0.9, opacity: 0, y: 20 }} animate={{ scale: 1, opacity: 1, y: 0 }} exit={{ scale: 0.9, opacity: 0, y: 20 }} className="relative w-full max-w-2xl max-h-[85vh] bg-white rounded-[3rem] shadow-2xl overflow-hidden flex flex-col">
              
              <div className="p-8 border-b border-gray-50 flex justify-between items-center bg-gray-50/50">
                <div>
                  <h4 className="text-xl font-black text-slate-800 italic uppercase tracking-tighter">Ficha Social</h4>
                  <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mt-1">Paso {currentStep} de 5</p>
                </div>
                <button onClick={() => setShowModal(false)} className="p-3 bg-white rounded-2xl shadow-sm hover:text-red-500 transition-colors"><X size={20} /></button>
              </div>

              <div className="px-8 py-4 border-b border-gray-50 bg-white">
                <div className="flex items-center justify-between gap-2 overflow-x-auto pb-2">
                  {steps.map((step, index) => (
                    <div key={index} className={`flex items-center gap-2 min-w-fit ${currentStep === index + 1 ? 'opacity-100' : 'opacity-40'}`}>
                      <div className={`w-8 h-8 rounded-xl flex items-center justify-center text-[10px] font-black ${currentStep >= index + 1 ? 'bg-brand-primary text-white' : 'bg-gray-100'}`}>
                        {index + 1}
                      </div>
                      <span className="text-[8px] font-black uppercase tracking-tighter">{step.title}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex-1 p-8 overflow-y-auto">
                <SectionHeader icon={steps[currentStep-1].icon} title={steps[currentStep-1].title} subtitle={steps[currentStep-1].subtitle} />
                {stepContent}
              </div>

              <div className="p-8 bg-gray-50/50 border-t border-gray-50 flex items-center justify-between">
                <button 
                  disabled={currentStep === 1}
                  onClick={() => setCurrentStep(prev => prev - 1)}
                  className="flex items-center gap-2 px-6 py-3 text-slate-400 font-black uppercase text-[9px] disabled:opacity-0"
                >
                  <ChevronLeft size={16} /> Anterior
                </button>
                <div className="flex gap-3">
                  {currentStep < 5 ? (
                    <button 
                      onClick={handleNext}
                      className="flex items-center gap-2 px-8 py-4 bg-slate-800 text-white rounded-2xl font-black italic uppercase text-[10px]"
                    >
                      Siguiente <ChevronRight size={16} />
                    </button>
                  ) : (
                    <button 
                      onClick={handleSubmit}
                      disabled={saving}
                      className="flex items-center gap-3 px-10 py-4 bg-brand-primary text-white rounded-2xl font-black italic uppercase text-[11px] shadow-lg shadow-brand-primary/20 disabled:opacity-50"
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