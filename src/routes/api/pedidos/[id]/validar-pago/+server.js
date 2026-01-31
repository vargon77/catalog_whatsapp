// src/routes/api/pedidos/[id]/validar-pago/+server.js
// ✅ VERSIÓN CON AUTO-TRANSICIÓN A PREPARANDO

import { json } from '@sveltejs/kit';
import { supabaseAdmin } from '$lib/supabaseServer';
import { 
  ESTADOS, 
  ESTADOS_PAGO, 
  validarTransicionConContexto 
} from '$lib/server/pedidos/estados';
import { encolarNotificacion } from '$lib/server/notificaciones/cola';

export async function POST({ params, request }) {
  const { id } = params;
  
  try {
    const { aprobado, motivo_rechazo, validado_por } = await request.json();
    
    if (typeof aprobado !== 'boolean') {
      return json(
        { success: false, error: 'El campo "aprobado" es requerido' },
        { status: 400 }
      );
    }
    
    if (!aprobado && (!motivo_rechazo || motivo_rechazo.trim().length < 10)) {
      return json(
        { success: false, error: 'Motivo de rechazo requerido (mínimo 10 caracteres)' },
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
    
    if (!pedido.constancia_pago_url) {
      return json(
        { success: false, error: 'No hay comprobante de pago' },
        { status: 400 }
      );
    }
    
    if (pedido.estado !== ESTADOS.CONFIRMADO) {
      return json(
        { success: false, error: `El pedido debe estar CONFIRMADO (actual: ${pedido.estado})` },
        { status: 400 }
      );
    }
    
    let updateData;
    let mensajeHistorial;
    let tipoNotificacion;
    let estadoFinal;
    
    if (aprobado) {
      // ✅ PAGO APROBADO
      
      // ✅ DECISIÓN AUTOMÁTICA DE ESTADO FINAL
      if (pedido.envio) {
        // SI REQUIERE ENVÍO: Validar dirección
        if (!validarDireccionCompleta(pedido.cliente_direccion)) {
          return json(
            { 
              success: false, 
              error: 'El pedido requiere dirección de envío completa antes de aprobar el pago' 
            },
            { status: 400 }
          );
        }
        
        // ✅ AUTO-TRANSICIÓN A PREPARANDO
        estadoFinal = ESTADOS.PREPARANDO;
        mensajeHistorial = `Pago validado por ${validado_por || 'Admin'}. Pedido listo para preparar envío.`;
        
      } else {
        // SI NO REQUIERE ENVÍO: Directo a PREPARANDO (para recolección local)
        estadoFinal = ESTADOS.PREPARANDO;
        mensajeHistorial = `Pago validado por ${validado_por || 'Admin'}. Pedido listo para recolección.`;
      }
      
      updateData = {
        estado: estadoFinal,
        estado_pago: ESTADOS_PAGO.PAGADO,
        esperando_validacion: false,
        fecha_pagado: new Date().toISOString(),
        validado_por: validado_por || 'Admin',
        editable: false,
        motivo_rechazo_pago: null
      };
      
      tipoNotificacion = 'pago_validado';
      
    } else {
      // ❌ PAGO RECHAZADO
      estadoFinal = ESTADOS.CONFIRMADO;
      
      updateData = {
        estado: ESTADOS.CONFIRMADO,
        estado_pago: ESTADOS_PAGO.RECHAZADO,
        esperando_validacion: false,
        motivo_rechazo_pago: motivo_rechazo.trim(),
        constancia_pago_url: null,
        editable: true
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
        { success: false, error: 'Error al validar pago' },
        { status: 500 }
      );
    }
    
    // Registrar en historial
    await supabaseAdmin
      .from('pedidos_historial')
      .insert({
        pedido_id: id,
        estado_anterior: pedido.estado,
        estado_nuevo: estadoFinal,
        tipo_usuario: 'vendedor',
        usuario_responsable: validado_por || 'Admin',
        notas: mensajeHistorial,
        metadata: {
          aprobado,
          motivo_rechazo: aprobado ? null : motivo_rechazo,
          comprobante_url: pedido.constancia_pago_url,
          auto_transicion: aprobado && estadoFinal === ESTADOS.PREPARANDO
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
      
      const { procesarCola } = await import('$lib/server/notificaciones/cola');
      await procesarCola();
      
      console.log(`✅ Notificación ${tipoNotificacion} enviada`);
    } catch (notifError) {
      console.error('⚠️ Error en notificación:', notifError);
    }
    
    const mensaje = aprobado 
      ? `✅ Pago validado. El pedido pasó automáticamente a estado ${estadoFinal.toUpperCase()}.`
      : '❌ Pago rechazado. El cliente debe subir un nuevo comprobante.';
    
    return json({
      success: true,
      data: pedidoActualizado,
      message: mensaje
    });
    
  } catch (error) {
    console.error('Error en validar-pago:', error);
    return json(
      { success: false, error: 'Error interno' },
      { status: 500 }
    );
  }
}

/**
 * Validar que la dirección esté completa
 */
function validarDireccionCompleta(direccion) {
  if (!direccion || typeof direccion !== 'object') return false;
  
  const camposObligatorios = [
    'nombre_destinatario',
    'telefono',
    'calle',
    'numero_exterior',
    'colonia',
    'codigo_postal',
    'ciudad',
    'estado',
    'referencias',
    'tipo_domicilio'
  ];
  
  return camposObligatorios.every(campo => {
    const valor = direccion[campo];
    return valor && String(valor).trim() !== '';
  });
}