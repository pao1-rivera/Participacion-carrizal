import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../../context/AuthContext";
import {
  Users,
  User as UserIcon,
  Building2,
  MapPin,
  FileText,
  Target,
  MessageSquare,
  ChevronRight,
  ChevronDown,
  TrendingUp,
  AlertCircle,
  CheckCircle2,
  Clock,
  ArrowUpRight,
  FileBarChart,
  Calendar,
  Shield,
  Plus,
  Map as MapIcon,
  Activity,
  Heart,
  Baby,
  Dna,
  Home,
  GraduationCap,
  Sparkles,
  Upload,
  X,
  Eye,
  HeartPulse,
  Construction,
  Megaphone,
  FileSignature,
  LifeBuoy,
  FileCheck,
  Menu,
  Bell,
  Stethoscope,
  Info,
  LogOut,
} from "lucide-react";
import { cn } from "../../../lib/utils";

// Types for Sections and Navigation
type Section =
  | "inicio"
  | "vocerias"
  | "documentacion"
  | "censo"
  | "vulnerabilidad"
  | "ubicacion"
  | "aca"
  | "nudos"
  | "sueños"
  | "proyectos"
  | "asambleas"
  | "soporte";

interface NavItem {
  id: Section;
  label: string;
  icon: any;
  group?: string;
}

export const ConsejoComunalDashboard = ({ user }: { user: any }) => {
  const { logout } = useAuth();
  const navigate = useNavigate();
  const [activeSection, setActiveSection] = useState<Section>("inicio");
  const [activeAction, setActiveAction] = useState<string | null>(null);

  // Simplified navigation helper that can also set an action
  const navigateWithAction = (
    section: Section,
    action: string | null = null,
  ) => {
    setActiveSection(section);
    setActiveAction(action);
  };
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [lastSync, setLastSync] = useState(new Date());

  // Handle responsiveness
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth < 1024) {
        setIsSidebarOpen(false);
      } else {
        setIsSidebarOpen(true);
      }
    };
    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const menuGroups = [
    { label: "", items: [{ id: "inicio", label: "Inicio", icon: Home }] },
    {
      label: "Organización",
      items: [
        { id: "vocerias", label: "Vocerías", icon: Users },
        {
          id: "documentacion",
          label: "Datos de Identificación Legal",
          icon: FileCheck,
        },
      ],
    },
    {
      label: "Territorio y Social",
      items: [
        { id: "censo", label: "Censo Comunal", icon: MapIcon },
        {
          id: "vulnerabilidad",
          label: "Mapa de Vulnerabilidad",
          icon: HeartPulse,
        },
        { id: "ubicacion", label: "Ubicación Geográfica", icon: MapPin },
        { id: "sueños", label: "Mapa de los Sueños", icon: Sparkles },
      ],
    },
    {
      label: "Planificación (7T)",
      items: [
        { id: "aca", label: "Agenda Concreta (ACA)", icon: Target },
        { id: "nudos", label: "Nudos Críticos", icon: AlertCircle },
        { id: "proyectos", label: "Mis Proyectos", icon: Construction },
        { id: "asambleas", label: "Asambleas", icon: Megaphone },
      ],
    },
    {
      label: "Otros",
      items: [{ id: "soporte", label: "Ayuda y Soporte", icon: LifeBuoy }],
    },
  ];

  const Sidebar = () => (
    <aside
      className={cn(
        "fixed inset-y-0 left-0 z-40 bg-white border-r border-gray-100 transition-all duration-300 ease-in-out lg:static lg:block",
        isSidebarOpen ? "w-64" : "w-20",
        isMobileMenuOpen
          ? "translate-x-0"
          : "-translate-x-full lg:translate-x-0",
      )}
    >
      <div className="h-full flex flex-col">
        {/* Sidebar Header */}
        <div className="p-6 flex items-center justify-between border-b border-gray-50">
          <div
            className={cn(
              "flex items-center gap-3 overflow-hidden transition-all",
              !isSidebarOpen && "lg:hidden",
            )}
          >
            <div className="h-8 w-8 rounded-xl bg-brand-primary flex items-center justify-center text-white shrink-0">
              <Building2 className="h-5 w-5" />
            </div>
            <span className="font-bold text-slate-900 truncate">
              Gestion Comunal
            </span>
          </div>
          <button
            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
            className="hidden lg:flex p-1.5 rounded-lg hover:bg-gray-100 text-slate-400"
          >
            <Menu className="h-4 w-4" />
          </button>
        </div>

        {/* Navigation Items */}
        <div className="flex-1 overflow-y-auto py-4 px-3 space-y-6">
          {menuGroups.map((group, gIdx) => (
            <div key={gIdx} className="space-y-1">
              {group.label && isSidebarOpen && (
                <p className="px-3 text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">
                  {group.label}
                </p>
              )}
              {group.items.map((item) => {
                const Icon = item.icon;
                const isActive = activeSection === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => {
                      setActiveSection(item.id as Section);
                      if (window.innerWidth < 1024) setIsMobileMenuOpen(false);
                    }}
                    className={cn(
                      "w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-bold transition-all group",
                      isActive
                        ? "bg-brand-primary/10 text-brand-primary"
                        : "text-slate-500 hover:bg-gray-50 hover:text-slate-800",
                    )}
                  >
                    <Icon
                      className={cn(
                        "h-5 w-5 shrink-0 transition-transform group-hover:scale-110",
                        isActive ? "text-brand-primary" : "text-slate-400",
                      )}
                    />
                    {isSidebarOpen && (
                      <span className="truncate">{item.label}</span>
                    )}
                    {isActive && isSidebarOpen && (
                      <motion.div
                        layoutId="activeNav"
                        className="ml-auto w-1 h-4 rounded-full bg-brand-primary"
                      />
                    )}
                  </button>
                );
              })}
            </div>
          ))}
        </div>

        {/* Sidebar Footer */}
        <div className="p-4 border-t border-gray-50 space-y-2">
          {isSidebarOpen && (
            <div className="space-y-1 mb-4">
              <button
                onClick={() => navigate("/profile")}
                className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-bold text-slate-500 hover:bg-gray-50 hover:text-slate-800 transition-all group"
              >
                <UserIcon className="h-5 w-5 text-slate-400 group-hover:text-brand-primary" />
                <span>Mi Perfil</span>
              </button>
              <button
                onClick={() => {
                  logout();
                  navigate("/login");
                }}
                className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-bold text-rose-500 hover:bg-rose-50 transition-all group"
              >
                <LogOut className="h-5 w-5 text-rose-400 group-hover:text-rose-600" />
                <span>Cerrar Sesión</span>
              </button>
            </div>
          )}

          {isSidebarOpen ? (
            <div className="p-4 rounded-2xl bg-gray-50 border border-gray-100">
              <p className="text-[10px] font-bold text-slate-400 uppercase">
                Última Sincronización
              </p>
              <div className="flex items-center gap-2 mt-1">
                <div className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                <p className="text-[10px] font-bold text-slate-600">
                  {lastSync.toLocaleTimeString([], {
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </p>
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center gap-4">
              <button
                onClick={() => navigate("/profile")}
                className="p-2 rounded-xl text-slate-400 hover:bg-gray-50 hover:text-brand-primary transition-all"
                title="Mi Perfil"
              >
                <UserIcon className="h-5 w-5" />
              </button>
              <button
                onClick={() => {
                  logout();
                  navigate("/login");
                }}
                className="p-2 rounded-xl text-rose-400 hover:bg-rose-50 hover:text-rose-600 transition-all"
                title="Cerrar Sesión"
              >
                <LogOut className="h-5 w-5" />
              </button>
              <div className="h-2 w-2 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.8)]" />
            </div>
          )}
        </div>
      </div>
    </aside>
  );

  return (
    <div className="flex bg-[#fcfdfe] min-h-screen">
      {/* Sidebar Overlay Mobile */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setIsMobileMenuOpen(false)}
            className="fixed inset-0 z-30 bg-slate-900/40 backdrop-blur-sm lg:hidden"
          />
        )}
      </AnimatePresence>

      <Sidebar />

      <main className="flex-1 w-full lg:max-w-[calc(100vw-64px)] overflow-hidden">
        {/* Mobile Header Nav */}
        <div className="lg:hidden p-4 flex items-center justify-between border-b border-gray-100 bg-white sticky top-0 z-20">
          <button
            onClick={() => setIsMobileMenuOpen(true)}
            className="p-2 -ml-2 rounded-xl hover:bg-gray-50"
          >
            <Menu className="h-6 w-6 text-slate-600" />
          </button>
          <h2 className="text-sm font-bold text-slate-900">Consejo Comunal</h2>
          <div className="h-8 w-8 rounded-full bg-brand-primary/10 flex items-center justify-center text-brand-primary">
            <Users className="h-4 w-4" />
          </div>
        </div>

        <div className="p-4 lg:p-10 max-w-7xl mx-auto space-y-8 pb-32">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeSection}
              initial={{ opacity: 0, x: 10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -10 }}
              transition={{ duration: 0.2 }}
            >
              {activeSection === "inicio" && (
                <DashboardOverview
                  user={user}
                  onNavigate={(s, a) => navigateWithAction(s, a || null)}
                />
              )}
              {activeSection === "vocerias" && <VoceriaView />}
              {activeSection === "documentacion" && <DocumentacionView />}
              {activeSection === "censo" && (
                <CensoView
                  initialAction={activeAction}
                  onActionComplete={() => setActiveAction(null)}
                />
              )}
              {activeSection === "vulnerabilidad" && <VulnerabilidadView />}
              {activeSection === "ubicacion" && <UbicacionView />}
              {activeSection === "aca" && <AcaView />}
              {activeSection === "nudos" && <NudosCriticosView />}
              {activeSection === "sueños" && <SuenosView />}
              {activeSection === "proyectos" && <ProyectosView />}
              {activeSection === "asambleas" && (
                <AsambleasView
                  initialAction={activeAction}
                  onActionComplete={() => setActiveAction(null)}
                />
              )}
              {activeSection === "soporte" && <SupportView />}
            </motion.div>
          </AnimatePresence>
        </div>
      </main>
    </div>
  );
};

/* --- DASHBOARD OVERVIEW --- */

const DashboardOverview = ({
  user,
  onNavigate,
}: {
  user: any;
  onNavigate: (s: Section, a?: string) => void;
}) => {
  const [showToast, setShowToast] = useState<{
    message: string;
    type: "success" | "info" | "error";
  } | null>(null);

  useEffect(() => {
    if (showToast) {
      const timer = setTimeout(() => setShowToast(null), 3000);
      return () => clearTimeout(timer);
    }
  }, [showToast]);

  // Mock data for semáforo logic
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
      <AnimatePresence>
        {showToast && (
          <motion.div
            initial={{ opacity: 0, y: 50, x: "-50%" }}
            animate={{ opacity: 1, y: 0, x: "-50%" }}
            exit={{ opacity: 0, y: 20, x: "-50%" }}
            className={cn(
              "fixed bottom-8 left-1/2 z-50 px-6 py-3 rounded-2xl shadow-2xl text-xs font-black uppercase tracking-widest flex items-center gap-3 backdrop-blur-md",
              showToast.type === "success"
                ? "bg-emerald-500/90 text-white"
                : "bg-slate-800/90 text-white",
            )}
          >
            {showToast.type === "success" ? (
              <CheckCircle2 className="h-4 w-4" />
            ) : (
              <Info className="h-4 w-4" />
            )}
            {showToast.message}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Cabecera (Resumen de Estatus) */}
      <div className="bg-white rounded-[2.5rem] p-8 border border-gray-100 shadow-sm overflow-hidden relative group">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <h2 className="text-2xl font-black text-slate-800 tracking-tight italic">
              {user.nombreConsejo || 'Comuna "Venceremos"'}
            </h2>
            <div className="flex flex-wrap items-center gap-3 mt-3">
              <span
                className={cn(
                  "px-4 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border",
                  getStatusColor(),
                )}
              >
                Estatus Legal: {legalStatus}
              </span>
              <div className="flex items-center gap-2 px-4 py-1 rounded-full bg-gray-50 border border-gray-100 text-[10px] font-bold text-slate-500 uppercase">
                RIF: J-40345678-0
              </div>
            </div>
          </div>

          <div className="w-full md:w-64 space-y-2">
            <div className="flex justify-between items-end">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                Carga de Datos
              </span>
              <span className="text-sm font-black text-brand-primary">
                {enrollmentStatus}%
              </span>
            </div>
            <div className="h-2 w-full bg-gray-50 rounded-full overflow-hidden border border-gray-100">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${enrollmentStatus}%` }}
                className="h-full bg-brand-primary rounded-full"
              />
            </div>
            <p className="text-[9px] font-bold text-slate-400 text-right uppercase">
              Información ACA / Censo
            </p>
          </div>
        </div>
        {/* Background pattern */}
        <div className="absolute top-0 right-0 p-10 opacity-5 pointer-events-none group-hover:scale-110 transition-transform duration-1000">
          <Shield className="h-32 w-32" />
        </div>
      </div>

      {/* Tarjetas de Indicadores (Widgets) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {[
          {
            label: "Población Total",
            value: "1,245",
            icon: Users,
            color: "text-blue-600 bg-blue-50",
            sub: "Habitantes censados",
            id: "censo" as Section,
          },
          {
            label: "Casos de Salud",
            value: "14",
            icon: Stethoscope,
            color: "text-rose-600 bg-rose-50",
            sub: "Adultos mayores / Críticos",
            id: "vulnerabilidad" as Section,
          },
          {
            label: "Nudos Críticos",
            value: "08",
            icon: AlertCircle,
            color: "text-amber-600 bg-amber-50",
            sub: "Bajo plan 7-T",
            id: "nudos" as Section,
          },
          {
            label: "Proyectos Activos",
            value: "03",
            icon: Construction,
            color: "text-emerald-600 bg-emerald-50",
            sub: "Obras en ejecución",
            id: "proyectos" as Section,
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

      {/* Sección Central: Flujo de Información Reciente */}
      <div className="grid lg:grid-cols-3 gap-6">
        {/* Timeline de Trámites */}
        <div className="lg:col-span-2 bg-white rounded-3xl border border-gray-100 shadow-sm p-8">
          <div className="flex items-center justify-between mb-8">
            <h3 className="text-sm font-bold text-slate-800 uppercase tracking-widest italic flex items-center gap-2">
              <Clock className="h-4 w-4 text-brand-primary" /> Estatus de
              Trámites
            </h3>
            <button
              onClick={() =>
                setShowToast({
                  message: "Historial de trámites cargado correctamente",
                  type: "info",
                })
              }
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

        {/* Alertas y Notificaciones */}
        <div className="space-y-6">
          <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-8 flex flex-col justify-between">
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

          <div className="bg-brand-secondary p-8 rounded-3xl text-white relative overflow-hidden group">
            <div className="relative z-10">
              <div className="flex items-center gap-3 mb-6">
                <Bell className="h-5 w-5 text-cyan-400" />
                <h3 className="text-xs font-bold uppercase tracking-[0.2em]">
                  Notificaciones Directas
                </h3>
              </div>
              <div className="space-y-4">
                <p className="text-[10px] font-medium text-cyan-100/60 leading-relaxed italic border-l-2 border-cyan-400/30 pl-4">
                  "Recuerde cargar las fotos del avance del proyecto de
                  luminarias antes del viernes." —{" "}
                  <span className="text-white font-bold">
                    Secretario de Comunas
                  </span>
                </p>
              </div>
            </div>
            <div className="absolute -right-10 -bottom-10 h-32 w-32 bg-brand-primary rounded-full blur-3xl opacity-20" />
          </div>
        </div>
      </div>

      {/* D. Acceso Rápido (Botones de Acción) */}
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
          onClick={() =>
            setShowToast({
              message: "Emergencia reportada a la Dirección de Comunas",
              type: "success",
            })
          }
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

/* --- ORGANIZACIÓN VIEWS --- */

const VoceriaView = () => {
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

const DocumentacionView = () => (
  <div className="space-y-6">
    <div className="flex items-center gap-4 mb-6">
      <div className="h-12 w-12 rounded-2xl bg-brand-primary/10 flex items-center justify-center text-brand-primary">
        <FileCheck className="h-6 w-6" />
      </div>
      <h3 className="text-xl font-black text-slate-800 italic uppercase tracking-tighter">
        Datos de Identificación Legal
      </h3>
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
          date: "Últ. Mov: Hace 4h",
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
  </div>
);

/* --- TERRITORIO VIEWS --- */

const CensoView = ({
  initialAction,
  onActionComplete,
}: {
  initialAction?: string | null;
  onActionComplete: () => void;
}) => {
  const [isRegisterOpen, setIsRegisterOpen] = useState(
    initialAction === "register",
  );

  const closeRegister = () => {
    setIsRegisterOpen(false);
    onActionComplete();
  };

  return (
    <div className="space-y-6">
      {/* Resumen de Caracterización */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm">
          <div className="flex items-center gap-3 mb-2">
            <Users className="h-4 w-4 text-blue-500" />
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
              Niños y Jóvenes
            </p>
          </div>
          <p className="text-2xl font-black text-slate-800">124</p>
          <p className="text-[9px] text-slate-400 font-medium">
            35% de la población
          </p>
        </div>
        <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm">
          <div className="flex items-center gap-3 mb-2">
            <Heart className="h-4 w-4 text-rose-500" />
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
              Adultos Mayores
            </p>
          </div>
          <p className="text-2xl font-black text-slate-800">45</p>
          <p className="text-[9px] text-slate-400 font-medium">
            Atención priorizada
          </p>
        </div>
        <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm">
          <div className="flex items-center gap-3 mb-2">
            <Baby className="h-4 w-4 text-emerald-500" />
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
              Nacimientos 2024
            </p>
          </div>
          <p className="text-2xl font-black text-slate-800">12</p>
          <p className="text-[9px] text-slate-400 font-medium">
            Nuevos habitantes
          </p>
        </div>
      </div>

      <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="p-8 border-b border-gray-100 flex items-center justify-between bg-gray-50/30">
          <div>
            <h3 className="text-xl font-black text-slate-800 italic">
              Censo Poblacional Actualizado
            </h3>
            <p className="text-[10px] text-slate-400 font-bold uppercase mt-1">
              Gestión de 342 Familias del Territorio
            </p>
          </div>
          <button
            onClick={() => setIsRegisterOpen(true)}
            className="flex items-center gap-2 rounded-2xl bg-brand-primary px-6 py-3 text-xs font-black text-white shadow-lg shadow-brand-primary/20 hover:scale-105 active:scale-95 transition-all uppercase tracking-widest"
          >
            <Plus className="h-4 w-4" /> Registrar Habitante
          </button>
        </div>

        <AnimatePresence>
          {isRegisterOpen && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={closeRegister}
                className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
              />
              <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 20 }}
                className="relative w-full max-w-xl bg-white rounded-[2.5rem] shadow-2xl overflow-hidden border border-gray-100"
              >
                <div className="p-8 border-b border-gray-50 flex items-center justify-between">
                  <h4 className="text-xl font-black text-slate-800 italic">
                    Nuevo Registro de Habitante
                  </h4>
                  <button
                    onClick={closeRegister}
                    className="p-2 rounded-xl hover:bg-gray-100"
                  >
                    <X className="h-5 w-5 text-slate-400" />
                  </button>
                </div>
                <form className="p-8 space-y-6">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                        Nombres
                      </label>
                      <input
                        type="text"
                        className="w-full p-4 rounded-2xl bg-gray-50 border-none ring-1 ring-gray-100 focus:ring-2 focus:ring-brand-primary/20 outline-none text-sm font-bold"
                        placeholder="Nombres"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                        Apellidos
                      </label>
                      <input
                        type="text"
                        className="w-full p-4 rounded-2xl bg-gray-50 border-none ring-1 ring-gray-100 focus:ring-2 focus:ring-brand-primary/20 outline-none text-sm font-bold"
                        placeholder="Apellidos"
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                        Cédula de Identidad
                      </label>
                      <input
                        type="text"
                        className="w-full p-4 rounded-2xl bg-gray-50 border-none ring-1 ring-gray-100 focus:ring-2 focus:ring-brand-primary/20 outline-none text-sm font-bold"
                        placeholder="V-00000000"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                        Fecha Nacimiento
                      </label>
                      <input
                        type="date"
                        className="w-full p-4 rounded-2xl bg-gray-50 border-none ring-1 ring-gray-100 focus:ring-2 focus:ring-brand-primary/20 outline-none text-sm font-bold"
                      />
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                      Calle o Vereda
                    </label>
                    <input
                      type="text"
                      className="w-full p-4 rounded-2xl bg-gray-50 border-none ring-1 ring-gray-100 focus:ring-2 focus:ring-brand-primary/20 outline-none text-sm font-bold"
                      placeholder="Indique dirección exacta"
                    />
                  </div>
                  <button className="w-full py-5 rounded-2xl bg-brand-primary text-white text-xs font-black uppercase tracking-widest shadow-xl shadow-brand-primary/20 hover:scale-[1.02] transition-all">
                    Guardar Registro de Censo
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
                <th className="px-8 py-5">Jefe de Familia</th>
                <th className="px-8 py-5">Vivienda / Calle</th>
                <th className="px-8 py-5">Integrantes</th>
                <th className="px-8 py-5">Categoría</th>
                <th className="px-8 py-5 text-right">Ficha</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {[
                {
                  name: "María Rodríguez",
                  ci: "V-11.234.567",
                  street: "Calle Los Próceres #12",
                  count: 4,
                  type: "FAMILIA",
                },
                {
                  name: "Pedro Pérez",
                  ci: "V-14.567.890",
                  street: "Vereda 3, Casa 44",
                  count: 2,
                  type: "PAREJA",
                },
                {
                  name: "Carmen Rojas",
                  ci: "V-12.345.678",
                  street: "Av. Principal #08",
                  count: 1,
                  type: "SOLTERO",
                },
              ].map((h, i) => (
                <tr key={i} className="hover:bg-gray-50/80 transition-colors">
                  <td className="px-8 py-5">
                    <p className="text-sm font-black text-slate-800">
                      {h.name}
                    </p>
                    <p className="text-[10px] text-slate-400 font-bold">
                      C.I.: {h.ci}
                    </p>
                  </td>
                  <td className="px-8 py-5 text-xs font-bold text-slate-600 italic">
                    "{h.street}"
                  </td>
                  <td className="px-8 py-5">
                    <span className="text-xs font-black text-brand-primary bg-brand-primary/5 px-2 py-1 rounded-lg">
                      {h.count} Habitantes
                    </span>
                  </td>
                  <td className="px-8 py-5 italic text-[10px] font-black text-slate-400 uppercase">
                    {h.type}
                  </td>
                  <td className="px-8 py-5 text-right">
                    <button className="text-[10px] font-black text-brand-primary uppercase underline italic">
                      Detalles
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

const VulnerabilidadView = () => (
  <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
    <div className="bg-white p-8 rounded-[2.5rem] border border-rose-100 shadow-sm relative overflow-hidden group">
      <div className="relative z-10">
        <div className="h-14 w-14 rounded-2xl bg-rose-50 flex items-center justify-center text-rose-500 mb-6 group-hover:scale-110 transition-transform">
          <Stethoscope className="h-7 w-7" />
        </div>
        <p className="text-4xl font-black text-slate-900 tracking-tighter">
          14
        </p>
        <h4 className="text-sm font-bold text-slate-800 mt-1 uppercase italic">
          Casos de Salud
        </h4>
        <p className="text-[10px] text-slate-400 font-medium mt-1 uppercase tracking-widest leading-relaxed">
          Requieren insumos o atención domiciliaria urgente.
        </p>
        <button className="mt-8 flex items-center gap-2 text-[10px] font-black text-rose-500 uppercase tracking-widest hover:underline">
          Ver Reporte Médico <ChevronRight className="h-3 w-3" />
        </button>
      </div>
      <div className="absolute -right-5 -top-5 opacity-[0.03] group-hover:scale-110 transition-transform">
        <HeartPulse className="h-40 w-40" />
      </div>
    </div>

    <div className="bg-white p-8 rounded-[2.5rem] border border-amber-100 shadow-sm relative overflow-hidden group">
      <div className="relative z-10">
        <div className="h-14 w-14 rounded-2xl bg-amber-50 flex items-center justify-center text-amber-500 mb-6 group-hover:scale-110 transition-transform">
          <Baby className="h-7 w-7" />
        </div>
        <p className="text-4xl font-black text-slate-900 tracking-tighter">
          18
        </p>
        <h4 className="text-sm font-bold text-slate-800 mt-1 uppercase italic">
          Adultos Mayores
        </h4>
        <p className="text-[10px] text-slate-400 font-medium mt-1 uppercase tracking-widest leading-relaxed">
          Población mayor a 65 años censada en el territorio.
        </p>
        <button className="mt-8 flex items-center gap-2 text-[10px] font-black text-amber-500 uppercase tracking-widest hover:underline">
          Ver Plan de Atención <ChevronRight className="h-3 w-3" />
        </button>
      </div>
      <div className="absolute -right-5 -top-5 opacity-[0.03] group-hover:scale-110 transition-transform">
        <Users className="h-40 w-40" />
      </div>
    </div>

    <div className="bg-white p-8 rounded-[2.5rem] border border-blue-100 shadow-sm relative overflow-hidden group">
      <div className="relative z-10">
        <div className="h-14 w-14 rounded-2xl bg-blue-50 flex items-center justify-center text-blue-500 mb-6 group-hover:scale-110 transition-transform">
          <Activity className="h-7 w-7" />
        </div>
        <p className="text-4xl font-black text-slate-900 tracking-tighter">
          06
        </p>
        <h4 className="text-sm font-bold text-slate-800 mt-1 uppercase italic">
          Discapacidad
        </h4>
        <p className="text-[10px] text-slate-400 font-medium mt-1 uppercase tracking-widest leading-relaxed">
          Casos registrados con carnet de CONAPDIS.
        </p>
        <button className="mt-8 flex items-center gap-2 text-[10px] font-black text-blue-500 uppercase tracking-widest hover:underline">
          Ver Detalle Social <ChevronRight className="h-3 w-3" />
        </button>
      </div>
      <div className="absolute -right-5 -top-5 opacity-[0.03] group-hover:scale-110 transition-transform">
        <Heart className="h-40 w-40" />
      </div>
    </div>
  </div>
);

/* --- PLANIFICACIÓN & PROYECTOS VIEWS --- */

const AcaView = () => {
  const [view, setView] = useState<"list" | "calendar">("list");

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden p-8">
        <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
          <div>
            <h3 className="text-xl font-black text-slate-800 tracking-tight italic">
              Agenda Concreta de Acción (ACA)
            </h3>
            <p className="text-[10px] text-slate-400 font-bold uppercase mt-1">
              Planificación y seguimiento de nudos territoriales
            </p>
          </div>
          <div className="flex items-center gap-3 p-1 bg-gray-50 rounded-xl border border-gray-100">
            <button
              onClick={() => setView("list")}
              className={cn(
                "px-4 py-2 text-[10px] font-bold uppercase rounded-lg transition-all",
                view === "list"
                  ? "bg-white text-brand-primary shadow-sm"
                  : "text-slate-400",
              )}
            >
              Lista
            </button>
            <button
              onClick={() => setView("calendar")}
              className={cn(
                "px-4 py-2 text-[10px] font-bold uppercase rounded-lg transition-all",
                view === "calendar"
                  ? "bg-white text-brand-primary shadow-sm"
                  : "text-slate-400",
              )}
            >
              Calendario
            </button>
          </div>
        </div>

        {view === "list" ? (
          <div className="grid gap-6">
            {[
              {
                t: "T1: Servicios",
                issue: "Sustitución de Colector de Aguas Servidas",
                priority: "ALTA",
                status: "En Evaluación",
              },
              {
                t: "T3: Infraestructura",
                issue: "Restauración de Muro de Contención Calle B",
                priority: "MEDIA",
                status: "Aprobado ACA",
              },
              {
                t: "T7: Geopolítica",
                issue: "Instalación de Punto de Control Comunal",
                priority: "BAJA",
                status: "En espera",
              },
            ].map((item, i) => (
              <div
                key={i}
                className="flex flex-col md:flex-row md:items-center justify-between gap-6 p-6 rounded-3xl bg-gray-50 border border-gray-100 group hover:border-brand-primary/30 transition-all"
              >
                <div className="flex items-start gap-5">
                  <div className="h-12 w-12 rounded-2xl bg-white border border-gray-200 flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform shadow-sm">
                    <Target className="h-6 w-6 text-brand-primary" />
                  </div>
                  <div>
                    <span className="text-[9px] font-black text-brand-primary uppercase tracking-[0.2em]">
                      {item.t}
                    </span>
                    <h4 className="text-base font-black text-slate-800 tracking-tight mt-1">
                      "{item.issue}"
                    </h4>
                    <p className="text-[10px] text-slate-400 font-bold mt-1 uppercase tracking-widest">
                      Prioridad:{" "}
                      <span
                        className={cn(
                          item.priority === "ALTA"
                            ? "text-rose-500"
                            : "text-slate-500",
                        )}
                      >
                        {item.priority}
                      </span>
                    </p>
                  </div>
                </div>
                <div className="flex items-center justify-between md:justify-end gap-6 border-t md:border-t-0 pt-4 md:pt-0">
                  <div className="text-right">
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                      Estatus Municipal
                    </p>
                    <p className="text-xs font-black text-slate-800 italic">
                      {item.status}
                    </p>
                  </div>
                  <button className="p-2 rounded-xl bg-white border border-gray-100 text-slate-400 hover:text-brand-primary transition-all">
                    <ChevronRight className="h-5 w-5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="bg-gray-50 rounded-3xl p-8 border border-gray-100 min-h-[400px]">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-2">
                <p className="text-sm font-black text-slate-800 italic">
                  Mayo 2024
                </p>
              </div>
              <div className="flex gap-2">
                <button className="p-2 rounded-xl bg-white border border-gray-100 text-slate-400 hover:text-brand-primary">
                  <ChevronRight className="h-4 w-4 rotate-180" />
                </button>
                <button className="p-2 rounded-xl bg-white border border-gray-100 text-slate-400 hover:text-brand-primary">
                  <ChevronRight className="h-4 w-4" />
                </button>
              </div>
            </div>
            <div className="grid grid-cols-7 gap-2">
              {["Lun", "Mar", "Mié", "Jue", "Vie", "Sáb", "Dom"].map((day) => (
                <div
                  key={day}
                  className="text-center py-2 text-[10px] font-black text-slate-400 uppercase"
                >
                  {day}
                </div>
              ))}
              {Array.from({ length: 31 }).map((_, i) => (
                <div
                  key={i}
                  className={cn(
                    "aspect-square rounded-xl border border-gray-100 bg-white p-2 flex flex-col justify-between hover:border-brand-primary/30 transition-all cursor-pointer",
                    i === 13 &&
                      "ring-2 ring-brand-primary ring-inset bg-brand-primary/5",
                  )}
                >
                  <span className="text-[10px] font-black text-slate-800">
                    {i + 1}
                  </span>
                  {i === 13 && (
                    <div className="h-1.5 w-1.5 rounded-full bg-brand-primary self-end" />
                  )}
                  {i === 20 && (
                    <div className="h-1.5 w-1.5 rounded-full bg-rose-500 self-end" />
                  )}
                </div>
              ))}
            </div>
            <div className="mt-6 flex items-center gap-6">
              <div className="flex items-center gap-2">
                <div className="h-2 w-2 rounded-full bg-brand-primary" />
                <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">
                  Asamblea
                </p>
              </div>
              <div className="flex items-center gap-2">
                <div className="h-2 w-2 rounded-full bg-rose-500" />
                <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">
                  Censo Calle
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

const SuenosView = () => (
  <div className="bg-brand-secondary rounded-[3rem] p-12 text-white relative overflow-hidden group shadow-2xl">
    <div className="relative z-10 max-w-2xl">
      <Sparkles className="h-12 w-12 text-cyan-400 mb-6 animate-pulse" />
      <h3 className="text-4xl font-black italic tracking-tighter uppercase leading-none">
        Mapa de los Sueños
      </h3>
      <p className="text-cyan-100/70 text-lg mt-6 font-medium leading-relaxed">
        Proyecte el desarrollo de su comunidad y envíe su visión estratégica
        directamente al despacho de la Alcaldía. Este documento es el insumo
        para el Plan de Desarrollo Municipal 2030.
      </p>
      <div className="flex flex-wrap items-center gap-6 mt-12">
        <button className="bg-brand-primary px-10 py-5 rounded-2xl text-[11px] font-black uppercase tracking-[0.2em] hover:scale-105 active:scale-95 transition-all shadow-2xl shadow-brand-primary/40 group-hover:bg-brand-accent">
          Cargar Visión de Comunidad
        </button>
        <button className="px-10 py-5 rounded-2xl border-2 border-white/10 hover:bg-white/5 transition-all text-[11px] font-black uppercase tracking-[0.2em]">
          Ver Ejemplos de Éxito
        </button>
      </div>
    </div>
    {/* Design elements */}
    <div className="absolute top-0 right-0 p-20 opacity-10 rotate-12 transition-transform duration-1000 group-hover:rotate-45">
      <MapIcon className="h-80 w-80 shadow-2xl" />
    </div>
    <div className="absolute -bottom-20 -left-20 h-64 w-64 bg-brand-primary rounded-full blur-[120px] opacity-20" />
  </div>
);

const ProyectosView = () => (
  <div className="space-y-8">
    <div className="flex items-center justify-between">
      <div>
        <h3 className="text-2xl font-black text-slate-800 italic">
          Mis Proyectos de Obra
        </h3>
        <p className="text-xs text-slate-400 font-bold uppercase tracking-widest mt-1">
          Gestión administrativa de recursos asignados
        </p>
      </div>
      <button className="flex items-center gap-2 rounded-2xl bg-brand-primary px-8 py-4 text-xs font-black text-white shadow-xl shadow-brand-primary/30 hover:scale-105 active:scale-95 transition-all uppercase tracking-widest">
        <Plus className="h-5 w-5" /> Nuevo Proyecto
      </button>
    </div>

    <div className="grid gap-8">
      {[
        {
          id: "PRY-00241",
          name: "Alumbrado Público Vereda 2",
          budget: "$1,200",
          progress: 45,
          status: "En Ejecución",
          date: "Iniciado: 12/03/24",
        },
        {
          id: "PRY-00242",
          name: "Recuperación de Cancha Múltiple",
          budget: "$3,500",
          progress: 0,
          status: "Por Iniciar",
          date: "Aprobado: 01/04/24",
        },
      ].map((p, i) => (
        <div
          key={i}
          className="bg-white rounded-[2.5rem] border border-gray-100 shadow-sm overflow-hidden group hover:shadow-xl transition-all"
        >
          <div className="p-8 lg:p-10 flex flex-col lg:flex-row gap-10">
            <div className="lg:w-48 h-32 rounded-3xl bg-slate-100 flex items-center justify-center shrink-0 overflow-hidden relative border border-gray-100">
              <Construction className="h-10 w-10 text-slate-300 group-hover:scale-125 transition-transform duration-700" />
              <div className="absolute top-2 right-2 px-3 py-1 rounded-lg bg-black/40 backdrop-blur-md text-[8px] font-bold text-white uppercase">
                Sin Fotos
              </div>
            </div>
            <div className="flex-1 space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-black text-brand-primary uppercase tracking-[0.2em]">
                  {p.id}
                </span>
                <span
                  className={cn(
                    "text-[9px] font-black px-3 py-1 rounded-full uppercase tracking-tighter border",
                    p.status === "En Ejecución"
                      ? "bg-brand-primary/10 text-brand-primary border-brand-primary/20"
                      : "bg-slate-50 text-slate-400",
                  )}
                >
                  {p.status}
                </span>
              </div>
              <h4 className="text-xl font-black text-slate-800 tracking-tight italic">
                "{p.name}"
              </h4>
              <div className="flex items-center gap-10 mt-4">
                <div>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                    Presupuesto
                  </p>
                  <p className="text-lg font-black text-slate-800">
                    {p.budget}
                  </p>
                </div>
                <div className="flex-1">
                  <div className="flex justify-between items-end mb-2">
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                      Avance de Obra
                    </p>
                    <p className="text-sm font-black text-brand-primary">
                      {p.progress}%
                    </p>
                  </div>
                  <div className="h-2 w-full bg-gray-50 rounded-full overflow-hidden border border-gray-100">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${p.progress}%` }}
                      className="h-full bg-brand-primary"
                    />
                  </div>
                </div>
              </div>
            </div>
            <div className="lg:w-48 flex flex-col justify-between border-t lg:border-t-0 lg:border-l border-gray-100 pt-6 lg:pt-0 lg:pl-10">
              <div>
                <p className="text-[10px] font-bold text-slate-400 uppercase">
                  {p.date}
                </p>
                <button className="mt-4 flex items-center justify-between w-full p-4 rounded-xl bg-slate-50 text-slate-500 hover:bg-brand-primary/5 hover:text-brand-primary transition-all">
                  <span className="text-[10px] font-black uppercase">
                    Cargar Fotos
                  </span>
                  <Upload className="h-4 w-4" />
                </button>
              </div>
              <button className="text-[10px] font-black text-brand-primary uppercase underline italic text-right mt-4 lg:mt-0">
                Editar Proyecto
              </button>
            </div>
          </div>
        </div>
      ))}
    </div>
  </div>
);

const AsambleasView = ({
  initialAction,
  onActionComplete,
}: {
  initialAction?: string | null;
  onActionComplete: () => void;
}) => {
  const [isModalOpen, setIsModalOpen] = useState(
    initialAction === "nova_asamblea",
  );

  const closeModal = () => {
    setIsModalOpen(false);
    onActionComplete();
  };

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="p-8 border-b border-gray-100 flex items-center justify-between bg-gray-50/30">
          <div>
            <h3 className="text-xl font-black text-slate-800 italic">
              Gestión de Asambleas de Ciudadanos
            </h3>
            <p className="text-[10px] text-slate-400 font-bold uppercase mt-1">
              Control de Convocatorias y Listas de Asistencia
            </p>
          </div>
          <button
            onClick={() => setIsModalOpen(true)}
            className="flex items-center gap-2 rounded-2xl bg-brand-primary px-6 py-3 text-xs font-black text-white shadow-lg shadow-brand-primary/20 hover:scale-105 active:scale-95 transition-all uppercase tracking-widest"
          >
            <Plus className="h-4 w-4" /> Nueva Convocatoria
          </button>
        </div>

        <AnimatePresence>
          {isModalOpen && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={closeModal}
                className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
              />
              <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 20 }}
                className="relative w-full max-w-lg bg-white rounded-[2.5rem] shadow-2xl overflow-hidden border border-gray-100"
              >
                <div className="p-8 border-b border-gray-50 flex items-center justify-between">
                  <h4 className="text-xl font-black text-slate-800 italic">
                    Nueva Convocatoria
                  </h4>
                  <button
                    onClick={closeModal}
                    className="p-2 rounded-xl hover:bg-gray-100"
                  >
                    <X className="h-5 w-5 text-slate-400" />
                  </button>
                </div>
                <form className="p-8 space-y-5">
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                      Motivo de Asamblea
                    </label>
                    <input
                      type="text"
                      className="w-full p-4 rounded-2xl bg-gray-50 border-none ring-1 ring-gray-100 outline-none text-sm font-bold"
                      placeholder="Ej: Aprobación de Proyecto ACA"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                        Fecha
                      </label>
                      <input
                        type="date"
                        className="w-full p-4 rounded-2xl bg-gray-50 border-none ring-1 ring-gray-100 outline-none text-sm font-bold"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                        Hora
                      </label>
                      <input
                        type="time"
                        className="w-full p-4 rounded-2xl bg-gray-50 border-none ring-1 ring-gray-100 outline-none text-sm font-bold"
                      />
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                      Lugar / Punto de Encuentro
                    </label>
                    <input
                      type="text"
                      className="w-full p-4 rounded-2xl bg-gray-50 border-none ring-1 ring-gray-100 outline-none text-sm font-bold"
                      placeholder="Especifique lugar"
                    />
                  </div>
                  <button className="w-full py-5 rounded-2xl bg-brand-primary text-white text-xs font-black uppercase tracking-widest shadow-xl shadow-brand-primary/20 hover:scale-[1.02] transition-all">
                    Generar Convocatoria
                  </button>
                </form>
              </motion.div>
            </div>
          )}
        </AnimatePresence>

        <div className="p-8 space-y-4">
          {[
            {
              title: "Asamblea Ordinaria #14",
              date: "14 de Mayo, 2024",
              attn: "45 personas",
              status: "Pendiente Acta",
            },
            {
              title: "Asamblea Extraordinaria (7T)",
              date: "28 de Abril, 2024",
              attn: "112 personas",
              status: "CARGADO",
            },
          ].map((a, i) => (
            <div
              key={i}
              className="flex flex-col md:flex-row md:items-center justify-between gap-6 p-6 rounded-3xl bg-gray-50 border border-gray-100 group hover:border-brand-primary/30 transition-all"
            >
              <div className="flex items-center gap-6">
                <div className="h-12 w-12 rounded-2xl bg-white border border-gray-200 flex items-center justify-center text-slate-400 group-hover:text-brand-primary transition-colors">
                  <Megaphone className="h-6 w-6" />
                </div>
                <div>
                  <h4 className="text-base font-black text-slate-800 tracking-tight">
                    {a.title}
                  </h4>
                  <div className="flex items-center gap-3 mt-1">
                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">
                      {a.date}
                    </p>
                    <span className="h-1 w-1 rounded-full bg-slate-300" />
                    <p className="text-[10px] text-brand-primary font-bold uppercase">
                      {a.attn} asistieron
                    </p>
                  </div>
                </div>
              </div>
              <div className="flex items-center justify-between md:justify-end gap-6 border-t md:border-t-0 pt-4 md:pt-0">
                <span
                  className={cn(
                    "text-[9px] font-black uppercase px-3 py-1 rounded-lg border",
                    a.status === "CARGADO"
                      ? "bg-emerald-50 text-emerald-600 border-emerald-100"
                      : "bg-amber-50 text-amber-600 border-amber-100",
                  )}
                >
                  {a.status}
                </span>
                <button className="flex items-center gap-2 text-[10px] font-black text-brand-primary uppercase border-brand-primary/10 bg-brand-primary/5 px-4 py-2 rounded-xl border hover:bg-brand-primary hover:text-white transition-all shadow-sm">
                  <Upload className="h-4 w-4" /> Cargar Acta
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

const UbicacionView = () => (
  <div className="space-y-6">
    <div className="bg-white rounded-[2.5rem] border border-gray-100 shadow-sm overflow-hidden p-8 lg:p-12 relative">
      <div className="relative z-10 grid lg:grid-cols-2 gap-12 items-center">
        <div>
          <div className="inline-flex items-center gap-2 px-4 py-1 rounded-full bg-brand-primary/10 text-brand-primary text-[10px] font-black uppercase tracking-widest mb-6 border border-brand-primary/20">
            <MapPin className="h-3 w-3" /> Geo-Posicionamiento
          </div>
          <h3 className="text-4xl font-black italic tracking-tighter uppercase leading-none text-slate-800">
            Ubicación Geográfica
          </h3>
          <p className="text-slate-500 font-medium mt-6 leading-relaxed">
            Defina los límites territoriales de su Consejo Comunal. Estos datos
            son fundamentales para la asignación de recursos y el mapeo de
            servicios de la Alcaldía de Carrizal.
          </p>

          <div className="mt-10 space-y-4">
            <div className="flex items-center gap-4 p-4 rounded-2xl bg-gray-50 border border-gray-100">
              <div className="h-10 w-10 rounded-xl bg-white border border-gray-100 flex items-center justify-center text-slate-400">
                <Target className="h-5 w-5" />
              </div>
              <div>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                  Coordenadas Centroides
                </p>
                <p className="text-sm font-black text-slate-800 tracking-tight italic">
                  10.3456° N, 66.9876° W
                </p>
              </div>
            </div>
            <div className="flex items-center gap-4 p-4 rounded-2xl bg-gray-50 border border-gray-100">
              <div className="h-10 w-10 rounded-xl bg-white border border-gray-100 flex items-center justify-center text-slate-400">
                <MapIcon className="h-5 w-5" />
              </div>
              <div>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                  Linderos Registrados
                </p>
                <p className="text-sm font-black text-slate-800 tracking-tight italic">
                  Norte: Quebrada Carrizal, Sur: Sector Los Pozos
                </p>
              </div>
            </div>
          </div>

          <button className="mt-10 bg-brand-primary px-8 py-4 rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] text-white hover:scale-105 active:scale-95 transition-all shadow-xl shadow-brand-primary/20">
            Actualizar Poligonal
          </button>
        </div>

        <div className="aspect-square lg:aspect-auto h-full min-h-[400px] rounded-[2rem] bg-gray-100 border-4 border-white shadow-2xl relative overflow-hidden group">
          <div className="absolute inset-0 bg-slate-200">
            {/* Placeholder for map */}
            <div className="absolute inset-0 opacity-40 mix-blend-overlay bg-[url('https://picsum.photos/seed/map/1000/1000')] bg-cover grayscale" />
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2">
              <div className="relative">
                <div className="h-20 w-20 rounded-full bg-brand-primary/20 animate-ping absolute -inset-5" />
                <div className="h-10 w-10 rounded-full bg-brand-primary flex items-center justify-center text-white shadow-xl shadow-brand-primary/40 relative z-10 border-4 border-white group-hover:scale-125 transition-transform duration-500">
                  <MapPin className="h-5 w-5" />
                </div>
              </div>
            </div>
          </div>
          <div className="absolute bottom-6 right-6 p-4 rounded-2xl bg-white/80 backdrop-blur-md shadow-lg border border-white">
            <div className="flex items-center gap-3">
              <CheckCircle2 className="h-4 w-4 text-emerald-500" />
              <p className="text-[10px] font-black uppercase tracking-widest text-slate-600">
                Punto Validado
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Decorative corner */}
      <div className="absolute -bottom-10 -right-10 opacity-[0.03] scale-150 rotate-12">
        <MapPin className="h-80 w-80" />
      </div>
    </div>
  </div>
);

const NudosCriticosView = () => (
  <div className="space-y-6">
    <div className="bg-rose-50 border border-rose-100 rounded-[2.5rem] p-10 flex flex-col md:flex-row items-center gap-8 shadow-sm">
      <div className="h-20 w-20 rounded-[2rem] bg-rose-500 flex items-center justify-center text-white shadow-xl shadow-rose-500/20 shrink-0">
        <AlertCircle className="h-10 w-10" />
      </div>
      <div className="text-center md:text-left">
        <h3 className="text-2xl font-black text-rose-900 italic uppercase tracking-tighter">
          Gestión de Nudos Críticos
        </h3>
        <p className="text-rose-700/70 font-medium mt-1">
          Identificación y reporte prioritario de obstáculos para el desarrollo
          territorial.
        </p>
      </div>
      <button className="md:ml-auto bg-rose-500 text-white px-8 py-4 rounded-xl text-xs font-black uppercase tracking-widest shadow-lg shadow-rose-500/20 hover:scale-105 active:scale-95 transition-all">
        Reportar Nudo Crítico
      </button>
    </div>

    <div className="grid gap-6">
      {[
        {
          icon: Building2,
          title: "Infraestructura",
          issue: "Fallas constantes en suministro eléctrico",
          impact: "Crítico",
          count: 12,
        },
        {
          icon: Activity,
          title: "Salud",
          issue: "Necesidad de insumos técnicos para ambulatorio local",
          impact: "Urgente",
          count: 8,
        },
        {
          icon: Construction,
          title: "Vialidad",
          issue: "Deterioro de carpeta asfáltica en calle principal",
          impact: "Medio",
          count: 5,
        },
      ].map((node, i) => (
        <div
          key={i}
          className="bg-white p-8 rounded-[2rem] border border-gray-100 shadow-sm flex flex-col md:flex-row md:items-center gap-8 group hover:shadow-md transition-all"
        >
          <div className="h-16 w-16 rounded-2xl bg-gray-50 flex items-center justify-center text-slate-400 group-hover:text-brand-primary group-hover:bg-brand-primary/10 transition-all shrink-0">
            <node.icon className="h-8 w-8" />
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-1">
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                {node.title}
              </p>
              <span
                className={cn(
                  "text-[8px] font-black px-2 py-0.5 rounded-full uppercase tracking-tighter",
                  node.impact === "Crítico"
                    ? "bg-rose-100 text-rose-600"
                    : node.impact === "Urgente"
                      ? "bg-amber-100 text-amber-600"
                      : "bg-slate-100 text-slate-500",
                )}
              >
                Impaco {node.impact}
              </span>
            </div>
            <h4 className="text-lg font-black text-slate-800 tracking-tight italic">
              "{node.issue}"
            </h4>
            <p className="text-[10px] text-brand-primary font-bold mt-2 uppercase tracking-widest">
              {node.count} ciudadanos afectados directamente
            </p>
          </div>
          <div className="flex items-center gap-4 md:border-l border-gray-50 md:pl-8">
            <button className="p-3 rounded-xl bg-gray-50 text-slate-400 hover:text-brand-primary hover:bg-brand-primary/10 transition-all">
              <ChevronRight className="h-5 w-5" />
            </button>
          </div>
        </div>
      ))}
    </div>
  </div>
);

const SupportView = () => (
  <div className="space-y-6">
    <div className="max-w-3xl mx-auto space-y-8">
      <div className="text-center">
        <div className="h-20 w-20 rounded-[2rem] bg-brand-primary/10 flex items-center justify-center text-brand-primary mx-auto mb-6 transform rotate-6">
          <LifeBuoy className="h-10 w-10" />
        </div>
        <h3 className="text-3xl font-black italic tracking-tighter uppercase text-slate-800">
          Ayuda y Soporte Técnico
        </h3>
        <p className="text-slate-500 font-medium mt-1">
          Conexión Directa con la Dirección de Digitalización y Trámites
        </p>
      </div>

      <div className="grid gap-6">
        <div className="bg-white p-8 rounded-[2.5rem] border border-gray-100 shadow-sm flex flex-col items-center text-center">
          <div className="h-12 w-12 rounded-2xl bg-emerald-50 text-emerald-500 flex items-center justify-center mb-6">
            <MessageSquare className="h-6 w-6" />
          </div>
          <h4 className="text-lg font-black text-slate-800 tracking-tight">
            Chat de Soporte Técnico
          </h4>
          <p className="text-xs text-slate-400 font-medium mt-2 max-w-sm">
            Resolución inmediata de dudas sobre la carga de datos, censo o
            gestión de ACA.
          </p>
          <button className="mt-8 w-full max-w-xs py-4 rounded-2xl bg-brand-primary text-white text-xs font-black uppercase tracking-widest hover:scale-105 transition-all shadow-lg shadow-brand-primary/20">
            Iniciar Chat en Vivo
          </button>
        </div>

        <div className="grid sm:grid-cols-2 gap-6">
          <div className="bg-white p-8 rounded-[2.5rem] border border-gray-100 shadow-sm group hover:border-brand-primary/20 transition-all">
            <Info className="h-8 w-8 text-slate-200 mb-6 group-hover:text-brand-primary transition-colors" />
            <h4 className="text-sm font-black text-slate-800 italic uppercase">
              Manual de Usuario
            </h4>
            <p className="text-[10px] text-slate-400 font-medium mt-2">
              Guía paso a paso para voceros administrativos.
            </p>
            <button className="mt-6 text-[10px] font-black text-brand-primary uppercase tracking-widest underline">
              Descargar PDF
            </button>
          </div>
          <div className="bg-white p-8 rounded-[2.5rem] border border-gray-100 shadow-sm group hover:border-brand-primary/20 transition-all">
            <FileText className="h-8 w-8 text-slate-200 mb-6 group-hover:text-brand-primary transition-colors" />
            <h4 className="text-sm font-black text-slate-800 italic uppercase">
              Video Tutoriales
            </h4>
            <p className="text-[10px] text-slate-400 font-medium mt-2">
              Aprenda a cargar su censo poblacional.
            </p>
            <button className="mt-6 text-[10px] font-black text-brand-primary uppercase tracking-widest underline">
              Ver Videos
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
);

const VideoIcon = ({ className }: { className?: string }) => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
  >
    <path d="m22 8-6 4 6 4V8Z" />
    <rect width="14" height="12" x="2" y="6" rx="2" ry="2" />
  </svg>
);

export default ConsejoComunalDashboard;
