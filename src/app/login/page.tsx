"use client";

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import { motion } from 'framer-motion';
import { Lock, Mail, Eye, EyeOff } from 'lucide-react';

const LoginPage = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loginMessage, setLoginMessage] = useState<{ text: string; type: 'error' | 'success' | '' }>({ text: '', type: '' });
  const { login, isLoading } = useAuth();
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginMessage({ text: '', type: '' });

    try {
      await login(email, password);
      setLoginMessage({ text: '¡Bienvenido! Inicio de sesión exitoso. Redirigiendo...', type: 'success' });
      setTimeout(() => {
        router.push('/dashboard');
      }, 1500);
    } catch (error) {
      console.error('Login failed', error);
      setLoginMessage({
        text: 'Credenciales inválidas. Por favor, verifique su correo y contraseña.',
        type: 'error',
      });
    }
  };

  return (
    <div className="min-h-screen grid grid-cols-12 bg-white overflow-hidden">
      {/* Panel lateral izquierdo */}
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
          <span style={{ color: '#009b93' }}>
            <p>© 2026 Secretaría de Participación Ciudadana y Poder Popular • Alcaldía del Municipio Carrizal</p>
          </span>
        </div>
      </div>

      {/* Panel derecho con imagen de fondo y glassmorphism */}
      <div className="col-span-12 lg:col-span-8 p-12 flex items-center justify-center bg-[url('/Carrizal.png')] bg-cover bg-center bg-white/25">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full max-w-md space-y-8"
        >
          <div className="bg-white/70 p-8 rounded-2xl shadow-xl border border-gray-100/30 relative overflow-hidden backdrop-blur-md">
            <div className="absolute top-0 left-0 right-0 h-1 bg-brand-primary"></div>

            <div className="text-center mb-8">
              <h3 className="text-2xl font-bold text-slate-900 mb-2">Ingrese al Sistema</h3>
              <p className="text-slate-500 text-sm">Identifíquese para acceder a sus funciones administrativas</p>
            </div>

            {/* Mensaje inline */}
            {loginMessage.text && (
              <div
                className={`mb-4 p-3 rounded-xl border ${
                  loginMessage.type === 'error'
                    ? 'bg-red-50/90 border-red-200 text-red-800'
                    : 'bg-green-50/90 border-green-200 text-green-800'
                }`}
              >
                <p className="text-sm">{loginMessage.text}</p>
              </div>
            )}

            <form className="space-y-6" onSubmit={handleSubmit}>
              <div className="space-y-5">
                <div>
                  <label htmlFor="email" className="text-sm font-medium text-slate-700 block mb-2">
                    Correo Electrónico
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 flex items-center pl-4 pointer-events-none text-slate-500">
                      <Mail className="h-4 w-4" />
                    </div>
                    <input
                      id="email"
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="block w-full rounded-xl border border-slate-200 bg-white/80 py-3.5 pl-11 pr-4 focus:ring-2 focus:ring-brand-primary/20 focus:border-brand-primary focus:bg-white outline-none transition-all text-sm"
                      placeholder="ejemplo@carrizal.gov.ve"
                    />
                  </div>
                </div>
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label htmlFor="password" className="text-sm font-medium text-slate-700 block">
                      Contraseña
                    </label>
                  </div>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 flex items-center pl-4 pointer-events-none text-slate-500">
                      <Lock className="h-4 w-4" />
                    </div>
                    <input
                      id="password"
                      type={showPassword ? 'text' : 'password'}
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="block w-full rounded-xl border border-slate-200 bg-white/80 py-3.5 pl-11 pr-12 focus:ring-2 focus:ring-brand-primary/20 focus:border-brand-primary focus:bg-white outline-none transition-all text-sm"
                      placeholder="••••••••"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute inset-y-0 right-0 pr-4 flex items-center text-slate-400 hover:text-brand-primary transition-colors"
                    >
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                  <div className="text-right mt-2">
                    <Link href="/forgot-password" className="text-xs font-semibold text-brand-primary hover:underline">
                      ¿Olvidó su Contraseña?
                    </Link>
                  </div>
                </div>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full flex items-center justify-center gap-2 rounded-xl bg-brand-primary py-4 px-6 text-sm font-bold text-white shadow-lg shadow-brand-primary/10 hover:bg-brand-secondary transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading ? 'Cargando...' : 'Acceder'}
              </button>

              <p className="text-center mt-2 text-[11px] font-semibold text-slate-700 uppercase tracking-wide">
                ¿Requiere una cuenta?{' '}
                <Link href="/register" className="text-brand-primary hover:underline decoration-2 underline-offset-2">
                  Solicite su registro aquí
                </Link>
              </p>
            </form>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default LoginPage;