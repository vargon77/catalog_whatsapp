<!-- src/routes/+page.svelte -->
<script>
  import ProductCard from '$lib/components/catalog/ProductCard.svelte';
  import { Search, Filter, AlertCircle } from 'lucide-svelte';
  
  // Recibir datos desde +page.server.js
  export let data;
  
  // Estados locales
  let busqueda = '';
  let categoriaFiltro = 'todas';
  let loading = false;
  
  // Productos desde Supabase
  $: productos = data.productos || [];
  $: categorias = data.categorias || [];
  $: configuracion = data.configuracion;
  
  // Filtrar productos localmente
  $: productosFiltrados = productos.filter(producto => {
    const coincideBusqueda = producto.nombre.toLowerCase().includes(busqueda.toLowerCase()) ||
                            (producto.descripcion_larga || '').toLowerCase().includes(busqueda.toLowerCase());
    
    const coincideCategoria = categoriaFiltro === 'todas' || 
                             producto.categoria_id === categoriaFiltro;
    
    return coincideBusqueda && coincideCategoria;
  });
  
  // Función para recargar productos (opcional para refrescar)
  async function recargarProductos() {
    loading = true;
    try {
      const response = await fetch('/api/productos?limit=50');
      const result = await response.json();
      if (result.success) {
        productos = result.data;
      }
    } catch (error) {
      console.error('Error recargando productos:', error);
    } finally {
      loading = false;
    }
  }
</script>

<svelte:head>
  <title>{configuracion?.nombre_empresa || 'CatálogoExpress'} - Catálogo de Productos</title>
  <meta name="description" content="Encuentra los mejores productos y haz tu pedido por WhatsApp" />
</svelte:head>

<div class="space-y-8">
  <!-- Hero Section -->
  <section class="bg-gradient-to-r from-primary-500 to-primary-600 rounded-2xl p-8 text-white">
    <div class="max-w-2xl">
      <h1 class="text-4xl font-bold mb-4">Catálogo de Productos</h1>
      <p class="text-lg opacity-90">
        Encuentra los mejores productos y haz tu pedido directamente por WhatsApp. 
        Fácil, rápido y sin complicaciones.
      </p>
      {#if productos.length > 0}
        <p class="mt-4 text-sm opacity-75">
          🎉 {productos.length} productos disponibles
        </p>
      {/if}
    </div>
  </section>
  
  <!-- Filtros y Búsqueda -->
  <div class="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
    <div class="flex flex-col md:flex-row md:items-center justify-between gap-4">
      <!-- Búsqueda -->
      <div class="flex-1">
        <div class="relative">
          <Search class="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
          <input
            type="text"
            placeholder="Buscar productos..."
            bind:value={busqueda}
            class="input pl-10"
          />
        </div>
      </div>
      
      <!-- Filtro por categoría -->
      {#if categorias.length > 0}
        <div class="w-full md:w-64">
          <div class="relative">
            <Filter class="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <select 
              bind:value={categoriaFiltro}
              class="input pl-10 appearance-none"
            >
              <option value="todas">Todas las categorías</option>
              {#each categorias as categoria}
                <option value={categoria.id}>{categoria.nombre}</option>
              {/each}
            </select>
          </div>
        </div>
      {/if}
    </div>
  </div>
  
  <!-- Contador de resultados -->
  <div class="flex justify-between items-center">
    <h2 class="text-2xl font-bold text-gray-800">
      Productos 
      {#if productosFiltrados.length !== productos.length}
        ({productosFiltrados.length})
      {/if}
    </h2>
    <span class="text-gray-600">
      {productosFiltrados.length} {productosFiltrados.length === 1 ? 'producto' : 'productos'} encontrados
    </span>
  </div>
  
  <!-- Grid de Productos -->
  {#if loading}
    <!-- Estado de carga -->
    <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
      {#each Array(8) as _}
        <div class="card animate-pulse">
          <div class="h-48 bg-gray-200"></div>
          <div class="p-4 space-y-3">
            <div class="h-4 bg-gray-200 rounded w-3/4"></div>
            <div class="h-3 bg-gray-200 rounded w-full"></div>
            <div class="h-3 bg-gray-200 rounded w-5/6"></div>
            <div class="h-8 bg-gray-200 rounded mt-4"></div>
          </div>
        </div>
      {/each}
    </div>
  {:else if productosFiltrados.length > 0}
    <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
      {#each productosFiltrados as producto (producto.id)}
        <ProductCard {producto} {configuracion} />
      {/each}
    </div>
  {:else if productos.length === 0}
    <!-- Sin productos en la base de datos -->
    <div class="text-center py-16 bg-white rounded-xl border-2 border-dashed border-gray-300">
      <div class="max-w-md mx-auto">
        <div class="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-6">
          <AlertCircle class="w-12 h-12 text-gray-400" />
        </div>
        <h3 class="text-xl font-semibold text-gray-700 mb-2">No hay productos disponibles</h3>
        <p class="text-gray-500 mb-6">
          Aún no se han agregado productos al catálogo. Usa el panel de administración para agregar productos.
        </p>
        <a href="/dashboard/productos" class="btn-primary inline-block">
          Ir al panel de administración
        </a>
      </div>
    </div>
  {:else}
    <!-- No hay resultados de búsqueda -->
    <div class="text-center py-16 bg-white rounded-xl border-2 border-dashed border-gray-300">
      <div class="max-w-md mx-auto">
        <div class="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-6">
          <Search class="w-12 h-12 text-gray-400" />
        </div>
        <h3 class="text-xl font-semibold text-gray-700 mb-2">No se encontraron productos</h3>
        <p class="text-gray-500 mb-6">
          {busqueda 
            ? `No hay resultados para "${busqueda}"` 
            : 'Intenta ajustar los filtros de búsqueda'}
        </p>
        {#if busqueda || categoriaFiltro !== 'todas'}
          <button 
            on:click={() => { busqueda = ''; categoriaFiltro = 'todas'; }}
            class="btn-primary"
          >
            Limpiar filtros
          </button>
        {/if}
      </div>
    </div>
  {/if}
  
  <!-- Información adicional -->
  {#if productos.length > 0}
    <div class="bg-blue-50 border border-blue-100 rounded-xl p-6">
      <div class="flex items-start space-x-3">
        <div class="flex-shrink-0">
          <svg class="w-6 h-6 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
          </svg>
        </div>
        <div>
          <h3 class="font-semibold text-blue-800 mb-1">¿Cómo comprar?</h3>
          <ul class="text-sm text-blue-700 space-y-1">
            <li>1. Agrega productos a tu carrito</li>
            <li>2. Revisa tu pedido en el carrito</li>
            <li>3. Envía tu pedido por WhatsApp</li>
            <li>4. Coordina pago y entrega directamente</li>
          </ul>
        </div>
      </div>
    </div>
  {/if}
</div>

<style>
  /* Animación suave para cambios de productos */
  @keyframes fadeIn {
    from {
      opacity: 0;
      transform: translateY(10px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }
  
  :global(.card) {
    animation: fadeIn 0.3s ease-out;
  }
</style>