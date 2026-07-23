"use client";

import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import { supabase } from '@/app/lib/supabaseClient';
import { Role } from '@/types';

export interface UserProfile {
  id: string;
  email: string;
  nombre: string;
  apellido: string;
  cedula: string;
  telefono: string;
  rolNombre: Role;
  createdAt: string;
  nombreSala?: string;
  nombreComuna?: string;
  nombreConsejo?: string;
  id_consejo?: number;
  activo: boolean; // ← agregado
}

export interface RegisterData {
  email: string;
  password: string;
  nombre: string;
  apellido: string;
  cedula: string;
  telefono: string;
  rolNombre: Role;
}

interface AuthContextType {
  user: UserProfile | null;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  register: (data: RegisterData) => Promise<void>;
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

  const getCurrentUserWithRoles = async (): Promise<UserProfile | null> => {
    try {
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      if (sessionError || !session?.user) return null;

      const authUser = session.user;

      // 1. Perfil base
      const { data: perfil, error: perfilError } = await supabase
        .from('perfil_usuario')
        .select('*')
        .eq('id_usuario', authUser.id)
        .maybeSingle();

      if (perfilError || !perfil) return null;

      // 2. Resolver rol
      let rolNombre: Role = 'vocero_cc';
      if (perfil.id_rol) {
        const { data: rolInfo } = await supabase
          .from('rol_usuario')
          .select('nombre_rol')
          .eq('id_rol', perfil.id_rol)
          .maybeSingle();
        if (rolInfo) rolNombre = rolInfo.nombre_rol as Role;
      }

      // 3. Obtener nombre de instancia según el rol
      let nombreInstancia = '';
      let idConsejo: number | undefined = undefined;

      const rolMap = {
        'sala_autogobierno': { tabla: 'datos_sala_autogobierno', columna: 'nombre_sala' },
        'comuna': { tabla: 'datos_comuna', columna: 'nombre_comuna' },
        'consejo_comunal': { tabla: 'datos_consejo_comunal', columna: 'nombre_consejo' }
      };

      const config = rolMap[rolNombre as keyof typeof rolMap];
      if (config) {
        const { data: instanciaData, error: instanciaError } = await supabase
          .from(config.tabla)
          .select(`${config.columna}, id_consejo_comunal, id_comuna, id_sala_autogobierno`)
          .eq('id_usuario', authUser.id)
          .maybeSingle();

        if (!instanciaError && instanciaData) {
          nombreInstancia = instanciaData[config.columna] || '';
          if (rolNombre === 'consejo_comunal') idConsejo = instanciaData.id_consejo_comunal;
          else if (rolNombre === 'comuna') idConsejo = instanciaData.id_comuna;
          else if (rolNombre === 'sala_autogobierno') idConsejo = instanciaData.id_sala_autogobierno;
        }
      }

      // 4. Retornar objeto completo incluyendo 'activo'
      return {
        id: perfil.id_usuario,
        email: perfil.email,
        nombre: perfil.nombre || '',
        apellido: perfil.apellido || '',
        cedula: perfil.cedula || '',
        telefono: perfil.telefono || '',
        rolNombre,
        createdAt: perfil.created_at,
        nombreSala: rolNombre === 'sala_autogobierno' ? nombreInstancia : undefined,
        nombreComuna: rolNombre === 'comuna' ? nombreInstancia : undefined,
        nombreConsejo: rolNombre === 'consejo_comunal' ? nombreInstancia : undefined,
        id_consejo: idConsejo,
        activo: perfil.activo ?? false // ← nuevo campo
      };
    } catch (err) {
      console.error('Error en getCurrentUserWithRoles:', err);
      return null;
    }
  };

  // Carga inicial de sesión
  useEffect(() => {
    if (!initialLoadRef.current) return;
    initialLoadRef.current = false;

    const loadUser = async () => {
      if (loadingUserRef.current) return;
      loadingUserRef.current = true;
      setIsLoading(true);
      try {
        const userWithRoles = await getCurrentUserWithRoles();
        // Si el usuario existe pero no está activo, lo ignoramos
        if (userWithRoles && !userWithRoles.activo) {
          await supabase.auth.signOut();
          setUser(null);
        } else {
          setUser(userWithRoles);
        }
      } catch (err) {
        console.error(err);
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
      if (!userWithRoles) throw new Error('Perfil no encontrado');

      // ✅ Validar que el usuario esté activo
      if (!userWithRoles.activo) {
        await supabase.auth.signOut();
        throw new Error('Tu cuenta aún no ha sido validada por el administrador. Revisa tu correo electrónico para más información.');
      }

      setUser(userWithRoles);
    } catch (err: any) {
      setError(err.message);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const register = async (payload: RegisterData) => {
  setIsLoading(true);
  setError(null);
  try {
    const { data, error } = await supabase.functions.invoke('register-public', {
      body: payload,
    });

    if (error) {
      // Intentar leer el cuerpo del error (funciona para errores HTTP)
      if (error.context && typeof error.context.json === 'function') {
        const errorBody = await error.context.json();
        throw new Error(errorBody.error || error.message);
      }
      throw error;
    }
    return data;
  } catch (err: any) {
    const errorMsg = err.message || 'Ocurrió un error en el servidor de registro.';
    setError(errorMsg);
    throw err;
  } finally {
    setIsLoading(false);
  }
};

  const logout = async () => {
    await supabase.auth.signOut();
    setUser(null);
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