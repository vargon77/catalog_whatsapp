<script>
  import { ShoppingCart, Search, Edit, Trash2, Save, Upload, X } from 'lucide-svelte';
  import { calcularTotalesPedido } from '$lib/utils/calcularPedido';
  import ImageUploader from '$lib/components/ui/ImageUploader.svelte';
  
  let busqueda = '';
  let pedidos = [];
  let pedidoEditando = null;
  let loading = false;
  let error = '';
  let success = '';
  
  async function buscarPedidos() {
    if (!busqueda.trim()) {
      error = 'Ingresa un número de pedido o WhatsApp';
      return;
    }
    
    loading = true;
    error = '';
    
    try {
      // Buscar por número de pedido O por WhatsApp
      const res = await fetch(`/api/pedidos?busqueda=${encodeURIComponent(busqueda)}`);
      const result = await res.json();
      
      if (!result.success) throw new Error(result.error);
      
      // Filtrar solo pedidos NO confirmados
      pedidos = result.data.filter(p => p.estado === 'pendiente');
      
      if (pedidos.length === 0) {
        error = 'No se encontraron pedidos pendientes';
      }
    } catch (err) {
      error = err.message;
    } finally {
      loading = false;
    }
  }
  
  function editarPedido(pedido) {
    pedidoEditando = { ...pedido };
  }
  
  function cancelarEdicion() {
    pedidoEditando = null;
  }
  
  async function guardarCambios() {
    if (!pedidoEditando) return;
    
    loading = true;
    error = '';
    
    try {
      const res = await fetch('/api/pedidos', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(pedidoEditando)
      });
      
      const result = await res.json();
      
      if (!result.success) throw new Error(result.error);
      
      success = 'Pedido actualizado correctamente';
      pedidoEditando = null;
      await buscarPedidos(); // Recargar
      
      setTimeout(() => success = '', 3000);
    } catch (err) {
      error = err.message;
    } finally {
      loading = false;
    }
  }
  
  async function eliminarPedido(id) {
    if (!confirm('¿Eliminar este pedido?')) return;
    
    try {
      const res = await fetch(`/api/pedidos?id=${id}`, { method: 'DELETE' });
      const result = await res.json();
      
      if (!result.success) throw new Error(result.error);
      
      success = 'Pedido eliminado';
      await buscarPedidos();
    } catch (err) {
      error = err.message;
    }
  }
  
  function eliminarItem(index) {
    if (!pedidoEditando) return;
    pedidoEditando.items = pedidoEditando.items.filter((_, i) => i !== index);
    recalcularTotales();
  }
  
  function recalcularTotales() {
    if (!pedidoEditando) return;
    
    const totales = calcularTotalesPedido(
      pedidoEditando.items,
      pedidoEditando.factura,
      pedidoEditando.envio,
      pedidoEditando.costo_envio,
      16 // Obtener de configuración
    );
    
    pedidoEditando.subtotal = totales.subtotal;
    pedidoEditando.impuesto = totales.impuesto;
    pedidoEditando.costo_envio = totales.costo_envio;
    pedidoEditando.total = totales.total;
  }
  
  $: if (pedidoEditando) recalcularTotales();
</script>

<svelte:head>
  <title>Editar Pedido</title>
</svelte:head>

<div class="max-w-4xl mx-auto space-y-6">
  <h1 class="text-3xl font-bold text-gray-900">Editar Mi Pedido</h1>
  
  <!-- Búsqueda -->
  <div class="bg-white rounded-xl shadow-sm p-6">
    <label class="label">Buscar por Número de Pedido o WhatsApp</label>
    <div class="flex gap-3">
      <input
        type="text"
        bind:value={busqueda}
        placeholder="Ej: PED-2026-001 o 7121920418"
        class="input flex-1"
        on:keypress={(e) => e.key === 'Enter' && buscarPedidos()}
      />
      <button on:click={buscarPedidos} class="btn-primary flex items-center gap-2" disabled={loading}>
        {#if loading}
          <div class="animate-spin w-5 h-5 border-2 border-white border-t-transparent rounded-full"></div>
        {:else}
          <Search class="w-5 h-5" />
        {/if}
        Buscar
      </button>
    </div>
  </div>
  
  <!-- Mensajes -->
  {#if error}
    <div class="bg-red-50 border border-red-200 text-red-800 p-4 rounded-lg">{error}</div>
  {/if}
  {#if success}
    <div class="bg-green-50 border border-green-200 text-green-800 p-4 rounded-lg">{success}</div>
  {/if}
  
  <!-- Lista de pedidos -->
  {#if pedidos.length > 0 && !pedidoEditando}
    <div class="space-y-4">
      {#each pedidos as pedido}
        <div class="bg-white rounded-xl shadow-sm p-6">
          <div class="flex justify-between items-start mb-4">
            <div>
              <h3 class="font-bold text-lg">Pedido #{pedido.numero_pedido}</h3>
              <p class="text-sm text-gray-600">{new Date(pedido.created_at).toLocaleDateString()}</p>
            </div>
            <div class="text-right">
              <p class="text-2xl font-bold text-primary-700">${pedido.total.toFixed(2)}</p>
              <p class="text-sm text-gray-600">{pedido.items?.length || 0} productos</p>
            </div>
          </div>
          
          <div class="flex gap-3">
            <button on:click={() => editarPedido(pedido)} class="btn-primary flex items-center gap-2">
              <Edit class="w-4 h-4" />
              Editar
            </button>
            <button on:click={() => eliminarPedido(pedido.id)} class="btn-secondary text-red-600 flex items-center gap-2">
              <Trash2 class="w-4 h-4" />
              Eliminar
            </button>
          </div>
        </div>
      {/each}
    </div>
  {/if}
  
  <!-- Editor de pedido -->
  {#if pedidoEditando}
    <div class="bg-white rounded-xl shadow-sm p-6 space-y-6">
      <div class="flex justify-between items-center border-b pb-4">
        <h2 class="text-xl font-bold">Editando: {pedidoEditando.numero_pedido}</h2>
        <button on:click={cancelarEdicion} class="text-gray-600 hover:text-gray-900">
          <X class="w-6 h-6" />
        </button>
      </div>
      
      <!-- Items -->
      <div>
        <h3 class="font-semibold mb-3">Productos</h3>
        {#each pedidoEditando.items as item, index}
          <div class="flex items-center gap-4 p-3 bg-gray-50 rounded-lg mb-2">
            <div class="flex-1">
              <p class="font-medium">{item.producto_nombre}</p>
              <p class="text-sm text-gray-600">${item.precio_unitario} × {item.cantidad}</p>
            </div>
            <input
              type="number"
              bind:value={item.cantidad}
              min="1"
              class="w-20 px-2 py-1 border rounded"
              on:input={recalcularTotales}
            />
            <button on:click={() => eliminarItem(index)} class="text-red-600 hover:text-red-800">
              <Trash2 class="w-5 h-5" />
            </button>
          </div>
        {/each}
      </div>
      
      <!-- Opciones -->
      <div class="grid grid-cols-2 gap-4">
        <label class="flex items-center">
          <input type="checkbox" bind:checked={pedidoEditando.factura} class="w-4 h-4 mr-2" />
          Requiere factura
        </label>
        <label class="flex items-center">
          <input type="checkbox" bind:checked={pedidoEditando.envio} class="w-4 h-4 mr-2" />
          Requiere envío
        </label>
      </div>
      
      {#if pedidoEditando.envio}
        <div>
          <label class="label">Costo de envío</label>
          <input type="number" bind:value={pedidoEditando.costo_envio} step="0.01" class="input" />
        </div>
      {/if}
      
      <!-- Constancia de pago -->
      <div>
        <label class="label">Constancia de Pago</label>
        <ImageUploader
          bind:imageUrl={pedidoEditando.constancia_pago_url}
          on:upload={(e) => pedidoEditando.constancia_pago_url = e.detail.url}
        />
      </div>
      
      <!-- Resumen -->
      <div class="border-t pt-4 space-y-2">
        <div class="flex justify-between">
          <span>Subtotal:</span>
          <span>${pedidoEditando.subtotal.toFixed(2)}</span>
        </div>
        {#if pedidoEditando.factura}
          <div class="flex justify-between">
            <span>IVA:</span>
            <span>${pedidoEditando.impuesto.toFixed(2)}</span>
          </div>
        {/if}
        {#if pedidoEditando.envio}
          <div class="flex justify-between">
            <span>Envío:</span>
            <span>${pedidoEditando.costo_envio.toFixed(2)}</span>
          </div>
        {/if}
        <div class="flex justify-between text-xl font-bold border-t pt-2">
          <span>Total:</span>
          <span class="text-primary-700">${pedidoEditando.total.toFixed(2)}</span>
        </div>
      </div>
      
      <!-- Acciones -->
      <div class="flex gap-3">
        <button on:click={guardarCambios} class="btn-primary flex-1 flex items-center justify-center gap-2" disabled={loading}>
          {#if loading}
            <div class="animate-spin w-5 h-5 border-2 border-white border-t-transparent rounded-full"></div>
          {:else}
            <Save class="w-5 h-5" />
          {/if}
          Guardar Cambios
        </button>
        <button on:click={cancelarEdicion} class="btn-secondary">
          Cancelar
        </button>
      </div>
    </div>
  {/if}
</div>