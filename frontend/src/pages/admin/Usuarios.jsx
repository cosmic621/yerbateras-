import { useEffect, useState } from 'react';
import { UserCheck, UserX, Search } from 'lucide-react';
import AdminSidebar from '../../components/admin/AdminSidebar';
import api from '../../services/api';
import Swal from 'sweetalert2';

const S = {
  h1:    { fontFamily:'Georgia,serif', fontSize:'1.4rem', fontWeight:'bold', color:'#052a1c', margin:0 },
  tabla: { width:'100%', borderCollapse:'collapse', background:'white', border:'1px solid #ede8da' },
  th:    { fontFamily:'Georgia,serif', fontSize:'0.72rem', fontWeight:'bold', color:'#146b42', letterSpacing:'0.06em', textTransform:'uppercase', padding:'10px 14px', textAlign:'left', background:'#fdfbf6', borderBottom:'1px solid #ede8da' },
  td:    { fontFamily:'Georgia,serif', fontSize:'0.84rem', color:'#052a1c', padding:'11px 14px', borderBottom:'1px solid #F5F0E1' },
};

export default function AdminUsuarios() {
  const [usuarios, setUsuarios]   = useState([]);
  const [cargando, setCargando]   = useState(true);
  const [buscar, setBuscar]       = useState('');

  const cargar = () => {
    setCargando(true);
    api.get('/admin/usuarios').then(r => setUsuarios(r.data.usuarios || [])).finally(() => setCargando(false));
  };
  useEffect(() => { cargar(); }, []);

  const toggle = async (u) => {
    const accion = u.activo ? 'desactivar' : 'activar';
    const res = await Swal.fire({
      icon:'warning', title:`${accion.charAt(0).toUpperCase() + accion.slice(1)} usuario`,
      text: u.nombre, showCancelButton:true,
      confirmButtonColor:'#052a1c', confirmButtonText:'Confirmar', cancelButtonText:'Cancelar',
    });
    if (res.isConfirmed) { await api.patch(`/admin/usuarios/${u.id}/toggle`); cargar(); }
  };

  const filtrados = usuarios.filter(u =>
    `${u.nombre} ${u.email}`.toLowerCase().includes(buscar.toLowerCase())
  );

  return (
    <AdminSidebar>
      <div style={{maxWidth:1100}}>
        <div style={{display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:'1.5rem', flexWrap:'wrap', gap:12}}>
          <h1 style={S.h1}>Usuarios</h1>
          <div style={{position:'relative'}}>
            <Search size={14} style={{position:'absolute', left:10, top:'50%', transform:'translateY(-50%)', color:'#6ec194'}} />
            <input value={buscar} onChange={e => setBuscar(e.target.value)} placeholder="Buscar..."
              style={{fontFamily:'Georgia,serif', fontSize:'0.85rem', border:'1px solid #ddd6c2', padding:'8px 12px 8px 32px', color:'#052a1c', background:'#fdfbf6', outline:'none', width:220}} />
          </div>
        </div>

        {cargando ? (
          <div style={{display:'flex', justifyContent:'center', padding:'3rem'}}>
            <div style={{width:28, height:28, border:'3px solid #ede8da', borderTopColor:'#146b42', borderRadius:'50%', animation:'spin 0.8s linear infinite'}} />
            <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
          </div>
        ) : (
          <table style={S.tabla}>
            <thead>
              <tr>{['Usuario','Email','Telefono','Rol','Pedidos','Total gastado','Estado',''].map(h => <th key={h} style={S.th}>{h}</th>)}</tr>
            </thead>
            <tbody>
              {filtrados.map((u, i) => (
                <tr key={u.id} style={{background: i % 2 === 0 ? 'white' : '#fdfbf6'}}>
                  <td style={S.td}>
                    <div style={{display:'flex', alignItems:'center', gap:8}}>
                      <div style={{width:30, height:30, borderRadius:'50%', background:'#052a1c', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0}}>
                        <span style={{color:'#e0a83e', fontFamily:'Georgia,serif', fontWeight:'bold', fontSize:'0.78rem'}}>{u.nombre?.[0]?.toUpperCase()}</span>
                      </div>
                      <span style={{fontWeight:'bold'}}>{u.nombre} {u.apellido}</span>
                    </div>
                  </td>
                  <td style={{...S.td, color:'#6ec194', fontSize:'0.78rem'}}>{u.email || '—'}</td>
                  <td style={{...S.td, color:'#6ec194', fontSize:'0.78rem'}}>{u.telefono || '—'}</td>
                  <td style={S.td}>
                    <span style={{display:'inline-block', background: u.rol === 'admin' ? '#f0dcec' : '#eefaf4', color: u.rol === 'admin' ? '#6e3163' : '#146b42', fontFamily:'Georgia,serif', fontSize:'0.72rem', fontWeight:'bold', padding:'2px 8px', borderRadius:3}}>
                      {u.rol}
                    </span>
                  </td>
                  <td style={{...S.td, textAlign:'center'}}>{u.total_pedidos}</td>
                  <td style={S.td}><b>${Number(u.total_gastado).toLocaleString('es-CO')}</b></td>
                  <td style={S.td}>
                    <span style={{display:'inline-block', background: u.activo ? '#eefaf4' : '#fef2f2', color: u.activo ? '#146b42' : '#b91c1c', fontFamily:'Georgia,serif', fontSize:'0.72rem', fontWeight:'bold', padding:'2px 8px', borderRadius:3}}>
                      {u.activo ? 'Activo' : 'Inactivo'}
                    </span>
                  </td>
                  <td style={S.td}>
                    {u.rol !== 'admin' && (
                      <button onClick={() => toggle(u)}
                        style={{background:'none', border:'none', cursor:'pointer', color: u.activo ? '#b91c1c' : '#146b42', padding:4}}
                        title={u.activo ? 'Desactivar' : 'Activar'}>
                        {u.activo ? <UserX size={16} /> : <UserCheck size={16} />}
                      </button>
                    )}
                  </td>
                </tr>
              ))}
              {filtrados.length === 0 && (
                <tr><td colSpan={8} style={{...S.td, textAlign:'center', color:'#6ec194', padding:'2rem'}}>No se encontraron usuarios</td></tr>
              )}
            </tbody>
          </table>
        )}
      </div>
    </AdminSidebar>
  );
}
