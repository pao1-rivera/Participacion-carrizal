"use client";

import React, { useState } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { Mail, ArrowLeft, Send, CheckCircle } from 'lucide-react';

const ForgotPasswordPage = () => {
  const [email, setEmail] = useState('');
  const [isSent, setIsSent] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSent(true);
  };

  return (
    <div className="flex min-h-[70vh] items-center justify-center">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="w-full max-w-md bg-white p-8 rounded-3xl shadow-xl border border-slate-100"
      >
        <AnimatePresence mode="wait">
          {!isSent ? (
            <motion.div
              key="form"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <div className="text-center mb-8">
                <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-slate-100 text-slate-400">
                  <Mail className="h-8 w-8" />
                </div>
                <h1 className="text-2xl font-bold text-slate-900">¿Olvidaste tu contraseña?</h1>
                <p className="mt-2 text-sm text-slate-500">
                  Ingresa tu correo electrónico registrado y te enviaremos instrucciones para recuperarla.
                </p>
              </div>

              <form onSubmit={handleSubmit} className="space-y-6">
                <div>
                  <label htmlFor="email" className="text-sm font-medium text-slate-700">Correo Electrónico</label>
                  <div className="mt-1 relative">
                    <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none text-slate-400">
                      <Mail className="h-4 w-4" />
                    </div>
                    <input
                      type="email"
                      id="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="block w-full rounded-xl border border-slate-200 py-3 pl-10 pr-4 focus:ring-2 focus:ring-brand-primary/20 focus:border-brand-primary outline-none transition-all"
                      placeholder="tu-correo@ejemplo.com"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  className="w-full flex items-center justify-center gap-2 rounded-xl bg-brand-primary py-3 px-4 font-bold text-white shadow-lg hover:bg-brand-primary/90 transition-all active:scale-95"
                >
                  <Send className="h-4 w-4" /> Enviar instrucciones
                </button>

                <Link
                  href="/login"
                  className="flex items-center justify-center gap-2 text-sm font-medium text-slate-500 hover:text-brand-primary transition-colors"
                >
                  <ArrowLeft className="h-4 w-4" /> Volver al inicio de sesión
                </Link>
              </form>
            </motion.div>
          ) : (
            <motion.div
              key="success"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-center py-4"
            >
              <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-green-100 text-green-600">
                <CheckCircle className="h-10 w-10" />
              </div>
              <h2 className="text-2xl font-bold text-slate-900">¡Correo enviado!</h2>
              <p className="mt-4 text-slate-500">
                Hemos enviado un enlace de recuperación a: <br />
                <span className="font-semibold text-slate-900">{email}</span>
              </p>
              <p className="mt-6 text-sm text-slate-400">
                Si no recibes el correo en unos minutos, revisa tu carpeta de spam.
              </p>
              <div className="mt-10">
                <Link
                  href="/login"
                  className="inline-flex items-center justify-center rounded-full bg-slate-100 py-3 px-8 text-sm font-bold text-slate-700 hover:bg-slate-200 transition-all"
                >
                  Regresar al inicio de sesión
                </Link>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
};

export default ForgotPasswordPage;