import React, { useState, useEffect, useMemo } from "react";
import { motion } from 'framer-motion';
import { 
  Users, 
  Megaphone, 
  AlertCircle, 
  Construction, 
  Clock, 
  Plus, 
  ChevronRight,
  Calendar,
  Loader2,
  PieChart,
  BarChart3,
  FileCheck
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
    T1: number; T2: number; T3: number; T4: number; T5: number; T6: number; T7: number;
  };
}

interface ProyectoResumen {
  nombre: string;
  progreso: number;
  estado: string;
}

interface Stats {
  poblacion: number;
  asambleas: number;
  nudos: number;
  proyectosActivos: number;
  ultimaAsamblea: string | null;
  proyectosAprobados: ProyectoResumen[];
}

export const DashboardOverview = ({
  user,
  onNavigate,
}: DashboardOverviewProps) => {
  const { user: authUser } = useAuth();
  const [consejoId, setConsejoId] = useState<number | null>(null);
  const [noConsejo, setNoConsejo] = useState(false);
  const [stats, setStats] = useState<Stats>({
    poblacion: 0,
    asambleas: 0,
    nudos: 0,
    proyectosActivos: 0,
    ultimaAsamblea: null,
    proyectosAprobados: [],
  });
  const [nudosStats, setNudosStats] = useState<NudosStats>({
    total: 0,
    porCategoria: { T1: 0, T2: 0, T3: 0, T4: 0, T5: 0, T6: 0, T7: 0 }
  });
  const [loading, setLoading] = useState(true);

  // 1. Obtener ID del Consejo Comunal (dueño o auxiliar)
  useEffect(() => {
    const fetchConsejoId = async () => {
      if (!authUser?.id) {
        setLoading(false);
        return;
      }
      try {
        const { data, error } = await supabase
          .from('datos_consejo_comunal')
          .select('id_consejo')
          .or(`id_usuario.eq.${authUser.id},id_usuario_auxiliar.eq.${authUser.id}`)
          .maybeSingle();

        if (error) {
          console.error('Error obteniendo consejo:', error);
          setLoading(false);
        } else if (data) {
          setConsejoId(data.id_consejo);
          setNoConsejo(false);
        } else {
          setNoConsejo(true);
          setLoading(false);
        }
      } catch (err) {
        console.error(err);
        setLoading(false);
      }
    };
    fetchConsejoId();
  }, [authUser]);

  // 2. Cargar estadísticas si existe el consejoId
  useEffect(() => {
    if (!consejoId) return; 
    
    const fetchStats = async () => {
      setLoading(true);
      try {
        const [
          fichasResult,
          asambleasCountResult,
          ultimaAsambleaResult,
          nudosPorCategoriaResult,
          proyectosActivosCountResult,
          proyectosAprobadosResult,
        ] = await Promise.all([
          supabase.from('censo_fichas').select('id_ficha').eq('id_consejo', consejoId),
          supabase.from('asambleas').select('*', { count: 'exact', head: true }).eq('id_consejo', consejoId),
          supabase.from('asambleas').select('fecha').eq('id_consejo', consejoId).order('fecha', { ascending: false }).limit(1),
          supabase.from('nudos_criticos').select('categoria_7t').eq('id_consejo', consejoId),
          supabase.from('proyectos').select('*', { count: 'exact', head: true }).eq('id_consejo', consejoId).eq('estado', 'En Ejecución'),
          supabase.from('proyectos').select('nombre, progreso, estado').eq('id_consejo', consejoId).neq('estado', 'Propuesto').order('progreso', { ascending: false }).limit(5),
        ]);

        let poblacion = 0;
        const fichas = fichasResult.data || [];
        if (fichas.length > 0) {
          const fichasIds = fichas.map(f => f.id_ficha);
          const { count: familiaresCount } = await supabase
            .from('censo_familiares')
            .select('*', { count: 'exact', head: true })
            .in('id_ficha', fichasIds);
          poblacion = fichas.length + (familiaresCount || 0);
        }

        const nudosData = nudosPorCategoriaResult.data || [];
        const porCategoria = { T1: 0, T2: 0, T3: 0, T4: 0, T5: 0, T6: 0, T7: 0 };
        nudosData.forEach((nudo: any) => {
          const cat = nudo.categoria_7t as keyof typeof porCategoria;
          if (porCategoria[cat] !== undefined) porCategoria[cat]++;
        });
        const totalNudos = nudosData.length;

        setStats({
          poblacion,
          asambleas: asambleasCountResult.count || 0,
          nudos: totalNudos,
          proyectosActivos: proyectosActivosCountResult.count || 0,
          ultimaAsamblea: ultimaAsambleaResult.data?.[0]?.fecha || null,
          proyectosAprobados: proyectosAprobadosResult.data || [],
        });
        
        setNudosStats({
          total: totalNudos,
          porCategoria,
        });

      } catch (error) {
        console.error('Error cargando estadísticas:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, [consejoId]);

  // Configuración del gráfico circular
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
          strokeDasharray={`${sliceArcLength} ${circumference}`}
          strokeDashoffset={cumulativeAngle * radius}
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

  const formatUltimaAsamblea = (fecha: string | null) => {
    if (!fecha) return "Sin registros";
    const date = new Date(fecha);
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - date.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) return "Hoy";
    if (diffDays === 1) return "Ayer";
    if (diffDays <= 7) return `hace ${diffDays} días`;
    return date.toLocaleDateString('es-ES', { day: 'numeric', month: 'short', year: 'numeric' });
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 className="animate-spin text-brand-primary" size={32} />
      </div>
    );
  }

  if (noConsejo) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center p-8 bg-white rounded-3xl border border-gray-100 shadow-sm">
        <div className="h-20 w-20 rounded-full bg-amber-100 flex items-center justify-center mb-6">
          <AlertCircle className="h-10 w-10 text-amber-600" />
        </div>
        <h3 className="text-xl font-black text-slate-800 uppercase tracking-tighter mb-2">
          Aún no has registrado tu Consejo Comunal
        </h3>
        <p className="text-slate-500 max-w-md mb-8">
          Para acceder a las estadísticas y funcionalidades del dashboard, primero debes completar los datos legales de tu consejo comunal.
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

  return (
    <div className="space-y-6 sm:space-y-8 relative">
      {/* Tarjetas principales - 4 columnas en mobile, reducción de padding y fuentes */}
      <div className="grid grid-cols-4 gap-2 sm:gap-6">
        {[
          { label: "Población Total", value: stats.poblacion.toLocaleString(), icon: Users, color: "text-blue-600 bg-blue-50", sub: "Habitantes censados", id: "censo" },
          { label: "Asambleas", value: stats.asambleas.toLocaleString(), icon: Megaphone, color: "text-brand-primary bg-brand-primary/5", sub: "Total realizadas", id: "asambleas" },
          { label: "Nudos Críticos", value: stats.nudos.toLocaleString(), icon: AlertCircle, color: "text-amber-600 bg-amber-50", sub: "Bajo plan 7-T", id: "nudos" },
          { label: "Proyectos Activos", value: stats.proyectosActivos.toLocaleString(), icon: Construction, color: "text-emerald-600 bg-emerald-50", sub: "Obras en ejecución", id: "proyectos" },
        ].map((w, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
            onClick={() => onNavigate(w.id)}
            className="bg-white rounded-2xl sm:rounded-3xl border border-gray-100 shadow-sm hover:shadow-md transition-all group cursor-pointer p-3 sm:p-6"
          >
            <div className={cn("h-8 w-8 sm:h-12 sm:w-12 rounded-xl sm:rounded-2xl flex items-center justify-center mb-2 sm:mb-4 transition-transform group-hover:scale-110", w.color)}>
              <w.icon className="h-4 w-4 sm:h-6 sm:w-6" />
            </div>
            <p className="text-xl sm:text-3xl font-black text-slate-900 tracking-tighter">{w.value}</p>
            <h4 className="text-[9px] sm:text-xs font-bold text-slate-800 mt-0.5 sm:mt-1 uppercase tracking-tight">{w.label}</h4>
            <p className="text-[8px] sm:text-[10px] text-slate-400 font-medium mt-0.5 sm:mt-1">{w.sub}</p>
          </motion.div>
        ))}
      </div>

      {/* Gráficos y Secciones de Resumen */}
      <div className="grid lg:grid-cols-3 gap-4 sm:gap-6">
        {/* NUDOS CRÍTICOS 7T */}
        <div className="lg:col-span-1 bg-white rounded-2xl sm:rounded-3xl border border-gray-100 shadow-sm p-4 sm:p-6 flex flex-col justify-between h-full group hover:shadow-md transition-all">
          <div>
            <div className="flex items-center gap-2 sm:gap-3 mb-3 sm:mb-4">
              <div className="h-8 w-8 sm:h-10 sm:w-10 rounded-xl sm:rounded-2xl bg-linear-to-br from-rose-500 to-amber-500 flex items-center justify-center shadow-lg">
                <PieChart className="h-4 w-4 sm:h-5 sm:w-5 text-white" />
              </div>
              <div>
                <h3 className="text-[10px] sm:text-xs font-bold text-slate-800 uppercase tracking-widest italic">Nudos Críticos 7T</h3>
                <p className="text-[8px] sm:text-[9px] text-slate-500 font-medium">Distribución por transformación</p>
              </div>
            </div>

            <div className="flex flex-col items-center mb-4 sm:mb-6">
              {nudosStats.total > 0 ? generarPieChart : (
                <div className="h-25 w-25 sm:h-30 sm:w-30 rounded-2xl bg-gray-50 flex flex-col items-center justify-center border-2 border-dashed border-gray-200 group-hover:border-amber-200">
                  <AlertCircle className="h-8 w-8 sm:h-10 sm:w-10 text-gray-300 mb-1" />
                  <p className="text-[8px] sm:text-[9px] text-slate-400 font-medium text-center">Sin nudos</p>
                </div>
              )}
              <p className="text-lg sm:text-xl font-black text-slate-900 mt-2 sm:mt-3 tracking-tight">{nudosStats.total}</p>
              <p className="text-[8px] sm:text-[9px] text-slate-400 uppercase font-bold mt-0.5 sm:mt-1">Total</p>
            </div>

            <div className="space-y-1 max-h-16 sm:max-h-20 overflow-y-auto">
              {dataGrafico.slice(0, 3).map((item, idx) => (
                <div key={idx} className="flex items-center gap-2 py-0.5 px-1 rounded hover:bg-gray-50">
                  <div className="h-2 w-2 sm:h-2.5 sm:w-2.5 rounded-full shadow-sm" style={{ backgroundColor: item.color }} />
                  <p className="text-[7px] sm:text-[8px] font-bold text-slate-800 truncate flex-1">{item.label}</p>
                  <span className="text-[8px] sm:text-[9px] font-black text-slate-600">{item.value}</span>
                </div>
              ))}
            </div>
          </div>
          
          <button onClick={() => onNavigate("nudos")} className="mt-3 sm:mt-4 w-full p-2 sm:p-3 rounded-xl border border-amber-100 bg-linear-to-r from-amber-50 to-rose-50 text-[8px] sm:text-[9px] font-black uppercase text-amber-700 hover:bg-amber-100 flex items-center justify-center gap-1 transition-all">
            Ver Nudos Críticos <ChevronRight className="h-2.5 w-2.5 sm:h-3 sm:w-3 group-hover:translate-x-0.5" />
          </button>
        </div>

        {/* BARRA DE PROGRESO DE PROYECTOS */}
        <div className="lg:col-span-1 bg-linear-to-br from-emerald-50 to-emerald-100 rounded-2xl sm:rounded-3xl border border-emerald-200 shadow-sm p-4 sm:p-6 flex flex-col justify-between h-full group hover:shadow-lg transition-all">
          <div className="flex items-center gap-2 sm:gap-3 mb-3 sm:mb-4">
            <div className="h-8 w-8 sm:h-10 sm:w-10 rounded-xl sm:rounded-2xl bg-linear-to-br from-emerald-500 to-emerald-600 flex items-center justify-center shadow-lg">
              <BarChart3 className="h-4 w-4 sm:h-5 sm:w-5 text-white" />
            </div>
            <div>
              <h3 className="text-[10px] sm:text-xs font-bold text-slate-800 uppercase tracking-widest italic">Progreso Proyectos</h3>
              <p className="text-[8px] sm:text-[9px] text-slate-600 font-medium">Obras aprobadas</p>
            </div>
          </div>

          <div className="space-y-2 sm:space-y-3 flex-1">
            {stats.proyectosAprobados.length > 0 ? (
              stats.proyectosAprobados.slice(0, 4).map((proyecto, idx) => (
                <div key={idx} className="space-y-0.5 sm:space-y-1">
                  <div className="flex items-center justify-between">
                    <p className="text-[8px] sm:text-[9px] font-bold text-slate-700 truncate max-w-25 sm:max-w-30">{proyecto.nombre}</p>
                    <span className="text-[8px] sm:text-[9px] font-black text-slate-600">{proyecto.progreso}%</span>
                  </div>
                  <div className="h-1 sm:h-1.5 bg-gray-200 rounded-full overflow-hidden">
                    <motion.div 
                      className="h-full rounded-full transition-all duration-1000"
                      style={{ 
                        width: `${proyecto.progreso}%`,
                        background: proyecto.progreso >= 80 ? 'linear-gradient(to right, #10B981, #059669)' : proyecto.progreso >= 50 ? 'linear-gradient(to right, #F59E0B, #D97706)' : 'linear-gradient(to right, #EF4444, #DC2626)'
                      }}
                      initial={{ width: 0 }}
                      animate={{ width: `${proyecto.progreso}%` }}
                    />
                  </div>
                </div>
              ))
            ) : (
              <div className="flex flex-col items-center justify-center h-24 sm:h-32 text-center">
                <Construction className="h-6 w-6 sm:h-8 sm:w-8 text-gray-300 mb-1" />
                <p className="text-[8px] sm:text-[9px] text-slate-400 font-medium">Sin proyectos aprobados</p>
              </div>
            )}
          </div>

          <button onClick={() => onNavigate("proyectos")} className="mt-3 sm:mt-4 w-full p-2 sm:p-3 rounded-xl border border-emerald-200 bg-white/50 backdrop-blur-sm text-[8px] sm:text-[9px] font-black uppercase text-emerald-700 hover:bg-emerald-50 flex items-center justify-center gap-1 transition-all shadow-sm">
            Ver Todos Proyectos <ChevronRight className="h-2.5 w-2.5 sm:h-3 sm:w-3" />
          </button>
        </div>

        {/* ÚLTIMA ASAMBLEA */}
        <div className="lg:col-span-1 bg-linear-to-br from-brand-primary/10 to-brand-primary/5 rounded-2xl sm:rounded-3xl border border-brand-primary/20 shadow-sm p-4 sm:p-6 flex flex-col justify-between h-full group hover:shadow-md transition-all">
          <div className="flex items-center gap-2 sm:gap-3 mb-3 sm:mb-4">
            <div className="h-8 w-8 sm:h-10 sm:w-10 rounded-xl sm:rounded-2xl bg-linear-to-br from-brand-primary to-brand-primary/80 flex items-center justify-center shadow-lg">
              <Calendar className="h-4 w-4 sm:h-5 sm:w-5 text-white" />
            </div>
            <div>
              <h3 className="text-[10px] sm:text-xs font-bold text-slate-800 uppercase tracking-widest italic">Última Asamblea</h3>
              <p className="text-[8px] sm:text-[9px] text-slate-500 font-medium">Para incentivar participación</p>
            </div>
          </div>

          <div className="flex-1 flex flex-col items-center justify-center space-y-2 sm:space-y-3 text-center">
            {stats.ultimaAsamblea ? (
              <>
                <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-white/60 backdrop-blur-sm border-2 border-white/50 flex flex-col items-center justify-center shadow-lg">
                  <Clock className="h-4 w-4 sm:h-6 sm:w-6 text-brand-primary mb-0.5 sm:mb-1" />
                  <span className="text-[9px] sm:text-[11px] font-black text-slate-800">{formatUltimaAsamblea(stats.ultimaAsamblea)}</span>
                </div>
                <div>
                  <p className="text-[9px] sm:text-[10px] font-bold text-slate-700">{new Date(stats.ultimaAsamblea).toLocaleDateString('es-ES')}</p>
                  <p className="text-[7px] sm:text-[8px] text-slate-400 uppercase font-bold tracking-wider">¡Participación activa!</p>
                </div>
              </>
            ) : (
              <>
                <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-gray-100 flex items-center justify-center border-2 border-dashed border-gray-200">
                  <Megaphone className="h-6 w-6 sm:h-8 sm:w-8 text-gray-400" />
                </div>
                <p className="text-[9px] sm:text-[10px] text-slate-500 font-medium">Sin asambleas registradas</p>
              </>
            )}
          </div>

          <button onClick={() => onNavigate("asambleas")} className="mt-3 sm:mt-4 w-full p-2 sm:p-3 rounded-xl border border-brand-primary/20 bg-white/50 backdrop-blur-sm text-[8px] sm:text-[9px] font-black uppercase text-brand-primary hover:bg-brand-primary/10 flex items-center justify-center gap-1 transition-all shadow-sm">
            Nueva Asamblea <Plus className="h-2.5 w-2.5 sm:h-3 sm:w-3" />
          </button>
        </div>
      </div>

      {/* Botones de acción rápida */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6">
        <button onClick={() => onNavigate("censo", "register")} className="flex items-center gap-3 sm:gap-4 p-4 sm:p-6 rounded-2xl sm:rounded-4xl bg-white border border-gray-100 shadow-sm hover:border-brand-primary/30 hover:bg-brand-primary/2 transition-all group">
          <div className="h-10 w-10 sm:h-14 sm:w-14 rounded-xl sm:rounded-2xl bg-brand-primary/10 flex items-center justify-center text-brand-primary group-hover:bg-brand-primary group-hover:text-white transition-all transform group-hover:-rotate-6">
            <Users className="h-5 w-5 sm:h-7 sm:w-7" />
          </div>
          <div className="text-left">
            <p className="text-[8px] sm:text-[10px] font-black text-brand-primary uppercase tracking-widest">Agilizar Censo</p>
            <p className="text-base sm:text-lg font-black text-slate-800 tracking-tight">Registrar Habitante</p>
          </div>
          <Plus className="ml-auto h-5 w-5 sm:h-6 sm:w-6 text-slate-200 group-hover:text-brand-primary" />
        </button>

        <button onClick={() => onNavigate("asambleas", "nova_asamblea")} className="flex items-center gap-3 sm:gap-4 p-4 sm:p-6 rounded-2xl sm:rounded-4xl bg-white border border-gray-100 shadow-sm hover:border-brand-primary/30 hover:bg-brand-primary/2 transition-all group">
          <div className="h-10 w-10 sm:h-14 sm:w-14 rounded-xl sm:rounded-2xl bg-brand-primary/10 flex items-center justify-center text-brand-primary group-hover:bg-brand-primary group-hover:text-white transition-all transform group-hover:rotate-6">
            <Megaphone className="h-5 w-5 sm:h-7 sm:w-7" />
          </div>
          <div className="text-left">
            <p className="text-[8px] sm:text-[10px] font-black text-brand-primary uppercase tracking-widest">Carga de Actas</p>
            <p className="text-base sm:text-lg font-black text-slate-800 tracking-tight">Nueva Asamblea</p>
          </div>
          <Plus className="ml-auto h-5 w-5 sm:h-6 sm:w-6 text-slate-200 group-hover:text-brand-primary" />
        </button>

        <button onClick={() => onNavigate("nudos")} className="flex items-center gap-3 sm:gap-4 p-4 sm:p-6 rounded-2xl sm:rounded-4xl bg-rose-500 text-white shadow-xl shadow-rose-500/20 hover:scale-[1.02] active:scale-95 transition-all group">
          <div className="h-10 w-10 sm:h-14 sm:w-14 rounded-xl sm:rounded-2xl bg-white/20 flex items-center justify-center backdrop-blur-md">
            <AlertCircle className="h-5 w-5 sm:h-7 sm:w-7 animate-pulse" />
          </div>
          <div className="text-left">
            <p className="text-[8px] sm:text-[10px] font-black text-white/70 uppercase tracking-widest">Vía Rápida 7-T</p>
            <p className="text-base sm:text-lg font-black text-white tracking-tight">Reportar Emergencia</p>
          </div>
          <ChevronRight className="ml-auto h-5 w-5 sm:h-6 sm:w-6 text-white/40" />
        </button>
      </div>
    </div>
  );
};