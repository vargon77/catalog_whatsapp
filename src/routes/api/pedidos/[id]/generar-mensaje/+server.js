// src/routes/api/pedidos/[id]/generar-mensaje/+server.js
import { json } from '@sveltejs/kit';
import { supabaseAdmin } from '$lib/supabaseServer';
import { enviarMensajeWhatsApp } from '$lib/server/whatsapp/servicio';

/**
 * POST - Generar mensaje de WhatsApp para un pedido
 * Body: { tipo: string, datos_adicionales?: object }
 * 
 * Tipos disponibles:
 * - pedido_recibido
 * - pedido_confirmado
 * - comprobante_recibido
 * - pago_validado
 * - pago_rechazado (requiere motivo en datos_adicionales)
 * - pedido_enviado
 * - pedido_recibido
 * - pedido_cancelado
 */
export async function POST({ params, request }) {
  try {
    const { id } = params;
    const { tipo, datos_adicionales = {} } = await request.json();
    
    if (!tipo) {
      return json(
        { success: false, error: 'Tipo de mensaje requerido' },
        { status: 400 }
      );
    }
    
    // Obtener pedido completo
    const { data: pedido, error: errorPedido } = await supabaseAdmin
      .from('pedidos')
      .select(`
        *,
        items:pedidos_items(*)
      `)
      .eq('id', id)
      .single();
    
    if (errorPedido || !pedido) {
      return json(
        { success: false, error: 'Pedido no encontrado' },
        { status: 404 }
      );
    }
    
    // Obtener configuración
    const { data: configuracion, error: errorConfig } = await supabaseAdmin
      .from('configuracion')
      .select('*')
      .single();
    
    if (errorConfig || !configuracion) {
      return json(
        { success: false, error: 'Configuración no encontrada' },
        { status: 404 }
      );
    }
    
    // Generar mensaje
    const resultado = await enviarMensajeWhatsApp(
      pedido,
      tipo,
      configuracion,
      datos_adicionales
    );
    
    if (!resultado) {
      return json(
        { success: false, error: 'No se pudo generar el mensaje' },
        { status: 500 }
      );
    }
    
    return json({
      success: true,
      data: {
        url: resultado.url,
        mensaje: resultado.mensaje,
        telefono: resultado.telefono
      },
      message: 'Mensaje generado correctamente'
    });
    
  } catch (error) {
    console.error('Error generando mensaje:', error);
    return json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}