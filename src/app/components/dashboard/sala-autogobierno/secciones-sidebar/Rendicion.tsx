"use client";

import React, { useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  X, 
  Upload, 
  DollarSign, 
  Calendar, 
  PieChart, 
  CheckCircle2, 
  AlertCircle, 
  Image as ImageIcon, 
  FileText,
  Briefcase,
  History,
  User,
  CreditCard
} from "lucide-react";
import { cn } from "@/app/lib/utils";

interface Rendicion {
  isOpen: boolean;
  onClose: () => void;
  proyectoName: string;
}

export const Rendicion = ({ isOpen, onClose, proyectoName }: Rendicion) => {
  const [step, setStep] = useState(1);
  const [ingresos, setIngresos] = useState(0);
  const [egresos, setEgresos] = useState(0);
  const [acceptedTerms, setAcceptedTerms] = useState(false);

  // Estados para archivos
  const [files, setFiles] = useState<{ [key: string]: string | null }>({
    "Acta de Asamblea": null,
    "Facturas Legales": null,
    "Informe Contraloría": null,
    "Estado de Cuenta": null,
  });

  // Estado para Voceros Firmantes
  const [voceros, setVoceros] = useState([{ id: 1, nombre: "", cedula: "", fotoCedula: null }]);

  const saldo = ingresos - egresos;

  const handleFileUpload = (label: string, fileName: string) => {
    setFiles(prev => ({ ...prev, [label]: fileName }));
  };

  const addVocero = () => {
    setVoceros([...voceros, { id: Date.now(), nombre: "", cedula: "", fotoCedula: null }]);
  };

  const FileUploader = ({ label }: { label: string }) => {
    const inputRef = useRef<HTMLInputElement>(null);
    const isUploaded = !!files[label];

    return (
      <div 
        onClick={() => inputRef.current?.click()}
        className={cn(
          "flex items-center justify-between p-3 rounded-xl border cursor-pointer transition-all",
          isUploaded ? "bg-emerald-50 border-emerald-100" : "bg-gray-50 border-gray-100 hover:bg-gray-100"
        )}
      >
        <span className={cn(
          "text-[10px] font-black uppercase tracking-tight",
          isUploaded ? "text-emerald-700" : "text-slate-500"
        )}>
          {isUploaded ? files[label] : label}
        </span>
        <input 
          type="file" 
          ref={inputRef} 
          className="hidden" 
          onChange={(e) => e.target.files?.[0] && handleFileUpload(label, e.target.files[0].name)}
        />
        {isUploaded ? (
          <CheckCircle2 className="h-4 w-4 text-emerald-500" />
        ) : (
          <Upload className="h-4 w-4 text-slate-300" />
        )}
      </div>
    );
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-100 flex items-center justify-center p-4">
          <motion.div 
            initial={{ opacity: 0 }} 
            animate={{ opacity: 1 }} 
            exit={{ opacity: 0 }} 
            onClick={onClose} 
            className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" 
          />

          <motion.div 
            initial={{ opacity: 0, scale: 0.95, y: 20 }} 
            animate={{ opacity: 1, scale: 1, y: 0 }} 
            exit={{ opacity: 0, scale: 0.95, y: 20 }} 
            className="relative w-full max-w-5xl bg-white rounded-[2.5rem] shadow-2xl overflow-hidden"
          >
            {/* Header */}
            <div className="p-8 border-b border-gray-50 flex items-center justify-between bg-gray-50/30">
              <div>
                <h4 className="text-xl font-black text-slate-800 italic uppercase tracking-tighter flex items-center gap-2">
                  <PieChart className="h-6 w-6 text-brand-primary" /> Rendición de Cuentas (Art. 31)
                </h4>
                <div className="flex items-center gap-4 mt-1">
                  <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">
                    Proyecto: <span className="text-brand-primary">{proyectoName}</span>
                  </p>
                  <div className="h-3 w-px bg-gray-200" />
                  <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">
                    Consejo: <span className="text-slate-600">Brisas de Carrizal</span>
                  </p>
                </div>
              </div>
              <button onClick={onClose} className="p-2 rounded-xl hover:bg-gray-100 transition-colors">
                <X className="h-5 w-5 text-slate-400" />
              </button>
            </div>

            <div className="flex flex-col lg:flex-row max-h-[75vh] overflow-y-auto">
              {/* Sidebar Checklist */}
              <div className="lg:w-72 bg-gray-50/50 p-8 border-r border-gray-50 space-y-6">
                <div>
                  <h5 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-4">Soportes Obligatorios</h5>
                  <div className="space-y-2">
                    <FileUploader label="Acta de Asamblea" />
                    <FileUploader label="Facturas Legales" />
                    <FileUploader label="Informe Contraloría" />
                    <FileUploader label="Estado de Cuenta" />
                  </div>
                </div>

                <div className="p-4 rounded-2xl bg-brand-primary/5 border border-brand-primary/10">
                  <p className="text-[9px] font-black text-brand-primary uppercase mb-1">Saldo Restante</p>
                  <p className={cn(
                    "text-lg font-black italic",
                    saldo < 0 ? "text-rose-500" : "text-emerald-600"
                  )}>
                    {saldo.toLocaleString('es-VE')} BS
                  </p>
                </div>
              </div>

              {/* Main Form */}
              <form className="flex-1 p-8 space-y-8">
                {/* Section 1: Financial Data */}
                <div className="grid md:grid-cols-2 gap-6">
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Ente Financiador</label>
                    <select className="w-full p-4 rounded-2xl bg-gray-50 ring-1 ring-gray-100 text-sm font-bold outline-none appearance-none cursor-pointer">
                      <option>Seleccionar Ente</option>
                      <option>SAFONACC</option>
                      <option>CFG (Consejo Federal de Gobierno)</option>
                      <option>Alcaldía de Carrizal</option>
                    </select>
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Lapso de la Cuenta</label>
                    <div className="flex items-center gap-2">
                      <input type="date" className="w-full p-3 rounded-xl bg-gray-50 ring-1 ring-gray-100 text-xs font-bold" />
                      <span className="text-slate-300 text-xs">-</span>
                      <input type="date" className="w-full p-3 rounded-xl bg-gray-50 ring-1 ring-gray-100 text-xs font-bold" />
                    </div>
                  </div>
                </div>

                {/* Section 2: Balance Details */}
                <div className="grid md:grid-cols-2 gap-6">
                  <div className="space-y-1 text-emerald-600">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Ingresos + Intereses</label>
                    <div className="relative">
                      <DollarSign className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4" />
                      <input 
                        type="number" 
                        onChange={(e) => setIngresos(Number(e.target.value))}
                        className="w-full p-4 pl-10 rounded-2xl bg-emerald-50/50 ring-1 ring-emerald-100 text-sm font-bold outline-none" 
                        placeholder="0.00"
                      />
                    </div>
                  </div>
                  <div className="space-y-1 text-rose-500">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Egresos (Gastos)</label>
                    <div className="relative">
                      <DollarSign className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4" />
                      <input 
                        type="number" 
                        onChange={(e) => setEgresos(Number(e.target.value))}
                        className="w-full p-4 pl-10 rounded-2xl bg-rose-50/50 ring-1 ring-rose-100 text-sm font-bold outline-none" 
                        placeholder="0.00"
                      />
                    </div>
                  </div>
                </div>

                {/* Section 3: Voceros Firmantes */}
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
                      <User className="h-3 w-3" /> Voceros Firmantes (Responsables)
                    </label>
                    <button 
                      type="button" 
                      onClick={addVocero}
                      className="text-[10px] font-black text-brand-primary uppercase hover:underline"
                    >
                      + Agregar Vocero
                    </button>
                  </div>
                  <div className="space-y-3">
                    {voceros.map((vocero, index) => (
                      <div key={vocero.id} className="grid grid-cols-1 md:grid-cols-3 gap-3 p-4 bg-gray-50 rounded-2xl border border-gray-100">
                        <div className="space-y-1">
                          <input 
                            type="text" 
                            placeholder="Nombre Completo" 
                            className="w-full p-3 rounded-xl bg-white border-none ring-1 ring-gray-100 text-xs font-bold outline-none"
                          />
                        </div>
                        <div className="space-y-1">
                          <input 
                            type="text" 
                            placeholder="Cédula de Identidad" 
                            className="w-full p-3 rounded-xl bg-white border-none ring-1 ring-gray-100 text-xs font-bold outline-none"
                          />
                        </div>
                        <div className="relative">
                          <button 
                            type="button"
                            className="w-full p-3 rounded-xl bg-white border-none ring-1 ring-gray-100 text-[10px] font-black uppercase text-slate-400 flex items-center justify-between"
                          >
                            <span>Foto Cédula</span>
                            <CreditCard className="h-4 w-4 text-brand-primary" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Section 4: Evidence Gallery */}
                <div className="space-y-3">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
                    <ImageIcon className="h-3 w-3" /> Registro Fotográfico (Antes, Durante y Después)
                  </label>
                  <div className="grid grid-cols-3 gap-4">
                    {[1, 2, 3].map((i) => (
                      <div key={i} className="aspect-video rounded-2xl border-2 border-dashed border-gray-100 flex flex-col items-center justify-center hover:bg-gray-50 cursor-pointer transition-colors">
                        <Upload className="h-4 w-4 text-slate-300 mb-1" />
                        <span className="text-[8px] font-black text-slate-400 uppercase">Subir Foto</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Section 5: Narrative */}
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Informe de Gestión (Logros Alcanzados)</label>
                  <textarea 
                    rows={3}
                    placeholder="Describa los resultados físicos de la ejecución..."
                    className="w-full p-4 rounded-2xl bg-gray-50 ring-1 ring-gray-100 text-sm font-bold outline-none focus:ring-2 focus:ring-brand-primary/20 resize-none"
                  />
                </div>

                {/* Section 6: Legal Disclaimer */}
                <div className="p-6 rounded-3xl bg-slate-900 text-white space-y-4">
                  <div className="flex items-start gap-4">
                    <div className="p-2 rounded-lg bg-white/10 text-brand-primary">
                      <AlertCircle className="h-5 w-5" />
                    </div>
                    <div>
                      <p className="text-[10px] font-black uppercase tracking-widest text-brand-primary">Aviso Legal - Art. 32</p>
                      <p className="text-[11px] text-slate-400 mt-1 leading-relaxed">
                        Los voceros y voceras de la Unidad Administrativa y Financiera Comunitaria incurren en 
                        responsabilidad civil, penal y administrativa por el manejo indebido de los recursos. 
                        Al enviar este formulario, certifica que los datos son fidedignos.
                      </p>
                    </div>
                  </div>
                  <label className="flex items-center gap-3 cursor-pointer group">
                    <input 
                      type="checkbox" 
                      checked={acceptedTerms}
                      onChange={(e) => setAcceptedTerms(e.target.checked)}
                      className="w-5 h-5 rounded-lg border-none bg-white/10 checked:bg-brand-primary transition-all cursor-pointer" 
                    />
                    <span className="text-[10px] font-black uppercase tracking-widest group-hover:text-brand-primary transition-colors">
                      Certifico la veracidad de los soportes presentados
                    </span>
                  </label>
                </div>

                {/* Actions */}
                <button 
                  type="submit" 
                  disabled={!acceptedTerms}
                  className={cn(
                    "w-full py-5 rounded-2xl text-xs font-black uppercase tracking-widest shadow-xl transition-all",
                    acceptedTerms 
                      ? "bg-brand-primary text-white shadow-brand-primary/20 hover:scale-[1.02] active:scale-95" 
                      : "bg-gray-100 text-slate-400 cursor-not-allowed"
                  )}
                >
                  Confirmar y Enviar Rendición de Cuentas
                </button>
              </form>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};