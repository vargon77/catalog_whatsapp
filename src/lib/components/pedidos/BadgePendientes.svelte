<!-- src/lib/components/pedidos/BadgePendientes.svelte -->
<script>
  import { Bell } from 'lucide-svelte';
  import { createEventDispatcher } from 'svelte';
  
  export let count = 0;
  
  const dispatch = createEventDispatcher();
</script>

{#if count > 0}
  <button
    on:click={() => dispatch('click')}
    class="relative inline-flex items-center gap-2 px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors animate-pulse"
  >
    <Bell class="w-5 h-5" />
    <span class="font-semibold">
      {count} {count === 1 ? 'Pago' : 'Pagos'} por Validar
    </span>
    <span class="absolute -top-1 -right-1 flex h-3 w-3">
      <span class="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
      <span class="relative inline-flex rounded-full h-3 w-3 bg-red-500"></span>
    </span>
  </button>
{/if}