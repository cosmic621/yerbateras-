import { useEffect, useState } from 'react';
import AdminSidebar from '../../components/admin/AdminSidebar';
import api from '../../services/api';
import Swal from 'sweetalert2';

const ESTADOS = ['pendiente','pagado','preparando','enviado','entregado','cancelado'];
const BADGE = {
  pendiente:  { bg:'#fbf7ee', color:'#856a38' },
  pagado:     { bg:'#eff6ff', color:'#1d4ed8' },
  preparando: { bg:'#f0dcec', color:'#6e3163' },
  enviado:    { bg:'#fff7ed', color:'#c2410c' },
  entregado:  { bg:'#f1f6f2', color:'#2f6549' },
  cancelado:  { bg:'#fef2f2', color:'#b91c1c' },
};

const S = {
  h1:    { fontFamily:'var(--font-marca)', fontSize:'1.4rem', fontWeight:'bold', color:'#0f3c27', margin:0 },
  tabla: { width:'100%', borderCollapse:'collapse', background:'white', border:'1px solid #ebe7dc' },
  th:    { fontFamily:'var(--font-marca)', fontSize:'0.72rem', fontWeight:'bold', color:'#2f6549', letterSpacing:'0.06em', textTransform:'uppercase', padding:'10px 14px', textAlign:'left', background:'#fbfaf6', borderBottom:'1px solid #ebe7dc' },
  td:    { fontFamily:'var(--font-marca)', fontSize:'0.84rem', color:'#0f3c27', padding:'11px 14px', borderBottom:'1px solid #f6f3eb' },
  sel:   { fontFamily:'var(--font-marca)', fontSize:'0.82rem', border:'1px solid #dcd8c9', padding:'7px 12px', color:'#0f3c27', background:'#fbfaf6', cursor:'pointer', borderRadius:4 },
  btn:   { fontFamily:'var(--font-marca)', fontSize:'0.78rem', fontWeight:'bold', padding:'5px 11px', border:'1px solid #c6a15b', color:'#c6a15b', background:'white', cursor:'pointer', borderRadius:4 },
};

export default function AdminPedidos() {
  const [pedidos, setPedidos]   = useState([]);
  const [cargando, setCargando] = useState(true);
  const [filtro, setFiltro]     = useState('');

  const cargar = () => {
    setCargando(true);
    const params = filtro ? { estado: filtro } : {};
    api.get('/admin/pedidos', { params }).then(r => setPedidos(r.data.pedidos || [])).finally(() => setCargando(false));
  };
  useEffect(() => { cargar(); }, [filtro]);

  const cambiarEstado = async (pedido) => {
    const { value: estado } = await Swal.fire({
      title: `Pedido ${pedido.numero_pedido}`, input:'select',
      inputOptions: Object.fromEntries(ESTADOS.map(e => [e, e.charAt(0).toUpperCase() + e.slice(1)])),
      inputValue: pedido.estado,
      showCancelButton:true, confirmButtonText:'Actualizar', cancelButtonText:'Cancelar', confirmButtonColor:'#0f3c27',
    });
    if (!estado) return;
    try {
      await api.patch(`/admin/pedidos/${pedido.id}/estado`, { estado });
      cargar();
    } catch (err) {
      Swal.fire({ icon:'error', title:'Error', text: err.response?.data?.mensaje, confirmButtonColor:'#0f3c27' });
    }
  };

  return (
    <AdminSidebar>
      <div style={{maxWidth:1100}}>
        <div style={{display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:'1.5rem', flexWrap:'wrap', gap:12}}>
          <h1 style={S.h1}>Pedidos</h1>
          <select value={filtro} onChange={e => setFiltro(e.target.value)} style={S.sel}>
            <option value="">Todos los estados</option>
            {ESTADOS.map(e => <option key={e} value={e}>{e.charAt(0).toUpperCase() + e.slice(1)}</option>)}
          </select>
        </div>

        {cargando ? (
          <div style={{display:'flex', justifyContent:'center', padding:'3rem'}}>
            <div style={{width:28, height:28, border:'3px solid #ebe7dc', borderTopColor:'#2f6549', borderRadius:'50%', animation:'spin 0.8s linear infinite'}} />
            <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
          </div>
        ) : (
          <table style={S.tabla}>
            <thead>
              <tr>{['N° Pedido','Cliente','Contacto','Enviar a','Total','Estado','Fecha','Accion'].map(h => <th key={h} style={S.th}>{h}</th>)}</tr>
            </thead>
            <tbody>
              {pedidos.map((p, i) => {
                const b = BADGE[p.estado] || { bg:'#f5f5f5', color:'#555' };
                return (
                  <tr key={p.id} style={{background: i % 2 === 0 ? 'white' : '#fbfaf6'}}>
                    <td style={S.td}><span style={{fontFamily:'monospace', fontWeight:'bold', color:'#2f6549', fontSize:'0.82rem'}}>{p.numero_pedido}</span></td>
                    <td style={S.td}>{p.cliente || '—'}</td>
                    <td style={{...S.td, color:'#2f6549', fontSize:'0.78rem'}}>{p.email || '—'}<br />{p.telefono || ''}</td>
                    <td style={{...S.td, fontSize:'0.78rem', maxWidth:220}}>{p.direccion_envio ? `${p.direccion_envio}, ${p.ciudad_envio}, ${p.departamento_envio}` : '—'}{p.notas_cliente ? <div style={{color:'#99631f', marginTop:2}}>Nota: {p.notas_cliente}</div> : null}</td>
                    <td style={S.td}><b>${Number(p.total).toLocaleString('es-CO')}</b></td>
                    <td style={S.td}>
                      <span style={{display:'inline-block', background:b.bg, color:b.color, fontFamily:'var(--font-marca)', fontSize:'0.72rem', fontWeight:'bold', padding:'3px 8px', borderRadius:3}}>
                        {p.estado}
                      </span>
                    </td>
                    <td style={{...S.td, color:'#9dbfa9', fontSize:'0.78rem'}}>{new Date(p.creado_en).toLocaleDateString('es-CO')}</td>
                    <td style={S.td}>
                      <button onClick={() => cambiarEstado(p)} style={S.btn}
                        onMouseEnter={e => { e.currentTarget.style.background='#c6a15b'; e.currentTarget.style.color='white'; }}
                        onMouseLeave={e => { e.currentTarget.style.background='white'; e.currentTarget.style.color='#c6a15b'; }}>
                        Cambiar estado
                      </button>
                    </td>
                  </tr>
                );
              })}
              {pedidos.length === 0 && (
                <tr><td colSpan={7} style={{...S.td, textAlign:'center', color:'#9dbfa9', padding:'2rem'}}>No hay pedidos con este filtro</td></tr>
              )}
            </tbody>
          </table>
        )}
      </div>
    </AdminSidebar>
  );
}
