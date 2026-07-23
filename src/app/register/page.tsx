"use client";

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Users, 
  Building2, 
  Home, 
  ChevronRight, 
  ChevronLeft,
  CheckCircle2,
  ArrowLeft,
  Eye,
  EyeOff
} from 'lucide-react';
import { Role } from '@/types';
import { cn } from '@/app/lib/utils';
import { AlertModal } from '@/app/components/AlertModal';

const rolesList: { id: Role; title: string; description: string; icon: any }[] = [
  { id: 'sala_autogobierno', title: 'Sala de Autogobierno', description: 'Vinculado a comunas o circuitos', icon: Home },
  { id: 'comuna', title: 'Comuna', description: 'Instancia de autogobierno comunal', icon: Building2 },
  { id: 'consejo_comunal', title: 'Consejo Comunal', description: 'Instancia base de participación', icon: Users },
];

const registerSchema = z.object({
  email: z.string().email('Correo inválido'),
  password: z.string()
    .min(8, 'Mínimo 8 caracteres')
    .regex(
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/,
      'Debe tener minúscula, mayúscula, número y carácter especial'
    ),
  confirmPassword: z.string(),
  nombre: z.string()
    .min(2, 'Obligatorio')
    .regex(/^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]+$/, 'Solo letras permitidas'),
  apellido: z.string()
    .min(2, 'Obligatorio')
    .regex(/^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]+$/, 'Solo letras permitidas'),
  cedulaTipo: z.enum(['V', 'E']).default('V'),
  cedulaNumero: z.string()
    .regex(/^\d{7,8}$/, 'Debe tener entre 7 y 8 dígitos'),
  phonePrefix: z.string().min(1, 'Requerido'),
  phoneNumber: z.string()
    .regex(/^[0-9]{7}$/, 'Deben ser 7 dígitos'),
  estatus: z.string().default('fortalecimiento'),
  nombreInstancia: z.string()
    .min(2, 'Obligatorio (mínimo 2 caracteres)')
    .regex(/^[a-zA-Z0-9áéíóúÁÉÍÓÚñÑ\s\.\-]+$/, 'Solo letras, números, espacios, puntos y guiones'),
}).refine(data => data.password === data.confirmPassword, {
  message: "Las contraseñas no coinciden",
  path: ["confirmPassword"],
});

const RegisterPage = () => {
  const [step, setStep] = useState(1);
  const [selectedRole, setSelectedRole] = useState<Role | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [localError, setLocalError] = useState<string | null>(null);
  
  const { register: registerUser, isLoading, error: authError } = useAuth();
  const router = useRouter();

  const [modalState, setModalState] = useState({
    isOpen: false,
    title: '',
    message: '',
    type: 'info' as 'info' | 'success' | 'warning' | 'danger',
    showInput: false,
    inputPlaceholder: '',
    onConfirm: null as ((value?: string) => void) | null,
    cancelText: 'Cancelar',
    confirmText: 'Aceptar',
  });

  const showAlert = (title: string, message: string, type?: 'info'|'success'|'warning'|'danger') => {
    setModalState({
      ...modalState,
      isOpen: true,
      title,
      message,
      type: type || 'info',
      showInput: false,
      onConfirm: null,
    });
  };

  const closeAlert = () => setModalState(prev => ({ ...prev, isOpen: false }));

  useEffect(() => {
    if (modalState.isOpen) {
      document.body.classList.add('modal-open');
    } else {
      document.body.classList.remove('modal-open');
    }
    return () => document.body.classList.remove('modal-open');
  }, [modalState.isOpen]);

  const { register, handleSubmit, formState: { errors } } = useForm({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      estatus: 'fortalecimiento',
      phonePrefix: '0414',
      nombre: '',
      apellido: '',
      cedulaTipo: 'V',
      cedulaNumero: '',
      phoneNumber: '',
      email: '',
      password: '',
      confirmPassword: '',
      nombreInstancia: '',
    }
  });

  useEffect(() => {
    if (authError) {
      const errorStr = authError.toLowerCase();
      if (errorStr.includes('email') && (errorStr.includes('already') || errorStr.includes('registered'))) {
        showAlert('Error de registro', 'El correo electrónico ya se encuentra registrado en el sistema.', 'danger');
      } else if (errorStr.includes('cedula') || errorStr.includes('cédula') || errorStr.includes('identity')) {
        showAlert('Error de registro', 'La cédula de identidad ya se encuentra registrada en el sistema.', 'danger');
      } else if (errorStr.includes('phone') || errorStr.includes('telefono') || errorStr.includes('teléfono')) {
        showAlert('Error de registro', 'El número de teléfono ya se encuentra registrado en el sistema.', 'danger');
      } else if (errorStr.includes('already registered') || errorStr.includes('User already registered')) {
        showAlert('Error de registro', 'El usuario ya se encuentra registrado en el sistema.', 'danger');
      } else {
        showAlert('Error de registro', authError, 'danger');
      }
    }
  }, [authError]);

  const onSubmit = async (data: any) => {
    if (!selectedRole) return;
    setLocalError(null);
    
    const cedulaCompleta = `${data.cedulaTipo}-${data.cedulaNumero}`;
    
    const payload = {
      email: data.email,
      password: data.password,
      nombre: data.nombre,
      apellido: data.apellido,
      cedula: cedulaCompleta,
      telefono: `${data.phonePrefix}${data.phoneNumber}`,
      rolNombre: selectedRole,
      nombreInstancia: data.nombreInstancia,
    };
    console.log('📦 Payload enviado:', payload); // 👈 Agrega esta línea
    try {
      await registerUser(payload);
      showAlert('Registro exitoso', '¡Tu cuenta ha sido creada correctamente! Serás redirigido al inicio de sesión.', 'success');
      setTimeout(() => {
        router.push('/login');
      }, 2500);
    } catch (err: any) {
      console.error('Registration failed', err);
    }
  };

  const nextStep = () => {
    if (selectedRole) {
      setStep(step + 1);
      setLocalError(null);
    }
  };

  const prevStep = () => {
    setStep(step - 1);
    setLocalError(null);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[url('/Carrizal.png')] bg-cover bg-center bg-white/25 p-4">
      <div className="w-full max-w-3xl">
        {/* Encabezado reducido */}
        <div className="mb-5 text-center">
          <h1 className="text-2xl font-bold tracking-tight text-white drop-shadow-lg">Registro de Actor Comunal</h1>
          <p className="mt-1 text-sm text-white/90 font-medium drop-shadow">Inicie su proceso de validación en la secretaría municipal</p>
        </div>

        {/* Indicadores de pasos - más compactos */}
        <div className="mb-6 flex items-center justify-center gap-4">
          {[1, 2].map(i => (
            <React.Fragment key={i}>
              <div className={cn(
                "flex h-10 w-10 items-center justify-center rounded-lg text-sm font-bold transition-all shadow-sm",
                step === i ? "bg-brand-primary text-white shadow-brand-primary/20" : 
                step > i ? "bg-brand-accent text-white" : "bg-white/70 backdrop-blur-sm text-gray-400 border border-white/30"
              )}>
                {step > i ? <CheckCircle2 className="h-5 w-5" /> : i}
              </div>
              {i === 1 && <div className={cn("h-1 w-16 rounded-full transition-colors", step > 1 ? "bg-brand-accent" : "bg-white/30")} />}
            </React.Fragment>
          ))}
        </div>

        <AnimatePresence mode="wait">
          {step === 1 ? (
            <motion.div
              key="step1"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3"
            >
              {rolesList.map((role) => {
                const Icon = role.icon;
                return (
                  <button
                    key={role.id}
                    type="button"
                    onClick={() => setSelectedRole(role.id)}
                    className={cn(
                      "group relative flex flex-col items-start p-5 rounded-2xl border-2 transition-all text-left bg-white/70 backdrop-blur-md shadow-xl overflow-hidden",
                      selectedRole === role.id 
                      ? "border-brand-primary ring-4 ring-brand-primary/20 shadow-brand-primary/20" 
                      : "border-white/30 hover:border-brand-primary/30 hover:shadow-2xl hover:bg-white/80"
                    )}
                  >
                    <div className={cn(
                      "flex h-10 w-10 items-center justify-center rounded-xl mb-3 transition-colors",
                      selectedRole === role.id ? "bg-brand-primary text-white" : "bg-brand-primary/20 text-brand-primary group-hover:bg-brand-primary group-hover:text-white"
                    )}>
                      <Icon className="h-5 w-5" />
                    </div>
                    <div>
                      <h3 className="font-bold text-gray-900 leading-tight text-sm">{role.title}</h3>
                      <p className="mt-1 text-xs text-gray-600 leading-relaxed">{role.description}</p>
                    </div>
                    {selectedRole === role.id && (
                      <div className="absolute top-4 right-4 text-brand-primary">
                        <CheckCircle2 className="h-4 w-4" />
                      </div>
                    )}
                  </button>
                );
              })}
              
              <div className="sm:col-span-2 lg:col-span-3 mt-6 flex flex-col items-center gap-4">
                <button
                  type="button"
                  onClick={nextStep}
                  disabled={!selectedRole}
                  className="flex items-center gap-2 rounded-xl bg-brand-primary px-8 py-3 font-bold text-white transition-all shadow-xl shadow-brand-primary/20 hover:bg-brand-secondary hover:-translate-y-0.5 disabled:opacity-50 disabled:translate-y-0"
                >
                  Siguiente Paso <ChevronRight className="h-4 w-4" />
                </button>

                <Link
                  href="/login"
                  className="flex items-center justify-center gap-2 text-sm font-medium text-white/80 hover:text-white transition-colors drop-shadow"
                >
                  <ArrowLeft className="h-4 w-4" /> Volver al inicio de sesión
                </Link>
              </div>
            </motion.div>
          ) : (
            <motion.div
              key="step2"
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.98 }}
              className="rounded-2xl bg-white/70 backdrop-blur-md p-5 shadow-2xl border border-white/30"
            >
              <div className="mb-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-white/30 pb-3">
                <div>
                  <div className="flex items-center gap-2 mb-0.5">
                    <span className="px-2 py-0.5 rounded-full bg-brand-primary/20 text-[10px] font-bold text-brand-primary uppercase tracking-wider border border-brand-primary/30">
                      Formulario
                    </span>
                  </div>
                  <h2 className="text-xl font-bold text-gray-900 capitalize">
                    {selectedRole?.replace('_', ' ')}
                  </h2>
                </div>
                <button 
                  type="button" 
                  onClick={prevStep} 
                  className="inline-flex items-center gap-1 text-xs font-bold text-gray-500 hover:text-brand-primary transition-colors"
                >
                  <ChevronLeft className="h-4 w-4" /> Regresar
                </button>
              </div>

              <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                {/* Datos del Responsable */}
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <div className="h-6 w-1 bg-brand-primary rounded-full" />
                    <h3 className="text-xs font-bold uppercase tracking-widest text-gray-500">
                      Datos del Responsable
                    </h3>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-1.5 sm:gap-4">
                    <div>
                      <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1">Nombre</label>
                      <input {...register('nombre')} placeholder="Juan" className="block w-full rounded-lg border border-white/30 bg-white/50 p-2.5 focus:bg-white focus:border-brand-primary focus:ring-2 focus:ring-brand-primary/20 outline-none transition-all text-sm backdrop-blur-sm" />
                      {errors.nombre && <span className="mt-0.5 text-[9px] font-bold text-red-500 uppercase">{errors.nombre.message as string}</span>}
                    </div>
                    
                    <div>
                      <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1">Apellido</label>
                      <input {...register('apellido')} placeholder="Pérez" className="block w-full rounded-lg border border-white/30 bg-white/50 p-2.5 focus:bg-white focus:border-brand-primary focus:ring-2 focus:ring-brand-primary/20 outline-none transition-all text-sm backdrop-blur-sm" />
                      {errors.apellido && <span className="mt-0.5 text-[9px] font-bold text-red-500 uppercase">{errors.apellido.message as string}</span>}
                    </div>
                    
                    <div>
                      <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1">Cédula</label>
                      <div className="flex gap-1.5">
                        <select
                          {...register('cedulaTipo')}
                          className="w-12 rounded-lg border border-white/30 bg-white/50 p-2.5 focus:bg-white focus:border-brand-primary focus:ring-2 focus:ring-brand-primary/20 outline-none transition-all text-sm font-medium backdrop-blur-sm"
                        >
                          <option value="V">V</option>
                          <option value="E">E</option>
                        </select>
                        <input
                          type="text"
                          {...register('cedulaNumero')}
                          placeholder="12345678"
                          maxLength={8}
                          className="flex-1 rounded-lg border border-white/30 bg-white/50 p-2.5 focus:bg-white focus:border-brand-primary focus:ring-2 focus:ring-brand-primary/20 outline-none transition-all text-sm backdrop-blur-sm"
                        />
                      </div>
                      {errors.cedulaNumero && (
                        <span className="mt-0.5 text-[9px] font-bold text-red-500 uppercase">
                          {errors.cedulaNumero.message as string}
                        </span>
                      )}
                    </div>
                    
                    <div>
                      <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1">Teléfono</label>
                      <div className="flex gap-1.5">
                        <select {...register('phonePrefix')} className="w-1/3 rounded-lg border border-white/30 bg-white/50 p-2.5 focus:bg-white focus:border-brand-primary focus:ring-2 focus:ring-brand-primary/20 outline-none transition-all text-sm font-medium backdrop-blur-sm">
                          <option value="0414">0414</option>
                          <option value="0424">0424</option>
                          <option value="0412">0412</option>
                          <option value="0422">0422</option>
                          <option value="0416">0416</option>
                          <option value="0426">0426</option>
                        </select>
                        <input 
                          type="text" 
                          {...register('phoneNumber')} 
                          placeholder="1234567" 
                          maxLength={7}
                          className="flex-1 rounded-lg border border-white/30 bg-white/50 p-2.5 focus:bg-white focus:border-brand-primary focus:ring-2 focus:ring-brand-primary/20 outline-none transition-all text-sm backdrop-blur-sm" 
                        />
                      </div>
                      {(errors.phonePrefix || errors.phoneNumber) && <span className="mt-0.5 text-[9px] font-bold text-red-500 uppercase">Formato inválido</span>}
                    </div>
                  </div>
                </div>

                {/* Nombre de la Instancia */}
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <div className="h-6 w-1 bg-brand-primary rounded-full" />
                    <h3 className="text-xs font-bold uppercase tracking-widest text-gray-500">
                      Datos de la Instancia
                    </h3>
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1">
                      Nombre de {selectedRole === 'sala_autogobierno' ? 'Sala de Autogobierno' : 
                                  selectedRole === 'comuna' ? 'Comuna' : 'Consejo Comunal'}
                    </label>
                    <input 
                      {...register('nombreInstancia')} 
                      placeholder="Ej. 'Simón Bolívar'" 
                      className="block w-full rounded-lg border border-white/30 bg-white/50 p-2.5 focus:bg-white focus:border-brand-primary focus:ring-2 focus:ring-brand-primary/20 outline-none transition-all text-sm backdrop-blur-sm" 
                    />
                    {errors.nombreInstancia && <span className="mt-0.5 text-[9px] font-bold text-red-500 uppercase">{errors.nombreInstancia.message as string}</span>}
                  </div>
                </div>

                {/* Credenciales */}
                <div className="pt-3 border-t border-white/30">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="h-6 w-1 bg-brand-primary rounded-full" />
                    <h3 className="text-xs font-bold uppercase tracking-widest text-gray-500">
                      Credenciales
                    </h3>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-1.5 sm:gap-4">
                    <div className="col-span-2">
                      <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1">Correo Institucional</label>
                      <input type="email" {...register('email')} placeholder="usuario@carrizal.gov.ve" className="block w-full rounded-lg border border-white/30 bg-white/50 p-2.5 focus:bg-white focus:border-brand-primary focus:ring-2 focus:ring-brand-primary/20 outline-none transition-all text-sm backdrop-blur-sm" />
                      {errors.email && <span className="mt-0.5 text-[9px] font-bold text-red-500 uppercase">{errors.email.message as string}</span>}
                    </div>
                    
                    <div>
                      <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1">Contraseña</label>
                      <div className="relative">
                        <input 
                          type={showPassword ? "text" : "password"} 
                          {...register('password')} 
                          placeholder="••••••••" 
                          className="block w-full rounded-lg border border-white/30 bg-white/50 p-2.5 pr-9 focus:bg-white focus:border-brand-primary focus:ring-2 focus:ring-brand-primary/20 outline-none transition-all text-sm backdrop-blur-sm" 
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-brand-primary transition-colors"
                        >
                          {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </button>
                      </div>
                      {errors.password && <span className="mt-0.5 text-[9px] font-bold text-red-500 uppercase">{errors.password.message as string}</span>}
                    </div>
                    
                    <div>
                      <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1">Confirmar</label>
                      <div className="relative">
                        <input 
                          type={showConfirmPassword ? "text" : "password"} 
                          {...register('confirmPassword')} 
                          placeholder="••••••••" 
                          className="block w-full rounded-lg border border-white/30 bg-white/50 p-2.5 pr-9 focus:bg-white focus:border-brand-primary focus:ring-2 focus:ring-brand-primary/20 outline-none transition-all text-sm backdrop-blur-sm" 
                        />
                        <button
                          type="button"
                          onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                          className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-brand-primary transition-colors"
                        >
                          {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </button>
                      </div>
                      {errors.confirmPassword && <span className="mt-0.5 text-[9px] font-bold text-red-500 uppercase">{errors.confirmPassword.message as string}</span>}
                    </div>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full rounded-xl bg-brand-primary py-3 px-6 text-sm font-bold text-white shadow-xl shadow-brand-primary/20 hover:bg-brand-secondary hover:-translate-y-0.5 transition-all active:scale-95 disabled:opacity-50 disabled:translate-y-0"
                >
                  {isLoading ? 'Procesando...' : 'Finalizar y Crear Cuenta'}
                </button>
              </form>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <AlertModal
        isOpen={modalState.isOpen}
        onClose={closeAlert}
        title={modalState.title}
        message={modalState.message}
        type={modalState.type}
        showInput={modalState.showInput}
        inputPlaceholder={modalState.inputPlaceholder}
        cancelText={modalState.cancelText}
        confirmText={modalState.confirmText}
        onConfirm={modalState.onConfirm || (() => closeAlert())}
      />
    </div>
  );
};

export default RegisterPage;