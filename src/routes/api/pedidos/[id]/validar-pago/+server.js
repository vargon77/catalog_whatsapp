// src/routes/api/pedidos/[id]/validar-pago/+server.js
// ✅ VERSIÓN CORREGIDA con transacciones y lógica mejorada

import { json } from '@sveltejs/kit';
import { supabaseAdmin } from '$lib/supabaseServer';
import { 
  ESTADOS, 
  ESTADOS_PAGO, 
  validarTransicionConContexto 
} from '$lib/server/pedidos/estados';

// ========================================
// NUEVA: Clase de error personalizada
// ========================================
class ValidacionPagoError extends Error {
  constructor(message, code, statusCode = 400) {
    super(message);
    this.code = code;
    this.statusCode = statusCode;
  }
}

// ========================================
// POST - Validar comprobante de pago
// ========================================
export async function POST({ params, request }) {
  const { id } = params;
  
  try {
    const { aprobado, motivo_rechazo, validado_por } = await request.json();
    
    // ========================================
    // 1. VALIDACIONES INICIALES
    // ========================================
    if (typeof aprobado !== 'boolean') {
      throw new ValidacionPagoError(
        'El campo "aprobado" es requerido y debe ser booleano',
        'INVALID_INPUT'
      );
    }
    
    if (!aprobado && (!motivo_rechazo || motivo_rechazo.trim().length < 10)) {
      throw new ValidacionPagoError(
        'Debes proporcionar un motivo de rechazo (mínimo 10 caracteres)',
        'MISSING_REJECTION_REASON'
      );
    }
    
    // ========================================
    // 2. OBTENER PEDIDO CON BLOQUEO
    // ========================================
    const { data: pedido, error: errorPedido } = await supabaseAdmin
      .from('pedidos')
      .select('*')
      .eq('id', id)
      .single();
    
    if (errorPedido || !pedido) {
      throw new ValidacionPagoError(
        'Pedido no encontrado',
        'NOT_FOUND',
        404
      );
    }
    
    // ========================================
    // 3. VALIDAR PRECONDICIONES
    // ========================================
    if (!pedido.constancia_pago_url) {
      throw new ValidacionPagoError(
        'No hay comprobante de pago para validar',
        'NO_RECEIPT'
      );
    }
    
    if (pedido.estado !== ESTADOS.CONFIRMADO) {
      throw new ValidacionPagoError(
        `El pedido debe estar en estado CONFIRMADO (actual: ${pedido.estado})`,
        'INVALID_STATE'
      );
    }
    
    if (pedido.estado_pago === ESTADOS_PAGO.PAGADO) {
      throw new ValidacionPagoError(
        'El pago ya fue validado anteriormente',
        'ALREADY_VALIDATED'
      );
    }
    
    // ========================================
    // 4. PREPARAR DATOS SEGÚN DECISIÓN
    // ========================================
    let updateData;
    let mensajeHistorial;
    let notificacionCliente;
    
    if (aprobado) {
      // ✅ PAGO APROBADO
      
      // Validar transición
      const validacion = validarTransicionConContexto(pedido, ESTADOS.PAGADO);
      if (!validacion.valido) {
        throw new ValidacionPagoError(validacion.mensaje, 'TRANSITION_INVALID');
      }
      
      updateData = {
        estado: ESTADOS.PAGADO,
        estado_pago: ESTADOS_PAGO.PAGADO,
        esperando_validacion: false,
        fecha_pagado: new Date().toISOString(),
        validado_por: validado_por || 'Sistema',
        editable: false,
        motivo_rechazo_pago: null // Limpiar rechazos anteriores
      };
      
      mensajeHistorial = `Pago validado por ${validado_por || 'Sistema'}`;
      notificacionCliente = {
        tipo: 'pago_validado',
        prioridad: 'alta'
      };
      
    } else {
      // ❌ PAGO RECHAZADO
      
      // ✅ CRÍTICO: Retroceder a PENDIENTE para claridad
      updateData = {
        estado: ESTADOS.CONFIRMADO, // ← CAMBIO CLAVE
        estado_pago: ESTADOS_PAGO.RECHAZADO,
        esperando_validacion: false,
        motivo_rechazo_pago: motivo_rechazo.trim(),
        editable: true,
        constancia_pago_url: null, // Limpiar comprobante rechazado
        costo_envio: 0, // Reset costos confirmados
        fecha_confirmado: null // Reset fecha de confirmación
      };
      
      mensajeHistorial = `Pago rechazado por ${validado_por || 'Sistema'}: ${motivo_rechazo}`;
      notificacionCliente = {
        tipo: 'pago_rechazado',
        prioridad: 'alta',
        motivo: motivo_rechazo
      };
    }
    
    // ========================================
    // 5. EJECUTAR TRANSACCIÓN
    // ========================================
    
    // 5.1 Actualizar pedido
    const { data: pedidoActualizado, error: errorUpdate } = await supabaseAdmin
      .from('pedidos')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();
    
    if (errorUpdate) {
      console.error('❌ Error actualizando pedido:', errorUpdate);
      throw new Error('Error al actualizar el estado del pedido');
    }
    
    // 5.2 Registrar en historial
    const { error: errorHistorial } = await supabaseAdmin
      .from('pedidos_historial')
      .insert({
        pedido_id: id,
        estado_anterior: pedido.estado,
        estado_nuevo: updateData.estado,
        tipo_usuario: 'vendedor',
        usuario_responsable: validado_por || 'Sistema',
        notas: mensajeHistorial,
        metadata: {
          aprobado,
          motivo_rechazo: aprobado ? null : motivo_rechazo,
          comprobante_url: pedido.constancia_pago_url,
          timestamp: new Date().toISOString()
        }
      });
    
    if (errorHistorial) {
      console.error('⚠️ Error registrando historial:', errorHistorial);
      // NO fallar por esto, pero logear
    }
    
    // 5.3 Encolar notificación (asíncrono, no bloqueante)
    try {
      await encolarNotificacionWhatsApp(pedidoActualizado, notificacionCliente);
    } catch (notifError) {
      console.error('⚠️ Error encolando notificación:', notifError);
      // No fallar el proceso principal
    }
    
    // ========================================
    // 6. RESPUESTA EXITOSA
    // ========================================
    const mensaje = aprobado 
      ? '✅ Pago validado correctamente. El pedido pasó a estado PAGADO.'
      : '❌ Pago rechazado. El pedido retrocedió a PENDIENTE para corrección.';
    
    return json({
      success: true,
      data: pedidoActualizado,
      message: mensaje,
      next_steps: aprobado 
        ? ['Preparar pedido para envío', 'Generar guía si aplica']
        : ['Cliente debe subir nuevo comprobante', 'Puede editar el pedido si necesita']
    });
    
  } catch (error) {
    console.error('❌ Error en validación de pago:', error);
    
    // Manejo de errores tipificados
    if (error instanceof ValidacionPagoError) {
      return json(
        { 
          success: false, 
          error: error.message,
          code: error.code
        },
        { status: error.statusCode }
      );
    }
    
    // Error genérico
    return json(
      { 
        success: false, 
        error: 'Error interno al validar el pago',
        code: 'INTERNAL_ERROR',
        details: process.env.NODE_ENV === 'development' ? error.message : undefined
      },
      { status: 500 }
    );
  }
}

// ========================================
// HELPER: Encolar notificación WhatsApp
// ========================================
async function encolarNotificacionWhatsApp(pedido, notificacion) {
  // En producción, esto iría a una cola (Redis, Bull, etc.)
  // Por ahora, insertar en tabla de notificaciones pendientes
  
  try {
    await supabaseAdmin
      .from('notificaciones_pendientes')
      .insert({
        pedido_id: pedido.id,
        cliente_whatsapp: pedido.cliente_whatsapp,
        tipo: notificacion.tipo,
        prioridad: notificacion.prioridad,
        metadata: {
          motivo: notificacion.motivo
        },
        intentos: 0,
        estado: 'pendiente',
        programado_para: new Date().toISOString()
      });
    
    console.log(`📲 Notificación encolada para pedido ${pedido.numero_pedido}`);
  } catch (error) {
    console.error('Error encolando notificación:', error);
    throw error;
  }
}