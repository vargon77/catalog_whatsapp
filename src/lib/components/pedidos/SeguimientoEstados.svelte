<!-- src/lib/components/pedidos/SeguimientoEstados.svelte -->
<!-- ✅ COMPONENTE MEJORADO - Seguimiento visual avanzado -->

<script>
  import { CheckCircle, Clock, Package, CreditCard, Truck, Home, XCircle, AlertTriangle } from 'lucide-svelte';
  import { CONFIG_ESTADOS, obtenerColorEstado } from '$lib/pedidos/estadosCliente';
  import { onMount } from 'svelte';
  
  export let pedido;
  export let historial = [];
  export let mostrarFechas = true;
  export let compacto = false;
  
  // Estados del flujo normal
  const FLUJO_NORMAL = [
    { estado: 'pendiente', icon: Clock, label: 'Recibido' },
    { estado: 'confirmado', icon: CheckCircle, label: 'Confirmado' },
    { estado: 'pagado', icon: CreditCard, label: 'Pagado' },
    { estado: 'enviado', icon: Truck, label: 'En Camino' },
    { estado: 'recibido', icon: Home, label: 'Entregado' }
  ];
  
  // Determinar paso activo
  function obtenerIndiceActual(estado) {
    const index = FLUJO_NORMAL.findIndex(f => f.estado === estado);
    return index !== -1 ? index : -1;
  }
  
  function esPasoCompletado(paso, estadoActual) {
    const indexPaso = FLUJO_NORMAL.findIndex(f => f.estado === paso);
    const indexActual = obtenerIndiceActual(estadoActual);
    return indexPaso !== -1 && indexActual !== -1 && indexPaso <= indexActual;
  }
  
  // Obtener fecha del estado desde historial
  function obtenerFechaEstado(estado) {
    const registro = historial.find(h => h.estado_nuevo === estado);
    if (registro) {
      return new Date(registro.created_at).toLocaleString('es-MX', {
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    }
    
    // Fallback a fechas del pedido
    const camposFecha = {
      'pendiente': pedido.created_at,
      'confirmado': pedido.fecha_confirmado,
      'pagado': pedido.fecha_pagado,
      'enviado': pedido.fecha_enviado,
      'recibido': pedido.fecha_recibido
    };
    
    const fecha = camposFecha[estado];
    return fecha ? new Date(fecha).toLocaleString('es-MX', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }) : null;
  }
  
  // Obtener tiempo transcurrido
  function tiempoTranscurrido(fecha) {
    if (!fecha) return null;
    const diff = Date.now() - new Date(fecha).getTime();
    const horas = Math.floor(diff / (1000 * 60 * 60));
    const dias = Math.floor(horas / 24);
    
    if (dias > 0) return `hace ${dias}d`;
    if (horas > 0) return `hace ${horas}h`;
    return 'reciente';
  }
  
  $: indiceActual = obtenerIndiceActual(pedido.estado);
  $: esCancelado = pedido.estado === 'cancelado';
  $: esEntregado = pedido.estado === 'entregado';
  $: coloresActual = obtenerColorEstado(pedido.estado);
</script>

{#if esCancelado}
  <!-- Vista cancelado -->
  <div class="bg-red-50 border-2 border-red-200 rounded-xl p-6">
    <div class="flex items-center gap-4">
      <div class="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center">
        <XCircle class="w-8 h-8 text-red-600" />
      </div>
      <div class="flex-1">
        <h3 class="text-lg font-bold text-red-900">Pedido Cancelado</h3>
        {#if pedido.motivo_cancelacion}
          <p class="text-sm text-red-700 mt-1">{pedido.motivo_cancelacion}</p>
        {/if}
        {#if pedido.created_at}
          <p class="text-xs text-red-600 mt-2">
            Cancelado: {obtenerFechaEstado('cancelado') || new Date(pedido.created_at).toLocaleDateString('es-MX')}
          </p>
        {/if}
      </div>
    </div>
  </div>

{:else if esEntregado}
  <!-- Vista entregado -->
  <div class="bg-green-50 border-2 border-green-200 rounded-xl p-6">
    <div class="flex items-center gap-4">
      <div class="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
        <CheckCircle class="w-8 h-8 text-green-600" />
      </div>
      <div class="flex-1">
        <h3 class="text-lg font-bold text-green-900">Pedido Completado</h3>
        <p class="text-sm text-green-700 mt-1">Tu pedido fue entregado exitosamente</p>
        {#if pedido.calificacion}
          <div class="flex items-center gap-1 mt-2">
            {#each Array(5) as _, i}
              <span class="text-yellow-400">{i < pedido.calificacion ? '★' : '☆'}</span>
            {/each}
          </div>
        {/if}
      </div>
    </div>
  </div>

{:else}
  <!-- Timeline normal -->
  <div class="relative">
    {#if !compacto}
      <!-- Línea de progreso -->
      <div class="absolute top-8 left-0 right-0 h-1 bg-gray-200">
        <div 
          class="h-full bg-primary-500 transition-all duration-500"
          style="width: {indiceActual >= 0 ? ((indiceActual + 1) / FLUJO_NORMAL.length) * 100 : 0}%"
        ></div>
      </div>
    {/if}
    
    <!-- Pasos -->
    <div class="relative flex justify-between {compacto ? 'gap-2' : 'gap-4'}">
      {#each FLUJO_NORMAL as paso, index}
        {@const IconComponent = paso.icon}
        {@const completado = esPasoCompletado(paso.estado, pedido.estado)}
        {@const activo = pedido.estado === paso.estado}
        {@const fecha = obtenerFechaEstado(paso.estado)}
        
        <div class="flex flex-col items-center flex-1 relative z-10">
          <!-- Icono -->
          <div 
            class="w-16 h-16 rounded-full flex items-center justify-center transition-all duration-300 mb-2
                   {completado 
                     ? 'bg-primary-500 text-white shadow-lg shadow-primary-200' 
                     : 'bg-gray-100 text-gray-400 border-2 border-gray-300'}
                   {activo ? 'ring-4 ring-primary-200 scale-110' : ''}"
          >
            <IconComponent class="w-8 h-8" />
            
            {#if activo && !compacto}
              <div class="absolute inset-0 rounded-full bg-primary-500 animate-ping opacity-20"></div>
            {/if}
          </div>
          
          <!-- Label -->
          <div class="text-center">
            <p class="text-sm font-semibold {completado ? 'text-gray-900' : 'text-gray-500'} mb-1">
              {paso.label}
            </p>
            
            {#if mostrarFechas && fecha && completado}
              <p class="text-xs text-gray-500">{fecha}</p>
              {#if activo}
                <p class="text-xs text-primary-600 font-medium mt-1">
                  {tiempoTranscurrido(fecha) || 'En proceso'}
                </p>
              {/if}
            {/if}
            
            {#if !completado && !activo && !compacto}
              <p class="text-xs text-gray-400 italic">Pendiente</p>
            {/if}
          </div>
        </div>
      {/each}
    </div>
    
    <!-- Información adicional del paso activo -->
    {#if !compacto && indiceActual >= 0}
      <div class="mt-6 p-4 bg-gradient-to-r from-primary-50 to-blue-50 border border-primary-200 rounded-xl">
        <div class="flex items-start gap-3">
          <AlertTriangle class="w-5 h-5 text-primary-600 flex-shrink-0 mt-0.5" />
          <div>
            <p class="text-sm font-medium text-primary-900 mb-1">Estado actual:</p>
            <p class="text-sm text-primary-800">
              {CONFIG_ESTADOS[pedido.estado]?.descripcion}
            </p>
            
            {#if pedido.estado === 'confirmado' && !pedido.constancia_pago_url}
              <div class="mt-3 p-3 bg-amber-50 border border-amber-200 rounded-lg">
                <p class="text-sm font-semibold text-amber-900 mb-1">⏳ Acción requerida:</p>
                <p class="text-xs text-amber-800">Sube tu comprobante de pago para continuar</p>
              </div>
            {:else if pedido.estado === 'confirmado' && pedido.estado_pago === 'pendiente_validacion'}
              <div class="mt-3 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                <p class="text-sm font-semibold text-blue-900 mb-1">🔍 En validación:</p>
                <p class="text-xs text-blue-800">Tu comprobante está siendo verificado</p>
              </div>
            {/if}
          </div>
        </div>
      </div>
    {/if}
  </div>
{/if}

<style>
  @keyframes ping {
    75%, 100% {
      transform: scale(2);
      opacity: 0;
    }
  }
  
  .animate-ping {
    animation: ping 2s cubic-bezier(0, 0, 0.2, 1) infinite;
  }
</style>