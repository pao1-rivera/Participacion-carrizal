"use client";

import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import { supabase } from '@/app/lib/supabaseClient';

// --- Interfaces ---
type Role = 'admin' | 'alcaldesa' | 'secretario' | 'director' | 'sala_autogobierno' | 'comuna' | 'consejo_comunal';
type DirectorType = 'formacion_planif' | 'comunas_circuitos' | 'adulto_mayor' | 'digitalizacion';

interface UserProfile {
  id: string;
  email: string;
  role: Role;
  firstName: string;
  lastName: string;
  cedula: string;
  phone: string;
  createdAt: string;
  directorType?: DirectorType;
}

interface RegisterData {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  cedula: string;
  phone: string;
  directorType?: DirectorType;
  nombreSala?: string;
  ubicacion?: string;
  vinculoAdministrativo?: string;
  estatus?: string;
  nombreConsejo?: string;
  rif?: string;
}

interface AuthContextType {
  user: UserProfile | null;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  register: (role: Role, data: RegisterData) => Promise<void>;
  isLoading: boolean;
  error: string | null;
}

const getRolId = (role: Role): number => {
  const roles: Record<string, number> = { 
    sala_autogobierno: 8, 
    comuna: 9, 
    consejo_comunal: 11,
    admin: 1,
    alcaldesa: 2,
    secretario: 3 
  };
  return roles[role] || 3; 
};

const getRolIdForDirector = (type: DirectorType): number => {
  const types: Record<string, number> = {
    planificacion_formacion: 4,
    comunas_consejos_comunales: 5,
    adultas_adulto_mayor: 6,
    digitalizacion_tramites: 7,
    formacion_planif: 4,
    comunas_circuitos: 5,
    adulto_mayor: 6,
    digitalizacion: 7
  };
  return types[type] || 4;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const loadingUserRef = useRef(false);
  const initialLoadRef = useRef(true);

  const getCurrentUserWithRoles = async (): Promise<UserProfile | null> => {
    try {
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      if (sessionError || !session?.user) return null;

      const user = session.user;
      const { data: perfil, error: perfilError } = await supabase
        .from('perfil_usuario')
        .select('*')
        .eq('id_usuario', user.id)
        .maybeSingle();

      if (perfilError || !perfil) return null;

      let role: Role = 'secretario';
      if (perfil.id_rol) {
        const { data: rolInfo } = await supabase
          .from('rol_usuario')
          .select('nombre_rol')
          .eq('id_rol', perfil.id_rol)
          .maybeSingle();

        if (rolInfo) {
          const nombreRolDb = rolInfo.nombre_rol.toLowerCase().trim();
          
          switch (nombreRolDb) {
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
            case 'consejo_comunal': 
            case 'vocero_consejo_comunal':
              role = 'consejo_comunal'; 
              break;
          }
        }
      }

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

      if (role === 'director') {
        const { data: dirData } = await supabase
          .from('datos_director')
          .select('tipo_direccion')
          .eq('id_usuario', user.id)
          .maybeSingle();
        if (dirData) profile.directorType = dirData.tipo_direccion;
      }

      return profile;
    } catch (err) {
      return null;
    }
  };

  useEffect(() => {
    if (!initialLoadRef.current) return;
    initialLoadRef.current = false;

    const loadUser = async () => {
      if (loadingUserRef.current) return;
      loadingUserRef.current = true;
      setIsLoading(true);
      try {
        const userWithRoles = await getCurrentUserWithRoles();
        setUser(userWithRoles);
      } finally {
        setIsLoading(false);
        loadingUserRef.current = false;
      }
    };
    loadUser();
  }, []);

  const login = async (email: string, password: string) => {
    setIsLoading(true);
    setError(null);
    try {
      const { error: signInError } = await supabase.auth.signInWithPassword({ email, password });
      if (signInError) throw signInError;
      
      const userWithRoles = await getCurrentUserWithRoles();
      setUser(userWithRoles);
    } catch (err: any) {
      setError(err.message);
      setIsLoading(false);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const register = async (role: Role, data: RegisterData) => {
    setIsLoading(true);
    setError(null);
    try {
      const rolId = role === 'director' ? getRolIdForDirector(data.directorType!) : getRolId(role);
      
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
      if (!authData.user) throw new Error("Error al crear usuario");

      if (role === 'sala_autogobierno') {
        await supabase.from('datos_sala_autogobierno').insert({
          id_usuario: authData.user.id,
          nombre_sala: data.nombreSala,
          ubicacion: data.ubicacion,
          vinculo_administrativo: data.vinculoAdministrativo,
          estatus: data.estatus || 'fortalecimiento',
        });
      }

      if (role === 'director') {
        await supabase.from('datos_director').insert({
          id_usuario: authData.user.id,
          tipo_direccion: data.directorType,
        });
      }
    } catch (err: any) {
      setError(err.message);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async () => {
    await supabase.auth.signOut();
    setUser(null);
    window.location.href = '/login';
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, register, isLoading, error }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
};