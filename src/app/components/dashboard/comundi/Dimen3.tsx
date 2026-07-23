'use client';

import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import dynamic from 'next/dynamic';
import { 
  MapPin, Layers, Search, Maximize2, Filter, X,
  Loader2, Home, Building2, Users, Wifi, Baby, HeartPulse,
  ChevronLeft, ChevronRight, User, Calendar, Activity,
  Flame, Plug, Bus, Award, Globe, Shield
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/app/lib/utils';
import { supabase } from '@/app/lib/supabaseClient';

import 'leaflet/dist/leaflet.css';

// ==================== TIPOS ====================
interface LocationPoint {
  id: number;
  name: string;
  type: 'comuna' | 'consejo' | 'sala';
  lat: number;
  lng: number;
  description?: string;
  extra?: any;
}

interface FichaPersona {
  id: string;
  tipo: 'ficha';
  nombres: string;
  apellidos: string;
  cedula: string;
  edad: number;
  sexo: string;
  enfermedad: string;
  cne: string;
}

interface FamiliarPersona {
  id: string;
  tipo: 'familiar';
  nombres: string;
  apellidos: string;
  cedula: string;
  edad: number;
  sexo: string;
  enfermedad: string;
  cne: string;
}

type Persona = FichaPersona | FamiliarPersona;

// Coordenadas GeoJSON del polígono límite del Municipio Carrizal
const MUNICIPIO_CARRIZAL_GEOJSON: any = {
  type: "Feature",
  properties: { name: "Municipio Carrizal" },
  geometry: {
    type: "Polygon",
    coordinates: [[
      [-66.9934, 10.3662],
      [-66.9850, 10.3675],
      [-66.9745, 10.3540],
      [-66.9610, 10.3552],
      [-66.9535, 10.3440],
      [-66.9560, 10.3340],
      [-66.9690, 10.3250],
      [-66.9800, 10.3150],
      [-66.9940, 10.3250],
      [-67.0120, 10.3310],
      [-67.0150, 10.3470],
      [-67.0010, 10.3550],
      [-66.9934, 10.3662]
    ]]
  }
};

// ==================== COMPONENTE DEL MAPA ====================
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
        html: `<div style="background-color: ${color}; width: 24px; height: 24px; border-radius: 50%; border: 3px solid white; box-shadow: 0 2px 6px rgba(0,0,0,0.3); display: flex; align-items: center; justify-content: center; font-size: 12px; font-weight: bold; color: white;">${type === 'comuna' ? 'C' : type === 'consejo' ? 'CC' : 'S'}</div>`,
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

    const MapContent = ({ points, center, zoom, onMove }: any) => {
      const mapRef = useRef<any>(null);
      
      const handleMoveEnd = useCallback(() => {
        if (mapRef.current && onMove) {
          const centerMap = mapRef.current.getCenter();
          onMove({ lat: centerMap.lat, lng: centerMap.lng });
        }
      }, [onMove]);

      useEffect(() => {
        if (mapRef.current) {
          mapRef.current.on('moveend', handleMoveEnd);
          return () => {
            mapRef.current?.off('moveend', handleMoveEnd);
          };
        }
      }, [handleMoveEnd]);

      return (
        <MapContainer
          center={center}
          zoom={zoom}
          style={{ height: '100%', width: '100%' }}
          ref={mapRef}
          scrollWheelZoom={true}
        >
          <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
          <GeoJSON data={MUNICIPIO_CARRIZAL_GEOJSON} style={geojsonStyle} />
          {points.map((point: LocationPoint) => (
            <Marker
              key={`${point.type}-${point.id}`}
              position={[point.lat, point.lng]}
              icon={getIcon(point.type)}
            >
              <Popup>
                <div className="p-2 min-w-45">
                  <h4 className="font-black text-xs uppercase tracking-tight">{point.name}</h4>
                  <p className="text-[9px] font-bold text-slate-500 mt-1">
                    {point.type === 'comuna' ? 'Comuna' : point.type === 'consejo' ? 'Consejo Comunal' : 'Sala de Autogobierno'}
                  </p>
                  {point.description && <p className="text-[8px] text-slate-400 mt-1">{point.description}</p>}
                  <div className="mt-2 text-[8px] font-black text-brand-primary">
                    Lat: {point.lat.toFixed(5)} | Lng: {point.lng.toFixed(5)}
                  </div>
                </div>
              </Popup>
              <Tooltip direction="top" offset={[0, -12]} opacity={0.9} sticky>
                <span className="text-[9px] font-black">{point.name}</span>
              </Tooltip>
            </Marker>
          ))}
        </MapContainer>
      );
    };
    return MapContent;
  }),
  {
    ssr: false,
    loading: () => (
      <div className="h-full w-full flex items-center justify-center bg-slate-50">
        <Loader2 className="animate-spin text-brand-primary" size={32} />
      </div>
    ),
  }
);

// ==================== VISOR GEOGRÁFICO (sin cambios) ====================
const VisorGeografico = () => {
  const [points, setPoints] = useState<LocationPoint[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<string>('all');
  const [mapCenter, setMapCenter] = useState({ lat: 10.3496, lng: -66.9845 });
  const [zoom, setZoom] = useState(13);
  const [showFilters, setShowFilters] = useState(false);
  const [stats, setStats] = useState({ total: 0, conCoordenadas: 0 });

  useEffect(() => {
    const fetchAllLocations = async () => {
      setLoading(true);
      const allPoints: LocationPoint[] = [];

      // 1. Comunas
      const { data: comunas, error: errComunas } = await supabase
        .from('datos_comuna')
        .select(`
          id_comuna,
          nombre_comuna,
          ubicacion_comuna!left (
            latitud,
            longitud,
            limite_norte,
            limite_sur,
            limite_este,
            limite_oeste
          )
        `);
      if (errComunas) console.error("Error comunas:", errComunas);
      if (comunas) {
        comunas.forEach((comuna: any) => {
          let ubic = comuna.ubicacion_comuna;
          if (Array.isArray(ubic)) ubic = ubic[0];
          if (ubic && ubic.latitud && ubic.longitud) {
            const lat = parseFloat(ubic.latitud);
            const lng = parseFloat(ubic.longitud);
            if (!isNaN(lat) && !isNaN(lng)) {
              allPoints.push({
                id: comuna.id_comuna,
                name: comuna.nombre_comuna,
                type: 'comuna',
                lat, lng,
                description: `Límites: N-${ubic.limite_norte || '?'} / S-${ubic.limite_sur || '?'} / E-${ubic.limite_este || '?'} / O-${ubic.limite_oeste || '?'}`
              });
            }
          }
        });
      }

      // 2. Consejos comunales
      const { data: consejos, error: errConsejos } = await supabase
        .from('datos_consejo_comunal')
        .select(`
          id_consejo,
          nombre_consejo,
          ubicacion_consejo!left (
            latitud,
            longitud,
            limite_norte,
            limite_sur,
            limite_este,
            limite_oeste
          )
        `);
      if (errConsejos) console.error("Error consejos:", errConsejos);
      if (consejos) {
        consejos.forEach((consejo: any) => {
          let ubic = consejo.ubicacion_consejo;
          if (Array.isArray(ubic)) ubic = ubic[0];
          if (ubic && ubic.latitud && ubic.longitud) {
            const lat = parseFloat(ubic.latitud);
            const lng = parseFloat(ubic.longitud);
            if (!isNaN(lat) && !isNaN(lng)) {
              allPoints.push({
                id: consejo.id_consejo,
                name: consejo.nombre_consejo,
                type: 'consejo',
                lat, lng,
                description: `Límites: N-${ubic.limite_norte || '?'} / S-${ubic.limite_sur || '?'} / E-${ubic.limite_este || '?'} / O-${ubic.limite_oeste || '?'}`
              });
            }
          }
        });
      }

      // 3. Salas de autogobierno (desde ubicacion_sala)
      const { data: ubicacionesSalas, error: errUbicSalas } = await supabase
        .from('ubicacion_sala')
        .select(`
          id_ubicacion_sala,
          id_comuna,
          latitud,
          longitud,
          enlace_maps
        `);
      if (errUbicSalas) console.error("Error ubicacion_sala:", errUbicSalas);
      if (ubicacionesSalas && ubicacionesSalas.length > 0) {
        const comunaIds = ubicacionesSalas.map(u => u.id_comuna);
        const { data: salasInfo, error: errSalasInfo } = await supabase
          .from('datos_sala_autogobierno')
          .select('id_sala, nombre_sala, id_comuna')
          .in('id_comuna', comunaIds);
        if (errSalasInfo) console.error("Error obteniendo nombres de salas:", errSalasInfo);
        else if (salasInfo) {
          const salaMap = new Map(salasInfo.map(s => [s.id_comuna, { id: s.id_sala, name: s.nombre_sala }]));
          ubicacionesSalas.forEach(ubic => {
            const sala = salaMap.get(ubic.id_comuna);
            if (sala && ubic.latitud && ubic.longitud) {
              const lat = parseFloat(ubic.latitud);
              const lng = parseFloat(ubic.longitud);
              if (!isNaN(lat) && !isNaN(lng)) {
                allPoints.push({
                  id: sala.id,
                  name: sala.name,
                  type: 'sala',
                  lat, lng,
                  description: `Ubicación georreferenciada de la sala`
                });
              }
            }
          });
        }
      }

      setPoints(allPoints);
      setStats({ total: allPoints.length, conCoordenadas: allPoints.length });
      setLoading(false);
    };

    fetchAllLocations();
  }, []);

  const filteredPoints = useMemo(() => {
    let filtered = points;
    if (filterType !== 'all') {
      filtered = filtered.filter(p => p.type === filterType);
    }
    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(p => p.name.toLowerCase().includes(term));
    }
    return filtered;
  }, [points, filterType, searchTerm]);

  const totalCount = filteredPoints.length;
  const counts = {
    comuna: points.filter(p => p.type === 'comuna').length,
    consejo: points.filter(p => p.type === 'consejo').length,
    sala: points.filter(p => p.type === 'sala').length,
  };

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="space-y-6">
      <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden flex flex-col min-h-137.5">
        <div className="p-4 border-b border-slate-50 bg-slate-50/30">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-3 flex-wrap">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
                <input
                  type="text"
                  placeholder="Buscar comuna, consejo o sala..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-9 pr-4 py-2 bg-white border border-slate-200 rounded-xl text-xs font-medium outline-none focus:ring-2 focus:ring-brand-primary/20 w-64"
                />
              </div>
              <button
                onClick={() => setShowFilters(!showFilters)}
                className="flex items-center gap-1 px-3 py-2 bg-white border border-slate-200 rounded-xl text-[10px] font-black uppercase text-slate-500 hover:border-brand-primary transition-all"
              >
                <Filter size={12} /> Filtros
              </button>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => setFilterType('all')}
                className={cn("px-3 py-1.5 rounded-lg text-[9px] font-black uppercase transition-all", filterType === 'all' ? "bg-brand-primary text-white shadow-sm" : "bg-white text-slate-500 border border-slate-200 hover:border-brand-primary")}
              >
                Todos ({totalCount})
              </button>
              <button
                onClick={() => setFilterType('comuna')}
                className={cn("px-3 py-1.5 rounded-lg text-[9px] font-black uppercase transition-all flex items-center gap-1", filterType === 'comuna' ? "bg-orange-500 text-white shadow-sm" : "bg-white text-slate-500 border border-slate-200 hover:border-orange-300")}
              >
                <Home size={10} /> Comunas ({counts.comuna})
              </button>
              <button
                onClick={() => setFilterType('consejo')}
                className={cn("px-3 py-1.5 rounded-lg text-[9px] font-black uppercase transition-all flex items-center gap-1", filterType === 'consejo' ? "bg-blue-500 text-white shadow-sm" : "bg-white text-slate-500 border border-slate-200 hover:border-blue-300")}
              >
                <Users size={10} /> Consejos ({counts.consejo})
              </button>
              <button
                onClick={() => setFilterType('sala')}
                className={cn("px-3 py-1.5 rounded-lg text-[9px] font-black uppercase transition-all flex items-center gap-1", filterType === 'sala' ? "bg-emerald-500 text-white shadow-sm" : "bg-white text-slate-500 border border-slate-200 hover:border-emerald-300")}
              >
                <Wifi size={10} /> Salas ({counts.sala})
              </button>
            </div>
            
          </div>

          <AnimatePresence>
            {showFilters && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="overflow-hidden mt-3 pt-3 border-t border-slate-100"
              >
                <div className="flex flex-wrap gap-3 text-[9px] font-bold text-slate-500">
                  <span className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-orange-500" /> Comuna: {counts.comuna}</span>
                  <span className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-blue-500" /> Consejo: {counts.consejo}</span>
                  <span className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-emerald-500" /> Sala: {counts.sala}</span>
                  <span className="text-slate-300">|</span>
                  <span>Total ubicaciones georreferenciadas: {totalCount}</span>
                  {searchTerm && <span className="text-brand-primary">Filtrado por: "{searchTerm}"</span>}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <div className="h-125 w-full bg-slate-100 relative">
          {loading ? (
            <div className="absolute inset-0 flex items-center justify-center bg-white/80 z-10">
              <Loader2 className="animate-spin text-brand-primary" size={40} />
              <span className="ml-2 text-sm font-black">Cargando puntos geográficos...</span>
            </div>
          ) : (
            <MapComponent
              points={filteredPoints}
              center={mapCenter}
              zoom={zoom}
              onMove={(center: { lat: number; lng: number }) => setMapCenter(center)}
            />
          )}
          <div className="absolute bottom-4 right-4 bg-white/95 backdrop-blur-sm p-2 rounded-xl shadow-lg border border-gray-100 z-500 text-[8px] font-black uppercase">
            <div className="flex flex-col gap-1">
              <div className="flex items-center gap-2"><div className="w-4 h-0.5 border-t-2 border-dashed border-red-500" /> Límite Municipal</div>
              <div className="flex items-center gap-2"><div className="w-2 h-2 rounded-full bg-orange-500" /> Comuna</div>
              <div className="flex items-center gap-2"><div className="w-2 h-2 rounded-full bg-blue-500" /> Consejo Comunal</div>
              <div className="flex items-center gap-2"><div className="w-2 h-2 rounded-full bg-emerald-500" /> Sala de Autogobierno</div>
            </div>
          </div>
        </div>

        {!loading && filteredPoints.length === 0 && (
          <div className="p-8 text-center text-slate-400">
            No se encontraron ubicaciones con los filtros aplicados.
          </div>
        )}
      </div>
    </motion.div>
  );
};

// ==================== CENSO DINÁMICO MEJORADO (CORREGIDO) ====================
const PaginationSimple = ({ currentPage, totalPages, onPageChange }: { currentPage: number; totalPages: number; onPageChange: (page: number) => void }) => {
  if (totalPages <= 1) return null;
  return (
    <div className="px-6 py-4 bg-slate-50/50 border-t border-slate-100 flex items-center justify-between">
      <div className="text-xs text-slate-500">Página {currentPage} de {totalPages}</div>
      <div className="flex gap-1">
        <button onClick={() => onPageChange(currentPage - 1)} disabled={currentPage === 1} className="p-2 rounded-lg border border-slate-200 disabled:opacity-50"><ChevronLeft size={16} /></button>
        {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
          let pageNum = i + 1;
          if (totalPages > 5 && currentPage > 3) pageNum = currentPage - 2 + i;
          if (pageNum > totalPages) return null;
          return (
            <button key={pageNum} onClick={() => onPageChange(pageNum)} className={cn("w-8 h-8 rounded-lg text-xs font-bold", currentPage === pageNum ? "bg-brand-primary text-white" : "text-slate-600 hover:bg-brand-primary/10 border border-slate-200")}>
              {pageNum}
            </button>
          );
        })}
        <button onClick={() => onPageChange(currentPage + 1)} disabled={currentPage === totalPages} className="p-2 rounded-lg border border-slate-200 disabled:opacity-50"><ChevronRight size={16} /></button>
      </div>
    </div>
  );
};

// Componente para mostrar una tarjeta de grupo etario con desglose por sexo
const AgeGroupCard = ({ title, total, female, male, icon }: { title: string; total: number; female: number; male: number; icon?: React.ReactNode }) => (
  <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm hover:shadow-md transition-all">
    <div className="flex items-center justify-between mb-2">
      <div className="flex items-center gap-2">
        {icon && <div className="text-brand-primary">{icon}</div>}
        <h4 className="text-[9px] font-black text-slate-400 uppercase tracking-widest">{title}</h4>
      </div>
      <span className="text-lg font-black text-slate-800">{total}</span>
    </div>
    <div className="flex gap-3 mt-2 pt-2 border-t border-slate-50">
      <div className="flex-1 text-center">
        <span className="text-[8px] font-bold text-pink-500 block">♀ Mujeres</span>
        <span className="text-sm font-black text-slate-700">{female}</span>
      </div>
      <div className="flex-1 text-center">
        <span className="text-[8px] font-bold text-blue-500 block">♂ Hombres</span>
        <span className="text-sm font-black text-slate-700">{male}</span>
      </div>
    </div>
  </div>
);

// Componente para tarjeta de servicio
const ServiceCard = ({ icon, label, value, subtext, onClick, isClickable }: { icon: React.ReactNode; label: string; value: string | number; subtext?: string; onClick?: () => void; isClickable?: boolean }) => (
  <div 
    onClick={onClick}
    className={cn(
      "bg-white p-4 rounded-2xl border border-slate-100 shadow-sm flex items-start gap-3 transition-all",
      isClickable ? "cursor-pointer hover:shadow-md hover:border-brand-primary/50" : ""
    )}
  >
    <div className="w-8 h-8 rounded-xl bg-brand-primary/10 flex items-center justify-center text-brand-primary shrink-0">
      {icon}
    </div>
    <div>
      <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">{label}</p>
      <p className="text-lg font-black text-slate-800 leading-tight">{value}</p>
      {subtext && <p className="text-[8px] text-slate-400 mt-0.5">{subtext}</p>}
    </div>
  </div>
);

const CensoDinamico = () => {
  const [personas, setPersonas] = useState<Persona[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;
  
  // Estado para el modal de enfermedades
  const [showModal, setShowModal] = useState(false);
  const [enfermedadesList, setEnfermedadesList] = useState<{ nombre: string; cantidad: number }[]>([]);

  // Nuevos estados para servicios y demografía
  const [servicesStats, setServicesStats] = useState({
    bombonasGas: 0,
    totalCilindrosGas: 0,
    sistemaElectrico: 0,
    misiones: 0,
    casosSalud: 0,
  });

  const [demographics, setDemographics] = useState({
    infantes: { total: 0, female: 0, male: 0 },
    ninos: { total: 0, female: 0, male: 0 },
    jovenes: { total: 0, female: 0, male: 0 },
    adultos: { total: 0, female: 0, male: 0 },
    adultosMayores: { total: 0, female: 0, male: 0 },
  });

  // ==================== FUNCIONES AUXILIARES (CORREGIDAS) ====================
  
  /**
   * Determina si un valor es afirmativo (booleano, número 1, o string 'sí', 'si', 's', 'true', '1', 'x')
   */
  const esAfirmativo = (valor: any): boolean => {
    if (valor === undefined || valor === null) return false;
    if (typeof valor === 'boolean') return valor === true;
    if (typeof valor === 'number') return valor === 1;
    if (typeof valor === 'string') {
      const str = valor.toLowerCase().trim();
      return str === 'sí' || str === 'si' || str === 's' || str === 'true' || str === '1' || str === 'x';
    }
    return false;
  };

  /**
   * Verifica si el objeto `gas` indica que el hogar tiene bombonas de gas.
   * Soporta estructuras como: { bombona: true }, { kg_10: 2, kg_18: 1 }, o arrays de objetos.
   */
  const tieneGas = (gas: any): boolean => {
    if (!gas) return false;
    // Si es un objeto, buscar propiedades que indiquen posesión
    if (typeof gas === 'object' && !Array.isArray(gas)) {
      // Caso 1: propiedad "bombona" con valor true
      if (gas.bombona === true) return true;
      // Caso 2: alguna de las claves kg_10, kg_18, kg_43 con valor > 0
      if ((gas.kg_10 && gas.kg_10 > 0) || (gas.kg_18 && gas.kg_18 > 0) || (gas.kg_43 && gas.kg_43 > 0)) {
        return true;
      }
      // Caso 3: alguna propiedad con valor afirmativo (ej. "tiene": "sí")
      for (const key of Object.keys(gas)) {
        if (esAfirmativo(gas[key])) return true;
      }
      return false;
    }
    // Si es un array, verificar cada elemento
    if (Array.isArray(gas)) {
      return gas.some(item => tieneGas(item));
    }
    // Si es string, intentar parsear como JSON
    if (typeof gas === 'string') {
      try {
        const parsed = JSON.parse(gas);
        return tieneGas(parsed);
      } catch {
        // Si no es JSON, evaluar como texto afirmativo
        return esAfirmativo(gas);
      }
    }
    return false;
  };

  /**
   * Verifica si el objeto `sistema_electrico` indica que el hogar tiene servicio eléctrico.
   * Soporta estructuras como: { tiene: "sí" }, { estado: 1 }, o simplemente un objeto no vacío.
   */
  const tieneSistemaElectrico = (sistema: any): boolean => {
    if (!sistema) return false;
    if (typeof sistema === 'object' && !Array.isArray(sistema)) {
      // Si el objeto no está vacío y alguna propiedad es afirmativa, o simplemente existe, lo consideramos como que tiene electricidad.
      // Esto cubre casos donde el objeto se crea con cualquier contenido.
      const keys = Object.keys(sistema);
      if (keys.length === 0) return false;
      // Si tiene claves como "tiene", "estado", "servicio", etc., evaluar su valor
      for (const key of keys) {
        if (['tiene', 'estado', 'servicio', 'electricidad'].includes(key.toLowerCase())) {
          return esAfirmativo(sistema[key]);
        }
      }
      // Si no tiene esas claves pero el objeto no está vacío, asumimos que sí tiene sistema eléctrico
      return true;
    }
    if (Array.isArray(sistema)) {
      return sistema.some(item => tieneSistemaElectrico(item));
    }
    if (typeof sistema === 'string') {
      try {
        const parsed = JSON.parse(sistema);
        return tieneSistemaElectrico(parsed);
      } catch {
        return esAfirmativo(sistema);
      }
    }
    return false;
  };

  /**
   * Verifica si el objeto `misiones` indica que la familia participa en al menos una misión.
   * Soporta objetos con claves como "mision_1": "sí", o arrays de misiones.
   */
  const tieneMisiones = (misiones: any): boolean => {
    if (!misiones) return false;
    if (typeof misiones === 'object' && !Array.isArray(misiones)) {
      // Si alguna propiedad tiene valor afirmativo
      for (const key of Object.keys(misiones)) {
        if (esAfirmativo(misiones[key])) return true;
      }
      return false;
    }
    if (Array.isArray(misiones)) {
      return misiones.some(item => {
        if (typeof item === 'string') return esAfirmativo(item);
        if (typeof item === 'object') return tieneMisiones(item);
        return false;
      });
    }
    if (typeof misiones === 'string') {
      try {
        const parsed = JSON.parse(misiones);
        return tieneMisiones(parsed);
      } catch {
        return esAfirmativo(misiones);
      }
    }
    return false;
  };

  // ==================== CARGA DE DATOS ====================
  useEffect(() => {
    const fetchCensoData = async () => {
      setLoading(true);
      const allPeople: Persona[] = [];

      // Fichas principales - Seleccionar columnas reales
      const { data: fichas, error: errorFichas } = await supabase
        .from('censo_fichas')
        .select('id_ficha, nombres, apellidos, cedula, edad, sexo, enfermedad, cne, gas, cantidad_bombonas, sistema_electrico, misiones');
      
      if (errorFichas) {
        console.error('Error cargando fichas:', errorFichas);
        setLoading(false);
        return;
      }

      // Log para depuración (muestra las primeras 3 fichas)
      if (fichas && fichas.length > 0) {
       
      }

      if (fichas && fichas.length > 0) {
        let bombonasGasCount = 0;
        let totalCilindros = 0;
        let sistemaElectricoCount = 0;
        let misionesCount = 0;

        fichas.forEach((f: any) => {
          // Persona (jefe de familia)
          allPeople.push({
            id: f.id_ficha,
            tipo: 'ficha',
            nombres: f.nombres || '',
            apellidos: f.apellidos || '',
            cedula: f.cedula || '',
            edad: f.edad ?? 0,
            sexo: f.sexo || '',
            enfermedad: f.enfermedad || '',
            cne: f.cne || ''
          });

          // Servicios - usando las nuevas funciones
          if (tieneGas(f.gas)) {
            bombonasGasCount++;
            // Sumar cantidad de bombonas (si existe, sino 1)
            const cant = f.cantidad_bombonas && !isNaN(f.cantidad_bombonas) ? f.cantidad_bombonas : 1;
            totalCilindros += cant;
          }
          if (tieneSistemaElectrico(f.sistema_electrico)) {
            sistemaElectricoCount++;
          }
          if (tieneMisiones(f.misiones)) {
            misionesCount++;
          }
        });

        setServicesStats(prev => ({
          ...prev,
          bombonasGas: bombonasGasCount,
          totalCilindrosGas: totalCilindros,
          sistemaElectrico: sistemaElectricoCount,
          misiones: misionesCount,
        }));
      }

      // Familiares
      const { data: familiares, error: errorFamiliares } = await supabase
        .from('censo_familiares')
        .select('id_familiar, nombre_familiar, apellido_familiar, cedula, edad, sexo, enfermedad, cne');
      
      if (errorFamiliares) console.error('Error cargando familiares:', errorFamiliares);
      else if (familiares) {
        familiares.forEach((f: any) => {
          allPeople.push({
            id: f.id_familiar,
            tipo: 'familiar',
            nombres: f.nombre_familiar || '',
            apellidos: f.apellido_familiar || '',
            cedula: f.cedula || '',
            edad: f.edad ?? 0,
            sexo: f.sexo || '',
            enfermedad: f.enfermedad || '',
            cne: f.cne || ''
          });
        });
      }

      setPersonas(allPeople);
      setLoading(false);
    };

    fetchCensoData();
  }, []);

  // Cálculo de enfermedades (de todas las personas, excluyendo "no aplica")
  useEffect(() => {
    const enfermedadesMap = new Map<string, number>();
    let casosSaludCount = 0;
    personas.forEach(persona => {
      const enfRaw = persona.enfermedad?.trim();
      if (enfRaw && enfRaw.toLowerCase() !== 'no aplica' && enfRaw.toLowerCase() !== '') {
        casosSaludCount++;
        const nombreLimpio = enfRaw.charAt(0).toUpperCase() + enfRaw.slice(1).toLowerCase();
        enfermedadesMap.set(nombreLimpio, (enfermedadesMap.get(nombreLimpio) || 0) + 1);
      }
    });
    const lista = Array.from(enfermedadesMap.entries())
      .map(([nombre, cantidad]) => ({ nombre, cantidad }))
      .sort((a, b) => b.cantidad - a.cantidad);
    setEnfermedadesList(lista);
    setServicesStats(prev => ({ ...prev, casosSalud: casosSaludCount }));
  }, [personas]);

  // Calcular desglose demográfico por edad y sexo
  useEffect(() => {
    const groups = {
      infantes: { total: 0, female: 0, male: 0 },
      ninos: { total: 0, female: 0, male: 0 },
      jovenes: { total: 0, female: 0, male: 0 },
      adultos: { total: 0, female: 0, male: 0 },
      adultosMayores: { total: 0, female: 0, male: 0 },
    };

    personas.forEach(p => {
      const edad = p.edad;
      const sexo = p.sexo?.toLowerCase();
      const isFemale = sexo === 'femenino';
      const isMale = sexo === 'masculino';

      if (edad >= 0 && edad <= 5) {
        groups.infantes.total++;
        if (isFemale) groups.infantes.female++;
        else if (isMale) groups.infantes.male++;
      } else if (edad >= 6 && edad <= 14) {
        groups.ninos.total++;
        if (isFemale) groups.ninos.female++;
        else if (isMale) groups.ninos.male++;
      } else if (edad >= 15 && edad <= 29) {
        groups.jovenes.total++;
        if (isFemale) groups.jovenes.female++;
        else if (isMale) groups.jovenes.male++;
      } else if (edad >= 30 && edad <= 54) {
        groups.adultos.total++;
        if (isFemale) groups.adultos.female++;
        else if (isMale) groups.adultos.male++;
      } else if (edad >= 55) {
        groups.adultosMayores.total++;
        if (isFemale) groups.adultosMayores.female++;
        else if (isMale) groups.adultosMayores.male++;
      }
    });

    setDemographics(groups);
  }, [personas]);

  const openModal = () => setShowModal(true);
  const closeModal = () => setShowModal(false);

  // Filtrado
  const filteredPersonas = useMemo(() => {
    if (!searchTerm.trim()) return personas;
    const term = searchTerm.toLowerCase();
    return personas.filter(p => 
      p.nombres.toLowerCase().includes(term) ||
      p.apellidos.toLowerCase().includes(term) ||
      p.cedula.toLowerCase().includes(term) ||
      p.cne.toLowerCase().includes(term)
    );
  }, [personas, searchTerm]);

  const totalPages = Math.ceil(filteredPersonas.length / itemsPerPage);
  const paginatedPersonas = filteredPersonas.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  if (loading) {
    return (
      <div className="p-8 text-center">
        <Loader2 className="animate-spin text-brand-primary mx-auto" size={32} />
        <p className="text-xs font-bold text-slate-400 mt-2">Cargando datos del censo...</p>
      </div>
    );
  }

  return (
    <>
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="space-y-6">
        {/* Sección: Población por grupo etario y sexo */}
        <div className="bg-white rounded-3xl border border-slate-100 shadow-sm p-5">
          <div className="flex items-center gap-2 mb-4">
            <div className="w-8 h-8 rounded-xl bg-brand-primary/10 flex items-center justify-center text-brand-primary">
              <Users size={16} />
            </div>
            <div>
              <h3 className="text-[11px] font-black text-slate-800 uppercase tracking-tight">Población por grupo etario y sexo</h3>
              <p className="text-[8px] font-bold text-slate-400 uppercase tracking-wider">Desglose por rango de edad y género</p>
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-3">
            <AgeGroupCard title="Infantes (0-5 años)" total={demographics.infantes.total} female={demographics.infantes.female} male={demographics.infantes.male} icon={<Baby size={14} />} />
            <AgeGroupCard title="Niños (6-14 años)" total={demographics.ninos.total} female={demographics.ninos.female} male={demographics.ninos.male} icon={<Baby size={14} />} />
            <AgeGroupCard title="Jóvenes (15-29 años)" total={demographics.jovenes.total} female={demographics.jovenes.female} male={demographics.jovenes.male} icon={<Users size={14} />} />
            <AgeGroupCard title="Adultos (30-54 años)" total={demographics.adultos.total} female={demographics.adultos.female} male={demographics.adultos.male} icon={<User size={14} />} />
            <AgeGroupCard title="Adultos Mayores (55+)" total={demographics.adultosMayores.total} female={demographics.adultosMayores.female} male={demographics.adultosMayores.male} icon={<HeartPulse size={14} />} />
          </div>
        </div>

        {/* Sección: Servicios y Necesidades */}
        <div className="bg-white rounded-3xl border border-slate-100 shadow-sm p-5">
          <div className="flex items-center gap-2 mb-4">
            <div className="w-8 h-8 rounded-xl bg-brand-primary/10 flex items-center justify-center text-brand-primary">
              <Shield size={16} />
            </div>
            <div>
              <h3 className="text-[11px] font-black text-slate-800 uppercase tracking-tight">Servicios y Necesidades</h3>
              <p className="text-[8px] font-bold text-slate-400 uppercase tracking-wider">Registro de servicios básicos y apoyo social</p>
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
            <ServiceCard 
              icon={<Flame size={16} />} 
              label="Bombonas de Gas" 
              value={`${servicesStats.bombonasGas} hogares`} 
              subtext={`${servicesStats.totalCilindrosGas} cilindros en total`}
            />
            <ServiceCard 
              icon={<Plug size={16} />} 
              label="Sistema Eléctrico" 
              value={`${servicesStats.sistemaElectrico} hogares`} 
              subtext="Cuentan con servicio eléctrico"
            />
            <ServiceCard 
              icon={<Award size={16} />} 
              label="Misiones Sociales" 
              value={`${servicesStats.misiones} familias`} 
              subtext="Participan en al menos una misión"
            />
            <ServiceCard 
              icon={<HeartPulse size={16} />} 
              label="Casos de Salud" 
              value={`${servicesStats.casosSalud} personas`} 
              subtext="Con enfermedades registradas"
              onClick={openModal}
              isClickable={true}
            />
          </div>
        </div>

        {/* Tabla de personas */}
        <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden">
          <div className="p-6 border-b border-slate-50 flex items-center justify-between bg-slate-50/50">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
              <input
                type="text"
                placeholder="Buscar por nombre, apellido, cédula o CNE..."
                value={searchTerm}
                onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }}
                className="pl-10 pr-4 py-2 bg-white border border-slate-200 rounded-xl text-xs font-medium outline-none focus:ring-2 focus:ring-brand-primary/20 w-80"
              />
            </div>
            <div className="text-[9px] font-black text-slate-400 uppercase">
              Mostrando {paginatedPersonas.length} de {filteredPersonas.length} registros
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead className="bg-slate-50/30 border-b border-slate-100">
                <tr>
                  <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Nombre y Apellido</th>
                  <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Cédula</th>
                  <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Edad</th>
                  <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Sexo</th>
                  <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Enfermedad</th>
                  <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">CNE</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {paginatedPersonas.map((persona) => (
                  <tr key={`${persona.tipo}-${persona.id}`} className="hover:bg-slate-50/50 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        <User size={12} className="text-slate-400" />
                        <span className="text-xs font-bold text-slate-900 uppercase">{persona.nombres} {persona.apellidos}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="text-xs font-mono text-slate-700">{persona.cedula || '—'}</span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="text-xs font-bold text-slate-700">{persona.edad} años</span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={cn(
                        "px-2 py-1 rounded-full text-[9px] font-black uppercase",
                        persona.sexo?.toLowerCase() === 'masculino' ? "bg-blue-50 text-blue-600" : "bg-pink-50 text-pink-600"
                      )}>
                        {persona.sexo || '—'}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="max-w-50">
                        {persona.enfermedad && persona.enfermedad.toLowerCase() !== 'no aplica' && persona.enfermedad.trim() !== '' ? (
                          <span className="text-xs font-medium text-rose-600 bg-rose-50 px-2 py-1 rounded-lg inline-block">
                            {persona.enfermedad.length > 30 ? persona.enfermedad.substring(0, 30) + '…' : persona.enfermedad}
                          </span>
                        ) : (
                          <span className="text-xs text-slate-400 italic">No Aplica</span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="text-xs font-mono text-slate-600">{persona.cne || '—'}</span>
                    </td>
                  </tr>
                ))}
                {filteredPersonas.length === 0 && (
                  <tr>
                    <td colSpan={6} className="px-6 py-12 text-center text-slate-400">
                      No se encontraron personas en el censo
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          <PaginationSimple currentPage={currentPage} totalPages={totalPages} onPageChange={setCurrentPage} />
        </div>
      </motion.div>

      {/* MODAL DE ENFERMEDADES */}
      <AnimatePresence>
        {showModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4"
            onClick={closeModal}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white rounded-2xl shadow-2xl max-w-lg w-full max-h-[80vh] overflow-hidden"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-linear-to-r from-rose-50 to-white">
                <div className="flex items-center gap-3">
                  <HeartPulse className="text-rose-500" size={24} />
                  <h3 className="text-sm font-black text-slate-800 uppercase tracking-tight">Enfermedades registradas</h3>
                </div>
                <button
                  onClick={closeModal}
                  className="p-1 rounded-full hover:bg-slate-100 transition-colors"
                >
                  <X size={18} className="text-slate-400" />
                </button>
              </div>
              <div className="p-5 overflow-y-auto max-h-[60vh]">
                {enfermedadesList.length === 0 ? (
                  <p className="text-center text-slate-400 py-8">No hay enfermedades registradas</p>
                ) : (
                  <div className="space-y-2">
                    {enfermedadesList.map((item) => (
                      <div
                        key={item.nombre}
                        className="flex items-center justify-between p-3 rounded-xl bg-slate-50 hover:bg-slate-100 transition-colors"
                      >
                        <span className="text-xs font-bold text-slate-700 uppercase tracking-tight">
                          {item.nombre}
                        </span>
                        <span className="text-xs font-black bg-rose-100 text-rose-700 px-2 py-1 rounded-full">
                          {item.cantidad} {item.cantidad === 1 ? 'persona' : 'personas'}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
              <div className="p-4 border-t border-slate-100 bg-slate-50/50 flex justify-end">
                <button
                  onClick={closeModal}
                  className="px-4 py-2 bg-brand-primary text-white text-[10px] font-black uppercase rounded-lg hover:bg-brand-primary/90 transition-colors"
                >
                  Cerrar
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

// ==================== COMPONENTE PRINCIPAL ====================
export const Dimen3: React.FC<{ activeTab?: string }> = ({ activeTab = 'visor_gis' }) => {
  const [currentTab, setCurrentTab] = useState(activeTab);

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-black text-slate-900 uppercase tracking-tighter italic">Dimensión III: Territorio</h2>
        </div>
        <div className="flex bg-slate-100 p-1 rounded-xl gap-1">
          <TabButton active={currentTab === 'visor_gis'} onClick={() => setCurrentTab('visor_gis')} icon={MapPin} label="Visor GIS" />
          <TabButton active={currentTab === 'censo_dinamico'} onClick={() => setCurrentTab('censo_dinamico')} icon={Users} label="Censo Dinámico" />
        </div>
      </div>

      <AnimatePresence mode="wait">
        {currentTab === 'visor_gis' && <VisorGeografico key="gis" />}
        {currentTab === 'censo_dinamico' && <CensoDinamico key="censo" />}
      </AnimatePresence>
    </div>
  );
};

const TabButton = ({ active, onClick, icon: Icon, label }: any) => (
  <button
    onClick={onClick}
    className={cn(
      "flex items-center gap-2 px-4 py-2 rounded-lg text-[10px] font-black uppercase tracking-wider transition-all",
      active ? "bg-white text-brand-primary shadow-sm" : "text-slate-500 hover:text-slate-800"
    )}
  >
    <Icon size={14} />
    {label}
  </button>
);