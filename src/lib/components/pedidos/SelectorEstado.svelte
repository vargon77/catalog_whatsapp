<!-- src/lib/components/pedidos/SelectorEstado.svelte -->
<script>
  import { createEventDispatcher } from 'svelte';
  import { Loader2, AlertCircle, CheckCircle } from 'lucide-svelte';
  import { ESTADOS, CONFIG_ESTADOS, obtenerColorEstado } from '$lib/pedidos/estadosCliente';
  
  export let pedido;
  export let estadosPermitidos = [];
  
  const dispatch = createEventDispatcher();
  
  let cambiando = false;
  let error = '';
  let mostrarConfirmacion = false;
  let estadoSeleccionado = null;
  
  // Obtener estados disponibles según transiciones permitidas
  $: estadosDisponibles = estadosPermitidos.map(estado => ({
    valor: estado,
    ...CONFIG_ESTADOS[estado]
  }));
  
  $: coloresActual = obtenerColorEstado(pedido.estado);
  
  function solicitarCambio(nuevoEstado) {
    if (nuevoEstado === pedido.estado) return;
    
    estadoSeleccionado = nuevoEstado;
    mostrarConfirmacion = true;
  }
  
  async function confirmarCambio() {
  cambiando = true;
  error = '';
  
  try {
    // ✅ CORRECCIÓN: Usar endpoint específico de cambio de estado
    const res = await fetch(`/api/pedidos/${pedido.id}/cambiar-estado`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        estado: estadoSeleccionado,
        notas: `Estado cambiado manualmente`,
        usuario: 'Admin'
      })
    });
    
    const result = await res.json();
    
    if (!result.success) throw new Error(result.error);
    
    dispatch('cambioEstado', result.data);
    mostrarConfirmacion = false;
    estadoSeleccionado = null;
    
  } catch (err) {
    error = err.message;
    setTimeout(() => error = '', 5000);
  } finally {
    cambiando = false;
  }
}
  
  function cancelar() {
    mostrarConfirmacion = false;
    estadoSeleccionado = null;
    error = '';
  }
</script>

<div class="space-y-3">
  <div class="flex items-center justify-between">
    <label class="text-sm font-medium text-gray-700">
      Estado del Pedido
    </label>
    <span class="px-3 py-1 text-xs font-semibold rounded-full {coloresActual.bg} {coloresActual.text} border {coloresActual.border}">
      {CONFIG_ESTADOS[pedido.estado]?.icon} {CONFIG_ESTADOS[pedido.estado]?.label}
    </span>
  </div>
  
  {#if estadosDisponibles.length > 0}
    <div class="bg-gray-50 rounded-lg p-3 border border-gray-200">
      <p class="text-xs text-gray-600 mb-2">Cambiar a:</p>
      <div class="flex flex-wrap gap-2">
        {#each estadosDisponibles as estado}
          {@const colores = obtenerColorEstado(estado.valor)}
          <button
            type="button"
            on:click={() => solicitarCambio(estado.valor)}
            disabled={cambiando}
            class="px-3 py-2 text-sm font-medium rounded-lg border-2 transition-all hover:shadow-md disabled:opacity-50 {colores.bg} {colores.text} {colores.border}"
          >
            {estado.icon} {estado.label}
          </button>
        {/each}
      </div>
    </div>
  {:else}
    <div class="bg-blue-50 border border-blue-200 rounded-lg p-3">
      <p class="text-xs text-blue-800">
        Este pedido está en un estado final o requiere acciones específicas antes de cambiar de estado.
      </p>
    </div>
  {/if}
  
  {#if error}
    <div class="bg-red-50 border border-red-200 rounded-lg p-3 flex items-start gap-2">
      <AlertCircle class="w-4 h-4 text-red-600 flex-shrink-0 mt-0.5" />
      <p class="text-sm text-red-800">{error}</p>
    </div>
  {/if}
  
  {#if mostrarConfirmacion}
    <div class="bg-amber-50 border-2 border-amber-300 rounded-lg p-4 space-y-3">
      <div class="flex items-start gap-3">
        <AlertCircle class="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
        <div>
          <p class="text-sm font-medium text-amber-900">¿Confirmar cambio de estado?</p>
          <p class="text-xs text-amber-700 mt-1">
            El pedido pasará de <strong>{CONFIG_ESTADOS[pedido.estado]?.label}</strong> 
            a <strong>{CONFIG_ESTADOS[estadoSeleccionado]?.label}</strong>
          </p>
        </div>
      </div>
      
      <div class="flex gap-2">
        <button
          type="button"
          on:click={confirmarCambio}
          disabled={cambiando}
          class="flex-1 px-3 py-2 bg-amber-600 text-white rounded-lg hover:bg-amber-700 text-sm font-medium flex items-center justify-center gap-2"
        >
          {#if cambiando}
            <Loader2 class="w-4 h-4 animate-spin" />
            Cambiando...
          {:else}
            <CheckCircle class="w-4 h-4" />
            Confirmar
          {/if}
        </button>
        
        <button
          type="button"
          on:click={cancelar}
          disabled={cambiando}
          class="px-3 py-2 bg-white border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 text-sm"
        >
          Cancelar
        </button>
      </div>
    </div>
  {/if}
</div>