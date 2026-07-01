import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Mail, Lock, User, Phone, Eye, EyeOff, CheckCircle } from 'lucide-react';
import api from '../services/api';

const C = {
  page:  { minHeight:'100vh', background:'#1E2E1A', display:'flex', alignItems:'center', justifyContent:'center', padding:'2rem 1rem' },
  card:  { width:'100%', maxWidth:460, background:'white', padding:'2.5rem', boxShadow:'0 20px 60px rgba(0,0,0,0.3)' },
  label: { display:'block', fontFamily:'Georgia,serif', fontSize:'0.8rem', fontWeight:'bold', color:'#2d4a22', marginBottom:5 },
  wrap:  { position:'relative', marginBottom:'0.85rem' },
  input: { width:'100%', padding:'10px 12px 10px 38px', border:'1px solid #ddd6c2', fontFamily:'Georgia,serif', fontSize:'0.85rem', color:'#1E2E1A', outline:'none', background:'#faf8f4', boxSizing:'border-box' },
  icon:  { position:'absolute', left:11, top:'50%', transform:'translateY(-50%)', color:'#8fa882', pointerEvents:'none' },
  btn:   { width:'100%', padding:'12px', background:'#1E2E1A', color:'#F5F0E1', fontFamily:'Georgia,serif', fontSize:'0.88rem', fontWeight:'bold', border:'none', cursor:'pointer', letterSpacing:'0.03em', marginTop:8 },
  err:   { color:'#b91c1c', fontSize:'0.75rem', fontFamily:'Georgia,serif', marginTop:-8, marginBottom:8 },
  errBox:{ background:'#fef2f2', border:'1px solid #fecaca', color:'#b91c1c', fontFamily:'Georgia,serif', fontSize:'0.8rem', padding:'10px 12px', marginBottom:'1rem' },
  foot:  { textAlign:'center', fontFamily:'Georgia,serif', fontSize:'0.82rem', color:'#5a7052', marginTop:'1.25rem' },
  link:  { color:'#5C6B3A', fontWeight:'bold', textDecoration:'none' },
};

const Exito = ({ email }) => (
  <div style={C.page}>
    <div style={{...C.card, textAlign:'center'}}>
      <div style={{width:70, height:70, background:'#f0f7ec', borderRadius:'50%', display:'flex', alignItems:'center', justifyContent:'center', margin:'0 auto 1.5rem'}}>
        <CheckCircle size={36} color="#5C6B3A" />
      </div>
      <h2 style={{fontFamily:'Georgia,serif', fontSize:'1.4rem', fontWeight:'bold', color:'#1E2E1A', marginBottom:12}}>
        Registro exitoso
      </h2>
      <p style={{fontFamily:'Georgia,serif', fontSize:'0.88rem', color:'#5a7052', lineHeight:1.7, marginBottom:8}}>
        Enviamos un correo de verificacion a
      </p>
      <p style={{fontFamily:'Georgia,serif', fontSize:'0.9rem', fontWeight:'bold', color:'#1E2E1A', marginBottom:16}}>
        {email}
      </p>
      <p style={{fontFamily:'Georgia,serif', fontSize:'0.82rem', color:'#8fa882', marginBottom:24}}>
        Haz clic en el enlace del correo para activar tu cuenta. Revisa tu carpeta de spam si no lo encuentras.
      </p>
      <Link to="/login" style={{...C.btn, display:'block', textDecoration:'none', textAlign:'center'}}>
        Ir a iniciar sesion
      </Link>
    </div>
  </div>
);

export default function Registro() {
  const [exitoso, setExitoso]     = useState(false);
  const [cargando, setCargando]   = useState(false);
  const [verPass, setVerPass]     = useState(false);
  const [form, setForm]           = useState({ nombre:'', apellido:'', email:'', telefono:'', password:'', confirmar:'' });
  const [errores, setErrores]     = useState({});

  const set = (k, v) => { setForm(f => ({...f, [k]:v})); setErrores(e => ({...e, [k]:'', general:''})); };

  const validar = () => {
    const errs = {};
    if (!form.nombre || form.nombre.length < 2) errs.nombre = 'Minimo 2 caracteres';
    if (!form.email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) errs.email = 'Correo invalido';
    if (!form.password || form.password.length < 8) errs.password = 'Minimo 8 caracteres';
    if (form.password !== form.confirmar) errs.confirmar = 'Las contrasenas no coinciden';
    if (form.telefono && !/^\+?[0-9]{7,15}$/.test(form.telefono)) errs.telefono = 'Numero invalido';
    setErrores(errs);
    return !Object.keys(errs).length;
  };

  const registrar = async (e) => {
    e.preventDefault();
    if (!validar()) return;
    setCargando(true);
    try {
      await api.post('/auth/register', {
        nombre:   form.nombre,
        apellido: form.apellido || undefined,
        email:    form.email,
        telefono: form.telefono || undefined,
        password: form.password,
      });
      setExitoso(true);
    } catch (err) {
      const msg = err.response?.data?.mensaje || 'Error al registrarse';
      setErrores({ general: msg });
    } finally { setCargando(false); }
  };

  if (exitoso) return <Exito email={form.email} />;

  const inp = (k, err) => ({...C.input, borderColor: err ? '#fca5a5' : '#ddd6c2'});

  return (
    <div style={C.page}>
      <div style={C.card}>
        {/* Logo */}
        <div style={{display:'flex', alignItems:'center', justifyContent:'center', gap:10, marginBottom:'2rem'}}>
          <Link to="/" style={{display:'flex', alignItems:'center', gap:10, textDecoration:'none'}}>
            <div style={{width:36, height:36, background:'#C8874A', display:'flex', alignItems:'center', justifyContent:'center'}}>
              <span style={{fontFamily:'Georgia,serif', fontWeight:'bold', color:'#1E2E1A', fontStyle:'italic'}}>Y</span>
            </div>
            <span style={{fontFamily:'Georgia,serif', fontSize:'1.3rem', fontWeight:'bold', color:'#1E2E1A'}}>Yerbateras</span>
          </Link>
        </div>

        <p style={{fontFamily:'Georgia,serif', fontSize:'1.4rem', fontWeight:'bold', color:'#1E2E1A', textAlign:'center', marginBottom:'0.25rem'}}>
          Crear cuenta
        </p>
        <p style={{fontFamily:'Georgia,serif', fontSize:'0.82rem', color:'#8fa882', textAlign:'center', marginBottom:'1.75rem'}}>
          Registrate gratis para acceder a la tienda
        </p>

        {errores.general && <div style={C.errBox}>{errores.general}</div>}

        <form onSubmit={registrar} noValidate>
          {/* Nombre y apellido */}
          <div style={{display:'grid', gridTemplateColumns:'1fr 1fr', gap:12}}>
            <div>
              <label style={C.label}>Nombre *</label>
              <div style={C.wrap}>
                <User size={14} style={C.icon} />
                <input value={form.nombre} onChange={e => set('nombre', e.target.value)}
                  placeholder="Maria" style={inp('nombre', errores.nombre)} />
              </div>
              {errores.nombre && <p style={C.err}>{errores.nombre}</p>}
            </div>
            <div>
              <label style={C.label}>Apellido</label>
              <div style={C.wrap}>
                <User size={14} style={C.icon} />
                <input value={form.apellido} onChange={e => set('apellido', e.target.value)}
                  placeholder="Garcia" style={inp('apellido', false)} />
              </div>
            </div>
          </div>

          {/* Email */}
          <label style={C.label}>Correo electronico *</label>
          <div style={C.wrap}>
            <Mail size={14} style={C.icon} />
            <input type="email" value={form.email} onChange={e => set('email', e.target.value)}
              placeholder="tu@correo.com" style={inp('email', errores.email)} />
          </div>
          {errores.email && <p style={C.err}>{errores.email}</p>}

          {/* Telefono */}
          <label style={C.label}>Celular <span style={{color:'#8fa882', fontWeight:'normal'}}>(opcional)</span></label>
          <div style={C.wrap}>
            <Phone size={14} style={C.icon} />
            <input type="tel" value={form.telefono} onChange={e => set('telefono', e.target.value)}
              placeholder="+57 310 263 1592" style={inp('telefono', errores.telefono)} />
          </div>
          {errores.telefono && <p style={C.err}>{errores.telefono}</p>}

          {/* Contrasena */}
          <label style={C.label}>Contrasena * <span style={{color:'#8fa882', fontWeight:'normal'}}>(min. 8 caracteres)</span></label>
          <div style={C.wrap}>
            <Lock size={14} style={C.icon} />
            <input type={verPass ? 'text' : 'password'} value={form.password} onChange={e => set('password', e.target.value)}
              placeholder="Minimo 8 caracteres"
              style={{...inp('password', errores.password), paddingRight:38}} />
            <button type="button" onClick={() => setVerPass(!verPass)}
              style={{position:'absolute', right:10, top:'50%', transform:'translateY(-50%)', background:'none', border:'none', cursor:'pointer', color:'#8fa882'}}>
              {verPass ? <EyeOff size={14} /> : <Eye size={14} />}
            </button>
          </div>
          {errores.password && <p style={C.err}>{errores.password}</p>}

          {/* Confirmar */}
          <label style={C.label}>Confirmar contrasena *</label>
          <div style={C.wrap}>
            <Lock size={14} style={C.icon} />
            <input type="password" value={form.confirmar} onChange={e => set('confirmar', e.target.value)}
              placeholder="Repite tu contrasena" style={inp('confirmar', errores.confirmar)} />
          </div>
          {errores.confirmar && <p style={C.err}>{errores.confirmar}</p>}

          <p style={{fontFamily:'Georgia,serif', fontSize:'0.75rem', color:'#8fa882', margin:'8px 0'}}>
            Al registrarte aceptas nuestros terminos de uso y politica de privacidad.
          </p>

          <button type="submit" disabled={cargando} style={{...C.btn, opacity: cargando ? 0.7 : 1}}>
            {cargando ? 'Creando cuenta...' : 'Crear cuenta gratis'}
          </button>
        </form>

        <p style={C.foot}>
          Ya tienes cuenta?{' '}
          <Link to="/login" style={C.link}>Inicia sesion</Link>
        </p>
      </div>
    </div>
  );
}
