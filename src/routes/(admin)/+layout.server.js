// src/routes/(admin)/+layout.server.js
import { redirect } from '@sveltejs/kit';

export async function load({ locals, cookies }) {
  // Verificar si hay usuario en locals (viene de hooks.server.js)
  if (!locals.user) {
    // Doble verificación con cookies
    const token = cookies.get('auth_token');
    const userCookie = cookies.get('auth_user');
    
    if (!token || !userCookie) {
      throw redirect(303, '/login');
    }
    
    try {
      locals.user = JSON.parse(userCookie);
    } catch (error) {
      console.error('Error parseando usuario en layout:', error);
      throw redirect(303, '/login');
    }
  }

  // Pasar datos del usuario a todos los componentes dentro de (admin)
  return {
    user: locals.user
  };
}