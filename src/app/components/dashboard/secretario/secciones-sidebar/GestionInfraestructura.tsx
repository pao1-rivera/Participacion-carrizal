'use client';
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { 
  Building2, Wifi, Eye, CheckCircle2,
  Monitor, Accessibility, 
  X, Loader2, Users as UsersIcon, Search
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/app/lib/utils';
import { supabase } from '@/app/lib/supabaseClient';
import { useAuth } from '@/context/AuthContext';

// ==================== INTERFACES ====================
interface InfraestructuraData {
  id_infraestructura?: number;
  id_sala: number;
  id_usuario: string;
  capacidad_optima: string | null;
  estado_estructural: string | null;
  mobiliario_suficiente: string | null;
  mobiliario_desc: string | null;
  distribucion_debate: string | null;
  iluminacion: string | null;
  iluminacion_desc: string | null;
  ventilacion: string | null;
  ventilacion_desc: string | null;
  acceso_internet: string | null;
  tipo_conexion: string | null;
  pantallas_audio: string | null;
  pantallas_desc: string | null;
  equipos_funcionales: string | null;
  equipos_desc: string | null;
  estado_hardware: string | null;
  hardware_desc: string | null;
  rampas_acceso: string | null;
  senaletica: string | null;
  sanitarios: string | null;
  agua_potable: string | null;
  identidad_estetica: string | null;
  seguridad_cerraduras: string | null;
}

interface SalaAutogobierno {
  id_sala: number;
  nombre_sala: string;
  ubicacion: string;
  estatus: string;
  id_comuna: number | null;
  id_sector: number | null;
}

interface CaracterizacionStats {
  totalSalas: number;
  conDiagnostico: number;
  conInternetEstable: number;
  conEstadoEstructuralBueno: number;
}

// ==================== COMPONENTE PRINCIPAL ====================
export const GestionInfraestructura = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [salas, setSalas] = useState<SalaAutogobierno[]>([]);
  const [selectedSala, setSelectedSala] = useState<SalaAutogobierno | null>(null);
  const [infraestructura, setInfraestructura] = useState<InfraestructuraData | null>(null);
  const [detalleModalOpen, setDetalleModalOpen] = useState(false);
  const [loadingInfra, setLoadingInfra] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [stats, setStats] = useState<CaracterizacionStats>({
    totalSalas: 0,
    conDiagnostico: 0,
    conInternetEstable: 0,
    conEstadoEstructuralBueno: 0,
  });
  const [loadingStats, setLoadingStats] = useState(true);

  // ========== OCULTAR SIDEBAR CUANDO LA MODAL ESTÁ ABIERTA ==========
  useEffect(() => {
    if (detalleModalOpen) {
      document.body.classList.add('modal-open');
      const styleId = 'modal-sidebar-hide';
      if (!document.getElementById(styleId)) {
        const style = document.createElement('style');
        style.id = styleId;
        style.textContent = `
          .modal-open .sidebar,
          .modal-open [class*="sidebar"],
          .modal-open aside {
            display: none !important;
          }
          .modal-open .main-content,
          .modal-open [class*="main"] {
            margin-left: 0 !important;
            width: 100% !important;
          }
        `;
        document.head.appendChild(style);
      }
    } else {
      document.body.classList.remove('modal-open');
      const styleElement = document.getElementById('modal-sidebar-hide');
      if (styleElement) styleElement.remove();
    }
    return () => {
      document.body.classList.remove('modal-open');
      const styleElement = document.getElementById('modal-sidebar-hide');
      if (styleElement) styleElement.remove();
    };
  }, [detalleModalOpen]);

  // Cargar todas las salas de autogobierno
  const cargarSalas = useCallback(async () => {
    setLoading(true);
    try {
      const { data: salasData, error: salasError } = await supabase
        .from('datos_sala_autogobierno')
        .select('id_sala, nombre_sala, ubicacion, estatus, id_comuna, id_sector')
        .order('nombre_sala');

      if (salasError) throw salasError;
      setSalas(salasData || []);
    } catch (error) {
      console.error('Error cargando salas:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  // Cargar estadísticas de caracterización
  const cargarCaracterizaciones = useCallback(async () => {
    setLoadingStats(true);
    try {
      // Obtener todas las infraestructuras
      const { data: infraData, error: infraError } = await supabase
        .from('infraestructura_sala')
        .select('id_sala, acceso_internet, estado_estructural');
      
      if (infraError) throw infraError;

      const totalSalas = salas.length;
      const conDiagnostico = infraData?.length || 0;
      const conInternetEstable = infraData?.filter(i => i.acceso_internet === 'Estable').length || 0;
      const conEstadoEstructuralBueno = infraData?.filter(i => 
        i.estado_estructural === 'Excelente' || i.estado_estructural === 'Bueno'
      ).length || 0;

      setStats({
        totalSalas,
        conDiagnostico,
        conInternetEstable,
        conEstadoEstructuralBueno,
      });
    } catch (error) {
      console.error('Error cargando caracterizaciones:', error);
    } finally {
      setLoadingStats(false);
    }
  }, [salas.length]);

  // Cargar infraestructura de una sala específica
  const cargarInfraestructura = async (id_sala: number) => {
    setLoadingInfra(true);
    try {
      const { data: infraData, error: infraError } = await supabase
        .from('infraestructura_sala')
        .select('*')
        .eq('id_sala', id_sala)
        .maybeSingle();
      
      if (infraError) throw infraError;
      setInfraestructura(infraData as InfraestructuraData || null);
    } catch (error) {
      console.error('Error cargando infraestructura:', error);
      setInfraestructura(null);
    } finally {
      setLoadingInfra(false);
    }
  };

  const handleVerDetalle = async (sala: SalaAutogobierno) => {
    setSelectedSala(sala);
    await cargarInfraestructura(sala.id_sala);
    setDetalleModalOpen(true);
  };

  useEffect(() => {
    cargarSalas();
  }, [cargarSalas]);

  useEffect(() => {
    if (salas.length > 0) {
      cargarCaracterizaciones();
    }
  }, [salas, cargarCaracterizaciones]);

  // Filtrar salas por búsqueda
  const filteredSalas = useMemo(() => {
    if (!searchTerm.trim()) return salas;
    const term = searchTerm.toLowerCase();
    return salas.filter(sala => 
      sala.nombre_sala.toLowerCase().includes(term) ||
      (sala.ubicacion && sala.ubicacion.toLowerCase().includes(term)) ||
      (sala.estatus && sala.estatus.toLowerCase().includes(term))
    );
  }, [salas, searchTerm]);

  if (loading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-[#008f82]" />
      </div>
    );
  }

  return (
    <div className="space-y-8 p-3 md:p-6">
      {/* Modal de Detalle de Sala (sin cambios) */}
      <AnimatePresence>
        {detalleModalOpen && selectedSala && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div 
              className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" 
              onClick={() => setDetalleModalOpen(false)} 
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="relative w-full max-w-3xl bg-white rounded-xl shadow-2xl overflow-hidden max-h-[90vh] flex flex-col"
            >
              <div className="p-2.5 bg-brand-primary text-white sticky top-0 z-10">
                <div className="flex justify-between items-center">
                  <div>
                    <h3 className="font-black uppercase tracking-wider text-xs">
                      {selectedSala.nombre_sala}
                    </h3>
                    <p className="text-[9px] text-white/70 mt-0.5">{selectedSala.ubicacion}</p>
                  </div>
                  <button 
                    onClick={() => setDetalleModalOpen(false)} 
                    className="hover:bg-white/10 p-1 rounded-full transition"
                  >
                    <X size={16} />
                  </button>
                </div>
              </div>
              <div className="flex-1 overflow-y-auto p-3">
                {loadingInfra ? (
                  <div className="flex justify-center py-8">
                    <Loader2 className="h-6 w-6 animate-spin text-[#008f82]" />
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    {/* Columna 1: Espacio y Mobiliario */}
                    <div className="space-y-2">
                      <h4 className="text-[#004d46] font-black text-[10px] uppercase tracking-wider flex items-center gap-1 border-b pb-1">
                        <Building2 size={12} /> Espacio y Mobiliario
                      </h4>
                      <div className="grid grid-cols-1 gap-1.5">
                        <InfoCardCompact 
                          label="Capacidad Óptima" 
                          value={infraestructura?.capacidad_optima || 'No registrado'}
                          type="status"
                        />
                        <InfoCardCompact 
                          label="Estado Estructural" 
                          value={infraestructura?.estado_estructural || 'No registrado'}
                          type="status"
                        />
                        <InfoCardCompact 
                          label="Mobiliario Suficiente" 
                          value={infraestructura?.mobiliario_suficiente || 'No registrado'}
                          type="status"
                        />
                        {infraestructura?.mobiliario_desc && (
                          <InfoCardCompact 
                            label="Descripción Mobiliario" 
                            value={infraestructura.mobiliario_desc}
                            type="text"
                            fullWidth
                          />
                        )}
                        <InfoCardCompact 
                          label="Distribución para Debate" 
                          value={infraestructura?.distribucion_debate || 'No registrado'}
                          type="status"
                        />
                        <InfoCardCompact 
                          label="Iluminación" 
                          value={infraestructura?.iluminacion || 'No registrado'}
                          type="status"
                        />
                        {infraestructura?.iluminacion_desc && (
                          <InfoCardCompact 
                            label="Descripción Iluminación" 
                            value={infraestructura.iluminacion_desc}
                            type="text"
                            fullWidth
                          />
                        )}
                        <InfoCardCompact 
                          label="Ventilación" 
                          value={infraestructura?.ventilacion || 'No registrado'}
                          type="status"
                        />
                        {infraestructura?.ventilacion_desc && (
                          <InfoCardCompact 
                            label="Descripción Ventilación" 
                            value={infraestructura.ventilacion_desc}
                            type="text"
                            fullWidth
                          />
                        )}
                      </div>
                    </div>

                    {/* Columna 2: Conectividad y Hardware */}
                    <div className="space-y-2">
                      <h4 className="text-[#004d46] font-black text-[10px] uppercase tracking-wider flex items-center gap-1 border-b pb-1">
                        <Wifi size={12} /> Conectividad y Hardware
                      </h4>
                      <div className="grid grid-cols-1 gap-1.5">
                        <InfoCardCompact 
                          label="Acceso a Internet" 
                          value={infraestructura?.acceso_internet || 'No registrado'}
                          type="status"
                        />
                        <InfoCardCompact 
                          label="Tipo de Conexión" 
                          value={infraestructura?.tipo_conexion || 'No registrado'}
                          type="text"
                        />
                        <InfoCardCompact 
                          label="Pantallas y Audio" 
                          value={infraestructura?.pantallas_audio || 'No registrado'}
                          type="status"
                        />
                        {infraestructura?.pantallas_desc && (
                          <InfoCardCompact 
                            label="Descripción Pantallas/Audio" 
                            value={infraestructura.pantallas_desc}
                            type="text"
                            fullWidth
                          />
                        )}
                        <InfoCardCompact 
                          label="Equipos Funcionales" 
                          value={infraestructura?.equipos_funcionales || 'No registrado'}
                          type="status"
                        />
                        {infraestructura?.equipos_desc && (
                          <InfoCardCompact 
                            label="Descripción Equipos" 
                            value={infraestructura.equipos_desc}
                            type="text"
                            fullWidth
                          />
                        )}
                        <InfoCardCompact 
                          label="Estado del Hardware" 
                          value={infraestructura?.estado_hardware || 'No registrado'}
                          type="status"
                        />
                        {infraestructura?.hardware_desc && (
                          <InfoCardCompact 
                            label="Descripción Hardware" 
                            value={infraestructura.hardware_desc}
                            type="text"
                            fullWidth
                          />
                        )}
                      </div>
                    </div>

                    {/* Columna 3: Gestión y Servicios */}
                    <div className="space-y-2">
                      <h4 className="text-[#004d46] font-black text-[10px] uppercase tracking-wider flex items-center gap-1 border-b pb-1">
                        <UsersIcon size={12} /> Gestión y Servicios
                      </h4>
                      <div className="grid grid-cols-1 gap-1.5">
                        <InfoCardCompact 
                          label="Rampas de Acceso" 
                          value={infraestructura?.rampas_acceso || 'No registrado'}
                          type="status"
                        />
                        <InfoCardCompact 
                          label="Señalética" 
                          value={infraestructura?.senaletica || 'No registrado'}
                          type="status"
                        />
                        <InfoCardCompact 
                          label="Sanitarios" 
                          value={infraestructura?.sanitarios || 'No registrado'}
                          type="status"
                        />
                        <InfoCardCompact 
                          label="Agua Potable" 
                          value={infraestructura?.agua_potable || 'No registrado'}
                          type="status"
                        />
                        <InfoCardCompact 
                          label="Identidad Estética" 
                          value={infraestructura?.identidad_estetica || 'No registrado'}
                          type="status"
                        />
                        <InfoCardCompact 
                          label="Seguridad/Cerraduras" 
                          value={infraestructura?.seguridad_cerraduras || 'No registrado'}
                          type="status"
                        />
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Encabezado principal */}
      <div>
        <h2 className="text-sm md:text-base font-black text-brand-primary uppercase tracking-tighter italic">
          Dimensión II: Infraestructura y Servicios
        </h2>
        <p className="text-[9px] md:text-[10px] text-gray-500 font-bold uppercase tracking-widest mt-0.5">
          Evaluación operativa de Salas de Autogobierno y Entorno Físico
        </p>
      </div>

      {/* Tarjetas de Caracterización */}
      {!loadingStats && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
          <StatCard 
            title="Total de Salas" 
            value={stats.totalSalas} 
            icon={<Building2 size={18} className="text-[#008f82]" />}
            color="bg-teal-50"
          />
          <StatCard 
            title="Con Diagnóstico" 
            value={stats.conDiagnostico} 
            icon={<CheckCircle2 size={18} className="text-emerald-500" />}
            color="bg-emerald-50"
          />
          <StatCard 
            title="Internet Estable" 
            value={stats.conInternetEstable} 
            icon={<Wifi size={18} className="text-blue-500" />}
            color="bg-blue-50"
          />
          <StatCard 
            title="Estructura Buena" 
            value={stats.conEstadoEstructuralBueno} 
            icon={<Building2 size={18} className="text-amber-500" />}
            color="bg-amber-50"
          />
        </div>
      )}

      {/* Buscador */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={14} />
          <input
            type="text"
            placeholder="Buscar por nombre, ubicación o estatus..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-4 py-2 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#008f82] focus:border-transparent"
          />
        </div>
        <p className="text-xs text-gray-500">
          Mostrando {filteredSalas.length} de {salas.length} salas
        </p>
      </div>

      {/* Listado de Salas (con buscador aplicado) */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="p-4 bg-brand-primary text-white">
          <div className="flex items-center gap-2">
            <div className="p-1.5 bg-white/10 rounded-lg"><Building2 size={16} /></div>
            <h3 className="font-black uppercase text-[10px] tracking-widest">Salas de Autogobierno Registradas</h3>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead className="bg-gray-50/50 border-b border-gray-100">
              <tr className="text-[9px] font-black text-gray-400 uppercase tracking-widest">
                <th className="p-4">Nombre de la Sala</th>
                <th className="p-4">Ubicación</th>
                <th className="p-4">Estatus</th>
                <th className="p-4">Comuna/Sector</th>
                <th className="p-4">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {filteredSalas.length === 0 ? (
                <tr>
                  <td colSpan={5} className="p-8 text-center text-gray-400 text-sm">
                    No se encontraron salas que coincidan con la búsqueda
                  </td>
                </tr>
              ) : (
                filteredSalas.map((sala) => (
                  <SalaRow 
                    key={sala.id_sala}
                    sala={sala}
                    onVerDetalle={handleVerDetalle}
                  />
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

// ==================== COMPONENTES AUXILIARES ====================

function InfoCardCompact({ label, value, type = 'text', fullWidth = false }: { label: string; value: string; type?: 'status' | 'text'; fullWidth?: boolean }) {
  const getStatusColor = (val: string) => {
    const statusMap: Record<string, string> = {
      'Excelente': 'bg-emerald-50 text-emerald-600',
      'Bueno': 'bg-emerald-50 text-emerald-600',
      'Óptimo': 'bg-emerald-50 text-emerald-600',
      'Sí': 'bg-emerald-50 text-emerald-600',
      'Regular': 'bg-amber-50 text-amber-600',
      'Parcialmente': 'bg-amber-50 text-amber-600',
      'Malo': 'bg-red-50 text-red-600',
      'Crítico': 'bg-red-50 text-red-600',
      'No': 'bg-red-50 text-red-600',
      'No disponible': 'bg-red-50 text-red-600',
      'Intermitente': 'bg-amber-50 text-amber-600',
      'Estable': 'bg-emerald-50 text-emerald-600',
      'Validado': 'bg-blue-50 text-blue-600',
      'Pendiente': 'bg-gray-100 text-gray-500',
    };
    return statusMap[val] || 'bg-gray-100 text-gray-600';
  };

  return (
    <div className={cn("bg-gray-50 rounded-lg p-2", fullWidth && "md:col-span-2")}>
      <p className="text-[8px] font-bold text-gray-400 uppercase tracking-wider">{label}</p>
      {type === 'status' ? (
        <span className={cn("text-[10px] font-black px-1.5 py-0.5 rounded-full inline-block mt-0.5", getStatusColor(value))}>
          {value}
        </span>
      ) : (
        <p className="text-xs font-medium text-gray-700 mt-0.5 line-clamp-2">{value}</p>
      )}
    </div>
  );
}

function SalaRow({ sala, onVerDetalle }: { sala: SalaAutogobierno; onVerDetalle: (sala: SalaAutogobierno) => void }) {
  const getStatusColor = (estatus: string) => {
    const colors: Record<string, string> = {
      'fortalecimiento': 'bg-amber-100 text-amber-700',
      'consolidada': 'bg-emerald-100 text-emerald-700',
      'en_revision': 'bg-blue-100 text-blue-700',
    };
    return colors[estatus] || 'bg-gray-100 text-gray-600';
  };

  const getStatusText = (estatus: string) => {
    const texts: Record<string, string> = {
      'fortalecimiento': 'Fortalecimiento',
      'consolidada': 'Consolidada',
      'en_revision': 'En Revisión',
    };
    return texts[estatus] || estatus || 'No definido';
  };

  return (
    <tr className="hover:bg-gray-50/50 transition group">
      <td className="p-4">
        <p className="font-bold text-[11px] md:text-xs text-gray-800">{sala.nombre_sala}</p>
      </td>
      <td className="p-4">
        <p className="text-[10px] md:text-xs text-gray-600">{sala.ubicacion || 'No registrada'}</p>
      </td>
      <td className="p-4">
        <span className={cn("text-[8px] md:text-[9px] font-black px-2 py-0.5 rounded-full", getStatusColor(sala.estatus))}>
          {getStatusText(sala.estatus || '')}
        </span>
      </td>
      <td className="p-4">
        <p className="text-[10px] text-gray-500">
          {sala.id_comuna ? `Comuna ${sala.id_comuna}` : '-'}
          {sala.id_sector ? ` / Sector ${sala.id_sector}` : ''}
        </p>
      </td>
      <td className="p-4 text-center">
        <button 
          onClick={() => onVerDetalle(sala)} 
          className="p-1.5 rounded-lg text-[#008f82] hover:bg-teal-50 transition-all"
          title="Ver detalles"
        >
          <Eye size={16} />
        </button>
      </td>
    </tr>
  );
}

function StatCard({ title, value, icon, color }: { title: string; value: number; icon: React.ReactNode; color: string }) {
  return (
    <div className={cn("rounded-xl p-3 border", color, "border-gray-100 shadow-sm")}>
      <div className="flex items-center justify-between">
        <div className="p-1.5 bg-white/50 rounded-lg">{icon}</div>
        <span className="text-xl font-black text-gray-800">{value}</span>
      </div>
      <p className="text-[8px] font-bold text-gray-500 uppercase tracking-wider mt-2">{title}</p>
    </div>
  );
}