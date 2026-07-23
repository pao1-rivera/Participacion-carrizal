"use client";

import React, { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  X, Upload, CheckCircle2, AlertCircle, Trash2,
  ChevronLeft, Loader2, FileText, MessageSquare,
  Calendar, UserCheck, ArrowLeft, Eye, Receipt, ShieldCheck, Layers, Plus
} from "lucide-react";
import { cn } from "@/app/lib/utils";
import { useAuth } from "@/context/AuthContext";
import { supabase } from "@/app/lib/supabaseClient";

// ----------------------------------------------------------------------
// Tipos (sin cambios)
// ----------------------------------------------------------------------
export interface Proyecto {
  id_proyecto: number;
  nombre: string;
  codigo?: string;
  categoria_7t?: string;
  ente_financiamiento?: string;
  presupuesto?: number;
  duracion?: string;
  desc_antes?: string;
  desc_durante?: string;
  desc_despues?: string;
  fecha_antes?: string;
  fecha_durante?: string;
  fecha_despues?: string;
  acta_url?: string;
  fotos_antes_urls?: string[];
  foto_durante_url?: string;
  foto_despues_url?: string;
  respuesta?: string;
  fecha_respuesta?: string;
  estado?: string;
}

export interface RendicionRecord {
  id_rendicion: number;
  id_proyecto: number;
  id_consejo?: number;
  es_rendicion_final: boolean;
  categoria_seleccionada: string;
  fecha_inicio: string;
  fecha_fin: string;
  ingresos: number;
  egresos: number;
  id_voceros_firmantes: number[];
  fotos_evidencia_urls: string[];
  informe_gestion: string;
  acta_asamblea_url: string | null;
  facturas_legales_url: string | null;
  informe_contraloria_url: string | null;
  estado_cuenta_url: string | null;
  acepto_terminos: boolean;
  created_at: string;
}

interface VoceroDB {
  id_vocero: number;
  nombre_completo: string;
  cedula: string;
  es_firmante: boolean;
}

// ----------------------------------------------------------------------
// Modal de respuesta (ver comentarios de proyectos) - sin cambios
// ----------------------------------------------------------------------
interface ViewResponseModalProps {
  isOpen: boolean;
  onClose: () => void;
  proyecto: Proyecto | null;
}

export const ViewResponseModal = ({ isOpen, onClose, proyecto }: ViewResponseModalProps) => {
  if (!proyecto) return null;
  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose} className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" />
          <motion.div initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 20 }} className="relative w-full max-w-lg bg-white rounded-[2.5rem] shadow-2xl overflow-hidden">
            <div className="p-8 border-b border-gray-50 flex items-center justify-between bg-gray-50/50">
              <div className="flex items-center gap-3"><div className="h-10 w-10 rounded-xl bg-brand-primary/10 flex items-center justify-center"><MessageSquare className="h-5 w-5 text-brand-primary" /></div><div><h4 className="text-lg font-black text-slate-800 italic uppercase">Respuesta del Proyecto</h4><p className="text-[10px] text-slate-400 font-bold uppercase">Seguimiento Institucional</p></div></div>
              <button onClick={onClose} className="p-2 rounded-xl hover:bg-white hover:shadow-sm text-slate-400"><X className="h-5 w-5" /></button>
            </div>
            <div className="p-8 space-y-6">
              <div><label className="text-[10px] font-bold text-slate-400 uppercase mb-2 block">Proyecto</label><p className="text-sm font-black text-slate-800 uppercase italic">{proyecto.nombre}</p></div>
              <div className="bg-brand-primary/5 rounded-3xl p-6 border border-brand-primary/10"><label className="text-[10px] font-bold text-brand-primary uppercase mb-3 block">Comentario / Respuesta</label><p className="text-sm text-slate-700 leading-relaxed">{proyecto.respuesta || "No hay respuesta registrada."}</p></div>
              <div className="grid grid-cols-2 gap-4"><div className="p-4 bg-gray-50 rounded-2xl"><Calendar className="h-3 w-3 text-slate-400 mb-1" /><p className="text-[9px] font-bold text-slate-400 uppercase">Fecha Respuesta</p><p className="text-xs font-black text-slate-800">{proyecto.fecha_respuesta || 'Pendiente'}</p></div><div className="p-4 bg-gray-50 rounded-2xl"><UserCheck className="h-3 w-3 text-slate-400 mb-1" /><p className="text-[9px] font-bold text-slate-400 uppercase">Estado Actual</p><p className="text-xs font-black text-slate-800 uppercase italic">{proyecto.estado}</p></div></div>
            </div>
            <div className="p-6 bg-gray-50/50 border-t border-gray-50 flex justify-end"><button onClick={onClose} className="px-8 py-3 rounded-xl bg-brand-primary text-white text-[10px] font-black uppercase shadow-lg hover:scale-[1.02]">Cerrar</button></div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

// ----------------------------------------------------------------------
// Paginación reutilizable (sin cambios)
// ----------------------------------------------------------------------
interface PaginationProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  totalItems: number;
  section: string;
}

export const PaginationComponent = ({ currentPage, totalPages, onPageChange, totalItems }: PaginationProps) => {
  const getVisiblePages = () => {
    const delta = 1;
    const range = [];
    const rangeWithDots = [];
    for (let i = Math.max(2, currentPage - delta); i <= Math.min(totalPages - 1, currentPage + delta); i++) range.push(i);
    if (currentPage - delta > 2) rangeWithDots.push(1, '...'); else rangeWithDots.push(1);
    rangeWithDots.push(...range);
    if (currentPage + delta < totalPages - 1) rangeWithDots.push('...', totalPages); else rangeWithDots.push(totalPages);
    return rangeWithDots;
  };
  const handlePageClick = (page: number) => { if (page >= 1 && page <= totalPages) onPageChange(page); };
  return (
    <div className="flex items-center justify-center py-8 px-4 space-x-2 bg-gradient-to-r from-slate-50/50 to-gray-50/50 border-t border-gray-100 rounded-2xl mt-8">
      <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest hidden sm:block mr-6">Página {currentPage} de {totalPages} • {totalItems} total</div>
      <div className="flex items-center gap-1">
        <button onClick={() => handlePageClick(currentPage - 1)} disabled={currentPage === 1} className={cn("flex items-center justify-center w-10 h-10 rounded-xl text-sm font-black transition-all shadow-sm", currentPage === 1 ? "bg-gray-100 text-slate-400 cursor-not-allowed" : "bg-white text-brand-primary border border-brand-primary/30 hover:bg-brand-primary/5 hover:scale-105")}><ArrowLeft className="h-4 w-4" /></button>
        {getVisiblePages().map((page, index) => (
          page === '...' ? 
            <span key={index} className="flex items-center justify-center w-10 h-10 text-slate-400">...</span> : 
            <button key={index} onClick={() => handlePageClick(page as number)} className={cn("flex items-center justify-center w-10 h-10 rounded-xl text-sm font-black transition-all shadow-sm", page === currentPage ? "bg-brand-primary text-white shadow-brand-primary/30 scale-105" : "bg-white text-slate-700 border border-gray-200 hover:bg-brand-primary/5 hover:text-brand-primary hover:scale-105")}>{page}</button>
        ))}
        <button onClick={() => handlePageClick(currentPage + 1)} disabled={currentPage === totalPages} className={cn("flex items-center justify-center w-10 h-10 rounded-xl text-sm font-black transition-all shadow-sm", currentPage === totalPages ? "bg-gray-100 text-slate-400 cursor-not-allowed" : "bg-white text-brand-primary border border-brand-primary/30 hover:bg-brand-primary/5 hover:scale-105")}><ArrowLeft className="h-4 w-4 rotate-180" /></button>
      </div>
    </div>
  );
};

// ----------------------------------------------------------------------
// Modal de detalle de rendición (visualización) - sin cambios
// ----------------------------------------------------------------------
interface RendicionDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  rendicion: RendicionRecord | null;
  proyecto: Proyecto | null;
}

export const RendicionDetailModal = ({ isOpen, onClose, rendicion, proyecto }: RendicionDetailModalProps) => {
  const vocerosIds = rendicion?.id_voceros_firmantes || [];
  const [vocerosData, setVocerosData] = useState<{ nombre_completo: string; cedula: string }[]>([]);
  const [loadingVoceros, setLoadingVoceros] = useState(false);

  let facturasUrls: string[] = [];
  if (rendicion?.facturas_legales_url) {
    try {
      const parsed = JSON.parse(rendicion.facturas_legales_url);
      if (Array.isArray(parsed)) facturasUrls = parsed;
      else facturasUrls = [rendicion.facturas_legales_url];
    } catch {
      facturasUrls = [rendicion.facturas_legales_url];
    }
  }

  useEffect(() => {
    const fetchVoceros = async () => {
      if (!vocerosIds.length) return;
      setLoadingVoceros(true);
      const { data, error } = await supabase
        .from('voceros')
        .select('nombre_completo, cedula')
        .in('id_vocero', vocerosIds);
      if (!error && data) setVocerosData(data);
      setLoadingVoceros(false);
    };
    fetchVoceros();
  }, [vocerosIds]);

  if (!isOpen || !rendicion || !proyecto) return null;

  const saldo = rendicion.ingresos - rendicion.egresos;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm"
        />
        <motion.div
          initial={{ opacity: 0, scale: 0.98, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.98, y: 10 }}
          className="relative w-full max-w-2xl bg-white rounded-xl shadow-xl overflow-hidden flex flex-col max-h-[80vh]"
        >
          <div className="px-4 py-3.5 border-b border-slate-100 bg-white sticky top-0 z-10">
            <div className="flex items-center justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-[9px] font-bold tracking-wider text-brand-primary uppercase bg-brand-primary/10 px-1.5 py-0.5 rounded">
                    {proyecto.codigo || "PROYECTO"}
                  </span>
                  <h4 className="text-base font-bold text-slate-800">Detalle de Rendición</h4>
                </div>
                <p className="text-xs text-slate-400 mt-0.5 truncate max-w-md font-medium">{proyecto.nombre}</p>
              </div>
              <button onClick={onClose} className="p-1 rounded-lg text-slate-400 hover:bg-slate-50"><X className="h-4 w-4" /></button>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-100/50">
                <p className="text-[9px] font-bold text-slate-400 uppercase">Categoría</p>
                <p className="text-xs font-semibold text-slate-700 mt-0.5">{rendicion.categoria_seleccionada?.toUpperCase() || '-'}</p>
              </div>
              <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-100/50">
                <p className="text-[9px] font-bold text-slate-400 uppercase">Lapso contable</p>
                <p className="text-xs font-semibold text-slate-700 mt-0.5">
                  {new Date(rendicion.fecha_inicio).toLocaleDateString()} — {new Date(rendicion.fecha_fin).toLocaleDateString()}
                </p>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-2.5">
              <div className="bg-emerald-50/40 border border-emerald-100/70 p-2.5 rounded-lg">
                <p className="text-[9px] font-bold text-emerald-600 uppercase">Ingresos</p>
                <p className="text-sm font-bold text-emerald-700 mt-0.5">${rendicion.ingresos?.toLocaleString()}</p>
              </div>
              <div className="bg-rose-50/40 border border-rose-100/70 p-2.5 rounded-lg">
                <p className="text-[9px] font-bold text-rose-600 uppercase">Egresos</p>
                <p className="text-sm font-bold text-rose-700 mt-0.5">${rendicion.egresos?.toLocaleString()}</p>
              </div>
              <div className="bg-emerald-50/40 border border-emerald-100/70 p-2.5 rounded-lg">
                <p className="text-[9px] font-bold text-slate-400 uppercase">Saldo</p>
                <p className="text-sm font-bold text-emerald-400 mt-0.5">${saldo.toLocaleString()}</p>
              </div>
            </div>

            <div>
              <h5 className="text-[10px] font-bold text-slate-400 uppercase mb-1.5">Voceros firmantes</h5>
              {loadingVoceros ? (
                <div className="flex items-center gap-1.5 text-xs text-slate-400"><Loader2 className="h-3 w-3 animate-spin text-brand-primary" /> Cargando...</div>
              ) : vocerosData.length > 0 ? (
                <div className="space-y-1.5">
                  {vocerosData.map((vocero, idx) => (
                    <div key={idx} className="flex items-center justify-between bg-slate-50 px-3 py-1.5 rounded-lg border border-slate-100">
                      <span className="text-[11px] font-medium text-slate-700">{vocero.nombre_completo}</span>
                      <span className="text-[10px] font-mono text-slate-500 bg-white px-2 py-0.5 rounded border border-slate-200">C.I: {vocero.cedula}</span>
                    </div>
                  ))}
                </div>
              ) : <p className="text-xs text-slate-400 italic">No hay voceros registrados.</p>}
            </div>

            {rendicion.informe_gestion && (
              <div>
                <h5 className="text-[10px] font-bold text-slate-400 uppercase mb-1.5">Informe de gestión</h5>
                <div className="bg-slate-50 p-2.5 rounded-lg text-xs leading-normal text-slate-600 whitespace-pre-wrap max-h-20 overflow-y-auto border border-slate-100">{rendicion.informe_gestion}</div>
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 border-t border-slate-100">
              {rendicion.acta_asamblea_url && (
                <div>
                  <h5 className="text-[10px] font-bold text-slate-400 uppercase mb-1.5">Acta de Asamblea</h5>
                  <a href={rendicion.acta_asamblea_url} target="_blank" rel="noreferrer" className="flex items-center gap-1.5 text-[11px] bg-white border border-slate-200 text-slate-600 py-1 px-2 rounded-md hover:bg-slate-50 transition-colors w-fit"><FileText className="h-3.5 w-3.5" /> Ver PDF</a>
                </div>
              )}
              {facturasUrls.length > 0 && (
                <div>
                  <h5 className="text-[10px] font-bold text-slate-400 uppercase mb-1.5">Facturas Legales ({facturasUrls.length})</h5>
                  <div className="flex flex-wrap gap-2">
                    {facturasUrls.map((url, idx) => (
                      <a key={idx} href={url} target="_blank" rel="noreferrer" className="flex items-center gap-1 text-[11px] bg-white border border-slate-200 text-slate-600 py-1 px-2 rounded-md hover:bg-slate-50 transition-colors"><Receipt className="h-3 w-3" /> Factura {idx+1}</a>
                    ))}
                  </div>
                </div>
              )}
              {rendicion.informe_contraloria_url && (
                <div><h5 className="text-[10px] font-bold text-slate-400 uppercase mb-1.5">Informe Contraloría</h5><a href={rendicion.informe_contraloria_url} target="_blank" className="flex items-center gap-1 text-[11px] bg-white border border-slate-200 py-1 px-2 rounded-md hover:bg-slate-50 w-fit"><ShieldCheck className="h-3 w-3" /> Ver</a></div>
              )}
              {rendicion.estado_cuenta_url && (
                <div><h5 className="text-[10px] font-bold text-slate-400 uppercase mb-1.5">Estado de Cuenta</h5><a href={rendicion.estado_cuenta_url} target="_blank" className="flex items-center gap-1 text-[11px] bg-white border border-slate-200 py-1 px-2 rounded-md hover:bg-slate-50 w-fit"><Layers className="h-3 w-3" /> Ver</a></div>
              )}
            </div>

            {rendicion.fotos_evidencia_urls && rendicion.fotos_evidencia_urls.length > 0 && (
              <div>
                <h5 className="text-[10px] font-bold text-slate-400 uppercase mb-1.5">Evidencias ({rendicion.fotos_evidencia_urls.length})</h5>
                <div className="flex flex-wrap gap-2">
                  {rendicion.fotos_evidencia_urls.slice(0, 4).map((url, idx) => (
                    <a key={idx} href={url} target="_blank" rel="noreferrer" className="w-16 h-16 rounded-lg overflow-hidden bg-slate-100 border border-slate-200 hover:ring-2 hover:ring-brand-primary/50"><img src={url} alt="evidencia" className="w-full h-full object-cover" onError={(e) => { (e.target as HTMLImageElement).src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="%23999" stroke-width="2"%3E%3Crect x="2" y="2" width="20" height="20"%3E%3C/rect%3E%3Cpath d="M8 8h8M8 12h8M8 16h4"%3E%3C/path%3E%3C/svg%3E'; (e.target as HTMLImageElement).style.objectFit = 'contain'; }} /></a>
                  ))}
                  {rendicion.fotos_evidencia_urls.length > 4 && <div className="w-16 h-16 rounded-lg bg-slate-100 flex items-center justify-center text-xs font-bold text-slate-400">+{rendicion.fotos_evidencia_urls.length-4}</div>}
                </div>
              </div>
            )}
          </div>
          <div className="px-4 py-3 bg-slate-50 border-t border-slate-100 flex justify-end"><button onClick={onClose} className="px-4 py-1.5 rounded-lg bg-white border border-slate-200 hover:bg-slate-100 text-slate-600 text-xs font-semibold">Cerrar</button></div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

// ----------------------------------------------------------------------
// Fila de rendición (listado) - sin cambios
// ----------------------------------------------------------------------
interface RendicionItemProps {
  rendicion: RendicionRecord;
  proyecto: Proyecto;
  onViewDetails: () => void;
  onSolicitarProrroga: () => void;
}

export const RendicionItem = ({ rendicion, proyecto, onViewDetails, onSolicitarProrroga }: RendicionItemProps) => {
  const isFinanciamientoExterno = proyecto.ente_financiamiento === "Financiamiento externo";
  const buttonText = isFinanciamientoExterno ? "Refinanciamiento" : "Solicitar prórroga";
  return (
    <div className="bg-white rounded-xl border border-gray-200 hover:shadow-md transition-all overflow-hidden">
      <div className="p-4 flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div className="min-w-[100px]"><p className="text-[9px] font-black text-slate-400 uppercase">Transformación</p><p className="text-sm font-bold text-slate-800">{proyecto.categoria_7t || '-'}</p></div>
        <div className="flex-1"><p className="text-[9px] font-black text-slate-400 uppercase">Proyecto</p><p className="text-sm font-bold text-slate-800 truncate max-w-[200px] md:max-w-none">{proyecto.nombre}</p></div>
        <div className="min-w-[120px]"><p className="text-[9px] font-black text-slate-400 uppercase">Categoría</p><p className="text-sm font-bold text-slate-800">{rendicion.categoria_seleccionada?.toUpperCase() || '-'}</p></div>
        <div className="min-w-[180px]"><p className="text-[9px] font-black text-slate-400 uppercase">Lapso contable</p><p className="text-sm font-bold text-slate-800">{new Date(rendicion.fecha_inicio).toLocaleDateString()} - {new Date(rendicion.fecha_fin).toLocaleDateString()}</p></div>
        <div className="flex gap-2">
          <button onClick={onViewDetails} className="px-3 py-1.5 bg-brand-primary/10 text-brand-primary text-[10px] font-black uppercase rounded-lg hover:bg-brand-primary/20">Ver detalle</button>
          <button onClick={onSolicitarProrroga} className="px-3 py-1.5 bg-amber-50 text-amber-700 text-[10px] font-black uppercase rounded-lg border border-amber-200 hover:bg-amber-100">{buttonText}</button>
        </div>
      </div>
    </div>
  );
};

// ----------------------------------------------------------------------
// Modal principal de Rendición de Cuentas (CON SOPORTE PARA EDICIÓN)
// ----------------------------------------------------------------------
interface RendicionModalProps {
  isOpen: boolean;
  onClose: () => void;
  isFinalRendicion?: boolean;
  proyectos?: Proyecto[];
  onSelectProyecto?: (proyecto: { id_proyecto: number; nombre: string; codigo?: string }) => void;
  selectedProyecto?: { id_proyecto: number; nombre: string; codigo?: string } | null;
  onSuccess?: () => void;
  consejoId?: number | null;
  // Nuevas props para edición
  editMode?: boolean;
  initialData?: RendicionRecord | null;
  onEditSuccess?: () => void;
}

export const RendicionModal = ({
  isOpen,
  onClose,
  isFinalRendicion = false,
  proyectos: proyectosExternos,
  onSelectProyecto,
  selectedProyecto: selectedProyectoExterno,
  onSuccess,
  consejoId: consejoIdProp,
  editMode = false,
  initialData = null,
  onEditSuccess,
}: RendicionModalProps) => {
  const { user } = useAuth();
  const consejoId = consejoIdProp ?? user?.id_consejo;
  const [step, setStep] = useState(1);

  const [proyectos, setProyectos] = useState<Proyecto[]>([]);
  const [proyectosConRendicionesIds, setProyectosConRendicionesIds] = useState<number[]>([]);
  const [vocerosFirmantes, setVocerosFirmantes] = useState<VoceroDB[]>([]);
  const [loadingData, setLoadingData] = useState(false);
  const [internalSelectedProyecto, setInternalSelectedProyecto] = useState<Proyecto | null>(null);
  const [selectedCategoria, setSelectedCategoria] = useState<string>('');
  const [ingresos, setIngresos] = useState(0);
  const [egresos, setEgresos] = useState(0);
  const [selectedVoceros, setSelectedVoceros] = useState<{ id_vocero: string }[]>([{ id_vocero: "" }]);
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [fechaInicio, setFechaInicio] = useState("");
  const [fechaFin, setFechaFin] = useState("");
  const [informeGestion, setInformeGestion] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Estados para archivos
  const [actaFile, setActaFile] = useState<File | null>(null);
  const [facturaFiles, setFacturaFiles] = useState<File[]>([]);
  const [informeContraloriaFile, setInformeContraloriaFile] = useState<File | null>(null);
  const [estadoCuentaFile, setEstadoCuentaFile] = useState<File | null>(null);
  const [photos, setPhotos] = useState<{ id: number; preview: string | null }[]>([
    { id: 1, preview: null }, { id: 2, preview: null }, { id: 3, preview: null }
  ]);
  const [photoFiles, setPhotoFiles] = useState<(File | null)[]>([null, null, null]);
  const photoInputsRef = useRef<(HTMLInputElement | null)[]>([]);
  const facturaInputRef = useRef<HTMLInputElement>(null);

  // Para almacenar URLs existentes en modo edición
  const [existingActaUrl, setExistingActaUrl] = useState<string | null>(null);
  const [existingFacturasUrls, setExistingFacturasUrls] = useState<string[]>([]);
  const [existingContraloriaUrl, setExistingContraloriaUrl] = useState<string | null>(null);
  const [existingEstadoCuentaUrl, setExistingEstadoCuentaUrl] = useState<string | null>(null);
  const [existingPhotosUrls, setExistingPhotosUrls] = useState<string[]>([]);

  // Flag para saber si el formulario ya fue inicializado (evita reinicializaciones)
  const [initialized, setInitialized] = useState(false);

  const categoriasPorTransformacion: Record<string, string[]> = {
    T1: ['economia'],
    T2: ['agua', 'electricidad', 'gas', 'recoleccion de desechos', 'telecomunicaciones', 'transporte', 'vialidad', 'vivienda'],
    T3: ['seguridad'],
    T4: ['alimentacion', 'cultura', 'deporte', 'educacion', 'misiones', 'pobreza', 'salud'],
    T5: ['politico'],
    T6: ['ciencia y tecnologia', 'ecosocialismo'],
    T7: ['geopolitica']
  };

  // --- Efecto para cargar datos solo al abrir el modal ---
  useEffect(() => {
    if (!isOpen || !consejoId) return;

    const fetchData = async () => {
      setLoadingData(true);
      let proyectosData: Proyecto[] = [];
      if (!proyectosExternos) {
        const { data: projData } = await supabase
          .from('proyectos')
          .select('*')
          .eq('id_consejo', consejoId);
        if (projData) proyectosData = projData;
      } else {
        proyectosData = proyectosExternos;
      }

      const { data: rendicionesData } = await supabase
        .from('rendiciones')
        .select('id_proyecto')
        .eq('id_consejo', consejoId);
      const idsConRendicion = rendicionesData ? [...new Set(rendicionesData.map(r => r.id_proyecto))] : [];

      const { data: vocData } = await supabase
        .from('voceros')
        .select('*')
        .eq('id_consejo', consejoId)
        .eq('es_firmante', true);

      setProyectos(proyectosData);
      setProyectosConRendicionesIds(idsConRendicion);
      if (vocData) setVocerosFirmantes(vocData);

      // Inicializar el formulario solo si aún no se ha hecho (initialized === false)
      if (!initialized) {
        if (editMode && initialData) {
          // Modo edición: precargar todos los datos
          const proyectoRel = proyectosData.find(p => p.id_proyecto === initialData.id_proyecto);
          if (proyectoRel) {
            setInternalSelectedProyecto(proyectoRel);
            if (onSelectProyecto) onSelectProyecto({ id_proyecto: proyectoRel.id_proyecto, nombre: proyectoRel.nombre, codigo: proyectoRel.codigo });
          }
          setSelectedCategoria(initialData.categoria_seleccionada);
          setIngresos(initialData.ingresos);
          setEgresos(initialData.egresos);
          setFechaInicio(initialData.fecha_inicio);
          setFechaFin(initialData.fecha_fin);
          setInformeGestion(initialData.informe_gestion);
          setAcceptedTerms(initialData.acepto_terminos);

          const vocerosIds = (initialData.id_voceros_firmantes || []).filter(id => id != null);
          if (vocerosIds.length > 0) {
            setSelectedVoceros(vocerosIds.map(id => ({ id_vocero: id.toString() })));
          } else {
            setSelectedVoceros([{ id_vocero: "" }]);
          }

          setExistingActaUrl(initialData.acta_asamblea_url);
          if (initialData.facturas_legales_url) {
            try {
              const parsed = JSON.parse(initialData.facturas_legales_url);
              const urls = Array.isArray(parsed) ? parsed : [initialData.facturas_legales_url];
              setExistingFacturasUrls(urls);
            } catch {
              setExistingFacturasUrls([initialData.facturas_legales_url]);
            }
          }
          setExistingContraloriaUrl(initialData.informe_contraloria_url);
          setExistingEstadoCuentaUrl(initialData.estado_cuenta_url);
          setExistingPhotosUrls(initialData.fotos_evidencia_urls || []);

          // Previsualizar fotos existentes
          if (initialData.fotos_evidencia_urls && initialData.fotos_evidencia_urls.length > 0) {
            const newPhotos = [...photos];
            const newPhotoFiles = [...photoFiles];
            initialData.fotos_evidencia_urls.forEach((url, idx) => {
              if (idx < 3) {
                newPhotos[idx] = { ...newPhotos[idx], preview: url };
                newPhotoFiles[idx] = null; 
              }
            });
            setPhotos(newPhotos);
            setPhotoFiles(newPhotoFiles);
          }
        } else {
          // Modo creación: solo si no hay un proyecto seleccionado externamente
          if (!selectedProyectoExterno) {
            setInternalSelectedProyecto(null);
          } else {
            // Si hay un proyecto externo, buscarlo en la lista cargada
            const proy = proyectosData.find(p => p.id_proyecto === selectedProyectoExterno.id_proyecto);
            if (proy) {
              setInternalSelectedProyecto(proy);
            }
          }
          // Resetear el resto de campos del formulario
          setSelectedCategoria('');
          setIngresos(0);
          setEgresos(0);
          setFechaInicio('');
          setFechaFin('');
          setInformeGestion('');
          setAcceptedTerms(false);
          setSelectedVoceros([{ id_vocero: "" }]);
          setActaFile(null);
          setFacturaFiles([]);
          setInformeContraloriaFile(null);
          setEstadoCuentaFile(null);
          setPhotoFiles([null, null, null]);
          setPhotos([{ id: 1, preview: null }, { id: 2, preview: null }, { id: 3, preview: null }]);
          setExistingActaUrl(null);
          setExistingFacturasUrls([]);
          setExistingContraloriaUrl(null);
          setExistingEstadoCuentaUrl(null);
          setExistingPhotosUrls([]);
        }
        // Marcar como inicializado para que no se vuelva a ejecutar esta parte
        setInitialized(true);
      }

      setLoadingData(false);
    };

    fetchData();
  }, [isOpen, consejoId, proyectosExternos]); // Dependencias: se ejecuta cada vez que se abre o cambian las props

  // --- Efecto para manejar cambios en selectedProyectoExterno (cuando se proporciona desde fuera) ---
  useEffect(() => {
    if (!editMode && selectedProyectoExterno && initialized) {
      const fullProyecto = proyectos.find(p => p.id_proyecto === selectedProyectoExterno.id_proyecto);
      if (fullProyecto && fullProyecto.id_proyecto !== internalSelectedProyecto?.id_proyecto) {
        setInternalSelectedProyecto(fullProyecto);
      }
    }
  }, [selectedProyectoExterno, proyectos, editMode, initialized, internalSelectedProyecto]);

  // --- Cuando se cierra el modal, reiniciamos el flag de inicialización para la próxima apertura ---
  useEffect(() => {
    if (!isOpen) {
      setInitialized(false);
    }
  }, [isOpen]);

  const saldo = ingresos - egresos;
  const categoriasDisponibles = internalSelectedProyecto?.categoria_7t ? categoriasPorTransformacion[internalSelectedProyecto.categoria_7t] || [] : [];

  const uploadToSupabase = async (file: File, folder: string): Promise<string> => {
    if (!consejoId) throw new Error("Consejo ID no disponible");
    const fileExt = file.name.split('.').pop();
    const fileName = `${Math.random().toString(36).substring(2)}.${fileExt}`;
    const filePath = `${consejoId}/rendiciones/${folder}/${fileName}`;
    const { error } = await supabase.storage.from('rendiciones').upload(filePath, file);
    if (error) throw error;
    return filePath;
  };

  const handleFacturaChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const newFiles = Array.from(e.target.files);
      setFacturaFiles(prev => [...prev, ...newFiles]);
    }
  };
  const removeFactura = (index: number) => setFacturaFiles(prev => prev.filter((_, i) => i !== index));

  const handlePhotoChange = (index: number, file: File) => {
    setPhotoFiles(prev => { const newFiles = [...prev]; newFiles[index] = file; return newFiles; });
    const reader = new FileReader();
    reader.onload = (e) => setPhotos(prev => prev.map((p, i) => i === index ? { ...p, preview: e.target?.result as string } : p));
    reader.readAsDataURL(file);
    if (editMode && existingPhotosUrls[index]) {
      const newExisting = [...existingPhotosUrls];
      newExisting[index] = '';
      setExistingPhotosUrls(newExisting);
    }
  };

  const handleSubmit = async () => {
    if (!internalSelectedProyecto) return;
    if (!acceptedTerms) {
      alert("Debe aceptar los términos legales");
      return;
    }
    if (!editMode && !actaFile) {
      alert("Debe subir el Acta de Asamblea");
      return;
    }
    if (editMode && !actaFile && !existingActaUrl) {
      alert("Debe subir el Acta de Asamblea o mantener la existente");
      return;
    }
    if (!consejoId) {
      alert("No se pudo identificar el consejo comunal.");
      return;
    }

    try {
      setIsSubmitting(true);
      
      let actaPath = existingActaUrl;
      if (actaFile) {
        actaPath = await uploadToSupabase(actaFile, 'documentos');
      }
      
      let facturaPaths = [...existingFacturasUrls];
      for (const file of facturaFiles) {
        const path = await uploadToSupabase(file, 'facturas');
        facturaPaths.push(path);
      }
      
      let contraloriaPath = existingContraloriaUrl;
      if (informeContraloriaFile) {
        contraloriaPath = await uploadToSupabase(informeContraloriaFile, 'documentos');
      }
      
      let estadoCuentaPath = existingEstadoCuentaUrl;
      if (estadoCuentaFile) {
        estadoCuentaPath = await uploadToSupabase(estadoCuentaFile, 'documentos');
      }
      
      let photoPaths = [...existingPhotosUrls];
      for (let i = 0; i < photoFiles.length; i++) {
        if (photoFiles[i]) {
          const path = await uploadToSupabase(photoFiles[i]!, 'evidencia');
          photoPaths[i] = path;
        }
      }
      photoPaths = photoPaths.filter(p => p && p.trim() !== '');
      
      const rendicionData = {
        id_proyecto: internalSelectedProyecto.id_proyecto,
        id_consejo: consejoId,
        es_rendicion_final: isFinalRendicion,
        categoria_seleccionada: selectedCategoria,
        fecha_inicio: fechaInicio,
        fecha_fin: fechaFin,
        ingresos,
        egresos,
        id_voceros_firmantes: selectedVoceros.map(v => parseInt(v.id_vocero)).filter(id => !isNaN(id)),
        fotos_evidencia_urls: photoPaths,
        informe_gestion: informeGestion,
        acta_asamblea_url: actaPath,
        facturas_legales_url: JSON.stringify(facturaPaths),
        informe_contraloria_url: contraloriaPath,
        estado_cuenta_url: estadoCuentaPath,
        acepto_terminos: acceptedTerms
      };
      
      let error;
      if (editMode && initialData) {
        const { error: updateError } = await supabase
          .from('rendiciones')
          .update(rendicionData)
          .eq('id_rendicion', initialData.id_rendicion);
        error = updateError;
        if (!error) {
          alert("¡Rendición actualizada exitosamente!");
          onEditSuccess?.();
        }
      } else {
        const { error: insertError } = await supabase.from('rendiciones').insert([rendicionData]);
        error = insertError;
        if (!error) {
          alert("¡Rendición guardada exitosamente!");
          onSuccess?.();
        }
      }
      
      if (error) throw error;
      onClose();
    } catch (error: any) {
      console.error(error);
      alert(`Error: ${error.message}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const addVoceroRow = () => setSelectedVoceros([...selectedVoceros, { id_vocero: "" }]);
  const updateVoceroSelection = (index: number, id: string) => {
    const newVoceros = [...selectedVoceros];
    newVoceros[index].id_vocero = id;
    setSelectedVoceros(newVoceros);
  };
  const removeVoceroRow = (index: number) => setSelectedVoceros(selectedVoceros.filter((_, i) => i !== index));

  // Lista de opciones para el select de proyectos: incluye el seleccionado aunque no esté en la lista de disponibles
  const proyectosDisponibles = proyectos.filter(p => {
    const estadoNormalizado = p.estado?.toLowerCase()
      .normalize("NFD").replace(/[\u0300-\u036f]/g, "")
      .trim();
    return estadoNormalizado === 'culminado' && !proyectosConRendicionesIds.includes(p.id_proyecto);
  });

  let opcionesSelect = proyectosDisponibles;
  if (internalSelectedProyecto && !opcionesSelect.some(p => p.id_proyecto === internalSelectedProyecto.id_proyecto)) {
    opcionesSelect = [internalSelectedProyecto, ...opcionesSelect];
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose} className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" />
          <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="relative w-full max-w-3xl bg-white rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[85vh]">
            {/* Cabecera reducida */}
            <div className="p-4 border-b border-gray-50 flex items-center justify-between bg-gray-50/30">
              <div className="flex items-center gap-3">
                <div className="h-8 w-8 rounded-xl bg-brand-primary/10 flex items-center justify-center text-brand-primary font-black text-sm">{step}</div>
                <div>
                  <h4 className="text-base font-black text-slate-800 uppercase">
                    {editMode ? "Editar Rendición" : "Rendición de Cuentas"}
                  </h4>
                  <p className="text-[9px] font-bold text-slate-400 uppercase">{user?.nombreConsejo || 'Consejo Comunal'}</p>
                </div>
              </div>
              <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-gray-100"><X className="h-4 w-4 text-slate-400" /></button>
            </div>

            {/* Contenido */}
            <div className="flex-1 overflow-y-auto p-5">
              {step === 1 && (
                <div className="space-y-4">
                  <div className="grid md:grid-cols-2 gap-4">
                    <div>
                      <label className="text-[9px] font-bold text-slate-400 uppercase">Proyecto a Rendir</label>
                      {!editMode && (
                        <select
                          value={internalSelectedProyecto?.id_proyecto || ''}
                          onChange={(e) => {
                            const proy = proyectos.find(p => p.id_proyecto === parseInt(e.target.value)) || null;
                            setInternalSelectedProyecto(proy);
                            if (onSelectProyecto && proy) onSelectProyecto({ id_proyecto: proy.id_proyecto, nombre: proy.nombre, codigo: proy.codigo });
                          }}
                          className="w-full p-3 rounded-xl bg-gray-50 border border-transparent focus:border-brand-primary outline-none text-xs font-bold"
                        >
                          <option value="">{loadingData ? "Cargando..." : "Seleccionar Proyecto"}</option>
                          {opcionesSelect.length === 0 && !loadingData && (
                            <option value="" disabled>⚠️ No hay proyectos culminados disponibles</option>
                          )}
                          {opcionesSelect.map(p => (
                            <option key={p.id_proyecto} value={p.id_proyecto}>
                              {p.codigo} - {p.nombre}
                            </option>
                          ))}
                        </select>
                      )}
                      {editMode && (
                        <div className="p-3 rounded-xl bg-gray-100 text-xs font-bold text-slate-700">
                          {internalSelectedProyecto?.nombre || "Proyecto no encontrado"}
                        </div>
                      )}
                    </div>
                    <div>
                      <label className="text-[9px] font-bold text-slate-400 uppercase">Categoría</label>
                      <select value={selectedCategoria} onChange={(e) => setSelectedCategoria(e.target.value)} className="w-full p-3 rounded-xl bg-gray-50 border border-transparent focus:border-brand-primary outline-none text-xs font-bold">
                        <option value="">Seleccionar Categoría</option>
                        {categoriasDisponibles.map(c => <option key={c} value={c}>{c.toUpperCase()}</option>)}
                      </select>
                    </div>
                  </div>
                  <div className="grid md:grid-cols-2 gap-4">
                    <div className="p-3 rounded-xl bg-emerald-50 text-emerald-700 text-xs font-bold border border-emerald-100">
                      <p className="text-[8px] uppercase text-emerald-600/50 mb-1">Ente Financiador</p>
                      {internalSelectedProyecto?.ente_financiamiento || "Seleccione un proyecto"}
                    </div>
                    <div>
                      <label className="text-[9px] font-bold text-slate-400 uppercase">Lapso Contable</label>
                      <div className="flex gap-2">
                        <input type="date" value={fechaInicio} onChange={(e) => setFechaInicio(e.target.value)} className="w-full p-2 rounded-lg bg-gray-50 text-xs font-bold" />
                        <input type="date" value={fechaFin} onChange={(e) => setFechaFin(e.target.value)} className="w-full p-2 rounded-lg bg-gray-50 text-xs font-bold" />
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {step === 2 && (
                <div className="space-y-5">
                  <div className="grid md:grid-cols-3 gap-3">
                    <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-100">
                      <label className="text-[8px] font-black text-emerald-600 uppercase">Ingresos</label>
                      <input type="number" value={ingresos} onChange={(e) => setIngresos(Number(e.target.value))} className="w-full bg-transparent text-lg font-black outline-none" />
                    </div>
                    <div className="p-3 rounded-xl bg-rose-50 border border-rose-100">
                      <label className="text-[8px] font-black text-rose-600 uppercase">Egresos</label>
                      <input type="number" value={egresos} onChange={(e) => setEgresos(Number(e.target.value))} className="w-full bg-transparent text-lg font-black outline-none" />
                    </div>
                    <div className="p-3 rounded-xl bg-slate-900 text-white">
                      <label className="text-[8px] font-black text-slate-400 uppercase">Saldo</label>
                      <p className="text-lg font-black text-emerald-400">{saldo.toLocaleString()} BS</p>
                    </div>
                  </div>
                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <label className="text-[9px] font-bold text-slate-400 uppercase">Voceros Firmantes</label>
                      <button onClick={addVoceroRow} className="text-[9px] font-black text-brand-primary">+ AÑADIR</button>
                    </div>
                    {selectedVoceros.map((sv, index) => (
                      <div key={index} className="flex gap-2 items-center">
                        <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-2 p-3 bg-gray-50 rounded-xl border border-gray-100">
                          <select value={sv.id_vocero} onChange={(e) => updateVoceroSelection(index, e.target.value)} className="bg-transparent text-xs font-bold outline-none">
                            <option value="">Seleccionar Vocero...</option>
                            {vocerosFirmantes.map(v => <option key={v.id_vocero} value={v.id_vocero}>{v.nombre_completo}</option>)}
                          </select>
                          <div className="text-xs font-bold text-slate-400">{vocerosFirmantes.find(v => v.id_vocero.toString() === sv.id_vocero)?.cedula || "Cédula"}</div>
                        </div>
                        {selectedVoceros.length > 1 && (
                          <button onClick={() => removeVoceroRow(index)} className="p-2 text-rose-500 hover:bg-rose-50 rounded-lg"><Trash2 className="h-4 w-4" /></button>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {step === 3 && (
                <div className="space-y-5">
                  <div>
                    <label className="text-[9px] font-bold text-slate-400 uppercase">Registro Fotográfico</label>
                    <div className="grid grid-cols-3 gap-3 mt-2">
                      {photos.map((photo, index) => (
                        <div key={photo.id} className="aspect-video rounded-xl border-2 border-dashed border-gray-200 flex flex-col items-center justify-center relative overflow-hidden bg-gray-50">
                          {photo.preview ? (
                            <>
                              <img src={photo.preview} className="w-full h-full object-cover" />
                              <button onClick={() => {
                                setPhotos(prev => prev.map((p, i) => i === index ? { ...p, preview: null } : p));
                                setPhotoFiles(prev => prev.map((f, i) => i === index ? null : f));
                                if (editMode) {
                                  const newExisting = [...existingPhotosUrls];
                                  newExisting[index] = '';
                                  setExistingPhotosUrls(newExisting);
                                }
                              }} className="absolute top-1 right-1 p-1 bg-rose-500 text-white rounded-full"><X className="h-3 w-3" /></button>
                            </>
                          ) : (
                            <div onClick={() => photoInputsRef.current[index]?.click()} className="cursor-pointer flex flex-col items-center">
                              <Upload className="h-5 w-5 text-slate-300" />
                              <input type="file" ref={el => { if (el) photoInputsRef.current[index] = el; }} className="hidden" accept="image/*" onChange={e => e.target.files?.[0] && handlePhotoChange(index, e.target.files[0])} />
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                  <div>
                    <label className="text-[9px] font-bold text-slate-400 uppercase">Informe de Gestión</label>
                    <textarea value={informeGestion} onChange={(e) => setInformeGestion(e.target.value)} placeholder="Describa los avances..." className="w-full p-3 rounded-xl bg-gray-50 border border-transparent focus:border-brand-primary outline-none text-xs font-bold min-h-[100px]" />
                  </div>
                </div>
              )}

              {step === 4 && (
                <div className="space-y-5">
                  <div className="grid grid-cols-2 gap-3">
                    <div className="p-3 border-2 border-dashed border-gray-100 rounded-xl flex flex-col items-center text-center cursor-pointer hover:border-brand-primary/20 transition-all group" onClick={() => document.getElementById('actaInput')?.click()}>
                      <input id="actaInput" type="file" className="hidden" accept=".pdf" onChange={e => setActaFile(e.target.files?.[0] || null)} />
                      <FileText className="h-6 w-6 text-slate-300 mb-1 group-hover:text-brand-primary" />
                      <p className="text-[9px] font-black uppercase">Acta de Asamblea</p>
                      <p className="text-[7px] text-slate-400">
                        {actaFile ? actaFile.name : (existingActaUrl ? "Archivo existente" : "PDF requerido")}
                      </p>
                    </div>
                    <div className="p-3 border-2 border-dashed border-gray-100 rounded-xl flex flex-col items-center text-center cursor-pointer hover:border-brand-primary/20 transition-all group" onClick={() => facturaInputRef.current?.click()}>
                      <input ref={facturaInputRef} type="file" className="hidden" multiple accept=".pdf,.jpg,.png" onChange={handleFacturaChange} />
                      <Receipt className="h-6 w-6 text-slate-300 mb-1 group-hover:text-brand-primary" />
                      <p className="text-[9px] font-black uppercase">Facturas Legales</p>
                      <p className="text-[7px] text-slate-400">{facturaFiles.length + existingFacturasUrls.length} archivo(s)</p>
                    </div>
                  </div>
                  {(facturaFiles.length > 0 || existingFacturasUrls.length > 0) && (
                    <div className="flex flex-wrap gap-2">
                      {existingFacturasUrls.map((url, idx) => (
                        <div key={`exist-${idx}`} className="flex items-center gap-1 bg-gray-100 rounded-lg px-2 py-1">
                          <span className="text-[8px] font-medium truncate max-w-32">Factura existente {idx+1}</span>
                          <a href={url} target="_blank" rel="noreferrer" className="text-brand-primary"><Eye className="h-3 w-3" /></a>
                        </div>
                      ))}
                      {facturaFiles.map((file, idx) => (
                        <div key={`new-${idx}`} className="flex items-center gap-1 bg-gray-100 rounded-lg px-2 py-1">
                          <span className="text-[8px] font-medium truncate max-w-32">{file.name}</span>
                          <button onClick={() => removeFactura(idx)} className="text-rose-500"><X className="h-3 w-3" /></button>
                        </div>
                      ))}
                    </div>
                  )}
                  <div className="grid grid-cols-2 gap-3">
                    <div className="p-3 border-2 border-dashed border-gray-100 rounded-xl flex flex-col items-center text-center cursor-pointer hover:border-brand-primary/20 transition-all group" onClick={() => document.getElementById('contraloriaInput')?.click()}>
                      <input id="contraloriaInput" type="file" className="hidden" accept=".pdf" onChange={e => setInformeContraloriaFile(e.target.files?.[0] || null)} />
                      <ShieldCheck className="h-6 w-6 text-slate-300 mb-1 group-hover:text-brand-primary" />
                      <p className="text-[9px] font-black uppercase">Inf. Contraloría</p>
                      <p className="text-[7px] text-slate-400">
                        {informeContraloriaFile ? informeContraloriaFile.name : (existingContraloriaUrl ? "Archivo existente" : "Opcional")}
                      </p>
                    </div>
                    <div className="p-3 border-2 border-dashed border-gray-100 rounded-xl flex flex-col items-center text-center cursor-pointer hover:border-brand-primary/20 transition-all group" onClick={() => document.getElementById('estadoCuentaInput')?.click()}>
                      <input id="estadoCuentaInput" type="file" className="hidden" accept=".pdf,.xlsx,.xls" onChange={e => setEstadoCuentaFile(e.target.files?.[0] || null)} />
                      <Layers className="h-6 w-6 text-slate-300 mb-1 group-hover:text-brand-primary" />
                      <p className="text-[9px] font-black uppercase">Estado Cuenta</p>
                      <p className="text-[7px] text-slate-400">
                        {estadoCuentaFile ? estadoCuentaFile.name : (existingEstadoCuentaUrl ? "Archivo existente" : "Opcional")}
                      </p>
                    </div>
                  </div>
                  <div className="p-4 rounded-xl bg-slate-900 text-white space-y-3">
                    <div className="flex gap-2"><AlertCircle className="h-4 w-4 text-brand-primary shrink-0" /><p className="text-[9px] font-black uppercase tracking-wider text-brand-primary">Aviso Legal</p></div>
                    <p className="text-[10px] text-slate-400">Responsabilidad civil, penal y administrativa por manejo indebido de recursos.</p>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input type="checkbox" checked={acceptedTerms} onChange={e => setAcceptedTerms(e.target.checked)} className="w-4 h-4 accent-brand-primary" />
                      <span className="text-[9px] font-black uppercase">Acepto la responsabilidad legal</span>
                    </label>
                  </div>
                </div>
              )}
            </div>

            {/* Botones de navegación */}
            <div className="p-4 bg-gray-50/50 border-t border-gray-100 flex justify-between">
              <button onClick={() => step > 1 ? setStep(step - 1) : onClose()} className="flex items-center gap-1 text-xs font-black uppercase text-slate-500">
                <ChevronLeft className="h-3 w-3" /> {step === 1 ? 'Cerrar' : 'Anterior'}
              </button>
              <button onClick={() => step < 4 ? setStep(step + 1) : handleSubmit()} 
                disabled={isSubmitting || (step === 4 && !acceptedTerms) || (step === 4 && !editMode && !actaFile) || (step === 4 && editMode && !actaFile && !existingActaUrl)} 
                className="px-6 py-2 rounded-lg bg-brand-primary text-white font-black text-xs uppercase disabled:opacity-50 flex items-center gap-1">
                {isSubmitting ? <Loader2 className="h-3 w-3 animate-spin" /> : (step === 4 ? (editMode ? 'Actualizar' : 'Enviar') : 'Siguiente')}
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};