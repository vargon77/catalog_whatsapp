<script>
  import { ShoppingCart } from 'lucide-svelte';
  import { cantidadItems } from '$lib/stores/carritoStore';
</script>

<a 
  href="/carrito" 
  class="relative p-2 text-gray-700 hover:text-primary-600 transition-colors"
  aria-label="Carrito de compras"
>
  <ShoppingCart class="w-6 h-6" />
  
  {#if $cantidadItems > 0}
    <span class="absolute -top-1 -right-1 bg-primary-600 text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center">
      {$cantidadItems}
    </span>
  {/if}
</a>