import React, { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { 
  Users, 
  Map as MapIcon, 
  HeartPulse, 
  Activity, 
  Upload, 
  X, 
  Clock, 
  CheckCircle2 
} from "lucide-react";
import { cn } from "../../../../lib/utils";

interface CensoComunalViewProps {
  initialAction?: string | null;
  onActionComplete: () => void;
}

export const CensoComunalView = ({
  initialAction,
  onActionComplete,
}: CensoComunalViewProps) => {
  const [isImporting, setIsImporting] = useState(false);
  const [showVulnerabilidad, setShowVulnerabilidad] = useState(false);

  return (
    <div className="space-y-8">
      {/* Resumen de Caracterización */}
      <div className="bg-white p-8 rounded-[2.5rem] border border-gray-100 shadow-sm">
         <div className="flex items-center justify-between mb-8">
           <h3 className="text-xl font-black text-slate-800 italic uppercase tracking-tighter">
             Caracterización Poblacional
           </h3>
           <button 
             onClick={() => setShowVulnerabilidad(true)}
             className="flex items-center gap-2 px-6 py-3 rounded-2xl bg-rose-500 text-white text-[10px] font-black uppercase tracking-widest hover:scale-105 transition-all shadow-lg shadow-rose-500/20"
           >
             <MapIcon className="h-4 w-4" /> Mapa de Vulnerabilidad
           </button>
         </div>
         <div className="grid grid-cols-1 sm:grid-cols-4 gap-6">
            <div className="space-y-1">
               <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
                 <Users className="h-3 w-3" /> Total Habitantes
               </p>
               <p className="text-2xl font-black text-slate-800">1,245</p>
            </div>
            <div className="space-y-1 text-blue-600">
               <p className="text-[10px] font-bold opacity-60 uppercase tracking-widest flex items-center gap-2">
                 <Users className="h-3 w-3" /> Niños y Jóvenes
               </p>
               <p className="text-2xl font-black">435</p>
            </div>
            <div className="space-y-1 text-rose-600">
               <p className="text-[10px] font-bold opacity-60 uppercase tracking-widest flex items-center gap-2">
                 <HeartPulse className="h-3 w-3" /> Adultos Mayores
               </p>
               <p className="text-2xl font-black">186</p>
            </div>
            <div className="space-y-1 text-emerald-600">
               <p className="text-[10px] font-bold opacity-60 uppercase tracking-widest flex items-center gap-2">
                 <Activity className="h-3 w-3" /> Casos Salud
               </p>
               <p className="text-2xl font-black">24</p>
            </div>
         </div>
      </div>

      <div className="bg-white rounded-[2.5rem] border border-gray-100 shadow-sm overflow-hidden p-8">
          <div className="flex flex-col items-center justify-center py-12 border-2 border-dashed border-gray-100 rounded-[2rem] bg-gray-50/50 group hover:border-brand-primary/30 transition-all cursor-pointer">
             <div className="h-20 w-20 rounded-full bg-brand-primary/10 flex items-center justify-center text-brand-primary mb-6 group-hover:scale-110 transition-transform">
                <Upload className="h-8 w-8" />
             </div>
             <h4 className="text-lg font-black text-slate-800 tracking-tight italic">Importación Masiva de Datos</h4>
             <p className="text-xs text-slate-400 font-bold mt-2 uppercase tracking-widest max-w-xs text-center">
                Arrastre el archivo Excel o PDF con los datos del censo para la carga automática al sistema
             </p>
             <input type="file" className="hidden" id="census-upload" onChange={() => setIsImporting(true)} />
             <label htmlFor="census-upload" className="mt-8 px-8 py-3 rounded-2xl bg-slate-800 text-white text-[10px] font-black uppercase tracking-widest hover:bg-brand-primary transition-all cursor-pointer">
                Seleccionar Documento
             </label>
          </div>
          {isImporting && (
             <motion.div initial={{opacity:0, y:10}} animate={{opacity:1, y:0}} className="mt-6 p-4 rounded-xl bg-blue-50 border border-blue-100 flex items-center justify-between">
                <div className="flex items-center gap-3">
                   <Clock className="h-5 w-5 text-blue-500 animate-spin" />
                   <p className="text-[10px] font-black text-blue-700 uppercase italic">Procesando archivo...</p>
                </div>
                <button onClick={() => setIsImporting(false)} className="text-[9px] font-black text-blue-400 uppercase">Cancelar</button>
             </motion.div>
          )}
          <div className="mt-8 pt-8 border-t border-gray-50 grid grid-cols-2 lg:grid-cols-4 gap-6">
             <div className="p-4 rounded-2xl bg-white border border-gray-50 flex items-center gap-3">
                <CheckCircle2 className="h-5 w-5 text-emerald-500" />
                <div>
                   <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Estado de Carga</p>
                   <p className="text-xs font-black text-slate-800 uppercase">Sincronizado</p>
                </div>
             </div>
          </div>
      </div>

      <AnimatePresence>
         {showVulnerabilidad && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
               <motion.div initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}} onClick={() => setShowVulnerabilidad(false)} className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" />
               <motion.div initial={{opacity:0, scale:0.95, y:20}} animate={{opacity:1, scale:1, y:0}} exit={{opacity:0, scale:0.95, y:20}} className="relative w-full max-w-4xl bg-white rounded-[2.5rem] shadow-2xl overflow-hidden p-10 flex flex-col gap-8">
                  <div className="flex justify-between items-center">
                     <div>
                        <h4 className="text-2xl font-black text-slate-800 italic uppercase">Mapa de Vulnerabilidad</h4>
                        <p className="text-xs text-slate-400 font-bold uppercase tracking-widest mt-1">Identificación de puntos críticos de atención social</p>
                     </div>
                     <button onClick={() => setShowVulnerabilidad(false)} className="p-3 rounded-xl hover:bg-gray-100 transition-colors"><X className="h-6 w-6 text-slate-400" /></button>
                  </div>
                  
                  <div className="aspect-video rounded-[2rem] bg-slate-100 border-4 border-white shadow-inner relative overflow-hidden">
                     <div className="absolute inset-0 bg-[url('https://picsum.photos/seed/vulnerability/1200/800')] bg-cover grayscale opacity-10" />
                     {/* Simulated Heat Map Markers */}
                     <div className="absolute top-1/4 left-1/3 h-12 w-12 rounded-full bg-rose-500/30 animate-pulse border-2 border-rose-500 flex items-center justify-center">
                        <span className="text-[8px] font-black text-rose-600 bg-white px-1.5 py-0.5 rounded shadow-sm">Sector 4: Crítico</span>
                     </div>
                     <div className="absolute bottom-1/3 right-1/4 h-8 w-8 rounded-full bg-amber-500/30 border-2 border-amber-500 flex items-center justify-center">
                        <span className="text-[8px] font-black text-amber-600 bg-white px-1.5 py-0.5 rounded shadow-sm">Sector 1: Regular</span>
                     </div>
                  </div>

                  <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                     {[
                        { label: 'Desnutrición', count: 12, color: 'rose' },
                        { label: 'Sin Escolaridad', count: 8, color: 'amber' },
                        { label: 'Adultos Solos', count: 24, color: 'indigo' },
                        { label: 'Casos Crónicos', count: 6, color: 'rose' }
                     ].map((idx, i) => (
                        <div key={i} className={cn("p-4 rounded-xl border", idx.color === 'rose' ? 'bg-rose-50 border-rose-100' : 'bg-slate-50 border-slate-100')}>
                           <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-1">{idx.label}</p>
                           <p className={cn("text-xl font-black", idx.color === 'rose' ? 'text-rose-600' : 'text-slate-800')}>{idx.count}</p>
                        </div>
                     ))}
                  </div>
               </motion.div>
            </div>
         )}
      </AnimatePresence>
    </div>
  );
};
