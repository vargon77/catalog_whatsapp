<!-- src/routes/(admin)/dashboard/+page.svelte -->
<!-- ✅ DASHBOARD MÓVIL PROFESIONAL -->

<script>
  import { onMount } from 'svelte';
  import { 
    TrendingUp, TrendingDown, Package, ShoppingBag, 
    Clock, DollarSign, Users, AlertCircle, ArrowRight,
    Calendar, Eye
  } from 'lucide-svelte';

  let stats = {
    totalProductos: 0,
    totalPedidos: 0,
    pedidosPendientes: 0,
    totalVentas: 0,
    productosDestacados: 0,
    productosActivos: 0,
    ventasMes: 0,
    pedidosHoy: 0,
    promedioVenta: 0,
    crecimientoMes: 0
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
      
      const [resProductos, resPedidos] = await Promise.all([
        fetch('/api/productos'),
        fetch('/api/pedidos')
      ]);
      
      // Productos
      let productos = [];
      if (resProductos.ok) {
        const dataProductos = await resProductos.json();
        productos = Array.isArray(dataProductos) ? dataProductos : (dataProductos.data || []);
      }
      
      // Pedidos
      let pedidos = [];
      if (resPedidos.ok) {
        const dataPedidos = await resPedidos.json();
        pedidos = Array.isArray(dataPedidos) ? dataPedidos : (dataPedidos.data || []);
      }
      
      // Calcular estadísticas
      stats.totalProductos = productos.length;
      stats.productosActivos = productos.filter(p => p.activo).length;
      stats.productosDestacados = productos.filter(p => p.destacado).length;
      
      stats.totalPedidos = pedidos.length;
      stats.pedidosPendientes = pedidos.filter(p => p.estado === 'pendiente').length;
      
      // Calcular ventas
      const now = new Date();
      const primerDiaMes = new Date(now.getFullYear(), now.getMonth(), 1);
      const primerDiaMesAnterior = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      const ultimoDiaMesAnterior = new Date(now.getFullYear(), now.getMonth(), 0);
      
      const pedidosMes = pedidos.filter(p => new Date(p.created_at) >= primerDiaMes);
      const pedidosMesAnterior = pedidos.filter(p => 
        new Date(p.created_at) >= primerDiaMesAnterior && 
        new Date(p.created_at) <= ultimoDiaMesAnterior
      );
      
      stats.totalVentas = pedidos.reduce((sum, p) => sum + (parseFloat(p.total) || 0), 0);
      stats.ventasMes = pedidosMes.reduce((sum, p) => sum + (parseFloat(p.total) || 0), 0);
      
      const ventasMesAnterior = pedidosMesAnterior.reduce((sum, p) => sum + (parseFloat(p.total) || 0), 0);
      stats.crecimientoMes = ventasMesAnterior > 0 
        ? ((stats.ventasMes - ventasMesAnterior) / ventasMesAnterior) * 100 
        : 0;
      
      // Promedio de venta
      stats.promedioVenta = stats.totalPedidos > 0 
        ? stats.totalVentas / stats.totalPedidos 
        : 0;
      
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

  function formatCompact(amount) {
    if (amount >= 1000000) {
      return (amount / 1000000).toFixed(1) + 'M';
    } else if (amount >= 1000) {
      return (amount / 1000).toFixed(1) + 'K';
    }
    return amount.toString();
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

  function getEstadoIcon(estado) {
    const iconos = {
      'pendiente': '⏳',
      'confirmado': '✓',
      'preparando': '📦',
      'enviado': '🚚',
      'entregado': '✅',
      'cancelado': '❌'
    };
    return iconos[estado] || '📋';
  }
</script>

<svelte:head>
  <title>Dashboard | CatálogoExpress</title>
</svelte:head>

<div class="space-y-4 md:space-y-6">
  <!-- Header -->
  <div class="flex items-center justify-between">
    <div>
      <h1 class="text-xl md:text-3xl font-bold text-gray-900">Dashboard</h1>
      <p class="text-xs md:text-sm text-gray-600 mt-1">
        <Calendar class="w-3 h-3 md:w-4 md:h-4 inline mr-1" />
        {new Date().toLocaleDateString('es-MX', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
      </p>
    </div>
    <a 
      href="/" 
      target="_blank"
      class="flex items-center gap-2 text-xs md:text-sm text-primary-600 hover:text-primary-700 font-medium"
    >
      <Eye class="w-4 h-4" />
      <span class="hidden sm:inline">Ver Tienda</span>
    </a>
  </div>

  {#if error}
    <div class="bg-red-50 border border-red-200 text-red-800 px-3 py-2 md:px-4 md:py-3 rounded-lg text-sm">
      <AlertCircle class="w-4 h-4 inline mr-2" />
      {error}
    </div>
  {/if}

  {#if loading}
    <div class="flex items-center justify-center py-12">
      <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
    </div>
  {:else}
    <!-- Estadísticas Principales - Optimizadas para móvil -->
    <div class="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
      <!-- Ventas Totales -->
      <div class="bg-gradient-to-br from-green-500 to-green-600 text-white rounded-xl p-4 shadow-lg">
        <div class="flex items-start justify-between mb-3">
          <div class="bg-white/20 p-2 rounded-lg">
            <DollarSign class="w-5 h-5 md:w-6 md:h-6" />
          </div>
          {#if stats.crecimientoMes > 0}
            <div class="flex items-center gap-1 text-xs bg-white/20 px-2 py-1 rounded-full">
              <TrendingUp class="w-3 h-3" />
              {stats.crecimientoMes.toFixed(1)}%
            </div>
          {:else if stats.crecimientoMes < 0}
            <div class="flex items-center gap-1 text-xs bg-white/20 px-2 py-1 rounded-full">
              <TrendingDown class="w-3 h-3" />
              {Math.abs(stats.crecimientoMes).toFixed(1)}%
            </div>
          {/if}
        </div>
        <div class="space-y-1">
          <p class="text-xs md:text-sm opacity-90">Ventas Totales</p>
          <p class="text-xl md:text-2xl font-bold">{formatCompact(stats.totalVentas)}</p>
          <p class="text-xs opacity-75">Este mes: {formatCurrency(stats.ventasMes)}</p>
        </div>
      </div>

      <!-- Total Pedidos -->
      <div class="bg-gradient-to-br from-blue-500 to-blue-600 text-white rounded-xl p-4 shadow-lg">
        <div class="bg-white/20 p-2 rounded-lg w-fit mb-3">
          <ShoppingBag class="w-5 h-5 md:w-6 md:h-6" />
        </div>
        <div class="space-y-1">
          <p class="text-xs md:text-sm opacity-90">Total Pedidos</p>
          <p class="text-xl md:text-2xl font-bold">{stats.totalPedidos}</p>
          <p class="text-xs opacity-75">Hoy: {stats.pedidosHoy}</p>
        </div>
      </div>

      <!-- Pendientes -->
      <div class="bg-gradient-to-br from-amber-500 to-amber-600 text-white rounded-xl p-4 shadow-lg">
        <div class="bg-white/20 p-2 rounded-lg w-fit mb-3">
          <Clock class="w-5 h-5 md:w-6 md:h-6" />
        </div>
        <div class="space-y-1">
          <p class="text-xs md:text-sm opacity-90">Pendientes</p>
          <p class="text-xl md:text-2xl font-bold">{stats.pedidosPendientes}</p>
          <p class="text-xs opacity-75">Requieren atención</p>
        </div>
      </div>

      <!-- Productos -->
      <div class="bg-gradient-to-br from-purple-500 to-purple-600 text-white rounded-xl p-4 shadow-lg">
        <div class="bg-white/20 p-2 rounded-lg w-fit mb-3">
          <Package class="w-5 h-5 md:w-6 md:h-6" />
        </div>
        <div class="space-y-1">
          <p class="text-xs md:text-sm opacity-90">Productos</p>
          <p class="text-xl md:text-2xl font-bold">{stats.totalProductos}</p>
          <p class="text-xs opacity-75">Activos: {stats.productosActivos}</p>
        </div>
      </div>
    </div>

    <!-- Métricas Secundarias - Solo Desktop -->
    <div class="hidden lg:grid grid-cols-3 gap-4">
      <div class="bg-white rounded-lg border border-gray-200 p-4">
        <div class="flex items-center gap-3">
          <div class="bg-indigo-100 p-3 rounded-lg">
            <DollarSign class="w-6 h-6 text-indigo-600" />
          </div>
          <div>
            <p class="text-sm text-gray-600">Ticket Promedio</p>
            <p class="text-xl font-bold text-gray-900">{formatCurrency(stats.promedioVenta)}</p>
          </div>
        </div>
      </div>

      <div class="bg-white rounded-lg border border-gray-200 p-4">
        <div class="flex items-center gap-3">
          <div class="bg-purple-100 p-3 rounded-lg">
            <Package class="w-6 h-6 text-purple-600" />
          </div>
          <div>
            <p class="text-sm text-gray-600">Destacados</p>
            <p class="text-xl font-bold text-gray-900">{stats.productosDestacados}</p>
          </div>
        </div>
      </div>

      <div class="bg-white rounded-lg border border-gray-200 p-4">
        <div class="flex items-center gap-3">
          <div class="bg-green-100 p-3 rounded-lg">
            <TrendingUp class="w-6 h-6 text-green-600" />
          </div>
          <div>
            <p class="text-sm text-gray-600">Crecimiento Mes</p>
            <p class="text-xl font-bold text-gray-900">
              {stats.crecimientoMes > 0 ? '+' : ''}{stats.crecimientoMes.toFixed(1)}%
            </p>
          </div>
        </div>
      </div>
    </div>

    <!-- Gráfica de Ventas y Productos Populares -->
    <div class="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6">
      <!-- Gráfica de Ventas -->
      <div class="bg-white rounded-xl border border-gray-200 p-4 md:p-6">
        <h2 class="text-base md:text-lg font-semibold text-gray-900 mb-4">Ventas (7 días)</h2>
        
        {#if ventasPorDia.length > 0}
          <div class="space-y-3">
            {#each ventasPorDia as dia}
              {@const maxVenta = Math.max(...ventasPorDia.map(d => d.total))}
              {@const porcentaje = maxVenta > 0 ? (dia.total / maxVenta) * 100 : 0}
              
              <div>
                <div class="flex items-center justify-between text-xs md:text-sm mb-1">
                  <span class="text-gray-600 font-medium">{dia.fecha}</span>
                  <span class="font-bold text-gray-900">{formatCurrency(dia.total)}</span>
                </div>
                <div class="w-full bg-gray-100 rounded-full h-2">
                  <div 
                    class="bg-gradient-to-r from-indigo-500 to-indigo-600 h-2 rounded-full transition-all duration-500"
                    style="width: {porcentaje}%"
                  ></div>
                </div>
              </div>
            {/each}
          </div>
        {:else}
          <p class="text-sm text-gray-500 text-center py-8">No hay datos de ventas</p>
        {/if}
      </div>

      <!-- Productos Populares -->
      <div class="bg-white rounded-xl border border-gray-200 p-4 md:p-6">
        <h2 class="text-base md:text-lg font-semibold text-gray-900 mb-4">Top Productos</h2>
        
        {#if productosPopulares.length > 0}
          <div class="space-y-3">
            {#each productosPopulares as producto, index}
              <div class="flex items-center gap-3">
                <div class="flex-shrink-0 w-8 h-8 bg-gradient-to-br from-indigo-500 to-purple-600 text-white rounded-lg flex items-center justify-center font-bold text-sm">
                  {index + 1}
                </div>
                <div class="flex-1 min-w-0">
                  <p class="text-sm font-medium text-gray-900 truncate">{producto.nombre}</p>
                  <p class="text-xs text-gray-500">{producto.cantidad} unidades</p>
                </div>
                <span class="text-sm font-bold text-gray-900 whitespace-nowrap">
                  {formatCurrency(producto.total)}
                </span>
              </div>
            {/each}
          </div>
        {:else}
          <p class="text-sm text-gray-500 text-center py-8">No hay datos</p>
        {/if}
      </div>
    </div>

    <!-- Pedidos Recientes -->
    <div class="bg-white rounded-xl border border-gray-200 overflow-hidden">
      <div class="p-4 md:p-6 border-b border-gray-200 flex items-center justify-between">
        <h2 class="text-base md:text-lg font-semibold text-gray-900">Pedidos Recientes</h2>
        <a 
          href="/pedidos" 
          class="text-xs md:text-sm text-indigo-600 hover:text-indigo-700 font-medium flex items-center gap-1"
        >
          Ver todos
          <ArrowRight class="w-4 h-4" />
        </a>
      </div>
      
      {#if pedidosRecientes.length > 0}
        <!-- Vista Móvil -->
        <div class="divide-y divide-gray-200 md:hidden">
          {#each pedidosRecientes as pedido}
            <a href="/pedidos" class="block p-4 hover:bg-gray-50 active:bg-gray-100 transition-colors">
              <div class="flex items-start justify-between mb-2">
                <div>
                  <p class="font-semibold text-gray-900">#{pedido.numero_pedido || pedido.id}</p>
                  <p class="text-sm text-gray-600">{pedido.cliente_nombre}</p>
                </div>
                <span class="text-xs px-2 py-1 rounded-full {getEstadoColor(pedido.estado)}">
                  {getEstadoIcon(pedido.estado)} {getEstadoTexto(pedido.estado)}
                </span>
              </div>
              <div class="flex items-center justify-between text-sm">
                <span class="text-gray-500">
                  {new Date(pedido.created_at).toLocaleDateString('es-MX')}
                </span>
                <span class="font-bold text-gray-900">{formatCurrency(pedido.total)}</span>
              </div>
            </a>
          {/each}
        </div>

        <!-- Vista Desktop -->
        <div class="hidden md:block overflow-x-auto">
          <table class="min-w-full divide-y divide-gray-200">
            <thead class="bg-gray-50">
              <tr>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Pedido</th>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Cliente</th>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Fecha</th>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Total</th>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Estado</th>
              </tr>
            </thead>
            <tbody class="bg-white divide-y divide-gray-200">
              {#each pedidosRecientes as pedido}
                <tr class="hover:bg-gray-50 transition-colors">
                  <td class="px-6 py-4 text-sm font-medium text-gray-900">
                    #{pedido.numero_pedido || pedido.id}
                  </td>
                  <td class="px-6 py-4">
                    <div class="text-sm font-medium text-gray-900">{pedido.cliente_nombre}</div>
                    <div class="text-sm text-gray-500">{pedido.cliente_whatsapp}</div>
                  </td>
                  <td class="px-6 py-4 text-sm text-gray-500">
                    {new Date(pedido.created_at).toLocaleDateString('es-MX')}
                  </td>
                  <td class="px-6 py-4 text-sm font-semibold text-gray-900">
                    {formatCurrency(pedido.total)}
                  </td>
                  <td class="px-6 py-4">
                    <span class="px-2 py-1 text-xs font-semibold rounded-full {getEstadoColor(pedido.estado)}">
                      {getEstadoIcon(pedido.estado)} {getEstadoTexto(pedido.estado)}
                    </span>
                  </td>
                </tr>
              {/each}
            </tbody>
          </table>
        </div>
      {:else}
        <div class="p-8 text-center">
          <ShoppingBag class="w-12 h-12 text-gray-400 mx-auto mb-3" />
          <p class="text-sm text-gray-500">No hay pedidos recientes</p>
        </div>
      {/if}
    </div>
  {/if}
</div>