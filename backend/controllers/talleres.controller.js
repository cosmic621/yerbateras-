const pool = require('../config/db');
const { generarReferenciaTaller, firmarIntegridad } = require('../config/wompi');
const { enviarInscripcionTaller, enviarAlertaInscripcionTaller } = require('../config/email');
const { seccionActiva } = require('./sitio.controller');

const MINUTOS_PARA_PAGAR = 30;
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// Cupos que cuentan como "ocupados": inscripciones confirmadas + las que estan
// pagando ahora mismo (reserva de 30 min). Se usa dentro y fuera de transacciones.
const OCUPADOS_SQL = `COALESCE((
  SELECT SUM(i.asistentes) FROM inscripciones_taller i
  WHERE i.taller_id = t.id
    AND (i.estado = 'confirmada' OR (i.estado = 'pendiente_pago' AND i.pago_expira > NOW()))
), 0)`;

const COLS_PUB = `t.id, t.titulo, t.descripcion, t.instructor,
  to_char(t.fecha,'YYYY-MM-DD') AS fecha, to_char(t.hora_inicio,'HH24:MI') AS hora_inicio,
  t.duracion_horas, t.lugar, t.precio, t.cupos, t.porcentaje_minimo, t.flyer_url, t.activo`;

// ─── PUBLICO: GET /api/talleres ─────────────────────────────
exports.listarTalleres = async (req, res) => {
  try {
    if (!(await seccionActiva('talleres'))) return res.json({ ok: true, talleres: [] });
    const { rows } = await pool.query(
      `SELECT ${COLS_PUB}, ${OCUPADOS_SQL} AS cupos_ocupados
       FROM talleres t
       WHERE t.activo = TRUE AND t.fecha >= (NOW() AT TIME ZONE 'America/Bogota')::date
       ORDER BY t.fecha, t.hora_inicio`
    );
    res.json({
      ok: true,
      talleres: rows.map(r => ({ ...r, cupos_disponibles: Math.max(r.cupos - Number(r.cupos_ocupados), 0) })),
    });
  } catch (err) {
    console.error('Error listarTalleres:', err);
    res.status(500).json({ ok: false, mensaje: 'Error al obtener los talleres' });
  }
};

// Arma la respuesta que necesita el widget de Wompi.
const datosPago = (reference, monto) => {
  const amountInCents = Math.round(Number(monto) * 100);
  return {
    reference, amountInCents, currency: 'COP',
    publicKey: process.env.WOMPI_PUBLIC_KEY,
    signature: firmarIntegridad(reference, amountInCents, 'COP'),
  };
};

// ─── PUBLICO: POST /api/talleres/inscribir ──────────────────
// Reserva cupos y devuelve los datos de pago del anticipo (minimo porcentaje_minimo %).
exports.iniciarInscripcion = async (req, res) => {
  const { taller_id, nombre, email, telefono, asistentes = 1, porcentaje, notas, acepta_politica } = req.body;
  const personas = Number(asistentes);

  if (!taller_id || !nombre?.trim() || !email || !telefono) {
    return res.status(400).json({ ok: false, mensaje: 'Todos los campos son requeridos' });
  }
  if (!EMAIL_RE.test(email)) return res.status(400).json({ ok: false, mensaje: 'Email inválido' });
  if (!/^\+?[0-9]{7,15}$/.test(String(telefono).replace(/\s/g, ''))) {
    return res.status(400).json({ ok: false, mensaje: 'Teléfono inválido' });
  }
  if (!Number.isInteger(personas) || personas < 1 || personas > 10) {
    return res.status(400).json({ ok: false, mensaje: 'Los asistentes deben ser entre 1 y 10' });
  }
  if (acepta_politica !== true) {
    return res.status(400).json({ ok: false, mensaje: 'Debes aceptar las condiciones de pago del taller' });
  }

  const client = await pool.connect();
  try {
    if (!(await seccionActiva('talleres'))) {
      return res.status(404).json({ ok: false, mensaje: 'Los talleres no están disponibles por ahora' });
    }
    await client.query('BEGIN');

    // Se bloquea la fila del taller para que dos personas no tomen el ultimo cupo a la vez.
    const tallerRes = await client.query(
      `SELECT t.*, ${OCUPADOS_SQL} AS ocupados,
              (t.fecha >= (NOW() AT TIME ZONE 'America/Bogota')::date) AS vigente
       FROM talleres t WHERE t.id = $1 AND t.activo = TRUE FOR UPDATE OF t`,
      [taller_id]
    );
    const taller = tallerRes.rows[0];
    if (!taller || !taller.vigente) {
      await client.query('ROLLBACK');
      return res.status(404).json({ ok: false, mensaje: 'Taller no disponible' });
    }

    const disponibles = taller.cupos - Number(taller.ocupados);
    if (personas > disponibles) {
      await client.query('ROLLBACK');
      return res.status(409).json({
        ok: false,
        mensaje: disponibles > 0 ? `Solo quedan ${disponibles} cupo(s) en este taller.` : 'Este taller ya no tiene cupos.',
      });
    }

    const pct = Number(porcentaje ?? taller.porcentaje_minimo);
    if (!Number.isInteger(pct) || pct < taller.porcentaje_minimo || pct > 100) {
      await client.query('ROLLBACK');
      return res.status(400).json({ ok: false, mensaje: `El pago inicial debe ser entre ${taller.porcentaje_minimo}% y 100%` });
    }

    const montoTotal = Number(taller.precio) * personas;
    const montoAPagar = Math.round(montoTotal * pct / 100);
    const expira = new Date(Date.now() + MINUTOS_PARA_PAGAR * 60 * 1000);

    const insc = await client.query(
      `INSERT INTO inscripciones_taller (taller_id, nombre, email, telefono, asistentes, monto_total, estado, pago_expira, notas)
       VALUES ($1,$2,$3,$4,$5,$6,'pendiente_pago',$7,$8) RETURNING id`,
      [taller_id, nombre.trim(), email.trim().toLowerCase(), telefono, personas, montoTotal, expira, notas || null]
    );
    const reference = generarReferenciaTaller();
    await client.query(
      'INSERT INTO pagos_taller (inscripcion_id, wompi_reference, monto) VALUES ($1,$2,$3)',
      [insc.rows[0].id, reference, montoAPagar]
    );
    await client.query('COMMIT');

    res.status(201).json({
      ok: true,
      inscripcion_id: insc.rows[0].id,
      ...datosPago(reference, montoAPagar),
      taller_titulo: taller.titulo,
      asistentes: personas,
      monto_total: montoTotal,
      monto_a_pagar: montoAPagar,
      saldo: montoTotal - montoAPagar,
    });
  } catch (err) {
    await client.query('ROLLBACK').catch(() => {});
    console.error('Error iniciarInscripcion:', err);
    res.status(500).json({ ok: false, mensaje: 'Error al iniciar la inscripción' });
  } finally {
    client.release();
  }
};

// ─── PUBLICO: POST /api/talleres/inscripciones/:id/saldo  { email } ─
// Permite pagar online lo que falta de una inscripcion ya confirmada.
exports.iniciarPagoSaldo = async (req, res) => {
  const { id } = req.params;
  const { email } = req.body;
  if (!email) return res.status(400).json({ ok: false, mensaje: 'El correo es requerido' });
  try {
    const { rows } = await pool.query(
      `SELECT i.*, t.titulo FROM inscripciones_taller i JOIN talleres t ON t.id = i.taller_id
       WHERE i.id = $1 AND LOWER(i.email) = LOWER($2) AND i.estado = 'confirmada'`,
      [id, email.trim()]
    );
    const insc = rows[0];
    if (!insc) return res.status(404).json({ ok: false, mensaje: 'Inscripción no encontrada' });
    const saldo = Number(insc.monto_total) - Number(insc.monto_pagado);
    if (saldo <= 0) return res.status(400).json({ ok: false, mensaje: 'Esta inscripción ya está pagada por completo' });

    const reference = generarReferenciaTaller();
    await pool.query('INSERT INTO pagos_taller (inscripcion_id, wompi_reference, monto) VALUES ($1,$2,$3)', [id, reference, saldo]);
    res.status(201).json({ ok: true, ...datosPago(reference, saldo), taller_titulo: insc.titulo, monto_a_pagar: saldo });
  } catch (err) {
    console.error('Error iniciarPagoSaldo:', err);
    res.status(500).json({ ok: false, mensaje: 'Error al iniciar el pago del saldo' });
  }
};

// ─── Llamada desde el webhook de Wompi (referencia "TALL-") ──
// Idempotente: si Wompi reintenta el evento, no se suma dos veces.
exports.confirmarPagoTaller = async (reference, tx) => {
  const client = await pool.connect();
  let aviso = null;
  try {
    await client.query('BEGIN');
    const pagoRes = await client.query('SELECT * FROM pagos_taller WHERE wompi_reference = $1 FOR UPDATE', [reference]);
    const pago = pagoRes.rows[0];
    if (!pago || pago.estado === 'aprobado') { await client.query('ROLLBACK'); return; }

    // El monto que Wompi cobro debe ser EXACTAMENTE el que se registro al crear el pago.
    if (Number(tx.amount_in_cents) !== Math.round(Number(pago.monto) * 100)) {
      console.error(`Taller: monto no coincide (ref ${reference}): esperado ${pago.monto}, recibido ${tx.amount_in_cents / 100}`);
      await client.query('ROLLBACK');
      return;
    }

    await client.query(
      "UPDATE pagos_taller SET estado = 'aprobado', wompi_transaction_id = $1 WHERE id = $2",
      [tx.id, pago.id]
    );

    const inscRes = await client.query(
      `SELECT i.*, t.titulo, t.cupos, t.porcentaje_minimo, t.lugar,
              to_char(t.fecha,'YYYY-MM-DD') AS fecha_taller, to_char(t.hora_inicio,'HH24:MI') AS hora_taller
       FROM inscripciones_taller i JOIN talleres t ON t.id = i.taller_id
       WHERE i.id = $1 FOR UPDATE OF i`,
      [pago.inscripcion_id]
    );
    const insc = inscRes.rows[0];
    const nuevoPagado = Number(insc.monto_pagado) + Number(pago.monto);
    const minimo = Math.ceil(Number(insc.monto_total) * insc.porcentaje_minimo / 100);
    const quedaConfirmada = nuevoPagado >= minimo;
    const eraNueva = insc.estado !== 'confirmada';

    let revision = insc.requiere_revision;
    if (eraNueva && quedaConfirmada) {
      // Si la reserva de 30 min ya vencio, verificamos que aun haya cupo.
      const oc = await client.query(
        `SELECT COALESCE(SUM(asistentes),0) AS n FROM inscripciones_taller
         WHERE taller_id = $1 AND id <> $2
           AND (estado = 'confirmada' OR (estado = 'pendiente_pago' AND pago_expira > NOW()))`,
        [insc.taller_id, insc.id]
      );
      if (Number(oc.rows[0].n) + insc.asistentes > insc.cupos) revision = true;
    }

    await client.query(
      `UPDATE inscripciones_taller SET monto_pagado = $1, estado = $2, requiere_revision = $3, actualizado_en = NOW() WHERE id = $4`,
      [nuevoPagado, quedaConfirmada ? 'confirmada' : insc.estado, revision, insc.id]
    );
    await client.query('COMMIT');
    aviso = { insc: { ...insc, monto_pagado: nuevoPagado, requiere_revision: revision }, pago: Number(pago.monto), eraNueva: eraNueva && quedaConfirmada };
  } catch (err) {
    await client.query('ROLLBACK').catch(() => {});
    console.error('Error confirmarPagoTaller:', err);
    throw err; // el webhook responde 500 y Wompi reintenta
  } finally {
    client.release();
  }

  if (aviso) {
    enviarInscripcionTaller(aviso.insc.email, aviso.insc.nombre, aviso.insc, aviso.pago)
      .catch(e => console.error('Error enviando email de taller:', e));
    if (process.env.EMAIL_NEGOCIO) {
      enviarAlertaInscripcionTaller(process.env.EMAIL_NEGOCIO, aviso.insc, aviso.pago)
        .catch(e => console.error('Error enviando alerta de taller:', e));
    }
  }
};

exports.cancelarPagoTaller = async (reference) => {
  try {
    const { rows } = await pool.query(
      "UPDATE pagos_taller SET estado = 'rechazado' WHERE wompi_reference = $1 AND estado = 'pendiente' RETURNING inscripcion_id",
      [reference]
    );
    if (rows[0]) {
      // Solo se libera el cupo si la inscripcion nunca llego a confirmarse
      await pool.query(
        "UPDATE inscripciones_taller SET estado = 'cancelada', actualizado_en = NOW() WHERE id = $1 AND estado = 'pendiente_pago'",
        [rows[0].inscripcion_id]
      );
    }
  } catch (err) {
    console.error('Error cancelando pago de taller:', err);
  }
};

// ─── ADMIN ──────────────────────────────────────────────────
exports.listarTalleresAdmin = async (req, res) => {
  try {
    const { rows } = await pool.query(
      `SELECT ${COLS_PUB}, ${OCUPADOS_SQL} AS cupos_ocupados,
              (SELECT COUNT(*) FROM inscripciones_taller i WHERE i.taller_id = t.id AND i.estado = 'confirmada') AS inscritos
       FROM talleres t ORDER BY t.fecha DESC, t.hora_inicio`
    );
    res.json({ ok: true, talleres: rows });
  } catch (err) {
    console.error('Error listarTalleresAdmin:', err);
    res.status(500).json({ ok: false, mensaje: 'Error al obtener los talleres' });
  }
};

const vacio = (v) => (v === undefined || v === null || v === '' ? null : v);

exports.crearTaller = async (req, res) => {
  const { titulo, descripcion, instructor, fecha, hora_inicio, duracion_horas, lugar, precio, cupos, porcentaje_minimo, activo } = req.body;
  if (!titulo?.trim() || !fecha || !hora_inicio || precio === undefined || precio === '') {
    return res.status(400).json({ ok: false, mensaje: 'Título, fecha, hora y precio son requeridos' });
  }
  const pct = Number(porcentaje_minimo || 50);
  if (!Number.isInteger(pct) || pct < 50 || pct > 100) {
    return res.status(400).json({ ok: false, mensaje: 'El pago mínimo debe estar entre 50% y 100%' });
  }
  const flyer = req.file ? `/uploads/${req.file.filename}` : null;
  try {
    const { rows } = await pool.query(
      `INSERT INTO talleres (titulo, descripcion, instructor, fecha, hora_inicio, duracion_horas, lugar, precio, cupos, porcentaje_minimo, flyer_url, activo)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12) RETURNING id`,
      [titulo.trim(), vacio(descripcion), vacio(instructor), fecha, hora_inicio, Number(duracion_horas || 2), vacio(lugar),
       Number(precio), Number(cupos || 10), pct, flyer, activo === undefined ? true : (activo === true || activo === 'true')]
    );
    res.status(201).json({ ok: true, mensaje: 'Taller creado', id: rows[0].id });
  } catch (err) {
    console.error('Error crearTaller:', err);
    res.status(500).json({ ok: false, mensaje: 'Error al crear el taller' });
  }
};

exports.actualizarTaller = async (req, res) => {
  const { id } = req.params;
  const { titulo, descripcion, instructor, fecha, hora_inicio, duracion_horas, lugar, precio, cupos, porcentaje_minimo, activo } = req.body;
  if (porcentaje_minimo !== undefined && porcentaje_minimo !== '') {
    const pct = Number(porcentaje_minimo);
    if (!Number.isInteger(pct) || pct < 50 || pct > 100) {
      return res.status(400).json({ ok: false, mensaje: 'El pago mínimo debe estar entre 50% y 100%' });
    }
  }
  const flyer = req.file ? `/uploads/${req.file.filename}` : null;
  try {
    const { rows } = await pool.query(
      `UPDATE talleres SET
         titulo = COALESCE($1, titulo), descripcion = $2, instructor = $3,
         fecha = COALESCE($4::date, fecha), hora_inicio = COALESCE($5::time, hora_inicio),
         duracion_horas = COALESCE($6::numeric, duracion_horas), lugar = $7,
         precio = COALESCE($8::numeric, precio), cupos = COALESCE($9::int, cupos),
         porcentaje_minimo = COALESCE($10::int, porcentaje_minimo),
         flyer_url = COALESCE($11, flyer_url), activo = COALESCE($12::boolean, activo)
       WHERE id = $13 RETURNING id`,
      [vacio(titulo?.trim()), vacio(descripcion), vacio(instructor), vacio(fecha), vacio(hora_inicio), vacio(duracion_horas),
       vacio(lugar), vacio(precio), vacio(cupos), vacio(porcentaje_minimo), flyer, activo === undefined ? null : String(activo), id]
    );
    if (!rows[0]) return res.status(404).json({ ok: false, mensaje: 'Taller no encontrado' });
    res.json({ ok: true, mensaje: 'Taller actualizado' });
  } catch (err) {
    console.error('Error actualizarTaller:', err);
    res.status(500).json({ ok: false, mensaje: 'Error al actualizar el taller' });
  }
};

// Si ya tiene inscripciones solo se desactiva (no se pierde el historial de pagos).
exports.eliminarTaller = async (req, res) => {
  const { id } = req.params;
  try {
    const { rows } = await pool.query('SELECT COUNT(*) FROM inscripciones_taller WHERE taller_id = $1', [id]);
    if (Number(rows[0].count) > 0) {
      await pool.query('UPDATE talleres SET activo = FALSE WHERE id = $1', [id]);
      return res.json({ ok: true, mensaje: 'El taller tiene inscripciones, se desactivó en vez de borrarse.' });
    }
    await pool.query('DELETE FROM talleres WHERE id = $1', [id]);
    res.json({ ok: true, mensaje: 'Taller eliminado' });
  } catch (err) {
    console.error('Error eliminarTaller:', err);
    res.status(500).json({ ok: false, mensaje: 'Error al eliminar el taller' });
  }
};

exports.listarInscripciones = async (req, res) => {
  try {
    const { rows } = await pool.query(
      `SELECT id, nombre, email, telefono, asistentes, monto_total, monto_pagado,
              (monto_total - monto_pagado) AS saldo, estado, requiere_revision, notas, creado_en
       FROM inscripciones_taller
       WHERE taller_id = $1 AND estado <> 'cancelada'
       ORDER BY creado_en`,
      [req.params.id]
    );
    res.json({ ok: true, inscripciones: rows });
  } catch (err) {
    console.error('Error listarInscripciones:', err);
    res.status(500).json({ ok: false, mensaje: 'Error al obtener las inscripciones' });
  }
};

// Registrar un pago recibido fuera de la pagina (transferencia, en persona...)
exports.registrarPagoManual = async (req, res) => {
  const monto = Number(req.body.monto);
  if (!(monto > 0)) return res.status(400).json({ ok: false, mensaje: 'Monto inválido' });
  try {
    const { rows } = await pool.query(
      `UPDATE inscripciones_taller i SET monto_pagado = LEAST(i.monto_pagado + $1, i.monto_total), actualizado_en = NOW()
       WHERE i.id = $2 AND i.estado = 'confirmada' RETURNING monto_pagado, monto_total`,
      [monto, req.params.id]
    );
    if (!rows[0]) return res.status(404).json({ ok: false, mensaje: 'Inscripción no encontrada o no confirmada' });
    res.json({ ok: true, mensaje: 'Pago registrado', ...rows[0] });
  } catch (err) {
    console.error('Error registrarPagoManual:', err);
    res.status(500).json({ ok: false, mensaje: 'Error al registrar el pago' });
  }
};

exports.cancelarInscripcion = async (req, res) => {
  try {
    const { rows } = await pool.query(
      "UPDATE inscripciones_taller SET estado = 'cancelada', actualizado_en = NOW() WHERE id = $1 RETURNING id",
      [req.params.id]
    );
    if (!rows[0]) return res.status(404).json({ ok: false, mensaje: 'Inscripción no encontrada' });
    res.json({ ok: true, mensaje: 'Inscripción cancelada (el cupo queda libre)' });
  } catch (err) {
    console.error('Error cancelarInscripcion:', err);
    res.status(500).json({ ok: false, mensaje: 'Error al cancelar la inscripción' });
  }
};
