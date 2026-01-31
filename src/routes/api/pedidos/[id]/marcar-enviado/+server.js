// src/routes/api/pedidos/[id]/marcar-enviado/+server.js
// ✅ VERSIÓN CON VALIDACIÓN DE GUÍA OBLIGATORIA

import { json } from '@sveltejs/kit';
import { supabaseAdmin } from '$lib/supabaseServer';
import { ESTADOS, validarTransicionConContexto } from '$lib/server/pedidos/estados';
import { encolarNotificacion } from '$lib/server/notificaciones/cola';

export async function POST({ params, request }) {
  const { id } = params;

  try {
    const body = await request.json();
    const { guia_envio, es_entrega_local } = body;

    const { data: pedido, error } = await supabaseAdmin
      .from('pedidos')
      .select('*')
      .eq('id', id)
      .single();

    if (error || !pedido) {
      return json({ success: false, error: 'Pedido no encontrado' }, { status: 404 });
    }

    const validacion = validarTransicionConContexto(pedido, ESTADOS.ENVIADO);
    if (!validacion.valido) {
      return json({ success: false, error: validacion.mensaje }, { status: 400 });
    }

    // ✅ VALIDACIÓN: Si requiere envío Y no es local, GUÍA OBLIGATORIA
    if (pedido.envio && !es_entrega_local) {
      if (!guia_envio || !guia_envio.paqueteria || !guia_envio.numero_guia) {
        return json(
          { 
            success: false, 
            error: 'Datos de guía obligatorios: paquetería y número de guía' 
          },
          { status: 400 }
        );
      }
    }

    const updateData = {
      estado: ESTADOS.ENVIADO,
      fecha_enviado: new Date().toISOString()
    };

    // Si hay guía, guardarla
    if (guia_envio) {
      updateData.guia_envio = {
        paqueteria: guia_envio.paqueteria,
        numero_guia: guia_envio.numero_guia,
        url_rastreo: guia_envio.url_rastreo || null,
        estatus_envio: 'en_transito',
        fecha_enviado: new Date().toISOString(),
        es_entrega_local: Boolean(es_entrega_local),
        notas: guia_envio.notas || null
      };
    } else {
      // Entrega local sin guía
      updateData.guia_envio = {
        paqueteria: 'Entrega Local',
        numero_guia: 'LOCAL',
        es_entrega_local: true,
        estatus_envio: 'en_transito',
        fecha_enviado: new Date().toISOString()
      };
    }

    const { data: pedidoActualizado, error: errorUpdate } = await supabaseAdmin
      .from('pedidos')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (errorUpdate) {
      console.error('Error actualizando pedido:', errorUpdate);
      return json({ success: false, error: 'Error al marcar como enviado' }, { status: 500 });
    }

    await supabaseAdmin.from('pedidos_historial').insert({
      pedido_id: id,
      estado_anterior: pedido.estado,
      estado_nuevo: ESTADOS.ENVIADO,
      tipo_usuario: 'vendedor',
      notas: es_entrega_local 
        ? 'Pedido marcado para entrega local' 
        : `Pedido enviado - ${guia_envio.paqueteria} #${guia_envio.numero_guia}`,
      metadata: {
        guia_envio: updateData.guia_envio
      }
    });

    try {
      await encolarNotificacion({
        pedidoId: id,
        clienteWhatsapp: pedido.cliente_whatsapp,
        tipo: 'pedido_enviado',
        prioridad: 'alta',
        metadata: {
          guia_envio: guia_envio?.numero_guia || 'LOCAL',
          transportadora: guia_envio?.paqueteria || 'Entrega Local',
          es_local: es_entrega_local
        }
      });
      
      const { procesarCola } = await import('$lib/server/notificaciones/cola');
      await procesarCola();
    } catch (notifError) {
      console.error('Error encolando notificación:', notifError);
    }

    return json({
      success: true,
      data: pedidoActualizado,
      message: 'Pedido marcado como enviado'
    });

  } catch (error) {
    console.error('Error en marcar-enviado:', error);
    return json({ success: false, error: 'Error interno' }, { status: 500 });
  }
}