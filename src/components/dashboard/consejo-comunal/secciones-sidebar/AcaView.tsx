import React, { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { 
  Target, 
  ChevronRight, 
  Plus, 
  X 
} from "lucide-react";
import { cn } from "../../../../lib/utils";

interface AcaViewProps {
  projects: any[];
  events: any[];
  onAddEvent: (evt: any) => void;
}

export const AcaView = ({ 
  projects, 
  events, 
  onAddEvent 
}: AcaViewProps) => {
  const [view, setView] = useState<"list" | "calendar">("list");
  const [selectedActivity, setSelectedActivity] = useState<any>(null);
  const [isAddingEvent, setIsAddingEvent] = useState(false);
  const [newEvent, setNewEvent] = useState({ title: '', date: '', type: 'asamblea', description: '' });

  // Merge projects and events for display
  const allActivities = [
    ...events,
    ...projects.map(p => ({
      id: p.id,
      title: p.name,
      date: p.date,
      type: "proyecto",
      t: p.t,
      status: p.status,
      priority: "ALTA", // Simplified
      description: `Nudo Crítico: ${p.nudo}. Presupuesto: ${p.budget}`
    }))
  ].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  const handleAddSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onAddEvent(newEvent);
    setIsAddingEvent(false);
  };

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden p-8">
        <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
          <div>
            <h3 className="text-xl font-black text-slate-800 tracking-tight italic">
              Agenda Concreta de Acción (ACA)
            </h3>
            <p className="text-[10px] text-slate-400 font-bold uppercase mt-1">
              Planificación y seguimiento de nudos territoriales
            </p>
          </div>
          <div className="flex items-center gap-3">
             <div className="flex items-center gap-3 p-1 bg-gray-50 rounded-xl border border-gray-100">
               <button
                 onClick={() => setView("list")}
                 className={cn(
                   "px-4 py-2 text-[10px] font-bold uppercase rounded-lg transition-all",
                   view === "list"
                     ? "bg-white text-brand-primary shadow-sm"
                     : "text-slate-400",
                 )}
               >
                 Lista
               </button>
               <button
                 onClick={() => setView("calendar")}
                 className={cn(
                   "px-4 py-2 text-[10px] font-bold uppercase rounded-lg transition-all",
                   view === "calendar"
                     ? "bg-white text-brand-primary shadow-sm"
                     : "text-slate-400",
                 )}
               >
                 Calendario
               </button>
             </div>
             {view === "calendar" && (
                <button 
                  onClick={() => setIsAddingEvent(true)}
                  className="p-3 rounded-xl bg-brand-primary text-white hover:scale-105 transition-all"
                >
                   <Plus className="h-4 w-4" />
                </button>
             )}
          </div>
        </div>

        {view === "list" ? (
          <div className="grid gap-6">
            {allActivities.map((item, i) => (
              <div
                key={i}
                onClick={() => setSelectedActivity(item)}
                className="flex flex-col md:flex-row md:items-center justify-between gap-6 p-6 rounded-3xl bg-gray-50 border border-gray-100 group hover:border-brand-primary/30 transition-all cursor-pointer"
              >
                <div className="flex items-start gap-5">
                  <div className="h-12 w-12 rounded-2xl bg-white border border-gray-200 flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform shadow-sm">
                    <Target className={cn(
                      "h-6 w-6",
                      item.type === 'proyecto' ? 'text-brand-primary' : 'text-indigo-500'
                    )} />
                  </div>
                  <div>
                    <span className="text-[9px] font-black text-brand-primary uppercase tracking-[0.2em]">
                      {item.type === 'proyecto' ? item.t : item.type}
                    </span>
                    <h4 className="text-base font-black text-slate-800 tracking-tight mt-1">
                      "{item.title}"
                    </h4>
                    <p className="text-[10px] text-slate-400 font-bold mt-1 uppercase tracking-widest">
                      {item.date}
                    </p>
                  </div>
                </div>
                <div className="flex items-center justify-between md:justify-end gap-6 border-t md:border-t-0 pt-4 md:pt-0">
                  <div className="text-right">
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                      Estatus
                    </p>
                    <p className="text-xs font-black text-slate-800 italic">
                      {item.status || 'Programado'}
                    </p>
                  </div>
                  <ChevronRight className="h-5 w-5 text-slate-300 group-hover:text-brand-primary transition-all" />
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="bg-gray-50 rounded-3xl p-8 border border-gray-100 min-h-[400px]">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-2">
                <p className="text-sm font-black text-slate-800 italic uppercase">
                  Mayo 2024
                </p>
              </div>
              <div className="flex gap-2">
                <button className="p-2 rounded-xl bg-white border border-gray-100 text-slate-400 hover:text-brand-primary">
                  <ChevronRight className="h-4 w-4 rotate-180" />
                </button>
                <button className="p-2 rounded-xl bg-white border border-gray-100 text-slate-400 hover:text-brand-primary">
                  <ChevronRight className="h-4 w-4" />
                </button>
              </div>
            </div>
            <div className="grid grid-cols-7 gap-2">
              {["Lun", "Mar", "Mié", "Jue", "Vie", "Sáb", "Dom"].map((day) => (
                <div
                  key={day}
                  className="text-center py-2 text-[10px] font-black text-slate-400 uppercase"
                >
                  {day}
                </div>
              ))}
              {Array.from({ length: 31 }).map((_, i) => {
                const dayStr = `2024-05-${(i + 1).toString().padStart(2, '0')}`;
                const dayEvents = allActivities.filter(e => e.date === dayStr);
                
                return (
                  <div
                    key={i}
                    className={cn(
                      "aspect-square rounded-xl border border-gray-100 bg-white p-2 flex flex-col justify-between hover:border-brand-primary/30 transition-all cursor-pointer",
                      dayEvents.length > 0 && "ring-1 ring-brand-primary/30"
                    )}
                  >
                    <span className="text-[10px] font-black text-slate-800">
                      {i + 1}
                    </span>
                    <div className="flex gap-1 justify-end">
                       {dayEvents.map((de, idx) => (
                          <div 
                             key={idx}
                             className={cn(
                                "h-1.5 w-1.5 rounded-full",
                                de.type === 'proyecto' ? 'bg-brand-primary' : de.type === 'asamblea' ? 'bg-indigo-500' : 'bg-rose-500'
                             )} 
                          />
                       ))}
                    </div>
                  </div>
                );
              })}
            </div>
            <div className="mt-8 pt-8 border-t border-gray-100 flex flex-wrap items-center gap-8">
               {[
                  { label: 'Proyectos', color: 'bg-brand-primary' },
                  { label: 'Asambleas', color: 'bg-indigo-500' },
                  { label: 'Censo Social', color: 'bg-rose-500' }
               ].map((idx, i) => (
                  <div key={i} className="flex items-center gap-2">
                    <div className={cn("h-2 w-2 rounded-full", idx.color)} />
                    <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">{idx.label}</p>
                  </div>
               ))}
            </div>
          </div>
        )}
      </div>

      <AnimatePresence>
         {selectedActivity && (
           <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
              <motion.div initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}} onClick={() => setSelectedActivity(null)} className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" />
              <motion.div 
                initial={{opacity:0, scale:0.95, y:20}} animate={{opacity:1, scale:1, y:0}} exit={{opacity:0, scale:0.95, y:20}}
                className="relative w-full max-w-lg bg-white rounded-[2.5rem] shadow-2xl p-10"
              >
                 <div className="flex justify-between items-start mb-8">
                    <div className="h-16 w-16 rounded-2xl bg-brand-primary/10 flex items-center justify-center text-brand-primary">
                       <Target className="h-8 w-8" />
                    </div>
                    <button onClick={() => setSelectedActivity(null)} className="p-2 rounded-xl hover:bg-gray-100"><X className="h-5 w-5 text-slate-400"/></button>
                 </div>
                 <h4 className="text-xl font-black text-slate-800 italic uppercase mb-2">{selectedActivity.title}</h4>
                 <div className="flex gap-2 mb-8">
                    <span className="text-[10px] font-black px-3 py-1 bg-gray-50 text-slate-400 rounded-lg uppercase tracking-widest">{selectedActivity.date}</span>
                    <span className="text-[10px] font-black px-3 py-1 bg-brand-primary/10 text-brand-primary rounded-lg uppercase tracking-widest">{selectedActivity.type}</span>
                 </div>
                 <div className="p-6 rounded-2xl bg-gray-50 border border-gray-100">
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">Descripción</p>
                    <p className="text-sm font-medium text-slate-600 italic">"{selectedActivity.description || 'Sin descripción adicional.'}"</p>
                 </div>
                 <button className="w-full mt-8 py-5 rounded-2xl bg-brand-primary text-white text-[10px] font-black uppercase tracking-widest shadow-xl shadow-brand-primary/20">Ver Expediente Completo</button>
              </motion.div>
           </div>
         )}

         {isAddingEvent && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
               <motion.div initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}} onClick={() => setIsAddingEvent(false)} className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" />
               <motion.div
                 initial={{opacity:0, scale:0.95, y:20}} animate={{opacity:1, scale:1, y:0}} exit={{opacity:0, scale:0.95, y:20}}
                 className="relative w-full max-w-md bg-white rounded-[2.5rem] shadow-2xl p-10"
               >
                  <h4 className="text-xl font-black text-slate-800 italic uppercase mb-8">Nueva Actividad ACA</h4>
                  <form onSubmit={handleAddSubmit} className="space-y-6">
                     <div className="space-y-2">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Título</label>
                        <input 
                           required 
                           className="w-full p-4 rounded-2xl bg-gray-50 border-none ring-1 ring-gray-100 outline-none text-sm font-bold"
                           value={newEvent.title}
                           onChange={e => setNewEvent({...newEvent, title: e.target.value})}
                        />
                     </div>
                     <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                           <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Fecha</label>
                           <input 
                              type="date"
                              required 
                              className="w-full p-4 rounded-2xl bg-gray-50 border-none ring-1 ring-gray-100 outline-none text-sm font-bold"
                              value={newEvent.date}
                              onChange={e => setNewEvent({...newEvent, date: e.target.value})}
                           />
                        </div>
                        <div className="space-y-2">
                           <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Tipo</label>
                           <select 
                              className="w-full p-4 rounded-2xl bg-gray-50 border-none ring-1 ring-gray-100 text-xs font-black uppercase"
                              value={newEvent.type}
                              onChange={e => setNewEvent({...newEvent, type: e.target.value})}
                           >
                              <option value="asamblea">Asamblea</option>
                              <option value="censo">Censo</option>
                              <option value="reunion">Reunión</option>
                           </select>
                        </div>
                     </div>
                     <button type="submit" className="w-full py-5 rounded-2xl bg-brand-primary text-white text-[10px] font-black uppercase tracking-widest shadow-xl shadow-brand-primary/20">Programar Actividad</button>
                  </form>
               </motion.div>
            </div>
         )}
      </AnimatePresence>
    </div>
  );
};
