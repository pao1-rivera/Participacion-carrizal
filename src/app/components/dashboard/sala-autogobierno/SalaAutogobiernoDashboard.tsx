import React, { useState, useEffect } from 'react';
import { 
  LayoutDashboard, 
  Map as MapIcon, 
  Users, 
  FileText, 
  ClipboardCheck, 
  MessageSquare, 
  Settings, 
  LogOut, 
  ChevronRight, 
  ChevronLeft,
  TrendingUp,
  AlertCircle,
  Clock,
  CheckCircle2,
  Package,
  Globe,
  Plus,
  ArrowUpRight,
  Filter,
  Search,
  Zap,
  Droplets,
  Shield,
  Briefcase,
  Heart,
  BookOpen,
  Wifi,
  MoreVertical,
  Activity,
  History,
  CloudUpload,
  Camera,
  Menu,
  ChevronDown,
  MapPin,
  Send,
  X
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/app/lib/utils';
import { useAuth } from '@/context/AuthContext';
import { Sidebar } from '@/app/layout/Sidebar';
import { SalaAutogobiernoData } from '@/types';
import { DashboardNavbar } from '../common/DashboardNavbar';
import { DashboardOverview } from './secciones-sidebar/DashboardOverview';
import { Gestion7T } from './secciones-sidebar/Gestion7T';
import { RedOrganizaciones } from './secciones-sidebar/RedOrganizaciones';
import { PlanificacionEstrategica } from './secciones-sidebar/PlanificacionEstrategica';
import { SeguimientoGestion } from './secciones-sidebar/SeguimientoGestion';
import { Comunicaciones } from './secciones-sidebar/Comunicaciones';
import { SoporteTecnico } from './secciones-sidebar/SoporteTecnico';

export const SalaAutogobiernoDashboard = ({ user, onLogout }: { user: any; onLogout: () => void }) => {
  const { logout } = useAuth();
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [modal, setModal] = useState<{ isOpen: boolean; type: 'form' | 'detail' | 'success'; title: string; data?: any }>({ isOpen: false, type: 'detail', title: '' });

  const openModal = (type: 'form' | 'detail' | 'success', title: string, data?: any) => {
    setModal({ isOpen: true, type, title, data });
  };

  const closeModal = () => setModal({ ...modal, isOpen: false });

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

  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard':
        return <DashboardOverview user={user} openModal={openModal} />;
      case 'sistematizacion':
      case 't1': case 't2': case 't3': case 't4': case 't5': case 't6': case 't7':
        return <Gestion7T area={activeTab} openModal={openModal} />;
      case 'organizaciones':
      case 'comunas':
      case 'consejos':
        return <RedOrganizaciones type={activeTab} openModal={openModal} />;
      case 'planificacion':
      case 'aca':
      case 'suenos':
        return <PlanificacionEstrategica type={activeTab} openModal={openModal} />;
      case 'seguimiento':
      case 'proyectos':
      case 'evidencias':
        return <SeguimientoGestion type={activeTab} openModal={openModal} />;
      case 'comunicaciones':
        return <Comunicaciones openModal={openModal} />;
      case 'soporte':
        return <SoporteTecnico />;
      default:
        return (
          <div className="flex items-center justify-center h-[calc(100vh-120px)]">
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
        onLogout={onLogout}
      />

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto overflow-x-hidden pt-16 lg:pt-0">
        <DashboardNavbar 
          user={user}
          title="Sala de Autogobierno"
          subtitle="GESTIÓN TERRITORIAL DE PROXIMIDAD"
          onMobileMenuOpen={() => setIsMobileMenuOpen(true)}
          roleIcon={<MapIcon size={24} />}
          actions={
            <button 
              onClick={() => openModal('form', 'Nueva Sistematización 7T', { area: activeTab })}
              className="flex items-center gap-2 px-4 py-2 bg-brand-primary text-white rounded-lg hover:bg-brand-primary/90 transition-all font-bold text-xs shadow-sm"
            >
                <ClipboardCheck size={16} />
                Sistematización
            </button>
          }
        />

        <div className="p-4 lg:p-8">
          {renderContent()}
        </div>
      </main>

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

const DashboardModal = ({ isOpen, onClose, type, title, data }: { isOpen: boolean, onClose: () => void, type: 'form' | 'detail' | 'success', title: string, data?: any }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
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
        className="bg-white rounded-[32px] w-full max-w-xl overflow-hidden shadow-2xl relative z-10 border border-slate-100"
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
                      className="w-full bg-slate-50 border border-slate-100 rounded-2xl p-4 text-xs font-medium focus:ring-2 focus:ring-brand-primary/20 outline-none min-h-[120px] transition-all italic" 
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
                        <select className="w-full bg-slate-50 border border-slate-100 rounded-xl p-3 text-xs font-medium focus:ring-2 focus:ring-brand-primary/20 outline-none transition-all italic font-bold">
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
