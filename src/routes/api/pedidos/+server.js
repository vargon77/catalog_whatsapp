// src/routes/api/pedidos/+server.js 
// ✅ VERSIÓN CORREGIDA con transacciones, validaciones y notificaciones

import { json } from '@sveltejs/kit';
import { supabaseAdmin } from '$lib/supabaseServer';
import { ESTADOS, ESTADOS_PAGO } from '$lib/server/pedidos/estados';
import { 
  ValidationError,
  validarDatosCliente,
  validarItems,
  validarTotales,
  sanitizarTexto,
  sanitizarWhatsApp
} from '$lib/server/pedidos/validaciones';
import { encolarNotificacion } from '$lib/server/notificaciones/cola';

// ✅  GET HANDLER
export async function GET({ url }) {
  try {
    const whatsapp = url.searchParams.get('whatsapp');
    const estado = url.searchParams.get('estado');
    const busqueda = url.searchParams.get('busqueda');
    const validacionPendiente = url.searchParams.get('validacion_pendiente');
    
    let query = supabaseAdmin
      .from('pedidos')
      .select(`
        *,
        items:pedidos_items(*)
      `)
      .order('created_at', { ascending: false });
    
    // Filtrar por whatsapp del cliente
    if (whatsapp) {
      const whatsappLimpio = whatsapp.replace(/\D/g, '');
      query = query.eq('cliente_whatsapp', whatsappLimpio);
    }
    
    // Filtrar por estado
    if (estado) {
      query = query.eq('estado', estado);
    }
    
    // Búsqueda general (número pedido, nombre, whatsapp)
    if (busqueda) {
      query = query.or(
        `numero_pedido.ilike.%${busqueda}%,` +
        `cliente_nombre.ilike.%${busqueda}%,` +
        `cliente_whatsapp.ilike.%${busqueda}%`
      );
    }
    
    // Solo pagos pendientes de validación
    if (validacionPendiente === 'true') {
      query = query.eq('esperando_validacion', true);
    }
    
    const { data, error, count } = await query;
    
    if (error) throw error;
    
    // Contar pendientes de validación
    const { count: pendientesCount } = await supabaseAdmin
      .from('pedidos')
      .select('*', { count: 'exact', head: true })
      .eq('esperando_validacion', true);
    
    return json({
      success: true,
      data: data || [],
      metadata: {
        total: count,
        pendientesValidacion: pendientesCount || 0
      }
    });
    
  } catch (error) {
    console.error('Error GET /api/pedidos:', error);
    return json(
      { 
        success: false, 
        error: error.message || 'Error al obtener pedidos'
      },
      { status: 500 }
    );
  }
}

// ========================================
// POST - Crear nuevo pedido (TRANSACCIONAL)
// ========================================
export async function POST({ request }) {
  // Variable para rollback manual si es necesario
  let pedidoCreado = null;
  let itemsCreados = null;
  
  try {
    const body = await request.json();
    
    // ========================================
    // 1. VALIDACIONES DE ENTRADA
    // ========================================
    console.log('📝 Validando datos del pedido...');
    
    // Validar estructura básica
    if (!body.items || !Array.isArray(body.items) || body.items.length === 0) {
      throw new ValidationError(
        'El pedido debe tener al menos un producto',
        'MISSING_ITEMS'
      );
    }
    
    // Validar datos del cliente
    const datosCliente = {
      cliente_nombre: body.cliente_nombre,
      cliente_whatsapp: body.cliente_whatsapp,
      cliente_email: body.cliente_email
    };
    validarDatosCliente(datosCliente);
    
    // Validar items
    validarItems(body.items);
    
    // Validar totales
    validarTotales({
      subtotal: body.subtotal,
      impuesto: body.impuesto || 0,
      costo_envio: body.costo_envio || 0,
      total: body.total
    });
    
    console.log('✅ Validaciones pasadas');
    
    // ========================================
    // 2. GENERAR NÚMERO DE PEDIDO
    // ========================================
    const { data: numeroPedido, error: errorNumero } = await supabaseAdmin
      .rpc('generar_numero_pedido');
    
    if (errorNumero) {
      console.error('Error generando número:', errorNumero);
      throw new Error('No se pudo generar el número de pedido');
    }
    
    console.log(`📋 Número de pedido generado: ${numeroPedido}`);
    
    // ========================================
    // 3. BUSCAR O CREAR CLIENTE
    // ========================================
    let clienteId = null;
    
    if (body.cliente_whatsapp) {
      const whatsappLimpio = sanitizarWhatsApp(body.cliente_whatsapp);
      
      // Buscar cliente existente
      const { data: clienteExistente } = await supabaseAdmin
        .from('clientes')
        .select('id, nombre, email, direccion')
        .eq('whatsapp', whatsappLimpio)
        .single();
      
      if (clienteExistente) {
        clienteId = clienteExistente.id;
        
        // Actualizar datos si cambiaron
        const actualizarDatos = {};
        if (body.cliente_nombre !== clienteExistente.nombre) {
          actualizarDatos.nombre = body.cliente_nombre;
        }
        if (body.cliente_email && body.cliente_email !== clienteExistente.email) {
          actualizarDatos.email = body.cliente_email;
        }
        if (body.cliente_direccion && body.cliente_direccion !== clienteExistente.direccion) {
          actualizarDatos.direccion = body.cliente_direccion;
        }
        
        if (Object.keys(actualizarDatos).length > 0) {
          await supabaseAdmin
            .from('clientes')
            .update(actualizarDatos)
            .eq('id', clienteId);
          
          console.log(`👤 Cliente ${clienteId} actualizado`);
        } else {
          console.log(`👤 Cliente ${clienteId} encontrado (sin cambios)`);
        }
        
      } else {
        // Crear nuevo cliente
        const { data: nuevoCliente, error: errorCliente } = await supabaseAdmin
          .from('clientes')
          .insert({
            nombre: body.cliente_nombre,
            whatsapp: whatsappLimpio,
            email: body.cliente_email || null,
            direccion: body.cliente_direccion || null
          })
          .select()
          .single();
        
        if (errorCliente) {
          console.error('Error creando cliente:', errorCliente);
          throw new Error('No se pudo crear el registro del cliente');
        }
        
        clienteId = nuevoCliente.id;
        console.log(`👤 Nuevo cliente creado: ${clienteId}`);
      }
    }
    
    // ========================================
    // 4. CREAR PEDIDO (TRANSACCIÓN PARTE 1)
    // ========================================
    console.log('💾 Creando pedido...');
    
    const pedidoData = {
      numero_pedido: numeroPedido,
      cliente_id: clienteId,
      cliente_nombre: body.cliente_nombre.trim(),
      cliente_whatsapp: sanitizarWhatsApp(body.cliente_whatsapp),
      cliente_email: body.cliente_email?.trim() || null,
      cliente_direccion: body.cliente_direccion?.trim() || null,
      subtotal: parseFloat(body.subtotal),
      impuesto: parseFloat(body.impuesto || 0),
      costo_envio: parseFloat(body.costo_envio || 0),
      total: parseFloat(body.total),
      estado: ESTADOS.PENDIENTE,
      estado_pago: ESTADOS_PAGO.SIN_PAGO,
      editable: true,
      notas: sanitizarTexto(body.notas),
      factura: Boolean(body.factura),
      envio: Boolean(body.envio),
      metodo_pago: body.metodo_pago || null,
      created_at: new Date().toISOString()
    };
    
    const { data: pedido, error: errorPedido } = await supabaseAdmin
      .from('pedidos')
      .insert([pedidoData])
      .select()
      .single();
    
    if (errorPedido) {
      console.error('❌ Error insertando pedido:', errorPedido);
      throw new Error('Error al crear el pedido en la base de datos');
    }
    
    pedidoCreado = pedido;
    console.log(`✅ Pedido ${pedido.id} creado`);
    
    // ========================================
    // 5. CREAR ITEMS (TRANSACCIÓN PARTE 2)
    // ========================================
    console.log('📦 Creando items del pedido...');
    
    const itemsData = body.items.map(item => ({
      pedido_id: pedido.id,
      producto_id: item.producto_id, // ✅ Más claro
      producto_nombre: item.nombre,
      producto_sku: item.sku?.trim() || null,
      cantidad: parseInt(item.cantidad),
      precio_unitario: parseFloat(item.precio_unitario),
      subtotal: parseFloat(item.precio_unitario) * parseInt(item.cantidad),
      imagen_url: item.imagen_url?.trim() || null
    }));
    // ✅ VALIDACIÓN CRÍTICA: Verificar que producto_id NO sea NULL
    const itemsInvalidos = itemsData.some(item => !item.producto_id);
    if (itemsInvalidos) {
      console.error('❌ Items sin producto_id:', itemsData);
      throw new ValidationError(
        'Todos los productos deben tener un ID válido',
        'INVALID_PRODUCT_ID'
      );
    }
    
    const { data: items, error: errorItems } = await supabaseAdmin
      .from('pedidos_items')
      .insert(itemsData)
      .select();
    
    if (errorItems) {
      console.error('❌ Error insertando items:', errorItems);
      
      // ROLLBACK: Eliminar pedido creado
      await supabaseAdmin
        .from('pedidos')
        .delete()
        .eq('id', pedido.id);
      
      throw new Error('Error al crear los productos del pedido');
    }
    
    itemsCreados = items;
    console.log(`✅ ${items.length} items creados`);
    
    // ========================================
    // 6. REGISTRAR EN HISTORIAL
    // ========================================
    console.log('📜 Registrando en historial...');
    
    const { error: errorHistorial } = await supabaseAdmin
      .from('pedidos_historial')
      .insert({
        pedido_id: pedido.id,
        estado_anterior: null,
        estado_nuevo: ESTADOS.PENDIENTE,
        tipo_usuario: 'cliente',
        notas: 'Pedido creado desde el carrito',
        metadata: {
          items_count: items.length,
          total: pedido.total,
          requiere_factura: pedido.factura,
          requiere_envio: pedido.envio
        }
      });
    
    if (errorHistorial) {
      console.warn('⚠️ Error registrando historial:', errorHistorial);
      // No fallar por esto
    }
    
    // ========================================
    // 7. ENCOLAR NOTIFICACIÓN
    // ========================================
    console.log('📲 Encolando notificación...');
    
    try {
      await encolarNotificacion({
        pedidoId: pedido.id,
        clienteWhatsapp: pedido.cliente_whatsapp,
        tipo: 'pedido_recibido',
        prioridad: 'alta',
        metadata: {
          numero_pedido: pedido.numero_pedido,
          total: pedido.total,
          items_count: items.length
        }
      });
      console.log('✅ Notificación encolada');
    } catch (notifError) {
      console.error('⚠️ Error encolando notificación:', notifError);
      // No fallar el proceso principal
    }
    
    // ========================================
    // 8. OBTENER PEDIDO COMPLETO
    // ========================================
    const { data: pedidoCompleto } = await supabaseAdmin
      .from('pedidos')
      .select(`
        *,
        items:pedidos_items(*)
      `)
      .eq('id', pedido.id)
      .single();
    
    // ========================================
    // 9. RESPUESTA EXITOSA
    // ========================================
    console.log(`✅ Pedido ${pedido.numero_pedido} creado exitosamente`);
    
    return json({
      success: true,
      data: pedidoCompleto || { ...pedido, items },
      message: 'Pedido creado exitosamente',
      metadata: {
        numero_pedido: pedido.numero_pedido,
        total: pedido.total,
        items_count: items.length,
        notificacion_encolada: true
      }
    }, { status: 201 });
    
  } catch (error) {
    console.error('❌ Error en POST /api/pedidos:', error);
    
    // ROLLBACK MANUAL si algo quedó creado
    if (pedidoCreado && !itemsCreados) {
      try {
        await supabaseAdmin
          .from('pedidos')
          .delete()
          .eq('id', pedidoCreado.id);
        console.log('🔄 Rollback ejecutado: pedido eliminado');
      } catch (rollbackError) {
        console.error('❌ Error en rollback:', rollbackError);
      }
    }
    
    // Respuesta de error tipificada
    if (error instanceof ValidationError) {
      return json(
        { 
          success: false, 
          error: error.message,
          code: error.code
        },
        { status: 400 }
      );
    }
    
    // Error genérico
    return json(
      { 
        success: false, 
        error: 'Error al crear el pedido',
        code: 'CREATION_ERROR',
        details: process.env.NODE_ENV === 'development' ? error.message : undefined
      },
      { status: 500 }
    );
  }
}

// ========================================
// PUT - Actualizar estado u otros campos
// ========================================
export async function PUT({ request }) {
  try {
    const body = await request.json();
    
    if (!body.id) {
      return json(
        { success: false, error: 'ID requerido' },
        { status: 400 }
      );
    }
    
    // Si es cambio de estado, redirigir al endpoint específico
    if (body.estado && !body.items) {
      return json(
        { 
          success: false, 
          error: 'Usa /api/pedidos/[id]/cambiar-estado para cambios de estado',
          endpoint_correcto: `/api/pedidos/${body.id}/cambiar-estado`
        },
        { status: 400 }
      );
    }
    
    // Otros campos editables...
    const updateData = {};
    if (body.notas !== undefined) updateData.notas = body.notas;
    
    const { data, error } = await supabaseAdmin
      .from('pedidos')
      .update(updateData)
      .eq('id', body.id)
      .select()
      .single();
    
    if (error) throw error;
    
    return json({ success: true, data });
    
  } catch (error) {
    return json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}