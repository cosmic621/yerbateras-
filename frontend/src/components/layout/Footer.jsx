import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Instagram, Facebook, Mail, Phone, MapPin, Shield, Send, Check } from 'lucide-react';
import api from '../../services/api';

const INSTAGRAM = 'https://www.instagram.com/yerbaterass/';
const FACEBOOK  = 'https://www.facebook.com/share/1NTDTKzjRM/?mibextid=wwXIfr';
const WHATSAPP  = 'https://wa.me/573102631592';

function Newsletter() {
  const [email, setEmail] = useState('');
  const [estado, setEstado] = useState('idle'); // idle | enviando | ok | error
  const [error, setError] = useState('');

  const suscribir = async (e) => {
    e.preventDefault();
    if (!email.trim()) return;
    setEstado('enviando');
    setError('');
    try {
      await api.post('/newsletter/suscribir', { email: email.trim() });
      setEstado('ok');
      setEmail('');
    } catch (err) {
      setEstado('error');
      setError(err.response?.data?.mensaje || 'No se pudo suscribir, intenta de nuevo');
    }
  };

  return (
    <div style={{ background:'rgba(245,240,225,0.04)', borderBottom:'1px solid rgba(245,240,225,0.06)' }}>
      <div className="max-w-7xl mx-auto px-6 lg:px-12 py-8 flex flex-col md:flex-row items-center justify-between gap-4">
        <div>
          <p style={{ fontFamily:'Georgia,serif', fontWeight:'bold', color:'#F5F0E1', fontSize:'1rem', margin:0 }}>
            Suscríbete a nuestras novedades
          </p>
          <p style={{ fontFamily:'Georgia,serif', color:'#6ec194', fontSize:'0.82rem', margin:0 }}>
            Nuevos productos, promociones y consejos de bienestar natural.
          </p>
        </div>
        {estado === 'ok' ? (
          <p style={{ fontFamily:'Georgia,serif', color:'#6ec194', fontSize:'0.85rem', display:'flex', alignItems:'center', gap:6 }}>
            <Check size={16} color="#e0a83e" /> ¡Gracias por suscribirte!
          </p>
        ) : (
          <form onSubmit={suscribir} style={{ display:'flex', gap:8, width:'100%', maxWidth:360 }}>
            <input
              type="email" required value={email} onChange={e => setEmail(e.target.value)}
              placeholder="tu@correo.com"
              style={{ flex:1, padding:'9px 14px', background:'rgba(245,240,225,0.06)', border:'1px solid rgba(245,240,225,0.15)', color:'#F5F0E1', fontFamily:'Georgia,serif', fontSize:'0.85rem', outline:'none' }}
            />
            <button type="submit" disabled={estado === 'enviando'}
              style={{ background:'#e0a83e', color:'#052a1c', border:'none', padding:'0 16px', display:'flex', alignItems:'center', gap:6, fontFamily:'Georgia,serif', fontWeight:'bold', fontSize:'0.82rem', cursor:'pointer', whiteSpace:'nowrap' }}>
              <Send size={13} /> {estado === 'enviando' ? '...' : 'Suscribirme'}
            </button>
          </form>
        )}
        {error && <p style={{ fontFamily:'Georgia,serif', color:'#e08585', fontSize:'0.78rem' }}>{error}</p>}
      </div>
    </div>
  );
}

export default function Footer() {
  return (
    <footer style={{background:'#052a1c', color:'#a8dec0'}}>
      {/* Franja superior decorativa */}
      <div style={{height:3, background:'linear-gradient(90deg, #e0a83e, #146b42, #e0a83e)'}} />

      <Newsletter />

      <div className="max-w-7xl mx-auto px-6 lg:px-12 py-16">
        <div className="grid md:grid-cols-4 gap-10">
          {/* Marca */}
          <div className="md:col-span-1">
            <div className="flex items-center gap-2.5 mb-5">
              <div style={{width:32, height:32, background:'#e0a83e', display:'flex', alignItems:'center', justifyContent:'center'}}>
                <span style={{fontFamily:'Georgia,serif', fontWeight:'bold', color:'#052a1c', fontSize:'0.9rem', fontStyle:'italic'}}>Y</span>
              </div>
              <span style={{fontFamily:'Georgia,serif', fontWeight:'bold', color:'#F5F0E1', fontSize:'1.2rem'}}>Yerbateras</span>
            </div>
            <p style={{fontFamily:'Georgia,serif', fontSize:'0.85rem', lineHeight:1.7, color:'#6ec194', marginBottom:'1.25rem'}}>
              Productos herbales artesanales y experiencias educativas para el autocuidado a traves de las plantas medicinales. Certificado INVIMA.
            </p>
            <div className="flex gap-2.5">
              {[
                { href: INSTAGRAM, icon: <Instagram size={14} />, label: 'Instagram' },
                { href: FACEBOOK,  icon: <Facebook size={14} />,  label: 'Facebook' },
                { href: WHATSAPP,  icon: <svg viewBox="0 0 24 24" width="14" height="14" fill="currentColor"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>, label: 'WhatsApp' },
              ].map(({ href, icon, label }) => (
                <a key={label} href={href} target="_blank" rel="noreferrer" aria-label={label}
                  style={{width:34, height:34, border:'1px solid rgba(200,135,74,0.25)', display:'flex', alignItems:'center', justifyContent:'center', color:'#6ec194', textDecoration:'none', transition:'all 0.2s'}}
                  onMouseEnter={e => { e.currentTarget.style.borderColor='#e0a83e'; e.currentTarget.style.color='#e0a83e'; }}
                  onMouseLeave={e => { e.currentTarget.style.borderColor='rgba(200,135,74,0.25)'; e.currentTarget.style.color='#6ec194'; }}>
                  {icon}
                </a>
              ))}
            </div>
          </div>

          {/* Navegacion */}
          <div>
            <h4 style={{fontFamily:'Georgia,serif', fontSize:'0.75rem', fontWeight:'bold', color:'#e0a83e', letterSpacing:'0.1em', textTransform:'uppercase', marginBottom:'1rem'}}>
              Navegacion
            </h4>
            <ul style={{listStyle:'none', padding:0, margin:0, display:'flex', flexDirection:'column', gap:'0.5rem'}}>
              {[['/', 'Inicio'], ['/tienda', 'Tienda'], ['/nosotros', 'Nosotros'], ['/citas', 'Agendar cita']].map(([to, label]) => (
                <li key={to}>
                  <a href={to} style={{color:'#6ec194', fontFamily:'Georgia,serif', fontSize:'0.85rem', textDecoration:'none', transition:'color 0.2s'}}
                    onMouseEnter={e => e.target.style.color='#F5F0E1'}
                    onMouseLeave={e => e.target.style.color='#6ec194'}>
                    {label}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* Productos */}
          <div>
            <h4 style={{fontFamily:'Georgia,serif', fontSize:'0.75rem', fontWeight:'bold', color:'#e0a83e', letterSpacing:'0.1em', textTransform:'uppercase', marginBottom:'1rem'}}>
              Productos
            </h4>
            <ul style={{listStyle:'none', padding:0, margin:0, display:'flex', flexDirection:'column', gap:'0.5rem'}}>
              {[
                ['Cannabis Medicinal', 'cannabis-medicinal'],
                ['Aceites & Tinturas', 'aceites-tinturas'],
                ['Infusiones & Tés', 'infusiones-tes'],
                ['Cremas & Tópicos', 'cremas-topicos'],
                ['Suplementos', 'suplementos'],
              ].map(([nombre, slug]) => (
                <li key={slug}>
                  <Link to={`/tienda?categoria=${slug}`}
                    style={{color:'#6ec194', fontFamily:'Georgia,serif', fontSize:'0.85rem', textDecoration:'none', transition:'color 0.2s'}}
                    onMouseEnter={e => e.target.style.color='#F5F0E1'}
                    onMouseLeave={e => e.target.style.color='#6ec194'}>
                    {nombre}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Contacto */}
          <div>
            <h4 style={{fontFamily:'Georgia,serif', fontSize:'0.75rem', fontWeight:'bold', color:'#e0a83e', letterSpacing:'0.1em', textTransform:'uppercase', marginBottom:'1rem'}}>
              Contacto
            </h4>
            <div style={{display:'flex', flexDirection:'column', gap:'0.75rem'}}>
              <a href={WHATSAPP} target="_blank" rel="noreferrer"
                style={{display:'flex', alignItems:'flex-start', gap:8, color:'#6ec194', fontFamily:'Georgia,serif', fontSize:'0.85rem', textDecoration:'none'}}>
                <Phone size={13} style={{marginTop:2, color:'#e0a83e', flexShrink:0}} />
                +57 310 263 1592
              </a>
              <a href={`mailto:info@yerbateras.co`}
                style={{display:'flex', alignItems:'flex-start', gap:8, color:'#6ec194', fontFamily:'Georgia,serif', fontSize:'0.85rem', textDecoration:'none'}}>
                <Mail size={13} style={{marginTop:2, color:'#e0a83e', flexShrink:0}} />
                info@yerbateras.co
              </a>
              <div style={{display:'flex', alignItems:'flex-start', gap:8}}>
                <MapPin size={13} style={{marginTop:2, color:'#e0a83e', flexShrink:0}} />
                <span style={{fontFamily:'Georgia,serif', fontSize:'0.85rem'}}>Colombia</span>
              </div>
              <div style={{display:'flex', alignItems:'center', gap:6, border:'1px solid rgba(200,135,74,0.25)', padding:'6px 10px', marginTop:4}}>
                <Shield size={12} style={{color:'#e0a83e'}} />
                <span style={{fontFamily:'Georgia,serif', fontSize:'0.75rem', color:'#6ec194'}}>Certificado INVIMA</span>
              </div>
            </div>
          </div>
        </div>

        <div style={{borderTop:'1px solid rgba(245,240,225,0.08)', marginTop:'3rem', paddingTop:'1.5rem'}}>
          <div className="flex flex-wrap items-center justify-center gap-2 mb-6">
            {['Tarjeta crédito/débito', 'PSE', 'Pago contraentrega'].map(m => (
              <span key={m} style={{border:'1px solid rgba(245,240,225,0.15)', color:'#6ec194', fontFamily:'Georgia,serif', fontSize:'0.72rem', padding:'5px 12px'}}>
                {m}
              </span>
            ))}
          </div>
          <div className="flex flex-col items-center gap-2">
            <p style={{fontFamily:'Georgia,serif', fontSize:'0.8rem', color:'#146b42', textAlign:'center'}}>
              {new Date().getFullYear()} Yerbateras · Todos los derechos reservados
            </p>
            <p style={{fontFamily:'Georgia,serif', fontSize:'0.75rem', color:'#0a3d28', letterSpacing:'0.04em'}}>
              Medicina natural certificada · Uso responsable
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
}
