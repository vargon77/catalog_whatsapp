// src/lib/server/notificaciones/cola.js
import { supabaseAdmin } from '$lib/supabaseServer';
import { generarMensajeWhatsApp } from '$lib/server/whatsapp/mensajes';

/**
 * Encola una notificación para envío posterior
 */
export async function encolarNotificacion({ pedidoId, clienteWhatsapp, tipo, prioridad = 'media', metadata = null }) {
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
        programado_para: new Date().toISOString()
      });
    
    if (error) throw error;
    return { success: true };
  } catch (error) {
    console.error('Error encolando notificación:', error);
    throw error;
  }
}

/**
 * 🔥 FUNCIÓN CRÍTICA: Procesa notificaciones pendientes
 */
export async function procesarCola() {
  try {
    // 1. Obtener notificaciones pendientes
    const { data: notificaciones, error } = await supabaseAdmin
      .from('notificaciones_pendientes')
      .select('*')
      .eq('estado', 'pendiente')
      .order('prioridad', { ascending: false })
      .order('created_at', { ascending: true })
      .limit(10);
    
    if (error) throw error;
    if (!notificaciones || notificaciones.length === 0) {
      return { success: true, procesados: 0 };
    }
    
    console.log(`📨 Procesando ${notificaciones.length} notificaciones...`);
    
    // 2. Procesar cada notificación
    for (const notif of notificaciones) {
      try {
        // 2.1 Obtener datos del pedido
        const { data: pedido } = await supabaseAdmin
          .from('pedidos')
          .select('*, items:pedidos_items(*)')
          .eq('id', notif.pedido_id)
          .single();
        
        if (!pedido) {
          await marcarNotificacionFallida(notif.id, 'Pedido no encontrado');
          continue;
        }
        
        // 2.2 Generar mensaje WhatsApp
        const mensajeData = await generarMensajeWhatsApp(pedido, notif.tipo, notif.metadata);
        
        if (!mensajeData || !mensajeData.url) {
          await marcarNotificacionFallida(notif.id, 'Error generando mensaje');
          continue;
        }
        
        // 2.3 "Enviar" (abrir URL de WhatsApp)
        // En servidor no podemos abrir URLs, pero registramos como enviado
        await supabaseAdmin
          .from('notificaciones_pendientes')
          .update({
            estado: 'enviada',
            enviado_at: new Date().toISOString(),
            mensaje_generado: mensajeData.mensaje,
            whatsapp_url: mensajeData.url
          })
          .eq('id', notif.id);
        
        console.log(`✅ Notificación ${notif.id} procesada para pedido ${pedido.numero_pedido}`);
        
      } catch (errorNotif) {
        console.error(`❌ Error procesando notificación ${notif.id}:`, errorNotif);
        await incrementarIntentos(notif.id);
      }
    }
    
    return { success: true, procesados: notificaciones.length };
    
  } catch (error) {
    console.error('Error procesando cola:', error);
    throw error;
  }
}

async function marcarNotificacionFallida(notifId, motivo) {
  await supabaseAdmin
    .from('notificaciones_pendientes')
    .update({
      estado: 'fallida',
      error_mensaje: motivo
    })
    .eq('id', notifId);
}

async function incrementarIntentos(notifId) {
  await supabaseAdmin
    .rpc('incrementar_intentos_notificacion', { notif_id: notifId });
}

export async function limpiarNotificacionesAntiguas() {
  const fechaLimite = new Date();
  fechaLimite.setDate(fechaLimite.getDate() - 7);
  
  await supabaseAdmin
    .from('notificaciones_pendientes')
    .delete()
    .eq('estado', 'enviada')
    .lt('enviado_at', fechaLimite.toISOString());
}