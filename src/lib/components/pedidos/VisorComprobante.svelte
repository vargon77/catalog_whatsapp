<!-- src/lib/components/pedidos/VisorComprobante.svelte -->
<script>
  import { FileText, Download, ExternalLink, ZoomIn, X } from 'lucide-svelte';
  
  export let comprobante_url = '';
  export let mostrarAcciones = true;
  export let titulo = 'Comprobante de Pago';
  
  let modalAbierto = false;
  let cargando = true;
  let error = false;
  
  function abrirModal() {
    modalAbierto = true;
  }
  
  function cerrarModal() {
    modalAbierto = false;
  }
  
  function descargarComprobante() {
    window.open(comprobante_url, '_blank');
  }
  
  function handleImageLoad() {
    cargando = false;
    error = false;
  }
  
  function handleImageError() {
    cargando = false;
    error = true;
  }
</script>

{#if comprobante_url}
  <div class="space-y-3">
    <div class="flex items-center justify-between">
      <label class="text-sm font-medium text-gray-700 flex items-center gap-2">
        <FileText class="w-4 h-4 text-gray-500" />
        {titulo}
      </label>
      
      {#if mostrarAcciones}
        <div class="flex gap-2">
          <button
            type="button"
            on:click={abrirModal}
            class="text-sm text-indigo-600 hover:text-indigo-800 flex items-center gap-1"
            title="Ver ampliado"
          >
            <ZoomIn class="w-3 h-3" />
            Ampliar
          </button>
          
          <button
            type="button"
            on:click={descargarComprobante}
            class="text-sm text-indigo-600 hover:text-indigo-800 flex items-center gap-1"
            title="Descargar"
          >
            <Download class="w-3 h-3" />
            Descargar
          </button>
        </div>
      {/if}
    </div>
    
    <!-- Vista previa -->
    <div class="relative bg-gray-100 rounded-lg overflow-hidden border border-gray-300 cursor-pointer group" on:click={abrirModal}>
      {#if cargando}
        <div class="absolute inset-0 flex items-center justify-center">
          <div class="animate-spin w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full"></div>
        </div>
      {/if}
      
      {#if error}
        <div class="h-64 flex items-center justify-center bg-red-50">
          <div class="text-center">
            <FileText class="w-12 h-12 text-red-400 mx-auto mb-2" />
            <p class="text-sm text-red-600">Error al cargar la imagen</p>
            <button
              type="button"
              on:click|stopPropagation={descargarComprobante}
              class="text-xs text-indigo-600 hover:text-indigo-800 mt-2 flex items-center gap-1 mx-auto"
            >
              <ExternalLink class="w-3 h-3" />
              Abrir en nueva pestaña
            </button>
          </div>
        </div>
      {:else}
        <img 
          src={comprobante_url}
          alt="Comprobante de pago"
          class="w-full h-auto max-h-96 object-contain transition-transform group-hover:scale-105"
          on:load={handleImageLoad}
          on:error={handleImageError}
        />
        
        <!-- Overlay de hover -->
        <div class="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-30 transition-all flex items-center justify-center opacity-0 group-hover:opacity-100">
          <div class="bg-white rounded-full p-3 shadow-lg">
            <ZoomIn class="w-6 h-6 text-gray-700" />
          </div>
        </div>
      {/if}
    </div>
    
    <a 
      href={comprobante_url}
      target="_blank"
      rel="noopener noreferrer"
      class="text-xs text-gray-500 hover:text-gray-700 flex items-center gap-1 break-all"
    >
      <ExternalLink class="w-3 h-3 flex-shrink-0" />
      Ver original
    </a>
  </div>
  
  <!-- Modal de imagen ampliada -->
  {#if modalAbierto}
    <div class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-80" on:click={cerrarModal}>
      <div class="relative max-w-6xl max-h-[90vh] w-full h-full flex items-center justify-center">
        <button
          type="button"
          on:click={cerrarModal}
          class="absolute top-4 right-4 bg-white rounded-full p-2 shadow-lg hover:bg-gray-100 z-10"
        >
          <X class="w-6 h-6 text-gray-700" />
        </button>
        
        <img 
          src={comprobante_url}
          alt="Comprobante ampliado"
          class="max-w-full max-h-full object-contain rounded-lg shadow-2xl"
          on:click|stopPropagation
        />
        
        <div class="absolute bottom-4 left-1/2 transform -translate-x-1/2 bg-white rounded-full px-4 py-2 shadow-lg">
          <button
            type="button"
            on:click={descargarComprobante}
            class="flex items-center gap-2 text-sm font-medium text-gray-700 hover:text-indigo-600"
          >
            <Download class="w-4 h-4" />
            Descargar
          </button>
        </div>
      </div>
    </div>
  {/if}
{:else}
  <div class="space-y-2">
    <label class="text-sm font-medium text-gray-700 flex items-center gap-2">
      <FileText class="w-4 h-4 text-gray-500" />
      {titulo}
    </label>
    <div class="bg-gray-50 border border-gray-200 rounded-lg p-4 text-center">
      <FileText class="w-8 h-8 text-gray-400 mx-auto mb-2" />
      <p class="text-sm text-gray-500">Sin comprobante</p>
    </div>
  </div>
{/if}

<style>
  /* Animación suave para el modal */
  @keyframes fadeIn {
    from {
      opacity: 0;
    }
    to {
      opacity: 1;
    }
  }
  
  .fixed {
    animation: fadeIn 0.2s ease-out;
  }
</style>