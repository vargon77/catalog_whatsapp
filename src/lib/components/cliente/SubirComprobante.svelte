<!-- src/lib/components/cliente/SubirComprobante.svelte -->
<script>
  import { createEventDispatcher } from 'svelte';
  import { Upload, CheckCircle, Loader2, AlertCircle, X, Image as ImageIcon } from 'lucide-svelte';
  
  export let pedido;
  export let esReenvio = false;
  
  const dispatch = createEventDispatcher();
  let loading = false;
  let error = '';
  let previewUrl = '';
  let selectedFile = null;
  let dragOver = false;
  
  function handleFileSelect(event) {
    const file = event.target.files?.[0];
    processFile(file);
  }
  
  function handleDrop(event) {
    event.preventDefault();
    dragOver = false;
    
    const file = event.dataTransfer.files?.[0];
    processFile(file);
  }
  
  function processFile(file) {
    if (!file) return;
    
    // Validar tipo
    if (!file.type.startsWith('image/')) {
      error = 'Solo se permiten imágenes';
      return;
    }
    
    // Validar tamaño (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      error = 'La imagen no puede pesar más de 5MB';
      return;
    }
    
    error = '';
    selectedFile = file;
    
    // Crear preview
    const reader = new FileReader();
    reader.onload = (e) => {
      previewUrl = e.target?.result;
    };
    reader.readAsDataURL(file);
  }
  
  function clearFile() {
    selectedFile = null;
    previewUrl = '';
    error = '';
  }
  
  async function uploadComprobante() {
    if (!selectedFile) {
      error = 'Selecciona un archivo';
      return;
    }
    
    loading = true;
    error = '';
    
    try {
      // Convertir a base64
      const base64 = await new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result.split(',')[1]);
        reader.onerror = reject;
        reader.readAsDataURL(selectedFile);
      });
      
      // Subir a Supabase Storage
      const fileName = `comprobante_${pedido.id}_${Date.now()}.${selectedFile.name.split('.').pop()}`;
      
      const uploadRes = await fetch('/api/upload', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          file: base64,
          fileName,
          bucket: 'comprobantes'
        })
      });
      
      const uploadResult = await uploadRes.json();
      
      if (!uploadResult.success) {
        throw new Error(uploadResult.error || 'Error al subir imagen');
      }
      
      // Actualizar pedido con URL del comprobante
      const res = await fetch(`/api/pedidos/${pedido.id}/subir-comprobante`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          comprobante_url: uploadResult.url
        })
      });
      
      const result = await res.json();
      
      if (!result.success) {
        throw new Error(result.error);
      }
      
      dispatch('success');
      
    } catch (err) {
      error = err.message || 'Error al subir el comprobante';
    } finally {
      loading = false;
    }
  }
  
  function handleDragOver(event) {
    event.preventDefault();
    dragOver = true;
  }
  
  function handleDragLeave() {
    dragOver = false;
  }
</script>

<div class="bg-gradient-to-br from-blue-50 to-primary-50 rounded-2xl shadow-lg p-6 mb-6 border-2 border-primary-200">
  <div class="flex items-start gap-4 mb-6">
    <div class="w-12 h-12 bg-primary-100 rounded-full flex items-center justify-center flex-shrink-0">
      <Upload class="w-6 h-6 text-primary-600" />
    </div>
    <div class="flex-1">
      <h3 class="text-lg font-bold text-gray-900 mb-1">
        {esReenvio ? 'Reenviar Comprobante de Pago' : 'Sube tu Comprobante de Pago'}
      </h3>
      <p class="text-sm text-gray-700">
        Para continuar con tu pedido, necesitamos validar tu pago
      </p>
    </div>
  </div>
  
  {#if !previewUrl}
    <!-- Zona de drop -->
    <div
      class="border-2 border-dashed rounded-xl p-8 text-center transition-all {
        dragOver 
          ? 'border-primary-500 bg-primary-50' 
          : 'border-gray-300 bg-white hover:border-primary-400'
      }"
      on:drop={handleDrop}
      on:dragover={handleDragOver}
      on:dragleave={handleDragLeave}
    >
      <div class="w-16 h-16 bg-primary-100 rounded-full flex items-center justify-center mx-auto mb-4">
        <ImageIcon class="w-8 h-8 text-primary-600" />
      </div>
      
      <p class="text-gray-700 font-medium mb-2">
        Arrastra tu comprobante aquí
      </p>
      <p class="text-sm text-gray-500 mb-4">
        o haz clic para seleccionar
      </p>
      
      <label class="btn-primary inline-flex items-center gap-2 cursor-pointer">
        <Upload class="w-5 h-5" />
        <span>Seleccionar archivo</span>
        <input
          type="file"
          accept="image/*"
          on:change={handleFileSelect}
          class="hidden"
        />
      </label>
      
      <p class="text-xs text-gray-500 mt-4">
        Formatos: JPG, PNG, PDF • Máximo 5MB
      </p>
    </div>
  {:else}
    <!-- Preview y upload -->
    <div class="space-y-4">
      <div class="relative bg-white rounded-xl p-4 border-2 border-primary-200">
        <button
          on:click={clearFile}
          class="absolute top-2 right-2 w-8 h-8 bg-red-500 text-white rounded-full flex items-center justify-center hover:bg-red-600 transition-colors z-10"
        >
          <X class="w-5 h-5" />
        </button>
        
        <img
          src={previewUrl}
          alt="Comprobante"
          class="w-full max-h-96 object-contain rounded-lg"
        />
      </div>
      
      <div class="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h4 class="font-medium text-blue-900 mb-2 text-sm">✅ Requisitos del comprobante:</h4>
        <ul class="text-sm text-blue-800 space-y-1">
          <li>• Imagen clara y legible</li>
          <li>• Fecha y hora visible</li>
          <li>• Monto correcto: ${pedido.total.toFixed(2)}</li>
          <li>• Nombre del titular visible</li>
        </ul>
      </div>
      
      {#if error}
        <div class="bg-red-50 border-l-4 border-red-500 p-4 rounded-lg">
          <div class="flex items-center gap-3">
            <AlertCircle class="w-5 h-5 text-red-600" />
            <p class="text-sm text-red-800">{error}</p>
          </div>
        </div>
      {/if}
      
      <button
        on:click={uploadComprobante}
        disabled={loading}
        class="w-full bg-primary-600 text-white rounded-xl py-4 hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg flex items-center justify-center gap-3 font-semibold text-lg"
      >
        {#if loading}
          <Loader2 class="w-6 h-6 animate-spin" />
          <span>Subiendo...</span>
        {:else}
          <CheckCircle class="w-6 h-6" />
          <span>Enviar Comprobante</span>
        {/if}
      </button>
      
      <button
        on:click={clearFile}
        class="w-full text-gray-600 hover:text-gray-800 font-medium py-2"
      >
        Seleccionar otra imagen
      </button>
    </div>
  {/if}
</div>