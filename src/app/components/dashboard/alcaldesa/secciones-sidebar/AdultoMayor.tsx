'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { 
  Heart, 
  Users, 
  Target, 
  ShieldCheck, 
  Clock, 
  Plus, 
  Filter, 
  Search,
  MapPin,
  CheckCircle2,
  Calendar,
  Zap,
  Activity,
  Phone,
  AlertCircle,
  Home,
  ChevronRight,
  FileText,
  Loader2,
  XCircle
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/app/lib/utils';
import { supabase } from '@/app/lib/supabaseClient';
import { useAuth } from '@/context/AuthContext';

export const AdultoMayor = () => {
  const { user } = useAuth();
  const [adultos, setAdultos] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
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
        const { data: adultosData, error: adultosError } = await supabase
          .from('adultos_mayores')
          .select('*')
          .order('created_at', { ascending: false });
        
        if (adultosError) {
          console.error('Error al obtener adultos mayores:', adultosError);
        } else {
          setAdultos(adultosData || []);
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

  // Calcular patologías reales
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
    
    const sortedPathologies = Array.from(pathologiesMap.entries())
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count);
    
    return sortedPathologies.slice(0, 5); // Mostrar solo las 5 principales
  }, [adultos]);
  
  const maxCount = pathologies.length > 0 ? Math.max(...pathologies.map(p => p.count)) : 1;

  // Centros de salud
  const healthCenters = useMemo(() => {
    const centersMap = new Map<string, number>();
    
    adultos.forEach(adulto => {
      const center = adulto.centro_salud;
      if (center && typeof center === 'string' && center.trim() !== '') {
        centersMap.set(center, (centersMap.get(center) || 0) + 1);
      }
    });
    
    return Array.from(centersMap.entries())
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 4);
  }, [adultos]);

  // Próximas actividades
  const upcomingEvents = [
    { title: 'Jornada Integral de Salud', date: 'Mañana, 09:00 AM', location: 'Plaza Bolívar', type: 'Salud', icon: Heart },
    { title: 'Entrega de Combos Proteícos', date: '15 Mayo, 2026', location: 'Casa Comunal Eje 3', type: 'Nutrición', icon: Zap },
    { title: 'Taller de Manualidades', date: '18 Mayo, 2026', location: 'Centro de Abuelo Feliz', type: 'Recreación', icon: Users },
  ];

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[60vh]">
        <Loader2 className="animate-spin text-brand-primary" size={48} />
      </div>
    );
  }

  return (
    <motion.div 
      initial={{ opacity: 0, scale: 0.98 }}
      animate={{ opacity: 1, scale: 1 }}
      className="space-y-10 pb-12"
    >
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-black text-slate-900 uppercase tracking-tighter italic">Protección al Adulto Mayor</h2>
        </div>
       
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
        <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm relative overflow-hidden group hover:shadow-md transition-all">
          <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:scale-110 transition-transform">
            <Users size={48} />
          </div>
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Total Adultos Mayores</p>
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
            <Home size={48} />
          </div>
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Viven Solos</p>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-black italic tracking-tighter text-brand-primary">{vivenSolos}</span>
            <span className="text-[10px] font-bold text-slate-400 uppercase">{totalAdultos ? Math.round((vivenSolos / totalAdultos) * 100) : 0}%</span>
          </div>
        </div>
        <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm relative overflow-hidden group hover:shadow-md transition-all">
          <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:scale-110 transition-transform">
            <Heart size={48} />
          </div>
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Enfermedad Crónica</p>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-black italic tracking-tighter text-brand-primary">{conEnfermedadCronica}</span>
            <span className="text-[10px] font-bold text-slate-400 uppercase">{totalAdultos ? Math.round((conEnfermedadCronica / totalAdultos) * 100) : 0}%</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-10">
        {/* Directorio de Abuelos */}
        <div className="xl:col-span-2 bg-white rounded-4xl border border-slate-100 shadow-xl overflow-hidden flex flex-col h-[600px]">
          <div className="p-6 border-b border-slate-50 flex flex-col md:flex-row md:items-center justify-between gap-4 bg-slate-50/20">
            <div className="flex items-center gap-2">
              <FileText size={16} className="text-brand-primary" />
              <h3 className="text-sm font-black text-slate-900 uppercase italic tracking-tighter">Directorio Caracterizado</h3>
            </div>
            <div className="flex gap-2">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
                <input 
                  type="text" 
                  placeholder="Buscar por CI o nombre..." 
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-9 pr-4 py-2 bg-white border border-slate-200 rounded-xl text-[10px] font-bold uppercase tracking-widest outline-none w-48 focus:w-56 transition-all shadow-sm" 
                />
              </div>
              <button className="p-2 bg-white border border-slate-200 rounded-xl text-slate-400 hover:text-brand-primary transition-all shadow-sm">
                <Filter size={16} />
              </button>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-6 custom-scrollbar">
            {currentPersonas.length === 0 ? (
              <div className="text-center py-12">
                <Users className="mx-auto h-12 w-12 text-slate-300 mb-4" />
                <p className="text-slate-400 font-bold">No hay adultos mayores registrados</p>
                <p className="text-[10px] text-slate-300 mt-1">Comienza registrando un nuevo adulto mayor</p>
              </div>
            ) : (
              <div className="space-y-3">
                {currentPersonas.map((persona) => (
                  <div 
                    key={persona.id_adulto}
                    onClick={() => setSelectedPersona(persona)}
                    className="flex items-center justify-between p-4 bg-white border border-slate-100 rounded-2xl hover:shadow-md transition-all cursor-pointer group"
                  >
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h4 className="text-sm font-black text-slate-900 uppercase italic">{persona.nombre} {persona.apellido}</h4>
                        {persona.enfermedad_cronica === 'SI' && (
                          <span className="px-2 py-0.5 bg-amber-100 text-amber-700 rounded-lg text-[7px] font-black uppercase">Crónico</span>
                        )}
                        {persona.convivencia === 'Solo/a' && (
                          <span className="px-2 py-0.5 bg-blue-100 text-blue-700 rounded-lg text-[7px] font-black uppercase">Vive Solo</span>
                        )}
                      </div>
                      <div className="flex items-center gap-4 text-[10px] text-slate-500">
                        <span className="font-mono">CI: {persona.tipo_cedula}-{persona.cedula}</span>
                        <span>{persona.edad} años</span>
                        <span>{persona.genero}</span>
                      </div>
                    </div>
                    <button className="p-2 rounded-xl bg-slate-50 text-slate-400 group-hover:bg-brand-primary group-hover:text-white transition-all">
                      <Phone size={14} />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Paginación */}
          {totalPages > 1 && (
            <div className="p-5 border-t border-slate-50 bg-slate-50/30 flex items-center justify-between">
              <p className="text-[9px] font-bold text-slate-400">
                Mostrando {((currentPage - 1) * itemsPerPage) + 1} - {Math.min(currentPage * itemsPerPage, filteredPersonas.length)} de {filteredPersonas.length}
              </p>
              <div className="flex gap-2">
                <button 
                  onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                  className="px-4 py-1.5 bg-white border border-slate-200 rounded-xl text-[9px] font-black uppercase tracking-widest disabled:opacity-50 hover:bg-slate-50 transition-all"
                >
                  Anterior
                </button>
                <button 
                  onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                  disabled={currentPage === totalPages}
                  className="px-4 py-1.5 bg-white border border-slate-200 rounded-xl text-[9px] font-black uppercase tracking-widest disabled:opacity-50 hover:bg-slate-50 transition-all"
                >
                  Siguiente
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Sección de Patologías y Centros de Salud */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mt-6">
        {/* Patologías Reportadas */}
        <div className="bg-white p-6 rounded-4xl border border-slate-100 shadow-sm">
          <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-6 flex items-center gap-2">
            <Activity size={14} className="text-brand-primary" /> Patologías Reportadas
          </h4>
          {pathologies.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-slate-400 text-xs font-bold">No se han reportado patologías</p>
            </div>
          ) : (
            <div className="space-y-4">
              {pathologies.map((path, i) => (
                <div key={i}>
                  <div className="flex justify-between items-end mb-2">
                    <span className="text-xs font-black text-slate-700 uppercase tracking-tight">{path.name}</span>
                    <span className="text-sm font-black text-slate-900 italic">{path.count}</span>
                  </div>
                  <div className="h-2 w-full bg-slate-50 rounded-full overflow-hidden">
                    <motion.div 
                      initial={{ width: 0 }}
                      animate={{ width: `${(path.count / maxCount) * 100}%` }}
                      className="h-full rounded-full bg-brand-primary transition-all"
                    />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Centros de Salud */}
        <div className="lg:col-span-2">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {healthCenters.length === 0 ? (
              <div className="col-span-2 text-center py-8 bg-white rounded-3xl border border-slate-100">
                <p className="text-slate-400 font-bold">No se han registrado centros de salud</p>
              </div>
            ) : (
              healthCenters.map((center, i) => (
                <div key={i} className="bg-white p-5 rounded-3xl border border-slate-100 shadow-sm flex flex-col justify-between group hover:border-brand-primary transition-all">
                  <div className="flex justify-between items-start mb-4">
                    <div className="w-10 h-10 rounded-2xl bg-slate-50 flex items-center justify-center text-slate-400 group-hover:bg-brand-primary/10 group-hover:text-brand-primary transition-colors">
                      <MapPin size={20} />
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
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Modal de Detalle */}
      <AnimatePresence>
        {selectedPersona && (
          <ModalDetalle 
            selectedPersona={selectedPersona} 
            setSelectedPersona={setSelectedPersona}
          />
        )}
      </AnimatePresence>
    </motion.div>
  );
};

// ==================== MODAL DE DETALLE ====================
const ModalDetalle = ({ selectedPersona, setSelectedPersona }: any) => {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
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
        <div className="p-4 text-white bg-brand-primary">
          <div className="flex justify-between items-start">
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
        <div className="p-4 space-y-3">
          {/* Información Personal */}
          <div className="grid grid-cols-3 gap-2">
            <div className="bg-slate-50 p-2 rounded-xl text-center">
              <p className="text-[7px] font-black text-slate-400 uppercase">Edad</p>
              <p className="text-sm font-black text-slate-800">{selectedPersona.edad} años</p>
            </div>
            <div className="bg-slate-50 p-2 rounded-xl text-center">
              <p className="text-[7px] font-black text-slate-400 uppercase">Género</p>
              <p className="text-sm font-black text-slate-800">{selectedPersona.genero}</p>
            </div>
            <div className="bg-slate-50 p-2 rounded-xl text-center">
              <p className="text-[7px] font-black text-slate-400 uppercase">Edo. Civil</p>
              <p className="text-xs font-bold text-slate-700">{selectedPersona.estado_civil || '—'}</p>
            </div>
            <div className="bg-slate-50 p-2 rounded-xl col-span-3 flex items-center justify-between px-3">
              <div>
                <p className="text-[7px] font-black text-slate-400 uppercase">Teléfono</p>
                <p className="text-xs font-bold text-slate-700">{selectedPersona.cod_tel}-{selectedPersona.telefono}</p>
              </div>
              <div className={cn(
                "px-2 py-1 rounded-md text-[7px] font-bold",
                selectedPersona.convivencia === 'Solo/a' ? "bg-amber-100 text-amber-700" : "bg-emerald-100 text-emerald-700"
              )}>
                {selectedPersona.convivencia === 'Solo/a' ? "Vive Solo" : "Vive Acompañado"}
              </div>
            </div>
            <div className="bg-slate-50 p-2 rounded-xl col-span-3">
              <p className="text-[7px] font-black text-slate-400 uppercase">Dirección</p>
              <p className="text-xs font-medium text-slate-700">
                {selectedPersona.calle}, {selectedPersona.residencia}, {selectedPersona.comunidad}
              </p>
            </div>
          </div>

          {/* Condiciones de Salud */}
          <div className="grid grid-cols-2 gap-2">
            <div className="bg-brand-primary/5 p-2 rounded-xl">
              <p className="text-[7px] font-black text-slate-400 uppercase flex items-center gap-1">
                <Activity size={10} /> Salud
              </p>
              {selectedPersona.enfermedad_cronica === 'SI' ? (
                <span className="text-[9px] font-bold text-brand-primary uppercase block mt-1">
                  {selectedPersona.cual_enfermedad || selectedPersona.otra_enfermedad || 'Crónica'}
                </span>
              ) : (
                <span className="text-[9px] font-bold text-emerald-600 uppercase block mt-1">Sano</span>
              )}
            </div>
            <div className="bg-blue-50/30 p-2 rounded-xl">
              <p className="text-[7px] font-black text-slate-400 uppercase flex items-center gap-1">
                <Heart size={10} /> Tratamiento
              </p>
              {selectedPersona.tratamiento === 'SI' ? (
                <span className="text-[9px] font-bold text-blue-600 uppercase block mt-1">
                  {selectedPersona.cual_tratamiento || selectedPersona.otra_medicamento || 'Activo'}
                </span>
              ) : (
                <span className="text-[9px] font-bold text-slate-500 uppercase block mt-1">Ninguno</span>
              )}
            </div>
          </div>

          {/* Tallas */}
          <div className="border-t border-slate-100 pt-3">
            <p className="text-[8px] font-black text-slate-400 uppercase mb-2">Tallas para Dotación</p>
            <div className="grid grid-cols-3 gap-2">
              <div className="bg-brand-primary/5 p-2 rounded-lg text-center">
                <p className="text-[7px] font-black text-brand-primary">Camisa</p>
                <p className="text-sm font-black text-brand-secondary">{selectedPersona.camisa || '—'}</p>
              </div>
              <div className="bg-brand-primary/5 p-2 rounded-lg text-center">
                <p className="text-[7px] font-black text-brand-primary">Pantalón</p>
                <p className="text-sm font-black text-brand-secondary">{selectedPersona.pantalon || '—'}</p>
              </div>
              <div className="bg-brand-primary/5 p-2 rounded-lg text-center">
                <p className="text-[7px] font-black text-brand-primary">Calzado</p>
                <p className="text-sm font-black text-brand-secondary">{selectedPersona.calzado || '—'}</p>
              </div>
            </div>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
};