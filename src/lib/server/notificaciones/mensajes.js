// src/lib/server/notificaciones/mensajes.js

/**
 * Genera mensaje y URL de WhatsApp según el tipo de notificación
 */
export function generarMensajeWhatsApp(pedido, tipo, configuracion, metadata = {}) {
  const config = configuracion || {};
  const whatsappNumero = pedido.cliente_whatsapp?.replace(/\D/g, '');
  
  if (!whatsappNumero) {
    console.error('❌ WhatsApp del cliente no disponible');
    return null;
  }
  
  let mensaje = '';
  
  switch (tipo) {
    case 'pedido_recibido':
      mensaje = generarMensajePedidoRecibido(pedido, config);
      break;
      
    case 'pedido_confirmado':
      mensaje = generarMensajePedidoConfirmado(pedido, config, metadata);
      break;
      
    case 'comprobante_recibido':
      mensaje = generarMensajeComprobanteRecibido(pedido, config);
      break;
      
    case 'pago_validado':
      mensaje = generarMensajePagoValidado(pedido, config);
      break;
      
    case 'pago_rechazado':
      mensaje = generarMensajePagoRechazado(pedido, config, metadata);
      break;
      
    case 'pedido_preparando':
      mensaje = generarMensajePreparando(pedido, config);
      break;
      
    case 'pedido_enviado':
      mensaje = generarMensajePedidoEnviado(pedido, config, metadata);
      break;
      
    case 'pedido_recibido_confirmacion':
      mensaje = generarMensajeRecepcionConfirmada(pedido, config);
      break;
      
    case 'pedido_cancelado':
      mensaje = generarMensajePedidoCancelado(pedido, config, metadata);
      break;
      
    case 'recordatorio_pago':
      mensaje = generarMensajeRecordatorioPago(pedido, config, metadata);
      break;
      
    default:
      console.error(`❌ Tipo de notificación desconocido: ${tipo}`);
      return null;
  }
  
  const url = `https://wa.me/${whatsappNumero}?text=${encodeURIComponent(mensaje)}`;
  
  return {
    mensaje,
    url,
    telefono: whatsappNumero
  };
}

// ========================================
// GENERADORES DE MENSAJES ESPECÍFICOS
// ========================================

function generarMensajePedidoRecibido(pedido, config) {
  return `¡Hola ${pedido.cliente_nombre}! 👋

✅ *Pedido Recibido*
📦 Pedido #${pedido.numero_pedido}

Hemos recibido tu pedido correctamente. En breve validaremos el stock y te confirmaremos los detalles.

*Resumen:*
${pedido.items.map(item => `• ${item.cantidad}x ${item.producto_nombre}`).join('\n')}

💰 *Total:* $${pedido.total.toFixed(2)}

Te contactaremos pronto para confirmar tu pedido.

_${config.nombre_empresa || 'Tienda'}_`;
}

function generarMensajePedidoConfirmado(pedido, config, metadata) {
  const cuentasPago = metadata?.cuentas_pago || [];
  
  let datosBancarios = '';
  if (cuentasPago.length > 0) {
    datosBancarios = '\n\n💳 *Datos para Transferencia:*\n';
    cuentasPago.forEach((cuenta, i) => {
      datosBancarios += `\n*${i + 1}. ${cuenta.banco}*\n`;
      datosBancarios += `Titular: ${cuenta.titular}\n`;
      if (cuenta.numero_cuenta) datosBancarios += `Cuenta: ${cuenta.numero_cuenta}\n`;
      if (cuenta.clabe) datosBancarios += `CLABE: ${cuenta.clabe}\n`;
    });
  }
  
  return `¡Hola ${pedido.cliente_nombre}! 🎉

✅ *Pedido Confirmado*
📦 Pedido #${pedido.numero_pedido}

Tu pedido ha sido validado y confirmado.

*Resumen:*
Subtotal: $${pedido.subtotal.toFixed(2)}
${pedido.impuesto > 0 ? `IVA: $${pedido.impuesto.toFixed(2)}\n` : ''}${pedido.costo_envio > 0 ? `Envío: $${pedido.costo_envio.toFixed(2)}\n` : ''}
💰 *TOTAL A PAGAR: $${pedido.total.toFixed(2)}*
${datosBancarios}

📸 *Siguiente paso:*
Realiza tu pago y envíanos el comprobante para continuar con tu pedido.

_${config.nombre_empresa || 'Tienda'}_`;
}

function generarMensajeComprobanteRecibido(pedido, config) {
  return `¡Hola ${pedido.cliente_nombre}! 📸

✅ *Comprobante Recibido*
📦 Pedido #${pedido.numero_pedido}

Hemos recibido tu comprobante de pago. Lo validaremos en las próximas horas y te confirmaremos.

Gracias por tu preferencia.

_${config.nombre_empresa || 'Tienda'}_`;
}

function generarMensajePagoValidado(pedido, config) {
  return `¡Hola ${pedido.cliente_nombre}! 🎉

✅ *Pago Confirmado*
📦 Pedido #${pedido.numero_pedido}

¡Excelente! Tu pago ha sido validado correctamente.

Ya estamos preparando tu pedido para el envío. Te notificaremos cuando esté en camino.

_${config.nombre_empresa || 'Tienda'}_`;
}

function generarMensajePagoRechazado(pedido, config, metadata) {
  const motivo = metadata?.motivo || 'No se pudo validar el comprobante';
  
  return `Hola ${pedido.cliente_nombre} 📋

❌ *Pago No Validado*
📦 Pedido #${pedido.numero_pedido}

Lamentablemente no pudimos validar tu comprobante de pago:

*Motivo:* ${motivo}

Por favor, envíanos un nuevo comprobante que cumpla con los requisitos o contáctanos si tienes dudas.

_${config.nombre_empresa || 'Tienda'}_`;
}

function generarMensajePreparando(pedido, config) {
  return `¡Hola ${pedido.cliente_nombre}! 📦

🔧 *Preparando tu Pedido*
📦 Pedido #${pedido.numero_pedido}

Tu pedido está siendo preparado con mucho cuidado. Pronto estará listo para el envío.

_${config.nombre_empresa || 'Tienda'}_`;
}

function generarMensajePedidoEnviado(pedido, config, metadata) {
  const guia = metadata?.guia_envio || '';
  const transportadora = metadata?.transportadora || '';
  
  let detallesEnvio = '';
  if (guia && transportadora) {
    detallesEnvio = `\n\n📮 *Detalles de Envío:*
Paquetería: ${transportadora}
Guía: ${guia}`;
  }
  
  return `¡Hola ${pedido.cliente_nombre}! 🚚

✅ *Pedido En Camino*
📦 Pedido #${pedido.numero_pedido}

¡Tu pedido ya está en camino! 🎉
${detallesEnvio}

Pronto recibirás tus productos. Cuando los recibas, confirma la recepción desde tu seguimiento de pedidos.

_${config.nombre_empresa || 'Tienda'}_`;
}

function generarMensajeRecepcionConfirmada(pedido, config) {
  return `¡Hola ${pedido.cliente_nombre}! 🎉

✅ *Recepción Confirmada*
📦 Pedido #${pedido.numero_pedido}

Gracias por confirmar que recibiste tu pedido. 

Esperamos que todo haya sido de tu agrado. ¡Vuelve pronto!

_${config.nombre_empresa || 'Tienda'}_`;
}

function generarMensajePedidoCancelado(pedido, config, metadata) {
  const motivo = metadata?.motivo || 'Cancelado a solicitud';
  
  return `Hola ${pedido.cliente_nombre} 📋

❌ *Pedido Cancelado*
📦 Pedido #${pedido.numero_pedido}

Tu pedido ha sido cancelado.

*Motivo:* ${motivo}

Si tienes dudas, contáctanos.

_${config.nombre_empresa || 'Tienda'}_`;
}

function generarMensajeRecordatorioPago(pedido, config, metadata) {
  const horasTranscurridas = metadata?.horas_transcurridas || 24;
  
  return `Hola ${pedido.cliente_nombre} 📋

⏰ *Recordatorio de Pago*
📦 Pedido #${pedido.numero_pedido}

Tu pedido está confirmado pero aún no hemos recibido el comprobante de pago (${horasTranscurridas}h transcurridas).

💰 Total: $${pedido.total.toFixed(2)}

Por favor, envía tu comprobante para continuar.

_${config.nombre_empresa || 'Tienda'}_`;
}