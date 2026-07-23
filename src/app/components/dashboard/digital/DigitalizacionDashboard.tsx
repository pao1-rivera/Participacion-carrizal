'use client';
import { Loader2 } from 'lucide-react';
import React, { useState, useEffect } from 'react';
import { 
  Settings, 
  Users, 
  TrendingUp, 
  AlertCircle,
  Monitor,
  Building2,
  ShieldCheck,
  BarChart3,
  PieChart as PieIcon,
  CheckCircle2,
  Wifi,
  Maximize,
  Home,
  Droplets,
  Accessibility,
  FileText,
  UserCircle
} from 'lucide-react';

import { Dimen1 } from '../comundi/Dimen1';
import { Dimen2 } from '../comundi/Dimen2';
import { Dimen3 } from '../comundi/Dimen3';
import { Dimen4 } from '../comundi/Dimen4';
import { Alfabetizacion } from './secciones-sidebar/Alfabetizacion';
import { PerfilView } from '../common/PerfilView';
import { NotificationsPage } from '../common/Notification';
import { PlanificacionDireccion } from '../comundi/PlanificacionDireccion';

import { Sidebar } from '@/app/layout/Sidebar';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/app/lib/utils';
import { useAuth } from '@/context/AuthContext';
import { DashboardNavbar } from '../common/DashboardNavbar';
import { useRouter } from 'next/navigation';
import { SoporteView } from '../common/SoporteView';
import { supabase } from '@/app/lib/supabaseClient';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';

// ---------- CONSTANTES ----------
const META_ALFABETIZACION = 100;

// ---------- DASHBOARD D COMPONENTE CON GRÁFICOS ----------
const DashboardD = ({ user }: { user: any }) => {
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
    totalDiagnosticos: 0
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
        // Obtener el rol del usuario desde JWT
        const { data: { session } } = await supabase.auth.getSession();
        const role = session?.user?.app_metadata?.role || session?.user?.user_metadata?.role || 'sin rol';
        setUserRole(role);

        // Obtener el id_comuna del usuario
        let comunaId = null;
        if (user?.id) {
          const { data: salaData } = await supabase
            .from('datos_sala_autogobierno')
            .select('id_comuna')
            .eq('id_usuario', user.id)
            .maybeSingle();
          
          if (salaData?.id_comuna) {
            comunaId = salaData.id_comuna;
          }
        }

        // Obtener sectores si hay comuna
        let sectorIds: number[] = [];
        if (comunaId) {
          const { data: sectores } = await supabase
            .from('sectores')
            .select('id_sector')
            .eq('id_datos_comuna', comunaId);
          
          if (sectores && sectores.length > 0) {
            sectorIds = sectores.map(s => s.id_sector);
          }
        }

        // 1. Total de consejos comunales
        let consejosQuery = supabase.from('datos_consejo_comunal').select('id_consejo');
        if (sectorIds.length > 0) {
          consejosQuery = consejosQuery.in('id_sector', sectorIds);
        }
        const { data: consejosData, error: consejosError } = await consejosQuery;
        
        if (consejosError) {
          setLoadingError(`Error de permisos: ${consejosError.message}`);
          setLoading(false);
          return;
        }

        const totalConsejos = consejosData?.length || 0;
        const consejoIds = consejosData?.map(c => c.id_consejo) || [];

        // 2. Total de salas de autogobierno
        let salasQuery = supabase.from('datos_sala_autogobierno').select('id_sala', { count: 'exact', head: true });
        if (comunaId) {
          salasQuery = salasQuery.eq('id_comuna', comunaId);
        }
        const { count: totalSalas } = await salasQuery;

        // 3. Total de comunas
        let totalComunas = 0;
        if (comunaId) {
          totalComunas = 1;
        } else {
          const { count } = await supabase.from('datos_comuna').select('id_comuna', { count: 'exact', head: true });
          totalComunas = count || 0;
        }

        // 4. Total de voceros
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
        
        if (consejoIds.length > 0) {
          const { data: nudosConsejo } = await supabase
            .from('nudos_criticos')
            .select('gravedad')
            .in('id_consejo', consejoIds);
          
          if (nudosConsejo) {
            nudosConsejo.forEach((nudo: any) => {
              totalNudos++;
              const clasificacion = clasificarGravedad(nudo.gravedad);
              if (clasificacion === 'alta') nudosAlta++;
              else if (clasificacion === 'media') nudosMedia++;
              else if (clasificacion === 'baja') nudosBaja++;
            });
          }
        }

        // Nudos de comunas
        let comunaIdsConsulta: number[] = [];
        if (comunaId) {
          comunaIdsConsulta = [comunaId];
        } else {
          const { data: todasComunas } = await supabase.from('datos_comuna').select('id_comuna').eq('activo', true);
          if (todasComunas) comunaIdsConsulta = todasComunas.map(c => c.id_comuna);
        }

        if (comunaIdsConsulta.length > 0) {
          const { data: nudosComuna } = await supabase
            .from('nudos_criticos_comuna')
            .select('gravedad')
            .in('id_comuna', comunaIdsConsulta);
          
          if (nudosComuna) {
            nudosComuna.forEach((nudo: any) => {
              totalNudos++;
              const clasificacion = clasificarGravedad(nudo.gravedad);
              if (clasificacion === 'alta') nudosAlta++;
              else if (clasificacion === 'media') nudosMedia++;
              else if (clasificacion === 'baja') nudosBaja++;
            });
          }
        }

        // 6. Proyectos
        let totalProyectos = 0;
        if (consejoIds.length > 0) {
          const { count } = await supabase
            .from('proyectos')
            .select('id_proyecto', { count: 'exact', head: true })
            .in('id_consejo', consejoIds);
          totalProyectos = count || 0;
        }

        // 7. Adultos mayores
        let adultosQuery = supabase.from('adultos_mayores').select('id_adulto', { count: 'exact', head: true });
        if (comunaId) adultosQuery = adultosQuery.eq('id_comuna', comunaId);
        const { count: totalAdultosMayores } = await adultosQuery;

        // 8. Diagnósticos digitales
        let diagnosticosQuery = supabase.from('analfabetismo_digital').select('id_registro', { count: 'exact', head: true });
        if (comunaId) diagnosticosQuery = diagnosticosQuery.eq('id_comuna', comunaId);
        const { count: totalDiagnosticos } = await diagnosticosQuery;

        // ========== 9. INFRAESTRUCTURA ==========
        const { data: infraData } = await supabase
          .from('infraestructura_sala')
          .select(`
            estado_estructural,
            acceso_internet,
            rampas_acceso,
            agua_potable,
            estado_hardware
          `);
        
        const totalSalasInfra = infraData?.length || 0;
        const salasBuenEstado = infraData?.filter(s => 
          s.estado_estructural === 'Excelente' || s.estado_estructural === 'Bueno'
        ).length || 0;
        const salasConInternet = infraData?.filter(s => 
          s.acceso_internet && s.acceso_internet !== 'No disponible' && s.acceso_internet !== '—'
        ).length || 0;
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
          totalComunas: totalComunas || 0,
          totalConsejos: totalConsejos || 0,
          totalSalas: totalSalas || 0,
          totalVoceros: totalVoceros || 0,
          totalNudos: totalNudos || 0,
          nudosAlta: nudosAlta || 0,
          nudosMedia: nudosMedia || 0,
          nudosBaja: nudosBaja || 0,
          totalProyectos: totalProyectos || 0,
          totalAdultosMayores: totalAdultosMayores || 0,
          totalDiagnosticos: totalDiagnosticos || 0
        });

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

  const progresoAlfabetizacion = Math.min(100, (stats.totalDiagnosticos / META_ALFABETIZACION) * 100);

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
        <p className="text-xs text-red-600 mt-1">
          Rol detectado: {userRole}. Verifica que tu usuario tenga permisos.
        </p>
        <button 
          onClick={() => window.location.reload()} 
          className="mt-4 px-4 py-2 bg-brand-primary text-white rounded-xl text-xs font-bold"
        >
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

        {/* Área de progreso - Alfabetización digital */}
        <div className="bg-white rounded-3xl border border-slate-100 shadow-sm p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-sm font-black text-slate-900 uppercase tracking-tight italic">Alfabetización Digital</h3>
              <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mt-1">Progreso de meta anual</p>
            </div>
            <Monitor className="text-slate-300" size={24} />
          </div>
          
          <div className="text-center mb-6">
            <div className="relative inline-flex items-center justify-center">
              <svg className="w-40 h-40 transform -rotate-90">
                <circle
                  className="text-slate-100"
                  strokeWidth="12"
                  stroke="currentColor"
                  fill="transparent"
                  r="70"
                  cx="80"
                  cy="80"
                />
                <circle
                  className="text-brand-primary"
                  strokeWidth="12"
                  strokeDasharray={440}
                  strokeDashoffset={440 - (440 * progresoAlfabetizacion) / 100}
                  strokeLinecap="round"
                  stroke="currentColor"
                  fill="transparent"
                  r="70"
                  cx="80"
                  cy="80"
                />
              </svg>
              <span className="absolute text-3xl font-black text-slate-900">
                {Math.round(progresoAlfabetizacion)}%
              </span>
            </div>
            <p className="text-xs font-bold text-slate-500 mt-4">
              {stats.totalDiagnosticos} de {META_ALFABETIZACION} personas diagnosticadas
            </p>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="text-center p-3 bg-slate-50 rounded-2xl">
              <p className="text-[8px] font-bold text-slate-400 uppercase">Meta Anual</p>
              <p className="text-sm font-black text-slate-700">{META_ALFABETIZACION}</p>
            </div>
            <div className="text-center p-3 bg-slate-50 rounded-2xl">
              <p className="text-[8px] font-bold text-slate-400 uppercase">Avance</p>
              <p className="text-sm font-black text-brand-primary">{progresoAlfabetizacion.toFixed(0)}%</p>
            </div>
          </div>

          <div className="mt-4">
            <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
              <motion.div 
                initial={{ width: 0 }}
                animate={{ width: `${progresoAlfabetizacion}%` }}
                transition={{ duration: 1, delay: 0.5 }}
                className="h-full bg-brand-primary rounded-full"
              />
            </div>
            <div className="flex justify-between text-[8px] font-bold text-slate-400 mt-1">
              <span>0</span>
              <span>{Math.round(META_ALFABETIZACION / 2)}</span>
              <span>{META_ALFABETIZACION}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// ---------- COMPONENTE PRINCIPAL ----------
export const DigitalizacionDashboard = ({ user, onLogout }: { user: any; onLogout: () => void }) => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [activeTab, setActiveTab] = useState('dashboardD'); 
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [showProfile, setShowProfile] = useState(false);
  
  const { logout } = useAuth();
  const router = useRouter();

  // Función para cambiar la sección activa (cierra el perfil si está abierto)
  const handleSetActiveSection = (section: string) => {
    setShowProfile(false);
    setActiveTab(section);
  };

  // Escuchar evento de navegación
  useEffect(() => {
    const handleNavigateToSection = (event: CustomEvent) => {
      const { section } = event.detail;
      if (section === 'perfil') {
        setShowProfile(true);
        setActiveTab('');
      } else if (section === 'dashboard') {
        setShowProfile(false);
        setActiveTab('dashboardD');
      } else if (section) {
        setShowProfile(false);
        setActiveTab(section);
      }
    };

    window.addEventListener('navigateToSection', handleNavigateToSection as EventListener);

    const searchParams = new URLSearchParams(window.location.search);
    const sectionParam = searchParams.get('section');
    if (sectionParam === 'perfil') {
      setShowProfile(true);
      setActiveTab('');
    } else if (sectionParam) {
      setShowProfile(false);
      setActiveTab(sectionParam);
    }

    return () => {
      window.removeEventListener('navigateToSection', handleNavigateToSection as EventListener);
    };
  }, []);

  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth < 1024) {
        setIsSidebarOpen(false);
      } else {
        setIsSidebarOpen(true);
      }
    };
    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const renderContent = () => {
    switch (activeTab) {
      case 'dashboardD': 
        return <DashboardD user={user} />;
      case 'liderazgo':
        return <Dimen1 />;
      case 'infraestructura':
        return <Dimen2/>;
      case 'territorio':
        return <Dimen3 />;
      case 'gestion':
        return <Dimen4 />;
      case 'alfa':
        return <Alfabetizacion />;
      case 'ayuda':
        return <SoporteView />;
      case 'notificaciones':
        return <NotificationsPage />;
        case 'planidirecc':
        return <PlanificacionDireccion />;
      default:
        return (
          <div className="flex items-center justify-center h-[calc(100vh-120px)]">
            <div className="text-center">
              <div className="bg-gray-100 p-6 rounded-full w-20 h-20 flex items-center justify-center mx-auto mb-4">
                <Settings className="w-10 h-10 text-gray-400 animate-spin-slow" />
              </div>
              <h3 className="text-xl font-medium text-gray-900">Módulo de {activeTab.toUpperCase()}</h3>
              <p className="text-gray-500 max-w-sm mx-auto mt-2 italic shadow-xs">
                Esta sección está siendo optimizada para la gestión de su dirección.
              </p>
            </div>
          </div>
        );
    }
  };

  const handleLogout = async () => {
    await logout();
    router.push('/login');
  };

  const handleAvatarClick = () => {
    setShowProfile(true);
    setActiveTab('');
  };

  const handleBackToDashboard = () => {
    setShowProfile(false);
    setActiveTab('dashboardD');
  };

  return (
    <div className="flex h-screen bg-[#fcfdfe] font-sans">
      <Sidebar 
        user={user}
        activeSection={activeTab}
        setActiveSection={handleSetActiveSection}  // ← Usamos la función que cierra el perfil
        isSidebarOpen={isSidebarOpen}
        setIsSidebarOpen={setIsSidebarOpen}
        isMobileMenuOpen={isMobileMenuOpen}
        setIsMobileMenuOpen={setIsMobileMenuOpen}
        onLogout={onLogout}
        isCircuito={false}
      />

      <main className="flex-1 overflow-y-auto overflow-x-hidden pt-16 lg:pt-0">
        <DashboardNavbar 
          user={user}
          subtitle=""
          onMobileMenuOpen={() => setIsMobileMenuOpen(true)}
          onLogout={handleLogout}
          roleIcon={<Monitor size={24} />}
          onNavigateToProfile={handleAvatarClick}
        />

        <div className="p-4 lg:p-8">
          {showProfile ? (
            <div className="w-full">
              <PerfilView user={user} />
            </div>
          ) : (
            <AnimatePresence mode="wait">
              <motion.div
                key={activeTab}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.3 }}
                className="w-full"
              >
                {renderContent()}
              </motion.div>
            </AnimatePresence>
          )}
        </div>
      </main>
    </div>
  );
};