import React, { useState } from "react";
import { 
  Shield, 
  MapPin, 
  FileCheck, 
  Activity, 
  Upload, 
  FileText, 
  Info 
} from "lucide-react";

export const DatosLegalesView = () => {
  const account = "01020000123456789012";
  const maskedAccount = `**** **** **** ${account.slice(-4)}`;
  const [coordinates] = useState({ lat: 10.3456, lng: -66.9876 });

  return (
    <div className="space-y-8">
      {/* Información del Consejo */}
      <div className="bg-white p-8 rounded-[2.5rem] border border-gray-100 shadow-sm relative overflow-hidden">
        <div className="relative z-10 grid lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-8">
            <h3 className="text-xl font-black text-slate-800 italic uppercase tracking-tighter flex items-center gap-3">
              <Shield className="h-6 w-6 text-brand-primary" /> Identificación Institucional
            </h3>
            <div className="grid gap-6 md:grid-cols-2">
              <div>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Nombre del Consejo</p>
                <p className="text-sm font-black text-slate-800 uppercase italic">Brisas de Carrizal</p>
              </div>
              <div>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Comuna Perteneciente</p>
                <p className="text-sm font-black text-slate-800 uppercase italic">Comuna Panamericana</p>
              </div>
              <div>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Comuna Brisas</p>
                <p className="text-sm font-black text-slate-800 uppercase italic">Sector 4</p>
              </div>
              <div>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Código RIT</p>
                <p className="text-sm font-black text-slate-800 uppercase italic">2024-VZ-001</p>
              </div>
            </div>

            <div className="pt-6 border-t border-gray-50">
              <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4">Linderos y Límites Registrados</h4>
              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 rounded-xl bg-gray-50 border border-gray-100">
                  <p className="text-[8px] font-bold text-slate-400 uppercase">Norte</p>
                  <p className="text-xs font-black text-slate-700 uppercase">Quebrada Carrizal</p>
                </div>
                <div className="p-4 rounded-xl bg-gray-50 border border-gray-100">
                  <p className="text-[8px] font-bold text-slate-400 uppercase">Sur</p>
                  <p className="text-xs font-black text-slate-700 uppercase">Sector Los Pozos</p>
                </div>
                <div className="p-4 rounded-xl bg-gray-50 border border-gray-100">
                  <p className="text-[8px] font-bold text-slate-400 uppercase">Este</p>
                  <p className="text-xs font-black text-slate-700 uppercase">Av. Principal Carrizal</p>
                </div>
                <div className="p-4 rounded-xl bg-gray-50 border border-gray-100">
                  <p className="text-[8px] font-bold text-slate-400 uppercase">Oeste</p>
                  <p className="text-xs font-black text-slate-700 uppercase">Límite Combi 2</p>
                </div>
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <div className="aspect-square rounded-[2rem] bg-slate-100 border-4 border-white shadow-xl overflow-hidden relative group">
               <iframe 
                  src={`https://www.google.com/maps/embed?pb=!1m14!1m12!1m3!1d15700!2d${coordinates.lng}!3d${coordinates.lat}!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!5e0!3m2!1ses!2sve!4v1713800000000!5m2!1ses!2sve`} 
                  className="w-full h-full border-0 contrast-125"
                  allowFullScreen
                  loading="lazy"
               />
            </div>
            <div className="p-4 rounded-2xl bg-slate-800 text-white flex items-center gap-4">
              <div className="h-10 w-10 rounded-xl bg-white/10 flex items-center justify-center">
                <MapPin className="h-5 w-5" />
              </div>
              <div>
                <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Coordenadas GPS</p>
                <p className="text-xs font-black tracking-tight">{coordinates.lat}° N, {coordinates.lng}° W</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {[
          {
            title: "RIF Comunal",
            desc: "Registro de Información Fiscal Vigente",
            icon: FileCheck,
            status: "VIGENTE",
            date: "Expira: 12/03/2026",
          },
          {
            title: "Acta Constitutiva",
            desc: "Registro en Sistema Taquilla Única",
            icon: Shield,
            status: "VALIDADA",
            date: "Firmada: 10/01/2024",
          },
          {
            title: "Cuenta Bancaria",
            desc: "Banco Bicentenario / Tesorería",
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

      {/* Voceros Firmantes */}
      <div className="bg-white p-8 rounded-[2.5rem] border border-gray-100 shadow-sm">
        <h3 className="text-xl font-black text-slate-800 italic uppercase tracking-tighter mb-8">
          Voceros Firmantes (Cuentadantes)
        </h3>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {[
            { name: "ANA MARÍA GARCÍA", role: "Unidad Ejecutiva", ci: "V-12.345.678" },
            { name: "LUIS JIMÉNEZ", role: "Contraloría Social", ci: "V-11.222.333" },
            { name: "ELENA RODRÍGUEZ", role: "Unidad Administrativa", ci: "V-14.888.999" },
          ].map((v, i) => (
            <div key={i} className="p-6 rounded-3xl border border-gray-50 bg-gray-50/30 flex items-center gap-4">
              <div className="h-10 w-10 rounded-full bg-brand-primary/20 flex items-center justify-center text-brand-primary font-black text-xs uppercase tracking-tighter italic">
                {v.name.charAt(0)}
              </div>
              <div>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-0.5">{v.role}</p>
                <p className="text-sm font-black text-slate-800">{v.name}</p>
                <p className="text-[9px] font-black text-slate-500 uppercase">C.I: {v.ci}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
