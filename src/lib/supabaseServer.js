// src/lib/supabaseServer.js
import { createClient } from '@supabase/supabase-js';
import { PUBLIC_SUPABASE_URL } from '$env/static/public';
import { SUPABASE_SERVICE_ROLE_KEY } from '$env/static/private';

// Cliente con service_role key (SOLO para servidor)
// ⚠️ NUNCA exponer esta key al cliente
export const supabaseAdmin = createClient(
  PUBLIC_SUPABASE_URL,
  SUPABASE_SERVICE_ROLE_KEY,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  }
);

// ========================================
// FUNCIONES ADMINISTRATIVAS
// ========================================

/**
 * Verificar si un usuario admin es válido (para autenticación)
 */
export async function verificarAdminToken(token) {
  try {
    // Aquí validarías el token JWT o session
    // Por ahora, usamos la validación simple del authStore
    return { valid: true };
  } catch (error) {
    return { valid: false, error: error.message };
  }
}

/**
 * Obtener estadísticas generales del dashboard
 */
export async function obtenerEstadisticasDashboard() {
  try {
    // Productos totales
    const { count: productosTotal } = await supabaseAdmin
      .from('productos')
      .select('*', { count: 'exact', head: true });

    // Pedidos hoy
    const hoy = new Date().toISOString().split('T')[0];
    const { count: pedidosHoy } = await supabaseAdmin
      .from('pedidos')
      .select('*', { count: 'exact', head: true })
      .gte('created_at', hoy);

    // Pedidos pendientes
    const { count: pedidosPendientes } = await supabaseAdmin
      .from('pedidos')
      .select('*', { count: 'exact', head: true })
      .eq('estado', 'pendiente');

    // Ingresos del mes
    const inicioMes = new Date();
    inicioMes.setDate(1);
    inicioMes.setHours(0, 0, 0, 0);

    const { data: pedidosMes } = await supabaseAdmin
      .from('pedidos')
      .select('total')
      .gte('created_at', inicioMes.toISOString())
      .eq('estado', 'entregado');

    const ingresosMes = pedidosMes?.reduce((sum, p) => sum + parseFloat(p.total), 0) || 0;

    // Productos bajo stock
    const { count: productosBajoStock } = await supabaseAdmin
      .from('productos')
      .select('*', { count: 'exact', head: true })
      .lte('stock', 'stock_minimo');

    return {
      productosTotal: productosTotal || 0,
      pedidosHoy: pedidosHoy || 0,
      pedidosPendientes: pedidosPendientes || 0,
      ingresosMes: ingresosMes,
      productosBajoStock: productosBajoStock || 0,
      crecimientoVentas: 0 // Calcular comparando con mes anterior
    };
  } catch (error) {
    console.error('Error obteniendo estadísticas:', error);
    return null;
  }
}