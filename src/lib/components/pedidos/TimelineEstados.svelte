<!-- src/lib/components/pedidos/TimelineEstados.svelte -->
<script>
  import { CONFIG_ESTADOS } from '$lib/pedidos/estadosCliente';
  
  export let pedido;
  export let historial = [];
  
  $: eventos = historial.sort((a, b) => 
    new Date(b.created_at) - new Date(a.created_at)
  );
</script>

<div class="space-y-4">
  <h4 class="text-sm font-semibold text-gray-900 mb-3">Historial del Pedido</h4>
  
  <div class="relative border-l-2 border-gray-200 ml-3 pl-6 space-y-4">
    {#each eventos as evento, index}
      {@const config = CONFIG_ESTADOS[evento.estado_nuevo]}
      {@const esUltimo = index === 0}
      
      <div class="relative">
        <!-- Punto en la línea -->
        <div 
          class="absolute -left-[28px] w-5 h-5 rounded-full border-2 {esUltimo ? config.bgColor + ' ' + config.borderColor : 'bg-white border-gray-300'}"
        >
          {#if esUltimo}
            <span class="absolute inset-0 flex items-center justify-center text-xs">
              {config.icon}
            </span>
          {/if}
        </div>
        
        <!-- Contenido -->
        <div class="bg-gray-50 rounded-lg p-3">
          <div class="flex items-center justify-between mb-1">
            <span class="text-sm font-semibold {esUltimo ? config.textColor : 'text-gray-700'}">
              {config?.label || evento.estado_nuevo}
            </span>
            <span class="text-xs text-gray-500">
              {new Date(evento.created_at).toLocaleString('es-MX')}
            </span>
          </div>
          
          {#if evento.notas}
            <p class="text-sm text-gray-600">{evento.notas}</p>
          {/if}
          
          {#if evento.usuario_responsable}
            <p class="text-xs text-gray-500 mt-1">
              Por: {evento.usuario_responsable}
            </p>
          {/if}
        </div>
      </div>
    {/each}
  </div>
</div>