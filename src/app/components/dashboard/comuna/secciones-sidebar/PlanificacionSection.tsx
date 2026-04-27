import React from 'react';
import { 
  Target, 
  FileText,
  ChevronRight
} from 'lucide-react';
import { cn } from '@/app/lib/utils';

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

export const PlanificacionSection = ({ subview }: any) => {
  if (subview === 'aca') {
    return (
      <div className="space-y-8 animate-in fade-in duration-500">
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
  }

  if (subview === 'cartas') {
    return (
      <div className="space-y-8 animate-in fade-in duration-500">
        <SectionHeader title="Cartas Comunales" subtitle="Normativa territorial" icon={FileText} />
        <div className="grid md:grid-cols-2 gap-6">
           {[
             { name: 'Carta de Convivencia', date: '2024', status: 'Aprobada' },
             { name: 'Normativa de Servicios', date: '2024', status: 'En Discusión' }
           ].map((carta, i) => (
             <div key={i} className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm group hover:border-brand-primary transition-all">
                <div className="flex items-center justify-between mb-4">
                   <div className="h-10 w-10 rounded-2xl bg-brand-primary/5 text-brand-primary flex items-center justify-center">
                      <FileText className="h-5 w-5" />
                   </div>
                   <span className={cn(
                     "text-[8px] font-black px-2 py-0.5 rounded uppercase",
                     carta.status === 'Aprobada' ? 'bg-emerald-50 text-emerald-600' : 'bg-amber-50 text-amber-600'
                   )}>{carta.status}</span>
                </div>
                <h4 className="text-sm font-black text-slate-800 uppercase italic">{carta.name}</h4>
                <p className="text-[10px] text-slate-400 font-bold uppercase mt-1">Registrada: {carta.date}</p>
                <button className="mt-6 w-full py-3 rounded-xl border border-slate-100 text-[10px] font-black uppercase text-brand-primary group-hover:bg-brand-primary group-hover:text-white transition-all">Ver Documento</button>
             </div>
           ))}
        </div>
      </div>
    );
  }

  return (
    <div className="py-20 text-center">
      <SectionHeader title="Planificación Estratégica" subtitle="Agenda 7T y Normativa" icon={Target} />
      <p className="text-slate-400 text-xs font-bold uppercase tracking-widest">Seleccione una opción del sidebar</p>
    </div>
  );
};
