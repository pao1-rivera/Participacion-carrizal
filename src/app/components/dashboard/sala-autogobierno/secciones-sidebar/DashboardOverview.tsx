import React from 'react';
import { 
  Users, 
  Activity, 
  ClipboardCheck, 
  Map as MapIcon, 
  Search, 
  Filter, 
  Zap, 
  Droplets, 
  ArrowUpRight, 
  TrendingUp, 
  AlertCircle, 
  Wifi 
} from 'lucide-react';
import { motion } from 'framer-motion';
import { cn } from '@/app/lib/utils';
import { SalaAutogobiernoData } from '@/types';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip as RechartsTooltip, 
  ResponsiveContainer, 
  Cell 
} from 'recharts';

const SILENCE_DATA = [
  { name: 'Brindisi', days: 12 },
  { name: 'Eje 1A', days: 25 },
  { name: 'Casco', days: 5 },
  { name: 'Colinas', days: 30 },
  { name: 'Brisas', days: 8 },
];

const T7_INDICATORS = [
  { id: 't1', name: 'Económica', icon: Zap, color: 'text-blue-600', bg: 'bg-blue-50', count: 42, label: 'Emprendimientos' },
  { id: 't2', name: 'Servicios', icon: Droplets, color: 'text-cyan-600', bg: 'bg-cyan-50', count: 85, label: '% Reportes' },
  { id: 't3', name: 'Seguridad', icon: Zap, color: 'text-red-600', bg: 'bg-red-50', count: 12, label: 'Cuadrantes' },
  { id: 't4', name: 'Social', icon: Activity, color: 'text-pink-600', bg: 'bg-pink-50', count: 156, label: 'Atenciones' },
  { id: 't5', name: 'Política', icon: Users, color: 'text-indigo-600', bg: 'bg-indigo-50', count: 98, label: 'Voceros Act.' },
  { id: 't6', name: 'Ecología', icon: MapIcon, color: 'text-green-600', bg: 'bg-green-50', count: 5, label: 'Brigadas' },
  { id: 't7', name: 'Geopolítica', icon: Activity, color: 'text-purple-600', bg: 'bg-purple-50', count: 3, label: 'Acuerdos' },
];

interface DashboardOverviewProps {
  user: SalaAutogobiernoData;
  openModal: (type: 'form' | 'detail' | 'success', title: string, data?: any) => void;
}

export const DashboardOverview: React.FC<DashboardOverviewProps> = ({ user, openModal }) => {
  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-700 space-y-6">
      {/* Analytical Metrics Header */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div 
          onClick={() => openModal('detail', 'Desglose de Población', { Total: '4,285', Familias: '1,200', Habitantes: '3,085', Estatus: 'Validado' })}
          className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm overflow-hidden relative group cursor-pointer hover:border-brand-primary transition-all"
        >
          <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:scale-110 transition-transform">
            <Users size={80} className="text-brand-primary" />
          </div>
          <div className="flex flex-col">
            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1 leading-none">Alcance Poblacional</span>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-bold text-gray-900">4,285</span>
              <span className="text-xs text-green-600 font-medium">+2.1%</span>
            </div>
            <p className="text-xs text-gray-500 mt-2 italic shadow-xs">Total Familias y Habitantes del Eje</p>
          </div>
        </div>

        <div 
          onClick={() => openModal('detail', 'Estatus de Organización', { Nivel: '78%', 'Consejos Vigentes': '8/12', Próx_Vencimientos: '2', Alertas: 'Ninguna' })}
          className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm overflow-hidden relative group cursor-pointer hover:border-brand-primary transition-all"
        >
          <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:scale-110 transition-transform">
            <Activity size={80} className="text-brand-primary" />
          </div>
          <div className="flex flex-col">
            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1 leading-none">Nivel de Organización</span>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-bold text-gray-900">78%</span>
              <span className="text-xs text-brand-primary font-medium">8/12 CC</span>
            </div>
            <p className="text-xs text-gray-500 mt-2 italic shadow-xs">Vocerías Vigentes vs Vencidas</p>
          </div>
        </div>

        <div 
          onClick={() => openModal('form', 'Nueva Sistematización Mensual', { mes: 'Mayo 2024' })}
          className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm overflow-hidden relative group cursor-pointer hover:border-brand-primary transition-all"
        >
          <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:scale-110 transition-transform">
            <ClipboardCheck size={80} className="text-brand-primary" />
          </div>
          <div className="flex flex-col">
            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1 leading-none">Índice de Sistematización</span>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-bold text-gray-900">62%</span>
              <span className="text-xs text-orange-500 font-medium">En proceso</span>
            </div>
            <p className="text-xs text-gray-500 mt-2 italic shadow-xs">Avance de carga 7T este mes</p>
          </div>
        </div>
      </div>

      {/* Main Analytical Section: Map & Indicators */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden flex flex-col">
          <div className="p-4 border-b border-gray-50 flex items-center justify-between">
            <h3 className="text-sm font-bold text-gray-900 uppercase tracking-tight flex items-center gap-2">
               <MapIcon className="w-4 h-4 text-brand-primary" />
               Mapa Territorial (Eje Central)
            </h3>
            <div className="flex gap-2">
              <button className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors"><Search size={16} className="text-gray-500" /></button>
              <button className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors"><Filter size={16} className="text-gray-500" /></button>
            </div>
          </div>
          <div className="flex-1 bg-blue-50 relative overflow-hidden group min-h-[400px]">
            <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10" />
            
            <div className="absolute top-[40%] left-[30%]">
              <div className="relative">
                <div className="absolute -inset-4 bg-red-400/30 rounded-full animate-ping" />
                <div className="relative p-2 bg-white rounded-full shadow-lg border border-red-100">
                  <Zap className="w-4 h-4 text-red-600" />
                </div>
                <div className="absolute top-full left-1/2 -translate-x-1/2 mt-2 bg-white/90 backdrop-blur px-2 py-1 rounded-md shadow-sm border border-gray-100 pointer-events-none">
                  <span className="text-[10px] font-bold text-red-600 whitespace-nowrap">Nudo Crítico: Electricidad</span>
                </div>
              </div>
            </div>

            <div className="absolute top-[60%] left-[70%]">
              <div className="relative">
                <div className="absolute -inset-4 bg-orange-400/20 rounded-full animate-ping duration-1500" />
                <div className="relative p-2 bg-white rounded-full shadow-lg border border-orange-100">
                  <Droplets className="w-4 h-4 text-orange-600" />
                </div>
                <div className="absolute top-full left-1/2 -translate-x-1/2 mt-2 bg-white/90 backdrop-blur px-2 py-1 rounded-md shadow-sm border border-gray-100 pointer-events-none">
                  <span className="text-[10px] font-bold text-orange-600 whitespace-nowrap">Reporte: Agua</span>
                </div>
              </div>
            </div>

            <div className="absolute bottom-4 left-4 right-4 bg-white/80 backdrop-blur p-3 rounded-xl border border-white/50 flex flex-wrap gap-4 items-center justify-center text-slate-900">
               <div className="flex items-center gap-1.5"><div className="w-3 h-3 rounded-sm bg-red-500" /><span className="text-[10px] text-gray-600">Prioridad Alta</span></div>
               <div className="flex items-center gap-1.5"><div className="w-3 h-3 rounded-sm bg-orange-500" /><span className="text-[10px] text-gray-600">Prioridad Media</span></div>
               <div className="flex items-center gap-1.5"><div className="w-3 h-3 rounded-sm bg-blue-500" /><span className="text-[10px] text-gray-600">Comunas Vinc.</span></div>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 space-y-4">
           <h3 className="text-sm font-bold text-gray-900 uppercase tracking-tight flex items-center gap-2 mb-4">
               <Zap className="w-4 h-4 text-brand-primary" />
               Tablero de las 7T
            </h3>
            <div className="space-y-3">
              {T7_INDICATORS.map(item => (
                <div 
                  key={item.id} 
                  onClick={() => openModal('detail', 'Sistematización: ' + item.name, { Meta: item.label, 'Cantidad Reportes': item.count, Estatus: 'Sincronizado' })}
                  className="group cursor-pointer hover:bg-gray-50 transition-all p-2 -m-2 rounded-xl border border-transparent hover:border-gray-100"
                >
                   <div className="flex items-center justify-between">
                     <div className="flex items-center gap-3">
                       <div className={cn("w-10 h-10 rounded-lg flex items-center justify-center", item.bg)}>
                         <item.icon className={cn("w-5 h-5", item.color)} />
                       </div>
                       <div>
                         <p className="text-xs font-bold text-gray-900">{item.name}</p>
                         <p className="text-[10px] text-gray-500">{item.label}</p>
                       </div>
                     </div>
                     <div className="text-right">
                        <span className="text-sm font-bold text-gray-900">{item.count}</span>
                        <ArrowUpRight className="inline-block w-3 h-3 text-brand-primary ml-1 opacity-0 group-hover:opacity-100 transition-opacity" />
                     </div>
                   </div>
                </div>
              ))}
            </div>
            <button className="w-full py-2.5 bg-gray-50 text-brand-primary text-xs font-bold rounded-xl hover:bg-brand-primary hover:text-white transition-all mt-4 border border-brand-primary/10">
              Ver Detalle Regional
            </button>
        </div>
      </div>

      {/* Monitor de Trámites & Zonas en Silencio */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white rounded-2xl border border-gray-100 shadow-sm p-6 overflow-hidden">
           <div className="flex items-center justify-between mb-6">
              <h3 className="text-sm font-bold text-gray-900 uppercase tracking-tight flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-brand-primary" />
                Monitor de Trámites y Proyectos
              </h3>
              <div className="text-[10px] text-brand-primary font-bold bg-brand-primary/5 px-2 py-1 rounded-md">8 Obras Activas</div>
           </div>
           
           <div className="space-y-6">
              <div className="group">
                <div className="flex justify-between items-center mb-2">
                  <div>
                    <p className="text-xs font-bold text-gray-900">Mejoras de Vialidad - Sector El Despertar</p>
                    <p className="text-[10px] text-gray-500">C.C. El Despertar / Finan: Alcaldía</p>
                  </div>
                  <span className="text-xs font-bold text-brand-primary">65%</span>
                </div>
                <div className="h-2 w-full bg-gray-100 rounded-full overflow-hidden">
                  <motion.div 
                    initial={{ width: 0 }}
                    animate={{ width: '65%' }}
                    className="h-full bg-brand-primary shadow-[0_0_8px_rgba(var(--brand-primary-rgb),0.4)]"
                  />
                </div>
              </div>

              <div className="group">
                <div className="flex justify-between items-center mb-2">
                  <div>
                    <p className="text-xs font-bold text-gray-900">Electrificación - La Colina</p>
                    <p className="text-[10px] text-gray-500">Comuna Brisas / Finan: CFG</p>
                  </div>
                  <span className="text-xs font-bold text-brand-primary">22%</span>
                </div>
                <div className="h-2 w-full bg-gray-100 rounded-full overflow-hidden">
                  <motion.div 
                    initial={{ width: 0 }}
                    animate={{ width: '22%' }}
                    className="h-full bg-orange-500"
                  />
                </div>
              </div>
           </div>

           <div className="mt-8 pt-6 border-t border-gray-50">
              <div className="flex items-center gap-2 mb-4 text-red-600 bg-red-50 p-3 rounded-xl border border-red-100">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span className="text-[10px] font-bold uppercase">Alertas de Nudos Críticos (Top 5)</span>
              </div>
              <div className="space-y-3">
                 {[
                   { label: 'Falla Transformador 15kVA', area: 'Electricidad', sector: 'Sector 3', time: 'hace 4h' },
                   { label: 'Brote Agua Servidas', area: 'Aguas', sector: 'Vereda 2', time: 'hace 1d' },
                 ].map((alert, i) => (
                    <div 
                      key={i} 
                      onClick={() => openModal('detail', 'Alerta de Nudo Crítico', alert)}
                      className="flex items-center justify-between p-3 bg-white border border-gray-100 rounded-xl hover:border-brand-primary/30 transition-all cursor-pointer shadow-sm group"
                    >
                      <div className="flex items-center gap-3 text-slate-800">
                        <div className="w-2 h-2 rounded-full bg-red-500 group-hover:scale-125 transition-transform" />
                        <div>
                          <p className="text-xs font-bold text-gray-900">{alert.label}</p>
                          <p className="text-[10px] text-gray-500">{alert.sector} — {alert.area}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-medium text-gray-400">{alert.time}</span>
                        <ArrowUpRight size={14} className="text-brand-primary opacity-0 group-hover:opacity-100 transition-opacity" />
                      </div>
                    </div>
                 ))}
              </div>
           </div>
        </div>

        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 overflow-hidden flex flex-col">
           <h3 className="text-sm font-bold text-gray-900 uppercase tracking-tight flex items-center gap-2 mb-6">
              <Wifi className="w-4 h-4 text-brand-primary" />
              Zonas en Silencio
           </h3>
           <div className="flex-1 min-h-[250px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={SILENCE_DATA} layout="vertical" margin={{ left: -20 }}>
                  <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#E2E8F0" />
                  <XAxis type="number" hide />
                  <YAxis 
                    dataKey="name" 
                    type="category" 
                    width={80} 
                    axisLine={false} 
                    tickLine={false}
                    tick={{ fontSize: 10, fontWeight: 500, fill: '#64748B' }}
                  />
                  <RechartsTooltip 
                    contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                    cursor={{ fill: '#F1F5F9' }}
                  />
                  <Bar dataKey="days" radius={[0, 4, 4, 0]} barSize={20}>
                    {SILENCE_DATA.map((entry, index) => (
                      <Cell key={index} fill={entry.days > 20 ? '#EF4444' : '#042D5F'} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
           </div>
           <p className="text-[10px] text-gray-500 mt-4 italic text-center">Días transcurridos desde el último reporte</p>
           
           <div className="mt-6 p-4 bg-gray-50 rounded-2xl border border-gray-100">
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-3">Validación de Base</p>
              <div className="space-y-3">
                 <div className="flex items-center justify-between">
                    <span className="text-xs text-gray-700">Reportes Pendientes</span>
                    <span className="text-xs font-bold text-brand-primary">12</span>
                 </div>
                 <button 
                  onClick={() => openModal('success', 'Validación Exitosa', { message: 'Todos los datos de la base territorial han sido validados y sincronizados correctamente con el sistema central.' })}
                  className="w-full py-2 bg-white text-brand-primary text-[10px] font-bold rounded-lg border border-brand-primary/10 hover:bg-brand-primary hover:text-white transition-all shadow-sm uppercase tracking-wider"
                >
                    Ir a Validar Datos
                 </button>
              </div>
           </div>
        </div>
      </div>
    </div>
  );
};
