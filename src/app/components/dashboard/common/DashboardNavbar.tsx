"use client";

import React, { useState } from 'react';
import { Bell, MessageSquare, Menu, LogOut, Settings } from 'lucide-react';
import { UserBase } from '@/types';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';

interface DashboardNavbarProps {
  user: UserBase | any;
  title?: string;
  subtitle?: string;
  onMobileMenuOpen?: () => void;
  onLogout: () => void; 
  actions?: React.ReactNode;
  roleIcon?: React.ReactNode;
}

export const DashboardNavbar: React.FC<DashboardNavbarProps> = ({ 
  user, 
  onMobileMenuOpen,
  onLogout,
  actions,
}) => {
  const [isProfileOpen, setIsProfileOpen] = useState(false);

  // Lógica para determinar la etiqueta de identidad basada en el rol/vínculo
  const getRoleLabel = () => {
    const role = user?.role || user?.vinculoAdministrativo;
    switch (role) {
      case 'consejo_comunal': return 'Consejo Comunal';
      case 'comuna': return 'Comuna';
      case 'sala_autogobierno': return 'Sala de Autogobierno';
      case 'direccion': return 'Dirección';
      case 'secretario': return 'Secretario';
      case 'alcaldesa': return 'Alcaldesa';
      default: return 'Usuario';
    }
  };

  return (
    <>
      <header className="h-20 bg-white/80 backdrop-blur-md sticky top-0 z-40 px-4 md:px-8 flex items-center justify-between border-b border-slate-100">
        <div className="flex items-center gap-4 md:gap-6">
          {onMobileMenuOpen && (
            <button 
              onClick={onMobileMenuOpen} 
              className="p-2 rounded-xl hover:bg-slate-50 lg:hidden"
            >
              <Menu size={24} className="text-slate-600" />
            </button>
          )}

          <div>
            <h2 className="text-xl md:text-3xl font-black text-slate-900 tracking-tighter leading-none uppercase italic">
              {getRoleLabel()}
            </h2>
          </div>
          {actions && <div className="ml-4 hidden md:flex items-center gap-3">{actions}</div>}
        </div>

        <div className="flex items-center gap-3 md:gap-6">
          <div className="flex items-center gap-2 md:gap-3 pr-3 md:pr-6 border-r border-slate-100">
            <button className="w-9 h-9 md:w-10 md:h-10 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-center text-slate-400 hover:text-brand-primary hover:bg-brand-primary/5 transition-all relative group shadow-sm">
              <MessageSquare size={18} className="group-hover:scale-110 transition-transform" />
              <span className="absolute top-2 right-2 w-2 h-2 bg-brand-primary rounded-full border-2 border-white" />
            </button>
            <button className="w-9 h-9 md:w-10 md:h-10 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-center text-slate-400 hover:text-brand-primary hover:bg-brand-primary/5 transition-all relative group shadow-sm">
              <Bell size={18} className="group-hover:scale-110 transition-transform" />
              <div className="absolute -top-1 -right-1 w-5 h-5 bg-rose-500 rounded-full border-2 border-white flex items-center justify-center">
                <span className="text-[8px] font-black text-white">3</span>
              </div>
            </button>
          </div>

          <div className="relative">
            <button 
              onClick={() => setIsProfileOpen(!isProfileOpen)}
              className="flex items-center gap-3 md:gap-4 hover:opacity-80 transition-opacity"
            >
              <div className="text-right hidden sm:block">
                <p className="text-sm font-black text-slate-900 tracking-tighter leading-none">
                  {user?.firstName} {user?.lastName}
                </p>
                <p className="text-[10px] text-brand-primary font-bold uppercase mt-1 tracking-widest leading-none">
                  Online
                </p>
              </div>
              <div className="w-9 h-9 md:w-10 md:h-10 rounded-xl bg-gradient-to-tr from-slate-100 to-slate-200 border border-slate-200 flex items-center justify-center text-slate-500 overflow-hidden font-black text-sm shadow-inner">
                {user?.firstName?.[0] || 'U'}
              </div>
            </button>

            <AnimatePresence>
              {isProfileOpen && (
                <>
                  <div 
                    className="fixed inset-0 z-10" 
                    onClick={() => setIsProfileOpen(false)}
                  />
                  <motion.div
                    initial={{ opacity: 0, y: 10, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 10, scale: 0.95 }}
                    className="absolute right-0 mt-4 w-56 bg-white rounded-2xl border border-slate-100 shadow-xl z-20 overflow-hidden p-2"
                  >
                    <Link 
                      href="/ProfilePage"
                      onClick={() => setIsProfileOpen(false)}
                      className="flex items-center gap-3 w-full px-4 py-3 text-[10px] font-black uppercase tracking-widest text-slate-600 hover:bg-slate-50 rounded-xl transition-all"
                    >
                      <Settings size={18} className="text-slate-400" />
                      Administrar Perfil
                    </Link>
                    <button 
                      onClick={() => {
                        setIsProfileOpen(false);
                        onLogout();
                      }}
                      className="flex items-center gap-3 w-full px-4 py-3 text-[10px] font-black uppercase tracking-widest text-rose-500 hover:bg-rose-50 rounded-xl transition-all mt-1"
                    >
                      <LogOut size={18} className="text-rose-400" />
                      Cerrar Sesión
                    </button>
                  </motion.div>
                </>
              )}
            </AnimatePresence>
          </div>
        </div>
      </header>
    </>
  );
};