import { useState } from 'react';
import { Briefcase, X, CheckCircle, Building2, User, Mail, Phone, Package, Hash, MessageSquare } from 'lucide-react';
import api from '../../services/api';

const VACIO = { organizacion: '', nombre_contacto: '', email: '', telefono: '', interes: '', cantidad_estimada: '', mensaje: '' };

export default function CotizacionBtn() {
  const [abierto, setAbierto] = useState(false);
  const [form, setForm] = useState(VACIO);
  const [enviando, setEnviando] = useState(false);
  const [enviado, setEnviado] = useState(false);
  const [error, setError] = useState('');

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const cerrar = () => {
    setAbierto(false);
    setTimeout(() => { setEnviado(false); setForm(VACIO); setError(''); }, 300);
  };

  const enviar = async (e) => {
    e.preventDefault();
    if (!form.organizacion.trim() || !form.nombre_contacto.trim() || !form.email.trim() || !form.telefono.trim()) {
      setError('Organización, contacto, correo y teléfono son requeridos');
      return;
    }
    setEnviando(true);
    setError('');
    try {
      await api.post('/cotizaciones', {
        ...form,
        cantidad_estimada: form.cantidad_estimada ? Number(form.cantidad_estimada) : undefined,
      });
      setEnviado(true);
    } catch (err) {
      setError(err.response?.data?.mensaje || 'No se pudo enviar la solicitud, intenta de nuevo');
    } finally {
      setEnviando(false);
    }
  };

  const inputStyle = {
    width: '100%', padding: '9px 12px 9px 36px', border: '1px solid #ddd6c2',
    fontFamily: 'Georgia,serif', fontSize: '0.85rem', color: '#052a1c',
    background: '#fdfbf6', outline: 'none', boxSizing: 'border-box',
  };
  const iconStyle = { position: 'absolute', left: 11, top: '50%', transform: 'translateY(-50%)', color: '#6ec194' };
  const labelStyle = { display: 'block', fontFamily: 'Georgia,serif', fontSize: '0.78rem', fontWeight: 'bold', color: '#0a3d28', marginBottom: 4, marginTop: 12 };

  return (
    <>
      {!abierto && (
        <button
          onClick={() => setAbierto(true)}
          aria-label="Solicitar cotización para organizaciones"
          style={{
            position: 'fixed', bottom: '1.5rem', left: '1.5rem', zIndex: 50,
            display: 'flex', alignItems: 'center', gap: 8,
            background: '#e0a83e', color: '#052a1c', border: 'none',
            padding: '11px 18px', borderRadius: 999,
            fontFamily: 'Georgia,serif', fontWeight: 'bold', fontSize: '0.82rem',
            boxShadow: '0 4px 16px rgba(224,168,62,0.5)', cursor: 'pointer',
            transition: 'transform 0.2s ease',
          }}
          onMouseEnter={e => e.currentTarget.style.transform = 'scale(1.05)'}
          onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'}
        >
          <Briefcase size={16} /> Cotización para empresas
        </button>
      )}

      {abierto && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 100, display: 'flex', alignItems: 'flex-end', justifyContent: 'flex-start', padding: '1.5rem' }}>
          <div onClick={cerrar} style={{ position: 'absolute', inset: 0, background: 'rgba(5,42,28,0.5)' }} />
          <div style={{
            position: 'relative', width: 380, maxWidth: '100%', maxHeight: '85vh', overflowY: 'auto',
            background: 'white', boxShadow: '0 20px 60px rgba(0,0,0,0.3)',
          }}>
            <div style={{ background: '#052a1c', padding: '16px 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <Briefcase size={18} color="#e0a83e" />
                <p style={{ fontFamily: 'Georgia,serif', fontWeight: 'bold', color: '#F5F0E1', margin: 0 }}>Cotización para tu organización</p>
              </div>
              <button onClick={cerrar} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#6ec194' }}><X size={18} /></button>
            </div>

            <div style={{ padding: '20px' }}>
              {enviado ? (
                <div style={{ textAlign: 'center', padding: '1.5rem 0' }}>
                  <CheckCircle size={44} color="#146b42" style={{ margin: '0 auto 14px' }} />
                  <p style={{ fontFamily: 'Georgia,serif', fontWeight: 'bold', color: '#052a1c', marginBottom: 8 }}>¡Solicitud enviada!</p>
                  <p style={{ fontFamily: 'Georgia,serif', fontSize: '0.85rem', color: '#146b42' }}>
                    Te contactaremos pronto para armar tu cotización.
                  </p>
                </div>
              ) : (
                <form onSubmit={enviar} noValidate>
                  <p style={{ fontFamily: 'Georgia,serif', fontSize: '0.8rem', color: '#146b42', marginBottom: 8 }}>
                    Cuéntanos qué necesita tu organización (kits corporativos, regalos empresariales, eventos) y te armamos una cotización a la medida.
                  </p>
                  {error && (
                    <div style={{ background: '#fef2f2', border: '1px solid #fecaca', color: '#b91c1c', fontFamily: 'Georgia,serif', fontSize: '0.78rem', padding: '8px 12px', marginTop: 10 }}>
                      {error}
                    </div>
                  )}

                  <label style={labelStyle}>Organización *</label>
                  <div style={{ position: 'relative' }}>
                    <Building2 size={14} style={iconStyle} />
                    <input value={form.organizacion} onChange={e => set('organizacion', e.target.value)} placeholder="Nombre de la empresa" style={inputStyle} />
                  </div>

                  <label style={labelStyle}>Persona de contacto *</label>
                  <div style={{ position: 'relative' }}>
                    <User size={14} style={iconStyle} />
                    <input value={form.nombre_contacto} onChange={e => set('nombre_contacto', e.target.value)} placeholder="Tu nombre" style={inputStyle} />
                  </div>

                  <label style={labelStyle}>Correo *</label>
                  <div style={{ position: 'relative' }}>
                    <Mail size={14} style={iconStyle} />
                    <input type="email" value={form.email} onChange={e => set('email', e.target.value)} placeholder="tu@empresa.com" style={inputStyle} />
                  </div>

                  <label style={labelStyle}>Teléfono *</label>
                  <div style={{ position: 'relative' }}>
                    <Phone size={14} style={iconStyle} />
                    <input value={form.telefono} onChange={e => set('telefono', e.target.value)} placeholder="+57 300 000 0000" style={inputStyle} />
                  </div>

                  <label style={labelStyle}>¿Qué te interesa?</label>
                  <div style={{ position: 'relative' }}>
                    <Package size={14} style={iconStyle} />
                    <input value={form.interes} onChange={e => set('interes', e.target.value)} placeholder="Ej: kits de regalo para empleados" style={inputStyle} />
                  </div>

                  <label style={labelStyle}>Cantidad estimada</label>
                  <div style={{ position: 'relative' }}>
                    <Hash size={14} style={iconStyle} />
                    <input type="number" min="1" value={form.cantidad_estimada} onChange={e => set('cantidad_estimada', e.target.value)} placeholder="Ej: 50" style={inputStyle} />
                  </div>

                  <label style={labelStyle}>Mensaje (opcional)</label>
                  <div style={{ position: 'relative' }}>
                    <MessageSquare size={14} style={{ ...iconStyle, top: 16 }} />
                    <textarea value={form.mensaje} onChange={e => set('mensaje', e.target.value)} placeholder="Detalles adicionales..." rows={3} style={{ ...inputStyle, paddingTop: 9, resize: 'vertical' }} />
                  </div>

                  <button type="submit" disabled={enviando}
                    style={{
                      width: '100%', marginTop: 18, padding: '11px', background: '#052a1c', color: '#F5F0E1',
                      border: 'none', fontFamily: 'Georgia,serif', fontWeight: 'bold', fontSize: '0.85rem',
                      cursor: 'pointer', opacity: enviando ? 0.6 : 1,
                    }}>
                    {enviando ? 'Enviando...' : 'Solicitar cotización'}
                  </button>
                </form>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
