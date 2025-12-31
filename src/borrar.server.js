import { redirect } from '@sveltejs/kit';

export async function handle({ event, resolve }) {
  const token = event.cookies.get('auth_token');
  const user = event.cookies.get('auth_user');
  const path = event.url.pathname;

  // Rutas protegidas del dashboard
  const PROTECTED_ROUTES = [
    '/(admin)/dashboard',
    '/(admin)/dashboard/productos',
    '/(admin)/dashboard/pedidos',
    '/(admin)/dashboard/mensajes',
    '/(admin)/dashboard/configuracion'
  ];

  // Si es ruta de login del dashboard, permitir siempre
  if (path === '/(auth)/login') {
    return await resolve(event);
  }

  // Verificar si es ruta protegida
  const isProtectedRoute = PROTECTED_ROUTES.some(route => 
    path === route || path.startsWith(route + '/')
  );

  // Si es ruta protegida y no hay token, redirigir a login
  if (isProtectedRoute && !token) {
    throw redirect(302, '/(auth)/login');
  }

  // Si ya tiene token y va al login, redirigir al dashboard
  if (path === '/(auth)/login' && token) {
    throw redirect(302, '/(admin)/dashboard');
  }

  return await resolve(event);
}