<!-- src/routes/(admin)/pedidos/+page.svelte -->
<script>
  import { onMount } from 'svelte';
  
  let pedidos = [];
  let loading = true;
  let error = '';
  let success = '';
  
  // Filtros
  let filterEstado = '';
  let searchTerm = '';
  
  // Pedido seleccionado para ver detalles
  let selectedPedido = null;
  let showDetailsModal = false;
  
  const estados = [
    { value: 'pendiente', label: 'Pendiente', color: 'yellow' },
    { value: 'confirmado', label: 'Confirmado', color: 'blue' },
    { value: 'enviado', label: 'Enviado', color: 'purple' },
    { value: 'entregado', label: 'Entregado', color: 'green' },
    { value: 'cancelado', label: 'Cancelado', color: 'red' }
  ];
  
  onMount(async () => {
    await loadPedidos();
  });
  
  async function loadPedidos() {
    try {
      loading = true;
    const res = await fetch('/api/pedidos');
     error = ''; // Limpiar errores previos
    const result = await res.json();
      pedidos = result.success ? result.data : [];
      if (res.ok) {
        pedidos = await res.json();
      }
    } catch (err) {
      error = 'Error al cargar los pedidos';
      console.error(err);
    } finally {
      loading = false;
    }
  }
  
  async function cambiarEstado(pedidoId, nuevoEstado) {
    try {
      const res = await fetch('api/pedidos', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: pedidoId, estado: nuevoEstado })
      });
      
      if (!res.ok) throw new Error('Error al actualizar estado');
      
      await loadPedidos();
      success = 'Estado actualizado correctamente';
      setTimeout(() => success = '', 3000);
      
      // Actualizar el pedido seleccionado si está abierto
      if (selectedPedido && selectedPedido.id === pedidoId) {
        selectedPedido.estado = nuevoEstado;
      }
      
    } catch (err) {
      error = err.message;
      setTimeout(() => error = '', 3000);
    }
  }
  
  function verDetalles(pedido) {
    selectedPedido = pedido;
    showDetailsModal = true;
  }
  
  function formatCurrency(amount) {
    return new Intl.NumberFormat('es-MX', {
      style: 'currency',
      currency: 'MXN'
    }).format(amount);
  }
  
  function formatDate(date) {
    return new Date(date).toLocaleDateString('es-MX', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }
  
  function getEstadoColor(estado) {
    const estadoObj = estados.find(e => e.value === estado);
    if (!estadoObj) return 'gray';
    
    const colors = {
      yellow: 'bg-yellow-100 text-yellow-800 border-yellow-200',
      blue: 'bg-blue-100 text-blue-800 border-blue-200',
      purple: 'bg-purple-100 text-purple-800 border-purple-200',
      green: 'bg-green-100 text-green-800 border-green-200',
      red: 'bg-red-100 text-red-800 border-red-200',
      gray: 'bg-gray-100 text-gray-800 border-gray-200'
    };
    
    return colors[estadoObj.color];
  }
  
  function getEstadoLabel(estado) {
    const estadoObj = estados.find(e => e.value === estado);
    return estadoObj ? estadoObj.label : estado;
  }
  
  function abrirWhatsApp(pedido) {
    const mensaje = `Hola ${pedido.cliente_nombre}, tu pedido #${pedido.id} está ${getEstadoLabel(pedido.estado).toLowerCase()}.`;
    const url = `https://wa.me/${pedido.cliente_whatsapp.replace(/\D/g, '')}?text=${encodeURIComponent(mensaje)}`;
    window.open(url, '_blank');
  }
  
  $: pedidosFiltrados = pedidos.filter(p => {
    let matches = true;
    
    if (filterEstado) {
      matches = matches && p.estado === filterEstado;
    }
    
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      matches = matches && (
        p.cliente_nombre.toLowerCase().includes(term) ||
        p.cliente_whatsapp.includes(term) ||
        p.id.toString().includes(term)
      );
    }
    
    return matches;
  });
</script>

<svelte:head>
  <title>Pedidos | Dashboard</title>
</svelte:head>

<div class="max-w-7xl mx-auto">
  <!-- Header -->
  <div class="mb-6">
    <h1 class="text-2xl md:text-3xl font-bold text-gray-900">Pedidos</h1>
    <p class="mt-1 text-sm text-gray-600">Gestiona todos los pedidos de tu tienda</p>
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

  <!-- Estadísticas rápidas -->
  <div class="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
    {#each estados as estado}
      {@const count = pedidos.filter(p => p.estado === estado.value).length}
      <button
        on:click={() => filterEstado = filterEstado === estado.value ? '' : estado.value}
        class="bg-white rounded-lg shadow-sm border-2 p-4 text-center transition-all hover:shadow-md
               {filterEstado === estado.value ? `border-${estado.color}-500` : 'border-gray-200'}"
      >
        <div class="text-2xl font-bold text-gray-900">{count}</div>
        <div class="text-xs text-gray-600 mt-1">{estado.label}</div>
      </button>
    {/each}
  </div>

  <!-- Búsqueda y filtros -->
  <div class="bg-white rounded-lg shadow-sm border border-gray-200 p-4 mb-6">
    <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
      <!-- Búsqueda -->
      <div class="md:col-span-2">
        <label for="search" class="block text-sm font-medium text-gray-700 mb-1">
          Buscar pedido
        </label>
        <div class="relative">
          <input
            id="search"
            type="text"
            bind:value={searchTerm}
            placeholder="Cliente, teléfono o #pedido..."
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
          bind:value={filterEstado}
          class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
        >
          <option value="">Todos los estados</option>
          {#each estados as estado}
            <option value={estado.value}>{estado.label}</option>
          {/each}
        </select>
      </div>
    </div>
    
    <div class="mt-4 flex items-center justify-between">
      <p class="text-sm text-gray-600">
        Mostrando {pedidosFiltrados.length} de {pedidos.length} pedidos
      </p>
      
      {#if filterEstado || searchTerm}
        <button
          on:click={() => { filterEstado = ''; searchTerm = ''; }}
          class="text-sm text-indigo-600 hover:text-indigo-700 font-medium"
        >
          Limpiar filtros
        </button>
      {/if}
    </div>
  </div>

  {#if loading}
    <div class="flex items-center justify-center py-12">
      <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
    </div>
  {:else if pedidosFiltrados.length === 0}
    <div class="bg-white rounded-lg shadow-sm border border-gray-200 p-12 text-center">
      <svg class="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4"/>
      </svg>
      <h3 class="mt-2 text-sm font-medium text-gray-900">No hay pedidos</h3>
      <p class="mt-1 text-sm text-gray-500">
        {filterEstado || searchTerm ? 'No se encontraron pedidos con los filtros aplicados' : 'Aún no has recibido pedidos'}
      </p>
    </div>
  {:else}
    <!-- Lista de pedidos - Desktop: Tabla, Mobile: Cards -->
    
    <!-- Vista Desktop (Tabla) -->
    <div class="hidden md:block bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
      <div class="overflow-x-auto">
        <table class="min-w-full divide-y divide-gray-200">
          <thead class="bg-gray-50">
            <tr>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Pedido
              </th>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Cliente
              </th>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Fecha
              </th>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Total
              </th>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Estado
              </th>
              <th class="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                Acciones
              </th>
            </tr>
          </thead>
          <tbody class="bg-white divide-y divide-gray-200">
            {#each pedidosFiltrados as pedido}
              <tr class="hover:bg-gray-50 transition-colors">
                <td class="px-6 py-4 whitespace-nowrap">
                  <div class="text-sm font-bold text-gray-900">#{pedido.id}</div>
                  <div class="text-xs text-gray-500">
                    {pedido.items?.length || 0} item{pedido.items?.length !== 1 ? 's' : ''}
                  </div>
                </td>
                <td class="px-6 py-4 whitespace-nowrap">
                  <div class="text-sm font-medium text-gray-900">{pedido.cliente_nombre}</div>
                  <div class="text-sm text-gray-500">{pedido.cliente_whatsapp}</div>
                </td>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {new Date(pedido.created_at).toLocaleDateString('es-MX')}
                </td>
                <td class="px-6 py-4 whitespace-nowrap">
                  <div class="text-sm font-bold text-gray-900">{formatCurrency(pedido.total)}</div>
                </td>
                <td class="px-6 py-4 whitespace-nowrap">
                  <select
                    value={pedido.estado}
                    on:change={(e) => cambiarEstado(pedido.id, e.target.value)}
                    class="text-xs font-semibold rounded-full px-3 py-1 border {getEstadoColor(pedido.estado)} cursor-pointer focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  >
                    {#each estados as estado}
                      <option value={estado.value}>{estado.label}</option>
                    {/each}
                  </select>
                </td>
                <td class="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                  <div class="flex items-center justify-end gap-2">
                    <button
                      on:click={() => verDetalles(pedido)}
                      class="text-indigo-600 hover:text-indigo-900"
                      title="Ver detalles"
                    >
                      <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/>
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"/>
                      </svg>
                    </button>
                    <button
                      on:click={() => abrirWhatsApp(pedido)}
                      class="text-green-600 hover:text-green-900"
                      title="Enviar WhatsApp"
                    >
                      <svg class="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.890-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z"/>
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

    <!-- Vista Mobile (Cards) -->
    <div class="md:hidden space-y-4">
      {#each pedidosFiltrados as pedido}
        <div class="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
          <div class="flex items-start justify-between mb-3">
            <div>
              <div class="text-lg font-bold text-gray-900">Pedido #{pedido.id}</div>
              <div class="text-sm text-gray-500">{new Date(pedido.created_at).toLocaleDateString('es-MX')}</div>
            </div>
            <select
              value={pedido.estado}
              on:change={(e) => cambiarEstado(pedido.id, e.target.value)}
              class="text-xs font-semibold rounded-full px-3 py-1 border {getEstadoColor(pedido.estado)} cursor-pointer"
            >
              {#each estados as estado}
                <option value={estado.value}>{estado.label}</option>
              {/each}
            </select>
          </div>
          
          <div class="space-y-2 mb-3">
            <div class="flex items-center text-sm">
              <svg class="w-4 h-4 mr-2 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"/>
              </svg>
              <span class="font-medium text-gray-900">{pedido.cliente_nombre}</span>
            </div>
            <div class="flex items-center text-sm text-gray-600">
              <svg class="w-4 h-4 mr-2 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"/>
              </svg>
              {pedido.cliente_whatsapp}
            </div>
            <div class="flex items-center text-sm text-gray-600">
              <svg class="w-4 h-4 mr-2 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"/>
              </svg>
              {pedido.items?.length || 0} producto{pedido.items?.length !== 1 ? 's' : ''}
            </div>
          </div>
          
          <div class="flex items-center justify-between pt-3 border-t border-gray-200">
            <div class="text-lg font-bold text-gray-900">{formatCurrency(pedido.total)}</div>
            <div class="flex gap-2">
              <button
                on:click={() => verDetalles(pedido)}
                class="p-2 text-indigo-600 bg-indigo-50 rounded-lg hover:bg-indigo-100"
              >
                <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/>
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"/>
                </svg>
              </button>
              <button
                on:click={() => abrirWhatsApp(pedido)}
                class="p-2 text-green-600 bg-green-50 rounded-lg hover:bg-green-100"
              >
                <svg class="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.890-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z"/>
                </svg>
              </button>
            </div>
          </div>
        </div>
      {/each}
    </div>
  {/if}
</div>

<!-- Modal de detalles del pedido -->
{#if showDetailsModal && selectedPedido}
  <div class="fixed inset-0 z-50 overflow-y-auto">
    <div class="flex items-center justify-center min-h-screen px-4 py-4">
      <!-- Backdrop -->
      <div 
        class="fixed inset-0 transition-opacity bg-gray-500 bg-opacity-75"
        on:click={() => showDetailsModal = false}
      ></div>

      <!-- Modal -->
      <div class="relative bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        <!-- Header -->
        <div class="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
          <div>
            <h3 class="text-lg font-semibold text-gray-900">
              Pedido #{selectedPedido.id}
            </h3>
            <p class="text-sm text-gray-500 mt-1">
              {formatDate(selectedPedido.created_at)}
            </p>
          </div>
          <button
            on:click={() => showDetailsModal = false}
            class="text-gray-400 hover:text-gray-600"
          >
            <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/>
            </svg>
          </button>
        </div>

        <!-- Content -->
        <div class="flex-1 overflow-y-auto px-6 py-4">
          <!-- Cliente -->
          <div class="mb-6">
            <h4 class="text-sm font-semibold text-gray-900 mb-3">Información del Cliente</h4>
            <div class="bg-gray-50 rounded-lg p-4 space-y-2">
              <div class="flex items-center text-sm">
                <svg class="w-4 h-4 mr-2 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"/>
                </svg>
                <span class="font-medium text-gray-900">{selectedPedido.cliente_nombre}</span>
              </div>
              <div class="flex items-center text-sm">
                <svg class="w-4 h-4 mr-2 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"/>
                </svg>
                <span class="text-gray-700">{selectedPedido.cliente_whatsapp}</span>
              </div>
              {#if selectedPedido.cliente_email}
                <div class="flex items-center text-sm">
                  <svg class="w-4 h-4 mr-2 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"/>
                  </svg>
                  <span class="text-gray-700">{selectedPedido.cliente_email}</span>
                </div>
              {/if}
              {#if selectedPedido.direccion_envio}
                <div class="flex items-start text-sm">
                  <svg class="w-4 h-4 mr-2 mt-0.5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"/>
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"/>
                  </svg>
                  <span class="text-gray-700">{selectedPedido.direccion_envio}</span>
                </div>
              {/if}
            </div>
          </div>

          <!-- Productos -->
          <div class="mb-6">
            <h4 class="text-sm font-semibold text-gray-900 mb-3">Productos</h4>
            <div class="space-y-3">
              {#if selectedPedido.items && selectedPedido.items.length > 0}
                {#each selectedPedido.items as item}
                  <div class="flex items-center justify-between bg-gray-50 rounded-lg p-3">
                    <div class="flex items-center flex-1 min-w-0">
                      <div class="w-12 h-12 flex-shrink-0 bg-gray-200 rounded-lg overflow-hidden">
                        <img 
                          src={item.imagen_url || 'https://via.placeholder.com/150?text=Sin+Imagen'}
                          alt={item.nombre}
                          class="w-full h-full object-cover"
                          on:error={(e) => e.target.src = 'https://via.placeholder.com/150?text=Error'}
                        />
                      </div>
                      <div class="ml-3 flex-1 min-w-0">
                        <p class="text-sm font-medium text-gray-900 truncate">{item.nombre}</p>
                        <p class="text-sm text-gray-500">
                          {formatCurrency(item.precio_unitario)} × {item.cantidad}
                        </p>
                      </div>
                    </div>
                    <div class="text-sm font-semibold text-gray-900 ml-4">
                      {formatCurrency(item.subtotal)}
                    </div>
                  </div>
                {/each}
              {:else}
                <p class="text-sm text-gray-500 text-center py-4">No hay productos en este pedido</p>
              {/if}
            </div>
          </div>

          <!-- Notas -->
          {#if selectedPedido.notas}
            <div class="mb-6">
              <h4 class="text-sm font-semibold text-gray-900 mb-3">Notas del pedido</h4>
              <div class="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                <p class="text-sm text-gray-700">{selectedPedido.notas}</p>
              </div>
            </div>
          {/if}

          <!-- Total -->
          <div class="border-t border-gray-200 pt-4">
            <div class="flex items-center justify-between mb-2">
              <span class="text-sm text-gray-600">Subtotal</span>
              <span class="text-sm font-medium text-gray-900">{formatCurrency(selectedPedido.total)}</span>
            </div>
            <div class="flex items-center justify-between pt-2 border-t border-gray-200">
              <span class="text-base font-semibold text-gray-900">Total</span>
              <span class="text-lg font-bold text-gray-900">{formatCurrency(selectedPedido.total)}</span>
            </div>
          </div>
        </div>

        <!-- Footer con acciones -->
        <div class="px-6 py-4 border-t border-gray-200 bg-gray-50 flex flex-col sm:flex-row gap-3">
          <button
            on:click={() => abrirWhatsApp(selectedPedido)}
            class="flex-1 inline-flex items-center justify-center px-4 py-2 bg-green-600 text-white font-medium rounded-lg hover:bg-green-700 transition-colors"
          >
            <svg class="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 24 24">
              <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.890-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z"/>
            </svg>
            Enviar WhatsApp
          </button>
          <button
            on:click={() => showDetailsModal = false}
            class="px-6 py-2 bg-white text-gray-700 font-medium rounded-lg border border-gray-300 hover:bg-gray-50 transition-colors"
          >
            Cerrar
          </button>
        </div>
      </div>
    </div>
  </div>
{/if}