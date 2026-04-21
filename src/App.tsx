import React, { Suspense } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
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
    <div className="min-h-screen">
      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <Suspense fallback={<div className="flex h-[50vh] items-center justify-center text-slate-500">Cargando sección...</div>}>
          <Routes>
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />
            <Route path="/forgot-password" element={<ForgotPasswordPage />} />
            
            <Route path="/dashboard" element={
              <ProtectedRoute>
                <DashboardPage />
              </ProtectedRoute>
            } />
            
            <Route path="/profile" element={
              <ProtectedRoute>
                <ProfilePage />
              </ProtectedRoute>
            } />

            <Route path="/" element={<Navigate to="/dashboard" replace />} />
            <Route path="*" element={<div className="flex flex-col items-center justify-center gap-4 py-20">
              <h1 className="text-4xl font-bold text-slate-900">404</h1>
              <p className="text-slate-500">Página no encontrada</p>
              <Navigate to="/dashboard" replace />
            </div>} />
          </Routes>
        </Suspense>
      </main>
      
      <footer className="mt-auto border-t border-slate-200 bg-white py-8">
        <div className="mx-auto max-w-7xl px-4 text-center text-sm text-slate-500 sm:px-6 lg:px-8">
          <p>© {new Date().getFullYear()} Secretaría de Participación Ciudadana y Poder Popular. Alcaldía de Carrizal.</p>
          <p className="mt-1">Diseñado para el fortalecimiento del Poder Popular.</p>
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
