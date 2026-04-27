import React, { useState, useEffect } from 'react';
import { 
  LayoutDashboard, 
  Map as MapIcon, 
  ClipboardCheck, 
  Users, 
  TrendingUp, 
  FileCheck, 
  Building2, 
  PieChart as PieIcon, 
  BarChart3, 
  AlertCircle, 
  Clock, 
  Search, 
  Filter, 
  ShieldAlert, 
  MoreVertical, 
  ChevronRight, 
  ChevronLeft, 
  LogOut, 
  Zap, 
  MessageSquare, 
  History, 
  PhoneForwarded, 
  ArrowUpRight,
  Menu,
  ChevronDown,
  Activity,
  Globe,
  Settings,
  Briefcase,
  Heart,
  Droplets,
  HardHat,
  Monitor
} from 'lucide-react';
import { Sidebar } from '@/app/layout/Sidebar';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/app/lib/utils';
import { UserBase } from '@/types';
import { useAuth } from '@/context/AuthContext';
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
  AreaChart,
  Area,
  LineChart,
  Line
} from 'recharts';

interface NavItem {
  id: string;
  label: string;
  icon: React.ElementType;
  children?: { id: string; label: string }[];
}

const SEC_NAV_ITEMS: NavItem[] = [
  { id: 'dashboard', label: 'Panel de Control', icon: LayoutDashboard },
  { 
    id: 'gestion_territorial', 
    label: 'Gestión Territorial', 
    icon: Globe,
    children: [
      { id: 'salas', label: 'Salas de Autogobierno' },
      { id: 'comunas', label: 'Comunas y Circuitos' },
      { id: 'consejos', label: 'Consejos Comunales' },
    ]
  },
  { id: 'seguimiento_7t', label: 'Seguimiento de las 7T', icon: TargetIcon },
  { 
    id: 'supervision', 
    label: 'Supervisión Direcciones', 
    icon: ShieldAlert,
    children: [
      { id: 'dir_comunas', label: 'Dirección Comunas' },
      { id: 'dir_adulto', label: 'Dirección Adulto Mayor' },
      { id: 'dir_planificacion', label: 'Dirección Planificación' },
      { id: 'dir_digitalizacion', label: 'Dirección Digitalización' },
    ]
  },
  { 
    id: 'proyectos_recursos', 
    label: 'Proyectos y Recursos', 
    icon: FileCheck,
    children: [
      { id: 'bandeja_proyectos', label: 'Bandeja de Proyectos' },
      { id: 'ejecucion', label: 'Control de Ejecución' },
    ]
  },
  { id: 'reportes', label: 'Reportes y Estadísticas', icon: BarChart3 },
  { id: 'historico', label: 'Histórico de Gestión', icon: History },
];

function TargetIcon({ className, size }: any) {
  return (
    <svg 
      className={className} 
      width={size} 
      height={size} 
      viewBox="0 0 24 24" 
      fill="none" 
      stroke="currentColor" 
      strokeWidth="2" 
      strokeLinecap="round" 
      strokeLinejoin="round"
    >
      <circle cx="12" cy="12" r="10" />
      <circle cx="12" cy="12" r="6" />
      <circle cx="12" cy="12" r="2" />
    </svg>
  );
}

const DATA_7T = [
  { name: 'T1 Económica', count: 12 },
  { name: 'T2 Servicios', count: 45 },
  { name: 'T3 Seguridad', count: 8 },
  { name: 'T4 Social', count: 32 },
  { name: 'T5 Política', count: 15 },
  { name: 'T6 Ecología', count: 5 },
  { name: 'T7 Geopolítica', count: 3 },
];

const DIR_EFFICIENCY = [
  { name: 'Comunas', time: 2.5 },
  { name: 'Adulto Mayor', time: 1.8 },
  { name: 'Planif.', time: 3.2 },
  { name: 'Digital.', time: 0.5 },
];

const POPULATION_GROWTH = [
  { month: 'Ene', value: 12000 },
  { month: 'Feb', value: 12500 },
  { month: 'Mar', value: 13200 },
  { month: 'Abr', value: 14500 },
  { month: 'May', value: 15800 },
];

export const SecretarioDashboard = ({ user, onLogout }: { user: any; onLogout: () => void }) => {
  const { logout } = useAuth();
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [selectedEje, setSelectedEje] = useState('Todos los Ejes');

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

  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard':
        return <DashboardView user={user} selectedEje={selectedEje} />;
      default:
        return (
          <div className="flex items-center justify-center h-[calc(100vh-160px)]">
            <div className="text-center">
              <div className="bg-brand-primary/5 p-8 rounded-full inline-flex mb-4">
                <Monitor className="w-12 h-12 text-brand-primary/40 animate-pulse" />
              </div>
              <h2 className="text-xl font-bold text-gray-900">Módulo de {activeTab.replace('_', ' ').toUpperCase()}</h2>
              <p className="text-gray-500 mt-2 max-w-xs mx-auto italic font-medium">
                Digitalizando el poder popular para la toma de decisiones estratégicas.
              </p>
            </div>
          </div>
        );
    }
  };

  return (
    <div className="flex h-screen bg-[#fcfdfe] font-sans">
      <Sidebar 
        user={user}
        activeSection={activeTab}
        setActiveSection={setActiveTab}
        isSidebarOpen={isSidebarOpen}
        setIsSidebarOpen={setIsSidebarOpen}
        isMobileMenuOpen={isMobileMenuOpen}
        setIsMobileMenuOpen={setIsMobileMenuOpen}
        onLogout={onLogout}
      />

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col pt-16 lg:pt-0 overflow-hidden">
        <DashboardNavbar 
          user={user}
          title="Secretario del Poder Popular"
          subtitle="ESTRATEGIA & TOMA DE DECISIONES"
          onMobileMenuOpen={() => setIsMobileMenuOpen(true)}
          roleIcon={<Building2 size={24} />}
          actions={
            <>
              <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5 transition-all hover:border-brand-primary/30">
                <Filter size={14} className="text-slate-400" />
                <select 
                  value={selectedEje}
                  onChange={(e) => setSelectedEje(e.target.value)}
                  className="bg-transparent text-[10px] font-bold text-slate-600 uppercase tracking-widest outline-none cursor-pointer"
                >
                  <option>Todos los Ejes</option>
                  <option>Eje 1: Casco Central</option>
                  <option>Eje 2: Brisas-Colinas</option>
                  <option>Eje 3: Montaña Alta</option>
                </select>
              </div>
              <div className="hidden md:flex items-center gap-2 bg-rose-50 text-rose-600 px-3 py-1.5 rounded-xl border border-rose-100 shadow-sm animate-in fade-in slide-in-from-right-4">
                 <ShieldAlert size={16} className="animate-pulse" />
                 <span className="text-[10px] font-black uppercase tracking-widest leading-none">Corte: 2 Alertas Rojas</span>
              </div>
            </>
          }
        />

        {/* Dynamic Content Container */}
        <div className="flex-1 overflow-y-auto overflow-x-hidden p-6 lg:p-10 custom-scrollbar">
           <AnimatePresence mode="wait">
             {renderContent()}
           </AnimatePresence>
        </div>
      </main>
    </div>
  );
};

const DashboardView = ({ user, selectedEje }: { user: UserBase, selectedEje: string }) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-8"
    >
      {/* Alertas Críticas (Top Layout) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-rose-600 p-6 rounded-3xl text-white shadow-xl shadow-rose-600/20 relative overflow-hidden group">
           <div className="relative z-10 flex items-center justify-between">
              <div>
                 <span className="text-[10px] font-black uppercase tracking-widest text-rose-200">Alertas Territoriales</span>
                 <h3 className="text-2xl font-black mt-1 leading-none tracking-tighter">5 Casos Críticos de Salud</h3>
                 <p className="text-xs text-rose-100 mt-2 font-medium opacity-80">Requieren intervención inmediata en los Ejes 1 y 3.</p>
              </div>
              <button className="bg-white/20 hover:bg-white/30 backdrop-blur-md p-4 rounded-2xl transition-all group-hover:scale-105 active:scale-95 shadow-inner">
                 <PhoneForwarded size={24} />
              </button>
           </div>
           <div className="absolute -bottom-10 -right-10 w-48 h-48 bg-white/10 rounded-full blur-3xl" />
        </div>

        <div className="bg-brand-primary p-6 rounded-3xl text-white shadow-xl shadow-brand-primary/20 relative overflow-hidden group">
           <div className="relative z-10 flex items-center justify-between">
              <div>
                 <span className="text-[10px] font-black uppercase tracking-widest text-cyan-300">Aprobaciones del Secretario</span>
                 <h3 className="text-2xl font-black mt-1 leading-none tracking-tighter">4 Proyectos Pendientes</h3>
                 <p className="text-xs text-cyan-50 mt-2 font-medium opacity-80">Validados por Direcciones. Esperan su visto bueno administrativo.</p>
              </div>
              <button className="bg-white/20 hover:bg-white/30 backdrop-blur-md p-4 rounded-2xl transition-all group-hover:scale-105 active:scale-95 shadow-inner">
                 <FileCheck size={24} />
              </button>
           </div>
           <div className="absolute -bottom-10 -right-10 w-48 h-48 bg-cyan-400/20 rounded-full blur-3xl" />
        </div>
      </div>

      {/* Global KPIs Section */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <KPICard 
          label="Índice de Organización" 
          value="82%" 
          sub="RIF y Vocerías al día" 
          icon={Users} 
          trend="+5%"
          color="bg-emerald-500" 
        />
        <KPICard 
          label="Población Impactada" 
          value="15,820" 
          sub="Carrizaleños atendidos" 
          icon={Activity} 
          trend="+12%"
          color="bg-brand-primary" 
        />
        <KPICard 
          label="Digitización" 
          value="74%" 
          sub="Procesos paper-less" 
          icon={Monitor} 
          trend="+3%"
          color="bg-indigo-500" 
        />
      </div>

      {/* Middle Section: Map & Indicators */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
        {/* Mapping Polygon Context */}
        <div className="xl:col-span-2 bg-white rounded-[2.5rem] border border-slate-100 shadow-sm overflow-hidden flex flex-col h-[500px]">
           <div className="p-6 border-b border-slate-50 flex items-center justify-between bg-slate-50/30">
              <div>
                 <h3 className="text-sm font-black text-slate-900 tracking-tight italic">Mapa de Acción Estratégica (Ejes de Carrizal)</h3>
                 <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-1">Intervención en Tiempo Real</p>
              </div>
              <div className="flex gap-2">
                 <button className="px-4 py-2 bg-brand-primary text-white text-[10px] font-black rounded-xl hover:bg-brand-secondary transition-all shadow-md shadow-brand-primary/20">Expandir Cartografía</button>
              </div>
           </div>
           <div className="flex-1 bg-slate-100 relative group cursor-crosshair">
              {/* Simplified Polygon Map representation */}
              <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-10" />
              
              {/* Hot points - Poligonos */}
              <div className="absolute top-[20%] left-[15%] w-32 h-32 bg-brand-primary/20 hover:bg-brand-primary/40 border-2 border-brand-primary/30 rounded-full flex items-center justify-center backdrop-blur-sm transition-all">
                  <span className="text-[10px] font-black text-brand-primary uppercase">Eje 1</span>
              </div>
              <div className="absolute top-[50%] left-[45%] w-40 h-40 bg-rose-500/10 hover:bg-rose-500/20 border-2 border-rose-500/20 rounded-full flex items-center justify-center transition-all">
                  <span className="text-[10px] font-black text-rose-500 uppercase">Zona en Silencio (Brisas)</span>
              </div>
              <div className="absolute bottom-[10%] right-[10%] w-48 h-32 bg-amber-500/10 hover:bg-amber-500/20 border-2 border-amber-500/20 rounded-[4rem] flex items-center justify-center transition-all">
                  <span className="text-[10px] font-black text-amber-600 uppercase">Eje 3 - Montaña Alta</span>
              </div>

              {/* Real-time Project markers */}
              <div className="absolute top-[30%] left-[30%] animate-bounce">
                 <div className="bg-white p-2 rounded-xl border border-slate-200 shadow-xl flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-emerald-500" />
                    <span className="text-[8px] font-bold text-slate-800 whitespace-nowrap">Obra: Calle Larga</span>
                 </div>
              </div>

              {/* Legend overlay */}
              <div className="absolute bottom-6 left-6 bg-white/90 backdrop-blur-md p-4 rounded-2xl border border-white/50 shadow-2xl space-y-2">
                 <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full bg-brand-primary" /><span className="text-[10px] font-bold text-slate-600 uppercase italic">Actividad Alta</span></div>
                 <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full bg-rose-500" /><span className="text-[10px] font-bold text-slate-600 uppercase italic">Zonas Silencio</span></div>
                 <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full bg-emerald-500" /><span className="text-[10px] font-bold text-slate-600 uppercase italic">Obras Activas</span></div>
              </div>
           </div>
        </div>

        {/* 7T Monitor Bar Chart */}
        <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-sm p-8 flex flex-col h-[500px]">
           <div className="mb-6">
              <h3 className="text-sm font-black text-slate-900 tracking-tight italic">Nudos Críticos por 7T</h3>
              <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-1">Problemática Consolidada</p>
           </div>
           <div className="flex-1">
             <ResponsiveContainer width="100%" height="100%">
               <BarChart data={DATA_7T} layout="vertical" margin={{ left: 20 }}>
                 <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#F1F5F9" />
                 <XAxis type="number" hide />
                 <YAxis 
                   dataKey="name" 
                   type="category" 
                   width={100} 
                   axisLine={false} 
                   tickLine={false} 
                   tick={{ fill: '#64748B', fontSize: 10, fontWeight: 700 }} 
                 />
                 <RechartsTooltip 
                   cursor={{ fill: '#F8FAFC' }}
                   contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 25px 50px -12px rgb(0 0 0 / 0.15)' }}
                 />
                 <Bar dataKey="count" radius={[0, 10, 10, 0]} barSize={24}>
                   {DATA_7T.map((entry, index) => (
                     <Cell key={`cell-${index}`} fill={entry.count > 30 ? '#EF4444' : '#042D5F'} />
                   ))}
                 </Bar>
               </BarChart>
             </ResponsiveContainer>
           </div>
           <div className="mt-6 pt-6 border-t border-slate-50 flex items-center justify-between">
              <div className="flex items-center gap-2">
                 <AlertCircle size={16} className="text-rose-500" />
                 <span className="text-[10px] font-black text-slate-900 uppercase tracking-widest leading-none">T2 (Servicios) Prioridad 1</span>
              </div>
              <ArrowUpRight size={16} className="text-brand-primary" />
           </div>
        </div>
      </div>

      {/* Pipeline & Efficiency */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Tramites Funnel */}
        <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-sm p-8 flex flex-col">
           <div className="mb-8">
              <h3 className="text-sm font-black text-slate-900 tracking-tight italic uppercase">Pipeline de Trámites</h3>
              <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-1">Embudo de Validación Legal</p>
           </div>
           <div className="space-y-6 relative">
              <div className="absolute left-4 top-2 bottom-2 w-0.5 bg-slate-100" />
              {[
                { label: 'Cargados por Base', count: 45, status: 'completed' },
                { label: 'En revisión Dirección', count: 18, status: 'current' },
                { label: 'Pendientes Secretario', count: 4, status: 'pending' },
                { label: 'Enviados a Alcaldesa', count: 12, status: 'total' },
              ].map((step, i) => (
                <div key={i} className="flex items-center gap-4 relative z-10 group cursor-pointer">
                   <div className={cn(
                     "w-8 h-8 rounded-xl flex items-center justify-center transition-all group-hover:scale-110",
                     step.status === 'completed' ? "bg-emerald-500 text-white" : 
                     step.status === 'current' ? "bg-brand-primary text-white animate-pulse" : 
                     "bg-white border border-slate-200 text-slate-400"
                   )}>
                      {step.status === 'completed' ? <FileCheck size={16} /> : i + 1}
                   </div>
                   <div className="flex-1">
                      <p className="text-xs font-black text-slate-900 leading-none">{step.label}</p>
                      <p className="text-[10px] text-slate-400 font-bold uppercase mt-1 leading-none">{step.count} trámites activos</p>
                   </div>
                   {step.status === 'pending' && <div className="w-2 h-2 rounded-full bg-rose-500 shadow-[0_0_8px_rgba(244,63,94,0.6)]" />}
                </div>
              ))}
           </div>
           <button className="mt-10 w-full py-4 bg-slate-50 text-brand-primary text-[10px] font-black uppercase tracking-[0.2em] rounded-2xl hover:bg-brand-primary hover:text-white transition-all border border-brand-primary/5">
              Gestionar Pipeline
           </button>
        </div>

        {/* Director Efficiency Chart */}
        <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-sm p-8 flex flex-col">
           <div className="mb-6 flex items-center justify-between">
              <div>
                <h3 className="text-sm font-black text-slate-900 tracking-tight italic uppercase">Monitor de Eficiencia</h3>
                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-1">Días Promedio de Respuesta</p>
              </div>
              <TrendingUp size={20} className="text-emerald-500" />
           </div>
           <div className="flex-1">
              <ResponsiveContainer width="100%" height="100%">
                 <LineChart data={DIR_EFFICIENCY}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F8FAFC" />
                    <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 9, fontWeight: 700, fill: '#94A3B8' }} />
                    <YAxis hide />
                    <RechartsTooltip />
                    <Line type="monotone" dataKey="time" stroke="#042D5F" strokeWidth={4} dot={{ r: 4, fill: '#042D5F', strokeWidth: 2, stroke: '#fff' }} activeDot={{ r: 6 }} />
                 </LineChart>
              </ResponsiveContainer>
           </div>
           <div className="mt-4 p-4 bg-slate-50 border border-slate-200 rounded-2xl flex flex-col gap-2">
              <div className="flex justify-between items-center bg-white p-2 rounded-xl shadow-sm">
                 <span className="text-[10px] font-bold text-slate-500 uppercase tracking-tight">Best Performance</span>
                 <span className="text-[10px] font-black text-brand-primary uppercase">Digitalización</span>
              </div>
              <div className="flex justify-between items-center bg-white p-2 rounded-xl shadow-sm">
                 <span className="text-[10px] font-bold text-slate-500 uppercase tracking-tight">Critical Delay</span>
                 <span className="text-[10px] font-black text-rose-500 uppercase">Planificación</span>
              </div>
           </div>
        </div>

        {/* Elevation Tool / Quick Actions */}
        <div className="bg-slate-900 p-8 rounded-[2.5rem] text-white flex flex-col shadow-2xl relative overflow-hidden group">
           <div className="relative z-10 flex flex-col h-full">
              <span className="text-[10px] font-black text-cyan-300 uppercase tracking-[0.3em] mb-2 leading-none">Canal de Emergencia</span>
              <h3 className="text-2xl font-black tracking-tighter leading-none mb-4 italic">Botón de Elevación</h3>
              <p className="text-xs text-slate-400 font-medium leading-relaxed mb-8 opacity-90">
                 Escalar casos territoriales o institucionales críticos directamente al despacho superior de la <span className="text-white font-bold">Dra. Morales</span>.
              </p>
              
              <div className="space-y-4 mt-auto">
                 <div className="flex items-center gap-3 p-3 bg-white/5 border border-white/10 rounded-2xl">
                    <AlertCircle size={20} className="text-rose-500" />
                    <div>
                       <p className="text-[10px] font-black uppercase text-white leading-none">Salud Eje 2</p>
                       <p className="text-[9px] text-slate-500 font-bold mt-1">Paciente requiere traslado ICU</p>
                    </div>
                 </div>
                 <button className="w-full py-4 bg-rose-600 text-white text-[11px] font-black uppercase tracking-widest rounded-2xl hover:bg-rose-700 transition-all shadow-xl shadow-rose-900/40 flex items-center justify-center gap-3 active:scale-95 group/btn">
                    Elevation <PhoneForwarded size={14} className="group-hover/btn:translate-x-1 group-hover/btn:-translate-y-1 transition-transform" />
                 </button>
              </div>
           </div>
           
           {/* Decorative bg elements */}
           <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
           <div className="absolute bottom-0 left-0 w-32 h-32 bg-rose-900/20 rounded-full blur-3xl translate-y-1/2 -translate-x-1/2" />
        </div>
      </div>
      
      {/* Instrumento de Caracterizacion aggregated section */}
      <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-sm p-10 mt-8">
          <div className="flex items-center justify-between mb-10 border-b border-slate-50 pb-6">
             <div>
                <h3 className="text-xl font-black text-slate-900 italic tracking-tighter uppercase leading-none">Instrumento de Caracterización Integral</h3>
                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-[0.2em] mt-2">Diagnóstico Municipal Consolidado 2026</p>
             </div>
             <div className="flex gap-3">
                <button className="flex items-center gap-2 px-5 py-3 bg-slate-900 text-white text-[10px] font-black uppercase tracking-widest rounded-2xl hover:bg-black transition-all shadow-lg active:scale-95">
                   Exportar Datos <ArrowUpRight size={14} />
                </button>
             </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
             <DiagMetric label="Liderazgo (L-7T)" value="4.2" sub="Calificación Promedio Vocerías" icon={Users} color="text-brand-primary" progress={84} />
             <DiagMetric label="Infraestructura" value="62%" sub="Salas en condiciones óptimas" icon={HardHat} color="text-orange-500" progress={62} />
             <DiagMetric label="Territorio" value="8.5" sub="Ejes con cartografía digital" icon={MapIcon} color="text-emerald-500" progress={85} />
             <DiagMetric label="Documentación" value="70%" sub="Legalidad y gestión actas" icon={ClipboardCheck} color="text-indigo-500" progress={70} />
          </div>
      </div>
    </motion.div>
  );
};

const KPICard = ({ label, value, sub, icon: Icon, trend, color }: any) => (
  <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm relative group overflow-hidden transition-all hover:shadow-md">
    <div className="flex items-center justify-between relative z-10">
       <div className={cn("p-4 rounded-2xl text-white shadow-xl shadow-slate-200", color)}>
          <Icon size={24} />
       </div>
       <div className="flex items-center gap-1 bg-slate-50 px-3 py-1 rounded-full border border-slate-100">
          <TrendingUp size={12} className={trend.startsWith('+') ? "text-emerald-500" : "text-rose-500"} />
          <span className={cn("text-[10px] font-black tracking-tight", trend.startsWith('+') ? "text-emerald-500" : "text-rose-500")}>{trend}</span>
       </div>
    </div>
    <div className="mt-8 relative z-10">
       <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] leading-none mb-2">{label}</h3>
       <div className="flex items-baseline gap-2">
          <p className="text-3xl font-black text-slate-900 tracking-tighter leading-none">{value}</p>
       </div>
       <p className="text-[10px] text-slate-500 font-bold mt-2 uppercase tracking-tight italic opacity-60 group-hover:opacity-100 transition-opacity">{sub}</p>
    </div>
  </div>
);

const DiagMetric = ({ label, value, sub, icon: Icon, color, progress }: any) => (
  <div className="space-y-4">
     <div className="flex items-center gap-3">
        <div className={cn("p-2 rounded-lg bg-slate-50", color)}>
           <Icon size={16} />
        </div>
        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{label}</span>
     </div>
     <div className="flex items-baseline gap-2">
        <span className="text-2xl font-black text-slate-900 leading-none">{value}</span>
        <span className="text-[9px] text-slate-400 font-bold italic tracking-tight">{sub}</span>
     </div>
     <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
        <motion.div 
           initial={{ width: 0 }}
           animate={{ width: `${progress}%` }}
           transition={{ duration: 1.5, ease: 'easeOut' }}
           className={cn("h-full rounded-full shadow-[0_0_8px_rgba(4,45,95,0.3)]", color.replace('text', 'bg'))}
        />
     </div>
  </div>
);
