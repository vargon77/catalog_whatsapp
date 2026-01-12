// src/lib/server/whatsapp/servicio.js
/**
 * Servicio de WhatsApp - Generación de Mensajes Dinámicos
 * Usa las plantillas de la base de datos
 */

import { supabaseAdmin } from '$lib/supabaseServer';

/**
 * Obtener plantilla por nombre
 */
export async function obtenerPlantilla(nombre) {
  try {
    const { data, error } = await supabaseAdmin
      .from('mensajes_plantillas')
      .select('*')
      .eq('nombre', nombre)
      .eq('activo', true)
      .single();
    
    if (error) throw error;
    return data;
    
  } catch (error) {
    console.error('Error obteniendo plantilla:', error);
    return null;
  }
}

/**
 * Reemplazar variables en plantilla
 */
export function reemplazarVariables(texto, variables) {
  let resultado = texto;
  
  Object.keys(variables).forEach(key => {
    const valor = variables[key] || '';
    const regex = new RegExp(`{{${key}}}`, 'g');
    resultado = resultado.replace(regex, valor);
  });
  
  return resultado;
}

/**
 * Generar mensaje de pedido recibido
 */
export async function generarMensajePedidoRecibido(pedido, configuracion) {
  const plantilla = await obtenerPlantilla('Pedido Recibido');
  if (!plantilla) return null;
  
  // Generar lista de productos
  const listaProductos = pedido.items
    .map((item, index) => `${index + 1}. ${item.producto_nombre} x${item.cantidad} - $${item.subtotal.toFixed(2)}`)
    .join('\n');
  
  const variables = {
    cliente_nombre: pedido.cliente_nombre,
    numero_pedido: pedido.numero_pedido,
    fecha: new Date(pedido.created_at).toLocaleDateString('es-MX'),
    total: pedido.total.toFixed(2),
    lista_productos: listaProductos,
    nombre_empresa: configuracion.nombre_empresa
  };
  
  return {
    mensaje: reemplazarVariables(plantilla.texto, variables),
    telefono: pedido.cliente_whatsapp
  };
}

/**
 * Generar mensaje de pedido confirmado con datos de pago
 */
export async function generarMensajePedidoConfirmado(pedido, configuracion) {
  const plantilla = await obtenerPlantilla('Pedido Confirmado - Datos de Pago');
  if (!plantilla) return null;
  
  // Parsear cuentas de pago
  const cuentasPago = typeof configuracion.cuentas_pago === 'string' 
    ? JSON.parse(configuracion.cuentas_pago) 
    : configuracion.cuentas_pago;
  
  // Obtener cuenta activa (primera disponible)
  const cuenta = cuentasPago?.find(c => c.activo) || cuentasPago?.[0];
  
  if (!cuenta) {
    console.error('No hay cuentas de pago configuradas');
    return null;
  }
  
  // Generar detalle de costos
  let detalleCostos = '';
  if (pedido.impuesto > 0) {
    detalleCostos += `\n📦 Subtotal: $${pedido.subtotal.toFixed(2)}`;
    detalleCostos += `\n📋 IVA: $${pedido.impuesto.toFixed(2)}`;
  }
  if (pedido.costo_envio > 0) {
    detalleCostos += `\n🚚 Envío: $${pedido.costo_envio.toFixed(2)}`;
  }
  
  const variables = {
    cliente_nombre: pedido.cliente_nombre,
    numero_pedido: pedido.numero_pedido,
    total: pedido.total.toFixed(2),
    detalle_costos: detalleCostos,
    metodo_pago: pedido.metodo_pago === 'transferencia' ? 'Transferencia Bancaria' : 'Depósito en Efectivo',
    banco: cuenta.banco,
    titular: cuenta.titular,
    tipo_cuenta: cuenta.tipo_cuenta,
    numero_cuenta: cuenta.numero_cuenta,
    clabe: cuenta.clabe,
    nombre_empresa: configuracion.nombre_empresa
  };
  
  return {
    mensaje: reemplazarVariables(plantilla.texto, variables),
    telefono: pedido.cliente_whatsapp
  };
}

/**
 * Generar mensaje de comprobante recibido
 */
export async function generarMensajeComprobanteRecibido(pedido, configuracion) {
  const plantilla = await obtenerPlantilla('Comprobante Recibido');
  if (!plantilla) return null;
  
  const variables = {
    cliente_nombre: pedido.cliente_nombre,
    numero_pedido: pedido.numero_pedido,
    nombre_empresa: configuracion.nombre_empresa
  };
  
  return {
    mensaje: reemplazarVariables(plantilla.texto, variables),
    telefono: pedido.cliente_whatsapp
  };
}

/**
 * Generar mensaje de pago validado
 */
export async function generarMensajePagoValidado(pedido, configuracion) {
  const plantilla = await obtenerPlantilla('Pago Validado');
  if (!plantilla) return null;
  
  const variables = {
    cliente_nombre: pedido.cliente_nombre,
    numero_pedido: pedido.numero_pedido,
    total: pedido.total.toFixed(2),
    nombre_empresa: configuracion.nombre_empresa
  };
  
  return {
    mensaje: reemplazarVariables(plantilla.texto, variables),
    telefono: pedido.cliente_whatsapp
  };
}

/**
 * Generar mensaje de pago rechazado
 */
export async function generarMensajePagoRechazado(pedido, motivo, configuracion) {
  const plantilla = await obtenerPlantilla('Pago Rechazado');
  if (!plantilla) return null;
  
  const variables = {
    cliente_nombre: pedido.cliente_nombre,
    numero_pedido: pedido.numero_pedido,
    motivo_rechazo: motivo,
    total: pedido.total.toFixed(2),
    nombre_empresa: configuracion.nombre_empresa
  };
  
  return {
    mensaje: reemplazarVariables(plantilla.texto, variables),
    telefono: pedido.cliente_whatsapp
  };
}

/**
 * Generar mensaje de pedido enviado
 */
export async function generarMensajePedidoEnviado(pedido, configuracion) {
  const plantilla = await obtenerPlantilla('Pedido Enviado');
  if (!plantilla) return null;
  
  // Generar info de guía
  let infoGuia = '';
  let rastreoLink = '';
  
  if (pedido.guia_envio) {
    infoGuia = `📦 *Paquetería:* ${pedido.guia_envio.paqueteria}`;
    
    if (pedido.guia_envio.numero) {
      infoGuia += `\n🔢 *Guía:* ${pedido.guia_envio.numero}`;
    }
    
    if (pedido.guia_envio.url_rastreo) {
      rastreoLink = `\n🔍 *Rastrear:* ${pedido.guia_envio.url_rastreo}`;
    }
  } else {
    infoGuia = '📦 Envío local - Sin guía de rastreo';
  }
  
  const fechaEstimada = pedido.guia_envio?.fecha_estimada 
    ? new Date(pedido.guia_envio.fecha_estimada).toLocaleDateString('es-MX', { 
        weekday: 'long', 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric' 
      })
    : '2-3 días hábiles';
  
  const variables = {
    cliente_nombre: pedido.cliente_nombre,
    numero_pedido: pedido.numero_pedido,
    info_guia: infoGuia,
    direccion_entrega: pedido.cliente_direccion || 'Dirección registrada',
    fecha_estimada: fechaEstimada,
    rastreo_link: rastreoLink,
    nombre_empresa: configuracion.nombre_empresa
  };
  
  return {
    mensaje: reemplazarVariables(plantilla.texto, variables),
    telefono: pedido.cliente_whatsapp
  };
}

/**
 * Generar mensaje de pedido recibido
 */
export async function generarMensajePedidoRecibido(pedido, configuracion) {
  const plantilla = await obtenerPlantilla('Pedido Recibido');
  if (!plantilla) return null;
  
  const variables = {
    cliente_nombre: pedido.cliente_nombre,
    numero_pedido: pedido.numero_pedido,
    nombre_empresa: configuracion.nombre_empresa
  };
  
  return {
    mensaje: reemplazarVariables(plantilla.texto, variables),
    telefono: pedido.cliente_whatsapp
  };
}

/**
 * Generar mensaje de pedido cancelado
 */
export async function generarMensajePedidoCancelado(pedido, configuracion) {
  const plantilla = await obtenerPlantilla('Pedido Cancelado');
  if (!plantilla) return null;
  
  // Info de reembolso solo si ya estaba pagado
  const infoReembolso = pedido.estado_pago === 'pagado'
    ? '\n💰 *Reembolso:* Te contactaremos para procesar la devolución de tu pago.'
    : '';
  
  const variables = {
    cliente_nombre: pedido.cliente_nombre,
    numero_pedido: pedido.numero_pedido,
    motivo_cancelacion: pedido.motivo_cancelacion || 'No especificado',
    info_reembolso: infoReembolso,
    nombre_empresa: configuracion.nombre_empresa
  };
  
  return {
    mensaje: reemplazarVariables(plantilla.texto, variables),
    telefono: pedido.cliente_whatsapp
  };
}

/**
 * Generar URL de WhatsApp con mensaje
 */
export function generarURLWhatsApp(telefono, mensaje) {
  const telefonoLimpio = telefono.replace(/\D/g, '');
  const mensajeCodificado = encodeURIComponent(mensaje);
  
  return `https://wa.me/${telefonoLimpio}?text=${mensajeCodificado}`;
}

/**
 * Helper: Enviar mensaje de WhatsApp (abre URL en nueva pestaña)
 */
export async function enviarMensajeWhatsApp(pedido, tipoMensaje, configuracion, datosAdicionales = {}) {
  let resultado = null;
  
  switch (tipoMensaje) {
    case 'pedido_recibido':
      resultado = await generarMensajePedidoRecibido(pedido, configuracion);
      break;
    case 'pedido_confirmado':
      resultado = await generarMensajePedidoConfirmado(pedido, configuracion);
      break;
    case 'comprobante_recibido':
      resultado = await generarMensajeComprobanteRecibido(pedido, configuracion);
      break;
    case 'pago_validado':
      resultado = await generarMensajePagoValidado(pedido, configuracion);
      break;
    case 'pago_rechazado':
      resultado = await generarMensajePagoRechazado(pedido, datosAdicionales.motivo, configuracion);
      break;
    case 'pedido_enviado':
      resultado = await generarMensajePedidoEnviado(pedido, configuracion);
      break;
    case 'pedido_recibido':
      resultado = await generarMensajePedidoRecibido(pedido, configuracion);
      break;
    case 'pedido_cancelado':
      resultado = await generarMensajePedidoCancelado(pedido, configuracion);
      break;
    default:
      console.error('Tipo de mensaje no reconocido:', tipoMensaje);
      return null;
  }
  
  if (!resultado) return null;
  
  return {
    url: generarURLWhatsApp(resultado.telefono, resultado.mensaje),
    mensaje: resultado.mensaje,
    telefono: resultado.telefono
  };
}