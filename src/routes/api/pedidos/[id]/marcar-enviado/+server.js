
// ========================================
// src/routes/api/pedidos/[id]/marcar-enviado/+server.js
// ========================================
export async function POST({ params, request }) {
  try {
    const { id } = params;
    const { guia_envio } = await request.json();
    
    const { data: pedido } = await supabaseAdmin
      .from('pedidos')
      .select('*')
      .eq('id', id)
      .single();
    
    if (!pedido || pedido.estado !== ESTADOS.PAGADO) {
      return json(
        { success: false, error: 'El pedido debe estar pagado' },
        { status: 400 }
      );
    }
    
    const updateData = {
      estado: ESTADOS.ENVIADO,
      fecha_enviado: new Date().toISOString()
    };
    
    if (guia_envio) {
      updateData.guia_envio = guia_envio;
    }
    
    const { data, error } = await supabaseAdmin
      .from('pedidos')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();
    
    if (error) throw error;
    
    await supabaseAdmin
      .from('pedidos_historial')
      .insert({
        pedido_id: id,
        estado_anterior: ESTADOS.PAGADO,
        estado_nuevo: ESTADOS.ENVIADO,
        tipo_usuario: 'vendedor',
        notas: guia_envio ? `Pedido enviado. Guía: ${guia_envio.numero}` : 'Pedido enviado',
        metadata: guia_envio || {}
      });
    
    return json({
      success: true,
      data,
      message: 'Pedido marcado como enviado'
    });
    
  } catch (error) {
    return json({ success: false, error: error.message }, { status: 500 });
  }
}
