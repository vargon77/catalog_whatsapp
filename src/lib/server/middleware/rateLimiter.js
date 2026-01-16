// src/lib/server/middleware/rateLimiter.js
import { json } from '@sveltejs/kit';

const requestCounts = new Map();
const blockList = new Set();

const LIMITS = {
  GET: {
    window: 60000,
    max: 100
  },
  POST: {
    window: 60000,
    max: 20
  },
  PUT: {
    window: 60000,
    max: 30
  },
  DELETE: {
    window: 60000,
    max: 10
  }
};

const CRITICAL_ENDPOINTS = {
  '/api/pedidos': { max: 30, window: 60000 },
  '/api/upload': { max: 10, window: 60000 },
  '/api/pedidos/[id]/validar-pago': { max: 10, window: 60000 }
};

function getClientIdentifier(request) {
  const forwarded = request.headers.get('x-forwarded-for');
  const ip = forwarded ? forwarded.split(',')[0] : 
             request.headers.get('x-real-ip') || 
             'unknown';
  
  const userAgent = request.headers.get('user-agent') || 'unknown';
  return `${ip}-${userAgent.substring(0, 50)}`;
}

function cleanupOldEntries() {
  const now = Date.now();
  for (const [key, data] of requestCounts.entries()) {
    if (now - data.resetTime > data.window) {
      requestCounts.delete(key);
    }
  }
}

export function rateLimit(request, endpoint) {
  if (process.env.NODE_ENV === 'development') {
    return { allowed: true };
  }
  
  const clientId = getClientIdentifier(request);
  
  if (blockList.has(clientId)) {
    return {
      allowed: false,
      error: 'Cliente bloqueado por abuso',
      code: 'BLOCKED'
    };
  }
  
  cleanupOldEntries();
  
  const method = request.method;
  const config = CRITICAL_ENDPOINTS[endpoint] || LIMITS[method] || LIMITS.GET;
  
  const key = `${clientId}-${method}-${endpoint}`;
  const now = Date.now();
  
  let data = requestCounts.get(key);
  
  if (!data) {
    data = {
      count: 0,
      resetTime: now,
      window: config.window
    };
    requestCounts.set(key, data);
  }
  
  if (now - data.resetTime > data.window) {
    data.count = 0;
    data.resetTime = now;
  }
  
  data.count++;
  
  if (data.count > config.max) {
    if (data.count > config.max * 2) {
      blockList.add(clientId);
      setTimeout(() => blockList.delete(clientId), 3600000);
    }
    
    return {
      allowed: false,
      error: 'Demasiadas peticiones. Intenta de nuevo más tarde.',
      code: 'RATE_LIMIT_EXCEEDED',
      retryAfter: Math.ceil((data.resetTime + data.window - now) / 1000)
    };
  }
  
  return {
    allowed: true,
    remaining: config.max - data.count,
    resetTime: data.resetTime + data.window
  };
}

export function rateLimitMiddleware(handler, endpoint) {
  return async (event) => {
    const check = rateLimit(event.request, endpoint);
    
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
    
    const response = await handler(event);
    
    if (response instanceof Response) {
      response.headers.set('X-RateLimit-Remaining', String(check.remaining));
      response.headers.set('X-RateLimit-Reset', String(check.resetTime));
    }
    
    return response;
  };
}