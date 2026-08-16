const pool = require('../config/db');

// ─── POST /api/newsletter/suscribir (público) ────────────────
exports.suscribir = async (req, res) => {
  const { email } = req.body;
  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return res.status(400).json({ ok: false, mensaje: 'Correo inválido' });
  }
  try {
    await pool.query(
      `INSERT INTO suscriptores_newsletter (email) VALUES ($1)
       ON CONFLICT (email) DO UPDATE SET activo = TRUE`,
      [email.trim().toLowerCase()]
    );
    res.status(201).json({ ok: true, mensaje: '¡Gracias por suscribirte!' });
  } catch (err) {
    console.error('Error suscribir newsletter:', err);
    res.status(500).json({ ok: false, mensaje: 'Error al suscribirte, intenta de nuevo' });
  }
};

// ─── ADMIN: GET /api/admin/newsletter ────────────────────────
exports.listarSuscriptores = async (req, res) => {
  try {
    const { rows } = await pool.query(
      `SELECT id, email, activo, creado_en FROM suscriptores_newsletter
       WHERE activo = TRUE ORDER BY creado_en DESC`
    );
    res.json({ ok: true, suscriptores: rows, total: rows.length });
  } catch (err) {
    console.error('Error listarSuscriptores:', err);
    res.status(500).json({ ok: false, mensaje: 'Error al obtener suscriptores' });
  }
};
