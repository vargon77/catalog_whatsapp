<!-- src/routes/(admin)/productos/[id]/editar/+page.svelte -->
<script>
  import { goto } from '$app/navigation';
  import ProductForm from '$lib/components/forms/ProductForm.svelte';
  
  export let data;
  
  $: producto = data.producto;
  $: categorias = data.categorias;

  function handleSuccess(event) {
    // Redirigir a la lista después de editar
    goto('/productos');
  }
</script>

<svelte:head>
  <title>Editar {producto.nombre} | Dashboard</title>
</svelte:head>

<div class="max-w-4xl mx-auto">
  <!-- Breadcrumb -->
  <nav class="mb-6 flex items-center text-sm text-gray-600">
    <a href="/productos" class="hover:text-primary-600">Productos</a>
    <svg class="w-4 h-4 mx-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"/>
    </svg>
    <span class="text-gray-900 font-medium">Editar: {producto.nombre}</span>
  </nav>

  <!-- Header -->
  <div class="mb-8">
    <h1 class="text-2xl md:text-3xl font-bold text-gray-900">Editar Producto</h1>
    <p class="mt-1 text-sm text-gray-600">Modifica la información del producto</p>
  </div>

  <!-- Formulario -->
  <div class="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
    <ProductForm 
      {producto} 
      {categorias}
      on:success={handleSuccess} 
    />
  </div>
</div>