import { useEffect, useState } from 'react';
import { Plus, Pencil, Trash2, X, Tag } from 'lucide-react';
import AdminSidebar from '../../components/admin/AdminSidebar';
import api from '../../services/api';
import Swal from 'sweetalert2';

const S = {
  tabla: { width:'100%', borderCollapse:'collapse', background:'white', border:'1px solid #ede8da' },
  th:    { fontFamily:'Georgia,serif', fontSize:'0.72rem', fontWeight:'bold', color:'#146b42', letterSpacing:'0.06em', textTransform:'uppercase', padding:'10px 14px', textAlign:'left', background:'#fdfbf6', borderBottom:'1px solid #ede8da' },
  td:    { fontFamily:'Georgia,serif', fontSize:'0.84rem', color:'#052a1c', padding:'11px 14px', borderBottom:'1px solid #F5F0E1', verticalAlign:'middle' },
  label: { display:'block', fontFamily:'Georgia,serif', fontSize:'0.8rem', fontWeight:'bold', color:'#0a3d28', marginBottom:5, marginTop:12 },
  input: { width:'100%', padding:'9px 12px', border:'1px solid #ddd6c2', fontFamily:'Georgia,serif', fontSize:'0.85rem', color:'#052a1c', background:'#fdfbf6', outline:'none', boxSizing:'border-box' },
};

function Modal({ categoria, onClose, onSave }) {
  const esEdicion = !!categoria?.id;
  const [form, setForm] = useState({
    nombre: categoria?.nombre || '',
    descripcion: categoria?.descripcion || '',
    activa: categoria?.activa ?? true,
  });
  const [cargando, setCargando] = useState(false);
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const guardar = async () => {
    if (!form.nombre.trim()) {
      Swal.fire({ icon:'warning', title:'Falta el nombre', confirmButtonColor:'#052a1c' }); return;
    }
    setCargando(true);
    try {
      if (esEdicion) await api.put(`/admin/lineas-cuidado/${categoria.id}`, form);
      else await api.post('/admin/lineas-cuidado', form);
      onSave();
    } catch (err) {
      Swal.fire({ icon:'error', title:'Error', text: err.response?.data?.mensaje || 'Error al guardar', confirmButtonColor:'#052a1c' });
    } finally { setCargando(false); }
  };

  return (
    <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.5)', zIndex:100, display:'flex', alignItems:'flex-start', justifyContent:'center', padding:'2rem 1rem', overflowY:'auto' }}>
      <div style={{ background:'white', width:'100%', maxWidth:460, boxShadow:'0 20px 60px rgba(0,0,0,0.2)' }}>
        <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'16px 20px', background:'#052a1c' }}>
          <p style={{ fontFamily:'Georgia,serif', fontWeight:'bold', color:'#F5F0E1', margin:0 }}>{esEdicion ? 'Editar línea' : 'Nueva línea'}</p>
          <button onClick={onClose} style={{ background:'none', border:'none', cursor:'pointer', color:'#6ec194' }}><X size={18} /></button>
        </div>
        <div style={{ padding:'20px' }}>
          <label style={S.label}>Nombre *</label>
          <input value={form.nombre} onChange={e => set('nombre', e.target.value)} style={S.input} placeholder="Ej: Para acompañar el dolor" />

          <label style={S.label}>Descripción</label>
          <textarea value={form.descripcion} onChange={e => set('descripcion', e.target.value)} style={{ ...S.input, minHeight:70, resize:'vertical' }} />

          {esEdicion && (
            <label style={{ display:'flex', alignItems:'center', gap:8, marginTop:14, cursor:'pointer' }}>
              <input type="checkbox" checked={form.activa} onChange={e => set('activa', e.target.checked)} className="w-4 h-4 accent-verde-900" />
              <span style={{ fontFamily:'Georgia,serif', fontSize:'0.85rem', color:'#0a3d28' }}>Línea activa (visible en la tienda)</span>
            </label>
          )}

          <button onClick={guardar} disabled={cargando} className="btn-primary w-full mt-5">
            {cargando ? 'Guardando...' : 'Guardar línea'}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function AdminLineasCuidado() {
  const [categorias, setCategorias] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [modal, setModal] = useState(null); // null | {} | categoria

  const cargar = () => {
    setCargando(true);
    api.get('/admin/lineas-cuidado').then(r => setCategorias(r.data.lineas || [])).finally(() => setCargando(false));
  };
  useEffect(() => { cargar(); }, []);

  const eliminar = async (cat) => {
    const confirm = await Swal.fire({
      icon: 'warning', title: `¿Eliminar "${cat.nombre}"?`,
      text: Number(cat.total_productos) > 0
        ? 'Tiene productos asociados: se desactivará en vez de borrarse.'
        : 'Esta acción no se puede deshacer.',
      showCancelButton: true, confirmButtonText: 'Sí, continuar', confirmButtonColor: '#b91c1c', cancelButtonText: 'Cancelar',
    });
    if (!confirm.isConfirmed) return;
    try {
      const res = await api.delete(`/admin/lineas-cuidado/${cat.id}`);
      Swal.fire({ icon: 'success', title: res.data.mensaje, timer: 1800, showConfirmButton: false, toast: true, position: 'top-end' });
      cargar();
    } catch (err) {
      Swal.fire({ icon: 'error', title: 'Error', text: err.response?.data?.mensaje || 'No se pudo eliminar', confirmButtonColor: '#052a1c' });
    }
  };

  return (
    <AdminSidebar>
      <div className="flex items-center justify-between flex-wrap gap-3 mb-6">
        <h1 className="font-display text-2xl font-bold text-verde-900 flex items-center gap-3">
          <Tag size={24} className="text-dorado-500" /> Líneas de cuidado
        </h1>
        <button onClick={() => setModal({})} className="btn-primary flex items-center gap-2 text-sm">
          <Plus size={16} /> Nueva línea
        </button>
      </div>

      {cargando ? (
        <p className="text-sm font-body text-gray-400">Cargando...</p>
      ) : (
        <table style={S.tabla}>
          <thead>
            <tr>
              <th style={S.th}>Nombre</th>
              <th style={S.th}>Slug</th>
              <th style={S.th}>Productos</th>
              <th style={S.th}>Estado</th>
              <th style={S.th}></th>
            </tr>
          </thead>
          <tbody>
            {categorias.map(c => (
              <tr key={c.id}>
                <td style={S.td}>
                  <p style={{ fontWeight:'bold' }}>{c.nombre}</p>
                  {c.descripcion && <p style={{ fontSize:'0.75rem', color:'#6ec194' }}>{c.descripcion}</p>}
                </td>
                <td style={S.td}><code style={{ fontSize:'0.78rem', color:'#6ec194' }}>{c.slug}</code></td>
                <td style={S.td}>{c.total_productos}</td>
                <td style={S.td}>
                  <span style={{
                    fontSize:'0.72rem', fontWeight:'bold', padding:'3px 9px', borderRadius:10,
                    background: c.activa ? '#eefaf4' : '#F5F0E1', color: c.activa ? '#0f5535' : '#6ec194',
                  }}>
                    {c.activa ? 'Activa' : 'Inactiva'}
                  </span>
                </td>
                <td style={S.td}>
                  <div style={{ display:'flex', gap:8 }}>
                    <button onClick={() => setModal(c)} style={{ background:'none', border:'none', cursor:'pointer', color:'#146b42' }}><Pencil size={15} /></button>
                    <button onClick={() => eliminar(c)} style={{ background:'none', border:'none', cursor:'pointer', color:'#b91c1c' }}><Trash2 size={15} /></button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      {modal && <Modal categoria={modal.id ? modal : null} onClose={() => setModal(null)} onSave={() => { setModal(null); cargar(); }} />}
    </AdminSidebar>
  );
}
