"use client";

import React, { useState, useEffect } from 'react';

interface AlertModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  message: string;
  type?: 'info' | 'success' | 'warning' | 'danger';
  showInput?: boolean;
  inputPlaceholder?: string;
  cancelText?: string;
  confirmText?: string;
  onConfirm?: (inputValue?: string) => void;
}

export const AlertModal: React.FC<AlertModalProps> = ({
  isOpen,
  onClose,
  title,
  message,
  type = 'info',
  showInput = false,
  inputPlaceholder = 'Escribe aquí...',
  cancelText = 'Cancelar',
  confirmText = 'Aceptar',
  onConfirm,
}) => {
  const [inputValue, setInputValue] = useState('');
  const [shouldRender, setShouldRender] = useState(isOpen);
  const [animate, setAnimate] = useState(false);

  useEffect(() => {
    if (isOpen) {
      // 1. Primero montamos el componente en el DOM
      setShouldRender(true);
      
      // 2. Usamos requestAnimationFrame doble para asegurar que el navegador 
      // pinte el estado inicial (opacidad 0, escala 95) ANTES de activar la transición
      const animationFrame = requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          setAnimate(true);
        });
      });

      return () => cancelAnimationFrame(animationFrame);
    } else {
      // 3. Al cerrar, desactivamos la animación primero para ver el efecto de salida
      setAnimate(false);
      
      // 4. Esperamos los 200ms que dura la transición de Tailwind antes de desmontar del DOM
      const timeout = setTimeout(() => {
        setShouldRender(false);
      }, 200);

      return () => clearTimeout(timeout);
    }
  }, [isOpen]);

  if (!shouldRender) return null;

  const typeConfig = {
    info: {
      btn: 'bg-brand-primary hover:bg-brand-secondary text-white shadow-brand-primary/20',
      border: 'border-l-4 border-l-brand-primary'
    },
    success: {
      btn: 'bg-brand-accent hover:opacity-90 text-white shadow-brand-accent/20',
      border: 'border-l-4 border-l-brand-accent'
    },
    warning: {
      btn: 'bg-amber-500 hover:bg-amber-600 text-white shadow-amber-500/20',
      border: 'border-l-4 border-l-amber-500'
    },
    danger: {
      btn: 'bg-red-600 hover:bg-red-700 text-white shadow-red-600/20',
      border: 'border-l-4 border-l-red-600'
    },
  };

  const handleConfirm = () => {
    if (onConfirm) {
      onConfirm(showInput ? inputValue : undefined);
    }
    setInputValue('');
    onClose();
  };

  return (
    <div 
      className={`fixed inset-0 z-9999 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm transition-opacity duration-200 ease-in-out ${
        animate ? 'opacity-100' : 'opacity-0'
      }`}
    >
      {/* Tarjeta de Alerta */}
      <div 
        className={`w-full max-w-md p-6 bg-surface-card rounded-4xl border border-border-subtle shadow-2xl transition-all duration-200 ease-in-out ${
          typeConfig[type].border
        } ${
          animate ? 'scale-100 opacity-100 translate-y-0' : 'scale-95 opacity-0 translate-y-2'
        }`}
      >
        <h3 className="text-sm font-black text-slate-800 italic uppercase tracking-tighter mb-2">
          {title}
        </h3>
        
        <p className="text-[11px] font-bold text-slate-500 leading-relaxed mb-5">
          {message}
        </p>

        {showInput && (
          <input
            type="text"
            className="w-full p-4 mb-5 text-xs font-bold rounded-2xl bg-surface-soft border-none ring-1 ring-border-subtle outline-none focus:ring-2 focus:ring-brand-primary transition-all placeholder-slate-400"
            placeholder={inputPlaceholder}
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
          />
        )}

        <div className="flex justify-end space-x-3">
          {onConfirm && (
            <button
              onClick={onClose}
              className="px-5 py-3 bg-surface-soft hover:bg-gray-100 text-slate-600 rounded-xl font-black text-[10px] uppercase tracking-widest border border-border-subtle transition-all cursor-pointer active:scale-98"
            >
              {cancelText}
            </button>
          )}
          
          <button
            onClick={handleConfirm}
            className={`px-5 py-3 rounded-xl font-black text-[10px] uppercase tracking-widest shadow-lg transition-all cursor-pointer active:scale-95 ${typeConfig[type].btn}`}
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
};