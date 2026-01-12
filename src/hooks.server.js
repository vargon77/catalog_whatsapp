// src/hooks.server.js
import { redirect } from '@sveltejs/kit';

export async function handle({ event, resolve }) {
  const token = event.cookies.get('auth_token');
  const path = event.url.pathname;

  // Rutas protegidas (sin los grupos (admin) en el path)
  const PROTECTED_ROUTES = [
    '/dashboard',
    '/productos',
    '/pedidos', 
    '/mensajes',
    '/configuracion',
    '/categorias',
    '/reportes' 
  ];

  // Si es ruta de login
  if (path === '/login') {
    // Si ya tiene token válido, redirigir al dashboard
    if (token) {
      throw redirect(302, '/(admin)/dashboard');
    }
    return await resolve(event);
  }

  // Verificar si es ruta protegida
  const isProtectedRoute = PROTECTED_ROUTES.some(route => 
    path === route || path.startsWith(route + '/')
  );

  // Si es ruta protegida y no hay token, redirigir a login
  if (isProtectedRoute && !token) {
    throw redirect(302, '/login');
  }

  // Si hay token, parsearlo y pasarlo a locals
  if (token) {
    try {
      const userCookie = event.cookies.get('auth_user');
      if (userCookie) {
        event.locals.user = JSON.parse(userCookie);
      }
    } catch (error) {
      console.error('Error parseando usuario:', error);
      // Si hay error, limpiar cookies y redirigir
      event.cookies.delete('auth_token', { path: '/' });
      event.cookies.delete('auth_user', { path: '/' });
      
      if (isProtectedRoute) {
        throw redirect(302, '/login');
      }
    }
  }

  return await resolve(event);
}