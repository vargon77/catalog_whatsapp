<!-- src/lib/components/pedidos/ModalValidarPago.svelte -->
<script>
  import { createEventDispatcher } from 'svelte';
  import { CheckCircle, XCircle, Loader2 } from 'lucide-svelte';
  
  export let pedido;
  
  const dispatch = createEventDispatcher();
  let loading = false;
  let motivoRechazo = '';
  
  async function validar(aprobado) {
    if (!aprobado && motivoRechazo.trim().length < 10) {
      alert('Debe proporcionar un motivo de rechazo de al menos 10 caracteres');
      return;
    }
    
    loading = true;
    try {
      const res = await fetch(`/api/pedidos/${pedido.id}/validar-pago`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          aprobado,
          motivo_rechazo: aprobado ? null : motivoRechazo,
          validado_por: 'Vendedor'
        })
      });
      
      const result = await res.json();
      if (!result.success) throw new Error(result.error);
      
      alert(result.message);
      
      // ✅ CORRECCIÓN: Emitir evento de éxito para forzar recarga
      dispatch('validated', result.data);
      dispatch('close');
      
    } catch (error) {
      alert(error.message);
    } finally {
      loading = false;
    }
  }
</script>

<!-- Modal Backdrop -->
<div class="fixed inset-0 z-50 overflow-y-auto">
  <div class="flex items-center justify-center min-h-screen px-4">
    <div 
      class="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity"
      on:click={() => dispatch('close')}
    ></div>

    <div class="relative bg-white rounded-lg shadow-xl max-w-2xl w-full">
      <!-- Header -->
      <div class="px-6 py-4 border-b">
        <h3 class="text-xl font-semibold">Validar Comprobante de Pago</h3>
        <p class="text-sm text-gray-600 mt-1">Pedido #{pedido.numero_pedido}</p>
      </div>

      <!-- Comprobante -->
      <div class="px-6 py-4">
        {#if pedido.constancia_pago_url}
          <div class="mb-4">
            <label class="block text-sm font-medium text-gray-700 mb-2">Comprobante:</label>
            <img 
              src={pedido.constancia_pago_url} 
              alt="Comprobante"
              class="max-w-full h-auto rounded-lg border border-gray-300"
            />
          </div>
        {:else}
          <p class="text-red-600">⚠️ No hay comprobante subido</p>
        {/if}
        
        <!-- Campo de rechazo -->
        <div class="mt-4">
          <label class="block text-sm font-medium text-gray-700 mb-2">
            Motivo de rechazo (opcional):
          </label>
          <textarea
            bind:value={motivoRechazo}
            placeholder="Ej: El comprobante está ilegible, falta el nombre del titular, etc."
            rows="3"
            class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
          ></textarea>
        </div>
      </div>

      <!-- Acciones -->
      <div class="px-6 py-4 bg-gray-50 flex gap-3">
        <button
          on:click={() => validar(false)}
          disabled={loading}
          class="flex-1 btn-secondary flex items-center justify-center gap-2 text-red-600 border-red-300 hover:bg-red-50"
        >
          {#if loading}
            <Loader2 class="w-5 h-5 animate-spin" />
          {:else}
            <XCircle class="w-5 h-5" />
          {/if}
          Rechazar Pago
        </button>
        
        <button
          on:click={() => validar(true)}
          disabled={loading}
          class="flex-1 btn-primary flex items-center justify-center gap-2 bg-green-600 hover:bg-green-700"
        >
          {#if loading}
            <Loader2 class="w-5 h-5 animate-spin" />
          {:else}
            <CheckCircle class="w-5 h-5" />
          {/if}
          ✅ Aprobar Pago
        </button>
      </div>
    </div>
  </div>
</div>