<!-- src/lib/components/cliente/TimelinePedido.svelte -->
<script>
  import { CheckCircle, Clock, Package, CreditCard, Truck, Home } from 'lucide-svelte';
  import { ESTADOS, CONFIG_ESTADOS } from '$lib/pedidos/estadosCliente';
  
  export let pedido;
  // ✅ MEJOR: Calcular solo cuando pedido.estado cambie
  $: estadoCancelado = pedido.estado === 'cancelado';
  $: esEntregado = pedido.estado === 'entregado';
  
  // ✅ NO hacer llamadas a API en componentes de UI
  // Deja que el padre (página) cargue los datos
  
  const pasos = [
    {
      estado: ESTADOS.PENDIENTE,
      icon: Clock,
      label: 'Pedido Recibido',
      descripcion: 'Tu pedido fue creado exitosamente'
    },
    {
      estado: ESTADOS.CONFIRMADO,
      icon: CheckCircle,
      label: 'Pedido Confirmado',
      descripcion: 'Stock validado y costos agregados'
    },
    {
      estado: ESTADOS.PAGADO,
      icon: CreditCard,
      label: 'Pago Confirmado',
      descripcion: 'Tu pago fue validado correctamente'
    },
    {
      estado: ESTADOS.ENVIADO,
      icon: Truck,
      label: 'En Camino',
      descripcion: 'Tu pedido está en tránsito'
    },
    {
      estado: ESTADOS.RECIBIDO,
      icon: Home,
      label: 'Entregado',
      descripcion: 'Pedido recibido exitosamente'
    }
  ];
  
  function getEstadoIndex(estado) {
    const index = pasos.findIndex(p => p.estado === estado);
    return index !== -1 ? index : -1;
  }
  
  function isPasoCompletado(pasoEstado) {
    const estadosOrden = [
      ESTADOS.PENDIENTE,
      ESTADOS.CONFIRMADO,
      ESTADOS.PAGADO,
      ESTADOS.ENVIADO,
      ESTADOS.RECIBIDO,
      ESTADOS.ENTREGADO
    ];
    
    const currentIndex = estadosOrden.indexOf(pedido.estado);
    const stepIndex = estadosOrden.indexOf(pasoEstado);
    
    return stepIndex <= currentIndex;
  }
  
  function isPasoActivo(pasoEstado) {
    return pedido.estado === pasoEstado;
  }
  
  $: estadoCancelado = pedido.estado === ESTADOS.CANCELADO;
  $: estadoActual = pedido.estado;
  $: configEstadoActual = CONFIG_ESTADOS[estadoActual] || {
    label: estadoActual, // Mostrar el string tal cual
    icon: '📦',
    descripcion: 'Estado del pedido'
  };
  
  // ✅ Si el pedido está cancelado/entregado pero no tiene timeline
  $: esCancelado = estadoActual === ESTADOS.CANCELADO;
  $: esEntregado = estadoActual === ESTADOS.ENTREGADO;

</script>

{#if esCancelado}
  <!-- Vista simplificada para cancelados sin historial -->
  <div class="bg-red-50 border-2 border-red-200 rounded-xl p-6">
    <div class="flex items-center gap-4">
      <div class="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center">
        <svg class="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/>
        </svg>
      </div>
      <div>
        <h4 class="text-lg font-bold text-red-900">Pedido Cancelado</h4>
        <p class="text-sm text-red-700">
          {pedido.motivo_cancelacion || 'Este pedido fue cancelado'}
        </p>
        {#if pedido.created_at}
          <p class="text-xs text-red-600 mt-1">
            Fecha: {new Date(pedido.created_at).toLocaleDateString('es-MX')}
          </p>
        {/if}
      </div>
    </div>
  </div>
  
{:else if esEntregado}
  <!-- Vista simplificada para entregados sin historial -->
  <div class="bg-green-50 border-2 border-green-200 rounded-xl p-6">
    <div class="flex items-center gap-4">
      <div class="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
        <CheckCircle class="w-6 h-6 text-green-600" />
      </div>
      <div>
        <h4 class="text-lg font-bold text-green-900">Pedido Entregado</h4>
        <p class="text-sm text-green-700">Tu pedido fue completado exitosamente</p>
        {#if pedido.fecha_entregado || pedido.created_at}
          <p class="text-xs text-green-600 mt-1">
            Fecha: {new Date(pedido.fecha_entregado || pedido.created_at).toLocaleDateString('es-MX')}
          </p>
        {/if}
      </div>
    </div>
  </div>
  
{:else}
  <!-- Timeline normal -->
  <div class="relative">
    {#each pasos as paso, index}
      {@const completado = isPasoCompletado(paso.estado)}
      {@const activo = isPasoActivo(paso.estado)}
      {@const IconComponent = paso.icon}
      
      <div class="relative pb-8 {index === pasos.length - 1 ? 'pb-0' : ''}">
        <!-- Línea conectora -->
        {#if index < pasos.length - 1}
          <div class="absolute left-6 top-12 w-0.5 h-full {completado ? 'bg-primary-500' : 'bg-gray-200'}"></div>
        {/if}
        
        <!-- Paso -->
        <div class="relative flex items-start gap-4">
          <!-- Icono -->
          <div class="relative z-10">
            <div class="w-12 h-12 rounded-full flex items-center justify-center transition-all {
              completado 
                ? 'bg-primary-500 text-white shadow-lg shadow-primary-200' 
                : 'bg-gray-100 text-gray-400'
            } {
              activo ? 'ring-4 ring-primary-200 scale-110' : ''
            }">
              <IconComponent class="w-6 h-6" />
            </div>
            
            <!-- Pulse animation para paso activo -->
            {#if activo}
              <div class="absolute inset-0 rounded-full bg-primary-500 animate-ping opacity-20"></div>
            {/if}
          </div>
          
          <!-- Contenido -->
          <div class="flex-1 pt-1">
            <div class="flex items-center gap-3 mb-1">
              <h4 class="font-bold text-gray-900 {activo ? 'text-primary-700' : ''}">{paso.label}</h4>
              
              {#if completado && !activo}
                <span class="text-xs text-green-600 flex items-center gap-1">
                  <CheckCircle class="w-3 h-3" />
                  Completado
                </span>
              {:else if activo}
                <span class="text-xs bg-primary-100 text-primary-700 px-2 py-1 rounded-full font-medium animate-pulse">
                  En proceso
                </span>
              {/if}
            </div>
            
            <p class="text-sm text-gray-600">{paso.descripcion}</p>
            
            <!-- Fechas si están disponibles -->
            {#if completado}
              <div class="mt-2 flex items-center gap-2 text-xs text-gray-500">
                <Clock class="w-3 h-3" />
                {#if paso.estado === ESTADOS.PENDIENTE && pedido.created_at}
                  {new Date(pedido.created_at).toLocaleString('es-MX')}
                {:else if paso.estado === ESTADOS.CONFIRMADO && pedido.fecha_confirmado}
                  {new Date(pedido.fecha_confirmado).toLocaleString('es-MX')}
                {:else if paso.estado === ESTADOS.PAGADO && pedido.fecha_pagado}
                  {new Date(pedido.fecha_pagado).toLocaleString('es-MX')}
                {:else if paso.estado === ESTADOS.ENVIADO && pedido.fecha_enviado}
                  {new Date(pedido.fecha_enviado).toLocaleString('es-MX')}
                {:else if paso.estado === ESTADOS.RECIBIDO && pedido.fecha_recibido}
                  {new Date(pedido.fecha_recibido).toLocaleString('es-MX')}
                {/if}
              </div>
            {/if}
            
            <!-- Info adicional para paso activo -->
            {#if activo}
              <div class="mt-3 p-3 bg-primary-50 border border-primary-200 rounded-lg">
                {#if paso.estado === ESTADOS.CONFIRMADO && !pedido.constancia_pago_url}
                  <p class="text-sm text-primary-900 font-medium">
                    ⏳ Esperando que subas tu comprobante de pago
                  </p>
                {:else if paso.estado === ESTADOS.CONFIRMADO && pedido.estado_pago === 'pendiente_validacion'}
                  <p class="text-sm text-primary-900 font-medium">
                    ⏳ Tu comprobante está siendo validado
                  </p>
                {:else if paso.estado === ESTADOS.ENVIADO}
                  <p class="text-sm text-primary-900 font-medium">
                    📦 Tu pedido está en camino. ¡Pronto lo tendrás!
                  </p>
                {/if}
              </div>
            {/if}
          </div>
        </div>
      </div>
    {/each}
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