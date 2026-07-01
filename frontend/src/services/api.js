import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:3000/api',
  timeout: 15000,
});

// Token automático
const token = localStorage.getItem('yb_token');
if (token) api.defaults.headers.common['Authorization'] = `Bearer ${token}`;

// Interceptor de errores
api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401) {
      localStorage.removeItem('yb_token');
      delete api.defaults.headers.common['Authorization'];
      // Redirigir solo si no está en una ruta pública
      if (!['/', '/tienda', '/producto'].some(p => window.location.pathname.startsWith(p))) {
        window.location.href = '/login';
      }
    }
    return Promise.reject(err);
  }
);

export default api;
