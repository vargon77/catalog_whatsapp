// src/routes/api/test/+server.js
import { json } from '@sveltejs/kit';
import { supabase } from '$lib/supabaseClient';
import { supabaseAdmin } from '$lib/supabaseServer';

export async function GET() {
  try {
    const tests = [];
    
    // Test 1: Conexión básica
    const { data: configData, error: configError } = await supabase
      .from('configuracion')
      .select('nombre_empresa')
      .single();
    
    tests.push({
      name: 'Conexión Supabase (público)',
      success: !configError,
      data: configData,
      error: configError?.message
    });
    
    // Test 2: Conexión admin
    const { count: productosCount } = await supabaseAdmin
      .from('productos')
      .select('*', { count: 'exact', head: true });
    
    tests.push({
      name: 'Conexión Supabase (admin)',
      success: productosCount !== null,
      data: { productosCount }
    });
    
    // Test 3: Categorías
    const { data: categoriasData, error: categoriasError } = await supabase
      .from('categorias')
      .select('nombre')
      .limit(5);
    
    tests.push({
      name: 'Leer categorías',
      success: !categoriasError,
      data: categoriasData,
      error: categoriasError?.message
    });
    
    // Test 4: Productos
    const { data: productosData, error: productosError } = await supabase
      .from('productos')
      .select('nombre, precio')
      .limit(5);
    
    tests.push({
      name: 'Leer productos',
      success: !productosError,
      data: productosData,
      error: productosError?.message
    });
    
    // Test 5: Vista productos completos
    const { data: vistaData, error: vistaError } = await supabase
      .from('vista_productos_completos')
      .select('nombre, categoria_nombre, marca_nombre')
      .limit(3);
    
    tests.push({
      name: 'Vista productos completos',
      success: !vistaError,
      data: vistaData,
      error: vistaError?.message
    });
    
    const allSuccess = tests.every(t => t.success);
    
    return json({
      success: allSuccess,
      message: allSuccess ? '✅ Todas las conexiones funcionan correctamente' : '⚠️ Algunos tests fallaron',
      tests,
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    return json({
      success: false,
      error: error.message,
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}