<!-- src/lib/components/cliente/SubirComprobante.svelte -->
<!-- ✅ VERSIÓN CORREGIDA: Usa ImageUploader para Cloudinary -->
<script>
  import { createEventDispatcher } from 'svelte';
  import { Upload, CheckCircle, Loader2, AlertCircle } from 'lucide-svelte';
  import ImageUploader from '$lib/components/ui/ImageUploader.svelte';
  
  export let pedido;
  export let esReenvio = false;
  
  const dispatch = createEventDispatcher();
  let loading = false;
  let error = '';
  let comprobanteUrl = '';
  let mostrarRequisitos = true;
  
  function handleImageUploaded(event) {
    comprobanteUrl = event.detail.url;
    error = '';
    console.log('✅ Imagen subida a Cloudinary:', comprobanteUrl);
  }
  
  function handleImageRemoved() {
    comprobanteUrl = '';
  }
  
  async function enviarComprobante() {
    if (!comprobanteUrl) {
      error = 'Primero sube una imagen del comprobante';
      return;
    }
    
    loading = true;
    error = '';
    
    try {
      // Enviar URL del comprobante al backend
      const res = await fetch(`/api/pedidos/${pedido.id}/subir-comprobante`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          comprobante_url: comprobanteUrl
        })
      });
      
      const result = await res.json();
      
      if (!result.success) {
        throw new Error(result.error);
      }
      
      dispatch('success');
      
    } catch (err) {
      error = err.message || 'Error al enviar el comprobante';
      console.error('Error:', err);
    } finally {
      loading = false;
    }
  }
</script>

<div class="bg-gradient-to-br from-blue-50 to-primary-50 rounded-2xl shadow-lg p-6 mb-6 border-2 border-primary-200">
  <div class="flex items-start gap-4 mb-6">
    <div class="w-12 h-12 bg-primary-100 rounded-full flex items-center justify-center flex-shrink-0">
      <Upload class="w-6 h-6 text-primary-600" />
    </div>
    <div class="flex-1">
      <h3 class="text-lg font-bold text-gray-900 mb-1">
        {esReenvio ? 'Reenviar Comprobante de Pago' : 'Sube tu Comprobante de Pago'}
      </h3>
      <p class="text-sm text-gray-700">
        Para continuar con tu pedido, necesitamos validar tu pago
      </p>
    </div>
  </div>
  
  <!-- Requisitos del comprobante -->
  {#if mostrarRequisitos}
    <div class="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
      <button
        type="button"
        on:click={() => mostrarRequisitos = false}
        class="float-right text-blue-600 hover:text-blue-800"
      >
        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/>
        </svg>
      </button>
      <h4 class="font-medium text-blue-900 mb-2 text-sm">✅ Requisitos del comprobante:</h4>
      <ul class="text-sm text-blue-800 space-y-1">
        <li>• Imagen clara y legible</li>
        <li>• Fecha y hora visible</li>
        <li>• Monto correcto: ${pedido.total.toFixed(2)}</li>
        <li>• Nombre del titular visible</li>
      </ul>
    </div>
  {/if}
  
  <!-- ✅ COMPONENTE REUTILIZABLE de ImageUploader -->
  <div class="mb-4">
    <ImageUploader
      bind:imageUrl={comprobanteUrl}
      label="Comprobante de Pago"
      required={true}
      on:upload={handleImageUploaded}
      on:remove={handleImageRemoved}
    />
  </div>
  
  {#if error}
    <div class="bg-red-50 border-l-4 border-red-500 p-4 rounded-lg mb-4">
      <div class="flex items-center gap-3">
        <AlertCircle class="w-5 h-5 text-red-600" />
        <p class="text-sm text-red-800">{error}</p>
      </div>
    </div>
  {/if}
  
  <!-- Botón de envío -->
  {#if comprobanteUrl}
    <button
      on:click={enviarComprobante}
      disabled={loading}
      class="w-full bg-primary-600 text-white rounded-xl py-4 hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg flex items-center justify-center gap-3 font-semibold text-lg"
    >
      {#if loading}
        <Loader2 class="w-6 h-6 animate-spin" />
        <span>Enviando...</span>
      {:else}
        <CheckCircle class="w-6 h-6" />
        <span>Enviar Comprobante</span>
      {/if}
    </button>
    
    <p class="text-xs text-gray-500 text-center mt-3">
      📲 Recibirás notificación cuando validemos tu pago
    </p>
  {/if}
</div>