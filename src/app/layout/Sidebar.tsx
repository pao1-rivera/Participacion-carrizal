import React from 'react';
import { 
  Building2, Map as MapIcon, Users, LayoutDashboard, LifeBuoy, ChevronRight,Target,Menu,MessageSquare,Globe,Settings,ClipboardCheck,Home,
  Megaphone, ShieldAlert, FileCheck, ShieldCheck, History, X, Heart, Briefcase, TrendingUp, MapPin, ClipboardList, AlertCircle, Calendar,
  BarChart3, Sparkles
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '../lib/utils';
import { Role } from '../../types';

interface SidebarItemProps {
  icon: React.ElementType;
  label: string;
  active: boolean;
  onClick: () => void;
  badge?: string;
  subItems?: { label: string; id: string; active?: boolean; onClick?: () => void }[];
  isCollapsed: boolean;
}

const SidebarItem = ({ icon: Icon, label, active, onClick, badge, subItems, isCollapsed }: SidebarItemProps) => (
  <div className="space-y-1">
    <button
      onClick={onClick}
      className={cn(
        "w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-bold transition-all group",
        active
          ? "bg-brand-primary/10 text-brand-primary"
          : "text-slate-500 hover:bg-gray-50 hover:text-slate-800",
        isCollapsed && "justify-center px-2"
      )}
    >
      <Icon
        className={cn(
          "h-5 w-5 shrink-0 transition-transform group-hover:scale-110",
          active ? "text-brand-primary" : "text-slate-400",
        )}
      />
      {!isCollapsed && <span className="truncate">{label}</span>}
      {!isCollapsed && badge && (
        <span className={cn(
          "ml-auto px-1.5 py-0.5 rounded-md text-[8px] font-black uppercase",
          active ? "bg-brand-primary text-white" : "bg-slate-100 text-slate-400"
        )}>{badge}</span>
      )}
      {!isCollapsed && subItems && (
        <ChevronRight className={cn("ml-auto h-3 w-3 transition-transform", active && "rotate-90")} />
      )}
      {active && !isCollapsed && (
        <motion.div
          layoutId="activeNav"
          className="ml-auto w-1 h-4 rounded-full bg-brand-primary"
        />
      )}
    </button>
    {active && subItems && !isCollapsed && (
      <div className="ml-9 space-y-1 pt-1 border-l-2 border-brand-primary/10 pl-4 py-1 italic">
        {subItems.map((item, idx) => (
          <button
            key={idx}
            onClick={() => item.onClick?.()}
            className={cn(
              "flex w-full items-center gap-2 py-2 text-[9px] font-bold uppercase tracking-tight transition-all text-left",
              item.active ? "text-brand-primary" : "text-slate-400 hover:text-brand-primary"
            )}
          >
            <div className={cn("h-1 w-1 rounded-full", item.active ? "bg-brand-primary" : "bg-slate-200")} />
            {item.label}
          </button>
        ))}
      </div>
    )}
  </div>
);

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
  const getMenuGroups = (role: Role) => {
    switch (role) {
      case 'comuna':
        return [
          { label: "", items: [{ id: "inicio", label: "Inicio", icon: LayoutDashboard }] },
          {
            label: "Organización",
            items: [
              { 
                id: "territorio", 
                label: "Territorio y Social", 
                icon: MapIcon,
                subItems: [
                  { label: 'Identificación', id: 'identificacion' },
                  { label: 'Consejos Comunales', id: 'consejos' },
                  { label: 'Comités de Trabajo', id: 'comites' },
                ]
              },
            ],
          },
          {
            label: "Autogobierno",
            items: [
              {
                id: "autogobierno",
                label: "Instancias de Gobierno",
                icon: ShieldCheck,
                badge: isCircuito ? 'Restringido' : 'Habilitado',
                subItems: [
                  { label: isCircuito ? 'Parlamento (Bloq.)' : 'Parlamento Comunal', id: 'parlamento' },
                  { label: isCircuito ? 'Banco (Bloq.)' : 'Banco de la Comuna', id: 'banco' },
                  { label: isCircuito ? 'Contraloría (Bloq.)' : 'Consejo Contraloría', id: 'contraloria' },
                ]
              },
            ],
          },
          {
            label: "Planificación",
            items: [
              {
                id: "estrategia",
                label: "P. Estratégica",
                icon: Target,
                subItems: [
                  { label: 'ACA Comunal', id: 'aca' },
                  { label: 'Cartas Comunales', id: 'cartas' },
                ]
              }
            ]
          },
          {
            label: "Proyectos",
            items: [
              {
                id: "proyectos",
                label: "G. Proyectos",
                icon: Briefcase,
                subItems: [
                  { label: 'P. Inversión', id: 'inversion' },
                  { label: 'EPS', id: 'eps' },
                ]
              }
            ]
          },
          { label: "Soporte", items: [{ id: 'ayuda', label: 'Ayuda y Soporte', icon: LifeBuoy }] }
        ];
      case 'sala_autogobierno':
        return [
          {
            label: "Territorial",
            items: [
              { id: 'dashboard', label: 'Panel de Control', icon: LayoutDashboard },
              { 
                id: 'sistematizacion', 
                label: 'Gestión de las 7T', 
                icon: ClipboardCheck,
                subItems: [
                  { id: 't1', label: 'T1 - Económica' },
                  { id: 't2', label: 'T2 - Servicios' },
                  { id: 't3', label: 'T3 - Seguridad' },
                  { id: 't4', label: 'T4 - Social' },
                  { id: 't5', label: 'T5 - Política' },
                  { id: 't6', label: 'T6 - Ecología' },
                  { id: 't7', label: 'T7 - Geopolítica' },
                ]
              },
            ]
          },
          {
            label: "Red Social",
            items: [
              { 
                id: 'organizaciones', 
                label: 'Red de Organizaciones', 
                icon: Users,
                subItems: [
                  { id: 'comunas', label: 'Comunas del Eje' },
                  { id: 'consejos', label: 'Consejos Comunales' },
                ]
              },
            ]
          },
          {
            label: "Estratégico",
            items: [
              { 
                id: 'planificacion', 
                label: 'Planificación Estratégica', 
                icon: MapIcon,
                subItems: [
                  { id: 'aca', label: 'ACA Territorial' },
                  { id: 'suenos', label: 'Mapa de los Sueños' },
                ]
              },
              { 
                id: 'seguimiento', 
                label: 'Seguimiento de Gestión', 
                icon: TrendingUp,
                subItems: [
                  { id: 'proyectos', label: 'Proyectos en Ejecución' },
                  { id: 'evidencias', label: 'Banco de Evidencias' },
                ]
              },
            ]
          },
          {
            label: "Soporte",
            items: [
              { id: 'comunicaciones', label: 'Comunicaciones', icon: MessageSquare },
              { id: 'soporte', label: 'Soporte Técnico', icon: Settings },
            ]
          }
        ];
      case 'alcaldesa':
        return [
          {
            label: "Estratégico",
            items: [
              { id: 'dashboard', label: 'Monitor Municipal', icon: LayoutDashboard },
              { 
                id: 'geopolitica', 
                label: 'Geopolítica Comunal', 
                icon: Globe,
                subItems: [
                  { id: 'mapa_interactivo', label: 'Mapa Interactivo' },
                  { id: 'zonas_atencion', label: 'Zonas de Atención' },
                ]
              },
            ]
          },
          {
            label: "Gestión",
            items: [
              { id: 'las_7t', label: 'Las 7 Transformaciones', icon: Target },
              { 
                id: 'gestion_proyectos', 
                label: 'Proyectos e Inversión', 
                icon: Briefcase,
                subItems: [
                  { id: 'por_aprobar', label: 'Por Aprobar' },
                  { id: 'en_ejecucion', label: 'En Ejecución' },
                  { id: 'impacto_inversion', label: 'Impacto de Inversión' },
                ]
              },
            ]
          },
          {
            label: "Social",
            items: [
              { 
                id: 'radar_social', 
                label: 'Radar Social', 
                icon: Heart,
                subItems: [
                  { id: 'adulto_mayor', label: 'Adulto Mayor' },
                  { id: 'salud_emergencias', label: 'Salud y Emergencias' },
                ]
              },
              { id: 'rendicion', label: 'Rendición de Cuentas', icon: FileCheck },
            ]
          }
        ];
      case 'secretario':
        return [
          {
            label: "Estratégico",
            items: [
              { id: 'dashboard', label: 'Panel de Control', icon: LayoutDashboard },
              { 
                id: 'gestion_territorial', 
                label: 'Gestión Territorial', 
                icon: Globe,
                subItems: [
                  { id: 'salas', label: 'Salas de Autogobierno' },
                  { id: 'comunas', label: 'Comunas y Circuitos' },
                  { id: 'consejos', label: 'Consejos Comunales' },
                ]
              },
            ]
          },
          {
            label: "Seguimiento",
            items: [
              { id: 'seguimiento_7t', label: 'Seguimiento de las 7T', icon: Target },
              { 
                id: 'supervision', 
                label: 'Supervisión Direcciones', 
                icon: ShieldAlert,
                subItems: [
                  { id: 'dir_comunas', label: 'Dirección Comunas' },
                  { id: 'dir_adulto', label: 'Dirección Adulto Mayor' },
                  { id: 'dir_planificacion', label: 'Dirección Planificación' },
                  { id: 'dir_digitalizacion', label: 'Dirección Digitalización' },
                ]
              },
            ]
          },
          {
            label: "Proyectos y Recursos",
            items: [
              { 
                id: 'proyectos_recursos', 
                label: 'Gestión de Recursos', 
                icon: FileCheck,
                subItems: [
                  { id: 'bandeja_proyectos', label: 'Bandeja de Proyectos' },
                  { id: 'ejecucion', label: 'Control de Ejecución' },
                ]
              },
              { id: 'reportes', label: 'Reportes y Estadísticas', icon: BarChart3 },
              { id: 'historico', label: 'Histórico de Gestión', icon: History },
            ]
          },
        ];
      case 'director':
        return [
          {
            label: "Territorial",
            items: [
              { id: 'dashboard', label: 'Panel de Control', icon: LayoutDashboard },
              { 
                id: 'gestion', 
                label: 'Gestión Territorial', 
                icon: MapPin,
                subItems: [
                  { id: 'mapa', label: 'Mapa de Acción' },
                  { id: 'validacion', label: 'Bandeja de Validación' },
                ]
              },
            ]
          },
          {
            label: "Seguimiento",
            items: [
              { 
                id: 'seguimiento', 
                label: 'Seguimiento y Control', 
                icon: TrendingUp,
                subItems: [
                  { id: 'nudos', label: 'Nudos Críticos (7T)' },
                  { id: 'censo', label: 'Censo Sectorizado' },
                ]
              },
              { 
                id: 'planificacion', 
                label: 'Planificación', 
                icon: Calendar,
                subItems: [
                  { id: 'cronograma', label: 'Cronograma' },
                  { id: 'directrices', label: 'Directrices' },
                ]
              },
            ]
          },
          {
            label: "Comunicación",
            items: [
              { id: 'reportes', label: 'Reportes y Estadísticas', icon: BarChart3 },
              { id: 'mensajeria', label: 'Mensajería Comunal', icon: MessageSquare },
            ]
          }
        ];
      case 'consejo_comunal':
        return [
          { label: "", items: [{ id: "inicio", label: "Inicio", icon: Home }] },
          {
            label: "Organización",
            items: [
              { id: "documentacion", label: "Datos Legales", icon: FileCheck },
              { id: "vocerias", label: "Vocerías", icon: Users },
            ],
          },
          {
            label: "Territorio y Social",
            items: [
              { id: "ubicacion", label: "Ubicación Geográfica", icon: MapPin },
              { id: "censo", label: "Censo Poblacional", icon: MapIcon },
              { id: "mapa_suenos", label: "Mapa de los Sueños", icon: Sparkles },
            ],
          },
          {
            label: "Planificación (7T)",
            items: [
              { id: "aca", label: "Agenda (ACA)", icon: Target },
              { id: "nudos", label: "Nudos Críticos", icon: AlertCircle },
              { id: "proyectos", label: "Mis Proyectos", icon: ClipboardList },
              { id: "asambleas", label: "Asambleas", icon: Megaphone },
            ],
          },
          { label: "Otros", items: [{ id: "soporte", label: "Ayuda y Soporte", icon: MessageSquare }] },
        ];
      default:
        return [];
    }
  };

  const menuGroups = getMenuGroups(user.role);

  const sidebarContent = (
    <div className="h-full flex flex-col bg-white">
      {/* Sidebar Header */}
      <div className="p-6 flex items-center justify-between border-b border-gray-50 shrink-0">
        <div className={cn("flex items-center gap-3 overflow-hidden transition-all", !isSidebarOpen && "lg:hidden")}>
          <div className="h-10 w-10 rounded-2xl bg-brand-primary flex items-center justify-center text-white shadow-xl shadow-brand-primary/20 shrink-0">
            <Building2 className="h-6 w-6" />
          </div>
          {isSidebarOpen && (
             <div>
                <span className="text-sm font-black tracking-tighter text-slate-800 uppercase italic leading-none block">
                  {user.role === 'comuna' ? 'Comuna Carrizal' : 
                   user.role === 'consejo_comunal' ? 'Gestión Comunal' :
                   user.role === 'alcaldesa' ? 'Alcaldía Carrizal' :
                   'Control Territorial'}
                </span>
                <p className="text-[9px] font-bold text-slate-400 uppercase tracking-[0.2em] mt-0.5 whitespace-nowrap">
                  {user.role === 'alcaldesa' ? 'Despacho Superior' : 'Modulo de Gestión'}
                </p>
             </div>
          )}
        </div>
        <button
          onClick={() => isMobileMenuOpen ? setIsMobileMenuOpen(false) : setIsSidebarOpen(!isSidebarOpen)}
          className="p-1.5 rounded-xl hover:bg-gray-100 text-slate-400"
        >
          {isMobileMenuOpen ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
        </button>
      </div>

      {/* Navigation Items */}
      <div className="flex-1 overflow-y-auto py-6 px-4 space-y-8 custom-scrollbar">
        {menuGroups.map((group, gIdx) => (
          <div key={gIdx} className="space-y-1">
            {group.label && isSidebarOpen && (
              <p className="px-3 text-[9px] font-black text-slate-300 uppercase tracking-[0.2em] mb-3">
                {group.label}
              </p>
            )}
            <div className="space-y-1">
               {group.items.map((item) => (
                  <SidebarItem 
                     key={item.id}
                     icon={item.icon}
                     label={item.label}
                     active={activeSection === item.id || (item.subItems && item.subItems.some(si => si.id === activeSection))}
                     onClick={() => {
                        if (!item.subItems) {
                           setActiveSection(item.id);
                           if (window.innerWidth < 1024) setIsMobileMenuOpen(false);
                        } else {
                           setActiveSection(item.id);
                        }
                     }}
                     badge={item.badge}
                     subItems={item.subItems?.map(si => ({
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

      {/* Sidebar Footer - Only Status */}
      <div className="p-6 border-t border-gray-50 shrink-0">
         <div className="text-center">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-50 border border-slate-100">
               <div className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
               {isSidebarOpen && (
                 <span className="text-[8px] font-black text-slate-500 uppercase tracking-widest">Sistema Activo</span>
               )}
            </div>
         </div>
      </div>
    </div>
  );

  return (
    <>
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-[60] bg-white border-r border-gray-100 transition-all duration-300 ease-in-out lg:static lg:block shadow-2xl lg:shadow-none",
          isSidebarOpen ? "w-80" : "w-20",
          isMobileMenuOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0",
        )}
      >
        {sidebarContent}
      </aside>

      <AnimatePresence>
        {isMobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setIsMobileMenuOpen(false)}
            className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-[50] lg:hidden"
          />
        )}
      </AnimatePresence>
    </>
  );
};