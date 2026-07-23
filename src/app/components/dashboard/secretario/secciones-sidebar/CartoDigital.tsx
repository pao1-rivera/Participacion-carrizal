'use client';

import React, { useState, useEffect, useMemo } from 'react';
import dynamic from 'next/dynamic';
import { 
  MapIcon, MapPin, Search, Filter, Home, Users, Wifi,
  MapPinOff, ChevronLeft, ChevronRight, Loader2
} from 'lucide-react';
import { cn } from '@/app/lib/utils';
import { supabase } from '@/app/lib/supabaseClient';

import 'leaflet/dist/leaflet.css';

interface LocationPoint {
  id: number;
  name: string;
  type: 'comuna' | 'consejo' | 'sala';
  lat: number;
  lng: number;
}

interface SinUbicacion {
  id: number;
  nombre: string;
  tipo: 'comuna' | 'consejo' | 'sala';
  criticidad: 'Alta' | 'Media' | 'Baja';
  razon: string;
}

const MUNICIPIO_CARRIZAL_GEOJSON: any = {
  type: "Feature",
  properties: { name: "Municipio Carrizal", description: "Límites del Municipio Carrizal, Estado Miranda" },
  geometry: {
    type: "Polygon",
    coordinates: [[
      
    ]]
  }
};

const MapComponent = dynamic(
  () => import('react-leaflet').then((module) => {
    const { MapContainer, TileLayer, Marker, Popup, Tooltip, GeoJSON } = module;
    const L = require('leaflet');

    delete L.Icon.Default.prototype._getIconUrl;
    L.Icon.Default.mergeOptions({
      iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
      iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
      shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
    });

    const getIcon = (type: string) => {
      const color = type === 'comuna' ? '#f97316' : type === 'consejo' ? '#3b82f6' : '#10b981';
      return L.divIcon({
        className: 'custom-marker',
        html: `<div style="background-color: ${color}; width: 24px; height: 24px; border-radius: 50%; border: 3px solid white; box-shadow: 0 2px 6px rgba(0,0,0,0.3); display: flex; align-items: center; justify-content: center; font-size: 10px; font-weight: bold; color: white;">${type === 'comuna' ? 'C' : type === 'consejo' ? 'CC' : 'S'}</div>`,
        iconSize: [24, 24],
        iconAnchor: [12, 12],
        popupAnchor: [0, -12]
      });
    };

    const geojsonStyle = {
      color: "#ef4444",
      weight: 2,
      opacity: 0.85,
      dashArray: "6, 6",
      fillColor: "#ef4444",
      fillOpacity: 0.03
    };

    const MapContent = ({ points, center, zoom }: { points: LocationPoint[]; center: { lat: number; lng: number }; zoom: number }) => {
      return (
        <MapContainer center={[center.lat, center.lng]} zoom={zoom} style={{ height: '100%', width: '100%' }} scrollWheelZoom={true}>
          <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
          <GeoJSON data={MUNICIPIO_CARRIZAL_GEOJSON} style={geojsonStyle} />
          {points.map((point) => (
            <Marker key={`${point.type}-${point.id}`} position={[point.lat, point.lng]} icon={getIcon(point.type)}>
              <Popup>
                <div className="p-2 min-w-45">
                  <h4 className="font-black text-xs uppercase tracking-tight">{point.name}</h4>
                  <p className="text-[9px] font-bold text-slate-500 mt-1">{point.type === 'comuna' ? 'Comuna' : point.type === 'consejo' ? 'Consejo Comunal' : 'Sala de Autogobierno'}</p>
                  <div className="mt-2 text-[8px] font-black text-brand-primary">Lat: {point.lat.toFixed(5)} | Lng: {point.lng.toFixed(5)}</div>
                </div>
              </Popup>
              <Tooltip direction="top" offset={[0, -12]} opacity={0.9} sticky><span className="text-[9px] font-black">{point.name}</span></Tooltip>
            </Marker>
          ))}
        </MapContainer>
      );
    };
    return MapContent;
  }),
  { ssr: false, loading: () => <div className="h-full w-full flex items-center justify-center bg-slate-50"><Loader2 className="animate-spin text-brand-primary" size={32} /></div> }
);

export const CartoDigital = () => {
  const [points, setPoints] = useState<LocationPoint[]>([]);
  const [sinUbicacion, setSinUbicacion] = useState<SinUbicacion[]>([]);
  const [mapLoading, setMapLoading] = useState(true);
  const [filterType, setFilterType] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [sinUbicacionPage, setSinUbicacionPage] = useState(1);
  const sinUbicacionItemsPerPage = 6;
  const mapCenter = { lat: 10.3496, lng: -66.9845 };
  const zoom = 13;

  useEffect(() => {
    const fetchMapLocations = async () => {
      setMapLoading(true);
      const allPoints: LocationPoint[] = [];
      const sinUbicacionList: SinUbicacion[] = [];

      // Comunas
      const { data: comunas } = await supabase.from('datos_comuna').select('id_comuna, nombre_comuna, ubicacion_comuna!left(latitud, longitud)');
      if (comunas) {
        comunas.forEach((comuna: any) => {
          let ubic = comuna.ubicacion_comuna;
          if (Array.isArray(ubic)) ubic = ubic[0];
          if (ubic && ubic.latitud && ubic.longitud) {
            const lat = parseFloat(ubic.latitud);
            const lng = parseFloat(ubic.longitud);
            if (!isNaN(lat) && !isNaN(lng)) allPoints.push({ id: comuna.id_comuna, name: comuna.nombre_comuna, type: 'comuna', lat, lng });
            else sinUbicacionList.push({ id: comuna.id_comuna, nombre: comuna.nombre_comuna, tipo: 'comuna', criticidad: 'Media', razon: 'Coordenadas no registradas' });
          } else sinUbicacionList.push({ id: comuna.id_comuna, nombre: comuna.nombre_comuna, tipo: 'comuna', criticidad: 'Media', razon: 'Coordenadas no registradas' });
        });
      }

      // Consejos comunales
      const { data: consejos } = await supabase.from('datos_consejo_comunal').select('id_consejo, nombre_consejo, ubicacion_consejo!left(latitud, longitud)');
      if (consejos) {
        consejos.forEach((consejo: any) => {
          let ubic = consejo.ubicacion_consejo;
          if (Array.isArray(ubic)) ubic = ubic[0];
          if (ubic && ubic.latitud && ubic.longitud) {
            const lat = parseFloat(ubic.latitud);
            const lng = parseFloat(ubic.longitud);
            if (!isNaN(lat) && !isNaN(lng)) allPoints.push({ id: consejo.id_consejo, name: consejo.nombre_consejo, type: 'consejo', lat, lng });
            else sinUbicacionList.push({ id: consejo.id_consejo, nombre: consejo.nombre_consejo, tipo: 'consejo', criticidad: 'Alta', razon: 'Coordenadas no registradas' });
          } else sinUbicacionList.push({ id: consejo.id_consejo, nombre: consejo.nombre_consejo, tipo: 'consejo', criticidad: 'Alta', razon: 'Coordenadas no registradas' });
        });
      }

      // Salas de autogobierno
      const { data: ubicacionesSalas } = await supabase.from('ubicacion_sala').select('id_ubicacion_sala, id_comuna, latitud, longitud');
      const { data: todasSalas } = await supabase.from('datos_sala_autogobierno').select('id_sala, nombre_sala, id_comuna');
      const salaConUbicacion = new Set();
      if (ubicacionesSalas && ubicacionesSalas.length) {
        const comunaIds = ubicacionesSalas.map(u => u.id_comuna);
        const { data: salasInfo } = await supabase.from('datos_sala_autogobierno').select('id_sala, nombre_sala, id_comuna').in('id_comuna', comunaIds);
        const salaMap = new Map();
        if (salasInfo) salasInfo.forEach(s => salaMap.set(s.id_comuna, { id: s.id_sala, name: s.nombre_sala }));
        ubicacionesSalas.forEach(ubic => {
          const sala = salaMap.get(ubic.id_comuna);
          if (sala && ubic.latitud && ubic.longitud) {
            const lat = parseFloat(ubic.latitud);
            const lng = parseFloat(ubic.longitud);
            if (!isNaN(lat) && !isNaN(lng)) {
              salaConUbicacion.add(sala.id);
              allPoints.push({ id: sala.id, name: sala.name, type: 'sala', lat, lng });
            }
          }
        });
      }
      if (todasSalas) {
        todasSalas.forEach((sala: any) => {
          if (!salaConUbicacion.has(sala.id_sala)) sinUbicacionList.push({ id: sala.id_sala, nombre: sala.nombre_sala, tipo: 'sala', criticidad: 'Baja', razon: 'Coordenadas no registradas' });
        });
      }

      setPoints(allPoints);
      setSinUbicacion(sinUbicacionList);
      setMapLoading(false);
    };
    fetchMapLocations();
  }, []);

  const filteredPoints = useMemo(() => {
    let filtered = points;
    if (filterType !== 'all') filtered = filtered.filter(p => p.type === filterType);
    if (searchTerm.trim()) filtered = filtered.filter(p => p.name.toLowerCase().includes(searchTerm.toLowerCase()));
    return filtered;
  }, [points, filterType, searchTerm]);

  const counts = {
    comuna: points.filter(p => p.type === 'comuna').length,
    consejo: points.filter(p => p.type === 'consejo').length,
    sala: points.filter(p => p.type === 'sala').length,
  };

  const totalSinUbicacionPages = Math.ceil(sinUbicacion.length / sinUbicacionItemsPerPage);
  const sinUbicacionStart = (sinUbicacionPage - 1) * sinUbicacionItemsPerPage;
  const currentSinUbicacion = sinUbicacion.slice(sinUbicacionStart, sinUbicacionStart + sinUbicacionItemsPerPage);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-3 md:gap-4">
      <div className="lg:col-span-2 bg-white rounded-lg md:rounded-xl shadow-md overflow-hidden">
        {/* Filtros */}
        <div className="p-3 bg-gray-50 border-b border-gray-200 flex flex-wrap items-center justify-between gap-2">
          <div className="flex gap-2">
            <button onClick={() => setFilterType('all')} className={cn("px-2 py-1 rounded-lg text-[8px] font-black uppercase transition-all", filterType === 'all' ? "bg-brand-primary text-white shadow-sm" : "bg-white text-slate-500 border border-slate-200")}>
              Todos ({points.length})
            </button>
            <button onClick={() => setFilterType('comuna')} className={cn("px-2 py-1 rounded-lg text-[8px] font-black uppercase transition-all flex items-center gap-1", filterType === 'comuna' ? "bg-orange-500 text-white shadow-sm" : "bg-white text-slate-500 border border-slate-200")}>
              <Home size={10} /> Comunas ({counts.comuna})
            </button>
            <button onClick={() => setFilterType('consejo')} className={cn("px-2 py-1 rounded-lg text-[8px] font-black uppercase transition-all flex items-center gap-1", filterType === 'consejo' ? "bg-blue-500 text-white shadow-sm" : "bg-white text-slate-500 border border-slate-200")}>
              <Users size={10} /> Consejos ({counts.consejo})
            </button>
            <button onClick={() => setFilterType('sala')} className={cn("px-2 py-1 rounded-lg text-[8px] font-black uppercase transition-all flex items-center gap-1", filterType === 'sala' ? "bg-emerald-500 text-white shadow-sm" : "bg-white text-slate-500 border border-slate-200")}>
              <Wifi size={10} /> Salas ({counts.sala})
            </button>
          </div>
          <div className="relative">
            <Search className="absolute left-2 top-1/2 -translate-y-1/2 text-slate-400" size={12} />
            <input type="text" placeholder="Buscar..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="pl-7 pr-2 py-1 bg-white border border-slate-200 rounded-lg text-[10px] outline-none focus:ring-1 focus:ring-brand-primary w-40" />
          </div>
        </div>
        {/* Mapa */}
        <div className="h-100 md:h-125 w-full bg-slate-100 relative">
          {mapLoading ? (
            <div className="absolute inset-0 flex items-center justify-center bg-white/80 z-10"><Loader2 className="animate-spin text-brand-primary" size={32} /></div>
          ) : (
            <MapComponent points={filteredPoints} center={mapCenter} zoom={zoom} />
          )}
          <div className="absolute bottom-3 right-3 bg-white/95 backdrop-blur-sm p-2 rounded-lg shadow-md border border-gray-100 z-500 text-[7px] font-black uppercase">
            <div className="flex flex-col gap-1">
              <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full bg-orange-500" /> Comuna</div>
              <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full bg-blue-500" /> Consejo Comunal</div>
              <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full bg-emerald-500" /> Sala Autogobierno</div>
              
            </div>
          </div>
        </div>
      </div>

      {/* Sectores Desatendidos */}
      <div className="space-y-2 md:space-y-2.5">
        <div className="flex items-center justify-between">
          <h3 className="font-black text-gray-800 uppercase text-[9px] md:text-[10px] tracking-widest">Instancias Sin ubicación </h3>
        </div>
        {sinUbicacion.length === 0 ? (
          <div className="bg-white p-4 rounded-lg text-center text-gray-400"><MapPinOff size={24} className="mx-auto mb-2 opacity-30" /><p className="text-[9px]">Todas las entidades tienen ubicación registrada</p></div>
        ) : (
          <>
            <div className="space-y-2">
              {currentSinUbicacion.map((item) => (
                <div key={`${item.tipo}-${item.id}`} className="bg-white p-2.5 md:p-3 rounded-lg border-l-3 border-orange-500 shadow-sm">
                  <div className="flex justify-between items-start mb-0.5">
                    <span className="font-black text-gray-800 uppercase text-[9px] md:text-[10px]">{item.nombre}</span>
                    <span className={`text-[6px] md:text-[7px] font-black px-1 md:px-1.5 py-0.5 rounded uppercase ${item.criticidad === 'Alta' ? 'bg-red-50 text-red-600' : item.criticidad === 'Media' ? 'bg-orange-50 text-orange-600' : 'bg-yellow-50 text-yellow-600'}`}>{item.criticidad}</span>
                  </div>
                  <p className="text-[7px] md:text-[8px] text-gray-500 italic">{item.tipo === 'comuna' ? 'Comuna' : item.tipo === 'consejo' ? 'Consejo Comunal' : 'Sala de Autogobierno'}</p>
                  <p className="text-[6px] md:text-[7px] text-gray-400 mt-0.5">Causa: {item.razon}</p>
                </div>
              ))}
            </div>
            {totalSinUbicacionPages > 1 && (
              <div className="flex items-center justify-between pt-2">
                <button onClick={() => setSinUbicacionPage(p => Math.max(1, p-1))} disabled={sinUbicacionPage === 1} className={cn("p-1 rounded-lg border border-gray-200", sinUbicacionPage === 1 ? "opacity-40 cursor-not-allowed" : "hover:bg-gray-50")}><ChevronLeft size={14} /></button>
                <span className="text-[8px] font-medium text-gray-500">{sinUbicacionPage} / {totalSinUbicacionPages}</span>
                <button onClick={() => setSinUbicacionPage(p => Math.min(totalSinUbicacionPages, p+1))} disabled={sinUbicacionPage === totalSinUbicacionPages} className={cn("p-1 rounded-lg border border-gray-200", sinUbicacionPage === totalSinUbicacionPages ? "opacity-40 cursor-not-allowed" : "hover:bg-gray-50")}><ChevronRight size={14} /></button>
              </div>
            )}
            <div className="p-2.5 md:p-3 bg-brand-primary rounded-lg text-white">
              <p className="text-[7px] md:text-[9px] font-bold opacity-70 uppercase mb-0.5">Análisis de Brecha</p>
              <p className="text-base md:text-lg font-black italic tracking-tighter">{Math.round((sinUbicacion.length / (points.length + sinUbicacion.length)) * 100)}%</p>
              <p className="text-[6px] md:text-[7px] leading-tight opacity-80 mt-0.5 uppercase font-bold tracking-widest">Del territorio sin ubicación registrada</p>
            </div>
          </>
        )}
      </div>
    </div>
  );
};