"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Plus, 
  X, 
  Upload, 
  CheckCircle2, 
  AlertCircle, 
  ChevronRight,
  ChevronLeft,
  Shield // Añadido para que no de error
} from "lucide-react";
import { cn } from "@/app/lib/utils";

export const VoceriaView = () => {
  const [isRegisterOpen, setIsRegisterOpen] = useState(false);
  const [selectedUnit, setSelectedUnit] = useState<string>("TODAS");
  
  // Estados para la paginación
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;

  const units = [
    "Unidad Ejecutiva",
    "Unidad Administrativa y Financiera",
    "Unidad de Contraloría",
    "Comisión Electoral Permanente",
  ];

  const voceros = [
    {
      name: "Ana María García",
      ci: "V-12.345.678",
      unit: "Unidad Ejecutiva",
      type: "Principal",
      profession: "Docente",
      education: "Postgrado",
      phone: "0414-1234567",
      rif: true,
    },
    {
      name: "Carlos Rodríguez",
      ci: "V-15.678.901",
      unit: "Unidad Ejecutiva",
      type: "Suplente",
      profession: "Ingeniero",
      education: "Universitario",
      phone: "0412-7654321",
      rif: true,
    },
    {
      name: "Luisa Jiménez",
      ci: "V-11.222.333",
      unit: "Unidad de Contraloría",
      type: "Principal",
      profession: "Contador",
      education: "Universitario",
      phone: "0416-5554433",
      rif: false,
    },
    {
      name: "Pedro Páez",
      ci: "V-14.444.555",
      unit: "Unidad Administrativa y Financiera",
      type: "Principal",
      profession: "Administrador",
      education: "Universitario",
      phone: "0424-9998877",
      rif: true,
    },
    {
      name: "Marta Colina",
      ci: "V-18.888.777",
      unit: "Comisión Electoral Permanente",
      type: "Principal",
      profession: "Abogado",
      education: "Postgrado",
      phone: "0426-1112233",
      rif: true,
    },
  ];

  const filteredVoceros =
    selectedUnit === "TODAS"
      ? voceros
      : voceros.filter((v) => v.unit === selectedUnit);

  // Lógica de Paginación
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = filteredVoceros.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(filteredVoceros.length / itemsPerPage);

  const handlePageChange = (pageNumber: number) => {
    setCurrentPage(pageNumber);
  };

  return (
    <div className="space-y-6">
      {/* Título de la Sección */}
      <div>
        <h2 className="text-xl font-black text-slate-800 italic uppercase tracking-tighter flex items-center gap-3">
            <Shield className="h-6 w-6 text-brand-primary" /> Listado de Vocerias
        </h2>
        <p className="text-[10px] text-slate-400 font-bold uppercase tracking-[0.2em] mt-1">
          Nombre y Responsabilidad de los lideres de las 4 unidades principales
        </p>
      </div>

      {/* Filtros por Unidad */}
      <div className="flex flex-wrap gap-2 mb-4">
        <button
          onClick={() => { setSelectedUnit("TODAS"); setCurrentPage(1); }}
          className={cn(
            "px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all",
            selectedUnit === "TODAS"
              ? "bg-brand-primary text-white shadow-lg shadow-brand-primary/20"
              : "bg-white text-slate-400 border border-gray-100 hover:bg-gray-50",
          )}
        >
          Todas
        </button>
        {units.map((unit) => (
          <button
            key={unit}
            onClick={() => { setSelectedUnit(unit); setCurrentPage(1); }}
            className={cn(
              "px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all",
              selectedUnit === unit
                ? "bg-brand-primary text-white shadow-lg shadow-brand-primary/20"
                : "bg-white text-slate-400 border border-gray-100 hover:bg-gray-50",
            )}
          >
            {unit}
          </button>
        ))}
      </div>

      <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="p-8 border-b border-gray-100 flex items-center justify-between bg-gray-50/30">
          <div>
            <h3 className="text-xl font-black text-slate-800 italic">
              Estructura de Vocerías
            </h3>
            <p className="text-[10px] text-slate-400 font-bold uppercase mt-1">
              Registro de {filteredVoceros.length} Líderes Comunitarios
            </p>
          </div>
          <button
            onClick={() => setIsRegisterOpen(true)}
            className="flex items-center gap-2 rounded-2xl bg-brand-primary px-6 py-3 text-xs font-black text-white shadow-lg shadow-brand-primary/20 hover:scale-105 active:scale-95 transition-all uppercase tracking-widest"
          >
            <Plus className="h-4 w-4" /> Registrar Vocero
          </button>
        </div>

        {/* Registro Modal */}
        <AnimatePresence>
          {isRegisterOpen && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setIsRegisterOpen(false)}
                className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
              />
              <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 20 }}
                className="relative w-full max-w-2xl bg-white rounded-[2.5rem] shadow-2xl overflow-hidden border border-gray-100"
              >
                <div className="p-8 border-b border-gray-50 flex items-center justify-between">
                  <h4 className="text-xl font-black text-slate-800 italic">
                    Registrar Nuevo Vocero
                  </h4>
                  <button
                    onClick={() => setIsRegisterOpen(false)}
                    className="p-2 rounded-xl hover:bg-gray-100"
                  >
                    <X className="h-5 w-5 text-slate-400" />
                  </button>
                </div>
                <form className="p-8 space-y-5">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                        Nombre Completo
                      </label>
                      <input
                        type="text"
                        className="w-full p-4 rounded-2xl bg-gray-50 border-none ring-1 ring-gray-100 focus:ring-2 focus:ring-brand-primary/20 outline-none text-sm font-bold"
                        placeholder="Ej: Ana Maria"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                        Cédula
                      </label>
                      <input
                        type="text"
                        className="w-full p-4 rounded-2xl bg-gray-50 border-none ring-1 ring-gray-100 focus:ring-2 focus:ring-brand-primary/20 outline-none text-sm font-bold"
                        placeholder="V-00.000.000"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                        Unidad / Instancia
                      </label>
                      <select className="w-full p-4 rounded-2xl bg-gray-50 border-none ring-1 ring-gray-100 focus:ring-2 focus:ring-brand-primary/20 outline-none text-sm font-bold appearance-none">
                        {units.map((u) => (
                          <option key={u}>{u}</option>
                        ))}
                      </select>
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                        Tipo de Vocero
                      </label>
                      <select className="w-full p-4 rounded-2xl bg-gray-50 border-none ring-1 ring-gray-100 focus:ring-2 focus:ring-brand-primary/20 outline-none text-sm font-bold appearance-none">
                        <option>Principal</option>
                        <option>Suplente</option>
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                        Profesión
                      </label>
                      <input
                        type="text"
                        className="w-full p-4 rounded-2xl bg-gray-50 border-none ring-1 ring-gray-100 focus:ring-2 focus:ring-brand-primary/20 outline-none text-sm font-bold"
                        placeholder="Ej: Docente"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                        Grado de Instrucción
                      </label>
                      <select className="w-full p-4 rounded-2xl bg-gray-50 border-none ring-1 ring-gray-100 focus:ring-2 focus:ring-brand-primary/20 outline-none text-sm font-bold appearance-none">
                        <option>Sin Instrucción</option>
                        <option>Primaria</option>
                        <option>Secundaria</option>
                        <option>Técnico Medio</option>
                        <option>Técnico Superior</option>
                        <option>Universitario</option>
                        <option>Postgrado</option>
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                        Teléfono de Contacto
                      </label>
                      <input
                        type="text"
                        className="w-full p-4 rounded-2xl bg-gray-50 border-none ring-1 ring-gray-100 focus:ring-2 focus:ring-brand-primary/20 outline-none text-sm font-bold"
                        placeholder="0414-0000000"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                        RIF Digitalizado
                      </label>
                      <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-2xl ring-1 ring-gray-100">
                        <button
                          type="button"
                          className="flex items-center gap-2 text-[10px] font-black text-brand-primary uppercase bg-white px-4 py-2 rounded-xl shadow-sm border border-gray-100 hover:bg-gray-50"
                        >
                          <Upload className="h-3 w-3" /> Subir Archivo
                        </button>
                        <span className="text-[9px] font-bold text-slate-400 italic">
                          Formato PDF/JPG
                        </span>
                      </div>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => setIsRegisterOpen(false)}
                    className="w-full py-5 rounded-2xl bg-brand-primary text-white text-xs font-black uppercase tracking-widest shadow-xl shadow-brand-primary/20 hover:scale-[1.02] active:scale-95 transition-all"
                  >
                    Completar Registro de Vocero
                  </button>
                </form>
              </motion.div>
            </div>
          )}
        </AnimatePresence>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50/50 border-b border-gray-100 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">
                <th className="px-8 py-5">Vocero</th>
                <th className="px-8 py-5">Instancia</th>
                <th className="px-8 py-5">Tipo</th>
                <th className="px-8 py-5">Formación</th>
                <th className="px-8 py-5">Contacto</th>
                <th className="px-8 py-5 text-right">RIF</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {currentItems.map((v, i) => (
                <tr key={i} className="hover:bg-gray-50/80 transition-colors group">
                   <td className="px-8 py-5">
                      <p className="text-sm font-black text-slate-800">{v.name}</p>
                      <p className="text-[10px] text-slate-400 font-bold uppercase tracking-tighter">C.I: {v.ci}</p>
                   </td>
                   <td className="px-8 py-5">
                      <p className="text-[10px] font-black text-slate-500 uppercase leading-tight max-w-[150px]">{v.unit}</p>
                   </td>
                   <td className="px-8 py-5">
                      <span className={cn(
                        "text-[9px] font-black px-2.5 py-1 rounded-full uppercase tracking-tighter border",
                        v.type === 'Principal' ? 'bg-indigo-50 text-indigo-600 border-indigo-100' : 'bg-slate-50 text-slate-600 border-slate-100'
                      )}>{v.type}</span>
                   </td>
                   <td className="px-8 py-5">
                      <p className="text-xs font-bold text-slate-700 italic">{v.profession}</p>
                      <p className="text-[9px] text-slate-400 font-black uppercase tracking-widest">{v.education}</p>
                   </td>
                   <td className="px-8 py-5 text-xs font-bold text-slate-500">{v.phone}</td>
                   <td className="px-8 py-5 text-right">
                      {v.rif ? (
                        <div className="inline-flex items-center justify-center h-8 w-8 rounded-xl bg-emerald-50 text-emerald-500 border border-emerald-100">
                           <CheckCircle2 className="h-4 w-4" />
                        </div>
                      ) : (
                        <div className="inline-flex items-center justify-center h-8 w-8 rounded-xl bg-rose-50 text-rose-500 border border-rose-100">
                           <AlertCircle className="h-4 w-4" />
                        </div>
                      )}
                   </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Controles de Paginación */}
        {totalPages > 1 && (
          <div className="p-6 border-t border-gray-100 bg-gray-50/30 flex items-center justify-between">
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
              Página {currentPage} de {totalPages}
            </p>
            <div className="flex items-center gap-2">
              <button
                onClick={() => handlePageChange(currentPage - 1)}
                disabled={currentPage === 1}
                className="p-2 rounded-xl bg-white border border-gray-100 text-slate-400 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 transition-all shadow-sm"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
              
              <div className="flex gap-1">
                {Array.from({ length: totalPages }, (_, i) => i + 1).map((number) => (
                  <button
                    key={number}
                    onClick={() => handlePageChange(number)}
                    className={cn(
                      "h-8 w-8 rounded-xl text-[10px] font-black transition-all",
                      currentPage === number
                        ? "bg-brand-primary text-white shadow-md shadow-brand-primary/20"
                        : "bg-white text-slate-400 border border-gray-100 hover:bg-gray-50"
                    )}
                  >
                    {number}
                  </button>
                ))}
              </div>

              <button
                onClick={() => handlePageChange(currentPage + 1)}
                disabled={currentPage === totalPages}
                className="p-2 rounded-xl bg-white border border-gray-100 text-slate-400 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 transition-all shadow-sm"
              >
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};