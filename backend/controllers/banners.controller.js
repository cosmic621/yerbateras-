const pool = require('../config/db');

const COLS = 'id, titulo, subtitulo, boton_texto, boton_url, imagen_url, orden, activo';
const vacio = (v) => (v === undefined || v === null || v === '' ? null : v);

// Solo se permiten enlaces internos (/tienda...) o https:// para evitar javascript: u otros esquemas
const urlSegura = (u) => !u || /^\/[^\s]*$/.test(u) || /^https:\/\/[^\s]+$/.test(u);

// ─── PUBLICO: GET /api/tienda/banners ───────────────────────
exports.listarBanners = async (req, res) => {
  try {
    const { rows } = await pool.query(`SELECT ${COLS} FROM banners WHERE activo = TRUE ORDER BY orden, creado_en`);
    res.json({ ok: true, banners: rows });
  } catch (err) {
    console.error('Error listarBanners:', err);
    res.status(500).json({ ok: false, mensaje: 'Error al obtener el carrusel' });
  }
};

// ─── ADMIN ──────────────────────────────────────────────────
exports.listarBannersAdmin = async (req, res) => {
  try {
    const { rows } = await pool.query(`SELECT ${COLS} FROM banners ORDER BY orden, creado_en`);
    res.json({ ok: true, banners: rows });
  } catch (err) {
    console.error('Error listarBannersAdmin:', err);
    res.status(500).json({ ok: false, mensaje: 'Error al obtener el carrusel' });
  }
};

exports.crearBanner = async (req, res) => {
  const { titulo, subtitulo, boton_texto, boton_url, orden, activo } = req.body;
  if (!req.file) return res.status(400).json({ ok: false, mensaje: 'La imagen es requerida' });
  if (!urlSegura(boton_url)) return res.status(400).json({ ok: false, mensaje: 'El enlace debe empezar por / o https://' });
  try {
    const { rows } = await pool.query(
      `INSERT INTO banners (titulo, subtitulo, boton_texto, boton_url, imagen_url, orden, activo)
       VALUES ($1,$2,$3,$4,$5,$6,$7) RETURNING id`,
      [vacio(titulo), vacio(subtitulo), vacio(boton_texto), vacio(boton_url), `/uploads/${req.file.filename}`,
       Number(orden) || 0, activo === undefined ? true : (activo === true || activo === 'true')]
    );
    res.status(201).json({ ok: true, id: rows[0].id, mensaje: 'Imagen agregada al carrusel' });
  } catch (err) {
    console.error('Error crearBanner:', err);
    res.status(500).json({ ok: false, mensaje: 'Error al crear la imagen del carrusel' });
  }
};

exports.actualizarBanner = async (req, res) => {
  const { titulo, subtitulo, boton_texto, boton_url, orden, activo } = req.body;
  if (!urlSegura(boton_url)) return res.status(400).json({ ok: false, mensaje: 'El enlace debe empezar por / o https://' });
  try {
    const { rows } = await pool.query(
      `UPDATE banners SET titulo = $1, subtitulo = $2, boton_texto = $3, boton_url = $4,
              imagen_url = COALESCE($5, imagen_url), orden = COALESCE($6::int, orden), activo = COALESCE($7::boolean, activo)
       WHERE id = $8 RETURNING id`,
      [vacio(titulo), vacio(subtitulo), vacio(boton_texto), vacio(boton_url), req.file ? `/uploads/${req.file.filename}` : null,
       vacio(orden), activo === undefined ? null : String(activo), req.params.id]
    );
    if (!rows[0]) return res.status(404).json({ ok: false, mensaje: 'Imagen no encontrada' });
    res.json({ ok: true, mensaje: 'Carrusel actualizado' });
  } catch (err) {
    console.error('Error actualizarBanner:', err);
    res.status(500).json({ ok: false, mensaje: 'Error al actualizar el carrusel' });
  }
};

exports.eliminarBanner = async (req, res) => {
  try {
    await pool.query('DELETE FROM banners WHERE id = $1', [req.params.id]);
    res.json({ ok: true, mensaje: 'Imagen eliminada del carrusel' });
  } catch (err) {
    console.error('Error eliminarBanner:', err);
    res.status(500).json({ ok: false, mensaje: 'Error al eliminar la imagen' });
  }
};
