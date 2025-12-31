<!-- src/routes/+layout.svelte -->
<script>
  import '../app.css';
  import Header from '$lib/components/ui/Header.svelte';
  import Footer from '$lib/components/ui/Footer.svelte';
  import { page } from '$app/stores';
  
  export let data;
  
  $: configuracion = data?.configuracion;
  
  // Detectar si estamos en rutas de admin o login
  $: isAdminRoute = $page.url.pathname.startsWith('/dashboard') || 
                    $page.url.pathname.startsWith('/productos') ||
                    $page.url.pathname.startsWith('/pedidos') ||
                    $page.url.pathname.startsWith('/mensajes') ||
                    $page.url.pathname.startsWith('/configuracion') ||
                    $page.url.pathname.startsWith('/categorias');
  
  $: isLoginRoute = $page.url.pathname === '/login';
  
  // Si es ruta de admin o login, no mostrar header/footer público
  $: isPublicRoute = !isAdminRoute && !isLoginRoute;
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