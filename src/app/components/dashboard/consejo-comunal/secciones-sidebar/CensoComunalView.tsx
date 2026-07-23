"use client";

import React, { useState, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Users, HeartPulse, Activity, Upload, X, Clock, Shield, UserCircle, AlertCircle,
  FileText, Download, Users2, DownloadCloud, Baby, Search, Eye, Loader2, Trash2,
  Flame, Bus, GraduationCap, Zap, Home, Phone, MapPin, LogOut, Crown, FileCheck,
  Droplets, Trash, Zap as ZapIcon, FlameKindling
} from "lucide-react";
import { cn } from "@/app/lib/utils";
import { supabase } from "@/app/lib/supabaseClient";
import { useAuth } from "@/context/AuthContext";
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { AlertModal } from "@/app/components/AlertModal";

// ==================== TIPOS ====================
interface CensoComunalViewProps {
  onNavigate: (section: string) => void;
}

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
  parentesco?: string;
  instruccion: string;
  oficio: string;
  pensionado: string;
  centro_votacion?: string;
  telefono?: string;
  migrado?: boolean;
  fecha_migracion?: string;
  motivo_migracion?: string;
}

interface Misiones {
  ribas: number;
  ezequiel: number;
  sucre: number;
  vuelvaCaras: number;
  identidad: number;
  barrioAdentro: number;
  mercal: number;
  otras?: number;
}

interface Servicios {
  aguas_blancas: {
    acueducto: boolean;
    camion: boolean;
    pila_publica: boolean;
    rio: boolean;
    tanque: boolean;
    pipote: boolean;
    litro_tanque: number;
    litro_pipote: number;
    cantidad_pipote: number;
  };
  aguas_servidas: {
    cloacas: boolean;
    pozo: boolean;
    septico: boolean;
    letrinas: boolean;
    aire_libre: boolean;
    depositada: boolean;
    otros: boolean;
  };
  recoleccion_basura: {
    aseo: boolean;
    conteiner: boolean;
    bajante: boolean;
    camion: boolean;
    aire_libre: boolean;
    quemada: boolean;
  };
  sistema_electrico: {
    publico: boolean;
    planta_electrica: boolean;
    no_tiene: boolean;
  };
  gas: {
    bombona: boolean;
    tuberia: boolean;
    kg_10: number;
    kg_18: number;
    kg_43: number;
  };
}

interface FichaCensada {
  id_ficha: string;
  archivo_nombre: string;
  archivo_url: string | null;
  hoja_excel: string;
  jefe: {
    nombres: string;
    apellidos: string;
    cedula: string;
    edad: number;
    fechaNacimiento?: string;
    sexo?: string;
    instruccion?: string;
    cne?: string;
    discapacidad?: string | null;
    pensionado?: string | null;
    enfermedad?: string | null;
    telefono?: string;
    centro_votacion?: string;
    oficio?: string;
    trabajo_actual?: string;
    migrado?: boolean;
    fecha_migracion?: string;
    motivo_migracion?: string;
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
    migrantes: number;
  };
  servicios: Servicios;
  misiones?: Misiones;
  kg_bombona?: { kg10: number; kg18: number; kg43: number };
  cantidad_bombonas: number;
}

// ==================== FUNCIONES AUXILIARES ====================
const excelSerialToDate = (serial: number): string => {
  if (!serial || typeof serial !== 'number') return '';
  let days = serial;
  if (days > 60) days -= 1;
  const epoch = new Date(Date.UTC(1900, 0, 1));
  const utcDate = new Date(epoch.getTime() + (days - 1) * 86400000);
  const year = utcDate.getUTCFullYear();
  const month = String(utcDate.getUTCMonth() + 1).padStart(2, '0');
  const day = String(utcDate.getUTCDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const cleanLabelCell = (value: any): string => {
  if (!value || typeof value !== 'string') return '';
  let trimmed = value.trim();
  const colonIndex = trimmed.indexOf(':');
  if (colonIndex !== -1) trimmed = trimmed.substring(colonIndex + 1).trim();
  const labels = ['Municipio', 'Parroquia', 'Sector', 'Dirección', 'Nombre de la Comunidad', 'C.I N°', 'Fecha de Nacimiento'];
  for (const label of labels) {
    if (trimmed === label) return '';
    if (trimmed.startsWith(label)) {
      trimmed = trimmed.substring(label.length).trim();
    }
  }
  return trimmed;
};

const parseFecha = (fechaRaw: string): string => {
  if (!fechaRaw || fechaRaw === 'S/D') return '';
  if (/^\d+$/.test(fechaRaw)) {
    const serial = parseInt(fechaRaw, 10);
    return excelSerialToDate(serial);
  }
  const parts = fechaRaw.split('/');
  if (parts.length === 3) {
    const day = parts[0].padStart(2, '0');
    const month = parts[1].padStart(2, '0');
    let year = parts[2];
    if (year.length === 2) year = '20' + year;
    if (year.length === 4 && !isNaN(Number(day)) && !isNaN(Number(month)) && !isNaN(Number(year))) {
      return `${year}-${month}-${day}`;
    }
  }
  return fechaRaw;
};

const getMarkedOption = (row: any[], colSi: number, colNo: number): string | null => {
  if (!row) return null;
  const valSi = row[colSi]?.toString().trim();
  const valNo = row[colNo]?.toString().trim();
  if (valSi === 'X' || valSi === 'x') return 'Sí';
  if (valNo === 'X' || valNo === 'x') return 'No';
  return null;
};

const leerCeldasCombinadas = (fila: any[], inicioCol: number, finCol: number): string => {
  let valor = '';
  for (let col = inicioCol; col <= finCol; col++) {
    if (fila && fila[col]) valor += String(fila[col]).trim();
  }
  return cleanLabelCell(valor.trim() || 'S/D');
};

// Nueva función para leer texto sin limpiar (para discapacidad y pensionado)
const leerCeldasRaw = (fila: any[], inicioCol: number, finCol: number): string => {
  let valor = '';
  for (let col = inicioCol; col <= finCol; col++) {
    if (fila && fila[col]) valor += String(fila[col]).trim();
  }
  return valor.trim();
};

// ==================== STATCARD ====================
const StatCard = ({ icon, label, value, color, onClick }: any) => {
  const colorClasses: Record<string, string> = {
    blue: "text-blue-600 bg-blue-50 border-blue-100",
    emerald: "text-emerald-600 bg-emerald-50 border-emerald-100",
    indigo: "text-indigo-600 bg-indigo-50 border-indigo-100",
    rose: "text-rose-600 bg-rose-50 border-rose-100",
    amber: "text-amber-600 bg-amber-50 border-amber-100",
    slate: "text-slate-600 bg-slate-50 border-slate-100"
  };
  return (
    <div 
      onClick={onClick}
      className={cn("bg-white p-3 rounded-2xl border border-slate-100 shadow-sm flex items-center gap-3 transition-all hover:scale-[1.02] cursor-pointer", onClick && "hover:shadow-md")}
    >
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
const generarPDF = (fichasFiltradas: FichaCensada[], nombreConsejoComunal: string) => {
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
  doc.text(`CONSEJO COMUNAL: ${nombreConsejoComunal.toUpperCase()}`, 10, 37);
  yPosition = 42;

  const todasLasPersonas: any[] = [];
  fichasFiltradas.forEach((ficha) => {
    if (!ficha.jefe.migrado) {
      todasLasPersonas.push({
        nombreApellido: `${ficha.jefe.nombres} ${ficha.jefe.apellidos}`.toUpperCase(),
        cedula: ficha.jefe.cedula,
        sexo: ficha.jefe.sexo || 'S/D',
        fechaNacimiento: ficha.jefe.fechaNacimiento || 'S/D',
        edad: ficha.jefe.edad,
        cne: ficha.jefe.cne || 'S/D',
        discapacidad: ficha.jefe.discapacidad === 'Sí' ? 'SI' : (ficha.jefe.discapacidad || 'NO'),
        enfermedad: ficha.jefe.enfermedad || 'NO',
        centro_votacion: ficha.jefe.centro_votacion || 'S/D',
        telefono: ficha.jefe.telefono || 'S/D',
        pensionado: ficha.jefe.pensionado === 'Sí' ? 'SI' : 'NO',
        esJefe: true
      });
    }
    ficha.familiares.forEach(familiar => {
      if (!familiar.migrado) {
        todasLasPersonas.push({
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
      }
    });
  });

  const columnas = [
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
      p.nombreApellido, p.cedula, p.sexo, p.fechaNacimiento, p.edad.toString(),
      p.cne, p.discapacidad, p.enfermedad, p.centro_votacion, p.telefono, p.pensionado
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
  doc.save(`censo_carrizal_${nombreConsejoComunal.toLowerCase().replace(/\s+/g, '_')}.pdf`);
};

// ==================== COMPONENTE PRINCIPAL ====================
export const CensoComunalView = ({ onNavigate }: CensoComunalViewProps) => {
  const { user } = useAuth();
  const [consejoId, setConsejoId] = useState<number | null>(null);
  const [noConsejo, setNoConsejo] = useState(false);
  const [nombreConsejo, setNombreConsejo] = useState<string>("Consejo Comunal");
  const [fichas, setFichas] = useState<FichaCensada[]>([]);
  const [loading, setLoading] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);
  const [modalFamiliarOpen, setModalFamiliarOpen] = useState<string | null>(null);
  const [modalDocumentOpen, setModalDocumentOpen] = useState<string | null>(null);
  const [modalMisionesOpen, setModalMisionesOpen] = useState(false);
  const [modalServiciosOpen, setModalServiciosOpen] = useState(false);
  const [modalMigracionOpen, setModalMigracionOpen] = useState<{id_ficha: string, tipo: 'jefe' | 'familiar', numero?: number} | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState("");
  const [totalMigrantes, setTotalMigrantes] = useState(0);
  const ITEMS_PER_PAGE = 5;

  useEffect(() => {
    const isAnyModalOpen = !!(modalFamiliarOpen || modalDocumentOpen || modalMisionesOpen || modalServiciosOpen || modalMigracionOpen);
    if (isAnyModalOpen) {
      document.body.classList.add('modal-open');
    } else {
      document.body.classList.remove('modal-open');
    }
    return () => {
      document.body.classList.remove('modal-open');
    };
  }, [modalFamiliarOpen, modalDocumentOpen, modalMisionesOpen, modalServiciosOpen, modalMigracionOpen]);

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

  const showPrompt = (title: string, message: string, placeholder: string, onConfirm: (value: string) => void) => {
    setModalState({
      ...modalState,
      isOpen: true,
      title,
      message,
      type: 'info',
      showInput: true,
      inputPlaceholder: placeholder,
      onConfirm: (value?: string) => { if (value) onConfirm(value); setModalState(prev => ({ ...prev, isOpen: false })); },
      confirmText: 'Aceptar',
      cancelText: 'Cancelar',
    });
  };

  const closeModal = () => setModalState(prev => ({ ...prev, isOpen: false }));

  useEffect(() => {
    const lastUpdate = localStorage.getItem('last_censo_update_alert');
    const now = new Date();
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
    
    if (!lastUpdate || new Date(lastUpdate) < sixMonthsAgo) {
      setTimeout(() => {
        showAlert(
          'Actualización del Censo',
          'Han pasado más de 6 meses desde la última actualización del censo. Por favor, revisa y actualiza los datos poblacionales.',
          'warning'
        );
        localStorage.setItem('last_censo_update_alert', now.toISOString());
      }, 1000);
    }
  }, []);

  const descargarPlantilla = () => {
    const link = document.createElement('a');
    link.href = '/Censo_Poblacional_Formato_Final.xlsx';
    link.download = 'plantilla-fichas-censales.xlsx';
    link.click();
  };
  
  useEffect(() => {
    const cargarDatos = async () => {
      if (!user?.id) {
        setLoading(false);
        setNoConsejo(true);
        return;
      }

      setLoading(true);
      setNoConsejo(false);

      const { data: consejoData, error: consejoError } = await supabase
        .from('datos_consejo_comunal')
        .select('id_consejo, nombre_consejo')
        .or(`id_usuario.eq.${user.id},id_usuario_auxiliar.eq.${user.id}`)
        .maybeSingle();

      if (consejoError || !consejoData) {
        setNoConsejo(true);
        setLoading(false);
        return;
      }

      const id = consejoData.id_consejo;
      setConsejoId(id);
      setNombreConsejo(consejoData.nombre_consejo || "Consejo Comunal");

      try {
        const fichasData = await cargarFichasConFamiliares(id);
        setFichas(fichasData);

        const { data: fichasMigradas } = await supabase
          .from('censo_fichas')
          .select('id_ficha')
          .eq('id_consejo', id)
          .eq('migrado', true);

        const { data: familiaresMigrados } = await supabase
          .from('censo_familiares')
          .select('id')
          .eq('migrado', true);

        const total = (fichasMigradas?.length || 0) + (familiaresMigrados?.length || 0);
        setTotalMigrantes(total);

      } catch (error) {
        console.error('Error cargando fichas:', error);
        setFichas([]);
        setTotalMigrantes(0);
      } finally {
        setLoading(false);
      }
    };

    cargarDatos();
  }, [user?.id]);

  // ==================== FUNCIONES DE STORAGE ====================

  const eliminarArchivosPorPrefijo = async (consejoId: number, prefijoNombre: string): Promise<void> => {
    const bucketName = 'censo_archivos';
    const folderPath = `${consejoId}/`;
    const { data, error } = await supabase.storage
      .from(bucketName)
      .list(folderPath, { limit: 100 });
    if (error) return;
    if (data && data.length) {
      const archivos = data
        .filter(item => item.name.startsWith(prefijoNombre))
        .map(item => `${folderPath}${item.name}`);
      if (archivos.length) await supabase.storage.from(bucketName).remove(archivos);
    }
  };

  const uploadExcelFile = async (file: File, nombreBase: string): Promise<string | null> => {
    if (!consejoId) return null;
    const filePath = `${consejoId}/${nombreBase}`;
    const { error } = await supabase.storage
      .from('censo_archivos')
      .upload(filePath, file, { upsert: true });
    if (error) {
      console.error('Error subiendo archivo Excel:', error.message);
      return null;
    }
    return filePath;
  };

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

  const deleteFileFromStorage = async (pathOrUrl: string | null): Promise<void> => {
    if (!pathOrUrl) return;
    const bucketName = 'censo_archivos';
    let relativePath = pathOrUrl;
    if (pathOrUrl.includes('http')) {
      const searchString = `/storage/v1/object/public/${bucketName}/`;
      const pathStart = pathOrUrl.indexOf(searchString);
      if (pathStart !== -1) {
        relativePath = pathOrUrl.substring(pathStart + searchString.length);
      }
    }
    relativePath = relativePath.startsWith('/') ? relativePath.substring(1) : relativePath;
    const { error } = await supabase.storage
      .from(bucketName)
      .remove([relativePath]);
    if (error) {
      console.error('Error eliminando archivo de censo del Storage:', error.message);
    }
  };

  // ==================== FUNCIÓN DE TRANSFERENCIA DE JEFATURA ====================
  const transferirJefatura = async (id_ficha: string, familiar: Familiar) => {
    if (!consejoId) return;

    try {
      const { data: fichaActual, error: fichaError } = await supabase
        .from('censo_fichas')
        .select('*')
        .eq('id_ficha', id_ficha)
        .single();

      if (fichaError || !fichaActual) {
        throw new Error('No se pudo obtener la ficha actual');
      }

      const { data: nuevaFicha, error: nuevaFichaError } = await supabase
        .from('censo_fichas')
        .insert({
          id_consejo: consejoId,
          nombres: familiar.nombreApellido.split(' ')[0] || '',
          apellidos: familiar.nombreApellido.split(' ').slice(1).join(' ') || '',
          cedula: familiar.cedula,
          edad: familiar.edad,
          fecha_nacimiento: familiar.fechaNacimiento,
          sexo: familiar.sexo,
          instruccion: familiar.instruccion,
          cne: familiar.cne,
          estado: fichaActual.estado,
          municipio: fichaActual.municipio,
          parroquia: fichaActual.parroquia,
          sector: fichaActual.sector,
          comunidad: fichaActual.comunidad,
          direccion: fichaActual.direccion,
          telefono: familiar.telefono || '',
          centro_votacion: familiar.centro_votacion || '',
          archivo_nombre: fichaActual.archivo_nombre,
          archivo_url: fichaActual.archivo_url,
          hoja_excel: fichaActual.hoja_excel,
          aguas_blancas: fichaActual.aguas_blancas,
          litro_tanque: fichaActual.litro_tanque,
          litro_pipote: fichaActual.litro_pipote,
          cantidad_pipote: fichaActual.cantidad_pipote,
          aguas_servidas: fichaActual.aguas_servidas,
          reco_basura: fichaActual.reco_basura,
          sistema_electrico: fichaActual.sistema_electrico,
          gas: fichaActual.gas,
          kg_bombona: fichaActual.kg_bombona,
          cantidad_bombonas: fichaActual.cantidad_bombonas,
          misiones: fichaActual.misiones
        })
        .select()
        .single();

      if (nuevaFichaError || !nuevaFicha) {
        throw new Error('No se pudo crear la nueva ficha');
      }

      const { data: familiaresActuales, error: familiaresError } = await supabase
        .from('censo_familiares')
        .select('*')
        .eq('id_ficha', id_ficha)
        .neq('numero', familiar.numero)
        .order('numero', { ascending: true });

      if (familiaresError) {
        throw new Error('No se pudieron obtener los familiares');
      }

      if (familiaresActuales && familiaresActuales.length > 0) {
        const nuevosFamiliares = familiaresActuales.map((fam: any, idx: number) => ({
          ...fam,
          id_ficha: nuevaFicha.id_ficha,
          numero: idx + 1
        }));
        delete (nuevosFamiliares as any).id;
        
        const { error: insertError } = await supabase
          .from('censo_familiares')
          .insert(nuevosFamiliares);
        
        if (insertError) {
          console.error('Error insertando familiares:', insertError);
        }
      }

      const fechaMigracion = new Date().toISOString().split('T')[0];
      const { error: updateError } = await supabase
        .from('censo_fichas')
        .update({
          migrado: true,
          fecha_migracion: fechaMigracion,
          motivo_migracion: 'Transferencia de jefatura por migración'
        })
        .eq('id_ficha', id_ficha);

      if (updateError) {
        throw new Error('No se pudo marcar la ficha antigua como migrada');
      }

      showAlert('Éxito', `La jefatura ha sido transferida a ${familiar.nombreApellido}`, 'success');
      
      const fichasActualizadas = await cargarFichasConFamiliares(consejoId);
      setFichas(fichasActualizadas);

    } catch (error: any) {
      console.error('Error en transferencia de jefatura:', error);
      showAlert('Error', error.message || 'No se pudo transferir la jefatura', 'danger');
    }
  };

  // ==================== FUNCIONES DE MIGRACIÓN ====================
  const marcarMigracion = async (id_ficha: string, tipo: 'jefe' | 'familiar', numero?: number) => {
    if (!consejoId) return;

    if (tipo === 'jefe') {
      const ficha = fichas.find(f => f.id_ficha === id_ficha);
      if (ficha) {
        const adultoDisponible = ficha.familiares.find(fam => 
          !fam.migrado && fam.edad >= 18
        );
        
        if (adultoDisponible) {
          showConfirm(
            'Transferencia de Jefatura',
            `El jefe de familia será marcado como migrado. ¿Deseas transferir la jefatura a ${adultoDisponible.nombreApellido} (${adultoDisponible.edad} años)?`,
            async () => {
              await transferirJefatura(id_ficha, adultoDisponible);
            }
          );
        } else {
          showPrompt(
            'Registrar Migración',
            'El jefe de familia será marcado como migrado. No hay familiares adultos disponibles para asumir la jefatura. Por favor, indica el motivo de la migración:',
            'Ejemplo: Se mudó a otra ciudad, Emigró del país, etc.',
            async (motivoMigracion) => {
              const fechaMigracion = new Date().toISOString().split('T')[0];
              
              const { error } = await supabase
                .from('censo_fichas')
                .update({
                  migrado: true,
                  fecha_migracion: fechaMigracion,
                  motivo_migracion: motivoMigracion
                })
                .eq('id_ficha', id_ficha);
              
              if (error) {
                showAlert('Error', 'No se pudo registrar la migración', 'danger');
              } else {
                showAlert('Éxito', 'Migración registrada correctamente', 'success');
                const fichasActualizadas = await cargarFichasConFamiliares(consejoId);
                setFichas(fichasActualizadas);
              }
              setModalMigracionOpen(null);
            }
          );
        }
      }
    } else {
      showPrompt(
        'Registrar Migración',
        '¿Cuál es el motivo de la migración de esta persona?',
        'Ejemplo: Se mudó a Caracas, Emigró del país, etc.',
        async (motivoMigracion) => {
          const fechaMigracion = new Date().toISOString().split('T')[0];
          
          const { error } = await supabase
            .from('censo_familiares')
            .update({
              migrado: true,
              fecha_migracion: fechaMigracion,
              motivo_migracion: motivoMigracion
            })
            .eq('id_ficha', id_ficha)
            .eq('numero', numero);
          
          if (error) {
            showAlert('Error', 'No se pudo registrar la migración', 'danger');
          } else {
            showAlert('Éxito', 'Migración registrada correctamente', 'success');
            const fichasActualizadas = await cargarFichasConFamiliares(consejoId);
            setFichas(fichasActualizadas);
          }
          setModalMigracionOpen(null);
        }
      );
    }
  };

  // ==================== FUNCIONES DE PROCESAMIENTO DE EXCEL ====================
  const esPlantillaValida = (rawData: any[][], inicioFila: number): boolean => {
    const fila7 = rawData[inicioFila + 6];
    const tieneNombres = fila7?.[0] || fila7?.[1] || fila7?.[2] || fila7?.[3];
    const tieneCedula = fila7?.[6] || fila7?.[7];
    return !!(tieneNombres || tieneCedula);
  };

  const eliminarFichaCompleta = async (idFicha: string) => {
    await supabase.from('censo_familiares').delete().eq('id_ficha', idFicha);
    await supabase.from('censo_fichas').delete().eq('id_ficha', idFicha);
  };

  const cargarFichasConFamiliares = async (idConsejo: number): Promise<FichaCensada[]> => {
    const { data: fichasData } = await supabase
      .from('censo_fichas')
      .select('*')
      .eq('id_consejo', idConsejo)
      .eq('migrado', false)
      .order('created_at', { ascending: false });

    if (!fichasData || fichasData.length === 0) return [];

    const fichasConFamiliares = await Promise.all(
      fichasData.map(async (ficha: any) => {
        const { data: familiaresData } = await supabase
          .from('censo_familiares')
          .select('*')
          .eq('id_ficha', ficha.id_ficha)
          .eq('migrado', false)
          .order('numero', { ascending: true });

        let ninos = 0, jovenes = 0, adultosMayores = 0, casosSalud = 0, migrantes = 0;
        
        const familiares: Familiar[] = (familiaresData || []).map((fam: any) => {
          const edad = fam.edad || 0;
          if (edad > 0 && edad <= 12) ninos++;
          else if (edad >= 13 && edad <= 29) jovenes++;
          else if (edad >= 60) adultosMayores++;
          
          const caracterizacionSalud = (fam.enfermedad || '').toString().trim().toLowerCase();
          if (caracterizacionSalud && caracterizacionSalud !== 'no aplica' && 
              caracterizacionSalud !== 'no' && caracterizacionSalud !== 'ninguna' && 
              caracterizacionSalud !== '') {
            casosSalud++;
          }

          return {
            numero: fam.numero || 0,
            nombreApellido: `${fam.nombre_familiar || ''} ${fam.apellido_familiar || ''}`.trim() || 'S/N',
            sexo: fam.sexo || 'S/D',
            cedula: fam.cedula || 'S/C',
            fechaNacimiento: fam.fecha_nacimiento || '',
            edad: edad,
            cne: fam.cne || 'S/D',
            discapacidad: fam.discapacidad || 'No',
            enfermedad: fam.enfermedad || 'No',
            parentesco: fam.parentesco || 'Otros',
            instruccion: fam.instruccion || 'S/D',
            oficio: fam.oficio || 'S/D',
            pensionado: fam.pensionado || 'No',
            centro_votacion: fam.centro_votacion || '',
            telefono: fam.telefono || '',
            migrado: fam.migrado || false,
            fecha_migracion: fam.fecha_migracion,
            motivo_migracion: fam.motivo_migracion
          };
        });

        const edadJefe = ficha.edad || 0;
        if (edadJefe > 0 && edadJefe <= 12) ninos++;
        else if (edadJefe >= 13 && edadJefe <= 29) jovenes++;
        else if (edadJefe >= 60) adultosMayores++;

        let misionesObj: Misiones | undefined = undefined;
        if (ficha.misiones) {
          if (typeof ficha.misiones === 'string') {
            try {
              misionesObj = JSON.parse(ficha.misiones);
            } catch(e) { console.error(e); }
          } else {
            misionesObj = ficha.misiones;
          }
        }

        let servicios: Servicios = {
          aguas_blancas: { acueducto: false, camion: false, pila_publica: false, rio: false, tanque: false, pipote: false, litro_tanque: 0, litro_pipote: 0, cantidad_pipote: 0 },
          aguas_servidas: { cloacas: false, pozo: false, septico: false, letrinas: false, aire_libre: false, depositada: false, otros: false },
          recoleccion_basura: { aseo: false, conteiner: false, bajante: false, camion: false, aire_libre: false, quemada: false },
          sistema_electrico: { publico: false, planta_electrica: false, no_tiene: false },
          gas: { bombona: false, tuberia: false, kg_10: 0, kg_18: 0, kg_43: 0 }
        };

        if (ficha.aguas_blancas) {
          try {
            const parsed = typeof ficha.aguas_blancas === 'string' ? JSON.parse(ficha.aguas_blancas) : ficha.aguas_blancas;
            servicios.aguas_blancas = { ...servicios.aguas_blancas, ...parsed };
          } catch(e) {}
        }
        if (ficha.aguas_servidas) {
          try {
            const parsed = typeof ficha.aguas_servidas === 'string' ? JSON.parse(ficha.aguas_servidas) : ficha.aguas_servidas;
            servicios.aguas_servidas = { ...servicios.aguas_servidas, ...parsed };
          } catch(e) {}
        }
        if (ficha.reco_basura) {
          try {
            const parsed = typeof ficha.reco_basura === 'string' ? JSON.parse(ficha.reco_basura) : ficha.reco_basura;
            servicios.recoleccion_basura = { ...servicios.recoleccion_basura, ...parsed };
          } catch(e) {}
        }
        if (ficha.sistema_electrico) {
          try {
            const parsed = typeof ficha.sistema_electrico === 'string' ? JSON.parse(ficha.sistema_electrico) : ficha.sistema_electrico;
            servicios.sistema_electrico = { ...servicios.sistema_electrico, ...parsed };
          } catch(e) {}
        }
        if (ficha.gas) {
          try {
            const parsed = typeof ficha.gas === 'string' ? JSON.parse(ficha.gas) : ficha.gas;
            servicios.gas = { ...servicios.gas, ...parsed };
          } catch(e) {}
        }

        let kg_bombona = { kg10: 0, kg18: 0, kg43: 0 };
        if (ficha.kg_bombona) {
          try {
            kg_bombona = typeof ficha.kg_bombona === 'string' ? JSON.parse(ficha.kg_bombona) : ficha.kg_bombona;
          } catch(e) {}
        }

        return {
          id_ficha: ficha.id_ficha,
          archivo_nombre: ficha.archivo_nombre,
          archivo_url: ficha.archivo_url,
          hoja_excel: ficha.hoja_excel,
          jefe: {
            nombres: ficha.nombres || '',
            apellidos: ficha.apellidos || '',
            cedula: ficha.cedula || '',
            edad: ficha.edad || 0,
            fechaNacimiento: ficha.fecha_nacimiento || '',
            sexo: ficha.sexo || '',
            instruccion: ficha.instruccion || '',
            cne: ficha.cne || '',
            discapacidad: ficha.discapacidad || null,
            pensionado: ficha.pensionado || null,
            enfermedad: ficha.enfermedad || null,
            telefono: ficha.telefono || '',
            centro_votacion: ficha.centro_votacion || '',
            oficio: ficha.oficio || '',
            trabajo_actual: ficha.trabaja_actualmente || '',
            migrado: ficha.migrado || false,
            fecha_migracion: ficha.fecha_migracion,
            motivo_migracion: ficha.motivo_migracion
          },
          ubicacion: {
            estado: ficha.estado || '',
            municipio: ficha.municipio || '',
            parroquia: ficha.parroquia || '',
            sector: ficha.sector || '',
            comunidad: ficha.comunidad || '',
            direccion: ficha.direccion || '',
          },
          familiares,
          indicadores: { ninos, jovenes, adultosMayores, casosSalud, migrantes },
          servicios,
          misiones: misionesObj,
          kg_bombona: kg_bombona,
          cantidad_bombonas: ficha.cantidad_bombonas || 0
        };
      })
    );
    return fichasConFamiliares;
  };

  const verificarCedulaExistente = async (cedula: string): Promise<{ existe: boolean; nombre?: string; idFicha?: string }> => {
    if (!consejoId || !cedula || cedula === 'S/C' || cedula === '_' || cedula.length < 5) {
      return { existe: false };
    }
    const { data: jefeData } = await supabase
      .from('censo_fichas')
      .select('id_ficha, nombres, apellidos, cedula')
      .eq('id_consejo', consejoId)
      .eq('cedula', cedula)
      .eq('migrado', false)
      .maybeSingle();
    if (jefeData) {
      return { existe: true, nombre: `${jefeData.nombres || ''} ${jefeData.apellidos || ''}`.trim(), idFicha: jefeData.id_ficha };
    }
    const { data: familiarData } = await supabase
      .from('censo_familiares')
      .select('nombre_familiar, apellido_familiar, cedula, id_ficha')
      .eq('cedula', cedula)
      .eq('migrado', false)
      .maybeSingle();
    if (familiarData) {
      return { existe: true, nombre: `${familiarData.nombre_familiar || ''} ${familiarData.apellido_familiar || ''}`.trim(), idFicha: familiarData.id_ficha };
    }
    return { existe: false };
  };

  const leerMisiones = (rawData: any[][], inicioFila: number): Misiones => {
    const fila34 = rawData[inicioFila + 33] || [];
    const tieneX = (fila: any[], col: number): number => {
      const valor = fila[col]?.toString().trim().toLowerCase();
      return valor === 'x' ? 1 : 0;
    };
    return {
      ribas: tieneX(fila34, 10),
      sucre: tieneX(fila34, 12),
      vuelvaCaras: tieneX(fila34, 14),
      identidad: tieneX(fila34, 16),
      barrioAdentro: tieneX(fila34, 18),
      mercal: tieneX(fila34, 20),
      ezequiel: tieneX(fila34, 22),
      otras: tieneX(fila34, 24)
    };
  };

  const leerServicios = (rawData: any[][], inicioFila: number): Servicios => {
    const fila25 = rawData[inicioFila + 24] || [];
    const fila28 = rawData[inicioFila + 27] || [];
    const fila31 = rawData[inicioFila + 30] || [];
    const fila34 = rawData[inicioFila + 33] || [];

    const tieneX = (fila: any[], col: number): boolean => {
      const valor = fila[col]?.toString().trim().toLowerCase();
      return valor === 'x';
    };

    const aguas_blancas = {
      acueducto: tieneX(fila25, 0),
      camion: tieneX(fila25, 3),
      pila_publica: tieneX(fila25, 5),
      rio: tieneX(fila25, 7),
      tanque: tieneX(fila25, 9),
      pipote: tieneX(fila25, 14),
      litro_tanque: parseFloat(fila25[12]?.toString().trim()) || 0,
      litro_pipote: parseFloat(fila25[16]?.toString().trim()) || 0,
      cantidad_pipote: parseInt(fila25[18]?.toString().trim()) || 0
    };

    const aguas_servidas = {
      cloacas: tieneX(fila28, 0),
      pozo: tieneX(fila28, 2),
      septico: tieneX(fila28, 4),
      letrinas: tieneX(fila28, 6),
      aire_libre: tieneX(fila28, 8),
      depositada: tieneX(fila28, 10),
      otros: tieneX(fila28, 12)
    };

    const reco_basura = {
      aseo: tieneX(fila28, 15),
      conteiner: tieneX(fila28, 17),
      bajante: tieneX(fila28, 19),
      camion: tieneX(fila28, 21),
      aire_libre: tieneX(fila28, 23),
      quemada: tieneX(fila28, 25)
    };

    const sistema_electrico = {
      publico: tieneX(fila34, 0),
      planta_electrica: tieneX(fila34, 2),
      no_tiene: tieneX(fila34, 4)
    };

    const gas = {
      bombona: tieneX(fila31, 0),
      tuberia: tieneX(fila31, 9),
      kg_10: parseFloat(fila31[4]?.toString().trim()) || 0,
      kg_18: parseFloat(fila31[6]?.toString().trim()) || 0,
      kg_43: parseFloat(fila31[8]?.toString().trim()) || 0
    };

    return {
      aguas_blancas,
      aguas_servidas,
      recoleccion_basura: reco_basura,
      sistema_electrico,
      gas
    };
  };

  // ==================== FUNCIÓN GUARDAR FICHA (CORREGIDA) ====================
  const guardarFicha = async (
    rawData: any[][],
    inicioFila: number,
    hoja: string,
    fileName: string,
    fileUrl: string | null,
    overwrite: boolean = false
  ): Promise<FichaCensada | null> => {
    if (!consejoId) return null;

    try {
      const fila7 = rawData[inicioFila + 6] || [];
      const fila9 = rawData[inicioFila + 8] || [];
      const fila10 = rawData[inicioFila + 9] || [];

      const nombresJefe = leerCeldasCombinadas(fila7, 0, 1);
      const apellidosJefe = leerCeldasCombinadas(fila7, 2, 3);
      const cedulaJefe = leerCeldasCombinadas(fila7, 6, 7).replace(/[^0-9]/g, '');
      const sexo = leerCeldasCombinadas(fila7, 4, 5);
      const fechaRaw = leerCeldasCombinadas(fila7, 8, 9);
      const fechaNacimiento = parseFecha(fechaRaw);
      const edadTexto = leerCeldasCombinadas(fila7, 10, 11);
      const edadJefe = parseInt(edadTexto) || 0;
      const cne = leerCeldasCombinadas(fila7, 12, 13);
      const centroVotacion = leerCeldasCombinadas(fila7, 14, 17);
      const instruccion = leerCeldasCombinadas(fila7, 20, 21);
      const oficio = leerCeldasCombinadas(fila7, 22, 23);
      const trabajoActual = leerCeldasCombinadas(fila7, 24, 26);
      const telefonoJefe = leerCeldasCombinadas(fila9, 4, 5);

      // --- LECTURA CORREGIDA DE DISCAPACIDAD Y PENSIONADO ---
      // Discapacidad: texto libre en columnas S-T (índices 18,19) sin limpiar
      const discapacidadRaw = leerCeldasRaw(fila7, 18, 19);
      const discapacidad = discapacidadRaw || null;

      // Pensionado: texto en columnas C-D (índices 2,3) con detección de Sí/No/X
      const pensionadoRaw = leerCeldasRaw(fila9, 2, 3);
      let pensionado = null;
      if (pensionadoRaw) {
        const lower = pensionadoRaw.toLowerCase();
        if (lower.includes('sí') || lower.includes('si') || lower === 'x') {
          pensionado = 'Sí';
        } else if (lower.includes('no') || lower === 'n') {
          pensionado = 'No';
        } else {
          // Si no se detecta, se puede guardar el texto original o null
          // Lo dejamos como null para no llenar con valores no esperados
          // pero si se quiere conservar, se puede asignar pensionadoRaw
          pensionado = null;
        }
      }

      // Enfermedad: texto en fila 9 columnas A-B (índices 0,1) usando limpieza estándar
      const enfermedad = leerCeldasCombinadas(fila9, 0, 1);

      const fila3 = rawData[inicioFila + 2] || [];
      const estado = leerCeldasCombinadas(fila3, 2, 4);
      const municipio = leerCeldasCombinadas(fila3, 7, 9);
      const parroquia = leerCeldasCombinadas(fila3, 12, 14);
      const sector = leerCeldasCombinadas(fila3, 17, 19);
      const comunidad = leerCeldasCombinadas(rawData[inicioFila + 3] || [], 2, 4);
      const direccion = leerCeldasCombinadas(rawData[inicioFila + 3] || [], 7, 23);

      const servicios = leerServicios(rawData, inicioFila);
      const misiones = leerMisiones(rawData, inicioFila);

      const fila31 = rawData[inicioFila + 30] || [];
      const kg10 = parseFloat(fila31[4]?.toString().trim()) || 0;
      const kg18 = parseFloat(fila31[6]?.toString().trim()) || 0;
      const kg43 = parseFloat(fila31[8]?.toString().trim()) || 0;
      const cantidadBombonas = kg10 + kg18 + kg43;
      const kgBombona = { kg10, kg18, kg43 };

      const litro_tanque = servicios.aguas_blancas.litro_tanque || 0;
      const litro_pipote = servicios.aguas_blancas.litro_pipote || 0;
      const cantidad_pipote = servicios.aguas_blancas.cantidad_pipote || 0;

      if (!overwrite) {
        const existente = await verificarCedulaExistente(cedulaJefe);
        if (existente.existe) {
          throw new Error(`La cédula ${cedulaJefe} del jefe ${nombresJefe} ${apellidosJefe} ya se encuentra registrada (${existente.nombre}). Usa la opción de sobrescribir si deseas actualizar.`);
        }
      } else {
        const existente = await verificarCedulaExistente(cedulaJefe);
        if (existente.existe && existente.idFicha) {
          await eliminarFichaCompleta(existente.idFicha);
        }
      }

      const { data: fichaData, error: fichaError } = await supabase
        .from('censo_fichas')
        .insert({
          id_consejo: consejoId,
          nombres: nombresJefe,
          apellidos: apellidosJefe,
          cedula: cedulaJefe,
          edad: edadJefe,
          fecha_nacimiento: fechaNacimiento,
          sexo: sexo,
          instruccion: instruccion,
          cne: cne,
          estado, municipio, parroquia, sector, comunidad, direccion,
          discapacidad: discapacidad,
          pensionado: pensionado,
          enfermedad: enfermedad,
          telefono: telefonoJefe,
          centro_votacion: centroVotacion,
          oficio: oficio,
          trabaja_actualmente: trabajoActual,
          archivo_nombre: fileName,
          archivo_url: fileUrl,
          hoja_excel: hoja,
          aguas_blancas: JSON.stringify(servicios.aguas_blancas),
          aguas_servidas: JSON.stringify(servicios.aguas_servidas),
          reco_basura: JSON.stringify(servicios.recoleccion_basura),
          sistema_electrico: JSON.stringify(servicios.sistema_electrico),
          gas: JSON.stringify(servicios.gas),
          kg_bombona: JSON.stringify(kgBombona),
          cantidad_bombonas: cantidadBombonas,
          litro_tanque: litro_tanque,
          litro_pipote: litro_pipote,
          cantidad_pipote: cantidad_pipote,
          misiones: misiones
        })
        .select()
        .single();

      if (fichaError || !fichaData) {
        console.error('Error guardando ficha:', fichaError);
        return null;
      }

      // Familiares (sin cambios)
      const familiares: any[] = [];
      let casosSalud = 0;
      for (let i = inicioFila + 11; i <= inicioFila + 20; i++) {
        const fila = rawData[i];
        if (!fila) continue;
        const numero = i - (inicioFila + 11) + 1;
        if (numero > 10) break;
        const nombreFamiliar = leerCeldasCombinadas(fila, 0, 1);
        const apellidoFamiliar = leerCeldasCombinadas(fila, 2, 3);
        if (!nombreFamiliar || nombreFamiliar === 'S/D') continue;
        const sexo = fila[4]?.toString().trim() || 'S/D';
        const cedulaFamiliar = (fila[6]?.toString().trim() || '_').replace(/[^0-9]/g, '');
        const fechaRawFamiliar = fila[8]?.toString().trim() || '';
        const fecha_nacimiento = parseFecha(fechaRawFamiliar);
        const edadTextoFamiliar = fila[10]?.toString().trim() || '0';
        const edad = parseInt(edadTextoFamiliar) || 0;
        const cne = fila[12]?.toString().trim() || null;
        const centroVotacionF = fila[14]?.toString().trim() || null;
        const discapacidadF = fila[16]?.toString().trim() || 'no';
        const enfermedadF = fila[18]?.toString().trim() || '';
        const instruccionF = fila[20]?.toString().trim() || null;
        const oficioF = leerCeldasCombinadas(fila, 22, 23) || null;
        const trabajoF = leerCeldasCombinadas(fila, 24, 25) || null;
        const pensionadoF = leerCeldasCombinadas(fila, 11, 11) || 'no';
        const telefonoFamiliar = leerCeldasCombinadas(fila, 26, 27) || '';

        const caracterizacionSalud = enfermedadF.toLowerCase();
        if (caracterizacionSalud && caracterizacionSalud !== 'no aplica' && 
            caracterizacionSalud !== 'no' && caracterizacionSalud !== 'ninguna' && 
            caracterizacionSalud !== '') {
          casosSalud++;
        }

        familiares.push({
          id_ficha: fichaData.id_ficha,
          numero,
          nombre_familiar: nombreFamiliar,
          apellido_familiar: apellidoFamiliar || null,
          sexo,
          cedula: cedulaFamiliar,
          fecha_nacimiento,
          edad,
          cne,
          centro_votacion: centroVotacionF,
          discapacidad: discapacidadF.toLowerCase() === 'si' ? 'Sí' : 'No',
          enfermedad: enfermedadF,
          instruccion: instruccionF,
          oficio: oficioF,
          trabajo_a: trabajoF,
          pensionado: pensionadoF.toLowerCase() === 'si' ? 'Sí' : 'No',
          telefono: telefonoFamiliar
        });
      }

      if (familiares.length > 0) {
        const { error: familiaresError } = await supabase
          .from('censo_familiares')
          .insert(familiares)
          .select();
        if (familiaresError) console.error('Error guardando familiares:', familiaresError);
      }

      let ninos = 0, jovenes = 0, adultosMayores = 0;
      if (edadJefe > 0 && edadJefe <= 12) ninos++;
      else if (edadJefe >= 13 && edadJefe <= 29) jovenes++;
      else if (edadJefe >= 60) adultosMayores++;

      return {
        id_ficha: fichaData.id_ficha,
        archivo_nombre: fileName,
        archivo_url: fileUrl,
        hoja_excel: hoja,
        jefe: {
          nombres: nombresJefe,
          apellidos: apellidosJefe,
          cedula: cedulaJefe,
          edad: edadJefe,
          fechaNacimiento,
          sexo,
          instruccion,
          cne,
          discapacidad: discapacidad,
          pensionado: pensionado,
          enfermedad: enfermedad,
          telefono: telefonoJefe,
          centro_votacion: centroVotacion,
          oficio,
          trabajo_actual: trabajoActual,
          migrado: false,
        },
        ubicacion: { estado, municipio, parroquia, sector, comunidad, direccion },
        familiares: familiares.map(f => ({
          numero: f.numero,
          nombreApellido: `${f.nombre_familiar} ${f.apellido_familiar || ''}`.trim(),
          sexo: f.sexo,
          cedula: f.cedula,
          fechaNacimiento: f.fecha_nacimiento || '',
          edad: f.edad,
          cne: f.cne || 'S/D',
          discapacidad: f.discapacidad || 'No',
          enfermedad: f.enfermedad || 'No Aplica',
          instruccion: f.instruccion || 'S/D',
          oficio: f.oficio || 'S/D',
          pensionado: f.pensionado || 'No',
          centro_votacion: f.centro_votacion,
          telefono: f.telefono,
          migrado: false,
        })),
        indicadores: { ninos, jovenes, adultosMayores, casosSalud, migrantes: 0 },
        servicios,
        misiones,
        kg_bombona: kgBombona,
        cantidad_bombonas: cantidadBombonas
      };

    } catch (error: any) {
      console.error('Error en guardarFicha:', error);
      throw error;
    }
  };

  const preValidarArchivo = async (
    file: File,
    workbook: XLSX.WorkBook
  ): Promise<{ valido: boolean; mensaje?: string; cedulasDuplicadas?: Array<{cedula: string; nombre: string}> }> => {
    const cedulasConflictivas: { cedula: string; nombre: string }[] = [];

    for (const sheetName of workbook.SheetNames) {
      const sheet = workbook.Sheets[sheetName];
      const rawData: any[][] = XLSX.utils.sheet_to_json(sheet, { header: 1 });
      if (rawData.length < 48) continue;

      let inicioActual = 0;
      while (inicioActual + 47 < rawData.length) {
        if (esPlantillaValida(rawData, inicioActual)) {
          const cedulaJefe = leerCeldasCombinadas(rawData[inicioActual + 6] || [], 6, 7).replace(/[^0-9]/g, '');
          if (cedulaJefe && cedulaJefe.length >= 5) {
            const existente = await verificarCedulaExistente(cedulaJefe);
            if (existente.existe) {
              const nombreJefe = `${leerCeldasCombinadas(rawData[inicioActual + 6] || [], 0, 1)} ${leerCeldasCombinadas(rawData[inicioActual + 7] || [], 0, 1)}`.trim();
              cedulasConflictivas.push({ cedula: cedulaJefe, nombre: nombreJefe });
            }
          }
        }
        inicioActual += 49;
      }
    }

    if (cedulasConflictivas.length > 0) {
      const primer = cedulasConflictivas[0];
      return {
        valido: false,
        mensaje: `El señor/a ${primer.nombre} C.I ${primer.cedula} ya se encuentra registrado en el censo. ¿Deseas sobrescribir TODAS las fichas duplicadas detectadas?`,
        cedulasDuplicadas: cedulasConflictivas
      };
    }
    return { valido: true };
  };

  const procesarArchivo = async (file: File, overwrite: boolean = false): Promise<{ fichas: FichaCensada[], error?: string }> => {
    const data = await file.arrayBuffer();
    const workbook = XLSX.read(data, { type: 'array' });
    let primeraCedula = '';
    let totalJefes = 0;
    const fichasTmp: { rawData: any[][], inicio: number, hoja: string }[] = [];

    for (const sheetName of workbook.SheetNames) {
      const sheet = workbook.Sheets[sheetName];
      const rawData: any[][] = XLSX.utils.sheet_to_json(sheet, { header: 1 });
      if (rawData.length < 48) continue;
      let inicioActual = 0;
      while (inicioActual + 47 < rawData.length) {
        if (esPlantillaValida(rawData, inicioActual)) {
          const cedulaJefe = leerCeldasCombinadas(rawData[inicioActual + 6] || [], 6, 7).replace(/[^0-9]/g, '');
          if (cedulaJefe) {
            if (primeraCedula === '') primeraCedula = cedulaJefe;
            totalJefes++;
            fichasTmp.push({ rawData, inicio: inicioActual, hoja: sheetName });
          }
        }
        inicioActual += 49;
      }
    }

    if (primeraCedula === '') {
      return { fichas: [], error: 'No se encontraron jefes de familia válidos en el archivo' };
    }

    const nombreBase = totalJefes > 1 ? `censo_${primeraCedula}_mult.xlsx` : `censo_${primeraCedula}.xlsx`;
    if (consejoId === null) {
      return { fichas: [], error: 'ID del consejo no disponible' };
    }

    if (overwrite) {
      await eliminarArchivosPorPrefijo(consejoId, `censo_${primeraCedula}`);
    }

    const fileUrl = await uploadExcelFile(file, nombreBase);
    if (!fileUrl) {
      return { fichas: [], error: 'Error al subir el archivo al servidor' };
    }

    const fichasEncontradas: FichaCensada[] = [];
    for (const tmp of fichasTmp) {
      try {
        const ficha = await guardarFicha(tmp.rawData, tmp.inicio, tmp.hoja, file.name, fileUrl, overwrite);
        if (ficha) fichasEncontradas.push(ficha);
      } catch (err: any) {
        console.error('Error guardando ficha:', err);
      }
    }
    return { fichas: fichasEncontradas };
  };

  const handleMultipleUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || files.length === 0 || !consejoId) return;

    setIsProcessing(true);
    let fichasExitosas = 0;
    let totalErrores = 0;

    try {
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const data = await file.arrayBuffer();
        const workbook = XLSX.read(data, { type: 'array' });
        const validacion = await preValidarArchivo(file, workbook);
        if (!validacion.valido) {
          const confirmar = () => new Promise<void>((resolve) => {
            showConfirm(
              'Fichas duplicadas',
              validacion.mensaje + '\n¿Deseas sobrescribir las fichas existentes?',
              async () => {
                const resultado = await procesarArchivo(file, true);
                if (resultado.error) {
                  showAlert('Error', `Error en ${file.name}: ${resultado.error}`, 'danger');
                  totalErrores++;
                } else {
                  fichasExitosas += resultado.fichas.length;
                }
                resolve();
              }
            );
          });
          await confirmar();
        } else {
          const resultado = await procesarArchivo(file, false);
          if (resultado.error) {
            showAlert('Error', `Error en ${file.name}: ${resultado.error}`, 'danger');
            totalErrores++;
          } else {
            fichasExitosas += resultado.fichas.length;
          }
        }
      }

      if (fichasExitosas > 0 || totalErrores > 0) {
        showAlert(
          'Procesamiento completado',
          `✓ ${fichasExitosas} fichas guardadas exitosamente\n✗ ${totalErrores} archivos con errores`,
          'success'
        );
      }

      const fichasActualizadas = await cargarFichasConFamiliares(consejoId);
      setFichas(fichasActualizadas);

    } catch (error) {
      console.error('Error en upload masivo:', error);
      showAlert('Error', 'Error general en el procesamiento masivo', 'danger');
    } finally {
      setIsProcessing(false);
      event.target.value = '';
    }
  };

  const handleDelete = async (ficha: FichaCensada) => {
    showConfirm(
      'Confirmar eliminación',
      `¿Estás seguro de eliminar la ficha de ${ficha.jefe.nombres} ${ficha.jefe.apellidos}?`,
      async () => {
        try {
          await eliminarFichaCompleta(ficha.id_ficha);
          if (ficha.archivo_url) await deleteFileFromStorage(ficha.archivo_url);
          if (consejoId) {
            const fichasActualizadas = await cargarFichasConFamiliares(consejoId);
            setFichas(fichasActualizadas);
            showAlert('Eliminado', 'Ficha eliminada correctamente', 'success');
          }
        } catch (error) {
          console.error('Error al eliminar:', error);
          showAlert('Error', 'Ocurrió un error al eliminar la ficha', 'danger');
        }
      }
    );
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
    generarPDF(filteredFichas, nombreConsejo);
  };

  // ==================== CÁLCULOS Y FILTROS ====================
  const globales = useMemo(() => {
    const totalFamilias = fichas.length;
    let totalBombonas = 0;
    let totalMisiones = 0;
    let totalAguasBlancas: { [key: string]: number } = { acueducto: 0, camion: 0, pila_publica: 0, rio: 0, tanque: 0, pipote: 0 };
    let totalAguasServidas: { [key: string]: number } = { cloacas: 0, pozo: 0, septico: 0, letrinas: 0, aire_libre: 0, depositada: 0, otros: 0 };
    let totalRecoBasura: { [key: string]: number } = { aseo: 0, conteiner: 0, bajante: 0, camion: 0, aire_libre: 0, quemada: 0 };
    let totalSistemaElectrico: { [key: string]: number } = { publico: 0, planta_electrica: 0, no_tiene: 0 };
    let totalGas: { [key: string]: number } = { bombona: 0, tuberia: 0 };
    
    fichas.forEach(f => {
      if (f.cantidad_bombonas > 0) totalBombonas += f.cantidad_bombonas;
      if (f.misiones) {
        totalMisiones += (f.misiones.ribas + f.misiones.ezequiel + f.misiones.sucre + 
                          f.misiones.vuelvaCaras + f.misiones.identidad + 
                          f.misiones.barrioAdentro + f.misiones.mercal + (f.misiones.otras || 0));
      }
      const ab = f.servicios.aguas_blancas;
      if (ab.acueducto) totalAguasBlancas.acueducto++;
      if (ab.camion) totalAguasBlancas.camion++;
      if (ab.pila_publica) totalAguasBlancas.pila_publica++;
      if (ab.rio) totalAguasBlancas.rio++;
      if (ab.tanque) totalAguasBlancas.tanque++;
      if (ab.pipote) totalAguasBlancas.pipote++;
      
      const as = f.servicios.aguas_servidas;
      if (as.cloacas) totalAguasServidas.cloacas++;
      if (as.pozo) totalAguasServidas.pozo++;
      if (as.septico) totalAguasServidas.septico++;
      if (as.letrinas) totalAguasServidas.letrinas++;
      if (as.aire_libre) totalAguasServidas.aire_libre++;
      if (as.depositada) totalAguasServidas.depositada++;
      if (as.otros) totalAguasServidas.otros++;
      
      const rb = f.servicios.recoleccion_basura;
      if (rb.aseo) totalRecoBasura.aseo++;
      if (rb.conteiner) totalRecoBasura.conteiner++;
      if (rb.bajante) totalRecoBasura.bajante++;
      if (rb.camion) totalRecoBasura.camion++;
      if (rb.aire_libre) totalRecoBasura.aire_libre++;
      if (rb.quemada) totalRecoBasura.quemada++;
      
      const se = f.servicios.sistema_electrico;
      if (se.publico) totalSistemaElectrico.publico++;
      if (se.planta_electrica) totalSistemaElectrico.planta_electrica++;
      if (se.no_tiene) totalSistemaElectrico.no_tiene++;
      
      const gas = f.servicios.gas;
      if (gas.bombona) totalGas.bombona++;
      if (gas.tuberia) totalGas.tuberia++;
    });
    
    const totalHabitantes = fichas.reduce((acc, curr) => acc + 1 + curr.familiares.length, 0);
    const totalPersonasHistoricas = totalHabitantes + totalMigrantes;
    const tasaMigracion = totalPersonasHistoricas > 0 ? ((totalMigrantes / totalPersonasHistoricas) * 100).toFixed(1) : '0';
    
    return {
      habitantes: totalHabitantes,
      ninos: fichas.reduce((acc, curr) => acc + curr.indicadores.ninos, 0),
      jovenes: fichas.reduce((acc, curr) => acc + curr.indicadores.jovenes, 0),
      abuelos: fichas.reduce((acc, curr) => acc + curr.indicadores.adultosMayores, 0),
      salud: fichas.reduce((acc, curr) => acc + curr.indicadores.casosSalud, 0),
      familias: totalFamilias,
      bombonas: totalBombonas,
      misionesTotal: totalMisiones,
      tasaMigracion: `${tasaMigracion}% (${totalMigrantes} personas)`,
      servicios: {
        aguasBlancas: totalAguasBlancas,
        aguasServidas: totalAguasServidas,
        recoBasura: totalRecoBasura,
        sistemaElectrico: totalSistemaElectrico,
        gas: totalGas
      }
    };
  }, [fichas, totalMigrantes]);

  const filteredFichas = useMemo(() => {
    const term = searchTerm.toLowerCase().trim();
    if (!term) return fichas;
    
    return fichas.filter(f => {
      if (f.jefe.nombres.toLowerCase().includes(term) ||
          f.jefe.apellidos.toLowerCase().includes(term) ||
          f.jefe.cedula.includes(term) ||
          (f.jefe.telefono && f.jefe.telefono.includes(term))) {
        return true;
      }
      return f.familiares.some(fam => 
        fam.nombreApellido.toLowerCase().includes(term) ||
        fam.cedula.includes(term) ||
        (fam.telefono && fam.telefono.includes(term))
      );
    });
  }, [fichas, searchTerm]);

  const totalPages = Math.ceil(filteredFichas.length / ITEMS_PER_PAGE);
  const paginatedFichas = filteredFichas.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE);
  useEffect(() => setCurrentPage(1), [searchTerm]);

  if (loading) {
    return <div className="flex justify-center p-12"><Loader2 className="animate-spin text-brand-primary h-8 w-8" /></div>;
  }

  if (noConsejo) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center p-8 bg-white rounded-3xl border border-gray-100 shadow-sm">
        <div className="h-20 w-20 rounded-full bg-amber-100 flex items-center justify-center mb-6">
          <AlertCircle className="h-10 w-10 text-amber-600" />
        </div>
        <h3 className="text-xl font-black text-slate-800 uppercase tracking-tighter mb-2">
          Aún no has registrado tu Consejo Comunal
        </h3>
        <p className="text-slate-500 max-w-md mb-8">
          Para acceder al censo poblacional, primero debes completar los datos legales de tu consejo comunal.
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
    <div className="max-w-7xl mx-auto space-y-4 p-4 font-sans min-h-screen">
      {/* Cabecera */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-3">
        <div>
          <h2 className="text-xl font-black text-slate-800 italic uppercase tracking-tighter flex items-center gap-2">
            <Shield className="h-5 w-5 text-indigo-600" /> Censo Poblacional
          </h2>
          <p className="text-[9px] text-slate-400 font-bold uppercase tracking-[0.15em]">Procesamiento masivo de fichas</p>
        </div>
        <div className="flex gap-2">
          <input type="file" id="bulk-upload" className="hidden" multiple accept=".xlsx,.xls" onChange={handleMultipleUpload} />
          <label htmlFor="bulk-upload" className="flex items-center gap-1.5 px-4 py-2 bg-slate-800 text-white text-[9px] font-black uppercase tracking-wider rounded-xl hover:bg-indigo-600 cursor-pointer transition-all shadow-md">
            {isProcessing ? <Clock className="h-3.5 w-3.5 animate-spin" /> : <Upload className="h-3.5 w-3.5" />}
            {isProcessing ? 'Procesando...' : 'Cargar Fichas'}
          </label>
          <button onClick={descargarPlantilla} className="flex items-center gap-1.5 px-4 py-2 bg-brand-primary text-white text-[9px] font-black uppercase tracking-wider rounded-xl hover:bg-emerald-700 cursor-pointer transition-all shadow-md">
            <Download className="h-3.5 w-3.5" /> Plantilla
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
        <StatCard icon={<Flame />} label="Bombonas Gas" value={globales.bombonas} color="emerald" />
        <StatCard icon={<GraduationCap />} label="Misiones" value={globales.misionesTotal} color="emerald" onClick={() => setModalMisionesOpen(true)} />
        <StatCard icon={<LogOut />} label="Tasa Migración" value={globales.tasaMigracion} color="rose" />
        <StatCard icon={<Droplets />} label="Servicios" value="Ver" color="emerald" onClick={() => setModalServiciosOpen(true)} />
      </div>

      {/* Tabla principal */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-md overflow-hidden">
        <div className="p-4 border-b border-slate-50">
          <div className="flex flex-col lg:flex-row gap-3 items-start lg:items-center justify-between">
            <h3 className="text-[10px] font-black uppercase text-slate-400 tracking-wider">
              Jefes de Familia ({filteredFichas.length})
            </h3>
            <div className="flex gap-2 lg:w-80">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-3 w-3 text-slate-400" />
                <input 
                  type="text" 
                  placeholder="Buscar por nombre, cédula o teléfono..." 
                  value={searchTerm} 
                  onChange={(e) => setSearchTerm(e.target.value)} 
                  className="w-full pl-8 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs focus:ring-1 focus:ring-indigo-500" 
                />
              </div>
              <button onClick={handleDownloadPDF} disabled={filteredFichas.length === 0} className="flex items-center gap-1 px-3 py-2 bg-red-600 text-white text-[9px] font-black uppercase tracking-wider rounded-lg hover:bg-red-700 disabled:bg-red-300">
                <FileText className="h-3 w-3" /> PDF
              </button>
            </div>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-slate-50/50">
                <th className="p-3 text-[8px] font-black uppercase text-slate-500 w-40">Jefe de Familia</th>
                <th className="p-3 text-[8px] font-black uppercase text-slate-500">Cédula</th>
                <th className="p-3 text-[8px] font-black uppercase text-slate-500">Edad</th>
                <th className="p-3 text-[8px] font-black uppercase text-slate-500">Sexo</th>
                <th className="p-3 text-[8px] font-black uppercase text-slate-500">Teléfono</th>
                <th className="p-3 text-[8px] font-black uppercase text-slate-500">Carga Familiar</th>
                <th className="p-3 text-[8px] font-black uppercase text-slate-500 text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {paginatedFichas.map((ficha) => (
                <tr key={ficha.id_ficha} className="hover:bg-indigo-50/30 transition-colors">
                  <td className="p-3">
                    <div className="flex flex-col space-y-0.5">
                      <span className="text-[11px] font-black text-slate-700 uppercase italic flex items-center gap-1">
                        {ficha.jefe.nombres} {ficha.jefe.apellidos}
                      </span>
                      <div className="flex items-center gap-1 text-[8px] text-slate-400 font-bold">
                        <FileText className="h-2 w-2" />
                        <span>{ficha.archivo_nombre}</span>
                      </div>
                    </div>
                  </td>
                  <td className="p-3 text-[11px] font-bold text-slate-600 font-mono">{ficha.jefe.cedula}</td>
                  <td className="p-3 text-[11px] font-bold text-slate-600">{ficha.jefe.edad} años</td>
                  <td className="p-3"><span className="text-[11px] font-bold text-slate-600">{ficha.jefe.sexo}</span></td>
                  <td className="p-3"><span className="text-[11px] font-bold text-slate-600">{ficha.jefe.telefono || 'S/D'}</span></td>
                  <td className="p-3">
                    <button onClick={() => setModalFamiliarOpen(ficha.id_ficha)} className="flex items-center gap-1 px-2 py-1 bg-indigo-50 rounded-lg hover:bg-indigo-100 text-[9px] font-black uppercase">
                      <Users2 className="h-2.5 w-2.5" /> {ficha.familiares.length} Personas
                    </button>
                  </td>
                  <td className="p-3 text-right">
                    <div className="flex justify-end gap-1.5">
                      <button onClick={() => setModalDocumentOpen(ficha.id_ficha)} className="p-1 bg-blue-50 text-blue-700 hover:bg-blue-100 rounded-lg"><Eye className="h-2.5 w-2.5" /></button>
                      <button onClick={() => handleDownloadExcel(ficha.archivo_url, ficha.archivo_nombre)} className="p-1 bg-emerald-50 text-emerald-600 hover:bg-emerald-100 rounded-lg"><DownloadCloud className="h-2.5 w-2.5" /></button>
                      <button onClick={() => handleDelete(ficha)} className="p-1 bg-rose-50 text-rose-600 hover:bg-rose-100 rounded-lg"><Trash2 className="h-2.5 w-2.5" /></button>
                    </div>
                  </td>
                </tr>
              ))}
              {paginatedFichas.length === 0 && (
                <tr>
                  <td colSpan={7} className="p-12 text-center">
                    <Users2 className="h-12 w-12 text-slate-300 mx-auto mb-3" />
                    <h3 className="text-lg font-black text-slate-500 mb-1">
                      {searchTerm ? 'No se encontraron resultados' : 'No hay fichas registradas'}
                    </h3>
                    <p className="text-slate-400 text-sm">
                      {searchTerm ? `No se encontraron personas con "${searchTerm}"` : 'Carga tus primeras fichas para comenzar (soporta múltiples plantillas por archivo)'}
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
              <div className="flex items-center gap-0.5">
                <button onClick={() => setCurrentPage(p => Math.max(1, p-1))} disabled={currentPage === 1} className="px-2 py-1 text-[10px] font-bold text-slate-500 hover:text-slate-700 disabled:text-slate-300">Anterior</button>
                {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                  <button key={page} onClick={() => setCurrentPage(page)} className={cn("w-7 h-7 rounded-lg text-[10px] font-bold transition-all flex items-center justify-center", currentPage === page ? "bg-indigo-600 text-white" : "text-slate-500 hover:text-slate-700 hover:bg-slate-200")}>{page}</button>
                ))}
                <button onClick={() => setCurrentPage(p => Math.min(totalPages, p+1))} disabled={currentPage === totalPages} className="px-2 py-1 text-[10px] font-bold text-slate-500 hover:text-slate-700 disabled:text-slate-300">Siguiente</button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Modales (sin cambios estructurales) */}
      <AnimatePresence>
        {modalMisionesOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setModalMisionesOpen(false)} className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" />
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="relative w-full max-w-md bg-white rounded-2xl shadow-2xl overflow-hidden">
              <div className="p-5 border-b border-gray-50 flex justify-between items-center">
                <h4 className="text-base font-black text-slate-800 italic flex items-center gap-2"><GraduationCap className="h-5 w-5 text-indigo-600" /> Misiones y Formación</h4>
                <button onClick={() => setModalMisionesOpen(false)} className="p-1 rounded-lg hover:bg-gray-100"><X className="h-4 w-4 text-slate-400" /></button>
              </div>
              <div className="p-5 space-y-3">
                {(() => {
                  const totales = fichas.reduce((acc, f) => {
                    if (f.misiones) {
                      acc.ribas += f.misiones.ribas;
                      acc.ezequiel += f.misiones.ezequiel;
                      acc.sucre += f.misiones.sucre;
                      acc.vuelvaCaras += f.misiones.vuelvaCaras;
                      acc.identidad += f.misiones.identidad;
                      acc.barrioAdentro += f.misiones.barrioAdentro;
                      acc.mercal += f.misiones.mercal;
                      acc.otras += f.misiones.otras || 0;
                    }
                    return acc;
                  }, { ribas: 0, ezequiel: 0, sucre: 0, vuelvaCaras: 0, identidad: 0, barrioAdentro: 0, mercal: 0, otras: 0 });
                  return (
                    <>
                      <div className="flex justify-between py-2 border-b border-slate-100"><span className="font-bold">Misión Ribas</span><span>{totales.ribas}</span></div>
                      <div className="flex justify-between py-2 border-b border-slate-100"><span className="font-bold">Misión Ezequiel Zamora</span><span>{totales.ezequiel}</span></div>
                      <div className="flex justify-between py-2 border-b border-slate-100"><span className="font-bold">Misión Sucre</span><span>{totales.sucre}</span></div>
                      <div className="flex justify-between py-2 border-b border-slate-100"><span className="font-bold">Misión Vuelta Caras</span><span>{totales.vuelvaCaras}</span></div>
                      <div className="flex justify-between py-2 border-b border-slate-100"><span className="font-bold">Misión Identidad</span><span>{totales.identidad}</span></div>
                      <div className="flex justify-between py-2 border-b border-slate-100"><span className="font-bold">Barrio Adentro</span><span>{totales.barrioAdentro}</span></div>
                      <div className="flex justify-between py-2"><span className="font-bold">Misión Mercal</span><span>{totales.mercal}</span></div>
                      {totales.otras > 0 && <div className="flex justify-between py-2"><span className="font-bold">Otras Misiones</span><span>{totales.otras}</span></div>}
                    </>
                  );
                })()}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {modalServiciosOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setModalServiciosOpen(false)} className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" />
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="relative w-full max-w-2xl max-h-[80vh] bg-white rounded-2xl shadow-2xl overflow-hidden overflow-y-auto">
              <div className="p-5 border-b border-gray-50 flex justify-between items-center sticky top-0 bg-white z-10">
                <h4 className="text-base font-black text-slate-800 italic flex items-center gap-2"><Droplets className="h-5 w-5 text-blue-600" /> Servicios Públicos</h4>
                <button onClick={() => setModalServiciosOpen(false)} className="p-1 rounded-lg hover:bg-gray-100"><X className="h-4 w-4 text-slate-400" /></button>
              </div>
              <div className="p-5 space-y-4">
                <div>
                  <h5 className="text-xs font-black text-slate-700 uppercase tracking-wider flex items-center gap-2"><Droplets className="h-4 w-4 text-blue-500" /> Aguas Blancas</h5>
                  <div className="grid grid-cols-2 gap-1 mt-1">
                    {Object.entries(globales.servicios.aguasBlancas).map(([key, value]) => (
                      <div key={key} className="flex justify-between text-sm"><span className="capitalize">{key.replace(/_/g, ' ')}</span><span className="font-bold">{value}</span></div>
                    ))}
                  </div>
                </div>
                <div>
                  <h5 className="text-xs font-black text-slate-700 uppercase tracking-wider flex items-center gap-2"><Trash className="h-4 w-4 text-amber-500" /> Aguas Servidas</h5>
                  <div className="grid grid-cols-2 gap-1">
                    {Object.entries(globales.servicios.aguasServidas).map(([key, value]) => (
                      <div key={key} className="flex justify-between text-sm"><span className="capitalize">{key.replace(/_/g, ' ')}</span><span className="font-bold">{value}</span></div>
                    ))}
                  </div>
                </div>
                <div>
                  <h5 className="text-xs font-black text-slate-700 uppercase tracking-wider flex items-center gap-2"><Trash className="h-4 w-4 text-green-500" /> Recolección de Basura</h5>
                  <div className="grid grid-cols-2 gap-1">
                    {Object.entries(globales.servicios.recoBasura).map(([key, value]) => (
                      <div key={key} className="flex justify-between text-sm"><span className="capitalize">{key.replace(/_/g, ' ')}</span><span className="font-bold">{value}</span></div>
                    ))}
                  </div>
                </div>
                <div>
                  <h5 className="text-xs font-black text-slate-700 uppercase tracking-wider flex items-center gap-2"><ZapIcon className="h-4 w-4 text-yellow-500" /> Sistema Eléctrico</h5>
                  <div className="grid grid-cols-2 gap-1">
                    {Object.entries(globales.servicios.sistemaElectrico).map(([key, value]) => (
                      <div key={key} className="flex justify-between text-sm"><span className="capitalize">{key.replace(/_/g, ' ')}</span><span className="font-bold">{value}</span></div>
                    ))}
                  </div>
                </div>
                <div>
                  <h5 className="text-xs font-black text-slate-700 uppercase tracking-wider flex items-center gap-2"><FlameKindling className="h-4 w-4 text-orange-500" /> Gas</h5>
                  <div className="grid grid-cols-2 gap-1">
                    {Object.entries(globales.servicios.gas).map(([key, value]) => (
                      <div key={key} className="flex justify-between text-sm"><span className="capitalize">{key.replace(/_/g, ' ')}</span><span className="font-bold">{value}</span></div>
                    ))}
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Modal de familiares */}
      <AnimatePresence>
        {modalFamiliarOpen && fichas.find(f => f.id_ficha === modalFamiliarOpen) && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setModalFamiliarOpen(null)} className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" />
            <motion.div initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 20 }} className="relative w-full max-w-5xl max-h-[80vh] bg-white rounded-2xl shadow-2xl overflow-hidden border border-gray-100 overflow-y-auto">
              <div className="p-5 border-b border-gray-50 flex items-center justify-between sticky top-0 bg-white z-10">
                <h4 className="text-base font-black text-slate-800 italic uppercase tracking-tighter flex items-center gap-2"><Users2 className="h-5 w-5 text-indigo-600" /> Carga Familiar</h4>
                <button onClick={() => setModalFamiliarOpen(null)} className="p-1.5 rounded-xl hover:bg-gray-100"><X className="h-4 w-4 text-slate-400" /></button>
              </div>
              <div className="p-5 overflow-x-auto">
                {fichas.find(f => f.id_ficha === modalFamiliarOpen)?.familiares.length ? (
                  <table className="w-full text-xs">
                    <thead>
                      <tr className="bg-slate-50/50">
                        <th className="p-2 text-[9px] font-black uppercase text-slate-500 w-10">N°</th>
                        <th className="p-2 text-[9px] font-black uppercase text-slate-500 min-w-32">Nombres</th>
                        <th className="p-2 text-[9px] font-black uppercase text-slate-500 w-12">Sexo</th>
                        <th className="p-2 text-[9px] font-black uppercase text-slate-500 w-24">Cédula</th>
                        <th className="p-2 text-[9px] font-black uppercase text-slate-500 w-28">F. Nacimiento</th>
                        <th className="p-2 text-[9px] font-black uppercase text-slate-500 w-12">Edad</th>
                        <th className="p-2 text-[9px] font-black uppercase text-slate-500 w-16">Teléfono</th>
                        <th className="p-2 text-[9px] font-black uppercase text-slate-500 w-20">Centro Vot.</th>
                        <th className="p-2 text-[9px] font-black uppercase text-slate-500 w-20">Discap.</th>
                        <th className="p-2 text-[9px] font-black uppercase text-slate-500 w-24">Caract. Salud</th>
                        <th className="p-2 text-[9px] font-black uppercase text-slate-500 w-28">Acciones</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {fichas.find(f => f.id_ficha === modalFamiliarOpen)?.familiares.map((fam, idx) => (
                        <tr key={idx} className="hover:bg-indigo-50/30 transition-colors">
                          <td className="p-2 font-bold text-slate-700">{fam.numero}</td>
                          <td className="p-2 font-semibold text-slate-800">{fam.nombreApellido}</td>
                          <td className="p-2"><span className="px-1.5 py-0.5 rounded-full text-[9px] font-bold uppercase">{fam.sexo}</span></td>
                          <td className="p-2 font-mono text-slate-600">{fam.cedula}</td>
                          <td className="p-2 text-slate-600 truncate">{fam.fechaNacimiento}</td>
                          <td className="p-2 font-bold text-slate-800">{fam.edad}</td>
                          <td className="p-2 text-slate-600">{fam.telefono || 'S/D'}</td>
                          <td className="p-2 text-slate-600 truncate max-w-28">{fam.centro_votacion || 'S/D'}</td>
                          <td className="p-2"><span className={cn("px-1.5 py-0.5 rounded-full text-[9px] font-bold uppercase", fam.discapacidad?.toLowerCase() !== 'no' && fam.discapacidad !== '' ? 'bg-rose-100 text-700' : 'bg-100 text-700')}>{fam.discapacidad || 'No'}</span></td>
                          <td className="p-2"><span className={cn("px-1.5 py-0.5 rounded-full text-[9px] font-bold uppercase truncate max-w-24", fam.enfermedad?.toLowerCase() === 'no aplica' ? 'bg-slate-100 text-slate-700' : (fam.enfermedad?.toLowerCase() !== 'no' && fam.enfermedad !== '' && fam.enfermedad?.toLowerCase() !== 'ninguna') ? 'bg-amber-100 text-700' : 'bg-100 text-700')}>{fam.enfermedad || 'No'}</span></td>
                          <td className="p-2">
                            <button 
                              onClick={() => setModalMigracionOpen({id_ficha: modalFamiliarOpen, tipo: 'familiar', numero: fam.numero})}
                              className="inline-flex items-center gap-1 px-2 py-1 bg-slate-100 text-slate-600 rounded-lg hover:bg-amber-100 hover:text-700 text-[9px] font-black"
                            >
                              <LogOut className="h-2.5 w-2.5" /> Marcar Migración
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                ) : (
                  <div className="text-center py-10 text-slate-500"><Users2 className="h-10 w-10 mx-auto mb-3 text-slate-300" /><p>No hay familiares registrados</p></div>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Modal de detalles del documento */}
      <AnimatePresence>
        {modalDocumentOpen && fichas.find(f => f.id_ficha === modalDocumentOpen) && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setModalDocumentOpen(null)} className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" />
            <motion.div initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 20 }} className="relative w-full max-w-2xl max-h-[80vh] bg-white rounded-2xl shadow-2xl overflow-hidden border border-gray-100">
              <div className="p-5 border-b border-gray-50 flex items-center justify-between sticky top-0 bg-white z-10">
                <div className="flex items-center gap-3">
                  <FileText className="h-5 w-5 text-blue-600" />
                  <div>
                    <h4 className="text-base font-black text-slate-800 italic uppercase tracking-tighter">{fichas.find(f => f.id_ficha === modalDocumentOpen)?.jefe.nombres} {fichas.find(f => f.id_ficha === modalDocumentOpen)?.jefe.apellidos}</h4>
                    <p className="text-xs text-slate-500">{fichas.find(f => f.id_ficha === modalDocumentOpen)?.archivo_nombre}</p>
                  </div>
                </div>
                <div className="flex gap-2">
                  <button onClick={() => handleDownloadExcel(fichas.find(f => f.id_ficha === modalDocumentOpen)?.archivo_url || null, fichas.find(f => f.id_ficha === modalDocumentOpen)?.archivo_nombre || '')} className="p-1.5 bg-emerald-50 text-emerald-600 hover:bg-emerald-100 rounded-lg"><DownloadCloud className="h-4 w-4" /></button>
                  <button onClick={() => setModalDocumentOpen(null)} className="p-1.5 rounded-lg hover:bg-gray-100"><X className="h-4 w-4 text-slate-400" /></button>
                </div>
              </div>
              <div className="p-5 max-h-[60vh] overflow-y-auto">
                <div className="bg-linear-to-r from-blue-50 to-indigo-50 p-4 rounded-xl border border-blue-100">
                  <h5 className="text-xs font-black text-slate-700 uppercase tracking-wider mb-3 flex items-center gap-2"><Users className="h-3.5 w-3.5" /> Información del Jefe</h5>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                    <div><span className="text-slate-500 font-bold uppercase tracking-wider text-[9px]">Cédula:</span><p className="font-black text-slate-800 text-xs">{fichas.find(f => f.id_ficha === modalDocumentOpen)?.jefe.cedula}</p></div>
                    <div><span className="text-slate-500 font-bold uppercase tracking-wider text-[9px]">Edad:</span><p className="font-black text-slate-800 text-xs">{fichas.find(f => f.id_ficha === modalDocumentOpen)?.jefe.edad} años</p></div>
                    <div><span className="text-slate-500 font-bold uppercase tracking-wider text-[9px]">Sexo:</span><p className="font-black text-slate-800 text-xs">{fichas.find(f => f.id_ficha === modalDocumentOpen)?.jefe.sexo}</p></div>
                    <div><span className="text-slate-500 font-bold uppercase tracking-wider text-[9px]">Teléfono:</span><p className="font-black text-slate-800 text-xs">{fichas.find(f => f.id_ficha === modalDocumentOpen)?.jefe.telefono || 'S/D'}</p></div>
                    <div><span className="text-slate-500 font-bold uppercase tracking-wider text-[9px]">Centro Votación:</span><p className="font-black text-slate-800 text-xs">{fichas.find(f => f.id_ficha === modalDocumentOpen)?.jefe.centro_votacion || 'S/D'}</p></div>
                    <div><span className="text-slate-500 font-bold uppercase tracking-wider text-[9px]">Instrucción:</span><p className="font-black text-slate-800 text-xs">{fichas.find(f => f.id_ficha === modalDocumentOpen)?.jefe.instruccion}</p></div>
                    <div><span className="text-slate-500 font-bold uppercase tracking-wider text-[9px]">CNE:</span><p className="font-black text-slate-800 text-xs">{fichas.find(f => f.id_ficha === modalDocumentOpen)?.jefe.cne}</p></div>
                    <div><span className="text-slate-500 font-bold uppercase tracking-wider text-[9px]">Discapacidad:</span><p className="font-black text-slate-800 text-xs">{fichas.find(f => f.id_ficha === modalDocumentOpen)?.jefe.discapacidad || 'No'}</p></div>
                    <div><span className="text-slate-500 font-bold uppercase tracking-wider text-[9px]">Pensionado:</span><p className="font-black text-slate-800 text-xs">{fichas.find(f => f.id_ficha === modalDocumentOpen)?.jefe.pensionado || 'No'}</p></div>
                    <div><span className="text-slate-500 font-bold uppercase tracking-wider text-[9px]">Enfermedad:</span><p className="font-black text-slate-800 text-xs">{fichas.find(f => f.id_ficha === modalDocumentOpen)?.jefe.enfermedad || 'No'}</p></div>
                    <div><span className="text-slate-500 font-bold uppercase tracking-wider text-[9px]">Oficio:</span><p className="font-black text-slate-800 text-xs">{fichas.find(f => f.id_ficha === modalDocumentOpen)?.jefe.oficio || 'S/D'}</p></div>
                    <div><span className="text-slate-500 font-bold uppercase tracking-wider text-[9px]">Trabajo actual:</span><p className="font-black text-slate-800 text-xs">{fichas.find(f => f.id_ficha === modalDocumentOpen)?.jefe.trabajo_actual || 'S/D'}</p></div>
                  </div>
                </div>
                <div className="mt-4 bg-amber-50 p-4 rounded-xl border border-amber-100">
                  <h5 className="text-xs font-black text-slate-700 uppercase tracking-wider mb-3 flex items-center gap-2"><Flame className="h-3.5 w-3.5" /> Servicios y Gas</h5>
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div><span className="text-slate-500 font-bold uppercase tracking-wider text-[9px]">Cantidad Bombonas:</span><p className="font-black text-slate-800">{fichas.find(f => f.id_ficha === modalDocumentOpen)?.cantidad_bombonas || 0}</p></div>
                    <div><span className="text-slate-500 font-bold uppercase tracking-wider text-[9px]">Gas:</span><p className="font-black text-slate-800">{fichas.find(f => f.id_ficha === modalDocumentOpen)?.servicios.gas.bombona ? 'Bombona' : ''} {fichas.find(f => f.id_ficha === modalDocumentOpen)?.servicios.gas.tuberia ? 'Tubería' : ''}</p></div>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Modal de Migración */}
      <AnimatePresence>
        {modalMigracionOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setModalMigracionOpen(null)} className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" />
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="relative w-full max-w-md bg-white rounded-2xl shadow-2xl overflow-hidden">
              <div className="p-5 border-b border-gray-50 flex justify-between items-center">
                <h4 className="text-base font-black text-slate-800 italic flex items-center gap-2"><LogOut className="h-5 w-5 text-rose-600" /> Registrar Migración</h4>
                <button onClick={() => setModalMigracionOpen(null)} className="p-1 rounded-lg hover:bg-gray-100"><X className="h-4 w-4 text-slate-400" /></button>
              </div>
              <div className="p-5">
                <p className="text-sm text-slate-600 mb-4">
                  {modalMigracionOpen.tipo === 'jefe' 
                    ? '¿El jefe de familia será marcado como migrado. Si hay un familiar adulto, la jefatura será transferida automáticamente.' 
                    : '¿Deseas marcar a este familiar como migrado?'}
                </p>
                <div className="flex gap-3">
                  <button 
                    onClick={() => marcarMigracion(modalMigracionOpen.id_ficha, modalMigracionOpen.tipo, modalMigracionOpen.numero)}
                    className="flex-1 px-4 py-2 bg-rose-600 text-white rounded-lg text-sm font-bold hover:bg-rose-700"
                  >
                    Continuar
                  </button>
                  <button 
                    onClick={() => setModalMigracionOpen(null)}
                    className="flex-1 px-4 py-2 bg-slate-100 text-slate-700 rounded-lg text-sm font-bold hover:bg-slate-200"
                  >
                    Cancelar
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

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

export default CensoComunalView;