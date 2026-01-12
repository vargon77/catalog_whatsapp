<!-- src/lib/components/ui/ImageCarousel.svelte -->
<!-- ✅ MEJORADO: Responsive optimizado, tamaño ajustable, mejor distribución -->
<script>
  import { onMount, onDestroy } from 'svelte';
  import { ChevronLeft, ChevronRight, ShoppingBag, Star, Shield, Truck } from 'lucide-svelte';
  import { browser } from '$app/environment';

  // Props
  export let imagenes = [];
  export let titulo = '';
  export let subtitulo = '';
  export let ctaTexto = 'Explorar Catálogo';
  export let ctaEnlace = '/productos';
  export let altura = 'small'; // 'small' | 'medium' | 'large'
  export let tema = {
    primary: '#3B82F6',
    primaryLight: '#93C5FD',
    primaryDark: '#1D4ED8',
    text: '#FFFFFF'
  };

  // ✅ Normalizar imagenes
  $: imagenesNormalizadas = imagenes.map(img => {
    if (typeof img === 'string') {
      return { url: img };
    }
    return img;
  });

  let currentIndex = 0;
  let intervalId = null;
  let isPaused = false;
  let touchStartX = 0;
  let touchEndX = 0;

  const AUTO_SLIDE_INTERVAL = 5000;

  const features = [
    { icon: Star, text: 'Productos Premium', color: '#FBBF24' },
    { icon: Shield, text: 'Garantía de Calidad', color: '#10B981' },
    { icon: Truck, text: 'Envío Rápido', color: '#8B5CF6' }
  ];

  // ✅ Alturas responsivas optimizadas
  const alturas = {
    small: 'h-[35vh] min-h-[280px] max-h-[400px]',
    medium: 'h-[50vh] min-h-[400px] max-h-[600px]',
    large: 'h-[70vh] min-h-[500px] max-h-[800px]'
  };

  $: claseAltura = alturas[altura] || alturas.small;

  function nextSlide() {
    currentIndex = (currentIndex + 1) % imagenesNormalizadas.length;
  }

  function prevSlide() {
    currentIndex = currentIndex === 0 ? imagenesNormalizadas.length - 1 : currentIndex - 1;
  }

  function goToSlide(index) {
    currentIndex = index;
    resetAutoSlide();
  }

  function handleTouchStart(event) {
    if (!browser) return;
    touchStartX = event.touches[0].clientX;
    pauseCarousel();
  }

  function handleTouchEnd(event) {
    if (!browser) return;
    touchEndX = event.changedTouches[0].clientX;
    handleSwipe();
    setTimeout(resumeCarousel, 1000);
  }

  function handleSwipe() {
    const swipeThreshold = 50;
    const diff = touchStartX - touchEndX;
    if (Math.abs(diff) > swipeThreshold) {
      diff > 0 ? nextSlide() : prevSlide();
    }
  }

  function startAutoSlide() {
    if (!browser) return;
    if (intervalId) clearInterval(intervalId);
    if (imagenesNormalizadas.length > 1) {
      intervalId = setInterval(() => {
        if (!isPaused) nextSlide();
      }, AUTO_SLIDE_INTERVAL);
    }
  }

  function resetAutoSlide() {
    if (!browser) return;
    if (intervalId) clearInterval(intervalId);
    startAutoSlide();
  }

  function pauseCarousel() {
    isPaused = true;
  }

  function resumeCarousel() {
    isPaused = false;
  }

  onMount(() => {
    if (!browser) return;
    startAutoSlide();
  });

  onDestroy(() => {
    if (!browser) return;
    if (intervalId) clearInterval(intervalId);
  });

  function getGradient() {
    return `linear-gradient(135deg, ${tema.primary} 0%, ${tema.primaryDark} 100%)`;
  }

  function getOverlayGradient() {
    return `linear-gradient(to bottom, rgba(0,0,0,0.3) 0%, rgba(0,0,0,0.5) 50%, rgba(0,0,0,0.7) 100%)`;
  }
</script>

<div 
  class="carousel-container {claseAltura} w-full rounded-lg md:rounded-xl overflow-hidden"
  on:mouseenter={pauseCarousel}
  on:mouseleave={resumeCarousel}
  on:touchstart={handleTouchStart}
  on:touchend={handleTouchEnd}
>
  {#if imagenesNormalizadas && imagenesNormalizadas.length > 0}
    <div class="carousel-wrapper relative w-full h-full">
      {#each imagenesNormalizadas as imagen, index}
        <div 
          class="carousel-slide absolute inset-0 transition-opacity duration-700 {index === currentIndex ? 'opacity-100 z-10' : 'opacity-0'}"
          style="background-image: url('{imagen.url}'); background-size: cover; background-position: center;"
        >
          <div class="absolute inset-0" style="background: {getOverlayGradient()}"></div>
          
          <div class="relative z-20 h-full flex items-center justify-center px-4 sm:px-6">
            <div class="text-center max-w-4xl w-full">
              <div class="inline-block px-3 py-1.5 rounded-full mb-3 md:mb-4" style="background-color: {tema.primary}">
                <span class="text-white text-xs md:text-sm font-semibold">✨ Destacado</span>
              </div>
              
              <h1 class="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold mb-2 md:mb-3" style="color: {tema.text}; text-shadow: 0 4px 6px rgba(0,0,0,0.3);">
                {titulo}
              </h1>
              
              <p class="text-sm sm:text-base md:text-lg mb-4 md:mb-6 opacity-90" style="color: {tema.text}; text-shadow: 0 2px 4px rgba(0,0,0,0.3);">
                {subtitulo}
              </p>
              
              <div class="grid grid-cols-3 gap-2 md:gap-3 mb-4 md:mb-6 max-w-lg mx-auto">
                {#each features as feature}
                  <div class="flex flex-col items-center gap-1.5 p-2 md:p-3 bg-white/10 backdrop-blur-sm rounded-lg border border-white/20">
                    <div class="w-8 h-8 md:w-10 md:h-10 rounded-full bg-white/20 flex items-center justify-center">
                      <svelte:component this={feature.icon} class="w-4 h-4 md:w-5 md:h-5" style="color: {feature.color}" />
                    </div>
                    <span class="text-xs md:text-sm font-semibold text-white text-center leading-tight">{feature.text}</span>
                  </div>
                {/each}
              </div>
              
              <div class="flex flex-col sm:flex-row gap-2 md:gap-3 justify-center items-center">
                <a 
                  href={ctaEnlace}
                  class="inline-flex items-center gap-2 px-4 md:px-6 py-2.5 md:py-3 rounded-full font-semibold text-sm md:text-base shadow-lg hover:shadow-xl transition-all hover:-translate-y-0.5"
                  style="background-color: {tema.primary}; color: {tema.text}"
                >
                  <ShoppingBag class="w-4 h-4 md:w-5 md:h-5" />
                  {ctaTexto}
                </a>
                <a 
                  href="/empresa"
                  class="inline-flex items-center gap-2 px-4 md:px-6 py-2.5 md:py-3 rounded-full font-semibold text-sm md:text-base bg-transparent border-2 hover:bg-white/10 transition-all"
                  style="border-color: {tema.primary}; color: {tema.primary}"
                >
                  Conócenos
                </a>
              </div>
            </div>
          </div>
        </div>
      {/each}
      
      {#if imagenesNormalizadas.length > 1}
        <button 
          class="absolute left-2 md:left-4 top-1/2 -translate-y-1/2 z-30 w-10 h-10 md:w-12 md:h-12 rounded-full flex items-center justify-center text-white opacity-90 hover:opacity-100 transition-all hover:scale-110"
          on:click={prevSlide}
          style="background-color: {tema.primary}"
        >
          <ChevronLeft class="w-5 h-5 md:w-6 md:h-6" />
        </button>
        
        <button 
          class="absolute right-2 md:right-4 top-1/2 -translate-y-1/2 z-30 w-10 h-10 md:w-12 md:h-12 rounded-full flex items-center justify-center text-white opacity-90 hover:opacity-100 transition-all hover:scale-110"
          on:click={nextSlide}
          style="background-color: {tema.primary}"
        >
          <ChevronRight class="w-5 h-5 md:w-6 md:h-6" />
        </button>
        
        <div class="absolute bottom-3 md:bottom-4 left-0 right-0 z-30 flex flex-col items-center gap-2">
          <div class="flex gap-1.5">
            {#each imagenesNormalizadas as _, index}
              <button 
                class="h-1.5 rounded-full transition-all {index === currentIndex ? 'w-8 md:w-10' : 'w-6 md:w-8'}"
                style={index === currentIndex ? `background-color: ${tema.primary}` : 'background-color: rgba(255,255,255,0.3)'}
                on:click={() => goToSlide(index)}
              />
            {/each}
          </div>
          <div class="text-xs md:text-sm font-semibold px-2 py-1 rounded-full bg-black/30 backdrop-blur-sm" style="color: {tema.text}">
            {currentIndex + 1} / {imagenesNormalizadas.length}
          </div>
        </div>
      {/if}
    </div>
  {:else}
    <div class="w-full h-full flex items-center justify-center p-4 md:p-8" style="background: {getGradient()}">
      <div class="text-center max-w-3xl relative z-10">
        <h1 class="text-3xl md:text-5xl font-bold mb-4" style="color: {tema.text}">
          {titulo || 'Tu Tienda Online'}
        </h1>
        <p class="text-base md:text-xl mb-6 opacity-90" style="color: {tema.text}">
          {subtitulo || 'Productos de calidad con envío a todo el país'}
        </p>
        <div class="flex flex-col sm:flex-row gap-3 justify-center mb-6">
          {#each features as feature}
            <div class="flex items-center gap-2 px-4 py-2 bg-white/10 rounded-lg backdrop-blur-sm">
              <svelte:component this={feature.icon} class="w-5 h-5" style="color: {feature.color}" />
              <span class="text-sm font-semibold text-white">{feature.text}</span>
            </div>
          {/each}
        </div>
        <a 
          href={ctaEnlace}
          class="inline-flex items-center gap-2 px-6 py-3 rounded-full font-semibold shadow-lg"
          style="background-color: {tema.text}; color: {tema.primary}"
        >
          <ShoppingBag class="w-5 h-5" />
          {ctaTexto}
        </a>
      </div>
    </div>
  {/if}
</div>