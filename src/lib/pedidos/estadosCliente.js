// src/lib/pedidos/estadosCliente.js
// ✅ VERSIÓN COMPLETA Y CORREGIDA

// ========================================
// ESTADOS DEL PEDIDO
// ========================================
export const ESTADOS = {
  PENDIENTE: 'pendiente',
  CONFIRMADO: 'confirmado',
  PAGADO: 'pagado',
  PREPARANDO: 'preparando',
  ENVIADO: 'enviado',
  RECIBIDO: 'recibido',
  ENTREGADO: 'entregado',
  CANCELADO: 'cancelado'
};

// ========================================
// ESTADOS DE PAGO
// ========================================
export const ESTADOS_PAGO = {
  SIN_PAGO: 'sin_pago',
  PENDIENTE_VALIDACION: 'pendiente_validacion',
  PAGADO: 'pagado',
  RECHAZADO: 'rechazado'
};

// ========================================
// CONFIGURACIÓN UI - ✅ COMPLETA
// ========================================
export const CONFIG_ESTADOS = {
  [ESTADOS.PENDIENTE]: {
    label: 'Pendiente',
    descripcion: 'Pedido recibido, esperando confirmación',
    color: 'yellow',
    bgColor: 'bg-yellow-100',
    textColor: 'text-yellow-800',
    borderColor: 'border-yellow-200',
    icon: '⏳'
  },
  
  [ESTADOS.CONFIRMADO]: {
    label: 'Confirmado',
    descripcion: 'Stock validado, esperando pago',
    color: 'blue',
    bgColor: 'bg-blue-100',
    textColor: 'text-blue-800',
    borderColor: 'border-blue-200',
    icon: '✅'
  },
  
  [ESTADOS.PAGADO]: {
    label: 'Pagado',
    descripcion: 'Pago validado, preparando envío',
    color: 'green',
    bgColor: 'bg-green-100',
    textColor: 'text-green-800',
    borderColor: 'border-green-200',
    icon: '💳'
  },
  
  [ESTADOS.PREPARANDO]: {
    label: 'Preparando',
    descripcion: 'Pedido en preparación',
    color: 'indigo',
    bgColor: 'bg-indigo-100',
    textColor: 'text-indigo-800',
    borderColor: 'border-indigo-200',
    icon: '📦'
  },
  
  [ESTADOS.ENVIADO]: {
    label: 'Enviado',
    descripcion: 'Pedido en tránsito',
    color: 'purple',
    bgColor: 'bg-purple-100',
    textColor: 'text-purple-800',
    borderColor: 'border-purple-200',
    icon: '🚚'
  },
  
  [ESTADOS.RECIBIDO]: {
    label: 'Recibido',
    descripcion: 'Cliente confirmó recepción',
    color: 'teal',
    bgColor: 'bg-teal-100',
    textColor: 'text-teal-800',
    borderColor: 'border-teal-200',
    icon: '📬'
  },
  
  [ESTADOS.ENTREGADO]: {
    label: 'Entregado',
    descripcion: 'Pedido completado',
    color: 'emerald',
    bgColor: 'bg-emerald-100',
    textColor: 'text-emerald-800',
    borderColor: 'border-emerald-200',
    icon: '✔️'
  },
  
  [ESTADOS.CANCELADO]: {
    label: 'Cancelado',
    descripcion: 'Pedido cancelado',
    color: 'red',
    bgColor: 'bg-red-100',
    textColor: 'text-red-800',
    borderColor: 'border-red-200',
    icon: '❌'
  }
};

// ========================================
// TRANSICIONES PERMITIDAS
// ========================================
export const TRANSICIONES_PERMITIDAS = {
  [ESTADOS.PENDIENTE]: [ESTADOS.CONFIRMADO, ESTADOS.CANCELADO],
  [ESTADOS.CONFIRMADO]: [ESTADOS.PAGADO, ESTADOS.CANCELADO, ESTADOS.PENDIENTE],
  [ESTADOS.PAGADO]: [ESTADOS.PREPARANDO, ESTADOS.ENVIADO, ESTADOS.CANCELADO],
  [ESTADOS.PREPARANDO]: [ESTADOS.ENVIADO, ESTADOS.CANCELADO],
  [ESTADOS.ENVIADO]: [ESTADOS.RECIBIDO, ESTADOS.ENTREGADO],
  [ESTADOS.RECIBIDO]: [ESTADOS.ENTREGADO],
  [ESTADOS.ENTREGADO]: [],
  [ESTADOS.CANCELADO]: []
};

// ========================================
// VALIDACIONES
// ========================================
export function validarTransicion(estadoActual, estadoNuevo) {
  const permitidas = TRANSICIONES_PERMITIDAS[estadoActual] || [];
  
  if (!permitidas.includes(estadoNuevo)) {
    return {
      valido: false,
      mensaje: `No se puede cambiar de ${estadoActual} a ${estadoNuevo}`
    };
  }
  
  return { valido: true };
}

export function esEditable(pedido) {
  if (!pedido) return false;
  if (pedido.editable === false) return false;
  if (pedido.estado_pago === ESTADOS_PAGO.PAGADO) return false;
  
  const estadosEditables = [ESTADOS.PENDIENTE, ESTADOS.CONFIRMADO];
  return estadosEditables.includes(pedido.estado);
}

// ========================================
// HELPERS UI
// ========================================
export function obtenerColorEstado(estado) {
  const config = CONFIG_ESTADOS[estado];
  
  // ✅ Defensa contra estados undefined
  if (!config) {
    console.warn(`⚠️ Estado "${estado}" no tiene configuración`);
    return {
      bg: 'bg-gray-100',
      text: 'text-gray-800',
      border: 'border-gray-200'
    };
  }
  
  return {
    bg: config.bgColor,
    text: config.textColor,
    border: config.borderColor
  };
}
