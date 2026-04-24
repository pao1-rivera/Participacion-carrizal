// src/context/AuthContext.tsx
import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import { UserProfile, Role, DirectorType } from '../types';
import { supabase } from '../lib/supabaseClient';
import { getRolIdForDirector, getRolId } from '../lib/utils/roleMapping';

interface RegisterData {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  cedula: string;
  phone: string;
  directorType?: DirectorType;
  // Sala de Autogobierno
  nombreSala?: string;
  ubicacion?: string;
  vinculoAdministrativo?: string;
  estatus?: string;
  // Consejo Comunal y Comuna (más adelante)
  nombreConsejo?: string;
  rif?: string;
  // ... otros
}

interface AuthContextType {
  user: UserProfile | null;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  register: (role: Role, data: RegisterData) => Promise<void>;
  isLoading: boolean;
  error: string | null;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const loadingUserRef = useRef(false);
  const initialLoadRef = useRef(true);

  // Función robusta para obtener el usuario con sus roles (similar a la versión funcional)
  const getCurrentUserWithRoles = async (): Promise<UserProfile | null> => {
    console.log('getCurrentUserWithRoles: inicio');
    try {
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      if (sessionError) {
        console.error('Error getSession:', sessionError);
        return null;
      }
      if (!session?.user) {
        console.log('No hay sesión activa');
        return null;
      }
      const user = session.user;
      console.log('user.id:', user.id);

      // Obtener perfil del usuario
      const { data: perfil, error: perfilError } = await supabase
        .from('perfil_usuario')
        .select('*')
        .eq('id_usuario', user.id)
        .maybeSingle();

      if (perfilError || !perfil) {
        console.error('Error perfil_usuario:', perfilError);
        return null;
      }

      // Obtener el rol asociado
      let role: Role = 'secretario';
      let nivelJerarquia = 99;

      if (perfil.id_rol) {
        const { data: rolInfo, error: rolError } = await supabase
          .from('rol_usuario')
          .select('*')
          .eq('id_rol', perfil.id_rol)
          .maybeSingle();

        if (!rolError && rolInfo) {
          const roleName = rolInfo.nombre_rol;
          nivelJerarquia = rolInfo.nivel_jerarquia;
          
          // Mapear nombre_rol de la BD al tipo Role del frontend
          switch (roleName) {
            case 'admin': role = 'admin'; break;
            case 'alcaldesa': role = 'alcaldesa'; break;
            case 'secretario': role = 'secretario'; break;
            case 'director_formacion_planif':
            case 'director_comunas_circuitos':
            case 'director_adulto_mayor':
            case 'director_digitalizacion':
              role = 'director';
              break;
            case 'encargado_sala_autogob': role = 'sala_autogobierno'; break;
            case 'vocero_comuna': role = 'comuna'; break;
            case 'consejo_comunal': role = 'consejo_comunal'; break;
            default: role = 'secretario';
          }
          console.log('Rol encontrado:', roleName, '→ mapeado a:', role);
        }
      }

      // Construir UserProfile
      const profile: UserProfile = {
        id: perfil.id_usuario,
        email: perfil.email,
        role,
        firstName: perfil.nombre || '',
        lastName: perfil.apellido || '',
        cedula: perfil.cedula || '',
        phone: perfil.telefono || '',
        createdAt: perfil.created_at,
      };

      // Si es director, obtener tipo_direccion
      if (role === 'director') {
        const { data: dirData, error: dirError } = await supabase
          .from('datos_director')
          .select('tipo_direccion')
          .eq('id_usuario', user.id)
          .maybeSingle();

        if (!dirError && dirData?.tipo_direccion) {
          (profile as any).directorType = dirData.tipo_direccion;
        }
      }

      return profile;
    } catch (error) {
      console.error('Error catastrófico en getCurrentUserWithRoles:', error);
      return null;
    }
  };

  // Cargar sesión al iniciar - usando la misma estrategia que la versión funcional
  useEffect(() => {
    // Solo ejecutar una vez
    if (initialLoadRef.current === false) return;
    initialLoadRef.current = false;

    const loadUser = async () => {
      if (loadingUserRef.current) return;
      loadingUserRef.current = true;
      
      console.log('Loading user session...');
      setIsLoading(true);
      
      try {
        const userWithRoles = await getCurrentUserWithRoles();
        setUser(userWithRoles);
      } catch (err) {
        console.error('Error loading user:', err);
        setUser(null);
      } finally {
        setIsLoading(false);
        loadingUserRef.current = false;
      }
    };
    
    loadUser();
  }, []);

  // Login con email y contraseña - usando redirección completa
  const login = async (email: string, password: string) => {
    setIsLoading(true);
    setError(null);
    try {
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      if (signInError) throw signInError;
      
      // Forzar recarga completa para que el contexto se reinicie y evite locks
      window.location.href = '/dashboard';
    } catch (err: any) {
      console.error('Login error:', err);
      setError(err.message || 'Error al iniciar sesión');
      setIsLoading(false);
      throw err;
    }
  };

  // Registro de nuevo usuario
  const register = async (role: Role, data: RegisterData) => {
    setIsLoading(true);
    setError(null);
    try {
      // 1. Validar que el rol sea público permitido
      const allowedRoles: Role[] = ['director', 'sala_autogobierno', 'comuna', 'consejo_comunal'];
      if (!allowedRoles.includes(role)) {
        throw new Error(`Registro no permitido para el rol "${role}". Contacta al administrador.`);
      }

      // 2. Determinar el id_rol según el rol
      let rolId: number;
      if (role === 'director') {
        if (!data.directorType) throw new Error('Tipo de director requerido');
        rolId = getRolIdForDirector(data.directorType);
      } else {
        // Para sala, comuna, consejo comunal
        rolId = getRolId(role);   // getRolId debe devolver 8,9,11 respectivamente
      }

      // 3. Crear usuario en Auth (el trigger creará perfil_usuario)
      const { data: authData, error: signUpError } = await supabase.auth.signUp({
        email: data.email,
        password: data.password,
        options: {
          data: {
            nombre: data.firstName,
            apellido: data.lastName,
            cedula: data.cedula,
            telefono: data.phone,
            id_rol: rolId,
            activo: true,
          },
        },
      });
      if (signUpError) throw signUpError;
      if (!authData.user) throw new Error('No se pudo crear el usuario');

      // Pequeña pausa para que el trigger termine (opcional)
      await new Promise(resolve => setTimeout(resolve, 500));

      // 4. Datos específicos según el rol (solo si el formulario envió esos campos)
      if (role === 'sala_autogobierno' && data.nombreSala) {
        const { error: salaError } = await supabase
          .from('datos_sala_autogobierno')
          .insert({
            id_usuario: authData.user.id,
            nombre_sala: data.nombreSala,
            ubicacion: data.ubicacion,
            vinculo_administrativo: data.vinculoAdministrativo,
            estatus: data.estatus || 'fortalecimiento',
          });
        if (salaError) console.error('Error insertando sala:', salaError);
      }

      if (role === 'director') {
        const { error: directorError } = await supabase
          .from('datos_director')
          .insert({
            id_usuario: authData.user.id,
            tipo_direccion: data.directorType,
          });
        if (directorError) console.error('Error insertando director:', directorError);
      }

      // Para comuna y consejo comunal, aún no se insertan datos específicos
      // (se harán después, en el dashboard)

      // 5. Redirigir al dashboard
      window.location.href = '/dashboard';
    } catch (err: any) {
      console.error('Registration error:', err);
      setError(err.message || 'Error al registrarse');
      setIsLoading(false);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  // Logout
  const logout = async () => {
    setIsLoading(true);
    setError(null);
    try {
      await supabase.auth.signOut();
      setUser(null);
      window.location.href = '/login';
    } catch (err: any) {
      console.error('Logout error:', err);
      setError(err.message);
      setIsLoading(false);
      throw err;
    }
  };

  return (
    <AuthContext.Provider
      value={{ user, login, logout, register, isLoading, error }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};