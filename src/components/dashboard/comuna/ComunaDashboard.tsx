import React, { useState, useEffect } from 'react';
import { 
  Building2, 
  AlertCircle,
  CloudUpload
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../../context/AuthContext';
import { Sidebar } from '../../../layout/Sidebar';
import { DashboardNavbar } from '../common/DashboardNavbar';
import { RegisterComunaModal } from './RegisterComunaModal';

// --- Secciones Sidebar ---
import { DashboardOverview } from './secciones-sidebar/DashboardOverview';
import { OrganizacionSection } from './secciones-sidebar/OrganizacionSection';
import { AutogobiernoSection } from './secciones-sidebar/AutogobiernoSection';
import { PlanificacionSection } from './secciones-sidebar/PlanificacionSection';
import { GestionSection } from './secciones-sidebar/GestionSection';
import { SoporteSection } from './secciones-sidebar/SoporteSection';

export const ComunaDashboard: React.FC<{ user: any }> = ({ user }) => {
  const [activeSection, setActiveSection] = useState('inicio');
  const [isCircuito, setIsCircuito] = useState(true);
  const [isFinishingRegister, setIsFinishingRegister] = useState(false);
  const [registerStep, setRegisterStep] = useState(1);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const navigate = useNavigate();
  const { logout } = useAuth();

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

  useEffect(() => {
    const isFirstTime = localStorage.getItem('comuna_setup') === null;
    if (isFirstTime) {
      setIsFinishingRegister(true);
    }
  }, []);

  const handleFinishRegister = () => {
    localStorage.setItem('comuna_setup', 'true');
    setIsFinishingRegister(false);
  };

  const renderContent = () => {
    switch (activeSection) {
      case 'inicio':
        return (
          <DashboardOverview 
            user={user} 
            metrics={{ population: '3,450', fund: '$45,200', criticalNodes: '12' }}
            ccIntegration="8/10"
            vulnerabilityCount={5}
            onAction={(action: string) => console.log('Action:', action)}
          />
        );
      case 'territorio':
      case 'identificacion':
      case 'consejos':
      case 'comites':
        return <OrganizacionSection user={user} isCircuito={isCircuito} setIsCircuito={setIsCircuito} />;
      
      case 'parlamento':
      case 'banco':
      case 'circuitos':
        return <AutogobiernoSection subview={activeSection} isCircuito={isCircuito} setIsCircuito={setIsCircuito} />;

      case 'aca':
      case 'cartas':
        return <PlanificacionSection subview={activeSection} />;

      case 'inversion':
      case 'eps':
        return <GestionSection subview={activeSection} />;

      case 'ayuda':
        return <SoporteSection />;

      default:
        return (
          <div className="py-20 text-center space-y-6">
             <div className="h-16 w-16 bg-slate-100 rounded-3xl flex items-center justify-center text-slate-300 mx-auto">
                <AlertCircle className="h-8 w-8" />
             </div>
             <div>
                <h3 className="text-lg font-black text-slate-800 uppercase italic">Sección en proceso</h3>
                <p className="text-xs text-slate-400 font-bold uppercase tracking-widest mt-1">Estamos digitalizando esta área de gestión</p>
             </div>
          </div>
        );
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="flex bg-[#fcfdfe] min-h-screen relative overflow-hidden text-slate-800">
      <AnimatePresence>
        {isMobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setIsMobileMenuOpen(false)}
            className="fixed inset-0 z-[45] bg-slate-900/40 backdrop-blur-sm lg:hidden"
          />
        )}
      </AnimatePresence>

      <Sidebar 
        user={user}
        activeSection={activeSection}
        setActiveSection={setActiveSection}
        isSidebarOpen={isSidebarOpen}
        setIsSidebarOpen={setIsSidebarOpen}
        isMobileMenuOpen={isMobileMenuOpen}
        setIsMobileMenuOpen={setIsMobileMenuOpen}
        onLogout={handleLogout}
        isCircuito={isCircuito}
      />

      <main className="flex-1 w-full lg:max-w-[calc(100vw-80px)] overflow-hidden">
         <DashboardNavbar 
           user={user}
           title={isCircuito ? `Circuito: ${user.comunaName || 'Brisas'}` : `Comuna: ${user.comunaName || 'Brisas'}`}
           subtitle="CENTRAL DE OPERACIONES DE AUTOGOBIERNO"
           onMobileMenuOpen={() => setIsMobileMenuOpen(true)}
           roleIcon={<Building2 size={24} />}
           actions={
             <div className="flex items-center gap-3">
               <button className="flex items-center gap-2 px-4 py-2 bg-brand-primary/10 text-brand-primary rounded-xl hover:bg-brand-primary/20 transition-all font-bold text-[10px] uppercase shadow-sm border border-brand-primary/10">
                  <CloudUpload size={14} />
                  Sincronizar Patria
               </button>
             </div>
           }
         />

         <div className="p-4 lg:p-14 max-w-7xl mx-auto space-y-12 pb-32 min-h-screen">
            <AnimatePresence mode="wait">
               <motion.div
                  key={activeSection}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ duration: 0.3 }}
               >
                  {renderContent()}
               </motion.div>
            </AnimatePresence>
         </div>
      </main>

      <AnimatePresence>
         {isFinishingRegister && (
            <RegisterComunaModal 
               user={user}
               registerStep={registerStep}
               setRegisterStep={setRegisterStep}
               handleFinishRegister={handleFinishRegister}
            />
         )}
      </AnimatePresence>
    </div>
  );
};