// src/lib/utils/cloudinary.js
// ✅ Upload de imágenes a Cloudinary (unsigned upload desde cliente)

/**
 * Sube una imagen a Cloudinary usando unsigned upload preset
 * @param {File} file - Archivo de imagen
 * @param {string} uploadPreset - Preset de Cloudinary (PUBLIC_CLOUDINARY_UPLOAD_PRESET)
 * @param {string} cloudName - Nombre del cloud de Cloudinary
 * @param {Function} onProgress - Callback opcional para progreso (0-100)
 * @returns {Promise<{url: string, publicId: string}>}
 */
export async function uploadImageToCloudinary(file, uploadPreset, cloudName, onProgress = null) {
  // Validar que sea una imagen
  if (!file.type.startsWith('image/')) {
    throw new Error('El archivo debe ser una imagen');
  }
  
  // Validar tamaño (máximo 10MB)
  const maxSize = 10 * 1024 * 1024; // 10MB
  if (file.size > maxSize) {
    throw new Error('La imagen no puede superar los 10MB');
  }
  
  const formData = new FormData();
  formData.append('file', file);
  formData.append('upload_preset', uploadPreset);
  
  // Opciones adicionales
  formData.append('folder', 'catalogoexpress'); // Organizar en carpeta
  formData.append('resource_type', 'image');
  
  try {
    const response = await fetch(
      `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`,
      {
        method: 'POST',
        body: formData
      }
    );
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error?.message || 'Error al subir la imagen');
    }
    
    const data = await response.json();
    
    return {
      url: data.secure_url,
      publicId: data.public_id,
      width: data.width,
      height: data.height,
      format: data.format,
      bytes: data.bytes
    };
  } catch (error) {
    console.error('Error uploading to Cloudinary:', error);
    throw error;
  }
}

/**
 * Optimiza URL de Cloudinary con transformaciones
 * @param {string} url - URL original de Cloudinary
 * @param {Object} options - Opciones de transformación
 * @returns {string} URL optimizada
 */
export function optimizeCloudinaryUrl(url, options = {}) {
  const {
    width = 800,
    height = 600,
    crop = 'fill',
    quality = 'auto',
    format = 'auto'
  } = options;
  
  // Si no es URL de Cloudinary, retornar original
  if (!url.includes('cloudinary.com')) {
    return url;
  }
  
  // Insertar transformaciones en la URL
  const transformations = `w_${width},h_${height},c_${crop},q_${quality},f_${format}`;
  const urlParts = url.split('/upload/');
  
  if (urlParts.length === 2) {
    return `${urlParts[0]}/upload/${transformations}/${urlParts[1]}`;
  }
  
  return url;
}

/**
 * Genera URL de thumbnail
 * @param {string} url - URL original
 * @returns {string} URL de thumbnail
 */
export function getCloudinaryThumbnail(url) {
  return optimizeCloudinaryUrl(url, {
    width: 200,
    height: 200,
    crop: 'fill',
    quality: 'auto'
  });
}

/**
 * Valida que el archivo sea una imagen válida
 * @param {File} file 
 * @returns {boolean}
 */
export function isValidImageFile(file) {
  const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
  return file && validTypes.includes(file.type);
}

/**
 * Genera preview local de la imagen antes de subir
 * @param {File} file 
 * @returns {Promise<string>} Data URL de la imagen
 */
export function generateImagePreview(file) {
  return new Promise((resolve, reject) => {
    if (!isValidImageFile(file)) {
      reject(new Error('Archivo no válido'));
      return;
    }
    
    const reader = new FileReader();
    reader.onload = (e) => resolve(e.target.result);
    reader.onerror = (e) => reject(new Error('Error al leer el archivo'));
    reader.readAsDataURL(file);
  });
}