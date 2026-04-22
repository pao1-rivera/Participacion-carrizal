import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { motion } from 'motion/react';
import { Lock, Mail, ArrowRight } from 'lucide-react';

const LoginPage = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const { login, isLoading } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await login(email, password);
      navigate('/dashboard');
    } catch (error) {
      console.error('Login failed', error);
    }
  };

  return (
    <div className="min-h-screen grid grid-cols-12 bg-white overflow-hidden">
      {/* Left Sidebar: Branding */}
      <div className="hidden lg:flex col-span-4 bg-brand-secondary p-12 flex-col justify-between text-white relative">
        <div className="relative z-10">
          <h2 className="text-4xl font-light mb-6 leading-tight italic">
            Bienvenido al Sistema de Gestión del <span className="font-bold">Poder Popular</span>
          </h2>
          <p className="text-cyan-100 text-lg mb-8 leading-relaxed">
            Plataforma centralizada para el registro y validación de las instancias del autogobierno comunitario en el Municipio Carrizal.
          </p>
          <ul className="space-y-4">
            <li className="flex items-start gap-3">
              <div className="w-5 h-5 rounded-full bg-brand-primary flex-shrink-0 flex items-center justify-center text-[10px] font-bold">✓</div>
              <span className="text-cyan-50 text-sm">Validación RBAC de perfiles reales</span>
            </li>
            <li className="flex items-start gap-3">
              <div className="w-5 h-5 rounded-full bg-brand-primary flex-shrink-0 flex items-center justify-center text-[10px] font-bold">✓</div>
              <span className="text-cyan-50 text-sm">Vinculación administrativa directa</span>
            </li>
            <li className="flex items-start gap-3">
              <div className="w-5 h-5 rounded-full bg-brand-primary flex-shrink-0 flex items-center justify-center text-[10px] font-bold">✓</div>
              <span className="text-cyan-50 text-sm">Monitoreo de gestión en tiempo real</span>
            </li>
          </ul>
        </div>
        
        {/* Decorative background element */}
        <div className="absolute -bottom-24 -left-24 w-80 h-80 bg-brand-primary rounded-full blur-3xl opacity-20"></div>
        
        <div className="text-[10px] font-bold uppercase tracking-widest text-cyan-300 relative z-10">
          <p>© 2024 Secretaría de Participación Ciudadana • Alcaldía de Carrizal</p>
        </div>
      </div>

      {/* Right Section: Form */}
      <div className="col-span-12 lg:col-span-8 p-12 flex items-center justify-center bg-gray-50/50">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full max-w-md space-y-8"
        >
          <div className="text-center mb-10">
            <h3 className="text-2xl font-bold text-gray-800 mb-2">Ingreso al Sistema</h3>
            <p className="text-gray-500 text-sm">Identifíquese para acceder a sus funciones administrativas</p>
          </div>

          <div className="bg-white p-8 rounded-2xl shadow-xl shadow-gray-200/50 border border-gray-100 relative overflow-hidden">
             {/* Accent line above the form teaser */}
            <div className="absolute top-0 left-0 right-0 h-1 bg-brand-primary"></div>

            <form className="space-y-6" onSubmit={handleSubmit}>
              <div className="space-y-5">
                <div>
                  <label htmlFor="email-address" className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1.5">
                    Correo Electrónico
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 flex items-center pl-4 pointer-events-none text-gray-400">
                      <Mail className="h-4 w-4" />
                    </div>
                    <input
                      id="email-address"
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="block w-full rounded-xl border border-gray-200 bg-gray-50 py-3.5 pl-11 pr-4 focus:ring-2 focus:ring-brand-primary/20 focus:border-brand-primary focus:bg-white outline-none transition-all text-sm"
                      placeholder="ejemplo@carrizal.gov.ve"
                    />
                  </div>
                </div>
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label htmlFor="password" className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider">
                      Contraseña
                    </label>
                    <Link to="/forgot-password" title="Recuperar contraseña" className="text-[10px] font-bold text-brand-primary hover:underline">
                      ¿Olvidó su contraseña?
                    </Link>
                  </div>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 flex items-center pl-4 pointer-events-none text-gray-400">
                      <Lock className="h-4 w-4" />
                    </div>
                    <input
                      id="password"
                      type="password"
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="block w-full rounded-xl border border-gray-200 bg-gray-50 py-3.5 pl-11 pr-4 focus:ring-2 focus:ring-brand-primary/20 focus:border-brand-primary focus:bg-white outline-none transition-all text-sm"
                      placeholder="••••••••"
                    />
                  </div>
                </div>
              </div>

              <div>
                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full flex items-center justify-center gap-2 rounded-xl bg-brand-primary py-4 px-6 text-sm font-bold text-white shadow-lg shadow-brand-primary/10 hover:bg-brand-secondary transition-all active:scale-95 disabled:opacity-50"
                >
                  {isLoading ? 'Cargando...' : 'Acceder'}
                </button>
              </div>

              {/* Dev Quick Access */}
              <div className="pt-4 space-y-3">
                <div className="relative">
                  <div className="absolute inset-0 flex items-center"><span className="w-full border-t border-gray-100"></span></div>
                  <div className="relative flex justify-center text-[8px] font-bold uppercase tracking-widest text-gray-300">
                    <span className="bg-white px-2">Acceso Rápido (Demo)</span>
                  </div>
                </div>
                <div className="flex gap-2">
                  <button 
                    type="button" 
                    onClick={() => { setEmail('admin@carrizal.gob.ve'); setPassword('password'); }}
                    className="flex-1 py-2 rounded-lg bg-slate-50 text-[9px] font-black uppercase text-slate-400 border border-slate-100 hover:bg-slate-100 transition-colors"
                  >
                    Admin
                  </button>
                  <button 
                    type="button" 
                    onClick={() => { setEmail('comuna@carrizal.gob.ve'); setPassword('password'); }}
                    className="flex-1 py-2 rounded-lg bg-indigo-50 text-[9px] font-black uppercase text-indigo-500 border border-indigo-100 hover:bg-indigo-100 transition-colors"
                  >
                    Comuna
                  </button>
                  <button 
                    type="button" 
                    onClick={() => { setEmail('consejo@test.com'); setPassword('password'); }}
                    className="flex-1 py-2 rounded-lg bg-emerald-50 text-[9px] font-black uppercase text-emerald-500 border border-emerald-100 hover:bg-emerald-100 transition-colors"
                  >
                    Consejo
                  </button>
                </div>
              </div>
            </form>
          </div>

          <p className="text-center mt-10 text-[11px] font-semibold text-gray-400 uppercase tracking-wide">
            ¿Requiere una cuenta? {' '}
            <Link to="/register" className="text-brand-primary hover:underline decoration-2 underline-offset-2">
              Solicite su registro aquí
            </Link>
          </p>
        </motion.div>
      </div>
    </div>
  );
};

export default LoginPage;
