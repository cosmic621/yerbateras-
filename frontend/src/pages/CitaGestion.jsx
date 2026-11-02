import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import api from '../services/api';
import Swal from 'sweetalert2';
import BandaTitulo from '../components/ui/BandaTitulo';

const hoyISO = () => new Date().toLocaleDateString('en-CA', { timeZone: 'America/Bogota' });
const maxFechaISO = () => new Date(Date.now() + 30 * 864e5).toLocaleDateString('en-CA', { timeZone: 'America/Bogota' });

// Página privada a la que llega el enlace del correo de confirmación: ver y reprogramar la cita.
export default function CitaGestion() {
  const { token } = useParams();
  const [cita, setCita] = useState(null);
  const [politica, setPolitica] = useState('');
  const [error, setError] = useState('');
  const [editando, setEditando] = useState(false);
  const [fecha, setFecha] = useState('');
  const [horarios, setHorarios] = useState([]);
  const [hora, setHora] = useState('');
  const [guardando, setGuardando] = useState(false);

  const cargar = () => api.get(`/citas/gestion/${token}`)
    .then(r => { setCita(r.data.cita); setPolitica(r.data.politica); setFecha(r.data.cita.fecha); })
    .catch(() => setError('No encontramos esta cita. Revisa que el enlace esté completo.'));
  useEffect(() => { cargar(); // eslint-disable-next-line
  }, [token]);

  useEffect(() => {
    if (!editando || !cita) return;
    setHora('');
    api.get(`/citas/disponibilidad?fecha=${fecha}&servicio_id=${cita.servicio_id}&excluir_cita_id=${cita.id}`)
      .then(r => setHorarios(r.data.horarios)).catch(() => setHorarios([]));
  }, [fecha, editando, cita]);

  const guardar = async () => {
    setGuardando(true);
    try {
      await api.patch(`/citas/gestion/${token}/reprogramar`, { fecha, hora });
      setEditando(false); await cargar();
      Swal.fire({ icon: 'success', title: 'Cita reprogramada', timer: 1600, showConfirmButton: false, toast: true, position: 'top-end' });
    } catch (err) {
      Swal.fire({ icon: 'error', title: 'No se pudo reprogramar', text: err.response?.data?.mensaje || 'Intenta de nuevo', confirmButtonColor: '#0f3c27' });
    } finally { setGuardando(false); }
  };

  const fechaLarga = cita && new Date(`${cita.fecha}T00:00:00`).toLocaleDateString('es-CO', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });

  return (
    <>
      <BandaTitulo>Mi cita</BandaTitulo>
      <div className="max-w-xl mx-auto px-6 py-12">
        {error && <p className="text-xl text-red-600 text-center">{error}</p>}
        {cita && (
          <div className="border border-crema-300 bg-white p-6">
            <p className="text-3xl text-verde-900 mb-3">{cita.servicio_nombre}</p>
            <p className="text-xl text-verde-700 capitalize">{fechaLarga}</p>
            <p className="text-xl text-verde-700">{cita.hora_inicio.slice(0, 5)} – {cita.hora_fin.slice(0, 5)}</p>
            <p className="text-lg text-verde-600 mt-1">{cita.estado === 'confirmada' ? 'Cita confirmada' : 'Pago pendiente'}</p>

            <div className="bg-dorado-50 border border-dorado-200 text-verde-800 text-lg p-4 mt-6">
              <b>Políticas de cancelación.</b> {politica}
            </div>

            {cita.estado === 'confirmada' && !editando && (
              cita.puede_reprogramar
                ? <button onClick={() => setEditando(true)} className="btn-primary w-full mt-6">Reprogramar mi cita</button>
                : <p className="text-lg text-verde-600 mt-6">Faltan menos de 24 horas: ya no es posible reprogramar.</p>
            )}

            {editando && (
              <div className="mt-6">
                <label className="block text-lg text-verde-800 mb-1">Nueva fecha</label>
                <input type="date" value={fecha} min={hoyISO()} max={maxFechaISO()} onChange={e => setFecha(e.target.value)}
                  className="w-full px-4 py-3 border border-crema-300 text-lg mb-4" />
                {horarios.length === 0
                  ? <p className="text-lg text-red-600">No hay horarios disponibles ese día.</p>
                  : <div className="grid grid-cols-4 gap-2 mb-4">
                      {horarios.map(h => (
                        <button key={h} onClick={() => setHora(h)} className={`py-2 text-lg border ${hora === h ? 'bg-verde-900 text-crema-50 border-verde-900' : 'border-crema-300 text-verde-800'}`}>{h.slice(0, 5)}</button>
                      ))}
                    </div>}
                <div className="flex gap-3">
                  <button onClick={guardar} disabled={!hora || guardando} className="btn-primary flex-1 disabled:opacity-50">{guardando ? 'Guardando…' : 'Confirmar nuevo horario'}</button>
                  <button onClick={() => setEditando(false)} className="btn-outline">Cancelar</button>
                </div>
              </div>
            )}
          </div>
        )}
        <p className="text-center mt-8"><Link to="/" className="text-verde-600 underline">Volver al inicio</Link></p>
      </div>
    </>
  );
}
