<!-- src/lib/components/pedidos/ModalCancelar.svelte -->
<script>
  import { createEventDispatcher } from 'svelte';
  import { XCircle, Loader2, AlertTriangle } from 'lucide-svelte';
  
  export let pedido;
  
  const dispatch = createEventDispatcher();
  let loading = false;
  let motivo = '';
  let error = '';
  
  const motivosComunes = [
    'Producto sin stock',
    'Cliente solicitó cancelación',
    'Datos de envío incorrectos',
    'Pago no verificado después de 48h',
    'Error en el pedido',
    'Otro (especificar abajo)'
  ];
  
  async function cancelarPedido() {
    if (!motivo || motivo.trim().length < 10) {
      error = 'El motivo debe tener al menos 10 caracteres';
      return;
    }
    
    if (!confirm('¿Está seguro de cancelar este pedido? Esta acción no se puede deshacer.')) {
      return;
    }
    
    loading = true;
    error = '';
    
    try {
      const res = await fetch(`/api/pedidos/${pedido.id}/cancelar`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ motivo: motivo.trim() })
      });
      
      const result = await res.json();
      
      if (!result.success) {
        throw new Error(result.error);
      }
      
      alert('✅ ' + result.message);
      dispatch('close');
      
    } catch (err) {
      error = err.message;
    } finally {
      loading = false;
    }
  }
  
  function seleccionarMotivoComun(motivoSeleccionado) {
    if (motivoSeleccionado === 'Otro (especificar abajo)') {
      motivo = '';
    } else {
      motivo = motivoSeleccionado;
    }
  }
</script>

<!-- Modal Backdrop -->
<div class="fixed inset-0 z-50 overflow-y-auto">
  <div class="flex items-center justify-center min-h-screen px-4 py-4">
    <!-- Backdrop -->
    <div 
      class="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity"
      on:click={() => dispatch('close')}
    ></div>

    <!-- Modal -->
    <div class="relative bg-white rounded-lg shadow-xl max-w-lg w-full">
      <!-- Header -->
      <div class="px-6 py-4 border-b border-gray-200 bg-red-50">
        <div class="flex items-center gap-3">
          <div class="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center">
            <AlertTriangle class="w-6 h-6 text-red-600" />
          </div>
          <div>
            <h3 class="text-lg font-semibold text-gray-900">Cancelar Pedido</h3>
            <p class="text-sm text-gray-600">#{pedido.numero_pedido}</p>
          </div>
        </div>
      </div>

      <!-- Content -->
      <div class="px-6 py-4 space-y-4">
        <!-- Advertencia -->
        <div class="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <div class="flex items-start gap-3">
            <AlertTriangle class="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
            <div class="text-sm text-yellow-800">
              <p class="font-medium mb-1">⚠️ Esta acción es irreversible</p>
              <p>El cliente será notificado por WhatsApp con el motivo de la cancelación.</p>
            </div>
          </div>
        </div>
        
        <!-- Info del pedido -->
        <div class="bg-gray-50 rounded-lg p-4 space-y-2">
          <div class="flex justify-between text-sm">
            <span class="text-gray-600">Cliente:</span>
            <span class="font-medium">{pedido.cliente_nombre}</span>
          </div>
          <div class="flex justify-between text-sm">
            <span class="text-gray-600">WhatsApp:</span>
            <span class="font-medium">{pedido.cliente_whatsapp}</span>
          </div>
          <div class="flex justify-between text-sm">
            <span class="text-gray-600">Total:</span>
            <span class="font-bold text-gray-900">
              ${pedido.total?.toFixed(2) || '0.00'}
            </span>
          </div>
        </div>
        
        <!-- Motivos comunes -->
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-2">
            Motivo de cancelación (selecciona o escribe)
          </label>
          <div class="grid grid-cols-2 gap-2 mb-3">
            {#each motivosComunes as motivoComun}
              <button
                type="button"
                on:click={() => seleccionarMotivoComun(motivoComun)}
                class="text-left text-sm px-3 py-2 border rounded-lg transition-colors {
                  motivo === motivoComun 
                    ? 'border-primary-500 bg-primary-50 text-primary-700' 
                    : 'border-gray-300 bg-white hover:border-gray-400'
                }"
              >
                {motivoComun}
              </button>
            {/each}
          </div>
        </div>
        
        <!-- Campo de texto para motivo -->
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-2">
            Motivo detallado *
          </label>
          <textarea
            bind:value={motivo}
            placeholder="Describe el motivo de la cancelación (mínimo 10 caracteres)"
            rows="4"
            class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent resize-none"
            class:border-red-500={error}
          ></textarea>
          <div class="flex justify-between items-center mt-1">
            <p class="text-xs text-gray-500">
              {motivo.length} / 10 caracteres mínimos
            </p>
            {#if error}
              <p class="text-xs text-red-600">{error}</p>
            {/if}
          </div>
        </div>
      </div>

      <!-- Footer -->
      <div class="px-6 py-4 bg-gray-50 border-t border-gray-200 flex flex-col sm:flex-row gap-3">
        <button
          type="button"
          on:click={() => dispatch('close')}
          class="flex-1 px-4 py-2 bg-white border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 font-medium transition-colors"
          disabled={loading}
        >
          Volver
        </button>
        
        <button
          type="button"
          on:click={cancelarPedido}
          disabled={loading || motivo.trim().length < 10}
          class="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
        >
          {#if loading}
            <Loader2 class="w-5 h-5 animate-spin" />
            <span>Cancelando...</span>
          {:else}
            <XCircle class="w-5 h-5" />
            <span>Confirmar Cancelación</span>
          {/if}
        </button>
      </div>
    </div>
  </div>
</div>

<style>
  textarea:focus {
    outline: none;
  }
</style>