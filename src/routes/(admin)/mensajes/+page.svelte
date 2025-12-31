<script>
  import { MessageCircle, Copy, Save } from 'lucide-svelte';
  
  let plantillas = [
    {
      id: 1,
      nombre: 'Confirmación de Pedido',
      texto: `*Nuevo Pedido Recibido*

Cliente: {{cliente_nombre}}
WhatsApp: {{cliente_whatsapp}}

Pedido:
{{lista_productos}}

Total: {{total}}

¡Gracias por tu compra!`
    },
    {
      id: 2,
      nombre: 'Consulta por Producto',
      texto: `Hola, me interesa el producto:
*{{producto_nombre}}*

¿Podrías darme más información sobre disponibilidad y precio?`
    }
  ];
  
  let plantillaSeleccionada = plantillas[0];
</script>

<div class="p-6">
  <div class="mb-8">
    <h1 class="text-2xl font-bold text-gray-800">Plantillas de WhatsApp</h1>
    <p class="text-gray-600">Configura los mensajes automáticos para pedidos y consultas</p>
  </div>
  
  <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
    <!-- Lista de plantillas -->
    <div class="lg:col-span-1">
      <div class="bg-white rounded-xl shadow-sm p-6">
        <h2 class="font-bold text-gray-800 mb-4">Plantillas disponibles</h2>
        <div class="space-y-2">
          {#each plantillas as plantilla}
            <button
              on:click={() => plantillaSeleccionada = plantilla}
              class={`w-full text-left p-3 rounded-lg transition-colors ${
                plantillaSeleccionada.id === plantilla.id
                  ? 'bg-primary-50 border border-primary-200'
                  : 'hover:bg-gray-50 border border-transparent'
              }`}
            >
              <div class="flex items-center">
                <MessageCircle class="w-5 h-5 text-gray-400 mr-3" />
                <div>
                  <p class="font-medium text-gray-800">{plantilla.nombre}</p>
                  <p class="text-xs text-gray-500 truncate">{plantilla.texto.substring(0, 50)}...</p>
                </div>
              </div>
            </button>
          {/each}
        </div>
        
        <button class="w-full mt-4 btn-outline flex items-center justify-center">
          <MessageCircle class="w-5 h-5 mr-2" />
          Nueva Plantilla
        </button>
      </div>
    </div>
    
    <!-- Editor de plantilla -->
    <div class="lg:col-span-2">
      <div class="bg-white rounded-xl shadow-sm p-6">
        <div class="flex justify-between items-center mb-6">
          <h2 class="font-bold text-gray-800">{plantillaSeleccionada.nombre}</h2>
          <div class="flex space-x-2">
            <button class="btn-secondary flex items-center">
              <Copy class="w-4 h-4 mr-2" />
              Copiar
            </button>
            <button class="btn-primary flex items-center">
              <Save class="w-4 h-4 mr-2" />
              Guardar
            </button>
          </div>
        </div>
        
        <div class="mb-6">
          <label class="label">Nombre de la plantilla</label>
          <input
            type="text"
            bind:value={plantillaSeleccionada.nombre}
            class="input"
          />
        </div>
        
        <div class="mb-6">
          <label class="label">Texto del mensaje</label>
          <textarea
            bind:value={plantillaSeleccionada.texto}
            rows="10"
            class="input resize-none"
          ></textarea>
        </div>
        
        <!-- Variables disponibles -->
        <div class="bg-gray-50 rounded-lg p-4">
          <h3 class="font-medium text-gray-800 mb-3">Variables disponibles</h3>
          <div class="grid grid-cols-2 md:grid-cols-3 gap-2">
            <code class="bg-white border border-gray-200 px-3 py-1 rounded text-sm">{"{{cliente_nombre}}"}</code>
            <code class="bg-white border border-gray-200 px-3 py-1 rounded text-sm">{"{{cliente_whatsapp}}"}</code>
            <code class="bg-white border border-gray-200 px-3 py-1 rounded text-sm">{"{{lista_productos}}"}</code>
            <code class="bg-white border border-gray-200 px-3 py-1 rounded text-sm">{"{{total}}"}</code>
            <code class="bg-white border border-gray-200 px-3 py-1 rounded text-sm">{"{{producto_nombre}}"}</code>
            <code class="bg-white border border-gray-200 px-3 py-1 rounded text-sm">{"{{producto_precio}}"}</code>
          </div>
          <p class="text-sm text-gray-600 mt-3">
            Usa estas variables en el texto y se reemplazarán automáticamente.
          </p>
        </div>
      </div>
    </div>
  </div>
</div>