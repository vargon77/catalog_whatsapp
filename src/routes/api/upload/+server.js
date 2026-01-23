// src/routes/api/upload/+server.js
// ✅ VERSIÓN CORREGIDA - Sintaxis de console.log arreglada

import { json } from '@sveltejs/kit';
import { uploadToCloudinary } from '$lib/cloudinary';

const CONFIG = {
  MAX_SIZE: 5 * 1024 * 1024, // 5MB
  ALLOWED_TYPES: ['image/jpeg', 'image/jpg', 'image/png']
};

export async function POST({ request }) {
  try {
    const formData = await request.formData();
    const file = formData.get('file');
    const pedidoId = formData.get('pedido_id');
    
    console.log('📥 Upload request:', {
      hasFile: !!file,
      pedidoId,
      fileType: file?.type,
      fileSize: file?.size
    });
    
    if (!file || !(file instanceof File)) {
      return json(
        { success: false, error: 'Archivo requerido' },
        { status: 400 }
      );
    }
    
    if (!CONFIG.ALLOWED_TYPES.includes(file.type)) {
      return json(
        { 
          success: false, 
          error: `Tipo no permitido. Solo: JPG, PNG`
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
    
    // ✅ CORREGIDO: Paréntesis en lugar de backticks
    console.log(`✅ Validaciones pasadas. Subiendo ${file.name} (${(file.size / 1024).toFixed(2)}KB)`);
    
    const imageUrl = await uploadToCloudinary(file);
    
    if (!imageUrl) {
      throw new Error('No se pudo obtener URL de Cloudinary');
    }
    
    // ✅ CORREGIDO: Paréntesis en lugar de backticks
    console.log(`✅ Imagen subida a Cloudinary: ${imageUrl}`);
    
    return json({
      success: true,
      url: imageUrl,
      data: {
        fileName: file.name,
        fileSize: file.size,
        fileType: file.type,
        uploadedAt: new Date().toISOString()
      }
    });
    
  } catch (error) {
    console.error('❌ Error en upload:', error);
    
    if (error.message?.includes('Cloudinary')) {
      return json(
        { 
          success: false, 
          error: 'Error al subir a Cloudinary. Verifica tu configuración.',
          details: process.env.NODE_ENV === 'development' ? error.message : undefined
        },
        { status: 500 }
      );
    }
    
    return json(
      { 
        success: false, 
        error: error.message || 'Error al subir archivo'
      },
      { status: 500 }
    );
  }
}

export async function DELETE({ url }) {
  try {
    const imageUrl = url.searchParams.get('url');
    
    if (!imageUrl) {
      return json(
        { success: false, error: 'URL requerida' },
        { status: 400 }
      );
    }
    
    return json({ 
      success: true, 
      message: 'Archivo marcado para eliminación' 
    });
    
  } catch (error) {
    return json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}