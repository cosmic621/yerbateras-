import axios from 'axios';
import { origenApi, completarUploads } from '../utils/urls';

const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';
const ORIGEN = origenApi(BASE_URL);

const api = axios.create({
  baseURL: BASE_URL,
  timeout: 60000, // subir imágenes pesadas con conexión lenta puede tardar
});

// Token automático
const token = localStorage.getItem('yb_token');
if (token) api.defaults.headers.common['Authorization'] = `Bearer ${token}`;

// Interceptor de errores
api.interceptors.response.use(
  (res) => { res.data = completarUploads(res.data, ORIGEN); return res; },
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
