// src/routes/api/pedidos/[id]/marcar-recibido/+server.js
import { json } from '@sveltejs/kit';
import { supabaseAdmin } from '$lib/supabaseServer';
import { ESTADOS, validarTransicionConContexto } from '$lib/server/pedidos/estados';
import { encolarNotificacion } from '$lib/server/notificaciones/cola';

export async function POST({ params, request }) {
  const { id } = params;

  try {
    const body = await request.json();
    const { calificacion, comentario, quiere_factura } = body;

    if (calificacion && (calificacion < 1 || calificacion > 5)) {
      return json({ success: false, error: 'Calificación debe estar entre 1 y 5' }, { status: 400 });
    }

    const { data: pedido, error } = await supabaseAdmin
      .from('pedidos')
      .select('*')
      .eq('id', id)
      .single();

    if (error || !pedido) {
      return json({ success: false, error: 'Pedido no encontrado' }, { status: 404 });
    }

    const validacion = validarTransicionConContexto(pedido, ESTADOS.RECIBIDO);
    if (!validacion.valido) {
      return json({ success: false, error: validacion.mensaje }, { status: 400 });
    }

    const updateData = {
      estado: ESTADOS.RECIBIDO,
      fecha_recibido: new Date().toISOString(),
      calificacion: calificacion || null,
      comentario_cliente: comentario?.trim() || null
    };

    if (quiere_factura !== undefined) {
      updateData.factura = Boolean(quiere_factura);
    }

    const { data: pedidoActualizado, error: errorUpdate } = await supabaseAdmin
      .from('pedidos')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (errorUpdate) {
      console.error('Error actualizando pedido:', errorUpdate);
      return json({ success: false, error: 'Error al confirmar recepción' }, { status: 500 });
    }

    const notasHistorial = calificacion 
      ? `Cliente confirmó recepción. Calificación: ${calificacion}/5${comentario ? '. Comentario: ' + comentario : ''}`
      : 'Cliente confirmó recepción del pedido';

    await supabaseAdmin.from('pedidos_historial').insert({
      pedido_id: id,
      estado_anterior: pedido.estado,
      estado_nuevo: ESTADOS.RECIBIDO,
      tipo_usuario: 'cliente',
      notas: notasHistorial,
      metadata: {
        calificacion: calificacion || null,
        comentario: comentario || null,
        quiere_factura: quiere_factura || null
      }
    });

    try {
      await encolarNotificacion({
        pedidoId: id,
        clienteWhatsapp: pedido.cliente_whatsapp,
        tipo: 'pedido_recibido_confirmacion',
        prioridad: 'media',
        metadata: {
          calificacion: calificacion || null,
          auto_finaliza_en: '24 horas'
        }
      });
    } catch (notifError) {
      console.error('Error encolando notificación:', notifError);
    }

    return json({
      success: true,
      data: pedidoActualizado,
      message: 'Recepción confirmada. El pedido se finalizará automáticamente en 24 horas.'
    });

  } catch (error) {
    console.error('Error en marcar-recibido:', error);
    return json({ success: false, error: 'Error interno' }, { status: 500 });
  }
}