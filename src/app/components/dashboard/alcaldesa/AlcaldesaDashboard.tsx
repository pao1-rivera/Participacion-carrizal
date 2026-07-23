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
  Clock,
  Zap,
  User
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/app/lib/utils';
import { UserBase } from '@/types';
import { DashboardNavbar } from '../common/DashboardNavbar';
import { useRouter } from 'next/navigation';
import { Sidebar } from '@/app/layout/Sidebar';
// Importación de todas las secciones
import { AlcaldeView } from './secciones-sidebar/AlcaldeView';
import { MapaInteractivo } from './secciones-sidebar/MapaInteractivo';
import { ZonasAtencion } from './secciones-sidebar/ZonasAtencion';
import { Las7Transformaciones } from './secciones-sidebar/Las7Transformaciones';
import { PorAprobar } from './secciones-sidebar/PorAprobar';
import { PorEjecutar } from './secciones-sidebar/PorEjecutar';
import { ImpactoInversion } from './secciones-sidebar/ImpactoInversion';
import { AdultoMayor } from './secciones-sidebar/AdultoMayor';
import { SaludEmergencias } from './secciones-sidebar/SaludEmergencia';
import { RendicionCuentas } from './secciones-sidebar/RendicionCuenta';
import { SoporteView } from '../common/SoporteView';
import { PerfilView } from '../common/PerfilView';

export const AlcaldesaDashboard = ({ 
  user, 
  onLogout
}: { 
  user: any; 
  onLogout: () => void;
}) => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [activeSection, setActiveSection] = useState('dashboard');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const router = useRouter();

  // Responsive handling
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

  const handleLogout = () => {
    onLogout();
    router.push('/login');
  };

  // Función para navegar a la sección de perfil
  const handleNavigateToProfile = () => {
    setActiveSection('perfil');
  };

  // Renderizado condicional según la sección activa
  const renderContent = () => {
    switch (activeSection) {
      case 'dashboard':
        return <AlcaldeView user={user} activeSection={activeSection} />;
      case 'mapa_interactivo':
        return <MapaInteractivo />;
      case 'zonas_atencion':
        return <ZonasAtencion />;
      case 'las_7t':
        return <Las7Transformaciones />;
      case 'por_aprobar':
        return <PorAprobar />;
      case 'en_ejecucion':
        return <PorEjecutar />;
      case 'impacto_inversion':
        return <ImpactoInversion />;
      case 'adulto_mayor':
        return <AdultoMayor />;
      case 'salud_emergencias':
        return <SaludEmergencias />;
      case 'rendicion':
        return <RendicionCuentas />;
      case 'soporte':
        return <SoporteView />;
      case 'perfil': // <-- Nuevo case para perfil
        return <PerfilView user={user} />;
      default:
        return <AlcaldeView user={user} activeSection={activeSection} />;
    }
  };

  return (
    <div className="flex h-screen bg-[#F8FAFC]">
      {/* Sidebar - recibe activeSection y setActiveSection para navegación */}
      <Sidebar
        user={user}
        activeSection={activeSection}
        setActiveSection={setActiveSection}
        isSidebarOpen={isSidebarOpen}
        setIsSidebarOpen={setIsSidebarOpen}
        isMobileMenuOpen={isMobileMenuOpen}
        setIsMobileMenuOpen={setIsMobileMenuOpen}
        onLogout={handleLogout}
      />

      {/* Contenido principal */}
      <main className="flex-1 flex flex-col overflow-hidden">
        <DashboardNavbar 
          user={user}
          title="Monitor Municipal 360°"
          subtitle={``}
          onMobileMenuOpen={() => setIsMobileMenuOpen(true)}
          onLogout={handleLogout}
          onNavigateToProfile={handleNavigateToProfile} // <-- Pasamos la función
          roleIcon={<Building2 size={24} />}
        />

        {/* Área de contenido dinámico */}
        <div className="flex-1 overflow-y-auto p-10 custom-scrollbar">
          <AnimatePresence mode="wait">
            {renderContent()}
          </AnimatePresence>
        </div>
      </main>
    </div>
  );
};