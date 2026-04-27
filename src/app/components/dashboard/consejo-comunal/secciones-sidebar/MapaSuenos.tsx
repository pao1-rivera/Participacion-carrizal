import React, { useState } from "react";
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Sparkles, 
  Map as MapIcon, 
  FileText, 
  Upload, 
  Info, 
  CloudUpload,
  Calendar,
  Tag
} from "lucide-react";

export const MapaSuenos = () => {
  const [showDocs, setShowDocs] = useState(false);

  // Definición de las 7 Transformaciones para el etiquetado
  const sieteT = [
    { id: "T1", name: "Económica", color: "bg-blue-500" },
    { id: "T2", name: "Independencia Plena", color: "bg-red-500" },
    { id: "T3", name: "Paz, Seguridad e Integridad", color: "bg-orange-500" },
    { id: "T4", name: "Social", color: "bg-green-500" },
    { id: "T5", name: "Política", color: "bg-purple-500" },
    { id: "T6", name: "Ecológica", color: "bg-emerald-500" },
    { id: "T7", name: "Geopolítica", color: "bg-indigo-500" },
  ];

  return (
    <div className="space-y-8">
      {/* Header Principal */}
      <div className="bg-brand-secondary rounded-[3rem] p-12 text-white relative overflow-hidden group shadow-2xl">
        <div className="relative z-10 max-w-2xl">
          <Sparkles className="h-12 w-12 text-cyan-400 mb-6 animate-pulse" />
          <h3 className="text-2xl font-black italic tracking-tighter uppercase leading-none">
            Mapa de los Sueños
          </h3>
          <p className="text-cyan-100/70 text-lg mt-6 font-medium leading-relaxed">
            Este es su Plan de Desarrollo Comunitario. Priorice las metas de su comunidad 
            vinculadas a las 7 Transformaciones (7T) para la Agenda Concreta de Acción.
          </p>
          <div className="flex flex-wrap items-center gap-6 mt-12">
            <button 
              onClick={() => setShowDocs(true)}
              className="bg-brand-primary px-10 py-5 rounded-2xl text-[11px] font-black uppercase tracking-[0.2em] hover:scale-105 active:scale-95 transition-all shadow-2xl shadow-brand-primary/40"
            >
              Cargar Plan de Desarrollo
            </button>
            <button className="px-10 py-5 rounded-2xl border-2 border-white/10 hover:bg-white/5 transition-all text-[11px] font-black uppercase tracking-[0.2em]">
              Guía de las 7T
            </button>
          </div>
        </div>
        <div className="absolute top-0 right-0 p-20 opacity-10 rotate-12 transition-transform duration-1000 group-hover:rotate-45">
          <MapIcon className="h-80 w-80 shadow-2xl" />
        </div>
      </div>

      <div className="grid lg:grid-cols-2 gap-8">
         {/* Panel de Planificación Participativa (Sueños Etiquetados) */}
         <div className="bg-white p-8 rounded-[3rem] border border-gray-100 shadow-sm space-y-6">
            <div className="flex items-center justify-between">
               <h4 className="text-lg font-black text-slate-800 italic uppercase">Metas Priorizadas</h4>
               <span className="text-[9px] font-black px-2 py-1 bg-brand-primary/10 text-brand-primary rounded-lg uppercase">Plan de Acción</span>
            </div>
            
            <div className="space-y-4">
              {/* Ejemplo Corto Plazo */}
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100">
                <div className="flex justify-between items-start mb-2">
                  <span className="text-[10px] font-bold text-slate-400 uppercase flex items-center gap-1">
                    <Calendar className="h-3 w-3" /> Corto Plazo (Año 1)
                  </span>
                  <span className="px-2 py-1 rounded-md bg-blue-600 text-white text-[8px] font-black uppercase tracking-tighter">
                    T4: Social
                  </span>
                </div>
                <p className="text-xs font-black text-slate-700 uppercase italic">Rehabilitación del Alumbrado Público</p>
              </div>

              {/* Ejemplo Mediano Plazo */}
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100">
                <div className="flex justify-between items-start mb-2">
                  <span className="text-[10px] font-bold text-slate-400 uppercase flex items-center gap-1">
                    <Calendar className="h-3 w-3" /> Mediano Plazo (Año 3)
                  </span>
                  <span className="px-2 py-1 rounded-md bg-emerald-600 text-white text-[8px] font-black uppercase tracking-tighter">
                    T1: Económica
                  </span>
                </div>
                <p className="text-xs font-black text-slate-700 uppercase italic">Creación de Bloquera Comunal</p>
              </div>
            </div>

            <p className="text-[11px] text-slate-400 font-medium leading-relaxed italic">
               "Cada meta seleccionada debe responder a una de las 7 Transformaciones para su viabilidad técnica."
            </p>
         </div>

         {/* Documento Estratégico */}
         <div className="bg-white p-8 rounded-[3rem] border border-gray-100 shadow-sm space-y-6">
            <h4 className="text-lg font-black text-slate-800 italic uppercase">Expediente del Mapa</h4>
            <div className="p-6 rounded-[2rem] bg-gray-50 border border-gray-100 flex items-center gap-6 group hover:border-brand-primary/30 transition-all cursor-pointer">
               <div className="h-14 w-14 rounded-2xl bg-white border border-gray-100 flex items-center justify-center text-rose-500 shadow-sm group-hover:rotate-6 transition-transform">
                  <FileText className="h-7 w-7" />
               </div>
               <div className="flex-1">
                  <p className="text-sm font-black text-slate-800 uppercase italic leading-tight">Mapa_Suenos_Carrizal_2030.pdf</p>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">Estatus: En Revisión</p>
               </div>
               <button className="h-10 w-10 rounded-xl bg-brand-primary text-white flex items-center justify-center shadow-lg shadow-brand-primary/20">
                  <Upload className="h-4 w-4" />
               </button>
            </div>
            <div className="p-4 rounded-2xl bg-blue-50 border border-blue-100 flex items-center gap-3">
               <Info className="h-4 w-4 text-blue-500" />
               <p className="text-[9px] font-black text-blue-700 uppercase tracking-tighter">Vinculado al Plan de Desarrollo Municipal de Carrizal.</p>
            </div>
         </div>
      </div>

      {/* Modal de Carga con Formulario de Sueños */}
      <AnimatePresence>
         {showDocs && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
               <motion.div initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}} onClick={() => setShowDocs(false)} className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" />
               <motion.div initial={{opacity:0, scale:0.95, y:20}} animate={{opacity:1, scale:1, y:0}} exit={{opacity:0, scale:0.95, y:20}} className="relative w-full max-w-xl bg-white rounded-[2.5rem] shadow-2xl p-10 overflow-y-auto max-h-[90vh]">
                  <h4 className="text-xl font-black text-slate-800 italic uppercase mb-6">Planificación de Sueños</h4>
                  
                  <div className="space-y-6">
                    {/* Input de Título/Visión */}
                    <div>
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-2 block">Meta o Proyecto</label>
                      <input type="text" placeholder="Ej: Creación de bloquera..." className="w-full p-4 rounded-2xl bg-gray-50 border border-gray-100 text-sm font-bold focus:border-brand-primary outline-none transition-all" />
                    </div>

                    {/* Selector de Tiempo */}
                    <div className="grid grid-cols-3 gap-3">
                      {['Corto', 'Mediano', 'Largo'].map((tiempo) => (
                        <button key={tiempo} className="py-3 rounded-xl border border-gray-100 text-[9px] font-black uppercase hover:bg-brand-primary hover:text-white transition-all">
                          {tiempo} Plazo
                        </button>
                      ))}
                    </div>

                    {/* Selector de 7T */}
                    <div>
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-3 block flex items-center gap-2">
                        <Tag className="h-3 w-3" /> Vincular con las 7T
                      </label>
                      <div className="grid grid-cols-4 gap-2">
                        {sieteT.map((t) => (
                          <button key={t.id} title={t.name} className="p-2 rounded-lg bg-gray-50 border border-gray-100 hover:border-brand-primary transition-all flex flex-col items-center">
                            <span className="text-[10px] font-black text-slate-800">{t.id}</span>
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className="p-8 border-2 border-dashed border-gray-100 rounded-[2rem] bg-gray-50 flex flex-col items-center group cursor-pointer hover:border-brand-primary/30 transition-all">
                       <CloudUpload className="h-10 w-10 text-slate-300 mb-4 group-hover:text-brand-primary group-hover:scale-110 transition-all" />
                       <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">Adjuntar PDF del Proyecto Completo</p>
                    </div>
                  </div>

                  <button onClick={() => setShowDocs(false)} className="w-full py-5 mt-8 rounded-2xl bg-brand-primary text-white text-[10px] font-black uppercase tracking-widest">Registrar Meta Comunal</button>
               </motion.div>
            </div>
         )}
      </AnimatePresence>
    </div>
  );
};