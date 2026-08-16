import { useState, useEffect, useCallback } from 'react';
import { Lock, Calendar, Phone, Mail, CheckCircle2, XCircle, Clock3, RefreshCw } from 'lucide-react';
import api from '../services/api';

const TOKEN_KEY = 'yb_agenda_token';
const hoyISO = () => new Date().toISOString().slice(0, 10);

const ESTADOS = {
  confirmada:   { label: 'Confirmada',   color: '#2d6a44', bg: '#f0f7ec' },
  completada:   { label: 'Completada',   color: '#5C6B3A', bg: '#eef4e6' },
  no_asistio:   { label: 'No asistió',   color: '#b91c1c', bg: '#fef2f2' },
  cancelada:    { label: 'Cancelada',    color: '#8fa882', bg: '#f5f5f0' },
};

const C = {
  page:  { minHeight:'100vh', background:'#f5f5f0', fontFamily:'Georgia,serif' },
  header:{ background:'#1E2E1A', padding:'1.25rem 1.5rem', display:'flex', alignItems:'center', justifyContent:'space-between' },
  wrap:  { maxWidth:720, margin:'0 auto', padding:'1.5rem' },
};

function PinGate({ onOk }) {
  const [pin, setPin] = useState('');
  const [error, setError] = useState('');
  const [cargando, setCargando] = useState(false);

  const entrar = async (e) => {
    e.preventDefault();
    setCargando(true);
    setError('');
    try {
      const res = await api.post('/citas/agenda/acceso', { pin });
      localStorage.setItem(TOKEN_KEY, res.data.token);
      onOk();
    } catch (err) {
      setError(err.response?.data?.mensaje || 'Error al ingresar');
    } finally {
      setCargando(false);
    }
  };

  return (
    <div style={{minHeight:'100vh', background:'#1E2E1A', display:'flex', alignItems:'center', justifyContent:'center', padding:'2rem'}}>
      <form onSubmit={entrar} style={{background:'white', padding:'2.5rem', maxWidth:340, width:'100%', boxShadow:'0 20px 60px rgba(0,0,0,0.3)', textAlign:'center'}}>
        <div style={{width:52, height:52, background:'#f0f7ec', borderRadius:'50%', display:'flex', alignItems:'center', justifyContent:'center', margin:'0 auto 1.25rem'}}>
          <Lock size={22} color="#5C6B3A" />
        </div>
        <p style={{fontFamily:'Georgia,serif', fontSize:'1.2rem', fontWeight:'bold', color:'#1E2E1A', marginBottom:6}}>Agenda de citas</p>
        <p style={{fontFamily:'Georgia,serif', fontSize:'0.8rem', color:'#8fa882', marginBottom:20}}>Ingresa el PIN para ver las citas del día</p>
        {error && <div style={{background:'#fef2f2', border:'1px solid #fecaca', color:'#b91c1c', fontSize:'0.8rem', padding:'8px 10px', marginBottom:12}}>{error}</div>}
        <input
          type="password" inputMode="numeric" value={pin} onChange={e => setPin(e.target.value)}
          placeholder="PIN" autoFocus
          style={{width:'100%', padding:'12px', border:'1px solid #ddd6c2', background:'#faf8f4', fontFamily:'Georgia,serif', fontSize:'1rem', textAlign:'center', letterSpacing:'0.3em', outline:'none', boxSizing:'border-box', marginBottom:14}}
        />
        <button type="submit" disabled={cargando || !pin} style={{width:'100%', padding:'12px', background:'#1E2E1A', color:'#F5F0E1', fontFamily:'Georgia,serif', fontWeight:'bold', fontSize:'0.88rem', border:'none', cursor:'pointer', opacity:(cargando || !pin) ? 0.6 : 1}}>
          {cargando ? 'Verificando...' : 'Entrar'}
        </button>
      </form>
    </div>
  );
}

function TarjetaCita({ cita, onActualizar }) {
  const est = ESTADOS[cita.estado] || ESTADOS.confirmada;
  const [actualizando, setActualizando] = useState(false);

  const cambiar = async (nuevoEstado) => {
    setActualizando(true);
    try {
      await api.patch(`/citas/${cita.id}/estado`, { estado: nuevoEstado }, {
        headers: { Authorization: `Bearer ${localStorage.getItem(TOKEN_KEY)}` }
      });
      onActualizar();
    } finally {
      setActualizando(false);
    }
  };

  const waLink = `https://wa.me/${cita.telefono_cliente.replace(/[^0-9]/g,'')}`;

  return (
    <div style={{background:'white', border:'1px solid #e8e0cc', padding:'14px 16px', marginBottom:10, opacity: actualizando ? 0.6 : 1}}>
      <div style={{display:'flex', justifyContent:'space-between', alignItems:'flex-start', gap:10}}>
        <div>
          <div style={{display:'flex', alignItems:'center', gap:8, marginBottom:4}}>
            <Clock3 size={14} color="#5C6B3A" />
            <strong style={{color:'#1E2E1A', fontSize:'0.95rem'}}>{cita.hora_inicio.slice(0,5)} - {cita.hora_fin.slice(0,5)}</strong>
            <span style={{fontSize:'0.7rem', padding:'2px 8px', borderRadius:10, background:est.bg, color:est.color, fontWeight:'bold'}}>{est.label}</span>
          </div>
          <p style={{margin:'2px 0', fontSize:'0.85rem', color:'#2d4a22'}}>💆 {cita.servicio_nombre}</p>
          <p style={{margin:'2px 0', fontSize:'0.85rem', color:'#2d4a22', fontWeight:'bold'}}>{cita.nombre_cliente}</p>
          <p style={{margin:'2px 0', fontSize:'0.78rem', color:'#8fa882', display:'flex', alignItems:'center', gap:5}}>
            <Phone size={11} /> {cita.telefono_cliente}
          </p>
          <p style={{margin:'2px 0', fontSize:'0.78rem', color:'#8fa882', display:'flex', alignItems:'center', gap:5}}>
            <Mail size={11} /> {cita.email_cliente}
          </p>
          {cita.notas && <p style={{margin:'6px 0 0', fontSize:'0.78rem', color:'#5a7052', fontStyle:'italic'}}>"{cita.notas}"</p>}
        </div>
      </div>

      <div style={{display:'flex', gap:6, marginTop:12, flexWrap:'wrap'}}>
        <a href={waLink} target="_blank" rel="noreferrer"
          style={{fontSize:'0.75rem', padding:'6px 10px', background:'#25D366', color:'white', border:'none', textDecoration:'none', display:'flex', alignItems:'center', gap:4}}>
          WhatsApp
        </a>
        {cita.estado === 'confirmada' && (
          <>
            <button onClick={() => cambiar('completada')} disabled={actualizando}
              style={{fontSize:'0.75rem', padding:'6px 10px', background:'#5C6B3A', color:'white', border:'none', cursor:'pointer', display:'flex', alignItems:'center', gap:4}}>
              <CheckCircle2 size={12} /> Completada
            </button>
            <button onClick={() => cambiar('no_asistio')} disabled={actualizando}
              style={{fontSize:'0.75rem', padding:'6px 10px', background:'#b91c1c', color:'white', border:'none', cursor:'pointer', display:'flex', alignItems:'center', gap:4}}>
              <XCircle size={12} /> No asistió
            </button>
            <button onClick={() => cambiar('cancelada')} disabled={actualizando}
              style={{fontSize:'0.75rem', padding:'6px 10px', background:'white', color:'#8fa882', border:'1px solid #ddd6c2', cursor:'pointer'}}>
              Cancelar
            </button>
          </>
        )}
      </div>
    </div>
  );
}

function VistaAgenda({ onSalir }) {
  const [fecha, setFecha]   = useState(hoyISO());
  const [citas, setCitas]   = useState([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError]   = useState('');

  const cargar = useCallback(() => {
    setCargando(true);
    setError('');
    api.get(`/citas/agenda?fecha=${fecha}`, {
      headers: { Authorization: `Bearer ${localStorage.getItem(TOKEN_KEY)}` }
    })
      .then(res => setCitas(res.data.citas))
      .catch(err => {
        if (err.response?.status === 401) {
          localStorage.removeItem(TOKEN_KEY);
          onSalir();
        } else {
          setError('No se pudo cargar la agenda');
        }
      })
      .finally(() => setCargando(false));
  }, [fecha, onSalir]);

  useEffect(() => { cargar(); }, [cargar]);

  return (
    <div style={C.page}>
      <div style={C.header}>
        <div style={{display:'flex', alignItems:'center', gap:8}}>
          <Calendar size={18} color="#C8874A" />
          <span style={{color:'#F5F0E1', fontWeight:'bold'}}>Agenda de citas — Yerbateras</span>
        </div>
        <button onClick={() => { localStorage.removeItem(TOKEN_KEY); onSalir(); }}
          style={{background:'none', border:'1px solid #5C6B3A', color:'#F5F0E1', fontSize:'0.75rem', padding:'6px 12px', cursor:'pointer'}}>
          Salir
        </button>
      </div>

      <div style={C.wrap}>
        <div style={{display:'flex', gap:10, alignItems:'center', marginBottom:'1.25rem'}}>
          <input type="date" value={fecha} onChange={e => setFecha(e.target.value)}
            style={{padding:'10px 12px', border:'1px solid #ddd6c2', background:'white', fontFamily:'Georgia,serif', fontSize:'0.85rem'}} />
          <button onClick={cargar} style={{padding:'10px', background:'white', border:'1px solid #ddd6c2', cursor:'pointer', display:'flex', alignItems:'center'}} aria-label="Recargar">
            <RefreshCw size={15} color="#5C6B3A" />
          </button>
          <span style={{fontSize:'0.8rem', color:'#5a7052'}}>{citas.length} cita{citas.length !== 1 ? 's' : ''}</span>
        </div>

        {cargando && <p style={{color:'#8fa882'}}>Cargando...</p>}
        {error && <p style={{color:'#b91c1c'}}>{error}</p>}
        {!cargando && !error && citas.length === 0 && (
          <p style={{color:'#8fa882', fontStyle:'italic'}}>No hay citas para este día.</p>
        )}
        {!cargando && citas.map(c => <TarjetaCita key={c.id} cita={c} onActualizar={cargar} />)}
      </div>
    </div>
  );
}

export default function Agenda() {
  const [autenticado, setAutenticado] = useState(!!localStorage.getItem(TOKEN_KEY));

  if (!autenticado) return <PinGate onOk={() => setAutenticado(true)} />;
  return <VistaAgenda onSalir={() => setAutenticado(false)} />;
}
