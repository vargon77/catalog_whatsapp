<!-- src/routes/empresa/+page.svelte -->
<script>
  import { MapPin, Phone, Mail, Clock, Facebook, Instagram, MessageSquare, Music } from 'lucide-svelte';
  import ImageCarousel from '$lib/components/ui/ImageCarousel.svelte';
  
  export let data;
  
  $: configuracion = data.configuracion;
  
  // Preparar imágenes para carousel (versión pequeña)
  $: imagenesCarrusel = configuracion?.imagenes_tienda || [];
  
  // Preparar tema
  $: temaCarousel = {
    primary: configuracion?.colores_tema?.colors?.primary || '#3B82F6',
    primaryLight: configuracion?.colores_tema?.colors?.primaryLight || '#93C5FD',
    primaryDark: configuracion?.colores_tema?.colors?.primaryDark || '#1D4ED8',
    text: configuracion?.colores_tema?.colors?.text || '#FFFFFF'
  };
  
  $: redesSociales = configuracion?.redes_sociales || {};
  $: tieneRedes = Object.values(redesSociales).some(url => url);
  $: ubicacion = configuracion?.ubicacion || {};
  $: tieneUbicacion = ubicacion.direccion_completa || ubicacion.ciudad || ubicacion.google_maps_url;
  
  const socialIcons = {
    facebook: Facebook,
    instagram: Instagram,
    whatsapp: MessageSquare,
    tiktok: Music
  };
  
  const socialColors = {
    facebook: '#1877F2',
    instagram: '#E4405F',
    whatsapp: '#25D366',
    tiktok: '#000000'
  };
  
  const socialNames = {
    facebook: 'Facebook',
    instagram: 'Instagram',
    whatsapp: 'WhatsApp',
    tiktok: 'TikTok'
  };
</script>

<svelte:head>
  <title>Acerca de {configuracion?.nombre_empresa || 'Nuestra Empresa'}</title>
  <meta name="description" content="Conoce más sobre {configuracion?.nombre_empresa || 'nuestra empresa'}. Información de contacto, ubicación y políticas." />
</svelte:head>

<div class="max-w-7xl mx-auto space-y-8">
  
  <!-- Hero Carousel Pequeño (1/5 del tamaño) -->
  {#if imagenesCarrusel.length > 0}
    <section>
      <ImageCarousel 
        imagenes={imagenesCarrusel}
        titulo={configuracion?.nombre_empresa || 'Nuestra Empresa'}
        subtitulo="Conoce más sobre nosotros"
        ctaTexto="Ver Catálogo"
        ctaEnlace="/"
        altura="small"
        tema={temaCarousel}
      />
    </section>
  {/if}
  
  <!-- Header -->
  <div class="text-center">
    <h1 class="text-4xl font-bold text-gray-900 mb-4">
      {configuracion?.nombre_empresa || 'Nuestra Empresa'}
    </h1>
    {#if configuracion?.descripcion_empresa}
      <p class="text-xl text-gray-600 max-w-3xl mx-auto">
        {configuracion.descripcion_empresa}
      </p>
    {/if}
  </div>
  
  <!-- Información General -->
  <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
    
    <!-- Contacto -->
    <div class="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
      <h2 class="text-2xl font-bold text-gray-900 mb-6 flex items-center gap-2">
        <Phone class="w-6 h-6 text-primary-600" />
        Información de Contacto
      </h2>
      
      <div class="space-y-4">
        {#if configuracion?.whatsapp_numero}
          <div class="flex items-start gap-3">
            <div class="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center flex-shrink-0">
              <MessageSquare class="w-5 h-5 text-green-600" />
            </div>
            <div>
              <p class="font-medium text-gray-900">WhatsApp</p>
              <a 
                href={`https://wa.me/${configuracion.whatsapp_numero}`}
                target="_blank"
                rel="noopener noreferrer"
                class="text-green-600 hover:text-green-700 hover:underline"
              >
                {configuracion.whatsapp_numero}
              </a>
            </div>
          </div>
        {/if}
        
        {#if configuracion?.email}
          <div class="flex items-start gap-3">
            <div class="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0">
              <Mail class="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <p class="font-medium text-gray-900">Email</p>
              <a 
                href={`mailto:${configuracion.email}`}
                class="text-blue-600 hover:text-blue-700 hover:underline"
              >
                {configuracion.email}
              </a>
            </div>
          </div>
        {/if}
        
        {#if configuracion?.horario_atencion}
          <div class="flex items-start gap-3">
            <div class="w-10 h-10 rounded-full bg-purple-100 flex items-center justify-center flex-shrink-0">
              <Clock class="w-5 h-5 text-purple-600" />
            </div>
            <div>
              <p class="font-medium text-gray-900">Horario de Atención</p>
              <p class="text-gray-600">{configuracion.horario_atencion}</p>
            </div>
          </div>
        {/if}
      </div>
    </div>
    
    <!-- Ubicación -->
    <div class="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
      <h2 class="text-2xl font-bold text-gray-900 mb-6 flex items-center gap-2">
        <MapPin class="w-6 h-6 text-primary-600" />
        Ubicación
      </h2>
      
      {#if tieneUbicacion}
        <div class="space-y-4">
          {#if ubicacion.direccion_completa || configuracion?.direccion}
            <div class="flex items-start gap-3">
              <div class="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center flex-shrink-0">
                <MapPin class="w-5 h-5 text-red-600" />
              </div>
              <div>
                <p class="font-medium text-gray-900">Dirección</p>
                <p class="text-gray-600">{ubicacion.direccion_completa || configuracion?.direccion}</p>
                {#if ubicacion.ciudad || ubicacion.estado}
                  <p class="text-gray-500 text-sm mt-1">
                    {ubicacion.ciudad}{ubicacion.ciudad && ubicacion.estado ? ', ' : ''}{ubicacion.estado}
                    {ubicacion.codigo_postal ? ` ${ubicacion.codigo_postal}` : ''}
                  </p>
                {/if}
              </div>
            </div>
          {/if}
          
          {#if ubicacion.google_maps_url}
            <a 
              href={ubicacion.google_maps_url}
              target="_blank"
              rel="noopener noreferrer"
              class="inline-flex items-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
            >
              <MapPin class="w-4 h-4" />
              Ver en Google Maps
            </a>
          {/if}
        </div>
      {:else}
        <p class="text-gray-500 italic">No hay información de ubicación disponible</p>
      {/if}
    </div>
  </div>
  
  <!-- Redes Sociales -->
  {#if tieneRedes}
    <div class="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
      <h2 class="text-2xl font-bold text-gray-900 mb-6">Síguenos en Redes Sociales</h2>
      
      <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
        {#each Object.entries(redesSociales) as [red, url]}
          {#if url}
            <a
              href={url}
              target="_blank"
              rel="noopener noreferrer"
              class="flex flex-col items-center gap-3 p-4 rounded-lg border-2 border-gray-200 hover:border-primary-500 hover:shadow-md transition-all group"
            >
              <div 
                class="w-16 h-16 rounded-full flex items-center justify-center text-white transition-transform group-hover:scale-110"
                style="background-color: {socialColors[red] || '#6B7280'}"
              >
                <svelte:component this={socialIcons[red]} class="w-8 h-8" />
              </div>
              <span class="font-medium text-gray-700 group-hover:text-primary-600">
                {socialNames[red]}
              </span>
            </a>
          {/if}
        {/each}
      </div>
    </div>
  {/if}
  
  <!-- Políticas -->
  <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
    
    <!-- Términos y Condiciones -->
    {#if configuracion?.terminos_condiciones}
      <div class="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <h2 class="text-2xl font-bold text-gray-900 mb-4">Términos y Condiciones</h2>
        <div class="prose prose-sm max-w-none text-gray-600">
          <p class="whitespace-pre-line">{configuracion.terminos_condiciones}</p>
        </div>
      </div>
    {/if}
    
    <!-- Política de Privacidad -->
    {#if configuracion?.politica_privacidad}
      <div class="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <h2 class="text-2xl font-bold text-gray-900 mb-4">Política de Privacidad</h2>
        <div class="prose prose-sm max-w-none text-gray-600">
          <p class="whitespace-pre-line">{configuracion.politica_privacidad}</p>
        </div>
      </div>
    {/if}
  </div>
  
  <!-- CTA Final -->
  <div class="bg-gradient-to-r from-primary-500 to-primary-600 rounded-xl p-8 text-center text-white">
    <h2 class="text-3xl font-bold mb-4">¿Listo para hacer tu pedido?</h2>
    <p class="text-lg mb-6 opacity-90">
      Explora nuestro catálogo y encuentra los productos que necesitas
    </p>
    <div class="flex flex-col sm:flex-row gap-4 justify-center">
      <a 
        href="/"
        class="inline-flex items-center justify-center gap-2 px-6 py-3 bg-white text-primary-600 rounded-lg font-semibold hover:bg-gray-100 transition-colors"
      >
        Ver Catálogo
      </a>
      {#if configuracion?.whatsapp_numero}
        <a 
          href={`https://wa.me/${configuracion.whatsapp_numero}`}
          target="_blank"
          rel="noopener noreferrer"
          class="inline-flex items-center justify-center gap-2 px-6 py-3 bg-green-500 text-white rounded-lg font-semibold hover:bg-green-600 transition-colors"
        >
          <MessageSquare class="w-5 h-5" />
          Contactar por WhatsApp
        </a>
      {/if}
    </div>
  </div>
</div>