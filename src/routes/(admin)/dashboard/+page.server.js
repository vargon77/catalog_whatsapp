// src/routes/(admin)/dashboard/+page.server.js
import { obtenerEstadisticasDashboard } from '$lib/supabaseServer';
import { supabase } from '$lib/supabaseClient';

export async function load() {
  try {
    // Obtener estadísticas
    const estadisticas = await obtenerEstadisticasDashboard();
    
    // Obtener pedidos recientes
    const { data: pedidosRecientes } = await supabase
      .from('vista_pedidos_resumen')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(5);
    
    // Obtener productos populares (simulado por ahora)
    const { data: productosPopulares } = await supabase
      .from('productos')
      .select('id, nombre, imagen_url, stock, precio')
      .eq('activo', true)
      .eq('destacado', true)
      .limit(5);
    
    return {
      estadisticas: estadisticas || {
        productosTotal: 0,
        pedidosHoy: 0,
        pedidosPendientes: 0,
        ingresosMes: 0,
        productosBajoStock: 0,
        crecimientoVentas: 0
      },
      pedidosRecientes: pedidosRecientes || [],
      productosPopulares: productosPopulares || []
    };
  } catch (error) {
    console.error('Error en dashboard load:', error);
    return {
      estadisticas: {
        productosTotal: 0,
        pedidosHoy: 0,
        pedidosPendientes: 0,
        ingresosMes: 0,
        productosBajoStock: 0,
        crecimientoVentas: 0
      },
      pedidosRecientes: [],
      productosPopulares: []
    };
  }
}