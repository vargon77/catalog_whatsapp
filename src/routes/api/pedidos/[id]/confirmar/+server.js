// src/routes/api/pedidos/[id]/confirmar/+server.js
import { json } from '@sveltejs/kit';
import { supabaseAdmin } from '$lib/supabaseServer';
import { ESTADOS, validarTransicion } from '$lib/server/pedidos/estados';

/**
 * POST - Confirmar pedido (Vendedor valida stock y agrega costos)
 */
export async function POST({ params, request }) {
  try {
    const { id } = params;
    const body = await request.json();
    
    // Obtener pedido actual
    const { data: pedido, error: errorPedido } = await supabaseAdmin
      .from('pedidos')
      .select('*')
      .eq('id', id)
      .single();
    
    if (errorPedido || !pedido) {
      return json(
        { success: false, error: 'Pedido no encontrado' },
        { status: 404 }
      );
    }
    
    // Validar transición
    const validacion = validarTransicion(pedido.estado, ESTADOS.CONFIRMADO);
    if (!validacion.valido) {
      return json(
        { success: false, error: validacion.mensaje },
        { status: 400 }
      );
    }
    
    // Datos a actualizar
    const updateData = {
      estado: ESTADOS.CONFIRMADO,
      fecha_confirmado: new Date().toISOString(),
      costo_envio: parseFloat(body.costo_envio || 0),
      metodo_pago: body.metodo_pago || pedido.metodo_pago,
      notas: body.notas || pedido.notas
    };
    
    // Recalcular total si cambió el costo de envío
    if (body.costo_envio !== undefined) {
      const nuevoTotal = parseFloat(pedido.subtotal) + 
                        parseFloat(pedido.impuesto || 0) + 
                        parseFloat(body.costo_envio);
      updateData.total = nuevoTotal;
    }
    
    // Actualizar pedido
    const { data: pedidoActualizado, error } = await supabaseAdmin
      .from('pedidos')
      .update(updateData)
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
        estado_nuevo: ESTADOS.CONFIRMADO,
        tipo_usuario: 'vendedor',
        notas: `Stock validado. Costo de envío: $${body.costo_envio || 0}`,
        metadata: {
          costo_envio_agregado: body.costo_envio || 0,
          metodo_pago: body.metodo_pago
        }
      });
    
    return json({
      success: true,
      data: pedidoActualizado,
      message: 'Pedido confirmado exitosamente'
    });
    
  } catch (error) {
    console.error('Error confirmando pedido:', error);
    return json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}