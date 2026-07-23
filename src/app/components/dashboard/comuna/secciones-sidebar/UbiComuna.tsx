"use client";

import React, { useState, useRef, useEffect, useMemo, useCallback } from "react";
import dynamic from "next/dynamic";
import { 
  MapPin, 
  Shield, 
  LocateFixed, 
  Map as MapIcon, 
  Save, 
  Compass,
  Layers,
  ArrowUpRight,
  Loader2,
  AlertCircle,
  Lock,
  Home,
  ArrowLeft,
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

interface ConsejoUbicacion {
  id_consejo: number;
  nombre_consejo: string;
  latitud: string | null;
  longitud: string | null;
  enlace_maps: string | null;
  limite_norte: string | null;
  limite_sur: string | null;
  limite_este: string | null;
  limite_oeste: string | null;
}

// Componente del mapa (memoizado, sin cambios de estilo)
const MapContent = React.memo(({ coordinates, setCoordinates, setHasLocation, hasLocation, readOnly }: any) => {
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

  const poligonalCoords: [number, number][] = useMemo(() => [
    [coordinates.lat + 0.0005, coordinates.lng + 0.0005],
    [coordinates.lat - 0.0005, coordinates.lng + 0.0005],
    [coordinates.lat - 0.0005, coordinates.lng - 0.0005],
    [coordinates.lat + 0.0005, coordinates.lng - 0.0005],
  ], [coordinates.lat, coordinates.lng]);

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
            <Popup>{readOnly ? "Consejo seleccionado" : "Centro de la Comuna"}</Popup>
          </Marker>
          <Polygon 
            pathOptions={{ color: '#E11D48', weight: 2, fillOpacity: 0.1, dashArray: '5, 5' }} 
            positions={poligonalCoords} 
          />
        </>
      )}
    </MapContainer>
  );
});

MapContent.displayName = 'MapContent';

const LeafletMap = dynamic(() => Promise.resolve(MapContent), {
  ssr: false,
  loading: () => (
    <div className="h-full w-full flex items-center justify-center bg-slate-50">
      <p className="text-[8px] font-black text-slate-400 uppercase italic">Cargando Mapa...</p>
    </div>
  ),
});

const PAGE_SIZE = 10;

interface UbiComunaProps {
  onBack?: () => void;
  onNavigate?: (section: string) => void;
}

export const UbiComuna = ({ onBack, onNavigate }: UbiComunaProps) => {
  const { user } = useAuth();
  const [mounted, setMounted] = useState(false);
  const [comunaId, setComunaId] = useState<number | null>(null);
  const [noComuna, setNoComuna] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [coordinates, setCoordinates] = useState<Coordinates>({ lat: 10.3496, lng: -66.9845 });
  const [hasLocation, setHasLocation] = useState(false);
  const [isRegistered, setIsRegistered] = useState(false);
  const [comunaCoordinates, setComunaCoordinates] = useState<Coordinates | null>(null);
  const [limitesComuna, setLimitesComuna] = useState({
    norte: "",
    sur: "",
    este: "",
    oeste: ""
  });
  const [isViewingConsejo, setIsViewingConsejo] = useState(false);
  const [consejoSeleccionado, setConsejoSeleccionado] = useState<ConsejoUbicacion | null>(null);
  const [consejoLimites, setConsejoLimites] = useState({
    norte: "",
    sur: "",
    este: "",
    oeste: ""
  });
  const [consejosComuna, setConsejosComuna] = useState<ConsejoUbicacion[]>([]);
  const [loadingConsejos, setLoadingConsejos] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const initialLoadDone = useRef(false);
  const isLoadingRef = useRef(false);

  // Estados para AlertModal
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

  const showConfirm = (title: string, message: string, onConfirm: () => void) => {
    setModalState({
      ...modalState,
      isOpen: true,
      title,
      message,
      type: 'warning',
      showInput: false,
      onConfirm: () => { onConfirm(); setModalState(prev => ({ ...prev, isOpen: false })); },
      confirmText: 'Sí, continuar',
      cancelText: 'Cancelar',
    });
  };

  const closeModal = () => setModalState(prev => ({ ...prev, isOpen: false }));

  // Ocultar sidebar cuando el modal de alerta está abierto
  useEffect(() => {
    if (modalState.isOpen) {
      document.body.classList.add('modal-open');
    } else {
      document.body.classList.remove('modal-open');
    }
    return () => document.body.classList.remove('modal-open');
  }, [modalState.isOpen]);

  // Datos paginados
  const totalConsejos = consejosComuna.length;
  const totalPages = Math.ceil(totalConsejos / PAGE_SIZE);
  const paginatedConsejos = useMemo(() => {
    const start = (currentPage - 1) * PAGE_SIZE;
    return consejosComuna.slice(start, start + PAGE_SIZE);
  }, [consejosComuna, currentPage]);

  useEffect(() => {
    setMounted(true);
  }, []);

  const loadAllData = useCallback(async () => {
    if (!user?.id) {
      setLoading(false);
      return;
    }
    if (isLoadingRef.current) return;
    isLoadingRef.current = true;

    try {
      setLoading(true);
      // 1. Verificar si el usuario tiene comuna registrada
      const { data: comunaData, error: comunaError } = await supabase
        .from('datos_comuna')
        .select('id_comuna')
        .or(`id_usuario.eq.${user.id},id_usuario_auxiliar.eq.${user.id}`)
        .maybeSingle();

      if (comunaError || !comunaData) {
        if (comunaError) console.error('Error obteniendo comuna:', comunaError);
        setNoComuna(true);
        setComunaId(null);
        setLoading(false);
        return;
      }

      const idComuna = comunaData.id_comuna;
      setComunaId(idComuna);
      setNoComuna(false);

      // 2. Llamar a la RPC
      const { data: rpcData, error: rpcError } = await supabase.rpc('get_comuna_data', {
        p_user_id: user.id,
      });

      if (rpcError) {
        console.error('Error en RPC:', rpcError);
        showAlert('Error cargando datos', 'No se pudieron obtener los detalles de la comuna. Intenta recargar.', 'danger');
        setLoading(false);
        return;
      }

      // Procesar ubicación de la comuna
      if (rpcData?.ubicacion_comuna) {
        const ub = rpcData.ubicacion_comuna;
        const lat = parseFloat(ub.latitud);
        const lng = parseFloat(ub.longitud);
        if (!isNaN(lat) && !isNaN(lng)) {
          const comunaCoord = { lat, lng };
          setComunaCoordinates(comunaCoord);
          setCoordinates(comunaCoord);
          setHasLocation(true);
        }
        setLimitesComuna({
          norte: ub.limite_norte || '',
          sur: ub.limite_sur || '',
          este: ub.limite_este || '',
          oeste: ub.limite_oeste || '',
        });
        setIsRegistered(true);
      } else {
        setIsRegistered(false);
      }

      // Procesar consejos
      const consejosData = rpcData?.consejos || [];
      const ubicacionesConsejos = rpcData?.ubicaciones_consejos || [];
      const consejosConUbicacion = consejosData.map((consejo: any) => {
        const ub = ubicacionesConsejos.find((u: any) => u.id_consejo === consejo.id_consejo);
        return {
          id_consejo: consejo.id_consejo,
          nombre_consejo: consejo.nombre_consejo,
          latitud: ub?.latitud ? ub.latitud.toString() : null,
          longitud: ub?.longitud ? ub.longitud.toString() : null,
          enlace_maps: ub?.enlace_maps || null,
          limite_norte: ub?.limite_norte || null,
          limite_sur: ub?.limite_sur || null,
          limite_este: ub?.limite_este || null,
          limite_oeste: ub?.limite_oeste || null,
        };
      });
      setConsejosComuna(consejosConUbicacion);
    } catch (err) {
      console.error('Error general:', err);
      showAlert('Error inesperado', 'Ocurrió un problema al cargar los datos.', 'danger');
    } finally {
      setLoading(false);
      setLoadingConsejos(false);
      isLoadingRef.current = false;
    }
  }, [user]); // user es la única dependencia externa

  // useEffect para cargar datos al montar y cuando user cambie
  useEffect(() => {
    if (user?.id && !initialLoadDone.current) {
      initialLoadDone.current = true;
      loadAllData();
    }
    // Si user se vuelve null, reiniciamos el flag para permitir recarga cuando vuelva a haber user
    if (!user?.id) {
      initialLoadDone.current = false;
      setNoComuna(false);
      setComunaId(null);
      setLoading(true);
    }
  }, [user, loadAllData]);

  const handleLocateMe = useCallback(() => {
    if (isRegistered) return;
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords;
          setCoordinates({ lat: latitude, lng: longitude });
          setHasLocation(true);
        },
        () => showAlert("Error de geolocalización", "No se pudo obtener la ubicación.", "warning"),
        { enableHighAccuracy: true }
      );
    } else {
      showAlert("No soportado", "Tu navegador no soporta geolocalización.", "danger");
    }
  }, [isRegistered]);

  const handleCenterComuna = useCallback(() => {
    if (comunaCoordinates) {
      setCoordinates(comunaCoordinates);
      setHasLocation(true);
      setIsViewingConsejo(false);
      setConsejoSeleccionado(null);
      setCurrentPage(1);
    } else {
      showAlert("Sin ubicación", "La comuna aún no tiene una ubicación registrada.", "warning");
    }
  }, [comunaCoordinates]);

  const handleSave = async () => {
    if (isRegistered) {
      showAlert("Configuración bloqueada", "La configuración ya ha sido guardada. No se puede modificar.", "info");
      return;
    }
    if (!comunaId) {
      showAlert("Error", "Comuna no identificada", "danger");
      return;
    }
    if (!hasLocation) {
      showAlert("Falta ubicación", "Primero marca la ubicación en el mapa", "warning");
      return;
    }
    if (!limitesComuna.norte || !limitesComuna.sur || !limitesComuna.este || !limitesComuna.oeste) {
      showAlert("Límites incompletos", "Completa todos los límites", "warning");
      return;
    }
    setSaving(true);
    const enlaceMaps = `https://www.openstreetmap.org/?mlat=${coordinates.lat}&mlon=${coordinates.lng}`;

    const { error } = await supabase
      .from('ubicacion_comuna')
      .insert({
        id_comuna: comunaId,
        latitud: coordinates.lat.toString(),
        longitud: coordinates.lng.toString(),
        enlace_maps: enlaceMaps,
        limite_norte: limitesComuna.norte,
        limite_sur: limitesComuna.sur,
        limite_este: limitesComuna.este,
        limite_oeste: limitesComuna.oeste
      });

    if (error) {
      console.error("Error guardando ubicación:", error);
      showAlert("Error", "No se pudo guardar la ubicación", "danger");
    } else {
      showAlert("Guardado", "Ubicación guardada correctamente", "success");
      setIsRegistered(true);
      setComunaCoordinates({ lat: coordinates.lat, lng: coordinates.lng });
    }
    setSaving(false);
  };

  const focusConsejo = useCallback((consejo: ConsejoUbicacion) => {
    if (consejo.latitud && consejo.longitud) {
      const lat = parseFloat(consejo.latitud);
      const lng = parseFloat(consejo.longitud);
      if (!isNaN(lat) && !isNaN(lng)) {
        setCoordinates({ lat, lng });
        setHasLocation(true);
        setIsViewingConsejo(true);
        setConsejoSeleccionado(consejo);
        setConsejoLimites({
          norte: consejo.limite_norte || "",
          sur: consejo.limite_sur || "",
          este: consejo.limite_este || "",
          oeste: consejo.limite_oeste || ""
        });
      } else {
        showAlert("Coordenadas inválidas", "El consejo tiene coordenadas incorrectas.", "warning");
      }
    } else {
      showAlert("Sin coordenadas", "Este consejo no tiene ubicación registrada.", "warning");
    }
  }, []);

  const handleLimitesChange = useCallback((key: string, value: string) => {
    if (!isViewingConsejo && !isRegistered) {
      setLimitesComuna(prev => ({ ...prev, [key]: value }));
    }
  }, [isViewingConsejo, isRegistered]);

  const volverALimitesComuna = useCallback(() => {
    setIsViewingConsejo(false);
    setConsejoSeleccionado(null);
    if (comunaCoordinates) {
      setCoordinates(comunaCoordinates);
      setHasLocation(true);
    }
    setCurrentPage(1);
  }, [comunaCoordinates]);

  const currentLimites = isViewingConsejo ? consejoLimites : limitesComuna;
  const limitesDisabled = isViewingConsejo || (isRegistered && !isViewingConsejo);
  const panelesTitle = isViewingConsejo 
    ? `Límites del consejo: ${consejoSeleccionado?.nombre_consejo}` 
    : "Límites de la Comuna";

  if (loading) {
    return <div className="flex justify-center p-12"><Loader2 className="animate-spin text-brand-primary" size={32} /></div>;
  }

      if (noComuna) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center p-8 bg-white rounded-3xl border border-gray-100 shadow-sm">
        <div className="h-20 w-20 rounded-full bg-amber-100 flex items-center justify-center mb-6">
          <AlertCircle className="h-10 w-10 text-amber-600" />
        </div>
        <h3 className="text-xl font-black text-slate-800 uppercase tracking-tighter mb-2">
          Aún no has registrado tu Comuna
        </h3>
        <p className="text-slate-500 max-w-md mb-8">
          Para acceder a las estadísticas y funcionalidades del dashboard, primero debes completar los datos legales de tu comuna.
        </p>
        <button
          onClick={() => onNavigate?.("documentacion")}
          className="px-8 py-3 bg-brand-primary text-white rounded-xl font-black text-sm shadow-lg hover:scale-[1.02] transition-all flex items-center gap-2"
        >
          <FileCheck className="h-4 w-4" />
          Completar Datos Legales
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-5 relative">
      {/* Header con título y botón volver */}
      <div>
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-2">
          <div>
            <h2 className="text-base font-black text-slate-800 italic uppercase tracking-tighter flex items-center gap-2">
              <LocateFixed className="h-5 w-5 text-brand-primary" /> Ubicación Geográfica y Límites
            </h2>
            <p className="text-[9px] font-bold text-slate-400 uppercase tracking-[0.15em] mt-0.5">
              Gestión de la "Poligonal Inteligente" y Delimitación Territorial
            </p>
          </div>
          {!isRegistered && !isViewingConsejo ? (
            <button 
              onClick={handleSave}
              disabled={saving}
              className="flex items-center justify-center gap-1.5 px-3 py-1.5 bg-brand-primary hover:bg-brand-primary/90 text-white rounded-lg font-black text-[9px] uppercase tracking-wider transition-all shadow-md active:scale-95 disabled:opacity-50"
            >
              {saving ? <Loader2 className="h-3 w-3 animate-spin" /> : <Save className="h-3 w-3" />}
              Guardar
            </button>
          ) : (!isViewingConsejo && (
            <div className="flex items-center gap-1.5 px-3 py-1.5 bg-gray-100 text-slate-500 rounded-lg font-black text-[9px] uppercase tracking-wider">
              <Lock className="h-3 w-3" />
              Bloqueado
            </div>
          ))}
        </div>
        {onBack && (
          <button
            onClick={onBack}
            className="mt-3 text-brand-primary hover:text-brand-primary/80 text-[9px] font-bold uppercase tracking-wider flex items-center gap-1 transition-colors"
          >
            <ArrowLeft className="h-3 w-3" />
            Volver a Datos Legales
          </button>
        )}
      </div>

      <div className="grid lg:grid-cols-12 gap-5 items-start">
        {/* Mapa */}
        <div className="lg:col-span-8 space-y-5">
          <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-1.5">
                <Compass className="h-4 w-4 text-brand-primary" />
                <h3 className="text-xs font-black text-slate-800 italic uppercase tracking-tighter">Vista Satelital</h3>
              </div>
              <div className="flex gap-1.5">
                {comunaCoordinates && (
                  <button
                    onClick={handleCenterComuna}
                    className="flex items-center gap-1.5 px-2.5 py-1.5 bg-emerald-600 text-white rounded-lg font-black text-[8px] uppercase tracking-wider shadow-sm hover:scale-105 transition-all"
                  >
                    <Home className="h-2.5 w-2.5" />
                    Comuna
                  </button>
                )}
                <button
                  onClick={handleLocateMe}
                  disabled={isRegistered}
                  className="flex items-center gap-1.5 px-2.5 py-1.5 bg-blue-600 text-white rounded-lg font-black text-[8px] uppercase tracking-wider shadow-sm hover:scale-105 transition-all disabled:opacity-50"
                >
                  <Compass className="h-2.5 w-2.5" />
                  GPS
                </button>
              </div>
            </div>
            <div className="aspect-video rounded-xl bg-slate-100 border-2 border-white shadow-inner overflow-hidden relative group">
              {mounted && (
                <LeafletMap 
                  coordinates={coordinates} 
                  setCoordinates={setCoordinates} 
                  setHasLocation={setHasLocation} 
                  hasLocation={hasLocation}
                  readOnly={isRegistered || isViewingConsejo}
                />
              )}
              <div className="absolute top-2 left-2 py-1 px-2 bg-white/90 backdrop-blur-sm rounded-md border border-gray-100 shadow-sm z-400">
                <div className="flex items-center gap-1.5">
                  <div className={cn("h-1 w-1 rounded-full", hasLocation ? "bg-green-500" : "bg-red-500")} />
                  <span className="text-[8px] font-black text-slate-800 uppercase tracking-tighter">
                    {hasLocation ? "Fijado" : "Pendiente"}
                  </span>
                </div>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3 mt-4">
              <div className="p-2 rounded-lg bg-gray-50 border border-gray-100">
                <p className="text-[8px] font-bold text-slate-400 uppercase tracking-wider mb-0.5">Coordenadas</p>
                <p className="text-[10px] font-black text-slate-800 truncate">
                  {hasLocation ? `${coordinates.lat.toFixed(6)}, ${coordinates.lng.toFixed(6)}` : "No seleccionadas"}
                </p>
              </div>
              <div className="p-2 rounded-lg bg-gray-50 border border-gray-100">
                <p className="text-[8px] font-bold text-slate-400 uppercase tracking-wider mb-0.5">Enlace Maps</p>
                {hasLocation ? (
                  <a 
                    href={`https://www.openstreetmap.org/?mlat=${coordinates.lat}&mlon=${coordinates.lng}`} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-[9px] font-black text-brand-primary underline truncate block"
                  >
                    Ver en OpenStreetMap
                  </a>
                ) : (
                  <p className="text-[10px] font-black text-slate-800">--</p>
                )}
              </div>
            </div>
          </div>

          {/* Lista de consejos de la comuna con paginación reducida */}
          <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm">
            <div className="flex items-center justify-between gap-2 mb-3">
              <div className="flex items-center gap-1.5">
                <Layers className="h-4 w-4 text-brand-primary" />
                <h3 className="text-xs font-black text-slate-800 italic uppercase tracking-tighter">Consejos de tu Comuna</h3>
              </div>
              {totalPages > 1 && (
                <div className="text-[9px] text-slate-400">Página {currentPage} de {totalPages}</div>
              )}
            </div>
            {loadingConsejos ? (
              <div className="flex justify-center py-4"><Loader2 className="animate-spin text-brand-primary" size={20} /></div>
            ) : consejosComuna.length === 0 ? (
              <div className="text-center py-4 text-slate-400 text-[10px]">No hay consejos registrados en tu comuna.</div>
            ) : (
              <>
                <div className="grid gap-2">
                  {paginatedConsejos.map((consejo) => (
                    <div key={consejo.id_consejo} className="flex items-center justify-between p-2 bg-gray-50 rounded-lg border border-gray-100 hover:bg-white hover:shadow-sm transition-all group">
                      <div className="flex items-center gap-2">
                        <div className="h-7 w-7 rounded-md bg-white flex items-center justify-center text-brand-primary shadow-sm">
                          <MapPin className="h-3.5 w-3.5" />
                        </div>
                        <div>
                          <p className="text-[10px] font-black text-slate-800 uppercase italic">{consejo.nombre_consejo}</p>
                          {consejo.latitud && consejo.longitud ? (
                            <p className="text-[8px] font-bold text-slate-400 uppercase tracking-wider">
                              {parseFloat(consejo.latitud).toFixed(4)}, {parseFloat(consejo.longitud).toFixed(4)}
                            </p>
                          ) : (
                            <p className="text-[8px] font-bold text-amber-500 uppercase tracking-wider flex items-center gap-0.5">
                              <AlertCircle className="h-2 w-2" /> Sin coordenadas
                            </p>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <button 
                          onClick={() => focusConsejo(consejo)}
                          disabled={!consejo.latitud || !consejo.longitud}
                          className={cn(
                            "p-1 rounded-md bg-white border border-gray-100 transition-all",
                            (consejo.latitud && consejo.longitud) 
                              ? "text-slate-400 hover:text-brand-primary hover:border-brand-primary/20 cursor-pointer" 
                              : "text-slate-300 cursor-not-allowed disabled:opacity-50"
                          )}
                        >
                          <ArrowUpRight className="h-3 w-3" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
                {totalPages > 1 && (
                  <div className="flex justify-between items-center mt-3 pt-2 border-t border-gray-100">
                    <button
                      onClick={() => setCurrentPage(p => Math.max(1, p-1))}
                      disabled={currentPage === 1}
                      className="px-2 py-1 text-[8px] font-black text-slate-500 bg-gray-100 rounded-md disabled:opacity-40 hover:bg-gray-200 transition-all"
                    >
                      Anterior
                    </button>
                    <span className="text-[8px] text-slate-400">{currentPage} / {totalPages}</span>
                    <button
                      onClick={() => setCurrentPage(p => Math.min(totalPages, p+1))}
                      disabled={currentPage === totalPages}
                      className="px-2 py-1 text-[8px] font-black text-slate-500 bg-gray-100 rounded-md disabled:opacity-40 hover:bg-gray-200 transition-all"
                    >
                      Siguiente
                    </button>
                  </div>
                )}
              </>
            )}
          </div>
        </div>

        {/* Límites (panel derecho reducido) */}
        <div className="lg:col-span-4 space-y-4 bg-white p-4 rounded-xl border border-gray-100 shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-1.5">
              <div className="h-5 w-5 rounded-md bg-brand-primary/10 flex items-center justify-center">
                <MapIcon className="h-3 w-3 text-brand-primary" />
              </div>
              <h3 className="text-xs font-black text-slate-800 italic uppercase tracking-tighter">
                {panelesTitle}
              </h3>
            </div>
            {isViewingConsejo && (
              <button
                onClick={volverALimitesComuna}
                className="flex items-center gap-0.5 px-2 py-1 bg-gray-100 text-slate-600 rounded-md text-[8px] font-black uppercase hover:bg-gray-200 transition-all"
              >
                <ArrowLeft className="h-2.5 w-2.5" /> Volver
              </button>
            )}
          </div>
          <div className="space-y-3">
            {[
              { key: "norte", label: "Punto Norte" },
              { key: "sur", label: "Punto Sur" },
              { key: "este", label: "Punto Este" },
              { key: "oeste", label: "Punto Oeste" }
            ].map((limit) => (
              <div key={limit.key} className="space-y-0.5">
                <label className="text-[8px] font-black text-slate-400 uppercase tracking-wider ml-0.5">
                  {limit.label}
                </label>
                <input 
                  type="text" 
                  value={currentLimites[limit.key as keyof typeof currentLimites]}
                  onChange={(e) => handleLimitesChange(limit.key, e.target.value)}
                  placeholder={`Referencia del ${limit.key}...`}
                  className={cn(
                    "w-full p-2 rounded-lg bg-gray-50 border-none ring-1 ring-gray-100 outline-none text-[10px] font-bold",
                    limitesDisabled && "bg-gray-100 text-slate-400 cursor-not-allowed"
                  )}
                  disabled={limitesDisabled}
                />
              </div>
            ))}
          </div>
          <div className="p-3 rounded-lg bg-brand-primary/5 border border-brand-primary/10">
            <div className="flex items-center gap-1.5 mb-0.5">
              <Shield className="h-3 w-3 text-brand-primary" />
              <span className="text-[8px] font-black text-brand-primary uppercase">Validación Territorial</span>
            </div>
            <p className="text-[9px] font-bold text-slate-600 leading-tight">
              {isViewingConsejo 
                ? "Límites registrados por el consejo correspondiente." 
                : "Los límites deben coincidir con el acta constitutiva de la Comuna."}
            </p>
          </div>
        </div>
      </div>

      {/* AlertModal global */}
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