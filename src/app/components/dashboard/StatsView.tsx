import React from 'react';
import { motion } from 'framer-motion';
import { 
  TrendingUp, 
  Users, 
  Building2, 
  Target, 
  Map as MapIcon, 
  ShieldCheck,
  Zap,
  Heart,
  Briefcase,
  Layers,
  GraduationCap
} from 'lucide-react';
import { cn } from '../../lib/utils';

const MetricCard = ({ label, value, trend, icon: Icon, color }: any) => (
  <div className="bg-white rounded-3xl border border-gray-100 p-8 shadow-sm group">
    <div className="flex items-center justify-between">
      <div className={cn("h-12 w-12 rounded-2xl flex items-center justify-center", color)}>
        <Icon className="h-6 w-6" />
      </div>
      <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 text-[10px] font-bold border border-emerald-100">
        <TrendingUp className="h-3 w-3" /> {trend}%
      </div>
    </div>
    <div className="mt-6">
      <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">{label}</p>
      <h4 className="text-3xl font-black text-slate-900 mt-2 tracking-tighter">{value}</h4>
    </div>
  </div>
);

export const StatsView = () => {
  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-2">
        <h2 className="text-2xl font-bold text-slate-900">Estadísticas de Participación </h2>
        <p className="text-slate-500 text-sm">Monitoreo estratégico del Poder Popular y cumplimiento de las 7T.</p>
      </div>

      {/* Main Metrics */}
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
        <MetricCard label="Censo Total" value="24.5k" trend={4.2} icon={Users} color="bg-blue-50 text-blue-600" />
        <MetricCard label="CC Validados" value="124" trend={12} icon={ShieldCheck} color="bg-emerald-50 text-emerald-600" />
        <MetricCard label="Organización" value="84%" trend={3.1} icon={Target} color="bg-brand-primary/10 text-brand-primary" />
        <MetricCard label="Zonas Activas" value="92%" trend={0.5} icon={MapIcon} color="bg-purple-50 text-purple-600" />
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Radar of 7T (Visual Mock) */}
        <div className="lg:col-span-2 bg-white rounded-[2.5rem] border border-gray-100 p-10 shadow-sm">
           <div className="flex items-center justify-between mb-10">
              <div>
                <h3 className="text-lg font-bold text-slate-900 italic tracking-tight">Avance Nacional (7T)</h3>
                <p className="text-[11px] font-bold text-gray-400 uppercase tracking-widest mt-1">Impacto de proyectos en las transformaciones</p>
              </div>
              <TrendingUp className="h-5 w-5 text-brand-primary" />
           </div>

           <div className="space-y-6">
              {[
                { label: 'T1: Económica', val: 65, color: 'bg-amber-500' },
                { label: 'T2: Independencia Plena', val: 80, color: 'bg-emerald-500' },
                { label: 'T3: Paz y Seguridad', val: 45, color: 'bg-blue-500' },
                { label: 'T4: Social', val: 92, color: 'bg-brand-primary' },
                { label: 'T5: Política', val: 75, color: 'bg-purple-500' },
                { label: 'T6: Ecológica', val: 30, color: 'bg-cyan-500' },
                { label: 'T7: Inserción Líder', val: 55, color: 'bg-rose-500' },
              ].map((t, i) => (
                <div key={i} className="space-y-2 group">
                   <div className="flex justify-between items-end">
                      <span className="text-[11px] font-bold text-slate-700 tracking-tight">{t.label}</span>
                      <span className="text-[10px] font-black text-slate-400">{t.val}%</span>
                   </div>
                   <div className="h-2 w-full bg-gray-50 rounded-full overflow-hidden border border-gray-100">
                      <motion.div 
                        initial={{ width: 0 }}
                        animate={{ width: `${t.val}%` }}
                        transition={{ duration: 1, delay: i * 0.1 }}
                        className={cn("h-full rounded-full shadow-sm", t.color)}
                      />
                   </div>
                </div>
              ))}
           </div>
        </div>

        {/* Sidebar stats breakdown */}
        <div className="space-y-6">
           <div className="bg-brand-secondary rounded-[2.5rem] p-8 text-white relative overflow-hidden">
              <h3 className="text-lg font-bold mb-6">Eficiencia Territorial</h3>
              <div className="space-y-6">
                 {[
                   { label: 'Tiempo de Respuesta', val: '2.4 días', icon: Zap },
                   { label: 'Puntos Críticos Resueltos', val: '840', icon: CheckCircle2 },
                   { label: 'Presupuesto Ejecutado', val: '72%', icon: Briefcase },
                 ].map((s, i) => (
                    <div key={i} className="flex items-center gap-4">
                       <div className="h-10 w-10 rounded-xl bg-white/10 flex items-center justify-center border border-white/10">
                          <s.icon className="h-5 w-5 text-cyan-300" />
                       </div>
                       <div>
                          <p className="text-[10px] font-bold text-cyan-200 uppercase tracking-widest opacity-60">{s.label}</p>
                          <p className="text-sm font-bold text-white mt-1">{s.val}</p>
                       </div>
                    </div>
                 ))}
              </div>
              <div className="absolute top-0 right-0 h-full w-24 bg-white/5 skew-x-[-15deg] translate-x-12" />
           </div>

           <div className="bg-white rounded-3xl border border-gray-100 p-8 shadow-sm">
              <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-6 px-1">Distribución Demográfica</h3>
              <div className="flex items-center justify-center h-48 relative">
                 {/* Simplified Doughnut Chart */}
                 <div className="relative h-32 w-32">
                    <svg className="h-full w-full" viewBox="0 0 100 100">
                       <circle cx="50" cy="50" r="40" fill="none" stroke="#f1f5f9" strokeWidth="12" />
                       <circle cx="50" cy="50" r="40" fill="none" stroke="#009b93" strokeWidth="12" strokeDasharray="251.2" strokeDashoffset="100.48" className="transition-all duration-1000" />
                       <circle cx="50" cy="50" r="40" fill="none" stroke="#005e59" strokeWidth="12" strokeDasharray="251.2" strokeDashoffset="200.96" className="transition-all duration-1000" />
                    </svg>
                    <div className="absolute inset-0 flex items-center justify-center flex-col">
                       <p className="text-sm font-black text-slate-900 leading-none tracking-tighter">60%</p>
                       <p className="text-[9px] font-bold text-slate-400 uppercase">Mujeres</p>
                    </div>
                 </div>
              </div>
              <div className="grid grid-cols-2 gap-4 mt-6">
                 <div className="flex items-center gap-2">
                    <div className="h-2 w-2 rounded-full bg-brand-primary" />
                    <span className="text-[10px] font-bold text-slate-600">Femenino (60%)</span>
                 </div>
                 <div className="flex items-center gap-2">
                    <div className="h-2 w-2 rounded-full bg-brand-secondary" />
                    <span className="text-[10px] font-bold text-slate-600">Masculino (40%)</span>
                 </div>
              </div>
           </div>
        </div>
      </div>
    </div>
  );
};

const CheckCircle2 = ({ className }: { className?: string }) => (
  <svg 
    xmlns="http://www.w3.org/2000/svg" 
    width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" 
    strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}
  >
    <path d="M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10z"/><path d="m9 12 2 2 4-4"/>
  </svg>
);
