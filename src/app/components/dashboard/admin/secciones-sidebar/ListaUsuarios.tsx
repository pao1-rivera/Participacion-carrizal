import React, { useState, useEffect } from 'react';
import { 
  Search, Filter, Plus, Eye, UserX, UserCheck, Trash2,
  ChevronLeft, ChevronRight, Sliders, Lock, Shield, AlertTriangle
} from 'lucide-react';
import { cn } from '@/app/lib/utils';
import { supabase } from '@/app/lib/supabaseClient';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '@/context/AuthContext';

interface User {
  id: string;
  nombre: string;
  apellido: string;
  email: string;
  cedula: string;
  telefono: string;
  activo: boolean;
  id_rol: number;
  rol_nombre?: string;
  rol_ambito?: string;
  created_at?: string;
}

interface Rol {
  id_rol: number;
  nombre_rol: string;
  descripcion: string;
  nivel_jerarquia: number;
  ambito: string;
  activo: boolean;
}

interface ListaUsuariosProps {
  currentUser?: any;
}

export const ListaUsuarios: React.FC<ListaUsuariosProps> = ({ currentUser }) => {
  const { user: authUser, login } = useAuth();
  const [users, setUsers] = useState<User[]>([]);
  const [roles, setRoles] = useState<Rol[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [formNombre, setFormNombre] = useState('');
  const [formApellido, setFormApellido] = useState('');
  const [formEmail, setFormEmail] = useState('');
  const [formCedula, setFormCedula] = useState('');
  const [formTelefono, setFormTelefono] = useState('');
  const [formIdRol, setFormIdRol] = useState<number>(4);
  const [formPassword, setFormPassword] = useState('');
  const [formConfirmPassword, setFormConfirmPassword] = useState('');
  const [passwordError, setPasswordError] = useState('');

  // Estados para confirmación
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [confirmPassword, setConfirmPassword] = useState('');
  const [confirmError, setConfirmError] = useState('');
  const [isConfirming, setIsConfirming] = useState(false);
  const [pendingAction, setPendingAction] = useState<'create' | 'edit' | 'delete' | 'toggle' | null>(null);
  const [pendingUserId, setPendingUserId] = useState<string | null>(null);
  const [pendingToggleStatus, setPendingToggleStatus] = useState<boolean | null>(null);

  const itemsPerPage = 10;

  // ========== FUNCIONES DE BD ==========
  
  const fetchRoles = async () => {
    try {
      const { data, error } = await supabase
        .from('rol_usuario')
        .select('*')
        .eq('activo', true)
        .order('nombre_rol');
      if (error) throw error;
      setRoles(data || []);
    } catch (error) {
      console.error('Error fetching roles:', error);
    }
  };

  const fetchUsers = async () => {
    setLoading(true);
    try {
      // 1. Obtener roles
      const { data: rolesData, error: rolesError } = await supabase
        .from('rol_usuario')
        .select('id_rol, nombre_rol, ambito')
        .eq('activo', true);

      if (rolesError) {
        console.error('❌ Error fetching roles:', rolesError);
        throw rolesError;
      }

      console.log('✅ Roles obtenidos:', rolesData);

      const rolesMap = new Map();
      rolesData?.forEach((rol: any) => {
        rolesMap.set(rol.id_rol, {
          nombre_rol: rol.nombre_rol,
          ambito: rol.ambito
        });
      });

      // 2. Obtener perfiles de usuarios
      const { data, error } = await supabase
        .from('perfil_usuario')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('❌ Error fetching users:', error);
        throw error;
      }

      console.log('✅ Perfiles obtenidos:', data);

      if (data) {
        const mappedUsers: User[] = data.map((item: any) => {
          const rolInfo = rolesMap.get(item.id_rol);
          console.log(`🔍 Usuario ${item.nombre} ${item.apellido}: id_rol=${item.id_rol}, rolInfo=`, rolInfo);
          return {
            id: item.id_usuario,
            nombre: item.nombre || '',
            apellido: item.apellido || '',
            email: item.email || '',
            cedula: item.cedula || '',
            telefono: item.telefono || '',
            activo: item.activo !== false,
            id_rol: item.id_rol || 4,
            rol_nombre: rolInfo?.nombre_rol || 'usuario',
            rol_ambito: rolInfo?.ambito || '',
            created_at: item.created_at
          };
        });
        
        console.log('✅ Usuarios mapeados:', mappedUsers);
        setUsers(mappedUsers);
      }
    } catch (error) {
      console.error('❌ Error fetching users:', error);
      alert('Error al cargar los usuarios');
    } finally {
      setLoading(false);
    }
  };

  // ========== FUNCIONES DE CONFIRMACIÓN ==========
  
  const confirmWithPassword = (action: 'create' | 'edit' | 'delete' | 'toggle', userId?: string, newStatus?: boolean) => {
    console.log('🔐 confirmWithPassword llamado:', { action, userId, newStatus });
    setPendingAction(action);
    setPendingUserId(userId || null);
    setPendingToggleStatus(newStatus ?? null);
    setShowConfirmModal(true);
    setConfirmPassword('');
    setConfirmError('');
  };

  const handleConfirmAction = async () => {
    if (!confirmPassword) {
      setConfirmError('Ingrese su contraseña');
      return;
    }

    setIsConfirming(true);
    setConfirmError('');

    try {
      const email = authUser?.email;
      if (!email) {
        throw new Error('No se pudo obtener el email del usuario');
      }

      const { error } = await supabase.auth.signInWithPassword({
        email,
        password: confirmPassword,
      });

      if (error) {
        setConfirmError('Contraseña incorrecta');
        setIsConfirming(false);
        return;
      }

      setShowConfirmModal(false);
      setConfirmPassword('');
      setIsConfirming(false);

      console.log('✅ Contraseña verificada, ejecutando acción:', pendingAction);

      switch (pendingAction) {
        case 'create':
          await executeCreateUser();
          break;
        case 'edit':
          await executeEditUser();
          break;
        case 'delete':
          if (pendingUserId) {
            await executeDeleteUser(pendingUserId);
          }
          break;
        case 'toggle':
          if (pendingUserId && pendingToggleStatus !== null) {
            await executeToggleStatus(pendingUserId, pendingToggleStatus);
          } else {
            console.error('❌ Datos incompletos para toggle:', { pendingUserId, pendingToggleStatus });
            alert('Error: datos incompletos para cambiar el estado.');
          }
          break;
        default:
          console.warn('⚠️ Acción no reconocida:', pendingAction);
      }
    } catch (error: any) {
      console.error('❌ Error en handleConfirmAction:', error);
      setConfirmError(error.message || 'Error al verificar la contraseña');
      setIsConfirming(false);
    }
  };

  // ========== FUNCIONES DE EJECUCIÓN ==========
  
  const executeCreateUser = async () => {
    try {
      const { data: { session: currentSession } } = await supabase.auth.getSession();
      const currentUserEmail = currentSession?.user?.email;

      const { data: authData, error: signUpError } = await supabase.auth.signUp({
        email: formEmail,
        password: formPassword,
        options: {
          data: {
            nombre: formNombre,
            apellido: formApellido,
            cedula: formCedula,
            telefono: formTelefono,
            id_rol: formIdRol,
          },
          emailRedirectTo: window.location.origin
        }
      });

      if (signUpError) throw signUpError;
      if (!authData.user) throw new Error('No se pudo crear el usuario');

      const perfilData = {
        id_usuario: authData.user.id,
        nombre: formNombre,
        apellido: formApellido,
        email: formEmail,
        cedula: formCedula,
        telefono: formTelefono,
        id_rol: formIdRol,
        activo: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      const { error: perfilError } = await supabase
        .from('perfil_usuario')
        .insert([perfilData]);

      if (perfilError) throw perfilError;

      if (currentUserEmail && currentSession) {
        const { error: restoreError } = await supabase.auth.signInWithPassword({
          email: currentUserEmail,
          password: confirmPassword
        });
        if (restoreError) {
          console.warn('No se pudo restaurar la sesión anterior:', restoreError);
        }
      }

      alert('Usuario creado exitosamente.');
      await fetchUsers();
      setIsCreateModalOpen(false);
      resetForm();
    } catch (error: any) {
      console.error('❌ Error creating user:', error);
      alert(`Error al crear el usuario: ${error.message || 'Error desconocido'}`);
    }
  };

  const executeEditUser = async () => {
    if (!editingUser) return;

    try {
      // Usar RPC para editar perfil
      const { data, error } = await supabase
        .rpc('admin_update_user_profile', {
          user_id: editingUser.id,
          user_nombre: formNombre,
          user_apellido: formApellido,
          user_email: formEmail,
          user_cedula: formCedula,
          user_telefono: formTelefono,
          user_id_rol: formIdRol
        });

      if (error) {
        console.error('❌ Error en RPC edit:', error);
        throw error;
      }

      console.log('✅ Perfil actualizado:', data);
      alert('Usuario actualizado exitosamente.');
      await fetchUsers();
      setIsCreateModalOpen(false);
      setEditingUser(null);
      resetForm();
    } catch (error: any) {
      console.error('❌ Error updating user:', error);
      alert(`Error al actualizar: ${error.message || 'Error desconocido'}`);
    }
  };

  const executeDeleteUser = async (id: string) => {
    // POR AHORA: Solo mostramos un mensaje y no eliminamos.
    alert('La eliminación de usuarios aún no está disponible. Esta funcionalidad estará habilitada próximamente.');
    return;
    
    /* Código original (comentado)
    try {
      const { error: perfilError } = await supabase
        .from('perfil_usuario')
        .delete()
        .eq('id_usuario', id);

      if (perfilError) throw perfilError;

      await fetchUsers();
      alert('Usuario eliminado exitosamente.');
    } catch (error: any) {
      console.error('Error deleting user:', error);
      alert(`Error al eliminar: ${error.message || 'Error desconocido'}`);
    }
    */
  };

  const executeToggleStatus = async (id: string, newStatus: boolean) => {
    try {
      console.log(`🔄 Cambiando estado de usuario ${id} a ${newStatus}`);

      const { error } = await supabase
        .from('perfil_usuario')
        .update({ activo: newStatus })
        .eq('id_usuario', id);

      if (error) {
        console.error('❌ Error al actualizar estado:', error);
        throw error;
      }

      console.log('✅ Estado actualizado correctamente');
      await fetchUsers();
      alert(`Usuario ${newStatus ? 'activado' : 'desactivado'} exitosamente.`);
    } catch (error: any) {
      console.error('❌ Error en executeToggleStatus:', error);
      alert(`Error al cambiar el estado: ${error.message || 'Error desconocido'}`);
    }
  };

  // ========== HANDLERS ==========
  
  const handleCreateUser = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (formPassword !== formConfirmPassword) {
      setPasswordError('Las contraseñas no coinciden');
      return;
    }

    if (formPassword.length < 6) {
      setPasswordError('La contraseña debe tener al menos 6 caracteres');
      return;
    }

    setPasswordError('');
    confirmWithPassword('create');
  };

  const handleEditUser = (e: React.FormEvent) => {
    e.preventDefault();
    confirmWithPassword('edit');
  };

  const handleDeleteUser = (id: string) => {
    // Mostrar mensaje de que no está disponible
    alert('La eliminación de usuarios aún no está disponible.');
    // Si quieres mantener el confirm, lo dejas comentado:
    // if (!confirm('¿Está seguro de eliminar esta cuenta permanentemente?')) return;
    // confirmWithPassword('delete', id);
  };

  const handleToggleStatus = (id: string, currentStatus: boolean) => {
    // Prevenir auto-desactivación
    if (authUser?.id === id) {
      alert('⚠️ No puedes desactivar tu propia cuenta de administrador.');
      return;
    }

    const newStatus = !currentStatus;
    const actionText = newStatus ? 'activar' : 'desactivar';
    if (!confirm(`¿Está seguro de ${actionText} esta cuenta?`)) return;
    confirmWithPassword('toggle', id, newStatus);
  };

  const handleOpenEdit = (u: User) => {
    setEditingUser(u);
    setFormNombre(u.nombre);
    setFormApellido(u.apellido);
    setFormEmail(u.email);
    setFormCedula(u.cedula);
    setFormTelefono(u.telefono || '');
    setFormIdRol(u.id_rol || 4);
    // Si el usuario está inactivo, mostramos campos de contraseña
    if (!u.activo) {
      setFormPassword('');
      setFormConfirmPassword('');
    } else {
      setFormPassword('');
      setFormConfirmPassword('');
    }
    setPasswordError('');
    setIsCreateModalOpen(true);
  };

  const handleOpenCreate = () => {
    setEditingUser(null);
    resetForm();
    setIsCreateModalOpen(true);
  };

  const resetForm = () => {
    setFormNombre('');
    setFormApellido('');
    setFormEmail('');
    setFormCedula('');
    setFormTelefono('');
    setFormIdRol(4);
    setFormPassword('');
    setFormConfirmPassword('');
    setPasswordError('');
  };

  // ========== CARGA INICIAL ==========
  useEffect(() => {
    fetchUsers();
  }, []);

  // ========== FILTRADO Y PAGINACIÓN ==========
  
  const filteredUsers = users.filter(u => {
    const fullName = `${u.nombre} ${u.apellido}`.toLowerCase();
    const search = searchQuery.toLowerCase();
    const matchesSearch = 
      fullName.includes(search) ||
      u.cedula.toLowerCase().includes(search) ||
      u.email.toLowerCase().includes(search);
    
    const rolNombre = u.rol_nombre?.toLowerCase() || '';
    const matchesRole = roleFilter === 'all' || rolNombre === roleFilter.toLowerCase();
    const matchesStatus = statusFilter === 'all' || 
      (statusFilter === 'active' ? u.activo === true : u.activo === false);
    
    return matchesSearch && matchesRole && matchesStatus;
  });

  const totalPages = Math.ceil(filteredUsers.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedUsers = filteredUsers.slice(startIndex, startIndex + itemsPerPage);

  const goToPage = (page: number) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
    }
  };

  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, roleFilter, statusFilter]);

  const getRolColor = (rolNombre: string): string => {
    const colors: Record<string, string> = {
      'admin': 'bg-slate-800 text-white',
      'alcaldesa': 'bg-indigo-600 text-white',
      'secretario': 'bg-amber-600 text-white',
      'director_adulto_mayor': 'bg-cyan-600 text-white',
      'director_formacion_planificacion': 'bg-cyan-600 text-white',
      'director_digitalizacion': 'bg-cyan-600 text-white',
      'director_comunas': 'bg-cyan-600 text-white',
      'sala_autogobierno': 'bg-amber-500 text-white',
      'comuna': 'bg-emerald-600 text-white',
      'consejo_comunal': 'bg-blue-600 text-white'
    };
    return colors[rolNombre] || 'bg-slate-400 text-white';
  };

  const getRolLabel = (rolNombre: string): string => {
    const labels: Record<string, string> = {
      'admin': 'Admin',
      'alcaldesa': 'Alcaldesa',
      'secretario': 'Secretario',
      'director_adulto_mayor': 'Dir. Adulto Mayor',
      'director_formacion_planificacion': 'Dir. Formación',
      'director_digitalizacion': 'Dir. Digitalización',
      'director_comunas': 'Dir. Comunas',
      'sala_autogobierno': 'Sala Autogob.',
      'comuna': 'Comuna',
      'consejo_comunal': 'Consejo Comunal'
    };
    return labels[rolNombre] || rolNombre.replace(/_/g, ' ');
  };

  // ========== RENDERIZADO ==========
  return (
    <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-300">
      {/* Header */}
      <div className="bg-white p-4 rounded-xl border border-slate-100 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div>
          <h1 className="text-base font-black text-slate-950 uppercase italic tracking-tighter leading-none">Directorio de Usuarios</h1>
          <p className="text-[9px] text-slate-400 mt-0.5 font-medium">Administre las cuentas del sistema</p>
        </div>
        <button 
          onClick={handleOpenCreate}
          className="flex items-center gap-1.5 px-4 py-2 bg-brand-primary hover:bg-indigo-950 text-white rounded-lg text-[10px] font-black uppercase tracking-wider shadow-lg shadow-brand-primary/20 transition-all active:scale-95"
        >
          <Plus size={14} /> Nuevo Usuario
        </button>
      </div>

      {/* Filtros mejorados */}
      <div className="bg-white p-3 rounded-xl border border-slate-100 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div className="relative flex-1 max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-3.5 h-3.5" />
          <input
            type="text"
            placeholder="Buscar por nombre, cédula o correo..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-slate-50 border border-slate-100 rounded-lg py-1.5 pl-9 pr-3 text-[11px] font-medium text-slate-700 outline-none focus:ring-1 focus:ring-brand-primary/20 hover:border-slate-200 transition-all placeholder:text-slate-400"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1">
            <Filter size={12} className="text-slate-400" />
            <select 
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value)}
              className="bg-transparent text-[9px] font-bold text-slate-600 uppercase tracking-wider outline-none cursor-pointer py-0.5 min-w-[120px]"
            >
              <option value="all">Todos los roles</option>
              {roles.map((rol) => (
                <option key={rol.id_rol} value={rol.nombre_rol}>
                  {getRolLabel(rol.nombre_rol)}
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1">
            <Filter size={12} className="text-slate-400" />
            <select 
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="bg-transparent text-[9px] font-bold text-slate-600 uppercase tracking-wider outline-none cursor-pointer py-0.5"
            >
              <option value="all">Todos</option>
              <option value="active">Activos</option>
              <option value="inactive">Inactivos</option>
            </select>
          </div>
        </div>
      </div>

      {/* Tabla */}
      <div className="bg-white rounded-xl border border-slate-100 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-100">
                <th className="p-2.5 text-[8px] font-black text-slate-400 uppercase tracking-wider">Usuario</th>
                <th className="p-2.5 text-[8px] font-black text-slate-400 uppercase tracking-wider">Cédula</th>
                <th className="p-2.5 text-[8px] font-black text-slate-400 uppercase tracking-wider">Rol</th>
                <th className="p-2.5 text-[8px] font-black text-slate-400 uppercase tracking-wider">Estado</th>
                <th className="p-2.5 text-[8px] font-black text-slate-400 uppercase tracking-wider text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {loading ? (
                <tr>
                  <td colSpan={5} className="p-6 text-center">
                    <div className="inline-block h-6 w-6 animate-spin rounded-full border-2 border-brand-primary border-t-transparent" />
                  </td>
                </tr>
              ) : paginatedUsers.length === 0 ? (
                <tr>
                  <td colSpan={5} className="p-6 text-center text-slate-400 text-[10px]">
                    No se encontraron usuarios
                  </td>
                </tr>
              ) : (
                paginatedUsers.map((u) => {
                  const rolNombre = u.rol_nombre || 'usuario';
                  const isActive = u.activo === true;
                  const isAdmin = rolNombre === 'admin' && authUser?.id === u.id;

                  return (
                    <tr key={u.id} className="hover:bg-slate-50/50 transition-colors">
                      <td className="p-2.5">
                        <div className="flex items-center gap-2">
                          <div className={cn(
                            "w-7 h-7 rounded-lg flex items-center justify-center font-bold border text-[10px] uppercase",
                            isActive ? "bg-slate-100 text-slate-500 border-slate-200" : "bg-rose-50 text-rose-500 border-rose-200"
                          )}>
                            {u.nombre?.[0] || '?'}
                          </div>
                          <div>
                            <h4 className="text-[11px] font-bold text-slate-800 leading-none">{u.nombre} {u.apellido}</h4>
                            <p className="text-[9px] text-slate-400 mt-0.5 truncate max-w-[120px]">{u.email}</p>
                          </div>
                        </div>
                      </td>
                      <td className="p-2.5">
                        <span className="text-[10px] font-mono font-bold text-slate-600">{u.cedula || '-'}</span>
                      </td>
                      <td className="p-2.5">
                        <span className={cn(
                          "text-[7px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full",
                          getRolColor(rolNombre)
                        )}>
                          {getRolLabel(rolNombre)}
                        </span>
                      </td>
                      <td className="p-2.5">
                        <span className={cn(
                          "inline-flex items-center gap-1.5 text-[9px] font-bold uppercase",
                          isActive ? "text-emerald-600" : "text-rose-500"
                        )}>
                          <span className={cn("w-1.5 h-1.5 rounded-full", isActive ? "bg-emerald-500" : "bg-rose-500")} />
                          {isActive ? 'Activo' : 'Inactivo'}
                        </span>
                      </td>
                      <td className="p-2.5 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => handleOpenEdit(u)}
                            title="Editar"
                            className="p-1 rounded-lg bg-indigo-50 text-indigo-600 border border-indigo-100 hover:bg-indigo-100 transition-colors"
                          >
                            <Eye size={13} />
                          </button>
                          {/* Desactivar/Activar solo si no es el admin actual */}
                          {!isAdmin && (
                            <button
                              onClick={() => handleToggleStatus(u.id, isActive)}
                              title={isActive ? 'Desactivar' : 'Activar'}
                              className={cn(
                                "p-1 rounded-lg border transition-colors",
                                isActive 
                                  ? "bg-amber-50 text-amber-600 border-amber-100 hover:bg-amber-100" 
                                  : "bg-emerald-50 text-emerald-600 border-emerald-100 hover:bg-emerald-100"
                              )}
                            >
                              {isActive ? <UserX size={13} /> : <UserCheck size={13} />}
                            </button>
                          )}
                          {/* Eliminar: deshabilitado para todos (temporal) */}
                          <button
                            onClick={() => handleDeleteUser(u.id)}
                            title="Eliminar (próximamente)"
                            className="p-1 rounded-lg bg-rose-50 text-rose-600 border border-rose-100 hover:bg-rose-100 transition-colors opacity-50 cursor-not-allowed"
                            disabled
                          >
                            <Trash2 size={13} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Paginación (sin cambios) */}
      {filteredUsers.length > itemsPerPage && (
        <div className="flex items-center justify-between bg-white px-3 py-2 rounded-xl border border-slate-100 shadow-sm">
          <p className="text-[9px] text-slate-400 font-medium">
            {filteredUsers.length} usuarios · Pág. {currentPage} de {totalPages}
          </p>
          <div className="flex items-center gap-1">
            <button
              onClick={() => goToPage(currentPage - 1)}
              disabled={currentPage === 1}
              className={cn(
                "p-1.5 rounded-lg border border-slate-200 transition-colors",
                currentPage === 1 ? "opacity-40 cursor-not-allowed" : "hover:bg-slate-50"
              )}
            >
              <ChevronLeft size={14} className="text-slate-500" />
            </button>
            
            {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
              let pageNum;
              if (totalPages <= 5) {
                pageNum = i + 1;
              } else if (currentPage <= 3) {
                pageNum = i + 1;
              } else if (currentPage >= totalPages - 2) {
                pageNum = totalPages - 4 + i;
              } else {
                pageNum = currentPage - 2 + i;
              }
              
              return (
                <button
                  key={pageNum}
                  onClick={() => goToPage(pageNum)}
                  className={cn(
                    "w-7 h-7 rounded-lg text-[10px] font-bold transition-colors",
                    currentPage === pageNum
                      ? "bg-brand-primary text-white"
                      : "text-slate-500 hover:bg-slate-100"
                  )}
                >
                  {pageNum}
                </button>
              );
            })}

            <button
              onClick={() => goToPage(currentPage + 1)}
              disabled={currentPage === totalPages}
              className={cn(
                "p-1.5 rounded-lg border border-slate-200 transition-colors",
                currentPage === totalPages ? "opacity-40 cursor-not-allowed" : "hover:bg-slate-50"
              )}
            >
              <ChevronRight size={14} className="text-slate-500" />
            </button>
          </div>
        </div>
      )}

      {/* Modal de Creación/Edición - igual */}
      <AnimatePresence>
        {isCreateModalOpen && (
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-2xl w-full max-w-md shadow-2xl overflow-hidden border border-slate-100"
            >
              <div className="bg-slate-950 px-5 py-3 text-white flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Sliders size={14} className="text-indigo-400" />
                  <h3 className="font-black text-xs uppercase italic tracking-tighter leading-none">
                    {editingUser ? 'Editar Cuenta' : 'Nueva Cuenta'}
                  </h3>
                  {editingUser && !editingUser.activo && (
                    <span className="text-[8px] bg-rose-500/20 text-rose-300 px-2 py-0.5 rounded-full font-bold uppercase ml-2">
                      Inactivo
                    </span>
                  )}
                </div>
                <button 
                  type="button" 
                  onClick={() => {
                    setIsCreateModalOpen(false);
                    setEditingUser(null);
                    resetForm();
                  }}
                  className="text-slate-400 hover:text-white transition-colors"
                >
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              
              <form onSubmit={editingUser ? handleEditUser : handleCreateUser} className="p-5 space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-0.5">
                    <label className="text-[8px] font-black text-slate-400 uppercase tracking-wider">Nombre *</label>
                    <input 
                      required
                      type="text" 
                      value={formNombre}
                      onChange={(e) => setFormNombre(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-100 rounded-lg px-3 py-1.5 text-[11px] font-bold text-slate-700 outline-none focus:ring-2 focus:ring-brand-primary/10"
                    />
                  </div>
                  <div className="space-y-0.5">
                    <label className="text-[8px] font-black text-slate-400 uppercase tracking-wider">Apellido *</label>
                    <input 
                      required
                      type="text" 
                      value={formApellido}
                      onChange={(e) => setFormApellido(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-100 rounded-lg px-3 py-1.5 text-[11px] font-bold text-slate-700 outline-none focus:ring-2 focus:ring-brand-primary/10"
                    />
                  </div>
                </div>
                
                <div className="space-y-0.5">
                  <label className="text-[8px] font-black text-slate-400 uppercase tracking-wider">Correo *</label>
                  <input 
                    required
                    type="email" 
                    value={formEmail}
                    onChange={(e) => setFormEmail(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-100 rounded-lg px-3 py-1.5 text-[11px] font-bold text-slate-700 outline-none focus:ring-2 focus:ring-brand-primary/10"
                  />
                </div>

                {/* Mostrar campos de contraseña SIEMPRE en edición de usuario inactivo */}
                {(!editingUser || !editingUser.activo) && (
                  <>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-0.5">
                        <label className="text-[8px] font-black text-slate-400 uppercase tracking-wider">
                          {editingUser ? 'Nueva Contraseña' : 'Contraseña *'}
                        </label>
                        <input 
                          required={!editingUser}
                          type="password" 
                          placeholder={editingUser ? 'Opcional' : 'Mín 6 chars'}
                          value={formPassword}
                          onChange={(e) => {
                            setFormPassword(e.target.value);
                            if (passwordError) setPasswordError('');
                          }}
                          className="w-full bg-slate-50 border border-slate-100 rounded-lg px-3 py-1.5 text-[11px] font-bold text-slate-700 outline-none focus:ring-2 focus:ring-brand-primary/10"
                        />
                      </div>
                      <div className="space-y-0.5">
                        <label className="text-[8px] font-black text-slate-400 uppercase tracking-wider">
                          {editingUser ? 'Confirmar Nueva' : 'Confirmar *'}
                        </label>
                        <input 
                          required={!editingUser}
                          type="password" 
                          placeholder={editingUser ? 'Opcional' : 'Repita'}
                          value={formConfirmPassword}
                          onChange={(e) => {
                            setFormConfirmPassword(e.target.value);
                            if (passwordError) setPasswordError('');
                          }}
                          className="w-full bg-slate-50 border border-slate-100 rounded-lg px-3 py-1.5 text-[11px] font-bold text-slate-700 outline-none focus:ring-2 focus:ring-brand-primary/10"
                        />
                      </div>
                    </div>
                    {passwordError && (
                      <p className="text-[9px] text-rose-500 font-bold">{passwordError}</p>
                    )}
                    {editingUser && !editingUser.activo && (
                      <p className="text-[9px] text-amber-500 font-medium flex items-center gap-1">
                        <AlertTriangle size={12} />
                        La cuenta está inactiva. Ingrese nueva contraseña para reactivarla.
                      </p>
                    )}
                  </>
                )}
                
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-0.5">
                    <label className="text-[8px] font-black text-slate-400 uppercase tracking-wider">Cédula *</label>
                    <input 
                      required
                      type="text" 
                      placeholder="V-00000000"
                      value={formCedula}
                      onChange={(e) => setFormCedula(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-100 rounded-lg px-3 py-1.5 text-[11px] font-bold text-slate-700 outline-none focus:ring-2 focus:ring-brand-primary/10"
                    />
                  </div>
                  <div className="space-y-0.5">
                    <label className="text-[8px] font-black text-slate-400 uppercase tracking-wider">Teléfono</label>
                    <input 
                      type="text" 
                      placeholder="0412-0000000"
                      value={formTelefono}
                      onChange={(e) => setFormTelefono(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-100 rounded-lg px-3 py-1.5 text-[11px] font-bold text-slate-700 outline-none focus:ring-2 focus:ring-brand-primary/10"
                    />
                  </div>
                </div>
                
                <div className="space-y-0.5">
                  <label className="text-[8px] font-black text-slate-400 uppercase tracking-wider">Rol *</label>
                  <select 
                    value={formIdRol}
                    onChange={(e) => setFormIdRol(Number(e.target.value))}
                    className="w-full bg-slate-50 border border-slate-100 rounded-lg px-3 py-1.5 text-[11px] font-bold text-slate-700 outline-none focus:ring-2 focus:ring-brand-primary/10"
                  >
                    <option value={4}>Director Adulto Mayor</option>
                    <option value={5}>Director Formación</option>
                    <option value={6}>Director Digitalización</option>
                    <option value={7}>Director Comunas</option>
                    <option value={8}>Sala Autogobierno</option>
                    <option value={9}>Comuna</option>
                    <option value={11}>Consejo Comunal</option>
                  </select>
                </div>
                
                <div className="pt-3 border-t border-slate-50 flex items-center justify-end gap-2">
                  <button 
                    type="button"
                    onClick={() => {
                      setIsCreateModalOpen(false);
                      setEditingUser(null);
                      resetForm();
                    }}
                    className="px-4 py-1.5 border rounded-lg text-[9px] font-black uppercase tracking-wider text-slate-500 hover:bg-slate-50 transition-colors"
                  >
                    Cancelar
                  </button>
                  <button 
                    type="submit"
                    className="px-5 py-1.5 rounded-lg bg-brand-primary text-white text-[9px] font-black uppercase tracking-wider hover:bg-indigo-950 transition-colors"
                    disabled={!editingUser && (!formPassword || !formConfirmPassword)}
                  >
                    {editingUser && !editingUser.activo ? 'Reactivar' : editingUser ? 'Actualizar' : 'Guardar'}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Modal de Confirmación de Contraseña - igual */}
      <AnimatePresence>
        {showConfirmModal && (
          <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-[60] flex items-center justify-center p-4">
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white rounded-xl w-full max-w-sm shadow-2xl overflow-hidden border border-slate-100"
            >
              <div className="bg-slate-950 px-5 py-3 text-white flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Shield size={14} className="text-amber-400" />
                  <h3 className="font-black text-xs uppercase italic tracking-tighter leading-none">
                    Confirmar Acción
                  </h3>
                </div>
                <button 
                  type="button" 
                  onClick={() => {
                    setShowConfirmModal(false);
                    setConfirmPassword('');
                    setConfirmError('');
                  }}
                  className="text-slate-400 hover:text-white transition-colors"
                >
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              
              <div className="p-5">
                <p className="text-[11px] text-slate-600 font-medium text-center mb-4">
                  Para {pendingAction === 'create' ? 'crear' : pendingAction === 'edit' ? 'editar' : pendingAction === 'toggle' ? 'cambiar estado' : 'eliminar'} este usuario, 
                  confirme su identidad con su contraseña
                </p>
                
                <div className="space-y-0.5">
                  <label className="text-[8px] font-black text-slate-400 uppercase tracking-wider pl-1">Contraseña del usuario</label>
                  <div className="relative">
                    <Lock size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input 
                      type="password"
                      placeholder="Ingrese su contraseña"
                      value={confirmPassword}
                      onChange={(e) => {
                        setConfirmPassword(e.target.value);
                        if (confirmError) setConfirmError('');
                      }}
                      onKeyDown={(e) => e.key === 'Enter' && handleConfirmAction()}
                      className="w-full bg-slate-50 border border-slate-100 rounded-lg pl-9 pr-3 py-2 text-[11px] font-bold text-slate-700 outline-none focus:ring-2 focus:ring-brand-primary/10"
                      autoFocus
                    />
                  </div>
                  {confirmError && (
                    <p className="text-[9px] text-rose-500 font-bold mt-1">{confirmError}</p>
                  )}
                </div>
                
                <div className="flex items-center justify-end gap-2 mt-4 pt-3 border-t border-slate-50">
                  <button 
                    type="button"
                    onClick={() => {
                      setShowConfirmModal(false);
                      setConfirmPassword('');
                      setConfirmError('');
                    }}
                    className="px-4 py-1.5 border rounded-lg text-[9px] font-black uppercase tracking-wider text-slate-500 hover:bg-slate-50 transition-colors"
                  >
                    Cancelar
                  </button>
                  <button 
                    type="button"
                    onClick={handleConfirmAction}
                    disabled={isConfirming}
                    className="px-5 py-1.5 rounded-lg bg-brand-primary text-white text-[9px] font-black uppercase tracking-wider hover:bg-indigo-950 transition-colors flex items-center gap-1.5"
                  >
                    {isConfirming ? (
                      <>
                        <div className="h-3 w-3 animate-spin rounded-full border-2 border-white border-t-transparent" />
                        Verificando...
                      </>
                    ) : (
                      'Confirmar'
                    )}
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};