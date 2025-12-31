<!-- src/routes/(admin)/categorias/+page.svelte -->
 <!--revisar -->
<script>
  import { onMount } from 'svelte';
  import { Tag, Plus, Edit, Trash2, CheckCircle2, X } from 'lucide-svelte';
  import CategoriaForm from '$lib/components/forms/CategoriaForm.svelte';
  
  let categorias = [];
  let loading = true;
  let mostrarFormulario = false;
  let categoriaEditando = null;
  let modoEdicion = false;
  let mensaje = { tipo: '', texto: '', visible: false };
  
  onMount(async () => {
    await cargarCategorias();
  });
  
  async function cargarCategorias() {
    loading = true;
    try {
      const response = await fetch('/api/categorias');
      const result = await response.json();
      if (result.success) {
        categorias = result.data;
      }
    } catch (error) {
      console.error('Error cargando categorías:', error);
    } finally {
      loading = false;
    }
  }
  
  function abrirFormularioCrear() {
    categoriaEditando = null;
    modoEdicion = false;
    mostrarFormulario = true;
  }
  
  function abrirFormularioEditar(categoria) {
    categoriaEditando = categoria;
    modoEdicion = true;
    mostrarFormulario = true;
  }
  
  function cerrarFormulario() {
    mostrarFormulario = false;
    categoriaEditando = null;
    modoEdicion = false;
  }
  
  async function handleSuccess() {
    await cargarCategorias();
    cerrarFormulario();
    mostrarMensaje('success', modoEdicion ? 'Categoría actualizada' : 'Categoría creada');
  }
  
  async function eliminarCategoria(categoria) {
    if (!confirm(`¿Eliminar "${categoria.nombre}"?`)) return;
    
    try {
      const response = await fetch(`/api/categorias?id=${categoria.id}`, {
        method: 'DELETE'
      });
      
      const result = await response.json();
      
      if (!result.success) {
        throw new Error(result.error);
      }
      
      await cargarCategorias();
      mostrarMensaje('success', 'Categoría eliminada');
      
    } catch (error) {
      mostrarMensaje('error', error.message);
    }
  }
  
  function mostrarMensaje(tipo, texto) {
    mensaje = { tipo, texto, visible: true };
    setTimeout(() => { mensaje.visible = false; }, 5000);
  }
</script>

<div class="space-y-6">
  {#if mensaje.visible}
    <div class="fixed top-20 right-4 z-50 animate-slide-in">
      <div class={`rounded-lg shadow-lg p-4 flex items-center gap-3 ${
        mensaje.tipo === 'success' ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'
      }`}>
        <CheckCircle2 class="w-5 h-5 {mensaje.tipo === 'success' ? 'text-green-600' : 'text-red-600'}" />
        <span class={mensaje.tipo === 'success' ? 'text-green-700' : 'text-red-700'}>
          {mensaje.texto}
        </span>
        <button on:click={() => mensaje.visible = false}>
          <X class="w-4 h-4" />
        </button>
      </div>
    </div>
  {/if}
  
  <div class="flex justify-between items-center">
    <div>
      <h1 class="text-2xl font-bold text-gray-800">Gestión de Categorías</h1>
      <p class="text-gray-600">Organiza tus productos por categorías</p>
    </div>
    {#if !mostrarFormulario}
      <button on:click={abrirFormularioCrear} class="btn-primary flex items-center gap-2">
        <Plus class="w-5 h-5" />
        Nueva Categoría
      </button>
    {/if}
  </div>
  
  {#if mostrarFormulario}
    <div class="bg-gray-50 rounded-xl p-6 border-2 border-primary-200">
      <div class="flex justify-between items-center mb-4">
        <h2 class="text-xl font-bold text-gray-800">
          {modoEdicion ? 'Editar' : 'Crear'} Categoría
        </h2>
        <button on:click={cerrarFormulario} class="p-2 hover:bg-gray-200 rounded-lg">
          <X class="w-5 h-5" />
        </button>
      </div>
      
      <CategoriaForm
        categoria={categoriaEditando}
        {modoEdicion}
        on:success={handleSuccess}
        on:cancel={cerrarFormulario}
      />
    </div>
  {:else}
    <div class="bg-white rounded-xl shadow-sm p-6">
      {#if loading}
        <div class="text-center py-12">
          <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto"></div>
          <p class="mt-4 text-gray-600">Cargando categorías...</p>
        </div>
      {:else if categorias.length === 0}
        <div class="text-center py-12">
          <Tag class="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h3 class="text-lg font-semibold text-gray-700 mb-2">No hay categorías</h3>
          <p class="text-gray-500 mb-6">Crea tu primera categoría para organizar productos</p>
          <button on:click={abrirFormularioCrear} class="btn-primary">
            Crear primera categoría
          </button>
        </div>
      {:else}
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {#each categorias as categoria}
            <div class="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
              <div class="flex items-start justify-between mb-3">
                <div class="flex items-center gap-3">
                  <div class="w-10 h-10 bg-primary-100 rounded-lg flex items-center justify-center">
                    <Tag class="w-5 h-5 text-primary-600" />
                  </div>
                  <div>
                    <h3 class="font-semibold text-gray-800">{categoria.nombre}</h3>
                    <p class="text-xs text-gray-500">Orden: {categoria.orden}</p>
                  </div>
                </div>
                <span class={`px-2 py-1 text-xs rounded-full ${
                  categoria.activo ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                }`}>
                  {categoria.activo ? 'Activo' : 'Inactivo'}
                </span>
              </div>
              
              {#if categoria.descripcion}
                <p class="text-sm text-gray-600 mb-3 line-clamp-2">{categoria.descripcion}</p>
              {/if}
              
              <div class="flex items-center justify-between pt-3 border-t border-gray-100">
                <span class="text-xs text-gray-500">slug: {categoria.slug}</span>
                <div class="flex gap-2">
                  <button
                    on:click={() => abrirFormularioEditar(categoria)}
                    class="p-1 text-blue-600 hover:bg-blue-50 rounded"
                    title="Editar"
                  >
                    <Edit class="w-4 h-4" />
                  </button>
                  <button
                    on:click={() => eliminarCategoria(categoria)}
                    class="p-1 text-red-600 hover:bg-red-50 rounded"
                    title="Eliminar"
                  >
                    <Trash2 class="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          {/each}
        </div>
      {/if}
    </div>
  {/if}
</div>