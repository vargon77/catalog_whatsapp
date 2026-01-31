<!-- src/lib/components/cliente/FormularioDireccion.svelte -->
<script>
  import { createEventDispatcher, onMount } from 'svelte';
  import { MapPin, Loader2, CheckCircle, AlertCircle, Phone, Mail } from 'lucide-svelte';
  
  export let pedido;
  export let direccionInicial = null;
  
  const dispatch = createEventDispatcher();
  
  let loading = false;
  let error = '';
  let success = '';
  let mostrarFormulario = false;
  
  // Estados de México (catálogo completo)
  const ESTADOS_MX = [
    'Aguascalientes', 'Baja California', 'Baja California Sur', 'Campeche',
    'Chiapas', 'Chihuahua', 'Coahuila', 'Colima', 'Durango', 'Guanajuato',
    'Guerrero', 'Hidalgo', 'Jalisco', 'México', 'Michoacán', 'Morelos',
    'Nayarit', 'Nuevo León', 'Oaxaca', 'Puebla', 'Querétaro', 'Quintana Roo',
    'San Luis Potosí', 'Sinaloa', 'Sonora', 'Tabasco', 'Tamaulipas',
    'Tlaxcala', 'Veracruz', 'Yucatán', 'Zacatecas', 'Ciudad de México'
  ];
  
  const TIPOS_DOMICILIO = [
    { value: 'casa', label: '🏠 Casa' },
    { value: 'departamento', label: '🏢 Departamento' },
    { value: 'oficina', label: '💼 Oficina' },
    { value: 'bodega', label: '📦 Bodega' }
  ];
  
  const HORARIOS = [
    { value: 'mañana', label: '🌅 Mañana (9am - 1pm)' },
    { value: 'tarde', label: '🌆 Tarde (1pm - 6pm)' },
    { value: 'horario_abierto', label: '⏰ Horario abierto (9am - 6pm)' }
  ];
  
  // Modelo de datos
  let direccion = {
    nombre_destinatario: '',
    telefono: pedido.cliente_whatsapp || '',
    correo: pedido.cliente_email || '',
    calle: '',
    numero_exterior: '',
    numero_interior: '',
    colonia: '',
    codigo_postal: '',
    ciudad: '',
    estado: '',
    pais: 'México',
    referencias: '',
    tipo_domicilio: 'casa',
    persona_recibe: '',
    horario_entrega: 'horario_abierto',
    ubicacion_maps: '',
    autoriza_tercero: false,
    notas_autorizacion: ''
  };
  
  onMount(async () => {
    // Autollenar si hay dirección previa
    if (direccionInicial) {
      direccion = { ...direccion, ...direccionInicial };
      console.log('✅ Dirección autocompletada');
    } else {
      // Buscar última dirección del cliente
      await buscarUltimaDireccion();
    }
  });
  
  async function buscarUltimaDireccion() {
    try {
      const res = await fetch(`/api/clientes/ultima-direccion?whatsapp=${encodeURIComponent(pedido.cliente_whatsapp)}`);
      const result = await res.json();
      
      if (result.success && result.data) {
        direccion = { ...direccion, ...result.data };
        success = '✅ Dirección autocompletada de un pedido anterior. Verifica que sea correcta.';
        setTimeout(() => success = '', 5000);
      }
    } catch (err) {
      console.log('No se encontró dirección previa:', err);
    }
  }
  
  function validarTelefono(tel) {
    const limpio = tel.replace(/\D/g, '');
    return limpio.length === 10;
  }
  
  function validarCP(cp) {
    return /^\d{5}$/.test(cp);
  }
  
  function validarFormulario() {
    const errores = [];
    
    if (!direccion.nombre_destinatario.trim()) errores.push('Nombre del destinatario');
    if (!validarTelefono(direccion.telefono)) errores.push('Teléfono (10 dígitos)');
    if (!direccion.calle.trim()) errores.push('Calle');
    if (!direccion.numero_exterior.trim()) errores.push('Número exterior');
    if (!direccion.colonia.trim()) errores.push('Colonia');
    if (!validarCP(direccion.codigo_postal)) errores.push('Código postal (5 dígitos)');
    if (!direccion.ciudad.trim()) errores.push('Ciudad');
    if (!direccion.estado) errores.push('Estado');
    if (!direccion.referencias.trim()) errores.push('Referencias');
    
    if (errores.length > 0) {
      error = `Campos obligatorios faltantes: ${errores.join(', ')}`;
      return false;
    }
    
    return true;
  }
  
  async function guardarDireccion() {
    error = '';
    success = '';
    
    if (!validarFormulario()) {
      return;
    }
    
    loading = true;
    
    try {
      const res = await fetch(`/api/pedidos/${pedido.id}/actualizar-direccion`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          cliente_direccion: direccion
        })
      });
      
      const result = await res.json();
      
      if (!result.success) {
        throw new Error(result.error);
      }
      
      success = '✅ Dirección guardada correctamente';
      dispatch('guardado', { direccion });
      
      setTimeout(() => {
        mostrarFormulario = false;
      }, 1500);
      
    } catch (err) {
      error = err.message || 'Error al guardar la dirección';
    } finally {
      loading = false;
    }
  }
  
  $: formularioCompleto = 
    direccion.nombre_destinatario.trim() &&
    validarTelefono(direccion.telefono) &&
    direccion.calle.trim() &&
    direccion.numero_exterior.trim() &&
    direccion.colonia.trim() &&
    validarCP(direccion.codigo_postal) &&
    direccion.ciudad.trim() &&
    direccion.estado &&
    direccion.referencias.trim();
</script>

<div class="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-2xl shadow-lg p-6 mb-6 border-2 border-indigo-200">
  <div class="flex items-start gap-4 mb-4">
    <div class="w-12 h-12 bg-indigo-100 rounded-full flex items-center justify-center flex-shrink-0">
      <MapPin class="w-6 h-6 text-indigo-600" />
    </div>
    <div class="flex-1">
      <h3 class="text-lg font-bold text-gray-900 mb-1">
        📍 Dirección de Envío
      </h3>
      <p class="text-sm text-gray-700">
        {#if direccion.calle}
          Verifica que tus datos de entrega sean correctos antes de continuar
        {:else}
          Completa tu dirección para que podamos enviar tu pedido
        {/if}
      </p>
    </div>
  </div>
  
  {#if success}
    <div class="bg-green-50 border-l-4 border-green-500 p-4 rounded-lg mb-4">
      <div class="flex items-center gap-3">
        <CheckCircle class="w-5 h-5 text-green-600" />
        <p class="text-sm text-green-800">{success}</p>
      </div>
    </div>
  {/if}
  
  {#if !mostrarFormulario && direccion.calle}
    <!-- Vista resumida -->
    <div class="bg-white rounded-xl p-4 mb-4">
      <div class="space-y-2 text-sm">
        <p><strong>Para:</strong> {direccion.nombre_destinatario}</p>
        <p><strong>Dirección:</strong> {direccion.calle} {direccion.numero_exterior}{direccion.numero_interior ? ` Int. ${direccion.numero_interior}` : ''}</p>
        <p><strong>Colonia:</strong> {direccion.colonia}</p>
        <p><strong>CP:</strong> {direccion.codigo_postal} - {direccion.ciudad}, {direccion.estado}</p>
        <p><strong>Teléfono:</strong> {direccion.telefono}</p>
      </div>
    </div>
    
    <button
      on:click={() => mostrarFormulario = true}
      class="w-full bg-indigo-600 text-white rounded-xl py-3 hover:bg-indigo-700 transition-all font-medium"
    >
      ✏️ Modificar Dirección
    </button>
  {:else}
    <!-- Formulario completo -->
    <div class="space-y-4">
      
      <!-- Destinatario -->
      <div class="bg-white rounded-xl p-4">
        <h4 class="font-semibold text-gray-900 mb-3">👤 Datos del Destinatario</h4>
        
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label class="label">Nombre completo <span class="text-red-500">*</span></label>
            <input
              type="text"
              bind:value={direccion.nombre_destinatario}
              placeholder="Juan Pérez García"
              class="input"
              required
            />
          </div>
          
          <div>
            <label class="label">Teléfono <span class="text-red-500">*</span></label>
            <div class="relative">
              <Phone class="absolute left-3 top-3 w-4 h-4 text-gray-400" />
              <input
                type="tel"
                bind:value={direccion.telefono}
                placeholder="7121234567"
                maxlength="10"
                class="input pl-10 {direccion.telefono && !validarTelefono(direccion.telefono) ? 'border-red-500' : ''}"
                required
              />
            </div>
            {#if direccion.telefono && !validarTelefono(direccion.telefono)}
              <p class="text-xs text-red-600 mt-1">Debe tener 10 dígitos</p>
            {/if}
          </div>
          
          <div class="md:col-span-2">
            <label class="label">Correo electrónico</label>
            <div class="relative">
              <Mail class="absolute left-3 top-3 w-4 h-4 text-gray-400" />
              <input
                type="email"
                bind:value={direccion.correo}
                placeholder="correo@ejemplo.com"
                class="input pl-10"
              />
            </div>
          </div>
        </div>
      </div>
      
      <!-- Dirección -->
      <div class="bg-white rounded-xl p-4">
        <h4 class="font-semibold text-gray-900 mb-3">🏠 Dirección de Entrega</h4>
        
        <div class="space-y-4">
          <div>
            <label class="label">Calle <span class="text-red-500">*</span></label>
            <input
              type="text"
              bind:value={direccion.calle}
              placeholder="Av. Juárez"
              class="input"
              required
            />
          </div>
          
          <div class="grid grid-cols-2 gap-4">
            <div>
              <label class="label">Número exterior <span class="text-red-500">*</span></label>
              <input
                type="text"
                bind:value={direccion.numero_exterior}
                placeholder="123 o S/N"
                class="input"
                required
              />
            </div>
            
            <div>
              <label class="label">Número interior</label>
              <input
                type="text"
                bind:value={direccion.numero_interior}
                placeholder="Apto 4B"
                class="input"
              />
            </div>
          </div>
          
          <div>
            <label class="label">Colonia <span class="text-red-500">*</span></label>
            <input
              type="text"
              bind:value={direccion.colonia}
              placeholder="Centro"
              class="input"
              required
            />
          </div>
          
          <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label class="label">Código Postal <span class="text-red-500">*</span></label>
              <input
                type="text"
                bind:value={direccion.codigo_postal}
                placeholder="44100"
                maxlength="5"
                class="input {direccion.codigo_postal && !validarCP(direccion.codigo_postal) ? 'border-red-500' : ''}"
                required
              />
              {#if direccion.codigo_postal && !validarCP(direccion.codigo_postal)}
                <p class="text-xs text-red-600 mt-1">5 dígitos</p>
              {/if}
            </div>
            
            <div>
              <label class="label">Ciudad <span class="text-red-500">*</span></label>
              <input
                type="text"
                bind:value={direccion.ciudad}
                placeholder="Guadalajara"
                class="input"
                required
              />
            </div>
            
            <div>
              <label class="label">Estado <span class="text-red-500">*</span></label>
              <select bind:value={direccion.estado} class="input" required>
                <option value="">Selecciona...</option>
                {#each ESTADOS_MX as estado}
                  <option value={estado}>{estado}</option>
                {/each}
              </select>
            </div>
          </div>
        </div>
      </div>
      
      <!-- Referencias -->
      <div class="bg-white rounded-xl p-4">
        <h4 class="font-semibold text-gray-900 mb-3">📍 Referencias y Detalles</h4>
        
        <div class="space-y-4">
          <div>
            <label class="label">Referencias <span class="text-red-500">*</span></label>
            <textarea
              bind:value={direccion.referencias}
              placeholder="Ej: Casa azul con portón negro, entre calles X y Y"
              rows="3"
              class="input resize-none"
              required
            ></textarea>
            <p class="text-xs text-gray-500 mt-1">
              Ayuda al repartidor a encontrar tu domicilio
            </p>
          </div>
          
          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label class="label">Tipo de domicilio <span class="text-red-500">*</span></label>
              <select bind:value={direccion.tipo_domicilio} class="input" required>
                {#each TIPOS_DOMICILIO as tipo}
                  <option value={tipo.value}>{tipo.label}</option>
                {/each}
              </select>
            </div>
            
            <div>
              <label class="label">Horario de entrega</label>
              <select bind:value={direccion.horario_entrega} class="input">
                {#each HORARIOS as horario}
                  <option value={horario.value}>{horario.label}</option>
                {/each}
              </select>
            </div>
          </div>
          
          <div>
            <label class="label">¿Quién recibirá el pedido?</label>
            <input
              type="text"
              bind:value={direccion.persona_recibe}
              placeholder="Nombre de quien recibirá (opcional)"
              class="input"
            />
          </div>
          
          <div>
            <label class="label">Link de Google Maps (opcional)</label>
            <input
              type="url"
              bind:value={direccion.ubicacion_maps}
              placeholder="https://maps.google.com/..."
              class="input"
            />
          </div>
          
          <label class="flex items-start gap-3 cursor-pointer">
            <input
              type="checkbox"
              bind:checked={direccion.autoriza_tercero}
              class="w-5 h-5 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500 mt-1"
            />
            <div class="flex-1">
              <span class="text-sm font-medium text-gray-900">
                Autorizo que otra persona reciba mi pedido
              </span>
              <p class="text-xs text-gray-600 mt-1">
                Si no puedes estar presente, indica quién puede recibir el paquete
              </p>
            </div>
          </label>
          
          {#if direccion.autoriza_tercero}
            <div class="ml-8">
              <textarea
                bind:value={direccion.notas_autorizacion}
                placeholder="Nombre y relación de la persona autorizada"
                rows="2"
                class="input resize-none"
              ></textarea>
            </div>
          {/if}
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
      
      <!-- Checklist visual -->
      <div class="bg-amber-50 border border-amber-200 rounded-xl p-4">
        <h5 class="font-semibold text-amber-900 mb-2 flex items-center gap-2">
          <CheckCircle class="w-5 h-5" />
          Verificación de datos
        </h5>
        <div class="space-y-1 text-sm">
          <div class="flex items-center gap-2">
            <span class="{direccion.nombre_destinatario.trim() ? 'text-green-600' : 'text-gray-400'}">
              {direccion.nombre_destinatario.trim() ? '✓' : '○'}
            </span>
            <span>Nombre completo</span>
          </div>
          <div class="flex items-center gap-2">
            <span class="{validarTelefono(direccion.telefono) ? 'text-green-600' : 'text-gray-400'}">
              {validarTelefono(direccion.telefono) ? '✓' : '○'}
            </span>
            <span>Teléfono válido</span>
          </div>
          <div class="flex items-center gap-2">
            <span class="{direccion.calle.trim() && direccion.numero_exterior.trim() ? 'text-green-600' : 'text-gray-400'}">
              {direccion.calle.trim() && direccion.numero_exterior.trim() ? '✓' : '○'}
            </span>
            <span>Calle y número</span>
          </div>
          <div class="flex items-center gap-2">
            <span class="{validarCP(direccion.codigo_postal) && direccion.ciudad.trim() && direccion.estado ? 'text-green-600' : 'text-gray-400'}">
              {validarCP(direccion.codigo_postal) && direccion.ciudad.trim() && direccion.estado ? '✓' : '○'}
            </span>
            <span>CP, ciudad y estado</span>
          </div>
          <div class="flex items-center gap-2">
            <span class="{direccion.referencias.trim() ? 'text-green-600' : 'text-gray-400'}">
              {direccion.referencias.trim() ? '✓' : '○'}
            </span>
            <span>Referencias de ubicación</span>
          </div>
        </div>
      </div>
      
      <!-- Botones -->
      <div class="flex gap-3">
        <button
          on:click={guardarDireccion}
          disabled={!formularioCompleto || loading}
          class="flex-1 bg-indigo-600 text-white rounded-xl py-4 hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed font-semibold text-lg flex items-center justify-center gap-2 shadow-lg"
        >
          {#if loading}
            <Loader2 class="w-6 h-6 animate-spin" />
            <span>Guardando...</span>
          {:else}
            <CheckCircle class="w-6 h-6" />
            <span>Guardar y Continuar</span>
          {/if}
        </button>
        
        {#if direccion.calle && !loading}
          <button
            on:click={() => mostrarFormulario = false}
            class="px-6 py-4 bg-white border border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 font-medium"
          >
            Cancelar
          </button>
        {/if}
      </div>
    </div>
  {/if}
</div>