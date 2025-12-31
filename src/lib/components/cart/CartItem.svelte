<!-- src/lib/components/cart/CartItem.svelte -->
<script>
  import { Plus, Minus, Trash2, Package } from 'lucide-svelte';
  import { carrito } from '$lib/stores/carritoStore';
  
  export let item;
  export let disabled = false;
  
  // Funciones para manejar cantidad
  function aumentarCantidad() {
    if (disabled) return;
    const nuevaCantidad = item.cantidad + 1;
    // Verificar que no exceda el stock
    if (item.stock && nuevaCantidad > item.stock) {
      alert(`Stock disponible: ${item.stock} unidades`);
      return;
    }
    carrito.actualizarCantidad(item.id, nuevaCantidad);
  }
  
  function disminuirCantidad() {
    if (disabled) return;
    carrito.actualizarCantidad(item.id, item.cantidad - 1);
  }
  
  function eliminarProducto() {
    if (disabled) return;
    if (confirm(`¿Eliminar "${item.nombre}" del carrito?`)) {
      carrito.eliminarProducto(item.id);
    }
  }
  
  // Calcular subtotal por item
  $: subtotalItem = item.precio_unitario * item.cantidad;
  
  // Verificar si hay descuento
  $: tieneDescuento = item.precio_original && item.precio_unitario < item.precio_original;
  $: ahorroTotal = tieneDescuento 
    ? (item.precio_original - item.precio_unitario) * item.cantidad 
    : 0;
</script>

<div class="flex items-center px-6 py-4 hover:bg-gray-50 transition-colors {disabled ? 'opacity-60' : ''}">
  <!-- Imagen del producto -->
  <div class="flex-shrink-0 w-20 h-20 bg-gray-100 rounded-lg overflow-hidden mr-4">
    {#if item.imagen_url}
      <img 
        src={item.imagen_url} 
        alt={item.nombre}
        class="w-full h-full object-cover"
        loading="lazy"
      />
    {:else}
      <div class="w-full h-full flex items-center justify-center">
        <Package class="w-8 h-8 text-gray-400" />
      </div>
    {/if}
  </div>
  
  <!-- Información del producto -->
  <div class="flex-grow">
    <div class="flex justify-between">
      <div>
        <h3 class="font-medium text-gray-800">{item.nombre}</h3>
        
        <!-- Marca y categoría -->
        <div class="flex items-center gap-2 mt-1">
          {#if item.marca}
            <p class="text-xs text-gray-500">{item.marca}</p>
          {/if}
          {#if item.categoria && item.marca}
            <span class="text-gray-300">•</span>
          {/if}
          {#if item.categoria}
            <p class="text-xs text-gray-500">{item.categoria}</p>
          {/if}
        </div>
        
        <!-- Precio unitario -->
        <div class="mt-1">
          <span class="text-primary-600 font-bold">
            ${item.precio_unitario.toFixed(2)}
          </span>
          {#if tieneDescuento}
            <span class="text-xs text-gray-500 line-through ml-2">
              ${item.precio_original.toFixed(2)}
            </span>
          {/if}
          <span class="text-xs text-gray-500"> c/u</span>
        </div>
        
        <!-- SKU -->
        {#if item.sku}
          <p class="text-xs text-gray-400 mt-1">SKU: {item.sku}</p>
        {/if}
      </div>
      
      <div class="text-right">
        <p class="text-lg font-bold text-gray-800">
          ${subtotalItem.toFixed(2)}
        </p>
        {#if item.cantidad > 1}
          <p class="text-sm text-gray-500">
            {item.cantidad} × ${item.precio_unitario.toFixed(2)}
          </p>
        {/if}
        {#if tieneDescuento}
          <p class="text-xs text-green-600 font-medium mt-1">
            Ahorras ${ahorroTotal.toFixed(2)}
          </p>
        {/if}
      </div>
    </div>
    
    <!-- Controles de cantidad -->
    <div class="flex items-center justify-between mt-3">
      <div class="flex items-center space-x-2">
        <button
          on:click={disminuirCantidad}
          disabled={disabled || item.cantidad <= 1}
          class="w-8 h-8 rounded-full border border-gray-300 flex items-center justify-center hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          title="Disminuir cantidad"
        >
          <Minus class="w-4 h-4" />
        </button>
        
        <span class="w-12 text-center font-medium">{item.cantidad}</span>
        
        <button
          on:click={aumentarCantidad}
          disabled={disabled || (item.stock && item.cantidad >= item.stock)}
          class="w-8 h-8 rounded-full border border-gray-300 flex items-center justify-center hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          title={item.stock && item.cantidad >= item.stock ? `Stock máximo: ${item.stock}` : 'Aumentar cantidad'}
        >
          <Plus class="w-4 h-4" />
        </button>
        
        <!-- Indicador de stock -->
        {#if item.stock}
          <span class="text-xs text-gray-500 ml-2">
            {#if item.cantidad >= item.stock}
              <span class="text-amber-600">Máximo disponible</span>
            {:else}
              <span>{item.stock - item.cantidad} disponibles</span>
            {/if}
          </span>
        {/if}
      </div>
      
      <button
        on:click={eliminarProducto}
        disabled={disabled}
        class="text-red-600 hover:text-red-800 flex items-center text-sm disabled:opacity-50 transition-colors"
        title="Eliminar del carrito"
      >
        <Trash2 class="w-4 h-4 mr-1" />
        Eliminar
      </button>
    </div>
  </div>
</div>