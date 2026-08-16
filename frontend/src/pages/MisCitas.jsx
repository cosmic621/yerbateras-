import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Calendar, Clock3, Pencil, X, Leaf, CheckCircle2 } from 'lucide-react';
import api from '../services/api';
import Swal from 'sweetalert2';

const ESTADOS = {
  confirmada: { label: 'Confirmada', color: 'bg-verde-100 text-verde-700' },
  pendiente_pago: { label: 'Pago pendiente', color: 'bg-yellow-100 text-yellow-700' },
};

const hoyISO = () => new Date().toISOString().slice(0, 10);
const maxFechaISO = () => { const d = new Date(); d.setDate(d.getDate() + 30); return d.toISOString().slice(0, 10); };

function ModalReprogramar({ cita, onClose, onGuardado }) {
  const [fecha, setFecha] = useState(cita.fecha.slice(0, 10));
  const [horarios, setHorarios] = useState([]);
  const [hora, setHora] = useState('');
  const [cargando, setCargando] = useState(false);
  const [guardando, setGuardando] = useState(false);

  useEffect(() => {
    setCargando(true);
    setHora('');
    api.get(`/citas/disponibilidad?fecha=${fecha}&servicio_id=${cita.servicio_id}&excluir_cita_id=${cita.id}`)
      .then(r => setHorarios(r.data.horarios))
      .catch(() => setHorarios([]))
      .finally(() => setCargando(false));
  }, [fecha]);

  const guardar = async () => {
    if (!hora) return;
    setGuardando(true);
    try {
      await api.patch(`/citas/${cita.id}/reprogramar`, { fecha, hora });
      Swal.fire({ icon: 'success', title: 'Cita reprogramada', timer: 1500, showConfirmButton: false, toast: true, position: 'top-end' });
      onGuardado();
    } catch (err) {
      Swal.fire({ icon: 'error', title: 'No se pudo reprogramar', text: err.response?.data?.mensaje || 'Intenta de nuevo', confirmButtonColor: '#052a1c' });
    } finally { setGuardando(false); }
  };

  return (
    <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
      <div className="bg-white max-w-md w-full p-6">
        <div className="flex items-center justify-between mb-5">
          <h3 className="font-display text-lg font-bold text-verde-900">Reprogramar cita</h3>
          <button onClick={onClose}><X size={20} className="text-gray-400" /></button>
        </div>

        <label className="block text-sm font-body font-semibold text-gray-700 mb-1.5">Nueva fecha</label>
        <input type="date" value={fecha} min={hoyISO()} max={maxFechaISO()}
          onChange={e => setFecha(e.target.value)} className="input-field mb-4" />

        <label className="block text-sm font-body font-semibold text-gray-700 mb-1.5">Nueva hora disponible</label>
        {cargando && <p className="text-sm font-body text-gray-400">Buscando horarios...</p>}
        {!cargando && horarios.length === 0 && (
          <p className="text-sm font-body text-red-500">No hay horarios disponibles ese día.</p>
        )}
        {!cargando && horarios.length > 0 && (
          <div className="grid grid-cols-4 gap-2 mb-2">
            {horarios.map(h => (
              <button key={h} onClick={() => setHora(h)}
                className={`text-xs font-body py-2 border ${hora === h ? 'bg-verde-900 text-white border-verde-900' : 'bg-white text-verde-800 border-crema-300'}`}>
                {h.slice(0, 5)}
              </button>
            ))}
          </div>
        )}

        <button onClick={guardar} disabled={!hora || guardando} className="btn-primary w-full mt-4 disabled:opacity-50">
          {guardando ? 'Guardando...' : 'Confirmar nuevo horario'}
        </button>
      </div>
    </div>
  );
}

export default function MisCitas() {
  const [citas, setCitas] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [editando, setEditando] = useState(null);

  const cargar = () => {
    setCargando(true);
    api.get('/citas/mis-citas').then(r => setCitas(r.data.citas || [])).finally(() => setCargando(false));
  };

  useEffect(() => { cargar(); }, []);

  if (cargando) return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="w-8 h-8 border-4 border-verde-200 border-t-verde-600 rounded-full animate-spin" />
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-3xl mx-auto px-6 py-10">
        <h1 className="font-display text-3xl font-bold text-verde-800 mb-8 flex items-center gap-3">
          <Calendar size={28} className="text-dorado-500" /> Mis Citas
        </h1>

        {citas.length === 0 ? (
          <div className="bg-white p-12 text-center shadow-sm border border-gray-100">
            <Leaf size={48} className="text-verde-200 mx-auto mb-4" />
            <p className="font-display text-xl text-gray-500 mb-2">No tienes citas agendadas</p>
            <Link to="/citas" className="btn-primary inline-flex mt-2">Agendar un masaje</Link>
          </div>
        ) : (
          <div className="space-y-4">
            {citas.map(c => {
              const estado = ESTADOS[c.estado] || { label: c.estado, color: 'bg-gray-100 text-gray-600' };
              const fecha = new Date(`${c.fecha.slice(0,10)}T00:00:00`).toLocaleDateString('es-CO', { weekday: 'long', day: 'numeric', month: 'long' });
              return (
                <div key={c.id} className="bg-white border border-gray-100 p-5 flex items-center justify-between gap-4 flex-wrap">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className={`text-xs font-body font-bold px-2 py-0.5 rounded ${estado.color}`}>{estado.label}</span>
                    </div>
                    <p className="font-display font-bold text-verde-900">{c.servicio_nombre}</p>
                    <p className="text-sm font-body text-gray-500 flex items-center gap-1.5 mt-1">
                      <Calendar size={13} /> {fecha}
                      <span className="mx-1">·</span>
                      <Clock3 size={13} /> {c.hora_inicio.slice(0,5)} - {c.hora_fin.slice(0,5)}
                    </p>
                  </div>
                  {c.estado === 'confirmada' && (
                    <button onClick={() => setEditando(c)} className="btn-outline flex items-center gap-2 text-sm">
                      <Pencil size={14} /> Reprogramar
                    </button>
                  )}
                  {c.estado === 'pendiente_pago' && (
                    <span className="text-xs font-body text-gray-400 flex items-center gap-1.5">
                      <CheckCircle2 size={14} /> Pago sin completar
                    </span>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {editando && (
        <ModalReprogramar cita={editando} onClose={() => setEditando(null)} onGuardado={() => { setEditando(null); cargar(); }} />
      )}
    </div>
  );
}
