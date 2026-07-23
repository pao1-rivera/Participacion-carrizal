"use client";

import React, { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Eye, FileText, Calendar, DollarSign, Loader2, X, Receipt, 
  Layers, Camera, ChevronLeft, CheckCircle2, AlertCircle, Search,
  User, UserCheck, CreditCard, Image, File, Link2, Clock
} from "lucide-react";
import { cn } from "@/app/lib/utils";
import { supabase } from "@/app/lib/supabaseClient";
import { useAuth } from "@/context/AuthContext";

// ========== TIPOS ==========
interface ProyectoComuna {
  id_proyecto_comuna: number;
  nombre: string;
  codigo?: string;
  categoria_7t: string;
  ente_financiamiento?: string;
  estado?: string;
}

interface ProyectoConsejo {
  id_proyecto: number;
  nombre: string;
  codigo?: string;
  categoria_7t: string;
  ente_financiamiento?: string;
  estado?: string;
}

interface RendicionComuna {
  id_rendicion: number;
  id_proyecto_comuna: number;
  categoria_seleccionada: string;
  fecha_inicio: string;
  fecha_fin: string;
  ingresos: number;
  egresos: number;
  informe_gestion: string;
  acta_asamblea_url: string | null;
  facturas_legales_url: string | null;
  informe_contraloria_url: string | null;
  estado_cuenta_url: string | null;
  fotos_evidencia_urls: string[];
  id_voceros_firmantes: number[];
  created_at: string;
  proyecto?: ProyectoComuna;
}

interface RendicionConsejo {
  id_rendicion: number;
  id_proyecto: number;
  categoria_seleccionada: string;
  fecha_inicio: string;
  fecha_fin: string;
  ingresos: number;
  egresos: number;
  informe_gestion: string;
  acta_asamblea_url: string | null;
  facturas_legales_url: string | null;
  informe_contraloria_url: string | null;
  estado_cuenta_url: string | null;
  fotos_evidencia_urls: string[];
  id_voceros_firmantes: number[];
  created_at: string;
  proyecto?: ProyectoConsejo;
}

interface ProrrogaComuna {
  id_solicitud: number;
  id_proyecto_comuna: number;
  motivo: string;
  presupuesto_estimado: number;
  tiempo_estimado: string;
  acta_url: string | null;
  evidencia_url: string | null;
  id_voceros_firmantes: number[];
  estado: string;
  created_at: string;
  proyecto?: ProyectoComuna;
}

interface ProrrogaConsejo {
  id_solicitud: number;
  id_proyecto: number;
  motivo: string;
  presupuesto_estimado: number;
  tiempo_estimado: string;
  acta_url: string | null;
  evidencia_url: string | null;
  id_voceros_firmantes: number[];
  estado: string;
  created_at: string;
  proyecto?: ProyectoConsejo;
}

type RegistroUnificado = {
  id: string;
  tipo: 'rendicion' | 'prorroga';
  origen: 'comuna' | 'consejo';
  fecha: string;
  proyectoNombre: string;
  proyectoCodigo: string;
  proyectoCategoria: string;
  categoria: string;
  lapsoTiempo: string;
  estadoProrroga?: string;
  ingresos?: number;
  egresos?: number;
  datos: any;
  proyectoCompleto: any;
};

// ============================================================
//  FUNCIÓN PARA NORMALIZAR RUTA (EXTRAER PARTE RELATIVA AL BUCKET)
// ============================================================
const normalizeFilePath = (path: string): string | null => {
  if (!path) return null;
  // Si es una URL pública de Supabase, extraer la parte después del bucket
  // Ejemplo: https://.../storage/v1/object/public/rendiciones_comuna/3/proyectos/5/acta.pdf
  // -> 3/proyectos/5/acta.pdf
  const publicPattern = /\/storage\/v1\/object\/public\/[^/]+\/(.+)$/;
  const match = path.match(publicPattern);
  if (match) {
    return match[1];
  }
  // Si es una ruta que comienza con el nombre del bucket, eliminarlo
  const buckets = ['rendiciones', 'rendiciones_comuna', 'prorrogas'];
  for (const bucket of buckets) {
    if (path.startsWith(`${bucket}/`)) {
      return path.substring(bucket.length + 1);
    }
  }
  // Si no coincide, asumimos que ya es ruta relativa (no comienza con http)
  if (!path.startsWith('http')) {
    return path;
  }
  // Si es otra URL, no podemos manejarla
  return null;
};

// ============================================================
//  FUNCIÓN AUXILIAR PARA OBTENER URL DE DOCUMENTO (CORREGIDA)
// ============================================================
const getDocumentUrl = async (
  path: string | null,
  origen: 'comuna' | 'consejo',
  tipo: 'rendicion' | 'prorroga' = 'rendicion'
): Promise<string | null> => {
  if (!path) return null;

  // Normalizar la ruta (extraer parte relativa)
  const normalized = normalizeFilePath(path);
  if (!normalized) {
    // Si no se pudo normalizar, intentar devolver la URL original (puede ser una URL externa)
    if (path.startsWith('http')) return path;
    return null;
  }

  // Determinar bucket según origen y tipo
  let bucketName: string;
  let esPublico = false;

  if (origen === 'comuna') {
    // Comuna: siempre usa rendiciones_comuna (privado)
    bucketName = 'rendiciones_comuna';
    esPublico = false;
  } else {
    // Consejo: depende del tipo
    if (tipo === 'rendicion') {
      bucketName = 'rendiciones'; // público
      esPublico = true;
    } else {
      bucketName = 'prorrogas'; // privado
      esPublico = false;
    }
  }

  try {
    if (esPublico) {
      const { data } = supabase.storage.from(bucketName).getPublicUrl(normalized);
      return data.publicUrl;
    } else {
      const { data, error } = await supabase.storage
        .from(bucketName)
        .createSignedUrl(normalized, 3600);
      if (error || !data) return null;
      return data.signedUrl;
    }
  } catch (error) {
    console.error('Error obteniendo URL de documento:', error);
    return null;
  }
};

// ========== COMPONENTE PRINCIPAL ==========
export const RendicionesG = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [registros, setRegistros] = useState<RegistroUnificado[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategoria, setSelectedCategoria] = useState<string>('Todas');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  const [detailModalOpen, setDetailModalOpen] = useState(false);
  const [selectedRegistro, setSelectedRegistro] = useState<RegistroUnificado | null>(null);
  const [prorrogaDetailOpen, setProrrogaDetailOpen] = useState(false);
  const [selectedProrroga, setSelectedProrroga] = useState<any>(null);

  const cargarDatos = useCallback(async () => {
    setLoading(true);
    try {
      // ========== RENDICIONES COMUNA ==========
      const { data: rendComuna, error: err1 } = await supabase
        .from('rendiciones_comuna')
        .select('*')
        .order('created_at', { ascending: false });
      if (err1) console.error('Error rendiciones comuna:', err1);

      // ========== RENDICIONES CONSEJO ==========
      const { data: rendConsejo, error: err2 } = await supabase
        .from('rendiciones')
        .select('*')
        .order('created_at', { ascending: false });
      if (err2) console.error('Error rendiciones consejo:', err2);

      // ========== PRÓRROGAS ==========
      const { data: proComuna, error: err3 } = await supabase
        .from('solicitudes_prorroga_comuna')
        .select('*, proyecto:proyectos_comuna(*)')
        .order('created_at', { ascending: false });
      if (err3) console.error(err3);

      const { data: proConsejo, error: err4 } = await supabase
        .from('solicitudes_prorroga')
        .select('*, proyecto:proyectos(*)')
        .order('created_at', { ascending: false });
      if (err4) console.error(err4);

      // ========== OBTENER PROYECTOS ==========
      const proyectoIdsComuna = [...new Set((rendComuna || []).map(r => r.id_proyecto_comuna))];
      const proyectoIdsConsejo = [...new Set((rendConsejo || []).map(r => r.id_proyecto))];

      let proyectosComunaMap = new Map();
      let proyectosConsejoMap = new Map();

      if (proyectoIdsComuna.length) {
        const { data: projComuna } = await supabase
          .from('proyectos_comuna')
          .select('id_proyecto_comuna, nombre, codigo, categoria_7t, ente_financiamiento, estado')
          .in('id_proyecto_comuna', proyectoIdsComuna);
        projComuna?.forEach(p => proyectosComunaMap.set(p.id_proyecto_comuna, p));
      }

      if (proyectoIdsConsejo.length) {
        const { data: projConsejo } = await supabase
          .from('proyectos')
          .select('id_proyecto, nombre, codigo, categoria_7t, ente_financiamiento, estado')
          .in('id_proyecto', proyectoIdsConsejo);
        projConsejo?.forEach(p => proyectosConsejoMap.set(p.id_proyecto, p));
      }

      const unificados: RegistroUnificado[] = [];

      // Agregar rendiciones comuna
      (rendComuna || []).forEach((r: any) => {
        const proyecto = proyectosComunaMap.get(r.id_proyecto_comuna);
        unificados.push({
          id: `rend-comuna-${r.id_rendicion}`,
          tipo: 'rendicion',
          origen: 'comuna',
          fecha: r.created_at,
          proyectoNombre: proyecto?.nombre || 'Proyecto eliminado',
          proyectoCodigo: proyecto?.codigo || '',
          proyectoCategoria: proyecto?.categoria_7t || '',
          categoria: r.categoria_seleccionada?.toUpperCase() || '—',
          lapsoTiempo: `${new Date(r.fecha_inicio).toLocaleDateString()} - ${new Date(r.fecha_fin).toLocaleDateString()}`,
          ingresos: r.ingresos,
          egresos: r.egresos,
          datos: r,
          proyectoCompleto: proyecto,
        });
      });

      // Agregar rendiciones consejo
      (rendConsejo || []).forEach((r: any) => {
        const proyecto = proyectosConsejoMap.get(r.id_proyecto);
        unificados.push({
          id: `rend-consejo-${r.id_rendicion}`,
          tipo: 'rendicion',
          origen: 'consejo',
          fecha: r.created_at,
          proyectoNombre: proyecto?.nombre || 'Proyecto eliminado',
          proyectoCodigo: proyecto?.codigo || '',
          proyectoCategoria: proyecto?.categoria_7t || '',
          categoria: r.categoria_seleccionada?.toUpperCase() || '—',
          lapsoTiempo: `${new Date(r.fecha_inicio).toLocaleDateString()} - ${new Date(r.fecha_fin).toLocaleDateString()}`,
          ingresos: r.ingresos,
          egresos: r.egresos,
          datos: r,
          proyectoCompleto: proyecto,
        });
      });

      // Prórrogas comuna
      (proComuna || []).forEach((p: any) => {
        unificados.push({
          id: `pro-comuna-${p.id_solicitud}`,
          tipo: 'prorroga',
          origen: 'comuna',
          fecha: p.created_at,
          proyectoNombre: p.proyecto?.nombre || 'Sin proyecto',
          proyectoCodigo: p.proyecto?.codigo || '',
          proyectoCategoria: p.proyecto?.categoria_7t || '',
          categoria: 'Prórroga',
          lapsoTiempo: p.tiempo_estimado || '—',
          estadoProrroga: p.estado,
          datos: p,
          proyectoCompleto: p.proyecto,
        });
      });

      // Prórrogas consejo
      (proConsejo || []).forEach((p: any) => {
        unificados.push({
          id: `pro-consejo-${p.id_solicitud}`,
          tipo: 'prorroga',
          origen: 'consejo',
          fecha: p.created_at,
          proyectoNombre: p.proyecto?.nombre || 'Sin proyecto',
          proyectoCodigo: p.proyecto?.codigo || '',
          proyectoCategoria: p.proyecto?.categoria_7t || '',
          categoria: 'Prórroga',
          lapsoTiempo: p.tiempo_estimado || '—',
          estadoProrroga: p.estado,
          datos: p,
          proyectoCompleto: p.proyecto,
        });
      });

      unificados.sort((a, b) => new Date(b.fecha).getTime() - new Date(a.fecha).getTime());
      setRegistros(unificados);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    cargarDatos();
  }, [cargarDatos]);

  const filtered = registros.filter(reg => {
    if (selectedCategoria !== 'Todas' && reg.proyectoCategoria !== selectedCategoria) return false;
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      return reg.proyectoNombre.toLowerCase().includes(term) || reg.proyectoCodigo.toLowerCase().includes(term);
    }
    return true;
  });

  const totalPages = Math.ceil(filtered.length / itemsPerPage);
  const paginated = filtered.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);
  const resetPagination = () => setCurrentPage(1);

  const handleView = (registro: RegistroUnificado) => {
    setSelectedRegistro(registro);
    if (registro.tipo === 'rendicion') {
      setDetailModalOpen(true);
    } else {
      setSelectedProrroga(registro);
      setProrrogaDetailOpen(true);
    }
  };

  if (loading) return <div className="flex justify-center p-8"><Loader2 className="animate-spin text-brand-primary" size={28} /></div>;

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row gap-3 justify-between items-end">
        <div className="relative w-full sm:w-64">
          <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
          <input
            type="text"
            placeholder="Buscar por proyecto o código..."
            value={searchTerm}
            onChange={(e) => { setSearchTerm(e.target.value); resetPagination(); }}
            className="w-full pl-8 pr-3 py-1.5 rounded-lg border border-gray-200 text-xs focus:ring-2 focus:ring-brand-primary/20"
          />
        </div>
        <select
          value={selectedCategoria}
          onChange={(e) => { setSelectedCategoria(e.target.value); resetPagination(); }}
          className="px-3 py-1.5 rounded-lg border border-brand-primary text-[9px] font-black text-slate-800 bg-white"
        >
          <option value="Todas">Todas las transformaciones</option>
          {['T1','T2','T3','T4','T5','T6','T7'].map(t => <option key={t} value={t}>{t}</option>)}
        </select>
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="p-4 bg-brand-primary text-white">
          <h3 className="font-black uppercase text-[10px]">Listado de Proyectos</h3>
        </div>
        <table className="min-w-full bg-white border border-gray-100 rounded-xl shadow-sm">
          <thead className="bg-gray-50 border-b">
            <tr>
              <th className="px-4 py-2 text-left text-[9px] font-black uppercase text-slate-500">Tipo</th>
              <th className="px-4 py-2 text-left text-[9px] font-black uppercase text-slate-500">Origen</th>
              <th className="px-4 py-2 text-left text-[9px] font-black uppercase text-slate-500">Transformación</th>
              <th className="px-4 py-2 text-left text-[9px] font-black uppercase text-slate-500">Proyecto</th>
              <th className="px-4 py-2 text-left text-[9px] font-black uppercase text-slate-500">Categoría</th>
              <th className="px-4 py-2 text-left text-[9px] font-black uppercase text-slate-500">Lapso / Tiempo</th>
              <th className="px-4 py-2 text-center text-[9px] font-black uppercase text-slate-500">Acciones</th>
            </tr>
          </thead>
          <tbody>
            {paginated.map(reg => (
              <tr key={reg.id} className="border-b border-gray-50 hover:bg-gray-50/30">
                <td className="px-4 py-3">
                  <span className={cn("inline-block px-2 py-0.5 rounded-full text-[9px] font-black", 
                    reg.tipo === 'rendicion' ? "bg-emerald-100 text-emerald-700" : "bg-amber-100 text-amber-700"
                  )}>
                    {reg.tipo === 'rendicion' ? 'Rendición' : 'Prórroga'}
                  </span>
                  {reg.tipo === 'prorroga' && reg.estadoProrroga && (
                    <span className="ml-2 text-[8px] text-slate-400">({reg.estadoProrroga})</span>
                  )}
                </td>
                <td className="px-4 py-3 text-xs capitalize">{reg.origen}</td>
                <td className="px-4 py-3">
                  <span className="inline-block px-2 py-0.5 rounded-full bg-brand-primary/10 text-brand-primary text-[9px] font-black">
                    {reg.proyectoCategoria || 'N/A'}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <div className="text-xs font-bold">{reg.proyectoNombre}</div>
                  <div className="text-[9px] text-slate-400">{reg.proyectoCodigo}</div>
                </td>
                <td className="px-4 py-3 text-xs">{reg.categoria}</td>
                <td className="px-4 py-3 text-xs">{reg.lapsoTiempo}</td>
                <td className="px-4 py-3 text-center">
                  <button onClick={() => handleView(reg)} className="p-1.5 rounded-lg bg-blue-50 text-blue-600 hover:bg-blue-100">
                    <Eye className="h-3.5 w-3.5" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {filtered.length === 0 && (
        <div className="text-center py-8 text-slate-400 border border-dashed rounded-xl">
          <FileText className="h-10 w-10 mx-auto mb-2 text-slate-300" />
          <p className="text-sm font-medium">No hay registros de rendición o prórroga</p>
        </div>
      )}

      {totalPages > 1 && (
        <div className="flex justify-center gap-2 mt-4">
          <button disabled={currentPage===1} onClick={()=>setCurrentPage(p=>p-1)} className="px-3 py-1 rounded border text-xs disabled:opacity-50">Anterior</button>
          <span className="text-xs py-1">Pág. {currentPage} de {totalPages}</span>
          <button disabled={currentPage===totalPages} onClick={()=>setCurrentPage(p=>p+1)} className="px-3 py-1 rounded border text-xs disabled:opacity-50">Siguiente</button>
        </div>
      )}

      <RendicionDetailModal
        isOpen={detailModalOpen}
        onClose={() => setDetailModalOpen(false)}
        registro={selectedRegistro}
      />

      <ProrrogaDetailModal
        isOpen={prorrogaDetailOpen}
        onClose={() => setProrrogaDetailOpen(false)}
        registro={selectedProrroga}
      />
    </div>
  );
};

// ============================================================
//  MODAL RENDICIÓN
// ============================================================
const RendicionDetailModal = ({ isOpen, onClose, registro }: any) => {
  const [vocerosData, setVocerosData] = useState<any[]>([]);
  const [loadingVoceros, setLoadingVoceros] = useState(false);
  const [docUrls, setDocUrls] = useState<Record<string, string | null>>({});
  const [fotosUrls, setFotosUrls] = useState<string[]>([]);
  const [loadingDocs, setLoadingDocs] = useState(false);

  const rendicion = registro?.datos;
  const proyecto = registro?.proyectoCompleto;
  const origen = registro?.origen || 'consejo';

  // Cargar voceros y documentos
  useEffect(() => {
    const fetchData = async () => {
      if (!isOpen || !rendicion) return;

      // Voceros
      if (rendicion.id_voceros_firmantes?.length) {
        setLoadingVoceros(true);
        const table = origen === 'comuna' ? 'voceros_comuna' : 'voceros';
        const idField = origen === 'comuna' ? 'id_voceroc' : 'id_vocero';
        try {
          const { data } = await supabase
            .from(table)
            .select('nombre_completo, cedula')
            .in(idField, rendicion.id_voceros_firmantes);
          setVocerosData(data || []);
        } catch {} finally { setLoadingVoceros(false); }
      }

      // Documentos
      setLoadingDocs(true);
      const docsMap: Record<string, string | null> = {};
      const paths = [
        { key: 'acta', path: rendicion.acta_asamblea_url },
        { key: 'facturas', path: rendicion.facturas_legales_url },
        { key: 'contraloria', path: rendicion.informe_contraloria_url },
        { key: 'estado_cuenta', path: rendicion.estado_cuenta_url }
      ];
      for (const { key, path } of paths) {
        if (path) {
          // Si es facturas, puede ser array JSON -> tomamos el primero
          let realPath = path;
          if (key === 'facturas') {
            try {
              const parsed = JSON.parse(path);
              if (Array.isArray(parsed) && parsed.length) realPath = parsed[0];
            } catch {}
          }
          docsMap[key] = await getDocumentUrl(realPath, origen, 'rendicion');
        } else {
          docsMap[key] = null;
        }
      }
      setDocUrls(docsMap);

      // Fotos de evidencia
      const fotos = rendicion.fotos_evidencia_urls || [];
      const fotosProcesadas = await Promise.all(
        fotos.map(async (url: string) => {
          const processed = await getDocumentUrl(url, origen, 'rendicion');
          return processed || url; // si falla, mostrar la original como fallback
        })
      );
      setFotosUrls(fotosProcesadas);
      setLoadingDocs(false);
    };
    fetchData();
  }, [isOpen, rendicion, origen]);

  if (!isOpen || !rendicion || !proyecto) return null;

  const saldo = rendicion.ingresos - rendicion.egresos;

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose} className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm" />
          <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }} className="relative w-full max-w-2xl bg-white rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[80vh]">
            {/* Cabecera con gradiente */}
            <div className="bg-gradient-to-r from-brand-primary to-emerald-600 px-5 py-3 flex justify-between items-center sticky top-0 z-10">
              <div className="flex items-center gap-3">
                <div className="bg-white/20 p-1.5 rounded-lg">
                  <FileText className="h-5 w-5 text-white" />
                </div>
                <div>
                  <h4 className="font-black text-white text-sm uppercase tracking-tight">Detalle de Rendición</h4>
                  <p className="text-white/70 text-[9px] font-bold uppercase tracking-widest">{proyecto.codigo || 'Sin código'}</p>
                </div>
              </div>
              <button onClick={onClose} className="text-white/70 hover:text-white transition-colors p-1 rounded-lg hover:bg-white/10">
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto px-5 py-4 space-y-4">
              {/* Proyecto */}
              <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
                <p className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">Proyecto</p>
                <p className="text-sm font-black text-slate-800">{proyecto.nombre}</p>
                <div className="flex gap-2 mt-1">
                  <span className="inline-block px-2 py-0.5 rounded-full bg-brand-primary/10 text-brand-primary text-[9px] font-black">{proyecto.categoria_7t}</span>
                  <span className="inline-block px-2 py-0.5 rounded-full bg-slate-200 text-slate-600 text-[9px] font-black uppercase">{origen}</span>
                </div>
              </div>

              {/* Resumen financiero */}
              <div className="grid grid-cols-3 gap-2">
                <div className="bg-emerald-50 p-2.5 rounded-xl border border-emerald-100">
                  <p className="text-[8px] font-bold text-emerald-600 uppercase tracking-wider">Ingresos</p>
                  <p className="text-sm font-black text-emerald-700">${rendicion.ingresos?.toLocaleString()}</p>
                </div>
                <div className="bg-rose-50 p-2.5 rounded-xl border border-rose-100">
                  <p className="text-[8px] font-bold text-rose-600 uppercase tracking-wider">Egresos</p>
                  <p className="text-sm font-black text-rose-700">${rendicion.egresos?.toLocaleString()}</p>
                </div>
                <div className={cn("p-2.5 rounded-xl border", saldo >= 0 ? "bg-emerald-50 border-emerald-100" : "bg-rose-50 border-rose-100")}>
                  <p className="text-[8px] font-bold text-slate-500 uppercase tracking-wider">Saldo</p>
                  <p className={cn("text-sm font-black", saldo >= 0 ? "text-emerald-700" : "text-rose-700")}>${saldo.toLocaleString()}</p>
                </div>
              </div>

              {/* Fechas y categoría */}
              <div className="grid grid-cols-2 gap-3 text-xs">
                <div className="bg-slate-50 p-2 rounded-lg">
                  <p className="text-[8px] font-bold text-slate-400 uppercase">Período</p>
                  <p className="font-medium">{new Date(rendicion.fecha_inicio).toLocaleDateString()} - {new Date(rendicion.fecha_fin).toLocaleDateString()}</p>
                </div>
                <div className="bg-slate-50 p-2 rounded-lg">
                  <p className="text-[8px] font-bold text-slate-400 uppercase">Categoría</p>
                  <p className="font-medium uppercase">{rendicion.categoria_seleccionada}</p>
                </div>
              </div>

              {/* Informe de gestión */}
              {rendicion.informe_gestion && (
                <div>
                  <p className="text-[9px] font-bold text-slate-400 uppercase tracking-wider mb-1">Informe de gestión</p>
                  <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-100 max-h-28 overflow-y-auto text-xs text-slate-700 leading-relaxed">
                    {rendicion.informe_gestion}
                  </div>
                </div>
              )}

              {/* Documentos */}
              <div>
                <p className="text-[9px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">Documentos adjuntos</p>
                {loadingDocs ? (
                  <Loader2 className="animate-spin h-4 w-4 text-slate-400" />
                ) : (
                  <div className="flex flex-wrap gap-2">
                    {docUrls.acta && (
                      <a href={docUrls.acta} target="_blank" rel="noopener" className="inline-flex items-center gap-1 px-2.5 py-1 bg-blue-50 text-blue-600 rounded-lg text-[9px] font-bold hover:bg-blue-100 transition">
                        <FileText className="h-3 w-3" /> Acta
                      </a>
                    )}
                    {docUrls.facturas && (
                      <a href={docUrls.facturas} target="_blank" rel="noopener" className="inline-flex items-center gap-1 px-2.5 py-1 bg-indigo-50 text-indigo-600 rounded-lg text-[9px] font-bold hover:bg-indigo-100 transition">
                        <Receipt className="h-3 w-3" /> Facturas
                      </a>
                    )}
                    {docUrls.contraloria && (
                      <a href={docUrls.contraloria} target="_blank" rel="noopener" className="inline-flex items-center gap-1 px-2.5 py-1 bg-amber-50 text-amber-600 rounded-lg text-[9px] font-bold hover:bg-amber-100 transition">
                        <AlertCircle className="h-3 w-3" /> Contraloría
                      </a>
                    )}
                    {docUrls.estado_cuenta && (
                      <a href={docUrls.estado_cuenta} target="_blank" rel="noopener" className="inline-flex items-center gap-1 px-2.5 py-1 bg-emerald-50 text-emerald-600 rounded-lg text-[9px] font-bold hover:bg-emerald-100 transition">
                        <DollarSign className="h-3 w-3" /> Estado cuenta
                      </a>
                    )}
                  </div>
                )}
              </div>

              {/* Fotos de evidencia */}
              {fotosUrls.length > 0 && (
                <div>
                  <p className="text-[9px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">Fotos de evidencia</p>
                  <div className="grid grid-cols-4 gap-2">
                    {fotosUrls.map((url: string, idx: number) => (
                      <a
                        key={idx}
                        href={url}
                        target="_blank"
                        rel="noopener"
                        className="relative aspect-square rounded-lg overflow-hidden border border-slate-200 hover:shadow-md transition group"
                      >
                        <img src={url} className="w-full h-full object-cover" alt={`Evidencia ${idx+1}`} />
                        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition flex items-center justify-center">
                          <Camera className="h-5 w-5 text-white opacity-0 group-hover:opacity-100 transition" />
                        </div>
                      </a>
                    ))}
                  </div>
                </div>
              )}

              {/* Voceros firmantes */}
              <div>
                <p className="text-[9px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">Voceros firmantes</p>
                {loadingVoceros ? (
                  <Loader2 className="animate-spin h-4 w-4 text-slate-400" />
                ) : vocerosData.length > 0 ? (
                  <div className="space-y-1">
                    {vocerosData.map((v, i) => (
                      <div key={i} className="flex items-center justify-between bg-slate-50 p-1.5 rounded-lg text-xs">
                        <span className="font-medium">{v.nombre_completo}</span>
                        <span className="text-slate-500 font-mono">{v.cedula}</span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-slate-400">No hay voceros registrados</p>
                )}
              </div>
            </div>

            {/* Footer */}
            <div className="px-5 py-3 bg-slate-50 border-t border-slate-100 flex justify-end">
              <button onClick={onClose} className="px-4 py-1.5 bg-white border border-slate-200 rounded-lg text-[9px] font-black uppercase text-slate-600 hover:bg-slate-50 transition">
                Cerrar
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

// ============================================================
//  MODAL PRÓRROGA
// ============================================================
const ProrrogaDetailModal = ({ isOpen, onClose, registro }: any) => {
  const prorroga = registro?.datos;
  const proyecto = registro?.proyectoCompleto;
  const origen = registro?.origen || 'consejo';
  const [vocerosData, setVocerosData] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [docUrls, setDocUrls] = useState<{ acta: string | null; evidencia: string | null }>({ acta: null, evidencia: null });
  const [loadingDocs, setLoadingDocs] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      if (!isOpen || !prorroga) return;

      // Voceros
      if (prorroga.id_voceros_firmantes?.length) {
        setLoading(true);
        const table = origen === 'comuna' ? 'voceros_comuna' : 'voceros';
        const idField = origen === 'comuna' ? 'id_voceroc' : 'id_vocero';
        try {
          const { data } = await supabase
            .from(table)
            .select('nombre_completo, cedula')
            .in(idField, prorroga.id_voceros_firmantes);
          setVocerosData(data || []);
        } catch {} finally { setLoading(false); }
      }

      // Documentos (prórrogas usan 'prorroga' como tipo)
      setLoadingDocs(true);
      const actaUrl = prorroga.acta_url ? await getDocumentUrl(prorroga.acta_url, origen, 'prorroga') : null;
      const evidenciaUrl = prorroga.evidencia_url ? await getDocumentUrl(prorroga.evidencia_url, origen, 'prorroga') : null;
      setDocUrls({ acta: actaUrl, evidencia: evidenciaUrl });
      setLoadingDocs(false);
    };
    fetchData();
  }, [isOpen, prorroga, origen]);

  if (!isOpen || !prorroga || !proyecto) return null;

  const estadoColors: any = {
    pendiente: 'bg-amber-100 text-amber-700 border-amber-200',
    aprobado: 'bg-emerald-100 text-emerald-700 border-emerald-200',
    rechazado: 'bg-rose-100 text-rose-700 border-rose-200'
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose} className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm" />
          <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }} className="relative w-full max-w-lg bg-white rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[80vh]">
            {/* Cabecera con gradiente */}
            <div className="bg-gradient-to-r from-amber-500 to-orange-500 px-5 py-3 flex justify-between items-center sticky top-0 z-10">
              <div className="flex items-center gap-3">
                <div className="bg-white/20 p-1.5 rounded-lg">
                  <Clock className="h-5 w-5 text-white" />
                </div>
                <div>
                  <h4 className="font-black text-white text-sm uppercase tracking-tight">Detalle de Prórroga</h4>
                  <p className="text-white/70 text-[9px] font-bold uppercase tracking-widest">{proyecto.codigo || 'Sin código'}</p>
                </div>
              </div>
              <button onClick={onClose} className="text-white/70 hover:text-white transition-colors p-1 rounded-lg hover:bg-white/10">
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto px-5 py-4 space-y-4">
              {/* Proyecto */}
              <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
                <p className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">Proyecto</p>
                <p className="text-sm font-black text-slate-800">{proyecto.nombre}</p>
                <div className="flex gap-2 mt-1">
                  <span className="inline-block px-2 py-0.5 rounded-full bg-brand-primary/10 text-brand-primary text-[9px] font-black">{proyecto.categoria_7t}</span>
                  <span className="inline-block px-2 py-0.5 rounded-full bg-slate-200 text-slate-600 text-[9px] font-black uppercase">{origen}</span>
                </div>
              </div>

              {/* Estado */}
              <div className="flex items-center gap-3">
                <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">Estado</span>
                <span className={cn("px-3 py-1 rounded-full text-[9px] font-black uppercase border", estadoColors[prorroga.estado] || 'bg-gray-100 text-gray-700')}>
                  {prorroga.estado}
                </span>
              </div>

              {/* Motivo */}
              <div>
                <p className="text-[9px] font-bold text-slate-400 uppercase tracking-wider mb-1">Motivo</p>
                <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-100 text-sm text-slate-700">
                  {prorroga.motivo}
                </div>
              </div>

              {/* Presupuesto y tiempo */}
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-emerald-50 p-2.5 rounded-xl border border-emerald-100">
                  <p className="text-[8px] font-bold text-emerald-600 uppercase tracking-wider">Presupuesto estimado</p>
                  <p className="text-sm font-black text-emerald-700">${prorroga.presupuesto_estimado?.toLocaleString()}</p>
                </div>
                <div className="bg-amber-50 p-2.5 rounded-xl border border-amber-100">
                  <p className="text-[8px] font-bold text-amber-600 uppercase tracking-wider">Tiempo estimado</p>
                  <p className="text-sm font-black text-amber-700">{prorroga.tiempo_estimado}</p>
                </div>
              </div>

              {/* Documentos */}
              {(docUrls.acta || docUrls.evidencia) && (
                <div>
                  <p className="text-[9px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">Documentos adjuntos</p>
                  <div className="flex flex-wrap gap-2">
                    {docUrls.acta && (
                      <a href={docUrls.acta} target="_blank" rel="noopener" className="inline-flex items-center gap-1 px-2.5 py-1 bg-blue-50 text-blue-600 rounded-lg text-[9px] font-bold hover:bg-blue-100 transition">
                        <FileText className="h-3 w-3" /> Acta
                      </a>
                    )}
                    {docUrls.evidencia && (
                      <a href={docUrls.evidencia} target="_blank" rel="noopener" className="inline-flex items-center gap-1 px-2.5 py-1 bg-indigo-50 text-indigo-600 rounded-lg text-[9px] font-bold hover:bg-indigo-100 transition">
                        <Image className="h-3 w-3" /> Evidencia
                      </a>
                    )}
                  </div>
                </div>
              )}

              {/* Voceros firmantes */}
              <div>
                <p className="text-[9px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">Voceros firmantes</p>
                {loading ? (
                  <Loader2 className="animate-spin h-4 w-4 text-slate-400" />
                ) : vocerosData.length > 0 ? (
                  <div className="space-y-1">
                    {vocerosData.map((v, i) => (
                      <div key={i} className="flex items-center justify-between bg-slate-50 p-1.5 rounded-lg text-xs">
                        <span className="font-medium">{v.nombre_completo}</span>
                        <span className="text-slate-500 font-mono">{v.cedula}</span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-slate-400">No hay voceros registrados</p>
                )}
              </div>
            </div>

            {/* Footer */}
            <div className="px-5 py-3 bg-slate-50 border-t border-slate-100 flex justify-end">
              <button onClick={onClose} className="px-4 py-1.5 bg-white border border-slate-200 rounded-lg text-[9px] font-black uppercase text-slate-600 hover:bg-slate-50 transition">
                Cerrar
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};