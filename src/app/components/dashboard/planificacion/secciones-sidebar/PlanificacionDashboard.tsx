'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Loader2, AlertCircle, BarChart3, PieChart as PieIcon, CheckCircle2, Building2, GraduationCap, Briefcase, Monitor } from 'lucide-react';
import { motion } from 'framer-motion';
import { supabase } from '@/app/lib/supabaseClient';
import { useAuth } from '@/context/AuthContext';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';

// ---------- CONSTANTES ----------
const META_VALIDACION = 100;

// ---------- COMPONENTE PRINCIPAL ----------
export const PlanificacionDashboard = ({ user }: { user: any }) => {
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
  
  const [cursosStats, setCursosStats] = useState({
    totalCursos: 0,
    porTipo: [] as { tipo: string; cantidad: number; color: string }[],
    porModalidad: [] as { modalidad: string; cantidad: number; color: string }[],
    cuposTotales: 0,
    participantesInscritos: 0,
    cursosActivos: 0
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
      let comunaId = null;
      const { data: salaData } = await supabase
        .from('datos_sala_autogobierno')
        .select('id_comuna')
        .eq('id_usuario', currentUser.id)
        .maybeSingle();
      
      if (salaData?.id_comuna) comunaId = salaData.id_comuna;

      let sectorIds: number[] = [];
      if (comunaId) {
        const { data: sectores } = await supabase
          .from('sectores')
          .select('id_sector')
          .eq('id_datos_comuna', comunaId);
        if (sectores) sectorIds = sectores.map(s => s.id_sector);
      }

      let consejosQuery = supabase.from('datos_consejo_comunal').select('id_consejo, estatus_validacion');
      if (sectorIds.length) consejosQuery = consejosQuery.in('id_sector', sectorIds);
      const { data: consejosData, error: consejosError } = await consejosQuery;
      if (consejosError) throw new Error(`Error en consejos: ${consejosError.message}`);
      const totalConsejos = consejosData?.length || 0;
      const consejoIds = consejosData?.map(c => c.id_consejo) || [];

      const totalValidados = consejosData?.filter(c => c.estatus_validacion === 'APROBADO').length || 0;
      const totalPendientes = consejosData?.filter(c => c.estatus_validacion === 'PENDIENTE' || !c.estatus_validacion).length || 0;
      const totalRechazados = consejosData?.filter(c => c.estatus_validacion === 'RECHAZADO').length || 0;

      let salasQuery = supabase.from('datos_sala_autogobierno').select('id_sala', { count: 'exact', head: true });
      if (comunaId) salasQuery = salasQuery.eq('id_comuna', comunaId);
      const { count: totalSalas } = await salasQuery;

      let totalComunas = 0;
      if (comunaId) totalComunas = 1;
      else {
        const { count } = await supabase.from('datos_comuna').select('id_comuna', { count: 'exact', head: true });
        totalComunas = count || 0;
      }

      const { count: totalVoceros } = await supabase.from('voceros').select('id_vocero', { count: 'exact', head: true });

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

      let totalProyectos = 0;
      if (consejoIds.length) {
        const { count } = await supabase
          .from('proyectos')
          .select('id_proyecto', { count: 'exact', head: true })
          .in('id_consejo', consejoIds);
        totalProyectos = count || 0;
      }

      let adultosQuery = supabase.from('adultos_mayores').select('id_adulto', { count: 'exact', head: true });
      if (comunaId) adultosQuery = adultosQuery.eq('id_comuna', comunaId);
      const { count: totalAdultosMayores } = await adultosQuery;

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

      // Estadísticas de cursos
      const { data: cursosData, error: cursosError } = await supabase
        .from('cursos')
        .select('*')
        .eq('publicado', true);
      
      if (cursosError) throw new Error(`Error en cursos: ${cursosError.message}`);
      
      const cursos = cursosData || [];
      const totalCursos = cursos.length;
      const cursosActivos = cursos.filter(c => new Date(c.fecha_inicio) <= new Date() && (!c.fecha_fin || new Date(c.fecha_fin) >= new Date())).length;
      
      const tipoMap: { [key: string]: number } = {};
      cursos.forEach(curso => {
        const tipo = curso.tipo || 'Curso';
        tipoMap[tipo] = (tipoMap[tipo] || 0) + 1;
      });
      
      const tipoColors: { [key: string]: string } = {
        'Diplomado': '#8B5CF6',
        'Taller': '#F59E0B',
        'Curso': '#10B981',
        'default': '#3B82F6'
      };
      
      const porTipo = Object.entries(tipoMap).map(([tipo, cantidad]) => ({
        tipo,
        cantidad,
        color: tipoColors[tipo] || tipoColors.default
      }));
      
      const modalidadMap: { [key: string]: number } = {};
      cursos.forEach(curso => {
        const modalidad = curso.modalidad || 'Presencial';
        modalidadMap[modalidad] = (modalidadMap[modalidad] || 0) + 1;
      });
      
      const modalidadColors: { [key: string]: string } = {
        'Presencial': '#10B981',
        'Online': '#3B82F6',
        'Semipresencial': '#8B5CF6',
        'default': '#6B7280'
      };
      
      const porModalidad = Object.entries(modalidadMap).map(([modalidad, cantidad]) => ({
        modalidad,
        cantidad,
        color: modalidadColors[modalidad] || modalidadColors.default
      }));
      
      let cuposTotales = 0;
      let participantesInscritos = 0;
      
      for (const curso of cursos) {
        cuposTotales += curso.cupos || 0;
        const { count } = await supabase
          .from('participantes_curso')
          .select('*', { count: 'exact', head: true })
          .eq('id_curso', curso.id_cursos);
        participantesInscritos += count || 0;
      }
      
      setCursosStats({
        totalCursos,
        porTipo,
        porModalidad,
        cuposTotales,
        participantesInscritos,
        cursosActivos
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
    { name: 'Buen Estado', value: infraestructuraStats.salasBuenEstado, color: '#10B981' },
    { name: 'Internet', value: infraestructuraStats.salasConInternet, color: '#3B82F6' },
    { name: 'Rampas', value: infraestructuraStats.salasConRampas, color: '#8B5CF6' },
    { name: 'Agua Potable', value: infraestructuraStats.salasAguaPotable, color: '#06B6D4' },
    { name: 'Hardware Excelente', value: infraestructuraStats.hardwareExcelente, color: '#F59E0B' },
  ].filter(item => item.value > 0);

  const cursosPorTipoData = cursosStats.porTipo.map(item => ({
    name: item.tipo,
    value: item.cantidad,
    color: item.color
  }));

  const cursosPorModalidadData = cursosStats.porModalidad.map(item => ({
    name: item.modalidad,
    value: item.cantidad,
    color: item.color
  }));

  const ocupacionCupos = cursosStats.cuposTotales > 0 
    ? Math.round((cursosStats.participantesInscritos / cursosStats.cuposTotales) * 100) 
    : 0;

  if (loading) {
    return (
      <div className="flex justify-center items-center h-[400px]">
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
    <div className="space-y-5 animate-in fade-in slide-in-from-bottom-4 duration-700">
      {/* Fila 1: Distribución Territorial + Nudos Críticos */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Gráfico de barras - Distribución territorial */}
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-xs font-black text-slate-900 uppercase tracking-tight italic">Distribución Territorial</h3>
              <p className="text-[9px] text-slate-500 font-bold uppercase tracking-widest mt-0.5">Consejos, Salas y Comunas</p>
            </div>
            <BarChart3 className="text-slate-300" size={20} />
          </div>
          {pieData.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-[200px] text-center">
              <AlertCircle className="w-10 h-10 text-slate-300 mb-2" />
              <p className="text-xs text-slate-500">No hay datos disponibles</p>
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={pieData} layout="vertical" margin={{ left: 30, right: 10, top: 5, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} />
                <XAxis type="number" tick={{ fontSize: 10 }} />
                <YAxis type="category" dataKey="name" tick={{ fontSize: 10, fontWeight: 'bold' }} width={110} />
                <Tooltip 
                  contentStyle={{ borderRadius: '10px', border: 'none', fontSize: '10px' }}
                  formatter={(value: any) => [`${value} unidades`, 'Cantidad']}
                />
                <Bar dataKey="value" radius={[0, 6, 6, 0]}>
                  {pieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          )}
          <div className="flex justify-center gap-4 mt-3 flex-wrap">
            {pieData.map(item => (
              <div key={item.name} className="flex items-center gap-1.5">
                <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: item.color }} />
                <span className="text-[8px] font-bold text-slate-600">{item.name}: {item.value}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Gráfico de pastel - Nudos críticos por gravedad */}
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-xs font-black text-slate-900 uppercase tracking-tight italic">Nudos Críticos por Gravedad</h3>
              <p className="text-[9px] text-slate-500 font-bold uppercase tracking-widest mt-0.5">Clasificación de problemas</p>
            </div>
            <PieIcon className="text-slate-300" size={20} />
          </div>
          {stats.totalNudos === 0 ? (
            <div className="flex flex-col items-center justify-center h-[200px] text-center">
              <CheckCircle2 className="w-10 h-10 text-green-500 mb-2" />
              <p className="text-xs text-slate-500">No hay nudos críticos registrados</p>
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie
                  data={nudosPorGravedad}
                  cx="50%"
                  cy="50%"
                  innerRadius={45}
                  outerRadius={75}
                  paddingAngle={3}
                  dataKey="value"
                  label={({ name, percent, value }) => value > 0 ? `${name} ${(percent * 100).toFixed(0)}%` : null}
                  labelLine={{ strokeWidth: 1, stroke: '#CBD5E1' }}
                  fontSize={9}
                >
                  {nudosPorGravedad.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip 
                  contentStyle={{ borderRadius: '10px', border: 'none', fontSize: '10px' }}
                />
              </PieChart>
            </ResponsiveContainer>
          )}
          <div className="flex justify-center gap-4 mt-3 flex-wrap">
            {nudosPorGravedad.map(item => (
              <div key={item.name} className="flex items-center gap-1.5">
                <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: item.color }} />
                <span className="text-[8px] font-bold text-slate-600">
                  {item.name === 'Alta' ? 'Alto Riesgo' : item.name === 'Media' ? 'Riesgo Medio' : 'Riesgo Bajo'}: {item.value}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Fila 2: Infraestructura + Cursos */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Gráfico de Infraestructura */}
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-xs font-black text-slate-900 uppercase tracking-tight italic">Evaluación de Infraestructura</h3>
              <p className="text-[9px] text-slate-500 font-bold uppercase tracking-widest mt-0.5">
                {infraestructuraStats.salasEvaluadas} de {infraestructuraStats.totalSalas || infraestructuraStats.salasEvaluadas} salas evaluadas
              </p>
            </div>
            <Building2 className="text-slate-300" size={20} />
          </div>
          {infraestructuraStats.salasEvaluadas === 0 ? (
            <div className="flex flex-col items-center justify-center h-[200px] text-center">
              <AlertCircle className="w-10 h-10 text-slate-300 mb-2" />
              <p className="text-xs text-slate-500">No hay datos de infraestructura</p>
            </div>
          ) : (
            <>
              <ResponsiveContainer width="100%" height={140}>
                <BarChart data={infraestructuraData} layout="vertical" margin={{ left: 30, right: 10, top: 5, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} />
                  <XAxis type="number" domain={[0, infraestructuraStats.salasEvaluadas]} tick={{ fontSize: 9 }} />
                  <YAxis type="category" dataKey="name" tick={{ fontSize: 9, fontWeight: 'bold' }} width={85} />
                  <Tooltip 
                    contentStyle={{ borderRadius: '10px', border: 'none', fontSize: '10px' }}
                    formatter={(value: any, name: any) => {
                      const total = infraestructuraStats.salasEvaluadas;
                      const porcentaje = total > 0 ? Math.round((value / total) * 100) : 0;
                      return [`${value} (${porcentaje}%)`, name];
                    }}
                  />
                  <Bar dataKey="value" radius={[0, 6, 6, 0]}>
                    {infraestructuraData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
              <div className="grid grid-cols-3 gap-2 mt-3">
                <div className="text-center p-1.5 bg-green-50 rounded-lg">
                  <p className="text-[7px] font-bold text-green-600 uppercase">Buen Estado</p>
                  <p className="text-sm font-black text-green-700">{infraestructuraStats.salasEvaluadas ? Math.round((infraestructuraStats.salasBuenEstado / infraestructuraStats.salasEvaluadas) * 100) : 0}%</p>
                </div>
                <div className="text-center p-1.5 bg-blue-50 rounded-lg">
                  <p className="text-[7px] font-bold text-blue-600 uppercase">Con Internet</p>
                  <p className="text-sm font-black text-blue-700">{infraestructuraStats.salasEvaluadas ? Math.round((infraestructuraStats.salasConInternet / infraestructuraStats.salasEvaluadas) * 100) : 0}%</p>
                </div>
                <div className="text-center p-1.5 bg-amber-50 rounded-lg">
                  <p className="text-[7px] font-bold text-amber-600 uppercase">Hardware Excelente</p>
                  <p className="text-sm font-black text-amber-700">{infraestructuraStats.salasEvaluadas ? Math.round((infraestructuraStats.hardwareExcelente / infraestructuraStats.salasEvaluadas) * 100) : 0}%</p>
                </div>
              </div>
            </>
          )}
        </div>

        {/* Gráfico de Cursos */}
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-xs font-black text-slate-900 uppercase tracking-tight italic">Oferta de Cursos</h3>
              <p className="text-[9px] text-slate-500 font-bold uppercase tracking-widest mt-0.5">
                {cursosStats.totalCursos} cursos disponibles
              </p>
            </div>
            <GraduationCap className="text-slate-300" size={20} />
          </div>
          
          {cursosStats.totalCursos === 0 ? (
            <div className="flex flex-col items-center justify-center h-[200px] text-center">
              <AlertCircle className="w-10 h-10 text-slate-300 mb-2" />
              <p className="text-xs text-slate-500">No hay cursos disponibles</p>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-3 gap-2 mb-3">
                <div className="text-center p-1.5 bg-purple-50 rounded-lg">
                  <p className="text-[7px] font-bold text-purple-600 uppercase">Activos</p>
                  <p className="text-sm font-black text-purple-700">{cursosStats.cursosActivos}</p>
                </div>
                <div className="text-center p-1.5 bg-emerald-50 rounded-lg">
                  <p className="text-[7px] font-bold text-emerald-600 uppercase">Inscritos</p>
                  <p className="text-sm font-black text-emerald-700">{cursosStats.participantesInscritos}</p>
                </div>
                <div className="text-center p-1.5 bg-amber-50 rounded-lg">
                  <p className="text-[7px] font-bold text-amber-600 uppercase">Ocupación</p>
                  <p className="text-sm font-black text-amber-700">{ocupacionCupos}%</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                {/* Tipos de curso */}
                <div>
                  <div className="flex items-center gap-1 mb-2">
                    <Briefcase className="h-3 w-3 text-slate-400" />
                    <p className="text-[7px] font-black text-slate-400 uppercase tracking-wider">Por Tipo</p>
                  </div>
                  <ResponsiveContainer width="100%" height={80}>
                    <BarChart data={cursosPorTipoData} layout="vertical" margin={{ left: 45, right: 5, top: 0, bottom: 0 }}>
                      <XAxis type="number" tick={{ fontSize: 8 }} />
                      <YAxis type="category" dataKey="name" tick={{ fontSize: 8, fontWeight: 'bold' }} width={55} />
                      <Tooltip contentStyle={{ fontSize: '9px' }} formatter={(value: any) => [`${value} cursos`]} />
                      <Bar dataKey="value" radius={[0, 4, 4, 0]}>
                        {cursosPorTipoData.map((entry, index) => (
                          <Cell key={`cell-tipo-${index}`} fill={entry.color} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>

                {/* Modalidades */}
                <div>
                  <div className="flex items-center gap-1 mb-2">
                    <Monitor className="h-3 w-3 text-slate-400" />
                    <p className="text-[7px] font-black text-slate-400 uppercase tracking-wider">Por Modalidad</p>
                  </div>
                  <ResponsiveContainer width="100%" height={80}>
                    <BarChart data={cursosPorModalidadData} layout="vertical" margin={{ left: 55, right: 5, top: 0, bottom: 0 }}>
                      <XAxis type="number" tick={{ fontSize: 8 }} />
                      <YAxis type="category" dataKey="name" tick={{ fontSize: 8, fontWeight: 'bold' }} width={65} />
                      <Tooltip contentStyle={{ fontSize: '9px' }} formatter={(value: any) => [`${value} cursos`]} />
                      <Bar dataKey="value" radius={[0, 4, 4, 0]}>
                        {cursosPorModalidadData.map((entry, index) => (
                          <Cell key={`cell-modalidad-${index}`} fill={entry.color} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Barra de ocupación */}
              <div className="mt-3 pt-2 border-t border-slate-100">
                <div className="flex justify-between text-[7px] font-bold text-slate-500 mb-0.5">
                  <span>Ocupación de cupos</span>
                  <span>{ocupacionCupos}%</span>
                </div>
                <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
                  <motion.div 
                    initial={{ width: 0 }}
                    animate={{ width: `${ocupacionCupos}%` }}
                    transition={{ duration: 0.8, delay: 0.2 }}
                    className="h-full bg-brand-primary rounded-full"
                  />
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};