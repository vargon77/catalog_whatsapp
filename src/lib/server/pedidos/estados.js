// src/lib/server/pedidos/estados.js
// ✅ VERSIÓN CORREGIDA - Incluye función faltante

import { ESTADOS, ESTADOS_PAGO } from '$lib/pedidos/estadosCliente';

export { ESTADOS, ESTADOS_PAGO };

// ========================================
// TRANSICIONES PERMITIDAS
// ========================================
export const TRANSICIONES_PERMITIDAS = {
  [ESTADOS.PENDIENTE]: [
    ESTADOS.CONFIRMADO,
    ESTADOS.CANCELADO
  ],
  
  [ESTADOS.CONFIRMADO]: [
    ESTADOS.PAGADO,
    ESTADOS.CANCELADO,
    ESTADOS.PENDIENTE // Permitir retroceso si pago rechazado
  ],
  
  [ESTADOS.PAGADO]: [
    ESTADOS.PREPARANDO,
    ESTADOS.ENVIADO, // Salto directo permitido
    ESTADOS.CANCELADO
  ],
  
  [ESTADOS.PREPARANDO]: [
    ESTADOS.ENVIADO,
    ESTADOS.CANCELADO
  ],
  
  [ESTADOS.ENVIADO]: [
    ESTADOS.RECIBIDO,
    ESTADOS.ENTREGADO // Permitir marcar como entregado directamente
  ],
  
  [ESTADOS.RECIBIDO]: [
    ESTADOS.ENTREGADO // ✅ CRÍTICO: Esta transición faltaba
  ],
  
  [ESTADOS.ENTREGADO]: [], // Estado final
  [ESTADOS.CANCELADO]: []  // Estado final
};

// ========================================
// ✅ FUNCIÓN FALTANTE: validarTransicion
// ========================================
export function validarTransicion(estadoActual, estadoNuevo) {
  const permitidas = TRANSICIONES_PERMITIDAS[estadoActual] || [];
  
  if (!permitidas.includes(estadoNuevo)) {
    return {
      valido: false,
      mensaje: `No se puede cambiar de "${estadoActual}" a "${estadoNuevo}"`
    };
  }
  
  return { valido: true };
}

// ========================================
// VALIDACIÓN CON CONTEXTO
// ========================================
export function validarTransicionConContexto(pedido, estadoNuevo) {
  const estadoActual = pedido.estado;
  
  // Validación básica
  const validacionBasica = validarTransicion(estadoActual, estadoNuevo);
  if (!validacionBasica.valido) {
    return validacionBasica;
  }
  
  // ✅ VALIDACIONES DE CONTEXTO
  
  // No puede pasar a PAGADO sin comprobante validado
  /*if (estadoNuevo === ESTADOS.PAGADO && pedido.estado_pago !== ESTADOS_PAGO.PAGADO) {
    return {
      valido: false,
      mensaje: 'El pago debe estar validado antes de marcar como pagado'
    };
  }
  if (estadoNuevo === ESTADOS.PAGADO && !pedido.constancia_pago_url) {
    return {
      valido: false,
      mensaje: 'Debe haber un comprobante de pago para validar'
    };
  }*/
  
  // ✅ VALIDACIÓN ESPECÍFICA PARA PREPARANDO
  if (estadoNuevo === ESTADOS.PREPARANDO) {
    // Si requiere envío, debe tener dirección completa
    if (pedido.envio && !validarDireccionCompleta(pedido.cliente_direccion)) {
      return {
        valido: false,
        mensaje: 'El pedido requiere dirección de envío completa antes de preparar'
      };
    }
    
    // Debe estar pagado
    if (pedido.estado_pago !== ESTADOS_PAGO.PAGADO) {
      return {
        valido: false,
        mensaje: 'El pago debe estar validado antes de preparar el pedido'
      };
    }
  }
  // ✅ VALIDACIÓN ESPECÍFICA PARA ENVIADO
    if (estadoNuevo === ESTADOS.ENVIADO) {
      // Debe tener guía de envío
      if (pedido.envio && !validarGuiaEnvio(pedido.guia_envio)) {
        return {
          valido: false,
          mensaje: 'El pedido requiere datos de guía de envío antes de marcar como enviado'
        };
      }
    }
    
    // Validaciones existentes...
    if (estadoNuevo === ESTADOS.PAGADO && !pedido.constancia_pago_url) {
      return {
        valido: false,
        mensaje: 'Debe haber un comprobante de pago para validar'
      };
    }
    
    return { valido: true };
  }

  // ✅ FUNCIÓN HELPER: Validar estructura de dirección
  function validarDireccionCompleta(direccion) {
    if (!direccion || typeof direccion !== 'object') return false;
    
    const camposObligatorios = [
      'nombre_destinatario',
      'telefono',
      'calle',
      'numero_exterior',
      'colonia',
      'codigo_postal',
      'ciudad',
      'estado',
      'referencias',
      'tipo_domicilio'
    ];
    
    return camposObligatorios.every(campo => 
      direccion[campo] && String(direccion[campo]).trim() !== ''
    );
  }

  // ✅ FUNCIÓN HELPER: Validar guía de envío
  function validarGuiaEnvio(guia) {
    if (!guia || typeof guia !== 'object') return false;
    
    return Boolean(
      guia.paqueteria && 
      guia.numero_guia
    );
  }

  

// ========================================
// VERIFICAR SI ES EDITABLE
// ========================================

export function esEditable(pedido) {
  if (!pedido) return false;
  if (pedido.editable === false) return false;
  if (pedido.estado_pago === ESTADOS_PAGO.PAGADO) return false;
  // ✅ Permitir edición en PENDIENTE y CONFIRMADO
  // aunque tenga comprobante pendiente o rechazado
  const estadosEditables = [ESTADOS.PENDIENTE, ESTADOS.CONFIRMADO];
  
  
  return estadosEditables.includes(pedido.estado);
}
// ========================================
// OBTENER SIGUIENTE ESTADO LÓGICO
// ========================================
export function obtenerSiguienteEstadoLogico(pedido) {
  const flujo = {
    [ESTADOS.PENDIENTE]: {
      siguiente: ESTADOS.CONFIRMADO,
      requisitos: ['Stock validado', 'Costos agregados']
    },
    [ESTADOS.CONFIRMADO]: {
      siguiente: ESTADOS.PAGADO,
      requisitos: ['Comprobante subido', 'Pago validado']
    },
    [ESTADOS.PAGADO]: {
      siguiente: ESTADOS.PREPARANDO,
      requisitos: ['Pedido en preparación']
    },
    [ESTADOS.PREPARANDO]: {
      siguiente: ESTADOS.ENVIADO,
      requisitos: ['Guía de envío generada']
    },
    [ESTADOS.ENVIADO]: {
      siguiente: ESTADOS.RECIBIDO,
      requisitos: ['Cliente confirma recepción']
    },
    [ESTADOS.RECIBIDO]: {
      siguiente: ESTADOS.ENTREGADO,
      requisitos: ['24h desde confirmación o manual']
    }
  };
  
  return flujo[pedido.estado] || null;
}

// ========================================
// AUTO-TRANSICIÓN RECIBIDO → ENTREGADO
// ========================================
export async function autoFinalizarSiCorresponde(pedido) {
  // Si está en RECIBIDO y han pasado 24h, marcar como ENTREGADO
  if (pedido.estado === ESTADOS.RECIBIDO && pedido.fecha_recibido) {
    const horasPasadas = (Date.now() - new Date(pedido.fecha_recibido)) / (1000 * 60 * 60);
    
    if (horasPasadas >= 24) {
      return {
        debeTransicionar: true,
        estadoNuevo: ESTADOS.ENTREGADO,
        razon: 'Finalización automática después de 24h de confirmación'
      };
    }
  }
  
  return { debeTransicionar: false };
}