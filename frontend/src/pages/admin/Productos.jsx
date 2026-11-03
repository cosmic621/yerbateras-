import { useEffect, useState } from 'react';
import { Plus, Pencil, Eye, EyeOff, Search, X } from 'lucide-react';
import AdminSidebar from '../../components/admin/AdminSidebar';
import api from '../../services/api';
import Swal from 'sweetalert2';
import { imageUrl } from '../../utils/imageUrl';

const S = {
  h1:    { fontFamily:'var(--font-marca)', fontSize:'1.4rem', fontWeight:'bold', color:'#0f3c27', margin:0 },
  tabla: { width:'100%', borderCollapse:'collapse', background:'white', border:'1px solid #ebe7dc' },
  th:    { fontFamily:'var(--font-marca)', fontSize:'0.72rem', fontWeight:'bold', color:'#2f6549', letterSpacing:'0.06em', textTransform:'uppercase', padding:'10px 14px', textAlign:'left', background:'#fbfaf6', borderBottom:'1px solid #ebe7dc' },
  td:    { fontFamily:'var(--font-marca)', fontSize:'0.84rem', color:'#0f3c27', padding:'11px 14px', borderBottom:'1px solid #f6f3eb', verticalAlign:'middle' },
  label: { display:'block', fontFamily:'var(--font-marca)', fontSize:'0.8rem', fontWeight:'bold', color:'#16422e', marginBottom:5, marginTop:12 },
  input: { width:'100%', padding:'9px 12px', border:'1px solid #dcd8c9', fontFamily:'var(--font-marca)', fontSize:'0.85rem', color:'#0f3c27', background:'#fbfaf6', outline:'none', boxSizing:'border-box' },
};

function Modal({ producto, categorias, lineasCuidado, temporadas, onClose, onSave }) {
  const esEdicion = !!producto?.id;
  const [form, setForm] = useState({
    nombre: producto?.nombre || '', descripcion: producto?.descripcion || '',
    descripcion_corta: producto?.descripcion_corta || '', precio: producto?.precio || '',
    precio_descuento: producto?.precio_descuento || '', stock: producto?.stock ?? '',
    stock_minimo: producto?.stock_minimo ?? 5, categoria_id: producto?.categoria_id || '',
    es_kit: producto?.es_kit || false, contenido_kit: producto?.contenido_kit || '', temporada: producto?.temporada || '',
    principio_activo: producto?.principio_activo || '',
    indicaciones: producto?.indicaciones || '', presentacion: producto?.presentacion || '',
    destacado: producto?.destacado || false,
  });
  const [imagen, setImagen]     = useState(null);
  const [cargando, setCargando] = useState(false);
  const [lineasSeleccionadas, setLineasSeleccionadas] = useState([]);

  useEffect(() => {
    if (esEdicion) {
      api.get(`/productos/${producto.id}`).then(r => {
        setLineasSeleccionadas((r.data.lineas_cuidado || []).map(l => l.id));
      });
    }
  }, []);

  const toggleLinea = (id) => {
    setLineasSeleccionadas(s => s.includes(id) ? s.filter(x => x !== id) : [...s, id]);
  };

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const guardar = async () => {
    if (!form.nombre || !form.precio || form.stock === '') {
      Swal.fire({ icon:'warning', title:'Campos requeridos', text:'Nombre, precio y stock son obligatorios.', confirmButtonColor:'#0f3c27' }); return;
    }
    setCargando(true);
    try {
      const fd = new FormData();
      // Estos campos se envían aunque estén vacíos para poder borrarlos (ej. quitar la temporada)
      const ENVIAR_VACIO = ['temporada', 'contenido_kit', 'precio_descuento', 'categoria_id'];
      Object.entries(form).forEach(([k, v]) => { if (v !== null && v !== undefined && (v !== '' || (esEdicion && ENVIAR_VACIO.includes(k)))) fd.append(k, v); });
      fd.append('lineas_cuidado', JSON.stringify(lineasSeleccionadas));
      if (imagen) fd.append('imagen', imagen);
      const cfg = { headers: { 'Content-Type': 'multipart/form-data' } };
      if (esEdicion) await api.put(`/productos/${producto.id}`, fd, cfg);
      else await api.post('/productos', fd, cfg);
      onSave();
    } catch (err) {
      Swal.fire({ icon:'error', title:'Error', text: err.response?.data?.mensaje || 'Error al guardar', confirmButtonColor:'#0f3c27' });
    } finally { setCargando(false); }
  };

  const overlay = { position:'fixed', inset:0, background:'rgba(0,0,0,0.5)', zIndex:100, display:'flex', alignItems:'flex-start', justifyContent:'center', padding:'2rem 1rem', overflowY:'auto' };
  const modal   = { background:'white', width:'100%', maxWidth:600, boxShadow:'0 20px 60px rgba(0,0,0,0.2)', marginTop:'auto', marginBottom:'auto' };
  const mHeader = { display:'flex', alignItems:'center', justifyContent:'space-between', padding:'16px 20px', background:'#0f3c27' };

  return (
    <div style={overlay}>
      <div style={modal}>
        <div style={mHeader}>
          <p style={{fontFamily:'var(--font-marca)', fontWeight:'bold', color:'#f6f3eb', margin:0}}>{esEdicion ? 'Editar producto' : 'Nuevo producto'}</p>
          <button onClick={onClose} style={{background:'none', border:'none', cursor:'pointer', color:'#9dbfa9'}}><X size={18} /></button>
        </div>
        <div style={{padding:'16px 20px', maxHeight:'70vh', overflowY:'auto'}}>
          <div style={{display:'grid', gridTemplateColumns:'1fr 1fr', gap:12}}>
            <div style={{gridColumn:'1/-1'}}>
              <label style={S.label}>Nombre *</label>
              <input value={form.nombre} onChange={e => set('nombre', e.target.value)} style={S.input} placeholder="Nombre del producto" />
            </div>
            <div>
              <label style={S.label}>Precio (COP) *</label>
              <input type="number" value={form.precio} onChange={e => set('precio', e.target.value)} style={S.input} placeholder="45000" />
            </div>
            <div>
              <label style={S.label}>Precio con descuento</label>
              <input type="number" value={form.precio_descuento} onChange={e => set('precio_descuento', e.target.value)} style={S.input} placeholder="Opcional" />
            </div>
            <div>
              <label style={S.label}>Stock *</label>
              <input type="number" value={form.stock} onChange={e => set('stock', e.target.value)} style={S.input} />
            </div>
            <div>
              <label style={S.label}>Stock minimo (alerta)</label>
              <input type="number" value={form.stock_minimo} onChange={e => set('stock_minimo', e.target.value)} style={S.input} />
            </div>
            <div>
              <label style={S.label}>Categoria</label>
              <select value={form.categoria_id} onChange={e => set('categoria_id', e.target.value)} style={{...S.input, cursor:'pointer'}}>
                <option value="">Seleccionar...</option>
                {categorias.map(c => <option key={c.id} value={c.id}>{c.nombre}</option>)}
              </select>
            </div>
            <div style={{gridColumn:'1/-1'}}>
              <label style={S.label}>Líneas de cuidado (puede tener varias)</label>
              <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'4px 12px', border:'1px solid #dcd8c9', background:'#fbfaf6', padding:'10px 12px' }}>
                {lineasCuidado.map(l => (
                  <label key={l.id} style={{ display:'flex', alignItems:'center', gap:8, cursor:'pointer', padding:'3px 0' }}>
                    <input type="checkbox" checked={lineasSeleccionadas.includes(l.id)} onChange={() => toggleLinea(l.id)} className="w-4 h-4 accent-verde-900" />
                    <span style={{ fontFamily:'var(--font-marca)', fontSize:'0.8rem', color:'#0f3c27' }}>{l.nombre}</span>
                  </label>
                ))}
              </div>
            </div>
            <div>
              <label style={S.label}>Presentacion</label>
              <input value={form.presentacion} onChange={e => set('presentacion', e.target.value)} style={S.input} placeholder="30ml, 60 capsulas..." />
            </div>
            <div style={{gridColumn:'1/-1'}}>
              <label style={S.label}>Descripcion corta</label>
              <input value={form.descripcion_corta} onChange={e => set('descripcion_corta', e.target.value)} style={S.input} placeholder="Resumen breve" />
            </div>
            <div style={{gridColumn:'1/-1'}}>
              <label style={S.label}>Descripcion completa</label>
              <textarea value={form.descripcion} onChange={e => set('descripcion', e.target.value)} rows={3} style={{...S.input, resize:'vertical'}} />
            </div>
            <div style={{gridColumn:'1/-1', background:'#fbf7ee', border:'1px solid #ebdab4', padding:'10px 12px', marginTop:12}}>
              <label style={{display:'flex', alignItems:'center', gap:8, cursor:'pointer', fontFamily:'var(--font-marca)', fontSize:'0.85rem', fontWeight:'bold', color:'#0f3c27'}}>
                <input type="checkbox" checked={form.es_kit} onChange={e => set('es_kit', e.target.checked)} /> Este artículo es un KIT
              </label>
              {form.es_kit && (
                <>
                  <label style={S.label}>¿Qué incluye el kit?</label>
                  <textarea value={form.contenido_kit} onChange={e => set('contenido_kit', e.target.value)} rows={3} style={{...S.input, resize:'vertical'}} placeholder="Ej: 1 bruma 120ml, 1 jabón artesanal, 1 vela" />
                </>
              )}
            </div>
            <div>
              <label style={S.label}>Temporada (opcional)</label>
              <select value={form.temporada} onChange={e => set('temporada', e.target.value)} style={{...S.input, cursor:'pointer'}}>
                <option value="">Sin temporada (siempre visible)</option>
                {temporadas.map(t => <option key={t.clave} value={t.clave}>{t.nombre}{t.activa ? '' : ' (apagada)'}</option>)}
              </select>
            </div>
            <div>
              <label style={S.label}>Principio activo</label>
              <input value={form.principio_activo} onChange={e => set('principio_activo', e.target.value)} style={S.input} placeholder="Cannabis CBD, Valeriana..." />
            </div>
            <div>
              <label style={S.label}>Indicaciones</label>
              <input value={form.indicaciones} onChange={e => set('indicaciones', e.target.value)} style={S.input} />
            </div>
            <div>
              <label style={S.label}>Imagen del producto</label>
              <input type="file" accept="image/*" onChange={e => setImagen(e.target.files[0])} style={{...S.input, padding:'6px'}} />
            </div>
            <div style={{display:'flex', alignItems:'center', gap:8, marginTop:12}}>
              <input type="checkbox" id="destacado" checked={form.destacado} onChange={e => set('destacado', e.target.checked)} />
              <label htmlFor="destacado" style={{fontFamily:'var(--font-marca)', fontSize:'0.85rem', color:'#16422e', cursor:'pointer'}}>Marcar como destacado</label>
            </div>
          </div>
        </div>
        <div style={{display:'flex', justifyContent:'flex-end', gap:10, padding:'14px 20px', borderTop:'1px solid #ebe7dc', background:'#fbfaf6'}}>
          <button onClick={onClose} style={{fontFamily:'var(--font-marca)', fontSize:'0.85rem', padding:'9px 18px', border:'1px solid #dcd8c9', background:'white', cursor:'pointer', color:'#2f6549'}}>
            Cancelar
          </button>
          <button onClick={guardar} disabled={cargando}
            style={{fontFamily:'var(--font-marca)', fontSize:'0.85rem', fontWeight:'bold', padding:'9px 18px', background:'#0f3c27', color:'#f6f3eb', border:'none', cursor:'pointer', opacity: cargando ? 0.7 : 1}}>
            {cargando ? 'Guardando...' : esEdicion ? 'Guardar cambios' : 'Crear producto'}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function AdminProductos() {
  const [productos, setProductos]   = useState([]);
  const [categorias, setCategorias] = useState([]);
  const [lineasCuidado, setLineasCuidado] = useState([]);
  const [cargando, setCargando]     = useState(true);
  const [buscar, setBuscar]         = useState('');
  const [modal, setModal]           = useState(null);
  const [temporadas, setTemporadas] = useState([]);
  const [tab, setTab]               = useState('todos'); // todos | productos | kits

  const cargar = () => {
    setCargando(true);
    Promise.all([api.get('/admin/productos'), api.get('/productos/categorias'), api.get('/productos/lineas-cuidado'), api.get('/admin/secciones')])
      .then(([p, c, l, sec]) => { setProductos(p.data.productos || []); setCategorias(c.data.categorias || []); setLineasCuidado(l.data.lineas || []); setTemporadas((sec.data.secciones || []).filter(x => x.tipo === 'temporada')); })
      .finally(() => setCargando(false));
  };
  useEffect(() => { cargar(); }, []);

  // Activar / desactivar: el artículo deja de mostrarse en el sitio pero no se pierde
  const toggleActivo = async (p) => {
    await api.patch(`/admin/productos/${p.id}/toggle`);
    cargar();
  };

  const filtrados = productos.filter(p => p.nombre.toLowerCase().includes(buscar.toLowerCase()) && (tab === 'todos' || (tab === 'kits' ? p.es_kit : !p.es_kit)));

  return (
    <AdminSidebar>
      {modal !== null && <Modal producto={modal} categorias={categorias} lineasCuidado={lineasCuidado} temporadas={temporadas} onClose={() => setModal(null)} onSave={() => { setModal(null); cargar(); }} />}
      <div style={{maxWidth:1100}}>
        <div style={{display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:'1.5rem', flexWrap:'wrap', gap:12}}>
          <h1 style={S.h1}>Productos y kits</h1>
          <div style={{display:'flex', gap:10, alignItems:'center'}}>
            <div style={{position:'relative'}}>
              <Search size={14} style={{position:'absolute', left:10, top:'50%', transform:'translateY(-50%)', color:'#9dbfa9'}} />
              <input value={buscar} onChange={e => setBuscar(e.target.value)} placeholder="Buscar..."
                style={{fontFamily:'var(--font-marca)', fontSize:'0.85rem', border:'1px solid #dcd8c9', padding:'8px 12px 8px 32px', color:'#0f3c27', background:'#fbfaf6', outline:'none', width:200}} />
            </div>
            <button onClick={() => setModal({})}
              style={{display:'flex', alignItems:'center', gap:6, padding:'9px 16px', background:'#0f3c27', color:'#f6f3eb', fontFamily:'var(--font-marca)', fontSize:'0.85rem', fontWeight:'bold', border:'none', cursor:'pointer'}}>
              <Plus size={15} /> Nuevo producto
            </button>
          </div>
        </div>

        <div style={{display:'flex', gap:6, marginBottom:14}}>
          {[['todos','Todos'],['productos','Productos'],['kits','Kits']].map(([k, l]) => (
            <button key={k} onClick={() => setTab(k)} style={{padding:'7px 16px', border:'1px solid #dcd8c9', background: tab === k ? '#0f3c27' : 'white', color: tab === k ? '#f6f3eb' : '#0f3c27', fontFamily:'var(--font-marca)', fontSize:'0.82rem', cursor:'pointer'}}>{l}</button>
          ))}
        </div>

        {cargando ? (
          <div style={{display:'flex', justifyContent:'center', padding:'3rem'}}>
            <div style={{width:28, height:28, border:'3px solid #ebe7dc', borderTopColor:'#2f6549', borderRadius:'50%', animation:'spin 0.8s linear infinite'}} />
            <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
          </div>
        ) : (
          <table style={S.tabla}>
            <thead>
              <tr>{['Producto','Categoria','Precio','Stock','Estado','Acciones'].map(h => <th key={h} style={S.th}>{h}</th>)}</tr>
            </thead>
            <tbody>
              {filtrados.map((p, i) => (
                <tr key={p.id} style={{background: i % 2 === 0 ? 'white' : '#fbfaf6', opacity: p.activo ? 1 : 0.55}}>
                  <td style={S.td}>
                    <div style={{display:'flex', alignItems:'center', gap:10}}>
                      <div style={{width:36, height:36, background:'#f6f3eb', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0, overflow:'hidden'}}>
                        {p.imagen_principal
                          ? <img
                              src={imageUrl(p.imagen_principal)}
                              alt=""
                              style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                            />
                          : <span style={{fontFamily:'var(--font-marca)', color:'#c5d9cb', fontSize:'0.8rem', fontStyle:'italic'}}>Y</span>}
                      </div>
                      <div>
                        <p style={{margin:0, fontWeight:'bold', fontSize:'0.85rem'}}>{p.nombre}</p>
                        {p.es_kit && <span style={{fontFamily:'var(--font-marca)', fontSize:'0.7rem', color:'#856a38', fontWeight:'bold'}}>KIT</span>}{p.temporada && <span style={{fontFamily:'var(--font-marca)', fontSize:'0.7rem', color:'#2f6549', marginLeft:6}}>✦ {p.temporada}</span>}
                      </div>
                    </div>
                  </td>
                  <td style={{...S.td, color:'#9dbfa9'}}>{p.categoria || '—'}</td>
                  <td style={S.td}><b>${Number(p.precio).toLocaleString('es-CO')}</b></td>
                  <td style={S.td}>
                    <span style={{fontWeight:'bold', color: p.stock === 0 ? '#b91c1c' : p.stock <= 5 ? '#856a38' : '#2f6549'}}>
                      {p.stock}
                    </span>
                  </td>
                  <td style={S.td}>
                    <span style={{display:'inline-block', background: (!p.activo || p.stock === 0) ? '#fef2f2' : '#f1f6f2', color: (!p.activo || p.stock === 0) ? '#b91c1c' : '#2f6549', fontFamily:'var(--font-marca)', fontSize:'0.72rem', fontWeight:'bold', padding:'2px 8px', borderRadius:3}}>
                      {!p.activo ? 'Desactivado' : p.stock === 0 ? 'Agotado' : 'Disponible'}
                    </span>
                  </td>
                  <td style={S.td}>
                    <div style={{display:'flex', gap:6}}>
                      <button onClick={() => setModal(p)} style={{background:'none', border:'none', cursor:'pointer', color:'#1d4ed8', padding:4}} title="Editar"><Pencil size={15} /></button>
                      <button onClick={() => toggleActivo(p)} style={{background:'none', border:'none', cursor:'pointer', color: p.activo ? '#2f6549' : '#99631f', padding:4}} title={p.activo ? 'Desactivar (ocultar del sitio)' : 'Activar (mostrar en el sitio)'}>{p.activo ? <Eye size={15} /> : <EyeOff size={15} />}</button>
                    </div>
                  </td>
                </tr>
              ))}
              {filtrados.length === 0 && (
                <tr><td colSpan={6} style={{...S.td, textAlign:'center', color:'#9dbfa9', padding:'2rem'}}>No se encontraron productos</td></tr>
              )}
            </tbody>
          </table>
        )}
      </div>
    </AdminSidebar>
  );
}
