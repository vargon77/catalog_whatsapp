// src/routes/(tienda)/carrito/mis-pedidos/[id]/+page.server.js
import { error } from '@sveltejs/kit';
import { supabaseAdmin } from '$lib/supabaseServer';

export async function load({ params, url }) {
  try {
    const { id } = params;
    const whatsapp = url.searchParams.get('whatsapp');
    
    // Obtener pedido con items
    const { data: pedido, error: errorPedido } = await supabaseAdmin
      .from('pedidos')
      .select(`
        *,
        items:pedidos_items(*)
      `)
      .eq('id', id)
      .single();
    
    if (errorPedido || !pedido) {
      throw error(404, 'Pedido no encontrado');
    }
    
    // Verificar que el whatsapp coincida (seguridad básica)
    if (whatsapp && pedido.cliente_whatsapp !== whatsapp) {
      throw error(403, 'No autorizado');
    }
    
    // Obtener configuración
    const { data: configuracion } = await supabaseAdmin
      .from('configuracion')
      .select('nombre_empresa, whatsapp_numero')
      .single();
    
    return {
      pedido,
      configuracion
    };
    
  } catch (err) {
    console.error('Error en load:', err);
    throw error(500, 'Error al cargar el pedido');
  }
}