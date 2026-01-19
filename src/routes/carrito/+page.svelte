<!-- src/routes/carrito/+page.svelte -->
<script>
  import { ShoppingCart, Trash2, ArrowLeft, MessageCircle, CheckCircle2, Loader2, Package, ClipboardList } from 'lucide-svelte';
  import { carrito, carritoVacio } from '$lib/stores/carritoStore';
  import CartItem from '$lib/components/cart/CartItem.svelte';
  import { generarEnlacePedido } from '$lib/utils/whatsapp';
  import ImageUploader from '$lib/components/ui/ImageUploader.svelte';
  import { goto } from '$app/navigation';
  
  export let data;
  
  // Configuración desde el servidor
  $: configuracion = data.configuracion;
  
  // Estados del pedido
  let requiereFactura = false;
  let requiereEnvio = false;
  let metodoPago = '';
  let costoEnvio = 0;
  let urlConstancia = '';
  
  // Función para calcular totales
  function calcularTotalesPedido(items, factura, envio, costoEnvioParam, impuestoPorcentaje) {
    const subtotal = items.reduce((total, item) => 
      total + (item.precio_unitario * item.cantidad), 0
    );
    
    const impuesto = factura ? (subtotal * (impuestoPorcentaje / 100)) : 0;
    const costo_envio = envio ? parseFloat(costoEnvioParam || 0) : 0;
    const total = subtotal + impuesto + costo_envio;
    
    return { subtotal, impuesto, costo_envio, total };
  }
  
  // Calcular totales reactivamente
  $: totales = calcularTotalesPedido(
    $carrito,
    requiereFactura,
    requiereEnvio,
    costoEnvio,
    configuracion?.impuesto_porcentaje || 16
  );

  $: ({ subtotal, impuesto, costo_envio, total } = totales);
  
  // Datos del cliente
  let datosCliente = {
    nombre: '',
    whatsapp: '',
    email: '',
    direccion: '',
    notas: ''
  };
  
  // Estados de UI
  let enviandoPedido = false;
  let pedidoCreado = false;
  let errorCreandoPedido = '';
  let pedidoId = null;
  let numeroPedidoCreado = null;
  
  // Validar formulario
  $: formularioValido = datosCliente.nombre.trim() !== '' && 
                        datosCliente.whatsapp.trim() !== '';
  
  // Función para crear pedido en BD y enviar por WhatsApp
  async function crearYEnviarPedido() {
    if (!formularioValido || $carritoVacio || enviandoPedido) return;
    
    enviandoPedido = true;
    errorCreandoPedido = '';
    
    try {
      // 1. Crear pedido en Supabase
      const pedidoData = {
        items: $carrito.map(item => ({
          producto_id: item.id,
          nombre: item.nombre,
          sku: item.sku,
          cantidad: item.cantidad,
          precio_unitario: item.precio_unitario,
          imagen_url: item.imagen_url 
        })),
        cliente_nombre: datosCliente.nombre,
        cliente_whatsapp: datosCliente.whatsapp,
        cliente_email: datosCliente.email || null,
        cliente_direccion: datosCliente.direccion || null,
        subtotal: subtotal,
        impuesto: impuesto,
        costo_envio: costo_envio,
        total: total,
        notas: datosCliente.notas || null,
        factura: requiereFactura,
        envio: requiereEnvio,
        metodo_pago: metodoPago || null,
        constancia_pago_url: urlConstancia || null
      };
      
      const response = await fetch('/api/pedidos', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(pedidoData)
      });
      
      const result = await response.json();
      
      if (!result.success) {
        throw new Error(result.error || 'Error creando el pedido');
      }
      
      // 2. Pedido creado exitosamente
      pedidoId = result.data.id;
      numeroPedidoCreado = result.data.numero_pedido;
      pedidoCreado = true;
      carrito.limpiarCarrito();
      // 3. Generar y abrir enlace de WhatsApp
      setTimeout(() => {
        const pedidoWhatsApp = {
          numero_pedido: result.data.numero_pedido,
          cliente_nombre: datosCliente.nombre,
          cliente_whatsapp: datosCliente.whatsapp
        };
        
        const url = generarEnlacePedido(pedidoWhatsApp, $carrito, configuracion);
        window.open(url, '_blank');
        
        // NO limpiar carrito inmediatamente, esperar a que vaya a seguimiento
      }, 1000);
      
    } catch (error) {
      console.error('Error creando pedido:', error);
      errorCreandoPedido = error.message;
      enviandoPedido = false;
    }
  }
  
  // Función para ir a seguimiento del pedido creado
  function irASeguimiento() {
    const whatsapp = datosCliente.whatsapp;
    carrito.limpiarCarrito();
    goto(`/carrito/mis-pedidos?whatsapp=${encodeURIComponent(whatsapp)}`);
  }
  
  // Función para limpiar el carrito
  function limpiarCarrito() {
    if (confirm('¿Estás seguro de vaciar el carrito?')) {
      carrito.limpiarCarrito();
    }
  }
</script>

<svelte:head>
  <title>Mi Carrito - {configuracion?.nombre_empresa || 'CatálogoExpress'}</title>
</svelte:head>

<div class="max-w-6xl mx-auto">
  <!-- ============================================ -->
  <!-- OPCIÓN 1: HEADER CON BOTÓN DESTACADO (RECOMENDADA) -->
  <!-- ============================================ -->
  <div class="mb-8">
    <a href="/" class="inline-flex items-center text-primary-600 hover:text-primary-800 mb-4 transition-colors">
      <ArrowLeft class="w-4 h-4 mr-2" />
      Volver al catálogo
    </a>
    
    <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
      <div>
        <h1 class="text-3xl font-bold text-gray-800 flex items-center gap-3">
          <ShoppingCart class="w-8 h-8 text-primary-600" />
          Mi Carrito
        </h1>
        <p class="text-gray-600 mt-2">
          Revisa tu pedido y envíalo por WhatsApp
        </p>
      </div>
      
      <!-- ✨ BOTÓN MIS PEDIDOS - SIEMPRE VISIBLE -->
      <a 
        href="(tenda)/carrito/mis-pedidos"
        class="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-primary-600 to-primary-700 text-white rounded-xl hover:from-primary-700 hover:to-primary-800 transition-all shadow-lg shadow-primary-200 font-semibold group"
      >
        <ClipboardList class="w-5 h-5 group-hover:scale-110 transition-transform" />
        <span>Seguir Mis Pedidos</span>
      </a>
    </div>
  </div>
  
  {#if pedidoCreado}
    <!-- ============================================ -->
    <!-- CONFIRMACIÓN CON BOTÓN DE SEGUIMIENTO -->
    <!-- ============================================ -->
    <div class="bg-gradient-to-br from-green-50 to-emerald-50 rounded-2xl shadow-xl p-8 border-2 border-green-200">
      <div class="max-w-2xl mx-auto text-center">
        <div class="w-24 h-24 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6 animate-bounce-slow">
          <CheckCircle2 class="w-14 h-14 text-green-600" />
        </div>
        
        <h2 class="text-3xl font-bold text-gray-900 mb-3">¡Pedido Creado Exitosamente! 🎉</h2>
        
        <div class="bg-white rounded-xl p-4 mb-6 inline-block">
          <p class="text-sm text-gray-600 mb-1">Número de Pedido</p>
          <p class="text-2xl font-bold text-primary-700">#{numeroPedidoCreado}</p>
        </div>
        
        <p class="text-gray-700 mb-8 text-lg">
          Se está abriendo WhatsApp con tu pedido...
        </p>
        
        <div class="bg-blue-50 border-2 border-blue-200 rounded-xl p-6 mb-8">
          <div class="flex items-start gap-4">
            <div class="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
              <ClipboardList class="w-6 h-6 text-blue-600" />
            </div>
            <div class="text-left flex-1">
              <h3 class="font-bold text-blue-900 mb-2 text-lg">📱 Próximos Pasos:</h3>
              <ol class="text-sm text-blue-800 space-y-2">
                <li class="flex items-start gap-2">
                  <span class="font-bold">1.</span>
                  <span>Envía el mensaje de WhatsApp que se acaba de abrir</span>
                </li>
                <li class="flex items-start gap-2">
                  <span class="font-bold">2.</span>
                  <span>Ve al seguimiento de pedidos para ver el estado en tiempo real</span>
                </li>
                <li class="flex items-start gap-2">
                  <span class="font-bold">3.</span>
                  <span>Cuando te lo indiquemos, sube tu comprobante de pago</span>
                </li>
              </ol>
            </div>
          </div>
        </div>
        
        <div class="flex flex-col sm:flex-row gap-4 justify-center">
          <button
            on:click={irASeguimiento}
            class="btn-primary flex items-center justify-center gap-2 text-lg px-8 py-4 bg-primary-600 hover:bg-primary-700"
          >
            <Package class="w-6 h-6" />
            Ver Estado de mi Pedido
          </button>
          
          <a
            href="/"
            class="btn-secondary flex items-center justify-center gap-2 text-lg px-8 py-4"
          >
            <ShoppingCart class="w-6 h-6" />
            Seguir Comprando
          </a>
        </div>
      </div>
    </div>
    
  {:else if $carritoVacio}
    <!-- ============================================ -->
    <!-- CARRITO VACÍO CON CALL-TO-ACTION -->
    <!-- ============================================ -->
    <div class="text-center py-16 bg-gradient-to-br from-gray-50 to-gray-100 rounded-2xl shadow-lg border-2 border-gray-200">
      <div class="max-w-md mx-auto">
        <div class="w-32 h-32 bg-gradient-to-br from-gray-100 to-gray-200 rounded-full flex items-center justify-center mx-auto mb-6">
          <ShoppingCart class="w-16 h-16 text-gray-400" />
        </div>
        
        <h3 class="text-2xl font-bold text-gray-800 mb-3">Tu carrito está vacío</h3>
        <p class="text-gray-600 mb-8 text-lg">
          Añade productos desde el catálogo para comenzar tu pedido
        </p>
        
        <!-- ============================================ -->
        <!-- OPCIÓN 2: CARDS CON ACCIONES -->
        <!-- ============================================ -->
        <div class="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
          <!-- Card: Ir a catálogo -->
          <a 
            href="/"
            class="bg-white rounded-xl p-6 shadow-md hover:shadow-xl transition-all border-2 border-gray-200 hover:border-primary-500 group"
          >
            <div class="w-16 h-16 bg-primary-100 rounded-full flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform">
              <ShoppingCart class="w-8 h-8 text-primary-600" />
            </div>
            <h4 class="font-bold text-gray-900 mb-2">Ver Catálogo</h4>
            <p class="text-sm text-gray-600">Explora nuestros productos</p>
          </a>
          
          <!-- Card: Mis Pedidos -->
          <a 
            href="/carrito/mis-pedidos"
            class="bg-gradient-to-br from-primary-50 to-primary-100 rounded-xl p-6 shadow-md hover:shadow-xl transition-all border-2 border-primary-300 hover:border-primary-500 group"
          >
            <div class="w-16 h-16 bg-primary-500 rounded-full flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform">
              <ClipboardList class="w-8 h-8 text-white" />
            </div>
            <h4 class="font-bold text-primary-900 mb-2">Mis Pedidos</h4>
            <p class="text-sm text-primary-700">Consulta el estado de tus compras</p>
          </a>
        </div>
        
        <!-- Banner informativo -->
        <div class="bg-blue-50 border-2 border-blue-200 rounded-xl p-4 text-left">
          <div class="flex items-start gap-3">
            <div class="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0 mt-1">
              <ClipboardList class="w-4 h-4 text-blue-600" />
            </div>
            <div>
              <h4 class="font-semibold text-blue-900 text-sm mb-1">💡 ¿Ya hiciste un pedido?</h4>
              <p class="text-xs text-blue-700">
                Ingresa tu número de WhatsApp en "Mis Pedidos" para ver el estado, subir comprobantes y más.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
    
  {:else}
    <!-- Formulario existente del carrito -->
    <div class="flex flex-col lg:flex-row gap-8">
      <!-- ... resto del código del carrito ... -->
      <!-- (Mantén todo el código existente) -->
      
      <!-- Lista de Productos -->
      <div class="lg:w-2/3 space-y-6">
        <div class="bg-white rounded-xl shadow-sm overflow-hidden">
          <!-- Encabezado -->
          <div class="bg-gray-50 px-6 py-4 border-b border-gray-200">
            <div class="flex justify-between items-center">
              <h2 class="font-semibold text-gray-700">
                Productos ({$carrito.reduce((total, item) => total + item.cantidad, 0)} items)
              </h2>
              <button
                on:click={limpiarCarrito}
                class="text-sm text-red-600 hover:text-red-800 flex items-center transition-colors"
                disabled={enviandoPedido}
              >
                <Trash2 class="w-4 h-4 mr-1" />
                Vaciar carrito
              </button>
            </div>
          </div>
          
          <!-- Items -->
          <div class="divide-y divide-gray-100">
            {#each $carrito as item (item.id)}
              <CartItem {item} disabled={enviandoPedido} />
            {/each}
          </div>
        </div>
        
        <!-- Formulario de datos del cliente -->
        <div class="bg-white rounded-xl shadow-sm overflow-hidden">
          <div class="p-6 bg-gray-50">
            <h3 class="font-medium text-gray-700 mb-4">Información de contacto</h3>
            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label class="label">
                  Tu nombre <span class="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  bind:value={datosCliente.nombre}
                  placeholder="Ej: Juan Pérez"
                  class="input"
                  disabled={enviandoPedido}
                  required
                />
              </div>
              <div>
                <label class="label">
                  Tu WhatsApp <span class="text-red-500">*</span>
                </label>
                <input
                  type="tel"
                  bind:value={datosCliente.whatsapp}
                  placeholder="Ej: 7121920418"
                  class="input"
                  disabled={enviandoPedido}
                  required
                />
              </div>
             
              <div>
                <label class="label">Dirección (opcional)</label>
                <input
                  type="text"
                  bind:value={datosCliente.direccion}
                  placeholder="Ej: Calle Principal 123"
                  class="input"
                  disabled={enviandoPedido}
                />
              </div>
            </div>
          </div>
        </div>

        <!-- FACTURACION, ENVIO Y FORMAS DE PAGO -->
        <div class="bg-white rounded-xl shadow-sm overflow-hidden">
          <div class="p-6 space-y-4">
            <h3 class="font-medium text-gray-700 mb-4">Opciones del Pedido</h3>
            
            <!-- Facturación -->
            {#if configuracion?.facturacion_visible}
              <label class="flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  bind:checked={requiereFactura}
                  disabled={!configuracion?.facturacion_disponible || enviandoPedido}
                  class="w-4 h-4 text-primary-600 border-gray-300 rounded focus:ring-primary-500"
                />
                <span class="ml-2 text-sm text-gray-700">
                  Requiero factura (+{configuracion?.impuesto_porcentaje || 16}% IVA)
                </span>
              </label>
            {/if}
            
            <!-- Envío -->
            {#if configuracion?.envio_visible}
              <label class="flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  bind:checked={requiereEnvio}
                  disabled={!configuracion?.envio_disponible || enviandoPedido}
                  class="w-4 h-4 text-primary-600 border-gray-300 rounded focus:ring-primary-500"
                />
                <span class="ml-2 text-sm text-gray-700">
                  Requiero envío a domicilio
                </span>
              </label>
              
              {#if requiereEnvio}
                <div class="ml-6 mt-2">
                  <label class="label text-xs">Costo de envío (estimado)</label>
                  <input
                    type="number"
                    bind:value={costoEnvio}
                    min="0"
                    step="0.01"
                    class="input text-sm"
                    placeholder="0.00"
                    disabled={enviandoPedido}
                  />
                  <p class="text-xs text-gray-500 mt-1">
                    Se confirmará el costo final por WhatsApp
                  </p>
                </div>
              {/if}
            {/if}
            
            <!-- Método de pago -->
            <div class="mt-4">
              <label class="label text-sm mb-2">Método de Pago</label>
              <div class="space-y-2">
                {#if configuracion?.pago_deposito_visible}
                  <label class="flex items-center cursor-pointer">
                    <input
                      type="radio"
                      bind:group={metodoPago}
                      value="deposito"
                      disabled={!configuracion?.pago_deposito_disponible || enviandoPedido}
                      class="w-4 h-4 text-primary-600"
                    />
                    <span class="ml-2 text-sm text-gray-700">Depósito bancario</span>
                  </label>
                {/if}
                
                {#if configuracion?.pago_transferencia_visible}
                  <label class="flex items-center cursor-pointer">
                    <input
                      type="radio"
                      bind:group={metodoPago}
                      value="transferencia"
                      disabled={!configuracion?.pago_transferencia_disponible || enviandoPedido}
                      class="w-4 h-4 text-primary-600"
                    />
                    <span class="ml-2 text-sm text-gray-700">Transferencia electrónica</span>
                  </label>
                {/if}
              </div>
            </div>
            
            <!-- Datos bancarios (si seleccionó método) -->
            {#if metodoPago && configuracion?.cuentas_pago}
              {@const cuentas = typeof configuracion.cuentas_pago === 'string' 
                ? JSON.parse(configuracion.cuentas_pago) 
                : configuracion.cuentas_pago}
              
              {#if Array.isArray(cuentas) && cuentas.length > 0}
                <div class="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                  <p class="text-sm font-medium text-blue-900 mb-2">
                    Datos para {metodoPago === 'deposito' ? 'Depósito' : 'Transferencia'}:
                  </p>
                  {#each cuentas as cuenta}
                    <div class="text-xs text-blue-800 space-y-1 mb-3 border-b border-blue-200 pb-2 last:border-0">
                      <p><strong>Banco:</strong> {cuenta.banco}</p>
                      <p><strong>Titular:</strong> {cuenta.titular}</p>
                      <p><strong>Cuenta:</strong> {cuenta.numero_cuenta}</p>
                      {#if cuenta.clabe}
                        <p><strong>CLABE:</strong> {cuenta.clabe}</p>
                      {/if}
                      {#if cuenta.referencia}
                        <p><strong>Referencia:</strong> {cuenta.referencia}</p>
                      {/if}
                    </div>
                  {/each}
                </div>
              {/if}
            {/if}
            
            <!-- Subir constancia de pago -->
            {#if metodoPago}
              <div class="mt-4">
                <label class="label text-sm mb-2">
                  Constancia de Pago (opcional)
                </label>
                <ImageUploader
                  bind:imageUrl={urlConstancia}
                  label=""
                  disabled={enviandoPedido}
                  on:upload={(e) => urlConstancia = e.detail.url}
                  on:remove={() => urlConstancia = ''}
                />
                <p class="text-xs text-gray-500 mt-1">
                  Puedes adjuntar tu comprobante o enviarlo después por WhatsApp
                </p>
              </div>
            {/if}
          </div>
        </div>
      </div>
      
      <!-- Resumen del Pedido -->
      <div class="lg:w-1/3">
        <div class="bg-white rounded-xl shadow-sm p-6 sticky top-24">
          <h2 class="text-xl font-bold text-gray-800 mb-6">Resumen del Pedido</h2>
          
          <!-- Detalles -->
          <div class="space-y-3 mb-6">
            <div class="flex justify-between text-gray-600">
              <span>Subtotal ({$carrito.length} productos)</span>
              <span class="font-medium">{configuracion?.moneda_simbolo || '$'}{subtotal.toFixed(2)}</span>
            </div>
            
            {#if requiereFactura}
              <div class="flex justify-between text-gray-600">
                <span>IVA ({configuracion?.impuesto_porcentaje || 16}%)</span>
                <span class="font-medium">{configuracion?.moneda_simbolo || '$'}{impuesto.toFixed(2)}</span>
              </div>
            {/if}
            
            {#if requiereEnvio}
              <div class="flex justify-between text-gray-600">
                <span>Envío</span>
                <span class="font-medium">{configuracion?.moneda_simbolo || '$'}{costo_envio.toFixed(2)}</span>
              </div>
            {/if}
            
            <div class="border-t border-gray-200 pt-3">
              <div class="flex justify-between text-lg font-bold">
                <span>Total</span>
                <span class="text-primary-700">{configuracion?.moneda_simbolo || '$'}{total.toFixed(2)}</span>
              </div>
            </div>
          </div>
          
          <!-- Errores -->
          {#if errorCreandoPedido}
            <div class="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
              <p class="text-sm text-red-700">{errorCreandoPedido}</p>
            </div>
          {/if}
          
          <!-- Botón de envío -->
          <button
            on:click={crearYEnviarPedido}
            disabled={!formularioValido || enviandoPedido}
            class="w-full btn-primary flex items-center justify-center gap-2 mb-4 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {#if enviandoPedido}
              <Loader2 class="w-5 h-5 animate-spin" />
              Creando pedido...
            {:else}
              <MessageCircle class="w-5 h-5" />
              Crear y enviar por WhatsApp
            {/if}
          </button>
          
          {#if !formularioValido}
            <p class="text-xs text-amber-600 text-center mb-4">
              * Completa tu nombre y WhatsApp para continuar
            </p>
          {/if}
          
          <!-- Información -->
          <div class="text-sm text-gray-500 border-t border-gray-100 pt-4 space-y-2">
            <p class="font-medium text-gray-700">¿Cómo funciona?</p>
            <ol class="list-decimal pl-4 space-y-1">
              <li>Tu pedido se guardará en nuestro sistema</li>
              <li>Se abrirá WhatsApp con tu pedido listo</li>
              <li>Envía el mensaje y te contactaremos</li>
              <li>Coordinaremos pago y entrega</li>
            </ol>
          </div>
          
          <!-- Seguridad -->
          <div class="mt-4 pt-4 border-t border-gray-100">
            <div class="flex items-center gap-2 text-xs text-gray-500">
              <CheckCircle2 class="w-4 h-4 text-green-500" />
              <span>Pedido seguro • Sin cargos automáticos</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  {/if}
</div>

<style>
  @keyframes bounce-slow {
    0%, 100% {
      transform: translateY(0);
    }
    50% {
      transform: translateY(-10px);
    }
  }
  
  .animate-bounce-slow {
    animation: bounce-slow 2s ease-in-out infinite;
  }
</style>