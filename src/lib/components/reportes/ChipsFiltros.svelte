<!-- src/lib/components/reportes/ChipsFiltros.svelte -->
<script>
  import { createEventDispatcher } from 'svelte';
  import { X, Calendar, Filter as FilterIcon, Tag, Award, User, Package } from 'lucide-svelte';
  import { format } from 'date-fns';
  import { es } from 'date-fns/locale';
  
  const dispatch = createEventDispatcher();
  
  export let filtros = {};
  export let estados = [];
  export let categorias = [];
  export let marcas = [];
  
  // Determinar si hay filtros activos
  $: hayFiltros = Boolean(
    filtros.fechaInicio ||
    filtros.fechaFin ||
    (filtros.estados && filtros.estados.length > 0) ||
    (filtros.categorias && filtros.categorias.length > 0) ||
    (filtros.marcas && filtros.marcas.length > 0) ||
    filtros.clienteSeleccionado ||
    filtros.productoSeleccionado
  );
  
  function removerFiltro(tipo, valor = null) {
    dispatch('remover', { tipo, valor });
  }
  
  function limpiarTodos() {
    dispatch('limpiarTodos');
  }
  
  function getEstadoLabel(valor) {
    const estado = estados.find(e => e.value === valor);
    return estado ? estado.label : valor;
  }
  
  function getCategoriaLabel(id) {
    const categoria = categorias.find(c => c.id === id);
    return categoria ? categoria.nombre : `Categoría ${id}`;
  }
  
  function getMarcaLabel(id) {
    const marca = marcas.find(m => m.id === id);
    return marca ? marca.nombre : `Marca ${id}`;
  }
  
  function formatFecha(fecha) {
    try {
      return format(new Date(fecha), 'dd/MM/yyyy', { locale: es });
    } catch {
      return fecha;
    }
  }
</script>

{#if hayFiltros}
  <div class="bg-white rounded-lg border border-gray-200 p-4">
    <div class="flex items-center justify-between mb-3">
      <h3 class="text-sm font-semibold text-gray-700 flex items-center gap-2">
        <FilterIcon class="w-4 h-4" />
        Filtros Activos
      </h3>
      <button
        on:click={limpiarTodos}
        class="text-sm text-red-600 hover:text-red-800 font-medium flex items-center gap-1"
      >
        <X class="w-4 h-4" />
        Limpiar todo
      </button>
    </div>
    
    <div class="flex flex-wrap gap-2">
      <!-- Filtro de fechas -->
      {#if filtros.fechaInicio || filtros.fechaFin}
        <button
          on:click={() => removerFiltro('fecha')}
          class="inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-100 text-blue-800 rounded-full text-sm font-medium hover:bg-blue-200 transition-colors"
        >
          <Calendar class="w-3.5 h-3.5" />
          <span>
            {#if filtros.fechaInicio && filtros.fechaFin}
              {formatFecha(filtros.fechaInicio)} - {formatFecha(filtros.fechaFin)}
            {:else if filtros.fechaInicio}
              Desde {formatFecha(filtros.fechaInicio)}
            {:else}
              Hasta {formatFecha(filtros.fechaFin)}
            {/if}
          </span>
          <X class="w-3.5 h-3.5" />
        </button>
      {/if}
      
      <!-- Estados -->
      {#if filtros.estados && filtros.estados.length > 0}
        {#each filtros.estados as estado}
          <button
            on:click={() => removerFiltro('estado', estado)}
            class="inline-flex items-center gap-1.5 px-3 py-1.5 bg-purple-100 text-purple-800 rounded-full text-sm font-medium hover:bg-purple-200 transition-colors"
          >
            <FilterIcon class="w-3.5 h-3.5" />
            <span>Estado: {getEstadoLabel(estado)}</span>
            <X class="w-3.5 h-3.5" />
          </button>
        {/each}
      {/if}
      
      <!-- Categorías -->
      {#if filtros.categorias && filtros.categorias.length > 0}
        {#each filtros.categorias as categoria}
          <button
            on:click={() => removerFiltro('categoria', categoria)}
            class="inline-flex items-center gap-1.5 px-3 py-1.5 bg-green-100 text-green-800 rounded-full text-sm font-medium hover:bg-green-200 transition-colors"
          >
            <Tag class="w-3.5 h-3.5" />
            <span>{getCategoriaLabel(categoria)}</span>
            <X class="w-3.5 h-3.5" />
          </button>
        {/each}
      {/if}
      
      <!-- Marcas -->
      {#if filtros.marcas && filtros.marcas.length > 0}
        {#each filtros.marcas as marca}
          <button
            on:click={() => removerFiltro('marca', marca)}
            class="inline-flex items-center gap-1.5 px-3 py-1.5 bg-amber-100 text-amber-800 rounded-full text-sm font-medium hover:bg-amber-200 transition-colors"
          >
            <Award class="w-3.5 h-3.5" />
            <span>{getMarcaLabel(marca)}</span>
            <X class="w-3.5 h-3.5" />
          </button>
        {/each}
      {/if}
      
      <!-- Cliente -->
      {#if filtros.clienteSeleccionado}
        <button
          on:click={() => removerFiltro('cliente')}
          class="inline-flex items-center gap-1.5 px-3 py-1.5 bg-indigo-100 text-indigo-800 rounded-full text-sm font-medium hover:bg-indigo-200 transition-colors"
        >
          <User class="w-3.5 h-3.5" />
          <span class="max-w-[150px] truncate">
            {filtros.clienteSeleccionado.nombre}
          </span>
          <X class="w-3.5 h-3.5" />
        </button>
      {/if}
      
      <!-- Producto -->
      {#if filtros.productoSeleccionado}
        <button
          on:click={() => removerFiltro('producto')}
          class="inline-flex items-center gap-1.5 px-3 py-1.5 bg-pink-100 text-pink-800 rounded-full text-sm font-medium hover:bg-pink-200 transition-colors"
        >
          <Package class="w-3.5 h-3.5" />
          <span class="max-w-[150px] truncate">
            {filtros.productoSeleccionado.nombre}
          </span>
          <X class="w-3.5 h-3.5" />
        </button>
      {/if}
    </div>
  </div>
{/if}