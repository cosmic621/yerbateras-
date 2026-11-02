import { useEffect } from 'react';
import { X, Trash2, Plus, Minus, Leaf } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useCart } from '../../context/CartContext';
import { cop } from '../../utils/wompi';

const ENVIO_GRATIS = 150000;

export default function CartDrawer() {
  const { items, total, abierto, setAbierto, actualizar, eliminar, refrescar } = useCart();

  useEffect(() => { if (abierto) refrescar(); /* precios y stock al día */ // eslint-disable-next-line
  }, [abierto]);

  return (
    <>
      {abierto && <div className="fixed inset-0 bg-verde-900/30 z-[60]" onClick={() => setAbierto(false)} />}
      <aside aria-label="Carrito" className={`fixed top-0 right-0 h-full w-full max-w-sm bg-white z-[70] shadow-2xl flex flex-col transition-transform duration-300 ${abierto ? 'translate-x-0' : 'translate-x-full'}`}>
        <div className="flex items-center justify-between px-6 py-5 border-b border-crema-200">
          <h2 className="text-2xl text-verde-900">Tu bolsa</h2>
          <button onClick={() => setAbierto(false)} aria-label="Cerrar" className="text-verde-600 hover:text-verde-900"><X size={22} /></button>
        </div>

        <div className="flex-1 overflow-y-auto px-6 py-5">
          {items.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center">
              <Leaf size={36} className="text-verde-200 mb-3" />
              <p className="text-xl text-verde-700">Tu bolsa está vacía</p>
              <Link to="/tienda" onClick={() => setAbierto(false)} className="btn-outline mt-5">Ver la tienda</Link>
            </div>
          ) : (
            <ul className="space-y-5">
              {items.map(item => (
                <li key={item.producto_id} className="flex gap-4">
                  <div className="w-16 h-16 bg-crema-100 flex items-center justify-center overflow-hidden shrink-0">
                    {item.imagen ? <img src={item.imagen} alt={item.nombre} className="w-full h-full object-cover" /> : <Leaf size={20} className="text-verde-200" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-lg text-verde-900 leading-tight line-clamp-2">{item.nombre}</p>
                    <p className="text-verde-600">{cop(item.precio)}</p>
                    <div className="flex items-center gap-3 mt-1">
                      <div className="flex items-center border border-crema-300">
                        <button onClick={() => actualizar(item.producto_id, item.cantidad - 1)} aria-label="Menos" className="w-7 h-7 flex items-center justify-center text-verde-700"><Minus size={12} /></button>
                        <span className="w-7 text-center">{item.cantidad}</span>
                        <button onClick={() => actualizar(item.producto_id, item.cantidad + 1)} disabled={item.cantidad >= item.stock} aria-label="Más" className="w-7 h-7 flex items-center justify-center text-verde-700 disabled:opacity-30"><Plus size={12} /></button>
                      </div>
                      <button onClick={() => eliminar(item.producto_id)} aria-label="Quitar" className="text-verde-400 hover:text-red-600"><Trash2 size={15} /></button>
                    </div>
                  </div>
                  <span className="text-lg text-verde-800 shrink-0">{cop(item.precio * item.cantidad)}</span>
                </li>
              ))}
            </ul>
          )}
        </div>

        {items.length > 0 && (
          <div className="border-t border-crema-200 px-6 py-5">
            <div className="flex justify-between text-xl text-verde-900"><span>Subtotal</span><span>{cop(total)}</span></div>
            <p className="text-sm text-verde-600 mt-1 mb-4">
              {total >= ENVIO_GRATIS ? 'Tu envío es gratis.' : `Te faltan ${cop(ENVIO_GRATIS - total)} para el envío gratis.`}
            </p>
            <Link to="/checkout" onClick={() => setAbierto(false)} className="btn-primary w-full">Ir a pagar</Link>
          </div>
        )}
      </aside>
    </>
  );
}
