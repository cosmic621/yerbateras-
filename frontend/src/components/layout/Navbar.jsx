import { useState, useEffect, useRef } from 'react';
import { Link, NavLink, useNavigate, useLocation } from 'react-router-dom';
import { ShoppingBag, Menu, X, Search, ChevronDown, Leaf } from 'lucide-react';
import { useCart } from '../../context/CartContext';
import { useSite } from '../../context/SiteContext';

const enlace = 'text-[1.08rem] text-verde-900 hover:text-dorado-600 transition-colors py-2';
const colTitulo = 'text-sm uppercase tracking-[0.18em] text-dorado-600 mb-3';
const itemMenu = 'block py-1 text-[1.05rem] text-verde-800 hover:text-dorado-600 transition-colors';

// Logo de la marca: pon tu archivo en frontend/public/logo.svg (o logo.png) y aparece solo.
// Mientras no exista, se muestra el nombre escrito.
const LOGOS = ['/logo.svg', '/logo.png'];

function Logo() {
  const [n, setN] = useState(0);   // qué archivo se está probando; LOGOS.length = ninguno existe
  return (
    <Link to="/" aria-label="Yerbateras, inicio" className="flex flex-col items-center leading-none select-none">
      {n < LOGOS.length ? (
        <img src={LOGOS[n]} alt="Yerbateras" onError={() => setN(n + 1)} className="h-12 w-auto max-w-[220px] object-contain" />
      ) : (
        <>
          <Leaf size={14} className="text-dorado-600 mb-1" strokeWidth={1.6} />
          <span className="text-[1.55rem] tracking-[0.32em] text-verde-900 pl-[0.32em]">YERBATERAS</span>
        </>
      )}
    </Link>
  );
}

export default function Navbar() {
  const { cantidadTotal, setAbierto } = useCart();
  const { categorias, lineas, temporadas, activa, setKitAbierto } = useSite();
  const [menu, setMenu] = useState(null);          // 'tienda' | 'servicios'
  const [movil, setMovil] = useState(false);
  const [buscando, setBuscando] = useState(false);
  const [q, setQ] = useState('');
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const cierre = useRef(null);

  useEffect(() => { setMenu(null); setMovil(false); setBuscando(false); }, [pathname]);

  const abrir = (k) => { clearTimeout(cierre.current); setMenu(k); };
  const cerrar = () => { cierre.current = setTimeout(() => setMenu(null), 120); };
  const buscar = (e) => { e.preventDefault(); navigate(`/tienda${q.trim() ? `?buscar=${encodeURIComponent(q.trim())}` : ''}`); setQ(''); };
  const abrirKit = () => { setMovil(false); setMenu(null); navigate('/tienda'); setKitAbierto(true); };
  const abrirCotizacion = () => { setMovil(false); setMenu(null); window.dispatchEvent(new Event('abrir-cotizacion')); };

  const hayServicios = activa('citas') || activa('talleres');
  const Simple = ({ to, children }) => (
    <NavLink to={to} end={to === '/'} onMouseEnter={() => setMenu(null)}
      className={({ isActive }) => `${enlace} ${isActive ? 'text-dorado-700' : ''}`}>{children}</NavLink>
  );
  const Disparador = ({ id, children }) => (
    <button type="button" onMouseEnter={() => abrir(id)} onClick={() => setMenu(menu === id ? null : id)}
      className={`${enlace} flex items-center gap-1 ${menu === id ? '!text-dorado-600' : ''}`}>
      {children} <ChevronDown size={13} className={menu === id ? 'rotate-180 transition-transform' : 'transition-transform'} />
    </button>
  );

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-white border-b border-crema-200" onMouseLeave={cerrar}>
      <div className="relative max-w-[1500px] mx-auto h-[72px] px-4 xl:px-10 flex items-center justify-between">
        {/* izquierda */}
        <nav aria-label="Principal" className="hidden xl:flex items-center gap-7 flex-1">
          <Simple to="/">Inicio</Simple>
          <Disparador id="tienda">Tienda</Disparador>
          {hayServicios && <Disparador id="servicios">Servicios</Disparador>}
          {activa('eventos') && <Simple to="/eventos">Eventos</Simple>}
          {temporadas.map(t => <Simple key={t.clave} to={`/temporada/${t.clave}`}>✦ {t.nombre}</Simple>)}
        </nav>
        <button className="xl:hidden p-2 -ml-2 text-verde-900" onClick={() => setMovil(!movil)} aria-label="Menú" aria-expanded={movil}>
          {movil ? <X size={24} /> : <Menu size={24} />}
        </button>

        {/* centro */}
        <div className="absolute left-1/2 -translate-x-1/2"><Logo /></div>

        {/* derecha */}
        <div className="flex items-center justify-end gap-5 xl:gap-6 flex-1">
          <div className="hidden xl:flex items-center gap-7 mr-2">
            <Simple to="/nosotros">Nosotras</Simple>
            <Simple to="/contacto">Contacto</Simple>
          </div>
          <button onClick={() => setBuscando(!buscando)} aria-label="Buscar" className="text-verde-900 hover:text-dorado-600"><Search size={21} /></button>
          <button onClick={() => setAbierto(true)} aria-label="Abrir carrito" className="relative text-verde-900 hover:text-dorado-600">
            <ShoppingBag size={22} />
            {cantidadTotal > 0 && (
              <span className="absolute -top-2 -right-2 bg-verde-900 text-crema-50 text-xs w-[18px] h-[18px] rounded-full flex items-center justify-center">{cantidadTotal > 9 ? '9+' : cantidadTotal}</span>
            )}
          </button>
        </div>
      </div>

      {buscando && (
        <form onSubmit={buscar} className="border-t border-crema-200 bg-white px-6 py-3">
          <input autoFocus value={q} onChange={e => setQ(e.target.value)} placeholder="Buscar productos…" aria-label="Buscar productos"
            className="w-full max-w-2xl mx-auto block px-4 py-2.5 text-lg border border-crema-300 outline-none focus:border-dorado-500" />
        </form>
      )}

      {/* desplegable Tienda */}
      {menu === 'tienda' && (
        <div onMouseEnter={() => abrir('tienda')} className="hidden xl:block absolute left-0 right-0 bg-white border-t border-crema-200 shadow-card-hover">
          <div className="max-w-5xl mx-auto px-10 py-8 grid grid-cols-3 gap-12">
            <div>
              <p className={colTitulo}>Por categoría</p>
              {categorias.map(c => <Link key={c.id} to={`/tienda?categoria=${c.slug}`} className={itemMenu}>{c.nombre}</Link>)}
              <Link to="/tienda" className={`${itemMenu} !text-verde-900 mt-2`}>Ver todo →</Link>
            </div>
            <div>
              <p className={colTitulo}>Guía de cuidado</p>
              {lineas.map(l => <Link key={l.id} to={`/tienda?linea_cuidado=${l.slug}`} className={itemMenu}>{l.nombre}</Link>)}
            </div>
            <div>
              <p className={colTitulo}>Kits y regalos</p>
              {activa('kits') && <Link to="/tienda?es_kit=true" className={itemMenu}>Kits de regalo</Link>}
              {activa('arma_tu_kit') && <button type="button" onClick={abrirKit} className={`${itemMenu} text-left`}>Arma tu kit</button>}
              <Link to="/tienda?promocion=true" className={itemMenu}>En promoción</Link>
            </div>
          </div>
        </div>
      )}

      {/* desplegable Servicios */}
      {menu === 'servicios' && (
        <div onMouseEnter={() => abrir('servicios')} className="hidden xl:block absolute left-0 right-0 bg-white border-t border-crema-200 shadow-card-hover">
          <div className="max-w-3xl mx-auto px-10 py-7 flex gap-16">
            {activa('citas') && <Link to="/citas" className={itemMenu}>Masajes</Link>}
            {activa('talleres') && <Link to="/talleres" className={itemMenu}>Talleres</Link>}
            <button type="button" onClick={abrirCotizacion} className={itemMenu}>Empresas y grupos</button>
          </div>
        </div>
      )}

      {/* móvil */}
      {movil && (
        <nav aria-label="Móvil" className="xl:hidden bg-white border-t border-crema-200 max-h-[80vh] overflow-y-auto px-6 py-4 text-xl">
          <Link to="/" className="block py-3 text-verde-900">Inicio</Link>
          <p className={`${colTitulo} mt-3`}>Tienda</p>
          {categorias.map(c => <Link key={c.id} to={`/tienda?categoria=${c.slug}`} className={itemMenu}>{c.nombre}</Link>)}
          <Link to="/tienda" className={`${itemMenu} !text-verde-900`}>Ver todo →</Link>
          {activa('kits') && <Link to="/tienda?es_kit=true" className={itemMenu}>Kits de regalo</Link>}
          {activa('arma_tu_kit') && <button type="button" onClick={abrirKit} className={`${itemMenu} text-left`}>Arma tu kit</button>}
          <Link to="/tienda?promocion=true" className={itemMenu}>En promoción</Link>
          {hayServicios && <p className={`${colTitulo} mt-5`}>Servicios</p>}
          {activa('citas') && <Link to="/citas" className={itemMenu}>Masajes</Link>}
          {activa('talleres') && <Link to="/talleres" className={itemMenu}>Talleres</Link>}
          <button type="button" onClick={abrirCotizacion} className={`${itemMenu} text-left`}>Empresas y grupos</button>
          <div className="border-t border-crema-200 mt-4 pt-2">
            {activa('eventos') && <Link to="/eventos" className="block py-3 text-verde-900">Eventos</Link>}
            {temporadas.map(t => <Link key={t.clave} to={`/temporada/${t.clave}`} className="block py-3 text-dorado-700">✦ {t.nombre}</Link>)}
            <Link to="/nosotros" className="block py-3 text-verde-900">Nosotras</Link>
            <Link to="/contacto" className="block py-3 text-verde-900">Contacto</Link>
            <Link to="/pedido" className="block py-3 text-verde-700">Seguir mi pedido</Link>
          </div>
        </nav>
      )}
    </header>
  );
}
