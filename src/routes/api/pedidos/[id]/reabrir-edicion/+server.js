
// ========================================
// src/routes/api/pedidos/[id]/reabrir-edicion/+server.js
// PERMITE REABRIR SI EL PAGO FUE RECHAZADO
// ========================================
export async function POST({ params }) {
  try {
    const { id } = params;
    
    const { data: pedido } = await supabaseAdmin
      .from('pedidos')
      .select('*')
      .eq('id', id)
      .single();
    
    if (!pedido) {
      return json(
        { success: false, error: 'Pedido no encontrado' },
        { status: 404 }
      );
    }
    
    // Solo se puede reabrir si el pago fue rechazado
    if (pedido.estado_pago !== ESTADOS_PAGO.RECHAZADO) {
      return json(
        { success: false, error: 'Solo se puede reabrir si el pago fue rechazado' },
        { status: 400 }
      );
    }
    
    const { data, error } = await supabaseAdmin
      .from('pedidos')
      .update({
        editable: true,
        estado_pago: ESTADOS_PAGO.SIN_PAGO,
        esperando_validacion: false,
        motivo_rechazo_pago: null
      })
      .eq('id', id)
      .select()
      .single();
    
    if (error) throw error;
    
    return json({
      success: true,
      data,
      message: 'Pedido reabierto para edición'
    });
    
  } catch (error) {
    return json({ success: false, error: error.message }, { status: 500 });
  }
}