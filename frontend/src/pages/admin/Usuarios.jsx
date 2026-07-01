import { useEffect, useState } from 'react';
import { UserCheck, UserX, Search } from 'lucide-react';
import AdminSidebar from '../../components/admin/AdminSidebar';
import api from '../../services/api';
import Swal from 'sweetalert2';

const S = {
  h1:    { fontFamily:'Georgia,serif', fontSize:'1.4rem', fontWeight:'bold', color:'#1E2E1A', margin:0 },
  tabla: { width:'100%', borderCollapse:'collapse', background:'white', border:'1px solid #e8e3d8' },
  th:    { fontFamily:'Georgia,serif', fontSize:'0.72rem', fontWeight:'bold', color:'#5a7052', letterSpacing:'0.06em', textTransform:'uppercase', padding:'10px 14px', textAlign:'left', background:'#f7f5f0', borderBottom:'1px solid #e8e3d8' },
  td:    { fontFamily:'Georgia,serif', fontSize:'0.84rem', color:'#1E2E1A', padding:'11px 14px', borderBottom:'1px solid #f0ede8' },
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
      confirmButtonColor:'#1E2E1A', confirmButtonText:'Confirmar', cancelButtonText:'Cancelar',
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
            <Search size={14} style={{position:'absolute', left:10, top:'50%', transform:'translateY(-50%)', color:'#8fa882'}} />
            <input value={buscar} onChange={e => setBuscar(e.target.value)} placeholder="Buscar..."
              style={{fontFamily:'Georgia,serif', fontSize:'0.85rem', border:'1px solid #ddd6c2', padding:'8px 12px 8px 32px', color:'#1E2E1A', background:'#faf8f4', outline:'none', width:220}} />
          </div>
        </div>

        {cargando ? (
          <div style={{display:'flex', justifyContent:'center', padding:'3rem'}}>
            <div style={{width:28, height:28, border:'3px solid #e8e3d8', borderTopColor:'#5C6B3A', borderRadius:'50%', animation:'spin 0.8s linear infinite'}} />
            <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
          </div>
        ) : (
          <table style={S.tabla}>
            <thead>
              <tr>{['Usuario','Email','Telefono','Rol','Pedidos','Total gastado','Estado',''].map(h => <th key={h} style={S.th}>{h}</th>)}</tr>
            </thead>
            <tbody>
              {filtrados.map((u, i) => (
                <tr key={u.id} style={{background: i % 2 === 0 ? 'white' : '#faf8f4'}}>
                  <td style={S.td}>
                    <div style={{display:'flex', alignItems:'center', gap:8}}>
                      <div style={{width:30, height:30, borderRadius:'50%', background:'#1E2E1A', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0}}>
                        <span style={{color:'#C8874A', fontFamily:'Georgia,serif', fontWeight:'bold', fontSize:'0.78rem'}}>{u.nombre?.[0]?.toUpperCase()}</span>
                      </div>
                      <span style={{fontWeight:'bold'}}>{u.nombre} {u.apellido}</span>
                    </div>
                  </td>
                  <td style={{...S.td, color:'#8fa882', fontSize:'0.78rem'}}>{u.email || '—'}</td>
                  <td style={{...S.td, color:'#8fa882', fontSize:'0.78rem'}}>{u.telefono || '—'}</td>
                  <td style={S.td}>
                    <span style={{display:'inline-block', background: u.rol === 'admin' ? '#f5f0ff' : '#f0f7ec', color: u.rol === 'admin' ? '#6d28d9' : '#2d6a1e', fontFamily:'Georgia,serif', fontSize:'0.72rem', fontWeight:'bold', padding:'2px 8px', borderRadius:3}}>
                      {u.rol}
                    </span>
                  </td>
                  <td style={{...S.td, textAlign:'center'}}>{u.total_pedidos}</td>
                  <td style={S.td}><b>${Number(u.total_gastado).toLocaleString('es-CO')}</b></td>
                  <td style={S.td}>
                    <span style={{display:'inline-block', background: u.activo ? '#f0f7ec' : '#fef2f2', color: u.activo ? '#2d6a1e' : '#b91c1c', fontFamily:'Georgia,serif', fontSize:'0.72rem', fontWeight:'bold', padding:'2px 8px', borderRadius:3}}>
                      {u.activo ? 'Activo' : 'Inactivo'}
                    </span>
                  </td>
                  <td style={S.td}>
                    {u.rol !== 'admin' && (
                      <button onClick={() => toggle(u)}
                        style={{background:'none', border:'none', cursor:'pointer', color: u.activo ? '#b91c1c' : '#2d6a1e', padding:4}}
                        title={u.activo ? 'Desactivar' : 'Activar'}>
                        {u.activo ? <UserX size={16} /> : <UserCheck size={16} />}
                      </button>
                    )}
                  </td>
                </tr>
              ))}
              {filtrados.length === 0 && (
                <tr><td colSpan={8} style={{...S.td, textAlign:'center', color:'#8fa882', padding:'2rem'}}>No se encontraron usuarios</td></tr>
              )}
            </tbody>
          </table>
        )}
      </div>
    </AdminSidebar>
  );
}
