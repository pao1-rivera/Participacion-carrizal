// components/dashboard/admin/LogsAuditoria.tsx
"use client";

import React, { useState, useCallback } from 'react';
import {
    Terminal, RefreshCw, Filter, Search, Download,
    Clock, User, Activity, AlertCircle, XCircle,
    ChevronLeft, ChevronRight, Calendar, Loader2
} from 'lucide-react';
import { cn } from '@/app/lib/utils';
import { supabase } from '@/app/lib/supabaseClient';
import { motion, AnimatePresence } from 'framer-motion';

interface AuditLog {
    id: string;
    usuario_id: string;
    usuario_email: string;
    usuario_nombre: string;
    accion: string;
    descripcion: string;
    target_id: string;
    target_tipo: string;
    nivel: 'info' | 'warning' | 'critical';
    created_at: string;
    ip_address?: string;
    user_agent?: string;
}

interface LogsAuditoriaProps {
    autoRefresh?: boolean;
    refreshInterval?: number;
    maxLogs?: number;
}

// Nombre de la tabla de logs (ajústalo si usas otro nombre)
const LOGS_TABLE = 'logs_auditoria';

export const LogsAuditoria: React.FC<LogsAuditoriaProps> = ({
    autoRefresh = false,
    refreshInterval = 30000,
    maxLogs = 100
}) => {
    const [logs, setLogs] = useState<AuditLog[]>([]);
    const [filteredLogs, setFilteredLogs] = useState<AuditLog[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [levelFilter, setLevelFilter] = useState('all');
    const [actionFilter, setActionFilter] = useState('all');
    const [currentPage, setCurrentPage] = useState(1);
    const [totalLogs, setTotalLogs] = useState(0);
    const [isRefreshing, setIsRefreshing] = useState(false);
    const [showFilters, setShowFilters] = useState(true);

    // Filtros de fecha
    const [fechaInicio, setFechaInicio] = useState('');
    const [fechaFin, setFechaFin] = useState('');
    const [hasSearched, setHasSearched] = useState(false);

    const itemsPerPage = 20;
    const availableActions = ['CREATE', 'UPDATE', 'DELETE', 'LOGIN', 'LOGOUT', 'TOGGLE_STATUS', 'EXPORT', 'IMPORT'];

    // ========== CONSULTAR LOGS ==========

    const fetchLogs = useCallback(async (showLoading = true) => {
        if (!fechaInicio && !fechaFin) {
            setLogs([]);
            setFilteredLogs([]);
            setTotalLogs(0);
            setHasSearched(false);
            setLoading(false);
            return;
        }

        if (showLoading) {
            setLoading(true);
        } else {
            setIsRefreshing(true);
        }
        setError(null);

        try {
            let query = supabase
                .from(LOGS_TABLE)
                .select('*', { count: 'exact' });

            if (fechaInicio) query = query.gte('created_at', fechaInicio);
            if (fechaFin) query = query.lte('created_at', fechaFin);

            const { count, error: countError } = await query;
            if (countError) throw countError;
            setTotalLogs(count || 0);

            let dataQuery = supabase
                .from(LOGS_TABLE)
                .select('*')
                .order('created_at', { ascending: false })
                .range(0, maxLogs - 1);

            if (fechaInicio) dataQuery = dataQuery.gte('created_at', fechaInicio);
            if (fechaFin) dataQuery = dataQuery.lte('created_at', fechaFin);

            const { data, error: fetchError } = await dataQuery;
            if (fetchError) throw fetchError;

            // Mapear datos (si no hay registros, será un array vacío)
            const mappedLogs: AuditLog[] = (data || []).map((item: any) => ({
                id: item.id,
                usuario_id: item.id_usuario,
                usuario_email: 'Sistema',
                usuario_nombre: 'Sistema',
                accion: item.accion || 'DESCONOCIDO',
                descripcion: generarDescripcion(
                    item.accion,
                    item.tabla_afectada,
                    item.datos_anteriores,
                    item.datos_nuevos
                ),
                target_id: item.registro_id || '',
                target_tipo: item.tabla_afectada || '',
                nivel: item.nivel || 'info',
                created_at: item.created_at,
                ip_address: item.ip_address,
                user_agent: item.user_agent
            }));

            setLogs(mappedLogs);
            applyFilters(mappedLogs, searchTerm, levelFilter, actionFilter);
            setHasSearched(true);
        } catch (error: any) {
            console.error('❌ Error en fetchLogs:', error);
            if (error.message?.includes('relation') || error.code === '42P01') {
                setError('La tabla de logs aún no existe. Ejecuta el script de creación en Supabase.');
            } else {
                setError(error.message || 'Error al cargar los logs');
            }
            setHasSearched(true);
        } finally {
            setLoading(false);
            setIsRefreshing(false);
        }
    }, [fechaInicio, fechaFin, maxLogs]);

    // ========== GENERAR DESCRIPCIÓN LEGIBLE ==========
    // IMPORTANTE: los nombres de los parámetros no deben ser "new" (palabra reservada)
    const generarDescripcion = (
        accion: string,
        tabla: string,
        datosAnteriores: any,
        datosNuevos: any
    ): string => {
        const tablaLegible = (tabla || 'desconocida').replace(/_/g, ' ').toUpperCase();
        let desc = '';
        switch (accion) {
            case 'INSERT':
                desc = `Nuevo registro en ${tablaLegible}`;
                if (datosNuevos?.nombre) desc += `: ${datosNuevos.nombre}`;
                break;
            case 'UPDATE':
                desc = `Actualización en ${tablaLegible}`;
                if (datosNuevos?.nombre) desc += `: ${datosNuevos.nombre}`;
                break;
            case 'DELETE':
                desc = `Eliminación en ${tablaLegible}`;
                if (datosAnteriores?.nombre) desc += `: ${datosAnteriores.nombre}`;
                break;
            default:
                desc = `${accion || 'OPERACIÓN'} en ${tablaLegible}`;
        }
        return desc;
    };

    // ========== FILTRADO ==========

    const applyFilters = (logsData: AuditLog[], search: string, level: string, action: string) => {
        let filtered = logsData;
        if (search.trim()) {
            const term = search.toLowerCase();
            filtered = filtered.filter(log =>
                log.usuario_nombre.toLowerCase().includes(term) ||
                log.usuario_email.toLowerCase().includes(term) ||
                log.accion.toLowerCase().includes(term) ||
                log.descripcion.toLowerCase().includes(term)
            );
        }
        if (level !== 'all') {
            filtered = filtered.filter(log => log.nivel === level);
        }
        if (action !== 'all') {
            filtered = filtered.filter(log => log.accion === action);
        }
        setFilteredLogs(filtered);
        setCurrentPage(1);
    };

    // ========== HANDLERS ==========

    const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = e.target.value;
        setSearchTerm(value);
        applyFilters(logs, value, levelFilter, actionFilter);
    };

    const handleLevelFilter = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const value = e.target.value;
        setLevelFilter(value);
        applyFilters(logs, searchTerm, value, actionFilter);
    };

    const handleActionFilter = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const value = e.target.value;
        setActionFilter(value);
        applyFilters(logs, searchTerm, levelFilter, value);
    };

    const handleBuscar = () => {
        if (!fechaInicio && !fechaFin) {
            alert('Selecciona al menos una fecha (desde o hasta)');
            return;
        }
        fetchLogs(true);
    };

    const handleLimpiar = () => {
        setFechaInicio('');
        setFechaFin('');
        setLogs([]);
        setFilteredLogs([]);
        setTotalLogs(0);
        setHasSearched(false);
        setError(null);
    };

    // ========== EXPORTAR ==========

    const exportLogs = () => {
        const dataToExport = filteredLogs.length > 0 ? filteredLogs : logs;
        if (dataToExport.length === 0) {
            alert('No hay logs para exportar');
            return;
        }
        try {
            const headers = ['Fecha', 'Usuario', 'Acción', 'Descripción', 'Nivel', 'Target'];
            const rows = dataToExport.map(log => [
                new Date(log.created_at).toLocaleString(),
                log.usuario_nombre || log.usuario_email,
                log.accion,
                log.descripcion,
                log.nivel,
                log.target_tipo || '-'
            ]);
            const csvContent = [headers.join(','), ...rows.map(row => row.join(','))].join('\n');
            const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
            const link = document.createElement('a');
            link.href = URL.createObjectURL(blob);
            link.download = `logs_auditoria_${new Date().toISOString().split('T')[0]}.csv`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            URL.revokeObjectURL(link.href);
        } catch (error) {
            console.error('Error exportando logs:', error);
            alert('Error al exportar los logs');
        }
    };

    // ========== PAGINACIÓN ==========

    const totalPages = Math.ceil(filteredLogs.length / itemsPerPage);
    const startIndex = (currentPage - 1) * itemsPerPage;
    const paginatedLogs = filteredLogs.slice(startIndex, startIndex + itemsPerPage);

    const goToPage = (page: number) => {
        if (page >= 1 && page <= totalPages) setCurrentPage(page);
    };

    // ========== UTILIDADES VISUALES ==========

    const getLevelColor = (level: string) => {
        const colors = {
            info: 'bg-blue-50 text-blue-700 border-blue-200',
            warning: 'bg-amber-50 text-amber-700 border-amber-200',
            critical: 'bg-rose-50 text-rose-700 border-rose-200 animate-pulse'
        };
        return colors[level as keyof typeof colors] || colors.info;
    };

    const getLevelIcon = (level: string) => {
        const icons = {
            info: <Activity size={14} className="text-blue-500" />,
            warning: <AlertCircle size={14} className="text-amber-500" />,
            critical: <XCircle size={14} className="text-rose-500" />
        };
        return icons[level as keyof typeof icons] || icons.info;
    };

    const getActionColor = (action: string) => {
        const colors: Record<string, string> = {
            'CREATE': 'bg-emerald-100 text-emerald-700',
            'UPDATE': 'bg-blue-100 text-blue-700',
            'DELETE': 'bg-rose-100 text-rose-700',
            'LOGIN': 'bg-cyan-100 text-cyan-700',
            'LOGOUT': 'bg-slate-100 text-slate-700',
            'TOGGLE_STATUS': 'bg-amber-100 text-amber-700',
            'EXPORT': 'bg-indigo-100 text-indigo-700',
            'IMPORT': 'bg-purple-100 text-purple-700'
        };
        return colors[action] || 'bg-slate-100 text-slate-700';
    };

    const formatTimestamp = (timestamp: string) => {
        const date = new Date(timestamp);
        return date.toLocaleString('es-VE', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit'
        });
    };

    // ========== RENDERIZADO ==========

    return (
        <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-300">
            {/* HEADER */}
            <div className="bg-white p-4 rounded-xl border border-slate-100 shadow-sm">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-indigo-50 rounded-xl">
                            <Terminal size={20} className="text-indigo-900" />
                        </div>
                        <div>
                            <h1 className="text-base font-black text-slate-950 uppercase italic tracking-tighter leading-none">
                                Bitácora de Auditoría
                            </h1>
                            <p className="text-[9px] text-slate-400 mt-0.5 font-medium">
                                Registro completo de operaciones del sistema
                            </p>
                        </div>
                    </div>

                    <div className="flex items-center gap-2">
                        <button
                            onClick={() => setShowFilters(!showFilters)}
                            className={cn(
                                "flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-wider transition-colors",
                                showFilters ? "bg-indigo-100 text-indigo-900" : "bg-slate-50 text-slate-500 border border-slate-200 hover:bg-slate-100"
                            )}
                        >
                            <Filter size={12} /> Filtros
                        </button>
                        <button
                            onClick={exportLogs}
                            disabled={filteredLogs.length === 0 && logs.length === 0}
                            className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-lg text-[10px] font-black uppercase tracking-wider hover:bg-emerald-100 transition-colors disabled:opacity-50"
                        >
                            <Download size={12} /> Exportar
                        </button>
                        <button
                            onClick={handleLimpiar}
                            className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-50 border border-slate-200 text-slate-500 rounded-lg text-[10px] font-black uppercase tracking-wider hover:bg-slate-100 transition-colors"
                        >
                            <RefreshCw size={12} /> Limpiar
                        </button>
                    </div>
                </div>

                {/* FILTROS */}
                <AnimatePresence>
                    {showFilters && (
                        <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: 'auto', opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            className="mt-4 pt-4 border-t border-slate-100 overflow-hidden"
                        >
                            <div className="flex flex-wrap items-center gap-3">
                                <div className="flex items-center gap-2">
                                    <div className="relative">
                                        <Calendar size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
                                        <input
                                            type="date"
                                            value={fechaInicio}
                                            onChange={(e) => setFechaInicio(e.target.value)}
                                            className="w-40 bg-slate-50 border border-slate-100 rounded-lg py-1.5 pl-8 pr-3 text-[11px] font-medium text-slate-700 outline-none focus:ring-1 focus:ring-brand-primary/20"
                                            placeholder="Desde"
                                        />
                                    </div>
                                    <span className="text-slate-400">—</span>
                                    <div className="relative">
                                        <Calendar size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
                                        <input
                                            type="date"
                                            value={fechaFin}
                                            onChange={(e) => setFechaFin(e.target.value)}
                                            className="w-40 bg-slate-50 border border-slate-100 rounded-lg py-1.5 pl-8 pr-3 text-[11px] font-medium text-slate-700 outline-none focus:ring-1 focus:ring-brand-primary/20"
                                            placeholder="Hasta"
                                        />
                                    </div>
                                </div>

                                <button
                                    onClick={handleBuscar}
                                    disabled={loading}
                                    className="flex items-center gap-1.5 px-4 py-1.5 bg-brand-primary text-white rounded-lg text-[10px] font-black uppercase tracking-wider hover:bg-indigo-950 transition-colors disabled:opacity-50"
                                >
                                    {loading ? <Loader2 size={14} className="animate-spin" /> : <Search size={14} />}
                                    Buscar
                                </button>

                                <div className="flex items-center gap-2 ml-auto">
                                    <select
                                        value={levelFilter}
                                        onChange={handleLevelFilter}
                                        className="bg-slate-50 border border-slate-200 rounded-lg px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider text-slate-600 outline-none"
                                    >
                                        <option value="all">Todos los niveles</option>
                                        <option value="info">Info</option>
                                        <option value="warning">Warning</option>
                                        <option value="critical">Critical</option>
                                    </select>

                                    <select
                                        value={actionFilter}
                                        onChange={handleActionFilter}
                                        className="bg-slate-50 border border-slate-200 rounded-lg px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider text-slate-600 outline-none"
                                    >
                                        <option value="all">Todas las acciones</option>
                                        {availableActions.map(action => (
                                            <option key={action} value={action}>{action}</option>
                                        ))}
                                    </select>
                                </div>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>

            {/* RESUMEN (solo si hay búsqueda y datos) */}
            {hasSearched && logs.length > 0 && (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    <div className="bg-white p-3 rounded-xl border border-slate-100 shadow-sm">
                        <p className="text-[8px] font-black text-slate-400 uppercase tracking-wider">Total</p>
                        <p className="text-xl font-black text-slate-900">{totalLogs}</p>
                    </div>
                    <div className="bg-white p-3 rounded-xl border border-slate-100 shadow-sm">
                        <p className="text-[8px] font-black text-slate-400 uppercase tracking-wider">Info</p>
                        <p className="text-xl font-black text-blue-600">
                            {logs.filter(l => l.nivel === 'info').length}
                        </p>
                    </div>
                    <div className="bg-white p-3 rounded-xl border border-slate-100 shadow-sm">
                        <p className="text-[8px] font-black text-slate-400 uppercase tracking-wider">Advertencias</p>
                        <p className="text-xl font-black text-amber-600">
                            {logs.filter(l => l.nivel === 'warning').length}
                        </p>
                    </div>
                    <div className="bg-white p-3 rounded-xl border border-slate-100 shadow-sm">
                        <p className="text-[8px] font-black text-slate-400 uppercase tracking-wider">Críticos</p>
                        <p className="text-xl font-black text-rose-600">
                            {logs.filter(l => l.nivel === 'critical').length}
                        </p>
                    </div>
                </div>
            )}

            {/* MENSAJE INICIAL */}
            {!hasSearched && !loading && (
                <div className="bg-white rounded-xl border border-slate-100 shadow-sm p-12 text-center">
                    <Terminal size={48} className="mx-auto mb-4 text-slate-300" />
                    <h3 className="text-base font-black text-slate-700 uppercase tracking-tighter">
                        Selecciona un rango de fechas
                    </h3>
                    <p className="text-sm text-slate-400 max-w-md mx-auto mt-2">
                        Usa los filtros de fecha para cargar los logs de auditoría y evitar sobrecargar la vista.
                    </p>
                </div>
            )}

            {/* TABLA DE LOGS */}
            {hasSearched && (
                <div className="bg-white rounded-xl border border-slate-100 shadow-sm overflow-hidden">
                    {loading ? (
                        <div className="p-8 text-center">
                            <div className="inline-block h-8 w-8 animate-spin rounded-full border-2 border-brand-primary border-t-transparent" />
                            <p className="text-xs text-slate-400 mt-2 font-medium">Cargando logs...</p>
                        </div>
                    ) : error ? (
                        <div className="p-8 text-center text-rose-500">
                            <AlertCircle size={24} className="mx-auto mb-2" />
                            <p className="text-sm font-bold">{error}</p>
                            <button
                                onClick={handleBuscar}
                                className="mt-2 text-xs font-bold text-brand-primary hover:underline"
                            >
                                Intentar de nuevo
                            </button>
                        </div>
                    ) : paginatedLogs.length === 0 ? (
                        <div className="p-8 text-center text-slate-400">
                            <Terminal size={24} className="mx-auto mb-2 opacity-30" />
                            <p className="text-sm font-medium">No hay logs en el rango seleccionado</p>
                            <p className="text-xs mt-1">Intenta con otras fechas o verifica que la tabla de auditoría tenga registros.</p>
                        </div>
                    ) : (
                        <>
                            <div className="overflow-x-auto">
                                <table className="w-full text-left border-collapse text-xs">
                                    <thead className="bg-slate-50 border-b border-slate-100">
                                        <tr>
                                            <th className="p-2.5 text-[8px] font-black text-slate-400 uppercase tracking-wider">Fecha/Hora</th>
                                            <th className="p-2.5 text-[8px] font-black text-slate-400 uppercase tracking-wider">Usuario</th>
                                            <th className="p-2.5 text-[8px] font-black text-slate-400 uppercase tracking-wider">Acción</th>
                                            <th className="p-2.5 text-[8px] font-black text-slate-400 uppercase tracking-wider">Descripción</th>
                                            <th className="p-2.5 text-[8px] font-black text-slate-400 uppercase tracking-wider">Nivel</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-50">
                                        {paginatedLogs.map((log) => (
                                            <tr key={log.id} className="hover:bg-slate-50/50 transition-colors">
                                                <td className="p-2.5">
                                                    <div className="flex items-center gap-1.5">
                                                        <Clock size={12} className="text-slate-400" />
                                                        <span className="text-[10px] font-mono font-bold text-slate-600">
                                                            {formatTimestamp(log.created_at)}
                                                        </span>
                                                    </div>
                                                </td>
                                                <td className="p-2.5">
                                                    <div className="flex items-center gap-2">
                                                        <div className="w-6 h-6 rounded-lg bg-slate-100 flex items-center justify-center">
                                                            <User size={12} className="text-slate-500" />
                                                        </div>
                                                        <div>
                                                            <p className="text-[10px] font-bold text-slate-800 leading-none">
                                                                {log.usuario_nombre || 'Sistema'}
                                                            </p>
                                                            <p className="text-[8px] text-slate-400 truncate max-w-[120px]">
                                                                {log.usuario_email}
                                                            </p>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="p-2.5">
                                                    <span className={cn(
                                                        "text-[8px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full",
                                                        getActionColor(log.accion)
                                                    )}>
                                                        {log.accion}
                                                    </span>
                                                </td>
                                                <td className="p-2.5">
                                                    <p className="text-[10px] text-slate-600 font-medium max-w-[200px] truncate">
                                                        {log.descripcion}
                                                    </p>
                                                    {log.target_tipo && (
                                                        <span className="text-[8px] text-slate-400 bg-slate-50 px-1.5 py-0.5 rounded">
                                                            {log.target_tipo}
                                                        </span>
                                                    )}
                                                </td>
                                                <td className="p-2.5">
                                                    <span className={cn(
                                                        "inline-flex items-center gap-1 text-[8px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full border",
                                                        getLevelColor(log.nivel)
                                                    )}>
                                                        {getLevelIcon(log.nivel)}
                                                        {log.nivel}
                                                    </span>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>

                            {/* Paginación */}
                            {filteredLogs.length > itemsPerPage && (
                                <div className="flex items-center justify-between px-3 py-2 border-t border-slate-100">
                                    <p className="text-[9px] text-slate-400 font-medium">
                                        {filteredLogs.length} registros · Pág. {currentPage} de {totalPages}
                                    </p>
                                    <div className="flex items-center gap-1">
                                        <button
                                            onClick={() => goToPage(currentPage - 1)}
                                            disabled={currentPage === 1}
                                            className={cn(
                                                "p-1.5 rounded-lg border border-slate-200 transition-colors",
                                                currentPage === 1 ? "opacity-40 cursor-not-allowed" : "hover:bg-slate-50"
                                            )}
                                        >
                                            <ChevronLeft size={14} className="text-slate-500" />
                                        </button>

                                        {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                                            let pageNum;
                                            if (totalPages <= 5) {
                                                pageNum = i + 1;
                                            } else if (currentPage <= 3) {
                                                pageNum = i + 1;
                                            } else if (currentPage >= totalPages - 2) {
                                                pageNum = totalPages - 4 + i;
                                            } else {
                                                pageNum = currentPage - 2 + i;
                                            }
                                            return (
                                                <button
                                                    key={pageNum}
                                                    onClick={() => goToPage(pageNum)}
                                                    className={cn(
                                                        "w-7 h-7 rounded-lg text-[10px] font-bold transition-colors",
                                                        currentPage === pageNum
                                                            ? "bg-brand-primary text-white"
                                                            : "text-slate-500 hover:bg-slate-100"
                                                    )}
                                                >
                                                    {pageNum}
                                                </button>
                                            );
                                        })}

                                        <button
                                            onClick={() => goToPage(currentPage + 1)}
                                            disabled={currentPage === totalPages}
                                            className={cn(
                                                "p-1.5 rounded-lg border border-slate-200 transition-colors",
                                                currentPage === totalPages ? "opacity-40 cursor-not-allowed" : "hover:bg-slate-50"
                                            )}
                                        >
                                            <ChevronRight size={14} className="text-slate-500" />
                                        </button>
                                    </div>
                                </div>
                            )}
                        </>
                    )}
                </div>
            )}
        </div>
    );
};

export default LogsAuditoria;