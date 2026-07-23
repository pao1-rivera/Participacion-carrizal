'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Users, HeartPulse, Activity, Baby, UserCircle, Flame, Zap, Bus, GraduationCap,
  Home, CheckCircle, AlertCircle, Loader2, X, Award, Plug, Shield, UserPlus, Briefcase,
  UserX, UserCog, UserCheck, MoveRight, Calendar, FileText
} from 'lucide-react';
import { cn } from '@/app/lib/utils';
import { supabase } from '@/app/lib/supabaseClient';
import { useAuth } from '@/context/AuthContext';

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
  trabajo_a: string;
  migrado: boolean;
  fecha_migracion: string | null;
  motivo_migracion: string | null;
  centro_votacion?: string;
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
  jefe: {
    nombres: string;
    apellidos: string;
    cedula: string;
    edad: number;
    sexo?: string;
    enfermedad?: string;
    cne?: string;
    discapacidad?: string;
    pensionado?: string;
    trabaja_actualmente?: string;
    migrado?: boolean;
    fecha_migracion?: string | null;
    motivo_migracion?: string | null;
  };
  familiares: Familiar[];
  gas?: any; // jsonb
  sistema_electrico?: any; // jsonb
  misiones?: Misiones;
}

// ==================== UTILIDADES ====================
const esAfirmativo = (valor: any): boolean => {
  if (valor === undefined || valor === null) return false;
  if (typeof valor === 'boolean') return valor === true;
  if (typeof valor === 'number') return valor === 1;
  if (typeof valor === 'string') {
    const v = valor.toLowerCase().trim();
    return v === 'sí' || v === 'si' || v === 's' || v === 'true' || v === '1' || v === 'x';
  }
  return false;
};

const tieneGas = (gas: any): boolean => {
  if (!gas) return false;
  if (typeof gas === 'object') {
    if (gas.bombona === true) return true;
    if ((gas.kg_10 || 0) > 0) return true;
    if ((gas.kg_18 || 0) > 0) return true;
    if ((gas.kg_43 || 0) > 0) return true;
    return false;
  }
  if (typeof gas === 'string') {
    try { return tieneGas(JSON.parse(gas)); } catch { return esAfirmativo(gas); }
  }
  return false;
};

const tieneSistemaElectrico = (sistema: any): boolean => {
  if (!sistema) return false;
  if (typeof sistema === 'object') {
    // Si el objeto no está vacío, asumimos que tiene sistema eléctrico
    return Object.keys(sistema).length > 0;
  }
  if (typeof sistema === 'string') {
    try { return tieneSistemaElectrico(JSON.parse(sistema)); } catch { return esAfirmativo(sistema); }
  }
  return false;
};

// ==================== COMPONENTES DE TARJETA ====================
const AgeGroupCard = ({ title, total, female, male, icon, onClick, isClickable = false }: { title: string; total: number; female: number; male: number; icon?: React.ReactNode; onClick?: () => void; isClickable?: boolean }) => (
  <div 
    onClick={onClick}
    className={cn(
      "bg-white p-4 rounded-2xl border border-slate-100 shadow-sm hover:shadow-md transition-all",
      isClickable ? "cursor-pointer hover:border-brand-primary/50" : ""
    )}
  >
    <div className="flex items-center justify-between mb-2">
      <div className="flex items-center gap-2">
        {icon && <div className="text-brand-primary">{icon}</div>}
        <h4 className="text-[9px] font-black text-slate-400 uppercase tracking-widest">{title}</h4>
      </div>
      <span className="text-lg font-black text-slate-800">{total}</span>
    </div>
    <div className="flex gap-3 mt-2 pt-2 border-t border-slate-50">
      <div className="flex-1 text-center">
        <span className="text-[8px] font-bold text-pink-500 block">♀ Mujeres</span>
        <span className="text-sm font-black text-slate-700">{female}</span>
      </div>
      <div className="flex-1 text-center">
        <span className="text-[8px] font-bold text-blue-500 block">♂ Hombres</span>
        <span className="text-sm font-black text-slate-700">{male}</span>
      </div>
    </div>
  </div>
);

const ServiceCard = ({ icon, label, value, subtext, onClick, isClickable }: { icon: React.ReactNode; label: string; value: string | number; subtext?: string; onClick?: () => void; isClickable?: boolean }) => (
  <div 
    onClick={onClick}
    className={cn(
      "bg-white p-4 rounded-2xl border border-slate-100 shadow-sm flex items-start gap-3 transition-all",
      isClickable ? "cursor-pointer hover:shadow-md hover:border-brand-primary/50" : ""
    )}
  >
    <div className="w-8 h-8 rounded-xl bg-brand-primary/10 flex items-center justify-center text-brand-primary shrink-0">
      {icon}
    </div>
    <div>
      <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">{label}</p>
      <p className="text-lg font-black text-slate-800 leading-tight">{value}</p>
      {subtext && <p className="text-[8px] text-slate-400 mt-0.5">{subtext}</p>}
    </div>
  </div>
);

// ==================== COMPONENTE PRINCIPAL ====================
export const DinaPoblacional = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [fichas, setFichas] = useState<FichaCensada[]>([]);
  const [modalMisionesOpen, setModalMisionesOpen] = useState(false);
  const [modalEnfermedadesOpen, setModalEnfermedadesOpen] = useState(false);
  const [modalMigrantesOpen, setModalMigrantesOpen] = useState(false);
  const [modalDiscapacidadesOpen, setModalDiscapacidadesOpen] = useState(false);
  const [modalDesempleadosOpen, setModalDesempleadosOpen] = useState(false);
  const [enfermedadesList, setEnfermedadesList] = useState<{ nombre: string; cantidad: number }[]>([]);
  const [migrantesList, setMigrantesList] = useState<{ nombre: string; fecha: string; motivo: string }[]>([]);
  const [discapacidadesList, setDiscapacidadesList] = useState<{ nombre: string; cantidad: number }[]>([]);
  const [desempleadosList, setDesempleadosList] = useState<{ nombre: string; edad: number }[]>([]);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Cargar todas las fichas (RLS se encarga)
  const cargarDatos = async () => {
    setLoading(true);
    setErrorMsg(null);
    try {
      const { data: fichasData, error: fichasError } = await supabase
        .from('censo_fichas')
        .select('*')
        .order('created_at', { ascending: false });

      if (fichasError) throw fichasError;

      if (!fichasData || fichasData.length === 0) {
        setFichas([]);
        setLoading(false);
        return;
      }

      const fichasIds = fichasData.map(f => f.id_ficha);
      const { data: familiaresData, error: familiaresError } = await supabase
        .from('censo_familiares')
        .select('*')
        .in('id_ficha', fichasIds);

      if (familiaresError) throw familiaresError;

      const familiaresPorFicha = new Map<string, any[]>();
      familiaresData?.forEach(fam => {
        if (!familiaresPorFicha.has(fam.id_ficha)) familiaresPorFicha.set(fam.id_ficha, []);
        familiaresPorFicha.get(fam.id_ficha)!.push(fam);
      });

      const fichasCompletas: FichaCensada[] = fichasData.map(f => {
        const familiares = (familiaresPorFicha.get(f.id_ficha) || []).map(fam => ({
          numero: fam.numero || 0,
          nombreApellido: `${fam.nombre_familiar || ''} ${fam.apellido_familiar || ''}`.trim(),
          sexo: fam.sexo || 'S/D',
          cedula: fam.cedula || '',
          fechaNacimiento: fam.fecha_nacimiento || '',
          edad: fam.edad || 0,
          cne: fam.cne || '',
          discapacidad: fam.discapacidad || 'No',
          enfermedad: fam.enfermedad || '',
          embarazo: fam.embarazo || 'No',
          parentesco: fam.parentesco || 'Otros',
          instruccion: fam.instruccion || 'S/D',
          oficio: fam.oficio || 'S/D',
          pensionado: fam.pensionado || 'No',
          trabajo_a: fam.trabajo_a || '',
          migrado: fam.migrado || false,
          fecha_migracion: fam.fecha_migracion || null,
          motivo_migracion: fam.motivo_migracion || null,
          centro_votacion: fam.centro_votacion || ''
        }));

        let misionesObj: Misiones | undefined = undefined;
        if (f.misiones) {
          if (typeof f.misiones === 'string') {
            try { misionesObj = JSON.parse(f.misiones); } catch(e) {}
          } else { misionesObj = f.misiones; }
        }

        return {
          id_ficha: f.id_ficha,
          id_consejo: f.id_consejo,
          jefe: {
            nombres: f.nombres || '',
            apellidos: f.apellidos || '',
            cedula: f.cedula || '',
            edad: f.edad || 0,
            sexo: f.sexo || '',
            enfermedad: f.enfermedad || 'No aplica',
            cne: f.cne || '',
            discapacidad: f.discapacidad || 'No',
            pensionado: f.pensionado || 'No',
            trabaja_actualmente: f.trabaja_actualmente || '',
            migrado: f.migrado || false,
            fecha_migracion: f.fecha_migracion || null,
            motivo_migracion: f.motivo_migracion || null
          },
          familiares,
          gas: f.gas,
          sistema_electrico: f.sistema_electrico,
          misiones: misionesObj
        };
      });

      setFichas(fichasCompletas);
    } catch (error: any) {
      console.error('Error cargando datos censales:', error);
      setErrorMsg(error.message || 'Error al cargar los datos.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user?.id) cargarDatos();
    else setLoading(false);
  }, [user]);

  // ========== CÁLCULOS ==========
  const { gruposEtarios, servicios, enfermedadesTotales, migrantes, discapacidades, pensionados, desempleados, cneInscritos } = useMemo(() => {
    const grupos = {
      infantes: { total: 0, female: 0, male: 0 },
      ninos: { total: 0, female: 0, male: 0 },
      jovenes: { total: 0, female: 0, male: 0 },
      adultos: { total: 0, female: 0, male: 0 },
      adultosMayores: { total: 0, female: 0, male: 0 }
    };
    let bombonas = 0;
    let electrico = 0;
    let cneCount = 0;
    const enfermedadesMap = new Map<string, number>();
    const migrantesArr: { nombre: string; fecha: string; motivo: string }[] = [];
    const discapMap = new Map<string, number>();
    const desempleadosArr: { nombre: string; edad: number }[] = [];
    let pensionadosCount = 0;

    const procesarPersona = (
      nombre: string,
      edad: number,
      sexo: string,
      enfermedad?: string,
      cne?: string,
      discapacidad?: string,
      pensionado?: string,
      trabaja?: string,
      migrado?: boolean,
      fecha_migracion?: string | null,
      motivo_migracion?: string | null
    ) => {
      // Grupo etario
      const isFemale = sexo?.toLowerCase() === 'femenino';
      const isMale = sexo?.toLowerCase() === 'masculino';
      if (edad >= 0 && edad <= 5) {
        grupos.infantes.total++;
        if (isFemale) grupos.infantes.female++;
        else if (isMale) grupos.infantes.male++;
      } else if (edad >= 6 && edad <= 14) {
        grupos.ninos.total++;
        if (isFemale) grupos.ninos.female++;
        else if (isMale) grupos.ninos.male++;
      } else if (edad >= 15 && edad <= 29) {
        grupos.jovenes.total++;
        if (isFemale) grupos.jovenes.female++;
        else if (isMale) grupos.jovenes.male++;
      } else if (edad >= 30 && edad <= 54) {
        grupos.adultos.total++;
        if (isFemale) grupos.adultos.female++;
        else if (isMale) grupos.adultos.male++;
      } else if (edad >= 55) {
        grupos.adultosMayores.total++;
        if (isFemale) grupos.adultosMayores.female++;
        else if (isMale) grupos.adultosMayores.male++;
      }

      // CNE
      if (cne && cne.trim() !== '') cneCount++;

      // Enfermedades
      if (enfermedad && enfermedad.trim() !== '' && enfermedad.toLowerCase() !== 'no aplica' && enfermedad.toLowerCase() !== 'no') {
        const key = enfermedad.trim();
        enfermedadesMap.set(key, (enfermedadesMap.get(key) || 0) + 1);
      }

      // Discapacidad
      if (discapacidad && discapacidad.trim() !== '' && discapacidad.toLowerCase() !== 'no' && discapacidad.toLowerCase() !== 'ninguna') {
        const key = discapacidad.trim();
        discapMap.set(key, (discapMap.get(key) || 0) + 1);
      }

      // Pensionado
      if (esAfirmativo(pensionado)) pensionadosCount++;

      // Migrante
      if (migrado === true && fecha_migracion) {
        const nombreCompleto = nombre || 'Sin nombre';
        migrantesArr.push({
          nombre: nombreCompleto,
          fecha: fecha_migracion ? new Date(fecha_migracion).toLocaleDateString() : '—',
          motivo: motivo_migracion || 'No especificado'
        });
      }

      // Desempleado (>=18 años y no trabaja)
      if (edad >= 18 && !esAfirmativo(trabaja)) {
        desempleadosArr.push({
          nombre: nombre || 'Sin nombre',
          edad: edad
        });
      }
    };

    fichas.forEach(ficha => {
      // Jefe
      const j = ficha.jefe;
      procesarPersona(
        `${j.nombres} ${j.apellidos}`,
        j.edad,
        j.sexo || '',
        j.enfermedad,
        j.cne,
        j.discapacidad,
        j.pensionado,
        j.trabaja_actualmente,
        j.migrado,
        j.fecha_migracion,
        j.motivo_migracion
      );

      // Servicios de la vivienda
      if (tieneGas(ficha.gas)) bombonas++;
      if (tieneSistemaElectrico(ficha.sistema_electrico)) electrico++;

      // Familiares
      ficha.familiares.forEach(fam => {
        procesarPersona(
          fam.nombreApellido,
          fam.edad,
          fam.sexo,
          fam.enfermedad,
          fam.cne,
          fam.discapacidad,
          fam.pensionado,
          fam.trabajo_a,
          fam.migrado,
          fam.fecha_migracion,
          fam.motivo_migracion
        );
      });
    });

    const servicios = {
      bombonas,
      electrico,
      cne: cneCount
    };

    const enfermedadesList = Array.from(enfermedadesMap.entries())
      .map(([nombre, cantidad]) => ({ nombre, cantidad }))
      .sort((a, b) => b.cantidad - a.cantidad);

    const discapList = Array.from(discapMap.entries())
      .map(([nombre, cantidad]) => ({ nombre, cantidad }))
      .sort((a, b) => b.cantidad - a.cantidad);

    return {
      gruposEtarios: grupos,
      servicios,
      enfermedadesTotales: enfermedadesList,
      migrantes: migrantesArr,
      discapacidades: discapList,
      pensionados: pensionadosCount,
      desempleados: desempleadosArr,
      cneInscritos: cneCount
    };
  }, [fichas]);

  // Efecto para actualizar listas de modales
  useEffect(() => {
    setEnfermedadesList(enfermedadesTotales);
    setMigrantesList(migrantes);
    setDiscapacidadesList(discapacidades);
    setDesempleadosList(desempleados);
  }, [enfermedadesTotales, migrantes, discapacidades, desempleados]);

  if (loading) {
    return <div className="flex justify-center p-12"><Loader2 className="animate-spin text-brand-primary h-8 w-8" /></div>;
  }

  if (errorMsg) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-2xl p-6 text-center">
        <AlertCircle className="h-8 w-8 text-red-500 mx-auto mb-2" />
        <p className="text-sm font-bold text-red-700">{errorMsg}</p>
        <button onClick={cargarDatos} className="mt-4 px-4 py-2 bg-red-100 text-red-700 rounded-lg text-xs font-bold hover:bg-red-200">Reintentar</button>
      </div>
    );
  }

  if (fichas.length === 0) {
    return (
      <div className="bg-amber-50 border border-amber-200 rounded-2xl p-6 text-center">
        <AlertCircle className="h-8 w-8 text-amber-500 mx-auto mb-2" />
        <p className="text-sm font-bold text-amber-700">No se encontraron registros del censo</p>
        <p className="text-xs text-amber-600 mt-1">Aún no se han cargado fichas censales para esta entidad.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* === POBLACIÓN POR GRUPO ETARIO Y SEXO + MIGRANTES === */}
      <div className="bg-white rounded-3xl border border-slate-100 shadow-sm p-5">
        <div className="flex items-center gap-2 mb-4">
          <div className="w-8 h-8 rounded-xl bg-brand-primary/10 flex items-center justify-center text-brand-primary">
            <Users size={16} />
          </div>
          <div>
            <h3 className="text-[11px] font-black text-slate-800 uppercase tracking-tight">Población por grupo etario y sexo</h3>
            <p className="text-[8px] font-bold text-slate-400 uppercase tracking-wider">Desglose por rango de edad y género</p>
          </div>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-3">
          <AgeGroupCard title="Infantes (0-5)" total={gruposEtarios.infantes.total} female={gruposEtarios.infantes.female} male={gruposEtarios.infantes.male} icon={<Baby size={14} />} />
          <AgeGroupCard title="Niños (6-14)" total={gruposEtarios.ninos.total} female={gruposEtarios.ninos.female} male={gruposEtarios.ninos.male} icon={<Baby size={14} />} />
          <AgeGroupCard title="Jóvenes (15-29)" total={gruposEtarios.jovenes.total} female={gruposEtarios.jovenes.female} male={gruposEtarios.jovenes.male} icon={<Users size={14} />} />
          <AgeGroupCard title="Adultos (30-54)" total={gruposEtarios.adultos.total} female={gruposEtarios.adultos.female} male={gruposEtarios.adultos.male} icon={<UserCircle size={14} />} />
          <AgeGroupCard title="Adultos Mayores (55+)" total={gruposEtarios.adultosMayores.total} female={gruposEtarios.adultosMayores.female} male={gruposEtarios.adultosMayores.male} icon={<HeartPulse size={14} />} />
          {/* Tarjeta de Migrantes */}
          <AgeGroupCard 
            title="Migrantes" 
            total={migrantes.length} 
            female={migrantes.filter(m => false).length} // no tenemos sexo en los migrantes, mostramos 0
            male={0}
            icon={<MoveRight size={14} />}
            isClickable
            onClick={() => setModalMigrantesOpen(true)}
          />
        </div>
      </div>

      {/* === SERVICIOS Y NECESIDADES === */}
      <div className="bg-white rounded-3xl border border-slate-100 shadow-sm p-5">
        <div className="flex items-center gap-2 mb-4">
          <div className="w-8 h-8 rounded-xl bg-brand-primary/10 flex items-center justify-center text-brand-primary">
            <Shield size={16} />
          </div>
          <div>
            <h3 className="text-[11px] font-black text-slate-800 uppercase tracking-tight">Servicios y Necesidades</h3>
            <p className="text-[8px] font-bold text-slate-400 uppercase tracking-wider">Registro de servicios básicos y apoyo social</p>
          </div>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          <ServiceCard icon={<Flame size={16} />} label="Bombonas de Gas" value={`${servicios.bombonas} hogares`} subtext={`${servicios.bombonas} familias con servicio`} />
          <ServiceCard icon={<Plug size={16} />} label="Sistema Eléctrico" value={`${servicios.electrico} hogares`} subtext="Cuentan con servicio eléctrico" />
          <ServiceCard icon={<UserCheck size={16} />} label="Inscritos en el CNE" value={`${servicios.cne} personas`} subtext="Registrados en el padrón electoral" />
          <ServiceCard icon={<Award size={16} />} label="Misiones Sociales" value={`${fichas.reduce((acc, f) => acc + (f.misiones ? Object.values(f.misiones).reduce((s, v) => s + (v || 0), 0) : 0), 0)} inscripciones`} subtext="Participación en misiones" onClick={() => setModalMisionesOpen(true)} isClickable />
        </div>
      </div>

      {/* === GRUPOS VULNERABLES === */}
      <div className="bg-white rounded-3xl border border-slate-100 shadow-sm p-5">
        <div className="flex items-center gap-2 mb-4">
          <div className="w-8 h-8 rounded-xl bg-brand-primary/10 flex items-center justify-center text-brand-primary">
            <UserCog size={16} />
          </div>
          <div>
            <h3 className="text-[11px] font-black text-slate-800 uppercase tracking-tight">Grupos Vulnerables</h3>
            <p className="text-[8px] font-bold text-slate-400 uppercase tracking-wider">Población con necesidades especiales</p>
          </div>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <ServiceCard icon={<UserCog size={16} />} label="Pensionados" value={`${pensionados} personas`} subtext="Reciben pensión" />
          <ServiceCard icon={<UserX size={16} />} label="Discapacitados" value={`${discapacidades.reduce((acc, d) => acc + d.cantidad, 0)} personas`} subtext="Con discapacidad registrada" onClick={() => setModalDiscapacidadesOpen(true)} isClickable />
          <ServiceCard icon={<Briefcase size={16} />} label="Desempleados" value={`${desempleados.length} personas`} subtext="Mayores de 18 años sin empleo" onClick={() => setModalDesempleadosOpen(true)} isClickable />
        </div>
      </div>

      {/* ============ MODALES ============ */}

      {/* Modal Misiones */}
      <AnimatePresence>
        {modalMisionesOpen && (
          <div className="fixed inset-0 z-100 flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={() => setModalMisionesOpen(false)} />
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="relative w-full max-w-md bg-white rounded-2xl shadow-2xl overflow-hidden">
              <div className="p-5 border-b border-gray-100 flex justify-between items-center bg-gradient-to-r from-indigo-600 to-indigo-500">
                <h4 className="text-base font-black text-white italic flex items-center gap-2"><GraduationCap className="h-5 w-5" /> Misiones y Formación</h4>
                <button onClick={() => setModalMisionesOpen(false)} className="p-1 rounded-lg hover:bg-white/20"><X className="h-4 w-4 text-white" /></button>
              </div>
              <div className="p-5 space-y-3 max-h-[60vh] overflow-y-auto">
                {(() => {
                  const totales = fichas.reduce((acc, f) => {
                    if (f.misiones) {
                      acc.ribas += f.misiones.ribas || 0;
                      acc.ezequiel += f.misiones.ezequiel || 0;
                      acc.sucre += f.misiones.sucre || 0;
                      acc.vuelvaCaras += f.misiones.vuelvaCaras || 0;
                      acc.identidad += f.misiones.identidad || 0;
                      acc.barrioAdentro += f.misiones.barrioAdentro || 0;
                      acc.mercal += f.misiones.mercal || 0;
                    }
                    return acc;
                  }, { ribas: 0, ezequiel: 0, sucre: 0, vuelvaCaras: 0, identidad: 0, barrioAdentro: 0, mercal: 0 });
                  const misionesList = [
                    { name: "Misión Ribas", value: totales.ribas, icon: "🎓" },
                    { name: "Misión Ezequiel Zamora", value: totales.ezequiel, icon: "🌾" },
                    { name: "Misión Sucre", value: totales.sucre, icon: "📚" },
                    { name: "Misión Vuelta Caras", value: totales.vuelvaCaras, icon: "💼" },
                    { name: "Misión Identidad", value: totales.identidad, icon: "🆔" },
                    { name: "Barrio Adentro", value: totales.barrioAdentro, icon: "🏥" },
                    { name: "Misión Mercal", value: totales.mercal, icon: "🛒" }
                  ];
                  return (
                    <>
                      {misionesList.map((m, idx) => (
                        <div key={idx} className="flex justify-between items-center py-3 border-b border-slate-100">
                          <div className="flex items-center gap-3"><span className="text-xl">{m.icon}</span><span className="font-bold text-slate-700 text-sm">{m.name}</span></div>
                          <span className="font-black text-indigo-600 text-lg">{m.value}</span>
                        </div>
                      ))}
                      <div className="mt-3 pt-3 border-t-2 border-indigo-200 flex justify-between">
                        <span className="font-black text-slate-800">Total Beneficiarios</span>
                        <span className="font-black text-indigo-700 text-xl">{misionesList.reduce((sum, m) => sum + m.value, 0)}</span>
                      </div>
                    </>
                  );
                })()}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Modal Enfermedades */}
      <AnimatePresence>
        {modalEnfermedadesOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={() => setModalEnfermedadesOpen(false)} />
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="relative w-full max-w-md bg-white rounded-2xl shadow-2xl overflow-hidden">
              <div className="p-5 border-b border-gray-100 flex justify-between items-center bg-gradient-to-r from-rose-600 to-rose-500">
                <div className="flex items-center gap-2"><HeartPulse className="h-5 w-5 text-white" /><h4 className="text-base font-black text-white italic">Enfermedades registradas</h4></div>
                <button onClick={() => setModalEnfermedadesOpen(false)} className="p-1 rounded-lg hover:bg-white/20"><X className="h-4 w-4 text-white" /></button>
              </div>
              <div className="p-5 space-y-2 max-h-[60vh] overflow-y-auto">
                {enfermedadesList.length === 0 ? (
                  <p className="text-center text-slate-400 py-8">No hay enfermedades registradas</p>
                ) : (
                  enfermedadesList.map((item) => (
                    <div key={item.nombre} className="flex justify-between items-center p-3 rounded-xl bg-slate-50 hover:bg-slate-100 transition-colors">
                      <span className="text-xs font-bold text-slate-700 uppercase tracking-tight">{item.nombre}</span>
                      <span className="text-xs font-black bg-rose-100 text-rose-700 px-2 py-1 rounded-full">{item.cantidad} {item.cantidad === 1 ? 'persona' : 'personas'}</span>
                    </div>
                  ))
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Modal Migrantes */}
      <AnimatePresence>
        {modalMigrantesOpen && (
          <div className="fixed inset-0 z-100 flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={() => setModalMigrantesOpen(false)} />
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="relative w-full max-w-md bg-white rounded-2xl shadow-2xl overflow-hidden">
              <div className="p-5 border-b border-gray-100 flex justify-between items-center bg-gradient-to-r from-cyan-600 to-cyan-500">
                <div className="flex items-center gap-2"><MoveRight className="h-5 w-5 text-white" /><h4 className="text-base font-black text-white italic">Personas migrantes</h4></div>
                <button onClick={() => setModalMigrantesOpen(false)} className="p-1 rounded-lg hover:bg-white/20"><X className="h-4 w-4 text-white" /></button>
              </div>
              <div className="p-5 space-y-3 max-h-[60vh] overflow-y-auto">
                {migrantesList.length === 0 ? (
                  <p className="text-center text-slate-400 py-8">No hay migrantes registrados</p>
                ) : (
                  migrantesList.map((m, idx) => (
                    <div key={idx} className="p-3 rounded-xl bg-slate-50 hover:bg-slate-100 transition-colors">
                      <p className="text-sm font-bold text-slate-800">{m.nombre}</p>
                      <div className="flex flex-wrap gap-3 text-[10px] text-slate-500 mt-1">
                        <span><Calendar size={10} className="inline mr-1" /> {m.fecha}</span>
                        <span><FileText size={10} className="inline mr-1" /> {m.motivo}</span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Modal Discapacidades */}
      <AnimatePresence>
        {modalDiscapacidadesOpen && (
          <div className="fixed inset-0 z-100 flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={() => setModalDiscapacidadesOpen(false)} />
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="relative w-full max-w-md bg-white rounded-2xl shadow-2xl overflow-hidden">
              <div className="p-5 border-b border-gray-100 flex justify-between items-center bg-gradient-to-r from-purple-600 to-purple-500">
                <div className="flex items-center gap-2"><UserX className="h-5 w-5 text-white" /><h4 className="text-base font-black text-white italic">Discapacidades registradas</h4></div>
                <button onClick={() => setModalDiscapacidadesOpen(false)} className="p-1 rounded-lg hover:bg-white/20"><X className="h-4 w-4 text-white" /></button>
              </div>
              <div className="p-5 space-y-2 max-h-[60vh] overflow-y-auto">
                {discapacidadesList.length === 0 ? (
                  <p className="text-center text-slate-400 py-8">No hay discapacidades registradas</p>
                ) : (
                  discapacidadesList.map((item) => (
                    <div key={item.nombre} className="flex justify-between items-center p-3 rounded-xl bg-slate-50 hover:bg-slate-100 transition-colors">
                      <span className="text-xs font-bold text-slate-700 uppercase tracking-tight">{item.nombre}</span>
                      <span className="text-xs font-black bg-purple-100 text-purple-700 px-2 py-1 rounded-full">{item.cantidad} {item.cantidad === 1 ? 'persona' : 'personas'}</span>
                    </div>
                  ))
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      

    </div>
  );
};

export default DinaPoblacional;