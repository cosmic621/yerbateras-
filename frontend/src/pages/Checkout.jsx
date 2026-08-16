import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ShieldCheck, ArrowLeft, Leaf, Loader, Tag, X, Check } from 'lucide-react';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import Swal from 'sweetalert2';

const WOMPI_WIDGET_SRC = 'https://checkout.wompi.co/widget.js';

const cargarWompiScript = () => new Promise((resolve, reject) => {
  if (window.WidgetCheckout) return resolve();
  const existente = document.querySelector(`script[src="${WOMPI_WIDGET_SRC}"]`);
  if (existente) { existente.addEventListener('load', () => resolve()); return; }
  const script = document.createElement('script');
  script.src = WOMPI_WIDGET_SRC;
  script.onload = () => resolve();
  script.onerror = () => reject(new Error('No se pudo cargar el widget de pagos'));
  document.head.appendChild(script);
});

function CampoCupon({ subtotal, onAplicado, aplicado }) {
  const [codigo, setCodigo] = useState('');
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState('');

  const aplicar = async () => {
    if (!codigo.trim()) return;
    setCargando(true);
    setError('');
    try {
      const { data } = await api.post('/pagos/validar-cupon', { codigo: codigo.trim(), subtotal });
      onAplicado({ codigo: data.codigo, descuento: data.descuento });
    } catch (err) {
      setError(err.response?.data?.mensaje || 'Cupón no válido');
    } finally { setCargando(false); }
  };

  if (aplicado) {
    return (
      <div className="flex items-center justify-between bg-verde-50 border border-verde-100 px-3 py-2 text-sm font-body">
        <span className="flex items-center gap-2 text-verde-700"><Check size={14} /> Cupón "{aplicado.codigo}" aplicado</span>
        <button onClick={() => onAplicado(null)} className="text-gray-400 hover:text-red-500"><X size={14} /></button>
      </div>
    );
  }

  return (
    <div>
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Tag size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input value={codigo} onChange={e => setCodigo(e.target.value.toUpperCase())}
            placeholder="Código de descuento" className="input-field pl-9 text-sm" />
        </div>
        <button onClick={aplicar} disabled={cargando || !codigo.trim()} className="btn-outline text-sm px-4">
          {cargando ? '...' : 'Aplicar'}
        </button>
      </div>
      {error && <p className="text-xs text-red-500 font-body mt-1">{error}</p>}
    </div>
  );
}

function BotonPagoWompi({ pagoData, usuario, onExito, onPendiente, onError }) {
  const [procesando, setProcesando] = useState(false);
  const [scriptListo, setScriptListo] = useState(false);

  useEffect(() => {
    cargarWompiScript().then(() => setScriptListo(true)).catch(() => onError('No se pudo cargar la pasarela de pagos. Verifica tu conexión.'));
  }, []);

  const pagar = () => {
    if (!scriptListo || !window.WidgetCheckout) return;
    setProcesando(true);

    const checkout = new window.WidgetCheckout({
      currency: pagoData.currency,
      amountInCents: pagoData.amountInCents,
      reference: pagoData.reference,
      publicKey: pagoData.publicKey,
      signature: { integrity: pagoData.signature },
      customerData: {
        email: usuario?.email,
        fullName: usuario?.nombre,
        phoneNumber: usuario?.telefono,
        phoneNumberPrefix: '+57',
      },
    });

    checkout.open((result) => {
      setProcesando(false);
      const tx = result?.transaction;
      if (!tx) { onError('No se recibió respuesta de la pasarela de pagos.'); return; }
      if (tx.status === 'APPROVED') onExito();
      else if (tx.status === 'PENDING') onPendiente();
      else onError('El pago no fue aprobado. Puedes intentar de nuevo con otro medio de pago.');
    });
  };

  return (
    <div className="space-y-4">
      <button onClick={pagar} disabled={!scriptListo || procesando}
        className="btn-primary w-full flex items-center justify-center gap-2 py-4 text-base disabled:opacity-60">
        {!scriptListo ? <Loader size={18} className="animate-spin" /> : <ShieldCheck size={18} />}
        {!scriptListo ? 'Cargando pasarela de pagos...' : procesando ? 'Procesando...' : `Pagar $${(pagoData.amountInCents / 100).toLocaleString('es-CO')} COP`}
      </button>
      <div className="flex items-center justify-center gap-3 flex-wrap">
        {['Nequi', 'PSE', 'Tarjeta débito/crédito', 'Bancolombia'].map(m => (
          <span key={m} className="text-[11px] font-body text-gray-400 border border-crema-300 px-2 py-1">{m}</span>
        ))}
      </div>
      <p className="text-center text-xs text-gray-400 font-body flex items-center justify-center gap-1">
        <ShieldCheck size={12} /> Pago seguro con cifrado SSL · Wompi
      </p>
    </div>
  );
}

export default function Checkout() {
  const { items, total, limpiar } = useCart();
  const { usuario } = useAuth();
  const navigate = useNavigate();
  const [pagoData, setPagoData] = useState(null);
  const [pedidoInfo, setPedidoInfo] = useState(null);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState('');
  const [direccion, setDireccion] = useState({ ciudad: '', direccion: '', departamento: '' });
  const [cupon, setCupon] = useState(null);
  const [paso, setPaso] = useState(1);

  const costoEnvio = total >= 150000 ? 0 : 10000;
  const descuento = cupon?.descuento || 0;
  const totalFinal = Math.max(total + costoEnvio - descuento, 0);

  useEffect(() => {
    if (!items.length) { navigate('/tienda'); return; }
    setCargando(false);
  }, [items]);

  const crearPedido = async () => {
    if (!direccion.ciudad || !direccion.direccion) {
      Swal.fire({ icon: 'warning', title: 'Completa la dirección', text: 'Ingresa tu ciudad y dirección de entrega.', confirmButtonColor: '#052a1c' });
      return;
    }
    setCargando(true);
    try {
      const { data } = await api.post('/pagos/crear-pedido', {
        notas_cliente: `${direccion.ciudad}, ${direccion.departamento} - ${direccion.direccion}`,
        codigo_cupon: cupon?.codigo || undefined,
      });
      setPagoData(data);
      setPedidoInfo({ id: data.pedido_id, numero: data.numero_pedido, total: data.total });
      setPaso(2);
    } catch (err) {
      Swal.fire({ icon: 'error', title: 'Error', text: err.response?.data?.mensaje || 'No se pudo iniciar el pago', confirmButtonColor: '#052a1c' });
    } finally { setCargando(false); }
  };

  const onExito = async () => {
    await limpiar();
    navigate('/checkout/exito', { state: { numeroPedido: pedidoInfo?.numero } });
  };

  const onPendiente = () => setPaso(3);
  const onError = (msg) => setError(msg);

  if (cargando) return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <div className="w-10 h-10 border-4 border-verde-200 border-t-verde-600 rounded-full animate-spin mx-auto mb-3" />
        <p className="text-verde-600 font-body">Preparando tu orden...</p>
      </div>
    </div>
  );

  if (paso === 3) return (
    <div className="min-h-screen flex items-center justify-center bg-crema-50 px-4">
      <div className="bg-white border border-crema-300 p-8 max-w-md text-center">
        <Loader size={36} className="text-dorado-500 animate-spin mx-auto mb-4" />
        <h2 className="font-display text-xl font-bold text-verde-900 mb-2">Tu pago está en proceso</h2>
        <p className="text-gray-500 font-body text-sm mb-4">
          Algunos medios de pago como PSE o Nequi pueden tardar unos minutos en confirmarse. Te enviaremos un correo apenas se confirme, y también puedes revisarlo en "Mis pedidos".
        </p>
        <button onClick={() => navigate('/mis-pedidos')} className="btn-primary w-full">Ver mis pedidos</button>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-5xl mx-auto px-6 py-10">
        <button onClick={() => paso === 2 ? setPaso(1) : navigate('/tienda')}
          className="flex items-center gap-2 text-verde-600 hover:text-verde-700 font-body text-sm mb-6">
          <ArrowLeft size={16} /> {paso === 2 ? 'Volver a dirección' : 'Seguir comprando'}
        </button>

        <h1 className="font-display text-3xl font-bold text-verde-800 mb-8">
          {paso === 1 ? 'Datos de entrega' : 'Pago seguro'}
        </h1>

        <div className="grid lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2">
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8">
              <div className="flex items-center gap-3 mb-8">
                {['Dirección', 'Pago'].map((label, i) => (
                  <div key={label} className="flex items-center gap-2">
                    <div className={`w-7 h-7 rounded-full flex items-center justify-center text-sm font-bold font-body ${paso > i ? 'bg-verde-600 text-white' : paso === i + 1 ? 'bg-verde-600 text-white' : 'bg-gray-200 text-gray-500'}`}>
                      {i + 1}
                    </div>
                    <span className={`font-body text-sm ${paso === i + 1 ? 'text-verde-700 font-semibold' : 'text-gray-400'}`}>{label}</span>
                    {i < 1 && <div className="w-8 h-px bg-gray-200 mx-1" />}
                  </div>
                ))}
              </div>

              {paso === 1 && (
                <div className="space-y-4">
                  <div className="grid sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-body font-semibold text-gray-700 mb-1.5">Departamento *</label>
                      <input value={direccion.departamento} onChange={e => setDireccion(d => ({ ...d, departamento: e.target.value }))}
                        placeholder="Cundinamarca" className="input-field" />
                    </div>
                    <div>
                      <label className="block text-sm font-body font-semibold text-gray-700 mb-1.5">Ciudad *</label>
                      <input value={direccion.ciudad} onChange={e => setDireccion(d => ({ ...d, ciudad: e.target.value }))}
                        placeholder="Bogotá" className="input-field" />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-body font-semibold text-gray-700 mb-1.5">Dirección completa *</label>
                    <input value={direccion.direccion} onChange={e => setDireccion(d => ({ ...d, direccion: e.target.value }))}
                      placeholder="Calle 123 # 45-67, Apto 8" className="input-field" />
                  </div>

                  <div>
                    <label className="block text-sm font-body font-semibold text-gray-700 mb-1.5">¿Tienes un cupón?</label>
                    <CampoCupon subtotal={total} aplicado={cupon} onAplicado={setCupon} />
                  </div>

                  <button onClick={crearPedido} disabled={cargando} className="btn-primary w-full py-4 text-base mt-4">
                    {cargando ? 'Procesando...' : 'Continuar al pago'}
                  </button>
                </div>
              )}

              {paso === 2 && pagoData && (
                <div className="space-y-5">
                  <BotonPagoWompi pagoData={pagoData} usuario={usuario} onExito={onExito} onPendiente={onPendiente} onError={onError} />
                  {error && (
                    <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg px-4 py-3 text-sm font-body">
                      {error}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          <div className="lg:col-span-1">
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 sticky top-24">
              <h3 className="font-display text-lg font-bold text-verde-800 mb-4">Tu pedido</h3>
              <div className="space-y-3 mb-4">
                {items.map(item => (
                  <div key={item.id} className="flex gap-3">
                    <div className="w-12 h-12 rounded-lg bg-verde-50 flex items-center justify-center overflow-hidden shrink-0">
                      {item.imagen_principal
                        ? <img src={item.imagen_principal} alt={item.nombre} className="w-full h-full object-cover" />
                        : <Leaf size={18} className="text-verde-300" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-body text-sm text-gray-800 line-clamp-1">{item.nombre}</p>
                      <p className="text-xs text-gray-500 font-body">x{item.cantidad}</p>
                    </div>
                    <span className="text-sm font-body font-semibold text-gray-700">
                      ${(item.cantidad * Number(item.precio_unitario)).toLocaleString('es-CO')}
                    </span>
                  </div>
                ))}
              </div>
              <div className="border-t border-gray-100 pt-4 space-y-2">
                <div className="flex justify-between text-sm font-body text-gray-600">
                  <span>Subtotal</span><span>${total.toLocaleString('es-CO')}</span>
                </div>
                {descuento > 0 && (
                  <div className="flex justify-between text-sm font-body text-verde-600">
                    <span>Descuento {cupon?.codigo && `(${cupon.codigo})`}</span><span>-${descuento.toLocaleString('es-CO')}</span>
                  </div>
                )}
                <div className="flex justify-between text-sm font-body text-gray-600">
                  <span>Envío</span>
                  <span className={costoEnvio === 0 ? 'text-verde-600 font-semibold' : ''}>
                    {costoEnvio === 0 ? 'Gratis 🎉' : `$${costoEnvio.toLocaleString('es-CO')}`}
                  </span>
                </div>
                <div className="flex justify-between font-display text-base font-bold text-verde-800 pt-2 border-t">
                  <span>Total</span><span>${totalFinal.toLocaleString('es-CO')} COP</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
