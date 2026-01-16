<!-- 
  📁 /src/routes/(tienda)/+layout.svelte
  🎨 LAYOUT LIMPIO PARA ÁREA DE CLIENTES
-->

<script>
  import { page } from '$app/stores';
  
  // Detectar si estamos en vista de pedido para personalizar header
  $: esPedido = $page.url.pathname.includes('/pedidos/');
</script>

<div class="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
  
  <!-- Header Simple para Clientes -->
  {#if esPedido}
    <header class="bg-white shadow-sm border-b sticky top-0 z-10">
      <div class="max-w-4xl mx-auto px-4 py-4 flex items-center justify-between">
        <div class="flex items-center gap-3">
          <span class="text-2xl">🛍️</span>
          <div>
            <h1 class="text-lg font-bold text-gray-900">
              Seguimiento de Pedido
            </h1>
            <p class="text-xs text-gray-500">
              Consulta el estado en tiempo real
            </p>
          </div>
        </div>
        
        <!-- Badge de ayuda -->
        <a 
          href="#ayuda"
          class="hidden sm:flex items-center gap-2 px-3 py-2 text-sm text-gray-600 hover:text-gray-900 hover:bg-gray-50 rounded-lg transition-colors"
        >
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          Ayuda
        </a>
      </div>
    </header>
  {/if}

  <!-- Contenido Principal -->
  <main class="relative">
    <slot />
  </main>

  <!-- Footer Simple -->
  <footer class="bg-white border-t mt-12">
    <div class="max-w-4xl mx-auto px-4 py-8">
      <div class="text-center space-y-4">
        <div class="flex items-center justify-center gap-2 text-sm text-gray-600">
          <svg class="w-5 h-5 text-green-500" fill="currentColor" viewBox="0 0 24 24">
            <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z"/>
          </svg>
          <span class="font-medium">¿Necesitas ayuda?</span>
        </div>
        
        <p class="text-sm text-gray-500">
          Contáctanos por WhatsApp para cualquier consulta sobre tu pedido
        </p>

        <div class="pt-4 border-t text-xs text-gray-400">
          <p>© {new Date().getFullYear()} Todos los derechos reservados</p>
        </div>
      </div>
    </div>
  </footer>
</div>

<style>
  :global(body) {
    overflow-x: hidden;
  }
</style>