import { useState, useEffect } from 'react';
import { Briefcase, X, CheckCircle, Building2, User, Mail, Phone, Package, Hash, MessageSquare } from 'lucide-react';
import api from '../../services/api';

const VACIO = { organizacion: '', nombre_contacto: '', email: '', telefono: '', interes: '', cantidad_estimada: '', mensaje: '' };

export default function CotizacionBtn() {
  const [abierto, setAbierto] = useState(false);
  const [form, setForm] = useState(VACIO);
  const [enviando, setEnviando] = useState(false);
  const [enviado, setEnviado] = useState(false);
  const [error, setError] = useState('');

  // El menú "Servicios → Empresas y grupos" abre este mismo formulario
  useEffect(() => {
    const abrir = () => setAbierto(true);
    window.addEventListener('abrir-cotizacion', abrir);
    return () => window.removeEventListener('abrir-cotizacion', abrir);
  }, []);

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
    width: '100%', padding: '9px 12px 9px 36px', border: '1px solid #dcd8c9',
    fontFamily: 'var(--font-marca)', fontSize: '0.85rem', color: '#0f3c27',
    background: '#fbfaf6', outline: 'none', boxSizing: 'border-box',
  };
  const iconStyle = { position: 'absolute', left: 11, top: '50%', transform: 'translateY(-50%)', color: '#9dbfa9' };
  const labelStyle = { display: 'block', fontFamily: 'var(--font-marca)', fontSize: '0.78rem', fontWeight: 'bold', color: '#16422e', marginBottom: 4, marginTop: 12 };

  return (
    <>
      {/* Sin botón flotante: se abre desde el menú Servicios, el pie de página y Contacto */}

      {abierto && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 100, display: 'flex', alignItems: 'flex-end', justifyContent: 'flex-start', padding: '1.5rem' }}>
          <div onClick={cerrar} style={{ position: 'absolute', inset: 0, background: 'rgba(5,42,28,0.5)' }} />
          <div style={{
            position: 'relative', width: 380, maxWidth: '100%', maxHeight: '85vh', overflowY: 'auto',
            background: 'white', boxShadow: '0 20px 60px rgba(0,0,0,0.3)',
          }}>
            <div style={{ background: '#0f3c27', padding: '16px 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <Briefcase size={18} color="#c6a15b" />
                <p style={{ fontFamily: 'var(--font-marca)', fontWeight: 'bold', color: '#f6f3eb', margin: 0 }}>Cotización para tu organización</p>
              </div>
              <button onClick={cerrar} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#9dbfa9' }}><X size={18} /></button>
            </div>

            <div style={{ padding: '20px' }}>
              {enviado ? (
                <div style={{ textAlign: 'center', padding: '1.5rem 0' }}>
                  <CheckCircle size={44} color="#2f6549" style={{ margin: '0 auto 14px' }} />
                  <p style={{ fontFamily: 'var(--font-marca)', fontWeight: 'bold', color: '#0f3c27', marginBottom: 8 }}>¡Solicitud enviada!</p>
                  <p style={{ fontFamily: 'var(--font-marca)', fontSize: '0.85rem', color: '#2f6549' }}>
                    Te contactaremos pronto para armar tu cotización.
                  </p>
                </div>
              ) : (
                <form onSubmit={enviar} noValidate>
                  <p style={{ fontFamily: 'var(--font-marca)', fontSize: '0.8rem', color: '#2f6549', marginBottom: 8 }}>
                    Cuéntanos qué necesita tu organización (kits corporativos, regalos empresariales, talleres para tu equipo, eventos) y te armamos una cotización a la medida.
                  </p>
                  {error && (
                    <div style={{ background: '#fef2f2', border: '1px solid #fecaca', color: '#b91c1c', fontFamily: 'var(--font-marca)', fontSize: '0.78rem', padding: '8px 12px', marginTop: 10 }}>
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
                    <select value={form.interes} onChange={e => set('interes', e.target.value)} style={{ ...inputStyle, cursor: 'pointer' }}>
                      <option value="">Selecciona una opción</option>
                      <option value="Kits corporativos / regalos empresariales">Kits corporativos / regalos empresariales</option>
                      <option value="Talleres para mi empresa o grupo">Talleres para mi empresa o grupo</option>
                      <option value="Masajes / jornada de bienestar para el equipo">Masajes / jornada de bienestar para el equipo</option>
                      <option value="Eventos">Eventos</option>
                      <option value="Otro">Otro</option>
                    </select>
                  </div>

                  <label style={labelStyle}>Cantidad estimada (kits o personas)</label>
                  <div style={{ position: 'relative' }}>
                    <Hash size={14} style={iconStyle} />
                    <input type="number" min="1" value={form.cantidad_estimada} onChange={e => set('cantidad_estimada', e.target.value)} placeholder="Ej: 50" style={inputStyle} />
                  </div>

                  <label style={labelStyle}>Mensaje (opcional)</label>
                  <div style={{ position: 'relative' }}>
                    <MessageSquare size={14} style={{ ...iconStyle, top: 16 }} />
                    <textarea value={form.mensaje} onChange={e => set('mensaje', e.target.value)} placeholder="Fecha tentativa, número de personas, temática del taller..." rows={3} style={{ ...inputStyle, paddingTop: 9, resize: 'vertical' }} />
                  </div>

                  <button type="submit" disabled={enviando}
                    style={{
                      width: '100%', marginTop: 18, padding: '11px', background: '#0f3c27', color: '#f6f3eb',
                      border: 'none', fontFamily: 'var(--font-marca)', fontWeight: 'bold', fontSize: '0.85rem',
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
