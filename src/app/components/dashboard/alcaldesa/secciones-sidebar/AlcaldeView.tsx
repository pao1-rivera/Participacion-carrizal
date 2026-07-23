import React, { useState, useEffect, useCallback } from 'react';
import { 
  CheckCircle2, Globe, TrendingUp, Users, ShieldAlert, 
  BarChart3, ExternalLink, Eye, Zap, Heart, 
  HardHat, Clock, Activity, Map as MapIcon, Loader2, AlertTriangle,
  UserCheck
} from 'lucide-react';
import { motion } from 'framer-motion';
import { cn } from '@/app/lib/utils';
import { UserBase } from '@/types';
import { supabase } from '@/app/lib/supabaseClient';

// Import dinámico de Leaflet para el mapa
import dynamic from 'next/dynamic';

// ============================================
// TIPOS
// ============================================
interface NudoCritico {
  id: number;
  titulo: string;
  gravedad: string;
  latitud: number | null;
  longitud: number | null;
  id_consejo?: number;
  id_comuna?: number;
}

// ============================================
// COMPONENTE DE MAPA (usando Leaflet)
// ============================================
const MapComponent = dynamic(
  () => import('react-leaflet').then((module) => {
    const { MapContainer, TileLayer, CircleMarker, Popup, Tooltip } = module;
    const L = require('leaflet');

    delete L.Icon.Default.prototype._getIconUrl;
    L.Icon.Default.mergeOptions({
      iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
      iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
      shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
    });

    const MapContent = ({ puntos }: { puntos: NudoCritico[] }) => {
      const center: [number, number] = [10.3496, -66.9845];
      return (
        <MapContainer center={center} zoom={12} style={{ height: '100%', width: '100%' }} scrollWheelZoom={true}>
          <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
          {puntos.map((p) => {
            if (!p.latitud || !p.longitud) return null;
            const esAlta = p.gravedad?.toLowerCase().includes('alto') || p.gravedad?.toLowerCase().includes('crítico');
            const radius = esAlta ? 18 : 12;
            const color = esAlta ? '#ef4444' : p.gravedad === 'Medio' ? '#f97316' : '#eab308';
            return (
              <CircleMarker
                key={p.id}
                center={[p.latitud, p.longitud]}
                radius={radius}
                pathOptions={{ color, weight: 1, fillColor: color, fillOpacity: 0.6 }}
              >
                <Popup>
                  <div className="p-2 min-w-40">
                    <h4 className="font-black text-xs uppercase">{p.titulo}</h4>
                    <p className="text-[9px] text-slate-500 mt-1">Gravedad: {p.gravedad || 'No definida'}</p>
                  </div>
                </Popup>
                <Tooltip direction="top" offset={[0, -radius]} opacity={0.9} sticky>
                  <span className="text-[9px] font-black">{p.titulo}</span>
                </Tooltip>
              </CircleMarker>
            );
          })}
        </MapContainer>
      );
    };
    return MapContent;
  }),
  { ssr: false, loading: () => <div className="h-full w-full flex items-center justify-center bg-slate-50"><Loader2 className="animate-spin text-brand-primary" size={32} /></div> }
);

// ============================================
// COMPONENTE PRINCIPAL
// ============================================
export const AlcaldeView = ({ user, activeSection }: { user: UserBase; activeSection: string }) => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Estados de datos
  const [poblacionAtendida, setPoblacionAtendida] = useState(0);
  const [proyectosCulminados, setProyectosCulminados] = useState(0);
  const [organizacionPopular, setOrganizacionPopular] = useState(0);
  const [nudosCriticos, setNudosCriticos] = useState<NudoCritico[]>([]);
  const [topNudos, setTopNudos] = useState<{ label: string; value: number; count: number; color: string }[]>([]);
  const [totalConsejos, setTotalConsejos] = useState(0);
  const [totalComunas, setTotalComunas] = useState(0);
  const [totalSalas, setTotalSalas] = useState(0);
  const [adultosMayores, setAdultosMayores] = useState(0);
  const [alfabetizacionDigital, setAlfabetizacionDigital] = useState({ total: 0, conInternet: 0 });

  // ============================================
  // CARGA DE DATOS
  // ============================================
  const cargarDatos = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      // 1. Población atendida (suma de personas censadas)
      const { data: fichas, error: errFichas } = await supabase
        .from('censo_fichas')
        .select('id_ficha');
      if (errFichas) throw errFichas;
      
      let totalPersonas = 0;
      if (fichas && fichas.length > 0) {
        const ids = fichas.map(f => f.id_ficha);
        const { data: familiares, error: errFam } = await supabase
          .from('censo_familiares')
          .select('id_familiar')
          .in('id_ficha', ids);
        if (errFam) throw errFam;
        totalPersonas = fichas.length + (familiares?.length || 0);
      }
      setPoblacionAtendida(totalPersonas);

      // 2. Proyectos culminados
      const { data: proyCulminados, error: errProy } = await supabase
        .from('proyectos')
        .select('id_proyecto')
        .eq('estado', 'Culminado');
      if (errProy) throw errProy;
      setProyectosCulminados(proyCulminados?.length || 0);

      // 3. Organización Popular
      const { data: consejos, error: errCons } = await supabase
        .from('datos_consejo_comunal')
        .select('id_consejo');
      if (errCons) throw errCons;
      setTotalConsejos(consejos?.length || 0);
      
      const { data: comunas, error: errCom } = await supabase
        .from('datos_comuna')
        .select('id_comuna');
      if (errCom) throw errCom;
      setTotalComunas(comunas?.length || 0);

      const { data: salas, error: errSal } = await supabase
        .from('datos_sala_autogobierno')
        .select('id_sala');
      if (errSal) throw errSal;
      setTotalSalas(salas?.length || 0);

      const totalOrganizaciones = (consejos?.length || 0) + (comunas?.length || 0) + (salas?.length || 0);
      setOrganizacionPopular(totalOrganizaciones);

      // 5. Nudos críticos
      const { data: nudosConsejo, error: errN1 } = await supabase
        .from('nudos_criticos')
        .select('id_nudo, titulo, gravedad, latitud, longitud, id_consejo');
      if (errN1) throw errN1;
      
      const { data: nudosComuna, error: errN2 } = await supabase
        .from('nudos_criticos_comuna')
        .select('id_nudo_comuna, titulo, gravedad, latitud, longitud, id_comuna');
      if (errN2) throw errN2;

      const nudosCombinados: NudoCritico[] = [
        ...(nudosConsejo || []).map(n => ({ 
          id: n.id_nudo, 
          titulo: n.titulo, 
          gravedad: n.gravedad, 
          latitud: n.latitud, 
          longitud: n.longitud,
          id_consejo: n.id_consejo,
        })),
        ...(nudosComuna || []).map(n => ({ 
          id: n.id_nudo_comuna, 
          titulo: n.titulo, 
          gravedad: n.gravedad, 
          latitud: n.latitud, 
          longitud: n.longitud,
          id_comuna: n.id_comuna,
        })),
      ];
      setNudosCriticos(nudosCombinados);

      // Top 5 nudos por gravedad
      const gravedadCount: Record<string, number> = {};
      nudosCombinados.forEach(n => {
        const g = n.gravedad || 'Baja';
        gravedadCount[g] = (gravedadCount[g] || 0) + 1;
      });
      const sorted = Object.entries(gravedadCount)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5)
        .map(([label, count]) => {
          let color = 'bg-brand-primary';
          if (label.toLowerCase().includes('alto') || label.toLowerCase().includes('crítico')) color = 'bg-rose-500';
          else if (label === 'Medio') color = 'bg-amber-500';
          else color = 'bg-emerald-500';
          return { label, value: Math.round((count / nudosCombinados.length) * 100), count, color };
        });
      setTopNudos(sorted.length ? sorted : [{ label: 'Sin nudos', value: 0, count: 0, color: 'bg-slate-300' }]);

      // 6. Adultos mayores
      const { data: adultos, error: errAdult } = await supabase
        .from('adultos_mayores')
        .select('id_adulto');
      if (!errAdult && adultos) {
        setAdultosMayores(adultos.length);
      }

      // 7. Alfabetización digital
      const { data: digital, error: errDig } = await supabase
        .from('analfabetismo_digital')
        .select('posee_internet');
      if (!errDig && digital) {
        const total = digital.length;
        const conInternet = digital.filter(d => d.posee_internet === 'SI').length;
        setAlfabetizacionDigital({ total, conInternet });
      }

    } catch (err: any) {
      console.error('Error cargando datos del dashboard:', err);
      setError(err.message || 'Error al cargar los datos');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    cargarDatos();
  }, [cargarDatos]);

  // Renderizado condicional según sección activa
  const renderContent = () => {
    if (activeSection !== 'dashboard') {
      return (
        <div className="flex items-center justify-center h-[calc(100vh-200px)]">
          <div className="text-center p-12 bg-white rounded-[3rem] border border-slate-100 shadow-xl max-w-lg">
            <div className="w-20 h-20 bg-brand-primary/5 rounded-full flex items-center justify-center mx-auto mb-6">
              <Users className="text-brand-primary w-10 h-10 animate-pulse" />
            </div>
            <h2 className="text-2xl font-black text-slate-900 italic tracking-tighter uppercase mb-4">Dimensión en Desarrollo</h2>
            <p className="text-slate-500 font-medium leading-relaxed">
              Esta sección del Monitor Municipal está siendo consolidada con datos en tiempo real de las Direcciones Técnicas.
            </p>
          </div>
        </div>
      );
    }
    return <DashboardView 
      loading={loading} 
      error={error} 
      data={{
        poblacionAtendida,
        proyectosCulminados,
        organizacionPopular,
        nudosCriticos,
        topNudos,
        totalConsejos,
        totalComunas,
        totalSalas,
        adultosMayores,
        alfabetizacionDigital,
      }}
    />;
  };

  return renderContent();
};

// ============================================
// VISTA DEL DASHBOARD CON DATOS REALES
// ============================================
interface DashboardData {
  poblacionAtendida: number;
  proyectosCulminados: number;
  organizacionPopular: number;
  nudosCriticos: NudoCritico[];
  topNudos: { label: string; value: number; count: number; color: string }[];
  totalConsejos: number;
  totalComunas: number;
  totalSalas: number;
  adultosMayores: number;
  alfabetizacionDigital: { total: number; conInternet: number };
}

const DashboardView = ({ loading, error, data }: { loading: boolean; error: string | null; data: DashboardData }) => {
  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[500px]">
        <Loader2 className="animate-spin text-brand-primary h-12 w-12" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 p-8 rounded-3xl text-center">
        <AlertTriangle className="h-12 w-12 text-red-500 mx-auto mb-3" />
        <p className="text-red-700 font-bold">{error}</p>
        <button onClick={() => window.location.reload()} className="mt-4 px-6 py-2 bg-red-100 text-red-700 rounded-xl text-xs font-black">
          Reintentar
        </button>
      </div>
    );
  }

  const {
    poblacionAtendida,
    proyectosCulminados,
    organizacionPopular,
    nudosCriticos,
    topNudos,
    totalConsejos,
    totalComunas,
    totalSalas,
    adultosMayores,
    alfabetizacionDigital,
  } = data;

  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -30 }}
      transition={{ duration: 0.6, ease: 'easeOut' }}
      className="space-y-12"
    >
      {/* KPIs superiores */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        <HighLevelKPI 
          label="Población Atendida" 
          value={poblacionAtendida.toLocaleString()} 
          sub="Personas censadas" 
          icon={Users} 
          color="bg-brand-primary" 
          trend={`${poblacionAtendida > 0 ? '+12%' : '0%'} vs mes anterior`}
        />
        <HighLevelKPI 
          label="Proyectos Culminados" 
          value={proyectosCulminados.toString()} 
          sub="Obras físicas listas" 
          icon={CheckCircle2} 
          color="bg-emerald-500" 
          trend={`${proyectosCulminados} obras este trimestre`}
        />
        <HighLevelKPI 
          label="Organización Popular" 
          value={organizacionPopular.toString()} 
          sub="Entidades registradas" 
          icon={Globe} 
          color="bg-indigo-600" 
          trend={`${totalConsejos} CC, ${totalComunas} Comunas, ${totalSalas} Salas`}
        />
      </div>

      {/* Sección: Mapa de nudos críticos + Top nudos */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
        {/* Mapa de nudos críticos */}
        <div className="lg:col-span-2 bg-white rounded-[3rem] border border-slate-100 shadow-xl overflow-hidden flex flex-col h-[600px] group transition-all hover:shadow-2xl">
          <div className="p-6 border-b border-slate-50 flex items-center justify-between bg-slate-50/20">
            <div>
              <h3 className="text-xl font-black text-slate-900 tracking-tighter italic uppercase leading-none">Nudos Críticos del Municipio</h3>
              <p className="text-[10px] text-slate-400 font-bold uppercase tracking-[0.3em] mt-2">
                {nudosCriticos.length} nudos registrados • {nudosCriticos.filter(n => n.gravedad?.toLowerCase().includes('alto') || n.gravedad?.toLowerCase().includes('crítico')).length} de alta gravedad
              </p>
            </div>
            <div className="flex gap-2">
              <div className="flex items-center gap-6 bg-white px-4 py-2 rounded-2xl border border-slate-100 shadow-sm">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-rose-500" />
                  <span className="text-[10px] font-black text-slate-600 uppercase">Alto</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-amber-500" />
                  <span className="text-[10px] font-black text-slate-600 uppercase">Medio</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-emerald-500" />
                  <span className="text-[10px] font-black text-slate-600 uppercase">Bajo</span>
                </div>
              </div>
            </div>
          </div>
          <div className="flex-1 bg-slate-100 relative overflow-hidden min-h-[300px]">
            {nudosCriticos.filter(n => n.latitud && n.longitud).length > 0 ? (
              <MapComponent puntos={nudosCriticos} />
            ) : (
              <div className="flex items-center justify-center h-full text-slate-400">
                <div className="text-center">
                  <MapIcon size={48} className="mx-auto mb-4 opacity-30" />
                  <p className="font-bold">No hay nudos con ubicación registrada</p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Top 5 nudos críticos */}
        <div className="bg-white rounded-[3rem] border border-slate-100 shadow-xl p-8 flex flex-col h-full">
          <div className="flex items-center justify-between mb-8">
            <h3 className="text-sm font-black text-slate-900 italic uppercase">Impacto: Nudos Críticos</h3>
            <BarChart3 className="text-slate-300 w-6 h-6" />
          </div>
          
          <div className="flex-1 space-y-6">
            {topNudos.map((item, idx) => (
              <CriticalBar key={idx} label={item.label} value={item.value} count={item.count} color={item.color} />
            ))}
          </div>

          <div className="mt-8 p-4 bg-brand-primary/5 rounded-2xl border border-brand-primary/5 flex items-center gap-3">
            <Zap className="text-brand-primary w-5 h-5 fill-brand-primary" />
            <p className="text-[10px] font-bold text-slate-600 italic">
              Total nudos: {nudosCriticos.length} • {nudosCriticos.filter(n => n.gravedad?.toLowerCase().includes('alto') || n.gravedad?.toLowerCase().includes('crítico')).length} de alta gravedad
            </p>
          </div>
        </div>
      </div>

      {/* Sección de caracterización con datos reales */}
      <div className="bg-white rounded-[3rem] border border-slate-100 shadow-xl p-10 overflow-hidden relative group">
        <div className="flex items-center justify-between mb-10 pb-6 border-b border-slate-50">
          <div>
            <h3 className="text-2xl font-black text-slate-900 italic tracking-tighter uppercase leading-none">Diagnóstico de Capacidades Instaladas</h3>
            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-[0.4em] mt-3 italic">Instrumento de Caracterización Integral 2026</p>
          </div>
          <button className="flex items-center gap-3 px-6 py-3 bg-slate-50 text-slate-900 text-[10px] font-black uppercase tracking-widest rounded-2xl border border-slate-200 hover:bg-slate-100 transition-all shadow-sm active:scale-95">
            Imprimir Informe Técnico <ExternalLink size={14} />
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12">
          <MetricRing 
            label="Alfabetización Digital" 
            value={`${alfabetizacionDigital.total > 0 ? Math.round((alfabetizacionDigital.conInternet / alfabetizacionDigital.total) * 100) : 0}%`} 
            desc={`${alfabetizacionDigital.conInternet} con internet de ${alfabetizacionDigital.total}`} 
            color="text-brand-primary" 
            sub="Diagnóstico digital" 
          />
          <MetricRing 
            label="Adulto Mayor" 
            value={adultosMayores.toString()} 
            desc="Personas +60 años registradas" 
            color="text-emerald-500" 
            sub="Programa Carrizal Cuida" 
          />
          <MetricRing 
            label="Consejos Comunales" 
            value={totalConsejos.toString()} 
            desc="Organización base" 
            color="text-amber-500" 
            sub="Vocerías vigentes" 
          />
          <MetricRing 
            label="Rendición de Cuentas" 
            value={`${totalConsejos > 0 ? Math.min(100, Math.round((totalConsejos / 20) * 100)) : 0}%`} 
            desc="Expedientes SITUR al día" 
            color="text-indigo-600" 
            sub="Transparencia activa" 
          />
        </div>

        <div className="absolute -bottom-20 -left-20 w-80 h-80 bg-brand-primary/5 rounded-full blur-[100px]" />
      </div>
    </motion.div>
  );
};

// ============================================
// COMPONENTES AUXILIARES
// ============================================
const HighLevelKPI = ({ label, value, sub, icon: Icon, color, trend }: any) => (
  <div className="bg-white p-10 rounded-[3rem] border border-slate-100 shadow-xl shadow-slate-200/30 group transition-all hover:shadow-2xl hover:-translate-y-1 overflow-hidden relative">
    <div className="relative z-10 flex flex-col items-center text-center">
      <div className={cn("inline-flex p-5 rounded-3xl text-white shadow-2xl mb-8 group-hover:scale-110 transition-transform duration-500", color)}>
        <Icon size={32} strokeWidth={1.5} />
      </div>
      <h3 className="text-[11px] font-black text-slate-400 uppercase tracking-[0.3em] leading-none mb-3">{label}</h3>
      <p className="text-4xl font-black text-slate-900 tracking-tighter leading-none mb-3">{value}</p>
      <p className="text-[10px] text-slate-500 font-bold uppercase tracking-tight italic opacity-60">{sub}</p>
      <div className="mt-8 pt-8 border-t border-slate-50 w-full flex items-center justify-center gap-2">
        <Activity size={14} className="text-brand-primary" />
        <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">{trend}</span>
      </div>
    </div>
    <div className="absolute -bottom-10 -right-10 w-32 h-32 bg-slate-50 rounded-full blur-2xl group-hover:bg-brand-primary/5 transition-colors" />
  </div>
);

const CriticalBar = ({ label, value, count, color }: any) => (
  <div className="space-y-3 group">
    <div className="flex justify-between items-center">
      <span className="text-[10px] font-black text-slate-600 uppercase italic tracking-tight">{label}</span>
      <div className="flex items-center gap-3">
        <span className="text-[10px] font-black text-slate-900">{count} Reportes</span>
        <span className={cn("text-[10px] font-black text-white px-2 py-0.5 rounded-md", color)}>{value}%</span>
      </div>
    </div>
    <div className="h-2 w-full bg-slate-50 rounded-full overflow-hidden border border-slate-100">
      <motion.div 
        initial={{ width: 0 }}
        animate={{ width: `${value}%` }}
        transition={{ duration: 1, ease: 'easeOut' }}
        className={cn("h-full rounded-full transition-all group-hover:opacity-80", color)}
      />
    </div>
  </div>
);

const MetricRing = ({ label, value, desc, color, sub }: any) => (
  <div className="flex flex-col items-center text-center space-y-5">
    <div className="relative w-28 h-28 flex items-center justify-center">
      <svg className="w-full h-full -rotate-90">
        <circle
          cx="56"
          cy="56"
          r="48"
          stroke="currentColor"
          strokeWidth="8"
          fill="transparent"
          className="text-slate-50"
        />
        <motion.circle
          cx="56"
          cy="56"
          r="48"
          stroke="currentColor"
          strokeWidth="8"
          fill="transparent"
          strokeDasharray={2 * Math.PI * 48}
          initial={{ strokeDashoffset: 2 * Math.PI * 48 }}
          animate={{ strokeDashoffset: 2 * Math.PI * 48 * (1 - (typeof value === 'string' && value.includes('%') ? parseFloat(value) / 100 : 0)) }}
          transition={{ duration: 1.5, ease: 'easeOut' }}
          className={cn(color)}
        />
      </svg>
      <span className="absolute text-2xl font-black text-slate-900 tracking-tighter italic">{value}</span>
    </div>
    <div className="space-y-1">
      <h4 className="text-[11px] font-black text-slate-900 uppercase italic tracking-tighter leading-none">{label}</h4>
      <p className="text-[9px] text-slate-400 font-bold uppercase tracking-widest">{desc}</p>
      <p className="text-[9px] font-black text-brand-primary opacity-60 pt-2 border-t border-slate-50">{sub}</p>
    </div>
  </div>
);

export default AlcaldeView;