import React from 'react';
import { 
  Camera, 
  TrendingUp, 
  ArrowUpRight 
} from 'lucide-react';

interface SeguimientoGestionProps {
  type: string;
  openModal: (type: 'form' | 'detail' | 'success', title: string, data?: any) => void;
}

export const SeguimientoGestion: React.FC<SeguimientoGestionProps> = ({ type, openModal }) => {
  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 space-y-6">
       <div className="flex items-center justify-between mb-2">
         <div>
            <h2 className="text-xl font-bold text-slate-900 leading-tight uppercase tracking-tighter">{type === 'proyectos' ? 'Proyectos en Ejecución' : 'Banco de Evidencias'}</h2>
            <p className="text-xs text-slate-500 italic mt-1 leading-none shadow-xs">Control de obras y seguimiento visual de compromisos</p>
         </div>
         <button 
          onClick={() => openModal('form', type === 'proyectos' ? 'Reportar Avance de Obra' : 'Subir Multimedia', {})}
          className="flex items-center gap-2 px-4 py-2 bg-brand-primary text-white rounded-xl font-bold text-[10px] uppercase shadow-sm"
        >
            <Camera size={14} /> {type === 'proyectos' ? 'Reportar Avance' : 'Subir Multimedia'}
         </button>
      </div>

      <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden">
        <div className="p-6 border-b border-slate-50 flex items-center justify-between">
           <h3 className="text-xs font-black text-slate-900 uppercase tracking-widest flex items-center gap-2 leading-none">
              <TrendingUp size={16} className="text-brand-primary" />
              Monitor de Ejecución Física / Financiera
           </h3>
        </div>
        <div className="p-6">
           <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
             {[
               { name: 'Canchas Sector 1', cc: 'C.C. Brisas', status: 'Financiamiento OK', physical: 75, budget: 100 },
               { name: 'Pozo de Agua', cc: 'C.C. El Trigo', status: 'En Desembolso', physical: 20, budget: 45 },
               { name: 'Iluminación LED', cc: 'Eje Panamericana', status: 'Completado', physical: 100, budget: 100 },
             ].map((p, i) => (
                <div 
                   key={i} 
                   onClick={() => openModal('detail', 'Proyecto: ' + p.name, p)}
                   className="p-6 rounded-2xl bg-slate-50 border border-slate-100 space-y-4 hover:border-brand-primary/30 transition-all cursor-pointer shadow-sm group"
                >
                   <div className="flex justify-between items-start">
                      <div>
                        <h4 className="text-sm font-black text-slate-900 uppercase italic">{p.name}</h4>
                        <p className="text-[10px] text-slate-500 font-bold">{p.cc} — {p.status}</p>
                      </div>
                      <div className="flex gap-2">
                         <div className="text-center">
                            <p className="text-[8px] font-black text-slate-400 uppercase leading-none mb-1 italic">Físico</p>
                            <p className="text-xs font-black text-brand-primary italic">{p.physical}%</p>
                         </div>
                         <div className="text-center">
                            <p className="text-[8px] font-black text-slate-400 uppercase leading-none mb-1 italic">Presup.</p>
                            <p className="text-xs font-black text-indigo-600 italic">{p.budget}%</p>
                         </div>
                      </div>
                   </div>
                   <div className="space-y-2">
                      <div className="h-1.5 w-full bg-slate-200 rounded-full overflow-hidden">
                        <div className="h-full bg-brand-primary" style={{ width: `${p.physical}%` }} />
                      </div>
                      <div className="h-1 w-full bg-slate-200 rounded-full overflow-hidden opacity-50">
                        <div className="h-full bg-indigo-600" style={{ width: `${p.budget}%` }} />
                      </div>
                   </div>
                   <div className="flex gap-2 justify-end pt-2">
                      <button className="p-1.5 bg-white border border-slate-200 rounded-lg text-slate-400 hover:text-brand-primary hover:border-brand-primary transition-all shadow-xs"><Camera size={14} /></button>
                      <button className="p-1.5 bg-white border border-slate-200 rounded-lg text-slate-400 hover:text-brand-primary hover:border-brand-primary transition-all shadow-xs"><ArrowUpRight size={14} /></button>
                   </div>
                </div>
             ))}
           </div>
        </div>
      </div>
    </div>
  );
};
