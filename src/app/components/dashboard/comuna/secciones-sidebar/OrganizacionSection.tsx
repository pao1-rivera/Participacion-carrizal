import React, { useState } from 'react';
import { 
  Building2, 
  Map as MapIcon, 
  Users, 
  Briefcase,
  Stethoscope,
  GraduationCap,
  Droplets,
  Fingerprint,
  Scale,
  Landmark,
  Check,
  Search,
  Filter,
  Plus
} from 'lucide-react';
import { motion } from 'framer-motion';
import { cn } from '@/app/lib/utils';

export const OrganizacionSection = ({ user, isCircuito, setIsCircuito }: any) => {
  const [activeTab, setActiveTab] = useState('identificacion');

  const councils = [
    { name: 'C.C. Brisas del Norte', status: 'Vigente', vocero: 'Juan Pérez', families: 120 },
    { name: 'C.C. El Trigo', status: 'Vigente', vocero: 'María García', families: 85 },
    { name: 'C.C. Los Picapiedras', status: 'Vencido', vocero: 'Carlos Ruiz', families: 200 },
  ];

  const committees = [
    { area: 'Economía Productiva', count: 12, icon: Briefcase },
    { area: 'Salud y Prevención', count: 8, icon: Stethoscope },
    { area: 'Educación y Cultura', count: 5, icon: GraduationCap },
    { area: 'Servicios Públicos', count: 15, icon: Droplets },
  ];

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
        <div>
           <h2 className="text-2xl font-black text-slate-800 italic uppercase tracking-tighter leading-none">Territorio y Desarrollo Social</h2>
           <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-2 italic shadow-sm bg-white inline-block px-3 py-1 rounded-full border border-slate-50">Configuración Estructural de la Comuna</p>
        </div>

        <div className="flex items-center gap-4 bg-white p-2 rounded-2xl border border-slate-100 shadow-sm">
          <button 
            onClick={() => setIsCircuito(true)}
            className={cn(
              "px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all",
              isCircuito ? "bg-brand-primary text-white shadow-lg shadow-brand-primary/20" : "text-slate-400 hover:text-slate-600"
            )}
          >
            Circuito
          </button>
          <button 
            onClick={() => setIsCircuito(false)}
            className={cn(
              "px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all",
              !isCircuito ? "bg-brand-primary text-white shadow-lg shadow-brand-primary/20" : "text-slate-400 hover:text-slate-600"
            )}
          >
            Comuna
          </button>
        </div>
      </div>

      <div className="flex gap-2 border-b border-slate-100 pb-px overflow-x-auto no-scrollbar">
        {['identificacion', 'consejos', 'comites'].map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={cn(
              "px-8 py-4 text-[10px] font-black uppercase tracking-widest transition-all relative border-b-2",
              activeTab === tab ? "border-brand-primary text-brand-primary" : "border-transparent text-slate-400 hover:text-slate-600"
            )}
          >
            {tab.replace('-', ' ')}
            {activeTab === tab && (
              <motion.div layoutId="activeTerritoryTab" className="absolute bottom-0 left-0 right-0 h-0.5 bg-brand-primary" />
            )}
          </button>
        ))}
      </div>

      <div className="mt-8">
        {activeTab === 'identificacion' && (
          <div className="grid lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 space-y-8">
              <div className="bg-white p-10 rounded-[3rem] border border-slate-100 shadow-xl shadow-slate-200/20">
                <div className="flex items-center gap-4 mb-10">
                   <div className="h-14 w-14 bg-brand-primary/10 text-brand-primary rounded-2xl flex items-center justify-center">
                      <Fingerprint className="h-7 w-7" />
                   </div>
                   <div>
                      <h3 className="text-xl font-black text-slate-800 uppercase italic">Expediente de Identificación</h3>
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Datos legales y administrativos</p>
                   </div>
                </div>

                <div className="grid md:grid-cols-2 gap-x-12 gap-y-8">
                  <div className="space-y-1.5">
                    <label className="text-[9px] font-black text-slate-400 uppercase tracking-[0.15em]">Nombre de la Organización</label>
                    <p className="text-sm font-black text-slate-700 uppercase italic border-b border-slate-50 pb-2">Comuna {user.comunaName || 'Brisas del Oriente'}</p>
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[9px] font-black text-slate-400 uppercase tracking-[0.15em]">Código SITUR / Registro</label>
                    <p className="text-sm font-black text-slate-700 uppercase italic border-b border-slate-50 pb-2">COM-2024-001</p>
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[9px] font-black text-slate-400 uppercase tracking-[0.15em]">Registro de Información Fiscal (RIF)</label>
                    <p className="text-sm font-black text-slate-700 uppercase italic border-b border-slate-50 pb-2">J-40345678-0</p>
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[9px] font-black text-slate-400 uppercase tracking-[0.15em]">Fecha de Constitución</label>
                    <p className="text-sm font-black text-slate-700 uppercase italic border-b border-slate-50 pb-2">15 DE MARZO 2024</p>
                  </div>
                </div>
              </div>

              <div className="bg-white p-10 rounded-[3rem] border border-slate-100 shadow-xl shadow-slate-200/20 relative overflow-hidden group">
                 <div className="absolute top-0 right-0 p-10 opacity-5 group-hover:scale-110 transition-transform">
                    <MapIcon className="h-40 w-40" />
                 </div>
                 <div className="relative z-10">
                    <h3 className="text-sm font-black text-slate-800 uppercase italic mb-8">Poligonal y Delimitación</h3>
                    <div className="h-64 bg-slate-50 rounded-[2rem] border-2 border-dashed border-slate-100 flex items-center justify-center">
                       <div className="text-center">
                          <MapIcon className="h-10 w-10 text-slate-200 mx-auto mb-4" />
                          <p className="text-[10px] font-black text-slate-400 uppercase italic">Cartografía en Proceso</p>
                          <button className="mt-4 px-6 py-2 rounded-xl border border-slate-200 text-[8px] font-black uppercase tracking-widest hover:bg-brand-primary hover:text-white transition-all">Digitalizar Mapas</button>
                       </div>
                    </div>
                 </div>
              </div>
            </div>

            <div className="space-y-8">
              <div className={cn(
                "p-8 rounded-[3rem] text-white shadow-2xl relative overflow-hidden",
                isCircuito ? "bg-slate-800" : "bg-emerald-600"
              )}>
                <div className="relative z-10">
                   <p className="text-[9px] font-black text-white/60 uppercase tracking-widest mb-4">Estatus Actual</p>
                   <h4 className="text-3xl font-black italic uppercase tracking-tighter leading-tight">
                     {isCircuito ? 'Circuito Comunal' : 'Comuna Constituida'}
                   </h4>
                   <p className="text-[10px] text-white/50 font-bold uppercase mt-4 italic leading-relaxed">
                     {isCircuito 
                       ? 'Fase de transición. Las instancias de Banco y Parlamento están en modo consulta.' 
                       : 'Organización legalmente registrada. Todas las funciones de gobierno están habilitadas.'
                     }
                   </p>
                   <div className="mt-8 flex items-center gap-3">
                      <div className={cn("h-3 w-3 rounded-full animate-pulse", isCircuito ? "bg-amber-400" : "bg-emerald-400")} />
                      <span className="text-[9px] font-black uppercase">Operatividad: {isCircuito ? '80%' : '100%'}</span>
                   </div>
                </div>
                <div className="absolute top-0 right-0 p-10 opacity-10">
                   <Building2 className="h-32 w-32" />
                </div>
              </div>

              <div className="bg-white p-8 rounded-[3rem] border border-slate-100 shadow-sm">
                <h3 className="text-xs font-black text-slate-800 uppercase italic mb-6">Instancias de Gobierno</h3>
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-4 rounded-2xl bg-slate-50 border border-slate-100">
                    <div className="flex items-center gap-3">
                      <Scale className="h-4 w-4 text-brand-primary" />
                      <span className="text-[10px] font-black uppercase">Parlamento</span>
                    </div>
                    {isCircuito ? (
                      <span className="text-[8px] font-black text-amber-500 uppercase px-2 py-0.5 rounded bg-amber-50 border border-amber-100">Cerrado</span>
                    ) : (
                      <Check className="h-4 w-4 text-emerald-500" />
                    )}
                  </div>
                  <div className="flex items-center justify-between p-4 rounded-2xl bg-slate-50 border border-slate-100">
                    <div className="flex items-center gap-3">
                      <Landmark className="h-4 w-4 text-brand-primary" />
                      <span className="text-[10px] font-black uppercase">Banco Comunal</span>
                    </div>
                    {isCircuito ? (
                      <span className="text-[8px] font-black text-amber-500 uppercase px-2 py-0.5 rounded bg-amber-50 border border-amber-100">Cerrado</span>
                    ) : (
                      <Check className="h-4 w-4 text-emerald-500" />
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'consejos' && (
          <div className="space-y-8">
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="bg-white p-8 rounded-3xl border border-slate-100 shadow-sm">
                 <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Total CC</p>
                 <h4 className="text-3xl font-black text-slate-800 italic mt-1 leading-none">12</h4>
              </div>
              <div className="bg-white p-8 rounded-3xl border border-slate-100 shadow-sm">
                 <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Vigentes</p>
                 <h4 className="text-3xl font-black text-emerald-500 italic mt-1 leading-none">8</h4>
              </div>
              <div className="bg-white p-8 rounded-3xl border border-slate-100 shadow-sm">
                 <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Vencidos</p>
                 <h4 className="text-3xl font-black text-rose-500 italic mt-1 leading-none">4</h4>
              </div>
              <div className="bg-brand-primary p-8 rounded-3xl text-white shadow-xl flex items-center justify-center">
                 <button className="text-[10px] font-black uppercase tracking-widest hover:scale-105 transition-all">Sincronizar SITUR</button>
              </div>
            </div>

            <div className="bg-white rounded-[3rem] border border-slate-100 overflow-hidden shadow-xl shadow-slate-200/10">
              <div className="px-10 py-6 border-b border-slate-50 bg-slate-50/30 flex items-center justify-between">
                <h3 className="text-sm font-black text-slate-800 uppercase italic">Directorio de Consejos Comunales</h3>
                <div className="flex items-center gap-4 text-slate-400">
                  <Search className="h-4 w-4" />
                  <Filter className="h-4 w-4" />
                </div>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead>
                    <tr className="border-b border-slate-50">
                      <th className="px-10 py-5 text-[9px] font-black text-slate-400 uppercase italic tracking-[0.15em]">Consejo Comunal</th>
                      <th className="px-10 py-5 text-[9px] font-black text-slate-400 uppercase italic tracking-[0.15em]">Vocería Responsable</th>
                      <th className="px-10 py-5 text-[9px] font-black text-slate-400 uppercase italic tracking-[0.15em]">Estatus</th>
                      <th className="px-10 py-5 text-[9px] font-black text-slate-400 uppercase italic tracking-[0.15em]">Familias</th>
                      <th className="px-10 py-5 text-[9px] font-black text-slate-400 uppercase italic tracking-[0.15em] text-right">Ficha</th>
                    </tr>
                  </thead>
                  <tbody>
                    {councils.map((cc, i) => (
                      <tr key={i} className="border-b border-slate-50 last:border-0 hover:bg-slate-50/50 transition-colors group">
                        <td className="px-10 py-6">
                           <span className="text-xs font-black text-slate-800 uppercase italic leading-none group-hover:text-brand-primary transition-colors">{cc.name}</span>
                        </td>
                        <td className="px-10 py-6">
                           <span className="text-[10px] font-bold text-slate-500 uppercase">{cc.vocero}</span>
                        </td>
                        <td className="px-10 py-6">
                           <div className={cn(
                             "inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[8px] font-black uppercase tracking-tight ring-1 ring-inset",
                             cc.status === 'Vigente' ? "bg-emerald-50 text-emerald-600 ring-emerald-100" : "bg-rose-50 text-rose-600 ring-rose-100"
                           )}>
                              <div className={cn("h-1 w-1 rounded-full", cc.status === 'Vigente' ? "bg-emerald-500" : "bg-rose-500")} />
                              {cc.status}
                           </div>
                        </td>
                        <td className="px-10 py-6">
                           <span className="text-xs font-black text-slate-800">{cc.families}</span>
                        </td>
                        <td className="px-10 py-6 text-right">
                           <button className="text-[10px] font-black text-brand-primary uppercase underline italic">Ver Detalle</button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'comites' && (
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {committees.map((comite, index) => (
              <div key={index} className="bg-white p-10 rounded-[3rem] border border-slate-100 shadow-xl shadow-slate-200/10 group hover:-translate-y-2 transition-all">
                <div className="h-16 w-16 bg-brand-primary/5 text-brand-primary rounded-[1.5rem] flex items-center justify-center mb-8 group-hover:bg-brand-primary group-hover:text-white transition-all shadow-sm">
                   <comite.icon className="h-8 w-8" />
                </div>
                <h4 className="text-[11px] font-black text-slate-800 uppercase italic tracking-widest leading-tight mb-2">{comite.area}</h4>
                <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">{comite.count} Vocerías integradas</p>
                <div className="mt-8 pt-6 border-t border-slate-50 flex items-center justify-between">
                   <button className="text-[8px] font-black text-brand-primary uppercase italic underline">Ver Miembros</button>
                   <div className="flex -space-x-2">
                      {[1, 2, 3].map(i => (
                        <div key={i} className="h-6 w-6 rounded-full border-2 border-white bg-slate-200" />
                      ))}
                   </div>
                </div>
              </div>
            ))}
            <div className="bg-slate-50 p-10 rounded-[3rem] border-2 border-dashed border-slate-200 flex flex-col items-center justify-center text-center group hover:border-brand-primary transition-all cursor-pointer">
               <Plus className="h-10 w-10 text-slate-300 group-hover:text-brand-primary mb-4" />
               <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest italic group-hover:text-brand-primary">Nuevo Comité</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
