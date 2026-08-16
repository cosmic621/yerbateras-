import { useState, useEffect, useRef } from 'react';
import { X, Trash2, Plus, Minus, ShoppingBag, ArrowRight, Leaf, Gift } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useCart } from '../../context/CartContext';

export default function CartDrawer() {
  const { items, total, notas, sugerencias, abierto, setAbierto, actualizar, eliminar, guardarNotas, agregar } = useCart();
  const envioGratis = total >= 150000;

  const [notaLocal, setNotaLocal] = useState(notas);
  const timeoutRef = useRef(null);

  useEffect(() => { setNotaLocal(notas); }, [notas]);

  const onNotaChange = (valor) => {
    setNotaLocal(valor);
    clearTimeout(timeoutRef.current);
    timeoutRef.current = setTimeout(() => guardarNotas(valor), 600);
  };

  return (
    <>
      {abierto && (
        <div className="fixed inset-0 bg-black/40 z-40 backdrop-blur-sm" onClick={() => setAbierto(false)} />
      )}
      <div className={`fixed top-0 right-0 h-full w-full max-w-md bg-white z-50 shadow-2xl flex flex-col transition-transform duration-300 ${abierto ? 'translate-x-0' : 'translate-x-full'}`}>
        <div className="flex items-center justify-between px-6 py-4 bg-verde-900">
          <div className="flex items-center gap-2">
            <ShoppingBag size={20} className="text-dorado-400" />
            <h2 className="font-display text-lg font-bold text-white tracking-wide">Bolsa de Compras</h2>
          </div>
          <button onClick={() => setAbierto(false)} className="text-verde-300 hover:text-white">
            <X size={22} />
          </button>
        </div>

        <div className="px-6 py-3 bg-verde-50 border-b border-crema-200">
          {envioGratis ? (
            <p className="text-xs font-body text-verde-700 font-semibold">🎉 ¡Tu pedido tiene envío gratis!</p>
          ) : (
            <>
              <p className="text-xs font-body text-verde-700">
                Ya casi... compra <strong>${(150000 - total).toLocaleString('es-CO')}</strong> más para que tu envío sea gratis
              </p>
              <div className="h-1.5 bg-crema-200 rounded-full mt-2 overflow-hidden">
                <div className="h-full bg-dorado-500 rounded-full transition-all" style={{ width: `${Math.min((total / 150000) * 100, 100)}%` }} />
              </div>
            </>
          )}
        </div>

        <div className="flex-1 overflow-y-auto px-6 py-4">
          {items.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center">
              <Leaf size={40} className="text-verde-200 mb-3" />
              <p className="font-display text-gray-500">Tu bolsa está vacía</p>
              <Link to="/tienda" onClick={() => setAbierto(false)} className="btn-outline mt-4 text-sm">Ver tienda</Link>
            </div>
          ) : (
            <div className="space-y-4">
              {items.map(item => (
                <div key={item.id} className="flex gap-3">
                  <div className="w-16 h-16 bg-crema-100 flex items-center justify-center overflow-hidden shrink-0">
                    {item.imagen_principal
                      ? <img src={item.imagen_principal} alt={item.nombre} className="w-full h-full object-cover" />
                      : <Leaf size={20} className="text-verde-200" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-body text-sm text-verde-900 font-semibold line-clamp-1">{item.nombre}</p>
                    <p className="text-xs font-body text-gray-400 mb-1.5">${Number(item.precio_unitario).toLocaleString('es-CO')}</p>
                    <div className="flex items-center gap-2">
                      <button onClick={() => eliminar(item.id)} className="text-red-400 hover:text-red-600"><Trash2 size={13} /></button>
                      <div className="flex items-center border border-crema-300 ml-1">
                        <button onClick={() => actualizar(item.id, Math.max(1, item.cantidad - 1))} className="w-6 h-6 flex items-center justify-center text-verde-700 hover:bg-crema-100"><Minus size={11} /></button>
                        <span className="w-7 text-center text-xs font-body">{item.cantidad}</span>
                        <button onClick={() => actualizar(item.id, item.cantidad + 1)} disabled={item.cantidad >= item.stock} className="w-6 h-6 flex items-center justify-center text-verde-700 hover:bg-crema-100 disabled:opacity-30"><Plus size={11} /></button>
                      </div>
                    </div>
                  </div>
                  <span className="text-sm font-display font-bold text-verde-800 shrink-0">
                    ${(item.cantidad * Number(item.precio_unitario)).toLocaleString('es-CO')}
                  </span>
                </div>
              ))}

              <div className="pt-2">
                <label className="flex items-center gap-1.5 text-xs font-body font-semibold text-verde-800 mb-1.5">
                  <Gift size={13} /> Agregar notas a la orden
                </label>
                <textarea
                  value={notaLocal}
                  onChange={e => onNotaChange(e.target.value.slice(0, 120))}
                  placeholder="¿Esta compra es un regalo? Agrega una nota aquí para enviar con el producto. Máximo 120 caracteres."
                  rows={2}
                  className="w-full border border-crema-300 bg-crema-50 px-3 py-2 text-xs font-body text-verde-900 outline-none focus:border-dorado-500 resize-none"
                />
                <p className="text-[10px] font-body text-gray-400 text-right mt-0.5">{notaLocal.length}/120</p>
              </div>

              {sugerencias.length > 0 && (
                <div className="pt-3 border-t border-crema-200">
                  <p className="text-xs font-body font-bold text-verde-900 uppercase tracking-wide mb-3">También te puede interesar</p>
                  <div className="flex gap-3 overflow-x-auto pb-1">
                    {sugerencias.map(p => (
                      <div key={p.id} className="w-28 shrink-0">
                        <Link to={`/tienda/${p.id}`} onClick={() => setAbierto(false)} className="block w-28 h-24 bg-crema-100 mb-1.5 overflow-hidden">
                          {p.imagen_principal
                            ? <img src={p.imagen_principal} alt={p.nombre} className="w-full h-full object-cover" />
                            : <div className="w-full h-full flex items-center justify-center"><Leaf size={18} className="text-verde-200" /></div>}
                        </Link>
                        <p className="text-[11px] font-body text-verde-900 line-clamp-2 leading-tight mb-1">{p.nombre}</p>
                        <div className="flex items-center justify-between">
                          <span className="text-[11px] font-display font-bold text-dorado-600">
                            ${Number(p.precio_descuento || p.precio).toLocaleString('es-CO')}
                          </span>
                          <button onClick={() => agregar(p.id, 1)} className="w-5 h-5 bg-verde-900 text-white flex items-center justify-center shrink-0">
                            <Plus size={11} />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {items.length > 0 && (
          <div className="border-t border-crema-200 px-6 py-4">
            <div className="flex justify-between text-sm font-body text-gray-600 mb-1">
              <span>Subtotal</span><span>${total.toLocaleString('es-CO')}</span>
            </div>
            <p className="text-[11px] font-body text-gray-400 mb-3">IVA incluido. Envío y descuentos se calculan en el checkout.</p>
            <Link to="/checkout" onClick={() => setAbierto(false)}
              className="btn-primary w-full flex items-center justify-center gap-2">
              Ir a pagar <ArrowRight size={15} />
            </Link>
          </div>
        )}
      </div>
    </>
  );
}
