import React from 'react';
import { 
  Fingerprint, 
  FileText, 
  Landmark, 
  Building2,
  ChevronRight
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

export const AutogobiernoSection = ({ subview, isCircuito, setIsCircuito }: any) => {
  if (subview === 'parlamento') {
    return (
      <div className="space-y-8 animate-in fade-in duration-500">
        <SectionHeader title="Parlamento Comunal" subtitle="Sistema de toma de decisiones" icon={Fingerprint} />
        <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm">
           <div className="flex items-center justify-between mb-8">
              <h3 className="text-sm font-black text-slate-800 uppercase italic">Sesiones Recientes</h3>
              <button className="flex items-center gap-2 px-4 py-2 rounded-xl bg-brand-primary text-white text-[10px] font-black uppercase tracking-widest">Nueva Sesión</button>
           </div>
           <div className="space-y-4">
              {[1, 2, 3].map(i => (
                <div key={i} className="p-4 rounded-2xl bg-slate-50 border border-slate-100 flex items-center justify-between">
                   <div className="flex items-center gap-4">
                      <div className="h-10 w-10 rounded-xl bg-white border border-slate-100 flex items-center justify-center text-slate-400">
                         <FileText className="h-5 w-5" />
                      </div>
                      <div>
                         <p className="text-[10px] font-black text-slate-800 uppercase italic">Acta de Sesión Ordinaria #0{i+12}</p>
                         <p className="text-[8px] font-bold text-slate-400 uppercase">12 May 2024 • Aprobado por Quórum</p>
                      </div>
                   </div>
                   <button className="text-[9px] font-black text-brand-primary uppercase underline">Descargar</button>
                </div>
              ))}
           </div>
        </div>
      </div>
    );
  }

  if (subview === 'banco') {
    return (
      <div className="space-y-8 animate-in fade-in duration-500">
        <SectionHeader title="Banco de la Comuna" subtitle="Gestión de recursos y UPF" icon={Landmark} />
        <div className="grid md:grid-cols-3 gap-6">
           <div className="bg-brand-secondary p-8 rounded-[2.5rem] text-white shadow-xl col-span-2">
              <p className="text-[10px] font-black text-cyan-200 uppercase tracking-widest mb-2">Fondo Comunal Consolidado</p>
              <h4 className="text-4xl font-black italic tracking-tighter">$45,200.00</h4>
              <div className="mt-8 flex gap-4">
                 <button className="bg-brand-primary px-6 py-2 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all hover:scale-105">Tarjeta de Operaciones</button>
                 <button className="bg-white/10 px-6 py-2 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all hover:bg-white/20 border border-white/10">Estado de Cuenta</button>
              </div>
           </div>
           <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm flex flex-col justify-between">
              <div>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">UPF Registradas</p>
                <h4 className="text-2xl font-black text-slate-800 italic">14 Unidades</h4>
              </div>
              <button className="w-full py-3 rounded-xl border border-slate-100 text-[9px] font-black uppercase text-slate-600 hover:bg-slate-50 transition-all">Gestionar UPF</button>
           </div>
        </div>
      </div>
    );
  }

  if (subview === 'circuitos') {
    return (
      <div className="space-y-8 animate-in fade-in duration-500">
        <SectionHeader title="Circuitos Comunales" subtitle="Nuevas formas de agregación" icon={Building2} />
        <div className="bg-white p-10 rounded-[3rem] border border-slate-100 shadow-sm text-center space-y-6">
           <div className="h-20 w-20 rounded-full bg-brand-primary/10 text-brand-primary flex items-center justify-center mx-auto">
              <Building2 className="h-10 w-10" />
           </div>
           <div className="max-w-md mx-auto space-y-4">
              <h3 className="text-xl font-black text-slate-800 uppercase italic">Estatus de Circuito Comunal</h3>
              <p className="text-xs text-slate-400 font-bold uppercase tracking-widest leading-relaxed">
                 Actualmente su organización está configurada como {isCircuito ? 'CIRCUITO COMUNAL' : 'COMUNA TRADICIONAL'}. Esto afecta las instancias de gobierno disponibles.
              </p>
              <button 
                onClick={() => setIsCircuito(!isCircuito)}
                className="mt-6 px-10 py-4 rounded-2xl bg-slate-800 text-white text-[10px] font-black uppercase tracking-widest hover:bg-brand-primary transition-all"
              >
                Cambiar a {isCircuito ? 'Comuna' : 'Circuito'}
              </button>
           </div>
        </div>
      </div>
    );
  }

  return (
    <div className="py-20 text-center">
      <SectionHeader title="Autogobierno" subtitle="Instancias de Poder Popular" icon={Fingerprint} />
      <p className="text-slate-400 text-xs font-bold uppercase tracking-widest">Seleccione una instancia del sidebar</p>
    </div>
  );
};
