// ========================================
// src/routes/api/pedidos/[id]/subir-comprobante/+server.js
// ========================================
import { json } from '@sveltejs/kit';
import { supabaseAdmin } from '$lib/supabaseServer';
import { ESTADOS, ESTADOS_PAGO } from '$lib/server/pedidos/estados';

export async function POST({ params, request }) {
  try {
    const { id } = params;
    const { comprobante_url } = await request.json();
    
    if (!comprobante_url) {
      return json(
        { success: false, error: 'URL del comprobante requerida' },
        { status: 400 }
      );
    }
    
    const { data: pedido } = await supabaseAdmin
      .from('pedidos')
      .select('estado')
      .eq('id', id)
      .single();
    
    if (pedido.estado !== ESTADOS.CONFIRMADO) {
      return json(
        { success: false, error: 'El pedido debe estar confirmado' },
        { status: 400 }
      );
    }
    
    // Actualizar con comprobante
    const { data, error } = await supabaseAdmin
      .from('pedidos')
      .update({
        constancia_pago_url: comprobante_url,
        estado_pago: ESTADOS_PAGO.PENDIENTE_VALIDACION,
        esperando_validacion: true,
        editable: false // Se bloquea automáticamente
      })
      .eq('id', id)
      .select()
      .single();
    
    if (error) throw error;
    
    // Registrar en historial
    await supabaseAdmin
      .from('pedidos_historial')
      .insert({
        pedido_id: id,
        estado_anterior: pedido.estado,
        estado_nuevo: pedido.estado,
        tipo_usuario: 'cliente',
        notas: 'Cliente subió comprobante de pago - Esperando validación'
      });
    
    return json({
      success: true,
      data,
      message: 'Comprobante subido. Esperando validación del vendedor.'
    });
    
  } catch (error) {
    return json({ success: false, error: error.message }, { status: 500 });
  }
}
