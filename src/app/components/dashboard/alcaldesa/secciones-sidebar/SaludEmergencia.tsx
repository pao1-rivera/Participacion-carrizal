'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { 
  Activity, 
  Heart, 
  ShieldAlert, 
  Eye, 
  Users,
  PhoneCall, 
  MapPin, 
  Plus, 
  Search, 
  Filter,
  AlertCircle,
  Truck,
  Stethoscope,
  TrendingUp,
  Clock,
  ArrowRight,
  Wifi,
  Award,
  Laptop,
  HelpCircle,
  Loader2
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/app/lib/utils';
import { supabase } from '@/app/lib/supabaseClient';
import { useAuth } from '@/context/AuthContext';

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

interface Consejo {
  id_consejo: number;
  nombre_consejo: string;
}

export const SaludEmergencias = () => {
  const { user } = useAuth();
  const [registros, setRegistros] = useState<DigitalData[]>([]);
  const [consejos, setConsejos] = useState<Consejo[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedPerson, setSelectedPerson] = useState<DigitalData | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 8;

  // Cargar datos de alfabetización digital
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        // Obtener consejos comunales
        const { data: consejosData, error: ccError } = await supabase
          .from('datos_consejo_comunal')
          .select('id_consejo, nombre_consejo');
        
        if (!ccError && consejosData) {
          setConsejos(consejosData);
        }

        // Obtener registros de alfabetismo digital
        const { data: registrosData, error: regError } = await supabase
          .from('analfabetismo_digital')
          .select('*')
          .order('created_at', { ascending: false });
        
        if (!regError && registrosData) {
          setRegistros(registrosData);
        }
      } catch (error) {
        console.error('Error cargando datos:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  // Métricas dinámicas de Alfabetización Digital
  const totalRegistros = registros.length;
  const sinInternet = registros.filter(r => r.posee_internet === 'NO').length;
  const nivelIntermedioAvanzado = registros.filter(r => 
    r.nivel_tecnologico?.startsWith("INTERMEDIO") || r.nivel_tecnologico?.startsWith("AVANZADO")
  ).length;
  const interesadosTalleres = registros.filter(r => r.interes_capacitacion === "SI").length;
  const porcentajeInternet = totalRegistros > 0 ? Math.round(((totalRegistros - sinInternet) / totalRegistros) * 100) : 0;

  // Filtrar registros por búsqueda
  const filteredRegistros = useMemo(() => {
    const term = searchTerm.toLowerCase().trim();
    if (!term) return registros;
    return registros.filter(r => 
      (r.nombre?.toLowerCase() || "").includes(term) || 
      (r.apellido?.toLowerCase() || "").includes(term) || 
      (r.cedula || "").includes(term)
    );
  }, [registros, searchTerm]);

  const totalPages = Math.ceil(filteredRegistros.length / itemsPerPage);
  const currentRegistros = filteredRegistros.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  const getConsejoName = (consejoId: number | null) => {
    if (!consejoId) return 'No asignado';
    const consejo = consejos.find(c => c.id_consejo === consejoId);
    return consejo?.nombre_consejo || 'Desconocido';
  };

  const getNivelColor = (nivel: string) => {
    if (nivel?.startsWith("NULO")) return "bg-red-50 text-red-500";
    if (nivel?.startsWith("BÁSICO")) return "bg-amber-50 text-amber-600";
    if (nivel?.startsWith("INTERMEDIO")) return "bg-blue-50 text-blue-500";
    if (nivel?.startsWith("AVANZADO")) return "bg-emerald-50 text-emerald-600";
    return "bg-gray-50 text-gray-500";
  };

  const getNivelLabel = (nivel: string) => {
    if (nivel?.startsWith("NULO")) return "NULO";
    if (nivel?.startsWith("BÁSICO")) return "BÁSICO";
    if (nivel?.startsWith("INTERMEDIO")) return "INTERMEDIO";
    if (nivel?.startsWith("AVANZADO")) return "AVANZADO";
    return "NULO";
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center p-12 min-h-75 gap-3">
        <Loader2 className="animate-spin text-brand-primary h-8 w-8" />
        <p className="text-xs text-slate-400 font-medium uppercase tracking-wider">Cargando datos del diagnóstico digital...</p>
      </div>
    );
  }

  return (
    <motion.div 
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      className="space-y-10 pb-12"
    >
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h2 className="text-2xl font-black text-slate-900 uppercase tracking-tighter italic leading-none">Alfabetización Digital</h2>
          <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mt-3">Diagnóstico y Caracterización Tecnológica de Ciudadanos</p>
        </div>
        <div className="flex gap-3">
           <button className="flex items-center gap-3 px-8 py-4 bg-brand-primary text-white rounded-[2rem] text-[11px] font-black uppercase tracking-widest shadow-2xl shadow-brand-primary/20 hover:scale-105 active:scale-95 transition-all">
              <Plus size={20} /> Nuevo Registro
           </button>
        </div>
      </div>

      {/* Métricas de Alfabetización Digital */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
         <MetricBox 
           label="Total Personal" 
           value={totalRegistros.toString()} 
           sub="Personas caracterizadas" 
           icon={Users} 
           color="text-brand-primary" 
         />
         <MetricBox 
           label="Sin Acceso a Internet" 
           value={sinInternet.toString()} 
           sub={`${porcentajeInternet}% tienen conectividad`} 
           icon={Wifi} 
           color="text-rose-500" 
         />
         <MetricBox 
           label="Nivel Digital Intermedio/Avanzado" 
           value={nivelIntermedioAvanzado.toString()} 
           sub="Dominio tecnológico alto" 
           icon={TrendingUp} 
           color="text-emerald-500" 
         />
         <MetricBox 
           label="Aptos para Capacitación" 
           value={interesadosTalleres.toString()} 
           sub="Interesados en talleres" 
           icon={Award} 
           color="text-amber-500" 
         />
      </div>

      {/* Diagnóstico Digital - Tabla de Ciudadanos en Blanco */}
      <div className="bg-white rounded-[4rem] border border-slate-100 shadow-xl overflow-hidden relative">
        <div className="p-10">
          <div className="flex items-center justify-between mb-8 flex-wrap gap-4">
            <div>
              <h3 className="text-xl font-black italic uppercase tracking-tighter text-brand-primary leading-none">Diagnóstico de Alfabetización Digital</h3>
              <p className="text-[10px] text-slate-400 font-bold uppercase tracking-[0.3em] mt-3">Caracterización de ciudadanos</p>
            </div>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
              <input 
                type="text" 
                placeholder="Buscar por nombre, cédula..." 
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9 pr-4 py-2 bg-gray-50 border border-slate-200 rounded-xl text-[10px] font-bold uppercase tracking-widest outline-none focus:ring-2 focus:ring-brand-primary/50 w-48 focus:w-56 transition-all text-slate-700 placeholder:text-slate-400"
              />
            </div>
          </div>

          {/* Tabla de Ciudadanos */}
          <div className="space-y-3">
            {currentRegistros.length === 0 ? (
              <div className="text-center py-12 text-slate-400">
                <Users className="mx-auto h-12 w-12 mb-4 opacity-30" />
                <p className="text-sm font-bold">No hay ciudadanos registrados</p>
                <p className="text-[10px] mt-1">Comienza registrando un nuevo ciudadano</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-4">
                {currentRegistros.map((persona) => (
                  <div 
                    key={persona.id_registro}
                    onClick={() => setSelectedPerson(persona)}
                    className="flex items-center justify-between p-5 bg-white border border-slate-100 rounded-2xl hover:shadow-md transition-all cursor-pointer group"
                  >
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2 flex-wrap">
                        <h4 className="text-sm font-black text-slate-900 uppercase italic">{persona.nombre} {persona.apellido}</h4>
                        <span className={cn("px-2.5 py-1 rounded-lg text-[8px] font-black uppercase", getNivelColor(persona.nivel_tecnologico))}>
                          {getNivelLabel(persona.nivel_tecnologico)}
                        </span>
                        {persona.posee_internet === 'NO' && (
                          <span className="px-2.5 py-1 bg-rose-50 text-rose-500 rounded-lg text-[8px] font-black uppercase">
                            Sin Internet
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-6 text-[10px] text-slate-500">
                        <span className="font-mono">CI: {persona.tipo_cedula}-{persona.cedula}</span>
                        <span>{persona.edad} años</span>
                        <span>{persona.genero}</span>
                        <div className="flex items-center gap-1.5">
                          <MapPin size={10} />
                          <span className="font-bold uppercase tracking-tight">{getConsejoName(persona.id_consejo)}</span>
                        </div>
                      </div>
                    </div>
                    <button className="p-2.5 rounded-xl bg-gray-50 text-slate-400 group-hover:bg-brand-primary group-hover:text-white transition-all">
                      <Eye size={16} />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Paginación */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between mt-8 pt-6 border-t border-slate-100">
              <p className="text-[9px] font-bold text-slate-400">
                Mostrando {((currentPage - 1) * itemsPerPage) + 1} - {Math.min(currentPage * itemsPerPage, filteredRegistros.length)} de {filteredRegistros.length}
              </p>
              <div className="flex gap-2">
                <button 
                  onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                  className="px-4 py-2 bg-white border border-slate-200 rounded-xl text-[9px] font-black uppercase tracking-widest disabled:opacity-40 hover:bg-gray-50 transition-all"
                >
                  Anterior
                </button>
                <button 
                  onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                  disabled={currentPage === totalPages}
                  className="px-4 py-2 bg-white border border-slate-200 rounded-xl text-[9px] font-black uppercase tracking-widest disabled:opacity-40 hover:bg-gray-50 transition-all"
                >
                  Siguiente
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Modal de Detalle del Ciudadano */}
      <AnimatePresence>
        {selectedPerson && (
          <div className="fixed inset-0 z-100 flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setSelectedPerson(null)} className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" />
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="relative w-full max-w-2xl bg-white rounded-3xl shadow-2xl overflow-hidden max-h-[85vh] flex flex-col">
              <div className="p-4 border-b border-gray-50 flex items-center justify-between bg-brand-primary text-white">
                <div className="flex items-center gap-2">
                  <HelpCircle size={18} />
                  <h4 className="text-xs font-black uppercase tracking-wider">Ficha de Caracterización Digital</h4>
                </div>
                <button onClick={() => setSelectedPerson(null)} className="p-1.5 rounded-xl bg-white/10 hover:bg-white/20 transition-colors"><XCircle size={16} /></button>
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
    </motion.div>
  );
};

const MetricBox = ({ label, value, sub, icon: Icon, color }: any) => (
  <div className="bg-white p-8 rounded-[3rem] border border-slate-100 shadow-sm hover:shadow-xl transition-all group overflow-hidden relative">
     <div className="relative z-10 flex flex-col items-center text-center">
        <div className={cn("inline-flex p-4 rounded-2xl bg-slate-50 shadow-sm mb-6 group-hover:scale-110 transition-transform", color)}>
           <Icon size={24} strokeWidth={2} />
        </div>
        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">{label}</p>
        <h4 className="text-3xl font-black text-slate-900 italic tracking-tighter mb-1">{value}</h4>
        <p className="text-[9px] text-slate-500 font-bold uppercase tracking-tight italic opacity-60">{sub}</p>
     </div>
     <div className="absolute -bottom-10 -right-10 w-24 h-24 bg-slate-50 rounded-full blur-xl group-hover:bg-brand-primary/5 transition-colors" />
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

// Componente XCircle para el modal
const XCircle = ({ size = 16 }: { size?: number }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10" />
    <line x1="15" y1="9" x2="9" y2="15" />
    <line x1="9" y1="9" x2="15" y2="15" />
  </svg>
);