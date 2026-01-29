// src/lib/server/notificaciones/procesador.js
// ✅ PROCESADOR DE COLA DE NOTIFICACIONES WHATSAPP

import { supabaseAdmin } from '$lib/supabaseServer';
import { generarMensajeWhatsApp } from './mensajes';

/**
 * Procesa notificaciones pendientes en cola
 * @returns {Promise<Object>} Resultado del procesamiento
 */
export async function procesarColaNot() {
  try {
    console.log('🔄 Iniciando procesamiento de notificaciones...');
    
    // Obtener notificaciones pendientes (máximo 10 por lote)
    const { data: notificaciones, error } = await supabaseAdmin
      .from('notificaciones_pendientes')
      .select('*')
      .eq('estado', 'pendiente')
      .lt('intentos', 3) // Máximo 3 intentos
      .order('prioridad', { ascending: false }) // Prioridad alta primero
      .order('created_at', { ascending: true })
      .limit(10);
    
    if (error) {
      console.error('❌ Error obteniendo notificaciones:', error);
      return { success: false, error: error.message };
    }
    
    if (!notificaciones || notificaciones.length === 0) {
      console.log('✅ No hay notificaciones pendientes');
      return { success: true, procesadas: 0 };
    }
    
    console.log(`📲 Procesando ${notificaciones.length} notificaciones...`);
    
    let exitosas = 0;
    let fallidas = 0;
    
    // Procesar cada notificación
    for (const notif of notificaciones) {
      try {
        // Obtener pedido completo
        const { data: pedido } = await supabaseAdmin
          .from('pedidos')
          .select(`
            *,
            items:pedidos_items(*)
          `)
          .eq('id', notif.pedido_id)
          .single();
        
        if (!pedido) {
      await marcarNotificacionFallida(notif.id, 'Pedido no encontrado');
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
      continue;
        }
        
        // Marcar como enviada
        await supabaseAdmin
          .from('notificaciones_pendientes')
          .update({
            estado: 'enviada',
            url_generada: resultado.url,
            mensaje_generado: resultado.mensaje,
            enviado_at: new Date().toISOString(),
            //whatsapp_url: resultado.url 
          })
          .eq('id', notif.id);
        
        // Abrir WhatsApp automáticamente si es navegador
        if (typeof window !== 'undefined') {
          window.open(resultado.url, '_blank');
        }
        
        exitosas++;
            console.log(`✅ Notificación ${notif.id} procesada: ${notif.tipo} → ${resultado.url}`);
        
      } catch (error) {
        console.error(`❌ Error procesando notificación ${notif.id}:`, error);
        
        // Incrementar intentos
        const nuevoIntentos = notif.intentos + 1;
        const nuevoEstado = nuevoIntentos >= 3 ? 'fallida' : 'pendiente';
        
        await supabaseAdmin
          .from('notificaciones_pendientes')
          .update({
            intentos: nuevoIntentos,
            estado: nuevoEstado,
            ultimo_error: error.message,
            ultimo_intento_at: new Date().toISOString()
          })
          .eq('id', notif.id);
        
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
    console.error('❌ Error en procesarColaNot:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Limpia notificaciones antiguas
 */
export async function limpiarNotificacionesAntiguas() {
  try {
    const fechaLimite = new Date();
    fechaLimite.setDate(fechaLimite.getDate() - 7); // 7 días
    
    const { error } = await supabaseAdmin
      .from('notificaciones_pendientes')
      .delete()
      .eq('estado', 'enviada')
      .lt('enviado_at', fechaLimite.toISOString());
    
    if (error) throw error;
    
    console.log('🗑️ Notificaciones antiguas limpiadas');
    return { success: true };
    
  } catch (error) {
    console.error('Error limpiando notificaciones:', error);
    return { success: false, error: error.message };
  }
}