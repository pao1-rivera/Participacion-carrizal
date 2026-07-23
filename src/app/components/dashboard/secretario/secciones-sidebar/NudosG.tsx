// app/components/dashboard/secretario/secciones-sidebar/NudosG.tsx
'use client';
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import dynamic from 'next/dynamic';
import { AlertCircle, Loader2, ChevronLeft, ChevronRight } from 'lucide-react';
import { cn } from '@/app/lib/utils';
import { supabase } from '@/app/lib/supabaseClient';
import { useAuth } from '@/context/AuthContext';
import { AlertModal } from "@/app/components/AlertModal";

import 'leaflet/dist/leaflet.css';

interface Nudo {
  id: string;
  id_real: number;
  tabla: 'consejo' | 'comuna';
  titulo: string;
  gravedad: string;
  estado: string;      
  latitud: number | null;
  longitud: number | null;
}

// 🔥 Función corregida para normalizar la gravedad
const normalizarGravedad = (gravedad: string | null | undefined): string => {
  if (!gravedad) return 'Baja';
  const g = gravedad.toLowerCase().trim();
  // Detectar "Alto/Crítico" o cualquier variante que contenga "alto" o "crítico"
  if (g.includes('alto') || g.includes('crítico')) return 'Alta';
  if (g === 'medio' || g === 'media') return 'Media';
  if (g === 'bajo' || g === 'baja') return 'Baja';
  // Si no coincide, devolver 'Baja' por defecto
  return 'Baja';
};

// Componente de mapa con círculos de tamaño variable (efecto calor)
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
            <div><span style="background:#ef4444; width:12px;height:12px;display:inline-block;border-radius:50%;"></span> Alta (crítica)</div>
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
            if (p.gravedad === 'Alta') {
              radius = 20;
              color = '#ef4444';
              fillOpacity = 0.7;
            } else if (p.gravedad === 'Media') {
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
                    <p className="text-[9px] text-slate-500 mt-1">Gravedad: {p.gravedad}</p>
                    <p className="text-[8px] text-slate-400 capitalize">Estado: {p.estado}</p>
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

export const NudosG = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [nudos, setNudos] = useState<Nudo[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const [modalState, setModalState] = useState({
    isOpen: false,
    title: '',
    message: '',
    type: 'info' as any,
    showInput: false,
    inputPlaceholder: '',
    onConfirm: null as ((value?: string) => void) | null,
    cancelText: 'Cancelar',
    confirmText: 'Aceptar',
  });

  const showAlert = (title: string, message: string, type?: any) => {
    setModalState({ ...modalState, isOpen: true, title, message, type: type || 'info', showInput: false, onConfirm: null });
  };
  const closeModalAlert = () => setModalState(prev => ({ ...prev, isOpen: false }));

  // Cargar nudos (normalizando gravedad)
  const cargarNudos = useCallback(async () => {
    setLoading(true);
    try {
      // Tabla consejo
      const { data: consejoNudos, error: err1 } = await supabase
        .from('nudos_criticos')
        .select('id_nudo, titulo, gravedad, estado, latitud, longitud')
        .order('created_at', { ascending: false });
      if (err1) throw err1;

      // Tabla comuna (incluimos estado aunque no exista, se asigna 'activo' por defecto)
      const { data: comunaNudos, error: err2 } = await supabase
        .from('nudos_criticos_comuna')
        .select('id_nudo_comuna, titulo, gravedad, latitud, longitud')
        .order('created_at', { ascending: false });
      if (err2) throw err2;

      const unificados: Nudo[] = [
        ...(consejoNudos || []).map((n: any) => ({
          id: `consejo-${n.id_nudo}`,
          id_real: n.id_nudo,
          tabla: 'consejo' as const,
          titulo: n.titulo,
          gravedad: normalizarGravedad(n.gravedad),
          estado: n.estado || 'activo',
          latitud: n.latitud,
          longitud: n.longitud,
        })),
        ...(comunaNudos || []).map((n: any) => ({
          id: `comuna-${n.id_nudo_comuna}`,
          id_real: n.id_nudo_comuna,
          tabla: 'comuna' as const,
          titulo: n.titulo,
          gravedad: normalizarGravedad(n.gravedad),
          estado: 'activo', // la tabla comuna no tiene campo estado
          latitud: n.latitud || null,
          longitud: n.longitud || null,
        })),
      ];
      setNudos(unificados);
    } catch (error) {
      console.error(error);
      showAlert('Error', 'No se pudieron cargar los nudos críticos', 'danger');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    cargarNudos();
  }, [cargarNudos]);

  // Puntos para el mapa (solo con coordenadas)
  const puntosMapa = useMemo(() => {
    return nudos.filter(n => n.latitud && n.longitud);
  }, [nudos]);

  // Caracterizaciones (ahora con gravedad normalizada)
  const caracterizaciones = useMemo(() => {
    const total = nudos.length;
    const alta = nudos.filter(n => n.gravedad === 'Alta').length;
    const media = nudos.filter(n => n.gravedad === 'Media').length;
    const baja = nudos.filter(n => n.gravedad === 'Baja').length;
    return { total, alta, media, baja };
  }, [nudos]);

  // Paginación
  const totalPages = Math.ceil(nudos.length / itemsPerPage);
  const currentNudos = nudos.slice((currentPage-1)*itemsPerPage, currentPage*itemsPerPage);

  if (loading) return <div className="flex justify-center p-12"><Loader2 className="animate-spin text-brand-primary" size={32} /></div>;
  if (errorMsg && nudos.length === 0) return (
    <div className="bg-amber-50 border border-amber-200 rounded-2xl p-8 text-center">
      <AlertCircle className="h-8 w-8 text-amber-500 mx-auto mb-2" />
      <p className="text-sm font-bold text-amber-700">{errorMsg}</p>
    </div>
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row gap-6">
        {/* Columna izquierda: caracterizaciones + listado */}
        <div className="md:w-2/3 lg:w-7/12 space-y-4">
          {/* Tarjetas de caracterización */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="bg-white rounded-xl border p-3 text-center shadow-sm">
              <div className="text-2xl font-black text-brand-primary">{caracterizaciones.total}</div>
              <div className="text-xs text-gray-500">Total nudos</div>
            </div>
            <div className="bg-white rounded-xl border p-3 text-center shadow-sm">
              <div className="text-2xl font-black text-red-600">{caracterizaciones.alta}</div>
              <div className="text-xs text-gray-500">Alta gravedad</div>
            </div>
            <div className="bg-white rounded-xl border p-3 text-center shadow-sm">
              <div className="text-2xl font-black text-orange-500">{caracterizaciones.media}</div>
              <div className="text-xs text-gray-500">Media gravedad</div>
            </div>
            <div className="bg-white rounded-xl border p-3 text-center shadow-sm">
              <div className="text-2xl font-black text-yellow-600">{caracterizaciones.baja}</div>
              <div className="text-xs text-gray-500">Baja gravedad</div>
            </div>
          </div>

          {/* Listado */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
            <div className="p-3 bg-brand-primary text-white">
              <h3 className="font-black uppercase text-[10px]">Listado de Nudos Críticos</h3>
            </div>
            <div className="divide-y divide-gray-100 max-h-[500px] overflow-y-auto">
              {currentNudos.length === 0 ? (
                <div className="p-6 text-center text-gray-400 text-sm">No hay nudos registrados</div>
              ) : (
                currentNudos.map((n) => (
                  <div key={n.id} className="p-3 hover:bg-gray-50/50 transition-colors">
                    <div className="flex justify-between items-center">
                      <div>
                        <div className="font-bold text-sm">{n.titulo}</div>
                        <div className="flex items-center gap-2 mt-1">
                          <div className={cn(
                            "w-2 h-2 rounded-full",
                            n.gravedad === 'Alta' ? 'bg-red-500' : n.gravedad === 'Media' ? 'bg-orange-500' : 'bg-yellow-500'
                          )} />
                          <span className="text-xs capitalize">{n.gravedad}</span>
                          <span className="text-xs text-gray-400">•</span>
                          <span className="text-xs capitalize">{n.estado}</span>
                        </div>
                      </div>
                      <span className={cn(
                        "text-[8px] font-bold px-1.5 py-0.5 rounded-full",
                        n.tabla === 'consejo' ? "bg-blue-100 text-blue-700" : "bg-emerald-100 text-emerald-700"
                      )}>
                        {n.tabla === 'consejo' ? 'CC' : 'C'}
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>
            {totalPages > 1 && (
              <div className="p-3 flex justify-between items-center border-t">
                <span className="text-[9px]">Página {currentPage} de {totalPages}</span>
                <div className="flex gap-1">
                  <button
                    onClick={() => setCurrentPage(p => Math.max(1, p-1))}
                    disabled={currentPage === 1}
                    className="p-1 border border-brand-primary text-brand-primary rounded hover:bg-brand-primary hover:text-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <ChevronLeft size={14} />
                  </button>
                  <button
                    onClick={() => setCurrentPage(p => Math.min(totalPages, p+1))}
                    disabled={currentPage === totalPages}
                    className="p-1 border border-brand-primary text-brand-primary rounded hover:bg-brand-primary hover:text-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <ChevronRight size={14} />
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Columna derecha: mapa con círculos de calor */}
        <div className="md:w-1/3 lg:w-5/12">
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden sticky top-4">
            <div className="p-3 bg-gray-50 border-b text-[10px] font-black uppercase">Mapa de calor - Nudos críticos</div>
            {puntosMapa.length > 0 ? (
              <MapComponent puntos={puntosMapa} height="380px" />
            ) : (
              <div className="h-80 flex items-center justify-center bg-gray-50 text-gray-400 text-sm">
                No hay ubicaciones disponibles
              </div>
            )}
          </div>
        </div>
      </div>

      <AlertModal isOpen={modalState.isOpen} onClose={closeModalAlert} title={modalState.title} message={modalState.message} type={modalState.type} showInput={modalState.showInput} inputPlaceholder={modalState.inputPlaceholder} cancelText={modalState.cancelText} confirmText={modalState.confirmText} onConfirm={modalState.onConfirm || (() => closeModalAlert())} />
    </div>
  );
};