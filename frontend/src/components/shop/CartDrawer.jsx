import { X, Trash2, Plus, Minus, ShoppingBag, ArrowRight, Leaf } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useCart } from '../../context/CartContext';

export default function CartDrawer() {
  const { items, total, abierto, setAbierto, actualizar, eliminar } = useCart();
  const envioGratis = total >= 150000;
  const costoEnvio = envioGratis ? 0 : 10000;

  return (
    <>
      {abierto && (
        <div className="fixed inset-0 bg-black/40 z-40 backdrop-blur-sm" onClick={() => setAbierto(false)} />
      )}
      <div className={`fixed top-0 right-0 h-full w-full max-w-md bg-white z-50 shadow-2xl flex flex-col transition-transform duration-300 ${abierto ? 'translate-x-0' : 'translate-x-full'}`}>
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 bg-verde-800">
          <div className="flex items-center gap-2">
            <ShoppingBag size={20} className="text-dorado-400" />
            <h2 className="font-display text-lg font-bold text-white">Mi Carrito</h2>
            {items.length > 0 && (
              <span className="bg-dorado-500 text-verde-900 text-xs font-bold px-2 py-0.5 rounded-full">
                {items.reduce((s, i) => s + i.cantidad, 0)}
              </span>
            )}
          </div>
          <button onClick={() => setAbierto(false)} className="p-1.5 text-verde-200 hover:text-white transition-colors">
            <X size={20} />
          </button>
        </div>

        {/* Banner envío */}
        <div className={`px-6 py-2 text-xs font-body text-center ${envioGratis ? 'bg-verde-100 text-verde-700' : 'bg-dorado-50 text-dorado-700'}`}>
          {envioGratis ? '🎉 ¡Tienes envío gratis!' : `Agrega $${(150000 - total).toLocaleString('es-CO')} más para envío gratis`}
        </div>

        {/* Items */}
        <div className="flex-1 overflow-y-auto px-6 py-4">
          {items.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center">
              <div className="w-20 h-20 bg-verde-50 rounded-full flex items-center justify-center mb-4">
                <Leaf size={36} className="text-verde-300" />
              </div>
              <p className="font-display text-lg text-gray-500 mb-2">Tu carrito está vacío</p>
              <p className="text-gray-400 font-body text-sm mb-6">Explora nuestros productos naturales</p>
              <Link to="/tienda" onClick={() => setAbierto(false)} className="btn-primary text-sm">
                Ver productos
              </Link>
            </div>
          ) : (
            <div className="space-y-4">
              {items.map(item => (
                <div key={item.id} className="flex gap-3 p-3 rounded-xl border border-gray-100 hover:border-verde-100 transition-colors">
                  <div className="w-16 h-16 rounded-lg bg-verde-50 flex items-center justify-center overflow-hidden shrink-0">
                    {item.imagen_principal
                      ? <img src={item.imagen_principal} alt={item.nombre} className="w-full h-full object-cover" />
                      : <Leaf size={24} className="text-verde-300" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-body text-sm font-semibold text-gray-800 line-clamp-2 leading-tight">{item.nombre}</p>
                    <p className="text-verde-600 font-body text-sm font-bold mt-1">
                      ${Number(item.precio_unitario).toLocaleString('es-CO')}
                    </p>
                    <div className="flex items-center justify-between mt-2">
                      <div className="flex items-center gap-1 border border-gray-200 rounded-lg overflow-hidden">
                        <button onClick={() => item.cantidad > 1 ? actualizar(item.id, item.cantidad - 1) : eliminar(item.id)}
                          className="w-7 h-7 flex items-center justify-center hover:bg-gray-100 transition-colors">
                          <Minus size={12} />
                        </button>
                        <span className="w-8 text-center font-body text-sm font-semibold">{item.cantidad}</span>
                        <button onClick={() => actualizar(item.id, item.cantidad + 1)}
                          disabled={item.cantidad >= item.stock}
                          className="w-7 h-7 flex items-center justify-center hover:bg-gray-100 transition-colors disabled:opacity-40">
                          <Plus size={12} />
                        </button>
                      </div>
                      <button onClick={() => eliminar(item.id)} className="p-1.5 text-red-400 hover:text-red-600 transition-colors">
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        {items.length > 0 && (
          <div className="border-t border-gray-100 px-6 py-5 bg-gray-50">
            <div className="space-y-2 mb-4">
              <div className="flex justify-between text-sm font-body text-gray-600">
                <span>Subtotal</span><span>${total.toLocaleString('es-CO')}</span>
              </div>
              <div className="flex justify-between text-sm font-body text-gray-600">
                <span>Envío</span>
                <span className={envioGratis ? 'text-verde-600 font-semibold' : ''}>
                  {envioGratis ? 'Gratis' : `$${costoEnvio.toLocaleString('es-CO')}`}
                </span>
              </div>
              <div className="flex justify-between font-display text-base font-bold text-verde-800 pt-2 border-t border-gray-200">
                <span>Total</span>
                <span>${(total + costoEnvio).toLocaleString('es-CO')} COP</span>
              </div>
            </div>
            <Link to="/checkout" onClick={() => setAbierto(false)}
              className="btn-primary w-full flex items-center justify-center gap-2 text-base">
              Pagar ahora <ArrowRight size={18} />
            </Link>
          </div>
        )}
      </div>
    </>
  );
}
