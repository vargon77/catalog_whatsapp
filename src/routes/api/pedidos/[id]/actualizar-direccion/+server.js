// src/routes/api/pedidos/[id]/actualizar-direccion/+server.js
// ✅ ENDPOINT PARA ACTUALIZAR DIRECCIÓN DE ENVÍO

import { json } from '@sveltejs/kit';
import { supabaseAdmin } from '$lib/supabaseServer';
import { ESTADOS, ESTADOS_PAGO, validarTransicionConContexto } from '$lib/server/pedidos/estados';

/**
 * POST - Actualizar dirección de envío del pedido
 * TRIGGER: Después de subir comprobante, antes de validar pago
 */
export async function POST({ params, request }) {
  const { id } = params;
  
  try {
    const { cliente_direccion } = await request.json();
    
    // 1. Validar estructura de dirección
    const validacion = validarEstructuraDireccion(cliente_direccion);
    if (!validacion.valido) {
      return json(
        { success: false, error: validacion.error },
        { status: 400 }
      );
    }
    
    // 2. Obtener pedido
    const { data: pedido, error: errorPedido } = await supabaseAdmin
      .from('pedidos')
      .select('*')
      .eq('id', id)
      .single();
    
    if (errorPedido || !pedido) {
      return json(
        { success: false, error: 'Pedido no encontrado' },
        { status: 404 }
      );
    }
    
    // 3. Validar que el pedido esté en estado CONFIRMADO
    if (pedido.estado !== ESTADOS.CONFIRMADO) {
      return json(
        { success: false, error: 'Solo se puede agregar dirección en pedidos confirmados' },
        { status: 400 }
      );
    }
    
    // 4. Sanitizar y normalizar datos
    const direccionNormalizada = {
      nombre_destinatario: cliente_direccion.nombre_destinatario.trim(),
      telefono: cliente_direccion.telefono.replace(/\D/g, ''),
      correo: cliente_direccion.correo?.trim() || null,
      calle: cliente_direccion.calle.trim(),
      numero_exterior: cliente_direccion.numero_exterior.trim(),
      numero_interior: cliente_direccion.numero_interior?.trim() || null,
      colonia: cliente_direccion.colonia.trim(),
      codigo_postal: cliente_direccion.codigo_postal.trim(),
      ciudad: cliente_direccion.ciudad.trim(),
      estado: cliente_direccion.estado,
      pais: cliente_direccion.pais || 'México',
      referencias: cliente_direccion.referencias.trim(),
      tipo_domicilio: cliente_direccion.tipo_domicilio,
      persona_recibe: cliente_direccion.persona_recibe?.trim() || null,
      horario_entrega: cliente_direccion.horario_entrega || 'horario_abierto',
      ubicacion_maps: cliente_direccion.ubicacion_maps?.trim() || null,
      autoriza_tercero: Boolean(cliente_direccion.autoriza_tercero),
      notas_autorizacion: cliente_direccion.notas_autorizacion?.trim() || null,
      fecha_captura: new Date().toISOString()
    };
    
    // 5. Actualizar pedido
    const { data: pedidoActualizado, error: errorUpdate } = await supabaseAdmin
      .from('pedidos')
      .update({
        cliente_direccion: direccionNormalizada
      })
      .eq('id', id)
      .select()
      .single();
    
    if (errorUpdate) {
      console.error('Error actualizando dirección:', errorUpdate);
      return json(
        { success: false, error: 'Error al guardar la dirección' },
        { status: 500 }
      );
    }
    
    // 6. Registrar en historial
    await supabaseAdmin
      .from('pedidos_historial')
      .insert({
        pedido_id: id,
        estado_anterior: pedido.estado,
        estado_nuevo: pedido.estado,
        tipo_usuario: 'cliente',
        notas: 'Cliente actualizó dirección de envío',
        metadata: {
          ciudad: direccionNormalizada.ciudad,
          estado: direccionNormalizada.estado,
          codigo_postal: direccionNormalizada.codigo_postal
        }
      });
    
    console.log(`✅ Dirección actualizada para pedido ${pedido.numero_pedido}`);
    
    return json({
      success: true,
      data: pedidoActualizado,
      message: 'Dirección guardada correctamente'
    });
    
  } catch (error) {
    console.error('Error en actualizar-direccion:', error);
    return json(
      { success: false, error: 'Error interno' },
      { status: 500 }
    );
  }
}

/**
 * Validar estructura completa de dirección
 */
function validarEstructuraDireccion(direccion) {
  if (!direccion || typeof direccion !== 'object') {
    return { valido: false, error: 'Dirección inválida' };
  }
  
  const errores = [];
  
  // Campos obligatorios
  if (!direccion.nombre_destinatario?.trim()) {
    errores.push('Nombre del destinatario');
  }
  
  if (!direccion.telefono?.replace(/\D/g, '') || direccion.telefono.replace(/\D/g, '').length !== 10) {
    errores.push('Teléfono (10 dígitos)');
  }
  
  if (!direccion.calle?.trim()) {
    errores.push('Calle');
  }
  
  if (!direccion.numero_exterior?.trim()) {
    errores.push('Número exterior');
  }
  
  if (!direccion.colonia?.trim()) {
    errores.push('Colonia');
  }
  
  if (!direccion.codigo_postal?.trim() || !/^\d{5}$/.test(direccion.codigo_postal)) {
    errores.push('Código postal (5 dígitos)');
  }
  
  if (!direccion.ciudad?.trim()) {
    errores.push('Ciudad');
  }
  
  if (!direccion.estado?.trim()) {
    errores.push('Estado');
  }
  
  if (!direccion.referencias?.trim()) {
    errores.push('Referencias');
  }
  
  if (!direccion.tipo_domicilio || !['casa', 'departamento', 'oficina', 'bodega'].includes(direccion.tipo_domicilio)) {
    errores.push('Tipo de domicilio');
  }
  
  if (errores.length > 0) {
    return {
      valido: false,
      error: `Campos obligatorios faltantes o inválidos: ${errores.join(', ')}`
    };
  }
  
  return { valido: true };
}