import { useEffect, useState } from 'react';
import { Calendar, Clock, MapPin, User, Users, X, ShieldCheck, CheckCircle, Loader } from 'lucide-react';
import api from '../services/api';
import { HeroSeccion, Texto, Subtitulo, Lista, Cierre } from '../components/ui/Seccion';
import { cargarWompiScript, abrirCheckoutWompi, cop } from '../utils/wompi';

const fechaLarga = (f) => new Date(`${f}T00:00:00`).toLocaleDateString('es-CO', { weekday: 'long', day: 'numeric', month: 'long' });

function ModalInscripcion({ taller, onClose }) {
  const [form, setForm] = useState({ nombre: '', email: '', telefono: '', notas: '' });
  const [asistentes, setAsistentes] = useState(1);
  const [porcentaje, setPorcentaje] = useState(taller.porcentaje_minimo);
  const [acepta, setAcepta] = useState(false);
  const [error, setError] = useState('');
  const [enviando, setEnviando] = useState(false);
  const [pago, setPago] = useState(null);
  const [scriptListo, setScriptListo] = useState(false);
  const [procesando, setProcesando] = useState(false);
  const [resultado, setResultado] = useState(null);

  useEffect(() => { cargarWompiScript().then(() => setScriptListo(true)).catch(() => {}); }, []);

  const set = (k, v) => { setForm(f => ({ ...f, [k]: v })); setError(''); };
  const total = Number(taller.precio) * asistentes;
  const ahora = Math.round(total * porcentaje / 100);
  const opciones = [50, 75, 100].filter(p => p >= taller.porcentaje_minimo);
  if (!opciones.includes(taller.porcentaje_minimo)) opciones.unshift(taller.porcentaje_minimo);

  const continuar = async (e) => {
    e.preventDefault();
    if (form.nombre.trim().length < 2) return setError('Escribe tu nombre completo');
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) return setError('Correo inválido');
    if (!/^\+?[0-9]{7,15}$/.test(form.telefono.replace(/\s/g, ''))) return setError('Número de celular inválido');
    if (!acepta) return setError('Debes aceptar las condiciones de pago');
    setEnviando(true);
    try {
      const { data } = await api.post('/talleres/inscribir', {
        taller_id: taller.id, ...form, asistentes, porcentaje, acepta_politica: true,
      });
      setPago(data);
    } catch (err) {
      setError(err.response?.data?.mensaje || 'No se pudo iniciar la inscripción');
    } finally { setEnviando(false); }
  };

  const pagar = () => {
    if (!scriptListo || !window.WidgetCheckout || !pago) return;
    setProcesando(true);
    abrirCheckoutWompi(pago, form, (tx) => {
      setProcesando(false);
      if (!tx) return setError('No se recibió respuesta de la pasarela de pagos.');
      if (tx.status === 'APPROVED') setResultado('ok');
      else if (tx.status === 'PENDING') setResultado('pendiente');
      else setError('El pago no fue aprobado. Puedes intentarlo de nuevo.');
    });
  };

  const inp = 'w-full px-3 py-2.5 border border-crema-300 bg-crema-50 text-sm outline-none focus:border-dorado-500';

  return (
    <div className="fixed inset-0 z-[90] flex items-center justify-center p-3">
      <div className="absolute inset-0 bg-verde-900/60" onClick={onClose} />
      <div className="relative bg-white w-full max-w-md max-h-[92vh] overflow-y-auto shadow-2xl">
        <div className="bg-verde-900 text-crema-100 px-5 py-4 flex items-center justify-between">
          <p className="font-display font-bold">Inscripción: {taller.titulo}</p>
          <button onClick={onClose} aria-label="Cerrar"><X size={18} /></button>
        </div>
        <div className="p-5">
          {resultado ? (
            <div className="text-center py-6">
              {resultado === 'ok' ? <CheckCircle size={44} className="text-verde-600 mx-auto mb-3" /> : <Loader size={40} className="text-dorado-500 mx-auto mb-3" />}
              <p className="font-display text-lg font-bold text-verde-900 mb-2">{resultado === 'ok' ? '¡Pago recibido!' : 'Tu pago está en proceso'}</p>
              <p className="font-body text-sm text-verde-700">
                {resultado === 'ok' ? `Te enviamos la confirmación a ${form.email}.` : 'Apenas se confirme te avisaremos por correo y tu cupo quedará asegurado.'}
              </p>
              <button onClick={onClose} className="btn-primary mt-5">Cerrar</button>
            </div>
          ) : pago ? (
            <div>
              <div className="bg-crema-50 border border-crema-300 p-4 mb-4 text-sm font-body">
                <p className="font-bold text-verde-900">{pago.taller_titulo}</p>
                <p className="text-verde-700">{pago.asistentes} persona(s) · Total {cop(pago.monto_total)}</p>
                <p className="font-display text-xl font-bold text-dorado-600 mt-2">Pagas ahora {cop(pago.monto_a_pagar)}</p>
                {pago.saldo > 0 && <p className="text-xs text-verde-600 mt-1">Saldo pendiente: {cop(pago.saldo)}</p>}
              </div>
              {error && <div className="bg-red-50 border border-red-200 text-red-700 text-sm p-2.5 mb-3">{error}</div>}
              <button onClick={pagar} disabled={!scriptListo || procesando} className="btn-primary w-full disabled:opacity-60">
                <ShieldCheck size={16} /> {!scriptListo ? 'Cargando pasarela...' : procesando ? 'Procesando...' : `Pagar ${cop(pago.monto_a_pagar)}`}
              </button>
              <p className="text-xs text-verde-500 text-center mt-3">Tu cupo queda reservado 30 minutos mientras pagas.</p>
            </div>
          ) : (
            <form onSubmit={continuar} noValidate className="space-y-3">
              {error && <div className="bg-red-50 border border-red-200 text-red-700 text-sm p-2.5">{error}</div>}
              <input className={inp} placeholder="Nombre completo *" value={form.nombre} onChange={e => set('nombre', e.target.value)} />
              <input className={inp} type="email" placeholder="Correo *" value={form.email} onChange={e => set('email', e.target.value)} />
              <input className={inp} type="tel" placeholder="Celular (WhatsApp) *" value={form.telefono} onChange={e => set('telefono', e.target.value)} />

              <div>
                <label className="text-xs font-bold text-verde-800">Número de asistentes</label>
                <select className={inp} value={asistentes} onChange={e => setAsistentes(Number(e.target.value))}>
                  {Array.from({ length: Math.min(10, taller.cupos_disponibles) }, (_, i) => i + 1).map(n => <option key={n} value={n}>{n}</option>)}
                </select>
              </div>

              <div>
                <label className="text-xs font-bold text-verde-800">¿Cuánto pagas ahora?</label>
                <div className="grid grid-cols-3 gap-2 mt-1">
                  {opciones.map(p => (
                    <button type="button" key={p} onClick={() => setPorcentaje(p)}
                      className={`py-2 text-sm border ${porcentaje === p ? 'bg-verde-900 text-crema-100 border-verde-900' : 'bg-white text-verde-900 border-crema-300'}`}>
                      {p}%{p === taller.porcentaje_minimo ? ' (mín.)' : ''}
                    </button>
                  ))}
                </div>
              </div>

              <div className="bg-crema-50 border border-crema-300 p-3 text-sm font-body">
                <div className="flex justify-between"><span>Total</span><b>{cop(total)}</b></div>
                <div className="flex justify-between text-dorado-700"><span>Pagas ahora ({porcentaje}%)</span><b>{cop(ahora)}</b></div>
                {porcentaje < 100 && <div className="flex justify-between text-verde-600"><span>Saldo pendiente</span><span>{cop(total - ahora)}</span></div>}
              </div>

              <label className="flex items-start gap-2 text-xs text-verde-800 leading-relaxed cursor-pointer">
                <input type="checkbox" checked={acepta} onChange={e => { setAcepta(e.target.checked); setError(''); }} className="mt-0.5 accent-verde-900" />
                Entiendo que para asistir debo pagar como mínimo el {taller.porcentaje_minimo}% del valor del taller y que el saldo restante debe cubrirse antes del taller.
              </label>

              <button type="submit" disabled={enviando} className="btn-primary w-full disabled:opacity-60">{enviando ? 'Reservando cupo...' : 'Continuar al pago'}</button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}

export default function Talleres() {
  const [talleres, setTalleres] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [elegido, setElegido] = useState(null);

  const cargar = () => api.get('/talleres').then(r => setTalleres(r.data.talleres || [])).catch(() => setTalleres([])).finally(() => setCargando(false));
  useEffect(() => { cargar(); }, []);

  return (
    <div className="bg-crema-50 min-h-screen">
      <HeroSeccion
        etiqueta="Talleres"
        titulo="Talleres Yerbateros"
        subtitulo="Aprender con las plantas. Experimentar con las manos. Compartir saberes."
      />
      <Texto>
        <p>
          En Yerbateras creemos que el conocimiento crece cuando circula. Por eso creamos talleres para encontrarnos,
          aprender haciendo y recuperar nuestra relación con el mundo vegetal desde una mirada feminista, crítica,
          creativa y colectiva.
        </p>
        <p>
          Nuestros talleres combinan herbolaria, experimentación botánica, preparación artesanal y experiencias para
          explorar el cuerpo, las emociones, el descanso y el placer.
        </p>
        <p>
          Aquí puedes ensuciarte las manos, preguntar, equivocarte, crear tus propias preparaciones y llevarte
          conocimientos que puedas incorporar a tu vida cotidiana.
        </p>

        <Subtitulo>¿Qué puedes aprender con nosotras?</Subtitulo>
        <Lista items={[
          { t: 'Preparaciones botánicas', d: 'elaboración artesanal de oleatos, pomadas, baños de hierbas, perfumes y otras preparaciones.' },
          { t: 'Herbolaria cotidiana', d: 'formas de conocer y aprovechar las plantas desde prácticas informadas y responsables.' },
          { t: 'Plantas, cuerpo y placer', d: 'encuentros para explorar el deseo, la sensualidad y el autocuidado sin vergüenza ni moralismos.' },
          { t: 'Rituales y experiencias yerbateras', d: 'espacios creativos para conectar con los sentidos, las plantas y nuestras propias formas de cuidarnos.' },
          { t: 'Saberes feministas y ancestrales', d: 'conversaciones sobre transmisión de conocimientos, autonomía y relación con los territorios.' },
        ]} />

        <p>
          Tenemos encuentros presenciales en nuestra Casa Taller y experiencias virtuales para compartir saberes más allá
          de las fronteras.
        </p>
        <p>
          No necesitas experiencia previa ni ser experta en plantas. Solo traer curiosidad, ganas de experimentar y
          disposición para compartir.
        </p>
      </Texto>

      <Cierre
        frase="Las plantas también se aprenden en colectivo."
        sub="Consulta nuestra programación y encuentra tu próximo encuentro yerbatero."
      />

      <div className="max-w-6xl mx-auto px-6 pb-16">
        {cargando ? (
          <div className="flex justify-center py-16"><div className="w-8 h-8 border-4 border-verde-200 border-t-verde-900 rounded-full animate-spin" /></div>
        ) : talleres.length === 0 ? (
          <p className="text-center font-body text-verde-600 py-16">Pronto publicaremos nuevos talleres.</p>
        ) : (
          <div className="grid md:grid-cols-2 gap-6">
            {talleres.map(t => (
              <div key={t.id} className="card flex flex-col sm:flex-row overflow-hidden">
                {t.flyer_url && <img src={t.flyer_url} alt={`Flyer ${t.titulo}`} className="sm:w-44 w-full h-56 sm:h-auto object-cover bg-crema-100" />}
                <div className="p-5 flex-1 flex flex-col">
                  <h3 className="font-display text-lg font-bold text-verde-900">{t.titulo}</h3>
                  <div className="text-sm font-body text-verde-700 space-y-1 mt-2">
                    <p className="flex items-center gap-2 capitalize"><Calendar size={14} /> {fechaLarga(t.fecha)}</p>
                    <p className="flex items-center gap-2"><Clock size={14} /> {t.hora_inicio} · {Number(t.duracion_horas)} h</p>
                    {t.lugar && <p className="flex items-center gap-2"><MapPin size={14} /> {t.lugar}</p>}
                    {t.instructor && <p className="flex items-center gap-2"><User size={14} /> {t.instructor}</p>}
                    <p className="flex items-center gap-2"><Users size={14} /> {t.cupos_disponibles > 0 ? `${t.cupos_disponibles} cupos disponibles` : 'Sin cupos'}</p>
                  </div>
                  {t.descripcion && <p className="text-sm text-verde-600 mt-3 line-clamp-3">{t.descripcion}</p>}
                  <div className="mt-auto pt-4 flex items-end justify-between gap-3">
                    <div>
                      <p className="font-display text-xl font-bold text-verde-800">{cop(t.precio)} <span className="text-xs font-body font-normal text-verde-500">por persona</span></p>
                      <p className="text-xs text-dorado-700">Reserva con {t.porcentaje_minimo}%</p>
                    </div>
                    <button onClick={() => setElegido(t)} disabled={t.cupos_disponibles === 0} className="btn-primary disabled:opacity-40">{t.cupos_disponibles === 0 ? 'Agotado' : 'Inscribirme'}</button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
      {elegido && <ModalInscripcion taller={elegido} onClose={() => { setElegido(null); cargar(); }} />}
    </div>
  );
}
