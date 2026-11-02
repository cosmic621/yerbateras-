import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Instagram } from 'lucide-react';
import api from '../../services/api';
import { useSite } from '../../context/SiteContext';

const titulo = 'text-sm uppercase tracking-[0.18em] text-dorado-600 mb-4';
const enlace = 'block py-1 text-lg text-verde-700 hover:text-dorado-700 transition-colors';

export default function Footer() {
  const { categorias, activa } = useSite();
  const [email, setEmail] = useState('');
  const [estado, setEstado] = useState(null); // null | 'ok' | 'error'

  const suscribir = async (e) => {
    e.preventDefault();
    try { await api.post('/newsletter/suscribir', { email }); setEstado('ok'); setEmail(''); }
    catch { setEstado('error'); }
  };

  return (
    <footer className="bg-crema-100 border-t border-crema-300 mt-20">
      <div className="max-w-6xl mx-auto px-6 py-14 grid gap-10 sm:grid-cols-2 lg:grid-cols-4">
        <div>
          <p className={titulo}>Contacto</p>
          <a href="https://wa.me/573102631592" target="_blank" rel="noreferrer" className={enlace}>+57 310 263 1592</a>
          <a href="mailto:info@yerbateras.co" className={enlace}>info@yerbateras.co</a>
          <a href="https://www.instagram.com/yerbaterass/" target="_blank" rel="noreferrer" className={`${enlace} flex items-center gap-2`}><Instagram size={16} /> @yerbaterass</a>
        </div>

        <div>
          <p className={titulo}>Tienda</p>
          {categorias.slice(0, 5).map(c => <Link key={c.id} to={`/tienda?categoria=${c.slug}`} className={enlace}>{c.nombre}</Link>)}
          {activa('kits') && <Link to="/tienda?es_kit=true" className={enlace}>Kits de regalo</Link>}
        </div>

        <div>
          <p className={titulo}>Yerbateras</p>
          <Link to="/nosotros" className={enlace}>Nosotras</Link>
          {activa('citas') && <Link to="/citas" className={enlace}>Masajes</Link>}
          {activa('talleres') && <Link to="/talleres" className={enlace}>Talleres</Link>}
          {activa('eventos') && <Link to="/eventos" className={enlace}>Eventos</Link>}
          <Link to="/pedido" className={enlace}>Seguir mi pedido</Link>
          <button type="button" onClick={() => window.dispatchEvent(new Event('abrir-cotizacion'))} className={`${enlace} text-left`}>Cotización para empresas</button>
        </div>

        <div>
          <p className={titulo}>Novedades por correo</p>
          <p className="text-lg text-verde-700 mb-3">Si quieres, te escribimos de vez en cuando con saberes y lanzamientos.</p>
          {estado === 'ok' ? (
            <p className="text-lg text-verde-700">¡Gracias! Ya estás en la lista.</p>
          ) : (
            <form onSubmit={suscribir} className="flex">
              <input type="email" required value={email} onChange={e => { setEmail(e.target.value); setEstado(null); }} placeholder="Tu correo" aria-label="Tu correo"
                className="flex-1 min-w-0 px-3 py-2 text-lg border border-crema-300 bg-white outline-none focus:border-dorado-500" />
              <button className="px-4 bg-verde-900 text-crema-50 text-lg hover:bg-verde-800">Suscribirme</button>
            </form>
          )}
          {estado === 'error' && <p className="text-base text-red-600 mt-2">No pudimos suscribirte, intenta de nuevo.</p>}
        </div>
      </div>

      <div className="border-t border-crema-300 py-5 text-center text-base text-verde-600 px-6">
        © {new Date().getFullYear()} Yerbateras · Pagos en línea con tarjeta, PSE o Nequi · No manejamos contraentrega
      </div>
    </footer>
  );
}
