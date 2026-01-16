// src/lib/server/whatsapp/servicio.js
import { ESTADOS } from '$lib/pedidos/estadosCliente';

export async function enviarMensajeWhatsApp(pedido, tipo, config, metadata = {}) {
  const telefono = config.whatsapp_negocio || config.whatsapp || '';
  const nombreNegocio = config.nombre_negocio || 'CatálogoExpress';

  const mensajes = {
    pedido_recibido: generarMensajePedidoRecibido,
    pedido_confirmado: generarMensajePedidoConfirmado,
    pago_validado: generarMensajePagoValidado,
    pago_rechazado: generarMensajePagoRechazado,
    pedido_preparando: generarMensajePedidoPreparando,
    pedido_enviado: generarMensajePedidoEnviado,
    pedido_recibido_confirmacion: generarMensajeRecibidoConfirmacion,
    pedido_cancelado: generarMensajePedidoCancelado,
    recordatorio_pago: generarMensajeRecordatorioPago
  };

  const generador = mensajes[tipo];
  if (!generador) {
    throw new Error(`Tipo de mensaje no soportado: ${tipo}`);
  }

  const mensaje = generador(pedido, nombreNegocio, metadata);
  const url = `https://wa.me/${telefono}?text=${encodeURIComponent(mensaje)}`;

  return { mensaje, url };
}

function generarMensajePedidoRecibido(pedido, nombreNegocio) {
  return `🎉 *¡Pedido Recibido!*

Hola ${pedido.cliente_nombre},

Tu pedido #${pedido.numero_pedido} ha sido recibido correctamente.

📦 *Resumen:*
${pedido.items?.map(item => `• ${item.cantidad}x ${item.producto_nombre}`).join('\n') || ''}

💰 *Total:* $${pedido.total.toFixed(2)}

En breve revisaremos tu pedido y te confirmaremos los detalles.

Gracias por tu compra en ${nombreNegocio} 🙏`;
}

function generarMensajePedidoConfirmado(pedido, nombreNegocio) {
  return `✅ *Pedido Confirmado*

Hola ${pedido.cliente_nombre},

Tu pedido #${pedido.numero_pedido} ha sido confirmado.

💰 *Total a pagar:* $${pedido.total.toFixed(2)}
${pedido.costo_envio > 0 ? `📦 *Envío:* $${pedido.costo_envio.toFixed(2)}` : ''}

Por favor, realiza el pago y envíanos tu comprobante para procesar tu pedido.

${nombreNegocio}`;
}

function generarMensajePagoValidado(pedido, nombreNegocio) {
  return `💳 *¡Pago Validado!*

Hola ${pedido.cliente_nombre},

Tu pago del pedido #${pedido.numero_pedido} ha sido validado exitosamente.

✅ Total pagado: $${pedido.total.toFixed(2)}

Estamos preparando tu pedido para el envío. Te notificaremos cuando esté en camino.

${nombreNegocio} 🚀`;
}

function generarMensajePagoRechazado(pedido, nombreNegocio, metadata) {
  return `❌ *Comprobante de Pago Rechazado*

Hola ${pedido.cliente_nombre},

Lamentablemente, el comprobante del pedido #${pedido.numero_pedido} no pudo ser validado.

⚠️ *Motivo:* ${metadata.motivo || 'No especificado'}

Por favor:
1. Verifica los datos de la transferencia
2. Sube un nuevo comprobante claro y legible
3. Puedes editar tu pedido si es necesario

Tu pedido sigue disponible para corrección.

${nombreNegocio}`;
}

function generarMensajePedidoPreparando(pedido, nombreNegocio) {
  return `📦 *Preparando tu Pedido*

Hola ${pedido.cliente_nombre},

Tu pedido #${pedido.numero_pedido} está siendo preparado.

⏱️ Tiempo estimado: 24-48 horas

Te notificaremos cuando esté listo para envío.

${nombreNegocio}`;
}

function generarMensajePedidoEnviado(pedido, nombreNegocio, metadata) {
  let mensaje = `🚚 *¡Pedido Enviado!*

Hola ${pedido.cliente_nombre},

Tu pedido #${pedido.numero_pedido} está en camino.`;

  if (metadata.guia_envio) {
    mensaje += `\n\n📋 *Guía de rastreo:* ${metadata.guia_envio}`;
  }

  if (metadata.transportadora) {
    mensaje += `\n🚛 *Transportadora:* ${metadata.transportadora}`;
  }

  mensaje += `\n\n⏱️ Tiempo estimado de entrega: 3-5 días hábiles`;
  mensaje += `\n\nPor favor, confirma cuando lo recibas.`;
  mensaje += `\n\n${nombreNegocio}`;

  return mensaje;
}

function generarMensajeRecibidoConfirmacion(pedido, nombreNegocio, metadata) {
  return `✅ *Recepción Confirmada*

Hola ${pedido.cliente_nombre},

Gracias por confirmar que recibiste tu pedido #${pedido.numero_pedido}.

${metadata.calificacion ? `⭐ Calificación: ${metadata.calificacion}/5` : ''}

🕐 Tu pedido se marcará como entregado automáticamente en 24 horas.

¡Esperamos verte pronto!

${nombreNegocio}`;
}

function generarMensajePedidoCancelado(pedido, nombreNegocio, metadata) {
  return `🚫 *Pedido Cancelado*

Hola ${pedido.cliente_nombre},

Tu pedido #${pedido.numero_pedido} ha sido cancelado.

${metadata.motivo ? `📝 *Motivo:* ${metadata.motivo}` : ''}

Si tienes alguna duda, estamos para ayudarte.

${nombreNegocio}`;
}

function generarMensajeRecordatorioPago(pedido, nombreNegocio, metadata) {
  const diasPendiente = metadata.dias_pendiente || 1;
  
  return `⏰ *Recordatorio de Pago*

Hola ${pedido.cliente_nombre},

Tu pedido #${pedido.numero_pedido} está esperando el pago.

💰 *Total:* $${pedido.total.toFixed(2)}
⏱️ *Tiempo pendiente:* ${diasPendiente} día${diasPendiente > 1 ? 's' : ''}

Por favor, realiza el pago y envíanos tu comprobante para procesar tu pedido.

Si ya pagaste, ignora este mensaje.

${nombreNegocio}`;
}