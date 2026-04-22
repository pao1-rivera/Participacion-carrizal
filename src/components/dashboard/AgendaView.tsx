import React from 'react';
import { motion } from 'motion/react';
import { 
  Calendar as CalendarIcon, 
  Clock, 
  MapPin, 
  Users, 
  ChevronLeft, 
  ChevronRight,
  Plus,
  AlertCircle
} from 'lucide-react';
import { cn } from '../../lib/utils';

export const AgendaView = () => {
  const days = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];
  const currentMonth = "Mayo 2024";
  
  // Mock calendar data
  const monthDays = Array.from({ length: 31 }, (_, i) => i + 1);
  const startOffset = 3; // Starts on Wednesday
  
  const events = [
    { day: 15, title: 'Asamblea Ciudadana', type: 'politico', time: '10:00 AM', location: 'Plaza Bolívar' },
    { day: 18, title: 'Gobierno de Calle', type: 'gestion', time: '02:00 PM', location: 'Sector La Ladera' },
    { day: 22, title: 'Entrega de CLAP', type: 'social', time: '08:00 AM', location: 'Cancha Central' },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">Agenda Comunal</h2>
          <p className="text-slate-500 text-sm">Planificación de actividades y despliegues territoriales.</p>
        </div>
        <button className="flex items-center gap-2 rounded-xl bg-brand-primary px-5 py-2.5 text-sm font-bold text-white shadow-lg shadow-brand-primary/20 hover:scale-[1.02] transition-all">
          <Plus className="h-4 w-4" /> Programar Actividad
        </button>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Calendar Grid */}
        <div className="lg:col-span-2 bg-white rounded-3xl border border-gray-100 shadow-sm p-8">
          <div className="flex items-center justify-between mb-8">
            <h3 className="text-lg font-bold text-slate-900">{currentMonth}</h3>
            <div className="flex items-center gap-2">
              <button className="p-2 hover:bg-gray-100 rounded-lg transition-colors"><ChevronLeft className="h-5 w-5" /></button>
              <button className="p-2 hover:bg-gray-100 rounded-lg transition-colors"><ChevronRight className="h-5 w-5" /></button>
            </div>
          </div>

          <div className="grid grid-cols-7 gap-px bg-gray-100 border border-gray-100 rounded-2xl overflow-hidden">
            {days.map(d => (
              <div key={d} className="bg-gray-50 py-3 text-center text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                {d}
              </div>
            ))}
            {Array.from({ length: startOffset }).map((_, i) => (
              <div key={`offset-${i}`} className="bg-white min-h-[100px]" />
            ))}
            {monthDays.map(d => {
              const dayEvents = events.filter(e => e.day === d);
              return (
                <div key={d} className="bg-white min-h-[100px] p-2 hover:bg-gray-50 transition-colors group relative">
                  <span className={cn(
                    "inline-flex h-7 w-7 items-center justify-center rounded-full text-xs font-bold",
                    d === 21 ? "bg-brand-primary text-white" : "text-slate-600"
                  )}>
                    {d}
                  </span>
                  <div className="mt-1 space-y-1">
                    {dayEvents.map((e, idx) => (
                      <div key={idx} className={cn(
                        "text-[9px] font-bold px-1.5 py-0.5 rounded border truncate",
                        e.type === 'politico' ? "bg-purple-50 text-purple-700 border-purple-100" :
                        e.type === 'gestion' ? "bg-blue-50 text-blue-700 border-blue-100" :
                        "bg-green-50 text-green-700 border-green-100"
                      )}>
                        {e.title}
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Side Info */}
        <div className="space-y-6">
          <div className="bg-brand-secondary rounded-3xl p-8 text-white">
            <h3 className="text-xl font-bold mb-4 italic tracking-tight">Próximo Despliegue</h3>
            <div className="space-y-4">
               <div className="flex items-start gap-4 p-4 rounded-2xl bg-white/10 border border-white/10">
                  <div className="h-10 w-10 rounded-xl bg-brand-primary flex items-center justify-center shrink-0">
                    <Users className="h-5 w-5" />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold">Gobierno de Calle</h4>
                    <p className="text-[10px] text-cyan-100 mt-1 flex items-center gap-1">
                      <CalendarIcon className="h-3 w-3" /> 18 de Mayo, 2024
                    </p>
                    <p className="text-[10px] text-cyan-100 mt-0.5 flex items-center gap-1">
                      <MapPin className="h-3 w-3" /> Sector La Ladera
                    </p>
                  </div>
               </div>
               
               <div className="bg-brand-primary/20 p-4 rounded-2xl border border-brand-primary/30">
                  <p className="text-[10px] text-cyan-50 font-bold uppercase tracking-widest">Temática Principal</p>
                  <p className="text-xs font-medium mt-2 leading-relaxed">
                    Atención directa a nudos críticos de agua y vialidad reportados por el C.C. Brisas del Norte.
                  </p>
               </div>
            </div>
          </div>

          <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-8">
            <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-6 px-1">Pendientes por Fecha</h3>
            <div className="space-y-4">
               {[
                 { title: 'Validación de Censo', date: 'Vence mañana', color: 'text-rose-500' },
                 { title: 'Reunión de Gabinete', date: 'Lunes 14, 9AM', color: 'text-slate-500' },
                 { title: 'Carga de ACA', date: 'Pendiente', color: 'text-amber-500' }
               ].map((item, i) => (
                 <div key={i} className="flex items-center justify-between p-4 rounded-2xl hover:bg-gray-50 transition-colors border border-transparent hover:border-gray-100">
                    <span className="text-sm font-bold text-slate-800">{item.title}</span>
                    <span className={cn("text-[10px] font-bold uppercase", item.color)}>{item.date}</span>
                 </div>
               ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
