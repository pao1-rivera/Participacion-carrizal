import React from 'react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { LogOut, User, LayoutDashboard, Flag } from 'lucide-react';
import { cn } from '../../lib/utils';

export const Navbar: React.FC = () => {
  const { user, logout } = useAuth();

  return (
    <nav className="sticky top-0 z-50 w-full border-b border-gray-200 bg-white shadow-sm">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-indigo-900 text-white font-bold transition-transform hover:scale-105 cursor-default">
            AC
          </div>
          <div>
            <h1 className="text-lg font-bold leading-none text-indigo-950">Alcaldía de Carrizal</h1>
            <p className="text-[10px] text-gray-500 uppercase tracking-widest font-bold mt-0.5">Participación Ciudadana</p>
          </div>
        </div>

        <div className="flex items-center gap-4">
          {user ? (
            <>
              <div className="hidden items-center gap-1 sm:flex">
                <NavLink
                  to="/dashboard"
                  className={({ isActive }) =>
                    cn(
                      "flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium transition-colors",
                      isActive ? "bg-indigo-50 text-indigo-700" : "text-gray-600 hover:bg-gray-50"
                    )
                  }
                >
                  <LayoutDashboard className="h-4 w-4" />
                  Inicio
                </NavLink>
                <NavLink
                  to="/profile"
                  className={({ isActive }) =>
                    cn(
                      "flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium transition-colors",
                      isActive ? "bg-indigo-50 text-indigo-700" : "text-gray-600 hover:bg-gray-50"
                    )
                  }
                >
                  <User className="h-4 w-4" />
                  Perfil
                </NavLink>
              </div>
              <div className="h-4 w-[1px] bg-gray-200 mx-2" />
              <div className="flex flex-col items-end leading-tight">
                <span className="text-sm font-bold text-gray-900">{user.firstName} {user.lastName}</span>
                <span className="text-[10px] capitalize font-bold text-indigo-600 tracking-tight">{user.role.replace('_', ' ')}</span>
              </div>
              <button
                onClick={logout}
                className="flex items-center justify-center rounded-full p-2 text-gray-400 hover:bg-gray-100 hover:text-gray-700 transition-colors"
                title="Cerrar Sesión"
              >
                <LogOut className="h-5 w-5" />
              </button>
            </>
          ) : (
            <div className="flex items-center gap-6">
              <NavLink
                to="/login"
                className="text-sm font-bold text-gray-600 hover:text-indigo-600"
              >
                Ingreso
              </NavLink>
              <NavLink
                to="/register"
                className="rounded-lg bg-indigo-600 px-5 py-2 text-sm font-bold text-white hover:bg-indigo-700 transition-all shadow-md shadow-indigo-100"
              >
                Registrar
              </NavLink>
            </div>
          )}
        </div>
      </div>
    </nav>
  );
};
