// src/routes/api/diagnostico/+server.js
// ⚠️ ENDPOINT TEMPORAL - ELIMINAR EN PRODUCCIÓN

import { json } from '@sveltejs/kit';
import { supabaseAdmin } from '$lib/supabaseServer';
import { ESTADOS, CONFIG_ESTADOS, TRANSICIONES_PERMITIDAS } from '$lib/server/pedidos/estados';

export async function GET() {
  try {
    const diagnostico = {
      fecha: new Date().toISOString(),
      problemas: []
    };
    
    // ==============================================
    // 1. VERIFICAR DEFINICIONES DE ESTADOS
    // ==============================================
    diagnostico.estados_definidos = {
      ESTADOS,
      CONFIG_ESTADOS_keys: Object.keys(CONFIG_ESTADOS),
      TRANSICIONES_PERMITIDAS
    };
    
    // Verificar que todos los estados tengan config
    Object.values(ESTADOS).forEach(estado => {
      const config = CONFIG_ESTADOS[estado];
      if (!config) {
        diagnostico.problemas.push({
          tipo: 'CONFIG_MISSING',
          estado,
          mensaje: `CONFIG_ESTADOS["${estado}"] no existe`
        });
      } else {
        // Verificar propiedades obligatorias
        const propsObligatorias = ['label', 'icon', 'descripcion', 'bgColor', 'textColor', 'borderColor'];
        propsObligatorias.forEach(prop => {
          if (!config[prop]) {
            diagnostico.problemas.push({
              tipo: 'PROP_MISSING',
              estado,
              propiedad: prop,
              mensaje: `CONFIG_ESTADOS["${estado}"].${prop} no existe`
            });
          }
        });
      }
    });
    
    // ==============================================
    // 2. VERIFICAR ESTADOS EN BD
    // ==============================================
    const { data: estadosUnicos, error: errorEstados } = await supabaseAdmin
      .from('pedidos')
      .select('estado')
      .order('created_at', { ascending: false });
    
    if (errorEstados) {
      diagnostico.problemas.push({
        tipo: 'DB_ERROR',
        mensaje: errorEstados.message
      });
    } else {
      // Contar frecuencia de cada estado
      const frecuencias = {};
      estadosUnicos.forEach(row => {
        const estado = row.estado;
        frecuencias[estado] = (frecuencias[estado] || 0) + 1;
      });
      
      diagnostico.estados_en_bd = frecuencias;
      
      // Detectar estados mal escritos
      Object.keys(frecuencias).forEach(estadoBD => {
        if (!Object.values(ESTADOS).includes(estadoBD)) {
          diagnostico.problemas.push({
            tipo: 'ESTADO_INVALIDO',
            estado: estadoBD,
            cantidad: frecuencias[estadoBD],
            mensaje: `Estado "${estadoBD}" no está en ESTADOS definidos`,
            posibles_causas: [
              'Mayúsculas/minúsculas incorrectas',
              'Espacios en blanco',
              'Estado antiguo no migrado',
              'Error de escritura manual en BD'
            ]
          });
        }
      });
    }
    
    // ==============================================
    // 3. VERIFICAR PEDIDOS RECIENTES
    // ==============================================
    const { data: pedidosRecientes, error: errorPedidos } = await supabaseAdmin
      .from('pedidos')
      .select('id, numero_pedido, estado, estado_pago, editable, created_at')
      .order('created_at', { ascending: false })
      .limit(10);
    
    if (errorPedidos) {
      diagnostico.problemas.push({
        tipo: 'DB_ERROR',
        mensaje: errorPedidos.message
      });
    } else {
      diagnostico.pedidos_recientes = pedidosRecientes.map(p => ({
        ...p,
        config_existe: !!CONFIG_ESTADOS[p.estado],
        es_editable_calculado: calcularEditable(p)
      }));
    }
    
    // ==============================================
    // 4. VERIFICAR HISTORIAL
    // ==============================================
    const { data: historialReciente, error: errorHistorial } = await supabaseAdmin
      .from('pedidos_historial')
      .select(`
        id,
        pedido:pedidos(numero_pedido),
        estado_anterior,
        estado_nuevo,
        created_at,
        notas
      `)
      .order('created_at', { ascending: false })
      .limit(20);
    
    if (!errorHistorial && historialReciente) {
      diagnostico.historial_reciente = historialReciente;
      
      // Analizar transiciones
      const transicionesUsadas = new Set();
      historialReciente.forEach(h => {
        if (h.estado_anterior && h.estado_nuevo) {
          transicionesUsadas.add(`${h.estado_anterior} → ${h.estado_nuevo}`);
        }
      });
      
      diagnostico.transiciones_usadas = Array.from(transicionesUsadas);
    }
    
    // ==============================================
    // 5. SUMMARY
    // ==============================================
    diagnostico.resumen = {
      total_problemas: diagnostico.problemas.length,
      estados_en_codigo: Object.keys(ESTADOS).length,
      estados_en_bd: Object.keys(diagnostico.estados_en_bd || {}).length,
      configs_faltantes: diagnostico.problemas.filter(p => p.tipo === 'CONFIG_MISSING').length,
      estados_invalidos: diagnostico.problemas.filter(p => p.tipo === 'ESTADO_INVALIDO').length
    };
    
    return json({
      success: true,
      data: diagnostico
    });
    
  } catch (error) {
    return json({
      success: false,
      error: error.message,
      stack: error.stack
    }, { status: 500 });
  }
}

function calcularEditable(pedido) {
  if (pedido.editable === false) return false;
  if (pedido.estado_pago === 'pagado') return false;
  
  const estadosEditables = ['pendiente', 'confirmado'];
  return estadosEditables.includes(pedido.estado);
}