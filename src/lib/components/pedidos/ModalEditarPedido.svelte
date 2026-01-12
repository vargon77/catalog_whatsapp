<!-- src/lib/components/pedidos/ModalEditarPedido.svelte -->
<script>
  import { createEventDispatcher, onMount } from 'svelte';
  import { 
    Edit, X, Loader2, Save, Plus, Trash2, 
    User, Phone, Mail, MapPin, Package, DollarSign,
    AlertCircle, ShoppingCart
  } from 'lucide-svelte';
  
  export let pedido;
  
  const dispatch = createEventDispatcher();
  let loading = false;
  let loadingData = false;
  let error = '';
  let success = '';
  
  // Datos del pedido
  let pedidoCompleto = null;
  let formData = {
    cliente_nombre: '',
    cliente_whatsapp: '',
    cliente_email: '',
    cliente_direccion: '',
    costo_envio: 0,
    metodo_pago: '',
    notas: '',
    factura: false,
    envio: false,
    items: []
  };
  
  onMount(async () => {
    await cargarDatosPedido();
  });
  
  async function cargarDatosPedido() {
    loadingData = true;
    try {
      const res = await fetch(`/api/pedidos/${pedido.id}/editar`);
      const result = await res.json();
      
      if (!result.success) throw new Error(result.error);
      
      pedidoCompleto = result.data;
      
      // Cargar formulario
      formData = {
        cliente_nombre: pedidoCompleto.cliente_nombre || '',
        cliente_whatsapp: pedidoCompleto.cliente_whatsapp || '',
        cliente_email: pedidoCompleto.cliente_email || '',
        cliente_direccion: pedidoCompleto.cliente_direccion || '',
        costo_envio: pedidoCompleto.costo_envio || 0,
        metodo_pago: pedidoCompleto.metodo_pago || '',
        notas: pedidoCompleto.notas || '',
        factura: Boolean(pedidoCompleto.factura),
        envio: Boolean(pedidoCompleto.envio),
        items: pedidoCompleto.items?.map(item => ({
          producto_id: item.producto_id,
          nombre: item.producto_nombre,
          sku: item.producto_sku,
          cantidad: item.cantidad,
          precio_unitario: item.precio_unitario,
          imagen_url: item.imagen_url
        })) || []
      };
      
    } catch (err) {
      error = err.message;
    } finally {
      loadingData = false;
    }
  }
  
  async function guardarCambios() {
    error = '';
    success = '';
    
    // Validaciones
    if (!formData.cliente_nombre.trim()) {
      error = 'El nombre del cliente es obligatorio';
      return;
    }
    
    if (!formData.cliente_whatsapp.trim()) {
      error = 'El WhatsApp del cliente es obligatorio';
      return;
    }
    
    if (formData.items.length === 0) {
      error = 'Debe haber al menos un producto';
      return;
    }
    
    // Validar que todos los items tengan datos válidos
    const itemsInvalidos = formData.items.some(item => 
      !item.nombre.trim() || 
      item.cantidad <= 0 || 
      item.precio_unitario <= 0
    );
    
    if (itemsInvalidos) {
      error = 'Todos los productos deben tener nombre, cantidad y precio válidos';
      return;
    }
    
    loading = true;
    
    try {
      const res = await fetch(`/api/pedidos/${pedido.id}/editar`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });
      
      const result = await res.json();
      
      if (!result.success) throw new Error(result.error);
      
      success = result.message;
      
      setTimeout(() => {
        dispatch('close');
      }, 1500);
      
    } catch (err) {
      error = err.message;
    } finally {
      loading = false;
    }
  }
  
  function agregarProducto() {
    formData.items = [...formData.items, {
      producto_id: null,
      nombre: '',
      sku: '',
      cantidad: 1,
      precio_unitario: 0,
      imagen_url: null
    }];
  }
  
  function eliminarProducto(index) {
    if (formData.items.length === 1) {
      error = 'Debe haber al menos un producto';
      return;
    }
    formData.items = formData.items.filter((_, i) => i !== index);
  }
  
  function formatCurrency(amount) {
    return new Intl.NumberFormat('es-MX', {
      style: 'currency',
      currency: 'MXN'
    }).format(amount);
  }
  
  // Cálculos reactivos
  $: subtotal = formData.items.reduce((sum, item) => 
    sum + (parseFloat(item.precio_unitario || 0) * parseInt(item.cantidad || 0)), 0
  );
  
  $: impuesto = formData.factura ? subtotal * 0.16 : 0;
  
  $: costoEnvioNum = parseFloat(formData.costo_envio || 0);
  
  $: total = subtotal + impuesto + costoEnvioNum;
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
    <div class="relative bg-white rounded-lg shadow-xl max-w-5xl w-full max-h-[90vh] overflow-hidden flex flex-col">
      <!-- Header Sticky -->
      <div class="px-6 py-4 border-b border-gray-200 bg-indigo-50 sticky top-0 z-20">
        <div class="flex items-center justify-between">
          <div class="flex items-center gap-3">
            <div class="w-12 h-12 bg-indigo-100 rounded-full flex items-center justify-center">
              <Edit class="w-6 h-6 text-indigo-600" />
            </div>
            <div>
              <h3 class="text-xl font-bold text-gray-900">Editar Pedido</h3>
              <p class="text-sm text-gray-600">#{pedido.numero_pedido}</p>
            </div>
          </div>
          
          <button
            on:click={() => dispatch('close')}
            class="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X class="w-6 h-6" />
          </button>
        </div>
      </div>

      <!-- Content Scrollable -->
      <div class="flex-1 overflow-y-auto px-6 py-4">
        {#if loadingData}
          <div class="flex items-center justify-center py-12">
            <Loader2 class="w-8 h-8 animate-spin text-indigo-600" />
            <span class="ml-3 text-gray-600">Cargando datos...</span>
          </div>
        {:else if !pedidoCompleto?.editable}
          <div class="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
            <AlertCircle class="w-12 h-12 text-red-600 mx-auto mb-3" />
            <h4 class="text-lg font-semibold text-red-800 mb-2">Pedido no editable</h4>
            <p class="text-sm text-red-700">
              Este pedido ya no puede ser editado porque el pago ya fue validado o está en proceso de envío.
            </p>
          </div>
        {:else}
          <div class="space-y-6">
            <!-- Mensajes -->
            {#if error}
              <div class="bg-red-50 border border-red-200 rounded-lg p-4 flex items-start gap-3">
                <AlertCircle class="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                <p class="text-sm text-red-800">{error}</p>
              </div>
            {/if}
            
            {#if success}
              <div class="bg-green-50 border border-green-200 rounded-lg p-4 flex items-start gap-3">
                <Edit class="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                <p class="text-sm text-green-800">{success}</p>
              </div>
            {/if}
            
            <!-- Información del Cliente -->
            <div class="bg-white border border-gray-200 rounded-lg p-4">
              <h4 class="text-sm font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <User class="w-4 h-4 text-indigo-600" />
                Información del Cliente
              </h4>
              
              <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label class="block text-sm font-medium text-gray-700 mb-2">
                    Nombre <span class="text-red-500">*</span>
                  </label>
                  <div class="relative">
                    <User class="absolute left-3 top-3 w-4 h-4 text-gray-400" />
                    <input
                      type="text"
                      bind:value={formData.cliente_nombre}
                      placeholder="Ej: Juan Pérez"
                      class="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                      disabled={loading}
                    />
                  </div>
                </div>
                
                <div>
                  <label class="block text-sm font-medium text-gray-700 mb-2">
                    WhatsApp <span class="text-red-500">*</span>
                  </label>
                  <div class="relative">
                    <Phone class="absolute left-3 top-3 w-4 h-4 text-gray-400" />
                    <input
                      type="tel"
                      bind:value={formData.cliente_whatsapp}
                      placeholder="7121920418"
                      class="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                      disabled={loading}
                    />
                  </div>
                </div>
                
                <div>
                  <label class="block text-sm font-medium text-gray-700 mb-2">
                    Email
                  </label>
                  <div class="relative">
                    <Mail class="absolute left-3 top-3 w-4 h-4 text-gray-400" />
                    <input
                      type="email"
                      bind:value={formData.cliente_email}
                      placeholder="correo@ejemplo.com"
                      class="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                      disabled={loading}
                    />
                  </div>
                </div>
                
                <div>
                  <label class="block text-sm font-medium text-gray-700 mb-2">
                    Dirección
                  </label>
                  <div class="relative">
                    <MapPin class="absolute left-3 top-3 w-4 h-4 text-gray-400" />
                    <input
                      type="text"
                      bind:value={formData.cliente_direccion}
                      placeholder="Calle Principal 123"
                      class="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                      disabled={loading}
                    />
                  </div>
                </div>
              </div>
            </div>
            
            <!-- Productos -->
            <div class="bg-white border border-gray-200 rounded-lg p-4">
              <div class="flex items-center justify-between mb-4">
                <h4 class="text-sm font-semibold text-gray-900 flex items-center gap-2">
                  <ShoppingCart class="w-4 h-4 text-indigo-600" />
                  Productos ({formData.items.length})
                </h4>
                
                <button
                  type="button"
                  on:click={agregarProducto}
                  disabled={loading}
                  class="btn-secondary flex items-center gap-2 text-sm"
                >
                  <Plus class="w-4 h-4" />
                  Agregar
                </button>
              </div>
              
              <div class="space-y-3">
                {#each formData.items as item, index}
                  <div class="bg-gray-50 rounded-lg p-4 border border-gray-200">
                    <div class="flex items-start gap-3">
                      <div class="flex-1 grid grid-cols-1 md:grid-cols-4 gap-3">
                        <div class="md:col-span-2">
                          <label class="block text-xs font-medium text-gray-700 mb-1">
                            Nombre del producto *
                          </label>
                          <input
                            type="text"
                            bind:value={item.nombre}
                            placeholder="Ej: Laptop Gamer"
                            class="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                            disabled={loading}
                          />
                        </div>
                        
                        <div>
                          <label class="block text-xs font-medium text-gray-700 mb-1">
                            Cantidad *
                          </label>
                          <input
                            type="number"
                            bind:value={item.cantidad}
                            min="1"
                            class="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                            disabled={loading}
                          />
                        </div>
                        
                        <div>
                          <label class="block text-xs font-medium text-gray-700 mb-1">
                            Precio unitario *
                          </label>
                          <div class="relative">
                            <span class="absolute left-3 top-2 text-gray-500 text-sm">$</span>
                            <input
                              type="number"
                              bind:value={item.precio_unitario}
                              min="0"
                              step="0.01"
                              class="w-full pl-6 pr-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                              disabled={loading}
                            />
                          </div>
                        </div>
                        
                        <div class="md:col-span-3">
                          <label class="block text-xs font-medium text-gray-700 mb-1">
                            SKU (opcional)
                          </label>
                          <input
                            type="text"
                            bind:value={item.sku}
                            placeholder="Código del producto"
                            class="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                            disabled={loading}
                          />
                        </div>
                        
                        <div class="flex items-end">
                          <div class="text-right w-full">
                            <label class="block text-xs font-medium text-gray-700 mb-1">
                              Subtotal
                            </label>
                            <div class="text-sm font-semibold text-gray-900">
                              {formatCurrency(item.precio_unitario * item.cantidad)}
                            </div>
                          </div>
                        </div>
                      </div>
                      
                      <button
                        type="button"
                        on:click={() => eliminarProducto(index)}
                        disabled={loading || formData.items.length === 1}
                        class="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        title="Eliminar producto"
                      >
                        <Trash2 class="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                {/each}
              </div>
            </div>
            
            <!-- Costos y Configuración -->
            <div class="bg-white border border-gray-200 rounded-lg p-4">
              <h4 class="text-sm font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <DollarSign class="w-4 h-4 text-indigo-600" />
                Costos y Configuración
              </h4>
              
              <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label class="block text-sm font-medium text-gray-700 mb-2">
                    Costo de envío
                  </label>
                  <div class="relative">
                    <span class="absolute left-3 top-2.5 text-gray-500">$</span>
                    <input
                      type="number"
                      bind:value={formData.costo_envio}
                      min="0"
                      step="0.01"
                      class="w-full pl-7 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                      disabled={loading}
                    />
                  </div>
                </div>
                
                <div>
                  <label class="block text-sm font-medium text-gray-700 mb-2">
                    Método de pago
                  </label>
                  <select
                    bind:value={formData.metodo_pago}
                    class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                    disabled={loading}
                  >
                    <option value="">Seleccionar...</option>
                    <option value="transferencia">Transferencia bancaria</option>
                    <option value="deposito">Depósito en efectivo</option>
                    <option value="tarjeta">Tarjeta</option>
                    <option value="efectivo">Efectivo contra entrega</option>
                  </select>
                </div>
                
                <div class="md:col-span-2">
                  <label class="block text-sm font-medium text-gray-700 mb-2">
                    Notas internas
                  </label>
                  <textarea
                    bind:value={formData.notas}
                    placeholder="Notas visibles solo para el vendedor"
                    rows="3"
                    class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 resize-none"
                    disabled={loading}
                  ></textarea>
                </div>
                
                <div class="flex flex-wrap gap-4">
                  <label class="flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      bind:checked={formData.factura}
                      disabled={loading}
                      class="w-4 h-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500"
                    />
                    <span class="ml-2 text-sm text-gray-700">Requiere factura</span>
                  </label>
                  
                  <label class="flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      bind:checked={formData.envio}
                      disabled={loading}
                      class="w-4 h-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500"
                    />
                    <span class="ml-2 text-sm text-gray-700">Requiere envío</span>
                  </label>
                </div>
              </div>
            </div>
            
            <!-- Resumen de Totales -->
            <div class="bg-indigo-50 border-2 border-indigo-200 rounded-lg p-4">
              <h4 class="text-sm font-semibold text-indigo-900 mb-3">Resumen</h4>
              <div class="space-y-2 text-sm">
                <div class="flex justify-between">
                  <span class="text-gray-600">Subtotal:</span>
                  <span class="font-medium">{formatCurrency(subtotal)}</span>
                </div>
                
                {#if formData.factura && impuesto > 0}
                  <div class="flex justify-between">
                    <span class="text-gray-600">IVA (16%):</span>
                    <span class="font-medium">{formatCurrency(impuesto)}</span>
                  </div>
                {/if}
                
                {#if costoEnvioNum > 0}
                  <div class="flex justify-between">
                    <span class="text-gray-600">Envío:</span>
                    <span class="font-medium">{formatCurrency(costoEnvioNum)}</span>
                  </div>
                {/if}
                
                <div class="border-t border-indigo-300 pt-2 flex justify-between">
                  <span class="text-base font-semibold text-gray-900">Total:</span>
                  <span class="text-lg font-bold text-indigo-700">{formatCurrency(total)}</span>
                </div>
              </div>
            </div>
          </div>
        {/if}
      </div>

      <!-- Footer Sticky -->
      {#if pedidoCompleto?.editable && !loadingData}
        <div class="px-6 py-4 bg-gray-50 border-t border-gray-200 sticky bottom-0 flex flex-col sm:flex-row gap-3">
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
            on:click={guardarCambios}
            disabled={loading}
            class="flex-1 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {#if loading}
              <Loader2 class="w-5 h-5 animate-spin" />
              <span>Guardando...</span>
            {:else}
              <Save class="w-5 h-5" />
              <span>Guardar Cambios</span>
            {/if}
          </button>
        </div>
      {/if}
    </div>
  </div>
</div>