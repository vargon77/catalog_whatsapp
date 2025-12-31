// src/lib/supabaseClient.js
import { createClient } from '@supabase/supabase-js';
import { 
  PUBLIC_SUPABASE_URL, 
  PUBLIC_SUPABASE_ANON_KEY 
} from '$env/static/public';

// Cliente público (para frontend)
export const supabase = createClient(
  PUBLIC_SUPABASE_URL,
  PUBLIC_SUPABASE_ANON_KEY,
  {
    auth: {
      persistSession: false // No usar sesiones de Supabase Auth
    }
  }
);

// ========================================
// FUNCIONES HELPER PARA QUERIES
// ========================================

/**
 * Manejo de errores consistente
 */
export function handleSupabaseError(error) {
  console.error('Supabase Error:', error);
  
  if (error.code === 'PGRST116') {
    return { error: 'No se encontraron resultados', data: null };
  }
  
  return { 
    error: error.message || 'Error en la operación', 
    data: null 
  };
}

/**
 * Query builder con paginación
 */
export function buildPaginatedQuery(query, { page = 1, limit = 20 }) {
  const from = (page - 1) * limit;
  const to = from + limit - 1;
  
  return query.range(from, to);
}

/**
 * Generar slug único a partir de un texto
 */
export function generateSlug(text) {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // Eliminar acentos
    .replace(/[^a-z0-9]+/g, '-') // Reemplazar caracteres especiales con -
    .replace(/^-+|-+$/g, ''); // Eliminar - al inicio y final
}

/**
 * Validar UUID
 */
export function isValidUUID(uuid) {
  const regex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  return regex.test(uuid);
}