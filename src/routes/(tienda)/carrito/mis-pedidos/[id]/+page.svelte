<!-- src/routes/(tienda)/carrito/mis-pedidos/[id]/+page.svelte -->
<script>
  import { page } from '$app/stores';
  import { goto } from '$app/navigation';
  import { onMount } from 'svelte';
  import { 
    ArrowLeft, Package, User, Phone, MapPin, Calendar,
    Upload, CheckCircle, AlertCircle, Truck, MessageCircle
  } from 'lucide-svelte';
  import { CONFIG_ESTADOS, obtenerColorEstado } from '$lib/pedidos/estadosCliente';
  import TimelinePedido from '$lib/components/cliente/TimelinePedido.svelte';
  import SubirComprobante from '$lib/components/cliente/SubirComprobante.svelte';
  import ConfirmarRecepcion from '$lib/components/cliente/ConfirmarRecepcion.svelte';
  
  export let data;
  
  let pedido = data.pedido;
  let loading = false;
  let error = '';
  let success = '';
  
  $: colores = obtenerColorEstado(pedido?.estado);
  $: config = CONFIG_ESTADOS[pedido?.estado];
  $: whatsappParam = $page.url.searchParams.get('whatsapp');
  
  async function recargarPedido() {
    loading = true;
    try {
      const res = await fetch(`/api/pedidos/${pedido.id}`);
      const result = await res.json();
      
      if (result.success) {
        pedido = result.data;
      }
    } catch (err) {
      console.error('Error recargando:', err);
    } finally {
      loading = false;
    }
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
  
  function contactarWhatsApp() {
    const tel = data.configuracion?.whatsapp_numero || '';
    const mensaje = `Hola, tengo una consulta sobre mi pedido #${pedido.numero_pedido}`;
    window.open(`https://wa.me/${tel}?text=${encodeURIComponent(mensaje)}`, '_blank');
  }
  
  function volver() {
    goto('/carrito/mis-pedidos' + (whatsappParam ? `?whatsapp=${whatsappParam}` : ''));
  }
</script>

<svelte:head>
  <title>Pedido #{pedido?.numero_pedido} | {data.configuracion?.nombre_empresa || 'CatálogoExpress'}</title>
</svelte:head>

<div class="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
  <div class="max-w-4xl mx-auto px-4 py-8">
    
    <!-- Header con botón volver -->
    <button
      on:click={volver}
      class="mb-6 flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors"
    >
      <ArrowLeft class="w-5 h-5" />
      <span class="font-medium">Volver a mis pedidos</span>
    </button>
    
    {#if pedido}
      <!-- Estado Principal -->
      <div class="bg-white rounded-2xl shadow-lg p-6 mb-6">
        <div class="flex items-start justify-between mb-6">
          <div>
            <div class="flex items-center gap-2 mb-2">
              <span class="text-xs font-semibold text-gray-500">PEDIDO</span>
              <span class="text-2xl font-bold text-gray-900">#{pedido.numero_pedido}</span>
            </div>
            <p class="text-sm text-gray-600">{formatDate(pedido.created_at)}</p>
          </div>
          
          <span class="px-4 py-2 text-sm font-semibold rounded-full {colores.bg} {colores.text} border {colores.border} flex items-center gap-2">
            <span class="text-xl">{config.icon}</span>
            {config.label}
          </span>
        </div>
        
        <div class="bg-gradient-to-r from-primary-50 to-blue-50 rounded-xl p-4">
          <p class="text-sm font-medium text-gray-700 mb-1">Estado actual:</p>
          <p class="text-lg font-semibold text-primary-900">{config.descripcion}</p>
        </div>
      </div>
      
      <!-- Timeline del Pedido -->
      <div class="bg-white rounded-2xl shadow-lg p-6 mb-6">
        <h3 class="text-lg font-bold text-gray-900 mb-6 flex items-center gap-2">
          <Calendar class="w-5 h-5 text-primary-600" />
          Progreso del Pedido
        </h3>
        
        <TimelinePedido {pedido} />
      </div>
      
      <!-- Acciones Disponibles -->
      {#if pedido.estado === 'confirmado' && !pedido.constancia_pago_url}
        <SubirComprobante 
          {pedido} 
          on:success={() => {
            success = 'Comprobante subido correctamente';
            recargarPedido();
          }}
        />
      {:else if pedido.estado === 'confirmado' && pedido.estado_pago === 'rechazado'}
        <div class="bg-red-50 border-2 border-red-200 rounded-2xl p-6 mb-6">
          <div class="flex items-start gap-4">
            <div class="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center flex-shrink-0">
              <AlertCircle class="w-6 h-6 text-red-600" />
            </div>
            <div class="flex-1">
              <h3 class="text-lg font-bold text-red-900 mb-2">Comprobante Rechazado</h3>
              <p class="text-sm text-red-800 mb-4">{pedido.motivo_rechazo_pago}</p>
              <p class="text-sm text-red-700 mb-4">Por favor, sube un nuevo comprobante que cumpla con los requisitos.</p>
              
              <SubirComprobante 
                {pedido} 
                esReenvio={true}
                on:success={() => {
                  success = 'Nuevo comprobante subido';
                  recargarPedido();
                }}
              />
            </div>
          </div>
        </div>
      {:else if pedido.estado === 'enviado'}
        <ConfirmarRecepcion 
          {pedido}
          on:success={() => {
            success = '¡Gracias por confirmar la recepción!';
            recargarPedido();
          }}
        />
      {/if}
      
      <!-- Info del Cliente -->
      <div class="bg-white rounded-2xl shadow-lg p-6 mb-6">
        <h3 class="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
          <User class="w-5 h-5 text-primary-600" />
          Información de Entrega
        </h3>
        
        <div class="space-y-3">
          <div class="flex items-center gap-3">
            <User class="w-5 h-5 text-gray-400" />
            <div>
              <p class="text-xs text-gray-500">Nombre</p>
              <p class="font-medium text-gray-900">{pedido.cliente_nombre}</p>
            </div>
          </div>
          
          <div class="flex items-center gap-3">
            <Phone class="w-5 h-5 text-gray-400" />
            <div>
              <p class="text-xs text-gray-500">WhatsApp</p>
              <p class="font-medium text-gray-900">{pedido.cliente_whatsapp}</p>
            </div>
          </div>
          
          {#if pedido.cliente_direccion}
            <div class="flex items-start gap-3">
              <MapPin class="w-5 h-5 text-gray-400 mt-1" />
              <div>
                <p class="text-xs text-gray-500">Dirección de entrega</p>
                <p class="font-medium text-gray-900">{pedido.cliente_direccion}</p>
              </div>
            </div>
          {/if}
        </div>
      </div>
      
      <!-- Productos -->
      <div class="bg-white rounded-2xl shadow-lg p-6 mb-6">
        <h3 class="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
          <Package class="w-5 h-5 text-primary-600" />
          Productos ({pedido.items?.length || 0})
        </h3>
        
        <div class="space-y-4">
          {#each pedido.items || [] as item}
            <div class="flex items-center gap-4 p-4 bg-gray-50 rounded-xl">
              {#if item.imagen_url}
                <img 
                  src={item.imagen_url} 
                  alt={item.producto_nombre}
                  class="w-20 h-20 object-cover rounded-lg"
                />
              {:else}
                <div class="w-20 h-20 bg-gray-200 rounded-lg flex items-center justify-center">
                  <Package class="w-8 h-8 text-gray-400" />
                </div>
              {/if}
              
              <div class="flex-1">
                <p class="font-semibold text-gray-900">{item.producto_nombre}</p>
                <p class="text-sm text-gray-600">
                  {formatCurrency(item.precio_unitario)} × {item.cantidad}
                </p>
              </div>
              
              <div class="text-right">
                <p class="font-bold text-gray-900">{formatCurrency(item.subtotal)}</p>
              </div>
            </div>
          {/each}
        </div>
      </div>
      
      <!-- Resumen de Pago -->
      <div class="bg-white rounded-2xl shadow-lg p-6 mb-6">
        <h3 class="text-lg font-bold text-gray-900 mb-4">Resumen del Pedido</h3>
        
        <div class="space-y-3">
          <div class="flex justify-between text-gray-700">
            <span>Subtotal:</span>
            <span class="font-medium">{formatCurrency(pedido.subtotal)}</span>
          </div>
          
          {#if pedido.impuesto > 0}
            <div class="flex justify-between text-gray-700">
              <span>IVA:</span>
              <span class="font-medium">{formatCurrency(pedido.impuesto)}</span>
            </div>
          {/if}
          
          {#if pedido.costo_envio > 0}
            <div class="flex justify-between text-gray-700">
              <span>Envío:</span>
              <span class="font-medium">{formatCurrency(pedido.costo_envio)}</span>
            </div>
          {/if}
          
          <div class="border-t-2 border-gray-200 pt-3 flex justify-between">
            <span class="text-xl font-bold text-gray-900">Total:</span>
            <span class="text-2xl font-bold text-primary-700">{formatCurrency(pedido.total)}</span>
          </div>
        </div>
      </div>
      
      <!-- Guía de Envío -->
      {#if pedido.guia_envio}
        <div class="bg-white rounded-2xl shadow-lg p-6 mb-6">
          <h3 class="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
            <Truck class="w-5 h-5 text-primary-600" />
            Información de Envío
          </h3>
          
          <div class="space-y-3">
            <div class="flex justify-between">
              <span class="text-gray-700">Paquetería:</span>
              <span class="font-semibold text-gray-900">{pedido.guia_envio.paqueteria}</span>
            </div>
            
            {#if pedido.guia_envio.numero}
              <div class="flex justify-between">
                <span class="text-gray-700">Número de guía:</span>
                <span class="font-mono font-semibold text-gray-900">{pedido.guia_envio.numero}</span>
              </div>
            {/if}
            
            {#if pedido.guia_envio.url_rastreo}
              <a
                href={pedido.guia_envio.url_rastreo}
                target="_blank"
                class="block w-full text-center py-3 bg-primary-600 text-white rounded-xl hover:bg-primary-700 transition-colors font-medium"
              >
                🔍 Rastrear mi pedido
              </a>
            {/if}
          </div>
        </div>
      {/if}
      
      <!-- Botón de Ayuda -->
      <button
        on:click={contactarWhatsApp}
        class="w-full bg-green-600 text-white rounded-2xl py-4 hover:bg-green-700 transition-all shadow-lg flex items-center justify-center gap-3 font-semibold text-lg"
      >
        <MessageCircle class="w-6 h-6" />
        ¿Necesitas ayuda? Contáctanos por WhatsApp
      </button>
      
    {:else}
      <!-- Error loading -->
      <div class="bg-white rounded-2xl shadow-lg p-12 text-center">
        <AlertCircle class="w-16 h-16 text-red-500 mx-auto mb-4" />
        <h3 class="text-xl font-semibold text-gray-900 mb-2">Pedido no encontrado</h3>
        <p class="text-gray-600 mb-6">No pudimos cargar la información de este pedido</p>
        <button on:click={volver} class="btn-primary">
          Volver a mis pedidos
        </button>
      </div>
    {/if}
    
    <!-- Mensajes -->
    {#if success}
      <div class="fixed bottom-4 right-4 bg-green-500 text-white px-6 py-4 rounded-xl shadow-lg animate-slide-in">
        <div class="flex items-center gap-3">
          <CheckCircle class="w-5 h-5" />
          <span class="font-medium">{success}</span>
        </div>
      </div>
    {/if}
  </div>
</div>

<style>
  @keyframes slide-in {
    from {
      transform: translateX(100%);
      opacity: 0;
    }
    to {
      transform: translateX(0);
      opacity: 1;
    }
  }
  
  .animate-slide-in {
    animation: slide-in 0.3s ease-out;
  }
</style>