import React, { useState, useEffect } from 'react';
import { 
  Building2, 
  Plus, 
  ArrowUpRight, 
  AlertCircle,
  CheckCircle2,
  FileText,
  Fingerprint,
  Target,
  Scale,
  Landmark,
  MapPin,
  Users,
  Save,
  CloudUpload
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '../../../lib/utils';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../../context/AuthContext';
import { Sidebar } from '../../../layout/Sidebar';
import { DashboardNavbar } from '../common/DashboardNavbar';

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
            <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
               <motion.div initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}} className="absolute inset-0 bg-slate-900/80 backdrop-blur-md" />
               <motion.div 
                 initial={{opacity:0, scale:0.95, y:40}} 
                 animate={{opacity:1, scale:1, y:0}} 
                 exit={{opacity:0, scale:0.95, y:40}}
                 className="relative w-full max-w-4xl bg-white rounded-[3rem] shadow-2xl overflow-hidden flex flex-col md:flex-row h-[85vh] md:h-auto md:max-h-[85vh]"
               >
                  <div className="w-full md:w-72 bg-slate-50 border-r border-slate-100 p-10 hidden md:flex flex-col">
                     <div className="flex-1 space-y-8">
                        <div>
                           <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-6">Pasos del Registro</h4>
                           <div className="space-y-6">
                              {[
                                { n: 1, label: 'Estructura e Instancias', id: 1 },
                                { n: 2, label: 'Agregación Territorial', id: 2 },
                                { n: 3, label: 'Instrumentos de Gestión', id: 3 },
                                { n: 4, label: 'Responsables de Carga', id: 4 }
                              ].map((s) => (
                                <div key={s.id} className="flex items-center gap-4 group">
                                   <div className={cn(
                                     "h-8 w-8 rounded-xl flex items-center justify-center text-[10px] font-black transition-all shadow-sm",
                                     registerStep === s.id ? "bg-brand-primary text-white" : 
                                     registerStep > s.id ? "bg-emerald-100 text-emerald-600" : "bg-white text-slate-300 border border-slate-100"
                                   )}>
                                      {registerStep > s.id ? <CheckCircle2 className="h-4 w-4" /> : s.n}
                                   </div>
                                   <span className={cn(
                                      "text-[10px] font-black uppercase tracking-tight",
                                      registerStep === s.id ? "text-brand-primary" : "text-slate-400"
                                   )}>{s.label}</span>
                                </div>
                              ))}
                           </div>
                        </div>
                     </div>
                     <div className="pt-8 border-t border-slate-200">
                        <p className="text-[8px] font-bold text-slate-400 uppercase tracking-widest">Alcaldía de Carrizal</p>
                        <p className="text-[9px] font-black text-slate-800 mt-1 italic">S. Participación Ciudadana</p>
                     </div>
                  </div>

                  <div className="flex-1 flex flex-col bg-white overflow-hidden">
                     <div className="p-10 border-b border-slate-50 flex items-center justify-between">
                        <div className="flex items-center gap-4">
                           <div className="h-12 w-12 rounded-2xl bg-brand-primary/10 text-brand-primary flex items-center justify-center">
                              <Building2 className="h-6 w-6" />
                           </div>
                           <div>
                              <h3 className="text-xl font-black text-slate-800 italic uppercase">Finalizar Registro de Comuna</h3>
                              <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mt-1 italic">Expediente Legal y de Gestión Territorial</p>
                           </div>
                        </div>
                     </div>

                     <div className="flex-1 p-10 overflow-y-auto custom-scrollbar">
                        {registerStep === 1 && (
                          <div className="space-y-10 animate-in fade-in slide-in-from-right-4 duration-300">
                             <div>
                                <h4 className="text-[11px] font-black text-brand-primary uppercase tracking-widest border-l-4 border-brand-primary pl-4 mb-6 italic">1. Documentación Legal y Fundacional</h4>
                                <div className="grid md:grid-cols-2 gap-6">
                                   <div className="space-y-2">
                                      <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Nombre de la Comuna</label>
                                      <input className="w-full p-4 rounded-2xl bg-slate-50 border-none ring-1 ring-slate-100 text-xs font-black uppercase outline-none focus:ring-brand-primary transition-all" value={user.comunaName || ''} readOnly />
                                   </div>
                                   <div className="space-y-2">
                                      <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest">RIF de la Comuna</label>
                                      <input className="w-full p-4 rounded-2xl bg-white border-none ring-1 ring-slate-100 text-xs font-bold outline-none focus:ring-brand-primary transition-all" placeholder="J-00000000-0" />
                                   </div>
                                   <div className="space-y-2 md:col-span-2 p-6 border-2 border-dashed border-slate-100 rounded-3xl text-center group hover:border-brand-primary/20 transition-all cursor-pointer">
                                      <FileText className="h-8 w-8 text-slate-200 mx-auto mb-3 group-hover:text-brand-primary transition-colors" />
                                      <p className="text-[10px] font-black text-slate-800 uppercase tracking-widest">Cargar Carta Fundacional (PDF)</p>
                                      <p className="text-[8px] text-slate-400 uppercase mt-1 font-bold italic tracking-tighter">Documento que oficializa la creación ante el Ministerio</p>
                                   </div>
                                </div>
                             </div>

                             <div>
                                <h4 className="text-[11px] font-black text-brand-primary uppercase tracking-widest border-l-4 border-brand-primary pl-4 mb-6 italic">2. Estructura de Gobierno (Instancias)</h4>
                                <div className="grid md:grid-cols-2 gap-4">
                                   <GovernmentCard icon={Fingerprint} title="Parlamento Comunal" detail="Listado de parlamentarios" status="Pendiente" />
                                   <GovernmentCard icon={Target} title="Consejo Planificación" detail="Desarrollo del territorio" status="Incompleto" />
                                   <GovernmentCard icon={Scale} title="Consejo Contraloría" detail="Vigilancia de recursos" status="Pendiente" />
                                   <GovernmentCard icon={Landmark} title="Consejo de Economía" detail="Unidades productivas" status="Pendiente" />
                                </div>
                             </div>
                          </div>
                        )}

                        {registerStep === 2 && (
                          <div className="space-y-10 animate-in fade-in slide-in-from-right-4 duration-300">
                             <div>
                                <h4 className="text-[11px] font-black text-brand-primary uppercase tracking-widest border-l-4 border-brand-primary pl-4 mb-6 italic">3. Registro de Agregación Territorial</h4>
                                <div className="space-y-6">
                                   <div className="space-y-2">
                                      <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Seleccionar Consejos Comunales Integrantes</label>
                                      <div className="p-6 rounded-3xl bg-slate-50 border border-slate-100 max-h-[200px] overflow-y-auto space-y-3">
                                         {['C.C. Brisas del Norte', 'C.C. El Trigo', 'C.C. Los Picapiedras', 'C.C. Sector 3', 'C.C. Casco Central'].map((cc, i) => (
                                           <div key={i} className="flex items-center justify-between p-3 rounded-xl bg-white border border-slate-100">
                                              <span className="text-[10px] font-black text-slate-800 uppercase italic leading-none">{cc}</span>
                                              <input type="checkbox" className="h-4 w-4 rounded border-slate-300 text-brand-primary focus:ring-brand-primary" />
                                           </div>
                                         ))}
                                      </div>
                                   </div>
                                   <div className="grid md:grid-cols-2 gap-6">
                                      <div className="p-6 rounded-3xl bg-indigo-50 border border-indigo-100">
                                         <p className="text-[8px] font-black text-indigo-400 uppercase tracking-widest leading-none">Censo Consolidado Automático</p>
                                         <div className="flex items-center justify-between mt-4">
                                            <div>
                                               <p className="text-xl font-black text-indigo-700 leading-none tracking-tighter">1,240</p>
                                               <p className="text-[8px] font-black text-indigo-400 uppercase mt-1">Personas registradas</p>
                                            </div>
                                            <div>
                                               <p className="text-xl font-black text-indigo-700 leading-none tracking-tighter">413</p>
                                               <p className="text-[8px] font-black text-indigo-400 uppercase mt-1">Familias</p>
                                            </div>
                                         </div>
                                      </div>
                                      <div className="space-y-2">
                                         <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Georreferenciación (Poligonal)</label>
                                         <div className="h-24 bg-slate-50 rounded-3xl border border-slate-100 flex items-center justify-center text-[10px] font-black text-slate-400 uppercase italic opacity-60">
                                            <MapPin className="h-4 w-4 mr-2" /> Dibujar en mapa
                                         </div>
                                      </div>
                                   </div>
                                </div>
                             </div>
                          </div>
                        )}

                        {registerStep === 3 && (
                          <div className="space-y-10 animate-in fade-in slide-in-from-right-4 duration-300">
                             <div className="grid md:grid-cols-2 gap-6">
                                <div className="p-8 border-2 border-dashed border-slate-100 rounded-[2.5rem] flex flex-col items-center text-center group hover:border-brand-primary/20 transition-all cursor-pointer">
                                   <div className="h-12 w-12 rounded-2xl bg-slate-50 text-slate-300 flex items-center justify-center mb-4 group-hover:bg-brand-primary group-hover:text-white transition-all shadow-sm">
                                      <AlertCircle className="h-6 w-6" />
                                   </div>
                                   <h5 className="text-[10px] font-black text-slate-800 uppercase tracking-widest italic">Cargar ACA Comunal</h5>
                                   <p className="text-[8px] text-slate-400 font-bold uppercase mt-1 italic tracking-tighter">Agenda Concreta de Acción (Proyectos consolidado)</p>
                                </div>
                                <div className="p-8 border-2 border-dashed border-slate-100 rounded-[2.5rem] flex flex-col items-center text-center group hover:border-brand-primary/20 transition-all cursor-pointer">
                                   <div className="h-12 w-12 rounded-2xl bg-slate-50 text-slate-300 flex items-center justify-center mb-4 group-hover:bg-brand-primary group-hover:text-white transition-all shadow-sm">
                                      <FileText className="h-6 w-6" />
                                   </div>
                                   <h5 className="text-[10px] font-black text-slate-800 uppercase tracking-widest italic">Cargar Cartas Comunales</h5>
                                   <p className="text-[8px] text-slate-400 font-bold uppercase mt-1 italic tracking-tighter">Leyes u Ordenanzas Internas</p>
                                </div>
                             </div>
                          </div>
                        )}

                        {registerStep === 4 && (
                           <div className="space-y-10 animate-in fade-in slide-in-from-right-4 duration-300">
                              <div className="max-w-md mx-auto space-y-6">
                                 <div className="text-center mb-10">
                                    <div className="h-20 w-20 rounded-[2.5rem] bg-emerald-50 text-emerald-500 flex items-center justify-center mx-auto mb-6 shadow-xl shadow-emerald-100/50">
                                       <Users className="h-10 w-10" />
                                    </div>
                                    <h4 className="text-xl font-black text-slate-800 uppercase tracking-tighter italic">Responsable de Carga</h4>
                                    <p className="text-[10px] text-slate-400 font-bold uppercase mt-1 italic tracking-widest">Vocero Sistematizador / Enlace Digital</p>
                                 </div>
                                 <div className="space-y-6">
                                    <div className="space-y-2">
                                       <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest italic">Nombre Completo</label>
                                       <input className="w-full p-4 rounded-2xl bg-slate-50 border-none ring-1 ring-slate-100 text-xs font-black uppercase outline-none focus:ring-brand-primary transition-all shadow-sm" value={`${user.firstName} ${user.lastName}`} readOnly />
                                    </div>
                                    <div className="space-y-2">
                                       <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest italic">Cédula de Identidad</label>
                                       <input className="w-full p-4 rounded-2xl bg-white border-none ring-1 ring-slate-100 text-xs font-bold outline-none focus:ring-brand-primary transition-all shadow-sm" placeholder="V-00.000.000" />
                                    </div>
                                    <div className="p-6 bg-amber-50 rounded-3xl border border-amber-100 flex gap-4">
                                       <AlertCircle className="h-5 w-5 text-amber-500 shrink-0" />
                                       <p className="text-[9px] font-bold text-amber-700 leading-relaxed uppercase italic tracking-tight">Al presionar finalizar, se enviará la validación a la Secretaría de Participación Ciudadana para la activación formal de la Comuna en el Sistema Digital.</p>
                                    </div>
                                 </div>
                              </div>
                           </div>
                        )}
                     </div>

                     <div className="p-10 bg-slate-50 border-t border-slate-100 flex items-center justify-between gap-6">
                        {registerStep > 1 && (
                          <button onClick={() => setRegisterStep(s => s - 1)} className="px-10 py-4 rounded-2xl border border-slate-200 text-[10px] font-black uppercase text-slate-400 tracking-widest hover:bg-white transition-all shadow-sm">Anterior</button>
                        )}
                        <div className="flex-1 flex justify-end">
                           {registerStep < 4 ? (
                             <button onClick={() => setRegisterStep(s => s + 1)} className="px-12 py-5 rounded-2xl bg-brand-primary text-white text-[10px] font-black uppercase tracking-[0.2em] shadow-2xl shadow-brand-primary/20 hover:scale-[1.02] active:scale-[0.98] transition-all">Siguiente Paso</button>
                           ) : (
                             <button onClick={handleFinishRegister} className="w-full md:w-auto px-16 py-5 rounded-cc bg-brand-primary text-white text-[10px] font-black uppercase tracking-[0.2em] shadow-2x shadow-brand-primary/20 hover:scale-[1.02] transition-all flex items-center justify-center gap-2">
                                <Save className="h-4 w-4" /> Finalizar y Enviar a Validación
                             </button>
                           )}
                        </div>
                     </div>
                  </div>
               </motion.div>
            </div>
         )}
      </AnimatePresence>
    </div>
  );
};

const GovernmentCard = ({ icon: Icon, title, detail, status }: any) => (
  <div className="p-5 rounded-3xl bg-slate-50/50 border border-slate-100 flex items-center gap-4 group hover:bg-white hover:shadow-xl hover:shadow-slate-200/20 transition-all cursor-pointer">
     <div className="h-10 w-10 rounded-2xl bg-white border border-slate-100 flex items-center justify-center text-slate-300 group-hover:text-brand-primary transition-colors shadow-sm">
        <Icon className="h-5 w-5" />
     </div>
     <div className="flex-1 min-w-0">
        <h5 className="text-[10px] font-black text-slate-800 uppercase italic truncate">{title}</h5>
        <p className="text-[8px] font-bold text-slate-400 uppercase truncate mt-0.5">{detail}</p>
     </div>
     <span className={cn(
       "text-[7px] font-black px-1.5 py-0.5 rounded uppercase tracking-tighter",
       status === 'Pendiente' ? "bg-amber-100 text-amber-700" : "bg-emerald-100 text-emerald-700"
     )}>{status}</span>
  </div>
);