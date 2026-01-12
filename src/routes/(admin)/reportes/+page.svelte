<!-- src/routes/(admin)/reportes/+page.svelte -->
<script>
  import { BarChart3, Download, Calendar, Filter, TrendingUp, Database, Zap } from 'lucide-svelte';
  import { format, subDays, startOfWeek, endOfWeek, startOfMonth, endOfMonth } from 'date-fns';
  import FiltrosReportes from '$lib/components/reportes/FiltrosReportes.svelte';
  import EstadisticasCards from '$lib/components/reportes/EstadisticasCards.svelte';
  import TablaReporte from '$lib/components/reportes/TablaReporte.svelte';
  import ExportarExcel from '$lib/components/reportes/ExportarExcel.svelte';
  import RespaldosDatabase from '$lib/components/reportes/RespaldosDatabase.svelte';
  
  export let data;
  
  let filtrosAplicados = {};
  let datosReporte = [];
  let estadisticas = data.estadisticasIniciales;
  let cargando = false;
  let mostrarFiltros = true;
  let mostrarRespaldos = false;
  let seccionActiva = 'reportes'; // 'reportes' o 'respaldos'
  
  // Plantillas de reportes rápidos
  const reportesRapidos = [
    {
      id: 'hoy',
      nombre: 'Ventas de Hoy',
      descripcion: 'Pedidos realizados hoy',
      icon: '📅',
      color: 'blue',
      filtros: () => {
        const hoy = new Date();
        return {
          fechaInicio: format(hoy, 'yyyy-MM-dd'),
          fechaFin: format(hoy, 'yyyy-MM-dd')
        };
      }
    },
    {
      id: 'semana',
      nombre: 'Esta Semana',
      descripcion: 'Ventas de la semana actual',
      icon: '📆',
      color: 'green',
      filtros: () => {
        const hoy = new Date();
        return {
          fechaInicio: format(startOfWeek(hoy, { weekStartsOn: 1 }), 'yyyy-MM-dd'),
          fechaFin: format(endOfWeek(hoy, { weekStartsOn: 1 }), 'yyyy-MM-dd')
        };
      }
    },
    {
      id: 'mes',
      nombre: 'Este Mes',
      descripcion: 'Resumen del mes actual',
      icon: '🗓️',
      color: 'purple',
      filtros: () => {
        const hoy = new Date();
        return {
          fechaInicio: format(startOfMonth(hoy), 'yyyy-MM-dd'),
          fechaFin: format(endOfMonth(hoy), 'yyyy-MM-dd')
        };
      }
    },
    {
      id: 'ultimos7',
      nombre: 'Últimos 7 Días',
      descripcion: 'Semana más reciente',
      icon: '⏰',
      color: 'amber',
      filtros: () => {
        const hoy = new Date();
        return {
          fechaInicio: format(subDays(hoy, 7), 'yyyy-MM-dd'),
          fechaFin: format(hoy, 'yyyy-MM-dd')
        };
      }
    },
    {
      id: 'pendientes',
      nombre: 'Pedidos Pendientes',
      descripcion: 'Requieren atención',
      icon: '⏳',
      color: 'yellow',
      filtros: () => ({
        estados: ['pendiente']
      })
    },
    {
      id: 'completados',
      nombre: 'Entregados',
      descripcion: 'Pedidos completados',
      icon: '✅',
      color: 'green',
      filtros: () => ({
        estados: ['entregado']
      })
    }
  ];
  
  // Función para cargar datos con filtros
  async function cargarReporte(filtros) {
    cargando = true;
    filtrosAplicados = filtros;
    
    try {
      const params = new URLSearchParams();
      
      // Construir query params
      if (filtros.fechaInicio) params.append('fechaInicio', filtros.fechaInicio);
      if (filtros.fechaFin) params.append('fechaFin', filtros.fechaFin);
      if (filtros.estados?.length) params.append('estados', filtros.estados.join(','));
      if (filtros.categorias?.length) params.append('categorias', filtros.categorias.join(','));
      if (filtros.marcas?.length) params.append('marcas', filtros.marcas.join(','));
      if (filtros.clienteSeleccionado?.whatsapp) {
        params.append('telefono', filtros.clienteSeleccionado.whatsapp);
      }
      if (filtros.productoSeleccionado?.id) {
        params.append('productoId', filtros.productoSeleccionado.id);
      }
      
      const response = await fetch(`/api/reportes?${params.toString()}`);
      const result = await response.json();
      
      if (result.success) {
        datosReporte = result.data.pedidos || [];
        estadisticas = result.data.estadisticas || {};
      }
    } catch (error) {
      console.error('Error cargando reporte:', error);
    } finally {
      cargando = false;
    }
  }
  
  function handleFiltrosChange(event) {
    cargarReporte(event.detail);
  }
  
  function aplicarReporteRapido(reporte) {
    const filtros = reporte.filtros();
    cargarReporte(filtros);
    // Scroll a resultados
    setTimeout(() => {
      document.querySelector('#resultados')?.scrollIntoView({ behavior: 'smooth' });
    }, 100);
  }
</script>

<svelte:head>
  <title>Reportes y Análisis | Dashboard</title>
</svelte:head>

<div class="max-w-7xl mx-auto space-y-6">
  
  <!-- Header con tabs -->
  <div>
    <h1 class="text-2xl md:text-3xl font-bold text-gray-900 flex items-center gap-2 mb-4">
      <BarChart3 class="w-8 h-8 text-primary-600" />
      Reportes y Análisis
    </h1>
    
    <!-- Tabs -->
    <div class="border-b border-gray-200">
      <nav class="flex gap-4" aria-label="Tabs">
        <button
          on:click={() => seccionActiva = 'reportes'}
          class="pb-3 px-1 border-b-2 font-medium text-sm transition-colors {
            seccionActiva === 'reportes'
              ? 'border-primary-600 text-primary-600'
              : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
          }"
        >
          <div class="flex items-center gap-2">
            <BarChart3 class="w-4 h-4" />
            <span>Reportes de Ventas</span>
          </div>
        </button>
        
        <button
          on:click={() => seccionActiva = 'respaldos'}
          class="pb-3 px-1 border-b-2 font-medium text-sm transition-colors {
            seccionActiva === 'respaldos'
              ? 'border-primary-600 text-primary-600'
              : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
          }"
        >
          <div class="flex items-center gap-2">
            <Database class="w-4 h-4" />
            <span>Respaldos de BD</span>
          </div>
        </button>
      </nav>
    </div>
  </div>
  
  {#if seccionActiva === 'reportes'}
    <!-- SECCIÓN DE REPORTES -->
    
    <!-- Acciones rápidas -->
    <div class="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
      <p class="text-sm text-gray-600">
        Genera reportes personalizados y exporta tus datos
      </p>
      
      <div class="flex items-center gap-3">
        <button
          on:click={() => mostrarFiltros = !mostrarFiltros}
          class="btn-secondary flex items-center gap-2"
        >
          <Filter class="w-4 h-4" />
          {mostrarFiltros ? 'Ocultar' : 'Mostrar'} Filtros
        </button>
        
        <ExportarExcel 
          {datosReporte} 
          {estadisticas} 
          {filtrosAplicados}
        />
      </div>
    </div>
    
    <!-- Reportes Rápidos -->
    <div class="bg-gradient-to-r from-primary-50 to-primary-100 rounded-xl p-6 border border-primary-200">
      <h3 class="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
        <Zap class="w-5 h-5 text-primary-600" />
        Reportes Rápidos
      </h3>
      
      <div class="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
        {#each reportesRapidos as reporte}
          {@const colorClasses = {
            blue: 'bg-blue-500 hover:bg-blue-600',
            green: 'bg-green-500 hover:bg-green-600',
            purple: 'bg-purple-500 hover:bg-purple-600',
            amber: 'bg-amber-500 hover:bg-amber-600',
            yellow: 'bg-yellow-500 hover:bg-yellow-600'
          }}
          
          <button
            on:click={() => aplicarReporteRapido(reporte)}
            class="flex flex-col items-center gap-2 p-4 bg-white rounded-lg border-2 border-gray-200 hover:border-primary-500 hover:shadow-md transition-all group"
          >
            <div class="w-12 h-12 {colorClasses[reporte.color]} rounded-full flex items-center justify-center text-2xl transition-transform group-hover:scale-110">
              {reporte.icon}
            </div>
            <div class="text-center">
              <p class="text-sm font-semibold text-gray-900">
                {reporte.nombre}
              </p>
              <p class="text-xs text-gray-500 mt-1">
                {reporte.descripcion}
              </p>
            </div>
          </button>
        {/each}
      </div>
    </div>
    
    <!-- Filtros -->
    {#if mostrarFiltros}
      <div class="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <FiltrosReportes
          categorias={data.categorias}
          marcas={data.marcas}
          estados={data.estados}
          on:aplicar={handleFiltrosChange}
        />
      </div>
    {/if}
    
    <!-- Estadísticas -->
    {#if estadisticas}
      <EstadisticasCards {estadisticas} {cargando} />
    {/if}
    
    <!-- Tabla de Resultados -->
    <div id="resultados" class="bg-white rounded-xl shadow-sm border border-gray-200 scroll-mt-24">
      <div class="p-6 border-b border-gray-200">
        <div class="flex items-center justify-between">
          <h2 class="text-lg font-semibold text-gray-900">
            Resultados del Reporte
          </h2>
          <span class="text-sm text-gray-600">
            {datosReporte.length} pedido{datosReporte.length !== 1 ? 's' : ''}
          </span>
        </div>
      </div>
      
      <TablaReporte datos={datosReporte} {cargando} />
    </div>
    
    <!-- Info de ayuda -->
    <div class="bg-blue-50 border border-blue-200 rounded-lg p-4">
      <div class="flex items-start gap-3">
        <svg class="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
        </svg>
        <div class="text-sm text-blue-800">
          <p class="font-medium mb-1">💡 Consejos de uso:</p>
          <ul class="list-disc list-inside space-y-1 text-blue-700">
            <li>Usa "Reportes Rápidos" para acceso instantáneo a datos comunes</li>
            <li>Los filtros te permiten personalizar tu reporte</li>
            <li>Exporta a Excel para análisis más detallados</li>
            <li>Los datos se actualizan en tiempo real</li>
          </ul>
        </div>
      </div>
    </div>
    
  {:else}
    <!-- SECCIÓN DE RESPALDOS -->
    <RespaldosDatabase />
  {/if}
</div>