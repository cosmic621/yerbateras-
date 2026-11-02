import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import api from '../services/api';
import { cop } from '../utils/wompi';
import BandaTitulo from '../components/ui/BandaTitulo';

const PASOS = [['pagado', 'Pago recibido'], ['preparando', 'Preparando'], ['enviado', 'Enviado'], ['entregado', 'Entregado']];
const inp = 'w-full px-4 py-3 border border-crema-300 bg-white text-lg text-verde-900 outline-none focus:border-dorado-500';

export default function Seguimiento() {
  const [params] = useSearchParams();
  const [numero, setNumero] = useState(params.get('numero') || '');
  const [email, setEmail] = useState(params.get('email') || '');
  const [pedido, setPedido] = useState(null);
  const [error, setError] = useState('');
  const [cargando, setCargando] = useState(false);

  const buscar = async (e) => {
    e?.preventDefault();
    setCargando(true); setError(''); setPedido(null);
    try {
      const { data } = await api.get('/pedidos/seguimiento', { params: { numero: numero.trim(), email: email.trim() } });
      setPedido(data.pedido);
    } catch (err) {
      setError(err.response?.data?.mensaje || 'No pudimos consultar tu pedido');
    } finally { setCargando(false); }
  };

  useEffect(() => { if (params.get('numero') && params.get('email')) buscar(); // eslint-disable-next-line
  }, []);

  const idx = pedido ? PASOS.findIndex(p => p[0] === pedido.estado) : -1;

  return (
    <>
      <BandaTitulo>Seguir mi pedido</BandaTitulo>
      <div className="max-w-xl mx-auto px-6 py-12">
        <form onSubmit={buscar} className="space-y-4">
          <label className="block"><span className="block text-lg text-verde-800 mb-1">Número de pedido</span>
            <input className={inp} value={numero} onChange={e => setNumero(e.target.value)} placeholder="YRB-2026-000001" /></label>
          <label className="block"><span className="block text-lg text-verde-800 mb-1">Correo con el que compraste</span>
            <input type="email" className={inp} value={email} onChange={e => setEmail(e.target.value)} /></label>
          <button className="btn-primary w-full" disabled={cargando || !numero || !email}>{cargando ? 'Buscando…' : 'Consultar'}</button>
        </form>
        {error && <p className="text-lg text-red-600 mt-5">{error}</p>}

        {pedido && (
          <div className="mt-10 border border-crema-300 bg-white p-6">
            <p className="text-2xl text-verde-900">Pedido {pedido.numero_pedido}</p>
            {pedido.estado === 'cancelado' ? (
              <p className="text-lg text-red-600 mt-2">Este pedido fue cancelado.</p>
            ) : pedido.estado === 'pendiente' ? (
              <p className="text-lg text-verde-700 mt-2">Estamos esperando la confirmación del pago.</p>
            ) : (
              <ol className="flex justify-between mt-5 mb-2">
                {PASOS.map(([k, l], i) => (
                  <li key={k} className="flex-1 text-center">
                    <span className={`block mx-auto w-4 h-4 rounded-full ${i <= idx ? 'bg-verde-600' : 'bg-crema-300'}`} />
                    <span className={`block text-base mt-1 ${i <= idx ? 'text-verde-800' : 'text-verde-400'}`}>{l}</span>
                  </li>
                ))}
              </ol>
            )}
            <ul className="mt-6 divide-y divide-crema-200">
              {pedido.items.map((it, i) => (
                <li key={i} className="flex justify-between py-2 text-lg text-verde-800"><span>{it.nombre} <span className="text-verde-500">× {it.cantidad}</span></span><span>{cop(it.subtotal)}</span></li>
              ))}
            </ul>
            <div className="flex justify-between text-2xl text-verde-900 mt-4"><span>Total</span><span>{cop(pedido.total)}</span></div>
            <p className="text-base text-verde-600 mt-4">Envío a: {pedido.direccion_envio}, {pedido.ciudad_envio}, {pedido.departamento_envio}</p>
          </div>
        )}
      </div>
    </>
  );
}
