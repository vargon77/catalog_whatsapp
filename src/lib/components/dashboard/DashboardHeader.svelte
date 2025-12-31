<script>
  import { Menu, Bell, Search, User, Settings, HelpCircle, Grid } from 'lucide-svelte';
  import { goto } from '$app/navigation';
  import { auth } from '$lib/stores/authStore';
  
  export let sidebarCollapsed = false;
  export let mobileOpen = false;
  
  let searchQuery = '';
  
  function toggleMobileMenu() {
    mobileOpen = !mobileOpen;
  }
  
  function toggleSidebar() {
    sidebarCollapsed = !sidebarCollapsed;
  }
</script>

<header class="bg-white border-b border-gray-200 sticky top-0 z-20 shadow-sm">
  <div class="px-4 sm:px-6 py-4">
    <div class="flex items-center justify-between">
      <!-- Left side: Toggle and Logo móvil -->
      <div class="flex items-center space-x-3">
        <!-- Toggle móvil -->
        <button
          on:click={toggleMobileMenu}
          class="p-2 rounded-lg hover:bg-gray-100 transition-colors md:hidden"
          title="Abrir menú"
        >
          <Menu class="w-5 h-5 text-gray-600" />
        </button>
        
        <!-- Toggle desktop -->
        <button
          on:click={toggleSidebar}
          class="p-2 rounded-lg hover:bg-gray-100 transition-colors hidden md:block"
          title={sidebarCollapsed ? 'Expandir menú' : 'Contraer menú'}
        >
          <Grid class="w-5 h-5 text-gray-600" />
        </button>
        
        <!-- Logo móvil -->
        <div class="md:hidden">
          <div class="flex items-center space-x-2">
            <div class="w-8 h-8 bg-primary-500 rounded-lg flex items-center justify-center">
              <User class="w-4 h-4 text-white" />
            </div>
            <span class="font-bold text-gray-800 text-sm">Admin</span>
          </div>
        </div>
      </div>
      
      <!-- Search Bar (desktop) -->
      <div class="hidden md:block flex-1 max-w-xl mx-4">
        <div class="relative">
          <Search class="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
          <input
            type="text"
            bind:value={searchQuery}
            placeholder="Buscar productos, pedidos, clientes..."
            class="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
          />
        </div>
      </div>
      
      <!-- Right side: Actions and User -->
      <div class="flex items-center space-x-2 sm:space-x-4">
        <!-- Search móvil -->
        <button
          class="p-2 rounded-lg hover:bg-gray-100 transition-colors md:hidden"
          title="Buscar"
          on:click={() => {/* Implementar búsqueda móvil */}}
        >
          <Search class="w-5 h-5 text-gray-600" />
        </button>
        
        <!-- Notificaciones -->
        <div class="relative">
          <button
            class="p-2 rounded-lg hover:bg-gray-100 transition-colors"
            title="Notificaciones"
          >
            <Bell class="w-5 h-5 text-gray-600" />
            <span class="absolute -top-1 -right-1 w-2 h-2 bg-red-500 rounded-full"></span>
          </button>
        </div>
        
        <!-- User Profile Desktop -->
        <div class="hidden md:flex items-center space-x-3">
          <div class="text-right">
            <p class="font-medium text-gray-800 text-sm">{$auth.user?.name || 'Administrador'}</p>
            <p class="text-gray-500 text-xs">Panel de Control</p>
          </div>
          <div class="relative group">
            <button
              class="w-10 h-10 bg-gradient-to-br from-primary-500 to-primary-600 rounded-full flex items-center justify-center text-white font-bold hover:opacity-90 transition-opacity"
              title="Perfil de usuario"
            >
              <User class="w-5 h-5" />
            </button>
            <!-- Dropdown menu -->
            <div class="absolute right-0 top-full mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 py-2 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-50">
              <a href="/dashboard/configuracion" class="block px-4 py-2 text-gray-700 hover:bg-gray-100">Configuración</a>
              <a href="/dashboard/perfil" class="block px-4 py-2 text-gray-700 hover:bg-gray-100">Mi Perfil</a>
              <div class="border-t border-gray-200 my-1"></div>
              <button on:click={() => { auth.logout(); goto('/dashboard/login'); }} class="block w-full text-left px-4 py-2 text-red-600 hover:bg-red-50">Cerrar Sesión</button>
            </div>
          </div>
        </div>
      </div>
    </div>
    
    <!-- Search Bar móvil -->
    <div class="mt-4 md:hidden">
      <div class="relative">
        <Search class="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
        <input
          type="text"
          bind:value={searchQuery}
          placeholder="Buscar..."
          class="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
        />
      </div>
    </div>
  </div>
</header>