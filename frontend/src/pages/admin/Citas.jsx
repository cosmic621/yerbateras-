import { useEffect, useState, useCallback } from 'react';
import { Calendar, Clock3, Phone, Mail, CheckCircle2, XCircle, RefreshCw, Settings2, Save, Plus, Pencil, Trash2, X, Sparkles } from 'lucide-react';
import AdminSidebar from '../../components/admin/AdminSidebar';
import api from '../../services/api';
import Swal from 'sweetalert2';

const hoyISO = () => new Date().toISOString().slice(0, 10);
const DIAS = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];

const ESTADOS = {
  confirmada: { label: 'Confirmada', color: '#214f39', bg: '#f1f6f2' },
  completada: { label: 'Completada', color: '#2f6549', bg: '#eef4e6' },
  no_asistio: { label: 'No asistió', color: '#b91c1c', bg: '#fef2f2' },
};

const TABS = [
  { id: 'agenda',    label: 'Agenda del día' },
  { id: 'servicios', label: 'Servicios de masaje' },
  { id: 'horario',   label: 'Horario de atención' },
];

// ─────────────────────────────────────────────────────────
// AGENDA DEL DÍA
// ─────────────────────────────────────────────────────────
function TarjetaCita({ cita, onActualizar }) {
  const est = ESTADOS[cita.estado] || ESTADOS.confirmada;
  const [actualizando, setActualizando] = useState(false);

  const cambiar = async (estado) => {
    setActualizando(true);
    try {
      await api.patch(`/admin/citas/${cita.id}/estado`, { estado });
      onActualizar();
    } finally { setActualizando(false); }
  };

  const waLink = `https://wa.me/${cita.telefono_cliente.replace(/[^0-9]/g, '')}`;

  return (
    <div className="bg-white border border-gray-100 p-4 flex gap-4" style={{ opacity: actualizando ? 0.6 : 1 }}>
      <div className="w-20 shrink-0 text-center border-r border-gray-100 pr-4">
        <p className="font-display font-bold text-verde-900 text-lg leading-none">{cita.hora_inicio.slice(0, 5)}</p>
        <p className="text-xs font-body text-gray-400 mt-1">{cita.hora_fin.slice(0, 5)}</p>
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1 flex-wrap">
          <span className="text-xs font-body font-bold px-2 py-0.5 rounded" style={{ background: est.bg, color: est.color }}>{est.label}</span>
          <p className="font-body text-sm text-gray-500">💆 {cita.servicio_nombre}</p>
        </div>
        <p className="font-display font-bold text-verde-900">{cita.nombre_cliente}</p>
        <div className="flex flex-wrap gap-3 mt-1">
          <span className="text-xs font-body text-gray-400 flex items-center gap-1"><Phone size={11} /> {cita.telefono_cliente}</span>
          <span className="text-xs font-body text-gray-400 flex items-center gap-1"><Mail size={11} /> {cita.email_cliente}</span>
        </div>
        {cita.notas && <p className="text-xs font-body text-gray-500 italic mt-1">"{cita.notas}"</p>}

        <div className="flex flex-wrap gap-2 mt-3">
          <a href={waLink} target="_blank" rel="noreferrer" className="text-xs font-body px-3 py-1.5 text-white" style={{ background: '#25D366' }}>WhatsApp</a>
          {cita.estado === 'confirmada' && (
            <>
              <button onClick={() => cambiar('completada')} className="text-xs font-body px-3 py-1.5 text-white flex items-center gap-1" style={{ background: '#2f6549' }}>
                <CheckCircle2 size={12} /> Completada
              </button>
              <button onClick={() => cambiar('no_asistio')} className="text-xs font-body px-3 py-1.5 text-white flex items-center gap-1" style={{ background: '#b91c1c' }}>
                <XCircle size={12} /> No asistió
              </button>
              <button onClick={() => cambiar('cancelada')} className="text-xs font-body px-3 py-1.5 border border-gray-200 text-gray-500">
                Cancelar
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

function AgendaDelDia() {
  const [fecha, setFecha] = useState(hoyISO());
  const [citas, setCitas] = useState([]);
  const [cargando, setCargando] = useState(true);

  const cargar = useCallback(() => {
    setCargando(true);
    api.get(`/admin/citas?fecha=${fecha}`).then(r => setCitas(r.data.citas || [])).finally(() => setCargando(false));
  }, [fecha]);

  useEffect(() => { cargar(); }, [cargar]);

  return (
    <>
      <div className="flex items-center gap-3 mb-5">
        <input type="date" value={fecha} onChange={e => setFecha(e.target.value)} className="border border-crema-300 px-3 py-2 bg-white font-body text-sm" />
        <button onClick={cargar} className="p-2 border border-crema-300 bg-white"><RefreshCw size={15} className="text-verde-700" /></button>
        <span className="text-sm font-body text-gray-500">{citas.length} cita{citas.length !== 1 ? 's' : ''} este día</span>
      </div>

      {cargando ? (
        <p className="text-sm font-body text-gray-400">Cargando...</p>
      ) : citas.length === 0 ? (
        <div className="bg-white border border-dashed border-gray-200 p-10 text-center">
          <Clock3 size={32} className="text-gray-200 mx-auto mb-3" />
          <p className="font-body text-gray-400">No hay citas para este día</p>
        </div>
      ) : (
        <div className="space-y-3">
          {citas.map(c => <TarjetaCita key={c.id} cita={c} onActualizar={cargar} />)}
        </div>
      )}
    </>
  );
}

// ─────────────────────────────────────────────────────────
// SERVICIOS DE MASAJE (agregar / editar / quitar)
// ─────────────────────────────────────────────────────────
const inputStyle = { width:'100%', padding:'9px 12px', border:'1px solid #dcd8c9', fontFamily:'var(--font-marca)', fontSize:'0.85rem', color:'#0f3c27', background:'#fbfaf6', outline:'none', boxSizing:'border-box' };
const labelStyle = { display:'block', fontFamily:'var(--font-marca)', fontSize:'0.8rem', fontWeight:'bold', color:'#16422e', marginBottom:5, marginTop:12 };

function ModalServicio({ servicio, onClose, onSave }) {
  const esEdicion = !!servicio?.id;
  const [form, setForm] = useState({
    nombre: servicio?.nombre || '',
    descripcion: servicio?.descripcion || '',
    duracion_minutos: servicio?.duracion_minutos || 60,
    precio: servicio?.precio || '',
    activo: servicio?.activo ?? true,
  });
  const [cargando, setCargando] = useState(false);
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const guardar = async () => {
    if (!form.nombre.trim() || !form.duracion_minutos || form.precio === '') {
      Swal.fire({ icon:'warning', title:'Completa nombre, duración y precio', confirmButtonColor:'#0f3c27' }); return;
    }
    setCargando(true);
    try {
      if (esEdicion) await api.put(`/admin/citas/servicios/${servicio.id}`, form);
      else await api.post('/admin/citas/servicios', form);
      onSave();
    } catch (err) {
      Swal.fire({ icon:'error', title:'Error', text: err.response?.data?.mensaje || 'Error al guardar', confirmButtonColor:'#0f3c27' });
    } finally { setCargando(false); }
  };

  return (
    <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.5)', zIndex:100, display:'flex', alignItems:'flex-start', justifyContent:'center', padding:'2rem 1rem', overflowY:'auto' }}>
      <div style={{ background:'white', width:'100%', maxWidth:460, boxShadow:'0 20px 60px rgba(0,0,0,0.2)' }}>
        <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'16px 20px', background:'#0f3c27' }}>
          <p style={{ fontFamily:'var(--font-marca)', fontWeight:'bold', color:'#f6f3eb', margin:0 }}>{esEdicion ? 'Editar servicio' : 'Nuevo servicio de masaje'}</p>
          <button onClick={onClose} style={{ background:'none', border:'none', cursor:'pointer', color:'#9dbfa9' }}><X size={18} /></button>
        </div>
        <div style={{ padding:'20px' }}>
          <label style={labelStyle}>Nombre *</label>
          <input value={form.nombre} onChange={e => set('nombre', e.target.value)} style={inputStyle} placeholder="Ej: Masaje relajante clásico" />

          <label style={labelStyle}>Descripción</label>
          <textarea value={form.descripcion} onChange={e => set('descripcion', e.target.value)} style={{ ...inputStyle, minHeight:60, resize:'vertical' }} />

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label style={labelStyle}>Duración (min) *</label>
              <input type="number" min="15" step="5" value={form.duracion_minutos} onChange={e => set('duracion_minutos', Number(e.target.value))} style={inputStyle} />
            </div>
            <div>
              <label style={labelStyle}>Precio (COP) *</label>
              <input type="number" min="0" step="1000" value={form.precio} onChange={e => set('precio', e.target.value)} style={inputStyle} />
            </div>
          </div>

          {esEdicion && (
            <label style={{ display:'flex', alignItems:'center', gap:8, marginTop:14, cursor:'pointer' }}>
              <input type="checkbox" checked={form.activo} onChange={e => set('activo', e.target.checked)} className="w-4 h-4 accent-verde-900" />
              <span style={{ fontFamily:'var(--font-marca)', fontSize:'0.85rem', color:'#16422e' }}>Servicio activo (se puede agendar)</span>
            </label>
          )}

          <button onClick={guardar} disabled={cargando} className="btn-primary w-full mt-5">
            {cargando ? 'Guardando...' : 'Guardar servicio'}
          </button>
        </div>
      </div>
    </div>
  );
}

function ServiciosMasaje() {
  const [servicios, setServicios] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [modal, setModal] = useState(null);

  const cargar = () => {
    setCargando(true);
    api.get('/admin/citas/servicios').then(r => setServicios(r.data.servicios || [])).finally(() => setCargando(false));
  };
  useEffect(() => { cargar(); }, []);

  const eliminar = async (s) => {
    const confirm = await Swal.fire({
      icon: 'warning', title: `¿Quitar "${s.nombre}"?`,
      text: Number(s.total_citas) > 0
        ? 'Tiene citas en su historial: se desactivará (deja de poder agendarse) en vez de borrarse.'
        : 'Esta acción no se puede deshacer.',
      showCancelButton: true, confirmButtonText: 'Sí, continuar', confirmButtonColor: '#b91c1c', cancelButtonText: 'Cancelar',
    });
    if (!confirm.isConfirmed) return;
    try {
      const res = await api.delete(`/admin/citas/servicios/${s.id}`);
      Swal.fire({ icon: 'success', title: res.data.mensaje, timer: 2000, showConfirmButton: false, toast: true, position: 'top-end' });
      cargar();
    } catch (err) {
      Swal.fire({ icon: 'error', title: 'Error', text: err.response?.data?.mensaje || 'No se pudo eliminar', confirmButtonColor: '#0f3c27' });
    }
  };

  return (
    <>
      <div className="flex justify-end mb-4">
        <button onClick={() => setModal({})} className="btn-primary flex items-center gap-2 text-sm">
          <Plus size={16} /> Nuevo servicio
        </button>
      </div>

      {cargando ? (
        <p className="text-sm font-body text-gray-400">Cargando...</p>
      ) : (
        <div className="space-y-2">
          {servicios.map(s => (
            <div key={s.id} className="bg-white border border-gray-100 p-4 flex items-center justify-between gap-4 flex-wrap">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-verde-50 flex items-center justify-center shrink-0">
                  <Sparkles size={16} className="text-verde-600" />
                </div>
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="font-display font-bold text-verde-900">{s.nombre}</p>
                    <span className="text-[11px] font-body font-bold px-2 py-0.5 rounded" style={{ background: s.activo ? '#f1f6f2' : '#f6f3eb', color: s.activo ? '#214f39' : '#9dbfa9' }}>
                      {s.activo ? 'Activo' : 'Inactivo'}
                    </span>
                  </div>
                  <p className="text-xs font-body text-gray-400 mt-0.5">
                    {s.duracion_minutos} min · ${Number(s.precio).toLocaleString('es-CO')} · {s.total_citas} cita{s.total_citas !== '1' ? 's' : ''} en historial
                  </p>
                  {s.descripcion && <p className="text-xs font-body text-gray-500 mt-0.5">{s.descripcion}</p>}
                </div>
              </div>
              <div className="flex gap-3">
                <button onClick={() => setModal(s)} className="text-verde-700"><Pencil size={16} /></button>
                <button onClick={() => eliminar(s)} className="text-red-600"><Trash2 size={16} /></button>
              </div>
            </div>
          ))}
        </div>
      )}

      {modal && <ModalServicio servicio={modal.id ? modal : null} onClose={() => setModal(null)} onSave={() => { setModal(null); cargar(); }} />}
    </>
  );
}

// ─────────────────────────────────────────────────────────
// HORARIO DE ATENCIÓN
// ─────────────────────────────────────────────────────────
function HorarioAtencion() {
  const [dias, setDias] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [guardando, setGuardando] = useState(false);

  useEffect(() => {
    api.get('/admin/citas/horario').then(r => setDias(r.data.horario)).finally(() => setCargando(false));
  }, []);

  const actualizar = (dia_semana, campo, valor) => {
    setDias(prev => prev.map(d => d.dia_semana === dia_semana ? { ...d, [campo]: valor } : d));
  };

  const guardar = async () => {
    setGuardando(true);
    try {
      await api.put('/admin/citas/horario', { dias });
      Swal.fire({ icon: 'success', title: 'Horario actualizado', timer: 1400, showConfirmButton: false, toast: true, position: 'top-end' });
    } catch (err) {
      Swal.fire({ icon: 'error', title: 'Error', text: err.response?.data?.mensaje || 'No se pudo guardar', confirmButtonColor: '#0f3c27' });
    } finally { setGuardando(false); }
  };

  if (cargando) return <p className="text-sm font-body text-gray-400">Cargando horario...</p>;

  return (
    <div className="bg-white border border-gray-100 p-5">
      <div className="space-y-2">
        {dias.map(d => (
          <div key={d.dia_semana} className="flex items-center gap-3 py-2 border-b border-gray-50 last:border-0 flex-wrap">
            <label className="flex items-center gap-2 w-28 shrink-0">
              <input type="checkbox" checked={d.activo} onChange={e => actualizar(d.dia_semana, 'activo', e.target.checked)} className="w-4 h-4 accent-verde-900" />
              <span className="text-sm font-body text-verde-800">{DIAS[d.dia_semana]}</span>
            </label>
            <input type="time" value={d.hora_apertura?.slice(0,5)} disabled={!d.activo}
              onChange={e => actualizar(d.dia_semana, 'hora_apertura', e.target.value + ':00')}
              className="border border-crema-300 px-2 py-1 text-sm font-body disabled:opacity-40" />
            <span className="text-gray-400 text-sm">a</span>
            <input type="time" value={d.hora_cierre?.slice(0,5)} disabled={!d.activo}
              onChange={e => actualizar(d.dia_semana, 'hora_cierre', e.target.value + ':00')}
              className="border border-crema-300 px-2 py-1 text-sm font-body disabled:opacity-40" />
          </div>
        ))}
      </div>
      <button onClick={guardar} disabled={guardando} className="btn-primary mt-4 flex items-center gap-2">
        <Save size={15} /> {guardando ? 'Guardando...' : 'Guardar horario'}
      </button>
    </div>
  );
}

// ─────────────────────────────────────────────────────────
export default function AdminCitas() {
  const [tab, setTab] = useState('agenda');

  return (
    <AdminSidebar>
      <h1 className="font-display text-2xl font-bold text-verde-900 flex items-center gap-3 mb-5">
        <Calendar size={26} className="text-dorado-500" /> Citas y masajes
      </h1>

      <div className="flex gap-1 mb-6 border-b border-gray-200">
        {TABS.map(t => (
          <button key={t.id} onClick={() => setTab(t.id)}
            className={`font-body text-sm px-4 py-2.5 border-b-2 transition-colors ${tab === t.id ? 'border-dorado-500 text-verde-900 font-semibold' : 'border-transparent text-gray-400'}`}>
            {t.label}
          </button>
        ))}
      </div>

      {tab === 'agenda' && <AgendaDelDia />}
      {tab === 'servicios' && <ServiciosMasaje />}
      {tab === 'horario' && <HorarioAtencion />}
    </AdminSidebar>
  );
}
