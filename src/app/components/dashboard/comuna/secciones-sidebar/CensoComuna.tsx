"use client";

import React, { useState, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Users, HeartPulse, Activity, Shield, UserCircle, AlertCircle,
  FileText, Users2, DownloadCloud, Baby, Search, Eye, Loader2, X,
  Flame, GraduationCap, Home, LogOut, FileCheck
} from "lucide-react";
import { cn } from "@/app/lib/utils";
import { supabase } from "@/app/lib/supabaseClient";
import { useAuth } from "@/context/AuthContext";
import { AlertModal } from "@/app/components/AlertModal";
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

// ==================== TIPOS ====================
interface Familiar {
  numero: number;
  nombreApellido: string;
  sexo: string;
  cedula: string;
  fechaNacimiento: string;
  edad: number;
  cne: string;
  discapacidad: string;
  enfermedad: string;
  embarazo: string;
  parentesco: string;
  instruccion: string;
  oficio: string;
  pensionado: string;
  centro_votacion?: string;
  telefono?: string;
}

interface Misiones {
  ribas: number;
  ezequiel: number;
  sucre: number;
  vuelvaCaras: number;
  identidad: number;
  barrioAdentro: number;
  mercal: number;
}

interface FichaCensada {
  id_ficha: string;
  id_consejo: number;
  archivo_nombre: string;
  archivo_url: string | null;
  hoja_excel: string;
  fila_inicio: number;
  jefe: {
    nombres: string;
    apellidos: string;
    cedula: string;
    edad: number;
    fechaNacimiento?: string;
    sexo?: string;
    estadoCivil?: string;
    instruccion?: string;
    cne?: string;
    incapacidad?: string | null;
    pensionado?: string | null;
    tipo_incapacidad?: string | null;
    institucion_pension?: string | null;
    tiempo_comunidad?: string;
    telefono?: string;
    centro_votacion?: string;
  };
  ubicacion: {
    estado: string;
    municipio: string;
    parroquia: string;
    sector: string;
    comunidad: string;
    direccion: string;
  };
  familiares: Familiar[];
  indicadores: {
    ninos: number;
    jovenes: number;
    adultosMayores: number;
    casosSalud: number;
  };
  // gas es jsonb, puede ser objeto o string, pero no lo usamos directamente para la cantidad
  gas?: any;
  cantidad_bombonas?: number;
  misiones?: Misiones;
}

interface ConsejoComunal {
  id_consejo: number;
  nombre_consejo: string;
}

// ==================== FUNCIONES AUXILIARES ====================
const esCasoDeSalud = (enfermedad: string | null | undefined): boolean => {
  if (!enfermedad) return false;
  const valor = enfermedad.toString().trim().toLowerCase();
  if (valor === '') return false;
  const exclusiones = ['no', 'ninguna', 'no aplica', 'n/a', 'sin datos', 'ninguno', 'n/d'];
  return !exclusiones.includes(valor);
};

// ==================== STATCARD ====================
const StatCard = ({ icon, label, value, color }: any) => {
  const colorClasses: Record<string, string> = {
    blue: "text-blue-600 bg-blue-50 border-blue-100",
    emerald: "text-emerald-600 bg-emerald-50 border-emerald-100",
    indigo: "text-indigo-600 bg-indigo-50 border-indigo-100",
    rose: "text-rose-600 bg-rose-50 border-rose-100",
    amber: "text-amber-600 bg-amber-50 border-amber-100",
    slate: "text-slate-600 bg-slate-50 border-slate-100"
  };
  return (
    <div className="bg-white p-3 rounded-xl border border-slate-100 shadow-sm flex items-center gap-3 transition-transform hover:scale-[1.02]">
      <div className={cn("h-9 w-9 rounded-xl flex items-center justify-center shrink-0", colorClasses[color])}>
        {React.cloneElement(icon, { className: "h-4 w-4" })}
      </div>
      <div>
        <p className="text-[8px] font-black text-slate-400 uppercase tracking-wider mb-0.5">{label}</p>
        <p className="text-base font-black text-slate-800 tracking-tighter leading-none">{typeof value === 'number' ? value.toLocaleString() : value}</p>
      </div>
    </div>
  );
};

// ==================== FUNCIÓN PARA GENERAR PDF ====================
const generarPDFComuna = (
  fichas: FichaCensada[],
  nombreComuna: string,
  consejosMap: Map<number, string>
) => {
  const doc = new jsPDF('l', 'mm', 'a4');
  let yPosition = 35;

  doc.addImage('/logo-alcaldia.png', 'PNG', 10, 5, 45, 15);
  doc.setFontSize(16);
  doc.setFont('helvetica', 'bold');
  doc.text('ALCALDÍA DEL MUNICIPIO CARRIZAL', 60, 12);
  doc.setDrawColor(0, 0, 0);
  doc.setLineWidth(1);
  doc.line(10, 22, 287, 22);
  doc.setFontSize(14);
  doc.text('CENSO POBLACIONAL CONSOLIDADO', 10, 30);
  doc.setFontSize(11);
  doc.setFont('helvetica', 'normal');
  doc.text(`COMUNA: ${nombreComuna.toUpperCase()}`, 10, 37);
  yPosition = 42;

  const todasLasPersonas: any[] = [];
  fichas.forEach(ficha => {
    if (!ficha.jefe) return;
    const nombreConsejo = consejosMap.get(ficha.id_consejo) || 'Desconocido';
    todasLasPersonas.push({
      consejo: nombreConsejo,
      nombreApellido: `${ficha.jefe.nombres} ${ficha.jefe.apellidos}`.toUpperCase(),
      cedula: ficha.jefe.cedula,
      sexo: ficha.jefe.sexo || 'S/D',
      fechaNacimiento: ficha.jefe.fechaNacimiento || 'S/D',
      edad: ficha.jefe.edad,
      cne: ficha.jefe.cne || 'S/D',
      discapacidad: ficha.jefe.incapacidad === 'Sí' ? 'SI' : 'NO',
      enfermedad: 'NO',
      centro_votacion: ficha.jefe.centro_votacion || 'S/D',
      telefono: ficha.jefe.telefono || 'S/D',
      pensionado: ficha.jefe.pensionado === 'Sí' ? 'SI' : 'NO',
      esJefe: true
    });
    ficha.familiares.forEach(familiar => {
      todasLasPersonas.push({
        consejo: nombreConsejo,
        nombreApellido: familiar.nombreApellido.toUpperCase(),
        cedula: familiar.cedula,
        sexo: familiar.sexo,
        fechaNacimiento: familiar.fechaNacimiento,
        edad: familiar.edad,
        cne: familiar.cne,
        discapacidad: familiar.discapacidad || 'NO',
        enfermedad: familiar.enfermedad || 'NO',
        centro_votacion: familiar.centro_votacion || 'S/D',
        telefono: familiar.telefono || 'S/D',
        pensionado: familiar.pensionado || 'NO',
        esJefe: false
      });
    });
  });

  const columnas = [
    { header: 'Consejo Comunal', dataKey: 'consejo' },
    { header: 'Nombres y Apellidos', dataKey: 'nombreApellido' },
    { header: 'Cédula', dataKey: 'cedula' },
    { header: 'Sexo', dataKey: 'sexo' },
    { header: 'F. Nacimiento', dataKey: 'fechaNacimiento' },
    { header: 'Edad', dataKey: 'edad' },
    { header: 'CNE', dataKey: 'cne' },
    { header: 'Centro Votación', dataKey: 'centro_votacion' },
    { header: 'Discap.', dataKey: 'discapacidad' },
    { header: 'Enferm.', dataKey: 'enfermedad' },
    { header: 'Teléfono', dataKey: 'telefono' },
    { header: 'Pens.', dataKey: 'pensionado' }
  ];

  autoTable(doc, {
    startY: yPosition,
    head: [columnas.map(col => col.header)],
    body: todasLasPersonas.map(p => [
      p.consejo, p.nombreApellido, p.cedula, p.sexo, p.fechaNacimiento, p.edad.toString(),
      p.cne, p.centro_votacion, p.discapacidad, p.enfermedad, p.telefono, p.pensionado
    ]),
    tableWidth: 'auto',
    margin: { left: 10, right: 10 },
    theme: 'grid',
    styles: { fontSize: 7.5, cellPadding: 1.5, lineColor: [0, 0, 0], lineWidth: 0.1, valign: 'middle', halign: 'center' },
    headStyles: { fillColor: [230, 230, 230], textColor: [0, 0, 0], fontStyle: 'bold', lineWidth: 0.2 },
    didParseCell: (data) => {
      if (data.section === 'body' && todasLasPersonas[data.row.index].esJefe) {
        data.cell.styles.fontStyle = 'bold';
        data.cell.styles.fillColor = [248, 248, 248];
      }
    }
  });

  const finalY = (doc as any).lastAutoTable.finalY || yPosition;
  const fecha = new Date().toLocaleDateString('es-VE');
  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.text(`TOTAL PERSONAS: ${todasLasPersonas.length}`, 10, finalY + 10);
  doc.setFontSize(8);
  doc.setFont('helvetica', 'italic');
  doc.text(`Fecha de impresión: ${fecha}`, 250, finalY + 10);
  doc.save(`censo_carrizal_completo.pdf`);
};

// ==================== COMPONENTE PRINCIPAL ====================
export const CensoComuna = () => {
  const { user } = useAuth();
  const [comunaId, setComunaId] = useState<number | null>(null);
  const [noComuna, setNoComuna] = useState(false);
  const [nombreComuna, setNombreComuna] = useState<string>("");
  const [consejos, setConsejos] = useState<ConsejoComunal[]>([]);
  const [selectedConsejo, setSelectedConsejo] = useState<ConsejoComunal | null>(null);
  const [todasFichas, setTodasFichas] = useState<FichaCensada[]>([]);
  const [loading, setLoading] = useState(true);
  const [consejosLoading, setConsejosLoading] = useState(true);
  const [modalFamiliarOpen, setModalFamiliarOpen] = useState<string | null>(null);
  const [modalDocumentOpen, setModalDocumentOpen] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState("");
  const ITEMS_PER_PAGE = 5;

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

  // ==================== OCULTAR SIDEBAR ====================
  useEffect(() => {
    if (modalFamiliarOpen || modalDocumentOpen || modalState.isOpen) {
      document.body.classList.add('modal-open');
    } else {
      document.body.classList.remove('modal-open');
    }
    return () => document.body.classList.remove('modal-open');
  }, [modalFamiliarOpen, modalDocumentOpen, modalState.isOpen]);

  useEffect(() => {
    const loadInitialData = async () => {
      if (!user?.id) {
        setLoading(false);
        return;
      }

      setLoading(true);
      try {
        // 1. Obtener comuna del usuario
        const { data: comunaData, error: comunaError } = await supabase
          .from('datos_comuna')
          .select('id_comuna, nombre_comuna')
          .or(`id_usuario.eq.${user.id},id_usuario_auxiliar.eq.${user.id}`)
          .maybeSingle();

        if (comunaError || !comunaData) {
          if (comunaError) console.error('Error cargando comuna:', comunaError);
          setNoComuna(true);
          setLoading(false);
          return;
        }

        const idComuna = comunaData.id_comuna;
        setComunaId(idComuna);
        setNombreComuna(comunaData.nombre_comuna);
        setNoComuna(false);

        // 2. Obtener consejos comunales de la comuna
        const { data: sectores, error: sectoresError } = await supabase
          .from('sectores')
          .select('id_sector')
          .eq('id_datos_comuna', idComuna)
          .eq('activo', true);

        let consejosList: ConsejoComunal[] = [];
        if (!sectoresError && sectores && sectores.length > 0) {
          const sectorIds = sectores.map(s => s.id_sector);
          const { data: consejosData, error: consejosError } = await supabase
            .from('datos_consejo_comunal')
            .select('id_consejo, nombre_consejo')
            .in('id_sector', sectorIds);
          if (!consejosError) {
            consejosList = consejosData || [];
            setConsejos(consejosList);
          }
        } else {
          setConsejos([]);
        }

        // 3. Cargar todas las fichas de los consejos (si hay consejos)
        if (consejosList.length === 0) {
          setTodasFichas([]);
          setLoading(false);
          return;
        }

        const consejoIds = consejosList.map(c => c.id_consejo);
        const { data: fichasData, error: fichasError } = await supabase
          .from('censo_fichas')
          .select('*')
          .in('id_consejo', consejoIds)
          .order('created_at', { ascending: false });

        if (fichasError) {
          console.error('Error cargando fichas:', fichasError);
          setTodasFichas([]);
          setLoading(false);
          return;
        }

        // 4. Procesar cada ficha con sus familiares
        const fichasConFamiliares = await Promise.all((fichasData || []).map(async (ficha: any) => {
          const { data: familiaresData } = await supabase
            .from('censo_familiares')
            .select('*')
            .eq('id_ficha', ficha.id_ficha)
            .order('numero', { ascending: true });

          let ninos = 0, jovenes = 0, adultosMayores = 0, casosSalud = 0;
          const familiares = (familiaresData || []).map((fam: any) => {
            const edad = fam.edad || 0;
            if (edad > 0 && edad <= 12) ninos++;
            else if (edad >= 13 && edad <= 29) jovenes++;
            else if (edad >= 60) adultosMayores++;
            if (esCasoDeSalud(fam.enfermedad)) casosSalud++;

            const nombreCompleto = `${fam.nombre_familiar || ''} ${fam.apellido_familiar || ''}`.trim();
            return {
              numero: fam.numero,
              nombreApellido: nombreCompleto || fam.nombre_familiar || 'S/N',
              sexo: fam.sexo || 'S/D',
              cedula: fam.cedula || 'S/C',
              fechaNacimiento: fam.fecha_nacimiento || '',
              edad: edad,
              cne: fam.cne || 'S/D',
              discapacidad: fam.discapacidad || 'No',
              enfermedad: fam.enfermedad || 'No',
              embarazo: fam.embarazo || 'No',
              parentesco: fam.parentesco || 'Otros',
              instruccion: fam.instruccion || 'S/D',
              oficio: fam.oficio || 'S/D',
              pensionado: fam.pensionado || 'No',
              centro_votacion: fam.centro_votacion || '',
              telefono: fam.telefono || ''
            };
          });

          const edadJefe = ficha.edad || 0;
          if (edadJefe > 0 && edadJefe <= 12) ninos++;
          else if (edadJefe >= 13 && edadJefe <= 29) jovenes++;
          else if (edadJefe >= 60) adultosMayores++;

          let misionesObj: Misiones | undefined = undefined;
          if (ficha.misiones) {
            if (typeof ficha.misiones === 'string') {
              try { misionesObj = JSON.parse(ficha.misiones); } catch(e) {}
            } else {
              misionesObj = ficha.misiones;
            }
          }

          return {
            id_ficha: ficha.id_ficha,
            id_consejo: ficha.id_consejo,
            archivo_nombre: ficha.archivo_nombre,
            archivo_url: ficha.archivo_url,
            hoja_excel: ficha.hoja_excel,
            fila_inicio: ficha.fila_inicio,
            jefe: {
              nombres: ficha.nombres,
              apellidos: ficha.apellidos,
              cedula: ficha.cedula,
              edad: ficha.edad,
              fechaNacimiento: ficha.fecha_nacimiento,
              sexo: ficha.sexo,
              estadoCivil: ficha.estado_civil,
              instruccion: ficha.instruccion,
              cne: ficha.cne,
              incapacidad: ficha.incapacidad,
              pensionado: ficha.pensionado,
              tipo_incapacidad: ficha.tipo_incapacidad,
              institucion_pension: ficha.institucion_pension,
              tiempo_comunidad: ficha.tiempo_comunidad,
              telefono: ficha.telefono,
              centro_votacion: ficha.centro_votacion
            },
            ubicacion: {
              estado: ficha.estado,
              municipio: ficha.municipio,
              parroquia: ficha.parroquia,
              sector: ficha.sector,
              comunidad: ficha.comunidad,
              direccion: ficha.direccion
            },
            familiares,
            indicadores: { ninos, jovenes, adultosMayores, casosSalud },
            gas: ficha.gas, // puede ser objeto JSON
            cantidad_bombonas: ficha.cantidad_bombonas,
            misiones: misionesObj
          };
        }));

        setTodasFichas(fichasConFamiliares);
      } catch (error) {
        console.error('Error en carga inicial:', error);
        showAlert('Error', 'No se pudieron cargar los datos', 'danger');
      } finally {
        setLoading(false);
      }
    };

    loadInitialData();
  }, [user]);

  // ==================== FUNCIONES DE STORAGE (solo descarga) ====================
  const getSignedUrl = async (filePath: string | null): Promise<string | null> => {
    if (!filePath) return null;
    const bucketName = 'censo_archivos';
    let cleanPath = filePath;
    if (filePath.includes('http')) {
      const searchString = `/storage/v1/object/public/${bucketName}/`;
      const pathStart = filePath.indexOf(searchString);
      if (pathStart !== -1) {
        cleanPath = filePath.substring(pathStart + searchString.length);
      }
    }
    cleanPath = cleanPath.startsWith('/') ? cleanPath.substring(1) : cleanPath;
    const { data, error } = await supabase.storage
      .from(bucketName)
      .createSignedUrl(cleanPath, 3600);
    if (error) {
      console.error('Error generando URL firmada:', error.message);
      return null;
    }
    return data.signedUrl;
  };

  const handleDownloadExcel = async (archivoUrl: string | null, nombreArchivo: string) => {
    if (!archivoUrl) {
      showAlert('Sin archivo', 'No hay archivo asociado a esta ficha', 'warning');
      return;
    }
    const signedUrl = await getSignedUrl(archivoUrl);
    if (signedUrl) {
      window.open(signedUrl, '_blank');
    } else {
      showAlert('Error', 'No se pudo descargar el archivo', 'danger');
    }
  };

  const handleDownloadPDF = () => {
    if (filteredFichas.length === 0) {
      showAlert('Sin datos', 'No hay datos para generar el PDF', 'warning');
      return;
    }
    const consejoMap = new Map<number, string>();
    consejos.forEach(c => consejoMap.set(c.id_consejo, c.nombre_consejo));
    generarPDFComuna(filteredFichas, nombreComuna, consejoMap);
  };

  // ==================== CÁLCULOS GLOBALES ====================
  const globales = useMemo(() => {
    let totalBombonas = 0;
    let totalMisiones = 0;
    let totalMigrantes = 0;
    
    todasFichas.forEach(f => {
      // ✅ Sumar directamente la cantidad de bombonas si existe
      if (f.cantidad_bombonas && f.cantidad_bombonas > 0) {
        totalBombonas += f.cantidad_bombonas;
      }

      // Misiones
      if (f.misiones) {
        totalMisiones += (f.misiones.ribas + f.misiones.ezequiel + f.misiones.sucre + 
                          f.misiones.vuelvaCaras + f.misiones.identidad + 
                          f.misiones.barrioAdentro + f.misiones.mercal);
      }
      // Migrantes (si existiera campo)
      // if (f.migrado) totalMigrantes++;
    });
    
    const habitantesActuales = todasFichas.reduce((acc, curr) => acc + 1 + curr.familiares.length, 0);
    const habitantesHistoricos = habitantesActuales + totalMigrantes;
    const tasaMigracion = habitantesHistoricos > 0 ? ((totalMigrantes / habitantesHistoricos) * 100).toFixed(1) : '0';
    
    return {
      habitantes: habitantesActuales,
      ninos: todasFichas.reduce((acc, curr) => acc + curr.indicadores.ninos, 0),
      jovenes: todasFichas.reduce((acc, curr) => acc + curr.indicadores.jovenes, 0),
      abuelos: todasFichas.reduce((acc, curr) => acc + curr.indicadores.adultosMayores, 0),
      salud: todasFichas.reduce((acc, curr) => acc + curr.indicadores.casosSalud, 0),
      familias: todasFichas.length,
      bombonas: totalBombonas,
      misionesTotal: totalMisiones,
      tasaMigracion: `${tasaMigracion}% (${totalMigrantes} personas)`
    };
  }, [todasFichas]);

  const filteredFichas = useMemo(() => {
    let resultado = todasFichas;
    if (selectedConsejo) {
      resultado = resultado.filter(f => f.id_consejo === selectedConsejo.id_consejo);
    }
    const term = searchTerm.toLowerCase().trim();
    if (term) {
      resultado = resultado.filter(f =>
        f.jefe.nombres.toLowerCase().includes(term) ||
        f.jefe.apellidos.toLowerCase().includes(term) ||
        f.jefe.cedula.includes(term) ||
        (f.jefe.telefono && f.jefe.telefono.includes(term)) ||
        f.archivo_nombre.toLowerCase().includes(term) ||
        f.hoja_excel.toLowerCase().includes(term)
      );
    }
    return resultado;
  }, [todasFichas, selectedConsejo, searchTerm]);

  const totalPages = Math.ceil(filteredFichas.length / ITEMS_PER_PAGE);
  const paginatedFichas = filteredFichas.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE);
  useEffect(() => setCurrentPage(1), [searchTerm, selectedConsejo]);

  if (loading) return <div className="flex justify-center p-8"><Loader2 className="animate-spin text-brand-primary" size={28} /></div>;

  if (noComuna) {
    const onNavigate = (route: string) => {
      try {
        const base = '/dashboard/comuna';
        const target = route.startsWith('/') ? route : `${base}/${route}`;
        if (typeof window !== 'undefined') window.location.href = target;
      } catch (err) {
        console.error('Error navegando:', err);
      }
    };

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
    <div className="max-w-7xl mx-auto space-y-4 p-3 font-sans min-h-screen">
      {/* Cabecera */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-3">
        <div>
          <h2 className="text-base font-black text-slate-800 italic uppercase tracking-tighter flex items-center gap-2">
            <Shield className="h-5 w-5 text-indigo-600" /> Censo Poblacional Comunal
          </h2>
          <p className="text-[8px] text-slate-400 font-bold uppercase tracking-[0.15em]">
            {consejos.length > 0 && `${consejos.length} consejos comunales`}
          </p>
        </div>
        <div className="flex gap-2">
          <select
            value={selectedConsejo?.id_consejo || ''}
            onChange={(e) => {
              const id = parseInt(e.target.value);
              const consejo = consejos.find(c => c.id_consejo === id);
              setSelectedConsejo(consejo || null);
              setCurrentPage(1);
            }}
            className="px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-[11px] font-bold text-slate-800 focus:ring-2 focus:ring-indigo-500"
          >
            <option value="">Todos los consejos</option>
            {consejos.map((consejo) => (
              <option key={consejo.id_consejo} value={consejo.id_consejo}>
                {consejo.nombre_consejo}
              </option>
            ))}
          </select>
          <button onClick={handleDownloadPDF} disabled={filteredFichas.length === 0} className="flex items-center gap-1.5 px-4 py-1.5 bg-red-600 text-white text-[9px] font-black uppercase tracking-wider rounded-lg hover:bg-red-700 disabled:bg-red-300 shadow-md">
            <FileText className="h-3.5 w-3.5" /> PDF
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
        <StatCard icon={<Users />} label="Habitantes" value={globales.habitantes} color="emerald" />
        <StatCard icon={<Home />} label="Familias" value={globales.familias} color="emerald" />
        <StatCard icon={<Baby />} label="Niños (0-12)" value={globales.ninos} color="emerald" />
        <StatCard icon={<UserCircle />} label="Jóvenes (13-29)" value={globales.jovenes} color="emerald" />
        <StatCard icon={<HeartPulse />} label="Adultos Mayores" value={globales.abuelos} color="emerald" />
        <StatCard icon={<Activity />} label="Casos Salud" value={globales.salud} color="emerald" />
        <StatCard icon={<Flame />} label="Bombonas Gas" value={globales.bombonas} color="amber" />
        <StatCard icon={<GraduationCap />} label="Misiones" value={globales.misionesTotal} color="indigo" />
        <StatCard icon={<LogOut />} label="Tasa Migración" value={globales.tasaMigracion} color="rose" />
      </div>

      {/* Tabla principal */}
      <div className="bg-white rounded-xl border border-slate-100 shadow-md overflow-hidden">
        <div className="p-3 border-b border-slate-50">
          <div className="flex flex-col lg:flex-row gap-3 items-start lg:items-center justify-between">
            <h3 className="text-[10px] font-black uppercase text-slate-400 tracking-wider">
              Jefes de Familia ({filteredFichas.length} {selectedConsejo ? `de ${selectedConsejo.nombre_consejo}` : 'total'})
            </h3>
            <div className="flex gap-2 lg:w-80">
              <div className="relative flex-1">
                <Search className="absolute left-2.5 top-1/2 transform -translate-y-1/2 h-3 w-3 text-slate-400" />
                <input 
                  type="text" 
                  placeholder="Buscar por nombre, cédula o teléfono..." 
                  value={searchTerm} 
                  onChange={(e) => setSearchTerm(e.target.value)} 
                  className="w-full pl-8 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-[10px] focus:ring-1 focus:ring-indigo-500" 
                />
              </div>
            </div>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-slate-50/50">
                <th className="p-2 text-[8px] font-black uppercase text-slate-500 w-40">Jefe de Familia</th>
                <th className="p-2 text-[8px] font-black uppercase text-slate-500">Cédula</th>
                <th className="p-2 text-[8px] font-black uppercase text-slate-500">Edad</th>
                <th className="p-2 text-[8px] font-black uppercase text-slate-500">Sexo</th>
                <th className="p-2 text-[8px] font-black uppercase text-slate-500">Teléfono</th>
                <th className="p-2 text-[8px] font-black uppercase text-slate-500">Carga Familiar</th>
                <th className="p-2 text-[8px] font-black uppercase text-slate-500 text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {paginatedFichas.map((ficha) => (
                <tr key={ficha.id_ficha} className="hover:bg-indigo-50/30 transition-colors">
                  <td className="p-2">
                    <div className="flex flex-col space-y-0.5">
                      <span className="text-[10px] font-black text-slate-700 uppercase italic flex items-center gap-1">
                        {ficha.jefe.nombres} {ficha.jefe.apellidos}
                      </span>
                      <div className="flex items-center gap-1 text-[7px] text-slate-400 font-bold">
                        <FileText className="h-2 w-2" />
                        <span>{ficha.archivo_nombre}</span>
                      </div>
                    </div>
                  </td>
                  <td className="p-2 text-[10px] font-bold text-slate-600 font-mono">{ficha.jefe.cedula}</td>
                  <td className="p-2 text-[10px] font-bold text-slate-600">{ficha.jefe.edad} años</td>
                  <td className="p-2"><span className="px-1.5 py-0.5 bg-indigo-50 text-indigo-700 rounded-full text-[8px] font-black uppercase">{ficha.jefe.sexo}</span></td>
                  <td className="p-2"><span className="text-[10px] font-bold text-slate-600">{ficha.jefe.telefono || 'S/D'}</span></td>
                  <td className="p-2">
                    <button onClick={() => setModalFamiliarOpen(ficha.id_ficha)} className="flex items-center gap-1 px-2 py-1 bg-indigo-50 text-indigo-600 rounded-lg hover:bg-indigo-100 text-[8px] font-black uppercase">
                      <Users2 className="h-2.5 w-2.5" /> {ficha.familiares.length} Personas
                    </button>
                  </td>
                  <td className="p-2 text-right">
                    <div className="flex justify-end gap-1">
                      <button onClick={() => setModalDocumentOpen(ficha.id_ficha)} className="p-1 bg-blue-50 text-blue-700 hover:bg-blue-100 rounded-lg"><Eye className="h-3 w-3" /></button>
                      <button onClick={() => handleDownloadExcel(ficha.archivo_url, ficha.archivo_nombre)} className="p-1 bg-emerald-50 text-emerald-600 hover:bg-emerald-100 rounded-lg"><DownloadCloud className="h-3 w-3" /></button>
                    </div>
                  </td>
                </tr>
              ))}
              {paginatedFichas.length === 0 && (
                <tr>
                  <td colSpan={7} className="p-6 text-center">
                    <Users2 className="h-8 w-8 text-slate-300 mx-auto mb-2" />
                    <h3 className="text-xs font-black text-slate-500">{searchTerm ? 'No se encontraron resultados' : 'No hay fichas registradas'}</h3>
                    <p className="text-[9px] text-slate-400">
                      {searchTerm
                        ? `No se encontraron jefes de familia con "${searchTerm}"`
                        : selectedConsejo 
                          ? `No hay fichas para el consejo "${selectedConsejo.nombre_consejo}"`
                          : 'Selecciona un consejo para cargar fichas'}
                    </p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        {totalPages > 1 && (
          <div className="px-3 py-2 border-t border-slate-100 bg-slate-50">
            <div className="flex items-center justify-between">
              <div className="text-[10px] text-slate-500">Página {currentPage} de {totalPages} ({filteredFichas.length} resultados)</div>
              <div className="flex items-center gap-1">
                <button onClick={() => setCurrentPage(p => Math.max(1, p-1))} disabled={currentPage === 1} className="px-2 py-1 text-[10px] font-bold text-slate-500 hover:text-slate-700 disabled:text-slate-300">Anterior</button>
                {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                  <button key={page} onClick={() => setCurrentPage(page)} className={cn("w-7 h-7 rounded-lg text-[10px] font-bold", currentPage === page ? "bg-indigo-600 text-white" : "text-slate-500 hover:bg-slate-200")}>{page}</button>
                ))}
                <button onClick={() => setCurrentPage(p => Math.min(totalPages, p+1))} disabled={currentPage === totalPages} className="px-2 py-1 text-[10px] font-bold text-slate-500 hover:text-slate-700 disabled:text-slate-300">Siguiente</button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* MODAL DE CARGA FAMILIAR */}
      <AnimatePresence>
        {modalFamiliarOpen && todasFichas.find(f => f.id_ficha === modalFamiliarOpen) && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setModalFamiliarOpen(null)} className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" />
            <motion.div initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 20 }} className="relative w-full max-w-5xl max-h-[80vh] bg-white rounded-2xl shadow-2xl overflow-hidden border border-gray-100 overflow-y-auto">
              <div className="p-5 border-b border-gray-50 flex items-center justify-between sticky top-0 bg-white z-10">
                <h4 className="text-base font-black text-slate-800 italic uppercase tracking-tighter flex items-center gap-2">
                  <Users2 className="h-5 w-5 text-indigo-600" /> Carga Familiar
                </h4>
                <button onClick={() => setModalFamiliarOpen(null)} className="p-1.5 rounded-lg hover:bg-gray-100"><X className="h-4 w-4 text-slate-400" /></button>
              </div>
              <div className="p-4 overflow-x-auto">
                <table className="w-full text-[10px]">
                  <thead>
                    <tr className="bg-slate-50/50">
                      <th className="p-2 text-[9px] font-black uppercase text-slate-500 w-10">N°</th>
                      <th className="p-2 text-[9px] font-black uppercase text-slate-500 min-w-35">Nombres</th>
                      <th className="p-2 text-[9px] font-black uppercase text-slate-500 w-12">Sexo</th>
                      <th className="p-2 text-[9px] font-black uppercase text-slate-500 w-24">Cédula</th>
                      <th className="p-2 text-[9px] font-black uppercase text-slate-500 w-28">F. Nacimiento</th>
                      <th className="p-2 text-[9px] font-black uppercase text-slate-500 w-10">Edad</th>
                      <th className="p-2 text-[9px] font-black uppercase text-slate-500 w-20">Teléfono</th>
                      <th className="p-2 text-[9px] font-black uppercase text-slate-500 w-20">Centro Vot.</th>
                      <th className="p-2 text-[9px] font-black uppercase text-slate-500 w-20">Discap.</th>
                      <th className="p-2 text-[9px] font-black uppercase text-slate-500 w-24">Enfermedad</th>
                      <th className="p-2 text-[9px] font-black uppercase text-slate-500 w-16">Embarazo</th>
                      <th className="p-2 text-[9px] font-black uppercase text-slate-500 w-20">Parentesco</th>
                      <th className="p-2 text-[9px] font-black uppercase text-slate-500 w-20">Instrucción</th>
                      <th className="p-2 text-[9px] font-black uppercase text-slate-500 w-24">Oficio</th>
                      <th className="p-2 text-[9px] font-black uppercase text-slate-500 w-16">Pensionado</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {todasFichas.find(f => f.id_ficha === modalFamiliarOpen)?.familiares.map((fam, idx) => (
                      <tr key={idx} className="hover:bg-indigo-50/30">
                        <td className="p-2 font-bold text-slate-700">{fam.numero}</td>
                        <td className="p-2 font-semibold text-slate-800">{fam.nombreApellido}</td>
                        <td className="p-2"><span className="px-1.5 py-0.5 bg-indigo-50 text-indigo-700 rounded-full text-[9px] font-bold uppercase">{fam.sexo}</span></td>
                        <td className="p-2 font-mono text-slate-600">{fam.cedula}</td>
                        <td className="p-2 text-slate-600 truncate">{fam.fechaNacimiento}</td>
                        <td className="p-2 font-bold text-slate-800">{fam.edad}</td>
                        <td className="p-2 text-slate-600">{fam.telefono || 'S/D'}</td>
                        <td className="p-2 text-slate-600 truncate max-w-28">{fam.centro_votacion || 'S/D'}</td>
                        <td className="p-2"><span className={cn("px-1.5 py-0.5 rounded-full text-[9px] font-bold uppercase", fam.discapacidad?.toLowerCase() !== 'no' && fam.discapacidad !== '' ? 'bg-rose-100 text-rose-700' : 'bg-emerald-100 text-emerald-700')}>{fam.discapacidad || 'No'}</span></td>
                        <td className="p-2"><span className={cn("px-1.5 py-0.5 rounded-full text-[9px] font-bold uppercase truncate max-w-24", esCasoDeSalud(fam.enfermedad) ? 'bg-amber-100 text-amber-700' : 'bg-emerald-100 text-emerald-700')}>{fam.enfermedad || 'No'}</span></td>
                        <td className="p-2"><span className={cn("px-1.5 py-0.5 rounded-full text-[9px] font-bold uppercase", fam.embarazo?.toLowerCase() === 'si' ? 'bg-pink-100 text-pink-700' : 'bg-emerald-100 text-emerald-700')}>{fam.embarazo || 'No'}</span></td>
                        <td className="p-2 font-semibold text-slate-700">{fam.parentesco}</td>
                        <td className="p-2 text-slate-600 truncate">{fam.instruccion}</td>
                        <td className="p-2 text-slate-600 max-w-30 truncate">{fam.oficio}</td>
                        <td className="p-2"><span className={cn("px-1.5 py-0.5 rounded-full text-[9px] font-bold uppercase", fam.pensionado?.toLowerCase() === 'si' ? 'bg-blue-100 text-blue-700' : 'bg-emerald-100 text-emerald-700')}>{fam.pensionado || 'No'}</span></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* MODAL DE DOCUMENTO */}
      <AnimatePresence>
        {modalDocumentOpen && todasFichas.find(f => f.id_ficha === modalDocumentOpen) && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setModalDocumentOpen(null)} className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" />
            <motion.div initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 20 }} className="relative w-full max-w-2xl max-h-[80vh] bg-white rounded-2xl shadow-2xl overflow-hidden border border-gray-100">
              <div className="p-5 border-b border-gray-50 flex items-center justify-between sticky top-0 bg-white z-10">
                <div className="flex items-center gap-3">
                  <FileText className="h-5 w-5 text-blue-600" />
                  <div>
                    <h4 className="text-base font-black text-slate-800 italic uppercase tracking-tighter">{todasFichas.find(f => f.id_ficha === modalDocumentOpen)?.jefe.nombres} {todasFichas.find(f => f.id_ficha === modalDocumentOpen)?.jefe.apellidos}</h4>
                    <p className="text-[11px] text-slate-500">{todasFichas.find(f => f.id_ficha === modalDocumentOpen)?.archivo_nombre}</p>
                  </div>
                </div>
                <div className="flex gap-2">
                  <button onClick={() => handleDownloadExcel(todasFichas.find(f => f.id_ficha === modalDocumentOpen)?.archivo_url || null, todasFichas.find(f => f.id_ficha === modalDocumentOpen)?.archivo_nombre || '')} className="p-1.5 bg-emerald-50 text-emerald-600 hover:bg-emerald-100 rounded-lg"><DownloadCloud className="h-4 w-4" /></button>
                  <button onClick={() => setModalDocumentOpen(null)} className="p-1.5 rounded-lg hover:bg-gray-100"><X className="h-4 w-4 text-slate-400" /></button>
                </div>
              </div>
              <div className="p-5 max-h-[60vh] overflow-y-auto">
                <div className="bg-linear-to-r from-blue-50 to-indigo-50 p-4 rounded-xl border border-blue-100">
                  <h5 className="text-[11px] font-black text-slate-700 uppercase tracking-wider mb-3 flex items-center gap-2"><Users className="h-3.5 w-3.5" /> Información del Jefe</h5>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div><span className="text-slate-500 font-bold uppercase tracking-wider text-[8px]">Cédula:</span><p className="font-black text-slate-800 text-[10px]">{todasFichas.find(f => f.id_ficha === modalDocumentOpen)?.jefe.cedula}</p></div>
                    <div><span className="text-slate-500 font-bold uppercase tracking-wider text-[8px]">Edad:</span><p className="font-black text-slate-800 text-[10px]">{todasFichas.find(f => f.id_ficha === modalDocumentOpen)?.jefe.edad} años</p></div>
                    <div><span className="text-slate-500 font-bold uppercase tracking-wider text-[8px]">Sexo:</span><p className="font-black text-slate-800 text-[10px]">{todasFichas.find(f => f.id_ficha === modalDocumentOpen)?.jefe.sexo}</p></div>
                    <div><span className="text-slate-500 font-bold uppercase tracking-wider text-[8px]">Teléfono:</span><p className="font-black text-slate-800 text-[10px]">{todasFichas.find(f => f.id_ficha === modalDocumentOpen)?.jefe.telefono || 'S/D'}</p></div>
                    <div><span className="text-slate-500 font-bold uppercase tracking-wider text-[8px]">Centro Votación:</span><p className="font-black text-slate-800 text-[10px]">{todasFichas.find(f => f.id_ficha === modalDocumentOpen)?.jefe.centro_votacion || 'S/D'}</p></div>
                    <div><span className="text-slate-500 font-bold uppercase tracking-wider text-[8px]">Estado Civil:</span><p className="font-black text-slate-800 text-[10px]">{todasFichas.find(f => f.id_ficha === modalDocumentOpen)?.jefe.estadoCivil}</p></div>
                    <div><span className="text-slate-500 font-bold uppercase tracking-wider text-[8px]">Instrucción:</span><p className="font-black text-slate-800 text-[10px]">{todasFichas.find(f => f.id_ficha === modalDocumentOpen)?.jefe.instruccion}</p></div>
                    <div><span className="text-slate-500 font-bold uppercase tracking-wider text-[8px]">CNE:</span><p className="font-black text-slate-800 text-[10px]">{todasFichas.find(f => f.id_ficha === modalDocumentOpen)?.jefe.cne}</p></div>
                    <div className="col-span-2"><span className="text-slate-500 font-bold uppercase tracking-wider text-[8px]">Dirección:</span><p className="font-black text-slate-800 text-[10px]">{todasFichas.find(f => f.id_ficha === modalDocumentOpen)?.ubicacion.direccion}</p></div>
                  </div>
                </div>
                <div className="mt-4 bg-amber-50 p-4 rounded-xl border border-amber-100">
                  <h5 className="text-[11px] font-black text-slate-700 uppercase tracking-wider mb-3 flex items-center gap-2"><Flame className="h-3.5 w-3.5" /> Servicios y Misiones</h5>
                  <div className="grid grid-cols-1 gap-3">
                    <div>
                      <span className="text-slate-500 font-bold uppercase tracking-wider text-[8px]">Bombonas Gas:</span>
                      <p className="font-black text-slate-800 text-[10px]">
                        {(() => {
                          const ficha = todasFichas.find(f => f.id_ficha === modalDocumentOpen);
                          const cantidad = ficha?.cantidad_bombonas;
                          return cantidad && cantidad > 0 ? `${cantidad} cilindros` : 'No';
                        })()}
                      </p>
                    </div>
                    {/* Aquí puedes agregar otros campos de servicios si los tienes */}
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

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

export default CensoComuna;