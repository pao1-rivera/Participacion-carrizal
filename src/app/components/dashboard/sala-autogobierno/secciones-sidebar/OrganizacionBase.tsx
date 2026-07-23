"use client";

import React, { useState, useEffect } from "react";
import { 
  Building2, MapPin, Users, ChevronRight, Search, LayoutGrid,
  ShieldCheck, AlertCircle, Briefcase, UserCheck, Loader2, X,
  Home, Baby, HeartPulse, Flame, LogOut, Activity, FileCheck
} from "lucide-react";
import { cn } from "@/app/lib/utils";
import { supabase } from "@/app/lib/supabaseClient";
import { useAuth } from "@/context/AuthContext";

// Tipos
interface ConsejoResumen {
  id_consejo: number;
  nombre_consejo: string;
  rif: string;
  codigo_situr: string;
  estatus: string;
  nombre_sector: string;
  comuna_nombre: string;
  total_voceros: number;
  total_nudos: number;
  total_proyectos: number;
  total_asambleas: number;
  total_habitantes: number;
}

interface ConsejoDetalle extends ConsejoResumen {
  fecha_vencimiento_voceros?: string;
}

interface OrganizacionBaseProps {
  onNavigate: (section: string) => void;
}

// ==================== FUNCIÓN AUXILIAR PARA GAS ====================
const tieneGas = (gas: any): boolean => {
  if (!gas) return false;
  try {
    const obj = typeof gas === 'string' ? JSON.parse(gas) : gas;
    if (obj.bombona === true) return true;
    if ((obj.kg_10 || 0) + (obj.kg_18 || 0) + (obj.kg_43 || 0) > 0) return true;
    return false;
  } catch (e) {
    console.error('Error parseando gas:', e);
    return false;
  }
};

// 👨‍⚕️ CORRECCIÓN: función para determinar si un valor de enfermedad es un caso positivo
const esCasoSalud = (valor: any): boolean => {
  if (!valor) return false;
  const str = String(valor).trim().toLowerCase();
  // Lista de valores que NO representan un caso de salud
  const negativos = ['', 'no', 'ninguna', 'n/a', 'na', 'no aplica', 'no aplicable'];
  return !negativos.includes(str);
};

// ==================== TARJETA DE RESUMEN DEL CENSO ====================
const ResumenCensoCard = ({ 
  totalHabitantes,
  totalFamilias,
  totalNinos,
  totalJovenes,
  totalAdultosMayores,
  totalCasosSalud,
  totalBombonas,
  tasaMigracion,
  comunaNombre
}: any) => {
  const items = [
    { label: "Habitantes", value: totalHabitantes, icon: <Home className="h-3 w-3" />, color: "text-emerald-600 bg-emerald-50" },
    { label: "Familias", value: totalFamilias, icon: <Users className="h-3 w-3" />, color: "text-blue-600 bg-blue-50" },
    { label: "Niños (0-12)", value: totalNinos, icon: <Baby className="h-3 w-3" />, color: "text-sky-600 bg-sky-50" },
    { label: "Jóvenes (13-29)", value: totalJovenes, icon: <UserCheck className="h-3 w-3" />, color: "text-indigo-600 bg-indigo-50" },
    { label: "Adultos Mayores", value: totalAdultosMayores, icon: <HeartPulse className="h-3 w-3" />, color: "text-rose-600 bg-rose-50" },
    { label: "Casos de Salud", value: totalCasosSalud, icon: <Activity className="h-3 w-3" />, color: "text-amber-600 bg-amber-50" },
    { label: "Bombonas de Gas", value: totalBombonas, icon: <Flame className="h-3 w-3" />, color: "text-orange-600 bg-orange-50" },
    { label: "Tasa Migración", value: tasaMigracion, icon: <LogOut className="h-3 w-3" />, color: "text-purple-600 bg-purple-50" },
  ];

  return (
    <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4 sticky top-4">
      <div className="flex items-center gap-2 mb-3 pb-2 border-b border-gray-50">
        <div className="h-8 w-8 rounded-xl bg-brand-primary/10 flex items-center justify-center">
          <LayoutGrid className="h-4 w-4 text-brand-primary" />
        </div>
        <div>
          <h3 className="text-[9px] font-black text-slate-400 uppercase tracking-wider">Resumen del censo</h3>
          <p className="text-[11px] font-black text-slate-800 italic leading-tight">{comunaNombre || "Tu comuna"}</p>
        </div>
      </div>
      <div className="space-y-2">
        {items.map((item, idx) => (
          <div key={idx} className="flex items-center justify-between p-2 rounded-lg hover:bg-gray-50 transition-colors">
            <div className="flex items-center gap-2">
              <div className={cn("h-6 w-6 rounded-md flex items-center justify-center", item.color)}>
                {item.icon}
              </div>
              <span className="text-[8px] font-black text-slate-500 uppercase tracking-wider">{item.label}</span>
            </div>
            <span className="text-[11px] font-black text-slate-800">{typeof item.value === 'number' ? item.value.toLocaleString() : item.value}</span>
          </div>
        ))}
      </div>
    </div>
  );
};

// ==================== COMPONENTE PRINCIPAL ====================
export const OrganizacionBase = ({ onNavigate }: OrganizacionBaseProps) => {
  const { user } = useAuth();
  const [consejos, setConsejos] = useState<ConsejoResumen[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedProfile, setSelectedProfile] = useState<ConsejoDetalle | null>(null);
  const [noSala, setNoSala] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [error, setError] = useState<string | null>(null);
  const itemsPerPage = 10;

  // Totales del censo
  const [censoTotales, setCensoTotales] = useState({
    habitantes: 0,
    familias: 0,
    ninos: 0,
    jovenes: 0,
    adultosMayores: 0,
    casosSalud: 0,
    bombonas: 0,
    tasaMigracion: "0%"
  });
  const [nombreComuna, setNombreComuna] = useState<string>("");

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

  const closeAlert = () => setModalState(prev => ({ ...prev, isOpen: false }));

  // ========== OCULTAR SIDEBAR CUANDO MODAL ESTÁ ABIERTO ==========
  useEffect(() => {
    if (selectedProfile || modalState.isOpen) {
      document.body.classList.add('modal-open');
    } else {
      document.body.classList.remove('modal-open');
    }
    return () => document.body.classList.remove('modal-open');
  }, [selectedProfile, modalState.isOpen]);

  // Obtener catálogo de comunas
  const [comunasCatalogo, setComunasCatalogo] = useState<any[]>([]);
  
  useEffect(() => {
    const fetchComunasCatalogo = async () => {
      try {
        const { data, error } = await supabase
          .from('datos_comuna')
          .select('id_comuna, nombre_comuna')
          .eq('activo', true);
        if (!error) setComunasCatalogo(data || []);
      } catch (err) {
        console.error(err);
      }
    };
    fetchComunasCatalogo();
  }, []);

  // Función para calcular los totales del censo a partir de los consejos
  const calcularTotalesCenso = async (idsConsejos: number[]) => {
    if (!idsConsejos.length) {
      setCensoTotales({
        habitantes: 0, familias: 0, ninos: 0, jovenes: 0,
        adultosMayores: 0, casosSalud: 0, bombonas: 0, tasaMigracion: "0%"
      });
      return;
    }

    try {
      // 👨‍⚕️ CORRECCIÓN: agregar 'enfermedad' al SELECT para poder contar casos del jefe
      const { data: fichas, error: fichasError } = await supabase
        .from('censo_fichas')
        .select('id_ficha, id_consejo, edad, gas, cantidad_bombonas, enfermedad')
        .in('id_consejo', idsConsejos);
      
      if (fichasError) throw fichasError;
      
      const idsFichas = fichas?.map(f => f.id_ficha) || [];
      
      let familiares: any[] = [];
      if (idsFichas.length > 0) {
        const { data: famData, error: famError } = await supabase
          .from('censo_familiares')
          .select('id_ficha, edad, enfermedad')
          .in('id_ficha', idsFichas);
        if (!famError) familiares = famData || [];
      }
      
      let totalFamilias = fichas?.length || 0;
      let totalNinos = 0, totalJovenes = 0, totalAdultosMayores = 0;
      let totalCasosSalud = 0;
      let totalBombonas = 0;
      
      // Procesar jefes de familia (fichas)
      fichas?.forEach(f => {
        const edad = f.edad || 0;
        if (edad > 0 && edad <= 12) totalNinos++;
        else if (edad >= 13 && edad <= 29) totalJovenes++;
        else if (edad >= 60) totalAdultosMayores++;
        
        // 👨‍⚕️ CORRECCIÓN: contar casos de salud del jefe
        if (esCasoSalud(f.enfermedad)) totalCasosSalud++;
        
        if (tieneGas(f.gas)) {
          totalBombonas += (f.cantidad_bombonas || 1);
        }
      });
      
      // Procesar familiares
      familiares.forEach(fam => {
        const edad = fam.edad || 0;
        if (edad > 0 && edad <= 12) totalNinos++;
        else if (edad >= 13 && edad <= 29) totalJovenes++;
        else if (edad >= 60) totalAdultosMayores++;
        
        // 👨‍⚕️ CORRECCIÓN: usar la misma función para contar casos de salud
        if (esCasoSalud(fam.enfermedad)) totalCasosSalud++;
      });
      
      const totalHabitantes = totalFamilias + familiares.length;
      
      // Tasa de migración: pendiente
      const tasaMigracion = "0%";
      
      setCensoTotales({
        habitantes: totalHabitantes,
        familias: totalFamilias,
        ninos: totalNinos,
        jovenes: totalJovenes,
        adultosMayores: totalAdultosMayores,
        casosSalud: totalCasosSalud,
        bombonas: totalBombonas,
        tasaMigracion
      });
    } catch (err) {
      console.error("Error calculando totales del censo:", err);
    }
  };

  useEffect(() => {
    if (!user?.id) {
      setLoading(false);
      setError("No hay usuario autenticado.");
      showAlert('Error', "No hay usuario autenticado.", 'danger');
      return;
    }

    const fetchConsejosDeComuna = async () => {
      setLoading(true);
      setError(null);

      try {
        const { data: sala, error: salaError } = await supabase
          .from('datos_sala_autogobierno')
          .select('id_comuna')
          .eq('id_usuario', user.id)
          .maybeSingle();

        if (salaError || !sala || !sala.id_comuna) {
          if (salaError) console.error('Error obteniendo sala:', salaError);
          setNoSala(true);
          setLoading(false);
          return;
        }

        const idComuna = sala.id_comuna;
        const comunaObj = comunasCatalogo.find(c => c.id_comuna === idComuna);
        setNombreComuna(comunaObj?.nombre_comuna || "Comuna");

        const { data: sectores, error: sectoresError } = await supabase
          .from('sectores')
          .select('id_sector, nombre_sector')
          .eq('id_datos_comuna', idComuna)
          .eq('activo', true);

        if (sectoresError) throw sectoresError;
        if (!sectores || sectores.length === 0) {
          setConsejos([]);
          const msg = "No hay sectores registrados en esta comuna.";
          setError(msg);
          showAlert('Error', msg, 'warning');
          setLoading(false);
          return;
        }

        const idsSectores = sectores.map(s => s.id_sector);
        const sectorMap = new Map(sectores.map(s => [s.id_sector, s.nombre_sector]));

        const { data: consejosBase, error: consejosError } = await supabase
          .from('datos_consejo_comunal')
          .select('id_consejo, nombre_consejo, rif, codigo_situr, estatus_validacion, id_sector')
          .in('id_sector', idsSectores)
          .order('nombre_consejo');

        if (consejosError) throw consejosError;
        if (!consejosBase || consejosBase.length === 0) {
          setConsejos([]);
          const msg = "No hay consejos comunales registrados en tu comuna.";
          setError(msg);
          showAlert('Error', msg, 'warning');
          setLoading(false);
          return;
        }

        const idsConsejos = consejosBase.map(c => c.id_consejo);
        const comunaNombre = comunaObj?.nombre_comuna || "Comuna";

        // Calcular totales del censo (con la función corregida)
        await calcularTotalesCenso(idsConsejos);

        const [
          nudosResult,
          proyectosResult,
          vocerosResult,
          fichasResult,
          familiaresResult,
          asambleasResult
        ] = await Promise.all([
          supabase.from('nudos_criticos').select('id_consejo').in('id_consejo', idsConsejos),
          supabase.from('proyectos').select('id_consejo').in('id_consejo', idsConsejos),
          supabase.from('voceros').select('id_consejo').in('id_consejo', idsConsejos),
          supabase.from('censo_fichas').select('id_consejo').in('id_consejo', idsConsejos),
          supabase
            .from('censo_familiares')
            .select('id_ficha, censo_fichas!inner(id_consejo)')
            .in('censo_fichas.id_consejo', idsConsejos),
          supabase.from('asambleas').select('id_consejo').in('id_consejo', idsConsejos)
        ]);

        const nudosMap = new Map<number, number>();
        if (nudosResult.data) {
          nudosResult.data.forEach((n: any) => {
            const id = n.id_consejo;
            nudosMap.set(id, (nudosMap.get(id) || 0) + 1);
          });
        }

        const proyectosMap = new Map<number, number>();
        if (proyectosResult.data) {
          proyectosResult.data.forEach((p: any) => {
            const id = p.id_consejo;
            proyectosMap.set(id, (proyectosMap.get(id) || 0) + 1);
          });
        }

        const vocerosMap = new Map<number, number>();
        if (vocerosResult.data) {
          vocerosResult.data.forEach((v: any) => {
            const id = v.id_consejo;
            vocerosMap.set(id, (vocerosMap.get(id) || 0) + 1);
          });
        }

        const jefesMap = new Map<number, number>();
        if (fichasResult.data) {
          fichasResult.data.forEach((f: any) => {
            const id = f.id_consejo;
            jefesMap.set(id, (jefesMap.get(id) || 0) + 1);
          });
        }

        const familiaresMap = new Map<number, number>();
        if (familiaresResult.data) {
          familiaresResult.data.forEach((fam: any) => {
            const idConsejo = fam.censo_fichas?.id_consejo;
            if (idConsejo) {
              familiaresMap.set(idConsejo, (familiaresMap.get(idConsejo) || 0) + 1);
            }
          });
        }

        const asambleasMap = new Map<number, number>();
        if (asambleasResult.data) {
          asambleasResult.data.forEach((a: any) => {
            const id = a.id_consejo;
            asambleasMap.set(id, (asambleasMap.get(id) || 0) + 1);
          });
        }

        const habitantesMap = new Map<number, number>();
        idsConsejos.forEach(id => {
          const jefes = jefesMap.get(id) || 0;
          const familiares = familiaresMap.get(id) || 0;
          habitantesMap.set(id, jefes + familiares);
        });

        const consejosConFormato: ConsejoResumen[] = consejosBase.map(c => ({
          id_consejo: c.id_consejo,
          nombre_consejo: c.nombre_consejo,
          rif: c.rif,
          codigo_situr: c.codigo_situr,
          estatus: c.estatus_validacion || "Activo",
          nombre_sector: sectorMap.get(c.id_sector) || "",
          comuna_nombre: comunaNombre,
          total_voceros: vocerosMap.get(c.id_consejo) || 0,
          total_nudos: nudosMap.get(c.id_consejo) || 0,
          total_proyectos: proyectosMap.get(c.id_consejo) || 0,
          total_asambleas: asambleasMap.get(c.id_consejo) || 0,
          total_habitantes: habitantesMap.get(c.id_consejo) || 0,
        }));

        setConsejos(consejosConFormato);
      } catch (err: any) {
        console.error(err);
        const msg = "Error al cargar los consejos. " + err.message;
        setError(msg);
        showAlert('Error', msg, 'danger');
      } finally {
        setLoading(false);
      }
    };

    if (comunasCatalogo.length > 0 || !user?.id) {
      fetchConsejosDeComuna();
    }
  }, [user, comunasCatalogo]);

  // Filtro y paginación
  const filteredConsejos = consejos.filter(c => 
    c.nombre_consejo.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.nombre_sector?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.comuna_nombre?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const totalPages = Math.ceil(filteredConsejos.length / itemsPerPage);
  const paginatedConsejos = filteredConsejos.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const loadProfile = async (consejo: ConsejoResumen) => {
    setSelectedProfile(null);
    const { data, error } = await supabase
      .from('datos_consejo_comunal')
      .select('fecha_vencimiento_voceros')
      .eq('id_consejo', consejo.id_consejo)
      .single();
    
    if (error) console.error(error);
    
    setSelectedProfile({
      ...consejo,
      fecha_vencimiento_voceros: data?.fecha_vencimiento_voceros,
    });
  };

  if (noSala) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center p-8 bg-white rounded-3xl border border-gray-100 shadow-sm">
        <div className="h-20 w-20 rounded-full bg-amber-100 flex items-center justify-center mb-6">
          <AlertCircle className="h-10 w-10 text-amber-600" />
        </div>
        <h3 className="text-xl font-black text-slate-800 uppercase tracking-tighter mb-2">
          Aún no has registrado tu Sala de Autogobierno
        </h3>
        <p className="text-slate-500 max-w-md mb-8">
          Para acceder a las estadísticas y funcionalidades del dashboard, primero debes completar los datos legales de tu sala.
        </p>
        <button
          onClick={() => onNavigate("datosl")}
          className="px-8 py-3 bg-brand-primary text-white rounded-xl font-black text-sm shadow-lg hover:scale-[1.02] transition-all flex items-center gap-2"
        >
          <FileCheck className="h-4 w-4" />
          Completar Datos Legales
        </button>
      </div>
    );
  }

  // Vista de perfil detallado (MODAL)
  if (selectedProfile) {
    return (
      <>
        <div 
          className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[100]"
          onClick={() => setSelectedProfile(null)}
        />
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 overflow-y-auto">
          <div 
            className="relative bg-white rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => setSelectedProfile(null)}
              className="absolute top-3 right-3 z-10 p-1.5 rounded-full bg-gray-100 hover:bg-gray-200 transition-colors"
            >
              <X className="h-4 w-4 text-slate-600" />
            </button>

            <div className="p-5">
              <div className="flex justify-between items-start mb-5">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-lg bg-brand-primary/5 flex items-center justify-center text-brand-primary">
                    <Building2 className="h-5 w-5" />
                  </div>
                  <div>
                    <h2 className="text-lg font-black text-slate-800 italic uppercase tracking-tighter leading-none mb-1">
                      {selectedProfile.nombre_consejo}
                    </h2>
                    <div className="flex flex-wrap gap-2 items-center">
                      <div className="flex items-center gap-1 text-slate-400">
                        <MapPin className="h-2.5 w-2.5" />
                        <span className="text-[8px] font-black uppercase tracking-widest">{selectedProfile.nombre_sector}</span>
                      </div>
                      <div className="h-1.5 w-px bg-gray-200" />
                      <div className="flex items-center gap-1 text-slate-400">
                        <LayoutGrid className="h-2.5 w-2.5" />
                        <span className="text-[8px] font-black uppercase tracking-widest">{selectedProfile.comuna_nombre}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-2 p-3 bg-gray-50/50 rounded-lg border border-gray-50 mb-5">
                {[
                  { label: 'RIF', val: selectedProfile.rif },
                  { label: 'SITUR', val: selectedProfile.codigo_situr },
                  { label: 'VENCIMIENTO', val: selectedProfile.fecha_vencimiento_voceros }
                ].map((item, i) => (
                  <div key={i}>
                    <p className="text-[7px] font-bold text-slate-400 uppercase tracking-[0.1em] mb-0.5">{item.label}</p>
                    <p className="text-[10px] font-black text-slate-800 uppercase italic">{item.val || '—'}</p>
                  </div>
                ))}
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                {[
                  { icon: AlertCircle, color: 'text-rose-500', bg: 'bg-rose-50', val: selectedProfile.total_nudos, label: 'Nudos' },
                  { icon: Briefcase, color: 'text-blue-500', bg: 'bg-blue-50', val: selectedProfile.total_proyectos, label: 'Proyectos' },
                  { icon: Users, color: 'text-emerald-500', bg: 'bg-emerald-50', val: selectedProfile.total_voceros, label: 'Voceros' },
                  { icon: UserCheck, color: 'text-indigo-500', bg: 'bg-indigo-50', val: selectedProfile.total_habitantes, label: 'Habitantes' },
                ].map((item, i) => (
                  <div key={i} className="p-3 rounded-lg border border-gray-100 bg-white shadow-sm flex flex-col items-center text-center">
                    <div className={`h-6 w-6 rounded-md ${item.bg} ${item.color} flex items-center justify-center mb-1`}>
                      <item.icon className="h-3 w-3" />
                    </div>
                    <p className="text-sm font-black text-slate-800">{item.val}</p>
                    <p className="text-[7px] font-black text-slate-400 uppercase tracking-wider">{item.label}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </>
    );
  }

  // Vista principal con dos columnas
  return (
    <div className="space-y-4 p-3 md:p-5 min-h-screen">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div className="space-y-0.5">
          <h2 className="text-sm font-black text-slate-800 italic uppercase tracking-tighter flex items-center gap-2">
            <LayoutGrid className="h-4 w-4 text-brand-primary" />
            Organizaciones de Base
          </h2>
          <p className="text-[7px] text-slate-400 font-bold uppercase tracking-[0.15em]">
            Consejos comunales de tu comuna
          </p>
        </div>
        <div className="relative">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-2.5 w-2.5 text-slate-300" />
          <input
            type="text"
            placeholder="Buscar..."
            value={searchTerm}
            onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }}
            className="pl-7 pr-2 py-1 rounded-lg border border-gray-100 bg-gray-50 text-[9px] font-medium focus:ring-1 focus:ring-brand-primary/20 outline-none w-48"
          />
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-6">
          <Loader2 className="animate-spin text-brand-primary" size={20} />
        </div>
      ) : error ? (
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 text-center">
          <AlertCircle className="h-5 w-5 text-amber-600 mx-auto mb-0.5" />
          <p className="text-[9px] font-black text-amber-800">{error}</p>
        </div>
      ) : (
        <div className="flex flex-col lg:flex-row gap-6">
          {/* Columna izquierda: Listado de consejos */}
          <div className="flex-1 min-w-0">
            {paginatedConsejos.length === 0 ? (
              <div className="bg-white rounded-lg border border-gray-100 p-5 text-center">
                <Building2 className="h-6 w-6 text-slate-300 mx-auto mb-1" />
                <p className="text-[10px] font-black text-slate-500">No hay consejos comunales registrados en tu comuna.</p>
              </div>
            ) : (
              <>
                <div className="bg-white rounded-lg border border-gray-100 overflow-hidden shadow-sm">
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b border-gray-100 bg-gray-50/50">
                          <th className="text-left px-2 py-1.5 text-[7px] font-black text-slate-400 uppercase tracking-wider">Consejo Comunal</th>
                          <th className="text-left px-2 py-1.5 text-[7px] font-black text-slate-400 uppercase tracking-wider">Sector</th>
                          <th className="text-left px-2 py-1.5 text-[7px] font-black text-slate-400 uppercase tracking-wider">RIF</th>
                          <th className="text-center px-2 py-1.5 text-[7px] font-black text-slate-400 uppercase tracking-wider">Estatus</th>
                          <th className="text-center px-2 py-1.5 text-[7px] font-black text-slate-400 uppercase tracking-wider">Acciones</th>
                        </tr>
                      </thead>
                      <tbody>
                        {paginatedConsejos.map((consejo, idx) => (
                          <tr 
                            key={consejo.id_consejo}
                            onClick={() => loadProfile(consejo)}
                            className={cn(
                              "border-b border-gray-50 hover:bg-gray-50/50 transition-colors cursor-pointer group",
                              idx % 2 === 0 ? "bg-white" : "bg-gray-50/30"
                            )}
                          >
                            <td className="px-2 py-2">
                              <div className="flex items-center gap-1.5">
                                <div className="h-5 w-5 rounded-md bg-brand-primary/5 flex items-center justify-center text-brand-primary group-hover:bg-brand-primary group-hover:text-white">
                                  <Building2 className="h-2.5 w-2.5" />
                                </div>
                                <span className="text-[9px] font-black text-slate-800 uppercase italic truncate max-w-[150px]">
                                  {consejo.nombre_consejo}
                                </span>
                              </div>
                            </td>
                            <td className="px-2 py-2">
                              <div className="flex items-center gap-0.5">
                                <MapPin className="h-2 w-2 text-slate-400" />
                                <span className="text-[8px] font-medium text-slate-600 truncate max-w-[100px]">
                                  {consejo.nombre_sector}
                                </span>
                              </div>
                            </td>
                            <td className="px-2 py-2">
                              <div className="flex items-center gap-0.5">
                                <ShieldCheck className="h-2 w-2 text-brand-primary" />
                                <span className="text-[8px] font-mono font-bold text-slate-500">
                                  {consejo.rif?.slice(0, 8) || '—'}
                                </span>
                              </div>
                            </td>
                            <td className="px-2 py-2 text-center">
                              <span className={cn(
                                "inline-flex px-1 py-0.5 rounded-md text-[6px] font-black uppercase tracking-wider",
                                consejo.estatus === "Activo" ? "bg-emerald-50 text-emerald-600" : "bg-rose-50 text-rose-600"
                              )}>
                                {consejo.estatus === "Activo" ? "Activo" : "Inactivo"}
                              </span>
                            </td>
                            <td className="px-2 py-2 text-center">
                              <button className="inline-flex items-center justify-center gap-0.5 text-[7px] font-black text-brand-primary uppercase group-hover:translate-x-0.5 transition-transform">
                                Ver <ChevronRight className="h-1.5 w-1.5" />
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Paginación compacta */}
                <div className="flex items-center justify-between mt-3">
                  <p className="text-[7px] font-black text-slate-400 uppercase tracking-wider">
                    {paginatedConsejos.length} de {filteredConsejos.length}
                  </p>
                  
                  {totalPages > 1 && (
                    <div className="flex gap-1">
                      <button
                        onClick={() => setCurrentPage(p => Math.max(p - 1, 1))}
                        disabled={currentPage === 1}
                        className="px-2 py-0.5 rounded-md bg-gray-100 text-slate-600 text-[8px] font-black disabled:opacity-50 hover:bg-gray-200"
                      >
                        ←
                      </button>
                      <div className="flex gap-0.5">
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
                                "w-5 h-5 rounded-md text-[8px] font-black transition-all",
                                currentPage === pageNum
                                  ? "bg-brand-primary text-white"
                                  : "bg-gray-100 text-slate-600 hover:bg-gray-200"
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
                        className="px-2 py-0.5 rounded-md bg-gray-100 text-slate-600 text-[8px] font-black disabled:opacity-50 hover:bg-gray-200"
                      >
                        →
                      </button>
                    </div>
                  )}
                </div>
              </>
            )}
          </div>

          {/* Columna derecha: Resumen del censo */}
          <div className="lg:w-80 flex-shrink-0">
            <ResumenCensoCard
              totalHabitantes={censoTotales.habitantes}
              totalFamilias={censoTotales.familias}
              totalNinos={censoTotales.ninos}
              totalJovenes={censoTotales.jovenes}
              totalAdultosMayores={censoTotales.adultosMayores}
              totalCasosSalud={censoTotales.casosSalud}
              totalBombonas={censoTotales.bombonas}
              tasaMigracion={censoTotales.tasaMigracion}
              comunaNombre={nombreComuna}
            />
          </div>
        </div>
      )}

      {/* AlertModal simple */}
      {modalState.isOpen && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-xl max-w-md w-full p-5 shadow-xl">
            <h3 className="text-lg font-black text-slate-800 mb-2">{modalState.title}</h3>
            <p className="text-sm text-slate-600 mb-4">{modalState.message}</p>
            <div className="flex justify-end gap-2">
              <button
                onClick={closeAlert}
                className="px-4 py-2 rounded-lg bg-gray-100 text-slate-700 text-sm font-bold"
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};