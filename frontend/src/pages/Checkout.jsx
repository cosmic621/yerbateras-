import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { ShieldCheck, Leaf, Tag, X, Check } from 'lucide-react';
import { useCart } from '../context/CartContext';
import api from '../services/api';
import { cargarWompiScript, abrirCheckoutWompi, cop } from '../utils/wompi';
import BandaTitulo from '../components/ui/BandaTitulo';

const DEPARTAMENTOS = ['Amazonas','Antioquia','Arauca','Atlántico','Bogotá D.C.','Bolívar','Boyacá','Caldas','Caquetá','Casanare','Cauca','Cesar','Chocó','Córdoba','Cundinamarca','Guainía','Guaviare','Huila','La Guajira','Magdalena','Meta','Nariño','Norte de Santander','Putumayo','Quindío','Risaralda','San Andrés y Providencia','Santander','Sucre','Tolima','Valle del Cauca','Vaupés','Vichada'];
const ENVIO_GRATIS = 150000;
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const Campo = ({ label, error, children }) => (
  <label className="block">
    <span className="block text-lg text-verde-800 mb-1">{label}</span>
    {children}
    {error && <span className="block text-base text-red-600 mt-1">{error}</span>}
  </label>
);
const inp = 'w-full px-4 py-3 border border-crema-300 bg-white text-lg text-verde-900 outline-none focus:border-dorado-500';

export default function Checkout() {
  const { items, total, notas, setNotas, limpiar, refrescar } = useCart();
  const navigate = useNavigate();
  const [f, setF] = useState({ nombre: '', email: '', telefono: '', direccion: '', ciudad: '', departamento: '' });
  const [errores, setErrores] = useState({});
  const [cupon, setCupon] = useState('');
  const [cuponOk, setCuponOk] = useState(null);       // { codigo, descuento }
  const [cuponMsg, setCuponMsg] = useState('');
  const [suscribir, setSuscribir] = useState(false);
  const [enviando, setEnviando] = useState(false);
  const [error, setError] = useState('');
  const [scriptListo, setScriptListo] = useState(false);

  useEffect(() => { cargarWompiScript().then(() => setScriptListo(true)).catch(() => {}); refrescar(); // eslint-disable-next-line
  }, []);

  const set = (k, v) => { setF(x => ({ ...x, [k]: v })); setErrores(e => ({ ...e, [k]: '' })); setError(''); };
  const envio = total >= ENVIO_GRATIS ? 0 : 10000;
  const descuento = cuponOk?.descuento || 0;
  const totalFinal = Math.max(total + envio - descuento, 0);

  const aplicarCupon = async () => {
    if (!cupon.trim()) return;
    setCuponMsg('');
    try {
      const { data } = await api.post('/pagos/validar-cupon', { codigo: cupon.trim(), subtotal: total });
      setCuponOk({ codigo: data.codigo, descuento: data.descuento });
    } catch (err) { setCuponMsg(err.response?.data?.mensaje || 'Cupón no válido'); }
  };

  const validar = () => {
    const e = {};
    if (f.nombre.trim().length < 2) e.nombre = 'Escribe tu nombre completo';
    if (!EMAIL_RE.test(f.email)) e.email = 'Escribe un correo válido (ahí te enviamos la confirmación)';
    if (!/^\+?[0-9]{7,15}$/.test(f.telefono.replace(/\s/g, ''))) e.telefono = 'Escribe un celular válido';
    if (f.direccion.trim().length < 5) e.direccion = 'Escribe tu dirección';
    if (!f.ciudad.trim()) e.ciudad = 'Escribe tu ciudad';
    if (!f.departamento) e.departamento = 'Elige tu departamento';
    setErrores(e);
    return Object.keys(e).length === 0;
  };

  const pagar = async (ev) => {
    ev.preventDefault();
    if (!validar() || enviando) return;
    setEnviando(true); setError('');
    try {
      const { data } = await api.post('/pagos/crear-pedido', {
        items: items.map(i => ({ producto_id: i.producto_id, cantidad: i.cantidad })),
        cliente: { nombre: f.nombre, email: f.email, telefono: f.telefono },
        envio: { direccion: f.direccion, ciudad: f.ciudad, departamento: f.departamento },
        notas_cliente: notas || undefined,
        codigo_cupon: cuponOk?.codigo,
        suscribir_newsletter: suscribir,
      });
      if (!scriptListo || !window.WidgetCheckout) throw new Error('La pasarela de pagos no cargó. Recarga la página.');
      abrirCheckoutWompi(data, f, (tx) => {
        setEnviando(false);
        if (!tx) return;
        if (tx.status === 'APPROVED' || tx.status === 'PENDING') {
          limpiar();
          navigate('/checkout/exito', { state: { numeroPedido: data.numero_pedido, email: f.email.trim().toLowerCase(), pendiente: tx.status === 'PENDING' } });
        } else {
          setError('El pago no fue aprobado. Puedes intentarlo de nuevo.');
        }
      });
    } catch (err) {
      setEnviando(false);
      setError(err.response?.data?.mensaje || err.message || 'No se pudo procesar el pedido');
      refrescar();
    }
  };

  if (!items.length) {
    return (
      <>
        <BandaTitulo>Finalizar compra</BandaTitulo>
        <div className="text-center py-20 px-6">
          <Leaf size={36} className="text-verde-200 mx-auto mb-3" />
          <p className="text-2xl text-verde-800 mb-5">Tu bolsa está vacía</p>
          <Link to="/tienda" className="btn-primary">Ver la tienda</Link>
        </div>
      </>
    );
  }

  return (
    <>
      <BandaTitulo>Finalizar compra</BandaTitulo>
      <form onSubmit={pagar} noValidate className="max-w-5xl mx-auto px-6 py-12 grid md:grid-cols-5 gap-12">
        <div className="md:col-span-3 space-y-10">
          <section className="space-y-4">
            <h2 className="text-2xl text-verde-900">Tus datos</h2>
            <Campo label="Nombre completo" error={errores.nombre}><input className={inp} value={f.nombre} onChange={e => set('nombre', e.target.value)} autoComplete="name" /></Campo>
            <Campo label="Correo" error={errores.email}><input type="email" className={inp} value={f.email} onChange={e => set('email', e.target.value)} autoComplete="email" /></Campo>
            <Campo label="Celular" error={errores.telefono}><input type="tel" className={inp} value={f.telefono} onChange={e => set('telefono', e.target.value)} autoComplete="tel" /></Campo>
            <label className="flex items-start gap-3 text-lg text-verde-700 cursor-pointer">
              <input type="checkbox" checked={suscribir} onChange={e => setSuscribir(e.target.checked)} className="mt-1.5 w-4 h-4 accent-verde-900" />
              Quiero recibir novedades y saberes de Yerbateras por correo (opcional).
            </label>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl text-verde-900">Envío</h2>
            <Campo label="Dirección" error={errores.direccion}><input className={inp} value={f.direccion} onChange={e => set('direccion', e.target.value)} autoComplete="street-address" /></Campo>
            <div className="grid sm:grid-cols-2 gap-4">
              <Campo label="Ciudad" error={errores.ciudad}><input className={inp} value={f.ciudad} onChange={e => set('ciudad', e.target.value)} autoComplete="address-level2" /></Campo>
              <Campo label="Departamento" error={errores.departamento}>
                <select className={inp} value={f.departamento} onChange={e => set('departamento', e.target.value)}>
                  <option value="">Elige…</option>
                  {DEPARTAMENTOS.map(d => <option key={d} value={d}>{d}</option>)}
                </select>
              </Campo>
            </div>
            <Campo label="Nota para tu pedido (opcional)">
              <textarea rows={2} maxLength={120} className={inp} value={notas} onChange={e => setNotas(e.target.value)} placeholder="¿Es un regalo? Escribe aquí tu mensaje." />
            </Campo>
          </section>
        </div>

        <aside className="md:col-span-2">
          <div className="border border-crema-300 bg-white p-6 md:sticky md:top-28">
            <h2 className="text-2xl text-verde-900 mb-4">Tu pedido</h2>
            <ul className="space-y-3 mb-5">
              {items.map(i => (
                <li key={i.producto_id} className="flex justify-between gap-3 text-lg text-verde-800">
                  <span>{i.nombre} <span className="text-verde-500">× {i.cantidad}</span></span>
                  <span className="shrink-0">{cop(i.precio * i.cantidad)}</span>
                </li>
              ))}
            </ul>

            {cuponOk ? (
              <div className="flex items-center justify-between text-lg text-verde-700 mb-4">
                <span className="flex items-center gap-2"><Check size={16} /> Cupón {cuponOk.codigo}</span>
                <button type="button" onClick={() => { setCuponOk(null); setCupon(''); }} aria-label="Quitar cupón"><X size={16} /></button>
              </div>
            ) : (
              <div className="mb-4">
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <Tag size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-verde-400" />
                    <input value={cupon} onChange={e => setCupon(e.target.value.toUpperCase())} placeholder="Código de descuento" className={`${inp} !pl-9 !py-2`} />
                  </div>
                  <button type="button" onClick={aplicarCupon} className="btn-outline !py-2">Aplicar</button>
                </div>
                {cuponMsg && <p className="text-base text-red-600 mt-1">{cuponMsg}</p>}
              </div>
            )}

            <div className="border-t border-crema-200 pt-4 space-y-1 text-lg text-verde-800">
              <div className="flex justify-between"><span>Subtotal</span><span>{cop(total)}</span></div>
              {descuento > 0 && <div className="flex justify-between text-verde-600"><span>Descuento</span><span>− {cop(descuento)}</span></div>}
              <div className="flex justify-between"><span>Envío</span><span>{envio === 0 ? 'Gratis' : cop(envio)}</span></div>
              <div className="flex justify-between text-2xl text-verde-900 pt-2"><span>Total</span><span>{cop(totalFinal)}</span></div>
            </div>

            {error && <div className="bg-red-50 border border-red-200 text-red-700 text-lg p-3 mt-4">{error}</div>}
            <button type="submit" disabled={enviando} className="btn-primary w-full mt-5 disabled:opacity-60">
              <ShieldCheck size={17} /> {enviando ? 'Procesando…' : `Pagar ${cop(totalFinal)}`}
            </button>
            <p className="text-base text-verde-600 text-center mt-3">Pago en línea con tarjeta, PSE o Nequi (Wompi). No hay contraentrega.</p>
          </div>
        </aside>
      </form>
    </>
  );
}
