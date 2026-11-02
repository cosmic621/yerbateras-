import { Link } from 'react-router-dom';
import { Leaf, ShoppingCart, Star } from 'lucide-react';
import { useCart } from '../../context/CartContext';
import Swal from 'sweetalert2';

// Tarjeta de producto simple (inicio, temporadas). La de la tienda tiene más detalle.
export default function ProductCard({ producto }) {
  const { agregar } = useCart();
  const agotado = producto.stock === 0;

  const handleAgregar = async (e) => {
    e.preventDefault();
    try {
      await agregar(producto, 1);
    } catch (err) {
      Swal.fire({ icon: 'error', title: 'Error', text: err.response?.data?.mensaje || 'No se pudo agregar', confirmButtonColor: '#0f3c27' });
    }
  };

  return (
    <Link to={`/tienda/${producto.id}`} className="card group overflow-hidden flex flex-col">
      <div className="relative aspect-square bg-crema-100 overflow-hidden">
        {producto.imagen_principal
          ? <img src={producto.imagen_principal} alt={producto.nombre} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
          : <div className="w-full h-full flex items-center justify-center"><Leaf size={44} className="text-verde-200" /></div>}
        {producto.es_kit && <span className="badge-new absolute top-3 left-3">Kit</span>}
        {agotado && <div className="absolute inset-0 bg-verde-900/60 flex items-center justify-center"><span className="bg-white text-verde-900 font-bold px-4 py-1 text-sm">Agotado</span></div>}
      </div>
      <div className="p-4 flex flex-col flex-1 text-center">
        <h3 className="font-display text-[0.95rem] font-bold text-verde-900 line-clamp-2 leading-snug flex-1">{producto.nombre}</h3>
        <div className="mt-2">
          {producto.precio_descuento ? (
            <><span className="text-gray-400 line-through text-xs mr-2">${Number(producto.precio).toLocaleString('es-CO')}</span>
              <span className="font-display font-bold text-verde-800">${Number(producto.precio_descuento).toLocaleString('es-CO')}</span></>
          ) : <span className="font-display font-bold text-verde-800">${Number(producto.precio).toLocaleString('es-CO')}</span>}
        </div>
        {Number(producto.total_resenas) > 0 && (
          <div className="flex items-center justify-center gap-0.5 mt-1.5 text-dorado-500" aria-label={`Calificación ${Number(producto.calificacion_promedio).toFixed(1)} de 5`}>
            {[...Array(5)].map((_, i) => <Star key={i} size={12} className={i < Math.round(producto.calificacion_promedio) ? 'fill-dorado-500' : 'text-crema-300'} />)}
            <span className="text-sm text-verde-500 ml-1">({producto.total_resenas})</span>
          </div>
        )}
        <button onClick={handleAgregar} disabled={agotado} className="btn-primary mt-3 !py-2 w-full disabled:opacity-40">
          <ShoppingCart size={14} /> Agregar
        </button>
      </div>
    </Link>
  );
}
