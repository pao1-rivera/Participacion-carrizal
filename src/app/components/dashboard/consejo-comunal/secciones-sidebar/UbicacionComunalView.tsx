"use client";

import React, { useState, useRef, useEffect } from "react";
import dynamic from "next/dynamic";
import { 
  MapPin, 
  Shield, 
  LocateFixed, 
  Map as MapIcon, 
  Save, 
  Compass,
  Link2,
  Target,
  Loader2,
  Lock,
  ArrowLeft,
  FileCheck,
  AlertCircle
} from "lucide-react";
import { cn } from "@/app/lib/utils";
import { supabase } from "@/app/lib/supabaseClient";
import { useAuth } from "@/context/AuthContext";
import { AlertModal } from "../../../AlertModal";
import "leaflet/dist/leaflet.css";

interface Coordinates {
  lat: number;
  lng: number;
}

interface UbicacionComunalViewProps {
  onBack?: () => void;
}

const MapContent = ({ coordinates, setCoordinates, setHasLocation, hasLocation, readOnly }: any) => {
  const { MapContainer, TileLayer, Marker, Popup, Polygon, useMapEvents, useMap } = require('react-leaflet');
  const L = require('leaflet');

  useEffect(() => {
    delete L.Icon.Default.prototype._getIconUrl;
    L.Icon.Default.mergeOptions({
      iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
      iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
      shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
    });
  }, [L]);

  const RecenterMap = ({ lat, lng }: { lat: number; lng: number }) => {
    const map = useMap();
    useEffect(() => {
      map.setView([lat, lng], map.getZoom());
    }, [lat, lng, map]);
    return null;
  };

  const MapEvents = () => {
    useMapEvents({
      click(e: any) {
        if (!readOnly) {
          setCoordinates({ lat: e.latlng.lat, lng: e.latlng.lng });
          setHasLocation(true);
        }
      },
    });
    return null;
  };

  const poligonalCoords: [number, number][] = [
    [coordinates.lat + 0.0005, coordinates.lng + 0.0005],
    [coordinates.lat - 0.0005, coordinates.lng + 0.0005],
    [coordinates.lat - 0.0005, coordinates.lng - 0.0005],
    [coordinates.lat + 0.0005, coordinates.lng - 0.0005],
  ];

  return (
    <MapContainer
      center={[coordinates.lat, coordinates.lng]}
      zoom={16}
      style={{ height: '100%', width: '100%' }}
      scrollWheelZoom={false}
    >
      <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
      <MapEvents />
      <RecenterMap lat={coordinates.lat} lng={coordinates.lng} />
      {hasLocation && (
        <>
          <Marker position={[coordinates.lat, coordinates.lng]}>
            <Popup>Centroide del Consejo Comunal</Popup>
          </Marker>
          <Polygon 
            pathOptions={{ color: '#E11D48', weight: 2, fillOpacity: 0.1, dashArray: '5, 5' }} 
            positions={poligonalCoords} 
          />
        </>
      )}
    </MapContainer>
  );
};

const LeafletMap = dynamic(() => Promise.resolve(MapContent), {
  ssr: false,
  loading: () => (
    <div className="h-full w-full flex items-center justify-center bg-slate-50">
      <p className="text-[9px] font-black text-slate-400 uppercase italic max-sm:text-[8px]">Cargando Mapa...</p>
    </div>
  ),
});

export const UbicacionComunalView = ({ onBack }: UbicacionComunalViewProps) => {
  const { user } = useAuth();
  const [consejoId, setConsejoId] = useState<number | null>(null);
  const [noConsejo, setNoConsejo] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  
  const [coordinates, setCoordinates] = useState<Coordinates>({ lat: 10.3496, lng: -66.9845 });
  const [isRegistered, setIsRegistered] = useState(false);
  const [isLocating, setIsLocating] = useState(false);
  const [hasLocation, setHasLocation] = useState(false);
  
  const [limites, setLimites] = useState({
    norte: "",
    sur: "",
    este: "",
    oeste: ""
  });

  const [modalConfig, setModalConfig] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    type?: 'info' | 'success' | 'warning' | 'danger';
  }>({
    isOpen: false,
    title: '',
    message: '',
    type: 'info'
  });

  const closeModal = () => setModalConfig(prev => ({ ...prev, isOpen: false }));
  
  useEffect(() => {
    const fetchConsejoId = async () => {
      if (!user?.id) return;
      const { data, error } = await supabase
        .from('datos_consejo_comunal')
        .select('id_consejo')
        .or(`id_usuario.eq.${user.id},id_usuario_auxiliar.eq.${user.id}`)
        .maybeSingle();
        if (error) {
          console.error('Error obteniendo consejo:', error);
          setLoading(false);
        } else if (data) {
          setConsejoId(data.id_consejo);
          setNoConsejo(false);
        } else {
          setNoConsejo(true);
          setLoading(false);
        }
    };
    fetchConsejoId();
  }, [user]);

  useEffect(() => {
    if (!consejoId) return;
    const fetchUbicacion = async () => {
      setLoading(true);
      const { data, error } = await supabase
        .from('ubicacion_consejo')
        .select('*')
        .eq('id_consejo', consejoId)
        .maybeSingle();
      if (error && error.code !== 'PGRST116') {
        console.error('Error cargando ubicación:', error);
      } else if (data) {
        setCoordinates({ lat: data.latitud, lng: data.longitud });
        setHasLocation(true);
        setLimites({
          norte: data.limite_norte || "",
          sur: data.limite_sur || "",
          este: data.limite_este || "",
          oeste: data.limite_oeste || ""
        });
        setIsRegistered(true);
      } else {
        setIsRegistered(false);
      }
      setLoading(false);
    };
    fetchUbicacion();
  }, [consejoId]);

  useEffect(() => {
    setMounted(true);
  }, []);

  const handleLocateMe = () => {
    if (isRegistered) return; 
    setIsLocating(true);
    if (typeof window !== "undefined" && navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords;
          setCoordinates({ lat: latitude, lng: longitude });
          setHasLocation(true);
          setIsLocating(false);
        },
        () => {
          setModalConfig({
            isOpen: true,
            title: "Error de Geolocalización",
            message: "No se pudo obtener la ubicación. Asegúrate de dar los permisos necesarios de GPS en tu navegador.",
            type: "warning"
          });
          setIsLocating(false);
        },
        { enableHighAccuracy: true }
      );
    }
  };

  const handleFinalizeConfig = async () => {
    if (isRegistered) {
      setModalConfig({
        isOpen: true,
        title: "Configuración Bloqueada",
        message: "La configuración ya ha sido finalizada y no se permiten modificaciones adicionales.",
        type: "info"
      });
      return;
    }
    if (!consejoId) {
      setModalConfig({
        isOpen: true,
        title: "Datos Faltantes",
        message: "Debe registrar primero los datos legales del consejo comunal antes de proceder.",
        type: "warning"
      });
      return;
    }
    if (!hasLocation) {
      setModalConfig({
        isOpen: true,
        title: "Ubicación Requerida",
        message: "Primero debes marcar tu ubicación actual o el centroide en el mapa.",
        type: "warning"
      });
      return;
    }
    if (!limites.norte || !limites.sur || !limites.este || !limites.oeste) {
      setModalConfig({
        isOpen: true,
        title: "Campos Incompletos",
        message: "Por favor, debes rellenar todos los límites geográficos del consejo comunal.",
        type: "warning"
      });
      return;
    }
    
    setSaving(true);
    const dataToSave = {
      id_consejo: consejoId,
      latitud: coordinates.lat,
      longitud: coordinates.lng,
      limite_norte: limites.norte,
      limite_sur: limites.sur,
      limite_este: limites.este,
      limite_oeste: limites.oeste,
      enlace_maps: `https://www.openstreetmap.org/?mlat=${coordinates.lat}&mlon=${coordinates.lng}`,
    };
    
    let error = null;
    if (isRegistered) {
      const { error: updateError } = await supabase
        .from('ubicacion_consejo')
        .update(dataToSave)
        .eq('id_consejo', consejoId);
      error = updateError;
    } else {
      const { error: insertError } = await supabase
        .from('ubicacion_consejo')
        .insert([dataToSave]);
      error = insertError;
    }
    
    if (error) {
      console.error("Error guardando ubicación:", error);
      setModalConfig({
        isOpen: true,
        title: "Error de Guardado",
        message: "Ocurrió un error inesperado al guardar la configuración en la base de datos. Intenta nuevamente.",
        type: "danger"
      });
    } else {
      setModalConfig({
        isOpen: true,
        title: "¡Configuración Exitosa!",
        message: "La ubicación geográfica y la poligonal territorial se han blindado y guardado correctamente.",
        type: "success"
      });
      setIsRegistered(true);
    }
    setSaving(false);
  };

  const generateOSMLink = () => {
    return `https://www.openstreetmap.org/?mlat=${coordinates.lat}&mlon=${coordinates.lng}#map=18/${coordinates.lat}/${coordinates.lng}`;
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center p-12 max-sm:p-6">
        <Loader2 className="animate-spin text-brand-primary" size={32} />
      </div>
    );
  }

    if (noConsejo) {
      function onNavigate(arg0: string): void {
        throw new Error("Function not implemented.");
      }
  
      return (
        <div className="flex flex-col items-center justify-center min-h-[60vh] text-center p-8 bg-white rounded-3xl border border-gray-100 shadow-sm">
          <div className="h-20 w-20 rounded-full bg-amber-100 flex items-center justify-center mb-6">
            <AlertCircle className="h-10 w-10 text-amber-600" />
          </div>
          <h3 className="text-xl font-black text-slate-800 uppercase tracking-tighter mb-2">
            Aún no has registrado tu Consejo Comunal
          </h3>
          <p className="text-slate-500 max-w-md mb-8">
            Para acceder a las estadísticas y funcionalidades del dashboard, primero debes completar los datos legales de tu consejo comunal.
          </p>
          <button
            onClick={() => onNavigate("documentacion")}
            className="px-8 py-3 bg-brand-primary text-white rounded-xl font-black text-sm shadow-lg hover:scale-[1.02] transition-all flex items-center gap-2"
          >
            <FileCheck className="h-4 w-4" />
            Completar Datos Legales
          </button>
        </div>
      );
    }

  return (
    <div className="space-y-4 max-sm:space-y-2 relative">
      {/* Header con título y botón de volver debajo */}
      <div>
        <div className="flex items-center gap-2 mb-1 max-sm:gap-1.5 max-sm:mb-0.5">
          <LocateFixed className="h-5 w-5 text-brand-primary max-sm:h-4 max-sm:w-4" />
          <h2 className="text-base font-black text-slate-800 italic uppercase tracking-tighter max-sm:text-sm">
            Ubicación Geográfica
          </h2>
        </div>
        <p className="text-[9px] font-bold text-slate-400 uppercase tracking-[0.15em] mb-2 max-sm:text-[8px] max-sm:mb-1.5">
          Gestión de la "Poligonal Inteligente" y Blindaje Territorial
        </p>
        {onBack && (
          <button
            onClick={onBack}
            className="text-brand-primary hover:text-brand-primary/80 text-[11px] font-bold uppercase tracking-wider flex items-center gap-1 transition-colors max-sm:text-[9px]"
          >
            <ArrowLeft className="h-3 w-3 max-sm:h-2.5 max-sm:w-2.5" />
            Volver a Datos Legales
          </button>
        )}
      </div>

      {/* Layout de dos columnas: en móviles se apilan */}
      <div className="grid lg:grid-cols-3 gap-4 max-sm:gap-2">
        {/* Columna izquierda: Delimitación */}
        <div className="lg:col-span-2 bg-white p-3 rounded-2xl border border-gray-100 shadow-sm max-sm:p-2 max-sm:rounded-xl">
          <div className="space-y-3 max-sm:space-y-2">
            <h3 className="text-sm font-black text-slate-800 italic uppercase tracking-tighter flex items-center gap-2 max-sm:text-xs max-sm:gap-1.5">
              <Compass className="h-4 w-4 text-brand-primary max-sm:h-3 max-sm:w-3" /> Delimitación
            </h3>

            {/* Mapa */}
            <div className="aspect-video lg:aspect-auto lg:h-80 rounded-xl bg-slate-100 border-2 border-white shadow-md overflow-hidden relative max-sm:h-60">
              {mounted && (
                <LeafletMap 
                  coordinates={coordinates} 
                  setCoordinates={setCoordinates} 
                  setHasLocation={setHasLocation} 
                  hasLocation={hasLocation}
                  readOnly={isRegistered}
                />
              )}
              <div className="absolute top-2 left-2 py-1 px-2 bg-white/95 backdrop-blur-md rounded-lg border border-gray-100 shadow-md z-400 max-sm:py-0.5 max-sm:px-1.5 max-sm:rounded-md">
                <div className="flex items-center gap-1.5">
                  <div className={cn("h-1.5 w-1.5 rounded-full max-sm:h-1 max-sm:w-1", hasLocation ? "bg-green-500" : "bg-red-500")} />
                  <span className="text-[8px] font-black text-slate-800 uppercase italic max-sm:text-[7px]">
                    {hasLocation ? "Ubicación Fijada" : "Esperando Ubicación"}
                  </span>
                </div>
              </div>
              {hasLocation && (
                <a 
                  href={generateOSMLink()} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="absolute bottom-2 right-2 p-1.5 bg-white shadow-md rounded-lg border border-gray-100 hover:shadow-lg transition-all z-400 max-sm:p-1"
                >
                  <Link2 className="h-3.5 w-3.5 text-slate-600 max-sm:h-3 max-sm:w-3" />
                </a>
              )}
            </div>

            {/* Punto central */}
            <div className="p-2 rounded-lg bg-gray-50 border border-gray-100 max-sm:p-1.5 max-sm:rounded-md">
              <p className="text-[8px] font-bold text-slate-400 uppercase tracking-wider mb-0.5 max-sm:text-[7px]">Punto Central (Centroide)</p>
              <div className="flex items-center gap-2 text-xs font-black text-slate-800 max-sm:text-[10px] max-sm:gap-1.5">
                <MapPin className="h-3 w-3 text-brand-primary max-sm:h-2.5 max-sm:w-2.5" />
                <span>
                  {hasLocation 
                    ? `${coordinates.lat.toFixed(6)}° N, ${coordinates.lng.toFixed(6)}° W` 
                    : "Seleccione en el mapa"}
                </span>
              </div>
            </div>

            {/* Estatus */}
            <div className="p-2 rounded-lg bg-brand-primary/5 border border-brand-primary/10 max-sm:p-1.5">
              <div className="flex items-center gap-2 mb-0.5 max-sm:gap-1.5">
                <Shield className="h-3 w-3 text-brand-primary max-sm:h-2.5 max-sm:w-2.5" />
                <span className="text-[8px] font-black text-brand-primary uppercase max-sm:text-[7px]">Estatus de Registro</span>
              </div>
              <p className="text-[9px] font-bold text-slate-700 max-sm:text-[8px]">
                {isRegistered 
                  ? "Configuración completada (No editable)" 
                  : "Pendiente por configurar"}
              </p>
            </div>

            <button
              onClick={handleLocateMe}
              disabled={isLocating || isRegistered}
              className="w-full flex items-center justify-center gap-2 py-2 px-3 bg-blue-600 text-white rounded-lg font-black text-[9px] uppercase tracking-wider shadow-md hover:scale-[1.02] transition-all disabled:opacity-50 disabled:cursor-not-allowed max-sm:py-1.5 max-sm:px-2 max-sm:text-[8px] max-sm:gap-1.5"
            >
              <Target className="h-3 w-3 max-sm:h-2.5 max-sm:w-2.5" />
              {isLocating ? "Localizando..." : "Mi Ubicación Actual"}
            </button>
          </div>
        </div>

        {/* Columna derecha: Registro de Límites */}
        <div className="lg:col-span-1 bg-white p-3 rounded-2xl border border-gray-100 shadow-sm max-sm:p-2 max-sm:rounded-xl">
          <div className="flex items-center justify-between gap-2 mb-3 max-sm:mb-2">
            <div className="flex items-center gap-1.5">
              <div className="h-5 w-5 rounded-lg bg-brand-primary/10 flex items-center justify-center max-sm:h-4 max-sm:w-4">
                <MapIcon className="h-3 w-3 text-brand-primary max-sm:h-2.5 max-sm:w-2.5" />
              </div>
              <h3 className="text-sm font-black text-slate-800 italic uppercase tracking-tighter max-sm:text-xs">
                Registro de Límites
              </h3>
            </div>
            {!isRegistered ? (
              <button 
                onClick={handleFinalizeConfig}
                disabled={saving}
                className="flex items-center justify-center gap-1 px-2 py-1 bg-brand-primary hover:bg-brand-primary/90 text-white rounded-lg font-black text-[8px] uppercase italic tracking-wider transition-all active:scale-95 disabled:opacity-70 max-sm:text-[7px] max-sm:px-1.5 max-sm:py-0.5"
              >
                {saving ? <Loader2 className="h-2.5 w-2.5 animate-spin max-sm:h-2 max-sm:w-2" /> : <Save className="h-2.5 w-2.5 max-sm:h-2 max-sm:w-2" />}
                Terminar
              </button>
            ) : (
              <div className="flex items-center gap-1 px-2 py-1 bg-gray-100 text-slate-500 rounded-lg font-black text-[8px] uppercase italic tracking-wider max-sm:text-[7px] max-sm:px-1.5">
                <Lock className="h-2.5 w-2.5 max-sm:h-2 max-sm:w-2" />
                Bloqueado
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 gap-2 max-sm:gap-1.5">
            {[
              { key: "norte", label: "Límite Norte" },
              { key: "sur", label: "Límite Sur" },
              { key: "este", label: "Límite Este" },
              { key: "oeste", label: "Límite Oeste" }
            ].map((limit) => (
              <div key={limit.key} className="space-y-0.5">
                <label className="text-[8px] font-black text-slate-400 uppercase tracking-wider ml-1 max-sm:text-[7px]">
                  {limit.label}
                </label>
                <input 
                  type="text" 
                  value={limites[limit.key as keyof typeof limites]}
                  onChange={(e) => !isRegistered && setLimites({ ...limites, [limit.key]: e.target.value })}
                  placeholder={`Describa el límite ${limit.key}...`}
                  className={cn(
                    "w-full p-2 rounded-lg bg-gray-50 border-none ring-1 ring-gray-100 outline-none text-xs font-bold max-sm:text-[10px] max-sm:p-1.5",
                    isRegistered && "bg-gray-100 text-slate-400 cursor-not-allowed"
                  )}
                  required
                  disabled={isRegistered}
                />
              </div>
            ))}
          </div>
        </div>
      </div>

      <AlertModal
        isOpen={modalConfig.isOpen}
        onClose={closeModal}
        title={modalConfig.title}
        message={modalConfig.message}
        type={modalConfig.type}
      />
    </div>
  );
};