'use client';

import React, { useState, useEffect, useCallback } from 'react';
import dynamic from 'next/dynamic';
import { 
  ShieldCheck, MapPin, AlertTriangle, TrendingUp, 
  ArrowRight, Loader2, ArrowLeft
} from 'lucide-react';
import { motion } from 'framer-motion';
import { cn } from '@/app/lib/utils';
import { supabase } from '@/app/lib/supabaseClient';
import { useAuth } from '@/context/AuthContext';

import 'leaflet/dist/leaflet.css';

// ==================== TIPOS ====================
interface Nudo {
  id: string;
  id_real: number;
  tabla: 'consejo' | 'comuna';
  titulo: string;
  gravedad: string;        // valor original de la BD: "Alto/Crítico", "Medio", "Bajo"
  estado?: string;
  latitud: number | null;
  longitud: number | null;
  id_entidad: number;
  nombre_entidad: string;
}

interface EntidadResumen {
  id: number;
  nombre: string;
  tipo: 'consejo' | 'comuna';
  totalNudos: number;
  alto: number;            // cuenta de nudos con gravedad "Alto/Crítico"
  media: number;
  baja: number;
  ultimoNudo: string;
  gravedadPredominante: 'Alto/Crítico' | 'Media' | 'Baja';
}

// ==================== FUNCIONES AUXILIARES ====================
// Obtener texto para mostrar en UI (transforma "Medio" -> "Media", "Bajo" -> "Baja")
const getGravedadTexto = (gravedad: string | null | undefined): string => {
  if (!gravedad) return 'Baja';
  if (gravedad === 'Medio') return 'Media';
  if (gravedad === 'Bajo') return 'Baja';
  return gravedad; // "Alto/Crítico" se muestra igual
};

// Determinar si la gravedad es considerada "alta" para lógica (mapa, conteo)
const esGravedadAlta = (gravedad: string | null | undefined): boolean => {
  if (!gravedad) return false;
  const g = gravedad.toLowerCase();
  return g.includes('alto') || g.includes('crítico') || g.includes('critico');
};

// Componente de mapa (reutilizado)
const MapComponent = dynamic(
  () => import('react-leaflet').then((module) => {
    const { MapContainer, TileLayer, CircleMarker, Popup, Tooltip, useMap } = module;
    const L = require('leaflet');

    delete L.Icon.Default.prototype._getIconUrl;
    L.Icon.Default.mergeOptions({
      iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
      iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
      shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
    });

    const Legend = () => {
      const map = useMap();
      useEffect(() => {
        if (!map) return;
        const legendControl = L.control({ position: 'bottomright' });
        legendControl.onAdd = () => {
          const div = L.DomUtil.create('div', 'bg-white p-2 rounded shadow text-xs');
          div.innerHTML = `
            <div class="font-bold mb-1">Gravedad</div>
            <div><span style="background:#ef4444; width:12px;height:12px;display:inline-block;border-radius:50%;"></span> Alto/Crítico</div>
            <div><span style="background:#f97316; width:12px;height:12px;display:inline-block;border-radius:50%;"></span> Media</div>
            <div><span style="background:#eab308; width:12px;height:12px;display:inline-block;border-radius:50%;"></span> Baja</div>
          `;
          return div;
        };
        legendControl.addTo(map);
        return () => { legendControl.remove(); };
      }, [map]);
      return null;
    };

    const MapContent = ({ puntos, height = '400px' }: { puntos: Nudo[]; height?: string }) => {
      const center: [number, number] = puntos.length && puntos[0].latitud && puntos[0].longitud 
        ? [puntos[0].latitud, puntos[0].longitud] as [number, number]
        : [10.3496, -66.9845];
      return (
        <MapContainer center={center} zoom={13} style={{ height, width: '100%' }} scrollWheelZoom={true}>
          <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
          {puntos.map((p) => {
            if (!p.latitud || !p.longitud) return null;
            let radius = 10;
            let color = '#eab308';
            let fillOpacity = 0.6;
            if (esGravedadAlta(p.gravedad)) {
              radius = 20;
              color = '#ef4444';
              fillOpacity = 0.7;
            } else if (p.gravedad === 'Medio') {
              radius = 15;
              color = '#f97316';
              fillOpacity = 0.6;
            } else {
              radius = 10;
              color = '#eab308';
              fillOpacity = 0.5;
            }
            return (
              <CircleMarker
                key={p.id}
                center={[p.latitud, p.longitud]}
                radius={radius}
                pathOptions={{
                  color: color,
                  weight: 1,
                  fillColor: color,
                  fillOpacity: fillOpacity,
                }}
              >
                <Popup>
                  <div className="p-2 min-w-40">
                    <h4 className="font-black text-xs uppercase">{p.titulo}</h4>
                    <p className="text-[9px] text-slate-500 mt-1">Gravedad: {getGravedadTexto(p.gravedad)}</p>
                    {p.estado && <p className="text-[8px] text-slate-400 capitalize">Estado: {p.estado}</p>}
                    <p className="text-[8px] text-slate-400">{p.tabla === 'consejo' ? 'Consejo' : 'Comuna'}</p>
                  </div>
                </Popup>
                <Tooltip direction="top" offset={[0, -radius]} opacity={0.9} sticky>
                  <span className="text-[9px] font-black">{p.titulo}</span>
                </Tooltip>
              </CircleMarker>
            );
          })}
          <Legend />
        </MapContainer>
      );
    };
    return MapContent;
  }),
  { ssr: false, loading: () => <div className="h-80 bg-gray-100 flex items-center justify-center rounded-xl"><Loader2 className="animate-spin text-brand-primary" size={32} /></div> }
);

// ==================== COMPONENTE DETALLE (vista independiente) ====================
const DetalleNudosEntidad = ({ 
  entidad, 
  onBack 
}: { 
  entidad: EntidadResumen; 
  onBack: () => void;
}) => {
  const [nudos, setNudos] = useState<Nudo[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const cargarNudos = async () => {
      setLoading(true);
      setError(null);
      try {
        if (entidad.tipo === 'consejo') {
          const { data, error } = await supabase
            .from('nudos_criticos')
            .select('*')
            .eq('id_consejo', entidad.id);
          if (error) throw error;
          const nudosFormateados: Nudo[] = data.map((n: any) => ({
            id: `consejo-${n.id_nudo}`,
            id_real: n.id_nudo,
            tabla: 'consejo',
            titulo: n.titulo,
            gravedad: n.gravedad,
            estado: n.estado,
            latitud: n.latitud,
            longitud: n.longitud,
            id_entidad: entidad.id,
            nombre_entidad: entidad.nombre,
          }));
          setNudos(nudosFormateados);
        } else {
          const { data, error } = await supabase
            .from('nudos_criticos_comuna')
            .select('*')
            .eq('id_comuna', entidad.id);
          if (error) throw error;
          const nudosFormateados: Nudo[] = data.map((n: any) => ({
            id: `comuna-${n.id_nudo_comuna}`,
            id_real: n.id_nudo_comuna,
            tabla: 'comuna',
            titulo: n.titulo,
            gravedad: n.gravedad,
            latitud: n.latitud,
            longitud: n.longitud,
            id_entidad: entidad.id,
            nombre_entidad: entidad.nombre,
          }));
          setNudos(nudosFormateados);
        }
      } catch (err) {
        console.error(err);
        setError('Error al cargar los nudos de la entidad');
      } finally {
        setLoading(false);
      }
    };
    cargarNudos();
  }, [entidad]);

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[400px]">
        <Loader2 className="animate-spin text-brand-primary h-8 w-8" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 p-8 rounded-3xl text-center">
        <AlertTriangle className="h-12 w-12 text-red-500 mx-auto mb-3" />
        <p className="text-red-700 font-bold">{error}</p>
        <button onClick={onBack} className="mt-4 px-6 py-2 bg-slate-800 text-white rounded-xl text-xs font-black">
          Volver
        </button>
      </div>
    );
  }

  const altos = nudos.filter(n => esGravedadAlta(n.gravedad)).length;
  const medios = nudos.filter(n => n.gravedad === 'Medio').length;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 20 }}
      className="space-y-6"
    >
      {/* Cabecera con botón volver */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button
            onClick={onBack}
            className="flex items-center gap-2 px-4 py-2 bg-slate-100 hover:bg-slate-200 rounded-xl text-xs font-black uppercase tracking-widest transition"
          >
            <ArrowLeft size={10} /> Volver
          </button>
          <div>
            <h2 className="text-xl font-black text-slate-900 uppercase tracking-tighter italic">
              Nudos críticos de {entidad.nombre}
            </h2>
            <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mt-1">
              {entidad.tipo === 'consejo' ? 'Consejo Comunal' : 'Comuna'}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3 bg-white p-2 rounded-xl shadow-sm border border-slate-100">
          <div className="text-center px-3">
            <p className="text-[8px] font-black text-slate-400 uppercase">Total</p>
            <p className="text-lg font-black text-slate-800">{nudos.length}</p>
          </div>
          <div className="text-center px-3 border-l border-slate-100">
            <p className="text-[8px] font-black text-slate-400 uppercase">Alto/Crítico</p>
            <p className="text-lg font-black text-red-500">{altos}</p>
          </div>
          <div className="text-center px-3 border-l border-slate-100">
            <p className="text-[8px] font-black text-slate-400 uppercase">Media</p>
            <p className="text-lg font-black text-amber-500">{medios}</p>
          </div>
        </div>
      </div>

      {/* Grid: listado y mapa */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Listado de nudos */}
        <div className="lg:col-span-2">
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
            <div className="p-4 bg-brand-primary text-white">
              <h3 className="font-black uppercase text-[10px] tracking-widest">Listado de Nudos Críticos</h3>
            </div>
            <div className="divide-y divide-gray-100 max-h-[500px] overflow-y-auto">
              {nudos.length === 0 ? (
                <div className="p-8 text-center text-gray-400 text-sm">No hay nudos registrados</div>
              ) : (
                nudos.map((nudo) => (
                  <div key={nudo.id} className="p-4 hover:bg-gray-50/50 transition-colors">
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <div className="font-bold text-sm">{nudo.titulo}</div>
                        <div className="flex items-center gap-2 mt-1">
                          <div className={cn(
                            "w-2 h-2 rounded-full",
                            esGravedadAlta(nudo.gravedad) ? 'bg-red-500' : nudo.gravedad === 'Medio' ? 'bg-orange-500' : 'bg-yellow-500'
                          )} />
                          <span className="text-xs capitalize font-medium">{getGravedadTexto(nudo.gravedad)}</span>
                          {nudo.estado && (
                            <>
                              <span className="text-xs text-gray-400">•</span>
                              <span className="text-xs capitalize">{nudo.estado}</span>
                            </>
                          )}
                        </div>
                      </div>
                      <span className={cn(
                        "text-[8px] font-bold px-2 py-0.5 rounded-full",
                        nudo.tabla === 'consejo' ? "bg-blue-100 text-blue-700" : "bg-emerald-100 text-emerald-700"
                      )}>
                        {nudo.tabla === 'consejo' ? 'CC' : 'C'}
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Mapa */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden sticky top-4">
            <div className="p-3 bg-gray-50 border-b text-[10px] font-black uppercase">Ubicación de nudos</div>
            {nudos.filter(n => n.latitud && n.longitud).length > 0 ? (
              <MapComponent puntos={nudos} height="400px" />
            ) : (
              <div className="h-80 flex items-center justify-center bg-gray-50 text-gray-400 text-sm">
                No hay ubicaciones disponibles
              </div>
            )}
          </div>
        </div>
      </div>
    </motion.div>
  );
};

// ==================== COMPONENTE PRINCIPAL (lista de zonas) ====================
export const ZonasAtencion = () => {
  const { user } = useAuth();
  const [vistaActual, setVistaActual] = useState<'lista' | 'detalle'>('lista');
  const [entidadSeleccionada, setEntidadSeleccionada] = useState<EntidadResumen | null>(null);
  const [entidades, setEntidades] = useState<EntidadResumen[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Cargar entidades con nudos
  const cargarEntidades = useCallback(async () => {
    setLoading(true);
    setErrorMsg(null);
    try {
      const { data: consejosNudos, error: err1 } = await supabase
        .from('nudos_criticos')
        .select(`
          id_nudo,
          titulo,
          gravedad,
          estado,
          latitud,
          longitud,
          created_at,
          consejo:datos_consejo_comunal!inner(id_consejo, nombre_consejo)
        `)
        .order('created_at', { ascending: false });
      if (err1) throw err1;

      const { data: comunasNudos, error: err2 } = await supabase
        .from('nudos_criticos_comuna')
        .select(`
          id_nudo_comuna,
          titulo,
          gravedad,
          latitud,
          longitud,
          created_at,
          comuna:datos_comuna!inner(id_comuna, nombre_comuna)
        `)
        .order('created_at', { ascending: false });
      if (err2) throw err2;

      const mapaConsejos = new Map<number, { nombre: string; nudos: any[] }>();
      const mapaComunas = new Map<number, { nombre: string; nudos: any[] }>();

      consejosNudos?.forEach((n: any) => {
        const id = n.consejo.id_consejo;
        const nombre = n.consejo.nombre_consejo;
        if (!mapaConsejos.has(id)) mapaConsejos.set(id, { nombre, nudos: [] });
        mapaConsejos.get(id)!.nudos.push({
          ...n,
          gravedad: n.gravedad,
          created_at: n.created_at,
        });
      });

      comunasNudos?.forEach((n: any) => {
        const id = n.comuna.id_comuna;
        const nombre = n.comuna.nombre_comuna;
        if (!mapaComunas.has(id)) mapaComunas.set(id, { nombre, nudos: [] });
        mapaComunas.get(id)!.nudos.push({
          ...n,
          gravedad: n.gravedad,
          created_at: n.created_at,
        });
      });

      const resumen: EntidadResumen[] = [];
      for (const [id, data] of mapaConsejos) {
        const nudos = data.nudos;
        const total = nudos.length;
        const alto = nudos.filter((n: any) => esGravedadAlta(n.gravedad)).length;
        const media = nudos.filter((n: any) => n.gravedad === 'Medio').length;
        const baja = nudos.filter((n: any) => n.gravedad === 'Bajo').length;
        let gravedadPredominante: 'Alto/Crítico' | 'Media' | 'Baja' = 'Baja';
        if (alto >= media && alto >= baja) gravedadPredominante = 'Alto/Crítico';
        else if (media >= alto && media >= baja) gravedadPredominante = 'Media';
        const ultimoNudo = nudos[0]?.created_at ? new Date(nudos[0].created_at).toLocaleDateString() : 'Sin datos';
        resumen.push({
          id,
          nombre: data.nombre,
          tipo: 'consejo',
          totalNudos: total,
          alto,
          media,
          baja,
          ultimoNudo,
          gravedadPredominante,
        });
      }

      for (const [id, data] of mapaComunas) {
        const nudos = data.nudos;
        const total = nudos.length;
        const alto = nudos.filter((n: any) => esGravedadAlta(n.gravedad)).length;
        const media = nudos.filter((n: any) => n.gravedad === 'Medio').length;
        const baja = nudos.filter((n: any) => n.gravedad === 'Bajo').length;
        let gravedadPredominante: 'Alto/Crítico' | 'Media' | 'Baja' = 'Baja';
        if (alto >= media && alto >= baja) gravedadPredominante = 'Alto/Crítico';
        else if (media >= alto && media >= baja) gravedadPredominante = 'Media';
        const ultimoNudo = nudos[0]?.created_at ? new Date(nudos[0].created_at).toLocaleDateString() : 'Sin datos';
        resumen.push({
          id,
          nombre: data.nombre,
          tipo: 'comuna',
          totalNudos: total,
          alto,
          media,
          baja,
          ultimoNudo,
          gravedadPredominante,
        });
      }

      resumen.sort((a, b) => b.totalNudos - a.totalNudos);
      setEntidades(resumen);
    } catch (error) {
      console.error(error);
      setErrorMsg('Error al cargar las entidades con nudos críticos');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    cargarEntidades();
  }, [cargarEntidades]);

  const handleCardClick = (entidad: EntidadResumen) => {
    setEntidadSeleccionada(entidad);
    setVistaActual('detalle');
  };

  const handleBack = () => {
    setVistaActual('lista');
    setEntidadSeleccionada(null);
  };

  if (vistaActual === 'detalle' && entidadSeleccionada) {
    return <DetalleNudosEntidad entidad={entidadSeleccionada} onBack={handleBack} />;
  }

  // Vista lista de zonas
  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[400px]">
        <Loader2 className="animate-spin text-brand-primary h-8 w-8" />
      </div>
    );
  }

  if (errorMsg) {
    return (
      <div className="bg-red-50 p-8 rounded-3xl text-center">
        <AlertTriangle className="h-12 w-12 text-red-500 mx-auto mb-3" />
        <p className="text-red-700 font-bold">{errorMsg}</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h2 className="text-xl font-black text-slate-900 uppercase tracking-tighter italic">Zonas de Atención Prioritaria</h2>
          <p className="text-[9px] text-slate-500 font-bold uppercase tracking-widest mt-1">Nudos críticos por consejo y comuna</p>
        </div>
        
      </div>

      {/* Grid de tarjetas compactas */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
        {entidades.map((ent) => (
          <div
            key={`${ent.tipo}-${ent.id}`}
            onClick={() => handleCardClick(ent)}
            className="bg-white rounded-2xl border border-slate-100 shadow-sm hover:shadow-md hover:border-slate-200 transition-all cursor-pointer group overflow-hidden"
          >
            <div className="p-4">
              <div className="flex justify-between items-start mb-3">
                <div className="flex items-center gap-2">
                  <MapPin size={16} className="text-brand-primary" />
                  <h3 className="text-sm font-black text-slate-800 uppercase tracking-tight line-clamp-1">{ent.nombre}</h3>
                </div>
                <span className={cn(
                  "px-2 py-0.5 rounded-full text-[9px] font-bold uppercase",
                  ent.tipo === 'consejo' ? "bg-blue-100 text-blue-700" : "bg-emerald-100 text-emerald-700"
                )}>
                  {ent.tipo === 'consejo' ? 'Consejo' : 'Comuna'}
                </span>
              </div>
              
              <div className="grid grid-cols-3 gap-2 mb-3 text-center">
                <div>
                  <p className="text-[8px] font-black text-slate-400 uppercase">Total</p>
                  <p className="text-base font-black text-slate-800">{ent.totalNudos}</p>
                </div>
                <div>
                  <p className="text-[8px] font-black text-slate-400 uppercase">Alto/Crítico</p>
                  <p className="text-base font-black text-red-500">{ent.alto}</p>
                </div>
                <div>
                  <p className="text-[8px] font-black text-slate-400 uppercase">Media</p>
                  <p className="text-base font-black text-amber-500">{ent.media}</p>
                </div>
              </div>

              <div className="flex items-center justify-between text-[9px] text-slate-500">
                <span className="flex items-center gap-1">
                  <TrendingUp size={10} />
                  Predomina {ent.gravedadPredominante}
                </span>
                <span className="text-slate-400">Último: {ent.ultimoNudo}</span>
              </div>

              <div className="mt-3 pt-2 border-t border-slate-50 flex justify-end">
                <span className="text-[8px] font-black text-brand-primary uppercase flex items-center gap-1 group-hover:gap-2 transition-all">
                  Ver detalles <ArrowRight size={10} />
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};