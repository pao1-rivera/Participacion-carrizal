// app/components/dashboard/secretario/secciones-sidebar/ProyectosG.tsx
'use client';
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import dynamic from 'next/dynamic';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  TrendingUp, MapPin, Users, Home, FileText, Image, 
  Loader2, ChevronLeft, ChevronRight, Eye, Calendar, DollarSign, AlertCircle, X
} from 'lucide-react';
import { cn } from '@/app/lib/utils';
import { supabase } from '@/app/lib/supabaseClient';
import { useAuth } from '@/context/AuthContext';
import { AlertModal } from "@/app/components/AlertModal";

import 'leaflet/dist/leaflet.css';

interface Proyecto {
  id: string;
  id_real: number;
  tabla: 'consejo' | 'comuna';
  nombre: string;
  categoria_7t: string;
  presupuesto: number | null;
  ente_financiamiento: string | null;
  beneficiarios_familias: number | null;
  diagnostico: string | null;
  estado: string;
  progreso: number;
  acta_url: string | null;
  fotos_antes_urls: string[];
  created_at: string;
  codigo?: string;
  desc_antes?: string;
  desc_durante?: string;
  desc_despues?: string;
  foto_antes_url?: string;
  foto_durante_url?: string;
  foto_despues_url?: string;
  fecha_antes?: string;
  fecha_durante?: string;
  fecha_despues?: string;
  respuesta?: string;
  fecha_respuesta?: string;
  requerimientos?: string;
  duracion?: string;
  tecnico_nombre?: string;
  tecnico_apellido?: string;
  tecnico_cedula?: string;
  latitud?: number | null;
  longitud?: number | null;
}

// Mapa con marcadores coloreados según estado
const MapComponent = dynamic(
  () => import('react-leaflet').then((module) => {
    const { MapContainer, TileLayer, Marker, Popup, Tooltip } = module;
    const L = require('leaflet');

    delete L.Icon.Default.prototype._getIconUrl;
    L.Icon.Default.mergeOptions({
      iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
      iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
      shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
    });

    const getMarkerIcon = (estado: string) => {
      let color;
      switch (estado) {
        case 'Ejecución': color = '#f97316'; break;
        case 'Finalizado': color = '#10b981'; break;
        case 'Aprobado': color = '#3b82f6'; break;
        case 'Suspendido': color = '#ef4444'; break;
        default: color = '#6b7280'; break;
      }
      return L.divIcon({
        className: 'custom-marker',
        html: `<div style="background-color: ${color}; width: 24px; height: 24px; border-radius: 50%; border: 2px solid white; box-shadow: 0 2px 6px rgba(0,0,0,0.3); display: flex; align-items: center; justify-content: center; font-size: 10px; font-weight: bold; color: white;">P</div>`,
        iconSize: [24, 24],
        iconAnchor: [12, 12],
        popupAnchor: [0, -12]
      });
    };

    const MapContent = ({ puntos }: { puntos: Proyecto[] }) => {
      const center: [number, number] = puntos.length && puntos[0].latitud && puntos[0].longitud 
  ? [puntos[0].latitud, puntos[0].longitud] 
  : [10.3496, -66.9845];
      return (
        <MapContainer center={center} zoom={13} style={{ height: '320px', width: '100%' }} scrollWheelZoom={true}>
          <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
          {puntos.map((p) => {
            if (!p.latitud || !p.longitud) return null;
            return (
              <Marker
                key={p.id}
                position={[p.latitud, p.longitud]}
                icon={getMarkerIcon(p.estado)}
              >
                <Popup>
                  <div className="p-2 min-w-48">
                    <h4 className="font-black text-xs uppercase">{p.nombre}</h4>
                    <p className="text-[9px] font-bold mt-1">{p.categoria_7t}</p>
                    <p className="text-[8px] text-slate-500 mt-1">Estado: {p.estado}</p>
                    <p className="text-[8px] text-slate-500">Progreso: {p.progreso}%</p>
                  </div>
                </Popup>
                <Tooltip direction="top" offset={[0, -12]} opacity={0.9} sticky>
                  <span className="text-[9px] font-black">{p.nombre}</span>
                </Tooltip>
              </Marker>
            );
          })}
        </MapContainer>
      );
    };
    return MapContent;
  }),
  { ssr: false, loading: () => <div className="h-80 bg-gray-100 flex items-center justify-center"><Loader2 className="animate-spin text-brand-primary" size={32} /></div> }
);

const categorias7T = ['T1: Eco-productiva', 'T2: Seguridad', 'T3: Salud', 'T4: Social', 'T5: Hábitat', 'T6: Ciencia', 'T7: Comunicación'];
const estadosProyecto = ['En Revisión', 'Aprobado', 'En Ejecución', 'Culminado', 'Rechazado'];

export const ProyectosG = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [proyectos, setProyectos] = useState<Proyecto[]>([]);
  const [filterEstado, setFilterEstado] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  
  // Modal de detalles
  const [selectedProject, setSelectedProject] = useState<Proyecto | null>(null);
  const [modalOpen, setModalOpen] = useState(false);

  const [modalState, setModalState] = useState({
    isOpen: false, title: '', message: '', type: 'info' as any,
    showInput: false, inputPlaceholder: '', onConfirm: null as (() => void) | null,
    cancelText: 'Cancelar', confirmText: 'Aceptar'
  });
  const showAlert = (t: string, m: string, ty?: any) => setModalState({ ...modalState, isOpen: true, title: t, message: m, type: ty || 'info', showInput: false, onConfirm: null });
  const closeAlert = () => setModalState(prev => ({ ...prev, isOpen: false }));

  // Efecto para ocultar sidebar cuando la modal está abierta
  useEffect(() => {
    if (modalOpen) {
      document.body.classList.add('modal-open');
    } else {
      document.body.classList.remove('modal-open');
    }
    return () => document.body.classList.remove('modal-open');
  }, [modalOpen]);

  // Obtener ID de entidad (solo para verificar permisos, ya no se crea)
  useEffect(() => {
    const fetchUserEntity = async () => {
      if (!user?.id) {
        setErrorMsg('No hay usuario autenticado');
        setLoading(false);
        return;
      }
      setLoading(false);
    };
    fetchUserEntity();
  }, [user]);

  // Cargar proyectos de ambas tablas
  const cargarProyectos = useCallback(async () => {
    setLoading(true);
    try {
      const { data: consejoProyectos, error: err1 } = await supabase
        .from('proyectos')
        .select('*')
        .order('created_at', { ascending: false });
      if (err1) throw err1;

      const { data: comunaProyectos, error: err2 } = await supabase
        .from('proyectos_comuna')
        .select('*')
        .order('created_at', { ascending: false });
      if (err2) throw err2;

      const unificados: Proyecto[] = [
        ...(consejoProyectos || []).map((p: any) => ({
          id: `consejo-${p.id_proyecto}`,
          id_real: p.id_proyecto,
          tabla: 'consejo' as const,
          nombre: p.nombre,
          categoria_7t: p.categoria_7t,
          presupuesto: p.presupuesto,
          ente_financiamiento: p.ente_financiamiento,
          beneficiarios_familias: p.beneficiarios_familias,
          diagnostico: p.diagnostico,
          estado: p.estado,
          progreso: p.progreso,
          acta_url: p.acta_url,
          fotos_antes_urls: p.fotos_antes_urls || [],
          created_at: p.created_at,
          codigo: p.codigo,
          desc_antes: p.desc_antes,
          desc_durante: p.desc_durante,
          desc_despues: p.desc_despues,
          foto_antes_url: p.foto_antes_url,
          foto_durante_url: p.foto_durante_url,
          foto_despues_url: p.foto_despues_url,
          fecha_antes: p.fecha_antes,
          fecha_durante: p.fecha_durante,
          fecha_despues: p.fecha_despues,
          respuesta: p.respuesta,
          fecha_respuesta: p.fecha_respuesta,
          requerimientos: p.requerimientos,
          duracion: p.duracion,
          tecnico_nombre: p.tecnico_nombre,
          tecnico_apellido: p.tecnico_apellido,
          tecnico_cedula: p.tecnico_cedula,
          latitud: p.latitud,
          longitud: p.longitud,
        })),
        ...(comunaProyectos || []).map((p: any) => ({
          id: `comuna-${p.id_proyecto_comuna}`,
          id_real: p.id_proyecto_comuna,
          tabla: 'comuna' as const,
          nombre: p.nombre,
          categoria_7t: p.categoria_7t,
          presupuesto: p.presupuesto,
          ente_financiamiento: p.ente_financiamiento,
          beneficiarios_familias: p.beneficiarios_familias,
          diagnostico: p.diagnostico,
          estado: p.estado,
          progreso: p.progreso,
          acta_url: p.acta_url,
          fotos_antes_urls: p.fotos_antes_urls || [],
          created_at: p.created_at,
          codigo: p.codigo,
          desc_antes: p.desc_antes,
          desc_durante: p.desc_durante,
          desc_despues: p.desc_despues,
          foto_antes_url: p.foto_antes_url,
          foto_durante_url: p.foto_durante_url,
          foto_despues_url: p.foto_despues_url,
          fecha_antes: p.fecha_antes,
          fecha_durante: p.fecha_durante,
          fecha_despues: p.fecha_despues,
          respuesta: p.respuesta,
          fecha_respuesta: p.fecha_respuesta,
          requerimientos: p.requerimientos,
          duracion: p.duracion,
          tecnico_nombre: p.tecnico_nombre,
          tecnico_apellido: p.tecnico_apellido,
          tecnico_cedula: p.tecnico_cedula,
          latitud: null,
          longitud: null,
        })),
      ];
      setProyectos(unificados);
    } catch (error) {
      console.error(error);
      showAlert('Error', 'No se pudieron cargar los proyectos', 'danger');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    cargarProyectos();
  }, [cargarProyectos]);

  // Puntos para el mapa (solo con coordenadas)
  const puntosMapa = useMemo(() => {
    return proyectos.filter(p => p.latitud && p.longitud);
  }, [proyectos]);

  // Filtros y paginación
  const proyectosFiltrados = useMemo(() => {
    let filtrados = [...proyectos];
    if (filterEstado) filtrados = filtrados.filter(p => p.estado === filterEstado);
    return filtrados;
  }, [proyectos, filterEstado]);

  const totalPages = Math.ceil(proyectosFiltrados.length / itemsPerPage);
  const currentProyectos = proyectosFiltrados.slice((currentPage-1)*itemsPerPage, currentPage*itemsPerPage);

  // Función para abrir modal de detalles
  const viewProject = (proyecto: Proyecto) => {
    setSelectedProject(proyecto);
    setModalOpen(true);
  };

  // 🔥 Función para normalizar la ruta (extrae la parte relativa al bucket)
  const normalizeFilePath = (value: string | null): string | null => {
    if (!value) return null;
    // Si es una URL pública de Supabase, extraer la parte después del bucket
    // Ejemplo: https://.../storage/v1/object/public/rendiciones_comuna/3/proyectos/5/acta.pdf
    // -> 3/proyectos/5/acta.pdf
    const publicPattern = /\/storage\/v1\/object\/public\/[^/]+\/(.+)$/;
    const match = value.match(publicPattern);
    if (match) {
      return match[1];
    }
    // Si ya es ruta relativa (no empieza con http), devolver tal cual
    if (!value.startsWith('http')) {
      return value;
    }
    // Si es otra URL, no podemos manejarla
    return null;
  };

  // 🔥 CORREGIDO: Función para generar URL firmada con normalización y buckets correctos
  const getSignedUrl = async (path: string, tipo: 'consejo' | 'comuna'): Promise<string | null> => {
    const normalized = normalizeFilePath(path);
    if (!normalized) {
      console.error('No se pudo normalizar la ruta:', path);
      return null;
    }
    const bucketName = tipo === 'consejo' ? 'proyectos_docs' : 'rendiciones_comuna';
    try {
      const { data, error } = await supabase.storage.from(bucketName).createSignedUrl(normalized, 3600);
      if (error) {
        console.error('Error al firmar URL:', error);
        return null;
      }
      return data.signedUrl;
    } catch (err) {
      console.error('Error inesperado:', err);
      return null;
    }
  };

  // 🔥 Función para parsear requerimientos como array de objetos
  const parseRequerimientos = (req: string | null): { uso: string; tipo: string; cantidad: string }[] | null => {
    if (!req) return null;
    try {
      const parsed = JSON.parse(req);
      if (Array.isArray(parsed) && parsed.every(item => item.uso && item.tipo && item.cantidad)) {
        return parsed;
      }
      return null;
    } catch {
      return null;
    }
  };

  if (loading) return <div className="flex justify-center p-12"><Loader2 className="animate-spin text-brand-primary" size={32} /></div>;
  if (errorMsg && proyectos.length === 0) return (
    <div className="bg-amber-50 border border-amber-200 rounded-2xl p-8 text-center">
      <AlertCircle className="h-8 w-8 text-amber-500 mx-auto mb-2" />
      <p className="text-sm font-bold text-amber-700">{errorMsg}</p>
    </div>
  );

  return (
    <div className="space-y-6">
      {/* Filtros (solo estado) con estilo brand-primary */}
      <div className="flex justify-between items-center flex-wrap gap-3">
        <div className="flex gap-2">
          <select 
            value={filterEstado} 
            onChange={e => setFilterEstado(e.target.value)} 
            className="text-xs p-1 border border-brand-primary rounded-lg focus:ring-2 focus:ring-brand-primary/30 outline-none"
          >
            <option value="">Todos estados</option>
            {estadosProyecto.map(e => <option key={e}>{e}</option>)}
          </select>
        </div>
      </div>

      {/* Mapa (opcional) */}
      {puntosMapa.length > 0 && (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="p-3 bg-gray-50 border-b text-[10px] font-black uppercase">Ubicación de proyectos (color según estado)</div>
          <MapComponent puntos={puntosMapa} />
        </div>
      )}

      {/* Listado simplificado en tabla */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="p-4 bg-brand-primary text-white">
          <h3 className="font-black uppercase text-[10px]">Listado de Proyectos</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-gray-50/50 border-b">
              <tr className="text-[9px] font-black text-gray-400 uppercase">
                <th className="p-3 text-center">Nombre</th>
                <th className="p-3 text-center">Estado</th>
                <th className="p-3 text-center">Instancia</th>
                <th className="p-3 text-right">Acciones</th>
               </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {currentProyectos.length === 0 ? (
                <tr><td colSpan={4} className="p-6 text-center text-gray-400 text-sm">No hay proyectos registrados</td></tr>
              ) : (
                currentProyectos.map((p) => (
                  <tr key={p.id} className="hover:bg-gray-50/50 transition-colors">
                    <td className="p-3 text-xs font-bold">
                      <div className="flex items-center gap-1">
                        {p.nombre}
                        <span className={cn("text-[8px] font-bold px-1.5 py-0.5 rounded-full", 
                          p.tabla === 'consejo' ? "bg-blue-100 text-blue-700" : "bg-emerald-100 text-emerald-700")}>
                          {p.tabla === 'consejo' ? 'Consejo Comunal' : 'Comuna'}
                        </span>
                      </div>
                    </td>
                    <td className="p-3 text-center">
                      <span className={cn("px-2 py-0.5 rounded-full text-[9px] font-bold",
                        p.estado === 'Ejecución' ? 'bg-blue-100 text-blue-700' :
                        p.estado === 'Finalizado' ? 'bg-emerald-100 text-emerald-700' :
                        p.estado === 'Aprobado' ? 'bg-indigo-100 text-indigo-700' :
                        'bg-gray-100 text-gray-700'
                      )}>
                        {p.estado}
                      </span>
                    </td>
                    <td className="p-3 text-center text-xs capitalize">{p.tabla}</td>
                    <td className="p-3 text-right">
                      <button onClick={() => viewProject(p)} className="p-1 text-brand-primary hover:text-brand-primary/80 transition-colors">
                        <Eye size={14} />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        {totalPages > 1 && (
          <div className="p-3 flex justify-between items-center border-t">
            <span className="text-[9px]">Página {currentPage} de {totalPages}</span>
            <div className="flex gap-1">
              <button 
                onClick={() => setCurrentPage(p => Math.max(1,p-1))} 
                disabled={currentPage===1} 
                className="p-1 border border-brand-primary text-brand-primary rounded hover:bg-brand-primary hover:text-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <ChevronLeft size={14} />
              </button>
              <button 
                onClick={() => setCurrentPage(p => Math.min(totalPages,p+1))} 
                disabled={currentPage===totalPages} 
                className="p-1 border border-brand-primary text-brand-primary rounded hover:bg-brand-primary hover:text-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <ChevronRight size={14} />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Modal de detalles del proyecto (con scroll en descripciones y tabla de requerimientos) */}
      <AnimatePresence>
        {modalOpen && selectedProject && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={() => setModalOpen(false)} />
            <motion.div initial={{ scale: 0.95 }} animate={{ scale: 1 }} exit={{ scale: 0.95 }} className="relative w-full max-w-lg bg-white rounded-2xl max-h-[80vh] overflow-y-auto shadow-2xl">
              <div className="sticky top-0 bg-brand-primary text-white p-3 flex justify-between items-center">
                <h3 className="font-black uppercase text-xs">Detalles del Proyecto</h3>
                <button onClick={() => setModalOpen(false)} className="p-1 hover:bg-white/20 rounded"><X size={16} /></button>
              </div>
              <div className="p-4 space-y-3 text-sm">
                {/* Información básica */}
                <div className="grid grid-cols-2 gap-x-3 gap-y-2 text-xs">
                  <div><span className="font-bold text-gray-500">Nombre:</span> {selectedProject.nombre}</div>
                  <div><span className="font-bold text-gray-500">Código:</span> {selectedProject.codigo || 'N/A'}</div>
                  <div><span className="font-bold text-gray-500">Transformación:</span> {selectedProject.categoria_7t}</div>
                  <div><span className="font-bold text-gray-500">Estado:</span> 
                    <span className={cn("ml-1 px-1.5 py-0.5 rounded-full text-[8px] font-bold",
                      selectedProject.estado === 'Ejecución' ? 'bg-blue-100 text-blue-700' :
                      selectedProject.estado === 'Finalizado' ? 'bg-emerald-100 text-emerald-700' :
                      selectedProject.estado === 'Aprobado' ? 'bg-indigo-100 text-indigo-700' :
                      'bg-gray-100 text-gray-700'
                    )}>{selectedProject.estado}</span>
                  </div>
                  <div><span className="font-bold text-gray-500">Progreso:</span> {selectedProject.progreso}%</div>
                  <div><span className="font-bold text-gray-500">Instancia:</span> {selectedProject.tabla === 'consejo' ? 'Consejo' : 'Comuna'}</div>
                  <div><span className="font-bold text-gray-500">Presupuesto:</span> ${selectedProject.presupuesto?.toLocaleString() || 'N/A'}</div>
                  <div><span className="font-bold text-gray-500">Ente:</span> {selectedProject.ente_financiamiento || 'N/A'}</div>
                  <div><span className="font-bold text-gray-500">Familias:</span> {selectedProject.beneficiarios_familias || 0}</div>
                  <div><span className="font-bold text-gray-500">Duración (Meses):</span> {selectedProject.duracion || 'N/A'}</div>
                </div>
                
                {/* Diagnóstico con scroll */}
                {selectedProject.diagnostico && (
                  <div>
                    <span className="font-bold text-gray-500 text-xs">Diagnóstico:</span>
                    <div className="max-h-24 overflow-y-auto text-xs mt-1 bg-gray-50 p-2 rounded border border-gray-100">
                      {selectedProject.diagnostico}
                    </div>
                  </div>
                )}

                {/* 🔥 Requerimientos como tabla (si es JSON) */}
                {selectedProject.requerimientos && (
                  <div>
                    <span className="font-bold text-gray-500 text-xs">Requerimientos:</span>
                    {(() => {
                      const reqArray = parseRequerimientos(selectedProject.requerimientos);
                      if (reqArray && reqArray.length > 0) {
                        return (
                          <div className="mt-1 overflow-x-auto">
                            <table className="w-full text-xs border-collapse">
                              <thead>
                                <tr className="bg-gray-100">
                                  <th className="border border-gray-200 px-2 py-1 text-left">Uso</th>
                                  <th className="border border-gray-200 px-2 py-1 text-left">Tipo</th>
                                  <th className="border border-gray-200 px-2 py-1 text-left">Cantidad</th>
                                </tr>
                              </thead>
                              <tbody>
                                {reqArray.map((item, idx) => (
                                  <tr key={idx} className="even:bg-gray-50">
                                    <td className="border border-gray-200 px-2 py-1">{item.uso}</td>
                                    <td className="border border-gray-200 px-2 py-1">{item.tipo}</td>
                                    <td className="border border-gray-200 px-2 py-1">{item.cantidad}</td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        );
                      } else {
                        // Si no es JSON, mostrar como texto con scroll
                        return (
                          <div className="max-h-24 overflow-y-auto text-xs mt-1 bg-gray-50 p-2 rounded border border-gray-100">
                            {selectedProject.requerimientos}
                          </div>
                        );
                      }
                    })()}
                  </div>
                )}

                {/* 🔥 Acta y fotos en la misma línea (con normalización de ruta) */}
                <div className="border-t pt-2">
                  <div className="flex flex-wrap items-center gap-2">
                    {/* Acta */}
                    {selectedProject.acta_url && (
                      <button 
                        onClick={async () => {
                          const url = await getSignedUrl(selectedProject.acta_url!, selectedProject.tabla);
                          if (url) window.open(url, '_blank');
                          else showAlert('Error', 'No se pudo cargar el acta', 'danger');
                        }}
                        className="text-brand-primary text-[10px] flex items-center gap-1 bg-gray-50 px-2 py-1 rounded border border-gray-200 hover:bg-gray-100"
                      >
                        <FileText size={12} /> Ver acta
                      </button>
                    )}
                   
                    {/* Fotos como array (fotos_antes_urls) */}
                    {selectedProject.fotos_antes_urls && selectedProject.fotos_antes_urls.length > 0 && (
                      selectedProject.fotos_antes_urls.map((url, idx) => (
                        <button
                          key={idx}
                          onClick={async () => {
                            const signed = await getSignedUrl(url, selectedProject.tabla);
                            if (signed) window.open(signed, '_blank');
                          }}
                          className="text-brand-primary text-[10px] flex items-center gap-1 bg-gray-50 px-2 py-1 rounded border border-gray-200 hover:bg-gray-100"
                        >
                          <Image size={12} /> Foto {idx+1}
                        </button>
                      ))
                    )}
                  </div>
                </div>

                {/* Técnico responsable */}
                {(selectedProject.tecnico_nombre || selectedProject.tecnico_apellido) && (
                  <div className="border-t pt-2">
                    <p className="font-bold text-gray-500 text-xs mb-1">Técnico responsable</p>
                    <div className="text-xs grid grid-cols-2 gap-1">
                      <div>Nombre: {selectedProject.tecnico_nombre} {selectedProject.tecnico_apellido}</div>
                      <div>Cédula: {selectedProject.tecnico_cedula || 'N/A'}</div>
                    </div>
                  </div>
                )}
                
                {/* Ubicación */}
                {(selectedProject.latitud && selectedProject.longitud) && (
                  <div className="border-t pt-2">
                    <p className="font-bold text-gray-500 text-xs mb-1">Ubicación geográfica</p>
                    <div className="text-xs">Lat: {selectedProject.latitud}, Lng: {selectedProject.longitud}</div>
                  </div>
                )}
                
                {/* Línea de tiempo */}
                {(selectedProject.fecha_antes || selectedProject.fecha_durante || selectedProject.fecha_despues) && (
                  <div className="border-t pt-2">
                    <p className="font-bold text-gray-500 text-xs mb-1">Línea de tiempo</p>
                    <div className="space-y-0.5 text-xs">
                      {selectedProject.fecha_antes && <div>📅 Antes: {selectedProject.fecha_antes}</div>}
                      {selectedProject.fecha_durante && <div>📅 Durante: {selectedProject.fecha_durante}</div>}
                      {selectedProject.fecha_despues && <div>📅 Después: {selectedProject.fecha_despues}</div>}
                    </div>
                  </div>
                )}
                {/* Descripciones con scroll */}
                {selectedProject.desc_antes && (
                  <div>
                    <span className="font-bold text-gray-500 text-xs">Desc. antes:</span>
                    <div className="max-h-24 overflow-y-auto text-xs mt-0.5 bg-gray-50 p-2 rounded border border-gray-100">
                      {selectedProject.desc_antes}
                    </div>
                  </div>
                )}
                {selectedProject.desc_durante && (
                  <div>
                    <span className="font-bold text-gray-500 text-xs">Desc. durante:</span>
                    <div className="max-h-24 overflow-y-auto text-xs mt-0.5 bg-gray-50 p-2 rounded border border-gray-100">
                      {selectedProject.desc_durante}
                    </div>
                  </div>
                )}
                {selectedProject.desc_despues && (
                  <div>
                    <span className="font-bold text-gray-500 text-xs">Desc. después:</span>
                    <div className="max-h-24 overflow-y-auto text-xs mt-0.5 bg-gray-50 p-2 rounded border border-gray-100">
                      {selectedProject.desc_despues}
                    </div>
                  </div>
                )}
                {selectedProject.respuesta && (
                  <div>
                    <span className="font-bold text-gray-500 text-xs">Respuesta:</span>
                    <div className="max-h-24 overflow-y-auto text-xs mt-0.5 bg-gray-50 p-2 rounded border border-gray-100">
                      {selectedProject.respuesta}
                    </div>
                  </div>
                )}
              </div>
              <div className="p-3 border-t flex justify-end">
                <button onClick={() => setModalOpen(false)} className="px-3 py-1.5 bg-gray-100 rounded text-xs font-medium hover:bg-gray-200">Cerrar</button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <AlertModal
        isOpen={modalState.isOpen}
        onClose={closeAlert}
        title={modalState.title}
        message={modalState.message}
        type={modalState.type}
        showInput={modalState.showInput}
        inputPlaceholder={modalState.inputPlaceholder}
        cancelText={modalState.cancelText}
        confirmText={modalState.confirmText}
        onConfirm={modalState.onConfirm || (() => closeAlert())}
      />
    </div>
  );
};