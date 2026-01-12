<!-- src/lib/components/ui/ColorPalettePicker.svelte -->
<script>
  import { createEventDispatcher } from 'svelte';
  import { colorPalettes } from '$lib/data/colorPalettes';
  import { CheckCircle2, Palette } from 'lucide-svelte';
  
  const dispatch = createEventDispatcher();
  
  export let selectedPaletteId = 'blue-default';
  export let disabled = false;
  
  $: selectedPalette = colorPalettes.find(p => p.id === selectedPaletteId) || colorPalettes[0];
  
  function selectPalette(paletteId) {
    if (disabled) return;
    selectedPaletteId = paletteId;
    const palette = colorPalettes.find(p => p.id === paletteId);
    dispatch('change', { paletteId, palette });
  }
</script>

<div class="space-y-4">
  <!-- Header -->
  <div class="flex items-center justify-between">
    <div class="flex items-center gap-2">
      <Palette class="w-5 h-5 text-primary-600" />
      <h3 class="font-semibold text-gray-800">Paleta de Colores</h3>
    </div>
    <span class="text-sm text-gray-500">
      {colorPalettes.length} paletas disponibles
    </span>
  </div>
  
  <!-- Grid de paletas -->
  <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
    {#each colorPalettes as palette}
      {@const isSelected = palette.id === selectedPaletteId}
      {@const isHighContrast = palette.highContrast}
      
      <button
        type="button"
        on:click={() => selectPalette(palette.id)}
        disabled={disabled}
        class="relative p-4 border-2 rounded-lg transition-all text-left hover:shadow-md disabled:opacity-50 disabled:cursor-not-allowed {
          isSelected 
            ? 'border-primary-600 bg-primary-50 shadow-md' 
            : 'border-gray-200 hover:border-gray-300 bg-white'
        }"
      >
        <!-- Badge de seleccionado -->
        {#if isSelected}
          <div class="absolute -top-2 -right-2 bg-primary-600 text-white rounded-full p-1">
            <CheckCircle2 class="w-4 h-4" />
          </div>
        {/if}
        
        <!-- Badge de alto contraste -->
        {#if isHighContrast}
          <div class="absolute top-2 right-2 bg-yellow-400 text-yellow-900 text-xs font-bold px-2 py-0.5 rounded-full">
            Alto Contraste
          </div>
        {/if}
        
        <!-- Preview de colores -->
        <div class="flex items-center gap-2 mb-3">
          {#each palette.preview as color}
            <div 
              class="w-12 h-12 rounded-lg shadow-sm border border-gray-200"
              style="background-color: {color};"
            ></div>
          {/each}
        </div>
        
        <!-- Nombre y descripción -->
        <div>
          <h4 class="font-semibold text-gray-900 mb-1">
            {palette.name}
          </h4>
          <p class="text-sm text-gray-600">
            {palette.description}
          </p>
        </div>
        
        <!-- Preview de botón con esta paleta -->
        <div class="mt-3 pt-3 border-t border-gray-100">
          <div class="flex gap-2">
            <div 
              class="px-3 py-1.5 rounded-md text-white text-xs font-medium"
              style="background-color: {palette.preview[0]};"
            >
              Botón Primario
            </div>
            <div 
              class="px-3 py-1.5 rounded-md text-xs font-medium border-2"
              style="color: {palette.preview[0]}; border-color: {palette.preview[0]};"
            >
              Botón Secundario
            </div>
          </div>
        </div>
      </button>
    {/each}
  </div>
  
  <!-- Paleta seleccionada actual -->
  <div class="bg-gradient-to-r from-gray-50 to-gray-100 rounded-lg p-4 border border-gray-200">
    <div class="flex items-start justify-between">
      <div>
        <p class="text-sm font-medium text-gray-700 mb-1">Paleta Actual:</p>
        <p class="text-lg font-bold text-gray-900">{selectedPalette.name}</p>
        <p class="text-sm text-gray-600 mt-1">{selectedPalette.description}</p>
      </div>
      <div class="flex gap-1">
        {#each selectedPalette.preview as color}
          <div 
            class="w-8 h-8 rounded-md shadow-sm border border-gray-300"
            style="background-color: {color};"
          ></div>
        {/each}
      </div>
    </div>
  </div>
  
  <!-- Nota informativa -->
  <div class="bg-blue-50 border border-blue-200 rounded-lg p-4">
    <div class="flex items-start gap-3">
      <svg class="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
      </svg>
      <div class="text-sm text-blue-800">
        <p class="font-medium mb-1">Acerca de los colores</p>
        <ul class="list-disc list-inside space-y-1 text-blue-700">
          <li>Los cambios se aplicarán a toda la tienda (catálogo público y dashboard)</li>
          <li>Las paletas de alto contraste mejoran la accesibilidad</li>
          <li>Puedes cambiar la paleta en cualquier momento</li>
        </ul>
      </div>
    </div>
  </div>
</div>

<style>
  button:disabled {
    cursor: not-allowed;
  }
</style>
