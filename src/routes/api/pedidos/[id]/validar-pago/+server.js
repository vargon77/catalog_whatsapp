// src/routes/api/pedidos/[id]/validar-pago/+server.js
// ✅ VERSIÓN FINAL CORREGIDA

import { json } from '@sveltejs/kit';
import { supabaseAdmin } from '$lib/supabaseServer';
import { 
  ESTADOS, 
  ESTADOS_PAGO, 
  validarTransicionConContexto 
} from '$lib/server/pedidos/estados';
import { encolarNotificacion } from '$lib/server/notificaciones/cola';

/**
 * POST - Validar comprobante de pago
 */
export async function POST({ params, request }) {
  const { id } = params;
  
  try {
    const { aprobado, motivo_rechazo, validado_por } = await request.json();
    
    // Validaciones iniciales
    if (typeof aprobado !== 'boolean') {
      return json(
        { success: false, error: 'El campo "aprobado" es requerido y debe ser booleano' },
        { status: 400 }
      );
    }
    
    if (!aprobado && (!motivo_rechazo || motivo_rechazo.trim().length < 10)) {
      return json(
        { success: false, error: 'Debes proporcionar un motivo de rechazo (mínimo 10 caracteres)' },
        { status: 400 }
      );
    }
    
    // Obtener pedido
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
    
    // Validar precondiciones
    if (!pedido.constancia_pago_url) {
      return json(
        { success: false, error: 'No hay comprobante de pago para validar' },
        { status: 400 }
      );
    }
    
    if (pedido.estado !== ESTADOS.CONFIRMADO) {
      return json(
        { success: false, error: `El pedido debe estar en estado CONFIRMADO (actual: ${pedido.estado})` },
        { status: 400 }
      );
    }
    
    if (pedido.estado_pago === ESTADOS_PAGO.PAGADO) {
      return json(
        { success: false, error: 'El pago ya fue validado anteriormente' },
        { status: 400 }
      );
    }
    
    // Preparar datos según decisión
    let updateData;
    let mensajeHistorial;
    let tipoNotificacion;
    
    if (aprobado) {
      // ✅ PAGO APROBADO
      const validacion = validarTransicionConContexto(pedido, ESTADOS.PAGADO);
      if (!validacion.valido) {
        return json(
          { success: false, error: validacion.mensaje },
          { status: 400 }
        );
      }
      
      updateData = {
        estado: ESTADOS.PAGADO,
        estado_pago: ESTADOS_PAGO.PAGADO,
        esperando_validacion: false,
        fecha_pagado: new Date().toISOString(),
        validado_por: validado_por || 'Admin',
        editable: false,
        motivo_rechazo_pago: null
      };
      
      mensajeHistorial = `Pago validado por ${validado_por || 'Admin'}`;
      tipoNotificacion = 'pago_validado';
      
    } else {
      // ❌ PAGO RECHAZADO - MANTENER EN CONFIRMADO
      updateData = {
        estado: ESTADOS.CONFIRMADO, // ✅ Mantener confirmado
        estado_pago: ESTADOS_PAGO.RECHAZADO,
        esperando_validacion: false,
        motivo_rechazo_pago: motivo_rechazo.trim(),
        constancia_pago_url: null, // Limpiar comprobante rechazado
        // ✅ NO LIMPIAR: costo_envio, fecha_confirmado, metodo_pago
        editable: true // Permitir correcciones
      };
      
      mensajeHistorial = `Pago rechazado por ${validado_por || 'Admin'}: ${motivo_rechazo}`;
      tipoNotificacion = 'pago_rechazado';
    }
    
    // Actualizar pedido
    const { data: pedidoActualizado, error: errorUpdate } = await supabaseAdmin
      .from('pedidos')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();
    
    if (errorUpdate) {
      console.error('Error actualizando pedido:', errorUpdate);
      return json(
        { success: false, error: 'Error al actualizar el estado del pedido' },
        { status: 500 }
      );
    }
    
    // Registrar en historial
    await supabaseAdmin
      .from('pedidos_historial')
      .insert({
        pedido_id: id,
        estado_anterior: pedido.estado,
        estado_nuevo: updateData.estado,
        tipo_usuario: 'vendedor',
        usuario_responsable: validado_por || 'Admin',
        notas: mensajeHistorial,
        metadata: {
          aprobado,
          motivo_rechazo: aprobado ? null : motivo_rechazo,
          comprobante_url: pedido.constancia_pago_url,
          timestamp: new Date().toISOString()
        }
      });
    
    // Encolar notificación
    try {
      await encolarNotificacion({
        pedidoId: id,
        clienteWhatsapp: pedidoActualizado.cliente_whatsapp,
        tipo: tipoNotificacion,
        prioridad: 'alta',
        metadata: aprobado ? {} : { motivo: motivo_rechazo }
      });
      
      // 🔥 Procesar inmediatamente
      const { procesarCola } = await import('$lib/server/notificaciones/cola');
      await procesarCola();
      
      console.log(`✅ Notificación ${tipoNotificacion} enviada para pedido ${pedidoActualizado.numero_pedido}`);
    } catch (notifError) {
      console.error('⚠️ Error en notificación:', notifError);
    }
    
    // Respuesta
    const mensaje = aprobado 
      ? '✅ Pago validado correctamente. El pedido pasó a estado PAGADO.'
      : '❌ Pago rechazado. El cliente debe subir un nuevo comprobante.';
    
    return json({
      success: true,
      data: pedidoActualizado,
      message: mensaje
    });
    
  } catch (error) {
    console.error('Error en validación de pago:', error);
    return json(
      { success: false, error: 'Error interno al validar el pago' },
      { status: 500 }
    );
  }
}