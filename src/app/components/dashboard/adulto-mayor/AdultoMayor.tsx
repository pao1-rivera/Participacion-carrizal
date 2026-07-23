'use client';

import React, { useState, useEffect } from 'react';
import { 
  Users, Heart, Briefcase, Target, Building2, AlertCircle, Activity,
  BarChart3, PieChart as PieIcon, CheckCircle2, Monitor, Droplets,
  Accessibility, Wifi, Loader2
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/app/lib/utils';
import { supabase } from '@/app/lib/supabaseClient';

// Importaciones de componentes existentes
import { SaludAtencion } from './secciones-sidebar/SaludAtencion';
import { Dimen1 } from '../comundi/Dimen1';
import { Dimen2 } from '../comundi/Dimen2';
import { Dimen3 } from '../comundi/Dimen3';
import { Dimen4 } from '../comundi/Dimen4';
import { PlanificacionDireccion } from '../comundi/PlanificacionDireccion';
import { Sidebar } from '@/app/layout/Sidebar';
import { DashboardNavbar } from '../common/DashboardNavbar';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import { PerfilView } from '../common/PerfilView';
import { SoporteView } from '../common/SoporteView';
import { NotificationsPage } from "../common/Notification";

// Gráficos
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';

// ==================== DASHBOARD ADULTO MAYOR CON GRÁFICOS ====================
const AdultoMayorDashboard = ({ user }: { user: any }) => {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalComunas: 0,
    totalConsejos: 0,
    totalSalas: 0,
    totalVoceros: 0,
    totalNudos: 0,
    nudosAlta: 0,
    nudosMedia: 0,
    nudosBaja: 0,
    totalProyectos: 0,
    totalAdultosMayores: 0,
  });
  const [infraestructuraStats, setInfraestructuraStats] = useState({
    salasEvaluadas: 0,
    totalSalas: 0,
    salasBuenEstado: 0,
    salasConInternet: 0,
    salasConRampas: 0,
    salasAguaPotable: 0,
    hardwareExcelente: 0
  });
  const [saludStats, setSaludStats] = useState({
    pathologies: [] as { name: string; count: number }[],
    healthCenters: [] as { name: string; count: number }[],
    totalAdultos: 0,
    conEnfermedadCronica: 0
  });
  const [loadingError, setLoadingError] = useState<string | null>(null);
  const [userRole, setUserRole] = useState<string | null>(null);

  // Función auxiliar para verificar valores válidos
  const isValidValue = (value: string | null): boolean => {
    if (!value || value === '—') return false;
    const lowerValue = value.toLowerCase().trim();
    return lowerValue !== 'no aplica' && lowerValue !== 'n/a';
  };

  useEffect(() => {
    const fetchDashboardStats = async () => {
      setLoading(true);
      setLoadingError(null);
      try {
        // Obtener el rol del usuario
        const { data: { session } } = await supabase.auth.getSession();
        const role = session?.user?.app_metadata?.role || session?.user?.user_metadata?.role || 'sin rol';
        setUserRole(role);

        // Obtener el id_comuna del usuario (si aplica)
        let comunaId = null;
        if (user?.id) {
          const { data: salaData } = await supabase
            .from('datos_sala_autogobierno')
            .select('id_comuna')
            .eq('id_usuario', user.id)
            .maybeSingle();
          if (salaData?.id_comuna) comunaId = salaData.id_comuna;
        }

        // Obtener sectores si hay comuna
        let sectorIds: number[] = [];
        if (comunaId) {
          const { data: sectores } = await supabase
            .from('sectores')
            .select('id_sector')
            .eq('id_datos_comuna', comunaId);
          if (sectores) sectorIds = sectores.map(s => s.id_sector);
        }

        // 1. Consejos comunales
        let consejosQuery = supabase.from('datos_consejo_comunal').select('id_consejo');
        if (sectorIds.length > 0) consejosQuery = consejosQuery.in('id_sector', sectorIds);
        const { data: consejosData, error: consejosError } = await consejosQuery;
        if (consejosError) throw new Error(consejosError.message);
        const totalConsejos = consejosData?.length || 0;
        const consejoIds = consejosData?.map(c => c.id_consejo) || [];

        // 2. Salas de autogobierno
        let salasQuery = supabase.from('datos_sala_autogobierno').select('id_sala', { count: 'exact', head: true });
        if (comunaId) salasQuery = salasQuery.eq('id_comuna', comunaId);
        const { count: totalSalas } = await salasQuery;

        // 3. Comunas
        let totalComunas = 0;
        if (comunaId) totalComunas = 1;
        else {
          const { count } = await supabase.from('datos_comuna').select('id_comuna', { count: 'exact', head: true });
          totalComunas = count || 0;
        }

        // 4. Voceros
        const { count: totalVoceros } = await supabase.from('voceros').select('id_vocero', { count: 'exact', head: true });

        // 5. Nudos críticos
        let nudosAlta = 0, nudosMedia = 0, nudosBaja = 0, totalNudos = 0;
        const clasificarGravedad = (gravedad: string): 'alta' | 'media' | 'baja' => {
          const g = (gravedad || '').toLowerCase().trim();
          if (g.includes('alto') || g.includes('alta') || g.includes('critico') || g.includes('crítico')) return 'alta';
          if (g.includes('medio') || g.includes('media')) return 'media';
          if (g.includes('bajo') || g.includes('baja')) return 'baja';
          return 'media';
        };
        if (consejoIds.length) {
          const { data: nudosConsejo } = await supabase.from('nudos_criticos').select('gravedad').in('id_consejo', consejoIds);
          if (nudosConsejo) {
            nudosConsejo.forEach(n => {
              totalNudos++;
              const c = clasificarGravedad(n.gravedad);
              if (c === 'alta') nudosAlta++;
              else if (c === 'media') nudosMedia++;
              else nudosBaja++;
            });
          }
        }
        let comunaIdsConsulta: number[] = [];
        if (comunaId) comunaIdsConsulta = [comunaId];
        else {
          const { data: todasComunas } = await supabase.from('datos_comuna').select('id_comuna').eq('activo', true);
          if (todasComunas) comunaIdsConsulta = todasComunas.map(c => c.id_comuna);
        }
        if (comunaIdsConsulta.length) {
          const { data: nudosComuna } = await supabase.from('nudos_criticos_comuna').select('gravedad').in('id_comuna', comunaIdsConsulta);
          if (nudosComuna) {
            nudosComuna.forEach(n => {
              totalNudos++;
              const c = clasificarGravedad(n.gravedad);
              if (c === 'alta') nudosAlta++;
              else if (c === 'media') nudosMedia++;
              else nudosBaja++;
            });
          }
        }

        // 6. Proyectos
        let totalProyectos = 0;
        if (consejoIds.length) {
          const { count } = await supabase.from('proyectos').select('id_proyecto', { count: 'exact', head: true }).in('id_consejo', consejoIds);
          totalProyectos = count || 0;
        }

        // 7. Adultos mayores (para contador)
        let adultosQuery = supabase.from('adultos_mayores').select('id_adulto', { count: 'exact', head: true });
        if (comunaId) adultosQuery = adultosQuery.eq('id_comuna', comunaId);
        const { count: totalAdultosMayores } = await adultosQuery;

        // ========== INFRAESTRUCTURA ==========
        const { data: infraData } = await supabase.from('infraestructura_sala').select(`
          estado_estructural, acceso_internet, rampas_acceso, agua_potable, estado_hardware
        `);
        const totalSalasInfra = infraData?.length || 0;
        const salasBuenEstado = infraData?.filter(s => s.estado_estructural === 'Excelente' || s.estado_estructural === 'Bueno').length || 0;
        const salasConInternet = infraData?.filter(s => s.acceso_internet && s.acceso_internet !== 'No disponible' && s.acceso_internet !== '—').length || 0;
        const salasConRampas = infraData?.filter(s => isValidValue(s.rampas_acceso)).length || 0;
        const salasAguaPotable = infraData?.filter(s => isValidValue(s.agua_potable)).length || 0;
        const hardwareExcelente = infraData?.filter(s => s.estado_hardware === 'Excelente').length || 0;

        setInfraestructuraStats({
          salasEvaluadas: totalSalasInfra,
          totalSalas: totalSalas || 0,
          salasBuenEstado,
          salasConInternet,
          salasConRampas,
          salasAguaPotable,
          hardwareExcelente
        });

        setStats({
          totalComunas,
          totalConsejos,
          totalSalas: totalSalas || 0,
          totalVoceros: totalVoceros || 0,
          totalNudos,
          nudosAlta,
          nudosMedia,
          nudosBaja,
          totalProyectos,
          totalAdultosMayores: totalAdultosMayores || 0
        });

        // ========== SALUD: Patologías y centros de salud ==========
        // Obtener todos los adultos mayores (sin filtro de comuna para director adulto mayor)
        const { data: adultosData } = await supabase
          .from('adultos_mayores')
          .select('enfermedad_cronica, cual_enfermedad, otra_enfermedad, centro_salud');
        
        if (adultosData) {
          const totalAdultos = adultosData.length;
          const conEnfermedadCronica = adultosData.filter(a => a.enfermedad_cronica === 'SI').length;
          
          // Patologías
          const pathologiesMap = new Map<string, number>();
          adultosData.forEach(adulto => {
            if (adulto.enfermedad_cronica === 'SI') {
              let disease = '';
              if (adulto.cual_enfermedad && adulto.cual_enfermedad !== 'NO APLICA' && adulto.cual_enfermedad.trim()) {
                disease = adulto.cual_enfermedad.trim();
              } else if (adulto.otra_enfermedad && adulto.otra_enfermedad.trim()) {
                disease = adulto.otra_enfermedad.trim();
              }
              if (disease) pathologiesMap.set(disease, (pathologiesMap.get(disease) || 0) + 1);
            }
          });
          const pathologies = Array.from(pathologiesMap.entries())
            .map(([name, count]) => ({ name, count }))
            .sort((a, b) => b.count - a.count)
            .slice(0, 5); // Top 5 patologías
          
          // Centros de salud
          const centersMap = new Map<string, number>();
          adultosData.forEach(adulto => {
            const center = adulto.centro_salud;
            if (center && typeof center === 'string' && center.trim()) {
              centersMap.set(center, (centersMap.get(center) || 0) + 1);
            }
          });
          const healthCenters = Array.from(centersMap.entries())
            .map(([name, count]) => ({ name, count }))
            .sort((a, b) => b.count - a.count)
            .slice(0, 5);
          
          setSaludStats({ pathologies, healthCenters, totalAdultos, conEnfermedadCronica });
        }

      } catch (err: any) {
        console.error('Error cargando estadísticas:', err);
        setLoadingError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardStats();
  }, [user]);

  // Datos para gráficos
  const pieData = [
    { name: 'Consejos Comunales', value: stats.totalConsejos, color: '#3B82F6' },
    { name: 'Salas de Autogobierno', value: stats.totalSalas, color: '#10B981' },
    { name: 'Comunas', value: stats.totalComunas, color: '#8B5CF6' },
  ];

  const nudosPorGravedad = [
    { name: 'Alta', value: stats.nudosAlta, color: '#EF4444' },
    { name: 'Media', value: stats.nudosMedia, color: '#F59E0B' },
    { name: 'Baja', value: stats.nudosBaja, color: '#10B981' },
  ];

  const infraestructuraData = [
    { name: 'Salas en Buen Estado', value: infraestructuraStats.salasBuenEstado, color: '#10B981' },
    { name: 'Salas con Internet', value: infraestructuraStats.salasConInternet, color: '#3B82F6' },
    { name: 'Salas con Rampas', value: infraestructuraStats.salasConRampas, color: '#8B5CF6' },
    { name: 'Salas con Agua Potable', value: infraestructuraStats.salasAguaPotable, color: '#06B6D4' },
    { name: 'Hardware Excelente', value: infraestructuraStats.hardwareExcelente, color: '#F59E0B' },
  ];

  const maxPathologyCount = saludStats.pathologies.length > 0 
    ? Math.max(...saludStats.pathologies.map(p => p.count)) 
    : 1;

  if (loading) {
    return (
      <div className="flex justify-center items-center h-100">
        <Loader2 className="animate-spin text-brand-primary h-8 w-8" />
        <span className="ml-2 text-slate-500">Cargando indicadores...</span>
      </div>
    );
  }

  if (loadingError) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-2xl p-6 text-center">
        <AlertCircle className="h-8 w-8 text-red-600 mx-auto mb-2" />
        <p className="text-sm font-black text-red-800">{loadingError}</p>
        <button onClick={() => window.location.reload()} className="mt-4 px-4 py-2 bg-brand-primary text-white rounded-xl text-xs font-bold">
          Reintentar
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-700">
      {/* Gráficos principales */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Gráfico de barras - Distribución territorial */}
        <div className="bg-white rounded-3xl border border-slate-100 shadow-sm p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-sm font-black text-slate-900 uppercase tracking-tight italic">Distribución Territorial</h3>
              <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mt-1">Consejos, Salas y Comunas</p>
            </div>
            <BarChart3 className="text-slate-300" size={24} />
          </div>
          {stats.totalConsejos === 0 && stats.totalSalas === 0 && stats.totalComunas === 0 ? (
            <div className="flex flex-col items-center justify-center h-70 text-center">
              <AlertCircle className="w-12 h-12 text-slate-300 mb-3" />
              <p className="text-sm text-slate-500">No hay datos disponibles</p>
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={pieData} layout="vertical" margin={{ left: 40 }}>
                <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} />
                <XAxis type="number" />
                <YAxis type="category" dataKey="name" tick={{ fontSize: 11, fontWeight: 'bold' }} width={140} />
                <Tooltip 
                  contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                  formatter={(value: any) => [`${value} unidades`, 'Cantidad']}
                />
                <Bar dataKey="value" radius={[0, 8, 8, 0]}>
                  {pieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          )}
          <div className="flex justify-center gap-6 mt-4">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-blue-500" />
              <span className="text-[9px] font-bold text-slate-600">Consejos: {stats.totalConsejos}</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-green-500" />
              <span className="text-[9px] font-bold text-slate-600">Salas: {stats.totalSalas}</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-purple-500" />
              <span className="text-[9px] font-bold text-slate-600">Comunas: {stats.totalComunas}</span>
            </div>
          </div>
        </div>

        {/* Gráfico de pastel - Nudos críticos por gravedad */}
        <div className="bg-white rounded-3xl border border-slate-100 shadow-sm p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-sm font-black text-slate-900 uppercase tracking-tight italic">Nudos Críticos por Gravedad</h3>
              <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mt-1">Clasificación de problemas</p>
            </div>
            <PieIcon className="text-slate-300" size={24} />
          </div>
          {stats.totalNudos === 0 ? (
            <div className="flex flex-col items-center justify-center h-70 text-center">
              <CheckCircle2 className="w-12 h-12 text-green-500 mb-3" />
              <p className="text-sm text-slate-500">No hay nudos críticos registrados</p>
              <p className="text-xs text-slate-400 mt-1">Todos los consejos y comunas están en buen estado</p>
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={280}>
              <PieChart>
                <Pie
                  data={nudosPorGravedad.filter(item => item.value > 0)}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={100}
                  paddingAngle={5}
                  dataKey="value"
                  label={({ name, percent, value }) => value > 0 ? `${name} ${(percent * 100).toFixed(0)}%` : null}
                  labelLine={{ strokeWidth: 1, stroke: '#CBD5E1' }}
                >
                  {nudosPorGravedad.filter(item => item.value > 0).map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip 
                  contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                  formatter={(value: any, name: any) => {
                    if (name === 'Alta') return [`${value} nudos`, 'Alto Riesgo'];
                    if (name === 'Media') return [`${value} nudos`, 'Riesgo Medio'];
                    if (name === 'Baja') return [`${value} nudos`, 'Riesgo Bajo'];
                    return [`${value} nudos`, name];
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          )}
          <div className="flex justify-center gap-6 mt-4 flex-wrap">
            {nudosPorGravedad.map((item) => (
              item.value > 0 && (
                <div key={item.name} className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color }} />
                  <span className="text-[9px] font-bold text-slate-600">
                    {item.name === 'Alta' ? 'Alto Riesgo' : item.name === 'Media' ? 'Riesgo Medio' : 'Riesgo Bajo'}: {item.value}
                  </span>
                </div>
              )
            ))}
          </div>
        </div>
      </div>

      {/* Gráfico de Infraestructura */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-3xl border border-slate-100 shadow-sm p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-sm font-black text-slate-900 uppercase tracking-tight italic">Evaluación de Infraestructura</h3>
              <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mt-1">
                {infraestructuraStats.salasEvaluadas} de {infraestructuraStats.totalSalas || infraestructuraStats.salasEvaluadas} salas evaluadas
              </p>
            </div>
            <Building2 className="text-slate-300" size={24} />
          </div>
          {infraestructuraStats.salasEvaluadas === 0 ? (
            <div className="flex flex-col items-center justify-center h-70 text-center">
              <AlertCircle className="w-12 h-12 text-slate-300 mb-3" />
              <p className="text-sm text-slate-500">No hay datos de infraestructura</p>
              <p className="text-xs text-slate-400 mt-1">No se han registrado evaluaciones de infraestructura</p>
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={infraestructuraData} layout="vertical" margin={{ left: 40 }}>
                <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} />
                <XAxis type="number" domain={[0, infraestructuraStats.salasEvaluadas]} />
                <YAxis type="category" dataKey="name" tick={{ fontSize: 10, fontWeight: 'bold' }} width={130} />
                <Tooltip 
                  contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                  formatter={(value: any, name: any) => {
                    const total = infraestructuraStats.salasEvaluadas;
                    const porcentaje = total > 0 ? Math.round((value / total) * 100) : 0;
                    return [`${value} de ${total} salas (${porcentaje}%)`, name];
                  }}
                />
                <Bar dataKey="value" radius={[0, 8, 8, 0]}>
                  {infraestructuraData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          )}
          <div className="grid grid-cols-3 gap-3 mt-4">
            <div className="text-center p-2 bg-green-50 rounded-xl">
              <p className="text-[8px] font-bold text-green-600 uppercase">Buen Estado</p>
              <p className="text-sm font-black text-green-700">{Math.round((infraestructuraStats.salasBuenEstado / infraestructuraStats.salasEvaluadas) * 100) || 0}%</p>
            </div>
            <div className="text-center p-2 bg-blue-50 rounded-xl">
              <p className="text-[8px] font-bold text-blue-600 uppercase">Con Internet</p>
              <p className="text-sm font-black text-blue-700">{Math.round((infraestructuraStats.salasConInternet / infraestructuraStats.salasEvaluadas) * 100) || 0}%</p>
            </div>
            <div className="text-center p-2 bg-amber-50 rounded-xl">
              <p className="text-[8px] font-bold text-amber-600 uppercase">Hardware Excelente</p>
              <p className="text-sm font-black text-amber-700">{Math.round((infraestructuraStats.hardwareExcelente / infraestructuraStats.salasEvaluadas) * 100) || 0}%</p>
            </div>
          </div>
        </div>

        {/* Bloque de Salud (reemplaza a Alfabetización Digital) */}
        <div className="bg-white rounded-3xl border border-slate-100 shadow-sm p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-sm font-black text-slate-900 uppercase tracking-tight italic">Salud y Atención Médica</h3>
              <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mt-1">Patologías y centros de salud</p>
            </div>
            <Activity className="text-slate-300" size={24} />
          </div>

          {/* Resumen rápido */}
          <div className="grid grid-cols-2 gap-4 mb-6">
            <div className="text-center p-3 bg-brand-primary/5 rounded-2xl">
              <p className="text-[8px] font-bold text-slate-500 uppercase">Adultos Mayores</p>
              <p className="text-xl font-black text-brand-primary">{saludStats.totalAdultos}</p>
            </div>
            <div className="text-center p-3 bg-rose-50 rounded-2xl">
              <p className="text-[8px] font-bold text-slate-500 uppercase">Con Enfermedad Crónica</p>
              <p className="text-xl font-black text-rose-600">{saludStats.conEnfermedadCronica}</p>
              <p className="text-[9px] font-bold text-rose-500">{saludStats.totalAdultos ? Math.round((saludStats.conEnfermedadCronica / saludStats.totalAdultos) * 100) : 0}%</p>
            </div>
          </div>

          {/* Patologías más comunes */}
          {saludStats.pathologies.length > 0 && (
            <div className="mb-6">
              <p className="text-[9px] font-black text-slate-400 uppercase tracking-wider mb-3">Patologías más reportadas</p>
              <div className="space-y-3">
                {saludStats.pathologies.map((path, idx) => (
                  <div key={idx}>
                    <div className="flex justify-between text-[10px] font-bold mb-1">
                      <span className="text-slate-700 truncate max-w-37.5">{path.name}</span>
                      <span className="text-brand-primary">{path.count}</span>
                    </div>
                    <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-brand-primary rounded-full"
                        style={{ width: `${(path.count / maxPathologyCount) * 100}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Centros de salud más frecuentes */}
          {saludStats.healthCenters.length > 0 && (
            <div>
              <p className="text-[9px] font-black text-slate-400 uppercase tracking-wider mb-3">Centros de salud más visitados</p>
              <div className="space-y-2">
                {saludStats.healthCenters.map((center, idx) => (
                  <div key={idx} className="flex justify-between items-center p-2 bg-slate-50 rounded-xl">
                    <span className="text-[10px] font-bold text-slate-700 truncate max-w-45">{center.name}</span>
                    <span className="text-[9px] font-black text-brand-primary bg-white px-2 py-0.5 rounded-full">{center.count} personas</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {saludStats.pathologies.length === 0 && saludStats.healthCenters.length === 0 && (
            <div className="text-center py-6">
              <AlertCircle className="w-10 h-10 text-slate-300 mx-auto mb-2" />
              <p className="text-xs text-slate-500">No hay datos de salud disponibles</p>
              <p className="text-[9px] text-slate-400">Registra adultos mayores para ver estadísticas</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// ==================== COMPONENTE PRINCIPAL ====================
interface AdultoMayorViewProps {
  user: any;
  onLogout: () => void;
}

export const AdultoMayorView: React.FC<AdultoMayorViewProps> = ({ user, onLogout }) => {
  const [activeSection, setActiveSection] = useState('dashboardA');
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [showProfile, setShowProfile] = useState(false);

  const { logout } = useAuth();
  const router = useRouter();

  // Escuchar evento de navegación desde el navbar
  useEffect(() => {
    const handleNavigateToSection = (event: CustomEvent) => {
      const { section } = event.detail;
      if (section === 'perfil') {
        setShowProfile(true);
        setActiveSection('');
      } else if (section === 'dashboard') {
        setShowProfile(false);
        setActiveSection('dashboardA');
      } else if (section) {
        setShowProfile(false);
        setActiveSection(section);
      }
    };

    window.addEventListener('navigateToSection', handleNavigateToSection as EventListener);

    // Manejar query params al cargar la página
    const searchParams = new URLSearchParams(window.location.search);
    const sectionParam = searchParams.get('section');
    if (sectionParam === 'perfil') {
      setShowProfile(true);
      setActiveSection('');
    } else if (sectionParam) {
      setShowProfile(false);
      setActiveSection(sectionParam);
    }

    return () => {
      window.removeEventListener('navigateToSection', handleNavigateToSection as EventListener);
    };
  }, []);

  const handleLogout = async () => {
    try {
      await logout();
      onLogout();
      router.push('/login');
    } catch (error) {
      console.error("Error al cerrar sesión", error);
    }
  };

  const handleNavigateToProfile = () => {
    setShowProfile(true);
    setActiveSection('');
  };

  const handleBackToDashboard = () => {
    setShowProfile(false);
    setActiveSection('dashboardA');
  };

  const handleSetActiveSection = (section: string) => {
    setShowProfile(false);
    setActiveSection(section);
  };

  const renderContent = () => {
    switch (activeSection) {
      case 'dashboardA':
        return <AdultoMayorDashboard user={user} />;
      case 'salud':
        return <SaludAtencion />;
      case 'dimen1':
        return <Dimen1 />;
      case 'dimen2':
        return <Dimen2 />;
      case 'dimen3':
        return <Dimen3 />;
      case 'dimen4':
        return <Dimen4 />;
      case 'ayuda':
        return <SoporteView />;
      case 'notificaciones':
        return <NotificationsPage />;
        case 'planidirecc':
        return <PlanificacionDireccion />;
      default:
        return <AdultoMayorDashboard user={user} />;
    }
  };

  return (
    <div className="flex h-screen bg-linear-to-br from-slate-50 via-white to-slate-50 font-sans overflow-hidden">
      
      {/* Sidebar */}
      <Sidebar 
        user={user}
        activeSection={activeSection}
        setActiveSection={handleSetActiveSection}
        isSidebarOpen={isSidebarOpen}
        setIsSidebarOpen={setIsSidebarOpen}
        isMobileMenuOpen={isMobileMenuOpen}
        setIsMobileMenuOpen={setIsMobileMenuOpen}
        onLogout={handleLogout}
        isCircuito={false}
      />

      {/* Main Content */}
      <div className="flex flex-col flex-1 overflow-hidden">
        {/* Navbar */}
        <DashboardNavbar 
          user={user}
          onMobileMenuOpen={() => setIsMobileMenuOpen(true)}
          onLogout={handleLogout}
          onNavigateToProfile={handleNavigateToProfile}
          actions={undefined}
        />

        {/* Content Area */}
        <main className="flex-1 overflow-y-auto overflow-x-hidden p-6 lg:p-8">
          <AnimatePresence mode="wait">
            {showProfile ? (
              <motion.div
                key="profile"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.3 }}
              >
                <PerfilView user={user} onBack={handleBackToDashboard} />
              </motion.div>
            ) : (
              <motion.div
                key={activeSection}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.3 }}
              >
                {renderContent()}
              </motion.div>
            )}
          </AnimatePresence>
        </main>
      </div>
    </div>
  );
};