import React, { Suspense } from 'react';
import { BrowserRouter, Routes, Route, Navigate, Link } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { Navbar } from './components/layout/Navbar';
import { motion } from 'motion/react';

// Lazy load pages for performance
const LoginPage = React.lazy(() => import('./pages/LoginPage'));
const RegisterPage = React.lazy(() => import('./pages/RegisterPage'));
const ForgotPasswordPage = React.lazy(() => import('./pages/ForgotPasswordPage'));
const DashboardPage = React.lazy(() => import('./pages/DashboardPage'));
const ProfilePage = React.lazy(() => import('./pages/ProfilePage'));

const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, isLoading } = useAuth();

  if (isLoading) return <div className="flex h-screen items-center justify-center">Cargando...</div>;
  if (!user) return <Navigate to="/login" replace />;

  return <>{children}</>;
};

const AppContent = () => {
  return (
    <div className="flex flex-col min-h-screen bg-slate-50/30">
      <main className="flex-1">
        <Suspense fallback={<div className="flex h-[50vh] items-center justify-center text-slate-500 font-bold italic tracking-tighter">Cargando sección...</div>}>
          <Routes>
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />
            <Route path="/forgot-password" element={<ForgotPasswordPage />} />
            
            <Route path="/dashboard/*" element={
              <ProtectedRoute>
                <DashboardPage />
              </ProtectedRoute>
            } />
            
            <Route path="/profile" element={
              <ProtectedRoute>
                <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
                  <ProfilePage />
                </div>
              </ProtectedRoute>
            } />

            <Route path="/" element={<Navigate to="/dashboard" replace />} />
            <Route path="*" element={<div className="flex flex-col items-center justify-center gap-4 py-32">
              <div className="h-16 w-16 rounded-2xl bg-brand-primary text-white flex items-center justify-center text-2xl font-black italic">404</div>
              <h1 className="text-xl font-bold text-slate-900 tracking-tight">Página no encontrada</h1>
              <p className="text-slate-500 text-sm">El recurso que buscas no existe o ha sido movido.</p>
              <Link to="/dashboard" className="mt-4 text-brand-primary font-bold hover:underline underline-offset-4">Volver al inicio</Link>
            </div>} />
          </Routes>
        </Suspense>
      </main>
      
      {/* Conditionally render footer or keep it minimal for app-like pages */}
      <footer className="mt-auto border-t border-slate-200 bg-white py-6">
        <div className="mx-auto max-w-7xl px-4 text-center text-[10px] font-bold text-slate-400 uppercase tracking-widest sm:px-6 lg:px-8">
          <p>© {new Date().getFullYear()} Secretaría de Participación Ciudadana — Alcaldía de Carrizal.</p>
        </div>
      </footer>
    </div>
  );
};

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppContent />
      </AuthProvider>
    </BrowserRouter>
  );
}
