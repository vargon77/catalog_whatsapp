// src/routes/api/pedidos/[id]/editar/+server.js
import { json } from '@sveltejs/kit';
import { supabaseAdmin } from '$lib/supabaseServer';
import { esEditable, ESTADOS_PAGO } from '$lib/server/pedidos/estados';

/**
 * PUT - Editar pedido (productos, cliente, totales)
 * Solo permite edición si:
 * - pedido.editable = true
 * - estado = pendiente o confirmado
 * - estado_pago != pagado
 */
export async function PUT({ params, request }) {
  try {
    const { id } = params;
    const body = await request.json();
    
    // 1. Obtener pedido actual
    const { data: pedidoActual, error: errorPedido } = await supabaseAdmin
      .from('pedidos')
      .select('*')
      .eq('id', id)
      .single();
    
    if (errorPedido || !pedidoActual) {
      return json(
        { success: false, error: 'Pedido no encontrado' },
        { status: 404 }
      );
    }
    
    // 2. Validar que sea editable
    if (!esEditable(pedidoActual)) {
      return json(
        { 
          success: false, 
          error: 'Este pedido ya no puede ser editado. El pago ya fue validado o el pedido está en proceso de envío.' 
        },
        { status: 403 }
      );
    }
    
    // 3. Preparar datos de actualización
    const updateData = {};
    
    // Cliente
    if (body.cliente_nombre) updateData.cliente_nombre = body.cliente_nombre.trim();
    if (body.cliente_whatsapp) updateData.cliente_whatsapp = body.cliente_whatsapp.trim();
    if (body.cliente_email !== undefined) updateData.cliente_email = body.cliente_email?.trim() || null;
    if (body.cliente_direccion !== undefined) updateData.cliente_direccion = body.cliente_direccion?.trim() || null;
    
    // Costos (solo si está confirmado)
    if (body.costo_envio !== undefined) {
      updateData.costo_envio = parseFloat(body.costo_envio || 0);
    }
    
    // Notas internas
    if (body.notas !== undefined) {
      updateData.notas = body.notas?.trim() || null;
    }
    
    // Método de pago
    if (body.metodo_pago !== undefined) {
      updateData.metodo_pago = body.metodo_pago;
    }
    
    // Flags
    if (body.factura !== undefined) updateData.factura = Boolean(body.factura);
    if (body.envio !== undefined) updateData.envio = Boolean(body.envio);
    
    // 4. Actualizar items si se enviaron
    if (body.items && Array.isArray(body.items) && body.items.length > 0) {
      // Eliminar items actuales
      await supabaseAdmin
        .from('pedidos_items')
        .delete()
        .eq('pedido_id', id);
      
      // Insertar nuevos items
      const itemsData = body.items.map(item => ({
        pedido_id: id,
        producto_id: item.producto_id || null,
        producto_nombre: item.nombre || item.producto_nombre,
        producto_sku: item.sku || item.producto_sku || null,
        cantidad: parseInt(item.cantidad),
        precio_unitario: parseFloat(item.precio_unitario),
        subtotal: parseFloat(item.precio_unitario) * parseInt(item.cantidad),
        imagen_url: item.imagen_url || null
      }));
      
      const { error: errorItems } = await supabaseAdmin
        .from('pedidos_items')
        .insert(itemsData);
      
      if (errorItems) throw errorItems;
      
      // Recalcular totales
      const nuevoSubtotal = itemsData.reduce((sum, item) => sum + item.subtotal, 0);
      updateData.subtotal = nuevoSubtotal;
      
      // Recalcular IVA si tiene factura
      if (pedidoActual.factura) {
        updateData.impuesto = nuevoSubtotal * 0.16; // 16% IVA México
      }
      
      // Recalcular total
      const nuevoTotal = nuevoSubtotal + 
                        (updateData.impuesto || pedidoActual.impuesto || 0) + 
                        (updateData.costo_envio !== undefined ? updateData.costo_envio : pedidoActual.costo_envio || 0);
      
      updateData.total = nuevoTotal;
    } else if (body.costo_envio !== undefined) {
      // Solo actualizar total si cambió el costo de envío
      const nuevoTotal = pedidoActual.subtotal + 
                        (pedidoActual.impuesto || 0) + 
                        parseFloat(body.costo_envio || 0);
      updateData.total = nuevoTotal;
    }
    
    // 5. Actualizar pedido
    const { data: pedidoActualizado, error: errorUpdate } = await supabaseAdmin
      .from('pedidos')
      .update(updateData)
      .eq('id', id)
      .select(`
        *,
        items:pedidos_items(*)
      `)
      .single();
    
    if (errorUpdate) throw errorUpdate;
    
    // 6. Registrar en historial
    const cambios = [];
    if (body.items) cambios.push('productos');
    if (body.cliente_nombre) cambios.push('cliente');
    if (body.costo_envio !== undefined) cambios.push('costo de envío');
    if (body.notas !== undefined) cambios.push('notas');
    
    await supabaseAdmin
      .from('pedidos_historial')
      .insert({
        pedido_id: id,
        estado_anterior: pedidoActual.estado,
        estado_nuevo: pedidoActual.estado,
        tipo_usuario: 'vendedor',
        notas: `Pedido editado: ${cambios.join(', ')}`,
        metadata: {
          campos_editados: cambios,
          total_anterior: pedidoActual.total,
          total_nuevo: pedidoActualizado.total
        }
      });
    
    return json({
      success: true,
      data: pedidoActualizado,
      message: '✅ Pedido actualizado correctamente'
    });
    
  } catch (error) {
    console.error('Error editando pedido:', error);
    return json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}


/**
 * GET - Obtener pedido con items para edición
 */
export async function GET({ params }) {
  try {
    const { id } = params;
    
    const { data, error } = await supabaseAdmin
      .from('pedidos')
      .select(`
        *,
        items:pedidos_items(*)
      `)
      .eq('id', id)
      .single();
    
    if (error || !data) {
      return json(
        { success: false, error: 'Pedido no encontrado' },
        { status: 404 }
      );
    }
    
    // Validar si es editable
    const editable = esEditable(data);
    
    return json({
      success: true,
      data: {
        ...data,
        editable
      }
    });
    
  } catch (error) {
    console.error('Error obteniendo pedido:', error);
    return json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}