import { createContext, useContext, useState, useEffect } from 'react';
import api from '../services/api';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [usuario, setUsuario]     = useState(null);
  const [cargando, setCargando]   = useState(true);
  const [token, setToken]         = useState(() => localStorage.getItem('yb_token'));

  useEffect(() => {
    if (token) {
      api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      api.get('/auth/me')
        .then(r => setUsuario(r.data.usuario))
        .catch(() => { localStorage.removeItem('yb_token'); setToken(null); })
        .finally(() => setCargando(false));
    } else {
      setCargando(false);
    }
  }, [token]);

  const login = (tok, user) => {
    localStorage.setItem('yb_token', tok);
    api.defaults.headers.common['Authorization'] = `Bearer ${tok}`;
    setToken(tok);
    setUsuario(user);
  };

  const logout = () => {
    localStorage.removeItem('yb_token');
    delete api.defaults.headers.common['Authorization'];
    setToken(null);
    setUsuario(null);
  };

  return (
    <AuthContext.Provider value={{ usuario, cargando, login, logout, esAdmin: usuario?.rol === 'admin' }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
