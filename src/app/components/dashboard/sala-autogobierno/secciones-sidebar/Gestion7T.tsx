import React from 'react';
import { 
  Plus, 
  ClipboardCheck
} from 'lucide-react';
import { cn } from '@/app/lib/utils';

const T7_INDICATORS = [
  { id: 't1', name: 'Económica' },
  { id: 't2', name: 'Servicios' },
  { id: 't3', name: 'Seguridad' },
  { id: 't4', name: 'Social' },
  { id: 't5', name: 'Política' },
  { id: 't6', name: 'Ecología' },
  { id: 't7', name: 'Geopolítica' },
];

interface Gestion7TProps {
  area: string;
  openModal: (type: 'form' | 'detail' | 'success', title: string, data?: any) => void;
}

export const Gestion7T: React.FC<Gestion7TProps> = ({ area, openModal }) => {
  const tName = T7_INDICATORS.find(t => t.id === area)?.name || area;
  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 space-y-6">
      <div className="flex items-center justify-between mb-2">
         <div>
            <h2 className="text-xl font-bold text-slate-900 leading-tight uppercase tracking-tighter">Sistematización: {tName}</h2>
            <p className="text-xs text-slate-500 italic mt-1 leading-none shadow-xs">Carga de avances territoriales por área política</p>
         </div>
         <button 
          onClick={() => openModal('form', 'Registrar Avance: ' + tName, { area: tName })}
          className="flex items-center gap-2 px-4 py-2 bg-brand-primary text-white rounded-xl font-bold text-[10px] uppercase shadow-sm"
        >
            <Plus size={14} /> Registrar Avance
         </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Total Reportes', value: '45', color: 'text-brand-primary' },
          { label: 'Territorios Cubiertos', value: '8/12', color: 'text-indigo-600' },
          { label: 'Tiempo Prom. Carga', value: '2.4d', color: 'text-emerald-600' },
          { label: 'Estatus Global', value: '68%', color: 'text-amber-600' },
        ].map((m, i) => (
          <div 
            key={i} 
            onClick={() => openModal('detail', 'Métrica: ' + m.label, { Valor: m.value, Detalle: 'Información consolidada de la red territorial para el área seleccionada.' })}
            className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm overflow-hidden relative cursor-pointer hover:border-brand-primary transition-all group"
          >
             <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none mb-2">{m.label}</p>
             <p className={cn("text-2xl font-black", m.color)}>{m.value}</p>
          </div>
        ))}
      </div>

      <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden">
        <div className="p-6 border-b border-slate-50 flex items-center justify-between">
           <h3 className="text-xs font-black text-slate-900 uppercase tracking-widest flex items-center gap-2 leading-none">
              <ClipboardCheck size={16} className="text-brand-primary" />
              Sistematización por Comunidad
           </h3>
        </div>
        <div className="overflow-x-auto text-slate-900">
           <table className="w-full text-left">
              <thead>
                 <tr className="bg-slate-50/50">
                    <th className="px-8 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest italic">Comunidad</th>
                    <th className="px-8 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest italic text-center">Avance</th>
                    <th className="px-8 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest italic text-center">Última Carga</th>
                    <th className="px-8 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest italic text-right">Acción</th>
                 </tr>
              </thead>
              <tbody>
                 {[
                   { name: 'Brisas del Norte', progress: 85, date: '12/05/2024' },
                   { name: 'El Trigo Sector A', progress: 45, date: '18/05/2024' },
                   { name: 'Los Picapiedras', progress: 100, date: '10/05/2024' },
                   { name: 'Colinas de Carrizal', progress: 20, date: '22/05/2024' },
                 ].map((row, i) => (
                   <tr 
                     key={i} 
                     onClick={() => openModal('detail', 'Resumen Territorial: ' + row.name, row)}
                     className="border-b border-slate-50 last:border-0 hover:bg-slate-50/50 transition-colors cursor-pointer"
                   >
                      <td className="px-8 py-5">
                         <span className="text-xs font-black text-slate-800 uppercase italic tracking-tight">{row.name}</span>
                      </td>
                      <td className="px-8 py-5">
                         <div className="flex items-center gap-2 max-w-[120px] mx-auto">
                            <div className="flex-1 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                               <div className="h-full bg-brand-primary" style={{ width: `${row.progress}%` }} />
                            </div>
                            <span className="text-[10px] font-bold text-brand-primary">{row.progress}%</span>
                         </div>
                      </td>
                      <td className="px-8 py-5 text-center">
                         <span className="text-[10px] font-bold text-slate-600">{row.date}</span>
                      </td>
                      <td className="px-8 py-5 text-right">
                         <button className="text-[10px] font-black text-brand-primary uppercase italic hover:underline">Ver Detalle</button>
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
