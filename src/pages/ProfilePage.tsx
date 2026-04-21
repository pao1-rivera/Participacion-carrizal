import React from 'react';
import { useAuth } from '../context/AuthContext';
import { motion } from 'motion/react';
import { 
  User, 
  MapPin, 
  Phone, 
  Mail, 
  Shield, 
  Building2, 
  Calendar, 
  CreditCard, 
  FileText, 
  BadgeCheck,
  Users
} from 'lucide-react';
import { cn } from '../lib/utils';

const DataRow = ({ label, value, icon: Icon }: any) => (
  <div className="flex flex-col gap-1 py-4 first:pt-0 border-b border-gray-50 last:border-0 hover:bg-white transition-colors">
    <div className="flex items-center gap-2 text-gray-400">
      <Icon className="h-3.5 w-3.5" />
      <span className="text-[10px] font-bold uppercase tracking-widest">{label}</span>
    </div>
    <div className="text-sm font-bold text-gray-800 ml-5.5">{value || 'No especificado'}</div>
  </div>
);

const ProfilePage = () => {
  const { user } = useAuth();

  if (!user) return null;

  return (
    <div className="mx-auto max-w-4xl pb-20">
      <motion.div
        initial={{ opacity: 0, scale: 0.98 }}
        animate={{ opacity: 1, scale: 1 }}
        className="overflow-hidden rounded-3xl bg-white shadow-2xl shadow-gray-200/50 border border-gray-100"
      >
        {/* Profile Header */}
        <div className="relative h-56 bg-brand-secondary">
          <div className="absolute inset-0 bg-gradient-to-br from-brand-secondary via-[#004e4a] to-[#003d3a] opacity-90" />
          {/* Decorative design theme element */}
          <div className="absolute -top-20 -right-20 w-64 h-64 bg-brand-primary rounded-full blur-3xl opacity-20" />
          
          <div className="absolute -bottom-16 left-10 flex items-end gap-6">
            <div className="h-36 w-36 rounded-3xl border-8 border-white bg-white shadow-xl overflow-hidden flex items-center justify-center">
               <div className="h-full w-full bg-gray-50 flex items-center justify-center text-gray-300">
                 <User className="h-16 w-16" />
               </div>
            </div>
            <div className="mb-4 pb-2">
              <h1 className="text-3xl font-bold text-white tracking-tight">
                {user.firstName} {user.lastName}
              </h1>
              <div className="mt-1 flex items-center gap-2">
                <span className="px-3 py-1 rounded-full bg-brand-primary text-[10px] font-bold text-white uppercase tracking-widest border border-brand-primary shadow-lg shadow-black/20">
                  {user.role.replace('_', ' ')}
                </span>
              </div>
            </div>
          </div>
          <div className="absolute bottom-6 right-10 flex gap-3">
             <button className="rounded-xl bg-white/10 px-6 py-2.5 text-xs font-bold text-white backdrop-blur-md border border-white/20 hover:bg-white/20 transition-all">
               Configuración
             </button>
             <button className="rounded-xl bg-brand-primary px-6 py-2.5 text-xs font-bold text-white shadow-xl shadow-black/20 hover:bg-brand-secondary transition-all">
               Editar Perfil
             </button>
          </div>
        </div>

        {/* Profile Content */}
        <div className="mt-24 px-10 pb-12 grid gap-10 md:grid-cols-2">
           {/* Section 1: Person Data */}
           <div className="space-y-8">
              <div>
                <div className="flex items-center gap-3 mb-8">
                  <div className="h-6 w-1 bg-brand-primary rounded-full" />
                  <h2 className="text-xs font-bold text-gray-400 uppercase tracking-widest">Información Personal</h2>
                </div>
                <div className="rounded-2xl bg-gray-50/50 p-8 border border-gray-100">
                  <DataRow label="Nombre Completo" value={`${user.firstName} ${user.lastName}`} icon={User} />
                  <DataRow label="Cédula de Identidad" value={user.cedula} icon={Shield} />
                  <DataRow label="Teléfono de Contacto" value={user.phone} icon={Phone} />
                  <DataRow label="Correo Electrónico" value={user.email} icon={Mail} />
                </div>
              </div>

              <div>
                 <div className="flex items-center gap-3 mb-8">
                    <div className="h-6 w-1 bg-brand-primary rounded-full" />
                    <h2 className="text-xs font-bold text-gray-400 uppercase tracking-widest">Gestión de Cuenta</h2>
                 </div>
                 <div className="rounded-2xl bg-gray-50/50 p-8 border border-gray-100">
                    <DataRow label="Registrado desde" value={new Date(user.createdAt).toLocaleDateString('es-ES', { dateStyle: 'long' })} icon={Calendar} />
                    <DataRow label="Estado de Perfil" value="Verificado" icon={BadgeCheck} />
                 </div>
              </div>
           </div>

           {/* Section 2: Role Data */}
           <div className="space-y-8">
              <div className="flex items-center gap-3 mb-8">
                <div className="h-6 w-1 bg-brand-primary rounded-full" />
                <h2 className="text-xs font-bold text-gray-400 uppercase tracking-widest">Información Institucional</h2>
              </div>
              <div className="rounded-2xl border-2 border-brand-primary/10 p-8 bg-white shadow-sm">
                {user.role === 'consejo_comunal' && (
                  <>
                    <DataRow label="Nombre del Consejo" value={(user as any).nombreConsejo} icon={Building2} />
                    <DataRow label="RIF" value={(user as any).rif} icon={FileText} />
                    <DataRow label="Comuna Perteneciente" value={(user as any).comunaPertenece} icon={MapPin} />
                    <DataRow label="Cuenta Bancaria" value={(user as any).cuentaBancaria} icon={CreditCard} />
                    <DataRow label="Voceros Firmantes" value={(user as any).firmantes} icon={Users} />
                  </>
                )}

                {user.role === 'comuna' && (
                  <>
                    <DataRow label="Nombre de la Comuna" value={(user as any).nombreComuna} icon={Building2} />
                    <DataRow label="RIF Territorial" value={(user as any).rif} icon={FileText} />
                    <DataRow label="Banco / Cuenta" value={(user as any).banco} icon={CreditCard} />
                    <DataRow label="Voceros Autorizados" value={(user as any).vocerosFirmantes} icon={Users} />
                  </>
                )}

                {user.role === 'sala_autogobierno' && (
                  <>
                    <DataRow label="Nombre de la Sala" value={(user as any).nombreSala} icon={Building2} />
                    <DataRow label="Ubicación Física" value={(user as any).ubicacion} icon={MapPin} />
                    <DataRow label="Vínculo Administrativo" value={(user as any).vinculoAdministrativo} icon={Shield} />
                    <DataRow label="Estatus Actual" value={(user as any).estatus} icon={BadgeCheck} />
                  </>
                )}

                {user.role === 'director' && (
                  <>
                    <DataRow label="Dirección Designada" value={(user as any).directorType?.replace(/_/g, ' ')} icon={Shield} />
                    <DataRow label="Estatus de Nombramiento" value="Oficial / Gaceta" icon={FileText} />
                  </>
                )}

                {(user.role === 'admin' || user.role === 'alcaldesa' || user.role === 'secretario') && (
                  <div className="py-8 text-center text-slate-400">
                    <Shield className="h-12 w-12 mx-auto mb-4 opacity-20" />
                    <p className="text-xs font-medium">Perfil de Alta Jerarquía Municipal</p>
                  </div>
                )}
              </div>
           </div>
        </div>
      </motion.div>
    </div>
  );
};

export default ProfilePage;
