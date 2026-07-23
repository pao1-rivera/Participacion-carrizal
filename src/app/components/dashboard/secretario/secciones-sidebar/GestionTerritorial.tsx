'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { 
  Users, Building2, Database, Globe, Search, Filter,
  Eye, XCircle, ChevronLeft, ChevronRight, Loader2
} from 'lucide-react';
import { cn } from '@/app/lib/utils';
import { supabase } from '@/app/lib/supabaseClient';
import { useAuth } from '@/context/AuthContext';
import { motion, AnimatePresence } from 'framer-motion';

// ==================== TIPOS ====================
interface PersonalTerritorial {
  id: string;
  nombre: string;
  apellido: string;
  unidad?: string;
  comite?: string;
  organizacionNombre?: string;
  organizacionTipo: 'consejo_comunal' | 'comuna' | 'sala_autogobierno';
  nivel: string;
  cedula?: string;
  telefono?: string;
  email?: string;
  tipo: 'responsable' | 'vocero';
}

function ResumenBox({ label, value, sub, icon }: any) {
  return (
    <div className="bg-white p-3 md:p-5 rounded-xl md:rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-all">
      <div className="flex items-center justify-between mb-2 md:mb-3">
        <div className="p-1.5 md:p-2.5 bg-gray-50 rounded-lg md:rounded-xl">{icon}</div>
        <span className="text-base md:text-xl font-black text-gray-800 tracking-tighter">{value}</span>
      </div>
      <p className="text-[7px] md:text-[9px] font-black text-gray-400 uppercase tracking-widest">{label}</p>
      <p className="text-[6px] md:text-[8px] text-gray-400 italic">{sub}</p>
    </div>
  );
}

export const GestionTerritorial = () => {
  const { user } = useAuth();
  const [filtro, setFiltro] = useState('Todos');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedPersonal, setSelectedPersonal] = useState<PersonalTerritorial | null>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [personalData, setPersonalData] = useState<PersonalTerritorial[]>([]);
  const itemsPerPage = 10;

  const [stats, setStats] = useState({
    totalVoceros: 0,
    totalVocerosCC: 0,
    totalVocerosComuna: 0,
    totalVocerosSala: 0
  });

  useEffect(() => {
    setCurrentPage(1);
  }, [filtro, searchTerm]);

  const cargarDatos = useCallback(async () => {
    setLoading(true);
    try {
      const personal: PersonalTerritorial[] = [];

      const { data: consejosComunales } = await supabase
        .from('datos_consejo_comunal')
        .select('id_consejo, nombre_consejo');
      const consejosMap = new Map();
      if (consejosComunales) consejosComunales.forEach(c => consejosMap.set(c.id_consejo, c.nombre_consejo));

      const { data: comunas } = await supabase
        .from('datos_comuna')
        .select('id_comuna, nombre_comuna');
      const comunasMap = new Map();
      if (comunas) comunas.forEach(c => comunasMap.set(c.id_comuna, c.nombre_comuna));

      // Responsables de consejos
      const { data: consejosConUsuarios } = await supabase
        .from('datos_consejo_comunal')
        .select('id_consejo, nombre_consejo, id_usuario')
        .not('id_usuario', 'is', null);
      if (consejosConUsuarios && consejosConUsuarios.length) {
        const userIds = [...new Set(consejosConUsuarios.map(c => c.id_usuario))];
        const { data: perfiles } = await supabase
          .from('perfil_usuario')
          .select('id_usuario, nombre, apellido, cedula, telefono, email')
          .in('id_usuario', userIds);
        const perfilMap = new Map();
        if (perfiles) perfiles.forEach(p => perfilMap.set(p.id_usuario, p));
        consejosConUsuarios.forEach(item => {
          const perfil = perfilMap.get(item.id_usuario);
          if (perfil) {
            personal.push({
              id: perfil.id_usuario,
              nombre: perfil.nombre || '',
              apellido: perfil.apellido || '',
              unidad: 'Vocero Responsable',
              organizacionNombre: item.nombre_consejo,
              organizacionTipo: 'consejo_comunal',
              nivel: 'Vocero CC',
              cedula: perfil.cedula,
              telefono: perfil.telefono,
              email: perfil.email,
              tipo: 'responsable'
            });
          }
        });
      }

      // Responsables de comunas
      const { data: comunasConUsuarios } = await supabase
        .from('datos_comuna')
        .select('id_comuna, nombre_comuna, id_usuario')
        .not('id_usuario', 'is', null);
      if (comunasConUsuarios && comunasConUsuarios.length) {
        const userIds = [...new Set(comunasConUsuarios.map(c => c.id_usuario))];
        const { data: perfiles } = await supabase
          .from('perfil_usuario')
          .select('id_usuario, nombre, apellido, cedula, telefono, email')
          .in('id_usuario', userIds);
        const perfilMap = new Map();
        if (perfiles) perfiles.forEach(p => perfilMap.set(p.id_usuario, p));
        comunasConUsuarios.forEach(item => {
          const perfil = perfilMap.get(item.id_usuario);
          if (perfil) {
            personal.push({
              id: perfil.id_usuario,
              nombre: perfil.nombre || '',
              apellido: perfil.apellido || '',
              unidad: 'Vocero Responsable',
              organizacionNombre: item.nombre_comuna,
              organizacionTipo: 'comuna',
              nivel: 'Vocero Comuna',
              cedula: perfil.cedula,
              telefono: perfil.telefono,
              email: perfil.email,
              tipo: 'responsable'
            });
          }
        });
      }

      // Responsables de salas
      const { data: salasConUsuarios } = await supabase
        .from('datos_sala_autogobierno')
        .select('id_sala, nombre_sala, id_usuario')
        .not('id_usuario', 'is', null);
      if (salasConUsuarios && salasConUsuarios.length) {
        const userIds = [...new Set(salasConUsuarios.map(s => s.id_usuario))];
        const { data: perfiles } = await supabase
          .from('perfil_usuario')
          .select('id_usuario, nombre, apellido, cedula, telefono, email')
          .in('id_usuario', userIds);
        const perfilMap = new Map();
        if (perfiles) perfiles.forEach(p => perfilMap.set(p.id_usuario, p));
        salasConUsuarios.forEach(item => {
          const perfil = perfilMap.get(item.id_usuario);
          if (perfil) {
            personal.push({
              id: perfil.id_usuario,
              nombre: perfil.nombre || '',
              apellido: perfil.apellido || '',
              unidad: 'Vocero Responsable',
              organizacionNombre: item.nombre_sala,
              organizacionTipo: 'sala_autogobierno',
              nivel: 'Vocero Sala',
              cedula: perfil.cedula,
              telefono: perfil.telefono,
              email: perfil.email,
              tipo: 'responsable'
            });
          }
        });
      }

      // Voceros de consejos
      const { data: vocerosConsejo } = await supabase
        .from('voceros')
        .select('id_vocero, nombre_completo, cedula, unidad, comite, telefono, id_consejo');
      if (vocerosConsejo && vocerosConsejo.length) {
        vocerosConsejo.forEach(v => {
          const nombreCompleto = v.nombre_completo?.split(' ') || [];
          const nombre = nombreCompleto[0] || '';
          const apellido = nombreCompleto.slice(1).join(' ') || '';
          const consejoNombre = consejosMap.get(v.id_consejo) || '';
          personal.push({
            id: `vocero_${v.id_vocero}`,
            nombre,
            apellido,
            unidad: v.unidad || 'Gestión',
            comite: v.comite,
            organizacionNombre: consejoNombre,
            organizacionTipo: 'consejo_comunal',
            nivel: 'Vocería',
            cedula: v.cedula,
            telefono: v.telefono,
            tipo: 'vocero'
          });
        });
      }

      // Voceros de comunas
      const { data: vocerosComuna } = await supabase
        .from('voceros_comuna')
        .select('id_voceroc, nombre_completo, cedula, unidad, comite, telefono, id_comuna');
      if (vocerosComuna && vocerosComuna.length) {
        vocerosComuna.forEach(v => {
          const nombreCompleto = v.nombre_completo?.split(' ') || [];
          const nombre = nombreCompleto[0] || '';
          const apellido = nombreCompleto.slice(1).join(' ') || '';
          const comunaNombre = comunasMap.get(v.id_comuna) || '';
          personal.push({
            id: `vocero_comuna_${v.id_voceroc}`,
            nombre,
            apellido,
            unidad: v.unidad || 'Gestión',
            comite: v.comite,
            organizacionNombre: comunaNombre,
            organizacionTipo: 'comuna',
            nivel: 'Vocería',
            cedula: v.cedula,
            telefono: v.telefono,
            tipo: 'vocero'
          });
        });
      }

      setStats({
        totalVoceros: personal.length,
        totalVocerosCC: personal.filter(p => p.nivel === 'Vocero CC').length,
        totalVocerosComuna: personal.filter(p => p.nivel === 'Vocero Comuna').length,
        totalVocerosSala: personal.filter(p => p.nivel === 'Vocero Sala').length
      });

      setPersonalData(personal);
    } catch (error) {
      console.error('Error cargando datos:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    cargarDatos();
  }, [cargarDatos]);

  const statsCards = [
    { label: 'Total Voceros', value: stats.totalVoceros.toString(), icon: <Users className="text-brand-primary" size={16} />, sub: 'Registrados' },
    { label: 'Voceros CC', value: stats.totalVocerosCC.toString(), icon: <Building2 className="text-indigo-500" size={16} />, sub: 'Consejos Comunales' },
    { label: 'Voceros Comuna', value: stats.totalVocerosComuna.toString(), icon: <Globe className="text-emerald-500" size={16} />, sub: 'Comunas' },
    { label: 'Voceros Sala', value: stats.totalVocerosSala.toString(), icon: <Database className="text-amber-500" size={16} />, sub: 'Salas Autogobierno' },
  ];

  const personalFiltrado = personalData.filter(persona => {
    const nombreCompleto = `${persona.nombre} ${persona.apellido}`.toLowerCase();
    const matchesSearch = nombreCompleto.includes(searchTerm.toLowerCase()) ||
                          (persona.unidad && persona.unidad.toLowerCase().includes(searchTerm.toLowerCase())) ||
                          (persona.organizacionNombre && persona.organizacionNombre.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesFiltro = filtro === 'Todos' || persona.nivel === filtro;
    return matchesSearch && matchesFiltro;
  });

  const totalPages = Math.ceil(personalFiltrado.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentItems = personalFiltrado.slice(startIndex, endIndex);

  const goToPage = (page: number) => {
    if (page >= 1 && page <= totalPages) setCurrentPage(page);
  };

  const getNivelColor = (nivel: string) => {
    switch(nivel) {
      case 'Vocero CC': return 'bg-blue-50 text-blue-600';
      case 'Vocero Comuna': return 'bg-green-50 text-green-600';
      case 'Vocero Sala': return 'bg-purple-50 text-purple-600';
      case 'Vocería': return 'bg-orange-50 text-orange-600';
      default: return 'bg-gray-50 text-gray-600';
    }
  };

  const getOrganizacionTipoTexto = (tipo: string) => {
    switch(tipo) {
      case 'consejo_comunal': return 'Consejo Comunal';
      case 'comuna': return 'Comuna';
      case 'sala_autogobierno': return 'Sala de Autogobierno';
      default: return tipo;
    }
  };

  const getCargoTexto = (persona: PersonalTerritorial) => {
    let texto = persona.unidad || 'Gestión';
    if (persona.comite && persona.comite !== 'Ninguno' && persona.comite !== '') {
      texto += ` - ${persona.comite}`;
    }
    if (persona.organizacionNombre) {
      texto += ` - ${getOrganizacionTipoTexto(persona.organizacionTipo)}: ${persona.organizacionNombre}`;
    }
    return texto;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-[#008f82]" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      <header className="border-b border-gray-100 px-4 md:px-6 py-3 md:py-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-2 md:gap-3">
          <div>
            <h1 className="text-sm md:text-lg font-black text-brand-primary uppercase tracking-tighter">
              Gestión de Liderazgo y Estructura Organizativa
            </h1>
            <p className="text-[8px] md:text-[9px] text-gray-400 font-bold uppercase tracking-widest mt-0.5">
              Secretaría de Participación Ciudadana - Municipio Carrizal
            </p>
          </div>
        </div>
      </header>

      <div className="p-3 md:p-6">
        {/* Panel de estadísticas */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4 mb-4 md:mb-6">
          {statsCards.map((stat, i) => (
            <ResumenBox key={i} label={stat.label} value={stat.value} sub={stat.sub} icon={stat.icon} />
          ))}
        </div>

        {/* Filtros */}
        <div className="bg-white p-2 md:p-3 rounded-lg md:rounded-xl shadow-sm border border-gray-100 mb-3 md:mb-5 flex flex-wrap items-center gap-2 md:gap-3">
          <div className="flex-1 min-w-37.5 md:min-w-50 relative">
            <Search className="absolute left-2 md:left-3 top-1/2 -translate-y-1/2 text-gray-400" size={12} />
            <input 
              type="text" 
              placeholder="Buscar por nombre, unidad u organización..." 
              className="w-full pl-7 md:pl-9 pr-2 md:pr-3 py-1 md:py-1.5 bg-gray-50 border border-gray-200 rounded-lg text-[9px] md:text-[11px] font-medium outline-none focus:ring-2 focus:ring-[#008f82]"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <div className="flex items-center gap-1 md:gap-2">
            <Filter size={12} className="text-gray-400" />
            <select 
              className="bg-gray-50 border border-gray-200 rounded-lg px-2 md:px-3 py-1 md:py-1.5 text-[8px] md:text-[9px] font-bold text-gray-600 outline-none"
              value={filtro}
              onChange={(e) => setFiltro(e.target.value)}
            >
              <option value="Todos">TODOS</option>
              <option value="Vocero CC">CONSEJOS COMUNALES</option>
              <option value="Vocero Comuna">COMUNAS</option>
              <option value="Vocero Sala">SALAS DE AUTOGOBIERNO</option>
              <option value="Vocería">VOCEROS</option>
            </select>
          </div>
        </div>

        {/* Tabla */}
        <div className="bg-white rounded-lg md:rounded-xl shadow-lg border border-gray-100 overflow-x-auto">
          {personalFiltrado.length === 0 ? (
            <div className="text-center py-12 text-gray-400">No hay voceros registrados</div>
          ) : (
            <table className="w-full text-left border-collapse min-w-125">
              <thead>
                <tr className="bg-brand-primary text-white uppercase text-[7px] md:text-[8px] tracking-[0.2em]">
                  <th className="p-2 md:p-3 font-black">Nombre y Apellido</th>
                  <th className="p-2 md:p-3 font-black">Unidad / Organización</th>
                  <th className="p-2 md:p-3 font-black">Nivel / Área</th>
                  <th className="p-2 md:p-3 font-black text-center">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {currentItems.map((persona) => (
                  <tr key={persona.id} className="hover:bg-teal-50/30 transition-colors cursor-pointer" onClick={() => { setSelectedPersonal(persona); setShowDetailModal(true); }}>
                    <td className="p-2 md:p-3">
                      <div className="flex items-center gap-1.5 md:gap-2">
                        <div className="w-6 h-6 md:w-7 md:h-7 rounded-full bg-gray-100 flex items-center justify-center text-[#006d64] font-bold text-[8px] md:text-[10px] border border-gray-200">
                          {persona.nombre.charAt(0)}{persona.apellido.charAt(0)}
                        </div>
                        <span className="text-[9px] md:text-[11px] font-semibold text-gray-800">{persona.nombre} {persona.apellido}</span>
                      </div>
                    </td>
                    <td className="p-2 md:p-3">
                      <p className="text-[9px] md:text-[11px] font-medium text-gray-700 wrap-break-words max-w-62.5">{getCargoTexto(persona)}</p>
                    </td>
                    <td className="p-2 md:p-3">
                      <span className={`text-[7px] md:text-[8px] font-black px-1.5 md:px-2 py-0.5 rounded-full uppercase ${getNivelColor(persona.nivel)}`}>
                        {persona.nivel}
                      </span>
                    </td>
                    <td className="p-2 md:p-3 text-center">
                      <button 
                        className="p-1 md:p-1.5 bg-gray-50 text-gray-500 rounded-lg hover:bg-[#008f82] hover:text-white transition border border-gray-100"
                        onClick={(e) => { e.stopPropagation(); setSelectedPersonal(persona); setShowDetailModal(true); }}
                      >
                        <Eye size={12} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {/* Paginación */}
        {totalPages > 1 && (
          <div className="flex flex-col md:flex-row items-center justify-between gap-3 mt-4 md:mt-5 pt-3 border-t border-gray-100">
            <p className="text-[7px] md:text-[9px] font-medium text-gray-500">
              Mostrando {startIndex + 1} - {Math.min(endIndex, personalFiltrado.length)} de {personalFiltrado.length}
            </p>
            <div className="flex gap-1 md:gap-1.5">
              <button onClick={() => goToPage(currentPage - 1)} disabled={currentPage === 1} className={cn("p-1 md:p-1.5 rounded-lg border border-gray-200 transition-all", currentPage === 1 ? "opacity-40 cursor-not-allowed" : "hover:bg-gray-50 hover:border-[#008f82]")}>
                <ChevronLeft size={12} className="text-gray-500" />
              </button>
              <div className="flex gap-0.5 md:gap-1">
                {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                  let pageNum;
                  if (totalPages <= 5) pageNum = i + 1;
                  else if (currentPage <= 3) pageNum = i + 1;
                  else if (currentPage >= totalPages - 2) pageNum = totalPages - 4 + i;
                  else pageNum = currentPage - 2 + i;
                  return (
                    <button key={pageNum} onClick={() => goToPage(pageNum)} className={cn("w-5 h-5 md:w-7 md:h-7 rounded-lg text-[8px] md:text-[10px] font-bold transition-all", currentPage === pageNum ? "bg-[#008f82] text-white shadow-sm" : "bg-white border border-gray-200 text-gray-600 hover:bg-gray-50 hover:border-[#008f82]")}>
                      {pageNum}
                    </button>
                  );
                })}
              </div>
              <button onClick={() => goToPage(currentPage + 1)} disabled={currentPage === totalPages} className={cn("p-1 md:p-1.5 rounded-lg border border-gray-200 transition-all", currentPage === totalPages ? "opacity-40 cursor-not-allowed" : "hover:bg-gray-50 hover:border-[#008f82]")}>
                <ChevronRight size={12} className="text-gray-500" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Modal de detalle (sin cambios) */}
      <AnimatePresence>
        {showDetailModal && selectedPersonal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-3 md:p-4">
            <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={() => setShowDetailModal(false)} />
            <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.9 }} className="relative w-[90%] max-w-md bg-white rounded-lg md:rounded-xl shadow-2xl overflow-hidden max-h-[90vh] overflow-y-auto">
              <div className="p-3 md:p-4 border-b border-gray-100 flex items-center justify-between bg-linear-to-r from-brand-primary to-[#006d64] sticky top-0">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 md:w-8 md:h-8 rounded-lg bg-white/20 flex items-center justify-center">
                    <Users className="h-3.5 w-3.5 md:h-4 md:w-4 text-white" />
                  </div>
                  <div>
                    <h4 className="text-xs md:text-sm font-black text-white uppercase tracking-tighter">{selectedPersonal.nombre} {selectedPersonal.apellido}</h4>
                    <p className="text-[7px] md:text-[8px] text-white/70 font-bold uppercase tracking-widest">{selectedPersonal.nivel}</p>
                  </div>
                </div>
                <button onClick={() => setShowDetailModal(false)} className="p-0.5 md:p-1 rounded-lg bg-white/10 text-white hover:bg-white/20">
                  <XCircle size={14} />
                </button>
              </div>
              <div className="p-4 md:p-5 space-y-3">
                <div className="space-y-2">
                  <h5 className="text-[8px] md:text-[9px] font-black text-brand-primary uppercase tracking-wider">Datos del Vocero</h5>
                  <div className="grid grid-cols-2 gap-2 md:gap-3">
                    <div className="bg-gray-50 p-2 md:p-2.5 rounded-lg">
                      <p className="text-[6px] md:text-[7px] font-black text-gray-400 uppercase tracking-wider">Cédula</p>
                      <p className="text-[10px] md:text-[11px] font-bold text-gray-800 mt-0.5">{selectedPersonal.cedula || 'No registrada'}</p>
                    </div>
                    <div className="bg-gray-50 p-2 md:p-2.5 rounded-lg">
                      <p className="text-[6px] md:text-[7px] font-black text-gray-400 uppercase tracking-wider">Teléfono</p>
                      <p className="text-[10px] md:text-[11px] font-bold text-gray-800 mt-0.5">{selectedPersonal.telefono || 'No registrado'}</p>
                    </div>
                    {selectedPersonal.email && (
                      <div className="bg-gray-50 p-2 md:p-2.5 rounded-lg col-span-2">
                        <p className="text-[6px] md:text-[7px] font-black text-gray-400 uppercase tracking-wider">Email</p>
                        <p className="text-[10px] md:text-[11px] font-bold text-gray-800 mt-0.5">{selectedPersonal.email}</p>
                      </div>
                    )}
                  </div>
                </div>
                <div className="space-y-2">
                  <h5 className="text-[8px] md:text-[9px] font-black text-brand-primary uppercase tracking-wider">Datos de la Organización</h5>
                  {selectedPersonal.unidad && <div className="bg-gray-50 p-2 md:p-2.5 rounded-lg"><p className="text-[6px] md:text-[7px] font-black text-gray-400 uppercase tracking-wider">Unidad</p><p className="text-[10px] md:text-[11px] font-bold text-gray-800 mt-0.5">{selectedPersonal.unidad}</p></div>}
                  {selectedPersonal.comite && selectedPersonal.comite !== 'Ninguno' && <div className="bg-gray-50 p-2 md:p-2.5 rounded-lg"><p className="text-[6px] md:text-[7px] font-black text-gray-400 uppercase tracking-wider">Comité</p><p className="text-[10px] md:text-[11px] font-bold text-gray-800 mt-0.5">{selectedPersonal.comite}</p></div>}
                  {selectedPersonal.organizacionNombre && <div className="bg-gray-50 p-2 md:p-2.5 rounded-lg"><p className="text-[6px] md:text-[7px] font-black text-gray-400 uppercase tracking-wider">Organización</p><p className="text-[10px] md:text-[11px] font-bold text-gray-800 mt-0.5">{getOrganizacionTipoTexto(selectedPersonal.organizacionTipo)}: {selectedPersonal.organizacionNombre}</p></div>}
                </div>
                <div className="flex gap-2 pt-2">
                  <button onClick={() => setShowDetailModal(false)} className="flex-1 py-1.5 md:py-2 rounded-lg bg-gray-100 text-gray-600 text-[8px] md:text-[9px] font-black uppercase tracking-widest hover:bg-gray-200 transition-all">Cerrar</button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};