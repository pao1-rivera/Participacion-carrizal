"use client";

import React, { useState } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { Mail, ArrowLeft, Send, CheckCircle, Loader2 } from 'lucide-react';
import { supabase } from '@/app/lib/supabaseClient';

const ForgotPasswordPage = () => {
  const [email, setEmail] = useState('');
  const [isSent, setIsSent] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [formMessage, setFormMessage] = useState<{ text: string; type: 'error' | 'warning' | 'success' | '' }>({ text: '', type: '' });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setFormMessage({ text: '', type: '' });

    if (!email || !email.includes('@')) {
      setFormMessage({ text: 'Por favor, ingresa un correo electrónico válido.', type: 'warning' });
      setIsLoading(false);
      return;
    }

    try {
      const { error: supabaseError } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`,
      });

      if (supabaseError) {
        setFormMessage({ text: supabaseError.message, type: 'error' });
      } else {
        setIsSent(true);
      }
    } catch (err: any) {
      setFormMessage({ text: err.message || 'Ocurrió un error inesperado.', type: 'error' });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen grid grid-cols-12 bg-white overflow-hidden">
      {/* Panel Lateral - idéntico al Login */}
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

      {/* Contenedor del Formulario - con imagen de fondo y opacidad */}
      <div className="col-span-12 lg:col-span-8 p-12 flex items-center justify-center bg-[url('/Carrizal.png')] bg-cover bg-center bg-white/25">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="w-full max-w-md"
        >
          <AnimatePresence mode="wait">
            {!isSent ? (
              <motion.div
                key="form"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="space-y-8"
              >
                {/* Tarjeta del formulario con glassmorphism */}
                <div className="bg-white/70 p-8 rounded-2xl shadow-xl  border border-gray-100/30 relative overflow-hidden backdrop-blur-md">
                  <div className="absolute top-0 left-0 right-0 h-1 bg-brand-primary"></div>

                  <div className="text-center mb-10">
                    <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-slate-100/80 text-slate-400">
                      <Mail className="h-8 w-8" />
                    </div>
                    <h1 className="text-2xl font-bold text-slate-900">¿Olvidaste tu contraseña?</h1>
                    <p className="mt-2 text-sm text-slate-500">
                      Ingresa tu correo electrónico registrado y te enviaremos instrucciones para recuperarla.
                    </p>
                  </div>

                  {/* Mensaje inline */}
                  {formMessage.text && (
                    <div
                      className={`mb-4 p-3 rounded-xl border ${
                        formMessage.type === 'error'
                          ? 'bg-red-50/90 border-red-200 text-red-800'
                          : formMessage.type === 'warning'
                          ? 'bg-yellow-50/90 border-yellow-200 text-yellow-800'
                          : 'bg-green-50/90 border-green-200 text-green-800'
                      }`}
                    >
                      <p className="text-sm">{formMessage.text}</p>
                    </div>
                  )}

                  <form onSubmit={handleSubmit} className="space-y-6">
                    <div>
                      <label htmlFor="email" className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1.5">
                        Correo Electrónico
                      </label>
                      <div className="mt-1 relative">
                        <div className="absolute inset-y-0 left-0 flex items-center pl-4 pointer-events-none text-slate-400">
                          <Mail className="h-4 w-4" />
                        </div>
                        <input
                          type="email"
                          id="email"
                          required
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          disabled={isLoading}
                          className="block w-full rounded-xl border border-slate-200 bg-white/80 py-3.5 pl-11 pr-4 focus:ring-2 focus:ring-brand-primary/20 focus:border-brand-primary focus:bg-white outline-none transition-all text-sm disabled:bg-slate-50/70 disabled:cursor-not-allowed"
                          placeholder="tu-correo@ejemplo.com"
                        />
                      </div>
                    </div>

                    <button
                      type="submit"
                      disabled={isLoading || !email}
                      className="w-full flex items-center justify-center gap-2 rounded-xl bg-brand-primary py-4 px-6 text-sm font-bold text-white shadow-lg shadow-brand-primary/10 hover:bg-brand-secondary transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed disabled:active:scale-100"
                    >
                      {isLoading ? (
                        <>
                          <Loader2 className="h-4 w-4 animate-spin" />
                          Enviando...
                        </>
                      ) : (
                        <>
                          <Send className="h-4 w-4" />
                          Enviar instrucciones
                        </>
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
            ) : (
              <motion.div
                key="success"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-white/70 p-8 rounded-2xl shadow-xl  border border-gray-100/30 relative overflow-hidden backdrop-blur-md text-center"
              >
                <div className="absolute top-0 left-0 right-0 h-1 bg-brand-primary"></div>
                <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-green-100/80 text-green-600">
                  <CheckCircle className="h-10 w-10" />
                </div>
                <h2 className="text-2xl font-bold text-slate-900">¡Correo enviado!</h2>
                <p className="mt-4 text-slate-700 text-sm">
                  Hemos enviado un enlace de recuperación a: <br />
                  <span className="font-semibold text-slate-900">{email}</span>
                </p>
                <p className="mt-6 text-xs text-slate-700">
                  Si no recibes el correo en unos minutos, revisa tu carpeta de spam.
                </p>
                <div className="mt-10">
                  <Link
                    href="/login"
                    className="inline-flex items-center justify-center rounded-full bg-slate-100/80 py-3 px-8 text-sm font-bold text-slate-700 hover:bg-slate-200/90 transition-all"
                  >
                    Regresar al inicio de sesión
                  </Link>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      </div>
    </div>
  );
};

export default ForgotPasswordPage;