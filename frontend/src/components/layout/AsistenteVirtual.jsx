import { useState, useRef, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { X, Send, Minus, MessageSquare } from 'lucide-react';

// ============================================================
// TEMAS DEL ASISTENTE — edita libremente el texto de "respuesta"
// y los "keywords" (palabras que activan cada tema al escribir).
// Los que dicen [EDITA] tienen datos que debes confirmar con la
// información real del negocio (horarios, tiempos de envio, etc).
// ============================================================
const TEMAS = [
  {
    id: 'productos',
    pregunta: '¿Qué productos tienen?',
    keywords: ['producto', 'productos', 'catalogo', 'que venden', 'que tienen', 'articulos'],
    respuesta: 'Tenemos aceites y tinturas, infusiones y tés, cremas y tópicos, suplementos, kits de regalo y nuestra línea de cannabis medicinal — todo elaborado artesanalmente y con certificación INVIMA.',
    accion: { label: 'Ver toda la tienda', to: '/tienda' },
  },
  {
    id: 'cannabis',
    pregunta: '¿Tienen cannabis medicinal?',
    keywords: ['cbd', 'cannabis', 'marihuana', 'thc'],
    respuesta: 'Sí, contamos con una línea de cannabis medicinal certificada. Puedes ver toda la información y presentaciones en nuestra tienda, en la categoría "Cannabis Medicinal".',
    accion: { label: 'Ver cannabis medicinal', to: '/tienda?categoria=cannabis-medicinal' },
  },
  {
    id: 'invima',
    pregunta: '¿Están certificados por INVIMA?',
    keywords: ['invima', 'certificado', 'certificacion', 'registro sanitario'],
    respuesta: 'Sí, todos nuestros productos cuentan con registro sanitario y certificación INVIMA. Puedes ver el detalle de cada producto en su página individual dentro de la tienda.',
  },
  {
    id: 'envios',
    pregunta: '¿Cómo son los envíos?',
    keywords: ['envio', 'envios', 'domicilio', 'entrega', 'llega', 'cuanto tarda'],
    // [EDITA] confirma tiempos y costo real de envio antes de publicar
    respuesta: 'Hacemos envíos a toda Colombia. [EDITA: aquí va el tiempo estimado de entrega real, por ejemplo "de 2 a 5 días hábiles"] y el costo de envío se calcula en el checkout según tu ciudad.',
  },
  {
    id: 'pagos',
    pregunta: '¿Qué métodos de pago aceptan?',
    keywords: ['pago', 'pagar', 'tarjeta', 'pse', 'contraentrega', 'efectivo'],
    respuesta: 'Aceptamos tarjeta de crédito/débito, PSE y pago contraentrega en las ciudades donde está disponible.',
  },
  {
    id: 'citas',
    pregunta: 'Quiero agendar un masaje',
    keywords: ['masaje', 'cita', 'agendar', 'relajante', 'terapia'],
    respuesta: 'Puedes agendar tu masaje directamente desde nuestra página de citas: eliges el servicio, la fecha y la hora, y te confirmamos por correo.',
    accion: { label: 'Agendar una cita', to: '/citas' },
  },
  {
    id: 'horario',
    pregunta: '¿Cuál es su horario de atención?',
    keywords: ['horario', 'hora', 'abierto', 'atienden', 'abren', 'cierran'],
    // [EDITA] reemplaza por el horario real del negocio
    respuesta: '[EDITA: aquí va el horario real de atención, por ejemplo "Lunes a sábado de 9:00 a. m. a 6:00 p. m."]',
  },
  {
    id: 'cambios',
    pregunta: '¿Cómo funcionan los cambios o devoluciones?',
    keywords: ['cambio', 'cambios', 'devolucion', 'devoluciones', 'garantia'],
    // [EDITA] reemplaza por la politica real de cambios/devoluciones
    respuesta: '[EDITA: aquí va la política real de cambios y devoluciones del negocio].',
  },
  {
    id: 'humano',
    pregunta: 'Quiero hablar con una persona',
    keywords: ['humano', 'persona', 'asesor', 'whatsapp', 'llamar', 'telefono'],
    respuesta: 'Con gusto. Escríbenos directo por WhatsApp y te atendemos personalmente.',
    accion: { label: 'Abrir WhatsApp', href: 'https://wa.me/573102631592' },
  },
];

const normalizar = (txt) => txt
  .toLowerCase()
  .normalize('NFD').replace(/[\u0300-\u036f]/g, '');

const buscarTema = (texto) => {
  const t = normalizar(texto);
  return TEMAS.find(tema => tema.keywords.some(k => t.includes(normalizar(k))));
};

const MENSAJE_BIENVENIDA = {
  rol: 'assistant',
  texto: 'Hola, soy el asistente de Yerbateras. Elige una pregunta de la lista o escribe la tuya y te ayudo con gusto.',
};

const MENSAJE_NO_ENTENDI = {
  rol: 'assistant',
  texto: 'No estoy seguro de haber entendido tu pregunta. Elige una opción de la lista, o si prefieres, escríbenos directo por WhatsApp.',
  accion: { label: 'Abrir WhatsApp', href: 'https://wa.me/573102631592' },
};

export default function AsistenteVirtual() {
  const [abierto, setAbierto]       = useState(false);
  const [minimizado, setMinimizado] = useState(false);
  const [input, setInput]           = useState('');
  const [mensajes, setMensajes]     = useState([MENSAJE_BIENVENIDA]);
  const endRef = useRef(null);

  useEffect(() => {
    if (abierto && !minimizado) endRef.current?.scrollIntoView({ behavior:'smooth' });
  }, [mensajes, abierto, minimizado]);

  const responderTema = (tema) => {
    setMensajes(prev => [
      ...prev,
      { rol: 'user', texto: tema.pregunta },
      { rol: 'assistant', texto: tema.respuesta, accion: tema.accion },
    ]);
  };

  const enviar = () => {
    if (!input.trim()) return;
    const texto = input.trim();
    setInput('');
    const tema = buscarTema(texto);
    setMensajes(prev => [
      ...prev,
      { rol: 'user', texto },
      tema
        ? { rol: 'assistant', texto: tema.respuesta, accion: tema.accion }
        : MENSAJE_NO_ENTENDI,
    ]);
  };

  const S = {
    btn: {
      position:'fixed', bottom:'5.5rem', right:'1.5rem', zIndex:50,
      width:52, height:52, borderRadius:'50%',
      background:'#146b42', border:'none', cursor:'pointer',
      display:'flex', alignItems:'center', justifyContent:'center',
      boxShadow:'0 4px 16px rgba(92,107,58,0.5)',
      transition:'all 0.25s ease'
    },
    ventana: {
      position:'fixed', bottom:'5.5rem', right:'1.5rem', zIndex:50,
      width:340, background:'white',
      boxShadow:'0 12px 40px rgba(0,0,0,0.18)',
      border:'1px solid #ddd6c2',
      display:'flex', flexDirection:'column',
      transition:'height 0.3s ease',
      height: minimizado ? 52 : 500
    },
    header: {
      background:'#052a1c',
      padding:'0 16px',
      height:52,
      display:'flex', alignItems:'center', justifyContent:'space-between',
      flexShrink:0,
      borderBottom:'2px solid #e0a83e'
    },
    msgs: {
      flex:1, overflowY:'auto', padding:'16px',
      background:'#fdfbf6', display:'flex', flexDirection:'column', gap:12
    },
    msgUser: {
      alignSelf:'flex-end', background:'#052a1c', color:'#F5F0E1',
      padding:'8px 12px', maxWidth:'80%',
      fontFamily:'Georgia,serif', fontSize:'0.82rem', lineHeight:1.6
    },
    msgBot: {
      alignSelf:'flex-start', background:'white', color:'#0a3d28',
      padding:'8px 12px', maxWidth:'88%',
      border:'1px solid #ddd6c2',
      fontFamily:'Georgia,serif', fontSize:'0.82rem', lineHeight:1.6
    },
    inputWrap: {
      borderTop:'1px solid #ddd6c2', padding:'10px 12px',
      display:'flex', gap:8, background:'white', flexShrink:0
    },
    input: {
      flex:1, border:'1px solid #ddd6c2', padding:'8px 12px',
      fontFamily:'Georgia,serif', fontSize:'0.82rem', color:'#052a1c',
      background:'#fdfbf6', outline:'none'
    },
    sendBtn: {
      width:36, height:36, background:'#146b42', border:'none', cursor:'pointer',
      display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0
    },
    accionBtn: {
      display:'inline-block', marginTop:8, fontFamily:'Georgia,serif', fontSize:'0.75rem',
      fontWeight:'bold', color:'#052a1c', background:'#e0a83e', padding:'6px 12px',
      textDecoration:'none', border:'none', cursor:'pointer'
    },
    temaBtn: {
      display:'block', width:'100%', textAlign:'left', fontFamily:'Georgia,serif', fontSize:'0.76rem',
      color:'#0a3d28', background:'white', border:'1px solid #a8dec0', padding:'6px 10px',
      cursor:'pointer', marginBottom:5
    }
  };

  return (
    <>
      {!abierto && (
        <button onClick={() => setAbierto(true)} style={S.btn} aria-label="Abrir asistente"
          onMouseEnter={e => { e.currentTarget.style.transform='scale(1.1)'; e.currentTarget.style.background='#4a5630'; }}
          onMouseLeave={e => { e.currentTarget.style.transform='scale(1)'; e.currentTarget.style.background='#146b42'; }}>
          <MessageSquare size={22} color="white" />
          <span style={{
            position:'absolute', top:4, right:4, width:10, height:10,
            borderRadius:'50%', background:'#e0a83e',
            animation:'pulse-chat 2s ease-out infinite'
          }} />
          <style>{`@keyframes pulse-chat { 0%{transform:scale(1);opacity:1} 100%{transform:scale(2.5);opacity:0} }`}</style>
        </button>
      )}

      {abierto && (
        <div style={S.ventana}>
          <div style={S.header}>
            <div style={{display:'flex', alignItems:'center', gap:10}}>
              <div style={{width:28, height:28, background:'#e0a83e', display:'flex', alignItems:'center', justifyContent:'center'}}>
                <span style={{fontFamily:'Georgia,serif', fontWeight:'bold', color:'#052a1c', fontSize:'0.75rem', fontStyle:'italic'}}>Y</span>
              </div>
              <div>
                <p style={{fontFamily:'Georgia,serif', fontSize:'0.82rem', fontWeight:'bold', color:'#F5F0E1', margin:0, lineHeight:1.2}}>Asistente Yerbateras</p>
                <div style={{display:'flex', alignItems:'center', gap:4}}>
                  <span style={{width:6, height:6, borderRadius:'50%', background:'#4ade80', display:'inline-block'}} />
                  <span style={{fontFamily:'Georgia,serif', fontSize:'0.7rem', color:'#6ec194'}}>Respuestas rápidas</span>
                </div>
              </div>
            </div>
            <div style={{display:'flex', gap:4}}>
              <button onClick={() => setMinimizado(!minimizado)}
                style={{background:'none', border:'none', cursor:'pointer', color:'#6ec194', padding:4, display:'flex', alignItems:'center'}}>
                <Minus size={14} />
              </button>
              <button onClick={() => { setAbierto(false); setMinimizado(false); }}
                style={{background:'none', border:'none', cursor:'pointer', color:'#6ec194', padding:4, display:'flex', alignItems:'center'}}>
                <X size={14} />
              </button>
            </div>
          </div>

          {!minimizado && (
            <>
              <div style={S.msgs}>
                {mensajes.map((m, i) => (
                  <div key={i} style={m.rol === 'user' ? S.msgUser : S.msgBot}>
                    {m.texto}
                    {m.accion && (
                      m.accion.to
                        ? <Link to={m.accion.to} style={S.accionBtn}>{m.accion.label}</Link>
                        : <a href={m.accion.href} target="_blank" rel="noreferrer" style={S.accionBtn}>{m.accion.label}</a>
                    )}
                  </div>
                ))}
                <div ref={endRef} />
              </div>

              <div style={{padding:'10px 12px', borderTop:'1px solid #ede8da', background:'#fdfbf6', maxHeight:120, overflowY:'auto'}}>
                {TEMAS.map(tema => (
                  <button key={tema.id} onClick={() => responderTema(tema)} style={S.temaBtn}>
                    {tema.pregunta}
                  </button>
                ))}
              </div>

              <div style={S.inputWrap}>
                <input
                  value={input}
                  onChange={e => setInput(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && !e.shiftKey && enviar()}
                  placeholder="Escribe tu pregunta..."
                  style={S.input}
                />
                <button onClick={enviar} disabled={!input.trim()} style={{...S.sendBtn, opacity: !input.trim() ? 0.4 : 1}}>
                  <Send size={15} color="white" />
                </button>
              </div>
            </>
          )}
        </div>
      )}
    </>
  );
}
