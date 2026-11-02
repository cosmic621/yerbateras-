import { useEffect, useState } from 'react';
import { Plus, Pencil, Trash2, X } from 'lucide-react';
import AdminSidebar from '../../components/admin/AdminSidebar';
import api from '../../services/api';
import Swal from 'sweetalert2';

const inp = { width: '100%', padding: '9px 12px', border: '1px solid #dcd8c9', fontFamily: 'var(--font-marca)', fontSize: '0.85rem', color: '#0f3c27', background: '#fbfaf6', outline: 'none', boxSizing: 'border-box' };
const lbl = { display: 'block', fontFamily: 'var(--font-marca)', fontSize: '0.78rem', fontWeight: 'bold', color: '#16422e', margin: '12px 0 4px' };
const th = { fontFamily: 'var(--font-marca)', fontSize: '0.72rem', fontWeight: 'bold', color: '#2f6549', textTransform: 'uppercase', padding: '10px 14px', textAlign: 'left', background: '#fbfaf6', borderBottom: '1px solid #ebe7dc' };
const td = { fontFamily: 'var(--font-marca)', fontSize: '0.84rem', color: '#0f3c27', padding: '11px 14px', borderBottom: '1px solid #f6f3eb' };

function Modal({ evento, onClose, onSave }) {
  const edit = !!evento?.id;
  const [f, setF] = useState({
    titulo: evento?.titulo || '', fecha: evento?.fecha || '', hora_inicio: evento?.hora_inicio || '', hora_fin: evento?.hora_fin || '',
    lugar: evento?.lugar || '', enlace: evento?.enlace || '', descripcion: evento?.descripcion || '', activo: evento?.activo ?? true,
  });
  const [flyer, setFlyer] = useState(null);
  const [cargando, setCargando] = useState(false);
  const set = (k, v) => setF(x => ({ ...x, [k]: v }));

  const guardar = async () => {
    if (!f.titulo.trim() || !f.fecha) return Swal.fire({ icon: 'warning', title: 'Título y fecha son obligatorios', confirmButtonColor: '#0f3c27' });
    setCargando(true);
    try {
      const fd = new FormData();
      Object.entries(f).forEach(([k, v]) => fd.append(k, v));
      if (flyer) fd.append('flyer', flyer);
      const cfg = { headers: { 'Content-Type': 'multipart/form-data' } };
      if (edit) await api.put(`/admin/eventos/${evento.id}`, fd, cfg); else await api.post('/admin/eventos', fd, cfg);
      onSave();
    } catch (err) {
      Swal.fire({ icon: 'error', title: 'Error', text: err.response?.data?.mensaje || err.message, confirmButtonColor: '#0f3c27' });
    } finally { setCargando(false); }
  };

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.5)', zIndex: 100, display: 'flex', justifyContent: 'center', padding: '2rem 1rem', overflowY: 'auto' }}>
      <div style={{ background: 'white', width: '100%', maxWidth: 520, height: 'fit-content' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', padding: '16px 20px', background: '#0f3c27' }}>
          <p style={{ margin: 0, fontFamily: 'var(--font-marca)', fontWeight: 'bold', color: '#f6f3eb' }}>{edit ? 'Editar evento' : 'Nuevo evento'}</p>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#9dbfa9' }}><X size={18} /></button>
        </div>
        <div style={{ padding: '4px 20px 20px' }}>
          <label style={lbl}>Título *</label><input style={inp} value={f.titulo} onChange={e => set('titulo', e.target.value)} />
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10 }}>
            <div><label style={lbl}>Fecha *</label><input type="date" style={inp} value={f.fecha} onChange={e => set('fecha', e.target.value)} /></div>
            <div><label style={lbl}>Inicio</label><input type="time" style={inp} value={f.hora_inicio} onChange={e => set('hora_inicio', e.target.value)} /></div>
            <div><label style={lbl}>Fin</label><input type="time" style={inp} value={f.hora_fin} onChange={e => set('hora_fin', e.target.value)} /></div>
          </div>
          <label style={lbl}>Lugar</label><input style={inp} value={f.lugar} onChange={e => set('lugar', e.target.value)} />
          <label style={lbl}>Enlace (opcional)</label><input style={inp} value={f.enlace} onChange={e => set('enlace', e.target.value)} placeholder="https://..." />
          <label style={lbl}>Descripción</label><textarea rows={3} style={{ ...inp, resize: 'vertical' }} value={f.descripcion} onChange={e => set('descripcion', e.target.value)} />
          <label style={lbl}>Flyer (imagen) {edit && evento.flyer_url && '— sube otro para reemplazarlo'}</label>
          <input type="file" accept="image/png,image/jpeg,image/webp,image/gif" onChange={e => setFlyer(e.target.files[0])} style={{ ...inp, padding: 6 }} />
          <label style={{ display: 'flex', gap: 8, alignItems: 'center', marginTop: 14, fontFamily: 'var(--font-marca)', fontSize: '0.85rem' }}>
            <input type="checkbox" checked={f.activo} onChange={e => set('activo', e.target.checked)} /> Visible en el calendario
          </label>
          <button onClick={guardar} disabled={cargando} className="btn-primary w-full" style={{ marginTop: 18 }}>{cargando ? 'Guardando...' : 'Guardar'}</button>
        </div>
      </div>
    </div>
  );
}

export default function AdminEventos() {
  const [eventos, setEventos] = useState([]);
  const [modal, setModal] = useState(null);
  const cargar = () => api.get('/admin/eventos').then(r => setEventos(r.data.eventos || []));
  useEffect(() => { cargar(); }, []);

  const eliminar = async (e) => {
    const r = await Swal.fire({ icon: 'warning', title: `Eliminar "${e.titulo}"`, showCancelButton: true, confirmButtonText: 'Eliminar', confirmButtonColor: '#b91c1c' });
    if (r.isConfirmed) { await api.delete(`/admin/eventos/${e.id}`); cargar(); }
  };

  return (
    <AdminSidebar>
      {modal !== null && <Modal evento={modal} onClose={() => setModal(null)} onSave={() => { setModal(null); cargar(); }} />}
      <div style={{ maxWidth: 980 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
          <h1 style={{ fontFamily: 'var(--font-marca)', fontSize: '1.4rem', fontWeight: 'bold', color: '#0f3c27', margin: 0 }}>Eventos</h1>
          <button onClick={() => setModal({})} className="btn-primary !py-2"><Plus size={15} /> Nuevo evento</button>
        </div>
        <table style={{ width: '100%', borderCollapse: 'collapse', background: 'white', border: '1px solid #ebe7dc' }}>
          <thead><tr>{['Flyer', 'Evento', 'Fecha', 'Lugar', 'Estado', ''].map(h => <th key={h} style={th}>{h}</th>)}</tr></thead>
          <tbody>
            {eventos.map(e => (
              <tr key={e.id}>
                <td style={td}>{e.flyer_url ? <img src={e.flyer_url} alt="" style={{ width: 40, height: 40, objectFit: 'cover' }} /> : '—'}</td>
                <td style={td}><b>{e.titulo}</b></td>
                <td style={td}>{e.fecha}{e.hora_inicio ? ` · ${e.hora_inicio}` : ''}</td>
                <td style={td}>{e.lugar || '—'}</td>
                <td style={td}><span style={{ fontWeight: 'bold', fontSize: '0.72rem', color: e.activo ? '#2f6549' : '#99631f' }}>{e.activo ? 'VISIBLE' : 'OCULTO'}</span></td>
                <td style={td}>
                  <button onClick={() => setModal(e)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#1d4ed8' }}><Pencil size={15} /></button>
                  <button onClick={() => eliminar(e)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#b91c1c' }}><Trash2 size={15} /></button>
                </td>
              </tr>
            ))}
            {eventos.length === 0 && <tr><td colSpan={6} style={{ ...td, textAlign: 'center', color: '#6c9d83', padding: '2rem' }}>Aún no hay eventos</td></tr>}
          </tbody>
        </table>
      </div>
    </AdminSidebar>
  );
}
