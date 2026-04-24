import React, { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { 
  Plus, 
  X, 
  Upload, 
  CheckCircle2, 
  AlertCircle, 
  ChevronRight 
} from "lucide-react";
import { cn } from "../../../../lib/utils";

export const VoceriaView = () => {
  const [isRegisterOpen, setIsRegisterOpen] = useState(false);
  const [selectedUnit, setSelectedUnit] = useState<string>("TODAS");

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

  return (
    <div className="space-y-6">
      {/* Filtros por Unidad */}
      <div className="flex flex-wrap gap-2 mb-4">
        <button
          onClick={() => setSelectedUnit("TODAS")}
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
            onClick={() => setSelectedUnit(unit)}
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
              Registro de 50 Líderes Comunitarios
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
              {filteredVoceros.map((v, i) => (
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
      </div>

      <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-8 flex flex-col md:flex-row items-center gap-8">
        <div className="h-32 w-32 shrink-0 rounded-full border-8 border-brand-primary/5 flex items-center justify-center relative">
          <svg className="absolute inset-0 h-full w-full -rotate-90">
            <circle
              cx="64"
              cy="64"
              r="56"
              fill="none"
              stroke="#009b93"
              strokeWidth="8"
              strokeDasharray={2 * Math.PI * 56}
              strokeDashoffset={
                2 * Math.PI * 56 * (1 - filteredVoceros.length / 50)
              }
            />
          </svg>
          <div className="text-center">
            <p className="text-2xl font-black text-slate-800">
              {filteredVoceros.length}
            </p>
            <p className="text-[9px] font-bold text-slate-400 uppercase">
              Visibles
            </p>
          </div>
        </div>
        <div>
          <h4 className="text-lg font-bold text-slate-800 italic">
            Estructura Organizativa Comunal
          </h4>
          <p className="text-sm text-slate-400 mt-1 max-w-lg">
            Listado detallado de los voceros electos de acuerdo a su instancia o
            unidad. La digitalización del RIF de cada vocero es fundamental para
            la validación institucional.
          </p>
          <button className="mt-4 text-[10px] font-black text-brand-primary uppercase tracking-widest flex items-center gap-2 hover:underline opacity-0 pointer-events-none">
            Ver Voceros Pendientes <ChevronRight className="h-3 w-3" />
          </button>
        </div>
      </div>
    </div>
  );
};
