'use client';

import React from 'react';
import { 
  Wallet, 
  ArrowUpRight, 
  ArrowDownLeft, 
  History, 
  CheckCircle2, 
  Clock, 
  AlertCircle,
  FileText,
  BarChart3,
  TrendingUp,
  Briefcase
} from 'lucide-react';
import { motion } from 'framer-motion';
import { cn } from '@/app/lib/utils';

export const GestionRecursos = () => {
  const projects = [
    { title: 'Rehabilitación Plaza Bolívar', budget: '$45,000', progress: 75, status: 'Ejecutando', source: 'CFG' },
    { title: 'Red de Alumbrado Comunal', budget: '$12,200', progress: 100, status: 'Finalizado', source: 'FCI' },
    { title: 'Comedor Los Abuelos', budget: '$32,000', progress: 15, status: 'Por Iniciar', source: 'Directo' },
    { title: 'Dotación de Ayudas Técnicas', budget: '$8,500', progress: 45, status: 'Ejecutando', source: 'CFG' },
  ];

  return (
    <motion.div 
      initial={{ opacity: 0, scale: 0.98 }}
      animate={{ opacity: 1, scale: 1 }}
      className="space-y-8"
    >
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-black text-slate-900 uppercase tracking-tighter italic">Gestión de Recursos</h2>
          <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mt-1">Control Presupuestario y Ejecución de Proyectos</p>
        </div>
        <div className="flex gap-3">
           <button className="px-6 py-2.5 bg-white border border-slate-200 rounded-xl text-[10px] font-black text-slate-900 uppercase tracking-widest hover:bg-slate-50 transition-all">
             Auditores Externos
           </button>
           <button className="px-6 py-2.5 bg-brand-primary text-white rounded-xl text-[10px] font-black uppercase tracking-widest shadow-xl shadow-brand-primary/20 hover:scale-[1.02] transition-all">
             Nueva Solicitud Presupuestaria
           </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {/* Presupuesto Card */}
        <div className="lg:col-span-1 bg-slate-900 p-8 rounded-[40px] text-white flex flex-col justify-between relative overflow-hidden">
           <div className="absolute top-0 right-0 p-8 opacity-10">
              <Wallet size={80} />
           </div>
           <div className="relative z-10">
              <p className="text-[10px] font-black uppercase tracking-widest text-brand-primary mb-2">Presupuesto Ejecutable</p>
              <h3 className="text-4xl font-black italic tracking-tighter">$1.2M</h3>
              <p className="text-[10px] text-white/50 font-bold uppercase mt-2 tracking-widest italic">Aprobado Q2 2026</p>
           </div>
           <div className="relative z-10 mt-12 grid grid-cols-2 gap-4">
              <div className="p-4 bg-white/5 border border-white/10 rounded-2xl">
                 <div className="flex items-center gap-2 mb-2">
                    <ArrowUpRight className="text-emerald-500" size={14} />
                    <span className="text-[8px] font-black uppercase">Ejecutado</span>
                 </div>
                 <p className="text-sm font-black italic font-mono">$842k</p>
              </div>
              <div className="p-4 bg-white/5 border border-white/10 rounded-2xl">
                 <div className="flex items-center gap-2 mb-2">
                    <ArrowDownLeft className="text-brand-primary" size={14} />
                    <span className="text-[8px] font-black uppercase">Remanente</span>
                 </div>
                 <p className="text-sm font-black italic font-mono">$358k</p>
              </div>
           </div>
        </div>

        {/* Dashboard de Ejecución Card */}
        <div className="lg:col-span-2 bg-white p-8 rounded-[40px] border border-slate-100 shadow-sm flex flex-col justify-between">
           <div className="flex items-center justify-between mb-8">
              <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest italic">Análisis de Ejecución Física</h4>
              <div className="flex gap-2">
                 <div className="flex items-center gap-1.5 px-3 py-1 bg-emerald-50 rounded-lg text-emerald-600 text-[8px] font-black uppercase border border-emerald-100">
                    Sincronizado
                 </div>
                 <TrendingUp size={20} className="text-brand-primary" />
              </div>
           </div>

           <div className="grid grid-cols-2 lg:grid-cols-4 gap-8">
              {[
                 { label: 'Proyectos Activos', val: '12', color: 'emerald' },
                 { label: 'Por Validar', val: '04', color: 'amber' },
                 { label: 'Culminados', val: '28', color: 'blue' },
                 { label: 'Estatus Audit.', val: '100%', color: 'indigo' },
              ].map((kpi, i) => (
                 <div key={i} className="text-center group">
                    <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-2 group-hover:text-slate-900 transition-colors">{kpi.label}</p>
                    <p className="text-2xl font-black text-slate-900 italic tracking-tighter underline underline-offset-8 decoration-slate-100 group-hover:decoration-brand-primary transition-all">{kpi.val}</p>
                 </div>
              ))}
           </div>

           <div className="mt-12 pt-8 border-t border-slate-50 flex items-center justify-between">
              <div className="flex items-center gap-3">
                 <Clock size={16} className="text-slate-300" />
                 <p className="text-[9px] text-slate-400 font-bold uppercase tracking-widest">Última Conciliación Bancaria: Hoy - 09:45 AM</p>
              </div>
              <button className="text-[10px] font-black text-brand-primary uppercase tracking-widest italic hover:underline">Ver Libro Diario</button>
           </div>
        </div>
      </div>

      {/* Bandeja de Proyectos */}
      <div className="bg-white rounded-[40px] border border-slate-100 shadow-sm overflow-hidden">
         <div className="p-8 border-b border-slate-50 flex items-center justify-between bg-slate-50/30">
            <div className="flex items-center gap-3">
               <Briefcase size={20} className="text-brand-primary" />
               <h4 className="text-[10px] font-black text-slate-900 uppercase tracking-[0.2em] italic">Control de Ejecución de Obras 7T</h4>
            </div>
            <button className="flex items-center gap-2 text-[9px] font-black text-slate-400 uppercase hover:text-slate-900 tracking-widest">
               <FileText size={16} /> Descargar Auditoría PDF
            </button>
         </div>

         <div className="p-4 overflow-x-auto whitespace-nowrap">
            <table className="w-full text-[10px] font-bold uppercase tracking-widest">
               <thead>
                  <tr className="border-b border-slate-50">
                     <th className="px-6 py-4 text-left text-slate-400 italic">Proyecto</th>
                     <th className="px-6 py-4 text-left text-slate-400 italic">Financiamiento</th>
                     <th className="px-6 py-4 text-left text-slate-400 italic">Estatus</th>
                     <th className="px-6 py-4 text-left text-slate-400 italic">Costo Estimado</th>
                     <th className="px-6 py-4 text-right text-slate-400 italic">Progreso Física</th>
                  </tr>
               </thead>
               <tbody className="divide-y divide-slate-50">
                  {projects.map((proj, i) => (
                     <tr key={i} className="hover:bg-slate-50/50 transition-colors">
                        <td className="px-6 py-6">
                           <span className="block text-slate-900 font-black text-xs">{proj.title}</span>
                           <span className="text-[8px] text-slate-400">{proj.source}</span>
                        </td>
                        <td className="px-6 py-6 font-mono text-slate-500">PROY-{i+124}-BC</td>
                        <td className="px-6 py-6">
                           <span className={cn(
                              "px-2 py-1 rounded-lg text-[8px] font-black",
                              proj.status === 'Finalizado' ? 'bg-emerald-50 text-emerald-600' :
                              proj.status === 'Ejecutando' ? 'bg-blue-50 text-blue-600' : 'bg-slate-100 text-slate-400'
                           )}>{proj.status}</span>
                        </td>
                        <td className="px-6 py-6 text-slate-900 font-black italic">{proj.budget}</td>
                        <td className="px-6 py-6 text-right">
                           <div className="flex items-center justify-end gap-3">
                              <div className="w-24 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                                 <motion.div 
                                    initial={{ width: 0 }}
                                    animate={{ width: `${proj.progress}%` }}
                                    className="h-full bg-brand-primary"
                                 />
                              </div>
                              <span className="text-slate-900 font-black">{proj.progress}%</span>
                           </div>
                        </td>
                     </tr>
                  ))}
               </tbody>
            </table>
         </div>
      </div>
    </motion.div>
  );
};