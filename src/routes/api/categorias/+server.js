// src/routes/api/categorias/+server.js
//x
import { json } from '@sveltejs/kit';
import { supabaseAdmin } from '$lib/supabaseServer';
import { generateSlug } from '$lib/supabaseClient';

// ========================================
// GET - Listar categorías
// ========================================
export async function GET({ url }) {
  try {
    const activas = url.searchParams.get('activas');
    
    let query = supabaseAdmin
      .from('categorias')
      .select('*')
      .order('orden', { ascending: true });
    
    if (activas === 'true') {
      query = query.eq('activo', true);
    }
    
    const { data, error } = await query;
    
    if (error) throw error;
    
    return json({
      success: true,
      data
    });
  } catch (error) {
    console.error('Error GET categorías:', error);
    return json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}

// ========================================
// POST - Crear categoría
// ========================================
export async function POST({ request }) {
  try {
    const body = await request.json();
    
    if (!body.nombre) {
      return json(
        { success: false, error: 'El nombre es requerido' },
        { status: 400 }
      );
    }
    
    // Generar slug único
    let slug = body.slug || generateSlug(body.nombre);
    
    // Verificar slug único
    const { data: existingSlug } = await supabaseAdmin
      .from('categorias')
      .select('slug')
      .eq('slug', slug)
      .single();
    
    if (existingSlug) {
      slug = `${slug}-${Date.now()}`;
    }
    
    const categoriaData = {
      nombre: body.nombre,
      descripcion: body.descripcion || null,
      slug,
      orden: body.orden || 0,
      activo: body.activo !== undefined ? body.activo : true
    };
    
    const { data, error } = await supabaseAdmin
      .from('categorias')
      .insert(categoriaData)
      .select()
      .single();
    
    if (error) throw error;
    
    return json({
      success: true,
      data,
      message: 'Categoría creada exitosamente'
    }, { status: 201 });
    
  } catch (error) {
    console.error('Error POST categoría:', error);
    return json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}

// ========================================
// PUT - Actualizar categoría
// ========================================
export async function PUT({ request }) {
  try {
    const body = await request.json();
    
    if (!body.id) {
      return json(
        { success: false, error: 'ID de categoría requerido' },
        { status: 400 }
      );
    }
    
    const updateData = {};
    const camposPermitidos = ['nombre', 'descripcion', 'slug', 'orden', 'activo'];
    
    camposPermitidos.forEach(campo => {
      if (body[campo] !== undefined) {
        updateData[campo] = body[campo];
      }
    });
    
    const { data, error } = await supabaseAdmin
      .from('categorias')
      .update(updateData)
      .eq('id', body.id)
      .select()
      .single();
    
    if (error) throw error;
    
    return json({
      success: true,
      data,
      message: 'Categoría actualizada exitosamente'
    });
    
  } catch (error) {
    console.error('Error PUT categoría:', error);
    return json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}

// ========================================
// DELETE - Eliminar categoría
// ========================================
export async function DELETE({ url }) {
  try {
    const id = url.searchParams.get('id');
    
    if (!id) {
      return json(
        { success: false, error: 'ID de categoría requerido' },
        { status: 400 }
      );
    }
    
    // Soft delete
    const { data, error } = await supabaseAdmin
      .from('categorias')
      .update({ activo: false })
      .eq('id', id)
      .select()
      .single();
    
    if (error) throw error;
    
    return json({
      success: true,
      data,
      message: 'Categoría eliminada exitosamente'
    });
    
  } catch (error) {
    console.error('Error DELETE categoría:', error);
    return json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}