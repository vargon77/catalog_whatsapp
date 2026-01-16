<!-- src/lib/components/dashboard/DashboardSidebar.svelte -->
<!-- ✅ CORRECCIÓN: Indicador de módulo activo funcional -->
<script>
  import { 
    LayoutDashboard, 
    Package, 
    ShoppingBag, 
    MessageCircle,
    Settings,
    Store,
    LogOut,
    Home,
    X,
    Tag,
    Award
  } from 'lucide-svelte';
  import { goto } from '$app/navigation';
  import { page } from '$app/stores';
  import { auth } from '$lib/stores/authStore';
  import { BarChart3 } from 'lucide-svelte';
  
  export let collapsed = false;
  export let mobileOpen = false;
  
  const menuItems = [
    { icon: LayoutDashboard, label: 'Resumen',  href: '/dashboard', paths: ['/dashboard'] },
    { icon: Package, label: 'Productos', href: '/productos', paths: ['/productos'] },
    { icon: Tag, label: 'Categorías', href: '/categorias', paths: ['/categorias'] },
    { icon: Award, label: 'Marcas', href: '/marcas', paths: ['/marcas'] },
    { icon: ShoppingBag, label: 'Pedidos', href: '/pedidos', paths: ['/pedidos'] },
    { icon: BarChart3, label: 'Reportes', href: '/reportes', paths: ['/reportes'] },
    { icon: MessageCircle, label: 'Mensajes', href: '/mensajes', paths: ['/mensajes'] },
    { icon: Settings, label: 'Configuración', href: '/configuracion', paths: ['/configuracion'] }
  ];
  
  async function handleLogout() {
    try {
      auth.logout();
      await fetch('/logout', {
        method: 'POST',
        credentials: 'same-origin'
      });
      await goto('/login', { replaceState: true, invalidateAll: true });
    } catch (error) {
      console.error('Error en logout:', error);
      window.location.href = '/login';
    }
  }
  
  function handleNavClick() {
    if (window.innerWidth < 768) {
      mobileOpen = false;
    }
  }
  
  $: currentPath = $page.url.pathname;
  
  // ✅ CORRECCIÓN: Función mejorada para detectar módulo activo
  function isActive(item) {
    // Coincidencia exacta para dashboard
    if (item.href === '/dashboard') {
      return currentPath === '/dashboard';
    }
    
    // Para otros módulos, verificar si la ruta actual comienza con el módulo
    // Ejemplo: /productos, /productos/nuevo, /productos/123/editar → todos activan "Productos"
    return currentPath.startsWith(item.href);
  }
</script>

<!-- Sidebar Desktop -->
<aside 
  class="h-full bg-gray-900 text-white flex flex-col transition-all duration-300 ease-in-out hidden md:flex"
  class:w-64={!collapsed}
  class:w-20={collapsed}
>
  <!-- Logo -->
  <div class="p-4 border-b border-gray-800 flex items-center justify-between">
    {#if !collapsed}
      <div class="flex items-center space-x-3">
        <div class="w-10 h-10 bg-primary-500 rounded-lg flex items-center justify-center flex-shrink-0">
          <Store class="w-6 h-6" />
        </div>
        <div class="overflow-hidden">
          <h1 class="font-bold text-base">CatálogoExpress</h1>
          <p class="text-gray-400 text-xs">Panel Admin</p>
        </div>
      </div>
    {:else}
      <div class="w-10 h-10 bg-primary-500 rounded-lg flex items-center justify-center mx-auto">
        <Store class="w-6 h-6" />
      </div>
    {/if}
  </div>
  
  <!-- Menú -->
  <nav class="flex-1 p-3 overflow-y-auto">
    <div class="space-y-1">
      {#each menuItems as item}
        <a
          href={item.href}
          class="flex items-center px-3 py-3 rounded-lg transition-colors group relative"
          class:bg-primary-600={isActive(item)}
          class:text-white={isActive(item)}
          class:hover:bg-gray-800={!isActive(item)}
          class:justify-center={collapsed}
          title={collapsed ? item.label : ''}
        >
          <svelte:component this={item.icon} class="w-5 h-5 flex-shrink-0" />
          {#if !collapsed}
            <span class="ml-3 font-medium">{item.label}</span>
          {/if}
          
          <!-- ✅ Indicador visual cuando está activo (modo collapsed) -->
          {#if collapsed && isActive(item)}
            <div class="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-8 bg-primary-400 rounded-r-full"></div>
          {/if}
          
          <!-- Tooltip para collapsed -->
          {#if collapsed}
            <div class="absolute left-full ml-2 px-2 py-1 bg-gray-800 text-white text-sm rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none z-50">
              {item.label}
            </div>
          {/if}
        </a>
      {/each}
    </div>
  </nav>
  
  <!-- Tienda pública -->
  <div class="p-3 border-t border-gray-800">
    <a
      href="/"
      target="_blank"
      class="flex items-center px-3 py-3 rounded-lg bg-gray-800 hover:bg-gray-700 transition-colors"
      class:justify-center={collapsed}
      title={collapsed ? 'Ver Tienda' : ''}
    >
      <Home class="w-5 h-5 flex-shrink-0" />
      {#if !collapsed}
        <span class="ml-3 font-medium">Ver Tienda</span>
      {/if}
    </a>
  </div>
  
  <!-- Usuario y logout -->
  <div class="p-3 border-t border-gray-800">
    {#if !collapsed && $auth.user}
      <div class="px-3 mb-3">
        <p class="font-medium text-sm truncate">{$auth.user?.name || 'Admin'}</p>
        <p class="text-gray-400 text-xs truncate">{$auth.user?.email || 'admin@app.com'}</p>
      </div>
    {/if}
    
    <button
      on:click={handleLogout}
      class="flex items-center w-full px-3 py-3 rounded-lg hover:bg-red-900/20 text-red-300 hover:text-red-200 transition-colors"
      class:justify-center={collapsed}
      title={collapsed ? 'Cerrar Sesión' : ''}
    >
      <LogOut class="w-5 h-5 flex-shrink-0" />
      {#if !collapsed}
        <span class="ml-3 font-medium">Cerrar Sesión</span>
      {/if}
    </button>
  </div>
</aside>

<!-- Sidebar Mobile -->
{#if mobileOpen}
  <div class="fixed inset-0 z-50 md:hidden">
    <!-- Overlay -->
    <div
      class="fixed inset-0 bg-black bg-opacity-50"
      on:click={() => mobileOpen = false}
    ></div>
    
    <!-- Sidebar -->
    <aside class="fixed inset-y-0 left-0 w-64 bg-gray-900 text-white flex flex-col shadow-2xl">
      <!-- Header -->
      <div class="p-4 border-b border-gray-800 flex items-center justify-between">
        <div class="flex items-center space-x-3">
          <div class="w-10 h-10 bg-primary-500 rounded-lg flex items-center justify-center">
            <Store class="w-6 h-6" />
          </div>
          <div>
            <h1 class="font-bold text-base">CatálogoExpress</h1>
            <p class="text-gray-400 text-xs">Panel Admin</p>
          </div>
        </div>
        <button
          on:click={() => mobileOpen = false}
          class="p-2 rounded-lg hover:bg-gray-800"
        >
          <X class="w-5 h-5" />
        </button>
      </div>
      
      <!-- Menú -->
      <nav class="flex-1 p-3 overflow-y-auto">
        <div class="space-y-1">
          {#each menuItems as item}
            <a
              href={item.href}
              on:click={handleNavClick}
              class="flex items-center px-3 py-3 rounded-lg transition-colors"
              class:bg-primary-600={isActive(item)}
              class:text-white={isActive(item)}
              class:hover:bg-gray-800={!isActive(item)}
            >
              <svelte:component this={item.icon} class="w-5 h-5" />
              <span class="ml-3 font-medium">{item.label}</span>
            </a>
          {/each}
        </div>
      </nav>
      
      <!-- Tienda -->
      <div class="p-3 border-t border-gray-800">
        <a
          href="/"
          target="_blank"
          on:click={handleNavClick}
          class="flex items-center px-3 py-3 rounded-lg bg-gray-800 hover:bg-gray-700 transition-colors"
        >
          <Home class="w-5 h-5" />
          <span class="ml-3 font-medium">Ver Tienda</span>
        </a>
      </div>
      
      <!-- Usuario -->
      <div class="p-3 border-t border-gray-800">
        {#if $auth.user}
          <div class="px-3 mb-3">
            <p class="font-medium text-sm">{$auth.user?.name || 'Admin'}</p>
            <p class="text-gray-400 text-xs">{$auth.user?.email || 'admin@app.com'}</p>
          </div>
        {/if}
        
        <button
          on:click={handleLogout}
          class="flex items-center w-full px-3 py-3 rounded-lg hover:bg-red-900/20 text-red-300 hover:text-red-200 transition-colors"
        >
          <LogOut class="w-5 h-5" />
          <span class="ml-3 font-medium">Cerrar Sesión</span>
        </button>
      </div>
    </aside>
  </div>
{/if}