import React, { useState } from "react";
import { motion } from 'framer-motion';
import { 
  Users, 
  Shield, 
  Megaphone, 
  AlertCircle, 
  Construction, 
  Clock, 
  FileCheck, 
  Upload, 
  CheckCircle2, 
  Info, 
  Bell, 
  Plus, 
  ChevronRight,
  Calendar
} from "lucide-react";
import { cn } from "@/app/lib/utils";

interface DashboardOverviewProps {
  user: any;
  onNavigate: (s: any, a?: string) => void;
}

export const DashboardOverview = ({
  user,
  onNavigate,
}: DashboardOverviewProps) => {
  const enrollmentStatus = 85;
  const legalStatus: "VIGENTE" | "POR VENCER" | "VENCIDO" = "VIGENTE";

  const getStatusColor = () => {
    if ((legalStatus as string) === "VENCIDO" || enrollmentStatus < 50)
      return "text-rose-500 bg-rose-50 border-rose-100";
    if ((legalStatus as string) === "POR VENCER" || enrollmentStatus < 90)
      return "text-amber-500 bg-amber-50 border-amber-100";
    return "text-emerald-500 bg-emerald-50 border-emerald-100";
  };

  return (
    <div className="space-y-8 relative">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {[
          {
            label: "Población Total",
            value: "1,245",
            icon: Users,
            color: "text-blue-600 bg-blue-50",
            sub: "Habitantes censados",
            id: "censo",
          },
          {
            label: "Asambleas",
            value: "24",
            icon: Megaphone,
            color: "text-brand-primary bg-brand-primary/5",
            sub: "Total realizadas",
            id: "asambleas",
          },
          {
            label: "Nudos Críticos",
            value: "08",
            icon: AlertCircle,
            color: "text-amber-600 bg-amber-50",
            sub: "Bajo plan 7-T",
            id: "nudos",
          },
          {
            label: "Proyectos Activos",
            value: "03",
            icon: Construction,
            color: "text-emerald-600 bg-emerald-50",
            sub: "Obras en ejecución",
            id: "proyectos",
          },
        ].map((w, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
            onClick={() => onNavigate(w.id)}
            className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm hover:shadow-md transition-all group cursor-pointer"
          >
            <div
              className={cn(
                "h-12 w-12 rounded-2xl flex items-center justify-center mb-4 transition-transform group-hover:scale-110",
                w.color,
              )}
            >
              <w.icon className="h-6 w-6" />
            </div>
            <p className="text-3xl font-black text-slate-900 tracking-tighter">
              {w.value}
            </p>
            <h4 className="text-xs font-bold text-slate-800 mt-1 uppercase tracking-tight">
              {w.label}
            </h4>
            <p className="text-[10px] text-slate-400 font-medium mt-1">
              {w.sub}
            </p>
          </motion.div>
        ))}
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white rounded-3xl border border-gray-100 shadow-sm p-8">
          <div className="flex items-center justify-between mb-8">
            <h3 className="text-sm font-bold text-slate-800 uppercase tracking-widest italic flex items-center gap-2">
              <Clock className="h-4 w-4 text-brand-primary" /> Estatus de
              Trámites
            </h3>
            <button
              onClick={() => {}}
              className="text-[10px] font-bold text-brand-primary uppercase underline"
            >
              Ver Historial
            </button>
          </div>

          <div className="relative space-y-8 pl-8">
            <div className="absolute left-3 top-2 bottom-2 w-px bg-gray-100" />
            {[
              {
                title: "Validación de Acta #14",
                user: "Secretario",
                status: "APROBADO",
                time: "Hace 2 horas",
                icon: FileCheck,
              },
              {
                title: "Solicitud de Asfalto (PRY-02)",
                user: "Alcaldía",
                status: "EN DIAGNÓSTICO",
                time: "Hace 1 día",
                icon: Construction,
              },
              {
                title: "Actualización de Censo",
                user: "Vocera Finanzas",
                status: "CARGADO",
                time: "Hace 3 días",
                icon: Upload,
              },
            ].map((item, i) => (
              <div key={i} className="relative">
                <div className="absolute -left-[25px] top-1 h-5 w-5 rounded-full bg-white border-4 border-brand-primary/20 flex items-center justify-center shadow-sm">
                  <div className="h-1.5 w-1.5 rounded-full bg-brand-primary" />
                </div>
                <div className="flex items-center justify-between gap-4 p-4 rounded-2xl bg-gray-50 border border-gray-100 group hover:border-brand-primary/20 transition-all">
                  <div className="flex items-center gap-4">
                    <item.icon className="h-5 w-5 text-slate-400 group-hover:text-brand-primary transition-colors" />
                    <div>
                      <p className="text-xs font-bold text-slate-800">
                        {item.title}
                      </p>
                      <p className="text-[10px] text-slate-400 font-medium">
                        {item.user} — {item.time}
                      </p>
                    </div>
                  </div>
                  <span
                    className={cn(
                      "text-[9px] font-black px-2 py-1 rounded-lg border",
                      item.status === "APROBADO"
                        ? "bg-emerald-50 text-emerald-600 border-emerald-100"
                        : item.status === "EN DIAGNÓSTICO"
                          ? "bg-amber-50 text-amber-600 border-amber-100"
                          : "bg-slate-100 text-slate-600 border-slate-200",
                    )}
                  >
                    {item.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="space-y-6">
          <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-8 flex flex-col justify-between h-full">
            <div>
              <h3 className="text-sm font-bold text-slate-800 uppercase tracking-widest italic mb-6">
                Próximos Vencimientos
              </h3>
              <div className="space-y-4">
                <div className="p-4 rounded-2xl bg-amber-50 border border-amber-100 flex gap-3">
                  <AlertCircle className="h-5 w-5 text-amber-500 shrink-0" />
                  <div>
                    <p className="text-xs font-bold text-amber-900">
                      Vocería Ejecutiva
                    </p>
                    <p className="text-[10px] text-amber-700 font-medium">
                      Vence en 28 días. Requiere convocatoria.
                    </p>
                  </div>
                </div>
                <div className="p-4 rounded-2xl bg-rose-50 border border-rose-100 flex gap-3">
                  <Calendar className="h-5 w-5 text-rose-500 shrink-0" />
                  <div>
                    <p className="text-xs font-bold text-rose-900">
                      Cuenta Bancaria
                    </p>
                    <p className="text-[10px] text-rose-700 font-medium">
                      Firma caduca mañana. Acudir al Bicentenario.
                    </p>
                  </div>
                </div>
              </div>
            </div>
            <button
              onClick={() => onNavigate("aca")}
              className="mt-8 w-full p-4 rounded-2xl border border-gray-100 text-[10px] font-black uppercase text-slate-400 hover:bg-gray-50 flex items-center justify-between group"
            >
              Ver Calendario de Gestión{" "}
              <ChevronRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
            </button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <button
          onClick={() => onNavigate("censo", "register")}
          className="flex items-center gap-4 p-6 rounded-[2rem] bg-white border border-gray-100 shadow-sm hover:border-brand-primary/30 hover:bg-brand-primary/[0.02] transition-all group"
        >
          <div className="h-14 w-14 rounded-2xl bg-brand-primary/10 flex items-center justify-center text-brand-primary group-hover:bg-brand-primary group-hover:text-white transition-all transform group-hover:-rotate-6">
            <Users className="h-7 w-7" />
          </div>
          <div className="text-left">
            <p className="text-[10px] font-black text-brand-primary uppercase tracking-widest">
              Agilizar Censo
            </p>
            <p className="text-lg font-black text-slate-800 tracking-tight">
              Registrar Habitante
            </p>
          </div>
          <Plus className="ml-auto h-6 w-6 text-slate-200 group-hover:text-brand-primary" />
        </button>

        <button
          onClick={() => onNavigate("asambleas", "nova_asamblea")}
          className="flex items-center gap-4 p-6 rounded-[2rem] bg-white border border-gray-100 shadow-sm hover:border-brand-primary/30 hover:bg-brand-primary/[0.02] transition-all group"
        >
          <div className="h-14 w-14 rounded-2xl bg-brand-primary/10 flex items-center justify-center text-brand-primary group-hover:bg-brand-primary group-hover:text-white transition-all transform group-hover:rotate-6">
            <Megaphone className="h-7 w-7" />
          </div>
          <div className="text-left">
            <p className="text-[10px] font-black text-brand-primary uppercase tracking-widest">
              Carga de Actas
            </p>
            <p className="text-lg font-black text-slate-800 tracking-tight">
              Nueva Asamblea
            </p>
          </div>
          <Plus className="ml-auto h-6 w-6 text-slate-200 group-hover:text-brand-primary" />
        </button>

        <button
          onClick={() => {}}
          className="flex items-center gap-4 p-6 rounded-[2rem] bg-rose-500 text-white shadow-xl shadow-rose-500/20 hover:scale-[1.02] active:scale-95 transition-all group"
        >
          <div className="h-14 w-14 rounded-2xl bg-white/20 flex items-center justify-center backdrop-blur-md">
            <AlertCircle className="h-7 w-7 animate-pulse" />
          </div>
          <div className="text-left">
            <p className="text-[10px] font-black text-white/70 uppercase tracking-widest">
              Vía Rápida 7-T
            </p>
            <p className="text-lg font-black text-white tracking-tight">
              Reportar Emergencia
            </p>
          </div>
          <ChevronRight className="ml-auto h-6 w-6 text-white/40" />
        </button>
      </div>
    </div>
  );
};