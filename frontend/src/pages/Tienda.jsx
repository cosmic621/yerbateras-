import { useState, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { Search, Leaf, Star, Shield, ShoppingCart, SlidersHorizontal, ChevronRight, X, Award } from 'lucide-react';
import api from '../services/api';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import Swal from 'sweetalert2';

const ORDENES = [
  { value: 'relevancia',   label: 'Más relevantes' },
  { value: 'recientes',    label: 'Más recientes' },
  { value: 'precio_asc',   label: 'Precio: menor a mayor' },
  { value: 'precio_desc',  label: 'Precio: mayor a menor' },
  { value: 'calificacion', label: 'Mejor calificados' },
];

const ProductCard = ({ producto }) => {
  const { agregar } = useCart();
  const { usuario } = useAuth();

  const handleAgregar = async (e) => {
    e.preventDefault();
    if (!usuario) {
      Swal.fire({ icon: 'info', title: 'Inicia sesión', text: 'Debes iniciar sesión para agregar productos al carrito.', confirmButtonColor: '#052a1c' });
      return;
    }
    try {
      await agregar(producto.id, 1);
      Swal.fire({ icon: 'success', title: '¡Agregado!', text: `${producto.nombre} fue añadido al carrito.`, timer: 1500, showConfirmButton: false, position: 'top-end', toast: true });
    } catch (err) {
      Swal.fire({ icon: 'error', title: 'Error', text: err.response?.data?.mensaje || 'No se pudo agregar al carrito', confirmButtonColor: '#052a1c' });
    }
  };

  const agotado = producto.stock === 0;
  const pocasUnidades = !agotado && producto.stock <= 5;
  const descuentoPct = producto.precio_descuento ? Math.round((1 - producto.precio_descuento / producto.precio) * 100) : 0;

  return (
    <Link to={`/tienda/${producto.id}`} className="card group overflow-hidden flex flex-col relative">
      <div className="relative h-52 bg-crema-100 overflow-hidden hover-gota">
        {producto.imagen_principal
          ? <img src={producto.imagen_principal} alt={producto.nombre} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
          : <div className="w-full h-full flex items-center justify-center"><Leaf size={48} className="text-verde-200" /></div>}

        <div className="absolute top-3 left-3 flex flex-col gap-1.5 items-start">
          {descuentoPct > 0 && <span className="badge-sale">-{descuentoPct}%</span>}
          {producto.destacado && !descuentoPct && <span className="badge-bestseller"><Award size={10} /> Más vendido</span>}
        </div>

        {agotado && (
          <div className="absolute inset-0 bg-verde-900/60 flex items-center justify-center">
            <span className="bg-white text-verde-900 font-body font-bold px-4 py-1.5 text-sm">Agotado</span>
          </div>
        )}
      </div>
      <div className="p-4 flex flex-col flex-1">
        {producto.certificacion_invima && (
          <span className="badge-invima mb-2 self-start">
            <Shield size={10} /> INVIMA
          </span>
        )}
        <p className="text-xs font-body text-dorado-600 font-semibold mb-1 uppercase tracking-wide">{producto.categoria}</p>
        <h3 className="font-display text-base font-bold text-verde-900 mb-1 line-clamp-2 leading-snug">{producto.nombre}</h3>
        <p className="text-gray-500 font-body text-xs leading-relaxed line-clamp-2 flex-1">{producto.descripcion_corta}</p>

        {producto.calificacion_promedio > 0 && (
          <div className="flex items-center gap-1 mt-2">
            {[...Array(5)].map((_, i) => (
              <Star key={i} size={11} className={i < Math.round(producto.calificacion_promedio) ? 'text-dorado-500 fill-dorado-500' : 'text-gray-200 fill-gray-200'} />
            ))}
            <span className="text-xs text-gray-500 font-body ml-0.5">({producto.total_resenas})</span>
          </div>
        )}

        <div className="flex items-end justify-between mt-3 pt-3 border-t border-crema-200">
          <div>
            {producto.precio_descuento ? (
              <>
                <span className="text-gray-400 line-through text-xs font-body block">${Number(producto.precio).toLocaleString('es-CO')}</span>
                <div className="font-display text-lg font-bold text-verde-800">${Number(producto.precio_descuento).toLocaleString('es-CO')}</div>
              </>
            ) : (
              <div className="font-display text-lg font-bold text-verde-800">${Number(producto.precio).toLocaleString('es-CO')}</div>
            )}
            {pocasUnidades && (
              <p className="text-[11px] font-body font-semibold text-red-500 mt-0.5">¡Últimas {producto.stock} unidades!</p>
            )}
          </div>
          <button
            onClick={handleAgregar}
            disabled={agotado}
            aria-label="Agregar al carrito"
            className="w-10 h-10 bg-verde-900 hover:bg-verde-800 disabled:bg-gray-200 flex items-center justify-center transition-colors shrink-0"
          >
            <ShoppingCart size={16} className="text-crema-100" />
          </button>
        </div>
      </div>
    </Link>
  );
};

const ProductCardSkeleton = () => (
  <div className="card h-[22rem] animate-pulse overflow-hidden">
    <div className="h-52 bg-crema-200" />
    <div className="p-4 space-y-2">
      <div className="h-3 bg-crema-200 w-2/3" />
      <div className="h-4 bg-crema-200 w-full" />
      <div className="h-3 bg-crema-200 w-1/2" />
    </div>
  </div>
);

export default function Tienda() {
  const [productos, setProductos] = useState([]);
  const [categorias, setCategorias] = useState([]);
  const [lineas, setLineas] = useState([]);
  const [total, setTotal] = useState(0);
  const [pagina, setPagina] = useState(1);
  const [totalPaginas, setTotalPaginas] = useState(1);
  const [cargando, setCargando] = useState(true);
  const [filtrosMovilAbiertos, setFiltrosMovilAbiertos] = useState(false);
  const [searchParams, setSearchParams] = useSearchParams();

  const [filtros, setFiltros] = useState({
    buscar: searchParams.get('buscar') || '',
    categoria: searchParams.get('categoria') || '',
    linea_cuidado: searchParams.get('linea_cuidado') || '',
    destacados: searchParams.get('destacados') || '',
  });
  const [orden, setOrden] = useState('relevancia');

  useEffect(() => {
    api.get('/productos/categorias').then(r => setCategorias(r.data.categorias || []));
    api.get('/productos/lineas-cuidado').then(r => setLineas(r.data.lineas || []));
  }, []);

  useEffect(() => {
    setCargando(true);
    const params = { ...filtros, orden, page: pagina, limit: 12 };
    Object.keys(params).forEach(k => !params[k] && delete params[k]);
    api.get('/productos', { params })
      .then(r => {
        setProductos(r.data.productos || []);
        setTotal(r.data.total || 0);
        setTotalPaginas(r.data.totalPaginas || 1);
      })
      .finally(() => setCargando(false));
  }, [filtros, orden, pagina]);

  const aplicarFiltro = (key, val) => {
    setFiltros(f => ({ ...f, [key]: val }));
    setPagina(1);
  };

  const limpiarFiltros = () => { setFiltros({ buscar: '', categoria: '', linea_cuidado: '', destacados: '' }); setPagina(1); };
  const categoriaActiva = categorias.find(c => c.slug === filtros.categoria);
  const lineaActiva = lineas.find(l => l.slug === filtros.linea_cuidado);
  const hayFiltrosActivos = filtros.categoria || filtros.linea_cuidado || filtros.destacados || filtros.buscar;

  const PanelFiltros = () => (
    <div className="space-y-6">
      <Link to="/botiquin" className="block bg-verde-900 hover:bg-verde-800 transition-colors p-4 text-center">
        <p className="font-display font-bold text-crema-100 text-sm">🧭 Prepara tu Botiquín Yerbatero</p>
        <p className="font-body text-verde-300 text-xs mt-1">Responde unas preguntas y te recomendamos qué llevar</p>
      </Link>

      <div>
        <h3 className="font-display font-bold text-sm text-verde-900 uppercase tracking-wide mb-3">¿Qué necesitas cuidar?</h3>
        <div className="space-y-1">
          <button onClick={() => aplicarFiltro('linea_cuidado', '')}
            className={`w-full text-left px-3 py-2 text-sm font-body transition-colors ${!filtros.linea_cuidado ? 'bg-verde-900 text-crema-100' : 'text-verde-800 hover:bg-crema-100'}`}>
            Todas las necesidades
          </button>
          {lineas.map(l => (
            <button key={l.id} onClick={() => aplicarFiltro('linea_cuidado', l.slug)}
              className={`w-full text-left px-3 py-2 text-sm font-body flex items-center justify-between transition-colors ${filtros.linea_cuidado === l.slug ? 'bg-verde-900 text-crema-100' : 'text-verde-800 hover:bg-crema-100'}`}>
              <span>{l.nombre}</span>
              <span className={filtros.linea_cuidado === l.slug ? 'text-dorado-300' : 'text-gray-400'}>{l.total_productos}</span>
            </button>
          ))}
        </div>
      </div>

      <div>
        <h3 className="font-display font-bold text-sm text-verde-900 uppercase tracking-wide mb-3">Tipo de preparación</h3>
        <div className="space-y-1">
          <button onClick={() => aplicarFiltro('categoria', '')}
            className={`w-full text-left px-3 py-2 text-sm font-body transition-colors ${!filtros.categoria ? 'bg-verde-900 text-crema-100' : 'text-verde-800 hover:bg-crema-100'}`}>
            Todos los tipos
          </button>
          {categorias.map(c => (
            <button key={c.id} onClick={() => aplicarFiltro('categoria', c.slug)}
              className={`w-full text-left px-3 py-2 text-sm font-body flex items-center justify-between transition-colors ${filtros.categoria === c.slug ? 'bg-verde-900 text-crema-100' : 'text-verde-800 hover:bg-crema-100'}`}>
              <span>{c.nombre}</span>
              <span className={filtros.categoria === c.slug ? 'text-dorado-300' : 'text-gray-400'}>{c.total_productos}</span>
            </button>
          ))}
        </div>
      </div>

      <div>
        <h3 className="font-display font-bold text-sm text-verde-900 uppercase tracking-wide mb-3">Mostrar</h3>
        <label className="flex items-center gap-2.5 px-3 py-2 cursor-pointer">
          <input type="checkbox" checked={filtros.destacados === 'true'}
            onChange={e => aplicarFiltro('destacados', e.target.checked ? 'true' : '')}
            className="w-4 h-4 accent-verde-900" />
          <span className="text-sm font-body text-verde-800">Solo destacados</span>
        </label>
      </div>

      {hayFiltrosActivos && (
        <button onClick={limpiarFiltros} className="flex items-center gap-1.5 text-sm font-body text-red-500 hover:text-red-700">
          <X size={14} /> Limpiar filtros
        </button>
      )}

      <div className="border border-crema-300 bg-crema-50 p-4">
        <div className="flex items-center gap-2 mb-2">
          <Shield size={15} className="text-verde-700" />
          <span className="font-display font-bold text-sm text-verde-900">Garantía INVIMA</span>
        </div>
        <p className="text-xs font-body text-gray-500 leading-relaxed">Todos nuestros productos cuentan con registro sanitario y elaboración artesanal certificada.</p>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-crema-50">
      <div className="bg-verde-900 text-white py-10 px-6">
        <div className="max-w-7xl mx-auto">
          <nav className="flex items-center gap-1.5 text-xs font-body text-verde-300 mb-3">
            <Link to="/" className="hover:text-dorado-400">Inicio</Link>
            <ChevronRight size={12} />
            <span className="text-crema-100">Tienda</span>
            {lineaActiva && <><ChevronRight size={12} /><span className="text-dorado-400">{lineaActiva.nombre}</span></>}
            {categoriaActiva && <><ChevronRight size={12} /><span className="text-dorado-400">{categoriaActiva.nombre}</span></>}
          </nav>
          <h1 className="font-display text-3xl md:text-4xl font-bold mb-2">
            {lineaActiva?.nombre || categoriaActiva?.nombre || 'Nuestra Tienda'}
          </h1>
          <p className="text-verde-300 font-body text-sm">Productos naturales certificados · {total} producto{total !== 1 ? 's' : ''} disponible{total !== 1 ? 's' : ''}</p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-8">
        <div className="relative mb-6">
          <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Buscar productos naturales..."
            value={filtros.buscar}
            onChange={e => aplicarFiltro('buscar', e.target.value)}
            className="input-field pl-11"
          />
        </div>

        <div className="grid lg:grid-cols-[240px_1fr] gap-8">
          <aside className="hidden lg:block">
            <PanelFiltros />
          </aside>

          <button onClick={() => setFiltrosMovilAbiertos(true)}
            className="lg:hidden flex items-center gap-2 btn-outline w-fit mb-2">
            <SlidersHorizontal size={16} /> Filtros {hayFiltrosActivos && <span className="w-2 h-2 rounded-full bg-dorado-500" />}
          </button>
          {filtrosMovilAbiertos && (
            <div className="fixed inset-0 z-[100] lg:hidden">
              <div className="absolute inset-0 bg-black/40" onClick={() => setFiltrosMovilAbiertos(false)} />
              <div className="absolute right-0 top-0 bottom-0 w-80 max-w-[85vw] bg-white p-6 overflow-y-auto">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="font-display font-bold text-lg text-verde-900">Filtros</h2>
                  <button onClick={() => setFiltrosMovilAbiertos(false)}><X size={20} className="text-gray-500" /></button>
                </div>
                <PanelFiltros />
              </div>
            </div>
          )}

          <div>
            <div className="flex items-center justify-between flex-wrap gap-3 mb-5">
              <p className="text-sm font-body text-gray-500">{total} producto{total !== 1 ? 's' : ''} encontrado{total !== 1 ? 's' : ''}</p>
              <select value={orden} onChange={e => setOrden(e.target.value)}
                className="text-sm font-body border border-crema-300 px-3 py-2 bg-white text-verde-900 outline-none focus:border-dorado-500">
                {ORDENES.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
              </select>
            </div>

            {cargando ? (
              <div className="grid sm:grid-cols-2 xl:grid-cols-3 gap-6">
                {[...Array(6)].map((_, i) => <ProductCardSkeleton key={i} />)}
              </div>
            ) : productos.length === 0 ? (
              <div className="text-center py-20 border border-dashed border-crema-300">
                <Leaf size={44} className="text-verde-200 mx-auto mb-4" />
                <h3 className="font-display text-xl text-verde-800 mb-2">No encontramos productos</h3>
                <p className="text-gray-400 font-body mb-4">Prueba con otros filtros o términos de búsqueda</p>
                {hayFiltrosActivos && <button onClick={limpiarFiltros} className="btn-outline">Limpiar filtros</button>}
              </div>
            ) : (
              <>
                <div className="grid sm:grid-cols-2 xl:grid-cols-3 gap-6">
                  {productos.map(p => <ProductCard key={p.id} producto={p} />)}
                </div>
                {totalPaginas > 1 && (
                  <div className="flex justify-center gap-2 mt-10">
                    {[...Array(totalPaginas)].map((_, i) => (
                      <button key={i} onClick={() => { setPagina(i + 1); window.scrollTo({top:0, behavior:'smooth'}); }}
                        className={`w-10 h-10 font-body text-sm font-semibold transition-colors ${pagina === i + 1 ? 'bg-verde-900 text-crema-100' : 'bg-white text-gray-600 border border-crema-300 hover:border-dorado-400'}`}>
                        {i + 1}
                      </button>
                    ))}
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>

      <TalleresYCursos />
    </div>
  );
}

// ── TALLERES Y CURSOS ──────────────────────────────────────
// Contenido de ejemplo — edita titulos, fechas y precios con la
// informacion real de tus proximos talleres. Si mas adelante quieres
// que la gente los agende y pague en linea (como las citas de masaje),
// se puede construir igual que ese modulo.
const TALLERES = [
  {
    nombre: 'Taller de aceites esenciales caseros',
    descripcion: '[EDITA] Aprende a preparar tus propios aceites con plantas medicinales.',
    fecha: '[EDITA: próxima fecha]',
    precio: '[EDITA: precio]',
  },
  {
    nombre: 'Introducción al cannabis medicinal',
    descripcion: '[EDITA] Usos, dosis y presentaciones para principiantes.',
    fecha: '[EDITA: próxima fecha]',
    precio: '[EDITA: precio]',
  },
  {
    nombre: 'Curso de infusiones y remedios naturales',
    descripcion: '[EDITA] Combina plantas para sueño, digestión y más.',
    fecha: '[EDITA: próxima fecha]',
    precio: '[EDITA: precio]',
  },
];

function TalleresYCursos() {
  return (
    <section className="bg-verde-900 py-16 px-6">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-12">
          <span className="label-botica text-dorado-400 text-xs">Aprende con nosotros</span>
          <h2 className="font-display text-3xl font-bold text-crema-100 mt-2">Talleres y cursos</h2>
          <p className="font-body text-verde-300 text-sm mt-2 max-w-xl mx-auto">
            Sesiones presenciales y virtuales para aprender a preparar y usar remedios naturales.
          </p>
        </div>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {TALLERES.map((t, i) => (
            <div key={i} className="bg-verde-800 border border-verde-700 overflow-hidden">
              <div className="h-40 bg-verde-700 flex items-center justify-center hover-gota">
                <Leaf size={32} className="text-verde-400" />
              </div>
              <div className="p-6">
                <h3 className="font-display text-lg font-bold text-crema-100 mb-2">{t.nombre}</h3>
                <p className="font-body text-sm text-verde-300 mb-4">{t.descripcion}</p>
                <div className="flex items-center justify-between text-xs font-body text-dorado-400 mb-4">
                  <span>{t.fecha}</span>
                  <span className="font-bold">{t.precio}</span>
                </div>
                <a href="https://wa.me/573102631592" target="_blank" rel="noreferrer"
                  className="btn-gold w-full text-center block">
                  Más información
                </a>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
