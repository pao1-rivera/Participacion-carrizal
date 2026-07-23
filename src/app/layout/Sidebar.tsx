"use client";

import React from 'react';
import { 
  Building2, Map as MapIcon, Users, LayoutDashboard, LifeBuoy, ChevronRight, Target, Menu, MessageSquare, Globe, Settings, BarChart3,
  Megaphone, ShieldAlert, FileCheck, UserRound, ShieldCheck, Pickaxe, UsersRound, MonitorSmartphone, Workflow, X, Heart, Briefcase, MousePointerClick, MapPin, ClipboardList, AlertCircle, GraduationCap, Library,FileBarChart, Calendar,Store,
  HardHat, Sparkles, User, CheckCircle2, Award, Smartphone, CalendarDays, UserCheck
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '../lib/utils';

// ---------- TIPOS ----------
interface MenuItem {
  id: string;
  label: string;
  icon: React.ElementType;
  badge?: string;
  subItems?: { id: string; label: string }[];
}

interface SidebarItemProps {
  icon: React.ElementType;
  label: string;
  active: boolean;
  onClick: () => void;
  badge?: string;
  subItems?: { label: string; id: string; active?: boolean; onClick?: () => void }[];
  isCollapsed: boolean;
}

interface SidebarProps {
  user: any;
  activeSection: string;
  setActiveSection: (section: string) => void;
  isSidebarOpen: boolean;
  setIsSidebarOpen: (isOpen: boolean) => void;
  isMobileMenuOpen: boolean;
  setIsMobileMenuOpen: (isOpen: boolean) => void;
  onLogout: () => void;
  isCircuito?: boolean;
}

// ---------- COMPONENTE SIDEBAR ITEM ----------
const SidebarItem = ({ icon: Icon, label, active, onClick, badge, subItems, isCollapsed }: SidebarItemProps) => (
  <div className="space-y-1">
    <button
      onClick={onClick}
      className={cn(
        "w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-bold transition-all group",
        active ? "bg-brand-primary/10 text-brand-primary" : "text-slate-500 hover:bg-gray-50 hover:text-slate-800",
        isCollapsed && "justify-center px-2"
      )}
      title={isCollapsed ? label : undefined} 
    >
      <Icon className={cn("h-5 w-5 shrink-0 transition-transform group-hover:scale-110", active ? "text-brand-primary" : "text-slate-400")} />
      {!isCollapsed && <span className="truncate">{label}</span>}
      {!isCollapsed && badge && <span className={cn("ml-auto px-1.5 py-0.5 rounded-md text-[8px] font-black uppercase", active ? "bg-brand-primary text-white" : "bg-slate-100 text-slate-400")}>{badge}</span>}
      {!isCollapsed && subItems && <ChevronRight className={cn("ml-auto h-3 w-3 transition-transform", active && "rotate-90")} />}
      {active && isCollapsed && <motion.div layoutId="activeNav" className="ml-auto w-1 h-4 rounded-full bg-brand-primary" />}
    </button>
    {active && subItems && !isCollapsed && (
      <div className="ml-9 space-y-1 pt-1 border-l-2 border-brand-primary/10 pl-4 py-1 italic">
        {subItems.map((item, idx) => (
          <button key={idx} onClick={() => item.onClick?.()} className={cn("flex w-full items-center gap-2 py-2 text-[9px] font-bold uppercase tracking-tight transition-all text-left", item.active ? "text-brand-primary" : "text-slate-400 hover:text-brand-primary")}>
            <div className={cn("h-1 w-1 rounded-full", item.active ? "bg-brand-primary" : "bg-slate-200")} />
            {item.label}
          </button>
        ))}
      </div>
    )}
  </div>
);

// ---------- COMPONENTE PRINCIPAL SIDEBAR ----------
export const Sidebar: React.FC<SidebarProps> = ({
  user,
  activeSection,
  setActiveSection,
  isSidebarOpen,
  setIsSidebarOpen,
  isMobileMenuOpen,
  setIsMobileMenuOpen,
  onLogout,
  isCircuito = false
}) => {
  // CORREGIDO: Normalizar el role para que coincida exactamente
  const normalizeRole = (role: string): string => {
    if (!role) return 'default';
    const roleLower = role.toLowerCase().trim();

    if (roleLower.includes('admin') || roleLower === 'administrador') {
      return 'admin';
    }

    if (roleLower.includes('direcomunas') || roleLower.includes('director_comunas')) {
      return 'direcomunas';
    }
    if (roleLower.includes('adultomayor') || roleLower.includes('adulto_mayor') || roleLower.includes('director_adulto')) {
      return 'adultomayor';
    }
    
    if (roleLower.includes('digitalizacion') || roleLower.includes('digitalización')) return 'digitalizacion';
    if (roleLower.includes('secretario')) return 'secretario';
    if (roleLower.includes('alcaldesa')) return 'alcaldesa';
    if (roleLower.includes('sala') || roleLower.includes('autogobierno')) return 'sala_autogobierno';
    if (roleLower.includes('consejo') || roleLower.includes('comunal')) return 'vocero_cc';
    if (roleLower.includes('comuna')) return 'vocero_c';
    if (roleLower.includes('planificacion') || roleLower.includes('planificación')) return 'planificacion';
    
    return roleLower || 'default';
  };

  const role = normalizeRole(user?.rolNombre);

  const getMenuGroups = (role: string): { label: string; items: MenuItem[] }[] => {
    const baseMenu: { label: string; items: MenuItem[] } = {
      label: "",
      items: [{ id: "perfil", label: "Perfil", icon: User }]
    };

    switch (role) {
      case 'admin':
        return [
          { label: "", items: [{ id: 'dashboard', label:'Monitor del Sistema', icon: LayoutDashboard }] },
          { label: 'Seguridad y Accesos', items: [{ id: 'lista_usuarios', label: 'Directorio de Usuarios', icon: FileCheck }] },
          { label: 'Mantenimiento', items: [{ id: 'logs_auditoria', label: 'Auditoría del Sistema', icon: Settings }, 
            { id: 'respaldos_db', label: 'Copias de Seguridad', icon: Settings}] },
          { label: "", items: [{ id: 'alertas', label:'Alertas Rojas', icon: ShieldCheck }] },
          
        ];
      case 'vocero_c':
        return [
          { label: "", items: [{ id: "inicio", label: "Inicio", icon: LayoutDashboard }] },
          { label: "Organización", items: [{ id: "documentacion", label: "Datos Legales", icon: FileCheck }, { id: "consejos", label: "Consejos Comunales", icon: MapIcon }, { id: "consejopec", label: isCircuito ? "Órganos de gestión" : "Consejo", icon: ShieldCheck }] },
          { label: "Territorio y Social", items: [{ id: "censo", label: "Censo Poblacional", icon: MapIcon }, 
            { id: "asambleas", label: "Asambleas y reuniones", icon: Megaphone }] },
          { label: "Planificación (7T)", items: [
           { id: "aca", label: "Agenda (ACA)", icon: Target }, { id: "mapa_suenos", label: "Mapa de los Sueños", icon: Sparkles }, { id: "nudos", label: "Nudos Críticos", icon: AlertCircle }, { id: "proyectos", label: "Mis Proyectos", icon: ClipboardList }] },
          { label: "Ayuda y Soporte", items: [{ id: "ayuda", label: "Ayuda y Soporte", icon: LifeBuoy }] }
        ];

      case 'vocero_cc':
        return [
          { label: "", items: [{ id: "inicio", label: "Inicio", icon: LayoutDashboard }] },
          { label: "Organización", items: [{ id: "documentacion", label: "Datos Legales", icon: FileCheck }, { id: "vocerias", label: "Vocerías", icon: Users }] },
          { label: "Territorio y Social", items: [{ id: "censo", label: "Censo Poblacional", icon: MapIcon }, 
            { id: "asambleas", label: "Asambleas", icon: Megaphone }] },
          { label: "Planificación (7T)", items: [{ id: "aca", label: "Agenda (ACA)", icon: Target },  { id: "mapa_suenos", label: "Mapa de los Sueños", icon: Sparkles },{ id: "nudos", label: "Nudos Críticos", icon: AlertCircle }, { id: "proyectos", label: "Mis Proyectos", icon: ClipboardList }, 
            ] },
          { label: "Otros", items: [{ id: "soporte", label: "Ayuda y Soporte", icon: MessageSquare }] }
        ];

      case 'coordinador_s':
        return [
          { label: "", items: [{ id: "inicio", label: "Inicio", icon: LayoutDashboard }] },
          {
            label: "Identificacion y vinculación Territorial",
            items: [
              { id: "datosl", label: "Datos Legales", icon: FileCheck },
              { id: "organizaciones", label: "Organización de Base", icon: Users },
            ],
          },
          {
            label: "Gestión y Seguimiento",
            items: [
              { id: "agendac", label: "Soluciones 7T", icon: Target},
              { id: "infraestructura", label: "Infraestructura", icon: Building2 },
             // { id: "eps", label: "E.P.S", icon: Store },
              { id: "adulto", label: "Encuesta Adulto Mayor", icon: UserRound },
              { id: 'digitalizacion', label: 'Alfabetización Digital', icon: Smartphone },
            ]
          },
          {
            label: "Comunicación y Formación",
            items: [
              { id: "plan", label: "Plan de Formación", icon: GraduationCap },
              { id: "biblioteca", label: "Biblioteca Digital", icon: Library },
            ]
          },
          {
            label: "Soporte",
            items: [
              { id: "soporte", label: "Soporte Técnico", icon: Settings },
            ]
          },
        ];

      case 'alcaldesa':
        return [
          { label: "", items: [{ id: "dashboard", label: "Inicio", icon: LayoutDashboard }] },
          { label: "Estratégico", items: [
              { id: "mapa_interactivo", label: "Líderes", icon: UserCheck}, 
              { id: "zonas_atencion", label: "Zonas de Atención" , icon: LayoutDashboard}] },
          { label: "Gestión", items: [ 
            { id: "por_aprobar", label: "Por Aprobar" ,icon: Target }, 
            { id: "en_ejecucion", label: "En Ejecución" , icon: Target}, 
            { id: "rendicion", label: "Rendición de Cuentas", icon: FileCheck  }] },
          { label: "Social", items: [
            { id: "las_7t", label: "Población Censada", icon:BarChart3 },
              { id: "adulto_mayor", label: "Adulto Mayor", icon: Heart }, 
              { id: "salud_emergencias", label: "Digitalización" , icon: MonitorSmartphone},
               ] },
               {
            label: "Soporte",
            items: [
              { id: "soporte", label: "Soporte Técnico", icon: Settings },
            ]
          },
        ];

      case 'secretario':
        return [
          { label: "", items: [{ id: "dashboard", label: "Panel de Control", icon: LayoutDashboard}] },
          { label: "4 Dimensiones", items: [
             
            { id: "gestion_territorial", label: "Liderazgo", icon: UsersRound, },
            { id: "infraestructura", label: "Infraestructura", icon: HardHat, },
            { id: "territorio", label: "Territorio", icon: MapPin, },
            { id: "gestion", label: "Gestion", icon: Briefcase, }] },
          { label: "Seguimiento", items: [
            { id: "seguimiento", label: "Seguimiento de las 7T", icon: Target }, 
            { id: "supervision", label: "Supervisión Direcciones", icon: ShieldAlert }] },
          
            { label: "Soporte Técnico", items: [
          { id: "ayuda", label: "Soporte y Ayuda", icon: Settings }] },
        ];

      case 'digitalizacion':
        return [
          { label: "", items: [{ id: "dashboardD", label: "Inicio", icon: LayoutDashboard }] },
          {
            label: "4 Dimensiones",
            items: [
              { id: "liderazgo", label: "Liderazgo", icon: UsersRound },
              { id: "infraestructura", label: "Infraestructura", icon: Pickaxe },
              { id: "territorio", label: "Territorio", icon: Workflow },
              { id: "gestion", label: "Gestión", icon: Globe },
            ],
          },
          {
            label: "Digitalizacion",
            items: [
              { id: "alfa", label: "Alfabetizacion Comunal", icon: Smartphone},
              { id: "planidirecc", label: "Planificación y Reportes", icon: CalendarDays}
],
          },
          {
              label: "Soporte",
            items: [
              { id: "ayuda", label: "Ayuda y Soporte", icon: LifeBuoy }
            ]
          },
        ];

      case 'planificacion':
        return [
          { 
            label: "", 
            items: [{ id: "dashboardP", label: "Inicio", icon: LayoutDashboard }] 
          },
          {
            label: "4 Dimensiones",
            items: [
              { id: "dimenl", label: "Liderazgo", icon: UsersRound },
              { id: "dimeni", label: "Infraestructura", icon: Pickaxe },
              { id: "diment", label: "Territorio", icon: Workflow },
              { id: "dimeng", label: "Gestión", icon: Globe },
            ],
          },
          {
            label: "Direcciòn de Planificaciòn",
            items: [
              { id: "formacion", label: "Cursos y Talleres", icon: Award },
              { id: "planidirecc", label: "Planificación y Reportes", icon: CalendarDays}
            ],
          },
          {
            label: "Soporte",
            items: [
              { id: "ayuda", label: "Ayuda y Soporte", icon: LifeBuoy },

            ],
          },
        ];

      case 'direcomunas':
        return [
          { 
            label: "", 
            items: [{ id: "dashboardP", label: "Inicio", icon: LayoutDashboard }] 
          },
          {
            label: "4 Dimensiones",
            items: [
              { id: "dim1", label: "Liderazgo", icon: Users },
              { id: "dim2", label: "Infraestructura", icon: Building2 },
              { id: "dim3", label: "Territorio", icon: Globe },
              { id: "dim4", label: "Gestión", icon: ShieldCheck },
            ],
          },
          {
            label: "Dirección Comunas",
            items: [
              { id: "validacion", label: "Validación", icon: CheckCircle2 },
              { id: "planidirecc", label: "Planificación y Reportes", icon: CalendarDays}

            ],
          },
          {
            label: "Soporte",
            items: [
              { id: "ayuda", label: "Ayuda y Soporte", icon: LifeBuoy },

            ],
          },
        ];

      case 'adultomayor':
        return [
          { 
            label: "", 
            items: [{ id: "dashboardA", label: "Inicio", icon: LayoutDashboard }]
          },
          {
              label: "4 Dimensiones",
              items: [
                { id: "dimen1", label: "Liderazgo", icon: UsersRound },
                { id: "dimen2", label: "Infraestructura", icon: Pickaxe },
                { id: "dimen3", label: "Territorio", icon: Workflow },
                { id: "dimen4", label: "Gestión", icon: Globe },
              ],
            },
          {
            label: "Dirección Adulto Mayor",
            items: [
              { id: "salud", label: "Salud y Atención", icon: Heart },
              { id: "planidirecc", label: "Planificación y Reportes", icon: CalendarDays}
            ],
          },
          {
            label: "Soporte",
            items: [
              { id: "ayuda", label: "Ayuda y Soporte", icon: LifeBuoy },

            ],
          },
        ];
      default:
        return [baseMenu];
    }
  };

  const menuGroups = getMenuGroups(role);

const isSidebarOpenRef = React.useRef(isSidebarOpen);

// Sincronizar el ref cuando cambie isSidebarOpen
React.useEffect(() => {
  isSidebarOpenRef.current = isSidebarOpen;
}, [isSidebarOpen]);

// RESIZE HANDLER - SIN dependencias que causen ciclos
React.useEffect(() => {
  const handleResize = () => {
    const isLargeScreen = window.innerWidth >= 1024;
    const currentState = isSidebarOpenRef.current;
    
    // Solo actualizar si es necesario
    if (isLargeScreen && !currentState) {
      setIsSidebarOpen(true);
    } else if (!isLargeScreen && currentState) {
      setIsSidebarOpen(false);
    }
  };
  
  // Ejecutar al montar
  handleResize();
  
  // Agregar event listener
  window.addEventListener("resize", handleResize);
  
  // Cleanup
  return () => window.removeEventListener("resize", handleResize);
}, [setIsSidebarOpen]); // ← Dependencias necesarias para evitar closures antiguos

  const sidebarContent = (
    <div className="h-full flex flex-col bg-white">
      <div className="p-6 flex items-center justify-between border-b border-gray-50 shrink-0">
        <div className={cn("flex items-center gap-3 overflow-hidden transition-all", !isSidebarOpen && "lg:hidden")}>
          <div className="h-10 w-10 rounded-2xl bg-brand-primary flex items-center justify-center text-white shadow-xl shadow-brand-primary/20 shrink-0">
            <Building2 className="h-6 w-6" />
          </div>
          {isSidebarOpen && (
            <div>
              <span className="text-sm font-black tracking-tighter text-slate-800 uppercase italic leading-none block">
                {role === 'comuna' ? 'Comuna Carrizal' : 
                 role === 'consejo_comunal' ? 'Gestión Comunal' :
                 role === 'alcaldesa' ? 'Alcaldía Carrizal' :
                 role === 'digitalizacion' ? 'Dirección Digitalización' :
                 role === 'planificacion' ? 'Dirección Planificación' :
                 role === 'secretario' ? 'Secretaría General' :
                 'Control Territorial'}
              </span>
              <p className="text-[9px] font-bold text-slate-400 uppercase tracking-[0.2em] mt-0.5 whitespace-nowrap">
                {role === 'alcaldesa' ? 'Despacho Superior' : 'Módulo de Gestión'}
              </p>
            </div>
          )}
        </div>
        <button onClick={() => isMobileMenuOpen ? setIsMobileMenuOpen(false) : setIsSidebarOpen(!isSidebarOpen)} className="p-1.5 rounded-xl hover:bg-gray-100 text-slate-400">
          {isMobileMenuOpen ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
        </button>
      </div>

      <div className="flex-1 overflow-y-auto py-6 px-4 space-y-8 custom-scrollbar">
        {menuGroups.map((group, gIdx) => (
          <div key={gIdx} className="space-y-1">
            {group.label && isSidebarOpen && <p className="px-3 text-[9px] font-black text-slate-300 uppercase tracking-[0.2em] mb-3">{group.label}</p>}
            <div className="space-y-1">
              {(group.items || []).map((item) => (
                <SidebarItem
                  key={item.id}
                  icon={item.icon}
                  label={item.label}
                  active={activeSection === item.id}
                  onClick={() => {
                    if (!item.subItems) {
                      setActiveSection(item.id);
                      if (window.innerWidth < 1024) setIsMobileMenuOpen(false);
                    } else {
                      setActiveSection(item.id);
                    }
                  }}
                  badge={item.badge}
                  subItems={item.subItems?.map((si) => ({
                    ...si,
                    active: activeSection === si.id,
                    onClick: () => {
                      setActiveSection(si.id);
                      if (window.innerWidth < 1024) setIsMobileMenuOpen(false);
                    }
                  }))}
                  isCollapsed={!isSidebarOpen}
                />
              ))}
            </div>
          </div>
        ))}
      </div>

      <div className="p-6 border-t border-gray-50 shrink-0">
        <div className="text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-50 border border-slate-100">
            <div className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
            {isSidebarOpen && <span className="text-[8px] font-black text-slate-500 uppercase tracking-widest">Sistema Activo</span>}
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <>
      <aside className={cn("sidebar fixed inset-y-0 left-0 z-60 bg-white border-r border-gray-100 transition-all duration-300 ease-in-out lg:static lg:block shadow-2xl lg:shadow-none", isSidebarOpen ? "w-80" : "w-20", isMobileMenuOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0")}>
  {sidebarContent}
</aside>
      <AnimatePresence>
        {isMobileMenuOpen && <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setIsMobileMenuOpen(false)} className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 lg:hidden" />}
      </AnimatePresence>
    </>
  );
};