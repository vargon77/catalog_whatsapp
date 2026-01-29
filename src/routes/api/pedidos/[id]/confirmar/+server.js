// src/routes/api/pedidos/[id]/confirmar/+server.js
import { json } from '@sveltejs/kit';
import { supabaseAdmin } from '$lib/supabaseServer';
import { ESTADOS, validarTransicion } from '$lib/server/pedidos/estados';
import { encolarNotificacion } from '$lib/server/notificaciones/cola';

export async function POST({ params, request }) {
  try {
    const { id } = params;
    const body = await request.json();
    
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
    
    const validacion = validarTransicion(pedido.estado, ESTADOS.CONFIRMADO);
    if (!validacion.valido) {
      return json(
        { success: false, error: validacion.mensaje },
        { status: 400 }
      );
    }
    
    const costoEnvio = parseFloat(body.costo_envio || 0);
    const nuevoTotal = parseFloat(pedido.subtotal) + 
                      parseFloat(pedido.impuesto || 0) + 
                      costoEnvio;
    
    const updateData = {
      estado: ESTADOS.CONFIRMADO,
      fecha_confirmado: new Date().toISOString(),
      costo_envio: costoEnvio,
      total: nuevoTotal,
      metodo_pago: body.metodo_pago || pedido.metodo_pago,
      notas: body.notas || pedido.notas
    };
    
    const { data: pedidoActualizado, error } = await supabaseAdmin
      .from('pedidos')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();
    
    if (error) {
      console.error('Error actualizando pedido:', error);
      throw error;
    }
    
    await supabaseAdmin
      .from('pedidos_historial')
      .insert({
        pedido_id: id,
        estado_anterior: pedido.estado,
        estado_nuevo: ESTADOS.CONFIRMADO,
        tipo_usuario: 'vendedor',
        usuario_responsable: 'Admin',
        notas: `Stock validado. Costo de envío: $${costoEnvio.toFixed(2)}, Total: $${nuevoTotal.toFixed(2)}`,
        metadata: {
          costo_envio_agregado: costoEnvio,
          metodo_pago: body.metodo_pago,
          total: nuevoTotal
        }
      });
    
    // ✅ NOTIFICACIÓN CORREGIDA
    try {
      console.log('📲 Encolando notificación de confirmación...');
      
      const { data: config } = await supabaseAdmin
        .from('configuracion')
        .select('cuentas_pago')
        .single();
      
      const cuentasPago = config?.cuentas_pago 
        ? (typeof config.cuentas_pago === 'string' 
            ? JSON.parse(config.cuentas_pago) 
            : config.cuentas_pago)
        : [];
      
      await encolarNotificacion({
        pedidoId: id,
        clienteWhatsapp: pedido.cliente_whatsapp,
        tipo: 'pedido_confirmado',
        prioridad: 'alta',
        metadata: {
          metodo_pago: body.metodo_pago,
          costo_envio: costoEnvio,
          total: nuevoTotal,
          cuentas_pago: cuentasPago
        }
      });
      
      console.log('✅ Notificación encolada');
      
      // ✅ PROCESAR INMEDIATAMENTE
      const { procesarColaNot } = await import('$lib/server/notificaciones/procesador');
      await procesarColaNot();
      
      console.log(`✅ Notificación procesada para pedido ${pedidoActualizado.numero_pedido}`);
    } catch (notifError) {
      console.error('⚠️ Error en notificación:', notifError);
    }
    
    return json({
      success: true,
      data: pedidoActualizado,
      message: 'Pedido confirmado. Se envió mensaje al cliente con datos de pago.'
    });
    
  } catch (error) {
    console.error('Error confirmando pedido:', error);
    return json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}