// src/routes/api/configuracion/+server.js


import { json } from '@sveltejs/kit';
import { supabaseAdmin } from '$lib/supabaseServer';

// ========================================
// GET - Obtener configuración
// ========================================
export async function GET() {
  try {
    const { data, error } = await supabaseAdmin
      .from('configuracion')
      .select('*')
      .single();
    
    if (error) throw error;
    
    return json({
      success: true,
      data
    });
  } catch (error) {
    console.error('Error GET configuración:', error);
    return json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}

// ========================================
// PUT - Actualizar configuración
// ✅ CORREGIDO: Incluye imagenes_tienda y ubicacion
// ========================================
export async function PUT({ request }) {
  try {
    const body = await request.json();
    
    // Obtener el ID del único registro de configuración
    const { data: configActual } = await supabaseAdmin
      .from('configuracion')
      .select('id')
      .single();
    
    if (!configActual) {
      return json(
        { success: false, error: 'No se encontró configuración' },
        { status: 404 }
      );
    }
    
    const updateData = {};
    
    // ✅ CORRECCIÓN: Agregados imagenes_tienda y ubicacion
    const camposPermitidos = [
      'nombre_empresa', 'whatsapp_numero', 'email',
      'direccion', 'horario_atencion', 'moneda_simbolo',
      'impuesto_porcentaje', 'logo_url', 'descripcion_empresa',
      'terminos_condiciones', 'politica_privacidad',
      'redes_sociales', 'colores_tema', 'imagenes_tienda', 'ubicacion'
    ];
    
    camposPermitidos.forEach(campo => {
      if (body[campo] !== undefined) {
        updateData[campo] = body[campo];
      }
    });
    
    // ✅ Log para debugging
    console.log('📤 Actualizando configuración:', {
      ...updateData,
      imagenes_tienda: updateData.imagenes_tienda?.length || 0,
      ubicacion: updateData.ubicacion ? 'presente' : 'ausente'
    });
    
    const { data, error } = await supabaseAdmin
      .from('configuracion')
      .update(updateData)
      .eq('id', configActual.id)
      .select()
      .single();
    
    if (error) throw error;
    
    console.log('✅ Configuración actualizada correctamente');
    
    return json({
      success: true,
      data,
      message: 'Configuración actualizada exitosamente'
    });
    
  } catch (error) {
    console.error('❌ Error PUT configuración:', error);
    return json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}