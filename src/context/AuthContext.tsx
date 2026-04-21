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
      const mockUser: UserProfile = {
        id: '1',
        email,
        role: 'admin',
        firstName: 'Administrador',
        lastName: 'Sistema',
        cedula: 'V-00000000',
        phone: '0412-0000000',
        createdAt: new Date().toISOString(),
      };
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
