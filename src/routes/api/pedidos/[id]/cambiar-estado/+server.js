// src/routes/api/pedidos/[id]/cambiar-estado/+server.js
import { json } from '@sveltejs/kit';
import { supabaseAdmin } from '$lib/supabaseServer';
import { ESTADOS, validarTransicionConContexto } from '$lib/server/pedidos/estados';
import { encolarNotificacion } from '$lib/server/notificaciones/cola';

export async function POST({ params, request }) {
  const { id } = params;

  try {
    const body = await request.json();
    const { estado: estadoNuevo, notas, usuario } = body;

    // Validaciones
    if (!estadoNuevo) {
      return json({ success: false, error: 'El campo "estado" es requerido' }, { status: 400 });
    }

    if (!Object.values(ESTADOS).includes(estadoNuevo)) {
      return json({ 
        success: false, 
        error: 'Estado inválido',
        estados_validos: Object.values(ESTADOS)
      }, { status: 400 });
    }

    // Obtener pedido
    const { data: pedido, error } = await supabaseAdmin
      .from('pedidos')
      .select('*')
      .eq('id', id)
      .single();

    if (error || !pedido) {
      return json({ success: false, error: 'Pedido no encontrado' }, { status: 404 });
    }

    if (pedido.estado === estadoNuevo) {
      return json({ success: false, error: 'El pedido ya está en ese estado' }, { status: 400 });
    }

    // Validar transición
    const validacion = validarTransicionConContexto(pedido, estadoNuevo);
    if (!validacion.valido) {
      return json({ 
        success: false, 
        error: validacion.mensaje,
        estado_actual: pedido.estado,
        estado_solicitado: estadoNuevo
      }, { status: 400 });
    }

    // Preparar datos de actualización
    const updateData = {
      estado: estadoNuevo
    };

    // Actualizar fechas según el estado
    switch (estadoNuevo) {
      case ESTADOS.CONFIRMADO:
        updateData.fecha_confirmado = new Date().toISOString();
        break;
      case ESTADOS.PAGADO:
        updateData.fecha_pagado = new Date().toISOString();
        break;
      //case ESTADOS.PREPARANDO:
      //  updateData.fecha_preparando = new Date().toISOString();
      //  break;
      case ESTADOS.ENVIADO:
        updateData.fecha_enviado = new Date().toISOString();
        break;
      case ESTADOS.RECIBIDO:
        updateData.fecha_recibido = new Date().toISOString();
        break;
      case ESTADOS.ENTREGADO:
        updateData.fecha_entregado = new Date().toISOString();
        break;
      case ESTADOS.CANCELADO:
        updateData.motivo_cancelacion = notas || 'Cancelado por administrador';
        updateData.editable = false;
        break;
    }

    // Actualizar pedido
    const { data: pedidoActualizado, error: errorUpdate } = await supabaseAdmin
      .from('pedidos')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (errorUpdate) {
      console.error('Error actualizando estado:', errorUpdate);
      return json({ success: false, error: 'Error al cambiar estado' }, { status: 500 });
    }

    // Registrar en historial
    await supabaseAdmin.from('pedidos_historial').insert({
      pedido_id: id,
      estado_anterior: pedido.estado,
      estado_nuevo: estadoNuevo,
      tipo_usuario: 'vendedor',
      usuario_responsable: usuario || 'Admin',
      notas: notas?.trim() || `Estado cambiado a ${estadoNuevo}`,
      metadata: {
        cambio_manual: true,
        timestamp: new Date().toISOString()
      }
    });

    // ✅ NOTIFICACIONES - Mapeo de estados a tipos
    const MAPA_NOTIFICACIONES = {
      'confirmado': 'pedido_confirmado',
      'preparando': 'pedido_preparando',
      'enviado': 'pedido_enviado',
      'cancelado': 'pedido_cancelado'
    };

    const tipoNotificacion = MAPA_NOTIFICACIONES[estadoNuevo];
    
    if (tipoNotificacion) {
      try {
        await encolarNotificacion({
          pedidoId: id,
          clienteWhatsapp: pedido.cliente_whatsapp,
          tipo: tipoNotificacion,
          prioridad: estadoNuevo === ESTADOS.CANCELADO ? 'alta' : 'media',
          metadata: { 
            notas: notas || null,
            motivo: estadoNuevo === ESTADOS.CANCELADO ? (notas || 'Cancelado por administrador') : null
          }
        });

        // 🔥 Procesar cola inmediatamente
        const { procesarCola } = await import('$lib/server/notificaciones/cola');
        await procesarCola();
        
        console.log(`✅ Notificación ${tipoNotificacion} enviada para pedido ${pedidoActualizado.numero_pedido}`);
      } catch (notifError) {
        console.error('⚠️ Error en notificación:', notifError);
        // No fallar el cambio de estado por error de notificación
      }
    }

    return json({
      success: true,
      data: pedidoActualizado,
      message: `Estado cambiado a ${estadoNuevo}`,
      notificacion_enviada: !!tipoNotificacion
    });

  } catch (error) {
    console.error('Error en cambiar-estado:', error);
    return json({ 
      success: false, 
      error: 'Error interno',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    }, { status: 500 });
  }
}