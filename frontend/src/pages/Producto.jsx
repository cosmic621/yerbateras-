import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Shield, ShoppingCart, ArrowLeft, Leaf, Star, Package, AlertCircle } from 'lucide-react';
import api from '../services/api';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import Swal from 'sweetalert2';

export default function Producto() {
  const { id } = useParams();
  const { agregar } = useCart();
  const { usuario } = useAuth();
  const [producto, setProducto] = useState(null);
  const [cargando, setCargando] = useState(true);
  const [cantidad, setCantidad] = useState(1);
  const [agregando, setAgregando] = useState(false);

  useEffect(() => {
    api.get(`/productos/${id}`).then(r => setProducto(r.data.producto)).finally(() => setCargando(false));
  }, [id]);

  const handleAgregar = async () => {
    if (!usuario) {
      Swal.fire({ icon: 'info', title: 'Inicia sesión', text: 'Debes iniciar sesión para comprar.', confirmButtonColor: '#1a4a2e' });
      return;
    }
    setAgregando(true);
    try {
      await agregar(producto.id, cantidad);
      Swal.fire({ icon: 'success', title: '¡Agregado al carrito!', timer: 1500, showConfirmButton: false, toast: true, position: 'top-end' });
    } catch (err) {
      Swal.fire({ icon: 'error', title: 'Error', text: err.response?.data?.mensaje || 'No se pudo agregar', confirmButtonColor: '#1a4a2e' });
    } finally { setAgregando(false); }
  };

  if (cargando) return (
    <div className="min-h-screen flex items-center justify-center pt-16">
      <div className="w-8 h-8 border-4 border-verde-200 border-t-verde-600 rounded-full animate-spin" />
    </div>
  );

  if (!producto) return (
    <div className="min-h-screen flex items-center justify-center pt-16 text-center">
      <div><p className="font-display text-xl text-gray-500 mb-4">Producto no encontrado</p>
        <Link to="/tienda" className="btn-primary">Ver tienda</Link></div>
    </div>
  );

  const agotado = producto.stock === 0;
  const precioFinal = producto.precio_descuento || producto.precio;

  return (
    <div className="pt-16 min-h-screen bg-gray-50">
      <div className="max-w-6xl mx-auto px-6 py-10">
        <Link to="/tienda" className="flex items-center gap-2 text-verde-600 hover:text-verde-700 font-body text-sm mb-6">
          <ArrowLeft size={16} /> Volver a la tienda
        </Link>

        <div className="grid lg:grid-cols-2 gap-12">
          {/* Imagen */}
          <div className="bg-white rounded-2xl overflow-hidden shadow-sm border border-gray-100 h-96 flex items-center justify-center">
            {producto.imagen_principal
              ? <img src={producto.imagen_principal} alt={producto.nombre} className="w-full h-full object-cover" />
              : <Leaf size={64} className="text-verde-200" />}
          </div>

          {/* Info */}
          <div>
            <div className="flex flex-wrap gap-2 mb-3">
              {producto.categoria && <span className="text-xs font-body text-dorado-600 font-semibold uppercase tracking-wide">{producto.categoria}</span>}
              {producto.certificacion_invima && <span className="badge-invima"><Shield size={10} /> INVIMA</span>}
            </div>
            <h1 className="font-display text-3xl font-bold text-verde-800 mb-2 leading-tight">{producto.nombre}</h1>
            {producto.presentacion && <p className="text-gray-400 font-body text-sm mb-4">{producto.presentacion}</p>}

            {producto.calificacion_promedio > 0 && (
              <div className="flex items-center gap-2 mb-4">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} size={16} className={i < Math.round(producto.calificacion_promedio) ? 'text-dorado-500 fill-dorado-500' : 'text-gray-200 fill-gray-200'} />
                ))}
                <span className="text-sm text-gray-500 font-body">{Number(producto.calificacion_promedio).toFixed(1)} ({producto.total_resenas} reseñas)</span>
              </div>
            )}

            {/* Precio */}
            <div className="flex items-end gap-3 mb-6">
              <span className="font-display text-4xl font-bold text-verde-700">${Number(precioFinal).toLocaleString('es-CO')}</span>
              {producto.precio_descuento && (
                <span className="text-gray-400 line-through font-body text-xl">${Number(producto.precio).toLocaleString('es-CO')}</span>
              )}
              <span className="text-gray-400 font-body text-sm">COP</span>
            </div>

            {/* Stock */}
            <div className={`flex items-center gap-2 mb-6 text-sm font-body ${agotado ? 'text-red-500' : 'text-verde-600'}`}>
              {agotado ? <AlertCircle size={15} /> : <Package size={15} />}
              {agotado ? 'Producto agotado' : `${producto.stock} unidades disponibles`}
            </div>

            {/* Cantidad y botón */}
            {!agotado && (
              <div className="flex items-center gap-4 mb-6">
                <div className="flex items-center border border-gray-200 rounded-lg overflow-hidden">
                  <button onClick={() => setCantidad(q => Math.max(1, q - 1))} className="w-10 h-10 hover:bg-gray-100 transition-colors flex items-center justify-center font-bold text-lg">−</button>
                  <span className="w-12 text-center font-body font-semibold">{cantidad}</span>
                  <button onClick={() => setCantidad(q => Math.min(producto.stock, q + 1))} className="w-10 h-10 hover:bg-gray-100 transition-colors flex items-center justify-center font-bold text-lg">+</button>
                </div>
                <button onClick={handleAgregar} disabled={agregando}
                  className="btn-primary flex-1 flex items-center justify-center gap-2 py-3 disabled:opacity-60">
                  <ShoppingCart size={18} />
                  {agregando ? 'Agregando...' : 'Agregar al carrito'}
                </button>
              </div>
            )}

            {/* Descripción */}
            {producto.descripcion && (
              <div className="border-t border-gray-100 pt-6">
                <h3 className="font-display text-lg font-bold text-verde-800 mb-3">Descripción</h3>
                <p className="text-gray-600 font-body leading-relaxed">{producto.descripcion}</p>
              </div>
            )}

            {/* Info adicional */}
            <div className="grid sm:grid-cols-2 gap-4 mt-6">
              {producto.principio_activo && (
                <div className="bg-verde-50 rounded-lg p-4">
                  <p className="text-xs font-body font-semibold text-verde-700 uppercase tracking-wide mb-1">Principio activo</p>
                  <p className="text-verde-800 font-body text-sm">{producto.principio_activo}</p>
                </div>
              )}
              {producto.indicaciones && (
                <div className="bg-dorado-50 rounded-lg p-4">
                  <p className="text-xs font-body font-semibold text-dorado-700 uppercase tracking-wide mb-1">Indicaciones</p>
                  <p className="text-gray-700 font-body text-sm">{producto.indicaciones}</p>
                </div>
              )}
            </div>

            {producto.contraindicaciones && (
              <div className="bg-red-50 border border-red-100 rounded-lg p-4 mt-4">
                <p className="text-xs font-body font-semibold text-red-600 uppercase tracking-wide mb-1">Contraindicaciones</p>
                <p className="text-red-700 font-body text-sm">{producto.contraindicaciones}</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
