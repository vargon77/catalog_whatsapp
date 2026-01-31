<!-- src/lib/components/pedidos/ModalGuiaEnvio.svelte -->
<!-- ✅ MODAL PARA CAPTURAR DATOS DE ENVÍO (ADMIN) -->

<script>
  import { createEventDispatcher } from 'svelte';
  import { Truck, Loader2, Package, MapPin, Calendar, AlertCircle, CheckCircle } from 'lucide-svelte';
  
  export let pedido;
  
  const dispatch = createEventDispatcher();
  let loading = false;
  let error = '';
  
  // Paqueterías principales en México
  const PAQUETERIAS = [
    { value: 'DHL', label: 'DHL Express' },
    { value: 'Fedex', label: 'FedEx' },
    { value: 'Estafeta', label: 'Estafeta' },
    { value: 'Redpack', label: 'Redpack' },
    { value: 'Paquetexpress', label: 'Paquetexpress' },
    { value: '99Minutos', label: '99 Minutos' },
    { value: 'UPS', label: 'UPS' },
    { value: 'Correos de México', label: 'Correos de México' },
    { value: 'Entrega Local', label: '🚗 Entrega Local (Sin guía)' },
    { value: 'Otra', label: 'Otra paquetería' }
  ];
  
  // Datos de la guía
  let guiaEnvio = {
    paqueteria: '',
    numero_guia: '',
    url_rastreo: '',
    notas: ''
  };
  
  let esEntregaLocal = false;
  let paqueteriaOtra = '';
  
  // Plantillas de URL de rastreo
  const PLANTILLAS_RASTREO = {
    'DHL': 'https://www.dhl.com.mx/es/express/rastreo.html?AWB={{guia}}&brand=DHL',
    'Fedex': 'https://www.fedex.com/fedextrack/?trknbr={{guia}}',
    'Estafeta': 'https://www.estafeta.com/Rastreo/?numero={{guia}}',
    'Redpack': 'https://www.redpack.com.mx/es/rastreo/?guias={{guia}}',
    'UPS': 'https://www.ups.com/track?tracknum={{guia}}',
    'Correos de México': 'https://www.correosdemexico.gob.mx/SSLServicios/RastreoMultiple/Rastreo.aspx?data={{guia}}'
  };
  
  function generarURLRastreo() {
    if (!guiaEnvio.paqueteria || !guiaEnvio.numero_guia || esEntregaLocal) return;
    
    const plantilla = PLANTILLAS_RASTREO[guiaEnvio.paqueteria];
    if (plantilla) {
      guiaEnvio.url_rastreo = plantilla.replace('{{guia}}', guiaEnvio.numero_guia);
    }
  }
  
  function handlePaqueteriaChange() {
    esEntregaLocal = guiaEnvio.paqueteria === 'Entrega Local';
    
    if (esEntregaLocal) {
      guiaEnvio.numero_guia = 'LOCAL';
      guiaEnvio.url_rastreo = '';
    } else if (guiaEnvio.numero_guia === 'LOCAL') {
      guiaEnvio.numero_guia = '';
    }
    
    generarURLRastreo();
  }
  
  async function marcarComoEnviado() {
    error = '';
    
    // Validaciones
    if (!guiaEnvio.paqueteria) {
      error = 'Selecciona la paquetería';
      return;
    }
    
    if (guiaEnvio.paqueteria === 'Otra' && !paqueteriaOtra.trim()) {
      error = 'Especifica el nombre de la paquetería';
      return;
    }
    
    if (!esEntregaLocal && !guiaEnvio.numero_guia.trim()) {
      error = 'Ingresa el número de guía';
      return;
    }
    
    loading = true;
    
    try {
      const datosEnvio = {
        guia_envio: {
          paqueteria: guiaEnvio.paqueteria === 'Otra' ? paqueteriaOtra.trim() : guiaEnvio.paqueteria,
          numero_guia: esEntregaLocal ? 'LOCAL' : guiaEnvio.numero_guia.trim(),
          url_rastreo: guiaEnvio.url_rastreo.trim() || null,
          notas: guiaEnvio.notas.trim() || null
        },
        es_entrega_local: esEntregaLocal
      };
      
      const res = await fetch(`/api/pedidos/${pedido.id}/marcar-enviado`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(datosEnvio)
      });
      
      const result = await res.json();
      
      if (!result.success) {
        throw new Error(result.error);
      }
      
      alert('✅ ' + result.message);
      dispatch('close');
      
    } catch (err) {
      error = err.message;
    } finally {
      loading = false;
    }
  }
  
  $: if (guiaEnvio.paqueteria && guiaEnvio.numero_guia && !esEntregaLocal) {
    generarURLRastreo();
  }
</script>

<!-- Modal Backdrop -->
<div class="fixed inset-0 z-50 overflow-y-auto">
  <div class="flex items-center justify-center min-h-screen px-4 py-4">
    <!-- Backdrop -->
    <div 
      class="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity"
      on:click={() => dispatch('close')}
    ></div>

    <!-- Modal -->
    <div class="relative bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
      <!-- Header -->
      <div class="px-6 py-4 border-b border-gray-200 bg-indigo-50 sticky top-0 z-10">
        <div class="flex items-center gap-3">
          <div class="w-12 h-12 bg-indigo-100 rounded-full flex items-center justify-center">
            <Truck class="w-6 h-6 text-indigo-600" />
          </div>
          <div>
            <h3 class="text-lg font-semibold text-gray-900">Marcar como Enviado</h3>
            <p class="text-sm text-gray-600">Pedido #{pedido.numero_pedido}</p>
          </div>
        </div>
      </div>

      <!-- Content -->
      <div class="px-6 py-4 space-y-4">
        
        <!-- Info del pedido y dirección -->
        <div class="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-lg p-4 border border-indigo-200">
          <h4 class="font-semibold text-indigo-900 mb-3 flex items-center gap-2">
            <MapPin class="w-4 h-4" />
            Información de Entrega
          </h4>
          
          <div class="space-y-2 text-sm">
            <div class="flex gap-2">
              <span class="text-indigo-600 font-medium">Para:</span>
              <span class="text-indigo-900">{pedido.cliente_direccion?.nombre_destinatario || pedido.cliente_nombre}</span>
            </div>
            
            {#if pedido.cliente_direccion}
              <div class="flex gap-2">
                <span class="text-indigo-600 font-medium">Dirección:</span>
                <span class="text-indigo-900">
                  {pedido.cliente_direccion.calle} {pedido.cliente_direccion.numero_exterior}
                  {pedido.cliente_direccion.numero_interior ? `, Int. ${pedido.cliente_direccion.numero_interior}` : ''}
                </span>
              </div>
              
              <div class="flex gap-2">
                <span class="text-indigo-600 font-medium">Colonia:</span>
                <span class="text-indigo-900">{pedido.cliente_direccion.colonia}</span>
              </div>
              
              <div class="flex gap-2">
                <span class="text-indigo-600 font-medium">CP:</span>
                <span class="text-indigo-900">
                  {pedido.cliente_direccion.codigo_postal} - {pedido.cliente_direccion.ciudad}, {pedido.cliente_direccion.estado}
                </span>
              </div>
              
              <div class="flex gap-2">
                <span class="text-indigo-600 font-medium">Teléfono:</span>
                <span class="text-indigo-900">{pedido.cliente_direccion.telefono}</span>
              </div>
              
              {#if pedido.cliente_direccion.referencias}
                <div class="flex gap-2">
                  <span class="text-indigo-600 font-medium">Referencias:</span>
                  <span class="text-indigo-900">{pedido.cliente_direccion.referencias}</span>
                </div>
              {/if}
            {:else}
              <div class="bg-amber-50 border border-amber-200 rounded p-3">
                <p class="text-amber-800 text-sm">
                  ⚠️ Este pedido no tiene dirección registrada (pedido antiguo o sin envío)
                </p>
              </div>
            {/if}
            
            <div class="flex gap-2 pt-2 border-t border-indigo-200">
              <span class="text-indigo-600 font-medium">Total:</span>
              <span class="text-indigo-900 font-bold">${pedido.total?.toFixed(2) || '0.00'}</span>
            </div>
          </div>
        </div>
        
        <!-- Formulario de guía -->
        <div class="space-y-4">
          
          <!-- Paquetería -->
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">
              Paquetería <span class="text-red-500">*</span>
            </label>
            <select
              bind:value={guiaEnvio.paqueteria}
              on:change={handlePaqueteriaChange}
              class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            >
              <option value="">Selecciona una opción...</option>
              {#each PAQUETERIAS as paqueteria}
                <option value={paqueteria.value}>{paqueteria.label}</option>
              {/each}
            </select>
          </div>
          
          <!-- Si eligió "Otra" -->
          {#if guiaEnvio.paqueteria === 'Otra'}
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-2">
                Nombre de la paquetería <span class="text-red-500">*</span>
              </label>
              <input
                type="text"
                bind:value={paqueteriaOtra}
                placeholder="Ej: Uber, Didi, Mensajería local..."
                class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              />
            </div>
          {/if}
          
          <!-- Número de guía (no mostrar si es local) -->
          {#if !esEntregaLocal}
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-2">
                Número de guía <span class="text-red-500">*</span>
              </label>
              <input
                type="text"
                bind:value={guiaEnvio.numero_guia}
                on:input={generarURLRastreo}
                placeholder="Ej: 123456789"
                class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent font-mono"
              />
              <p class="text-xs text-gray-500 mt-1">
                Número de rastreo proporcionado por la paquetería
              </p>
            </div>
            
            <!-- URL de rastreo -->
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-2">
                URL de rastreo
              </label>
              <input
                type="url"
                bind:value={guiaEnvio.url_rastreo}
                placeholder="https://..."
                class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-sm"
              />
              <p class="text-xs text-gray-500 mt-1">
                {#if guiaEnvio.url_rastreo}
                  ✅ URL generada automáticamente
                {:else}
                  Se generará automáticamente al ingresar el número de guía
                {/if}
              </p>
            </div>
          {:else}
            <!-- Mensaje para entrega local -->
            <div class="bg-green-50 border border-green-200 rounded-lg p-4">
              <div class="flex items-start gap-3">
                <Package class="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                <div>
                  <p class="font-medium text-green-900 mb-1">Entrega Local</p>
                  <p class="text-sm text-green-700">
                    No se requiere número de guía. El pedido se entregará en persona o por mensajería local.
                  </p>
                </div>
              </div>
            </div>
          {/if}
          
          <!-- Notas adicionales -->
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">
              Notas adicionales
            </label>
            <textarea
              bind:value={guiaEnvio.notas}
              placeholder="Ej: Entrega programada para mañana, el cliente autorizó recepción por tercero..."
              rows="3"
              class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent resize-none"
            ></textarea>
          </div>
        </div>
        
        {#if error}
          <div class="bg-red-50 border-l-4 border-red-500 p-4 rounded-lg">
            <div class="flex items-center gap-3">
              <AlertCircle class="w-5 h-5 text-red-600" />
              <p class="text-sm text-red-800">{error}</p>
            </div>
          </div>
        {/if}
        
        <!-- Info de notificación -->
        <div class="bg-green-50 border border-green-200 rounded-lg p-4">
          <div class="flex items-start gap-3">
            <CheckCircle class="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
            <div class="text-sm text-green-800">
              <p class="font-medium mb-1">📲 Notificación automática</p>
              <p>
                El cliente recibirá un mensaje de WhatsApp con los datos del envío
                {#if !esEntregaLocal}
                  y el link de rastreo
                {/if}.
              </p>
            </div>
          </div>
        </div>
      </div>

      <!-- Footer -->
      <div class="px-6 py-4 bg-gray-50 border-t border-gray-200 flex flex-col sm:flex-row gap-3 sticky bottom-0">
        <button
          type="button"
          on:click={() => dispatch('close')}
          class="flex-1 px-4 py-2 bg-white border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 font-medium transition-colors"
          disabled={loading}
        >
          Cancelar
        </button>
        
        <button
          type="button"
          on:click={marcarComoEnviado}
          disabled={loading || !guiaEnvio.paqueteria || (!esEntregaLocal && !guiaEnvio.numero_guia)}
          class="flex-1 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
        >
          {#if loading}
            <Loader2 class="w-5 h-5 animate-spin" />
            <span>Procesando...</span>
          {:else}
            <Truck class="w-5 h-5" />
            <span>Marcar como Enviado</span>
          {/if}
        </button>
      </div>
    </div>
  </div>
</div> 