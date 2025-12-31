<!-- src/lib/components/forms/CategoriaForm.svelte -->
 <!--revisar -->
<script>
  import { createEventDispatcher } from 'svelte';
  import { Save, X, Loader2 } from 'lucide-svelte';
  
  const dispatch = createEventDispatcher();
  
  export let categoria = null;
  export let modoEdicion = false;
  
  let loading = false;
  let error = '';
  
  let formData = {
    id: categoria?.id || null,
    nombre: categoria?.nombre || '',
    descripcion: categoria?.descripcion || '',
    slug: categoria?.slug || '',
    orden: categoria?.orden || 0,
    activo: categoria?.activo !== undefined ? categoria.activo : true
  };
  
  $: formularioValido = formData.nombre.trim() !== '';
  
  async function handleSubmit() {
    if (!formularioValido || loading) return;
    
    loading = true;
    error = '';
    
    try {
      const url = 'api/categorias';
      const method = modoEdicion ? 'PUT' : 'POST';
      
      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });
      
      const result = await response.json();
      
      if (!result.success) {
        throw new Error(result.error || 'Error al guardar la categoría');
      }
      
      dispatch('success', result.data);
      
    } catch (err) {
      error = err.message;
    } finally {
      loading = false;
    }
  }
</script>

<form on:submit|preventDefault={handleSubmit} class="space-y-4">
  <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
    <div>
      <label class="label">
        Nombre <span class="text-red-500">*</span>
      </label>
      <input
        type="text"
        bind:value={formData.nombre}
        placeholder="Ej: Electrónica"
        class="input"
        required
        disabled={loading}
      />
    </div>
    
    <div>
      <label class="label">Slug</label>
      <input
        type="text"
        bind:value={formData.slug}
        placeholder="electronica"
        class="input"
        disabled={loading}
      />
      <p class="text-xs text-gray-500 mt-1">Dejar vacío para generar automáticamente</p>
    </div>
    
    <div class="md:col-span-2">
      <label class="label">Descripción</label>
      <textarea
        bind:value={formData.descripcion}
        placeholder="Descripción de la categoría"
        rows="3"
        class="input resize-none"
        disabled={loading}
      ></textarea>
    </div>
    
    <div>
      <label class="label">Orden</label>
      <input
        type="number"
        bind:value={formData.orden}
        min="0"
        class="input"
        disabled={loading}
      />
      <p class="text-xs text-gray-500 mt-1">Orden de visualización</p>
    </div>
    
    <div class="flex items-center">
      <label class="flex items-center space-x-2 cursor-pointer">
        <input
          type="checkbox"
          bind:checked={formData.activo}
          class="w-5 h-5 text-primary-600 rounded"
          disabled={loading}
        />
        <span class="text-sm font-medium text-gray-700">Categoría activa</span>
      </label>
    </div>
  </div>
  
  {#if error}
    <div class="bg-red-50 border border-red-200 rounded-lg p-3">
      <p class="text-sm text-red-700">{error}</p>
    </div>
  {/if}
  
  <div class="flex justify-end space-x-3 pt-4 border-t">
    <button
      type="button"
      on:click={() => dispatch('cancel')}
      class="btn-secondary"
      disabled={loading}
    >
      Cancelar
    </button>
    
    <button
      type="submit"
      class="btn-primary flex items-center gap-2"
      disabled={!formularioValido || loading}
    >
      {#if loading}
        <Loader2 class="w-5 h-5 animate-spin" />
        Guardando...
      {:else}
        <Save class="w-5 h-5" />
        {modoEdicion ? 'Actualizar' : 'Crear'}
      {/if}
    </button>
  </div>
</form>