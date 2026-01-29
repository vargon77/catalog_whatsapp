// src/routes/api/pedidos/[id]/editar/+server.js
// ✅ VERSIÓN CORREGIDA - Handler PUT funcional

import { json } from '@sveltejs/kit';
import { supabaseAdmin } from '$lib/supabaseServer';
import { esEditable } from '$lib/server/pedidos/estados';
import { validarDatosCliente, validarItems, validarTotales, sanitizarTexto, sanitizarWhatsApp } from '$lib/server/pedidos/validaciones';

// ============================================
// GET - Obtener pedido para edición
// ============================================
export async function GET({ params }) {
  const { id } = params;

  try {
    const { data: pedido, error } = await supabaseAdmin
      .from('pedidos')
      .select(`
        *,
        items:pedidos_items(*)
      `)
      .eq('id', id)
      .single();

    if (error || !pedido) {
      return json({ success: false, error: 'Pedido no encontrado' }, { status: 404 });
    }

    const editable = esEditable(pedido);

    return json({
      success: true,
      data: {
        ...pedido,
        editable
      }
    });

  } catch (error) {
    console.error('Error en GET editar:', error);
    return json({ success: false, error: 'Error interno' }, { status: 500 });
  }
}

// ============================================
// PUT - Editar pedido (CORREGIDO)
// ============================================
export async function PUT({ params, request }) {
  const { id } = params;

  try {
    const body = await request.json();
    
    console.log('📝 Editando pedido:', id, body);

    // 1. Obtener pedido actual
    const { data: pedido, error } = await supabaseAdmin
      .from('pedidos')
      .select('*')
      .eq('id', id)
      .single();

    if (error || !pedido) {
      return json({ success: false, error: 'Pedido no encontrado' }, { status: 404 });
    }

    // 2. Verificar editabilidad
    if (!esEditable(pedido)) {
      return json({ 
        success: false, 
        error: 'Este pedido ya no puede ser editado',
        motivo: pedido.estado_pago === 'pagado' 
          ? 'El pago ya fue validado' 
          : `Estado actual: ${pedido.estado}`
      }, { status: 400 });
    }

    // 3. Validar datos si se envían
    if (body.cliente_nombre || body.cliente_whatsapp || body.cliente_email) {
      validarDatosCliente({
        cliente_nombre: body.cliente_nombre || pedido.cliente_nombre,
        cliente_whatsapp: body.cliente_whatsapp || pedido.cliente_whatsapp,
        cliente_email: body.cliente_email || pedido.cliente_email
      });
    }

    // 4. Preparar datos de actualización
    const camposEditados = [];
    const updateData = {};

    // Datos del cliente
    if (body.cliente_nombre && body.cliente_nombre !== pedido.cliente_nombre) {
      updateData.cliente_nombre = body.cliente_nombre.trim();
      camposEditados.push('nombre');
    }
    if (body.cliente_whatsapp && body.cliente_whatsapp !== pedido.cliente_whatsapp) {
      updateData.cliente_whatsapp = sanitizarWhatsApp(body.cliente_whatsapp);
      camposEditados.push('whatsapp');
    }
    if (body.cliente_email !== undefined && body.cliente_email !== pedido.cliente_email) {
      updateData.cliente_email = body.cliente_email?.trim() || null;
      camposEditados.push('email');
    }
    if (body.cliente_direccion !== undefined && body.cliente_direccion !== pedido.cliente_direccion) {
      updateData.cliente_direccion = sanitizarTexto(body.cliente_direccion);
      camposEditados.push('direccion');
    }

    // 5. ✅ CRÍTICO: Costo de envío
    if (body.costo_envio !== undefined) {
      updateData.costo_envio = parseFloat(body.costo_envio || 0);
      camposEditados.push('costo_envio');
      console.log('💰 Actualizando costo de envío:', updateData.costo_envio);
    }

    // Otros campos
    if (body.notas !== undefined && body.notas !== pedido.notas) {
      updateData.notas = sanitizarTexto(body.notas);
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
    if (body.metodo_pago !== undefined && body.metodo_pago !== pedido.metodo_pago) {
      updateData.metodo_pago = body.metodo_pago;
      camposEditados.push('metodo_pago');
    }

    // 6. Actualizar items si se enviaron
    let nuevoSubtotal = pedido.subtotal;
    
    if (body.items && body.items.length > 0) {
      // Validar items
      validarItems(body.items);
      
      // Eliminar items anteriores
      await supabaseAdmin
        .from('pedidos_items')
        .delete()
        .eq('pedido_id', id);

      // Insertar nuevos items
      const itemsData = body.items.map(item => ({
        pedido_id: id,
        producto_id: item.producto_id || null,
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

      // Recalcular subtotal
      nuevoSubtotal = itemsData.reduce((sum, item) => sum + item.subtotal, 0);
      updateData.subtotal = nuevoSubtotal;
      
      camposEditados.push('items');
    }

    // 7. Recalcular impuesto si cambió factura o items
    if (updateData.factura !== undefined || updateData.subtotal !== undefined) {
      const requiereFactura = updateData.factura !== undefined ? updateData.factura : pedido.factura;
      updateData.impuesto = requiereFactura ? nuevoSubtotal * 0.16 : 0;
    }

    // 8. ✅ CRÍTICO: Recalcular total siempre que cambie algo
    if (Object.keys(updateData).length > 0) {
      const subtotalFinal = updateData.subtotal !== undefined ? updateData.subtotal : pedido.subtotal;
      const impuestoFinal = updateData.impuesto !== undefined ? updateData.impuesto : pedido.impuesto || 0;
      const costoEnvioFinal = updateData.costo_envio !== undefined ? updateData.costo_envio : pedido.costo_envio || 0;
      
      updateData.total = subtotalFinal + impuestoFinal + costoEnvioFinal;
      
      console.log('🧮 Recálculo de totales:', {
        subtotal: subtotalFinal,
        impuesto: impuestoFinal,
        costo_envio: costoEnvioFinal,
        total: updateData.total
      });
    }

    // 9. Validar totales
    if (updateData.total !== undefined) {
      validarTotales({
        subtotal: updateData.subtotal || pedido.subtotal,
        impuesto: updateData.impuesto || pedido.impuesto || 0,
        costo_envio: updateData.costo_envio !== undefined ? updateData.costo_envio : pedido.costo_envio || 0,
        total: updateData.total
      });
    }

    if (Object.keys(updateData).length === 0) {
      return json({ success: false, error: 'No hay cambios para guardar' }, { status: 400 });
    }

    // 10. Actualizar pedido
    console.log('💾 Guardando cambios:', updateData);
    
    const { error: errorUpdate } = await supabaseAdmin
      .from('pedidos')
      .update(updateData)
      .eq('id', id);

    if (errorUpdate) {
      console.error('Error actualizando pedido:', errorUpdate);
      return json({ success: false, error: 'Error al actualizar pedido' }, { status: 500 });
    }

    // 11. Registrar en historial
    await supabaseAdmin.from('pedidos_historial').insert({
      pedido_id: id,
      estado_anterior: pedido.estado,
      estado_nuevo: pedido.estado,
      tipo_usuario: 'vendedor',
      notas: `Pedido editado. Campos modificados: ${camposEditados.join(', ')}`,
      metadata: { 
        campos_editados: camposEditados,
        total_anterior: pedido.total,
        total_nuevo: updateData.total
      }
    });

    // 12. Obtener pedido actualizado
    const { data: pedidoActualizado } = await supabaseAdmin
      .from('pedidos')
      .select('*, items:pedidos_items(*)')
      .eq('id', id)
      .single();

    console.log('✅ Pedido actualizado correctamente');

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