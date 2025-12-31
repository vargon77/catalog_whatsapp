<!-- src/lib/components/ui/ImageUploader.svelte -->
<!-- ✅ Componente de upload de imágenes a Cloudinary -->
<script>
  import { createEventDispatcher } from 'svelte';
  import { Upload, X, Loader2, Image as ImageIcon, Link2 } from 'lucide-svelte';
  import { uploadImageToCloudinary, generateImagePreview, isValidImageFile } from '$lib/utils/cloudinary';
  // ✅ CORRECCIÓN: Solo usar variables públicas
  import { PUBLIC_CLOUDINARY_UPLOAD_PRESET, PUBLIC_CLOUDINARY_CLOUD_NAME } from '$env/static/public';
  
  const dispatch = createEventDispatcher();
  
  export let imageUrl = '';
  export let label = 'Imagen';
  export let disabled = false;
  export let required = false;
  
  let uploading = false;
  let uploadProgress = 0;
  let error = '';
  let preview = imageUrl;
  let showUrlInput = false;
  let manualUrl = '';
  let fileInput;
  
  // Actualizar preview cuando cambia imageUrl desde fuera
  $: if (imageUrl && imageUrl !== preview) {
    preview = imageUrl;
  }
  
  async function handleFileSelect(event) {
    const file = event.target.files?.[0];
    if (!file) return;
    
    // Validar archivo
    if (!isValidImageFile(file)) {
      error = 'Solo se permiten imágenes (JPG, PNG, GIF, WebP)';
      return;
    }
    
    // Validar tamaño (10MB)
    if (file.size > 10 * 1024 * 1024) {
      error = 'La imagen no puede superar los 10MB';
      return;
    }
    
    error = '';
    uploading = true;
    uploadProgress = 0;
    
    try {
      // Generar preview local inmediatamente
      preview = await generateImagePreview(file);
      
      // Subir a Cloudinary
      const result = await uploadImageToCloudinary(
        file,
        PUBLIC_CLOUDINARY_UPLOAD_PRESET,
        PUBLIC_CLOUDINARY_CLOUD_NAME,
        (progress) => {
          uploadProgress = progress;
        }
      );
      
      preview = result.url;
      imageUrl = result.url;
      
      // Emitir evento con la URL
      dispatch('upload', {
        url: result.url,
        publicId: result.publicId,
        width: result.width,
        height: result.height
      });
      
    } catch (err) {
      console.error('Error uploading image:', err);
      error = err.message || 'Error al subir la imagen';
      preview = '';
    } finally {
      uploading = false;
      uploadProgress = 0;
      // Limpiar input
      if (fileInput) fileInput.value = '';
    }
  }
  
  function handleRemove() {
    preview = '';
    imageUrl = '';
    manualUrl = '';
    if (fileInput) fileInput.value = '';
    dispatch('remove');
  }
  
  function handleManualUrl() {
    if (!manualUrl.trim()) {
      error = 'Ingresa una URL válida';
      return;
    }
    
    // Validar que sea URL de imagen
    const imageExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.webp'];
    const hasImageExtension = imageExtensions.some(ext => 
      manualUrl.toLowerCase().includes(ext)
    );
    
    if (!hasImageExtension && !manualUrl.includes('cloudinary.com')) {
      error = 'La URL debe ser de una imagen válida';
      return;
    }
    
    error = '';
    preview = manualUrl;
    imageUrl = manualUrl;
    showUrlInput = false;
    
    dispatch('upload', { url: manualUrl });
  }
  
  function triggerFileInput() {
    fileInput?.click();
  }
</script>

<div class="space-y-3">
  <label class="block text-sm font-medium text-gray-700">
    {label}
    {#if required}
      <span class="text-red-500">*</span>
    {/if}
  </label>
  
  <!-- Preview o zona de upload -->
  {#if preview}
    <div class="relative inline-block">
      <img 
        src={preview} 
        alt="Preview" 
        class="h-48 w-48 object-cover rounded-lg border-2 border-gray-200 shadow-sm"
        on:error={() => {
          error = 'Error al cargar la imagen';
          preview = '';
        }}
      />
      
      {#if !disabled}
        <button
          type="button"
          on:click={handleRemove}
          class="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1.5 hover:bg-red-600 shadow-lg transition-colors"
          title="Eliminar imagen"
        >
          <X class="w-4 h-4" />
        </button>
      {/if}
      
      {#if uploading}
        <div class="absolute inset-0 bg-black bg-opacity-50 rounded-lg flex items-center justify-center">
          <div class="text-center text-white">
            <Loader2 class="w-8 h-8 animate-spin mx-auto mb-2" />
            <p class="text-sm">Subiendo... {uploadProgress}%</p>
          </div>
        </div>
      {/if}
    </div>
  {:else}
    <div class="space-y-2">
      <!-- Botones de acción -->
      <div class="flex gap-2">
        <button
          type="button"
          on:click={triggerFileInput}
          disabled={disabled || uploading}
          class="flex-1 px-4 py-3 border-2 border-dashed border-gray-300 rounded-lg hover:border-primary-500 hover:bg-primary-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <div class="flex flex-col items-center text-gray-600">
            {#if uploading}
              <Loader2 class="w-8 h-8 animate-spin mb-2" />
              <span class="text-sm">Subiendo...</span>
            {:else}
              <Upload class="w-8 h-8 mb-2" />
              <span class="text-sm font-medium">Subir imagen</span>
              <span class="text-xs text-gray-500 mt-1">JPG, PNG, GIF hasta 10MB</span>
            {/if}
          </div>
        </button>
        
        <button
          type="button"
          on:click={() => showUrlInput = !showUrlInput}
          disabled={disabled}
          class="px-4 py-3 border-2 border-gray-300 rounded-lg hover:border-primary-500 hover:bg-primary-50 transition-colors disabled:opacity-50"
          title="Usar URL"
        >
          <Link2 class="w-6 h-6 text-gray-600" />
        </button>
      </div>
      
      <!-- Input de URL manual -->
      {#if showUrlInput}
        <div class="flex gap-2 p-3 bg-gray-50 rounded-lg border border-gray-200">
          <input
            type="url"
            bind:value={manualUrl}
            placeholder="https://ejemplo.com/imagen.jpg"
            class="flex-1 px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            disabled={disabled}
            on:keypress={(e) => e.key === 'Enter' && handleManualUrl()}
          />
          <button
            type="button"
            on:click={handleManualUrl}
            disabled={disabled || !manualUrl.trim()}
            class="px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700 disabled:opacity-50 text-sm font-medium"
          >
            Usar URL
          </button>
        </div>
      {/if}
      
      <!-- Input file oculto -->
      <input
        bind:this={fileInput}
        type="file"
        accept="image/jpeg,image/jpg,image/png,image/gif,image/webp"
        on:change={handleFileSelect}
        disabled={disabled}
        class="hidden"
      />
    </div>
  {/if}
  
  <!-- Mensaje de error -->
  {#if error}
    <div class="flex items-start gap-2 p-3 bg-red-50 border border-red-200 rounded-lg">
      <svg class="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
        <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clip-rule="evenodd"/>
      </svg>
      <p class="text-sm text-red-700">{error}</p>
    </div>
  {/if}
  
  <!-- Info adicional -->
  <p class="text-xs text-gray-500">
    Recomendado: 800x600px o superior, formato JPG o PNG
  </p>
</div>