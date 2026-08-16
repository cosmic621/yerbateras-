import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Leaf, ChevronLeft, ShoppingCart, RotateCcw, Loader } from 'lucide-react';
import api from '../services/api';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import Swal from 'sweetalert2';

export default function Botiquin() {
  const [pregunta, setPregunta] = useState(null);
  const [resultado, setResultado] = useState(null);
  const [historial, setHistorial] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [avanzando, setAvanzando] = useState(false);
  const { agregar } = useCart();
  const { usuario } = useAuth();

  const cargarInicio = () => {
    setCargando(true);
    setResultado(null);
    setHistorial([]);
    api.get('/botiquin/inicio')
      .then(r => setPregunta(r.data.pregunta))
      .finally(() => setCargando(false));
  };

  useEffect(() => { cargarInicio(); }, []);

  const elegir = async (respuesta) => {
    setAvanzando(true);
    try {
      const { data } = await api.get(`/botiquin/respuestas/${respuesta.id}/siguiente`);
      setHistorial(h => [...h, { pregunta: pregunta.texto, respuesta: respuesta.texto }]);
      if (data.tipo === 'pregunta') {
        setPregunta(data.pregunta);
      } else {
        setResultado(data);
        setPregunta(null);
      }
    } finally {
      setAvanzando(false);
    }
  };

  const agregarAlCarrito = async (producto) => {
    if (!usuario) {
      Swal.fire({ icon: 'info', title: 'Inicia sesión', text: 'Debes iniciar sesión para agregar productos al carrito.', confirmButtonColor: '#052a1c' });
      return;
    }
    try {
      await agregar(producto.id, 1);
      Swal.fire({ icon: 'success', title: '¡Agregado!', timer: 1300, showConfirmButton: false, toast: true, position: 'top-end' });
    } catch (err) {
      Swal.fire({ icon: 'error', title: 'Error', text: err.response?.data?.mensaje || 'No se pudo agregar', confirmButtonColor: '#052a1c' });
    }
  };

  const agregarTodo = async () => {
    if (!usuario) {
      Swal.fire({ icon: 'info', title: 'Inicia sesión', text: 'Debes iniciar sesión para agregar productos al carrito.', confirmButtonColor: '#052a1c' });
      return;
    }
    for (const p of resultado.productos) {
      await agregar(p.id, 1).catch(() => {});
    }
    Swal.fire({ icon: 'success', title: 'Botiquín agregado al carrito', timer: 1500, showConfirmButton: false, toast: true, position: 'top-end' });
  };

  if (cargando) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-crema-50">
        <div className="w-8 h-8 border-4 border-verde-200 border-t-verde-900 rounded-full animate-spin" />
      </div>
    );
  }

  if (!pregunta && !resultado) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-crema-50 px-4">
        <div className="text-center max-w-md">
          <Leaf size={40} className="text-verde-300 mx-auto mb-4" />
          <p className="font-display text-xl text-verde-900 mb-2">El botiquín no está disponible por ahora</p>
          <p className="font-body text-gray-500 text-sm mb-6">Mientras tanto, explora nuestra tienda completa.</p>
          <Link to="/tienda" className="btn-primary inline-flex">Ver tienda</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-crema-50">
      <div className="bg-verde-900 text-white py-12 px-6 text-center">
        <span className="label-botica text-dorado-400 text-xs">Encuentra lo tuyo</span>
        <h1 className="font-display text-3xl md:text-4xl font-bold mt-2">Prepara tu Botiquín Yerbatero</h1>
        <p className="font-body text-verde-300 text-sm mt-2 max-w-lg mx-auto">
          Responde unas preguntas sencillas y te recomendamos qué llevar.
        </p>
      </div>

      <div className="max-w-2xl mx-auto px-6 py-12">
        {historial.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-6">
            {historial.map((h, i) => (
              <span key={i} className="text-xs font-body px-3 py-1 bg-verde-100 text-verde-800">{h.respuesta}</span>
            ))}
          </div>
        )}

        {resultado ? (
          <div>
            <button onClick={cargarInicio} className="flex items-center gap-2 text-verde-700 hover:text-verde-900 font-body text-sm mb-6">
              <RotateCcw size={15} /> Empezar de nuevo
            </button>

            <h2 className="font-display text-2xl font-bold text-verde-900 mb-2">
              Para "{resultado.respuesta_texto}" te recomendamos:
            </h2>

            {resultado.productos.length === 0 ? (
              <div className="bg-white border border-dashed border-crema-300 p-10 text-center mt-6">
                <Leaf size={36} className="text-verde-200 mx-auto mb-3" />
                <p className="font-body text-gray-500 mb-4">Aún no tenemos productos configurados para esta necesidad.</p>
                <Link to="/tienda" className="btn-outline inline-flex">Explorar tienda</Link>
              </div>
            ) : (
              <>
                <div className="grid sm:grid-cols-2 gap-4 mt-6">
                  {resultado.productos.map(p => (
                    <div key={p.id} className="card p-4 flex gap-3">
                      <Link to={`/tienda/${p.id}`} className="w-16 h-16 bg-crema-100 shrink-0 flex items-center justify-center overflow-hidden">
                        {p.imagen_principal
                          ? <img src={p.imagen_principal} alt={p.nombre} className="w-full h-full object-cover" />
                          : <Leaf size={22} className="text-verde-200" />}
                      </Link>
                      <div className="flex-1 min-w-0">
                        <Link to={`/tienda/${p.id}`} className="font-display font-bold text-sm text-verde-900 line-clamp-1 hover:text-dorado-600">{p.nombre}</Link>
                        <p className="text-xs font-body text-gray-500 line-clamp-2">{p.descripcion_corta}</p>
                        <div className="flex items-center justify-between mt-2">
                          <span className="font-display font-bold text-verde-800 text-sm">
                            ${Number(p.precio_descuento || p.precio).toLocaleString('es-CO')}
                          </span>
                          <button onClick={() => agregarAlCarrito(p)} disabled={p.stock === 0}
                            className="w-8 h-8 bg-verde-900 hover:bg-verde-800 disabled:bg-gray-200 flex items-center justify-center shrink-0">
                            <ShoppingCart size={14} className="text-crema-100" />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
                <button onClick={agregarTodo} className="btn-gold w-full mt-6 flex items-center justify-center gap-2">
                  <ShoppingCart size={16} /> Agregar todo el botiquín al carrito
                </button>
              </>
            )}
          </div>
        ) : (
          <div className="bg-white border border-crema-300 p-8">
            {historial.length > 0 && (
              <button onClick={cargarInicio} className="flex items-center gap-1.5 text-verde-600 hover:text-verde-900 font-body text-xs mb-4">
                <ChevronLeft size={13} /> Empezar de nuevo
              </button>
            )}
            <h2 className="font-display text-xl font-bold text-verde-900 mb-6">{pregunta.texto}</h2>
            <div className="space-y-2">
              {pregunta.respuestas.map(r => (
                <button key={r.id} onClick={() => elegir(r)} disabled={avanzando}
                  className="w-full text-left px-5 py-3.5 border border-crema-300 hover:border-dorado-500 hover:bg-crema-50 transition-colors font-body text-sm text-verde-900 disabled:opacity-50">
                  {r.texto}
                </button>
              ))}
            </div>
            {avanzando && (
              <div className="flex items-center gap-2 mt-4 text-verde-500 text-xs font-body">
                <Loader size={13} className="animate-spin" /> Cargando...
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
