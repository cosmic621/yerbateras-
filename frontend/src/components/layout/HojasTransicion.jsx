import { useEffect, useState, useRef } from 'react';
import { useLocation } from 'react-router-dom';

// Formas simples de hoja/pétalo tipo "diente de león" dibujadas en SVG inline,
// sin depender de imágenes externas.
const FORMAS = [
  // hoja
  (color) => (
    <path d="M12 2C7 6 5 12 12 22C19 12 17 6 12 2Z" fill={color} />
  ),
  // petalo/semilla de diente de leon
  (color) => (
    <circle cx="12" cy="12" r="4" fill={color} />
  ),
];

const COLORES = ['#447d61', '#6c9d83', '#c6a15b', '#dec58a', '#9dbfa9'];

const generarHojas = (cantidad) => Array.from({ length: cantidad }).map((_, i) => ({
  id: `${Date.now()}-${i}`,
  left: Math.random() * 100,
  delay: Math.random() * 0.4,
  duracion: 2.2 + Math.random() * 1.4,
  tamano: 14 + Math.random() * 14,
  rotacion: Math.random() * 360,
  forma: FORMAS[Math.floor(Math.random() * FORMAS.length)],
  color: COLORES[Math.floor(Math.random() * COLORES.length)],
  deriva: (Math.random() - 0.5) * 120,
}));

export default function HojasTransicion() {
  const { pathname } = useLocation();
  const [hojas, setHojas] = useState([]);
  const primerRender = useRef(true);

  useEffect(() => {
    // No lanzar la animacion en la carga inicial del sitio, solo al navegar
    if (primerRender.current) { primerRender.current = false; return; }
    const nuevas = generarHojas(10);
    setHojas(nuevas);
    const limpiar = setTimeout(() => setHojas([]), 4000);
    return () => clearTimeout(limpiar);
  }, [pathname]);

  if (!hojas.length) return null;

  return (
    <div style={{ position:'fixed', inset:0, zIndex:9999, pointerEvents:'none', overflow:'hidden' }} aria-hidden="true">
      {hojas.map(h => (
        <svg
          key={h.id}
          viewBox="0 0 24 24"
          width={h.tamano}
          height={h.tamano}
          style={{
            position:'absolute',
            top:-30,
            left:`${h.left}%`,
            animation: `caerHoja ${h.duracion}s ease-in ${h.delay}s forwards`,
            '--deriva': `${h.deriva}px`,
            '--rot': `${h.rotacion}deg`,
          }}
        >
          {h.forma(h.color)}
        </svg>
      ))}
      <style>{`
        @keyframes caerHoja {
          0%   { transform: translate(0, 0) rotate(0deg); opacity: 0; }
          8%   { opacity: 1; }
          100% { transform: translate(var(--deriva), 110vh) rotate(var(--rot)); opacity: 0; }
        }
      `}</style>
    </div>
  );
}
