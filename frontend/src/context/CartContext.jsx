import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import api from '../services/api';

const CartContext = createContext(null);
const KEY = 'yb_carrito_v2';

const leer = () => {
  try { const d = JSON.parse(localStorage.getItem(KEY) || '{}'); return { items: d.items || [], notas: d.notas || '' }; }
  catch { return { items: [], notas: '' }; }
};

// El carrito vive en el navegador (no hay cuentas). El servidor solo valida precios y stock.
export const CartProvider = ({ children }) => {
  const inicial = leer();
  const [items, setItems]   = useState(inicial.items);   // [{producto_id, cantidad, nombre, imagen, precio, stock}]
  const [notas, setNotas]   = useState(inicial.notas);
  const [abierto, setAbierto] = useState(false);

  useEffect(() => {
    try { localStorage.setItem(KEY, JSON.stringify({ items, notas })); } catch {}
  }, [items, notas]);

  // Trae precios/stock actuales y descarta lo que ya no se vende
  const refrescar = useCallback(async () => {
    if (!items.length) return;
    try {
      const { data } = await api.post('/carrito/validar', { items: items.map(i => ({ producto_id: i.producto_id, cantidad: i.cantidad })) });
      setItems(prev => data.lineas
        .filter(l => l.nombre !== undefined && l.stock > 0)
        .map(l => ({
          producto_id: l.producto_id, nombre: l.nombre, imagen: l.imagen, precio: l.precio, stock: l.stock,
          cantidad: Math.min(prev.find(p => p.producto_id === l.producto_id)?.cantidad || 1, l.stock),
        })));
    } catch {}
  }, [items]);

  useEffect(() => { if (items.length) refrescar(); /* al cargar el sitio */ // eslint-disable-next-line
  }, []);

  // Acepta el producto completo (lo normal) o solo su id
  const agregar = async (productoOId, cantidad = 1) => {
    let p = productoOId;
    if (typeof p !== 'object') {
      const { data } = await api.get(`/productos/${p}`);
      p = data.producto;
    }
    const precio = Number(p.precio_descuento || p.precio);
    const stock = Number(p.stock);
    if (!(stock > 0)) throw { response: { data: { mensaje: 'Este producto está agotado' } } };
    setItems(prev => {
      const ya = prev.find(i => i.producto_id === p.id);
      if (ya) return prev.map(i => i.producto_id === p.id ? { ...i, cantidad: Math.min(i.cantidad + cantidad, stock), precio, stock } : i);
      return [...prev, { producto_id: p.id, cantidad: Math.min(cantidad, stock), nombre: p.nombre, imagen: p.imagen_principal, precio, stock }];
    });
    setAbierto(true);
  };

  const actualizar = (producto_id, cantidad) =>
    setItems(prev => prev.map(i => i.producto_id === producto_id ? { ...i, cantidad: Math.max(1, Math.min(cantidad, i.stock)) } : i));

  const eliminar = (producto_id) => setItems(prev => prev.filter(i => i.producto_id !== producto_id));
  const limpiar = () => { setItems([]); setNotas(''); };

  const total = items.reduce((s, i) => s + i.precio * i.cantidad, 0);
  const cantidadTotal = items.reduce((s, i) => s + i.cantidad, 0);

  return (
    <CartContext.Provider value={{ items, total, notas, setNotas, abierto, setAbierto, cantidadTotal, agregar, actualizar, eliminar, limpiar, refrescar }}>
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => useContext(CartContext);
