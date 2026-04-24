import React, { useState, useEffect } from 'react';
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
  ChevronDown,
  MapPin,
  Send,
  X,
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '../../../lib/utils';
import { SalaAutogobiernoData } from '../../../types';
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
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [expandedItems, setExpandedItems] = useState<string[]>(['sistematizacion', 'organizaciones', 'planificacion']);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [modal, setModal] = useState<{ isOpen: boolean; type: 'form' | 'detail' | 'success'; title: string; data?: any }>({ isOpen: false, type: 'detail', title: '' });

  const openModal = (type: 'form' | 'detail' | 'success', title: string, data?: any) => {
    setModal({ isOpen: true, type, title, data });
  };

  const closeModal = () => setModal({ ...modal, isOpen: false });

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
      label: "Territorial",
      items: [
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
      ]
    },
    {
      label: "Red Social",
      items: [
        { 
          id: 'organizaciones', 
          label: 'Red de Organizaciones', 
          icon: Users,
          children: [
            { id: 'comunas', label: 'Comunas del Eje' },
            { id: 'consejos', label: 'Consejos Comunales' },
          ]
        },
      ]
    },
    {
      label: "Estratégico",
      items: [
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
      ]
    },
    {
      label: "Soporte",
      items: [
        { id: 'comunicaciones', label: 'Comunicaciones', icon: MessageSquare },
        { id: 'soporte', label: 'Soporte Técnico', icon: Settings },
      ]
    }
  ];

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
    <div className="flex h-screen bg-[#fcfdfe] font-sans">
      {/* Sidebar Overlay Mobile */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setIsMobileMenuOpen(false)}
            className="fixed inset-0 z-40 bg-slate-900/40 backdrop-blur-sm lg:hidden"
          />
        )}
      </AnimatePresence>

      {/* Sidebar */}
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
              <MapIcon className="text-white w-6 h-6" />
            </div>
            <div>
              <h1 className="font-black text-lg tracking-tighter leading-none text-slate-900 uppercase">SALA DIGITAL</h1>
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
                          layoutId="activeNavSala"
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
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{user.vinculoAdministrativo}</p>
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
            {isSidebarOpen && <span>Cerrar Sesión</span>}
          </button>
        </div>
      </motion.aside>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto overflow-x-hidden pt-16 lg:pt-0">
        <DashboardNavbar 
          user={user}
          title="Sala de Autogobierno"
          subtitle="GESTIÓN TERRITORIAL DE PROXIMIDAD"
          onMobileMenuOpen={() => setIsMobileMenuOpen(true)}
          roleIcon={<MapIcon size={24} />}
          actions={
            <button 
              onClick={() => openModal('form', 'Nueva Sistematización 7T', { area: activeTab })}
              className="flex items-center gap-2 px-4 py-2 bg-brand-primary text-white rounded-lg hover:bg-brand-primary/90 transition-all font-bold text-xs shadow-sm"
            >
                <ClipboardCheck size={16} />
                Sistematización
            </button>
          }
        />

        <div className="p-4 lg:p-8">
          {renderContent()}
        </div>
      </main>

      <DashboardModal 
        isOpen={modal.isOpen} 
        onClose={closeModal} 
        type={modal.type} 
        title={modal.title} 
        data={modal.data} 
      />
    </div>
  );
};

const DashboardModal = ({ isOpen, onClose, type, title, data }: { isOpen: boolean, onClose: () => void, type: 'form' | 'detail' | 'success', title: string, data?: any }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm"
      />
      
      <motion.div
        initial={{ scale: 0.95, opacity: 0, y: 20 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        className="bg-white rounded-[32px] w-full max-w-xl overflow-hidden shadow-2xl relative z-10 border border-slate-100"
      >
        <div className="p-8 border-b border-slate-50 flex items-center justify-between bg-slate-50/50">
          <div>
            <span className="text-[10px] font-black text-brand-primary uppercase tracking-[0.2em] mb-1 block leading-none">Módulo de Sala</span>
            <h3 className="text-xl font-black text-slate-800 uppercase italic leading-none">{title}</h3>
          </div>
          <button onClick={onClose} className="p-3 bg-white hover:bg-slate-100 rounded-2xl transition-colors text-slate-400">
            <X size={20} />
          </button>
        </div>

        <div className="p-8 max-h-[60vh] overflow-y-auto custom-scrollbar">
          {type === 'success' ? (
            <div className="text-center py-8">
              <div className="w-20 h-20 bg-emerald-50 text-emerald-500 rounded-full flex items-center justify-center mx-auto mb-6 shadow-sm border border-emerald-100">
                <CheckCircle2 size={40} />
              </div>
              <p className="text-slate-600 font-medium italic mb-2">{data?.message || 'Proceso completado exitosamente.'}</p>
              <p className="text-[10px] text-slate-400 uppercase font-black tracking-widest leading-none mt-4">Sincronizado con Central Regional</p>
            </div>
          ) : type === 'detail' ? (
            <div className="space-y-6">
               {data && Object.entries(data).map(([key, value]: [string, any]) => (
                <div key={key} className="p-4 bg-slate-50 rounded-2xl border border-slate-100 shadow-xs">
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none mb-2">{key}</p>
                  <p className="text-xs font-black text-slate-800 uppercase italic leading-tight">{String(value)}</p>
                </div>
               ))}
            </div>
          ) : (
            <form className="space-y-6" onSubmit={(e) => { e.preventDefault(); onClose(); }}>
               <div className="space-y-4">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block pl-2">Descripción del Avance</label>
                    <textarea 
                      className="w-full bg-slate-50 border border-slate-100 rounded-2xl p-4 text-xs font-medium focus:ring-2 focus:ring-brand-primary/20 outline-none min-h-[120px] transition-all italic" 
                      placeholder="Describa los logros alcanzados en este territorio..."
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                     <div className="space-y-2">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block pl-2">Fecha de Acción</label>
                        <input type="date" className="w-full bg-slate-50 border border-slate-100 rounded-xl p-3 text-xs font-medium focus:ring-2 focus:ring-brand-primary/20 outline-none transition-all" />
                     </div>
                     <div className="space-y-2">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block pl-2">Porcentaje de Impacto</label>
                        <select className="w-full bg-slate-50 border border-slate-100 rounded-xl p-3 text-xs font-medium focus:ring-2 focus:ring-brand-primary/20 outline-none transition-all italic font-bold">
                           <option>25% - Inicial</option>
                           <option>50% - Medio</option>
                           <option>75% - Avanzado</option>
                           <option>100% - Consolidado</option>
                        </select>
                     </div>
                  </div>
               </div>
               <button type="submit" className="w-full py-4 bg-brand-primary text-white rounded-2xl font-black uppercase italic tracking-wider shadow-lg flex items-center justify-center gap-2 hover:scale-[1.02] active:scale-[0.98] transition-all">
                  <Send size={18} /> Enviar a Sistematización Central
               </button>
            </form>
          )}
        </div>
      </motion.div>
    </div>
  );
};

const SistematizacionView = ({ area, openModal }: { area: string; openModal: any }) => {
  const tName = T7_INDICATORS.find(t => t.id === area)?.name || area;
  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 space-y-6">
      <div className="flex items-center justify-between mb-2">
         <div>
            <h2 className="text-xl font-bold text-slate-900 leading-tight uppercase tracking-tighter">Sistematización: {tName}</h2>
            <p className="text-xs text-slate-500 italic mt-1 leading-none shadow-xs">Carga de avances territoriales por área política</p>
         </div>
         <button 
          onClick={() => openModal('form', 'Registrar Avance: ' + tName, { area: tName })}
          className="flex items-center gap-2 px-4 py-2 bg-brand-primary text-white rounded-xl font-bold text-[10px] uppercase shadow-sm"
        >
            <Plus size={14} /> Registrar Avance
         </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Total Reportes', value: '45', color: 'text-brand-primary' },
          { label: 'Territorios Cubiertos', value: '8/12', color: 'text-indigo-600' },
          { label: 'Tiempo Prom. Carga', value: '2.4d', color: 'text-emerald-600' },
          { label: 'Estatus Global', value: '68%', color: 'text-amber-600' },
        ].map((m, i) => (
          <div 
            key={i} 
            onClick={() => openModal('detail', 'Métrica: ' + m.label, { Valor: m.value, Detalle: 'Información consolidada de la red territorial para el área seleccionada.' })}
            className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm overflow-hidden relative cursor-pointer hover:border-brand-primary transition-all group"
          >
             <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none mb-2">{m.label}</p>
             <p className={cn("text-2xl font-black", m.color)}>{m.value}</p>
          </div>
        ))}
      </div>

      <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden">
        <div className="p-6 border-b border-slate-50 flex items-center justify-between">
           <h3 className="text-xs font-black text-slate-900 uppercase tracking-widest flex items-center gap-2 leading-none">
              <ClipboardCheck size={16} className="text-brand-primary" />
              Sistematización por Comunidad
           </h3>
        </div>
        <div className="overflow-x-auto text-slate-900">
           <table className="w-full text-left">
              <thead>
                 <tr className="bg-slate-50/50">
                    <th className="px-8 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest italic">Comunidad</th>
                    <th className="px-8 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest italic text-center">Avance</th>
                    <th className="px-8 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest italic text-center">Última Carga</th>
                    <th className="px-8 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest italic text-right">Acción</th>
                 </tr>
              </thead>
              <tbody>
                 {[
                   { name: 'Brisas del Norte', progress: 85, date: '12/05/2024' },
                   { name: 'El Trigo Sector A', progress: 45, date: '18/05/2024' },
                   { name: 'Los Picapiedras', progress: 100, date: '10/05/2024' },
                   { name: 'Colinas de Carrizal', progress: 20, date: '22/05/2024' },
                 ].map((row, i) => (
                   <tr 
                     key={i} 
                     onClick={() => openModal('detail', 'Resumen Territorial: ' + row.name, row)}
                     className="border-b border-slate-50 last:border-0 hover:bg-slate-50/50 transition-colors cursor-pointer"
                   >
                      <td className="px-8 py-5">
                         <span className="text-xs font-black text-slate-800 uppercase italic tracking-tight">{row.name}</span>
                      </td>
                      <td className="px-8 py-5">
                         <div className="flex items-center gap-2 max-w-[120px] mx-auto">
                            <div className="flex-1 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                               <div className="h-full bg-brand-primary" style={{ width: `${row.progress}%` }} />
                            </div>
                            <span className="text-[10px] font-bold text-brand-primary">{row.progress}%</span>
                         </div>
                      </td>
                      <td className="px-8 py-5 text-center">
                         <span className="text-[10px] font-bold text-slate-600">{row.date}</span>
                      </td>
                      <td className="px-8 py-5 text-right">
                         <button className="text-[10px] font-black text-brand-primary uppercase italic hover:underline">Ver Detalle</button>
                      </td>
                   </tr>
                 ))}
              </tbody>
           </table>
        </div>
      </div>
    </div>
  );
};

const OrganizacionesView = ({ type, openModal }: { type: string; openModal: any }) => {
  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 space-y-6">
      <div className="flex items-center justify-between mb-2">
         <div>
            <h2 className="text-xl font-bold text-slate-900 leading-tight uppercase tracking-tighter">Directorio: {type === 'comunas' ? 'Comunas' : 'Consejos Comunales'}</h2>
            <p className="text-xs text-slate-500 italic mt-1 leading-none shadow-xs">Registro y estatus de organizaciones del eje</p>
         </div>
         <div className="flex gap-2">
            <div className="relative">
               <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
               <input 
                  type="text" 
                  placeholder="Buscar organización..." 
                  className="pl-9 pr-4 py-2 bg-white border border-slate-200 rounded-xl text-xs font-medium focus:ring-2 focus:ring-brand-primary/20 outline-none w-64"
               />
            </div>
            <button className="p-2 border border-slate-200 rounded-xl hover:bg-slate-50 transition-colors text-slate-500">
               <Filter size={18} />
            </button>
         </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <div 
             key={i} 
             onClick={() => openModal('detail', 'Expediente: ' + (type === 'comunas' ? 'Comuna ' : 'CC ') + (i === 1 ? 'Brisas del Norte' : i === 2 ? 'El Despertar' : `Organización Territorial ${i}`), { Estatus: i % 3 === 0 ? 'Vencido' : 'Vigente', Población: 200 + i * 50, Voceros: 12 + i })}
             className="bg-white rounded-3xl border border-slate-100 shadow-sm p-6 space-y-4 hover:border-brand-primary/30 transition-all group overflow-hidden relative cursor-pointer"
          >
             <div className="absolute top-0 right-0 p-4 opacity-[0.03] group-hover:scale-125 transition-transform">
                <Users size={80} className="text-brand-primary" />
             </div>
             <div className="flex justify-between items-start">
                <div className="w-12 h-12 bg-brand-primary/10 rounded-2xl flex items-center justify-center text-brand-primary">
                   <Users size={24} />
                </div>
                <span className={cn("text-[9px] font-black uppercase px-2 py-0.5 rounded italic", i % 3 === 0 ? 'bg-amber-50 text-amber-600' : 'bg-emerald-50 text-emerald-600')}>
                   {i % 3 === 0 ? 'Vencido' : 'Vigente'}
                </span>
             </div>
             <div>
                <h4 className="text-sm font-black text-slate-900 uppercase tracking-tight italic">{type === 'comunas' ? 'Comuna' : 'CC'} {i === 1 ? 'Brisas del Norte' : i === 2 ? 'El Despertar' : `Organización Territorial ${i}`}</h4>
                <p className="text-[10px] text-slate-500 font-medium">Ubicación: Sector {i}, Vereda {i+10}</p>
             </div>
             <div className="pt-4 border-t border-slate-50 grid grid-cols-2 gap-4">
                <div>
                   <p className="text-[8px] font-bold text-slate-400 uppercase tracking-widest leading-none mb-1">Población</p>
                   <p className="text-xs font-black text-slate-800 italic">{200 + i * 50} Hab.</p>
                </div>
                <div>
                   <p className="text-[8px] font-bold text-slate-400 uppercase tracking-widest leading-none mb-1">Voceros</p>
                   <p className="text-xs font-black text-slate-800 italic">{12 + i} Activos</p>
                </div>
             </div>
             <button className="w-full py-2 bg-slate-50 text-brand-primary text-[10px] font-black rounded-xl hover:bg-brand-primary hover:text-white transition-all uppercase italic">
                Ver Expediente Digital
             </button>
          </div>
        ))}
      </div>
    </div>
  );
};

const PlanificacionEstrategicaView = ({ type, openModal }: { type: string; openModal: any }) => {
  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 space-y-6">
       <div className="flex items-center justify-between mb-2">
         <div>
            <h2 className="text-xl font-bold text-slate-900 leading-tight uppercase tracking-tighter">{type === 'aca' ? 'ACA Territorial' : 'Mapa de los Sueños'}</h2>
            <p className="text-xs text-slate-500 italic mt-1 leading-none shadow-xs">Planificación de impacto regional y nudos de gran escala</p>
         </div>
         <button 
          onClick={() => openModal('form', 'Registrar Proyecto Hito', { area: 'Planificación' })}
          className="flex items-center gap-2 px-4 py-2 bg-brand-primary text-white rounded-xl font-bold text-[10px] uppercase shadow-sm"
        >
            <Plus size={14} /> Registrar Proyecto Hito
         </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-3xl border border-slate-100 shadow-sm p-8 space-y-6">
           <h3 className="text-sm font-black text-slate-900 uppercase tracking-widest flex items-center gap-2 leading-none">
              <Activity size={18} className="text-brand-primary" />
              Prioridades del ACA (Eje Territorial)
           </h3>
           <div className="space-y-4">
              {[
                { title: 'Subestación Eléctrica Carrizal', impact: 'Impacto en 4 Comunas', status: 'En Proyecto', percent: 15 },
                { title: 'Acueducto Matriz Panamericana', impact: 'Soberanía Hídrica Eje Central', status: 'En Ejecución', percent: 45 },
                { title: 'Complejo Deportivo Regional', impact: 'Juvenil / Recreativo', status: 'Aprobado', percent: 0 },
              ].map((item, i) => (
                <div 
                  key={i} 
                  onClick={() => openModal('detail', 'Hito Estratégico: ' + item.title, item)}
                  className="p-4 bg-slate-50 rounded-2xl border border-slate-100 hover:border-brand-primary/30 transition-all cursor-pointer group shadow-xs"
                >
                   <div className="flex justify-between mb-2">
                      <div>
                        <h4 className="text-xs font-black text-slate-800 uppercase italic">{item.title}</h4>
                        <p className="text-[10px] text-brand-primary font-bold">{item.impact}</p>
                      </div>
                      <span className="text-[10px] font-black text-brand-primary uppercase italic">{item.percent}%</span>
                   </div>
                   <div className="h-1.5 w-full bg-slate-200 rounded-full overflow-hidden">
                      <div className="h-full bg-brand-primary transition-all duration-1000" style={{ width: `${item.percent}%` }} />
                   </div>
                </div>
              ))}
           </div>
        </div>

        <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden flex flex-col">
           <div className="p-8 border-b border-slate-50">
              <h3 className="text-sm font-black text-slate-900 uppercase tracking-widest flex items-center gap-2 leading-none">
                <MapIcon size={18} className="text-brand-primary" />
                Mapa de Hitos (Visión 2030)
              </h3>
           </div>
           <div className="flex-1 min-h-[300px] bg-slate-900 relative">
              <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-30" />
              <div className="absolute top-[30%] left-[40%] group cursor-pointer">
                 <div className="w-4 h-4 bg-brand-primary rounded-full animate-ping absolute inset-0" />
                 <div className="w-4 h-4 bg-brand-primary rounded-full relative z-10 border-2 border-white shadow-lg" />
                 <div className="absolute top-full left-1/2 -translate-x-1/2 mt-2 bg-white/95 backdrop-blur px-2 py-1 rounded-lg shadow-xl border border-slate-100 opacity-0 group-hover:opacity-100 transition-all transform scale-90 group-hover:scale-100 pointer-events-none">
                    <p className="text-[10px] font-black text-slate-800 uppercase whitespace-nowrap italic">Hito: Zona Industrial</p>
                 </div>
              </div>
           </div>
        </div>
      </div>
    </div>
  );
};

const SeguimientoGestionView = ({ type, openModal }: { type: string; openModal: any }) => {
  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 space-y-6">
       <div className="flex items-center justify-between mb-2">
         <div>
            <h2 className="text-xl font-bold text-slate-900 leading-tight uppercase tracking-tighter">{type === 'proyectos' ? 'Proyectos en Ejecución' : 'Banco de Evidencias'}</h2>
            <p className="text-xs text-slate-500 italic mt-1 leading-none shadow-xs">Control de obras y seguimiento visual de compromisos</p>
         </div>
         <button 
          onClick={() => openModal('form', type === 'proyectos' ? 'Reportar Avance de Obra' : 'Subir Multimedia', {})}
          className="flex items-center gap-2 px-4 py-2 bg-brand-primary text-white rounded-xl font-bold text-[10px] uppercase shadow-sm"
        >
            <Camera size={14} /> {type === 'proyectos' ? 'Reportar Avance' : 'Subir Multimedia'}
         </button>
      </div>

      <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden">
        <div className="p-6 border-b border-slate-50 flex items-center justify-between">
           <h3 className="text-xs font-black text-slate-900 uppercase tracking-widest flex items-center gap-2 leading-none">
              <TrendingUp size={16} className="text-brand-primary" />
              Monitor de Ejecución Física / Financiera
           </h3>
        </div>
        <div className="p-6">
           <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
             {[
               { name: 'Canchas Sector 1', cc: 'C.C. Brisas', status: 'Financiamiento OK', physical: 75, budget: 100 },
               { name: 'Pozo de Agua', cc: 'C.C. El Trigo', status: 'En Desembolso', physical: 20, budget: 45 },
               { name: 'Iluminación LED', cc: 'Eje Panamericana', status: 'Completado', physical: 100, budget: 100 },
             ].map((p, i) => (
                <div 
                   key={i} 
                   onClick={() => openModal('detail', 'Proyecto: ' + p.name, p)}
                   className="p-6 rounded-2xl bg-slate-50 border border-slate-100 space-y-4 hover:border-brand-primary/30 transition-all cursor-pointer shadow-sm group"
                >
                   <div className="flex justify-between items-start">
                      <div>
                        <h4 className="text-sm font-black text-slate-900 uppercase italic">{p.name}</h4>
                        <p className="text-[10px] text-slate-500 font-bold">{p.cc} — {p.status}</p>
                      </div>
                      <div className="flex gap-2">
                         <div className="text-center">
                            <p className="text-[8px] font-black text-slate-400 uppercase leading-none mb-1 italic">Físico</p>
                            <p className="text-xs font-black text-brand-primary italic">{p.physical}%</p>
                         </div>
                         <div className="text-center">
                            <p className="text-[8px] font-black text-slate-400 uppercase leading-none mb-1 italic">Presup.</p>
                            <p className="text-xs font-black text-indigo-600 italic">{p.budget}%</p>
                         </div>
                      </div>
                   </div>
                   <div className="space-y-2">
                      <div className="h-1.5 w-full bg-slate-200 rounded-full overflow-hidden">
                        <div className="h-full bg-brand-primary" style={{ width: `${p.physical}%` }} />
                      </div>
                      <div className="h-1 w-full bg-slate-200 rounded-full overflow-hidden opacity-50">
                        <div className="h-full bg-indigo-600" style={{ width: `${p.budget}%` }} />
                      </div>
                   </div>
                   <div className="flex gap-2 justify-end pt-2">
                      <button className="p-1.5 bg-white border border-slate-200 rounded-lg text-slate-400 hover:text-brand-primary hover:border-brand-primary transition-all shadow-xs"><Camera size={14} /></button>
                      <button className="p-1.5 bg-white border border-slate-200 rounded-lg text-slate-400 hover:text-brand-primary hover:border-brand-primary transition-all shadow-xs"><ArrowUpRight size={14} /></button>
                   </div>
                </div>
             ))}
           </div>
        </div>
      </div>
    </div>
  );
};

const ComunicacionesView = ({ openModal }: { openModal: any }) => {
  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 space-y-6">
       <div className="flex items-center justify-between mb-2">
         <div>
            <h2 className="text-xl font-bold text-slate-900 leading-tight uppercase tracking-tighter">Central de Comunicaciones</h2>
            <p className="text-xs text-slate-500 italic mt-1 leading-none shadow-xs">Gestión de convocatorias y anuncios territoriales</p>
         </div>
         <button 
          onClick={() => openModal('form', 'Nueva Difusión Territorial', {})}
          className="flex items-center gap-2 px-4 py-2 bg-brand-primary text-white rounded-xl font-bold text-[10px] uppercase shadow-sm"
        >
            <Plus size={14} /> Nueva Difusión
         </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-4">
           {[1, 2, 3].map((i) => (
             <div key={i} className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm flex gap-6 hover:border-brand-primary/30 transition-all cursor-pointer shadow-xs group">
                <div className="w-16 h-16 bg-slate-50 rounded-2xl flex items-center justify-center text-slate-400 group-hover:bg-brand-primary/10 group-hover:text-brand-primary transition-colors shrink-0">
                   <MessageSquare size={32} />
                </div>
                <div className="flex-1 space-y-2">
                   <div className="flex justify-between items-start">
                      <h4 className="text-sm font-black text-slate-900 uppercase italic">Convocatoria: Jornada de Sistematización 7T</h4>
                      <span className="text-[10px] font-bold text-slate-400 uppercase italic">Hace {i}d</span>
                   </div>
                   <p className="text-xs text-slate-600 line-clamp-2">Se informa a todos los voceros de las comunas del eje que el próximo viernes se realizará el taller regional para la validación de nudos críticos...</p>
                   <div className="flex gap-2 pt-2">
                      <span className="px-2 py-0.5 bg-slate-50 text-slate-500 text-[9px] font-bold rounded italic uppercase border border-slate-100">WhatsApp</span>
                      <span className="px-2 py-0.5 bg-slate-50 text-slate-500 text-[9px] font-bold rounded italic uppercase border border-slate-100">SMS</span>
                      <span className="px-2 py-0.5 bg-slate-50 text-slate-500 text-[9px] font-bold rounded italic uppercase border border-slate-100">App</span>
                   </div>
                </div>
             </div>
           ))}
        </div>

        <div className="space-y-6">
           <div className="bg-white p-8 rounded-3xl border border-slate-100 shadow-sm space-y-4 relative overflow-hidden">
               <div className="absolute top-0 right-0 p-4 opacity-[0.05]">
                  <Settings size={60} className="text-brand-primary" />
               </div>
               <h3 className="text-xs font-black text-slate-900 uppercase tracking-widest leading-none">Canales Activos</h3>
               <div className="space-y-3 pt-2">
                  {[
                    { name: 'Bot de Telegram', status: 'Online', color: 'text-emerald-500' },
                    { name: 'Central de SMS', status: 'Crédito Agotado', color: 'text-red-500' },
                    { name: 'Notif. Push App', status: 'Online', color: 'text-emerald-500' },
                  ].map((c, i) => (
                    <div key={i} className="flex justify-between items-center bg-slate-50 p-3 rounded-xl border border-slate-100">
                       <span className="text-xs font-bold text-slate-800 italic uppercase">{c.name}</span>
                       <span className={cn("text-[8px] font-black uppercase italic", c.color)}>{c.status}</span>
                    </div>
                  ))}
               </div>
               <button 
                 onClick={() => openModal('form', 'Configurar Canales de Comunicación', {})}
                 className="w-full py-2.5 bg-brand-primary/10 text-brand-primary text-[10px] font-black rounded-xl hover:bg-brand-primary hover:text-white transition-all uppercase italic shadow-xs"
               >
                 Configurar Canales
               </button>
           </div>
        </div>
      </div>
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
  onLogout,
  openModal
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
                  ? "bg-brand-primary/10 text-brand-primary" 
                  : "text-slate-500 hover:bg-gray-50 hover:text-slate-800"
              )}
            >
              <item.icon size={20} className={cn(
                "shrink-0",
                activeTab === item.id ? "text-brand-primary" : "text-slate-400 group-hover:text-brand-primary transition-colors"
              )} />
              {!collapsed && (
                <span className="font-bold text-sm flex-1 text-left">{item.label}</span>
              )}
              {!collapsed && item.children && (
                <ChevronDown size={14} className={cn(
                  "transition-transform",
                  expandedItems.includes(item.id) ? "rotate-180" : ""
                )} />
              )}
              {activeTab === item.id && !collapsed && (
                <motion.div
                  layoutId="activeNavSala"
                  className="ml-auto w-1 h-4 rounded-full bg-brand-primary"
                />
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

      {/* Comunidades Coordinadas */}
      {!collapsed && (
        <div className="mt-8 space-y-4">
          <div className="flex items-center justify-between px-3">
             <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest italic">Comunidades</span>
             <button onClick={() => openModal('form', 'Vincular Nueva Comunidad', {})} className="text-brand-primary hover:scale-110 transition-transform">
                <Plus size={14} />
             </button>
          </div>
          <div className="space-y-1">
             {['Brisas del Norte', 'El Trigo A', 'Los Picapiedras', 'Colinas de Carrizal'].map((com, idx) => (
                <button 
                  key={idx}
                  onClick={() => openModal('detail', 'Información de Comunidad: ' + com, { Estatus: 'Sincronizada', 'Último Reporte': 'Hace 2h', 'Nivel de Org': 'Elevado' })}
                  className="w-full flex items-center gap-2 px-3 py-2 text-xs font-bold text-slate-600 hover:bg-slate-50 hover:text-brand-primary rounded-xl transition-all group"
                >
                   <MapPin size={14} className="text-slate-300 group-hover:text-brand-primary transition-colors" />
                   <span className="truncate">{com}</span>
                   <ChevronRight size={12} className="ml-auto opacity-0 group-hover:opacity-100 transition-all -translate-x-2 group-hover:translate-x-0" />
                </button>
             ))}
          </div>
        </div>
      )}
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

const DashboardView = ({ user, openModal }: { user: SalaAutogobiernoData; openModal: any }) => {
  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-700 space-y-6">
      {/* Analytical Metrics Header */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div 
          onClick={() => openModal('detail', 'Desglose de Población', { Total: '4,285', Familias: '1,200', Habitantes: '3,085', Estatus: 'Validado' })}
          className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm overflow-hidden relative group cursor-pointer hover:border-brand-primary transition-all"
        >
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

        <div 
          onClick={() => openModal('detail', 'Estatus de Organización', { Nivel: '78%', 'Consejos Vigentes': '8/12', Próx_Vencimientos: '2', Alertas: 'Ninguna' })}
          className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm overflow-hidden relative group cursor-pointer hover:border-brand-primary transition-all"
        >
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

        <div 
          onClick={() => openModal('form', 'Nueva Sistematización Mensual', { mes: 'Mayo 2024' })}
          className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm overflow-hidden relative group cursor-pointer hover:border-brand-primary transition-all"
        >
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
                <div 
                  key={item.id} 
                  onClick={() => openModal('detail', 'Sistematización: ' + item.name, { Meta: item.label, 'Cantidad Reportes': item.count, Estatus: 'Sincronizado' })}
                  className="group cursor-pointer hover:bg-gray-50 transition-all p-2 -m-2 rounded-xl border border-transparent hover:border-gray-100"
                >
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
                   <div 
                    key={i} 
                    onClick={() => openModal('detail', 'Alerta de Nudo Crítico', alert)}
                    className="flex items-center justify-between p-3 bg-white border border-gray-100 rounded-xl hover:border-brand-primary/30 transition-all cursor-pointer shadow-sm group"
                  >
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
                 <button 
                  onClick={() => openModal('success', 'Validación Exitosa', { message: 'Todos los datos de la base territorial han sido validados y sincronizados correctamente con el sistema central.' })}
                  className="w-full py-2 bg-white text-brand-primary text-[10px] font-bold rounded-lg border border-brand-primary/10 hover:bg-brand-primary hover:text-white transition-all shadow-sm uppercase tracking-wider"
                >
                    Ir a Validar Datos
                 </button>

              </div>
           </div>
        </div>
      </div>
    </div>
  );
};
