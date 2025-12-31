// src/lib/stores/carritoStore.js
import { writable, derived } from 'svelte/store';
import { browser } from '$app/environment';

// Clave para localStorage
const STORAGE_KEY = 'catalogoexpress_carrito';

// Cargar carrito desde localStorage
function loadFromStorage() {
  if (!browser) return [];
  
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch (error) {
    console.error('Error cargando carrito:', error);
    return [];
  }
}

// Guardar carrito en localStorage
function saveToStorage(items) {
  if (!browser) return;
  
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  } catch (error) {
    console.error('Error guardando carrito:', error);
  }
}

// Store principal del carrito
function createCarritoStore() {
  const { subscribe, set, update } = writable(loadFromStorage());

  // Suscribirse a cambios para guardar automáticamente
  if (browser) {
    subscribe(items => {
      saveToStorage(items);
    });
  }

  return {
    subscribe,
    
    // Agregar producto al carrito
    agregarProducto: (producto, cantidad = 1) => {
      update(items => {
        // Buscar si el producto ya existe (por ID UUID)
        const existingIndex = items.findIndex(item => item.id === producto.id);
        
        if (existingIndex >= 0) {
          // Actualizar cantidad si ya existe
          const updatedItems = [...items];
          const nuevaCantidad = updatedItems[existingIndex].cantidad + cantidad;
          
          // Verificar que no exceda el stock
          const stockDisponible = producto.stock || updatedItems[existingIndex].stock || 999;
          updatedItems[existingIndex].cantidad = Math.min(nuevaCantidad, stockDisponible);
          
          return updatedItems;
        } else {
          // Agregar nuevo item con estructura completa
          const nuevoItem = {
            id: producto.id, // UUID de Supabase
            nombre: producto.nombre,
            precio: producto.precio_oferta || producto.precio,
            precio_unitario: producto.precio_oferta || producto.precio,
            precio_original: producto.precio,
            cantidad: Math.min(cantidad, producto.stock || 999),
            stock: producto.stock || 999,
            imagen_url: producto.imagen_url || null,
            marca: producto.marca_nombre || producto.marca || null,
            categoria: producto.categoria_nombre || producto.categoria || null,
            sku: producto.sku || null,
            descripcion_larga: producto.descripcion_larga || null
          };
          
          return [...items, nuevoItem];
        }
      });
    },
    
    // Eliminar producto del carrito
    eliminarProducto: (productoId) => {
      update(items => items.filter(item => item.id !== productoId));
    },
    
    // Actualizar cantidad de un producto
    actualizarCantidad: (productoId, cantidad) => {
      update(items => {
        if (cantidad <= 0) {
          return items.filter(item => item.id !== productoId);
        }
        
        return items.map(item => {
          if (item.id === productoId) {
            // No permitir más del stock disponible
            const nuevaCantidad = Math.min(cantidad, item.stock || 999);
            return { ...item, cantidad: nuevaCantidad };
          }
          return item;
        });
      });
    },
    
    // Limpiar todo el carrito
    limpiarCarrito: () => {
      set([]);
    },
    
    // Obtener un producto específico
    obtenerProducto: (productoId) => {
      let producto = null;
      update(items => {
        producto = items.find(item => item.id === productoId);
        return items;
      });
      return producto;
    },
    
    // Verificar stock disponible para todos los productos
    verificarStock: async () => {
      // Esta función se puede usar antes de crear el pedido
      // Para validar que el stock sigue disponible
      return true; // Por implementar en el futuro
    }
  };
}

export const carrito = createCarritoStore();

// Store derivado: cantidad total de items
export const cantidadItems = derived(
  carrito,
  $carrito => $carrito.reduce((total, item) => total + item.cantidad, 0)
);

// Store derivado: subtotal (sin impuestos)
export const subtotal = derived(
  carrito,
  $carrito => $carrito.reduce((total, item) => 
    total + (item.precio_unitario * item.cantidad), 0
  )
);

// Store derivado: impuesto (se calculará con el porcentaje de configuración)
export const impuesto = derived(
  [subtotal],
  ([$subtotal]) => {
    // Por defecto 18%, pero se actualizará con la configuración real
    const porcentajeImpuesto = 0.18;
    return $subtotal * porcentajeImpuesto;
  }
);

// Store derivado: total con impuestos
export const totalConImpuestos = derived(
  [subtotal, impuesto],
  ([$subtotal, $impuesto]) => $subtotal + $impuesto
);

// Store derivado: verificar si el carrito está vacío
export const carritoVacio = derived(
  carrito,
  $carrito => $carrito.length === 0
);

// Store derivado: obtener resumen del carrito
export const resumenCarrito = derived(
  [carrito, subtotal, impuesto, totalConImpuestos, cantidadItems],
  ([$carrito, $subtotal, $impuesto, $total, $cantidad]) => ({
    items: $carrito,
    subtotal: $subtotal,
    impuesto: $impuesto,
    total: $total,
    cantidadItems: $cantidad,
    cantidadProductos: $carrito.length
  })
);