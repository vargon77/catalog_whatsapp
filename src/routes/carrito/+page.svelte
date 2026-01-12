<!-- src/routes/carrito/+page.svelte -->
<script>
  import { ShoppingCart, Trash2, ArrowLeft, MessageCircle, CheckCircle2, Loader2 } from 'lucide-svelte';
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
          id: item.id,
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
      pedidoId = result.data.numero_pedido;
      pedidoCreado = true;
      
      // 3. Generar y abrir enlace de WhatsApp
      setTimeout(() => {
        const pedidoWhatsApp = {
          numero_pedido: result.data.numero_pedido,
          cliente_nombre: datosCliente.nombre,
          cliente_whatsapp: datosCliente.whatsapp
        };
        
        const url = generarEnlacePedido(pedidoWhatsApp, $carrito, configuracion);
        window.open(url, '_blank');
        
        // 4. Limpiar carrito después de enviar
        setTimeout(() => {
          carrito.limpiarCarrito();
          goto('/?pedido=success');
        }, 1500);
      }, 1000);
      
    } catch (error) {
      console.error('Error creando pedido:', error);
      errorCreandoPedido = error.message;
      enviandoPedido = false;
    }
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
  <!-- Encabezado -->
  <div class="mb-8">
    <a href="/" class="inline-flex items-center text-primary-600 hover:text-primary-800 mb-4 transition-colors">
      <ArrowLeft class="w-4 h-4 mr-2" />
      Volver al catálogo
    </a>
    <h1 class="text-3xl font-bold text-gray-800">Mi Carrito</h1>
    <p class="text-gray-600 mt-2">
      Revisa tu pedido y envíalo por WhatsApp
    </p>
  </div>
  
  {#if pedidoCreado}
    <!-- Confirmación de pedido -->
    <div class="bg-white rounded-xl shadow-sm p-8 text-center">
      <div class="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
        <CheckCircle2 class="w-12 h-12 text-green-600" />
      </div>
      <h2 class="text-2xl font-bold text-gray-800 mb-2">¡Pedido Creado!</h2>
      <p class="text-gray-600 mb-6">
        Tu pedido <strong>{pedidoId}</strong> ha sido registrado exitosamente.
        <br>Se está abriendo WhatsApp para que lo envíes...
      </p>
      <div class="flex items-center justify-center space-x-2 text-primary-600">
        <Loader2 class="w-5 h-5 animate-spin" />
        <span>Redirigiendo a WhatsApp...</span>
      </div>
    </div>
  {:else if $carritoVacio}
    <!-- Carrito Vacío -->
    <div class="text-center py-16 bg-white rounded-xl shadow-sm border-2 border-dashed border-gray-300">
      <div class="max-w-md mx-auto">
        <div class="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-6">
          <ShoppingCart class="w-12 h-12 text-gray-400" />
        </div>
        <h3 class="text-xl font-semibold text-gray-700 mb-2">Tu carrito está vacío</h3>
        <p class="text-gray-500 mb-6">
          Añade productos desde el catálogo para comenzar tu pedido
        </p>
        <a href="/" class="btn-primary inline-flex items-center">
          <ShoppingCart class="w-4 h-4 mr-2" />
          Ver catálogo
        </a>
      </div>
    </div>
  {:else}
    <div class="flex flex-col lg:flex-row gap-8">
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