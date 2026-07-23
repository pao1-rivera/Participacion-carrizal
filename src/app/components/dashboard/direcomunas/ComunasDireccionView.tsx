'use client';

import React, { useState, useEffect } from 'react';
import { 
  Building2, 
  Globe, 
  Users, 
  FileCheck, 
  LayoutDashboard,
  ShieldCheck,
  Target,
  Monitor
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/app/lib/utils';

// Importación de las sub-secciones
import { Dimen1 } from '../comundi/Dimen1';
import { Dimen2 } from '../comundi/Dimen2';
import { Dimen3 } from '../comundi/Dimen3';
import { Dimen4 } from '../comundi/Dimen4';
import { Validacion } from './secciones-sidebar/Validacion';
import { NotificationsPage } from '../common/Notification';

import { Sidebar } from '@/app/layout/Sidebar';
import { ComunaDiDashboard } from './secciones-sidebar/ComunaDiDashboard';
import { DashboardNavbar } from '../common/DashboardNavbar';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import { SoporteView } from '../common/SoporteView';
import { PerfilView } from '../common/PerfilView';
import { PlanificacionDireccion } from '../comundi/PlanificacionDireccion';

interface ComunasDireccionViewProps {
  user: any;
  onLogout: () => void;
}

export const ComunasDireccionView: React.FC<ComunasDireccionViewProps> = ({ user, onLogout }) => {
  const [activeSection, setActiveSection] = useState('dashboardP');
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [showProfile, setShowProfile] = useState(false);
  
  const { logout } = useAuth();
  const router = useRouter();
  
  // CORREGIDO: usar setActiveSection en lugar de setActiveTab
  const handleSetActiveSection = (section: string) => {
    setShowProfile(false);
    setActiveSection(section);
  };
  
  // Escuchar evento de navegación desde el navbar
  useEffect(() => {
    const handleNavigateToSection = (event: CustomEvent) => {
      const { section } = event.detail;
      if (section === 'perfil') {
        setShowProfile(true);
        setActiveSection('');
      } else if (section === 'dashboard') {
        setShowProfile(false);
        setActiveSection('dashboardP');
      } else if (section === 'notificaciones') {
        setShowProfile(false);
        setActiveSection('notificaciones');
      } else if (section) {
        setShowProfile(false);
        setActiveSection(section);
      }
    };

    window.addEventListener('navigateToSection', handleNavigateToSection as EventListener);

    // Manejar query params al cargar la página
    const searchParams = new URLSearchParams(window.location.search);
    const sectionParam = searchParams.get('section');
    if (sectionParam === 'perfil') {
      setShowProfile(true);
      setActiveSection('');
    } else if (sectionParam) {
      setShowProfile(false);
      setActiveSection(sectionParam);
    }

    return () => {
      window.removeEventListener('navigateToSection', handleNavigateToSection as EventListener);
    };
  }, []);

  const handleLogout = async () => {
    try {
      await logout();
      await onLogout();
      router.push('/login');
    } catch (error) {
      console.error("Error al cerrar sesión", error);
      window.location.href = '/login';
    }
  };

  const handleBackToDashboard = () => {
    setShowProfile(false);
    setActiveSection('dashboardP');
  };

  const renderContent = () => {
    switch (activeSection) {
      case 'dashboardP':
        return <ComunaDiDashboard user={user} />;
      case 'dim1':
        return <Dimen1 />;
      case 'dim2':
        return <Dimen2 />;
      case 'dim3':
        return <Dimen3 />;
      case 'dim4':
        return <Dimen4 />;
      case 'validacion':
        return <Validacion />;
      case 'ayuda':
        return <SoporteView  />;
      case 'notificaciones':
        return <NotificationsPage />;
        case 'planidirecc':
        return <PlanificacionDireccion />;
      default:
        return <ComunaDiDashboard user={user} />;
    }
  };

  return (
    <div className="flex h-screen bg-[#fcfdfe] font-sans overflow-hidden">
      <Sidebar 
        user={user}
        activeSection={activeSection}
        setActiveSection={handleSetActiveSection}
        isSidebarOpen={isSidebarOpen}
        setIsSidebarOpen={setIsSidebarOpen}
        isMobileMenuOpen={isMobileMenuOpen}
        setIsMobileMenuOpen={setIsMobileMenuOpen}
        onLogout={handleLogout}
        isCircuito={false}
      />

      <main className="flex-1 overflow-y-auto overflow-x-hidden pt-16 lg:pt-0">
        <DashboardNavbar 
          user={user}
          onMobileMenuOpen={() => setIsMobileMenuOpen(true)}
          onLogout={handleLogout}
          onNavigateToProfile={() => {
            setShowProfile(true);
            setActiveSection('');
          }}
          actions={undefined}
        />

        <div className="p-4 lg:p-8">
          <AnimatePresence mode="wait">
            {showProfile ? (
              <motion.div
                key="profile"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.3 }}
              >
                <PerfilView user={user} onBack={handleBackToDashboard} />
              </motion.div>
            ) : (
              <motion.div
                key={activeSection}
                initial={{ opacity: 0, x: 10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -10 }}
                transition={{ duration: 0.2 }}
              >
                {renderContent()}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </main>
    </div>
  );
};

