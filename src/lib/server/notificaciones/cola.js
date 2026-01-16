// src/lib/server/notificaciones/cola.js
// ✅ NUEVO - Sistema robusto de notificaciones

import { supabaseAdmin } from '$lib/supabaseServer';
import { enviarMensajeWhatsApp } from '$lib/server/whatsapp/servicio';

// ========================================
// CONFIGURACIÓN
// ========================================
const CONFIG = {
  MAX_INTENTOS: 3,
  REINTENTAR_DESPUES_MS: 5 * 60 * 1000, // 5 minutos
  LIMPIAR_EXITOSAS_DESPUES_DIAS: 7,
  LIMPIAR_FALLIDAS_DESPUES_DIAS: 30
};

// ========================================
// ENCOLAR NOTIFICACIÓN
// ========================================
export async function encolarNotificacion({
  pedidoId,
  clienteWhatsapp,
  tipo,
  prioridad = 'media',
  metadata = {},
  programadoPara = null
}) {
  try {
    // Validaciones
    if (!pedidoId || !clienteWhatsapp || !tipo) {
      throw new Error('Parámetros requeridos: pedidoId, clienteWhatsapp, tipo');
    }
    
    // Verificar si ya existe una notificación pendiente del mismo tipo
    const { data: existente } = await supabaseAdmin
      .from('notificaciones_pendientes')
      .select('id')
      .eq('pedido_id', pedidoId)
      .eq('tipo', tipo)
      .eq('estado', 'pendiente')
      .single();
    
    if (existente) {
      console.log(`⚠️ Ya existe notificación ${tipo} para pedido ${pedidoId}`);
      return { success: true, duplicado: true, id: existente.id };
    }
    
    // Insertar notificación
    const { data, error } = await supabaseAdmin
      .from('notificaciones_pendientes')
      .insert({
        pedido_id: pedidoId,
        cliente_whatsapp: clienteWhatsapp,
        tipo,
        prioridad,
        metadata,
        estado: 'pendiente',
        intentos: 0,
        programado_para: programadoPara || new Date().toISOString(),
        created_at: new Date().toISOString()
      })
      .select()
      .single();
    
    if (error) throw error;
    
    console.log(`✅ Notificación ${tipo} encolada para pedido ${pedidoId}`);
    
    return {
      success: true,
      duplicado: false,
      id: data.id
    };
    
  } catch (error) {
    console.error('Error encolando notificación:', error);
    throw error;
  }
}

// ========================================
// PROCESAR COLA
// ========================================
export async function procesarCola() {
  try {
    const ahora = new Date().toISOString();
    
    // Obtener notificaciones pendientes que ya deben enviarse
    const { data: notificaciones, error } = await supabaseAdmin
      .from('notificaciones_pendientes')
      .select(`
        *,
        pedido:pedidos(*)
      `)
      .eq('estado', 'pendiente')
      .lte('programado_para', ahora)
      .lt('intentos', CONFIG.MAX_INTENTOS)
      .order('prioridad', { ascending: false }) // Alta prioridad primero
      .order('created_at', { ascending: true }) // FIFO
      .limit(50); // Procesar en lotes
    
    if (error) throw error;
    
    if (!notificaciones || notificaciones.length === 0) {
      return {
        success: true,
        procesadas: 0,
        exitosas: 0,
        fallidas: 0
      };
    }
    
    console.log(`📤 Procesando ${notificaciones.length} notificaciones...`);
    
    let exitosas = 0;
    let fallidas = 0;
    
    // Procesar cada notificación
    for (const notif of notificaciones) {
      try {
        await procesarNotificacion(notif);
        exitosas++;
      } catch (error) {
        console.error(`Error procesando notificación ${notif.id}:`, error);
        fallidas++;
      }
    }
    
    console.log(`✅ Procesadas: ${exitosas} exitosas, ${fallidas} fallidas`);
    
    return {
      success: true,
      procesadas: notificaciones.length,
      exitosas,
      fallidas
    };
    
  } catch (error) {
    console.error('Error procesando cola:', error);
    throw error;
  }
}

// ========================================
// PROCESAR NOTIFICACIÓN INDIVIDUAL
// ========================================
async function procesarNotificacion(notif) {
  const inicioIntento = Date.now();
  
  try {
    // Obtener configuración
    const { data: config } = await supabaseAdmin
      .from('configuracion')
      .select('*')
      .single();
    
    if (!config) {
      throw new Error('Configuración no encontrada');
    }
    
    // Generar mensaje
    const resultado = await enviarMensajeWhatsApp(
      notif.pedido,
      notif.tipo,
      config,
      notif.metadata
    );
    
    if (!resultado || !resultado.mensaje) {
      throw new Error('No se pudo generar el mensaje');
    }
    
    // Marcar como enviada
    await supabaseAdmin
      .from('notificaciones_pendientes')
      .update({
        estado: 'enviada',
        enviado_en: new Date().toISOString(),
        mensaje_enviado: resultado.mensaje,
        url_whatsapp: resultado.url,
        tiempo_proceso_ms: Date.now() - inicioIntento
      })
      .eq('id', notif.id);
    
    // Registrar en historial de notificaciones
    await supabaseAdmin
      .from('historial_notificaciones')
      .insert({
        notificacion_id: notif.id,
        pedido_id: notif.pedido_id,
        tipo: notif.tipo,
        estado: 'enviada',
        mensaje: resultado.mensaje,
        telefono: notif.cliente_whatsapp,
        metadata: notif.metadata
      });
    
    console.log(`✅ Notificación ${notif.id} enviada (${notif.tipo})`);
    
  } catch (error) {
    console.error(`Error enviando notificación ${notif.id}:`, error);
    
    const nuevoIntentos = notif.intentos + 1;
    
    // Si aún puede reintentar
    if (nuevoIntentos < CONFIG.MAX_INTENTOS) {
      const proximoIntento = new Date(Date.now() + CONFIG.REINTENTAR_DESPUES_MS);
      
      await supabaseAdmin
        .from('notificaciones_pendientes')
        .update({
          intentos: nuevoIntentos,
          ultimo_intento: new Date().toISOString(),
          ultimo_error: error.message,
          programado_para: proximoIntento.toISOString()
        })
        .eq('id', notif.id);
      
      console.log(`🔄 Notificación ${notif.id} reintentará en ${CONFIG.REINTENTAR_DESPUES_MS / 60000} min`);
      
    } else {
      // Máximo de intentos alcanzado
      await supabaseAdmin
        .from('notificaciones_pendientes')
        .update({
          estado: 'fallida',
          intentos: nuevoIntentos,
          ultimo_intento: new Date().toISOString(),
          ultimo_error: error.message,
          fallida_en: new Date().toISOString()
        })
        .eq('id', notif.id);
      
      console.error(`❌ Notificación ${notif.id} falló después de ${nuevoIntentos} intentos`);
    }
    
    throw error;
  }
}

// ========================================
// LIMPIAR NOTIFICACIONES ANTIGUAS
// ========================================
export async function limpiarNotificacionesAntiguas() {
  try {
    const fechaLimiteExitosas = new Date();
    fechaLimiteExitosas.setDate(
      fechaLimiteExitosas.getDate() - CONFIG.LIMPIAR_EXITOSAS_DESPUES_DIAS
    );
    
    const fechaLimiteFallidas = new Date();
    fechaLimiteFallidas.setDate(
      fechaLimiteFallidas.getDate() - CONFIG.LIMPIAR_FALLIDAS_DESPUES_DIAS
    );
    
    // Limpiar exitosas antiguas
    const { data: exitosas } = await supabaseAdmin
      .from('notificaciones_pendientes')
      .delete()
      .eq('estado', 'enviada')
      .lt('enviado_en', fechaLimiteExitosas.toISOString())
      .select('id');
    
    // Limpiar fallidas antiguas
    const { data: fallidas } = await supabaseAdmin
      .from('notificaciones_pendientes')
      .delete()
      .eq('estado', 'fallida')
      .lt('fallida_en', fechaLimiteFallidas.toISOString())
      .select('id');
    
    const totalLimpiadas = (exitosas?.length || 0) + (fallidas?.length || 0);
    
    console.log(`🧹 Limpiadas ${totalLimpiadas} notificaciones antiguas`);
    
    return {
      success: true,
      exitosas: exitosas?.length || 0,
      fallidas: fallidas?.length || 0,
      total: totalLimpiadas
    };
    
  } catch (error) {
    console.error('Error limpiando notificaciones:', error);
    throw error;
  }
}

// ========================================
// REENVIAR NOTIFICACIÓN MANUAL
// ========================================
export async function reenviarNotificacion(notificacionId) {
  try {
    const { data: notif, error } = await supabaseAdmin
      .from('notificaciones_pendientes')
      .select(`
        *,
        pedido:pedidos(*)
      `)
      .eq('id', notificacionId)
      .single();
    
    if (error || !notif) {
      throw new Error('Notificación no encontrada');
    }
    
    // Resetear y reprocesar
    await supabaseAdmin
      .from('notificaciones_pendientes')
      .update({
        estado: 'pendiente',
        intentos: 0,
        ultimo_error: null,
        programado_para: new Date().toISOString()
      })
      .eq('id', notificacionId);
    
    await procesarNotificacion(notif);
    
    return { success: true, message: 'Notificación reenviada' };
    
  } catch (error) {
    console.error('Error reenviando notificación:', error);
    throw error;
  }
}