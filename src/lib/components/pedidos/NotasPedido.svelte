<!-- src/lib/components/pedidos/NotasPedido.svelte -->
<script>
  import { createEventDispatcher } from 'svelte';
  import { FileText, Save, X, Edit2 } from 'lucide-svelte';
  
  export let pedido;
  export let editable = true;
  
  const dispatch = createEventDispatcher();
  
  let editando = false;
  let notasTemp = pedido.notas || '';
  let guardando = false;
  
  function iniciarEdicion() {
    editando = true;
    notasTemp = pedido.notas || '';
  }
  
  function cancelar() {
    editando = false;
    notasTemp = pedido.notas || '';
  }
  
  async function guardar() {
    guardando = true;
    
    try {
      const res = await fetch(`/api/pedidos/${pedido.id}/editar`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ notas: notasTemp })
      });
      
      const result = await res.json();
      
      if (!result.success) throw new Error(result.error);
      
      pedido.notas = notasTemp;
      editando = false;
      dispatch('actualizado', result.data);
      
    } catch (error) {
      alert('Error al guardar: ' + error.message);
    } finally {
      guardando = false;
    }
  }
</script>

<div class="space-y-2">
  <div class="flex items-center justify-between">
    <label class="text-sm font-medium text-gray-700 flex items-center gap-2">
      <FileText class="w-4 h-4 text-gray-500" />
      Notas Internas
    </label>
    
    {#if !editando && editable}
      <button
        type="button"
        on:click={iniciarEdicion}
        class="text-sm text-indigo-600 hover:text-indigo-800 flex items-center gap-1"
      >
        <Edit2 class="w-3 h-3" />
        {pedido.notas ? 'Editar' : 'Agregar'}
      </button>
    {/if}
  </div>
  
  {#if editando}
    <div class="space-y-2">
      <textarea
        bind:value={notasTemp}
        placeholder="Escribe notas internas (solo visibles para el vendedor)..."
        rows="4"
        class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 resize-none text-sm"
        disabled={guardando}
      ></textarea>
      
      <div class="flex gap-2">
        <button
          type="button"
          on:click={guardar}
          disabled={guardando}
          class="flex-1 px-3 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 text-sm font-medium flex items-center justify-center gap-2"
        >
          {#if guardando}
            <div class="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full"></div>
            Guardando...
          {:else}
            <Save class="w-4 h-4" />
            Guardar
          {/if}
        </button>
        
        <button
          type="button"
          on:click={cancelar}
          disabled={guardando}
          class="px-3 py-2 bg-white border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 text-sm"
        >
          <X class="w-4 h-4" />
        </button>
      </div>
    </div>
  {:else if pedido.notas}
    <div class="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
      <p class="text-sm text-gray-700 whitespace-pre-wrap">{pedido.notas}</p>
    </div>
  {:else}
    <p class="text-sm text-gray-500 italic">Sin notas</p>
  {/if}
</div>