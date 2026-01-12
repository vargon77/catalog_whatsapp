// src/routes/api/pedidos/+server.js
import { json } from '@sveltejs/kit';
import { supabaseAdmin } from '$lib/supabaseServer';
import { 
  validarTransicion, 
  esEditable, 
  ESTADOS, 
  ESTADOS_PAGO 
} from '$lib/server/pedidos/estados';

// ========================================
// GET - Listar pedidos con filtros avanzados
// ========================================
export async function GET({ url }) {
  try {
    const page = parseInt(url.searchParams.get('page') || '1');
    const limit = parseInt(url.searchParams.get('limit') || '20');
    const estado = url.searchParams.get('estado');
    const estadoPago = url.searchParams.get('estado_pago');
    const busqueda = url.searchParams.get('busqueda');
    const soloValidacionPendiente = url.searchParams.get('validacion_pendiente') === 'true';

    let query = supabaseAdmin
      .from('pedidos')
      .select(`
        *,
        items:pedidos_items(
          id,
          producto_id,
          producto_nombre,
          producto_sku,
          cantidad,
          precio_unitario,
          subtotal,
          imagen_url
        ),
        cliente:clientes(
          id,
          nombre,
          whatsapp,
          email
        )
      `, { count: 'exact' })
      .order('created_at', { ascending: false });
    
    // Filtro: Solo pedidos esperando validación
    if (soloValidacionPendiente) {
      query = query.eq('esperando_validacion', true)
                   .eq('estado_pago', ESTADOS_PAGO.PENDIENTE_VALIDACION);
    }
    
    // Filtro: Búsqueda
    if (busqueda) {
      query = query.or(
        `numero_pedido.ilike.%${busqueda}%,` +
        `cliente_nombre.ilike.%${busqueda}%,` +
        `cliente_whatsapp.ilike.%${busqueda}%`
      );
    }
    
    // Filtro: Estado del pedido
    if (estado) {
      query = query.eq('estado', estado);
    }
    
    // Filtro: Estado del pago
    if (estadoPago) {
      query = query.eq('estado_pago', estadoPago);
    }
    
    // Paginación
    const from = (page - 1) * limit;
    const to = from + limit - 1;
    query = query.range(from, to);
    
    const { data, error, count } = await query;
    
    if (error) throw error;
    
    // Contar pedidos pendientes de validación (para badge)
    const { count: countValidacion } = await supabaseAdmin
      .from('pedidos')
      .select('*', { count: 'exact', head: true })
      .eq('esperando_validacion', true)
      .eq('estado_pago', ESTADOS_PAGO.PENDIENTE_VALIDACION);
    
    return json({
      success: true,
      data,
      pagination: {
        page,
        limit,
        total: count,
        totalPages: Math.ceil(count / limit)
      },
      metadata: {
        pendientesValidacion: countValidacion || 0
      }
    });
  } catch (error) {
    console.error('Error GET pedidos:', error);
    return json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}

// ========================================
// POST - Crear nuevo pedido
// ========================================
export async function POST({ request }) {
  try {
    const body = await request.json();
    
    // Validaciones
    if (!body.items || body.items.length === 0) {
      return json(
        { success: false, error: 'El pedido debe tener al menos un producto' },
        { status: 400 }
      );
    }
    
    if (!body.cliente_nombre || !body.cliente_whatsapp) {
      return json(
        { success: false, error: 'Nombre y WhatsApp del cliente son requeridos' },
        { status: 400 }
      );
    }
    
    // Generar número de pedido
    const { data: numeroPedido, error: errorNumero } = await supabaseAdmin
      .rpc('generar_numero_pedido');
    
    if (errorNumero) throw errorNumero;
    
    // Buscar o crear cliente
    let clienteId = null;
    
    if (body.cliente_whatsapp) {
      const { data: clienteExistente } = await supabaseAdmin
        .from('clientes')
        .select('id')
        .eq('whatsapp', body.cliente_whatsapp)
        .single();
      
      if (clienteExistente) {
        clienteId = clienteExistente.id;
        await supabaseAdmin
          .from('clientes')
          .update({
            nombre: body.cliente_nombre,
            email: body.cliente_email || null,
            direccion: body.cliente_direccion || null
          })
          .eq('id', clienteId);
      } else {
        const { data: nuevoCliente } = await supabaseAdmin
          .from('clientes')
          .insert({
            nombre: body.cliente_nombre,
            whatsapp: body.cliente_whatsapp,
            email: body.cliente_email || null,
            direccion: body.cliente_direccion || null
          })
          .select()
          .single();
        
        if (nuevoCliente) clienteId = nuevoCliente.id;
      }
    }
    
    // Crear pedido
    const pedidoData = {
      numero_pedido: numeroPedido,
      cliente_id: clienteId,
      cliente_nombre: body.cliente_nombre,
      cliente_whatsapp: body.cliente_whatsapp,
      cliente_email: body.cliente_email || null,
      cliente_direccion: body.cliente_direccion || null,
      subtotal: parseFloat(body.subtotal),
      impuesto: parseFloat(body.impuesto || 0),
      costo_envio: parseFloat(body.costo_envio || 0),
      total: parseFloat(body.total),
      estado: ESTADOS.PENDIENTE,
      estado_pago: ESTADOS_PAGO.SIN_PAGO,
      editable: true,
      notas: body.notas || null,
      factura: Boolean(body.factura),
      envio: Boolean(body.envio),
      metodo_pago: body.metodo_pago || null
    };
    
    const { data: pedido, error: errorPedido } = await supabaseAdmin
      .from('pedidos')
      .insert(pedidoData)
      .select()
      .single();
    
    if (errorPedido) throw errorPedido;
    
    // Crear items
    const itemsData = body.items.map(item => ({
      pedido_id: pedido.id,
      producto_id: item.id || null,
      producto_nombre: item.nombre,
      producto_sku: item.sku || null,
      cantidad: parseInt(item.cantidad),
      precio_unitario: parseFloat(item.precio_unitario),
      subtotal: parseFloat(item.precio_unitario) * parseInt(item.cantidad),
      imagen_url: item.imagen_url || null
    }));
    
    const { error: errorItems } = await supabaseAdmin
      .from('pedidos_items')
      .insert(itemsData);
    
    if (errorItems) throw errorItems;
    
    // Registrar en historial
    await supabaseAdmin
      .from('pedidos_historial')
      .insert({
        pedido_id: pedido.id,
        estado_anterior: null,
        estado_nuevo: ESTADOS.PENDIENTE,
        tipo_usuario: 'cliente',
        notas: 'Pedido creado desde el carrito'
      });
    
    // Obtener pedido completo
    const { data: pedidoCompleto } = await supabaseAdmin
      .from('pedidos')
      .select(`*, items:pedidos_items(*)`)
      .eq('id', pedido.id)
      .single();
    
    return json({
      success: true,
      data: pedidoCompleto,
      message: 'Pedido creado exitosamente'
    }, { status: 201 });
    
  } catch (error) {
    console.error('Error POST pedido:', error);
    return json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}

// ========================================
// PUT - Actualizar pedido (con validaciones)
// ========================================
export async function PUT({ request }) {
  try {
    const body = await request.json();
    
    if (!body.id) {
      return json(
        { success: false, error: 'ID del pedido requerido' },
        { status: 400 }
      );
    }
    
    // Obtener pedido actual
    const { data: pedidoActual, error: errorPedido } = await supabaseAdmin
      .from('pedidos')
      .select('*')
      .eq('id', body.id)
      .single();
    
    if (errorPedido) throw errorPedido;
    if (!pedidoActual) {
      return json(
        { success: false, error: 'Pedido no encontrado' },
        { status: 404 }
      );
    }
    
    // Validar si es editable
    if (body.items && !esEditable(pedidoActual)) {
      return json(
        { success: false, error: 'Este pedido ya no puede ser editado' },
        { status: 403 }
      );
    }
    
    // Validar transición de estado
    if (body.estado && body.estado !== pedidoActual.estado) {
      const validacion = validarTransicion(pedidoActual.estado, body.estado);
      if (!validacion.valido) {
        return json(
          { success: false, error: validacion.mensaje },
          { status: 400 }
        );
      }
    }
    
    const updateData = {};
    const camposPermitidos = [
      'estado', 'notas', 'fecha_entrega', 'costo_envio',
      'motivo_cancelacion', 'guia_envio', 'validado_por'
    ];
    
    camposPermitidos.forEach(campo => {
      if (body[campo] !== undefined) {
        updateData[campo] = body[campo];
      }
    });
    
    // Actualizar items si se envían
    if (body.items && esEditable(pedidoActual)) {
      // Eliminar items actuales
      await supabaseAdmin
        .from('pedidos_items')
        .delete()
        .eq('pedido_id', body.id);
      
      // Insertar nuevos items
      const itemsData = body.items.map(item => ({
        pedido_id: body.id,
        producto_id: item.id || null,
        producto_nombre: item.nombre,
        producto_sku: item.sku || null,
        cantidad: parseInt(item.cantidad),
        precio_unitario: parseFloat(item.precio_unitario),
        subtotal: parseFloat(item.precio_unitario) * parseInt(item.cantidad),
        imagen_url: item.imagen_url || null
      }));
      
      await supabaseAdmin
        .from('pedidos_items')
        .insert(itemsData);
      
      // Actualizar totales
      if (body.subtotal !== undefined) updateData.subtotal = parseFloat(body.subtotal);
      if (body.impuesto !== undefined) updateData.impuesto = parseFloat(body.impuesto);
      if (body.total !== undefined) updateData.total = parseFloat(body.total);
    }
    
    const { data, error } = await supabaseAdmin
      .from('pedidos')
      .update(updateData)
      .eq('id', body.id)
      .select()
      .single();
    
    if (error) throw error;
    
    return json({
      success: true,
      data,
      message: 'Pedido actualizado exitosamente'
    });
    
  } catch (error) {
    console.error('Error PUT pedido:', error);
    return json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}

// ========================================
// DELETE - Eliminar pedido (solo pendientes)
// ========================================
export async function DELETE({ url }) {
  try {
    const id = url.searchParams.get('id');
    
    if (!id) {
      return json(
        { success: false, error: 'ID del pedido requerido' },
        { status: 400 }
      );
    }
    
    // Verificar que sea editable
    const { data: pedido } = await supabaseAdmin
      .from('pedidos')
      .select('estado, editable')
      .eq('id', id)
      .single();
    
    if (!pedido || !esEditable(pedido)) {
      return json(
        { success: false, error: 'Este pedido no puede ser eliminado' },
        { status: 403 }
      );
    }
    
    const { error } = await supabaseAdmin
      .from('pedidos')
      .delete()
      .eq('id', id);
    
    if (error) throw error;
    
    return json({
      success: true,
      message: 'Pedido eliminado exitosamente'
    });
    
  } catch (error) {
    console.error('Error DELETE pedido:', error);
    return json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}