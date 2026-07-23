'use client';

import React, { useState, useEffect } from 'react';
import { 
  Monitor, Wifi, Server, Settings, HardDrive, Smartphone,
  CheckCircle2, Globe, Clock, Activity, Box, Cpu,
  Maximize, ShieldCheck, Zap, Building2, Loader2,
  Search, ChevronLeft, ChevronRight, Eye, FileText, Accessibility,
  Signal, Video, EthernetPort, Droplets, Home, DoorClosed,
  Lightbulb, Wind, Layout, Users, XCircle
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/app/lib/utils';
import { supabase } from '@/app/lib/supabaseClient';

// ==================== COMPONENTES DE UI REUTILIZABLES ====================
// Tarjeta clickeable para estadísticas
const AssetSummaryCard = ({ title, count, icon: Icon, color, subtitle, isActive, onClick }: any) => (
  <div 
    onClick={onClick}
    className={cn(
      "bg-white p-4 rounded-2xl border shadow-sm flex items-center gap-4 cursor-pointer transition-all",
      isActive ? "border-brand-primary ring-2 ring-brand-primary/20 bg-brand-primary/5" : "border-slate-100 hover:border-brand-primary/30"
    )}
  >
    <div className={cn("w-10 h-10 rounded-xl bg-slate-50 flex items-center justify-center", color)}>
      <Icon size={20} />
    </div>
    <div>
      <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">{title}</p>
      <p className="text-xl font-black text-slate-900 leading-none mt-0.5">{count}</p>
      {subtitle && <p className="text-[8px] text-slate-400 mt-0.5">{subtitle}</p>}
    </div>
  </div>
);

const Pagination = ({ currentPage, totalPages, onPageChange }: { currentPage: number; totalPages: number; onPageChange: (page: number) => void }) => {
  if (totalPages <= 1) return null;
  return (
    <div className="px-6 py-4 bg-slate-50/50 border-t border-slate-100 flex items-center justify-between">
      <div className="text-xs text-slate-500">Página {currentPage} de {totalPages}</div>
      <div className="flex gap-1">
        <button onClick={() => onPageChange(currentPage - 1)} disabled={currentPage === 1} className="p-2 rounded-lg border border-slate-200 disabled:opacity-50"><ChevronLeft size={16} /></button>
        {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
          let pageNum = i + 1;
          if (totalPages > 5 && currentPage > 3) pageNum = currentPage - 2 + i;
          if (pageNum > totalPages) return null;
          return (
            <button key={pageNum} onClick={() => onPageChange(pageNum)} className={cn("w-8 h-8 rounded-lg text-xs font-bold", currentPage === pageNum ? "bg-brand-primary text-white" : "text-slate-600 hover:bg-brand-primary/10 border border-slate-200")}>
              {pageNum}
            </button>
          );
        })}
        <button onClick={() => onPageChange(currentPage + 1)} disabled={currentPage === totalPages} className="p-2 rounded-lg border border-slate-200 disabled:opacity-50"><ChevronRight size={16} /></button>
      </div>
    </div>
  );
};

// ==================== FUNCIONES AUXILIARES ====================
const isValidValue = (value: string | null): boolean => {
  if (!value || value === '—') return false;
  const lowerValue = value.toLowerCase().trim();
  return lowerValue !== 'no aplica' && lowerValue !== 'n/a';
};

const isExcellentOrGood = (value: string | null): boolean => {
  if (!value) return false;
  const lowerValue = value.toLowerCase().trim();
  return lowerValue === 'excelente' || lowerValue === 'bueno';
};

const getTotalSalas = async (): Promise<number> => {
  const { count, error } = await supabase
    .from('datos_sala_autogobierno')
    .select('*', { count: 'exact', head: true });
  if (error) {
    console.error('Error obteniendo total de salas:', error);
    return 0;
  }
  return count || 0;
};

// ==================== 1. ESPACIO FÍSICO Y MOBILIARIO (con filtro) ====================
interface EspacioData {
  id_infraestructura: number;
  nombre_sala: string;
  comuna_nombre: string;
  capacidad_optima: string;
  estado_estructural: string;
  mobiliario_suficiente: string;
  mobiliario_desc: string;
  distribucion_debate: string;
  iluminacion: string;
  iluminacion_desc: string | null;
  ventilacion: string;
  ventilacion_desc: string | null;
}

type EspacioFilter = 'capacidad' | 'estado_bueno' | 'mobiliario' | null;

const EspacioFisicoList = () => {
  const [data, setData] = useState<EspacioData[]>([]);
  const [totalSalas, setTotalSalas] = useState<number>(0);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [activeFilter, setActiveFilter] = useState<EspacioFilter>(null);
  const itemsPerPage = 6;

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      const total = await getTotalSalas();
      setTotalSalas(total);
      
      const { data: infra, error } = await supabase
        .from('infraestructura_sala')
        .select(`
          id_infraestructura,
          capacidad_optima,
          estado_estructural,
          mobiliario_suficiente,
          mobiliario_desc,
          distribucion_debate,
          iluminacion,
          iluminacion_desc,
          ventilacion,
          ventilacion_desc,
          id_sala,
          datos_sala_autogobierno!inner (
            nombre_sala,
            id_sector,
            sectores!inner (
              id_datos_comuna,
              datos_comuna!inner (nombre_comuna)
            )
          )
        `);
      if (error) {
        console.error('Error cargando datos:', error);
        setData([]);
      } else if (infra) {
        const formatted = infra.map((item: any) => ({
          id_infraestructura: item.id_infraestructura,
          nombre_sala: item.datos_sala_autogobierno?.nombre_sala || 'Sin sala',
          comuna_nombre: item.datos_sala_autogobierno?.sectores?.datos_comuna?.nombre_comuna || 'Sin comuna',
          capacidad_optima: item.capacidad_optima || '—',
          estado_estructural: item.estado_estructural || '—',
          mobiliario_suficiente: item.mobiliario_suficiente || '—',
          mobiliario_desc: item.mobiliario_desc || '—',
          distribucion_debate: item.distribucion_debate || '—',
          iluminacion: item.iluminacion || '—',
          iluminacion_desc: item.iluminacion_desc,
          ventilacion: item.ventilacion || '—',
          ventilacion_desc: item.ventilacion_desc
        }));
        setData(formatted);
      }
      setLoading(false);
    };
    fetchData();
  }, []);

  // Aplicar filtro según la tarjeta seleccionada
  const filteredData = data.filter(item => {
    if (activeFilter === 'capacidad') return item.capacidad_optima === 'Sí';
    if (activeFilter === 'estado_bueno') return item.estado_estructural === 'Excelente' || item.estado_estructural === 'Bueno';
    if (activeFilter === 'mobiliario') return item.mobiliario_suficiente === 'Sí';
    return true;
  });

  const filtered = filteredData.filter(item => 
    item.nombre_sala.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.comuna_nombre.toLowerCase().includes(searchTerm.toLowerCase())
  );
  const paginated = filtered.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);
  const totalPages = Math.ceil(filtered.length / itemsPerPage);

  const getStatusColor = (status: string) => {
    switch(status) {
      case 'Excelente': return 'bg-green-100 text-green-700';
      case 'Bueno': return 'bg-emerald-100 text-emerald-700';
      case 'Regular': return 'bg-amber-100 text-amber-700';
      case 'Malo': return 'bg-orange-100 text-orange-700';
      case 'Crítico': return 'bg-rose-100 text-rose-700';
      default: return 'bg-gray-100 text-gray-500';
    }
  };

  const clearFilter = () => setActiveFilter(null);

  if (loading) return <div className="p-8 text-center"><Loader2 className="animate-spin text-brand-primary mx-auto" size={28} /></div>;

  const totalRegistros = data.length;
  const capacidadCount = data.filter(d => d.capacidad_optima === 'Sí').length;
  const estadoBuenoCount = data.filter(d => d.estado_estructural === 'Excelente' || d.estado_estructural === 'Bueno').length;
  const mobiliarioCount = data.filter(d => d.mobiliario_suficiente === 'Sí').length;

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <AssetSummaryCard 
          title="Salas Evaluadas" 
          count={`${totalRegistros}/${totalSalas}`} 
          icon={Building2} 
          color="text-blue-500"
          subtitle={`${totalRegistros} de ${totalSalas} salas registradas`}
          isActive={activeFilter === null}
          onClick={clearFilter}
        />
        <AssetSummaryCard 
          title="Capacidad Óptima" 
          count={capacidadCount} 
          icon={CheckCircle2} 
          color="text-green-500"
          isActive={activeFilter === 'capacidad'}
          onClick={() => setActiveFilter(activeFilter === 'capacidad' ? null : 'capacidad')}
        />
        <AssetSummaryCard 
          title="Estado Bueno/Excelente" 
          count={estadoBuenoCount} 
          icon={ShieldCheck} 
          color="text-emerald-500"
          isActive={activeFilter === 'estado_bueno'}
          onClick={() => setActiveFilter(activeFilter === 'estado_bueno' ? null : 'estado_bueno')}
        />
        <AssetSummaryCard 
          title="Mobiliario Suficiente" 
          count={mobiliarioCount} 
          icon={Box} 
          color="text-purple-500"
          isActive={activeFilter === 'mobiliario'}
          onClick={() => setActiveFilter(activeFilter === 'mobiliario' ? null : 'mobiliario')}
        />
      </div>

      <div className="flex justify-between items-center">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
          <input 
            type="text" 
            placeholder="Buscar por sala o comuna..." 
            value={searchTerm} 
            onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }} 
            className="pl-10 pr-4 py-2 bg-white border border-slate-200 rounded-xl text-xs font-medium outline-none focus:ring-2 focus:ring-brand-primary/20 w-80" 
          />
        </div>
        {activeFilter && (
          <button onClick={clearFilter} className="flex items-center gap-1 text-[9px] font-bold text-brand-primary bg-brand-primary/10 px-3 py-1.5 rounded-full">
            <XCircle size={12} /> Limpiar filtro
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {paginated.map((sala) => (
          <div key={sala.id_infraestructura} className="bg-white rounded-2xl border border-slate-100 shadow-sm hover:shadow-md transition-all duration-200 overflow-hidden">
            <div className="p-5">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h4 className="text-xs font-black text-brand-primary uppercase tracking-tight">{sala.nombre_sala}</h4>
                  <p className="text-[9px] text-slate-400 font-bold uppercase mt-0.5">{sala.comuna_nombre}</p>
                </div>
                <span className={cn("px-2 py-1 rounded-lg text-[8px] font-black uppercase", getStatusColor(sala.estado_estructural))}>
                  {sala.estado_estructural}
                </span>
              </div>

              <div className="space-y-3">
                <div className="flex items-center justify-between text-[10px]">
                  <div className="flex items-center gap-2">
                    <Users size={12} className="text-slate-400" />
                    <span className="font-bold text-slate-600">Capacidad óptima:</span>
                    <span className={cn(sala.capacidad_optima === 'Sí' ? "text-green-600" : "text-amber-600")}>{sala.capacidad_optima}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Layout size={12} className="text-slate-400" />
                    <span className="font-bold text-slate-600">Distribución:</span>
                    <span className="text-slate-700">{sala.distribucion_debate}</span>
                  </div>
                </div>

                <div className="flex items-center gap-2 text-[10px]">
                  <Box size={12} className="text-slate-400" />
                  <span className="font-bold text-slate-600">Mobiliario:</span>
                  <span className={cn(sala.mobiliario_suficiente === 'Sí' ? "text-green-600" : "text-amber-600")}>{sala.mobiliario_suficiente}</span>
                  {sala.mobiliario_desc !== '—' && (
                    <span className="text-[8px] text-slate-400 italic truncate">({sala.mobiliario_desc.substring(0, 50)}...)</span>
                  )}
                </div>

                <div className="flex items-center gap-2 text-[10px]">
                  <Lightbulb size={12} className="text-slate-400" />
                  <span className="font-bold text-slate-600">Iluminación:</span>
                  <span className="text-slate-700">{sala.iluminacion}</span>
                  {sala.iluminacion_desc && (
                    <span className="text-[8px] text-slate-400 italic">({sala.iluminacion_desc})</span>
                  )}
                </div>

                <div className="flex items-center gap-2 text-[10px]">
                  <Wind size={12} className="text-slate-400" />
                  <span className="font-bold text-slate-600">Ventilación:</span>
                  <span className="text-slate-700">{sala.ventilacion}</span>
                  {sala.ventilacion_desc && (
                    <span className="text-[8px] text-slate-400 italic">({sala.ventilacion_desc})</span>
                  )}
                </div>
              </div>

              <div className="mt-5 pt-3 border-t border-slate-50">
                <div className="flex justify-between items-center text-[8px] font-black uppercase text-slate-400 mb-1">
                  <span>Estado general del espacio</span>
                  <span>{sala.estado_estructural}</span>
                </div>
                <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
                  <div className={cn(
                    "h-full",
                    sala.estado_estructural === 'Excelente' ? "w-full bg-green-500" :
                    sala.estado_estructural === 'Bueno' ? "w-3/4 bg-emerald-500" :
                    sala.estado_estructural === 'Regular' ? "w-1/2 bg-amber-500" :
                    sala.estado_estructural === 'Malo' ? "w-1/4 bg-orange-500" : "w-1/6 bg-rose-500"
                  )} />
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {filtered.length === 0 && (
        <div className="bg-white rounded-3xl border border-slate-100 p-12 text-center text-slate-400">
          {activeFilter ? "No hay salas que cumplan con el filtro seleccionado" : "No hay registros de infraestructura"}
        </div>
      )}

      <Pagination currentPage={currentPage} totalPages={totalPages} onPageChange={setCurrentPage} />
    </motion.div>
  );
};

// ==================== 2. CONECTIVIDAD Y HARDWARE (con filtro) ====================
interface ConectividadData {
  id_infraestructura: number;
  nombre_sala: string;
  comuna_nombre: string;
  acceso_internet: string;
  tipo_conexion: string | null;
  pantallas_audio: string;
  pantallas_desc: string | null;
  equipos_funcionales: string | null;
  equipos_desc: string | null;
  estado_hardware: string;
  hardware_desc: string | null;
}

type ConectividadFilter = 'internet' | 'fibra' | 'hardware_excelente' | null;

const ConectividadHardwareList = () => {
  const [data, setData] = useState<ConectividadData[]>([]);
  const [totalSalas, setTotalSalas] = useState<number>(0);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [activeFilter, setActiveFilter] = useState<ConectividadFilter>(null);
  const itemsPerPage = 6;

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      const total = await getTotalSalas();
      setTotalSalas(total);
      
      const { data: infra, error } = await supabase
        .from('infraestructura_sala')
        .select(`
          id_infraestructura,
          acceso_internet,
          tipo_conexion,
          pantallas_audio,
          pantallas_desc,
          equipos_funcionales,
          equipos_desc,
          estado_hardware,
          hardware_desc,
          id_sala,
          datos_sala_autogobierno!inner (
            nombre_sala,
            id_sector,
            sectores!inner (
              id_datos_comuna,
              datos_comuna!inner (nombre_comuna)
            )
          )
        `);
      if (error) {
        console.error('Error cargando datos:', error);
        setData([]);
      } else if (infra) {
        const formatted = infra.map((item: any) => ({
          id_infraestructura: item.id_infraestructura,
          nombre_sala: item.datos_sala_autogobierno?.nombre_sala || 'Sin sala',
          comuna_nombre: item.datos_sala_autogobierno?.sectores?.datos_comuna?.nombre_comuna || 'Sin comuna',
          acceso_internet: item.acceso_internet || '—',
          tipo_conexion: item.tipo_conexion || '—',
          pantallas_audio: item.pantallas_audio || '—',
          pantallas_desc: item.pantallas_desc,
          equipos_funcionales: item.equipos_funcionales || '—',
          equipos_desc: item.equipos_desc,
          estado_hardware: item.estado_hardware || '—',
          hardware_desc: item.hardware_desc
        }));
        setData(formatted);
      }
      setLoading(false);
    };
    fetchData();
  }, []);

  const filteredData = data.filter(item => {
    if (activeFilter === 'internet') return item.acceso_internet !== 'No disponible' && item.acceso_internet !== '—';
    if (activeFilter === 'fibra') return item.tipo_conexion === 'Fibra Óptica';
    if (activeFilter === 'hardware_excelente') return item.estado_hardware === 'Excelente';
    return true;
  });

  const filtered = filteredData.filter(item => 
    item.nombre_sala.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.comuna_nombre.toLowerCase().includes(searchTerm.toLowerCase())
  );
  const paginated = filtered.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);
  const totalPages = Math.ceil(filtered.length / itemsPerPage);

  const totalSalasCount = data.length;
  const salasConInternet = data.filter(d => d.acceso_internet !== 'No disponible' && d.acceso_internet !== '—').length;
  const hardwareExcelente = data.filter(d => d.estado_hardware === 'Excelente').length;
  const totalEquipos = data.reduce((acc, item) => {
    if (item.equipos_funcionales && item.equipos_funcionales !== '—') {
      const equipos = item.equipos_funcionales.split(',').map(e => e.trim());
      return acc + equipos.length;
    }
    return acc;
  }, 0);
  const fibraOptica = data.filter(d => d.tipo_conexion === 'Fibra Óptica').length;

  const getHardwareHealth = (estado: string) => {
    switch(estado) {
      case 'Excelente': return { width: '100%', color: 'bg-green-500', label: 'Óptimo' };
      case 'Bueno': return { width: '75%', color: 'bg-emerald-500', label: 'Bueno' };
      case 'Regular': return { width: '50%', color: 'bg-amber-500', label: 'Regular' };
      default: return { width: '25%', color: 'bg-rose-500', label: 'Crítico' };
    }
  };

  const clearFilter = () => setActiveFilter(null);

  if (loading) return <div className="p-8 text-center"><Loader2 className="animate-spin text-brand-primary mx-auto" size={28} /></div>;

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <AssetSummaryCard 
          title="Salas con Internet" 
          count={`${salasConInternet}/${totalSalasCount}`} 
          icon={Wifi} 
          color="text-blue-500"
          isActive={activeFilter === 'internet'}
          onClick={() => setActiveFilter(activeFilter === 'internet' ? null : 'internet')}
        />
        <AssetSummaryCard 
          title="Tipo Fibra Óptica" 
          count={fibraOptica} 
          icon={Globe} 
          color="text-green-500"
          isActive={activeFilter === 'fibra'}
          onClick={() => setActiveFilter(activeFilter === 'fibra' ? null : 'fibra')}
        />
        <AssetSummaryCard 
          title="Equipos Funcionales" 
          count={totalEquipos} 
          icon={Monitor} 
          color="text-purple-500"
          isActive={false}
          onClick={() => {}} // no aplica filtro para equipos
        />
        <AssetSummaryCard 
          title="Hardware Excelente" 
          count={`${hardwareExcelente}/${totalSalasCount}`} 
          icon={Cpu} 
          color="text-emerald-500"
          isActive={activeFilter === 'hardware_excelente'}
          onClick={() => setActiveFilter(activeFilter === 'hardware_excelente' ? null : 'hardware_excelente')}
        />
      </div>

      <div className="flex justify-between items-center">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
          <input 
            type="text" 
            placeholder="Buscar por sala o comuna..." 
            value={searchTerm} 
            onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }} 
            className="pl-10 pr-4 py-2 bg-white border border-slate-200 rounded-xl text-xs font-medium outline-none focus:ring-2 focus:ring-brand-primary/20 w-80" 
          />
        </div>
        {activeFilter && (
          <button onClick={clearFilter} className="flex items-center gap-1 text-[9px] font-bold text-brand-primary bg-brand-primary/10 px-3 py-1.5 rounded-full">
            <XCircle size={12} /> Limpiar filtro
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {paginated.map((sala) => {
          const health = getHardwareHealth(sala.estado_hardware);
          return (
            <div key={sala.id_infraestructura} className="bg-white rounded-2xl border border-slate-100 shadow-sm hover:shadow-md transition-all duration-200 overflow-hidden">
              <div className="p-5">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h4 className="text-xs font-black text-brand-primary uppercase tracking-tight">{sala.nombre_sala}</h4>
                    <p className="text-[9px] text-slate-400 font-bold uppercase mt-0.5">{sala.comuna_nombre}</p>
                  </div>
                  <span className={cn(
                    "px-2 py-1 rounded-lg text-[8px] font-black uppercase",
                    sala.estado_hardware === 'Excelente' ? "bg-green-100 text-green-700" :
                    sala.estado_hardware === 'Bueno' ? "bg-emerald-100 text-emerald-700" :
                    sala.estado_hardware === 'Regular' ? "bg-amber-100 text-amber-700" : "bg-rose-100 text-rose-700"
                  )}>
                    {sala.estado_hardware}
                  </span>
                </div>

                <div className="space-y-3">
                  <div className="flex items-center justify-between text-[10px]">
                    <div className="flex items-center gap-2">
                      <Wifi size={12} className="text-slate-400" />
                      <span className="font-bold text-slate-600">Internet:</span>
                      <span className={cn(
                        sala.acceso_internet === 'Estable' ? "text-green-600" : 
                        sala.acceso_internet === 'Intermitente' ? "text-amber-600" : "text-rose-600"
                      )}>{sala.acceso_internet}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <EthernetPort size={12} className="text-slate-400" />
                      <span className="font-bold text-slate-600">Conexión:</span>
                      <span className="text-slate-700">{sala.tipo_conexion}</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 text-[10px]">
                    <Video size={12} className="text-slate-400" />
                    <span className="font-bold text-slate-600">Pantallas/Audio:</span>
                    <span className="text-slate-700 flex-1">{sala.pantallas_audio}</span>
                    {sala.pantallas_desc && (
                      <span className="text-[8px] text-slate-400 italic truncate max-w-25">({sala.pantallas_desc})</span>
                    )}
                  </div>

                  <div className="flex items-start gap-2 text-[10px]">
                    <Monitor size={12} className="text-slate-400 mt-0.5" />
                    <span className="font-bold text-slate-600">Equipos funcionales:</span>
                    <span className="text-slate-700 flex-1 wrap-break-words">{sala.equipos_funcionales}</span>
                  </div>
                  {sala.equipos_desc && (
                    <div className="text-[9px] text-slate-400 italic pl-6 border-l-2 border-slate-100 ml-1">
                      {sala.equipos_desc}
                    </div>
                  )}
                </div>

                <div className="mt-5 pt-3 border-t border-slate-50">
                  <div className="flex justify-between items-center text-[8px] font-black uppercase text-slate-400 mb-1">
                    <span>Salud del hardware</span>
                    <span>{health.label}</span>
                  </div>
                  <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
                    <div className={cn("h-full", health.color)} style={{ width: health.width }} />
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {filtered.length === 0 && (
        <div className="bg-white rounded-3xl border border-slate-100 p-12 text-center text-slate-400">
          {activeFilter ? "No hay salas que cumplan con el filtro seleccionado" : "No hay registros de conectividad o hardware"}
        </div>
      )}

      <Pagination currentPage={currentPage} totalPages={totalPages} onPageChange={setCurrentPage} />
    </motion.div>
  );
};

// ==================== 3. SERVICIOS COMPLEMENTARIOS (con filtro) ====================
interface ServiciosData {
  id_infraestructura: number;
  nombre_sala: string;
  comuna_nombre: string;
  rampas_acceso: string | null;
  senaletica: string | null;
  sanitarios: string | null;
  agua_potable: string | null;
  identidad_estetica: string | null;
  seguridad_cerraduras: string | null;
}

type ServiciosFilter = 'rampas' | 'senaletica' | 'sanitarios' | 'agua' | 'identidad' | 'seguridad' | null;

const ServiciosComplementariosList = () => {
  const [data, setData] = useState<ServiciosData[]>([]);
  const [totalSalas, setTotalSalas] = useState<number>(0);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [activeFilter, setActiveFilter] = useState<ServiciosFilter>(null);
  const itemsPerPage = 6;

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      const total = await getTotalSalas();
      setTotalSalas(total);
      
      const { data: infra, error } = await supabase
        .from('infraestructura_sala')
        .select(`
          id_infraestructura,
          rampas_acceso,
          senaletica,
          sanitarios,
          agua_potable,
          identidad_estetica,
          seguridad_cerraduras,
          id_sala,
          datos_sala_autogobierno!inner (
            nombre_sala,
            id_sector,
            sectores!inner (
              id_datos_comuna,
              datos_comuna!inner (nombre_comuna)
            )
          )
        `);
      if (error) {
        console.error('Error cargando datos:', error);
        setData([]);
      } else if (infra) {
        const formatted = infra.map((item: any) => ({
          id_infraestructura: item.id_infraestructura,
          nombre_sala: item.datos_sala_autogobierno?.nombre_sala || 'Sin sala',
          comuna_nombre: item.datos_sala_autogobierno?.sectores?.datos_comuna?.nombre_comuna || 'Sin comuna',
          rampas_acceso: item.rampas_acceso || '—',
          senaletica: item.senaletica || '—',
          sanitarios: item.sanitarios || '—',
          agua_potable: item.agua_potable || '—',
          identidad_estetica: item.identidad_estetica || '—',
          seguridad_cerraduras: item.seguridad_cerraduras || '—'
        }));
        setData(formatted);
      }
      setLoading(false);
    };
    fetchData();
  }, []);

  // Lógica de filtro según la característica seleccionada
  const filteredData = data.filter(item => {
    if (activeFilter === 'rampas') return isValidValue(item.rampas_acceso);
    if (activeFilter === 'senaletica') return isExcellentOrGood(item.senaletica);
    if (activeFilter === 'sanitarios') return isExcellentOrGood(item.sanitarios);
    if (activeFilter === 'agua') return isValidValue(item.agua_potable);
    if (activeFilter === 'identidad') return isValidValue(item.identidad_estetica);
    if (activeFilter === 'seguridad') return isValidValue(item.seguridad_cerraduras);
    return true;
  });

  const filtered = filteredData.filter(item => 
    item.nombre_sala.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.comuna_nombre.toLowerCase().includes(searchTerm.toLowerCase())
  );
  const paginated = filtered.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);
  const totalPages = Math.ceil(filtered.length / itemsPerPage);

  // Totales generales (sin filtro)
  const totalRegistros = data.length;
  const salasConRampas = data.filter(d => isValidValue(d.rampas_acceso)).length;
  const salasConSenaletica = data.filter(d => isExcellentOrGood(d.senaletica)).length;
  const salasConSanitarios = data.filter(d => isExcellentOrGood(d.sanitarios)).length;
  const salasConAguaPotable = data.filter(d => isValidValue(d.agua_potable)).length;
  const salasConIdentidad = data.filter(d => isValidValue(d.identidad_estetica)).length;
  const salasConSeguridad = data.filter(d => isValidValue(d.seguridad_cerraduras)).length;

  const getStatusBadge = (value: string | null) => {
    if (!isValidValue(value)) {
      return { color: "bg-gray-100 text-gray-400", label: value || 'No registrado' };
    }
    if (isExcellentOrGood(value)) {
      return { color: "bg-green-100 text-green-700", label: value };
    }
    return { color: "bg-amber-100 text-amber-700", label: value };
  };

  const clearFilter = () => setActiveFilter(null);

  if (loading) return <div className="p-8 text-center"><Loader2 className="animate-spin text-brand-primary mx-auto" size={28} /></div>;

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <AssetSummaryCard 
          title="Salas con Rampas/Acceso" 
          count={`${salasConRampas}/${totalRegistros}`} 
          icon={Accessibility} 
          color="text-blue-500"
          isActive={activeFilter === 'rampas'}
          onClick={() => setActiveFilter(activeFilter === 'rampas' ? null : 'rampas')}
        />
        <AssetSummaryCard 
          title="Salas con Señalética (Excelente/Bueno)" 
          count={`${salasConSenaletica}/${totalRegistros}`} 
          icon={FileText} 
          color="text-green-500"
          isActive={activeFilter === 'senaletica'}
          onClick={() => setActiveFilter(activeFilter === 'senaletica' ? null : 'senaletica')}
        />
        <AssetSummaryCard 
          title="Salas con Sanitarios Adecuados" 
          count={`${salasConSanitarios}/${totalRegistros}`} 
          icon={Home} 
          color="text-purple-500"
          isActive={activeFilter === 'sanitarios'}
          onClick={() => setActiveFilter(activeFilter === 'sanitarios' ? null : 'sanitarios')}
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <AssetSummaryCard 
          title="Salas con Agua Potable" 
          count={`${salasConAguaPotable}/${totalRegistros}`} 
          icon={Droplets} 
          color="text-cyan-500"
          isActive={activeFilter === 'agua'}
          onClick={() => setActiveFilter(activeFilter === 'agua' ? null : 'agua')}
        />
        <AssetSummaryCard 
          title="Identidad Estética Definida" 
          count={`${salasConIdentidad}/${totalRegistros}`} 
          icon={Eye} 
          color="text-amber-500"
          isActive={activeFilter === 'identidad'}
          onClick={() => setActiveFilter(activeFilter === 'identidad' ? null : 'identidad')}
        />
        <AssetSummaryCard 
          title="Seguridad/Cerraduras" 
          count={`${salasConSeguridad}/${totalRegistros}`} 
          icon={DoorClosed} 
          color="text-red-500"
          isActive={activeFilter === 'seguridad'}
          onClick={() => setActiveFilter(activeFilter === 'seguridad' ? null : 'seguridad')}
        />
      </div>

      <div className="flex justify-between items-center">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
          <input 
            type="text" 
            placeholder="Buscar por sala o comuna..." 
            value={searchTerm} 
            onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }} 
            className="pl-10 pr-4 py-2 bg-white border border-slate-200 rounded-xl text-xs font-medium outline-none focus:ring-2 focus:ring-brand-primary/20 w-80" 
          />
        </div>
        {activeFilter && (
          <button onClick={clearFilter} className="flex items-center gap-1 text-[9px] font-bold text-brand-primary bg-brand-primary/10 px-3 py-1.5 rounded-full">
            <XCircle size={12} /> Limpiar filtro
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {paginated.map((sala) => {
          const rampasBadge = getStatusBadge(sala.rampas_acceso);
          const senaleticaBadge = getStatusBadge(sala.senaletica);
          const sanitariosBadge = getStatusBadge(sala.sanitarios);
          const aguaBadge = getStatusBadge(sala.agua_potable);
          const identidadBadge = getStatusBadge(sala.identidad_estetica);
          const seguridadBadge = getStatusBadge(sala.seguridad_cerraduras);

          return (
            <div key={sala.id_infraestructura} className="bg-white rounded-2xl border border-slate-100 shadow-sm hover:shadow-md transition-all duration-200 overflow-hidden">
              <div className="p-5">
                <div className="mb-4">
                  <h4 className="text-xs font-black text-brand-primary uppercase tracking-tight">{sala.nombre_sala}</h4>
                  <p className="text-[9px] text-slate-400 font-bold uppercase mt-0.5">{sala.comuna_nombre}</p>
                </div>

                <div className="space-y-3">
                  <div className="flex items-center justify-between text-[10px]">
                    <div className="flex items-center gap-2">
                      <Accessibility size={12} className="text-slate-400" />
                      <span className="font-bold text-slate-600">Rampas/Acceso:</span>
                    </div>
                    <span className={cn("px-2 py-0.5 rounded-lg text-[9px] font-bold", rampasBadge.color)}>
                      {rampasBadge.label}
                    </span>
                  </div>

                  <div className="flex items-center justify-between text-[10px]">
                    <div className="flex items-center gap-2">
                      <FileText size={12} className="text-slate-400" />
                      <span className="font-bold text-slate-600">Señalética:</span>
                    </div>
                    <span className={cn("px-2 py-0.5 rounded-lg text-[9px] font-bold", senaleticaBadge.color)}>
                      {senaleticaBadge.label}
                    </span>
                  </div>

                  <div className="flex items-center justify-between text-[10px]">
                    <div className="flex items-center gap-2">
                      <Home size={12} className="text-slate-400" />
                      <span className="font-bold text-slate-600">Sanitarios:</span>
                    </div>
                    <span className={cn("px-2 py-0.5 rounded-lg text-[9px] font-bold", sanitariosBadge.color)}>
                      {sanitariosBadge.label}
                    </span>
                  </div>

                  <div className="flex items-center justify-between text-[10px]">
                    <div className="flex items-center gap-2">
                      <Droplets size={12} className="text-slate-400" />
                      <span className="font-bold text-slate-600">Agua Potable:</span>
                    </div>
                    <span className={cn("px-2 py-0.5 rounded-lg text-[9px] font-bold", aguaBadge.color)}>
                      {aguaBadge.label}
                    </span>
                  </div>

                  <div className="flex items-center justify-between text-[10px]">
                    <div className="flex items-center gap-2">
                      <Eye size={12} className="text-slate-400" />
                      <span className="font-bold text-slate-600">Identidad Estética:</span>
                    </div>
                    <span className={cn("px-2 py-0.5 rounded-lg text-[9px] font-bold", identidadBadge.color)}>
                      {identidadBadge.label}
                    </span>
                  </div>

                  <div className="flex items-center justify-between text-[10px]">
                    <div className="flex items-center gap-2">
                      <ShieldCheck size={12} className="text-slate-400" />
                      <span className="font-bold text-slate-600">Seguridad/Cerraduras:</span>
                    </div>
                    <span className={cn("px-2 py-0.5 rounded-lg text-[9px] font-bold", seguridadBadge.color)}>
                      {seguridadBadge.label}
                    </span>
                  </div>
                </div>

                <div className="mt-5 pt-3 border-t border-slate-50">
                  <div className="flex justify-between items-center text-[8px] font-black uppercase text-slate-400">
                    <span>Estado general de servicios</span>
                    <span>
                      {[
                        isValidValue(sala.rampas_acceso),
                        isExcellentOrGood(sala.senaletica),
                        isExcellentOrGood(sala.sanitarios),
                        isValidValue(sala.agua_potable)
                      ].filter(Boolean).length}/4 servicios
                    </span>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {filtered.length === 0 && (
        <div className="bg-white rounded-3xl border border-slate-100 p-12 text-center text-slate-400">
          {activeFilter ? "No hay salas que cumplan con el filtro seleccionado" : "No hay registros de servicios complementarios"}
        </div>
      )}

      <Pagination currentPage={currentPage} totalPages={totalPages} onPageChange={setCurrentPage} />
    </motion.div>
  );
};

// ==================== COMPONENTE PRINCIPAL ====================
export const Dimen2: React.FC<{ activeTab?: string }> = ({ activeTab = 'espacio' }) => {
  const [currentTab, setCurrentTab] = useState(activeTab);

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-black text-slate-900 uppercase tracking-tighter italic">Dimensión II: Infraestructura</h2>
        </div>
        <div className="flex bg-slate-100 p-1 rounded-xl gap-1">
          <TabButton active={currentTab === 'espacio'} onClick={() => setCurrentTab('espacio')} icon={Maximize} label="Espacio físico y mobiliario" />
          <TabButton active={currentTab === 'conectividad'} onClick={() => setCurrentTab('conectividad')} icon={Wifi} label="Conectividad y Hardware" />
          <TabButton active={currentTab === 'servicios'} onClick={() => setCurrentTab('servicios')} icon={ShieldCheck} label="Servicios complementarios" />
        </div>
      </div>

      <AnimatePresence mode="wait">
        {currentTab === 'espacio' && <EspacioFisicoList key="espacio" />}
        {currentTab === 'conectividad' && <ConectividadHardwareList key="conectividad" />}
        {currentTab === 'servicios' && <ServiciosComplementariosList key="servicios" />}
      </AnimatePresence>
    </div>
  );
};

const TabButton = ({ active, onClick, icon: Icon, label }: any) => (
  <button 
    onClick={onClick}
    className={cn(
      "flex items-center gap-2 px-4 py-2 rounded-lg text-[10px] font-black uppercase tracking-wider transition-all",
      active ? "bg-white text-brand-primary shadow-sm" : "text-slate-500 hover:text-slate-800"
    )}
  >
    <Icon size={14} />
    <span className="hidden md:inline">{label}</span>
  </button>
);