// src/routes/api/clientes/+server.js
import { json } from '@sveltejs/kit';
import { supabase } from '$lib/supabaseClient';

// ========================================
// GET - Buscar clientes
// ========================================
export async function GET({ url }) {
  try {
    const busqueda = url.searchParams.get('busqueda');
    
    if (!busqueda || busqueda.length < 3) {
      return json({
        success: true,
        data: []
      });
    }
    
    // Buscar por nombre o whatsapp
    let query = supabase
      .from('clientes')
      .select(`
        id,
        nombre,
        whatsapp,
        email,
        telefono,
        direccion,
        created_at
      `)
      .order('created_at', { ascending: false })
      .limit(10);
    
    // Buscar en nombre o whatsapp
    query = query.or(`nombre.ilike.%${busqueda}%,whatsapp.ilike.%${busqueda}%`);
    
    const { data, error } = await query;
    
    if (error) throw error;
    
    // Contar pedidos por cliente
    const clientesConPedidos = await Promise.all(
      (data || []).map(async (cliente) => {
        const { count } = await supabase
          .from('pedidos')
          .select('*', { count: 'exact', head: true })
          .eq('cliente_id', cliente.id);
        
        return {
          ...cliente,
          total_pedidos: count || 0
        };
      })
    );
    
    return json({
      success: true,
      data: clientesConPedidos
    });
    
  } catch (error) {
    console.error('Error GET clientes:', error);
    return json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}