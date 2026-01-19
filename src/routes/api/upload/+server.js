// src/routes/api/upload/+server.js
//  VERSIÓN SIMPLIFICADA Y ROBUSTA

import { json } from '@sveltejs/kit';
import { supabaseAdmin } from '$lib/supabaseServer';

const CONFIG = {
  BUCKET: 'comprobantes-pago',
  MAX_SIZE: 5 * 1024 * 1024, // 5MB
  ALLOWED_TYPES: ['image/jpeg', 'image/jpg', 'image/png', 'application/pdf']
};

export async function POST({ request }) {
  try {
    // 1. Solo aceptar FormData (más simple y estándar)
    const formData = await request.formData();
    const file = formData.get('file');
    const pedidoId = formData.get('pedido_id');
    
    if (!file || !(file instanceof File)) {
      return json(
        { success: false, error: 'Archivo requerido' },
        { status: 400 }
      );
    }
    
    // 2. Validaciones
    if (!CONFIG.ALLOWED_TYPES.includes(file.type)) {
      return json(
        { 
          success: false, 
          error: `Tipo no permitido. Solo: ${CONFIG.ALLOWED_TYPES.join(', ')}`
        },
        { status: 400 }
      );
    }
    
    if (file.size > CONFIG.MAX_SIZE) {
      return json(
        { 
          success: false, 
          error: `Archivo muy grande. Máximo ${CONFIG.MAX_SIZE / 1024 / 1024}MB` 
        },
        { status: 400 }
      );
    }
    
    // 3. Generar nombre único
    const timestamp = Date.now();
    const random = Math.random().toString(36).substring(2, 10);
    const ext = file.name.split('.').pop() || 'jpg';
    const fileName = pedidoId 
      ? `pedido_${pedidoId}_${timestamp}_${random}.${ext}`
      : `upload_${timestamp}_${random}.${ext}`;
    
    const filePath = `comprobantes/${fileName}`;
    
    // 4. Subir a Supabase
    const buffer = Buffer.from(await file.arrayBuffer());
    
    const { error: uploadError } = await supabaseAdmin
      .storage
      .from(CONFIG.BUCKET)
      .upload(filePath, buffer, {
        contentType: file.type,
        cacheControl: '3600',
        upsert: false
      });
    
    if (uploadError) {
      // Si el bucket no existe, dar error claro
      if (uploadError.message.includes('not found')) {
        return json(
          { 
            success: false, 
            error: `Bucket "${CONFIG.BUCKET}" no existe. Créalo en Supabase Dashboard > Storage`
          },
          { status: 500 }
        );
      }
      throw uploadError;
    }
    
    // 5. Obtener URL pública
    const { data: urlData } = supabaseAdmin
      .storage
      .from(CONFIG.BUCKET)
      .getPublicUrl(filePath);
    
    if (!urlData?.publicUrl) {
      throw new Error('No se pudo generar URL pública');
    }
    
    console.log(`✅ Archivo subido: ${fileName} (${(buffer.length / 1024).toFixed(2)}KB)`);
    
    return json({
      success: true,
      url: urlData.publicUrl,
      data: {
        fileName,
        filePath,
        fileSize: buffer.length,
        fileType: file.type
      }
    });
    
  } catch (error) {
    console.error('❌ Error en upload:', error);
    return json(
      { 
        success: false, 
        error: error.message || 'Error al subir archivo'
      },
      { status: 500 }
    );
  }
}

// DELETE para limpiar archivos viejos
export async function DELETE({ url }) {
  try {
    const filePath = url.searchParams.get('path');
    
    if (!filePath) {
      return json(
        { success: false, error: 'Ruta requerida' },
        { status: 400 }
      );
    }
    
    const { error } = await supabaseAdmin
      .storage
      .from(CONFIG.BUCKET)
      .remove([filePath]);
    
    if (error) throw error;
    
    return json({ success: true, message: 'Archivo eliminado' });
    
  } catch (error) {
    return json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}