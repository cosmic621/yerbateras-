import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Leaf } from 'lucide-react';
import api from '../services/api';
import { useSite } from '../context/SiteContext';
import ProductCard from '../components/shop/ProductCard';
import Carrusel from '../components/home/Carrusel';

const Titulo = ({ children, sub }) => (
  <div className="text-center mb-10">
    <h2 className="text-3xl text-verde-900 inline-block pb-1 border-b-2 border-dorado-400">{children}</h2>
    {sub && <p className="text-lg text-verde-600 mt-3">{sub}</p>}
  </div>
);

export default function Inicio() {
  const { categorias } = useSite();
  const [slides, setSlides] = useState(null);
  const [destacados, setDestacados] = useState([]);
  const [promos, setPromos] = useState([]);

  useEffect(() => {
    api.get('/tienda/banners').then(r => setSlides(r.data.banners || [])).catch(() => setSlides([]));
    api.get('/productos', { params: { destacados: 'true', limit: 8 } }).then(r => setDestacados(r.data.productos || [])).catch(() => {});
    api.get('/productos', { params: { promocion: 'true', limit: 4 } }).then(r => setPromos(r.data.productos || [])).catch(() => {});
  }, []);

  return (
    <div>
      {slides && slides.length > 0 ? (
        <Carrusel slides={slides} />
      ) : slides && (
        // Si aún no hay imágenes en el carrusel, se muestra una portada sencilla
        <section className="bg-crema-100 text-center px-6 py-24">
          <Leaf size={30} className="text-dorado-600 mx-auto mb-4" strokeWidth={1.4} />
          <h1 className="text-5xl md:text-6xl text-verde-900">Diez años echando raíces</h1>
          <p className="text-xl md:text-2xl text-verde-600 mt-3 max-w-xl mx-auto">Plantas medicinales, rituales cotidianos y saberes compartidos.</p>
          <Link to="/tienda" className="btn-primary mt-8">Ver la tienda</Link>
        </section>
      )}

      {destacados.length > 0 && (
        <section className="max-w-6xl mx-auto px-6 py-16">
          <Titulo sub="Los favoritos de esta semana">Destacados de la semana</Titulo>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-x-6 gap-y-10">{destacados.map(p => <ProductCard key={p.id} producto={p} />)}</div>
        </section>
      )}

      {promos.length > 0 && (
        <section className="bg-crema-100 py-16">
          <div className="max-w-6xl mx-auto px-6">
            <Titulo sub="Por tiempo limitado">En promoción</Titulo>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-x-6 gap-y-10">{promos.map(p => <ProductCard key={p.id} producto={p} />)}</div>
          </div>
        </section>
      )}

      {categorias.length > 0 && (
        <section className="max-w-4xl mx-auto px-6 py-16 text-center">
          <Titulo sub="Tesoros para cada ocasión">Explora por categoría</Titulo>
          <div className="flex flex-wrap justify-center gap-3">
            {categorias.slice(0, 8).map(c => (
              <Link key={c.id} to={`/tienda?categoria=${c.slug}`} className="px-6 py-2.5 border border-crema-300 text-xl text-verde-800 hover:bg-verde-900 hover:text-crema-50 hover-gota relative overflow-hidden">{c.nombre}</Link>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
