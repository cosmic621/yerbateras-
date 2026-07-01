import { useEffect, useState } from 'react';
import { AlertTriangle, Package } from 'lucide-react';
import AdminSidebar from '../../components/admin/AdminSidebar';
import api from '../../services/api';
import Swal from 'sweetalert2';

const S = {
  h1:   { fontFamily:'Georgia,serif', fontSize:'1.4rem', fontWeight:'bold', color:'#1E2E1A', margin:'0 0 1.5rem' },
  tabla:{ width:'100%', borderCollapse:'collapse', background:'white', border:'1px solid #e8e3d8' },
  th:   { fontFamily:'Georgia,serif', fontSize:'0.75rem', fontWeight:'bold', color:'#5a7052', letterSpacing:'0.06em', textTransform:'uppercase', padding:'10px 14px', textAlign:'left', background:'#f7f5f0', borderBottom:'1px solid #e8e3d8' },
  td:   { fontFamily:'Georgia,serif', fontSize:'0.85rem', color:'#1E2E1A', padding:'11px 14px', borderBottom:'1px solid #f0ede8' },
  btn:  { display:'inline-flex', alignItems:'center', gap:6, padding:'6px 12px', fontFamily:'Georgia,serif', fontSize:'0.78rem', fontWeight:'bold', border:'1px solid #5C6B3A', color:'#5C6B3A', background:'white', cursor:'pointer', borderRadius:4 },
};

const badgeStock = (estado) => {
  const map = { agotado:{bg:'#fef2f2',color:'#b91c1c'}, bajo:{bg:'#fef9ec',color:'#b45309'}, ok:{bg:'#f0f7ec',color:'#2d6a1e'} };
  const s = map[estado] || map.ok;
  return { display:'inline-block', background:s.bg, color:s.color, fontFamily:'Georgia,serif', fontSize:'0.72rem', fontWeight:'bold', padding:'3px 8px', borderRadius:3 };
};

export default function AdminInventario() {
  const [inventario, setInventario] = useState([]);
  const [cargando, setCargando]     = useState(true);
  const [buscar, setBuscar]         = useState('');

  const cargar = () => {
    setCargando(true);
    api.get('/admin/inventario').then(r => setInventario(r.data.inventario || [])).finally(() => setCargando(false));
  };
  useEffect(() => { cargar(); }, []);

  const ajustar = async (prod) => {
    const { value } = await Swal.fire({
      title: `Ajustar stock`,
      html: `<p style="font-family:Georgia,serif;font-size:0.9rem;color:#2d4a22;margin-bottom:12px"><b>${prod.nombre}</b><br>Stock actual: <b>${prod.stock}</b></p>
        <select id="tipo" class="swal2-input" style="margin-bottom:8px">
          <option value="entrada">Entrada — agregar stock</option>
          <option value="salida">Salida — reducir stock</option>
        </select>
        <input id="cantidad" type="number" min="1" class="swal2-input" placeholder="Cantidad">
        <input id="motivo" class="swal2-input" placeholder="Motivo (opcional)">`,
      showCancelButton: true, confirmButtonText:'Aplicar', cancelButtonText:'Cancelar', confirmButtonColor:'#1E2E1A',
      preConfirm: () => ({
        tipo: document.getElementById('tipo').value,
        cantidad: parseInt(document.getElementById('cantidad').value),
        motivo: document.getElementById('motivo').value,
      })
    });
    if (!value || !value.cantidad || value.cantidad < 1) return;
    try {
      await api.post('/admin/inventario/ajuste', { producto_id: prod.id, ...value });
      Swal.fire({ icon:'success', title:'Stock actualizado', timer:1500, showConfirmButton:false });
      cargar();
    } catch (err) {
      Swal.fire({ icon:'error', title:'Error', text: err.response?.data?.mensaje, confirmButtonColor:'#1E2E1A' });
    }
  };

  const filtrados = inventario.filter(p => p.nombre.toLowerCase().includes(buscar.toLowerCase()));

  return (
    <AdminSidebar>
      <div style={{maxWidth:1000}}>
        <div style={{display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:'1.5rem', flexWrap:'wrap', gap:12}}>
          <h1 style={{...S.h1, margin:0}}>Inventario</h1>
          <input value={buscar} onChange={e => setBuscar(e.target.value)} placeholder="Buscar producto..."
            style={{fontFamily:'Georgia,serif', fontSize:'0.85rem', border:'1px solid #ddd6c2', padding:'8px 12px', color:'#1E2E1A', background:'#faf8f4', outline:'none', width:220}} />
        </div>

        {cargando ? (
          <div style={{display:'flex', justifyContent:'center', padding:'3rem'}}>
            <div style={{width:28, height:28, border:'3px solid #e8e3d8', borderTopColor:'#5C6B3A', borderRadius:'50%', animation:'spin 0.8s linear infinite'}} />
            <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
          </div>
        ) : (
          <table style={S.tabla}>
            <thead>
              <tr>
                {['Producto','Categoria','Stock','Stock min.','Estado','Accion'].map(h => (
                  <th key={h} style={S.th}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtrados.map((p, i) => (
                <tr key={p.id} style={{background: i % 2 === 0 ? 'white' : '#faf8f4'}}>
                  <td style={S.td}><b>{p.nombre}</b></td>
                  <td style={{...S.td, color:'#8fa882'}}>{p.categoria || '—'}</td>
                  <td style={S.td}>
                    <span style={{fontFamily:'Georgia,serif', fontSize:'1.1rem', fontWeight:'bold', color: p.stock === 0 ? '#b91c1c' : p.stock <= p.stock_minimo ? '#b45309' : '#2d6a1e'}}>
                      {p.stock}
                    </span>
                  </td>
                  <td style={{...S.td, color:'#8fa882'}}>{p.stock_minimo}</td>
                  <td style={S.td}>
                    <span style={badgeStock(p.estado_stock)}>
                      {p.estado_stock === 'agotado' ? 'Agotado' : p.estado_stock === 'bajo' ? 'Stock bajo' : 'OK'}
                    </span>
                  </td>
                  <td style={S.td}>
                    <button onClick={() => ajustar(p)} style={S.btn}
                      onMouseEnter={e => { e.currentTarget.style.background='#1E2E1A'; e.currentTarget.style.color='#F5F0E1'; }}
                      onMouseLeave={e => { e.currentTarget.style.background='white'; e.currentTarget.style.color='#5C6B3A'; }}>
                      <Package size={13} /> Ajustar
                    </button>
                  </td>
                </tr>
              ))}
              {filtrados.length === 0 && (
                <tr><td colSpan={6} style={{...S.td, textAlign:'center', color:'#8fa882', padding:'2rem'}}>No se encontraron productos</td></tr>
              )}
            </tbody>
          </table>
        )}
      </div>
    </AdminSidebar>
  );
}
