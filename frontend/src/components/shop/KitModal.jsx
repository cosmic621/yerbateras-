import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Leaf, ChevronLeft, ShoppingCart, RotateCcw, Loader, X } from 'lucide-react';
import api from '../../services/api';
import { useCart } from '../../context/CartContext';
import { useSite } from '../../context/SiteContext';
import Swal from 'sweetalert2';

// Ventana emergente "Arma tu kit": el cuestionario del botiquín, ahora dentro de la tienda.
export default function KitModal() {
  const { kitAbierto, setKitAbierto, activa } = useSite();
  const [pregunta, setPregunta]   = useState(null);
  const [resultado, setResultado] = useState(null);
  const [historial, setHistorial] = useState([]);
  const [cargando, setCargando]   = useState(false);
  const [avanzando, setAvanzando] = useState(false);
  const { agregar } = useCart();

  const cerrar = () => setKitAbierto(false);

  const cargarInicio = () => {
    setCargando(true); setResultado(null); setHistorial([]);
    api.get('/botiquin/inicio')
      .then(r => setPregunta(r.data.pregunta))
      .catch(() => setPregunta(null))
      .finally(() => setCargando(false));
  };

  useEffect(() => { if (kitAbierto) cargarInicio(); }, [kitAbierto]);

  // Esc cierra la ventana y se bloquea el scroll del fondo mientras está abierta
  useEffect(() => {
    if (!kitAbierto) return;
    const onKey = (e) => e.key === 'Escape' && cerrar();
    window.addEventListener('keydown', onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => { window.removeEventListener('keydown', onKey); document.body.style.overflow = prev; };
  }, [kitAbierto]);

  if (!kitAbierto || !activa('arma_tu_kit')) return null;

  const elegir = async (respuesta) => {
    setAvanzando(true);
    try {
      const { data } = await api.get(`/botiquin/respuestas/${respuesta.id}/siguiente`);
      setHistorial(h => [...h, { pregunta: pregunta.texto, respuesta: respuesta.texto }]);
      if (data.tipo === 'pregunta') setPregunta(data.pregunta);
      else { setResultado(data); setPregunta(null); }
    } finally { setAvanzando(false); }
  };

  const agregarAlCarrito = async (producto) => {
    try {
      await agregar(producto, 1);
      Swal.fire({ icon: 'success', title: '¡Agregado!', timer: 1300, showConfirmButton: false, toast: true, position: 'top-end' });
    } catch (err) {
      Swal.fire({ icon: 'error', title: 'Error', text: err.response?.data?.mensaje || 'No se pudo agregar', confirmButtonColor: '#0f3c27' });
    }
  };

  const agregarTodo = async () => {
    for (const p of resultado.productos) await agregar(p, 1).catch(() => {});
    Swal.fire({ icon: 'success', title: 'Kit agregado al carrito', timer: 1500, showConfirmButton: false, toast: true, position: 'top-end' });
  };

  return (
    <div className="fixed inset-0 z-[90] flex items-center justify-center p-3 sm:p-6" role="dialog" aria-modal="true" aria-label="Arma tu kit">
      <div className="absolute inset-0 bg-verde-900/60" onClick={cerrar} />
      <div className="relative bg-crema-50 w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl">
        <div className="bg-verde-900 text-white px-6 py-6 text-center relative">
          <button onClick={cerrar} aria-label="Cerrar" className="absolute right-3 top-3 text-verde-200 hover:text-white"><X size={20} /></button>
          <span className="label-botica text-dorado-400 text-xs">Encuentra lo tuyo</span>
          <h2 className="font-display text-2xl md:text-3xl font-bold mt-1">Arma tu kit</h2>
          <p className="font-body text-verde-200 text-sm mt-1">Responde unas preguntas sencillas y te recomendamos qué llevar.</p>
        </div>

        <div className="px-5 sm:px-8 py-7">
          {cargando && <div className="flex justify-center py-10"><div className="w-8 h-8 border-4 border-verde-200 border-t-verde-900 rounded-full animate-spin" /></div>}

          {!cargando && !pregunta && !resultado && (
            <div className="text-center py-8">
              <Leaf size={36} className="text-verde-300 mx-auto mb-3" />
              <p className="font-display text-lg text-verde-900 mb-1">Esta herramienta no está disponible por ahora</p>
              <p className="font-body text-gray-500 text-sm mb-5">Mientras tanto, explora nuestra tienda completa.</p>
              <button onClick={cerrar} className="btn-primary">Seguir en la tienda</button>
            </div>
          )}

          {!cargando && historial.length > 0 && (
            <div className="flex flex-wrap gap-2 mb-5">
              {historial.map((h, i) => <span key={i} className="text-xs font-body px-3 py-1 bg-verde-100 text-verde-800">{h.respuesta}</span>)}
            </div>
          )}

          {!cargando && resultado && (
            <div>
              <button onClick={cargarInicio} className="flex items-center gap-2 text-verde-700 hover:text-verde-900 font-body text-sm mb-4">
                <RotateCcw size={15} /> Empezar de nuevo
              </button>
              <h3 className="font-display text-xl font-bold text-verde-900 mb-1">Para "{resultado.respuesta_texto}" te recomendamos:</h3>

              {resultado.productos.length === 0 ? (
                <div className="bg-white border border-dashed border-crema-300 p-8 text-center mt-5">
                  <Leaf size={32} className="text-verde-200 mx-auto mb-2" />
                  <p className="font-body text-gray-500 mb-3 text-sm">Aún no tenemos productos configurados para esta necesidad.</p>
                  <button onClick={cerrar} className="btn-outline">Explorar tienda</button>
                </div>
              ) : (
                <>
                  <div className="grid sm:grid-cols-2 gap-3 mt-5">
                    {resultado.productos.map(p => (
                      <div key={p.id} className="card p-3 flex gap-3">
                        <Link to={`/tienda/${p.id}`} onClick={cerrar} className="w-16 h-16 bg-crema-100 shrink-0 flex items-center justify-center overflow-hidden">
                          {p.imagen_principal ? <img src={p.imagen_principal} alt={p.nombre} className="w-full h-full object-cover" /> : <Leaf size={22} className="text-verde-200" />}
                        </Link>
                        <div className="flex-1 min-w-0">
                          <Link to={`/tienda/${p.id}`} onClick={cerrar} className="font-display font-bold text-sm text-verde-900 line-clamp-1 hover:text-dorado-600">{p.nombre}</Link>
                          <p className="text-xs font-body text-gray-500 line-clamp-2">{p.descripcion_corta}</p>
                          <div className="flex items-center justify-between mt-1.5">
                            <span className="font-display font-bold text-verde-800 text-sm">${Number(p.precio_descuento || p.precio).toLocaleString('es-CO')}</span>
                            <button onClick={() => agregarAlCarrito(p)} disabled={p.stock === 0} aria-label="Agregar" className="w-8 h-8 bg-verde-900 hover:bg-verde-800 disabled:bg-gray-200 flex items-center justify-center shrink-0">
                              <ShoppingCart size={14} className="text-crema-100" />
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                  <button onClick={agregarTodo} className="btn-gold w-full mt-5"><ShoppingCart size={16} /> Agregar todo el kit al carrito</button>
                </>
              )}
            </div>
          )}

          {!cargando && pregunta && (
            <div>
              {historial.length > 0 && (
                <button onClick={cargarInicio} className="flex items-center gap-1.5 text-verde-600 hover:text-verde-900 font-body text-xs mb-3">
                  <ChevronLeft size={13} /> Empezar de nuevo
                </button>
              )}
              <h3 className="font-display text-lg font-bold text-verde-900 mb-5">{pregunta.texto}</h3>
              <div className="space-y-2">
                {pregunta.respuestas.map(r => (
                  <button key={r.id} onClick={() => elegir(r)} disabled={avanzando}
                    className="w-full text-left px-5 py-3 border border-crema-300 bg-white hover:border-dorado-500 transition-colors font-body text-sm text-verde-900 disabled:opacity-50">
                    {r.texto}
                  </button>
                ))}
              </div>
              {avanzando && <div className="flex items-center gap-2 mt-4 text-verde-500 text-xs font-body"><Loader size={13} className="animate-spin" /> Cargando...</div>}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
