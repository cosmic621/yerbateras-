import { useLocation, Link } from 'react-router-dom';
import { Leaf } from 'lucide-react';
import BandaTitulo from '../components/ui/BandaTitulo';

export function CheckoutExito() {
  const { state } = useLocation();
  const enlace = state?.numeroPedido ? `/pedido?numero=${encodeURIComponent(state.numeroPedido)}&email=${encodeURIComponent(state.email || '')}` : '/pedido';
  return (
    <>
      <BandaTitulo>Gracias por tu compra</BandaTitulo>
      <div className="max-w-xl mx-auto text-center px-6 py-16">
        <Leaf size={40} className="text-verde-500 mx-auto mb-4" />
        <h1 className="text-4xl text-verde-900 mb-3">{state?.pendiente ? 'Tu pago está en proceso' : '¡Pago recibido!'}</h1>
        {state?.numeroPedido && (
          <p className="text-2xl text-verde-700 mb-4">Pedido <span className="text-dorado-700">{state.numeroPedido}</span></p>
        )}
        <p className="text-xl text-verde-700 leading-relaxed mb-8">
          {state?.pendiente
            ? 'Apenas se confirme el pago te lo diremos por correo.'
            : `Te enviamos la confirmación a ${state?.email || 'tu correo'}.`}
          {' '}Con el número de pedido y tu correo puedes seguir tu pedido cuando quieras.
        </p>
        <div className="flex flex-wrap justify-center gap-3">
          <Link to={enlace} className="btn-primary">Seguir mi pedido</Link>
          <Link to="/tienda" className="btn-outline">Seguir comprando</Link>
        </div>
      </div>
    </>
  );
}

export default CheckoutExito;
