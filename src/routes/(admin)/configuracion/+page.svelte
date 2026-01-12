<!-- src/routes/(admin)/configuracion/+page.svelte -->
<!-- ✅ VERSIÓN CORREGIDA: Guardado completo de imagenes_tienda, redes_sociales y ubicacion -->
<script>
  import { onMount } from 'svelte';
  import { Settings, Save, Loader2, CheckCircle2, Palette, Share2, MapPin, Image as ImageIcon } from 'lucide-svelte';
  import ColorPalettePicker from '$lib/components/ui/ColorPalettePicker.svelte';
  import SocialMediaLinks from '$lib/components/ui/SocialMediaLinks.svelte';
  import LocationPicker from '$lib/components/ui/LocationPicker.svelte';
  import MultipleImageUploader from '$lib/components/ui/MultipleImageUploader.svelte';
  import ImageUploader from '$lib/components/ui/ImageUploader.svelte';
  import { getPaletteById } from '$lib/data/colorPalettes';
  
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
    descripcion_empresa: '',
    colores_tema: null,
    redes_sociales: null,
    logo_url: '',
    imagenes_tienda: [],
    ubicacion: {
      latitud: null,
      longitud: null,
      direccion_completa: '',
      ciudad: '',
      estado: '',
      codigo_postal: '',
      google_maps_url: ''
    }
  };
  
  let paletaSeleccionada = 'blue-default';
  let redesSociales = {
    facebook: '',
    instagram: '',
    tiktok: '',
    whatsapp: ''
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
          descripcion_empresa: result.data.descripcion_empresa || '',
          colores_tema: result.data.colores_tema || null,
          redes_sociales: result.data.redes_sociales || null,
          logo_url: result.data.logo_url || '',
          imagenes_tienda: result.data.imagenes_tienda || [],
          ubicacion: result.data.ubicacion || {
            latitud: null,
            longitud: null,
            direccion_completa: '',
            ciudad: '',
            estado: '',
            codigo_postal: '',
            google_maps_url: ''
          }
        };
        
        if (formData.colores_tema?.palette_id) {
          paletaSeleccionada = formData.colores_tema.palette_id;
        }
        
        if (formData.redes_sociales) {
          redesSociales = {
            facebook: formData.redes_sociales.facebook || '',
            instagram: formData.redes_sociales.instagram || '',
            tiktok: formData.redes_sociales.tiktok || '',
            whatsapp: formData.redes_sociales.whatsapp || ''
          };
        }
      }
    } catch (error) {
      console.error('Error cargando configuración:', error);
      mostrarMensaje('error', 'Error al cargar la configuración');
    } finally {
      loading = false;
    }
  }
  
  function handlePaletteChange(event) {
    const { paletteId, palette } = event.detail;
    paletaSeleccionada = paletteId;
    formData.colores_tema = {
      palette_id: paletteId,
      palette_name: palette.name,
      colors: palette
    };
  }
  
  function handleSocialChange(event) {
    redesSociales = event.detail;
    formData.redes_sociales = redesSociales;
  }
  
  function handleLocationChange(event) {
    formData.ubicacion = event.detail;
  }
  
  function handleImagenesChange(event) {
    formData.imagenes_tienda = event.detail.images;
  }
  
  function handleLogoUpload(event) {
    formData.logo_url = event.detail.url;
  }
  
  function handleLogoRemove() {
    formData.logo_url = '';
  }
  
  async function guardarConfiguracion() {
    guardando = true;
    
    try {
      // Asegurar que los valores estén sincronizados antes de guardar
      if (paletaSeleccionada) {
        const palette = getPaletteById(paletaSeleccionada);
        formData.colores_tema = {
          palette_id: paletaSeleccionada,
          palette_name: palette.name,
          colors: palette
        };
      }
      
      // CRÍTICO: Sincronizar datos antes de enviar
      formData.redes_sociales = redesSociales;
      
      // Debug: verificar que los datos estén presentes
      console.log('🔍 Datos a guardar:', {
        imagenes_tienda: formData.imagenes_tienda,
        redes_sociales: formData.redes_sociales,
        ubicacion: formData.ubicacion
      });
      
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
      mostrarMensaje('success', '✅ Configuración guardada correctamente. Recarga la página para ver los cambios de color.');
      
      setTimeout(() => {
        window.location.reload();
      }, 2000);
      
    } catch (error) {
      console.error('Error guardando configuración:', error);
      mostrarMensaje('error', error.message || 'Error al guardar la configuración');
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
        descripcion_empresa: configuracion.descripcion_empresa || '',
        colores_tema: configuracion.colores_tema || null,
        redes_sociales: configuracion.redes_sociales || null,
        logo_url: configuracion.logo_url || '',
        imagenes_tienda: configuracion.imagenes_tienda || [],
        ubicacion: configuracion.ubicacion || {
          latitud: null,
          longitud: null,
          direccion_completa: '',
          ciudad: '',
          estado: '',
          codigo_postal: '',
          google_maps_url: ''
        }
      };
      
      if (configuracion.colores_tema?.palette_id) {
        paletaSeleccionada = configuracion.colores_tema.palette_id;
      }
      
      if (configuracion.redes_sociales) {
        redesSociales = { ...configuracion.redes_sociales };
      }
    }
  }
</script>

<svelte:head>
  <title>Configuración | Dashboard</title>
</svelte:head>

<div class="max-w-5xl mx-auto space-y-6">
  {#if mensaje.visible}
    <div class="fixed top-20 right-4 z-50 animate-slide-in max-w-md">
      <div class={`rounded-lg shadow-lg p-4 flex items-start gap-3 ${
        mensaje.tipo === 'success' ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'
      }`}>
        {#if mensaje.tipo === 'success'}
          <CheckCircle2 class="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
        {:else}
          <svg class="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
            <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clip-rule="evenodd"/>
          </svg>
        {/if}
        <span class={mensaje.tipo === 'success' ? 'text-green-700' : 'text-red-700'}>
          {mensaje.texto}
        </span>
      </div>
    </div>
  {/if}
  
  <div>
    <h1 class="text-2xl font-bold text-gray-800 flex items-center gap-2">
      <Settings class="w-7 h-7" />
      Configuración de la Tienda
    </h1>
    <p class="text-gray-600 mt-1">Personaliza la información y apariencia de tu negocio</p>
  </div>
  
  {#if loading}
    <div class="bg-white rounded-xl shadow-sm p-12 text-center">
      <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4"></div>
      <p class="text-gray-600">Cargando configuración...</p>
    </div>
  {:else}
    <form on:submit|preventDefault={guardarConfiguracion} class="space-y-6">
      
      <!-- 🏢 LOGO DEL NEGOCIO -->
      <div class="bg-white rounded-xl shadow-sm p-6 border-l-4 border-blue-500">
        <div class="flex items-center gap-2 mb-6">
          <ImageIcon class="w-6 h-6 text-blue-600" />
          <h2 class="text-xl font-semibold text-gray-800">Logo del Negocio</h2>
        </div>
        
        <ImageUploader
          bind:imageUrl={formData.logo_url}
          label="Logo (aparecerá en el header)"
          disabled={guardando}
          on:upload={handleLogoUpload}
          on:remove={handleLogoRemove}
        />
      </div>
      
      <!-- 🖼️ IMÁGENES DEL NEGOCIO -->
      <div class="bg-white rounded-xl shadow-sm p-6 border-l-4 border-green-500">
        <div class="flex items-center gap-2 mb-6">
          <ImageIcon class="w-6 h-6 text-green-600" />
          <h2 class="text-xl font-semibold text-gray-800">Imágenes de la Tienda</h2>
        </div>
        
        <MultipleImageUploader
          bind:images={formData.imagenes_tienda}
          label="Carrusel de imágenes (página principal)"
          maxImages={10}
          disabled={guardando}
          on:change={handleImagenesChange}
        />
      </div>
      
      <!-- 🎨 PERSONALIZACIÓN VISUAL -->
      <div class="bg-white rounded-xl shadow-sm p-6 border-l-4 border-purple-500">
        <div class="flex items-center gap-2 mb-6">
          <Palette class="w-6 h-6 text-purple-600" />
          <h2 class="text-xl font-semibold text-gray-800">Personalización Visual</h2>
        </div>
        
        <ColorPalettePicker 
          bind:selectedPaletteId={paletaSeleccionada}
          disabled={guardando}
          on:change={handlePaletteChange}
        />
      </div>
      
      <!-- 📱 REDES SOCIALES -->
      <div class="bg-white rounded-xl shadow-sm p-6 border-l-4 border-blue-500">
        <div class="flex items-center gap-2 mb-6">
          <Share2 class="w-6 h-6 text-blue-600" />
          <h2 class="text-xl font-semibold text-gray-800">Redes Sociales</h2>
        </div>
        
        <SocialMediaLinks 
          bind:socialLinks={redesSociales}
          disabled={guardando}
          on:change={handleSocialChange}
        />
      </div>
      
      <!-- 📍 UBICACIÓN -->
      <div class="bg-white rounded-xl shadow-sm p-6 border-l-4 border-red-500">
        <div class="flex items-center gap-2 mb-6">
          <MapPin class="w-6 h-6 text-red-600" />
          <h2 class="text-xl font-semibold text-gray-800">Ubicación</h2>
        </div>
        
        <LocationPicker
          bind:ubicacion={formData.ubicacion}
          disabled={guardando}
          on:change={handleLocationChange}
        />
      </div>
      
      <!-- 🏢 INFORMACIÓN DEL NEGOCIO -->
      <div class="bg-white rounded-xl shadow-sm p-6 border-l-4 border-primary-500">
        <h2 class="text-xl font-semibold text-gray-800 mb-6">Información del Negocio</h2>
        
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
      
      <!-- 💳 MÉTODOS DE PAGO -->
      <div class="bg-white rounded-xl shadow-sm p-6 border-l-4 border-yellow-500">
        <h2 class="text-xl font-semibold text-gray-800 mb-6">Métodos de Pago</h2>
        
        <div class="grid grid-cols-2 gap-4 mb-6">
          <!-- Depósito -->
          <div>
            <label class="flex items-center mb-2">
              <input type="checkbox" bind:checked={formData.pago_deposito_visible} class="w-4 h-4 mr-2" />
              Mostrar opción "Depósito"
            </label>
            <label class="flex items-center">
              <input type="checkbox" bind:checked={formData.pago_deposito_disponible} class="w-4 h-4 mr-2" />
              Disponible para uso
            </label>
          </div>
          
          <!-- Transferencia -->
          <div>
            <label class="flex items-center mb-2">
              <input type="checkbox" bind:checked={formData.pago_transferencia_visible} class="w-4 h-4 mr-2" />
              Mostrar opción "Transferencia"
            </label>
            <label class="flex items-center">
              <input type="checkbox" bind:checked={formData.pago_transferencia_disponible} class="w-4 h-4 mr-2" />
              Disponible para uso
            </label>
          </div>
        </div>
        
        <!-- Cuentas bancarias -->
        <div>
          <label class="label mb-2">Cuentas Bancarias (JSON)</label>
          <textarea
            bind:value={formData.cuentas_pago}
            rows="8"
            class="input font-mono text-xs"
            placeholder={`[{"banco":"BBVA","titular":"Empresa SA","numero_cuenta":"123456","clabe":"012345678901234567"}]`}
          />
          <p class="text-xs text-gray-500 mt-1">
            Formato JSON. <a href="#" class="text-primary-600">Ver ejemplo</a>
          </p>
        </div>
      </div>

      <!-- 🚚 ENVÍO -->
      <div class="bg-white rounded-xl shadow-sm p-6 border-l-4 border-green-500">
        <h2 class="text-xl font-semibold text-gray-800 mb-4">Configuración de Envío</h2>
        
        <div class="grid grid-cols-2 gap-4">
          <label class="flex items-center">
            <input type="checkbox" bind:checked={formData.envio_visible} class="w-4 h-4 mr-2" />
            Mostrar opción de envío
          </label>
          <label class="flex items-center">
            <input type="checkbox" bind:checked={formData.envio_disponible} class="w-4 h-4 mr-2" />
            Envío disponible
          </label>
        </div>
      </div>

      <!-- 📄 FACTURACIÓN -->
      <div class="bg-white rounded-xl shadow-sm p-6 border-l-4 border-purple-500">
        <h2 class="text-xl font-semibold text-gray-800 mb-4">Configuración de Facturación</h2>
        
        <div class="grid grid-cols-2 gap-4">
          <label class="flex items-center">
            <input type="checkbox" bind:checked={formData.facturacion_visible} class="w-4 h-4 mr-2" />
            Mostrar opción de facturación
          </label>
          <label class="flex items-center">
            <input type="checkbox" bind:checked={formData.facturacion_disponible} class="w-4 h-4 mr-2" />
            Facturación disponible
          </label>
        </div>
      </div>
      
      <!-- 💰 CONFIGURACIÓN FINANCIERA -->
      <div class="bg-white rounded-xl shadow-sm p-6 border-l-4 border-green-500">
        <h2 class="text-xl font-semibold text-gray-800 mb-6">Configuración Financiera</h2>
        
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
      
      <!-- Botones de acción -->
      <div class="flex flex-col sm:flex-row justify-end gap-3 pt-6 border-t border-gray-200">
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
          class="btn-primary flex items-center justify-center gap-2"
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