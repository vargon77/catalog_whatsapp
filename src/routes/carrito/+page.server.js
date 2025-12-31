// src/routes/carrito/+page.server.js
import { supabase } from '$lib/supabaseClient';

export async function load() {
  try {
    // Cargar configuración para cálculos de impuestos
    const { data: configuracion, error } = await supabase
      .from('configuracion')
      .select('*')
      .single();

    if (error) {
      console.error('Error cargando configuración:', error);
    }

    return {
      configuracion: configuracion || {
        nombre_empresa: 'CatálogoExpress',
        whatsapp_numero: '7121920418',
        moneda_simbolo: '$',
        impuesto_porcentaje: 16
      }
    };
  } catch (error) {
    console.error('Error en carrito load:', error);
    return {
      configuracion: {
        nombre_empresa: 'CatálogoExpress',
        whatsapp_numero: '7121920418',
        moneda_simbolo: '$',
        impuesto_porcentaje: 16
      }
    };
  }
}