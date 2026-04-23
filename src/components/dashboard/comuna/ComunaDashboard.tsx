import React, { useState, useEffect } from 'react';
import { 
  Building2, 
  Map as MapIcon, 
  Users, 
  Plus, 
  ArrowUpRight, 
  LayoutDashboard, 
  FileText, 
  Landmark, 
  Scale, 
  BarChart3, 
  ShieldCheck, 
  LifeBuoy, 
  ChevronRight,
  LogOut,
  Calendar,
  AlertCircle,
  Clock,
  Briefcase,
  CheckCircle2,
  X,
  Construction,
  Stethoscope,
  TrendingUp,
  Fingerprint,
  Info,
  MapPin,
  ClipboardList,
  Save,
  Target,
  Menu,
  Search,
  Filter,
  GraduationCap,
  Download,
  Upload,
  Eye,
  Settings,
  History as HistoryIcon
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '../../../lib/utils';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../../context/AuthContext';
import { DashboardNavbar } from '../common/DashboardNavbar';
import { 
  Heart,
  Droplets,
  BookOpen,
  Wifi,
  History,
  CloudUpload,
  Camera,
  Star,
  Users2,
  ListFilter,
  Check
} from 'lucide-react';

// --- Shared Components & Modals ---

const DashboardModal = ({ config, onClose }: any) => {
  const { type, data, title } = config;
  if (!config.isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" 
      />
      <motion.div 
        initial={{ scale: 0.9, opacity: 0, y: 20 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.9, opacity: 0, y: 20 }}
        className="relative bg-white w-full max-w-2xl rounded-[3rem] shadow-2xl overflow-hidden border border-slate-100"
      >
        <div className="p-8 border-b border-slate-50 flex items-center justify-between bg-slate-50/50">
           <div>
              <h3 className="text-xl font-black text-slate-800 uppercase italic leading-none">{title || 'Detalle de Gestión'}</h3>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-2">Módulo de Autogobierno Comunal</p>
           </div>
           <button onClick={onClose} className="h-10 w-10 rounded-2xl bg-white border border-slate-100 flex items-center justify-center text-slate-400 hover:text-rose-500 transition-colors">
              <X size={20} />
           </button>
        </div>
        
        <div className="p-10 max-h-[70vh] overflow-y-auto no-scrollbar">
           {type === 'detail' && (
             <div className="space-y-8">
                {Object.entries(data || {}).map(([key, value]: any) => (
                  <div key={key} className="flex justify-between items-center py-4 border-b border-slate-50 last:border-0">
                     <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest italic">{key.replace(/([A-Z])/g, ' $1')}</span>
                     <span className="text-sm font-black text-slate-800 uppercase italic">{String(value)}</span>
                  </div>
                ))}
                <div className="pt-6">
                   <button onClick={onClose} className="w-full py-4 bg-slate-800 text-white text-[10px] font-black uppercase tracking-[0.2em] rounded-2xl">Cerrar Ventana</button>
                </div>
             </div>
           )}

           {type === 'form' && (
             <div className="space-y-6">
                <div className="space-y-4">
                   {data?.fields?.map((field: any, i: number) => (
                     <div key={i} className="space-y-2">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">{field.label}</label>
                        <input 
                           type={field.type || 'text'}
                           placeholder={field.placeholder}
                           className="w-full h-14 bg-slate-50 border border-slate-100 rounded-2xl px-6 text-sm font-bold focus:ring-2 focus:ring-brand-primary outline-none transition-all"
                        />
                     </div>
                   ))}
                </div>
                <div className="pt-6 flex gap-4">
                   <button onClick={onClose} className="flex-1 py-4 border border-slate-100 text-[10px] font-black uppercase text-slate-400 rounded-2xl">Cancelar</button>
                   <button 
                     onClick={() => {
                        alert('Acción procesada con éxito');
                        onClose();
                     }}
                     className="flex-1 py-4 bg-brand-primary text-white text-[10px] font-black uppercase rounded-2xl shadow-xl shadow-brand-primary/20"
                   >
                      Confirmar {data?.action || 'Registro'}
                   </button>
                </div>
             </div>
           )}

           {type === 'success' && (
              <div className="py-12 text-center space-y-6">
                 <div className="h-20 w-20 rounded-full bg-emerald-50 text-emerald-500 flex items-center justify-center mx-auto ring-8 ring-emerald-50/50">
                    <CheckCircle2 size={40} />
                 </div>
                 <div className="space-y-2">
                    <h4 className="text-2xl font-black text-slate-800 uppercase italic">Operación Exitosa</h4>
                    <p className="text-xs text-slate-400 font-bold uppercase tracking-widest">{data?.message || 'Los cambios han sido guardados'}</p>
                 </div>
                 <button onClick={onClose} className="px-10 py-4 bg-slate-800 text-white text-[10px] font-black uppercase rounded-2xl">Entendido</button>
              </div>
           )}
        </div>
      </motion.div>
    </div>
  );
};

const SidebarItem = ({ icon: Icon, label, active, onClick, badge, subItems, isCollapsed }: any) => (
  <div className="space-y-1">
    <button
      onClick={onClick}
      className={cn(
        "w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-bold transition-all group",
        active
          ? "bg-brand-primary/10 text-brand-primary"
          : "text-slate-500 hover:bg-gray-50 hover:text-slate-800",
        isCollapsed && "justify-center px-2"
      )}
    >
      <Icon
        className={cn(
          "h-5 w-5 shrink-0 transition-transform group-hover:scale-110",
          active ? "text-brand-primary" : "text-slate-400",
        )}
      />
      {!isCollapsed && <span className="truncate">{label}</span>}
      {!isCollapsed && badge && (
        <span className={cn(
          "ml-auto px-1.5 py-0.5 rounded-md text-[8px] font-black uppercase",
          active ? "bg-brand-primary text-white" : "bg-slate-100 text-slate-400"
        )}>{badge}</span>
      )}
      {!isCollapsed && subItems && (
        <ChevronRight className={cn("ml-auto h-3 w-3 transition-transform", active && "rotate-90")} />
      )}
      {active && !isCollapsed && (
        <motion.div
          layoutId="activeNav"
          className="ml-auto w-1 h-4 rounded-full bg-brand-primary"
        />
      )}
    </button>
    {active && subItems && !isCollapsed && (
      <div className="ml-9 space-y-1 pt-1 border-l-2 border-brand-primary/10 pl-4 py-1 italic">
        {subItems.map((item: any, idx: number) => (
          <button
            key={idx}
            onClick={() => item.onClick()}
            className={cn(
              "flex w-full items-center gap-2 py-2 text-[9px] font-bold uppercase tracking-tight transition-all text-left",
              item.active ? "text-brand-primary" : "text-slate-400 hover:text-brand-primary"
            )}
          >
            <div className={cn("h-1 w-1 rounded-full", item.active ? "bg-brand-primary" : "bg-slate-200")} />
            {item.label}
          </button>
        ))}
      </div>
    )}
  </div>
);

// --- Territory and Social View ---

const LockedModule = ({ title, activeSection }: any) => (
  <div className="flex flex-col items-center justify-center py-20 px-10 bg-white rounded-[3rem] border-2 border-dashed border-slate-100 shadow-sm text-center space-y-8 animate-in fade-in duration-500">
    <div className="relative">
      <div className="h-24 w-24 rounded-full bg-slate-50 flex items-center justify-center text-slate-300">
        <ShieldCheck className="h-12 w-12" />
      </div>
      <div className="absolute -bottom-2 -right-2 h-10 w-10 bg-rose-500 rounded-2xl flex items-center justify-center text-white shadow-lg border-4 border-white">
        <AlertCircle className="h-5 w-5" />
      </div>
    </div>
    <div className="max-w-md space-y-4">
      <h3 className="text-2xl font-black text-slate-800 uppercase italic tracking-tighter leading-none">{title} Bloqueado</h3>
      <p className="text-[11px] text-slate-400 font-bold uppercase tracking-widest leading-relaxed">
        Esta sección es exclusiva para **Comunas Legalmente Constituidas**. Su organización actual se encuentra como **Circuito Comunal**.
      </p>
      <div className="pt-6">
        <div className="bg-amber-50 p-6 rounded-2xl border border-amber-100 flex items-center gap-4 text-left">
          <Info className="h-5 w-5 text-amber-500 shrink-0" />
          <p className="text-[9px] font-bold text-amber-700 uppercase italic leading-tight">
            Para habilitar este módulo, debe completar el proceso de transición en la sección de "Circuitos Comunales".
          </p>
        </div>
      </div>
    </div>
  </div>
);

const TerritorySocialView = ({ user, isCircuito, setIsCircuito, activeTab: initialTab, onTabChange, openModal }: any) => {
  const [activeTab, setActiveTab] = useState(initialTab === 'territorio' ? 'identificacion' : (initialTab || 'identificacion'));

  useEffect(() => {
    if (initialTab) {
      setActiveTab(initialTab === 'territorio' ? 'identificacion' : initialTab);
    }
  }, [initialTab]);

  const councils = [
    { name: 'C.C. Brisas del Norte', status: 'Vigente', vocero: 'Juan Pérez', families: 120 },
    { name: 'C.C. El Trigo', status: 'Vigente', vocero: 'María García', families: 85 },
    { name: 'C.C. Los Picapiedras', status: 'Vencido', vocero: 'Carlos Ruiz', families: 200 },
  ];

  const committees = [
    { area: 'Economía Productiva', count: 12, icon: Briefcase },
    { area: 'Salud y Prevención', count: 8, icon: Stethoscope },
    { area: 'Educación y Cultura', count: 5, icon: GraduationCap },
    { area: 'Servicios Públicos', count: 15, icon: Droplets },
  ];

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
        <div>
           <h2 className="text-2xl font-black text-slate-800 italic uppercase tracking-tighter leading-none">Territorio y Desarrollo Social</h2>
           <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-2 italic shadow-sm bg-white inline-block px-3 py-1 rounded-full border border-slate-50">Configuracion Estructural de la Comuna</p>
        </div>

        <div className="flex items-center gap-4 bg-white p-2 rounded-2xl border border-slate-100 shadow-sm">
          <button 
            onClick={() => setIsCircuito(true)}
            className={cn(
              "px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all",
              isCircuito ? "bg-brand-primary text-white shadow-lg shadow-brand-primary/20" : "text-slate-400 hover:text-slate-600"
            )}
          >
            Circuito
          </button>
          <button 
            onClick={() => setIsCircuito(false)}
            className={cn(
              "px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all",
              !isCircuito ? "bg-brand-primary text-white shadow-lg shadow-brand-primary/20" : "text-slate-400 hover:text-slate-600"
            )}
          >
            Comuna
          </button>
        </div>
      </div>

      <div className="flex gap-2 border-b border-slate-100 pb-px overflow-x-auto no-scrollbar">
        {['identificacion', 'consejos', 'comites', 'circuitos'].map((tab) => (
          <button
            key={tab}
            onClick={() => {
              setActiveTab(tab);
              onTabChange?.(tab);
            }}
            className={cn(
              "px-8 py-4 text-[10px] font-black uppercase tracking-widest transition-all relative border-b-2 whitespace-nowrap",
              activeTab === tab ? "border-brand-primary text-brand-primary" : "border-transparent text-slate-400 hover:text-slate-600"
            )}
          >
            {tab.replace('-', ' ')}
            {activeTab === tab && (
              <motion.div layoutId="activeTerritoryTab" className="absolute bottom-0 left-0 right-0 h-0.5 bg-brand-primary" />
            )}
          </button>
        ))}
      </div>

      <div className="mt-8">
        {activeTab === 'identificacion' && (
          <div className="grid lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 space-y-8">
              <div className="bg-white p-10 rounded-[3rem] border border-slate-100 shadow-xl shadow-slate-200/20">
                <div className="flex items-center gap-4 mb-10">
                   <div className="h-14 w-14 bg-brand-primary/10 text-brand-primary rounded-2xl flex items-center justify-center">
                      <Fingerprint className="h-7 w-7" />
                   </div>
                   <div>
                      <h3 className="text-xl font-black text-slate-800 uppercase italic">Expediente de Identificación</h3>
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Datos legales y administrativos</p>
                   </div>
                </div>

                <div className="grid md:grid-cols-2 gap-x-12 gap-y-8">
                  <div className="space-y-1.5">
                    <label className="text-[9px] font-black text-slate-400 uppercase tracking-[0.15em]">Nombre de la Organización</label>
                    <p className="text-sm font-black text-slate-700 uppercase italic border-b border-slate-50 pb-2">Comuna {user.comunaName || 'Brisas del Oriente'}</p>
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[9px] font-black text-slate-400 uppercase tracking-[0.15em]">Código SITUR / Registro</label>
                    <p className="text-sm font-black text-slate-700 uppercase italic border-b border-slate-50 pb-2">COM-2024-001</p>
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[9px] font-black text-slate-400 uppercase tracking-[0.15em]">Registro de Información Fiscal (RIF)</label>
                    <p className="text-sm font-black text-slate-700 uppercase italic border-b border-slate-50 pb-2">J-40345678-0</p>
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[9px] font-black text-slate-400 uppercase tracking-[0.15em]">Fecha de Constitución</label>
                    <p className="text-sm font-black text-slate-700 uppercase italic border-b border-slate-50 pb-2">15 DE MARZO 2024</p>
                  </div>
                </div>
              </div>

              <div className="bg-white p-10 rounded-[3rem] border border-slate-100 shadow-xl shadow-slate-200/20 relative overflow-hidden group">
                 <div className="absolute top-0 right-0 p-10 opacity-5 group-hover:scale-110 transition-transform">
                    <MapIcon className="h-40 w-40" />
                 </div>
                 <div className="relative z-10">
                    <h3 className="text-sm font-black text-slate-800 uppercase italic mb-8">Poligonal y Delimitación</h3>
                    <div className="h-64 bg-slate-50 rounded-[2rem] border-2 border-dashed border-slate-100 flex items-center justify-center">
                       <div className="text-center">
                          <MapIcon className="h-10 w-10 text-slate-200 mx-auto mb-4" />
                          <p className="text-[10px] font-black text-slate-400 uppercase italic">Cartografía en Proceso</p>
                          <button className="mt-4 px-6 py-2 rounded-xl border border-slate-200 text-[8px] font-black uppercase tracking-widest hover:bg-brand-primary hover:text-white transition-all">Digitalizar Mapas</button>
                       </div>
                    </div>
                 </div>
              </div>
            </div>

            <div className="space-y-8">
              <div className={cn(
                "p-8 rounded-[3rem] text-white shadow-2xl relative overflow-hidden",
                isCircuito ? "bg-slate-800" : "bg-emerald-600"
              )}>
                <div className="relative z-10">
                   <p className="text-[9px] font-black text-white/60 uppercase tracking-widest mb-4">Estatus Actual</p>
                   <h4 className="text-3xl font-black italic uppercase tracking-tighter leading-tight">
                     {isCircuito ? 'Circuito Comunal' : 'Comuna Constituida'}
                   </h4>
                   <p className="text-[10px] text-white/50 font-bold uppercase mt-4 italic leading-relaxed">
                     {isCircuito 
                       ? 'Fase de transición. Las instancias de Banco y Parlamento están en modo consulta.' 
                       : 'Organización legalmente registrada. Todas las funciones de gobierno están habilitadas.'
                     }
                   </p>
                   <div className="mt-8 flex items-center gap-3">
                      <div className={cn("h-3 w-3 rounded-full animate-pulse", isCircuito ? "bg-amber-400" : "bg-emerald-400")} />
                      <span className="text-[9px] font-black uppercase">Operatividad: {isCircuito ? '80%' : '100%'}</span>
                   </div>
                </div>
                <div className="absolute top-0 right-0 p-10 opacity-10">
                   <Building2 className="h-32 w-32" />
                </div>
              </div>

              <div className="bg-white p-8 rounded-[3rem] border border-slate-100 shadow-sm">
                <h3 className="text-xs font-black text-slate-800 uppercase italic mb-6">Instancias de Gobierno</h3>
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-4 rounded-2xl bg-slate-50 border border-slate-100">
                    <div className="flex items-center gap-3">
                      <Scale className="h-4 w-4 text-brand-primary" />
                      <span className="text-[10px] font-black uppercase">Parlamento</span>
                    </div>
                    {isCircuito ? (
                      <span className="text-[8px] font-black text-amber-500 uppercase px-2 py-0.5 rounded bg-amber-50 border border-amber-100">Cerrado</span>
                    ) : (
                      <Check className="h-4 w-4 text-emerald-500" />
                    )}
                  </div>
                  <div className="flex items-center justify-between p-4 rounded-2xl bg-slate-50 border border-slate-100">
                    <div className="flex items-center gap-3">
                      <Landmark className="h-4 w-4 text-brand-primary" />
                      <span className="text-[10px] font-black uppercase">Banco Comunal</span>
                    </div>
                    {isCircuito ? (
                      <span className="text-[8px] font-black text-amber-500 uppercase px-2 py-0.5 rounded bg-amber-50 border border-amber-100">Cerrado</span>
                    ) : (
                      <Check className="h-4 w-4 text-emerald-500" />
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'consejos' && (
          <div className="space-y-8">
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="bg-white p-8 rounded-3xl border border-slate-100 shadow-sm">
                 <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Total CC</p>
                 <h4 className="text-3xl font-black text-slate-800 italic mt-1 leading-none">12</h4>
              </div>
              <div className="bg-white p-8 rounded-3xl border border-slate-100 shadow-sm">
                 <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Vigentes</p>
                 <h4 className="text-3xl font-black text-emerald-500 italic mt-1 leading-none">8</h4>
              </div>
              <div className="bg-white p-8 rounded-3xl border border-slate-100 shadow-sm">
                 <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Vencidos</p>
                 <h4 className="text-3xl font-black text-rose-500 italic mt-1 leading-none">4</h4>
              </div>
              <div className="bg-brand-primary p-8 rounded-3xl text-white shadow-xl flex items-center justify-center">
                 <button className="text-[10px] font-black uppercase tracking-widest hover:scale-105 transition-all">Sincronizar SITUR</button>
              </div>
            </div>

            <div className="bg-white rounded-[3rem] border border-slate-100 overflow-hidden shadow-xl shadow-slate-200/10">
              <div className="px-10 py-6 border-b border-slate-50 bg-slate-50/30 flex items-center justify-between">
                <h3 className="text-sm font-black text-slate-800 uppercase italic">Directorio de Consejos Comunales</h3>
                <div className="flex items-center gap-4 text-slate-400">
                  <Search className="h-4 w-4" />
                  <Filter className="h-4 w-4" />
                </div>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead>
                    <tr className="border-b border-slate-50">
                      <th className="px-10 py-5 text-[9px] font-black text-slate-400 uppercase italic tracking-[0.15em]">Consejo Comunal</th>
                      <th className="px-10 py-5 text-[9px] font-black text-slate-400 uppercase italic tracking-[0.15em]">Vocería Responsable</th>
                      <th className="px-10 py-5 text-[9px] font-black text-slate-400 uppercase italic tracking-[0.15em]">Estatus</th>
                      <th className="px-10 py-5 text-[9px] font-black text-slate-400 uppercase italic tracking-[0.15em]">Familias</th>
                      <th className="px-10 py-5 text-[9px] font-black text-slate-400 uppercase italic tracking-[0.15em] text-right">Ficha</th>
                    </tr>
                  </thead>
                  <tbody>
                    {councils.map((cc, i) => (
                      <tr key={i} className="border-b border-slate-50 last:border-0 hover:bg-slate-50/50 transition-colors group">
                        <td className="px-10 py-6">
                           <span className="text-xs font-black text-slate-800 uppercase italic leading-none group-hover:text-brand-primary transition-colors">{cc.name}</span>
                        </td>
                        <td className="px-10 py-6">
                           <span className="text-[10px] font-bold text-slate-500 uppercase">{cc.vocero}</span>
                        </td>
                        <td className="px-10 py-6">
                           <div className={cn(
                             "inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[8px] font-black uppercase tracking-tight ring-1 ring-inset",
                             cc.status === 'Vigente' ? "bg-emerald-50 text-emerald-600 ring-emerald-100" : "bg-rose-50 text-rose-600 ring-rose-100"
                           )}>
                              <div className={cn("h-1 w-1 rounded-full", cc.status === 'Vigente' ? "bg-emerald-500" : "bg-rose-500")} />
                              {cc.status}
                           </div>
                        </td>
                        <td className="px-10 py-6">
                           <span className="text-xs font-black text-slate-800">{cc.families}</span>
                        </td>
                        <td className="px-10 py-6 text-right">
                           <button 
                             onClick={() => openModal('detail', 'Detalle de Consejo Comunal', cc)}
                             className="text-[10px] font-black text-brand-primary uppercase underline italic"
                           >
                             Ver Detalle
                           </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'comites' && (
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {committees.map((comite, index) => (
              <div key={index} className="bg-white p-10 rounded-[3rem] border border-slate-100 shadow-xl shadow-slate-200/10 group hover:-translate-y-2 transition-all">
                <div className="h-16 w-16 bg-brand-primary/5 text-brand-primary rounded-[1.5rem] flex items-center justify-center mb-8 group-hover:bg-brand-primary group-hover:text-white transition-all shadow-sm">
                   <comite.icon className="h-8 w-8" />
                </div>
                <h4 className="text-[11px] font-black text-slate-800 uppercase italic tracking-widest leading-tight mb-2">{comite.area}</h4>
                <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">{comite.count} Vocerías integradas</p>
                <div className="mt-8 pt-6 border-t border-slate-50 flex items-center justify-between">
                   <button 
                     onClick={() => openModal('detail', 'Miembros del Comité', { Area: comite.area, Integrantes: 'Vocero Principal, Vocero Suplente, Vocero de Apoyo', Estatus: 'Vigente' })}
                     className="text-[8px] font-black text-brand-primary uppercase italic underline"
                   >
                     Ver Miembros
                   </button>
                   <div className="flex -space-x-2">
                      {[1, 2, 3].map(i => (
                        <div key={i} className="h-6 w-6 rounded-full border-2 border-white bg-slate-200" />
                      ))}
                   </div>
                </div>
              </div>
            ))}
            <div 
              onClick={() => openModal('form', 'Registrar Nuevo Comité', { fields: [{ label: 'Nombre del Comité', placeholder: 'Ej. Comité de Tierras' }, { label: 'Vocero Responsable', placeholder: 'Nombre del vocero' }], action: 'Registrar' })}
              className="bg-slate-50 p-10 rounded-[3rem] border-2 border-dashed border-slate-200 flex flex-col items-center justify-center text-center group hover:border-brand-primary transition-all cursor-pointer"
            >
               <Plus className="h-10 w-10 text-slate-300 group-hover:text-brand-primary mb-4" />
               <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest italic group-hover:text-brand-primary">Nuevo Comité</p>
            </div>
          </div>
        )}

        {activeTab === 'circuitos' && (
          <div className="space-y-8 animate-in slide-in-from-bottom-4 duration-500">
            <div className="bg-white p-10 lg:p-20 rounded-[4rem] border border-slate-100 shadow-2xl shadow-slate-200/20 text-center relative overflow-hidden">
               <div className="absolute top-0 right-0 p-12 opacity-[0.03] scale-150 rotate-12">
                 <ShieldCheck className="h-96 w-96" />
               </div>
               
               <div className="relative z-10 max-w-2xl mx-auto space-y-10">
                  <div className="h-24 w-24 rounded-[2.5rem] bg-brand-primary/10 text-brand-primary flex items-center justify-center mx-auto shadow-xl shadow-brand-primary/10">
                     <Building2 className="h-12 w-12" />
                  </div>
                  
                  <div>
                    <h3 className="text-3xl font-black text-slate-800 uppercase italic tracking-tighter leading-none">Gestión de Estatus Territorial</h3>
                    <p className="text-xs text-slate-400 font-bold uppercase tracking-[0.2em] mt-4 italic">Transición de Circuito a Comuna Constituida</p>
                  </div>

                  <div className="grid grid-cols-2 gap-6 p-4 bg-slate-50 rounded-[2.5rem] border border-slate-100">
                    <button 
                      onClick={() => setIsCircuito(true)}
                      className={cn(
                        "p-10 rounded-[2rem] transition-all flex flex-col items-center gap-4 group relative",
                        isCircuito ? "bg-white shadow-xl ring-2 ring-brand-primary/20" : "opacity-40 grayscale hover:grayscale-0 hover:opacity-100"
                      )}
                    >
                      <div className={cn("h-12 w-12 rounded-2xl flex items-center justify-center", isCircuito ? "bg-brand-primary text-white" : "bg-slate-200 text-slate-400")}>
                        <History className="h-6 w-6" />
                      </div>
                      <span className="text-[10px] font-black uppercase tracking-widest">Circuito Comunal</span>
                      {isCircuito && <div className="absolute top-4 right-4 h-2 w-2 rounded-full bg-brand-primary animate-pulse" />}
                    </button>

                    <button 
                      onClick={() => setIsCircuito(false)}
                      className={cn(
                        "p-10 rounded-[2rem] transition-all flex flex-col items-center gap-4 group relative",
                        !isCircuito ? "bg-white shadow-xl ring-2 ring-emerald-500/20" : "opacity-40 grayscale hover:grayscale-0 hover:opacity-100"
                      )}
                    >
                      <div className={cn("h-12 w-12 rounded-2xl flex items-center justify-center", !isCircuito ? "bg-emerald-500 text-white" : "bg-slate-200 text-slate-400")}>
                        <CheckCircle2 className="h-6 w-6" />
                      </div>
                      <span className="text-[10px] font-black uppercase tracking-widest">Comuna Constituida</span>
                      {!isCircuito && <div className="absolute top-4 right-4 h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />}
                    </button>
                  </div>

                  <div className="p-8 rounded-[2rem] bg-indigo-50/50 border border-indigo-100 text-left">
                    <h4 className="text-[10px] font-black text-indigo-700 uppercase tracking-widest mb-4 flex items-center gap-2">
                      <Scale className="h-4 w-4" /> Impacto en el Autogobierno
                    </h4>
                    <ul className="space-y-3">
                       <li className="flex items-center gap-3 text-[9px] font-bold text-indigo-600 uppercase italic">
                          <div className={cn("h-1.5 w-1.5 rounded-full", isCircuito ? "bg-amber-400" : "bg-emerald-400")} />
                          Parlamento Comunal: {isCircuito ? 'Solo Consulta' : 'Habilitado - Toma de Decisiones'}
                       </li>
                       <li className="flex items-center gap-3 text-[9px] font-bold text-indigo-600 uppercase italic">
                          <div className={cn("h-1.5 w-1.5 rounded-full", isCircuito ? "bg-amber-400" : "bg-emerald-400")} />
                          Banco de la Comuna: {isCircuito ? 'Restringido' : 'Habilitado - Manejo de Recursos'}
                       </li>
                    </ul>
                  </div>

                  <p className="text-[8px] text-slate-400 font-bold uppercase italic mt-6">
                    * El cambio de estatus requiere validación previa mediante acta del parlamento y registro en SITUR.
                  </p>
               </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

// --- Instancias de Gobierno (Autogobierno) View ---

const InstanciasView = ({ user, isCircuito, activeTab: initialTab, onTabChange, openModal }: any) => {
  const [activeTab, setActiveTab] = useState(initialTab === 'autogobierno' ? 'parlamento' : (initialTab || 'parlamento'));

  useEffect(() => {
    if (initialTab) {
      setActiveTab(initialTab === 'autogobierno' ? 'parlamento' : initialTab);
    }
  }, [initialTab]);

  if (isCircuito && (activeTab === 'parlamento' || activeTab === 'banco' || activeTab === 'contraloria')) {
    return <LockedModule title={activeTab === 'parlamento' ? "Parlamento Comunal" : activeTab === 'banco' ? "Banco de la Comuna" : "Consejo de Contraloría"} activeSection={activeTab} />;
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
        <div>
           <h2 className="text-2xl font-black text-slate-800 italic uppercase tracking-tighter leading-none">Instancias de Autogobierno</h2>
           <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-2 italic shadow-sm bg-white inline-block px-3 py-1 rounded-full border border-slate-50">Estructura de Poder Popular y Gestion Fiannciera</p>
        </div>
      </div>

      <div className="flex gap-2 border-b border-slate-100 pb-px overflow-x-auto no-scrollbar">
        {['parlamento', 'banco', 'contraloria', 'censos'].map((tab) => (
          <button
            key={tab}
            onClick={() => {
              setActiveTab(tab);
              onTabChange?.(tab);
            }}
            className={cn(
              "px-8 py-4 text-[10px] font-black uppercase tracking-widest transition-all relative border-b-2 whitespace-nowrap",
              activeTab === tab ? "border-brand-primary text-brand-primary" : "border-transparent text-slate-400 hover:text-slate-600"
            )}
          >
            {tab === 'censos' ? 'Consolidado de Censos' : tab.replace('-', ' ')}
            {activeTab === tab && (
              <motion.div layoutId="activeInstanciasTab" className="absolute bottom-0 left-0 right-0 h-0.5 bg-brand-primary" />
            )}
          </button>
        ))}
      </div>

      <div className="mt-8">
        {activeTab === 'parlamento' && <ParlamentoView openModal={openModal} />}
        {activeTab === 'banco' && <BancoView openModal={openModal} />}
        {activeTab === 'contraloria' && <ContraloriaView openModal={openModal} />}
        {activeTab === 'censos' && <CensosConsolidadoView councilsCount={8} totalFamilies={2450} totalPop={7800} openModal={openModal} />}
      </div>
    </div>
  );
};

const ParlamentoView = ({ openModal }: any) => (
  <div className="space-y-8 animate-in slide-in-from-right-4 duration-500">
    <div className="grid lg:grid-cols-3 gap-8">
      <div className="lg:col-span-2 space-y-8">
        <div className="bg-white p-8 rounded-[3rem] border border-slate-100 shadow-xl shadow-slate-200/10">
          <div className="flex items-center justify-between mb-8">
            <h3 className="text-sm font-black text-slate-800 uppercase italic">Registro de Voceros Parlamentarios</h3>
            <button 
              onClick={() => openModal('form', 'Actualizar Vocería', { fields: [{ label: 'Nombre Completo', placeholder: 'Nombre del vocero' }, { label: 'Cédula', placeholder: 'V-00000000' }], action: 'Actualizar' })}
              className="px-4 py-2 bg-brand-primary text-white text-[10px] font-black uppercase rounded-xl shadow-lg shadow-brand-primary/20"
            >
              Actualizar Vocería
            </button>
          </div>
          <div className="space-y-4">
            {[1, 2, 3, 4].map(i => (
              <div 
                key={i} 
                onClick={() => openModal('detail', 'Detalle de Vocero Parlamentario', { Nombre: `Parlamentario ${i}`, Rol: 'Principal', Comuna: 'Brisas del Norte', Estatus: 'Activo' })}
                className="flex items-center gap-4 p-4 rounded-2xl bg-slate-50 border border-slate-100 group hover:bg-white transition-all cursor-pointer"
              >
                <div className="h-12 w-12 rounded-xl bg-white border border-slate-100 flex items-center justify-center text-slate-400">
                  <Users2 size={24} />
                </div>
                <div className="flex-1">
                  <p className="text-xs font-black text-slate-800 uppercase italic">Parlamentario {i}</p>
                  <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">C.C. Brisas del Norte • Principal</p>
                </div>
                <div className="h-2 w-2 rounded-full bg-emerald-500 shadow-lg shadow-emerald-500/20" />
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white p-8 rounded-[3rem] border border-slate-100 shadow-xl shadow-slate-200/10">
          <div className="flex items-center justify-between mb-8">
            <h3 className="text-sm font-black text-slate-800 uppercase italic">Actas de Sesiones</h3>
            <div className="flex gap-2">
              <button 
                onClick={() => openModal('form', 'Buscar Actas', { fields: [{ label: 'Número de Acta', placeholder: 'Ej. 024' }, { label: 'Fecha Aproximada', type: 'date' }], action: 'Buscar' })}
                className="p-2 bg-slate-50 border border-slate-100 rounded-xl text-slate-400 hover:text-brand-primary"
              >
                <Search size={16} />
              </button>
              <button 
                onClick={() => openModal('form', 'Nueva Acta de Sesión', { fields: [{ label: 'Título de la Sesión', placeholder: 'Ej. Aprobación de Fondos' }, { label: 'Resumen', placeholder: 'Puntos clave' }], action: 'Guardar' })}
                className="px-4 py-2 bg-slate-800 text-white text-[10px] font-black uppercase rounded-xl"
              >
                Nueva Acta
              </button>
            </div>
          </div>
          <div className="grid sm:grid-cols-2 gap-4">
            {[1, 2, 3, 4].map(i => (
               <div 
                 key={i} 
                 onClick={() => openModal('detail', 'Detalle de Acta', { Numero: `0${24-i}`, Tema: 'Aprobación de Fondo Comunal', Fecha: '15 MAY 2024', Asistentes: '12 Voceros' })}
                 className="p-6 rounded-3xl bg-slate-50 border border-slate-100 group hover:border-brand-primary transition-all cursor-pointer"
               >
                  <FileText className="h-6 w-6 text-slate-300 mb-4 group-hover:text-brand-primary" />
                  <h4 className="text-[10px] font-black text-slate-800 uppercase italic mb-1">Acta Sesión #0{24-i}</h4>
                  <p className="text-[8px] font-bold text-slate-400 uppercase">Aprobación de Fondo Comunal</p>
                  <p className="text-[8px] font-bold text-brand-primary uppercase mt-2">15 MAY 2024</p>
               </div>
            ))}
          </div>
        </div>
      </div>

      <div className="space-y-8">
        <div className="bg-brand-secondary p-8 rounded-[3rem] text-white shadow-2xl relative overflow-hidden group">
          <div className="relative z-10">
            <h3 className="text-xl font-black italic uppercase leading-tight mb-4">Cartas Comunales<br/>y Normativas</h3>
            <p className="text-[10px] text-cyan-200 font-bold uppercase italic leading-relaxed mb-8">
              Leyes internas y ordenanzas para la convivencia territorial.
            </p>
            <div className="space-y-3">
              {['Convivencia', 'Justicia Paz', 'Servicios'].map((c, i) => (
                <div key={i} className="flex items-center justify-between p-3 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 transition-all cursor-pointer">
                  <span className="text-[9px] font-black uppercase">{c}</span>
                  <ArrowUpRight size={12} className="text-cyan-400" />
                </div>
              ))}
            </div>
            <button 
              onClick={() => openModal('form', 'Registrar Nueva Carta', { fields: [{ label: 'Título', placeholder: 'Ej. Carta de Convivencia' }, { label: 'Categoría', placeholder: 'Ej. Justicia' }], action: 'Registrar' })}
              className="w-full mt-8 py-4 bg-brand-primary rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-xl shadow-brand-primary/20"
            >
              Registrar Nueva Carta
            </button>
          </div>
          <div className="absolute top-0 right-0 p-10 opacity-5 -mr-10 group-hover:-mr-5 transition-all">
            <Scale className="h-48 w-48" />
          </div>
        </div>
      </div>
    </div>
  </div>
);

const BancoView = ({ openModal }: any) => (
  <div className="space-y-8 animate-in slide-in-from-right-4 duration-500">
     <div className="grid lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-8">
           <div className="bg-brand-secondary p-10 rounded-[3.5rem] text-white shadow-2xl relative overflow-hidden group">
              <div className="relative z-10">
                 <div className="flex justify-between items-start mb-12">
                    <div>
                       <p className="text-[10px] font-black text-cyan-200 uppercase tracking-[0.2em] italic">Fondo Comunal Consolidado</p>
                       <h4 className="text-5xl font-black italic tracking-tighter mt-4 leading-none">$45,200.00</h4>
                    </div>
                    <div className="bg-white/10 p-3 rounded-2xl border border-white/10">
                       <Landmark size={24} className="text-cyan-400" />
                    </div>
                 </div>
                 <div className="grid grid-cols-2 gap-8">
                    <div className="p-6 rounded-3xl bg-white/5 border border-white/10">
                       <p className="text-[8px] font-black text-cyan-200/50 uppercase tracking-widest mb-1 italic">Proyectos Financiados</p>
                       <p className="text-xl font-black italic">08 ACAS</p>
                    </div>
                    <div className="p-6 rounded-3xl bg-white/5 border border-white/10">
                       <p className="text-[8px] font-black text-cyan-200/50 uppercase tracking-widest mb-1 italic">Ejecución Presupuestaria</p>
                       <p className="text-xl font-black italic">65.4%</p>
                    </div>
                 </div>
              </div>
              <div className="absolute bottom-0 right-0 p-10 opacity-5 scale-150">
                 <TrendingUp className="h-64 w-64" />
              </div>
           </div>

           <div className="bg-white p-8 rounded-[3rem] border border-slate-100 shadow-xl shadow-slate-200/10">
              <h3 className="text-sm font-black text-slate-800 uppercase italic mb-8">Estatus de Cuentas Comunas</h3>
              <div className="space-y-4">
                 {[
                   { bank: 'Banco de Venezuela', account: '...4502', status: 'Activa', balance: '$32,100' },
                   { bank: 'Banco del Tesoro', account: '...9910', status: 'Activa', balance: '$13,100' },
                 ].map((acc, i) => (
                   <div 
                     key={i} 
                     onClick={() => openModal('detail', 'Detalle de Cuenta Bancaria', acc)}
                     className="flex items-center justify-between p-6 rounded-3xl bg-slate-50 border border-slate-100 group hover:bg-white hover:shadow-lg transition-all cursor-pointer"
                   >
                      <div className="flex items-center gap-5">
                         <div className="h-14 w-14 rounded-2xl bg-white border border-slate-100 flex items-center justify-center text-slate-400 group-hover:text-brand-primary">
                            <Landmark size={28} />
                         </div>
                         <div>
                            <p className="text-xs font-black text-slate-800 uppercase italic">{acc.bank}</p>
                            <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest leading-none mt-1.5">{acc.account}</p>
                         </div>
                      </div>
                      <div className="text-right">
                         <p className="text-sm font-black text-slate-800 italic">{acc.balance}</p>
                         <span className="text-[8px] font-black text-emerald-500 uppercase italic border-b border-emerald-500/20">{acc.status}</span>
                      </div>
                   </div>
                 ))}
                 <button 
                   onClick={() => openModal('form', 'Vincular Nueva Cuenta', { fields: [{ label: 'Banco', placeholder: 'Ej. Banco Bicentenario' }, { label: 'Número de Cuenta', placeholder: '20 dígitos' }], action: 'Vincular' })}
                   className="w-full py-4 border-2 border-dashed border-slate-100 rounded-2xl text-[9px] font-black uppercase text-slate-300 hover:border-brand-primary hover:text-brand-primary transition-all"
                 >
                   Vincular Nueva Cuenta Jurídica
                 </button>
              </div>
           </div>
        </div>

        <div className="space-y-8">
           <div className="bg-white p-8 rounded-[3rem] border border-slate-100 shadow-xl shadow-slate-200/10">
              <h3 className="text-sm font-black text-slate-800 uppercase italic mb-8">Firmantes Autorizados</h3>
              <div className="space-y-6">
                 {[1, 2, 3].map(i => (
                    <div 
                      key={i} 
                      onClick={() => openModal('detail', 'Vocero Firmante', { Nombre: `Firmante ${i}`, CI: '12.345.678', Cargo: 'Responsable Tesorería', Estatus: 'Vigente' })}
                      className="flex items-center gap-4 group cursor-pointer hover:bg-slate-50 p-2 rounded-xl transition-all"
                    >
                       <div className="h-10 w-10 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-center text-slate-400 group-hover:bg-brand-primary group-hover:text-white transition-all">
                          <Users2 size={20} />
                       </div>
                       <div className="flex-1">
                          <p className="text-[10px] font-black text-slate-800 uppercase tracking-tight italic">Vocero Firmante {i}</p>
                          <p className="text-[8px] font-bold text-slate-400 uppercase tracking-widest">Principal • C.I. 12.345.678</p>
                       </div>
                       <div className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                    </div>
                 ))}
              </div>
              <button 
                onClick={() => openModal('success', 'Acta Generada', { message: 'El acta de registro de firmas ha sido generada correctamente para su impresión.' })}
                className="w-full mt-8 py-3 rounded-xl border border-slate-200 text-[9px] font-black uppercase tracking-widest text-slate-500 hover:bg-slate-50 transition-all"
              >
                Generar Acta de Registro
              </button>
           </div>

           <div className="bg-slate-50 p-8 rounded-[3rem] border border-slate-100 space-y-6">
              <div className="flex items-center gap-3">
                 <ShieldCheck size={20} className="text-emerald-500" />
                 <h4 className="text-[10px] font-black text-slate-800 uppercase italic">Validación Institucional</h4>
              </div>
              <p className="text-[9px] text-slate-400 font-bold leading-relaxed uppercase italic">
                 CUENTA VALIDADA POR SUAF PARA LA RECEPCIÓN DE RECURSOS DEL ESTADO Y AUTOGESTIÓN.
              </p>
              <div className="flex items-center justify-between pt-4 border-t border-slate-200">
                 <span className="text-[8px] font-black text-slate-400 uppercase">CERTIFICADO: #4590</span>
                 <CheckCircle2 size={14} className="text-emerald-500" />
              </div>
           </div>
        </div>
     </div>
  </div>
);

const ContraloriaView = ({ openModal }: any) => (
  <div className="space-y-8 animate-in slide-in-from-right-4 duration-500">
     <div className="flex items-center gap-4">
        <div className="h-12 w-12 bg-rose-500/10 text-rose-500 rounded-2xl flex items-center justify-center shadow-sm">
           <Scale size={24} />
        </div>
        <div>
           <h3 className="text-xl font-black text-slate-800 uppercase italic">Contraloría Social Comunal</h3>
           <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Informes de Vigilancia y Control</p>
        </div>
     </div>

     <div className="grid md:grid-cols-2 gap-8">
        <div className="bg-white p-8 rounded-[3rem] border border-slate-100 shadow-xl shadow-slate-200/10">
           <h3 className="text-sm font-black text-slate-800 uppercase italic mb-8 italic">Auditarias Realizadas</h3>
           <div className="space-y-4">
              {[
                { title: 'Inversión T2 Servicios', status: 'Conforme', color: 'text-emerald-500' },
                { title: 'Censo Familiar Sector 3', status: 'Con Observaciones', color: 'text-amber-500' },
                { title: 'Compra de Material Agro', status: 'Validado', color: 'text-emerald-500' },
              ].map((audit, i) => (
                <div 
                  key={i} 
                  onClick={() => openModal('detail', 'Detalle de Auditoría', { Auditoría: audit.title, Resultado: audit.status, Fecha: '15 MAY 2024' })}
                  className="p-5 rounded-2xl bg-slate-50 border border-slate-100 hover:bg-white hover:shadow-lg transition-all flex items-center justify-between cursor-pointer"
                >
                   <div className="flex items-center gap-4">
                      <div className="h-10 w-10 bg-white rounded-xl border border-slate-100 flex items-center justify-center text-slate-300">
                         <ClipboardList size={20} />
                      </div>
                      <div>
                        <p className="text-[10px] font-black text-slate-800 uppercase italic">{audit.title}</p>
                        <p className="text-[8px] font-bold text-slate-400 uppercase">Control de Seguimiento</p>
                      </div>
                   </div>
                   <span className={cn("text-[8px] font-black uppercase px-2 py-0.5 rounded italic", audit.color, "bg-white border border-slate-100")}>{audit.status}</span>
                </div>
              ))}
           </div>
        </div>

        <div className="bg-white p-8 rounded-[3rem] border border-slate-100 shadow-xl shadow-slate-200/10">
           <h3 className="text-sm font-black text-slate-800 uppercase italic mb-8 italic">Informes de Transparencia</h3>
           <div className="space-y-6">
              <div 
                onClick={() => openModal('form', 'Subir Informe de Gestión', { fields: [{ label: 'Mes del Informe', placeholder: 'Ej. Abril 2024' }, { label: 'Comentario de Contraloría', placeholder: 'Resumen del informe' }], action: 'Subir PDF' })}
                className="p-8 border-2 border-dashed border-slate-100 rounded-[2.5rem] text-center group cursor-pointer hover:border-brand-primary transition-all"
              >
                 <CloudUpload size={32} className="mx-auto text-slate-200 mb-4 group-hover:text-brand-primary scale-110 transition-transform" />
                 <h4 className="text-[10px] font-black text-slate-800 uppercase italic">Subir Informe Mensual</h4>
                 <p className="text-[8px] text-slate-400 font-bold uppercase mt-2 tracking-widest italic">Archivo PDF o Imagen de Acta Firmada</p>
              </div>
              <div className="p-6 bg-slate-50 rounded-[2rem] border border-slate-100">
                 <div className="flex items-center gap-3 mb-3">
                    <AlertCircle size={16} className="text-amber-500" />
                    <span className="text-[10px] font-black uppercase text-slate-800">Recordatorio</span>
                 </div>
                 <p className="text-[9px] text-slate-400 font-bold uppercase leading-relaxed italic">
                    EL INFORME DE RENDICIÓN DE CUENTAS DEL PARLAMENTO DEBE SER CARGADO LOS PRIMEROS 5 DÍAS DE CADA MES.
                 </p>
              </div>
           </div>
        </div>
     </div>
  </div>
);

const CensosConsolidadoView = ({ totalFamilies, totalPop, councilsCount, openModal }: any) => {
   const [adjustedFamilies, setAdjustFamilies] = useState(totalFamilies);
   const [adjustedPop, setAdjustPop] = useState(totalPop);
   
   return (
      <div className="space-y-8 animate-in slide-in-from-right-4 duration-500">
         <div className="grid lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 space-y-8">
               <div className="bg-white p-10 rounded-[3rem] border border-slate-100 shadow-xl shadow-slate-200/10">
                  <div className="flex items-center justify-between mb-10">
                     <h3 className="text-sm font-black text-slate-800 uppercase italic">Censo General Consolidado (Comuna)</h3>
                     <span className="px-3 py-1 bg-brand-primary text-white text-[8px] font-black uppercase rounded-full">Automático de SITUR</span>
                  </div>
                  
                  <div className="grid sm:grid-cols-2 gap-10">
                     <div className="p-10 rounded-[2.5rem] bg-slate-50 border border-slate-100 relative group">
                        <Users className="absolute top-6 right-6 h-12 w-12 text-slate-100 group-hover:scale-110 transition-transform" />
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-4">Población Proyectada</label>
                        <div className="flex items-baseline gap-4">
                           <input 
                             type="number" 
                             value={adjustedPop} 
                             onChange={(e) => setAdjustPop(parseInt(e.target.value))}
                             className="text-5xl font-black italic bg-transparent border-none outline-none text-slate-800 max-w-[200px]" 
                           />
                           <span className="text-[8px] font-black text-brand-primary uppercase italic">Habitantes</span>
                        </div>
                        <p className="text-[8px] text-slate-400 font-bold uppercase mt-6 border-t border-slate-200 pt-4 italic">Suma de 12 Consejos Comunales: {totalPop}</p>
                     </div>

                     <div className="p-10 rounded-[2.5rem] bg-slate-50 border border-slate-100 relative group">
                        <Building2 className="absolute top-6 right-6 h-12 w-12 text-slate-100 group-hover:scale-110 transition-transform" />
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-4">Familias Protegidas</label>
                        <div className="flex items-baseline gap-4">
                           <input 
                             type="number" 
                             value={adjustedFamilies} 
                             onChange={(e) => setAdjustFamilies(parseInt(e.target.value))}
                             className="text-5xl font-black italic bg-transparent border-none outline-none text-slate-800 max-w-[180px]" 
                           />
                           <span className="text-[8px] font-black text-brand-primary uppercase italic">Familias</span>
                        </div>
                        <p className="text-[8px] text-slate-400 font-bold uppercase mt-6 border-t border-slate-200 pt-4 italic">Suma de 12 Consejos Comunales: {totalFamilies}</p>
                     </div>
                  </div>

                  <div className="mt-10 flex gap-4">
                     <button 
                        onClick={() => openModal('success', 'Censo Ajustado', { message: 'El ajuste del censo ha sido validado institucionalmente.' })}
                        className="flex-1 bg-brand-primary py-4 rounded-2xl text-[10px] font-black text-white uppercase tracking-widest shadow-xl shadow-brand-primary/20 hover:scale-[1.01] transition-all"
                     >
                        Validar y Ajustar Censo Principal
                     </button>
                     <button 
                        onClick={() => openModal('detail', 'Historial de Censos', { 'Enero': 2400, 'Febrero': 2420, 'Marzo': 2450 })}
                        className="px-8 bg-white border border-slate-100 text-slate-400 rounded-2xl hover:text-slate-600 transition-all"
                     >
                        <History size={18} />
                     </button>
                  </div>
               </div>

               <div className="bg-white rounded-[3rem] border border-slate-100 shadow-xl shadow-slate-200/10 overflow-hidden">
                  <div className="px-10 py-6 border-b border-slate-50 bg-slate-50/10 flex justify-between items-center">
                     <h3 className="text-sm font-black text-slate-800 uppercase italic">Desglose de Aportes por Consejo Comunal</h3>
                     <span className="text-[9px] font-black text-slate-400 uppercase italic">{councilsCount} Consejos Vinculados</span>
                  </div>
                  <div className="overflow-x-auto">
                     <table className="w-full text-left">
                        <thead>
                           <tr className="border-b border-slate-50">
                              <th className="px-10 py-5 text-[9px] font-black text-slate-400 uppercase italic">Organización CC</th>
                              <th className="px-10 py-5 text-[9px] font-black text-slate-400 uppercase italic text-center">Familias</th>
                              <th className="px-10 py-5 text-[9px] font-black text-slate-400 uppercase italic text-center">Habitantes</th>
                              <th className="px-10 py-5 text-[9px] font-black text-slate-400 uppercase italic text-right">Estatus</th>
                           </tr>
                        </thead>
                        <tbody>
                           {[
                             { name: 'Brisas del Norte', fam: 120, pop: 380, status: 'Auditado' },
                             { name: 'El Trigo Sector A', fam: 85, pop: 240, status: 'En Proceso' },
                             { name: 'Los Picapiedras', fam: 200, pop: 640, status: 'Auditado' },
                           ].map((cc, i) => (
                             <tr 
                                key={i} 
                                onClick={() => openModal('detail', 'Detalle de Aporte CC', cc)}
                                className="border-b border-slate-50 last:border-0 hover:bg-slate-50/50 transition-colors cursor-pointer"
                              >
                                <td className="px-10 py-5">
                                   <span className="text-xs font-black text-slate-800 uppercase italic tracking-tight">{cc.name}</span>
                                </td>
                                <td className="px-10 py-5 text-center">
                                   <span className="text-xs font-bold text-slate-600">{cc.fam}</span>
                                </td>
                                <td className="px-10 py-5 text-center">
                                   <span className="text-xs font-bold text-slate-600">{cc.pop}</span>
                                </td>
                                <td className="px-10 py-5 text-right">
                                   <span className={cn("text-[8px] font-black uppercase px-2 py-0.5 rounded italic", cc.status === 'Auditado' ? 'bg-emerald-50 text-emerald-600' : 'bg-amber-50 text-amber-600')}>{cc.status}</span>
                                </td>
                             </tr>
                           ))}
                        </tbody>
                     </table>
                  </div>
               </div>
            </div>

            <div className="space-y-8">
               <div className="bg-brand-secondary p-8 rounded-[3rem] text-white shadow-2xl relative overflow-hidden group">
                  <div className="relative z-10">
                     <h3 className="text-xl font-black italic uppercase leading-none tracking-tighter mb-4">Asignación Directa de Recursos</h3>
                     <p className="text-[10px] text-cyan-200 font-bold uppercase italic leading-relaxed mb-8">Calculado en base al censo auditado y verificado.</p>
                     <div className="space-y-4">
                        <div className="p-4 rounded-2xl bg-white/5 border border-white/10">
                           <p className="text-[8px] font-black text-cyan-200/50 uppercase italic mb-1">Bono por Familia (CLAP)</p>
                           <p className="text-2xl font-black italic">$12,450</p>
                        </div>
                        <div className="p-4 rounded-2xl bg-white/5 border border-white/10">
                           <p className="text-[8px] font-black text-cyan-200/50 uppercase italic mb-1">Subsidio Servicios</p>
                           <p className="text-2xl font-black italic">$4,200</p>
                        </div>
                     </div>
                  </div>
                  <div className="absolute top-0 right-0 p-10 opacity-5 -mr-10 group-hover:-mr-5 transition-all outline-none">
                     <Target className="h-48 w-48" />
                  </div>
               </div>
            </div>
         </div>
      </div>
   );
};

// --- Planificación Estratégica View ---

const PlanificacionEstrategicaView = ({ user, activeTab: initialTab, onTabChange, openModal }: any) => {
  const [activeTab, setActiveTab] = useState(initialTab === 'estrategia' ? 'aca' : (initialTab || 'aca'));

  useEffect(() => {
    if (initialTab) {
      setActiveTab(initialTab === 'estrategia' ? 'aca' : initialTab);
    }
  }, [initialTab]);

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
        <div>
           <h2 className="text-2xl font-black text-slate-800 italic uppercase tracking-tighter leading-none">Planificación Estratégica</h2>
           <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-2 italic shadow-sm bg-white inline-block px-3 py-1 rounded-full border border-slate-50">Agenda de Acción y Normativa Territorial</p>
        </div>
      </div>

      <div className="flex gap-2 border-b border-slate-100 pb-px overflow-x-auto no-scrollbar">
        {['aca', 'cartas'].map((tab) => (
          <button
            key={tab}
            onClick={() => {
              setActiveTab(tab);
              onTabChange?.(tab);
            }}
            className={cn(
              "px-8 py-4 text-[10px] font-black uppercase tracking-widest transition-all relative border-b-2 whitespace-nowrap",
              activeTab === tab ? "border-brand-primary text-brand-primary" : "border-transparent text-slate-400 hover:text-slate-600"
            )}
          >
            {tab === 'aca' ? 'ACA Comunal' : 'Cartas Comunales'}
            {activeTab === tab && (
              <motion.div layoutId="activePlanTab" className="absolute bottom-0 left-0 right-0 h-0.5 bg-brand-primary" />
            )}
          </button>
        ))}
      </div>

      <div className="mt-8">
        {activeTab === 'aca' && <ACAComunalView openModal={openModal} />}
        {activeTab === 'cartas' && <CartasComunalesView openModal={openModal} />}
      </div>
    </div>
  );
};

const ACAComunalView = ({ openModal }: any) => (
  <div className="space-y-8 animate-in slide-in-from-right-4 duration-500">
    <div className="grid lg:grid-cols-4 gap-6">
      {[
        { label: 'Nudos Críticos', value: '12', color: 'bg-rose-50 border-rose-100 text-rose-600' },
        { label: 'Proyectos 7T', value: '45', color: 'bg-emerald-50 border-emerald-100 text-emerald-600' },
        { label: 'Habitantes Impactados', value: '3.4k', color: 'bg-brand-primary/5 border-brand-primary/10 text-brand-primary' },
        { label: 'Presupuesto Ejecutado', value: '65%', color: 'bg-amber-50 border-amber-100 text-amber-600' },
      ].map((stat, i) => (
        <div key={i} className={cn("p-6 rounded-[2rem] border-2 shadow-sm", stat.color)}>
           <p className="text-[8px] font-black uppercase tracking-widest mb-1 italic opacity-70">{stat.label}</p>
           <p className="text-3xl font-black italic tracking-tighter">{stat.value}</p>
        </div>
      ))}
    </div>

    <div className="bg-white p-8 rounded-[3rem] border border-slate-100 shadow-xl shadow-slate-200/10">
      <div className="flex items-center justify-between mb-10">
        <div>
           <h3 className="text-sm font-black text-slate-800 uppercase italic">Mapa de Nudos Críticos de Gran Escala</h3>
           <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mt-1">Sincronizado con el sistema de planificación nacional</p>
        </div>
        <button 
          onClick={() => openModal('form', 'Priorizar Nudo Crítico', { fields: [{ label: 'ID del Nudo', placeholder: 'Ej. NC-456' }, { label: 'Nivel de Prioridad', placeholder: 'Ej. Alta / Media' }], action: 'Priorizar' })}
          className="px-6 py-2.5 bg-slate-800 text-white text-[10px] font-black uppercase rounded-2xl shadow-xl hover:bg-slate-700 transition-all"
        >
          Priorizar Nudo
        </button>
      </div>

      <div className="space-y-4">
        {[
          { 
            title: 'Saturación del Sistema Eléctrico Comunal', 
            scale: 'Gran Escala', 
            transform: 'T2: Servicios', 
            status: 'Crítico', 
            impact: '8 Sectores',
            progress: 25
          },
          { 
            title: 'Dragado y Canalización Río San Pedro', 
            scale: 'Alta Complejidad', 
            transform: 'T3: Infraestructura', 
            status: 'En Gestión', 
            impact: 'Comuna Completa',
            progress: 60
          },
          { 
            title: 'Déficit de Cadena de Frío UPF Cárnica', 
            scale: 'Media Escala', 
            transform: 'T1: Económica', 
            status: 'Presupuestado', 
            impact: '3 UPF Activas',
            progress: 85
          }
        ].map((item, i) => (
           <div 
             key={i} 
             onClick={() => openModal('detail', 'Detalle de Nudo Crítico', item)}
             className="p-8 rounded-[2.5rem] bg-slate-50 border border-slate-100 hover:bg-white hover:shadow-xl hover:border-slate-200 transition-all group overflow-hidden relative cursor-pointer"
           >
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 relative z-10">
                 <div className="flex-1 space-y-3">
                    <div className="flex items-center gap-3">
                       <span className="px-2 py-0.5 rounded bg-brand-primary text-white text-[8px] font-black uppercase italic">{item.transform}</span>
                       <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest italic">{item.scale}</span>
                    </div>
                    <h4 className="text-lg font-black text-slate-800 uppercase italic group-hover:text-brand-primary transition-colors">{item.title}</h4>
                    <div className="flex items-center gap-6">
                       <div className="flex items-center gap-2">
                          <Users size={12} className="text-slate-400" />
                          <span className="text-[9px] font-bold text-slate-400 uppercase">{item.impact}</span>
                       </div>
                       <div className="flex items-center gap-2">
                          <Target size={12} className="text-slate-400" />
                          <span className="text-[9px] font-bold text-slate-400 uppercase">{item.status}</span>
                       </div>
                    </div>
                 </div>
                 <div className="w-full md:w-48 space-y-3">
                    <div className="flex justify-between items-center">
                       <span className="text-[9px] font-black text-slate-400 uppercase">Resolución: {item.progress}%</span>
                       <TrendingUp size={14} className="text-brand-primary" />
                    </div>
                    <div className="h-1.5 bg-slate-200 rounded-full overflow-hidden">
                       <motion.div 
                          initial={{ width: 0 }}
                          animate={{ width: `${item.progress}%` }}
                          className="h-full bg-brand-primary"
                       />
                    </div>
                 </div>
              </div>
              <div className="absolute top-0 right-0 p-8 opacity-5 group-hover:opacity-10 transition-opacity">
                 <Target size={120} />
              </div>
           </div>
        ))}
      </div>
    </div>
  </div>
);

const CartasComunalesView = ({ openModal }: any) => (
  <div className="space-y-8 animate-in slide-in-from-right-4 duration-500">
     <div className="bg-white p-10 rounded-[3.5rem] border border-slate-100 shadow-xl shadow-slate-200/10">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-12">
           <div>
              <h3 className="text-xl font-black text-slate-800 uppercase italic">Repositorio de Normativa Comunal</h3>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-2 underline decoration-brand-primary/30 underline-offset-4 italic">Leyes aprobadas por el Parlamento Comunal</p>
           </div>
           <button 
             onClick={() => openModal('form', 'Registrar Nueva Norma', { fields: [{ label: 'Título de la Norma', placeholder: 'Ej. Reglamento de Convivencia' }, { label: 'Categoría', placeholder: 'Ej. Seguridad / Ambiente' }], action: 'Registrar' })}
             className="flex items-center gap-3 px-8 py-3.5 bg-brand-primary text-white text-[10px] font-black uppercase rounded-2xl shadow-xl shadow-brand-primary/20 hover:scale-[1.02] transition-all"
           >
              <Plus size={16} />
              Registrar Nueva Norma
           </button>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
           {[
             { title: 'Carta de Convivencia y Justicia de Paz', date: '12 ENE 2024', status: 'Aprobada', pages: 12, category: 'Justicia' },
             { title: 'Reglamento de Gestión de Residuos', date: '05 MAR 2024', status: 'Aprobada', pages: 8, category: 'Servicios' },
             { title: 'Normativa de Protección Ambiental', date: '20 ABR 2024', status: 'En Discusión', pages: 15, category: 'Ecosocialismo' },
             { title: 'Ordenanza de Distribución Local CLAP', date: '28 MAY 2024', status: 'Aprobada', pages: 6, category: 'Alimentación' },
             { title: 'Estatutos UPF "Fuerza Mujer"', date: '02 JUN 2024', status: 'Aprobada', pages: 10, category: 'Economía' },
           ].map((doc, i) => (
              <div 
                key={i} 
                className="group relative p-8 rounded-[2.5rem] bg-slate-50 border border-slate-100 hover:bg-white hover:shadow-2xl hover:border-brand-primary/20 transition-all flex flex-col justify-between h-[280px]"
              >
                 <div>
                    <div className="flex items-center justify-between mb-6">
                       <div className="h-12 w-12 rounded-2xl bg-white border border-slate-100 flex items-center justify-center text-slate-300 group-hover:text-brand-primary group-hover:border-brand-primary/20 transition-all">
                          <FileText size={24} />
                       </div>
                       <span className={cn(
                          "text-[8px] font-black px-3 py-1 rounded-full uppercase",
                          doc.status === 'Aprobada' ? 'bg-emerald-50 text-emerald-600' : 'bg-amber-50 text-amber-600'
                       )}>{doc.status}</span>
                    </div>
                    <p className="text-[9px] font-black text-brand-primary uppercase tracking-[0.2em] mb-2 italic">{doc.category}</p>
                    <h4 className="text-sm font-black text-slate-800 uppercase italic leading-tight group-hover:text-brand-primary transition-colors">{doc.title}</h4>
                 </div>
                 
                 <div className="pt-6 border-t border-slate-200/50 flex items-center justify-between">
                    <div>
                       <p className="text-[8px] font-bold text-slate-400 uppercase tracking-widest">{doc.date}</p>
                       <p className="text-[8px] font-black text-slate-400 uppercase mt-0.5">{doc.pages} PÁGINAS</p>
                    </div>
                    <button 
                      onClick={() => openModal('detail', 'Detalle de Norma Comunal', doc)}
                      className="p-3 rounded-xl bg-white border border-slate-100 text-slate-400 hover:text-brand-primary hover:border-brand-primary transition-all shadow-sm"
                    >
                       <ArrowUpRight size={18} />
                    </button>
                 </div>
              </div>
           ))}
           <div 
             onClick={() => openModal('form', 'Digitalizar Tomo', { fields: [{ label: 'Número de Tomo', placeholder: 'Ej. Tomo IV' }, { label: 'Archivo Escaneado', placeholder: 'Seleccionar PDF/Imagen' }], action: 'Cargar Digitalización' })}
             className="p-8 rounded-[2.5rem] border-4 border-dashed border-slate-50 flex flex-col items-center justify-center text-center space-y-4 hover:border-brand-primary/20 transition-all group cursor-pointer"
           >
              <div className="h-20 w-20 rounded-full bg-slate-50 flex items-center justify-center text-slate-200 group-hover:text-brand-primary group-hover:bg-brand-primary/10 transition-all shadow-sm">
                 <CloudUpload size={40} />
              </div>
              <div>
                 <p className="text-[10px] font-black text-slate-800 uppercase italic">Digitalizar Tomo</p>
                 <p className="text-[8px] text-slate-400 font-bold uppercase tracking-widest mt-1 italic">Escaneo de Libro de Actas</p>
              </div>
           </div>
        </div>
     </div>
  </div>
);

// --- Gestión de Proyectos Comunitarios View ---

const GestionProyectosView = ({ user, activeTab: initialTab, onTabChange, openModal }: any) => {
  const [activeTab, setActiveTab] = useState(initialTab === 'proyectos' ? 'inversion' : (initialTab || 'inversion'));

  useEffect(() => {
    if (initialTab) {
      setActiveTab(initialTab === 'proyectos' ? 'inversion' : initialTab);
    }
  }, [initialTab]);

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
        <div>
           <h2 className="text-2xl font-black text-slate-800 italic uppercase tracking-tighter leading-none">Gestión de Proyectos Comunitarios</h2>
           <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-2 italic shadow-sm bg-white inline-block px-3 py-1 rounded-full border border-slate-50">Seguimiento de Obras y Registro Productivo</p>
        </div>
      </div>

      <div className="flex gap-2 border-b border-slate-100 pb-px overflow-x-auto no-scrollbar">
        {['inversion', 'eps'].map((tab) => (
          <button
            key={tab}
            onClick={() => {
              setActiveTab(tab);
              onTabChange?.(tab);
            }}
            className={cn(
              "px-8 py-4 text-[10px] font-black uppercase tracking-widest transition-all relative border-b-2 whitespace-nowrap",
              activeTab === tab ? "border-brand-primary text-brand-primary" : "border-transparent text-slate-400 hover:text-slate-600"
            )}
          >
            {tab === 'inversion' ? 'Proyectos de Inversión' : 'Empresas de Propiedad Social'}
            {activeTab === tab && (
              <motion.div layoutId="activeProjTab" className="absolute bottom-0 left-0 right-0 h-0.5 bg-brand-primary" />
            )}
          </button>
        ))}
      </div>

      <div className="mt-8">
        {activeTab === 'inversion' && <ProyectosInversionView openModal={openModal} />}
        {activeTab === 'eps' && <EPSView openModal={openModal} />}
      </div>
    </div>
  );
};

const ProyectosInversionView = ({ openModal }: any) => (
  <div className="space-y-8 animate-in slide-in-from-right-4 duration-500">
     <div className="grid lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-8">
           <div className="bg-white p-8 rounded-[3rem] border border-slate-100 shadow-xl shadow-slate-200/10">
              <div className="flex items-center justify-between mb-8">
                 <h3 className="text-sm font-black text-slate-800 uppercase italic">Obras Financiadas (CFG / Alcaldía)</h3>
                 <button 
                   onClick={() => openModal('form', 'Reportar Avance de Obra', { fields: [{ label: 'ID Proyecto', placeholder: 'Ej. PRJ-789' }, { label: 'Porcentaje de Avance', placeholder: 'Ej. 55%' }, { label: 'Fotos Evidencia', placeholder: 'Subir archivos...' }], action: 'Reportar' })}
                   className="px-5 py-2 bg-slate-800 text-white text-[9px] font-black uppercase rounded-xl"
                 >
                   Reportar Avance
                 </button>
              </div>
              <div className="space-y-6">
                 {[
                   { title: 'Rehabilitación Integral de Cancha Vereda 5', source: 'CFG', amount: '$12,500', progress: 75, status: 'Fase de Acabados' },
                   { title: 'Sustitución de Colector Sector 2', source: 'Alcaldía', amount: '$45,000', progress: 20, status: 'Excavación' },
                   { title: 'Alumbrado LED Ave. Principal', source: 'CFG', amount: '$8,200', progress: 100, status: 'Culminado' }
                 ].map((obra, i) => (
                    <div 
                      key={i} 
                      onClick={() => openModal('detail', 'Detalle de Obra', obra)}
                      className="p-6 rounded-3xl bg-slate-50 border border-slate-100 group hover:border-brand-primary transition-all cursor-pointer"
                    >
                       <div className="flex justify-between items-start mb-4">
                          <div className="flex items-center gap-3">
                             <div className="h-10 w-10 bg-white rounded-2xl flex items-center justify-center text-slate-400 group-hover:text-brand-primary border border-slate-100">
                                <Construction size={20} />
                             </div>
                             <div>
                                <h4 className="text-[11px] font-black text-slate-800 uppercase italic">{obra.title}</h4>
                                <span className="text-[8px] font-bold text-slate-400 uppercase">Fuente: {obra.source} • {obra.amount}</span>
                             </div>
                          </div>
                          <span className={cn(
                             "text-[8px] font-black px-2 py-0.5 rounded italic border",
                             obra.progress === 100 ? "bg-emerald-50 text-emerald-600 border-emerald-100" : "bg-white text-slate-400 border-slate-100"
                          )}>{obra.status}</span>
                       </div>
                       <div className="space-y-2">
                          <div className="flex justify-between text-[8px] font-black text-slate-400 uppercase">
                             <span>Progreso Físico</span>
                             <span>{obra.progress}%</span>
                          </div>
                          <div className="h-1.5 bg-white border border-slate-100 rounded-full overflow-hidden">
                             <motion.div 
                               initial={{ width: 0 }}
                               animate={{ width: `${obra.progress}%` }}
                               className={cn("h-full", obra.progress === 100 ? "bg-emerald-500" : "bg-brand-primary")}
                             />
                          </div>
                       </div>
                    </div>
                 ))}
              </div>
           </div>
        </div>

        <div className="space-y-8">
           <div className="bg-brand-secondary p-8 rounded-[3rem] text-white shadow-2xl overflow-hidden relative group">
              <div className="relative z-10">
                 <h3 className="text-xl font-black italic uppercase italic leading-none mb-6">Monitoreo de Recursos</h3>
                 <div className="space-y-4">
                    <div className="p-4 rounded-2xl bg-white/5 border border-white/10">
                       <p className="text-[8px] font-black text-cyan-200 uppercase italic mb-1">Total Asignado 2024</p>
                       <p className="text-2xl font-black italic">$65,700</p>
                    </div>
                    <div className="p-4 rounded-2xl bg-white/5 border border-white/10">
                       <p className="text-[8px] font-black text-cyan-200 uppercase italic mb-1">Ejecución en Obras</p>
                       <p className="text-2xl font-black italic">$24,150</p>
                    </div>
                 </div>
              </div>
              <div className="absolute bottom-0 right-0 p-10 opacity-5 scale-150 group-hover:scale-175 transition-transform">
                 <TrendingUp size={100} />
              </div>
           </div>
           
           <div className="bg-white p-8 rounded-[3rem] border border-slate-100 shadow-sm space-y-6">
              <h4 className="text-[10px] font-black text-slate-800 uppercase italic">Validación Ciudadana</h4>
              <p className="text-[9px] text-slate-400 font-bold uppercase leading-relaxed italic">
                 TODAS LAS OBRAS DEBEN CONTAR CON EL AVAL DE LA CONTRALORÍA SOCIAL PARA EL DESEMBOLSO DEL ÚLTIMO 20%.
              </p>
              <button 
                onClick={() => openModal('detail', 'Normativa de Pago', { Articulo_1: 'La contraloría debe certificar el 100% físico.', Articulo_2: 'Se requiere acta de asamblea de ciudadanos.' })}
                className="w-full py-3 rounded-xl border border-slate-100 text-[9px] font-black text-slate-500 uppercase hover:bg-slate-50 transition-all"
              >
                Ver Normativa de Pago
              </button>
           </div>
        </div>
     </div>
  </div>
);

const EPSView = ({ openModal }: any) => (
  <div className="space-y-8 animate-in slide-in-from-right-4 duration-500">
     <div className="grid lg:grid-cols-4 gap-6">
        {[
          { label: 'Unidades Activas', value: '08', icon: Briefcase },
          { label: 'Empleos Directos', value: '34', icon: Users },
          { label: 'Producción Mes', value: '2.4t', icon: Target },
          { label: 'Retorno Comunal', value: '12%', icon: TrendingUp },
        ].map((stat, i) => (
           <div key={i} className="bg-white p-6 rounded-[2.5rem] border border-slate-100 shadow-sm flex flex-col justify-between h-32">
              <div className="flex justify-between items-start">
                 <stat.icon size={16} className="text-slate-300" />
                 <span className="text-[8px] font-black text-emerald-500 uppercase italic">+2.5%</span>
              </div>
              <div>
                 <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest italic">{stat.label}</p>
                 <p className="text-2xl font-black text-slate-800 italic uppercase">{stat.value}</p>
              </div>
           </div>
        ))}
     </div>

     <div className="bg-white p-10 rounded-[3.5rem] border border-slate-100 shadow-xl shadow-slate-200/10">
        <div className="flex justify-between items-center mb-12">
           <div>
              <h3 className="text-xl font-black text-slate-800 uppercase italic">Directorio de Propiedad Social (EPS)</h3>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-2 underline decoration-brand-primary/30 underline-offset-4 italic">Unidades Productivas de Gestión Directa Comunal</p>
           </div>
           <button 
             onClick={() => openModal('form', 'Registrar Nueva Unidad', { fields: [{ label: 'Nombre de la Unidad', placeholder: 'Ej. Textilera Comunal' }, { label: 'Tipo de Empresa', placeholder: 'Ej. EPS Directa' }], action: 'Registrar' })}
             className="px-8 py-3.5 bg-brand-primary text-white text-[10px] font-black uppercase rounded-2xl shadow-xl shadow-brand-primary/20"
           >
             Registrar Nueva Unidad
           </button>
        </div>

        <div className="grid md:grid-cols-2 gap-8">
           {[
             { name: 'Panadería Popular "El Trigo"', type: 'EPS Directa', produce: 'Pan y Repostería', workers: 6, status: 'Operativa' },
             { name: 'UPF "Confecciones Brisas"', type: 'Familiar', produce: 'Uniformes Escolares', workers: 4, status: 'Operativa' },
             { name: 'Herrería Comunal "Hierro Vivo"', type: 'EPS Indirecta', produce: 'Puertas y Rejas', workers: 5, status: 'Mantenimiento' },
             { name: 'Blockera "Cimientos del Sur"', type: 'EPS Directa', produce: 'Bloques de Cemento', workers: 8, status: 'Operativa' },
           ].map((eps, i) => (
              <div 
                key={i} 
                onClick={() => openModal('detail', 'Detalle de Unidad Productiva', eps)}
                className="flex gap-6 p-8 rounded-[3rem] bg-slate-50 border border-slate-100 group hover:bg-white hover:shadow-2xl hover:border-brand-primary/30 transition-all cursor-pointer"
              >
                 <div className="h-16 w-16 rounded-[2rem] bg-white border border-slate-100 flex items-center justify-center text-slate-300 group-hover:text-brand-primary group-hover:border-brand-primary/20 transition-all shrink-0">
                    <Briefcase size={32} />
                 </div>
                 <div className="flex-1 space-y-3">
                    <div className="flex items-center justify-between">
                       <span className="text-[8px] font-black text-brand-primary uppercase italic tracking-widest">{eps.type}</span>
                       <span className={cn(
                          "text-[8px] font-black uppercase px-2 py-0.5 rounded-full italic",
                          eps.status === 'Operativa' ? 'bg-emerald-50 text-emerald-600' : 'bg-amber-50 text-amber-600'
                       )}>{eps.status}</span>
                    </div>
                    <h4 className="text-lg font-black text-slate-800 uppercase italic leading-tight group-hover:text-brand-primary transition-colors">{eps.name}</h4>
                    <div className="flex items-center justify-between pt-4 border-t border-slate-200/50">
                       <div className="flex items-center gap-2">
                          <Target size={12} className="text-slate-400" />
                          <span className="text-[9px] font-black text-slate-500 uppercase">{eps.produce}</span>
                       </div>
                       <div className="flex items-center gap-2">
                          <Users size={12} className="text-slate-400" />
                          <span className="text-[9px] font-black text-slate-500 uppercase">{eps.workers} Trabajadores</span>
                       </div>
                    </div>
                 </div>
              </div>
           ))}
        </div>
     </div>
  </div>
);

// --- Specialized Visualization Components ---

const TransformersChart = () => {
  const data = [
    { t: 'T1', label: 'Económica', count: 4, color: 'bg-emerald-500' },
    { t: 'T2', label: 'Servicios', count: 12, color: 'bg-brand-primary' },
    { t: 'T3', label: 'Seguridad', count: 3, color: 'bg-amber-500' },
    { t: 'T4', label: 'Social', count: 8, color: 'bg-indigo-500' },
    { t: 'T5', label: 'Política', count: 2, color: 'bg-rose-500' },
    { t: 'T6', label: 'Ecología', count: 5, color: 'bg-cyan-500' },
    { t: 'T7', label: 'Geopolítica', count: 1, color: 'bg-slate-500' },
  ];

  const max = Math.max(...data.map(d => d.count));

  return (
    <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-sm p-8">
       <div className="flex items-center justify-between mb-8">
          <div>
             <h3 className="text-sm font-black text-slate-800 uppercase italic">Nudos Críticos por 7T</h3>
             <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mt-1">Consolidado Territorial</p>
          </div>
          <BarChart3 className="h-4 w-4 text-slate-300" />
       </div>
       <div className="flex items-end gap-2 h-48 px-4">
          {data.map((d, i) => (
            <div key={i} className="flex-1 flex flex-col items-center gap-3 group">
               <div className="w-full relative flex flex-col justify-end h-full">
                  <motion.div 
                    initial={{ height: 0 }}
                    animate={{ height: `${(d.count / max) * 100}%` }}
                    className={cn("w-full rounded-t-xl transition-all group-hover:opacity-80 relative", d.color)}
                  >
                     <div className="absolute -top-6 left-1/2 -translate-x-1/2 text-[9px] font-black text-slate-800 opacity-0 group-hover:opacity-100 transition-opacity">
                        {d.count}
                     </div>
                  </motion.div>
               </div>
               <span className="text-[10px] font-black text-slate-400">{d.t}</span>
            </div>
          ))}
       </div>
       <div className="mt-8 grid grid-cols-4 gap-2">
          {data.map((d, i) => (
             <div key={i} className="flex items-center gap-1.5 overflow-hidden">
                <div className={cn("h-1.5 w-1.5 rounded-full shrink-0", d.color)} />
                <span className="text-[7px] font-black text-slate-400 uppercase truncate leading-none">{d.label}</span>
             </div>
          ))}
       </div>
    </div>
  );
};

const ProjectTimeline = () => {
  const milestones = [
    { label: 'Inicio de Obra', date: '12 May', status: 'completed' },
    { label: 'Fase I: Excavación', date: '25 May', status: 'completed' },
    { label: 'Fase II: Tubería', date: '10 Jun', status: 'current' },
    { label: 'Inspección Final', date: '22 Jun', status: 'pending' },
    { label: 'Inauguración', date: '30 Jun', status: 'pending' },
  ];

  return (
    <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-sm p-8">
       <div className="flex items-center justify-between mb-8">
          <h3 className="text-sm font-black text-slate-800 uppercase italic">Línea de Tiempo de Hitos</h3>
          <Clock className="h-4 w-4 text-slate-300" />
       </div>
       <div className="relative">
          <div className="absolute top-4 left-0 w-full h-[2px] bg-slate-100" />
          <div className="relative z-10 flex justify-between">
             {milestones.map((m, i) => (
               <div key={i} className="flex flex-col items-center text-center gap-4">
                  <div className={cn(
                    "h-8 w-8 rounded-full flex items-center justify-center border-4 border-white shadow-lg transition-all",
                    m.status === 'completed' ? "bg-emerald-500 text-white" : 
                    m.status === 'current' ? "bg-brand-primary text-white scale-110" : "bg-slate-200 text-slate-400"
                  )}>
                     {m.status === 'completed' ? <CheckCircle2 className="h-4 w-4" /> : <span className="text-[8px] font-black">{i+1}</span>}
                  </div>
                  <div>
                     <p className={cn("text-[9px] font-black uppercase tracking-tight", m.status === 'pending' ? "text-slate-300" : "text-slate-800")}>{m.label}</p>
                     <p className="text-[8px] font-bold text-brand-primary mt-0.5">{m.date}</p>
                  </div>
               </div>
             ))}
          </div>
       </div>
    </div>
  );
};

// --- Census Consolidation Component ---

const CensusConsolidated = () => {
  const [councils, setCouncils] = useState([
    { name: 'C.C. Brisas del Norte', families: 120, adults: 240, children: 80, updated: '2d' },
    { name: 'C.C. El Trigo', families: 85, adults: 170, children: 45, updated: '5d' },
    { name: 'C.C. Los Picapiedras', families: 200, adults: 400, children: 120, updated: 'Today' },
  ]);

  const totalFamilies = councils.reduce((acc, curr) => acc + curr.families, 0);
  const totalPopulation = councils.reduce((acc, curr) => acc + curr.adults + curr.children, 0);

  return (
    <div className="space-y-8">
       <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="md:col-span-2 bg-brand-secondary rounded-[2.5rem] p-10 text-white shadow-2xl relative overflow-hidden">
             <div className="relative z-10">
                <p className="text-[10px] font-black text-cyan-200 uppercase tracking-[0.2em] mb-4 italic">Censo General Consolidado</p>
                <div className="flex flex-wrap items-end gap-12">
                   <div>
                      <h4 className="text-5xl font-black italic tracking-tighter leading-none">{totalPopulation}</h4>
                      <p className="text-[10px] font-bold text-cyan-200/60 uppercase mt-4 tracking-widest">Habitantes Totales</p>
                   </div>
                   <div className="h-12 w-px bg-white/20" />
                   <div>
                      <h4 className="text-5xl font-black italic tracking-tighter leading-none">{totalFamilies}</h4>
                      <p className="text-[10px] font-bold text-cyan-200/60 uppercase mt-4 tracking-widest">Familias Protegidas</p>
                   </div>
                </div>
                <div className="mt-12 flex gap-4">
                   <button className="bg-brand-primary px-8 py-3 rounded-xl text-[9px] font-black uppercase tracking-widest hover:scale-105 transition-all">Ajustar Censo Manual</button>
                   <button className="bg-white/5 border border-white/10 px-8 py-3 rounded-xl text-[9px] font-black uppercase tracking-widest hover:bg-white/10 transition-all">Exportar Data SITUR</button>
                </div>
             </div>
             <div className="absolute top-0 right-0 p-20 opacity-5">
                <Users className="h-64 w-64" />
             </div>
          </div>
          
          <div className="bg-white rounded-[2.5rem] border border-slate-100 p-8 flex flex-col justify-between">
             <div>
                <h3 className="text-xs font-black text-slate-800 uppercase italic mb-4">Brecha de Registro</h3>
                <div className="space-y-6">
                   <div className="space-y-2">
                      <div className="flex justify-between text-[9px] font-black uppercase">
                         <span className="text-slate-400 tracking-tighter italic">Validación 7T Social</span>
                         <span className="text-brand-primary">92%</span>
                      </div>
                      <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
                         <div className="h-full bg-brand-primary" style={{ width: '92%' }} />
                      </div>
                   </div>
                   <div className="space-y-2">
                      <div className="flex justify-between text-[9px] font-black uppercase">
                         <span className="text-slate-400 tracking-tighter italic">Censo Mayor de 60</span>
                         <span className="text-emerald-500">100%</span>
                      </div>
                      <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
                         <div className="h-full bg-emerald-500" style={{ width: '100%' }} />
                      </div>
                   </div>
                </div>
             </div>
             <div className="pt-6 border-t border-slate-50">
                <p className="text-[8px] font-bold text-slate-400 uppercase italic tracking-tighter">Última sincronación con sistema patria hace 12 horas</p>
             </div>
          </div>
       </div>

       <div className="bg-white rounded-[2.5rem] border border-slate-100 overflow-hidden">
          <div className="px-8 py-6 border-b border-slate-50 flex items-center justify-between bg-slate-50/30">
             <h3 className="text-xs font-black text-slate-800 uppercase italic">Directorio de Consejos Comunales Integrantes</h3>
             <Users className="h-4 w-4 text-slate-300" />
          </div>
          <div className="overflow-x-auto">
             <table className="w-full text-left">
                <thead>
                   <tr className="border-b border-slate-50">
                      <th className="px-8 py-4 text-[9px] font-black text-slate-400 uppercase italic tracking-widest">Consejo Comunal</th>
                      <th className="px-8 py-4 text-[9px] font-black text-slate-400 uppercase italic tracking-widest text-center">Familias</th>
                      <th className="px-8 py-4 text-[9px] font-black text-slate-400 uppercase italic tracking-widest text-center">Habitantes</th>
                      <th className="px-8 py-4 text-[9px] font-black text-slate-400 uppercase italic tracking-widest">Últ. Act.</th>
                      <th className="px-8 py-4 text-[9px] font-black text-slate-400 uppercase italic tracking-widest">Acciones</th>
                   </tr>
                </thead>
                <tbody>
                   {councils.map((cc, i) => (
                      <tr key={i} className="border-b border-slate-50 last:border-0 hover:bg-slate-50/50 transition-colors group">
                         <td className="px-8 py-5">
                            <span className="text-[11px] font-black text-slate-800 uppercase italic group-hover:text-brand-primary transition-colors">{cc.name}</span>
                         </td>
                         <td className="px-8 py-5 text-center">
                            <span className="text-[11px] font-bold text-slate-600">{cc.families}</span>
                         </td>
                         <td className="px-8 py-5 text-center">
                            <span className="text-[11px] font-bold text-slate-600">{cc.adults + cc.children}</span>
                         </td>
                         <td className="px-8 py-5">
                            <span className="text-[9px] font-black text-brand-primary bg-brand-primary/5 px-2 py-0.5 rounded uppercase">{cc.updated}</span>
                         </td>
                         <td className="px-8 py-5">
                            <button className="text-[9px] font-black text-slate-400 hover:text-brand-primary uppercase underline italic">Auditar Censo</button>
                         </td>
                      </tr>
                   ))}
                </tbody>
             </table>
          </div>
       </div>
    </div>
  );
};

// --- Sections ---

const DashboardHome = ({ 
  user, 
  metrics, 
  ccIntegration, 
  vulnerabilityCount,
  onAction,
  openModal
}: any) => {
  return (
    <div className="space-y-8 pb-12">
      {/* Header & Identity */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
        <div>
           <div className="flex items-center gap-3 mb-2">
              <span className="bg-brand-primary/10 text-brand-primary text-[9px] font-black px-2 py-0.5 rounded uppercase tracking-tighter border border-brand-primary/20">
                SITUR: {user.situr || 'COM-2024-001'}
              </span>
              <div className="flex items-center gap-1.5">
                 <div className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                 <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Estatus Digital: Conectado</span>
              </div>
           </div>
           <h1 className="text-3xl font-black text-slate-800 italic uppercase tracking-tighter leading-none">
             Comuna {user.comunaName || 'Brisas del Oriente'}
           </h1>
           <p className="text-slate-400 text-xs font-bold uppercase tracking-widest mt-2">Central de Operaciones de Autogobierno</p>
        </div>

        <div className="flex gap-4">
           <div className="bg-white rounded-3xl p-4 border border-slate-100 flex items-center gap-4 shadow-sm">
              <div className="h-10 w-10 rounded-2xl bg-amber-50 text-amber-500 flex items-center justify-center">
                 <Scale className="h-5 w-5" />
              </div>
              <div>
                 <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest leading-none">Semáforo Legal</p>
                 <p className="text-[10px] font-black text-slate-800 uppercase mt-1">RIF: <span className="text-emerald-500">Vigente</span></p>
              </div>
           </div>
           <div className="bg-white rounded-3xl p-4 border border-slate-100 flex items-center gap-4 shadow-sm">
              <div className="h-10 w-10 rounded-2xl bg-indigo-50 text-indigo-500 flex items-center justify-center">
                 <Fingerprint className="h-5 w-5" />
              </div>
              <div>
                 <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest leading-none">Parlamento</p>
                 <p className="text-[10px] font-black text-slate-800 uppercase mt-1">Status: <span className="text-emerald-500">Activo</span></p>
              </div>
           </div>
        </div>
      </div>

      {/* KPI Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
         <MetricCard 
           title="Población Total" 
           value={metrics.population} 
           icon={Users} 
           trend="+2.4%" 
           detail="Consolidado de todas las vocerías" 
           color="bg-brand-primary"
           onClick={() => openModal('detail', 'Desglose de Población', { 'Habitantes': metrics.population, 'Hombres': '1,650', 'Mujeres': '1,800', 'Verificados': '95%' })}
         />
         <MetricCard 
           title="Consejos Comunales" 
           value={ccIntegration} 
           icon={Building2} 
           trend="80%" 
           detail="8 de 10 consejos al día" 
           color="bg-slate-800"
           onClick={() => openModal('detail', 'Estatus de Integración', { 'Total Consejos': '10', 'Activos': '8', 'Por Vencer': '2', 'En Silencio': '0' })}
         />
         <MetricCard 
           title="Fondo Comunal" 
           value={metrics.fund} 
           icon={Landmark} 
           trend="+12k" 
           detail="Recursos en tránsito y caja" 
           color="bg-emerald-600"
           onClick={() => openModal('detail', 'Detalle de Fondos', { 'Total en Caja': metrics.fund, 'Asignación CFG': '$30,000', 'Autogestión': '$15,200' })}
         />
         <MetricCard 
           title="Nudos Críticos" 
           value={metrics.criticalNodes} 
           icon={AlertCircle} 
           trend="Consolidados" 
           detail="Incidencias de gran escala" 
           color="bg-rose-500"
           onClick={() => openModal('detail', 'Resumen de Nudos', { 'Total Nudos': metrics.criticalNodes, 'Nivel Crítico': '3', 'En Resolución': '7', 'Pendientes': '2' })}
         />
      </div>

      <div className="grid lg:grid-cols-3 gap-8">
         <TransformersChart />
         <div className="lg:col-span-2">
           <ProjectTimeline />
         </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-8">
         <div className="lg:col-span-2 space-y-8">
            <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-sm p-8 h-[450px] relative overflow-hidden group">
               <div className="absolute inset-0 bg-slate-50 opacity-40" />
               <div className="relative z-10 flex flex-col h-full">
                  <div className="flex items-center justify-between mb-6">
                     <h3 className="text-sm font-black text-slate-800 uppercase italic flex items-center gap-2">
                        <MapIcon className="h-4 w-4 text-brand-primary" /> Poligonal Territorial
                     </h3>
                     <div className="flex gap-2">
                        <span className="bg-emerald-50 text-emerald-600 px-3 py-1 rounded-full text-[8px] font-black uppercase ring-1 ring-emerald-100">C.C. Activos</span>
                        <span className="bg-amber-50 text-amber-600 px-3 py-1 rounded-full text-[8px] font-black uppercase ring-1 ring-amber-100">En Silencio</span>
                     </div>
                  </div>
                  
                  {/* Simulated Map View */}
                  <div className="flex-1 bg-slate-100 rounded-3xl relative border border-slate-200 shadow-inner group-hover:bg-slate-200/50 transition-colors">
                     {/* CC Dots */}
                     <div 
                        onClick={() => openModal('detail', 'C.C. Brisas del Norte', { Estatus: 'Activo', Vocero: 'Juan Pérez', Familias: 120 })}
                        className="absolute top-1/4 left-1/3 h-8 w-8 bg-brand-primary/20 rounded-full animate-ping cursor-pointer hover:bg-brand-primary/40" 
                     />
                     <div className="absolute top-1/4 left-1/3 h-2 w-2 bg-brand-primary rounded-full shadow-lg shadow-brand-primary/50 pointer-events-none" />
                     
                     <div 
                        onClick={() => openModal('detail', 'C.C. El Trigo', { Estatus: 'Activo', Vocero: 'María García', Familias: 85 })}
                        className="absolute top-2/3 right-1/4 h-8 w-8 bg-brand-primary/20 rounded-full animate-ping delay-100 cursor-pointer hover:bg-brand-primary/40" 
                     />
                     <div className="absolute top-2/3 right-1/4 h-2 w-2 bg-brand-primary rounded-full shadow-lg shadow-brand-primary/50 pointer-events-none" />
                     
                     <div className="absolute bottom-10 left-1/2 -translate-x-1/2 bg-white/90 backdrop-blur-md px-4 py-2 rounded-2xl border border-slate-100 shadow-xl flex items-center gap-3">
                        <Info className="h-3 w-3 text-brand-primary" />
                        <span className="text-[8px] font-black text-slate-600 uppercase tracking-widest italic">Haga click en un nodo para ver el estatus del Consejo Comunal</span>
                     </div>
                  </div>
               </div>
            </div>

            {/* Monitoring List */}
            <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-sm overflow-hidden">
               <div className="p-8 border-b border-slate-50 flex items-center justify-between">
                  <h3 className="text-sm font-black text-slate-800 uppercase italic">Monitoreo de Gestión de Proyectos</h3>
                  <button 
                    onClick={() => openModal('detail', 'Consolidado de Proyectos', { Total: 12, En_Ejecucion: 5, Culminados: 4, Paralizados: 3 })}
                    className="text-[9px] font-black text-brand-primary uppercase underline italic"
                  >
                    Ver Consolidado
                  </button>
               </div>
               <div className="p-8 space-y-6">
                  {[
                    { name: 'Electrificación Sector El Valle', progress: 65, type: 'Inversión', status: 'En Ejecución' },
                    { name: 'Red de Aguas Servidas - Troncal 1', progress: 30, type: 'Autogestión', status: 'En Espera' }
                  ].map((p, i) => (
                    <div key={i} className="flex flex-col sm:flex-row sm:items-center gap-6 p-6 rounded-3xl bg-slate-50/50 border border-slate-100 group hover:bg-white hover:shadow-xl hover:shadow-slate-200/20 transition-all">
                       <div className="h-12 w-12 rounded-2xl bg-white border border-slate-100 flex items-center justify-center text-slate-400 group-hover:text-brand-primary transition-colors">
                          <Construction className="h-6 w-6" />
                       </div>
                       <div className="flex-1 space-y-3">
                          <div className="flex items-center justify-between">
                             <h4 className="text-xs font-black text-slate-800 uppercase tracking-tight truncate max-w-[200px] sm:max-w-none italic">"{p.name}"</h4>
                             <span className="text-[8px] font-black px-2 py-0.5 rounded bg-brand-primary/10 text-brand-primary uppercase">{p.status}</span>
                          </div>
                          <div className="flex items-center gap-4">
                             <div className="flex-1 h-1.5 bg-slate-200 rounded-full overflow-hidden">
                                <div className="h-full bg-brand-primary rounded-full transition-all duration-1000" style={{ width: `${p.progress}%` }} />
                             </div>
                             <span className="text-[9px] font-black text-slate-400">{p.progress}%</span>
                          </div>
                       </div>
                       <button 
                         onClick={() => openModal('detail', `Hitos de "${p.name}"`, { Inicio: 'Ene 2024', Fase_I: 'Feb 2024 (100%)', Fase_II: 'Mar 2024 (50%)', Estimado: 'Jun 2024' })}
                         className="sm:w-32 py-3 rounded-xl border border-slate-200 text-[8px] font-black uppercase tracking-widest hover:bg-brand-primary hover:text-white hover:border-brand-primary transition-all"
                       >
                          Ver Hitos
                       </button>
                    </div>
                  ))}
               </div>
            </div>
         </div>

         {/* Sidebar Actions & Stats */}
         <div className="space-y-8">
            <div className="bg-brand-secondary rounded-[2.5rem] p-8 text-white shadow-2xl relative overflow-hidden group">
               <div className="relative z-10 space-y-8">
                  <div>
                    <h3 className="text-xl font-black italic uppercase leading-none tracking-tighter">Alertas de <br/> Vulnerabilidad</h3>
                    <p className="text-[10px] text-cyan-200 font-bold uppercase mt-3 italic tracking-widest">Resumen de Casos de Salud</p>
                  </div>
                  
                  <div className="space-y-4">
                     <div className="flex items-center justify-between p-4 rounded-2xl bg-white/5 border border-white/10">
                        <div className="flex items-center gap-3">
                           <Stethoscope className="h-4 w-4 text-rose-400" />
                           <span className="text-[10px] font-black uppercase">Casos Críticos</span>
                        </div>
                        <span className="text-lg font-black text-rose-400">{vulnerabilityCount}</span>
                     </div>
                     <div className="flex items-center justify-between p-4 rounded-2xl bg-white/5 border border-white/10">
                        <div className="flex items-center gap-3">
                           <Clock className="h-4 w-4 text-cyan-400" />
                           <span className="text-[10px] font-black uppercase">Pendientes Comuna</span>
                        </div>
                        <span className="text-lg font-black text-cyan-400">4</span>
                     </div>
                  </div>

                  <button 
                    onClick={() => openModal('form', 'Atención Directa Vulnerabilidad', { fields: [{ label: 'ID Caso', placeholder: 'Ej. CASO-123' }, { label: 'Acción Tomada', placeholder: 'Ej. Entrega de medicamentos' }], action: 'Registrar Atención' })}
                    className="w-full py-4 rounded-2xl bg-brand-primary text-white text-[10px] font-black uppercase tracking-[0.2em] shadow-xl shadow-brand-primary/20 hover:scale-[1.02] transition-all"
                  >
                    Atención Directa
                  </button>
               </div>
               <div className="absolute top-0 right-0 p-10 opacity-5 -mr-10 group-hover:-mr-5 transition-all">
                  <AlertCircle className="h-40 w-40" />
               </div>
            </div>

            {/* Quick Actions */}
            <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-sm p-8 space-y-6">
               <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4">Acciones Comunas</h3>
               <div className="grid grid-cols-1 gap-3">
                  <ActionButton icon={Plus} label="Nueva Carta Comunal" onClick={() => onAction('new_carta')} />
                  <ActionButton icon={Calendar} label="Convocar Parlamento" onClick={() => onAction('new_convocatoria')} />
                  <ActionButton icon={FileText} label="Reporte de Gestión" onClick={() => onAction('download_report')} />
               </div>
            </div>

            {/* Parliament Feed */}
            <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-sm p-8">
               <div className="flex items-center justify-between mb-6">
                  <h3 className="text-[10px] font-black text-slate-800 uppercase italic">Parlamento</h3>
                  <Clock className="h-3 w-3 text-slate-300" />
               </div>
               <div className="space-y-6">
                  {[1, 2].map(i => (
                    <div 
                      key={i} 
                      onClick={() => openModal('detail', 'Detalle de Sesión', { Acta: `#0${i+14}`, Estatus: 'Aprobada', Fecha: '12 JUN 2024', Temas: 'Normativa de Convivencia' })}
                      className="flex gap-4 group cursor-pointer border-l-2 border-slate-100 pl-4 hover:border-brand-primary transition-colors"
                    >
                       <div className="space-y-1">
                          <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Acta Sesión #0{i+14}</p>
                          <h4 className="text-[10px] font-black text-slate-800 uppercase italic group-hover:text-brand-primary transition-colors">Normativa de Convivencia Territorial</h4>
                          <p className="text-[8px] text-slate-400 font-bold italic tracking-tighter">Aprobado por quórum de 12 voceros</p>
                       </div>
                    </div>
                  ))}
               </div>
            </div>
         </div>
      </div>
    </div>
  );
};

const MetricCard = ({ title, value, icon: Icon, trend, detail, color, onClick }: any) => (
  <div 
    onClick={onClick}
    className="bg-white rounded-[2.5rem] border border-slate-100 shadow-sm p-8 group hover:-translate-y-1 transition-all cursor-pointer"
  >
     <div className="flex items-center justify-between mb-4">
        <div className={cn("h-10 w-10 rounded-2xl flex items-center justify-center text-white shadow-xl transition-transform group-hover:rotate-12", color)}>
           <Icon className="h-5 w-5" />
        </div>
        <div className="flex items-center gap-1">
           <TrendingUp className="h-3 w-3 text-emerald-500" />
           <span className="text-[10px] font-black text-emerald-500">{trend}</span>
        </div>
     </div>
     <div>
        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{title}</p>
        <h4 className="text-2xl font-black text-slate-800 tracking-tighter mt-1">{value}</h4>
        <p className="text-[9px] font-bold text-slate-400 italic mt-2 tracking-tighter">{detail}</p>
     </div>
  </div>
);

const ActionButton = ({ icon: Icon, label, onClick }: any) => (
  <button 
    onClick={onClick}
    className="flex w-full items-center justify-between p-4 rounded-2xl bg-slate-50 border border-slate-100 text-[10px] font-black uppercase tracking-widest text-slate-600 hover:bg-brand-primary hover:text-white transition-all group"
  >
    <div className="flex items-center gap-3">
       <Icon className="h-4 w-4 group-hover:scale-110 transition-transform" />
       <span>{label}</span>
    </div>
    <ChevronRight className="h-3 w-3 opacity-30 group-hover:opacity-100" />
  </button>
);

// --- Main Page Component ---

const SectionHeader = ({ title, subtitle, icon: Icon }: any) => (
  <div className="flex items-center justify-between mb-8">
    <div className="flex items-center gap-4">
      <div className="h-10 w-10 rounded-2xl bg-brand-primary/10 text-brand-primary flex items-center justify-center">
        <Icon className="h-5 w-5" />
      </div>
      <div>
        <h2 className="text-xl font-black text-slate-800 italic uppercase leading-none tracking-tighter">{title}</h2>
        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1.5">{subtitle}</p>
      </div>
    </div>
  </div>
);

export const ComunaDashboard: React.FC<{ user: any }> = ({ user }) => {
  const [activeSection, setActiveSection] = useState('inicio');
  const [isCircuito, setIsCircuito] = useState(true);
  const [isFinishingRegister, setIsFinishingRegister] = useState(false);
  const [registerStep, setRegisterStep] = useState(1);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [lastSync] = useState(new Date());

  const [modalConfig, setModalConfig] = useState({
    isOpen: false,
    type: '',
    data: null,
    title: ''
  });

  const openModal = (type: string, title: string, data: any = null) => {
    setModalConfig({ isOpen: true, type, data, title });
  };

  const closeModal = () => {
    setModalConfig({ ...modalConfig, isOpen: false });
  };

  const navigate = useNavigate();
  const { logout } = useAuth();

  useEffect(() => {
    // Handle responsiveness
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
    // Show registration modal if first-time (simulated)
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
          <DashboardHome 
            user={user} 
            metrics={{ population: '3,450', fund: '$45,200', criticalNodes: '12' }}
            ccIntegration="8/10"
            vulnerabilityCount={5}
            onAction={(action: string) => {
              if (action === 'new_carta') openModal('form', 'Nueva Carta Comunal', { fields: [{ label: 'Título', placeholder: 'Ej. Carta de Convivencia' }, { label: 'Descripción', placeholder: 'Resumen de la normativa' }], action: 'Registrar' });
              if (action === 'new_convocatoria') openModal('form', 'Convocar Parlamento', { fields: [{ label: 'Fecha', type: 'date' }, { label: 'Orden del Día', placeholder: 'Puntos a tratar' }], action: 'Enviar Convocatoria' });
              if (action === 'download_report') openModal('success', 'Generando Reporte', { message: 'El reporte de gestión se está preparando para la descarga.' });
            }}
            openModal={openModal}
          />
        );
      case 'territorio':
      case 'identificacion':
      case 'consejos':
      case 'comites':
      case 'circuitos':
        return (
          <TerritorySocialView 
            user={user} 
            isCircuito={isCircuito} 
            setIsCircuito={setIsCircuito} 
            activeTab={activeSection === 'territorio' ? 'identificacion' : activeSection} 
            onTabChange={setActiveSection}
            openModal={openModal}
          />
        );
      case 'autogobierno':
      case 'parlamento':
      case 'banco':
      case 'contraloria':
      case 'censos':
        return (
          <InstanciasView 
            user={user} 
            isCircuito={isCircuito} 
            activeTab={activeSection === 'autogobierno' ? 'parlamento' : activeSection} 
            onTabChange={setActiveSection}
            openModal={openModal}
          />
        );
      case 'estrategia':
      case 'aca':
      case 'cartas':
        return (
          <PlanificacionEstrategicaView 
            user={user} 
            activeTab={activeSection === 'estrategia' ? 'aca' : activeSection} 
            onTabChange={setActiveSection}
            openModal={openModal}
          />
        );
      case 'proyectos':
      case 'inversion':
      case 'eps':
        return (
          <GestionProyectosView 
            user={user} 
            activeTab={activeSection === 'proyectos' ? 'inversion' : activeSection} 
            onTabChange={setActiveSection}
            openModal={openModal}
          />
        );
      case 'ayuda':
        return (
          <div className="space-y-8">
            <SectionHeader title="Ayuda y Soporte" subtitle="Centro de asistencia digital" icon={LifeBuoy} />
            <div className="grid md:grid-cols-2 gap-8">
               <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm">
                  <h3 className="text-sm font-black text-slate-800 uppercase italic mb-6">Preguntas Frecuentes</h3>
                  <div className="space-y-4">
                     {[
                       '¿Cómo actualizo el censo consolidado?',
                       '¿Cómo reportar un nudo crítico?',
                       'Sincronización con Sistema Patria'
                     ].map((q, i) => (
                        <div 
                          key={i} 
                          onClick={() => openModal('detail', 'Ayuda: ' + q, { Pregunta: q, Respuesta: 'Para gestionar este proceso, diríjase a la sección correspondiente en el menú lateral y siga las instrucciones del módulo digital.', Tutorial: 'Disponible en video' })}
                          className="p-4 rounded-2xl bg-slate-50 border border-slate-100 flex items-center justify-between group cursor-pointer hover:border-brand-primary transition-all"
                        >
                          <span className="text-[10px] font-black text-slate-600 uppercase italic">{q}</span>
                          <ChevronRight className="h-4 w-4 text-slate-300 group-hover:text-brand-primary transition-colors" />
                       </div>
                     ))}
                  </div>
               </div>
               <div className="bg-brand-primary p-8 rounded-[2.5rem] text-white shadow-xl flex flex-col justify-between">
                  <div>
                    <h4 className="text-xl font-black italic uppercase">Soporte Directo</h4>
                    <p className="text-[10px] text-white/70 font-bold uppercase tracking-widest mt-2 leading-relaxed">
                       Atención inmediata para problemas técnicos o dudas sobre la normativa de gobierno comunal.
                    </p>
                  </div>
                  <button 
                    onClick={() => openModal('success', 'Soporte Iniciado', { message: 'Su solicitud de soporte ha sido enviada a la Alcaldía. Un técnico le contactará pronto.' })}
                    className="bg-white text-brand-primary py-4 rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] shadow-xl hover:scale-[1.02] transition-all"
                  >
                    Contactar con Alcaldía
                  </button>
               </div>
            </div>
          </div>
        );
      default:
        return (
          <div className="py-20 text-center space-y-6">
             <div className="h-16 w-16 bg-slate-100 rounded-3xl flex items-center justify-center text-slate-300 mx-auto">
                <Construction className="h-8 w-8" />
             </div>
             <div>
                <h3 className="text-lg font-black text-slate-800 uppercase italic text-slate-800">Sección en proceso</h3>
                <p className="text-xs text-slate-400 font-bold uppercase tracking-widest mt-1">Estamos digitalizando esta área de gestión</p>
             </div>
          </div>
        );
    }
  };

  const menuGroups = [
    { label: "", items: [{ id: "inicio", label: "Inicio", icon: LayoutDashboard }] },
    {
      label: "Organización",
      items: [
        { 
          id: "territorio", 
          label: "Territorio y Social", 
          icon: MapIcon,
          subItems: [
            { label: 'Identificación', id: 'identificacion', onClick: () => setActiveSection('identificacion') },
            { label: 'Consejos Comunales', id: 'consejos', onClick: () => setActiveSection('consejos') },
            { label: 'Comités de Trabajo', id: 'comites', onClick: () => setActiveSection('comites') },
            { label: 'Circuitos Comunales', id: 'circuitos', onClick: () => setActiveSection('circuitos') },
          ]
        },
      ],
    },
    {
      label: "Autogobierno",
      items: [
        {
          id: "autogobierno",
          label: "Instancias de Gobierno",
          icon: ShieldCheck,
          badge: isCircuito ? 'Restringido' : 'Habilitado',
          subItems: [
            { label: 'Parlamento Comunal', id: 'parlamento', onClick: () => !isCircuito && setActiveSection('parlamento') },
            { label: 'Banco de la Comuna', id: 'banco', onClick: () => !isCircuito && setActiveSection('banco') },
            { label: 'Consejo Contraloría', id: 'contraloria', onClick: () => !isCircuito && setActiveSection('contraloria') },
            { label: 'Consolidado de Censos', id: 'censos', onClick: () => setActiveSection('censos') },
          ].map(si => ({
            ...si,
            label: isCircuito && si.id !== 'censos' ? `${si.label} (Bloqueado)` : si.label,
          }))
        },
      ],
    },
    {
      label: "Planificación",
      items: [
        {
          id: "estrategia",
          label: "P. Estratégica",
          icon: Target,
          subItems: [
            { label: 'ACA Comunal', id: 'aca', onClick: () => setActiveSection('aca') },
            { label: 'Cartas Comunales', id: 'cartas', onClick: () => setActiveSection('cartas') },
          ]
        }
      ]
    },
    {
      label: "Proyectos",
      items: [
        {
          id: "proyectos",
          label: "G. Proyectos",
          icon: Briefcase,
          subItems: [
            { label: 'P. Inversión', id: 'inversion', onClick: () => setActiveSection('inversion') },
            { label: 'EPS', id: 'eps', onClick: () => setActiveSection('eps') },
          ]
        }
      ]
    },
    {
      label: "Soporte",
      items: [
        { id: 'ayuda', label: 'Ayuda y Soporte', icon: LifeBuoy }
      ]
    }
  ];

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const Sidebar = () => (
    <aside
      className={cn(
        "fixed inset-y-0 left-0 z-40 bg-white border-r border-gray-100 transition-all duration-300 ease-in-out lg:static lg:block",
        isSidebarOpen ? "w-80" : "w-20",
        isMobileMenuOpen
          ? "translate-x-0"
          : "-translate-x-full lg:translate-x-0",
      )}
    >
      <div className="h-full flex flex-col">
        {/* Sidebar Header */}
        <div className="p-6 flex items-center justify-between border-b border-gray-50 shrink-0">
          <div
            className={cn(
              "flex items-center gap-3 overflow-hidden transition-all",
              !isSidebarOpen && "lg:hidden",
            )}
          >
            <div className="h-10 w-10 rounded-2xl bg-brand-primary flex items-center justify-center text-white shadow-xl shadow-brand-primary/20 shrink-0">
              <Building2 className="h-6 w-6" />
            </div>
            {isSidebarOpen && (
               <div>
                  <span className="text-sm font-black tracking-tighter text-slate-800 uppercase italic leading-none block">Comuna Carrizal</span>
                  <p className="text-[9px] font-bold text-slate-400 uppercase tracking-[0.2em] mt-0.5 whitespace-nowrap">Control Territorial</p>
               </div>
            )}
          </div>
          <button
            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
            className="hidden lg:flex p-1.5 rounded-xl hover:bg-gray-100 text-slate-400"
          >
            <Menu className="h-4 w-4" />
          </button>
        </div>

        {/* Navigation Items */}
        <div className="flex-1 overflow-y-auto py-6 px-4 space-y-8 custom-scrollbar">
          {menuGroups.map((group, gIdx) => (
            <div key={gIdx} className="space-y-1">
              {group.label && isSidebarOpen && (
                <p className="px-3 text-[9px] font-black text-slate-300 uppercase tracking-[0.2em] mb-3">
                  {group.label}
                </p>
              )}
              <div className="space-y-1">
                 {group.items.map((item) => (
                    <SidebarItem 
                       key={item.id}
                       icon={item.icon}
                       label={item.label}
                       active={activeSection === item.id || (item.subItems && item.subItems.some(si => si.id === activeSection))}
                       onClick={() => {
                          setActiveSection(item.id);
                          if (!item.subItems && window.innerWidth < 1024) setIsMobileMenuOpen(false);
                       }}
                       badge={item.badge}
                       subItems={item.subItems?.map(si => ({
                          ...si,
                          active: activeSection === si.id,
                          onClick: () => {
                             si.onClick?.();
                             if (window.innerWidth < 1024) setIsMobileMenuOpen(false);
                          }
                       }))}
                       isCollapsed={!isSidebarOpen}
                    />
                 ))}
              </div>
            </div>
          ))}
        </div>

        {/* Sidebar Footer */}
        <div className="p-6 border-t border-gray-50 space-y-4 shrink-0">
           {isSidebarOpen ? (
              <>
                 <div className="flex items-center gap-4 p-4 rounded-3xl bg-slate-50 border border-slate-100">
                    <div className="h-10 w-10 rounded-2xl bg-white border border-slate-100 flex items-center justify-center text-slate-400 shadow-sm">
                       <Users className="h-5 w-5" />
                    </div>
                    <div className="flex-1 min-w-0">
                       <p className="text-[10px] font-black text-slate-800 truncate italic uppercase">{user.firstName} {user.lastName}</p>
                       <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest mt-0.5">Coordinador Principal</p>
                    </div>
                 </div>
                 <button 
                   onClick={handleLogout}
                   className="flex w-full items-center gap-3 px-6 py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest text-rose-500 hover:bg-rose-50 transition-all group"
                 >
                   <LogOut className="h-5 w-5 text-rose-400 group-hover:text-rose-600" />
                   <span>Cerrar Sesión Digital</span>
                 </button>
                 <div className="text-center">
                    <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-50 border border-slate-100">
                       <div className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                       <span className="text-[8px] font-black text-slate-500 uppercase tracking-widest">Sincronizado: {lastSync.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                    </div>
                 </div>
              </>
           ) : (
              <div className="flex flex-col items-center gap-4">
                 <button onClick={handleLogout} className="p-3 rounded-xl text-rose-400 hover:bg-rose-50 transition-all border border-transparent hover:border-rose-100 bg-white shadow-sm">
                    <LogOut className="h-5 w-5" />
                 </button>
                 <div className="h-2 w-2 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.8)]" />
              </div>
           )}
        </div>
      </div>
    </aside>
  );

  return (
    <div className="flex bg-[#fcfdfe] min-h-screen relative overflow-hidden text-slate-800">
      {/* Mobile Backdrop */}
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

      <Sidebar />

      <main className="flex-1 w-full lg:max-w-[calc(100vw-80px)] overflow-hidden">
         <DashboardNavbar 
           user={user}
           title={isCircuito ? `Circuito: ${user.comunaName || 'Brisas'}` : `Comuna: ${user.comunaName || 'Brisas'}`}
           subtitle="CENTRAL DE OPERACIONES DE AUTOGOBIERNO"
           onMobileMenuOpen={() => setIsMobileMenuOpen(true)}
           roleIcon={<Building2 size={24} />}
           actions={
             <div className="flex items-center gap-3">
                <button 
                  onClick={() => openModal('success', 'Sincronización Exitosa', { message: 'Los datos han sido sincronizados correctamente con la plataforma Patria.' })}
                  className="flex items-center gap-2 px-4 py-2 bg-brand-primary/10 text-brand-primary rounded-xl hover:bg-brand-primary/20 transition-all font-bold text-[10px] uppercase shadow-sm border border-brand-primary/10"
                >
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

      {/* Finishing Registration Modal */}
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
                  {/* Modal Sidebar */}
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

                  {/* Modal Content */}
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
      <DashboardModal config={modalConfig} onClose={closeModal} />
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
