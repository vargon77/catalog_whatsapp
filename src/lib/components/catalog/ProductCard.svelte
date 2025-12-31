<!-- src/lib/components/catalog/ProductCard.svelte -->
<script>
  import { ShoppingCart, MessageCircle, Tag } from 'lucide-svelte';
  import { carrito } from '$lib/stores/carritoStore';
  import { generarEnlacePregunta } from '$lib/utils/whatsapp';
  
  export let producto;
  export let configuracion;
  
  // Valores por defecto para configuración
  const config = configuracion || {
    nombre_empresa: 'CatálogoExpress',
    whatsapp_numero: '7121920418',
    moneda_simbolo: '$'
  };
  
  // Determinar precio a mostrar (con oferta o normal)
  $: precioMostrar = producto.precio_oferta || producto.precio;
  $: tieneOferta = producto.precio_oferta && producto.precio_oferta < producto.precio;
  $: descuentoPorcentaje = tieneOferta 
    ? Math.round(((producto.precio - producto.precio_oferta) / producto.precio) * 100)
    : 0;
  
  // Estado de stock
  $: sinStock = producto.stock === 0;
  $: stockBajo = producto.stock > 0 && producto.stock <= (producto.stock_minimo || 5);
  
  // Función para agregar al carrito
  function agregarAlCarrito() {
    if (sinStock) return;
    
    // Adaptar el producto al formato del carrito
    const productoCarrito = {
      id: producto.id,
      nombre: producto.nombre,
      precio: precioMostrar,
      precio_unitario: precioMostrar,
      imagen_url: producto.imagen_url,
      marca: producto.marca_nombre || producto.marca,
      stock: producto.stock,
      descripcion_larga: producto.descripcion_larga
    };
    
    carrito.agregarProducto(productoCarrito);
  }
  
  // Función para preguntar por WhatsApp
  function preguntarPorWhatsApp() {
    const productoWhatsApp = {
      ...producto,
      precio: precioMostrar
    };
    const url = generarEnlacePregunta(productoWhatsApp, config);
    window.open(url, '_blank');
  }
</script>

<div class="card hover:shadow-lg transition-shadow duration-300 h-full flex flex-col group">
  <!-- Imagen del producto -->
  <div class="relative h-48 bg-gray-100 overflow-hidden">
    {#if producto.imagen_url}
      <img 
        src={producto.imagen_url} 
        alt={producto.nombre}
        class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
        loading="lazy"
      />
    {:else}
      <div class="w-full h-full flex items-center justify-center bg-gradient-to-br from-gray-200 to-gray-300">
        <ShoppingCart class="w-16 h-16 text-gray-400" />
      </div>
    {/if}
    
    <!-- Badges superiores -->
    <div class="absolute top-2 right-2 flex flex-col gap-2">
      <!-- Badge de oferta -->
      {#if tieneOferta}
        <span class="bg-red-500 text-white text-xs font-bold px-2 py-1 rounded shadow-lg">
          -{descuentoPorcentaje}%
        </span>
      {/if}
      
      <!-- Badge de stock -->
      {#if stockBajo && !sinStock}
        <span class="bg-amber-500 text-white text-xs font-bold px-2 py-1 rounded shadow-lg">
          ¡Solo {producto.stock}!
        </span>
      {:else if sinStock}
        <span class="bg-red-500 text-white text-xs font-bold px-2 py-1 rounded shadow-lg">
          Agotado
        </span>
      {/if}
      
      <!-- Badge de destacado -->
      {#if producto.destacado}
        <span class="bg-purple-500 text-white text-xs font-bold px-2 py-1 rounded shadow-lg flex items-center gap-1">
          ⭐ Destacado
        </span>
      {/if}
    </div>
    
    <!-- Badge de categoría (inferior izquierdo) -->
    {#if producto.categoria_nombre}
      <div class="absolute bottom-2 left-2">
        <span class="bg-white/90 backdrop-blur-sm text-gray-700 text-xs px-2 py-1 rounded-full flex items-center gap-1 shadow">
          <Tag class="w-3 h-3" />
          {producto.categoria_nombre}
        </span>
      </div>
    {/if}
  </div>
  
  <!-- Contenido del producto -->
  <div class="p-4 flex-grow flex flex-col">
    <!-- Marca -->
    {#if producto.marca_nombre}
      <p class="text-xs text-gray-500 uppercase tracking-wide mb-1">
        {producto.marca_nombre}
      </p>
    {/if}
    
    <!-- Nombre -->
    <h3 class="font-bold text-lg text-gray-800 mb-2 line-clamp-2">
      {producto.nombre}
    </h3>
    
    <!-- Descripción -->
    <p class="text-gray-600 text-sm mb-4 flex-grow line-clamp-3">
      {producto.descripcion_larga || producto.descripcion_corta || 'Sin descripción disponible'}
    </p>
    
    <!-- Precio y acciones -->
    <div class="mt-auto">
      <!-- Precios -->
      <div class="mb-4">
        <div class="flex items-baseline gap-2">
          <span class="text-2xl font-bold text-primary-700">
            {config.moneda_simbolo}{precioMostrar.toFixed(2)}
          </span>
          {#if tieneOferta}
            <span class="text-sm text-gray-500 line-through">
              {config.moneda_simbolo}{producto.precio.toFixed(2)}
            </span>
          {/if}
        </div>
        
        <!-- Info de stock -->
        {#if !sinStock}
          <p class="text-xs text-gray-500 mt-1">
            {#if stockBajo}
              <span class="text-amber-600 font-medium">Stock bajo: {producto.stock} unidades</span>
            {:else}
              Stock: {producto.stock} unidades
            {/if}
          </p>
        {/if}
        
        <!-- SKU -->
        {#if producto.sku}
          <p class="text-xs text-gray-400 mt-1">
            SKU: {producto.sku}
          </p>
        {/if}
      </div>
      
      <!-- Botones de acción -->
      <div class="flex gap-2">
        <button
          on:click={agregarAlCarrito}
          disabled={sinStock}
          class="btn-primary flex-1 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
          title={sinStock ? 'Producto agotado' : 'Añadir al carrito'}
        >
          <ShoppingCart class="w-4 h-4" />
          <span class="hidden sm:inline">
            {sinStock ? 'Agotado' : 'Añadir'}
          </span>
        </button>
        
        <button
          on:click={preguntarPorWhatsApp}
          class="btn-outline flex items-center justify-center gap-2"
          title="Preguntar por WhatsApp"
        >
          <MessageCircle class="w-4 h-4" />
          <span class="hidden sm:inline">Consultar</span>
        </button>
      </div>
    </div>
  </div>
</div>

<style>
  /* Efecto hover en la imagen */
  .group:hover img {
    transform: scale(1.05);
  }
  
  /* Animación suave */
  .card {
    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  }
</style>