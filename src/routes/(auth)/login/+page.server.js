// src/routes/(auth)/login/+page.server.js
import { fail, redirect } from '@sveltejs/kit';

export const actions = {
  default: async ({ request, cookies }) => {
    const data = await request.formData();
    const username = data.get('username');
    const password = data.get('password');

    // Validaciones básicas
    if (!username || !password) {
      return fail(400, { 
        error: 'Usuario y contraseña son requeridos',
        username 
      });
    }

    // Simular delay de red
    await new Promise(resolve => setTimeout(resolve, 500));

    // Validar credenciales (demo)
    if (username === 'admin' && password === 'admin123') {
      const user = {
        id: 1,
        username: 'admin',
        name: 'Administrador',
        email: 'admin@catalogoexpress.com',
        role: 'admin'
      };

      // Crear token único
      const token = 'demo_token_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);

      // Guardar en cookies HTTP-only
      cookies.set('auth_token', token, {
        path: '/',
        httpOnly: true,
        sameSite: 'strict',
        secure: process.env.NODE_ENV === 'production',
        maxAge: 60 * 60 * 24 * 7 // 7 días
      });

      cookies.set('auth_user', JSON.stringify(user), {
        path: '/',
        httpOnly: true,
        sameSite: 'strict',
        secure: process.env.NODE_ENV === 'production',
        maxAge: 60 * 60 * 24 * 7
      });

      // Redirigir al dashboard
      throw redirect(303, '/dashboard');
    } else {
      return fail(401, { 
        error: 'Usuario o contraseña incorrectos',
        username
      });
    }
  }
};