<!-- src/lib/components/pedidos/FormularioCostosEnvio.svelte -->
<script>
  import { createEventDispatcher } from 'svelte';
  import { Save, X, Loader2, DollarSign } from 'lucide-svelte';
  
  export let pedido;
  
  const dispatch = createEventDispatcher();
  let loading = false;
  let error = '';
  
  let costoEnvio = pedido.costo_envio || 0;
  let metodosPago = ['deposito', 'transferencia'];
  let metodoPagoSeleccionado = pedido.metodo_pago || 'transferencia';
  
  async function guardarCambios() {
    loading = true;
    error = '';
    
    try {
      // Recalcular total
      const nuevoTotal = parseFloat(pedido.subtotal) + 
                        parseFloat(pedido.impuesto || 0) + 
                        parseFloat(costoEnvio);
      
      const res = await fetch(`/api/pedidos/${pedido.id}/confirmar`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          costo_envio: parseFloat(costoEnvio),
          metodo_pago: metodoPagoSeleccionado,
          notas: `Costos actualizados. Envío: $${costoEnvio}, Total: $${nuevoTotal.toFixed(2)}`
        })
      });
      
      const result = await res.json();
      
      if (!result.success) {
        throw new Error(result.error);
      }
      
      alert('✅ Costos actualizados correctamente');
      dispatch('guardado', result.data);
      
    } catch (err) {
      error = err.message;
    } finally {
      loading = false;
    }
  }
  
  function cancelar() {
    dispatch('guardado'); // Cierra el formulario sin guardar
  }
  
  $: nuevoTotal = parseFloat(pedido.subtotal || 0) + 
                 parseFloat(pedido.impuesto || 0) + 
                 parseFloat(costoEnvio || 0);
</script>

<div class="bg-blue-50 border-2 border-blue-200 rounded-lg p-4 space-y-4">
  <div class="flex items-center justify-between">
    <h5 class="text-sm font-semibold text-gray-900 flex items-center gap-2">
      <DollarSign class="w-4 h-4 text-blue-600" />
      Editar Costos
    </h5>
  </div>
  
  <!-- Costo de envío -->
  <div>
    <label class="block text-sm font-medium text-gray-700 mb-2">
      Costo de envío
    </label>
    <div class="relative">
      <span class="absolute left-3 top-2.5 text-gray-500">$</span>
      <input
        type="number"
        bind:value={costoEnvio}
        min="0"
        step="0.01"
        class="w-full pl-7 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
        placeholder="0.00"
      />
    </div>
    <p class="text-xs text-gray-500 mt-1">
      Ingresa 0 si no hay costo de envío
    </p>
  </div>
  
  <!-- Método de pago -->
  <div>
    <label class="block text-sm font-medium text-gray-700 mb-2">
      Método de pago requerido
    </label>
    <select
      bind:value={metodoPagoSeleccionado}
      class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
    >
      <option value="transferencia">Transferencia bancaria</option>
      <option value="deposito">Depósito en efectivo</option>
    </select>
  </div>
  
  <!-- Preview del nuevo total -->
  <div class="bg-white border border-blue-200 rounded-lg p-3">
    <div class="space-y-1 text-sm">
      <div class="flex justify-between">
        <span class="text-gray-600">Subtotal:</span>
        <span>${(pedido.subtotal || 0).toFixed(2)}</span>
      </div>
      
      {#if pedido.impuesto > 0}
        <div class="flex justify-between">
          <span class="text-gray-600">IVA:</span>
          <span>${(pedido.impuesto || 0).toFixed(2)}</span>
        </div>
      {/if}
      
      <div class="flex justify-between">
        <span class="text-gray-600">Envío:</span>
        <span class="font-medium text-blue-700">${parseFloat(costoEnvio || 0).toFixed(2)}</span>
      </div>
      
      <div class="border-t border-gray-200 pt-2 flex justify-between">
        <span class="font-semibold">Nuevo Total:</span>
        <span class="font-bold text-lg text-primary-700">${nuevoTotal.toFixed(2)}</span>
      </div>
    </div>
  </div>
  
  {#if error}
    <div class="bg-red-50 border border-red-200 rounded-lg p-3">
      <p class="text-sm text-red-800">{error}</p>
    </div>
  {/if}
  
  <!-- Botones -->
  <div class="flex gap-2 pt-2">
    <button
      type="button"
      on:click={guardarCambios}
      disabled={loading}
      class="flex-1 btn-primary flex items-center justify-center gap-2 text-sm"
    >
      {#if loading}
        <Loader2 class="w-4 h-4 animate-spin" />
        <span>Guardando...</span>
      {:else}
        <Save class="w-4 h-4" />
        <span>Guardar y Confirmar</span>
      {/if}
    </button>
    
    <button
      type="button"
      on:click={cancelar}
      disabled={loading}
      class="px-4 py-2 bg-white border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 text-sm"
    >
      <X class="w-4 h-4" />
    </button>
  </div>
  
  <div class="bg-blue-100 border border-blue-300 rounded-lg p-3">
    <p class="text-xs text-blue-800">
      💡 Al guardar, el pedido se marcará como <strong>Confirmado</strong> y se generará el mensaje de pago para el cliente.
    </p>
  </div>
</div>