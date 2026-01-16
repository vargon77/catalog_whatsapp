// src/lib/server/pedidos/validaciones.js
import { ESTADOS, ESTADOS_PAGO } from './estados';

export class ValidationError extends Error {
  constructor(message, code = 'VALIDATION_ERROR') {
    super(message);
    this.name = 'ValidationError';
    this.code = code;
  }
}

export function validarDatosCliente(datos) {
  const errores = [];
  
  if (!datos.cliente_nombre?.trim()) {
    errores.push('El nombre del cliente es obligatorio');
  }
  
  if (!datos.cliente_whatsapp?.trim()) {
    errores.push('El WhatsApp del cliente es obligatorio');
  } else if (!/^\d{10}$/.test(datos.cliente_whatsapp.replace(/\D/g, ''))) {
    errores.push('El WhatsApp debe tener 10 dígitos');
  }
  
  if (datos.cliente_email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(datos.cliente_email)) {
    errores.push('El email no es válido');
  }
  
  if (errores.length > 0) {
    throw new ValidationError(errores.join(', '), 'INVALID_CLIENT_DATA');
  }
  
  return true;
}

export function validarItems(items) {
  if (!Array.isArray(items) || items.length === 0) {
    throw new ValidationError('El pedido debe tener al menos un producto', 'INVALID_ITEMS');
  }
  
  const errores = [];
  
  items.forEach((item, index) => {
    if (!item.producto_id) {
      errores.push(`Item ${index + 1}: producto_id es obligatorio`);
    }
    
    if (!item.nombre?.trim()) {
      errores.push(`Item ${index + 1}: nombre es obligatorio`);
    }
    
    if (!item.cantidad || item.cantidad <= 0) {
      errores.push(`Item ${index + 1}: cantidad debe ser mayor a 0`);
    }
    
    if (!item.precio_unitario || item.precio_unitario <= 0) {
      errores.push(`Item ${index + 1}: precio_unitario debe ser mayor a 0`);
    }
  });
  
  if (errores.length > 0) {
    throw new ValidationError(errores.join(', '), 'INVALID_ITEMS');
  }
  
  return true;
}

export function validarTotales(datos) {
  const subtotal = parseFloat(datos.subtotal);
  const impuesto = parseFloat(datos.impuesto || 0);
  const costoEnvio = parseFloat(datos.costo_envio || 0);
  const total = parseFloat(datos.total);
  
  if (subtotal < 0 || impuesto < 0 || costoEnvio < 0 || total < 0) {
    throw new ValidationError('Los montos no pueden ser negativos', 'INVALID_TOTALS');
  }
  
  const totalCalculado = subtotal + impuesto + costoEnvio;
  const diferencia = Math.abs(totalCalculado - total);
  
  if (diferencia > 0.01) {
    throw new ValidationError(
      `Total no coincide: calculado ${totalCalculado.toFixed(2)}, recibido ${total.toFixed(2)}`,
      'TOTAL_MISMATCH'
    );
  }
  
  return true;
}

export function validarEdicion(pedido) {
  if (!pedido.editable) {
    throw new ValidationError(
      'Este pedido ya no puede ser editado',
      'NOT_EDITABLE'
    );
  }
  
  if (pedido.estado_pago === ESTADOS_PAGO.PAGADO) {
    throw new ValidationError(
      'No se puede editar un pedido con pago validado',
      'PAYMENT_VALIDATED'
    );
  }
  
  const estadosNoEditables = [
    ESTADOS.ENVIADO,
    ESTADOS.RECIBIDO,
    ESTADOS.ENTREGADO,
    ESTADOS.CANCELADO
  ];
  
  if (estadosNoEditables.includes(pedido.estado)) {
    throw new ValidationError(
      `No se puede editar un pedido en estado ${pedido.estado}`,
      'INVALID_STATE'
    );
  }
  
  return true;
}

export function validarComprobante(url) {
  if (!url?.trim()) {
    throw new ValidationError('URL del comprobante es obligatoria', 'MISSING_RECEIPT');
  }
  
  const urlPattern = /^https?:\/\/.+\.(jpg|jpeg|png|pdf)$/i;
  if (!urlPattern.test(url)) {
    throw new ValidationError(
      'La URL del comprobante debe ser una imagen o PDF válido',
      'INVALID_RECEIPT_URL'
    );
  }
  
  return true;
}

export function validarCancelacion(pedido, motivo) {
  if (!motivo?.trim() || motivo.length < 10) {
    throw new ValidationError(
      'El motivo de cancelación debe tener al menos 10 caracteres',
      'INVALID_CANCELLATION_REASON'
    );
  }
  
  const estadosNoCancelables = [
    ESTADOS.RECIBIDO,
    ESTADOS.ENTREGADO,
    ESTADOS.CANCELADO
  ];
  
  if (estadosNoCancelables.includes(pedido.estado)) {
    throw new ValidationError(
      `No se puede cancelar un pedido en estado ${pedido.estado}`,
      'CANNOT_CANCEL'
    );
  }
  
  return true;
}

export function sanitizarTexto(texto) {
  if (!texto) return null;
  return texto.trim().substring(0, 500);
}

export function sanitizarWhatsApp(whatsapp) {
  if (!whatsapp) return null;
  return whatsapp.replace(/\D/g, '').substring(0, 10);
}