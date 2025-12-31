<script>
  import { Menu, X, ShoppingCart, Store, Settings } from 'lucide-svelte';
  import { cantidadItems } from '$lib/stores/carritoStore';
  import { auth } from '$lib/stores/authStore';
  import CarritoIcon from '$lib/components/cart/CarritoIcon.svelte';
  
  let menuAbierto = false;
  
  const navLinks = [
    { href: '/', label: 'Catálogo' },
    { href: '/carrito', label: 'Mi Carrito' }
  ];
  
  // Verificar si el usuario está autenticado para mostrar enlace al dashboard
  $: mostrarDashboard = $auth.isAuthenticated;
</script>

<header class="bg-white shadow-md sticky top-0 z-50">
  <div class="container mx-auto px-4">
    <div class="flex justify-between items-center py-4">
      <!-- Logo -->
      <a href="/" class="flex items-center space-x-2 text-primary-700 hover:text-primary-800">
        <Store class="w-8 h-8" />
        <span class="text-xl font-bold">CatálogoExpress</span>
      </a>
      
      <!-- Desktop Navigation -->
      <nav class="hidden md:flex items-center space-x-6">
        {#each navLinks as link}
          <a 
            href={link.href} 
            class="text-gray-700 hover:text-primary-600 font-medium transition-colors"
            on:click={() => menuAbierto = false}
          >
            {link.label}
          </a>
        {/each}
        
        <!-- Enlace al Dashboard si está autenticado -->
        {#if mostrarDashboard}
          <a 
            href="/dashboard" 
            class="flex items-center space-x-2 text-gray-700 hover:text-primary-600 font-medium transition-colors"
            title="Panel de Administración"
          >
            <Settings class="w-5 h-5" />
            <span>Dashboard</span>
          </a>
        {/if}
        
        <!-- Carrito Icon para desktop -->
        <div class="ml-4">
          <CarritoIcon />
        </div>
      </nav>
      
      <!-- Mobile Menu Button -->
      <div class="flex items-center space-x-4 md:hidden">
        <!-- Icono de Dashboard en móvil si está autenticado -->
        {#if mostrarDashboard}
          <a 
            href="/dashboard" 
            class="p-2 rounded-md text-gray-700 hover:bg-gray-100"
            title="Panel de Administración"
          >
            <Settings class="w-5 h-5" />
          </a>
        {/if}
        
        <CarritoIcon />
        <button 
          class="p-2 rounded-md text-gray-700 hover:bg-gray-100"
          on:click={() => menuAbierto = !menuAbierto}
          aria-label={menuAbierto ? 'Cerrar menú' : 'Abrir menú'}
        >
          {#if menuAbierto}
            <X class="w-6 h-6" />
          {:else}
            <Menu class="w-6 h-6" />
          {/if}
        </button>
      </div>
    </div>
    
    <!-- Mobile Menu -->
    {#if menuAbierto}
      <div class="md:hidden border-t border-gray-200 py-4">
        <div class="flex flex-col space-y-3">
          {#each navLinks as link}
            <a 
              href={link.href} 
              class="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-md font-medium"
              on:click={() => menuAbierto = false}
            >
              {link.label}
            </a>
          {/each}
          
          <!-- Enlace al Dashboard en móvil -->
          {#if mostrarDashboard}
            <a 
              href="/dashboard" 
              class="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-md font-medium flex items-center space-x-2"
              on:click={() => menuAbierto = false}
            >
              <Settings class="w-5 h-5" />
              <span>Panel de Administración</span>
            </a>
          {/if}
        </div>
      </div>
    {/if}
  </div>
</header>