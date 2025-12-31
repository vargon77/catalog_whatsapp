<!-- src/routes/(auth)/login/+page.svelte -->
<script>
  import { enhance } from '$app/forms';
  import { Store, Lock, User } from 'lucide-svelte';
  
  export let form; // Recibe datos del server (errores)
  
  let loading = false;
</script>

<div class="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center p-4">
  <div class="w-full max-w-md">
    <!-- Card de login -->
    <div class="bg-white rounded-2xl shadow-xl p-8">
      <!-- Logo y título -->
      <div class="text-center mb-8">
        <div class="inline-flex items-center justify-center w-16 h-16 bg-primary-100 rounded-2xl mb-4">
          <Store class="w-8 h-8 text-primary-600" />
        </div>
        <h1 class="text-2xl font-bold text-gray-800">Panel de Administración</h1>
        <p class="text-gray-600 mt-2">Ingresa tus credenciales para continuar</p>
      </div>
      
      <!-- Formulario con form actions -->
      <form 
        method="POST"
        use:enhance={() => {
          loading = true;
          return async ({ update }) => {
            await update();
            loading = false;
          };
        }}
      >
        <!-- Error message -->
        {#if form?.error}
          <div class="mb-6 p-3 bg-red-50 border border-red-100 rounded-lg">
            <div class="flex items-center">
              <div class="flex-shrink-0">
                <svg class="h-5 w-5 text-red-400" fill="currentColor" viewBox="0 0 20 20">
                  <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clip-rule="evenodd"/>
                </svg>
              </div>
              <div class="ml-3">
                <p class="text-sm text-red-700">{form.error}</p>
              </div>
            </div>
          </div>
        {/if}
        
        <!-- Usuario -->
        <div class="mb-6">
          <label class="label flex items-center">
            <User class="w-4 h-4 mr-2" />
            Usuario
          </label>
          <div class="relative">
            <input
              type="text"
              name="username"
              value={form?.username ?? ''}
              placeholder="admin"
              required
              class="input pl-10"
              disabled={loading}
            />
            <User class="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
          </div>
        </div>
        
        <!-- Contraseña -->
        <div class="mb-8">
          <label class="label flex items-center">
            <Lock class="w-4 h-4 mr-2" />
            Contraseña
          </label>
          <div class="relative">
            <input
              type="password"
              name="password"
              placeholder="••••••••"
              required
              class="input pl-10"
              disabled={loading}
            />
            <Lock class="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
          </div>
        </div>
        
        <!-- Botón de envío -->
        <button
          type="submit"
          class="w-full btn-primary flex items-center justify-center"
          disabled={loading}
        >
          {#if loading}
            <svg class="animate-spin -ml-1 mr-3 h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
              <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
              <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            Verificando...
          {:else}
            Iniciar Sesión
          {/if}
        </button>
      </form>
      
      <!-- Credenciales de demo -->
      <div class="mt-8 pt-6 border-t border-gray-100">
        <p class="text-sm text-gray-600 text-center">
          <strong>Credenciales de demostración:</strong><br>
          Usuario: <code class="bg-gray-100 px-2 py-1 rounded">admin</code><br>
          Contraseña: <code class="bg-gray-100 px-2 py-1 rounded">admin123</code>
        </p>
      </div>
    </div>
    
    <!-- Footer -->
    <div class="text-center mt-6">
      <a href="/" class="text-sm text-gray-500 hover:text-gray-700">
        ← Volver al catálogo público
      </a>
    </div>
  </div>
</div>