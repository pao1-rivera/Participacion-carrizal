"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const supabase_js_1 = require("@supabase/supabase-js");
// Configuración (usa variables de entorno o reemplaza directamente)
const supabaseUrl = 'https://dqpuwdgfunwzrejkjmhi.supabase.co';
const supabaseServiceKey = 'sb_secret_CVrRbAphoX7sDcE9y87KBw_VVxTO7H0';
const supabase = (0, supabase_js_1.createClient)(supabaseUrl, supabaseServiceKey);
const BUCKET_DESTINO = 'documentos_comuna';
const BUCKETS_ORIGEN = ['asambleas_docs', 'asamblea_comuna'];
async function migrarAsambleasComuna() {
    // Obtener asambleas con URLs públicas
    const { data: asambleas, error } = await supabase
        .from('asambleas_comuna')
        .select('id_asamblea, id_comuna, foto_url, acta_url')
        .or('foto_url.ilike.%https://%, acta_url.ilike.%https://%');
    if (error) {
        console.error('Error obteniendo asambleas:', error);
        return;
    }
    for (const asamblea of asambleas) {
        const { id_asamblea, id_comuna, foto_url, acta_url } = asamblea;
        console.log(`Procesando asamblea ${id_asamblea} (comuna ${id_comuna})...`);
        let nuevaFotoRuta = null;
        if (foto_url && foto_url.startsWith('http')) {
            nuevaFotoRuta = await migrarArchivo(foto_url, id_comuna, id_asamblea, 'foto');
        }
        else if (foto_url && !foto_url.startsWith('http')) {
            nuevaFotoRuta = foto_url; // ya es ruta relativa
        }
        let nuevaActaRuta = null;
        if (acta_url && acta_url.startsWith('http')) {
            nuevaActaRuta = await migrarArchivo(acta_url, id_comuna, id_asamblea, 'acta');
        }
        else if (acta_url && !acta_url.startsWith('http')) {
            nuevaActaRuta = acta_url;
        }
        if (nuevaFotoRuta !== foto_url || nuevaActaRuta !== acta_url) {
            const { error: updateError } = await supabase
                .from('asambleas_comuna')
                .update({ foto_url: nuevaFotoRuta, acta_url: nuevaActaRuta })
                .eq('id_asamblea', id_asamblea);
            if (updateError) {
                console.error(`Error actualizando asamblea ${id_asamblea}:`, updateError);
            }
            else {
                console.log(`Asamblea ${id_asamblea} actualizada.`);
            }
        }
    }
    console.log('Migración completada.');
}
async function migrarArchivo(url, idComuna, idAsamblea, tipo) {
    try {
        const { bucketOrigen, rutaRelativa } = extraerBucketYRuta(url);
        if (!bucketOrigen || !rutaRelativa) {
            console.error(`No se pudo parsear URL: ${url}`);
            return null;
        }
        const { data: fileData, error: downloadError } = await supabase.storage
            .from(bucketOrigen)
            .download(rutaRelativa);
        if (downloadError) {
            console.error(`Error descargando de ${bucketOrigen}/${rutaRelativa}:`, downloadError);
            return null;
        }
        const extension = url.split('.').pop()?.split('?')[0] || 'bin';
        const fileName = `${tipo}_${Date.now()}.${extension}`;
        const destinoPath = `${idComuna}/asambleas/${idAsamblea}/documentos/${fileName}`;
        const { error: uploadError } = await supabase.storage
            .from(BUCKET_DESTINO)
            .upload(destinoPath, fileData, { contentType: fileData.type, upsert: true });
        if (uploadError) {
            console.error(`Error subiendo a ${BUCKET_DESTINO}/${destinoPath}:`, uploadError);
            return null;
        }
        console.log(`Migrado: ${url} -> ${destinoPath}`);
        return destinoPath;
    }
    catch (err) {
        console.error(`Error inesperado migrando ${url}:`, err);
        return null;
    }
}
function extraerBucketYRuta(publicUrl) {
    const regex = /\/storage\/v1\/object\/public\/([^\/]+)\/(.+)$/;
    const match = publicUrl.match(regex);
    if (match && match[1] && match[2]) {
        return { bucketOrigen: match[1], rutaRelativa: match[2] };
    }
    return { bucketOrigen: null, rutaRelativa: null };
}
// Ejecutar
migrarAsambleasComuna()
    .then(() => console.log('✅ Migración finalizada'))
    .catch(err => console.error('❌ Error fatal:', err));
