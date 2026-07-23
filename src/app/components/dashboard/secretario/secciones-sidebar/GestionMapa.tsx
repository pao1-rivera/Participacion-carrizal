'use client';
import React, { useState } from 'react';
import { 
  Map as MapIcon, Globe, Users, Activity
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/app/lib/utils';
import { DinaPoblacional } from './DinaPoblacional';
import { EstructuraGeo } from './EstructuraGeo';
import { CartoDigital } from './CartoDigital'; 

export const GestionMapa = () => {
  const [activeTab, setActiveTab] = useState('geopolitica');

  return (
    <div className="space-y-8 p-3 md:p-6">
      {/* Encabezado */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-sm md:text-base font-black text-brand-primary uppercase tracking-tighter italic">
            Dimensión III: Territorio y Geopolítica
          </h2>
          <p className="text-[9px] md:text-[10px] text-gray-500 font-bold uppercase tracking-widest mt-0.5">
            Gestión de Cartografía Social, Dinámica Poblacional y Servicios del Municipio Carrizal
          </p>
        </div>
      </div>

      {/* Tabs - ahora 3 */}
      <div className="flex bg-slate-100 p-1 rounded-xl w-fit gap-1">
        <TabButton active={activeTab === 'geopolitica'} onClick={() => setActiveTab('geopolitica')} label="Estructura Geopolítica" icon={<Globe size={14} />} />
        <TabButton active={activeTab === 'dinamica'} onClick={() => setActiveTab('dinamica')} label="Dinámica y Servicios" icon={<Users size={14} />} />
        <TabButton active={activeTab === 'mapa'} onClick={() => setActiveTab('mapa')} label="Cartografía Digital" icon={<MapIcon size={14} />} />
      </div>

      <AnimatePresence mode="wait">
        {activeTab === 'geopolitica' && (
          <motion.div key="geopolitica" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}>
            <EstructuraGeo />
          </motion.div>
        )}

        {activeTab === 'dinamica' && (
          <motion.div key="dinamica" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}>
            <DinaPoblacional />   {/* Ahora incluye todo: población + servicios */}
          </motion.div>
        )}

        {activeTab === 'mapa' && (
          <motion.div key="mapa" initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.98 }}>
            <CartoDigital />
          </motion.div>
        )}
      </AnimatePresence> 
    </div>
  );
};

// ==================== SUBCOMPONENTES ====================
function TabButton({ active, onClick, label, icon }: any) {
  return (
    <button onClick={onClick} className={cn("flex items-center gap-2 px-4 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-wider transition-all", active ? "bg-white text-[#008f82] shadow-sm" : "text-slate-500 hover:text-[#008f82]")}>
      {icon} {label}
    </button>
  );
}