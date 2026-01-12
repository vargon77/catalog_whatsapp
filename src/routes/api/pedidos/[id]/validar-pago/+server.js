// src/routes/api/pedidos/[id]/validar-pago/+server.js
import { json } from '@sveltejs/kit';
import { supabaseAdmin } from '$lib/supabaseServer';
import { ESTADOS, ESTADOS_PAGO, puedeValidarPago } from '$lib/server/pedidos/estados';

/**
 * POST - Validar comprobante de pago
 * Body: { aprobado: boolean, motivo_rechazo?: string, validado_por: string }
 */
export async function POST({ params, request }) {
  try {
    const { id } = params;
    const { aprobado, motivo_rechazo, validado_por } = await request.json();
    
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
    
    // Validar que se puede validar el pago
    const validacion = puedeValidarPago(pedido);
    if (!validacion.valido) {
      return json(
        { success: false, error: validacion.mensaje },
        { status: 400 }
      );
    }
    
    let updateData = {};
    let mensajeHistorial = '';
    
    if (aprobado) {
      // ✅ PAGO APROBADO
      updateData = {
        estado: ESTADOS.PAGADO,
        estado_pago: ESTADOS_PAGO.PAGADO,
        esperando_validacion: false,
        fecha_pagado: new Date().toISOString(),
        validado_por: validado_por || 'Vendedor',
        editable: false // Bloquear edición
      };
      mensajeHistorial = 'Pago validado correctamente';
      
    } else {
      // ❌ PAGO RECHAZADO
      updateData = {
        estado_pago: ESTADOS_PAGO.RECHAZADO,
        esperando_validacion: false,
        motivo_rechazo_pago: motivo_rechazo || 'Comprobante no válido',
        editable: true, // Reabrir edición para que cliente pueda corregir
        constancia_pago_url: null // Limpiar comprobante rechazado
      };
      mensajeHistorial = `Pago rechazado: ${motivo_rechazo}`;
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
        estado_nuevo: aprobado ? ESTADOS.PAGADO : pedido.estado,
        tipo_usuario: 'vendedor',
        usuario_responsable: validado_por,
        notas: mensajeHistorial,
        metadata: {
          aprobado,
          motivo_rechazo: motivo_rechazo || null
        }
      });
    
    return json({
      success: true,
      data: pedidoActualizado,
      message: aprobado 
        ? '✅ Pago validado. El pedido ahora está en preparación.' 
        : '❌ Pago rechazado. El cliente debe subir un nuevo comprobante.'
    });
    
  } catch (error) {
    console.error('Error validando pago:', error);
    return json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}