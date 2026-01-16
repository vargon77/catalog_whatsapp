// src/hooks.server.js
import { redirect, json } from '@sveltejs/kit';
import { rateLimit } from '$lib/server/middleware/rateLimiter';

// Rutas protegidas (sin los grupos (admin) en el path)
const PROTECTED_ROUTES = [
  '/dashboard',
  '/productos',
  '/pedidos', 
  '/mensajes',
  '/configuracion',
  '/categorias',
  '/reportes',
  '/api/pedidos',
  '/api/upload'
];

export async function handle({ event, resolve }) {
  const token = event.cookies.get('auth_token');
  const path = event.url.pathname;

  // ========================================
  // 1. AUTENTICACIÓN - Manejo de Login
  // ========================================
  if (path === '/login') {
    // Si ya tiene token válido, redirigir al dashboard
    if (token) {
      throw redirect(302, '/(admin)/dashboard');
    }
    return await resolve(event);
  }

  // ========================================
  // 2. VERIFICACIÓN DE RUTAS PROTEGIDAS
  // ========================================
  const isProtectedRoute = PROTECTED_ROUTES.some(route => 
    path === route || path.startsWith(route + '/')
  );

  // Si es ruta protegida y no hay token, redirigir a login
  if (isProtectedRoute && !token) {
    throw redirect(302, '/login');
  }

  // ========================================
  // 3. PARSEAR USUARIO DESDE COOKIE
  // ========================================
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

  // ========================================
  // 4. RATE LIMITING PARA APIs
  // ========================================
  if (path.startsWith('/api/')) {
    const isProtected = PROTECTED_ROUTES.some(route => path.startsWith(route));
    
    if (isProtected) {
      const check = rateLimit(event.request, path);
      
      if (!check.allowed) {
        return json(
          {
            success: false,
            error: check.error,
            code: check.code,
            retryAfter: check.retryAfter
          },
          { 
            status: check.code === 'BLOCKED' ? 403 : 429,
            headers: check.retryAfter 
              ? { 'Retry-After': String(check.retryAfter) }
              : {}
          }
        );
      }
      
      // Resolver request y agregar headers de rate limit
      const response = await resolve(event);
      
      if (check.remaining !== undefined) {
        response.headers.set('X-RateLimit-Remaining', String(check.remaining));
      }
      if (check.resetTime !== undefined) {
        response.headers.set('X-RateLimit-Reset', String(check.resetTime));
      }
      
      return response;
    }
  }

  // ========================================
  // 5. RESOLVER REQUEST NORMAL
  // ========================================
  return await resolve(event);
}

// ========================================
// MANEJO GLOBAL DE ERRORES
// ========================================
export async function handleError({ error, event }) {
  console.error('Error en aplicación:', {
    message: error.message,
    stack: error.stack,
    path: event.url.pathname,
    method: event.request.method
  });
  
  return {
    message: process.env.NODE_ENV === 'production' 
      ? 'Ha ocurrido un error. Intenta de nuevo.' 
      : error.message
  };
}