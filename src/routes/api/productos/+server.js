// src/routes/api/productos/+server.js
//revisar x
import { json } from '@sveltejs/kit';
import { supabase } from '$lib/supabaseClient';

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
      query = query.eq('categoria_id', parseInt(categoria_id));
    }
    
    const { data, error } = await query;
    
    if (error) throw error;
    
    return json(data || []);
  } catch (error) {
    console.error('Error en GET /api/productos:', error);
    return json({ error: error.message }, { status: 500 });
  }
}

export async function POST({ request }) {
  try {
    const body = await request.json();
    console.log('📥 Datos recibidos:', body);
    
    // Validaciones
    if (!body.nombre?.trim()) {
      return json({ error: 'El nombre es obligatorio' }, { status: 400 });
    }
    
    if (!body.categoria_id) {
      return json({ error: 'La categoría es obligatoria' }, { status: 400 });
    }
    
    // Conversiones y preparación de datos
    const precio = body.precio ? parseFloat(body.precio) : 0;
    const stock = body.stock !== '' && body.stock !== null ? parseInt(body.stock) : null;
    const precio_oferta = body.precio_oferta ? parseFloat(body.precio_oferta) : 0;
    
    if (isNaN(precio)) {
      return json({ error: 'El precio debe ser un número válido' }, { status: 400 });
    }
    
    if (stock !== null && isNaN(stock)) {
      return json({ error: 'El stock debe ser un número válido' }, { status: 400 });
    }
    
    // Generar slug único
    const baseSlug = body.slug?.trim() || generateSlug(body.nombre);
    const slug = await ensureUniqueSlug(baseSlug);
    
    const productoData = {
      nombre: body.nombre.trim(),
      descripcion_corta: body.descripcion_corta?.trim() || null,
      descripcion_larga: body.descripcion_larga?.trim() || null,
      precio,
      stock,
      categoria_id: parseInt(body.categoria_id),
      marca_id: body.marca_id ? parseInt(body.marca_id) : null,  
      imagen_url: body.imagen_url?.trim() || null,
      destacado: Boolean(body.destacado),
      activo: body.activo !== false,
      slug,
      precio_oferta,
      sku: body.sku?.trim() || null
    };
    
    console.log('💾 Insertando producto:', productoData);
    
    const { data, error } = await supabase
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

export async function PUT({ request }) {
  try {
    const body = await request.json();
    const { id, ...updateData } = body;
    
    if (!id) {
      return json({ error: 'ID del producto requerido' }, { status: 400 });
    }
    
    // Conversiones
    if (updateData.precio !== undefined) {
      updateData.precio = parseFloat(updateData.precio);
    }
    
    if (updateData.stock !== undefined && updateData.stock !== '') {
      updateData.stock = parseInt(updateData.stock);
    }
    
    if (updateData.precio_oferta !== undefined) {
      updateData.precio_oferta = parseFloat(updateData.precio_oferta);
    }
    
    // Actualizar slug si cambió el nombre
    if (updateData.nombre) {
      const baseSlug = updateData.slug || generateSlug(updateData.nombre);
      updateData.slug = await ensureUniqueSlug(baseSlug, id);
    }
    
    const { data, error } = await supabase
      .from('productos')
      .update(updateData)
      .eq('id', id)
      .select(`
        *,
        categoria:categorias(id, nombre, slug)
      `)
      .single();
    
    if (error) throw error;
    
    return json(data);
  } catch (error) {
    console.error('Error en PUT /api/productos:', error);
    return json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE({ url }) {
  try {
    const id = url.searchParams.get('id');
    
    if (!id) {
      return json({ error: 'ID del producto requerido' }, { status: 400 });
    }
    
    const { error } = await supabase
      .from('productos')
      .delete()
      .eq('id', parseInt(id));
    
    if (error) throw error;
    
    return json({ success: true });
  } catch (error) {
    console.error('Error en DELETE /api/productos:', error);
    return json({ error: error.message }, { status: 500 });
  }
}