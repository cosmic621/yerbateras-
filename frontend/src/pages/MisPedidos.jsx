import { useEffect, useState } from 'react';
import { Package, ChevronDown, ChevronUp, Leaf } from 'lucide-react';
import api from '../services/api';

const ESTADOS = {
  pendiente: { label: 'Pendiente', color: 'bg-yellow-100 text-yellow-700' },
  pagado: { label: 'Pagado', color: 'bg-blue-100 text-blue-700' },
  preparando: { label: 'Preparando', color: 'bg-purple-100 text-purple-700' },
  enviado: { label: 'Enviado', color: 'bg-orange-100 text-orange-700' },
  entregado: { label: 'Entregado ✓', color: 'bg-green-100 text-green-700' },
  cancelado: { label: 'Cancelado', color: 'bg-red-100 text-red-700' },
};

export default function MisPedidos() {
  const [pedidos, setPedidos] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [abierto, setAbierto] = useState(null);

  useEffect(() => {
    api.get('/pedidos').then(r => setPedidos(r.data.pedidos || [])).finally(() => setCargando(false));
  }, []);

  if (cargando) return (
    <div className="min-h-screen flex items-center justify-center pt-16">
      <div className="w-8 h-8 border-4 border-verde-200 border-t-verde-600 rounded-full animate-spin" />
    </div>
  );

  return (
    <div className="pt-16 min-h-screen bg-gray-50">
      <div className="max-w-3xl mx-auto px-6 py-10">
        <h1 className="font-display text-3xl font-bold text-verde-800 mb-8 flex items-center gap-3">
          <Package size={28} className="text-dorado-500" /> Mis Pedidos
        </h1>
        {pedidos.length === 0 ? (
          <div className="bg-white rounded-2xl p-12 text-center shadow-sm">
            <Leaf size={48} className="text-verde-200 mx-auto mb-4" />
            <p className="font-display text-xl text-gray-500 mb-2">No tienes pedidos aún</p>
            <p className="text-gray-400 font-body text-sm">Explora nuestra tienda y haz tu primera compra</p>
          </div>
        ) : (
          <div className="space-y-4">
            {pedidos.map(p => {
              const estado = ESTADOS[p.estado] || { label: p.estado, color: 'bg-gray-100 text-gray-600' };
              const items = typeof p.items === 'string' ? JSON.parse(p.items) : p.items || [];
              return (
                <div key={p.id} className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                  <button onClick={() => setAbierto(abierto === p.id ? null : p.id)}
                    className="w-full flex items-center justify-between px-6 py-4 hover:bg-gray-50 transition-colors">
                    <div className="flex items-center gap-4">
                      <div>
                        <p className="font-display text-sm font-bold text-verde-800">{p.numero_pedido}</p>
                        <p className="text-gray-400 font-body text-xs">{new Date(p.creado_en).toLocaleDateString('es-CO', { year: 'numeric', month: 'long', day: 'numeric' })}</p>
                      </div>
                      <span className={`text-xs font-body font-semibold px-3 py-1 rounded-full ${estado.color}`}>{estado.label}</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="font-display text-base font-bold text-verde-700">${Number(p.total).toLocaleString('es-CO')}</span>
                      {abierto === p.id ? <ChevronUp size={16} className="text-gray-400" /> : <ChevronDown size={16} className="text-gray-400" />}
                    </div>
                  </button>
                  {abierto === p.id && items.length > 0 && (
                    <div className="border-t border-gray-100 px-6 py-4 bg-gray-50">
                      <p className="text-xs font-body font-semibold text-gray-500 uppercase tracking-wide mb-3">Productos</p>
                      <div className="space-y-2">
                        {items.map((item, idx) => (
                          <div key={idx} className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-lg bg-verde-100 flex items-center justify-center overflow-hidden">
                              {item.imagen ? <img src={item.imagen} alt={item.nombre} className="w-full h-full object-cover" /> : <Leaf size={16} className="text-verde-400" />}
                            </div>
                            <p className="font-body text-sm text-gray-700 flex-1">{item.nombre}</p>
                            <span className="text-xs text-gray-400 font-body">x{item.cantidad}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
