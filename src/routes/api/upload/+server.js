// src/routes/api/upload/+server.js
import { json } from '@sveltejs/kit';
import { supabaseAdmin } from '$lib/supabaseServer';

// Configuración
const BUCKET_NAME = 'comprobantes-pago';
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
const ALLOWED_TYPES = [
  'image/jpeg',
  'image/jpg', 
  'image/png',
  'application/pdf'
];

// IMPORTANTE: También acepta 'comprobantes' por compatibilidad
const BUCKETS_VALIDOS = ['comprobantes-pago', 'comprobantes'];

/**
 * POST - Subir comprobante de pago a Supabase Storage
 * Acepta tanto FormData (recomendado) como JSON con base64
 */
export async function POST({ request }) {
  try {
    const contentType = request.headers.get('content-type');
    let file, fileName, bucketName, pedidoId;
    
    // ========================================
    // 1. PARSEAR REQUEST (FormData o JSON)
    // ========================================
    if (contentType?.includes('multipart/form-data')) {
      // Método recomendado: FormData
      const formData = await request.formData();
      file = formData.get('file');
      pedidoId = formData.get('pedido_id');
      bucketName = formData.get('bucket') || BUCKET_NAME;
      
      if (!file || !(file instanceof File)) {
        return json(
          { success: false, error: 'No se recibió ningún archivo válido' },
          { status: 400 }
        );
      }
      
      fileName = file.name;
      
    } else {
      // Método legacy: JSON con base64
      const body = await request.json();
      const { file: base64File, fileName: name, bucket, pedido_id } = body;
      
      if (!base64File || !name) {
        return json(
          { success: false, error: 'Archivo y nombre son requeridos' },
          { status: 400 }
        );
      }
      
      fileName = name;
      bucketName = bucket || BUCKET_NAME;
      pedidoId = pedido_id;
      
      // Convertir base64 a File simulado
      const buffer = Buffer.from(base64File, 'base64');
      const blob = new Blob([buffer]);
      file = new File([blob], fileName);
    }

    // ========================================
    // 2. VALIDACIONES
    // ========================================
    
    // Validar tipo de archivo
    const fileType = file.type || 'application/octet-stream';
    if (!ALLOWED_TYPES.includes(fileType)) {
      return json(
        { 
          success: false, 
          error: `Tipo de archivo no permitido: ${fileType}. Solo JPG, PNG o PDF.`,
          allowedTypes: ALLOWED_TYPES
        },
        { status: 400 }
      );
    }

    // Validar tamaño
    const fileSize = file.size || 0;
    if (fileSize > MAX_FILE_SIZE) {
      return json(
        { 
          success: false, 
          error: `Archivo muy grande (${(fileSize / 1024 / 1024).toFixed(2)}MB). Máximo ${MAX_FILE_SIZE / 1024 / 1024}MB` 
        },
        { status: 400 }
      );
    }

    // ========================================
    // 3. VERIFICAR QUE EL BUCKET EXISTE
    // ========================================
    
    // Intentar con el bucket especificado o el por defecto
    let bucketFinal = bucketName;
    
    try {
      const { data: buckets, error: bucketsError } = await supabaseAdmin
        .storage
        .listBuckets();
      
      if (bucketsError) {
        console.error('❌ Error listando buckets:', bucketsError);
        throw new Error('No se pudo verificar la configuración de storage');
      }

      // Buscar el bucket en los válidos
      const bucketEncontrado = buckets?.find(b => 
        BUCKETS_VALIDOS.includes(b.name) || b.name === bucketName
      );
      
      if (!bucketEncontrado) {
        console.error(`❌ Bucket no encontrado. Disponibles:`, buckets?.map(b => b.name));
        console.error(`❌ Buscando:`, bucketName, 'o', BUCKETS_VALIDOS);
        
        return json(
          { 
            success: false, 
            error: `Storage no configurado correctamente. Bucket "${bucketName}" no existe.`,
            details: process.env.NODE_ENV === 'development' 
              ? `Buckets disponibles: ${buckets?.map(b => b.name).join(', ')}`
              : 'Contacta al administrador',
            hint: 'Ve a Supabase Dashboard > Storage y crea el bucket "comprobantes-pago" (público)'
          },
          { status: 500 }
        );
      }
      
      bucketFinal = bucketEncontrado.name;
      console.log(`✅ Bucket encontrado: ${bucketFinal}`);
      
    } catch (err) {
      console.error('❌ Error verificando bucket:', err);
      return json(
        { 
          success: false, 
          error: 'Error de configuración del storage',
          details: err.message 
        },
        { status: 500 }
      );
    }

    // ========================================
    // 4. GENERAR NOMBRE ÚNICO PARA EL ARCHIVO
    // ========================================
    const timestamp = Date.now();
    const randomString = Math.random().toString(36).substring(2, 15);
    const extension = fileName.split('.').pop() || 'jpg';
    const cleanFileName = pedidoId 
      ? `pedido_${pedidoId}_${timestamp}_${randomString}.${extension}`
      : `upload_${timestamp}_${randomString}.${extension}`;
    const filePath = `comprobantes/${cleanFileName}`;

    // ========================================
    // 5. CONVERTIR FILE A ARRAYBUFFER
    // ========================================
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    console.log(`📤 Subiendo archivo: ${cleanFileName} (${(buffer.length / 1024).toFixed(2)}KB)`);

    // ========================================
    // 6. SUBIR A SUPABASE STORAGE
    // ========================================
    const { data: uploadData, error: uploadError } = await supabaseAdmin
      .storage
      .from(bucketFinal)
      .upload(filePath, buffer, {
        contentType: fileType,
        cacheControl: '3600',
        upsert: false
      });

    if (uploadError) {
      console.error('❌ Error en Supabase Storage:', uploadError);
      throw new Error(uploadError.message || 'Error subiendo archivo');
    }

    // ========================================
    // 7. OBTENER URL PÚBLICA
    // ========================================
    const { data: urlData } = supabaseAdmin
      .storage
      .from(bucketFinal)
      .getPublicUrl(filePath);

    if (!urlData || !urlData.publicUrl) {
      throw new Error('No se pudo generar la URL pública');
    }

    console.log('✅ Archivo subido exitosamente:', {
      fileName: cleanFileName,
      url: urlData.publicUrl,
      size: `${(buffer.length / 1024).toFixed(2)}KB`
    });

    // ========================================
    // 8. RESPUESTA EXITOSA
    // ========================================
    return json({
      success: true,
      url: urlData.publicUrl,
      data: {
        fileName: cleanFileName,
        filePath,
        fileSize: buffer.length,
        fileType,
        bucket: bucketFinal
      },
      message: 'Archivo subido correctamente'
    });

  } catch (error) {
    console.error('Error subiendo archivo:', error);
    
    return json(
      { 
        success: false, 
        error: error.message || 'Error al subir el archivo',
        details: process.env.NODE_ENV === 'development' ? error.stack : undefined
      },
      { status: 500 }
    );
  }
}

/**
 * DELETE - Eliminar archivo del storage
 */
export async function DELETE({ url }) {
  try {
    const filePath = url.searchParams.get('path');
    
    if (!filePath) {
      return json(
        { success: false, error: 'Ruta del archivo requerida' },
        { status: 400 }
      );
    }

    const { error } = await supabaseAdmin
      .storage
      .from(BUCKET_NAME)
      .remove([filePath]);

    if (error) throw error;

    return json({
      success: true,
      message: 'Archivo eliminado correctamente'
    });

  } catch (error) {
    console.error('Error eliminando archivo:', error);
    return json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}