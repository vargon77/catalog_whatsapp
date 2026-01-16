<!-- src/routes/(tienda)/carrito/mis-pedidos/+page.svelte -->
<script>
  import { onMount } from 'svelte';
  import { goto } from '$app/navigation';
  import { Package, Search, Phone, Clock, CheckCircle, XCircle, AlertCircle } from 'lucide-svelte';
  import { CONFIG_ESTADOS, obtenerColorEstado } from '$lib/pedidos/estadosCliente';
  
  export let data;
  
  let whatsapp = '';
  let pedidos = [];
  let loading = false;
  let error = '';
  let busquedaRealizada = false;
  
  // Cargar desde localStorage si existe
  onMount(() => {
    const savedWhatsapp = localStorage.getItem('cliente_whatsapp');
    if (savedWhatsapp) {
      whatsapp = savedWhatsapp;
      buscarPedidos();
    }
  });
  
  async function buscarPedidos() {
    if (!whatsapp || whatsapp.length < 10) {
      error = 'Ingresa un número de WhatsApp válido (10 dígitos)';
      return;
    }
    
    loading = true;
    error = '';
    busquedaRealizada = true;
    
    try {
      const res = await fetch(`/api/pedidos?whatsapp=${encodeURIComponent(whatsapp)}`);
      const result = await res.json();
      
      if (!result.success) {
        throw new Error(result.error);
      }
      
      pedidos = result.data || [];
      
      // Guardar en localStorage
      localStorage.setItem('cliente_whatsapp', whatsapp);
      
      if (pedidos.length === 0) {
        error = 'No se encontraron pedidos asociados a este número';
      }
      
    } catch (err) {
      error = err.message || 'Error al buscar pedidos';
      pedidos = [];
    } finally {
      loading = false;
    }
  }
  
  function verDetalle(pedidoId) {
    goto(`/carrito/mis-pedidos/${pedidoId}?whatsapp=${encodeURIComponent(whatsapp)}`);
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
      day: 'numeric'
    });
  }
  
  function limpiarBusqueda() {
    whatsapp = '';
    pedidos = [];
    busquedaRealizada = false;
    error = '';
    localStorage.removeItem('cliente_whatsapp');
  }
  
  $: pedidosActivos = pedidos.filter(p => !['entregado', 'cancelado'].includes(p.estado));
  $: pedidosCompletados = pedidos.filter(p => ['entregado', 'cancelado'].includes(p.estado));
</script>

<svelte:head>
  <title>Mis Pedidos | {data.configuracion?.nombre_empresa || 'CatálogoExpress'}</title>
</svelte:head>

<div class="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
  <div class="max-w-4xl mx-auto px-4 py-8">
    
    <!-- Header -->
    <div class="text-center mb-8">
      <div class="inline-flex items-center justify-center w-16 h-16 bg-primary-100 rounded-full mb-4">
        <Package class="w-8 h-8 text-primary-600" />
      </div>
      <h1 class="text-3xl font-bold text-gray-900 mb-2">Seguimiento de Pedidos</h1>
      <p class="text-gray-600">Consulta el estado de tus pedidos en tiempo real</p>
    </div>
    
    <!-- Búsqueda -->
    <div class="bg-white rounded-2xl shadow-lg p-6 mb-8">
      <div class="flex items-center gap-2 mb-4">
        <Phone class="w-5 h-5 text-gray-400" />
        <label class="text-sm font-medium text-gray-700">
          Ingresa tu número de WhatsApp
        </label>
      </div>
      
      <div class="flex gap-3">
        <div class="flex-1 relative">
          <input
            type="tel"
            bind:value={whatsapp}
            placeholder="7121234567"
            maxlength="10"
            class="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all"
            on:keypress={(e) => e.key === 'Enter' && buscarPedidos()}
          />
          <div class="absolute right-3 top-3 text-xs text-gray-400">
            {whatsapp.length}/10
          </div>
        </div>
        
        <button
          on:click={buscarPedidos}
          disabled={loading || whatsapp.length < 10}
          class="px-6 py-3 bg-primary-600 text-white rounded-xl hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed font-medium transition-all flex items-center gap-2 shadow-lg shadow-primary-200"
        >
          {#if loading}
            <div class="animate-spin w-5 h-5 border-2 border-white border-t-transparent rounded-full"></div>
            <span>Buscando...</span>
          {:else}
            <Search class="w-5 h-5" />
            <span>Buscar</span>
          {/if}
        </button>
      </div>
      
      {#if error}
        <div class="mt-4 bg-red-50 border-l-4 border-red-500 p-4 rounded-lg">
          <div class="flex items-center gap-3">
            <AlertCircle class="w-5 h-5 text-red-600" />
            <p class="text-sm text-red-800">{error}</p>
          </div>
        </div>
      {/if}
      
      {#if busquedaRealizada && pedidos.length > 0}
        <button
          on:click={limpiarBusqueda}
          class="mt-4 text-sm text-primary-600 hover:text-primary-700 font-medium"
        >
          Buscar otro número
        </button>
      {/if}
    </div>
    
    <!-- Resultados -->
    {#if busquedaRealizada && pedidos.length > 0}
      
      <!-- Pedidos Activos -->
      {#if pedidosActivos.length > 0}
        <div class="mb-8">
          <h2 class="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
            <Clock class="w-5 h-5 text-primary-600" />
            Pedidos Activos ({pedidosActivos.length})
          </h2>
          
          <div class="space-y-4">
            {#each pedidosActivos as pedido}
              {@const colores = obtenerColorEstado(pedido.estado)}
              {@const config = CONFIG_ESTADOS[pedido.estado]}
              
              <button
                on:click={() => verDetalle(pedido.id)}
                class="w-full bg-white rounded-2xl shadow-md hover:shadow-xl transition-all p-6 text-left border-2 border-gray-100 hover:border-primary-200"
              >
                <div class="flex items-start justify-between mb-4">
                  <div>
                    <div class="flex items-center gap-2 mb-2">
                      <span class="text-xs font-semibold text-gray-500">PEDIDO</span>
                      <span class="text-lg font-bold text-gray-900">#{pedido.numero_pedido}</span>
                    </div>
                    <p class="text-sm text-gray-600">{formatDate(pedido.created_at)}</p>
                  </div>
                  
                  <span class="px-4 py-2 text-sm font-semibold rounded-full {colores.bg} {colores.text} border {colores.border} flex items-center gap-2">
                    <span class="text-lg">{config.icon}</span>
                    {config.label}
                  </span>
                </div>
                
                <div class="flex items-center justify-between pt-4 border-t border-gray-100">
                  <div>
                    <p class="text-xs text-gray-500 mb-1">Total del pedido</p>
                    <p class="text-2xl font-bold text-primary-700">{formatCurrency(pedido.total)}</p>
                  </div>
                  
                  <div class="text-right">
                    <p class="text-xs text-gray-500 mb-1">{pedido.items?.length || 0} productos</p>
                    <span class="text-primary-600 font-medium text-sm flex items-center gap-1">
                      Ver detalles
                      <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"/>
                      </svg>
                    </span>
                  </div>
                </div>
              </button>
            {/each}
          </div>
        </div>
      {/if}
      
      <!-- Pedidos Completados -->
      {#if pedidosCompletados.length > 0}
        <div>
          <h2 class="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
            <CheckCircle class="w-5 h-5 text-green-600" />
            Historial ({pedidosCompletados.length})
          </h2>
          
          <div class="space-y-3">
            {#each pedidosCompletados as pedido}
              {@const colores = obtenerColorEstado(pedido.estado)}
              {@const config = CONFIG_ESTADOS[pedido.estado]}
              
              <button
                on:click={() => verDetalle(pedido.id)}
                class="w-full bg-white rounded-xl shadow-sm hover:shadow-md transition-all p-4 text-left border border-gray-200"
              >
                <div class="flex items-center justify-between">
                  <div class="flex items-center gap-4">
                    <span class="text-2xl">{config.icon}</span>
                    <div>
                      <p class="font-semibold text-gray-900">#{pedido.numero_pedido}</p>
                      <p class="text-xs text-gray-500">{formatDate(pedido.created_at)}</p>
                    </div>
                  </div>
                  
                  <div class="text-right">
                    <p class="font-bold text-gray-900">{formatCurrency(pedido.total)}</p>
                    <span class="text-xs px-2 py-1 rounded-full {colores.bg} {colores.text}">
                      {config.label}
                    </span>
                  </div>
                </div>
              </button>
            {/each}
          </div>
        </div>
      {/if}
      
    {:else if busquedaRealizada && !loading}
      <!-- Sin resultados -->
      <div class="bg-white rounded-2xl shadow-lg p-12 text-center">
        <div class="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <Package class="w-10 h-10 text-gray-400" />
        </div>
        <h3 class="text-xl font-semibold text-gray-900 mb-2">No hay pedidos</h3>
        <p class="text-gray-600 mb-6">No se encontraron pedidos con este número de WhatsApp</p>
        <button
          on:click={limpiarBusqueda}
          class="btn-primary"
        >
          Intentar con otro número
        </button>
      </div>
    {/if}
    
    <!-- Info de ayuda -->
    <div class="mt-8 bg-blue-50 border border-blue-200 rounded-xl p-6">
      <div class="flex items-start gap-4">
        <div class="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
          <AlertCircle class="w-5 h-5 text-blue-600" />
        </div>
        <div>
          <h3 class="font-semibold text-blue-900 mb-2">💡 ¿Cómo funciona?</h3>
          <ul class="text-sm text-blue-800 space-y-1">
            <li>• Ingresa el WhatsApp con el que hiciste tu pedido</li>
            <li>• Consulta el estado en tiempo real</li>
            <li>• Sube tu comprobante de pago cuando lo soliciten</li>
            <li>• Confirma la recepción cuando recibas tu pedido</li>
          </ul>
        </div>
      </div>
    </div>
  </div>
</div>