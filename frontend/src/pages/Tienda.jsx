import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import api from '../services/api';
import { useSite } from '../context/SiteContext';
import ProductCard from '../components/shop/ProductCard';
import BandaTitulo from '../components/ui/BandaTitulo';

const ORDENES = [
  ['relevancia', 'Más relevantes'],
  ['recientes', 'Más recientes'],
  ['precio_asc', 'Precio: menor a mayor'],
  ['precio_desc', 'Precio: mayor a menor'],
  ['calificacion', 'Mejor calificados'],
];

// Tienda: una sola fila de filtros y una cuadrícula limpia. Los filtros viven en la URL.
export default function Tienda() {
  const [sp, setSp] = useSearchParams();
  const { categorias, lineas, activa, setKitAbierto } = useSite();
  const [productos, setProductos] = useState([]);
  const [totalPaginas, setTotalPaginas] = useState(1);
  const [cargando, setCargando] = useState(true);

  const g = (k) => sp.get(k) || '';
  const pagina = Number(g('page')) || 1;

  // Enlaces antiguos (/botiquin → /tienda?kit=1) abren la ventana de "Arma tu kit"
  useEffect(() => { if (sp.get('kit')) { setKitAbierto(true); const n = new URLSearchParams(sp); n.delete('kit'); setSp(n, { replace: true }); } // eslint-disable-next-line
  }, []);

  useEffect(() => {
    setCargando(true);
    const params = { limit: 12, page: pagina };
    ['buscar', 'categoria', 'linea_cuidado', 'destacados', 'es_kit', 'promocion', 'orden'].forEach(k => { if (g(k)) params[k] = g(k); });
    api.get('/productos', { params })
      .then(r => { setProductos(r.data.productos || []); setTotalPaginas(r.data.totalPaginas || 1); })
      .catch(() => setProductos([]))
      .finally(() => setCargando(false));
    // eslint-disable-next-line
  }, [sp]);

  const poner = (k, v) => {
    const n = new URLSearchParams(sp);
    if (v) n.set(k, v); else n.delete(k);
    n.delete('page');
    setSp(n);
  };
  const irPagina = (p) => { const n = new URLSearchParams(sp); n.set('page', p); setSp(n); window.scrollTo({ top: 0, behavior: 'smooth' }); };

  const cat = categorias.find(c => c.slug === g('categoria'));
  const titulo = g('buscar') ? `Resultados para “${g('buscar')}”`
    : g('es_kit') ? 'Kits de regalo'
    : g('promocion') ? 'En promoción'
    : g('destacados') ? 'Destacados'
    : cat ? cat.nombre : 'Productos';

  const pill = (activo) => `px-4 py-1.5 text-lg border transition-colors ${activo ? 'bg-verde-900 text-crema-50 border-verde-900' : 'border-crema-300 text-verde-800 hover:border-dorado-500'}`;

  return (
    <>
      <BandaTitulo>{titulo}</BandaTitulo>
      <div className="max-w-6xl mx-auto px-6 py-10">
        <div className="flex flex-wrap items-center gap-2 mb-3">
          <button className={pill(!g('categoria') && !g('es_kit') && !g('promocion') && !g('destacados'))}
            onClick={() => setSp(new URLSearchParams())}>Todo</button>
          {categorias.map(c => <button key={c.id} className={pill(g('categoria') === c.slug)} onClick={() => poner('categoria', g('categoria') === c.slug ? '' : c.slug)}>{c.nombre}</button>)}
          {activa('kits') && <button className={pill(g('es_kit') === 'true')} onClick={() => poner('es_kit', g('es_kit') ? '' : 'true')}>Kits</button>}
          <button className={pill(g('promocion') === 'true')} onClick={() => poner('promocion', g('promocion') ? '' : 'true')}>Promociones</button>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3 mb-10 pb-4 border-b border-crema-200">
          <div className="flex flex-wrap items-center gap-4">
            {lineas.length > 0 && (
              <select value={g('linea_cuidado')} onChange={e => poner('linea_cuidado', e.target.value)} aria-label="Guía de cuidado"
                className="border border-crema-300 bg-white text-lg text-verde-800 px-3 py-1.5 rounded-full outline-none">
                <option value="">Guía de cuidado</option>
                {lineas.map(l => <option key={l.id} value={l.slug}>{l.nombre}</option>)}
              </select>
            )}
            {activa('arma_tu_kit') && (
              <button onClick={() => setKitAbierto(true)} className="text-lg text-dorado-700 underline underline-offset-4 hover:text-dorado-600">Arma tu kit</button>
            )}
          </div>
          <select value={g('orden') || 'relevancia'} onChange={e => poner('orden', e.target.value === 'relevancia' ? '' : e.target.value)} aria-label="Ordenar"
            className="border border-crema-300 bg-white text-lg text-verde-800 px-3 py-1.5 rounded-full outline-none">
            {ORDENES.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
          </select>
        </div>

        {cargando ? (
          <div className="flex justify-center py-20"><div className="w-8 h-8 border-4 border-verde-200 border-t-verde-900 rounded-full animate-spin" /></div>
        ) : productos.length === 0 ? (
          <p className="text-center text-xl text-verde-600 py-20">No encontramos productos con estos filtros.</p>
        ) : (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-x-6 gap-y-10">{productos.map(p => <ProductCard key={p.id} producto={p} />)}</div>
        )}

        {totalPaginas > 1 && (
          <div className="flex justify-center gap-2 mt-12">
            {Array.from({ length: totalPaginas }, (_, i) => i + 1).map(p => (
              <button key={p} onClick={() => irPagina(p)} className={`w-10 h-10 text-lg border ${p === pagina ? 'bg-verde-900 text-crema-50 border-verde-900' : 'border-crema-300 text-verde-800'}`}>{p}</button>
            ))}
          </div>
        )}
      </div>
    </>
  );
}
