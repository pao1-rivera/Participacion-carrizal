'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Users, HeartPulse, Activity, Baby, UserCircle, Flame, Zap, Bus, GraduationCap,
  Home, CheckCircle, AlertCircle, Loader2, X, Award, Plug, Shield, Target,
  UserCheck, UserX, UsersRound, Accessibility, Briefcase, Plane
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
  centro_votacion?: string;
  migrado?: boolean;
  trabajo_a?: string;
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

interface SistemaElectrico {
  publico?: boolean;
  no_tiene?: boolean;
  [key: string]: any;
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
    discapacidad?: string;
    pensionado?: string;
    trabaja_actualmente?: string;
    cne?: string;
    migrado?: boolean;
  };
  familiares: Familiar[];
  bombonas_gas?: string;  // ya no se usa, pero lo mantenemos por compatibilidad
  sistema_electrico?: SistemaElectrico | string; // puede ser objeto o string JSON
  cantidad_bombonas?: number; // nuevo campo
  transporte_publico?: string;
  misiones?: Misiones;
}

// ==================== COMPONENTES DE TARJETA ====================
const AgeGroupCard = ({ title, total, female, male, icon }: { title: string; total: number; female: number; male: number; icon?: React.ReactNode }) => (
  <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm hover:shadow-md transition-all">
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
export const Las7Transformaciones = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [fichas, setFichas] = useState<FichaCensada[]>([]);
  const [modalMisionesOpen, setModalMisionesOpen] = useState(false);
  const [modalEnfermedadesOpen, setModalEnfermedadesOpen] = useState(false);
  const [modalDiscapacidadOpen, setModalDiscapacidadOpen] = useState(false);
  const [enfermedadesList, setEnfermedadesList] = useState<{ nombre: string; cantidad: number }[]>([]);
  const [discapacidadesList, setDiscapacidadesList] = useState<{ nombre: string; cantidad: number }[]>([]);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Cargar fichas censales
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
          discapacidad: fam.discapacidad || '',
          enfermedad: fam.enfermedad || '',
          embarazo: fam.embarazo || 'No',
          parentesco: fam.parentesco || 'Otros',
          instruccion: fam.instruccion || 'S/D',
          oficio: fam.oficio || 'S/D',
          pensionado: fam.pensionado || '',
          centro_votacion: fam.centro_votacion || '',
          migrado: fam.migrado || false,
          trabajo_a: fam.trabajo_a || ''
        }));

        let misionesObj: Misiones | undefined = undefined;
        if (f.misiones) {
          if (typeof f.misiones === 'string') {
            try { misionesObj = JSON.parse(f.misiones); } catch(e) {}
          } else { misionesObj = f.misiones; }
        }

        // Parsear sistema_electrico si es string
        let sistemaElectrico: SistemaElectrico | undefined = undefined;
        if (f.sistema_electrico) {
          if (typeof f.sistema_electrico === 'string') {
            try { sistemaElectrico = JSON.parse(f.sistema_electrico); } catch(e) { /* ignorar */ }
          } else {
            sistemaElectrico = f.sistema_electrico;
          }
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
            enfermedad: f.enfermedad || '',
            discapacidad: f.discapacidad || '',
            pensionado: f.pensionado || '',
            trabaja_actualmente: f.trabaja_actualmente || '',
            cne: f.cne || '',
            migrado: f.migrado || false
          },
          familiares,
          bombonas_gas: f.bombonas_gas,
          sistema_electrico: sistemaElectrico,
          cantidad_bombonas: f.cantidad_bombonas || 0,
          transporte_publico: f.transporte_publico,
          misiones: misionesObj
        };
      });

      setFichas(fichasCompletas);
    } catch (error: any) {
      console.error('Error cargando datos censales:', error);
      setErrorMsg(error.message || 'Error al cargar los datos. Verifique su conexión o permisos.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user?.id) cargarDatos();
    else setLoading(false);
  }, [user]);

  // ==================== CÁLCULOS ====================
  const { gruposEtarios, servicios, enfermedadesTotales, discapacidadesTotales, vulnerables, migrantes } = useMemo(() => {
    const grupos = {
      infantes: { total: 0, female: 0, male: 0 },
      ninos: { total: 0, female: 0, male: 0 },
      jovenes: { total: 0, female: 0, male: 0 },
      adultos: { total: 0, female: 0, male: 0 },
      adultosMayores: { total: 0, female: 0, male: 0 }
    };

    let bombonas = 0;
    let electrico = 0;
    let cneTotal = 0;
    let misionesTotal = 0;
    const enfermedadesMap = new Map<string, number>();
    const discapacidadesMap = new Map<string, number>();

    let discapacidadTotal = 0;
    let pensionadosTotal = 0;
    let desempleadosTotal = 0;
    let migrantesTotal = 0;
    let migrantesFemale = 0;
    let migrantesMale = 0;

    // Funciones auxiliares para normalizar y evaluar campos
    const esAfirmativo = (valor: string | undefined): boolean => {
      if (!valor) return false;
      const v = valor.trim().toLowerCase();
      return v === 'si' || v === 'sí' || v === 'x';
    };

    const tieneDiscapacidad = (valor: string | undefined): boolean => {
      if (!valor) return false;
      const v = valor.trim();
      if (v === '') return false;
      const lower = v.toLowerCase();
      return lower !== 'no' && lower !== 'ninguna' && lower !== 'n/a';
    };

    const procesarPersona = (persona: { 
      edad: number; 
      sexo?: string; 
      enfermedad?: string; 
      discapacidad?: string; 
      pensionado?: string; 
      trabaja?: string; 
      cne?: string; 
      migrado?: boolean 
    }) => {
      const edad = persona.edad || 0;
      const sexo = (persona.sexo || '').toLowerCase();
      const isFemale = sexo === 'femenino';
      const isMale = sexo === 'masculino';

      // Grupo etario
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

      // Enfermedades
      const enf = (persona.enfermedad || '').trim();
      if (enf && enf.toLowerCase() !== 'no aplica' && enf.toLowerCase() !== 'no') {
        enfermedadesMap.set(enf, (enfermedadesMap.get(enf) || 0) + 1);
      }

      // Discapacidad: guardar el texto exacto para el modal
      const disc = (persona.discapacidad || '').trim();
      if (tieneDiscapacidad(disc)) {
        discapacidadTotal++;
        // Guardar el texto de discapacidad (puede ser "Discapacidad motora", "Visual", etc.)
        if (disc) {
          discapacidadesMap.set(disc, (discapacidadesMap.get(disc) || 0) + 1);
        }
      }

      // Pensionado
      if (esAfirmativo(persona.pensionado)) {
        pensionadosTotal++;
      }

      // Desempleado
      const trabaja = (persona.trabaja || '').trim();
      if (!esAfirmativo(trabaja)) {
        desempleadosTotal++;
      }

      // CNE
      const cneVal = (persona.cne || '').trim();
      if (cneVal && cneVal.toLowerCase() !== 'no') {
        cneTotal++;
      }

      // Migración
      if (persona.migrado === true) {
        migrantesTotal++;
        if (isFemale) migrantesFemale++;
        else if (isMale) migrantesMale++;
      }
    };

    fichas.forEach(ficha => {
      // Procesar jefe
      procesarPersona({
        edad: ficha.jefe.edad,
        sexo: ficha.jefe.sexo,
        enfermedad: ficha.jefe.enfermedad,
        discapacidad: ficha.jefe.discapacidad,
        pensionado: ficha.jefe.pensionado,
        trabaja: ficha.jefe.trabaja_actualmente,
        cne: ficha.jefe.cne,
        migrado: ficha.jefe.migrado
      });

      // Servicios: Bombonas de Gas (usando cantidad_bombonas > 0)
      if (ficha.cantidad_bombonas && ficha.cantidad_bombonas > 0) {
        bombonas++;
      }

      // Servicios: Sistema Eléctrico (verificar publico === true y no_tiene !== true)
      if (ficha.sistema_electrico) {
        const se = ficha.sistema_electrico;
        const tieneElectricidad = se.publico === true && se.no_tiene !== true;
        if (tieneElectricidad) {
          electrico++;
        }
      }

      if (ficha.misiones) {
        misionesTotal += (ficha.misiones.ribas + ficha.misiones.ezequiel + ficha.misiones.sucre + 
                          ficha.misiones.vuelvaCaras + ficha.misiones.identidad + 
                          ficha.misiones.barrioAdentro + ficha.misiones.mercal);
      }

      // Familiares
      ficha.familiares.forEach(fam => {
        procesarPersona({
          edad: fam.edad,
          sexo: fam.sexo,
          enfermedad: fam.enfermedad,
          discapacidad: fam.discapacidad,
          pensionado: fam.pensionado,
          trabaja: fam.trabajo_a,
          cne: fam.cne,
          migrado: fam.migrado
        });
      });
    });

    const servicios = {
      bombonas,
      electrico,
      cne: cneTotal,
      misionesTotal,
      casosSalud: enfermedadesMap.size
    };

    const enfermedadesList = Array.from(enfermedadesMap.entries())
      .map(([nombre, cantidad]) => ({ nombre, cantidad }))
      .sort((a, b) => b.cantidad - a.cantidad);

    const discapacidadesList = Array.from(discapacidadesMap.entries())
      .map(([nombre, cantidad]) => ({ nombre, cantidad }))
      .sort((a, b) => b.cantidad - a.cantidad);

    return {
      gruposEtarios: grupos,
      servicios,
      enfermedadesTotales: enfermedadesList,
      discapacidadesTotales: discapacidadesList,
      vulnerables: {
        discapacidad: discapacidadTotal,
        pensionados: pensionadosTotal,
        desempleados: desempleadosTotal
      },
      migrantes: {
        total: migrantesTotal,
        female: migrantesFemale,
        male: migrantesMale
      }
    };
  }, [fichas]);

  // Actualizar listas para modales
  useEffect(() => {
    setEnfermedadesList(enfermedadesTotales);
  }, [enfermedadesTotales]);

  useEffect(() => {
    setDiscapacidadesList(discapacidadesTotales);
  }, [discapacidadesTotales]);

  // Ocultar sidebar cuando modal está abierto
  useEffect(() => {
    const isModalOpen = modalMisionesOpen || modalEnfermedadesOpen || modalDiscapacidadOpen;
    if (isModalOpen) {
      document.body.classList.add('modal-open');
      const styleId = 'modal-sidebar-hide-7t';
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
      const styleElement = document.getElementById('modal-sidebar-hide-7t');
      if (styleElement) styleElement.remove();
    }
    return () => {
      document.body.classList.remove('modal-open');
      const styleElement = document.getElementById('modal-sidebar-hide-7t');
      if (styleElement) styleElement.remove();
    };
  }, [modalMisionesOpen, modalEnfermedadesOpen, modalDiscapacidadOpen]);

  if (loading) {
    return <div className="flex justify-center p-12"><Loader2 className="animate-spin text-brand-primary h-8 w-8" /></div>;
  }

  if (errorMsg) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-2xl p-6 text-center">
        <AlertCircle className="h-8 w-8 text-red-500 mx-auto mb-2" />
        <p className="text-sm font-bold text-red-700">{errorMsg}</p>
        <button 
          onClick={cargarDatos}
          className="mt-4 px-4 py-2 bg-red-100 text-red-700 rounded-lg text-xs font-bold hover:bg-red-200"
        >
          Reintentar
        </button>
      </div>
    );
  }

  if (fichas.length === 0) {
    return (
      <div className="bg-amber-50 border border-amber-200 rounded-2xl p-6 text-center">
        <AlertCircle className="h-8 w-8 text-amber-500 mx-auto mb-2" />
        <p className="text-sm font-bold text-amber-700">No se encontraron registros del censo</p>
        <p className="text-xs text-amber-600 mt-1">Aún no se han cargado fichas censales para este consejo o no tienes permisos para verlas.</p>
      </div>
    );
  }

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="space-y-6 pb-12"
    >
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-black text-slate-900 uppercase tracking-tighter italic">Dina Poblacional y Social</h2>
          <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mt-1">Censo comunitario - Plan de las 7 Transformaciones</p>
        </div>
      </div>

      {/* Tarjetas de grupos etarios + Migración */}
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
          <AgeGroupCard title="Infantes (0-5 años)" total={gruposEtarios.infantes.total} female={gruposEtarios.infantes.female} male={gruposEtarios.infantes.male} icon={<Baby size={14} />} />
          <AgeGroupCard title="Niños (6-14 años)" total={gruposEtarios.ninos.total} female={gruposEtarios.ninos.female} male={gruposEtarios.ninos.male} icon={<Baby size={14} />} />
          <AgeGroupCard title="Jóvenes (15-29 años)" total={gruposEtarios.jovenes.total} female={gruposEtarios.jovenes.female} male={gruposEtarios.jovenes.male} icon={<Users size={14} />} />
          <AgeGroupCard title="Adultos (30-54 años)" total={gruposEtarios.adultos.total} female={gruposEtarios.adultos.female} male={gruposEtarios.adultos.male} icon={<UserCircle size={14} />} />
          <AgeGroupCard title="Adultos Mayores (55+)" total={gruposEtarios.adultosMayores.total} female={gruposEtarios.adultosMayores.female} male={gruposEtarios.adultosMayores.male} icon={<HeartPulse size={14} />} />
        </div>
        {/* Migración */}
        <div className="mt-4 pt-4 border-t border-slate-100">
          <div className="flex items-center gap-2 mb-3">
            <Plane size={16} className="text-brand-primary" />
            <h4 className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Personas Migradas</h4>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="bg-slate-50 p-3 rounded-xl text-center">
              <span className="text-[8px] font-bold text-slate-400 uppercase block">Total Migrantes</span>
              <span className="text-2xl font-black text-slate-800">{migrantes.total}</span>
            </div>
            <div className="flex gap-3">
              <div className="flex-1 bg-pink-50 p-3 rounded-xl text-center">
                <span className="text-[8px] font-bold text-pink-500 block">♀ Mujeres</span>
                <span className="text-xl font-black text-pink-700">{migrantes.female}</span>
              </div>
              <div className="flex-1 bg-blue-50 p-3 rounded-xl text-center">
                <span className="text-[8px] font-bold text-blue-500 block">♂ Hombres</span>
                <span className="text-xl font-black text-blue-700">{migrantes.male}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Servicios y Necesidades (actualizado: bombonas con cantidad_bombonas, eléctrico con json) */}
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
          <ServiceCard icon={<UserCheck size={16} />} label="Inscritos en CNE" value={`${servicios.cne} personas`} subtext="Registro en el CNE" />
          <ServiceCard icon={<Award size={16} />} label="Misiones Sociales" value={`${servicios.misionesTotal} inscripciones`} subtext="Participación en misiones" onClick={() => setModalMisionesOpen(true)} isClickable />
        </div>
        <div className="mt-3">
          <ServiceCard icon={<HeartPulse size={16} />} label="Casos de Salud" value={`${servicios.casosSalud} personas`} subtext="Con enfermedades registradas" onClick={() => setModalEnfermedadesOpen(true)} isClickable />
        </div>
      </div>

      {/* Grupos Vulnerables (ahora con modal para discapacidad) */}
      <div className="bg-white rounded-3xl border border-slate-100 shadow-sm p-5">
        <div className="flex items-center gap-2 mb-4">
          <div className="w-8 h-8 rounded-xl bg-amber-100 flex items-center justify-center text-amber-600">
            <UsersRound size={16} />
          </div>
          <div>
            <h3 className="text-[11px] font-black text-slate-800 uppercase tracking-tight">Grupos Vulnerables</h3>
            <p className="text-[8px] font-bold text-slate-400 uppercase tracking-wider">Personas en situación de vulnerabilidad</p>
          </div>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          <ServiceCard 
            icon={<Accessibility size={16} />} 
            label="Discapacidad" 
            value={`${vulnerables.discapacidad} personas`} 
            subtext="Con discapacidad registrada"
            onClick={() => setModalDiscapacidadOpen(true)}
            isClickable
          />
          <ServiceCard 
            icon={<Briefcase size={16} />} 
            label="Pensionados" 
            value={`${vulnerables.pensionados} personas`} 
            subtext="Jubilados o pensionados" 
          />
          <ServiceCard 
            icon={<UserX size={16} />} 
            label="Desempleados" 
            value={`${vulnerables.desempleados} personas`} 
            subtext="No trabajan actualmente" 
          />
        </div>
      </div>

      {/* Footer reducido */}
      <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-slate-50 rounded-xl flex items-center justify-center border border-slate-100">
            <Users className="text-brand-primary w-6 h-6" />
          </div>
          <div>
            <h4 className="text-sm font-black uppercase tracking-tighter text-slate-900 leading-none">Censo Comunitario</h4>
            <p className="text-[10px] text-slate-500 font-medium">
              {fichas.length} fichas • {fichas.reduce((acc, f) => acc + f.familiares.length + 1, 0)} personas censadas
            </p>
          </div>
        </div>
        <div className="text-xs text-slate-400 font-bold uppercase tracking-widest">
          Plan de las 7 Transformaciones
        </div>
      </div>

      {/* ========== MODALES ========== */}

      {/* Modal de Misiones */}
      <AnimatePresence>
        {modalMisionesOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
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
                      acc.ribas += f.misiones.ribas;
                      acc.ezequiel += f.misiones.ezequiel;
                      acc.sucre += f.misiones.sucre;
                      acc.vuelvaCaras += f.misiones.vuelvaCaras;
                      acc.identidad += f.misiones.identidad;
                      acc.barrioAdentro += f.misiones.barrioAdentro;
                      acc.mercal += f.misiones.mercal;
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

      {/* Modal de Enfermedades */}
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

      {/* Modal de Discapacidades (nuevo) */}
      <AnimatePresence>
        {modalDiscapacidadOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={() => setModalDiscapacidadOpen(false)} />
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="relative w-full max-w-md bg-white rounded-2xl shadow-2xl overflow-hidden">
              <div className="p-5 border-b border-gray-100 flex justify-between items-center bg-gradient-to-r from-amber-600 to-amber-500">
                <div className="flex items-center gap-2"><Accessibility className="h-5 w-5 text-white" /><h4 className="text-base font-black text-white italic">Discapacidades registradas</h4></div>
                <button onClick={() => setModalDiscapacidadOpen(false)} className="p-1 rounded-lg hover:bg-white/20"><X className="h-4 w-4 text-white" /></button>
              </div>
              <div className="p-5 space-y-2 max-h-[60vh] overflow-y-auto">
                {discapacidadesList.length === 0 ? (
                  <p className="text-center text-slate-400 py-8">No hay discapacidades registradas</p>
                ) : (
                  discapacidadesList.map((item) => (
                    <div key={item.nombre} className="flex justify-between items-center p-3 rounded-xl bg-slate-50 hover:bg-slate-100 transition-colors">
                      <span className="text-xs font-bold text-slate-700 uppercase tracking-tight">{item.nombre}</span>
                      <span className="text-xs font-black bg-amber-100 text-amber-700 px-2 py-1 rounded-full">{item.cantidad} {item.cantidad === 1 ? 'persona' : 'personas'}</span>
                    </div>
                  ))
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </motion.div>
  );
};

export default Las7Transformaciones;