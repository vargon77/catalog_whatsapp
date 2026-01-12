<!-- src/lib/components/reportes/AutocompletadoClientes.svelte -->
<script>
  import { createEventDispatcher, onMount } from 'svelte';
  import { Search, X, User } from 'lucide-svelte';
  
  const dispatch = createEventDispatcher();
  
  export let clienteSeleccionado = null;
  
  let busqueda = '';
  let clientes = [];
  let mostrarResultados = false;
  let cargando = false;
  let timeoutId = null;
  
  // Debounce para búsqueda
  $: if (busqueda) {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => {
      buscarClientes(busqueda);
    }, 300);
  }
  
  async function buscarClientes(termino) {
    if (!termino || termino.length < 3) {
      clientes = [];
      return;
    }
    
    cargando = true;
    
    try {
      // Buscar en pedidos únicos por cliente
      const response = await fetch(`/api/pedidos?limit=50`);
      const result = await response.json();
      
      if (result.success) {
        // Extraer clientes únicos
        const clientesMap = new Map();
        
        result.data.forEach(pedido => {
          const key = pedido.cliente_whatsapp;
          if (!clientesMap.has(key)) {
            clientesMap.set(key, {
              nombre: pedido.cliente_nombre,
              whatsapp: pedido.cliente_whatsapp,
              email: pedido.cliente_email,
              pedidos: 1
            });
          } else {
            clientesMap.get(key).pedidos++;
          }
        });
        
        // Filtrar por término de búsqueda
        clientes = Array.from(clientesMap.values()).filter(c => 
          c.nombre.toLowerCase().includes(termino.toLowerCase()) ||
          c.whatsapp.includes(termino)
        ).slice(0, 5);
        
        mostrarResultados = clientes.length > 0;
      }
    } catch (error) {
      console.error('Error buscando clientes:', error);
    } finally {
      cargando = false;
    }
  }
  
  function seleccionarCliente(cliente) {
    clienteSeleccionado = cliente;
    busqueda = cliente.nombre;
    mostrarResultados = false;
    dispatch('seleccionar', cliente);
  }
  
  function limpiar() {
    clienteSeleccionado = null;
    busqueda = '';
    clientes = [];
    mostrarResultados = false;
    dispatch('limpiar');
  }
  
  // Cerrar al hacer clic fuera
  function handleClickOutside(event) {
    if (!event.target.closest('.autocomplete-container')) {
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

<div class="autocomplete-container relative">
  <label for="busqueda-cliente" class="label text-sm">
    Buscar cliente por nombre o teléfono
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
      id="busqueda-cliente"
      type="text"
      bind:value={busqueda}
      placeholder="Escribe al menos 3 caracteres..."
      class="input pl-10 pr-10 text-sm"
      on:focus={() => {
        if (clientes.length > 0) mostrarResultados = true;
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
  {#if mostrarResultados && clientes.length > 0}
    <div class="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-64 overflow-y-auto">
      {#each clientes as cliente}
        <button
          type="button"
          on:click={() => seleccionarCliente(cliente)}
          class="w-full px-4 py-3 text-left hover:bg-gray-50 border-b border-gray-100 last:border-b-0 transition-colors"
        >
          <div class="flex items-start gap-3">
            <div class="w-10 h-10 bg-primary-100 rounded-full flex items-center justify-center flex-shrink-0">
              <User class="w-5 h-5 text-primary-600" />
            </div>
            <div class="flex-1 min-w-0">
              <p class="text-sm font-medium text-gray-900 truncate">
                {cliente.nombre}
              </p>
              <p class="text-xs text-gray-500">
                {cliente.whatsapp}
              </p>
              <p class="text-xs text-gray-400 mt-1">
                {cliente.pedidos} pedido{cliente.pedidos !== 1 ? 's' : ''}
              </p>
            </div>
          </div>
        </button>
      {/each}
    </div>
  {/if}
  
  <!-- Cliente seleccionado -->
  {#if clienteSeleccionado}
    <div class="mt-3 p-3 bg-green-50 border border-green-200 rounded-lg">
      <div class="flex items-center justify-between">
        <div class="flex items-center gap-2">
          <User class="w-4 h-4 text-green-600" />
          <div>
            <p class="text-sm font-medium text-gray-900">
              {clienteSeleccionado.nombre}
            </p>
            <p class="text-xs text-gray-600">
              {clienteSeleccionado.whatsapp}
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
    Escribe al menos 3 caracteres para buscar
  </p>
</div>