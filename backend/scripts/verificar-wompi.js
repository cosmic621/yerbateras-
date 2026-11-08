#!/usr/bin/env node
// Revisa que la configuración de Wompi en backend/.env esté completa y sea coherente.
//   cd backend && node scripts/verificar-wompi.js
require('dotenv').config({ path: require('path').join(__dirname, '../.env') });
const { firmarIntegridad } = require('../config/wompi');

const ok = (m) => console.log('  ✔', m);
const mal = (m) => { console.log('  ✘', m); fallos++; };
const aviso = (m) => console.log('  !', m);
let fallos = 0;

const vars = {
  WOMPI_PUBLIC_KEY:    /^pub_(test|prod)_/,
  WOMPI_INTEGRITY_KEY: /^(test|prod)_integrity_/,
  WOMPI_EVENTS_KEY:    /^(test|prod)_events_/,
};

console.log('\nLlaves de Wompi');
const ambientes = new Set();
for (const [nombre, patron] of Object.entries(vars)) {
  const v = process.env[nombre];
  if (!v) { mal(`${nombre} no está definida en backend/.env`); continue; }
  if (v !== v.trim() || /["']/.test(v)) { mal(`${nombre} tiene espacios o comillas: quítalas, el valor va pegado al signo =`); continue; }
  if (/XXXX/.test(v)) { mal(`${nombre} todavía tiene el valor de ejemplo`); continue; }
  const m = v.match(patron);
  if (!m) { mal(`${nombre} no tiene el formato esperado (revisa que copiaste la llave correcta)`); continue; }
  ambientes.add(m[1]);
  ok(`${nombre} (${m[1] === 'test' ? 'pruebas' : 'PRODUCCIÓN'})`);
}
if (ambientes.size > 1) mal('Estás mezclando llaves de PRUEBAS con llaves de PRODUCCIÓN. Todas deben ser del mismo ambiente.');

if (!fallos) {
  console.log('\nPrueba de la firma de integridad');
  const f = firmarIntegridad('YRB-PRUEBA', 5000000, 'COP');
  /^[0-9a-f]{64}$/.test(f) ? ok(`se genera correctamente (${f.slice(0, 12)}…)`) : mal('no se pudo generar la firma');
}

console.log('\nOtros datos');
process.env.CLIENT_URL ? ok(`CLIENT_URL = ${process.env.CLIENT_URL}`) : aviso('CLIENT_URL no definida (los enlaces de los correos usarán localhost)');
process.env.EMAIL_USER && process.env.EMAIL_PASS ? ok('Correo configurado (EMAIL_USER / EMAIL_PASS)') : aviso('Falta EMAIL_USER / EMAIL_PASS: los pagos funcionan, pero no se enviarán los correos de confirmación');

console.log(fallos ? `\n✘ ${fallos} problema(s). Corrígelos en backend/.env y reinicia el backend.\n` : '\n✔ Todo en orden. Recuerda reiniciar el backend si acabas de cambiar el .env.\n');
process.exit(fallos ? 1 : 0);
