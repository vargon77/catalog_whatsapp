// src/routes/api/pedidos/[id]/cambiar-estado/+server.js
// ✅ CAMBIAR ESTADO CON NOTIFICACIONES

import { json } from '@sveltejs/kit';
import { supabaseAdmin } from '$lib/supabaseServer';
import { 
  ESTADOS, 
  validarTransicionConContexto 
} from '$lib/server/pedidos/estados';
import { encolarNotificacion, procesarCola } from '$lib/server/notificaciones/cola';

export async function POST({ params, request }) {
  const { id } = params;
  
  try {
    const { estado_nuevo, notas, tipo_usuario = 'vendedor' } = await request.json();
    
    if (!estado_nuevo) {
      return json({ success: false, error: 'Estado nuevo es requerido' }, { status: 400 });
    }
    
    // Obtener pedido actual
    const { data: pedido, error: errorPedido } = await supabaseAdmin
      .from('pedidos')
      .select('*')
      .eq('id', id)
      .single();
    
    if (errorPedido || !pedido) {
      return json({ success: false, error: 'Pedido no encontrado' }, { status: 404 });
    }
    
    // Validar transición
    const validacion = validarTransicionConContexto(pedido, estado_nuevo);
    if (!validacion.valido) {
      return json({ success: false, error: validacion.mensaje }, { status: 400 });
    }
    
    // Preparar datos de actualización
    const updateData = { estado: estado_nuevo };
    
    switch (estado_nuevo) {
      case ESTADOS.PREPARANDO:
        updateData.fecha_preparando = new Date().toISOString();
        break;
      case ESTADOS.ENVIADO:
        if (pedido.envio && !pedido.guia_envio?.numero_guia) {
          return json({ 
            success: false, 
            error: 'Debe capturar la guía de envío antes de marcar como enviado' 
          }, { status: 400 });
        }
        updateData.fecha_enviado = pedido.fecha_enviado || new Date().toISOString();
        break;
      case ESTADOS.RECIBIDO:
        updateData.fecha_recibido = new Date().toISOString();
        break;
      case ESTADOS.ENTREGADO:
        updateData.fecha_entregado = new Date().toISOString();
        break;
      case ESTADOS.CANCELADO:
        updateData.fecha_cancelado = new Date().toISOString();
        updateData.motivo_cancelacion = notas || 'Cancelado por vendedor';
        break;
    }
    
    // Actualizar pedido
    const { data: pedidoActualizado, error: errorUpdate } = await supabaseAdmin
      .from('pedidos')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();
    
    if (errorUpdate) {
      console.error('Error actualizando estado:', errorUpdate);
      return json({ success: false, error: 'Error al cambiar estado' }, { status: 500 });
    }
    
    // Registrar en historial
    await supabaseAdmin
      .from('pedidos_historial')
      .insert({
        pedido_id: id,
        estado_anterior: pedido.estado,
        estado_nuevo: estado_nuevo,
        tipo_usuario: tipo_usuario,
        notas: notas || `Cambio de estado a ${estado_nuevo}`
      });
    
    // ✅ ENCOLAR NOTIFICACIÓN
    await enviarNotificacionCambioEstado(pedidoActualizado, estado_nuevo);
    
    console.log(`✅ Pedido ${pedido.numero_pedido}: ${pedido.estado} → ${estado_nuevo}`);
    
    return json({
      success: true,
      data: pedidoActualizado,
      message: `Pedido actualizado a ${estado_nuevo}`
    });
    
  } catch (error) {
    console.error('Error en cambiar-estado:', error);
    return json({ success: false, error: 'Error interno del servidor' }, { status: 500 });
  }
}

/**
 * ✅ Encolar notificación según el cambio de estado
 */
async function enviarNotificacionCambioEstado(pedido, estadoNuevo) {
  try {
    let tipoNotificacion = null;
    let metadata = {};
    let prioridad = 'media';
    
    switch (estadoNuevo) {
      case ESTADOS.CONFIRMADO:
        tipoNotificacion = 'pedido_confirmado';
        prioridad = 'alta';
        break;
        
      case ESTADOS.PREPARANDO:
        tipoNotificacion = 'pedido_preparando';
        metadata = {
          ciudad: pedido.cliente_direccion?.ciudad,
          estado: pedido.cliente_direccion?.estado
        };
        break;
        
      case ESTADOS.ENVIADO:
        tipoNotificacion = 'pedido_enviado';
        prioridad = 'alta';
        metadata = {
          paqueteria: pedido.guia_envio?.paqueteria,
          numero_guia: pedido.guia_envio?.numero_guia,
          url_rastreo: pedido.guia_envio?.url_rastreo,
          es_local: pedido.guia_envio?.es_entrega_local
        };
        break;
        
      case ESTADOS.RECIBIDO:
        tipoNotificacion = 'pedido_recibido_confirmacion';
        break;
        
      case ESTADOS.ENTREGADO:
        tipoNotificacion = 'pedido_entregado';
        break;
        
      case ESTADOS.CANCELADO:
        tipoNotificacion = 'pedido_cancelado';
        metadata = { motivo: pedido.motivo_cancelacion };
        break;
    }
    
    if (tipoNotificacion) {
      await encolarNotificacion({
        pedidoId: pedido.id,
        clienteWhatsapp: pedido.cliente_whatsapp,
        tipo: tipoNotificacion,
        prioridad: prioridad,
        metadata: metadata
      });
      
      // Procesar cola inmediatamente
      await procesarCola();
    }
    
  } catch (error) {
    console.error('⚠️ Error encolando notificación (no crítico):', error);
  }
}