import { createContext, useContext, useEffect, useState } from 'react';
import api from '../services/api';

const SiteContext = createContext(null);

// Estado global del sitio: qué secciones están encendidas (admin → "Secciones y temporadas"),
// categorías/líneas para el menú, y la ventana emergente de "Arma tu kit".
export const SiteProvider = ({ children }) => {
  const [secciones, setSecciones]   = useState({});
  const [temporadas, setTemporadas] = useState([]);
  const [categorias, setCategorias] = useState([]);
  const [lineas, setLineas]         = useState([]);
  const [kitAbierto, setKitAbierto] = useState(false);
  const [cargado, setCargado]       = useState(false);

  useEffect(() => {
    Promise.allSettled([
      api.get('/tienda/secciones'),
      api.get('/productos/categorias'),
      api.get('/productos/lineas-cuidado'),
    ]).then(([s, c, l]) => {
      if (s.status === 'fulfilled') { setSecciones(s.value.data.secciones || {}); setTemporadas(s.value.data.temporadas || []); }
      if (c.status === 'fulfilled') setCategorias(c.value.data.categorias || []);
      if (l.status === 'fulfilled') setLineas(l.value.data.lineas || []);
      setCargado(true);
    });
  }, []);

  // Una sección que el admin no ha apagado se considera activa (incluso si el API no responde).
  const activa = (clave) => secciones[clave] !== false;

  return (
    <SiteContext.Provider value={{ secciones, temporadas, categorias, lineas, activa, cargado, kitAbierto, setKitAbierto }}>
      {children}
    </SiteContext.Provider>
  );
};

export const useSite = () => useContext(SiteContext);
