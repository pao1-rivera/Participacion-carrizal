'use client';

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { 
  Heart, Stethoscope, Building2, Utensils, 
  AlertCircle, Activity, Plus, ArrowUpRight,
  Users, ShieldAlert, UserPlus, 
  MapPin, AlertTriangle, ChevronRight,
  HeartPulse, Search, Calendar, Home, FileText, ChevronLeft,
  Printer, Download, XCircle, Loader2
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/app/lib/utils';
import { supabase } from '@/app/lib/supabaseClient';
import { useAuth } from '@/context/AuthContext';

// ==================== COMPONENTE PRINCIPAL ====================
interface SocialSaludProps {
  activeTab?: string;
}

export const SaludAtencion: React.FC<SocialSaludProps> = ({ activeTab = 'social' }) => {
  const { user } = useAuth();
  const [currentTab, setCurrentTab] = useState(activeTab);
  const [adultos, setAdultos] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [consejos, setConsejos] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedPersona, setSelectedPersona] = useState<any | null>(null);
  const itemsPerPage = 6;

  // Cargar datos del adulto mayor desde Supabase
  useEffect(() => {
    if (!user?.id) return;

    const fetchData = async () => {
      setLoading(true);
      
      // Obtener el rol del usuario desde perfil_usuario
      const { data: perfil, error: perfilError } = await supabase
        .from('perfil_usuario')
        .select('id_rol')
        .eq('id_usuario', user.id)
        .maybeSingle();

      if (perfilError) {
        console.error('Error al obtener perfil:', perfilError);
      }

      // Obtener el nombre del rol
      let rolNombre = '';
      let esDirectorOMayor = false;
      
      if (perfil?.id_rol) {
        const { data: rolData } = await supabase
          .from('rol_usuario')
          .select('nombre_rol')
          .eq('id_rol', perfil.id_rol)
          .maybeSingle();
        
        if (rolData) {
          rolNombre = rolData.nombre_rol;
          
          // Verificar si es director_adulto_mayor o admin
          esDirectorOMayor = rolNombre === 'director_adulto_mayor' || 
                              rolNombre === 'admin' || 
                              rolNombre === 'alcaldesa' || 
                              rolNombre === 'secretario';
        }
      }

      // Para director_adulto_mayor, obtener TODOS los adultos
      if (esDirectorOMayor) {
        
        // Obtener todos los adultos mayores
        const { data: adultosData, error: adultosError } = await supabase
          .from('adultos_mayores')
          .select('*')
          .order('created_at', { ascending: false });
        
        if (adultosError) {
          console.error('Error al obtener adultos mayores:', adultosError);
        } else {
          setAdultos(adultosData || []);
        }
        
        // Obtener todos los consejos
        const { data: consejosData, error: consejosError } = await supabase
          .from('datos_consejo_comunal')
          .select('id_consejo, nombre_consejo');
        
        if (!consejosError && consejosData) {
          setConsejos(consejosData);
        }
      } 
      else {
        // Para otros roles, intentar obtener desde sala_autogobierno
        const { data: sala, error: salaError } = await supabase
          .from('datos_sala_autogobierno')
          .select('id_comuna')
          .eq('id_usuario', user.id)
          .maybeSingle();

        if (salaError) {
          console.error('Error al obtener sala:', salaError);
        }

        if (sala?.id_comuna) {
          
          // Obtener consejos de la comuna
          const { data: consejosData, error: consejosError } = await supabase
            .from('datos_consejo_comunal')
            .select('id_consejo, nombre_consejo')
            .eq('id_comuna', sala.id_comuna);
          
          if (!consejosError && consejosData) {
            setConsejos(consejosData);
          }
          
          // Obtener adultos de la comuna
          const { data: adultosData, error: adultosError } = await supabase
            .from('adultos_mayores')
            .select('*')
            .eq('id_comuna', sala.id_comuna)
            .order('created_at', { ascending: false });
          
          if (!adultosError && adultosData) {
            setAdultos(adultosData);
          }
        } else {
          // Fallback: si no hay comuna, intentar obtener todos los adultos
          const { data: adultosData, error: adultosError } = await supabase
            .from('adultos_mayores')
            .select('*')
            .order('created_at', { ascending: false });
          
          if (!adultosError && adultosData) {
            setAdultos(adultosData);
          }
        }
      }
      
      setLoading(false);
    };

    fetchData();
  }, [user]);

  // Filtrar personas
  const filteredPersonas = useMemo(() => {
    if (!searchTerm) return adultos;
    const term = searchTerm.toLowerCase();
    return adultos.filter(p => 
      p.nombre?.toLowerCase().includes(term) ||
      p.apellido?.toLowerCase().includes(term) ||
      p.cedula?.includes(term)
    );
  }, [adultos, searchTerm]);

  const totalPages = Math.ceil(filteredPersonas.length / itemsPerPage);
  const currentPersonas = filteredPersonas.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  // Estadísticas
  const totalAdultos = adultos.length;
  const totalFemenino = adultos.filter(a => a.genero === 'Femenino').length;
  const totalMasculino = adultos.filter(a => a.genero === 'Masculino').length;
  const conEnfermedadCronica = adultos.filter(a => a.enfermedad_cronica === 'SI').length;
  const vivenSolos = adultos.filter(a => a.convivencia === 'Solo/a').length;

  // Obtener nombre del consejo
  const getConsejoName = (consejoId: number | null) => {
    if (!consejoId) return 'No asignado';
    const consejo = consejos.find(c => c.id_consejo === consejoId);
    return consejo?.nombre_consejo || 'Desconocido';
  };

  const tabs = [
    { id: 'social', label: 'Social', icon: Heart },
    { id: 'salud', label: 'Salud y Atención Médica', icon: Stethoscope },
  ];

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[60vh]">
        <Loader2 className="animate-spin text-brand-primary" size={48} />
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex items-center justify-between">
        <div className="flex bg-slate-100 p-1 rounded-xl gap-1">
          {tabs.map((tab) => (
            <TabButton 
              key={tab.id}
              active={currentTab === tab.id}
              onClick={() => setCurrentTab(tab.id)}
              icon={tab.icon}
              label={tab.label}
            />
          ))}
        </div>
      </div>

      <AnimatePresence mode="wait">
        {currentTab === 'social' && (
          <SocialSection 
            totalAdultos={totalAdultos}
            totalFemenino={totalFemenino}
            totalMasculino={totalMasculino}
            vivenSolos={vivenSolos}
            conEnfermedadCronica={conEnfermedadCronica}
            currentPersonas={currentPersonas}
            searchTerm={searchTerm}
            setSearchTerm={setSearchTerm}
            currentPage={currentPage}
            setCurrentPage={setCurrentPage}
            totalPages={totalPages}
            itemsPerPage={itemsPerPage}
            filteredLength={filteredPersonas.length}
            setSelectedPersona={setSelectedPersona}
            getConsejoName={getConsejoName}
          />
        )}
        {currentTab === 'salud' && (
          <SaludAtencionSection adultos={adultos} />
        )}
      </AnimatePresence>

      {/* Modal de Detalle de Ficha */}
      <AnimatePresence>
        {selectedPersona && (
          <ModalDetalle 
            selectedPersona={selectedPersona} 
            setSelectedPersona={setSelectedPersona}
            getConsejoName={getConsejoName}
          />
        )}
      </AnimatePresence>
    </div>
  );
};

const TabButton = ({ active, onClick, icon: Icon, label }: any) => {
  const colorClasses = active 
    ? 'bg-white text-[#009b93] shadow-sm' 
    : 'text-slate-500 hover:text-[#009b93]';
  
  return (
    <button 
      onClick={onClick} 
      className={cn(
        "flex items-center gap-2 px-5 py-2.5 rounded-lg text-[10px] font-black uppercase tracking-wider transition-all",
        colorClasses
      )}
    >
      <Icon size={14} /> {label}
    </button>
  );
};

// ==================== SECCIÓN SOCIAL COMPLETA ====================
const SocialSection = ({ 
  totalAdultos, totalFemenino, totalMasculino, vivenSolos, conEnfermedadCronica,
  currentPersonas, searchTerm, setSearchTerm, currentPage, setCurrentPage,
  totalPages, itemsPerPage, filteredLength, setSelectedPersona, getConsejoName
}: any) => {
  return (
    <motion.div 
      initial={{ opacity: 0, scale: 0.98 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.98 }}
      className="space-y-8"
    >
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-sm font-black text-slate-900 uppercase tracking-widest italic">Gestión Social y Protección</h3>
          <p className="text-[10px] text-slate-500 font-bold uppercase mt-1">Censo Social · Caracterización · Fichas de Atención</p>
        </div>
      </div>

      {/* Censo Social Stats */}
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
          <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm relative overflow-hidden group hover:shadow-md transition-all">
            <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:scale-110 transition-transform">
              <Users size={48} />
            </div>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Total Adultos Mayores Encuestados</p>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-black italic tracking-tighter text-brand-primary">{totalAdultos}</span>
              <span className="text-[10px] font-bold text-slate-400 uppercase">+60 años</span>
            </div>
          </div>
          <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm relative overflow-hidden group hover:shadow-md transition-all">
            <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:scale-110 transition-transform">
              <Users size={48} />
            </div>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Femenino</p>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-black italic tracking-tighter text-brand-primary">{totalFemenino}</span>
              <span className="text-[10px] font-bold text-slate-400 uppercase">{totalAdultos ? Math.round((totalFemenino / totalAdultos) * 100) : 0}%</span>
            </div>
          </div>
          <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm relative overflow-hidden group hover:shadow-md transition-all">
            <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:scale-110 transition-transform">
              <Users size={48} />
            </div>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Masculino</p>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-black italic tracking-tighter text-brand-primary">{totalMasculino}</span>
              <span className="text-[10px] font-bold text-slate-400 uppercase">{totalAdultos ? Math.round((totalMasculino / totalAdultos) * 100) : 0}%</span>
            </div>
          </div>
          <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm relative overflow-hidden group hover:shadow-md transition-all">
            <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:scale-110 transition-transform">
              <ShieldAlert size={48} />
            </div>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Viven Solos</p>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-black italic tracking-tighter text-brand-primary">{vivenSolos}</span>
              <span className="text-[10px] font-bold text-slate-400 uppercase">{totalAdultos ? Math.round((vivenSolos / totalAdultos) * 100) : 0}%</span>
            </div>
          </div>
          <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm relative overflow-hidden group hover:shadow-md transition-all">
            <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:scale-110 transition-transform">
              <HeartPulse size={48} />
            </div>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Enfermedad Crónica</p>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-black italic tracking-tighter text-brand-primary">{conEnfermedadCronica}</span>
              <span className="text-[10px] font-bold text-slate-400 uppercase">{totalAdultos ? Math.round((conEnfermedadCronica / totalAdultos) * 100) : 0}%</span>
            </div>
          </div>
        </div>
      </div>

      {/* Fichas de Personas Encuestadas */}
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] flex items-center gap-2">
            <FileText size={14} className="text-brand-primary" /> Fichas de Personas Encuestadas
          </h4>
          <div className="flex gap-2">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
              <input 
                type="text" 
                placeholder="Buscar por nombre, cédula..." 
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9 pr-4 py-2 bg-white border border-slate-200 rounded-xl text-xs font-bold outline-none w-64 shadow-sm focus:ring-2 focus:ring-brand-primary/20"
              />
            </div>
          </div>
        </div>

        {/* Cards Grid */}
        {currentPersonas.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-3xl border border-slate-100">
            <Users className="mx-auto h-12 w-12 text-slate-300 mb-4" />
            <p className="text-slate-400 font-bold">No hay adultos mayores registrados</p>
            <p className="text-[10px] text-slate-300 mt-1">Comienza registrando un nuevo adulto mayor</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {currentPersonas.map((persona: any) => (
              <motion.div
                key={persona.id_adulto}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                whileHover={{ y: -4 }}
                className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden hover:shadow-lg transition-all cursor-pointer"
                onClick={() => setSelectedPersona(persona)}
              >
                {/* Card Header */}
                <div className="p-4 text-white bg-brand-primary">
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="text-[8px] font-black uppercase opacity-80 tracking-wider">Ficha #{persona.id_adulto}</p>
                      <h5 className="text-sm font-black mt-1">{persona.nombre} {persona.apellido}</h5>
                      <p className="text-[10px] font-bold opacity-80">{persona.tipo_cedula}-{persona.cedula}</p>
                    </div>
                    {persona.enfermedad_cronica === 'SI' && (
                      <div className="bg-white/20 rounded-full p-2 backdrop-blur-sm">
                        <AlertTriangle size={16} className="text-white" />
                      </div>
                    )}
                  </div>
                </div>

                {/* Card Body */}
                <div className="p-4 space-y-3">
                  <div className="flex items-center gap-3 text-xs">
                    <div className="flex items-center gap-1 text-slate-500">
                      <Calendar size={12} />
                      <span className="text-[10px]">{persona.edad} años</span>
                    </div>
                    <div className="flex items-center gap-1 text-slate-500">
                      <Users size={12} />
                      <span className="text-[10px]">{persona.genero}</span>
                    </div>
                    <div className={cn(
                      "flex items-center gap-1 px-2 py-0.5 rounded-full text-[8px] font-bold",
                      persona.convivencia === 'Solo/a' ? "bg-amber-100 text-amber-700" : "bg-emerald-100 text-emerald-700"
                    )}>
                      <Home size={10} />
                      {persona.convivencia === 'Solo/a' ? "Vive Solo" : "Vive Acompañado"}
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-1">
                    {persona.cual_enfermedad && persona.cual_enfermedad !== 'NO APLICA' && (
                      <span className="px-2 py-0.5 bg-brand-primary/10 text-brand-primary rounded-lg text-[8px] font-bold uppercase">
                        {persona.cual_enfermedad.length > 30 ? persona.cual_enfermedad.substring(0, 27) + '...' : persona.cual_enfermedad}
                      </span>
                    )}
                    {persona.ayuda_tecnica && persona.ayuda_tecnica !== 'NO REQUIERE' && (
                      <span className="px-2 py-0.5 bg-amber-50 text-amber-600 rounded-lg text-[8px] font-bold uppercase">
                        {persona.ayuda_tecnica}
                      </span>
                    )}
                  </div>

                  <div className="flex items-center justify-between pt-2 border-t border-slate-50">
                    <div className="flex items-center gap-1 text-[9px] text-slate-500">
                      <MapPin size={10} />
                      <span className="truncate max-w-37.5">{persona.comunidad}</span>
                    </div>
                    <button className="text-brand-primary text-[9px] font-bold uppercase flex items-center gap-1 hover:gap-2 transition-all">
                      Ver ficha <ChevronRight size={10} />
                    </button>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between pt-4 border-t border-slate-100">
            <div className="text-[10px] text-slate-500">
              Mostrando {((currentPage - 1) * itemsPerPage) + 1} - {Math.min(currentPage * itemsPerPage, filteredLength)} de {filteredLength} fichas
            </div>
            <div className="flex gap-1">
              <button 
                onClick={() => setCurrentPage((p: number) => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="p-2 rounded-lg border border-slate-200 disabled:opacity-50 hover:bg-slate-50 transition-colors"
              >
                <ChevronLeft size={14} />
              </button>
              {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
                let pageNum = i + 1;
                if (totalPages > 5 && currentPage > 3) {
                  pageNum = currentPage - 2 + i;
                  if (pageNum > totalPages) return null;
                }
                return (
                  <button
                    key={pageNum}
                    onClick={() => setCurrentPage(pageNum)}
                    className={cn(
                      "w-8 h-8 rounded-lg text-xs font-bold transition-colors",
                      currentPage === pageNum 
                        ? "bg-brand-primary text-white" 
                        : "text-slate-600 hover:bg-brand-primary/10 border border-slate-200"
                    )}
                  >
                    {pageNum}
                  </button>
                );
              })}
              <button 
                onClick={() => setCurrentPage((p: number) => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
                className="p-2 rounded-lg border border-slate-200 disabled:opacity-50 hover:bg-slate-50 transition-colors"
              >
                <ChevronRight size={14} />
              </button>
            </div>
          </div>
        )}
      </div>
    </motion.div>
  );
};

// ==================== MODAL DE DETALLE ====================
const ModalDetalle = ({ selectedPersona, setSelectedPersona, getConsejoName }: any) => {
  return (
    <motion.div
  initial={{ opacity: 0 }}
  animate={{ opacity: 1 }}
  exit={{ opacity: 0 }}
  className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[100] flex items-center justify-center p-4"
  onClick={() => setSelectedPersona(null)}
>
  <motion.div
    initial={{ scale: 0.9, opacity: 0 }}
    animate={{ scale: 1, opacity: 1 }}
    exit={{ scale: 0.9, opacity: 0 }}
    className="bg-white rounded-2xl max-w-md w-full overflow-hidden shadow-2xl"
    onClick={(e) => e.stopPropagation()}
  >
    {/* Modal Header */}
    <div className="p-3 text-white bg-brand-primary">
      <div className="flex justify-between items-center">
        <div>
          <p className="text-[8px] font-black uppercase opacity-80 tracking-wider">Ficha de Atención Social</p>
          <h3 className="text-base font-black mt-0.5 leading-tight">{selectedPersona.nombre} {selectedPersona.apellido}</h3>
          <p className="text-xs font-bold opacity-80">{selectedPersona.tipo_cedula}-{selectedPersona.cedula}</p>
        </div>
        <button 
          onClick={() => setSelectedPersona(null)}
          className="bg-white/20 p-1.5 rounded-full hover:bg-white/30 transition-colors"
        >
          <XCircle size={16} />
        </button>
      </div>
    </div>

    {/* Modal Body */}
    <div className="p-3.5 space-y-2.5">
      {/* Información Personal */}
      <div className="grid grid-cols-3 gap-1.5">
        <div className="bg-slate-50 p-1.5 rounded-xl text-center">
          <p className="text-[7.5px] font-black text-slate-400 uppercase tracking-wider">Edad</p>
          <p className="text-xs font-black text-slate-800">{selectedPersona.edad} años</p>
        </div>
        <div className="bg-slate-50 p-1.5 rounded-xl text-center">
          <p className="text-[7.5px] font-black text-slate-400 uppercase tracking-wider">Género</p>
          <p className="text-xs font-black text-slate-800">{selectedPersona.genero}</p>
        </div>
        <div className="bg-slate-50 p-1.5 rounded-xl text-center">
          <p className="text-[7.5px] font-black text-slate-400 uppercase tracking-wider">Edo. Civil</p>
          <p className="text-xs font-bold text-slate-700 truncate">{selectedPersona.estado_civil || '—'}</p>
        </div>
        <div className="bg-slate-50 p-1.5 rounded-xl col-span-3 flex items-center justify-between px-2.5">
          <div>
            <p className="text-[7.5px] font-black text-slate-400 uppercase tracking-wider">Teléfono</p>
            <p className="text-xs font-bold text-slate-700">{selectedPersona.cod_tel}-{selectedPersona.telefono}</p>
          </div>
          <div className={cn(
            "inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[8px] font-bold",
            selectedPersona.convivencia === 'Solo/a' ? "bg-amber-100 text-amber-700" : "bg-emerald-100 text-emerald-700"
          )}>
            {selectedPersona.convivencia === 'Solo/a' ? "Vive Solo" : "Vive Acompañado"}
          </div>
        </div>
        <div className="bg-slate-50 p-1.5 rounded-xl col-span-3">
          <p className="text-[7.5px] font-black text-slate-400 uppercase tracking-wider">Dirección</p>
          <p className="text-xs font-medium text-slate-700 truncate">
            {selectedPersona.calle}, {selectedPersona.residencia}, {selectedPersona.comunidad}
          </p>
        </div>
        <div className="bg-slate-50 p-1.5 rounded-xl col-span-3">
          <p className="text-[7.5px] font-black text-slate-400 uppercase tracking-wider">Consejo Comunal</p>
          <p className="text-xs font-bold text-slate-700 truncate">{getConsejoName(selectedPersona.id_consejo)}</p>
        </div>
      </div>

      {/* Bloque de Salud y Tratamiento en Paralelo */}
      <div className="grid grid-cols-2 gap-2.5">
        {/* Condiciones de Salud */}
        <div>
          <p className="text-[8px] font-black text-slate-400 uppercase tracking-wider mb-1 flex items-center gap-1">
            <Activity size={10} /> Salud
          </p>
          <div className="truncate">
            {selectedPersona.enfermedad_cronica === 'SI' ? (
              <span className="px-2 py-0.5 bg-brand-primary/10 text-brand-primary rounded-md text-[8.5px] font-bold uppercase inline-block max-w-full truncate">
                {selectedPersona.cual_enfermedad || selectedPersona.otra_enfermedad || 'Crónica'}
              </span>
            ) : (
              <span className="px-2 py-0.5 bg-emerald-50 text-emerald-600 rounded-md text-[8.5px] font-bold uppercase inline-block">
                Sano
              </span>
            )}
          </div>
        </div>

        {/* Tratamiento */}
        <div>
          <p className="text-[8px] font-black text-slate-400 uppercase tracking-wider mb-1 flex items-center gap-1">
            <Heart size={10} /> Tratamiento
          </p>
          <div className="truncate">
            {selectedPersona.tratamiento === 'SI' ? (
              <span className="px-2 py-0.5 bg-blue-50 text-blue-600 rounded-md text-[8.5px] font-bold uppercase inline-block max-w-full truncate">
                {selectedPersona.cual_tratamiento || selectedPersona.otra_medicamento || 'Activo'}
              </span>
            ) : (
              <span className="px-2 py-0.5 bg-gray-50 text-gray-500 rounded-md text-[8.5px] font-bold uppercase inline-block">
                Ninguno
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Ayuda Técnica (Condicional compacto) */}
      {selectedPersona.ayuda_tecnica && selectedPersona.ayuda_tecnica !== 'NO REQUIERE' && (
        <div className="bg-amber-50 border border-amber-100 p-1.5 rounded-xl flex items-center justify-between px-2.5">
          <p className="text-[8px] font-black text-amber-600 uppercase tracking-wider flex items-center gap-1">
            <AlertCircle size={10} /> Ayuda Técnica:
          </p>
          <span className="text-[9px] font-black text-amber-700 uppercase">
            {selectedPersona.ayuda_tecnica}
          </span>
        </div>
      )}

      {/* Tallas */}
      <div className="border-t border-slate-100 pt-2">
        <p className="text-[8px] font-black text-slate-400 uppercase tracking-wider mb-1">Tallas para Dotación</p>
        <div className="grid grid-cols-3 gap-1.5">
          <div className="bg--brand-primary/5 p-1 rounded-lg text-center">
            <p className="text-[7px] font-black text-brand-primary">Camisa</p>
            <p className="text-xs font-black text-brand-secondary">{selectedPersona.camisa || '—'}</p>
          </div>
          <div className="bg-brand-primary/5 p-1 rounded-lg text-center">
            <p className="text-[7px] font-black text-brand-primary">Pantalón</p>
            <p className="text-xs font-black text-brand-secondary">{selectedPersona.pantalon || '—'}</p>
          </div>
          <div className="bg-brand-primary/5 p-1 rounded-lg text-center">
            <p className="text-[7px] font-black text-brand-primary">Calzado</p>
            <p className="text-xs font-black text-brand-secondary">{selectedPersona.calzado || '—'}</p>
          </div>
        </div>
      </div>

      {/* Acciones */}
      <div className="flex gap-2 pt-2 border-t border-slate-100">
        <button className="flex-1 bg-brand-primary text-white py-1.5 rounded-xl text-[8.5px] font-black uppercase tracking-wider hover:bg-brand-secondary transition-colors flex items-center justify-center gap-1">
          <Download size={11} /> Exportar
        </button>
        <button className="flex-1 border border-slate-200 py-1.5 rounded-xl text-[8.5px] font-black uppercase tracking-wider hover:bg-slate-50 transition-colors flex items-center justify-center gap-1">
          <Printer size={11} /> Imprimir
        </button>
      </div>
    </div>
  </motion.div>
</motion.div>
  );
};

// ==================== SECCIÓN SALUD Y ATENCIÓN MÉDICA ====================
const SaludAtencionSection = ({ adultos }: { adultos: any[] }) => {
  // Calcular patologías reales a partir de los datos de adultos mayores (TODAS, sin límite)
  const pathologies = useMemo(() => {
    const pathologiesMap = new Map<string, number>();
    
    adultos.forEach(adulto => {
      if (adulto.enfermedad_cronica === 'SI') {
        let disease = '';
        if (adulto.cual_enfermedad && adulto.cual_enfermedad !== 'NO APLICA' && adulto.cual_enfermedad.trim() !== '') {
          disease = adulto.cual_enfermedad.trim();
        } else if (adulto.otra_enfermedad && adulto.otra_enfermedad.trim() !== '') {
          disease = adulto.otra_enfermedad.trim();
        }
        
        if (disease) {
          pathologiesMap.set(disease, (pathologiesMap.get(disease) || 0) + 1);
        }
      }
    });
    
    // Convertir a array y ordenar por cantidad descendente
    const sortedPathologies = Array.from(pathologiesMap.entries())
      .map(([name, count]) => ({ name, count, color: 'bg-[#009b93]' }))
      .sort((a, b) => b.count - a.count);
    
    // Si no hay patologías, mostrar mensaje
    if (sortedPathologies.length === 0) {
      return [];
    }
    
    // MOSTRAR TODAS LAS PATOLOGÍAS (sin límite)
    return sortedPathologies;
  }, [adultos]);
  
  // Calcular el máximo conteo para escalar las barras
  const maxCount = pathologies.length > 0 ? Math.max(...pathologies.map(p => p.count)) : 1;

  // Centros de salud reales desde la columna centro_salud
  const healthCenters = useMemo(() => {
    const centersMap = new Map<string, number>();
    
    adultos.forEach(adulto => {
      const center = adulto.centro_salud;
      if (center && typeof center === 'string' && center.trim() !== '') {
        centersMap.set(center, (centersMap.get(center) || 0) + 1);
      }
    });
    
    // Convertir a array y ordenar por cantidad descendente
    const sortedCenters = Array.from(centersMap.entries())
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count);
    
    return sortedCenters;
  }, [adultos]);
  
  return (
    <motion.div 
      initial={{ opacity: 0, scale: 0.98 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.98 }}
      className="space-y-8"
    >
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-sm font-black text-slate-900 uppercase tracking-widest italic">Salud y Atención Médica</h3>
          <p className="text-[10px] text-slate-500 font-bold uppercase mt-1">Seguimiento de Patologías e Infraestructura</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Pathologies Tracking - TODAS las enfermedades */}
        <div className="lg:col-span-1 space-y-6">
          <div className="bg-white p-6 rounded-4xl border border-slate-100 shadow-sm">
            <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-6 flex items-center gap-2">
              <Activity size={14} className="text-brand-primary" /> Patologías Reportadas
            </h4>
            {pathologies.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-slate-400 text-xs font-bold">No se han reportado patologías</p>
                <p className="text-[9px] text-slate-300 mt-1">Los adultos mayores registrados no presentan enfermedades crónicas reportadas.</p>
              </div>
            ) : (
              <div className="space-y-4 max-h-100 overflow-y-auto pr-2">
                {pathologies.map((path, i) => (
                  <div key={i} className="group">
                    <div className="flex justify-between items-end mb-2">
                      <span className="text-xs font-black text-slate-700 uppercase tracking-tight">{path.name}</span>
                      <span className="text-sm font-black text-slate-900 italic">{path.count}</span>
                    </div>
                    <div className="h-2 w-full bg-slate-50 rounded-full overflow-hidden">
                      <motion.div 
                        initial={{ width: 0 }}
                        animate={{ width: `${(path.count / maxCount) * 100}%` }}
                        className={cn("h-full rounded-full transition-all", path.color)}
                      />
                    </div>
                  </div>
                ))}
              </div>
            )}
            <div className="mt-8 pt-6 border-t border-slate-50">
              <p className="text-[9px] text-slate-400 font-bold uppercase text-center italic">Corte de datos: {new Date().toLocaleDateString('es-VE')}</p>
            </div>
          </div>
        </div>

        {/* Infrastructure View - Centros de Salud Reales */}
        <div className="lg:col-span-2 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {healthCenters.length === 0 ? (
              <div className="col-span-2 text-center py-8 bg-white rounded-3xl border border-slate-100">
                <Building2 className="mx-auto h-12 w-12 text-slate-300 mb-4" />
                <p className="text-slate-400 font-bold">No se han registrado centros de salud</p>
                <p className="text-[10px] text-slate-300 mt-1">Los adultos mayores aún no han reportado ningún centro de atención.</p>
              </div>
            ) : (
              healthCenters.map((center, i) => (
                <div key={i} className="bg-white p-5 rounded-3xl border border-slate-100 shadow-sm flex flex-col justify-between group hover:border-brand-primary transition-all">
                  <div className="flex justify-between items-start mb-4">
                    <div className="w-10 h-10 rounded-2xl bg-slate-50 flex items-center justify-center text-slate-400 group-hover:bg-brand-primary/10 group-hover:text-brand-primary transition-colors">
                      <Building2 size={20} />
                    </div>
                    <span className="bg-emerald-50 text-emerald-600 text-[8px] font-black uppercase px-2 py-1 rounded-lg tracking-widest">
                      {center.count} {center.count === 1 ? 'persona' : 'personas'}
                    </span>
                  </div>
                  <div>
                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Centro de Salud</p>
                    <h5 className="text-xs font-black text-slate-900 mt-1 uppercase tracking-tight group-hover:text-brand-primary transition-colors">
                      {center.name}
                    </h5>
                    <p className="text-[10px] text-slate-500 font-medium mt-2 flex items-center gap-1">
                      <Users size={12} className="text-slate-300" /> Adultos que asisten: <span className="font-bold text-brand-primary}">{center.count}</span>
                    </p>
                  </div>
                </div>
              ))
            )}
          </div>

        </div>
      </div>
    </motion.div>
  );
};