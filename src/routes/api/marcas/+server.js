// src/routes/api/marcas/+server.js

import { json } from '@sveltejs/kit';
import { supabase } from '$lib/supabaseClient';
import { supabaseAdmin } from '$lib/supabaseServer';

// ========================================
// GET - Listar marcas (puede usar cliente público)
// ========================================
export async function GET({ url }) {
  try {
    const activas = url.searchParams.get('activas');
    
    let query = supabase
      .from('marcas')
      .select('*')
      .order('nombre', { ascending: true });
    
    if (activas === 'true') {
      query = query.eq('activo', true);
    }
    
    const { data, error } = await query;
    
    if (error) throw error;
    
    return json({
      success: true,
      data: data || []
    });
  } catch (error) {
    console.error('Error GET marcas:', error);
    return json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}

// ========================================
// POST - Crear marca
// ✅ CORRECCIÓN: Usar supabaseAdmin
// ========================================
export async function POST({ request }) {
  try {
    const body = await request.json();
    
    // Validaciones
    if (!body.nombre?.trim()) {
      return json(
        { success: false, error: 'El nombre es obligatorio' },
        { status: 400 }
      );
    }
    
    const marcaData = {
      nombre: body.nombre.trim(),
      descripcion: body.descripcion?.trim() || null,
      logo_url: body.logo_url?.trim() || null,
      activo: body.activo !== false
    };
    
    console.log('📤 Creando marca con supabaseAdmin:', marcaData);
    
    // ✅ CORRECCIÓN: Usar supabaseAdmin en lugar de supabase
    const { data, error } = await supabaseAdmin
      .from('marcas')
      .insert([marcaData])
      .select()
      .single();
    
    if (error) {
      console.error('❌ Error Supabase:', error);
      if (error.code === '23505') {
        return json(
          { success: false, error: 'Ya existe una marca con ese nombre' },
          { status: 409 }
        );
      }
      throw error;
    }
    
    console.log('✅ Marca creada:', data);
    
    return json({
      success: true,
      data,
      message: 'Marca creada exitosamente'
    }, { status: 201 });
    
  } catch (error) {
    console.error('❌ Error POST marca:', error);
    return json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}

// ========================================
// PUT - Actualizar marca
// ✅ CORRECCIÓN: Usar supabaseAdmin
// ========================================
export async function PUT({ request }) {
  try {
    const body = await request.json();
    
    if (!body.id) {
      return json(
        { success: false, error: 'ID de marca requerido' },
        { status: 400 }
      );
    }
    
    const updateData = {};
    const camposPermitidos = ['nombre', 'descripcion', 'logo_url', 'activo'];
    
    camposPermitidos.forEach(campo => {
      if (body[campo] !== undefined) {
        updateData[campo] = body[campo];
      }
    });
    
    // Si se actualiza el nombre, trim
    if (updateData.nombre) {
      updateData.nombre = updateData.nombre.trim();
    }
    
    console.log('📤 Actualizando marca con supabaseAdmin:', updateData);
    
    // ✅ CORRECCIÓN: Usar supabaseAdmin en lugar de supabase
    const { data, error } = await supabaseAdmin
      .from('marcas')
      .update(updateData)
      .eq('id', body.id)
      .select()
      .single();
    
    if (error) throw error;
    
    console.log('✅ Marca actualizada:', data);
    
    return json({
      success: true,
      data,
      message: 'Marca actualizada exitosamente'
    });
    
  } catch (error) {
    console.error('❌ Error PUT marca:', error);
    return json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}

// ========================================
// DELETE - Eliminar marca
// ✅ CORRECCIÓN: Usar supabaseAdmin
// ========================================
export async function DELETE({ url }) {
  try {
    const id = url.searchParams.get('id');
    
    if (!id) {
      return json(
        { success: false, error: 'ID de marca requerido' },
        { status: 400 }
      );
    }
    
    // Verificar si hay productos usando esta marca (puede usar cliente público para lectura)
    const { data: productosConMarca, error: errorCheck } = await supabase
      .from('productos')
      .select('id')
      .eq('marca_id', id)
      .limit(1);
    
    if (errorCheck) throw errorCheck;
    
    if (productosConMarca && productosConMarca.length > 0) {
      return json(
        { 
          success: false, 
          error: 'No se puede eliminar. Hay productos usando esta marca. Primero elimina o reasigna los productos.' 
        },
        { status: 409 }
      );
    }
    
    // ✅ CORRECCIÓN: Usar supabaseAdmin para eliminar
    const { error } = await supabaseAdmin
      .from('marcas')
      .delete()
      .eq('id', id);
    
    if (error) throw error;
    
    console.log('✅ Marca eliminada:', id);
    
    return json({
      success: true,
      message: 'Marca eliminada exitosamente'
    });
    
  } catch (error) {
    console.error('❌ Error DELETE marca:', error);
    return json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}