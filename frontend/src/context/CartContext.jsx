import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import api from '../services/api';
import { useAuth } from './AuthContext';

const CartContext = createContext(null);

export const CartProvider = ({ children }) => {
  const { usuario } = useAuth();
  const [items, setItems]     = useState([]);
  const [total, setTotal]     = useState(0);
  const [cargando, setCargando] = useState(false);
  const [abierto, setAbierto] = useState(false);

  const cargarCarrito = useCallback(async () => {
    if (!usuario) { setItems([]); setTotal(0); return; }
    try {
      const { data } = await api.get('/carrito');
      setItems(data.items || []);
      setTotal(data.total || 0);
    } catch {}
  }, [usuario]);

  useEffect(() => { cargarCarrito(); }, [cargarCarrito]);

  const agregar = async (producto_id, cantidad = 1) => {
    setCargando(true);
    try {
      await api.post('/carrito/items', { producto_id, cantidad });
      await cargarCarrito();
      setAbierto(true);
    } finally { setCargando(false); }
  };

  const actualizar = async (item_id, cantidad) => {
    await api.put(`/carrito/items/${item_id}`, { cantidad });
    await cargarCarrito();
  };

  const eliminar = async (item_id) => {
    await api.delete(`/carrito/items/${item_id}`);
    await cargarCarrito();
  };

  const limpiar = async () => {
    await api.delete('/carrito');
    setItems([]); setTotal(0);
  };

  const cantidadTotal = items.reduce((s, i) => s + i.cantidad, 0);

  return (
    <CartContext.Provider value={{
      items, total, cargando, abierto, setAbierto,
      cantidadTotal, agregar, actualizar, eliminar, limpiar, cargarCarrito
    }}>
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => useContext(CartContext);
