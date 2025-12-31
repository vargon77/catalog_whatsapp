<!-- src/routes/(admin)/+layout.svelte -->
<script>
  import DashboardSidebar from '$lib/components/dashboard/DashboardSidebar.svelte';
  
  export let data; // Recibe datos del +layout.server.js (usuario)
  
  let sidebarOpen = false;
</script>

<div class="flex h-screen overflow-hidden bg-gray-50">
  <!-- Sidebar -->
  <DashboardSidebar bind:mobileOpen={sidebarOpen} user={data.user} />
  
  <!-- Main Content -->
  <div class="flex-1 flex flex-col overflow-hidden">
    <!-- Header Mobile -->
    <header class="md:hidden bg-white shadow-sm z-10">
      <div class="flex items-center justify-between p-4">
        <button 
          on:click={() => sidebarOpen = !sidebarOpen}
          class="text-gray-600 hover:text-gray-900"
        >
          <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h16"/>
          </svg>
        </button>
        <span class="font-semibold text-gray-800">Dashboard</span>
      </div>
    </header>

    <!-- Content Area -->
    <main class="flex-1 overflow-y-auto p-4 md:p-6 lg:p-8">
      <slot />
    </main>
  </div>
</div>