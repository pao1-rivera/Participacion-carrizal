import { supabase } from './supabaseClient';

export interface AdminMetrics {
  totalUsers: number;
  activeUsers: number;
  pendingUsers: number;
  alertsCount: number;
  storageUsed: number;
  storageLimit: number;
  databaseSize: number;
  totalRows: number;
}

export async function fetchAdminMetrics(): Promise<AdminMetrics> {
  // 1. Total de usuarios
  const { count: totalUsers, error: err1 } = await supabase
    .from('perfil_usuario')
    .select('*', { count: 'exact', head: true });
  if (err1) {
    console.error('Error contando usuarios:', err1);
    throw err1;
  }

  // 2. Usuarios activos
  const { count: activeUsers, error: err2 } = await supabase
    .from('perfil_usuario')
    .select('*', { count: 'exact', head: true })
    .eq('activo', true);
  if (err2) {
    console.error('Error contando activos:', err2);
    throw err2;
  }

  // 3. Almacenamiento usado
  let storageUsed = 0;
  try {
    const { data: buckets, error: errBuckets } = await supabase.storage.listBuckets();
    if (errBuckets) throw errBuckets;
    if (buckets && buckets.length > 0) {
      for (const bucket of buckets) {
        const { data: objects, error: errObj } = await supabase.storage
          .from(bucket.name)
          .list('', { limit: 10000 });
        if (errObj) continue;
        if (objects) {
          objects.forEach((obj: any) => {
            storageUsed += obj.metadata?.size || 0;
          });
        }
      }
    }
  } catch (e) {
    console.warn('Error al obtener almacenamiento:', e);
  }

  // 4. Tamaño de la base de datos
  let databaseSize = 0;
  try {
    const { data, error } = await supabase.rpc('get_database_size');
    if (error) {
      console.error('Error en RPC get_database_size:', error);
    } else if (data) {
      databaseSize = data;
    }
  } catch (e) {
    console.warn('Error al obtener tamaño de BD:', e);
  }

  // 5. Total de filas en tablas principales (con logs)
  let totalRows = 0;
  const tables = [
    'proyectos',
    'proyectos_comuna',
    'nudos_criticos',
    'nudos_criticos_comuna',
    'asambleas',
    'asambleas_comuna',
    'censo_fichas',
    'voceros'
  ];

  for (const table of tables) {
    try {
      const { count, error } = await supabase
        .from(table)
        .select('*', { count: 'exact', head: true });
      if (error) {
        console.error(`Error contando ${table}:`, error);
        continue; // no sumamos, pero seguimos con la siguiente tabla
      }
      console.log(`📊 ${table}: ${count} filas`);
      totalRows += count || 0;
    } catch (err) {
      console.warn(`Excepción al contar ${table}:`, err);
    }
  }

  console.log(`📊 Total de filas (suma): ${totalRows}`);

  const storageLimit = 10 * 1024 * 1024 * 1024; // 10 GB

  return {
    totalUsers: totalUsers || 0,
    activeUsers: activeUsers || 0,
    pendingUsers: 0,
    alertsCount: 0,
    storageUsed,
    storageLimit,
    databaseSize,
    totalRows,
  };
}