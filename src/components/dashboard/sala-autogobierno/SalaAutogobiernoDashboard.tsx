import React, { useState } from 'react';
import { 
  LayoutDashboard, 
  Map as MapIcon, 
  Users, 
  FileText, 
  ClipboardCheck, 
  MessageSquare, 
  Settings, 
  LogOut, 
  ChevronRight, 
  ChevronLeft,
  TrendingUp,
  AlertCircle,
  Clock,
  CheckCircle2,
  Package,
  Globe,
  Plus,
  ArrowUpRight,
  Filter,
  Search,
  Zap,
  Droplets,
  Shield,
  Briefcase,
  Heart,
  BookOpen,
  Wifi,
  MoreVertical,
  Activity,
  History,
  CloudUpload,
  Camera,
  Menu,
  ChevronDown
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '../../../lib/utils';
import { SalaAutogobiernoData } from '../../../types';
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
  Area
} from 'recharts';

interface NavItem {
  id: string;
  label: string;
  icon: React.ElementType;
  children?: { id: string; label: string }[];
}

const NAV_ITEMS: NavItem[] = [
  { id: 'dashboard', label: 'Panel de Control', icon: LayoutDashboard },
  { 
    id: 'sistematizacion', 
    label: 'Gestión de las 7T', 
    icon: ClipboardCheck,
    children: [
      { id: 't1', label: 'T1 - Económica' },
      { id: 't2', label: 'T2 - Servicios' },
      { id: 't3', label: 'T3 - Seguridad' },
      { id: 't4', label: 'T4 - Social' },
      { id: 't5', label: 'T5 - Política' },
      { id: 't6', label: 'T6 - Ecología' },
      { id: 't7', label: 'T7 - Geopolítica' },
    ]
  },
  { 
    id: 'organizaciones', 
    label: 'Red de Organizaciones', 
    icon: Users,
    children: [
      { id: 'comunas', label: 'Comunas del Eje' },
      { id: 'consejos', label: 'Consejos Comunales' },
    ]
  },
  { 
    id: 'planificacion', 
    label: 'Planificación Estratégica', 
    icon: MapIcon,
    children: [
      { id: 'aca', label: 'ACA Territorial' },
      { id: 'suenos', label: 'Mapa de los Sueños' },
    ]
  },
  { 
    id: 'seguimiento', 
    label: 'Seguimiento de Gestión', 
    icon: TrendingUp,
    children: [
      { id: 'proyectos', label: 'Proyectos en Ejecución' },
      { id: 'evidencias', label: 'Banco de Evidencias' },
    ]
  },
  { id: 'comunicaciones', label: 'Comunicaciones', icon: MessageSquare },
  { id: 'soporte', label: 'Soporte Técnico', icon: Settings },
];

const SILENCE_DATA = [
  { name: 'Brindisi', days: 12 },
  { name: 'Eje 1A', days: 25 },
  { name: 'Casco', days: 5 },
  { name: 'Colinas', days: 30 },
  { name: 'Brisas', days: 8 },
];

const T7_INDICATORS = [
  { id: 't1', name: 'Económica', icon: Briefcase, color: 'text-blue-600', bg: 'bg-blue-50', count: 42, label: 'Emprendimientos' },
  { id: 't2', name: 'Servicios', icon: Droplets, color: 'text-cyan-600', bg: 'bg-cyan-50', count: 85, label: '% Reportes' },
  { id: 't3', name: 'Seguridad', icon: Shield, color: 'text-red-600', bg: 'bg-red-50', count: 12, label: 'Cuadrantes' },
  { id: 't4', name: 'Social', icon: Heart, color: 'text-pink-600', bg: 'bg-pink-50', count: 156, label: 'Atenciones' },
  { id: 't5', name: 'Política', icon: Users, color: 'text-indigo-600', bg: 'bg-indigo-50', count: 98, label: 'Voceros Act.' },
  { id: 't6', name: 'Ecología', icon: Globe, color: 'text-green-600', bg: 'bg-green-50', count: 5, label: 'Brigadas' },
  { id: 't7', name: 'Geopolítica', icon: BookOpen, color: 'text-purple-600', bg: 'bg-purple-50', count: 3, label: 'Acuerdos' },
];

export const SalaAutogobiernoDashboard: React.FC<{ user: SalaAutogobiernoData; onLogout: () => void }> = ({ user, onLogout }) => {
  const [collapsed, setCollapsed] = useState(false);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [expandedItems, setExpandedItems] = useState<string[]>(['sistematizacion']);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const toggleExpand = (id: string) => {
    setExpandedItems(prev => 
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
  };

  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard':
        return <DashboardView user={user} />;
      default:
        return (
          <div className="flex items-center justify-center h-[calc(100vh-120px)]">
            <div className="text-center">
              <div className="bg-gray-100 p-6 rounded-full w-20 h-20 flex items-center justify-center mx-auto mb-4">
                <Settings className="w-10 h-10 text-gray-400 animate-spin-slow" />
              </div>
              <h3 className="text-xl font-medium text-gray-900">Módulo en Desarrollo</h3>
              <p className="text-gray-500 max-w-sm mx-auto mt-2 italic shadow-xs">
                Estamos digitalizando este nudo crítico administrativo.
              </p>
            </div>
          </div>
        );
    }
  };

  return (
    <div className="flex h-screen bg-[#F8FAFC]">
      {/* Mobile Header */}
      <div className="lg:hidden fixed top-0 left-0 right-0 h-16 bg-white border-b border-gray-200 z-50 flex items-center justify-between px-4">
        <div className="flex items-center gap-3">
          <Menu 
            className="w-6 h-6 text-gray-600" 
            onClick={() => setIsMobileMenuOpen(true)}
          />
          <span className="font-bold text-gray-900 tracking-tight">SALA DIGITAL</span>
        </div>
        <div className="w-10 h-10 rounded-full bg-brand-primary/10 flex items-center justify-center overflow-hidden">
          <Users className="w-6 h-6 text-brand-primary" />
        </div>
      </div>

      {/* Sidebar Overlay */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <>
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsMobileMenuOpen(false)}
              className="fixed inset-0 bg-black/50 z-50 lg:hidden"
            />
            <motion.div 
              initial={{ x: -280 }}
              animate={{ x: 0 }}
              exit={{ x: -280 }}
              className="fixed top-0 left-0 bottom-0 w-[280px] bg-white z-50 lg:hidden flex flex-col"
            >
              <SidebarContent 
                user={user} 
                collapsed={false} 
                activeTab={activeTab} 
                setActiveTab={(id) => {
                  setActiveTab(id);
                  setIsMobileMenuOpen(false);
                }}
                expandedItems={expandedItems}
                toggleExpand={toggleExpand}
                onLogout={onLogout}
              />
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Desktop Sidebar */}
      <div className={cn(
        "hidden lg:flex flex-col bg-white border-r border-[#E2E8F0] transition-all duration-300 relative",
        collapsed ? "w-[80px]" : "w-[320px]"
      )}>
        <SidebarContent 
          user={user} 
          collapsed={collapsed} 
          activeTab={activeTab} 
          setActiveTab={setActiveTab}
          expandedItems={expandedItems}
          toggleExpand={toggleExpand}
          onLogout={onLogout}
        />
        
        <button 
          onClick={() => setCollapsed(!collapsed)}
          className="absolute -right-3 top-1/2 -translate-y-1/2 w-6 h-12 bg-white border border-[#E2E8F0] rounded-lg flex items-center justify-center hover:bg-gray-50 transition-colors z-20 shadow-sm"
        >
          {collapsed ? <ChevronRight size={14} /> : <ChevronLeft size={14} />}
        </button>
      </div>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto pt-16 lg:pt-0">
        <header className="hidden lg:flex h-16 bg-white border-b border-[#E2E8F0] items-center justify-between px-8 sticky top-0 z-10">
          <div>
            <h1 className="text-lg font-semibold text-gray-900 capitalize">
              {activeTab.replace('-', ' ')}
            </h1>
            <p className="text-xs text-gray-500">Gestión Territorial de Autogobierno</p>
          </div>
          <div className="flex items-center gap-4">
             <button className="flex items-center gap-2 px-4 py-2 bg-brand-primary text-white rounded-lg hover:bg-brand-primary/90 transition-all font-medium text-sm shadow-sm">
                <ClipboardCheck size={18} />
                Sistematización Semanal
             </button>
             <div className="h-8 w-px bg-gray-200" />
             <div className="text-right flex flex-col items-end">
                <span className="text-sm font-medium text-gray-900">{user.firstName} {user.lastName}</span>
                <span className="text-[10px] text-brand-primary uppercase font-bold tracking-widest">{user.vinculoAdministrativo}</span>
             </div>
          </div>
        </header>

        <div className="p-4 lg:p-8">
          {renderContent()}
        </div>
      </main>
    </div>
  );
};

const SidebarContent = ({ 
  user, 
  collapsed, 
  activeTab, 
  setActiveTab, 
  expandedItems, 
  toggleExpand,
  onLogout 
}: any) => (
  <>
    <div className="p-6">
      <div className="flex items-center gap-3 mb-8">
        <div className="w-10 h-10 rounded-xl bg-brand-primary flex items-center justify-center shrink-0">
          <MapIcon className="text-white w-6 h-6" />
        </div>
        {!collapsed && (
          <div>
            <h1 className="font-bold text-gray-900 tracking-tight text-lg">SALA DIGITAL</h1>
            <p className="text-[10px] text-brand-primary font-bold tracking-tighter uppercase leading-none">Municipios Carrizal</p>
          </div>
        )}
      </div>

      <nav className="space-y-1">
        {NAV_ITEMS.map((item) => (
          <div key={item.id}>
            <button
              onClick={() => {
                if (item.children) toggleExpand(item.id);
                else setActiveTab(item.id);
              }}
              className={cn(
                "w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all relative group",
                activeTab === item.id 
                  ? "bg-brand-primary text-white shadow-md shadow-brand-primary/20" 
                  : "text-gray-500 hover:bg-gray-100"
              )}
            >
              <item.icon size={20} className={cn(
                "shrink-0",
                activeTab === item.id ? "text-white" : "group-hover:text-brand-primary transition-colors"
              )} />
              {!collapsed && (
                <span className="font-medium text-sm flex-1 text-left">{item.label}</span>
              )}
              {!collapsed && item.children && (
                <ChevronDown size={14} className={cn(
                  "transition-transform",
                  expandedItems.includes(item.id) ? "rotate-180" : ""
                )} />
              )}
            </button>
            
            {!collapsed && item.children && expandedItems.includes(item.id) && (
              <div className="mt-1 ml-9 space-y-1">
                {item.children.map(child => (
                  <button
                    key={child.id}
                    onClick={() => setActiveTab(child.id)}
                    className={cn(
                      "w-full text-left px-3 py-1.5 text-xs rounded-lg transition-colors",
                      activeTab === child.id ? "text-brand-primary font-bold bg-brand-primary/5" : "text-gray-500 hover:text-brand-primary hover:bg-gray-50"
                    )}
                  >
                    {child.label}
                  </button>
                ))}
              </div>
            )}
          </div>
        ))}
      </nav>
    </div>

    <div className="mt-auto p-6 space-y-4">
      {/* Territorial Context */}
      {!collapsed && (
        <div className="p-4 bg-gray-50 rounded-2xl border border-gray-100">
           <div className="flex items-center gap-2 mb-2">
              <Globe size={14} className="text-brand-primary" />
              <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Territorio</span>
           </div>
           <p className="text-xs font-semibold text-gray-900 truncate">{user.nombreSala}</p>
           <p className="text-[10px] text-gray-500 mt-1">Estatus: <span className="text-green-600 font-bold uppercase">{user.estatus}</span></p>
        </div>
      )}

      <button
        onClick={onLogout}
        className={cn(
          "w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-gray-500 hover:bg-red-50 hover:text-red-600 transition-all",
          collapsed && "justify-center"
        )}
      >
        <LogOut size={20} />
        {!collapsed && <span className="font-medium text-sm">Cerrar Sesión</span>}
      </button>

      {!collapsed && (
        <div className="pt-4 border-t border-gray-100 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse" />
            <span className="text-[10px] font-medium text-gray-400 uppercase tracking-wider">Sync: Hace 4m</span>
          </div>
        </div>
      )}
    </div>
  </>
);

const DashboardView = ({ user }: { user: SalaAutogobiernoData }) => {
  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-700 space-y-6">
      {/* Analytical Metrics Header */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm overflow-hidden relative group">
          <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:scale-110 transition-transform">
            <Users size={80} className="text-brand-primary" />
          </div>
          <div className="flex flex-col">
            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1 leading-none">Alcance Poblacional</span>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-bold text-gray-900">4,285</span>
              <span className="text-xs text-green-600 font-medium">+2.1%</span>
            </div>
            <p className="text-xs text-gray-500 mt-2 italic shadow-xs">Total Familias y Habitantes del Eje</p>
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm overflow-hidden relative group">
          <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:scale-110 transition-transform">
            <Activity size={80} className="text-brand-primary" />
          </div>
          <div className="flex flex-col">
            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1 leading-none">Nivel de Organización</span>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-bold text-gray-900">78%</span>
              <span className="text-xs text-brand-primary font-medium">8/12 CC</span>
            </div>
            <p className="text-xs text-gray-500 mt-2 italic shadow-xs">Vocerías Vigentes vs Vencidas</p>
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm overflow-hidden relative group">
          <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:scale-110 transition-transform">
            <ClipboardCheck size={80} className="text-brand-primary" />
          </div>
          <div className="flex flex-col">
            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1 leading-none">Índice de Sistematización</span>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-bold text-gray-900">62%</span>
              <span className="text-xs text-orange-500 font-medium">En proceso</span>
            </div>
            <p className="text-xs text-gray-500 mt-2 italic shadow-xs">Avance de carga 7T este mes</p>
          </div>
        </div>
      </div>

      {/* Main Analytical Section: Map & Indicators */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Mock Territorial Map */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden flex flex-col">
          <div className="p-4 border-b border-gray-50 flex items-center justify-between">
            <h3 className="text-sm font-bold text-gray-900 uppercase tracking-tight flex items-center gap-2">
               <MapIcon className="w-4 h-4 text-brand-primary" />
               Mapa Territorial (Eje Central)
            </h3>
            <div className="flex gap-2">
              <button className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors"><Search size={16} className="text-gray-500" /></button>
              <button className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors"><Filter size={16} className="text-gray-500" /></button>
            </div>
          </div>
          <div className="flex-1 bg-blue-50 relative overflow-hidden group">
            {/* Visual representation of a map with polygons and hot points */}
            <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10" />
            
            {/* Animated Hot Points */}
            <div className="absolute top-[40%] left-[30%]">
              <div className="relative">
                <div className="absolute -inset-4 bg-red-400/30 rounded-full animate-ping" />
                <div className="relative p-2 bg-white rounded-full shadow-lg border border-red-100">
                  <Zap className="w-4 h-4 text-red-600" />
                </div>
                <div className="absolute top-full left-1/2 -translate-x-1/2 mt-2 bg-white/90 backdrop-blur px-2 py-1 rounded-md shadow-sm border border-gray-100 pointer-events-none">
                  <span className="text-[10px] font-bold text-red-600 whitespace-nowrap">Nudo Crítico: Electricidad</span>
                </div>
              </div>
            </div>

            <div className="absolute top-[60%] left-[70%]">
              <div className="relative">
                <div className="absolute -inset-4 bg-orange-400/20 rounded-full animate-ping duration-1500" />
                <div className="relative p-2 bg-white rounded-full shadow-lg border border-orange-100">
                  <Droplets className="w-4 h-4 text-orange-600" />
                </div>
                <div className="absolute top-full left-1/2 -translate-x-1/2 mt-2 bg-white/90 backdrop-blur px-2 py-1 rounded-md shadow-sm border border-gray-100 pointer-events-none">
                  <span className="text-[10px] font-bold text-orange-600 whitespace-nowrap">Reporte: Agua</span>
                </div>
              </div>
            </div>

            <div className="absolute bottom-4 left-4 right-4 bg-white/80 backdrop-blur p-3 rounded-xl border border-white/50 flex flex-wrap gap-4 items-center justify-center">
               <div className="flex items-center gap-1.5"><div className="w-3 h-3 rounded-sm bg-red-500" /><span className="text-[10px] text-gray-600">Prioridad Alta</span></div>
               <div className="flex items-center gap-1.5"><div className="w-3 h-3 rounded-sm bg-orange-500" /><span className="text-[10px] text-gray-600">Prioridad Media</span></div>
               <div className="flex items-center gap-1.5"><div className="w-3 h-3 rounded-sm bg-blue-500" /><span className="text-[10px] text-gray-600">Comunas Vinc.</span></div>
            </div>
          </div>
        </div>

        {/* Tablero 7T Indicators */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 space-y-4">
           <h3 className="text-sm font-bold text-gray-900 uppercase tracking-tight flex items-center gap-2 mb-4">
               <Zap className="w-4 h-4 text-brand-primary" />
               Tablero de las 7T
            </h3>
            <div className="space-y-3">
              {T7_INDICATORS.map(item => (
                <div key={item.id} className="group cursor-pointer hover:bg-gray-50 transition-all p-2 -m-2 rounded-xl border border-transparent hover:border-gray-100">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className={cn("w-10 h-10 rounded-lg flex items-center justify-center", item.bg)}>
                        <item.icon className={cn("w-5 h-5", item.color)} />
                      </div>
                      <div>
                        <p className="text-xs font-bold text-gray-900">{item.name}</p>
                        <p className="text-[10px] text-gray-500">{item.label}</p>
                      </div>
                    </div>
                    <div className="text-right">
                       <span className="text-sm font-bold text-gray-900">{item.count}</span>
                       <ArrowUpRight className="inline-block w-3 h-3 text-brand-primary ml-1 opacity-0 group-hover:opacity-100 transition-opacity" />
                    </div>
                  </div>
                </div>
              ))}
            </div>
            <button className="w-full py-2.5 bg-gray-50 text-brand-primary text-xs font-bold rounded-xl hover:bg-brand-primary hover:text-white transition-all mt-4 border border-brand-primary/10">
              Ver Detalle Regional
            </button>
        </div>
      </div>

      {/* Monitor de Trámites & Zonas en Silencio */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white rounded-2xl border border-gray-100 shadow-sm p-6 overflow-hidden">
           <div className="flex items-center justify-between mb-6">
              <h3 className="text-sm font-bold text-gray-900 uppercase tracking-tight flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-brand-primary" />
                Monitor de Trámites y Proyectos
              </h3>
              <div className="text-[10px] text-brand-primary font-bold bg-brand-primary/5 px-2 py-1 rounded-md">8 Obras Activas</div>
           </div>
           
           <div className="space-y-6">
              <div className="group">
                <div className="flex justify-between items-center mb-2">
                  <div>
                    <p className="text-xs font-bold text-gray-900">Mejoras de Vialidad - Sector El Despertar</p>
                    <p className="text-[10px] text-gray-500">C.C. El Despertar / Finan: Alcaldía</p>
                  </div>
                  <span className="text-xs font-bold text-brand-primary">65%</span>
                </div>
                <div className="h-2 w-full bg-gray-100 rounded-full overflow-hidden">
                  <motion.div 
                    initial={{ width: 0 }}
                    animate={{ width: '65%' }}
                    className="h-full bg-brand-primary shadow-[0_0_8px_rgba(var(--brand-primary-rgb),0.4)]"
                  />
                </div>
              </div>

              <div className="group">
                <div className="flex justify-between items-center mb-2">
                  <div>
                    <p className="text-xs font-bold text-gray-900">Electrificación - La Colina</p>
                    <p className="text-[10px] text-gray-500">Comuna Brisas / Finan: CFG</p>
                  </div>
                  <span className="text-xs font-bold text-brand-primary">22%</span>
                </div>
                <div className="h-2 w-full bg-gray-100 rounded-full overflow-hidden">
                  <motion.div 
                    initial={{ width: 0 }}
                    animate={{ width: '22%' }}
                    className="h-full bg-orange-500"
                  />
                </div>
              </div>
           </div>

           <div className="mt-8 pt-6 border-t border-gray-50">
              <div className="flex items-center gap-2 mb-4 text-red-600 bg-red-50 p-3 rounded-xl border border-red-100">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span className="text-[10px] font-bold uppercase">Alertas de Nudos Críticos (Top 5)</span>
              </div>
              <div className="space-y-3">
                 {[
                   { label: 'Falla Transformador 15kVA', area: 'Electricidad', sector: 'Sector 3', time: 'hace 4h' },
                   { label: 'Brote Agua Servidas', area: 'Aguas', sector: 'Vereda 2', time: 'hace 1d' },
                 ].map((alert, i) => (
                   <div key={i} className="flex items-center justify-between p-3 bg-white border border-gray-100 rounded-xl hover:border-brand-primary/30 transition-all cursor-pointer shadow-sm group">
                      <div className="flex items-center gap-3">
                        <div className="w-2 h-2 rounded-full bg-red-500 group-hover:scale-125 transition-transform" />
                        <div>
                          <p className="text-xs font-bold text-gray-900">{alert.label}</p>
                          <p className="text-[10px] text-gray-500">{alert.sector} — {alert.area}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-medium text-gray-400">{alert.time}</span>
                        <ArrowUpRight size={14} className="text-brand-primary opacity-0 group-hover:opacity-100 transition-opacity" />
                      </div>
                   </div>
                 ))}
              </div>
           </div>
        </div>

        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 overflow-hidden flex flex-col">
           <h3 className="text-sm font-bold text-gray-900 uppercase tracking-tight flex items-center gap-2 mb-6">
              <Wifi className="w-4 h-4 text-brand-primary" />
              Zonas en Silencio
           </h3>
           <div className="flex-1 min-h-[250px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={SILENCE_DATA} layout="vertical" margin={{ left: -20 }}>
                  <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#E2E8F0" />
                  <XAxis type="number" hide />
                  <YAxis 
                    dataKey="name" 
                    type="category" 
                    width={80} 
                    axisLine={false} 
                    tickLine={false}
                    tick={{ fontSize: 10, fontWeight: 500, fill: '#64748B' }}
                  />
                  <RechartsTooltip 
                    contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                    cursor={{ fill: '#F1F5F9' }}
                  />
                  <Bar dataKey="days" radius={[0, 4, 4, 0]} barSize={20}>
                    {SILENCE_DATA.map((entry, index) => (
                      <Cell key={index} fill={entry.days > 20 ? '#EF4444' : '#042D5F'} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
           </div>
           <p className="text-[10px] text-gray-500 mt-4 italic text-center">Días transcurridos desde el último reporte</p>
           
           <div className="mt-6 p-4 bg-gray-50 rounded-2xl border border-gray-100">
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-3">Validación de Base</p>
              <div className="space-y-3">
                 <div className="flex items-center justify-between">
                    <span className="text-xs text-gray-700">Reportes Pendientes</span>
                    <span className="text-xs font-bold text-brand-primary">12</span>
                 </div>
                 <button className="w-full py-2 bg-white text-brand-primary text-[10px] font-bold rounded-lg border border-brand-primary/10 hover:bg-brand-primary hover:text-white transition-all shadow-sm uppercase tracking-wider">
                    Ir a Validar Datos
                 </button>
              </div>
           </div>
        </div>
      </div>
    </div>
  );
};
