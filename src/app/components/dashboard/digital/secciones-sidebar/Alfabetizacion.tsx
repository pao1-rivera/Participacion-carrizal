"use client";

import React, { useState, useEffect, useMemo, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  User, MapPin, Smartphone, Laptop, Award,
  ChevronLeft, ChevronRight, X, CheckCircle2, 
  Users, Loader2, Search, Eye, HelpCircle, Briefcase, Wifi, TrendingUp, AlertTriangle, ShieldAlert
} from "lucide-react";
import { cn } from "@/app/lib/utils";
import { supabase } from "@/app/lib/supabaseClient";
import { useAuth } from "@/context/AuthContext";

// ==================== CONSTANTES ====================
interface Consejo {
  id_consejo: number;
  nombre_consejo: string;
}

interface DigitalData {
  id_registro: number;
  id_comuna: number;
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
  created_at?: string;
  updated_at?: string;
}

// ==================== COMPONENTES UI ====================
const CardContainer = ({ children }: { children: React.ReactNode }) => (
  <motion.div 
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    className="bg-white p-6 rounded-[2.5rem] border border-gray-100 shadow-sm hover:shadow-md transition-all"
  >
    {children}
  </motion.div>
);

const SectionHeader = ({ icon: Icon, title, subtitle }: any) => (
  <div className="flex items-center gap-3 mb-4">
    <div className="h-10 w-10 rounded-2xl bg-brand-primary/10 flex items-center justify-center text-brand-primary">
      <Icon size={20} />
    </div>
    <div>
      <h3 className="text-xs font-black text-slate-800 italic uppercase tracking-tight">{title}</h3>
      <p className="text-[8px] font-bold text-slate-400 uppercase tracking-widest">{subtitle}</p>
    </div>
  </div>
);

const DetailItem = ({ label, value }: { label: string; value: any }) => (
  <div className="border-b border-gray-100 pb-2">
    <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">{label}</p>
    <p className="text-xs font-medium text-slate-700 mt-0.5">
      {Array.isArray(value) ? value.join(", ") : value || '—'}
    </p>
  </div>
);

// ==================== COMPONENTE PRINCIPAL ====================
export const Alfabetizacion = () => {
  const { user, isLoading: authLoading } = useAuth();
  
  const [consejos, setConsejos] = useState<Consejo[]>([]);
  const [registros, setRegistros] = useState<DigitalData[]>([]);
  const [loadingData, setLoadingData] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedPerson, setSelectedPerson] = useState<DigitalData | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isAuthorized, setIsAuthorized] = useState<boolean>(true);
  
  // ==================== MÉTRICAS ====================
  const totalRegistros = registros.length;
  const sinInternet = registros.filter(r => r.posee_internet === 'NO').length;
  const nivelIntermedioAvanzado = registros.filter(r => 
    r.nivel_tecnologico?.startsWith("INTERMEDIO") || r.nivel_tecnologico?.startsWith("AVANZADO")
  ).length;
  const interesadosTalleres = registros.filter(r => r.interes_capacitacion === "SI").length;

  // Filtro reactivo local para la barra de búsqueda
  const filteredRegistros = useMemo(() => {
    const term = searchTerm.toLowerCase().trim();
    if (!term) return registros;
    return registros.filter(r => 
      (r.nombre?.toLowerCase() || "").includes(term) || 
      (r.apellido?.toLowerCase() || "").includes(term) || 
      (r.cedula || "").includes(term)
    );
  }, [registros, searchTerm]);

  const getConsejoName = useCallback((consejoId: number | null) => {
    if (!consejoId) return 'No asignado';
    const consejo = consejos.find(c => c.id_consejo === consejoId);
    return consejo?.nombre_consejo || 'Desconocido';
  }, [consejos]);

  // CONTROL DE ACCESO Y CARGA DE DATOS
  useEffect(() => {
    // Esperar a que el AuthContext termine de verificar la sesión
    if (authLoading) return;

    // VALIDACIÓN DE SEGURIDAD INTERNA:
    // Según tu diseño de AuthContext, el rol se almacena en user.rolNombre
    if (!user || user.rolNombre !== "director_digitalizacion") {
      setIsAuthorized(false);
      setLoadingData(false);
      return;
    }

    const fetchDatosPermitidos = async () => {
      try {
        setLoadingData(true);
        setErrorMessage(null);
        setIsAuthorized(true);

        // 1. Obtener los consejos comunales para traducir IDs a Nombres
        const { data: consejosData, error: ccError } = await supabase
          .from('datos_consejo_comunal')
          .select('id_consejo, nombre_consejo');
        
        if (ccError) throw ccError;
        setConsejos(consejosData || []);

        // 2. Intentar descargar la tabla completa
        const { data: registrosData, error: regError } = await supabase
          .from('analfabetismo_digital')
          .select('*')
          .order('created_at', { ascending: false });
        
        if (regError) throw regError;
        setRegistros(registrosData || []);

      } catch (error: any) {
        console.error("Error en consulta Supabase:", error);
        setErrorMessage("Error de políticas RLS o pérdida de conexión con Supabase.");
      } finally {
        setLoadingData(false);
      }
    };

    fetchDatosPermitidos();
  }, [user, authLoading]);

  // 1. Vista de Carga
  if (authLoading || loadingData) {
    return (
      <div className="flex flex-col items-center justify-center p-12 min-h-75 gap-3">
        <Loader2 className="animate-spin text-brand-primary h-8 w-8" />
        <p className="text-xs text-slate-400 font-medium uppercase tracking-wider">Validando permisos del Directorio...</p>
      </div>
    );
  }

  // 2. Vista de Error por Falta de Permisos (Bloqueo de seguridad Frontend)
  if (!isAuthorized) {
    return (
      <div className="max-w-xl mx-auto p-8 bg-amber-50 rounded-[2.5rem] border border-amber-100 flex flex-col items-center text-center my-12 gap-4 shadow-sm">
        <div className="h-14 w-14 bg-amber-500/10 rounded-2xl flex items-center justify-center text-amber-600">
          <ShieldAlert size={32} />
        </div>
        <h4 className="text-sm font-black text-slate-800 uppercase italic">Acceso Restringido</h4>
        <p className="text-xs text-slate-600 font-medium leading-relaxed">
          Tu usuario actual ({user?.rolNombre || 'Sin Rol'}) no posee los privilegios requeridos. 
          Solo el <span className="font-bold text-slate-800">Director de Digitalización</span> puede auditar el diagnóstico de analfabetismo digital.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-7xl mx-auto p-4">
      
      {errorMessage && (
        <div className="p-4 bg-red-50 text-red-600 rounded-2xl border border-red-100 flex items-center gap-2 text-xs font-bold uppercase">
          <AlertTriangle size={16} />
          {errorMessage} (Verifica las políticas RLS en tu consola de Supabase)
        </div>
      )}

      {/* SECCIÓN KPI METRICAS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-3xl border border-gray-100 flex items-center justify-between shadow-sm">
          <div>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Total Personal</p>
            <h4 className="text-2xl font-black text-slate-800 mt-1">{totalRegistros}</h4>
          </div>
          <div className="h-12 w-12 rounded-2xl bg-brand-primary/10 flex items-center justify-center text-brand-primary"><Users size={24} /></div>
        </div>
        
        <div className="bg-white p-4 rounded-3xl border border-gray-100 flex items-center justify-between shadow-sm">
          <div>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Sin Acceso a Internet</p>
            <h4 className="text-2xl font-black text-slate-800 mt-1">{sinInternet}</h4>
          </div>
          <div className="h-12 w-12 rounded-2xl bg-red-50 flex items-center justify-center text-brand-primary"><Wifi size={24} /></div>
        </div>

        <div className="bg-white p-4 rounded-3xl border border-gray-100 flex items-center justify-between shadow-sm">
          <div>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Nivel Intermedio o Avanzado</p>
            <h4 className="text-2xl font-black text-slate-800 mt-1">{nivelIntermedioAvanzado}</h4>
          </div>
          <div className="h-12 w-12 rounded-2xl bg-blue-50 flex items-center justify-center text-brand-primary"><TrendingUp size={24} /></div>
        </div>

        <div className="bg-white p-4 rounded-3xl border border-gray-100 flex items-center justify-between shadow-sm">
          <div>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Aptos para Capacitación</p>
            <h4 className="text-2xl font-black text-slate-800 mt-1">{interesadosTalleres}</h4>
          </div>
          <div className="h-12 w-12 rounded-2xl bg-emerald-50 flex items-center justify-center text-brand-primary"><Award size={24} /></div>
        </div>
      </div>

      <CardContainer>
        <SectionHeader icon={Laptop} title="Analfabetismo y Apropiación Digital" subtitle="Evaluación de destrezas tecnológicas" />

        {/* TABLA PRINCIPAL */}
        <div className="space-y-4">
          <div className="relative">
            <Search className="absolute left-4 top-3 h-4 w-4 text-slate-400" />
            <input 
              type="text" 
              placeholder="Buscar por nombre, apellido o cédula..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-11 p-2.5 rounded-2xl bg-gray-50 border-none ring-1 ring-gray-100 text-xs font-bold outline-none focus:ring-2 focus:ring-brand-primary transition-all"
            />
          </div>

          {filteredRegistros.length === 0 ? (
            <div className="text-center py-12 text-xs italic text-slate-400">
              No se encontraron diagnósticos registrados. Si estás logueado como Director, verifica que tu política RLS permita lecturas globales.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-gray-100">
                    <th className="p-3 text-[9px] font-black uppercase tracking-widest text-slate-400">Ciudadano</th>
                    <th className="p-3 text-[9px] font-black uppercase tracking-widest text-slate-400">Cédula</th>
                    <th className="p-3 text-[9px] font-black uppercase tracking-widest text-slate-400">Consejo Comunal</th>
                    <th className="p-3 text-[9px] font-black uppercase tracking-widest text-slate-400">Nivel Digital</th>
                    <th className="p-3 text-[9px] font-black uppercase tracking-widest text-slate-400 text-center">Acción</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredRegistros.map((reg) => (
                    <tr key={reg.id_registro} className="border-b border-gray-50 hover:bg-gray-50/50 transition-colors">
                      <td className="p-3 text-xs font-bold text-slate-700">{reg.nombre} {reg.apellido}</td>
                      <td className="p-3 text-xs font-bold text-slate-500">{reg.tipo_cedula}-{reg.cedula}</td>
                      <td className="p-3 text-xs font-bold text-slate-500 truncate max-w-45">{getConsejoName(reg.id_consejo)}</td>
                      <td className="p-3 text-xs">
                        <span className={cn(
                          "px-2.5 py-1 rounded-full text-[9px] font-black uppercase",
                          reg.nivel_tecnologico?.startsWith("NULO") && "bg-red-50 text-red-500",
                          reg.nivel_tecnologico?.startsWith("BÁSICO") && "bg-amber-50 text-amber-600",
                          reg.nivel_tecnologico?.startsWith("INTERMEDIO") && "bg-blue-50 text-blue-500",
                          reg.nivel_tecnologico?.startsWith("AVANZADO") && "bg-emerald-50 text-emerald-500"
                        )}>
                          {reg.nivel_tecnologico ? reg.nivel_tecnologico.split(" ")[0] : "NULO"}
                        </span>
                      </td>
                      <td className="p-3 text-center">
                        <button 
                          onClick={() => setSelectedPerson(reg)}
                          className="p-1.5 rounded-xl bg-gray-50 hover:bg-brand-primary/10 text-slate-400 hover:text-brand-primary transition-all"
                        >
                          <Eye size={14} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </CardContainer>

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
                <button onClick={() => setSelectedPerson(null)} className="p-1.5 rounded-xl bg-white/10 hover:bg-white/20 transition-colors"><X size={14} /></button>
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
                <div className="md:col-span-2 bg-gray-50 p-3 rounded-2xl border border-gray-100">
                  <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">¿Interesado en capacitarse de forma gratuita?</p>
                  <p className={cn(
                    "text-xs font-black uppercase mt-1",
                    selectedPerson.interes_capacitacion === 'SI' ? "text-emerald-600" : "text-slate-600"
                  )}>{selectedPerson.interes_capacitacion}</p>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};