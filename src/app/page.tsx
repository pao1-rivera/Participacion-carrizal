"use client";

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext'; 
import { useRouter, usePathname } from 'next/navigation';
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
  LayoutDashboard,
  User as UserIcon,
  LogOut,
  ShieldCheck
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/app/lib/utils';

// --- IMPORTACIÓN DE COMPONENTES ---
import { ConsejoComunalDashboard } from '@/app/components/dashboard/consejo-comunal/ConsejoComunalDashboard';
import { ComunaDashboard } from '@/app/components/dashboard/comuna/ComunaDashboard';
import { SalaAutogobiernoDashboard } from '@/app/components/dashboard/sala-autogobierno/SalaAutogobiernoDashboard';
import { DirectorDashboard } from '@/app/components/dashboard/direcciones/DirectorDashboard';
import { SecretarioDashboard } from '@/app/components/dashboard/secretario/SecretarioDashboard';
import { AlcaldesaDashboard } from '@/app/components/dashboard/alcaldesa/AlcaldesaDashboard';
import AgendaView from '@/app/components/dashboard/AgendaView'; 
import { StatsView } from '@/app/components/dashboard/StatsView';

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

const PageP = () => {
  const { user, logout, isLoading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const [activeView, setActiveView] = React.useState<DashboardView>('dashboard');

  React.useEffect(() => {
    if (!isLoading && !user) {
      router.push('/login');
    }
  }, [user, isLoading, router]);
  
  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="h-12 w-12 border-4 border-brand-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-slate-500 font-bold">Cargando Participación Carrizal...</p>
        </div>
      </div>
    );
  }

  if (!user) return null;

  const isAdminOrAlcaldesa = user.role === 'admin' || user.role === 'alcaldesa';

  // Se asegura que handleLogout sea siempre una función válida
  const handleLogout = () => {
    if (logout) {
      logout();
    } else {
      console.error("Logout function is not defined in AuthContext");
    }
  };

  const renderContent = () => {
    if (activeView === 'agenda') return <AgendaView />;
    if (activeView === 'stats') return <StatsView />;
    if (activeView === 'profile') return <p className="text-center py-20 text-slate-400 font-bold italic">Cargando Perfil... Redirigiendo</p>;

    // Casos especiales para dashboards con estructura propia (Full Screen)
    // Pasamos handleLogout a la prop onLogout
    if (user.role === 'consejo_comunal') return <ConsejoComunalDashboard user={user} onLogout={handleLogout} />;
    if (user.role === 'comuna') return <ComunaDashboard user={user} onLogout={handleLogout} />;
    if (user.role === 'sala_autogobierno') return <SalaAutogobiernoDashboard user={user as any} onLogout={handleLogout} />;
    if (user.role === 'director') return <DirectorDashboard user={user as any} onLogout={handleLogout} />;
    if (user.role === 'secretario') return <SecretarioDashboard user={user as any} onLogout={handleLogout} />;
    if (user.role === 'alcaldesa') return <AlcaldesaDashboard user={user as any} onLogout={handleLogout} />;

    // Dashboard genérico para Admin u otros roles
    return (
      <div className="space-y-8">
        <motion.div 
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between"
        >
          <div>
            <h1 className="text-2xl font-bold text-slate-900">¡Bienvenido, {user.firstName}!</h1>
            <p className="text-slate-500 capitalize">Plataforma de {user.role.replace('_', ' ')} — Carrizal</p>
          </div>
          <div className="flex items-center gap-3">
            <button onClick={() => setActiveView('agenda')} className="flex items-center gap-2 rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50 transition-colors">
              <Calendar className="h-4 w-4" /> Agenda
            </button>
            <button className="flex items-center gap-2 rounded-full bg-brand-primary px-5 py-2 text-sm font-bold text-white shadow-lg shadow-brand-primary/20 hover:bg-brand-primary/90 transition-all">
              <UserPlus className="h-4 w-4" /> Nueva Solicitud
            </button>
          </div>
        </motion.div>

        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {isAdminOrAlcaldesa ? (
            <>
              <StatCard title="Consejos Comunales" value="124" icon={Users} color="bg-green-50 text-brand-primary" trend={12} />
              <StatCard title="Comunas Activas" value="18" icon={Building2} color="bg-brand-primary/10 text-brand-secondary" trend={5} />
              <StatCard title="Proyectos en Curso" value="44" icon={CheckCircle2} color="bg-green-50 text-green-600" trend={8} />
              <StatCard title="Zonas en Silencio" value="3" icon={AlertCircle} color="bg-red-50 text-red-600" trend={-2} />
            </>
          ) : (
            <>
              <StatCard title="Mi Estatus" value="Vigente" icon={CheckCircle2} color="bg-green-50 text-green-600" />
              <StatCard title="Proyectos Vinculados" value="2" icon={Building2} color="bg-brand-primary/10 text-brand-primary" />
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
                       <span className="text-[10px] font-bold uppercase text-center leading-tight">{i === 1 ? 'MAY' : 'ABR'} <br/> {10 + i}</span>
                     </div>
                     <div className="flex-1">
                        <h4 className="text-sm font-bold text-gray-800">Actualización de Vocería - {i === 1 ? 'C.C. El Trigo' : 'C.C. Brisas del Norte'}</h4>
                        <p className="mt-1 text-xs text-gray-500 truncate max-w-md">Se ha validado el acta constitutiva enviada el día de ayer por el equipo de Digitalización.</p>
                     </div>
                     <div className="flex items-center">
                       <span className={cn("rounded-lg px-3 py-1 text-[10px] font-bold uppercase tracking-tight border", i === 3 ? "bg-amber-50 text-amber-700 border-amber-100" : "bg-green-50 text-green-700 border-green-100")}>
                         {i === 3 ? 'Pendiente' : 'Completado'}
                       </span>
                     </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  const isGenericUser = !['consejo_comunal', 'comuna', 'sala_autogobierno', 'director', 'secretario', 'alcaldesa'].includes(user.role);

  return (
    <div className="flex min-h-screen bg-gray-50/50 overflow-hidden">
      {isGenericUser && (
        <aside className="w-64 shrink-0 border-r border-gray-100 bg-white p-6 hidden lg:flex flex-col">
          <div className="mb-10 flex items-center gap-3 px-2">
             <div className="h-8 w-8 rounded-lg bg-brand-primary flex items-center justify-center text-white">
                <ShieldCheck className="h-5 w-5" />
             </div>
             <span className="text-sm font-black tracking-tighter text-slate-900 uppercase">Carrizal Participa</span>
          </div>
          <nav className="flex-1 space-y-1">
             <SidebarItem onClick={() => setActiveView('dashboard')} icon={LayoutDashboard} label="Dashboard" active={activeView === 'dashboard'} />
             <SidebarItem onClick={() => router.push('/profile')} icon={UserIcon} label="Mi Perfil" active={pathname === '/profile'} />
             <SidebarItem onClick={() => setActiveView('agenda')} icon={Calendar} label="Agenda" active={activeView === 'agenda'} />
             <SidebarItem onClick={() => setActiveView('stats')} icon={FileBarChart} label="Estadísticas" active={activeView === 'stats'} />
          </nav>
          <div className="mt-auto pt-10">
             <button onClick={handleLogout} className="flex w-full items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold text-rose-500 hover:bg-rose-50 transition-all border border-transparent hover:border-rose-100">
               <LogOut className="h-4 w-4" />
               <span>Cerrar Sesión</span>
             </button>
          </div>
        </aside>
      )}

      <main className="flex-1 h-screen overflow-y-auto">
        <div className={cn("mx-auto h-full", isGenericUser ? "max-w-[1600px] p-8 lg:p-12" : "w-full")}>
          <AnimatePresence mode="wait">
            <motion.div
              key={user.role + activeView}
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

export default PageP;