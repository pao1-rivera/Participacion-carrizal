// components/dashboard/admin/DashboardPrincipal.tsx
import React from 'react';
import { Users, UserCheck, Clock, ShieldAlert, Database, Cpu, HardDrive, Activity } from 'lucide-react';
import { cn } from '@/app/lib/utils';

interface DashboardPrincipalProps {
  totalUserCount: number;
  activeUserCount: number;
  pendingUserCount: number;
  alertsCount: number;
  liveLogConsole: string[];
  storageUsed: number;      // bytes
  storageLimit: number;     // bytes
  databaseSize: number;     // bytes
  totalRows: number;        // filas totales en tablas principales
}

export const DashboardPrincipal: React.FC<DashboardPrincipalProps> = ({
  totalUserCount,
  activeUserCount,
  pendingUserCount,
  alertsCount,
  liveLogConsole,
  storageUsed,
  storageLimit,
  databaseSize,
  totalRows
}) => {
  const storageUsedGB = storageUsed / (1024 * 1024 * 1024);
  const storageLimitGB = storageLimit / (1024 * 1024 * 1024);
  const storagePercent = Math.min((storageUsed / storageLimit) * 100, 100);

  const dbSizeGB = databaseSize / (1024 * 1024 * 1024);

  // Asumimos un límite imaginario de 10k filas para el indicador de consultas
  const queryLimit = 10000;
  const queryPercent = Math.min((totalRows / queryLimit) * 100, 100);

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-300">
      {/* Cabecera (sin cambios) */}

      {/* Metricas de Consumo (actualizar storage y base de datos) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Total usuarios (igual) */}
        <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mb-1">Cuentas Registradas</p>
            <p className="text-3xl font-black text-slate-950 tracking-tighter">{totalUserCount}</p>
          </div>
          <div className="w-12 h-12 rounded-xl bg-slate-50 flex items-center justify-center text-slate-400 border border-slate-100">
            <Users size={20} />
          </div>
        </div>

        {/* Activos (igual) */}
        <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mb-1">Cuentas Activas</p>
            <p className="text-3xl font-black text-slate-950 tracking-tighter text-emerald-600">{activeUserCount}</p>
          </div>
          <div className="w-12 h-12 rounded-xl bg-emerald-50 flex items-center justify-center text-emerald-600 border border-emerald-100">
            <UserCheck size={20} />
          </div>
        </div>

        {/* Almacenamiento usado */}
        <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mb-1">Almacenamiento</p>
            <p className="text-3xl font-black text-slate-950 tracking-tighter text-blue-600">
              {storageUsedGB.toFixed(1)} GB
            </p>
            <p className="text-[9px] text-slate-400 font-bold">de {storageLimitGB.toFixed(0)} GB</p>
          </div>
          <div className="w-12 h-12 rounded-xl bg-blue-50 flex items-center justify-center text-blue-600 border border-blue-100">
            <HardDrive size={20} />
          </div>
        </div>

        {/* Tamaño de la base de datos */}
        <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mb-1">Base de Datos</p>
            <p className="text-3xl font-black text-slate-950 tracking-tighter text-indigo-600">
              {dbSizeGB.toFixed(1)} GB
            </p>
          </div>
          <div className="w-12 h-12 rounded-xl bg-indigo-50 flex items-center justify-center text-indigo-600 border border-indigo-100">
            <Database size={20} />
          </div>
        </div>
      </div>

      {/* Telemetria de Servidor y Latencia */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm flex flex-col justify-between">
          <h3 className="text-xs font-black text-slate-900 uppercase tracking-widest mb-6 py-1 border-b border-slate-50 flex items-center gap-2">
            <Database size={16} className="text-brand-primary" /> Rendimiento de la Infraestructura
          </h3>
          
          <div className="space-y-4">
            <div>
              <div className="flex justify-between text-xs font-bold text-slate-700 mb-1">
                <span>Uso de Almacenamiento</span>
                <span>{storagePercent.toFixed(1)}%</span>
              </div>
              <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden">
                <div className="bg-blue-500 h-full rounded-full" style={{ width: `${storagePercent}%` }} />
              </div>
            </div>

            <div>
              <div className="flex justify-between text-xs font-bold text-slate-700 mb-1">
                <span>Filas en tablas principales (carga de consultas)</span>
                <span>{totalRows.toLocaleString()}</span>
              </div>
              <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden">
                <div className="bg-indigo-500 h-full rounded-full" style={{ width: `${queryPercent}%` }} />
              </div>
              <p className="text-[9px] text-slate-400 mt-1">Límite estimado: {queryLimit.toLocaleString()} filas</p>
            </div>

            <div>
              <div className="flex justify-between text-xs font-bold text-slate-700 mb-1">
                <span>Tamaño de la Base de Datos</span>
                <span>{dbSizeGB.toFixed(2)} GB</span>
              </div>
              <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden">
                {/* Suponemos un límite de 10 GB para la BD (ajusta según tu plan) */}
                <div className="bg-brand-primary h-full rounded-full" style={{ width: `${Math.min((dbSizeGB / 10) * 100, 100)}%` }} />
              </div>
            </div>
          </div>

          <div className="bg-slate-50/50 p-4 rounded-xl border border-slate-100 flex items-center gap-4 mt-6">
            <div className="p-3 bg-white rounded-xl border border-slate-100 text-indigo-950 bg-indigo-50">
              <Cpu size={20} />
            </div>
            <div className="text-left">
              <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider leading-none">Versión Core</p>
              <p className="text-xs font-black text-slate-800 uppercase italic mt-1">SIGP v4.81-LTS (Cloud Run Containers)</p>
            </div>
          </div>
        </div>

        {/* Terminal de Consola en Tiempo Real (igual) */}
        <div className="bg-slate-950 p-6 rounded-3xl border border-white/5 shadow-2xl font-mono flex flex-col justify-between text-left">
          <div>
            <div className="flex items-center justify-between border-b border-white/10 pb-4 mb-4">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-rose-500" />
                <span className="w-2.5 h-2.5 rounded-full bg-amber-500" />
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                <span className="text-[9px] text-slate-400 font-black uppercase ml-2 tracking-widest">Servicios Municipales SIGP</span>
              </div>
              <div className="text-[8px] p-0.5 px-2 bg-emerald-500/10 text-emerald-400 rounded border border-emerald-500/20 animate-pulse font-black uppercase tracking-wider">
                Live
              </div>
            </div>
            <div className="space-y-2 text-[10px] text-indigo-200">
              {liveLogConsole.map((log, index) => (
                <p key={index} className="leading-relaxed hover:text-white transition-colors">
                  <span className="text-slate-500 font-bold">&#62;</span> {log}
                </p>
              ))}
            </div>
          </div>
          <div className="flex items-center justify-between text-[8px] text-indigo-400/50 pt-4 mt-4 border-t border-white/5 font-black tracking-widest uppercase">
            <span>Host: CLOUD-RUN_CONTAINER</span>
            <span>Port: 3000 (Proxy Nginx)</span>
          </div>
        </div>
      </div>
    </div>
  );
};