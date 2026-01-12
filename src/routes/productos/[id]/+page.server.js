// src/routes/productos/[id]/+page.server.js
import { error } from '@sveltejs/kit';
import { supabase } from '$lib/supabaseClient';

export async function load({ params }) {
  const { id } = params;
  
  // Cargar producto con relaciones
  const { data: producto, error: errorProducto } = await supabase
    .from('productos')
    .select(`
      *,
      categoria:categorias(id, nombre),
      marca:marcas(id, nombre)
    `)
    .eq('id', id)
    .single();
  
  if (errorProducto || !producto) {
    throw error(404, 'Producto no encontrado');
  }
  
  // Cargar configuración
  const { data: configuracion } = await supabase
    .from('configuracion')
    .select('*')
    .single();
  
  // Productos relacionados (misma categoría, excluir actual)
  const { data: relacionados } = await supabase
    .from('productos')
    .select(`
      *,
      categoria:categorias(id, nombre)
    `)
    .eq('categoria_id', producto.categoria_id)
    .neq('id', id)
    .eq('activo', true)
    .limit(4);
  
  return {
    producto,
    configuracion: configuracion || {
      nombre_empresa: 'CatálogoExpress',
      moneda_simbolo: '$',
      whatsapp_numero: '7121920418'
    },
    relacionados: relacionados || []
  };
}