'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import dynamic from 'next/dynamic';
import { 
  Map as MapIcon, 
  MapPin, 
  Search, 
  Filter, 
  Users,
  Building2,
  Globe,
  Database,
  Eye,
  XCircle,
  ChevronLeft,
  ChevronRight,
  Loader2,
  Home,
  Wifi,
  MapPinOff,
  UserCircle,
  Building,
  Landmark,
  FileText,
  Calendar,
  CreditCard,
  Link2,
  CheckCircle,
  Clock,
  AlertTriangle,
  Phone,
  Mail,
  User,
  ListChecks,
  Building as BuildingIcon,
  EyeOff,
  Eye as EyeIcon
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/app/lib/utils';
import { supabase } from '@/app/lib/supabaseClient';

// ==================== TIPOS ====================
interface PersonalTerritorial {
  id: string;
  nombre: string;
  apellido: string;
  unidad?: string;
  comite?: string;
  organizacionNombre?: string;
  organizacionTipo: 'consejo_comunal' | 'comuna' | 'sala_autogobierno';
  nivel: string;
  cedula?: string;
  telefono?: string;
  email?: string;
  tipo: 'responsable' | 'vocero' | 'entidad';
  entidadId?: number;
}

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

// ==================== FUNCIÓN PARA OBTENER URL FIRMADA ====================
const getSignedUrl = async (bucket: string, filePath: string): Promise<string | null> => {
  if (!filePath) return null;

  // Si es una URL pública de Supabase, extraer la ruta relativa
  if (filePath.startsWith('http')) {
    const match = filePath.match(/\/storage\/v1\/object\/public\/([^/]+)\/(.+)$/);
    if (match) {
      const bucketFromUrl = match[1];
      const relativePath = match[2];
      // Usar el bucket de la URL o el que se pasó como parámetro
      const bucketToUse = bucketFromUrl === 'documentos_comuna' ? 'documentos_comuna' :
                         bucketFromUrl === 'documentos_consejos' ? 'documentos_consejos' : bucket;
      try {
        const { data, error } = await supabase.storage
          .from(bucketToUse)
          .createSignedUrl(relativePath, 3600);
        if (error) {
          console.error('Error al firmar URL pública:', error);
          return null;
        }
        return data.signedUrl;
      } catch (err) {
        console.error('Error en getSignedUrl (pública):', err);
        return null;
      }
    }
    // Si no es de Supabase, devolver la URL tal cual
    return filePath;
  }

  // Si es ruta relativa, firmar con el bucket correspondiente
  try {
    const { data, error } = await supabase.storage
      .from(bucket)
      .createSignedUrl(filePath, 3600);
    if (error) {
      console.error(`Error firmando ${bucket}/${filePath}:`, error);
      return null;
    }
    return data.signedUrl;
  } catch (err) {
    console.error('Error en getSignedUrl (relativa):', err);
    return null;
  }
};

// Mapa Leaflet (dinámico)
const MUNICIPIO_CARRIZAL_GEOJSON: any = {
  type: "Feature",
  properties: { name: "Municipio Carrizal", description: "Límites del Municipio Carrizal, Estado Miranda" },
  geometry: {
    type: "Polygon",
    coordinates: [[
      [-66.9915, 10.3690], [-66.9830, 10.3710], [-66.9750, 10.3675], [-66.9690, 10.3600],
      [-67.0263, 10.3911], [-67.0241, 10.3900], [-67.0171, 10.3873], [-67.0160, 10.3829],
      [-67.0120, 10.3823], [-67.0092, 10.3840], [-67.0052, 10.3844], [-67.0032, 10.3844],
      [-67.0012, 10.3849], [-67.0000, 10.3856], [-66.9974, 10.3860], [-66.9958, 10.3835],
      [-66.9930, 10.3828], [-66.9922, 10.3822], [-66.9917, 10.3790]
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

// ==================== COMPONENTE PRINCIPAL ====================
export const MapaInteractivo = () => {
  const [activeTab, setActiveTab] = useState<'instancias' | 'voceros' | 'mapa'>('instancias');
  
  // Estados para las secciones de instancias y voceros
  const [loadingData, setLoadingData] = useState(true);
  const [instanciasData, setInstanciasData] = useState<PersonalTerritorial[]>([]);
  const [vocerosData, setVocerosData] = useState<PersonalTerritorial[]>([]);
  const [filtro, setFiltro] = useState('Todos');
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedPersonal, setSelectedPersonal] = useState<PersonalTerritorial | null>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [entidadDetalle, setEntidadDetalle] = useState<any>(null);
  const [loadingDetalle, setLoadingDetalle] = useState(false);
  const [showCuentaBancaria, setShowCuentaBancaria] = useState(false);
  const itemsPerPage = 10;

  // Estados para el mapa
  const [points, setPoints] = useState<LocationPoint[]>([]);
  const [sinUbicacion, setSinUbicacion] = useState<SinUbicacion[]>([]);
  const [mapLoading, setMapLoading] = useState(true);
  const [filterType, setFilterType] = useState<string>('all');
  const [searchTermMap, setSearchTermMap] = useState('');
  const [sinUbicacionPage, setSinUbicacionPage] = useState(1);
  const sinUbicacionItemsPerPage = 6;
  const mapCenter = { lat: 10.3496, lng: -66.9845 };
  const zoom = 13;

  // Estadísticas
  const [stats, setStats] = useState({
    totalEntidades: 0,
    totalComunas: 0,
    totalConsejos: 0,
    totalSalas: 0,
    totalVoceros: 0
  });

  // ========== CARGAR DETALLE DE ENTIDAD CON URLs FIRMADAS ==========
  const cargarDetalleEntidad = async (persona: PersonalTerritorial) => {
    setLoadingDetalle(true);
    setShowCuentaBancaria(false);
    try {
      let detalle = null;
      if (persona.organizacionTipo === 'consejo_comunal') {
        const { data } = await supabase
          .from('datos_consejo_comunal')
          .select('*')
          .eq('id_consejo', persona.entidadId)
          .single();
        
        // Responsables
        let responsablePrincipal = null;
        let responsableAuxiliar = null;
        if (data?.id_usuario) {
          const { data: perfil } = await supabase
            .from('perfil_usuario')
            .select('nombre, apellido, cedula, telefono, email')
            .eq('id_usuario', data.id_usuario)
            .single();
          responsablePrincipal = perfil;
        }
        if (data?.id_usuario_auxiliar) {
          const { data: perfil } = await supabase
            .from('perfil_usuario')
            .select('nombre, apellido, cedula, telefono, email')
            .eq('id_usuario', data.id_usuario_auxiliar)
            .single();
          responsableAuxiliar = perfil;
        }

        // Sector
        let sectorNombre = null;
        if (data?.id_sector) {
          const { data: sector } = await supabase
            .from('sectores')
            .select('nombre_sector')
            .eq('id_sector', data.id_sector)
            .single();
          sectorNombre = sector?.nombre_sector || null;
        }

        // 🔥 Obtener URLs firmadas para documentos
        const bucket = 'documentos_consejos';
        const signedUrls: Record<string, string> = {};
        const docs = [
          { key: 'acta_constitutiva', path: data.acta_constitutiva_url },
          { key: 'carta_fundacional', path: data.carta_fundacional_url },
          { key: 'rif', path: data.rif_url },
          { key: 'certificado_cuenta', path: data.certificado_cuenta_url },
          { key: 'mapa_imagen', path: data.mapa_imagen_url },
        ];
        for (const doc of docs) {
          if (doc.path) {
            const signed = await getSignedUrl(bucket, doc.path);
            if (signed) signedUrls[doc.key + '_signed'] = signed;
          }
        }

        detalle = {
          ...data,
          responsablePrincipal,
          responsableAuxiliar,
          sectorNombre,
          signedUrls,
        };
      } else if (persona.organizacionTipo === 'comuna') {
        const { data } = await supabase
          .from('datos_comuna')
          .select('*')
          .eq('id_comuna', persona.entidadId)
          .single();
        
        let responsablePrincipal = null;
        let responsableAuxiliar = null;
        if (data?.id_usuario) {
          const { data: perfil } = await supabase
            .from('perfil_usuario')
            .select('nombre, apellido, cedula, telefono, email')
            .eq('id_usuario', data.id_usuario)
            .single();
          responsablePrincipal = perfil;
        }
        if (data?.id_usuario_auxiliar) {
          const { data: perfil } = await supabase
            .from('perfil_usuario')
            .select('nombre, apellido, cedula, telefono, email')
            .eq('id_usuario', data.id_usuario_auxiliar)
            .single();
          responsableAuxiliar = perfil;
        }

        let sectorNombre = null;
        if (data?.id_sector) {
          const { data: sector } = await supabase
            .from('sectores')
            .select('nombre_sector')
            .eq('id_sector', data.id_sector)
            .single();
          sectorNombre = sector?.nombre_sector || null;
        }

        // 🔥 Obtener URLs firmadas para documentos
        const bucket = 'documentos_comuna';
        const signedUrls: Record<string, string> = {};
        const docs = [
          { key: 'acta_constitutiva', path: data.acta_constitutiva_url },
          { key: 'carta_fundacional', path: data.carta_fundacional_url },
          { key: 'rif', path: data.rif_url },
          { key: 'certificado_cuenta', path: data.certificado_cuenta_url },
          { key: 'mapa_imagen', path: data.mapa_imagen_url },
        ];
        for (const doc of docs) {
          if (doc.path) {
            const signed = await getSignedUrl(bucket, doc.path);
            if (signed) signedUrls[doc.key + '_signed'] = signed;
          }
        }

        detalle = {
          ...data,
          responsablePrincipal,
          responsableAuxiliar,
          sectorNombre,
          signedUrls,
        };
      } else if (persona.organizacionTipo === 'sala_autogobierno') {
        const { data } = await supabase
          .from('datos_sala_autogobierno')
          .select('*')
          .eq('id_sala', persona.entidadId)
          .single();
        
        let responsablePrincipal = null;
        let responsableAuxiliar = null;
        if (data?.id_usuario) {
          const { data: perfil } = await supabase
            .from('perfil_usuario')
            .select('nombre, apellido, cedula, telefono, email')
            .eq('id_usuario', data.id_usuario)
            .single();
          responsablePrincipal = perfil;
        }
        if (data?.id_usuario_auxiliar) {
          const { data: perfil } = await supabase
            .from('perfil_usuario')
            .select('nombre, apellido, cedula, telefono, email')
            .eq('id_usuario', data.id_usuario_auxiliar)
            .single();
          responsableAuxiliar = perfil;
        }

        let comunaNombre = null;
        let sectorNombre = null;
        if (data?.id_comuna) {
          const { data: comuna } = await supabase
            .from('datos_comuna')
            .select('nombre_comuna')
            .eq('id_comuna', data.id_comuna)
            .single();
          comunaNombre = comuna?.nombre_comuna || null;
        }
        if (data?.id_sector) {
          const { data: sector } = await supabase
            .from('sectores')
            .select('nombre_sector')
            .eq('id_sector', data.id_sector)
            .single();
          sectorNombre = sector?.nombre_sector || null;
        }

        // Salas no tienen documentos en estos buckets
        detalle = {
          ...data,
          responsablePrincipal,
          responsableAuxiliar,
          comunaNombre,
          sectorNombre,
          signedUrls: {},
        };
      }
      setEntidadDetalle(detalle);
    } catch (error) {
      console.error('Error cargando detalle:', error);
    } finally {
      setLoadingDetalle(false);
    }
  };

  // ========== CARGAR DATOS: INSTANCIAS Y VOCEROS POR SEPARADO ==========
  const cargarDatos = useCallback(async () => {
    setLoadingData(true);
    try {
      const instancias: PersonalTerritorial[] = [];
      const voceros: PersonalTerritorial[] = [];

      // 1. Cargar todas las comunas (instancias)
      const { data: comunas } = await supabase
        .from('datos_comuna')
        .select('id_comuna, nombre_comuna, codigo_situr');
      
      if (comunas) {
        comunas.forEach(comuna => {
          instancias.push({
            id: `comuna_${comuna.id_comuna}`,
            nombre: comuna.nombre_comuna,
            apellido: '',
            organizacionNombre: comuna.nombre_comuna,
            organizacionTipo: 'comuna',
            nivel: 'Comuna',
            tipo: 'entidad',
            entidadId: comuna.id_comuna,
            unidad: comuna.codigo_situr || '—'
          });
        });
        setStats(prev => ({ ...prev, totalComunas: comunas.length }));
      }

      // 2. Cargar todos los consejos comunales (instancias)
      const { data: consejos } = await supabase
        .from('datos_consejo_comunal')
        .select('id_consejo, nombre_consejo, codigo_situr');
      
      if (consejos) {
        consejos.forEach(consejo => {
          instancias.push({
            id: `consejo_${consejo.id_consejo}`,
            nombre: consejo.nombre_consejo,
            apellido: '',
            organizacionNombre: consejo.nombre_consejo,
            organizacionTipo: 'consejo_comunal',
            nivel: 'Consejo Comunal',
            tipo: 'entidad',
            entidadId: consejo.id_consejo,
            unidad: consejo.codigo_situr || '—'
          });
        });
        setStats(prev => ({ ...prev, totalConsejos: consejos.length }));
      }

      // 3. Cargar todas las salas de autogobierno (instancias)
      const { data: salas } = await supabase
        .from('datos_sala_autogobierno')
        .select('id_sala, nombre_sala');
      
      if (salas) {
        salas.forEach(sala => {
          instancias.push({
            id: `sala_${sala.id_sala}`,
            nombre: sala.nombre_sala,
            apellido: '',
            organizacionNombre: sala.nombre_sala,
            organizacionTipo: 'sala_autogobierno',
            nivel: 'Sala de Autogobierno',
            tipo: 'entidad',
            entidadId: sala.id_sala,
            unidad: '—'
          });
        });
        setStats(prev => ({ ...prev, totalSalas: salas.length }));
      }

      setStats(prev => ({
        ...prev,
        totalEntidades: instancias.length
      }));

      // ========== CARGAR VOCEROS ==========
      // 4. Responsables de consejos
      const { data: consejosConUsuarios } = await supabase
        .from('datos_consejo_comunal')
        .select('id_consejo, nombre_consejo, id_usuario, id_usuario_auxiliar')
        .or('id_usuario.not.is.null,id_usuario_auxiliar.not.is.null');
      
      const userIds = new Set<string>();
      consejosConUsuarios?.forEach(c => {
        if (c.id_usuario) userIds.add(c.id_usuario);
        if (c.id_usuario_auxiliar) userIds.add(c.id_usuario_auxiliar);
      });
      const perfilesMap = new Map();
      if (userIds.size) {
        const { data: perfiles } = await supabase
          .from('perfil_usuario')
          .select('id_usuario, nombre, apellido, cedula, telefono, email')
          .in('id_usuario', Array.from(userIds));
        if (perfiles) perfiles.forEach(p => perfilesMap.set(p.id_usuario, p));
      }

      consejosConUsuarios?.forEach(item => {
        if (item.id_usuario) {
          const perfil = perfilesMap.get(item.id_usuario);
          if (perfil) {
            voceros.push({
              id: perfil.id_usuario,
              nombre: perfil.nombre || '',
              apellido: perfil.apellido || '',
              unidad: 'Responsable Principal',
              organizacionNombre: item.nombre_consejo,
              organizacionTipo: 'consejo_comunal',
              nivel: 'Vocero CC',
              cedula: perfil.cedula,
              telefono: perfil.telefono,
              email: perfil.email,
              tipo: 'responsable'
            });
          }
        }
        if (item.id_usuario_auxiliar) {
          const perfil = perfilesMap.get(item.id_usuario_auxiliar);
          if (perfil) {
            voceros.push({
              id: perfil.id_usuario,
              nombre: perfil.nombre || '',
              apellido: perfil.apellido || '',
              unidad: 'Responsable Auxiliar',
              organizacionNombre: item.nombre_consejo,
              organizacionTipo: 'consejo_comunal',
              nivel: 'Vocero CC',
              cedula: perfil.cedula,
              telefono: perfil.telefono,
              email: perfil.email,
              tipo: 'responsable'
            });
          }
        }
      });

      // 5. Responsables de comunas
      const { data: comunasConUsuarios } = await supabase
        .from('datos_comuna')
        .select('id_comuna, nombre_comuna, id_usuario, id_usuario_auxiliar')
        .or('id_usuario.not.is.null,id_usuario_auxiliar.not.is.null');
      
      const userIdsComuna = new Set<string>();
      comunasConUsuarios?.forEach(c => {
        if (c.id_usuario) userIdsComuna.add(c.id_usuario);
        if (c.id_usuario_auxiliar) userIdsComuna.add(c.id_usuario_auxiliar);
      });
      const perfilesComunaMap = new Map();
      if (userIdsComuna.size) {
        const { data: perfiles } = await supabase
          .from('perfil_usuario')
          .select('id_usuario, nombre, apellido, cedula, telefono, email')
          .in('id_usuario', Array.from(userIdsComuna));
        if (perfiles) perfiles.forEach(p => perfilesComunaMap.set(p.id_usuario, p));
      }

      comunasConUsuarios?.forEach(item => {
        if (item.id_usuario) {
          const perfil = perfilesComunaMap.get(item.id_usuario);
          if (perfil) {
            voceros.push({
              id: perfil.id_usuario,
              nombre: perfil.nombre || '',
              apellido: perfil.apellido || '',
              unidad: 'Responsable Principal',
              organizacionNombre: item.nombre_comuna,
              organizacionTipo: 'comuna',
              nivel: 'Vocero Comuna',
              cedula: perfil.cedula,
              telefono: perfil.telefono,
              email: perfil.email,
              tipo: 'responsable'
            });
          }
        }
        if (item.id_usuario_auxiliar) {
          const perfil = perfilesComunaMap.get(item.id_usuario_auxiliar);
          if (perfil) {
            voceros.push({
              id: perfil.id_usuario,
              nombre: perfil.nombre || '',
              apellido: perfil.apellido || '',
              unidad: 'Responsable Auxiliar',
              organizacionNombre: item.nombre_comuna,
              organizacionTipo: 'comuna',
              nivel: 'Vocero Comuna',
              cedula: perfil.cedula,
              telefono: perfil.telefono,
              email: perfil.email,
              tipo: 'responsable'
            });
          }
        }
      });

      // 6. Voceros de consejos (tabla voceros)
      const { data: vocerosConsejo } = await supabase
        .from('voceros')
        .select('id_vocero, nombre_completo, cedula, unidad, comite, telefono, id_consejo');
      
      if (vocerosConsejo && vocerosConsejo.length) {
        const consejosMap = new Map();
        if (consejos) consejos.forEach(c => consejosMap.set(c.id_consejo, c.nombre_consejo));
        
        vocerosConsejo.forEach(v => {
          const nombreCompleto = v.nombre_completo?.split(' ') || [];
          const nombre = nombreCompleto[0] || '';
          const apellido = nombreCompleto.slice(1).join(' ') || '';
          const consejoNombre = consejosMap.get(v.id_consejo) || '';
          voceros.push({
            id: `vocero_${v.id_vocero}`,
            nombre,
            apellido,
            unidad: v.unidad || 'Vocería',
            comite: v.comite || '—',
            organizacionNombre: consejoNombre,
            organizacionTipo: 'consejo_comunal',
            nivel: 'Vocería',
            cedula: v.cedula,
            telefono: v.telefono,
            tipo: 'vocero'
          });
        });
      }

      // 7. Voceros de comunas (tabla voceros_comuna)
      const { data: vocerosComuna } = await supabase
        .from('voceros_comuna')
        .select('id_voceroc, nombre_completo, cedula, unidad, comite, telefono, id_comuna');
      
      if (vocerosComuna && vocerosComuna.length) {
        const comunasMap = new Map();
        if (comunas) comunas.forEach(c => comunasMap.set(c.id_comuna, c.nombre_comuna));
        
        vocerosComuna.forEach(v => {
          const nombreCompleto = v.nombre_completo?.split(' ') || [];
          const nombre = nombreCompleto[0] || '';
          const apellido = nombreCompleto.slice(1).join(' ') || '';
          const comunaNombre = comunasMap.get(v.id_comuna) || '';
          voceros.push({
            id: `vocero_comuna_${v.id_voceroc}`,
            nombre,
            apellido,
            unidad: v.unidad || 'Vocería',
            comite: v.comite || '—',
            organizacionNombre: comunaNombre,
            organizacionTipo: 'comuna',
            nivel: 'Vocería',
            cedula: v.cedula,
            telefono: v.telefono,
            tipo: 'vocero'
          });
        });
      }

      setStats(prev => ({
        ...prev,
        totalVoceros: voceros.length
      }));

      setInstanciasData(instancias);
      setVocerosData(voceros);
    } catch (error) {
      console.error('Error cargando datos:', error);
    } finally {
      setLoadingData(false);
    }
  }, []);

  // ========== CARGAR PUNTOS DEL MAPA ==========
  const cargarPuntosMapa = useCallback(async () => {
    setMapLoading(true);
    const allPoints: LocationPoint[] = [];
    const sinUbicacionList: SinUbicacion[] = [];

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
  }, []);

  useEffect(() => {
    if (activeTab === 'instancias' || activeTab === 'voceros') {
      if (instanciasData.length === 0 && vocerosData.length === 0) cargarDatos();
    }
    if (activeTab === 'mapa') cargarPuntosMapa();
  }, [activeTab, cargarDatos, cargarPuntosMapa, instanciasData.length, vocerosData.length]);

  // ========== LÓGICA DE FILTRADO Y PAGINACIÓN ==========
  const getDataSegunTab = () => {
    if (activeTab === 'instancias') return instanciasData;
    else return vocerosData;
  };

  const dataFiltrada = useMemo(() => {
    let filtered = getDataSegunTab();
    if (filtro !== 'Todos') filtered = filtered.filter(p => p.nivel === filtro);
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(p => 
        `${p.nombre} ${p.apellido}`.toLowerCase().includes(term) ||
        (p.organizacionNombre && p.organizacionNombre.toLowerCase().includes(term)) ||
        (p.nivel && p.nivel.toLowerCase().includes(term)) ||
        (p.cedula && p.cedula.includes(term))
      );
    }
    return filtered;
  }, [instanciasData, vocerosData, filtro, searchTerm, activeTab]);

  const totalPages = Math.ceil(dataFiltrada.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const currentData = dataFiltrada.slice(startIndex, startIndex + itemsPerPage);

  const goToPage = (page: number) => {
    if (page >= 1 && page <= totalPages) setCurrentPage(page);
  };

  const getNivelColor = (nivel: string) => {
    switch(nivel) {
      case 'Comuna': return 'bg-orange-100 text-orange-700';
      case 'Consejo Comunal': return 'bg-blue-100 text-blue-700';
      case 'Sala de Autogobierno': return 'bg-emerald-100 text-emerald-700';
      case 'Vocero CC': return 'bg-indigo-100 text-indigo-700';
      case 'Vocero Comuna': return 'bg-green-100 text-green-700';
      case 'Vocero Sala': return 'bg-purple-100 text-purple-700';
      case 'Vocería': return 'bg-amber-100 text-amber-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  const getNivelIcon = (nivel: string) => {
    switch(nivel) {
      case 'Comuna': return <Globe size={12} />;
      case 'Consejo Comunal': return <Building2 size={12} />;
      case 'Sala de Autogobierno': return <Landmark size={12} />;
      default: return <UserCircle size={12} />;
    }
  };

  const getOrganizacionTipoTexto = (tipo: string) => {
    switch(tipo) {
      case 'consejo_comunal': return 'Consejo Comunal';
      case 'comuna': return 'Comuna';
      case 'sala_autogobierno': return 'Sala de Autogobierno';
      default: return tipo;
    }
  };

  const getCargoTexto = (persona: PersonalTerritorial) => {
    if (persona.tipo === 'entidad') return '';
    let texto = persona.unidad || 'Gestión';
    if (persona.comite && persona.comite !== '—' && persona.comite !== '') {
      texto += ` - ${persona.comite}`;
    }
    if (persona.organizacionNombre) {
      texto += ` - ${getOrganizacionTipoTexto(persona.organizacionTipo)}: ${persona.organizacionNombre}`;
    }
    return texto;
  };

  // Lógica para el mapa de puntos
  const filteredPoints = useMemo(() => {
    let filtered = points;
    if (filterType !== 'all') filtered = filtered.filter(p => p.type === filterType);
    if (searchTermMap.trim()) filtered = filtered.filter(p => p.name.toLowerCase().includes(searchTermMap.toLowerCase()));
    return filtered;
  }, [points, filterType, searchTermMap]);

  const countsPoints = {
    comuna: points.filter(p => p.type === 'comuna').length,
    consejo: points.filter(p => p.type === 'consejo').length,
    sala: points.filter(p => p.type === 'sala').length,
  };

  const totalSinUbicacionPages = Math.ceil(sinUbicacion.length / sinUbicacionItemsPerPage);
  const sinUbicacionStart = (sinUbicacionPage - 1) * sinUbicacionItemsPerPage;
  const currentSinUbicacion = sinUbicacion.slice(sinUbicacionStart, sinUbicacionStart + sinUbicacionItemsPerPage);

  // Función para abrir modal de detalle
  const handleOpenDetail = async (persona: PersonalTerritorial) => {
    setSelectedPersonal(persona);
    if (persona.tipo === 'entidad') {
      await cargarDetalleEntidad(persona);
    } else {
      setEntidadDetalle(null);
    }
    setShowDetailModal(true);
  };

  // ========== RENDER ==========
  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-black text-slate-900 uppercase tracking-tighter italic">Liderazgo territorial</h2>
        </div>
      </div>

      {/* Pestañas */}
      <div className="flex bg-slate-100 p-1 rounded-xl w-fit gap-1 flex-wrap">
        <button
          onClick={() => setActiveTab('instancias')}
          className={cn(
            "flex items-center gap-2 px-5 py-2 rounded-lg text-[10px] font-black uppercase tracking-wider transition-all",
            activeTab === 'instancias' ? "bg-white text-brand-primary shadow-sm" : "text-slate-500 hover:text-brand-primary"
          )}
        >
          <BuildingIcon size={14} /> Instancias
        </button>
        <button
          onClick={() => setActiveTab('voceros')}
          className={cn(
            "flex items-center gap-2 px-5 py-2 rounded-lg text-[10px] font-black uppercase tracking-wider transition-all",
            activeTab === 'voceros' ? "bg-white text-brand-primary shadow-sm" : "text-slate-500 hover:text-brand-primary"
          )}
        >
          <Users size={14} /> Voceros
        </button>
        <button
          onClick={() => setActiveTab('mapa')}
          className={cn(
            "flex items-center gap-2 px-5 py-2 rounded-lg text-[10px] font-black uppercase tracking-wider transition-all",
            activeTab === 'mapa' ? "bg-white text-brand-primary shadow-sm" : "text-slate-500 hover:text-brand-primary"
          )}
        >
          <MapIcon size={14} /> Mapa Real
        </button>
      </div>

      <AnimatePresence mode="wait">
        {/* SECCIÓN INSTANCIAS */}
        {activeTab === 'instancias' && (
          <motion.div
            key="instancias"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="space-y-6"
          >
            {/* Estadísticas */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {[
                { label: 'Total Entidades', value: stats.totalEntidades.toString(), icon: <Building className="text-brand-primary" size={16} />, sub: 'Comunas/Consejos/Salas' },
                { label: 'Comunas', value: stats.totalComunas.toString(), icon: <Globe className="text-orange-500" size={16} />, sub: 'Unidades territoriales' },
                { label: 'Consejos Comunales', value: stats.totalConsejos.toString(), icon: <Building2 className="text-blue-500" size={16} />, sub: 'Organización base' },
                { label: 'Salas Autogobierno', value: stats.totalSalas.toString(), icon: <Landmark className="text-emerald-500" size={16} />, sub: 'Espacios de participación' },
              ].map((stat, i) => (
                <div key={i} className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm hover:shadow-md transition-all">
                  <div className="flex items-center justify-between mb-2">
                    <div className="p-2 bg-gray-50 rounded-lg">{stat.icon}</div>
                    <span className="text-xl font-black text-gray-800">{stat.value}</span>
                  </div>
                  <p className="text-[8px] font-black text-gray-400 uppercase tracking-widest">{stat.label}</p>
                  <p className="text-[7px] text-gray-400 italic">{stat.sub}</p>
                </div>
              ))}
            </div>

            {/* Filtros */}
            <div className="bg-white p-3 rounded-lg shadow-sm border border-gray-100 flex flex-wrap items-center gap-3">
              <div className="flex-1 min-w-50 relative">
                <Search className="absolute left-2 top-1/2 -translate-y-1/2 text-gray-400" size={12} />
                <input 
                  type="text" 
                  placeholder="Buscar por nombre o código SITUR..." 
                  className="w-full pl-8 pr-3 py-1.5 bg-gray-50 border border-gray-200 rounded-lg text-[10px] font-medium outline-none focus:ring-2 focus:ring-brand-primary"
                  value={searchTerm}
                  onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }}
                />
              </div>
              <div className="flex items-center gap-1">
                <Filter size={12} className="text-gray-400" />
                <select 
                  className="bg-gray-50 border border-gray-200 rounded-lg px-3 py-1.5 text-[9px] font-bold text-gray-600 outline-none"
                  value={filtro}
                  onChange={(e) => { setFiltro(e.target.value); setCurrentPage(1); }}
                >
                  <option value="Todos">TODOS</option>
                  <option value="Comuna">COMUNAS</option>
                  <option value="Consejo Comunal">CONSEJOS COMUNALES</option>
                  <option value="Sala de Autogobierno">SALAS AUTOGOBIERNO</option>
                </select>
              </div>
            </div>

            {/* Tabla de instancias */}
            <div className="bg-white rounded-xl shadow-lg border border-gray-100 overflow-x-auto">
              {loadingData ? (
                <div className="flex justify-center py-12"><Loader2 className="animate-spin text-brand-primary" size={28} /></div>
              ) : dataFiltrada.length === 0 ? (
                <div className="text-center py-12 text-gray-400">No hay instancias registradas</div>
              ) : (
                <table className="w-full text-left border-collapse min-w-[600px]">
                  <thead>
                    <tr className="bg-brand-primary text-white uppercase text-[8px] tracking-[0.2em]">
                      <th className="p-3 font-black">Nombre</th>
                      <th className="p-3 font-black">Código SITUR</th>
                      <th className="p-3 font-black">Tipo</th>
                      <th className="p-3 font-black text-center">Acciones</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {currentData.map((persona) => (
                      <tr key={persona.id} className="hover:bg-teal-50/30 transition-colors cursor-pointer" onClick={() => handleOpenDetail(persona)}>
                        <td className="p-3">
                          <div className="flex items-center gap-2">
                            <div className={cn(
                              "w-7 h-7 rounded-full flex items-center justify-center font-bold text-[10px] border",
                              persona.tipo === 'entidad' ? "bg-brand-primary/10 text-brand-primary border-brand-primary/20" : "bg-gray-100 text-gray-600 border-gray-200"
                            )}>
                              {getNivelIcon(persona.nivel)}
                            </div>
                            <span className="text-[10px] font-semibold text-gray-800">{persona.nombre}</span>
                          </div>
                        </td>
                        <td className="p-3">
                          <span className="text-[9px] font-mono font-bold text-gray-600">{persona.unidad || '—'}</span>
                        </td>
                        <td className="p-3">
                          <span className={`text-[7px] font-black px-2 py-0.5 rounded-full uppercase flex items-center gap-1 w-fit ${getNivelColor(persona.nivel)}`}>
                            {getNivelIcon(persona.nivel)} {persona.nivel}
                          </span>
                        </td>
                        <td className="p-3 text-center">
                          <button 
                            className="p-1.5 bg-gray-50 text-gray-500 rounded-lg hover:bg-brand-primary hover:text-white transition border border-gray-100"
                            onClick={(e) => { e.stopPropagation(); handleOpenDetail(persona); }}
                          >
                            <Eye size={12} />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
              {totalPages > 1 && (
                <div className="flex items-center justify-between p-3 border-t border-gray-100">
                  <p className="text-[8px] font-medium text-gray-500">Mostrando {startIndex+1} - {Math.min(startIndex+itemsPerPage, dataFiltrada.length)} de {dataFiltrada.length}</p>
                  <div className="flex gap-1">
                    <button onClick={() => goToPage(currentPage-1)} disabled={currentPage===1} className={cn("p-1 rounded-lg border border-gray-200", currentPage===1 ? "opacity-40 cursor-not-allowed" : "hover:bg-gray-50")}><ChevronLeft size={12} /></button>
                    <button onClick={() => goToPage(currentPage+1)} disabled={currentPage===totalPages} className={cn("p-1 rounded-lg border border-gray-200", currentPage===totalPages ? "opacity-40 cursor-not-allowed" : "hover:bg-gray-50")}><ChevronRight size={12} /></button>
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        )}

        {/* SECCIÓN VOCEROS */}
        {activeTab === 'voceros' && (
          <motion.div
            key="voceros"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="space-y-6"
          >
            {/* Estadísticas */}
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              {[
                { label: 'Voceros', value: stats.totalVoceros.toString(), icon: <Users className="text-amber-500" size={16} />, sub: 'Registrados' },
                { label: 'Responsables', value: vocerosData.filter(p => p.tipo === 'responsable').length.toString(), icon: <UserCircle className="text-indigo-500" size={16} />, sub: 'De entidades' },
                { label: 'Voceros / Voceras', value: vocerosData.filter(p => p.tipo === 'vocero').length.toString(), icon: <Users className="text-purple-500" size={16} />, sub: 'De organización' },
              ].map((stat, i) => (
                <div key={i} className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm hover:shadow-md transition-all">
                  <div className="flex items-center justify-between mb-2">
                    <div className="p-2 bg-gray-50 rounded-lg">{stat.icon}</div>
                    <span className="text-xl font-black text-gray-800">{stat.value}</span>
                  </div>
                  <p className="text-[8px] font-black text-gray-400 uppercase tracking-widest">{stat.label}</p>
                  <p className="text-[7px] text-gray-400 italic">{stat.sub}</p>
                </div>
              ))}
            </div>

            {/* Filtros */}
            <div className="bg-white p-3 rounded-lg shadow-sm border border-gray-100 flex flex-wrap items-center gap-3">
              <div className="flex-1 min-w-50 relative">
                <Search className="absolute left-2 top-1/2 -translate-y-1/2 text-gray-400" size={12} />
                <input 
                  type="text" 
                  placeholder="Buscar por nombre, cédula o unidad..." 
                  className="w-full pl-8 pr-3 py-1.5 bg-gray-50 border border-gray-200 rounded-lg text-[10px] font-medium outline-none focus:ring-2 focus:ring-brand-primary"
                  value={searchTerm}
                  onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }}
                />
              </div>
              <div className="flex items-center gap-1">
                <Filter size={12} className="text-gray-400" />
                <select 
                  className="bg-gray-50 border border-gray-200 rounded-lg px-3 py-1.5 text-[9px] font-bold text-gray-600 outline-none"
                  value={filtro}
                  onChange={(e) => { setFiltro(e.target.value); setCurrentPage(1); }}
                >
                  <option value="Todos">TODOS</option>
                  <option value="Vocero CC">VOCEROS CC</option>
                  <option value="Vocero Comuna">VOCEROS COMUNA</option>
                  <option value="Vocero Sala">VOCEROS SALA</option>
                  <option value="Vocería">VOCERÍA</option>
                </select>
              </div>
            </div>

            {/* Tabla de voceros */}
            <div className="bg-white rounded-xl shadow-lg border border-gray-100 overflow-x-auto">
              {loadingData ? (
                <div className="flex justify-center py-12"><Loader2 className="animate-spin text-brand-primary" size={28} /></div>
              ) : dataFiltrada.length === 0 ? (
                <div className="text-center py-12 text-gray-400">No hay voceros registrados</div>
              ) : (
                <table className="w-full text-left border-collapse min-w-[600px]">
                  <thead>
                    <tr className="bg-brand-primary text-white uppercase text-[8px] tracking-[0.2em]">
                      <th className="p-3 font-black">Vocero / a</th>
                      <th className="p-3 font-black">Cédula</th>
                      <th className="p-3 font-black">Unidad</th>
                      <th className="p-3 font-black">Comité</th>
                      <th className="p-3 font-black">Teléfono</th>
                      <th className="p-3 font-black text-center">Acciones</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {currentData.map((persona) => (
                      <tr key={persona.id} className="hover:bg-teal-50/30 transition-colors cursor-pointer" onClick={() => handleOpenDetail(persona)}>
                        <td className="p-3">
                          <div className="flex items-center gap-2">
                            <div className={cn(
                              "w-7 h-7 rounded-full flex items-center justify-center font-bold text-[10px] border",
                              persona.tipo === 'responsable' ? "bg-indigo-100 text-indigo-600 border-indigo-200" : "bg-gray-100 text-gray-600 border-gray-200"
                            )}>
                              {(persona.nombre.charAt(0) || '?')}
                            </div>
                            <span className="text-[10px] font-semibold text-gray-800">{persona.nombre} {persona.apellido}</span>
                          </div>
                        </td>
                        <td className="p-3">
                          <span className="text-[9px] font-mono font-bold text-gray-600">{persona.cedula || '—'}</span>
                        </td>
                        <td className="p-3">
                          <span className="text-[9px] font-medium text-gray-700">{persona.unidad || '—'}</span>
                        </td>
                        <td className="p-3">
                          <span className="text-[9px] font-medium text-gray-700">{persona.comite || '—'}</span>
                        </td>
                        <td className="p-3">
                          <span className="text-[9px] font-medium text-gray-700">{persona.telefono || '—'}</span>
                        </td>
                        <td className="p-3 text-center">
                          <button 
                            className="p-1.5 bg-gray-50 text-gray-500 rounded-lg hover:bg-brand-primary hover:text-white transition border border-gray-100"
                            onClick={(e) => { e.stopPropagation(); handleOpenDetail(persona); }}
                          >
                            <Eye size={12} />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
              {totalPages > 1 && (
                <div className="flex items-center justify-between p-3 border-t border-gray-100">
                  <p className="text-[8px] font-medium text-gray-500">Mostrando {startIndex+1} - {Math.min(startIndex+itemsPerPage, dataFiltrada.length)} de {dataFiltrada.length}</p>
                  <div className="flex gap-1">
                    <button onClick={() => goToPage(currentPage-1)} disabled={currentPage===1} className={cn("p-1 rounded-lg border border-gray-200", currentPage===1 ? "opacity-40 cursor-not-allowed" : "hover:bg-gray-50")}><ChevronLeft size={12} /></button>
                    <button onClick={() => goToPage(currentPage+1)} disabled={currentPage===totalPages} className={cn("p-1 rounded-lg border border-gray-200", currentPage===totalPages ? "opacity-40 cursor-not-allowed" : "hover:bg-gray-50")}><ChevronRight size={12} /></button>
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        )}

        {/* SECCIÓN MAPA REAL */}
        {activeTab === 'mapa' && (
          <motion.div
            key="mapa"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="space-y-6"
          >
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
              <div className="lg:col-span-2 bg-white rounded-lg shadow-md overflow-hidden">
                <div className="p-3 bg-gray-50 border-b border-gray-200 flex flex-wrap items-center justify-between gap-2">
                  <div className="flex gap-2">
                    <button onClick={() => setFilterType('all')} className={cn("px-2 py-1 rounded-lg text-[8px] font-black uppercase", filterType === 'all' ? "bg-brand-primary text-white" : "bg-white text-slate-500 border border-slate-200")}>Todos ({points.length})</button>
                    <button onClick={() => setFilterType('comuna')} className={cn("px-2 py-1 rounded-lg text-[8px] font-black uppercase flex items-center gap-1", filterType === 'comuna' ? "bg-orange-500 text-white" : "bg-white text-slate-500 border border-slate-200")}><Home size={10} /> Comunas ({countsPoints.comuna})</button>
                    <button onClick={() => setFilterType('consejo')} className={cn("px-2 py-1 rounded-lg text-[8px] font-black uppercase flex items-center gap-1", filterType === 'consejo' ? "bg-blue-500 text-white" : "bg-white text-slate-500 border border-slate-200")}><Users size={10} /> Consejos ({countsPoints.consejo})</button>
                    <button onClick={() => setFilterType('sala')} className={cn("px-2 py-1 rounded-lg text-[8px] font-black uppercase flex items-center gap-1", filterType === 'sala' ? "bg-emerald-500 text-white" : "bg-white text-slate-500 border border-slate-200")}><Wifi size={10} /> Salas ({countsPoints.sala})</button>
                  </div>
                  <div className="relative">
                    <Search className="absolute left-2 top-1/2 -translate-y-1/2 text-slate-400" size={12} />
                    <input type="text" placeholder="Buscar..." value={searchTermMap} onChange={(e) => setSearchTermMap(e.target.value)} className="pl-7 pr-2 py-1 bg-white border border-slate-200 rounded-lg text-[10px] outline-none focus:ring-1 focus:ring-brand-primary w-40" />
                  </div>
                </div>
                <div className="h-96 w-full bg-slate-100 relative">
                  {mapLoading ? (
                    <div className="absolute inset-0 flex items-center justify-center"><Loader2 className="animate-spin text-brand-primary" size={28} /></div>
                  ) : (
                    <MapComponent points={filteredPoints} center={mapCenter} zoom={zoom} />
                  )}
                  <div className="absolute bottom-3 right-3 bg-white/95 backdrop-blur-sm p-2 rounded-lg shadow-md border border-gray-100 text-[7px] font-black uppercase">
                    <div className="flex flex-col gap-1">
                      <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full bg-orange-500" /> Comuna</div>
                      <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full bg-blue-500" /> Consejo Comunal</div>
                      <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full bg-emerald-500" /> Sala Autogobierno</div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <h3 className="font-black text-gray-800 uppercase text-[10px] tracking-widest">Instancias sin ubicación</h3>
                {sinUbicacion.length === 0 ? (
                  <div className="bg-white p-4 rounded-lg text-center text-gray-400"><MapPinOff size={24} className="mx-auto mb-2 opacity-30" /><p className="text-[9px]">Todas las entidades tienen ubicación registrada</p></div>
                ) : (
                  <>
                    <div className="space-y-2 max-h-96 overflow-y-auto">
                      {currentSinUbicacion.map((item) => (
                        <div key={`${item.tipo}-${item.id}`} className="bg-white p-2.5 rounded-lg border-l-3 border-orange-500 shadow-sm">
                          <div className="flex justify-between items-start mb-0.5">
                            <span className="font-black text-gray-800 uppercase text-[9px]">{item.nombre}</span>
                            <span className={`text-[6px] font-black px-1 py-0.5 rounded uppercase ${item.criticidad === 'Alta' ? 'bg-red-50 text-red-600' : item.criticidad === 'Media' ? 'bg-orange-50 text-orange-600' : 'bg-yellow-50 text-yellow-600'}`}>{item.criticidad}</span>
                          </div>
                          <p className="text-[7px] text-gray-500 italic">{item.tipo === 'comuna' ? 'Comuna' : item.tipo === 'consejo' ? 'Consejo Comunal' : 'Sala de Autogobierno'}</p>
                          <p className="text-[6px] text-gray-400 mt-0.5">Causa: {item.razon}</p>
                        </div>
                      ))}
                    </div>
                    {totalSinUbicacionPages > 1 && (
                      <div className="flex items-center justify-between pt-2">
                        <button onClick={() => setSinUbicacionPage(p => Math.max(1, p-1))} disabled={sinUbicacionPage===1} className={cn("p-1 rounded-lg border border-gray-200", sinUbicacionPage===1 ? "opacity-40" : "hover:bg-gray-50")}><ChevronLeft size={14} /></button>
                        <span className="text-[8px] text-gray-500">{sinUbicacionPage} / {totalSinUbicacionPages}</span>
                        <button onClick={() => setSinUbicacionPage(p => Math.min(totalSinUbicacionPages, p+1))} disabled={sinUbicacionPage===totalSinUbicacionPages} className={cn("p-1 rounded-lg border border-gray-200", sinUbicacionPage===totalSinUbicacionPages ? "opacity-40" : "hover:bg-gray-50")}><ChevronRight size={14} /></button>
                      </div>
                    )}
                    <div className="p-3 bg-brand-primary rounded-lg text-white">
                      <p className="text-[8px] font-bold opacity-70 uppercase mb-0.5">Análisis de Brecha</p>
                      <p className="text-lg font-black italic tracking-tighter">{Math.round((sinUbicacion.length / (points.length + sinUbicacion.length)) * 100)}%</p>
                      <p className="text-[6px] leading-tight opacity-80 mt-0.5 uppercase font-bold tracking-widest">Del territorio sin ubicación registrada</p>
                    </div>
                  </>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ========== MODAL DE DETALLE (INSTANCIAS) CON URLs FIRMADAS ========== */}
      <AnimatePresence>
        {showDetailModal && selectedPersonal && (
          <div className="fixed inset-0 z-100 flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={() => setShowDetailModal(false)} />
            <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.9 }} className="relative w-[90%] max-w-2xl bg-white rounded-xl shadow-2xl overflow-hidden max-h-[90vh] overflow-y-auto">
              <div className="p-4 border-b border-gray-100 flex items-center justify-between bg-gradient-to-r from-brand-primary to-[#006d64] sticky top-0">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center">
                    {selectedPersonal.tipo === 'entidad' ? <Building className="h-5 w-5 text-white" /> : <Users className="h-5 w-5 text-white" />}
                  </div>
                  <div>
                    <h4 className="text-base font-black text-white uppercase tracking-tighter">
                      {selectedPersonal.tipo === 'entidad' ? selectedPersonal.nombre : `${selectedPersonal.nombre} ${selectedPersonal.apellido}`}
                    </h4>
                    <p className="text-[9px] text-white/70 font-bold uppercase tracking-widest">{selectedPersonal.nivel}</p>
                  </div>
                </div>
                <button onClick={() => setShowDetailModal(false)} className="p-1.5 rounded-lg bg-white/10 text-white hover:bg-white/20 transition-colors">
                  <XCircle size={18} />
                </button>
              </div>
              
              <div className="p-5">
                {loadingDetalle ? (
                  <div className="flex justify-center py-12"><Loader2 className="animate-spin text-brand-primary" size={28} /></div>
                ) : selectedPersonal.tipo === 'entidad' && entidadDetalle ? (
                  // Detalle de entidad mejorado con URLs firmadas
                  <div className="space-y-5">
                    {/* Información General */}
                    <div>
                      <h5 className="text-[10px] font-black text-brand-primary uppercase tracking-wider mb-3 flex items-center gap-2">
                        <FileText size={12} /> Información General
                      </h5>
                      <div className="bg-gray-50 rounded-xl p-4 space-y-3">
                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <p className="text-[8px] font-black text-gray-400 uppercase">Nombre</p>
                            <p className="text-xs font-bold text-gray-800">{entidadDetalle.nombre_consejo || entidadDetalle.nombre_comuna || entidadDetalle.nombre_sala}</p>
                          </div>
                          <div>
                            <p className="text-[8px] font-black text-gray-400 uppercase">RIF</p>
                            <p className="text-xs font-bold text-gray-800">{entidadDetalle.rif || 'No registrado'}</p>
                          </div>
                          <div>
                            <p className="text-[8px] font-black text-gray-400 uppercase">Código SITUR</p>
                            <p className="text-xs font-bold text-gray-800">{entidadDetalle.codigo_situr || 'No registrado'}</p>
                          </div>
                          <div>
                            <p className="text-[8px] font-black text-gray-400 uppercase">Cuenta Bancaria</p>
                            <div className="flex items-center gap-2">
                              <p className="text-xs font-bold text-gray-800">
                                {showCuentaBancaria ? (entidadDetalle.cuenta_bancaria || 'No registrada') : '••••••••'}
                              </p>
                              <button 
                                onClick={() => setShowCuentaBancaria(!showCuentaBancaria)}
                                className="p-0.5 rounded-lg hover:bg-gray-200"
                              >
                                {showCuentaBancaria ? <EyeOff size={12} className="text-gray-500" /> : <EyeIcon size={12} className="text-gray-500" />}
                              </button>
                            </div>
                          </div>
                          {entidadDetalle.estatus && (
                            <div>
                              <p className="text-[8px] font-black text-gray-400 uppercase">Estatus</p>
                              <p className="text-xs font-bold text-gray-800 capitalize">{entidadDetalle.estatus}</p>
                            </div>
                          )}
                          {entidadDetalle.estatus_validacion && (
                            <div>
                              <p className="text-[8px] font-black text-gray-400 uppercase">Validación</p>
                              <span className={cn(
                                "text-[9px] font-black px-2 py-0.5 rounded-full",
                                entidadDetalle.estatus_validacion === 'VALIDADO' ? "bg-emerald-100 text-emerald-700" : 
                                entidadDetalle.estatus_validacion === 'RECHAZADO' ? "bg-red-100 text-red-700" : "bg-amber-100 text-amber-700"
                              )}>
                                {entidadDetalle.estatus_validacion}
                              </span>
                            </div>
                          )}
                        </div>
                        {entidadDetalle.ubicacion && (
                          <div>
                            <p className="text-[8px] font-black text-gray-400 uppercase">Ubicación</p>
                            <p className="text-xs font-medium text-gray-700">{entidadDetalle.ubicacion}</p>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Responsables */}
                    <div>
                      <h5 className="text-[10px] font-black text-brand-primary uppercase tracking-wider mb-3 flex items-center gap-2">
                        <User size={12} /> Responsables
                      </h5>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        <div className="bg-gray-50 rounded-xl p-3">
                          <p className="text-[8px] font-black text-gray-400 uppercase">Principal</p>
                          {entidadDetalle.responsablePrincipal ? (
                            <div className="mt-1">
                              <p className="text-xs font-bold text-gray-800">{entidadDetalle.responsablePrincipal.nombre} {entidadDetalle.responsablePrincipal.apellido}</p>
                              {entidadDetalle.responsablePrincipal.cedula && <p className="text-[9px] text-gray-500">CI: {entidadDetalle.responsablePrincipal.cedula}</p>}
                              {entidadDetalle.responsablePrincipal.telefono && <p className="text-[9px] text-gray-500">Tel: {entidadDetalle.responsablePrincipal.telefono}</p>}
                              {entidadDetalle.responsablePrincipal.email && <p className="text-[9px] text-gray-500">Email: {entidadDetalle.responsablePrincipal.email}</p>}
                            </div>
                          ) : (
                            <p className="text-xs text-gray-400">No asignado</p>
                          )}
                        </div>
                        <div className="bg-gray-50 rounded-xl p-3">
                          <p className="text-[8px] font-black text-gray-400 uppercase">Auxiliar</p>
                          {entidadDetalle.responsableAuxiliar ? (
                            <div className="mt-1">
                              <p className="text-xs font-bold text-gray-800">{entidadDetalle.responsableAuxiliar.nombre} {entidadDetalle.responsableAuxiliar.apellido}</p>
                              {entidadDetalle.responsableAuxiliar.cedula && <p className="text-[9px] text-gray-500">CI: {entidadDetalle.responsableAuxiliar.cedula}</p>}
                              {entidadDetalle.responsableAuxiliar.telefono && <p className="text-[9px] text-gray-500">Tel: {entidadDetalle.responsableAuxiliar.telefono}</p>}
                              {entidadDetalle.responsableAuxiliar.email && <p className="text-[9px] text-gray-500">Email: {entidadDetalle.responsableAuxiliar.email}</p>}
                            </div>
                          ) : (
                            <p className="text-xs text-gray-400">No asignado</p>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Sector / Comuna (para salas) */}
                    {entidadDetalle.sectorNombre && (
                      <div>
                        <h5 className="text-[10px] font-black text-brand-primary uppercase tracking-wider mb-3 flex items-center gap-2">
                          <MapPin size={12} /> Sector
                        </h5>
                        <div className="bg-gray-50 rounded-xl p-3">
                          <p className="text-xs font-bold text-gray-800">{entidadDetalle.sectorNombre}</p>
                          {entidadDetalle.comunaNombre && <p className="text-[9px] text-gray-500">Comuna: {entidadDetalle.comunaNombre}</p>}
                        </div>
                      </div>
                    )}

                    {/* Fechas de Vencimiento */}
                    {(entidadDetalle.fecha_vencimiento_voceros || entidadDetalle.fecha_vencimiento_rif) && (
                      <div>
                        <h5 className="text-[10px] font-black text-brand-primary uppercase tracking-wider mb-3 flex items-center gap-2">
                          <Calendar size={12} /> Fechas de Vencimiento
                        </h5>
                        <div className="grid grid-cols-2 gap-3">
                          {entidadDetalle.fecha_vencimiento_voceros && (
                            <div className="bg-gray-50 rounded-xl p-3">
                              <p className="text-[8px] font-black text-gray-400 uppercase">Voceros</p>
                              <p className="text-xs font-bold text-gray-800">{new Date(entidadDetalle.fecha_vencimiento_voceros).toLocaleDateString()}</p>
                            </div>
                          )}
                          {entidadDetalle.fecha_vencimiento_rif && (
                            <div className="bg-gray-50 rounded-xl p-3">
                              <p className="text-[8px] font-black text-gray-400 uppercase">RIF</p>
                              <p className="text-xs font-bold text-gray-800">{new Date(entidadDetalle.fecha_vencimiento_rif).toLocaleDateString()}</p>
                            </div>
                          )}
                        </div>
                      </div>
                    )}

                    {/* 🔥 Documentos con URLs firmadas */}
                    {(() => {
                      const documentos = [];
                      const docConfigs = [
                        { key: 'acta_constitutiva', label: 'Acta Constitutiva', url: entidadDetalle.acta_constitutiva_url },
                        { key: 'carta_fundacional', label: 'Carta Fundacional', url: entidadDetalle.carta_fundacional_url },
                        { key: 'rif', label: 'Documento RIF', url: entidadDetalle.rif_url },
                        { key: 'certificado_cuenta', label: 'Certificado de Cuenta', url: entidadDetalle.certificado_cuenta_url },
                        { key: 'mapa_imagen', label: 'Mapa', url: entidadDetalle.mapa_imagen_url },
                      ];
                      for (const doc of docConfigs) {
                        if (doc.url) {
                          const signedUrl = entidadDetalle.signedUrls?.[doc.key + '_signed'] || doc.url;
                          documentos.push({ label: doc.label, url: signedUrl });
                        }
                      }
                      if (documentos.length > 0) {
                        return (
                          <div>
                            <h5 className="text-[10px] font-black text-brand-primary uppercase tracking-wider mb-3 flex items-center gap-2">
                              <Link2 size={12} /> Documentos Adjuntos
                            </h5>
                            <div className="flex flex-wrap gap-2">
                              {documentos.map((doc, idx) => (
                                <a key={idx} href={doc.url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-gray-100 hover:bg-brand-primary/10 rounded-lg text-[9px] font-bold text-gray-700 hover:text-brand-primary transition-colors">
                                  <FileText size={10} /> {doc.label}
                                </a>
                              ))}
                            </div>
                          </div>
                        );
                      }
                      return null;
                    })()}

                    {entidadDetalle.motivo_rechazo && (
                      <div className="bg-red-50 border border-red-200 rounded-xl p-3">
                        <p className="text-[8px] font-black text-red-600 uppercase flex items-center gap-1">
                          <AlertTriangle size={10} /> Motivo de Rechazo
                        </p>
                        <p className="text-xs text-red-700 mt-1">{entidadDetalle.motivo_rechazo}</p>
                      </div>
                    )}

                    {entidadDetalle.created_at && (
                      <div className="text-center pt-2">
                        <p className="text-[8px] text-gray-400">Registrado el {new Date(entidadDetalle.created_at).toLocaleDateString()}</p>
                      </div>
                    )}
                  </div>
                ) : (
                  // Detalle de vocero (sin cambios)
                  <div className="space-y-5">
                    <div>
                      <h5 className="text-[10px] font-black text-brand-primary uppercase tracking-wider mb-3 flex items-center gap-2">
                        <User size={12} /> Datos Personales
                      </h5>
                      <div className="grid grid-cols-2 gap-3">
                        <div className="bg-gray-50 rounded-xl p-3">
                          <p className="text-[8px] font-black text-gray-400 uppercase">Cédula</p>
                          <p className="text-xs font-bold text-gray-800">{selectedPersonal.cedula || 'No registrada'}</p>
                        </div>
                        <div className="bg-gray-50 rounded-xl p-3">
                          <p className="text-[8px] font-black text-gray-400 uppercase">Teléfono</p>
                          <p className="text-xs font-bold text-gray-800">{selectedPersonal.telefono || 'No registrado'}</p>
                        </div>
                        {selectedPersonal.email && (
                          <div className="col-span-2 bg-gray-50 rounded-xl p-3">
                            <p className="text-[8px] font-black text-gray-400 uppercase">Email</p>
                            <p className="text-xs font-bold text-gray-800">{selectedPersonal.email}</p>
                          </div>
                        )}
                      </div>
                    </div>

                    <div>
                      <h5 className="text-[10px] font-black text-brand-primary uppercase tracking-wider mb-3 flex items-center gap-2">
                        <Building2 size={12} /> Datos de la Organización
                      </h5>
                      <div className="space-y-3">
                        {selectedPersonal.unidad && (
                          <div className="bg-gray-50 rounded-xl p-3">
                            <p className="text-[8px] font-black text-gray-400 uppercase">Unidad</p>
                            <p className="text-xs font-bold text-gray-800">{selectedPersonal.unidad}</p>
                          </div>
                        )}
                        {selectedPersonal.comite && selectedPersonal.comite !== '—' && (
                          <div className="bg-gray-50 rounded-xl p-3">
                            <p className="text-[8px] font-black text-gray-400 uppercase">Comité</p>
                            <p className="text-xs font-bold text-gray-800">{selectedPersonal.comite}</p>
                          </div>
                        )}
                        {selectedPersonal.organizacionNombre && (
                          <div className="bg-gray-50 rounded-xl p-3">
                            <p className="text-[8px] font-black text-gray-400 uppercase">Organización</p>
                            <p className="text-xs font-bold text-gray-800">{getOrganizacionTipoTexto(selectedPersonal.organizacionTipo)}: {selectedPersonal.organizacionNombre}</p>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                )}
                
                <div className="flex gap-3 pt-5 mt-3 border-t border-gray-100">
                  <button onClick={() => setShowDetailModal(false)} className="flex-1 py-2.5 rounded-lg bg-gray-100 text-gray-700 text-[9px] font-black uppercase tracking-widest hover:bg-gray-200 transition-colors">
                    Cerrar
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};