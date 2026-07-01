import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Mail, Lock, Phone, Eye, EyeOff } from 'lucide-react';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import Swal from 'sweetalert2';

const C = {
  page:   { minHeight:'100vh', background:'#1E2E1A', display:'flex', alignItems:'center', justifyContent:'center', padding:'2rem 1rem' },
  card:   { width:'100%', maxWidth:420, background:'white', padding:'2.5rem', boxShadow:'0 20px 60px rgba(0,0,0,0.3)' },
  logo:   { display:'flex', alignItems:'center', justifyContent:'center', gap:10, marginBottom:'2rem' },
  logoBox:{ width:36, height:36, background:'#C8874A', display:'flex', alignItems:'center', justifyContent:'center' },
  title:  { fontFamily:'Georgia,serif', fontSize:'1.5rem', fontWeight:'bold', color:'#1E2E1A', textAlign:'center', marginBottom:'0.25rem' },
  sub:    { fontFamily:'Georgia,serif', fontSize:'0.82rem', color:'#8fa882', textAlign:'center', marginBottom:'1.75rem' },
  tabs:   { display:'flex', border:'1px solid #ddd6c2', marginBottom:'1.5rem', overflow:'hidden' },
  tabA:   { flex:1, padding:'10px', fontFamily:'Georgia,serif', fontSize:'0.82rem', fontWeight:'bold', border:'none', cursor:'pointer', transition:'all 0.2s' },
  label:  { display:'block', fontFamily:'Georgia,serif', fontSize:'0.8rem', fontWeight:'bold', color:'#2d4a22', marginBottom:6 },
  wrap:   { position:'relative', marginBottom:'1rem' },
  input:  { width:'100%', padding:'10px 12px 10px 38px', border:'1px solid #ddd6c2', fontFamily:'Georgia,serif', fontSize:'0.85rem', color:'#1E2E1A', outline:'none', background:'#faf8f4', boxSizing:'border-box' },
  icon:   { position:'absolute', left:11, top:'50%', transform:'translateY(-50%)', color:'#8fa882', pointerEvents:'none' },
  btn:    { width:'100%', padding:'12px', background:'#1E2E1A', color:'#F5F0E1', fontFamily:'Georgia,serif', fontSize:'0.88rem', fontWeight:'bold', border:'none', cursor:'pointer', letterSpacing:'0.03em', marginTop:4 },
  btnG:   { width:'100%', padding:'12px', background:'#C8874A', color:'#1E2E1A', fontFamily:'Georgia,serif', fontSize:'0.88rem', fontWeight:'bold', border:'none', cursor:'pointer', letterSpacing:'0.03em', marginTop:4 },
  err:    { background:'#fef2f2', border:'1px solid #fecaca', color:'#b91c1c', fontFamily:'Georgia,serif', fontSize:'0.8rem', padding:'10px 12px', marginBottom:'1rem' },
  div:    { display:'flex', alignItems:'center', gap:10, margin:'1.2rem 0' },
  divL:   { flex:1, height:1, background:'#ddd6c2' },
  divT:   { fontFamily:'Georgia,serif', fontSize:'0.75rem', color:'#8fa882', whiteSpace:'nowrap' },
  foot:   { textAlign:'center', fontFamily:'Georgia,serif', fontSize:'0.82rem', color:'#5a7052', marginTop:'1.25rem' },
  link:   { color:'#5C6B3A', fontWeight:'bold', textDecoration:'none' },
};

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [tab, setTab]             = useState('email');
  const [verPass, setVerPass]     = useState(false);
  const [cargando, setCargando]   = useState(false);
  const [otpEnviado, setOtpEnviado] = useState(false);
  const [form, setForm]           = useState({ email:'', password:'', telefono:'', otp:'' });
  const [errores, setErrores]     = useState({});

  const set = (k, v) => { setForm(f => ({...f, [k]:v})); setErrores(e => ({...e, [k]:'', general:''})); };

  const validarEmail = () => {
    const errs = {};
    if (!form.email) errs.email = 'El correo es requerido';
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) errs.email = 'Correo invalido';
    if (!form.password) errs.password = 'La contrasena es requerida';
    setErrores(errs);
    return !Object.keys(errs).length;
  };

  const loginEmail = async (e) => {
    e.preventDefault();
    if (!validarEmail()) return;
    setCargando(true);
    try {
      const { data } = await api.post('/auth/login', { email: form.email, password: form.password });
      login(data.token, data.usuario);
      navigate(data.usuario.rol === 'admin' ? '/admin' : '/tienda');
    } catch (err) {
      const msg = err.response?.data?.mensaje || 'Credenciales invalidas';
      if (err.response?.data?.requiere_verificacion) {
        Swal.fire({ icon:'warning', title:'Cuenta sin verificar', text:'Revisa tu correo y haz clic en el enlace de verificacion.', confirmButtonColor:'#1E2E1A' });
      } else {
        setErrores({ general: msg });
      }
    } finally { setCargando(false); }
  };

  const enviarOtp = async (e) => {
    e.preventDefault();
    if (!form.telefono) { setErrores({ telefono:'El telefono es requerido' }); return; }
    setCargando(true);
    try {
      await api.post('/auth/send-otp', { telefono: form.telefono });
      setOtpEnviado(true);
    } catch (err) {
      setErrores({ telefono: err.response?.data?.mensaje || 'Error al enviar codigo' });
    } finally { setCargando(false); }
  };

  const verificarOtp = async (e) => {
    e.preventDefault();
    if (!form.otp) { setErrores({ otp:'Ingresa el codigo' }); return; }
    setCargando(true);
    try {
      const { data } = await api.post('/auth/verify-otp', { telefono: form.telefono, otp: form.otp });
      login(data.token, data.usuario);
      navigate('/tienda');
    } catch (err) {
      setErrores({ otp: err.response?.data?.mensaje || 'Codigo invalido' });
    } finally { setCargando(false); }
  };

  const loginGoogle = () => {
    if (typeof window.google === 'undefined') {
      Swal.fire({ icon:'info', title:'Google no disponible', text:'Configura VITE_GOOGLE_CLIENT_ID en el .env del frontend', confirmButtonColor:'#1E2E1A' });
      return;
    }
    window.google.accounts.id.initialize({
      client_id: import.meta.env.VITE_GOOGLE_CLIENT_ID,
      callback: async ({ credential }) => {
        setCargando(true);
        try {
          const { data } = await api.post('/auth/google', { credential });
          login(data.token, data.usuario);
          navigate(data.usuario.rol === 'admin' ? '/admin' : '/tienda');
        } catch (err) {
          Swal.fire({ icon:'error', title:'Error', text: err.response?.data?.mensaje, confirmButtonColor:'#1E2E1A' });
        } finally { setCargando(false); }
      }
    });
    window.google.accounts.id.prompt();
  };

  const tabStyle = (t) => ({
    ...C.tabA,
    background: tab === t ? '#1E2E1A' : 'white',
    color:      tab === t ? '#F5F0E1' : '#5a7052',
  });

  return (
    <div style={C.page}>
      <div style={C.card}>
        {/* Logo */}
        <div style={C.logo}>
          <Link to="/" style={{display:'flex', alignItems:'center', gap:10, textDecoration:'none'}}>
            <div style={C.logoBox}>
              <span style={{fontFamily:'Georgia,serif', fontWeight:'bold', color:'#1E2E1A', fontStyle:'italic'}}>Y</span>
            </div>
            <span style={{fontFamily:'Georgia,serif', fontSize:'1.3rem', fontWeight:'bold', color:'#1E2E1A'}}>Yerbateras</span>
          </Link>
        </div>

        <p style={C.title}>Bienvenido</p>
        <p style={C.sub}>Ingresa a tu cuenta para continuar</p>

        {/* Tabs */}
        <div style={C.tabs}>
          <button style={tabStyle('email')} onClick={() => setTab('email')}>Correo</button>
          <button style={tabStyle('phone')} onClick={() => setTab('phone')}>Telefono</button>
        </div>

        {/* Error general */}
        {errores.general && <div style={C.err}>{errores.general}</div>}

        {/* Formulario email */}
        {tab === 'email' && (
          <form onSubmit={loginEmail} noValidate>
            <div>
              <label style={C.label}>Correo electronico</label>
              <div style={C.wrap}>
                <Mail size={15} style={C.icon} />
                <input type="email" value={form.email} onChange={e => set('email', e.target.value)}
                  placeholder="tu@correo.com" style={{...C.input, borderColor: errores.email ? '#fca5a5' : '#ddd6c2'}} />
              </div>
              {errores.email && <p style={{color:'#b91c1c', fontSize:'0.75rem', fontFamily:'Georgia,serif', marginBottom:8}}>{errores.email}</p>}
            </div>

            <div>
              <label style={C.label}>Contrasena</label>
              <div style={{...C.wrap, marginBottom: errores.password ? 4 : '1rem'}}>
                <Lock size={15} style={C.icon} />
                <input type={verPass ? 'text' : 'password'} value={form.password} onChange={e => set('password', e.target.value)}
                  placeholder="Tu contrasena"
                  style={{...C.input, paddingRight:38, borderColor: errores.password ? '#fca5a5' : '#ddd6c2'}} />
                <button type="button" onClick={() => setVerPass(!verPass)}
                  style={{position:'absolute', right:10, top:'50%', transform:'translateY(-50%)', background:'none', border:'none', cursor:'pointer', color:'#8fa882'}}>
                  {verPass ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
              </div>
              {errores.password && <p style={{color:'#b91c1c', fontSize:'0.75rem', fontFamily:'Georgia,serif', marginBottom:8}}>{errores.password}</p>}
            </div>

            <button type="submit" disabled={cargando} style={{...C.btn, opacity: cargando ? 0.7 : 1}}>
              {cargando ? 'Ingresando...' : 'Iniciar sesion'}
            </button>
          </form>
        )}

        {/* Formulario telefono */}
        {tab === 'phone' && (
          <form onSubmit={otpEnviado ? verificarOtp : enviarOtp} noValidate>
            <div>
              <label style={C.label}>Numero de celular</label>
              <div style={C.wrap}>
                <Phone size={15} style={C.icon} />
                <input type="tel" value={form.telefono} onChange={e => set('telefono', e.target.value)}
                  placeholder="+57 310 263 1592" disabled={otpEnviado}
                  style={{...C.input, borderColor: errores.telefono ? '#fca5a5' : '#ddd6c2', background: otpEnviado ? '#f0ede8' : '#faf8f4'}} />
              </div>
              {errores.telefono && <p style={{color:'#b91c1c', fontSize:'0.75rem', fontFamily:'Georgia,serif', marginBottom:8}}>{errores.telefono}</p>}
            </div>

            {otpEnviado && (
              <div>
                <label style={C.label}>Codigo de verificacion</label>
                <input type="text" value={form.otp} onChange={e => set('otp', e.target.value)}
                  placeholder="123456" maxLength={6}
                  style={{...C.input, textAlign:'center', fontSize:'1.3rem', letterSpacing:'0.3em', paddingLeft:12, borderColor: errores.otp ? '#fca5a5' : '#ddd6c2', marginBottom:4}} />
                {errores.otp && <p style={{color:'#b91c1c', fontSize:'0.75rem', fontFamily:'Georgia,serif', marginBottom:8}}>{errores.otp}</p>}
                <button type="button" onClick={() => { setOtpEnviado(false); set('otp',''); }}
                  style={{background:'none', border:'none', cursor:'pointer', color:'#5C6B3A', fontFamily:'Georgia,serif', fontSize:'0.78rem', marginBottom:12}}>
                  Cambiar numero
                </button>
              </div>
            )}

            <button type="submit" disabled={cargando} style={{...C.btn, opacity: cargando ? 0.7 : 1}}>
              {cargando ? 'Procesando...' : otpEnviado ? 'Verificar codigo' : 'Enviar codigo'}
            </button>
          </form>
        )}

        {/* Divisor */}
        <div style={C.div}>
          <div style={C.divL} />
          <span style={C.divT}>o continua con</span>
          <div style={C.divL} />
        </div>

        {/* Google */}
        <button onClick={loginGoogle} disabled={cargando}
          style={{...C.btn, background:'white', color:'#2d4a22', border:'1px solid #ddd6c2', display:'flex', alignItems:'center', justifyContent:'center', gap:10, marginTop:0, opacity: cargando ? 0.7 : 1}}>
          <svg width="18" height="18" viewBox="0 0 48 48">
            <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/>
            <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/>
            <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"/>
            <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.18 1.48-4.97 2.31-8.16 2.31-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/>
          </svg>
          Continuar con Google
        </button>

        <p style={C.foot}>
          No tienes cuenta?{' '}
          <Link to="/registro" style={C.link}>Registrate gratis</Link>
        </p>
      </div>
    </div>
  );
}
