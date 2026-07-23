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
  Layers,
  ArrowUpRight,
  ArrowLeft,
  Home,
  Loader2,
  AlertCircle,
  Lock,
  FileCheck
} from "lucide-react";
import { cn } from "@/app/lib/utils";
import { supabase } from "@/app/lib/supabaseClient";
import { useAuth } from "@/context/AuthContext";
import { AlertModal } from "@/app/components/AlertModal";
import "leaflet/dist/leaflet.css";

interface Coordinates {
  lat: number;
  lng: number;
}

interface Limites {
  norte: string;
  sur: string;
  este: string;
  oeste: string;
}

interface UbicacionComuna {
  id_comuna: number;
  latitud: string;
  longitud: string;
  limite_norte: string;
  limite_sur: string;
  limite_este: string;
  limite_oeste: string;
  enlace_maps: string;
}

interface ConsejoUbicacion {
  id_consejo: number;
  nombre_consejo: string;
  latitud: number;
  longitud: number;
  limite_norte: string;
  limite_sur: string;
  limite_este: string;
  limite_oeste: string;
  enlace_maps: string;
  tiene_ubicacion: boolean;
}

interface SalaUbicacion {
  id_ubicacion_sala?: number;
  latitud: string;
  longitud: string;
  limite_norte: string;
  limite_sur: string;
  limite_este: string;
  limite_oeste: string;
  enlace_maps?: string;
}

interface UbicacionGProps {
  onBack?: () => void;
  onNavigate: (section: string) => void;
}

// --- COMPONENTE DEL MAPA AISLADO (con opción readOnly) ---
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
            <Popup>Ubicación seleccionada</Popup>
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

// --- CARGA DINÁMICA DEL MAPA ---
const LeafletMap = dynamic(() => Promise.resolve(MapContent), {
  ssr: false,
  loading: () => (
    <div className="h-full w-full flex items-center justify-center bg-slate-50">
      <Loader2 className="animate-spin text-brand-primary h-6 w-6" />
      <p className="text-[10px] font-black text-slate-400 uppercase italic ml-2">Cargando Mapa...</p>
    </div>
  ),
});

export const UbicacionG = ({ onBack, onNavigate }: UbicacionGProps) => {
  const { user } = useAuth();
  const [mounted, setMounted] = useState(false);
  
  // Mapa y ubicación seleccionada (para la sala)
  const [coordinates, setCoordinates] = useState<Coordinates>({ lat: 10.3496, lng: -66.9845 });
  const [hasLocation, setHasLocation] = useState(false);
  const [isLocating, setIsLocating] = useState(false);
  
  // Datos de la comuna asociada a la sala
  const [noSala, setNoSala] = useState(false);
  const [comunaData, setComunaData] = useState<{
    id_comuna: number;
    nombre_comuna: string;
    ubicacion?: UbicacionComuna;
  } | null>(null);
  const [loadingComuna, setLoadingComuna] = useState(true);
  
  // Datos de ubicación de la sala (propia)
  const [salaUbicacion, setSalaUbicacion] = useState<SalaUbicacion | null>(null);
  const [isRegistered, setIsRegistered] = useState(false);
  const [saving, setSaving] = useState(false);
  
  // Estado para límites
  const [limites, setLimites] = useState<Limites>({ norte: '', sur: '', este: '', oeste: '' });
  
  // Lista de consejos con sus ubicaciones
  const [consejosUbicacion, setConsejosUbicacion] = useState<ConsejoUbicacion[]>([]);
  const [loadingConsejos, setLoadingConsejos] = useState(true);
  
  // Vista actual
  type Vista = 'sala' | 'comuna' | { tipo: 'consejo'; data: ConsejoUbicacion };
  const [vistaActual, setVistaActual] = useState<Vista>('sala');
  
  const [error, setError] = useState<string | null>(null);

  // ==================== ALERT MODAL ====================
  const [modalState, setModalState] = useState({
    isOpen: false,
    title: '',
    message: '',
    type: 'info' as 'info' | 'success' | 'warning' | 'danger',
    showInput: false,
    inputPlaceholder: '',
    onConfirm: null as ((value?: string) => void) | null,
    cancelText: 'Cancelar',
    confirmText: 'Aceptar',
  });

  const showAlert = (title: string, message: string, type?: 'info'|'success'|'warning'|'danger') => {
    setModalState({
      ...modalState,
      isOpen: true,
      title,
      message,
      type: type || 'info',
      showInput: false,
      onConfirm: null,
    });
  };

  const closeModal = () => setModalState(prev => ({ ...prev, isOpen: false }));

  // ========== OCULTAR SIDEBAR CUANDO ALERTA ESTÁ ABIERTA ==========
  useEffect(() => {
    if (modalState.isOpen) {
      document.body.classList.add('modal-open');
    } else {
      document.body.classList.remove('modal-open');
    }
    return () => document.body.classList.remove('modal-open');
  }, [modalState.isOpen]);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Cargar datos
  useEffect(() => {
    if (!user?.id) return;
    const fetchData = async () => {
      setLoadingComuna(true);
      setLoadingConsejos(true);
      setError(null);
      
      try {
        const { data: sala, error: salaError } = await supabase
          .from('datos_sala_autogobierno')
          .select('id_comuna')
          .eq('id_usuario', user.id)
          .maybeSingle();
        
        if (salaError) throw salaError;
        if (!sala || !sala.id_comuna) {
          setNoSala(true);
          setLoadingComuna(false);
          setLoadingConsejos(false);
          return;
        }
        
        const idComuna = sala.id_comuna;
        
        const { data: comunaNombreRow, error: comunaError } = await supabase
          .from('datos_comuna')
          .select('nombre_comuna')
          .eq('id_comuna', idComuna)
          .maybeSingle();
        if (comunaError) throw comunaError;
        const nombreComuna = comunaNombreRow?.nombre_comuna || "Comuna sin nombre";
        
        const { data: ubicacionComuna, error: ubicacionError } = await supabase
          .from('ubicacion_comuna')
          .select('*')
          .eq('id_comuna', idComuna)
          .maybeSingle();
        
        const { data: salaUbic, error: salaUbicError } = await supabase
          .from('ubicacion_sala')
          .select('*')
          .eq('id_comuna', idComuna)
          .maybeSingle();
        
        if (salaUbicError) throw salaUbicError;
        if (salaUbic) {
          setSalaUbicacion(salaUbic);
          setIsRegistered(true);
          setCoordinates({ lat: parseFloat(salaUbic.latitud), lng: parseFloat(salaUbic.longitud) });
          setHasLocation(true);
          setLimites({
            norte: salaUbic.limite_norte || '',
            sur: salaUbic.limite_sur || '',
            este: salaUbic.limite_este || '',
            oeste: salaUbic.limite_oeste || '',
          });
          setVistaActual('sala');
        } else {
          setVistaActual('sala');
        }
        
        setComunaData({
          id_comuna: idComuna,
          nombre_comuna: nombreComuna,
          ubicacion: ubicacionComuna || undefined,
        });
        
        if (!salaUbic && ubicacionComuna?.latitud && ubicacionComuna?.longitud) {
          const lat = parseFloat(ubicacionComuna.latitud);
          const lng = parseFloat(ubicacionComuna.longitud);
          if (!isNaN(lat) && !isNaN(lng)) {
            setCoordinates({ lat, lng });
            setHasLocation(true);
          }
        }
        
        const { data: sectores, error: sectoresError } = await supabase
          .from('sectores')
          .select('id_sector')
          .eq('id_datos_comuna', idComuna)
          .eq('activo', true);
        if (sectoresError) throw sectoresError;
        
        let consejosList: { id_consejo: number; nombre_consejo: string }[] = [];
        if (sectores && sectores.length > 0) {
          const sectorIds = sectores.map(s => s.id_sector);
          const { data: consejos, error: consejosError } = await supabase
            .from('datos_consejo_comunal')
            .select('id_consejo, nombre_consejo')
            .in('id_sector', sectorIds);
          if (consejosError) throw consejosError;
          consejosList = consejos || [];
        }
        
        if (consejosList.length > 0) {
          const consejoIds = consejosList.map(c => c.id_consejo);
          const { data: ubicaciones, error: ubicacionesError } = await supabase
            .from('ubicacion_consejo')
            .select('*')
            .in('id_consejo', consejoIds);
          if (ubicacionesError) throw ubicacionesError;
          
          const ubicacionMap = new Map();
          ubicaciones?.forEach((u: any) => ubicacionMap.set(u.id_consejo, u));
          
          const consejosConUbicacion: ConsejoUbicacion[] = consejosList.map(c => {
            const ubic = ubicacionMap.get(c.id_consejo);
            return {
              id_consejo: c.id_consejo,
              nombre_consejo: c.nombre_consejo,
              latitud: ubic ? parseFloat(ubic.latitud) : 0,
              longitud: ubic ? parseFloat(ubic.longitud) : 0,
              limite_norte: ubic?.limite_norte || '',
              limite_sur: ubic?.limite_sur || '',
              limite_este: ubic?.limite_este || '',
              limite_oeste: ubic?.limite_oeste || '',
              enlace_maps: ubic?.enlace_maps || '',
              tiene_ubicacion: !!ubic,
            };
          });
          setConsejosUbicacion(consejosConUbicacion);
        } else {
          setConsejosUbicacion([]);
        }
        
      } catch (err: any) {
        console.error(err);
        setError(err.message || "Error al cargar datos de ubicación");
      } finally {
        setLoadingComuna(false);
        setLoadingConsejos(false);
      }
    };
    fetchData();
  }, [user]);

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
          showAlert("Error de geolocalización", "No se pudo obtener la ubicación. Asegúrate de dar permisos de GPS.", "warning");
          setIsLocating(false);
        },
        { enableHighAccuracy: true }
      );
    }
  };
  
  const handleLimitesChange = (key: keyof Limites, value: string) => {
    if (isRegistered) return;
    setLimites(prev => ({ ...prev, [key]: value }));
  };
  
  const handleSave = async () => {
    if (!comunaData?.id_comuna) {
      showAlert("Error", "No se pudo identificar la comuna asociada a la sala.", "danger");
      return;
    }
    if (!hasLocation) {
      showAlert("Ubicación requerida", "Debes seleccionar una ubicación en el mapa.", "warning");
      return;
    }
    if (!limites.norte || !limites.sur || !limites.este || !limites.oeste) {
      showAlert("Campos incompletos", "Debes llenar todos los límites (norte, sur, este, oeste).", "warning");
      return;
    }
    
    setSaving(true);
    try {
      const enlaceMaps = `https://www.openstreetmap.org/?mlat=${coordinates.lat}&mlon=${coordinates.lng}`;
      const ubicacionData = {
        id_comuna: comunaData.id_comuna,
        latitud: coordinates.lat.toString(),
        longitud: coordinates.lng.toString(),
        limite_norte: limites.norte,
        limite_sur: limites.sur,
        limite_este: limites.este,
        limite_oeste: limites.oeste,
        enlace_maps: enlaceMaps,
      };
      
      const { data: existing } = await supabase
        .from('ubicacion_sala')
        .select('id_ubicacion_sala')
        .eq('id_comuna', comunaData.id_comuna)
        .maybeSingle();
      
      let error;
      if (existing) {
        const { error: updateError } = await supabase
          .from('ubicacion_sala')
          .update(ubicacionData)
          .eq('id_comuna', comunaData.id_comuna);
        error = updateError;
      } else {
        const { error: insertError } = await supabase
          .from('ubicacion_sala')
          .insert([ubicacionData]);
        error = insertError;
      }
      
      if (error) throw error;
      
      setIsRegistered(true);
      showAlert("Éxito", "Ubicación de la sala guardada correctamente.", "success");
      
      const { data: refreshed } = await supabase
        .from('ubicacion_sala')
        .select('*')
        .eq('id_comuna', comunaData.id_comuna)
        .maybeSingle();
      if (refreshed) {
        setSalaUbicacion(refreshed);
        setLimites({
          norte: refreshed.limite_norte || '',
          sur: refreshed.limite_sur || '',
          este: refreshed.limite_este || '',
          oeste: refreshed.limite_oeste || '',
        });
        setVistaActual('sala');
      }
    } catch (err: any) {
      console.error(err);
      showAlert("Error", "Error al guardar la ubicación: " + err.message, "danger");
    } finally {
      setSaving(false);
    }
  };
  
  const centerMap = (lat: number, lng: number) => {
    setCoordinates({ lat, lng });
    setHasLocation(true);
  };
  
  const mostrarComuna = () => {
    if (comunaData?.ubicacion) {
      centerMap(parseFloat(comunaData.ubicacion.latitud), parseFloat(comunaData.ubicacion.longitud));
      setVistaActual('comuna');
    } else if (salaUbicacion) {
      centerMap(parseFloat(salaUbicacion.latitud), parseFloat(salaUbicacion.longitud));
      setVistaActual('comuna');
      showAlert("Información", "La comuna aún no tiene una ubicación registrada. Se muestra la ubicación de la sala como referencia.", "info");
    } else {
      showAlert("Información", "La comuna no tiene ubicación registrada.", "info");
    }
  };
  
  const mostrarSala = () => {
    if (salaUbicacion) {
      centerMap(parseFloat(salaUbicacion.latitud), parseFloat(salaUbicacion.longitud));
      setVistaActual('sala');
    } else {
      showAlert("Información", "La sala aún no tiene ubicación registrada. Debes seleccionar una ubicación y guardar.", "info");
    }
  };
  
  const mostrarConsejo = (consejo: ConsejoUbicacion) => {
    setVistaActual({ tipo: 'consejo', data: consejo });
    centerMap(consejo.latitud, consejo.longitud);
  };
  
  const volverASala = () => {
    setVistaActual('sala');
    if (salaUbicacion) {
      centerMap(parseFloat(salaUbicacion.latitud), parseFloat(salaUbicacion.longitud));
    } else if (comunaData?.ubicacion) {
      centerMap(parseFloat(comunaData.ubicacion.latitud), parseFloat(comunaData.ubicacion.longitud));
    }
  };
  
  const getCurrentLimites = (): Limites | null => {
    if (vistaActual === 'sala') {
      if (salaUbicacion) {
        return {
          norte: salaUbicacion.limite_norte || '',
          sur: salaUbicacion.limite_sur || '',
          este: salaUbicacion.limite_este || '',
          oeste: salaUbicacion.limite_oeste || '',
        };
      } else {
        return limites;
      }
    }
    if (vistaActual === 'comuna' && comunaData?.ubicacion) {
      return {
        norte: comunaData.ubicacion.limite_norte || '',
        sur: comunaData.ubicacion.limite_sur || '',
        este: comunaData.ubicacion.limite_este || '',
        oeste: comunaData.ubicacion.limite_oeste || '',
      };
    }
    if (typeof vistaActual === 'object' && vistaActual.tipo === 'consejo') {
      return {
        norte: vistaActual.data.limite_norte || '',
        sur: vistaActual.data.limite_sur || '',
        este: vistaActual.data.limite_este || '',
        oeste: vistaActual.data.limite_oeste || '',
      };
    }
    return null;
  };
  
  const panelTitle = () => {
    if (vistaActual === 'sala') return "Límites de la Sala";
    if (vistaActual === 'comuna') return `Límites de la Comuna: ${comunaData?.nombre_comuna || ''}`;
    if (typeof vistaActual === 'object' && vistaActual.tipo === 'consejo') return `Límites del Consejo: ${vistaActual.data.nombre_consejo}`;
    return "Límites Territoriales";
  };
  
  const currentLimites = getCurrentLimites();
  const limitesDisabled = (typeof vistaActual === 'object' && vistaActual.tipo === 'consejo') || (vistaActual === 'sala' && isRegistered);
  
  if (loadingComuna) {
    return (
      <div className="flex justify-center items-center min-h-100">
        <Loader2 className="animate-spin text-brand-primary h-8 w-8" />
        <p className="ml-2 text-slate-500">Cargando información geográfica...</p>
      </div>
    );
  }
  
  if (error) {
    return (
      <div className="bg-rose-50 border border-rose-200 rounded-2xl p-6 text-center">
        <AlertCircle className="h-10 w-10 text-rose-500 mx-auto mb-3" />
        <p className="text-sm font-black text-rose-800">{error}</p>
        <p className="text-xs text-rose-600 mt-2">Asegúrate de que tu sala de autogobierno tenga una comuna asociada.</p>
      </div>
    );
  }
  
  const consejosConUbicacion = consejosUbicacion.filter(c => c.tiene_ubicacion);
  const consejosSinUbicacion = consejosUbicacion.filter(c => !c.tiene_ubicacion);
  
    if (noSala) {
      return (
        <div className="flex flex-col items-center justify-center min-h-[60vh] text-center p-8 bg-white rounded-3xl border border-gray-100 shadow-sm">
          <div className="h-20 w-20 rounded-full bg-amber-100 flex items-center justify-center mb-6">
            <AlertCircle className="h-10 w-10 text-amber-600" />
          </div>
          <h3 className="text-xl font-black text-slate-800 uppercase tracking-tighter mb-2">
            Aún no has registrado tu Sala de Autogobierno
          </h3>
          <p className="text-slate-500 max-w-md mb-8">
            Para acceder a las estadísticas y funcionalidades del dashboard, primero debes completar los datos legales de tu sala.
          </p>
          <button
            onClick={() => onNavigate("datosl")}
            className="px-8 py-3 bg-brand-primary text-white rounded-xl font-black text-sm shadow-lg hover:scale-[1.02] transition-all flex items-center gap-2"
          >
            <FileCheck className="h-4 w-4" />
            Completar Datos Legales
          </button>
        </div>
      );
    }

  return (
    <div className="space-y-6 relative">
      {/* HEADER CON BOTÓN DE VOLVER */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <LocateFixed className="h-5 w-5 text-brand-primary" />
            <h2 className="text-base font-black text-slate-800 italic uppercase tracking-tighter">
              Ubicación Geográfica y Límites
            </h2>
          </div>
          <p className="text-[9px] font-bold text-slate-400 uppercase tracking-[0.15em]">
            Gestión de la "Poligonal Inteligente" y Delimitación Territorial
          </p>
          {/* Botón de volver, alineado a la izquierda */}
          {onBack && (
            <button
              onClick={onBack}
              className="mt-3 flex items-center gap-1.5 text-[9px] font-bold uppercase tracking-wider text-brand-primary hover:text-brand-primary/80 transition-colors"
            >
              <ArrowLeft className="h-3 w-3" />
              Volver a Datos Legales
            </button>
          )}
        </div>
        {!isRegistered && vistaActual === 'sala' ? (
          <button
            onClick={handleSave}
            disabled={saving}
            className="flex items-center justify-center gap-2 px-5 py-2 bg-brand-primary hover:bg-brand-primary/90 text-white rounded-xl font-black text-[9px] uppercase italic tracking-wider transition-all shadow-md hover:scale-105 disabled:opacity-50"
          >
            {saving ? <Loader2 className="h-3 w-3 animate-spin" /> : <Save className="h-3 w-3" />}
            Guardar Territorio
          </button>
        ) : (vistaActual === 'sala' && isRegistered) && (
          <div className="flex items-center gap-2 px-3 py-1.5 bg-gray-100 text-slate-500 rounded-xl font-black text-[9px] uppercase italic tracking-wider">
            <Lock className="h-3 w-3" />
            Configuración Bloqueada
          </div>
        )}
      </div>

      <div className="grid lg:grid-cols-12 gap-6 items-start">
        {/* MAPA y LISTA CONSEJOS */}
        <div className="lg:col-span-8 space-y-6">
          {/* MAPA REDUCIDO */}
          <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-1.5">
                <Compass className="h-4 w-4 text-brand-primary" />
                <h3 className="text-[11px] font-black text-slate-800 italic uppercase tracking-tighter">Vista Satelital</h3>
              </div>
              <div className="flex gap-1.5">
                {comunaData?.ubicacion && (
                  <button onClick={mostrarComuna} className="flex items-center gap-1 px-3 py-1.5 bg-emerald-600 text-white rounded-lg font-black text-[8px] uppercase tracking-wider shadow-sm hover:scale-105 transition-all">
                    <Home className="h-2.5 w-2.5" /> Comuna
                  </button>
                )}
                {salaUbicacion && (
                  <button onClick={mostrarSala} className="flex items-center gap-1 px-3 py-1.5 bg-brand-primary text-white rounded-lg font-black text-[8px] uppercase tracking-wider shadow-sm hover:scale-105 transition-all">
                    <LocateFixed className="h-2.5 w-2.5" /> Sala
                  </button>
                )}
                <button onClick={handleLocateMe} disabled={isRegistered} className="flex items-center gap-1 px-3 py-1.5 bg-blue-600 text-white rounded-lg font-black text-[8px] uppercase tracking-wider shadow-sm hover:scale-105 transition-all disabled:opacity-50">
                  <Target className="h-2.5 w-2.5" /> GPS
                </button>
              </div>
            </div>
            <div className="aspect-video rounded-xl bg-slate-100 border-2 border-white shadow-inner overflow-hidden relative">
              {mounted && (
                <LeafletMap 
                  coordinates={coordinates} 
                  setCoordinates={setCoordinates} 
                  setHasLocation={setHasLocation} 
                  hasLocation={hasLocation}
                  readOnly={isRegistered || (typeof vistaActual === 'object' && vistaActual.tipo === 'consejo') || (vistaActual === 'comuna' && !!comunaData?.ubicacion)}
                />
              )}
              <div className="absolute top-2 left-2 py-0.5 px-2 bg-white/90 backdrop-blur-sm rounded-md border border-gray-100 shadow-sm z-400">
                <div className="flex items-center gap-1.5">
                  <div className={cn("h-1 w-1 rounded-full", hasLocation ? "bg-green-500" : "bg-red-500")} />
                  <span className="text-[7px] font-black text-slate-800 uppercase tracking-tighter">
                    {hasLocation ? "Ubicación seleccionada" : "Sin selección"}
                  </span>
                </div>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3 mt-4">
              <div className="p-2 rounded-lg bg-gray-50 border border-gray-100">
                <p className="text-[7px] font-bold text-slate-400 uppercase tracking-wider mb-0.5">Coordenadas</p>
                <p className="text-[9px] font-black text-slate-800 truncate">
                  {hasLocation ? `${coordinates.lat.toFixed(6)}, ${coordinates.lng.toFixed(6)}` : "No seleccionadas"}
                </p>
              </div>
              <div className="p-2 rounded-lg bg-gray-50 border border-gray-100">
                <p className="text-[7px] font-bold text-slate-400 uppercase tracking-wider mb-0.5">Superficie estimada</p>
                <p className="text-[9px] font-black text-slate-800">~ 12.45 Hectáreas</p>
              </div>
            </div>
          </div>

          {/* LISTA CONSEJOS REDUCIDA */}
          <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm">
            <div className="flex items-center gap-2 mb-3">
              <Layers className="h-4 w-4 text-brand-primary" />
              <h3 className="text-[11px] font-black text-slate-800 italic uppercase tracking-tighter">Consejos Comunales</h3>
            </div>
            {loadingConsejos ? (
              <div className="flex justify-center py-4"><Loader2 className="animate-spin text-brand-primary h-5 w-5" /></div>
            ) : consejosUbicacion.length === 0 ? (
              <p className="text-center text-slate-400 text-[9px] font-bold py-4">No hay consejos asociados a esta comuna.</p>
            ) : (
              <div className="space-y-2 max-h-55 overflow-y-auto pr-1">
                {consejosUbicacion.map((consejo) => (
                  <div key={consejo.id_consejo} className="flex items-center justify-between p-2 bg-gray-50 rounded-lg border border-gray-100 hover:bg-white">
                    <div className="flex items-center gap-2 min-w-0">
                      <div className="h-6 w-6 rounded-md bg-white flex items-center justify-center text-brand-primary shadow-sm -shrink-0">
                        <MapPin className="h-3 w-3" />
                      </div>
                      <div className="truncate">
                        <p className="text-[9px] font-black text-slate-800 uppercase italic truncate max-w-25">{consejo.nombre_consejo}</p>
                        <span className={cn("text-[6px] font-black px-1 py-0.5 rounded", consejo.tiene_ubicacion ? "bg-emerald-50 text-emerald-600" : "bg-amber-50 text-amber-600")}>
                          {consejo.tiene_ubicacion ? "Georreferenciado" : "Sin ubicación"}
                        </span>
                      </div>
                    </div>
                    {consejo.tiene_ubicacion && (
                      <button onClick={() => mostrarConsejo(consejo)} className="p-1 rounded-md bg-white border border-gray-100 text-slate-400 hover:text-brand-primary">
                        <ArrowUpRight className="h-3 w-3" />
                      </button>
                    )}
                  </div>
                ))}
                {consejosSinUbicacion.length > 0 && (
                  <div className="mt-1 p-1.5 bg-amber-50 rounded-md border border-amber-100">
                    <p className="text-[7px] font-black text-amber-700 uppercase flex items-center gap-1">
                      <AlertCircle className="h-2 w-2" /> {consejosSinUbicacion.length} consejo(s) sin ubicación.
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* COLUMNA DERECHA: LÍMITES */}
        <div className="lg:col-span-4 space-y-4 bg-white p-4 rounded-xl border border-gray-100 shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-1.5">
              <div className="h-5 w-5 rounded-md bg-brand-primary/10 flex items-center justify-center">
                <MapIcon className="h-3 w-3 text-brand-primary" />
              </div>
              <h3 className="text-[11px] font-black text-slate-800 italic uppercase tracking-tighter">
                {panelTitle()}
              </h3>
            </div>
            {vistaActual !== 'sala' && (
              <button onClick={volverASala} className="flex items-center gap-0.5 px-2 py-1 bg-gray-100 text-slate-600 rounded-lg text-[7px] font-black uppercase hover:bg-gray-200">
                <ArrowLeft className="h-2.5 w-2.5" /> Volver
              </button>
            )}
          </div>
          <div className="space-y-3">
            {currentLimites ? (
              <>
                {[
                  { key: "norte", label: "Límite Norte" },
                  { key: "sur", label: "Límite Sur" },
                  { key: "este", label: "Límite Este" },
                  { key: "oeste", label: "Límite Oeste" }
                ].map((lim) => (
                  <div key={lim.key} className="space-y-0.5">
                    <label className="text-[8px] font-black text-slate-400 uppercase tracking-wider ml-1">{lim.label}</label>
                    <input 
                      type="text" 
                      value={currentLimites[lim.key as keyof Limites]}
                      onChange={(e) => {
                        if (vistaActual === 'sala' && !salaUbicacion) {
                          handleLimitesChange(lim.key as keyof Limites, e.target.value);
                        }
                      }}
                      placeholder={`Referencia del ${lim.key}...`}
                      className={cn(
                        "w-full p-2.5 rounded-lg bg-gray-50 ring-1 ring-gray-100 outline-none text-[10px] font-bold",
                        (vistaActual !== 'sala' || salaUbicacion) && "bg-gray-100 text-slate-400 cursor-not-allowed"
                      )}
                      disabled={vistaActual !== 'sala' || !!salaUbicacion}
                    />
                  </div>
                ))}
                {typeof vistaActual === 'object' && vistaActual.tipo === 'consejo' && vistaActual.data.enlace_maps && (
                  <div className="mt-3 p-2 rounded-lg bg-brand-primary/5 border border-brand-primary/10">
                    <a href={vistaActual.data.enlace_maps} target="_blank" rel="noopener noreferrer" className="flex items-center justify-center gap-1 text-[8px] font-black text-brand-primary uppercase tracking-wider">
                      <Link2 className="h-2.5 w-2.5" /> Ver en mapa externo
                    </a>
                  </div>
                )}
                {vistaActual === 'sala' && !salaUbicacion && (
                  <div className="p-3 rounded-lg bg-brand-primary/5 border border-brand-primary/10 mt-3">
                    <div className="flex items-center gap-1 mb-0.5">
                      <Shield className="h-3 w-3 text-brand-primary" />
                      <span className="text-[8px] font-black text-brand-primary uppercase">Validación Territorial</span>
                    </div>
                    <p className="text-[9px] font-bold text-slate-600 leading-tight">Selecciona una ubicación en el mapa y completa los límites para registrar la sala.</p>
                  </div>
                )}
              </>
            ) : (
              <div className="p-3 rounded-lg bg-amber-50 border border-amber-100 text-center">
                <Shield className="h-4 w-4 text-amber-600 mx-auto mb-1" />
                <p className="text-[9px] font-bold text-amber-800">No hay límites disponibles.</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* AlertModal */}
      <AlertModal
        isOpen={modalState.isOpen}
        onClose={closeModal}
        title={modalState.title}
        message={modalState.message}
        type={modalState.type}
        showInput={modalState.showInput}
        inputPlaceholder={modalState.inputPlaceholder}
        cancelText={modalState.cancelText}
        confirmText={modalState.confirmText}
        onConfirm={modalState.onConfirm || (() => closeModal())}
      />
    </div>
  );
};