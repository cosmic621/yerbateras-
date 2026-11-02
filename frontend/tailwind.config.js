/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx,ts,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        // Una sola familia para toda la web (como en el flyer): Patrick Hand.
        display: ['"Patrick Hand"', '"Comic Sans MS"', 'cursive'],
        body:    ['"Patrick Hand"', '"Comic Sans MS"', 'cursive'],
        label:   ['"Patrick Hand"', '"Comic Sans MS"', 'cursive'],
      },
      colors: {
        // ── Paleta basada en el verde de marca #0f3c27 (referencia: tallerdehierbas.com) ──
        verde: {
          50:  '#f1f6f2',
          100: '#e0ebe3',
          200: '#c5d9cb',
          300: '#9dbfa9',
          400: '#6c9d83',
          500: '#447d61',
          600: '#2f6549',
          700: '#214f39',
          800: '#16422e',
          900: '#0f3c27',
        },
        dorado: {
          50:  '#fbf7ee',
          100: '#f5ecd7',
          200: '#ebdab4',
          300: '#dec58a',
          400: '#d1b072',
          500: '#c6a15b',
          600: '#a58545',
          700: '#856a38',
          800: '#66512c',
          900: '#4a3a20',
        },
        // Piel/terracota del personaje — acentos calidos, bordes, secundarios
        tierra: {
          50:  '#fbf3ee',
          100: '#f6e5da',
          200: '#eccbb4',
          300: '#dea688',
          400: '#d0835f',
          500: '#c2643c',
          600: '#a24d2b',
          700: '#833e22',
          800: '#66301a',
          900: '#4a2413',
        },
        // Acentos de las flores — uso puntual (badges, iconos, detalles), no para UI masiva
        turquesa: { 100: '#d6f2f2', 300: '#66cccc', 500: '#00a5a5', 700: '#007373' },
        morado:   { 100: '#f0dcec', 300: '#cc8fc0', 500: '#a54b96', 700: '#6e3163' },
        crema: {
          50:  '#fbfaf6',
          100: '#f6f3eb',
          200: '#ebe7dc',
          300: '#dcd8c9',
        },
      },
      boxShadow: {
        card: '0 1px 3px rgba(5,42,28,0.06), 0 1px 2px rgba(5,42,28,0.08)',
        'card-hover': '0 12px 28px rgba(5,42,28,0.12)',
      },
    }
  },
  plugins: []
}
