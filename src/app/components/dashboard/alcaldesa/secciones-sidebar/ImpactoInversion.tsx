'use client';

import React from 'react';
import { 
  TrendingUp, 
  BarChart3, 
  Target, 
  Users, 
  Zap, 
  ShieldCheck, 
  Globe,
  PieChart,
  ArrowUpRight,
  TrendingDown,
  Download
} from 'lucide-react';
import { motion } from 'framer-motion';
import { cn } from '@/app/lib/utils';
import { 
  ResponsiveContainer, 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  PieChart as RePieChart, 
  Pie, 
  Cell,
  BarChart,
  Bar
} from 'recharts';

export const ImpactoInversion = () => {
  const areaData = [
    { name: 'Ene', inversion: 400, impacto: 240 },
    { name: 'Feb', inversion: 300, impacto: 139 },
    { name: 'Mar', inversion: 200, impacto: 980 },
    { name: 'Abr', inversion: 278, impacto: 390 },
    { name: 'May', inversion: 189, impacto: 480 },
    { name: 'Jun', inversion: 239, impacto: 380 },
    { name: 'Jul', inversion: 349, impacto: 430 },
  ];

  const pieData = [
    { name: 'Servicios', value: 45, color: '#042D5F' },
    { name: 'Salud', value: 25, color: '#FF3B30' },
    { name: 'Educación', value: 20, color: '#FFD60A' },
    { name: 'Seguridad', value: 10, color: '#32D74B' },
  ];

  const barData = [
    { name: 'Circuito 1', value: 85 },
    { name: 'Circuito 2', value: 62 },
    { name: 'Circuito 3', value: 94 },
    { name: 'Circuito 4', value: 45 },
    { name: 'Circuito 5', value: 78 },
  ];

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="space-y-10 pb-12"
    >
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-black text-slate-900 uppercase tracking-tighter italic">Impacto de Inversión</h2>
          <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mt-1">Análisis de Retorno Social y Eficiencia Presupuestaria</p>
        </div>
        <div className="flex gap-3">
           <button className="flex items-center gap-2 px-6 py-2.5 bg-brand-primary text-white rounded-xl text-[10px] font-black uppercase tracking-widest shadow-xl shadow-brand-primary/20 hover:scale-105 transition-all">
              <Download size={16} /> Exportar Auditoría 360
           </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
         <MetricCard label="Inversión Proyectada" value="$4.2M" sub="POA 2026 Vigente" trend="+14%" icon={TrendingUp} color="text-brand-primary" bg="bg-brand-primary/5" />
         <MetricCard label="Eficiencia del Gasto" value="94.2%" sub="Auditado por Contraloría" trend="+2.5%" icon={Target} color="text-emerald-500" bg="bg-emerald-50" />
         <MetricCard label="Ahorro por Autogobierno" value="$128k" sub="Gestión Directa Comunal" trend="+18%" icon={Zap} color="text-amber-500" bg="bg-amber-50" />
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-10">
         {/* Inversion vs Impacto Area Chart */}
         <div className="bg-white rounded-[4rem] border border-slate-100 shadow-xl p-10 space-y-10">
            <div className="flex justify-between items-center">
               <h3 className="text-lg font-black text-slate-900 italic uppercase leading-none">Crecimiento Inversión vs Impacto</h3>
               <div className="flex gap-4">
                  <div className="flex items-center gap-2">
                     <div className="w-3 h-3 rounded-full bg-brand-primary" />
                     <span className="text-[10px] font-black text-slate-400 uppercase">Inversión</span>
                  </div>
                  <div className="flex items-center gap-2">
                     <div className="w-3 h-3 rounded-full bg-cyan-400" />
                     <span className="text-[10px] font-black text-slate-400 uppercase">Impacto</span>
                  </div>
               </div>
            </div>
            
            <div className="h-72 w-full">
               <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={areaData}>
                     <defs>
                        <linearGradient id="colorInv" x1="0" y1="0" x2="0" y2="1">
                           <stop offset="5%" stopColor="#042D5F" stopOpacity={0.1}/>
                           <stop offset="95%" stopColor="#042D5F" stopOpacity={0}/>
                        </linearGradient>
                        <linearGradient id="colorImp" x1="0" y1="0" x2="0" y2="1">
                           <stop offset="5%" stopColor="#22D3EE" stopOpacity={0.1}/>
                           <stop offset="95%" stopColor="#22D3EE" stopOpacity={0}/>
                        </linearGradient>
                     </defs>
                     <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#94A3B8', fontWeight: 'bold' }} />
                     <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#94A3B8', fontWeight: 'bold' }} />
                     <Tooltip 
                        contentStyle={{ borderRadius: '24px', border: 'none', boxShadow: '0 25px 50px -12px rgb(0 0 0 / 0.1)' }}
                        itemStyle={{ fontSize: '10px', fontWeight: 'black', textTransform: 'uppercase' }}
                     />
                     <Area type="monotone" dataKey="inversion" stroke="#042D5F" strokeWidth={4} fillOpacity={1} fill="url(#colorInv)" />
                     <Area type="monotone" dataKey="impacto" stroke="#22D3EE" strokeWidth={4} fillOpacity={1} fill="url(#colorImp)" />
                  </AreaChart>
               </ResponsiveContainer>
            </div>
         </div>

         {/* Distribution & Bar Chart */}
         <div className="bg-[#030712] rounded-[4rem] border border-white/5 shadow-2xl p-10 flex flex-col justify-between">
            <div className="flex items-center justify-between mb-8">
               <h3 className="text-lg font-black italic uppercase tracking-tighter text-brand-primary">Distribución Presupuestaria 7T</h3>
               <PieChart className="text-white/20" size={24} />
            </div>
            
            <div className="flex flex-col md:flex-row items-center gap-10">
               <div className="w-full md:w-1/2 h-64">
                  <ResponsiveContainer width="100%" height="100%">
                     <RePieChart>
                        <Pie
                           data={pieData}
                           innerRadius={60}
                           outerRadius={100}
                           paddingAngle={8}
                           dataKey="value"
                        >
                           {pieData.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={entry.color} stroke="none" />
                           ))}
                        </Pie>
                        <Tooltip 
                           contentStyle={{ borderRadius: '16px', border: 'none', background: '#1F2937' }}
                           itemStyle={{ color: '#fff' }}
                        />
                     </RePieChart>
                  </ResponsiveContainer>
               </div>
               
               <div className="w-full md:w-1/2 space-y-4">
                  {pieData.map((item, i) => (
                    <div key={i} className="flex items-center justify-between p-4 bg-white/5 border border-white/5 rounded-2xl hover:bg-white/10 transition-all cursor-default group">
                       <div className="flex items-center gap-3">
                          <div className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color }} />
                          <span className="text-[10px] font-black uppercase tracking-tight text-white/70 group-hover:text-white">{item.name}</span>
                       </div>
                       <span className="text-xs font-black italic text-brand-primary">{item.value}%</span>
                    </div>
                  ))}
               </div>
            </div>

            <div className="mt-10 p-6 bg-brand-primary/10 border border-brand-primary/10 rounded-3xl">
               <p className="text-[10px] font-bold text-slate-400 italic">Inferencia IA: La inversión en Servicios Públicos ha mitigado el 42% de los nudos críticos en el primer semestre.</p>
            </div>
         </div>
      </div>

      {/* Circuito Efficiency Bar Chart */}
      <div className="bg-white rounded-[4rem] border border-slate-100 shadow-xl p-10 flex flex-col space-y-10">
         <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="space-y-1">
               <h3 className="text-xl font-black text-slate-900 italic uppercase">Índice de Rendimiento por Circuito</h3>
               <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Ejecución Física del 1:10 vs Certificación Técnica</p>
            </div>
            <div className="flex gap-4">
               <div className="px-6 py-3 bg-slate-50 border border-slate-100 rounded-2xl">
                  <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1">Mayor Rendimiento</p>
                  <p className="text-lg font-black text-emerald-500 italic uppercase leading-none">Circuito 3</p>
               </div>
            </div>
         </div>

         <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
               <BarChart data={barData}>
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#94A3B8', fontWeight: 'bold' }} />
                  <YAxis hide />
                  <Tooltip 
                     contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                     cursor={{ fill: '#F8FAFC' }}
                  />
                  <Bar dataKey="value" radius={[12, 12, 12, 12]} barSize={40}>
                     {barData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.value > 80 ? '#042D5F' : '#E2E8F0'} />
                     ))}
                  </Bar>
               </BarChart>
            </ResponsiveContainer>
         </div>
      </div>
    </motion.div>
  );
};

const MetricCard = ({ label, value, sub, trend, icon: Icon, color, bg }: any) => (
  <div className="bg-white p-10 rounded-[3rem] border border-slate-100 shadow-xl shadow-slate-200/30 group transition-all hover:shadow-2xl hover:-translate-y-1 overflow-hidden relative">
     <div className="relative z-10">
        <div className={cn("w-14 h-14 rounded-2xl flex items-center justify-center mb-10 shadow-lg group-hover:scale-110 transition-transform duration-500", bg, color)}>
           <Icon size={28} strokeWidth={1.5} />
        </div>
        <h3 className="text-[11px] font-black text-slate-400 uppercase tracking-[0.3em] leading-none mb-4">{label}</h3>
        <div className="flex items-end gap-3 mb-4">
           <p className="text-4xl font-black text-slate-900 tracking-tighter leading-none">{value}</p>
           <span className="text-[10px] font-black text-emerald-500 flex items-center gap-1 mb-1">
             <ArrowUpRight size={14} /> {trend}
           </span>
        </div>
        <p className="text-[10px] text-slate-500 font-bold uppercase tracking-tight italic opacity-60 underline underline-offset-4 decoration-slate-100">{sub}</p>
     </div>
     <div className="absolute -bottom-10 -right-10 w-32 h-32 bg-slate-50 rounded-full blur-2xl group-hover:bg-brand-primary/5 transition-colors" />
  </div>
);