import React, { useState } from "react";
import { motion, AnimatePresence } from 'framer-motion';
import { 
  AlertCircle, 
  Building2, 
  Activity, 
  Construction, 
  X, 
  MapPin 
} from "lucide-react";
import { cn } from "@/app/lib/utils";

export const NudosCriticosView = () => {
  const [isReportOpen, setIsReportOpen] = useState(false);
  const [selectedNode, setSelectedNode] = useState<any>(null);
  const [severity, setSeverity] = useState<"Bajo" | "Medio" | "Alto/Crítico">("Bajo");

  const closeReport = () => setIsReportOpen(false);

  return (
    <div className="space-y-6">
      <div className="bg-rose-50 border border-rose-100 rounded-[2.5rem] p-8 flex flex-col md:flex-row items-center gap-8 shadow-sm">
        <div className="h-16 w-16 rounded-2xl bg-rose-500 flex items-center justify-center text-white shadow-lg shadow-rose-500/20 shrink-0">
          <AlertCircle className="h-8 w-8" />
        </div>
        <div className="text-center md:text-left">
          <h3 className="text-xl font-black text-rose-900 italic uppercase tracking-tighter">
            Gestión de Nudos Críticos
          </h3>
          <p className="text-rose-700/70 text-xs font-bold uppercase tracking-widest mt-1">
            Identificación de obstáculos prioritarios (Agenda ACA)
          </p>
        </div>
        <button 
          onClick={() => setIsReportOpen(true)}
          className="md:ml-auto bg-rose-500 text-white px-8 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest shadow-lg shadow-rose-500/20 hover:scale-105 active:scale-95 transition-all"
        >
          Reportar Nudo Crítico
        </button>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {[
          {
            icon: Building2,
            title: "Infraestructura",
            issue: "Colapso de tubería principal de aguas servidas",
            impact: "Crítico",
            families: 80,
            id: "T2-AGU-001"
          },
          {
            icon: Activity,
            title: "Salud",
            issue: "Sin insumos médicos en ambulatorio local",
            impact: "Urgente",
            families: 342,
            id: "T4-SAL-002"
          },
          {
             icon: Construction,
             title: "Servicios",
             issue: "Falla de alumbrado público en Sector Bajo",
             impact: "Medio",
             families: 45,
             id: "T2-ELE-003"
          }
        ].map((node, i) => (
          <div
            key={i}
            className="bg-white p-6 rounded-[2rem] border border-gray-100 shadow-sm group hover:shadow-md transition-all relative overflow-hidden"
          >
            <div className="flex justify-between items-start mb-4">
               <div className="h-12 w-12 rounded-2xl bg-gray-50 flex items-center justify-center text-slate-400 group-hover:text-brand-primary group-hover:bg-brand-primary/10 transition-all shrink-0">
                  <node.icon className="h-6 w-6" />
               </div>
               <span className={cn(
                  "text-[8px] font-black px-2 py-0.5 rounded-full uppercase tracking-tighter border",
                  node.impact === "Crítico" ? "bg-rose-50 text-rose-600 border-rose-100" : "bg-amber-50 text-amber-600 border-amber-100"
               )}>{node.impact}</span>
            </div>
            <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">{node.id} • {node.title}</p>
            <h4 className="text-sm font-black text-slate-800 leading-tight mb-4 group-hover:text-brand-primary transition-colors">
              {node.issue}
            </h4>
            <div className="flex items-center justify-between pt-4 border-t border-gray-50">
               <p className="text-[10px] font-bold text-slate-400 italic">{node.families} Familias Afectadas</p>
               <button 
                  onClick={() => setSelectedNode(node)}
                  className="text-[10px] font-black text-brand-primary uppercase underline italic"
               >
                  Ver Detalle
               </button>
            </div>
          </div>
        ))}
      </div>

      <AnimatePresence>
        {isReportOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
             <motion.div initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}} onClick={closeReport} className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" />
             <motion.div initial={{opacity:0, scale:0.95, y:20}} animate={{opacity:1, scale:1, y:0}} exit={{opacity:0, scale:0.95, y:20}} className="relative w-full max-w-2xl bg-white rounded-[2.5rem] shadow-2xl overflow-hidden max-h-[90vh] overflow-y-auto">
                <div className="p-8 border-b border-gray-50 flex items-center justify-between sticky top-0 bg-white z-10">
                   <h4 className="text-xl font-black text-slate-800 italic uppercase tracking-widest">Reportar Nudo Crítico</h4>
                   <button onClick={closeReport} className="p-2 rounded-xl hover:bg-gray-100"><X className="h-5 w-5 text-slate-400"/></button>
                </div>
                <form className="p-8 space-y-8">
                   {/* Categoría y Urgencia */}
                   <div className="grid sm:grid-cols-2 gap-6">
                      <div className="space-y-2">
                         <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Transformación 7T</label>
                         <select className="w-full p-4 rounded-2xl bg-gray-50 border-none ring-1 ring-gray-100 focus:ring-2 focus:ring-brand-primary/20 text-xs font-black uppercase">
                            <option>T1 - Económica</option>
                            <option>T2 - Servicios Públicos</option>
                            <option>T3 - Seguridad</option>
                            <option>T4 - Social</option>
                            <option>T5 - Política</option>
                            <option>T6 - Ciencia</option>
                            <option>T7 - Geopolítica</option>
                         </select>
                      </div>
                      <div className="space-y-2">
                         <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Nivel de Gravedad (Semáforo)</label>
                         <div className="flex gap-2">
                            {["Bajo", "Medio", "Alto/Crítico"].map(s => (
                               <button 
                                  key={s}
                                  type="button"
                                  onClick={() => setSeverity(s as any)}
                                  className={cn(
                                     "flex-1 py-3 rounded-xl text-[9px] font-black uppercase tracking-tighter border transition-all",
                                     severity === s ? "border-brand-primary bg-brand-primary text-white" : "border-gray-100 bg-gray-50 text-slate-400"
                                  )}
                               >
                                  {s}
                               </button>
                            ))}
                         </div>
                      </div>
                   </div>

                   <div className="space-y-2">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Título del Nudo Crítico</label>
                      <input className="w-full p-4 rounded-2xl bg-gray-50 border-none ring-1 ring-gray-100 focus:ring-2 focus:ring-brand-primary/20 outline-none text-sm font-bold" placeholder="Ej: Colapso de tubería principal..." />
                   </div>

                   {severity === "Alto/Crítico" && (
                      <motion.div initial={{opacity:0, height:0}} animate={{opacity:1, height:'auto'}} className="p-6 rounded-[2rem] bg-rose-50 border border-rose-100 space-y-4">
                         <div className="flex items-center gap-3 text-rose-600">
                            <AlertCircle className="h-5 w-5" />
                            <h5 className="text-[10px] font-black uppercase tracking-widest">Alerta de Riesgo Inminente</h5>
                         </div>
                         <div className="space-y-2">
                            <label className="text-[9px] font-bold text-rose-400 uppercase">Justifique la Gravedad (Obligatorio)</label>
                            <textarea className="w-full p-4 rounded-xl bg-white border border-rose-100 outline-none text-xs font-medium min-h-[100px]" placeholder="Describa el riesgo para la vida o servicios esenciales..." />
                         </div>
                         <p className="text-[8px] text-rose-400 font-bold uppercase italic">* Se notificará inmediatamente al Secretario Comunal</p>
                      </motion.div>
                   )}

                   <div className="grid sm:grid-cols-2 gap-6">
                      <div className="space-y-2">
                         <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest" >Personas Afectadas</label>
                         <div className="flex items-center gap-2">
                            <input className="w-full p-4 rounded-2xl bg-gray-50 border-none ring-1 ring-gray-100 outline-none text-xs font-black" placeholder="N° Familias" />
                            <input className="w-full p-4 rounded-2xl bg-gray-50 border-none ring-1 ring-gray-100 outline-none text-xs font-black" placeholder="N° Personas" />
                         </div>
                      </div>
                      <div className="space-y-2">
                         <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Coordenadas GPS</label>
                         <div className="flex items-center gap-2">
                            <button type="button" className="p-4 rounded-2xl bg-slate-800 text-white"><MapPin className="h-5 w-5" /></button>
                            <input className="w-full p-4 rounded-2xl bg-gray-50 border-none ring-1 ring-gray-100 text-[10px] font-mono" disabled value="10.3456, -66.9876" />
                         </div>
                      </div>
                   </div>

                   <button className="w-full py-5 rounded-2xl bg-brand-primary text-white text-[10px] font-black uppercase tracking-[0.2em] shadow-xl shadow-brand-primary/20 active:scale-95 transition-all">
                      Registrar Reporte Prioritario
                   </button>
                </form>
             </motion.div>
          </div>
        )}

        {selectedNode && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
             <motion.div initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}} onClick={() => setSelectedNode(null)} className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" />
             <motion.div initial={{opacity:0, scale:0.95, y:20}} animate={{opacity:1, scale:1, y:0}} exit={{opacity:0, scale:0.95, y:20}} className="relative w-full max-w-xl bg-white rounded-[2.5rem] shadow-2xl p-10">
                <div className="flex justify-between items-start mb-8">
                   <div className="h-16 w-16 rounded-2xl bg-brand-primary/10 flex items-center justify-center text-brand-primary">
                      <selectedNode.icon className="h-8 w-8" />
                   </div>
                   <button onClick={() => setSelectedNode(null)} className="p-2 rounded-xl hover:bg-gray-100"><X className="h-5 w-5 text-slate-400"/></button>
                </div>
                <h4 className="text-xl font-black text-slate-800 italic uppercase leading-tight mb-2">{selectedNode.issue}</h4>
                <div className="flex items-center gap-3 mb-8">
                   <span className="text-[10px] font-black px-3 py-1 bg-rose-50 text-rose-500 rounded-lg uppercase border border-rose-100">{selectedNode.impact}</span>
                   <span className="text-[10px] font-black px-3 py-1 bg-slate-50 text-slate-400 rounded-lg uppercase">{selectedNode.id}</span>
                </div>
                
                <div className="grid gap-6 py-6 border-y border-gray-50">
                   <div className="flex items-center justify-between">
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Población Afectada</p>
                      <p className="text-sm font-black text-slate-800">{selectedNode.families} Familias</p>
                   </div>
                   <div className="flex items-center justify-between">
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Ubicación</p>
                      <p className="text-sm font-black text-slate-800 italic">Sector Bajo, Brisas 3</p>
                   </div>
                </div>

                <div className="mt-10 flex gap-4">
                   <button className="flex-1 py-4 rounded-xl bg-slate-100 text-slate-600 text-[10px] font-black uppercase tracking-widest">Ver Fotos ( Antes )</button>
                   <button className="flex-1 py-4 rounded-xl bg-brand-primary text-white text-[10px] font-black uppercase tracking-widest shadow-xl shadow-brand-primary/20">Vincular Proyecto</button>
                </div>
             </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
