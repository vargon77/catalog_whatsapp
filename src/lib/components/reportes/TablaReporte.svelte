<!-- src/lib/components/reportes/TablaReporte.svelte -->
<script>
  import { format } from 'date-fns';
  import { es } from 'date-fns/locale';
  import { ChevronDown, ChevronUp } from 'lucide-svelte';
  
  export let datos = [];
  export let cargando = false;
  
  let paginaActual = 1;
  let itemsPorPagina = 20;
  let ordenColumna = 'created_at';
  let ordenDireccion = 'desc';
  let pedidoExpandido = null;
  
  // Ordenamiento
  function ordenar(columna) {
    if (ordenColumna === columna) {
      ordenDireccion = ordenDireccion === 'asc' ? 'desc' : 'asc';
    } else {
      ordenColumna = columna;
      ordenDireccion = 'asc';
    }
  }
  
  // Datos ordenados y paginados
  $: datosOrdenados = [...datos].sort((a, b) => {
    let valorA = a[ordenColumna];
    let valorB = b[ordenColumna];
    
    // Manejo especial para fechas
    if (ordenColumna === 'created_at') {
      valorA = new Date(valorA).getTime();
      valorB = new Date(valorB).getTime();
    }
    
    // Manejo especial para números
    if (ordenColumna === 'total') {
      valorA = parseFloat(valorA || 0);
      valorB = parseFloat(valorB || 0);
    }
    
    if (ordenDireccion === 'asc') {
      return valorA > valorB ? 1 : -1;
    } else {
      return valorA < valorB ? 1 : -1;
    }
  });
  
  $: inicio = (paginaActual - 1) * itemsPorPagina;
  $: fin = inicio + itemsPorPagina;
  $: datosPaginados = datosOrdenados.slice(inicio, fin);
  $: totalPaginas = Math.ceil(datosOrdenados.length / itemsPorPagina);
  
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
  
  function toggleExpandir(pedidoId) {
    pedidoExpandido = pedidoExpandido === pedidoId ? null : pedidoId;
  }
</script>

<div>
  {#if cargando}
    <div class="p-12 text-center">
      <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto"></div>
      <p class="mt-4 text-gray-600">Cargando datos...</p>
    </div>
  {:else if datos.length === 0}
    <div class="p-12 text-center">
      <svg class="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/>
      </svg>
      <h3 class="mt-2 text-sm font-medium text-gray-900">No hay datos</h3>
      <p class="mt-1 text-sm text-gray-500">Aplica filtros para generar un reporte</p>
    </div>
  {:else}
    <!-- Tabla -->
    <div class="overflow-x-auto">
      <table class="min-w-full divide-y divide-gray-200">
        <thead class="bg-gray-50">
          <tr>
            <th scope="col" class="px-6 py-3 text-left">
              <button
                on:click={() => ordenar('created_at')}
                class="flex items-center gap-1 text-xs font-medium text-gray-500 uppercase tracking-wider hover:text-gray-700"
              >
                Fecha
                {#if ordenColumna === 'created_at'}
                  {#if ordenDireccion === 'asc'}
                    <ChevronUp class="w-4 h-4" />
                  {:else}
                    <ChevronDown class="w-4 h-4" />
                  {/if}
                {/if}
              </button>
            </th>
            <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Cliente
            </th>
            <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Estado
            </th>
            <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Items
            </th>
            <th scope="col" class="px-6 py-3 text-left">
              <button
                on:click={() => ordenar('total')}
                class="flex items-center gap-1 text-xs font-medium text-gray-500 uppercase tracking-wider hover:text-gray-700"
              >
                Total
                {#if ordenColumna === 'total'}
                  {#if ordenDireccion === 'asc'}
                    <ChevronUp class="w-4 h-4" />
                  {:else}
                    <ChevronDown class="w-4 h-4" />
                  {/if}
                {/if}
              </button>
            </th>
            <th scope="col" class="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
              Acciones
            </th>
          </tr>
        </thead>
        <tbody class="bg-white divide-y divide-gray-200">
          {#each datosPaginados as pedido}
            <tr class="hover:bg-gray-50 transition-colors">
              <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                {format(new Date(pedido.created_at), 'dd/MM/yyyy', { locale: es })}
                <div class="text-xs text-gray-500">
                  {format(new Date(pedido.created_at), 'HH:mm', { locale: es })}
                </div>
              </td>
              <td class="px-6 py-4">
                <div class="text-sm font-medium text-gray-900">{pedido.cliente_nombre}</div>
                <div class="text-sm text-gray-500">{pedido.cliente_whatsapp}</div>
              </td>
              <td class="px-6 py-4 whitespace-nowrap">
                <span class="px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full {getEstadoColor(pedido.estado)}">
                  {pedido.estado}
                </span>
              </td>
              <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                {pedido.items?.length || 0} productos
              </td>
              <td class="px-6 py-4 whitespace-nowrap text-sm font-semibold text-gray-900">
                {formatCurrency(pedido.total)}
              </td>
              <td class="px-6 py-4 whitespace-nowrap text-right text-sm">
                <button
                  on:click={() => toggleExpandir(pedido.id)}
                  class="text-primary-600 hover:text-primary-900"
                >
                  {pedidoExpandido === pedido.id ? 'Ocultar' : 'Ver detalles'}
                </button>
              </td>
            </tr>
            
            {#if pedidoExpandido === pedido.id}
              <tr>
                <td colspan="6" class="px-6 py-4 bg-gray-50">
                  <div class="space-y-2">
                    <h4 class="font-medium text-gray-900 mb-2">Productos del Pedido:</h4>
                    {#if pedido.items && pedido.items.length > 0}
                      <div class="grid grid-cols-1 md:grid-cols-2 gap-2">
                        {#each pedido.items as item}
                          <div class="flex items-center justify-between bg-white p-3 rounded border border-gray-200">
                            <div>
                              <p class="text-sm font-medium text-gray-900">{item.producto_nombre}</p>
                              <p class="text-xs text-gray-500">
                                {item.cantidad} × {formatCurrency(item.precio_unitario)}
                              </p>
                            </div>
                            <span class="text-sm font-semibold text-gray-900">
                              {formatCurrency(item.subtotal)}
                            </span>
                          </div>
                        {/each}
                      </div>
                    {:else}
                      <p class="text-sm text-gray-500">No hay productos registrados</p>
                    {/if}
                  </div>
                </td>
              </tr>
            {/if}
          {/each}
        </tbody>
      </table>
    </div>
    
    <!-- Paginación -->
    {#if totalPaginas > 1}
      <div class="px-6 py-4 flex items-center justify-between border-t border-gray-200">
        <div class="text-sm text-gray-700">
          Mostrando {inicio + 1} a {Math.min(fin, datos.length)} de {datos.length} pedidos
        </div>
        <div class="flex gap-2">
          <button
            on:click={() => paginaActual = Math.max(1, paginaActual - 1)}
            disabled={paginaActual === 1}
            class="px-3 py-1 border border-gray-300 rounded hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Anterior
          </button>
          <span class="px-3 py-1 text-sm text-gray-700">
            Página {paginaActual} de {totalPaginas}
          </span>
          <button
            on:click={() => paginaActual = Math.min(totalPaginas, paginaActual + 1)}
            disabled={paginaActual === totalPaginas}
            class="px-3 py-1 border border-gray-300 rounded hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Siguiente
          </button>
        </div>
      </div>
    {/if}
  {/if}
</div>