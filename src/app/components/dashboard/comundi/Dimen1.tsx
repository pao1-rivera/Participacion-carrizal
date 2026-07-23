'use client';

import React, { useState, useEffect, useContext, createContext } from 'react';
import { 
  ShieldCheck, Globe, Clock, Users, GraduationCap, CheckCircle2, 
  Search, Filter, ChevronRight, UserPlus, BookOpen, Award, BarChart3,
  FileText, Eye, ChevronLeft, Info, Loader2, AlertCircle, Building2, MapPin, XCircle
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/app/lib/utils';
import { supabase } from '@/app/lib/supabaseClient';
import { AlertModal } from '@/app/components/AlertModal';

// ==================== CONTEXTO DE ALERTAS GLOBAL ====================
interface AlertContextType {
  showAlert: (title: string, message: string, type?: 'info' | 'success' | 'warning' | 'danger') => void;
}

const AlertContext = createContext<AlertContextType | undefined>(undefined);

const useAlert = () => {
  const context = useContext(AlertContext);
  if (!context) throw new Error('useAlert debe usarse dentro de AlertProvider');
  return context;
};

// ==================== UTILIDADES ====================
const getSignedUrl = async (bucketName: string, filePath: string): Promise<string | null> => {
  if (!filePath) return null;
  const { data, error } = await supabase.storage
    .from(bucketName)
    .createSignedUrl(filePath, 60);
  if (error) {
    console.error('Error generando signed URL:', error);
    return null;
  }
  return data.signedUrl;
};

// Componente de paginación reutilizable (reducido)
const Pagination = ({ currentPage, totalPages, onPageChange }: { currentPage: number; totalPages: number; onPageChange: (page: number) => void }) => {
  if (totalPages <= 1) return null;
  return (
    <div className="px-4 py-3 bg-slate-50/50 border-t border-slate-100 flex items-center justify-between">
      <div className="text-[10px] text-slate-500">Página {currentPage} de {totalPages}</div>
      <div className="flex gap-1">
        <button onClick={() => onPageChange(currentPage - 1)} disabled={currentPage === 1} className="p-1.5 rounded-lg border border-slate-200 disabled:opacity-50"><ChevronLeft size={14} /></button>
        {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
          let pageNum = i + 1;
          if (totalPages > 5 && currentPage > 3) {
            pageNum = currentPage - 2 + i;
            if (pageNum > totalPages) return null;
          }
          return (
            <button key={pageNum} onClick={() => onPageChange(pageNum)} className={cn("w-7 h-7 rounded-lg text-[10px] font-bold", currentPage === pageNum ? "bg-brand-primary text-white" : "text-slate-600 hover:bg-brand-primary/10 border border-slate-200")}>
              {pageNum}
            </button>
          );
        })}
        <button onClick={() => onPageChange(currentPage + 1)} disabled={currentPage === totalPages} className="p-1.5 rounded-lg border border-slate-200 disabled:opacity-50"><ChevronRight size={14} /></button>
      </div>
    </div>
  );
};

// Función para abrir documento usando el contexto de alerta
const openDocumentWithAlert = async (url: string | null, bucketName?: string, showAlert?: (title: string, message: string, type?: any) => void) => {
  if (!url) {
    showAlert?.('Sin documento', 'No hay documento disponible', 'warning');
    return;
  }

  const publicPattern = /\/storage\/v1\/object\/public\/([^/]+)\/(.+)$/;
  const match = url.match(publicPattern);
  
  if (match) {
    const bucket = match[1];
    const filePath = match[2];
    const signed = await getSignedUrl(bucket, filePath);
    if (signed) window.open(signed, '_blank');
    else showAlert?.('Error', 'No se pudo acceder al documento', 'danger');
  } else if (bucketName) {
    const signed = await getSignedUrl(bucketName, url);
    if (signed) window.open(signed, '_blank');
    else showAlert?.('Error', 'No se pudo acceder al documento', 'danger');
  } else {
    showAlert?.('Error', 'No se puede determinar el bucket del documento', 'danger');
  }
};

// ==================== 1. SALAS DE AUTOGOBIERNO ====================
interface SalaData {
  id_sala: number;
  nombre_sala: string;
  fecha_constitucion: string;
  comuna_nombre: string;
  sector_nombre: string;
  estatus: string;
  acta_constitutiva_url: string | null;
}

const SalasAutoList = () => {
  const { showAlert } = useAlert();
  const [salas, setSalas] = useState<SalaData[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  useEffect(() => {
    const fetchSalas = async () => {
      setLoading(true);
      const { data: salasData, error } = await supabase
        .from('datos_sala_autogobierno')
        .select(`
          id_sala,
          nombre_sala,
          created_at,
          estatus,
          acta_constitutiva_url,
          id_comuna,
          id_sector
        `);
      if (error) {
        console.error("Error en consulta principal:", error);
        setSalas([]);
        setLoading(false);
        return;
      }
      if (!salasData || salasData.length === 0) {
        setSalas([]);
        setLoading(false);
        return;
      }
      const comunaIds = [...new Set(salasData.map(s => s.id_comuna).filter(Boolean))];
      let comunasMap: Record<number, string> = {};
      if (comunaIds.length) {
        const { data: comunas, error: comError } = await supabase
          .from('datos_comuna')
          .select('id_comuna, nombre_comuna')
          .in('id_comuna', comunaIds);
        if (comError) console.error("Error al obtener comunas:", comError);
        else {
          comunasMap = Object.fromEntries(comunas.map(c => [c.id_comuna, c.nombre_comuna]));
        }
      }
      const sectorIds = [...new Set(salasData.map(s => s.id_sector).filter(Boolean))];
      let sectoresMap: Record<number, { nombre_sector: string; id_comuna?: number }> = {};
      if (sectorIds.length) {
        const { data: sectores, error: secError } = await supabase
          .from('sectores')
          .select('id_sector, nombre_sector, id_datos_comuna')
          .in('id_sector', sectorIds);
        if (secError) console.error("Error al obtener sectores:", secError);
        else {
          sectoresMap = Object.fromEntries(sectores.map(s => [s.id_sector, { nombre_sector: s.nombre_sector, id_comuna: s.id_datos_comuna }]));
        }
      }
      const formatted = salasData.map((sala: any) => {
        const comunaNombre = comunasMap[sala.id_comuna] || 'Sin comuna';
        const sectorNombre = sectoresMap[sala.id_sector]?.nombre_sector || 'Sin sector';
        return {
          id_sala: sala.id_sala,
          nombre_sala: sala.nombre_sala,
          fecha_constitucion: sala.created_at
            ? new Date(sala.created_at).toLocaleDateString('es-ES')
            : 'No registrada',
          comuna_nombre: comunaNombre,
          sector_nombre: sectorNombre,
          estatus: sala.estatus || 'Inactiva',
          acta_constitutiva_url: sala.acta_constitutiva_url,
        };
      });
      setSalas(formatted);
      setLoading(false);
    };
    fetchSalas();
  }, []);

  const filtered = salas.filter(s => s.nombre_sala.toLowerCase().includes(searchTerm.toLowerCase()) || s.comuna_nombre.toLowerCase().includes(searchTerm.toLowerCase()));
  const totalPages = Math.ceil(filtered.length / itemsPerPage);
  const currentSalas = filtered.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  const getEstadoColor = (estado: string) => {
    switch (estado.toLowerCase()) {
      case 'activa': return 'bg-green-500';
      case 'en proceso de formación': return 'bg-yellow-500';
      default: return 'bg-slate-500';
    }
  };

  if (loading) return <div className="flex justify-center p-6"><Loader2 className="animate-spin text-brand-primary" size={24} /></div>;

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="space-y-4">
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
        <div className="p-4 border-b border-slate-50 flex items-center justify-between bg-slate-50/50">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
            <input type="text" placeholder="Buscar sala o comuna..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="pl-9 pr-3 py-1.5 bg-white border border-slate-200 rounded-lg text-[10px] font-medium outline-none focus:ring-2 focus:ring-brand-primary/20 w-64" />
          </div>
        </div>
        <div className="overflow-x-auto">
          {/* 🔥 CORREGIDO: Eliminados espacios en blanco dentro de <table> */}
          <table className="w-full text-center">
            <thead className="bg-slate-50/30 border-b border-slate-100">
              <tr>
                <th className="px-4 py-3 text-[9px] font-black text-slate-400 uppercase tracking-wider">Nombre de la Sala</th>
                <th className="px-4 py-3 text-[9px] font-black text-slate-400 uppercase tracking-wider">Fecha Constitución</th>
                <th className="px-4 py-3 text-[9px] font-black text-slate-400 uppercase tracking-wider">Comuna</th>
                <th className="px-4 py-3 text-[9px] font-black text-slate-400 uppercase tracking-wider">Sector</th>
                <th className="px-4 py-3 text-[9px] font-black text-slate-400 uppercase tracking-wider">Estado</th>
                <th className="px-4 py-3 text-[9px] font-black text-slate-400 uppercase tracking-wider">Acta</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {currentSalas.map((sala) => (
                <tr key={sala.id_sala} className="hover:bg-slate-50/50 transition-colors group">
                  <td className="px-4 py-3"><p className="text-[11px] font-bold text-slate-900 uppercase leading-tight">{sala.nombre_sala}</p></td>
                  <td className="px-4 py-3 whitespace-nowrap"><span className="text-[10px] font-medium text-slate-700 bg-slate-50 px-2 py-0.5 rounded-lg">{sala.fecha_constitucion}</span></td>
                  <td className="px-4 py-3 whitespace-nowrap"><span className="px-2 py-0.5 bg-indigo-50 text-indigo-700 text-[9px] font-bold uppercase rounded-full border border-indigo-200">{sala.comuna_nombre}</span></td>
                  <td className="px-4 py-3 whitespace-nowrap"><span className="px-2 py-0.5 bg-slate-100 text-slate-700 text-[9px] font-black uppercase rounded-lg">{sala.sector_nombre}</span></td>
                  <td className="px-4 py-3 whitespace-nowrap"><div className="flex items-center justify-center gap-1.5"><div className={`w-1.5 h-1.5 rounded-full ${getEstadoColor(sala.estatus)}`} /><span className="text-[9px] font-bold uppercase">{sala.estatus}</span></div></td>
                  <td className="px-3 py-3">
                    <button onClick={() => openDocumentWithAlert(sala.acta_constitutiva_url, 'documentos_salas', showAlert)} className="p-1.5 bg-white border border-slate-200 rounded-lg text-slate-400 hover:text-brand-primary hover:border-brand-primary/50 transition-all" title="Ver Acta"><FileText size={14} /></button>
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr><td colSpan={6} className="text-center py-8 text-slate-400 text-xs">No hay salas registradas</td></tr>
              )}
            </tbody>
          </table>
        </div>
        <Pagination currentPage={currentPage} totalPages={totalPages} onPageChange={setCurrentPage} />
      </div>
    </motion.div>
  );
};

// ==================== 2. CONSEJOS COMUNALES ====================
interface ConsejoData {
  id_consejo: number;
  nombre_consejo: string;
  comuna_nombre: string;
  sector_nombre: string;
  codigo_situr: string;
  rif_url: string | null;
  acta_constitutiva_url: string | null;
  certificado_cuenta_url: string | null;
}

const ConsejoComunalList = () => {
  const { showAlert } = useAlert();
  const [consejos, setConsejos] = useState<ConsejoData[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  useEffect(() => {
    const fetchConsejos = async () => {
      setLoading(true);
      const { data: consejosData, error: consejosError } = await supabase
        .from('datos_consejo_comunal')
        .select(`
          id_consejo,
          nombre_consejo,
          codigo_situr,
          rif_url,
          acta_constitutiva_url,
          certificado_cuenta_url,
          id_sector
        `);
      if (consejosError) {
        console.error('Error cargando consejos:', consejosError);
        setConsejos([]);
        setLoading(false);
        return;
      }
      if (!consejosData || consejosData.length === 0) {
        setConsejos([]);
        setLoading(false);
        return;
      }
      const sectorIds = [...new Set(consejosData.map(c => c.id_sector).filter(Boolean))];
      let sectoresMap: Record<number, { nombre_sector: string; id_datos_comuna: number }> = {};
      if (sectorIds.length) {
        const { data: sectoresData, error: sectoresError } = await supabase
          .from('sectores')
          .select('id_sector, nombre_sector, id_datos_comuna')
          .in('id_sector', sectorIds);
        if (!sectoresError && sectoresData) {
          sectoresMap = Object.fromEntries(sectoresData.map(s => [s.id_sector, { nombre_sector: s.nombre_sector, id_datos_comuna: s.id_datos_comuna }]));
        }
      }
      const comunaIds = [...new Set(Object.values(sectoresMap).map(s => s.id_datos_comuna).filter(Boolean))];
      let comunasMap: Record<number, string> = {};
      if (comunaIds.length) {
        const { data: comunasData, error: comunasError } = await supabase
          .from('datos_comuna')
          .select('id_comuna, nombre_comuna')
          .in('id_comuna', comunaIds);
        if (!comunasError && comunasData) {
          comunasMap = Object.fromEntries(comunasData.map(c => [c.id_comuna, c.nombre_comuna]));
        }
      }
      const formatted = consejosData.map((consejo: any) => {
        const sectorInfo = sectoresMap[consejo.id_sector];
        const sectorNombre = sectorInfo?.nombre_sector || 'Sin sector';
        const comunaNombre = sectorInfo ? (comunasMap[sectorInfo.id_datos_comuna] || 'Sin comuna') : 'Sin comuna';
        return {
          id_consejo: consejo.id_consejo,
          nombre_consejo: consejo.nombre_consejo,
          comuna_nombre: comunaNombre,
          sector_nombre: sectorNombre,
          codigo_situr: consejo.codigo_situr || 'No registrado',
          rif_url: consejo.rif_url,
          acta_constitutiva_url: consejo.acta_constitutiva_url,
          certificado_cuenta_url: consejo.certificado_cuenta_url
        };
      });
      setConsejos(formatted);
      setLoading(false);
    };
    fetchConsejos();
  }, []);

  const filtered = consejos.filter(c => 
    c.nombre_consejo.toLowerCase().includes(searchTerm.toLowerCase()) || 
    c.codigo_situr.includes(searchTerm) ||
    c.comuna_nombre.toLowerCase().includes(searchTerm.toLowerCase())
  );
  const totalPages = Math.ceil(filtered.length / itemsPerPage);
  const currentConsejos = filtered.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  if (loading) return <div className="flex justify-center p-6"><Loader2 className="animate-spin text-brand-primary" size={24} /></div>;

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="space-y-4">
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
        <div className="p-4 border-b border-slate-50 flex items-center justify-between bg-slate-50/50">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
            <input type="text" placeholder="Buscar consejo, comuna o código SITUR..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="pl-9 pr-3 py-1.5 bg-white border border-slate-200 rounded-lg text-[10px] font-medium outline-none focus:ring-2 focus:ring-brand-primary/20 w-72" />
          </div>
          <div className="text-[10px] text-slate-400">Total: {filtered.length} consejos</div>
        </div>
        <div className="overflow-x-auto">
          {/* 🔥 CORREGIDO: Eliminados espacios en blanco dentro de <table> */}
          <table className="w-full text-center">
            <thead className="bg-slate-50/30 border-b border-slate-100">
              <tr>
                <th className="px-4 py-3 text-[9px] font-black text-slate-400 uppercase tracking-wider">Nombre Consejo</th>
                <th className="px-4 py-3 text-[9px] font-black text-slate-400 uppercase tracking-wider">Comuna</th>
                <th className="px-4 py-3 text-[9px] font-black text-slate-400 uppercase tracking-wider">Sector</th>
                <th className="px-4 py-3 text-[9px] font-black text-slate-400 uppercase tracking-wider">Código SITUR</th>
                <th className="px-4 py-3 text-[9px] font-black text-slate-400 uppercase tracking-wider">Documentos</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {currentConsejos.map(cc => (
                <tr key={cc.id_consejo} className="hover:bg-slate-50/50 transition-colors group">
                  <td className="px-4 py-3 whitespace-nowrap"><span className="text-[11px] font-bold text-slate-900 uppercase">{cc.nombre_consejo}</span></td>
                  <td className="px-4 py-3 whitespace-nowrap"><span className="px-2 py-0.5 bg-indigo-50 text-indigo-700 text-[9px] font-bold uppercase rounded-full border border-indigo-200">{cc.comuna_nombre}</span></td>
                  <td className="px-4 py-3 whitespace-nowrap"><span className="px-2 py-0.5 bg-slate-100 text-slate-700 text-[9px] font-black uppercase rounded-lg">{cc.sector_nombre}</span></td>
                  <td className="px-4 py-3 whitespace-nowrap"><span className="text-[10px] font-mono font-bold text-slate-500">{cc.codigo_situr}</span></td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-center gap-1">
                      <button onClick={() => openDocumentWithAlert(cc.rif_url, 'documentos_consejos', showAlert)} className="p-1.5 bg-white border border-slate-200 rounded-lg text-slate-400 hover:text-brand-primary" title="Ver RIF"><ShieldCheck size={14} /></button>
                      <button onClick={() => openDocumentWithAlert(cc.acta_constitutiva_url, 'documentos_consejos', showAlert)} className="p-1.5 bg-white border border-slate-200 rounded-lg text-slate-400 hover:text-indigo-600" title="Ver Acta"><FileText size={14} /></button>
                      <button onClick={() => openDocumentWithAlert(cc.certificado_cuenta_url, 'documentos_consejos', showAlert)} className="p-1.5 bg-white border border-slate-200 rounded-lg text-slate-400 hover:text-emerald-600" title="Ver Certificado"><Info size={14} /></button>
                    </div>
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr><td colSpan={5} className="text-center py-8 text-slate-400 text-xs">No hay consejos comunales registrados</td></tr>
              )}
            </tbody>
          </table>
        </div>
        <Pagination currentPage={currentPage} totalPages={totalPages} onPageChange={setCurrentPage} />
      </div>
    </motion.div>
  );
};

// ==================== 3. COMUNAS ====================
interface ComunaData {
  id_comuna: number;
  nombre_comuna: string;
  rif: string;
  codigo_situr: string;
  vocero_responsable?: string;
  certificado_cuenta_url: string | null;
  rif_url: string | null;
  carta_fundacional_url: string | null;
}

const ComunasList = () => {
  const { showAlert } = useAlert();
  const [comunas, setComunas] = useState<ComunaData[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  useEffect(() => {
    const fetchComunas = async () => {
      setLoading(true);
      const { data: comunasData, error: comunasError } = await supabase
        .from('datos_comuna')
        .select(`
          id_comuna,
          nombre_comuna,
          rif,
          codigo_situr,
          certificado_cuenta_url,
          rif_url,
          carta_fundacional_url,
          id_usuario
        `)
        .eq('activo', true);
      if (comunasError) {
        console.error('Error cargando comunas:', comunasError);
        setComunas([]);
        setLoading(false);
        return;
      }
      if (!comunasData || comunasData.length === 0) {
        setComunas([]);
        setLoading(false);
        return;
      }
      const userIds = [...new Set(comunasData.map(c => c.id_usuario).filter(Boolean))];
      let userNamesMap: Record<string, string> = {};
      if (userIds.length) {
        const { data: perfiles, error: perfilesError } = await supabase
          .from('perfil_usuario')
          .select('id_usuario, nombre, apellido')
          .in('id_usuario', userIds);
        if (!perfilesError && perfiles) {
          userNamesMap = Object.fromEntries(perfiles.map(p => [p.id_usuario, `${p.nombre} ${p.apellido}`]));
        }
      }
      const comunasConVocero = comunasData.map(comuna => ({
        ...comuna,
        vocero_responsable: comuna.id_usuario ? (userNamesMap[comuna.id_usuario] || 'Sin asignar') : 'Sin asignar'
      }));
      setComunas(comunasConVocero);
      setLoading(false);
    };
    fetchComunas();
  }, []);

  const filtered = comunas.filter(c => c.nombre_comuna.toLowerCase().includes(searchTerm.toLowerCase()) || c.codigo_situr.includes(searchTerm));
  const totalPages = Math.ceil(filtered.length / itemsPerPage);
  const currentComunas = filtered.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  if (loading) return <div className="flex justify-center p-6"><Loader2 className="animate-spin text-brand-primary" size={24} /></div>;

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="space-y-4">
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
        <div className="p-4 border-b border-slate-50 flex items-center justify-between bg-slate-50/50">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
            <input type="text" placeholder="Buscar comuna o código SITUR..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="pl-9 pr-3 py-1.5 bg-white border border-slate-200 rounded-lg text-[10px] font-medium outline-none focus:ring-2 focus:ring-brand-primary/20 w-72" />
          </div>
        </div>
        <div className="overflow-x-auto">
          {/* 🔥 CORREGIDO: Eliminados espacios en blanco dentro de <table> */}
          <table className="w-full text-center">
            <thead className="bg-slate-50/30 border-b border-slate-100">
              <tr>
                <th className="px-4 py-3 text-[9px] font-black text-slate-400 uppercase tracking-wider">Nombre Comuna</th>
                <th className="px-4 py-3 text-[9px] font-black text-slate-400 uppercase tracking-wider">RIF</th>
                <th className="px-4 py-3 text-[9px] font-black text-slate-400 uppercase tracking-wider">Código SITUR</th>
                <th className="px-4 py-3 text-[9px] font-black text-slate-400 uppercase tracking-wider">Vocero Responsable</th>
                <th className="px-4 py-3 text-[9px] font-black text-slate-400 uppercase tracking-wider">Documentos</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {currentComunas.map(comuna => (
                <tr key={comuna.id_comuna} className="hover:bg-slate-50/50 transition-colors group">
                  <td className="px-4 py-3 whitespace-nowrap"><span className="text-[11px] font-bold text-slate-900 uppercase">{comuna.nombre_comuna}</span></td>
                  <td className="px-4 py-3 whitespace-nowrap"><span className="text-[10px] font-mono font-medium text-slate-600">{comuna.rif || '—'}</span></td>
                  <td className="px-4 py-3 whitespace-nowrap"><span className="text-[10px] font-mono font-bold text-slate-500">{comuna.codigo_situr || '—'}</span></td>
                  <td className="px-4 py-3 whitespace-nowrap"><span className="text-[9px] font-medium text-slate-700 uppercase">{comuna.vocero_responsable}</span></td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-center gap-1">
                      <button onClick={() => openDocumentWithAlert(comuna.rif_url, 'documentos_comuna', showAlert)} className="p-1.5 bg-white border border-slate-200 rounded-lg text-slate-400 hover:text-brand-primary" title="Ver RIF"><ShieldCheck size={14} /></button>
                      <button onClick={() => openDocumentWithAlert(comuna.certificado_cuenta_url, 'documentos_comuna', showAlert)} className="p-1.5 bg-white border border-slate-200 rounded-lg text-slate-400 hover:text-emerald-600" title="Ver Certificado"><FileText size={14} /></button>
                      <button onClick={() => openDocumentWithAlert(comuna.carta_fundacional_url, 'documentos_comuna', showAlert)} className="p-1.5 bg-white border border-slate-200 rounded-lg text-slate-400 hover:text-indigo-600" title="Ver Carta"><Info size={14} /></button>
                    </div>
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr><td colSpan={5} className="text-center py-8 text-slate-400 text-xs">No hay comunas registradas</td></tr>
              )}
            </tbody>
          </table>
        </div>
        <Pagination currentPage={currentPage} totalPages={totalPages} onPageChange={setCurrentPage} />
      </div>
    </motion.div>
  );
};

// ==================== 4. VOCERÍAS CON FILTROS AVANZADOS ====================
interface VoceroData {
  id: number;
  cedula: string;
  nombre_completo: string;
  unidad: string;
  comite: string;
  tipo: string;
  contacto: string;
  rif_url: string | null;
  cedula_url: string | null;
  origen: 'consejo' | 'comuna';
  entidad_nombre: string; // nombre del consejo o comuna
  entidad_id: number;
}

const VoceriasList = () => {
  const { showAlert } = useAlert();
  const [voceros, setVoceros] = useState<VoceroData[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  // Filtros adicionales
  const [filterComite, setFilterComite] = useState<string>('todos');
  const [filterUnidad, setFilterUnidad] = useState<string>('todos');
  const [filterEntidad, setFilterEntidad] = useState<string>('todos'); // nombre del consejo/comuna

  // Listas de opciones para filtros (se llenan dinámicamente)
  const [comitesOptions, setComitesOptions] = useState<string[]>([]);
  const [unidadesOptions, setUnidadesOptions] = useState<string[]>([]);
  const [entidadesOptions, setEntidadesOptions] = useState<string[]>([]);

  useEffect(() => {
    const fetchVoceros = async () => {
      setLoading(true);
      let allVoceros: VoceroData[] = [];

      // Obtener consejos para mapear IDs a nombres
      const { data: consejos, error: consejosError } = await supabase
        .from('datos_consejo_comunal')
        .select('id_consejo, nombre_consejo');
      const consejosMap = new Map(consejos?.map(c => [c.id_consejo, c.nombre_consejo]) || []);

      // Obtener comunas para mapear IDs a nombres
      const { data: comunas, error: comunasError } = await supabase
        .from('datos_comuna')
        .select('id_comuna, nombre_comuna');
      const comunasMap = new Map(comunas?.map(c => [c.id_comuna, c.nombre_comuna]) || []);

      // Voceros de consejos
      const { data: consejoVoceros, error: errorConsejo } = await supabase
        .from('voceros')
        .select('id_vocero, cedula, nombre_completo, tipo, telefono, rif_url, cedula_url, unidad, comite, id_consejo');
      if (!errorConsejo && consejoVoceros) {
        consejoVoceros.forEach((item: any) => {
          const nombreConsejo = consejosMap.get(item.id_consejo) || 'Consejo no encontrado';
          allVoceros.push({
            id: item.id_vocero,
            cedula: item.cedula,
            nombre_completo: item.nombre_completo,
            unidad: item.unidad || 'No asignada',
            comite: item.comite || 'No asignado',
            tipo: item.tipo || 'Vocero',
            contacto: item.telefono || 'No registrado',
            rif_url: item.rif_url,
            cedula_url: item.cedula_url,
            origen: 'consejo',
            entidad_nombre: nombreConsejo,
            entidad_id: item.id_consejo
          });
        });
      }

      // Voceros de comunas
      const { data: comunaVoceros, error: errorComuna } = await supabase
        .from('voceros_comuna')
        .select('id_voceroc, nombre_completo, cedula, tipo, telefono, rif_url, cedula_url, comite, unidad, id_comuna');
      if (!errorComuna && comunaVoceros) {
        comunaVoceros.forEach((item: any) => {
          const nombreComuna = comunasMap.get(item.id_comuna) || 'Comuna no encontrada';
          allVoceros.push({
            id: item.id_voceroc,
            cedula: item.cedula,
            nombre_completo: item.nombre_completo,
            unidad: item.unidad || 'No asignada',
            comite: item.comite || 'No asignado',
            tipo: item.tipo || 'Vocero',
            contacto: item.telefono || 'No registrado',
            rif_url: item.rif_url,
            cedula_url: item.cedula_url,
            origen: 'comuna',
            entidad_nombre: nombreComuna,
            entidad_id: item.id_comuna
          });
        });
      }

      setVoceros(allVoceros);

      // Extraer opciones únicas para filtros
      const comites = [...new Set(allVoceros.map(v => v.comite).filter(c => c !== 'No asignado'))];
      const unidades = [...new Set(allVoceros.map(v => v.unidad).filter(u => u !== 'No asignada'))];
      const entidades = [...new Set(allVoceros.map(v => v.entidad_nombre))];
      setComitesOptions(['todos', ...comites.sort()]);
      setUnidadesOptions(['todos', ...unidades.sort()]);
      setEntidadesOptions(['todos', ...entidades.sort()]);

      setLoading(false);
    };
    fetchVoceros();
  }, []);

  // Aplicar filtros
  const filtered = voceros.filter(v => {
    // Búsqueda textual general
    const matchSearch = searchTerm === '' || 
      v.cedula.toLowerCase().includes(searchTerm.toLowerCase()) ||
      v.nombre_completo.toLowerCase().includes(searchTerm.toLowerCase()) ||
      v.unidad.toLowerCase().includes(searchTerm.toLowerCase()) ||
      v.comite.toLowerCase().includes(searchTerm.toLowerCase()) ||
      v.entidad_nombre.toLowerCase().includes(searchTerm.toLowerCase());

    // Filtro por comité
    const matchComite = filterComite === 'todos' || v.comite === filterComite;
    // Filtro por unidad
    const matchUnidad = filterUnidad === 'todos' || v.unidad === filterUnidad;
    // Filtro por entidad (consejo/comuna)
    const matchEntidad = filterEntidad === 'todos' || v.entidad_nombre === filterEntidad;

    return matchSearch && matchComite && matchUnidad && matchEntidad;
  });

  const totalPages = Math.ceil(filtered.length / itemsPerPage);
  const currentVoceros = filtered.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  // Función para limpiar todos los filtros
  const clearFilters = () => {
    setSearchTerm('');
    setFilterComite('todos');
    setFilterUnidad('todos');
    setFilterEntidad('todos');
    setCurrentPage(1);
  };

  if (loading) return <div className="flex justify-center p-6"><Loader2 className="animate-spin text-brand-primary" size={24} /></div>;

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="space-y-4">
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
        <div className="p-3 border-b border-slate-50 bg-slate-50/50">
          {/* Fila de búsqueda y limpiar filtros */}
          <div className="flex items-center justify-between gap-3 flex-wrap">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" size={13} />
              <input 
                type="text" 
                placeholder="Buscar..." 
                value={searchTerm} 
                onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }} 
                className="w-full pl-8 pr-2 py-1 bg-white border border-slate-200 rounded-lg text-[9px] font-medium outline-none focus:ring-2 focus:ring-brand-primary/20" 
              />
            </div>
            {(searchTerm || filterComite !== 'todos' || filterUnidad !== 'todos' || filterEntidad !== 'todos') && (
              <button onClick={clearFilters} className="text-[8px] font-bold text-brand-primary bg-brand-primary/10 px-2 py-1 rounded-full flex items-center gap-0.5">
                <XCircle size={11} /> Limpiar
              </button>
            )}
          </div>

          {/* Filtros compactos en una línea */}
          <div className="flex flex-wrap gap-1.5 mt-2 items-center">
            <span className="text-[8px] font-black text-slate-400 uppercase tracking-wider mr-1">Filtros:</span>
            
            <select 
              value={filterComite} 
              onChange={(e) => { setFilterComite(e.target.value); setCurrentPage(1); }}
              className="text-[8px] font-medium bg-white border border-slate-200 rounded-lg px-1.5 py-0.5 focus:ring-1 focus:ring-brand-primary max-w-[120px] truncate"
            >
              {comitesOptions.map(opt => (
                <option key={opt} value={opt}>{opt === 'todos' ? 'Comité' : opt}</option>
              ))}
            </select>

            <select 
              value={filterUnidad} 
              onChange={(e) => { setFilterUnidad(e.target.value); setCurrentPage(1); }}
              className="text-[8px] font-medium bg-white border border-slate-200 rounded-lg px-1.5 py-0.5 focus:ring-1 focus:ring-brand-primary max-w-[120px] truncate"
            >
              {unidadesOptions.map(opt => (
                <option key={opt} value={opt}>{opt === 'todos' ? 'Unidad' : opt}</option>
              ))}
            </select>

            <select 
              value={filterEntidad} 
              onChange={(e) => { setFilterEntidad(e.target.value); setCurrentPage(1); }}
              className="text-[8px] font-medium bg-white border border-slate-200 rounded-lg px-1.5 py-0.5 focus:ring-1 focus:ring-brand-primary max-w-[140px] truncate"
            >
              {entidadesOptions.map(opt => (
                <option key={opt} value={opt}>{opt === 'todos' ? 'Entidad' : opt}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="overflow-x-auto">
          {/* 🔥 CORREGIDO: Eliminados espacios en blanco dentro de <table> */}
          <table className="w-full text-center table-fixed">
            <thead className="bg-slate-50/30 border-b border-slate-100">
              <tr>
                <th className="px-2 py-2 text-[8px] font-black text-slate-400 uppercase tracking-wider">Cédula</th>
                <th className="px-2 py-2 text-[8px] font-black text-slate-400 uppercase tracking-wider">Nombre</th>
                <th className="px-2 py-2 text-[8px] font-black text-slate-400 uppercase tracking-wider">Unidad</th>
                <th className="px-2 py-2 text-[8px] font-black text-slate-400 uppercase tracking-wider">Comité</th>
                <th className="px-2 py-2 text-[8px] font-black text-slate-400 uppercase tracking-wider">Tipo</th>
                <th className="px-2 py-2 text-[8px] font-black text-slate-400 uppercase tracking-wider">Contacto</th>
                <th className="px-2 py-2 text-[8px] font-black text-slate-400 uppercase tracking-wider">Entidad</th>
                <th className="px-2 py-2 text-[8px] font-black text-slate-400 uppercase tracking-wider">Docs</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {currentVoceros.map((vocero) => (
                <tr key={`${vocero.origen}-${vocero.id}`} className="hover:bg-slate-50/50 transition-colors group">
                  <td className="px-2 py-2 whitespace-nowrap truncate"><span className="text-[9px] font-bold text-slate-900 bg-slate-50 px-1.5 py-0.5 rounded-lg">{vocero.cedula}</span></td>
                  <td className="px-2 py-2 truncate"><p className="text-[10px] font-bold text-slate-900 uppercase leading-tight truncate">{vocero.nombre_completo}</p></td>
                  <td className="px-2 py-2 truncate"><span className="px-1.5 py-0.5 bg-indigo-50 text-indigo-700 text-[8px] font-bold uppercase rounded-full border border-indigo-200 block truncate">{vocero.unidad}</span></td>
                  <td className="px-2 py-2 truncate"><span className="px-1.5 py-0.5 bg-purple-50 text-purple-700 text-[8px] font-bold uppercase rounded-full border border-purple-200 block truncate">{vocero.comite}</span></td>
                  <td className="px-2 py-2 truncate"><span className="px-1.5 py-0.5 bg-emerald-50 text-emerald-700 text-[8px] font-black uppercase rounded-lg border border-emerald-200 block w-fit mx-auto">{vocero.tipo}</span></td>
                  <td className="px-2 py-2 truncate"><span className="text-[9px] font-medium text-slate-700">{vocero.contacto}</span></td>
                  <td className="px-2 py-2 truncate">
                    <div className="flex items-center justify-center gap-1">
                      <Building2 size={11} className="text-slate-400 shrink-0" />
                      <span className="text-[8px] font-bold text-slate-700 uppercase truncate">{vocero.entidad_nombre}</span>
                    </div>
                  </td>
                  <td className="px-2 py-2 whitespace-nowrap">
                    <div className="flex items-center justify-center gap-0.5">
                      <button onClick={() => openDocumentWithAlert(vocero.rif_url, vocero.origen === 'consejo' ? 'documentos_consejos' : 'documentos_comuna', showAlert)} className="p-1 bg-white border border-slate-200 rounded-lg text-slate-400 hover:text-brand-primary" title="Ver RIF"><Eye size={12} /></button>
                      <button onClick={() => openDocumentWithAlert(vocero.cedula_url, vocero.origen === 'consejo' ? 'documentos_consejos' : 'documentos_comuna', showAlert)} className="p-1 bg-white border border-slate-200 rounded-lg text-slate-400 hover:text-indigo-600" title="Ver cédula"><FileText size={12} /></button>
                    </div>
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr><td colSpan={8} className="text-center py-8 text-slate-400 text-xs">No hay vocerías que coincidan con los filtros</td></tr>
              )}
            </tbody>
          </table>
        </div>
        <Pagination currentPage={currentPage} totalPages={totalPages} onPageChange={setCurrentPage} />
      </div>
    </motion.div>
  );
};

// ==================== COMPONENTE PRINCIPAL TALENTO HUMANO ====================
interface TalentoHumanoProps {
  activeTab?: string;
}

const TabButton = ({ active, onClick, icon: Icon, label }: any) => (
  <button onClick={onClick} className={cn("flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-wider transition-all", active ? "bg-white text-brand-primary shadow-sm" : "text-slate-500 hover:text-slate-800")}>
    <Icon size={12} /> {label}
  </button>
);

export const Dimen1: React.FC<TalentoHumanoProps> = ({ activeTab = 'salas' }) => {
  const [currentTab, setCurrentTab] = useState(activeTab);
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

  // Ocultar sidebar cuando la alerta está abierta
  useEffect(() => {
    if (modalState.isOpen) {
      document.body.classList.add('modal-open');
    } else {
      document.body.classList.remove('modal-open');
    }
    return () => document.body.classList.remove('modal-open');
  }, [modalState.isOpen]);

  return (
    <AlertContext.Provider value={{ showAlert }}>
      <div className="space-y-5 animate-in fade-in duration-500">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-base font-black text-slate-900 uppercase tracking-tighter italic">Dimensión I: Liderazgo</h2>
          </div>
          <div className="flex bg-slate-100 p-0.5 rounded-lg gap-0.5">
            <TabButton active={currentTab === 'salas'} onClick={() => setCurrentTab('salas')} icon={BarChart3} label="Salas" />
            <TabButton active={currentTab === 'consejo'} onClick={() => setCurrentTab('consejo')} icon={Users} label="Consejos" />
            <TabButton active={currentTab === 'comunas'} onClick={() => setCurrentTab('comunas')} icon={GraduationCap} label="Comunas" />
            <TabButton active={currentTab === 'vocerias'} onClick={() => setCurrentTab('vocerias')} icon={Users} label="Vocerías" />
          </div>
        </div>

        <AnimatePresence mode="wait">
          {currentTab === 'salas' && <SalasAutoList key="salas" />}
          {currentTab === 'consejo' && <ConsejoComunalList key="consejo" />}
          {currentTab === 'comunas' && <ComunasList key="comunas" />}
          {currentTab === 'vocerias' && <VoceriasList key="vocerias" />}
        </AnimatePresence>
      </div>

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
    </AlertContext.Provider>
  );
};