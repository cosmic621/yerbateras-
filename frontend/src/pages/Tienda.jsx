import { useState, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { Search, Filter, Leaf, Star, Shield, ShoppingCart, SlidersHorizontal } from 'lucide-react';
import api from '../services/api';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import Swal from 'sweetalert2';

const ProductCard = ({ producto }) => {
  const { agregar } = useCart();
  const { usuario } = useAuth();

  const handleAgregar = async (e) => {
    e.preventDefault();
    if (!usuario) {
      Swal.fire({ icon: 'info', title: 'Inicia sesión', text: 'Debes iniciar sesión para agregar productos al carrito.', confirmButtonColor: '#1a4a2e' });
      return;
    }
    try {
      await agregar(producto.id, 1);
      Swal.fire({ icon: 'success', title: '¡Agregado!', text: `${producto.nombre} fue añadido al carrito.`, timer: 1500, showConfirmButton: false, position: 'top-end', toast: true });
    } catch (err) {
      Swal.fire({ icon: 'error', title: 'Error', text: err.response?.data?.mensaje || 'No se pudo agregar al carrito', confirmButtonColor: '#1a4a2e' });
    }
  };

  const agotado = producto.stock === 0;

  return (
    <Link to={`/tienda/${producto.id}`} className="card group overflow-hidden flex flex-col">
      <div className="relative h-52 bg-verde-50 overflow-hidden">
        {producto.imagen_principal
          ? <img src={producto.imagen_principal} alt={producto.nombre} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-400" />
          : <div className="w-full h-full flex items-center justify-center"><Leaf size={48} className="text-verde-200" /></div>}
        {producto.precio_descuento && (
          <span className="absolute top-3 left-3 bg-red-500 text-white text-xs font-bold px-2 py-1 rounded-full">
            -{Math.round((1 - producto.precio_descuento / producto.precio) * 100)}%
          </span>
        )}
        {agotado && (
          <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
            <span className="bg-white text-gray-700 font-body font-bold px-4 py-2 rounded-full text-sm">Agotado</span>
          </div>
        )}
      </div>
      <div className="p-4 flex flex-col flex-1">
        {producto.certificacion_invima && (
          <span className="badge-invima mb-2 self-start">
            <Shield size={10} /> INVIMA
          </span>
        )}
        <p className="text-xs font-body text-dorado-600 font-semibold mb-1">{producto.categoria}</p>
        <h3 className="font-display text-base font-bold text-verde-800 mb-1 line-clamp-2 leading-snug">{producto.nombre}</h3>
        <p className="text-gray-500 font-body text-xs leading-relaxed line-clamp-2 flex-1">{producto.descripcion_corta}</p>
        <div className="flex items-end justify-between mt-3">
          <div>
            {producto.precio_descuento ? (
              <>
                <span className="text-gray-400 line-through text-xs font-body">${Number(producto.precio).toLocaleString('es-CO')}</span>
                <div className="font-display text-lg font-bold text-verde-700">${Number(producto.precio_descuento).toLocaleString('es-CO')}</div>
              </>
            ) : (
              <div className="font-display text-lg font-bold text-verde-700">${Number(producto.precio).toLocaleString('es-CO')}</div>
            )}
            {producto.calificacion_promedio > 0 && (
              <div className="flex items-center gap-1 mt-0.5">
                <Star size={11} className="text-dorado-500 fill-dorado-500" />
                <span className="text-xs text-gray-500 font-body">{Number(producto.calificacion_promedio).toFixed(1)} ({producto.total_resenas})</span>
              </div>
            )}
          </div>
          <button
            onClick={handleAgregar}
            disabled={agotado}
            className="w-9 h-9 bg-verde-600 hover:bg-verde-500 disabled:bg-gray-200 rounded-lg flex items-center justify-center transition-colors shrink-0"
          >
            <ShoppingCart size={16} className="text-white" />
          </button>
        </div>
      </div>
    </Link>
  );
};

export default function Tienda() {
  const [productos, setProductos] = useState([]);
  const [categorias, setCategorias] = useState([]);
  const [total, setTotal] = useState(0);
  const [pagina, setPagina] = useState(1);
  const [totalPaginas, setTotalPaginas] = useState(1);
  const [cargando, setCargando] = useState(true);
  const [filtrosAbiertos, setFiltrosAbiertos] = useState(false);
  const [searchParams, setSearchParams] = useSearchParams();

  const [filtros, setFiltros] = useState({
    buscar: searchParams.get('buscar') || '',
    categoria: searchParams.get('categoria') || '',
    destacados: searchParams.get('destacados') || '',
  });

  useEffect(() => {
    api.get('/productos/categorias').then(r => setCategorias(r.data.categorias || []));
  }, []);

  useEffect(() => {
    setCargando(true);
    const params = { ...filtros, page: pagina, limit: 12 };
    Object.keys(params).forEach(k => !params[k] && delete params[k]);
    api.get('/productos', { params })
      .then(r => {
        setProductos(r.data.productos || []);
        setTotal(r.data.total || 0);
        setTotalPaginas(r.data.totalPaginas || 1);
      })
      .finally(() => setCargando(false));
  }, [filtros, pagina]);

  const aplicarFiltro = (key, val) => {
    setFiltros(f => ({ ...f, [key]: val }));
    setPagina(1);
  };

  return (
    <div className="pt-16 min-h-screen bg-gray-50">
      {/* Hero tienda */}
      <div className="bg-verde-800 text-white py-12 px-6">
        <div className="max-w-7xl mx-auto">
          <h1 className="font-display text-4xl font-bold mb-2">Nuestra Tienda</h1>
          <p className="text-verde-200 font-body">Productos naturales certificados · {total} productos disponibles</p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Barra de búsqueda y filtros */}
        <div className="flex gap-3 mb-6">
          <div className="flex-1 relative">
            <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Buscar productos naturales..."
              value={filtros.buscar}
              onChange={e => aplicarFiltro('buscar', e.target.value)}
              className="input-field pl-10"
            />
          </div>
          <button onClick={() => setFiltrosAbiertos(!filtrosAbiertos)}
            className="flex items-center gap-2 px-4 py-3 border border-gray-300 rounded-lg hover:border-verde-400 transition-colors font-body text-sm text-gray-600 bg-white">
            <SlidersHorizontal size={16} /> Filtros
          </button>
        </div>

        {/* Filtros expandidos */}
        {filtrosAbiertos && (
          <div className="bg-white rounded-xl border border-gray-100 p-5 mb-6 shadow-sm">
            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-body font-semibold text-gray-600 mb-2">Categoría</label>
                <select value={filtros.categoria} onChange={e => aplicarFiltro('categoria', e.target.value)}
                  className="input-field">
                  <option value="">Todas las categorías</option>
                  {categorias.map(c => (
                    <option key={c.id} value={c.slug}>{c.nombre} ({c.total_productos})</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-body font-semibold text-gray-600 mb-2">Mostrar</label>
                <select value={filtros.destacados} onChange={e => aplicarFiltro('destacados', e.target.value)}
                  className="input-field">
                  <option value="">Todos los productos</option>
                  <option value="true">Solo destacados</option>
                </select>
              </div>
            </div>
            {(filtros.categoria || filtros.destacados || filtros.buscar) && (
              <button onClick={() => { setFiltros({ buscar: '', categoria: '', destacados: '' }); setPagina(1); }}
                className="mt-3 text-sm text-red-500 hover:text-red-700 font-body underline">
                Limpiar filtros
              </button>
            )}
          </div>
        )}

        {/* Tags de categorías rápidas */}
        <div className="flex gap-2 flex-wrap mb-6 overflow-x-auto pb-1">
          <button onClick={() => aplicarFiltro('categoria', '')}
            className={`px-4 py-2 rounded-full text-sm font-body font-semibold whitespace-nowrap transition-colors ${!filtros.categoria ? 'bg-verde-600 text-white' : 'bg-white text-gray-600 border border-gray-200 hover:border-verde-400'}`}>
            Todos
          </button>
          {categorias.map(c => (
            <button key={c.id} onClick={() => aplicarFiltro('categoria', c.slug)}
              className={`px-4 py-2 rounded-full text-sm font-body font-semibold whitespace-nowrap transition-colors ${filtros.categoria === c.slug ? 'bg-verde-600 text-white' : 'bg-white text-gray-600 border border-gray-200 hover:border-verde-400'}`}>
              {c.nombre}
            </button>
          ))}
        </div>

        {/* Grid de productos */}
        {cargando ? (
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {[...Array(8)].map((_, i) => (
              <div key={i} className="bg-white rounded-xl h-80 animate-pulse">
                <div className="h-52 bg-gray-200 rounded-t-xl" />
                <div className="p-4 space-y-2">
                  <div className="h-3 bg-gray-200 rounded w-2/3" />
                  <div className="h-4 bg-gray-200 rounded w-full" />
                  <div className="h-3 bg-gray-200 rounded w-1/2" />
                </div>
              </div>
            ))}
          </div>
        ) : productos.length === 0 ? (
          <div className="text-center py-20">
            <Leaf size={48} className="text-verde-200 mx-auto mb-4" />
            <h3 className="font-display text-xl text-gray-500 mb-2">No encontramos productos</h3>
            <p className="text-gray-400 font-body">Prueba con otros filtros o términos de búsqueda</p>
          </div>
        ) : (
          <>
            <p className="text-sm font-body text-gray-500 mb-4">{total} productos encontrados</p>
            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {productos.map(p => <ProductCard key={p.id} producto={p} />)}
            </div>
            {/* Paginación */}
            {totalPaginas > 1 && (
              <div className="flex justify-center gap-2 mt-10">
                {[...Array(totalPaginas)].map((_, i) => (
                  <button key={i} onClick={() => setPagina(i + 1)}
                    className={`w-10 h-10 rounded-lg font-body text-sm font-semibold transition-colors ${pagina === i + 1 ? 'bg-verde-600 text-white' : 'bg-white text-gray-600 border border-gray-200 hover:border-verde-400'}`}>
                    {i + 1}
                  </button>
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
