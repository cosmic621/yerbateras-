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
    // Solo existe sesión de administrador. Si caduca, se limpia y /admin vuelve a pedir el login.
    if (err.response?.status === 401 && !err.config?.url?.includes('/auth/admin-login')) {
      localStorage.removeItem('yb_token');
      delete api.defaults.headers.common['Authorization'];
      if (window.location.pathname.startsWith('/admin')) window.location.reload();
    }
    return Promise.reject(err);
  }
);

export default api;
