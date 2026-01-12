// src/routes/(admin)/reportes/+page.server.js
import { supabase } from '$lib/supabaseClient';
import { format, subDays, startOfMonth, endOfMonth } from 'date-fns';

export async function load() {
  try {
    // Cargar datos básicos para los filtros
    const [categorias, marcas, estados] = await Promise.all([
      // Categorías activas
      supabase
        .from('categorias')
        .select('id, nombre')
        .eq('activo', true)
        .order('nombre'),
      
      // Marcas activas
      supabase
        .from('marcas')
        .select('id, nombre')
        .eq('activo', true)
        .order('nombre'),
      
      // Estados únicos de pedidos
      Promise.resolve({
        data: [
          { value: 'pendiente', label: 'Pendiente', color: 'yellow' },
          { value: 'confirmado', label: 'Confirmado', color: 'blue' },
          { value: 'preparando', label: 'Preparando', color: 'purple' },
          { value: 'enviado', label: 'Enviado', color: 'indigo' },
          { value: 'entregado', label: 'Entregado', color: 'green' },
          { value: 'cancelado', label: 'Cancelado', color: 'red' }
        ]
      })
    ]);

    // Estadísticas rápidas del mes actual
    const inicioMes = format(startOfMonth(new Date()), 'yyyy-MM-dd');
    const finMes = format(endOfMonth(new Date()), 'yyyy-MM-dd');

    const { data: pedidosMes } = await supabase
      .from('pedidos')
      .select('total, estado')
      .gte('created_at', inicioMes)
      .lte('created_at', finMes);

    const estadisticas = {
      totalVentas: pedidosMes?.reduce((sum, p) => sum + parseFloat(p.total), 0) || 0,
      totalPedidos: pedidosMes?.length || 0,
      ticketPromedio: pedidosMes?.length 
        ? (pedidosMes.reduce((sum, p) => sum + parseFloat(p.total), 0) / pedidosMes.length)
        : 0,
      pedidosPorEstado: pedidosMes?.reduce((acc, p) => {
        acc[p.estado] = (acc[p.estado] || 0) + 1;
        return acc;
      }, {}) || {}
    };

    return {
      categorias: categorias.data || [],
      marcas: marcas.data || [],
      estados: estados.data || [],
      estadisticasIniciales: estadisticas
    };

  } catch (error) {
    console.error('Error cargando datos de reportes:', error);
    return {
      categorias: [],
      marcas: [],
      estados: [],
      estadisticasIniciales: null
    };
  }
}