<!-- src/routes/+layout.svelte -->
<script>
  import { onMount } from 'svelte';
  import '../app.css';
  import Header from '$lib/components/ui/Header.svelte';
  import Footer from '$lib/components/ui/Footer.svelte';
  import { page } from '$app/stores';
  import { generateCSSVariables, getPaletteById } from '$lib/data/colorPalettes';
  
  export let data;
  
  $: configuracion = data?.configuracion;
  
  // Generar CSS variables desde la paleta guardada
  $: cssVariables = configuracion?.colores_tema?.palette_id 
    ? generateCSSVariables(getPaletteById(configuracion.colores_tema.palette_id))
    : '';
  
  // Detectar si estamos en rutas de admin o login
  $: isAdminRoute = $page.url.pathname.startsWith('/dashboard') || 
                    $page.url.pathname.startsWith('/productos') ||
                    $page.url.pathname.startsWith('/pedidos') ||
                    $page.url.pathname.startsWith('/mensajes') ||
                    $page.url.pathname.startsWith('/configuracion') ||
                    $page.url.pathname.startsWith('/categorias') ||
                    $page.url.pathname.startsWith('/marcas');
  
  $: isLoginRoute = $page.url.pathname === '/login';
  
  // Si es ruta de admin o login, no mostrar header/footer público
  $: isPublicRoute = !isAdminRoute && !isLoginRoute;
  
  // Inyectar CSS dinámicamente cuando cambie la paleta
  $: if (cssVariables) {
    applyDynamicColors(cssVariables);
  }
  
  function applyDynamicColors(variables) {
    if (typeof document === 'undefined') return; // SSR check
    
    // Buscar o crear el elemento style para colores dinámicos
    let styleElement = document.getElementById('dynamic-colors');
    
    if (!styleElement) {
      styleElement = document.createElement('style');
      styleElement.id = 'dynamic-colors';
      document.head.appendChild(styleElement);
    }
    
    // Aplicar las variables CSS
    styleElement.textContent = `:root { ${variables} }`;
  }
  
  // Limpiar al desmontar (opcional)
  onMount(() => {
    return () => {
      if (typeof document !== 'undefined') {
        const styleElement = document.getElementById('dynamic-colors');
        if (styleElement) {
          styleElement.remove();
        }
      }
    };
  });
</script>

{#if isPublicRoute}
  <!-- Para rutas públicas (catálogo, carrito, página principal) -->
  <div class="min-h-screen bg-gray-50 flex flex-col">
    <Header {configuracion} />
    
    <main class="flex-grow container mx-auto px-4 py-8">
      <slot />
    </main>
    
    <Footer {configuracion} />
  </div>
{:else}
  <!-- Para rutas del dashboard y login, usar su propio layout -->
  <slot />
{/if}