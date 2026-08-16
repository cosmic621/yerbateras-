const pool = require('../config/db');

// Recalcula el promedio y el total de reseñas aprobadas de un producto.
// Se llama cada vez que se aprueba/borra una reseña, para mantener
// productos.calificacion_promedio y productos.total_resenas correctos.
const recalcularCalificacion = async (producto_id) => {
  const { rows } = await pool.query(
    `SELECT COALESCE(AVG(calificacion),0) AS promedio, COUNT(*) AS total
     FROM resenas WHERE producto_id = $1 AND aprobada = TRUE`,
    [producto_id]
  );
  await pool.query(
    `UPDATE productos SET calificacion_promedio = $1, total_resenas = $2 WHERE id = $3`,
    [Number(rows[0].promedio).toFixed(2), rows[0].total, producto_id]
  );
};

// ─── GET /api/productos/:id/puede-resenar (cliente autenticado) ─
// Le dice al frontend si este usuario puede dejar reseña de este producto:
// debe haber un pedido ENTREGADO que contenga el producto, y no haber
// reseñado ya antes.
exports.puedeResenar = async (req, res) => {
  const { id: producto_id } = req.params;
  try {
    const yaReseno = await pool.query(
      'SELECT id FROM resenas WHERE producto_id = $1 AND usuario_id = $2',
      [producto_id, req.usuario.id]
    );
    if (yaReseno.rows[0]) return res.json({ ok: true, puede: false, motivo: 'ya_reseno' });

    const compro = await pool.query(
      `SELECT 1 FROM pedidos p JOIN pedido_items pi ON pi.pedido_id = p.id
       WHERE p.usuario_id = $1 AND p.estado = 'entregado' AND pi.producto_id = $2 LIMIT 1`,
      [req.usuario.id, producto_id]
    );
    res.json({ ok: true, puede: !!compro.rows[0], motivo: compro.rows[0] ? null : 'no_comprado' });
  } catch (err) {
    console.error('Error puedeResenar:', err);
    res.status(500).json({ ok: false, mensaje: 'Error al verificar' });
  }
};

// ─── POST /api/productos/:id/resenas (cliente autenticado) ──
exports.crearResena = async (req, res) => {
  const { id: producto_id } = req.params;
  const { calificacion, titulo, contenido } = req.body;

  if (!calificacion || calificacion < 1 || calificacion > 5) {
    return res.status(400).json({ ok: false, mensaje: 'La calificación debe ser entre 1 y 5' });
  }

  try {
    const compro = await pool.query(
      `SELECT 1 FROM pedidos p JOIN pedido_items pi ON pi.pedido_id = p.id
       WHERE p.usuario_id = $1 AND p.estado = 'entregado' AND pi.producto_id = $2 LIMIT 1`,
      [req.usuario.id, producto_id]
    );
    if (!compro.rows[0]) {
      return res.status(403).json({ ok: false, mensaje: 'Solo puedes reseñar productos que ya recibiste' });
    }

    await pool.query(
      `INSERT INTO resenas (producto_id, usuario_id, calificacion, titulo, contenido)
       VALUES ($1,$2,$3,$4,$5)`,
      [producto_id, req.usuario.id, calificacion, titulo || null, contenido || null]
    );

    res.status(201).json({ ok: true, mensaje: 'Reseña enviada. Se publicará cuando sea aprobada.' });
  } catch (err) {
    if (err.code === '23505') {
      return res.status(409).json({ ok: false, mensaje: 'Ya reseñaste este producto' });
    }
    console.error('Error crearResena:', err);
    res.status(500).json({ ok: false, mensaje: 'Error al enviar la reseña' });
  }
};

// ─── ADMIN: GET /api/admin/resenas?estado=pendientes|todas ──
exports.listarResenasAdmin = async (req, res) => {
  const { estado } = req.query;
  try {
    const where = estado === 'pendientes' ? 'WHERE r.aprobada = FALSE' : '';
    const { rows } = await pool.query(
      `SELECT r.id, r.calificacion, r.titulo, r.contenido, r.aprobada, r.creado_en,
              u.nombre AS autor, p.nombre AS producto_nombre, p.id AS producto_id
       FROM resenas r
       JOIN usuarios u ON r.usuario_id = u.id
       JOIN productos p ON r.producto_id = p.id
       ${where}
       ORDER BY r.creado_en DESC`
    );
    res.json({ ok: true, resenas: rows });
  } catch (err) {
    console.error('Error listarResenasAdmin:', err);
    res.status(500).json({ ok: false, mensaje: 'Error al obtener reseñas' });
  }
};

// ─── ADMIN: PATCH /api/admin/resenas/:id/aprobar ────────────
exports.aprobarResena = async (req, res) => {
  const { id } = req.params;
  try {
    const { rows } = await pool.query(
      'UPDATE resenas SET aprobada = TRUE WHERE id = $1 RETURNING producto_id',
      [id]
    );
    if (!rows[0]) return res.status(404).json({ ok: false, mensaje: 'Reseña no encontrada' });
    await recalcularCalificacion(rows[0].producto_id);
    res.json({ ok: true, mensaje: 'Reseña aprobada y publicada' });
  } catch (err) {
    console.error('Error aprobarResena:', err);
    res.status(500).json({ ok: false, mensaje: 'Error al aprobar la reseña' });
  }
};

// ─── ADMIN: DELETE /api/admin/resenas/:id ───────────────────
exports.eliminarResena = async (req, res) => {
  const { id } = req.params;
  try {
    const { rows } = await pool.query('DELETE FROM resenas WHERE id = $1 RETURNING producto_id, aprobada', [id]);
    if (!rows[0]) return res.status(404).json({ ok: false, mensaje: 'Reseña no encontrada' });
    if (rows[0].aprobada) await recalcularCalificacion(rows[0].producto_id);
    res.json({ ok: true, mensaje: 'Reseña eliminada' });
  } catch (err) {
    console.error('Error eliminarResena:', err);
    res.status(500).json({ ok: false, mensaje: 'Error al eliminar la reseña' });
  }
};
