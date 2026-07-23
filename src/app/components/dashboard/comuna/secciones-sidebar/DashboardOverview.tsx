"use client";

import React, { useState, useEffect, useMemo } from "react";
import { motion } from 'framer-motion';
import { 
  Users, 
  Shield, 
  Megaphone, 
  AlertCircle, 
  Construction, 
  Clock, 
  FileCheck, 
  Upload, 
  CheckCircle2, 
  Info, 
  Bell, 
  Plus, 
  ChevronRight,
  Calendar,
  Loader2,
  PieChart,
  BarChart3,
  TrendingUp
} from "lucide-react";
import { cn } from "@/app/lib/utils";
import { supabase } from "@/app/lib/supabaseClient";
import { useAuth } from "@/context/AuthContext";

interface DashboardOverviewProps {
  user: any;
  onNavigate: (s: any, a?: string) => void;
}

interface NudosStats {
  total: number;
  porCategoria: {
    T1: number;
    T2: number;
    T3: number;
    T4: number;
    T5: number;
    T6: number;
    T7: number;
  };
}

interface ProyectoResumen {
  nombre: string;
  progreso: number;
  estado: string;
}

interface AsambleasPorSemana {
  semana: string;
  cantidad: number;
  fechaMasReciente: string;
}

interface Stats {
  poblacion: number;
  asambleas: number;
  nudos: number;
  proyectosActivos: number;
  ultimaAsamblea: string | null;
  proyectosAprobados: ProyectoResumen[];
  asambleasPorSemana: AsambleasPorSemana[];
}

export const DashboardOverview = ({
  user,
  onNavigate,
}: DashboardOverviewProps) => {
  const { user: authUser } = useAuth();
  const [comunaId, setComunaId] = useState<number | null>(null);
  const [noComuna, setNoComuna] = useState(false);
  const [stats, setStats] = useState<Stats>({
    poblacion: 0,
    asambleas: 0,
    nudos: 0,
    proyectosActivos: 0,
    ultimaAsamblea: null,
    proyectosAprobados: [],
    asambleasPorSemana: [],
  });
  const [nudosStats, setNudosStats] = useState<NudosStats>({
    total: 0,
    porCategoria: { T1: 0, T2: 0, T3: 0, T4: 0, T5: 0, T6: 0, T7: 0 }
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadDashboard = async () => {
      setLoading(true);
      setError(null);

      if (!user?.id) {
        setLoading(false);
        return;
      }

      // 1. Obtener id_comuna (dueño o auxiliar)
      const { data: comunaData, error: comunaError } = await supabase
        .from('datos_comuna')
        .select('id_comuna')
        .or(`id_usuario.eq.${user.id},id_usuario_auxiliar.eq.${user.id}`)
        .maybeSingle();

      if (comunaError || !comunaData) {
        if (comunaError) console.error('Error obteniendo comuna:', comunaError);
        setNoComuna(true);
        setComunaId(null);
        setStats({
          poblacion: 0,
          asambleas: 0,
          nudos: 0,
          proyectosActivos: 0,
          ultimaAsamblea: null,
          proyectosAprobados: [],
          asambleasPorSemana: [],
        });
        setNudosStats({ total: 0, porCategoria: { T1:0, T2:0, T3:0, T4:0, T5:0, T6:0, T7:0 } });
        setLoading(false);
        return;
      }

      setNoComuna(false);
      const idComuna = comunaData.id_comuna;
      setComunaId(idComuna);

      // 2. Cargar estadísticas (código original de fetchStats)
      try {
        const { data: sectores, error: sectError } = await supabase
          .from('sectores')
          .select('id_sector')
          .eq('id_datos_comuna', idComuna)
          .eq('activo', true);
        if (sectError) throw sectError;

        let consejoIds: number[] = [];
        if (sectores && sectores.length > 0) {
          const sectorIds = sectores.map(s => s.id_sector);
          const { data: consejosData, error: consError } = await supabase
            .from('datos_consejo_comunal')
            .select('id_consejo')
            .in('id_sector', sectorIds);
          if (consError) throw consError;
          consejoIds = consejosData?.map(c => c.id_consejo) || [];
        }

        if (consejoIds.length === 0) {
          setStats({
            poblacion: 0,
            asambleas: 0,
            nudos: 0,
            proyectosActivos: 0,
            ultimaAsamblea: null,
            proyectosAprobados: [],
            asambleasPorSemana: [],
          });
          setNudosStats({ total: 0, porCategoria: { T1:0, T2:0, T3:0, T4:0, T5:0, T6:0, T7:0 } });
          setLoading(false);
          return;
        }

        const queries = [
          supabase.from('asambleas_comuna').select('*', { count: 'exact', head: true }).eq('id_comuna', idComuna),
          supabase.from('asambleas').select('*', { count: 'exact', head: true }).in('id_consejo', consejoIds),
          supabase.from('asambleas_comuna').select('fecha, motivo, hora, lugar').eq('id_comuna', idComuna).order('fecha', { ascending: false }).limit(1),
          supabase.from('asambleas').select(`fecha, motivo, hora, lugar, datos_consejo_comunal(nombre_consejo)`).in('id_consejo', consejoIds).order('fecha', { ascending: false }).limit(1),
          supabase.from('censo_fichas').select('id_ficha').in('id_consejo', consejoIds),
          supabase.from('nudos_criticos_comuna').select('*', { count: 'exact', head: true }).eq('id_comuna', idComuna),
          supabase.from('nudos_criticos_comuna').select('categoria_7t').eq('id_comuna', idComuna),
          supabase.from('nudos_criticos').select('*', { count: 'exact', head: true }).in('id_consejo', consejoIds),
          supabase.from('nudos_criticos').select('categoria_7t').in('id_consejo', consejoIds),
          supabase.from('proyectos').select('*', { count: 'exact', head: true }).in('id_consejo', consejoIds).eq('estado', 'En Ejecución'),
          supabase.from('proyectos').select('nombre, progreso, estado').in('id_consejo', consejoIds).neq('estado', 'Propuesto').order('progreso', { ascending: false }).limit(5),
          supabase.from('asambleas_comuna').select('fecha').eq('id_comuna', idComuna).gte('fecha', new Date(Date.now() - 12 * 7 * 24 * 60 * 60 * 1000).toISOString()),
          supabase.from('asambleas').select('fecha').in('id_consejo', consejoIds).gte('fecha', new Date(Date.now() - 12 * 7 * 24 * 60 * 60 * 1000).toISOString())
        ];

        const results = await Promise.allSettled(queries);
        
        const getCount = (result: any, defaultVal = 0) => {
          if (result.status === 'fulfilled' && result.value && !result.value.error) return result.value.count || defaultVal;
          return defaultVal;
        };
        const getData = (result: any) => {
          if (result.status === 'fulfilled' && result.value && !result.value.error) return result.value.data || [];
          return [];
        };

        const asambleasComunaCount = getCount(results[0]);
        const asambleasConsejosCount = getCount(results[1]);
        const totalAsambleas = asambleasComunaCount + asambleasConsejosCount;

        const ultimaComunaData = getData(results[2])[0];
        const ultimaConsejoData = getData(results[3])[0];
        let ultimaAsamblea = null;
        if (ultimaComunaData && ultimaConsejoData) {
          const fechaComuna = new Date(ultimaComunaData.fecha);
          const fechaConsejo = new Date(ultimaConsejoData.fecha);
          ultimaAsamblea = fechaComuna > fechaConsejo ? ultimaComunaData.fecha : ultimaConsejoData.fecha;
        } else if (ultimaComunaData) {
          ultimaAsamblea = ultimaComunaData.fecha;
        } else if (ultimaConsejoData) {
          ultimaAsamblea = ultimaConsejoData.fecha;
        }

        const fichas = getData(results[4]) as { id_ficha: string }[];
        let poblacion = 0;
        if (fichas.length > 0) {
          const fichasIds = fichas.map(f => f.id_ficha);
          const { count: familiaresCount } = await supabase
            .from('censo_familiares')
            .select('*', { count: 'exact', head: true })
            .in('id_ficha', fichasIds);
          poblacion = fichas.length + (familiaresCount || 0);
        }

        const totalNudosComuna = getCount(results[5]);
        const totalNudosConsejos = getCount(results[7]);
        const totalNudos = totalNudosComuna + totalNudosConsejos;

        const nudosComunaData = getData(results[6]);
        const nudosConsejosData = getData(results[8]);
        const todasNudosData = [...nudosComunaData, ...nudosConsejosData];
        const porCategoria = { T1: 0, T2: 0, T3: 0, T4: 0, T5: 0, T6: 0, T7: 0 };
        todasNudosData.forEach((nudo: any) => {
          const cat = nudo.categoria_7t as keyof typeof porCategoria;
          if (cat && porCategoria.hasOwnProperty(cat)) porCategoria[cat]++;
        });

        const proyectosActivos = getCount(results[9]);
        const proyectosAprobados = getData(results[10]);

        const asambleasComunaSemanas = getData(results[11]);
        const asambleasConsejoSemanas = getData(results[12]);
        const todasAsambleasSemanas = [...asambleasComunaSemanas, ...asambleasConsejoSemanas];
        const asambleasPorSemana = procesarAsambleasPorSemana(todasAsambleasSemanas);

        setStats({
          poblacion,
          asambleas: totalAsambleas,
          nudos: totalNudos,
          proyectosActivos,
          ultimaAsamblea,
          proyectosAprobados,
          asambleasPorSemana,
        });
        setNudosStats({ total: totalNudos, porCategoria });
      } catch (err: any) {
        console.error('Error en fetchStats:', err);
        setError(err.message || 'Error al cargar los datos');
      } finally {
        setLoading(false);
      }
    };

    loadDashboard();
  }, [user?.id]); // <- dependencia única en user.id

  const procesarAsambleasPorSemana = (asambleas: any[]): AsambleasPorSemana[] => {
    const semanas: { [key: string]: { count: number; fechaMasReciente: string } } = {};
    asambleas.forEach((asamblea: any) => {
      const fecha = new Date(asamblea.fecha);
      const semanaInicio = new Date(fecha);
      semanaInicio.setDate(fecha.getDate() - fecha.getDay());
      const semanaKey = semanaInicio.toISOString().split('T')[0];
      if (!semanas[semanaKey]) semanas[semanaKey] = { count: 0, fechaMasReciente: asamblea.fecha };
      semanas[semanaKey].count++;
      if (new Date(asamblea.fecha) > new Date(semanas[semanaKey].fechaMasReciente)) {
        semanas[semanaKey].fechaMasReciente = asamblea.fecha;
      }
    });
    return Object.entries(semanas)
      .map(([semana, data]) => ({ semana, cantidad: data.count, fechaMasReciente: data.fechaMasReciente }))
      .sort((a, b) => new Date(b.semana).getTime() - new Date(a.semana).getTime())
      .slice(0, 8);
  };

  const categorias7T = [
    { key: 'T1', label: 'Económica', color: '#EF4444' },
    { key: 'T2', label: 'Servicios', color: '#F59E0B' },
    { key: 'T3', label: 'Seguridad', color: '#10B981' },
    { key: 'T4', label: 'Social', color: '#3B82F6' },
    { key: 'T5', label: 'Política', color: '#8B5CF6' },
    { key: 'T6', label: 'Ciencia', color: '#06B6D4' },
    { key: 'T7', label: 'Geopolítica', color: '#EC4899' },
  ];

  const dataGrafico = useMemo(() => {
    return categorias7T
      .map(cat => ({
        key: cat.key,
        label: cat.label,
        value: nudosStats.porCategoria[cat.key as keyof typeof nudosStats.porCategoria],
        color: cat.color
      }))
      .filter(item => item.value > 0);
  }, [nudosStats.porCategoria]);

  const totalNudosGrafico = useMemo(() => {
    return dataGrafico.reduce((sum, item) => sum + item.value, 0);
  }, [dataGrafico]);

  const generarPieChart = useMemo(() => {
    const size = 120;
    const strokeWidth = 16;
    if (dataGrafico.length === 0) return null;

    const radius = (size - strokeWidth) / 2;
    const center = size / 2;
    const circumference = 2 * Math.PI * radius;

    let cumulativeAngle = -Math.PI / 2;
    const segments: React.ReactNode[] = [];

    dataGrafico.forEach((item, index) => {
      const sliceAngle = (2 * Math.PI * item.value) / totalNudosGrafico;
      const sliceArcLength = circumference * (item.value / totalNudosGrafico);

      segments.push(
        <circle
          key={index}
          cx={center}
          cy={center}
          r={radius}
          fill="none"
          stroke={item.color}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={`${sliceArcLength} ${circumference - sliceArcLength}`}
          strokeDashoffset={0}
          className="origin-center transition-all duration-1000"
          style={{
            transform: `rotate(${cumulativeAngle * 180 / Math.PI}deg)`,
            transformOrigin: `${center}px ${center}px`
          }}
        />
      );
      cumulativeAngle += sliceAngle;
    });

    return (
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="mx-auto">
        <circle cx={center} cy={center} r={radius} fill="none" stroke="#f8fafc" strokeWidth={strokeWidth} />
        {segments}
        <circle cx={center} cy={center} r={16} fill="white" stroke="#f1f5f9" strokeWidth="2" />
        <text x={center} y={center} textAnchor="middle" dominantBaseline="middle" className="text-xs font-black text-slate-800" style={{ fontSize: '12px' }}>
          {totalNudosGrafico}
        </text>
      </svg>
    );
  }, [dataGrafico, totalNudosGrafico]);

  const generarGraficoAsambleasSemana = useMemo(() => {
    if (stats.asambleasPorSemana.length === 0) return null;
    const maxCantidad = Math.max(...stats.asambleasPorSemana.map(s => s.cantidad));
    return (
      <div className="space-y-1.5 w-full">
        {stats.asambleasPorSemana.slice(0, 6).map((semana, index) => {
          const porcentaje = maxCantidad > 0 ? (semana.cantidad / maxCantidad) * 100 : 0;
          const fecha = new Date(semana.fechaMasReciente);
          const semanaLabel = fecha.toLocaleDateString('es-ES', { month: 'short', day: 'numeric' });
          return (
            <div key={index} className="flex items-center gap-2 h-5">
              <div className="w-6 shrink-0">
                <span className="text-[8px] font-bold text-slate-500">{semana.cantidad}</span>
              </div>
              <div className="flex-1 h-3 bg-gray-100 rounded-full overflow-hidden">
                <motion.div
                  className="h-full bg-linear-to-r from-brand-primary to-brand-primary/70 rounded-full shadow-sm"
                  initial={{ width: 0 }}
                  animate={{ width: `${porcentaje}%` }}
                  transition={{ duration: 0.8, delay: index * 0.1 }}
                />
              </div>
              <span className="text-[8px] font-medium text-slate-400 w-12 text-right shrink-0">{semanaLabel}</span>
            </div>
          );
        })}
      </div>
    );
  }, [stats.asambleasPorSemana]);

  const formatUltimaAsamblea = (fecha: string | null) => {
    if (!fecha) return "Sin registros";
    const date = new Date(fecha);
    const now = new Date();
    const diffDays = Math.ceil((now.getTime() - date.getTime()) / (1000*60*60*24));
    if (diffDays === 0) return "Hoy";
    if (diffDays === 1) return "Ayer";
    if (diffDays <= 7) return `hace ${diffDays} días`;
    return date.toLocaleDateString('es-ES', { day: 'numeric', month: 'short', year: 'numeric' });
  };

  // Mientras se carga la información de la comuna o los datos, mostramos spinner
  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 className="animate-spin text-brand-primary" size={32} />
      </div>
    );
  }

  // Si ocurrió un error, mostramos mensaje pero permitimos reintentar
  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-64 text-center p-8">
        <AlertCircle className="h-12 w-12 text-red-500 mb-4" />
        <p className="text-red-600 font-bold">Error al cargar los datos</p>
        <p className="text-sm text-slate-500 mt-2">{error}</p>
        <button
          onClick={() => window.location.reload()}
          className="mt-4 px-4 py-2 bg-brand-primary text-white rounded-xl text-sm font-bold"
        >
          Reintentar
        </button>
      </div>
    );
  }

    if (noComuna) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center p-8 bg-white rounded-3xl border border-gray-100 shadow-sm">
        <div className="h-20 w-20 rounded-full bg-amber-100 flex items-center justify-center mb-6">
          <AlertCircle className="h-10 w-10 text-amber-600" />
        </div>
        <h3 className="text-xl font-black text-slate-800 uppercase tracking-tighter mb-2">
          Aún no has registrado tu Comuna
        </h3>
        <p className="text-slate-500 max-w-md mb-8">
          Para acceder a las estadísticas y funcionalidades del dashboard, primero debes completar los datos legales de tu comuna.
        </p>
        <button
          onClick={() => onNavigate("documentacion")}
          className="px-8 py-3 bg-brand-primary text-white rounded-xl font-black text-sm shadow-lg hover:scale-[1.02] transition-all flex items-center gap-2"
        >
          <FileCheck className="h-4 w-4" />
          Completar Datos Legales
        </button>
      </div>
    );
  }

  // Dashboard siempre visible (con valores por defecto cuando no hay datos)
  return (
    <div className="max-w-7xl mx-auto -ml-2 md:-ml-9 space-y-6 p-2 font-sans min-h-screen -mt-12">
      {/* Tarjetas principales */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {[
          { label: "Población Total", value: stats.poblacion.toLocaleString(), icon: Users, color: "text-blue-600 bg-blue-50", sub: `${stats.poblacion} habitantes censados`, id: "censo" },
          { label: "Asambleas", value: stats.asambleas.toLocaleString(), icon: Megaphone, color: "text-brand-primary bg-brand-primary/5", sub: "Total realizadas", id: "asambleas" },
          { label: "Nudos Críticos", value: stats.nudos.toLocaleString(), icon: AlertCircle, color: "text-amber-600 bg-amber-50", sub: "Total registrados (Comuna + Consejos)", id: "nudos" },
          { label: "Proyectos Activos", value: stats.proyectosActivos.toLocaleString(), icon: Construction, color: "text-emerald-600 bg-emerald-50", sub: "Obras en ejecución", id: "proyectos" },
        ].map((w, i) => (
          <motion.div key={i} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }} onClick={() => onNavigate(w.id)} className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm hover:shadow-md transition-all group cursor-pointer">
            <div className={cn("h-12 w-12 rounded-2xl flex items-center justify-center mb-4 transition-transform group-hover:scale-110", w.color)}><w.icon className="h-6 w-6" /></div>
            <p className="text-3xl font-black text-slate-900 tracking-tighter">{w.value}</p>
            <h4 className="text-xs font-bold text-slate-800 mt-1 uppercase tracking-tight">{w.label}</h4>
            <p className="text-[10px] text-slate-400 font-medium mt-1">{w.sub}</p>
          </motion.div>
        ))}
      </div>

      {/* Sección de gráficos */}
      <div className="grid lg:grid-cols-3 gap-6">
        {/* NUDOS CRÍTICOS 7T */}
        <div className="lg:col-span-1 bg-white rounded-3xl border border-gray-100 shadow-sm p-6 flex flex-col justify-between h-full group hover:shadow-md transition-all">
          <div>
            <div className="flex items-center gap-3 mb-4">
              <div className="h-10 w-10 rounded-2xl bg-linear-to-br from-rose-500 to-amber-500 flex items-center justify-center shadow-lg"><PieChart className="h-5 w-5 text-white" /></div>
              <div><h3 className="text-xs font-bold text-slate-800 uppercase tracking-widest italic">Nudos Críticos 7T</h3><p className="text-[9px] text-slate-500 font-medium">Comuna + Consejos</p></div>
            </div>
            <div className="flex flex-col items-center mb-6">
              {nudosStats.total > 0 ? generarPieChart : <div className="h-30 w-30 rounded-2xl bg-gray-50 flex flex-col items-center justify-center border-2 border-dashed border-gray-200"><AlertCircle className="h-10 w-10 text-gray-300 mb-2" /><p className="text-[9px] text-slate-400 font-medium">Sin nudos</p></div>}
              <p className="text-xl font-black text-slate-900 mt-3 tracking-tight">{nudosStats.total}</p>
              <p className="text-[9px] text-slate-400 uppercase font-bold mt-1">Total 7T</p>
            </div>
            <div className="space-y-1 max-h-20 overflow-y-auto">{dataGrafico.slice(0,3).map((item,idx)=><div key={idx} className="flex items-center gap-2"><div className="h-2.5 w-2.5 rounded-full" style={{backgroundColor:item.color}}/><p className="text-[8px] font-bold text-slate-800 flex-1">{item.label}</p><span className="text-[9px] font-black text-slate-600">{item.value}</span></div>)}</div>
          </div>
          <button onClick={()=>onNavigate("nudos")} className="mt-4 w-full p-3 rounded-xl border border-amber-100 bg-linear-to-r from-amber-50 to-rose-50 text-[9px] font-black uppercase text-amber-700 hover:bg-amber-100 flex items-center justify-center gap-1">Ver Nudos Críticos <ChevronRight className="h-3 w-3"/></button>
        </div>

        {/* PROGRESO PROYECTOS */}
        <div className="lg:col-span-1 bg-linear-to-br from-emerald-50 to-emerald-100 rounded-3xl border border-emerald-200 shadow-sm p-6 flex flex-col justify-between h-full group hover:shadow-lg transition-all">
          <div className="flex items-center gap-3 mb-4"><div className="h-10 w-10 rounded-2xl bg-linear-to-br from-emerald-500 to-emerald-600 flex items-center justify-center shadow-lg"><BarChart3 className="h-5 w-5 text-white"/></div><div><h3 className="text-xs font-bold text-slate-800 uppercase tracking-widest italic">Progreso Proyectos</h3><p className="text-[9px] text-slate-600 font-medium">Obras aprobadas</p></div></div>
          <div className="space-y-3 flex-1">{stats.proyectosAprobados.length>0?stats.proyectosAprobados.slice(0,4).map((p,i)=><div key={i}><div className="flex justify-between"><span className="text-[9px] font-bold text-slate-700 truncate max-w-30">{p.nombre}</span><span className="text-[9px] font-black text-slate-600">{p.progreso}%</span></div><div className="h-1.5 bg-gray-200 rounded-full overflow-hidden"><motion.div className="h-full rounded-full" style={{width:`${p.progreso}%`, background:p.progreso>=80? 'linear-gradient(to right, #10B981, #059669)': p.progreso>=50? 'linear-gradient(to right, #F59E0B, #D97706)':'linear-gradient(to right, #EF4444, #DC2626)'}} initial={{width:0}} animate={{width:`${p.progreso}%`}}/></div></div>):<div className="flex flex-col items-center justify-center h-32"><Construction className="h-8 w-8 text-gray-300 mb-2"/><p className="text-[9px] text-slate-400 font-medium">Sin proyectos aprobados</p></div>}</div>
          <button onClick={()=>onNavigate("proyectos")} className="mt-4 w-full p-3 rounded-xl border border-emerald-200 bg-white/50 backdrop-blur-sm text-[9px] font-black uppercase text-emerald-700 hover:bg-emerald-50 flex items-center justify-center gap-1">Ver Todos Proyectos <ChevronRight className="h-3 w-3"/></button>
        </div>

        {/* ASAMBLEAS POR SEMANA */}
        <div className="lg:col-span-1 bg-linear-to-br from-brand-primary/10 to-brand-primary/5 rounded-3xl border border-brand-primary/20 shadow-sm p-6 flex flex-col justify-between h-full group hover:shadow-md transition-all">
          <div className="flex items-center gap-3 mb-4"><div className="h-10 w-10 rounded-2xl bg-linear-to-br from-brand-primary to-brand-primary/80 flex items-center justify-center shadow-lg"><TrendingUp className="h-5 w-5 text-white"/></div><div><h3 className="text-xs font-bold text-slate-800 uppercase tracking-widest italic">Asambleas por Semana</h3><p className="text-[9px] text-slate-500 font-medium">Actividad reciente</p></div></div>
          <div className="flex-1 space-y-3">{stats.asambleasPorSemana.length>0?generarGraficoAsambleasSemana:<div className="flex flex-col items-center justify-center h-full text-center"><Megaphone className="h-10 w-10 text-brand-primary/30"/><p className="text-[10px] text-slate-400 font-medium">Sin asambleas recientes</p><p className="text-[8px] text-slate-500">Últimas 12 semanas</p></div>}</div>
          <div className="text-center space-y-1 pt-2"><p className="text-sm font-black text-brand-primary">{stats.asambleas.toLocaleString()}</p><p className="text-[8px] text-slate-400 uppercase font-bold tracking-wider">Total asambleas</p></div>
          <button onClick={()=>onNavigate("asambleas")} className="mt-4 w-full p-3 rounded-xl border border-brand-primary/20 bg-white/50 backdrop-blur-sm text-[9px] font-black uppercase text-brand-primary hover:bg-brand-primary/10 flex items-center justify-center gap-1">Ver Todas las Asambleas <ChevronRight className="h-3 w-3"/></button>
        </div>
      </div>

      {/* Botones de acción rápida */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
          <button onClick={() => onNavigate("asambleas", "nova_asamblea")} className="flex items-center gap-4 p-6 rounded-4xl bg-white border border-gray-100 shadow-sm hover:border-brand-primary/30 hover:bg-brand-primary/2 transition-all group w-full">
            <div className="h-14 w-14 rounded-2xl bg-brand-primary/10 flex items-center justify-center text-brand-primary group-hover:bg-brand-primary group-hover:text-white transition-all transform group-hover:rotate-6"><Megaphone className="h-7 w-7"/></div>
            <div className="text-left flex-1"><p className="text-[10px] font-black text-brand-primary uppercase tracking-widest">Carga de Actas</p><p className="text-lg font-black text-slate-800 tracking-tight">Nueva Asamblea</p></div>
            <Plus className="h-6 w-6 text-slate-200 group-hover:text-brand-primary"/>
          </button>
        </motion.div>
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}>
          <button onClick={() => onNavigate("nudos")} className="flex items-center gap-4 p-6 rounded-4xl bg-rose-500 text-white shadow-xl shadow-rose-500/20 hover:scale-[1.02] active:scale-95 transition-all group w-full">
            <div className="h-14 w-14 rounded-2xl bg-white/20 flex items-center justify-center backdrop-blur-md"><AlertCircle className="h-7 w-7 animate-pulse"/></div>
            <div className="text-left flex-1"><p className="text-[10px] font-black text-white/90 uppercase tracking-widest">Vía Rápida 7-T</p><p className="text-lg font-black text-white tracking-tight">Reportar Emergencia</p></div>
            <ChevronRight className="h-6 w-6 text-white/40"/>
          </button>
        </motion.div>
      </div>
    </div>
  );
};