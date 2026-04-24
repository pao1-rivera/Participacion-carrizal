import React from 'react';
import { 
  Briefcase, 
  Construction, 
  TrendingUp,
  ChevronRight,
  AlertCircle
} from 'lucide-react';
import { cn } from '../../../../lib/utils';

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

export const GestionSection = ({ subview }: any) => {
  if (subview === 'inversion') {
    return (
      <div className="space-y-8 animate-in fade-in duration-500">
        <SectionHeader title="Proyectos de Inversión" subtitle="Gestión de obras y recursos" icon={Construction} />
        <div className="grid grid-cols-1 gap-6">
           {[
             { name: 'Electrificación Sector El Valle', progress: 65, status: 'En Ejecución', budget: '$12,000' },
             { name: 'Red de Aguas Servidas - Troncal 1', progress: 30, status: 'En Espera', budget: '$8,500' }
           ].map((p, i) => (
             <div key={i} className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm flex flex-col md:flex-row md:items-center gap-8 group hover:shadow-xl transition-all">
                <div className="h-14 w-14 rounded-2xl bg-slate-50 border border-slate-100 flex items-center justify-center text-slate-400 group-hover:text-brand-primary transition-colors">
                   <Construction className="h-7 w-7" />
                </div>
                <div className="flex-1 space-y-4">
                   <div className="flex items-center justify-between">
                      <h4 className="text-sm font-black text-slate-800 uppercase italic">"{p.name}"</h4>
                      <span className="text-[10px] font-black text-brand-primary">{p.budget}</span>
                   </div>
                   <div className="space-y-2">
                      <div className="flex justify-between items-center text-[9px] font-black uppercase">
                         <span className="text-slate-400 italic">Avance Físico</span>
                         <span className="text-slate-800">{p.progress}%</span>
                      </div>
                      <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                         <div className="h-full bg-brand-primary rounded-full" style={{ width: `${p.progress}%` }} />
                      </div>
                   </div>
                </div>
                <div className="flex flex-col gap-2">
                   <span className={cn(
                     "text-[8px] font-black px-3 py-1 rounded text-center uppercase tracking-widest",
                     p.status === 'En Ejecución' ? 'bg-amber-50 text-amber-600' : 'bg-slate-50 text-slate-400'
                   )}>{p.status}</span>
                   <button className="px-6 py-2 rounded-xl bg-slate-800 text-white text-[9px] font-black uppercase tracking-widest">Detalle</button>
                </div>
             </div>
           ))}
        </div>
      </div>
    );
  }

  if (subview === 'eps') {
    return (
      <div className="space-y-8 animate-in fade-in duration-500">
        <SectionHeader title="Empresas de Propiedad Social" subtitle="Unidades de producción directa" icon={Briefcase} />
        <div className="bg-white p-12 rounded-[3rem] border border-slate-100 shadow-sm text-center">
           <div className="h-20 w-20 rounded-[2rem] bg-indigo-50 text-indigo-500 flex items-center justify-center mx-auto mb-6">
              <Briefcase className="h-10 w-10" />
           </div>
           <h3 className="text-xl font-black text-slate-800 uppercase italic mb-4">Gestión de EPS</h3>
           <p className="text-xs text-slate-400 font-bold uppercase tracking-widest max-w-sm mx-auto leading-relaxed">
              Módulo de registro y seguimiento de empresas de propiedad social directa e indirecta comunal.
           </p>
           <button className="mt-8 px-10 py-4 rounded-xl bg-brand-primary text-white text-[10px] font-black uppercase tracking-widest hover:scale-105 transition-all shadow-xl shadow-brand-primary/20">
              Registrar Nueva EPS
           </button>
        </div>
      </div>
    );
  }

  return (
    <div className="py-20 text-center">
      <SectionHeader title="Gestión de Proyectos" subtitle="Inversión y Producción" icon={Construction} />
      <p className="text-slate-400 text-xs font-bold uppercase tracking-widest">Seleccione una opción del sidebar</p>
    </div>
  );
};
