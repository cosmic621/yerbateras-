const pool = require('../config/db');
const { enviarCitaConfirmadaCliente, enviarAlertaCitaNegocio, enviarPagoCitaConfirmado } = require('../config/email');
const { notificarNuevaCita } = require('../config/whatsapp');
const { generarReferenciaCita, firmarIntegridad } = require('../config/wompi');

const MINUTOS_PARA_PAGAR = 30; // tiempo que se reserva el horario mientras el cliente paga

// ─── Helpers ────────────────────────────────────────────────
const obtenerHorarioDia = async (diaSemana) => {
  const { rows } = await pool.query(
    'SELECT hora_apertura, hora_cierre, activo FROM horario_atencion WHERE dia_semana = $1',
    [diaSemana]
  );
  return rows[0] || { activo: false };
};

const generarSlots = (apertura, cierre, duracionMin) => {
  const slots = [];
  const [hA, mA] = apertura.split(':').map(Number);
  const [hC, mC] = cierre.split(':').map(Number);
  let cursor = hA * 60 + mA;
  const fin = hC * 60 + mC;
  while (cursor + duracionMin <= fin) {
    const h = String(Math.floor(cursor / 60)).padStart(2, '0');
    const m = String(cursor % 60).padStart(2, '0');
    slots.push(`${h}:${m}:00`);
    cursor += duracionMin;
  }
  return slots;
};

const minutos = (horaStr) => {
  const [h, m] = horaStr.split(':').map(Number);
  return h * 60 + m;
};

// ─── GET /api/citas/servicios ──────────────────────────────
exports.listarServicios = async (req, res) => {
  try {
    const { rows } = await pool.query(
      `SELECT id, nombre, descripcion, duracion_minutos, precio
       FROM servicios_masaje WHERE activo = TRUE ORDER BY nombre`
    );
    res.json({ ok: true, servicios: rows });
  } catch (err) {
    console.error('Error listarServicios:', err);
    res.status(500).json({ ok: false, mensaje: 'Error al obtener servicios' });
  }
};

// ─── GET /api/citas/disponibilidad?fecha=&servicio_id=&excluir_cita_id= ─
// excluir_cita_id es opcional: se usa al reprogramar, para que la propia
// cita que se esta moviendo no cuente como "ocupada" contra si misma.
exports.obtenerDisponibilidad = async (req, res) => {
  const { fecha, servicio_id, excluir_cita_id } = req.query;
  if (!fecha || !servicio_id) {
    return res.status(400).json({ ok: false, mensaje: 'fecha y servicio_id son requeridos' });
  }
  try {
    const servicioRes = await pool.query(
      'SELECT duracion_minutos FROM servicios_masaje WHERE id = $1 AND activo = TRUE',
      [servicio_id]
    );
    if (!servicioRes.rows[0]) return res.status(404).json({ ok: false, mensaje: 'Servicio no encontrado' });
    const duracion = servicioRes.rows[0].duracion_minutos;

    const diaSemana = new Date(`${fecha}T00:00:00`).getDay();
    const horario = await obtenerHorarioDia(diaSemana);
    if (!horario.activo) {
      return res.json({ ok: true, horarios: [], duracion_minutos: duracion });
    }

    const todosLosSlots = generarSlots(horario.hora_apertura, horario.hora_cierre, duracion);

    const paramsOcupadas = [fecha];
    let excluirClause = '';
    if (excluir_cita_id) { paramsOcupadas.push(excluir_cita_id); excluirClause = 'AND id != $2'; }

    const { rows: ocupadas } = await pool.query(
      `SELECT hora_inicio, hora_fin FROM citas
       WHERE fecha = $1 ${excluirClause}
         AND (estado = 'confirmada' OR (estado = 'pendiente_pago' AND pago_expira > NOW()))`,
      paramsOcupadas
    );
    const { rows: bloqueos } = await pool.query(
      `SELECT hora_inicio, hora_fin FROM bloqueos_agenda WHERE fecha = $1`,
      [fecha]
    );
    const ocupadosTodos = [...ocupadas, ...bloqueos];

    let disponibles = todosLosSlots.filter(slot => {
      const inicioMin = minutos(slot);
      const finMin = inicioMin + duracion;
      return !ocupadosTodos.some(o => {
        const oInicio = minutos(o.hora_inicio);
        const oFin = minutos(o.hora_fin);
        return inicioMin < oFin && finMin > oInicio;
      });
    });

    const hoy = new Date().toISOString().slice(0, 10);
    if (fecha === hoy) {
      const ahoraMin = new Date().getHours() * 60 + new Date().getMinutes();
      disponibles = disponibles.filter(slot => minutos(slot) > ahoraMin);
    }

    res.json({ ok: true, horarios: disponibles, duracion_minutos: duracion });
  } catch (err) {
    console.error('Error obtenerDisponibilidad:', err);
    res.status(500).json({ ok: false, mensaje: 'Error al calcular disponibilidad' });
  }
};

// ─── POST /api/citas/iniciar-pago (publica, o autenticada) ──
// Reemplaza el flujo anterior de "reservar y confirmar por correo".
// Ahora la cita solo queda CONFIRMADA cuando Wompi confirma el pago
// (ver confirmarPagoCita, que llama el webhook de pagos).
exports.iniciarPagoCita = async (req, res) => {
  const { servicio_id, nombre, email, telefono, fecha, hora, notas } = req.body;
  if (!servicio_id || !nombre || !email || !telefono || !fecha || !hora) {
    return res.status(400).json({ ok: false, mensaje: 'Todos los campos son requeridos' });
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return res.status(400).json({ ok: false, mensaje: 'Email inválido' });
  }

  try {
    const servicioRes = await pool.query(
      'SELECT nombre, duracion_minutos, precio FROM servicios_masaje WHERE id = $1 AND activo = TRUE',
      [servicio_id]
    );
    if (!servicioRes.rows[0]) return res.status(404).json({ ok: false, mensaje: 'Servicio no encontrado' });
    const { nombre: servicioNombre, duracion_minutos, precio } = servicioRes.rows[0];

    const inicioMin = minutos(hora);
    const finMin = inicioMin + duracion_minutos;
    const pad = (n) => String(n).padStart(2, '0');
    const horaInicio = `${pad(Math.floor(inicioMin / 60))}:${pad(inicioMin % 60)}:00`;
    const horaFin = `${pad(Math.floor(finMin / 60))}:${pad(finMin % 60)}:00`;

    const { rows: conflictos } = await pool.query(
      `SELECT id FROM citas
       WHERE fecha = $1
         AND (estado = 'confirmada' OR (estado = 'pendiente_pago' AND pago_expira > NOW()))
         AND hora_inicio < $2 AND hora_fin > $3`,
      [fecha, horaFin, horaInicio]
    );
    if (conflictos.length) {
      return res.status(409).json({ ok: false, mensaje: 'Ese horario ya no está disponible, elige otro.' });
    }

    const reference = generarReferenciaCita();
    const amountInCents = Math.round(Number(precio) * 100);
    const currency = 'COP';
    const signature = firmarIntegridad(reference, amountInCents, currency);
    const pagoExpira = new Date(Date.now() + MINUTOS_PARA_PAGAR * 60 * 1000);
    const usuarioId = req.usuario?.id || null; // si esta logueado, vinculamos la cita a su cuenta

    const { rows } = await pool.query(
      `INSERT INTO citas (servicio_id, nombre_cliente, email_cliente, telefono_cliente,
                           fecha, hora_inicio, hora_fin, notas, estado, wompi_reference, pago_expira, usuario_id)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,'pendiente_pago',$9,$10,$11)
       RETURNING id`,
      [servicio_id, nombre, email, telefono, fecha, horaInicio, horaFin, notas || null, reference, pagoExpira, usuarioId]
    );

    res.status(201).json({
      ok: true,
      cita_id: rows[0].id,
      reference,
      amountInCents,
      currency,
      publicKey: process.env.WOMPI_PUBLIC_KEY,
      signature,
      precio: Number(precio),
      servicio_nombre: servicioNombre,
    });
  } catch (err) {
    console.error('Error iniciarPagoCita:', err);
    res.status(500).json({ ok: false, mensaje: 'Error al iniciar el pago de la cita' });
  }
};

// ─── Llamada desde el webhook de Wompi cuando un pago de cita ─
// (reference que empieza con "CITA-") queda APPROVED. No es una ruta
// HTTP directa — la usa pagos.controller.js.
exports.confirmarPagoCita = async (reference, transaccion) => {
  const { rows } = await pool.query(
    `UPDATE citas SET estado = 'confirmada', pagada = TRUE, monto_pagado = $1,
            wompi_transaction_id = $2, actualizado_en = NOW()
     WHERE wompi_reference = $3 AND estado != 'confirmada'
     RETURNING id, servicio_id, nombre_cliente, email_cliente, telefono_cliente,
               fecha, hora_inicio, hora_fin, notas, monto_pagado`,
    [transaccion.amount_in_cents / 100, transaccion.id, reference]
  );
  const cita = rows[0];
  if (!cita) return; // ya estaba confirmada o no existe (evita duplicar notificaciones)

  const servicioRes = await pool.query('SELECT nombre FROM servicios_masaje WHERE id = $1', [cita.servicio_id]);
  const citaCompleta = { ...cita, servicio_nombre: servicioRes.rows[0]?.nombre || 'Masaje' };

  enviarPagoCitaConfirmado(cita.email_cliente, cita.nombre_cliente, citaCompleta)
    .catch(err => console.error('Error enviando email de pago de cita:', err));

  if (process.env.EMAIL_NEGOCIO) {
    enviarAlertaCitaNegocio(process.env.EMAIL_NEGOCIO, citaCompleta)
      .catch(err => console.error('Error enviando alerta de cita al negocio:', err));
  }

  notificarNuevaCita(citaCompleta)
    .then(enviado => {
      if (enviado) pool.query('UPDATE citas SET whatsapp_enviado = TRUE WHERE id = $1', [cita.id]).catch(console.error);
    })
    .catch(err => console.error('Error notificando WhatsApp (opcional):', err));
};

// Cuando un pago de cita falla/se cancela, liberamos el horario.
exports.cancelarPagoCita = async (reference) => {
  await pool.query(
    `UPDATE citas SET estado = 'cancelada', actualizado_en = NOW() WHERE wompi_reference = $1 AND estado != 'confirmada'`,
    [reference]
  ).catch(err => console.error('Error cancelando pago de cita:', err));
};

// ─── GET /api/citas/mis-citas (cliente autenticado) ─────────
exports.misCitas = async (req, res) => {
  try {
    const { rows } = await pool.query(
      `SELECT c.id, c.fecha, c.hora_inicio, c.hora_fin, c.estado, c.notas, c.servicio_id,
              s.nombre AS servicio_nombre, s.duracion_minutos
       FROM citas c JOIN servicios_masaje s ON s.id = c.servicio_id
       WHERE c.usuario_id = $1 AND c.estado IN ('confirmada','pendiente_pago')
       ORDER BY c.fecha, c.hora_inicio`,
      [req.usuario.id]
    );
    res.json({ ok: true, citas: rows });
  } catch (err) {
    console.error('Error misCitas:', err);
    res.status(500).json({ ok: false, mensaje: 'Error al obtener tus citas' });
  }
};

// ─── PATCH /api/citas/:id/reprogramar (cliente, dueño de la cita) ─
exports.reprogramarCita = async (req, res) => {
  const { id } = req.params;
  const { fecha, hora } = req.body;
  if (!fecha || !hora) return res.status(400).json({ ok: false, mensaje: 'fecha y hora son requeridas' });

  try {
    const citaRes = await pool.query(
      `SELECT c.*, s.duracion_minutos, s.nombre AS servicio_nombre
       FROM citas c JOIN servicios_masaje s ON s.id = c.servicio_id
       WHERE c.id = $1 AND c.usuario_id = $2`,
      [id, req.usuario.id]
    );
    const cita = citaRes.rows[0];
    if (!cita) return res.status(404).json({ ok: false, mensaje: 'Cita no encontrada' });
    if (cita.estado !== 'confirmada') {
      return res.status(400).json({ ok: false, mensaje: 'Solo puedes reprogramar una cita confirmada' });
    }

    const diaSemana = new Date(`${fecha}T00:00:00`).getDay();
    const horario = await obtenerHorarioDia(diaSemana);
    if (!horario.activo) return res.status(400).json({ ok: false, mensaje: 'Ese día no atendemos citas' });

    const inicioMin = minutos(hora);
    const finMin = inicioMin + cita.duracion_minutos;
    const pad = (n) => String(n).padStart(2, '0');
    const horaInicio = `${pad(Math.floor(inicioMin / 60))}:${pad(inicioMin % 60)}:00`;
    const horaFin = `${pad(Math.floor(finMin / 60))}:${pad(finMin % 60)}:00`;

    if (inicioMin < minutos(horario.hora_apertura) || finMin > minutos(horario.hora_cierre)) {
      return res.status(400).json({ ok: false, mensaje: 'Ese horario está fuera del horario de atención' });
    }

    const { rows: conflictos } = await pool.query(
      `SELECT id FROM citas
       WHERE fecha = $1 AND id != $2
         AND (estado = 'confirmada' OR (estado = 'pendiente_pago' AND pago_expira > NOW()))
         AND hora_inicio < $3 AND hora_fin > $4`,
      [fecha, id, horaFin, horaInicio]
    );
    if (conflictos.length) {
      return res.status(409).json({ ok: false, mensaje: 'Ese horario ya no está disponible, elige otro.' });
    }

    await pool.query(
      `UPDATE citas SET fecha = $1, hora_inicio = $2, hora_fin = $3, actualizado_en = NOW() WHERE id = $4`,
      [fecha, horaInicio, horaFin, id]
    );

    const citaActualizada = { ...cita, fecha, hora_inicio: horaInicio, hora_fin: horaFin };
    enviarCitaConfirmadaCliente(cita.email_cliente, cita.nombre_cliente, citaActualizada)
      .catch(err => console.error('Error enviando email de reprogramacion:', err));
    if (process.env.EMAIL_NEGOCIO) {
      enviarAlertaCitaNegocio(process.env.EMAIL_NEGOCIO, citaActualizada)
        .catch(err => console.error('Error notificando reprogramacion al negocio:', err));
    }

    res.json({ ok: true, mensaje: 'Cita reprogramada correctamente' });
  } catch (err) {
    console.error('Error reprogramarCita:', err);
    res.status(500).json({ ok: false, mensaje: 'Error al reprogramar la cita' });
  }
};

// ─── ADMIN: GET /api/admin/citas?fecha= ─────────────────────
exports.listarAgendaAdmin = async (req, res) => {
  const { fecha } = req.query;
  if (!fecha) return res.status(400).json({ ok: false, mensaje: 'fecha requerida' });
  try {
    const { rows } = await pool.query(
      `SELECT c.id, c.nombre_cliente, c.email_cliente, c.telefono_cliente,
              c.fecha, c.hora_inicio, c.hora_fin, c.estado, c.notas,
              s.nombre AS servicio_nombre, s.duracion_minutos
       FROM citas c JOIN servicios_masaje s ON s.id = c.servicio_id
       WHERE c.fecha = $1 AND c.estado IN ('confirmada','completada','no_asistio')
       ORDER BY c.hora_inicio`,
      [fecha]
    );
    res.json({ ok: true, citas: rows });
  } catch (err) {
    console.error('Error listarAgendaAdmin:', err);
    res.status(500).json({ ok: false, mensaje: 'Error al obtener la agenda' });
  }
};

// ─── ADMIN: PATCH /api/admin/citas/:id/estado ───────────────
exports.actualizarEstadoCita = async (req, res) => {
  const { id } = req.params;
  const { estado } = req.body;
  const validos = ['confirmada', 'cancelada', 'completada', 'no_asistio'];
  if (!validos.includes(estado)) {
    return res.status(400).json({ ok: false, mensaje: 'Estado inválido' });
  }
  try {
    const { rows } = await pool.query(
      'UPDATE citas SET estado = $1 WHERE id = $2 RETURNING id',
      [estado, id]
    );
    if (!rows[0]) return res.status(404).json({ ok: false, mensaje: 'Cita no encontrada' });
    res.json({ ok: true, mensaje: 'Estado actualizado' });
  } catch (err) {
    console.error('Error actualizarEstadoCita:', err);
    res.status(500).json({ ok: false, mensaje: 'Error al actualizar el estado' });
  }
};

// ─── ADMIN: GET /api/admin/citas/horario ────────────────────
exports.obtenerHorarioAtencion = async (req, res) => {
  try {
    const { rows } = await pool.query(
      'SELECT dia_semana, hora_apertura, hora_cierre, activo FROM horario_atencion ORDER BY dia_semana'
    );
    res.json({ ok: true, horario: rows });
  } catch (err) {
    console.error('Error obtenerHorarioAtencion:', err);
    res.status(500).json({ ok: false, mensaje: 'Error al obtener el horario' });
  }
};

// ─── ADMIN: PUT /api/admin/citas/horario  { dias: [{dia_semana, hora_apertura, hora_cierre, activo}] } ─
exports.actualizarHorarioAtencion = async (req, res) => {
  const { dias } = req.body;
  if (!Array.isArray(dias) || dias.length === 0) {
    return res.status(400).json({ ok: false, mensaje: 'Formato de horario inválido' });
  }
  try {
    for (const d of dias) {
      if (d.dia_semana < 0 || d.dia_semana > 6) continue;
      await pool.query(
        `UPDATE horario_atencion SET hora_apertura = $1, hora_cierre = $2, activo = $3 WHERE dia_semana = $4`,
        [d.hora_apertura, d.hora_cierre, !!d.activo, d.dia_semana]
      );
    }
    res.json({ ok: true, mensaje: 'Horario actualizado' });
  } catch (err) {
    console.error('Error actualizarHorarioAtencion:', err);
    res.status(500).json({ ok: false, mensaje: 'Error al actualizar el horario' });
  }
};

// ─── ADMIN: GET /api/admin/citas/servicios (incluye inactivos) ─
exports.listarServiciosAdmin = async (req, res) => {
  try {
    const { rows } = await pool.query(
      `SELECT sm.id, sm.nombre, sm.descripcion, sm.duracion_minutos, sm.precio, sm.activo,
              COUNT(c.id) FILTER (WHERE c.estado IN ('confirmada','completada')) AS total_citas
       FROM servicios_masaje sm LEFT JOIN citas c ON c.servicio_id = sm.id
       GROUP BY sm.id ORDER BY sm.nombre`
    );
    res.json({ ok: true, servicios: rows });
  } catch (err) {
    console.error('Error listarServiciosAdmin:', err);
    res.status(500).json({ ok: false, mensaje: 'Error al obtener servicios' });
  }
};

// ─── ADMIN: POST /api/admin/citas/servicios ─────────────────
exports.crearServicioMasaje = async (req, res) => {
  const { nombre, descripcion, duracion_minutos, precio } = req.body;
  if (!nombre?.trim() || !duracion_minutos || precio == null) {
    return res.status(400).json({ ok: false, mensaje: 'Nombre, duración y precio son requeridos' });
  }
  try {
    const { rows } = await pool.query(
      `INSERT INTO servicios_masaje (nombre, descripcion, duracion_minutos, precio) VALUES ($1,$2,$3,$4) RETURNING id`,
      [nombre.trim(), descripcion || null, duracion_minutos, precio]
    );
    res.status(201).json({ ok: true, mensaje: 'Servicio creado', id: rows[0].id });
  } catch (err) {
    console.error('Error crearServicioMasaje:', err);
    res.status(500).json({ ok: false, mensaje: 'Error al crear el servicio' });
  }
};

// ─── ADMIN: PUT /api/admin/citas/servicios/:id ──────────────
exports.actualizarServicioMasaje = async (req, res) => {
  const { id } = req.params;
  const { nombre, descripcion, duracion_minutos, precio, activo } = req.body;
  try {
    await pool.query(
      `UPDATE servicios_masaje SET
        nombre = COALESCE($1, nombre),
        descripcion = COALESCE($2, descripcion),
        duracion_minutos = COALESCE($3, duracion_minutos),
        precio = COALESCE($4, precio),
        activo = COALESCE($5, activo)
       WHERE id = $6`,
      [nombre || null, descripcion, duracion_minutos || null, precio, activo, id]
    );
    res.json({ ok: true, mensaje: 'Servicio actualizado' });
  } catch (err) {
    console.error('Error actualizarServicioMasaje:', err);
    res.status(500).json({ ok: false, mensaje: 'Error al actualizar el servicio' });
  }
};

// ─── ADMIN: DELETE /api/admin/citas/servicios/:id ───────────
// Borrado seguro: si ya tiene citas asociadas (historial), solo se
// desactiva para que no se pueda seguir agendando pero no se pierda
// el historial; si nunca se uso, se borra de verdad.
exports.eliminarServicioMasaje = async (req, res) => {
  const { id } = req.params;
  try {
    const { rows } = await pool.query('SELECT COUNT(*) FROM citas WHERE servicio_id = $1', [id]);
    if (Number(rows[0].count) > 0) {
      await pool.query('UPDATE servicios_masaje SET activo = FALSE WHERE id = $1', [id]);
      return res.json({ ok: true, mensaje: 'El servicio tiene citas en su historial, se desactivó en vez de borrarse.' });
    }
    await pool.query('DELETE FROM servicios_masaje WHERE id = $1', [id]);
    res.json({ ok: true, mensaje: 'Servicio eliminado' });
  } catch (err) {
    console.error('Error eliminarServicioMasaje:', err);
    res.status(500).json({ ok: false, mensaje: 'Error al eliminar el servicio' });
  }
};
