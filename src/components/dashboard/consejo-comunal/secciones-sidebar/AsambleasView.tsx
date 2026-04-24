import React, { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { 
  Megaphone, 
  FileCheck, 
  Clock, 
  X, 
  Plus, 
  Upload, 
  Video 
} from "lucide-react";

interface AsambleasViewProps {
  initialAction?: string | null;
  onActionComplete: () => void;
}

export const AsambleasView = ({
  initialAction,
  onActionComplete,
}: AsambleasViewProps) => {
  const [isNewConvoOpen, setIsNewConvoOpen] = useState(initialAction === "nova_asamblea");

  const closeForm = () => {
    setIsNewConvoOpen(false);
    onActionComplete();
  };

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-[2.5rem] p-10 border border-gray-100 shadow-sm flex flex-col md:flex-row items-center gap-10">
        <div className="h-24 w-24 rounded-[2rem] bg-indigo-50 flex items-center justify-center text-indigo-500 shadow-lg shadow-indigo-500/10 shrink-0">
          <Megaphone className="h-10 w-10" />
        </div>
        <div className="text-center md:text-left">
          <h3 className="text-2xl font-black text-slate-800 italic uppercase italic tracking-tighter">
            Participación y Asamblea
          </h3>
          <p className="text-slate-400 text-sm font-medium mt-1">
            Gestione las convocatorias comunitarias y la carga de actas validadas.
          </p>
        </div>
        <button 
          onClick={() => setIsNewConvoOpen(true)}
          className="md:ml-auto px-8 py-4 rounded-2xl bg-indigo-600 text-white text-[11px] font-black uppercase tracking-widest shadow-xl shadow-indigo-600/20 hover:scale-105 active:scale-95 transition-all"
        >
          Nueva Convocatoria
        </button>
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-[2.5rem] border border-gray-100 p-8 space-y-6 shadow-sm">
           <h4 className="text-[11px] font-black text-slate-800 uppercase tracking-widest italic flex items-center gap-2">
              <Clock className="h-4 w-4 text-indigo-500" /> Próximas Asambleas
           </h4>
           <div className="p-6 rounded-3xl bg-gray-50 border border-gray-100 flex items-center justify-between group cursor-pointer hover:border-indigo-500/30 transition-all">
              <div className="flex items-center gap-4">
                 <div className="h-12 w-12 rounded-2xl bg-white border border-gray-100 flex flex-col items-center justify-center">
                    <span className="text-xs font-black text-slate-800">25</span>
                    <span className="text-[8px] font-bold text-slate-400 uppercase">May</span>
                 </div>
                 <div>
                    <p className="text-sm font-black text-slate-800 italic uppercase">Elección Nodos 7T</p>
                    <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">Lugar: Cancha Techada</p>
                 </div>
              </div>
              <button className="text-[9px] font-black text-indigo-500 uppercase tracking-widest underline italic">Confirmar</button>
           </div>
        </div>

        <div className="bg-white rounded-[2.5rem] border border-gray-100 p-8 space-y-6 shadow-sm">
           <h4 className="text-[11px] font-black text-slate-800 uppercase tracking-widest italic flex items-center gap-2">
              <FileCheck className="h-4 w-4 text-emerald-500" /> Últimas Actas Cargadas
           </h4>
           <div className="space-y-4">
              {[
                 { title: "Acta Aprobación Clap", date: "12/04/2024", icon: FileCheck },
                 { title: "Asamblea de Diagnóstico", date: "05/04/2024", icon: FileCheck }
              ].map((act, i) => (
                 <div key={i} className="flex items-center justify-between p-4 rounded-2xl border border-gray-50 hover:bg-gray-50 transition-colors">
                    <div className="flex items-center gap-3">
                       <act.icon className="h-4 w-4 text-slate-300" />
                       <p className="text-xs font-bold text-slate-700">{act.title}</p>
                    </div>
                    <span className="text-[9px] font-black text-slate-400 uppercase">{act.date}</span>
                 </div>
              ))}
           </div>
        </div>
      </div>

      <AnimatePresence>
         {isNewConvoOpen && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
               <motion.div initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}} onClick={closeForm} className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" />
               <motion.div initial={{opacity:0, scale:0.95, y:20}} animate={{opacity:1, scale:1, y:0}} exit={{opacity:0, scale:0.95, y:20}} className="relative w-full max-w-lg bg-white rounded-[2.5rem] shadow-2xl p-10 overflow-hidden">
                  <div className="flex justify-between items-center mb-10">
                     <h4 className="text-xl font-black text-slate-800 italic uppercase">Programar Convocatoria</h4>
                     <button onClick={closeForm} className="p-2 rounded-xl hover:bg-gray-100 transition-colors"><X className="h-5 w-5 text-slate-400"/></button>
                  </div>
                  <form className="space-y-6">
                     <div className="space-y-2">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Motivo de la Asamblea</label>
                        <input className="w-full p-4 rounded-2xl bg-gray-50 border-none ring-1 ring-gray-100 outline-none text-sm font-bold" placeholder="Ej: Discusión de Proyectos 2024" />
                     </div>
                     <div className="grid grid-cols-2 gap-6">
                        <div className="space-y-2">
                           <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Fecha Sugerida</label>
                           <input type="date" className="w-full p-4 rounded-2xl bg-gray-50 border-none ring-1 ring-gray-100 outline-none text-xs font-black" />
                        </div>
                        <div className="space-y-2">
                           <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Hora</label>
                           <input type="time" className="w-full p-4 rounded-2xl bg-gray-50 border-none ring-1 ring-gray-100 outline-none text-xs font-black italic" />
                        </div>
                     </div>
                     <div className="space-y-2">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Lugar de Reunión</label>
                        <input className="w-full p-4 rounded-2xl bg-gray-50 border-none ring-1 ring-gray-100 outline-none text-sm font-bold" placeholder="Punto de encuentro" />
                     </div>
                     
                     <div className="p-6 rounded-[2rem] bg-indigo-50 border border-indigo-100 flex items-center justify-between">
                        <div className="flex items-center gap-3">
                           <Video className="h-5 w-5 text-indigo-500" />
                           <p className="text-[10px] font-black text-indigo-700 uppercase italic">¿Habilitar registro en Vivo?</p>
                        </div>
                        <input type="checkbox" className="h-5 w-5 rounded border-indigo-500 text-indigo-600 focus:ring-indigo-500" />
                     </div>

                     <button className="w-full py-5 rounded-2xl bg-indigo-600 text-white text-[11px] font-black uppercase tracking-widest shadow-xl shadow-indigo-600/20 active:scale-95 transition-all">
                        Enviar Convocatoria Masiva
                     </button>
                  </form>
               </motion.div>
            </div>
         )}
      </AnimatePresence>
    </div>
  );
};
