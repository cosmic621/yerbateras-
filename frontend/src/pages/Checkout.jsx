import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { loadStripe } from '@stripe/stripe-js';
import { Elements, PaymentElement, useStripe, useElements } from '@stripe/react-stripe-js';
import { ShieldCheck, ArrowLeft, Leaf } from 'lucide-react';
import { useCart } from '../context/CartContext';
import api from '../services/api';
import Swal from 'sweetalert2';

const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLIC_KEY);

function PagoForm({ clientSecret, pedidoId, numeroPedido, total, onExito }) {
  const stripe = useStripe();
  const elements = useElements();
  const [procesando, setProcesando] = useState(false);
  const [error, setError] = useState('');

  const pagar = async (e) => {
    e.preventDefault();
    if (!stripe || !elements) return;
    setProcesando(true);
    setError('');
    try {
      const { error: stripeErr, paymentIntent } = await stripe.confirmPayment({
        elements,
        redirect: 'if_required',
      });
      if (stripeErr) {
        setError(stripeErr.message || 'Error al procesar el pago');
      } else if (paymentIntent?.status === 'succeeded') {
        onExito(numeroPedido);
      }
    } catch {
      setError('Ocurrió un error inesperado. Intenta de nuevo.');
    } finally { setProcesando(false); }
  };

  return (
    <form onSubmit={pagar} className="space-y-5">
      <PaymentElement options={{ layout: 'tabs' }} />
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg px-4 py-3 text-sm font-body">
          {error}
        </div>
      )}
      <button type="submit" disabled={!stripe || procesando}
        className="btn-primary w-full flex items-center justify-center gap-2 py-4 text-base disabled:opacity-60">
        <ShieldCheck size={18} />
        {procesando ? 'Procesando pago...' : `Pagar $${total.toLocaleString('es-CO')} COP`}
      </button>
      <p className="text-center text-xs text-gray-400 font-body flex items-center justify-center gap-1">
        <ShieldCheck size={12} /> Pago seguro con cifrado SSL · Stripe
      </p>
    </form>
  );
}

export default function Checkout() {
  const { items, total, limpiar } = useCart();
  const navigate = useNavigate();
  const [clientSecret, setClientSecret] = useState('');
  const [pedidoInfo, setPedidoInfo] = useState(null);
  const [cargando, setCargando] = useState(true);
  const [direccion, setDireccion] = useState({ ciudad: '', direccion: '', departamento: '' });
  const [paso, setPaso] = useState(1); // 1: dirección, 2: pago

  const costoEnvio = total >= 150000 ? 0 : 10000;
  const totalFinal = total + costoEnvio;

  useEffect(() => {
    if (!items.length) { navigate('/tienda'); return; }
    setCargando(false);
  }, [items]);

  const crearIntent = async () => {
    if (!direccion.ciudad || !direccion.direccion) {
      Swal.fire({ icon: 'warning', title: 'Completa la dirección', text: 'Ingresa tu ciudad y dirección de entrega.', confirmButtonColor: '#1a4a2e' });
      return;
    }
    setCargando(true);
    try {
      const { data } = await api.post('/pagos/create-intent', { notas_cliente: `${direccion.ciudad}, ${direccion.departamento} - ${direccion.direccion}` });
      setClientSecret(data.client_secret);
      setPedidoInfo({ id: data.pedido_id, numero: data.numero_pedido, total: data.total });
      setPaso(2);
    } catch (err) {
      Swal.fire({ icon: 'error', title: 'Error', text: err.response?.data?.mensaje || 'No se pudo iniciar el pago', confirmButtonColor: '#1a4a2e' });
    } finally { setCargando(false); }
  };

  const onExito = async (numeroPedido) => {
    await limpiar();
    navigate('/checkout/exito', { state: { numeroPedido } });
  };

  if (cargando) return (
    <div className="min-h-screen flex items-center justify-center pt-16">
      <div className="text-center">
        <div className="w-10 h-10 border-4 border-verde-200 border-t-verde-600 rounded-full animate-spin mx-auto mb-3" />
        <p className="text-verde-600 font-body">Preparando tu orden...</p>
      </div>
    </div>
  );

  return (
    <div className="pt-16 min-h-screen bg-gray-50">
      <div className="max-w-5xl mx-auto px-6 py-10">
        <button onClick={() => paso === 2 ? setPaso(1) : navigate('/tienda')}
          className="flex items-center gap-2 text-verde-600 hover:text-verde-700 font-body text-sm mb-6">
          <ArrowLeft size={16} /> {paso === 2 ? 'Volver a dirección' : 'Seguir comprando'}
        </button>

        <h1 className="font-display text-3xl font-bold text-verde-800 mb-8">
          {paso === 1 ? 'Datos de entrega' : 'Pago seguro'}
        </h1>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Formulario */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8">
              {/* Indicador de pasos */}
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
                  <button onClick={crearIntent} disabled={cargando} className="btn-primary w-full py-4 text-base mt-4">
                    {cargando ? 'Procesando...' : 'Continuar al pago'}
                  </button>
                </div>
              )}

              {paso === 2 && clientSecret && (
                <Elements stripe={stripePromise} options={{ clientSecret, appearance: { theme: 'stripe', variables: { colorPrimary: '#1a4a2e', fontFamily: 'Georgia, serif' } } }}>
                  <PagoForm clientSecret={clientSecret} pedidoId={pedidoInfo?.id}
                    numeroPedido={pedidoInfo?.numero} total={pedidoInfo?.total || totalFinal} onExito={onExito} />
                </Elements>
              )}
            </div>
          </div>

          {/* Resumen */}
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
