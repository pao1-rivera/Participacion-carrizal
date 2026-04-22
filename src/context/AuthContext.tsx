import React, { createContext, useContext, useState, useEffect } from 'react';
import { UserProfile, Role } from '../types';

interface AuthContextType {
  user: UserProfile | null;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  register: (role: Role, data: any) => Promise<void>;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Check for "session"
    const storedUser = localStorage.getItem('mock_user');
    if (storedUser) {
      setUser(JSON.parse(storedUser));
    }
    setIsLoading(false);
  }, []);

  const login = async (email: string, _password: string) => {
    // Mock login logic
    setIsLoading(true);
    setTimeout(() => {
      let mockUser: UserProfile;

      if (email === 'admin@carrizal.gob.ve') {
        mockUser = {
          id: '1',
          email,
          role: 'admin',
          firstName: 'Admin',
          lastName: 'Municipal',
          cedula: 'V-00000001',
          phone: '0412-1111111',
          createdAt: new Date().toISOString(),
        };
      } else if (email === 'consejo@test.com') {
        mockUser = {
          id: '2',
          email,
          role: 'consejo_comunal',
          firstName: 'Vocero',
          lastName: 'Unidad',
          cedula: 'V-12345678',
          phone: '0414-0000000',
          nombreConsejo: 'C.C. El Despertar de Carrizal',
          rif: 'J-12345678-9',
          comunaPertenece: 'Comuna Brisas',
          cuentaBancaria: '0102-0000-0000-0000-0000',
          firmantes: '3 Voceros',
          createdAt: new Date().toISOString(),
        };
      } else if (email === 'comuna@carrizal.gob.ve') {
        mockUser = {
          id: '3',
          email,
          role: 'comuna',
          firstName: 'Coordinador',
          lastName: 'Comunal',
          cedula: 'V-11223344',
          phone: '0412-3333333',
          comunaName: 'Comuna Lanceros de Carrizal',
          rif: 'J-50000000-0',
          createdAt: new Date().toISOString(),
        };
      } else if (email === 'sala@carrizal.gob.ve') {
        mockUser = {
          id: '4',
          email,
          role: 'sala_autogobierno',
          firstName: 'Coordinador',
          lastName: 'de Sala',
          cedula: 'V-99887766',
          phone: '0412-5555555',
          nombreSala: 'Sala de Autogobierno "Eje Central"',
          ubicacion: 'Casco Central de Carrizal',
          vinculoAdministrativo: 'Circuito 1',
          estatus: 'consolidada',
          createdAt: new Date().toISOString(),
        };
      } else if (email === 'alcaldesa@carrizal.gob.ve') {
        mockUser = {
          id: '5',
          email,
          role: 'alcaldesa',
          firstName: 'Morales',
          lastName: 'Administración',
          cedula: 'V-12121212',
          phone: '0414-0000000',
          createdAt: new Date().toISOString(),
        };
      } else if (email === 'comunas@carrizal.gob.ve') {
        mockUser = {
          id: 'dir_1',
          email,
          role: 'director',
          directorType: 'comunas_consejos_comunales',
          firstName: 'Director',
          lastName: 'de Comunas',
          cedula: 'V-10101010',
          phone: '0412-1111111',
          createdAt: new Date().toISOString(),
        };
      } else if (email === 'planificacion@carrizal.gob.ve') {
        mockUser = {
          id: 'dir_2',
          email,
          role: 'director',
          directorType: 'planificacion_formacion',
          firstName: 'Director',
          lastName: 'de Planificación',
          cedula: 'V-20202020',
          phone: '0412-2222222',
          createdAt: new Date().toISOString(),
        };
      } else if (email === 'adultomayor@carrizal.gob.ve') {
        mockUser = {
          id: 'dir_3',
          email,
          role: 'director',
          directorType: 'adultas_adulto_mayor',
          firstName: 'Director',
          lastName: 'de Adulto Mayor',
          cedula: 'V-30303030',
          phone: '0412-3333333',
          createdAt: new Date().toISOString(),
        };
      } else if (email === 'digitalizacion@carrizal.gob.ve') {
        mockUser = {
          id: 'dir_4',
          email,
          role: 'director',
          directorType: 'digitalizacion_tramites',
          firstName: 'Director',
          lastName: 'de Digitalización',
          cedula: 'V-40404040',
          phone: '0412-4444444',
          createdAt: new Date().toISOString(),
        };
      } else {
        mockUser = {
          id: 'default',
          email,
          role: 'secretario',
          firstName: 'Usuario',
          lastName: 'Demo',
          cedula: 'V-00000000',
          phone: '0412-0000000',
          createdAt: new Date().toISOString(),
        };
      }

      setUser(mockUser);
      localStorage.setItem('mock_user', JSON.stringify(mockUser));
      setIsLoading(false);
    }, 1000);
  };

  const register = async (role: Role, data: any) => {
    setIsLoading(true);
    setTimeout(() => {
      const newUser: UserProfile = {
        ...data,
        id: Math.random().toString(36).substr(2, 9),
        role,
        createdAt: new Date().toISOString(),
      };
      setUser(newUser);
      localStorage.setItem('mock_user', JSON.stringify(newUser));
      setIsLoading(false);
    }, 1500);
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('mock_user');
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, register, isLoading }}>
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
