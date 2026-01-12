// src/lib/server/pedidos/estados.js
/**
 * Lógica de estados y transiciones del sistema de pedidos (SERVIDOR)
 * Este archivo SOLO debe importarse en archivos del servidor (+page.server.js, +server.js)
 * CatálogoExpress - Sistema de Gestión de Pedidos v2.0
 */

// Importar constantes compartidas desde el cliente
import { ESTADOS, ESTADOS_PAGO } from '$lib/pedidos/estadosCliente';

// Re-exportar para mantener compatibilidad
export { ESTADOS, ESTADOS_PAGO };

// ========================================
// FLUJO DE TRANSICIONES PERMITIDAS (SERVIDOR)
// ========================================

export const TRANSICIONES_PERMITIDAS = {
  [ESTADOS.PENDIENTE]: [ESTADOS.CONFIRMADO, ESTADOS.CANCELADO],
  [ESTADOS.CONFIRMADO]: [ESTADOS.PAGADO, ESTADOS.CANCELADO],
  [ESTADOS.PAGADO]: [ESTADOS.PREPARANDO, ESTADOS.ENVIADO, ESTADOS.CANCELADO],
  [ESTADOS.PREPARANDO]: [ESTADOS.ENVIADO, ESTADOS.CANCELADO],
  [ESTADOS.ENVIADO]: [ESTADOS.RECIBIDO, ESTADOS.ENTREGADO],
  [ESTADOS.RECIBIDO]: [ESTADOS.ENTREGADO],
  [ESTADOS.ENTREGADO]: [], // Estado final
  [ESTADOS.CANCELADO]: [] // Estado final
};

// ========================================
// FUNCIONES DE VALIDACIÓN
// ========================================

/**
 * Valida si una transición de estado es permitida
 */
export function validarTransicion(estadoActual, estadoNuevo) {
  if (!estadoActual || !estadoNuevo) {
    return {
      valido: false,
      mensaje: 'Estados no pueden ser nulos'
    };
  }
  
  if (estadoActual === estadoNuevo) {
    return {
      valido: false,
      mensaje: 'El estado es el mismo'
    };
  }
  
  const transicionesPermitidas = TRANSICIONES_PERMITIDAS[estadoActual] || [];
  
  if (!transicionesPermitidas.includes(estadoNuevo)) {
    return {
      valido: false,
      mensaje: `No se puede cambiar de ${CONFIG_ESTADOS[estadoActual]?.label} a ${CONFIG_ESTADOS[estadoNuevo]?.label}`
    };
  }
  
  return { valido: true };
}

/**
 * Determina si un pedido es editable según su estado
 */
export function esEditable(pedido) {
  if (!pedido) return false;
  
  // Si ya está marcado como no editable, respetar
  if (pedido.editable === false) return false;
  
  // Estados que permiten edición
  const estadosEditables = [ESTADOS.PENDIENTE, ESTADOS.CONFIRMADO];
  
  // No editable si ya está pagado
  if (pedido.estado_pago === ESTADOS_PAGO.PAGADO) return false;
  
  return estadosEditables.includes(pedido.estado);
}

/**
 * Valida si se puede validar el pago
 */
export function puedeValidarPago(pedido) {
  if (!pedido) return { valido: false, mensaje: 'Pedido no válido' };
  
  if (!pedido.constancia_pago_url) {
    return {
      valido: false,
      mensaje: 'No hay comprobante de pago'
    };
  }
  
  if (pedido.estado_pago === ESTADOS_PAGO.PAGADO) {
    return {
      valido: false,
      mensaje: 'El pago ya fue validado'
    };
  }
  
  if (pedido.estado !== ESTADOS.CONFIRMADO) {
    return {
      valido: false,
      mensaje: 'El pedido debe estar confirmado primero'
    };
  }
  
  return { valido: true };
}

/**
 * Valida si se puede marcar como recibido
 */
export function puedeMarcarRecibido(pedido) {
  if (!pedido) return { valido: false };
  
  if (pedido.estado !== ESTADOS.ENVIADO) {
    return {
      valido: false,
      mensaje: 'El pedido debe estar en estado "Enviado"'
    };
  }
  
  return { valido: true };
}

export function obtenerSiguienteEstado(estadoActual) {
  const flujoNormal = {
    [ESTADOS.PENDIENTE]: ESTADOS.CONFIRMADO,
    [ESTADOS.CONFIRMADO]: ESTADOS.PAGADO,
    [ESTADOS.PAGADO]: ESTADOS.ENVIADO,
    [ESTADOS.ENVIADO]: ESTADOS.RECIBIDO,
    [ESTADOS.RECIBIDO]: ESTADOS.ENTREGADO
  };
  
  return flujoNormal[estadoActual] || null;
}

/**
 * Calcula tiempo de finalización automática
 */
export function calcularTiempoFinalizacion(fechaEnviado) {
  if (!fechaEnviado) return null;
  
  const fecha = new Date(fechaEnviado);
  fecha.setDate(fecha.getDate() + 7); // 7 días después
  
  return fecha;
}

export function debeFinalizarseAutomaticamente(pedido) {
  if (!pedido || pedido.estado !== ESTADOS.ENVIADO) return false;
  if (!pedido.fecha_enviado) return false;
  
  const fechaLimite = calcularTiempoFinalizacion(pedido.fecha_enviado);
  return new Date() >= fechaLimite;
}

export function obtenerEstadosDisponibles(estadoActual) {
  return TRANSICIONES_PERMITIDAS[estadoActual] || [];
}