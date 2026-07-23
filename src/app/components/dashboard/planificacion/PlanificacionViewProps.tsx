'use client';

import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Settings, Map as MapIcon } from 'lucide-react';
import { useRouter } from 'next/navigation';

// Componentes internos
import { Dimen1 } from '../comundi/Dimen1';
import { Dimen2 } from '../comundi/Dimen2';
import { Dimen3 } from '../comundi/Dimen3';
import { Dimen4 } from '../comundi/Dimen4';
import { PlanificacionDireccion } from '../comundi/PlanificacionDireccion';
import { PlanificacionDashboard } from './secciones-sidebar/PlanificacionDashboard';
import { FormacionSection } from './secciones-sidebar/FormacionSectionProps';
import { Sidebar } from '@/app/layout/Sidebar';
import { DashboardNavbar } from '../common/DashboardNavbar';
import { PerfilView } from '../common/PerfilView';
import { NotificationsPage } from '../common/Notification';
import { SoporteView } from "../common/SoporteView";
import { useAuth } from '@/context/AuthContext';

interface PlanificacionViewProps {
  activeSection: string;
  user: any;
  onLogout: () => void;
}

export const PlanificacionView = ({ user, onLogout, activeSection: initialSection }: PlanificacionViewProps) => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [currentSection, setCurrentSection] = useState(initialSection || 'dashboardP');
  const [showProfile, setShowProfile] = useState(false);
  
  const { logout } = useAuth();
  const router = useRouter();
  const isMounted = useRef(true);

  // Marcar desmontaje
  useEffect(() => {
    isMounted.current = true;
    return () => {
      isMounted.current = false;
    };
  }, []);

  // Sincronizar sección activa desde props
  useEffect(() => {
    if (initialSection) {
      setCurrentSection(initialSection);
    }
  }, [initialSection]);

  // Escuchar eventos de navegación (para notificaciones, soporte, etc.)
  useEffect(() => {
    const handleNavigateToSection = (event: CustomEvent) => {
      // No procesar si el componente ya no está montado
      if (!isMounted.current) return;
      
      const { section } = event.detail;
      if (section === 'perfil') {
        setShowProfile(true);
        setCurrentSection('');
      } else if (section === 'dashboard') {
        setShowProfile(false);
        setCurrentSection('dashboardP');
      } else if (section) {
        setShowProfile(false);
        setCurrentSection(section);
      }
    };

    window.addEventListener('navigateToSection', handleNavigateToSection as EventListener);
    
    // Manejar parámetros de URL al cargar
    const searchParams = new URLSearchParams(window.location.search);
    const sectionParam = searchParams.get('section');
    if (sectionParam === 'perfil') {
      setShowProfile(true);
      setCurrentSection('');
    } else if (sectionParam) {
      setShowProfile(false);
      setCurrentSection(sectionParam);
    }

    return () => {
      window.removeEventListener('navigateToSection', handleNavigateToSection as EventListener);
    };
  }, []);

  const handleLogout = async () => {
    try {
      await logout();
      if (onLogout) onLogout();
      // Usar setTimeout para evitar el error de router no inicializado
      setTimeout(() => {
        if (isMounted.current) {
          // Fallback seguro: usar window.location si router falla
          try {
            router.push('/login');
          } catch (e) {
            window.location.href = '/login';
          }
        }
      }, 0);
    } catch (error) {
      console.error("Error al cerrar sesión", error);
      // Fallback de emergencia
      window.location.href = '/login';
    }
  };

  const handleNavigateToProfile = () => {
    setShowProfile(true);
    setCurrentSection('');
  };

  const handleBackToDashboard = () => {
    setShowProfile(false);
    setCurrentSection('dashboardP');
  };

  const handleSetActiveSection = (section: string) => {
    setShowProfile(false);
    setCurrentSection(section);
  };

  const renderContent = () => {
    switch (currentSection) {
      case 'dashboardP':
      case 'inicio':
        return <PlanificacionDashboard user={user} />;
      case 'dimenl':
        return <Dimen1 />;
      case 'formacion':
        return <FormacionSection />;
      case 'diment':
        return <Dimen3 />;
      case 'dimeng':
        return <Dimen4 />;
      case 'dimeni':
        return <Dimen2 />;
      case 'ayuda':
        return <SoporteView />;
      case 'notificaciones':
        return <NotificationsPage />;
        case 'planidirecc':
        return <PlanificacionDireccion />;
      default:
        return (
          <div className="flex flex-col items-center justify-center h-[60vh] text-slate-400">
            <Settings className="w-12 h-12 mb-4 animate-spin-slow opacity-20" />
            <p className="text-sm font-bold uppercase tracking-widest italic">
              Sección "{currentSection}" en desarrollo
            </p>
          </div>
        );
    }
  };

  return (
    <div className="min-h-screen w-screen h-dvh bg-[#fcfdfe] font-sans flex flex-col lg:flex-row overflow-hidden">
      {/* Sidebar */}
      <Sidebar 
        user={user}
        activeSection={currentSection}
        setActiveSection={handleSetActiveSection}
        isSidebarOpen={isSidebarOpen}
        setIsSidebarOpen={setIsSidebarOpen}
        isMobileMenuOpen={isMobileMenuOpen}
        setIsMobileMenuOpen={setIsMobileMenuOpen}
        onLogout={handleLogout}
      />

      {/* Contenedor Principal */}
      <div className="flex-1 flex flex-col min-h-0 overflow-hidden lg:min-h-screen">
        {/* Navbar */}
        <DashboardNavbar 
          user={user}
          title="Dirección de Planificación"
          subtitle=""
          onMobileMenuOpen={() => setIsMobileMenuOpen(true)}
          onLogout={handleLogout}
          onNavigateToProfile={handleNavigateToProfile}
          roleIcon={<MapIcon size={24} />}
        />

        {/* Área de contenido con animación entre perfil y secciones */}
        <main className="flex-1 min-h-0 overflow-y-auto bg-white p-4 lg:p-5">
          <div className="max-w-8xl mx-auto h-full">
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
                  key={currentSection}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ duration: 0.3 }}
                >
                  {renderContent()}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </main>
      </div>
    </div>
  );
};