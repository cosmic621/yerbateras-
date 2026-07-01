// CheckoutExito.jsx
import { useLocation, Link } from 'react-router-dom';
import { CheckCircle, Package, ArrowRight } from 'lucide-react';

export function CheckoutExito() {
  const { state } = useLocation();
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4 pt-16">
      <div className="bg-white rounded-2xl shadow-lg p-12 max-w-md w-full text-center">
        <div className="w-24 h-24 bg-verde-100 rounded-full flex items-center justify-center mx-auto mb-6">
          <CheckCircle size={48} className="text-verde-600" />
        </div>
        <h1 className="font-display text-3xl font-bold text-verde-800 mb-3">¡Pago exitoso!</h1>
        {state?.numeroPedido && (
          <div className="bg-verde-50 rounded-lg px-4 py-3 mb-4">
            <p className="text-sm text-gray-500 font-body">Número de pedido</p>
            <p className="font-display text-xl font-bold text-verde-700">{state.numeroPedido}</p>
          </div>
        )}
        <p className="text-gray-600 font-body leading-relaxed mb-8">
          Recibiste un correo de confirmación con los detalles de tu pedido. ¡Gracias por confiar en Yerbateras! 🌿
        </p>
        <div className="flex flex-col gap-3">
          <Link to="/mis-pedidos" className="btn-primary flex items-center justify-center gap-2">
            <Package size={18} /> Ver mis pedidos
          </Link>
          <Link to="/tienda" className="btn-outline flex items-center justify-center gap-2">
            Seguir comprando <ArrowRight size={16} />
          </Link>
        </div>
      </div>
    </div>
  );
}

export default CheckoutExito;
