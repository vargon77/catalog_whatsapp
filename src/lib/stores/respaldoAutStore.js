import { writable } from 'svelte/store';
import { browser } from '$app/environment';

// Estado inicial
const initialState = {
  isAuthenticated: false,
  user: null,
  loading: false,
  error: null
};

function createAuthStore() {
  const { subscribe, set, update } = writable(initialState);

  // Verificar autenticación al iniciar
  const init = () => {
    if (!browser) return false;
    
    try {
      const userStr = localStorage.getItem('auth_user');
      const token = localStorage.getItem('auth_token');
      
      if (userStr && token) {
        const user = JSON.parse(userStr);
        set({
          isAuthenticated: true,
          user,
          loading: false,
          error: null
        });
        return true;
      }
    } catch (error) {
      console.error('Error inicializando auth:', error);
    }
    
    return false;
  };

  return {
    subscribe,
    
    // Login simple y directo
    login: async (username, password) => {
      update(state => ({ ...state, loading: true, error: null }));
      
      // Simular delay de red
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // Credenciales fijas para demo
      if (username === 'admin' && password === 'admin123') {
        const user = {
          id: 1,
          username: 'admin',
          name: 'Administrador',
          email: 'admin@catalogoexpress.com',
          role: 'admin'
        };
        
        // Guardar en localStorage
        localStorage.setItem('auth_user', JSON.stringify(user));
        localStorage.setItem('auth_token', 'demo_token_' + Date.now());
        
        set({
          isAuthenticated: true,
          user,
          loading: false,
          error: null
        });
        
        return { success: true, user };
      } else {
        const errorMsg = 'Usuario o contraseña incorrectos';
        set({
          isAuthenticated: false,
          user: null,
          loading: false,
          error: errorMsg
        });
        return { success: false, error: errorMsg };
      }
    },
    
    // Logout
    logout: () => {
      if (browser) {
        localStorage.removeItem('auth_user');
        localStorage.removeItem('auth_token');
      }
      set(initialState);
    },
    
    // Inicializar
    init
  };
}

export const auth = createAuthStore();

// Inicializar al cargar
if (browser) {
  auth.init();
}