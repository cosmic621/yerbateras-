import { useEffect, useState } from 'react';
import { Plus, Trash2, Sparkles } from 'lucide-react';
import AdminSidebar from '../../components/admin/AdminSidebar';
import api from '../../services/api';
import Swal from 'sweetalert2';

const Switch = ({ on, onChange }) => (
  <button onClick={onChange} role="switch" aria-checked={on}
    style={{ width: 46, height: 26, borderRadius: 13, border: 'none', cursor: 'pointer', position: 'relative', background: on ? '#2f6549' : '#c9c5b6', transition: 'background .2s', flexShrink: 0 }}>
    <span style={{ position: 'absolute', top: 3, left: on ? 23 : 3, width: 20, height: 20, borderRadius: '50%', background: 'white', transition: 'left .2s' }} />
  </button>
);

const Fila = ({ s, onToggle, onDelete }) => (
  <div style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '14px 16px', background: 'white', border: '1px solid #ebe7dc', marginBottom: 8 }}>
    <Switch on={s.activa} onChange={() => onToggle(s)} />
    <div style={{ flex: 1, minWidth: 0 }}>
      <p style={{ margin: 0, fontFamily: 'var(--font-marca)', fontWeight: 'bold', color: '#0f3c27' }}>{s.nombre}</p>
      <p style={{ margin: '2px 0 0', fontFamily: 'var(--font-marca)', fontSize: '0.78rem', color: '#6c9d83' }}>
        {s.descripcion || ''}{s.tipo === 'temporada' ? ` · ${s.total_productos} producto(s) activos con esta temporada` : ''}
      </p>
    </div>
    <span style={{ fontFamily: 'var(--font-marca)', fontSize: '0.72rem', fontWeight: 'bold', color: s.activa ? '#2f6549' : '#99631f' }}>{s.activa ? 'VISIBLE' : 'OCULTA'}</span>
    {!s.es_sistema && <button onClick={() => onDelete(s)} title="Eliminar" style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#b91c1c' }}><Trash2 size={16} /></button>}
  </div>
);

export default function AdminSecciones() {
  const [secciones, setSecciones] = useState([]);
  const [cargando, setCargando] = useState(true);

  const cargar = () => api.get('/admin/secciones').then(r => setSecciones(r.data.secciones || [])).finally(() => setCargando(false));
  useEffect(() => { cargar(); }, []);

  const toggle = async (s) => {
    try { await api.patch(`/admin/secciones/${s.clave}`, { activa: !s.activa }); cargar(); }
    catch (err) { Swal.fire({ icon: 'error', title: 'Error', text: err.response?.data?.mensaje || 'No se pudo actualizar', confirmButtonColor: '#0f3c27' }); }
  };

  const nueva = async () => {
    const { value: v } = await Swal.fire({
      title: 'Nueva temporada', html: '<input id="n" class="swal2-input" placeholder="Nombre (ej. Día de la Madre)"><input id="d" class="swal2-input" placeholder="Texto corto (opcional)">',
      showCancelButton: true, confirmButtonText: 'Crear', confirmButtonColor: '#0f3c27',
      preConfirm: () => ({ nombre: document.getElementById('n').value, descripcion: document.getElementById('d').value }),
    });
    if (!v?.nombre?.trim()) return;
    try { await api.post('/admin/secciones', v); cargar(); }
    catch (err) { Swal.fire({ icon: 'error', title: 'Error', text: err.response?.data?.mensaje || 'No se pudo crear', confirmButtonColor: '#0f3c27' }); }
  };

  const eliminar = async (s) => {
    const r = await Swal.fire({ icon: 'warning', title: `Eliminar "${s.nombre}"`, text: 'Sus productos quedarán sin temporada.', showCancelButton: true, confirmButtonText: 'Eliminar', confirmButtonColor: '#b91c1c' });
    if (r.isConfirmed) { await api.delete(`/admin/secciones/${s.clave}`); cargar(); }
  };

  const modulos = secciones.filter(s => s.tipo === 'modulo');
  const temporadas = secciones.filter(s => s.tipo === 'temporada');
  const h2 = { fontFamily: 'var(--font-marca)', fontSize: '1rem', fontWeight: 'bold', color: '#0f3c27', margin: '24px 0 10px' };

  return (
    <AdminSidebar>
      <div style={{ maxWidth: 760 }}>
        <h1 style={{ fontFamily: 'var(--font-marca)', fontSize: '1.4rem', fontWeight: 'bold', color: '#0f3c27', margin: 0 }}>Secciones y temporadas</h1>
        <p style={{ fontFamily: 'var(--font-marca)', fontSize: '0.84rem', color: '#2f6549', marginTop: 6 }}>
          Prende o apaga partes del sitio. Al apagar una temporada, también se ocultan los productos y kits que tengan esa temporada.
        </p>
        {cargando ? <p>Cargando...</p> : (
          <>
            <h2 style={h2}>Servicios y secciones del sitio</h2>
            {modulos.map(s => <Fila key={s.clave} s={s} onToggle={toggle} onDelete={eliminar} />)}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <h2 style={h2}><Sparkles size={15} style={{ verticalAlign: -2 }} /> Temporadas</h2>
              <button onClick={nueva} className="btn-primary !py-2"><Plus size={14} /> Nueva temporada</button>
            </div>
            {temporadas.map(s => <Fila key={s.clave} s={s} onToggle={toggle} onDelete={eliminar} />)}
            <p style={{ fontFamily: 'var(--font-marca)', fontSize: '0.78rem', color: '#6c9d83', marginTop: 14 }}>
              Para asignar un producto o kit a una temporada, edítalo en <b>Productos</b> y elige la temporada. Los masajes se activan/desactivan uno a uno en <b>Citas</b>.
            </p>
          </>
        )}
      </div>
    </AdminSidebar>
  );
}
