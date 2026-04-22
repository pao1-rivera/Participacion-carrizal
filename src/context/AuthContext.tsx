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
