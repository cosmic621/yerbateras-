const pool = require('../config/db');
const { seccionActiva } = require('./sitio.controller');

const COLS = `id, titulo, descripcion, to_char(fecha,'YYYY-MM-DD') AS fecha,
  to_char(hora_inicio,'HH24:MI') AS hora_inicio, to_char(hora_fin,'HH24:MI') AS hora_fin,
  lugar, flyer_url, enlace, activo`;

// ─── PUBLICO: GET /api/eventos?mes=YYYY-MM ──────────────────
exports.listarEventos = async (req, res) => {
  const { mes } = req.query;
  if (!/^\d{4}-(0[1-9]|1[0-2])$/.test(mes || '')) {
    return res.status(400).json({ ok: false, mensaje: 'mes debe tener formato YYYY-MM' });
  }
  try {
    if (!(await seccionActiva('eventos'))) return res.json({ ok: true, eventos: [] });
    const { rows } = await pool.query(
      `SELECT ${COLS} FROM eventos
       WHERE activo = TRUE AND fecha >= $1::date AND fecha < ($1::date + INTERVAL '1 month')
       ORDER BY fecha, hora_inicio`,
      [`${mes}-01`]
    );
    res.json({ ok: true, eventos: rows });
  } catch (err) {
    console.error('Error listarEventos:', err);
    res.status(500).json({ ok: false, mensaje: 'Error al obtener los eventos' });
  }
};

// ─── PUBLICO: GET /api/eventos/proximos ─────────────────────
exports.proximosEventos = async (req, res) => {
  try {
    if (!(await seccionActiva('eventos'))) return res.json({ ok: true, eventos: [] });
    const { rows } = await pool.query(
      `SELECT ${COLS} FROM eventos
       WHERE activo = TRUE AND fecha >= (NOW() AT TIME ZONE 'America/Bogota')::date
       ORDER BY fecha, hora_inicio LIMIT 4`
    );
    res.json({ ok: true, eventos: rows });
  } catch (err) {
    console.error('Error proximosEventos:', err);
    res.status(500).json({ ok: false, mensaje: 'Error al obtener los eventos' });
  }
};

// ─── ADMIN ──────────────────────────────────────────────────
exports.listarEventosAdmin = async (req, res) => {
  try {
    const { rows } = await pool.query(`SELECT ${COLS} FROM eventos ORDER BY fecha DESC, hora_inicio`);
    res.json({ ok: true, eventos: rows });
  } catch (err) {
    console.error('Error listarEventosAdmin:', err);
    res.status(500).json({ ok: false, mensaje: 'Error al obtener los eventos' });
  }
};

const vacio = (v) => (v === undefined || v === null || v === '' ? null : v);

exports.crearEvento = async (req, res) => {
  const { titulo, descripcion, fecha, hora_inicio, hora_fin, lugar, enlace, activo } = req.body;
  if (!titulo?.trim() || !/^\d{4}-\d{2}-\d{2}$/.test(fecha || '')) {
    return res.status(400).json({ ok: false, mensaje: 'Título y fecha (YYYY-MM-DD) son requeridos' });
  }
  const flyer = req.file ? `/uploads/${req.file.filename}` : null;
  try {
    const { rows } = await pool.query(
      `INSERT INTO eventos (titulo, descripcion, fecha, hora_inicio, hora_fin, lugar, flyer_url, enlace, activo)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9) RETURNING id`,
      [titulo.trim(), vacio(descripcion), fecha, vacio(hora_inicio), vacio(hora_fin), vacio(lugar), flyer, vacio(enlace),
       activo === undefined ? true : (activo === true || activo === 'true')]
    );
    res.status(201).json({ ok: true, mensaje: 'Evento creado', id: rows[0].id });
  } catch (err) {
    console.error('Error crearEvento:', err);
    res.status(500).json({ ok: false, mensaje: 'Error al crear el evento' });
  }
};

exports.actualizarEvento = async (req, res) => {
  const { id } = req.params;
  const { titulo, descripcion, fecha, hora_inicio, hora_fin, lugar, enlace, activo } = req.body;
  const flyer = req.file ? `/uploads/${req.file.filename}` : null;
  try {
    const { rows } = await pool.query(
      `UPDATE eventos SET
         titulo = COALESCE($1, titulo), descripcion = $2, fecha = COALESCE($3::date, fecha),
         hora_inicio = $4, hora_fin = $5, lugar = $6, enlace = $7,
         flyer_url = COALESCE($8, flyer_url), activo = COALESCE($9::boolean, activo)
       WHERE id = $10 RETURNING id`,
      [vacio(titulo?.trim()), vacio(descripcion), vacio(fecha), vacio(hora_inicio), vacio(hora_fin),
       vacio(lugar), vacio(enlace), flyer, activo === undefined ? null : String(activo), id]
    );
    if (!rows[0]) return res.status(404).json({ ok: false, mensaje: 'Evento no encontrado' });
    res.json({ ok: true, mensaje: 'Evento actualizado' });
  } catch (err) {
    console.error('Error actualizarEvento:', err);
    res.status(500).json({ ok: false, mensaje: 'Error al actualizar el evento' });
  }
};

exports.eliminarEvento = async (req, res) => {
  try {
    await pool.query('DELETE FROM eventos WHERE id = $1', [req.params.id]);
    res.json({ ok: true, mensaje: 'Evento eliminado' });
  } catch (err) {
    console.error('Error eliminarEvento:', err);
    res.status(500).json({ ok: false, mensaje: 'Error al eliminar el evento' });
  }
};
