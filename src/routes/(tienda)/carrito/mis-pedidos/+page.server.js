// src/routes/(tienda)/carrito/mis-pedidos/+page.server.js
import { supabaseAdmin } from '$lib/supabaseServer';

export async function load() {
  try {
    // Cargar configuración para el título
    const { data: configuracion } = await supabaseAdmin
      .from('configuracion')
      .select('nombre_empresa')
      .single();
    
    return {
      configuracion
    };
    
  } catch (error) {
    console.error('Error en load:', error);
    return {
      configuracion: null
    };
  }
}