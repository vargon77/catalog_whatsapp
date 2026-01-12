//src/routes/(admin)/productos/[id]/editar/+page.server.js
import { error } from '@sveltejs/kit';
import { supabase } from '$lib/supabaseClient';

export async function load({ params }) {
  const { id } = params;
  
  const { data: producto, error: errorProducto } = await supabase
    .from('productos')
    .select('*, categoria:categorias(id, nombre)')
    .eq('id', id)
    .single();
  
  if (errorProducto || !producto) {
    throw error(404, 'Producto no encontrado');
  }
  
  const { data: categorias } = await supabase
    .from('categorias')
    .select('id, nombre')
    .eq('activo', true)
    .order('nombre');
  
  return { producto, categorias: categorias || [] };
}