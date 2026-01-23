<!-- src/routes/(admin)/pedidos/+page.svelte -->
<!-- ✅ VERSIÓN CORREGIDA -->
<script>
  import { onMount } from 'svelte';
  import { Bell, Search, Eye, MessageCircle, CheckCircle, XCircle, Edit } from 'lucide-svelte';
  import { ESTADOS, CONFIG_ESTADOS, obtenerColorEstado } from '$lib/pedidos/estadosCliente';
  import ModalValidarPago from '$lib/components/pedidos/ModalValidarPago.svelte';
  import ModalCancelar from '$lib/components/pedidos/ModalCancelar.svelte';
  import ModalEnviar from '$lib/components/pedidos/ModalEnviar.svelte';
  import ModalDetalles from '$lib/components/pedidos/ModalDetalles.svelte';
  import ModalEditarPedido from '$lib/components/pedidos/ModalEditarPedido.svelte';
  import BadgePendientes from '$lib/components/pedidos/BadgePendientes.svelte';
  
  let pedidos = [];
  let loading = true;
  let error = '';
  let success = '';
  let pendientesValidacion = 0;
  
  // Filtros
  let filterEstado = '';
  let searchTerm = '';
  let mostrarSoloPendientes = false;
  
  // Modales
  let modalValidarPago = { open: false, pedido: null };
  let modalCancelar = { open: false, pedido: null };
  let modalEnviar = { open: false, pedido: null };
  let modalDetalles = { open: false, pedido: null };
  let modalEditar = { open: false, pedido: null };
  
  // ✅ MEJORADO: Estados para UI
  const estados = Object.keys(ESTADOS).map(key => ({
    value: ESTADOS[key],
    ...CONFIG_ESTADOS[ESTADOS[key]]
  }));
  
  onMount(async () => {
    await loadPedidos();
  });
  
  // ✅ MEJORADO: Función de carga con mejor manejo de errores
  async function loadPedidos() {
    loading = true;
    error = '';
    
    try {
      const params = new URLSearchParams();
      
      if (filterEstado) params.append('estado', filterEstado);
      if (searchTerm) params.append('busqueda', searchTerm);
      if (mostrarSoloPendientes) params.append('validacion_pendiente', 'true');
      
      const res = await fetch(`/api/pedidos?${params.toString()}`);
      
      if (!res.ok) {
        throw new Error(`Error HTTP: ${res.status}`);
      }
      
      const result = await res.json();
      
      if (!result.success) {
        throw new Error(result.error || 'Error al cargar pedidos');
      }
      
      pedidos = result.data || [];
      pendientesValidacion = result.metadata?.pendientesValidacion || 0;
      
      console.log(`✅ Cargados ${pedidos.length} pedidos`);
      
    } catch (err) {
      console.error('❌ Error cargando pedidos:', err);
      error = err.message || 'Error al cargar los pedidos';
      pedidos = [];
    } finally {
      loading = false;
    }
  }
  
  // ✅ CRÍTICO: Función de cambio de estado corregida
  function handleCambioEstado(event) {
    console.log('🔄 Estado cambiado:', event.detail);
    
    // Mostrar mensaje de éxito
    success = '✅ Estado actualizado correctamente';
    setTimeout(() => success = '', 3000);
    
    // Recargar pedidos
    loadPedidos();
    
    // Cerrar modal de detalles
    modalDetalles.open = false;
  }
  
  function abrirModalValidarPago(pedido) {
    modalValidarPago = { open: true, pedido };
  }
  
  function abrirModalCancelar(pedido) {
    modalCancelar = { open: true, pedido };
  }
  
  function abrirModalEnviar(pedido) {
    modalEnviar = { open: true, pedido };
  }
  
  function abrirModalEditar(pedido) {
    modalEditar = { open: true, pedido };
  }
  
  function verDetalles(pedido) {
    modalDetalles = { open: true, pedido };
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
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  function abrirWhatsApp(pedido) {
    const config = CONFIG_ESTADOS[pedido.estado];
    const mensaje = `Hola ${pedido.cliente_nombre}, tu pedido #${pedido.numero_pedido} está *${config.label}*. ${config.descripcion}`;
    const url = `https://wa.me/${pedido.cliente_whatsapp.replace(/\D/g, '')}?text=${encodeURIComponent(mensaje)}`;
    window.open(url, '_blank');
  }
  
  // ✅ MEJORADO: Filtrado reactivo
  $: pedidosFiltrados = pedidos.filter(p => {
    // Validar que el pedido tenga un estado válido
    if (!p.estado || !CONFIG_ESTADOS[p.estado]) {
      console.warn(`⚠️ Pedido ${p.id} tiene estado inválido: "${p.estado}"`);
      return false;
    }
    return true;
  });
</script>

<svelte:head>
  <title>Gestión de Pedidos | Dashboard</title>
</svelte:head>

<div class="max-w-7xl mx-auto">
  <!-- Header con badge de pendientes -->
  <div class="mb-6 flex items-center justify-between">
    <div>
      <h1 class="text-3xl font-bold text-gray-900">Gestión de Pedidos</h1>
      <p class="mt-1 text-sm text-gray-600">Administra y da seguimiento a todos los pedidos</p>
    </div>
    
    <BadgePendientes 
      count={pendientesValidacion} 
      on:click={() => {
        mostrarSoloPendientes = !mostrarSoloPendientes;
        loadPedidos();
      }} 
    />
  </div>

  <!-- Mensajes -->
  {#if error}
    <div class="mb-4 bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded-lg flex items-center gap-2">
      <XCircle class="w-5 h-5" />
      {error}
    </div>
  {/if}
  
  {#if success}
    <div class="mb-4 bg-green-50 border border-green-200 text-green-800 px-4 py-3 rounded-lg flex items-center gap-2">
      <CheckCircle class="w-5 h-5" />
      {success}
    </div>
  {/if}

  <!-- Estadísticas por estado -->
  <div class="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-3 mb-6">
    {#each estados as estado}
      {@const count = pedidos.filter(p => p.estado === estado.value).length}
      {@const colores = obtenerColorEstado(estado.value)}
      <button
        on:click={() => {
          filterEstado = filterEstado === estado.value ? '' : estado.value;
          loadPedidos();
        }}
        class="p-3 rounded-lg border-2 transition-all hover:shadow-md
               {filterEstado === estado.value 
                 ? `${colores.bg} ${colores.border} ${colores.text}` 
                 : 'bg-white border-gray-200 hover:border-gray-300'}"
      >
        <div class="text-2xl mb-1">{estado.icon}</div>
        <div class="text-xl font-bold">{count}</div>
        <div class="text-xs mt-1">{estado.label}</div>
      </button>
    {/each}
  </div>

  <!-- Búsqueda y filtros -->
  <div class="bg-white rounded-lg shadow-sm border border-gray-200 p-4 mb-6">
    <div class="flex flex-col md:flex-row gap-4">
      <div class="flex-1">
        <div class="relative">
          <Search class="absolute left-3 top-3 w-5 h-5 text-gray-400" />
          <input
            type="text"
            bind:value={searchTerm}
            on:input={() => loadPedidos()}
            placeholder="Buscar por número, cliente o teléfono..."
            class="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
          />
        </div>
      </div>
      
      <button
        on:click={() => {
          mostrarSoloPendientes = !mostrarSoloPendientes;
          loadPedidos();
        }}
        class="btn-secondary flex items-center gap-2 {mostrarSoloPendientes ? 'bg-amber-100 border-amber-300' : ''}"
      >
        <Bell class="w-4 h-4" />
        {mostrarSoloPendientes ? 'Mostrar todos' : 'Solo validaciones'}
        {#if pendientesValidacion > 0 && !mostrarSoloPendientes}
          <span class="bg-red-500 text-white text-xs rounded-full px-2 py-0.5">
            {pendientesValidacion}
          </span>
        {/if}
      </button>
    </div>
  </div>

  {#if loading}
    <div class="flex items-center justify-center py-12">
      <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
    </div>
  {:else if pedidosFiltrados.length === 0}
    <div class="bg-white rounded-lg shadow-sm border border-gray-200 p-12 text-center">
      <div class="text-6xl mb-4">📦</div>
      <h3 class="text-lg font-medium text-gray-900 mb-2">No hay pedidos</h3>
      <p class="text-sm text-gray-500">
        {filterEstado || searchTerm ? 'No se encontraron pedidos con los filtros aplicados' : 'Aún no has recibido pedidos'}
      </p>
    </div>
  {:else}
    <!-- Tabla de pedidos -->
    <div class="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
      <div class="overflow-x-auto">
        <table class="min-w-full divide-y divide-gray-200">
          <thead class="bg-gray-50">
            <tr>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Pedido</th>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Cliente</th>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Fecha</th>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Total</th>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Estado</th>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Pago</th>
              <th class="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Acciones</th>
            </tr>
          </thead>
          <tbody class="bg-white divide-y divide-gray-200">
            {#each pedidosFiltrados as pedido}
              {@const colores = obtenerColorEstado(pedido.estado)}
              <tr class="hover:bg-gray-50 transition-colors">
                <td class="px-6 py-4 whitespace-nowrap">
                  <div class="text-sm font-bold text-gray-900">#{pedido.numero_pedido}</div>
                  <div class="text-xs text-gray-500">{pedido.items?.length || 0} items</div>
                </td>
                <td class="px-6 py-4">
                  <div class="text-sm font-medium text-gray-900">{pedido.cliente_nombre}</div>
                  <div class="text-sm text-gray-500">{pedido.cliente_whatsapp}</div>
                </td>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {formatDate(pedido.created_at)}
                </td>
                <td class="px-6 py-4 whitespace-nowrap text-sm font-bold text-gray-900">
                  {formatCurrency(pedido.total)}
                </td>
                <td class="px-6 py-4 whitespace-nowrap">
                  <span class="px-3 py-1 text-xs font-semibold rounded-full {colores.bg} {colores.text} border {colores.border}">
                    {CONFIG_ESTADOS[pedido.estado]?.icon} {CONFIG_ESTADOS[pedido.estado]?.label}
                  </span>
                </td>
                <td class="px-6 py-4 whitespace-nowrap">
                  {#if pedido.esperando_validacion}
                    <span class="px-3 py-1 text-xs font-semibold rounded-full bg-amber-100 text-amber-800 border border-amber-200 flex items-center gap-1 animate-pulse">
                      <Bell class="w-3 h-3" />
                      Validar
                    </span>
                  {:else if pedido.estado_pago === 'pagado'}
                    <span class="text-xs text-green-600 font-medium">✓ Pagado</span>
                  {:else}
                    <span class="text-xs text-gray-400">-</span>
                  {/if}
                </td>
                <td class="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                  <div class="flex items-center justify-end gap-2">
                    {#if pedido.esperando_validacion}
                      <button
                        on:click={() => abrirModalValidarPago(pedido)}
                        class="p-2 text-green-600 bg-green-50 rounded-lg hover:bg-green-100"
                        title="Validar pago"
                      >
                        <CheckCircle class="w-5 h-5" />
                      </button>
                    {/if}
                    
                    {#if pedido.editable}
                      <button
                        on:click={() => abrirModalEditar(pedido)}
                        class="p-2 text-indigo-600 bg-indigo-50 rounded-lg hover:bg-indigo-100"
                        title="Editar pedido"
                      >
                        <Edit class="w-5 h-5" />
                      </button>
                    {/if}
                    
                    <button
                      on:click={() => verDetalles(pedido)}
                      class="p-2 text-primary-600 bg-primary-50 rounded-lg hover:bg-primary-100"
                      title="Ver detalles"
                    >
                      <Eye class="w-5 h-5" />
                    </button>
                    
                    <button
                      on:click={() => abrirWhatsApp(pedido)}
                      class="p-2 text-green-600 bg-green-50 rounded-lg hover:bg-green-100"
                      title="WhatsApp"
                    >
                      <MessageCircle class="w-5 h-5" />
                    </button>
                  </div>
                </td>
              </tr>
            {/each}
          </tbody>
        </table>
      </div>
    </div>
  {/if}
  
</div>

<!-- Modales -->
{#if modalValidarPago.open}
  <ModalValidarPago
    pedido={modalValidarPago.pedido}
    on:validated={() => loadPedidos()}
    on:close={() => { 
      modalValidarPago.open = false; 
      loadPedidos(); 
    }}
  />
{/if}

{#if modalCancelar.open}
  <ModalCancelar
    pedido={modalCancelar.pedido}
    on:close={() => { 
      modalCancelar.open = false; 
      loadPedidos(); 
    }}
  />
{/if}

{#if modalEnviar.open}
  <ModalEnviar
    pedido={modalEnviar.pedido}
    on:close={() => { 
      modalEnviar.open = false; 
      loadPedidos(); 
    }}
  />
{/if}

{#if modalEditar.open}
  <ModalEditarPedido
    pedido={modalEditar.pedido}
    on:close={() => { 
      modalEditar.open = false; 
      loadPedidos(); 
    }}
  />
{/if}

{#if modalDetalles.open}
  <ModalDetalles
    pedido={modalDetalles.pedido}
    on:close={() => { 
      modalDetalles.open = false; 
    }}
    on:accion={handleCambioEstado}
  />
{/if}