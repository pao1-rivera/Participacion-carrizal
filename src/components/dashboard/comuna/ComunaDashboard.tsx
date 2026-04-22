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
  Menu
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '../../../lib/utils';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../../context/AuthContext';

// --- Components ---

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
  onAction 
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
         />
         <MetricCard 
           title="Consejos Comunales" 
           value={ccIntegration} 
           icon={Building2} 
           trend="80%" 
           detail="8 de 10 consejos al día" 
           color="bg-slate-800"
         />
         <MetricCard 
           title="Fondo Comunal" 
           value={metrics.fund} 
           icon={Landmark} 
           trend="+12k" 
           detail="Recursos en tránsito y caja" 
           color="bg-emerald-600"
         />
         <MetricCard 
           title="Nudos Críticos" 
           value={metrics.criticalNodes} 
           icon={AlertCircle} 
           trend="Consolidados" 
           detail="Incidencias de gran escala" 
           color="bg-rose-500"
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
                     <div className="absolute top-1/4 left-1/3 h-8 w-8 bg-brand-primary/20 rounded-full animate-ping" />
                     <div className="absolute top-1/4 left-1/3 h-2 w-2 bg-brand-primary rounded-full shadow-lg shadow-brand-primary/50" />
                     
                     <div className="absolute top-2/3 right-1/4 h-8 w-8 bg-brand-primary/20 rounded-full animate-ping delay-100" />
                     <div className="absolute top-2/3 right-1/4 h-2 w-2 bg-brand-primary rounded-full shadow-lg shadow-brand-primary/50" />
                     
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
                  <button className="text-[9px] font-black text-brand-primary uppercase underline italic">Ver Consolidado</button>
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
                       <button className="sm:w-32 py-3 rounded-xl border border-slate-200 text-[8px] font-black uppercase tracking-widest hover:bg-brand-primary hover:text-white hover:border-brand-primary transition-all">
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

                  <button className="w-full py-4 rounded-2xl bg-brand-primary text-white text-[10px] font-black uppercase tracking-[0.2em] shadow-xl shadow-brand-primary/20 hover:scale-[1.02] transition-all">
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
                    <div key={i} className="flex gap-4 group cursor-pointer border-l-2 border-slate-100 pl-4 hover:border-brand-primary transition-colors">
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

const MetricCard = ({ title, value, icon: Icon, trend, detail, color }: any) => (
  <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-sm p-8 group hover:-translate-y-1 transition-all">
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
            onAction={(action: string) => console.log('Action:', action)}
          />
        );
      case 'identificacion':
        return (
          <div className="space-y-8">
            <SectionHeader title="Identificación Comunal" subtitle="Expediente legal y territorial" icon={Fingerprint} />
            <div className="grid md:grid-cols-2 gap-8">
               <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm">
                  <h3 className="text-sm font-black text-slate-800 uppercase italic mb-6">Datos Generales</h3>
                  <div className="space-y-4">
                     <div>
                        <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Nombre Oficial</p>
                        <p className="text-sm font-black text-slate-800 italic uppercase">Comuna {user.comunaName || 'Brisas del Oriente'}</p>
                     </div>
                     <div>
                        <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">RIF</p>
                        <p className="text-sm font-black text-slate-800 uppercase">J-40345678-0</p>
                     </div>
                     <div>
                        <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Código SITUR</p>
                        <p className="text-sm font-black text-slate-800 uppercase">COM-2024-001</p>
                     </div>
                  </div>
               </div>
               <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm flex items-center justify-center border-dashed border-2">
                  <div className="text-center">
                     <MapIcon className="h-10 w-10 text-slate-200 mx-auto mb-4" />
                     <p className="text-[10px] font-black text-slate-400 uppercase italic">Poligonal Territorial en Proceso</p>
                  </div>
               </div>
            </div>
          </div>
        );
      case 'consejos':
        return <CensusConsolidated />;
      case 'parlamento':
        return (
          <div className="space-y-8">
            <SectionHeader title="Parlamento Comunal" subtitle="Sistema de toma de decisiones" icon={Fingerprint} />
            <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm">
               <div className="flex items-center justify-between mb-8">
                  <h3 className="text-sm font-black text-slate-800 uppercase italic">Sesiones Recientes</h3>
                  <button className="flex items-center gap-2 px-4 py-2 rounded-xl bg-brand-primary text-white text-[10px] font-black uppercase tracking-widest">Nueva Sesión</button>
               </div>
               <div className="space-y-4">
                  {[1, 2, 3].map(i => (
                    <div key={i} className="p-4 rounded-2xl bg-slate-50 border border-slate-100 flex items-center justify-between">
                       <div className="flex items-center gap-4">
                          <div className="h-10 w-10 rounded-xl bg-white border border-slate-100 flex items-center justify-center text-slate-400">
                             <FileText className="h-5 w-5" />
                          </div>
                          <div>
                             <p className="text-[10px] font-black text-slate-800 uppercase italic">Acta de Sesión Ordinaria #0{i+12}</p>
                             <p className="text-[8px] font-bold text-slate-400 uppercase">12 May 2024 • Aprobado por Quórum</p>
                          </div>
                       </div>
                       <button className="text-[9px] font-black text-brand-primary uppercase underline">Descargar</button>
                    </div>
                  ))}
               </div>
            </div>
          </div>
        );
      case 'banco':
        return (
          <div className="space-y-8">
            <SectionHeader title="Banco de la Comuna" subtitle="Gestión de recursos y UPF" icon={Landmark} />
            <div className="grid md:grid-cols-3 gap-6">
               <div className="bg-brand-secondary p-8 rounded-[2.5rem] text-white shadow-xl col-span-2">
                  <p className="text-[10px] font-black text-cyan-200 uppercase tracking-widest mb-2">Fondo Comunal Consolidado</p>
                  <h4 className="text-4xl font-black italic tracking-tighter">$45,200.00</h4>
                  <div className="mt-8 flex gap-4">
                     <button className="bg-brand-primary px-6 py-2 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all hover:scale-105">Tarjeta de Operaciones</button>
                     <button className="bg-white/10 px-6 py-2 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all hover:bg-white/20 border border-white/10">Estado de Cuenta</button>
                  </div>
               </div>
               <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm flex flex-col justify-between">
                  <div>
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">UPF Registradas</p>
                    <h4 className="text-2xl font-black text-slate-800 italic">14 Unidades</h4>
                  </div>
                  <button className="w-full py-3 rounded-xl border border-slate-100 text-[9px] font-black uppercase text-slate-600 hover:bg-slate-50 transition-all">Gestionar UPF</button>
               </div>
            </div>
          </div>
        );
      case 'aca':
        return (
          <div className="space-y-8">
            <SectionHeader title="Agenda Concreta de Acción" subtitle="Prioridades y nudos críticos 7T" icon={Target} />
            <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-sm overflow-hidden">
               <table className="w-full text-left">
                  <thead>
                     <tr className="border-b border-slate-50">
                        <th className="px-8 py-4 text-[9px] font-black text-slate-400 uppercase italic">Nudo Crítico</th>
                        <th className="px-8 py-4 text-[9px] font-black text-slate-400 uppercase italic">Transformación</th>
                        <th className="px-8 py-4 text-[9px] font-black text-slate-400 uppercase italic">Avance</th>
                        <th className="px-8 py-4 text-[9px] font-black text-slate-400 uppercase italic text-center">Estatus</th>
                     </tr>
                  </thead>
                  <tbody>
                     {[
                       { task: 'Falla Transformadores Sector Central', t: 'T2: Servicios', progress: 45, status: 'En Ejecución' },
                       { task: 'Déficit de Medicinas Crónicas', t: 'T4: Social', progress: 90, status: 'Por Culminar' },
                       { task: 'Muro de Contención Vereda 3', t: 'T3: Infraestructura', progress: 10, status: 'En Espera' }
                     ].map((row, i) => (
                       <tr key={i} className="border-b border-slate-50 last:border-0 hover:bg-slate-50/50 transition-colors">
                          <td className="px-8 py-5">
                             <span className="text-[11px] font-black text-slate-800 uppercase italic">{row.task}</span>
                          </td>
                          <td className="px-8 py-5">
                             <span className="text-[10px] font-bold text-slate-400 uppercase">{row.t}</span>
                          </td>
                          <td className="px-8 py-5">
                             <div className="flex items-center gap-3">
                                <div className="flex-1 h-1 bg-slate-100 rounded-full">
                                   <div className="h-full bg-brand-primary" style={{ width: `${row.progress}%` }} />
                                </div>
                                <span className="text-[10px] font-black text-slate-400">{row.progress}%</span>
                             </div>
                          </td>
                          <td className="px-8 py-5 text-center">
                             <span className={cn(
                               "text-[8px] font-black px-2 py-0.5 rounded-full uppercase",
                               row.status === 'En Ejecución' ? 'bg-amber-50 text-amber-600 border border-amber-100' :
                               row.status === 'Por Culminar' ? 'bg-emerald-50 text-emerald-600 border border-emerald-100' : 'bg-slate-100 text-slate-400'
                             )}>{row.status}</span>
                          </td>
                       </tr>
                     ))}
                  </tbody>
               </table>
            </div>
          </div>
        );
      case 'circuitos':
        return (
          <div className="space-y-8">
            <SectionHeader title="Circuitos Comunales" subtitle="Nuevas formas de agregación" icon={Building2} />
            <div className="bg-white p-10 rounded-[3rem] border border-slate-100 shadow-sm text-center space-y-6">
               <div className="h-20 w-20 rounded-full bg-brand-primary/10 text-brand-primary flex items-center justify-center mx-auto">
                  <Building2 className="h-10 w-10" />
               </div>
               <div className="max-w-md mx-auto space-y-4">
                  <h3 className="text-xl font-black text-slate-800 uppercase italic">Estatus de Circuito Comunal</h3>
                  <p className="text-xs text-slate-400 font-bold uppercase tracking-widest leading-relaxed">
                     Actualmente su organización está configurada como {isCircuito ? 'CIRCUITO COMUNAL' : 'COMUNA TRADICIONAL'}. Esto afecta las instancias de gobierno disponibles.
                  </p>
                  <button 
                    onClick={() => setIsCircuito(!isCircuito)}
                    className="mt-6 px-10 py-4 rounded-2xl bg-slate-800 text-white text-[10px] font-black uppercase tracking-widest hover:bg-brand-primary transition-all"
                  >
                    Cambiar a {isCircuito ? 'Comuna' : 'Circuito'}
                  </button>
               </div>
            </div>
          </div>
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
                       <div key={i} className="p-4 rounded-2xl bg-slate-50 border border-slate-100 flex items-center justify-between group cursor-pointer hover:border-brand-primary transition-all">
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
                  <button className="bg-white text-brand-primary py-4 rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] shadow-xl hover:scale-[1.02] transition-all">Contactar con Alcaldía</button>
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
          label: "Territorio y Org.", 
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
          label: "Estructura Base",
          icon: ShieldCheck,
          badge: isCircuito ? 'Restringido' : 'Full',
          subItems: [
            { label: 'Parlamento Comunal', id: 'parlamento', onClick: () => setActiveSection('parlamento') },
            { label: 'Banco de la Comuna', id: 'banco', onClick: () => setActiveSection('banco') },
            { label: 'Consejo Contraloría', id: 'contraloria', onClick: () => setActiveSection('contraloria') },
            { label: 'Censos Consolidados', id: 'censos', onClick: () => setActiveSection('censos') },
          ]
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
                          if (!item.subItems) {
                             setActiveSection(item.id);
                             if (window.innerWidth < 1024) setIsMobileMenuOpen(false);
                          }
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
         {/* Mobile Header Bar */}
         <div className="lg:hidden p-4 flex items-center justify-between border-b border-gray-100 bg-white sticky top-0 z-[60]">
            <button onClick={() => setIsMobileMenuOpen(true)} className="p-2 -ml-2 rounded-xl hover:bg-gray-50 flex items-center gap-2">
               <Menu className="h-6 w-6 text-slate-600" />
            </button>
            <div className="flex flex-col items-center">
               <h2 className="text-[10px] font-black text-slate-800 uppercase italic leading-none tracking-tighter">Comuna Carrizal</h2>
               <div className="flex items-center gap-1 mt-1">
                  <div className="h-1 w-1 rounded-full bg-emerald-500" />
                  <span className="text-[7px] font-black text-slate-400 uppercase tracking-[0.2em]">{isCircuito ? 'Circuito' : 'Comuna'}</span>
               </div>
            </div>
            <div className="h-10 w-10 rounded-2xl bg-brand-primary/10 flex items-center justify-center text-brand-primary shrink-0 transition-transform active:scale-95">
               <Building2 className="h-5 w-5" />
            </div>
         </div>

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
