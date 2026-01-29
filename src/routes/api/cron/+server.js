// src/routes/api/cron/+server.js
// ✅ VERSIÓN MEJORADA con procesamiento de notificaciones y auto-finalización corregida

import { json } from '@sveltejs/kit';
import { supabaseAdmin } from '$lib/supabaseServer';
import { ESTADOS } from '$lib/server/pedidos/estados';
import { 
  procesarCola, 
  limpiarNotificacionesAntiguas 
} from '$lib/server/notificaciones/cola';

const CRON_SECRET = process.env.CRON_SECRET || 'dev-secret-change-in-production';

// ========================================
// MEJORADO: Auto-finalizar pedidos
// ========================================
async function autoFinalizarPedidos() {
  try {
    // Fecha límite: 24h después de confirmación del cliente
    const fechaLimite = new Date();
    fechaLimite.setHours(fechaLimite.getHours() - 24);
    
    // Buscar pedidos en estado RECIBIDO que ya pasaron 24h
    const { data: pedidosFinalizables, error } = await supabaseAdmin
      .from('pedidos')
      .select('id, numero_pedido, cliente_nombre, fecha_recibido')
      .eq('estado', ESTADOS.RECIBIDO) // ✅ Buscar RECIBIDO, no ENVIADO
      .lt('fecha_recibido', fechaLimite.toISOString())
      .not('fecha_recibido', 'is', null);
    
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
    
    console.log(`🔄 Auto-finalizando ${pedidosFinalizables.length} pedidos...`);
    
    const pedidoIds = pedidosFinalizables.map(p => p.id);
    
    // Actualizar a ENTREGADO
    const { error: updateError } = await supabaseAdmin
      .from('pedidos')
      .update({
        estado: ESTADOS.ENTREGADO,
        fecha_entregado: new Date().toISOString()
      })
      .in('id', pedidoIds);
    
    if (updateError) {
      console.error('Error finalizando pedidos:', updateError);
      return { success: false, error: updateError.message };
    }
    
    // Registrar en historial
    for (const pedido of pedidosFinalizables) {
      await supabaseAdmin
        .from('pedidos_historial')
        .insert({
          pedido_id: pedido.id,
          estado_anterior: ESTADOS.RECIBIDO,
          estado_nuevo: ESTADOS.ENTREGADO,
          tipo_usuario: 'sistema',
          notas: `Auto-finalizado: 24h desde confirmación del cliente (${pedido.fecha_recibido})`,
          metadata: {
            razon: 'auto_finalizacion',
            horas_desde_recepcion: 24
          }
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

// ========================================
// NUEVO: Recordatorios de pago pendiente
// ========================================
async function recordatoriosPagoPendiente() {
  try {
    // Pedidos confirmados sin comprobante después de 24h
    const fechaLimite = new Date();
    fechaLimite.setHours(fechaLimite.getHours() - 24);
    
    const { data: pedidosPendientes, error } = await supabaseAdmin
      .from('pedidos')
      .select('id, numero_pedido, cliente_nombre, cliente_whatsapp, created_at')
      .eq('estado', ESTADOS.CONFIRMADO)
      .eq('estado_pago', 'sin_pago')
      .is('constancia_pago_url', null)
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
    
    // Encolar recordatorios
    for (const pedido of pedidosPendientes) {
      try {
        const { encolarNotificacion } = await import('$lib/server/notificaciones/cola');
        
        await encolarNotificacion({
          pedidoId: pedido.id,
          clienteWhatsapp: pedido.cliente_whatsapp,
          tipo: 'recordatorio_pago',
          prioridad: 'media',
          metadata: {
            dias_pendiente: Math.floor(
              (Date.now() - new Date(pedido.created_at)) / (1000 * 60 * 60 * 24)
            )
          }
        });
      } catch (notifError) {
        console.error(`Error encolando recordatorio para ${pedido.id}:`, notifError);
      }
    }
    
    return {
      success: true,
      message: `${pedidosPendientes.length} recordatorios encolados`,
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

// ========================================
// NUEVO: Cancelar pedidos abandonados
// ========================================
async function cancelarPedidosAbandonados() {
  try {
    // Pedidos en PENDIENTE sin actividad por más de 7 días
    const fechaLimite = new Date();
    fechaLimite.setDate(fechaLimite.getDate() - 7);
    
    const { data: pedidosAbandonados, error } = await supabaseAdmin
      .from('pedidos')
      .select('id, numero_pedido, cliente_nombre')
      .eq('estado', ESTADOS.PENDIENTE)
      .lt('created_at', fechaLimite.toISOString());
    
    if (error || !pedidosAbandonados || pedidosAbandonados.length === 0) {
      return { success: true, count: 0 };
    }
    
    const pedidoIds = pedidosAbandonados.map(p => p.id);
    
    // Cancelar automáticamente
    await supabaseAdmin
      .from('pedidos')
      .update({
        estado: ESTADOS.CANCELADO,
        motivo_cancelacion: 'Pedido abandonado - Sin actividad por más de 7 días',
        editable: false
      })
      .in('id', pedidoIds);
    
    // Registrar en historial
    for (const pedido of pedidosAbandonados) {
      await supabaseAdmin
        .from('pedidos_historial')
        .insert({
          pedido_id: pedido.id,
          estado_anterior: ESTADOS.PENDIENTE,
          estado_nuevo: ESTADOS.CANCELADO,
          tipo_usuario: 'sistema',
          notas: 'Pedido cancelado automáticamente por inactividad (7 días)'
        });
    }
    
    console.log(`🗑️ ${pedidosAbandonados.length} pedidos abandonados cancelados`);
    
    return {
      success: true,
      count: pedidosAbandonados.length,
      pedidos: pedidosAbandonados
    };
    
  } catch (error) {
    console.error('Error cancelando abandonados:', error);
    return { success: false, error: error.message };
  }
}

// ========================================
// POST - Ejecutar tareas programadas
// ========================================
export async function POST({ request }) {
  try {
    const authHeader = request.headers.get('authorization');
    
    if (authHeader !== `Bearer ${CRON_SECRET}`) {
      return json(
        { success: false, error: 'No autorizado' },
        { status: 401 }
      );
    }
    
    const { task } = await request.json();
    
    let result;
    
    switch (task) {
      case 'auto-finalizar':
        result = await autoFinalizarPedidos();
        break;
        
      case 'procesar-notificaciones':
        result = await procesarCola();
        break;
        
      case 'limpiar-notificaciones':
        result = await limpiarNotificacionesAntiguas();
        break;
        
      case 'recordatorios-pago':
        result = await recordatoriosPagoPendiente();
        break;
        
      case 'cancelar-abandonados':
        result = await cancelarPedidosAbandonados();
        break;
      case 'recordatorios-rechazo':
        result = await recordatoriosPagoRechazado();
        break;
        
      case 'all':
        // Ejecutar todas las tareas en paralelo
        const [
          finalizados,
          notificaciones,
          limpiezaNotif,
          recordatorios,
          abandonados
        ] = await Promise.allSettled([
          autoFinalizarPedidos(),
          procesarCola(),
          limpiarNotificacionesAntiguas(),
          recordatoriosPagoPendiente(),
          cancelarPedidosAbandonados()
        ]);
        
        result = {
          success: true,
          tasks: {
            autoFinalizar: finalizados.status === 'fulfilled' ? finalizados.value : { error: finalizados.reason },
            procesarNotificaciones: notificaciones.status === 'fulfilled' ? notificaciones.value : { error: notificaciones.reason },
            limpiarNotificaciones: limpiezaNotif.status === 'fulfilled' ? limpiezaNotif.value : { error: limpiezaNotif.reason },
            recordatoriosPago: recordatorios.status === 'fulfilled' ? recordatorios.value : { error: recordatorios.reason },
            cancelarAbandonados: abandonados.status === 'fulfilled' ? abandonados.value : { error: abandonados.reason }
          },
          timestamp: new Date().toISOString()
        };
        break;
        
      default:
        return json(
          { 
            success: false, 
            error: 'Tarea no reconocida',
            availableTasks: [
              'auto-finalizar',
              'procesar-notificaciones',
              'limpiar-notificaciones',
              'recordatorios-pago',
              'cancelar-abandonados',
              'all'
            ]
          },
          { status: 400 }
        );
    }
    
    return json(result);
    
  } catch (error) {
    console.error('Error en cron:', error);
    return json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}

// ========================================
// GET - Documentación
// ========================================
export async function GET({ url }) {
  const secret = url.searchParams.get('secret');
  
  if (secret !== CRON_SECRET) {
    return json(
      { success: false, error: 'No autorizado' },
      { status: 401 }
    );
  }
  
  return json({
    success: true,
    message: 'Endpoint de cron activo',
    availableTasks: [
      {
        name: 'auto-finalizar',
        description: 'Finaliza pedidos en estado RECIBIDO después de 24h',
        frequency: 'Cada 6 horas'
      },
      {
        name: 'procesar-notificaciones',
        description: 'Procesa cola de notificaciones WhatsApp pendientes',
        frequency: 'Cada 5 minutos'
      },
      {
        name: 'limpiar-notificaciones',
        description: 'Limpia notificaciones enviadas (>7 días) y fallidas (>30 días)',
        frequency: 'Diario'
      },
      {
        name: 'recordatorios-pago',
        description: 'Envía recordatorios de pago a pedidos confirmados sin comprobante',
        frequency: 'Cada 12 horas'
      },
      {
        name: 'cancelar-abandonados',
        description: 'Cancela pedidos en PENDIENTE sin actividad por 7 días',
        frequency: 'Diario'
      },
      {
        name: 'all',
        description: 'Ejecuta todas las tareas en paralelo',
        frequency: 'Manual o cada hora'
      }
    ],
    usage: {
      method: 'POST',
      headers: {
        'Authorization': 'Bearer YOUR_CRON_SECRET',
        'Content-Type': 'application/json'
      },
      body: {
        task: 'auto-finalizar | procesar-notificaciones | ... | all'
      }
    },
    setupVercel: {
      'vercel.json': {
        crons: [
          {
            path: '/api/cron',
            schedule: '*/5 * * * *'
          }
        ]
      },
      note: 'Configurar CRON_SECRET en variables de entorno'
    }
  });
}

async function recordatoriosPagoRechazado() {
  try {
    const ahora = new Date();
    
    // ✅ RECORDATORIO 12H
    const fecha12h = new Date(ahora.getTime() - 12 * 60 * 60 * 1000);
    
    const { data: pedidos12h } = await supabaseAdmin
      .from('pedidos')
      .select('id, numero_pedido, cliente_nombre, cliente_whatsapp, fecha_confirmado')
      .eq('estado', 'confirmado')
      .eq('estado_pago', 'rechazado')
      .is('constancia_pago_url', null)
      .lt('fecha_confirmado', fecha12h.toISOString())
      .gte('fecha_confirmado', new Date(ahora.getTime() - 13 * 60 * 60 * 1000).toISOString());
    
    for (const pedido of (pedidos12h || [])) {
      await encolarNotificacion({
        pedidoId: pedido.id,
        clienteWhatsapp: pedido.cliente_whatsapp,
        tipo: 'recordatorio_pago',
        prioridad: 'media',
        metadata: {
          horas_transcurridas: 12,
          advertencia: 'Si no envías comprobante en 24h, tu pedido será cancelado'
        }
      });
    }
    
    // ✅ CANCELACIÓN AUTOMÁTICA 36H
    const fecha36h = new Date(ahora.getTime() - 36 * 60 * 60 * 1000);
    
    const { data: pedidos36h } = await supabaseAdmin
      .from('pedidos')
      .select('id, numero_pedido, cliente_nombre, cliente_whatsapp')
      .eq('estado', 'confirmado')
      .eq('estado_pago', 'rechazado')
      .is('constancia_pago_url', null)
      .lt('fecha_confirmado', fecha36h.toISOString());
    
    for (const pedido of (pedidos36h || [])) {
      // Cancelar automáticamente
      await supabaseAdmin
        .from('pedidos')
        .update({
          estado: 'cancelado',
          motivo_cancelacion: 'Cancelado automáticamente: Sin comprobante tras 36h de rechazo',
          editable: false
        })
        .eq('id', pedido.id);
      
      // Registrar historial
      await supabaseAdmin
        .from('pedidos_historial')
        .insert({
          pedido_id: pedido.id,
          estado_anterior: 'confirmado',
          estado_nuevo: 'cancelado',
          tipo_usuario: 'sistema',
          notas: 'Cancelación automática por timeout 36h sin comprobante tras rechazo'
        });
      
      // Notificar cliente
      await encolarNotificacion({
        pedidoId: pedido.id,
        clienteWhatsapp: pedido.cliente_whatsapp,
        tipo: 'pedido_cancelado',
        prioridad: 'alta',
        metadata: {
          motivo: 'No se recibió nuevo comprobante tras 36 horas del rechazo'
        }
      });
    }
    
    return {
      success: true,
      recordatorios_12h: pedidos12h?.length || 0,
      cancelaciones_36h: pedidos36h?.length || 0
    };
    
  } catch (error) {
    console.error('Error en recordatorios pago rechazado:', error);
    return { success: false, error: error.message };
  }
}
