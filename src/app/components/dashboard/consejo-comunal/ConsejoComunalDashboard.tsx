"use client";

import React, { useState, useEffect, useCallback, useRef } from "react";
import { Sidebar } from "@/app/layout/Sidebar";
import { motion, AnimatePresence } from 'framer-motion';
import { useRouter } from 'next/navigation';
import { useAuth } from "@/context/AuthContext";
import { Users, X, CheckCircle } from "lucide-react";
import { supabase } from "@/app/lib/supabaseClient";
import { DashboardNavbar } from "../common/DashboardNavbar";
import { PerfilView } from "../common/PerfilView";
import { NotificationsPage } from "../common/Notification";

// Importación de las secciones
import { DashboardOverview } from "./secciones-sidebar/DashboardOverview";
import { VoceriaView } from "./secciones-sidebar/VoceriaView";
import { DatosLegalesView } from "./secciones-sidebar/DatosLegalesView";
import { CensoComunalView } from "./secciones-sidebar/CensoComunalView";
import { AcaView } from "./secciones-sidebar/AcaView";
import { NudosCriticosView } from "./secciones-sidebar/NudosCriticosView";
import { ProyectosView } from "./secciones-sidebar/ProyectosView";
import { AsambleasView } from "./secciones-sidebar/AsambleasView";
import { SoporteView } from "../common/SoporteView";
import { MapaSuenos } from "./secciones-sidebar/MapaSuenos";

type Section =
  | "inicio"
  | "vocerias"
  | "documentacion"
  | "censo"
  | "ubicacion"
  | "mapa_suenos"
  | "aca"
  | "nudos"
  | "proyectos"
  | "asambleas"
  | "soporte"
  | "perfil"
  | "notificaciones";

export const ConsejoComunalDashboard = ({ user, onLogout }: { user: any; onLogout: () => void }) => {
  const { logout } = useAuth();
  const navigate = useRouter();
  
  const [activeSection, setActiveSection] = useState<Section>("inicio");
  const [activeAction, setActiveAction] = useState<string | null>(null); 

  // Historial
  const [historyStack, setHistoryStack] = useState<Section[]>(["inicio"]);
  const [isPopState, setIsPopState] = useState(false);

  // Estado del sidebar - usar useRef para evitar re-renders innecesarios
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const isMobileRef = useRef(false);

  const [showWelcomeModal, setShowWelcomeModal] = useState(false);
  const [cargandoConsejo, setCargandoConsejo] = useState(true);
  const [consejoNombre, setConsejoNombre] = useState<string | null>(null);
  const [userForNavbar, setUserForNavbar] = useState<any>(user);

  useEffect(() => {
    const fetchConsejoNombre = async () => {
      if (!user?.id) {
        setCargandoConsejo(false);
        setConsejoNombre(null);
        return;
      }
      setCargandoConsejo(true); // empezamos la carga

      const { data: consejoData, error: idError } = await supabase
        .from('datos_consejo_comunal')
        .select('id_consejo')
        .or(`id_usuario.eq.${user.id},id_usuario_auxiliar.eq.${user.id}`)
        .maybeSingle();

      if (idError) {
        console.error('Error obteniendo id del consejo:', idError.message);
        setConsejoNombre(null);
        setCargandoConsejo(false);
        return;
      }
      if (!consejoData) {
        setConsejoNombre(null);
        setCargandoConsejo(false);
        return;
      }

      const { data: nombreData, error: nombreError } = await supabase
        .from('datos_consejo_comunal')
        .select('nombre_consejo')
        .eq('id_consejo', consejoData.id_consejo)
        .maybeSingle();

      if (nombreError) {
        console.error('Error obteniendo nombre del consejo:', nombreError.message);
        setConsejoNombre(null);
      } else if (nombreData) {
        setConsejoNombre(nombreData.nombre_consejo);
      } else {
        setConsejoNombre(null);
      }
      setCargandoConsejo(false); // fin de la carga
    };

    fetchConsejoNombre();
  }, [user?.id]);

  // Actualizar userForNavbar cuando cambie consejoNombre o el user original
  useEffect(() => {
    if (user) {
      setUserForNavbar({
        ...user,
        nombreConsejo: consejoNombre,
      });
    }
  }, [user, consejoNombre]);

  // Detectar si es móvil al inicio
  useEffect(() => {
    const checkMobile = () => {
      const isMobile = window.innerWidth < 1024;
      isMobileRef.current = isMobile;
      if (isMobile) {
        setIsSidebarOpen(false);
      } else {
        setIsSidebarOpen(true);
      }
    };
    
    checkMobile();
    
    const handleResize = () => {
      const isMobile = window.innerWidth < 1024;
      if (isMobile !== isMobileRef.current) {
        isMobileRef.current = isMobile;
        if (isMobile) {
          setIsSidebarOpen(false);
        } else {
          setIsSidebarOpen(true);
        }
      }
    };
    
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    if (user?.id) {
      const storageKey = `has_logged_in_before_${user.id}`;
      const hasLoggedInBefore = localStorage.getItem(storageKey);
      if (!hasLoggedInBefore) {
        setShowWelcomeModal(true);
      }
    }
  }, [user]);

  const handleCloseWelcomeModal = () => {
    if (user?.id) {
      localStorage.setItem(`has_logged_in_before_${user.id}`, "true");
    }
    setShowWelcomeModal(false);
  };

  const navigateTo = useCallback((section: Section, replace = false) => {
    setIsPopState(false);
    setActiveSection(section);
    updateHistory(section, replace);
  }, [historyStack]);

  const updateHistory = (section: Section, replace = false) => {
    if (isPopState) return; 
    
    const newStack = [...historyStack];
    
    if (replace && newStack.length > 0) {
      newStack[newStack.length - 1] = section;
    } else {
      newStack.push(section);
      if (newStack.length > 10) {
        newStack.shift();
      }
    }
    
    setHistoryStack(newStack);
    
    if (replace) {
      window.history.replaceState({ section }, '', window.location.href);
    } else {
      window.history.pushState({ section }, '', `${window.location.pathname}?section=${section}`);
    }
  };

  const handleSetActiveSection = (section: string) => {
    navigateTo(section as Section);
    setIsMobileMenuOpen(false); 
  };

  useEffect(() => {
    const handlePopState = (event: PopStateEvent) => {
      setIsPopState(true);
      const currentIndex = historyStack.length - 1;
      
      if (currentIndex > 0) {
        const previousSection = historyStack[currentIndex - 1];
        setActiveSection(previousSection);
      } else {
        setActiveSection("inicio");
      }
      
      setTimeout(() => setIsPopState(false), 100);
    };

    window.addEventListener('popstate', handlePopState);
    
    if (historyStack.length === 1) {
      window.history.replaceState({ section: 'inicio' }, '', window.location.href);
    }

    return () => {
      window.removeEventListener('popstate', handlePopState);
    };
  }, [historyStack]);

  useEffect(() => {
    const handleNavigateToSection = (e: any) => {
      const { section } = e.detail;
      if (section) {
        navigateTo(section as Section);
      }
    };

    window.addEventListener('navigateToSection', handleNavigateToSection);
    return () => window.removeEventListener('navigateToSection', handleNavigateToSection);
  }, [navigateTo]);

  useEffect(() => {
    const handleNavigateToNotifications = () => {
      navigateTo('notificaciones' as Section);
    };

    window.addEventListener('navigateToNotifications', handleNavigateToNotifications);
    return () => window.removeEventListener('navigateToNotifications', handleNavigateToNotifications);
  }, [navigateTo]);

  const handleLogout = () => {
    logout();
    navigate.push("/login");
  };

  const handleNavigateFromOverview = (section: string, action?: string) => {
    navigateTo(section as Section);
    if (action) setActiveAction(action);
  };

  return (
    <div className="flex bg-[#fcfdfe] min-h-screen relative">
      
      {/* Modal de Bienvenida (sin cambios) */}
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

              <div className="w-full h-48 relative bg-slate-100 overflow-hidden">
                <img src="/comuna.jpg" alt="Poder Popular Organizado" className="w-full h-full object-cover" />
                <div className="absolute inset-0 bg-linear-to-t from-slate-900/80 via-slate-900/25 to-transparent" />
                <div className="absolute bottom-4 left-6 text-white">
                  <h2 className="text-2xl font-bold">¡Bienvenido al Sistema de Gestión!</h2>
                </div>
              </div>

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
                      Esta es la primera vez que ingresas a la plataforma del 
                      <strong className="text-slate-800"> Poder Popular del Municipio Carrizal</strong>. 
                      A partir de este momento, tienes acceso total para coordinar censos comunitarios, 
                      gestionar proyectos de infraestructura, cargar asambleas de ciudadanos y reportar los nudos críticos de tu comunidad.
                    </p>
                  </div>
                </div>

                <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 text-left">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">Recomendaciones iniciales:</h4>
                  <ul className="text-xs text-slate-600 space-y-1.5 list-disc pl-4">
                    <li>Verifica que los datos de tu perfil y vocería asignada estén vigentes.</li>
                    <li>Completa la ubicación geográfica precisa de tu ámbito geográfico comunal.</li>
                    <li>Sincroniza tus actas constitutivas en la pestaña de documentación legal.</li>
                  </ul>
                </div>
              </div>

              <div className="px-6 py-4 bg-slate-50 border-t border-slate-100 flex justify-end">
                <button onClick={handleCloseWelcomeModal} className="w-full sm:w-auto bg-brand-primary hover:bg-brand-primary/90 text-white font-bold px-6 py-2.5 rounded-xl transition-all shadow-md active:scale-98 text-sm">
                  Comenzar Gestión
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <Sidebar 
        user={user}
        activeSection={activeSection}
        setActiveSection={handleSetActiveSection}
        isSidebarOpen={isSidebarOpen}
        setIsSidebarOpen={setIsSidebarOpen}
        isMobileMenuOpen={isMobileMenuOpen}
        setIsMobileMenuOpen={setIsMobileMenuOpen}
        onLogout={onLogout}
      />

      <main className="flex-1 w-full lg:max-w-[calc(100vw-64px)] overflow-hidden">
        <DashboardNavbar 
          user={userForNavbar}   // ← Pasamos el objeto enriquecido con nombreConsejo
          title={activeSection === "mapa_suenos" ? "Mapa de los Sueños" : 
                 activeSection === "perfil" ? "Mi Perfil" : 
                 activeSection === "notificaciones" ? "Centro de Notificaciones" :
                 activeSection.charAt(0).toUpperCase() + activeSection.slice(1)}
          subtitle={cargandoConsejo ? undefined : (consejoNombre || "⚠️ Sin consejo registrado - Complete datos legales")}
          hideRole={cargandoConsejo || !consejoNombre}   // ← oculta el rol mientras carga o si no hay consejo
          onMobileMenuOpen={() => setIsMobileMenuOpen(true)}
          onLogout={onLogout}
          onNavigateToProfile={() => navigateTo('perfil')}
          roleIcon={<Users size={24} />}
        />

        <div className="p-4 lg:p-10 max-w-7xl mx-auto space-y-8 pb-32">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeSection}
              initial={{ opacity: 0, x: 10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -10 }}
              transition={{ duration: 0.2 }}
            >
              {activeSection === "inicio" && (
                <DashboardOverview
                  user={user}
                  onNavigate={handleNavigateFromOverview}
                />
              )}
              {activeSection === "vocerias" && <VoceriaView />}
              {activeSection === "documentacion" && <DatosLegalesView />}
              {activeSection === "censo" && <CensoComunalView onNavigate={handleNavigateFromOverview}/>}
              {activeSection === "mapa_suenos" && <MapaSuenos />}
              {activeSection === "aca" && <AcaView />}
              {activeSection === "nudos" && <NudosCriticosView />}
              {activeSection === "proyectos" && <ProyectosView />}
              {activeSection === "asambleas" && <AsambleasView />}
              {activeSection === "soporte" && <SoporteView />}
              {activeSection === "perfil" && <PerfilView user={user} />}
              {activeSection === "notificaciones" && <NotificationsPage />}
            </motion.div>
          </AnimatePresence>
        </div>
      </main>
    </div>
  );
};

export default ConsejoComunalDashboard;