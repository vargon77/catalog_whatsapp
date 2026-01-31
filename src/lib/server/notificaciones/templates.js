// src/lib/server/notificaciones/templates.js
// ✅ AGREGAR TEMPLATES PARA LOS NUEVOS ESTADOS

export const TEMPLATES_NOTIFICACIONES = {
  
  // ... tus templates existentes ...
  
  // ✅ NUEVOS TEMPLATES PARA PREPARANDO
  pedido_preparando: (pedido, metadata) => {
    const { ciudad = 'tu ciudad', estado = '' } = metadata;
    
    return `🎉 *¡Buenas noticias!*

Tu pedido *#${pedido.numero_pedido}* ya está siendo preparado 📦

${pedido.envio 
  ? `✈️ Pronto será enviado a:\n📍 ${ciudad}, ${estado}`
  : `🏪 Pronto estará listo para recoger en tienda`
}

_Recibirás otra notificación cuando esté ${pedido.envio ? 'en camino' : 'listo para recoger'}_

¿Dudas? Escríbenos 💬`;
  },
  
  // ✅ MEJORAR TEMPLATE DE ENVIADO (con guía)
  pedido_enviado: (pedido, metadata) => {
    const { 
      paqueteria = 'Paquetería', 
      numero_guia = 'N/A', 
      url_rastreo = null,
      es_local = false 
    } = metadata;
    
    if (es_local) {
      return `🚗 *Tu pedido está en camino*

Pedido: *#${pedido.numero_pedido}*

📦 Entrega local en proceso
⏰ Estimado de entrega: 1-2 días hábiles

_Te avisaremos cuando llegue a tu domicilio_

¿Dudas? Escríbenos 💬`;
    }
    
    let mensaje = `🚚 *¡Tu pedido ya salió!*

Pedido: *#${pedido.numero_pedido}*

📦 Paquetería: *${paqueteria}*
🔢 Guía: \`${numero_guia}\``;
    
    if (url_rastreo) {
      mensaje += `\n\n🔍 *Rastrea tu pedido aquí:*\n${url_rastreo}`;
    }
    
    mensaje += `\n\n_Recibirás otra notificación cuando llegue a tu domicilio_

¿Dudas? Escríbenos 💬`;
    
    return mensaje;
  },
  
  // ✅ TEMPLATE PARA RECIBIDO (cliente confirma)
  pedido_recibido: (pedido) => {
    return `✅ *Confirmación de Recepción*

Pedido: *#${pedido.numero_pedido}*

¡Gracias por confirmar que recibiste tu pedido! 📦

${pedido.envio 
  ? '🚚 Esperamos que todo haya llegado en perfectas condiciones'
  : '🏪 Esperamos que todo esté en perfectas condiciones'
}

💬 Si tienes algún comentario o necesitas soporte, ¡escríbenos!

_Gracias por tu preferencia_ 🙏`;
  },
  
  // ✅ TEMPLATE PARA ENTREGADO (vendedor confirma)
  pedido_entregado: (pedido) => {
    return `🎊 *¡Pedido Completado!*

Pedido: *#${pedido.numero_pedido}*

✅ Tu pedido ha sido marcado como entregado

💙 *¡Gracias por tu compra!*

¿Todo llegó bien? Nos encantaría saber tu experiencia 😊

_Esperamos verte pronto_ 🛍️`;
  }
  
  // ... resto de tus templates existentes ...
};