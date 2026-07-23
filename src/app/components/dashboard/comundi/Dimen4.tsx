'use client';

import React, { useState, useEffect } from 'react';
import { 
  FileCheck, Search, Filter, 
  Users, Eye, Download, FileText, TrendingUp, ArrowUpRight, ShieldCheck, History, Lock,
  AlertCircle, Loader2, Brain, Target,
  CheckCircle, Compass, MapPin, Calendar,
  X, User, Building2, ChevronLeft, ChevronRight, Lightbulb
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/app/lib/utils';
import { supabase } from '@/app/lib/supabaseClient';

interface BovedaDigitalProps {
  activeTab?: string;
}

// ==================== TIPOS ====================
interface ACASolucion {
  id: number;
  tipo: 'comuna' | 'consejo';
  entidad_id: number;
  entidad_nombre: string;
  area_trabajo: string;
  solucion_propuesta: string;
  direccion_exacta?: string;
  fortaleza?: string;
  transformacion_7t?: string;
  nombre_responsable?: string;
  apellido_responsable?: string;
  cedula_responsable?: string;
  created_at: string;
  acta_url?: string;
}

interface EntidadACAS {
  id: number;
  tipo: 'comuna' | 'consejo';
  nombre: string;
  soluciones: ACASolucion[];
  ultima_fecha: string;
  areas: string[];
}

interface NudoCritico {
  id: number;
  tipo: 'comuna' | 'consejo';
  entidad_id: number;
  entidad_nombre?: string;
  titulo: string;
  descripcion?: string;
  categoria_7t: string;
  gravedad: string;
  familias_afectadas?: number;
  personas_afectadas?: number;
  justificacion_critico?: string;
  fotos_urls?: string[];
  estado: string;
  created_at: string;
  acta_url?: string;
}

interface Sueno {
  id: number;
  tipo: 'comuna' | 'consejo';
  entidad_id: number;
  entidad_nombre: string;
  area_trabajo?: string;
  problema: string;
  solucion?: string;
  ubicacion?: string;
  fortaleza?: string;
  transformacion_7t?: string;
  nombre_responsable?: string;
  apellido_responsable?: string;
  cedula_responsable?: string;
  created_at: string;
  imagen_url?: string;
  mapa_imagen_url?: string | null;
  mapa_descripcion?: string | null;
}

interface EntidadSuenos {
  id: number;
  tipo: 'comuna' | 'consejo';
  nombre: string;
  suenos: Sueno[];
  imagen_muestra?: string;
  descripcion_mapa?: string;
  ultima_fecha: string;
  areas: string[];
}

// ==================== COMPONENTE DE PAGINACIÓN REUTILIZABLE ====================
const PaginationControls = ({ currentPage, totalPages, onPageChange }: { currentPage: number; totalPages: number; onPageChange: (page: number) => void }) => {
  if (totalPages <= 1) return null;
  return (
    <div className="flex items-center justify-between px-6 py-4 bg-slate-50/50 border-t border-slate-100">
      <div className="text-xs text-slate-500">Página {currentPage} de {totalPages}</div>
      <div className="flex gap-1">
        <button
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage === 1}
          className="p-2 rounded-lg border border-slate-200 disabled:opacity-50 hover:bg-white transition-colors"
        >
          <ChevronLeft size={16} />
        </button>
        {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
          let pageNum = i + 1;
          if (totalPages > 5 && currentPage > 3) pageNum = currentPage - 2 + i;
          if (pageNum > totalPages) return null;
          return (
            <button
              key={pageNum}
              onClick={() => onPageChange(pageNum)}
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
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage === totalPages}
          className="p-2 rounded-lg border border-slate-200 disabled:opacity-50 hover:bg-white transition-colors"
        >
          <ChevronRight size={16} />
        </button>
      </div>
    </div>
  );
};

// ==================== COMPONENTE PRINCIPAL ====================
export const Dimen4: React.FC<BovedaDigitalProps> = ({ activeTab = 'aca' }) => {
  const [currentTab, setCurrentTab] = useState(activeTab);

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-black text-slate-900 uppercase tracking-tighter italic">Dimensión IV: Gestión</h2>
        </div>
        <div className="flex bg-slate-100 p-1 rounded-xl gap-1 flex-wrap">
          <TabButton active={currentTab === 'aca'} onClick={() => setCurrentTab('aca')} icon={FileCheck} label="ACA" />
          <TabButton active={currentTab === 'mapa_suenos'} onClick={() => setCurrentTab('mapa_suenos')} icon={Compass} label="Mapa de Sueños" />
          <TabButton active={currentTab === 'nudos_criticos'} onClick={() => setCurrentTab('nudos_criticos')} icon={AlertCircle} label="Nudos Críticos" />
          <TabButton active={currentTab === 'proyectos'} onClick={() => setCurrentTab('proyectos')} icon={Target} label="Proyectos" />
        </div>
      </div>

      <AnimatePresence mode="wait">
        {currentTab === 'aca' && <ACA key="aca" />}
        {currentTab === 'nudos_criticos' && <NudosCriticos key="nudos_criticos" />}
        {currentTab === 'proyectos' && <Proyectos key="proyectos" />}
        {currentTab === 'mapa_suenos' && <MapaDeSuenos key="mapa_suenos" />}
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
    {label}
  </button>
);

// ==================== ACA (Acciones Correctivas y Acuerdos) ====================
const TarjetaACA = ({ entidad, formatDate, onClick }: any) => {
  return (
    <div 
      className="bg-white rounded-2xl border border-slate-100 shadow-sm hover:shadow-md transition-all group cursor-pointer"
      onClick={() => onClick(entidad)}
    >
      <div className="p-5">
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center gap-2">
            <div className={cn(
              "w-8 h-8 rounded-xl flex items-center justify-center transition-transform group-hover:scale-110",
              entidad.tipo === 'comuna' ? "bg-purple-100 text-purple-600" : "bg-blue-100 text-blue-600"
            )}>
              {entidad.tipo === 'comuna' ? <Building2 size={18} /> : <Users size={18} />}
            </div>
            <h4 className="text-xs font-black text-slate-900 uppercase tracking-tight line-clamp-1">{entidad.nombre}</h4>
          </div>
          <span className={cn(
            "px-2 py-1 rounded-lg text-[8px] font-black uppercase border",
            entidad.tipo === 'comuna' ? "bg-purple-50 text-purple-700 border-purple-200" : "bg-blue-50 text-blue-700 border-blue-200"
          )}>
            {entidad.tipo === 'comuna' ? 'Comuna' : 'C.C.'}
          </span>
        </div>

        <div className="w-full h-24 mb-3 rounded-xl bg-gradient-to-br from-brand-primary/5 to-transparent flex items-center justify-center">
          <div className="text-center">
            <Lightbulb className="text-brand-primary/60 mx-auto mb-2" size={32} />
            <p className="text-[10px] font-black text-slate-500 uppercase">Soluciones ACA</p>
          </div>
        </div>

        {entidad.descripcion && (
          <div className="mb-3">
            <p className="text-[9px] text-slate-500 leading-relaxed line-clamp-3">
              {entidad.descripcion}
            </p>
          </div>
        )}

        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-1 text-[9px] font-bold text-slate-400">
            <Target size={10} />
            <span>{entidad.soluciones.length} {entidad.soluciones.length === 1 ? 'solución' : 'soluciones'}</span>
          </div>
          <div className="flex items-center gap-1 text-[9px] font-bold text-slate-400">
            <Calendar size={10} />
            <span>{formatDate(entidad.ultima_fecha)}</span>
          </div>
        </div>

        {entidad.areas.length > 0 && (
          <div className="flex flex-wrap gap-1 mt-2 pt-2 border-t border-slate-50">
            {entidad.areas.slice(0, 2).map((area: string) => (
              <span key={area} className="px-1.5 py-0.5 bg-slate-100 rounded text-[7px] font-black text-slate-500 uppercase">
                {area}
              </span>
            ))}
            {entidad.areas.length > 2 && (
              <span className="px-1.5 py-0.5 text-[7px] font-black text-slate-400">+{entidad.areas.length - 2}</span>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

const ModalACA = ({ entidad, formatDate, onClose }: any) => {
  const [signedActaUrls, setSignedActaUrls] = useState<Map<number, string>>(new Map());

  useEffect(() => {
    const loadActaUrls = async () => {
      const newMap = new Map<number, string>();
      for (const solucion of entidad.soluciones) {
        if (solucion.acta_url) {
          const bucket = solucion.tipo === 'comuna' ? 'documentos_comuna' : 'documentos_consejos';
          const { data } = await supabase.storage.from(bucket).createSignedUrl(solucion.acta_url, 3600);
          if (data?.signedUrl) newMap.set(solucion.id, data.signedUrl);
        }
      }
      setSignedActaUrls(newMap);
    };
    loadActaUrls();
  }, [entidad]);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        className="bg-white rounded-2xl shadow-2xl max-w-3xl w-full max-h-[85vh] overflow-hidden flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-gradient-to-r from-brand-primary/5 to-transparent">
          <div className="flex items-center gap-3">
            {entidad.tipo === 'comuna' ? <Building2 className="text-purple-500" size={24} /> : <Users className="text-blue-500" size={24} />}
            <div>
              <h3 className="text-sm font-black text-slate-800 uppercase tracking-tight">{entidad.nombre}</h3>
              <p className="text-[9px] text-slate-400">{entidad.soluciones.length} soluciones ACA registradas</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1 rounded-full hover:bg-slate-100">
            <X size={18} className="text-slate-400" />
          </button>
        </div>
        <div className="overflow-x-auto p-6 flex-1">
          <table className="w-full text-left border-collapse">
            <thead className="bg-slate-50/50 border-b border-slate-100 text-[10px] font-black text-slate-400 uppercase tracking-widest">
              <tr>
                <th className="px-3 py-3">Área / 7T</th>
                <th className="px-3 py-3">Solución Propuesta</th>
                <th className="px-3 py-3">Dirección</th>
                <th className="px-3 py-3">Fortaleza</th>
                <th className="px-3 py-3">Responsable</th>

              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {entidad.soluciones.map((solucion: ACASolucion) => (
                <tr key={solucion.id} className="hover:bg-slate-50/50 transition-colors text-xs">
                  <td className="px-3 py-3 align-top">
                    <p className="text-[11px] font-black text-brand-primary uppercase">{solucion.area_trabajo || '—'}</p>
                    {solucion.transformacion_7t && <span className="text-[9px] bg-slate-100 text-slate-500 px-1.5 py-0.5 rounded-full">{solucion.transformacion_7t.split(':')[0]}</span>}
                  </td>
                  <td className="px-3 py-3 text-slate-700 max-w-[200px] break-words">
                    <div className="max-h-24 overflow-y-auto pr-1 text-justify">
                      {solucion.solucion_propuesta}
                    </div>
                  </td>
                  <td className="px-3 py-3 text-slate-500">{solucion.direccion_exacta || '—'}</td>
                  <td className="px-3 py-3 text-slate-500">{solucion.fortaleza || '—'}</td>
                  <td className="px-3 py-3 text-[10px] font-bold text-slate-800">
                    {solucion.nombre_responsable && solucion.apellido_responsable 
                      ? `${solucion.nombre_responsable} ${solucion.apellido_responsable}` 
                      : solucion.nombre_responsable || solucion.apellido_responsable || '—'}
                    {solucion.cedula_responsable && <span className="block text-[9px] text-slate-500 font-normal">C.I: {solucion.cedula_responsable}</span>}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {entidad.soluciones.length === 0 && <div className="text-center py-12 text-slate-400">No hay soluciones ACA registradas para esta entidad</div>}
        </div>
        <div className="p-4 border-t border-slate-100 bg-slate-50/50 flex justify-end">
          <button onClick={onClose} className="px-4 py-2 bg-brand-primary hover:bg-brand-primary/90 text-white text-[10px] font-black uppercase rounded-lg transition-colors">
            Cerrar
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
};

const ACA = () => {
  const [entidades, setEntidades] = useState<EntidadACAS[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterTipo, setFilterTipo] = useState<'all' | 'comuna' | 'consejo'>('all');
  const [selectedEntidad, setSelectedEntidad] = useState<EntidadACAS | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 9;

  useEffect(() => {
    const fetchAllSoluciones = async () => {
      setLoading(true);
      const allSoluciones: ACASolucion[] = [];

      const { data: acaComuna, error: errorComuna } = await supabase
        .from('aca_comuna')
        .select(`
          id_aca_comuna,
          id_comuna,
          area_trabajo,
          solucion_propuesta,
          direccion_exacta,
          fortaleza,
          transformacion_7t,
          created_at,
          nombre_responsable,
          apellido_responsable,
          cedula_responsable,
          datos_comuna!left (nombre_comuna)
        `);
      if (errorComuna) console.error('Error cargando ACA de comunas:', errorComuna);
      if (acaComuna) {
        acaComuna.forEach((item: any) => {
          allSoluciones.push({
            id: item.id_aca_comuna,
            tipo: 'comuna',
            entidad_id: item.id_comuna,
            entidad_nombre: item.datos_comuna?.nombre_comuna || 'Comuna sin nombre',
            area_trabajo: item.area_trabajo,
            solucion_propuesta: item.solucion_propuesta,
            direccion_exacta: item.direccion_exacta,
            fortaleza: item.fortaleza,
            transformacion_7t: item.transformacion_7t,
            nombre_responsable: item.nombre_responsable,
            apellido_responsable: item.apellido_responsable,
            cedula_responsable: item.cedula_responsable,
            created_at: item.created_at,
            acta_url: null
          });
        });
      }

      const { data: acaConsejo, error: errorConsejo } = await supabase
        .from('aca')
        .select(`
          id_aca,
          id_consejo,
          area_trabajo,
          solucion_propuesta,
          direccion_exacta,
          fortaleza,
          transformacion_7t,
          created_at,
          nombre_responsable,
          apellido_responsable,
          cedula_responsable,
          acta_url,
          datos_consejo_comunal!left (nombre_consejo)
        `);
      if (errorConsejo) console.error('Error cargando ACA de consejos:', errorConsejo);
      if (acaConsejo) {
        acaConsejo.forEach((item: any) => {
          allSoluciones.push({
            id: item.id_aca,
            tipo: 'consejo',
            entidad_id: item.id_consejo,
            entidad_nombre: item.datos_consejo_comunal?.nombre_consejo || 'Consejo sin nombre',
            area_trabajo: item.area_trabajo,
            solucion_propuesta: item.solucion_propuesta,
            direccion_exacta: item.direccion_exacta,
            fortaleza: item.fortaleza,
            transformacion_7t: item.transformacion_7t,
            nombre_responsable: item.nombre_responsable,
            apellido_responsable: item.apellido_responsable,
            cedula_responsable: item.cedula_responsable,
            created_at: item.created_at,
            acta_url: item.acta_url
          });
        });
      }

      const entidadesMap = new Map<string, EntidadACAS>();
      for (const solucion of allSoluciones) {
        const key = `${solucion.tipo}-${solucion.entidad_id}`;
        if (!entidadesMap.has(key)) {
          entidadesMap.set(key, {
            id: solucion.entidad_id,
            tipo: solucion.tipo,
            nombre: solucion.entidad_nombre,
            soluciones: [],
            ultima_fecha: solucion.created_at,
            areas: []
          });
        }
        const entidad = entidadesMap.get(key)!;
        entidad.soluciones.push(solucion);
        if (new Date(solucion.created_at) > new Date(entidad.ultima_fecha)) {
          entidad.ultima_fecha = solucion.created_at;
        }
        if (solucion.area_trabajo && !entidad.areas.includes(solucion.area_trabajo)) {
          entidad.areas.push(solucion.area_trabajo);
        }
      }

      const entidadesArray = Array.from(entidadesMap.values());
      entidadesArray.sort((a, b) => new Date(b.ultima_fecha).getTime() - new Date(a.ultima_fecha).getTime());
      setEntidades(entidadesArray);
      setLoading(false);
    };

    fetchAllSoluciones();
  }, []);

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('es-ES', { year: 'numeric', month: 'short', day: 'numeric' });
  };

  const filteredEntidades = entidades.filter(ent =>
    (ent.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
     ent.soluciones.some(s => s.solucion_propuesta.toLowerCase().includes(searchTerm.toLowerCase()))) &&
    (filterTipo === 'all' || ent.tipo === filterTipo)
  );

  const totalPages = Math.ceil(filteredEntidades.length / itemsPerPage);
  const paginatedEntidades = filteredEntidades.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  useEffect(() => setCurrentPage(1), [searchTerm, filterTipo]);

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="space-y-6">
      <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden">
        <div className="p-6 border-b border-slate-50 flex items-center justify-between bg-slate-50/50 flex-wrap gap-4">
          <div className="flex items-center gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
              <input
                type="text"
                placeholder="Buscar comuna, consejo o solución..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9 pr-4 py-2 bg-white border border-slate-200 rounded-xl text-xs font-medium outline-none focus:ring-2 focus:ring-brand-primary/20 w-64"
              />
            </div>
            <div className="flex gap-2">
              <button onClick={() => setFilterTipo('all')} className={cn("px-3 py-1.5 rounded-lg text-[9px] font-black uppercase", filterTipo === 'all' ? "bg-brand-primary text-white" : "bg-white text-slate-500 border border-slate-200")}>Todos</button>
              <button onClick={() => setFilterTipo('comuna')} className={cn("px-3 py-1.5 rounded-lg text-[9px] font-black uppercase", filterTipo === 'comuna' ? "bg-purple-500 text-white" : "bg-white text-slate-500 border border-slate-200")}>Comunas</button>
              <button onClick={() => setFilterTipo('consejo')} className={cn("px-3 py-1.5 rounded-lg text-[9px] font-black uppercase", filterTipo === 'consejo' ? "bg-blue-500 text-white" : "bg-white text-slate-500 border border-slate-200")}>Consejos Comunales</button>
            </div>
          </div>
          <div className="flex items-center gap-1 text-[9px] font-black text-slate-400 bg-slate-100 px-3 py-1.5 rounded-full">
            <Lightbulb size={12} /> Entidades con ACA: {filteredEntidades.length}
          </div>
        </div>

        {loading ? (
          <div className="p-12 text-center"><Loader2 className="animate-spin text-brand-primary mx-auto" size={32} /><p className="text-[10px] font-black text-slate-400 mt-2">Cargando soluciones ACA...</p></div>
        ) : (
          <div className="p-6">
            {filteredEntidades.length === 0 ? (
              <div className="text-center py-12 text-slate-400"><Lightbulb className="mx-auto h-12 w-12 mb-3 opacity-30" /><p className="text-[10px] font-black uppercase">No se encontraron entidades con soluciones ACA registradas</p></div>
            ) : (
              <>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {paginatedEntidades.map((entidad) => (
                    <TarjetaACA
                      key={`${entidad.tipo}-${entidad.id}`}
                      entidad={entidad}
                      formatDate={formatDate}
                      onClick={setSelectedEntidad}
                    />
                  ))}
                </div>
                <PaginationControls currentPage={currentPage} totalPages={totalPages} onPageChange={setCurrentPage} />
              </>
            )}
          </div>
        )}
      </div>

      <AnimatePresence>
        {selectedEntidad && <ModalACA entidad={selectedEntidad} formatDate={formatDate} onClose={() => setSelectedEntidad(null)} />}
      </AnimatePresence>
    </motion.div>
  );
};

// ==================== NUDOS CRÍTICOS (CORREGIDO: sin naranja) ====================
const NudosCriticos = () => {
  const [nudos, setNudos] = useState<NudoCritico[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedNudo, setSelectedNudo] = useState<NudoCritico | null>(null);
  const itemsPerPage = 10;

  useEffect(() => {
    const fetchNudos = async () => {
      setLoading(true);
      const allNudos: NudoCritico[] = [];

      const { data: nudosComuna, error: errorComuna } = await supabase
        .from('nudos_criticos_comuna')
        .select('*')
        .order('created_at', { ascending: false });
      if (errorComuna) console.error('Error cargando nudos de comunas:', errorComuna);
      if (nudosComuna) {
        nudosComuna.forEach((item: any) => {
          allNudos.push({
            id: item.id_nudo_comuna,
            tipo: 'comuna',
            entidad_id: item.id_comuna,
            titulo: item.titulo,
            descripcion: item.descripcion,
            categoria_7t: item.categoria_7t,
            gravedad: item.gravedad || 'Bajo',
            familias_afectadas: item.familias_afectadas,
            personas_afectadas: item.personas_afectadas,
            justificacion_critico: item.justificacion_critico,
            fotos_urls: item.fotos_urls,
            estado: 'activo',
            created_at: item.created_at,
            acta_url: item.acta_url
          });
        });
      }

      const { data: nudosConsejo, error: errorConsejo } = await supabase
        .from('nudos_criticos')
        .select('*')
        .order('created_at', { ascending: false });
      if (errorConsejo) console.error('Error cargando nudos de consejos:', errorConsejo);
      if (nudosConsejo) {
        nudosConsejo.forEach((item: any) => {
          allNudos.push({
            id: item.id_nudo,
            tipo: 'consejo',
            entidad_id: item.id_consejo,
            titulo: item.titulo,
            descripcion: item.descripcion,
            categoria_7t: item.categoria_7t,
            gravedad: item.gravedad,
            familias_afectadas: item.familias_afectadas,
            personas_afectadas: item.personas_afectadas,
            justificacion_critico: item.justificacion_critico,
            fotos_urls: item.fotos_urls,
            estado: item.estado || 'activo',
            created_at: item.created_at,
            acta_url: item.acta_url
          });
        });
      }

      setNudos(allNudos);
      setLoading(false);
    };

    fetchNudos();
  }, []);

  const filteredNudos = nudos.filter(nudo =>
    nudo.titulo.toLowerCase().includes(searchTerm.toLowerCase()) ||
    nudo.categoria_7t.toLowerCase().includes(searchTerm.toLowerCase()) ||
    nudo.tipo.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const totalPages = Math.ceil(filteredNudos.length / itemsPerPage);
  const paginatedNudos = filteredNudos.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  useEffect(() => setCurrentPage(1), [searchTerm]);

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('es-ES', { year: 'numeric', month: 'short', day: 'numeric' });
  };

  const getPrioridadColor = (gravedad: string) => {
    switch (gravedad.toLowerCase()) {
      case 'alto': return 'bg-red-100 text-red-700';
      case 'medio': return 'bg-amber-100 text-amber-700';
      case 'bajo': return 'bg-green-100 text-green-700';
      default: return 'bg-slate-100 text-slate-700';
    }
  };

  const getEstadoColor = (estado: string) => {
    switch (estado.toLowerCase()) {
      case 'activo': return 'bg-amber-100 text-amber-700';
      case 'resuelto': return 'bg-green-100 text-green-700';
      default: return 'bg-slate-100 text-slate-700';
    }
  };

  const getEstadoLabel = (estado: string) => {
    switch (estado.toLowerCase()) {
      case 'activo': return 'Activo';
      case 'resuelto': return 'Resuelto';
      default: return estado;
    }
  };

  // Modal de detalle de nudo con scroll en descripciones
  const ModalNudo = ({ nudo, onClose }: { nudo: NudoCritico; onClose: () => void }) => {
    const [imageUrls, setImageUrls] = useState<string[]>([]);
    const [loadingImages, setLoadingImages] = useState(false);
    const [signedActa, setSignedActa] = useState<string | null>(null);

    useEffect(() => {
      const loadImages = async () => {
        if (nudo.fotos_urls && nudo.fotos_urls.length > 0) {
          setLoadingImages(true);
          const urls = await Promise.all(
            nudo.fotos_urls.map(async (path) => {
              if (!path) return null;
              try {
                const bucket = nudo.tipo === 'comuna' ? 'documentos_comuna' : 'documentos_consejos';
                const { data } = await supabase.storage.from(bucket).createSignedUrl(path, 3600);
                return data?.signedUrl || null;
              } catch (err) {
                console.error('Error loading image:', err);
                return null;
              }
            })
          );
          setImageUrls(urls.filter(url => url !== null) as string[]);
          setLoadingImages(false);
        }
      };
      const loadActa = async () => {
        if (nudo.acta_url) {
          const bucket = nudo.tipo === 'comuna' ? 'documentos_comuna' : 'documentos_consejos';
          const { data } = await supabase.storage.from(bucket).createSignedUrl(nudo.acta_url, 3600);
          if (data?.signedUrl) setSignedActa(data.signedUrl);
        }
      };
      loadImages();
      loadActa();
    }, [nudo]);

    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4"
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
          className="bg-white rounded-2xl shadow-2xl max-w-lg w-full max-h-[85vh] overflow-y-auto"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="p-5 border-b border-slate-100 flex justify-between items-center sticky top-0 bg-white z-10">
            <h4 className="text-sm font-black text-slate-800 uppercase tracking-tight">Detalle del Nudo Crítico</h4>
            <button onClick={onClose} className="p-1 rounded-full hover:bg-slate-100">
              <X size={18} className="text-slate-400" />
            </button>
          </div>

          <div className="p-6 space-y-4">
            <div>
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider block mb-0.5">Instancia</span>
              <p className="text-sm font-bold text-slate-800">{nudo.tipo === 'comuna' ? 'Comuna' : 'Consejo Comunal'}</p>
            </div>

            <div>
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider block mb-0.5">Título</span>
              <p className="text-sm font-bold text-slate-700">{nudo.titulo}</p>
            </div>

            <div>
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider block mb-0.5">Descripción</span>
              <div className="max-h-36 overflow-y-auto pr-1 text-justify text-sm text-slate-600 leading-relaxed">
                {nudo.descripcion || '—'}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider block mb-0.5">Categoría 7T</span>
                <p className="text-sm text-slate-700">{nudo.categoria_7t}</p>
              </div>
              <div>
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider block mb-0.5">Gravedad / Prioridad</span>
                <p className="text-sm text-slate-700">{nudo.gravedad}</p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider block mb-0.5">Familias afectadas</span>
                <p className="text-sm text-slate-700">{nudo.familias_afectadas || '—'}</p>
              </div>
              <div>
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider block mb-0.5">Personas afectadas</span>
                <p className="text-sm text-slate-700">{nudo.personas_afectadas || '—'}</p>
              </div>
            </div>

            {nudo.justificacion_critico && (
              <div>
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider block mb-0.5">Justificación</span>
                <div className="max-h-32 overflow-y-auto pr-1 text-justify text-sm text-slate-600 leading-relaxed">
                  {nudo.justificacion_critico}
                </div>
              </div>
            )}

            <div className="grid grid-cols-2 gap-4">
              <div>
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider block mb-0.5">Estado</span>
                <p className="text-sm text-slate-700">{getEstadoLabel(nudo.estado)}</p>
              </div>
              <div>
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider block mb-0.5">Fecha de registro</span>
                <p className="text-sm text-slate-600">{formatDate(nudo.created_at)}</p>
              </div>
            </div>

            {signedActa && (
              <div>
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider block mb-0.5">Acta / Documento</span>
                <a href={signedActa} target="_blank" rel="noopener noreferrer" className="text-sm text-brand-primary font-bold underline hover:text-brand-primary/80 transition-colors">
                  Ver acta
                </a>
              </div>
            )}

            {loadingImages && <div className="flex justify-center py-2"><Loader2 className="animate-spin text-slate-400" size={22} /></div>}

            {imageUrls.length > 0 && (
              <div>
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider block mb-2">Imágenes</span>
                <div className="grid grid-cols-2 gap-2">
                  {imageUrls.map((url, idx) => (
                    <img key={idx} src={url} className="rounded-xl max-h-28 w-full object-cover border border-slate-100" alt={`Evidencia ${idx+1}`} />
                  ))}
                </div>
              </div>
            )}
          </div>

          <div className="p-4 border-t border-slate-100 bg-slate-50/50 flex justify-end">
            <button onClick={onClose} className="px-4 py-2 bg-brand-primary hover:bg-brand-primary/90 text-white text-[10px] font-black uppercase rounded-lg transition-colors">
              Cerrar
            </button>
          </div>
        </motion.div>
      </motion.div>
    );
  };

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="space-y-6">
      <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden">
        <div className="p-6 border-b border-slate-50 flex items-center justify-between bg-slate-50/50 flex-wrap gap-4">
          <div className="flex items-center gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
              <input
                type="text"
                placeholder="Buscar por título, categoría 7T o instancia..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9 pr-4 py-1.5 bg-white border border-slate-200 rounded-lg text-[10px] font-medium outline-none w-64"
              />
            </div>
            <button className="p-2 bg-white border border-slate-200 rounded-xl text-slate-500 hover:text-brand-primary transition-all"><Filter size={16} /></button>
          </div>
          
        </div>

        {loading ? (
          <div className="p-12 text-center"><Loader2 className="animate-spin text-brand-primary mx-auto" size={32} /><p className="text-[10px] font-black text-slate-400 mt-2">Cargando nudos críticos...</p></div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead className="bg-brand-primary/5 border-b border-brand-primary/20">
                  <tr>
                    <th className="px-6 py-4 text-[10px] font-black text-brand-primary uppercase tracking-widest">Instancia</th>
                    <th className="px-6 py-4 text-[10px] font-black text-brand-primary uppercase tracking-widest">Nudo Crítico</th>
                    <th className="px-6 py-4 text-[10px] font-black text-brand-primary uppercase tracking-widest">Transformación</th>
                    <th className="px-6 py-4 text-[10px] font-black text-brand-primary uppercase tracking-widest">Prioridad</th>
                    <th className="px-6 py-4 text-[10px] font-black text-brand-primary uppercase tracking-widest">Fecha</th>
                    <th className="px-6 py-4 text-[10px] font-black text-brand-primary uppercase tracking-widest">Acción</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-brand-primary/5">
                  {paginatedNudos.map((nudo) => (
                    <tr key={`${nudo.tipo}-${nudo.id}`} className="hover:bg-brand-primary/5 transition-colors group">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={cn(
                          "px-2 py-1 rounded-full text-[9px] font-black uppercase",
                          nudo.tipo === 'comuna' ? "bg-100 text-700" : "bg-blue-100 text-700"
                        )}>
                          {nudo.tipo === 'comuna' ? 'Comuna' : 'C.C.'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-xl bg-brand-primary/10 border border-brand-primary/20 flex items-center justify-center text-brand-primary">
                            <AlertCircle size={18} />
                          </div>
                          <span className="text-xs font-bold text-slate-900">{nudo.titulo}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="text-xs font-medium text-slate-700">{nudo.categoria_7t}</span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={cn("px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider", getPrioridadColor(nudo.gravedad))}>
                          {nudo.gravedad}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="text-[10px] font-medium text-slate-500">{formatDate(nudo.created_at)}</span>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <button
                          onClick={() => setSelectedNudo(nudo)}
                          className="p-2 bg-brand-primary/10 rounded-lg text-brand-primary hover:bg-brand-primary hover:text-white transition-colors"
                          title="Ver detalle"
                        >
                          <Eye size={16} />
                        </button>
                      </td>
                    </tr>
                  ))}
                  {filteredNudos.length === 0 && (
                    <tr><td colSpan={7} className="px-6 py-12 text-center text-slate-400">No se encontraron nudos críticos</td></tr>
                  )}
                </tbody>
              </table>
            </div>
            <PaginationControls currentPage={currentPage} totalPages={totalPages} onPageChange={setCurrentPage} />
          </>
        )}
      </div>

      <AnimatePresence>
        {selectedNudo && <ModalNudo nudo={selectedNudo} onClose={() => setSelectedNudo(null)} />}
      </AnimatePresence>
    </motion.div>
  );
};

// ==================== PROYECTOS (con scroll en descripciones) ====================
interface Proyecto {
  id: number;
  tipo: 'comuna' | 'consejo';
  entidad_id: number;
  entidad_nombre?: string;
  nombre: string;
  categoria_7t: string;
  presupuesto?: number;
  estado: string;
  progreso?: number;
  created_at: string;
  acta_url?: string;
  diagnostico?: string;
  ente_financiamiento?: string;
  beneficiarios_familias?: number;
  codigo?: string;
  desc_antes?: string;
  desc_durante?: string;
  desc_despues?: string;
  foto_antes_url?: string;
  foto_durante_url?: string;
  foto_despues_url?: string;
  fecha_antes?: string;
  fecha_durante?: string;
  fecha_despues?: string;
  respuesta?: string;
  fecha_respuesta?: string;
  requerimientos?: string;
  duracion?: string;
  tecnico_nombre?: string;
  tecnico_apellido?: string;
  tecnico_cedula?: string;
}

const Proyectos = () => {
  const [proyectos, setProyectos] = useState<Proyecto[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedProyecto, setSelectedProyecto] = useState<Proyecto | null>(null);
  const itemsPerPage = 10;

  useEffect(() => {
    const fetchProyectos = async () => {
      setLoading(true);
      const allProyectos: Proyecto[] = [];

      const { data: proyectosComuna, error: errorComuna } = await supabase
        .from('proyectos_comuna')
        .select('*')
        .order('created_at', { ascending: false });
      if (errorComuna) console.error('Error cargando proyectos de comunas:', errorComuna);
      if (proyectosComuna) {
        proyectosComuna.forEach((item: any) => {
          allProyectos.push({
            id: item.id_proyecto_comuna,
            tipo: 'comuna',
            entidad_id: item.id_comuna,
            nombre: item.nombre,
            categoria_7t: item.categoria_7t,
            presupuesto: item.presupuesto,
            estado: item.estado,
            progreso: item.progreso,
            created_at: item.created_at,
            acta_url: item.acta_url,
            diagnostico: item.diagnostico,
            ente_financiamiento: item.ente_financiamiento,
            beneficiarios_familias: item.beneficiarios_familias,
            codigo: item.codigo,
            desc_antes: item.desc_antes,
            desc_durante: item.desc_durante,
            desc_despues: item.desc_despues,
            foto_antes_url: item.foto_antes_url,
            foto_durante_url: item.foto_durante_url,
            foto_despues_url: item.foto_despues_url,
            fecha_antes: item.fecha_antes,
            fecha_durante: item.fecha_durante,
            fecha_despues: item.fecha_despues,
            respuesta: item.respuesta,
            fecha_respuesta: item.fecha_respuesta,
            requerimientos: item.requerimientos,
            duracion: item.duracion,
            tecnico_nombre: item.tecnico_nombre,
            tecnico_apellido: item.tecnico_apellido,
            tecnico_cedula: item.tecnico_cedula,
          });
        });
      }

      const { data: proyectosConsejo, error: errorConsejo } = await supabase
        .from('proyectos')
        .select('*')
        .order('created_at', { ascending: false });
      if (errorConsejo) console.error('Error cargando proyectos de consejos:', errorConsejo);
      if (proyectosConsejo) {
        proyectosConsejo.forEach((item: any) => {
          allProyectos.push({
            id: item.id_proyecto,
            tipo: 'consejo',
            entidad_id: item.id_consejo,
            nombre: item.nombre,
            categoria_7t: item.categoria_7t,
            presupuesto: item.presupuesto,
            estado: item.estado,
            progreso: item.progreso,
            created_at: item.created_at,
            acta_url: item.acta_url,
            diagnostico: item.diagnostico,
            ente_financiamiento: item.ente_financiamiento,
            beneficiarios_familias: item.beneficiarios_familias,
            codigo: item.codigo,
            desc_antes: item.desc_antes,
            desc_durante: item.desc_durante,
            desc_despues: item.desc_despues,
            foto_antes_url: item.foto_antes_url,
            foto_durante_url: item.foto_durante_url,
            foto_despues_url: item.foto_despues_url,
            fecha_antes: item.fecha_antes,
            fecha_durante: item.fecha_durante,
            fecha_despues: item.fecha_despues,
            respuesta: item.respuesta,
            fecha_respuesta: item.fecha_respuesta,
            requerimientos: item.requerimientos,
            duracion: item.duracion,
            tecnico_nombre: item.tecnico_nombre,
            tecnico_apellido: item.tecnico_apellido,
            tecnico_cedula: item.tecnico_cedula,
          });
        });
      }

      setProyectos(allProyectos);
      setLoading(false);
    };

    fetchProyectos();
  }, []);

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('es-ES', { year: 'numeric', month: 'short', day: 'numeric' });
  };

  const formatPresupuesto = (value?: number) => {
    if (!value) return '—';
    return new Intl.NumberFormat('es-VE', { style: 'currency', currency: 'VES' }).format(value);
  };

  const getEstadoColor = (estado: string) => {
    switch (estado.toLowerCase()) {
      case 'aprobado': return 'bg-green-100 text-green-700';
      case 'en revisión': return 'bg-yellow-100 text-yellow-700';
      case 'ejecución': return 'bg-blue-100 text-blue-700';
      case 'finalizado': return 'bg-emerald-100 text-emerald-700';
      case 'rechazado': return 'bg-red-100 text-red-700';
      default: return 'bg-slate-100 text-slate-700';
    }
  };

  const filteredProyectos = proyectos.filter(proy =>
    proy.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
    proy.categoria_7t.toLowerCase().includes(searchTerm.toLowerCase()) ||
    proy.tipo.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const totalPages = Math.ceil(filteredProyectos.length / itemsPerPage);
  const paginatedProyectos = filteredProyectos.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);
  useEffect(() => setCurrentPage(1), [searchTerm]);

  const ModalProyecto = ({ proyecto, onClose }: { proyecto: Proyecto; onClose: () => void }) => {
    const [signedActaUrl, setSignedActaUrl] = useState<string | null>(null);
    const [fotosUrls, setFotosUrls] = useState<{ antes: string | null; durante: string | null; despues: string | null }>({
      antes: null,
      durante: null,
      despues: null,
    });
    const [loadingMedia, setLoadingMedia] = useState(false);

    useEffect(() => {
      const loadMedia = async () => {
        setLoadingMedia(true);
        const bucket = proyecto.tipo === 'comuna' ? 'documentos_comuna' : 'documentos_consejos';

        if (proyecto.acta_url) {
          const { data } = await supabase.storage.from(bucket).createSignedUrl(proyecto.acta_url, 3600);
          if (data?.signedUrl) setSignedActaUrl(data.signedUrl);
        }

        const loadFoto = async (url?: string) => {
          if (!url) return null;
          const { data } = await supabase.storage.from(bucket).createSignedUrl(url, 3600);
          return data?.signedUrl || null;
        };

        const [antes, durante, despues] = await Promise.all([
          loadFoto(proyecto.foto_antes_url),
          loadFoto(proyecto.foto_durante_url),
          loadFoto(proyecto.foto_despues_url),
        ]);
        setFotosUrls({ antes, durante, despues });
        setLoadingMedia(false);
      };
      loadMedia();
    }, [proyecto]);

    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4"
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
          className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[85vh] overflow-hidden flex flex-col"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-white sticky top-0 z-10">
            <div>
              <h4 className="text-xs font-black text-slate-400 uppercase tracking-wider">Detalle del Proyecto</h4>
              <h3 className="text-sm font-bold text-slate-800 line-clamp-1">{proyecto.nombre}</h3>
            </div>
            <button onClick={onClose} className="p-1 rounded-full hover:bg-slate-100 transition-colors">
              <X size={18} className="text-slate-400" />
            </button>
          </div>

          <div className="overflow-y-auto p-4 md:p-5 flex-1 grid grid-cols-1 md:grid-cols-2 gap-4 bg-slate-50/30">
            <div className="space-y-3 bg-white p-4 rounded-xl border border-slate-100 shadow-sm h-fit">
              <h5 className="text-[11px] font-black text-brand-primary uppercase tracking-wider border-b border-slate-100 pb-1.5">Evolución y Diagnóstico</h5>
              <div>
                <span className="text-[9px] font-black text-slate-400 uppercase tracking-wider block mb-0.5">Diagnóstico</span>
                <div className="max-h-24 overflow-y-auto pr-1 text-justify text-xs text-slate-600 leading-relaxed bg-slate-50 p-2 rounded-lg border border-slate-100/50">
                  {proyecto.diagnostico || '—'}
                </div>
              </div>
              <div>
                <span className="text-[9px] font-black text-slate-400 uppercase tracking-wider block mb-0.5">Descripción (Antes)</span>
                <div className="max-h-24 overflow-y-auto pr-1 text-justify text-xs text-slate-600 leading-relaxed bg-slate-50 p-2 rounded-lg border border-slate-100/50">
                  {proyecto.desc_antes || '—'}
                </div>
              </div>
              <div>
                <span className="text-[9px] font-black text-slate-400 uppercase tracking-wider block mb-0.5">Descripción (Durante)</span>
                <div className="max-h-24 overflow-y-auto pr-1 text-justify text-xs text-slate-600 leading-relaxed bg-slate-50 p-2 rounded-lg border border-slate-100/50">
                  {proyecto.desc_durante || '—'}
                </div>
              </div>
              <div>
                <span className="text-[9px] font-black text-slate-400 uppercase tracking-wider block mb-0.5">Descripción (Después)</span>
                <div className="max-h-24 overflow-y-auto pr-1 text-justify text-xs text-slate-600 leading-relaxed bg-slate-50 p-2 rounded-lg border border-slate-100/50">
                  {proyecto.desc_despues || '—'}
                </div>
              </div>
              {proyecto.respuesta && (
                <div>
                  <span className="text-[9px] font-black text-slate-400 uppercase tracking-wider block mb-0.5">Respuesta / Observaciones</span>
                  <div className="max-h-24 overflow-y-auto pr-1 text-justify text-xs text-slate-600 leading-relaxed bg-brand-primary/5 p-2 rounded-lg border border-brand-primary/10">
                    {proyecto.respuesta}
                  </div>
                </div>
              )}
            </div>

            <div className="space-y-4 flex flex-col justify-start">
              <div className="bg-white p-4 rounded-xl border border-slate-100 shadow-sm space-y-3">
                <h5 className="text-[11px] font-black text-brand-primary uppercase tracking-wider border-b border-slate-100 pb-1.5">Ficha Técnica</h5>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <span className="text-[9px] font-black text-slate-400 uppercase tracking-wider block">Instancia</span>
                    <p className="text-xs font-bold text-slate-700">{proyecto.tipo === 'comuna' ? 'Comuna' : 'Consejo Comunal'}</p>
                  </div>
                  <div>
                    <span className="text-[9px] font-black text-slate-400 uppercase tracking-wider block">Código</span>
                    <p className="text-xs font-mono text-slate-700">{proyecto.codigo || '—'}</p>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <span className="text-[9px] font-black text-slate-400 uppercase tracking-wider block">Estado</span>
                    <span className="inline-block text-[10px] font-bold text-slate-700 mt-0.5">{proyecto.estado}</span>
                  </div>
                  <div>
                    <span className="text-[9px] font-black text-slate-400 uppercase tracking-wider block">Progreso</span>
                    <p className="text-xs font-bold text-slate-700">{proyecto.progreso ? `${proyecto.progreso}%` : '—'}</p>
                  </div>
                </div>
                <div className="border-t border-slate-50 pt-2 grid grid-cols-2 gap-3">
                  <div>
                    <span className="text-[9px] font-black text-slate-400 uppercase tracking-wider block">Presupuesto</span>
                    <p className="text-xs font-black text-slate-800">{formatPresupuesto(proyecto.presupuesto)}</p>
                  </div>
                  <div>
                    <span className="text-[9px] font-black text-slate-400 uppercase tracking-wider block">Ente Financiamiento</span>
                    <p className="text-xs text-slate-700 truncate">{proyecto.ente_financiamiento || '—'}</p>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <span className="text-[9px] font-black text-slate-400 uppercase tracking-wider block">Familias Benef.</span>
                    <p className="text-xs text-slate-700">{proyecto.beneficiarios_familias || '—'}</p>
                  </div>
                  <div>
                    <span className="text-[9px] font-black text-slate-400 uppercase tracking-wider block">Duración</span>
                    <p className="text-xs text-slate-700">{proyecto.duracion || '—'}</p>
                  </div>
                </div>
                <div className="border-t border-slate-50 pt-2 space-y-2">
                  <div>
                    <span className="text-[9px] font-black text-slate-400 uppercase tracking-wider block">Transformación 7T</span>
                    <p className="text-xs text-slate-600 line-clamp-1">{proyecto.categoria_7t}</p>
                  </div>
                  {(proyecto.tecnico_nombre || proyecto.tecnico_apellido) && (
                    <div>
                      <span className="text-[9px] font-black text-slate-400 uppercase tracking-wider block">Técnico Responsable</span>
                      <p className="text-xs text-slate-700 font-medium">{proyecto.tecnico_nombre} {proyecto.tecnico_apellido}</p>
                    </div>
                  )}
                  {signedActaUrl && (
                    <div className="pt-0.5">
                      <a href={signedActaUrl} target="_blank" rel="noopener noreferrer" className="text-xs text-brand-primary font-bold underline hover:text-brand-primary/80 transition-colors">
                        Ver Acta Oficial
                      </a>
                    </div>
                  )}
                </div>
              </div>

              {(fotosUrls.antes || fotosUrls.durante || fotosUrls.despues) && (
                <div className="bg-white p-4 rounded-xl border border-slate-100 shadow-sm space-y-2">
                  <span className="text-[9px] font-black text-slate-400 uppercase tracking-wider block">Galería de Fotos</span>
                  <div className="grid grid-cols-3 gap-1.5">
                    {fotosUrls.antes && (
                      <div className="text-center">
                        <img src={fotosUrls.antes} className="rounded-lg h-16 w-full object-cover border border-slate-100 shadow-sm" alt="Antes" />
                        <span className="text-[8px] text-slate-400 font-bold uppercase mt-0.5 block">Antes</span>
                      </div>
                    )}
                    {fotosUrls.durante && (
                      <div className="text-center">
                        <img src={fotosUrls.durante} className="rounded-lg h-16 w-full object-cover border border-slate-100 shadow-sm" alt="Durante" />
                        <span className="text-[8px] text-slate-400 font-bold uppercase mt-0.5 block">Durante</span>
                      </div>
                    )}
                    {fotosUrls.despues && (
                      <div className="text-center">
                        <img src={fotosUrls.despues} className="rounded-lg h-16 w-full object-cover border border-slate-100 shadow-sm" alt="Después" />
                        <span className="text-[8px] text-slate-400 font-bold uppercase mt-0.5 block">Después</span>
                      </div>
                    )}
                  </div>
                </div>
              )}
              {loadingMedia && <div className="flex justify-center py-1"><Loader2 className="animate-spin text-slate-400" size={18} /></div>}
            </div>
          </div>

          <div className="p-3 border-t border-slate-100 bg-slate-50 flex justify-end z-10">
            <button onClick={onClose} className="px-4 py-1.5 bg-brand-primary hover:bg-brand-primary/90 text-white text-[10px] font-black uppercase rounded-lg transition-colors shadow-sm">
              Cerrar Detalle
            </button>
          </div>
        </motion.div>
      </motion.div>
    );
  };

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="space-y-6">
      <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden">
        <div className="p-6 border-b border-slate-50 flex items-center justify-between bg-slate-50/50 flex-wrap gap-4">
          <div className="flex items-center gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
              <input
                type="text"
                placeholder="Buscar por nombre, categoría 7T o instancia..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9 pr-4 py-1.5 bg-white border border-slate-200 rounded-lg text-[10px] font-medium outline-none w-64"
              />
            </div>
            <button className="p-2 bg-white border border-slate-200 rounded-xl text-slate-500 hover:text-brand-primary transition-all"><Filter size={16} /></button>
          </div>
        </div>

        {loading ? (
          <div className="p-12 text-center"><Loader2 className="animate-spin text-brand-primary mx-auto" size={32} /><p className="text-[10px] font-black text-slate-400 mt-2">Cargando proyectos...</p></div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead className="bg-slate-50/30 border-b border-slate-100">
                  <tr>
                    <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Proyecto</th>
                    <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Instancia</th>
                    <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Transformación</th>
                    <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Presupuesto</th>
                    <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Fecha</th>
                    <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Estado</th>
                    <th className="px-6 py-4 text-center font-black text-slate-400 uppercase tracking-widest">Acción</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {paginatedProyectos.map((proy) => (
                    <tr key={`${proy.tipo}-${proy.id}`} className="hover:bg-slate-50/50 transition-colors group">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-xl bg-brand-primary/10 border border-brand-primary/20 flex items-center justify-center text-brand-primary">
                            <Target size={18} />
                          </div>
                          <span className="text-xs font-bold text-slate-900">{proy.nombre}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={cn(
                          "px-2 py-1 rounded-full text-[9px] font-black uppercase",
                          proy.tipo === 'comuna' ? "bg-100 text-700" : "bg-100 text-700"
                        )}>
                          {proy.tipo === 'comuna' ? 'Comuna' : 'Consejo Comunal'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="text-xs font-medium text-slate-700">{proy.categoria_7t}</span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="text-sm font-bold text-slate-900">{formatPresupuesto(proy.presupuesto)}</span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="text-[10px] font-medium text-slate-500">{formatDate(proy.created_at)}</span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={cn("px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider", getEstadoColor(proy.estado))}>
                          {proy.estado}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <button
                          onClick={() => setSelectedProyecto(proy)}
                          className="p-2 bg-slate-100 rounded-lg text-slate-500 hover:text-brand-primary transition-colors"
                          title="Ver detalle"
                        >
                          <Eye size={16} />
                        </button>
                      </td>
                    </tr>
                  ))}
                  {filteredProyectos.length === 0 && (
                    <tr><td colSpan={7} className="px-6 py-12 text-center text-slate-400">No se encontraron proyectos</td></tr>
                  )}
                </tbody>
              </table>
            </div>
            <PaginationControls currentPage={currentPage} totalPages={totalPages} onPageChange={setCurrentPage} />
          </>
        )}
      </div>

      <AnimatePresence>
        {selectedProyecto && <ModalProyecto proyecto={selectedProyecto} onClose={() => setSelectedProyecto(null)} />}
      </AnimatePresence>
    </motion.div>
  );
};

// ==================== MAPA DE SUEÑOS ====================
const TarjetaEntidad = ({ entidad, getSignedImageUrl, formatDate, onClick }: any) => {
  const [imgSrc, setImgSrc] = useState<string | null>(null);
  const [loadingImg, setLoadingImg] = useState(true);

  useEffect(() => {
    let isMounted = true;
    const loadImage = async () => {
      if (entidad.imagen_muestra) {
        setLoadingImg(true);
        const url = await getSignedImageUrl(entidad.imagen_muestra, entidad.tipo);
        if (isMounted) {
          setImgSrc(url);
          setLoadingImg(false);
        }
      } else {
        if (isMounted) {
          setImgSrc(null);
          setLoadingImg(false);
        }
      }
    };
    loadImage();
    return () => { isMounted = false; };
  }, [entidad.imagen_muestra, entidad.tipo, getSignedImageUrl]);

  return (
    <div 
      className="bg-white rounded-2xl border border-slate-100 shadow-sm hover:shadow-md transition-all group cursor-pointer"
      onClick={() => onClick(entidad)}
    >
      <div className="p-5">
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center gap-2">
            <div className={cn(
              "w-8 h-8 rounded-xl flex items-center justify-center transition-transform group-hover:scale-110",
              entidad.tipo === 'comuna' ? "bg-purple-100 text-purple-600" : "bg-blue-100 text-blue-600"
            )}>
              {entidad.tipo === 'comuna' ? <Building2 size={18} /> : <Users size={18} />}
            </div>
            <h4 className="text-xs font-black text-slate-900 uppercase tracking-tight line-clamp-1">{entidad.nombre}</h4>
          </div>
          <span className={cn(
            "px-2 py-1 rounded-lg text-[8px] font-black uppercase border",
            entidad.tipo === 'comuna' ? "bg-purple-50 text-purple-700 border-purple-200" : "bg-blue-50 text-blue-700 border-blue-200"
          )}>
            {entidad.tipo === 'comuna' ? 'Comuna' : 'C.C.'}
          </span>
        </div>
        
        {loadingImg ? (
          <div className="w-full h-32 mb-3 rounded-xl bg-slate-100 flex items-center justify-center">
            <Loader2 className="animate-spin text-slate-400" size={24} />
          </div>
        ) : imgSrc ? (
          <div className="relative w-full h-32 mb-3 rounded-xl overflow-hidden bg-slate-100">
            <img 
              src={imgSrc} 
              alt={entidad.nombre}
              className="w-full h-full object-cover transition-transform group-hover:scale-105"
            />
          </div>
        ) : (
          <div className="w-full h-32 mb-3 rounded-xl bg-gradient-to-br from-slate-100 to-slate-200 flex items-center justify-center">
            <Compass className="text-slate-300" size={32} />
          </div>
        )}

        {entidad.descripcion_mapa && (
          <div className="mb-3">
            <p className="text-[9px] text-slate-500 leading-relaxed line-clamp-3">
              {entidad.descripcion_mapa}
            </p>
          </div>
        )}

        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-1 text-[9px] font-bold text-slate-400">
            <Target size={10} />
            <span>{entidad.suenos.length} {entidad.suenos.length === 1 ? 'sueño' : 'sueños'}</span>
          </div>
          <div className="flex items-center gap-1 text-[9px] font-bold text-slate-400">
            <Calendar size={10} />
            <span>{formatDate(entidad.ultima_fecha)}</span>
          </div>
        </div>

        {entidad.areas.length > 0 && (
          <div className="flex flex-wrap gap-1 mt-2 pt-2 border-t border-slate-50">
            {entidad.areas.slice(0, 2).map((area: string) => (
              <span key={area} className="px-1.5 py-0.5 bg-slate-100 rounded text-[7px] font-black text-slate-500 uppercase">
                {area}
              </span>
            ))}
            {entidad.areas.length > 2 && (
              <span className="px-1.5 py-0.5 text-[7px] font-black text-slate-400">+{entidad.areas.length - 2}</span>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

const DetalleSuenoModal = ({ sueno, getSignedImageUrl, formatDate, onClose }: any) => {
  const [imgSrc, setImgSrc] = useState<string | null>(null);
  const [loadingImg, setLoadingImg] = useState(true);

  useEffect(() => {
    let isMounted = true;
    const loadImage = async () => {
      const imagePath = sueno.imagen_url || sueno.mapa_imagen_url;
      if (imagePath) {
        setLoadingImg(true);
        const url = await getSignedImageUrl(imagePath, sueno.tipo);
        if (isMounted) {
          setImgSrc(url);
          setLoadingImg(false);
        }
      } else {
        if (isMounted) {
          setImgSrc(null);
          setLoadingImg(false);
        }
      }
    };
    loadImage();
    return () => { isMounted = false; };
  }, [sueno, getSignedImageUrl]);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[85vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-5 border-b border-slate-100 flex justify-between items-center sticky top-0 bg-white">
          <h4 className="text-sm font-black text-slate-800 uppercase tracking-tight">Detalle del Sueño</h4>
          <button onClick={onClose} className="p-1 rounded-full hover:bg-slate-100">
            <X size={18} className="text-slate-400" />
          </button>
        </div>
        <div className="p-6 space-y-4">
          <div><span className="text-[10px] font-black text-slate-400 uppercase">Área de trabajo</span><p className="text-sm font-bold">{sueno.area_trabajo || '—'}</p></div>
          <div><span className="text-[10px] font-black text-slate-400 uppercase">Sueño / Problema</span><p className="text-sm">{sueno.problema}</p></div>
          {sueno.solucion && <div><span className="text-[10px] font-black text-slate-400 uppercase">Solución</span><p className="text-sm">{sueno.solucion}</p></div>}
          {sueno.ubicacion && <div><span className="text-[10px] font-black text-slate-400 uppercase">Ubicación</span><p className="text-sm">{sueno.ubicacion}</p></div>}
          {sueno.fortaleza && <div><span className="text-[10px] font-black text-slate-400 uppercase">Fortaleza</span><p className="text-sm">{sueno.fortaleza}</p></div>}
          {sueno.transformacion_7t && <div><span className="text-[10px] font-black text-slate-400 uppercase">Transformación 7T</span><p className="text-sm">{sueno.transformacion_7t}</p></div>}
          {(sueno.nombre_responsable || sueno.apellido_responsable) && (
            <div><span className="text-[10px] font-black text-slate-400 uppercase">Responsable</span><p className="text-sm">{sueno.nombre_responsable} {sueno.apellido_responsable} {sueno.cedula_responsable && `(C.I: ${sueno.cedula_responsable})`}</p></div>
          )}
          <div><span className="text-[10px] font-black text-slate-400 uppercase">Fecha registro</span><p className="text-sm">{formatDate(sueno.created_at)}</p></div>
          {loadingImg ? (
            <div className="flex justify-center py-4"><Loader2 className="animate-spin text-slate-400" size={24} /></div>
          ) : imgSrc && (
            <div>
              <span className="text-[10px] font-black text-slate-400 uppercase">Imagen</span>
              <img src={imgSrc} className="mt-2 rounded-xl max-h-48 object-cover border" alt="Evidencia" />
            </div>
          )}
          {sueno.mapa_descripcion && (
            <div>
              <span className="text-[10px] font-black text-slate-400 uppercase">Descripción del mapa</span>
              <p className="text-sm text-slate-600 mt-1">{sueno.mapa_descripcion}</p>
            </div>
          )}
        </div>
        <div className="p-4 border-t border-slate-100 bg-slate-50/50 flex justify-end">
          <button onClick={onClose} className="px-4 py-2 bg-brand-primary text-white text-[10px] font-black uppercase rounded-lg">Cerrar</button>
        </div>
      </motion.div>
    </motion.div>
  );
};

const MapaDeSuenos = () => {
  const [entidades, setEntidades] = useState<EntidadSuenos[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterTipo, setFilterTipo] = useState<'all' | 'comuna' | 'consejo'>('all');
  const [selectedEntidad, setSelectedEntidad] = useState<EntidadSuenos | null>(null);
  const [viewSuenoDetail, setViewSuenoDetail] = useState<Sueno | null>(null);
  const [imageUrls, setImageUrls] = useState<Map<string, string>>(new Map());
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 9;

  useEffect(() => {
    const fetchAllSuenos = async () => {
      setLoading(true);
      const allSuenos: Sueno[] = [];

      const { data: suenosComuna, error: errorComuna } = await supabase
        .from('mapa_suenos_comuna')
        .select(`
          id_sueno_comuna,
          id_comuna,
          area_trabajo,
          problema,
          solucion,
          ubicacion,
          fortaleza,
          transformacion_7t,
          imagen_url,
          created_at,
          nombre_responsable,
          apellido_responsable,
          cedula_responsable,
          datos_comuna!left (nombre_comuna, mapa_imagen_url, mapa_descripcion)
        `);
      if (errorComuna) console.error('Error cargando sueños de comunas:', errorComuna);
      if (suenosComuna) {
        suenosComuna.forEach((item: any) => {
          allSuenos.push({
            id: item.id_sueno_comuna,
            tipo: 'comuna',
            entidad_id: item.id_comuna,
            entidad_nombre: item.datos_comuna?.nombre_comuna || 'Comuna sin nombre',
            area_trabajo: item.area_trabajo,
            problema: item.problema,
            solucion: item.solucion,
            ubicacion: item.ubicacion,
            fortaleza: item.fortaleza,
            transformacion_7t: item.transformacion_7t,
            nombre_responsable: item.nombre_responsable,
            apellido_responsable: item.apellido_responsable,
            cedula_responsable: item.cedula_responsable,
            created_at: item.created_at,
            imagen_url: item.imagen_url,
            mapa_imagen_url: item.datos_comuna?.mapa_imagen_url || null,
            mapa_descripcion: item.datos_comuna?.mapa_descripcion || null
          });
        });
      }

      const { data: suenosConsejo, error: errorConsejo } = await supabase
        .from('mapa_suenos')
        .select(`
          id_sueno,
          id_consejo,
          area_trabajo,
          problema,
          solucion,
          ubicacion,
          fortaleza,
          transformacion_7t,
          created_at,
          nombre_responsable,
          apellido_responsable,
          cedula_responsable,
          datos_consejo_comunal!left (nombre_consejo, mapa_imagen_url, mapa_descripcion)
        `);
      if (errorConsejo) console.error('Error cargando sueños de consejos:', errorConsejo);
      if (suenosConsejo) {
        suenosConsejo.forEach((item: any) => {
          allSuenos.push({
            id: item.id_sueno,
            tipo: 'consejo',
            entidad_id: item.id_consejo,
            entidad_nombre: item.datos_consejo_comunal?.nombre_consejo || 'Consejo sin nombre',
            area_trabajo: item.area_trabajo,
            problema: item.problema,
            solucion: item.solucion,
            ubicacion: item.ubicacion,
            fortaleza: item.fortaleza,
            transformacion_7t: item.transformacion_7t,
            nombre_responsable: item.nombre_responsable,
            apellido_responsable: item.apellido_responsable,
            cedula_responsable: item.cedula_responsable,
            created_at: item.created_at,
            imagen_url: null,
            mapa_imagen_url: item.datos_consejo_comunal?.mapa_imagen_url || null,
            mapa_descripcion: item.datos_consejo_comunal?.mapa_descripcion || null
          });
        });
      }

      const entidadesMap = new Map<string, EntidadSuenos>();
      for (const sueno of allSuenos) {
        const key = `${sueno.tipo}-${sueno.entidad_id}`;
        if (!entidadesMap.has(key)) {
          entidadesMap.set(key, {
            id: sueno.entidad_id,
            tipo: sueno.tipo,
            nombre: sueno.entidad_nombre,
            suenos: [],
            imagen_muestra: undefined,
            descripcion_mapa: sueno.mapa_descripcion || undefined,
            ultima_fecha: sueno.created_at,
            areas: []
          });
        }
        const entidad = entidadesMap.get(key)!;
        entidad.suenos.push(sueno);
        if (new Date(sueno.created_at) > new Date(entidad.ultima_fecha)) {
          entidad.ultima_fecha = sueno.created_at;
        }
        if (!entidad.imagen_muestra) {
          if (sueno.imagen_url) entidad.imagen_muestra = sueno.imagen_url;
          else if (sueno.mapa_imagen_url) entidad.imagen_muestra = sueno.mapa_imagen_url;
        }
        if (!entidad.descripcion_mapa && sueno.mapa_descripcion) {
          entidad.descripcion_mapa = sueno.mapa_descripcion;
        }
        if (sueno.area_trabajo && !entidad.areas.includes(sueno.area_trabajo)) {
          entidad.areas.push(sueno.area_trabajo);
        }
      }

      const entidadesArray = Array.from(entidadesMap.values());
      entidadesArray.sort((a, b) => new Date(b.ultima_fecha).getTime() - new Date(a.ultima_fecha).getTime());
      setEntidades(entidadesArray);
      setLoading(false);
    };

    fetchAllSuenos();
  }, []);

  const getSignedImageUrl = async (path: string, tipo: 'comuna' | 'consejo'): Promise<string | null> => {
    if (!path) return null;
    const bucket = tipo === 'comuna' ? 'documentos_comuna' : 'documentos_consejos';
    const cacheKey = `${bucket}|${path}`;
    if (imageUrls.has(cacheKey)) return imageUrls.get(cacheKey)!;
    try {
      const { data, error } = await supabase.storage
        .from(bucket)
        .createSignedUrl(path, 3600);
      if (error) {
        console.error(`Error creating signed URL for ${bucket}/${path}:`, error);
        return null;
      }
      if (data?.signedUrl) {
        setImageUrls(prev => new Map(prev).set(cacheKey, data.signedUrl));
        return data.signedUrl;
      }
      return null;
    } catch (err) {
      console.error('Unexpected error getting signed URL:', err);
      return null;
    }
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('es-ES', { year: 'numeric', month: 'short', day: 'numeric' });
  };

  const filteredEntidades = entidades.filter(ent =>
    (ent.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
     ent.suenos.some(s => s.problema.toLowerCase().includes(searchTerm.toLowerCase()))) &&
    (filterTipo === 'all' || ent.tipo === filterTipo)
  );

  const totalPages = Math.ceil(filteredEntidades.length / itemsPerPage);
  const paginatedEntidades = filteredEntidades.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  useEffect(() => setCurrentPage(1), [searchTerm, filterTipo]);

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="space-y-6">
      <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden">
        <div className="p-6 border-b border-slate-50 flex items-center justify-between bg-slate-50/50 flex-wrap gap-4">
          <div className="flex items-center gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
              <input 
                type="text" 
                placeholder="Buscar comuna, consejo o sueño..." 
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9 pr-4 py-2 bg-white border border-slate-200 rounded-xl text-xs font-medium outline-none focus:ring-2 focus:ring-brand-primary/20 w-64" 
              />
            </div>
            <div className="flex gap-2">
              <button onClick={() => setFilterTipo('all')} className={cn("px-3 py-1.5 rounded-lg text-[9px] font-black uppercase", filterTipo === 'all' ? "bg-brand-primary text-white" : "bg-white text-slate-500 border border-slate-200")}>Todos</button>
              <button onClick={() => setFilterTipo('comuna')} className={cn("px-3 py-1.5 rounded-lg text-[9px] font-black uppercase", filterTipo === 'comuna' ? "bg-purple-500 text-white" : "bg-white text-slate-500 border border-slate-200")}>Comunas</button>
              <button onClick={() => setFilterTipo('consejo')} className={cn("px-3 py-1.5 rounded-lg text-[9px] font-black uppercase", filterTipo === 'consejo' ? "bg-blue-500 text-white" : "bg-white text-slate-500 border border-slate-200")}>Consejos Comunales</button>
            </div>
          </div>
          <div className="flex items-center gap-1 text-[9px] font-black text-slate-400 bg-slate-100 px-3 py-1.5 rounded-full">
            <Compass size={12} /> Entidades con sueños: {filteredEntidades.length}
          </div>
        </div>

        {loading ? (
          <div className="p-12 text-center"><Loader2 className="animate-spin text-brand-primary mx-auto" size={32} /><p className="text-[10px] font-black text-slate-400 mt-2">Cargando sueños comunitarios...</p></div>
        ) : (
          <div className="p-6">
            {filteredEntidades.length === 0 ? (
              <div className="text-center py-12 text-slate-400"><Compass className="mx-auto h-12 w-12 mb-3 opacity-30" /><p className="text-[10px] font-black uppercase">No se encontraron entidades con sueños registrados</p></div>
            ) : (
              <>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {paginatedEntidades.map((entidad) => (
                    <TarjetaEntidad
                      key={`${entidad.tipo}-${entidad.id}`}
                      entidad={entidad}
                      getSignedImageUrl={getSignedImageUrl}
                      formatDate={formatDate}
                      onClick={setSelectedEntidad}
                    />
                  ))}
                </div>
                <PaginationControls currentPage={currentPage} totalPages={totalPages} onPageChange={setCurrentPage} />
              </>
            )}
          </div>
        )}
      </div>

      {/* Modal de lista de sueños de la entidad */}
      <AnimatePresence>
        {selectedEntidad && (
          <motion.div 
            initial={{ opacity: 0 }} 
            animate={{ opacity: 1 }} 
            exit={{ opacity: 0 }} 
            className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4" 
            onClick={() => setSelectedEntidad(null)}
          >
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }} 
              animate={{ scale: 1, opacity: 1 }} 
              exit={{ scale: 0.9, opacity: 0 }} 
              className="bg-white rounded-2xl shadow-2xl max-w-3xl w-full max-h-[85vh] overflow-hidden flex flex-col" 
              onClick={(e) => e.stopPropagation()}
            >
              <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-gradient-to-r from-brand-primary/5 to-transparent">
                <div className="flex items-center gap-3">
                  {selectedEntidad.tipo === 'comuna' ? <Building2 className="text-purple-500" size={24} /> : <Users className="text-blue-500" size={24} />}
                  <div>
                    <h3 className="text-sm font-black text-slate-800 uppercase tracking-tight">{selectedEntidad.nombre}</h3>
                    <p className="text-[9px] text-slate-400">{selectedEntidad.suenos.length} sueños registrados</p>
                  </div>
                </div>
                <button onClick={() => setSelectedEntidad(null)} className="p-1 rounded-full hover:bg-slate-100">
                  <X size={18} className="text-slate-400" />
                </button>
              </div>
              <div className="overflow-x-auto p-6 flex-1">
                <table className="w-full text-left border-collapse">
                  <thead className="bg-slate-50/50 border-b border-slate-100 text-[10px] font-black text-slate-400 uppercase tracking-widest">
                    <tr>
                      <th className="px-3 py-3">Área / 7T</th>
                      <th className="px-3 py-3">Sueño / Nudo</th>
                      <th className="px-3 py-3">Solución</th>
                      <th className="px-3 py-3">Responsable</th>
                      <th className="px-3 py-3">Ubicación</th>
                      <th className="px-3 py-3">Fortaleza</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50">
                    {selectedEntidad.suenos.map((sueno) => (
                      <tr key={sueno.id} className="hover:bg-slate-50/50 transition-colors text-xs">
                        <td className="px-3 py-3 align-top">
                          <p className="text-[11px] font-black text-brand-primary uppercase">{sueno.area_trabajo || '—'}</p>
                          {sueno.transformacion_7t && <span className="text-[9px] bg-slate-100 text-slate-500 px-1.5 py-0.5 rounded-full">{sueno.transformacion_7t.split(':')[0]}</span>}
                        </td>
                        <td className="px-3 py-3 text-slate-700 max-w-[180px] break-words">{sueno.problema}</td>
                        <td className="px-3 py-3 text-slate-600 max-w-[150px] break-words">{sueno.solucion || '—'}</td>
                        <td className="px-3 py-3 text-[10px] font-bold text-slate-800">
                          {sueno.nombre_responsable && sueno.apellido_responsable ? `${sueno.nombre_responsable} ${sueno.apellido_responsable}` : sueno.nombre_responsable || sueno.apellido_responsable || '—'}
                          {sueno.cedula_responsable && <span className="block text-[9px] text-slate-500 font-normal">C.I: {sueno.cedula_responsable}</span>}
                        </td>
                        <td className="px-3 py-3 text-slate-500">{sueno.ubicacion || '—'}</td>
                        <td className="px-3 py-3 text-slate-500">{sueno.fortaleza || '—'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {selectedEntidad.suenos.length === 0 && <div className="text-center py-12 text-slate-400">No hay sueños registrados para esta entidad</div>}
              </div>
              <div className="p-4 border-t border-slate-100 bg-slate-50/50 flex justify-end">
                <button onClick={() => setSelectedEntidad(null)} className="px-4 py-2 bg-brand-primary hover:bg-brand-primary/90 text-white text-[10px] font-black uppercase rounded-lg transition-colors">
                  Cerrar
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {viewSuenoDetail && <DetalleSuenoModal sueno={viewSuenoDetail} getSignedImageUrl={getSignedImageUrl} formatDate={formatDate} onClose={() => setViewSuenoDetail(null)} />}
      </AnimatePresence>
    </motion.div>
  );
};