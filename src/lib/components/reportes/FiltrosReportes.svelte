<!-- src/lib/components/reportes/FiltrosReportes.svelte -->
<script>
  import { createEventDispatcher } from 'svelte';
  import { Calendar, X, Search, Filter } from 'lucide-svelte';
  import { format, subDays, startOfWeek, endOfWeek, startOfMonth, endOfMonth } from 'date-fns';
  import AutocompletadoClientes from './AutocompletadoClientes.svelte';
  import BuscadorProductos from './BuscadorProductos.svelte';
  import ChipsFiltros from './ChipsFiltros.svelte';
  
  const dispatch = createEventDispatcher();
  
  export let categorias = [];
  export let marcas = [];
  export let estados = [];
  
  // Filtros
  let fechaInicio = '';
  let fechaFin = '';
  let estadosSeleccionados = [];
  let categoriasSeleccionadas = [];
  let marcasSeleccionadas = [];
  let clienteSeleccionado = null;
  let productoSeleccionado = null;
  
  // UI State
  let seccionExpandida = 'fechas'; // 'fechas', 'estados', 'categorias', 'clientes', 'productos'
  
  // Presets de fecha
  const presetsFecha = [
    { label: 'Hoy', value: 'hoy', icon: '📅' },
    { label: 'Esta Semana', value: 'semana', icon: '📆' },
    { label: 'Este Mes', value: 'mes', icon: '🗓️' },
    { label: 'Últimos 7 días', value: '7dias', icon: '⏰' },
    { label: 'Últimos 30 días', value: '30dias', icon: '📊' }
  ];
  
  function aplicarPreset(preset) {
    const hoy = new Date();
    
    switch(preset) {
      case 'hoy':
        fechaInicio = format(hoy, 'yyyy-MM-dd');
        fechaFin = format(hoy, 'yyyy-MM-dd');
        break;
      case 'semana':
        fechaInicio = format(startOfWeek(hoy, { weekStartsOn: 1 }), 'yyyy-MM-dd');
        fechaFin = format(endOfWeek(hoy, { weekStartsOn: 1 }), 'yyyy-MM-dd');
        break;
      case 'mes':
        fechaInicio = format(startOfMonth(hoy), 'yyyy-MM-dd');
        fechaFin = format(endOfMonth(hoy), 'yyyy-MM-dd');
        break;
      case '7dias':
        fechaInicio = format(subDays(hoy, 7), 'yyyy-MM-dd');
        fechaFin = format(hoy, 'yyyy-MM-dd');
        break;
      case '30dias':
        fechaInicio = format(subDays(hoy, 30), 'yyyy-MM-dd');
        fechaFin = format(hoy, 'yyyy-MM-dd');
        break;
    }
  }
  
  function toggleEstado(estado) {
    if (estadosSeleccionados.includes(estado)) {
      estadosSeleccionados = estadosSeleccionados.filter(e => e !== estado);
    } else {
      estadosSeleccionados = [...estadosSeleccionados, estado];
    }
  }
  
  function aplicarFiltros() {
    dispatch('aplicar', {
      fechaInicio,
      fechaFin,
      estados: estadosSeleccionados,
      categorias: categoriasSeleccionadas,
      marcas: marcasSeleccionadas,
      clienteSeleccionado,
      productoSeleccionado
    });
  }
  
  function limpiarFiltros() {
    fechaInicio = '';
    fechaFin = '';
    estadosSeleccionados = [];
    categoriasSeleccionadas = [];
    marcasSeleccionadas = [];
    clienteSeleccionado = null;
    productoSeleccionado = null;
    aplicarFiltros();
  }
  
  function removerFiltro({ detail }) {
    const { tipo, valor } = detail;
    
    switch(tipo) {
      case 'fecha':
        fechaInicio = '';
        fechaFin = '';
        break;
      case 'estado':
        estadosSeleccionados = estadosSeleccionados.filter(e => e !== valor);
        break;
      case 'categoria':
        categoriasSeleccionadas = categoriasSeleccionadas.filter(c => c !== valor);
        break;
      case 'marca':
        marcasSeleccionadas = marcasSeleccionadas.filter(m => m !== valor);
        break;
      case 'cliente':
        clienteSeleccionado = null;
        break;
      case 'producto':
        productoSeleccionado = null;
        break;
    }
    
    aplicarFiltros();
  }
  
  function toggleSeccion(seccion) {
    seccionExpandida = seccionExpandida === seccion ? null : seccion;
  }
  
  $: filtrosActivos = {
    fechaInicio,
    fechaFin,
    estados: estadosSeleccionados,
    categorias: categoriasSeleccionadas,
    marcas: marcasSeleccionadas,
    clienteSeleccionado,
    productoSeleccionado
  };
  
  $: hayFiltros = fechaInicio || fechaFin || estadosSeleccionados.length > 0 || 
                  categoriasSeleccionadas.length > 0 || marcasSeleccionadas.length > 0 || 
                  clienteSeleccionado || productoSeleccionado;
</script>

<div class="space-y-6">
  
  <!-- Chips de Filtros Activos -->
  <ChipsFiltros 
    filtros={filtrosActivos}
    {estados}
    {categorias}
    {marcas}
    on:remover={removerFiltro}
    on:limpiarTodos={limpiarFiltros}
  />
  
  <!-- Accordion de Filtros -->
  <div class="space-y-3">
    
    <!-- 📅 Sección: Fechas -->
    <div class="border border-gray-200 rounded-lg overflow-hidden bg-white">
      <button
        on:click={() => toggleSeccion('fechas')}
        class="w-full px-4 py-3 flex items-center justify-between hover:bg-gray-50 transition-colors"
      >
        <div class="flex items-center gap-2">
          <Calendar class="w-5 h-5 text-primary-600" />
          <span class="font-medium text-gray-900">Rango de Fechas</span>
          {#if fechaInicio || fechaFin}
            <span class="px-2 py-0.5 bg-primary-100 text-primary-700 text-xs rounded-full">
              Activo
            </span>
          {/if}
        </div>
        <svg class="w-5 h-5 text-gray-400 transition-transform {seccionExpandida === 'fechas' ? 'rotate-180' : ''}" 
             fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"/>
        </svg>
      </button>
      
      {#if seccionExpandida === 'fechas'}
        <div class="px-4 py-4 border-t border-gray-200 bg-gray-50 space-y-4">
          <!-- Presets -->
          <div class="flex flex-wrap gap-2">
            {#each presetsFecha as preset}
              <button
                on:click={() => aplicarPreset(preset.value)}
                class="px-3 py-1.5 text-sm border-2 border-gray-300 rounded-lg hover:bg-white hover:border-primary-500 hover:text-primary-700 transition-all font-medium"
              >
                {preset.icon} {preset.label}
              </button>
            {/each}
          </div>
          
          <!-- Fechas personalizadas -->
          <div class="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <label for="fechaInicio" class="label text-xs">Desde</label>
              <input
                id="fechaInicio"
                type="date"
                bind:value={fechaInicio}
                class="input text-sm"
              />
            </div>
            <div>
              <label for="fechaFin" class="label text-xs">Hasta</label>
              <input
                id="fechaFin"
                type="date"
                bind:value={fechaFin}
                class="input text-sm"
              />
            </div>
          </div>
        </div>
      {/if}
    </div>
    
    <!-- 🏷️ Sección: Estados -->
    <div class="border border-gray-200 rounded-lg overflow-hidden bg-white">
      <button
        on:click={() => toggleSeccion('estados')}
        class="w-full px-4 py-3 flex items-center justify-between hover:bg-gray-50 transition-colors"
      >
        <div class="flex items-center gap-2">
          <Filter class="w-5 h-5 text-primary-600" />
          <span class="font-medium text-gray-900">Estados del Pedido</span>
          {#if estadosSeleccionados.length > 0}
            <span class="px-2 py-0.5 bg-primary-100 text-primary-700 text-xs rounded-full">
              {estadosSeleccionados.length}
            </span>
          {/if}
        </div>
        <svg class="w-5 h-5 text-gray-400 transition-transform {seccionExpandida === 'estados' ? 'rotate-180' : ''}" 
             fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"/>
        </svg>
      </button>
      
      {#if seccionExpandida === 'estados'}
        <div class="px-4 py-4 border-t border-gray-200 bg-gray-50">
          <div class="flex flex-wrap gap-2">
            {#each estados as estado}
              <button
                on:click={() => toggleEstado(estado.value)}
                class="px-4 py-2 text-sm rounded-full border-2 transition-all font-medium {
                  estadosSeleccionados.includes(estado.value)
                    ? `bg-${estado.color}-100 border-${estado.color}-500 text-${estado.color}-800 shadow-sm`
                    : 'bg-white border-gray-300 text-gray-700 hover:border-gray-400'
                }"
              >
                {estado.label}
                {#if estadosSeleccionados.includes(estado.value)}
                  <X class="w-3 h-3 inline ml-1" />
                {/if}
              </button>
            {/each}
          </div>
        </div>
      {/if}
    </div>
    
    <!-- 🏷️ Sección: Categorías y Marcas -->
    <div class="border border-gray-200 rounded-lg overflow-hidden bg-white">
      <button
        on:click={() => toggleSeccion('categorias')}
        class="w-full px-4 py-3 flex items-center justify-between hover:bg-gray-50 transition-colors"
      >
        <div class="flex items-center gap-2">
          <Search class="w-5 h-5 text-primary-600" />
          <span class="font-medium text-gray-900">Categorías y Marcas</span>
          {#if categoriasSeleccionadas.length + marcasSeleccionadas.length > 0}
            <span class="px-2 py-0.5 bg-primary-100 text-primary-700 text-xs rounded-full">
              {categoriasSeleccionadas.length + marcasSeleccionadas.length}
            </span>
          {/if}
        </div>
        <svg class="w-5 h-5 text-gray-400 transition-transform {seccionExpandida === 'categorias' ? 'rotate-180' : ''}" 
             fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"/>
        </svg>
      </button>
      
      {#if seccionExpandida === 'categorias'}
        <div class="px-4 py-4 border-t border-gray-200 bg-gray-50">
          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label for="categorias" class="label text-xs mb-2">Categorías</label>
              <select
                id="categorias"
                bind:value={categoriasSeleccionadas}
                multiple
                class="input text-sm"
                size="4"
              >
                {#each categorias as categoria}
                  <option value={categoria.id}>{categoria.nombre}</option>
                {/each}
              </select>
              <p class="text-xs text-gray-500 mt-1">Ctrl/Cmd para seleccionar varios</p>
            </div>
            
            <div>
              <label for="marcas" class="label text-xs mb-2">Marcas</label>
              <select
                id="marcas"
                bind:value={marcasSeleccionadas}
                multiple
                class="input text-sm"
                size="4"
              >
                {#each marcas as marca}
                  <option value={marca.id}>{marca.nombre}</option>
                {/each}
              </select>
              <p class="text-xs text-gray-500 mt-1">Ctrl/Cmd para seleccionar varios</p>
            </div>
          </div>
        </div>
      {/if}
    </div>
    
    <!-- 👤 Sección: Buscar Cliente -->
    <div class="border border-gray-200 rounded-lg overflow-hidden bg-white">
      <button
        on:click={() => toggleSeccion('cliente')}
        class="w-full px-4 py-3 flex items-center justify-between hover:bg-gray-50 transition-colors"
      >
        <div class="flex items-center gap-2">
          <Search class="w-5 h-5 text-primary-600" />
          <span class="font-medium text-gray-900">Buscar Cliente</span>
          {#if clienteSeleccionado}
            <span class="px-2 py-0.5 bg-green-100 text-green-700 text-xs rounded-full">
              Seleccionado
            </span>
          {/if}
        </div>
        <svg class="w-5 h-5 text-gray-400 transition-transform {seccionExpandida === 'cliente' ? 'rotate-180' : ''}" 
             fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"/>
        </svg>
      </button>
      
      {#if seccionExpandida === 'cliente'}
        <div class="px-4 py-4 border-t border-gray-200 bg-gray-50">
          <AutocompletadoClientes
            bind:clienteSeleccionado
            on:seleccionar={(e) => clienteSeleccionado = e.detail}
            on:limpiar={() => clienteSeleccionado = null}
          />
        </div>
      {/if}
    </div>
    
    <!-- 📦 Sección: Buscar Producto -->
    <div class="border border-gray-200 rounded-lg overflow-hidden bg-white">
      <button
        on:click={() => toggleSeccion('producto')}
        class="w-full px-4 py-3 flex items-center justify-between hover:bg-gray-50 transition-colors"
      >
        <div class="flex items-center gap-2">
          <Search class="w-5 h-5 text-primary-600" />
          <span class="font-medium text-gray-900">Buscar Producto</span>
          {#if productoSeleccionado}
            <span class="px-2 py-0.5 bg-green-100 text-green-700 text-xs rounded-full">
              Seleccionado
            </span>
          {/if}
        </div>
        <svg class="w-5 h-5 text-gray-400 transition-transform {seccionExpandida === 'producto' ? 'rotate-180' : ''}" 
             fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"/>
        </svg>
      </button>
      
      {#if seccionExpandida === 'producto'}
        <div class="px-4 py-4 border-t border-gray-200 bg-gray-50">
          <BuscadorProductos
            bind:productoSeleccionado
            on:seleccionar={(e) => productoSeleccionado = e.detail}
            on:limpiar={() => productoSeleccionado = null}
          />
        </div>
      {/if}
    </div>
    
  </div>
  
  <!-- Botones de Acción -->
  <div class="flex flex-col sm:flex-row gap-3 pt-4 border-t-2 border-gray-200">
    <button
      on:click={aplicarFiltros}
      class="btn-primary flex-1 flex items-center justify-center gap-2"
    >
      <Filter class="w-5 h-5" />
      Generar Reporte
    </button>
    
    {#if hayFiltros}
      <button
        on:click={limpiarFiltros}
        class="btn-secondary flex items-center justify-center gap-2"
      >
        <X class="w-5 h-5" />
        Limpiar Todo
      </button>
    {/if}
  </div>
  
</div>