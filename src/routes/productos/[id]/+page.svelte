<!-- src/routes/productos/[id]/+page.svelte -->
<script>
  import { ShoppingCart, ArrowLeft, MessageCircle, Package } from 'lucide-svelte';
  import { carrito } from '$lib/stores/carritoStore';
  import { generarEnlacePregunta } from '$lib/utils/whatsapp';
  import ProductCard from '$lib/components/catalog/ProductCard.svelte';
  
  export let data;
  
  $: producto = data.producto;
  $: configuracion = data.configuracion;
  $: relacionados = data.relacionados;
  
  let cantidad = 1;
  let agregadoReciente = false;
  
  $: precioMostrar = producto.precio_oferta || producto.precio;
  $: tieneOferta = producto.precio_oferta && producto.precio_oferta < producto.precio;
  $: descuentoPorcentaje = tieneOferta 
    ? Math.round(((producto.precio - producto.precio_oferta) / producto.precio) * 100)
    : 0;
  $: subtotal = precioMostrar * cantidad;
  $: sinStock = producto.stock === 0;
  $: stockBajo = producto.stock > 0 && producto.stock <= 5;
  
  function aumentar() {
    if (producto.stock && cantidad >= producto.stock) return;
    cantidad++;
  }
  
  function disminuir() {
    if (cantidad > 1) cantidad--;
  }
  
  function agregarAlCarrito() {
    if (sinStock) return;
    
    carrito.agregarProducto({
      ...producto,
      precio_unitario: precioMostrar,
      cantidad
    });
    
    agregadoReciente = true;
    setTimeout(() => agregadoReciente = false, 3000);
  }
  
  function preguntarWhatsApp() {
    const url = generarEnlacePregunta({...producto, precio: precioMostrar}, configuracion);
    window.open(url, '_blank');
  }
</script>

<svelte:head>
  <title>{producto.nombre} | {configuracion.nombre_empresa || 'CatálogoExpress'}</title>
</svelte:head>

<div class="max-w-7xl mx-auto">
  <!-- Breadcrumb -->
  <nav class="mb-6 flex items-center text-sm text-gray-600">
    <a href="/" class="hover:text-primary-600">Inicio</a>
    <span class="mx-2">/</span>
    {#if producto.categoria}
      <a href="/?categoria={producto.categoria_id}" class="hover:text-primary-600">
        {producto.categoria.nombre}
      </a>
      <span class="mx-2">/</span>
    {/if}
    <span class="text-gray-900 truncate max-w-xs">{producto.nombre}</span>
  </nav>
  
  <!-- Producto -->
  <div class="bg-white rounded-xl shadow-sm overflow-hidden mb-8">
    <div class="grid grid-cols-1 lg:grid-cols-2 gap-8 p-6 md:p-8">
      <!-- Imagen -->
      <div class="relative aspect-square bg-gray-100 rounded-lg overflow-hidden">
        {#if producto.imagen_url}
          <img 
            src={producto.imagen_url}
            alt={producto.nombre}
            class="w-full h-full object-cover"
          />
        {:else}
          <div class="w-full h-full flex items-center justify-center">
            <Package class="w-24 h-24 text-gray-400" />
          </div>
        {/if}
        
        <!-- Badges -->
        <div class="absolute top-4 right-4 flex flex-col gap-2">
          {#if tieneOferta}
            <span class="bg-red-500 text-white text-sm font-bold px-3 py-1 rounded-full shadow-lg">
              -{descuentoPorcentaje}%
            </span>
          {/if}
          {#if sinStock}
            <span class="bg-red-500 text-white text-sm font-bold px-3 py-1 rounded-full shadow-lg">
              Agotado
            </span>
          {:else if stockBajo}
            <span class="bg-amber-500 text-white text-sm font-bold px-3 py-1 rounded-full shadow-lg">
              ¡Solo {producto.stock}!
            </span>
          {/if}
          {#if producto.destacado}
            <span class="bg-purple-500 text-white text-sm font-bold px-3 py-1 rounded-full shadow-lg">
              ⭐ Destacado
            </span>
          {/if}
        </div>
      </div>
      
      <!-- Info -->
      <div class="flex flex-col">
        <!-- Marca -->
        {#if producto.marca}
          <p class="text-sm text-gray-500 uppercase tracking-wide mb-2">
            {producto.marca.nombre}
          </p>
        {/if}
        
        <!-- Nombre -->
        <h1 class="text-3xl font-bold text-gray-900 mb-4">
          {producto.nombre}
        </h1>
        
        <!-- Precio -->
        <div class="mb-6">
          <div class="flex items-baseline gap-3">
            <span class="text-4xl font-bold text-primary-700">
              {configuracion.moneda_simbolo}{precioMostrar.toFixed(2)}
            </span>
            {#if tieneOferta}
              <span class="text-xl text-gray-500 line-through">
                {configuracion.moneda_simbolo}{producto.precio.toFixed(2)}
              </span>
            {/if}
          </div>
          
          {#if tieneOferta}
            <p class="text-sm text-green-600 font-medium mt-1">
              Ahorras {configuracion.moneda_simbolo}{(producto.precio - precioMostrar).toFixed(2)}
            </p>
          {/if}
        </div>
        
        <!-- Stock -->
        {#if !sinStock}
          <div class="mb-6">
            <p class="text-sm text-gray-600">
              Disponibilidad: 
              <span class="font-medium" class:text-amber-600={stockBajo} class:text-green-600={!stockBajo}>
                {producto.stock} unidades
              </span>
            </p>
          </div>
        {/if}
        
        <!-- SKU -->
        {#if producto.sku}
          <p class="text-sm text-gray-500 mb-6">
            SKU: {producto.sku}
          </p>
        {/if}
        
        <!-- Selector cantidad -->
        <div class="mb-6">
          <label class="block text-sm font-medium text-gray-700 mb-2">
            Cantidad
          </label>
          <div class="flex items-center gap-4">
            <div class="flex items-center border border-gray-300 rounded-lg">
              <button
                on:click={disminuir}
                disabled={cantidad <= 1 || sinStock}
                class="px-4 py-2 text-gray-600 hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                −
              </button>
              <span class="px-6 py-2 font-medium text-gray-900 border-x border-gray-300">
                {cantidad}
              </span>
              <button
                on:click={aumentar}
                disabled={sinStock || (producto.stock && cantidad >= producto.stock)}
                class="px-4 py-2 text-gray-600 hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                +
              </button>
            </div>
            
            <div class="text-lg font-bold text-gray-900">
              Subtotal: {configuracion.moneda_simbolo}{subtotal.toFixed(2)}
            </div>
          </div>
        </div>
        
        <!-- Botones -->
        <div class="flex flex-col sm:flex-row gap-3 mb-6">
          <button
            on:click={agregarAlCarrito}
            disabled={sinStock}
            class="flex-1 btn-primary flex items-center justify-center gap-2"
          >
            <ShoppingCart class="w-5 h-5" />
            {#if agregadoReciente}
              ✓ Agregado al carrito
            {:else if sinStock}
              Agotado
            {:else}
              Agregar al carrito
            {/if}
          </button>
          
          {#if agregadoReciente}
            <a
              href="/carrito"
              class="btn-secondary flex items-center justify-center gap-2"
            >
              Ir al carrito
            </a>
          {/if}
          
          <button
            on:click={preguntarWhatsApp}
            class="btn-outline flex items-center justify-center gap-2"
          >
            <MessageCircle class="w-5 h-5" />
            Consultar
          </button>
        </div>
        
        <!-- Volver -->
        <a href="/" class="inline-flex items-center text-primary-600 hover:text-primary-800">
          <ArrowLeft class="w-4 h-4 mr-2" />
          Volver al catálogo
        </a>
      </div>
    </div>
    
    <!-- Descripción -->
    {#if producto.descripcion_larga}
      <div class="border-t border-gray-200 p-6 md:p-8">
        <h2 class="text-xl font-bold text-gray-900 mb-4">Descripción</h2>
        <p class="text-gray-700 leading-relaxed whitespace-pre-line">
          {producto.descripcion_larga}
        </p>
      </div>
    {/if}
  </div>
  
  <!-- Productos relacionados -->
  {#if relacionados.length > 0}
    <div>
      <h2 class="text-2xl font-bold text-gray-900 mb-6">Productos relacionados</h2>
      <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {#each relacionados as productoRel}
          <ProductCard producto={productoRel} {configuracion} />
        {/each}
      </div>
    </div>
  {/if}
</div>