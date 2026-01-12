// src/routes/api/pedidos/[id]/historial/+server.js
import { json } from '@sveltejs/kit';
import { supabaseAdmin } from '$lib/supabaseServer';

/**
 * GET - Obtener historial de cambios de un pedido
 */
export async function GET({ params }) {
  try {
    const { id } = params;
    
    const { data, error } = await supabaseAdmin
      .from('pedidos_historial')
      .select('*')
      .eq('pedido_id', id)
      .order('created_at', { ascending: false });
    
    if (error) throw error;
    
    return json({
      success: true,
      data: data || []
    });
    
  } catch (error) {
    console.error('Error obteniendo historial:', error);
    return json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}