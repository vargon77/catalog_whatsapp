// src/lib/server/db/transacciones.js
// ✅ NUEVO - Sistema de transacciones para operaciones críticas

import { supabaseAdmin } from '$lib/supabaseServer';

/**
 * Ejecuta múltiples operaciones en una transacción
 * Si alguna falla, todas se revierten
 */
export class Transaccion {
  constructor() {
    this.operaciones = [];
    this.rollbackData = [];
  }
  
  /**
   * Agregar operación a la transacción
   */
  agregar(operacion) {
    this.operaciones.push(operacion);
    return this;
  }
  
  /**
   * Ejecutar todas las operaciones
   */
  async ejecutar() {
    const resultados = [];
    
    try {
      // Ejecutar operaciones en orden
      for (const operacion of this.operaciones) {
        const resultado = await operacion.ejecutar();
        resultados.push(resultado);
        
        // Guardar datos para rollback
        if (operacion.rollback) {
          this.rollbackData.push({
            rollback: operacion.rollback,
            data: resultado
          });
        }
      }
      
      return {
        success: true,
        resultados
      };
      
    } catch (error) {
      console.error('❌ Error en transacción, ejecutando rollback...', error);
      
      // Ejecutar rollback en orden inverso
      for (let i = this.rollbackData.length - 1; i >= 0; i--) {
        try {
          await this.rollbackData[i].rollback(this.rollbackData[i].data);
        } catch (rollbackError) {
          console.error('❌ Error en rollback:', rollbackError);
        }
      }
      
      throw error;
    }
  }
}

// ========================================
// OPERACIONES COMUNES
// ========================================

export class OperacionInsertarPedido {
  constructor(pedidoData) {
    this.pedidoData = pedidoData;
  }
  
  async ejecutar() {
    const { data, error } = await supabaseAdmin
      .from('pedidos')
      .insert([this.pedidoData])
      .select()
      .single();
    
    if (error) throw error;
    
    return data;
  }
  
  rollback = async (pedido) => {
    await supabaseAdmin
      .from('pedidos')
      .delete()
      .eq('id', pedido.id);
    
    console.log(`🔄 Rollback: Pedido ${pedido.id} eliminado`);
  }
}

export class OperacionInsertarItems {
  constructor(pedidoId, items) {
    this.pedidoId = pedidoId;
    this.items = items;
  }
  
  async ejecutar() {
    const itemsData = this.items.map(item => ({
      pedido_id: this.pedidoId,
      producto_id: item.producto_id || null,
      producto_nombre: item.nombre,
      producto_sku: item.sku || null,
      cantidad: parseInt(item.cantidad),
      precio_unitario: parseFloat(item.precio_unitario),
      subtotal: parseFloat(item.precio_unitario) * parseInt(item.cantidad),
      imagen_url: item.imagen_url || null
    }));
    
    const { data, error } = await supabaseAdmin
      .from('pedidos_items')
      .insert(itemsData)
      .select();
    
    if (error) throw error;
    
    return data;
  }
  
  rollback = async (items) => {
    const ids = items.map(i => i.id);
    
    await supabaseAdmin
      .from('pedidos_items')
      .delete()
      .in('id', ids);
    
    console.log(`🔄 Rollback: ${ids.length} items eliminados`);
  }
}

export class OperacionRegistrarHistorial {
  constructor(historialData) {
    this.historialData = historialData;
  }
  
  async ejecutar() {
    const { data, error } = await supabaseAdmin
      .from('pedidos_historial')
      .insert([this.historialData])
      .select()
      .single();
    
    if (error) {
      console.warn('⚠️ Error registrando historial:', error);
      // No fallar por historial
      return null;
    }
    
    return data;
  }
  
  // Historial no se revierte
  rollback = null;
}

export class OperacionActualizarCliente {
  constructor(clienteId, datosCliente) {
    this.clienteId = clienteId;
    this.datosCliente = datosCliente;
    this.datosOriginales = null;
  }
  
  async ejecutar() {
    // Guardar datos originales para rollback
    const { data: original } = await supabaseAdmin
      .from('clientes')
      .select('*')
      .eq('id', this.clienteId)
      .single();
    
    this.datosOriginales = original;
    
    // Actualizar
    const { data, error } = await supabaseAdmin
      .from('clientes')
      .update(this.datosCliente)
      .eq('id', this.clienteId)
      .select()
      .single();
    
    if (error) throw error;
    
    return data;
  }
  
  rollback = async () => {
    if (!this.datosOriginales) return;
    
    await supabaseAdmin
      .from('clientes')
      .update(this.datosOriginales)
      .eq('id', this.clienteId);
    
    console.log(`🔄 Rollback: Cliente ${this.clienteId} restaurado`);
  }
}

// ========================================
// EJEMPLO DE USO
// ========================================

export async function crearPedidoConTransaccion(pedidoData, items) {
  const transaccion = new Transaccion();
  
  // 1. Insertar pedido
  transaccion.agregar(
    new OperacionInsertarPedido(pedidoData)
  );
  
  // 2. Insertar items (requiere ID del pedido)
  const operacionItems = {
    ejecutar: async () => {
      const pedido = transaccion.resultados?.[0];
      if (!pedido?.id) throw new Error('No se obtuvo ID del pedido');
      
      const op = new OperacionInsertarItems(pedido.id, items);
      return await op.ejecutar();
    },
    rollback: async (data) => {
      if (data) {
        await new OperacionInsertarItems(null, []).rollback(data);
      }
    }
  };
  
  transaccion.agregar(operacionItems);
  
  // 3. Registrar historial
  const operacionHistorial = {
    ejecutar: async () => {
      const pedido = transaccion.resultados?.[0];
      if (!pedido?.id) return null;
      
      const op = new OperacionRegistrarHistorial({
        pedido_id: pedido.id,
        estado_anterior: null,
        estado_nuevo: 'pendiente',
        tipo_usuario: 'cliente',
        notas: 'Pedido creado desde carrito'
      });
      
      return await op.ejecutar();
    },
    rollback: null
  };
  
  transaccion.agregar(operacionHistorial);
  
  // Ejecutar todo
  const resultado = await transaccion.ejecutar();
  
  return {
    pedido: resultado.resultados[0],
    items: resultado.resultados[1],
    historial: resultado.resultados[2]
  };
}