"use client";

import React, { useState, useEffect, useCallback } from 'react';
import { AlertCircle, X, CheckCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { Sidebar } from '@/app/layout/Sidebar';
import { supabase } from "@/app/lib/supabaseClient";
import { DashboardNavbar } from '../common/DashboardNavbar';
import { PerfilView } from '../common/PerfilView';
import { DashboardOverview } from './secciones-sidebar/DashboardOverview';
import { OrganizacionSection } from './secciones-sidebar/OrganizacionSection';
import { UbiComuna } from './secciones-sidebar/UbiComuna';
import { GestionSection } from './secciones-sidebar/GestionSection';
import { SoporteView } from "../common/SoporteView";
import { Consejosc } from './secciones-sidebar/Consejosc';
import { CensoComuna } from './secciones-sidebar/CensoComuna';
import { AgendaC } from './secciones-sidebar/AgendaC';
import { NudoCritico } from './secciones-sidebar/NudoCritico';
import { ProyectoC } from './secciones-sidebar/ProyectoC';
import { AsambleasC } from './secciones-sidebar/AsambleasC';
import { MapaSuenosC } from './secciones-sidebar/MapaSuenosC';
import { NotificationsPage } from "../common/Notification";

export const ComunaDashboard = ({ user, onLogout }: { user: any; onLogout: () => void }) => {
  const [activeSection, setActiveSection] = useState('inicio');
  const [showProfile, setShowProfile] = useState(false);
  const [isCircuito, setIsCircuito] = useState(true);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [showWelcomeModal, setShowWelcomeModal] = useState(false);
  const router = useRouter();
  const { logout } = useAuth();
  const [cargandoComuna, setCargandoComuna] = useState(true);
  const [comunaNombre, setComunaNombre] = useState<string | null>(null);
  const [userForNavbar, setUserForNavbar] = useState<any>(user);

  useEffect(() => {
    if (user) {
      setUserForNavbar({
        ...user,
        nombreComuna: comunaNombre,
      });
    }
  }, [user, comunaNombre]);

    useEffect(() => {
      const fetchComunaNombre = async () => {
        if (!user?.id) {
          setCargandoComuna(false);
          setComunaNombre(null);
          return;
        }
        setCargandoComuna(true);
        
        // Obtener id_comuna (dueño o auxiliar)
        const { data: comunaData, error: idError } = await supabase
          .from('datos_comuna')
          .select('id_comuna')
          .or(`id_usuario.eq.${user.id},id_usuario_auxiliar.eq.${user.id}`)
          .maybeSingle();
  
        if (idError) {
          console.error('Error obteniendo id de la comuna:', idError.message);
          setComunaNombre(null);
          setCargandoComuna(false);
          return;
        }
        if (!comunaData) {
          setComunaNombre(null);
          setCargandoComuna(false);
          return;
        }
  
        // Obtener el nombre de la comuna
        const { data: nombreData, error: nombreError } = await supabase
          .from('datos_comuna')
          .select('nombre_comuna')
          .eq('id_comuna', comunaData.id_comuna)
          .maybeSingle();
  
        if (nombreError) {
          console.error('Error obteniendo nombre de la comuna:', nombreError.message);
          setComunaNombre(null);
        } else if (nombreData) {
          setComunaNombre(nombreData.nombre_comuna);
        } else {
          setComunaNombre(null);
        }
        setCargandoComuna(false);
      };
  
      fetchComunaNombre();
    }, [user?.id]);

  // Historial
  const [historyStack, setHistoryStack] = useState<string[]>(['inicio']);
  const [isPopState, setIsPopState] = useState(false);

  // Verificar si es primera vez que el usuario ingresa
  useEffect(() => {
    if (user?.id) {
      const storageKey = `has_logged_in_before_comuna_${user.id}`;
      const hasLoggedInBefore = localStorage.getItem(storageKey);
      if (!hasLoggedInBefore) {
        setShowWelcomeModal(true);
      }
    }
  }, [user]);

  const handleCloseWelcomeModal = () => {
    if (user?.id) {
      localStorage.setItem(`has_logged_in_before_comuna_${user.id}`, "true");
    }
    setShowWelcomeModal(false);
  };

  // ========== FUNCIONES DE NAVEGACIÓN ==========
  const updateHistory = useCallback((section: string, replace = false) => {
    if (isPopState) return;
    setHistoryStack(prev => {
      const newStack = [...prev];
      if (replace && newStack.length > 0) {
        newStack[newStack.length - 1] = section;
      } else {
        newStack.push(section);
        if (newStack.length > 10) newStack.shift();
      }
      return newStack;
    });
    if (replace) {
      window.history.replaceState({ section }, '', window.location.href);
    } else {
      window.history.pushState({ section }, '', `${window.location.pathname}?section=${section}`);
    }
  }, [isPopState]);

  const navigateTo = useCallback((section: string, replace = false) => {
    setIsPopState(false);
    if (showProfile && section === 'inicio') {
      setShowProfile(false);
      setActiveSection('inicio');
      updateHistory('inicio', replace);
    } else if (showProfile) {
      setShowProfile(false);
      setActiveSection(section);
      updateHistory(section, replace);
    } else {
      setActiveSection(section);
      updateHistory(section, replace);
    }
  }, [showProfile, updateHistory]);

  // ========== EFECTOS ==========
  useEffect(() => {
    const handleResize = () => setIsSidebarOpen(window.innerWidth >= 1024);
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    const handlePopState = () => {
      setIsPopState(true);
      const currentIndex = historyStack.length - 1;
      if (currentIndex > 0) {
        const prevSection = historyStack[currentIndex - 1];
        setActiveSection(prevSection);
        setShowProfile(prevSection === 'perfil');
      } else {
        setActiveSection('inicio');
        setShowProfile(false);
      }
      setTimeout(() => setIsPopState(false), 100);
    };
    window.addEventListener('popstate', handlePopState);
    if (historyStack.length === 1) window.history.replaceState({ section: 'inicio' }, '', window.location.href);
    return () => window.removeEventListener('popstate', handlePopState);
  }, [historyStack]);

  // Escuchar eventos de navegación
  useEffect(() => {
    const handleNavigateToSection = (event: CustomEvent) => {
      const { section } = event.detail;
      if (section) {
        if (showProfile) setShowProfile(false);
        setActiveSection(section);
        updateHistory(section);
      }
    };
    const handleNavigateToNotifications = () => router.push('/dashboard/notificaciones');
    window.addEventListener('navigateToSection', handleNavigateToSection as EventListener);
    window.addEventListener('navigateToNotifications', handleNavigateToNotifications);
    return () => {
      window.removeEventListener('navigateToSection', handleNavigateToSection as EventListener);
      window.removeEventListener('navigateToNotifications', handleNavigateToNotifications);
    };
  }, [showProfile, updateHistory, router]);

  // Manejadores UI
  const handleCloseProfile = () => {
    setShowProfile(false);
    setActiveSection('inicio');
    updateHistory('inicio', true);
  };
  const handleNavigateToProfile = () => {
    setShowProfile(true);
    updateHistory('perfil');
  };
  const handleLogout = () => {
    logout();
    router.push('/login');
  };
  const handleNavigateFromSidebar = (section: string) => navigateTo(section);

  const renderContent = () => {
    switch (activeSection) {
      case 'inicio': return <DashboardOverview user={user} onNavigate={handleNavigateFromSidebar} />;
      case 'documentacion': return <OrganizacionSection />;
      case 'consejos': return <Consejosc />;
      case 'ubicacion': return <UbiComuna />;
      case 'consejopec': return <GestionSection />;
      case 'censo': return <CensoComuna />;
      case 'aca': return <AgendaC />;
      case 'nudos': return <NudoCritico />;
      case 'proyectos': return <ProyectoC />;
      case 'asambleas': return <AsambleasC />;
      case 'ayuda': return <SoporteView />;
      case 'mapa_suenos': return <MapaSuenosC />;
      case 'notificaciones':
  return <NotificationsPage />;
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

  return (
    <div className="flex bg-[#fcfdfe] min-h-screen relative overflow-hidden text-slate-800">
      {/* Modal de Bienvenida (Primera vez) */}
      <AnimatePresence>
        {showWelcomeModal && (
          <div className="fixed inset-0 z-100 flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={handleCloseWelcomeModal}
              className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="bg-white w-full max-w-2xl rounded-3xl shadow-2xl overflow-hidden relative z-10 border border-slate-100 flex flex-col"
            >
              {/* Encabezado */}
              <div className="bg-slate-50 px-6 py-4 border-b border-slate-100 flex items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                  <img src="/venezuela.png" alt="Venezuela" className="h-15 w-auto object-contain hidden sm:block" />
                  <div className="h-8 w-px bg-slate-300 hidden sm:block"></div>
                  <img src="/logo-alcaldia.png" alt="Alcaldía de Carrizal" className="h-12 w-auto object-contain" />
                </div>
                <button onClick={handleCloseWelcomeModal} className="p-1.5 rounded-xl hover:bg-slate-200/70 text-slate-400 hover:text-slate-600 transition-colors">
                  <X size={20} />
                </button>
              </div>

              {/* Imagen Banner */}
              <div className="w-full h-48 relative bg-slate-100 overflow-hidden">
                <img src="/comuna.jpg" alt="Poder Popular Organizado" className="w-full h-full object-cover" />
                <div className="absolute inset-0 bg-linear-to-t from-slate-900/80 via-slate-900/25 to-transparent" />
                <div className="absolute bottom-4 left-6 text-white">
                  <h2 className="text-2xl font-bold">¡Bienvenido a la Comuna!</h2>
                </div>
              </div>

              {/* Cuerpo del Mensaje */}
              <div className="p-6 sm:p-8 space-y-4 text-center sm:text-left">
                <div className="flex flex-col sm:flex-row items-center sm:items-start gap-4">
                  <div className="p-3 bg-emerald-50 rounded-2xl text-emerald-600 shrink-0">
                    <CheckCircle size={32} />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-slate-900 mb-1">
                      Hola, {user?.firstName || 'Vocero(a)'}
                    </h3>
                    <p className="text-slate-600 text-sm leading-relaxed">
                      Esta es la primera vez que ingresas al módulo de <strong className="text-slate-800">Comuna Carrizal</strong>. 
                      A partir de este momento, tienes acceso total para gestionar los consejos comunales, 
                      coordinar censos comunitarios, proyectos y las diferentes líneas de acción del poder popular.
                    </p>
                  </div>
                </div>

                <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 text-left">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">Recomendaciones iniciales:</h4>
                  <ul className="text-xs text-slate-600 space-y-1.5 list-disc pl-4">
                    <li>Verifica que los datos de tu perfil estén actualizados.</li>
                    <li>Completa la ubicación geográfica de tu ámbito comunal.</li>
                    <li>Carga los consejos comunales adscritos y sus datos legales.</li>
                    <li>Explora el mapa de los sueños y registra los nudos críticos.</li>
                  </ul>
                </div>
              </div>

              {/* Botón de Cierre */}
              <div className="px-6 py-4 bg-slate-50 border-t border-slate-100 flex justify-end">
                <button onClick={handleCloseWelcomeModal} className="w-full sm:w-auto bg-brand-primary hover:bg-brand-primary/90 text-white font-bold px-6 py-2.5 rounded-xl transition-all shadow-md active:scale-98 text-sm">
                  Comenzar Gestión
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {isMobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setIsMobileMenuOpen(false)}
            className="fixed inset-0 z-45 bg-slate-900/40 backdrop-blur-sm lg:hidden"
          />
        )}
      </AnimatePresence>

      <Sidebar
        user={user}
        activeSection={showProfile ? 'perfil' : activeSection}
        setActiveSection={handleNavigateFromSidebar}
        isSidebarOpen={isSidebarOpen}
        setIsSidebarOpen={setIsSidebarOpen}
        isMobileMenuOpen={isMobileMenuOpen}
        setIsMobileMenuOpen={setIsMobileMenuOpen}
        onLogout={handleLogout}
        isCircuito={isCircuito}
      />

      <main className="flex-1 w-full lg:max-w-[calc(100vw-64px)] overflow-hidden">
        <DashboardNavbar
          user={userForNavbar}
          subtitle={cargandoComuna ? undefined : (comunaNombre || "⚠️ SIN COMUNA REGISTRADA - COMPLETE DATOS LEGALES")}
          hideRole={cargandoComuna || !comunaNombre}
          onMobileMenuOpen={() => setIsMobileMenuOpen(true)}
          onLogout={handleLogout}
          onNavigateToProfile={handleNavigateToProfile}
        />

        <div className="p-1 lg:p-5 max-w-7xl mx-auto space-y-3 pb-32 min-h-screen">
          <AnimatePresence mode="wait">
            {showProfile ? (
              <motion.div
                key="profile"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.3 }}
                className="p-4 lg:p-8 w-full min-h-[calc(100vh-80px)]"
              >
                <PerfilView user={user} />
              </motion.div>
            ) : (
              <motion.div
                key={activeSection}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.3 }}
                className="p-4 lg:p-14 w-full min-h-[calc(100vh-80px)]"
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