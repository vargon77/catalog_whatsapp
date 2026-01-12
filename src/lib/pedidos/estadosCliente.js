// src/lib/pedidos/estadosCliente.js
/**
 * Constantes y utilidades de estados para el CLIENTE
 * Este archivo SÍ puede usarse en componentes .svelte
 */

// ========================================
// DEFINICIÓN DE ESTADOS (compartido)
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

export const ESTADOS_PAGO = {
  SIN_PAGO: 'sin_pago',
  PENDIENTE_VALIDACION: 'pendiente_validacion',
  PAGADO: 'pagado',
  RECHAZADO: 'rechazado'
};

// ========================================
// CONFIGURACIÓN DE ESTADOS (solo UI)
// ========================================

export const CONFIG_ESTADOS = {
  [ESTADOS.PENDIENTE]: {
    label: 'Pendiente',
    descripcion: 'Pedido creado, esperando confirmación',
    color: 'yellow',
    bgColor: 'bg-yellow-100',
    textColor: 'text-yellow-800',
    borderColor: 'border-yellow-200',
    icon: '⏳',
    responsable: 'cliente',
    editable: true,
    requiereValidacion: false
  },
  [ESTADOS.CONFIRMADO]: {
    label: 'Confirmado',
    descripcion: 'Vendedor confirmó stock y agregó costos',
    color: 'blue',
    bgColor: 'bg-blue-100',
    textColor: 'text-blue-800',
    borderColor: 'border-blue-200',
    icon: '✓',
    responsable: 'vendedor',
    editable: true,
    requiereValidacion: false,
    acciones: ['generar_mensaje_pago']
  },
  [ESTADOS.PAGADO]: {
    label: 'Pagado',
    descripcion: 'Pago validado, iniciando logística',
    color: 'green',
    bgColor: 'bg-green-100',
    textColor: 'text-green-800',
    borderColor: 'border-green-200',
    icon: '💰',
    responsable: 'vendedor',
    editable: false,
    requiereValidacion: true
  },
  [ESTADOS.PREPARANDO]: {
    label: 'Preparando',
    descripcion: 'Pedido en preparación',
    color: 'purple',
    bgColor: 'bg-purple-100',
    textColor: 'text-purple-800',
    borderColor: 'border-purple-200',
    icon: '📦',
    responsable: 'vendedor',
    editable: false
  },
  [ESTADOS.ENVIADO]: {
    label: 'Enviado',
    descripcion: 'Pedido en tránsito',
    color: 'indigo',
    bgColor: 'bg-indigo-100',
    textColor: 'text-indigo-800',
    borderColor: 'border-indigo-200',
    icon: '🚚',
    responsable: 'vendedor',
    editable: false,
    requiereGuiaEnvio: false
  },
  [ESTADOS.RECIBIDO]: {
    label: 'Recibido',
    descripcion: 'Cliente confirmó recepción',
    color: 'teal',
    bgColor: 'bg-teal-100',
    textColor: 'text-teal-800',
    borderColor: 'border-teal-200',
    icon: '📬',
    responsable: 'cliente',
    editable: false
  },
  [ESTADOS.ENTREGADO]: {
    label: 'Entregado',
    descripcion: 'Pedido completado',
    color: 'green',
    bgColor: 'bg-green-100',
    textColor: 'text-green-800',
    borderColor: 'border-green-200',
    icon: '✅',
    responsable: 'sistema',
    editable: false
  },
  [ESTADOS.CANCELADO]: {
    label: 'Cancelado',
    descripcion: 'Pedido cancelado',
    color: 'red',
    bgColor: 'bg-red-100',
    textColor: 'text-red-800',
    borderColor: 'border-red-200',
    icon: '❌',
    responsable: 'vendedor',
    editable: false,
    requiereMotivo: true
  }
};

// ========================================
// HELPERS PARA UI
// ========================================

/**
 * Obtiene la configuración de un estado
 */
export function obtenerConfigEstado(estado) {
  return CONFIG_ESTADOS[estado] || CONFIG_ESTADOS[ESTADOS.PENDIENTE];
}

/**
 * Obtiene los colores de un estado
 */
export function obtenerColorEstado(estado) {
  const config = CONFIG_ESTADOS[estado];
  return {
    bg: config?.bgColor || 'bg-gray-100',
    text: config?.textColor || 'text-gray-800',
    border: config?.borderColor || 'border-gray-200'
  };
}
