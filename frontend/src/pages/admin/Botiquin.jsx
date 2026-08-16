import { useEffect, useState } from 'react';
import { Plus, Pencil, Trash2, X, GitBranch, Package, ChevronDown, ChevronRight, Star } from 'lucide-react';
import AdminSidebar from '../../components/admin/AdminSidebar';
import api from '../../services/api';
import Swal from 'sweetalert2';

const inputStyle = { width:'100%', padding:'9px 12px', border:'1px solid #ddd6c2', fontFamily:'Georgia,serif', fontSize:'0.85rem', color:'#052a1c', background:'#fdfbf6', outline:'none', boxSizing:'border-box' };
const labelStyle = { display:'block', fontFamily:'Georgia,serif', fontSize:'0.78rem', fontWeight:'bold', color:'#0a3d28', marginBottom:4, marginTop:10 };

function ModalPregunta({ pregunta, onClose, onSave }) {
  const esEdicion = !!pregunta?.id;
  const [form, setForm] = useState({
    texto: pregunta?.texto || '', es_inicial: pregunta?.es_inicial || false,
    orden: pregunta?.orden || 0, activa: pregunta?.activa ?? true,
  });
  const [cargando, setCargando] = useState(false);

  const guardar = async () => {
    if (!form.texto.trim()) { Swal.fire({ icon:'warning', title:'Escribe el texto de la pregunta', confirmButtonColor:'#052a1c' }); return; }
    setCargando(true);
    try {
      if (esEdicion) await api.put(`/admin/botiquin/preguntas/${pregunta.id}`, form);
      else await api.post('/admin/botiquin/preguntas', form);
      onSave();
    } catch (err) {
      Swal.fire({ icon:'error', title:'Error', text: err.response?.data?.mensaje, confirmButtonColor:'#052a1c' });
    } finally { setCargando(false); }
  };

  return (
    <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.5)', zIndex:100, display:'flex', alignItems:'flex-start', justifyContent:'center', padding:'2rem 1rem', overflowY:'auto' }}>
      <div style={{ background:'white', width:'100%', maxWidth:460, boxShadow:'0 20px 60px rgba(0,0,0,0.2)' }}>
        <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'16px 20px', background:'#052a1c' }}>
          <p style={{ fontFamily:'Georgia,serif', fontWeight:'bold', color:'#F5F0E1', margin:0 }}>{esEdicion ? 'Editar pregunta' : 'Nueva pregunta'}</p>
          <button onClick={onClose} style={{ background:'none', border:'none', cursor:'pointer', color:'#6ec194' }}><X size={18} /></button>
        </div>
        <div style={{ padding:'20px' }}>
          <label style={labelStyle}>Texto de la pregunta *</label>
          <input value={form.texto} onChange={e => setForm(f => ({ ...f, texto: e.target.value }))} style={inputStyle} placeholder="¿Qué necesita tu cuerpo hoy?" />

          <label style={labelStyle}>Orden</label>
          <input type="number" value={form.orden} onChange={e => setForm(f => ({ ...f, orden: Number(e.target.value) }))} style={inputStyle} />

          <label style={{ display:'flex', alignItems:'center', gap:8, marginTop:14, cursor:'pointer' }}>
            <input type="checkbox" checked={form.es_inicial} onChange={e => setForm(f => ({ ...f, es_inicial: e.target.checked }))} className="w-4 h-4 accent-verde-900" />
            <span style={{ fontFamily:'Georgia,serif', fontSize:'0.85rem', color:'#0a3d28' }}>Es la pregunta inicial (con la que arranca el botiquín)</span>
          </label>
          {esEdicion && (
            <label style={{ display:'flex', alignItems:'center', gap:8, marginTop:10, cursor:'pointer' }}>
              <input type="checkbox" checked={form.activa} onChange={e => setForm(f => ({ ...f, activa: e.target.checked }))} className="w-4 h-4 accent-verde-900" />
              <span style={{ fontFamily:'Georgia,serif', fontSize:'0.85rem', color:'#0a3d28' }}>Activa</span>
            </label>
          )}

          <button onClick={guardar} disabled={cargando} className="btn-primary w-full mt-5">
            {cargando ? 'Guardando...' : 'Guardar pregunta'}
          </button>
        </div>
      </div>
    </div>
  );
}

function ModalRespuesta({ respuesta, preguntaId, preguntas, onClose, onSave }) {
  const esEdicion = !!respuesta?.id;
  const [form, setForm] = useState({
    texto: respuesta?.texto || '', orden: respuesta?.orden || 0,
    siguiente_pregunta_id: respuesta?.siguiente_pregunta_id || '',
  });
  const [cargando, setCargando] = useState(false);

  const guardar = async () => {
    if (!form.texto.trim()) { Swal.fire({ icon:'warning', title:'Escribe el texto de la respuesta', confirmButtonColor:'#052a1c' }); return; }
    setCargando(true);
    try {
      const payload = { ...form, siguiente_pregunta_id: form.siguiente_pregunta_id || null, pregunta_id: preguntaId };
      if (esEdicion) await api.put(`/admin/botiquin/respuestas/${respuesta.id}`, payload);
      else await api.post('/admin/botiquin/respuestas', payload);
      onSave();
    } catch (err) {
      Swal.fire({ icon:'error', title:'Error', text: err.response?.data?.mensaje, confirmButtonColor:'#052a1c' });
    } finally { setCargando(false); }
  };

  return (
    <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.5)', zIndex:100, display:'flex', alignItems:'flex-start', justifyContent:'center', padding:'2rem 1rem', overflowY:'auto' }}>
      <div style={{ background:'white', width:'100%', maxWidth:460, boxShadow:'0 20px 60px rgba(0,0,0,0.2)' }}>
        <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'16px 20px', background:'#052a1c' }}>
          <p style={{ fontFamily:'Georgia,serif', fontWeight:'bold', color:'#F5F0E1', margin:0 }}>{esEdicion ? 'Editar respuesta' : 'Nueva respuesta'}</p>
          <button onClick={onClose} style={{ background:'none', border:'none', cursor:'pointer', color:'#6ec194' }}><X size={18} /></button>
        </div>
        <div style={{ padding:'20px' }}>
          <label style={labelStyle}>Texto de la respuesta *</label>
          <input value={form.texto} onChange={e => setForm(f => ({ ...f, texto: e.target.value }))} style={inputStyle} placeholder="Acompañar el dolor" />

          <label style={labelStyle}>Orden</label>
          <input type="number" value={form.orden} onChange={e => setForm(f => ({ ...f, orden: Number(e.target.value) }))} style={inputStyle} />

          <label style={labelStyle}>Al elegir esta respuesta...</label>
          <select value={form.siguiente_pregunta_id} onChange={e => setForm(f => ({ ...f, siguiente_pregunta_id: e.target.value }))} style={inputStyle}>
            <option value="">Mostrar productos recomendados (resultado final)</option>
            {preguntas.filter(p => p.id !== preguntaId).map(p => (
              <option key={p.id} value={p.id}>Pasar a: "{p.texto}"</option>
            ))}
          </select>
          <p style={{ fontFamily:'Georgia,serif', fontSize:'0.72rem', color:'#6ec194', marginTop:4 }}>
            {form.siguiente_pregunta_id ? 'Esta respuesta llevará a otra pregunta.' : 'Esta respuesta es un resultado — asocia productos después de guardar.'}
          </p>

          <button onClick={guardar} disabled={cargando} className="btn-primary w-full mt-5">
            {cargando ? 'Guardando...' : 'Guardar respuesta'}
          </button>
        </div>
      </div>
    </div>
  );
}

function ModalProductos({ respuesta, onClose, onSave }) {
  const [productos, setProductos] = useState([]);
  const [seleccionados, setSeleccionados] = useState(respuesta.producto_ids || []);
  const [busqueda, setBusqueda] = useState('');
  const [cargando, setCargando] = useState(false);

  useEffect(() => {
    api.get('/productos', { params: { limit: 100, buscar: busqueda || undefined } })
      .then(r => setProductos(r.data.productos || []));
  }, [busqueda]);

  const toggle = (id) => {
    setSeleccionados(s => s.includes(id) ? s.filter(x => x !== id) : [...s, id]);
  };

  const guardar = async () => {
    setCargando(true);
    try {
      await api.put(`/admin/botiquin/respuestas/${respuesta.id}/productos`, { producto_ids: seleccionados });
      onSave();
    } catch (err) {
      Swal.fire({ icon:'error', title:'Error', text: err.response?.data?.mensaje, confirmButtonColor:'#052a1c' });
    } finally { setCargando(false); }
  };

  return (
    <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.5)', zIndex:100, display:'flex', alignItems:'flex-start', justifyContent:'center', padding:'2rem 1rem', overflowY:'auto' }}>
      <div style={{ background:'white', width:'100%', maxWidth:520, boxShadow:'0 20px 60px rgba(0,0,0,0.2)' }}>
        <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'16px 20px', background:'#052a1c' }}>
          <p style={{ fontFamily:'Georgia,serif', fontWeight:'bold', color:'#F5F0E1', margin:0 }}>Productos para "{respuesta.texto}"</p>
          <button onClick={onClose} style={{ background:'none', border:'none', cursor:'pointer', color:'#6ec194' }}><X size={18} /></button>
        </div>
        <div style={{ padding:'20px' }}>
          <input value={busqueda} onChange={e => setBusqueda(e.target.value)} placeholder="Buscar producto..." style={{ ...inputStyle, marginBottom: 12 }} />
          <div style={{ maxHeight: 320, overflowY: 'auto', border: '1px solid #ede8da' }}>
            {productos.map(p => (
              <label key={p.id} style={{ display:'flex', alignItems:'center', gap:10, padding:'9px 12px', borderBottom:'1px solid #F5F0E1', cursor:'pointer' }}>
                <input type="checkbox" checked={seleccionados.includes(p.id)} onChange={() => toggle(p.id)} className="w-4 h-4 accent-verde-900" />
                <span style={{ fontFamily:'Georgia,serif', fontSize:'0.85rem', color:'#052a1c', flex:1 }}>{p.nombre}</span>
                <span style={{ fontFamily:'Georgia,serif', fontSize:'0.78rem', color:'#e0a83e' }}>${Number(p.precio).toLocaleString('es-CO')}</span>
              </label>
            ))}
            {productos.length === 0 && <p style={{ padding: 16, fontFamily:'Georgia,serif', fontSize:'0.8rem', color:'#6ec194' }}>Sin resultados</p>}
          </div>
          <p style={{ fontFamily:'Georgia,serif', fontSize:'0.75rem', color:'#6ec194', marginTop: 8 }}>{seleccionados.length} producto(s) seleccionado(s)</p>
          <button onClick={guardar} disabled={cargando} className="btn-primary w-full mt-4">
            {cargando ? 'Guardando...' : 'Guardar asociación'}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function AdminBotiquin() {
  const [preguntas, setPreguntas] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [expandidas, setExpandidas] = useState({});
  const [modalPregunta, setModalPregunta] = useState(null);
  const [modalRespuesta, setModalRespuesta] = useState(null);
  const [modalProductos, setModalProductos] = useState(null);

  const cargar = () => {
    setCargando(true);
    api.get('/admin/botiquin/preguntas').then(r => setPreguntas(r.data.preguntas || [])).finally(() => setCargando(false));
  };
  useEffect(() => { cargar(); }, []);

  const toggleExpandir = (id) => setExpandidas(e => ({ ...e, [id]: !e[id] }));

  const eliminarPregunta = async (p) => {
    const confirm = await Swal.fire({
      icon: 'warning', title: `¿Eliminar "${p.texto}"?`,
      text: 'También se eliminan sus respuestas.', showCancelButton: true,
      confirmButtonText: 'Sí, eliminar', confirmButtonColor: '#b91c1c', cancelButtonText: 'Cancelar',
    });
    if (!confirm.isConfirmed) return;
    await api.delete(`/admin/botiquin/preguntas/${p.id}`);
    cargar();
  };

  const eliminarRespuesta = async (r) => {
    const confirm = await Swal.fire({
      icon: 'warning', title: `¿Eliminar respuesta "${r.texto}"?`,
      showCancelButton: true, confirmButtonText: 'Sí, eliminar', confirmButtonColor: '#b91c1c', cancelButtonText: 'Cancelar',
    });
    if (!confirm.isConfirmed) return;
    await api.delete(`/admin/botiquin/respuestas/${r.id}`);
    cargar();
  };

  return (
    <AdminSidebar>
      <div className="flex items-center justify-between flex-wrap gap-3 mb-2">
        <h1 className="font-display text-2xl font-bold text-verde-900 flex items-center gap-3">
          <GitBranch size={24} className="text-dorado-500" /> Botiquín Yerbatero
        </h1>
        <button onClick={() => setModalPregunta({})} className="btn-primary flex items-center gap-2 text-sm">
          <Plus size={16} /> Nueva pregunta
        </button>
      </div>
      <p className="font-body text-sm text-gray-500 mb-6">
        Arma el árbol de preguntas: cada respuesta puede llevar a otra pregunta, o mostrar productos como resultado final.
      </p>

      {cargando ? (
        <p className="text-sm font-body text-gray-400">Cargando...</p>
      ) : preguntas.length === 0 ? (
        <div className="bg-white border border-dashed border-gray-200 p-10 text-center">
          <p className="font-body text-gray-400">No hay preguntas configuradas todavía</p>
        </div>
      ) : (
        <div className="space-y-3">
          {preguntas.map(p => (
            <div key={p.id} className="bg-white border border-gray-100">
              <div className="p-4 flex items-center justify-between gap-3 flex-wrap">
                <button onClick={() => toggleExpandir(p.id)} className="flex items-center gap-2 flex-1 text-left">
                  {expandidas[p.id] ? <ChevronDown size={16} className="text-gray-400" /> : <ChevronRight size={16} className="text-gray-400" />}
                  <span className="font-display font-bold text-verde-900">{p.texto}</span>
                  {p.es_inicial && <span className="text-[10px] font-body font-bold px-2 py-0.5 rounded bg-dorado-100 text-dorado-700 flex items-center gap-1"><Star size={10} /> Inicial</span>}
                  {!p.activa && <span className="text-[10px] font-body font-bold px-2 py-0.5 rounded bg-gray-100 text-gray-500">Inactiva</span>}
                </button>
                <div className="flex gap-3 shrink-0">
                  <button onClick={() => setModalPregunta(p)} className="text-verde-700"><Pencil size={15} /></button>
                  <button onClick={() => eliminarPregunta(p)} className="text-red-600"><Trash2 size={15} /></button>
                </div>
              </div>

              {expandidas[p.id] && (
                <div className="border-t border-gray-100 p-4 bg-crema-50 space-y-2">
                  {p.respuestas.map(r => (
                    <div key={r.id} className="bg-white border border-crema-300 p-3 flex items-center justify-between gap-3 flex-wrap">
                      <div>
                        <p className="font-body text-sm text-verde-900 font-semibold">{r.texto}</p>
                        {r.siguiente_pregunta_id ? (
                          <p className="text-xs font-body text-dorado-600">→ pasa a otra pregunta</p>
                        ) : (
                          <p className="text-xs font-body text-gray-400">{r.producto_ids?.length || 0} producto(s) asociado(s)</p>
                        )}
                      </div>
                      <div className="flex gap-2 shrink-0">
                        {!r.siguiente_pregunta_id && (
                          <button onClick={() => setModalProductos(r)} className="text-xs font-body px-3 py-1.5 border border-crema-300 text-verde-800 flex items-center gap-1">
                            <Package size={12} /> Productos
                          </button>
                        )}
                        <button onClick={() => setModalRespuesta({ respuesta: r, preguntaId: p.id })} className="text-verde-700"><Pencil size={14} /></button>
                        <button onClick={() => eliminarRespuesta(r)} className="text-red-600"><Trash2 size={14} /></button>
                      </div>
                    </div>
                  ))}
                  <button onClick={() => setModalRespuesta({ respuesta: null, preguntaId: p.id })} className="btn-outline text-sm flex items-center gap-2">
                    <Plus size={14} /> Agregar respuesta
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {modalPregunta && <ModalPregunta pregunta={modalPregunta.id ? modalPregunta : null} onClose={() => setModalPregunta(null)} onSave={() => { setModalPregunta(null); cargar(); }} />}
      {modalRespuesta && (
        <ModalRespuesta
          respuesta={modalRespuesta.respuesta}
          preguntaId={modalRespuesta.preguntaId}
          preguntas={preguntas}
          onClose={() => setModalRespuesta(null)}
          onSave={() => { setModalRespuesta(null); cargar(); }}
        />
      )}
      {modalProductos && <ModalProductos respuesta={modalProductos} onClose={() => setModalProductos(null)} onSave={() => { setModalProductos(null); cargar(); }} />}
    </AdminSidebar>
  );
}
