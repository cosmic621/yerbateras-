/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx,ts,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        display: ['"Playfair Display"', 'Georgia', 'serif'],
        body: ['"Source Serif 4"', 'Georgia', 'serif'],
        // Aproximacion a la fuente de la referencia (small-caps, estilo botica).
        // No es un match exacto — si tienes el archivo/nombre real de la fuente
        // que usa la empresa, lo cambiamos por el original.
        label: ['"Cormorant Garamond"', 'Georgia', 'serif'],
      },
      colors: {
        // ── Extraidos directamente del logo (pip+Pillow, no a ojo) ──
        verde: {
          50:  '#eefaf4',
          100: '#d6f0e2',
          200: '#a8dec0',
          300: '#6ec194',
          400: '#3aa06e',
          500: '#1c8452',
          600: '#146b42',
          700: '#0f5535',
          800: '#0a3d28',
          900: '#052a1c',
        },
        dorado: {
          50:  '#fefaf0',
          100: '#fbf2dc',
          200: '#f6e4b8',
          300: '#efd08f',
          400: '#e8bc66',
          500: '#e0a83e',
          600: '#bc7d28',
          700: '#99631f',
          800: '#7a4e18',
          900: '#5c3a12',
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
          50:  '#fdfbf6',
          100: '#F5F0E1',
          200: '#ede8da',
          300: '#ddd6c2',
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
