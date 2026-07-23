'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Building2, Globe, Users, AlertCircle, HeartPulse, UserX, Briefcase,
  MapPin, ChevronLeft, ChevronRight, Loader2, X, CheckCircle2,
  Target, Calendar, Clock, UserCog, UserCheck, MoveRight, FileText
} from 'lucide-react';
import dynamic from 'next/dynamic';
import { cn } from '@/app/lib/utils';
import { supabase } from '@/app/lib/supabaseClient';
import { useAuth } from '@/context/AuthContext';
import { UserBase } from '@/types';
import { AlertModal } from '@/app/components/AlertModal';

import 'leaflet/dist/leaflet.css';

// ==================== UTILIDADES ====================
const esAfirmativo = (valor: any): boolean => {
  if (valor === undefined || valor === null) return false;
  if (typeof valor === 'boolean') return valor === true;
  if (typeof valor === 'number') return valor === 1;
  if (typeof valor === 'string') {
    const v = valor.toLowerCase().trim();
    return ['sí', 'si', 's', 'true', '1', 'x', '✓', '✅'].includes(v);
  }
  return false;
};

const esNegativo = (valor: any): boolean => {
  if (valor === undefined || valor === null) return true;
  if (typeof valor === 'boolean') return valor === false;
  if (typeof valor === 'number') return valor === 0;
  if (typeof valor === 'string') {
    const v = valor.toLowerCase().trim();
    return ['', 'no', 'ninguna', 'n/a', 'na', 'no aplica', 'no aplicable', 'false', '0'].includes(v);
  }
  return false;
};

// ==================== TIPOS ====================
interface NudoConCoordenadas {
  id: number;
  titulo: string;
  gravedad: string;
  latitud: number;
  longitud: number;
  tabla: 'consejo' | 'comuna';
}

interface DireccionMeta {
  nombre: string;
  director: string;
  progreso: number;
  estado: string;
  color: string;
  icon: any;
  tareasPendientes: number;
}

// ==================== MAPA DE CALOR ====================
const MapHeatComponent = dynamic(
  () => import('react-leaflet').then((module) => {
    const { MapContainer, TileLayer, CircleMarker, Popup, Tooltip } = module;
    const L = require('leaflet');

    const MapContent = ({ puntos }: { puntos: NudoConCoordenadas[] }) => {
      const center: [number, number] = puntos.length > 0 && puntos[0].latitud && puntos[0].longitud
        ? [puntos[0].latitud, puntos[0].longitud]
        : [10.3496, -66.9845];

      return (
        <MapContainer center={center} zoom={13} style={{ height: '320px', width: '100%' }} scrollWheelZoom={true}>
          <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
          {puntos.map((p) => {
            let radius = 12;
            let color = '#eab308';
            let fillOpacity = 0.6;
            const g = p.gravedad?.toLowerCase() || '';
            if (g.includes('alto') || g.includes('crítico')) {
              radius = 22;
              color = '#ef4444';
              fillOpacity = 0.8;
            } else if (g.includes('medio')) {
              radius = 16;
              color = '#f97316';
              fillOpacity = 0.7;
            } else {
              radius = 12;
              color = '#eab308';
              fillOpacity = 0.5;
            }
            return (
              <CircleMarker
                key={`${p.tabla}-${p.id}`}
                center={[p.latitud, p.longitud]}
                radius={radius}
                pathOptions={{ color, weight: 1, fillColor: color, fillOpacity }}
              >
                <Popup>
                  <div className="p-2 min-w-40">
                    <h4 className="font-black text-xs uppercase">{p.titulo}</h4>
                    <p className="text-[9px] text-slate-500 mt-1">Gravedad: {p.gravedad}</p>
                    <p className="text-[8px] text-slate-400 capitalize">{p.tabla}</p>
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
  { ssr: false, loading: () => <div className="h-80 bg-gray-100 flex items-center justify-center rounded-xl"><Loader2 className="animate-spin text-brand-primary" size={32} /></div> }
);

// ==================== COMPONENTE PRINCIPAL ====================
export const SecretarioView: React.FC<{ user: UserBase; selectedEje: string }> = ({ user, selectedEje }) => {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalConsejos: 0,
    totalComunas: 0,
    totalSalas: 0,
    poblacionTotal: 0,
    poblacionDetalle: { infantes: 0, ninos: 0, jovenes: 0, adultos: 0, adultosMayores: 0 },
    pensionados: 0,
    discapacitados: 0,
    discapacidadesDetalle: [] as { nombre: string; cantidad: number }[],
    desempleados: 0,
    desempleadosLista: [] as { nombre: string; edad: number }[],
    pensionadosLista: [] as { nombre: string; cedula: string; edad: number }[],
    nudosConCoordenadas: [] as NudoConCoordenadas[],
    direcciones: [] as DireccionMeta[],
  });

  const [modalOpen, setModalOpen] = useState<{ type: 'pensionados' | 'discapacitados' | 'desempleados' | null }>({ type: null });
  const [modalNudosOpen, setModalNudosOpen] = useState(false);

  const [alertModal, setAlertModal] = useState({ open: false, title: '', message: '', type: 'info' as 'info' | 'success' | 'warning' | 'danger' });
  const showAlert = (title: string, message: string, type: 'info' | 'success' | 'warning' | 'danger') =>
    setAlertModal({ open: true, title, message, type });

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        console.log("🔍 Iniciando carga de datos...");

        // 1. Conteo de entidades
        const { count: consejos } = await supabase.from('datos_consejo_comunal').select('*', { count: 'exact', head: true });
        const { count: comunas } = await supabase.from('datos_comuna').select('*', { count: 'exact', head: true });
        const { count: salas } = await supabase.from('datos_sala_autogobierno').select('*', { count: 'exact', head: true });

        // 2. Población censada (jefes + familiares)
        const { data: fichas, error: fichasError } = await supabase
          .from('censo_fichas')
          .select('id_ficha, edad, sexo, pensionado, discapacidad, trabaja_actualmente, nombres, apellidos, cedula');
        if (fichasError) console.error('Error en fichas:', fichasError);
        console.log(`📊 Fichas obtenidas: ${fichas?.length || 0}`);

        let familiares: any[] = [];
        if (fichas?.length) {
          const ids = fichas.map(f => f.id_ficha);
          const { data: famData, error: famError } = await supabase
            .from('censo_familiares')
            .select('id_ficha, nombre_familiar, apellido_familiar, cedula, edad, pensionado, discapacidad, trabajo_a')
            .in('id_ficha', ids);
          if (famError) console.error('Error en familiares:', famError);
          familiares = famData || [];
          console.log(`👨‍👩‍👧‍👦 Familiares obtenidos: ${familiares.length}`);
        }

        // =====================================================
        // 4. PROCESAR DATOS DE POBLACIÓN Y VULNERABLES
        // =====================================================
        let poblacionTotal = 0;
        const poblacionDetalle = { infantes: 0, ninos: 0, jovenes: 0, adultos: 0, adultosMayores: 0 };
        let pensionados = 0;
        let discapacitados = 0;
        const discapacidadesMap = new Map<string, number>();
        const desempleadosLista: { nombre: string; edad: number }[] = [];
        const pensionadosLista: { nombre: string; cedula: string; edad: number }[] = [];

        const procesarPersona = (
          nombre: string,
          cedula: string,
          edad: number,
          pensionado: any,
          discapacidad: any,
          trabaja: any
        ) => {
          // Contar población por edad
          poblacionTotal++;
          if (edad >= 0 && edad <= 5) poblacionDetalle.infantes++;
          else if (edad >= 6 && edad <= 14) poblacionDetalle.ninos++;
          else if (edad >= 15 && edad <= 29) poblacionDetalle.jovenes++;
          else if (edad >= 30 && edad <= 54) poblacionDetalle.adultos++;
          else if (edad >= 55) poblacionDetalle.adultosMayores++;

          // Pensionado
          if (esAfirmativo(pensionado)) {
            pensionados++;
            pensionadosLista.push({ nombre, cedula, edad });
          }

          // Discapacidad
          if (discapacidad && !esNegativo(discapacidad)) {
            discapacitados++;
            const key = discapacidad.trim();
            discapacidadesMap.set(key, (discapacidadesMap.get(key) || 0) + 1);
          }

          // Desempleado (>=18 años y NO trabaja)
          if (edad >= 18 && !esAfirmativo(trabaja)) {
            desempleadosLista.push({ nombre, edad });
          }
        };

        // Procesar jefes
        fichas?.forEach(f => {
          const nombreCompleto = `${f.nombres || ''} ${f.apellidos || ''}`.trim() || 'Sin nombre';
          procesarPersona(
            nombreCompleto,
            f.cedula || '',
            f.edad || 0,
            f.pensionado,
            f.discapacidad,
            f.trabaja_actualmente
          );
        });

        // Procesar familiares
        familiares.forEach(f => {
          const nombreCompleto = `${f.nombre_familiar || ''} ${f.apellido_familiar || ''}`.trim() || 'Sin nombre';
          procesarPersona(
            nombreCompleto,
            f.cedula || '',
            f.edad || 0,
            f.pensionado,
            f.discapacidad,
            f.trabajo_a
          );
        });

        console.log(`✅ Pensionados: ${pensionados}, Discapacitados: ${discapacitados}, Desempleados: ${desempleadosLista.length}`);
        console.log('📋 Lista de pensionados (primeros 3):', pensionadosLista.slice(0, 3));
        console.log('📋 Discapacidades:', Array.from(discapacidadesMap.entries()));

        const discapacidadesDetalle = Array.from(discapacidadesMap.entries())
          .map(([nombre, cantidad]) => ({ nombre, cantidad }))
          .sort((a, b) => b.cantidad - a.cantidad);

        // 5. Nudos con coordenadas (para mapa de calor)
        const { data: nudosConsejo } = await supabase
          .from('nudos_criticos')
          .select('id_nudo, titulo, gravedad, latitud, longitud')
          .not('latitud', 'is', null)
          .not('longitud', 'is', null);
        const { data: nudosComuna } = await supabase
          .from('nudos_criticos_comuna')
          .select('id_nudo_comuna, titulo, gravedad, latitud, longitud')
          .not('latitud', 'is', null)
          .not('longitud', 'is', null);
        const nudos: NudoConCoordenadas[] = [
          ...(nudosConsejo || []).map(n => ({ id: n.id_nudo, titulo: n.titulo, gravedad: n.gravedad || 'Bajo', latitud: n.latitud, longitud: n.longitud, tabla: 'consejo' as const })),
          ...(nudosComuna || []).map(n => ({ id: n.id_nudo_comuna, titulo: n.titulo, gravedad: n.gravedad || 'Bajo', latitud: n.latitud, longitud: n.longitud, tabla: 'comuna' as const })),
        ];

        // 6. Cumplimiento de metas de direcciones
        const roles = ['director_comunas', 'director_digitalizacion', 'director_adulto_mayor', 'director_formacion_planificacion'];
        const { data: rolesData } = await supabase.from('rol_usuario').select('id_rol, nombre_rol').in('nombre_rol', roles);
        const configMap: Record<string, { nombre: string; icon: any; color: string }> = {
          director_comunas: { nombre: 'Dirección de Comunas', icon: Globe, color: 'bg-indigo-500' },
          director_digitalizacion: { nombre: 'Dirección de Digitalización', icon: Target, color: 'bg-blue-500' },
          director_adulto_mayor: { nombre: 'Dirección de Adulto Mayor', icon: HeartPulse, color: 'bg-rose-500' },
          director_formacion_planificacion: { nombre: 'Dirección de Planificación', icon: Calendar, color: 'bg-emerald-500' },
        };
        const direcciones: DireccionMeta[] = [];
        for (const rol of rolesData || []) {
          const config = configMap[rol.nombre_rol];
          if (!config) continue;
          const { data: perfiles } = await supabase.from('perfil_usuario').select('id_usuario, nombre, apellido').eq('id_rol', rol.id_rol);
          if (!perfiles || perfiles.length === 0) continue;
          const director = perfiles[0];
          const { data: tareas } = await supabase.from('planificacion_semanal').select('cumplido').eq('id_usuario', director.id_usuario);
          const total = tareas?.length || 0;
          const completadas = tareas?.filter(t => t.cumplido === true).length || 0;
          const progreso = total > 0 ? Math.round((completadas / total) * 100) : 0;
          const estado = progreso >= 80 ? 'Excelente' : progreso <= 30 ? 'Crítico' : 'Operativo';
          direcciones.push({
            nombre: config.nombre,
            director: `${director.nombre} ${director.apellido}`,
            progreso,
            estado,
            color: config.color,
            icon: config.icon,
            tareasPendientes: total - completadas,
          });
        }

        setStats({
          totalConsejos: consejos || 0,
          totalComunas: comunas || 0,
          totalSalas: salas || 0,
          poblacionTotal,
          poblacionDetalle,
          pensionados,
          discapacitados,
          discapacidadesDetalle,
          desempleados: desempleadosLista.length,
          desempleadosLista,
          pensionadosLista,
          nudosConCoordenadas: nudos,
          direcciones,
        });
      } catch (error) {
        console.error('Error cargando datos para SecretarioView:', error);
        showAlert('Error', 'No se pudieron cargar los datos', 'danger');
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand-primary" />
      </div>
    );
  }

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-8">
      {/* ==================== 1. ESTRUCTURA GEOPOLÍTICA ==================== */}
      <div>
        <h3 className="text-sm font-black uppercase tracking-wider text-slate-500 mb-4 flex items-center gap-2">
          <Building2 size={16} /> Estructura Geopolítica
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm flex items-center justify-between">
            <div><p className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Comunas</p><p className="text-3xl font-black text-slate-900">{stats.totalComunas}</p></div>
            <div className="p-3 rounded-xl bg-orange-50 text-orange-500"><Globe size={24} /></div>
          </div>
          <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm flex items-center justify-between">
            <div><p className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Consejos Comunales</p><p className="text-3xl font-black text-slate-900">{stats.totalConsejos}</p></div>
            <div className="p-3 rounded-xl bg-blue-50 text-blue-500"><Users size={24} /></div>
          </div>
          <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm flex items-center justify-between">
            <div><p className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Salas de Autogobierno</p><p className="text-3xl font-black text-slate-900">{stats.totalSalas}</p></div>
            <div className="p-3 rounded-xl bg-emerald-50 text-emerald-500"><Building2 size={24} /></div>
          </div>
        </div>
      </div>

      {/* ==================== 2. POBLACIÓN ==================== */}
      <div>
        <h3 className="text-sm font-black uppercase tracking-wider text-slate-500 mb-4 flex items-center gap-2">
          <Users size={16} /> Población
        </h3>
        <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Total Censados</span>
            <span className="text-3xl font-black text-slate-900">{stats.poblacionTotal.toLocaleString()}</span>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
            <div className="bg-slate-50 p-3 rounded-xl text-center"><p className="text-[8px] font-black text-slate-400 uppercase">Infantes</p><p className="text-xl font-black">{stats.poblacionDetalle.infantes}</p></div>
            <div className="bg-slate-50 p-3 rounded-xl text-center"><p className="text-[8px] font-black text-slate-400 uppercase">Niños</p><p className="text-xl font-black">{stats.poblacionDetalle.ninos}</p></div>
            <div className="bg-slate-50 p-3 rounded-xl text-center"><p className="text-[8px] font-black text-slate-400 uppercase">Jóvenes</p><p className="text-xl font-black">{stats.poblacionDetalle.jovenes}</p></div>
            <div className="bg-slate-50 p-3 rounded-xl text-center"><p className="text-[8px] font-black text-slate-400 uppercase">Adultos</p><p className="text-xl font-black">{stats.poblacionDetalle.adultos}</p></div>
            <div className="bg-slate-50 p-3 rounded-xl text-center"><p className="text-[8px] font-black text-slate-400 uppercase">Adultos Mayores</p><p className="text-xl font-black">{stats.poblacionDetalle.adultosMayores}</p></div>
          </div>
        </div>
      </div>

      {/* ==================== 3. GRUPOS VULNERABLES ==================== */}
      <div>
        <h3 className="text-sm font-black uppercase tracking-wider text-slate-500 mb-4 flex items-center gap-2">
          <HeartPulse size={16} /> Grupos Vulnerables
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div onClick={() => setModalOpen({ type: 'pensionados' })} className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm cursor-pointer hover:shadow-md transition-all">
            <div className="flex justify-between items-start"><div><p className="text-[10px] font-black text-slate-400 uppercase">Pensionados</p><p className="text-3xl font-black text-slate-900">{stats.pensionados}</p></div><UserCog size={24} className="text-brand-primary/50" /></div>
          </div>
          <div onClick={() => setModalOpen({ type: 'discapacitados' })} className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm cursor-pointer hover:shadow-md transition-all">
            <div className="flex justify-between items-start"><div><p className="text-[10px] font-black text-slate-400 uppercase">Discapacitados</p><p className="text-3xl font-black text-slate-900">{stats.discapacitados}</p></div><UserX size={24} className="text-brand-primary/50" /></div>
          </div>
          <div onClick={() => setModalOpen({ type: 'desempleados' })} className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm cursor-pointer hover:shadow-md transition-all">
            <div className="flex justify-between items-start"><div><p className="text-[10px] font-black text-slate-400 uppercase">Desempleados</p><p className="text-3xl font-black text-slate-900">{stats.desempleados}</p></div><Briefcase size={24} className="text-brand-primary/50" /></div>
          </div>
        </div>
      </div>

      {/* ==================== 4. MAPA DE CALOR DE NUDOS CRÍTICOS ==================== */}
      <div>
        <h3 className="text-sm font-black uppercase tracking-wider text-slate-500 mb-4 flex items-center gap-2">
          <MapPin size={16} /> Mapa de Calor – Nudos Críticos
        </h3>
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
          <div className="p-3 bg-gray-50 border-b text-[10px] font-black uppercase flex justify-between items-center">
            <span>{stats.nudosConCoordenadas.length} nudos georreferenciados</span>
            <button onClick={() => setModalNudosOpen(true)} className="text-brand-primary text-[9px] font-bold">Ver lista completa</button>
          </div>
          {stats.nudosConCoordenadas.length > 0 ? (
            <MapHeatComponent puntos={stats.nudosConCoordenadas} />
          ) : (
            <div className="h-80 flex items-center justify-center text-slate-400">No hay nudos con coordenadas registradas</div>
          )}
        </div>
      </div>

      {/* ==================== 5. CUMPLIMIENTO DE METAS DE DIRECCIONES ==================== */}
      <div>
        <h3 className="text-sm font-black uppercase tracking-wider text-slate-500 mb-4 flex items-center gap-2">
          <Target size={16} /> Cumplimiento de Metas – Direcciones
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {stats.direcciones.map((dir, idx) => (
            <div key={idx} className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
              <div className="flex items-center gap-3 mb-4">
                <div className={cn("p-2 rounded-xl text-white", dir.color)}><dir.icon size={20} /></div>
                <div><p className="text-xs font-black uppercase">{dir.nombre}</p><p className="text-[9px] text-slate-400">{dir.director}</p></div>
              </div>
              <div className="flex justify-between items-end mb-1"><span className="text-[9px] font-black text-slate-400 uppercase">Cumplimiento</span><span className="text-sm font-black">{dir.progreso}%</span></div>
              <div className="h-2 w-full bg-slate-50 rounded-full overflow-hidden">
                <div className={cn("h-full rounded-full transition-all duration-1000", dir.color)} style={{ width: `${dir.progreso}%` }} />
              </div>
              <div className="flex justify-between mt-3 text-[10px]">
                <span className={cn("font-black uppercase px-2 py-0.5 rounded-full", 
                  dir.estado === 'Excelente' ? 'bg-emerald-50 text-emerald-600' : 
                  dir.estado === 'Crítico' ? 'bg-red-50 text-red-600' : 'bg-blue-50 text-blue-600'
                )}>{dir.estado}</span>
                <span className="text-slate-400">{dir.tareasPendientes} tareas pendientes</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ============ MODAL DE LISTA DE NUDOS ============ */}
      <AnimatePresence>
        {modalNudosOpen && (
          <div className="fixed inset-0 z-100 flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={() => setModalNudosOpen(false)} />
            <motion.div initial={{ scale: 0.95 }} animate={{ scale: 1 }} exit={{ scale: 0.95 }} className="relative w-full max-w-lg bg-white rounded-2xl shadow-2xl overflow-hidden max-h-[80vh] flex flex-col">
              <div className="p-4 bg-brand-primary text-white flex justify-between items-center">
                <h4 className="font-black uppercase text-sm">Nudos Críticos Georreferenciados</h4>
                <button onClick={() => setModalNudosOpen(false)}><X size={20} /></button>
              </div>
              <div className="flex-1 overflow-y-auto p-4 space-y-2">
                {stats.nudosConCoordenadas.length === 0 ? (
                  <p className="text-center text-slate-400 py-8">No hay nudos con coordenadas</p>
                ) : (
                  stats.nudosConCoordenadas.map(n => (
                    <div key={`${n.tabla}-${n.id}`} className="p-3 bg-slate-50 rounded-xl flex justify-between items-center">
                      <div><p className="text-sm font-bold">{n.titulo}</p><p className="text-[9px] text-slate-500 capitalize">{n.tabla}</p></div>
                      <span className={cn("px-2 py-0.5 rounded-full text-[9px] font-black uppercase",
                        n.gravedad?.toLowerCase().includes('alto') || n.gravedad?.toLowerCase().includes('crítico') ? 'bg-red-100 text-red-700' :
                        n.gravedad?.toLowerCase().includes('medio') ? 'bg-orange-100 text-orange-700' : 'bg-yellow-100 text-yellow-700'
                      )}>{n.gravedad}</span>
                    </div>
                  ))
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ============ MODALES DE GRUPOS VULNERABLES ============ */}
      <AnimatePresence>
        {modalOpen.type === 'pensionados' && (
          <div className="fixed inset-0 z-100 flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={() => setModalOpen({ type: null })} />
            <motion.div initial={{ scale: 0.95 }} animate={{ scale: 1 }} exit={{ scale: 0.95 }} className="relative w-full max-w-lg bg-white rounded-2xl shadow-2xl overflow-hidden max-h-[80vh] flex flex-col">
              <div className="p-4 bg-gradient-to-r from-indigo-600 to-indigo-500 text-white flex justify-between items-center">
                <h4 className="font-black uppercase text-sm flex items-center gap-2"><UserCog size={18} /> Pensionados</h4>
                <button onClick={() => setModalOpen({ type: null })}><X size={20} /></button>
              </div>
              <div className="flex-1 overflow-y-auto p-4 space-y-2">
                {stats.pensionadosLista.length === 0 ? (
                  <p className="text-center text-slate-400 py-8">No hay pensionados registrados</p>
                ) : (
                  stats.pensionadosLista.map((p, idx) => (
                    <div key={idx} className="p-3 bg-slate-50 rounded-xl flex justify-between items-center">
                      <div><p className="text-sm font-bold">{p.nombre}</p><p className="text-[9px] text-slate-500">C.I: {p.cedula}</p></div>
                      <span className="text-[10px] text-slate-400">{p.edad} años</span>
                    </div>
                  ))
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {modalOpen.type === 'discapacitados' && (
          <div className="fixed inset-0 z-100 flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={() => setModalOpen({ type: null })} />
            <motion.div initial={{ scale: 0.95 }} animate={{ scale: 1 }} exit={{ scale: 0.95 }} className="relative w-full max-w-md bg-white rounded-2xl shadow-2xl overflow-hidden max-h-[80vh] flex flex-col">
              <div className="p-4 bg-gradient-to-r from-purple-600 to-purple-500 text-white flex justify-between items-center">
                <h4 className="font-black uppercase text-sm flex items-center gap-2"><UserX size={18} /> Discapacidades</h4>
                <button onClick={() => setModalOpen({ type: null })}><X size={20} /></button>
              </div>
              <div className="flex-1 overflow-y-auto p-4 space-y-2">
                {stats.discapacidadesDetalle.length === 0 ? (
                  <p className="text-center text-slate-400 py-8">No hay discapacidades registradas</p>
                ) : (
                  stats.discapacidadesDetalle.map((d, idx) => (
                    <div key={idx} className="p-3 bg-slate-50 rounded-xl flex justify-between items-center">
                      <span className="text-sm font-bold">{d.nombre}</span>
                      <span className="text-[10px] font-black bg-purple-100 text-purple-700 px-2 py-1 rounded-full">{d.cantidad} {d.cantidad === 1 ? 'persona' : 'personas'}</span>
                    </div>
                  ))
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {modalOpen.type === 'desempleados' && (
          <div className="fixed inset-0 z-100 flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={() => setModalOpen({ type: null })} />
            <motion.div initial={{ scale: 0.95 }} animate={{ scale: 1 }} exit={{ scale: 0.95 }} className="relative w-full max-w-lg bg-white rounded-2xl shadow-2xl overflow-hidden max-h-[80vh] flex flex-col">
              <div className="p-4 bg-gradient-to-r from-orange-600 to-orange-500 text-white flex justify-between items-center">
                <h4 className="font-black uppercase text-sm flex items-center gap-2"><Briefcase size={18} /> Desempleados (≥18 años)</h4>
                <button onClick={() => setModalOpen({ type: null })}><X size={20} /></button>
              </div>
              <div className="flex-1 overflow-y-auto p-4 space-y-2">
                {stats.desempleadosLista.length === 0 ? (
                  <p className="text-center text-slate-400 py-8">No hay desempleados registrados</p>
                ) : (
                  stats.desempleadosLista.map((d, idx) => (
                    <div key={idx} className="p-3 bg-slate-50 rounded-xl flex justify-between items-center">
                      <span className="text-sm font-bold">{d.nombre}</span>
                      <span className="text-[10px] text-slate-400">{d.edad} años</span>
                    </div>
                  ))
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ============ ALERT MODAL ============ */}
      <AlertModal
        isOpen={alertModal.open}
        onClose={() => setAlertModal(prev => ({ ...prev, open: false }))}
        title={alertModal.title}
        message={alertModal.message}
        type={alertModal.type}
        confirmText="Aceptar"
      />
    </motion.div>
  );
};