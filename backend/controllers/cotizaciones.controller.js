const pool = require('../config/db');
const { enviarSolicitudCotizacion } = require('../config/email');

// ─── POST /api/cotizaciones (público) ───────────────────────
exports.crearCotizacion = async (req, res) => {
  const { organizacion, nombre_contacto, email, telefono, interes, cantidad_estimada, mensaje } = req.body;

  if (!organizacion?.trim() || !nombre_contacto?.trim() || !email?.trim() || !telefono?.trim()) {
    return res.status(400).json({ ok: false, mensaje: 'Organización, contacto, correo y teléfono son requeridos' });
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return res.status(400).json({ ok: false, mensaje: 'Correo inválido' });
  }

  try {
    const { rows } = await pool.query(
      `INSERT INTO cotizaciones (organizacion, nombre_contacto, email, telefono, interes, cantidad_estimada, mensaje)
       VALUES ($1,$2,$3,$4,$5,$6,$7) RETURNING id`,
      [organizacion.trim(), nombre_contacto.trim(), email.trim(), telefono.trim(),
       interes || null, cantidad_estimada || null, mensaje || null]
    );

    const cotizacion = { organizacion, nombre_contacto, email, telefono, interes, cantidad_estimada, mensaje };
    if (process.env.EMAIL_NEGOCIO) {
      enviarSolicitudCotizacion(process.env.EMAIL_NEGOCIO, cotizacion)
        .catch(err => console.error('Error enviando email de cotizacion:', err));
    }

    res.status(201).json({ ok: true, mensaje: 'Solicitud enviada. Te contactaremos pronto.', id: rows[0].id });
  } catch (err) {
    console.error('Error crearCotizacion:', err);
    res.status(500).json({ ok: false, mensaje: 'Error al enviar la solicitud' });
  }
};

// ─── ADMIN: GET /api/admin/cotizaciones ─────────────────────
exports.listarCotizacionesAdmin = async (req, res) => {
  try {
    const { rows } = await pool.query('SELECT * FROM cotizaciones ORDER BY creado_en DESC');
    res.json({ ok: true, cotizaciones: rows });
  } catch (err) {
    console.error('Error listarCotizacionesAdmin:', err);
    res.status(500).json({ ok: false, mensaje: 'Error al obtener cotizaciones' });
  }
};

// ─── ADMIN: PATCH /api/admin/cotizaciones/:id/estado ────────
exports.actualizarEstadoCotizacion = async (req, res) => {
  const { id } = req.params;
  const { estado } = req.body;
  if (!['nueva', 'contactada', 'cerrada'].includes(estado)) {
    return res.status(400).json({ ok: false, mensaje: 'Estado inválido' });
  }
  try {
    const { rows } = await pool.query('UPDATE cotizaciones SET estado = $1 WHERE id = $2 RETURNING id', [estado, id]);
    if (!rows[0]) return res.status(404).json({ ok: false, mensaje: 'Cotización no encontrada' });
    res.json({ ok: true, mensaje: 'Estado actualizado' });
  } catch (err) {
    console.error('Error actualizarEstadoCotizacion:', err);
    res.status(500).json({ ok: false, mensaje: 'Error al actualizar' });
  }
};
