import { useEffect, useState } from 'react';
import { Plus, Pencil, Trash2, X, Eye, EyeOff } from 'lucide-react';
import AdminSidebar from '../../components/admin/AdminSidebar';
import api from '../../services/api';
import Swal from 'sweetalert2';

const inp = { width:'100%', padding:'9px 12px', border:'1px solid #dcd8c9', fontFamily:'var(--font-marca)', fontSize:'0.95rem', color:'#0f3c27', background:'#fbfaf6', outline:'none', boxSizing:'border-box' };
const lbl = { display:'block', fontFamily:'var(--font-marca)', fontSize:'0.85rem', color:'#16422e', margin:'12px 0 4px' };

function Modal({ banner, onClose, onSave }) {
  const edit = !!banner?.id;
  const [f, setF] = useState({ titulo: banner?.titulo || '', subtitulo: banner?.subtitulo || '', boton_texto: banner?.boton_texto || '', boton_url: banner?.boton_url || '', orden: banner?.orden ?? 0, activo: banner?.activo ?? true });
  const [img, setImg] = useState(null);
  const [cargando, setCargando] = useState(false);
  const set = (k, v) => setF(x => ({ ...x, [k]: v }));

  const guardar = async () => {
    if (!edit && !img) return Swal.fire({ icon: 'warning', title: 'Elige una imagen', confirmButtonColor: '#0f3c27' });
    setCargando(true);
    try {
      const fd = new FormData();
      Object.entries(f).forEach(([k, v]) => fd.append(k, v));
      if (img) fd.append('imagen', img);
      const cfg = { headers: { 'Content-Type': 'multipart/form-data' } };
      if (edit) await api.put(`/admin/banners/${banner.id}`, fd, cfg); else await api.post('/admin/banners', fd, cfg);
      onSave();
    } catch (err) {
      Swal.fire({ icon: 'error', title: 'Error', text: err.response?.data?.mensaje || err.message, confirmButtonColor: '#0f3c27' });
    } finally { setCargando(false); }
  };

  return (
    <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,.5)', zIndex:100, display:'flex', justifyContent:'center', padding:'2rem 1rem', overflowY:'auto' }}>
      <div style={{ background:'white', width:'100%', maxWidth:520, height:'fit-content' }}>
        <div style={{ display:'flex', justifyContent:'space-between', padding:'16px 20px', background:'#0f3c27' }}>
          <p style={{ margin:0, fontFamily:'var(--font-marca)', fontSize:'1.1rem', color:'#f6f3eb' }}>{edit ? 'Editar imagen' : 'Nueva imagen del carrusel'}</p>
          <button onClick={onClose} style={{ background:'none', border:'none', cursor:'pointer', color:'#9dbfa9' }}><X size={18} /></button>
        </div>
        <div style={{ padding:'4px 20px 20px' }}>
          <label style={lbl}>Imagen * (horizontal, mínimo 1600 px de ancho){edit && ' — sube otra solo si quieres cambiarla'}</label>
          <input type="file" accept="image/png,image/jpeg,image/webp" onChange={e => setImg(e.target.files[0])} style={{ ...inp, padding:6 }} />
          <label style={lbl}>Título (opcional)</label><input style={inp} value={f.titulo} onChange={e => set('titulo', e.target.value)} />
          <label style={lbl}>Texto corto (opcional)</label><input style={inp} value={f.subtitulo} onChange={e => set('subtitulo', e.target.value)} />
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:10 }}>
            <div><label style={lbl}>Texto del botón</label><input style={inp} value={f.boton_texto} onChange={e => set('boton_texto', e.target.value)} placeholder="Ver regalos" /></div>
            <div><label style={lbl}>Enlace del botón</label><input style={inp} value={f.boton_url} onChange={e => set('boton_url', e.target.value)} placeholder="/tienda" /></div>
          </div>
          <label style={lbl}>Orden (1 sale primero)</label><input type="number" style={{ ...inp, width:100 }} value={f.orden} onChange={e => set('orden', e.target.value)} />
          <label style={{ display:'flex', gap:8, alignItems:'center', marginTop:14, fontFamily:'var(--font-marca)' }}>
            <input type="checkbox" checked={f.activo} onChange={e => set('activo', e.target.checked)} /> Visible en la portada
          </label>
          <button onClick={guardar} disabled={cargando} className="btn-primary w-full" style={{ marginTop:18 }}>{cargando ? 'Guardando...' : 'Guardar'}</button>
        </div>
      </div>
    </div>
  );
}

export default function AdminCarrusel() {
  const [banners, setBanners] = useState([]);
  const [modal, setModal] = useState(null);
  const cargar = () => api.get('/admin/banners').then(r => setBanners(r.data.banners || []));
  useEffect(() => { cargar(); }, []);

  const alternar = async (b) => {
    const fd = new FormData();
    ['titulo','subtitulo','boton_texto','boton_url'].forEach(k => fd.append(k, b[k] || ''));
    fd.append('orden', b.orden); fd.append('activo', !b.activo);
    await api.put(`/admin/banners/${b.id}`, fd, { headers: { 'Content-Type': 'multipart/form-data' } });
    cargar();
  };
  const eliminar = async (b) => {
    const r = await Swal.fire({ icon: 'warning', title: 'Quitar esta imagen del carrusel', showCancelButton: true, confirmButtonText: 'Quitar', confirmButtonColor: '#b91c1c' });
    if (r.isConfirmed) { await api.delete(`/admin/banners/${b.id}`); cargar(); }
  };

  return (
    <AdminSidebar>
      {modal !== null && <Modal banner={modal} onClose={() => setModal(null)} onSave={() => { setModal(null); cargar(); }} />}
      <div style={{ maxWidth: 900 }}>
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:8 }}>
          <h1 style={{ fontFamily:'var(--font-marca)', fontSize:'1.4rem', color:'#0f3c27', margin:0 }}>Carrusel de la portada</h1>
          <button onClick={() => setModal({})} className="btn-primary !py-2"><Plus size={15} /> Nueva imagen</button>
        </div>
        <p style={{ fontFamily:'var(--font-marca)', color:'#2f6549', marginTop:0, marginBottom:20 }}>
          Estas imágenes se muestran en la portada, una tras otra. Si no hay ninguna, se ve una portada sencilla.
        </p>
        <div style={{ display:'grid', gap:12 }}>
          {banners.map(b => (
            <div key={b.id} style={{ display:'flex', gap:14, alignItems:'center', background:'white', border:'1px solid #ebe7dc', padding:10, opacity: b.activo ? 1 : 0.55 }}>
              <img src={b.imagen_url} alt="" style={{ width:150, height:70, objectFit:'cover', background:'#f6f3eb' }} />
              <div style={{ flex:1, minWidth:0, fontFamily:'var(--font-marca)', color:'#0f3c27' }}>
                <p style={{ margin:0, fontSize:'1.05rem' }}>{b.titulo || <i style={{ color:'#9dbfa9' }}>Sin título</i>}</p>
                <p style={{ margin:0, fontSize:'0.85rem', color:'#6c9d83' }}>Orden {b.orden}{b.boton_url ? ` · botón → ${b.boton_url}` : ''}</p>
              </div>
              <button onClick={() => alternar(b)} title={b.activo ? 'Ocultar' : 'Mostrar'} style={{ background:'none', border:'none', cursor:'pointer', color: b.activo ? '#2f6549' : '#99631f' }}>{b.activo ? <Eye size={17} /> : <EyeOff size={17} />}</button>
              <button onClick={() => setModal(b)} title="Editar" style={{ background:'none', border:'none', cursor:'pointer', color:'#1d4ed8' }}><Pencil size={16} /></button>
              <button onClick={() => eliminar(b)} title="Quitar" style={{ background:'none', border:'none', cursor:'pointer', color:'#b91c1c' }}><Trash2 size={16} /></button>
            </div>
          ))}
          {banners.length === 0 && <p style={{ fontFamily:'var(--font-marca)', color:'#6c9d83', textAlign:'center', padding:'2rem' }}>Aún no hay imágenes en el carrusel</p>}
        </div>
      </div>
    </AdminSidebar>
  );
}
