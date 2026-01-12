<!-- src/lib/components/reportes/BuscadorProductos.svelte -->
<script>
  import { createEventDispatcher, onMount } from 'svelte';
  import { Search, X, Package } from 'lucide-svelte';
  
  const dispatch = createEventDispatcher();
  
  export let productoSeleccionado = null;
  
  let busqueda = '';
  let productos = [];
  let mostrarResultados = false;
  let cargando = false;
  let timeoutId = null;
  
  // Debounce para búsqueda
  $: if (busqueda) {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => {
      buscarProductos(busqueda);
    }, 300);
  }
  
  async function buscarProductos(termino) {
    if (!termino || termino.length < 2) {
      productos = [];
      return;
    }
    
    cargando = true;
    
    try {
      const response = await fetch('/api/productos');
      const data = await response.json();
      
      // Filtrar productos por nombre o SKU
      productos = data.filter(p => 
        p.nombre.toLowerCase().includes(termino.toLowerCase()) ||
        (p.sku && p.sku.toLowerCase().includes(termino.toLowerCase()))
      ).slice(0, 8);
      
      mostrarResultados = productos.length > 0;
    } catch (error) {
      console.error('Error buscando productos:', error);
    } finally {
      cargando = false;
    }
  }
  
  function seleccionarProducto(producto) {
    productoSeleccionado = producto;
    busqueda = producto.nombre;
    mostrarResultados = false;
    dispatch('seleccionar', producto);
  }
  
  function limpiar() {
    productoSeleccionado = null;
    busqueda = '';
    productos = [];
    mostrarResultados = false;
    dispatch('limpiar');
  }
  
  function formatCurrency(amount) {
    return new Intl.NumberFormat('es-MX', {
      style: 'currency',
      currency: 'MXN'
    }).format(amount || 0);
  }
  
  // Cerrar al hacer clic fuera
  function handleClickOutside(event) {
    if (!event.target.closest('.buscador-container')) {
      mostrarResultados = false;
    }
  }
  
  onMount(() => {
    document.addEventListener('click', handleClickOutside);
    return () => {
      document.removeEventListener('click', handleClickOutside);
      clearTimeout(timeoutId);
    };
  });
</script>

<div class="buscador-container relative">
  <label for="busqueda-producto" class="label text-sm">
    Buscar producto por nombre o SKU
  </label>
  
  <div class="relative">
    <div class="absolute left-3 top-1/2 transform -translate-y-1/2">
      {#if cargando}
        <div class="animate-spin rounded-full h-4 w-4 border-b-2 border-primary-600"></div>
      {:else}
        <Search class="w-4 h-4 text-gray-400" />
      {/if}
    </div>
    
    <input
      id="busqueda-producto"
      type="text"
      bind:value={busqueda}
      placeholder="Escribe para buscar..."
      class="input pl-10 pr-10 text-sm"
      on:focus={() => {
        if (productos.length > 0) mostrarResultados = true;
      }}
    />
    
    {#if busqueda}
      <button
        type="button"
        on:click={limpiar}
        class="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
      >
        <X class="w-4 h-4" />
      </button>
    {/if}
  </div>
  
  <!-- Resultados -->
  {#if mostrarResultados && productos.length > 0}
    <div class="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-80 overflow-y-auto">
      {#each productos as producto}
        <button
          type="button"
          on:click={() => seleccionarProducto(producto)}
          class="w-full px-4 py-3 text-left hover:bg-gray-50 border-b border-gray-100 last:border-b-0 transition-colors"
        >
          <div class="flex items-start gap-3">
            <!-- Imagen -->
            <div class="w-12 h-12 bg-gray-100 rounded-lg overflow-hidden flex-shrink-0">
              {#if producto.imagen_url}
                <img 
                  src={producto.imagen_url}
                  alt={producto.nombre}
                  class="w-full h-full object-cover"
                  on:error={(e) => e.target.style.display = 'none'}
                />
              {:else}
                <div class="w-full h-full flex items-center justify-center">
                  <Package class="w-6 h-6 text-gray-400" />
                </div>
              {/if}
            </div>
            
            <!-- Info -->
            <div class="flex-1 min-w-0">
              <p class="text-sm font-medium text-gray-900 truncate">
                {producto.nombre}
              </p>
              <div class="flex items-center gap-2 mt-1">
                <span class="text-xs text-primary-600 font-semibold">
                  {formatCurrency(producto.precio)}
                </span>
                {#if producto.sku}
                  <span class="text-xs text-gray-500">
                    SKU: {producto.sku}
                  </span>
                {/if}
              </div>
              {#if producto.stock !== null}
                <p class="text-xs text-gray-400 mt-1">
                  Stock: {producto.stock}
                </p>
              {/if}
            </div>
          </div>
        </button>
      {/each}
    </div>
  {/if}
  
  <!-- Producto seleccionado -->
  {#if productoSeleccionado}
    <div class="mt-3 p-3 bg-green-50 border border-green-200 rounded-lg">
      <div class="flex items-center justify-between">
        <div class="flex items-center gap-3">
          <div class="w-10 h-10 bg-white rounded-lg overflow-hidden flex-shrink-0">
            {#if productoSeleccionado.imagen_url}
              <img 
                src={productoSeleccionado.imagen_url}
                alt={productoSeleccionado.nombre}
                class="w-full h-full object-cover"
              />
            {:else}
              <div class="w-full h-full flex items-center justify-center">
                <Package class="w-5 h-5 text-gray-400" />
              </div>
            {/if}
          </div>
          <div>
            <p class="text-sm font-medium text-gray-900">
              {productoSeleccionado.nombre}
            </p>
            <p class="text-xs text-gray-600">
              {formatCurrency(productoSeleccionado.precio)}
            </p>
          </div>
        </div>
        <button
          type="button"
          on:click={limpiar}
          class="text-green-600 hover:text-green-800"
        >
          <X class="w-4 h-4" />
        </button>
      </div>
    </div>
  {/if}
  
  <p class="text-xs text-gray-500 mt-2">
    Busca por nombre o código SKU del producto
  </p>
</div>