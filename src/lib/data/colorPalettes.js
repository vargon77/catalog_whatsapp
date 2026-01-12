// src/lib/data/colorPalettes.js
// 10 Paletas de colores predefinidas para personalización

export const colorPalettes = [
  {
    id: 'blue-default',
    name: 'Azul Profesional',
    description: 'Paleta por defecto - Confianza y profesionalismo',
    primary: {
      50: '#eff6ff',
      100: '#dbeafe',
      200: '#bfdbfe',
      300: '#93c5fd',
      400: '#60a5fa',
      500: '#3b82f6',
      600: '#2563eb',
      700: '#1d4ed8',
      800: '#1e40af',
      900: '#1e3a8a'
    },
    preview: ['#3b82f6', '#2563eb', '#1d4ed8']
  },
  {
    id: 'green-nature',
    name: 'Verde Natura',
    description: 'Frescura y sostenibilidad',
    primary: {
      50: '#f0fdf4',
      100: '#dcfce7',
      200: '#bbf7d0',
      300: '#86efac',
      400: '#4ade80',
      500: '#22c55e',
      600: '#16a34a',
      700: '#15803d',
      800: '#166534',
      900: '#14532d'
    },
    preview: ['#22c55e', '#16a34a', '#15803d']
  },
  {
    id: 'purple-elegant',
    name: 'Púrpura Elegante',
    description: 'Creatividad y lujo',
    primary: {
      50: '#faf5ff',
      100: '#f3e8ff',
      200: '#e9d5ff',
      300: '#d8b4fe',
      400: '#c084fc',
      500: '#a855f7',
      600: '#9333ea',
      700: '#7e22ce',
      800: '#6b21a8',
      900: '#581c87'
    },
    preview: ['#a855f7', '#9333ea', '#7e22ce']
  },
  {
    id: 'orange-energy',
    name: 'Naranja Energético',
    description: 'Vitalidad y entusiasmo',
    primary: {
      50: '#fff7ed',
      100: '#ffedd5',
      200: '#fed7aa',
      300: '#fdba74',
      400: '#fb923c',
      500: '#f97316',
      600: '#ea580c',
      700: '#c2410c',
      800: '#9a3412',
      900: '#7c2d12'
    },
    preview: ['#f97316', '#ea580c', '#c2410c']
  },
  {
    id: 'pink-modern',
    name: 'Rosa Moderno',
    description: 'Juventud y dinamismo',
    primary: {
      50: '#fdf2f8',
      100: '#fce7f3',
      200: '#fbcfe8',
      300: '#f9a8d4',
      400: '#f472b6',
      500: '#ec4899',
      600: '#db2777',
      700: '#be185d',
      800: '#9d174d',
      900: '#831843'
    },
    preview: ['#ec4899', '#db2777', '#be185d']
  },
  {
    id: 'teal-fresh',
    name: 'Turquesa Fresco',
    description: 'Claridad y modernidad',
    primary: {
      50: '#f0fdfa',
      100: '#ccfbf1',
      200: '#99f6e4',
      300: '#5eead4',
      400: '#2dd4bf',
      500: '#14b8a6',
      600: '#0d9488',
      700: '#0f766e',
      800: '#115e59',
      900: '#134e4a'
    },
    preview: ['#14b8a6', '#0d9488', '#0f766e']
  },
  {
    id: 'red-intense',
    name: 'Rojo Intenso',
    description: 'Pasión y urgencia',
    primary: {
      50: '#fef2f2',
      100: '#fee2e2',
      200: '#fecaca',
      300: '#fca5a5',
      400: '#f87171',
      500: '#ef4444',
      600: '#dc2626',
      700: '#b91c1c',
      800: '#991b1b',
      900: '#7f1d1d'
    },
    preview: ['#ef4444', '#dc2626', '#b91c1c']
  },
  {
    id: 'indigo-corporate',
    name: 'Índigo Corporate',
    description: 'Confianza y estabilidad',
    primary: {
      50: '#eef2ff',
      100: '#e0e7ff',
      200: '#c7d2fe',
      300: '#a5b4fc',
      400: '#818cf8',
      500: '#6366f1',
      600: '#4f46e5',
      700: '#4338ca',
      800: '#3730a3',
      900: '#312e81'
    },
    preview: ['#6366f1', '#4f46e5', '#4338ca']
  },
  {
    id: 'black-yellow-contrast',
    name: 'Negro y Amarillo',
    description: 'Alto contraste - Máxima visibilidad',
    primary: {
      50: '#fefce8',
      100: '#fef9c3',
      200: '#fef08a',
      300: '#fde047',
      400: '#facc15',
      500: '#eab308',
      600: '#ca8a04',
      700: '#a16207',
      800: '#854d0e',
      900: '#713f12'
    },
    secondary: {
      50: '#fafafa',
      100: '#f5f5f5',
      200: '#e5e5e5',
      300: '#d4d4d4',
      400: '#a3a3a3',
      500: '#737373',
      600: '#525252',
      700: '#404040',
      800: '#262626',
      900: '#171717'
    },
    preview: ['#eab308', '#171717', '#facc15'],
    highContrast: true
  },
  {
    id: 'black-white-contrast',
    name: 'Negro y Blanco',
    description: 'Alto contraste - Elegancia minimalista',
    primary: {
      50: '#fafafa',
      100: '#f5f5f5',
      200: '#e5e5e5',
      300: '#d4d4d4',
      400: '#a3a3a3',
      500: '#737373',
      600: '#525252',
      700: '#404040',
      800: '#262626',
      900: '#171717'
    },
    secondary: {
      50: '#ffffff',
      100: '#fefefe',
      200: '#fafafa',
      300: '#f5f5f5',
      400: '#e5e5e5',
      500: '#d4d4d4',
      600: '#a3a3a3',
      700: '#737373',
      800: '#525252',
      900: '#404040'
    },
    preview: ['#171717', '#404040', '#737373'],
    highContrast: true
  }
];

// Función helper para obtener paleta por ID
export function getPaletteById(id) {
  return colorPalettes.find(palette => palette.id === id) || colorPalettes[0];
}

// Función para generar CSS variables desde una paleta
export function generateCSSVariables(palette) {
  if (!palette) return '';
  
  let cssVars = '';
  
  // Primary colors
  if (palette.primary) {
    Object.entries(palette.primary).forEach(([shade, color]) => {
      const rgb = hexToRgb(color);
      cssVars += `--color-primary-${shade}: ${rgb};\n`;
    });
  }
  
  // Secondary colors (si existen)
  if (palette.secondary) {
    Object.entries(palette.secondary).forEach(([shade, color]) => {
      const rgb = hexToRgb(color);
      cssVars += `--color-secondary-${shade}: ${rgb};\n`;
    });
  }
  
  return cssVars;
}

// Convertir HEX a RGB
function hexToRgb(hex) {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result 
    ? `${parseInt(result[1], 16)} ${parseInt(result[2], 16)} ${parseInt(result[3], 16)}`
    : '0 0 0';
}