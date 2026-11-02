import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { HeroSeccion, Texto, Subtitulo, Lista, Cierre } from '../components/ui/Seccion';
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
  page:   { minHeight:'100vh', background:'#0f3c27', display:'flex', alignItems:'center', justifyContent:'center', padding:'2rem 1rem' },
  card:   { width:'100%', maxWidth:520, background:'white', padding:'2.5rem', boxShadow:'0 20px 60px rgba(0,0,0,0.3)' },
  label:  { display:'block', fontFamily:'var(--font-marca)', fontSize:'0.8rem', fontWeight:'bold', color:'#16422e', marginBottom:5 },
  wrap:   { position:'relative', marginBottom:'0.85rem' },
  input:  { width:'100%', padding:'10px 12px 10px 38px', border:'1px solid #dcd8c9', fontFamily:'var(--font-marca)', fontSize:'0.85rem', color:'#0f3c27', outline:'none', background:'#fbfaf6', boxSizing:'border-box' },
  plain:  { width:'100%', padding:'10px 12px', border:'1px solid #dcd8c9', fontFamily:'var(--font-marca)', fontSize:'0.85rem', color:'#0f3c27', outline:'none', background:'#fbfaf6', boxSizing:'border-box' },
  icon:   { position:'absolute', left:11, top:'50%', transform:'translateY(-50%)', color:'#9dbfa9', pointerEvents:'none' },
  btn:    { width:'100%', padding:'12px', background:'#0f3c27', color:'#f6f3eb', fontFamily:'var(--font-marca)', fontSize:'0.88rem', fontWeight:'bold', border:'none', cursor:'pointer', letterSpacing:'0.03em', marginTop:8 },
  errBox: { background:'#fef2f2', border:'1px solid #fecaca', color:'#b91c1c', fontFamily:'var(--font-marca)', fontSize:'0.8rem', padding:'10px 12px', marginBottom:'1rem' },
  chip:   (activo) => ({
    padding:'8px 10px', border: activo ? '2px solid #0f3c27' : '1px solid #dcd8c9',
    background: activo ? '#0f3c27' : '#fbfaf6', color: activo ? '#f6f3eb' : '#0f3c27',
    fontFamily:'var(--font-marca)', fontSize:'0.8rem', cursor:'pointer', textAlign:'center'
  }),
  servicioCard: (activo) => ({
    display:'block', width:'100%', textAlign:'left', padding:'12px 14px', marginBottom:8,
    border: activo ? '2px solid #0f3c27' : '1px solid #dcd8c9', background: activo ? '#f1f6f2' : '#fbfaf6',
    cursor:'pointer', fontFamily:'var(--font-marca)'
  }),
};

const hoyISO = () => new Date().toLocaleDateString('en-CA', { timeZone: 'America/Bogota' });
const maxFechaISO = () => { const d = new Date(Date.now() + 30 * 864e5); return d.toLocaleDateString('en-CA', { timeZone: 'America/Bogota' }); };

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
  const [aceptaPolitica, setAceptaPolitica] = useState(false);

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
    if (!aceptaPolitica) errs.general = 'Debes aceptar la política de cancelación y reprogramación';
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
        acepta_politica: true,
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

  const inp = (k, err) => ({...C.input, borderColor: err ? '#fca5a5' : '#dcd8c9'});

  if (resultado === 'ok') {
    return (
      <div style={C.page}>
        <div style={{...C.card, textAlign:'center'}}>
          <div style={{width:70, height:70, background:'#f1f6f2', borderRadius:'50%', display:'flex', alignItems:'center', justifyContent:'center', margin:'0 auto 1.5rem'}}>
            <CheckCircle size={36} color="#2f6549" />
          </div>
          <h2 style={{fontFamily:'var(--font-marca)', fontSize:'1.4rem', fontWeight:'bold', color:'#0f3c27', marginBottom:12}}>
            ¡Cita pagada y confirmada!
          </h2>
          <p style={{fontFamily:'var(--font-marca)', fontSize:'0.88rem', color:'#2f6549', lineHeight:1.7, marginBottom:8}}>
            Te enviamos la confirmación con el comprobante a
          </p>
          <p style={{fontFamily:'var(--font-marca)', fontSize:'0.9rem', fontWeight:'bold', color:'#0f3c27', marginBottom:24}}>
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
          <Loader size={36} color="#c6a15b" style={{margin:'0 auto 1.5rem'}} />
          <h2 style={{fontFamily:'var(--font-marca)', fontSize:'1.3rem', fontWeight:'bold', color:'#0f3c27', marginBottom:12}}>
            Tu pago está en proceso
          </h2>
          <p style={{fontFamily:'var(--font-marca)', fontSize:'0.85rem', color:'#2f6549', lineHeight:1.7, marginBottom:24}}>
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
          <button onClick={() => setPagoData(null)} style={{display:'inline-flex', alignItems:'center', gap:4, background:'none', border:'none', cursor:'pointer', color:'#9dbfa9', fontFamily:'var(--font-marca)', fontSize:'0.8rem', marginBottom:'1rem'}}>
            <ChevronLeft size={14} /> Volver
          </button>
          <p style={{fontFamily:'var(--font-marca)', fontSize:'1.3rem', fontWeight:'bold', color:'#0f3c27', marginBottom:'1.5rem'}}>Confirma y paga tu cita</p>

          <div style={{background:'#fbfaf6', border:'1px solid #dcd8c9', padding:'16px', marginBottom:'1.5rem'}}>
            <p style={{fontFamily:'var(--font-marca)', fontSize:'0.85rem', color:'#0f3c27', margin:'2px 0'}}><strong>💆 {pagoData.servicio_nombre}</strong></p>
            <p style={{fontFamily:'var(--font-marca)', fontSize:'0.82rem', color:'#2f6549', margin:'2px 0'}}>
              {new Date(`${fecha}T00:00:00`).toLocaleDateString('es-CO', { weekday:'long', day:'numeric', month:'long' })} · {hora.slice(0,5)}
            </p>
            <p style={{fontFamily:'var(--font-marca)', fontSize:'1.3rem', fontWeight:'bold', color:'#c6a15b', marginTop:8}}>
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
              <span key={m} style={{fontSize:'0.7rem', fontFamily:'var(--font-marca)', color:'#9dbfa9', border:'1px solid #dcd8c9', padding:'3px 8px'}}>{m}</span>
            ))}
          </div>
          {errores.general && <div style={{...C.errBox, marginTop:16, marginBottom:0}}>{errores.general}</div>}
          <p style={{fontFamily:'var(--font-marca)', fontSize:'0.72rem', color:'#9dbfa9', textAlign:'center', marginTop:14}}>
            Tu horario queda reservado por 30 minutos mientras completas el pago. Recuerda: reprogramación hasta 24 h antes, sin devolución de dinero.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-crema-50">
      <HeroSeccion
        etiqueta="Masajes"
        titulo="Masajes Yerbateros"
        subtitulo="Un espacio para volver al cuerpo, bajar el ritmo y recibir cuidado."
      />
      <Texto>
        <p>
          A veces el cuerpo necesita algo más que dormir. Necesita una pausa, contacto consciente, tiempo y un espacio
          donde no tenga que resolverlo todo.
        </p>
        <p>Los Masajes Yerbateros son una invitación a regalarte ese momento.</p>
        <p>
          Integramos el masaje corporal con aceites botánicos, aromas y una mirada del cuidado que reconoce la relación
          entre cuerpo, emociones y descanso. Cada sesión es un encuentro pensado para que puedas soltar tensiones,
          reconectar con tus sensaciones y habitar tu cuerpo sin exigencias.
        </p>
        <p>
          Aquí no tienes que llegar en calma, tener energía ni saber qué necesitas. Puedes venir como estás.
        </p>

        <Subtitulo>¿Qué puedes encontrar en una sesión?</Subtitulo>
        <Lista items={[
          'Un espacio de relajación y cuidado corporal.',
          'Masaje orientado a aliviar la sensación de tensión muscular y favorecer el descanso.',
          'Aceites y preparaciones botánicas de Yerbateras.',
          'Un tiempo para escucharte, respirar y hacer una pausa de las exigencias cotidianas.',
        ]} />

        <p>
          Creemos en el cuidado que respeta tus límites, tus tiempos y tu autonomía. Por eso, cada encuentro se construye
          desde el consentimiento y la comunicación.
        </p>
        <p className="border-l-4 border-dorado-400 pl-5 text-verde-900 text-[1.3rem]">
          Porque tu cuerpo no es una máquina que debe producir todo el tiempo. También merece placer, descanso y ternura.
        </p>
      </Texto>

      <Cierre frase="Regálate una pausa yerbatera." sub="Reserva tu sesión y conversemos sobre el masaje que buscas." />

      <div id="reservar" style={{...C.page, minHeight:'auto', padding:'2.5rem 1rem 3.5rem'}}>
      <div style={C.card}>
        <p style={{fontFamily:'var(--font-marca)', fontSize:'1.8rem', color:'#0f3c27', marginBottom:'0.25rem'}}>
          Reserva tu sesión
        </p>
        <p style={{fontFamily:'var(--font-marca)', fontSize:'0.82rem', color:'#9dbfa9', marginBottom:'1.75rem'}}>
          Elige el servicio, la fecha y la hora — el pago se hace en el siguiente paso
        </p>

        {errores.general && <div style={C.errBox}>{errores.general}</div>}

        <form onSubmit={continuarAPago} noValidate>
          <label style={C.label}>Servicio *</label>
          <div style={{marginBottom:'1rem'}}>
            {servicios.map(s => (
              <button type="button" key={s.id} onClick={() => setServicioId(s.id)} style={C.servicioCard(servicioId === s.id)}>
                <div style={{display:'flex', justifyContent:'space-between', alignItems:'baseline'}}>
                  <strong style={{color:'#0f3c27', fontSize:'0.88rem'}}>{s.nombre}</strong>
                  <span style={{color:'#c6a15b', fontWeight:'bold', fontSize:'0.85rem'}}>${Number(s.precio).toLocaleString('es-CO')}</span>
                </div>
                <p style={{margin:'4px 0 0', fontSize:'0.75rem', color:'#9dbfa9'}}>{s.descripcion} · {s.duracion_minutos} min</p>
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
            {cargandoHorarios && <p style={{fontFamily:'var(--font-marca)', fontSize:'0.8rem', color:'#9dbfa9'}}>Buscando horarios...</p>}
            {!cargandoHorarios && horarios.length === 0 && (
              <p style={{fontFamily:'var(--font-marca)', fontSize:'0.8rem', color:'#b91c1c'}}>No hay horarios disponibles ese dia, prueba otra fecha.</p>
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
          {errores.nombre && <p style={{color:'#b91c1c', fontSize:'0.75rem', fontFamily:'var(--font-marca)', marginTop:-8, marginBottom:8}}>{errores.nombre}</p>}

          <label style={C.label}>Correo electronico *</label>
          <div style={C.wrap}>
            <Mail size={14} style={C.icon} />
            <input type="email" value={form.email} onChange={e => set('email', e.target.value)} placeholder="tu@correo.com" style={inp('email', errores.email)} />
          </div>
          {errores.email && <p style={{color:'#b91c1c', fontSize:'0.75rem', fontFamily:'var(--font-marca)', marginTop:-8, marginBottom:8}}>{errores.email}</p>}

          <label style={C.label}>Celular (WhatsApp) *</label>
          <div style={C.wrap}>
            <Phone size={14} style={C.icon} />
            <input type="tel" value={form.telefono} onChange={e => set('telefono', e.target.value)} placeholder="+57 310 263 1592" style={inp('telefono', errores.telefono)} />
          </div>
          {errores.telefono && <p style={{color:'#b91c1c', fontSize:'0.75rem', fontFamily:'var(--font-marca)', marginTop:-8, marginBottom:8}}>{errores.telefono}</p>}

          <label style={C.label}>Notas <span style={{color:'#9dbfa9', fontWeight:'normal'}}>(opcional)</span></label>
          <div style={C.wrap}>
            <MessageCircle size={14} style={C.icon} />
            <input value={form.notas} onChange={e => set('notas', e.target.value)} placeholder="Alguna molestia o preferencia" style={inp('notas', false)} />
          </div>


          <div style={{background:'#fbf7ee', border:'1px solid #ebdab4', padding:'12px 14px', margin:'4px 0 12px'}}>
            <p style={{fontFamily:'var(--font-marca)', fontSize:'0.8rem', fontWeight:'bold', color:'#0f3c27', margin:'0 0 6px'}}>Políticas de cancelación</p>
            <ul style={{fontFamily:'var(--font-marca)', fontSize:'0.76rem', color:'#16422e', lineHeight:1.6, margin:0, paddingLeft:16}}>
              <li>La cita solo se puede <b>cancelar o reprogramar con mínimo 24 horas</b> de anticipación.</li>
              <li>La cancelación se maneja como <b>reprogramación</b>: no hay devolución de dinero.</li>
              <li>Con menos de 24 horas ya no es posible cambiar el horario.</li>
            </ul>
            <label style={{display:'flex', alignItems:'flex-start', gap:8, marginTop:10, cursor:'pointer', fontFamily:'var(--font-marca)', fontSize:'0.78rem', color:'#0f3c27'}}>
              <input type="checkbox" checked={aceptaPolitica} onChange={e => { setAceptaPolitica(e.target.checked); setErrores(x => ({...x, general:''})); }} style={{marginTop:2}} />
              He leído y acepto la política.
            </label>
          </div>
          <button type="submit" disabled={enviando || !hora} style={{...C.btn, opacity: (enviando || !hora) ? 0.6 : 1}}>
            {enviando ? 'Procesando...' : 'Continuar al pago'}
          </button>
        </form>
      </div>
    </div>
    </div>
  );
}
