import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { motion, AnimatePresence } from 'motion/react';
import { 
  User, 
  Users, 
  Building2, 
  Settings, 
  ShieldCheck, 
  Briefcase, 
  Home, 
  ChevronRight, 
  ChevronLeft,
  CheckCircle2,
  FileText,
  CreditCard,
  MapPin
} from 'lucide-react';
import { Role, DirectorType } from '../types';
import { cn } from '../lib/utils';

const rolesList: { id: Role; title: string; description: string; icon: any }[] = [
  { id: 'director', title: 'Director', description: 'Direcciones específicas de la secretaría', icon: User },
  { id: 'sala_autogobierno', title: 'Sala de Autogobierno', description: 'Vinculado a comunas o circuitos', icon: Home },
  { id: 'comuna', title: 'Comuna', description: 'Instancia de autogobierno comunal', icon: Building2 },
  { id: 'consejo_comunal', title: 'Consejo Comunal', description: 'Instancia base de participación', icon: Users },
];

const directorTypes: { id: DirectorType; label: string }[] = [
  { id: 'planificacion_formacion', label: 'Planificación y Formación' },
  { id: 'comunas_consejos_comunales', label: 'Comunas y Consejos Comunales' },
  { id: 'adultas_adulto_mayor', label: 'Adultas y Adultos Mayor' },
  { id: 'digitalizacion_tramites', label: 'Digitalización y Trámites en Línea' },
];

const baseSchema = z.object({
  email: z.string().email('Correo inválido'),
  password: z.string().min(8, 'Mínimo 8 caracteres'),
  confirmPassword: z.string(),
  firstName: z.string().min(2, 'Obligatorio'),
  lastName: z.string().min(2, 'Obligatorio'),
  cedula: z.string().regex(/^[VE]-[0-9]{7,9}$/, 'Formato V-12345678'),
  phone: z.string().min(10, 'Formato inválido'),
}).refine(data => data.password === data.confirmPassword, {
  message: "Las contraseñas no coinciden",
  path: ["confirmPassword"],
});

const consejoComunalSchema = baseSchema.extend({
  nombreConsejo: z.string().min(5, 'Nombre aparece en acta'),
  rif: z.string().min(9, 'RIF vigente'),
  codigoSitur: z.string().optional(),
  comunaPertenece: z.string().min(3, 'Comuna obligatoria'),
  cuentaBancaria: z.string().min(20, '20 dígitos'),
  firmantes: z.string().min(5, 'Voceros autorizados'),
});

const comunaSchema = baseSchema.extend({
  nombreComuna: z.string().min(5, 'Ej. Comuna Brisas de Oriente'),
  rif: z.string().min(9, 'RIF Comunal'),
  banco: z.string().min(20, 'Cuenta bancaria'),
  vocerosFirmantes: z.string().min(5, 'Registro de voceros'),
});

const salaAutogobiernoSchema = baseSchema.extend({
  nombreSala: z.string().min(5, 'Nombre vinculado a Comuna o Circuito'),
  ubicacion: z.string().min(10, 'Dirección exacta'),
  vinculoAdministrativo: z.string().min(3, 'Comuna o Circuito'),
  estatus: z.enum(['consolidada', 'fortalecimiento', 'zona_silencio']),
});

const directorSchema = baseSchema.extend({
  directorType: z.enum(['planificacion_formacion', 'comunas_consejos_comunales', 'adultas_adulto_mayor', 'digitalizacion_tramites']),
});

const RegisterPage = () => {
  const [step, setStep] = useState(1);
  const [selectedRole, setSelectedRole] = useState<Role | null>(null);
  const { register: registerUser, isLoading } = useAuth();
  const navigate = useNavigate();

  const getSchema = () => {
    switch (selectedRole) {
      case 'consejo_comunal': return consejoComunalSchema;
      case 'comuna': return comunaSchema;
      case 'sala_autogobierno': return salaAutogobiernoSchema;
      case 'director': return directorSchema;
      default: return baseSchema;
    }
  };

  const { register, handleSubmit, formState: { errors } } = useForm({
    resolver: zodResolver(getSchema()),
    defaultValues: {
      estatus: 'fortalecimiento',
    } as any
  });

  const onSubmit = async (data: any) => {
    if (!selectedRole) return;
    try {
      // Creamos un objeto base con los campos comunes
      const registerData: {
        email: string;
        password: string;
        firstName: string;
        lastName: string;
        cedula: string;
        phone: string;
        directorType?: DirectorType;
      } = {
        email: data.email,
        password: data.password,
        firstName: data.firstName,
        lastName: data.lastName,
        cedula: data.cedula,
        phone: data.phone,
      };
      // Si el rol seleccionado es director, agregamos directorType
      if (selectedRole === 'director') {
        registerData.directorType = data.directorType;
      }
      await registerUser(selectedRole, registerData);
      navigate('/dashboard');
    } catch (error: any) {
      console.error('Registration failed', error);
      alert(`Error: ${error.message}`);
    }
  };

  function prevStep(event: React.MouseEvent<HTMLButtonElement>): void {
    event.preventDefault();
    setStep(current => Math.max(current - 1, 1));
  }

  function nextStep(event: React.MouseEvent<HTMLButtonElement>): void {
    event.preventDefault();
    setStep(current => Math.min(current + 1, 2));
  }

  return (
    <div className="mx-auto max-w-5xl py-12 px-4">
      <div className="mb-12 text-center">
        <h1 className="text-3xl font-bold tracking-tight text-gray-900">Registro de Actor Comunal</h1>
        <p className="mt-2 text-gray-500 font-medium">Inicie su proceso de validación en la secretaría muncipal</p>
      </div>

      {/* Stepper Header */}
      <div className="mb-12 flex items-center justify-center gap-6">
        {[1, 2].map(i => (
          <React.Fragment key={i}>
            <div className={cn(
              "flex h-12 w-12 items-center justify-center rounded-xl text-lg font-bold transition-all shadow-sm",
              step === i ? "bg-brand-primary text-white shadow-brand-primary/20" : 
              step > i ? "bg-brand-accent text-white" : "bg-white border border-gray-200 text-gray-300"
            )}>
              {step > i ? <CheckCircle2 className="h-6 w-6" /> : i}
            </div>
            {i === 1 && <div className={cn("h-1 w-20 rounded-full transition-colors", step > 1 ? "bg-brand-accent" : "bg-gray-200")} />}
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
            className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3"
          >
            {rolesList.map((role) => {
              const Icon = role.icon;
              return (
                <button
                  key={role.id}
                  onClick={() => setSelectedRole(role.id)}
                  className={cn(
                    "group relative flex flex-col items-start p-6 rounded-2xl border-2 transition-all text-left bg-white shadow-sm overflow-hidden",
                    selectedRole === role.id 
                    ? "border-brand-primary ring-4 ring-brand-primary/10 shadow-md" 
                    : "border-transparent hover:border-brand-primary/10 hover:shadow-lg"
                  )}
                >
                  <div className={cn(
                    "flex h-12 w-12 items-center justify-center rounded-xl mb-4 transition-colors",
                    selectedRole === role.id ? "bg-brand-primary text-white" : "bg-brand-primary/10 text-brand-primary group-hover:bg-brand-primary group-hover:text-white"
                  )}>
                    <Icon className="h-6 w-6" />
                  </div>
                  <div>
                    <h3 className="font-bold text-gray-900 leading-tight">{role.title}</h3>
                    <p className="mt-2 text-xs text-gray-500 leading-relaxed">{role.description}</p>
                  </div>
                  {selectedRole === role.id && (
                    <div className="absolute top-6 right-6 text-brand-primary">
                      <CheckCircle2 className="h-5 w-5" />
                    </div>
                  )}
                </button>
              );
            })}
            <div className="sm:col-span-2 lg:col-span-3 mt-12 flex justify-center">
               <button
                 onClick={nextStep}
                 disabled={!selectedRole}
                 className="flex items-center gap-3 rounded-xl bg-brand-primary px-10 py-4 font-bold text-white transition-all shadow-xl shadow-brand-primary/10 hover:bg-brand-secondary hover:-translate-y-0.5 disabled:opacity-50 disabled:translate-y-0"
               >
                 Siguiente Paso <ChevronRight className="h-5 w-5" />
               </button>
            </div>
          </motion.div>
        ) : (
          <motion.div
            key="step2"
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.98 }}
            className="rounded-3xl bg-white p-10 shadow-2xl shadow-gray-200/50 border border-gray-100"
          >
            <div className="mb-10 flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-gray-100 pb-8">
               <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="px-2.5 py-0.5 rounded-full bg-brand-primary/10 text-[10px] font-bold text-brand-primary uppercase tracking-wider border border-brand-primary/20">
                      Formulario de validación
                    </span>
                  </div>
                  <h2 className="text-2xl font-bold text-gray-900 capitalize">
                    {selectedRole?.replace('_', ' ')}
                  </h2>
               </div>
               <button onClick={prevStep} className="inline-flex items-center gap-2 text-sm font-bold text-gray-400 hover:text-brand-primary transition-colors">
                 <ChevronLeft className="h-4 w-4" /> Regresar a cargos
               </button>
            </div>

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-10">
              {/* Common Person Data */}
              <div className="space-y-6">
                <div className="flex items-center gap-3">
                  <div className="h-8 w-1 bg-brand-primary rounded-full" />
                  <h3 className="text-sm font-bold uppercase tracking-widest text-gray-400">
                    Datos del Responsable
                  </h3>
                </div>
                <div className="grid gap-6 sm:grid-cols-2">
                  <div>
                    <label className="block text-[11px] font-bold text-gray-500 uppercase tracking-wider mb-2">Nombre</label>
                    <input {...register('firstName')} placeholder="Ej. Juan" className="block w-full rounded-xl border border-gray-200 bg-gray-50 p-3 focus:bg-white focus:border-brand-primary focus:ring-2 focus:ring-brand-primary/10 outline-none transition-all text-sm" />
                    {errors.firstName && <span className="mt-1 text-[10px] font-bold text-red-500 uppercase">{errors.firstName.message as string}</span>}
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-gray-500 uppercase tracking-wider mb-2">Apellido</label>
                    <input {...register('lastName')} placeholder="Ej. Pérez" className="block w-full rounded-xl border border-gray-200 bg-gray-50 p-3 focus:bg-white focus:border-brand-primary focus:ring-2 focus:ring-brand-primary/10 outline-none transition-all text-sm" />
                    {errors.lastName && <span className="mt-1 text-[10px] font-bold text-red-500 uppercase">{errors.lastName.message as string}</span>}
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-gray-500 uppercase tracking-wider mb-2">Cédula</label>
                    <input {...register('cedula')} placeholder="V-12345678" className="block w-full rounded-xl border border-gray-200 bg-gray-50 p-3 focus:bg-white focus:border-brand-primary focus:ring-2 focus:ring-brand-primary/10 outline-none transition-all text-sm" />
                    {errors.cedula && <span className="mt-1 text-[10px] font-bold text-red-500 uppercase">{errors.cedula.message as string}</span>}
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-gray-500 uppercase tracking-wider mb-2">Teléfono</label>
                    <input {...register('phone')} placeholder="0412-1234567" className="block w-full rounded-xl border border-gray-200 bg-gray-50 p-3 focus:bg-white focus:border-brand-primary focus:ring-2 focus:ring-brand-primary/10 outline-none transition-all text-sm" />
                    {errors.phone && <span className="mt-1 text-[10px] font-bold text-red-500 uppercase">{errors.phone.message as string}</span>}
                  </div>
                </div>
              </div>

              {/* Role Specific Fields */}
              {selectedRole === 'consejo_comunal' && (
                <div className="space-y-6 pt-10 border-t border-gray-100">
                  <div className="flex items-center gap-3">
                    <div className="h-8 w-1 bg-brand-primary rounded-full" />
                    <h3 className="text-sm font-bold uppercase tracking-widest text-gray-400">
                      Datos del Consejo Comunal
                    </h3>
                  </div>
                  <div className="grid gap-6 sm:grid-cols-2">
                    <div className="sm:col-span-2">
                      <label className="block text-[11px] font-bold text-gray-500 uppercase tracking-wider mb-2">Nombre del Consejo Comunal (Según Acta)</label>
                      <input {...register('nombreConsejo')} placeholder="Nombre oficial" className="block w-full rounded-xl border border-gray-200 bg-gray-50 p-3 focus:bg-white focus:border-brand-primary focus:ring-2 focus:ring-brand-primary/10 outline-none transition-all text-sm" />
                      {errors.nombreConsejo && <span className="mt-1 text-[10px] font-bold text-red-500 uppercase">{errors.nombreConsejo.message as string}</span>}
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold text-gray-500 uppercase tracking-wider mb-2">RIF</label>
                      <input {...register('rif')} placeholder="J-12345678-9" className="block w-full rounded-xl border border-gray-200 bg-gray-50 p-3 focus:bg-white focus:border-brand-primary focus:ring-2 focus:ring-brand-primary/10 outline-none transition-all text-sm" />
                      {errors.rif && <span className="mt-1 text-[10px] font-bold text-red-500 uppercase">{errors.rif.message as string}</span>}
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold text-gray-500 uppercase tracking-wider mb-2">Código SITUR (Opcional)</label>
                      <input {...register('codigoSitur')} placeholder="Código ante el Ministerio" className="block w-full rounded-xl border border-gray-200 bg-gray-50 p-3 focus:bg-white focus:border-brand-primary focus:ring-2 focus:ring-brand-primary/10 outline-none transition-all text-sm" />
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold text-gray-500 uppercase tracking-wider mb-2">Comuna a la que pertenece</label>
                      <input {...register('comunaPertenece')} placeholder="Nombre de la comuna" className="block w-full rounded-xl border border-gray-200 bg-gray-50 p-3 focus:bg-white focus:border-brand-primary focus:ring-2 focus:ring-brand-primary/10 outline-none transition-all text-sm" />
                      {errors.comunaPertenece && <span className="mt-1 text-[10px] font-bold text-red-500 uppercase">{errors.comunaPertenece.message as string}</span>}
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold text-gray-500 uppercase tracking-wider mb-2">Acta Constitutiva (Digital)</label>
                      <div className="mt-1 flex items-center justify-center w-full">
                        <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-gray-200 border-dashed rounded-2xl cursor-pointer bg-gray-50 hover:bg-gray-100 transition-all group">
                          <div className="flex flex-col items-center justify-center pt-5 pb-6">
                            <FileText className="w-8 h-8 mb-3 text-gray-300 group-hover:text-brand-primary transition-colors" />
                            <p className="mb-2 text-[10px] text-gray-400 font-bold uppercase tracking-widest">Subir PDF o Imagen</p>
                          </div>
                          <input type="file" className="hidden" />
                        </label>
                      </div>
                    </div>
                    <div className="sm:col-span-2">
                       <label className="block text-[11px] font-bold text-gray-500 uppercase tracking-wider mb-2">Cuenta Bancaria y Voceros Firmantes</label>
                       <textarea {...register('cuentaBancaria')} rows={3} placeholder="Número de cuenta y listado de voceros autorizados (Nombre y Cédula)" className="block w-full rounded-xl border border-gray-200 bg-gray-50 p-3 focus:bg-white focus:border-brand-primary focus:ring-2 focus:ring-brand-primary/10 outline-none transition-all text-sm" />
                       {errors.cuentaBancaria && <span className="mt-1 text-[10px] font-bold text-red-500 uppercase">Requerido</span>}
                    </div>
                  </div>
                </div>
              )}

              {selectedRole === 'comuna' && (
                <div className="space-y-6 pt-10 border-t border-gray-100">
                  <div className="flex items-center gap-3">
                    <div className="h-8 w-1 bg-brand-primary rounded-full" />
                    <h3 className="text-sm font-bold uppercase tracking-widest text-gray-400">
                      Datos de la Comuna
                    </h3>
                  </div>
                  <div className="grid gap-6 sm:grid-cols-2">
                    <div className="sm:col-span-2">
                      <label className="block text-[11px] font-bold text-gray-500 uppercase tracking-wider mb-2">Nombre de la Comuna</label>
                      <input {...register('nombreComuna')} placeholder="Ej. Comuna Brisas de Oriente" className="block w-full rounded-xl border border-gray-200 bg-gray-50 p-3 focus:bg-white focus:border-brand-primary focus:ring-2 focus:ring-brand-primary/10 outline-none transition-all text-sm" />
                      {errors.nombreComuna && <span className="mt-1 text-[10px] font-bold text-red-500 uppercase">{errors.nombreComuna.message as string}</span>}
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold text-gray-500 uppercase tracking-wider mb-2">RIF de la Comuna</label>
                      <input {...register('rif')} placeholder="J-12345678-9" className="block w-full rounded-xl border border-gray-200 bg-gray-50 p-3 focus:bg-white focus:border-brand-primary focus:ring-2 focus:ring-brand-primary/10 outline-none transition-all text-sm" />
                      {errors.rif && <span className="mt-1 text-[10px] font-bold text-red-500 uppercase">{errors.rif.message as string}</span>}
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold text-gray-500 uppercase tracking-wider mb-2">Carta Fundacional (Digital)</label>
                      <input type="file" className="block w-full text-xs text-gray-400 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-[10px] file:font-bold file:bg-brand-primary/10 file:text-brand-primary hover:file:bg-brand-primary/20 transition-all" />
                    </div>
                    <div className="sm:col-span-2">
                      <label className="block text-[11px] font-bold text-gray-500 uppercase tracking-wider mb-2">Banco y Voceros Firmantes</label>
                      <textarea {...register('banco')} rows={3} placeholder="Nombre del banco, número de cuenta y listado de voceros firmantes autorizados" className="block w-full rounded-xl border border-gray-200 bg-gray-50 p-3 focus:bg-white focus:border-brand-primary focus:ring-2 focus:ring-brand-primary/10 outline-none transition-all text-sm" />
                      {errors.vocerosFirmantes && <span className="mt-1 text-[10px] font-bold text-red-500 uppercase">Requerido</span>}
                    </div>
                  </div>
                </div>
              )}

              {selectedRole === 'sala_autogobierno' && (
                <div className="space-y-6 pt-10 border-t border-gray-100">
                  <div className="flex items-center gap-3">
                    <div className="h-8 w-1 bg-brand-primary rounded-full" />
                    <h3 className="text-sm font-bold uppercase tracking-widest text-gray-400">
                      Datos de la Sala de Autogobierno
                    </h3>
                  </div>
                  <div className="grid gap-6 sm:grid-cols-2">
                    <div className="sm:col-span-2">
                      <label className="block text-[11px] font-bold text-gray-500 uppercase tracking-wider mb-2">Nombre de la Sala</label>
                      <input {...register('nombreSala')} placeholder="Ej. Sala Álvaro de Cuatro Raíces" className="block w-full rounded-xl border border-gray-200 bg-gray-50 p-3 focus:bg-white focus:border-brand-primary focus:ring-2 focus:ring-brand-primary/10 outline-none transition-all text-sm" />
                      {errors.nombreSala && <span className="mt-1 text-[10px] font-bold text-red-500 uppercase">{errors.nombreSala.message as string}</span>}
                    </div>
                    <div className="sm:col-span-2">
                      <label className="block text-[11px] font-bold text-gray-500 uppercase tracking-wider mb-2">Ubicación Física (Punto de Encuentro)</label>
                      <textarea {...register('ubicacion')} rows={2} placeholder="Dirección exacta" className="block w-full rounded-xl border border-gray-200 bg-gray-50 p-3 focus:bg-white focus:border-brand-primary focus:ring-2 focus:ring-brand-primary/10 outline-none transition-all text-sm" />
                      {errors.ubicacion && <span className="mt-1 text-[10px] font-bold text-red-500 uppercase">Requerido</span>}
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold text-gray-500 uppercase tracking-wider mb-2">Vínculo Administrativo (Comuna o Circuito)</label>
                      <input {...register('vinculoAdministrativo')} placeholder="Nombre de la Comuna o Circuito" className="block w-full rounded-xl border border-gray-200 bg-gray-50 p-3 focus:bg-white focus:border-brand-primary focus:ring-2 focus:ring-brand-primary/10 outline-none transition-all text-sm" />
                      {errors.vinculoAdministrativo && <span className="mt-1 text-[10px] font-bold text-red-500 uppercase">{errors.vinculoAdministrativo.message as string}</span>}
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold text-gray-500 uppercase tracking-wider mb-2">Estatus de Funcionamiento</label>
                      <select {...register('estatus')} className="block w-full rounded-xl border border-gray-200 bg-gray-50 p-3 focus:bg-white focus:border-brand-primary focus:ring-2 focus:ring-brand-primary/10 outline-none transition-all text-sm">
                        <option value="consolidada">Consolidada</option>
                        <option value="fortalecimiento">En proceso de fortalecimiento</option>
                        <option value="zona_silencio">Zona en silencio</option>
                      </select>
                    </div>
                  </div>
                </div>
              )}

              {selectedRole === 'director' && (
                <div className="space-y-6 pt-10 border-t border-gray-100">
                  <div className="flex items-center gap-3">
                    <div className="h-8 w-1 bg-brand-primary rounded-full" />
                    <h3 className="text-sm font-bold uppercase tracking-widest text-gray-400">
                      Asignación de Dirección
                    </h3>
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-gray-500 uppercase tracking-wider mb-2">Dirección a cargo</label>
                    <select {...register('directorType')} className="block w-full rounded-xl border border-gray-200 bg-gray-50 p-3 focus:bg-white focus:border-brand-primary focus:ring-2 focus:ring-brand-primary/10 outline-none transition-all text-sm">
                      {directorTypes.map(d => (
                        <option key={d.id} value={d.id}>{d.label}</option>
                      ))}
                    </select>
                  </div>
                </div>
              )}

              {/* Account Credentials */}
              <div className="space-y-6 pt-10 border-t border-gray-100">
                <div className="flex items-center gap-3">
                  <div className="h-8 w-1 bg-brand-primary rounded-full" />
                  <h3 className="text-sm font-bold uppercase tracking-widest text-gray-400">
                    Credenciales de Acceso
                  </h3>
                </div>
                <div className="grid gap-6 sm:grid-cols-2">
                  <div className="sm:col-span-2">
                    <label className="block text-[11px] font-bold text-gray-500 uppercase tracking-wider mb-2">Correo Electrónico</label>
                    <input type="email" {...register('email')} placeholder="usuario@carrizal.gov.ve" className="block w-full rounded-xl border border-gray-200 bg-gray-50 p-3 focus:bg-white focus:border-brand-primary focus:ring-2 focus:ring-brand-primary/10 outline-none transition-all text-sm" />
                    {errors.email && <span className="mt-1 text-[10px] font-bold text-red-500 uppercase">{errors.email.message as string}</span>}
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-gray-500 uppercase tracking-wider mb-2">Contraseña</label>
                    <input type="password" {...register('password')} placeholder="••••••••" className="block w-full rounded-xl border border-gray-200 bg-gray-50 p-3 focus:bg-white focus:border-brand-primary focus:ring-2 focus:ring-brand-primary/10 outline-none transition-all text-sm" />
                    {errors.password && <span className="mt-1 text-[10px] font-bold text-red-500 uppercase">{errors.password.message as string}</span>}
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-gray-500 uppercase tracking-wider mb-2">Confirmar Contraseña</label>
                    <input type="password" {...register('confirmPassword')} placeholder="••••••••" className="block w-full rounded-xl border border-gray-200 bg-gray-50 p-3 focus:bg-white focus:border-brand-primary focus:ring-2 focus:ring-brand-primary/10 outline-none transition-all text-sm" />
                    {errors.confirmPassword && <span className="mt-1 text-[10px] font-bold text-red-500 uppercase">{errors.confirmPassword.message as string}</span>}
                  </div>
                </div>
              </div>

              <div className="pt-10">
                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full rounded-2xl bg-brand-primary py-5 px-8 text-sm font-bold text-white shadow-xl shadow-brand-primary/10 hover:bg-brand-secondary hover:-translate-y-1 transition-all active:scale-95 disabled:opacity-50 disabled:translate-y-0"
                >
                  {isLoading ? 'Procesando registro...' : 'Finalizar y Crear Cuenta'}
                </button>
              </div>
            </form>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default RegisterPage;
