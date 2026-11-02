import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { Sparkles } from 'lucide-react';
import api from '../services/api';
import { useSite } from '../context/SiteContext';
import ProductCard from '../components/shop/ProductCard';
import BandaTitulo from '../components/ui/BandaTitulo';

// Página genérica de temporada: /temporada/navidad, /temporada/dia_de_la_madre...
export default function Temporada() {
  const { clave } = useParams();
  const { temporadas, cargado } = useSite();
  const [productos, setProductos] = useState([]);
  const [cargando, setCargando] = useState(true);
  const temporada = temporadas.find(t => t.clave === clave);

  useEffect(() => {
    setCargando(true);
    api.get('/productos', { params: { temporada: clave, limit: 100 } })
      .then(r => setProductos(r.data.productos || []))
      .catch(() => setProductos([]))
      .finally(() => setCargando(false));
  }, [clave]);

  if (cargado && !temporada) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center text-center px-6">
        <Sparkles size={36} className="text-verde-300 mb-3" />
        <p className="font-display text-xl text-verde-900 mb-2">Esta sección no está disponible por ahora</p>
        <Link to="/tienda" className="btn-primary mt-3">Ir a la tienda</Link>
      </div>
    );
  }

  const kits = productos.filter(p => p.es_kit);
  const sueltos = productos.filter(p => !p.es_kit);

  return (
    <div className="bg-crema-50 min-h-screen">
      <BandaTitulo>{temporada?.nombre || '…'}</BandaTitulo>
      <p className="text-center text-xl text-verde-600 mt-8 px-6">{temporada?.descripcion || 'Artículos especiales de temporada.'}</p>
      <div className="max-w-7xl mx-auto px-6 lg:px-12 py-12">
        {cargando ? (
          <div className="flex justify-center py-16"><div className="w-8 h-8 border-4 border-verde-200 border-t-verde-900 rounded-full animate-spin" /></div>
        ) : productos.length === 0 ? (
          <p className="text-center font-body text-verde-600 py-16">Muy pronto tendremos artículos para esta temporada.</p>
        ) : (
          <>
            {kits.length > 0 && (
              <section className="mb-12">
                <h2 className="font-display text-2xl font-bold text-verde-900 mb-5 text-center">Kits de temporada</h2>
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-5">{kits.map(p => <ProductCard key={p.id} producto={p} />)}</div>
              </section>
            )}
            {sueltos.length > 0 && (
              <section>
                <h2 className="font-display text-2xl font-bold text-verde-900 mb-5 text-center">Artículos especiales</h2>
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-5">{sueltos.map(p => <ProductCard key={p.id} producto={p} />)}</div>
              </section>
            )}
          </>
        )}
      </div>
    </div>
  );
}
