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
  FileCheck,
  Menu,
  Bell,
  Stethoscope,
  Info,
  LogOut,
  CloudUpload,
  Camera,
} from "lucide-react";
import { cn } from "../../../lib/utils";
import { DashboardNavbar } from "../common/DashboardNavbar";

// Types for Sections and Navigation
type Section =
  | "inicio"
  | "vocerias"
  | "documentacion"
  | "censo"
  | "ubicacion"
  | "aca"
  | "nudos"
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

  // --- Shared State ---
  const [projects, setProjects] = useState<any[]>([
    {
      id: "PRY-2024-001",
      name: "Sustitución de 50m tubería aguas servidas",
      nudo: "T2-AGU-001",
      status: "En Ejecución",
      progress: 65,
      budget: "$2,450",
      date: "2024-05-14",
      t: "T2: Servicios"
    },
    {
      id: "PRY-2024-005",
      name: "Rehabilitación Muro de Contención Sector Alto",
      nudo: "T2-INF-088",
      status: "Aprobado",
      progress: 0,
      budget: "$5,100",
      date: "2024-06-20",
      t: "T3: Infraestructura"
    }
  ]);

  const [events, setEvents] = useState<any[]>([
    {
      id: "evt-1",
      title: "Asamblea: Aprobación ACA",
      date: "2024-05-13",
      type: "asamblea",
      description: "Discusión sobre prioridades 7T y nudos críticos."
    },
    {
      id: "evt-2",
      title: "Censo: Sector Bajo",
      date: "2024-05-20",
      type: "censo",
      description: "Actualización de datos sociodemográficos."
    }
  ]);

  const addProject = (newProject: any) => {
    setProjects(prev => [...prev, newProject]);
    // Automatically schedule in ACA
    setEvents(prev => [...prev, {
      id: `evt-proj-${newProject.id}`,
      title: `INICIO: ${newProject.name}`,
      date: new Date().toISOString().split('T')[0],
      type: "proyecto",
      description: `Registro inicial del proyecto ${newProject.name}`
    }]);
  };

  const updateProjectStatus = (id: string, status: string) => {
    setProjects(prev => prev.map(p => {
      if (p.id === id) {
        if (status === "Culminado") {
          // Schedule culmination event
          setEvents(evs => [...evs, {
            id: `evt-fin-${id}`,
            title: `FIN: ${p.name}`,
            date: new Date().toISOString().split('T')[0],
            type: "proyecto",
            description: `Culminación exitosa del proyecto.`
          }]);
        }
        return { ...p, status };
      }
      return p;
    }));
  };

  const addEvent = (newEvent: any) => {
    setEvents(prev => [...prev, { ...newEvent, id: `evt-${Date.now()}` }]);
  };

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
        { id: "ubicacion", label: "Ubicación y Maqueta Comunal", icon: MapPin },
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
      items: [{ id: "soporte", label: "Ayuda y Soporte", icon: MessageSquare }],
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
        <DashboardNavbar 
          user={user}
          title={activeSection.charAt(0).toUpperCase() + activeSection.slice(1)}
          subtitle={`Vocero: ${user.firstName} | Consejo Comunal`}
          onMobileMenuOpen={() => setIsMobileMenuOpen(true)}
          roleIcon={<Users size={24} />}
        />

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
              {activeSection === "ubicacion" && <UbicacionView />}
              {activeSection === "aca" && (
                <AcaView projects={projects} events={events} onAddEvent={addEvent} />
              )}
              {activeSection === "nudos" && <NudosCriticosView />}
              {activeSection === "proyectos" && (
                <ProyectosView 
                  projects={projects} 
                  onAddProject={addProject} 
                  onUpdateStatus={updateProjectStatus} 
                />
              )}
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
            label: "Asambleas",
            value: "24",
            icon: Megaphone,
            color: "text-brand-primary bg-brand-primary/5",
            sub: "Total realizadas",
            id: "asambleas" as Section,
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

const DocumentacionView = () => {
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

/* --- TERRITORIO VIEWS --- */

const CensoView = ({
  initialAction,
  onActionComplete,
}: {
  initialAction?: string | null;
  onActionComplete: () => void;
}) => {
  const [isImporting, setIsImporting] = useState(false);
  const [showVulnerabilidad, setShowVulnerabilidad] = useState(false);

  return (
    <div className="space-y-8">
      {/* Resumen de Caracterización */}
      <div className="bg-white p-8 rounded-[2.5rem] border border-gray-100 shadow-sm">
         <div className="flex items-center justify-between mb-8">
           <h3 className="text-xl font-black text-slate-800 italic uppercase tracking-tighter">
             Caracterización Poblacional
           </h3>
           <button 
             onClick={() => setShowVulnerabilidad(true)}
             className="flex items-center gap-2 px-6 py-3 rounded-2xl bg-rose-500 text-white text-[10px] font-black uppercase tracking-widest hover:scale-105 transition-all shadow-lg shadow-rose-500/20"
           >
             <MapIcon className="h-4 w-4" /> Mapa de Vulnerabilidad
           </button>
         </div>
         <div className="grid grid-cols-1 sm:grid-cols-4 gap-6">
            <div className="space-y-1">
               <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
                 <Users className="h-3 w-3" /> Total Habitantes
               </p>
               <p className="text-2xl font-black text-slate-800">1,245</p>
            </div>
            <div className="space-y-1 text-blue-600">
               <p className="text-[10px] font-bold opacity-60 uppercase tracking-widest flex items-center gap-2">
                 <Users className="h-3 w-3" /> Niños y Jóvenes
               </p>
               <p className="text-2xl font-black">435</p>
            </div>
            <div className="space-y-1 text-rose-600">
               <p className="text-[10px] font-bold opacity-60 uppercase tracking-widest flex items-center gap-2">
                 <HeartPulse className="h-3 w-3" /> Adultos Mayores
               </p>
               <p className="text-2xl font-black">186</p>
            </div>
            <div className="space-y-1 text-emerald-600">
               <p className="text-[10px] font-bold opacity-60 uppercase tracking-widest flex items-center gap-2">
                 <Activity className="h-3 w-3" /> Casos Salud
               </p>
               <p className="text-2xl font-black">24</p>
            </div>
         </div>
      </div>

      <div className="bg-white rounded-[2.5rem] border border-gray-100 shadow-sm overflow-hidden p-8">
          <div className="flex flex-col items-center justify-center py-12 border-2 border-dashed border-gray-100 rounded-[2rem] bg-gray-50/50 group hover:border-brand-primary/30 transition-all cursor-pointer">
             <div className="h-20 w-20 rounded-full bg-brand-primary/10 flex items-center justify-center text-brand-primary mb-6 group-hover:scale-110 transition-transform">
                <Upload className="h-8 w-8" />
             </div>
             <h4 className="text-lg font-black text-slate-800 tracking-tight italic">Importación Masiva de Datos</h4>
             <p className="text-xs text-slate-400 font-bold mt-2 uppercase tracking-widest max-w-xs text-center">
                Arrastre el archivo Excel o PDF con los datos del censo para la carga automática al sistema
             </p>
             <input type="file" className="hidden" id="census-upload" onChange={() => setIsImporting(true)} />
             <label htmlFor="census-upload" className="mt-8 px-8 py-3 rounded-2xl bg-slate-800 text-white text-[10px] font-black uppercase tracking-widest hover:bg-brand-primary transition-all cursor-pointer">
                Seleccionar Documento
             </label>
          </div>
          {isImporting && (
             <motion.div initial={{opacity:0, y:10}} animate={{opacity:1, y:0}} className="mt-6 p-4 rounded-xl bg-blue-50 border border-blue-100 flex items-center justify-between">
                <div className="flex items-center gap-3">
                   <Clock className="h-5 w-5 text-blue-500 animate-spin" />
                   <p className="text-[10px] font-black font-bold text-blue-700 uppercase italic">Procesando archivo...</p>
                </div>
                <button onClick={() => setIsImporting(false)} className="text-[9px] font-black text-blue-400 uppercase">Cancelar</button>
             </motion.div>
          )}
          <div className="mt-8 pt-8 border-t border-gray-50 grid grid-cols-2 lg:grid-cols-4 gap-6">
             <div className="p-4 rounded-2xl bg-white border border-gray-50 flex items-center gap-3">
                <CheckCircle2 className="h-5 w-5 text-emerald-500" />
                <div>
                   <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Estado de Carga</p>
                   <p className="text-xs font-black text-slate-800 uppercase">Sincronizado</p>
                </div>
             </div>
          </div>
      </div>

      <AnimatePresence>
         {showVulnerabilidad && (
           <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
              <motion.div initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}} onClick={() => setShowVulnerabilidad(false)} className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" />
              <motion.div initial={{opacity:0, scale:0.95, y:20}} animate={{opacity:1, scale:1, y:0}} exit={{opacity:0, scale:0.95, y:20}} className="relative w-full max-w-4xl bg-white rounded-[2.5rem] shadow-2xl overflow-hidden p-10 flex flex-col gap-8">
                 <div className="flex justify-between items-center">
                    <div>
                       <h4 className="text-2xl font-black text-slate-800 italic uppercase">Mapa de Vulnerabilidad</h4>
                       <p className="text-xs text-slate-400 font-bold uppercase tracking-widest mt-1">Identificación de puntos críticos de atención social</p>
                    </div>
                    <button onClick={() => setShowVulnerabilidad(false)} className="p-3 rounded-xl hover:bg-gray-100 transition-colors"><X className="h-6 w-6 text-slate-400" /></button>
                 </div>
                 
                 <div className="aspect-video rounded-[2rem] bg-slate-100 border-4 border-white shadow-inner relative overflow-hidden">
                    <div className="absolute inset-0 bg-[url('https://picsum.photos/seed/vulnerability/1200/800')] bg-cover grayscale opacity-10" />
                    {/* Simulated Heat Map Markers */}
                    <div className="absolute top-1/4 left-1/3 h-12 w-12 rounded-full bg-rose-500/30 animate-pulse border-2 border-rose-500 flex items-center justify-center">
                       <span className="text-[8px] font-black text-rose-600 bg-white px-1.5 py-0.5 rounded shadow-sm">Sector 4: Crítico</span>
                    </div>
                    <div className="absolute bottom-1/3 right-1/4 h-8 w-8 rounded-full bg-amber-500/30 border-2 border-amber-500 flex items-center justify-center">
                       <span className="text-[8px] font-black text-amber-600 bg-white px-1.5 py-0.5 rounded shadow-sm">Sector 1: Regular</span>
                    </div>
                 </div>

                 <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                    {[
                       { label: 'Desnutrición', count: 12, color: 'rose' },
                       { label: 'Sin Escolaridad', count: 8, color: 'amber' },
                       { label: 'Adultos Solos', count: 24, color: 'indigo' },
                       { label: 'Casos Crónicos', count: 6, color: 'rose' }
                    ].map((idx, i) => (
                       <div key={i} className={cn("p-4 rounded-xl border", idx.color === 'rose' ? 'bg-rose-50 border-rose-100' : 'bg-slate-50 border-slate-100')}>
                          <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-1">{idx.label}</p>
                          <p className={cn("text-xl font-black", idx.color === 'rose' ? 'text-rose-600' : 'text-slate-800')}>{idx.count}</p>
                       </div>
                    ))}
                 </div>
              </motion.div>
           </div>
         )}
      </AnimatePresence>
    </div>
  );
};

/* --- PLANIFICACIÓN & PROYECTOS VIEWS --- */

/* --- PLANIFICACIÓN & PROYECTOS VIEWS --- */


const AcaView = ({ 
  projects, 
  events, 
  onAddEvent 
}: { 
  projects: any[], 
  events: any[],
  onAddEvent: (evt: any) => void 
}) => {
  const [view, setView] = useState<"list" | "calendar">("list");
  const [selectedActivity, setSelectedActivity] = useState<any>(null);
  const [isAddingEvent, setIsAddingEvent] = useState(false);
  const [newEvent, setNewEvent] = useState({ title: '', date: '', type: 'asamblea', description: '' });

  // Merge projects and events for display
  const allActivities = [
    ...events,
    ...projects.map(p => ({
      id: p.id,
      title: p.name,
      date: p.date,
      type: "proyecto",
      t: p.t,
      status: p.status,
      priority: "ALTA", // Simplified
      description: `Nudo Crítico: ${p.nudo}. Presupuesto: ${p.budget}`
    }))
  ].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  const handleAddSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onAddEvent(newEvent);
    setIsAddingEvent(false);
  };

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
          <div className="flex items-center gap-3">
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
             {view === "calendar" && (
                <button 
                  onClick={() => setIsAddingEvent(true)}
                  className="p-3 rounded-xl bg-brand-primary text-white hover:scale-105 transition-all"
                >
                   <Plus className="h-4 w-4" />
                </button>
             )}
          </div>
        </div>

        {view === "list" ? (
          <div className="grid gap-6">
            {allActivities.map((item, i) => (
              <div
                key={i}
                onClick={() => setSelectedActivity(item)}
                className="flex flex-col md:flex-row md:items-center justify-between gap-6 p-6 rounded-3xl bg-gray-50 border border-gray-100 group hover:border-brand-primary/30 transition-all cursor-pointer"
              >
                <div className="flex items-start gap-5">
                  <div className="h-12 w-12 rounded-2xl bg-white border border-gray-200 flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform shadow-sm">
                    <Target className={cn(
                      "h-6 w-6",
                      item.type === 'proyecto' ? 'text-brand-primary' : 'text-indigo-500'
                    )} />
                  </div>
                  <div>
                    <span className="text-[9px] font-black text-brand-primary uppercase tracking-[0.2em]">
                      {item.type === 'proyecto' ? item.t : item.type}
                    </span>
                    <h4 className="text-base font-black text-slate-800 tracking-tight mt-1">
                      "{item.title}"
                    </h4>
                    <p className="text-[10px] text-slate-400 font-bold mt-1 uppercase tracking-widest">
                      {item.date}
                    </p>
                  </div>
                </div>
                <div className="flex items-center justify-between md:justify-end gap-6 border-t md:border-t-0 pt-4 md:pt-0">
                  <div className="text-right">
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                      Estatus
                    </p>
                    <p className="text-xs font-black text-slate-800 italic">
                      {item.status || 'Programado'}
                    </p>
                  </div>
                  <ChevronRight className="h-5 w-5 text-slate-300 group-hover:text-brand-primary transition-all" />
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="bg-gray-50 rounded-3xl p-8 border border-gray-100 min-h-[400px]">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-2">
                <p className="text-sm font-black text-slate-800 italic uppercase">
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
              {Array.from({ length: 31 }).map((_, i) => {
                const dayStr = `2024-05-${(i + 1).toString().padStart(2, '0')}`;
                const dayEvents = allActivities.filter(e => e.date === dayStr);
                
                return (
                  <div
                    key={i}
                    className={cn(
                      "aspect-square rounded-xl border border-gray-100 bg-white p-2 flex flex-col justify-between hover:border-brand-primary/30 transition-all cursor-pointer",
                      dayEvents.length > 0 && "ring-1 ring-brand-primary/30"
                    )}
                  >
                    <span className="text-[10px] font-black text-slate-800">
                      {i + 1}
                    </span>
                    <div className="flex gap-1 justify-end">
                       {dayEvents.map((de, idx) => (
                          <div 
                             key={idx}
                             className={cn(
                                "h-1.5 w-1.5 rounded-full",
                                de.type === 'proyecto' ? 'bg-brand-primary' : de.type === 'asamblea' ? 'bg-indigo-500' : 'bg-rose-500'
                             )} 
                          />
                       ))}
                    </div>
                  </div>
                );
              })}
            </div>
            <div className="mt-8 pt-8 border-t border-gray-100 flex flex-wrap items-center gap-8">
               {[
                  { label: 'Proyectos', color: 'bg-brand-primary' },
                  { label: 'Asambleas', color: 'bg-indigo-500' },
                  { label: 'Censo Social', color: 'bg-rose-500' }
               ].map((idx, i) => (
                  <div key={i} className="flex items-center gap-2">
                    <div className={cn("h-2 w-2 rounded-full", idx.color)} />
                    <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">{idx.label}</p>
                  </div>
               ))}
            </div>
          </div>
        )}
      </div>

      <AnimatePresence>
         {selectedActivity && (
           <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
              <motion.div initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}} onClick={() => setSelectedActivity(null)} className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" />
              <motion.div 
                initial={{opacity:0, scale:0.95, y:20}} animate={{opacity:1, scale:1, y:0}} exit={{opacity:0, scale:0.95, y:20}}
                className="relative w-full max-w-lg bg-white rounded-[2.5rem] shadow-2xl p-10"
              >
                 <div className="flex justify-between items-start mb-8">
                    <div className="h-16 w-16 rounded-2xl bg-brand-primary/10 flex items-center justify-center text-brand-primary">
                       <Target className="h-8 w-8" />
                    </div>
                    <button onClick={() => setSelectedActivity(null)} className="p-2 rounded-xl hover:bg-gray-100"><X className="h-5 w-5 text-slate-400"/></button>
                 </div>
                 <h4 className="text-xl font-black text-slate-800 italic uppercase mb-2">{selectedActivity.title}</h4>
                 <div className="flex gap-2 mb-8">
                    <span className="text-[10px] font-black px-3 py-1 bg-gray-50 text-slate-400 rounded-lg uppercase tracking-widest">{selectedActivity.date}</span>
                    <span className="text-[10px] font-black px-3 py-1 bg-brand-primary/10 text-brand-primary rounded-lg uppercase tracking-widest">{selectedActivity.type}</span>
                 </div>
                 <div className="p-6 rounded-2xl bg-gray-50 border border-gray-100">
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">Descripción</p>
                    <p className="text-sm font-medium text-slate-600 italic">"{selectedActivity.description || 'Sin descripción adicional.'}"</p>
                 </div>
                 <button className="w-full mt-8 py-5 rounded-2xl bg-brand-primary text-white text-[10px] font-black uppercase tracking-widest shadow-xl shadow-brand-primary/20">Ver Expediente Completo</button>
              </motion.div>
           </div>
         )}

         {isAddingEvent && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
               <motion.div initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}} onClick={() => setIsAddingEvent(false)} className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" />
               <motion.div
                 initial={{opacity:0, scale:0.95, y:20}} animate={{opacity:1, scale:1, y:0}} exit={{opacity:0, scale:0.95, y:20}}
                 className="relative w-full max-w-md bg-white rounded-[2.5rem] shadow-2xl p-10"
               >
                  <h4 className="text-xl font-black text-slate-800 italic uppercase mb-8">Nueva Actividad ACA</h4>
                  <form onSubmit={handleAddSubmit} className="space-y-6">
                     <div className="space-y-2">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Título</label>
                        <input 
                           required 
                           className="w-full p-4 rounded-2xl bg-gray-50 border-none ring-1 ring-gray-100 outline-none text-sm font-bold"
                           value={newEvent.title}
                           onChange={e => setNewEvent({...newEvent, title: e.target.value})}
                        />
                     </div>
                     <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                           <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Fecha</label>
                           <input 
                              type="date"
                              required 
                              className="w-full p-4 rounded-2xl bg-gray-50 border-none ring-1 ring-gray-100 outline-none text-sm font-bold"
                              value={newEvent.date}
                              onChange={e => setNewEvent({...newEvent, date: e.target.value})}
                           />
                        </div>
                        <div className="space-y-2">
                           <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Tipo</label>
                           <select 
                              className="w-full p-4 rounded-2xl bg-gray-50 border-none ring-1 ring-gray-100 text-xs font-black uppercase"
                              value={newEvent.type}
                              onChange={e => setNewEvent({...newEvent, type: e.target.value})}
                           >
                              <option value="asamblea">Asamblea</option>
                              <option value="censo">Censo</option>
                              <option value="reunion">Reunión</option>
                           </select>
                        </div>
                     </div>
                     <button type="submit" className="w-full py-5 rounded-2xl bg-brand-primary text-white text-[10px] font-black uppercase tracking-widest shadow-xl shadow-brand-primary/20">Programar Actividad</button>
                  </form>
               </motion.div>
            </div>
         )}
      </AnimatePresence>
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

const ProyectosView = ({ 
  projects, 
  onAddProject, 
  onUpdateStatus 
}: { 
  projects: any[], 
  onAddProject: (p: any) => void,
  onUpdateStatus: (id: string, s: string) => void
}) => {
  const [isNewOpen, setIsNewOpen] = useState(false);
  const [step, setStep] = useState(1);
  const [editingProject, setEditingProject] = useState<any>(null);
  
  // State for the new project form
  const [newProjectData, setNewProjectData] = useState({
     name: '',
     nudo: '',
     t: 'T2 - Servicios Públicos',
     budget: '',
     beneficiaries: '',
     description: ''
  });

  const closeForm = () => {
    setIsNewOpen(false);
    setEditingProject(null);
    setStep(1);
    setNewProjectData({ name: '', nudo: '', t: 'T2 - Servicios Públicos', budget: '', beneficiaries: '', description: '' });
  };

  const handleCreateSubmit = () => {
    const project = {
      id: `PRY-2024-${Math.floor(Math.random() * 1000).toString().padStart(3, '0')}`,
      name: newProjectData.name,
      nudo: newProjectData.nudo,
      t: newProjectData.t,
      budget: `$${newProjectData.budget}`,
      status: 'Propuesto',
      progress: 0,
      date: new Date().toISOString().split('T')[0],
    };
    onAddProject(project);
    closeForm();
  };

  const handleUpdate = (e: React.FormEvent) => {
    e.preventDefault();
    const select = (e.currentTarget as any).statusSelect.value;
    onUpdateStatus(editingProject.id, select);
    setEditingProject(null);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
           <h3 className="text-xl font-black text-slate-800 italic uppercase tracking-tighter">Proyectos de Obra</h3>
           <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-1">Gestión y Seguimiento 7T</p>
        </div>
        <button 
          onClick={() => setIsNewOpen(true)}
          className="flex items-center gap-2 rounded-2xl bg-brand-primary px-6 py-3 text-[10px] font-black text-white shadow-xl shadow-brand-primary/20 hover:scale-105 active:scale-95 transition-all uppercase tracking-widest"
        >
          <Plus className="h-3 w-3" /> Nuevo Proyecto
        </button>
      </div>

      <div className="grid gap-4">
        {projects.map((p, i) => (
          <div key={i} className="bg-white rounded-[2rem] border border-gray-100 shadow-sm group hover:shadow-md transition-all overflow-hidden">
            <div className="p-6 flex flex-col lg:flex-row gap-8 lg:items-center">
              <div className="h-24 lg:w-40 rounded-2xl bg-slate-100 flex items-center justify-center shrink-0 border border-gray-50 relative group/photo">
                 <div className="absolute inset-0 bg-[url('https://picsum.photos/seed/const/400/300')] bg-cover grayscale opacity-20" />
                 <Construction className="h-8 w-8 text-slate-300 relative z-10" />
                 <button className="absolute inset-0 bg-brand-primary/80 text-white flex items-center justify-center opacity-0 group-hover/photo:opacity-100 transition-opacity text-[9px] font-black uppercase tracking-widest">
                    Cargar Foto
                 </button>
              </div>
              
              <div className="flex-1 space-y-3">
                 <div className="flex items-center justify-between">
                    <span className="text-[9px] font-black text-brand-primary uppercase">{p.id} • {p.nudo}</span>
                    <span className={cn(
                       "text-[8px] font-black px-2 py-0.5 rounded-full uppercase tracking-tighter border",
                       p.status === "En Ejecución" ? "bg-brand-primary/10 text-brand-primary border-brand-primary/20" : "bg-emerald-50 text-emerald-600 border-emerald-100"
                    )}>{p.status}</span>
                 </div>
                 <h4 className="text-sm font-black text-slate-800 tracking-tight italic leading-tight group-hover:text-brand-primary transition-colors">
                    "{p.name}"
                 </h4>
                 <div className="flex items-center gap-6 pt-2">
                    <div className="flex-1">
                       <div className="flex justify-between items-center mb-1">
                          <p className="text-[8px] font-bold text-slate-400 uppercase">Avance Físico</p>
                          <span className="text-[10px] font-black text-brand-primary">{p.progress}%</span>
                       </div>
                       <div className="h-1.5 w-full bg-gray-50 rounded-full overflow-hidden border border-gray-100">
                          <div className="h-full bg-brand-primary rounded-full transition-all duration-1000" style={{ width: `${p.progress}%` }} />
                       </div>
                    </div>
                    <div className="shrink-0 text-right">
                       <p className="text-[8px] font-bold text-slate-400 uppercase">Presupuesto</p>
                       <p className="text-[11px] font-black text-slate-800">{p.budget}</p>
                    </div>
                 </div>
              </div>

              <div className="lg:w-40 flex lg:flex-col justify-between items-end lg:items-end lg:border-l lg:border-gray-50 lg:pl-8 gap-4">
                 <div className="text-right">
                    <p className="text-[9px] font-bold text-slate-400 uppercase">Fecha</p>
                    <p className="text-[10px] font-black text-slate-800 italic">{p.date}</p>
                 </div>
                 <button 
                  onClick={() => setEditingProject(p)}
                  className="flex items-center gap-2 text-[9px] font-black text-brand-primary uppercase italic hover:underline"
                 >
                    Editar <ArrowUpRight className="h-3 w-3" />
                 </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      <AnimatePresence>
         {isNewOpen && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
               <motion.div initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}} onClick={closeForm} className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" />
               <motion.div initial={{opacity:0, scale:0.95, y:20}} animate={{opacity:1, scale:1, y:0}} exit={{opacity:0, scale:0.95, y:20}} className="relative w-full max-w-2xl bg-white rounded-[2.5rem] shadow-2xl overflow-hidden">
                  {/* Stepper Header */}
                  <div className="bg-slate-50 p-8 border-b border-gray-100">
                     <div className="flex items-center justify-between mb-8">
                        <h4 className="text-xl font-black text-slate-800 italic uppercase italic">Nuevo Proyecto Comunal</h4>
                        <button onClick={closeForm} className="p-2 rounded-xl hover:bg-gray-200 transition-colors"><X className="h-5 w-5 text-slate-400"/></button>
                     </div>
                     <div className="flex items-center gap-2">
                        {[1, 2, 3, 4, 5].map(s => (
                           <div key={s} className="flex-1 flex flex-col gap-2">
                              <div className={cn("h-1 rounded-full transition-all", step >= s ? "bg-brand-primary" : "bg-gray-200")} />
                              <span className={cn("text-[8px] font-black uppercase text-center", step === s ? "text-brand-primary" : "text-slate-300")}>Paso {s}</span>
                           </div>
                        ))}
                     </div>
                  </div>

                  <form className="p-8 max-h-[60vh] overflow-y-auto space-y-8">
                     {step === 1 && (
                        <div className="space-y-6">
                           <div className="space-y-2">
                              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Nombre del Proyecto</label>
                              <input 
                                className="w-full p-4 rounded-2xl bg-gray-50 border-none ring-1 ring-gray-100 outline-none text-sm font-bold" 
                                placeholder="Especifique obra (Ej: Sustitución de red...)" 
                                value={newProjectData.name}
                                onChange={e => setNewProjectData({...newProjectData, name: e.target.value})}
                              />
                           </div>
                           <div className="grid sm:grid-cols-2 gap-6">
                              <div className="space-y-2">
                                 <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Código Nudo Crítico</label>
                                 <input 
                                    className="w-full p-4 rounded-2xl bg-gray-50 border-none ring-1 ring-gray-100 outline-none text-sm font-bold" 
                                    placeholder="Ej: T2-AGU-001" 
                                    value={newProjectData.nudo}
                                    onChange={e => setNewProjectData({...newProjectData, nudo: e.target.value})}
                                 />
                              </div>
                              <div className="space-y-2">
                                 <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Vincular 7T</label>
                                 <select 
                                    className="w-full p-4 rounded-2xl bg-gray-50 border-none ring-1 ring-gray-100 text-xs font-black uppercase"
                                    value={newProjectData.t}
                                    onChange={e => setNewProjectData({...newProjectData, t: e.target.value})}
                                 >
                                    <option>T1 - Económica</option>
                                    <option>T2 - Servicios Públicos</option>
                                    <option>T3 - Seguridad</option>
                                    <option>T4 - Social</option>
                                 </select>
                              </div>
                           </div>
                        </div>
                     )}

                     {step === 2 && (
                        <div className="space-y-6">
                           <div className="space-y-2">
                              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Población Beneficiaria (Familias)</label>
                              <input 
                                 type="number" 
                                 className="w-full p-4 rounded-2xl bg-gray-50 border-none ring-1 ring-gray-100 outline-none text-sm font-bold" 
                                 placeholder="N° Familias impactadas" 
                                 value={newProjectData.beneficiaries}
                                 onChange={e => setNewProjectData({...newProjectData, beneficiaries: e.target.value})}
                              />
                           </div>
                           <div className="space-y-2">
                              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Diagnóstico Participativo</label>
                              <textarea 
                                 className="w-full p-4 rounded-2xl bg-gray-50 border-none ring-1 ring-gray-100 outline-none text-xs font-medium min-h-[120px]" 
                                 placeholder="Resumen del diagnóstico comunitario..." 
                                 value={newProjectData.description}
                                 onChange={e => setNewProjectData({...newProjectData, description: e.target.value})}
                              />
                           </div>
                        </div>
                     )}

                     {step === 3 && (
                        <div className="space-y-6">
                           <div className="grid sm:grid-cols-2 gap-6">
                              <div className="space-y-2">
                                 <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Presupuesto Estimado</label>
                                 <input 
                                    className="w-full p-4 rounded-2xl bg-gray-50 border-none ring-1 ring-gray-100 outline-none text-sm font-bold" 
                                    placeholder="$ 0.00" 
                                    value={newProjectData.budget}
                                    onChange={e => setNewProjectData({...newProjectData, budget: e.target.value})}
                                 />
                              </div>
                              <div className="space-y-2">
                                 <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Ente Financiamiento</label>
                                 <input className="w-full p-4 rounded-2xl bg-gray-50 border-none ring-1 ring-gray-100 outline-none text-sm font-bold" placeholder="Ej: CFG, Alcaldía, Otros" />
                              </div>
                           </div>
                           <div className="space-y-2">
                              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Ingeniero/Técnico Responsable</label>
                              <input className="w-full p-4 rounded-2xl bg-gray-50 border-none ring-1 ring-gray-100 outline-none text-sm font-bold" placeholder="Nombre y Apellido" />
                           </div>
                        </div>
                     )}

                     {step === 4 && (
                        <div className="space-y-6">
                           <div className="p-10 border-2 border-dashed border-gray-100 rounded-[2rem] flex flex-col items-center justify-center text-center group hover:border-brand-primary/20 transition-all cursor-pointer bg-gray-50/50">
                              <Upload className="h-10 w-10 text-slate-300 mb-4 group-hover:text-brand-primary transition-colors" />
                              <h5 className="text-[11px] font-black text-slate-800 uppercase tracking-widest">Acta de Asamblea & Listado</h5>
                              <p className="text-[9px] text-slate-400 mt-2 font-bold uppercase tracking-tighter italic">Subir PDF escaneado (Requerido para aprobación)</p>
                           </div>
                           <div className="p-10 border-2 border-dashed border-gray-100 rounded-[2rem] flex flex-col items-center justify-center text-center group hover:border-brand-primary/20 transition-all cursor-pointer">
                              <Camera className="h-10 w-10 text-slate-300 mb-4 group-hover:text-brand-primary transition-colors" />
                              <h5 className="text-[11px] font-black text-slate-800 uppercase tracking-widest">Fotos Soporte (Antes)</h5>
                              <p className="text-[9px] text-slate-400 mt-2 font-bold uppercase tracking-tighter italic">Evidencia visual del nudo crítico</p>
                           </div>
                        </div>
                     )}

                     {step === 5 && (
                        <div className="flex flex-col items-center justify-center py-10 text-center">
                           <div className="h-20 w-20 rounded-[2.5rem] bg-emerald-50 text-emerald-500 flex items-center justify-center mb-6">
                              <CheckCircle2 className="h-10 w-10" />
                           </div>
                           <h4 className="text-xl font-black text-slate-800 italic uppercase">¡Listo para Registro!</h4>
                           <p className="text-slate-500 text-sm mt-2 max-w-sm">Su proyecto quedará en estado <b>"Propuesto"</b> hasta la validación de la Sala de Proyectos.</p>
                        </div>
                     )}
                  </form>

                  <div className="p-8 bg-slate-50 border-t border-gray-100 flex items-center justify-between gap-4">
                     {step > 1 && step < 5 && (
                        <button type="button" onClick={() => setStep(step - 1)} className="px-8 py-3 rounded-xl border border-gray-200 text-[10px] font-black uppercase text-slate-400 hover:bg-white transition-all">Anterior</button>
                     )}
                     {step < 5 ? (
                        <button type="button" onClick={() => setStep(step + 1)} className="ml-auto px-10 py-4 rounded-xl bg-brand-primary text-white text-[10px] font-black uppercase tracking-widest shadow-lg shadow-brand-primary/20 active:scale-95 transition-all">Siguiente Paso</button>
                     ) : (
                        <button type="button" onClick={handleCreateSubmit} className="w-full py-5 rounded-2xl bg-brand-primary text-white text-[10px] font-black uppercase tracking-widest shadow-xl shadow-brand-primary/20">Finalizar Registro</button>
                     )}
                  </div>
               </motion.div>
            </div>
         )}

         {editingProject && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
               <motion.div initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}} onClick={() => setEditingProject(null)} className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" />
               <motion.div initial={{opacity:0, scale:0.95, y:20}} animate={{opacity:1, scale:1, y:0}} exit={{opacity:0, scale:0.95, y:20}} className="relative w-full max-w-lg bg-white rounded-[2.5rem] shadow-2xl p-10">
                  <div className="flex justify-between items-center mb-8">
                     <h4 className="text-xl font-black text-slate-800 italic uppercase">Editar Proyecto</h4>
                     <button onClick={() => setEditingProject(null)} className="p-2 rounded-xl hover:bg-gray-100 transition-colors"><X className="h-5 w-5 text-slate-400"/></button>
                  </div>
                  <form onSubmit={handleUpdate} className="space-y-6">
                     <div className="p-6 rounded-2xl bg-gray-50 border border-gray-100">
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Estado de Proyecto</p>
                        <select name="statusSelect" className="w-full bg-transparent text-sm font-black text-brand-primary outline-none cursor-pointer">
                           <option value="Propuesto">Propuesto</option>
                           <option value="En Revisión">En Revisión</option>
                           <option value="Aprobado">Aprobado</option>
                           <option value="En Ejecución">En Ejecución</option>
                           <option value="Culminado">Culminado</option>
                        </select>
                     </div>
                     <div className="space-y-2">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Porcentaje de Avance Físico</label>
                        <div className="flex items-center gap-4">
                           <input type="range" className="flex-1 accent-brand-primary" min="0" max="100" defaultValue={editingProject.progress} />
                           <span className="text-sm font-black text-brand-primary">{editingProject.progress}%</span>
                        </div>
                     </div>
                     <button type="submit" className="w-full py-5 rounded-2xl bg-brand-primary text-white text-[10px] font-black uppercase tracking-widest shadow-xl shadow-brand-primary/20">Actualizar Datos</button>
                  </form>
               </motion.div>
            </div>
         )}
      </AnimatePresence>
    </div>
  );
};

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

const UbicacionView = () => {
  const [showDocs, setShowDocs] = useState(false);

  return (
    <div className="space-y-8">
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
            <button 
              onClick={() => setShowDocs(true)}
              className="bg-brand-primary px-10 py-5 rounded-2xl text-[11px] font-black uppercase tracking-[0.2em] hover:scale-105 active:scale-95 transition-all shadow-2xl shadow-brand-primary/40"
            >
              Cargar Visión de Comunidad
            </button>
            <button className="px-10 py-5 rounded-2xl border-2 border-white/10 hover:bg-white/5 transition-all text-[11px] font-black uppercase tracking-[0.2em]">
              Ver Ejemplos de Éxito
            </button>
          </div>
        </div>
        <div className="absolute top-0 right-0 p-20 opacity-10 rotate-12 transition-transform duration-1000 group-hover:rotate-45">
          <MapIcon className="h-80 w-80 shadow-2xl" />
        </div>
      </div>

      <div className="grid lg:grid-cols-2 gap-8">
         <div className="bg-white p-8 rounded-[3rem] border border-gray-100 shadow-sm space-y-6">
            <div className="flex items-center justify-between">
               <h4 className="text-lg font-black text-slate-800 italic uppercase">Proyección de Desarrollo</h4>
               <span className="text-[9px] font-black px-2 py-1 bg-brand-primary/10 text-brand-primary rounded-lg uppercase">Visual</span>
            </div>
            <div className="aspect-video rounded-[2.5rem] bg-slate-100 border-4 border-white shadow-xl overflow-hidden relative group cursor-pointer">
               <img src="https://picsum.photos/seed/vision2030/1200/800" className="w-full h-full object-cover grayscale opacity-40 group-hover:grayscale-0 group-hover:opacity-100 transition-all duration-700" alt="Vision projection" />
               <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-slate-900/40">
                  <span className="text-white text-[10px] font-black uppercase tracking-widest border border-white/20 px-6 py-3 rounded-xl backdrop-blur-sm">Ampliar Maqueta 2030</span>
               </div>
            </div>
            <p className="text-[11px] text-slate-400 font-medium leading-relaxed italic">
               "Nuestra visión es transformar el Sector 4 en un corredor ecoturístico y productivo, garantizando servicios 100% eficientes para todas las familias."
            </p>
         </div>

         <div className="bg-white p-8 rounded-[3rem] border border-gray-100 shadow-sm space-y-6">
            <h4 className="text-lg font-black text-slate-800 italic uppercase">Documento Estratégico</h4>
            <div className="p-6 rounded-[2rem] bg-gray-50 border border-gray-100 flex items-center gap-6 group hover:border-brand-primary/30 transition-all cursor-pointer">
               <div className="h-14 w-14 rounded-2xl bg-white border border-gray-100 flex items-center justify-center text-rose-500 shadow-sm group-hover:rotate-6 transition-transform">
                  <FileText className="h-7 w-7" />
               </div>
               <div className="flex-1">
                  <p className="text-sm font-black text-slate-800 uppercase italic leading-tight">Plan Maestro_Brisas_2030.pdf</p>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">Cargado: 12 Mayo 2024</p>
               </div>
               <button className="h-10 w-10 rounded-xl bg-brand-primary text-white flex items-center justify-center shadow-lg shadow-brand-primary/20">
                  <Upload className="h-4 w-4" />
               </button>
            </div>
            <div className="p-4 rounded-2xl bg-blue-50 border border-blue-100 flex items-center gap-3">
               <Info className="h-4 w-4 text-blue-500" />
               <p className="text-[9px] font-black text-blue-700 uppercase tracking-tighter">Este documento está siendo revisado por la Dirección de Planificación.</p>
            </div>
         </div>
      </div>

      <AnimatePresence>
         {showDocs && (
           <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
              <motion.div initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}} onClick={() => setShowDocs(false)} className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" />
              <motion.div initial={{opacity:0, scale:0.95, y:20}} animate={{opacity:1, scale:1, y:0}} exit={{opacity:0, scale:0.95, y:20}} className="relative w-full max-w-lg bg-white rounded-[2.5rem] shadow-2xl p-10">
                 <h4 className="text-xl font-black text-slate-800 italic uppercase mb-6">Cargar Visión Territorial</h4>
                 <div className="p-12 border-2 border-dashed border-gray-100 rounded-[2rem] bg-gray-50 flex flex-col items-center group cursor-pointer hover:border-brand-primary/30 transition-all">
                    <CloudUpload className="h-10 w-10 text-slate-300 mb-4 group-hover:text-brand-primary group-hover:scale-110 transition-all" />
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">Sube tu archivo PDF o Imagen de la Maqueta</p>
                 </div>
                 <button onClick={() => setShowDocs(false)} className="w-full py-5 mt-8 rounded-2xl bg-brand-primary text-white text-[10px] font-black uppercase tracking-widest">Enviar al Despacho</button>
              </motion.div>
           </div>
         )}
      </AnimatePresence>
    </div>
  );
};

const NudosCriticosView = () => {
  const [isReportOpen, setIsReportOpen] = useState(false);
  const [selectedNode, setSelectedNode] = useState<any>(null);
  const [severity, setSeverity] = useState<"Bajo" | "Medio" | "Alto/Crítico">("Bajo");

  const closeReport = () => setIsReportOpen(false);

  return (
    <div className="space-y-6">
      <div className="bg-rose-50 border border-rose-100 rounded-[2.5rem] p-8 flex flex-col md:flex-row items-center gap-8 shadow-sm">
        <div className="h-16 w-16 rounded-2xl bg-rose-500 flex items-center justify-center text-white shadow-lg shadow-rose-500/20 shrink-0">
          <AlertCircle className="h-8 w-8" />
        </div>
        <div className="text-center md:text-left">
          <h3 className="text-xl font-black text-rose-900 italic uppercase tracking-tighter">
            Gestión de Nudos Críticos
          </h3>
          <p className="text-rose-700/70 text-xs font-bold uppercase tracking-widest mt-1">
            Identificación de obstáculos prioritarios (Agenda ACA)
          </p>
        </div>
        <button 
          onClick={() => setIsReportOpen(true)}
          className="md:ml-auto bg-rose-500 text-white px-8 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest shadow-lg shadow-rose-500/20 hover:scale-105 active:scale-95 transition-all"
        >
          Reportar Nudo Crítico
        </button>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {[
          {
            icon: Building2,
            title: "Infraestructura",
            issue: "Colapso de tubería principal de aguas servidas",
            impact: "Crítico",
            families: 80,
            id: "T2-AGU-001"
          },
          {
            icon: Activity,
            title: "Salud",
            issue: "Sin insumos médicos en ambulatorio local",
            impact: "Urgente",
            families: 342,
            id: "T4-SAL-002"
          },
          {
             icon: Construction,
             title: "Servicios",
             issue: "Falla de alumbrado público en Sector Bajo",
             impact: "Medio",
             families: 45,
             id: "T2-ELE-003"
          }
        ].map((node, i) => (
          <div
            key={i}
            className="bg-white p-6 rounded-[2rem] border border-gray-100 shadow-sm group hover:shadow-md transition-all relative overflow-hidden"
          >
            <div className="flex justify-between items-start mb-4">
               <div className="h-12 w-12 rounded-2xl bg-gray-50 flex items-center justify-center text-slate-400 group-hover:text-brand-primary group-hover:bg-brand-primary/10 transition-all shrink-0">
                  <node.icon className="h-6 w-6" />
               </div>
               <span className={cn(
                  "text-[8px] font-black px-2 py-0.5 rounded-full uppercase tracking-tighter border",
                  node.impact === "Crítico" ? "bg-rose-50 text-rose-600 border-rose-100" : "bg-amber-50 text-amber-600 border-amber-100"
               )}>{node.impact}</span>
            </div>
            <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">{node.id} • {node.title}</p>
            <h4 className="text-sm font-black text-slate-800 leading-tight mb-4 group-hover:text-brand-primary transition-colors">
              {node.issue}
            </h4>
            <div className="flex items-center justify-between pt-4 border-t border-gray-50">
               <p className="text-[10px] font-bold text-slate-400 italic">{node.families} Familias Afectadas</p>
               <button 
                  onClick={() => setSelectedNode(node)}
                  className="text-[10px] font-black text-brand-primary uppercase underline italic"
               >
                  Ver Detalle
               </button>
            </div>
          </div>
        ))}
      </div>

      <AnimatePresence>
        {isReportOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
             <motion.div initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}} onClick={closeReport} className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" />
             <motion.div initial={{opacity:0, scale:0.95, y:20}} animate={{opacity:1, scale:1, y:0}} exit={{opacity:0, scale:0.95, y:20}} className="relative w-full max-w-2xl bg-white rounded-[2.5rem] shadow-2xl overflow-hidden max-h-[90vh] overflow-y-auto">
                <div className="p-8 border-b border-gray-50 flex items-center justify-between sticky top-0 bg-white z-10">
                   <h4 className="text-xl font-black text-slate-800 italic uppercase tracking-widest">Reportar Nudo Crítico</h4>
                   <button onClick={closeReport} className="p-2 rounded-xl hover:bg-gray-100"><X className="h-5 w-5 text-slate-400"/></button>
                </div>
                <form className="p-8 space-y-8">
                   {/* Categoría y Urgencia */}
                   <div className="grid sm:grid-cols-2 gap-6">
                      <div className="space-y-2">
                         <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Transformación 7T</label>
                         <select className="w-full p-4 rounded-2xl bg-gray-50 border-none ring-1 ring-gray-100 focus:ring-2 focus:ring-brand-primary/20 text-xs font-black uppercase">
                            <option>T1 - Económica</option>
                            <option>T2 - Servicios Públicos</option>
                            <option>T3 - Seguridad</option>
                            <option>T4 - Social</option>
                            <option>T5 - Política</option>
                            <option>T6 - Ciencia</option>
                            <option>T7 - Geopolítica</option>
                         </select>
                      </div>
                      <div className="space-y-2">
                         <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Nivel de Gravedad (Semáforo)</label>
                         <div className="flex gap-2">
                            {["Bajo", "Medio", "Alto/Crítico"].map(s => (
                               <button 
                                  key={s}
                                  type="button"
                                  onClick={() => setSeverity(s as any)}
                                  className={cn(
                                     "flex-1 py-3 rounded-xl text-[9px] font-black uppercase tracking-tighter border transition-all",
                                     severity === s ? "border-brand-primary bg-brand-primary text-white" : "border-gray-100 bg-gray-50 text-slate-400"
                                  )}
                               >
                                  {s}
                               </button>
                            ))}
                         </div>
                      </div>
                   </div>

                   <div className="space-y-2">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Título del Nudo Crítico</label>
                      <input className="w-full p-4 rounded-2xl bg-gray-50 border-none ring-1 ring-gray-100 focus:ring-2 focus:ring-brand-primary/20 outline-none text-sm font-bold" placeholder="Ej: Colapso de tubería principal..." />
                   </div>

                   {severity === "Alto/Crítico" && (
                      <motion.div initial={{opacity:0, height:0}} animate={{opacity:1, height:'auto'}} className="p-6 rounded-[2rem] bg-rose-50 border border-rose-100 space-y-4">
                         <div className="flex items-center gap-3 text-rose-600">
                            <AlertCircle className="h-5 w-5" />
                            <h5 className="text-[10px] font-black uppercase tracking-widest">Alerta de Riesgo Inminente</h5>
                         </div>
                         <div className="space-y-2">
                            <label className="text-[9px] font-bold text-rose-400 uppercase">Justifique la Gravedad (Obligatorio)</label>
                            <textarea className="w-full p-4 rounded-xl bg-white border border-rose-100 outline-none text-xs font-medium min-h-[100px]" placeholder="Describa el riesgo para la vida o servicios esenciales..." />
                         </div>
                         <p className="text-[8px] text-rose-400 font-bold uppercase italic">* Se notificará inmediatamente al Secretario Comunal</p>
                      </motion.div>
                   )}

                   <div className="grid sm:grid-cols-2 gap-6">
                      <div className="space-y-2">
                         <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest" >Personas Afectadas</label>
                         <div className="flex items-center gap-2">
                            <input className="w-full p-4 rounded-2xl bg-gray-50 border-none ring-1 ring-gray-100 outline-none text-xs font-black" placeholder="N° Familias" />
                            <input className="w-full p-4 rounded-2xl bg-gray-50 border-none ring-1 ring-gray-100 outline-none text-xs font-black" placeholder="N° Personas" />
                         </div>
                      </div>
                      <div className="space-y-2">
                         <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Coordenadas GPS</label>
                         <div className="flex items-center gap-2">
                            <button type="button" className="p-4 rounded-2xl bg-slate-800 text-white"><MapPin className="h-5 w-5" /></button>
                            <input className="w-full p-4 rounded-2xl bg-gray-50 border-none ring-1 ring-gray-100 text-[10px] font-mono" disabled value="10.3456, -66.9876" />
                         </div>
                      </div>
                   </div>

                   <button className="w-full py-5 rounded-2xl bg-brand-primary text-white text-[10px] font-black uppercase tracking-[0.2em] shadow-xl shadow-brand-primary/20 active:scale-95 transition-all">
                      Registrar Reporte Prioritario
                   </button>
                </form>
             </motion.div>
          </div>
        )}

        {selectedNode && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
             <motion.div initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}} onClick={() => setSelectedNode(null)} className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" />
             <motion.div initial={{opacity:0, scale:0.95, y:20}} animate={{opacity:1, scale:1, y:0}} exit={{opacity:0, scale:0.95, y:20}} className="relative w-full max-w-xl bg-white rounded-[2.5rem] shadow-2xl p-10">
                <div className="flex justify-between items-start mb-8">
                   <div className="h-16 w-16 rounded-2xl bg-brand-primary/10 flex items-center justify-center text-brand-primary">
                      <selectedNode.icon className="h-8 w-8" />
                   </div>
                   <button onClick={() => setSelectedNode(null)} className="p-2 rounded-xl hover:bg-gray-100"><X className="h-5 w-5 text-slate-400"/></button>
                </div>
                <h4 className="text-xl font-black text-slate-800 italic uppercase leading-tight mb-2">{selectedNode.issue}</h4>
                <div className="flex items-center gap-3 mb-8">
                   <span className="text-[10px] font-black px-3 py-1 bg-rose-50 text-rose-500 rounded-lg uppercase border border-rose-100">{selectedNode.impact}</span>
                   <span className="text-[10px] font-black px-3 py-1 bg-slate-50 text-slate-400 rounded-lg uppercase">{selectedNode.id}</span>
                </div>
                
                <div className="grid gap-6 py-6 border-y border-gray-50">
                   <div className="flex items-center justify-between">
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Población Afectada</p>
                      <p className="text-sm font-black text-slate-800">{selectedNode.families} Familias</p>
                   </div>
                   <div className="flex items-center justify-between">
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Ubicación</p>
                      <p className="text-sm font-black text-slate-800 italic">Sector Bajo, Brisas 3</p>
                   </div>
                </div>

                <div className="mt-10 flex gap-4">
                   <button className="flex-1 py-4 rounded-xl bg-slate-100 text-slate-600 text-[10px] font-black uppercase tracking-widest">Ver Fotos ( Antes )</button>
                   <button className="flex-1 py-4 rounded-xl bg-brand-primary text-white text-[10px] font-black uppercase tracking-widest shadow-xl shadow-brand-primary/20">Vincular Proyecto</button>
                </div>
             </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

const SupportView = () => (
  <div className="space-y-6">
    <div className="bg-white p-8 rounded-[2.5rem] border border-gray-100 shadow-sm relative overflow-hidden">
      <div className="relative z-10 grid lg:grid-cols-2 gap-12 items-center">
        <div className="max-w-md">
          <div className="h-12 w-12 rounded-2xl bg-brand-primary/10 flex items-center justify-center text-brand-primary mb-6">
            <MessageSquare className="h-6 w-6" />
          </div>
          <h4 className="text-xl font-black text-slate-800 italic uppercase tracking-tighter">
            Soporte Técnico
          </h4>
          <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-2 leading-relaxed">
            Resolución inmediata de dudas sobre la carga de datos, censo o gestión de ACA.
          </p>
          <button className="mt-8 px-8 py-3 rounded-xl bg-brand-primary text-white text-[10px] font-black uppercase tracking-widest hover:scale-105 transition-all shadow-lg shadow-brand-primary/20">
            Iniciar Chat en Vivo
          </button>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="bg-gray-50 p-6 rounded-[2rem] border border-gray-100 group hover:border-brand-primary/20 transition-all">
            <Info className="h-6 w-6 text-slate-300 mb-4 group-hover:text-brand-primary transition-colors" />
            <h4 className="text-[10px] font-black text-slate-800 uppercase tracking-tighter">
              Manual Usuario
            </h4>
            <button className="mt-4 text-[9px] font-black text-brand-primary uppercase tracking-widest underline italic">
              PDF
            </button>
          </div>
          <div className="bg-gray-50 p-6 rounded-[2rem] border border-gray-100 group hover:border-brand-primary/20 transition-all">
            <FileText className="h-6 w-6 text-slate-300 mb-4 group-hover:text-brand-primary transition-colors" />
            <h4 className="text-[10px] font-black text-slate-800 uppercase tracking-tighter">
              Tutoriales
            </h4>
            <button className="mt-4 text-[9px] font-black text-brand-primary uppercase tracking-widest underline italic">
              Videos
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
