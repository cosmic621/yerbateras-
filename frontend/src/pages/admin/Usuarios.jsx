import { useEffect, useState } from 'react';
import { Search } from 'lucide-react';
import AdminSidebar from '../../components/admin/AdminSidebar';
import api from '../../services/api';

const S = {
  h1:    { fontFamily:'var(--font-marca)', fontSize:'1.4rem', fontWeight:'bold', color:'#0f3c27', margin:0 },
  tabla: { width:'100%', borderCollapse:'collapse', background:'white', border:'1px solid #ebe7dc' },
  th:    { fontFamily:'var(--font-marca)', fontSize:'0.72rem', fontWeight:'bold', color:'#2f6549', letterSpacing:'0.06em', textTransform:'uppercase', padding:'10px 14px', textAlign:'left', background:'#fbfaf6', borderBottom:'1px solid #ebe7dc' },
  td:    { fontFamily:'var(--font-marca)', fontSize:'0.9rem', color:'#0f3c27', padding:'11px 14px', borderBottom:'1px solid #f6f3eb' },
};

// Ya no existen cuentas: "clientes" son las personas que han hecho pedidos (se agrupan por correo).
export default function AdminClientes() {
  const [clientes, setClientes] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [buscar, setBuscar] = useState('');

  useEffect(() => { api.get('/admin/usuarios').then(r => setClientes(r.data.usuarios || [])).finally(() => setCargando(false)); }, []);

  const filtrados = clientes.filter(c => `${c.nombre} ${c.email}`.toLowerCase().includes(buscar.toLowerCase()));

  return (
    <AdminSidebar>
      <div style={{ maxWidth: 1000 }}>
        <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:'1.5rem', flexWrap:'wrap', gap:12 }}>
          <h1 style={S.h1}>Clientes</h1>
          <div style={{ position:'relative' }}>
            <Search size={14} style={{ position:'absolute', left:10, top:'50%', transform:'translateY(-50%)', color:'#9dbfa9' }} />
            <input value={buscar} onChange={e => setBuscar(e.target.value)} placeholder="Buscar..."
              style={{ fontFamily:'var(--font-marca)', fontSize:'0.9rem', border:'1px solid #dcd8c9', padding:'8px 12px 8px 32px', color:'#0f3c27', background:'#fbfaf6', outline:'none', width:220 }} />
          </div>
        </div>
        <p style={{ fontFamily:'var(--font-marca)', fontSize:'0.9rem', color:'#2f6549', marginTop:-8, marginBottom:16 }}>
          Personas que han comprado en la tienda. No hay cuentas ni inicio de sesión de clientes.
        </p>
        {cargando ? <p>Cargando...</p> : (
          <table style={S.tabla}>
            <thead><tr>{['Cliente','Correo','Celular','Pedidos','Total pagado','Último pedido'].map(h => <th key={h} style={S.th}>{h}</th>)}</tr></thead>
            <tbody>
              {filtrados.map(c => (
                <tr key={c.email}>
                  <td style={S.td}><b>{c.nombre}</b></td>
                  <td style={S.td}>{c.email}</td>
                  <td style={S.td}>{c.telefono || '—'}</td>
                  <td style={{ ...S.td, textAlign:'center' }}>{c.total_pedidos}</td>
                  <td style={S.td}><b>${Number(c.total_gastado).toLocaleString('es-CO')}</b></td>
                  <td style={S.td}>{c.ultimo_pedido ? new Date(c.ultimo_pedido).toLocaleDateString('es-CO') : '—'}</td>
                </tr>
              ))}
              {filtrados.length === 0 && <tr><td colSpan={6} style={{ ...S.td, textAlign:'center', color:'#9dbfa9', padding:'2rem' }}>Aún no hay clientes</td></tr>}
            </tbody>
          </table>
        )}
      </div>
    </AdminSidebar>
  );
}
