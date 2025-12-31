// src/routes/logout/+server.js
// ✅ ENDPOINT POST para cerrar sesión
import { json } from '@sveltejs/kit';

export async function POST({ cookies }) {
  try {
    // Eliminar cookies HTTP-only del servidor
    cookies.delete('auth_token', { path: '/' });
    cookies.delete('auth_user', { path: '/' });
    
    return json({ success: true, message: 'Sesión cerrada correctamente' });
  } catch (error) {
    console.error('Error en logout:', error);
    return json(
      { success: false, error: 'Error al cerrar sesión' },
      { status: 500 }
    );
  }
}