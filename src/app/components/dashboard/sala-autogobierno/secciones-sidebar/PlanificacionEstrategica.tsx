import React from 'react';
import { 
  Plus, 
  Activity, 
  Map as MapIcon 
} from 'lucide-react';

interface PlanificacionEstrategicaProps {
  type: string;
  openModal: (type: 'form' | 'detail' | 'success', title: string, data?: any) => void;
}

export const PlanificacionEstrategica: React.FC<PlanificacionEstrategicaProps> = ({ type, openModal }) => {
  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 space-y-6">
       <div className="flex items-center justify-between mb-2">
         <div>
            <h2 className="text-xl font-bold text-slate-900 leading-tight uppercase tracking-tighter">{type === 'aca' ? 'ACA Territorial' : 'Mapa de los Sueños'}</h2>
            <p className="text-xs text-slate-500 italic mt-1 leading-none shadow-xs">Planificación de impacto regional y nudos de gran escala</p>
         </div>
         <button 
          onClick={() => openModal('form', 'Registrar Proyecto Hito', { area: 'Planificación' })}
          className="flex items-center gap-2 px-4 py-2 bg-brand-primary text-white rounded-xl font-bold text-[10px] uppercase shadow-sm"
        >
            <Plus size={14} /> Registrar Proyecto Hito
         </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-3xl border border-slate-100 shadow-sm p-8 space-y-6">
           <h3 className="text-sm font-black text-slate-900 uppercase tracking-widest flex items-center gap-2 leading-none">
              <Activity size={18} className="text-brand-primary" />
              Prioridades del ACA (Eje Territorial)
           </h3>
           <div className="space-y-4">
              {[
                { title: 'Subestación Eléctrica Carrizal', impact: 'Impacto en 4 Comunas', status: 'En Proyecto', percent: 15 },
                { title: 'Acueducto Matriz Panamericana', impact: 'Soberanía Hídrica Eje Central', status: 'En Ejecución', percent: 45 },
                { title: 'Complejo Deportivo Regional', impact: 'Juvenil / Recreativo', status: 'Aprobado', percent: 0 },
              ].map((item, i) => (
                <div 
                  key={i} 
                  onClick={() => openModal('detail', 'Hito Estratégico: ' + item.title, item)}
                  className="p-4 bg-slate-50 rounded-2xl border border-slate-100 hover:border-brand-primary/30 transition-all cursor-pointer group shadow-xs"
                >
                   <div className="flex justify-between mb-2">
                      <div>
                        <h4 className="text-xs font-black text-slate-800 uppercase italic">{item.title}</h4>
                        <p className="text-[10px] text-brand-primary font-bold">{item.impact}</p>
                      </div>
                      <span className="text-[10px] font-black text-brand-primary uppercase italic">{item.percent}%</span>
                   </div>
                   <div className="h-1.5 w-full bg-slate-200 rounded-full overflow-hidden">
                      <div className="h-full bg-brand-primary transition-all duration-1000" style={{ width: `${item.percent}%` }} />
                   </div>
                </div>
              ))}
           </div>
        </div>

        <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden flex flex-col">
           <div className="p-8 border-b border-slate-50">
              <h3 className="text-sm font-black text-slate-900 uppercase tracking-widest flex items-center gap-2 leading-none">
                <MapIcon size={18} className="text-brand-primary" />
                Mapa de Hitos (Visión 2030)
              </h3>
           </div>
           <div className="flex-1 min-h-[300px] bg-slate-900 relative">
              <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-30" />
              <div className="absolute top-[30%] left-[40%] group cursor-pointer">
                 <div className="w-4 h-4 bg-brand-primary rounded-full animate-ping absolute inset-0" />
                 <div className="w-4 h-4 bg-brand-primary rounded-full relative z-10 border-2 border-white shadow-lg" />
                 <div className="absolute top-full left-1/2 -translate-x-1/2 mt-2 bg-white/95 backdrop-blur px-2 py-1 rounded-lg shadow-xl border border-slate-100 opacity-0 group-hover:opacity-100 transition-all transform scale-90 group-hover:scale-100 pointer-events-none">
                    <p className="text-[10px] font-black text-slate-800 uppercase whitespace-nowrap italic">Hito: Zona Industrial</p>
                 </div>
              </div>
           </div>
        </div>
      </div>
    </div>
  );
};
