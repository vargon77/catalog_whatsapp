/**
 * Calcula totales del pedido según configuración fiscal
 * @param {Array} items - Productos del carrito
 * @param {Boolean} factura - Si requiere factura
 * @param {Boolean} envio - Si requiere envío
 * @param {Number} costoEnvio - Costo de envío
 * @param {Number} impuestoPorcentaje - % de IVA desde configuración
 * @returns {Object} { subtotal, impuesto, costo_envio, total }
 */
export function calcularTotalesPedido(items, factura, envio, costoEnvio, impuestoPorcentaje) {
  const subtotal = items.reduce((sum, item) => 
    sum + (parseFloat(item.precio_unitario) * parseInt(item.cantidad)), 0
  );
  
  const impuesto = factura ? (subtotal * (impuestoPorcentaje / 100)) : 0;
  const costo_envio = envio ? parseFloat(costoEnvio) : 0;
  const total = subtotal + impuesto + costo_envio;
  
  return {
    subtotal: parseFloat(subtotal.toFixed(2)),
    impuesto: parseFloat(impuesto.toFixed(2)),
    costo_envio: parseFloat(costo_envio.toFixed(2)),
    total: parseFloat(total.toFixed(2))
  };
}