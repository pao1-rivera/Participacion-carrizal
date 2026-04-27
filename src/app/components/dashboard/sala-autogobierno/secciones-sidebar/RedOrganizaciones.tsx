import React from 'react';
import { 
  Users, 
  Search, 
  Filter
} from 'lucide-react';
import { cn } from '@/app/lib/utils';

interface RedOrganizacionesProps {
  type: string;
  openModal: (type: 'form' | 'detail' | 'success', title: string, data?: any) => void;
}

export const RedOrganizaciones: React.FC<RedOrganizacionesProps> = ({ type, openModal }) => {
  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 space-y-6">
      <div className="flex items-center justify-between mb-2">
         <div>
            <h2 className="text-xl font-bold text-slate-900 leading-tight uppercase tracking-tighter">Directorio: {type === 'comunas' ? 'Comunas' : 'Consejos Comunales'}</h2>
            <p className="text-xs text-slate-500 italic mt-1 leading-none shadow-xs">Registro y estatus de organizaciones del eje</p>
         </div>
         <div className="flex gap-2">
            <div className="relative">
               <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
               <input 
                  type="text" 
                  placeholder="Buscar organización..." 
                  className="pl-9 pr-4 py-2 bg-white border border-slate-200 rounded-xl text-xs font-medium focus:ring-2 focus:ring-brand-primary/20 outline-none w-64"
               />
            </div>
            <button className="p-2 border border-slate-200 rounded-xl hover:bg-slate-50 transition-colors text-slate-500">
               <Filter size={18} />
            </button>
         </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <div 
             key={i} 
             onClick={() => openModal('detail', 'Expediente: ' + (type === 'comunas' ? 'Comuna ' : 'CC ') + (i === 1 ? 'Brisas del Norte' : i === 2 ? 'El Despertar' : `Organización Territorial ${i}`), { Estatus: i % 3 === 0 ? 'Vencido' : 'Vigente', Población: 200 + i * 50, Voceros: 12 + i })}
             className="bg-white rounded-3xl border border-slate-100 shadow-sm p-6 space-y-4 hover:border-brand-primary/30 transition-all group overflow-hidden relative cursor-pointer"
          >
             <div className="absolute top-0 right-0 p-4 opacity-[0.03] group-hover:scale-125 transition-transform">
                <Users size={80} className="text-brand-primary" />
             </div>
             <div className="flex justify-between items-start">
                <div className="w-12 h-12 bg-brand-primary/10 rounded-2xl flex items-center justify-center text-brand-primary">
                   <Users size={24} />
                </div>
                <span className={cn("text-[9px] font-black uppercase px-2 py-0.5 rounded italic", i % 3 === 0 ? 'bg-amber-50 text-amber-600' : 'bg-emerald-50 text-emerald-600')}>
                   {i % 3 === 0 ? 'Vencido' : 'Vigente'}
                </span>
             </div>
             <div>
                <h4 className="text-sm font-black text-slate-900 uppercase tracking-tight italic">{type === 'comunas' ? 'Comuna' : 'CC'} {i === 1 ? 'Brisas del Norte' : i === 2 ? 'El Despertar' : `Organización Territorial ${i}`}</h4>
                <p className="text-[10px] text-slate-500 font-medium">Ubicación: Sector {i}, Vereda {i+10}</p>
             </div>
             <div className="pt-4 border-t border-slate-50 grid grid-cols-2 gap-4">
                <div>
                   <p className="text-[8px] font-bold text-slate-400 uppercase tracking-widest leading-none mb-1">Población</p>
                   <p className="text-xs font-black text-slate-800 italic">{200 + i * 50} Hab.</p>
                </div>
                <div>
                   <p className="text-[8px] font-bold text-slate-400 uppercase tracking-widest leading-none mb-1">Voceros</p>
                   <p className="text-xs font-black text-slate-800 italic">{12 + i} Activos</p>
                </div>
             </div>
             <button className="w-full py-2 bg-slate-50 text-brand-primary text-[10px] font-black rounded-xl hover:bg-brand-primary hover:text-white transition-all uppercase italic">
                Ver Expediente Digital
             </button>
          </div>
        ))}
      </div>
    </div>
  );
};
