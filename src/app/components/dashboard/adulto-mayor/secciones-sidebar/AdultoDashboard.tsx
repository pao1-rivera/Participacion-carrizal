'use client';

import React from 'react';
import { 
  Zap, 
  Monitor, 
  Map as MapIcon, 
  ShieldCheck, 
  AlertCircle, 
  CheckCircle2, 
  Clock,
  TrendingUp,
  Activity,
  Globe,
  Users
} from 'lucide-react';
import { motion } from 'framer-motion';
import { cn } from '@/app/lib/utils';

export const AdultoDashboard = () => {
  return (
    <div className="space-y-6 animate-in fade-in duration-700">
      {/* KPIs Principales */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard 
          title="Alfabetización Digital" 
          value="72%" 
          sub="Capacidad técnica instalada" 
          icon={Zap} 
          color="text-yellow-600" 
          bg="bg-yellow-50"
          progress={72}
        />
        <StatCard 
          title="Disponibilidad S.A.G." 
          value="85%" 
          sub="Salas ONLINE ahora mismo" 
          icon={Monitor} 
          color="text-green-600" 
          bg="bg-green-50"
          progress={85}
        />
        <StatCard 
          title="Cartografía Cargada" 
          value="64%" 
          sub="Hectáreas/Comunidades 100%" 
          icon={MapIcon} 
          color="text-blue-600" 
          bg="bg-blue-50"
          progress={64}
        />
        <StatCard 
          title="Trámites SITUR" 
          value="128" 
          sub="Total de expedientes activos" 
          icon={ShieldCheck} 
          color="text-indigo-600" 
          bg="bg-indigo-50"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Semáforo SITUR */}
        <div className="lg:col-span-2 bg-white rounded-3xl border border-slate-100 shadow-sm p-6 overflow-hidden">
          <div className="flex items-center justify-between mb-6">
             <div>
                <h3 className="text-sm font-black text-slate-900 uppercase tracking-tight italic">Semáforo SITUR - Estatus Legal</h3>
                <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mt-1">Monitoreo de vigencia RIF y cuentas bancarias</p>
             </div>
             <ShieldCheck className="text-slate-300" size={24} />
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <StatusBox 
              color="red" 
              label="Acción Crítica" 
              count={12} 
              desc="RIF vencido / Sin cuenta bancaria"
              items={["C.C. El Trigo", "C.C. Los Panas", "C.C. Esperanza"]}
            />
            <StatusBox 
              color="yellow" 
              label="En Trámite" 
              count={24} 
              desc="Próximo a vencer / En renovación"
              items={["C.C. Bolívar", "C.C. San José", "C.C. 19 de Abril"]}
            />
            <StatusBox 
              color="green" 
              label="Aptos para Proyectos" 
              count={85} 
              desc="Documentación al día"
              items={["C.C. Carrizal", "C.C. Montaña Alta", "C.C. Gran Mariscal"]}
            />
          </div>
        </div>

        {/* Velocímetro de Alfabetización (Detalle) */}
        <div className="bg-white rounded-3xl border border-slate-100 shadow-sm p-6 flex flex-col items-center justify-center text-center">
           <h3 className="text-xs font-black text-slate-900 uppercase tracking-tight mb-6 italic">Velocímetro de Alfabetización</h3>
           
           <div className="relative w-48 h-24 overflow-hidden">
              <div className="absolute inset-0 w-48 h-48 border-16 border-slate-100 rounded-full" />
              <motion.div 
                initial={{ rotate: -90 }}
                animate={{ rotate: 45 }}
                transition={{ duration: 1.5, ease: "easeOut" }}
                className="absolute inset-0 w-48 h-48 border-16 border-brand-primary rounded-full"
                style={{ clipPath: 'inset(0 0 50% 0)' }}
              />
              <div className="absolute bottom-0 left-1/2 -translate-x-1/2 flex flex-col items-center">
                 <span className="text-3xl font-black text-slate-900 leading-none">75%</span>
                 <span className="text-[10px] font-bold text-slate-400 uppercase mt-1">Óptimo</span>
              </div>
           </div>
           
           <div className="mt-8 grid grid-cols-2 gap-4 w-full">
              <div className="p-3 bg-slate-50 rounded-2xl">
                 <p className="text-[8px] font-bold text-slate-400 uppercase">Mínimo</p>
                 <p className="text-xs font-black text-slate-700">0%</p>
              </div>
              <div className="p-3 bg-slate-50 rounded-2xl">
                 <p className="text-[8px] font-bold text-slate-400 uppercase">Meta</p>
                 <p className="text-xs font-black text-slate-700">100%</p>
              </div>
           </div>
        </div>
      </div>
    </div>
  );
};

const StatCard = ({ title, value, sub, icon: Icon, color, bg, progress }: any) => (
  <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm group hover:border-brand-primary/20 transition-all">
    <div className="flex items-center justify-between mb-4">
      <div className={cn("w-12 h-12 rounded-2xl flex items-center justify-center shrink-0", bg)}>
        <Icon className={cn("w-6 h-6", color)} />
      </div>
{progress !== undefined && (
        <div className="text-right">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Trend</span>
          <div className="flex items-center gap-1 text-green-600">
            <TrendingUp size={12} />
            <span className="text-xs font-black">+4.2%</span>
          </div>
        </div>
      )}
    </div>
    <div>
      <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{title}</h3>
      <p className="text-2xl font-black text-slate-900 tracking-tighter mt-1">{value}</p>
      <p className="text-[10px] text-slate-500 font-medium">{sub}</p>
    </div>
    {progress !== undefined && (
      <div className="mt-4 h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
        <motion.div 
          initial={{ width: 0 }}
          animate={{ width: `${progress}%` }}
          transition={{ duration: 1, delay: 0.5 }}
          className={cn("h-full", color.replace('text', 'bg'))}
        />
      </div>
    )}
  </div>
);

const StatusBox = ({ color, label, count, desc, items }: { color: 'red' | 'yellow' | 'green', label: string, count: number, desc: string, items: string[] }) => {
  const configs = {
    red: { bg: 'bg-red-50', border: 'border-red-100', text: 'text-red-700', icon: AlertCircle, dot: 'bg-red-500' },
    yellow: { bg: 'bg-yellow-50', border: 'border-yellow-100', text: 'text-yellow-700', icon: Clock, dot: 'bg-yellow-500' },
    green: { bg: 'bg-green-50', border: 'border-green-100', text: 'text-green-700', icon: CheckCircle2, dot: 'bg-green-500' },
  }[color];

  return (
    <div className={cn("p-4 rounded-2xl border transition-all hover:shadow-md", configs.bg, configs.border)}>
      <div className="flex items-center justify-between mb-3">
        <div className={cn("w-8 h-8 rounded-lg flex items-center justify-center", configs.text.replace('text', 'bg').replace('700', '100'))}>
          <configs.icon size={18} />
        </div>
        <span className={cn("text-xl font-black", configs.text)}>{count}</span>
      </div>
      <h4 className={cn("text-[10px] font-black uppercase tracking-wider", configs.text)}>{label}</h4>
      <p className="text-[9px] text-slate-500 font-medium leading-tight mt-1">{desc}</p>
      
      <div className="mt-4 pt-4 border-t border-white/50 space-y-1.5">
        {items.map((item, i) => (
          <div key={i} className="flex items-center gap-2">
            <div className={cn("w-1 h-1 rounded-full", configs.dot)} />
            <span className="text-[9px] font-bold text-slate-600 truncate">{item}</span>
          </div>
        ))}
      </div>
    </div>
  );
};
