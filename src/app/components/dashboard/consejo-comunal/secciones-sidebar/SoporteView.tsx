import React from "react";
import { 
  MessageSquare, 
  Info 
} from "lucide-react";

export const SoporteView = () => {
  return (
    <div className="space-y-8">
      <div className="bg-white rounded-[3rem] p-12 border border-gray-100 shadow-sm relative overflow-hidden">
        <div className="max-w-xl relative z-10">
          <div className="h-12 w-12 rounded-2xl bg-brand-primary/10 flex items-center justify-center text-brand-primary mb-6">
            <MessageSquare className="h-6 w-6" />
          </div>
          <h4 className="text-xl font-black text-slate-800 italic uppercase tracking-tighter">
            Soporte Técnico
          </h4>
          <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-2 leading-relaxed">
            Resolución inmediata de dudas sobre la carga de datos, censo o gestión de ACA.
          </p>
          <button className="mt-8 px-8 py-3 rounded-xl bg-brand-primary text-white text-[10px] font-black uppercase tracking-widest hover:scale-105 transition-all shadow-lg shadow-brand-primary/20">
            Iniciar Chat en Vivo
          </button>
        </div>

        <div className="grid grid-cols-2 gap-4 mt-12">
          <div className="bg-gray-50 p-6 rounded-[2rem] border border-gray-100 group hover:border-brand-primary/20 transition-all cursor-pointer">
            <Info className="h-6 w-6 text-slate-300 mb-4 group-hover:text-brand-primary transition-colors" />
            <h4 className="text-[10px] font-black text-slate-800 uppercase tracking-tighter">
              Manual Usuario
            </h4>
            <button className="mt-4 text-[9px] font-black text-brand-primary uppercase tracking-widest underline italic">
              PDF
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};