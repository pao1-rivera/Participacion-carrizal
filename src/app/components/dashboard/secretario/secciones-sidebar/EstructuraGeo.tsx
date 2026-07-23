'use client';
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { 
  Building2, Globe, Users, Search, Filter, 
  CheckCircle2, XCircle, AlertCircle, ChevronLeft, ChevronRight, Loader2,
  Home, MapPin, Calendar, X, FileText, CreditCard, Link as LinkIcon
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/app/lib/utils';
import { supabase } from '@/app/lib/supabaseClient';

// ==================== TIPOS ====================
interface Comuna {
  id_comuna: number;
  nombre_comuna: string;
  rif: string;
  codigo_situr: string | null;
  activo: boolean;
  fecha_vencimiento_voceros: string | null;
  fecha_vencimiento_rif: string | null;
  carta_fundacional_url?: string | null;
  cuenta_bancaria?: string | null;
  rif_url?: string | null;
  certificado_cuenta_url?: string | null;
}

interface ConsejoComunal {
  id_consejo: number;
  nombre_consejo: string;
  rif: string;
  codigo_situr: string | null;
  estatus_validacion: string;
  fecha_vencimiento_voceros: string | null;
  fecha_vencimiento_rif: string | null;
  cuenta_bancaria?: string | null;
  acta_constitutiva_url?: string | null;
  rif_url?: string | null;
  certificado_cuenta_url?: string | null;
  motivo_rechazo?: string | null;
}

interface SalaAutogobierno {
  id_sala: number;
  nombre_sala: string;
  ubicacion: string;
  estatus: string;
  id_comuna: number | null;
  id_sector: number | null;
  acta_constitutiva_url?: string | null;
  created_at?: string;
}

type Entidad = {
  id: number;
  nombre: string;
  tipo: 'comuna' | 'consejo' | 'sala';
  detalles: any;
};

// ==================== COMPONENTE PRINCIPAL ====================
export const EstructuraGeo = () => {
  const [loading, setLoading] = useState(true);
  const [comunas, setComunas] = useState<Comuna[]>([]);
  const [consejos, setConsejos] = useState<ConsejoComunal[]>([]);
  const [salas, setSalas] = useState<SalaAutogobierno[]>([]);
  const [filterType, setFilterType] = useState<string>('todos');
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedEntity, setSelectedEntity] = useState<Entidad | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const itemsPerPage = 9;

  // ========== OCULTAR SIDEBAR CUANDO MODAL ESTÁ ABIERTA ==========
  useEffect(() => {
    if (modalOpen) {
      document.body.classList.add('modal-open');
      const styleId = 'modal-sidebar-hide-geo';
      if (!document.getElementById(styleId)) {
        const style = document.createElement('style');
        style.id = styleId;
        style.textContent = `
          .modal-open .sidebar,
          .modal-open [class*="sidebar"],
          .modal-open aside {
            display: none !important;
          }
          .modal-open .main-content,
          .modal-open [class*="main"] {
            margin-left: 0 !important;
            width: 100% !important;
          }
        `;
        document.head.appendChild(style);
      }
    } else {
      document.body.classList.remove('modal-open');
      const styleElement = document.getElementById('modal-sidebar-hide-geo');
      if (styleElement) styleElement.remove();
    }
    return () => {
      document.body.classList.remove('modal-open');
      const styleElement = document.getElementById('modal-sidebar-hide-geo');
      if (styleElement) styleElement.remove();
    };
  }, [modalOpen]);

  // Estadísticas
  const stats = useMemo(() => ({
    totalComunas: comunas.length,
    totalConsejos: consejos.length,
    totalSalas: salas.length,
    totalEntidades: comunas.length + consejos.length + salas.length,
  }), [comunas.length, consejos.length, salas.length]);

  // 🔥 CORREGIDO: Función para obtener URL firmada (signed URL) – buckets privados
  const getSignedUrl = async (bucket: string, filePath: string): Promise<string | null> => {
    if (!filePath) return null;
    try {
      const { data, error } = await supabase.storage
        .from(bucket)
        .createSignedUrl(filePath, 3600); // 1 hora de vigencia
      if (error) {
        console.error(`Error obteniendo signed URL (${bucket}/${filePath}):`, error);
        return null;
      }
      return data.signedUrl;
    } catch (err) {
      console.error('Error inesperado:', err);
      return null;
    }
  };

  // Cargar datos desde Supabase
  const cargarDatos = useCallback(async () => {
    setLoading(true);
    try {
      const { data: comunasData, error: comunasError } = await supabase
        .from('datos_comuna')
        .select(`
          id_comuna, nombre_comuna, rif, codigo_situr, activo, 
          fecha_vencimiento_voceros, fecha_vencimiento_rif,
          carta_fundacional_url, cuenta_bancaria, rif_url, 
          certificado_cuenta_url
        `)
        .order('nombre_comuna');
      if (comunasError) throw comunasError;
      setComunas(comunasData || []);

      const { data: consejosData, error: consejosError } = await supabase
        .from('datos_consejo_comunal')
        .select(`
          id_consejo, nombre_consejo, rif, codigo_situr, estatus_validacion,
          fecha_vencimiento_voceros, fecha_vencimiento_rif,
          cuenta_bancaria, acta_constitutiva_url, rif_url,
          certificado_cuenta_url, motivo_rechazo
        `)
        .order('nombre_consejo');
      if (consejosError) throw consejosError;
      setConsejos(consejosData || []);

      const { data: salasData, error: salasError } = await supabase
        .from('datos_sala_autogobierno')
        .select(`
          id_sala, nombre_sala, ubicacion, estatus, id_comuna, id_sector,
          acta_constitutiva_url, created_at
        `)
        .order('nombre_sala');
      if (salasError) throw salasError;
      setSalas(salasData || []);
    } catch (error) {
      console.error('Error cargando datos geopolíticos:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    cargarDatos();
  }, [cargarDatos]);

  // Construir lista unificada de entidades
  const entidades: Entidad[] = useMemo(() => {
    const lista: Entidad[] = [];
    comunas.forEach(c => {
      lista.push({
        id: c.id_comuna,
        nombre: c.nombre_comuna,
        tipo: 'comuna',
        detalles: c,
      });
    });
    consejos.forEach(c => {
      lista.push({
        id: c.id_consejo,
        nombre: c.nombre_consejo,
        tipo: 'consejo',
        detalles: c,
      });
    });
    salas.forEach(s => {
      lista.push({
        id: s.id_sala,
        nombre: s.nombre_sala,
        tipo: 'sala',
        detalles: s,
      });
    });
    return lista;
  }, [comunas, consejos, salas]);

  // Filtrar
  const entidadesFiltradas = useMemo(() => {
    let filtered = entidades;
    if (filterType !== 'todos') {
      filtered = filtered.filter(e => e.tipo === filterType);
    }
    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(e => e.nombre.toLowerCase().includes(term));
    }
    return filtered;
  }, [entidades, filterType, searchTerm]);

  // Paginación
  const totalPages = Math.ceil(entidadesFiltradas.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const currentItems = entidadesFiltradas.slice(startIndex, startIndex + itemsPerPage);

  useEffect(() => {
    setCurrentPage(1);
  }, [filterType, searchTerm]);

  const goToPage = (page: number) => {
    if (page >= 1 && page <= totalPages) setCurrentPage(page);
  };

  const handleCardClick = (entidad: Entidad) => {
    setSelectedEntity(entidad);
    setModalOpen(true);
  };

  const handleCloseModal = () => {
    setModalOpen(false);
    setSelectedEntity(null);
  };

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-[#008f82]" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Tarjetas de resumen */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <ResumenCard label="Total Entidades" value={stats.totalEntidades} icon={<Building2 size={16} />} color="bg-brand-primary" />
        <ResumenCard label="Comunas" value={stats.totalComunas} icon={<Globe size={16} />} color="bg-orange-500" />
        <ResumenCard label="Consejos Comunales" value={stats.totalConsejos} icon={<Users size={16} />} color="bg-blue-500" />
        <ResumenCard label="Salas de Autogobierno" value={stats.totalSalas} icon={<Building2 size={16} />} color="bg-emerald-500" />
      </div>

      {/* Filtros y buscador */}
      <div className="flex flex-col md:flex-row gap-3 items-start md:items-center justify-between">
        <div className="flex gap-2 bg-slate-100 p-1 rounded-lg flex-wrap">
          <FilterChip active={filterType === 'todos'} onClick={() => setFilterType('todos')} label="Todos" count={stats.totalEntidades} />
          <FilterChip active={filterType === 'comuna'} onClick={() => setFilterType('comuna')} label="Comunas" count={stats.totalComunas} />
          <FilterChip active={filterType === 'consejo'} onClick={() => setFilterType('consejo')} label="Consejos" count={stats.totalConsejos} />
          <FilterChip active={filterType === 'sala'} onClick={() => setFilterType('sala')} label="Salas" count={stats.totalSalas} />
        </div>
        <div className="relative w-full md:w-64">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={14} />
          <input
            type="text"
            placeholder="Buscar por nombre..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-4 py-2 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#008f82]"
          />
        </div>
      </div>

      {/* Grid de tarjetas */}
      {currentItems.length === 0 ? (
        <div className="bg-white rounded-2xl border border-gray-100 p-12 text-center text-gray-400">
          No se encontraron entidades que coincidan con los filtros
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {currentItems.map((entidad) => (
              <EntidadCard 
                key={`${entidad.tipo}-${entidad.id}`} 
                entidad={entidad} 
                onClick={() => handleCardClick(entidad)}
              />
            ))}
          </div>

          {/* Paginación */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between pt-4 border-t border-gray-100">
              <p className="text-[9px] text-gray-500">
                Mostrando {startIndex + 1} - {Math.min(startIndex + itemsPerPage, entidadesFiltradas.length)} de {entidadesFiltradas.length}
              </p>
              <div className="flex gap-1">
                <button onClick={() => goToPage(currentPage - 1)} disabled={currentPage === 1} className={cn("p-1.5 rounded-lg border border-gray-200", currentPage === 1 ? "opacity-40 cursor-not-allowed" : "hover:bg-gray-50")}>
                  <ChevronLeft size={14} />
                </button>
                <div className="flex gap-0.5">
                  {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                    let pageNum;
                    if (totalPages <= 5) pageNum = i + 1;
                    else if (currentPage <= 3) pageNum = i + 1;
                    else if (currentPage >= totalPages - 2) pageNum = totalPages - 4 + i;
                    else pageNum = currentPage - 2 + i;
                    return (
                      <button key={pageNum} onClick={() => goToPage(pageNum)} className={cn("w-7 h-7 rounded-lg text-[10px] font-bold", currentPage === pageNum ? "bg-[#008f82] text-white" : "bg-white border border-gray-200 text-gray-600 hover:bg-gray-50")}>
                        {pageNum}
                      </button>
                    );
                  })}
                </div>
                <button onClick={() => goToPage(currentPage + 1)} disabled={currentPage === totalPages} className={cn("p-1.5 rounded-lg border border-gray-200", currentPage === totalPages ? "opacity-40 cursor-not-allowed" : "hover:bg-gray-50")}>
                  <ChevronRight size={14} />
                </button>
              </div>
            </div>
          )}
        </>
      )}

      {/* Modal de detalle completo */}
      <AnimatePresence>
        {modalOpen && selectedEntity && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={handleCloseModal} />
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="relative w-full max-w-2xl bg-white rounded-2xl shadow-2xl overflow-hidden max-h-[90vh] flex flex-col"
            >
              {/* Header del modal */}
              <div className={cn(
                "p-4 text-white sticky top-0 z-10",
                selectedEntity.tipo === 'comuna' ? "bg-orange-600" : 
                selectedEntity.tipo === 'consejo' ? "bg-blue-600" : "bg-emerald-600"
              )}>
                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-2">
                    {selectedEntity.tipo === 'comuna' && <Globe size={20} />}
                    {selectedEntity.tipo === 'consejo' && <Users size={20} />}
                    {selectedEntity.tipo === 'sala' && <Building2 size={20} />}
                    <h3 className="font-black text-sm uppercase tracking-tighter">{selectedEntity.nombre}</h3>
                  </div>
                  <button onClick={handleCloseModal} className="p-1 rounded-full hover:bg-white/20 transition">
                    <X size={18} />
                  </button>
                </div>
                <p className="text-[9px] font-bold opacity-80 mt-1">
                  {selectedEntity.tipo === 'comuna' ? 'Comuna' : selectedEntity.tipo === 'consejo' ? 'Consejo Comunal' : 'Sala de Autogobierno'}
                </p>
              </div>

              {/* Cuerpo del modal con scroll */}
              <div className="flex-1 overflow-y-auto p-5 space-y-4">
                <DetallesEntidad 
                  entidad={selectedEntity} 
                  getSignedUrl={getSignedUrl} // pasamos la función de signed URL
                />
              </div>

              {/* Footer */}
              <div className="p-4 bg-gray-50 border-t border-gray-100 flex justify-end">
                <button
                  onClick={handleCloseModal}
                  className="px-5 py-2 bg-gray-200 text-gray-700 rounded-lg text-[10px] font-black uppercase tracking-wider hover:bg-gray-300 transition"
                >
                  Cerrar
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

// ==================== TARJETA DE ENTIDAD ====================
const EntidadCard = ({ entidad, onClick }: { entidad: Entidad; onClick: () => void }) => {
  const getIconoTipo = (tipo: string) => {
    switch(tipo) {
      case 'comuna': return <Globe size={18} className="text-orange-500" />;
      case 'consejo': return <Users size={18} className="text-blue-500" />;
      default: return <Building2 size={18} className="text-emerald-500" />;
    }
  };

  const renderResumen = () => {
    if (entidad.tipo === 'comuna') {
      const c = entidad.detalles as Comuna;
      return (
        <div className="space-y-2 mt-2">
          <div className="flex items-center justify-between text-[10px]">
            <span className="text-gray-500">RIF:</span>
            <span className="font-mono font-medium">{c.rif}</span>
          </div>
          <div className="flex items-center justify-between text-[10px]">
            <span className="text-gray-500">Estado:</span>
            <span className={cn("px-2 py-0.5 rounded-full text-[8px] font-bold", c.activo ? "bg-emerald-100 text-emerald-700" : "bg-red-100 text-red-700")}>
              {c.activo ? 'Activo' : 'Inactivo'}
            </span>
          </div>
        </div>
      );
    }
    if (entidad.tipo === 'consejo') {
      const c = entidad.detalles as ConsejoComunal;
      const estatusColor = c.estatus_validacion === 'APROBADO' ? 'bg-emerald-100 text-emerald-700' :
                          c.estatus_validacion === 'RECHAZADO' ? 'bg-red-100 text-red-700' : 'bg-amber-100 text-amber-700';
      return (
        <div className="space-y-2 mt-2">
          <div className="flex items-center justify-between text-[10px]">
            <span className="text-gray-500">RIF:</span>
            <span className="font-mono font-medium">{c.rif}</span>
          </div>
          <div className="flex items-center justify-between text-[10px]">
            <span className="text-gray-500">Validación:</span>
            <span className={cn("px-2 py-0.5 rounded-full text-[8px] font-bold", estatusColor)}>
              {c.estatus_validacion}
            </span>
          </div>
        </div>
      );
    }
    const s = entidad.detalles as SalaAutogobierno;
    const estatusSala = s.estatus === 'consolidada' ? 'Consolidada' : s.estatus === 'fortalecimiento' ? 'Fortalecimiento' : 'En Revisión';
    const estatusColor = s.estatus === 'consolidada' ? 'bg-emerald-100 text-emerald-700' :
                         s.estatus === 'fortalecimiento' ? 'bg-amber-100 text-amber-700' : 'bg-blue-100 text-blue-700';
    return (
      <div className="space-y-2 mt-2">
        <div className="flex items-center gap-1 text-[10px] text-gray-600">
          <MapPin size={12} />
          <span className="truncate">{s.ubicacion || 'Ubicación no registrada'}</span>
        </div>
        <div className="flex items-center justify-between text-[10px]">
          <span className="text-gray-500">Estatus:</span>
          <span className={cn("px-2 py-0.5 rounded-full text-[8px] font-bold", estatusColor)}>
            {estatusSala}
          </span>
        </div>
      </div>
    );
  };

  const tipoTexto = entidad.tipo === 'comuna' ? 'Comuna' : entidad.tipo === 'consejo' ? 'Consejo Comunal' : 'Sala';
  const colorBorde = entidad.tipo === 'comuna' ? 'border-l-orange-400' : entidad.tipo === 'consejo' ? 'border-l-blue-400' : 'border-l-emerald-400';

  return (
    <div 
      onClick={onClick}
      className={cn("bg-white rounded-xl border border-gray-100 shadow-sm hover:shadow-md transition-all overflow-hidden border-l-4 cursor-pointer hover:scale-[1.02] duration-200", colorBorde)}
    >
      <div className="p-4">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-lg bg-gray-50">
              {getIconoTipo(entidad.tipo)}
            </div>
            <div>
              <h4 className="font-black text-gray-800 text-sm uppercase tracking-tight">{entidad.nombre}</h4>
              <p className="text-[8px] font-bold text-gray-400 uppercase tracking-wider">{tipoTexto}</p>
            </div>
          </div>
        </div>
        {renderResumen()}
      </div>
    </div>
  );
};

// ==================== COMPONENTE DE DETALLE COMPLETO PARA MODAL (CON URLs FIRMADAS) ====================
const DetallesEntidad = ({ entidad, getSignedUrl }: { entidad: Entidad; getSignedUrl: (bucket: string, path: string) => Promise<string | null> }) => {
  const [documentosConUrl, setDocumentosConUrl] = useState<{ label: string; url: string }[]>([]);
  const [cargandoDocs, setCargandoDocs] = useState(false);

  useEffect(() => {
    const cargarUrls = async () => {
      setCargandoDocs(true);
      let docs: { label: string; path: string; bucket: string }[] = [];

      if (entidad.tipo === 'comuna') {
        const c = entidad.detalles as Comuna;
        const bucket = 'documentos_comuna';
        docs = [
          c.carta_fundacional_url && { label: "Carta Fundacional", path: c.carta_fundacional_url, bucket },
          c.rif_url && { label: "Documento RIF", path: c.rif_url, bucket },
          c.certificado_cuenta_url && { label: "Certificado Cuenta", path: c.certificado_cuenta_url, bucket }
        ].filter(Boolean) as { label: string; path: string; bucket: string }[];
      } else if (entidad.tipo === 'consejo') {
        const c = entidad.detalles as ConsejoComunal;
        const bucket = 'documentos_consejos';
        docs = [
          c.acta_constitutiva_url && { label: "Acta Constitutiva", path: c.acta_constitutiva_url, bucket },
          c.rif_url && { label: "Documento RIF", path: c.rif_url, bucket },
          c.certificado_cuenta_url && { label: "Certificado Cuenta", path: c.certificado_cuenta_url, bucket }
        ].filter(Boolean) as { label: string; path: string; bucket: string }[];
      } else { // sala
        const s = entidad.detalles as SalaAutogobierno;
        const bucket = 'documentos_salas';
        docs = s.acta_constitutiva_url ? [{ label: "Acta Constitutiva", path: s.acta_constitutiva_url, bucket }] : [];
      }

      // Obtener URLs firmadas en paralelo
      const resultados = await Promise.all(
        docs.map(async (doc) => {
          const url = await getSignedUrl(doc.bucket, doc.path);
          return { label: doc.label, url: url || '' };
        })
      );
      // Filtrar los que tienen URL (no null)
      setDocumentosConUrl(resultados.filter(d => d.url !== '') as { label: string; url: string }[]);
      setCargandoDocs(false);
    };

    cargarUrls();
  }, [entidad, getSignedUrl]);

  if (entidad.tipo === 'comuna') {
    const c = entidad.detalles as Comuna;
    return (
      <div className="space-y-4">
        <InfoRow label="RIF" value={c.rif} />
        <InfoRow label="Código SITUR" value={c.codigo_situr || 'No registrado'} />
        <InfoRow label="Estado" value={c.activo ? 'Activo' : 'Inactivo'} />
        <InfoRow label="Cuenta Bancaria" value={c.cuenta_bancaria || 'No registrada'} />
        <InfoRow label="Fecha vencimiento voceros" value={c.fecha_vencimiento_voceros ? new Date(c.fecha_vencimiento_voceros).toLocaleDateString() : 'No registrada'} />
        <InfoRow label="Fecha vencimiento RIF" value={c.fecha_vencimiento_rif ? new Date(c.fecha_vencimiento_rif).toLocaleDateString() : 'No registrada'} />
        <DocumentosRow documentos={documentosConUrl} cargando={cargandoDocs} />
      </div>
    );
  }
  if (entidad.tipo === 'consejo') {
    const c = entidad.detalles as ConsejoComunal;
    const estatusText = 
      c.estatus_validacion === 'APROBADO' ? 'Aprobado' :
      c.estatus_validacion === 'RECHAZADO' ? 'Rechazado' : 'Pendiente';
    return (
      <div className="space-y-4">
        <InfoRow label="RIF" value={c.rif} />
        <InfoRow label="Código SITUR" value={c.codigo_situr || 'No registrado'} />
        <InfoRow label="Estatus Validación" value={estatusText} />
        {c.motivo_rechazo && <InfoRow label="Motivo de rechazo" value={c.motivo_rechazo} />}
        <InfoRow label="Cuenta Bancaria" value={c.cuenta_bancaria || 'No registrada'} />
        <InfoRow label="Fecha vencimiento voceros" value={c.fecha_vencimiento_voceros ? new Date(c.fecha_vencimiento_voceros).toLocaleDateString() : 'No registrada'} />
        <InfoRow label="Fecha vencimiento RIF" value={c.fecha_vencimiento_rif ? new Date(c.fecha_vencimiento_rif).toLocaleDateString() : 'No registrada'} />
        <DocumentosRow documentos={documentosConUrl} cargando={cargandoDocs} />
      </div>
    );
  }
  // Sala
  const s = entidad.detalles as SalaAutogobierno;
  const estatusSala = s.estatus === 'consolidada' ? 'Consolidada' : s.estatus === 'fortalecimiento' ? 'Fortalecimiento' : 'En Revisión';
  return (
    <div className="space-y-4">
      <InfoRow label="Ubicación" value={s.ubicacion || 'No registrada'} />
      <InfoRow label="Estatus" value={estatusSala} />
      <InfoRow label="ID Comuna" value={s.id_comuna?.toString() || 'No asignada'} />
      <InfoRow label="ID Sector" value={s.id_sector?.toString() || 'No asignado'} />
      <InfoRow label="Fecha de creación" value={s.created_at ? new Date(s.created_at).toLocaleDateString() : 'No registrada'} />
      <DocumentosRow documentos={documentosConUrl} cargando={cargandoDocs} />
    </div>
  );
};

const InfoRow = ({ label, value }: { label: string; value: string }) => (
  <div className="flex flex-col gap-0.5 border-b border-gray-100 pb-2">
    <span className="text-[8px] font-black text-gray-400 uppercase tracking-wider">{label}</span>
    <span className="text-sm font-medium text-gray-800 break-words">{value}</span>
  </div>
);

// Documentos en la misma fila (con soporte para carga)
const DocumentosRow = ({ documentos, cargando }: { documentos: { label: string; url: string }[]; cargando?: boolean }) => {
  if (cargando) {
    return (
      <div className="flex flex-col gap-1 border-b border-gray-100 pb-2">
        <span className="text-[8px] font-black text-gray-400 uppercase tracking-wider">Documentos</span>
        <div className="flex items-center gap-2 text-sm text-gray-400">
          <Loader2 className="animate-spin" size={14} /> Cargando documentos...
        </div>
      </div>
    );
  }
  if (documentos.length === 0) {
    return (
      <div className="flex flex-col gap-1 border-b border-gray-100 pb-2">
        <span className="text-[8px] font-black text-gray-400 uppercase tracking-wider">Documentos</span>
        <span className="text-sm text-gray-400 italic">No hay documentos disponibles</span>
      </div>
    );
  }
  return (
    <div className="flex flex-col gap-1 border-b border-gray-100 pb-2">
      <span className="text-[8px] font-black text-gray-400 uppercase tracking-wider">Documentos</span>
      <div className="flex flex-wrap gap-3 items-center">
        {documentos.map((doc, idx) => (
          <React.Fragment key={doc.label}>
            <a 
              href={doc.url} 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-xs font-medium text-[#008f82] hover:underline flex items-center gap-1"
            >
              <LinkIcon size={12} /> {doc.label}
            </a>
            {idx < documentos.length - 1 && <span className="text-gray-300 text-xs">|</span>}
          </React.Fragment>
        ))}
      </div>
    </div>
  );
};

// ==================== COMPONENTES AUXILIARES ====================
function ResumenCard({ label, value, icon, color }: { label: string; value: number; icon: React.ReactNode; color: string }) {
  return (
    <div className={cn("rounded-xl p-3 text-white shadow-sm", color)}>
      <div className="flex items-center justify-between">
        <div className="p-1.5 bg-white/20 rounded-lg">{icon}</div>
        <span className="text-xl font-black">{value}</span>
      </div>
      <p className="text-[8px] font-bold uppercase tracking-wider mt-2 opacity-90">{label}</p>
    </div>
  );
}

function FilterChip({ active, onClick, label, count }: { active: boolean; onClick: () => void; label: string; count: number }) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "px-3 py-1.5 rounded-md text-[9px] font-black uppercase tracking-wider transition-all",
        active ? "bg-[#008f82] text-white shadow-sm" : "text-gray-500 hover:text-[#008f82]"
      )}
    >
      {label} ({count})
    </button>
  );
}