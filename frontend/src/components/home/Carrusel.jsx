import { useState, useEffect, useRef, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { ChevronLeft, ChevronRight } from 'lucide-react';

const INTERVALO = 6000;

// Carrusel de imágenes de la página principal (las administra el equipo en Admin → Carrusel).
export default function Carrusel({ slides }) {
  const [i, setI] = useState(0);
  const [pausa, setPausa] = useState(false);
  const toque = useRef(null);
  const n = slides.length;
  const reducido = typeof window !== 'undefined' && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;

  const ir = useCallback((d) => setI(x => (x + d + n) % n), [n]);

  useEffect(() => {
    if (n < 2 || pausa || reducido) return;
    const t = setInterval(() => ir(1), INTERVALO);
    return () => clearInterval(t);
  }, [n, pausa, reducido, ir]);

  if (!n) return null;

  return (
    <section aria-roledescription="carrusel" aria-label="Destacados"
      className="relative overflow-hidden bg-verde-900 h-[56vh] min-h-[360px] max-h-[620px]"
      onMouseEnter={() => setPausa(true)} onMouseLeave={() => setPausa(false)}
      onFocus={() => setPausa(true)} onBlur={() => setPausa(false)}
      onTouchStart={e => { toque.current = e.touches[0].clientX; }}
      onTouchEnd={e => { if (toque.current == null) return; const d = e.changedTouches[0].clientX - toque.current; if (Math.abs(d) > 50) ir(d < 0 ? 1 : -1); toque.current = null; }}>
      {slides.map((s, k) => (
        <div key={s.id} aria-hidden={k !== i} className={`absolute inset-0 transition-opacity duration-700 ${k === i ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}>
          <img src={s.imagen_url} alt={s.titulo || ''} className="w-full h-full object-cover" loading={k === 0 ? 'eager' : 'lazy'} />
          <div className="absolute inset-0 bg-gradient-to-t from-verde-900/70 via-verde-900/20 to-transparent" />
          {(s.titulo || s.subtitulo || s.boton_texto) && (
            <div className="absolute inset-x-0 bottom-0 px-6 pb-14 md:pb-16 text-center text-white">
              {s.titulo && <h2 className="text-4xl md:text-6xl leading-tight drop-shadow">{s.titulo}</h2>}
              {s.subtitulo && <p className="text-xl md:text-2xl mt-2 max-w-2xl mx-auto drop-shadow">{s.subtitulo}</p>}
              {s.boton_texto && s.boton_url && (
                s.boton_url.startsWith('/')
                  ? <Link to={s.boton_url} className="inline-block mt-5 px-7 py-2.5 bg-white/90 text-verde-900 text-xl hover:bg-white">{s.boton_texto}</Link>
                  : <a href={s.boton_url} target="_blank" rel="noreferrer" className="inline-block mt-5 px-7 py-2.5 bg-white/90 text-verde-900 text-xl hover:bg-white">{s.boton_texto}</a>
              )}
            </div>
          )}
        </div>
      ))}

      {n > 1 && (
        <>
          <button onClick={() => ir(-1)} aria-label="Anterior" className="absolute left-3 top-1/2 -translate-y-1/2 w-10 h-10 bg-white/70 hover:bg-white text-verde-900 flex items-center justify-center"><ChevronLeft size={22} /></button>
          <button onClick={() => ir(1)} aria-label="Siguiente" className="absolute right-3 top-1/2 -translate-y-1/2 w-10 h-10 bg-white/70 hover:bg-white text-verde-900 flex items-center justify-center"><ChevronRight size={22} /></button>
          <div className="absolute bottom-4 inset-x-0 flex justify-center gap-2">
            {slides.map((s, k) => (
              <button key={s.id} onClick={() => setI(k)} aria-label={`Ir a la imagen ${k + 1}`} aria-current={k === i}
                className={`h-2 rounded-full transition-all ${k === i ? 'w-7 bg-white' : 'w-2 bg-white/60'}`} />
            ))}
          </div>
        </>
      )}
    </section>
  );
}
