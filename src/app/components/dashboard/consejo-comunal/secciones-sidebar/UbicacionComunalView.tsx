"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from 'framer-motion';
import { 
  MapPin, 
  Shield, 
  LocateFixed, 
  Map as MapIcon, 
  Save, 
  Layers, 
  Compass,
  Info,
  Activity,
  X,
  Link2
} from "lucide-react";
import { cn } from "@/app/lib/utils";

export const UbicacionComunalView = () => {
  // Coordenadas de referencia para Carrizal
  const [coordinates, setCoordinates] = useState({ lat: 10.3496, lng: -66.9845 });
  const [mapLink, setMapLink] = useState("");
  
  // Estado para controlar si ya existe un registro
  const [isRegistered, setIsRegistered] = useState(false);
  
  // Estado para la Modal
  const [isModalOpen, setIsModalOpen] = useState(false);

  const handleAction = () => {
    setIsModalOpen(true);
  };

  const saveData = (e: React.FormEvent) => {
    e.preventDefault();
    setIsRegistered(true);
    setIsModalOpen(false);
    console.log("Datos guardados correctamente");
  };

  return (
    <div className="space-y-8 relative">
      {/* Header de Sección con Acción Principal */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-black text-slate-800 italic uppercase tracking-tighter flex items-center gap-3">
            <LocateFixed className="h-6 w-6 text-brand-primary" /> Ubicación Geográfica
          </h2>
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em] mt-1">
            Gestión de la "Poligonal Inteligente" y Blindaje Territorial
          </p>
        </div>
        {/* BOTÓN CON COLOR DE MARCA */}
        <button 
          onClick={handleAction}
          className="flex items-center justify-center gap-2 px-6 py-3 bg-brand-primary hover:bg-brand-primary/90 text-white rounded-2xl font-black text-xs uppercase italic tracking-widest transition-all shadow-lg shadow-brand-primary/20 active:scale-95 group"
        >
          <Save className="h-4 w-4 group-hover:animate-bounce" />
          {isRegistered ? "Actualizar Poligonal" : "Registrar Poligonal"}
        </button>
      </div>

      {/* Card Principal: Mapa y Delimitación */}
      <div className="bg-white p-8 rounded-[2.5rem] border border-gray-100 shadow-sm relative overflow-hidden">
        <div className="relative z-10 grid lg:grid-cols-3 gap-8">
          
          {/* Columna Izquierda: Datos de la Poligonal */}
          <div className="lg:col-span-1 space-y-6">
            <div className="space-y-2">
              <h3 className="text-base font-black text-slate-800 italic uppercase tracking-tighter flex items-center gap-2">
                <Compass className="h-5 w-5 text-brand-primary" /> Delimitación
              </h3>
            </div>

            <div className="space-y-4">
              <div className="p-5 rounded-3xl bg-gray-50 border border-gray-100 space-y-3">
                <div>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Punto Central (Centroide)</p>
                  <div className="flex items-center gap-2 text-sm font-black text-slate-800">
                    <MapPin className="h-4 w-4 text-brand-primary" />
                    <span>{coordinates.lat}° N, {coordinates.lng}° W</span>
                  </div>
                </div>
                <div className="pt-3 border-t border-gray-200/50">
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Superficie Estimada</p>
                  <p className="text-sm font-black text-slate-800 uppercase italic">12.45 Hectáreas</p>
                </div>
              </div>

              <div className="p-5 rounded-3xl bg-brand-primary/5 border border-brand-primary/10">
                <div className="flex items-center gap-2 mb-2">
                  <Shield className="h-4 w-4 text-brand-primary" />
                  <span className="text-[10px] font-black text-brand-primary uppercase">Estatus de Registro</span>
                </div>
                <p className="text-[11px] font-bold text-slate-700">Poligonal validada por la Oficina de Catastro Municipal y el Ministerio de Comunas.</p>
              </div>
            </div>
          </div>

          {/* Columna Derecha: Mapa Interactivo */}
          <div className="lg:col-span-2 space-y-4">
            <div className="aspect-video lg:aspect-auto lg:h-full min-h-[400px] rounded-[2.5rem] bg-slate-100 border-4 border-white shadow-xl overflow-hidden relative group">
              <iframe 
                src={`https://www.google.com/maps/embed?pb=!1m14!1m12!1m3!1d15705.518!2d${coordinates.lng}!3d${coordinates.lat}!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!5e0!3m2!1ses!2sve!4v1713800000000!5m2!1ses!2sve`} 
                className="w-full h-full border-0 grayscale-[0.2] contrast-110"
                allowFullScreen
                loading="lazy"
              />
              <div className="absolute top-6 left-6 py-2 px-4 bg-white/90 backdrop-blur-md rounded-xl border border-gray-100 shadow-sm">
                <div className="flex items-center gap-2">
                  <div className="h-2 w-2 rounded-full bg-brand-primary animate-pulse" />
                  <span className="text-[10px] font-black text-slate-800 uppercase italic">Mapa en Vivo</span>
                </div>
              </div>
            </div>
          </div>

        </div>
      </div>

      {/* Grid de Coordenadas y Limitaciones */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        {[
          { label: "Vértices Registrados", value: "18 Puntos", icon: Layers },
          { label: "Altitud Media", value: "1.300 msnm", icon: Activity },
          { label: "Zona Postal", value: "1204", icon: MapPin },
          { label: "Densidad Territorial", value: "Alta", icon: Info },
        ].map((item, i) => (
          <div key={i} className="bg-white p-6 rounded-[2rem] border border-gray-100 shadow-sm flex items-center gap-4">
            <div className="h-12 w-12 rounded-2xl bg-slate-50 flex items-center justify-center text-slate-400">
              <item.icon className="h-6 w-6" />
            </div>
            <div>
              <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">{item.label}</p>
              <p className="text-sm font-black text-slate-800 uppercase italic">{item.value}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Sección de Limitaciones de la Poligonal */}
      <div className="bg-white p-8 rounded-[2.5rem] border border-gray-100 shadow-sm">
        <div className="flex items-center gap-3 mb-8">
          <div className="h-8 w-8 rounded-xl bg-brand-primary/10 flex items-center justify-center">
            <MapIcon className="h-4 w-4 text-brand-primary" />
          </div>
          <h3 className="text-base font-black text-slate-800 italic uppercase tracking-tighter">
            Registro de Coordenadas y Limitaciones
          </h3>
        </div>

        <div className="w-full">
          <div className="grid grid-cols-1 gap-3">
            {[
              { type: "Norte", detail: "Intersección con Quebrada Santa Isabel - Hito N1" },
              { type: "Sur", detail: "Límite con Urbanización Colinas de Carrizal - Vértice S12" },
              { type: "Este", detail: "Talud de protección Carretera Panamericana KM 18" },
              { type: "Oeste", detail: "Área de reserva forestal comunitaria - Sector El Carmen" }
            ].map((limit, idx) => (
              <div key={idx} className="flex items-center justify-between p-4 rounded-2xl bg-gray-50/50 border border-gray-100">
                <span className="text-[10px] font-black text-slate-400 uppercase w-12">{limit.type}</span>
                <span className="text-[11px] font-black text-slate-700 uppercase italic truncate ml-4">{limit.detail}</span>
                <div className="h-2 w-2 rounded-full bg-brand-primary/30 ml-2" />
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* MODAL DE REGISTRO (ESTILO VOCERIAS) */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setIsModalOpen(false)}
                className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
              />
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative bg-white w-full max-w-lg rounded-[2.5rem] shadow-2xl overflow-hidden border border-gray-100"
            >
              <div className="p-8 border-b border-gray-50 flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-black text-slate-800 italic uppercase tracking-tighter">Nuevo Registro</h3>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Coordenadas y Límites Territoriales</p>
                </div>
                <button onClick={() => setIsModalOpen(false)} className="h-10 w-10 rounded-xl bg-gray-50 flex items-center justify-center text-slate-400 hover:text-red-500 transition-colors">
                  <X className="h-5 w-5" />
                </button>
              </div>

              <form onSubmit={saveData} className="p-8 space-y-5">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2">Latitud</label>
                    <input 
                      type="text" 
                      placeholder="10.3496" 
                      className="w-full p-4 rounded-2xl bg-gray-50 border-none ring-1 ring-gray-100 focus:ring-2 focus:ring-brand-primary/20 outline-none text-sm font-bold" 
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2">Longitud</label>
                    <input 
                      type="text" 
                      placeholder="-66.9845" 
                      className="w-full p-4 rounded-2xl bg-gray-50 border-none ring-1 ring-gray-100 focus:ring-2 focus:ring-brand-primary/20 outline-none text-sm font-bold" 
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2">Enlace Google Maps</label>
                  <div className="relative group">
                    <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-brand-primary transition-colors">
                      <Link2 className="h-4 w-4" />
                    </div>
                    <input 
                      type="url" 
                      placeholder="https://goo.gl/maps/..." 
                      className="w-full pl-11 p-4 rounded-2xl bg-gray-50 border-none ring-1 ring-gray-100 focus:ring-2 focus:ring-brand-primary/20 outline-none text-sm font-bold" 
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2">Límites (Linderos)</label>
                  <textarea 
                    rows={3} 
                    placeholder="Describa los linderos del territorio..." 
                    className="w-full p-4 rounded-2xl bg-gray-50 border-none ring-1 ring-gray-100 focus:ring-2 focus:ring-brand-primary/20 outline-none text-sm font-bold resize-none" 
                  />
                </div>

                <button 
                  type="submit" 
                  className="w-full py-5 bg-brand-primary hover:bg-brand-primary/90 text-white rounded-2xl font-black text-xs uppercase italic tracking-widest transition-all shadow-xl shadow-brand-primary/20 hover:scale-[1.02] active:scale-95"
                >
                  Completar Registro Territorial
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};