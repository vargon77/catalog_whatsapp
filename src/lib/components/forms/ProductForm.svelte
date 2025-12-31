<!-- src/lib/components/forms/ProductForm.svelte -->

<script>
  import { onMount, createEventDispatcher } from 'svelte';
  import { Save, X, Loader2, Upload } from 'lucide-svelte';
  import ImageUploader from '$lib/components/ui/ImageUploader.svelte';

  const dispatch = createEventDispatcher();

  export let producto = null;
  export let categorias = [];
  export let marcas = [];
  export let disabled = false;

  let loading = false;
  let loadingCategorias = false;
  let loadingMarcas = false;
  let error = '';
  let success = '';
  let imagePreview = '';

  // Form data inicial - IMPORTANTE: categoria_id y marca_id son UUIDs (strings), no números
  let formData = {
    nombre: '',
    descripcion_corta: '',
    descripcion_larga: '',
    precio: '',
    precio_oferta: '',
    stock: '',
    categoria_id: null,
    marca_id: null,
    imagen_url: '',
    destacado: false,
    activo: true,
    slug: '',
    sku: ''
  };

  // Cargar categorías si no vienen como prop
  onMount(async () => {
    if (categorias.length === 0) {
      await cargarCategorias();
    }
    
    if (marcas.length === 0) {
      await cargarMarcas();
    }
    
    // Si estamos editando, inicializar formulario
    if (producto) {
      formData = {
        id: producto.id,
        nombre: producto.nombre || '',
        descripcion_corta: producto.descripcion_corta || '',
        descripcion_larga: producto.descripcion_larga || '',
        precio: producto.precio?.toString() || '',
        precio_oferta: producto.precio_oferta?.toString() || '',
        stock: producto.stock?.toString() || '',
        categoria_id: producto.categoria_id || null,  // ✅ UUID como string
        marca_id: producto.marca_id || null,          // ✅ UUID como string
        imagen_url: producto.imagen_url || '',
        destacado: Boolean(producto.destacado),
        activo: producto.activo !== false,
        slug: producto.slug || '',
        sku: producto.sku || ''
      };
      imagePreview = producto.imagen_url || '';
      console.log('📝 Producto cargado:', { categoria_id: formData.categoria_id, marca_id: formData.marca_id });
    }
  });

  async function cargarCategorias() {
    try {
      loadingCategorias = true;
      const res = await fetch('/api/categorias?activas=true');
      const result = await res.json();
      if (result.success) {
        categorias = result.data;
        console.log('📂 Categorías cargadas:', categorias.length);
      }
    } catch (err) {
      console.error('Error cargando categorías:', err);
    } finally {
      loadingCategorias = false;
    }
  }

  async function cargarMarcas() {
    try {
      loadingMarcas = true;
      const res = await fetch('/api/marcas?activas=true');
      const result = await res.json();
      if (result.success) {
        marcas = result.data;
        console.log('🏷️ Marcas cargadas:', marcas.length);
      }
    } catch (err) {
      console.error('Error cargando marcas:', err);
    } finally {
      loadingMarcas = false;
    }
  }

  // Validaciones
  $: nombreValido = formData.nombre.trim().length > 0;
  $: precioValido = formData.precio && !isNaN(parseFloat(formData.precio)) && parseFloat(formData.precio) >= 0;
  $: categoriaValida = formData.categoria_id !== null && formData.categoria_id !== '';
  $: formularioValido = nombreValido && precioValido && categoriaValida; 
  $: isDisabled = disabled || loading;

  // Preview de imagen
  $: if (formData.imagen_url && formData.imagen_url !== imagePreview) {
    imagePreview = formData.imagen_url;
  }

  // Handlers para los selects - ✅ CORREGIDO: manejar UUIDs como strings
  function handleCategoriaChange(event) {
    const value = event.target.value;
    formData.categoria_id = value === '' ? null : value;  // ✅ Mantener como string (UUID)
    console.log('📂 Categoría seleccionada:', formData.categoria_id);
  }

  function handleMarcaChange(event) {
    const value = event.target.value;
    formData.marca_id = value === '' ? null : value;  // ✅ Mantener como string (UUID)
    console.log('🏷️ Marca seleccionada:', formData.marca_id);
  }

  async function handleSubmit() {
    if (!formularioValido || isDisabled) return;
    
    error = '';
    success = '';
    loading = true;

    try {
      // Validación adicional
      if (!formData.categoria_id) {
        throw new Error('Debe seleccionar una categoría');
      }

      // Preparar datos - ✅ CORREGIDO: no convertir UUIDs a número
      const dataToSend = {
        nombre: formData.nombre.trim(),
        descripcion_corta: formData.descripcion_corta?.trim() || null,
        descripcion_larga: formData.descripcion_larga?.trim() || null,
        precio: parseFloat(formData.precio),
        precio_oferta: formData.precio_oferta && formData.precio_oferta !== '' ? parseFloat(formData.precio_oferta) : null,
        stock: formData.stock && formData.stock !== '' ? parseInt(formData.stock) : null,
        categoria_id: formData.categoria_id,  // ✅ UUID como string
        marca_id: formData.marca_id || null,  // ✅ UUID como string
        imagen_url: formData.imagen_url?.trim() || null,
        destacado: formData.destacado,
        activo: formData.activo,
        slug: formData.slug?.trim() || null,
        sku: formData.sku?.trim() || null
      };

      // Si estamos editando, agregar el ID
      if (producto) {
        dataToSend.id = producto.id;
      }

      console.log('📤 Enviando:', dataToSend);

      const url = '/api/productos';
      const method = producto ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(dataToSend)
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || 'Error al guardar el producto');
      }

      const responseData = await res.json();
      console.log('📥 Respuesta:', responseData);

      success = producto 
        ? '✅ Producto actualizado correctamente'
        : '✅ Producto creado correctamente';

      // Limpiar formulario si es nuevo producto
      if (!producto) {
        formData = {
          nombre: '',
          descripcion_corta: '',
          descripcion_larga: '',
          precio: '',
          precio_oferta: '',
          stock: '',
          categoria_id: null,
          marca_id: null,
          imagen_url: '',
          destacado: false,
          activo: true,
          slug: '',
          sku: ''
        };
        imagePreview = '';
      }

      // Disparar evento success
      setTimeout(() => {
        dispatch('success', responseData);
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

  function handleImageUpload(event) {
    const { url } = event.detail;
    formData.imagen_url = url;
    imagePreview = url;
  }

  function handleImageRemove() {
    formData.imagen_url = '';
    imagePreview = '';
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
        Nombre del Producto <span class="text-red-500">*</span>
      </label>
      <input
        id="nombre"
        type="text"
        bind:value={formData.nombre}
        disabled={isDisabled}
        class="input"
        class:border-red-500={!nombreValido && formData.nombre.length > 0}
        placeholder="Ej: Laptop Gamer Pro"
        required
      />
      {#if !nombreValido && formData.nombre.length > 0}
        <p class="mt-1 text-sm text-red-600">El nombre es obligatorio</p>
      {/if}
    </div>

    <!-- Categoría - ✅ CORREGIDO: value usa UUID directamente -->
    <div>
      <label for="categoria" class="label">
        Categoría <span class="text-red-500">*</span>
      </label>
      {#if loadingCategorias}
        <div class="input flex items-center text-gray-500">
          <Loader2 class="w-4 h-4 animate-spin mr-2" />
          Cargando categorías...
        </div>
      {:else}
        <select
          id="categoria"
          value={formData.categoria_id || ''}
          on:change={handleCategoriaChange}
          disabled={isDisabled}
          class="input"
          class:border-red-500={!categoriaValida}
          required
        >
          <option value="">Seleccionar categoría</option>
          {#each categorias as cat}
            <option value={cat.id}>{cat.nombre}</option>
          {/each}
        </select>
        {#if !categoriaValida && formData.nombre.length > 0}
          <p class="mt-1 text-sm text-red-600">Debe seleccionar una categoría</p>
        {/if}
        {#if categorias.length === 0}
          <p class="mt-1 text-sm text-amber-600">
            No hay categorías. <a href="/categorias" class="underline">Crear una</a>
          </p>
        {/if}
      {/if}
    </div>

    <!-- Marca - ✅ CORREGIDO: value usa UUID directamente -->
    <div>
      <label for="marca" class="label">
        Marca
      </label>
      {#if loadingMarcas}
        <div class="input flex items-center text-gray-500">
          <Loader2 class="w-4 h-4 animate-spin mr-2" />
          Cargando marcas...
        </div>
      {:else}
        <select
          id="marca"
          value={formData.marca_id || ''}
          on:change={handleMarcaChange}
          disabled={isDisabled}
          class="input"
        >
          <option value="">Sin marca</option>
          {#each marcas as marca}
            <option value={marca.id}>{marca.nombre}</option>
          {/each}
        </select>
        {#if marcas.length === 0}
          <p class="mt-1 text-sm text-gray-500">
            Opcional. <a href="/marcas/nuevo" class="text-primary-600 underline">Crear marca</a>
          </p>
        {/if}
      {/if}
    </div>

    <!-- Precio -->
    <div>
      <label for="precio" class="label">
        Precio <span class="text-red-500">*</span>
      </label>
      <div class="relative">
        <span class="absolute left-3 top-2.5 text-gray-500">$</span>
        <input
          id="precio"
          type="number"
          step="0.01"
          min="0"
          bind:value={formData.precio}
          disabled={isDisabled}
          class="input pl-8"
          class:border-red-500={!precioValido && formData.precio !== ''}
          placeholder="0.00"
          required
        />
      </div>
      {#if !precioValido && formData.precio !== ''}
        <p class="mt-1 text-sm text-red-600">Ingresa un precio válido</p>
      {/if}
    </div>

    <!-- Precio de Oferta -->
    <div>
      <label for="precio_oferta" class="label">
        Precio de Oferta
      </label>
      <div class="relative">
        <span class="absolute left-3 top-2.5 text-gray-500">$</span>
        <input
          id="precio_oferta"
          type="number"
          step="0.01"
          min="0"
          bind:value={formData.precio_oferta}
          disabled={isDisabled}
          class="input pl-8"
          placeholder="0.00"
        />
      </div>
      <p class="mt-1 text-xs text-gray-500">Opcional: precio con descuento</p>
    </div>

    <!-- Stock -->
    <div>
      <label for="stock" class="label">
        Stock
      </label>
      <input
        id="stock"
        type="number"
        min="0"
        bind:value={formData.stock}
        disabled={isDisabled}
        class="input"
        placeholder="Dejar vacío si no aplica"
      />
      <p class="mt-1 text-xs text-gray-500">Opcional: cantidad disponible</p>
    </div>

    

    <!-- Imagen con Upload a Cloudinary -->
    <div class="md:col-span-2">
      <ImageUploader
        bind:imageUrl={formData.imagen_url}
        label="Imagen del Producto"
        disabled={isDisabled}
        on:upload={handleImageUpload}
        on:remove={handleImageRemove}
      />
    </div>

    <!-- Descripción Corta -->
    <div class="md:col-span-2">
      <label for="descripcion_corta" class="label">
        Descripción Corta
      </label>
      <input
        id="descripcion_corta"
        type="text"
        bind:value={formData.descripcion_corta}
        disabled={isDisabled}
        class="input"
        placeholder="Breve descripción del producto (se muestra en listados)"
        maxlength="200"
      />
      <p class="mt-1 text-xs text-gray-500">Máximo 200 caracteres</p>
    </div>

    <!-- Descripción Larga -->
    <div class="md:col-span-2">
      <label for="descripcion_larga" class="label">
        Descripción Detallada
      </label>
      <textarea
        id="descripcion_larga"
        bind:value={formData.descripcion_larga}
        disabled={isDisabled}
        rows="4"
        class="input resize-none"
        placeholder="Descripción completa del producto con todos los detalles..."
      />
    </div>

    <!-- Checkboxes -->
    <div class="md:col-span-2 flex flex-wrap gap-6">
      <label class="flex items-center cursor-pointer">
        <input
          type="checkbox"
          bind:checked={formData.destacado}
          disabled={isDisabled}
          class="w-4 h-4 text-primary-600 border-gray-300 rounded focus:ring-primary-500"
        />
        <span class="ml-2 text-sm text-gray-700 font-medium">
          ⭐ Producto destacado
        </span>
      </label>

      <label class="flex items-center cursor-pointer">
        <input
          type="checkbox"
          bind:checked={formData.activo}
          disabled={isDisabled}
          class="w-4 h-4 text-primary-600 border-gray-300 rounded focus:ring-primary-500"
        />
        <span class="ml-2 text-sm text-gray-700 font-medium">
          Producto activo (visible en catálogo)
        </span>
      </label>
    </div>
  </div>

  <!-- Botones de acción -->
  <div class="flex flex-col-reverse sm:flex-row gap-3 pt-6 border-t border-gray-200">
    <button
      type="button"
      on:click={handleCancel}
      disabled={isDisabled}
      class="btn-secondary w-full sm:w-auto"
    >
      <X class="w-4 h-4 mr-2" />
      Cancelar
    </button>

    <button
      type="submit"
      disabled={!formularioValido || isDisabled}
      class="btn-primary w-full sm:flex-1 flex items-center justify-center"
    >
      {#if loading}
        <Loader2 class="w-5 h-5 animate-spin mr-2" />
        Guardando...
      {:else}
        <Save class="w-5 h-5 mr-2" />
        {producto ? 'Actualizar Producto' : 'Crear Producto'}
      {/if}
    </button>
  </div>

  <!-- Ayuda -->
  {#if !formularioValido}
    <div class="bg-amber-50 border border-amber-200 rounded-lg p-4">
      <p class="text-sm text-amber-800 font-medium mb-2">
        ⚠️ Completa los campos obligatorios:
      </p>
      <ul class="text-sm text-amber-700 space-y-1 ml-4">
        {#if !nombreValido}
          <li>• Nombre del producto</li>
        {/if}
        {#if !precioValido}
          <li>• Precio válido</li>
        {/if}
        {#if !categoriaValida}
          <li>• Categoría</li>
        {/if}
      </ul>
    </div>
  {/if}
</form>