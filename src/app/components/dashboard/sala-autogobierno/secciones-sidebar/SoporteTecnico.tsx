import React from 'react';
import { 
  Settings 
} from 'lucide-react';

export const SoporteTecnico: React.FC = () => {
  return (
    <div className="flex items-center justify-center h-[calc(100vh-280px)]">
      <div className="text-center">
        <div className="bg-gray-100 p-6 rounded-full w-20 h-20 flex items-center justify-center mx-auto mb-4">
          <Settings className="w-10 h-10 text-gray-400 animate-spin-slow" />
        </div>
        <h3 className="text-xl font-medium text-gray-900 leading-tight uppercase tracking-tighter">Módulo de Soporte en Desarrollo</h3>
        <p className="text-gray-500 max-w-sm mx-auto mt-2 italic shadow-xs">
          Estamos digitalizando este nudo crítico administrativo. Contacte a la central para ayuda inmediata.
        </p>
      </div>
    </div>
  );
};
