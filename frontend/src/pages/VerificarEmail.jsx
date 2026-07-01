import { useEffect, useState } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { CheckCircle, XCircle, Loader } from 'lucide-react';
import api from '../services/api';

export default function VerificarEmail() {
  const [searchParams] = useSearchParams();
  const [estado, setEstado] = useState('cargando');
  const token = searchParams.get('token');

  useEffect(() => {
    if (!token) { setEstado('error'); return; }
    api.get(`/auth/verify-email?token=${token}`)
      .then(() => setEstado('ok'))
      .catch(() => setEstado('error'));
  }, [token]);

  const page = { minHeight:'100vh', background:'#1E2E1A', display:'flex', alignItems:'center', justifyContent:'center', padding:'2rem' };
  const card = { background:'white', padding:'3rem 2.5rem', maxWidth:380, width:'100%', textAlign:'center', boxShadow:'0 20px 60px rgba(0,0,0,0.3)' };
  const btn  = { display:'block', padding:'12px', background:'#1E2E1A', color:'#F5F0E1', fontFamily:'Georgia,serif', fontWeight:'bold', fontSize:'0.88rem', textDecoration:'none', textAlign:'center', marginTop:24 };

  return (
    <div style={page}>
      <div style={card}>
        <div style={{width:36, height:36, background:'#C8874A', display:'flex', alignItems:'center', justifyContent:'center', margin:'0 auto 1.5rem'}}>
          <span style={{fontFamily:'Georgia,serif', fontWeight:'bold', color:'#1E2E1A', fontStyle:'italic'}}>Y</span>
        </div>

        {estado === 'cargando' && (
          <>
            <div style={{display:'flex', justifyContent:'center', marginBottom:16}}>
              <Loader size={36} color="#5C6B3A" style={{animation:'spin 1s linear infinite'}} />
              <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
            </div>
            <p style={{fontFamily:'Georgia,serif', color:'#5a7052'}}>Verificando tu cuenta...</p>
          </>
        )}

        {estado === 'ok' && (
          <>
            <CheckCircle size={40} color="#5C6B3A" style={{margin:'0 auto 16px', display:'block'}} />
            <h2 style={{fontFamily:'Georgia,serif', fontSize:'1.4rem', fontWeight:'bold', color:'#1E2E1A', marginBottom:12}}>
              Cuenta verificada
            </h2>
            <p style={{fontFamily:'Georgia,serif', fontSize:'0.88rem', color:'#5a7052', lineHeight:1.7}}>
              Tu cuenta esta activa. Ya puedes iniciar sesion y explorar nuestros productos naturales.
            </p>
            <Link to="/login" style={btn}>Iniciar sesion</Link>
          </>
        )}

        {estado === 'error' && (
          <>
            <XCircle size={40} color="#b91c1c" style={{margin:'0 auto 16px', display:'block'}} />
            <h2 style={{fontFamily:'Georgia,serif', fontSize:'1.3rem', fontWeight:'bold', color:'#1E2E1A', marginBottom:12}}>
              Enlace invalido
            </h2>
            <p style={{fontFamily:'Georgia,serif', fontSize:'0.85rem', color:'#5a7052', lineHeight:1.7}}>
              El enlace de verificacion expiro o no es valido. Intenta registrarte nuevamente.
            </p>
            <Link to="/registro" style={btn}>Volver al registro</Link>
          </>
        )}
      </div>
    </div>
  );
}
