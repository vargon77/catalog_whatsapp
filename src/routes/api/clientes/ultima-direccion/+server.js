// src/routes/api/clientes/ultima-direccion/+server.js
// ✅ BUSCAR ÚLTIMA DIRECCIÓN USADA POR EL CLIENTE

import { json } from '@sveltejs/kit';
import { supabaseAdmin } from '$lib/supabaseServer';

export async function GET({ url }) {
  try {
    const whatsapp = url.searchParams.get('whatsapp');
    
    if (!whatsapp) {
      return json(
        { success: false, error: 'WhatsApp requerido' },
        { status: 400 }
      );
    }
    
    // Buscar último pedido con dirección completa
    const { data: pedidos, error } = await supabaseAdmin
      .from('pedidos')
      .select('cliente_direccion, created_at')
      .eq('cliente_whatsapp', whatsapp.replace(/\D/g, ''))
      .not('cliente_direccion', 'is', null)
      .order('created_at', { ascending: false })
      .limit(1);
    
    if (error) {
      console.error('Error buscando dirección:', error);
      return json(
        { success: false, error: 'Error al buscar dirección' },
        { status: 500 }
      );
    }
    
    if (!pedidos || pedidos.length === 0) {
      return json({
        success: true,
        data: null,
        message: 'No se encontró dirección previa'
      });
    }
    
    const ultimaDireccion = pedidos[0].cliente_direccion;
    
    // Verificar que sea objeto JSON válido (no texto migrado)
    if (typeof ultimaDireccion === 'object' && !ultimaDireccion.migrado) {
      return json({
        success: true,
        data: ultimaDireccion
      });
    }
    
    return json({
      success: true,
      data: null,
      message: 'Dirección anterior no disponible'
    });
    
  } catch (error) {
    console.error('Error en ultima-direccion:', error);
    return json(
      { success: false, error: 'Error interno' },
      { status: 500 }
    );
  }
}