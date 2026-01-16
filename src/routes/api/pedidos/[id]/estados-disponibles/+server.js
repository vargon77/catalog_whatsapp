// src/routes/api/pedidos/[id]/estados-disponibles/+server.js
import { json } from '@sveltejs/kit';
import { supabaseAdmin } from '$lib/supabaseServer';
import { TRANSICIONES_PERMITIDAS } from '$lib/server/pedidos/estados';

/**
 * GET - Obtener estados disponibles para un pedido según transiciones permitidas
 */
export async function GET({ params }) {
  try {
    const { id } = params;
    
    // Obtener pedido actual
    const { data: pedido, error } = await supabaseAdmin
      .from('pedidos')
      .select('estado, estado_pago')
      .eq('id', id)
      .single();
    
    if (error || !pedido) {
      return json(
        { success: false, error: 'Pedido no encontrado' },
        { status: 404 }
      );
    }
    
    // Obtener transiciones permitidas desde el estado actual
    const estadosDisponibles = TRANSICIONES_PERMITIDAS[pedido.estado] || [];
    
    return json({
      success: true,
      data: estadosDisponibles,
      metadata: {
        estado_actual: pedido.estado,
        estado_pago: pedido.estado_pago
      }
    });
    
  } catch (error) {
    console.error('Error obteniendo estados disponibles:', error);
    return json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}