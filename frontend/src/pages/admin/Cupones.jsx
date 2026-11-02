import { useEffect, useState } from 'react';
import { Plus, Trash2, X, Ticket } from 'lucide-react';
import AdminSidebar from '../../components/admin/AdminSidebar';
import api from '../../services/api';
import Swal from 'sweetalert2';

const inputStyle = { width:'100%', padding:'9px 12px', border:'1px solid #dcd8c9', fontFamily:'var(--font-marca)', fontSize:'0.85rem', color:'#0f3c27', background:'#fbfaf6', outline:'none', boxSizing:'border-box' };
const labelStyle = { display:'block', fontFamily:'var(--font-marca)', fontSize:'0.8rem', fontWeight:'bold', color:'#16422e', marginBottom:5, marginTop:12 };

function ModalCupon({ onClose, onSave }) {
  const [form, setForm] = useState({ codigo: '', tipo: 'porcentaje', valor: '', minimo_compra: '', usos_maximos: '', expira_en: '' });
  const [cargando, setCargando] = useState(false);
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const guardar = async () => {
    if (!form.codigo.trim() || !form.valor) {
      Swal.fire({ icon:'warning', title:'Completa código y valor', confirmButtonColor:'#0f3c27' }); return;
    }
    setCargando(true);
    try {
      await api.post('/admin/cupones', {
        ...form,
        valor: Number(form.valor),
        minimo_compra: form.minimo_compra ? Number(form.minimo_compra) : 0,
        usos_maximos: form.usos_maximos ? Number(form.usos_maximos) : null,
        expira_en: form.expira_en || null,
      });
      onSave();
    } catch (err) {
      Swal.fire({ icon:'error', title:'Error', text: err.response?.data?.mensaje || 'Error al crear', confirmButtonColor:'#0f3c27' });
    } finally { setCargando(false); }
  };

  return (
    <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.5)', zIndex:100, display:'flex', alignItems:'flex-start', justifyContent:'center', padding:'2rem 1rem', overflowY:'auto' }}>
      <div style={{ background:'white', width:'100%', maxWidth:460, boxShadow:'0 20px 60px rgba(0,0,0,0.2)' }}>
        <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'16px 20px', background:'#0f3c27' }}>
          <p style={{ fontFamily:'var(--font-marca)', fontWeight:'bold', color:'#f6f3eb', margin:0 }}>Nuevo cupón</p>
          <button onClick={onClose} style={{ background:'none', border:'none', cursor:'pointer', color:'#9dbfa9' }}><X size={18} /></button>
        </div>
        <div style={{ padding:'20px' }}>
          <label style={labelStyle}>Código *</label>
          <input value={form.codigo} onChange={e => set('codigo', e.target.value.toUpperCase())} style={inputStyle} placeholder="BIENVENIDA10" />

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label style={labelStyle}>Tipo *</label>
              <select value={form.tipo} onChange={e => set('tipo', e.target.value)} style={inputStyle}>
                <option value="porcentaje">Porcentaje (%)</option>
                <option value="fijo">Monto fijo (COP)</option>
              </select>
            </div>
            <div>
              <label style={labelStyle}>Valor *</label>
              <input type="number" min="1" value={form.valor} onChange={e => set('valor', e.target.value)} style={inputStyle} placeholder={form.tipo === 'porcentaje' ? '10' : '20000'} />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label style={labelStyle}>Compra mínima (COP)</label>
              <input type="number" min="0" value={form.minimo_compra} onChange={e => set('minimo_compra', e.target.value)} style={inputStyle} placeholder="0" />
            </div>
            <div>
              <label style={labelStyle}>Límite de usos</label>
              <input type="number" min="1" value={form.usos_maximos} onChange={e => set('usos_maximos', e.target.value)} style={inputStyle} placeholder="Sin límite" />
            </div>
          </div>

          <label style={labelStyle}>Fecha de expiración (opcional)</label>
          <input type="date" value={form.expira_en} onChange={e => set('expira_en', e.target.value)} style={inputStyle} />

          <button onClick={guardar} disabled={cargando} className="btn-primary w-full mt-5">
            {cargando ? 'Guardando...' : 'Crear cupón'}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function AdminCupones() {
  const [cupones, setCupones] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [modal, setModal] = useState(false);

  const cargar = () => {
    setCargando(true);
    api.get('/admin/cupones').then(r => setCupones(r.data.cupones || [])).finally(() => setCargando(false));
  };
  useEffect(() => { cargar(); }, []);

  const toggleActivo = async (c) => {
    try {
      await api.put(`/admin/cupones/${c.id}`, { activo: !c.activo });
      cargar();
    } catch (err) {
      Swal.fire({ icon: 'error', title: 'Error', text: err.response?.data?.mensaje, confirmButtonColor: '#0f3c27' });
    }
  };

  const eliminar = async (c) => {
    const confirm = await Swal.fire({
      icon: 'warning', title: `¿Eliminar "${c.codigo}"?`,
      showCancelButton: true, confirmButtonText: 'Sí, continuar', confirmButtonColor: '#b91c1c', cancelButtonText: 'Cancelar',
    });
    if (!confirm.isConfirmed) return;
    try {
      const res = await api.delete(`/admin/cupones/${c.id}`);
      Swal.fire({ icon: 'success', title: res.data.mensaje, timer: 2000, showConfirmButton: false, toast: true, position: 'top-end' });
      cargar();
    } catch (err) {
      Swal.fire({ icon: 'error', title: 'Error', text: err.response?.data?.mensaje, confirmButtonColor: '#0f3c27' });
    }
  };

  return (
    <AdminSidebar>
      <div className="flex items-center justify-between flex-wrap gap-3 mb-6">
        <h1 className="font-display text-2xl font-bold text-verde-900 flex items-center gap-3">
          <Ticket size={24} className="text-dorado-500" /> Cupones de descuento
        </h1>
        <button onClick={() => setModal(true)} className="btn-primary flex items-center gap-2 text-sm">
          <Plus size={16} /> Nuevo cupón
        </button>
      </div>

      {cargando ? (
        <p className="text-sm font-body text-gray-400">Cargando...</p>
      ) : cupones.length === 0 ? (
        <div className="bg-white border border-dashed border-gray-200 p-10 text-center">
          <p className="font-body text-gray-400">No has creado ningún cupón todavía</p>
        </div>
      ) : (
        <div className="space-y-2">
          {cupones.map(c => (
            <div key={c.id} className="bg-white border border-gray-100 p-4 flex items-center justify-between gap-4 flex-wrap">
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <code className="font-display font-bold text-verde-900 text-base">{c.codigo}</code>
                  <span className="text-[11px] font-body font-bold px-2 py-0.5 rounded" style={{ background: c.activo ? '#f1f6f2' : '#f6f3eb', color: c.activo ? '#214f39' : '#9dbfa9' }}>
                    {c.activo ? 'Activo' : 'Inactivo'}
                  </span>
                </div>
                <p className="text-xs font-body text-gray-400 mt-1">
                  {c.tipo === 'porcentaje' ? `${c.valor}% de descuento` : `$${Number(c.valor).toLocaleString('es-CO')} de descuento`}
                  {Number(c.minimo_compra) > 0 && ` · compra mínima $${Number(c.minimo_compra).toLocaleString('es-CO')}`}
                  {' · '}{c.usos_actuales} usado{c.usos_actuales !== 1 ? 's' : ''}{c.usos_maximos ? ` / ${c.usos_maximos}` : ''}
                  {c.expira_en && ` · expira ${new Date(c.expira_en).toLocaleDateString('es-CO')}`}
                </p>
              </div>
              <div className="flex gap-3">
                <button onClick={() => toggleActivo(c)} className="text-xs font-body px-3 py-1.5 border border-crema-300 text-verde-800">
                  {c.activo ? 'Desactivar' : 'Activar'}
                </button>
                <button onClick={() => eliminar(c)} className="text-red-600"><Trash2 size={16} /></button>
              </div>
            </div>
          ))}
        </div>
      )}

      {modal && <ModalCupon onClose={() => setModal(false)} onSave={() => { setModal(false); cargar(); }} />}
    </AdminSidebar>
  );
}
