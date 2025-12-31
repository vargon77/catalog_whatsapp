// src/lib/cloudinary.js
import { CLOUDINARY_CLOUD_NAME, CLOUDINARY_UPLOAD_PRESET } from '$env/static/private';

export const cloudinaryConfig = {
  cloudName: CLOUDINARY_CLOUD_NAME,
  uploadPreset: CLOUDINARY_UPLOAD_PRESET
};

export async function uploadToCloudinary(file) {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('upload_preset', cloudinaryConfig.uploadPreset);
  
  const response = await fetch(
    `https://api.cloudinary.com/v1_1/${cloudinaryConfig.cloudName}/image/upload`,
    { method: 'POST', body: formData }
  );
  
  if (!response.ok) throw new Error('Error al subir imagen');
  
  const data = await response.json();
  return data.secure_url;
}