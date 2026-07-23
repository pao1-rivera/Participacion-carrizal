"use client";

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext'; 
import { useRouter, usePathname } from 'next/navigation';
import {  
  TrendingUp, 
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
import { DigitalizacionDashboard } from '@/app/components/dashboard/digital/DigitalizacionDashboard';
import { SecretarioDashboard } from '@/app/components/dashboard/secretario/SecretarioDashboard';
import { AlcaldesaDashboard } from '@/app/components/dashboard/alcaldesa/AlcaldesaDashboard';
import { PerfilView } from '@/app/components/dashboard/common/PerfilView';
import { PlanificacionView } from './components/dashboard/planificacion/PlanificacionViewProps';
import { ComunasDireccionView } from './components/dashboard/direcomunas/ComunasDireccionView';
import { AdultoMayorView } from './components/dashboard/adulto-mayor/AdultoMayor';
import { AdminDashboard } from './components/dashboard/admin/AdminDashboard';

type DashboardView = 'dashboard' | 'agenda' | 'stats' | 'profile';

const StatCard = ({ title, value, icon: Icon, trend, color }: any) => (
  <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm shadow-gray-200/40 transition-all hover:shadow-md">
    <div className="flex items-center justify-between">
      <div className={cn("flex h-12 w-12 items-center justify-center rounded-xl", color)}>
        <Icon className="h-6 w-6" />
      </div>
      {trend !== undefined && trend !== null && (  
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

const PageP = () => {
  const { user, logout, isLoading } = useAuth();
  const router = useRouter();
  const [activeView, setActiveView] = useState<DashboardView>('dashboard');

  useEffect(() => {
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

  const userRole = user.rolNombre;
  const isAdminOrAlcaldesa = userRole === 'admin' || userRole === 'alcaldesa';

  const handleLogout = () => {
    if (logout) {
      logout();
    } else {
      console.error("Logout function is not defined in AuthContext");
    }
  };

  const renderContent = () => { 
    if (activeView === 'profile') return <PerfilView user={user} />;

    const roleLower = user.rolNombre?.toLowerCase().trim();
    
    // Verificar primero si es super_admin
    if (roleLower === 'super_admin') {
      return <AdminDashboard user={user} onLogout={handleLogout} />;
    }
    switch (roleLower) {
      case 'vocero_cc':
        return <ConsejoComunalDashboard user={user} onLogout={handleLogout} />;
      case 'vocero_c':
        return <ComunaDashboard user={user} onLogout={handleLogout} />;
      case 'coordinador_s':
        return <SalaAutogobiernoDashboard user={user} onLogout={handleLogout} />;
      case 'secretario':
        return <SecretarioDashboard user={user} onLogout={handleLogout} />;
      case 'alcaldesa':
        return <AlcaldesaDashboard user={user} onLogout={handleLogout} />;
      case 'admin':
        return <AdminDashboard user={user} onLogout={handleLogout} />;
      
      default:
        if (roleLower?.includes('planificacion') || roleLower?.includes('director_planificacion')) {
          return <PlanificacionView user={user} onLogout={handleLogout} activeSection="dashboardP" />;
        }
        
        if (roleLower?.includes('digitalizacion') || roleLower?.startsWith('director_digital')) {
          return <DigitalizacionDashboard user={user} onLogout={handleLogout} />;
        }

        if (roleLower?.includes('direcomunas') || roleLower?.includes('director_comunas')) {
          return <ComunasDireccionView user={user} onLogout={handleLogout} />;
        }
        
        if (roleLower?.includes('adultomayor') || 
            roleLower?.includes('adulto mayor') || 
            roleLower?.includes('director_adulto')) {
          return <AdultoMayorView user={user} onLogout={handleLogout} />;
        }
        
        return <div className="p-8 text-center">
          <h1 className="text-4xl font-black text-slate-400 mb-4">Rol no configurado</h1>
          <p className="text-lg text-slate-500">Rol: {user.rolNombre}</p>
        </div>;
    }
  };

  const rolesConSidebarPropio = [
    'vocero_cc', 'vocero_c', 'coordinador_s', 
    'secretario', 'alcaldesa', 'digitalizacion', 
    'planificacion', 'direcomunas', 'director_comunas',
    'adultomayor', 'director_adulto', 'admin', 'super_admin'
  ];
  
  const isGenericUser = !rolesConSidebarPropio.some(role => 
    userRole?.toLowerCase().includes(role)
  );

  return (
    <div className="flex min-h-screen bg-gray-50/50 overflow-hidden">
      {!isGenericUser && (
        <div className="w-0 lg:w-0" /> 
      )}
      
      <main className="flex-1 h-screen overflow-y-auto bg-gray-50/50">
        <div className={cn("w-full h-full", isGenericUser && "max-w-400 mx-auto")}>
          <AnimatePresence mode="wait">
            <motion.div
              key={userRole + activeView}
              initial={{ opacity: 0, x: 10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -10 }}
              transition={{ duration: 0.2 }}
              className="h-full w-full"
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