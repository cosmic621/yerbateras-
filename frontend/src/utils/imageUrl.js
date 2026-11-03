
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

// Obtenemos la dirección del servidor sin el sufijo /api.
const SERVER_URL = API_URL.replace(/\/api\/?$/, '');

export const imageUrl = (path) => {
  if (!path) return '';

  // Si ya es una URL completa, se conserva.
  if (/^(https?:\/\/|data:|blob:)/i.test(path)) {
    return path;
  }

  // Evita rutas relativas al dominio del frontend.
  const cleanPath = path.startsWith('/') ? path : `/${path}`;

  return `${SERVER_URL}${cleanPath}`;
};
