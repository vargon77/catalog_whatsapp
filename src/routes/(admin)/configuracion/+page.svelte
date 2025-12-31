<!-- src/routes/dashboard/configuracion/+page.svelte -->
 <!--revisar -->
<script>
  import { onMount } from 'svelte';
  import { Settings, Save, Loader2, CheckCircle2 } from 'lucide-svelte';
  
  let configuracion = null;
  let loading = true;
  let guardando = false;
  let mensaje = { tipo: '', texto: '', visible: false };
  
  let formData = {
    nombre_empresa: '',
    whatsapp_numero: '',
    email: '',
    direccion: '',
    horario_atencion: '',
    moneda_simbolo: '$',
    impuesto_porcentaje: 18,
    descripcion_empresa: ''
  };
  
  onMount(async () => {
    await cargarConfiguracion();
  });
  
  async function cargarConfiguracion() {
    loading = true;
    try {
      const response = await fetch('/api/configuracion');
      const result = await response.json();
      
      if (result.success) {
        configuracion = result.data;
        formData = {
          nombre_empresa: result.data.nombre_empresa || '',
          whatsapp_numero: result.data.whatsapp_numero || '',
          email: result.data.email || '',
          direccion: result.data.direccion || '',
          horario_atencion: result.data.horario_atencion || '',
          moneda_simbolo: result.data.moneda_simbolo || '$',
          impuesto_porcentaje: result.data.impuesto_porcentaje || 18,
          descripcion_empresa: result.data.descripcion_empresa || ''
        };
      }
    } catch (error) {
      console.error('Error cargando configuración:', error);
    } finally {
      loading = false;
    }
  }
  
  async function guardarConfiguracion() {
    guardando = true;
    
    try {
      const response = await fetch('/api/configuracion', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });
      
      const result = await response.json();
      
      if (!result.success) {
        throw new Error(result.error || 'Error al guardar');
      }
      
      configuracion = result.data;
      mostrarMensaje('success', 'Configuración guardada correctamente');
      
    } catch (error) {
      console.error('Error guardando configuración:', error);
      mostrarMensaje('error', error.message);
    } finally {
      guardando = false;
    }
  }
  
  function mostrarMensaje(tipo, texto) {
    mensaje = { tipo, texto, visible: true };
    setTimeout(() => { mensaje.visible = false; }, 5000);
  }
  
  function restablecer() {
    if (configuracion && confirm('¿Descartar los cambios?')) {
      formData = {
        nombre_empresa: configuracion.nombre_empresa || '',
        whatsapp_numero: configuracion.whatsapp_numero || '',
        email: configuracion.email || '',
        direccion: configuracion.direccion || '',
        horario_atencion: configuracion.horario_atencion || '',
        moneda_simbolo: configuracion.moneda_simbolo || '$',
        impuesto_porcentaje: configuracion.impuesto_porcentaje || 18,
        descripcion_empresa: configuracion.descripcion_empresa || ''
      };
    }
  }
</script>

<div class="max-w-4xl mx-auto space-y-6">
  <!-- Mensaje -->
  {#if mensaje.visible}
    <div class="fixed top-20 right-4 z-50 animate-slide-in">
      <div class={`rounded-lg shadow-lg p-4 flex items-center gap-3 ${
        mensaje.tipo === 'success' ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'
      }`}>
        <CheckCircle2 class="w-5 h-5 {mensaje.tipo === 'success' ? 'text-green-600' : 'text-red-600'}" />
        <span class={mensaje.tipo === 'success' ? 'text-green-700' : 'text-red-700'}>
          {mensaje.texto}
        </span>
      </div>
    </div>
  {/if}
  
  <!-- Header -->
  <div>
    <h1 class="text-2xl font-bold text-gray-800">Configuración de la Tienda</h1>
    <p class="text-gray-600">Personaliza la información de tu negocio</p>
  </div>
  
  {#if loading}
    <div class="bg-white rounded-xl shadow-sm p-12 text-center">
      <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4"></div>
      <p class="text-gray-600">Cargando configuración...</p>
    </div>
  {:else}
    <form on:submit|preventDefault={guardarConfiguracion} class="space-y-6">
      <!-- Información básica -->
      <div class="bg-white rounded-xl shadow-sm p-6">
        <h2 class="text-lg font-semibold text-gray-800 mb-4">Información del Negocio</h2>
        
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div class="md:col-span-2">
            <label class="label">Nombre de la empresa</label>
            <input
              type="text"
              bind:value={formData.nombre_empresa}
              placeholder="Ej: las Salsas"
              class="input"
              required
            />
          </div>
          
          <div>
            <label class="label">Número de WhatsApp</label>
            <input
              type="tel"
              bind:value={formData.whatsapp_numero}
              placeholder="7121920418"
              class="input"
              required
            />
            <p class="text-xs text-gray-500 mt-1">Sin espacios ni guiones</p>
          </div>
          
          <div>
            <label class="label">Email</label>
            <input
              type="email"
              bind:value={formData.email}
              placeholder="info@ejemplo.com"
              class="input"
            />
          </div>
          
          <div class="md:col-span-2">
            <label class="label">Dirección</label>
            <input
              type="text"
              bind:value={formData.direccion}
              placeholder="Calle Principal 123, Ciudad"
              class="input"
            />
          </div>
          
          <div class="md:col-span-2">
            <label class="label">Horario de atención</label>
            <input
              type="text"
              bind:value={formData.horario_atencion}
              placeholder="Lunes a Viernes: 9am - 6pm"
              class="input"
            />
          </div>
          
          <div class="md:col-span-2">
            <label class="label">Descripción de la empresa</label>
            <textarea
              bind:value={formData.descripcion_empresa}
              placeholder="Breve descripción de tu negocio"
              rows="3"
              class="input resize-none"
            ></textarea>
          </div>
        </div>
      </div>
      
      <!-- Configuración financiera -->
      <div class="bg-white rounded-xl shadow-sm p-6">
        <h2 class="text-lg font-semibold text-gray-800 mb-4">Configuración Financiera</h2>
        
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label class="label">Símbolo de moneda</label>
            <select bind:value={formData.moneda_simbolo} class="input">
              <option value="$">$ (Peso/Dólar)</option>
              <option value="S/">S/ (Sol)</option>
              <option value="€">€ (Euro)</option>
              <option value="£">£ (Libra)</option>
            </select>
          </div>
          
          <div>
            <label class="label">Porcentaje de impuesto (%)</label>
            <input
              type="number"
              bind:value={formData.impuesto_porcentaje}
              placeholder="18"
              min="0"
              max="100"
              step="0.1"
              class="input"
              required
            />
            <p class="text-xs text-gray-500 mt-1">IVA o impuesto aplicable</p>
          </div>
        </div>
      </div>
      
      <!-- Ejemplo de cómo se ve -->
      <div class="bg-blue-50 border border-blue-200 rounded-xl p-6">
        <h3 class="font-semibold text-blue-800 mb-3">Vista previa</h3>
        <div class="bg-white rounded-lg p-4 space-y-2 text-sm">
          <p><strong>{formData.nombre_empresa || 'Nombre de empresa'}</strong></p>
          <p>📍 {formData.direccion || 'Dirección'}</p>
          <p>📞 {formData.whatsapp_numero || 'WhatsApp'}</p>
          <p>🕒 {formData.horario_atencion || 'Horario'}</p>
          <div class="mt-3 pt-3 border-t border-gray-200">
            <p class="font-medium">Ejemplo de precio:</p>
            <p>Producto: {formData.moneda_simbolo}100.00</p>
            <p class="text-xs text-gray-600">
              + Impuesto ({formData.impuesto_porcentaje}%): {formData.moneda_simbolo}{(100 * formData.impuesto_porcentaje / 100).toFixed(2)}
            </p>
            <p class="font-bold">
              Total: {formData.moneda_simbolo}{(100 + (100 * formData.impuesto_porcentaje / 100)).toFixed(2)}
            </p>
          </div>
        </div>
      </div>
      
      <!-- Botones de acción -->
      <div class="flex justify-end space-x-3 pt-6 border-t border-gray-200">
        <button
          type="button"
          on:click={restablecer}
          class="btn-secondary"
          disabled={guardando}
        >
          Descartar cambios
        </button>
        
        <button
          type="submit"
          class="btn-primary flex items-center gap-2"
          disabled={guardando}
        >
          {#if guardando}
            <Loader2 class="w-5 h-5 animate-spin" />
            Guardando...
          {:else}
            <Save class="w-5 h-5" />
            Guardar Configuración
          {/if}
        </button>
      </div>
    </form>
  {/if}
</div>