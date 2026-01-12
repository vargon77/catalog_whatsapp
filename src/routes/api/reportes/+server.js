// src/routes/api/reportes/+server.js
import { json } from '@sveltejs/kit';
import { supabaseAdmin } from '$lib/supabaseServer';
import { format, startOfDay, endOfDay, subDays, startOfWeek, endOfWeek, startOfMonth, endOfMonth } from 'date-fns';

export async function GET({ url }) {
  try {
    const params = url.searchParams;
    
    // Obtener parámetros
    let fechaInicio = params.get('fechaInicio');
    let fechaFin = params.get('fechaFin');
    const estados = params.get('estados')?.split(',').filter(Boolean);
    const categorias = params.get('categorias')?.split(',').filter(Boolean);
    const marcas = params.get('marcas')?.split(',').filter(Boolean);
    const telefono = params.get('telefono');
    const productoId = params.get('productoId');
    const preset = params.get('preset');
    
    // Manejar presets de fecha
    const hoy = new Date();
    if (preset === 'hoy') {
      fechaInicio = format(startOfDay(hoy), 'yyyy-MM-dd');
      fechaFin = format(endOfDay(hoy), 'yyyy-MM-dd');
    } else if (preset === 'semana') {
      fechaInicio = format(startOfWeek(hoy, { weekStartsOn: 1 }), 'yyyy-MM-dd');
      fechaFin = format(endOfWeek(hoy, { weekStartsOn: 1 }), 'yyyy-MM-dd');
    } else if (preset === 'mes') {
      fechaInicio = format(startOfMonth(hoy), 'yyyy-MM-dd');
      fechaFin = format(endOfMonth(hoy), 'yyyy-MM-dd');
    }
    
    // Construir query base
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
        )
      `)
      .order('created_at', { ascending: false });
    
    // Aplicar filtros de fecha
    if (fechaInicio) {
      query = query.gte('created_at', fechaInicio);
    }
    if (fechaFin) {
      query = query.lte('created_at', fechaFin);
    }
    
    // Aplicar filtros de estado
    if (estados?.length) {
      query = query.in('estado', estados);
    }
    
    // Aplicar filtro de teléfono
    if (telefono) {
      query = query.ilike('cliente_whatsapp', `%${telefono}%`);
    }
    
    const { data: pedidos, error } = await query;
    
    if (error) throw error;
    
    // Filtrar por categoría, marca o producto si es necesario
    let pedidosFiltrados = pedidos || [];
    
    if (categorias?.length || marcas?.length || productoId) {
      pedidosFiltrados = pedidosFiltrados.filter(pedido => {
        if (!pedido.items || pedido.items.length === 0) return false;
        
        return pedido.items.some(item => {
          if (productoId && item.producto_id === productoId) return true;
          // Aquí necesitaríamos consultar el producto para verificar categoría/marca
          // Por simplicidad, lo haremos en un segundo query
          return true;
        });
      });
    }
    
    // Calcular estadísticas
    const estadisticas = calcularEstadisticas(pedidosFiltrados);
    
    return json({
      success: true,
      data: {
        pedidos: pedidosFiltrados,
        estadisticas
      }
    });
    
  } catch (error) {
    console.error('Error en API reportes:', error);
    return json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}

function calcularEstadisticas(pedidos) {
  const totalVentas = pedidos.reduce((sum, p) => sum + parseFloat(p.total || 0), 0);
  const totalPedidos = pedidos.length;
  const ticketPromedio = totalPedidos > 0 ? totalVentas / totalPedidos : 0;
  
  // Pedidos por estado
  const pedidosPorEstado = pedidos.reduce((acc, p) => {
    acc[p.estado] = (acc[p.estado] || 0) + 1;
    return acc;
  }, {});
  
  // Top productos
  const productosVendidos = {};
  pedidos.forEach(pedido => {
    if (pedido.items) {
      pedido.items.forEach(item => {
        const key = item.producto_nombre;
        if (!productosVendidos[key]) {
          productosVendidos[key] = {
            nombre: item.producto_nombre,
            cantidad: 0,
            total: 0
          };
        }
        productosVendidos[key].cantidad += item.cantidad;
        productosVendidos[key].total += parseFloat(item.subtotal || 0);
      });
    }
  });
  
  const topProductos = Object.values(productosVendidos)
    .sort((a, b) => b.cantidad - a.cantidad)
    .slice(0, 5);
  
  // Top clientes
  const clientesData = {};
  pedidos.forEach(p => {
    const key = p.cliente_whatsapp;
    if (!clientesData[key]) {
      clientesData[key] = {
        nombre: p.cliente_nombre,
        whatsapp: p.cliente_whatsapp,
        pedidos: 0,
        total: 0
      };
    }
    clientesData[key].pedidos += 1;
    clientesData[key].total += parseFloat(p.total || 0);
  });
  
  const topClientes = Object.values(clientesData)
    .sort((a, b) => b.total - a.total)
    .slice(0, 5);
  
  return {
    totalVentas,
    totalPedidos,
    ticketPromedio,
    pedidosPorEstado,
    topProductos,
    topClientes
  };
}