'use client';

import React from 'react';
import { 
  History, 
  Search, 
  Filter, 
  Calendar, 
  ArrowRight,
  FileCheck,
  Building2,
  Users,
  Briefcase,
  ExternalLink,
  Timeline
} from 'lucide-react';
import { motion } from 'framer-motion';
import { cn } from '@/app/lib/utils';

export const HistoricoGestion = () => {
  const historyEvents = [
    { 
      date: '12 Mayo, 2026', 
      time: '09:45 AM',
      event: 'Cierre de Auditoría Q1', 
      type: 'Financiero',
      desc: 'Finalizada la auditoría de los 28 proyectos de la Sala de Autogobierno 1.',
      icon: FileCheck,
      color: 'bg-emerald-500'
    },
    { 
      date: '10 Mayo, 2026', 
      time: '02:30 PM',
      event: 'Nueva Comuna Registrada', 
      type: 'Territorial',
      desc: 'Inscripción oficial de la Comuna "Fuerza Unida" en el sistema SITUR.',
      icon: Building2,
      color: 'bg-indigo-500'
    },
    { 
      date: '08 Mayo, 2026', 
      time: '11:15 AM',
      event: 'Cambio de Director', 
      type: 'Administrativo',
      desc: 'Nombramiento de la Lic. Ana Valencia como Directora de Digitalización.',
      icon: Users,
      color: 'bg-blue-500'
    },
    { 
      date: '05 Mayo, 2026', 
      time: '04:00 PM',
      event: 'Aprobación Presupuestaria', 
      type: 'Gestión',
      desc: 'Asignación de recursos para la II Fase del Plan de Atención al Adulto Mayor.',
      icon: Briefcase,
      color: 'bg-brand-primary'
    },
  ];

  return (
    <motion.div 
      initial={{ opacity: 0, x: 10 }}
      animate={{ opacity: 1, x: 0 }}
      className="space-y-8 pb-12"
    >
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-black text-slate-900 uppercase tracking-tighter italic">Histórico de Gestión</h2>
          <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mt-1">Línea de Tiempo y Bitácora de Acciones Gubernamentales</p>
        </div>
        <div className="flex gap-3">
           <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-300" size={14} />
              <input type="text" placeholder="Buscar en la bitácora..." className="pl-9 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl text-xs font-bold shadow-sm outline-none w-64" />
           </div>
           <button className="p-2.5 bg-white border border-slate-200 rounded-xl text-slate-400 hover:text-slate-900 transition-colors">
              <Filter size={18} />
           </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
         <div className="lg:col-span-3 space-y-4">
            <div className="flex items-center gap-3 mb-6">
               <Calendar className="text-slate-300" size={18} />
               <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] italic">Actividad Reciente - Mayo 2026</h3>
            </div>

            <div className="space-y-6 relative ml-4">
               {/* Timeline Line */}
               <div className="absolute left-0 top-0 bottom-0 w-px bg-slate-100" />

               {historyEvents.map((event, i) => (
                  <div key={i} className="relative pl-10 group">
                     {/* Timeline Dot */}
                     <div className={cn("absolute left-1 top-4 w-2 h-2 rounded-full border-2 border-white ring-4 transition-all group-hover:scale-125", 
                        event.color === 'bg-emerald-500' ? 'bg-emerald-500 ring-emerald-50' : 
                        event.color === 'bg-indigo-500' ? 'bg-indigo-500 ring-indigo-50' :
                        event.color === 'bg-blue-500' ? 'bg-blue-500 ring-blue-50' : 'bg-brand-primary ring-brand-primary/10'
                     )} />

                     <div className="bg-white p-6 rounded-4xl border border-slate-100 shadow-sm group-hover:border-slate-300 transition-all flex items-start gap-6">
                        <div className={cn("w-14 h-14 rounded-2xl flex items-center justify-center text-white shrink-0 shadow-lg shadow-black/5", event.color)}>
                           <event.icon size={24} />
                        </div>
                        <div className="flex-1">
                           <div className="flex items-center justify-between mb-2">
                              <div>
                                 <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">{event.date} • {event.time}</span>
                                 <h4 className="text-sm font-black text-slate-900 uppercase italic tracking-tighter mt-1">{event.event}</h4>
                              </div>
                              <span className="px-2 py-1 bg-slate-50 border border-slate-100 rounded-lg text-[8px] font-black text-slate-400 uppercase">{event.type}</span>
                           </div>
                           <p className="text-xs text-slate-500 font-medium leading-relaxed max-w-2xl">{event.desc}</p>
                           <button className="flex items-center gap-2 mt-4 text-[9px] font-black text-brand-primary uppercase tracking-widest hover:translate-x-1 transition-transform group-hover:underline">
                              Ver Detalles Completos <ArrowRight size={12} />
                           </button>
                        </div>
                     </div>
                  </div>
               ))}
               
               <div className="pt-8 text-center ml-10">
                  <button className="px-8 py-3 bg-slate-900 text-white rounded-2xl text-[9px] font-black uppercase tracking-widest shadow-xl shadow-slate-900/10 hover:scale-[1.02] transition-all">
                     Cargar Historial más Antiguo
                  </button>
               </div>
            </div>
         </div>

         <div className="space-y-6">
            <div className="bg-slate-50 p-8 rounded-[40px] border border-slate-100">
               <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest italic mb-6 leading-none">Resumen de Actividad Mensual</h4>
               <div className="space-y-4">
                  {[
                    { label: 'Cambios de Status', val: '42', color: 'text-indigo-500' },
                    { label: 'Nuevos Registros', val: '128', color: 'text-emerald-500' },
                    { label: 'Firmas de Proyectos', val: '15', color: 'text-brand-primary' },
                    { label: 'Auditorías', val: '04', color: 'text-blue-500' },
                  ].map((stat, i) => (
                    <div key={i} className="flex items-center justify-between p-3 bg-white border border-slate-100 rounded-2xl">
                       <span className="text-[9px] font-black text-slate-400 uppercase">{stat.label}</span>
                       <span className={cn("text-sm font-black italic", stat.color)}>{stat.val}</span>
                    </div>
                  ))}
               </div>
            </div>

            <div className="bg-brand-primary p-8 rounded-[40px] text-white overflow-hidden relative group">
               <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:rotate-12 transition-transform">
                  <History size={120} />
               </div>
               <div className="relative z-10">
                  <h4 className="text-lg font-black italic uppercase tracking-tighter leading-tight mb-4">Exportación de Bitácora Forense</h4>
                  <p className="text-[10px] text-white/70 font-medium uppercase tracking-widest mb-8 leading-relaxed">
                     Descargue el reporte íntegro de todas las modificaciones realizadas en el sistema para fines de rendición legal.
                  </p>
                  <button className="w-full py-3 bg-white/10 hover:bg-white/20 border border-white/20 rounded-xl flex items-center justify-center gap-2 text-[10px] font-black uppercase tracking-widest transition-all">
                     <ExternalLink size={16} /> Generar Reporte Legal
                  </button>
               </div>
            </div>
         </div>
      </div>
    </motion.div>
  );
};