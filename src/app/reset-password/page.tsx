"use client";

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { Lock, ArrowLeft, CheckCircle, Loader2, XCircle, Eye, EyeOff } from 'lucide-react';
import { supabase } from '@/app/lib/supabaseClient';

// ============================================================
// COMPONENTE INTERNO (con la lógica y el formulario)
// ============================================================
const ResetPasswordContent = () => {
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [formMessage, setFormMessage] = useState<{ text: string; type: 'error' | 'success' | 'warning' | '' }>({ text: '', type: '' });
  const [status, setStatus] = useState<'verifying' | 'ready' | 'error' | 'success'>('verifying');
  const [isLoading, setIsLoading] = useState(false);

  // Verificar el token de recuperación al montar
  useEffect(() => {
    let isMounted = true;

    const verificarYEstablecerSesion = async () => {
      try {
        const hash = window.location.hash;
        if (!hash) {
          console.log("No se detectó ningún hash en la URL");
          if (isMounted) {
            setStatus('error');
          }
          return;
        }

        const params = new URLSearchParams(hash.replace('#', ''));
        const accessToken = params.get('access_token');
        const refreshToken = params.get('refresh_token');
        const type = params.get('type');

        if (!accessToken || type !== 'recovery') {
          if (isMounted) {
            setStatus('error');
          }
          return;
        }

        const { data, error } = await supabase.auth.setSession({
          access_token: accessToken,
          refresh_token: refreshToken || '',
        });

        if (error) {
          console.error("Error de Supabase al setear la sesión:", error);
          if (isMounted) {
            setStatus('error');
          }
          return;
        }

        if (data?.session) {
          console.log("Sesión de recuperación establecida con éxito para:", data.session.user?.email);
          if (isMounted) {
            setStatus('ready');
          }
        } else {
          if (isMounted) {
            setStatus('error');
          }
        }

      } catch (err: any) {
        console.error("Error crítico en el proceso de recuperación:", err);
        if (isMounted) {
          setStatus('error');
        }
      }
    };

    verificarYEstablecerSesion();

    return () => {
      isMounted = false;
    };
  }, []);

  // Enviar el formulario
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setFormMessage({ text: '', type: '' });

    if (newPassword !== confirmPassword) {
      setFormMessage({ text: 'Las contraseñas ingresadas no son iguales.', type: 'warning' });
      setIsLoading(false);
      return;
    }

    if (newPassword.length < 6) {
      setFormMessage({ text: 'La contraseña debe tener al menos 6 caracteres.', type: 'warning' });
      setIsLoading(false);
      return;
    }

    try {
      const { error } = await supabase.auth.updateUser({
        password: newPassword,
      });

      if (error) {
        setFormMessage({ text: error.message, type: 'error' });
      } else {
        setStatus('success');
        setTimeout(() => {
          window.location.href = '/login';
        }, 3000);
      }
    } catch (err: any) {
      setFormMessage({ text: err.message || 'Ocurrió un error inesperado.', type: 'error' });
    } finally {
      setIsLoading(false);
    }
  };

  // ==================== RENDERIZADO CONDICIONAL ====================

  if (status === 'verifying') {
    return (
      <div className="col-span-12 lg:col-span-8 p-12 flex items-center justify-center bg-[url('/Carrizal.png')] bg-cover bg-center bg-white/25">
        <div className="text-center space-y-4 bg-white/70 p-8 rounded-3xl backdrop-blur-md">
          <Loader2 className="h-12 w-12 animate-spin text-brand-primary mx-auto" />
          <p className="text-slate-600 font-medium">Validando enlace de recuperación...</p>
        </div>
      </div>
    );
  }

  if (status === 'error') {
    return (
      <div className="col-span-12 lg:col-span-8 p-12 flex items-center justify-center bg-[url('/Carrizal.png')] bg-cover bg-center bg-white/25">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="w-full max-w-md bg-white/70 p-8 rounded-3xl shadow-xl border border-slate-100/30 backdrop-blur-md text-center"
        >
          <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-red-100 text-red-600">
            <XCircle className="h-10 w-10" />
          </div>
          <h2 className="text-2xl font-bold text-slate-900 mb-4">Enlace no válido</h2>
          <p className="text-slate-600 mb-8 text-sm">
            El enlace de recuperación no es válido o ha expirado. Solicita uno nuevo.
          </p>
          <Link
            href="/forgot-password"
            className="inline-flex items-center justify-center rounded-xl bg-brand-primary py-3 px-6 text-sm font-bold text-white hover:bg-brand-primary/90 transition-all"
          >
            Solicitar nuevo enlace
          </Link>
        </motion.div>
      </div>
    );
  }

  if (status === 'success') {
    return (
      <div className="col-span-12 lg:col-span-8 p-12 flex items-center justify-center bg-[url('/Carrizal.png')] bg-cover bg-center bg-white/25">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="w-full max-w-md bg-white/70 p-8 rounded-3xl shadow-xl border border-slate-100/30 backdrop-blur-md text-center"
        >
          <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-green-100 text-green-600">
            <CheckCircle className="h-10 w-10" />
          </div>
          <h2 className="text-2xl font-bold text-slate-900 mb-4">¡Contraseña actualizada!</h2>
          <p className="text-slate-600 mb-8 text-sm">
            Tu contraseña se ha actualizado correctamente. Serás redirigido al inicio de sesión en unos segundos.
          </p>
          <Link
            href="/login"
            className="inline-flex items-center justify-center rounded-xl bg-brand-primary py-3 px-8 text-sm font-bold text-white hover:bg-brand-primary/90 transition-all"
          >
            Ir al inicio de sesión
          </Link>
        </motion.div>
      </div>
    );
  }

  // ==================== ESTADO 'ready' (formulario) ====================
  return (
    <div className="col-span-12 lg:col-span-8 p-12 flex items-center justify-center bg-[url('/Carrizal.png')] bg-cover bg-center bg-white/25">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md space-y-8"
      >
        {/* TARJETA DEL FORMULARIO CON FONDO TRANSPARENTE Y DESENFOQUE */}
        <div className="bg-white/70 p-8 rounded-2xl shadow-xl shadow-gray-200/50 border border-gray-100/30 relative overflow-hidden backdrop-blur-md">
          <div className="absolute top-0 left-0 right-0 h-1 bg-brand-primary"></div>

          <div className="text-center mb-8">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-slate-100 text-slate-400">
              <Lock className="h-8 w-8" />
            </div>
            <h1 className="text-2xl font-bold text-slate-900">Nueva Contraseña</h1>
            <p className="mt-2 text-sm text-slate-500">
              Ingresa tu nueva contraseña para recuperar el acceso.
            </p>
          </div>

          {/* Mensaje del formulario */}
          {formMessage.text && (
            <div
              className={`mb-4 p-3 rounded-xl border ${
                formMessage.type === 'error'
                  ? 'bg-red-50 border-red-200 text-red-800'
                  : formMessage.type === 'warning'
                  ? 'bg-yellow-50 border-yellow-200 text-yellow-800'
                  : formMessage.type === 'success'
                  ? 'bg-green-50 border-green-200 text-green-800'
                  : 'bg-blue-50 border-blue-200 text-blue-800'
              }`}
            >
              <p className="text-sm">{formMessage.text}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label htmlFor="password" className="text-sm font-medium text-slate-700 block mb-2">
                Nueva Contraseña
              </label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  id="password"
                  required
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  disabled={isLoading}
                  className="block w-full rounded-xl border border-slate-200 py-3 pl-4 pr-12 focus:ring-2 focus:ring-brand-primary/20 focus:border-brand-primary outline-none transition-all disabled:bg-slate-50 disabled:cursor-not-allowed text-sm"
                  placeholder="Mínimo 6 caracteres"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-4 flex items-center text-gray-400 hover:text-brand-primary transition-colors"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            <div>
              <label htmlFor="confirmPassword" className="text-sm font-medium text-slate-700 block mb-2">
                Confirmar Contraseña
              </label>
              <div className="relative">
                <input
                  type={showConfirmPassword ? "text" : "password"}
                  id="confirmPassword"
                  required
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  disabled={isLoading}
                  className="block w-full rounded-xl border border-slate-200 py-3 pl-4 pr-12 focus:ring-2 focus:ring-brand-primary/20 focus:border-brand-primary outline-none transition-all disabled:bg-slate-50 disabled:cursor-not-allowed text-sm"
                  placeholder="Repite tu nueva contraseña"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute inset-y-0 right-0 pr-4 flex items-center text-gray-400 hover:text-brand-primary transition-colors"
                >
                  {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading || newPassword !== confirmPassword || newPassword.length < 6}
              className="w-full flex items-center justify-center gap-2 rounded-xl bg-brand-primary py-3 px-4 font-bold text-white shadow-lg hover:bg-brand-primary/90 transition-all active:scale-95 disabled:bg-brand-primary/50 disabled:cursor-not-allowed disabled:active:scale-100"
            >
              {isLoading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Actualizando...
                </>
              ) : (
                'Actualizar Contraseña'
              )}
            </button>

            <Link
              href="/login"
              className="flex items-center justify-center gap-2 text-sm font-medium text-slate-500 hover:text-brand-primary transition-colors"
            >
              <ArrowLeft className="h-4 w-4" />
              Volver al inicio de sesión
            </Link>
          </form>
        </div>
      </motion.div>
    </div>
  );
};

// ============================================================
// COMPONENTE PRINCIPAL (página)
// ============================================================
const ResetPasswordPage = () => {
  return (
    <div className="min-h-screen grid grid-cols-12 bg-white overflow-hidden">
      {/* Lateral izquierdo – idéntico al Login */}
      <div className="hidden lg:flex col-span-4 bg-brand-secondary p-12 flex-col justify-between text-white relative">
        <div className="relative z-10">
          <h2 className="text-4xl font-light mb-6 leading-tight italic text-white">
            Bienvenido al Sistema de Gestión del <span className="font-bold">Poder Popular</span>
          </h2>
          <p className="text-white text-lg mb-8 leading-relaxed">
            <span style={{ color: '#009b93' }}>Plataforma centralizada para el registro y validación de las instancias del autogobierno comunitario en el Municipio Carrizal.</span>
          </p>
          <ul className="space-y-4">
            <li className="flex items-start gap-3">
              <div className="w-5 h-5 rounded-full bg-brand-primary shrink-0 flex items-center justify-center text-[10px] font-bold">✓</div>
              <span className="text-white text-sm">Validación RBAC de perfiles reales</span>
            </li>
            <li className="flex items-start gap-3">
              <div className="w-5 h-5 rounded-full bg-brand-primary shrink-0 flex items-center justify-center text-[10px] font-bold">✓</div>
              <span className="text-white text-sm">Vinculación administrativa directa</span>
            </li>
            <li className="flex items-start gap-3">
              <div className="w-5 h-5 rounded-full bg-brand-primary shrink-0 flex items-center justify-center text-[10px] font-bold">✓</div>
              <span className="text-white text-sm">Monitoreo de gestión en tiempo real</span>
            </li>
          </ul>
        </div>

        <div className="absolute -bottom-24 -left-24 w-80 h-80 bg-brand-primary rounded-full blur-3xl opacity-20"></div>

        <div className="text-[10px] font-bold uppercase tracking-widest text-brand-accent relative z-10">
          <span style={{ color: '#009b93' }}> <p>© 2026 Secretaría de Participación Ciudadana y Poder Popular • Alcaldía del Municipio Carrizal</p></span>
        </div>
      </div>

      {/* Contenido dinámico derecho */}
      <React.Suspense fallback={
        <div className="col-span-12 lg:col-span-8 flex min-h-[70vh] items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-brand-primary" />
        </div>
      }>
        <ResetPasswordContent />
      </React.Suspense>
    </div>
  );
};

export default ResetPasswordPage;