import { useEffect, useState } from 'react';
import { Star, Check, Trash2, MessageSquare } from 'lucide-react';
import AdminSidebar from '../../components/admin/AdminSidebar';
import api from '../../services/api';
import Swal from 'sweetalert2';

export default function AdminResenas() {
  const [resenas, setResenas] = useState([]);
  const [filtro, setFiltro] = useState('pendientes');
  const [cargando, setCargando] = useState(true);

  const cargar = () => {
    setCargando(true);
    api.get(`/admin/resenas?estado=${filtro}`).then(r => setResenas(r.data.resenas || [])).finally(() => setCargando(false));
  };
  useEffect(() => { cargar(); }, [filtro]);

  const aprobar = async (r) => {
    try {
      await api.patch(`/admin/resenas/${r.id}/aprobar`);
      Swal.fire({ icon: 'success', title: 'Reseña publicada', timer: 1400, showConfirmButton: false, toast: true, position: 'top-end' });
      cargar();
    } catch (err) {
      Swal.fire({ icon: 'error', title: 'Error', text: err.response?.data?.mensaje, confirmButtonColor: '#052a1c' });
    }
  };

  const eliminar = async (r) => {
    const confirm = await Swal.fire({
      icon: 'warning', title: '¿Eliminar esta reseña?', text: 'Esta acción no se puede deshacer.',
      showCancelButton: true, confirmButtonText: 'Sí, eliminar', confirmButtonColor: '#b91c1c', cancelButtonText: 'Cancelar',
    });
    if (!confirm.isConfirmed) return;
    try {
      await api.delete(`/admin/resenas/${r.id}`);
      cargar();
    } catch (err) {
      Swal.fire({ icon: 'error', title: 'Error', text: err.response?.data?.mensaje, confirmButtonColor: '#052a1c' });
    }
  };

  return (
    <AdminSidebar>
      <div className="flex items-center justify-between flex-wrap gap-3 mb-6">
        <h1 className="font-display text-2xl font-bold text-verde-900 flex items-center gap-3">
          <MessageSquare size={24} className="text-dorado-500" /> Reseñas
        </h1>
        <div className="flex gap-1">
          {[['pendientes', 'Pendientes'], ['todas', 'Todas']].map(([v, label]) => (
            <button key={v} onClick={() => setFiltro(v)}
              className={`text-sm font-body px-4 py-2 border ${filtro === v ? 'bg-verde-900 text-white border-verde-900' : 'bg-white text-gray-500 border-crema-300'}`}>
              {label}
            </button>
          ))}
        </div>
      </div>

      {cargando ? (
        <p className="text-sm font-body text-gray-400">Cargando...</p>
      ) : resenas.length === 0 ? (
        <div className="bg-white border border-dashed border-gray-200 p-10 text-center">
          <p className="font-body text-gray-400">
            {filtro === 'pendientes' ? 'No hay reseñas pendientes de aprobar' : 'No hay reseñas todavía'}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {resenas.map(r => (
            <div key={r.id} className="bg-white border border-gray-100 p-4">
              <div className="flex items-start justify-between gap-4 flex-wrap">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1 flex-wrap">
                    <div className="flex gap-0.5">
                      {[...Array(5)].map((_, i) => (
                        <Star key={i} size={12} className={i < r.calificacion ? 'text-dorado-500 fill-dorado-500' : 'text-gray-200 fill-gray-200'} />
                      ))}
                    </div>
                    <span className="text-xs font-body font-bold px-2 py-0.5 rounded" style={{ background: r.aprobada ? '#eefaf4' : '#fef9e7', color: r.aprobada ? '#0f5535' : '#b8860b' }}>
                      {r.aprobada ? 'Publicada' : 'Pendiente'}
                    </span>
                  </div>
                  <p className="text-xs font-body text-dorado-600">{r.producto_nombre} · por {r.autor}</p>
                  {r.titulo && <p className="font-display font-bold text-verde-900 text-sm mt-1">{r.titulo}</p>}
                  {r.contenido && <p className="font-body text-gray-600 text-sm mt-0.5">{r.contenido}</p>}
                </div>
                <div className="flex gap-2 shrink-0">
                  {!r.aprobada && (
                    <button onClick={() => aprobar(r)} className="text-xs font-body px-3 py-1.5 text-white flex items-center gap-1" style={{ background: '#146b42' }}>
                      <Check size={12} /> Aprobar
                    </button>
                  )}
                  <button onClick={() => eliminar(r)} className="text-xs font-body px-3 py-1.5 border border-gray-200 text-red-500 flex items-center gap-1">
                    <Trash2 size={12} /> Eliminar
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </AdminSidebar>
  );
}
