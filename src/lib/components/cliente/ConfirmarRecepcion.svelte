<!-- src/lib/components/cliente/ConfirmarRecepcion.svelte -->
<script>
  import { createEventDispatcher } from 'svelte';
  import { CheckCircle, Loader2, Star, MessageSquare } from 'lucide-svelte';
  
  export let pedido;
  
  const dispatch = createEventDispatcher();
  let loading = false;
  let error = '';
  let mostrarModal = false;
  let calificacion = 0;
  let comentario = '';
  
  function abrirModal() {
    mostrarModal = true;
  }
  
  function cerrarModal() {
    mostrarModal = false;
    calificacion = 0;
    comentario = '';
  }
  
  async function confirmarRecepcion() {
    loading = true;
    error = '';
    
    try {
      const res = await fetch(`/api/pedidos/${pedido.id}/marcar-recibido`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          calificacion,
          comentario: comentario.trim() || null
        })
      });
      
      const result = await res.json();
      
      if (!result.success) {
        throw new Error(result.error);
      }
      
      dispatch('success');
      cerrarModal();
      
    } catch (err) {
      error = err.message || 'Error al confirmar recepción';
    } finally {
      loading = false;
    }
  }
</script>

<div class="bg-gradient-to-br from-green-50 to-emerald-50 rounded-2xl shadow-lg p-6 mb-6 border-2 border-green-200">
  <div class="flex items-start gap-4 mb-6">
    <div class="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0">
      <CheckCircle class="w-6 h-6 text-green-600" />
    </div>
    <div class="flex-1">
      <h3 class="text-lg font-bold text-gray-900 mb-1">
        ¿Ya recibiste tu pedido?
      </h3>
      <p class="text-sm text-gray-700">
        Confirma la recepción para finalizar tu pedido
      </p>
    </div>
  </div>
  
  <button
    on:click={abrirModal}
    class="w-full bg-green-600 text-white rounded-xl py-4 hover:bg-green-700 transition-all shadow-lg flex items-center justify-center gap-3 font-semibold text-lg"
  >
    <CheckCircle class="w-6 h-6" />
    <span>Sí, ya recibí mi pedido</span>
  </button>
</div>

<!-- Modal de confirmación -->
{#if mostrarModal}
  <div class="fixed inset-0 z-50 overflow-y-auto">
    <div class="flex items-center justify-center min-h-screen px-4 py-4">
      <!-- Backdrop -->
      <div 
        class="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity"
        on:click={cerrarModal}
      ></div>

      <!-- Modal -->
      <div class="relative bg-white rounded-2xl shadow-xl max-w-lg w-full p-6">
        <!-- Animación de confetti -->
        <div class="text-center mb-6">
          <div class="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <CheckCircle class="w-10 h-10 text-green-600" />
          </div>
          <h3 class="text-2xl font-bold text-gray-900 mb-2">
            ¡Excelente! 🎉
          </h3>
          <p class="text-gray-600">
            Nos alegra que hayas recibido tu pedido
          </p>
        </div>
        
        <!-- Calificación -->
        <div class="mb-6">
          <label class="block text-sm font-medium text-gray-700 mb-3 text-center">
            ¿Cómo fue tu experiencia?
          </label>
          <div class="flex justify-center gap-2">
            {#each [1, 2, 3, 4, 5] as estrella}
              <button
                on:click={() => calificacion = estrella}
                class="w-12 h-12 transition-transform hover:scale-110"
              >
                <Star 
                  class="w-full h-full {calificacion >= estrella ? 'text-yellow-400 fill-yellow-400' : 'text-gray-300'}"
                />
              </button>
            {/each}
          </div>
        </div>
        
        <!-- Comentario opcional -->
        <div class="mb-6">
          <label class="block text-sm font-medium text-gray-700 mb-2">
            <MessageSquare class="w-4 h-4 inline mr-1" />
            Comentarios (opcional)
          </label>
          <textarea
            bind:value={comentario}
            placeholder="Cuéntanos sobre tu experiencia..."
            rows="3"
            class="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent resize-none"
            maxlength="500"
          ></textarea>
          <p class="text-xs text-gray-500 mt-1 text-right">
            {comentario.length}/500
          </p>
        </div>
        
        {#if error}
          <div class="mb-4 bg-red-50 border-l-4 border-red-500 p-4 rounded-lg">
            <p class="text-sm text-red-800">{error}</p>
          </div>
        {/if}
        
        <!-- Botones -->
        <div class="flex gap-3">
          <button
            on:click={cerrarModal}
            disabled={loading}
            class="flex-1 px-6 py-3 bg-gray-100 text-gray-700 rounded-xl hover:bg-gray-200 font-medium transition-colors"
          >
            Cancelar
          </button>
          
          <button
            on:click={confirmarRecepcion}
            disabled={loading}
            class="flex-1 px-6 py-3 bg-green-600 text-white rounded-xl hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed font-medium transition-all shadow-lg flex items-center justify-center gap-2"
          >
            {#if loading}
              <Loader2 class="w-5 h-5 animate-spin" />
              <span>Confirmando...</span>
            {:else}
              <CheckCircle class="w-5 h-5" />
              <span>Confirmar Recepción</span>
            {/if}
          </button>
        </div>
      </div>
    </div>
  </div>
{/if}