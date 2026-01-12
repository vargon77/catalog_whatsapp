<!-- src/routes/(admin)/productos/+page.svelte -->

<script>
  import { onMount } from 'svelte';
  import { goto } from '$app/navigation';
  
  let productos = [];
  let categorias = [];
  let loading = true;
  let error = '';
  let success = '';
  
  // Filtros
  let searchTerm = '';
  let filterCategoria = '';
  let filterDestacado = '';
  let filterActivo = '';
  
  // Vista (grid o table)
  let viewMode = 'table'; // 'table' o 'grid'
  
  // Producto a eliminar
  let productoToDelete = null;
  let showDeleteModal = false;
  
  onMount(async () => {
    await loadData();
  });
  
  async function loadData() {
    try {
      loading = true;
      error = ''; // Limpiar errores previos
      
      // ✅ CORRECCIÓN: Rutas API con slash inicial
      const [resProductos, resCategorias] = await Promise.all([
        fetch('/api/productos'),
        fetch('/api/categorias')
      ]);
      
      if (resProductos.ok) {
        const data = await resProductos.json();
        productos = Array.isArray(data) ? data : [];
      } else {
        throw new Error('Error al cargar productos');
      }
      
      if (resCategorias.ok) {
        const result = await resCategorias.json();
        categorias = result.success ? result.data : [];
      } else {
        throw new Error('Error al cargar categorías');
      }
      
    } catch (err) {
      error = 'Error al cargar los datos: ' + err.message;
      console.error(err);
      productos = [];
      categorias = [];
    } finally {
      loading = false;
    }
  }
  
  async function toggleActivo(producto) {
    try {
      const res = await fetch('/api/productos', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: producto.id,
          activo: !producto.activo
        })
      });
      
      if (!res.ok) throw new Error('Error al actualizar');
      
      await loadData();
      success = 'Producto actualizado correctamente';
      setTimeout(() => success = '', 3000);
      
    } catch (err) {
      error = err.message;
      setTimeout(() => error = '', 3000);
    }
  }
  
  async function deleteProducto() {
    if (!productoToDelete) return;
    
    try {
      const res = await fetch(`/api/productos?id=${productoToDelete.id}`, {
        method: 'DELETE'
      });
      
      if (!res.ok) throw new Error('Error al eliminar');
      
      await loadData();
      success = 'Producto eliminado correctamente';
      setTimeout(() => success = '', 3000);
      
    } catch (err) {
      error = err.message;
      setTimeout(() => error = '', 3000);
    } finally {
      showDeleteModal = false;
      productoToDelete = null;
    }
  }
  
  function confirmDelete(producto) {
    productoToDelete = producto;
    showDeleteModal = true;
  }
  
  function formatCurrency(amount) {
    return new Intl.NumberFormat('es-MX', {
      style: 'currency',
      currency: 'MXN'
    }).format(amount);
  }
  
  $: productosFiltrados = productos.filter(p => {
    let matches = true;
    
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      matches = matches && (
        p.nombre.toLowerCase().includes(term) ||
        p.descripcion?.toLowerCase().includes(term) ||
        p.sku?.toLowerCase().includes(term)
      );
    }
    
    if (filterCategoria) {
      matches = matches && p.categoria_id === parseInt(filterCategoria);
    }
    
    if (filterDestacado !== '') {
      matches = matches && p.destacado === (filterDestacado === 'true');
    }
    
    if (filterActivo !== '') {
      matches = matches && p.activo === (filterActivo === 'true');
    }
    
    return matches;
  });
</script>

<svelte:head>
  <title>Productos | Dashboard</title>
</svelte:head>

<div class="max-w-7xl mx-auto">
  <!-- Header -->
  <div class="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
    <div>
      <h1 class="text-2xl md:text-3xl font-bold text-gray-900">Productos</h1>
      <p class="mt-1 text-sm text-gray-600">Gestiona tu catálogo de productos</p>
    </div>
    
    <a
      href="/productos/nuevo"
      class="inline-flex items-center justify-center px-4 py-2 bg-indigo-600 text-white font-medium rounded-lg hover:bg-indigo-700 transition-colors"
    >
      <svg class="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"/>
      </svg>
      Nuevo Producto
    </a>
  </div>

  <!-- Mensajes -->
  {#if error}
    <div class="mb-4 bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded-lg">
      {error}
    </div>
  {/if}
  
  {#if success}
    <div class="mb-4 bg-green-50 border border-green-200 text-green-800 px-4 py-3 rounded-lg">
      {success}
    </div>
  {/if}

  <!-- Filtros y búsqueda -->
  <div class="bg-white rounded-lg shadow-sm border border-gray-200 p-4 mb-6">
    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      <!-- Búsqueda -->
      <div class="md:col-span-2">
        <label for="search" class="block text-sm font-medium text-gray-700 mb-1">
          Buscar
        </label>
        <div class="relative">
          <input
            id="search"
            type="text"
            bind:value={searchTerm}
            placeholder="Nombre, descripción o SKU..."
            class="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
          />
          <svg class="absolute left-3 top-2.5 w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/>
          </svg>
        </div>
      </div>
      
      <!-- Categoría -->
      <div>
        <label for="categoria" class="block text-sm font-medium text-gray-700 mb-1">
          Categoría
        </label>
        <select
          id="categoria"
          bind:value={filterCategoria}
          class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
        >
          <option value="">Todas</option>
          {#each categorias as cat}
            <option value={cat.id}>{cat.nombre}</option>
          {/each}
        </select>
      </div>
      
      <!-- Estado -->
      <div>
        <label for="activo" class="block text-sm font-medium text-gray-700 mb-1">
          Estado
        </label>
        <select
          id="activo"
          bind:value={filterActivo}
          class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
        >
          <option value="">Todos</option>
          <option value="true">Activos</option>
          <option value="false">Inactivos</option>
        </select>
      </div>
    </div>
    
    <!-- Botones de vista y acciones -->
    <div class="mt-4 flex items-center justify-between">
      <div class="flex gap-2">
        <button
          on:click={() => viewMode = 'table'}
          class="p-2 rounded-lg transition-colors {viewMode === 'table' ? 'bg-indigo-100 text-indigo-600' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}"
          title="Vista de tabla"
        >
          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 10h16M4 14h16M4 18h16"/>
          </svg>
        </button>
        
        <button
          on:click={() => viewMode = 'grid'}
          class="p-2 rounded-lg transition-colors {viewMode === 'grid' ? 'bg-indigo-100 text-indigo-600' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}"
          title="Vista de cuadrícula"
        >
          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z"/>
          </svg>
        </button>
      </div>
      
      <p class="text-sm text-gray-600">
        {productosFiltrados.length} producto{productosFiltrados.length !== 1 ? 's' : ''}
      </p>
    </div>
  </div>

  {#if loading}
    <div class="flex items-center justify-center py-12">
      <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
    </div>
  {:else if productosFiltrados.length === 0}
    <div class="bg-white rounded-lg shadow-sm border border-gray-200 p-12 text-center">
      <svg class="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4"/>
      </svg>
      <h3 class="mt-2 text-sm font-medium text-gray-900">No hay productos</h3>
      <p class="mt-1 text-sm text-gray-500">
        {productos.length === 0 ? 'Comienza creando tu primer producto' : 'No se encontraron productos con los filtros aplicados'}
      </p>
      <div class="mt-6">
        <a
          href="/productos/nuevo"
          class="inline-flex items-center px-4 py-2 bg-indigo-600 text-white font-medium rounded-lg hover:bg-indigo-700"
        >
          <svg class="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"/>
          </svg>
          Nuevo Producto
        </a>
      </div>
    </div>
  {:else if viewMode === 'table'}
    <!-- Vista de tabla -->
    <div class="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
      <div class="overflow-x-auto">
        <table class="min-w-full divide-y divide-gray-200">
          <thead class="bg-gray-50">
            <tr>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Producto
              </th>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider hidden md:table-cell">
                Categoría
              </th>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Precio
              </th>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider hidden lg:table-cell">
                Stock
              </th>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider hidden sm:table-cell">
                Estado
              </th>
              <th class="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                Acciones
              </th>
            </tr>
          </thead>
          <tbody class="bg-white divide-y divide-gray-200">
            {#each productosFiltrados as producto}
              <tr class="hover:bg-gray-50 transition-colors">
                <td class="px-6 py-4">
                  <div class="flex items-center">
                    <div class="h-10 w-10 flex-shrink-0">
                      <img 
                        class="h-10 w-10 rounded-lg object-cover"
                        src={producto.imagen_url || 'https://via.placeholder.com/150?text=Sin+Imagen'}
                        alt={producto.nombre}
                        on:error={(e) => e.target.src = 'https://via.placeholder.com/150?text=Error'}
                      />
                    </div>
                    <div class="ml-4">
                      <div class="text-sm font-medium text-gray-900">{producto.nombre}</div>
                      {#if producto.sku}
                        <div class="text-sm text-gray-500">SKU: {producto.sku}</div>
                      {/if}
                    </div>
                  </div>
                </td>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500 hidden md:table-cell">
                  {producto.categoria?.nombre || 'Sin categoría'}
                </td>
                <td class="px-6 py-4 whitespace-nowrap">
                  <div class="text-sm font-semibold text-gray-900">{formatCurrency(producto.precio)}</div>
                  {#if producto.descuento}
                    <div class="text-xs text-green-600">-{producto.descuento}%</div>
                  {/if}
                </td>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500 hidden lg:table-cell">
                  {producto.stock !== null ? producto.stock : 'N/A'}
                </td>
                <td class="px-6 py-4 whitespace-nowrap hidden sm:table-cell">
                  <button
                    on:click={() => toggleActivo(producto)}
                    class="px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full {producto.activo ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}"
                  >
                    {producto.activo ? 'Activo' : 'Inactivo'}
                  </button>
                </td>
                <td class="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                  <div class="flex items-center justify-end gap-2">
                    <a
                      href="/productos/{producto.id}/editar"
                      class="text-indigo-600 hover:text-indigo-900"
                      title="Editar"
                    >
                      <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"/>
                      </svg>
                    </a>
                    <button
                      on:click={() => confirmDelete(producto)}
                      class="text-red-600 hover:text-red-900"
                      title="Eliminar"
                    >
                      <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/>
                      </svg>
                    </button>
                  </div>
                </td>
              </tr>
            {/each}
          </tbody>
        </table>
      </div>
    </div>
  {:else}
    <!-- Vista de cuadrícula -->
    <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 md:gap-6">
      {#each productosFiltrados as producto}
        <div class="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden hover:shadow-md transition-shadow">
          <div class="aspect-square relative overflow-hidden bg-gray-100">
            <img 
              src={producto.imagen_url || 'https://via.placeholder.com/300?text=Sin+Imagen'}
              alt={producto.nombre}
              class="w-full h-full object-cover"
              on:error={(e) => e.target.src = 'https://via.placeholder.com/300?text=Error'}
            />
            {#if producto.destacado}
              <span class="absolute top-2 left-2 bg-yellow-400 text-yellow-900 px-2 py-1 rounded-full text-xs font-semibold">
                ⭐ Destacado
              </span>
            {/if}
            {#if !producto.activo}
              <span class="absolute top-2 right-2 bg-gray-800 text-white px-2 py-1 rounded-full text-xs font-semibold">
                Inactivo
              </span>
            {/if}
          </div>
          
          <div class="p-4">
            <div class="mb-2">
              <span class="text-xs text-gray-500">{producto.categoria?.nombre || 'Sin categoría'}</span>
            </div>
            
            <h3 class="font-semibold text-gray-900 mb-2 line-clamp-2">{producto.nombre}</h3>
            
            <div class="flex items-baseline gap-2 mb-3">
              <span class="text-lg font-bold text-gray-900">{formatCurrency(producto.precio)}</span>
              {#if producto.descuento}
                <span class="text-sm text-green-600 font-medium">-{producto.descuento}%</span>
              {/if}
            </div>
            
            {#if producto.stock !== null}
              <div class="text-sm text-gray-600 mb-3">
                Stock: <span class="font-medium">{producto.stock}</span>
              </div>
            {/if}
            
            <div class="flex gap-2 pt-3 border-t border-gray-200">
              <a
                href="/productos/{producto.id}/editar"
                class="flex-1 px-3 py-2 text-sm font-medium text-indigo-600 bg-indigo-50 rounded-lg hover:bg-indigo-100 transition-colors text-center"
              >
                Editar
              </a>
              <button
                on:click={() => confirmDelete(producto)}
                class="px-3 py-2 text-sm font-medium text-red-600 bg-red-50 rounded-lg hover:bg-red-100 transition-colors"
              >
                <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/>
                </svg>
              </button>
            </div>
          </div>
        </div>
      {/each}
    </div>
  {/if}
</div>

<!-- Modal de confirmación de eliminación -->
{#if showDeleteModal}
  <div class="fixed inset-0 z-50 overflow-y-auto">
    <div class="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:block sm:p-0">
      <!-- Backdrop -->
      <div 
        class="fixed inset-0 transition-opacity bg-gray-500 bg-opacity-75"
        on:click={() => showDeleteModal = false}
      ></div>

      <!-- Modal -->
      <div class="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
        <div class="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
          <div class="sm:flex sm:items-start">
            <div class="mx-auto flex-shrink-0 flex items-center justify-center h-12 w-12 rounded-full bg-red-100 sm:mx-0 sm:h-10 sm:w-10">
              <svg class="h-6 w-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"/>
              </svg>
            </div>
            <div class="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left">
              <h3 class="text-lg leading-6 font-medium text-gray-900">
                Eliminar Producto
              </h3>
              <div class="mt-2">
                <p class="text-sm text-gray-500">
                  ¿Estás seguro de que deseas eliminar <strong>{productoToDelete?.nombre}</strong>? 
                  Esta acción no se puede deshacer.
                </p>
              </div>
            </div>
          </div>
        </div>
        <div class="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse gap-2">
          <button
            on:click={deleteProducto}
            class="w-full inline-flex justify-center rounded-lg border border-transparent shadow-sm px-4 py-2 bg-red-600 text-base font-medium text-white hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 sm:ml-3 sm:w-auto sm:text-sm"
          >
            Eliminar
          </button>
          <button
            on:click={() => showDeleteModal = false}
            class="mt-3 w-full inline-flex justify-center rounded-lg border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:mt-0 sm:w-auto sm:text-sm"
          >
            Cancelar
          </button>
        </div>
      </div>
    </div>
  </div>
{/if}