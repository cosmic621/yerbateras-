import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Shield, ShoppingCart, ArrowLeft, Leaf, Star, Package, AlertCircle, Truck, RotateCcw, ChevronRight, Award } from 'lucide-react';
import api from '../services/api';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import Swal from 'sweetalert2';

const TABS = [
  { id: 'descripcion', label: 'Descripción' },
  { id: 'detalles',    label: 'Detalles y uso' },
  { id: 'resenas',     label: 'Reseñas' },
];

export default function Producto() {
  const { id } = useParams();
  const { agregar } = useCart();
  const { usuario } = useAuth();
  const [producto, setProducto] = useState(null);
  const [cargando, setCargando] = useState(true);
  const [cantidad, setCantidad] = useState(1);
  const [agregando, setAgregando] = useState(false);
  const [imagenActiva, setImagenActiva] = useState(0);
  const [tab, setTab] = useState('descripcion');
  const [puedeResenar, setPuedeResenar] = useState(null); // null=sin verificar, {puede, motivo}
  const [enviandoResena, setEnviandoResena] = useState(false);
  const [formResena, setFormResena] = useState({ calificacion: 5, titulo: '', contenido: '' });

  const [resenas, setResenas] = useState([]);

  useEffect(() => {
    setCargando(true);
    setImagenActiva(0);
    setTab('descripcion');
    setPuedeResenar(null);
    api.get(`/productos/${id}`)
      .then(r => {
        setProducto(r.data.producto);
        setResenas(r.data.resenas || []);
      })
      .finally(() => setCargando(false));

    if (usuario) {
      api.get(`/productos/${id}/puede-resenar`)
        .then(r => setPuedeResenar(r.data))
        .catch(() => setPuedeResenar({ puede: false }));
    }
  }, [id, usuario]);

  const enviarResena = async () => {
    if (!formResena.contenido.trim()) {
      Swal.fire({ icon: 'warning', title: 'Escribe un comentario', confirmButtonColor: '#052a1c' });
      return;
    }
    setEnviandoResena(true);
    try {
      await api.post(`/productos/${id}/resenas`, formResena);
      Swal.fire({ icon: 'success', title: '¡Gracias por tu reseña!', text: 'Se publicará cuando sea aprobada.', confirmButtonColor: '#052a1c' });
      setPuedeResenar({ puede: false, motivo: 'ya_reseno' });
      setFormResena({ calificacion: 5, titulo: '', contenido: '' });
    } catch (err) {
      Swal.fire({ icon: 'error', title: 'No se pudo enviar', text: err.response?.data?.mensaje || 'Intenta de nuevo', confirmButtonColor: '#052a1c' });
    } finally { setEnviandoResena(false); }
  };

  const handleAgregar = async () => {
    if (!usuario) {
      Swal.fire({ icon: 'info', title: 'Inicia sesión', text: 'Debes iniciar sesión para comprar.', confirmButtonColor: '#052a1c' });
      return;
    }
    setAgregando(true);
    try {
      await agregar(producto.id, cantidad);
      Swal.fire({ icon: 'success', title: '¡Agregado al carrito!', timer: 1500, showConfirmButton: false, toast: true, position: 'top-end' });
    } catch (err) {
      Swal.fire({ icon: 'error', title: 'Error', text: err.response?.data?.mensaje || 'No se pudo agregar', confirmButtonColor: '#052a1c' });
    } finally { setAgregando(false); }
  };

  if (cargando) return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="w-8 h-8 border-4 border-verde-200 border-t-verde-800 rounded-full animate-spin" />
    </div>
  );

  if (!producto) return (
    <div className="min-h-screen flex items-center justify-center text-center px-4">
      <div><p className="font-display text-xl text-gray-500 mb-4">Producto no encontrado</p>
        <Link to="/tienda" className="btn-primary">Ver tienda</Link></div>
    </div>
  );

  const agotado = producto.stock === 0;
  const pocasUnidades = !agotado && producto.stock <= 5;
  const precioFinal = producto.precio_descuento || producto.precio;
  const descuentoPct = producto.precio_descuento ? Math.round((1 - producto.precio_descuento / producto.precio) * 100) : 0;
  const galeria = [producto.imagen_principal, ...(Array.isArray(producto.imagenes) ? producto.imagenes : [])].filter(Boolean);

  return (
    <div className="min-h-screen bg-crema-50">
      <div className="max-w-6xl mx-auto px-6 py-8">
        <nav className="flex items-center gap-1.5 text-xs font-body text-gray-400 mb-6">
          <Link to="/" className="hover:text-verde-700">Inicio</Link>
          <ChevronRight size={12} />
          <Link to="/tienda" className="hover:text-verde-700">Tienda</Link>
          {producto.categoria && <><ChevronRight size={12} /><Link to={`/tienda?categoria=${producto.categoria_slug}`} className="hover:text-verde-700">{producto.categoria}</Link></>}
          <ChevronRight size={12} />
          <span className="text-verde-800 line-clamp-1">{producto.nombre}</span>
        </nav>

        <div className="grid lg:grid-cols-2 gap-12">
          {/* Galería */}
          <div>
            <div className="card overflow-hidden h-96 flex items-center justify-center relative mb-3 hover-gota">
              {descuentoPct > 0 && <span className="badge-sale absolute top-3 left-3 z-10">-{descuentoPct}%</span>}
              {galeria[imagenActiva]
                ? <img src={galeria[imagenActiva]} alt={producto.nombre} className="w-full h-full object-cover" />
                : <Leaf size={64} className="text-verde-200" />}
            </div>
            {galeria.length > 1 && (
              <div className="flex gap-2">
                {galeria.map((img, i) => (
                  <button key={i} onClick={() => setImagenActiva(i)}
                    className={`w-16 h-16 border overflow-hidden shrink-0 transition-colors ${i === imagenActiva ? 'border-dorado-500 border-2' : 'border-crema-300'}`}>
                    <img src={img} alt="" className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Info */}
          <div>
            <div className="flex flex-wrap items-center gap-2 mb-3">
              {producto.categoria && <span className="text-xs font-body text-dorado-600 font-semibold uppercase tracking-wide">{producto.categoria}</span>}
              {producto.certificacion_invima && <span className="badge-invima"><Shield size={10} /> INVIMA</span>}
              {producto.destacado && <span className="badge-bestseller"><Award size={10} /> Más vendido</span>}
            </div>
            <h1 className="font-display text-3xl font-bold text-verde-900 mb-2 leading-tight">{producto.nombre}</h1>
            {producto.presentacion && <p className="text-gray-400 font-body text-sm mb-4">Presentación: {producto.presentacion}</p>}

            {producto.calificacion_promedio > 0 && (
              <div className="flex items-center gap-2 mb-5">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} size={16} className={i < Math.round(producto.calificacion_promedio) ? 'text-dorado-500 fill-dorado-500' : 'text-gray-200 fill-gray-200'} />
                ))}
                <span className="text-sm text-gray-500 font-body">{Number(producto.calificacion_promedio).toFixed(1)} ({producto.total_resenas} reseñas)</span>
              </div>
            )}

            {/* Precio */}
            <div className="flex items-end gap-3 mb-1 pb-5 border-b border-crema-300">
              <span className="font-display text-4xl font-bold text-verde-900">${Number(precioFinal).toLocaleString('es-CO')}</span>
              {producto.precio_descuento && (
                <span className="text-gray-400 line-through font-body text-xl mb-1">${Number(producto.precio).toLocaleString('es-CO')}</span>
              )}
              <span className="text-gray-400 font-body text-sm mb-1.5">COP</span>
            </div>

            {/* Stock */}
            <div className={`flex items-center gap-2 mt-4 mb-5 text-sm font-body font-semibold ${agotado ? 'text-red-500' : pocasUnidades ? 'text-dorado-600' : 'text-verde-700'}`}>
              {agotado ? <AlertCircle size={15} /> : <Package size={15} />}
              {agotado ? 'Producto agotado' : pocasUnidades ? `¡Solo quedan ${producto.stock} unidades!` : `${producto.stock} unidades disponibles`}
            </div>

            {/* Cantidad y botón */}
            {!agotado && (
              <div className="flex items-center gap-4 mb-6">
                <div className="flex items-center border border-crema-300">
                  <button onClick={() => setCantidad(q => Math.max(1, q - 1))} className="w-11 h-12 hover:bg-crema-100 transition-colors flex items-center justify-center font-bold text-lg text-verde-900">−</button>
                  <span className="w-12 text-center font-body font-semibold text-verde-900">{cantidad}</span>
                  <button onClick={() => setCantidad(q => Math.min(producto.stock, q + 1))} className="w-11 h-12 hover:bg-crema-100 transition-colors flex items-center justify-center font-bold text-lg text-verde-900">+</button>
                </div>
                <button onClick={handleAgregar} disabled={agregando}
                  className="btn-primary flex-1 py-3.5 disabled:opacity-60">
                  <ShoppingCart size={18} />
                  {agregando ? 'Agregando...' : 'Agregar al carrito'}
                </button>
              </div>
            )}

            {/* Trust bar */}
            <div className="grid grid-cols-3 gap-3 mb-2">
              {[
                { icon: Truck, label: 'Envío a toda Colombia' },
                { icon: Shield, label: 'Certificado INVIMA' },
                { icon: RotateCcw, label: 'Cambios en 5 días' },
              ].map(({ icon: Icon, label }) => (
                <div key={label} className="flex flex-col items-center text-center gap-1.5 p-3 bg-crema-100 border border-crema-200">
                  <Icon size={17} className="text-verde-700" />
                  <span className="text-[11px] font-body text-verde-800 leading-tight">{label}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="mt-14">
          <div className="flex gap-8 border-b border-crema-300">
            {TABS.map(t => (
              <button key={t.id} onClick={() => setTab(t.id)}
                className={`font-display font-bold text-sm pb-3 border-b-2 transition-colors ${tab === t.id ? 'border-dorado-500 text-verde-900' : 'border-transparent text-gray-400 hover:text-verde-700'}`}>
                {t.label}
              </button>
            ))}
          </div>

          <div className="py-8 max-w-3xl">
            {tab === 'descripcion' && (
              <p className="text-gray-600 font-body leading-relaxed">
                {producto.descripcion || 'Este producto aún no tiene una descripción detallada.'}
              </p>
            )}

            {tab === 'detalles' && (
              <div className="space-y-4">
                {producto.principio_activo && (
                  <div className="bg-verde-50 border border-verde-100 p-4">
                    <p className="text-xs font-body font-bold text-verde-800 uppercase tracking-wide mb-1">Principio activo</p>
                    <p className="text-verde-900 font-body text-sm">{producto.principio_activo}</p>
                  </div>
                )}
                {producto.indicaciones && (
                  <div className="bg-dorado-50 border border-dorado-100 p-4">
                    <p className="text-xs font-body font-bold text-dorado-700 uppercase tracking-wide mb-1">Indicaciones</p>
                    <p className="text-gray-700 font-body text-sm">{producto.indicaciones}</p>
                  </div>
                )}
                {producto.contraindicaciones && (
                  <div className="bg-red-50 border border-red-100 p-4">
                    <p className="text-xs font-body font-bold text-red-600 uppercase tracking-wide mb-1">Contraindicaciones</p>
                    <p className="text-red-700 font-body text-sm">{producto.contraindicaciones}</p>
                  </div>
                )}
                {!producto.principio_activo && !producto.indicaciones && !producto.contraindicaciones && (
                  <p className="text-gray-400 font-body text-sm">No hay información adicional para este producto.</p>
                )}
              </div>
            )}

            {tab === 'resenas' && (
              <div>
                {producto.total_resenas > 0 ? (
                  <div className="flex items-center gap-4 mb-6">
                    <span className="font-display text-4xl font-bold text-verde-900">{Number(producto.calificacion_promedio).toFixed(1)}</span>
                    <div>
                      <div className="flex gap-0.5 mb-1">
                        {[...Array(5)].map((_, i) => (
                          <Star key={i} size={16} className={i < Math.round(producto.calificacion_promedio) ? 'text-dorado-500 fill-dorado-500' : 'text-gray-200 fill-gray-200'} />
                        ))}
                      </div>
                      <p className="text-sm font-body text-gray-500">Basado en {producto.total_resenas} reseñas</p>
                    </div>
                  </div>
                ) : (
                  <p className="text-gray-400 font-body text-sm mb-6">Este producto todavía no tiene reseñas.</p>
                )}

                {/* Formulario para dejar reseña */}
                {usuario && puedeResenar?.puede && (
                  <div className="bg-verde-50 border border-verde-100 p-5 mb-6">
                    <p className="font-display font-bold text-verde-900 mb-3">Cuéntanos qué te pareció</p>
                    <div className="flex gap-1 mb-3">
                      {[1, 2, 3, 4, 5].map(n => (
                        <button key={n} onClick={() => setFormResena(f => ({ ...f, calificacion: n }))}>
                          <Star size={22} className={n <= formResena.calificacion ? 'text-dorado-500 fill-dorado-500' : 'text-gray-300 fill-gray-100'} />
                        </button>
                      ))}
                    </div>
                    <input value={formResena.titulo} onChange={e => setFormResena(f => ({ ...f, titulo: e.target.value }))}
                      placeholder="Título (opcional)" className="input-field mb-2" />
                    <textarea value={formResena.contenido} onChange={e => setFormResena(f => ({ ...f, contenido: e.target.value }))}
                      placeholder="Cuéntanos tu experiencia con este producto..." className="input-field mb-3" rows={3} />
                    <button onClick={enviarResena} disabled={enviandoResena} className="btn-primary text-sm">
                      {enviandoResena ? 'Enviando...' : 'Enviar reseña'}
                    </button>
                  </div>
                )}
                {usuario && puedeResenar?.motivo === 'ya_reseno' && (
                  <p className="text-sm font-body text-verde-600 mb-6 flex items-center gap-1.5">✓ Ya dejaste tu reseña de este producto.</p>
                )}
                {usuario && puedeResenar?.motivo === 'no_comprado' && (
                  <p className="text-sm font-body text-gray-400 mb-6">Solo quienes ya recibieron este producto pueden dejar una reseña.</p>
                )}

                {/* Lista de reseñas */}
                <div className="space-y-4">
                  {resenas.map((r, i) => (
                    <div key={i} className="border-t border-crema-200 pt-4">
                      <div className="flex items-center gap-2 mb-1">
                        <div className="flex gap-0.5">
                          {[...Array(5)].map((_, s) => (
                            <Star key={s} size={12} className={s < r.calificacion ? 'text-dorado-500 fill-dorado-500' : 'text-gray-200 fill-gray-200'} />
                          ))}
                        </div>
                        <span className="text-xs font-body text-gray-400">· {r.autor}</span>
                      </div>
                      {r.titulo && <p className="font-body font-semibold text-verde-900 text-sm">{r.titulo}</p>}
                      {r.contenido && <p className="font-body text-gray-600 text-sm mt-0.5">{r.contenido}</p>}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        <Link to="/tienda" className="inline-flex items-center gap-2 text-verde-700 hover:text-verde-900 font-body text-sm mt-4">
          <ArrowLeft size={16} /> Volver a la tienda
        </Link>
      </div>
    </div>
  );
}
