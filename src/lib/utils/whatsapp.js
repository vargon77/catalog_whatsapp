/**
 * Genera un enlace de WhatsApp para un pedido completo
 * @param {Object} pedido - Objeto del pedido
 * @param {Array} productos - Lista de productos en el carrito
 * @param {Object} config - Configuración de la empresa
 * @returns {string} URL de WhatsApp
 */
export function generarEnlacePedido(pedido, productos, config) {
  if (!productos || productos.length === 0) {
    throw new Error('No hay productos en el pedido');
  }
  
  const { 
    nombre_empresa = 'CatálogoExpress', 
    whatsapp_numero, 
    moneda_simbolo = '$', 
    impuesto_porcentaje = 18 
  } = config;
  
  // Calcular totales
  const subtotal = productos.reduce((total, item) => 
    total + (item.precio_unitario * item.cantidad), 0
  );
  const impuesto = subtotal * (impuesto_porcentaje / 100);
  const total = subtotal + impuesto;
  
  // ✅ Construir mensaje con template literals (saltos de línea reales)
  let mensaje = `*${nombre_empresa} - Nuevo Pedido*

*Información del Cliente:*`;
  
  // Información del cliente si está disponible
  if (pedido.cliente_nombre) {
    mensaje += `
Nombre: ${pedido.cliente_nombre}`;
  }
  
  if (pedido.cliente_whatsapp) {
    mensaje += `
WhatsApp: ${pedido.cliente_whatsapp}`;
  }
  
  // Detalles del pedido
  mensaje += `

*Detalles del Pedido:*
`;
  
  // Agregar cada producto
  productos.forEach((item, index) => {
    const itemTotal = item.precio_unitario * item.cantidad;
    mensaje += `
*${index + 1}. ${item.nombre}*
   Cantidad: ${item.cantidad}
   Precio unitario: ${moneda_simbolo}${item.precio_unitario.toFixed(2)}
   Subtotal: ${moneda_simbolo}${itemTotal.toFixed(2)}`;
    
    // Información adicional del producto si está disponible
    if (item.sku) {
      mensaje += `
   Código: ${item.sku}`;
    }
    
    if (item.marca) {
      mensaje += `
   Marca: ${item.marca}`;
    }
  });
  
  // Resumen de totales
  mensaje += `

*Resumen de Totales:*
Subtotal: ${moneda_simbolo}${subtotal.toFixed(2)}
Impuestos (${impuesto_porcentaje}%): ${moneda_simbolo}${impuesto.toFixed(2)}
*TOTAL: ${moneda_simbolo}${total.toFixed(2)}*

¡Hola! Me gustaría realizar este pedido. Por favor, confírmenme disponibilidad y forma de pago.`;
  
  // ✅ Codificar el mensaje completo con encodeURIComponent
  const mensajeCodificado = encodeURIComponent(mensaje);
  
  // Generar URL de WhatsApp
  return `https://wa.me/${whatsapp_numero}?text=${mensajeCodificado}`;
}

/**
 * Genera un enlace de WhatsApp para preguntar por un producto específico
 * @param {Object} producto - Objeto del producto
 * @param {Object} config - Configuración de la empresa
 * @returns {string} URL de WhatsApp
 */
export function generarEnlacePregunta(producto, config) {
  const { 
    nombre_empresa = 'CatálogoExpress', 
    whatsapp_numero, 
    moneda_simbolo = '$' 
  } = config;
  
  // ✅ Construir mensaje con template literals
  let mensaje = `*${nombre_empresa} - Consulta por Producto*

¡Hola! Me interesa el siguiente producto:

*${producto.nombre}*
Precio: ${moneda_simbolo}${producto.precio.toFixed(2)}`;
  
  if (producto.id) {
    mensaje += `
Código: ${producto.id}`;
  }
  
  if (producto.marca) {
    mensaje += `
Marca: ${producto.marca}`;
  }
  
  if (producto.descripcion_larga) {
    const descripcionCorta = producto.descripcion_larga.substring(0, 100);
    mensaje += `
Descripción: ${descripcionCorta}${producto.descripcion_larga.length > 100 ? '...' : ''}`;
  }
  
  mensaje += `

Por favor, envíenme más información sobre:
• Disponibilidad
• Tiempo de entrega
• Descuentos por cantidad
• Otras características`;
  
  // ✅ Codificar con encodeURIComponent
  const mensajeCodificado = encodeURIComponent(mensaje);
  
  return `https://wa.me/${whatsapp_numero}?text=${mensajeCodificado}`;
}

/**
 * Genera un enlace de WhatsApp para consultas generales
 * @param {Object} config - Configuración de la empresa
 * @returns {string} URL de WhatsApp
 */
export function generarEnlaceConsultaGeneral(config) {
  const { nombre_empresa = 'CatálogoExpress', whatsapp_numero } = config;
  
  const mensaje = `¡Hola ${nombre_empresa}! Tengo una consulta general.`;
  const mensajeCodificado = encodeURIComponent(mensaje);
  
  return `https://wa.me/${whatsapp_numero}?text=${mensajeCodificado}`;
}

/**
 * Genera mensaje de estado de pedido
 * @param {Object} pedido - Objeto del pedido
 * @param {string} nuevoEstado - Nuevo estado del pedido
 * @param {Object} config - Configuración de la empresa
 * @returns {string} URL de WhatsApp
 */
export function generarMensajeEstadoPedido(pedido, nuevoEstado, config) {
  const { nombre_empresa = 'CatálogoExpress', whatsapp_numero } = config;
  
  const estadosTexto = {
    'pendiente': 'está pendiente de confirmación',
    'confirmado': 'ha sido confirmado',
    'preparando': 'se está preparando',
    'enviado': 'ha sido enviado',
    'entregado': 'ha sido entregado',
    'cancelado': 'ha sido cancelado'
  };
  
  const mensaje = `*${nombre_empresa} - Actualización de Pedido*

Hola ${pedido.cliente_nombre},

Tu pedido #${pedido.numero_pedido || pedido.id} ${estadosTexto[nuevoEstado] || 'ha sido actualizado'}.

${nuevoEstado === 'enviado' ? '📦 Tu pedido está en camino.' : ''}
${nuevoEstado === 'entregado' ? '✅ ¡Disfruta tu compra!' : ''}
${nuevoEstado === 'cancelado' ? '❌ Si tienes dudas, contáctanos.' : ''}

¿Tienes alguna pregunta?`;
  
  const mensajeCodificado = encodeURIComponent(mensaje);
  
  return `https://wa.me/${pedido.cliente_whatsapp}?text=${mensajeCodificado}`;
}

/**
 * Formatea un número de teléfono para WhatsApp
 * @param {string} numero - Número de teléfono
 * @returns {string} Número formateado
 */
export function formatearNumeroWhatsApp(numero) {
  // Eliminar espacios, guiones, paréntesis
  let numeroLimpio = numero.replace(/[\s\-()]/g, '');
  
  // Si empieza con 0, reemplazar con código de país (México: 52)
  if (numeroLimpio.startsWith('0')) {
    numeroLimpio = '52' + numeroLimpio.substring(1);
  }
  
  // Si empieza con +, eliminar el +
  if (numeroLimpio.startsWith('+')) {
    numeroLimpio = numeroLimpio.substring(1);
  }
  
  return numeroLimpio;
}

/**
 * Valida si un número es válido para WhatsApp
 * @param {string} numero - Número a validar
 * @returns {boolean} true si es válido
 */
export function validarNumeroWhatsApp(numero) {
  const numeroLimpio = formatearNumeroWhatsApp(numero);
  // Mínimo 10 dígitos, máximo 15
  return /^\d{10,15}$/.test(numeroLimpio);
}