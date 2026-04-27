import React, { useState, useRef } from "react";
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Shield, 
  FileCheck, 
  Activity, 
  Upload, 
  PlusCircle,
  FileText,
  Building2,
  X,
  CheckCircle2
} from "lucide-react";

export const DatosLegalesView = () => {
  const [isRegistered, setIsRegistered] = useState(false);
  const [showModal, setShowModal] = useState(false);
  
  // Referencias para los inputs de archivo
  const fileInputRif = useRef(null);
  const fileInputActa = useRef(null);

  // Estados para nombres de archivos
  const [rifFile, setRifFile] = useState(null);
  const [actaFile, setActaFile] = useState(null);
  
  const [comunas] = useState([
    "Guaicaipuro el Grande",
    "Comuna Panamericana",
    "Cacique Carrizal",
    "Guerreros del Futuro",
    "Fuerza Mirandina"
  ]);

  const account = "01020000123456789012";
  const maskedAccount = `**** **** **** ${account.slice(-4)}`;

  const handleRegister = (e) => {
    e.preventDefault();
    setIsRegistered(true);
    setShowModal(false);
  };

  // Funciones para activar los inputs ocultos
  const triggerRifUpload = () => fileInputRif.current.click();
  const triggerActaUpload = () => fileInputActa.current.click();

  return (
    <div className="space-y-8">
      {/* Encabezado con Título y Acción */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-8 rounded-[2.5rem] border border-gray-100 shadow-sm">
        <div>
          <h2 className="text-xl font-black text-slate-800 italic uppercase tracking-tighter flex items-center gap-3">
            <Shield className="h-6 w-6 text-brand-primary" /> Datos de identificación legal
          </h2>
          <p className="text-[10px] text-slate-400 font-bold uppercase tracking-[0.2em] mt-1">
            Gestión de documentación y registros oficiales
          </p>
        </div>
        <button 
          onClick={() => setShowModal(true)}
          className={`flex items-center gap-2 px-6 py-3 rounded-2xl text-xs font-black italic uppercase tracking-widest transition-all ${
            isRegistered 
            ? "text-slate-400 border border-gray-100 hover:bg-gray-50" 
            : "bg-brand-primary text-white shadow-lg shadow-brand-primary/20 hover:scale-105 active:scale-95"
          }`}
        >
          {isRegistered ? (
            <>Actualizar Información</>
          ) : (
            <>
              <PlusCircle className="h-4 w-4" /> Registrar Información
            </>
          )}
        </button>
      </div>

      {/* Información del Consejo */}
      <div className="bg-white p-8 rounded-[2.5rem] border border-gray-100 shadow-sm relative overflow-hidden">
        <div className="relative z-10">
          <div className="space-y-8">
            <h3 className="text-lg font-black text-slate-800 italic uppercase tracking-tighter flex items-center gap-3">
              <Building2 className="h-5 w-5 text-brand-primary" /> Identificación Institucional
            </h3>
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
              <div>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Nombre del Consejo</p>
                <p className="text-sm font-black text-slate-800 uppercase italic">Brisas de Carrizal</p>
              </div>
              <div>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Comuna</p>
                <p className="text-sm font-black text-slate-800 uppercase italic">Comuna Panamericana</p>
              </div>
              <div>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Sector</p>
                <p className="text-sm font-black text-slate-800 uppercase italic">Sector 4</p>
              </div>
              <div>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Código SITUR</p>
                <p className="text-sm font-black text-slate-800 uppercase italic">2024-VZ-001</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Grid de Documentos y Banco */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {[
          {
            title: "RIF Comunal",
            desc: "Registro de Información Fiscal + PDF",
            icon: FileCheck,
            status: "VIGENTE",
            date: "J-500000000",
          },
          {
            title: "Acta Constitutiva",
            desc: "Documento Legal (PDF)",
            icon: FileText,
            status: "VALIDADA",
            date: "Registrada: 2024",
          },
          {
            title: "Banco y Cuenta",
            desc: "Banco Bicentenario",
            icon: Activity,
            status: "ACTIVA",
            date: maskedAccount,
          },
        ].map((doc, i) => (
          <div
            key={i}
            className="bg-white p-8 rounded-[2.5rem] border border-gray-100 shadow-sm hover:shadow-md transition-all group"
          >
            <div className="flex justify-between items-start mb-6">
              <div className="h-14 w-14 rounded-2xl bg-brand-primary/10 flex items-center justify-center text-brand-primary group-hover:bg-brand-primary group-hover:text-white transition-all transform group-hover:rotate-6">
                <doc.icon className="h-7 w-7" />
              </div>
              <span className="text-[9px] font-black px-2 py-1 bg-emerald-50 text-emerald-600 rounded-lg uppercase tracking-tighter border border-emerald-100">
                {doc.status}
              </span>
            </div>
            <h4 className="text-lg font-black text-slate-800 tracking-tight italic">
              {doc.title}
            </h4>
            <p className="text-xs text-slate-400 font-bold mt-1 uppercase tracking-widest">
              {doc.desc}
            </p>
            <div className="mt-8 pt-6 border-t border-gray-50 flex items-center justify-between">
              <span className="text-[10px] font-bold text-slate-400 uppercase">
                {doc.date}
              </span>
              <button className="p-2 rounded-xl bg-gray-50 text-slate-400 hover:bg-brand-primary/10 hover:text-brand-primary transition-all">
                <Upload className="h-4 w-4" />
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Modal de Registro */}
      <AnimatePresence>
        {showModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowModal(false)}
              className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative w-full max-w-2xl bg-white rounded-[2.5rem] shadow-2xl overflow-hidden border border-gray-100"
            >
              {/* Header de la Modal */}
              <div className="p-8 border-b border-gray-50 flex items-center justify-between">
                <h4 className="text-xl font-black text-slate-800 italic uppercase tracking-tighter">
                  Registrar Datos Legales
                </h4>
                <button
                  onClick={() => setShowModal(false)}
                  className="p-2 rounded-xl hover:bg-gray-100 transition-colors"
                >
                  <X className="h-5 w-5 text-slate-400" />
                </button>
              </div>

              {/* Formulario */}
              <form onSubmit={handleRegister} className="p-8 space-y-5">
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">
                      Nombre del Consejo
                    </label>
                    <input 
                      type="text" 
                      className="w-full p-4 rounded-2xl bg-gray-50 border-none ring-1 ring-gray-100 focus:ring-2 focus:ring-brand-primary/20 outline-none text-sm font-bold" 
                      placeholder="Ej. Brisas de Carrizal" 
                      required 
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">
                      RIF del Consejo
                    </label>
                    <input 
                      type="text" 
                      className="w-full p-4 rounded-2xl bg-gray-50 border-none ring-1 ring-gray-100 focus:ring-2 focus:ring-brand-primary/20 outline-none text-sm font-bold" 
                      placeholder="J-000000000" 
                      required 
                    />
                  </div>
                </div>

                <div className="grid md:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">
                      Código SITUR
                    </label>
                    <input 
                      type="text" 
                      className="w-full p-4 rounded-2xl bg-gray-50 border-none ring-1 ring-gray-100 focus:ring-2 focus:ring-brand-primary/20 outline-none text-sm font-bold" 
                      placeholder="00-00-00-000" 
                      required 
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">
                      Comuna
                    </label>
                    <select 
                      className="w-full p-4 rounded-2xl bg-gray-50 border-none ring-1 ring-gray-100 focus:ring-2 focus:ring-brand-primary/20 outline-none text-sm font-bold appearance-none cursor-pointer" 
                      required
                      defaultValue=""
                    >
                      <option value="" disabled>Seleccione una comuna</option>
                      {comunas.map((comuna, index) => (
                        <option key={index} value={comuna}>
                          {comuna}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="grid md:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">
                      Sector
                    </label>
                    <input 
                      type="text" 
                      className="w-full p-4 rounded-2xl bg-gray-50 border-none ring-1 ring-gray-100 focus:ring-2 focus:ring-brand-primary/20 outline-none text-sm font-bold" 
                      placeholder="Sector específico" 
                      required 
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">
                      Banco y Cuenta
                    </label>
                    <input 
                      type="text" 
                      className="w-full p-4 rounded-2xl bg-gray-50 border-none ring-1 ring-gray-100 focus:ring-2 focus:ring-brand-primary/20 outline-none text-sm font-bold" 
                      placeholder="0102..." 
                      required 
                    />
                  </div>
                </div>

                {/* Zona de Carga de Archivos */}
                <div className="grid md:grid-cols-2 gap-4">
                  {/* Campo RIF */}
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">
                      RIF Digitalizado
                    </label>
                    <input 
                      type="file" 
                      ref={fileInputRif} 
                      className="hidden" 
                      accept=".pdf,.jpg,.jpeg,.png"
                      onChange={(e) => setRifFile(e.target.files[0]?.name)}
                    />
                    <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-2xl ring-1 ring-gray-100">
                      <button
                        type="button"
                        onClick={triggerRifUpload}
                        className={`flex items-center gap-2 text-[10px] font-black uppercase px-4 py-2 rounded-xl shadow-sm border transition-all ${
                          rifFile 
                          ? "bg-emerald-50 text-emerald-600 border-emerald-100" 
                          : "bg-white text-brand-primary border-gray-100 hover:bg-gray-50"
                        }`}
                      >
                        {rifFile ? <CheckCircle2 className="h-3 w-3" /> : <Upload className="h-3 w-3" />} 
                        {rifFile ? "Cargado" : "Subir RIF"}
                      </button>
                      <span className="text-[9px] font-bold text-slate-400 italic truncate max-w-[100px]">
                        {rifFile || "PDF/JPG"}
                      </span>
                    </div>
                  </div>

                  {/* Campo Acta */}
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">
                      Acta Constitutiva
                    </label>
                    <input 
                      type="file" 
                      ref={fileInputActa} 
                      className="hidden" 
                      accept=".pdf"
                      onChange={(e) => setActaFile(e.target.files[0]?.name)}
                    />
                    <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-2xl ring-1 ring-gray-100">
                      <button
                        type="button"
                        onClick={triggerActaUpload}
                        className={`flex items-center gap-2 text-[10px] font-black uppercase px-4 py-2 rounded-xl shadow-sm border transition-all ${
                          actaFile 
                          ? "bg-emerald-50 text-emerald-600 border-emerald-100" 
                          : "bg-white text-brand-primary border-gray-100 hover:bg-gray-50"
                        }`}
                      >
                        {actaFile ? <CheckCircle2 className="h-3 w-3" /> : <Upload className="h-3 w-3" />} 
                        {actaFile ? "Cargado" : "Subir Acta"}
                      </button>
                      <span className="text-[9px] font-bold text-slate-400 italic truncate max-w-[100px]">
                        {actaFile || "PDF"}
                      </span>
                    </div>
                  </div>
                </div>

                <button
                  type="submit"
                  className="w-full py-5 mt-4 rounded-2xl bg-brand-primary text-white text-xs font-black uppercase tracking-widest shadow-xl shadow-brand-primary/20 hover:scale-[1.02] active:scale-95 transition-all"
                >
                  Guardar Información Legal
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};