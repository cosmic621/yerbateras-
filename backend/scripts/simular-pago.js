#!/usr/bin/env node
// SOLO PARA PRUEBAS EN TU COMPUTADOR.
// Wompi avisa de los pagos con un mensaje a tu servidor, y no puede llegar a "localhost".
// Este comando manda ese mismo mensaje (firmado igual que Wompi) para ver el flujo completo.
//
//   cd backend
//   node scripts/simular-pago.js YRB-1730000000000-ab12cd34            (aprobado)
//   node scripts/simular-pago.js YRB-1730000000000-ab12cd34 DECLINED   (rechazado)
//
// La referencia aparece en la terminal del backend o en la tabla pedidos (wompi_reference).
require('dotenv').config({ path: require('path').join(__dirname, '../.env') });
const crypto = require('crypto');
const pool = require('../config/db');

(async () => {
  if (process.env.NODE_ENV === 'production') { console.error('Este comando no se puede usar en producción.'); process.exit(1); }
  const [ref, estado = 'APPROVED'] = process.argv.slice(2);
  if (!ref) { console.error('Uso: node scripts/simular-pago.js <referencia> [APPROVED|DECLINED]'); process.exit(1); }
  if (!process.env.WOMPI_EVENTS_KEY) { console.error('Falta WOMPI_EVENTS_KEY en backend/.env'); process.exit(1); }

  const consultas = {
    'YRB-':  ['SELECT total AS monto FROM pedidos WHERE wompi_reference = $1', 1],
    'CITA-': ['SELECT s.precio AS monto FROM citas c JOIN servicios_masaje s ON s.id = c.servicio_id WHERE c.wompi_reference = $1', 1],
    'TALL-': ['SELECT monto FROM pagos_taller WHERE wompi_reference = $1', 1],
  };
  const prefijo = Object.keys(consultas).find(p => ref.startsWith(p));
  if (!prefijo) { console.error('La referencia debe empezar por YRB-, CITA- o TALL-'); process.exit(1); }

  const { rows } = await pool.query(consultas[prefijo][0], [ref]);
  if (!rows[0]) { console.error('No encontré esa referencia en la base de datos.'); process.exit(1); }
  const cents = Math.round(Number(rows[0].monto) * 100);

  const id = `sim-${Date.now()}`;
  const timestamp = Math.floor(Date.now() / 1000);
  const checksum = crypto.createHash('sha256').update(`${id}${estado}${cents}${timestamp}${process.env.WOMPI_EVENTS_KEY}`).digest('hex');
  const url = `http://localhost:${process.env.PORT || 3000}/api/pagos/webhook`;

  const res = await fetch(url, {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      event: 'transaction.updated',
      data: { transaction: { id, status: estado, amount_in_cents: cents, reference: ref } },
      signature: { properties: ['transaction.id', 'transaction.status', 'transaction.amount_in_cents'], checksum },
      timestamp,
    }),
  }).catch(e => { console.error(`No pude conectar con ${url}. ¿Está corriendo el backend?`); process.exit(1); });

  console.log(res.ok ? `✔ Aviso enviado (${estado}, $${(cents / 100).toLocaleString('es-CO')}). Revisa el pedido en el panel admin.` : `✘ El backend respondió ${res.status}: ${await res.text()}`);
  process.exit(res.ok ? 0 : 1);
})();
