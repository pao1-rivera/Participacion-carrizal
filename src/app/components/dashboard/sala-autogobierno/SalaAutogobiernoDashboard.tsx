"use client";

import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  LayoutDashboard, Map as MapIcon, Users, FileText, ClipboardCheck, 
  MessageSquare, Settings, LogOut, ChevronRight, ChevronLeft,
  TrendingUp, AlertCircle, Clock, CheckCircle2, Package, Globe,
  Plus, ArrowUpRight, Filter, Search, Zap, Droplets, Shield,
  Briefcase, Heart, BookOpen, Wifi, MoreVertical, Activity,
  History, CloudUpload, Camera, Menu, ChevronDown, MapPin,
  Send, X
} from 'lucide-react';
import { cn } from '@/app/lib/utils';
import { useAuth } from '@/context/AuthContext';
import { Sidebar } from '@/app/layout/Sidebar';
import { DashboardNavbar } from '../common/DashboardNavbar';
import { DashboardOverview } from './secciones-sidebar/DashboardOverview';
import { DatosL } from './secciones-sidebar/DatosL';
import { OrganizacionBase } from './secciones-sidebar/OrganizacionBase';
import { UbicacionG } from './secciones-sidebar/UbicacionG';
import { ACA } from './secciones-sidebar/ACA';
import { Validacion } from '../direcomunas/secciones-sidebar/Validacion';
import { Participacion } from './secciones-sidebar/Participacion';
import { Biblioteca } from './secciones-sidebar/Biblioteca';
import { SoporteView } from "../common/SoporteView";
import { useRouter } from 'next/navigation';
import { Infraestructura } from './secciones-sidebar/Infraestructura';
import { Adulto } from './secciones-sidebar/Adulto';
import { Digitalizacion } from './secciones-sidebar/Digitalizacion';
import { PerfilView } from '../common/PerfilView';
import { NotificationsPage } from '../common/Notification';
import { EPS } from './secciones-sidebar/EPS';

export const SalaAutogobiernoDashboard = ({ user, onLogout }: { user: any; onLogout: () => void }) => {
  const { logout } = useAuth();
  const router = useRouter();
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('inicio');
  const [showProfile, setShowProfile] = useState(false);
  const [historyStack, setHistoryStack] = useState<string[]>(['inicio']);
  const [isPopState, setIsPopState] = useState(false);
  const [modal, setModal] = useState<{ isOpen: boolean; type: 'form' | 'detail' | 'success'; title: string; data?: any }>({ 
    isOpen: false, 
    type: 'detail', 
    title: '' 
  });

  // Navegación con historial
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
      setActiveTab('inicio');
      updateHistory('inicio', replace);
    } else if (showProfile) {
      setShowProfile(false);
      setActiveTab(section);
      updateHistory(section, replace);
    } else {
      setActiveTab(section);
      updateHistory(section, replace);
    }
  }, [showProfile, updateHistory]);

  const handleNavigateToProfile = () => {
    setShowProfile(true);
    updateHistory('perfil');
  };

  const handleCloseProfile = () => {
    setShowProfile(false);
    setActiveTab('inicio');
    updateHistory('inicio', true);
  };

  // Responsive
  useEffect(() => {
    const handleResize = () => {
      setIsSidebarOpen(window.innerWidth >= 1024);
    };
    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // Historial de navegación
  useEffect(() => {
    const handlePopState = () => {
      setIsPopState(true);
      const currentIndex = historyStack.length - 1;
      if (currentIndex > 0) {
        const prevSection = historyStack[currentIndex - 1];
        if (prevSection === 'perfil') {
          setShowProfile(true);
        } else {
          setShowProfile(false);
          setActiveTab(prevSection);
        }
      } else {
        setShowProfile(false);
        setActiveTab('inicio');
      }
      setTimeout(() => setIsPopState(false), 100);
    };
    window.addEventListener('popstate', handlePopState);
    window.history.replaceState({ section: 'inicio' }, '', window.location.href);
    return () => window.removeEventListener('popstate', handlePopState);
  }, [historyStack]);

  // Escuchar eventos de navegación (para notificaciones)
  useEffect(() => {
    const handleNavigateToSection = (event: CustomEvent) => {
      const { section } = event.detail;
      if (section) {
        if (showProfile) setShowProfile(false);
        setActiveTab(section);
        updateHistory(section);
      }
    };
    window.addEventListener('navigateToSection', handleNavigateToSection as EventListener);
    return () => {
      window.removeEventListener('navigateToSection', handleNavigateToSection as EventListener);
    };
  }, [showProfile, updateHistory]);

  const openModal = (type: 'form' | 'detail' | 'success', title: string, data?: any) => {
    setModal({ isOpen: true, type, title, data });
  };

  const closeModal = () => setModal({ ...modal, isOpen: false });

  const renderContent = () => {
    switch (activeTab) {
      case 'inicio':
        return <DashboardOverview 
          user={user} 
          onNavigate={navigateTo} 
          openModal={openModal} 
        />;
      case 'datosl': 
        return <DatosL />;
      case 'ubicaciong': 
        return <UbicacionG onNavigate={navigateTo} />;
      case 'organizaciones': 
        return <OrganizacionBase onNavigate={navigateTo} />;
      case 'agendac':
        return <ACA onNavigate={navigateTo} />;
      case 'validaciond':
        return <Validacion />;
      case 'infraestructura':
        return <Infraestructura onNavigate={navigateTo} />;
      case 'plan':
        return <Participacion  />;
      case 'biblioteca':
        return <Biblioteca  />;
      case 'adulto':
        return <Adulto onNavigate={navigateTo} />;
      case 'digitalizacion':
        return <Digitalizacion onNavigate={navigateTo} />;
        case 'eps':
        return <EPS onNavigate={navigateTo} />;
      case 'soporte':
        return <SoporteView />;
        case 'notificaciones':  // <-- AGREGAR ESTE CASE
              return <NotificationsPage />;
      default:
        return (
          <div className="flex items-center justify-center h-[calc(100vh-80px)]">
            <div className="text-center">
              <div className="bg-gray-100 p-6 rounded-full w-20 h-20 flex items-center justify-center mx-auto mb-4">
                <Settings className="w-10 h-10 text-gray-400 animate-spin-slow" />
              </div>
              <h3 className="text-xl font-medium text-gray-900">Módulo en Desarrollo</h3>
              <p className="text-gray-500 max-w-sm mx-auto mt-2 italic shadow-xs">
                Estamos digitalizando este nudo crítico administrativo.
              </p>
            </div>
          </div>
        );
    }
  };

  const handleLogout = () => {
    if (logout) logout();
    if (onLogout) onLogout();
    router.push('/login');
  };

  return (
    <div className="flex h-screen bg-[#fcfdfe] font-sans overflow-hidden">
      <Sidebar 
        user={user}
        activeSection={activeTab}
        setActiveSection={navigateTo}
        isSidebarOpen={isSidebarOpen}
        setIsSidebarOpen={setIsSidebarOpen}
        isMobileMenuOpen={isMobileMenuOpen}
        setIsMobileMenuOpen={setIsMobileMenuOpen}
        onLogout={handleLogout}
      />

      <div className="flex-1 flex flex-col overflow-hidden">
        <DashboardNavbar 
          user={user}
          title="Sala de Autogobierno"
          subtitle=""
          onMobileMenuOpen={() => setIsMobileMenuOpen(true)}
          onLogout={handleLogout}
          onNavigateToProfile={handleNavigateToProfile}
          roleIcon={<MapIcon size={24} />}
        />

        <main className="flex-1 overflow-y-auto overflow-x-hidden p-4 lg:p-8">
          <AnimatePresence mode="wait">
            {showProfile ? (
              <motion.div
                key="profile"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.3 }}
                className="w-full min-h-[calc(100vh-80px)]"
              >
                <PerfilView user={user} />
              </motion.div>
            ) : (
              <motion.div
                key={activeTab}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.3 }}
                className="w-full min-h-[calc(100vh-80px)]"
              >
                {renderContent()}
              </motion.div>
            )}
          </AnimatePresence>
        </main>
      </div>

      {/* Modal (igual que antes) */}
      <DashboardModal 
        isOpen={modal.isOpen} 
        onClose={closeModal} 
        type={modal.type} 
        title={modal.title} 
        data={modal.data} 
      />
    </div>
  );
};

// Modal component (sin cambios)
const DashboardModal = ({ isOpen, onClose, type, title, data }: { 
  isOpen: boolean, 
  onClose: () => void, 
  type: 'form' | 'detail' | 'success', 
  title: string, 
  data?: any 
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-100 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm"
      />
      
      <motion.div
        initial={{ scale: 0.95, opacity: 0, y: 20 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        className="bg-white rounded-4xl w-full max-w-xl overflow-hidden shadow-2xl relative z-10 border border-slate-100"
      >
        <div className="p-8 border-b border-slate-50 flex items-center justify-between bg-slate-50/50">
          <div>
            <span className="text-[10px] font-black text-brand-primary uppercase tracking-[0.2em] mb-1 block leading-none">Módulo de Sala</span>
            <h3 className="text-xl font-black text-slate-800 uppercase italic leading-none">{title}</h3>
          </div>
          <button onClick={onClose} className="p-3 bg-white hover:bg-slate-100 rounded-2xl transition-colors text-slate-400">
            <X size={20} />
          </button>
        </div>

        <div className="p-8 max-h-[60vh] overflow-y-auto custom-scrollbar">
          {type === 'success' ? (
            <div className="text-center py-8">
              <div className="w-20 h-20 bg-emerald-50 text-emerald-500 rounded-full flex items-center justify-center mx-auto mb-6 shadow-sm border border-emerald-100">
                <CheckCircle2 size={40} />
              </div>
              <p className="text-slate-600 font-medium italic mb-2">{data?.message || 'Proceso completado exitosamente.'}</p>
              <p className="text-[10px] text-slate-400 uppercase font-black tracking-widest leading-none mt-4">Sincronizado con Central Regional</p>
            </div>
          ) : type === 'detail' ? (
            <div className="space-y-6">
              {data && Object.entries(data).map(([key, value]: [string, any]) => (
                <div key={key} className="p-4 bg-slate-50 rounded-2xl border border-slate-100 shadow-xs">
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none mb-2">{key}</p>
                  <p className="text-xs font-black text-slate-800 uppercase italic leading-tight">{String(value)}</p>
                </div>
              ))}
            </div>
          ) : (
            <form className="space-y-6" onSubmit={(e) => { e.preventDefault(); onClose(); }}>
              <div className="space-y-4">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block pl-2">Descripción del Avance</label>
                  <textarea 
                    className="w-full bg-slate-50 border border-slate-100 rounded-2xl p-4 text-xs font-medium focus:ring-2 focus:ring-brand-primary/20 outline-none min-h-30 transition-all italic" 
                    placeholder="Describa los logros alcanzados en este territorio..."
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block pl-2">Fecha de Acción</label>
                    <input type="date" className="w-full bg-slate-50 border border-slate-100 rounded-xl p-3 text-xs font-medium focus:ring-2 focus:ring-brand-primary/20 outline-none transition-all" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block pl-2">Porcentaje de Impacto</label>
                    <select className="w-full bg-slate-50 border border-slate-100 rounded-xl p-3 text-xs  focus:ring-2 focus:ring-brand-primary/20 outline-none transition-all italic font-bold">
                      <option>25% - Inicial</option>
                      <option>50% - Medio</option>
                      <option>75% - Avanzado</option>
                      <option>100% - Consolidado</option>
                    </select>
                  </div>
                </div>
              </div>
              <button type="submit" className="w-full py-4 bg-brand-primary text-white rounded-2xl font-black uppercase italic tracking-wider shadow-lg flex items-center justify-center gap-2 hover:scale-[1.02] active:scale-[0.98] transition-all">
                <Send size={18} /> Enviar a Sistematización Central
              </button>
            </form>
          )}
        </div>
      </motion.div>
    </div>
  );
};