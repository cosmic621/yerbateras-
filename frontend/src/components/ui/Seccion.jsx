import BandaTitulo from './BandaTitulo';

// Piezas de texto compartidas por las páginas de contenido (Nosotras, Masajes, Talleres)
// para que todas tengan la misma jerarquía tipográfica.

export const HeroSeccion = ({ etiqueta, titulo, subtitulo }) => (
  <>
    <BandaTitulo>{etiqueta}</BandaTitulo>
    <header className="text-center px-6 pt-14 pb-2">
      <h1 className="text-5xl md:text-6xl text-verde-900 mb-4">{titulo}</h1>
      <p className="max-w-2xl mx-auto text-xl md:text-2xl text-verde-600 leading-snug">{subtitulo}</p>
    </header>
  </>
);

// Columna de lectura: ancho cómodo (~60 caracteres) y tamaño grande para móvil.
export const Texto = ({ children }) => (
  <div className="max-w-2xl mx-auto px-6 pt-12 pb-4 text-[1.2rem] leading-[1.65] text-verde-800 space-y-6">{children}</div>
);

export const Subtitulo = ({ children }) => (
  <h2 className="text-3xl text-verde-900 pt-6">{children}</h2>
);

// items: [{ t: 'Título', d: 'descripción' }]  o  ['texto simple']
export const Lista = ({ items }) => (
  <ul className="space-y-4">
    {items.map((it, i) => (
      <li key={i} className="flex gap-3">
        <span aria-hidden="true" className="text-dorado-500 mt-0.5">✿</span>
        <span>
          {typeof it === 'string' ? it : (<><span className="text-verde-900 text-[1.28rem]">{it.t}:</span> {it.d}</>)}
        </span>
      </li>
    ))}
  </ul>
);

// Frase de cierre grande, centrada
export const Cierre = ({ frase, sub }) => (
  <div className="max-w-2xl mx-auto px-6 py-12 text-center">
    <p className="text-4xl md:text-5xl text-verde-900 leading-tight">{frase}</p>
    {sub && <p className="text-xl md:text-2xl text-verde-600 mt-4 leading-snug">{sub}</p>}
  </div>
);
