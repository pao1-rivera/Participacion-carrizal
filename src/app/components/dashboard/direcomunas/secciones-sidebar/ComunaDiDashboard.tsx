'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Loader2, AlertCircle, BarChart3, PieChart as PieIcon, CheckCircle2, Building2, ShieldCheck } from 'lucide-react';
import { motion } from 'framer-motion';
import { supabase } from '@/app/lib/supabaseClient';
import { useAuth } from '@/context/AuthContext';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';

// ---------- CONSTANTES ----------
const META_VALIDACION = 100;

// ---------- COMPONENTE PRINCIPAL ----------
export const ComunaDiDashboard = ({ user }: { user: any }) => {
  const { user: authUser } = useAuth();
  const currentUser = user || authUser;
  
  const [loading, setLoading] = useState(true);
  const [loadingError, setLoadingError] = useState<string | null>(null);
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
    totalValidados: 0,
    totalPendientes: 0,
    totalRechazados: 0
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

  const isValidValue = (value: string | null): boolean => {
    if (!value || value === '—') return false;
    const lowerValue = value.toLowerCase().trim();
    return lowerValue !== 'no aplica' && lowerValue !== 'n/a';
  };

  const fetchDashboardStats = useCallback(async () => {
    if (!currentUser?.id) {
      setLoadingError("No se pudo identificar al usuario.");
      setLoading(false);
      return;
    }

    setLoading(true);
    setLoadingError(null);

    try {
      // Obtener id_comuna desde la sala del usuario
      let comunaId = null;
      const { data: salaData } = await supabase
        .from('datos_sala_autogobierno')
        .select('id_comuna')
        .eq('id_usuario', currentUser.id)
        .maybeSingle();
      
      if (salaData?.id_comuna) comunaId = salaData.id_comuna;

      // Sectores asociados a la comuna
      let sectorIds: number[] = [];
      if (comunaId) {
        const { data: sectores } = await supabase
          .from('sectores')
          .select('id_sector')
          .eq('id_datos_comuna', comunaId);
        if (sectores) sectorIds = sectores.map(s => s.id_sector);
      }

      // Consejos comunales
      let consejosQuery = supabase.from('datos_consejo_comunal').select('id_consejo, estatus_validacion');
      if (sectorIds.length) consejosQuery = consejosQuery.in('id_sector', sectorIds);
      const { data: consejosData, error: consejosError } = await consejosQuery;
      if (consejosError) throw new Error(`Error en consejos: ${consejosError.message}`);
      const totalConsejos = consejosData?.length || 0;
      const consejoIds = consejosData?.map(c => c.id_consejo) || [];

      // Estadísticas de validación
      const totalValidados = consejosData?.filter(c => c.estatus_validacion === 'APROBADO').length || 0;
      const totalPendientes = consejosData?.filter(c => c.estatus_validacion === 'PENDIENTE' || !c.estatus_validacion).length || 0;
      const totalRechazados = consejosData?.filter(c => c.estatus_validacion === 'RECHAZADO').length || 0;

      // Salas de autogobierno
      let salasQuery = supabase.from('datos_sala_autogobierno').select('id_sala', { count: 'exact', head: true });
      if (comunaId) salasQuery = salasQuery.eq('id_comuna', comunaId);
      const { count: totalSalas } = await salasQuery;

      // Comunas (si tiene comuna asignada, es 1; si no, total)
      let totalComunas = 0;
      if (comunaId) totalComunas = 1;
      else {
        const { count } = await supabase.from('datos_comuna').select('id_comuna', { count: 'exact', head: true });
        totalComunas = count || 0;
      }

      // Voceros
      const { count: totalVoceros } = await supabase.from('voceros').select('id_vocero', { count: 'exact', head: true });

      // Nudos críticos (consejos + comunas)
      let nudosAlta = 0, nudosMedia = 0, nudosBaja = 0, totalNudos = 0;
      const clasificarGravedad = (gravedad: string): 'alta' | 'media' | 'baja' => {
        const g = (gravedad || '').toLowerCase().trim();
        if (g.includes('alto') || g.includes('alta') || g.includes('critico') || g.includes('crítico')) return 'alta';
        if (g.includes('medio') || g.includes('media')) return 'media';
        if (g.includes('bajo') || g.includes('baja')) return 'baja';
        return 'media';
      };

      if (consejoIds.length) {
        const { data: nudosConsejo } = await supabase
          .from('nudos_criticos')
          .select('gravedad')
          .in('id_consejo', consejoIds);
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
        const { data: nudosComuna } = await supabase
          .from('nudos_criticos_comuna')
          .select('gravedad')
          .in('id_comuna', comunaIdsConsulta);
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

      // Proyectos
      let totalProyectos = 0;
      if (consejoIds.length) {
        const { count } = await supabase
          .from('proyectos')
          .select('id_proyecto', { count: 'exact', head: true })
          .in('id_consejo', consejoIds);
        totalProyectos = count || 0;
      }

      // Adultos mayores
      let adultosQuery = supabase.from('adultos_mayores').select('id_adulto', { count: 'exact', head: true });
      if (comunaId) adultosQuery = adultosQuery.eq('id_comuna', comunaId);
      const { count: totalAdultosMayores } = await adultosQuery;

      // Infraestructura
      const { data: infraData } = await supabase.from('infraestructura_sala').select(`
        estado_estructural,
        acceso_internet,
        rampas_acceso,
        agua_potable,
        estado_hardware
      `);
      const salasEvaluadas = infraData?.length || 0;
      const salasBuenEstado = infraData?.filter(s => s.estado_estructural === 'Excelente' || s.estado_estructural === 'Bueno').length || 0;
      const salasConInternet = infraData?.filter(s => s.acceso_internet && s.acceso_internet !== 'No disponible' && s.acceso_internet !== '—').length || 0;
      const salasConRampas = infraData?.filter(s => isValidValue(s.rampas_acceso)).length || 0;
      const salasAguaPotable = infraData?.filter(s => isValidValue(s.agua_potable)).length || 0;
      const hardwareExcelente = infraData?.filter(s => s.estado_hardware === 'Excelente').length || 0;

      setInfraestructuraStats({
        salasEvaluadas,
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
        totalNudos,
        nudosAlta,
        nudosMedia,
        nudosBaja,
        totalProyectos,
        totalAdultosMayores: totalAdultosMayores || 0,
        totalValidados,
        totalPendientes,
        totalRechazados
      });

    } catch (err: any) {
      console.error('Error cargando estadísticas:', err);
      setLoadingError(err.message || 'Error al cargar los datos');
    } finally {
      setLoading(false);
    }
  }, [currentUser?.id]);

  useEffect(() => {
    fetchDashboardStats();
  }, [fetchDashboardStats]);

  // Preparar datos para gráficos
  const pieData = [
    { name: 'Consejos Comunales', value: stats.totalConsejos, color: '#3B82F6' },
    { name: 'Salas de Autogobierno', value: stats.totalSalas, color: '#10B981' },
    { name: 'Comunas', value: stats.totalComunas, color: '#8B5CF6' },
  ].filter(item => item.value > 0);

  const nudosPorGravedad = [
    { name: 'Alta', value: stats.nudosAlta, color: '#EF4444' },
    { name: 'Media', value: stats.nudosMedia, color: '#F59E0B' },
    { name: 'Baja', value: stats.nudosBaja, color: '#10B981' },
  ].filter(item => item.value > 0);

  const infraestructuraData = [
    { name: 'Salas en Buen Estado', value: infraestructuraStats.salasBuenEstado, color: '#10B981' },
    { name: 'Salas con Internet', value: infraestructuraStats.salasConInternet, color: '#3B82F6' },
    { name: 'Salas con Rampas', value: infraestructuraStats.salasConRampas, color: '#8B5CF6' },
    { name: 'Salas con Agua Potable', value: infraestructuraStats.salasAguaPotable, color: '#06B6D4' },
    { name: 'Hardware Excelente', value: infraestructuraStats.hardwareExcelente, color: '#F59E0B' },
  ].filter(item => item.value > 0);

  const validacionData = [
    { name: 'Validados', value: stats.totalValidados, color: '#10B981' },
    { name: 'Pendientes', value: stats.totalPendientes, color: '#F59E0B' },
    { name: 'Rechazados', value: stats.totalRechazados, color: '#EF4444' },
  ].filter(item => item.value > 0);

  const progresoValidacion = stats.totalConsejos > 0 ? Math.min(100, (stats.totalValidados / stats.totalConsejos) * 100) : 0;

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
        <button 
          onClick={() => fetchDashboardStats()} 
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
          {pieData.length === 0 ? (
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
          <div className="flex justify-center gap-6 mt-4 flex-wrap">
            {pieData.map(item => (
              <div key={item.name} className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color }} />
                <span className="text-[9px] font-bold text-slate-600">{item.name}: {item.value}</span>
              </div>
            ))}
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
                  data={nudosPorGravedad}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={100}
                  paddingAngle={5}
                  dataKey="value"
                  label={({ name, percent, value }) => value > 0 ? `${name} ${(percent * 100).toFixed(0)}%` : null}
                  labelLine={{ strokeWidth: 1, stroke: '#CBD5E1' }}
                >
                  {nudosPorGravedad.map((entry, index) => (
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
            {nudosPorGravedad.map(item => (
              <div key={item.name} className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color }} />
                <span className="text-[9px] font-bold text-slate-600">
                  {item.name === 'Alta' ? 'Alto Riesgo' : item.name === 'Media' ? 'Riesgo Medio' : 'Riesgo Bajo'}: {item.value}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Gráfico de Infraestructura y Progreso Validación */}
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
              <p className="text-sm font-black text-green-700">{infraestructuraStats.salasEvaluadas ? Math.round((infraestructuraStats.salasBuenEstado / infraestructuraStats.salasEvaluadas) * 100) : 0}%</p>
            </div>
            <div className="text-center p-2 bg-blue-50 rounded-xl">
              <p className="text-[8px] font-bold text-blue-600 uppercase">Con Internet</p>
              <p className="text-sm font-black text-blue-700">{infraestructuraStats.salasEvaluadas ? Math.round((infraestructuraStats.salasConInternet / infraestructuraStats.salasEvaluadas) * 100) : 0}%</p>
            </div>
            <div className="text-center p-2 bg-amber-50 rounded-xl">
              <p className="text-[8px] font-bold text-amber-600 uppercase">Hardware Excelente</p>
              <p className="text-sm font-black text-amber-700">{infraestructuraStats.salasEvaluadas ? Math.round((infraestructuraStats.hardwareExcelente / infraestructuraStats.salasEvaluadas) * 100) : 0}%</p>
            </div>
          </div>
        </div>

        {/* Área de progreso - Validación de Consejos */}
        <div className="bg-white rounded-3xl border border-slate-100 shadow-sm p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-sm font-black text-slate-900 uppercase tracking-tight italic">Validación de Consejos</h3>
              <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mt-1">Progreso de validación de consejos comunales</p>
            </div>
            <ShieldCheck className="text-slate-300" size={24} />
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
                  strokeDashoffset={440 - (440 * progresoValidacion) / 100}
                  strokeLinecap="round"
                  stroke="currentColor"
                  fill="transparent"
                  r="70"
                  cx="80"
                  cy="80"
                />
              </svg>
              <span className="absolute text-3xl font-black text-slate-900">
                {Math.round(progresoValidacion)}%
              </span>
            </div>
            <p className="text-xs font-bold text-slate-500 mt-4">
              {stats.totalValidados} de {stats.totalConsejos} consejos validados
            </p>
          </div>

          <div className="grid grid-cols-3 gap-3 mb-4">
            {validacionData.map(item => (
              <div key={item.name} className="text-center p-2 rounded-xl" style={{ backgroundColor: `${item.color}10` }}>
                <p className="text-[8px] font-bold uppercase" style={{ color: item.color }}>{item.name}</p>
                <p className="text-sm font-black" style={{ color: item.color }}>{item.value}</p>
              </div>
            ))}
          </div>

          <div className="mt-2">
            <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
              <motion.div 
                initial={{ width: 0 }}
                animate={{ width: `${progresoValidacion}%` }}
                transition={{ duration: 1, delay: 0.5 }}
                className="h-full bg-brand-primary rounded-full"
              />
            </div>
            <div className="flex justify-between text-[8px] font-bold text-slate-400 mt-1">
              <span>0%</span>
              <span>50%</span>
              <span>100%</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};