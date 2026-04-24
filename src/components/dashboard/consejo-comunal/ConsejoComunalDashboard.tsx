import React, { useState, useEffect } from "react";
import { Sidebar } from "../../../layout/Sidebar";
import { motion, AnimatePresence } from "motion/react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../../context/AuthContext";
import { Users } from "lucide-react";
import { DashboardNavbar } from "../common/DashboardNavbar";

// Importación de las nuevas secciones extraídas
import { DashboardOverview } from "./secciones-sidebar/DashboardOverview";
import { VoceriaView } from "./secciones-sidebar/VoceriaView";
import { DatosLegalesView } from "./secciones-sidebar/DatosLegalesView";
import { CensoComunalView } from "./secciones-sidebar/CensoComunalView";
import { UbicacionComunalView } from "./secciones-sidebar/UbicacionComunalView";
import { AcaView } from "./secciones-sidebar/AcaView";
import { NudosCriticosView } from "./secciones-sidebar/NudosCriticosView";
import { ProyectosView } from "./secciones-sidebar/ProyectosView";
import { AsambleasView } from "./secciones-sidebar/AsambleasView";
import { SoporteView } from "./secciones-sidebar/SoporteView";

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

  const navigateWithAction = (
    section: Section,
    action: string | null = null,
  ) => {
    setActiveSection(section);
    setActiveAction(action);
  };

  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

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

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  return (
    <div className="flex bg-[#fcfdfe] min-h-screen">
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

      <Sidebar 
        user={user}
        activeSection={activeSection}
        setActiveSection={setActiveSection}
        isSidebarOpen={isSidebarOpen}
        setIsSidebarOpen={setIsSidebarOpen}
        isMobileMenuOpen={isMobileMenuOpen}
        setIsMobileMenuOpen={setIsMobileMenuOpen}
        onLogout={handleLogout}
      />

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
              {activeSection === "documentacion" && <DatosLegalesView />}
              {activeSection === "censo" && (
                <CensoComunalView
                  initialAction={activeAction}
                  onActionComplete={() => setActiveAction(null)}
                />
              )}
              {activeSection === "ubicacion" && <UbicacionComunalView />}
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
              {activeSection === "soporte" && <SoporteView />}
            </motion.div>
          </AnimatePresence>
        </div>
      </main>
    </div>
  );
};

export default ConsejoComunalDashboard;
