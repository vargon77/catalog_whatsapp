<!-- src/lib/components/pedidos/ModalEnviar.svelte -->
<script>
  import { createEventDispatcher } from 'svelte';
  import { Truck, Loader2, Package, MapPin } from 'lucide-svelte';
  
  export let pedido;
  
  const dispatch = createEventDispatcher();
  let loading = false;
  let error = '';
  
  // Datos de guía de envío (opcional)
  let incluirGuia = false;
  let guiaEnvio = {
    paqueteria: '',
    numero_guia: '',
    url_rastreo: '',
    fecha_estimada: '',
    notas: ''
  };
  
  const paqueterias = [
    'Fedex',
    'DHL',
    'Estafeta',
    'Redpack',
    'Paquetexpress',
    '99 Minutos',
    'Uber',
    'Entrega personal',
    'Otra'
  ];
  
  async function marcarComoEnviado() {
    if (incluirGuia && !guiaEnvio.paqueteria) {
      error = 'Selecciona la paquetería';
      return;
    }
    
    loading = true;
    error = '';
    
    try {
      const body = {};
      
      if (incluirGuia) {
        // Validar que al menos tenga paquetería
        if (!guiaEnvio.paqueteria) {
          throw new Error('Debes seleccionar la paquetería');
        }
        
        body.guia_envio = {
          paqueteria: guiaEnvio.paqueteria,
          numero: guiaEnvio.numero_guia || null,
          url_rastreo: guiaEnvio.url_rastreo || null,
          fecha_estimada: guiaEnvio.fecha_estimada || null,
          notas: guiaEnvio.notas || null
        };
      }
      
      const res = await fetch(`/api/pedidos/${pedido.id}/marcar-enviado`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
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
  
  // Generar fecha estimada (3 días hábiles)
  function calcularFechaEstimada() {
    const hoy = new Date();
    hoy.setDate(hoy.getDate() + 3);
    return hoy.toISOString().split('T')[0];
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
        <!-- Info del pedido -->
        <div class="bg-gray-50 rounded-lg p-4 space-y-2">
          <div class="flex items-center gap-2 text-sm">
            <Package class="w-4 h-4 text-gray-400" />
            <span class="text-gray-600">Cliente:</span>
            <span class="font-medium">{pedido.cliente_nombre}</span>
          </div>
          {#if pedido.cliente_direccion}
            <div class="flex items-start gap-2 text-sm">
              <MapPin class="w-4 h-4 text-gray-400 mt-0.5" />
              <div>
                <span class="text-gray-600">Dirección:</span>
                <p class="font-medium">{pedido.cliente_direccion}</p>
              </div>
            </div>
          {/if}
          <div class="flex items-center gap-2 text-sm">
            <span class="text-gray-600">Total:</span>
            <span class="font-bold text-gray-900">
              ${pedido.total?.toFixed(2) || '0.00'}
            </span>
          </div>
        </div>
        
        <!-- Checkbox para incluir guía -->
        <div class="border-t border-gray-200 pt-4">
          <label class="flex items-center gap-3 cursor-pointer group">
            <input
              type="checkbox"
              bind:checked={incluirGuia}
              class="w-5 h-5 text-primary-600 border-gray-300 rounded focus:ring-2 focus:ring-primary-500"
            />
            <div>
              <span class="font-medium text-gray-900 group-hover:text-primary-600 transition-colors">
                Agregar información de envío
              </span>
              <p class="text-sm text-gray-500">
                Opcional: Guía de rastreo y detalles de paquetería
              </p>
            </div>
          </label>
        </div>
        
        {#if incluirGuia}
          <div class="bg-blue-50 border border-blue-200 rounded-lg p-4 space-y-4">
            <!-- Paquetería -->
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-2">
                Paquetería *
              </label>
              <select
                bind:value={guiaEnvio.paqueteria}
                class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                class:border-red-500={error && !guiaEnvio.paqueteria}
              >
                <option value="">Selecciona una opción</option>
                {#each paqueterias as paqueteria}
                  <option value={paqueteria}>{paqueteria}</option>
                {/each}
              </select>
            </div>
            
            <!-- Número de guía -->
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-2">
                Número de guía
              </label>
              <input
                type="text"
                bind:value={guiaEnvio.numero_guia}
                placeholder="Ej: 123456789"
                class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              />
              <p class="text-xs text-gray-500 mt-1">Opcional si es entrega local</p>
            </div>
            
            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
              <!-- URL de rastreo -->
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-2">
                  URL de rastreo
                </label>
                <input
                  type="url"
                  bind:value={guiaEnvio.url_rastreo}
                  placeholder="https://..."
                  class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                />
              </div>
              
              <!-- Fecha estimada -->
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-2">
                  Fecha estimada de entrega
                </label>
                <input
                  type="date"
                  bind:value={guiaEnvio.fecha_estimada}
                  min={new Date().toISOString().split('T')[0]}
                  class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                />
                <button
                  type="button"
                  on:click={() => guiaEnvio.fecha_estimada = calcularFechaEstimada()}
                  class="text-xs text-primary-600 hover:text-primary-700 mt-1"
                >
                  Calcular 3 días hábiles
                </button>
              </div>
            </div>
            
            <!-- Notas -->
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-2">
                Notas adicionales
              </label>
              <textarea
                bind:value={guiaEnvio.notas}
                placeholder="Ej: Dejar en portería, tocar timbre 2 veces..."
                rows="2"
                class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent resize-none"
              ></textarea>
            </div>
          </div>
        {/if}
        
        {#if error}
          <div class="bg-red-50 border border-red-200 rounded-lg p-3">
            <p class="text-sm text-red-800">{error}</p>
          </div>
        {/if}
        
        <!-- Info de notificación -->
        <div class="bg-green-50 border border-green-200 rounded-lg p-4">
          <div class="flex items-start gap-3">
            <svg class="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
            </svg>
            <div class="text-sm text-green-800">
              <p class="font-medium mb-1">📲 Notificación automática</p>
              <p>El cliente recibirá un mensaje de WhatsApp con la información del envío.</p>
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
          disabled={loading || (incluirGuia && !guiaEnvio.paqueteria)}
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