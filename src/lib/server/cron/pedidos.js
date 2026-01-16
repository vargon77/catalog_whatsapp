// src/lib/server/cron/pedidos.js
import { supabaseAdmin } from '$lib/supabaseServer';
import { ESTADOS } from '$lib/server/pedidos/estados';

export async function autoFinalizarPedidos() {
  try {
    const fechaLimite = new Date();
    fechaLimite.setDate(fechaLimite.getDate() - 7);
    
    const { data: pedidosFinalizables, error } = await supabaseAdmin
      .from('pedidos')
      .select('id, numero_pedido, cliente_nombre, fecha_enviado')
      .eq('estado', ESTADOS.ENVIADO)
      .lt('fecha_enviado', fechaLimite.toISOString())
      .is('fecha_recibido', null);
    
    if (error) {
      console.error('Error obteniendo pedidos finalizables:', error);
      return { success: false, error: error.message };
    }
    
    if (!pedidosFinalizables || pedidosFinalizables.length === 0) {
      return { 
        success: true, 
        message: 'No hay pedidos para finalizar',
        count: 0
      };
    }
    
    const pedidoIds = pedidosFinalizables.map(p => p.id);
    
    const { error: updateError } = await supabaseAdmin
      .from('pedidos')
      .update({
        estado: ESTADOS.ENTREGADO,
        fecha_recibido: new Date().toISOString()
      })
      .in('id', pedidoIds);
    
    if (updateError) {
      console.error('Error finalizando pedidos:', updateError);
      return { success: false, error: updateError.message };
    }
    
    for (const pedido of pedidosFinalizables) {
      await supabaseAdmin
        .from('pedidos_historial')
        .insert({
          pedido_id: pedido.id,
          estado_anterior: ESTADOS.ENVIADO,
          estado_nuevo: ESTADOS.ENTREGADO,
          tipo_usuario: 'sistema',
          notas: `Auto-finalizado: 7 días desde envío (${pedido.fecha_enviado})`
        });
    }
    
    console.log(`✅ ${pedidosFinalizables.length} pedidos auto-finalizados`);
    
    return {
      success: true,
      message: `${pedidosFinalizables.length} pedidos finalizados automáticamente`,
      count: pedidosFinalizables.length,
      pedidos: pedidosFinalizables.map(p => ({
        id: p.id,
        numero: p.numero_pedido,
        cliente: p.cliente_nombre
      }))
    };
    
  } catch (error) {
    console.error('Error en autoFinalizarPedidos:', error);
    return { 
      success: false, 
      error: error.message 
    };
  }
}

export async function limpiarHistorialAntiguo() {
  try {
    const fechaLimite = new Date();
    fechaLimite.setMonth(fechaLimite.getMonth() - 6);
    
    const { data, error } = await supabaseAdmin
      .from('pedidos_historial')
      .delete()
      .lt('created_at', fechaLimite.toISOString())
      .select('id');
    
    if (error) {
      console.error('Error limpiando historial:', error);
      return { success: false, error: error.message };
    }
    
    console.log(`🧹 ${data?.length || 0} registros de historial eliminados`);
    
    return {
      success: true,
      message: `${data?.length || 0} registros antiguos eliminados`,
      count: data?.length || 0
    };
    
  } catch (error) {
    console.error('Error en limpiarHistorialAntiguo:', error);
    return { success: false, error: error.message };
  }
}

export async function recordatoriosPagoPendiente() {
  try {
    const fechaLimite = new Date();
    fechaLimite.setHours(fechaLimite.getHours() - 48);
    
    const { data: pedidosPendientes, error } = await supabaseAdmin
      .from('pedidos')
      .select('id, numero_pedido, cliente_nombre, cliente_whatsapp, created_at')
      .eq('estado', ESTADOS.CONFIRMADO)
      .eq('estado_pago', 'sin_pago')
      .lt('created_at', fechaLimite.toISOString());
    
    if (error) {
      console.error('Error obteniendo pedidos pendientes:', error);
      return { success: false, error: error.message };
    }
    
    if (!pedidosPendientes || pedidosPendientes.length === 0) {
      return {
        success: true,
        message: 'No hay pedidos con pago pendiente',
        count: 0
      };
    }
    
    console.log(`📲 ${pedidosPendientes.length} pedidos requieren seguimiento de pago`);
    
    return {
      success: true,
      message: `${pedidosPendientes.length} pedidos pendientes de pago`,
      count: pedidosPendientes.length,
      pedidos: pedidosPendientes.map(p => ({
        id: p.id,
        numero: p.numero_pedido,
        cliente: p.cliente_nombre,
        whatsapp: p.cliente_whatsapp,
        dias: Math.floor((Date.now() - new Date(p.created_at)) / (1000 * 60 * 60 * 24))
      }))
    };
    
  } catch (error) {
    console.error('Error en recordatoriosPagoPendiente:', error);
    return { success: false, error: error.message };
  }
}