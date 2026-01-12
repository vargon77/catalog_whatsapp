<!-- src/lib/components/ui/MultipleImageUploader.svelte -->
<script>
  import { createEventDispatcher } from 'svelte';
  import { Upload, X, Loader2, ChevronLeft, ChevronRight } from 'lucide-svelte';
  import { uploadImageToCloudinary, isValidImageFile } from '$lib/utils/cloudinary';
  import { PUBLIC_CLOUDINARY_UPLOAD_PRESET, PUBLIC_CLOUDINARY_CLOUD_NAME } from '$env/static/public';
  
  const dispatch = createEventDispatcher();
  
  export let images = [];
  export let label = 'Imágenes';
  export let maxImages = 10;
  export let disabled = false;
  
  let uploading = false;
  let uploadProgress = 0;
  let error = '';
  let fileInput;
  
  function handleFileSelect(event) {
    const files = Array.from(event.target.files || []);
    
    if (images.length + files.length > maxImages) {
      error = `Máximo ${maxImages} imágenes permitidas`;
      return;
    }
    
    uploadMultipleImages(files);
  }
  
  async function uploadMultipleImages(files) {
    uploading = true;
    error = '';
    uploadProgress = 0;
    
    try {
      const validFiles = files.filter(file => {
        if (!isValidImageFile(file)) {
          console.warn(`Archivo ${file.name} no es una imagen válida`);
          return false;
        }
        if (file.size > 10 * 1024 * 1024) {
          console.warn(`Archivo ${file.name} supera los 10MB`);
          return false;
        }
        return true;
      });
      
      if (validFiles.length === 0) {
        error = 'No hay archivos válidos para subir';
        return;
      }
      
      const uploadPromises = validFiles.map(async (file, index) => {
        const result = await uploadImageToCloudinary(
          file,
          PUBLIC_CLOUDINARY_UPLOAD_PRESET,
          PUBLIC_CLOUDINARY_CLOUD_NAME,
          (progress) => {
            uploadProgress = Math.round(((index + progress / 100) / validFiles.length) * 100);
          }
        );
        return result.url;
      });
      
      const urls = await Promise.all(uploadPromises);
      images = [...images, ...urls];
      
      dispatch('change', { images });
      
    } catch (err) {
      console.error('Error uploading images:', err);
      error = err.message || 'Error al subir las imágenes';
    } finally {
      uploading = false;
      uploadProgress = 0;
      if (fileInput) fileInput.value = '';
    }
  }
  
  function removeImage(index) {
    images = images.filter((_, i) => i !== index);
    dispatch('change', { images });
  }
  
  function moveImage(index, direction) {
    const newIndex = index + direction;
    if (newIndex < 0 || newIndex >= images.length) return;
    
    const newImages = [...images];
    [newImages[index], newImages[newIndex]] = [newImages[newIndex], newImages[index]];
    images = newImages;
    dispatch('change', { images });
  }
  
  function triggerFileInput() {
    fileInput?.click();
  }
</script>

<div class="space-y-3">
  <label class="block text-sm font-medium text-gray-700">
    {label}
    <span class="text-gray-500 font-normal ml-2">({images.length}/{maxImages})</span>
  </label>
  
  {#if images.length > 0}
    <div class="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
      {#each images as image, index}
        <div class="relative group">
          <div class="aspect-square rounded-lg overflow-hidden bg-gray-100 border-2 border-gray-200">
            <img 
              src={image} 
              alt="Imagen {index + 1}"
              class="w-full h-full object-cover"
            />
          </div>
          
          {#if !disabled}
            <div class="absolute top-2 right-2 flex gap-1">
              <button
                type="button"
                on:click={() => removeImage(index)}
                class="bg-red-500 text-white rounded-full p-1 hover:bg-red-600 shadow-lg"
                title="Eliminar"
              >
                <X class="w-4 h-4" />
              </button>
            </div>
            
            <div class="absolute bottom-2 left-2 flex gap-1">
              {#if index > 0}
                <button
                  type="button"
                  on:click={() => moveImage(index, -1)}
                  class="bg-white/90 text-gray-700 rounded-full p-1 hover:bg-white shadow"
                  title="Mover izquierda"
                >
                  <ChevronLeft class="w-4 h-4" />
                </button>
              {/if}
              {#if index < images.length - 1}
                <button
                  type="button"
                  on:click={() => moveImage(index, 1)}
                  class="bg-white/90 text-gray-700 rounded-full p-1 hover:bg-white shadow"
                  title="Mover derecha"
                >
                  <ChevronRight class="w-4 h-4" />
                </button>
              {/if}
            </div>
          {/if}
          
          <div class="absolute bottom-2 right-2 bg-white/90 text-gray-700 rounded-full w-6 h-6 flex items-center justify-center text-xs font-bold">
            {index + 1}
          </div>
        </div>
      {/each}
    </div>
  {/if}
  
  {#if images.length < maxImages && !disabled}
    <button
      type="button"
      on:click={triggerFileInput}
      disabled={uploading}
      class="w-full px-4 py-8 border-2 border-dashed border-gray-300 rounded-lg hover:border-primary-500 hover:bg-primary-50 transition-colors disabled:opacity-50"
    >
      <div class="flex flex-col items-center text-gray-600">
        {#if uploading}
          <Loader2 class="w-8 h-8 animate-spin mb-2" />
          <span class="text-sm">Subiendo... {uploadProgress}%</span>
        {:else}
          <Upload class="w-8 h-8 mb-2" />
          <span class="text-sm font-medium">Agregar imágenes</span>
          <span class="text-xs text-gray-500 mt-1">
            Máximo {maxImages - images.length} más (JPG, PNG, hasta 10MB)
          </span>
        {/if}
      </div>
    </button>
    
    <input
      bind:this={fileInput}
      type="file"
      accept="image/jpeg,image/jpg,image/png,image/gif,image/webp"
      multiple
      on:change={handleFileSelect}
      class="hidden"
    />
  {/if}
  
  {#if error}
    <div class="flex items-start gap-2 p-3 bg-red-50 border border-red-200 rounded-lg">
      <svg class="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
        <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clip-rule="evenodd"/>
      </svg>
      <p class="text-sm text-red-700">{error}</p>
    </div>
  {/if}
  
  <p class="text-xs text-gray-500">
    💡 Tip: Arrastra las imágenes para cambiar el orden en el carrusel
  </p>
</div>