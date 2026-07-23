"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Building2, HardHat, Wifi, Laptop, Accessibility, FileCheck,
  Droplets, ShieldCheck, X, CheckCircle2, Info, AlertCircle,
  Settings, Zap, Maximize, Wind, Sun, ChevronLeft, ChevronRight, Loader2
} from "lucide-react";
import { supabase } from "@/app/lib/supabaseClient";
import { useAuth } from "@/context/AuthContext";
import { AlertModal } from "@/app/components/AlertModal";

// ==================== COMPONENTES DE UI REUTILIZABLES ====================
const CardContainer = ({ children }: { children: React.ReactNode }) => (
  <motion.div 
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-all"
  >
    {children}
  </motion.div>
);

const SectionHeader = ({ icon: Icon, title, subtitle }: { icon: React.ElementType; title: string; subtitle: string }) => (
  <div className="flex items-center gap-3 mb-5">
    <div className="h-8 w-8 rounded-xl bg-brand-primary/10 flex items-center justify-center text-brand-primary">
      <Icon size={18} />
    </div>
    <div>
      <h3 className="text-[10px] font-black text-slate-800 uppercase italic tracking-tight">{title}</h3>
      <p className="text-[8px] font-bold text-slate-400 uppercase tracking-widest">{subtitle}</p>
    </div>
  </div>
);

const DataRow = ({ label, value, status }: { label: string; value: string; status?: 'ok' | 'warn' | 'crit' }) => (
  <div className="flex justify-between items-center py-2 border-b border-gray-50 last:border-0">
    <span className="text-[8px] font-bold text-slate-400 uppercase tracking-widest">{label}</span>
    <span className={`text-[9px] font-black italic uppercase ${
      status === 'warn' ? 'text-amber-500' : status === 'crit' ? 'text-red-500' : 'text-slate-700'
    }`}>
      {value}
    </span>
  </div>
);

interface InfraestructuraProps {
  onNavigate: (section: string) => void;
}

// Componentes de formulario tipados correctamente
interface SelectFieldProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: string[];
}

const SelectField: React.FC<SelectFieldProps> = ({ label, value, onChange, options }) => (
  <div className="space-y-1.5">
    <label className="text-[7px] font-bold text-slate-400 uppercase ml-2 block">{label}</label>
    <select 
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="w-full p-1.5 rounded-xl bg-gray-50 border-none ring-1 ring-gray-100 text-[10px] font-bold outline-none focus:ring-2 focus:ring-brand-primary transition-all appearance-none"
    >
      <option value="">Seleccione...</option>
      {options.map((opt) => (
        <option key={opt} value={opt}>{opt}</option>
      ))}
    </select>
  </div>
);

interface TextAreaFieldProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
}

const TextAreaField: React.FC<TextAreaFieldProps> = ({ label, value, onChange, placeholder }) => (
  <div className="space-y-1.5">
    <label className="text-[7px] font-bold text-slate-400 uppercase ml-2 block">{label}</label>
    <textarea 
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      className="w-full p-1.5 rounded-xl bg-gray-50 border-none ring-1 ring-gray-100 text-[10px] font-bold min-h-20 outline-none focus:ring-2 focus:ring-brand-primary transition-all resize-vertical"
    />
  </div>
);

interface CheckboxGroupProps {
  label: string;
  options: string[];
  selected: string[];
  onChange: (selected: string[]) => void;
}

const CheckboxGroup: React.FC<CheckboxGroupProps> = ({ label, options, selected, onChange }) => {
  const toggleOption = (option: string) => {
    if (selected.includes(option)) {
      onChange(selected.filter(o => o !== option));
    } else {
      onChange([...selected, option]);
    }
  };

  return (
    <div className="space-y-2">
      <label className="text-[7px] font-bold text-slate-400 uppercase ml-2 block">{label}</label>
      <div className="flex flex-wrap gap-2">
        {options.map(opt => (
          <label key={opt} className="flex items-center gap-1.5 text-[9px] font-medium text-slate-700">
            <input
              type="checkbox"
              checked={selected.includes(opt)}
              onChange={() => toggleOption(opt)}
              className="rounded border-gray-300 text-brand-primary focus:ring-brand-primary w-3 h-3"
            />
            {opt}
          </label>
        ))}
      </div>
    </div>
  );
};

// Nuevos componentes para cantidades de sillas y mesas
interface NumberFieldProps {
  label: string;
  value: number;
  onChange: (value: number) => void;
  min?: number;
}

const NumberField: React.FC<NumberFieldProps> = ({ label, value, onChange, min = 0 }) => (
  <div className="space-y-1.5">
    <label className="text-[7px] font-bold text-slate-400 uppercase ml-2 block">{label}</label>
    <input
      type="number"
      min={min}
      value={value}
      onChange={(e) => onChange(parseInt(e.target.value) || 0)}
      className="w-full p-1.5 rounded-xl bg-gray-50 border-none ring-1 ring-gray-100 text-[10px] font-bold outline-none focus:ring-2 focus:ring-brand-primary transition-all"
    />
  </div>
);

// ==================== COMPONENTE PRINCIPAL ====================
export const Infraestructura = ({ onNavigate }: InfraestructuraProps) => {
  const { user } = useAuth();
  const [salaId, setSalaId] = useState<number | null>(null);
  const [noSala, setNoSala] = useState(false);
  const [cargandoInicial, setCargandoInicial] = useState(true);
  const [guardando, setGuardando] = useState(false);

  // Estado del formulario
  const [formData, setFormData] = useState({
    capacidadOptima: '',
    estadoEstructural: '',
    mobiliarioSuficiente: '',
    mobiliarioDesc: '',
    distribucionDebate: '',
    iluminacion: '',
    iluminacionDesc: '',
    ventilacion: '',
    ventilacionDesc: '',
    accesoInternet: '',
    tipoConexion: '',
    pantallasAudio: '',
    pantallasDesc: '',
    equiposFuncionales: '',
    equiposDesc: '',
    estadoHardware: '',
    hardwareDesc: '',
    rampasAcceso: '',
    senaletica: '',
    sanitarios: '',
    aguaPotable: '',
    identidadEstetica: '',
    seguridadCerraduras: ''
  });

  // Estados auxiliares para mobiliario (sillas, mesas, otros)
  const [sillasCount, setSillasCount] = useState<number>(0);
  const [mesasCount, setMesasCount] = useState<number>(0);
  const [otrosMobiliario, setOtrosMobiliario] = useState<string>('');

  // Estado auxiliar para checkboxes de equipos funcionales
  const [selectedEquipos, setSelectedEquipos] = useState<string[]>([]);

  const [showModal, setShowModal] = useState(false);
  const [currentStep, setCurrentStep] = useState(1);

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

  const closeModal = () => setModalState(prev => ({ ...prev, isOpen: false }));

  // ========== OCULTAR SIDEBAR CUANDO MODAL ESTÁ ABIERTO ==========
  useEffect(() => {
    if (showModal || modalState.isOpen) {
      document.body.classList.add('modal-open');
      // Estilo para ocultar el sidebar
      const style = document.createElement('style');
      style.id = 'modal-sidebar-hide';
      style.textContent = `
        .modal-open .sidebar,
        .modal-open [class*="sidebar"],
        .modal-open aside {
          display: none !important;
        }
        .modal-open .main-content,
        .modal-open [class*="main"] {
          margin-left: 0 !important;
          width: 100% !important;
        }
      `;
      if (!document.querySelector('#modal-sidebar-hide')) {
        document.head.appendChild(style);
      }
    } else {
      document.body.classList.remove('modal-open');
      const styleElement = document.querySelector('#modal-sidebar-hide');
      if (styleElement) styleElement.remove();
    }
    return () => {
      document.body.classList.remove('modal-open');
      const styleElement = document.querySelector('#modal-sidebar-hide');
      if (styleElement) styleElement.remove();
    };
  }, [showModal, modalState.isOpen]);

  const steps = [
    { title: "Espacio y Mobiliario", subtitle: "Condiciones Físicas", icon: Maximize },
    { title: "Conectividad y Hardware", subtitle: "Equipamiento Tecnológico", icon: Zap },
    { title: "Accesibilidad y Servicios", subtitle: "Infraestructura Complementaria", icon: ShieldCheck }
  ];

  // Opciones para los selects de accesibilidad
  const accesibilidadOptions = ['Excelente', 'Bueno', 'Regular', 'Deficiente', 'No aplica'];
  const seguridadOptions = ['Excelente', 'Bueno', 'Regular', 'Deficiente', 'No cuenta'];

  // Obtener id_sala del usuario
  useEffect(() => {
    if (!user?.id) return;
    const fetchSalaId = async () => {
      const { data, error } = await supabase
        .from('datos_sala_autogobierno')
        .select('id_sala')
        .eq('id_usuario', user.id)
        .maybeSingle();
      if (error) {
        console.error('Error obteniendo id_sala:', error);
        setCargandoInicial(false);
        return;
      }
      if (data) {
        setSalaId(data.id_sala);
        await cargarDiagnostico(data.id_sala);
      } else {
        setNoSala(true);
      }
      setCargandoInicial(false);
    };
    fetchSalaId();
  }, [user]);

  // Función para parsear mobiliario_desc y extraer sillas, mesas, otros
  const parseMobiliarioDesc = (desc: string) => {
    let sillas = 0, mesas = 0, otros = '';
    if (desc) {
      const sillasMatch = desc.match(/Sillas:\s*(\d+)/i);
      const mesasMatch = desc.match(/Mesas:\s*(\d+)/i);
      const otrosMatch = desc.match(/Otros:\s*(.*?)(?=,?\s*(?:Sillas|Mesas|$))/i);
      if (sillasMatch) sillas = parseInt(sillasMatch[1], 10);
      if (mesasMatch) mesas = parseInt(mesasMatch[1], 10);
      if (otrosMatch) otros = otrosMatch[1].trim();
    }
    return { sillas, mesas, otros };
  };

  // Cargar diagnóstico existente
  const cargarDiagnostico = async (idSala: number) => {
    const { data, error } = await supabase
      .from('infraestructura_sala')
      .select('*')
      .eq('id_sala', idSala)
      .maybeSingle();

    if (error) {
      console.error('Error cargando infraestructura:', error);
      return;
    }

    if (data) {
      const { sillas, mesas, otros } = parseMobiliarioDesc(data.mobiliario_desc || '');
      setSillasCount(sillas);
      setMesasCount(mesas);
      setOtrosMobiliario(otros);

      let equiposArray: string[] = [];
      if (data.equipos_funcionales && typeof data.equipos_funcionales === 'string') {
        equiposArray = data.equipos_funcionales.split(',').map((s: string) => s.trim()).filter((s: string) => s);
      }
      setSelectedEquipos(equiposArray);

      setFormData({
        capacidadOptima: data.capacidad_optima || '',
        estadoEstructural: data.estado_estructural || '',
        mobiliarioSuficiente: data.mobiliario_suficiente || '',
        mobiliarioDesc: data.mobiliario_desc || '',
        distribucionDebate: data.distribucion_debate || '',
        iluminacion: data.iluminacion || '',
        iluminacionDesc: data.iluminacion_desc || '',
        ventilacion: data.ventilacion || '',
        ventilacionDesc: data.ventilacion_desc || '',
        accesoInternet: data.acceso_internet || '',
        tipoConexion: data.tipo_conexion || '',
        pantallasAudio: data.pantallas_audio || '',
        pantallasDesc: data.pantallas_desc || '',
        equiposFuncionales: data.equipos_funcionales || '',
        equiposDesc: data.equipos_desc || '',
        estadoHardware: data.estado_hardware || '',
        hardwareDesc: data.hardware_desc || '',
        rampasAcceso: data.rampas_acceso || '',
        senaletica: data.senaletica || '',
        sanitarios: data.sanitarios || '',
        aguaPotable: data.agua_potable || '',
        identidadEstetica: data.identidad_estetica || '',
        seguridadCerraduras: data.seguridad_cerraduras || ''
      });
    }
  };

  const updateFormData = (key: string, value: string) => {
    setFormData(prev => ({ ...prev, [key]: value }));
  };

  const handleEquiposChange = (selected: string[]) => {
    setSelectedEquipos(selected);
    const joined = selected.join(', ');
    updateFormData('equiposFuncionales', joined);
  };

  const actualizarMobiliarioDesc = () => {
    let desc = `Sillas: ${sillasCount}, Mesas: ${mesasCount}`;
    if (otrosMobiliario.trim()) {
      desc += `, Otros: ${otrosMobiliario.trim()}`;
    }
    updateFormData('mobiliarioDesc', desc);
  };

  useEffect(() => {
    if (formData.mobiliarioSuficiente !== 'Sí') {
      actualizarMobiliarioDesc();
    }
  }, [sillasCount, mesasCount, otrosMobiliario, formData.mobiliarioSuficiente]);

  const guardarDiagnostico = async () => {
    if (!salaId || !user?.id) {
      showAlert('Datos insuficientes', 'Primero debe registrar los datos legales de la sala en la sección "Datos de identificación legal".', 'warning');
      return;
    }

    setGuardando(true);

    const payload = {
      id_sala: salaId,
      id_usuario: user.id,
      capacidad_optima: formData.capacidadOptima || null,
      estado_estructural: formData.estadoEstructural || null,
      mobiliario_suficiente: formData.mobiliarioSuficiente || null,
      mobiliario_desc: formData.mobiliarioDesc || null,
      distribucion_debate: formData.distribucionDebate || null,
      iluminacion: formData.iluminacion || null,
      iluminacion_desc: formData.iluminacionDesc || null,
      ventilacion: formData.ventilacion || null,
      ventilacion_desc: formData.ventilacionDesc || null,
      acceso_internet: formData.accesoInternet || null,
      tipo_conexion: formData.tipoConexion || null,
      pantallas_audio: formData.pantallasAudio || null,
      pantallas_desc: formData.pantallasDesc || null,
      equipos_funcionales: formData.equiposFuncionales || null,
      equipos_desc: formData.equiposDesc || null,
      estado_hardware: formData.estadoHardware || null,
      hardware_desc: formData.hardwareDesc || null,
      rampas_acceso: formData.rampasAcceso || null,
      senaletica: formData.senaletica || null,
      sanitarios: formData.sanitarios || null,
      agua_potable: formData.aguaPotable || null,
      identidad_estetica: formData.identidadEstetica || null,
      seguridad_cerraduras: formData.seguridadCerraduras || null
    };

    const { data: existing } = await supabase
      .from('infraestructura_sala')
      .select('id_infraestructura')
      .eq('id_sala', salaId)
      .maybeSingle();

    let error = null;
    if (existing) {
      const { error: updateError } = await supabase
        .from('infraestructura_sala')
        .update(payload)
        .eq('id_infraestructura', existing.id_infraestructura);
      error = updateError;
    } else {
      const { error: insertError } = await supabase
        .from('infraestructura_sala')
        .insert([payload]);
      error = insertError;
    }

    if (error) {
      console.error('Error guardando diagnóstico:', error);
      showAlert('Error', 'Ocurrió un error al guardar. Por favor, intenta nuevamente.', 'danger');
    } else {
      showAlert('Guardado exitoso', 'El diagnóstico de infraestructura se ha guardado correctamente.', 'success');
    }
    setGuardando(false);
    setShowModal(false);
  };





  

  // Renderizado de los pasos del modal
  const renderStepContent = () => {
    switch (currentStep) {
      case 1:
        return (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="space-y-4">
              <SelectField 
                label="Capacidad Óptima" 
                value={formData.capacidadOptima}
                onChange={(v: string) => updateFormData('capacidadOptima', v)}
                options={['Sí', 'No', 'Parcialmente']}
              />
              <SelectField 
                label="Estado Estructural" 
                value={formData.estadoEstructural}
                onChange={(v: string) => updateFormData('estadoEstructural', v)}
                options={['Excelente', 'Bueno', 'Regular', 'Malo', 'Crítico']}
              />
              <SelectField 
                label="Mobiliario Suficiente" 
                value={formData.mobiliarioSuficiente}
                onChange={(v: string) => updateFormData('mobiliarioSuficiente', v)}
                options={['Sí', 'No', 'Parcialmente']}
              />
              {formData.mobiliarioSuficiente && formData.mobiliarioSuficiente !== 'Sí' && (
                <div className="space-y-3 p-3 bg-gray-50 rounded-xl">
                  <NumberField 
                    label="Cantidad de sillas"
                    value={sillasCount}
                    onChange={setSillasCount}
                    min={0}
                  />
                  <NumberField 
                    label="Cantidad de mesas"
                    value={mesasCount}
                    onChange={setMesasCount}
                    min={0}
                  />
                  <TextAreaField 
                    label="Otros muebles (opcional)"
                    value={otrosMobiliario}
                    onChange={setOtrosMobiliario}
                    placeholder="Ej: pizarrón, estanterías, archivadores..."
                  />
                </div>
              )}
            </div>
            <div className="space-y-4">
              <SelectField 
                label="Distribución Debate" 
                value={formData.distribucionDebate}
                onChange={(v: string) => updateFormData('distribucionDebate', v)}
                options={['Óptima', 'Adecuada', 'Inadecuada']}
              />
              <SelectField 
                label="Iluminación" 
                value={formData.iluminacion}
                onChange={(v: string) => updateFormData('iluminacion', v)}
                options={['Excelente', 'Adecuada', 'Insuficiente', 'Deficiente']}
              />
              {formData.iluminacion && formData.iluminacion !== 'Excelente' && (
                <TextAreaField 
                  label="Descripción Iluminación"
                  value={formData.iluminacionDesc}
                  onChange={(v: string) => updateFormData('iluminacionDesc', v)}
                  placeholder="Tipo y estado de la iluminación"
                />
              )}
              <SelectField 
                label="Ventilación" 
                value={formData.ventilacion}
                onChange={(v: string) => updateFormData('ventilacion', v)}
                options={['Excelente', 'Adecuada', 'Insuficiente', 'Deficiente']}
              />
              {formData.ventilacion && formData.ventilacion !== 'Excelente' && (
                <TextAreaField 
                  label="Descripción Ventilación"
                  value={formData.ventilacionDesc}
                  onChange={(v: string) => updateFormData('ventilacionDesc', v)}
                  placeholder="Tipo y estado de la ventilación"
                />
              )}
            </div>
          </div>
        );
      case 2:
        return (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="space-y-4">
              <SelectField 
                label="Acceso Internet" 
                value={formData.accesoInternet}
                onChange={(v: string) => updateFormData('accesoInternet', v)}
                options={['Estable', 'Intermitente', 'Inestable', 'No disponible']}
              />
              {formData.accesoInternet && formData.accesoInternet !== 'No disponible' && (
                <SelectField 
                  label="Tipo Conexión" 
                  value={formData.tipoConexion}
                  onChange={(v: string) => updateFormData('tipoConexion', v)}
                  options={['Fibra Óptica', 'ADSL', 'Satelital', 'Móvil 4G/5G']}
                />
              )}
              
              <SelectField 
                label="Pantallas/Audio" 
                value={formData.pantallasAudio}
                onChange={(v: string) => updateFormData('pantallasAudio', v)}
                options={['Sí', 'No']}
              />
              {formData.pantallasAudio === 'Sí' && (
                <TextAreaField 
                  label="Indique cuáles pantallas/audio"
                  value={formData.pantallasDesc}
                  onChange={(v: string) => updateFormData('pantallasDesc', v)}
                  placeholder="Ejemplo: Proyector, pantalla 55'', equipo de sonido, parlantes, etc."
                />
              )}
            </div>
            <div className="space-y-4">
              <CheckboxGroup
                label="Equipos funcionales disponibles"
                options={['Computadora', 'Monitor', 'Teclado y Mouse', 'Impresora', 'UPS']}
                selected={selectedEquipos}
                onChange={handleEquiposChange}
              />
              <TextAreaField 
                label="Observaciones de equipos"
                value={formData.equiposDesc}
                onChange={(v: string) => updateFormData('equiposDesc', v)}
                placeholder="Cantidad, estado, u otros detalles adicionales"
              />
              <SelectField 
                label="Estado Hardware" 
                value={formData.estadoHardware}
                onChange={(v: string) => updateFormData('estadoHardware', v)}
                options={['Excelente', 'Bueno', 'Regular', 'Malo']}
              />
              {formData.estadoHardware && formData.estadoHardware !== 'Excelente' && (
                <TextAreaField 
                  label="Descripción Hardware"
                  value={formData.hardwareDesc}
                  onChange={(v: string) => updateFormData('hardwareDesc', v)}
                  placeholder="Problemas específicos del hardware"
                />
              )}
            </div>
          </div>
        );
      case 3:
        return (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="space-y-4">
              <SelectField 
                label="Rampas/Acceso"
                value={formData.rampasAcceso}
                onChange={(v: string) => updateFormData('rampasAcceso', v)}
                options={accesibilidadOptions}
              />
              <SelectField 
                label="Señalética"
                value={formData.senaletica}
                onChange={(v: string) => updateFormData('senaletica', v)}
                options={accesibilidadOptions}
              />
              <SelectField 
                label="Sanitarios"
                value={formData.sanitarios}
                onChange={(v: string) => updateFormData('sanitarios', v)}
                options={accesibilidadOptions}
              />
            </div>
            <div className="space-y-4">
              <SelectField 
                label="Agua Potable"
                value={formData.aguaPotable}
                onChange={(v: string) => updateFormData('aguaPotable', v)}
                options={accesibilidadOptions}
              />
              <SelectField 
                label="Identidad Estética"
                value={formData.identidadEstetica}
                onChange={(v: string) => updateFormData('identidadEstetica', v)}
                options={['Excelente', 'Bueno', 'Regular', 'Deficiente', 'No definida']}
              />
              <SelectField 
                label="Seguridad/Cerraduras"
                value={formData.seguridadCerraduras}
                onChange={(v: string) => updateFormData('seguridadCerraduras', v)}
                options={seguridadOptions}
              />
            </div>
          </div>
        );
      default:
        return null;
    }
  };

  if (cargandoInicial) {
    return (
      <div className="flex justify-center items-center p-8">
        <Loader2 className="animate-spin text-brand-primary" size={24} />
      </div>
    );
  }

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
    <div className="space-y-6 p-3 md:p-0">
      {/* HEADER */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-gray-100 shadow-sm">
        <div>
          <h2 className="text-base font-black text-slate-800 italic uppercase tracking-tighter flex items-center gap-2">
            <Building2 className="h-5 w-5 text-brand-primary" /> Infraestructura
          </h2>
          <p className="text-[8px] text-slate-400 font-bold uppercase tracking-[0.2em] mt-1">
            Espacio Físico y Condiciones Operativas de la Sala
          </p>
        </div>
        <button 
          onClick={() => {
            setShowModal(true);
            setCurrentStep(1);
          }}
          className="px-6 py-3 bg-brand-primary text-white rounded-xl text-[8px] font-black italic uppercase tracking-[0.15em] hover:bg-brand-primary transition-all shadow-xl shadow-slate-200"
        >
          Nuevo Levantamiento
        </button>
      </div>

      {/* Cards de resumen con datos reales */}
      {salaId ? (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          <CardContainer>
            <SectionHeader icon={Maximize} title="Espacio y Mobiliario" subtitle="Dimensiones y Comodidad" />
            <div className="space-y-0.5">
              <DataRow label="Capacidad Óptima" value={formData.capacidadOptima || '—'} />
              <DataRow label="Estado Estructural" value={formData.estadoEstructural || '—'} status={formData.estadoEstructural === 'Regular' || formData.estadoEstructural === 'Malo' ? 'warn' : undefined} />
              <DataRow label="Mobiliario Suficiente" value={formData.mobiliarioSuficiente || '—'} />
              <DataRow label="Detalle Mobiliario" value={formData.mobiliarioDesc || '—'} />
              <DataRow label="Distribución Debate" value={formData.distribucionDebate || '—'} />
              <DataRow label="Iluminación" value={formData.iluminacion || '—'} />
              <DataRow label="Ventilación" value={formData.ventilacion || '—'} />
            </div>
          </CardContainer>

          <CardContainer>
            <SectionHeader icon={Zap} title="Conectividad y Hardware" subtitle="Equipamiento Tecnológico" />
            <div className="space-y-0.5">
              <DataRow label="Acceso Internet" value={formData.accesoInternet || '—'} />
              <DataRow label="Tipo Conexión" value={formData.tipoConexion || '—'} />
              <DataRow label="Pantallas/Audio" value={formData.pantallasAudio === 'Sí' ? `Sí: ${formData.pantallasDesc?.substring(0, 30) || ''}${formData.pantallasDesc?.length > 30 ? '…' : ''}` : (formData.pantallasAudio || '—')} />
              <DataRow label="Equipos Funcionales" value={formData.equiposFuncionales || '—'} />
              <DataRow label="Estado Hardware" value={formData.estadoHardware || '—'} />
            </div>
          </CardContainer>

          <CardContainer>
            <SectionHeader icon={ShieldCheck} title="Gestión y Servicios" subtitle="Mantenimiento y Seguridad" />
            <div className="space-y-0.5">
              <DataRow label="Rampas/Acceso" value={formData.rampasAcceso || '—'} />
              <DataRow label="Señalética" value={formData.senaletica || '—'} />
              <DataRow label="Sanitarios" value={formData.sanitarios || '—'} />
              <DataRow label="Agua Potable" value={formData.aguaPotable || '—'} />
              <DataRow label="Identidad Estética" value={formData.identidadEstetica || '—'} />
              <DataRow label="Seguridad/Cerraduras" value={formData.seguridadCerraduras || '—'} />
            </div>
          </CardContainer>
        </div>
      ) : (
        <div className="bg-amber-50 border border-amber-100 rounded-xl p-4 text-center">
          <p className="text-[10px] font-bold text-amber-700">
            Primero debe registrar los datos legales de la sala en "Datos de identificación legal".
          </p>
        </div>
      )}

      {/* MODAL DE 3 PASOS (sin reducción - tamaños originales) */}
      <AnimatePresence>
  {showModal && salaId && (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <motion.div 
        initial={{ opacity: 0 }} 
        animate={{ opacity: 1 }} 
        exit={{ opacity: 0 }}
        onClick={() => setShowModal(false)}
        className="absolute inset-0 bg-slate-900/60 backdrop-blur-md" 
      />
      <motion.div 
        initial={{ scale: 0.9, opacity: 0, y: 20 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.9, opacity: 0, y: 20 }}
        className="relative w-full max-w-2xl h-[550px] bg-white rounded-3xl shadow-2xl overflow-hidden flex flex-col"
      >
        {/* HEADER */}
        <div className="p-5 border-b border-gray-50 flex justify-between items-center bg-gray-50/50 shrink-0">
          <div>
            <h4 className="text-lg font-black text-slate-800 italic uppercase tracking-tighter">
              Formulario de Caracterización
            </h4>
            <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">
              Paso {currentStep} de 3
            </p>
          </div>
          <button 
            onClick={() => setShowModal(false)} 
            className="p-2 bg-white rounded-xl shadow-sm hover:text-red-500 transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* STEPS INDICATOR */}
        <div className="px-5 py-3 border-b border-gray-50 bg-linear-to-r from-gray-50/50 to-white/50 shrink-0">
          <div className="flex items-center justify-center gap-3">
            {steps.map((step, index) => (
              <div key={index} className="flex items-center gap-2">
                <div className={`w-8 h-8 rounded-xl flex items-center justify-center text-[11px] font-black transition-all ${
                  currentStep > index + 1 
                    ? 'bg-brand-primary text-white' 
                    : currentStep === index + 1 
                      ? 'bg-brand-primary/20 text-brand-primary ring-2 ring-brand-primary' 
                      : 'bg-gray-100 text-gray-600'
                }`}>
                  {currentStep > index + 1 ? '✓' : index + 1}
                </div>
                <span className="text-[9px] font-bold text-slate-700 uppercase tracking-tight">
                  {step.title}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* CONTENT (Clave: h-[380px] y flex-1 mantienen la zona interna idéntica. Si el formulario es más largo, meterá scroll interno automáticamente sin deformar la modal) */}
        <div className="flex-1 h-[380px] p-6 overflow-y-auto">
          <SectionHeader 
            icon={steps[currentStep - 1].icon}
            title={steps[currentStep - 1].title}
            subtitle={steps[currentStep - 1].subtitle}
          />
          <div className="mt-4">
            {renderStepContent()}
          </div>
        </div>

        {/* FOOTER */}
        <div className="p-5 bg-gray-50/50 border-t border-gray-50 flex items-center justify-between shrink-0">
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => setCurrentStep(prev => Math.max(prev - 1, 1))}
            disabled={currentStep === 1}
            className="flex items-center gap-2 px-4 py-2 text-slate-500 font-black uppercase tracking-wider text-[9px] disabled:opacity-50 disabled:pointer-events-none hover:text-slate-700 transition-all"
          >
            <ChevronLeft size={14} />
            Anterior
          </motion.button>

          <div className="flex gap-2.5">
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => setCurrentStep(prev => Math.min(prev + 1, 3))}
              disabled={currentStep === 3}
              className="flex items-center gap-2 px-5 py-2.5 bg-slate-100 text-slate-700 rounded-xl font-black italic uppercase tracking-wider text-[10px] hover:bg-slate-200 transition-all disabled:opacity-50 disabled:pointer-events-none shadow-sm"
            >
              Siguiente
              <ChevronRight size={14} />
            </motion.button>

            {currentStep === 3 && (
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={guardarDiagnostico}
                disabled={guardando}
                className="flex items-center gap-2 px-6 py-2.5 bg-brand-primary text-white rounded-xl font-black italic uppercase tracking-widest text-[10px] shadow-lg shadow-brand-primary/20 hover:shadow-xl transition-all disabled:opacity-50"
              >
                {guardando ? <Loader2 className="animate-spin" size={16} /> : <CheckCircle2 size={16} />}
                Guardar Diagnóstico
              </motion.button>
            )}
          </div>
        </div>
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