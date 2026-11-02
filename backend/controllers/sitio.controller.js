const pool = require('../config/db');

// Helper reutilizable: ¿esta seccion esta activa? (si no existe, se considera activa)
const seccionActiva = async (clave) => {
  const { rows } = await pool.query('SELECT activa FROM secciones_sitio WHERE clave = $1', [clave]);
  return rows[0] ? rows[0].activa : true;
};
exports.seccionActiva = seccionActiva;

// ─── PUBLICO: GET /api/tienda/secciones ─────────────────────
// Devuelve el mapa clave→activa y la lista de temporadas activas (para el menu).
exports.obtenerSecciones = async (req, res) => {
  try {
    const { rows } = await pool.query(
      'SELECT clave, nombre, descripcion, tipo, activa FROM secciones_sitio ORDER BY orden, nombre'
    );
    const mapa = {};
    rows.forEach(r => { mapa[r.clave] = r.activa; });
    const temporadas = rows
      .filter(r => r.tipo === 'temporada' && r.activa)
      .map(r => ({ clave: r.clave, nombre: r.nombre, descripcion: r.descripcion }));
    res.json({ ok: true, secciones: mapa, temporadas });
  } catch (err) {
    console.error('Error obtenerSecciones:', err);
    res.status(500).json({ ok: false, mensaje: 'Error al obtener las secciones' });
  }
};

// ─── ADMIN: GET /api/admin/secciones ────────────────────────
exports.listarSeccionesAdmin = async (req, res) => {
  try {
    const { rows } = await pool.query(
      `SELECT s.clave, s.nombre, s.descripcion, s.tipo, s.activa, s.es_sistema,
              (SELECT COUNT(*) FROM productos p WHERE p.temporada = s.clave AND p.activo = TRUE) AS total_productos
       FROM secciones_sitio s ORDER BY s.tipo, s.orden, s.nombre`
    );
    res.json({ ok: true, secciones: rows });
  } catch (err) {
    console.error('Error listarSeccionesAdmin:', err);
    res.status(500).json({ ok: false, mensaje: 'Error al obtener las secciones' });
  }
};

// ─── ADMIN: PATCH /api/admin/secciones/:clave  { activa, nombre?, descripcion? } ─
exports.actualizarSeccion = async (req, res) => {
  const { clave } = req.params;
  const { activa, nombre, descripcion } = req.body;
  try {
    const { rows } = await pool.query(
      `UPDATE secciones_sitio SET
         activa = COALESCE($1, activa),
         nombre = COALESCE($2, nombre),
         descripcion = COALESCE($3, descripcion),
         actualizado_en = NOW()
       WHERE clave = $4 RETURNING clave, activa`,
      [typeof activa === 'boolean' ? activa : null, nombre?.trim() || null, descripcion ?? null, clave]
    );
    if (!rows[0]) return res.status(404).json({ ok: false, mensaje: 'Sección no encontrada' });
    res.json({ ok: true, seccion: rows[0] });
  } catch (err) {
    console.error('Error actualizarSeccion:', err);
    res.status(500).json({ ok: false, mensaje: 'Error al actualizar la sección' });
  }
};

// ─── ADMIN: POST /api/admin/secciones  (crear una temporada nueva) ──
exports.crearTemporada = async (req, res) => {
  const { clave, nombre, descripcion } = req.body;
  if (!nombre?.trim()) return res.status(400).json({ ok: false, mensaje: 'El nombre es requerido' });
  const slug = (clave || nombre).toLowerCase()
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '_').replace(/^_|_$/g, '').slice(0, 40);
  if (slug.length < 2) return res.status(400).json({ ok: false, mensaje: 'Nombre inválido' });
  try {
    await pool.query(
      `INSERT INTO secciones_sitio (clave, nombre, descripcion, tipo, activa, es_sistema, orden)
       VALUES ($1,$2,$3,'temporada',FALSE,FALSE,50)`,
      [slug, nombre.trim(), descripcion || null]
    );
    res.status(201).json({ ok: true, clave: slug, mensaje: 'Temporada creada (queda apagada hasta que la actives)' });
  } catch (err) {
    if (err.code === '23505') return res.status(409).json({ ok: false, mensaje: 'Ya existe una sección con ese nombre' });
    console.error('Error crearTemporada:', err);
    res.status(500).json({ ok: false, mensaje: 'Error al crear la temporada' });
  }
};

// ─── ADMIN: DELETE /api/admin/secciones/:clave (solo temporadas propias) ──
exports.eliminarTemporada = async (req, res) => {
  const { clave } = req.params;
  try {
    const { rows } = await pool.query('SELECT es_sistema FROM secciones_sitio WHERE clave = $1', [clave]);
    if (!rows[0]) return res.status(404).json({ ok: false, mensaje: 'Sección no encontrada' });
    if (rows[0].es_sistema) return res.status(400).json({ ok: false, mensaje: 'Las secciones del sistema no se borran, solo se apagan.' });
    await pool.query('UPDATE productos SET temporada = NULL WHERE temporada = $1', [clave]);
    await pool.query('DELETE FROM secciones_sitio WHERE clave = $1', [clave]);
    res.json({ ok: true, mensaje: 'Temporada eliminada. Sus productos quedaron sin temporada.' });
  } catch (err) {
    console.error('Error eliminarTemporada:', err);
    res.status(500).json({ ok: false, mensaje: 'Error al eliminar la temporada' });
  }
};
