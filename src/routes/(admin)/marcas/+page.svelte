<!-- src/routes/(admin)/marcas/+page.svelte -->
<script>
  import { onMount } from 'svelte';
  import { Tag, Plus, Edit, Trash2, CheckCircle2, X, Package } from 'lucide-svelte';
  import MarcaForm from '$lib/components/forms/MarcaForm.svelte';
  
  let marcas = [];
  let loading = true;
  let mostrarFormulario = false;
  let marcaEditando = null;
  let mensaje = { tipo: '', texto: '', visible: false };
  
  // Filtros
  let searchTerm = '';
  let filterActivo = '';
  
  onMount(async () => {
    await cargarMarcas();
  });
  
  async function cargarMarcas() {
    loading = true;
    try {
      const response = await fetch('/api/marcas');
      const result = await response.json();
      if (result.success) {
        marcas = result.data;
      }
    } catch (error) {
      console.error('Error cargando marcas:', error);
      mostrarMensaje('error', 'Error al cargar las marcas');
    } finally {
      loading = false;
    }
  }
  
  function abrirFormularioCrear() {
    marcaEditando = null;
    mostrarFormulario = true;
  }
  
  function abrirFormularioEditar(marca) {
    marcaEditando = marca;
    mostrarFormulario = true;
  }
  
  function cerrarFormulario() {
    mostrarFormulario = false;
    marcaEditando = null;
  }
  
  async function handleSuccess() {
    await cargarMarcas();
    cerrarFormulario();
    mostrarMensaje('success', marcaEditando ? 'Marca actualizada' : 'Marca creada');
  }
  
  async function eliminarMarca(marca) {
    if (!confirm(`¿Eliminar "${marca.nombre}"?\n\nSi hay productos usando esta marca, no se podrá eliminar.`)) return;
    
    try {
      const response = await fetch(`/api/marcas?id=${marca.id}`, {
        method: 'DELETE'
      });
      
      const result = await response.json();
      
      if (!result.success) {
        throw new Error(result.error);
      }
      
      await cargarMarcas();
      mostrarMensaje('success', 'Marca eliminada');
      
    } catch (error) {
      mostrarMensaje('error', error.message);
    }
  }
  
  function mostrarMensaje(tipo, texto) {
    mensaje = { tipo, texto, visible: true };
    setTimeout(() => { mensaje.visible = false; }, 5000);
  }
  
  // Filtrar marcas
  $: marcasFiltradas = marcas.filter(m => {
    let matches = true;
    
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      matches = matches && (
        m.nombre.toLowerCase().includes(term) ||
        (m.descripcion || '').toLowerCase().includes(term)
      );
    }
    
    if (filterActivo !== '') {
      matches = matches && m.activo === (filterActivo === 'true');
    }
    
    return matches;
  });
</script>

<svelte:head>
  <title>Marcas | Dashboard</title>
</svelte:head>

<div class="max-w-7xl mx-auto space-y-6">
  <!-- Mensaje -->
  {#if mensaje.visible}
    <div class="fixed top-20 right-4 z-50 animate-slide-in">
      <div class={`rounded-lg shadow-lg p-4 flex items-center gap-3 ${
        mensaje.tipo === 'success' ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'
      }`}>
        {#if mensaje.tipo === 'success'}
          <CheckCircle2 class="w-5 h-5 text-green-600" />
        {:else}
          <X class="w-5 h-5 text-red-600" />
        {/if}
        <span class={mensaje.tipo === 'success' ? 'text-green-700' : 'text-red-700'}>
          {mensaje.texto}
        </span>
        <button on:click={() => mensaje.visible = false}>
          <X class="w-4 h-4" />
        </button>
      </div>
    </div>
  {/if}
  
  <!-- Header -->
  <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
    <div>
      <h1 class="text-2xl font-bold text-gray-800">Gestión de Marcas</h1>
      <p class="text-gray-600">Administra las marcas de productos</p>
    </div>
    {#if !mostrarFormulario}
      <button on:click={abrirFormularioCrear} class="btn-primary flex items-center gap-2">
        <Plus class="w-5 h-5" />
        Nueva Marca
      </button>
    {/if}
  </div>
  
  <!-- Formulario -->
  {#if mostrarFormulario}
    <div class="bg-gray-50 rounded-xl p-6 border-2 border-primary-200">
      <div class="flex justify-between items-center mb-4">
        <h2 class="text-xl font-bold text-gray-800">
          {marcaEditando ? 'Editar' : 'Crear'} Marca
        </h2>
        <button on:click={cerrarFormulario} class="p-2 hover:bg-gray-200 rounded-lg">
          <X class="w-5 h-5" />
        </button>
      </div>
      
      <MarcaForm
        marca={marcaEditando}
        on:success={handleSuccess}
        on:cancel={cerrarFormulario}
      />
    </div>
  {:else}
    <!-- Filtros y búsqueda -->
    <div class="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
      <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
        <!-- Búsqueda -->
        <div>
          <label for="search" class="block text-sm font-medium text-gray-700 mb-1">
            Buscar
          </label>
          <div class="relative">
            <input
              id="search"
              type="text"
              bind:value={searchTerm}
              placeholder="Nombre o descripción..."
              class="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            />
            <svg class="absolute left-3 top-2.5 w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/>
            </svg>
          </div>
        </div>
        
        <!-- Estado -->
        <div>
          <label for="estado" class="block text-sm font-medium text-gray-700 mb-1">
            Estado
          </label>
          <select
            id="estado"
            bind:value={filterActivo}
            class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
          >
            <option value="">Todos</option>
            <option value="true">Activos</option>
            <option value="false">Inactivos</option>
          </select>
        </div>
      </div>
      
      <div class="mt-4 flex items-center justify-between">
        <p class="text-sm text-gray-600">
          {marcasFiltradas.length} marca{marcasFiltradas.length !== 1 ? 's' : ''}
        </p>
        
        {#if searchTerm || filterActivo}
          <button
            on:click={() => { searchTerm = ''; filterActivo = ''; }}
            class="text-sm text-indigo-600 hover:text-indigo-700 font-medium"
          >
            Limpiar filtros
          </button>
        {/if}
      </div>
    </div>
    
    <!-- Lista de marcas -->
    <div class="bg-white rounded-xl shadow-sm p-6">
      {#if loading}
        <div class="text-center py-12">
          <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto"></div>
          <p class="mt-4 text-gray-600">Cargando marcas...</p>
        </div>
      {:else if marcasFiltradas.length === 0}
        <div class="text-center py-12">
          <Tag class="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h3 class="text-lg font-semibold text-gray-700 mb-2">
            {marcas.length === 0 ? 'No hay marcas' : 'No se encontraron marcas'}
          </h3>
          <p class="text-gray-500 mb-6">
            {marcas.length === 0 
              ? 'Crea tu primera marca para asociarla a productos' 
              : 'No se encontraron marcas con los filtros aplicados'}
          </p>
          {#if marcas.length === 0}
            <button on:click={abrirFormularioCrear} class="btn-primary">
              Crear primera marca
            </button>
          {/if}
        </div>
      {:else}
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {#each marcasFiltradas as marca}
            <div class="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
              <div class="flex items-start justify-between mb-3">
                <div class="flex items-center gap-3 flex-1 min-w-0">
                  <!-- Logo -->
                  <div class="w-12 h-12 flex-shrink-0 bg-gray-100 rounded-lg overflow-hidden">
                    {#if marca.logo_url}
                      <img 
                        src={marca.logo_url} 
                        alt={marca.nombre}
                        class="w-full h-full object-cover"
                        on:error={(e) => e.target.style.display = 'none'}
                      />
                    {:else}
                      <div class="w-full h-full flex items-center justify-center">
                        <Package class="w-6 h-6 text-gray-400" />
                      </div>
                    {/if}
                  </div>
                  
                  <div class="flex-1 min-w-0">
                    <h3 class="font-semibold text-gray-800 truncate">{marca.nombre}</h3>
                    <span class={`text-xs px-2 py-0.5 rounded-full inline-block mt-1 ${
                      marca.activo ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                    }`}>
                      {marca.activo ? 'Activo' : 'Inactivo'}
                    </span>
                  </div>
                </div>
              </div>
              
              {#if marca.descripcion}
                <p class="text-sm text-gray-600 mb-3 line-clamp-2">{marca.descripcion}</p>
              {/if}
              
              <div class="flex items-center justify-end gap-2 pt-3 border-t border-gray-100">
                <button
                  on:click={() => abrirFormularioEditar(marca)}
                  class="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                  title="Editar"
                >
                  <Edit class="w-4 h-4" />
                </button>
                <button
                  on:click={() => eliminarMarca(marca)}
                  class="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                  title="Eliminar"
                >
                  <Trash2 class="w-4 h-4" />
                </button>
              </div>
            </div>
          {/each}
        </div>
      {/if}
    </div>
  {/if}
</div>

<style>
  @keyframes slide-in {
    from {
      transform: translateX(100%);
      opacity: 0;
    }
    to {
      transform: translateX(0);
      opacity: 1;
    }
  }
  
  .animate-slide-in {
    animation: slide-in 0.3s ease-out;
  }
</style>