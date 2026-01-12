// src/routes/empresa/+page.server.js
import { supabase } from '$lib/supabaseClient';

export async function load() {
  try {
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
        descripcion_empresa: 'Tienda en línea con pedidos por WhatsApp'
      }
    };
  } catch (error) {
    console.error('Error en empresa load:', error);
    return {
      configuracion: {
        nombre_empresa: 'CatálogoExpress',
        whatsapp_numero: '7121920418',
        moneda_simbolo: '$',
        descripcion_empresa: 'Tienda en línea con pedidos por WhatsApp'
      }
    };
  }
}