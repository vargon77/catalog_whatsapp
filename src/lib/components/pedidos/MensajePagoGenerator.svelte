<!-- src/lib/components/pedidos/MensajePagoGenerator.svelte -->
<script>
  import { Copy, CheckCircle, MessageCircle, Loader2 } from 'lucide-svelte';
  import { onMount } from 'svelte';
  
  export let pedido;
  export let cuentas = [];
  
  let mensajeGenerado = '';
  let copiado = false;
  let loading = false;
  let error = '';
  
  onMount(async () => {
    await generarMensajeAutomatico();
  });
  
  async function generarMensajeAutomatico() {
    loading = true;
    error = '';
    
    try {
      const res = await fetch(`/api/pedidos/${pedido.id}/generar-mensaje`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tipo: 'pedido_confirmado' })
      });
      
      const result = await res.json();
      
      if (!result.success) {
        throw new Error(result.error);
      }
      
      mensajeGenerado = result.data.mensaje;
      
    } catch (err) {
      error = err.message;
      console.error('Error generando mensaje:', err);
    } finally {
      loading = false;
    }
  }
  
  async function copiar() {
    await navigator.clipboard.writeText(mensajeGenerado);
    copiado = true;
    setTimeout(() => copiado = false, 2000);
  }
  
  async function enviarPorWhatsApp() {
    try {
      const res = await fetch(`/api/pedidos/${pedido.id}/generar-mensaje`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tipo: 'pedido_confirmado' })
      });
      
      const result = await res.json();
      
      if (result.success && result.data.url) {
        window.open(result.data.url, '_blank');
      }
    } catch (err) {
      console.error('Error:', err);
    }
  }
</script>

<div class="space-y-4">
  {#if loading}
    <div class="flex items-center justify-center py-8">
      <Loader2 class="w-6 h-6 animate-spin text-primary-600" />
      <span class="ml-2 text-sm text-gray-600">Generando mensaje...</span>
    </div>
  {:else if error}
    <div class="bg-red-50 border border-red-200 rounded-lg p-3">
      <p class="text-sm text-red-800">{error}</p>
    </div>
  {:else}
    <div>
      <label class="label">Mensaje generado automáticamente:</label>
      <div class="relative">
        <textarea
          bind:value={mensajeGenerado}
          rows="14"
          class="input font-mono text-sm whitespace-pre-wrap"
          readonly
        ></textarea>
        
        <button
          on:click={copiar}
          class="absolute top-2 right-2 btn-secondary flex items-center gap-2 text-xs"
        >
          {#if copiado}
            <CheckCircle class="w-4 h-4 text-green-600" />
            <span>¡Copiado!</span>
          {:else}
            <Copy class="w-4 h-4" />
            <span>Copiar</span>
          {/if}
        </button>
      </div>
    </div>
    
    <div class="flex gap-2">
      <button
        on:click={enviarPorWhatsApp}
        class="flex-1 btn-primary flex items-center justify-center gap-2 bg-green-600 hover:bg-green-700"
      >
        <MessageCircle class="w-4 h-4" />
        <span>Enviar por WhatsApp</span>
      </button>
      
      <button
        on:click={copiar}
        class="px-4 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 flex items-center gap-2"
      >
        <Copy class="w-4 h-4" />
      </button>
    </div>
    
    <div class="bg-blue-50 border border-blue-200 rounded-lg p-3">
      <p class="text-xs text-blue-800">
        💡 Este mensaje se generó automáticamente con los datos de pago configurados
      </p>
    </div>
  {/if}
</div>