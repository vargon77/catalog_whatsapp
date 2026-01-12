<!-- src/lib/components/reportes/EstadisticasCards.svelte -->
<script>
  import { DollarSign, ShoppingBag, TrendingUp, Package, Users } from 'lucide-svelte';
  
  export let estadisticas;
  export let cargando = false;
  
  function formatCurrency(amount) {
    return new Intl.NumberFormat('es-MX', {
      style: 'currency',
      currency: 'MXN'
    }).format(amount || 0);
  }
</script>

<div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
  
  <!-- Total Ventas -->
  <div class="bg-white rounded-lg shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow">
    <div class="flex items-center justify-between mb-4">
      <div class="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
        <DollarSign class="w-6 h-6 text-green-600" />
      </div>
      {#if !cargando && estadisticas?.totalVentas}
        <span class="text-xs text-green-600 font-medium bg-green-50 px-2 py-1 rounded">
          ↑ Ventas
        </span>
      {/if}
    </div>
    <p class="text-sm text-gray-600 mb-1">Total de Ventas</p>
    {#if cargando}
      <div class="h-8 bg-gray-200 rounded animate-pulse"></div>
    {:else}
      <p class="text-2xl font-bold text-gray-900">
        {formatCurrency(estadisticas?.totalVentas || 0)}
      </p>
    {/if}
  </div>
  
  <!-- Total Pedidos -->
  <div class="bg-white rounded-lg shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow">
    <div class="flex items-center justify-between mb-4">
      <div class="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
        <ShoppingBag class="w-6 h-6 text-blue-600" />
      </div>
      {#if !cargando && estadisticas?.totalPedidos}
        <span class="text-xs text-blue-600 font-medium bg-blue-50 px-2 py-1 rounded">
          {estadisticas.totalPedidos} pedidos
        </span>
      {/if}
    </div>
    <p class="text-sm text-gray-600 mb-1">Total de Pedidos</p>
    {#if cargando}
      <div class="h-8 bg-gray-200 rounded animate-pulse"></div>
    {:else}
      <p class="text-2xl font-bold text-gray-900">
        {estadisticas?.totalPedidos || 0}
      </p>
    {/if}
  </div>
  
  <!-- Ticket Promedio -->
  <div class="bg-white rounded-lg shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow">
    <div class="flex items-center justify-between mb-4">
      <div class="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
        <TrendingUp class="w-6 h-6 text-purple-600" />
      </div>
    </div>
    <p class="text-sm text-gray-600 mb-1">Ticket Promedio</p>
    {#if cargando}
      <div class="h-8 bg-gray-200 rounded animate-pulse"></div>
    {:else}
      <p class="text-2xl font-bold text-gray-900">
        {formatCurrency(estadisticas?.ticketPromedio || 0)}
      </p>
    {/if}
  </div>
  
  <!-- Top Productos -->
  <div class="bg-white rounded-lg shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow">
    <div class="flex items-center justify-between mb-4">
      <div class="w-12 h-12 bg-amber-100 rounded-lg flex items-center justify-center">
        <Package class="w-6 h-6 text-amber-600" />
      </div>
    </div>
    <p class="text-sm text-gray-600 mb-1">Productos Únicos</p>
    {#if cargando}
      <div class="h-8 bg-gray-200 rounded animate-pulse"></div>
    {:else}
      <p class="text-2xl font-bold text-gray-900">
        {estadisticas?.topProductos?.length || 0}
      </p>
    {/if}
  </div>
  
</div>

<!-- Top 5 Productos -->
{#if estadisticas?.topProductos?.length > 0}
  <div class="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
    
    <div class="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      <h3 class="font-semibold text-gray-900 mb-4 flex items-center gap-2">
        <Package class="w-5 h-5 text-primary-600" />
        Top 5 Productos Más Vendidos
      </h3>
      <div class="space-y-3">
        {#each estadisticas.topProductos.slice(0, 5) as producto, index}
          <div class="flex items-center justify-between">
            <div class="flex items-center gap-3 flex-1 min-w-0">
              <span class="w-8 h-8 bg-primary-100 text-primary-600 rounded-full flex items-center justify-center font-bold text-sm flex-shrink-0">
                {index + 1}
              </span>
              <div class="flex-1 min-w-0">
                <p class="text-sm font-medium text-gray-900 truncate">{producto.nombre}</p>
                <p class="text-xs text-gray-500">{producto.cantidad} unidades</p>
              </div>
            </div>
            <span class="text-sm font-semibold text-gray-900 ml-2">
              {formatCurrency(producto.total)}
            </span>
          </div>
        {/each}
      </div>
    </div>
    
    <div class="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      <h3 class="font-semibold text-gray-900 mb-4 flex items-center gap-2">
        <Users class="w-5 h-5 text-primary-600" />
        Top 5 Clientes
      </h3>
      <div class="space-y-3">
        {#each (estadisticas.topClientes || []).slice(0, 5) as cliente, index}
          <div class="flex items-center justify-between">
            <div class="flex items-center gap-3 flex-1 min-w-0">
              <span class="w-8 h-8 bg-green-100 text-green-600 rounded-full flex items-center justify-center font-bold text-sm flex-shrink-0">
                {index + 1}
              </span>
              <div class="flex-1 min-w-0">
                <p class="text-sm font-medium text-gray-900 truncate">{cliente.nombre}</p>
                <p class="text-xs text-gray-500">{cliente.pedidos} pedido{cliente.pedidos !== 1 ? 's' : ''}</p>
              </div>
            </div>
            <span class="text-sm font-semibold text-gray-900 ml-2">
              {formatCurrency(cliente.total)}
            </span>
          </div>
        {/each}
      </div>
    </div>
    
  </div>
{/if}