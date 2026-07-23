// app/components/GestionProyecto.tsx
'use client';
import React, { useState } from 'react';
import Link from 'next/link';
import { 
  TrendingUp, Landmark, Users, AlertCircle, FileText, PlusCircle, Download 
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/app/lib/utils';
import { AsambleasG } from './AsambleasG';
import { NudosG } from './NudosG';
import { ProyectosG } from './ProyectosG';
import { RendicionesG } from './RendicionesG';  // ← Importa el nuevo componente

export const GestionProyecto = () => {
  const [activeTab, setActiveTab] = useState('asambleas');

  return (
    <div className="space-y-8 p-3 md:p-6">
      {/* Encabezado */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h2 className="text-sm md:text-base font-black text-brand-primary uppercase tracking-tighter italic">
            Dimensión IV: Gestión y Transparencia
          </h2>
          <p className="text-[9px] md:text-[10px] text-gray-500 font-bold uppercase tracking-widest mt-0.5">
            Asambleas, nudos críticos, proyectos y rendición de cuentas
          </p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex bg-slate-100 p-1 rounded-xl w-fit gap-1">
        <TabButton active={activeTab === 'asambleas'} onClick={() => setActiveTab('asambleas')} label="Asambleas" icon={<Users size={14} />} />
        <TabButton active={activeTab === 'nudos'} onClick={() => setActiveTab('nudos')} label="Nudos Críticos" icon={<AlertCircle size={14} />} />
        <TabButton active={activeTab === 'proyectos'} onClick={() => setActiveTab('proyectos')} label="Proyectos" icon={<TrendingUp size={14} />} />
        <TabButton active={activeTab === 'rendiciones'} onClick={() => setActiveTab('rendiciones')} label="Rendiciones" icon={<FileText size={14} />} />
      </div>

      <AnimatePresence mode="wait">
        {activeTab === 'asambleas' && (
          <motion.div key="asambleas" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}>
            <AsambleasG />
          </motion.div>
        )}
        {activeTab === 'nudos' && (
          <motion.div key="nudos" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}>
            <NudosG />
          </motion.div>
        )}
        {activeTab === 'proyectos' && (
          <motion.div key="proyectos" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}>
            <ProyectosG />
          </motion.div>
        )}
        {activeTab === 'rendiciones' && (
          <motion.div key="rendiciones" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}>
            <RendicionesG />  {/* ← Reemplaza el placeholder */}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

const TabButton = ({ active, onClick, label, icon }: any) => (
  <button onClick={onClick} className={cn("flex items-center gap-2 px-4 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-wider transition-all", active ? "bg-white text-[#008f82] shadow-sm" : "text-slate-500 hover:text-[#008f82]")}>
    {icon} {label}
  </button>
);