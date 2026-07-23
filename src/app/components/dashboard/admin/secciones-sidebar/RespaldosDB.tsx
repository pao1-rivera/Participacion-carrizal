"use client";

import React, { useState, useEffect, useCallback } from 'react';
import { 
    Database, HardDrive, CheckCircle2, Loader2, 
    AlertCircle, Download, Trash2, Clock, 
    FileArchive, RefreshCw, Upload, Shield,
    FileJson
} from 'lucide-react';
import { cn } from '@/app/lib/utils';
import { supabase } from '@/app/lib/supabaseClient';
import { motion, AnimatePresence } from 'framer-motion';

interface Backup {
    id: string;
    nombre: string;
    tamaño: string;
    fecha: string;
    estado: 'success' | 'pending' | 'error';
    ruta_archivo: string;
    metadata?: any;
    usuario_id?: string;
}

interface RespaldosDBProps {
    autoRefresh?: boolean;
    refreshInterval?: number;
    maxBackups?: number;
}

// Tablas a incluir en el respaldo
const TABLAS_RESPALDO = [
    'proyectos',
    'proyectos_comuna',
    'nudos_criticos',
    'nudos_criticos_comuna',
    'asambleas',
    'asambleas_comuna',
    'censo_fichas',
    'censo_familiares',
    'voceros',
    'perfil_usuario',
    'rol_usuario',
    'datos_comuna',
    'datos_consejo_comunal',
    'datos_sala_autogobierno',
    'sectores',
    'ubicacion_comuna',
    'ubicacion_consejo',
    'ubicacion_sala'
];

export const RespaldosDB: React.FC<RespaldosDBProps> = ({ 
    autoRefresh = true,
    refreshInterval = 30000,
    maxBackups = 50
}) => {
    const [backups, setBackups] = useState<Backup[]>([]);
    const [isBackingUp, setIsBackingUp] = useState(false);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [selectedBackup, setSelectedBackup] = useState<Backup | null>(null);
    const [showConfirmModal, setShowConfirmModal] = useState(false);
    const [backupToDelete, setBackupToDelete] = useState<string | null>(null);
    const [downloadProgress, setDownloadProgress] = useState<{ [key: string]: boolean }>({});

    // ========== FUNCIONES DE BD ==========
    
    const fetchBackups = useCallback(async (showLoading = true) => {
        if (showLoading) {
            setLoading(true);
        }
        setError(null);

        try {
            const { data, error: fetchError } = await supabase
                .from('respaldos_db')
                .select('*')
                .order('fecha', { ascending: false })
                .limit(maxBackups);

            if (fetchError) {
                console.error('❌ Error fetching backups:', fetchError);
                throw fetchError;
            }

            const mappedBackups: Backup[] = data?.map((item: any) => ({
                id: item.id,
                nombre: item.nombre,
                tamaño: item.tamaño || '--',
                fecha: item.fecha,
                estado: item.estado || 'success',
                ruta_archivo: item.ruta_archivo,
                metadata: item.metadata,
                usuario_id: item.usuario_id
            })) || [];

            setBackups(mappedBackups);
        } catch (error: any) {
            console.error('❌ Error en fetchBackups:', error);
            setError(error.message || 'Error al cargar los respaldos');
        } finally {
            setLoading(false);
        }
    }, [maxBackups]);

    const createBackup = async () => {
        setIsBackingUp(true);
        setError(null);

        try {
            // 1. Verificar permisos (admin)
            const { data: userData, error: userError } = await supabase
                .from('perfil_usuario')
                .select('id_rol')
                .eq('id_usuario', (await supabase.auth.getUser()).data.user?.id)
                .single();

            if (userError || ![1, 2, 3].includes(userData?.id_rol)) {
                throw new Error('No tiene permisos de administrador para crear respaldos');
            }

            // 2. Obtener datos de todas las tablas
            const backupData: Record<string, any[]> = {};
            let totalRows = 0;

            for (const tabla of TABLAS_RESPALDO) {
                try {
                    const { data, error } = await supabase
                        .from(tabla)
                        .select('*');

                    if (error) {
                        console.warn(`⚠️ Tabla ${tabla} no accesible:`, error);
                        continue;
                    }

                    if (data) {
                        backupData[tabla] = data;
                        totalRows += data.length;
                    }
                } catch (e) {
                    console.warn(`⚠️ Error en tabla ${tabla}:`, e);
                }
            }

            if (totalRows === 0) {
                throw new Error('No se pudo obtener datos de las tablas. Verifique sus permisos.');
            }

            // 3. Preparar archivo JSON
            const backupJson = {
                fecha: new Date().toISOString(),
                total_registros: totalRows,
                tablas: backupData,
                metadata: {
                    version: '1.0',
                    usuario: (await supabase.auth.getUser()).data.user?.email,
                    timestamp: Date.now()
                }
            };

            const jsonString = JSON.stringify(backupJson, null, 2);
            const blob = new Blob([jsonString], { type: 'application/json' });
            const fileName = `respaldo_${new Date().toISOString().replace(/[:.]/g, '-')}.json`;
            const filePath = `backups/${fileName}`;

            // 4. Subir a Storage
            const { error: uploadError } = await supabase.storage
                .from('respaldos')
                .upload(filePath, blob, {
                    cacheControl: '3600',
                    upsert: true,
                    contentType: 'application/json'
                });

            if (uploadError) {
                console.error('❌ Error subiendo archivo:', uploadError);
                throw new Error(`Error al subir el respaldo: ${uploadError.message}`);
            }

            // 5. Obtener URL pública (firmada)
            const { data: signedUrlData, error: signedError } = await supabase.storage
                .from('respaldos')
                .createSignedUrl(filePath, 60 * 60 * 24 * 7); // 7 días

            if (signedError) {
                console.warn('⚠️ No se pudo generar URL firmada:', signedError);
            }

            // 6. Registrar en la tabla respaldos_db
            const { data: insertData, error: insertError } = await supabase
                .from('respaldos_db')
                .insert({
                    nombre: fileName,
                    tamaño: (blob.size / 1024 / 1024).toFixed(2) + ' MB',
                    fecha: new Date().toISOString(),
                    estado: 'success',
                    ruta_archivo: filePath,
                    metadata: {
                        total_tablas: Object.keys(backupData).length,
                        total_registros: totalRows,
                        usuario: (await supabase.auth.getUser()).data.user?.email
                    },
                    usuario_id: (await supabase.auth.getUser()).data.user?.id
                })
                .select()
                .single();

            if (insertError) {
                console.error('❌ Error registrando respaldo:', insertError);
                throw new Error(`Error al registrar el respaldo: ${insertError.message}`);
            }

            // 7. Actualizar lista
            await fetchBackups(false);

            alert(`✅ Respaldo creado exitosamente!\nNombre: ${fileName}\nTamaño: ${(blob.size / 1024 / 1024).toFixed(2)} MB\nTablas: ${Object.keys(backupData).length}\nRegistros: ${totalRows}`);

        } catch (error: any) {
            console.error('❌ Error creando respaldo:', error);
            setError(error.message || 'Error al crear el respaldo');
            alert(`❌ Error al crear respaldo: ${error.message || 'Error desconocido'}`);
        } finally {
            setIsBackingUp(false);
        }
    };

    const deleteBackup = async (id: string) => {
        try {
            // 1. Obtener la ruta del archivo
            const backup = backups.find(b => b.id === id);
            if (!backup) {
                throw new Error('Respaldo no encontrado');
            }

            // 2. Eliminar archivo de Storage
            if (backup.ruta_archivo) {
                const { error: storageError } = await supabase.storage
                    .from('respaldos')
                    .remove([backup.ruta_archivo]);

                if (storageError) {
                    console.warn('⚠️ Error eliminando archivo:', storageError);
                    // Continuamos aunque falle la eliminación del archivo
                }
            }

            // 3. Eliminar registro de la tabla
            const { error: deleteError } = await supabase
                .from('respaldos_db')
                .delete()
                .eq('id', id);

            if (deleteError) {
                throw deleteError;
            }

            // 4. Actualizar lista
            await fetchBackups(false);
            setShowConfirmModal(false);
            setBackupToDelete(null);
            
            alert('✅ Respaldo eliminado exitosamente');
        } catch (error: any) {
            console.error('❌ Error eliminando respaldo:', error);
            alert(`❌ Error al eliminar respaldo: ${error.message || 'Error desconocido'}`);
        }
    };

    const downloadBackup = async (backup: Backup) => {
        if (downloadProgress[backup.id]) return;

        try {
            setDownloadProgress(prev => ({ ...prev, [backup.id]: true }));

            // 1. Generar URL firmada
            const { data, error } = await supabase.storage
                .from('respaldos')
                .createSignedUrl(backup.ruta_archivo, 60 * 5); // 5 minutos

            if (error || !data?.signedUrl) {
                throw new Error('No se pudo generar la URL de descarga');
            }

            // 2. Obtener el contenido del archivo como blob
            const response = await fetch(data.signedUrl);
            if (!response.ok) {
                throw new Error(`Error al obtener el archivo: ${response.statusText}`);
            }
            const blob = await response.blob();

            // 3. Crear enlace de descarga y hacer clic automático
            const link = document.createElement('a');
            link.href = URL.createObjectURL(blob);
            link.download = backup.nombre;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);

            // 4. Liberar memoria del objeto URL
            URL.revokeObjectURL(link.href);

        } catch (error: any) {
            console.error('❌ Error descargando respaldo:', error);
            alert(`❌ Error al descargar: ${error.message || 'Error desconocido'}`);
        } finally {
            setDownloadProgress(prev => ({ ...prev, [backup.id]: false }));
        }
    };

    // ========== UTILIDADES ==========
    
    const getEstadoConfig = (estado: string) => {
        const configs = {
            success: {
                icon: <CheckCircle2 size={14} className="text-emerald-600" />,
                color: 'bg-emerald-50 text-emerald-700 border-emerald-200',
                label: 'Completado'
            },
            pending: {
                icon: <Loader2 size={14} className="animate-spin text-amber-600" />,
                color: 'bg-amber-50 text-amber-700 border-amber-200',
                label: 'En proceso'
            },
            error: {
                icon: <AlertCircle size={14} className="text-rose-600" />,
                color: 'bg-rose-50 text-rose-700 border-rose-200',
                label: 'Error'
            }
        };
        return configs[estado as keyof typeof configs] || configs.success;
    };

    const formatDate = (dateString: string) => {
        const date = new Date(dateString);
        return date.toLocaleString('es-VE', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    // ========== EFECTOS ==========
    
    useEffect(() => {
        fetchBackups();
    }, []);

    useEffect(() => {
        if (!autoRefresh) return;
        
        const interval = setInterval(() => {
            fetchBackups(false);
        }, refreshInterval);

        return () => clearInterval(interval);
    }, [autoRefresh, refreshInterval, fetchBackups]);

    // ========== RENDERIZADO ==========
    
    return (
        <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-300">
            {/* Header */}
            <div className="bg-white p-4 rounded-xl border border-slate-100 shadow-sm">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-indigo-50 rounded-xl">
                            <HardDrive size={20} className="text-indigo-900" />
                        </div>
                        <div>
                            <h1 className="text-base font-black text-slate-950 uppercase italic tracking-tighter leading-none">
                                Respaldos de Base de Datos
                            </h1>
                            <p className="text-[9px] text-slate-400 mt-0.5 font-medium">
                                Gestión de copias de seguridad del sistema
                            </p>
                        </div>
                    </div>
                    
                    <div className="flex items-center gap-2">
                        <button
                            onClick={() => fetchBackups(false)}
                            className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-50 border border-slate-200 text-slate-500 rounded-lg text-[10px] font-black uppercase tracking-wider hover:bg-slate-100 transition-colors"
                        >
                            <RefreshCw size={12} /> Refrescar
                        </button>
                        <button
                            onClick={createBackup}
                            disabled={isBackingUp}
                            className={cn(
                                "flex items-center gap-1.5 px-4 py-1.5 rounded-lg text-white font-black uppercase text-[10px] tracking-wider transition-all active:scale-95",
                                isBackingUp 
                                    ? "bg-slate-400 cursor-not-allowed" 
                                    : "bg-indigo-900 hover:bg-indigo-950 shadow-lg shadow-indigo-900/20"
                            )}
                        >
                            {isBackingUp ? (
                                <>
                                    <Loader2 size={14} className="animate-spin" />
                                    Generando...
                                </>
                            ) : (
                                <>
                                    <Upload size={14} />
                                    Nuevo Respaldo
                                </>
                            )}
                        </button>
                    </div>
                </div>
            </div>

            {/* Error */}
            {error && (
                <div className="bg-rose-50 border border-rose-200 rounded-xl p-4 text-rose-700">
                    <div className="flex items-center gap-2">
                        <AlertCircle size={16} />
                        <p className="text-xs font-bold">{error}</p>
                    </div>
                </div>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                {/* Panel de control */}
                <div className="bg-white p-6 rounded-xl border border-slate-100 shadow-sm flex flex-col justify-between lg:col-span-1">
                    <div>
                        <div className="flex items-center gap-2 pb-4 border-b border-slate-50">
                            <Shield size={16} className="text-brand-primary" />
                            <h3 className="text-xs font-black text-slate-900 uppercase tracking-widest">
                                Información
                            </h3>
                        </div>
                        
                        <div className="mt-4 space-y-3 text-[10px]">
                            <div className="flex justify-between">
                                <span className="text-slate-500 font-medium">Último respaldo:</span>
                                <span className="font-bold text-slate-700">
                                    {backups.length > 0 && backups[0].estado === 'success' 
                                        ? formatDate(backups[0].fecha)
                                        : 'No disponible'}
                                </span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-slate-500 font-medium">Total respaldos:</span>
                                <span className="font-bold text-slate-700">{backups.length}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-slate-500 font-medium">Éxitosos:</span>
                                <span className="font-bold text-emerald-600">
                                    {backups.filter(b => b.estado === 'success').length}
                                </span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-slate-500 font-medium">Tamaño total:</span>
                                <span className="font-bold text-slate-700">
                                    {backups.reduce((acc, b) => {
                                        const size = parseFloat(b.tamaño);
                                        return isNaN(size) ? acc : acc + size;
                                    }, 0).toFixed(2)} MB
                                </span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-slate-500 font-medium">Tablas incluidas:</span>
                                <span className="font-bold text-slate-700">{TABLAS_RESPALDO.length}</span>
                            </div>
                        </div>
                    </div>

                    <div className="mt-4 p-3 bg-slate-50 rounded-xl border border-slate-100">
                        <p className="text-[8px] text-slate-400 font-bold uppercase tracking-wider leading-relaxed">
                            ⚡ Los respaldos se generan en formato JSON y se almacenan en la nube.
                            Puede descargarlos en cualquier momento.
                        </p>
                    </div>
                </div>

                {/* Lista de respaldos */}
                <div className="bg-white p-6 rounded-xl border border-slate-100 shadow-sm lg:col-span-2">
                    <div className="flex items-center justify-between pb-4 border-b border-slate-50">
                        <h3 className="text-xs font-black text-slate-900 uppercase tracking-widest flex items-center gap-2">
                            <FileArchive size={14} className="text-slate-500" />
                            Historial de Respaldos
                        </h3>
                        <span className="text-[9px] text-slate-400 font-bold uppercase">
                            {backups.length} {backups.length === 1 ? 'respaldo' : 'respaldos'}
                        </span>
                    </div>

                    {loading ? (
                        <div className="py-8 text-center">
                            <div className="inline-block h-6 w-6 animate-spin rounded-full border-2 border-brand-primary border-t-transparent" />
                            <p className="text-[10px] text-slate-400 mt-2">Cargando respaldos...</p>
                        </div>
                    ) : backups.length === 0 ? (
                        <div className="py-12 text-center text-slate-400">
                            <Database size={32} className="mx-auto mb-3 opacity-30" />
                            <p className="text-sm font-medium">No hay respaldos disponibles</p>
                            <p className="text-[10px] mt-1">Cree su primer respaldo usando el botón</p>
                        </div>
                    ) : (
                        <div className="mt-4 space-y-3 max-h-[500px] overflow-y-auto custom-scrollbar pr-1">
                            {backups.map((backup) => {
                                const estadoConfig = getEstadoConfig(backup.estado);
                                const isDownloading = downloadProgress[backup.id];
                                return (
                                    <motion.div
                                        key={backup.id}
                                        initial={{ opacity: 0, y: 10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        className={cn(
                                            "p-4 rounded-xl border transition-all hover:shadow-md",
                                            backup.estado === 'success' 
                                                ? "border-slate-100 bg-slate-50/30" 
                                                : backup.estado === 'pending'
                                                ? "border-amber-100 bg-amber-50/30"
                                                : "border-rose-100 bg-rose-50/30"
                                        )}
                                    >
                                        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
                                            <div className="flex items-center gap-3">
                                                <div className={cn(
                                                    "p-2 rounded-xl border",
                                                    backup.estado === 'success' 
                                                        ? "bg-white border-slate-200" 
                                                        : backup.estado === 'pending'
                                                        ? "bg-amber-50 border-amber-200"
                                                        : "bg-rose-50 border-rose-200"
                                                )}>
                                                    <FileJson size={14} className="text-slate-500" />
                                                </div>
                                                <div>
                                                    <p className="text-xs font-black text-slate-800 font-mono truncate max-w-[200px]">
                                                        {backup.nombre}
                                                    </p>
                                                    <div className="flex items-center gap-3 mt-1">
                                                        <span className="text-[10px] text-slate-400 font-medium flex items-center gap-1">
                                                            <Clock size={10} />
                                                            {formatDate(backup.fecha)}
                                                        </span>
                                                        {backup.tamaño && backup.tamaño !== '--' && (
                                                            <span className="text-[10px] text-slate-400 font-medium">
                                                                • {backup.tamaño}
                                                            </span>
                                                        )}
                                                        {backup.metadata?.total_registros && (
                                                            <span className="text-[10px] text-slate-400 font-medium">
                                                                • {backup.metadata.total_registros} registros
                                                            </span>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                            
                                            <div className="flex items-center gap-2">
                                                <span className={cn(
                                                    "inline-flex items-center gap-1.5 text-[8px] font-black uppercase tracking-wider px-2.5 py-1 rounded-full border",
                                                    estadoConfig.color
                                                )}>
                                                    {estadoConfig.icon}
                                                    {estadoConfig.label}
                                                </span>
                                                
                                                {backup.estado === 'success' && (
                                                    <button
                                                        onClick={() => downloadBackup(backup)}
                                                        disabled={isDownloading}
                                                        className={cn(
                                                            "p-1.5 rounded-lg border transition-colors",
                                                            isDownloading 
                                                                ? "bg-slate-100 text-slate-400 cursor-not-allowed" 
                                                                : "bg-indigo-50 text-indigo-600 border-indigo-100 hover:bg-indigo-100"
                                                        )}
                                                        title="Descargar respaldo"
                                                    >
                                                        {isDownloading ? (
                                                            <Loader2 size={14} className="animate-spin" />
                                                        ) : (
                                                            <Download size={14} />
                                                        )}
                                                    </button>
                                                )}
                                                
                                                <button
                                                    onClick={() => {
                                                        setBackupToDelete(backup.id);
                                                        setShowConfirmModal(true);
                                                    }}
                                                    className="p-1.5 rounded-lg bg-rose-50 text-rose-600 border border-rose-100 hover:bg-rose-100 transition-colors"
                                                    title="Eliminar respaldo"
                                                >
                                                    <Trash2 size={14} />
                                                </button>
                                            </div>
                                        </div>
                                        
                                        {backup.metadata && backup.metadata.total_tablas && (
                                            <div className="mt-3 pt-3 border-t border-slate-100">
                                                <p className="text-[8px] text-slate-400 font-bold uppercase tracking-wider">
                                                    Tablas incluidas: {backup.metadata.total_tablas} · 
                                                    Registros: {backup.metadata.total_registros}
                                                </p>
                                            </div>
                                        )}
                                    </motion.div>
                                );
                            })}
                        </div>
                    )}
                </div>
            </div>

            {/* Modal de confirmación para eliminar */}
            <AnimatePresence>
                {showConfirmModal && (
                    <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-[60] flex items-center justify-center p-4">
                        <motion.div 
                            initial={{ scale: 0.9, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.9, opacity: 0 }}
                            className="bg-white rounded-xl w-full max-w-sm shadow-2xl overflow-hidden border border-slate-100"
                        >
                            <div className="bg-rose-50 px-5 py-3 border-b border-rose-100">
                                <h3 className="font-black text-xs text-rose-700 uppercase tracking-wider flex items-center gap-2">
                                    <AlertCircle size={14} />
                                    Confirmar Eliminación
                                </h3>
                            </div>
                            
                            <div className="p-5">
                                <p className="text-xs text-slate-600 font-medium text-center mb-4">
                                    ¿Está seguro de eliminar este respaldo? Esta acción no se puede deshacer.
                                </p>
                                
                                <div className="flex items-center justify-end gap-2">
                                    <button 
                                        type="button"
                                        onClick={() => {
                                            setShowConfirmModal(false);
                                            setBackupToDelete(null);
                                        }}
                                        className="px-4 py-1.5 border rounded-lg text-[9px] font-black uppercase tracking-wider text-slate-500 hover:bg-slate-50 transition-colors"
                                    >
                                        Cancelar
                                    </button>
                                    <button 
                                        type="button"
                                        onClick={() => {
                                            if (backupToDelete) {
                                                deleteBackup(backupToDelete);
                                            }
                                        }}
                                        className="px-5 py-1.5 rounded-lg bg-rose-600 text-white text-[9px] font-black uppercase tracking-wider hover:bg-rose-700 transition-colors"
                                    >
                                        Eliminar
                                    </button>
                                </div>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            {/* Información adicional */}
            <div className="bg-white p-4 rounded-xl border border-slate-100 shadow-sm">
                <div className="flex flex-wrap items-center gap-6 text-[9px] text-slate-400">
                    <div className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full bg-emerald-500" />
                        <span>Completado</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
                        <span>En proceso</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full bg-rose-500" />
                        <span>Error</span>
                    </div>
                    <span className="text-slate-300">|</span>
                    <span>Los respaldos se almacenan por 30 días</span>
                    <span className="text-slate-300">|</span>
                    <span>Formato: JSON comprimido</span>
                    <span className="text-slate-300">|</span>
                    <span>{TABLAS_RESPALDO.length} tablas incluidas</span>
                </div>
            </div>
        </div>
    );
};

export default RespaldosDB;