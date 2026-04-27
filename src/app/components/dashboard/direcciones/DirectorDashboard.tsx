import React, { useState, useEffect } from 'react';
import { 
  LayoutDashboard, 
  Map as MapIcon, 
  ClipboardCheck, 
  Users, 
  TrendingUp, 
  Calendar, 
  FileText, 
  MessageSquare, 
  Settings, 
  LogOut, 
  ChevronRight, 
  ChevronLeft,
  Search,
  Filter,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Clock,
  ArrowUpRight,
  MoreVertical,
  MapPin,
  ShieldCheck,
  Zap,
  BarChart3,
  PieChart as PieIcon,
  Bell,
  Heart,
  BookOpen,
  Monitor,
  Building2,
  ChevronDown,
  Menu
} from 'lucide-react';
import { Sidebar } from '@/app/layout/Sidebar';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/app/lib/utils';
import { DirectorData, DirectorType } from '@/types';
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
} from 'recharts';

interface NavItem {
  id: string;
  label: string;
  icon: React.ElementType;
  children?: { id: string; label: string }[];
}

const COMMON_NAV_ITEMS: NavItem[] = [
  { id: 'dashboard', label: 'Panel de Control', icon: LayoutDashboard },
  { 
    id: 'gestion', 
    label: 'Gestión Territorial', 
    icon: MapPin,
    children: [
      { id: 'mapa', label: 'Mapa de Acción' },
      { id: 'validacion', label: 'Bandeja de Validación' },
    ]
  },
  { 
    id: 'seguimiento', 
    label: 'Seguimiento y Control', 
    icon: TrendingUp,
    children: [
      { id: 'nudos', label: 'Nudos Críticos (7T)' },
      { id: 'censo', label: 'Censo Sectorizado' },
    ]
  },
  { 
    id: 'planificacion', 
    label: 'Planificación', 
    icon: Calendar,
    children: [
      { id: 'cronograma', label: 'Cronograma' },
      { id: 'directrices', label: 'Directrices' },
    ]
  },
  { id: 'reportes', label: 'Reportes y Estadísticas', icon: BarChart3 },
  { id: 'mensajeria', label: 'Mensajería Comunal', icon: MessageSquare },
];

const T7_STATS = [
  { name: 'Resueltos', value: 45, color: '#10B981' },
  { name: 'En Proceso', value: 30, color: '#3B82F6' },
  { name: 'Pendientes', value: 25, color: '#EF4444' },
];

const CIRCUIT_STATS = [
  { circuit: 'Circuito 1', value: 85 },
  { circuit: 'Circuito 2', value: 65 },
  { circuit: 'Circuito 3', value: 92 },
  { circuit: 'Circuito 4', value: 48 },
  { circuit: 'Circuito 5', value: 74 },
];

export const DirectorDashboard = ({ user, onLogout }: { user: any; onLogout: () => void }) => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

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

  const getDirectorTitle = (type: DirectorType) => {
    switch (type) {
      case 'comunas_consejos_comunales': return 'Dirección de Comunas';
      case 'adultas_adulto_mayor': return 'Dirección de Adulto Mayor';
      case 'planificacion_formacion': return 'Dirección de Planificación';
      case 'digitalizacion_tramites': return 'Dirección de Digitalización';
      default: return 'Dirección Técnica';
    }
  };

  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard':
        return <DashboardView user={user} />;
      case 'validacion':
        return <ValidationInbox />;
      default:
        return (
          <div className="flex items-center justify-center h-[calc(100vh-120px)]">
            <div className="text-center">
              <div className="bg-gray-100 p-6 rounded-full w-20 h-20 flex items-center justify-center mx-auto mb-4">
                <Settings className="w-10 h-10 text-gray-400 animate-spin-slow" />
              </div>
              <h3 className="text-xl font-medium text-gray-900">Módulo de {activeTab.toUpperCase()}</h3>
              <p className="text-gray-500 max-w-sm mx-auto mt-2 italic shadow-xs">
                Esta sección está siendo optimizada para la gestión de su dirección.
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

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto overflow-x-hidden pt-16 lg:pt-0">
        <DashboardNavbar 
          user={user}
          title={getDirectorTitle(user.directorType)}
          subtitle="GESTIÓN DIRECTIVA Y SEGUIMIENTO"
          onMobileMenuOpen={() => setIsMobileMenuOpen(true)}
          roleIcon={<ShieldCheck size={24} />}
          actions={
            <div className="bg-slate-50 px-3 py-1.5 rounded-xl border border-slate-200 flex items-center gap-2 hover:border-brand-primary/30 transition-all">
              <Filter size={14} className="text-slate-400" />
              <select className="bg-transparent text-[10px] font-bold text-slate-600 uppercase tracking-widest outline-none cursor-pointer">
                <option>Todos los Circuitos</option>
                <option>Circuito 1</option>
                <option>Circuito 2</option>
              </select>
            </div>
          }
        />

        <div className="p-4 lg:p-8">
          {renderContent()}
        </div>
      </main>
    </div>
  );
};

const DashboardView = ({ user }: { user: DirectorData }) => {
  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-700 space-y-6">
      {/* Notifications Urgentes (Top Widgets) */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <NotificationCard title="Pendientes Validar" value="14" sub="Trámites esperando" icon={ClipboardCheck} color="text-brand-primary" bg="bg-blue-50" />
        <NotificationCard title="Alertas Rojas" value="3" sub="Casos críticos" icon={AlertCircle} color="text-red-600" bg="bg-red-50" />
        <NotificationCard title="Metas del Mes" value="68%" sub="Cumplimiento POA" icon={TrendingUp} color="text-green-600" bg="bg-green-50" />
        <NotificationCard title="Zonas en Silencio" value="5" sub="Sin reportes" icon={Clock} color="text-orange-600" bg="bg-orange-50" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Inbox de Validación */}
        <div className="lg:col-span-2 bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden flex flex-col">
           <div className="p-6 border-b border-gray-50 flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-gray-900 uppercase tracking-tight">Centro de Validación</h3>
                <p className="text-[10px] text-gray-500 font-medium">Bandeja de solicitudes entrantes</p>
              </div>
              <button className="text-[10px] font-bold text-brand-primary uppercase underline underline-offset-4">Ver toda la bandeja</button>
           </div>
           <div className="divide-y divide-gray-50">
              {[1, 2, 3, 4].map(i => (
                <div key={i} className="p-4 hover:bg-gray-50/50 transition-colors flex items-center justify-between group">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-xl bg-gray-100 flex items-center justify-center group-hover:bg-brand-primary/10 transition-colors">
                      <FileText size={18} className="text-gray-400 group-hover:text-brand-primary" />
                    </div>
                    <div>
                      <p className="text-xs font-bold text-gray-900">Validación de Vocería - C.C. El Trigo</p>
                      <p className="text-[10px] text-gray-500 font-medium">Origen: Circuito 2 / Carrizal Central</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button className="px-3 py-1.5 bg-green-500 text-white text-[10px] font-bold rounded-lg hover:bg-green-600 shadow-md shadow-green-500/20">Aprobar</button>
                    <button className="px-3 py-1.5 bg-red-50 text-red-600 text-[10px] font-bold rounded-lg hover:bg-red-100">Observar</button>
                    <button className="p-2 text-gray-400 hover:text-gray-600"><MoreVertical size={16} /></button>
                  </div>
                </div>
              ))}
           </div>
        </div>

        {/* Widget Exclusivo por Dirección */}
        <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-6 overflow-hidden">
           <ExclusiveWidget type={user.directorType} />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-8 h-[350px] flex flex-col">
             <div className="mb-6 flex items-center justify-between">
                <h3 className="text-sm font-bold text-gray-900 uppercase tracking-tight">Distribución por Circuito</h3>
                <PieIcon size={18} className="text-gray-300" />
             </div>
             <div className="flex-1">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={CIRCUIT_STATS}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F1F5F9" />
                    <XAxis dataKey="circuit" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#94A3B8' }} />
                    <YAxis hide />
                    <RechartsTooltip cursor={{ fill: '#F8FAFC' }} contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }} />
                    <Bar dataKey="value" fill="#042D5F" radius={[4, 4, 0, 0]} barSize={30} />
                  </BarChart>
                </ResponsiveContainer>
             </div>
          </div>

          <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-8 h-[350px] flex flex-col">
             <div className="mb-6 flex items-center justify-between">
                <h3 className="text-sm font-bold text-gray-900 uppercase tracking-tight">Avance Global de las 7T</h3>
                <PieIcon size={18} className="text-gray-300" />
             </div>
             <div className="flex-1 flex items-center justify-center">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={T7_STATS}
                      innerRadius={60}
                      outerRadius={100}
                      paddingAngle={5}
                      dataKey="value"
                    >
                      {T7_STATS.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <RechartsTooltip />
                  </PieChart>
                </ResponsiveContainer>
                <div className="flex flex-col gap-3 ml-4">
                   {T7_STATS.map((stat, i) => (
                     <div key={i} className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-sm" style={{ backgroundColor: stat.color }} />
                        <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">{stat.name}: {stat.value}%</span>
                     </div>
                   ))}
                </div>
             </div>
          </div>
      </div>
    </div>
  );
};

const NotificationCard = ({ title, value, sub, icon: Icon, color, bg }: any) => (
  <div className="bg-white p-5 rounded-3xl border border-gray-100 shadow-sm flex items-center gap-5 group cursor-pointer hover:border-brand-primary/20 transition-all">
    <div className={cn("w-14 h-14 rounded-2xl flex items-center justify-center shrink-0 transition-transform group-hover:scale-110", bg)}>
      <Icon className={cn("w-7 h-7", color)} />
    </div>
    <div>
      <h3 className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">{title}</h3>
      <p className="text-2xl font-black text-gray-900 tracking-tighter">{value}</p>
      <p className="text-[10px] text-gray-500 font-medium">{sub}</p>
    </div>
  </div>
);

const ExclusiveWidget = ({ type }: { type: DirectorType }) => {
  switch (type) {
    case 'comunas_consejos_comunales':
      return (
        <div className="space-y-6">
           <div className="flex items-center gap-3">
              <div className="p-2 bg-orange-50 rounded-xl text-orange-600"><AlertCircle size={20} /></div>
              <h4 className="text-xs font-bold text-gray-900 uppercase">Semáforo de Vigencia (RIF)</h4>
           </div>
           <div className="space-y-4">
              <div className="flex justify-between items-center bg-red-50 p-3 rounded-2xl border border-red-100">
                <span className="text-xs font-bold text-red-700 font-mono">Vencidos</span>
                <span className="text-lg font-black text-red-700">12</span>
              </div>
              <div className="flex justify-between items-center bg-orange-50 p-3 rounded-2xl border border-orange-100">
                <span className="text-xs font-bold text-orange-700 font-mono">Por Vencer</span>
                <span className="text-lg font-black text-orange-700">8</span>
              </div>
              <div className="flex justify-between items-center bg-green-50 p-3 rounded-2xl border border-green-100">
                <span className="text-xs font-bold text-green-700 font-mono">Vigentes</span>
                <span className="text-lg font-black text-green-700">85</span>
              </div>
           </div>
        </div>
      );
    case 'adultas_adulto_mayor':
      return (
        <div className="space-y-6 h-full flex flex-col">
           <div className="flex items-center gap-3">
              <div className="p-2 bg-brand-primary/5 rounded-xl text-brand-primary"><Heart size={20} /></div>
              <h4 className="text-xs font-bold text-gray-900 uppercase">Mapa de Patologías</h4>
           </div>
           <div className="flex-1 bg-gray-50 rounded-2xl border border-gray-100 relative overflow-hidden flex flex-col justify-center items-center p-4">
              <MapPin size={40} className="text-brand-primary/20 mb-2" />
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest text-center">Concentración de Salud por Calle</p>
              <div className="mt-4 w-full space-y-2">
                 <div className="flex justify-between text-[10px] font-bold"><span className="text-gray-500">Hipertensión</span><span className="text-brand-primary">42%</span></div>
                 <div className="h-1.5 w-full bg-white rounded-full overflow-hidden border border-gray-100">
                    <div className="h-full bg-brand-primary w-[42%]" />
                 </div>
              </div>
           </div>
        </div>
      );
    case 'planificacion_formacion':
      return (
        <div className="space-y-6">
           <div className="flex items-center gap-3">
              <div className="p-2 bg-brand-primary/5 rounded-xl text-brand-primary"><BookOpen size={20} /></div>
              <h4 className="text-xs font-bold text-gray-900 uppercase">Índice de Formación</h4>
           </div>
           <div className="flex flex-col items-center justify-center pt-4">
              <div className="relative w-32 h-32 flex items-center justify-center">
                 <svg className="w-full h-full -rotate-90">
                    <circle cx="64" cy="64" r="58" stroke="currentColor" strokeWidth="12" fill="transparent" className="text-gray-100" />
                    <circle cx="64" cy="64" r="58" stroke="currentColor" strokeWidth="12" fill="transparent" strokeDasharray="364" strokeDashoffset="109" className="text-brand-primary" />
                 </svg>
                 <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <span className="text-2xl font-black text-gray-900 leading-none">70%</span>
                    <span className="text-[8px] font-black uppercase text-gray-400 mt-1">Capacitados</span>
                 </div>
              </div>
              <p className="text-[10px] text-gray-500 mt-6 text-center font-medium italic">120 Voceros formados en mayo</p>
           </div>
        </div>
      );
    case 'digitalizacion_tramites':
      return (
        <div className="space-y-6">
           <div className="flex items-center gap-3">
              <div className="p-2 bg-brand-primary/5 rounded-xl text-brand-primary"><Monitor size={20} /></div>
              <h4 className="text-xs font-bold text-gray-900 uppercase tracking-tight">Salud del Sistema</h4>
           </div>
           <div className="space-y-6 pt-2">
              <div className="flex items-center justify-between">
                 <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">Tasa de Carga</span>
                 <span className="text-xs font-bold text-green-600">Alta (98%)</span>
              </div>
              <div className="flex items-center justify-between">
                 <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">Reportes Error</span>
                 <span className="text-xs font-bold text-brand-primary">2 Activos</span>
              </div>
              <div className="p-4 bg-brand-primary rounded-2xl text-white">
                 <p className="text-[10px] font-bold uppercase tracking-widest leading-none mb-2">Latencia API</p>
                 <p className="text-xl font-black tracking-tighter">45ms</p>
              </div>
           </div>
        </div>
      );
    default:
      return null;
  }
};

const ValidationInbox = () => {
  return (
    <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden flex flex-col">
       <div className="p-6 border-b border-gray-50 bg-gray-50/30">
          <h2 className="text-lg font-bold text-gray-900 italic tracking-tight">Bandeja de Validación de Base</h2>
          <p className="text-xs text-gray-500 mt-1 font-medium">Filtre y valide la información enviada por los consejos comunales.</p>
       </div>
       <div className="divide-y divide-gray-50">
          {[1, 2, 3, 4, 5, 6, 7, 8].map(i => (
            <div key={i} className="p-6 hover:bg-gray-50/50 transition-colors flex items-center justify-between group">
              <div className="flex items-center gap-6">
                 <div className="w-12 h-12 rounded-2xl bg-white border border-gray-100 shadow-sm flex items-center justify-center text-gray-400 group-hover:bg-brand-primary group-hover:text-white transition-all">
                    <FileText size={20} />
                 </div>
                 <div>
                    <div className="flex items-center gap-2">
                       <h4 className="text-sm font-bold text-gray-900 tracking-tight">Carga de Censo Demográfico</h4>
                       <span className="px-2 py-0.5 bg-brand-primary/5 text-brand-primary text-[8px] font-black uppercase rounded-full">Nuevo</span>
                    </div>
                    <p className="text-[10px] text-gray-500 font-medium mt-0.5">Enviado por: <span className="text-gray-700 font-bold">C.C. El Despertar</span> • Hace 12 minutos</p>
                 </div>
              </div>
              <div className="flex items-center gap-4">
                 <div className="text-right mr-4 hidden md:block">
                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Estado</p>
                    <p className="text-[10px] font-bold text-orange-600 uppercase">En Revisión</p>
                 </div>
                 <div className="flex gap-2">
                    <button className="px-5 py-2 bg-brand-primary text-white text-[10px] font-bold rounded-xl hover:bg-brand-primary/90 shadow-lg shadow-brand-primary/20 transition-all">Validar</button>
                    <button className="px-5 py-2 bg-white border border-gray-200 text-gray-500 text-[10px] font-bold rounded-xl hover:bg-gray-50 transition-all">Ver Detalle</button>
                 </div>
              </div>
            </div>
          ))}
       </div>
    </div>
  );
};
