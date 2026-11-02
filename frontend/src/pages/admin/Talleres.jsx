import { useEffect, useState } from 'react';
import { Plus, Pencil, Trash2, X, Users } from 'lucide-react';
import AdminSidebar from '../../components/admin/AdminSidebar';
import api from '../../services/api';
import Swal from 'sweetalert2';

const inp = { width: '100%', padding: '9px 12px', border: '1px solid #dcd8c9', fontFamily: 'var(--font-marca)', fontSize: '0.85rem', color: '#0f3c27', background: '#fbfaf6', outline: 'none', boxSizing: 'border-box' };
const lbl = { display: 'block', fontFamily: 'var(--font-marca)', fontSize: '0.78rem', fontWeight: 'bold', color: '#16422e', margin: '12px 0 4px' };
const th = { fontFamily: 'var(--font-marca)', fontSize: '0.72rem', fontWeight: 'bold', color: '#2f6549', textTransform: 'uppercase', padding: '10px 14px', textAlign: 'left', background: '#fbfaf6', borderBottom: '1px solid #ebe7dc' };
const td = { fontFamily: 'var(--font-marca)', fontSize: '0.84rem', color: '#0f3c27', padding: '11px 14px', borderBottom: '1px solid #f6f3eb' };
const cop = (n) => `$${Number(n).toLocaleString('es-CO')}`;
const Overlay = ({ children }) => <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.5)', zIndex: 100, display: 'flex', justifyContent: 'center', padding: '2rem 1rem', overflowY: 'auto' }}>{children}</div>;
const Head = ({ t, onClose }) => (
  <div style={{ display: 'flex', justifyContent: 'space-between', padding: '16px 20px', background: '#0f3c27' }}>
    <p style={{ margin: 0, fontFamily: 'var(--font-marca)', fontWeight: 'bold', color: '#f6f3eb' }}>{t}</p>
    <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#9dbfa9' }}><X size={18} /></button>
  </div>
);

function ModalTaller({ taller, onClose, onSave }) {
  const edit = !!taller?.id;
  const [f, setF] = useState({
    titulo: taller?.titulo || '', descripcion: taller?.descripcion || '', instructor: taller?.instructor || '',
    fecha: taller?.fecha || '', hora_inicio: taller?.hora_inicio || '', duracion_horas: taller?.duracion_horas ?? 2,
    lugar: taller?.lugar || '', precio: taller?.precio ?? '', cupos: taller?.cupos ?? 10,
    porcentaje_minimo: taller?.porcentaje_minimo ?? 50, activo: taller?.activo ?? true,
  });
  const [flyer, setFlyer] = useState(null);
  const [cargando, setCargando] = useState(false);
  const set = (k, v) => setF(x => ({ ...x, [k]: v }));

  const guardar = async () => {
    if (!f.titulo.trim() || !f.fecha || !f.hora_inicio || f.precio === '') return Swal.fire({ icon: 'warning', title: 'Título, fecha, hora y precio son obligatorios', confirmButtonColor: '#0f3c27' });
    setCargando(true);
    try {
      const fd = new FormData();
      Object.entries(f).forEach(([k, v]) => fd.append(k, v));
      if (flyer) fd.append('flyer', flyer);
      const cfg = { headers: { 'Content-Type': 'multipart/form-data' } };
      if (edit) await api.put(`/admin/talleres/${taller.id}`, fd, cfg); else await api.post('/admin/talleres', fd, cfg);
      onSave();
    } catch (err) {
      Swal.fire({ icon: 'error', title: 'Error', text: err.response?.data?.mensaje || err.message, confirmButtonColor: '#0f3c27' });
    } finally { setCargando(false); }
  };

  return (
    <Overlay><div style={{ background: 'white', width: '100%', maxWidth: 560, height: 'fit-content' }}>
      <Head t={edit ? 'Editar taller' : 'Nuevo taller'} onClose={onClose} />
      <div style={{ padding: '4px 20px 20px' }}>
        <label style={lbl}>Título *</label><input style={inp} value={f.titulo} onChange={e => set('titulo', e.target.value)} />
        <label style={lbl}>Descripción</label><textarea rows={3} style={{ ...inp, resize: 'vertical' }} value={f.descripcion} onChange={e => set('descripcion', e.target.value)} />
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
          <div><label style={lbl}>Fecha *</label><input type="date" style={inp} value={f.fecha} onChange={e => set('fecha', e.target.value)} /></div>
          <div><label style={lbl}>Hora *</label><input type="time" style={inp} value={f.hora_inicio} onChange={e => set('hora_inicio', e.target.value)} /></div>
          <div><label style={lbl}>Duración (horas)</label><input type="number" min="0.5" step="0.5" style={inp} value={f.duracion_horas} onChange={e => set('duracion_horas', e.target.value)} /></div>
          <div><label style={lbl}>Instructor/a</label><input style={inp} value={f.instructor} onChange={e => set('instructor', e.target.value)} /></div>
          <div><label style={lbl}>Precio por persona (COP) *</label><input type="number" min="0" style={inp} value={f.precio} onChange={e => set('precio', e.target.value)} /></div>
          <div><label style={lbl}>Cupos</label><input type="number" min="1" style={inp} value={f.cupos} onChange={e => set('cupos', e.target.value)} /></div>
        </div>
        <label style={lbl}>Pago mínimo para reservar (%)</label>
        <select style={inp} value={f.porcentaje_minimo} onChange={e => set('porcentaje_minimo', e.target.value)}>
          {[50, 60, 70, 80, 90, 100].map(p => <option key={p} value={p}>{p}%{p === 50 ? ' (mínimo permitido)' : ''}</option>)}
        </select>
        <label style={lbl}>Lugar</label><input style={inp} value={f.lugar} onChange={e => set('lugar', e.target.value)} />
        <label style={lbl}>Flyer (imagen)</label>
        <input type="file" accept="image/png,image/jpeg,image/webp,image/gif" onChange={e => setFlyer(e.target.files[0])} style={{ ...inp, padding: 6 }} />
        <label style={{ display: 'flex', gap: 8, alignItems: 'center', marginTop: 14, fontFamily: 'var(--font-marca)', fontSize: '0.85rem' }}>
          <input type="checkbox" checked={f.activo} onChange={e => set('activo', e.target.checked)} /> Visible y con inscripciones abiertas
        </label>
        <button onClick={guardar} disabled={cargando} className="btn-primary w-full" style={{ marginTop: 18 }}>{cargando ? 'Guardando...' : 'Guardar'}</button>
      </div>
    </div></Overlay>
  );
}

function ModalInscritos({ taller, onClose }) {
  const [lista, setLista] = useState([]);
  const cargar = () => api.get(`/admin/talleres/${taller.id}/inscripciones`).then(r => setLista(r.data.inscripciones || []));
  useEffect(() => { cargar(); }, []);

  const pago = async (i) => {
    const { value } = await Swal.fire({ title: 'Registrar pago recibido', input: 'number', inputLabel: `Saldo pendiente: ${cop(i.saldo)}`, inputValue: Number(i.saldo), showCancelButton: true, confirmButtonColor: '#0f3c27' });
    if (!value) return;
    try { await api.post(`/admin/talleres/inscripciones/${i.id}/pago-manual`, { monto: Number(value) }); cargar(); }
    catch (err) { Swal.fire({ icon: 'error', title: err.response?.data?.mensaje || 'Error', confirmButtonColor: '#0f3c27' }); }
  };
  const cancelar = async (i) => {
    const r = await Swal.fire({ icon: 'warning', title: `Cancelar inscripción de ${i.nombre}`, text: 'El cupo queda libre. El reembolso, si aplica, se gestiona aparte.', showCancelButton: true, confirmButtonColor: '#b91c1c' });
    if (r.isConfirmed) { await api.patch(`/admin/talleres/inscripciones/${i.id}/cancelar`); cargar(); }
  };

  return (
    <Overlay><div style={{ background: 'white', width: '100%', maxWidth: 860, height: 'fit-content' }}>
      <Head t={`Inscritos: ${taller.titulo}`} onClose={onClose} />
      <div style={{ padding: 16, overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead><tr>{['Nombre', 'Contacto', 'Pers.', 'Pagado', 'Saldo', 'Estado', ''].map(h => <th key={h} style={th}>{h}</th>)}</tr></thead>
          <tbody>
            {lista.map(i => (
              <tr key={i.id}>
                <td style={td}><b>{i.nombre}</b>{i.requiere_revision && <div style={{ color: '#b91c1c', fontSize: '0.7rem' }}>⚠ Pagó con el cupo ya ocupado: revisar</div>}</td>
                <td style={td}>{i.email}<br />{i.telefono}</td>
                <td style={td}>{i.asistentes}</td>
                <td style={td}>{cop(i.monto_pagado)} / {cop(i.monto_total)}</td>
                <td style={{ ...td, color: Number(i.saldo) > 0 ? '#99631f' : '#2f6549', fontWeight: 'bold' }}>{cop(i.saldo)}</td>
                <td style={td}>{i.estado === 'confirmada' ? 'Confirmada' : 'Pago pendiente'}</td>
                <td style={td}>
                  {i.estado === 'confirmada' && Number(i.saldo) > 0 && <button onClick={() => pago(i)} className="btn-outline !py-1 !px-2 !text-xs">Registrar pago</button>}
                  <button onClick={() => cancelar(i)} title="Cancelar" style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#b91c1c' }}><Trash2 size={14} /></button>
                </td>
              </tr>
            ))}
            {lista.length === 0 && <tr><td colSpan={7} style={{ ...td, textAlign: 'center', color: '#6c9d83' }}>Aún no hay inscritos</td></tr>}
          </tbody>
        </table>
      </div>
    </div></Overlay>
  );
}

export default function AdminTalleres() {
  const [talleres, setTalleres] = useState([]);
  const [modal, setModal] = useState(null);
  const [inscritos, setInscritos] = useState(null);
  const cargar = () => api.get('/admin/talleres').then(r => setTalleres(r.data.talleres || []));
  useEffect(() => { cargar(); }, []);

  const eliminar = async (t) => {
    const r = await Swal.fire({ icon: 'warning', title: `Eliminar "${t.titulo}"`, text: 'Si ya tiene inscripciones solo se desactiva.', showCancelButton: true, confirmButtonColor: '#b91c1c' });
    if (!r.isConfirmed) return;
    const { data } = await api.delete(`/admin/talleres/${t.id}`);
    Swal.fire({ icon: 'info', title: data.mensaje, timer: 2200, showConfirmButton: false });
    cargar();
  };

  return (
    <AdminSidebar>
      {modal !== null && <ModalTaller taller={modal} onClose={() => setModal(null)} onSave={() => { setModal(null); cargar(); }} />}
      {inscritos && <ModalInscritos taller={inscritos} onClose={() => { setInscritos(null); cargar(); }} />}
      <div style={{ maxWidth: 1000 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
          <h1 style={{ fontFamily: 'var(--font-marca)', fontSize: '1.4rem', fontWeight: 'bold', color: '#0f3c27', margin: 0 }}>Talleres</h1>
          <button onClick={() => setModal({})} className="btn-primary !py-2"><Plus size={15} /> Nuevo taller</button>
        </div>
        <table style={{ width: '100%', borderCollapse: 'collapse', background: 'white', border: '1px solid #ebe7dc' }}>
          <thead><tr>{['Taller', 'Fecha', 'Precio', 'Cupos', 'Estado', ''].map(h => <th key={h} style={th}>{h}</th>)}</tr></thead>
          <tbody>
            {talleres.map(t => (
              <tr key={t.id} style={{ opacity: t.activo ? 1 : 0.55 }}>
                <td style={td}><b>{t.titulo}</b><div style={{ fontSize: '0.72rem', color: '#6c9d83' }}>Reserva desde {t.porcentaje_minimo}%</div></td>
                <td style={td}>{t.fecha} · {t.hora_inicio}</td>
                <td style={td}>{cop(t.precio)}</td>
                <td style={td}>{Number(t.cupos_ocupados)} / {t.cupos}</td>
                <td style={td}><span style={{ fontWeight: 'bold', fontSize: '0.72rem', color: t.activo ? '#2f6549' : '#99631f' }}>{t.activo ? 'ABIERTO' : 'DESACTIVADO'}</span></td>
                <td style={{ ...td, whiteSpace: 'nowrap' }}>
                  <button onClick={() => setInscritos(t)} title="Inscritos" style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#2f6549' }}><Users size={16} /></button>
                  <button onClick={() => setModal(t)} title="Editar" style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#1d4ed8' }}><Pencil size={15} /></button>
                  <button onClick={() => eliminar(t)} title="Eliminar" style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#b91c1c' }}><Trash2 size={15} /></button>
                </td>
              </tr>
            ))}
            {talleres.length === 0 && <tr><td colSpan={6} style={{ ...td, textAlign: 'center', color: '#6c9d83', padding: '2rem' }}>Aún no hay talleres</td></tr>}
          </tbody>
        </table>
      </div>
    </AdminSidebar>
  );
}
