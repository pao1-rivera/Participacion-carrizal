import React from 'react';
import { 
  Building2, 
  Users, 
  Landmark, 
  AlertCircle, 
  TrendingUp, 
  Clock, 
  Construction, 
  Map as MapIcon, 
  Info,
  Scale,
  Fingerprint,
  Plus,
  Calendar,
  FileText,
  ChevronRight,
  Stethoscope
} from "lucide-react";
import { motion } from 'framer-motion';
import { cn } from "@/app/lib/utils";

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
          <TrendingUp className="h-4 w-4 text-slate-300" />
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
                     {m.status === 'completed' ? <CheckCircle className="h-4 w-4" /> : <span className="text-[8px] font-black">{i+1}</span>}
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

const CheckCircle = ({ className }: { className?: string }) => (
  <svg 
    xmlns="http://www.w3.org/2000/svg" 
    width="24" 
    height="24" 
    viewBox="0 0 24 24" 
    fill="none" 
    stroke="currentColor" 
    strokeWidth="2" 
    strokeLinecap="round" 
    strokeLinejoin="round" 
    className={className}
  >
    <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
    <polyline points="22 4 12 14.01 9 11.01" />
  </svg>
);

export const DashboardOverview = ({ 
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
