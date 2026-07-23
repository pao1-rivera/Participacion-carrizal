// components/dashboard/admin/AdminDashboard.tsx
"use client";

import React, { useState, useEffect } from 'react';
import { Sliders, Loader2 } from 'lucide-react';
import { Sidebar } from '@/app/layout/Sidebar';
import { DashboardNavbar } from '../common/DashboardNavbar';
import { DashboardPrincipal } from './secciones-sidebar/DashboardPrincipal';
import { ListaUsuarios } from './secciones-sidebar/ListaUsuarios';
import { LogsAuditoria } from './secciones-sidebar/LogsAuditoria';
import { RespaldosDB } from './secciones-sidebar/RespaldosDB';
import { Alertas } from './secciones-sidebar/Alertas';
import { motion, AnimatePresence } from 'framer-motion';
import { fetchAdminMetrics, AdminMetrics } from '../../../lib/adminMetrics';

interface AdminDashboardProps {
  user: any;
  onLogout: () => void;
}

export const AdminDashboard: React.FC<AdminDashboardProps> = ({ user, onLogout }) => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [metrics, setMetrics] = useState<AdminMetrics | null>(null);
  const [loadingMetrics, setLoadingMetrics] = useState(true);
  const [liveLogConsole, setLiveLogConsole] = useState<string[]>([
    "[SYSTEM] Inicializando módulo de telemetría municipal...",
    "[DATABASE] Conexión establecida con PostgreSQL en Cloud Run.",
    "[SECURITY] Políticas de cifrado de autenticación Supabase cargadas.",
    "[INTEGRATION] Portal SITUR en línea (Sincronización en 24h)."
  ]);

  // Cargar métricas reales
  useEffect(() => {
    const loadMetrics = async () => {
      try {
        const data = await fetchAdminMetrics();
        setMetrics(data);
      } catch (error) {
        console.error('Error cargando métricas:', error);
        // Si falla, establecer valores por defecto para no romper la UI
        setMetrics({
          totalUsers: 0,
          activeUsers: 0,
          pendingUsers: 0,
          alertsCount: 0,
          storageUsed: 0,
          storageLimit: 10 * 1024 * 1024 * 1024,
          databaseSize: 0,
          totalRows: 0,
        });
      } finally {
        setLoadingMetrics(false);
      }
    };
    loadMetrics();

    // Actualizar métricas cada 60 segundos
    const interval = setInterval(loadMetrics, 60000);
    return () => clearInterval(interval);
  }, []);

  // Actualizar logs de consola con información de métricas
  useEffect(() => {
    if (!metrics) return;
    const updateLogs = () => {
      const now = new Date().toLocaleTimeString();
      const storageGB = (metrics.storageUsed / (1024 * 1024 * 1024)).toFixed(2);
      const dbGB = (metrics.databaseSize / (1024 * 1024 * 1024)).toFixed(2);
      setLiveLogConsole(prev => {
        const newLogs = [
          `[${now}] Usuarios registrados: ${metrics.totalUsers} (${metrics.activeUsers} activos)`,
          `[${now}] Almacenamiento usado: ${storageGB} GB de ${(metrics.storageLimit / (1024**3)).toFixed(0)} GB`,
          `[${now}] Tamaño de la base de datos: ${dbGB} GB`,
          `[${now}] Filas en tablas principales: ${metrics.totalRows.toLocaleString()}`,
          ...prev.slice(0, 2) // mantener los primeros mensajes de sistema
        ];
        return newLogs.slice(0, 6); // máximo 6 líneas
      });
    };
    updateLogs();
    const logInterval = setInterval(updateLogs, 30000);
    return () => clearInterval(logInterval);
  }, [metrics]);

  // ========== RENDERIZADO ==========
  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard':
        if (loadingMetrics || !metrics) {
          return (
            <div className="flex justify-center items-center h-64">
              <Loader2 className="animate-spin text-brand-primary h-8 w-8" />
              <span className="ml-2 text-slate-500">Cargando métricas...</span>
            </div>
          );
        }
        return (
          <DashboardPrincipal
            totalUserCount={metrics.totalUsers}
            activeUserCount={metrics.activeUsers}
            pendingUserCount={metrics.pendingUsers}
            alertsCount={metrics.alertsCount}
            liveLogConsole={liveLogConsole}
            storageUsed={metrics.storageUsed}
            storageLimit={metrics.storageLimit}
            databaseSize={metrics.databaseSize}
            totalRows={metrics.totalRows}
          />
        );

      case 'alertas':
        return <Alertas />;

      case 'lista_usuarios':
        return <ListaUsuarios />;

      case 'logs_auditoria':
        return <LogsAuditoria />;

      case 'respaldos_db':
        return <RespaldosDB />;

      default:
        return <div className="p-8 text-center text-slate-500">Sección no configurada</div>;
    }
  };

  // Responsiveness (igual que antes)
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth < 1024) {
        setIsSidebarOpen(false);
      } else {
        setIsSidebarOpen(true);
      }
    };
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return (
    <div className="flex h-screen bg-[#fcfdfe] font-sans">
      <Sidebar 
        user={user}
        activeSection={activeTab}
        setActiveSection={setActiveTab}
        isSidebarOpen={isSidebarOpen}
        setIsSidebarOpen={setIsSidebarOpen}
        isMobileMenuOpen={isMobileMenuOpen}
        setIsMobileMenuOpen={setIsMobileMenuOpen}
        onLogout={onLogout}
      />

      <main className="flex-1 flex flex-col pt-16 lg:pt-0 overflow-hidden">
        <DashboardNavbar 
          user={user}
          onMobileMenuOpen={() => setIsMobileMenuOpen(true)}
          onLogout={onLogout}
          roleIcon={<Sliders size={24} />}
        />

        <div className="flex-1 overflow-y-auto overflow-x-hidden p-6 lg:p-10 custom-scrollbar">
          <AnimatePresence mode="wait">
            {renderContent()}
          </AnimatePresence>
        </div>
      </main>
    </div>
  );
};