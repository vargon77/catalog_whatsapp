//src/lib/stores/authStore.js
import { writable, derived } from 'svelte/store';
import { browser } from '$app/environment';

// Estado inicial
const initialState = {
  isAuthenticated: false,
  user: null,
  loading: false,
  error: null,
  initialized: false // Nuevo: para saber si ya se inicializó
};

function createAuthStore() {
  const { subscribe, set, update } = writable(initialState);

  // Verificar autenticación al iniciar - UNA SOLA VEZ
  const init = () => {
    if (!browser) return false;
    
    update(state => {
      if (state.initialized) return state; // Ya se inicializó
      
      try {
        const userStr = localStorage.getItem('auth_user');
        const token = localStorage.getItem('auth_token');
        
        if (userStr && token) {
          const user = JSON.parse(userStr);
          return {
            isAuthenticated: true,
            user,
            loading: false,
            error: null,
            initialized: true
          };
        }
      } catch (error) {
        console.error('Error inicializando auth:', error);
      }
      
      return {
        ...initialState,
        initialized: true
      };
    });
    
    return true;
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
          error: null,
          initialized: true
        });
        
        return { success: true, user };
      } else {
        const errorMsg = 'Usuario o contraseña incorrectos';
        set({
          isAuthenticated: false,
          user: null,
          loading: false,
          error: errorMsg,
          initialized: true
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
      set({
        ...initialState,
        initialized: true
      });
    },
    
    // Inicializar
    init
  };
}

export const auth = createAuthStore();

// NO inicializar automáticamente aquí
// La inicialización se hará desde el layout