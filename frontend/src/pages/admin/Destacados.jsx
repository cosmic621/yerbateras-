import { useEffect, useState } from 'react';
import { Star, Search } from 'lucide-react';
import AdminSidebar from '../../components/admin/AdminSidebar';
import api from '../../services/api';
import Swal from 'sweetalert2';

const th = { fontFamily:'var(--font-marca)', fontSize:'0.8rem', color:'#2f6549', textTransform:'uppercase', letterSpacing:'0.06em', padding:'10px 14px', textAlign:'left', background:'#fbfaf6', borderBottom:'1px solid #ebe7dc' };
const td = { fontFamily:'var(--font-marca)', fontSize:'0.95rem', color:'#0f3c27', padding:'10px 14px', borderBottom:'1px solid #f6f3eb', verticalAlign:'middle' };
const cop = (n) => `$${Number(n).toLocaleString('es-CO')}`;

function FilaPromo({ p, onGuardado }) {
  const actual = p.precio_descuento ? Math.round((1 - p.precio_descuento / p.precio) * 100) : '';
  const [pct, setPct] = useState(actual);
  const [guardando, setGuardando] = useState(false);

  const aplicar = async (valor) => {
    setGuardando(true);
    try { await api.patch(`/admin/productos/${p.id}/promocion`, { porcentaje: valor }); onGuardado(); }
    catch (err) { Swal.fire({ icon: 'error', title: err.response?.data?.mensaje || 'Error', confirmButtonColor: '#0f3c27' }); }
    finally { setGuardando(false); }
  };
  const previo = pct && Number(pct) > 0 && Number(pct) <= 90 ? Math.round(p.precio * (1 - pct / 100)) : null;

  return (
    <td style={td}>
      <div style={{ display:'flex', alignItems:'center', gap:8, flexWrap:'wrap' }}>
        <input type="number" min="0" max="90" value={pct} onChange={e => setPct(e.target.value)} placeholder="%"
          style={{ width:64, padding:'6px 8px', border:'1px solid #dcd8c9', fontFamily:'var(--font-marca)', fontSize:'0.95rem' }} />
        <button disabled={guardando || pct === ''} onClick={() => aplicar(Number(pct))} className="btn-outline !py-1 !px-3 !text-sm">Aplicar</button>
        {p.precio_descuento && <button disabled={guardando} onClick={() => { setPct(''); aplicar(0); }} style={{ background:'none', border:'none', cursor:'pointer', color:'#b91c1c', fontFamily:'var(--font-marca)' }}>Quitar</button>}
        {previo && !p.precio_descuento && <span style={{ color:'#99631f' }}>quedaría en {cop(previo)}</span>}
        {p.precio_descuento && <span style={{ color:'#2f6549' }}>ahora {cop(p.precio_descuento)}</span>}
      </div>
    </td>
  );
}

export default function AdminDestacados() {
  const [productos, setProductos] = useState([]);
  const [buscar, setBuscar] = useState('');
  const [filtro, setFiltro] = useState('todos'); // todos | destacados | promo
  const cargar = () => api.get('/admin/productos').then(r => setProductos((r.data.productos || []).filter(p => p.activo)));
  useEffect(() => { cargar(); }, []);

  const destacar = async (p) => { await api.patch(`/admin/productos/${p.id}/destacado`); cargar(); };

  const lista = productos.filter(p =>
    p.nombre.toLowerCase().includes(buscar.toLowerCase()) &&
    (filtro === 'todos' || (filtro === 'destacados' ? p.destacado : !!p.precio_descuento)));

  return (
    <AdminSidebar>
      <div style={{ maxWidth: 980 }}>
        <h1 style={{ fontFamily:'var(--font-marca)', fontSize:'1.4rem', color:'#0f3c27', margin:'0 0 6px' }}>Destacados y promociones</h1>
        <p style={{ fontFamily:'var(--font-marca)', color:'#2f6549', marginTop:0 }}>
          Marca con la estrella lo que aparece en "Destacados de la semana" en la portada. Ponle un porcentaje para que salga "En promoción" con su precio rebajado.
        </p>
        <div style={{ display:'flex', gap:8, alignItems:'center', margin:'18px 0', flexWrap:'wrap' }}>
          {[['todos','Todos'],['destacados','Destacados'],['promo','En promoción']].map(([k, l]) => (
            <button key={k} onClick={() => setFiltro(k)} style={{ padding:'6px 16px', border:'1px solid #dcd8c9', background: filtro === k ? '#0f3c27' : 'white', color: filtro === k ? '#f6f3eb' : '#0f3c27', fontFamily:'var(--font-marca)', cursor:'pointer' }}>{l}</button>
          ))}
          <div style={{ position:'relative', marginLeft:'auto' }}>
            <Search size={14} style={{ position:'absolute', left:10, top:'50%', transform:'translateY(-50%)', color:'#9dbfa9' }} />
            <input value={buscar} onChange={e => setBuscar(e.target.value)} placeholder="Buscar..." style={{ fontFamily:'var(--font-marca)', border:'1px solid #dcd8c9', padding:'7px 12px 7px 32px', background:'#fbfaf6', outline:'none', width:200 }} />
          </div>
        </div>

        <table style={{ width:'100%', borderCollapse:'collapse', background:'white', border:'1px solid #ebe7dc' }}>
          <thead><tr>{['', 'Producto', 'Precio', 'Promoción (% de descuento)'].map(h => <th key={h} style={th}>{h}</th>)}</tr></thead>
          <tbody>
            {lista.map(p => (
              <tr key={p.id}>
                <td style={{ ...td, width:44 }}>
                  <button onClick={() => destacar(p)} aria-label={p.destacado ? 'Quitar de destacados' : 'Destacar'} title={p.destacado ? 'Quitar de destacados' : 'Destacar esta semana'}
                    style={{ background:'none', border:'none', cursor:'pointer', color: p.destacado ? '#c6a15b' : '#c9c5b6' }}>
                    <Star size={20} fill={p.destacado ? '#c6a15b' : 'none'} />
                  </button>
                </td>
                <td style={td}><b>{p.nombre}</b>{p.es_kit && <span style={{ color:'#856a38', marginLeft:8, fontSize:'0.8rem' }}>KIT</span>}</td>
                <td style={td}>{p.precio_descuento ? <><s style={{ color:'#9dbfa9' }}>{cop(p.precio)}</s> <b>{cop(p.precio_descuento)}</b></> : cop(p.precio)}</td>
                <FilaPromo key={`${p.id}-${p.precio_descuento}`} p={p} onGuardado={cargar} />
              </tr>
            ))}
            {lista.length === 0 && <tr><td colSpan={4} style={{ ...td, textAlign:'center', color:'#9dbfa9', padding:'2rem' }}>Nada por aquí</td></tr>}
          </tbody>
        </table>
      </div>
    </AdminSidebar>
  );
}
