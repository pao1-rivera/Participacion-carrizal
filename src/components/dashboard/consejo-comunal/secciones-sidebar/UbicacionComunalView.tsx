import React, { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { 
  Sparkles, 
  Map as MapIcon, 
  FileText, 
  Upload, 
  Info, 
  CloudUpload 
} from "lucide-react";

export const UbicacionComunalView = () => {
  const [showDocs, setShowDocs] = useState(false);

  return (
    <div className="space-y-8">
      <div className="bg-brand-secondary rounded-[3rem] p-12 text-white relative overflow-hidden group shadow-2xl">
        <div className="relative z-10 max-w-2xl">
          <Sparkles className="h-12 w-12 text-cyan-400 mb-6 animate-pulse" />
          <h3 className="text-4xl font-black italic tracking-tighter uppercase leading-none">
            Mapa de los Sueños
          </h3>
          <p className="text-cyan-100/70 text-lg mt-6 font-medium leading-relaxed">
            Proyecte el desarrollo de su comunidad y envíe su visión estratégica
            directamente al despacho de la Alcaldía. Este documento es el insumo
            para el Plan de Desarrollo Municipal 2030.
          </p>
          <div className="flex flex-wrap items-center gap-6 mt-12">
            <button 
              onClick={() => setShowDocs(true)}
              className="bg-brand-primary px-10 py-5 rounded-2xl text-[11px] font-black uppercase tracking-[0.2em] hover:scale-105 active:scale-95 transition-all shadow-2xl shadow-brand-primary/40"
            >
              Cargar Visión de Comunidad
            </button>
            <button className="px-10 py-5 rounded-2xl border-2 border-white/10 hover:bg-white/5 transition-all text-[11px] font-black uppercase tracking-[0.2em]">
              Ver Ejemplos de Éxito
            </button>
          </div>
        </div>
        <div className="absolute top-0 right-0 p-20 opacity-10 rotate-12 transition-transform duration-1000 group-hover:rotate-45">
          <MapIcon className="h-80 w-80 shadow-2xl" />
        </div>
      </div>

      <div className="grid lg:grid-cols-2 gap-8">
         <div className="bg-white p-8 rounded-[3rem] border border-gray-100 shadow-sm space-y-6">
            <div className="flex items-center justify-between">
               <h4 className="text-lg font-black text-slate-800 italic uppercase">Proyección de Desarrollo</h4>
               <span className="text-[9px] font-black px-2 py-1 bg-brand-primary/10 text-brand-primary rounded-lg uppercase">Visual</span>
            </div>
            <div className="aspect-video rounded-[2.5rem] bg-slate-100 border-4 border-white shadow-xl overflow-hidden relative group cursor-pointer">
               <img src="https://picsum.photos/seed/vision2030/1200/800" className="w-full h-full object-cover grayscale opacity-40 group-hover:grayscale-0 group-hover:opacity-100 transition-all duration-700" alt="Vision projection" />
               <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-slate-900/40">
                  <span className="text-white text-[10px] font-black uppercase tracking-widest border border-white/20 px-6 py-3 rounded-xl backdrop-blur-sm">Ampliar Maqueta 2030</span>
               </div>
            </div>
            <p className="text-[11px] text-slate-400 font-medium leading-relaxed italic">
               "Nuestra visión es transformar el Sector 4 en un corredor ecoturístico y productivo, garantizando servicios 100% eficientes para todas las familias."
            </p>
         </div>

         <div className="bg-white p-8 rounded-[3rem] border border-gray-100 shadow-sm space-y-6">
            <h4 className="text-lg font-black text-slate-800 italic uppercase">Documento Estratégico</h4>
            <div className="p-6 rounded-[2rem] bg-gray-50 border border-gray-100 flex items-center gap-6 group hover:border-brand-primary/30 transition-all cursor-pointer">
               <div className="h-14 w-14 rounded-2xl bg-white border border-gray-100 flex items-center justify-center text-rose-500 shadow-sm group-hover:rotate-6 transition-transform">
                  <FileText className="h-7 w-7" />
               </div>
               <div className="flex-1">
                  <p className="text-sm font-black text-slate-800 uppercase italic leading-tight">Plan Maestro_Brisas_2030.pdf</p>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">Cargado: 12 Mayo 2024</p>
               </div>
               <button className="h-10 w-10 rounded-xl bg-brand-primary text-white flex items-center justify-center shadow-lg shadow-brand-primary/20">
                  <Upload className="h-4 w-4" />
               </button>
            </div>
            <div className="p-4 rounded-2xl bg-blue-50 border border-blue-100 flex items-center gap-3">
               <Info className="h-4 w-4 text-blue-500" />
               <p className="text-[9px] font-black text-blue-700 uppercase tracking-tighter">Este documento está siendo revisado por la Dirección de Planificación.</p>
            </div>
         </div>
      </div>

      <AnimatePresence>
         {showDocs && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
               <motion.div initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}} onClick={() => setShowDocs(false)} className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" />
               <motion.div initial={{opacity:0, scale:0.95, y:20}} animate={{opacity:1, scale:1, y:0}} exit={{opacity:0, scale:0.95, y:20}} className="relative w-full max-w-lg bg-white rounded-[2.5rem] shadow-2xl p-10">
                  <h4 className="text-xl font-black text-slate-800 italic uppercase mb-6">Cargar Visión Territorial</h4>
                  <div className="p-12 border-2 border-dashed border-gray-100 rounded-[2rem] bg-gray-50 flex flex-col items-center group cursor-pointer hover:border-brand-primary/30 transition-all">
                     <CloudUpload className="h-10 w-10 text-slate-300 mb-4 group-hover:text-brand-primary group-hover:scale-110 transition-all" />
                     <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">Sube tu archivo PDF o Imagen de la Maqueta</p>
                  </div>
                  <button onClick={() => setShowDocs(false)} className="w-full py-5 mt-8 rounded-2xl bg-brand-primary text-white text-[10px] font-black uppercase tracking-widest">Enviar al Despacho</button>
               </motion.div>
            </div>
         )}
      </AnimatePresence>
    </div>
  );
};
