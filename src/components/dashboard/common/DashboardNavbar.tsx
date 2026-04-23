import React from 'react';
import { Bell, MessageSquare, Menu } from 'lucide-react';
import { UserBase } from '../../../types';
import { cn } from '../../../lib/utils';

interface DashboardNavbarProps {
  user: UserBase | any;
  title?: string;
  subtitle?: string;
  onMobileMenuOpen?: () => void;
  actions?: React.ReactNode;
  roleIcon?: React.ReactNode;
}

export const DashboardNavbar: React.FC<DashboardNavbarProps> = ({ 
  user, 
  title, 
  subtitle, 
  onMobileMenuOpen,
  actions,
  roleIcon 
}) => {
  return (
    <>
      {/* Mobile Header */}
      <header className="fixed top-0 left-0 right-0 h-16 bg-white/80 backdrop-blur-md border-b border-slate-100 flex items-center justify-between px-6 z-30 lg:hidden">
        <div className="flex items-center gap-3">
          {onMobileMenuOpen && (
            <button onClick={onMobileMenuOpen} className="p-2 -ml-2 rounded-xl hover:bg-slate-50">
              <Menu size={24} className="text-slate-600" />
            </button>
          )}
          <h1 className="font-bold text-slate-900 leading-none tracking-tight uppercase tracking-tighter italic">SALA DIGITAL</h1>
        </div>
        <div className="flex items-center gap-3">
           <button className="relative w-10 h-10 flex items-center justify-center text-slate-400 hover:text-brand-primary transition-colors">
              <Bell size={20} />
              <span className="absolute top-2.5 right-2.5 w-2 h-2 bg-rose-500 rounded-full border-2 border-white" />
           </button>
           <div className="w-10 h-10 rounded-full bg-brand-primary/10 flex items-center justify-center text-brand-primary font-bold text-sm border border-brand-primary/20">
              {user?.firstName?.[0] || 'U'}
           </div>
        </div>
      </header>

      {/* Desktop Header */}
      <header className="h-20 bg-white/80 backdrop-blur-md sticky top-0 z-40 px-8 flex items-center justify-between border-b border-slate-100 hidden lg:flex">
        <div className="flex items-center gap-6">
          {roleIcon && (
            <div className="h-10 w-10 bg-slate-50 border border-slate-100 rounded-xl flex items-center justify-center text-brand-primary">
              {roleIcon}
            </div>
          )}
          <div>
            <h2 className="text-lg font-black text-slate-900 tracking-tight leading-none uppercase italic">
              {title || "Panel de Control"}
            </h2>
            {subtitle && (
              <p className="text-[10px] text-brand-primary font-bold tracking-widest mt-1 uppercase">
                {subtitle}
              </p>
            )}
          </div>
          {actions && <div className="ml-4 flex items-center gap-3">{actions}</div>}
        </div>

        <div className="flex items-center gap-6">
          <div className="flex items-center gap-3 pr-6 border-r border-slate-100">
            <button className="w-10 h-10 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-center text-slate-400 hover:text-brand-primary hover:bg-brand-primary/5 transition-all relative group shadow-sm">
              <MessageSquare size={20} className="group-hover:scale-110 transition-transform" />
              <span className="absolute top-2 right-2 w-2 h-2 bg-brand-primary rounded-full border-2 border-white" />
            </button>
            <button className="w-10 h-10 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-center text-slate-400 hover:text-brand-primary hover:bg-brand-primary/5 transition-all relative group shadow-sm">
              <Bell size={20} className="group-hover:scale-110 transition-transform" />
              <div className="absolute -top-1 -right-1 w-5 h-5 bg-rose-500 rounded-full border-2 border-white flex items-center justify-center">
                <span className="text-[8px] font-black text-white">3</span>
              </div>
            </button>
          </div>

          <div className="flex items-center gap-4">
            <div className="text-right">
              <p className="text-sm font-black text-slate-900 tracking-tighter leading-none">
                {user?.firstName} {user?.lastName}
              </p>
              <p className="text-[10px] text-brand-primary font-bold uppercase mt-1 tracking-widest leading-none">
                {user?.vinculoAdministrativo || user?.role || "Usuario"}
              </p>
            </div>
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-slate-100 to-slate-200 border border-slate-200 flex items-center justify-center text-slate-500 overflow-hidden font-black text-sm shadow-inner">
               {user?.firstName?.[0] || 'U'}
            </div>
          </div>
        </div>
      </header>
    </>
  );
};
