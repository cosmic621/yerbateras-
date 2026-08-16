const pool = require('../config/db');

// ══════════════════════════════════════════════════════════
// PÚBLICO — el flujo que ve el cliente
// ══════════════════════════════════════════════════════════

// ─── GET /api/botiquin/inicio ────────────────────────────────
exports.obtenerInicio = async (req, res) => {
  try {
    const preguntaQ = await pool.query(
      `SELECT id, texto FROM botiquin_preguntas WHERE es_inicial = TRUE AND activa = TRUE ORDER BY orden LIMIT 1`
    );
    const pregunta = preguntaQ.rows[0];
    if (!pregunta) return res.json({ ok: true, pregunta: null });

    const respuestas = await pool.query(
      `SELECT id, texto FROM botiquin_respuestas WHERE pregunta_id = $1 ORDER BY orden`,
      [pregunta.id]
    );
    res.json({ ok: true, pregunta: { ...pregunta, respuestas: respuestas.rows } });
  } catch (err) {
    console.error('Error obtenerInicio botiquin:', err);
    res.status(500).json({ ok: false, mensaje: 'Error al cargar el botiquín' });
  }
};

// ─── GET /api/botiquin/respuestas/:id/siguiente ──────────────
// Si la respuesta elegida lleva a otra pregunta, la devuelve.
// Si no, devuelve los productos recomendados para esa respuesta (resultado final).
exports.obtenerSiguiente = async (req, res) => {
  const { id } = req.params;
  try {
    const respuestaQ = await pool.query(
      `SELECT id, texto, siguiente_pregunta_id FROM botiquin_respuestas WHERE id = $1`,
      [id]
    );
    const respuesta = respuestaQ.rows[0];
    if (!respuesta) return res.status(404).json({ ok: false, mensaje: 'Respuesta no encontrada' });

    if (respuesta.siguiente_pregunta_id) {
      const preguntaQ = await pool.query(
        `SELECT id, texto FROM botiquin_preguntas WHERE id = $1 AND activa = TRUE`,
        [respuesta.siguiente_pregunta_id]
      );
      const pregunta = preguntaQ.rows[0];
      if (pregunta) {
        const respuestas = await pool.query(
          `SELECT id, texto FROM botiquin_respuestas WHERE pregunta_id = $1 ORDER BY orden`,
          [pregunta.id]
        );
        return res.json({ ok: true, tipo: 'pregunta', pregunta: { ...pregunta, respuestas: respuestas.rows } });
      }
      // la pregunta siguiente fue desactivada: caemos a mostrar productos igual
    }

    const productos = await pool.query(
      `SELECT p.id, p.nombre, p.descripcion_corta, p.precio, p.precio_descuento,
              p.imagen_principal, p.stock, p.calificacion_promedio, p.total_resenas
       FROM botiquin_respuesta_productos brp
       JOIN productos p ON p.id = brp.producto_id
       WHERE brp.respuesta_id = $1 AND p.activo = TRUE`,
      [id]
    );
    res.json({ ok: true, tipo: 'resultado', respuesta_texto: respuesta.texto, productos: productos.rows });
  } catch (err) {
    console.error('Error obtenerSiguiente botiquin:', err);
    res.status(500).json({ ok: false, mensaje: 'Error al continuar el botiquín' });
  }
};

// ══════════════════════════════════════════════════════════
// ADMIN — configuración del árbol de preguntas (sin programar)
// ══════════════════════════════════════════════════════════

// ─── GET /api/admin/botiquin/preguntas ───────────────────────
// Devuelve TODAS las preguntas con sus respuestas (para armar el árbol en el panel)
exports.listarPreguntasAdmin = async (req, res) => {
  try {
    const preguntas = await pool.query(`SELECT * FROM botiquin_preguntas ORDER BY orden, id`);
    const respuestas = await pool.query(`
      SELECT r.*, ARRAY_REMOVE(ARRAY_AGG(rp.producto_id), NULL) AS producto_ids
      FROM botiquin_respuestas r
      LEFT JOIN botiquin_respuesta_productos rp ON rp.respuesta_id = r.id
      GROUP BY r.id ORDER BY r.orden, r.id
    `);
    const porPregunta = {};
    for (const r of respuestas.rows) {
      (porPregunta[r.pregunta_id] ||= []).push(r);
    }
    const resultado = preguntas.rows.map(p => ({ ...p, respuestas: porPregunta[p.id] || [] }));
    res.json({ ok: true, preguntas: resultado });
  } catch (err) {
    console.error('Error listarPreguntasAdmin:', err);
    res.status(500).json({ ok: false, mensaje: 'Error al obtener las preguntas' });
  }
};

// ─── POST /api/admin/botiquin/preguntas ─────────────────────
exports.crearPregunta = async (req, res) => {
  const { texto, es_inicial, orden } = req.body;
  if (!texto?.trim()) return res.status(400).json({ ok: false, mensaje: 'El texto de la pregunta es requerido' });
  try {
    if (es_inicial) {
      // solo puede haber UNA pregunta inicial a la vez
      await pool.query('UPDATE botiquin_preguntas SET es_inicial = FALSE');
    }
    const { rows } = await pool.query(
      `INSERT INTO botiquin_preguntas (texto, es_inicial, orden) VALUES ($1,$2,$3) RETURNING id`,
      [texto.trim(), !!es_inicial, orden || 0]
    );
    res.status(201).json({ ok: true, mensaje: 'Pregunta creada', id: rows[0].id });
  } catch (err) {
    console.error('Error crearPregunta:', err);
    res.status(500).json({ ok: false, mensaje: 'Error al crear la pregunta' });
  }
};

// ─── PUT /api/admin/botiquin/preguntas/:id ──────────────────
exports.actualizarPregunta = async (req, res) => {
  const { id } = req.params;
  const { texto, es_inicial, orden, activa } = req.body;
  try {
    if (es_inicial) {
      await pool.query('UPDATE botiquin_preguntas SET es_inicial = FALSE WHERE id != $1', [id]);
    }
    await pool.query(
      `UPDATE botiquin_preguntas SET
        texto = COALESCE($1, texto), es_inicial = COALESCE($2, es_inicial),
        orden = COALESCE($3, orden), activa = COALESCE($4, activa)
       WHERE id = $5`,
      [texto || null, es_inicial, orden, activa, id]
    );
    res.json({ ok: true, mensaje: 'Pregunta actualizada' });
  } catch (err) {
    console.error('Error actualizarPregunta:', err);
    res.status(500).json({ ok: false, mensaje: 'Error al actualizar la pregunta' });
  }
};

// ─── DELETE /api/admin/botiquin/preguntas/:id ───────────────
exports.eliminarPregunta = async (req, res) => {
  try {
    await pool.query('DELETE FROM botiquin_preguntas WHERE id = $1', [req.params.id]);
    res.json({ ok: true, mensaje: 'Pregunta eliminada' });
  } catch (err) {
    console.error('Error eliminarPregunta:', err);
    res.status(500).json({ ok: false, mensaje: 'Error al eliminar la pregunta' });
  }
};

// ─── POST /api/admin/botiquin/respuestas ────────────────────
exports.crearRespuesta = async (req, res) => {
  const { pregunta_id, texto, orden, siguiente_pregunta_id } = req.body;
  if (!pregunta_id || !texto?.trim()) {
    return res.status(400).json({ ok: false, mensaje: 'pregunta_id y texto son requeridos' });
  }
  try {
    const { rows } = await pool.query(
      `INSERT INTO botiquin_respuestas (pregunta_id, texto, orden, siguiente_pregunta_id)
       VALUES ($1,$2,$3,$4) RETURNING id`,
      [pregunta_id, texto.trim(), orden || 0, siguiente_pregunta_id || null]
    );
    res.status(201).json({ ok: true, mensaje: 'Respuesta creada', id: rows[0].id });
  } catch (err) {
    console.error('Error crearRespuesta:', err);
    res.status(500).json({ ok: false, mensaje: 'Error al crear la respuesta' });
  }
};

// ─── PUT /api/admin/botiquin/respuestas/:id ─────────────────
exports.actualizarRespuesta = async (req, res) => {
  const { id } = req.params;
  const { texto, orden, siguiente_pregunta_id } = req.body;
  try {
    await pool.query(
      `UPDATE botiquin_respuestas SET
        texto = COALESCE($1, texto), orden = COALESCE($2, orden),
        siguiente_pregunta_id = $3
       WHERE id = $4`,
      [texto || null, orden, siguiente_pregunta_id || null, id]
    );
    res.json({ ok: true, mensaje: 'Respuesta actualizada' });
  } catch (err) {
    console.error('Error actualizarRespuesta:', err);
    res.status(500).json({ ok: false, mensaje: 'Error al actualizar la respuesta' });
  }
};

// ─── DELETE /api/admin/botiquin/respuestas/:id ──────────────
exports.eliminarRespuesta = async (req, res) => {
  try {
    await pool.query('DELETE FROM botiquin_respuestas WHERE id = $1', [req.params.id]);
    res.json({ ok: true, mensaje: 'Respuesta eliminada' });
  } catch (err) {
    console.error('Error eliminarRespuesta:', err);
    res.status(500).json({ ok: false, mensaje: 'Error al eliminar la respuesta' });
  }
};

// ─── PUT /api/admin/botiquin/respuestas/:id/productos { producto_ids: [] } ─
exports.asociarProductos = async (req, res) => {
  const { id } = req.params;
  const { producto_ids } = req.body;
  if (!Array.isArray(producto_ids)) {
    return res.status(400).json({ ok: false, mensaje: 'producto_ids debe ser un arreglo' });
  }
  try {
    await pool.query('DELETE FROM botiquin_respuesta_productos WHERE respuesta_id = $1', [id]);
    for (const producto_id of producto_ids) {
      await pool.query(
        'INSERT INTO botiquin_respuesta_productos (respuesta_id, producto_id) VALUES ($1,$2) ON CONFLICT DO NOTHING',
        [id, producto_id]
      );
    }
    res.json({ ok: true, mensaje: 'Productos asociados actualizados' });
  } catch (err) {
    console.error('Error asociarProductos botiquin:', err);
    res.status(500).json({ ok: false, mensaje: 'Error al asociar productos' });
  }
};
