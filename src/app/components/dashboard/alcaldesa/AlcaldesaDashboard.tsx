import React, { useState, useEffect } from 'react';
import { 
  LayoutDashboard, 
  Map as MapIcon, 
  Target, 
  Briefcase, 
  Heart, 
  BarChart3, 
  Search, 
  Filter, 
  ShieldAlert, 
  ChevronRight, 
  ChevronLeft, 
  LogOut, 
  FileCheck, 
  Menu,
  Activity,
  Globe,
  Star,
  Users,
  HardHat,
  Monitor,
  Bell,
  ArrowUpRight,
  ChevronDown,
  Building2,
  CheckCircle2,
  AlertCircle,
  Eye,
  MessageSquare,
  TrendingUp,
  Clock,
  ExternalLink,
  Zap
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/app/lib/utils';
import { UserBase } from '@/types';
import { DashboardNavbar } from '../common/DashboardNavbar';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip as RechartsTooltip, 
  ResponsiveContainer, 
  Cell,
  PieChart,
  Pie,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  Radar,
  AreaChart,
  Area
} from 'recharts';

interface NavItem {
  id: string;
  label: string;
  icon: React.ElementType;
  children?: { id: string; label: string }[];
}

const ALC_NAV_ITEMS: NavItem[] = [
  { id: 'dashboard', label: 'Monitor Municipal', icon: LayoutDashboard },
  { 
    id: 'geopolitica', 
    label: 'Geopolítica Comunal', 
    icon: Globe,
    children: [
      { id: 'mapa_interactivo', label: 'Mapa Interactivo' },
      { id: 'zonas_atencion', label: 'Zonas de Atención' },
    ]
  },
  { id: 'las_7t', label: 'Las 7 Transformaciones', icon: Target },
  { 
    id: 'gestion_proyectos', 
    label: 'Proyectos e Inversión', 
    icon: Briefcase,
    children: [
      { id: 'por_aprobar', label: 'Por Aprobar' },
      { id: 'en_ejecucion', label: 'En Ejecución' },
      { id: 'impacto_inversion', label: 'Impacto de Inversión' },
    ]
  },
  { 
    id: 'radar_social', 
    label: 'Radar Social', 
    icon: Heart,
    children: [
      { id: 'adulto_mayor', label: 'Adulto Mayor' },
      { id: 'salud_emergencias', label: 'Salud y Emergencias' },
    ]
  },
  { id: 'rendicion', label: 'Rendición de Cuentas', icon: FileCheck },
];

const DATA_7T = [
  { subject: 'Económica', A: 85, fullMark: 100 },
  { subject: 'Servicios', A: 45, fullMark: 100 },
  { subject: 'Seguridad', A: 90, fullMark: 100 },
  { subject: 'Social', A: 75, fullMark: 100 },
  { subject: 'Política', A: 95, fullMark: 100 },
  { subject: 'Ecología', A: 60, fullMark: 100 },
  { subject: 'Geopolítica', A: 80, fullMark: 100 },
];

const INVESTMENT_BY_CIRCUIT = [
  { name: 'Circuito 1', value: 450000 },
  { name: 'Circuito 2', value: 320000 },
  { name: 'Circuito 3', value: 680000 },
  { name: 'Circuito 4', value: 290000 },
  { name: 'Circuito 5', value: 510000 },
];

export const AlcaldesaDashboard = ({ user, onLogout }: { user: any; onLogout: () => void }) => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [expandedItems, setExpandedItems] = useState<string[]>(['geopolitica', 'gestion_proyectos', 'radar_social']);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const toggleExpand = (id: string) => {
    setExpandedItems(prev => 
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
  };

  // Handle responsiveness
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth < 1024) {
        setIsSidebarOpen(false);
      } else {
        setIsSidebarOpen(true);
      }
    };
    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const menuGroups = [
    {
      label: "Estratégico",
      items: [
        { id: 'dashboard', label: 'Monitor Municipal', icon: LayoutDashboard },
        { 
          id: 'geopolitica', 
          label: 'Geopolítica Comunal', 
          icon: Globe,
          children: [
            { id: 'mapa_interactivo', label: 'Mapa Interactivo' },
            { id: 'zonas_atencion', label: 'Zonas de Atención' },
          ]
        },
      ]
    },
    {
      label: "Gestión",
      items: [
        { id: 'las_7t', label: 'Las 7 Transformaciones', icon: Target },
        { 
          id: 'gestion_proyectos', 
          label: 'Proyectos e Inversión', 
          icon: Briefcase,
          children: [
            { id: 'por_aprobar', label: 'Por Aprobar' },
            { id: 'en_ejecucion', label: 'En Ejecución' },
            { id: 'impacto_inversion', label: 'Impacto de Inversión' },
          ]
        },
      ]
    },
    {
      label: "Social",
      items: [
        { 
          id: 'radar_social', 
          label: 'Radar Social', 
          icon: Heart,
          children: [
            { id: 'adulto_mayor', label: 'Adulto Mayor' },
            { id: 'salud_emergencias', label: 'Salud y Emergencias' },
          ]
        },
        { id: 'rendicion', label: 'Rendición de Cuentas', icon: FileCheck },
      ]
    }
  ];

  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard':
        return <DashboardView user={user} />;
      case 'por_aprobar':
        return <ApprovalView />;
      default:
        return (
          <div className="flex items-center justify-center h-[calc(100vh-200px)]">
            <div className="text-center p-12 bg-white rounded-[3rem] border border-slate-100 shadow-xl max-w-lg">
               <div className="w-20 h-20 bg-brand-primary/5 rounded-full flex items-center justify-center mx-auto mb-6">
                  <Star className="text-brand-primary w-10 h-10 animate-pulse" />
               </div>
               <h2 className="text-2xl font-black text-slate-900 italic tracking-tighter uppercase mb-4">Dimensión en Desarrollo</h2>
               <p className="text-slate-500 font-medium leading-relaxed">
                  Esta sección del Monitor Municipal está siendo consolidada con datos en tiempo real de las Direcciones Técnicas.
               </p>
            </div>
          </div>
        );
    }
  };

  return (
    <div className="flex h-screen bg-[#F8FAFC]">
      {/* Sidebar - Executive Style (Light version per user request) */}
      <motion.aside
        animate={{ 
          width: isSidebarOpen ? 320 : 80,
        }}
        className={cn(
          "fixed lg:relative inset-y-0 left-0 bg-white border-r border-slate-100 text-slate-900 z-50 flex flex-col transition-all duration-300",
          !isSidebarOpen && "items-center",
          isMobileMenuOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
        )}
      >
        <div className="p-6 flex items-center justify-between border-b border-gray-50 shrink-0">
          <div className={cn("flex items-center gap-3 overflow-hidden transition-all", !isSidebarOpen && "lg:hidden")}>
             <div className="h-10 w-10 bg-brand-primary rounded-xl flex items-center justify-center shrink-0 shadow-lg shadow-brand-primary/20">
                <Building2 className="text-white w-6 h-6" />
             </div>
             <div>
                <h1 className="font-black text-lg tracking-tighter leading-none text-slate-900 uppercase">ALCALDÍA</h1>
                <p className="text-[9px] text-brand-primary font-bold uppercase tracking-widest mt-1">Carrizal Participa</p>
             </div>
          </div>
          <button 
            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
            className="p-2 -mr-2 rounded-xl hover:bg-gray-50 flex items-center justify-center transition-colors"
          >
            <Menu className="h-5 w-5 text-slate-500" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto py-6 px-3 space-y-6 custom-scrollbar">
          {menuGroups.map((group, gIdx) => (
            <div key={gIdx} className="space-y-1">
              {group.label && isSidebarOpen && (
                <p className="px-3 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-3">
                  {group.label}
                </p>
              )}
              {group.items.map((item) => {
                const isActive = activeTab === item.id || (item.children && item.children.some(c => c.id === activeTab));
                return (
                  <div key={item.id}>
                    <button
                      onClick={() => {
                        if (item.children) toggleExpand(item.id);
                        else {
                          setActiveTab(item.id);
                          if (window.innerWidth < 1024) setIsMobileMenuOpen(false);
                        }
                      }}
                      className={cn(
                        "w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-bold transition-all relative group",
                        isActive
                          ? "bg-brand-primary/10 text-brand-primary" 
                          : "text-slate-500 hover:bg-gray-50 hover:text-slate-800"
                      )}
                    >
                      <item.icon 
                        className={cn(
                          "h-5 w-5 shrink-0 transition-transform group-hover:scale-110", 
                          isActive ? "text-brand-primary" : "text-slate-400"
                        )} 
                      />
                      {isSidebarOpen && (
                        <span className="truncate flex-1 text-left">{item.label}</span>
                      )}
                      {isSidebarOpen && item.children && (
                        <ChevronDown className={cn("transition-transform duration-300 opacity-50", expandedItems.includes(item.id) ? "rotate-180" : "")} size={14} />
                      )}
                      {isActive && isSidebarOpen && (
                        <motion.div
                          layoutId="activeNavAlcaldesa"
                          className="ml-auto w-1 h-4 rounded-full bg-brand-primary"
                        />
                      )}
                    </button>
                    
                    {isSidebarOpen && item.children && expandedItems.includes(item.id) && (
                      <div className="mt-1 ml-9 space-y-1 border-l-2 border-brand-primary/5 pl-3 py-1">
                        {item.children.map(child => (
                          <button
                            key={child.id}
                            onClick={() => {
                              setActiveTab(child.id);
                              if (window.innerWidth < 1024) setIsMobileMenuOpen(false);
                            }}
                            className={cn(
                              "w-full text-left px-3 py-2 text-[10px] font-bold uppercase tracking-wider rounded-lg transition-all",
                              activeTab === child.id 
                                ? "text-brand-primary bg-brand-primary/5" 
                                : "text-slate-400 hover:text-slate-900 hover:bg-slate-50"
                            )}
                          >
                            {child.label}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          ))}
        </div>

        <div className="p-4 border-t border-slate-50 space-y-2">
          {isSidebarOpen && (
            <div className="flex flex-col gap-1 px-3 mb-4">
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Alcaldesa</p>
              <p className="text-xs font-bold text-slate-800">{user.firstName} {user.lastName}</p>
            </div>
          )}
          <button 
            onClick={onLogout}
            className={cn(
              "w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-bold transition-all",
              "text-rose-500 hover:bg-rose-50 hover:text-rose-600",
              !isSidebarOpen && "justify-center"
            )}
          >
            <LogOut size={20} className={cn(!isSidebarOpen && "mx-auto")} />
            {isSidebarOpen && <span>Finalizar Gestión</span>}
          </button>
        </div>
      </motion.aside>

      {/* Main Execution Content */}
      <main className="flex-1 flex flex-col overflow-hidden">
        <DashboardNavbar 
          user={user}
          title="Monitor Municipal 360°"
          subtitle={`Dra. Morales | ${user.vinculoAdministrativo}`}
          onMobileMenuOpen={() => setIsMobileMenuOpen(true)}
          roleIcon={<Building2 size={24} />}
          actions={
            <div className="hidden xl:flex items-center gap-3 bg-slate-50 border border-slate-100 px-5 py-2.5 rounded-2xl">
              <div className="text-right">
                 <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1">Corte de Reporte</p>
                 <p className="text-xs font-black text-slate-900 tracking-tight leading-none">22 de Abril, 2026</p>
              </div>
              <Clock className="text-slate-300 w-8 h-8" strokeWidth={1.5} />
            </div>
          }
        />

        {/* Content Display */}
         <div className="flex-1 overflow-y-auto p-10 custom-scrollbar">
            <AnimatePresence mode="wait">
               {renderContent()}
            </AnimatePresence>
         </div>
      </main>
    </div>
  );
};

const DashboardView = ({ user }: { user: UserBase }) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -30 }}
      transition={{ duration: 0.6, ease: 'easeOut' }}
      className="space-y-12"
    >
      {/* Banner de "Impacto Real" (KPIs Globales) */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
         <HighLevelKPI 
           label="Población Atendida" 
           value="128,450" 
           sub="Carrizaleños hoy" 
           icon={Users} 
           color="bg-brand-primary" 
           trend="+12% vs mes anterior"
         />
         <HighLevelKPI 
           label="Proyectos Culminados" 
           value="45" 
           sub="Obras físicas listas" 
           icon={CheckCircle2} 
           color="bg-emerald-500" 
           trend="8 obras este trimestre"
         />
         <HighLevelKPI 
           label="Organización Popular" 
           value="94%" 
           sub="Vocerías Vigentes" 
           icon={Globe} 
           color="bg-indigo-600" 
           trend="60 Consejos activos"
         />
         <HighLevelKPI 
           label="Inversión Social" 
           value="Bs. 2.4M" 
           sub="Total ejecutado" 
           icon={TrendingUp} 
           color="bg-amber-500" 
           trend="78% del presupuesto POA"
         />
      </div>

      {/* Center Section: Heatmap & Radar */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-10">
         {/* Mapa de Calor Municipal */}
         <div className="xl:col-span-2 bg-white rounded-[3rem] border border-slate-100 shadow-xl shadow-slate-200/40 overflow-hidden flex flex-col h-[600px] group transition-all hover:shadow-2xl">
            <div className="p-8 border-b border-slate-50 flex items-center justify-between bg-slate-50/20">
               <div>
                  <h3 className="text-xl font-black text-slate-900 tracking-tighter italic uppercase leading-none">Centro de Gestión Territorial</h3>
                  <p className="text-[10px] text-slate-400 font-bold uppercase tracking-[0.3em] mt-3">Mapa de Calor: Estatus de Nudos Críticos</p>
               </div>
               <div className="flex gap-2">
                  <div className="flex items-center gap-6 bg-white px-6 py-2 rounded-2xl border border-slate-100 shadow-sm">
                     <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full bg-rose-500" />
                        <span className="text-[10px] font-black text-slate-600 uppercase">Crítico</span>
                     </div>
                     <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full bg-emerald-500" />
                        <span className="text-[10px] font-black text-slate-600 uppercase">Sin Nudos</span>
                     </div>
                  </div>
               </div>
            </div>
            <div className="flex-1 bg-slate-100 relative overflow-hidden">
               {/* Decorative map representation */}
               <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10" />
               <div className="absolute inset-0 bg-gradient-to-b from-transparent via-white/5 to-white/20" />

               {/* Polygons (Abstract representation) */}
               <div className="absolute top-[30%] left-[20%] w-64 h-64 bg-rose-500/20 rounded-[5rem] rotate-12 blur-2xl animate-pulse" />
               <div className="absolute bottom-[20%] right-[25%] w-80 h-80 bg-emerald-500/10 rounded-[8rem] -rotate-12 blur-3xl" />

               {/* Interaction Markers */}
               <Marker pos={{ t: '40%', l: '35%' }} color="rose" label="Nudos Críticos: 12" />
               <Marker pos={{ t: '65%', l: '60%' }} color="emerald" label="Atención: Completada" />
               <Marker pos={{ t: '20%', l: '70%' }} color="amber" label="Obra: Ejecución 80%" />

               <div className="absolute bottom-10 left-10 bg-white/90 backdrop-blur-xl p-6 rounded-[2rem] border border-white/50 shadow-2xl max-w-sm">
                  <h4 className="text-sm font-black text-slate-900 uppercase italic mb-3">Zona: Casco Central</h4>
                  <div className="space-y-3">
                     <div className="flex justify-between items-center text-[10px] font-bold">
                        <span className="text-slate-400">ORGANIZACIÓN</span>
                        <span className="text-slate-900">VIGENTE</span>
                     </div>
                     <div className="flex justify-between items-center text-[10px] font-bold">
                        <span className="text-slate-400">NUDOS CRÍTICOS</span>
                        <span className="text-rose-500">3 URGENTES</span>
                     </div>
                     <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
                        <div className="h-full w-3/4 bg-brand-primary rounded-full shadow-[0_0_8px_rgba(4,45,95,0.3)]" />
                     </div>
                  </div>
               </div>
            </div>
         </div>

         {/* 7T Progress - Radar Chart */}
         <div className="bg-[#030712] rounded-[3rem] p-10 text-white shadow-2xl flex flex-col h-[600px] border border-white/5 relative overflow-hidden group">
            <div className="relative z-10">
               <h3 className="text-xl font-black italic tracking-tighter uppercase leading-none">Plan de las 7 Transformaciones</h3>
               <p className="text-[10px] text-cyan-400 font-bold uppercase tracking-[0.3em] mt-3">Balance Global del Municipio</p>
            </div>
            
            <div className="flex-1 relative z-10 flex items-center justify-center mt-6">
               <ResponsiveContainer width="100%" height="100%">
                  <RadarChart cx="50%" cy="50%" outerRadius="80%" data={DATA_7T}>
                     <PolarGrid stroke="#1F2937" strokeWidth={1} />
                     <PolarAngleAxis dataKey="subject" tick={{ fill: '#94A3B8', fontSize: 10, fontWeight: 900 }} />
                     <Radar
                        name="Progreso"
                        dataKey="A"
                        stroke="#22D3EE"
                        fill="#22D3EE"
                        fillOpacity={0.6}
                     />
                     <RechartsTooltip 
                       contentStyle={{ background: '#030712', border: '1px solid #1F2937', borderRadius: '16px' }}
                       itemStyle={{ color: '#22D3EE', fontWeight: 'bold' }}
                     />
                  </RadarChart>
               </ResponsiveContainer>
            </div>

            <div className="relative z-10 mt-6 space-y-4">
               <div className="flex items-center justify-between p-4 bg-white/5 border border-white/5 rounded-2xl">
                  <div className="flex items-center gap-3">
                     <TrendingUp className="text-cyan-400 w-5 h-5" />
                     <span className="text-xs font-black uppercase tracking-tight">Mayor Avance</span>
                  </div>
                  <span className="text-xs font-black text-cyan-400">POLÍTICA (95%)</span>
               </div>
               <div className="flex items-center justify-between p-4 bg-rose-500/10 border border-rose-500/10 rounded-2xl">
                  <div className="flex items-center gap-3">
                     <AlertCircle className="text-rose-500 w-5 h-5" />
                     <span className="text-xs font-black uppercase tracking-tight">Zona Crítica</span>
                  </div>
                  <span className="text-xs font-black text-rose-500 uppercase italic">SERVICIOS</span>
               </div>
            </div>

            <div className="absolute -bottom-20 -right-20 w-64 h-64 bg-cyan-400/5 rounded-full blur-[100px]" />
         </div>
      </div>

      {/* Widgets de Control Crítico & Quick Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
         {/* Alertas del Secretario */}
         <div className="bg-white rounded-[3rem] border border-slate-100 shadow-xl p-8 flex flex-col space-y-6">
            <div className="flex items-center justify-between mb-2">
               <h3 className="text-sm font-black text-slate-900 italic uppercase">Alertas del Secretario</h3>
               <ShieldAlert className="text-rose-500 w-6 h-6 animate-pulse" />
            </div>
            
            <div className="space-y-4">
               <AlertFeedItem 
                 type="salud" 
                 title="Salud Extrema - Eje 1" 
                 desc="3 casos quirúrgicos elevados por Secretario. Requieren aprobación de fondos." 
                 time="Hace 12 min"
               />
               <AlertFeedItem 
                 type="legal" 
                 title="Vigencia Legal Crítica" 
                 desc="5 Consejos Comunales con vocerías vencidas. Riesgo de parálisis administrativa." 
                 time="Hace 1 hora"
               />
               <AlertFeedItem 
                 type="obra" 
                 title="Obra Paralizada - Brisas" 
                 desc="Falta de insumos reportada en T2. Equipo técnico solicita inspección." 
                 time="Hace 3 horas"
               />
            </div>

            <button className="w-full py-4 bg-slate-50 text-brand-primary text-[10px] font-black uppercase tracking-[0.2em] rounded-2xl hover:bg-brand-primary hover:text-white transition-all border border-brand-primary/5 mt-auto">
               Ver Inbox Completo
            </button>
         </div>

         {/* Top 5 Nudos Críticos (Impacto) */}
         <div className="bg-white rounded-[3rem] border border-slate-100 shadow-xl p-8 flex flex-col h-full">
            <div className="flex items-center justify-between mb-8">
               <h3 className="text-sm font-black text-slate-900 italic uppercase">Impacto: Nudos Críticos</h3>
               <BarChart3 className="text-slate-300 w-6 h-6" />
            </div>
            
            <div className="flex-1 space-y-6">
               <CriticalBar label="Agua Potable (T2)" value={85} count={42} color="bg-brand-primary" />
               <CriticalBar label="Vialidad (T2)" value={65} count={28} color="bg-amber-500" />
               <CriticalBar label="Gas Comunal (T2)" value={45} count={19} color="bg-cyan-500" />
               <CriticalBar label="Alimentación (T4)" value={30} count={12} color="bg-emerald-500" />
               <CriticalBar label="Seguridad (T3)" value={20} count={8} color="bg-indigo-500" />
            </div>

            <div className="mt-8 p-4 bg-brand-primary/5 rounded-2xl border border-brand-primary/5 flex items-center gap-3">
               <Zap className="text-brand-primary w-5 h-5 fill-brand-primary" />
               <p className="text-[10px] font-bold text-slate-600 italic">Tendencia: Servicios Públicos representa el 74% de las solicitudes.</p>
            </div>
         </div>

         {/* Quick Actions - Executive Style */}
         <div className="flex flex-col gap-6">
            <button className="flex-1 bg-brand-primary text-white p-8 rounded-[3rem] shadow-2xl shadow-brand-primary/20 group relative overflow-hidden transition-all hover:-translate-y-1 active:scale-95">
               <div className="relative z-10 flex flex-col h-full text-left">
                  <div className="w-12 h-12 bg-white/20 rounded-2xl flex items-center justify-center mb-4 backdrop-blur-md">
                     <FileCheck size={24} />
                  </div>
                  <h3 className="text-2xl font-black italic tracking-tighter leading-none mb-2">Autorizar Proyectos</h3>
                  <p className="text-[10px] text-cyan-300 font-bold uppercase tracking-widest opacity-80">4 Obras esperando su aval final</p>
                  <div className="mt-auto pt-6 flex items-center gap-2 group-hover:gap-4 transition-all">
                     <span className="text-[11px] font-black uppercase tracking-widest">Abrir Bandeja</span>
                     <ChevronRight size={16} />
                  </div>
               </div>
               <div className="absolute -bottom-10 -right-10 w-48 h-48 bg-cyan-400/20 rounded-full blur-3xl transition-transform group-hover:scale-125" />
            </button>

            <button className="flex-1 bg-slate-900 text-white p-8 rounded-[3rem] shadow-2xl group relative overflow-hidden transition-all hover:-translate-y-1 active:scale-95">
               <div className="relative z-10 flex flex-col h-full text-left">
                  <div className="w-12 h-12 bg-white/10 rounded-2xl flex items-center justify-center mb-4">
                     <MessageSquare size={24} className="text-cyan-400" />
                  </div>
                  <h3 className="text-2xl font-black italic tracking-tighter leading-none mb-2">Mensaje a Voceros</h3>
                  <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest opacity-80">Enock masivo a todas las bases (SMS/APP)</p>
                  <div className="mt-auto pt-6 flex items-center gap-2 group-hover:gap-4 transition-all">
                     <span className="text-[11px] font-black uppercase tracking-widest text-cyan-400">Redactar Mensaje</span>
                     <ChevronRight size={16} className="text-cyan-400" />
                  </div>
               </div>
               <div className="absolute top-0 right-0 w-32 h-32 bg-brand-primary/10 rounded-full blur-3xl" />
            </button>
         </div>
      </div>

      {/* Instrumento de Caracterización Integrated Section */}
      <div className="bg-white rounded-[3rem] border border-slate-100 shadow-xl p-10 overflow-hidden relative group">
          <div className="flex items-center justify-between mb-10 pb-6 border-b border-slate-50">
             <div>
                <h3 className="text-2xl font-black text-slate-900 italic tracking-tighter uppercase leading-none">Diagnóstico de Capacidades Instaladas</h3>
                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-[0.4em] mt-3 italic">Instrumento de Caracterización Integral 2026</p>
             </div>
             <button className="flex items-center gap-3 px-6 py-3 bg-slate-50 text-slate-900 text-[10px] font-black uppercase tracking-widest rounded-2xl border border-slate-200 hover:bg-slate-100 transition-all shadow-sm active:scale-95">
                Imprimir Informe Técnico <ExternalLink size={14} />
             </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12">
             <MetricRing label="Liderazgo" value="84%" desc="Capacidad de Oratoria y Conflicto" color="text-brand-primary" sub="Voceros 7T Evaluados" />
             <MetricRing label="Territorio" value="92%" desc="Ejes Cartografiados Digitalmente" color="text-emerald-500" sub="10 Salas con Mapa Social" />
             <MetricRing label="Infraestructura" value="68%" desc="Salas con Conectividad Estable" color="text-amber-500" sub="Déficit en Fibra Óptica" />
             <MetricRing label="Administración" value="75%" desc="Rendición de Cuentas al Día" color="text-indigo-600" sub="Expedientes SITUR" />
          </div>

          <div className="absolute -bottom-20 -left-20 w-80 h-80 bg-brand-primary/5 rounded-full blur-[100px]" />
      </div>
    </motion.div>
  );
};

/* --- Sub-Views --- */

const ApprovalView = () => {
   const [selectedProject, setSelectedProject] = useState<any>(null);

   const projects = [
      { id: 1, title: 'Reasfaltado Calle El Centro', eje: 'Casco Central', monto: 'Bs. 125,000', status: 'pending_mayor', before: 'https://images.unsplash.com/photo-1531233076846-bc7b334a17d7?q=80&w=800', after: 'https://images.unsplash.com/photo-1545143333-11b2cf246934?q=80&w=800', validatedBy: ['Digitalización', 'Comunas'] },
      { id: 2, title: 'Sistema de Alumbrado LED', eje: 'Brisas', monto: 'Bs. 82,400', status: 'pending_mayor', before: 'https://images.unsplash.com/photo-1533154112330-8d58721c5f3e?q=80&w=800', after: 'https://images.unsplash.com/photo-1447069387593-a5de0862581e?q=80&w=800', validatedBy: ['Planificación', 'Comunas', 'Digitalización'] },
   ];

   return (
      <div className="space-y-10">
         <div className="grid grid-cols-1 xl:grid-cols-3 gap-10">
            <div className="xl:col-span-2 space-y-6">
                <h3 className="text-xl font-black text-slate-900 italic uppercase">Proyectos por Autorizar</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                   {projects.map(p => (
                     <div 
                        key={p.id}
                        onClick={() => setSelectedProject(p)}
                        className={cn(
                          "bg-white p-8 rounded-[2.5rem] border transition-all cursor-pointer group hover:shadow-2xl",
                          selectedProject?.id === p.id ? "border-brand-primary shadow-xl ring-2 ring-brand-primary/10" : "border-slate-100 shadow-lg"
                        )}
                      >
                        <div className="flex justify-between items-start mb-6">
                           <div className="w-12 h-12 bg-slate-50 rounded-2xl flex items-center justify-center text-slate-400 group-hover:text-brand-primary group-hover:bg-brand-primary/5 transition-colors">
                              <Briefcase size={22} />
                           </div>
                           <div className="px-3 py-1 bg-amber-50 text-amber-600 rounded-full border border-amber-100 text-[9px] font-black uppercase">Espera Visto Bueno</div>
                        </div>
                        <h4 className="text-lg font-black text-slate-900 leading-tight mb-2 uppercase italic">{p.title}</h4>
                        <div className="flex items-center gap-2 mb-6">
                           <MapIcon size={12} className="text-slate-400" />
                           <span className="text-[10px] font-bold text-slate-500 uppercase">{p.eje}</span>
                        </div>
                        <div className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl border border-slate-100">
                           <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none">Inversión Solicitada</span>
                           <span className="text-sm font-black text-brand-primary italic">{p.monto}</span>
                        </div>
                     </div>
                   ))}
                </div>
            </div>

            <div className="space-y-6">
               <h3 className="text-xl font-black text-slate-900 italic uppercase leading-none">Ficha del Proyecto</h3>
               <AnimatePresence mode="wait">
                  {selectedProject ? (
                    <motion.div
                       key={selectedProject.id}
                       initial={{ opacity: 0, x: 20 }}
                       animate={{ opacity: 1, x: 0 }}
                       exit={{ opacity: 0, x: -20 }}
                       className="bg-[#030712] rounded-[3rem] p-10 text-white shadow-2xl space-y-10 border border-white/5"
                    >
                       <div>
                          <div className="flex items-center gap-2 text-cyan-400 mb-4">
                             <TrendingUp size={16} />
                             <span className="text-[10px] font-black uppercase tracking-[0.3em]">Bidireccionalidad: Antes / Después</span>
                          </div>
                          
                          {/* Antes y Después Slider Concept (Simulado) */}
                          <div className="relative h-64 rounded-3xl overflow-hidden border border-white/10 group cursor-ew-resize">
                             <img src={selectedProject.after} className="absolute inset-0 w-full h-full object-cover" alt="Después" />
                             <div className="absolute inset-0 w-1/2 overflow-hidden border-r-2 border-white shadow-[10px_0_20px_rgba(0,0,0,0.5)] z-10 transition-all duration-300 group-hover:w-[70%]">
                                <img src={selectedProject.before} className="absolute inset-0 w-full h-full object-cover" alt="Antes" style={{ width: '400px' }} />
                                <div className="absolute top-4 left-4 bg-rose-600/80 backdrop-blur-md px-3 py-1 rounded-full text-[9px] font-black uppercase letter-widest">Estado Inicial</div>
                             </div>
                             <div className="absolute top-4 right-4 bg-emerald-600/80 backdrop-blur-md px-3 py-1 rounded-full text-[9px] font-black uppercase letter-widest">Proyecto Propuesto</div>
                             <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                <div className="w-12 h-12 rounded-full bg-white/20 backdrop-blur-lg flex items-center justify-center border border-white/20">
                                   <Zap size={24} className="text-cyan-400" />
                                </div>
                             </div>
                          </div>
                       </div>

                       <div className="space-y-6">
                           <h4 className="text-sm font-black text-slate-400 uppercase tracking-widest italic leading-none">Trazabilidad Técnica</h4>
                           <div className="space-y-4">
                              {selectedProject.validatedBy.map((dir: string, i: number) => (
                                <div key={i} className="flex items-center justify-between p-4 bg-white/5 border border-white/5 rounded-2xl group hover:border-cyan-400/30 transition-colors">
                                   <div className="flex items-center gap-3">
                                      <div className="w-8 h-8 rounded-xl bg-emerald-500/20 text-emerald-500 flex items-center justify-center">
                                         <CheckCircle2 size={16} />
                                      </div>
                                      <span className="text-xs font-black uppercase tracking-tight italic">{dir}</span>
                                   </div>
                                   <span className="text-[9px] text-slate-500 font-bold">FECHA: 21/04</span>
                                </div>
                              ))}
                           </div>
                       </div>

                       <button className="w-full py-6 bg-brand-primary text-white text-[12px] font-black uppercase tracking-[0.3em] rounded-[2rem] hover:bg-brand-secondary transition-all shadow-xl shadow-brand-primary/20 flex items-center justify-center gap-4 active:scale-95 group">
                          FIRMAR Y AUTORIZAR <ShieldAlert size={18} className="group-hover:rotate-12 transition-transform" />
                       </button>
                    </motion.div>
                  ) : (
                    <div className="bg-slate-100 rounded-[3rem] border-2 border-dashed border-slate-200 flex flex-col items-center justify-center p-12 text-center h-[500px]">
                       <Eye className="text-slate-300 w-16 h-16 mb-4" />
                       <p className="text-slate-400 font-black uppercase text-[10px] tracking-widest leading-relaxed">Seleccione un proyecto para visualizar su impacto bidireccional y trazabilidad técnica</p>
                    </div>
                  )}
               </AnimatePresence>
            </div>
         </div>
      </div>
   );
};

/* --- Helper Components --- */

const HighLevelKPI = ({ label, value, sub, icon: Icon, color, trend }: any) => (
  <div className="bg-white p-10 rounded-[3rem] border border-slate-100 shadow-xl shadow-slate-200/30 group transition-all hover:shadow-2xl hover:-translate-y-1 overflow-hidden relative">
     <div className="relative z-10 flex flex-col items-center text-center">
        <div className={cn("inline-flex p-5 rounded-3xl text-white shadow-2xl mb-8 group-hover:scale-110 transition-transform duration-500", color)}>
           <Icon size={32} strokeWidth={1.5} />
        </div>
        <h3 className="text-[11px] font-black text-slate-400 uppercase tracking-[0.3em] leading-none mb-3">{label}</h3>
        <p className="text-4xl font-black text-slate-900 tracking-tighter leading-none mb-3">{value}</p>
        <p className="text-[10px] text-slate-500 font-bold uppercase tracking-tight italic opacity-60">{sub}</p>
        
        <div className="mt-8 pt-8 border-t border-slate-50 w-full flex items-center justify-center gap-2">
           <Activity size={14} className="text-brand-primary" />
           <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">{trend}</span>
        </div>
     </div>
     <div className="absolute -bottom-10 -right-10 w-32 h-32 bg-slate-50 rounded-full blur-2xl group-hover:bg-brand-primary/5 transition-colors" />
  </div>
);

const Marker = ({ pos, color, label }: any) => (
  <div 
    className="absolute group z-20"
    style={{ top: pos.t, left: pos.l }}
  >
     <div className={cn(
       "w-6 h-6 rounded-full border-4 border-white shadow-xl animate-bounce relative z-10",
       color === 'rose' ? "bg-rose-500" : color === 'emerald' ? "bg-emerald-500" : "bg-amber-500"
     )} />
     <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-12 h-12 bg-white/20 rounded-full animate-ping" />
     
     <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-4 whitespace-nowrap bg-white px-4 py-2 rounded-xl shadow-2xl border border-slate-100 opacity-0 group-hover:opacity-100 transition-all scale-90 group-hover:scale-100">
        <span className="text-[10px] font-black text-slate-900 uppercase italic tracking-tight">{label}</span>
     </div>
  </div>
);

const AlertFeedItem = ({ type, title, desc, time }: any) => (
  <div className="flex gap-5 group cursor-pointer border-b border-slate-50 pb-4 last:border-0 last:pb-0">
     <div className={cn(
       "w-12 h-12 rounded-2xl shrink-0 flex items-center justify-center transition-all group-hover:scale-110",
       type === 'salud' ? "bg-rose-50 text-rose-500 border border-rose-100" : 
       type === 'legal' ? "bg-amber-50 text-amber-600 border border-amber-100" : 
       "bg-brand-primary/5 text-brand-primary border border-brand-primary/10"
     )}>
        {type === 'salud' ? <Heart size={20} /> : type === 'legal' ? <Globe size={20} /> : <HardHat size={20} />}
     </div>
     <div className="flex-1 space-y-1">
        <div className="flex justify-between items-center">
           <p className="text-xs font-black text-slate-900 italic tracking-tight">{title}</p>
           <span className="text-[9px] font-bold text-slate-400 flex items-center gap-1"><Clock size={10} /> {time}</span>
        </div>
        <p className="text-[10px] text-slate-500 font-medium leading-relaxed italic">{desc}</p>
        <div className="flex gap-2 pt-2">
           <button className="text-[9px] font-black text-brand-primary uppercase tracking-widest hover:underline">Ver Detalle</button>
           <button className="text-[9px] font-black text-emerald-600 uppercase tracking-widest hover:underline">Atender</button>
        </div>
     </div>
  </div>
);

const CriticalBar = ({ label, value, count, color }: any) => (
  <div className="space-y-3 group">
     <div className="flex justify-between items-center">
        <span className="text-[10px] font-black text-slate-600 uppercase italic tracking-tight">{label}</span>
        <div className="flex items-center gap-3">
           <span className="text-[10px] font-black text-slate-900">{count} Reportes</span>
           <span className={cn("text-[10px] font-black text-white px-2 py-0.5 rounded-md", color)}>{value}%</span>
        </div>
     </div>
     <div className="h-2 w-full bg-slate-50 rounded-full overflow-hidden border border-slate-100">
        <motion.div 
          initial={{ width: 0 }}
          animate={{ width: `${value}%` }}
          transition={{ duration: 1, ease: 'easeOut' }}
          className={cn("h-full rounded-full transition-all group-hover:opacity-80", color)}
        />
     </div>
  </div>
);

const MetricRing = ({ label, value, desc, color, sub, progress }: any) => (
  <div className="flex flex-col items-center text-center space-y-5">
     <div className="relative w-28 h-28 flex items-center justify-center">
        <svg className="w-full h-full -rotate-90">
           <circle
             cx="56"
             cy="56"
             r="48"
             stroke="currentColor"
             strokeWidth="8"
             fill="transparent"
             className="text-slate-50"
           />
           <motion.circle
             cx="56"
             cy="56"
             r="48"
             stroke="currentColor"
             strokeWidth="8"
             fill="transparent"
             strokeDasharray={2 * Math.PI * 48}
             initial={{ strokeDashoffset: 2 * Math.PI * 48 }}
             animate={{ strokeDashoffset: 2 * Math.PI * 48 * (1 - parseInt(value) / 100) }}
             transition={{ duration: 1.5, ease: 'easeOut' }}
             className={cn(color)}
           />
        </svg>
        <span className="absolute text-2xl font-black text-slate-900 tracking-tighter italic">{value}</span>
     </div>
     <div className="space-y-1">
        <h4 className="text-[11px] font-black text-slate-900 uppercase italic tracking-tighter leading-none">{label}</h4>
        <p className="text-[9px] text-slate-400 font-bold uppercase tracking-widest">{desc}</p>
        <p className="text-[9px] font-black text-brand-primary opacity-60 pt-2 border-t border-slate-50">{sub}</p>
     </div>
  </div>
);
