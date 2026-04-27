import React, { useState } from "react";
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Plus, 
  X, 
  Construction, 
  ArrowUpRight, 
  Upload, 
  Camera, 
  CheckCircle2 
} from "lucide-react";
import { cn } from "@/app/lib/utils";

interface ProyectosViewProps {
  projects: any[];
  onAddProject: (p: any) => void;
  onUpdateStatus: (id: string, s: string) => void;
}

export const ProyectosView = ({ 
  projects, 
  onAddProject, 
  onUpdateStatus 
}: ProyectosViewProps) => {
  const [isNewOpen, setIsNewOpen] = useState(false);
  const [step, setStep] = useState(1);
  const [editingProject, setEditingProject] = useState<any>(null);
  
  // State for the new project form
  const [newProjectData, setNewProjectData] = useState({
     name: '',
     nudo: '',
     t: 'T2 - Servicios Públicos',
     budget: '',
     beneficiaries: '',
     description: ''
  });

  const closeForm = () => {
    setIsNewOpen(false);
    setEditingProject(null);
    setStep(1);
    setNewProjectData({ name: '', nudo: '', t: 'T2 - Servicios Públicos', budget: '', beneficiaries: '', description: '' });
  };

  const handleCreateSubmit = () => {
    const project = {
      id: `PRY-2024-${Math.floor(Math.random() * 1000).toString().padStart(3, '0')}`,
      name: newProjectData.name,
      nudo: newProjectData.nudo,
      t: newProjectData.t,
      budget: `$${newProjectData.budget}`,
      status: 'Propuesto',
      progress: 0,
      date: new Date().toISOString().split('T')[0],
    };
    onAddProject(project);
    closeForm();
  };

  const handleUpdate = (e: React.FormEvent) => {
    e.preventDefault();
    const select = (e.currentTarget as any).statusSelect.value;
    onUpdateStatus(editingProject.id, select);
    setEditingProject(null);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
           <h3 className="text-xl font-black text-slate-800 italic uppercase tracking-tighter">Proyectos de Obra</h3>
           <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-1">Gestión y Seguimiento 7T</p>
        </div>
        <button 
          onClick={() => setIsNewOpen(true)}
          className="flex items-center gap-2 rounded-2xl bg-brand-primary px-6 py-3 text-[10px] font-black text-white shadow-xl shadow-brand-primary/20 hover:scale-105 active:scale-95 transition-all uppercase tracking-widest"
        >
          <Plus className="h-3 w-3" /> Nuevo Proyecto
        </button>
      </div>

      <div className="grid gap-4">
        {projects.map((p, i) => (
          <div key={i} className="bg-white rounded-[2rem] border border-gray-100 shadow-sm group hover:shadow-md transition-all overflow-hidden">
            <div className="p-6 flex flex-col lg:flex-row gap-8 lg:items-center">
              <div className="h-24 lg:w-40 rounded-2xl bg-slate-100 flex items-center justify-center shrink-0 border border-gray-50 relative group/photo">
                 <div className="absolute inset-0 bg-[url('https://picsum.photos/seed/const/400/300')] bg-cover grayscale opacity-20" />
                 <Construction className="h-8 w-8 text-slate-300 relative z-10" />
                 <button className="absolute inset-0 bg-brand-primary/80 text-white flex items-center justify-center opacity-0 group-hover/photo:opacity-100 transition-opacity text-[9px] font-black uppercase tracking-widest">
                    Cargar Foto
                 </button>
              </div>
              
              <div className="flex-1 space-y-3">
                 <div className="flex items-center justify-between">
                    <span className="text-[9px] font-black text-brand-primary uppercase">{p.id} • {p.nudo}</span>
                    <span className={cn(
                       "text-[8px] font-black px-2 py-0.5 rounded-full uppercase tracking-tighter border",
                       p.status === "En Ejecución" ? "bg-brand-primary/10 text-brand-primary border-brand-primary/20" : "bg-emerald-50 text-emerald-600 border-emerald-100"
                    )}>{p.status}</span>
                 </div>
                 <h4 className="text-sm font-black text-slate-800 tracking-tight italic leading-tight group-hover:text-brand-primary transition-colors">
                    "{p.name}"
                 </h4>
                 <div className="flex items-center gap-6 pt-2">
                    <div className="flex-1">
                       <div className="flex justify-between items-center mb-1">
                          <p className="text-[8px] font-bold text-slate-400 uppercase">Avance Físico</p>
                          <span className="text-[10px] font-black text-brand-primary">{p.progress}%</span>
                       </div>
                       <div className="h-1.5 w-full bg-gray-50 rounded-full overflow-hidden border border-gray-100">
                          <div className="h-full bg-brand-primary rounded-full transition-all duration-1000" style={{ width: `${p.progress}%` }} />
                       </div>
                    </div>
                    <div className="shrink-0 text-right">
                       <p className="text-[8px] font-bold text-slate-400 uppercase">Presupuesto</p>
                       <p className="text-[11px] font-black text-slate-800">{p.budget}</p>
                    </div>
                 </div>
              </div>

              <div className="lg:w-40 flex lg:flex-col justify-between items-end lg:items-end lg:border-l lg:border-gray-50 lg:pl-8 gap-4">
                 <div className="text-right">
                    <p className="text-[9px] font-bold text-slate-400 uppercase">Fecha</p>
                    <p className="text-[10px] font-black text-slate-800 italic">{p.date}</p>
                 </div>
                 <button 
                  onClick={() => setEditingProject(p)}
                  className="flex items-center gap-2 text-[9px] font-black text-brand-primary uppercase italic hover:underline"
                 >
                    Editar <ArrowUpRight className="h-3 w-3" />
                 </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      <AnimatePresence>
         {isNewOpen && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
               <motion.div initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}} onClick={closeForm} className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" />
               <motion.div initial={{opacity:0, scale:0.95, y:20}} animate={{opacity:1, scale:1, y:0}} exit={{opacity:0, scale:0.95, y:20}} className="relative w-full max-w-2xl bg-white rounded-[2.5rem] shadow-2xl overflow-hidden">
                  {/* Stepper Header */}
                  <div className="bg-slate-50 p-8 border-b border-gray-100">
                     <div className="flex items-center justify-between mb-8">
                        <h4 className="text-xl font-black text-slate-800 italic uppercase italic">Nuevo Proyecto Comunal</h4>
                        <button onClick={closeForm} className="p-2 rounded-xl hover:bg-gray-200 transition-colors"><X className="h-5 w-5 text-slate-400"/></button>
                     </div>
                     <div className="flex items-center gap-2">
                        {[1, 2, 3, 4, 5].map(s => (
                           <div key={s} className="flex-1 flex flex-col gap-2">
                              <div className={cn("h-1 rounded-full transition-all", step >= s ? "bg-brand-primary" : "bg-gray-200")} />
                              <span className={cn("text-[8px] font-black uppercase text-center", step === s ? "text-brand-primary" : "text-slate-300")}>Paso {s}</span>
                           </div>
                        ))}
                     </div>
                  </div>

                  <form className="p-8 max-h-[60vh] overflow-y-auto space-y-8">
                     {step === 1 && (
                        <div className="space-y-6">
                           <div className="space-y-2">
                              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Nombre del Proyecto</label>
                              <input 
                                className="w-full p-4 rounded-2xl bg-gray-50 border-none ring-1 ring-gray-100 outline-none text-sm font-bold" 
                                placeholder="Especifique obra (Ej: Sustitución de red...)" 
                                value={newProjectData.name}
                                onChange={e => setNewProjectData({...newProjectData, name: e.target.value})}
                              />
                           </div>
                           <div className="grid sm:grid-cols-2 gap-6">
                              <div className="space-y-2">
                                 <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Código Nudo Crítico</label>
                                 <input 
                                    className="w-full p-4 rounded-2xl bg-gray-50 border-none ring-1 ring-gray-100 outline-none text-sm font-bold" 
                                    placeholder="Ej: T2-AGU-001" 
                                    value={newProjectData.nudo}
                                    onChange={e => setNewProjectData({...newProjectData, nudo: e.target.value})}
                                 />
                              </div>
                              <div className="space-y-2">
                                 <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Vincular 7T</label>
                                 <select 
                                    className="w-full p-4 rounded-2xl bg-gray-50 border-none ring-1 ring-gray-100 text-xs font-black uppercase"
                                    value={newProjectData.t}
                                    onChange={e => setNewProjectData({...newProjectData, t: e.target.value})}
                                 >
                                    <option>T1 - Económica</option>
                                    <option>T2 - Servicios Públicos</option>
                                    <option>T3 - Seguridad</option>
                                    <option>T4 - Social</option>
                                 </select>
                              </div>
                           </div>
                        </div>
                     )}

                     {step === 2 && (
                        <div className="space-y-6">
                           <div className="space-y-2">
                              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Población Beneficiaria (Familias)</label>
                              <input 
                                 type="number" 
                                 className="w-full p-4 rounded-2xl bg-gray-50 border-none ring-1 ring-gray-100 outline-none text-sm font-bold" 
                                 placeholder="N° Familias impactadas" 
                                 value={newProjectData.beneficiaries}
                                 onChange={e => setNewProjectData({...newProjectData, beneficiaries: e.target.value})}
                              />
                           </div>
                           <div className="space-y-2">
                              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Diagnóstico Participativo</label>
                              <textarea 
                                 className="w-full p-4 rounded-2xl bg-gray-50 border-none ring-1 ring-gray-100 outline-none text-xs font-medium min-h-[120px]" 
                                 placeholder="Resumen del diagnóstico comunitario..." 
                                 value={newProjectData.description}
                                 onChange={e => setNewProjectData({...newProjectData, description: e.target.value})}
                              />
                           </div>
                        </div>
                     )}

                     {step === 3 && (
                        <div className="space-y-6">
                           <div className="grid sm:grid-cols-2 gap-6">
                              <div className="space-y-2">
                                 <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Presupuesto Estimado</label>
                                 <input 
                                    className="w-full p-4 rounded-2xl bg-gray-50 border-none ring-1 ring-gray-100 outline-none text-sm font-bold" 
                                    placeholder="$ 0.00" 
                                    value={newProjectData.budget}
                                    onChange={e => setNewProjectData({...newProjectData, budget: e.target.value})}
                                 />
                              </div>
                              <div className="space-y-2">
                                 <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Ente Financiamiento</label>
                                 <input className="w-full p-4 rounded-2xl bg-gray-50 border-none ring-1 ring-gray-100 outline-none text-sm font-bold" placeholder="Ej: CFG, Alcaldía, Otros" />
                              </div>
                           </div>
                           <div className="space-y-2">
                              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Ingeniero/Técnico Responsable</label>
                              <input className="w-full p-4 rounded-2xl bg-gray-50 border-none ring-1 ring-gray-100 outline-none text-sm font-bold" placeholder="Nombre y Apellido" />
                           </div>
                        </div>
                     )}

                     {step === 4 && (
                        <div className="space-y-6">
                           <div className="p-10 border-2 border-dashed border-gray-100 rounded-[2rem] flex flex-col items-center justify-center text-center group hover:border-brand-primary/20 transition-all cursor-pointer bg-gray-50/50">
                              <Upload className="h-10 w-10 text-slate-300 mb-4 group-hover:text-brand-primary transition-colors" />
                              <h5 className="text-[11px] font-black text-slate-800 uppercase tracking-widest">Acta de Asamblea & Listado</h5>
                              <p className="text-[9px] text-slate-400 mt-2 font-bold uppercase tracking-tighter italic">Subir PDF escaneado (Requerido para aprobación)</p>
                           </div>
                           <div className="p-10 border-2 border-dashed border-gray-100 rounded-[2rem] flex flex-col items-center justify-center text-center group hover:border-brand-primary/20 transition-all cursor-pointer">
                              <Camera className="h-10 w-10 text-slate-300 mb-4 group-hover:text-brand-primary transition-colors" />
                              <h5 className="text-[11px] font-black text-slate-800 uppercase tracking-widest">Fotos Soporte (Antes)</h5>
                              <p className="text-[9px] text-slate-400 mt-2 font-bold uppercase tracking-tighter italic">Evidencia visual del nudo crítico</p>
                           </div>
                        </div>
                     )}

                     {step === 5 && (
                        <div className="flex flex-col items-center justify-center py-10 text-center">
                           <div className="h-20 w-20 rounded-[2.5rem] bg-emerald-50 text-emerald-500 flex items-center justify-center mb-6">
                              <CheckCircle2 className="h-10 w-10" />
                           </div>
                           <h4 className="text-xl font-black text-slate-800 italic uppercase">¡Listo para Registro!</h4>
                           <p className="text-slate-500 text-sm mt-2 max-w-sm">Su proyecto quedará en estado <b>"Propuesto"</b> hasta la validación de la Sala de Proyectos.</p>
                        </div>
                     )}
                  </form>

                  <div className="p-8 bg-slate-50 border-t border-gray-100 flex items-center justify-between gap-4">
                     {step > 1 && step < 5 && (
                        <button type="button" onClick={() => setStep(step - 1)} className="px-8 py-3 rounded-xl border border-gray-200 text-[10px] font-black uppercase text-slate-400 hover:bg-white transition-all">Anterior</button>
                     )}
                     {step < 5 ? (
                        <button type="button" onClick={() => setStep(step + 1)} className="ml-auto px-10 py-4 rounded-xl bg-brand-primary text-white text-[10px] font-black uppercase tracking-widest shadow-lg shadow-brand-primary/20 active:scale-95 transition-all">Siguiente Paso</button>
                     ) : (
                        <button type="button" onClick={handleCreateSubmit} className="w-full py-5 rounded-2xl bg-brand-primary text-white text-[10px] font-black uppercase tracking-widest shadow-xl shadow-brand-primary/20">Finalizar Registro</button>
                     )}
                  </div>
               </motion.div>
            </div>
         )}

         {editingProject && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
               <motion.div initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}} onClick={() => setEditingProject(null)} className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" />
               <motion.div initial={{opacity:0, scale:0.95, y:20}} animate={{opacity:1, scale:1, y:0}} exit={{opacity:0, scale:0.95, y:20}} className="relative w-full max-w-lg bg-white rounded-[2.5rem] shadow-2xl p-10">
                  <div className="flex justify-between items-center mb-8">
                     <h4 className="text-xl font-black text-slate-800 italic uppercase">Editar Proyecto</h4>
                     <button onClick={() => setEditingProject(null)} className="p-2 rounded-xl hover:bg-gray-100 transition-colors"><X className="h-5 w-5 text-slate-400"/></button>
                  </div>
                  <form onSubmit={handleUpdate} className="space-y-6">
                     <div className="p-6 rounded-2xl bg-gray-50 border border-gray-100">
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Estado de Proyecto</p>
                        <select name="statusSelect" className="w-full bg-transparent text-sm font-black text-brand-primary outline-none cursor-pointer">
                           <option value="Propuesto">Propuesto</option>
                           <option value="En Revisión">En Revisión</option>
                           <option value="Aprobado">Aprobado</option>
                           <option value="En Ejecución">En Ejecución</option>
                           <option value="Culminado">Culminado</option>
                        </select>
                     </div>
                     <div className="space-y-2">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Porcentaje de Avance Físico</label>
                        <div className="flex items-center gap-4">
                           <input type="range" className="flex-1 accent-brand-primary" min="0" max="100" defaultValue={editingProject.progress} />
                           <span className="text-sm font-black text-brand-primary">{editingProject.progress}%</span>
                        </div>
                     </div>
                     <button type="submit" className="w-full py-5 rounded-2xl bg-brand-primary text-white text-[10px] font-black uppercase tracking-widest shadow-xl shadow-brand-primary/20">Actualizar Datos</button>
                  </form>
               </motion.div>
            </div>
         )}
      </AnimatePresence>
    </div>
  );
};
