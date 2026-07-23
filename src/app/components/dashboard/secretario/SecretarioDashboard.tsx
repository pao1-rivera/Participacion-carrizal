import React, { useState, useEffect } from 'react';
import { Sidebar } from '@/app/layout/Sidebar';
import { DashboardNavbar } from '../common/DashboardNavbar';
import { SecretarioView } from './secciones-sidebar/SecretarioView';
import { PerfilView } from '../common/PerfilView'; // <-- Importar PerfilView
import { 
  Building2, Settings, 
  Filter, 
  ShieldAlert,
  Monitor
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import { GestionTerritorial } from './secciones-sidebar/GestionTerritorial';
import { SupervisionDirectores } from './secciones-sidebar/SupervisionDirectores';
import { GestionRecursos } from './secciones-sidebar/GestionRecursos';
import { HistoricoGestion } from './secciones-sidebar/GestionHistorica';
import { SoporteView } from '../common/SoporteView';
import { GestionInfraestructura } from './secciones-sidebar/GestionInfraestructura';
import { GestionProyecto } from './secciones-sidebar/GestionProyecto';
import { GestionMapa } from './secciones-sidebar/GestionMapa';
import { Seguimiento } from './secciones-sidebar/Seguimiento';

interface SecretarioDashboardProps {
  user: any;
  onLogout: () => void;
}

export const SecretarioDashboard: React.FC<SecretarioDashboardProps> = ({ user, onLogout }) => {
  const { logout } = useAuth();
  const router = useRouter();
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [selectedEje, setSelectedEje] = useState('Todos los Ejes');
  const [showProfile, setShowProfile] = useState(false); // <-- Estado para perfil

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

  const handleLogout = () => {
    if (logout) {
      logout();
      router.push('/login');
    }
    if (onLogout) {
      onLogout();
    }
  };

  // Función para navegar al perfil
  const handleNavigateToProfile = () => {
    setShowProfile(true);
    setActiveTab('perfil'); // Para mantener coherencia en la UI
  };

  // Función para cerrar el perfil (volver al dashboard)
  const handleCloseProfile = () => {
    setShowProfile(false);
    setActiveTab('dashboard');
  };

  const renderContent = () => {
    // Si está mostrando el perfil, renderizar PerfilView
    if (showProfile) {
      return <PerfilView user={user} />;
    }

    switch (activeTab) {
      case 'dashboard':
        return <SecretarioView user={user} selectedEje={selectedEje} />;
      case 'gestion_territorial':
        return <GestionTerritorial />;
      case 'supervision':
        return <SupervisionDirectores />;
      case 'proyectos_recursos':
        return <GestionRecursos />;
      case 'historico':
        return <HistoricoGestion />;
      case 'ayuda':
        return <SoporteView />;
      case 'infraestructura':
        return <GestionInfraestructura />;
      case 'territorio':
        return <GestionMapa />;
      case 'gestion':
        return <GestionProyecto />;
      case 'seguimiento':
        return <Seguimiento />;
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
        onLogout={handleLogout}
      />

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col pt-16 lg:pt-0 overflow-hidden">
        <DashboardNavbar 
          user={user}
          title="Secretario del Poder Popular"
          subtitle=""
          onMobileMenuOpen={() => setIsMobileMenuOpen(true)}
          onLogout={handleLogout}
          onNavigateToProfile={handleNavigateToProfile} // <-- Pasar la función
          roleIcon={<Building2 size={24} />}
        />

        {/* Dynamic Content Container */}
        <div className="flex-1 overflow-y-auto overflow-x-hidden p-6 lg:p-10 custom-scrollbar">
          {renderContent()}
        </div>
      </main>
    </div>
  );
};