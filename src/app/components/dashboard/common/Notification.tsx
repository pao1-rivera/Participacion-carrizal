'use client';

import React, { useState, useEffect, useCallback, useRef } from "react";
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Bell, Calendar, ChevronLeft, ChevronRight, Loader2, 
  ExternalLink, CheckSquare, AlertTriangle, AlertCircle, Trash2,
  MessageSquare, CheckCircle
} from "lucide-react";
import { supabase } from "@/app/lib/supabaseClient";
import { useAuth } from "@/context/AuthContext";
import { useRouter } from 'next/navigation';
import { cn } from "@/app/lib/utils";

interface Notification {
  id: string;
  title: string;
  type: 'warning' | 'error' | 'info' | 'success';
  date: string;
  read: boolean;
  route: string;
}

const emitNotificationsUpdate = () => {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('notificationsUpdated'));
  }
};

// ==================== FUNCIONES AUXILIARES (comunes a todos los roles) ====================
const getTimeRemaining = (fechaISO: string | null) => {
  if (!fechaISO) return { text: "No establecida", color: "gray", daysLeft: null };
  const hoy = new Date();
  hoy.setHours(0, 0, 0, 0);
  const [year, month, day] = fechaISO.split('-').map(Number);
  const fechaVenc = new Date(year, month - 1, day);
  fechaVenc.setHours(0, 0, 0, 0);
  if (fechaVenc < hoy) return { text: "VENCIDA", color: "rose", daysLeft: 0 };
  const diffDays = Math.ceil((fechaVenc.getTime() - hoy.getTime()) / (1000 * 60 * 60 * 24));
  let years = fechaVenc.getFullYear() - hoy.getFullYear();
  let months = fechaVenc.getMonth() - hoy.getMonth();
  let days = fechaVenc.getDate() - hoy.getDate();
  if (days < 0) { months--; days += new Date(fechaVenc.getFullYear(), fechaVenc.getMonth(), 0).getDate(); }
  if (months < 0) { years--; months += 12; }
  let text = "";
  if (years > 0) text += `${years} año${years !== 1 ? 's' : ''} `;
  if (months > 0) text += `${months} mes${months !== 1 ? 'es' : ''} `;
  if (days > 0) text += `${days} día${days !== 1 ? 's' : ''}`;
  if (!text) text = "HOY";
  let status = diffDays <= 0 ? "VENCIDA" : "POR VENCERSE";
  return { text: `${status} en ${text}`, color: diffDays <= 30 ? "rose" : diffDays <= 60 ? "amber" : "emerald", daysLeft: diffDays };
};

// ==================== FUNCIONES PARA CONSEJO COMUNAL ====================
const checkMissingFieldsConsejo = (data: any) => {
  const requiredFields = [
    { field: 'codigo', label: 'Código', route: 'organizacion' },
    { field: 'nombre_consejo', label: 'Nombre del Consejo', route: 'organizacion' },
    { field: 'fecha_creacion', label: 'Fecha de Creación', route: 'organizacion' },
    { field: 'domicilio', label: 'Domicilio', route: 'organizacion' },
    { field: 'parroquia', label: 'Parroquia', route: 'organizacion' },
    { field: 'municipio', label: 'Municipio', route: 'organizacion' },
    { field: 'estado', label: 'Estado', route: 'organizacion' },
    { field: 'rif', label: 'RIF', route: 'datos-legales' },
    { field: 'fecha_vencimiento_rif', label: 'Fecha de Vencimiento del RIF', route: 'datos-legales' }
  ];
  return requiredFields.filter(req => !data[req.field] || data[req.field] === '');
};

const checkMissingConsejoDocuments = (consejoData: any) => {
  const missingDocs = [];
  if (!consejoData.acta_constitutiva_url) missingDocs.push({ tipo: 'acta_constitutiva', label: 'Acta Constitutiva', route: 'documentacion' });
  if (!consejoData.rif_url) missingDocs.push({ tipo: 'rif', label: 'Documento RIF', route: 'documentacion' });
  if (!consejoData.registro_federal_url) missingDocs.push({ tipo: 'registro_federal', label: 'Registro Federal', route: 'documentacion' });
  return missingDocs;
};

const checkConsejoRifVencimiento = (consejoData: any) => {
  const vencimientos = [];
  if (consejoData.fecha_vencimiento_rif) {
    const { text, daysLeft } = getTimeRemaining(consejoData.fecha_vencimiento_rif);
    if (daysLeft !== null && daysLeft <= 90) {
      vencimientos.push({
        id: `consejo_rif_venc_${consejoData.id_consejo}`,
        title: `📄 RIF del Consejo: ${text}`,
        type: daysLeft <= 0 ? 'error' : daysLeft <= 30 ? 'error' : 'warning' as 'error' | 'warning',
        route: 'datos-legales'
      });
    }
  }
  return vencimientos;
};

const checkVocerosConsejoVencimiento = async (idConsejo: number) => {
  if (!idConsejo) return [];
  const { data: consejoData, error } = await supabase
    .from('datos_consejo_comunal')
    .select('fecha_vencimiento_voceros')
    .eq('id_consejo', idConsejo)
    .maybeSingle();
  if (error || !consejoData) return [];
  const vencimientos = [];
  if (consejoData.fecha_vencimiento_voceros) {
    const { text, daysLeft } = getTimeRemaining(consejoData.fecha_vencimiento_voceros);
    if (daysLeft !== null && daysLeft <= 90) {
      vencimientos.push({
        id: `consejo_voceros_venc_${idConsejo}`,
        title: `⏰ Vocerías del Consejo: ${text}`,
        type: daysLeft <= 0 ? 'error' : daysLeft <= 30 ? 'error' : 'warning' as 'error' | 'warning',
        route: 'voceros'
      });
    }
  }
  return vencimientos;
};

const checkVoceroConsejoMissingFields = (vocero: any) => {
  const missing = [];
  if (!vocero.nombre_completo) missing.push({ field: 'nombre_completo', label: 'Nombre completo', route: 'voceros' });
  if (!vocero.cedula) missing.push({ field: 'cedula', label: 'Cédula', route: 'voceros' });
  if (!vocero.unidad) missing.push({ field: 'unidad', label: 'Unidad', route: 'voceros' });
  if (!vocero.tipo) missing.push({ field: 'tipo', label: 'Tipo', route: 'voceros' });
  if (!vocero.profesion) missing.push({ field: 'profesion', label: 'Profesión', route: 'voceros' });
  if (!vocero.telefono) missing.push({ field: 'telefono', label: 'Teléfono', route: 'voceros' });
  return missing;
};

const checkVoceroConsejoRifVencimiento = async (idConsejo: number) => {
  if (!idConsejo) return [];
  const { data: voceros, error } = await supabase
    .from('voceros')
    .select('id_vocero, nombre_completo, rif_fecha_vencimiento')
    .eq('id_consejo', idConsejo);
  if (error || !voceros) return [];
  const vencimientos = [];
  const hoy = new Date(); hoy.setHours(0, 0, 0, 0);
  for (const vocero of voceros) {
    if (vocero.rif_fecha_vencimiento) {
      const fechaVenc = new Date(vocero.rif_fecha_vencimiento); fechaVenc.setHours(0, 0, 0, 0);
      const diffDays = Math.ceil((fechaVenc.getTime() - hoy.getTime()) / (1000 * 60 * 60 * 24));
      if (diffDays <= 90) {
        const status = diffDays <= 0 ? 'VENCIDO' : `Vence en ${diffDays} días`;
        vencimientos.push({
          id: `vocero_consejo_rif_venc_${vocero.id_vocero}`,
          title: `📄 RIF de vocero ${vocero.nombre_completo}: ${status}`,
          type: diffDays <= 0 ? 'error' : diffDays <= 30 ? 'error' : 'warning' as 'error' | 'warning',
          route: 'voceros'
        });
      }
    }
  }
  return vencimientos;
};

const checkVoceroConsejoMissingDocuments = async (idConsejo: number) => {
  if (!idConsejo) return [];
  const { data: voceros, error } = await supabase
    .from('voceros')
    .select('id_vocero, nombre_completo, rif_url, cedula_url')
    .eq('id_consejo', idConsejo);
  if (error || !voceros) return [];
  const missingDocs = [];
  for (const vocero of voceros) {
    if (!vocero.rif_url) {
      missingDocs.push({
        id: `vocero_consejo_rif_doc_${vocero.id_vocero}`,
        title: `📄 Falta RIF del vocero: ${vocero.nombre_completo}`,
        type: 'error' as const,
        route: 'voceros'
      });
    }
    if (!vocero.cedula_url) {
      missingDocs.push({
        id: `vocero_consejo_cedula_doc_${vocero.id_vocero}`,
        title: `🆔 Falta Cédula del vocero: ${vocero.nombre_completo}`,
        type: 'error' as const,
        route: 'voceros'
      });
    }
  }
  return missingDocs;
};

const checkNuevasRespuestasSoporte = async (userId: string) => {
  if (!userId) return [];
  const { data: tickets, error } = await supabase
    .from('soporte')
    .select('id_soporte, problema, respuesta, fecha_respuesta')
    .eq('id_usuario', userId)
    .neq('respuesta', null)
    .order('fecha_respuesta', { ascending: false });
  if (error || !tickets) return [];
  const nuevasRespuestas = [];
  const hoy = new Date(); hoy.setHours(0, 0, 0, 0);
  for (const ticket of tickets) {
    const fechaRespuesta = ticket.fecha_respuesta ? new Date(ticket.fecha_respuesta) : null;
    if (fechaRespuesta) {
      const diffDays = Math.ceil((hoy.getTime() - fechaRespuesta.getTime()) / (1000 * 60 * 60 * 24));
      if (diffDays <= 7) {
        nuevasRespuestas.push({
          id: `soporte_respuesta_${ticket.id_soporte}`,
          title: `💬 Respuesta a tu ticket: "${ticket.problema.substring(0, 50)}..."`,
          type: 'info' as const,
          route: 'ayuda'
        });
      }
    }
  }
  return nuevasRespuestas;
};

// ==================== FUNCIONES PARA COMUNA ====================
const checkMissingFieldsComuna = (data: any) => {
  const requiredFields = [
    { field: 'nombre_comuna', label: 'Nombre de la Comuna', route: 'documentacion' },
    { field: 'rif', label: 'RIF', route: 'documentacion' },
    { field: 'codigo_situr', label: 'Código SITUR', route: 'documentacion' },
    { field: 'cuenta_bancaria', label: 'Cuenta Bancaria', route: 'documentacion' },
    { field: 'fecha_vencimiento_rif', label: 'Fecha de Vencimiento del RIF', route: 'documentacion' },
    { field: 'fecha_vencimiento_voceros', label: 'Fecha de Vencimiento de Vocerías', route: 'documentacion' }
  ];
  return requiredFields.filter(req => !data[req.field] || data[req.field] === '');
};

const checkMissingComunaDocuments = (comunaData: any) => {
  const missingDocs = [];
  if (!comunaData.certificado_cuenta_url) missingDocs.push({ tipo: 'certificado_cuenta', label: 'Certificado de Cuenta Bancaria', route: 'documentacion' });
  if (!comunaData.rif_url) missingDocs.push({ tipo: 'rif', label: 'Documento RIF', route: 'documentacion' });
  if (!comunaData.carta_fundacional_url) missingDocs.push({ tipo: 'carta_fundacional', label: 'Carta Fundacional', route: 'documentacion' });
  return missingDocs;
};

const checkComunaRifVencimiento = (comunaData: any) => {
  const vencimientos = [];
  if (comunaData.fecha_vencimiento_rif) {
    const { text, daysLeft } = getTimeRemaining(comunaData.fecha_vencimiento_rif);
    if (daysLeft !== null && daysLeft <= 90) {
      vencimientos.push({
        id: `comuna_rif_venc_${comunaData.id_comuna}`,
        title: `📄 RIF de la Comuna: ${text}`,
        type: daysLeft <= 0 ? 'error' : daysLeft <= 30 ? 'error' : 'warning' as 'error' | 'warning',
        route: 'documentacion'
      });
    }
  }
  return vencimientos;
};

const checkVoceriasVencimientoComuna = (comunaData: any) => {
  const vencimientos = [];
  if (comunaData.fecha_vencimiento_voceros) {
    const { text, daysLeft } = getTimeRemaining(comunaData.fecha_vencimiento_voceros);
    if (daysLeft !== null && daysLeft <= 90) {
      vencimientos.push({
        id: `vocerias_venc_comuna_${comunaData.id_comuna}`,
        title: `⏰ Vocerías de la Comuna: ${text}`,
        type: daysLeft <= 0 ? 'error' : daysLeft <= 30 ? 'error' : 'warning' as 'error' | 'warning',
        route: 'documentacion'
      });
    }
  }
  return vencimientos;
};

const checkResponsableMissingFields = (responsable: any) => {
  const missing = [];
  if (!responsable.nombre_g) missing.push({ field: 'nombre_g', label: 'Nombre', route: 'consejopec' });
  if (!responsable.apellido_g) missing.push({ field: 'apellido_g', label: 'Apellido', route: 'consejopec' });
  if (!responsable.cedula) missing.push({ field: 'cedula', label: 'Cédula', route: 'consejopec' });
  if (!responsable.unidad) missing.push({ field: 'unidad', label: 'Unidad', route: 'consejopec' });
  if (!responsable.tipo) missing.push({ field: 'tipo', label: 'Tipo', route: 'consejopec' });
  return missing;
};

const checkResponsableRifVencimiento = async (idComuna: number) => {
  if (!idComuna) return [];
  const { data: responsables, error } = await supabase
    .from('responsables_gestion_comuna')
    .select('id_responsable, nombre_g, apellido_g, rif_fecha_vencimiento')
    .eq('id_comuna', idComuna);
  if (error || !responsables) return [];
  const vencimientos = [];
  const hoy = new Date(); hoy.setHours(0, 0, 0, 0);
  for (const responsable of responsables) {
    if (responsable.rif_fecha_vencimiento) {
      const fechaVenc = new Date(responsable.rif_fecha_vencimiento); fechaVenc.setHours(0, 0, 0, 0);
      const diffDays = Math.ceil((fechaVenc.getTime() - hoy.getTime()) / (1000 * 60 * 60 * 24));
      if (diffDays <= 90) {
        const status = diffDays <= 0 ? 'VENCIDO' : `Vence en ${diffDays} días`;
        vencimientos.push({
          id: `responsable_rif_venc_${responsable.id_responsable}`,
          title: `📄 RIF del responsable ${responsable.nombre_g} ${responsable.apellido_g}: ${status}`,
          type: diffDays <= 0 ? 'error' : diffDays <= 30 ? 'error' : 'warning' as 'error' | 'warning',
          route: 'consejopec'
        });
      }
    }
  }
  return vencimientos;
};

const checkResponsableMissingDocuments = async (idComuna: number) => {
  if (!idComuna) return [];
  const { data: responsables, error } = await supabase
    .from('responsables_gestion_comuna')
    .select('id_responsable, nombre_g, apellido_g, rif_url, cedula_url')
    .eq('id_comuna', idComuna);
  if (error || !responsables) return [];
  const missingDocs = [];
  for (const responsable of responsables) {
    if (!responsable.rif_url) {
      missingDocs.push({
        id: `responsable_rif_doc_${responsable.id_responsable}`,
        title: `📄 Falta RIF del responsable: ${responsable.nombre_g} ${responsable.apellido_g}`,
        type: 'error' as const,
        route: 'consejopec'
      });
    }
    if (!responsable.cedula_url) {
      missingDocs.push({
        id: `responsable_cedula_doc_${responsable.id_responsable}`,
        title: `🆔 Falta Cédula del responsable: ${responsable.nombre_g} ${responsable.apellido_g}`,
        type: 'error' as const,
        route: 'consejopec'
      });
    }
  }
  return missingDocs;
};

const checkVoceroComunaMissingFields = (vocero: any) => {
  const missing = [];
  if (!vocero.nombre_completo) missing.push({ field: 'nombre_completo', label: 'Nombre completo', route: 'vocerias' });
  if (!vocero.cedula) missing.push({ field: 'cedula', label: 'Cédula', route: 'vocerias' });
  if (!vocero.unidad) missing.push({ field: 'unidad', label: 'Unidad', route: 'vocerias' });
  if (!vocero.tipo) missing.push({ field: 'tipo', label: 'Tipo', route: 'vocerias' });
  return missing;
};

const checkVoceroComunaRifVencimiento = async (idComuna: number) => {
  if (!idComuna) return [];
  const { data: voceros, error } = await supabase
    .from('voceros_comuna')
    .select('id_voceroc, nombre_completo, rif_fecha_vencimiento')
    .eq('id_comuna', idComuna);
  if (error || !voceros) return [];
  const vencimientos = [];
  const hoy = new Date(); hoy.setHours(0, 0, 0, 0);
  for (const vocero of voceros) {
    if (vocero.rif_fecha_vencimiento) {
      const fechaVenc = new Date(vocero.rif_fecha_vencimiento); fechaVenc.setHours(0, 0, 0, 0);
      const diffDays = Math.ceil((fechaVenc.getTime() - hoy.getTime()) / (1000 * 60 * 60 * 24));
      if (diffDays <= 90) {
        const status = diffDays <= 0 ? 'VENCIDO' : `Vence en ${diffDays} días`;
        vencimientos.push({
          id: `vocero_comuna_rif_venc_${vocero.id_voceroc}`,
          title: `📄 RIF del vocero ${vocero.nombre_completo}: ${status}`,
          type: diffDays <= 0 ? 'error' : diffDays <= 30 ? 'error' : 'warning' as 'error' | 'warning',
          route: 'vocerias'
        });
      }
    }
  }
  return vencimientos;
};

const checkVoceroComunaMissingDocuments = async (idComuna: number) => {
  if (!idComuna) return [];
  const { data: voceros, error } = await supabase
    .from('voceros_comuna')
    .select('id_voceroc, nombre_completo, rif_url, cedula_url')
    .eq('id_comuna', idComuna);
  if (error || !voceros) return [];
  const missingDocs = [];
  for (const vocero of voceros) {
    if (!vocero.rif_url) {
      missingDocs.push({
        id: `vocero_comuna_rif_doc_${vocero.id_voceroc}`,
        title: `📄 Falta RIF del vocero: ${vocero.nombre_completo}`,
        type: 'error' as const,
        route: 'vocerias'
      });
    }
    if (!vocero.cedula_url) {
      missingDocs.push({
        id: `vocero_comuna_cedula_doc_${vocero.id_voceroc}`,
        title: `🆔 Falta Cédula del vocero: ${vocero.nombre_completo}`,
        type: 'error' as const,
        route: 'vocerias'
      });
    }
  }
  return missingDocs;
};

// ==================== FUNCIONES PARA SALA DE AUTOGOBIERNO ====================
const checkMissingSalaFields = (salaData: any) => {
  const requiredFields = [
    { field: 'nombre_sala', label: 'Nombre de la Sala', route: 'organizacion' },
    { field: 'estatus', label: 'Estatus', route: 'organizacion' },
    { field: 'acta_constitutiva_url', label: 'Acta Constitutiva', route: 'documentacion' }
  ];
  return requiredFields.filter(req => !salaData[req.field] || salaData[req.field] === '');
};

const checkSalaInfraestructura = async (idSala: number) => {
  const { data: infra, error } = await supabase
    .from('infraestructura_sala')
    .select('id_infraestructura')
    .eq('id_sala', idSala)
    .maybeSingle();
  
  if (error || !infra) {
    return [{
      id: `sala_sin_infra_${idSala}`,
      title: `🔧 La Sala no tiene evaluación de infraestructura registrada`,
      type: 'warning' as const,
      route: 'infraestructura'
    }];
  }
  return [];
};

const checkSalaEquipos = async (idSala: number) => {
  const { data: infra, error } = await supabase
    .from('infraestructura_sala')
    .select('equipos_funcionales, estado_hardware')
    .eq('id_sala', idSala)
    .maybeSingle();
  
  if (error || !infra) return [];
  
  const issues = [];
  if (!infra.equipos_funcionales || infra.equipos_funcionales === '—') {
    issues.push({
      id: `sala_sin_equipos_${idSala}`,
      title: `💻 La Sala no tiene registrados equipos funcionales`,
      type: 'warning' as const,
      route: 'infraestructura'
    });
  }
  if (infra.estado_hardware === 'Malo' || infra.estado_hardware === 'Crítico') {
    issues.push({
      id: `sala_hardware_critico_${idSala}`,
      title: `⚠️ El hardware de la Sala está en estado ${infra.estado_hardware}`,
      type: 'error' as const,
      route: 'infraestructura'
    });
  }
  return issues;
};

// ==================== FUNCIONES PARA DIRECTORES ====================
const checkSalasInactivas = async () => {
  const { data: salas, error } = await supabase
    .from('datos_sala_autogobierno')
    .select('id_sala, nombre_sala, estatus');
  
  if (error || !salas) return [];
  
  return salas
    .filter(s => s.estatus?.toLowerCase() === 'inactiva' || s.estatus?.toLowerCase() === 'inactivo')
    .map(sala => ({
      id: `sala_inactiva_${sala.id_sala}`,
      title: `🏢 La sala "${sala.nombre_sala}" se encuentra INACTIVA`,
      type: 'warning' as const,
      route: 'infraestructura',
    }));
};

const checkConsejosDocumentosFaltantes = async () => {
  const { data: consejos, error } = await supabase
    .from('datos_consejo_comunal')
    .select('id_consejo, nombre_consejo, acta_constitutiva_url, rif_url');
  
  if (error || !consejos) return [];
  
  const faltantes = [];
  for (const consejo of consejos) {
    const missingDocs = [];
    if (!consejo.acta_constitutiva_url) missingDocs.push('Acta Constitutiva');
    if (!consejo.rif_url) missingDocs.push('RIF');
    
    if (missingDocs.length > 0) {
      faltantes.push({
        id: `consejo_docs_${consejo.id_consejo}`,
        title: `📄 Consejo "${consejo.nombre_consejo}" le falta: ${missingDocs.join(', ')}`,
        type: 'error' as const,
        route: 'gestion',
      });
    }
  }
  return faltantes;
};

const checkComunasDocumentosFaltantes = async () => {
  const { data: comunas, error } = await supabase
    .from('datos_comuna')
    .select('id_comuna, nombre_comuna, certificado_cuenta_url, rif_url, carta_fundacional_url');
  
  if (error || !comunas) return [];
  
  const faltantes = [];
  for (const comuna of comunas) {
    const missingDocs = [];
    if (!comuna.certificado_cuenta_url) missingDocs.push('Certificado de Cuenta');
    if (!comuna.rif_url) missingDocs.push('RIF');
    if (!comuna.carta_fundacional_url) missingDocs.push('Carta Fundacional');
    
    if (missingDocs.length > 0) {
      faltantes.push({
        id: `comuna_docs_${comuna.id_comuna}`,
        title: `📄 Comuna "${comuna.nombre_comuna}" le falta: ${missingDocs.join(', ')}`,
        type: 'error' as const,
        route: 'liderazgo',
      });
    }
  }
  return faltantes;
};

const checkRifVencidoGeneral = async () => {
  const vencimientos = [];
  const hoy = new Date();
  
  const { data: consejos } = await supabase
    .from('datos_consejo_comunal')
    .select('id_consejo, nombre_consejo, fecha_vencimiento_rif');
  
  if (consejos) {
    for (const consejo of consejos) {
      if (consejo.fecha_vencimiento_rif && new Date(consejo.fecha_vencimiento_rif) < hoy) {
        vencimientos.push({
          id: `consejo_rif_vencido_gen_${consejo.id_consejo}`,
          title: `📄 RIF vencido del consejo "${consejo.nombre_consejo}"`,
          type: 'error' as const,
          route: 'gestion',
        });
      }
    }
  }
  
  const { data: comunas } = await supabase
    .from('datos_comuna')
    .select('id_comuna, nombre_comuna, fecha_vencimiento_rif');
  
  if (comunas) {
    for (const comuna of comunas) {
      if (comuna.fecha_vencimiento_rif && new Date(comuna.fecha_vencimiento_rif) < hoy) {
        vencimientos.push({
          id: `comuna_rif_vencido_gen_${comuna.id_comuna}`,
          title: `📄 RIF vencido de la comuna "${comuna.nombre_comuna}"`,
          type: 'error' as const,
          route: 'liderazgo',
        });
      }
    }
  }
  
  return vencimientos;
};

const checkNuevosRegistros = async () => {
  const nuevos: any[] = [];
  const semanaAtras = new Date();
  semanaAtras.setDate(semanaAtras.getDate() - 7);
  
  const { data: nuevasSalas } = await supabase
    .from('datos_sala_autogobierno')
    .select('id_sala, nombre_sala, created_at')
    .gte('created_at', semanaAtras.toISOString());
  
  if (nuevasSalas) {
    nuevasSalas.forEach(sala => {
      nuevos.push({
        id: `nueva_sala_${sala.id_sala}`,
        title: `🏢 Nueva Sala de Autogobierno registrada: "${sala.nombre_sala}"`,
        type: 'success' as const,
        route: 'infraestructura',
        date: sala.created_at
      });
    });
  }
  
  const { data: nuevasComunas } = await supabase
    .from('datos_comuna')
    .select('id_comuna, nombre_comuna, created_at')
    .gte('created_at', semanaAtras.toISOString());
  
  if (nuevasComunas) {
    nuevasComunas.forEach(comuna => {
      nuevos.push({
        id: `nueva_comuna_${comuna.id_comuna}`,
        title: `🏘️ Nueva Comuna registrada: "${comuna.nombre_comuna}"`,
        type: 'success' as const,
        route: 'liderazgo',
        date: comuna.created_at
      });
    });
  }
  
  const { data: nuevosConsejos } = await supabase
    .from('datos_consejo_comunal')
    .select('id_consejo, nombre_consejo, created_at')
    .gte('created_at', semanaAtras.toISOString());
  
  if (nuevosConsejos) {
    nuevosConsejos.forEach(consejo => {
      nuevos.push({
        id: `nuevo_consejo_${consejo.id_consejo}`,
        title: `🏛️ Nuevo Consejo Comunal registrado: "${consejo.nombre_consejo}"`,
        type: 'success' as const,
        route: 'gestion',
        date: consejo.created_at
      });
    });
  }
  
  return nuevos;
};

const checkSalasSinEvaluar = async () => {
  const { data: salasConInfra } = await supabase
    .from('infraestructura_sala')
    .select('id_sala');
  
  const salasConInfraIds = salasConInfra?.map(s => s.id_sala) || [];
  
  const { data: todasSalas } = await supabase
    .from('datos_sala_autogobierno')
    .select('id_sala, nombre_sala');
  
  if (!todasSalas) return [];
  
  return todasSalas
    .filter(sala => !salasConInfraIds.includes(sala.id_sala))
    .map(sala => ({
      id: `sala_sin_evaluar_${sala.id_sala}`,
      title: `🔧 La sala "${sala.nombre_sala}" no ha sido evaluada en infraestructura`,
      type: 'warning' as const,
      route: 'infraestructura',
    }));
};

const checkNuevosNudosProyectosRendiciones = async () => {
  const nuevos: any[] = [];
  const semanaAtras = new Date();
  semanaAtras.setDate(semanaAtras.getDate() - 7);
  
  const { data: nuevosNudos } = await supabase
    .from('nudos_criticos')
    .select('id_nudo, titulo, created_at')
    .gte('created_at', semanaAtras.toISOString());
  
  if (nuevosNudos) {
    nuevosNudos.forEach(nudo => {
      nuevos.push({
        id: `nuevo_nudo_${nudo.id_nudo}`,
        title: `⚠️ Nuevo nudo crítico registrado: "${nudo.titulo.substring(0, 50)}"`,
        type: 'warning' as const,
        route: 'gestion',
        date: nudo.created_at
      });
    });
  }
  
  const { data: nuevosProyectos } = await supabase
    .from('proyectos')
    .select('id_proyecto, nombre, created_at')
    .gte('created_at', semanaAtras.toISOString());
  
  if (nuevosProyectos) {
    nuevosProyectos.forEach(proyecto => {
      nuevos.push({
        id: `nuevo_proyecto_${proyecto.id_proyecto}`,
        title: `📊 Nuevo proyecto registrado: "${proyecto.nombre}"`,
        type: 'info' as const,
        route: 'gestion',
        date: proyecto.created_at
      });
    });
  }
  
  const { data: nuevasRendiciones } = await supabase
    .from('rendiciones')
    .select('id_rendicion, created_at')
    .gte('created_at', semanaAtras.toISOString());
  
  if (nuevasRendiciones) {
    nuevasRendiciones.forEach(rendicion => {
      nuevos.push({
        id: `nueva_rendicion_${rendicion.id_rendicion}`,
        title: `📑 Nueva rendición de cuenta registrada`,
        type: 'info' as const,
        route: 'gestion',
        date: rendicion.created_at
      });
    });
  }
  
  return nuevos;
};

const checkNuevosRegistrosAlfabetizacion = async () => {
  const semanaAtras = new Date();
  semanaAtras.setDate(semanaAtras.getDate() - 7);
  
  const { data: nuevosRegistros } = await supabase
    .from('analfabetismo_digital')
    .select('id_registro, nombre, apellido, created_at')
    .gte('created_at', semanaAtras.toISOString());
  
  if (!nuevosRegistros) return [];
  
  return nuevosRegistros.map(reg => ({
    id: `alfabetizacion_${reg.id_registro}`,
    title: `📝 Nuevo diagnóstico de alfabetización digital: ${reg.nombre} ${reg.apellido}`,
    type: 'info' as const,
    route: 'alfa',
    date: reg.created_at
  }));
};

const checkNuevosAdultosMayores = async () => {
  const semanaAtras = new Date();
  semanaAtras.setDate(semanaAtras.getDate() - 7);
  
  const { data: nuevosRegistros, error } = await supabase
    .from('adultos_mayores')
    .select('id_adulto, nombre, apellido, created_at')
    .gte('created_at', semanaAtras.toISOString())
    .limit(10);
  
  if (error || !nuevosRegistros) return [];
  
  return nuevosRegistros.map(adulto => ({
    id: `nuevo_adulto_${adulto.id_adulto}`,
    title: `👴 Nuevo Adulto Mayor Encuestado: ${adulto.nombre} ${adulto.apellido}`,
    type: 'info' as const,
    route: 'social',
    date: adulto.created_at
  }));
};

// ==================== NUEVA FUNCIÓN PARA DIRECTOR FORMACIÓN Y PLANIFICACIÓN ====================
const checkNuevosCursosTalleres = async () => {
  const semanaAtras = new Date();
  semanaAtras.setDate(semanaAtras.getDate() - 7);
  
  const { data: nuevosCursos, error } = await supabase
    .from('cursos')
    .select('id_cursos, titulo, tipo, created_at')
    .gte('created_at', semanaAtras.toISOString())
    .order('created_at', { ascending: false })
    .limit(10);
  
  if (error || !nuevosCursos) return [];
  
  return nuevosCursos.map(curso => ({
    id: `nuevo_curso_${curso.id_cursos}`,
    title: `🎓 Nuevo ${curso.tipo || 'curso'} registrado: "${curso.titulo}"`,
    type: 'info' as const,
    route: 'formacion',
    date: curso.created_at
  }));
};

const checkRespuestasSoporte = async () => {
  const semanaAtras = new Date();
  semanaAtras.setDate(semanaAtras.getDate() - 7);
  
  const { data: respuestas } = await supabase
    .from('soporte')
    .select('id_soporte, problema, respuesta, fecha_respuesta')
    .not('respuesta', 'is', null)
    .gte('fecha_respuesta', semanaAtras.toISOString());
  
  if (!respuestas) return [];
  
  return respuestas.map(ticket => ({
    id: `soporte_respuesta_${ticket.id_soporte}`,
    title: `💬 Nueva respuesta a ticket de soporte: "${ticket.problema.substring(0, 50)}..."`,
    type: 'success' as const,
    route: 'ayuda',
    date: ticket.fecha_respuesta
  }));
};

const checkNuevosConsejosPendientes = async () => {
  const semanaAtras = new Date();
  semanaAtras.setDate(semanaAtras.getDate() - 7);
  
  const { data: nuevosConsejos, error } = await supabase
    .from('datos_consejo_comunal')
    .select('id_consejo, nombre_consejo, created_at, estatus_validacion')
    .or('estatus_validacion.is.null,estatus_validacion.eq.PENDIENTE')
    .gte('created_at', semanaAtras.toISOString());
  
  if (error) {
    console.error('Error consultando consejos pendientes:', error);
    return [];
  }
  
  if (!nuevosConsejos || nuevosConsejos.length === 0) return [];
  
  return nuevosConsejos.map(consejo => ({
    id: `nuevo_consejo_pendiente_${consejo.id_consejo}`,
    title: `📋 Nuevo Consejo Comunal pendiente por aprobación: "${consejo.nombre_consejo}"`,
    type: 'warning' as const,
    route: 'validacion',
    date: consejo.created_at
  }));
};

export function NotificationsPage() {
  const { user: authUser } = useAuth();
  const router = useRouter();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [readNotifications, setReadNotifications] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [isUpdating, setIsUpdating] = useState(false);
  const itemsPerPage = 10;
  const isMounted = useRef(true);
  const readNotificationsRef = useRef(readNotifications);

  useEffect(() => {
    readNotificationsRef.current = readNotifications;
  }, [readNotifications]);

  // Determinar el rol del usuario
  const rolNombre = authUser?.rolNombre?.toLowerCase() || '';

  const esDirectorComunas = rolNombre === 'director_comunas' || 
                            rolNombre.includes('director_comunas') || 
                            (rolNombre.includes('direccion') && rolNombre.includes('comunas'));

  const esDirectorDigitalizacion = rolNombre === 'director_digitalizacion' || 
                                   rolNombre.includes('digitalizacion');

  const esDirectorAdultoMayor = rolNombre === 'director_adulto_mayor' || 
                                (rolNombre.includes('direccion') && rolNombre.includes('adulto_mayor'));

  // NUEVO: detectar Director de Formación y Planificación
  const esDirectorFormacionPlanificacion = rolNombre === 'director_formacion_planificacion' || 
                                           (rolNombre.includes('formacion') && rolNombre.includes('planificacion')) ||
                                           (rolNombre.includes('direccion') && rolNombre.includes('formacion'));

  const esConsejo = !esDirectorComunas && !esDirectorDigitalizacion && !esDirectorAdultoMayor && !esDirectorFormacionPlanificacion && 
                    (rolNombre === 'vocero_cc' || rolNombre.includes('consejo_comunal'));

  const esComuna = !esDirectorComunas && !esDirectorDigitalizacion && !esDirectorAdultoMayor && !esDirectorFormacionPlanificacion && !esConsejo && 
                   (rolNombre.includes('vocero_c') || rolNombre === 'comuna');

  const esSala = !esDirectorComunas && !esDirectorDigitalizacion && !esDirectorAdultoMayor && !esDirectorFormacionPlanificacion && !esConsejo && !esComuna && 
                 (rolNombre.includes('coordinador_s') || rolNombre === 'sala_autogobierno');

  // Cargar notificaciones leídas desde localStorage
  const loadReadNotifications = useCallback(() => {
    if (typeof window !== 'undefined' && authUser?.id) {
      const saved = localStorage.getItem(`readNotifications_${authUser?.id}`);
      if (saved) {
        setReadNotifications(new Set(JSON.parse(saved)));
      }
    }
  }, [authUser?.id]);

  useEffect(() => {
    loadReadNotifications();
  }, [loadReadNotifications]);

  const saveReadNotifications = useCallback((ids: string[]) => {
    if (typeof window !== 'undefined' && authUser?.id) {
      localStorage.setItem(`readNotifications_${authUser.id}`, JSON.stringify(ids));
      setReadNotifications(new Set(ids));
      emitNotificationsUpdate();
    }
  }, [authUser?.id]);

  const markNotificationRead = useCallback((notificationId: string) => {
    if (readNotificationsRef.current.has(notificationId)) return;
    
    const updatedIds = Array.from(readNotificationsRef.current).concat(notificationId);
    saveReadNotifications(updatedIds);
    
    setNotifications(prev => prev.map(n => 
      n.id === notificationId ? { ...n, read: true } : n
    ));
  }, [saveReadNotifications]);

    const fetchConsejoDataForUser = useCallback(async (userId: string) => {
      if (!userId) return null;

      // Buscar como usuario principal
      let { data, error } = await supabase
        .from('datos_consejo_comunal')
        .select('*')
        .eq('id_usuario', userId)
        .maybeSingle();

      // Si no, buscar como auxiliar
      if (!data && !error) {
        const { data: auxData } = await supabase
          .from('datos_consejo_comunal')
          .select('*')
          .eq('id_usuario_auxiliar', userId)
          .maybeSingle();
        data = auxData;
      }

      return data;
    }, []);

    const fetchComunaDataForUser = useCallback(async (userId: string) => {
      if (!userId) return null;

      let { data, error } = await supabase
        .from('datos_comuna')
        .select('*')
        .eq('id_usuario', userId)
        .maybeSingle();

      if (!data && !error) {
        const { data: auxData } = await supabase
          .from('datos_comuna')
          .select('*')
          .eq('id_usuario_auxiliar', userId)
          .maybeSingle();
        data = auxData;
      }

      return data;
    }, []);

  const fetchNotifications = useCallback(async () => {
    if (!authUser?.id) return;
    setLoading(true);
    let notifs: Notification[] = [];

    try {
      if (esConsejo) {
    const consejoData = await fetchConsejoDataForUser(authUser.id);
    
    if (consejoData) {
      const idConsejo = consejoData.id_consejo;
      
      // Campos faltantes del consejo
      const missingFields = checkMissingFieldsConsejo(consejoData);
      missingFields.forEach(field => {
        notifs.push({
          id: `consejo_campo_${field.field}`,
          title: `⚠️ Campo faltante en consejo: ${field.label}`,
          type: 'warning',
          date: new Date().toISOString(),
          read: readNotificationsRef.current.has(`consejo_campo_${field.field}`),
          route: field.route,
        });
      });
      
      // RIF del consejo próximo a vencer
      checkConsejoRifVencimiento(consejoData).forEach(venc => {
        notifs.push({ ...venc, date: new Date().toISOString(), read: readNotificationsRef.current.has(venc.id) });
      });
      
      // Documentos faltantes
      checkMissingConsejoDocuments(consejoData).forEach(doc => {
        notifs.push({
          id: `consejo_doc_${doc.tipo}`,
          title: `📎 ${doc.label} faltante`,
          type: 'error',
          date: new Date().toISOString(),
          read: readNotificationsRef.current.has(`consejo_doc_${doc.tipo}`),
          route: doc.route,
        });
      });
      
      // Vencimiento de vocerías del consejo
      (await checkVocerosConsejoVencimiento(idConsejo)).forEach(venc => {
        notifs.push({ ...venc, date: new Date().toISOString(), read: readNotificationsRef.current.has(venc.id) });
      });

      // Obtener voceros
      const { data: voceros } = await supabase
        .from('voceros')
        .select('*')
        .eq('id_consejo', idConsejo);
      
      if (voceros?.length) {
        for (const vocero of voceros) {
          checkVoceroConsejoMissingFields(vocero).forEach(field => {
            notifs.push({
              id: `vocero_consejo_campo_${vocero.id_vocero}_${field.field}`,
              title: `⚠️ Vocero ${vocero.nombre_completo}: falta ${field.label}`,
              type: 'warning',
              date: new Date().toISOString(),
              read: readNotificationsRef.current.has(`vocero_consejo_campo_${vocero.id_vocero}_${field.field}`),
              route: field.route,
            });
          });
        }
        
        (await checkVoceroConsejoRifVencimiento(idConsejo)).forEach(venc => {
          notifs.push({ ...venc, date: new Date().toISOString(), read: readNotificationsRef.current.has(venc.id) });
        });
        
        (await checkVoceroConsejoMissingDocuments(idConsejo)).forEach(doc => {
          notifs.push({ ...doc, date: new Date().toISOString(), read: readNotificationsRef.current.has(doc.id) });
        });
      }
    }
    
    // Respuestas a tickets de soporte
    (await checkNuevasRespuestasSoporte(authUser.id)).forEach(resp => {
      notifs.push({ ...resp, date: new Date().toISOString(), read: readNotificationsRef.current.has(resp.id) });
    });
        
      } else if (esComuna) {
        // Notificaciones para COMUNA
        const comunaData = await fetchComunaDataForUser(authUser.id);
        if (comunaData) {
          const idComuna = comunaData.id_comuna;
          
          const missingFields = checkMissingFieldsComuna(comunaData);
          missingFields.forEach(field => {
            notifs.push({
              id: `comuna_campo_${field.field}`,
              title: `⚠️ Campo faltante en comuna: ${field.label}`,
              type: 'warning',
              date: new Date().toISOString(),
              read: readNotificationsRef.current.has(`comuna_campo_${field.field}`),
              route: field.route,
            });
          });
          
          checkVoceriasVencimientoComuna(comunaData).forEach(venc => {
            notifs.push({ ...venc, date: new Date().toISOString(), read: readNotificationsRef.current.has(venc.id) });
          });
          
          checkComunaRifVencimiento(comunaData).forEach(venc => {
            notifs.push({ ...venc, date: new Date().toISOString(), read: readNotificationsRef.current.has(venc.id) });
          });
          
          checkMissingComunaDocuments(comunaData).forEach(doc => {
            notifs.push({
              id: `comuna_doc_${doc.tipo}`,
              title: `📎 ${doc.label} faltante`,
              type: 'error',
              date: new Date().toISOString(),
              read: readNotificationsRef.current.has(`comuna_doc_${doc.tipo}`),
              route: doc.route,
            });
          });

          const { data: responsables } = await supabase
            .from('responsables_gestion_comuna')
            .select('*')
            .eq('id_comuna', idComuna);
          
          if (responsables?.length) {
            for (const responsable of responsables) {
              checkResponsableMissingFields(responsable).forEach(field => {
                notifs.push({
                  id: `responsable_campo_${responsable.id_responsable}_${field.field}`,
                  title: `⚠️ Responsable ${responsable.nombre_g}: falta ${field.label}`,
                  type: 'warning',
                  date: new Date().toISOString(),
                  read: readNotificationsRef.current.has(`responsable_campo_${responsable.id_responsable}_${field.field}`),
                  route: field.route,
                });
              });
            }
            
            (await checkResponsableRifVencimiento(idComuna)).forEach(venc => {
              notifs.push({ ...venc, date: new Date().toISOString(), read: readNotificationsRef.current.has(venc.id) });
            });
            
            (await checkResponsableMissingDocuments(idComuna)).forEach(doc => {
              notifs.push({ ...doc, date: new Date().toISOString(), read: readNotificationsRef.current.has(doc.id) });
            });
          }

          const { data: vocerosComuna } = await supabase
            .from('voceros_comuna')
            .select('*')
            .eq('id_comuna', idComuna);
          
          if (vocerosComuna?.length) {
            for (const vocero of vocerosComuna) {
              checkVoceroComunaMissingFields(vocero).forEach(field => {
                notifs.push({
                  id: `vocero_comuna_campo_${vocero.id_voceroc}_${field.field}`,
                  title: `⚠️ Vocero ${vocero.nombre_completo}: falta ${field.label}`,
                  type: 'warning',
                  date: new Date().toISOString(),
                  read: readNotificationsRef.current.has(`vocero_comuna_campo_${vocero.id_voceroc}_${field.field}`),
                  route: field.route,
                });
              });
            }
            
            (await checkVoceroComunaRifVencimiento(idComuna)).forEach(venc => {
              notifs.push({ ...venc, date: new Date().toISOString(), read: readNotificationsRef.current.has(venc.id) });
            });
            
            (await checkVoceroComunaMissingDocuments(idComuna)).forEach(doc => {
              notifs.push({ ...doc, date: new Date().toISOString(), read: readNotificationsRef.current.has(doc.id) });
            });
          }
        }
        
        (await checkNuevasRespuestasSoporte(authUser.id)).forEach(resp => {
          notifs.push({ ...resp, date: new Date().toISOString(), read: readNotificationsRef.current.has(resp.id) });
        });
        
      } else if (esSala) {
        // Notificaciones para SALA DE AUTOGOBIERNO
        const { data: salaData } = await supabase
          .from('datos_sala_autogobierno')
          .select('*')
          .eq('id_usuario', authUser.id)
          .maybeSingle();
        
        if (salaData) {
          const idSala = salaData.id_sala;
          
          const missingFields = checkMissingSalaFields(salaData);
          missingFields.forEach(field => {
            notifs.push({
              id: `sala_campo_${field.field}`,
              title: `⚠️ Campo faltante en sala: ${field.label}`,
              type: 'warning',
              date: new Date().toISOString(),
              read: readNotificationsRef.current.has(`sala_campo_${field.field}`),
              route: field.route,
            });
          });
          
          (await checkSalaInfraestructura(idSala)).forEach(notif => {
            notifs.push({ ...notif, date: new Date().toISOString(), read: readNotificationsRef.current.has(notif.id) });
          });
          
          (await checkSalaEquipos(idSala)).forEach(notif => {
            notifs.push({ ...notif, date: new Date().toISOString(), read: readNotificationsRef.current.has(notif.id) });
          });
        }
        
        (await checkNuevasRespuestasSoporte(authUser.id)).forEach(resp => {
          notifs.push({ ...resp, date: new Date().toISOString(), read: readNotificationsRef.current.has(resp.id) });
        });
        
      } else if (esDirectorDigitalizacion) {
        // Notificaciones para DIRECTOR DE DIGITALIZACIÓN
        const [
          salasInactivas,
          consejosDocs,
          comunasDocs,
          rifVencido,
          nuevosRegistrosEntidades,
          salasSinEvaluar,
          nudosProyectosRendiciones,
          registrosAlfabetizacion,
          respuestasSoporte
        ] = await Promise.all([
          checkSalasInactivas(),
          checkConsejosDocumentosFaltantes(),
          checkComunasDocumentosFaltantes(),
          checkRifVencidoGeneral(),
          checkNuevosRegistros(),
          checkSalasSinEvaluar(),
          checkNuevosNudosProyectosRendiciones(),
          checkNuevosRegistrosAlfabetizacion(),
          checkRespuestasSoporte()
        ]);
        
        const addMeta = (notif: any) => ({
          ...notif,
          date: notif.date || new Date().toISOString(),
          read: readNotificationsRef.current.has(notif.id)
        });
        
        notifs.push(...salasInactivas.map(addMeta));
        notifs.push(...consejosDocs.map(addMeta));
        notifs.push(...comunasDocs.map(addMeta));
        notifs.push(...rifVencido.map(addMeta));
        notifs.push(...nuevosRegistrosEntidades.map(addMeta));
        notifs.push(...salasSinEvaluar.map(addMeta));
        notifs.push(...nudosProyectosRendiciones.map(addMeta));
        notifs.push(...registrosAlfabetizacion.map(addMeta));
        notifs.push(...respuestasSoporte.map(addMeta));
        
      } else if (esDirectorAdultoMayor) {
        const [
          salasInactivas,
          consejosDocs,
          comunasDocs,
          rifVencido,
          nuevosRegistrosEntidades,
          salasSinEvaluar,
          nudosProyectosRendiciones,
          nuevosAdultosMayores,
          respuestasSoporte
        ] = await Promise.all([
          checkSalasInactivas(),
          checkConsejosDocumentosFaltantes(),
          checkComunasDocumentosFaltantes(),
          checkRifVencidoGeneral(),
          checkNuevosRegistros(),
          checkSalasSinEvaluar(),
          checkNuevosNudosProyectosRendiciones(),
          checkNuevosAdultosMayores(),
          checkRespuestasSoporte()
        ]);
        
        const addMeta = (notif: any) => ({
          ...notif,
          date: notif.date || new Date().toISOString(),
          read: readNotificationsRef.current.has(notif.id)
        });
        
        notifs.push(...salasInactivas.map(addMeta));
        notifs.push(...consejosDocs.map(addMeta));
        notifs.push(...comunasDocs.map(addMeta));
        notifs.push(...rifVencido.map(addMeta));
        notifs.push(...nuevosRegistrosEntidades.map(addMeta));
        notifs.push(...salasSinEvaluar.map(addMeta));
        notifs.push(...nudosProyectosRendiciones.map(addMeta));
        notifs.push(...nuevosAdultosMayores.map(addMeta));
        notifs.push(...respuestasSoporte.map(addMeta));
        
      } else if (esDirectorFormacionPlanificacion) {
        // NOTIFICACIONES PARA DIRECTOR DE FORMACIÓN Y PLANIFICACIÓN
        // Mismo que digitalización pero sin alfabetización, con cursos/talleres nuevos
        const [
          salasInactivas,
          consejosDocs,
          comunasDocs,
          rifVencido,
          nuevosRegistrosEntidades,
          salasSinEvaluar,
          nudosProyectosRendiciones,
          nuevosCursosTalleres,
          respuestasSoporte
        ] = await Promise.all([
          checkSalasInactivas(),
          checkConsejosDocumentosFaltantes(),
          checkComunasDocumentosFaltantes(),
          checkRifVencidoGeneral(),
          checkNuevosRegistros(),
          checkSalasSinEvaluar(),
          checkNuevosNudosProyectosRendiciones(),
          checkNuevosCursosTalleres(),
          checkRespuestasSoporte()
        ]);
        
        const addMeta = (notif: any) => ({
          ...notif,
          date: notif.date || new Date().toISOString(),
          read: readNotificationsRef.current.has(notif.id)
        });
        
        notifs.push(...salasInactivas.map(addMeta));
        notifs.push(...consejosDocs.map(addMeta));
        notifs.push(...comunasDocs.map(addMeta));
        notifs.push(...rifVencido.map(addMeta));
        notifs.push(...nuevosRegistrosEntidades.map(addMeta));
        notifs.push(...salasSinEvaluar.map(addMeta));
        notifs.push(...nudosProyectosRendiciones.map(addMeta));
        notifs.push(...nuevosCursosTalleres.map(addMeta));
        notifs.push(...respuestasSoporte.map(addMeta));
        
      } else if (esDirectorComunas) {
        // Notificaciones para DIRECTOR DE COMUNAS
        const [
          salasInactivas,
          consejosDocs,
          comunasDocs,
          rifVencido,
          nuevosRegistrosEntidades,
          salasSinEvaluar,
          nudosProyectosRendiciones,
          nuevosConsejosPendientes,
          respuestasSoporte
        ] = await Promise.all([
          checkSalasInactivas(),
          checkConsejosDocumentosFaltantes(),
          checkComunasDocumentosFaltantes(),
          checkRifVencidoGeneral(),
          checkNuevosRegistros(),
          checkSalasSinEvaluar(),
          checkNuevosNudosProyectosRendiciones(),
          checkNuevosConsejosPendientes(),
          checkRespuestasSoporte()
        ]);
        
        const addMeta = (notif: any) => ({
          ...notif,
          date: notif.date || new Date().toISOString(),
          read: readNotificationsRef.current.has(notif.id)
        });
        
        notifs.push(...salasInactivas.map(addMeta));
        notifs.push(...consejosDocs.map(addMeta));
        notifs.push(...comunasDocs.map(addMeta));
        notifs.push(...rifVencido.map(addMeta));
        notifs.push(...nuevosRegistrosEntidades.map(addMeta));
        notifs.push(...salasSinEvaluar.map(addMeta));
        notifs.push(...nudosProyectosRendiciones.map(addMeta));
        notifs.push(...nuevosConsejosPendientes.map(addMeta));
        notifs.push(...respuestasSoporte.map(addMeta));
      }
    } catch (error) {
      console.error('Error fetching notifications:', error);
    }

    const notifsWithDate = notifs.map(n => ({
      ...n,
      date: n.date || new Date().toISOString()
    }));
    
    const uniqueNotifs = notifsWithDate.filter((n, i, self) => 
      i === self.findIndex(n2 => n2.id === n.id)
    );
    
    const sorted = uniqueNotifs.sort((a, b) => 
      new Date(b.date).getTime() - new Date(a.date).getTime()
    );
    
    if (isMounted.current) {
      setNotifications(sorted);
      setLoading(false);
    }
  }, [authUser?.id, esConsejo, esComuna, esSala, esDirectorDigitalizacion, esDirectorAdultoMayor, esDirectorFormacionPlanificacion, esDirectorComunas, fetchConsejoDataForUser, fetchComunaDataForUser]);

  useEffect(() => {
    isMounted.current = true;
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 5 * 60 * 1000);
    return () => {
      isMounted.current = false;
      clearInterval(interval);
    };
  }, [fetchNotifications]);

  useEffect(() => {
    if (!authUser?.id) return;

    let channel: any;
    
      if (esConsejo) {
        channel = supabase
          .channel('notifications-page-consejo')
          .on('postgres_changes', { event: '*', schema: 'public', table: 'datos_consejo_comunal' }, () => fetchNotifications())
          .on('postgres_changes', { event: '*', schema: 'public', table: 'voceros' }, () => fetchNotifications())
          .on('postgres_changes', { event: '*', schema: 'public', table: 'soporte', filter: `id_usuario=eq.${authUser.id}` }, () => fetchNotifications())
          .subscribe();
      } else if (esComuna) {
      channel = supabase
        .channel('notifications-page-comuna')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'datos_comuna', filter: `id_usuario=eq.${authUser.id}` }, () => fetchNotifications())
        .on('postgres_changes', { event: '*', schema: 'public', table: 'responsables_gestion_comuna', filter: `id_comuna=in.(select id_comuna from datos_comuna where id_usuario='${authUser.id}')` }, () => fetchNotifications())
        .on('postgres_changes', { event: '*', schema: 'public', table: 'voceros_comuna', filter: `id_comuna=in.(select id_comuna from datos_comuna where id_usuario='${authUser.id}')` }, () => fetchNotifications())
        .on('postgres_changes', { event: '*', schema: 'public', table: 'soporte', filter: `id_usuario=eq.${authUser.id}` }, () => fetchNotifications())
        .subscribe();
    } else if (esSala) {
      channel = supabase
        .channel('notifications-page-sala')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'datos_sala_autogobierno', filter: `id_usuario=eq.${authUser.id}` }, () => fetchNotifications())
        .on('postgres_changes', { event: '*', schema: 'public', table: 'infraestructura_sala', filter: `id_sala=in.(select id_sala from datos_sala_autogobierno where id_usuario='${authUser.id}')` }, () => fetchNotifications())
        .on('postgres_changes', { event: '*', schema: 'public', table: 'soporte', filter: `id_usuario=eq.${authUser.id}` }, () => fetchNotifications())
        .subscribe();
    } else if (esDirectorDigitalizacion) {
      channel = supabase
        .channel('notifications-page-director')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'datos_sala_autogobierno' }, () => fetchNotifications())
        .on('postgres_changes', { event: '*', schema: 'public', table: 'datos_consejo_comunal' }, () => fetchNotifications())
        .on('postgres_changes', { event: '*', schema: 'public', table: 'datos_comuna' }, () => fetchNotifications())
        .on('postgres_changes', { event: '*', schema: 'public', table: 'voceros' }, () => fetchNotifications())
        .on('postgres_changes', { event: '*', schema: 'public', table: 'voceros_comuna' }, () => fetchNotifications())
        .on('postgres_changes', { event: '*', schema: 'public', table: 'infraestructura_sala' }, () => fetchNotifications())
        .on('postgres_changes', { event: '*', schema: 'public', table: 'nudos_criticos' }, () => fetchNotifications())
        .on('postgres_changes', { event: '*', schema: 'public', table: 'proyectos' }, () => fetchNotifications())
        .on('postgres_changes', { event: '*', schema: 'public', table: 'rendiciones' }, () => fetchNotifications())
        .on('postgres_changes', { event: '*', schema: 'public', table: 'analfabetismo_digital' }, () => fetchNotifications())
        .on('postgres_changes', { event: '*', schema: 'public', table: 'soporte' }, () => fetchNotifications())
        .subscribe();
    } else if (esDirectorAdultoMayor) {
      channel = supabase
        .channel('notifications-page-director-adulto-mayor')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'datos_sala_autogobierno' }, () => fetchNotifications())
        .on('postgres_changes', { event: '*', schema: 'public', table: 'datos_consejo_comunal' }, () => fetchNotifications())
        .on('postgres_changes', { event: '*', schema: 'public', table: 'datos_comuna' }, () => fetchNotifications())
        .on('postgres_changes', { event: '*', schema: 'public', table: 'voceros' }, () => fetchNotifications())
        .on('postgres_changes', { event: '*', schema: 'public', table: 'voceros_comuna' }, () => fetchNotifications())
        .on('postgres_changes', { event: '*', schema: 'public', table: 'infraestructura_sala' }, () => fetchNotifications())
        .on('postgres_changes', { event: '*', schema: 'public', table: 'nudos_criticos' }, () => fetchNotifications())
        .on('postgres_changes', { event: '*', schema: 'public', table: 'proyectos' }, () => fetchNotifications())
        .on('postgres_changes', { event: '*', schema: 'public', table: 'rendiciones' }, () => fetchNotifications())
        .on('postgres_changes', { event: '*', schema: 'public', table: 'adultos_mayores' }, () => fetchNotifications())
        .on('postgres_changes', { event: '*', schema: 'public', table: 'soporte' }, () => fetchNotifications())
        .subscribe();
    } else if (esDirectorFormacionPlanificacion) {
      channel = supabase
        .channel('notifications-page-director-formacion-planificacion')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'datos_sala_autogobierno' }, () => fetchNotifications())
        .on('postgres_changes', { event: '*', schema: 'public', table: 'datos_consejo_comunal' }, () => fetchNotifications())
        .on('postgres_changes', { event: '*', schema: 'public', table: 'datos_comuna' }, () => fetchNotifications())
        .on('postgres_changes', { event: '*', schema: 'public', table: 'voceros' }, () => fetchNotifications())
        .on('postgres_changes', { event: '*', schema: 'public', table: 'voceros_comuna' }, () => fetchNotifications())
        .on('postgres_changes', { event: '*', schema: 'public', table: 'infraestructura_sala' }, () => fetchNotifications())
        .on('postgres_changes', { event: '*', schema: 'public', table: 'nudos_criticos' }, () => fetchNotifications())
        .on('postgres_changes', { event: '*', schema: 'public', table: 'proyectos' }, () => fetchNotifications())
        .on('postgres_changes', { event: '*', schema: 'public', table: 'rendiciones' }, () => fetchNotifications())
        .on('postgres_changes', { event: '*', schema: 'public', table: 'cursos' }, () => fetchNotifications())
        .on('postgres_changes', { event: '*', schema: 'public', table: 'soporte' }, () => fetchNotifications())
        .subscribe();
    } else if (esDirectorComunas) {
      channel = supabase
        .channel('notifications-page-director-comunas')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'datos_sala_autogobierno' }, () => fetchNotifications())
        .on('postgres_changes', { event: '*', schema: 'public', table: 'datos_consejo_comunal' }, () => fetchNotifications())
        .on('postgres_changes', { event: '*', schema: 'public', table: 'datos_comuna' }, () => fetchNotifications())
        .on('postgres_changes', { event: '*', schema: 'public', table: 'voceros' }, () => fetchNotifications())
        .on('postgres_changes', { event: '*', schema: 'public', table: 'voceros_comuna' }, () => fetchNotifications())
        .on('postgres_changes', { event: '*', schema: 'public', table: 'infraestructura_sala' }, () => fetchNotifications())
        .on('postgres_changes', { event: '*', schema: 'public', table: 'nudos_criticos' }, () => fetchNotifications())
        .on('postgres_changes', { event: '*', schema: 'public', table: 'proyectos' }, () => fetchNotifications())
        .on('postgres_changes', { event: '*', schema: 'public', table: 'rendiciones' }, () => fetchNotifications())
        .on('postgres_changes', { event: '*', schema: 'public', table: 'soporte' }, () => fetchNotifications())
        .subscribe();
    }

    return () => {
      if (channel) supabase.removeChannel(channel);
    };
  }, [fetchNotifications, authUser?.id, esConsejo, esComuna, esSala, esDirectorDigitalizacion, esDirectorAdultoMayor, esDirectorFormacionPlanificacion, esDirectorComunas]);

  const handleActionClick = useCallback((notification: Notification) => {
    if (!notification.read) {
      markNotificationRead(notification.id);
    }

    const routeMap: Record<string, string> = {
      'organizacion': 'organizacion',
      'documentacion': 'documentacion',
      'voceros': 'vocerias',
      'vocerias': 'vocerias',
      'consejopec': 'consejopec',
      'datos-legales': 'documentacion',
      'soporte': 'soporte',
      'infraestructura': 'infraestructura',
      'gestion': 'gestion',
      'liderazgo': 'liderazgo',
      'validacion': 'validacion',
      'alfa': 'alfa',
      'ayuda': 'ayuda',
      'social': 'salud',
      'formacion': 'formacion'
    };
    
    const section = routeMap[notification.route] || notification.route;
    window.dispatchEvent(new CustomEvent('navigateToSection', { detail: { section } }));
    router.push('/dashboard');
  }, [markNotificationRead, router]);

  const markAllAsRead = useCallback(() => {
    if (isUpdating) return;
    setIsUpdating(true);
    
    const allIds = notifications.map(n => n.id);
    const newReadIds = [...new Set([...Array.from(readNotificationsRef.current), ...allIds])];
    saveReadNotifications(newReadIds);
    
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
    
    setTimeout(() => setIsUpdating(false), 100);
  }, [notifications, saveReadNotifications, isUpdating]);

  const clearReadCache = useCallback(() => {
    if (isUpdating) return;
    if (confirm("¿Desea restablecer el historial visual de notificaciones?")) {
      setIsUpdating(true);
      if (typeof window !== 'undefined' && authUser?.id) {
        localStorage.removeItem(`readNotifications_${authUser.id}`);
        setReadNotifications(new Set());
        setNotifications(prev => prev.map(n => ({ ...n, read: false })));
        emitNotificationsUpdate();
      }
      setTimeout(() => setIsUpdating(false), 100);
    }
  }, [authUser?.id, isUpdating]);

  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = notifications.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(notifications.length / itemsPerPage);

  if (loading && notifications.length === 0) {
    return (
      <div className="flex justify-center items-center min-h-[60vh]">
        <Loader2 className="animate-spin text-brand-primary" size={48} />
      </div>
    );
  }

 return (
  <div className="w-full min-h-screen p-2 md:p-2">
    <div className="max-w-9xl mx-auto space-y-6">
      {/* Encabezado - sin sticky para evitar el problema */}
      <div className="bg-white rounded-3xl p-6 border border-gray-100 shadow-sm flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="h-14 w-14 rounded-2xl bg-linear-to-br from-brand-primary/20 to-brand-primary/5 flex items-center justify-center">
            <Bell className="h-7 w-7 text-brand-primary" />
          </div>
          <div>
            <h3 className="text-lg font-black text-slate-800 uppercase tracking-tighter">
              Centro de Notificaciones
            </h3>
            <p className="text-[10px] text-slate-400 font-medium">
              {notifications.length} alerta{notifications.length !== 1 ? 's' : ''} activa{notifications.length !== 1 ? 's' : ''}
            </p>
          </div>
        </div>
        
        {notifications.length > 0 && (
          <div className="flex gap-2">
            <button 
              onClick={markAllAsRead}
              disabled={isUpdating}
              className="px-4 py-2.5 rounded-xl bg-brand-primary text-white text-[9px] font-black uppercase tracking-wider shadow-md hover:scale-105 active:scale-95 transition-all flex items-center gap-2 disabled:opacity-70"
            >
              <CheckSquare className="h-3.5 w-3.5" /> 
              Marcar todo leído
            </button>
            <button 
              onClick={clearReadCache}
              disabled={isUpdating}
              className="px-4 py-2.5 rounded-xl bg-slate-100 border border-gray-200 text-slate-600 hover:text-rose-600 hover:bg-rose-50 text-[9px] font-black uppercase tracking-wider transition-all flex items-center gap-2 disabled:opacity-70"
            >
              <Trash2 className="h-3.5 w-3.5" /> 
              Reiniciar
            </button>
          </div>
        )}
      </div>

      {/* Contenedor de notificaciones - con fondo y z-index adecuado */}
      <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden relative z-0">
        <div className="divide-y divide-gray-100">
          <AnimatePresence mode="popLayout">
            {currentItems.length > 0 ? (
              currentItems.map((notif, idx) => {
                const isRead = notif.read;
                let typeColor = "";
                if (notif.type === 'error') typeColor = "border-l-4 border-l-rose-500";
                else if (notif.type === 'warning') typeColor = "border-l-4 border-l-amber-500";
                else if (notif.type === 'success') typeColor = "border-l-4 border-l-emerald-500";
                else typeColor = "border-l-4 border-l-blue-500";
                return (
                  <motion.div
                    key={notif.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    transition={{ delay: idx * 0.03 }}
                    className={cn(
                      "p-5 transition-all duration-150 hover:bg-slate-50/50",
                      !isRead && "bg-linear-to-r from-amber-50/30 to-transparent",
                      typeColor
                    )}
                  >
                    <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                      <div className="flex items-start gap-4 flex-1">
                        <div className={cn(
                          "p-2.5 rounded-xl shrink-0",
                          notif.type === 'error' ? "bg-rose-100 text-rose-600" : 
                          notif.type === 'warning' ? "bg-amber-100 text-amber-600" : 
                          notif.type === 'success' ? "bg-emerald-100 text-emerald-600" :
                          "bg-blue-100 text-blue-600"
                        )}>
                          {notif.type === 'error' && <AlertCircle className="h-5 w-5" />}
                          {notif.type === 'warning' && <AlertTriangle className="h-5 w-5" />}
                          {notif.type === 'success' && <CheckCircle className="h-5 w-5" />}
                          {notif.type === 'info' && <MessageSquare className="h-5 w-5" />}
                        </div>

                        <div className="flex-1 min-w-0">
                          <div className="flex flex-wrap items-center gap-2 mb-1">
                            <p className={cn(
                              "text-sm font-black leading-tight",
                              isRead ? "text-slate-500" : "text-slate-800"
                            )}>
                              {notif.title}
                            </p>
                            {!isRead && (
                              <span className="text-[8px] font-black px-2 py-0.5 bg-rose-500 text-white rounded-full animate-pulse">
                                NUEVA
                              </span>
                            )}
                          </div>
                          <p className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">
                            <Calendar className="h-3 w-3 inline mr-1 mb-0.5" />
                            {new Date(notif.date).toLocaleDateString('es-VE', {
                              year: 'numeric',
                              month: 'long',
                              day: 'numeric'
                            })}
                          </p>
                        </div>
                      </div>

                      <button
                        onClick={() => handleActionClick(notif)}
                        className={cn(
                          "px-6 py-3 rounded-xl text-[10px] font-black uppercase tracking-wider flex items-center justify-center gap-2 border shadow-sm transition-all",
                          !isRead 
                            ? "bg-rose-50 border-rose-200 text-rose-700 hover:bg-rose-600 hover:text-white hover:border-rose-600"
                            : "bg-slate-50 border-slate-200 text-slate-600 hover:bg-brand-primary hover:text-white hover:border-brand-primary"
                        )}
                      >
                        <span>Gestionar Trámite</span>
                        <ExternalLink className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </motion.div>
                );
              })
            ) : (
              <div className="text-center py-20">
                <Bell className="h-16 w-16 text-slate-200 mx-auto mb-4" />
                <p className="text-base font-black text-slate-400 uppercase tracking-wider">
                  Sin alertas preventivas
                </p>
                <p className="text-xs text-slate-300 mt-1">
                  Toda la documentación y registros legales están al día.
                </p>
              </div>
            )}
          </AnimatePresence>
        </div>

        {totalPages > 1 && (
          <div className="p-5 border-t border-gray-100 bg-slate-50/30 flex flex-col sm:flex-row items-center justify-between gap-4">
            <p className="text-[9px] font-black text-slate-400 uppercase tracking-wider">
              Mostrando {indexOfFirstItem + 1}-{Math.min(indexOfLastItem, notifications.length)} de {notifications.length} notificaciones
            </p>
            <div className="flex gap-2">
              <button 
                onClick={() => setCurrentPage(p => Math.max(p - 1, 1))} 
                disabled={currentPage === 1}
                className="p-2.5 rounded-xl bg-white border border-gray-200 text-slate-500 hover:text-brand-primary disabled:opacity-40 disabled:cursor-not-allowed transition-all shadow-sm"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
              <div className="flex gap-1">
                {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                  let pageNum;
                  if (totalPages <= 5) {
                    pageNum = i + 1;
                  } else if (currentPage <= 3) {
                    pageNum = i + 1;
                  } else if (currentPage >= totalPages - 2) {
                    pageNum = totalPages - 4 + i;
                  } else {
                    pageNum = currentPage - 2 + i;
                  }
                  return (
                    <button
                      key={pageNum}
                      onClick={() => setCurrentPage(pageNum)}
                      className={cn(
                        "w-9 h-9 rounded-xl text-[11px] font-black transition-all",
                        currentPage === pageNum
                          ? "bg-brand-primary text-white shadow-md"
                          : "bg-white border border-gray-200 text-slate-500 hover:bg-slate-50"
                      )}
                    >
                      {pageNum}
                    </button>
                  );
                })}
              </div>
              <button 
                onClick={() => setCurrentPage(p => Math.min(p + 1, totalPages))} 
                disabled={currentPage === totalPages}
                className="p-2.5 rounded-xl bg-white border border-gray-200 text-slate-500 hover:text-brand-primary disabled:opacity-40 disabled:cursor-not-allowed transition-all shadow-sm"
              >
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  </div>
);
}