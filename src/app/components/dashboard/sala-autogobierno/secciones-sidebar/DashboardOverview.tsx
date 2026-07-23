"use client";

import React, { useState, useEffect } from "react";
import dynamic from "next/dynamic";
import { 
  Users, Activity, Map as MapIcon, Search, Filter, 
  Zap, ArrowUpRight, TrendingUp, AlertCircle, FileCheck,
  Loader2, Building2, Briefcase, UserCheck, Laptop, GraduationCap,
  Home, LocateFixed, Target, Layers, Compass, MapPin, Shield
} from "lucide-react";
import { motion } from "framer-motion";
import { cn } from "@/app/lib/utils";
import { supabase } from "@/app/lib/supabaseClient";
import { useAuth } from "@/context/AuthContext";
import "leaflet/dist/leaflet.css";

// ==================== TIPOS ====================
interface ConsejoResumen {
  id_consejo: number;
  nombre_consejo: string;
  total_voceros: number;
  total_nudos: number;
  total_proyectos: number;
  total_habitantes: number;
}

interface DashboardOverviewProps {
  user: any;
  onNavigate: (section: string) => void;
  openModal: (type: 'form' | 'detail' | 'success', title: string, data?: any) => void;
}

// ==================== COMPONENTE DEL MAPA MEJORADO ====================
interface ConsejoUbicacion {
  id_consejo: number;
  nombre_consejo: string;
  latitud: number;
  longitud: number;
}

interface ComunaUbicacion {
  id_comuna: number;
  nombre_comuna: string;
  latitud: number;
  longitud: number;
}

interface SalaUbicacion {
  latitud: number;
  longitud: number;
}

const MapContent = ({ 
  coordinates, 
  consejosUbicacion, 
  comunaUbicacion, 
  salaUbicacion,
  hasLocation 
}: { 
  coordinates: { lat: number; lng: number };
  consejosUbicacion: ConsejoUbicacion[];
  comunaUbicacion: ComunaUbicacion | null;
  salaUbicacion: SalaUbicacion | null;
  hasLocation: boolean;
}) => {
  const { MapContainer, TileLayer, Marker, Popup, Polygon, useMap } = require('react-leaflet');
  const L = require('leaflet');
  
  useEffect(() => {
    delete L.Icon.Default.prototype._getIconUrl;
    L.Icon.Default.mergeOptions({
      iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
      iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
      shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
    });
  }, [L]);

  const salaIcon = L.divIcon({
    html: `<div style="background-color: rgba(16, 185, 129, 0.6); width: 32px; height: 32px; border-radius: 50%; display: flex; align-items: center; justify-content: center; box-shadow: 0 0 10px 2px rgba(16, 185, 129, 0.5), 0 2px 4px rgba(0,0,0,0.2); border: 2px solid white;"></div>`,
    iconSize: [32, 32],
    className: 'custom-marker-sala',
    popupAnchor: [0, -16]
  });

  const comunaIcon = L.divIcon({
    html: `<div style="background-color: rgba(59, 130, 246, 0.6); width: 36px; height: 36px; border-radius: 50%; display: flex; align-items: center; justify-content: center; box-shadow: 0 0 12px 3px rgba(59, 130, 246, 0.5), 0 2px 4px rgba(0,0,0,0.2); border: 2px solid white;"></div>`,
    iconSize: [36, 36],
    className: 'custom-marker-comuna',
    popupAnchor: [0, -18]
  });

  const consejoIcon = L.divIcon({
    html: `<div style="background-color: rgba(139, 92, 246, 0.6); width: 28px; height: 28px; border-radius: 50%; display: flex; align-items: center; justify-content: center; box-shadow: 0 0 8px 2px rgba(139, 92, 246, 0.5), 0 2px 4px rgba(0,0,0,0.2); border: 2px solid white;"></div>`,
    iconSize: [28, 28],
    className: 'custom-marker-consejo',
    popupAnchor: [0, -14]
  });

  const poligonalCoords: [number, number][] = [
    [coordinates.lat + 0.0005, coordinates.lng + 0.0005],
    [coordinates.lat - 0.0005, coordinates.lng + 0.0005],
    [coordinates.lat - 0.0005, coordinates.lng - 0.0005],
    [coordinates.lat + 0.0005, coordinates.lng - 0.0005],
  ];

  return (
    <MapContainer center={[coordinates.lat, coordinates.lng]} zoom={13} style={{ height: '100%', width: '100%' }} scrollWheelZoom={false}>
      <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
      
      {salaUbicacion && (
        <Marker position={[salaUbicacion.latitud, salaUbicacion.longitud]} icon={salaIcon}>
          <Popup>Sala de Autogobierno</Popup>
        </Marker>
      )}
      
      {comunaUbicacion && (
        <Marker position={[comunaUbicacion.latitud, comunaUbicacion.longitud]} icon={comunaIcon}>
          <Popup>Comuna: {comunaUbicacion.nombre_comuna}</Popup>
        </Marker>
      )}
      
      {consejosUbicacion.map((consejo) => (
        <Marker key={consejo.id_consejo} position={[consejo.latitud, consejo.longitud]} icon={consejoIcon}>
          <Popup>{consejo.nombre_consejo}</Popup>
        </Marker>
      ))}
      
      {hasLocation && (
        <Polygon pathOptions={{ color: '#E11D48', weight: 2, fillOpacity: 0.1, dashArray: '5,5' }} positions={poligonalCoords} />
      )}
    </MapContainer>
  );
};

const LeafletMap = dynamic(() => Promise.resolve(MapContent), { 
  ssr: false, 
  loading: () => <div className="h-full w-full flex items-center justify-center bg-slate-50"><Loader2 className="animate-spin text-brand-primary h-6 w-6" /></div> 
});

// ==================== COMPONENTE PRINCIPAL ====================
export const DashboardOverview: React.FC<DashboardOverviewProps> = ({ user, onNavigate, openModal }) => {
  const { user: authUser } = useAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [comunaId, setComunaId] = useState<number | null>(null);
  const [comunaNombre, setComunaNombre] = useState<string>("");
  const [noSala, setNoSala] = useState(false);
  
  // Datos agregados
  const [totalHabitantes, setTotalHabitantes] = useState(0);
  const [totalFamilias, setTotalFamilias] = useState(0);
  const [totalConsejos, setTotalConsejos] = useState(0);
  const [consejosConVoceros, setConsejosConVoceros] = useState(0);
  const [totalVoceros, setTotalVoceros] = useState(0);
  const [totalProyectos, setTotalProyectos] = useState(0);
  const [totalNudos, setTotalNudos] = useState(0);
  const [totalAdultosMayores, setTotalAdultosMayores] = useState(0);
  const [totalDiagnosticosDigitales, setTotalDiagnosticosDigitales] = useState(0);
  const [totalPostulaciones, setTotalPostulaciones] = useState(0);
  
  const [consejosSinVoceros, setConsejosSinVoceros] = useState(0);
  const [consejosDetalle, setConsejosDetalle] = useState<ConsejoResumen[]>([]);
  
  // Datos para el mapa
  const [mapCoordinates, setMapCoordinates] = useState({ lat: 10.3496, lng: -66.9845 });
  const [hasLocation, setHasLocation] = useState(false);
  const [consejosUbicacion, setConsejosUbicacion] = useState<ConsejoUbicacion[]>([]);
  const [comunaUbicacion, setComunaUbicacion] = useState<ComunaUbicacion | null>(null);
  const [salaUbicacion, setSalaUbicacion] = useState<SalaUbicacion | null>(null);
  const [loadingMap, setLoadingMap] = useState(true);

  useEffect(() => {
    if (!authUser?.id) return;

    const fetchData = async () => {
      setLoading(true);
      setError(null);
      setNoSala(false);
      try {
        // 0. Verificar si el usuario tiene sala registrada
        const { data: salaData, error: salaError } = await supabase
          .from('datos_sala_autogobierno')
          .select('id_comuna')
          .eq('id_usuario', authUser.id)
          .maybeSingle();

        if (salaError) {
          console.error('Error obteniendo sala:', salaError);
          setNoSala(true);
          setLoading(false);
          return;
        }

        // Si no tiene sala o id_comuna es null, marcamos noSala y seguimos (sin cargar datos)
        if (!salaData || salaData.id_comuna === null || salaData.id_comuna === undefined) {
          setNoSala(true);
          setLoading(false);
          return;
        }

        const idComuna = salaData.id_comuna;
        setComunaId(idComuna);

        // 1. Obtener nombre de la comuna
        const { data: comunaInfo, error: comunaInfoError } = await supabase
          .from('datos_comuna')
          .select('nombre_comuna')
          .eq('id_comuna', idComuna)
          .maybeSingle();

        if (comunaInfoError) {
          console.error('Error obteniendo nombre comuna:', comunaInfoError);
        } else if (comunaInfo) {
          setComunaNombre(comunaInfo.nombre_comuna);
        }

        // 2. Obtener sectores
        const { data: sectores, error: sectoresError } = await supabase
          .from('sectores')
          .select('id_sector')
          .eq('id_datos_comuna', idComuna)
          .eq('activo', true);

        if (sectoresError) {
          throw new Error(`Error en sectores: ${sectoresError.message}`);
        }

        if (!sectores || sectores.length === 0) {
          setLoading(false);
          return;
        }

        const sectorIds = sectores.map(s => s.id_sector);

        // 3. Obtener consejos
        const { data: consejosData, error: consejosError } = await supabase
          .from('datos_consejo_comunal')
          .select('id_consejo, nombre_consejo')
          .in('id_sector', sectorIds);

        if (consejosError) {
          throw new Error(`Error al obtener consejos: ${consejosError.message}`);
        }

        if (!consejosData || consejosData.length === 0) {
          setLoading(false);
          return;
        }

        const consejoIds = consejosData.map(c => c.id_consejo);
        setTotalConsejos(consejoIds.length);

        // 4. Obtener fichas de censo
        const { data: fichasData, error: fichasError } = await supabase
          .from('censo_fichas')
          .select('id_ficha, id_consejo')
          .in('id_consejo', consejoIds);

        if (fichasError) console.error("Error cargando censo_fichas:", fichasError);

        const fichas = fichasData || [];
        const totalFichas = fichas.length;

        // 5. Obtener familiares
        let totalFamiliares = 0;
        if (fichas.length > 0) {
          const fichaIds = fichas.map(f => f.id_ficha);
          const { data: familiaresData, error: familiaresError } = await supabase
            .from('censo_familiares')
            .select('id_ficha')
            .in('id_ficha', fichaIds);
          if (familiaresError) console.error("Error cargando familiares:", familiaresError);
          else totalFamiliares = familiaresData?.length || 0;
        }

        const habitantes = totalFichas + totalFamiliares;
        setTotalHabitantes(habitantes);
        setTotalFamilias(totalFichas);

        // 6. Obtener voceros
        let vocerosData = null;
        try {
          const result = await supabase
            .from('voceros')
            .select('id_consejo')
            .in('id_consejo', consejoIds);
          
          if (result.error) {
            console.error("Error en consulta de voceros:", result.error);
          } else {
            vocerosData = result.data;
          }
        } catch (err) {
          console.error("Excepción al cargar voceros:", err);
        }

        const vocerosPorConsejo = new Map<number, number>();
        let totalVocerosCount = 0;

        if (vocerosData && Array.isArray(vocerosData)) {
          vocerosData.forEach(v => {
            if (v && v.id_consejo) {
              const count = vocerosPorConsejo.get(v.id_consejo) || 0;
              vocerosPorConsejo.set(v.id_consejo, count + 1);
              totalVocerosCount++;
            }
          });
        }

        setTotalVoceros(totalVocerosCount);
        setConsejosConVoceros(vocerosPorConsejo.size);
        setConsejosSinVoceros(totalConsejos - vocerosPorConsejo.size);

        // 7. Nudos críticos
        let nudosData = [];
        try {
          const result = await supabase
            .from('nudos_criticos')
            .select('id_nudo')
            .in('id_consejo', consejoIds);
          
          if (!result.error && result.data) {
            nudosData = result.data;
          }
        } catch (err) {
          console.error("Excepción cargando nudos:", err);
        }
        setTotalNudos(nudosData?.length || 0);

        // 8. Proyectos
        let proyectosData = [];
        try {
          const result = await supabase
            .from('proyectos')
            .select('id_proyecto')
            .in('id_consejo', consejoIds);
          
          if (!result.error && result.data) {
            proyectosData = result.data;
          }
        } catch (err) {
          console.error("Excepción cargando proyectos:", err);
        }
        setTotalProyectos(proyectosData?.length || 0);

        // Otras métricas
        try {
          const { data: adultosData } = await supabase
            .from('adultos_mayores')
            .select('id_adulto')
            .eq('id_comuna', idComuna);
          setTotalAdultosMayores(adultosData?.length || 0);
        } catch (err) {
          console.error("Error cargando adultos mayores:", err);
        }

        try {
          const { data: digitalData } = await supabase
            .from('analfabetismo_digital')
            .select('id_registro')
            .eq('id_comuna', idComuna);
          setTotalDiagnosticosDigitales(digitalData?.length || 0);
        } catch (err) {
          console.error("Error cargando diagnósticos digitales:", err);
        }

        try {
          const { data: postulacionesData } = await supabase
            .from('postulaciones_sala')
            .select('id_postulacion')
            .eq('id_comuna', idComuna);
          setTotalPostulaciones(postulacionesData?.length || 0);
        } catch (err) {
          console.error("Error cargando postulaciones:", err);
        }

        // Detalle de consejos
        const consejosConDetalle: ConsejoResumen[] = consejosData.map(c => ({
          id_consejo: c.id_consejo,
          nombre_consejo: c.nombre_consejo,
          total_voceros: vocerosPorConsejo.get(c.id_consejo) || 0,
          total_nudos: 0,
          total_proyectos: 0,
          total_habitantes: 0
        }));
        setConsejosDetalle(consejosConDetalle);

        // 9. Cargar ubicaciones para el mapa
        await loadMapData(idComuna, consejoIds, consejosData);

      } catch (err: any) {
        console.error("Error en DashboardOverview:", err);
        setError(err.message || "Error al cargar los datos");
      } finally {
        setLoading(false);
      }
    };

    const loadMapData = async (idComuna: number, consejoIds: number[], consejosData: any[]) => {
      setLoadingMap(true);
      try {
        // Obtener ubicación de la comuna
        const { data: ubicComuna } = await supabase
          .from('ubicacion_comuna')
          .select('latitud, longitud')
          .eq('id_comuna', idComuna)
          .maybeSingle();
        
        if (ubicComuna) {
          setComunaUbicacion({
            id_comuna: idComuna,
            nombre_comuna: comunaNombre,
            latitud: parseFloat(ubicComuna.latitud),
            longitud: parseFloat(ubicComuna.longitud)
          });
          setMapCoordinates({ 
            lat: parseFloat(ubicComuna.latitud), 
            lng: parseFloat(ubicComuna.longitud) 
          });
          setHasLocation(true);
        }

        // Obtener ubicación de la sala
        const { data: ubicSala } = await supabase
          .from('ubicacion_sala')
          .select('latitud, longitud')
          .eq('id_comuna', idComuna)
          .maybeSingle();
        
        if (ubicSala) {
          setSalaUbicacion({
            latitud: parseFloat(ubicSala.latitud),
            longitud: parseFloat(ubicSala.longitud)
          });
        }

        // Obtener ubicaciones de los consejos
        if (consejoIds.length > 0) {
          const { data: ubicConsejos } = await supabase
            .from('ubicacion_consejo')
            .select('id_consejo, latitud, longitud')
            .in('id_consejo', consejoIds);
          
          if (ubicConsejos) {
            const consejosMap = new Map(consejosData.map(c => [c.id_consejo, c.nombre_consejo]));
            const consejosConUbicacion = ubicConsejos.map(u => ({
              id_consejo: u.id_consejo,
              nombre_consejo: consejosMap.get(u.id_consejo) || 'Consejo',
              latitud: parseFloat(u.latitud),
              longitud: parseFloat(u.longitud)
            }));
            setConsejosUbicacion(consejosConUbicacion);
          }
        }
      } catch (err) {
        console.error("Error cargando ubicaciones:", err);
      } finally {
        setLoadingMap(false);
      }
    };

    fetchData();
  }, [authUser]);

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-100">
        <Loader2 className="animate-spin text-brand-primary h-8 w-8" />
        <span className="ml-2 text-slate-500">Cargando indicadores...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-2xl p-6 text-center">
        <AlertCircle className="h-8 w-8 text-red-600 mx-auto mb-2" />
        <p className="text-sm font-black text-red-800">{error}</p>
        <p className="text-xs text-red-600 mt-1">Verifica la conexión con la base de datos.</p>
      </div>
    );
  }

  // Eliminamos la pantalla de bloqueo por "no sala" o "sin comuna"
  // y mostramos siempre el dashboard, con datos vacíos si corresponde.

  const nivelOrganizacion = totalConsejos > 0 ? Math.round((consejosConVoceros / totalConsejos) * 100) : 0;

  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-700 space-y-6">
      {/* Banner informativo si no hay sala registrada */}
      

      {!comunaId && !noSala && (
        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 text-center">
          <div className="flex items-center justify-center gap-2 text-amber-700">
            <AlertCircle className="h-5 w-5" />
            <span className="text-sm font-bold">No se encontró una comuna asociada. Los datos se muestran vacíos.</span>
          </div>
        </div>
      )}

      {/* Métricas principales */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div 
          onClick={() => openModal('detail', 'Desglose de Población', { 
            Total: totalHabitantes, 
            Familias: totalFamilias, 
            Habitantes: totalHabitantes - totalFamilias 
          })}
          className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm overflow-hidden relative group cursor-pointer hover:border-brand-primary transition-all"
        >
          <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:scale-110 transition-transform">
            <Users size={80} className="text-brand-primary" />
          </div>
          <div className="flex flex-col">
            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Alcance Poblacional</span>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-bold text-gray-900">{totalHabitantes.toLocaleString()}</span>
            </div>
            <p className="text-xs text-gray-500 mt-2">{totalFamilias.toLocaleString()} familias, {(totalHabitantes - totalFamilias).toLocaleString()} otros</p>
          </div>
        </div>

        <div 
          onClick={() => openModal('detail', 'Estatus de Organización por Consejos', { 
            'Nivel de Organización': `${nivelOrganizacion}%`,
            'Consejos con Voceros': `${consejosConVoceros}/${totalConsejos}`,
            'Consejos sin Voceros': `${consejosSinVoceros}/${totalConsejos}`,
            'Total de Voceros': totalVoceros,
            'Detalle por Consejo': consejosDetalle.map(c => ({
              Nombre: c.nombre_consejo,
              'Cantidad de Voceros': c.total_voceros
            }))
          })}
          className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm overflow-hidden relative group cursor-pointer hover:border-brand-primary transition-all"
        >
          <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:scale-110 transition-transform">
            <Activity size={80} className="text-brand-primary" />
          </div>
          <div className="flex flex-col">
            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Nivel de Organización</span>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-bold text-gray-900">{nivelOrganizacion}%</span>
              <span className="text-xs text-brand-primary font-medium">{consejosConVoceros}/{totalConsejos} CC</span>
            </div>
            <p className="text-xs text-gray-500 mt-2">
              {totalVoceros} voceros registrados
            </p>
          </div>
        </div>
      </div>

      {/* Mapa y Tablero */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden flex flex-col">
          <div className="p-4 border-b border-gray-50 flex items-center justify-between">
            <h3 className="text-sm font-bold text-gray-900 uppercase tracking-tight flex items-center gap-2">
              <MapIcon className="w-4 h-4 text-brand-primary" />
              Mapa Territorial
            </h3>
            <div className="flex gap-2">
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-1">
                  <div className="w-4 h-4 rounded-full bg-green-500 flex items-center justify-center shadow-[0_0_6px_#10B981]"></div>
                  <span className="text-[8px] font-bold text-gray-500">Sala</span>
                </div>
                <div className="flex items-center gap-1">
                  <div className="w-4 h-4 rounded-full bg-blue-500 flex items-center justify-center shadow-[0_0_6px_#3B82F6]"></div>
                  <span className="text-[8px] font-bold text-gray-500">Comuna</span>
                </div>
                <div className="flex items-center gap-1">
                  <div className="w-4 h-4 rounded-full bg-purple-500 flex items-center justify-center shadow-[0_0_6px_#8B5CF6]"></div>
                  <span className="text-[8px] font-bold text-gray-500">Consejos</span>
                </div>
              </div>
            </div>
          </div>
          <div className="flex-1 bg-blue-50 relative overflow-hidden min-h-112.5">
            {loadingMap ? (
              <div className="flex items-center justify-center h-full">
                <Loader2 className="animate-spin text-brand-primary h-8 w-8" />
              </div>
            ) : (
              <LeafletMap 
                coordinates={mapCoordinates}
                consejosUbicacion={consejosUbicacion}
                comunaUbicacion={comunaUbicacion}
                salaUbicacion={salaUbicacion}
                hasLocation={hasLocation}
              />
            )}
            <div className="absolute bottom-4 left-4 right-4 bg-white/80 backdrop-blur p-3 rounded-xl flex flex-wrap gap-4 justify-center">
              <div className="flex items-center gap-1.5">
                <div className="w-3 h-3 rounded-full bg-purple-500 shadow-[0_0_4px_#8B5CF6]" />
                <span className="text-[10px]">{consejosUbicacion.length} Consejos Georreferenciados</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="w-3 h-3 rounded-full bg-red-500" />
                <span className="text-[10px]">Nudos Críticos: {totalNudos}</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="w-3 h-3 rounded-full bg-emerald-500" />
                <span className="text-[10px]">Proyectos: {totalProyectos}</span>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 space-y-4">
          <h3 className="text-sm font-bold text-gray-900 uppercase tracking-tight flex items-center gap-2 mb-4">
            <Zap className="w-4 h-4 text-brand-primary" />
            Tablero de Gestión
          </h3>
          <div className="space-y-3">
            <IndicatorItem icon={Building2} label="Consejos Comunales" value={totalConsejos} color="blue" onClick={() => openModal('detail', 'Consejos', { Total: totalConsejos, Detalle: consejosDetalle })} />
            <IndicatorItem icon={UserCheck} label="Voceros Registrados" value={totalVoceros} color="indigo" onClick={() => openModal('detail', 'Voceros', { Total: totalVoceros })} />
            <IndicatorItem icon={Briefcase} label="Proyectos" value={totalProyectos} color="emerald" onClick={() => openModal('detail', 'Proyectos', { Total: totalProyectos })} />
            <IndicatorItem icon={AlertCircle} label="Nudos Críticos" value={totalNudos} color="rose" onClick={() => openModal('detail', 'Nudos', { Total: totalNudos })} />
            <IndicatorItem icon={Users} label="Adultos Mayores" value={totalAdultosMayores} color="purple" onClick={() => openModal('detail', 'Adultos Mayores', { Total: totalAdultosMayores })} />
            <IndicatorItem icon={Laptop} label="Diagnósticos Digitales" value={totalDiagnosticosDigitales} color="cyan" onClick={() => openModal('detail', 'Diagnósticos', { Total: totalDiagnosticosDigitales })} />
            <IndicatorItem icon={GraduationCap} label="Postulaciones Cursos" value={totalPostulaciones} color="orange" onClick={() => openModal('detail', 'Postulaciones', { Total: totalPostulaciones })} />
          </div>
        </div>
      </div>
    </div>
  );
};

const IndicatorItem = ({ icon: Icon, label, value, color, onClick }: any) => {
  const colors: Record<string,string> = {
    blue: 'text-blue-600 bg-blue-50',
    indigo: 'text-indigo-600 bg-indigo-50',
    emerald: 'text-emerald-600 bg-emerald-50',
    rose: 'text-rose-600 bg-rose-50',
    purple: 'text-purple-600 bg-purple-50',
    cyan: 'text-cyan-600 bg-cyan-50',
    orange: 'text-orange-600 bg-orange-50',
  };
  return (
    <div onClick={onClick} className="group cursor-pointer hover:bg-gray-50 transition-all p-2 -m-2 rounded-xl border border-transparent hover:border-gray-100">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className={cn("w-10 h-10 rounded-lg flex items-center justify-center", colors[color])}>
            <Icon className="w-5 h-5" />
          </div>
          <div>
            <p className="text-xs font-bold text-gray-900">{label}</p>
            <p className="text-[10px] text-gray-500">Totales</p>
          </div>
        </div>
        <div className="text-right">
          <span className="text-sm font-bold text-gray-900">{value}</span>
          <ArrowUpRight className="inline-block w-3 h-3 text-brand-primary ml-1 opacity-0 group-hover:opacity-100" />
        </div>
      </div>
    </div>
  );
};