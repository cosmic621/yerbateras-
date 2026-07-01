import { useState, useRef, useEffect } from 'react';
import { X, Send, Minus, MessageSquare } from 'lucide-react';

const SYSTEM_PROMPT = `Eres Vera, asistente virtual de Yerbateras, empresa colombiana de productos herbales artesanales fundada por Estefania Pineros. Gloria Ospina maneja la produccion y los envios.

Yerbateras lleva mas de 10 anos elaborando: aceites, pomadas, banos herbales, tinturas, perfumes botanicos e infusiones con plantas medicinales. Tienen certificacion INVIMA.

Ayuda con informacion sobre productos, plantas medicinales, cannabis medicinal certificado, proceso de compra, envios, talleres y autocuidado. Responde en espanol colombiano, amable y breve (max 3 oraciones). Para condiciones medicas, recomienda consultar un medico.`;

export default function AsistenteVirtual() {
  const [abierto, setAbierto]       = useState(false);
  const [minimizado, setMinimizado] = useState(false);
  const [cargando, setCargando]     = useState(false);
  const [input, setInput]           = useState('');
  const [mensajes, setMensajes]     = useState([
    { rol:'assistant', texto:'Hola, soy Vera, tu asistente de Yerbateras. En que puedo ayudarte hoy? Puedo orientarte sobre nuestros productos herbales, talleres y plantas medicinales.' }
  ]);
  const endRef = useRef(null);

  useEffect(() => {
    if (abierto && !minimizado) endRef.current?.scrollIntoView({ behavior:'smooth' });
  }, [mensajes, abierto, minimizado]);

  const enviar = async () => {
    if (!input.trim() || cargando) return;
    const texto = input.trim();
    setInput('');
    const nuevos = [...mensajes, { rol:'user', texto }];
    setMensajes(nuevos);
    setCargando(true);

    try {
      const res = await fetch('https://api.anthropic.com/v1/messages', {
        method:'POST',
        headers:{
          'Content-Type':'application/json',
          'anthropic-dangerous-allow-browser':'true'
        },
        body: JSON.stringify({
          model:'claude-haiku-4-5-20251001',
          max_tokens:400,
          system: SYSTEM_PROMPT,
          messages: nuevos.map(m => ({ role: m.rol === 'user' ? 'user' : 'assistant', content: m.texto }))
        })
      });
      const data = await res.json();
      const respuesta = data.content?.[0]?.text || 'Disculpa, hubo un problema. Intentalo de nuevo.';
      setMensajes(prev => [...prev, { rol:'assistant', texto: respuesta }]);
    } catch {
      setMensajes(prev => [...prev, { rol:'assistant', texto:'Tuve un problema de conexion. Por favor intentalo de nuevo en un momento.' }]);
    } finally {
      setCargando(false);
    }
  };

  const sugerencias = ['Que productos tienen?','Tienen cannabis CBD?','Como es el envio?','Que talleres ofrecen?'];

  const S = {
    btn: {
      position:'fixed', bottom:'5.5rem', right:'1.5rem', zIndex:50,
      width:52, height:52, borderRadius:'50%',
      background:'#5C6B3A', border:'none', cursor:'pointer',
      display:'flex', alignItems:'center', justifyContent:'center',
      boxShadow:'0 4px 16px rgba(92,107,58,0.5)',
      transition:'all 0.25s ease'
    },
    ventana: {
      position:'fixed', bottom:'1.5rem', right:'1.5rem', zIndex:50,
      width:340, background:'white',
      boxShadow:'0 12px 40px rgba(0,0,0,0.18)',
      border:'1px solid #ddd6c2',
      display:'flex', flexDirection:'column',
      transition:'height 0.3s ease',
      height: minimizado ? 52 : 480
    },
    header: {
      background:'#1E2E1A',
      padding:'0 16px',
      height:52,
      display:'flex', alignItems:'center', justifyContent:'space-between',
      flexShrink:0,
      borderBottom:'2px solid #C8874A'
    },
    msgs: {
      flex:1, overflowY:'auto', padding:'16px',
      background:'#faf8f4', display:'flex', flexDirection:'column', gap:12
    },
    msgUser: {
      alignSelf:'flex-end', background:'#1E2E1A', color:'#F5F0E1',
      padding:'8px 12px', maxWidth:'80%',
      fontFamily:'Georgia,serif', fontSize:'0.82rem', lineHeight:1.6
    },
    msgBot: {
      alignSelf:'flex-start', background:'white', color:'#2d4a22',
      padding:'8px 12px', maxWidth:'80%',
      border:'1px solid #ddd6c2',
      fontFamily:'Georgia,serif', fontSize:'0.82rem', lineHeight:1.6
    },
    inputWrap: {
      borderTop:'1px solid #ddd6c2', padding:'10px 12px',
      display:'flex', gap:8, background:'white', flexShrink:0
    },
    input: {
      flex:1, border:'1px solid #ddd6c2', padding:'8px 12px',
      fontFamily:'Georgia,serif', fontSize:'0.82rem', color:'#1E2E1A',
      background:'#faf8f4', outline:'none'
    },
    sendBtn: {
      width:36, height:36, background:'#5C6B3A', border:'none', cursor:'pointer',
      display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0
    }
  };

  return (
    <>
      {/* Boton flotante */}
      {!abierto && (
        <button onClick={() => setAbierto(true)} style={S.btn} aria-label="Abrir asistente"
          onMouseEnter={e => { e.currentTarget.style.transform='scale(1.1)'; e.currentTarget.style.background='#4a5630'; }}
          onMouseLeave={e => { e.currentTarget.style.transform='scale(1)'; e.currentTarget.style.background='#5C6B3A'; }}>
          <MessageSquare size={22} color="white" />
          {/* Puntito */}
          <span style={{
            position:'absolute', top:4, right:4, width:10, height:10,
            borderRadius:'50%', background:'#C8874A',
            animation:'pulse-chat 2s ease-out infinite'
          }} />
          <style>{`@keyframes pulse-chat { 0%{transform:scale(1);opacity:1} 100%{transform:scale(2.5);opacity:0} }`}</style>
        </button>
      )}

      {/* Ventana chat */}
      {abierto && (
        <div style={S.ventana}>
          {/* Header */}
          <div style={S.header}>
            <div style={{display:'flex', alignItems:'center', gap:10}}>
              <div style={{width:28, height:28, background:'#C8874A', display:'flex', alignItems:'center', justifyContent:'center'}}>
                <span style={{fontFamily:'Georgia,serif', fontWeight:'bold', color:'#1E2E1A', fontSize:'0.75rem', fontStyle:'italic'}}>V</span>
              </div>
              <div>
                <p style={{fontFamily:'Georgia,serif', fontSize:'0.82rem', fontWeight:'bold', color:'#F5F0E1', margin:0, lineHeight:1.2}}>Vera · Yerbateras</p>
                <div style={{display:'flex', alignItems:'center', gap:4}}>
                  <span style={{width:6, height:6, borderRadius:'50%', background:'#4ade80', display:'inline-block'}} />
                  <span style={{fontFamily:'Georgia,serif', fontSize:'0.7rem', color:'#8fa882'}}>En linea</span>
                </div>
              </div>
            </div>
            <div style={{display:'flex', gap:4}}>
              <button onClick={() => setMinimizado(!minimizado)}
                style={{background:'none', border:'none', cursor:'pointer', color:'#8fa882', padding:4, display:'flex', alignItems:'center'}}>
                <Minus size={14} />
              </button>
              <button onClick={() => { setAbierto(false); setMinimizado(false); }}
                style={{background:'none', border:'none', cursor:'pointer', color:'#8fa882', padding:4, display:'flex', alignItems:'center'}}>
                <X size={14} />
              </button>
            </div>
          </div>

          {!minimizado && (
            <>
              {/* Mensajes */}
              <div style={S.msgs}>
                {mensajes.map((m, i) => (
                  <div key={i} style={m.rol === 'user' ? S.msgUser : S.msgBot}>
                    {m.texto}
                  </div>
                ))}
                {cargando && (
                  <div style={{...S.msgBot, display:'flex', gap:5, alignItems:'center', padding:'10px 14px'}}>
                    {[0,1,2].map(i => (
                      <span key={i} style={{
                        width:7, height:7, borderRadius:'50%', background:'#5C6B3A',
                        display:'inline-block', animation:`bounce-dot 1.2s ease-in-out ${i*0.2}s infinite`
                      }} />
                    ))}
                    <style>{`@keyframes bounce-dot{0%,80%,100%{transform:translateY(0)}40%{transform:translateY(-6px)}}`}</style>
                  </div>
                )}
                <div ref={endRef} />
              </div>

              {/* Sugerencias */}
              {mensajes.length === 1 && (
                <div style={{padding:'8px 12px', borderTop:'1px solid #ede8da', background:'#faf8f4', display:'flex', flexWrap:'wrap', gap:6}}>
                  {sugerencias.map(s => (
                    <button key={s} onClick={() => setInput(s)}
                      style={{fontFamily:'Georgia,serif', fontSize:'0.72rem', color:'#3d5a35', background:'white', border:'1px solid #c8bfa8', padding:'4px 10px', cursor:'pointer'}}>
                      {s}
                    </button>
                  ))}
                </div>
              )}

              {/* Input */}
              <div style={S.inputWrap}>
                <input
                  value={input}
                  onChange={e => setInput(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && !e.shiftKey && enviar()}
                  placeholder="Escribe tu pregunta..."
                  style={S.input}
                  disabled={cargando}
                />
                <button onClick={enviar} disabled={!input.trim() || cargando} style={{...S.sendBtn, opacity: (!input.trim() || cargando) ? 0.4 : 1}}>
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
