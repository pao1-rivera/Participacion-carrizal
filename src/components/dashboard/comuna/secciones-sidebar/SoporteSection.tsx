import React from 'react';
import { 
  LifeBuoy, 
  ChevronRight, 
  FileText,
  Mail,
  Building2
} from 'lucide-react';
import { cn } from '../../../../lib/utils';

const SectionHeader = ({ title, subtitle, icon: Icon }: any) => (
  <div className="flex items-center justify-between mb-8">
    <div className="flex items-center gap-4">
      <div className="h-10 w-10 rounded-2xl bg-brand-primary/10 text-brand-primary flex items-center justify-center">
        <Icon className="h-5 w-5" />
      </div>
      <div>
        <h2 className="text-xl font-black text-slate-800 italic uppercase leading-none tracking-tighter">{title}</h2>
        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1.5">{subtitle}</p>
      </div>
    </div>
  </div>
);

export const SoporteSection = () => {
  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <SectionHeader title="Ayuda y Soporte" subtitle="Centro de asistencia digital" icon={LifeBuoy} />
      <div className="grid md:grid-cols-2 gap-8">
         <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm">
            <h3 className="text-sm font-black text-slate-800 uppercase italic mb-6">Preguntas Frecuentes</h3>
            <div className="space-y-4">
               {[
                 '¿Cómo actualizo el censo consolidado?',
                 '¿Cómo reportar un nudo crítico?',
                 'Sincronización con Sistema Patria',
                 'Certificación de Consejos Comunales'
               ].map((q, i) => (
                 <div key={i} className="p-4 rounded-2xl bg-slate-50 border border-slate-100 flex items-center justify-between group cursor-pointer hover:border-brand-primary transition-all">
                    <span className="text-[10px] font-black text-slate-600 uppercase italic">{q}</span>
                    <ChevronRight className="h-4 w-4 text-slate-300 group-hover:text-brand-primary transition-colors" />
                 </div>
               ))}
            </div>
         </div>
         <div className="bg-brand-primary p-8 rounded-[2.5rem] text-white shadow-xl flex flex-col justify-between">
            <div>
              <div className="h-14 w-14 rounded-2xl bg-white/10 flex items-center justify-center mb-6">
                 <Mail className="h-7 w-7" />
              </div>
              <h4 className="text-xl font-black italic uppercase">Soporte Directo</h4>
              <p className="text-[10px] text-white/70 font-bold uppercase tracking-widest mt-2 leading-relaxed">
                 Atención inmediata para problemas técnicos o dudas sobre la normativa de gobierno comunal. Nuestro equipo le responderá en menos de 24 horas.
              </p>
            </div>
            <div className="mt-8 space-y-3">
               <button className="w-full bg-white text-brand-primary py-4 rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] shadow-xl hover:scale-[1.02] transition-all">Contactar con Alcaldía</button>
               <button className="w-full bg-brand-secondary/50 text-white py-4 rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] border border-white/10 hover:bg-brand-secondary transition-all">Reportar Incidencia Técnica</button>
            </div>
         </div>
      </div>

      <div className="bg-slate-800 p-10 rounded-[3rem] text-white relative overflow-hidden">
         <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-8">
            <div className="flex items-center gap-6">
               <div className="h-16 w-16 rounded-[1.5rem] bg-white/10 flex items-center justify-center border border-white/10">
                  <FileText className="h-8 w-8" />
               </div>
               <div>
                  <h4 className="text-lg font-black italic uppercase leading-none">Biblioteca Normativa</h4>
                  <p className="text-[10px] text-slate-400 font-bold uppercase mt-1">Leyes y ordenanzas del Poder Popular</p>
               </div>
            </div>
            <button className="px-8 py-4 rounded-xl bg-white text-slate-800 text-[9px] font-black uppercase tracking-widest hover:bg-brand-primary hover:text-white transition-all">Acceder a Documentos</button>
         </div>
         <Building2 className="absolute top-1/2 right-0 -translate-y-1/2 h-40 w-40 text-white/5 -mr-10" />
      </div>
    </div>
  );
};
