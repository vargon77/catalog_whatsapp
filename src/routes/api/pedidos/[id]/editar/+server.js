// src/routes/api/pedidos/[id]/editar/+server.js
import { json } from '@sveltejs/kit';
import { supabaseAdmin } from '$lib/supabaseServer';
import { esEditable } from '$lib/server/pedidos/estados';
import { validarDatosCliente, validarItems, validarTotales } from '$lib/server/pedidos/validaciones';

export async function PUT({ params, request }) {
  const { id } = params;

  try {
    const body = await request.json();

    const { data: pedido, error } = await supabaseAdmin
      .from('pedidos')
      .select('*')
      .eq('id', id)
      .single();

    if (error || !pedido) {
      return json({ success: false, error: 'Pedido no encontrado' }, { status: 404 });
    }

    if (!esEditable(pedido)) {
      return json({ 
        success: false, 
        error: 'Este pedido ya no puede ser editado',
        motivo: pedido.estado_pago === 'pagado' 
          ? 'El pago ya fue validado' 
          : `Estado actual: ${pedido.estado}`
      }, { status: 400 });
    }

    // Validar datos del cliente si se envían
    if (body.cliente_nombre || body.cliente_whatsapp || body.cliente_email) {
      validarDatosCliente({
        cliente_nombre: body.cliente_nombre || pedido.cliente_nombre,
        cliente_whatsapp: body.cliente_whatsapp || pedido.cliente_whatsapp,
        cliente_email: body.cliente_email || pedido.cliente_email
      });
    }

    // Validar items si se envían
    if (body.items) {
      validarItems(body.items);
    }

    // Validar totales si se envían
    if (body.subtotal || body.impuesto || body.costo_envio || body.total) {
      validarTotales({
        subtotal: body.subtotal || pedido.subtotal,
        impuesto: body.impuesto || pedido.impuesto,
        costo_envio: body.costo_envio || pedido.costo_envio,
        total: body.total || pedido.total
      });
    }

    const camposEditados = [];
    const updateData = {};

    // Datos del cliente
    if (body.cliente_nombre && body.cliente_nombre !== pedido.cliente_nombre) {
      updateData.cliente_nombre = body.cliente_nombre.trim();
      camposEditados.push('nombre');
    }
    if (body.cliente_whatsapp && body.cliente_whatsapp !== pedido.cliente_whatsapp) {
      updateData.cliente_whatsapp = body.cliente_whatsapp.replace(/\D/g, '');
      camposEditados.push('whatsapp');
    }
    if (body.cliente_email !== undefined && body.cliente_email !== pedido.cliente_email) {
      updateData.cliente_email = body.cliente_email?.trim() || null;
      camposEditados.push('email');
    }
    if (body.cliente_direccion !== undefined && body.cliente_direccion !== pedido.cliente_direccion) {
      updateData.cliente_direccion = body.cliente_direccion?.trim() || null;
      camposEditados.push('direccion');
    }

    // Totales
    if (body.subtotal && body.subtotal !== pedido.subtotal) {
      updateData.subtotal = parseFloat(body.subtotal);
      camposEditados.push('subtotal');
    }
    if (body.impuesto !== undefined && body.impuesto !== pedido.impuesto) {
      updateData.impuesto = parseFloat(body.impuesto);
      camposEditados.push('impuesto');
    }
    if (body.costo_envio !== undefined && body.costo_envio !== pedido.costo_envio) {
      updateData.costo_envio = parseFloat(body.costo_envio);
      camposEditados.push('costo_envio');
    }
    if (body.total && body.total !== pedido.total) {
      updateData.total = parseFloat(body.total);
      camposEditados.push('total');
    }

    // Otros campos
    if (body.notas !== undefined && body.notas !== pedido.notas) {
      updateData.notas = body.notas?.trim() || null;
      camposEditados.push('notas');
    }
    if (body.factura !== undefined && body.factura !== pedido.factura) {
      updateData.factura = Boolean(body.factura);
      camposEditados.push('factura');
    }
    if (body.envio !== undefined && body.envio !== pedido.envio) {
      updateData.envio = Boolean(body.envio);
      camposEditados.push('envio');
    }

    if (Object.keys(updateData).length === 0 && !body.items) {
      return json({ success: false, error: 'No hay cambios para guardar' }, { status: 400 });
    }

    // Actualizar pedido
    if (Object.keys(updateData).length > 0) {
      const { error: errorUpdate } = await supabaseAdmin
        .from('pedidos')
        .update(updateData)
        .eq('id', id);

      if (errorUpdate) {
        console.error('Error actualizando pedido:', errorUpdate);
        return json({ success: false, error: 'Error al actualizar pedido' }, { status: 500 });
      }
    }

    // Actualizar items si se enviaron
    if (body.items && body.items.length > 0) {
      // Eliminar items anteriores
      await supabaseAdmin
        .from('pedidos_items')
        .delete()
        .eq('pedido_id', id);

      // Insertar nuevos items
      const itemsData = body.items.map(item => ({
        pedido_id: id,
        producto_id: item.producto_id || item.id || null,
        producto_nombre: item.nombre.trim(),
        producto_sku: item.sku?.trim() || null,
        cantidad: parseInt(item.cantidad),
        precio_unitario: parseFloat(item.precio_unitario),
        subtotal: parseFloat(item.precio_unitario) * parseInt(item.cantidad),
        imagen_url: item.imagen_url?.trim() || null
      }));

      const { error: errorItems } = await supabaseAdmin
        .from('pedidos_items')
        .insert(itemsData);

      if (errorItems) {
        console.error('Error actualizando items:', errorItems);
        return json({ success: false, error: 'Error al actualizar productos' }, { status: 500 });
      }

      camposEditados.push('items');
    }

    // Registrar en historial
    await supabaseAdmin.from('pedidos_historial').insert({
      pedido_id: id,
      estado_anterior: pedido.estado,
      estado_nuevo: pedido.estado,
      tipo_usuario: 'cliente',
      notas: `Pedido editado. Campos modificados: ${camposEditados.join(', ')}`,
      metadata: { campos_editados: camposEditados }
    });

    // Obtener pedido actualizado con items
    const { data: pedidoActualizado } = await supabaseAdmin
      .from('pedidos')
      .select('*, items:pedidos_items(*)')
      .eq('id', id)
      .single();

    return json({
      success: true,
      data: pedidoActualizado,
      message: 'Pedido actualizado correctamente',
      campos_editados: camposEditados
    });

  } catch (error) {
    console.error('Error en editar pedido:', error);
    
    if (error.code) {
      return json({ success: false, error: error.message }, { status: 400 });
    }
    
    return json({ success: false, error: 'Error interno' }, { status: 500 });
  }
}