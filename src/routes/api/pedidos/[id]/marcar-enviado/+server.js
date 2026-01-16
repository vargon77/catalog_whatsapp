// src/routes/api/pedidos/[id]/marcar-enviado/+server.js
import { json } from '@sveltejs/kit';
import { supabaseAdmin } from '$lib/supabaseServer';
import { ESTADOS, validarTransicionConContexto } from '$lib/server/pedidos/estados';
import { encolarNotificacion } from '$lib/server/notificaciones/cola';

export async function POST({ params, request }) {
  const { id } = params;

  try {
    const body = await request.json();
    const { guia_envio, transportadora, notas } = body;

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

    const updateData = {
      estado: ESTADOS.ENVIADO,
      fecha_enviado: new Date().toISOString(),
      guia_envio: guia_envio?.trim() || null,
      transportadora: transportadora?.trim() || null
    };

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
      notas: notas?.trim() || 'Pedido marcado como enviado',
      metadata: {
        guia_envio: guia_envio || null,
        transportadora: transportadora || null
      }
    });

    try {
      await encolarNotificacion({
        pedidoId: id,
        clienteWhatsapp: pedido.cliente_whatsapp,
        tipo: 'pedido_enviado',
        prioridad: 'alta',
        metadata: {
          guia_envio: guia_envio || null,
          transportadora: transportadora || null
        }
      });
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