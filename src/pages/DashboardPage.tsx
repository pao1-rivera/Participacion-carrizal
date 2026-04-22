import React from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Users, 
  Building2, 
  Calendar, 
  TrendingUp, 
  AlertCircle, 
  CheckCircle2, 
  Clock,
  ArrowUpRight,
  FileBarChart,
  UserPlus,
  Phone,
  Mail,
  ChevronRight,
  LayoutDashboard,
  User as UserIcon,
  LogOut,
  Map as MapIcon,
  Target,
  ShieldCheck
} from 'lucide-react';
import { cn } from '../lib/utils';
import { ConsejoComunalDashboard } from '../components/dashboard/consejo-comunal/ConsejoComunalDashboard';
import { ComunaDashboard } from '../components/dashboard/comuna/ComunaDashboard';
import { SalaAutogobiernoDashboard } from '../components/dashboard/sala-autogobierno/SalaAutogobiernoDashboard';
import { DirectorDashboard } from '../components/dashboard/direcciones/DirectorDashboard';
import { AgendaView } from '../components/dashboard/AgendaView';
import { StatsView } from '../components/dashboard/StatsView';

type DashboardView = 'dashboard' | 'agenda' | 'stats' | 'profile';

const StatCard = ({ title, value, icon: Icon, trend, color }: any) => (
  <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm shadow-gray-200/40 transition-all hover:shadow-md">
    <div className="flex items-center justify-between">
      <div className={cn("flex h-12 w-12 items-center justify-center rounded-xl", color)}>
        <Icon className="h-6 w-6" />
      </div>
      {trend !== undefined && (
        <span className={cn(
          "flex items-center gap-0.5 text-[10px] font-bold px-2 py-0.5 rounded-full",
          trend > 0 ? "bg-green-50 text-green-700" : "bg-amber-50 text-amber-700"
        )}>
          {trend > 0 ? '+' : ''}{trend}%
          <TrendingUp className={cn("h-3 w-3", trend < 0 && "rotate-180")} />
        </span>
      )}
    </div>
    <div className="mt-4">
      <h3 className="text-[10px] font-bold text-gray-400 uppercase tracking-widest leading-none">{title}</h3>
      <p className="mt-2 text-2xl font-bold text-gray-900 leading-none tracking-tight">{value}</p>
    </div>
  </div>
);

const SidebarItem = ({ onClick, icon: Icon, label, active }: any) => (
  <button 
    onClick={onClick}
    className={cn(
      "flex w-full items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold transition-all",
      active 
        ? "bg-brand-primary text-white shadow-lg shadow-brand-primary/20" 
        : "text-slate-500 hover:bg-gray-100"
    )}
  >
    <Icon className="h-4 w-4" />
    <span>{label}</span>
  </button>
);

const DashboardPage = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [activeView, setActiveView] = React.useState<DashboardView>('dashboard');
  
  if (!user) return null;

  const isAdminOrAlcaldesa = user.role === 'admin' || user.role === 'alcaldesa';

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const renderContent = () => {
    if (activeView === 'agenda') return <AgendaView />;
    if (activeView === 'stats') return <StatsView />;
    if (activeView === 'profile') return <p className="text-center py-20 text-slate-400 font-bold italic">Cargando Perfil... Redirigiendo</p>; // This is handled by navigate or state

    if (user.role === 'consejo_comunal') {
      return <ConsejoComunalDashboard user={user} />;
    }

    if (user.role === 'comuna') {
      return <ComunaDashboard user={user} onLogout={handleLogout} />;
    }

    if (user.role === 'sala_autogobierno') {
      return <SalaAutogobiernoDashboard user={user as any} onLogout={handleLogout} />;
    }

    if (user.role === 'director') {
      return <DirectorDashboard user={user as any} onLogout={handleLogout} />;
    }

    return (
      <div className="space-y-8">
        <motion.div 
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between"
        >
          <div>
            <h1 className="text-2xl font-bold text-slate-900">
              ¡Bienvenido, {user.firstName}!
            </h1>
            <p className="text-slate-500 capitalize">
              Plataforma de {user.role.replace('_', ' ')} — Carrizal
            </p>
          </div>
          <div className="flex items-center gap-3">
            <button 
              onClick={() => setActiveView('agenda')}
              className="flex items-center gap-2 rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50 transition-colors"
            >
              <Calendar className="h-4 w-4" /> Agenda
            </button>
            <button className="flex items-center gap-2 rounded-full bg-brand-primary px-5 py-2 text-sm font-bold text-white shadow-lg shadow-brand-primary/20 hover:bg-brand-primary/90 transition-all">
              <UserPlus className="h-4 w-4" /> Nueva Solicitud
            </button>
          </div>
        </motion.div>

        {/* Quick Stats Grid */}
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {isAdminOrAlcaldesa ? (
            <>
              <StatCard title="Consejos Comunales" value="124" icon={Users} color="bg-blue-50 text-blue-600" trend={12} />
              <StatCard title="Comunas Activas" value="18" icon={Building2} color="bg-purple-50 text-purple-600" trend={5} />
              <StatCard title="Proyectos en Curso" value="44" icon={CheckCircle2} color="bg-green-50 text-green-600" trend={8} />
              <StatCard title="Zonas en Silencio" value="3" icon={AlertCircle} color="bg-red-50 text-red-600" trend={-2} />
            </>
          ) : (
            <>
              <StatCard title="Mi Estatus" value={user.role === 'sala_autogobierno' ? (user as any).estatus || 'Activo' : 'Vigente'} icon={CheckCircle2} color="bg-green-50 text-green-600" />
              <StatCard title="Proyectos Vinculados" value="2" icon={Building2} color="bg-blue-50 text-blue-600" />
              <StatCard title="Última Acta" value="Hace 4d" icon={Clock} color="bg-amber-50 text-amber-600" />
              <StatCard title="Reportes" value="15" icon={FileBarChart} color="bg-slate-50 text-slate-600" trend={20} />
            </>
          )}
        </div>

        <div className="grid gap-6 lg:grid-cols-3">
          <div className="lg:col-span-2 space-y-6">
            <div className="rounded-2xl border border-gray-100 bg-white p-8 shadow-sm shadow-gray-200/40">
              <div className="mb-8 flex items-center justify-between">
                 <h2 className="text-lg font-bold text-gray-900 border-l-4 border-brand-primary pl-4 tracking-tight italic">Actividades Recientes</h2>
                 <button className="text-[10px] font-bold text-brand-primary uppercase tracking-wider hover:underline">Ver todas</button>
              </div>
              <div className="space-y-4">
                {[1, 2, 3].map(i => (
                  <div key={i} className="flex gap-4 rounded-xl border border-gray-50 p-4 transition-all hover:border-brand-primary/10 hover:bg-gray-50/50 group">
                     <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-gray-50 text-gray-400 group-hover:bg-brand-primary group-hover:text-white transition-colors">
                       <span className="text-[10px] font-bold uppercase text-center leading-tight">
                         {i === 1 ? 'MAY' : 'ABR'} <br/> {10 + i}
                       </span>
                     </div>
                     <div className="flex-1">
                        <h4 className="text-sm font-bold text-gray-800">Actualización de Vocería - {i === 1 ? 'C.C. El Trigo' : 'C.C. Brisas del Norte'}</h4>
                        <p className="mt-1 text-xs text-gray-500 truncate max-w-md">Se ha validado el acta constitutiva enviada el día de ayer por el equipo de Digitalización.</p>
                     </div>
                     <div className="flex items-center">
                       <span className={cn(
                         "rounded-lg px-3 py-1 text-[10px] font-bold uppercase tracking-tight border",
                         i === 3 ? "bg-amber-50 text-amber-700 border-amber-100" : "bg-green-50 text-green-700 border-green-100"
                       )}>
                         {i === 3 ? 'Pendiente' : 'Completado'}
                       </span>
                     </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-2xl border border-gray-100 bg-white p-8 shadow-sm shadow-gray-200/40 overflow-hidden relative">
              <div className="flex items-start justify-between">
                <div>
                  <h2 className="text-lg font-bold text-gray-900 border-l-4 border-brand-primary pl-4 tracking-tight italic">Estado de Participación</h2>
                  <p className="text-[11px] font-bold text-gray-400 uppercase tracking-widest mt-1 ml-4">Monitoreo en tiempo real</p>
                </div>
                <FileBarChart className="h-5 w-5 text-gray-300" />
              </div>
              <div className="mt-12 flex items-end gap-2.5 h-32 px-4 cursor-pointer" onClick={() => setActiveView('stats')}>
                {[40, 60, 30, 80, 50, 90, 70, 45, 65, 85, 30, 95].map((h, i) => (
                   <div key={i} className="flex-1 bg-brand-primary/10 rounded-t-md group relative transition-all hover:bg-brand-primary" style={{ height: `${h}%` }}>
                      <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-gray-900 text-white text-[10px] font-bold px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity">
                        {h}%
                      </div>
                   </div>
                ))}
              </div>
              <div className="mt-4 flex justify-between text-[10px] uppercase font-bold text-gray-300 tracking-widest px-4">
                 <span>Enero 2024</span>
                 <span>Diciembre 2024</span>
              </div>
            </div>
          </div>

          <div className="space-y-6">
            <div className="rounded-3xl bg-brand-secondary p-8 text-white shadow-xl shadow-brand-primary/10 relative overflow-hidden group">
              <div className="relative z-10">
                <span className="text-[10px] font-bold uppercase tracking-widest text-cyan-300">Recurso Técnico</span>
                <h3 className="text-xl font-bold mt-2">Manual de Usuario</h3>
                <p className="mt-4 text-xs text-cyan-50 leading-relaxed font-medium">
                  Consulta los lineamientos técnicos para la carga de datos del poder popular según la ley orgánica.
                </p>
                <button className="mt-8 w-full flex items-center justify-center gap-2 rounded-xl bg-brand-primary py-3.5 text-xs font-bold text-white hover:bg-brand-primary/90 transition-all shadow-lg shadow-black/20">
                  Descargar Guía PDF <ArrowUpRight className="h-4 w-4" />
                </button>
              </div>
              <div className="absolute -bottom-10 -right-10 w-40 h-40 bg-brand-primary rounded-full blur-3xl opacity-20 group-hover:scale-110 transition-transform" />
            </div>

            <div className="rounded-2xl border border-gray-100 bg-white p-8 shadow-sm shadow-gray-200/40">
              <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-6">Canales de Ayuda</h3>
              <div className="space-y-6">
                 <div className="flex items-start gap-4">
                   <div className="h-8 w-8 rounded-lg bg-brand-primary/10 flex items-center justify-center text-brand-primary">
                     <Phone className="h-4 w-4" />
                   </div>
                   <div>
                     <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Soporte Técnico</p>
                     <p className="text-sm font-bold text-gray-800 mt-0.5">(0212) 123-4567</p>
                   </div>
                 </div>
                 <div className="flex items-start gap-4">
                   <div className="h-8 w-8 rounded-lg bg-brand-primary/10 flex items-center justify-center text-brand-primary">
                     <Mail className="h-4 w-4" />
                   </div>
                   <div>
                     <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Consultas</p>
                     <p className="text-sm font-bold text-gray-800 mt-0.5">soporte@carrizal.gob.ve</p>
                   </div>
                 </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="flex min-h-screen bg-gray-50/50 overflow-hidden">
      {/* Mini Sidebar - Hidden for roles with their own sidebar */}
      {user.role !== 'consejo_comunal' && user.role !== 'comuna' && user.role !== 'sala_autogobierno' && user.role !== 'director' && (
        <aside className="w-64 shrink-0 border-r border-gray-100 bg-white p-6 hidden lg:flex flex-col">
          <div className="mb-10 flex items-center gap-3 px-2">
             <div className="h-8 w-8 rounded-lg bg-brand-primary flex items-center justify-center text-white">
                <ShieldCheck className="h-5 w-5" />
             </div>
             <span className="text-sm font-black tracking-tighter text-slate-900 uppercase">Carrizal Participa</span>
          </div>

          <nav className="flex-1 space-y-1">
             <SidebarItem onClick={() => setActiveView('dashboard')} icon={LayoutDashboard} label="Dashboard" active={activeView === 'dashboard'} />
             <SidebarItem onClick={() => navigate('/profile')} icon={UserIcon} label="Mi Perfil" active={location.pathname === '/profile'} />
             
             <div className="pt-8 pb-4">
                <span className="px-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Navegación</span>
             </div>
             
             <SidebarItem onClick={() => setActiveView('agenda')} icon={Calendar} label="Agenda" active={activeView === 'agenda'} />
             <SidebarItem onClick={() => setActiveView('stats')} icon={FileBarChart} label="Estadísticas" active={activeView === 'stats'} />
          </nav>

          <div className="mt-auto pt-10">
             <button 
               onClick={handleLogout}
               className="flex w-full items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold text-rose-500 hover:bg-rose-50 transition-all border border-transparent hover:border-rose-100"
             >
               <LogOut className="h-4 w-4" />
               <span>Cerrar Sesión</span>
             </button>
          </div>
        </aside>
      )}

      {/* Main Content */}
      <main className="flex-1 h-screen overflow-y-auto">
        <div className={cn(
          "mx-auto p-0 lg:p-0 h-full",
          (user.role !== 'consejo_comunal' && user.role !== 'comuna' && user.role !== 'sala_autogobierno' && user.role !== 'director') ? "max-w-[1600px] p-8 lg:p-12" : ""
        )}>
          <AnimatePresence mode="wait">
            <motion.div
              key={activeView}
              initial={{ opacity: 0, x: 10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -10 }}
              transition={{ duration: 0.2 }}
              className="h-full"
            >
              {renderContent()}
            </motion.div>
          </AnimatePresence>
        </div>
      </main>
    </div>
  );
};

export default DashboardPage;

