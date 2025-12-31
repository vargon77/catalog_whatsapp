<!-- src/routes/(admin)/dashboard/+page.svelte -->
<!-- CORREGIDO: Manejo correcto de respuestas API -->
<script>
  import { onMount } from 'svelte';

  let stats = {
    totalProductos: 0,
    totalPedidos: 0,
    pedidosPendientes: 0,
    totalVentas: 0,
    productosDestacados: 0,
    productosActivos: 0,
    ventasMes: 0,
    pedidosHoy: 0
  };

  let loading = true;
  let pedidosRecientes = [];
  let productosPopulares = [];
  let ventasPorDia = [];
  let error = '';

  onMount(async () => {
    await loadDashboardData();
  });

  async function loadDashboardData() {
    try {
      loading = true;
      error = '';
      
      // ✅ CORRECCIÓN: Manejar respuestas con estructura {success, data}
      const [resProductos, resPedidos] = await Promise.all([
        fetch('/api/productos'),
        fetch('/api/pedidos')
      ]);
      
      // Productos
      let productos = [];
      if (resProductos.ok) {
        const dataProductos = await resProductos.json();
        // ✅ Puede venir como array directo o como {success, data}
        productos = Array.isArray(dataProductos) ? dataProductos : (dataProductos.data || []);
      }
      
      // Pedidos
      let pedidos = [];
      if (resPedidos.ok) {
        const dataPedidos = await resPedidos.json();
        // ✅ Puede venir como array directo o como {success, data}
        pedidos = Array.isArray(dataPedidos) ? dataPedidos : (dataPedidos.data || []);
      }
      
      console.log('📊 Productos cargados:', productos.length);
      console.log('📊 Pedidos cargados:', pedidos.length);
      
      // Calcular estadísticas
      stats.totalProductos = productos.length;
      stats.productosActivos = productos.filter(p => p.activo).length;
      stats.productosDestacados = productos.filter(p => p.destacado).length;
      
      stats.totalPedidos = pedidos.length;
      stats.pedidosPendientes = pedidos.filter(p => p.estado === 'pendiente').length;
      
      // Calcular ventas totales y del mes
      const now = new Date();
      const primerDiaMes = new Date(now.getFullYear(), now.getMonth(), 1);
      
      stats.totalVentas = pedidos.reduce((sum, p) => sum + (parseFloat(p.total) || 0), 0);
      stats.ventasMes = pedidos
        .filter(p => new Date(p.created_at) >= primerDiaMes)
        .reduce((sum, p) => sum + (parseFloat(p.total) || 0), 0);
      
      // Pedidos de hoy
      const hoy = new Date();
      hoy.setHours(0, 0, 0, 0);
      stats.pedidosHoy = pedidos.filter(p => new Date(p.created_at) >= hoy).length;
      
      // Pedidos recientes (últimos 5)
      pedidosRecientes = pedidos
        .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
        .slice(0, 5);
      
      // Productos más pedidos
      const productosCount = {};
      pedidos.forEach(pedido => {
        if (pedido.items && Array.isArray(pedido.items)) {
          pedido.items.forEach(item => {
            if (!productosCount[item.producto_id]) {
              productosCount[item.producto_id] = {
                nombre: item.producto_nombre,
                cantidad: 0,
                total: 0
              };
            }
            productosCount[item.producto_id].cantidad += item.cantidad;
            productosCount[item.producto_id].total += parseFloat(item.subtotal) || 0;
          });
        }
      });
      
      productosPopulares = Object.entries(productosCount)
        .map(([id, data]) => ({ id, ...data }))
        .sort((a, b) => b.cantidad - a.cantidad)
        .slice(0, 5);
      
      // Ventas por día (últimos 7 días)
      const diasAtras = 7;
      const ventasPorDiaMap = {};
      
      for (let i = diasAtras - 1; i >= 0; i--) {
        const dia = new Date();
        dia.setDate(dia.getDate() - i);
        dia.setHours(0, 0, 0, 0);
        const key = dia.toISOString().split('T')[0];
        ventasPorDiaMap[key] = 0;
      }
      
      pedidos.forEach(pedido => {
        const fecha = new Date(pedido.created_at);
        fecha.setHours(0, 0, 0, 0);
        const key = fecha.toISOString().split('T')[0];
        if (ventasPorDiaMap.hasOwnProperty(key)) {
          ventasPorDiaMap[key] += parseFloat(pedido.total) || 0;
        }
      });
      
      ventasPorDia = Object.entries(ventasPorDiaMap).map(([fecha, total]) => ({
        fecha: new Date(fecha).toLocaleDateString('es-MX', { month: 'short', day: 'numeric' }),
        total
      }));
      
    } catch (err) {
      console.error('Error cargando datos del dashboard:', err);
      error = 'Error al cargar los datos del dashboard';
    } finally {
      loading = false;
    }
  }

  function formatCurrency(amount) {
    return new Intl.NumberFormat('es-MX', {
      style: 'currency',
      currency: 'MXN'
    }).format(amount || 0);
  }

  function getEstadoColor(estado) {
    const colores = {
      'pendiente': 'bg-yellow-100 text-yellow-800',
      'confirmado': 'bg-blue-100 text-blue-800',
      'preparando': 'bg-purple-100 text-purple-800',
      'enviado': 'bg-indigo-100 text-indigo-800',
      'entregado': 'bg-green-100 text-green-800',
      'cancelado': 'bg-red-100 text-red-800'
    };
    return colores[estado] || 'bg-gray-100 text-gray-800';
  }

  function getEstadoTexto(estado) {
    const textos = {
      'pendiente': 'Pendiente',
      'confirmado': 'Confirmado',
      'preparando': 'Preparando',
      'enviado': 'Enviado',
      'entregado': 'Entregado',
      'cancelado': 'Cancelado'
    };
    return textos[estado] || estado;
  }
</script>

<svelte:head>
  <title>Dashboard | Mi Tienda</title>
</svelte:head>

<div class="max-w-7xl mx-auto">
  <!-- Header -->
  <div class="mb-8">
    <h1 class="text-2xl md:text-3xl font-bold text-gray-900">Dashboard</h1>
    <p class="mt-1 text-sm text-gray-600">Resumen general de tu tienda</p>
  </div>

  {#if error}
    <div class="mb-6 bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded-lg">
      {error}
    </div>
  {/if}

  {#if loading}
    <div class="flex items-center justify-center py-12">
      <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
    </div>
  {:else}
    <!-- Estadísticas principales -->
    <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6 mb-8">
      <!-- Total Ventas -->
      <div class="bg-white rounded-lg shadow-sm p-6 border border-gray-200 hover:shadow-md transition-shadow">
        <div class="flex items-center justify-between">
          <div>
            <p class="text-sm font-medium text-gray-600">Ventas Totales</p>
            <p class="text-2xl font-bold text-gray-900 mt-2">{formatCurrency(stats.totalVentas)}</p>
          </div>
          <div class="bg-green-100 p-3 rounded-full">
            <svg class="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
            </svg>
          </div>
        </div>
        <p class="text-xs text-gray-500 mt-2">Este mes: {formatCurrency(stats.ventasMes)}</p>
      </div>

      <!-- Total Pedidos -->
      <div class="bg-white rounded-lg shadow-sm p-6 border border-gray-200 hover:shadow-md transition-shadow">
        <div class="flex items-center justify-between">
          <div>
            <p class="text-sm font-medium text-gray-600">Total Pedidos</p>
            <p class="text-2xl font-bold text-gray-900 mt-2">{stats.totalPedidos}</p>
          </div>
          <div class="bg-blue-100 p-3 rounded-full">
            <svg class="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z"/>
            </svg>
          </div>
        </div>
        <p class="text-xs text-gray-500 mt-2">Hoy: {stats.pedidosHoy} pedidos</p>
      </div>

      <!-- Pedidos Pendientes -->
      <div class="bg-white rounded-lg shadow-sm p-6 border border-gray-200 hover:shadow-md transition-shadow">
        <div class="flex items-center justify-between">
          <div>
            <p class="text-sm font-medium text-gray-600">Pendientes</p>
            <p class="text-2xl font-bold text-gray-900 mt-2">{stats.pedidosPendientes}</p>
          </div>
          <div class="bg-yellow-100 p-3 rounded-full">
            <svg class="w-6 h-6 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"/>
            </svg>
          </div>
        </div>
        <p class="text-xs text-gray-500 mt-2">Requieren atención</p>
      </div>

      <!-- Total Productos -->
      <div class="bg-white rounded-lg shadow-sm p-6 border border-gray-200 hover:shadow-md transition-shadow">
        <div class="flex items-center justify-between">
          <div>
            <p class="text-sm font-medium text-gray-600">Productos</p>
            <p class="text-2xl font-bold text-gray-900 mt-2">{stats.totalProductos}</p>
          </div>
          <div class="bg-purple-100 p-3 rounded-full">
            <svg class="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"/>
            </svg>
          </div>
        </div>
        <p class="text-xs text-gray-500 mt-2">Activos: {stats.productosActivos}</p>
      </div>
    </div>

    <!-- Gráficas y tablas -->
    <div class="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
      <!-- Gráfica de Ventas -->
      <div class="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h2 class="text-lg font-semibold text-gray-900 mb-4">Ventas últimos 7 días</h2>
        
        {#if ventasPorDia.length > 0}
          <div class="space-y-3">
            {#each ventasPorDia as dia}
              {@const maxVenta = Math.max(...ventasPorDia.map(d => d.total))}
              {@const porcentaje = maxVenta > 0 ? (dia.total / maxVenta) * 100 : 0}
              
              <div>
                <div class="flex items-center justify-between text-sm mb-1">
                  <span class="text-gray-600">{dia.fecha}</span>
                  <span class="font-semibold text-gray-900">{formatCurrency(dia.total)}</span>
                </div>
                <div class="w-full bg-gray-200 rounded-full h-2.5">
                  <div 
                    class="bg-indigo-600 h-2.5 rounded-full transition-all duration-500"
                    style="width: {porcentaje}%"
                  ></div>
                </div>
              </div>
            {/each}
          </div>
        {:else}
          <p class="text-gray-500 text-center py-8">No hay datos de ventas</p>
        {/if}
      </div>

      <!-- Productos más vendidos -->
      <div class="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h2 class="text-lg font-semibold text-gray-900 mb-4">Productos más vendidos</h2>
        
        {#if productosPopulares.length > 0}
          <div class="space-y-4">
            {#each productosPopulares as producto, index}
              <div class="flex items-center justify-between">
                <div class="flex items-center flex-1 min-w-0">
                  <div class="w-8 h-8 bg-indigo-100 text-indigo-600 rounded-full flex items-center justify-center font-semibold text-sm flex-shrink-0">
                    {index + 1}
                  </div>
                  <div class="ml-3 flex-1 min-w-0">
                    <p class="text-sm font-medium text-gray-900 truncate">{producto.nombre}</p>
                    <p class="text-xs text-gray-500">{producto.cantidad} unidades</p>
                  </div>
                </div>
                <span class="text-sm font-semibold text-gray-900 ml-2">{formatCurrency(producto.total)}</span>
              </div>
            {/each}
          </div>
        {:else}
          <p class="text-gray-500 text-center py-8">No hay datos de productos</p>
        {/if}
      </div>
    </div>

    <!-- Pedidos recientes -->
    <div class="bg-white rounded-lg shadow-sm border border-gray-200">
      <div class="p-6 border-b border-gray-200">
        <div class="flex items-center justify-between">
          <h2 class="text-lg font-semibold text-gray-900">Pedidos Recientes</h2>
          <a 
            href="/pedidos" 
            class="text-sm text-indigo-600 hover:text-indigo-700 font-medium"
          >
            Ver todos →
          </a>
        </div>
      </div>
      
      <div class="overflow-x-auto">
        {#if pedidosRecientes.length > 0}
          <table class="min-w-full divide-y divide-gray-200">
            <thead class="bg-gray-50">
              <tr>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Pedido
                </th>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Cliente
                </th>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider hidden sm:table-cell">
                  Fecha
                </th>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Total
                </th>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Estado
                </th>
              </tr>
            </thead>
            <tbody class="bg-white divide-y divide-gray-200">
              {#each pedidosRecientes as pedido}
                <tr class="hover:bg-gray-50 transition-colors">
                  <td class="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    #{pedido.numero_pedido || pedido.id}
                  </td>
                  <td class="px-6 py-4 whitespace-nowrap">
                    <div class="text-sm font-medium text-gray-900">{pedido.cliente_nombre}</div>
                    <div class="text-sm text-gray-500 hidden md:block">{pedido.cliente_whatsapp}</div>
                  </td>
                  <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500 hidden sm:table-cell">
                    {new Date(pedido.created_at).toLocaleDateString('es-MX')}
                  </td>
                  <td class="px-6 py-4 whitespace-nowrap text-sm font-semibold text-gray-900">
                    {formatCurrency(pedido.total)}
                  </td>
                  <td class="px-6 py-4 whitespace-nowrap">
                    <span class="px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full {getEstadoColor(pedido.estado)}">
                      {getEstadoTexto(pedido.estado)}
                    </span>
                  </td>
                </tr>
              {/each}
            </tbody>
          </table>
        {:else}
          <div class="p-8 text-center">
            <svg class="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4"/>
            </svg>
            <p class="mt-2 text-gray-500">No hay pedidos recientes</p>
          </div>
        {/if}
      </div>
    </div>
  {/if}
</div>