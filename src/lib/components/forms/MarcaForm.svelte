<!-- src/lib/components/forms/MarcaForm.svelte -->
<script>
  import { createEventDispatcher } from 'svelte';
  import { Save, X, Loader2 } from 'lucide-svelte';
  import ImageUploader from '$lib/components/ui/ImageUploader.svelte';
  
  const dispatch = createEventDispatcher();
  
  export let marca = null;
  
  let loading = false;
  let error = '';
  let success = '';
  
  // Form data inicial
  let formData = {
    nombre: marca?.nombre || '',
    descripcion: marca?.descripcion || '',
    logo_url: marca?.logo_url || '',
    activo: marca?.activo !== false
  };
  
  // Validaciones
  $: nombreValido = formData.nombre.trim().length > 0;
  $: formularioValido = nombreValido;
  
  async function handleSubmit() {
    if (!formularioValido || loading) return;
    
    error = '';
    success = '';
    loading = true;
    
    try {
      const dataToSend = {
        nombre: formData.nombre.trim(),
        descripcion: formData.descripcion?.trim() || null,
        logo_url: formData.logo_url?.trim() || null,
        activo: formData.activo
      };
      
      // Si estamos editando, agregar el ID
      if (marca) {
        dataToSend.id = marca.id;
      }
      
      console.log('📤 Enviando marca:', dataToSend);
      
      const url = '/api/marcas';
      const method = marca ? 'PUT' : 'POST';
      
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(dataToSend)
      });
      
      const responseData = await res.json();
      
      if (!responseData.success) {
        throw new Error(responseData.error || 'Error al guardar la marca');
      }
      
      console.log('📥 Respuesta:', responseData);
      
      success = marca 
        ? '✅ Marca actualizada correctamente'
        : '✅ Marca creada correctamente';
      
      // Limpiar formulario si es nueva marca
      if (!marca) {
        formData = {
          nombre: '',
          descripcion: '',
          logo_url: '',
          activo: true
        };
      }
      
      // Disparar evento success
      setTimeout(() => {
        dispatch('success', responseData.data);
      }, 1000);
      
    } catch (err) {
      console.error('❌ Error:', err);
      error = err.message;
    } finally {
      loading = false;
    }
  }
  
  function handleCancel() {
    dispatch('cancel');
  }
  
  function handleLogoUpload(event) {
    const { url } = event.detail;
    formData.logo_url = url;
  }
  
  function handleLogoRemove() {
    formData.logo_url = '';
  }
</script>

<form on:submit|preventDefault={handleSubmit} class="space-y-6">
  <!-- Mensajes de error/éxito -->
  {#if error}
    <div class="bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded-lg flex items-start">
      <svg class="w-5 h-5 mr-2 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
        <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clip-rule="evenodd"/>
      </svg>
      <span>{error}</span>
    </div>
  {/if}

  {#if success}
    <div class="bg-green-50 border border-green-200 text-green-800 px-4 py-3 rounded-lg flex items-start">
      <svg class="w-5 h-5 mr-2 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
        <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd"/>
      </svg>
      <span>{success}</span>
    </div>
  {/if}

  <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
    <!-- Nombre -->
    <div class="md:col-span-2">
      <label for="nombre" class="label">
        Nombre de la Marca <span class="text-red-500">*</span>
      </label>
      <input
        id="nombre"
        type="text"
        bind:value={formData.nombre}
        disabled={loading}
        class="input"
        class:border-red-500={!nombreValido && formData.nombre.length > 0}
        placeholder="Ej: Nike, Samsung, Apple..."
        required
      />
      {#if !nombreValido && formData.nombre.length > 0}
        <p class="mt-1 text-sm text-red-600">El nombre es obligatorio</p>
      {/if}
    </div>

    <!-- Logo -->
    <div class="md:col-span-2">
      <ImageUploader
        bind:imageUrl={formData.logo_url}
        label="Logo de la Marca"
        disabled={loading}
        on:upload={handleLogoUpload}
        on:remove={handleLogoRemove}
      />
    </div>

    <!-- Descripción -->
    <div class="md:col-span-2">
      <label for="descripcion" class="label">
        Descripción
      </label>
      <textarea
        id="descripcion"
        bind:value={formData.descripcion}
        disabled={loading}
        rows="4"
        class="input resize-none"
        placeholder="Descripción de la marca, historia, características..."
      />
    </div>

    <!-- Checkbox Activo -->
    <div class="md:col-span-2">
      <label class="flex items-center cursor-pointer">
        <input
          type="checkbox"
          bind:checked={formData.activo}
          disabled={loading}
          class="w-4 h-4 text-primary-600 border-gray-300 rounded focus:ring-primary-500"
        />
        <span class="ml-2 text-sm text-gray-700 font-medium">
          Marca activa (visible en formularios)
        </span>
      </label>
    </div>
  </div>

  <!-- Botones de acción -->
  <div class="flex flex-col-reverse sm:flex-row gap-3 pt-6 border-t border-gray-200">
    <button
      type="button"
      on:click={handleCancel}
      disabled={loading}
      class="btn-secondary w-full sm:w-auto"
    >
      <X class="w-4 h-4 mr-2" />
      Cancelar
    </button>

    <button
      type="submit"
      disabled={!formularioValido || loading}
      class="btn-primary w-full sm:flex-1 flex items-center justify-center"
    >
      {#if loading}
        <Loader2 class="w-5 h-5 animate-spin mr-2" />
        Guardando...
      {:else}
        <Save class="w-5 h-5 mr-2" />
        {marca ? 'Actualizar Marca' : 'Crear Marca'}
      {/if}
    </button>
  </div>

  <!-- Ayuda -->
  {#if !formularioValido}
    <div class="bg-amber-50 border border-amber-200 rounded-lg p-4">
      <p class="text-sm text-amber-800 font-medium mb-2">
        ⚠️ Completa el campo obligatorio:
      </p>
      <ul class="text-sm text-amber-700 space-y-1 ml-4">
        {#if !nombreValido}
          <li>• Nombre de la marca</li>
        {/if}
      </ul>
    </div>
  {/if}
</form>