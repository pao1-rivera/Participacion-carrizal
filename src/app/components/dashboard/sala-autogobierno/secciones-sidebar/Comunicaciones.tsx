import React from 'react';
import { 
  Plus, 
  MessageSquare, 
  Settings 
} from 'lucide-react';
import { cn } from '@/app/lib/utils';

interface ComunicacionesProps {
  openModal: (type: 'form' | 'detail' | 'success', title: string, data?: any) => void;
}

export const Comunicaciones: React.FC<ComunicacionesProps> = ({ openModal }) => {
  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 space-y-6">
       <div className="flex items-center justify-between mb-2">
         <div>
            <h2 className="text-xl font-bold text-slate-900 leading-tight uppercase tracking-tighter">Central de Comunicaciones</h2>
            <p className="text-xs text-slate-500 italic mt-1 leading-none shadow-xs">Gestión de convocatorias y anuncios territoriales</p>
         </div>
         <button 
          onClick={() => openModal('form', 'Nueva Difusión Territorial', {})}
          className="flex items-center gap-2 px-4 py-2 bg-brand-primary text-white rounded-xl font-bold text-[10px] uppercase shadow-sm"
        >
            <Plus size={14} /> Nueva Difusión
         </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-4">
           {[1, 2, 3].map((i) => (
             <div key={i} className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm flex gap-6 hover:border-brand-primary/30 transition-all cursor-pointer shadow-xs group">
                <div className="w-16 h-16 bg-slate-50 rounded-2xl flex items-center justify-center text-slate-400 group-hover:bg-brand-primary/10 group-hover:text-brand-primary transition-colors shrink-0">
                   <MessageSquare size={32} />
                </div>
                <div className="flex-1 space-y-2">
                   <div className="flex justify-between items-start">
                      <h4 className="text-sm font-black text-slate-900 uppercase italic">Convocatoria: Jornada de Sistematización 7T</h4>
                      <span className="text-[10px] font-bold text-slate-400 uppercase italic">Hace {i}d</span>
                   </div>
                   <p className="text-xs text-slate-600 line-clamp-2">Se informa a todos los voceros de las comunas del eje que el próximo viernes se realizará el taller regional para la validación de nudos críticos...</p>
                   <div className="flex gap-2 pt-2">
                      <span className="px-2 py-0.5 bg-slate-50 text-slate-500 text-[9px] font-bold rounded italic uppercase border border-slate-100">WhatsApp</span>
                      <span className="px-2 py-0.5 bg-slate-50 text-slate-500 text-[9px] font-bold rounded italic uppercase border border-slate-100">SMS</span>
                      <span className="px-2 py-0.5 bg-slate-50 text-slate-500 text-[9px] font-bold rounded italic uppercase border border-slate-100">App</span>
                   </div>
                </div>
             </div>
           ))}
        </div>

        <div className="space-y-6">
           <div className="bg-white p-8 rounded-3xl border border-slate-100 shadow-sm space-y-4 relative overflow-hidden">
               <div className="absolute top-0 right-0 p-4 opacity-[0.05]">
                  <Settings size={60} className="text-brand-primary" />
               </div>
               <h3 className="text-xs font-black text-slate-900 uppercase tracking-widest leading-none">Canales Activos</h3>
               <div className="space-y-3 pt-2">
                  {[
                    { name: 'Bot de Telegram', status: 'Online', color: 'text-emerald-500' },
                    { name: 'Central de SMS', status: 'Crédito Agotado', color: 'text-red-500' },
                    { name: 'Notif. Push App', status: 'Online', color: 'text-emerald-500' },
                  ].map((c, i) => (
                    <div key={i} className="flex justify-between items-center bg-slate-50 p-3 rounded-xl border border-slate-100">
                       <span className="text-xs font-bold text-slate-800 italic uppercase">{c.name}</span>
                       <span className={cn("text-[8px] font-black uppercase italic", c.color)}>{c.status}</span>
                    </div>
                  ))}
               </div>
               <button 
                 onClick={() => openModal('form', 'Configurar Canales de Comunicación', {})}
                 className="w-full py-2.5 bg-brand-primary/10 text-brand-primary text-[10px] font-black rounded-xl hover:bg-brand-primary hover:text-white transition-all uppercase italic shadow-xs"
               >
                 Configurar Canales
               </button>
           </div>
        </div>
      </div>
    </div>
  );
};
