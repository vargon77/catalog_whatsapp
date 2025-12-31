// src/routes/api/pedidos/+server.js
//x
import { json } from '@sveltejs/kit';
import { supabaseAdmin } from '$lib/supabaseServer';

// ========================================
// GET - Listar pedidos con filtros
// ========================================
export async function GET({ url }) {
  try {
    const page = parseInt(url.searchParams.get('page') || '1');
    const limit = parseInt(url.searchParams.get('limit') || '20');
    const estado = url.searchParams.get('estado');
    
    let query = supabaseAdmin
      .from('vista_pedidos_resumen')
      .select('*', { count: 'exact' })
      .order('created_at', { ascending: false });
    
    if (estado) {
      query = query.eq('estado', estado);
    }
    
    // Paginación
    const from = (page - 1) * limit;
    const to = from + limit - 1;
    query = query.range(from, to);
    
    const { data, error, count } = await query;
    
    if (error) throw error;
    
    return json({
      success: true,
      data,
      pagination: {
        page,
        limit,
        total: count,
        totalPages: Math.ceil(count / limit)
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
    
    // Validaciones básicas
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
    
    // Generar número de pedido único usando la función de BD
    const { data: numeroPedido, error: errorNumero } = await supabaseAdmin
      .rpc('generar_numero_pedido');
    
    if (errorNumero) throw errorNumero;
    
    // Calcular totales
    const subtotal = parseFloat(body.subtotal || 0);
    const impuesto = parseFloat(body.impuesto || 0);
    const total = parseFloat(body.total || subtotal + impuesto);
    
    // Buscar o crear cliente
    let clienteId = null;
    
    if (body.cliente_whatsapp) {
      // Buscar cliente existente por WhatsApp
      const { data: clienteExistente } = await supabaseAdmin
        .from('clientes')
        .select('id')
        .eq('whatsapp', body.cliente_whatsapp)
        .single();
      
      if (clienteExistente) {
        clienteId = clienteExistente.id;
        
        // Actualizar información del cliente si cambió
        await supabaseAdmin
          .from('clientes')
          .update({
            nombre: body.cliente_nombre,
            email: body.cliente_email || null,
            direccion: body.cliente_direccion || null
          })
          .eq('id', clienteId);
      } else {
        // Crear nuevo cliente
        const { data: nuevoCliente, error: errorCliente } = await supabaseAdmin
          .from('clientes')
          .insert({
            nombre: body.cliente_nombre,
            whatsapp: body.cliente_whatsapp,
            email: body.cliente_email || null,
            telefono: body.cliente_telefono || null,
            direccion: body.cliente_direccion || null
          })
          .select()
          .single();
        
        if (errorCliente) {
          console.error('Error creando cliente:', errorCliente);
        } else {
          clienteId = nuevoCliente.id;
        }
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
      subtotal,
      impuesto,
      total,
      estado: 'pendiente',
      notas: body.notas || null
    };
    
    const { data: pedido, error: errorPedido } = await supabaseAdmin
      .from('pedidos')
      .insert(pedidoData)
      .select()
      .single();
    
    if (errorPedido) throw errorPedido;
    
    // Crear items del pedido
    const itemsData = body.items.map(item => ({
      pedido_id: pedido.id,
      producto_id: item.id || null,
      producto_nombre: item.nombre,
      producto_sku: item.sku || null,
      cantidad: parseInt(item.cantidad),
      precio_unitario: parseFloat(item.precio_unitario),
      subtotal: parseFloat(item.precio_unitario) * parseInt(item.cantidad)
    }));
    
    const { error: errorItems } = await supabaseAdmin
      .from('pedidos_items')
      .insert(itemsData);
    
    if (errorItems) throw errorItems;
    
    // Actualizar stock de productos (opcional, comentado por ahora)
    // for (const item of body.items) {
    //   if (item.id) {
    //     await supabaseAdmin.rpc('decrementar_stock', {
    //       producto_id: item.id,
    //       cantidad: item.cantidad
    //     });
    //   }
    // }
    
    // Obtener pedido completo con items
    const { data: pedidoCompleto } = await supabaseAdmin
      .from('pedidos')
      .select(`
        *,
        items:pedidos_items(*)
      `)
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
// PUT - Actualizar estado del pedido
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
    
    const updateData = {};
    const camposPermitidos = ['estado', 'notas', 'fecha_entrega'];
    
    camposPermitidos.forEach(campo => {
      if (body[campo] !== undefined) {
        updateData[campo] = body[campo];
      }
    });
    
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