// src/lib/server/notificaciones/cola.js
// ✅ COLA DE NOTIFICACIONES USANDO notificaciones_pendientes

import { supabaseAdmin } from '$lib/supabaseServer';
import { generarMensajeWhatsApp } from './mensajes';

/**
 * ✅ Encola una notificación para envío posterior
 */
export async function encolarNotificacion({ 
  pedidoId, 
  clienteWhatsapp, 
  tipo, 
  prioridad = 'media', 
  metadata = null,
  programadoPara = null 
}) {
  try {
    const { error } = await supabaseAdmin
      .from('notificaciones_pendientes')
      .insert({
        pedido_id: pedidoId,
        cliente_whatsapp: clienteWhatsapp,
        tipo,
        prioridad,
        metadata,
        estado: 'pendiente',
        intentos: 0,
        programado_para: programadoPara || new Date().toISOString()
      });
    
    if (error) {
      console.error('Error encolando notificación:', error);
      throw error;
    }
    
    console.log(`📬 Notificación ${tipo} encolada para pedido ${pedidoId}`);
    return { success: true };
    
  } catch (error) {
    console.error('Error en encolarNotificacion:', error);
    return { success: false, error: error.message };
  }
}

/**
 * ✅ Procesa notificaciones pendientes en cola
 */
export async function procesarCola() {
  try {
    console.log('🔄 Procesando cola de notificaciones...');
    
    // Obtener notificaciones pendientes
    const { data: notificaciones, error } = await supabaseAdmin
      .from('notificaciones_pendientes')
      .select('*')
      .eq('estado', 'pendiente')
      .lte('programado_para', new Date().toISOString()) // Solo las que ya deben enviarse
      .lt('intentos', 3) // Máximo 3 intentos
      .order('prioridad', { ascending: false })
      .order('created_at', { ascending: true })
      .limit(10);
    
    if (error) {
      console.error('Error obteniendo notificaciones:', error);
      return { success: false, error: error.message };
    }
    
    if (!notificaciones || notificaciones.length === 0) {
      return { success: true, procesadas: 0 };
    }
    
    console.log(`📨 Procesando ${notificaciones.length} notificaciones...`);
    
    let exitosas = 0;
    let fallidas = 0;
    
    // Procesar cada notificación
    for (const notif of notificaciones) {
      try {
        const inicioTiempo = Date.now();
        
        // Obtener pedido completo
        const { data: pedido } = await supabaseAdmin
          .from('pedidos')
          .select('*, items:pedidos_items(*)')
          .eq('id', notif.pedido_id)
          .single();
        
        if (!pedido) {
          await marcarNotificacionFallida(notif.id, 'Pedido no encontrado');
          fallidas++;
          continue;
        }
        
        // Obtener configuración
        const { data: config } = await supabaseAdmin
          .from('configuracion')
          .select('*')
          .single();
        
        // Generar mensaje y URL de WhatsApp
        const resultado = generarMensajeWhatsApp(
          pedido,
          notif.tipo,
          config,
          notif.metadata
        );
        
        if (!resultado || !resultado.url) {
          await marcarNotificacionFallida(notif.id, 'Error generando mensaje');
          fallidas++;
          continue;
        }
        
        const tiempoProceso = Date.now() - inicioTiempo;
        
        // Marcar como enviada
        await supabaseAdmin
          .from('notificaciones_pendientes')
          .update({
            estado: 'enviada',
            url_whatsapp: resultado.url,
            mensaje_enviado: resultado.mensaje,
            enviado_en: new Date().toISOString(),
            tiempo_proceso_ms: tiempoProceso
          })
          .eq('id', notif.id);
        
        exitosas++;
        console.log(`✅ Notificación ${notif.tipo} procesada para pedido ${pedido.numero_pedido}`);
        
      } catch (errorNotif) {
        console.error(`❌ Error procesando notificación ${notif.id}:`, errorNotif);
        await incrementarIntentos(notif.id, errorNotif.message);
        fallidas++;
      }
    }
    
    console.log(`✅ Procesamiento completado: ${exitosas} exitosas, ${fallidas} fallidas`);
    
    return {
      success: true,
      procesadas: exitosas + fallidas,
      exitosas,
      fallidas
    };
    
  } catch (error) {
    console.error('Error procesando cola:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Marcar notificación como fallida
 */
async function marcarNotificacionFallida(notifId, motivo) {
  await supabaseAdmin
    .from('notificaciones_pendientes')
    .update({
      estado: 'fallida',
      ultimo_error: motivo,
      fallida_en: new Date().toISOString()
    })
    .eq('id', notifId);
}

/**
 * Incrementar intentos de una notificación
 */
async function incrementarIntentos(notifId, errorMsg) {
  const { data: notif } = await supabaseAdmin
    .from('notificaciones_pendientes')
    .select('intentos')
    .eq('id', notifId)
    .single();
  
  if (!notif) return;
  
  const nuevoIntentos = notif.intentos + 1;
  const nuevoEstado = nuevoIntentos >= 3 ? 'fallida' : 'pendiente';
  
  await supabaseAdmin
    .from('notificaciones_pendientes')
    .update({
      intentos: nuevoIntentos,
      estado: nuevoEstado,
      ultimo_error: errorMsg,
      ultimo_intento: new Date().toISOString(),
      ...(nuevoEstado === 'fallida' && { fallida_en: new Date().toISOString() })
    })
    .eq('id', notifId);
}

/**
 * Limpiar notificaciones antiguas (más de 7 días)
 */
export async function limpiarNotificacionesAntiguas() {
  try {
    const fechaLimite = new Date();
    fechaLimite.setDate(fechaLimite.getDate() - 7);
    
    await supabaseAdmin
      .from('notificaciones_pendientes')
      .delete()
      .eq('estado', 'enviada')
      .lt('enviado_en', fechaLimite.toISOString());
    
    console.log('🗑️ Notificaciones antiguas limpiadas');
    return { success: true };
    
  } catch (error) {
    console.error('Error limpiando notificaciones:', error);
    return { success: false, error: error.message };
  }
}