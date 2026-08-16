import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { User, Mail, Phone, MessageCircle, CheckCircle, ChevronLeft, ShieldCheck, Loader } from 'lucide-react';
import api from '../services/api';

const WOMPI_WIDGET_SRC = 'https://checkout.wompi.co/widget.js';
const cargarWompiScript = () => new Promise((resolve, reject) => {
  if (window.WidgetCheckout) return resolve();
  const existente = document.querySelector(`script[src="${WOMPI_WIDGET_SRC}"]`);
  if (existente) { existente.addEventListener('load', () => resolve()); return; }
  const script = document.createElement('script');
  script.src = WOMPI_WIDGET_SRC;
  script.onload = () => resolve();
  script.onerror = () => reject(new Error('No se pudo cargar el widget de pagos'));
  document.head.appendChild(script);
});

const C = {
  page:   { minHeight:'100vh', background:'#052a1c', display:'flex', alignItems:'center', justifyContent:'center', padding:'2rem 1rem' },
  card:   { width:'100%', maxWidth:520, background:'white', padding:'2.5rem', boxShadow:'0 20px 60px rgba(0,0,0,0.3)' },
  label:  { display:'block', fontFamily:'Georgia,serif', fontSize:'0.8rem', fontWeight:'bold', color:'#0a3d28', marginBottom:5 },
  wrap:   { position:'relative', marginBottom:'0.85rem' },
  input:  { width:'100%', padding:'10px 12px 10px 38px', border:'1px solid #ddd6c2', fontFamily:'Georgia,serif', fontSize:'0.85rem', color:'#052a1c', outline:'none', background:'#fdfbf6', boxSizing:'border-box' },
  plain:  { width:'100%', padding:'10px 12px', border:'1px solid #ddd6c2', fontFamily:'Georgia,serif', fontSize:'0.85rem', color:'#052a1c', outline:'none', background:'#fdfbf6', boxSizing:'border-box' },
  icon:   { position:'absolute', left:11, top:'50%', transform:'translateY(-50%)', color:'#6ec194', pointerEvents:'none' },
  btn:    { width:'100%', padding:'12px', background:'#052a1c', color:'#F5F0E1', fontFamily:'Georgia,serif', fontSize:'0.88rem', fontWeight:'bold', border:'none', cursor:'pointer', letterSpacing:'0.03em', marginTop:8 },
  errBox: { background:'#fef2f2', border:'1px solid #fecaca', color:'#b91c1c', fontFamily:'Georgia,serif', fontSize:'0.8rem', padding:'10px 12px', marginBottom:'1rem' },
  chip:   (activo) => ({
    padding:'8px 10px', border: activo ? '2px solid #052a1c' : '1px solid #ddd6c2',
    background: activo ? '#052a1c' : '#fdfbf6', color: activo ? '#F5F0E1' : '#052a1c',
    fontFamily:'Georgia,serif', fontSize:'0.8rem', cursor:'pointer', textAlign:'center'
  }),
  servicioCard: (activo) => ({
    display:'block', width:'100%', textAlign:'left', padding:'12px 14px', marginBottom:8,
    border: activo ? '2px solid #052a1c' : '1px solid #ddd6c2', background: activo ? '#eefaf4' : '#fdfbf6',
    cursor:'pointer', fontFamily:'Georgia,serif'
  }),
};

const hoyISO = () => new Date().toISOString().slice(0, 10);
const maxFechaISO = () => { const d = new Date(); d.setDate(d.getDate() + 30); return d.toISOString().slice(0, 10); };

export default function Citas() {
  const [servicios, setServicios]   = useState([]);
  const [servicioId, setServicioId] = useState('');
  const [fecha, setFecha]           = useState(hoyISO());
  const [horarios, setHorarios]     = useState([]);
  const [hora, setHora]             = useState('');
  const [cargandoHorarios, setCargandoHorarios] = useState(false);
  const [form, setForm]             = useState({ nombre:'', email:'', telefono:'', notas:'' });
  const [errores, setErrores]       = useState({});
  const [enviando, setEnviando]     = useState(false);
  const [pagoData, setPagoData]     = useState(null);
  const [scriptListo, setScriptListo] = useState(false);
  const [procesandoPago, setProcesandoPago] = useState(false);
  const [resultado, setResultado]   = useState(null);

  useEffect(() => {
    api.get('/citas/servicios')
      .then(res => {
        setServicios(res.data.servicios);
        if (res.data.servicios[0]) setServicioId(res.data.servicios[0].id);
      })
      .catch(() => setErrores({ general: 'No pudimos cargar los servicios. Intenta de nuevo mas tarde.' }));
    cargarWompiScript().then(() => setScriptListo(true)).catch(() => {});
  }, []);

  useEffect(() => {
    if (!servicioId || !fecha) return;
    setHora('');
    setCargandoHorarios(true);
    api.get(`/citas/disponibilidad?fecha=${fecha}&servicio_id=${servicioId}`)
      .then(res => setHorarios(res.data.horarios))
      .catch(() => setHorarios([]))
      .finally(() => setCargandoHorarios(false));
  }, [servicioId, fecha]);

  const set = (k, v) => { setForm(f => ({...f, [k]:v})); setErrores(e => ({...e, [k]:'', general:''})); };

  const validar = () => {
    const errs = {};
    if (!servicioId) errs.general = 'Selecciona un servicio';
    if (!hora) errs.general = 'Selecciona un horario disponible';
    if (!form.nombre || form.nombre.length < 2) errs.nombre = 'Minimo 2 caracteres';
    if (!form.email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) errs.email = 'Correo invalido';
    if (!form.telefono || !/^\+?[0-9]{7,15}$/.test(form.telefono)) errs.telefono = 'Numero invalido';
    setErrores(errs);
    return !Object.keys(errs).length;
  };

  const continuarAPago = async (e) => {
    e.preventDefault();
    if (!validar()) return;
    setEnviando(true);
    try {
      const { data } = await api.post('/citas/iniciar-pago', {
        servicio_id: servicioId, fecha, hora,
        nombre: form.nombre, email: form.email, telefono: form.telefono,
        notas: form.notas || undefined,
      });
      setPagoData(data);
    } catch (err) {
      setErrores({ general: err.response?.data?.mensaje || 'Error al iniciar la reserva' });
    } finally {
      setEnviando(false);
    }
  };

  const pagar = () => {
    if (!scriptListo || !window.WidgetCheckout || !pagoData) return;
    setProcesandoPago(true);
    const checkout = new window.WidgetCheckout({
      currency: pagoData.currency,
      amountInCents: pagoData.amountInCents,
      reference: pagoData.reference,
      publicKey: pagoData.publicKey,
      signature: { integrity: pagoData.signature },
      customerData: { email: form.email, fullName: form.nombre, phoneNumber: form.telefono, phoneNumberPrefix: '+57' },
    });
    checkout.open((result) => {
      setProcesandoPago(false);
      const tx = result?.transaction;
      if (!tx) { setErrores({ general: 'No se recibió respuesta de la pasarela de pagos.' }); return; }
      if (tx.status === 'APPROVED') setResultado('ok');
      else if (tx.status === 'PENDING') setResultado('pendiente');
      else setErrores({ general: 'El pago no fue aprobado. Puedes intentar de nuevo con otro medio de pago.' });
    });
  };

  const inp = (k, err) => ({...C.input, borderColor: err ? '#fca5a5' : '#ddd6c2'});

  if (resultado === 'ok') {
    return (
      <div style={C.page}>
        <div style={{...C.card, textAlign:'center'}}>
          <div style={{width:70, height:70, background:'#eefaf4', borderRadius:'50%', display:'flex', alignItems:'center', justifyContent:'center', margin:'0 auto 1.5rem'}}>
            <CheckCircle size={36} color="#146b42" />
          </div>
          <h2 style={{fontFamily:'Georgia,serif', fontSize:'1.4rem', fontWeight:'bold', color:'#052a1c', marginBottom:12}}>
            ¡Cita pagada y confirmada!
          </h2>
          <p style={{fontFamily:'Georgia,serif', fontSize:'0.88rem', color:'#146b42', lineHeight:1.7, marginBottom:8}}>
            Te enviamos la confirmación con el comprobante a
          </p>
          <p style={{fontFamily:'Georgia,serif', fontSize:'0.9rem', fontWeight:'bold', color:'#052a1c', marginBottom:24}}>
            {form.email}
          </p>
          <Link to="/" style={{...C.btn, display:'block', textDecoration:'none', textAlign:'center'}}>Volver al inicio</Link>
        </div>
      </div>
    );
  }

  if (resultado === 'pendiente') {
    return (
      <div style={C.page}>
        <div style={{...C.card, textAlign:'center'}}>
          <Loader size={36} color="#e0a83e" style={{margin:'0 auto 1.5rem'}} />
          <h2 style={{fontFamily:'Georgia,serif', fontSize:'1.3rem', fontWeight:'bold', color:'#052a1c', marginBottom:12}}>
            Tu pago está en proceso
          </h2>
          <p style={{fontFamily:'Georgia,serif', fontSize:'0.85rem', color:'#146b42', lineHeight:1.7, marginBottom:24}}>
            Algunos medios de pago como PSE o Nequi tardan unos minutos en confirmarse. Te avisaremos por correo apenas se confirme tu cita.
          </p>
          <Link to="/" style={{...C.btn, display:'block', textDecoration:'none', textAlign:'center'}}>Volver al inicio</Link>
        </div>
      </div>
    );
  }

  if (pagoData) {
    return (
      <div style={C.page}>
        <div style={C.card}>
          <button onClick={() => setPagoData(null)} style={{display:'inline-flex', alignItems:'center', gap:4, background:'none', border:'none', cursor:'pointer', color:'#6ec194', fontFamily:'Georgia,serif', fontSize:'0.8rem', marginBottom:'1rem'}}>
            <ChevronLeft size={14} /> Volver
          </button>
          <p style={{fontFamily:'Georgia,serif', fontSize:'1.3rem', fontWeight:'bold', color:'#052a1c', marginBottom:'1.5rem'}}>Confirma y paga tu cita</p>

          <div style={{background:'#fdfbf6', border:'1px solid #ddd6c2', padding:'16px', marginBottom:'1.5rem'}}>
            <p style={{fontFamily:'Georgia,serif', fontSize:'0.85rem', color:'#052a1c', margin:'2px 0'}}><strong>💆 {pagoData.servicio_nombre}</strong></p>
            <p style={{fontFamily:'Georgia,serif', fontSize:'0.82rem', color:'#146b42', margin:'2px 0'}}>
              {new Date(`${fecha}T00:00:00`).toLocaleDateString('es-CO', { weekday:'long', day:'numeric', month:'long' })} · {hora.slice(0,5)}
            </p>
            <p style={{fontFamily:'Georgia,serif', fontSize:'1.3rem', fontWeight:'bold', color:'#e0a83e', marginTop:8}}>
              ${pagoData.precio.toLocaleString('es-CO')} COP
            </p>
          </div>

          <button onClick={pagar} disabled={!scriptListo || procesandoPago}
            style={{...C.btn, display:'flex', alignItems:'center', justifyContent:'center', gap:8, opacity:(!scriptListo || procesandoPago) ? 0.6 : 1}}>
            <ShieldCheck size={16} />
            {!scriptListo ? 'Cargando pasarela...' : procesandoPago ? 'Procesando...' : `Pagar $${pagoData.precio.toLocaleString('es-CO')} y confirmar`}
          </button>
          <div style={{display:'flex', justifyContent:'center', gap:8, marginTop:12, flexWrap:'wrap'}}>
            {['Nequi', 'PSE', 'Tarjeta'].map(m => (
              <span key={m} style={{fontSize:'0.7rem', fontFamily:'Georgia,serif', color:'#6ec194', border:'1px solid #ddd6c2', padding:'3px 8px'}}>{m}</span>
            ))}
          </div>
          {errores.general && <div style={{...C.errBox, marginTop:16, marginBottom:0}}>{errores.general}</div>}
          <p style={{fontFamily:'Georgia,serif', fontSize:'0.72rem', color:'#6ec194', textAlign:'center', marginTop:14}}>
            Tu horario queda reservado por 30 minutos mientras completas el pago.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div style={C.page}>
      <div style={C.card}>
        <Link to="/" style={{display:'inline-flex', alignItems:'center', gap:4, textDecoration:'none', color:'#6ec194', fontFamily:'Georgia,serif', fontSize:'0.8rem', marginBottom:'1rem'}}>
          <ChevronLeft size={14} /> Volver
        </Link>

        <p style={{fontFamily:'Georgia,serif', fontSize:'1.4rem', fontWeight:'bold', color:'#052a1c', marginBottom:'0.25rem'}}>
          💆 Agenda tu masaje
        </p>
        <p style={{fontFamily:'Georgia,serif', fontSize:'0.82rem', color:'#6ec194', marginBottom:'1.75rem'}}>
          Elige el servicio, la fecha y la hora — el pago se hace en el siguiente paso
        </p>

        {errores.general && <div style={C.errBox}>{errores.general}</div>}

        <form onSubmit={continuarAPago} noValidate>
          <label style={C.label}>Servicio *</label>
          <div style={{marginBottom:'1rem'}}>
            {servicios.map(s => (
              <button type="button" key={s.id} onClick={() => setServicioId(s.id)} style={C.servicioCard(servicioId === s.id)}>
                <div style={{display:'flex', justifyContent:'space-between', alignItems:'baseline'}}>
                  <strong style={{color:'#052a1c', fontSize:'0.88rem'}}>{s.nombre}</strong>
                  <span style={{color:'#e0a83e', fontWeight:'bold', fontSize:'0.85rem'}}>${Number(s.precio).toLocaleString('es-CO')}</span>
                </div>
                <p style={{margin:'4px 0 0', fontSize:'0.75rem', color:'#6ec194'}}>{s.descripcion} · {s.duracion_minutos} min</p>
              </button>
            ))}
          </div>

          <label style={C.label}>Fecha *</label>
          <div style={{marginBottom:'1rem'}}>
            <input type="date" value={fecha} min={hoyISO()} max={maxFechaISO()}
              onChange={e => setFecha(e.target.value)} style={C.plain} />
          </div>

          <label style={C.label}>Hora disponible *</label>
          <div style={{marginBottom:'1rem'}}>
            {cargandoHorarios && <p style={{fontFamily:'Georgia,serif', fontSize:'0.8rem', color:'#6ec194'}}>Buscando horarios...</p>}
            {!cargandoHorarios && horarios.length === 0 && (
              <p style={{fontFamily:'Georgia,serif', fontSize:'0.8rem', color:'#b91c1c'}}>No hay horarios disponibles ese dia, prueba otra fecha.</p>
            )}
            {!cargandoHorarios && horarios.length > 0 && (
              <div style={{display:'grid', gridTemplateColumns:'repeat(4, 1fr)', gap:6}}>
                {horarios.map(h => (
                  <button type="button" key={h} onClick={() => setHora(h)} style={C.chip(hora === h)}>
                    {h.slice(0,5)}
                  </button>
                ))}
              </div>
            )}
          </div>

          <label style={C.label}>Nombre completo *</label>
          <div style={C.wrap}>
            <User size={14} style={C.icon} />
            <input value={form.nombre} onChange={e => set('nombre', e.target.value)} placeholder="Maria Garcia" style={inp('nombre', errores.nombre)} />
          </div>
          {errores.nombre && <p style={{color:'#b91c1c', fontSize:'0.75rem', fontFamily:'Georgia,serif', marginTop:-8, marginBottom:8}}>{errores.nombre}</p>}

          <label style={C.label}>Correo electronico *</label>
          <div style={C.wrap}>
            <Mail size={14} style={C.icon} />
            <input type="email" value={form.email} onChange={e => set('email', e.target.value)} placeholder="tu@correo.com" style={inp('email', errores.email)} />
          </div>
          {errores.email && <p style={{color:'#b91c1c', fontSize:'0.75rem', fontFamily:'Georgia,serif', marginTop:-8, marginBottom:8}}>{errores.email}</p>}

          <label style={C.label}>Celular (WhatsApp) *</label>
          <div style={C.wrap}>
            <Phone size={14} style={C.icon} />
            <input type="tel" value={form.telefono} onChange={e => set('telefono', e.target.value)} placeholder="+57 310 263 1592" style={inp('telefono', errores.telefono)} />
          </div>
          {errores.telefono && <p style={{color:'#b91c1c', fontSize:'0.75rem', fontFamily:'Georgia,serif', marginTop:-8, marginBottom:8}}>{errores.telefono}</p>}

          <label style={C.label}>Notas <span style={{color:'#6ec194', fontWeight:'normal'}}>(opcional)</span></label>
          <div style={C.wrap}>
            <MessageCircle size={14} style={C.icon} />
            <input value={form.notas} onChange={e => set('notas', e.target.value)} placeholder="Alguna molestia o preferencia" style={inp('notas', false)} />
          </div>

          <button type="submit" disabled={enviando || !hora} style={{...C.btn, opacity: (enviando || !hora) ? 0.6 : 1}}>
            {enviando ? 'Procesando...' : 'Continuar al pago'}
          </button>
        </form>
      </div>
    </div>
  );
}
