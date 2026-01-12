// src/routes/api/productos/+server.js
import { json } from '@sveltejs/kit';
import { supabase } from '$lib/supabaseClient';
import { supabaseAdmin } from '$lib/supabaseServer'; // ✅ IMPORTAR ADMIN

function generateSlug(nombre) {
  return nombre
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
}

async function ensureUniqueSlug(baseSlug, excludeId = null) {
  let slug = baseSlug;
  let counter = 1;
  
  while (true) {
    // ✅ Usar cliente público para lectura (más rápido y no consume service_role)
    const query = supabase
      .from('productos')
      .select('id')
      .eq('slug', slug);
    
    if (excludeId) {
      query.neq('id', excludeId);
    }
    
    const { data, error } = await query;
    
    if (error) {
      console.error('Error checking slug:', error);
      throw error;
    }
    
    if (!data || data.length === 0) {
      return slug;
    }
    
    slug = `${baseSlug}-${counter}`;
    counter++;
  }
}

// ✅ GET puede usar cliente público (solo lectura)
export async function GET({ url }) {
  try {
    const destacado = url.searchParams.get('destacado');
    const categoria_id = url.searchParams.get('categoria_id');
    
    let query = supabase
      .from('productos')
      .select(`
        *,
        categoria:categorias(id, nombre, slug)
      `)
      .order('created_at', { ascending: false });
    
    if (destacado === 'true') {
      query = query.eq('destacado', true);
    }
    
    if (categoria_id) {
      query = query.eq('categoria_id', categoria_id);
    }
    
    const { data, error } = await query;
    
    if (error) throw error;
    
    return json(data || []);
  } catch (error) {
    console.error('Error en GET /api/productos:', error);
    return json({ error: error.message }, { status: 500 });
  }
}

// ✅ POST debe usar supabaseAdmin
export async function POST({ request }) {
  try {
    const body = await request.json();
    console.log('📥 Datos recibidos:', body);
    
    if (!body.nombre?.trim()) {
      return json({ error: 'El nombre es obligatorio' }, { status: 400 });
    }
    
    if (!body.categoria_id) {
      return json({ error: 'La categoría es obligatoria' }, { status: 400 });
    }
    
    const precio = body.precio ? parseFloat(body.precio) : 0;
    const stock = body.stock !== '' && body.stock !== null ? parseInt(body.stock) : null;
    const precio_oferta = body.precio_oferta ? parseFloat(body.precio_oferta) : null;
    
    if (isNaN(precio)) {
      return json({ error: 'El precio debe ser un número válido' }, { status: 400 });
    }
    
    if (stock !== null && isNaN(stock)) {
      return json({ error: 'El stock debe ser un número válido' }, { status: 400 });
    }
    
    const baseSlug = body.slug?.trim() || generateSlug(body.nombre);
    const slug = await ensureUniqueSlug(baseSlug);
    
    const productoData = {
      nombre: body.nombre.trim(),
      descripcion_corta: body.descripcion_corta?.trim() || null,
      descripcion_larga: body.descripcion_larga?.trim() || null,
      precio,
      stock,
      categoria_id: body.categoria_id,
      marca_id: body.marca_id || null,
      imagen_url: body.imagen_url?.trim() || null,
      destacado: Boolean(body.destacado),
      activo: body.activo !== false,
      slug,
      precio_oferta,
      sku: body.sku?.trim() || null
    };
    
    console.log('💾 Insertando producto con supabaseAdmin:', productoData);
    
    // ✅ CORRECCIÓN: Usar supabaseAdmin en lugar de supabase
    const { data, error } = await supabaseAdmin
      .from('productos')
      .insert([productoData])
      .select(`
        *,
        categoria:categorias(id, nombre, slug)
      `)
      .single();
    
    if (error) {
      console.error('❌ Error de Supabase:', error);
      
      if (error.code === '23505') {
        return json({ error: 'Ya existe un producto con ese slug' }, { status: 409 });
      }
      
      throw error;
    }
    
    console.log('✅ Producto creado:', data);
    return json(data, { status: 201 });
    
  } catch (error) {
    console.error('❌ Error en POST /api/productos:', error);
    return json({ 
      error: 'Error al crear el producto',
      details: error.message 
    }, { status: 500 });
  }
}

// ✅ PUT debe usar supabaseAdmin
export async function PUT({ request }) {
  try {
    const body = await request.json();
    const { id, ...updateData } = body;
    
    if (!id) {
      return json({ error: 'ID del producto requerido' }, { status: 400 });
    }
    
    if (updateData.precio !== undefined) {
      updateData.precio = parseFloat(updateData.precio);
    }
    
    if (updateData.stock !== undefined && updateData.stock !== '') {
      updateData.stock = parseInt(updateData.stock);
    }
    
    if (updateData.precio_oferta !== undefined && updateData.precio_oferta !== '') {
      updateData.precio_oferta = parseFloat(updateData.precio_oferta);
    }
    
    if (updateData.nombre) {
      const baseSlug = updateData.slug || generateSlug(updateData.nombre);
      updateData.slug = await ensureUniqueSlug(baseSlug, id);
    }
    
    console.log('📤 Actualizando producto con supabaseAdmin:', id, updateData);
    
    // ✅ CORRECCIÓN: Usar supabaseAdmin
    const { data, error } = await supabaseAdmin
      .from('productos')
      .update(updateData)
      .eq('id', id)
      .select(`
        *,
        categoria:categorias(id, nombre, slug)
      `)
      .single();
    
    if (error) throw error;
    
    console.log('✅ Producto actualizado:', data);
    return json(data);
  } catch (error) {
    console.error('❌ Error en PUT /api/productos:', error);
    return json({ error: error.message }, { status: 500 });
  }
}

// ✅ DELETE debe usar supabaseAdmin
export async function DELETE({ url }) {
  try {
    const id = url.searchParams.get('id');
    
    if (!id) {
      return json({ error: 'ID del producto requerido' }, { status: 400 });
    }
    
    console.log('🗑️ Eliminando producto con supabaseAdmin:', id);
    
    // ✅ CORRECCIÓN: Usar supabaseAdmin
    const { error } = await supabaseAdmin
      .from('productos')
      .delete()
      .eq('id', id);
    
    if (error) throw error;
    
    console.log('✅ Producto eliminado:', id);
    return json({ success: true });
  } catch (error) {
    console.error('❌ Error en DELETE /api/productos:', error);
    return json({ error: error.message }, { status: 500 });
  }
}