const pool = require('../config/db');

// ─── ADMIN: GET /api/admin/cupones ───────────────────────────
exports.listarCupones = async (req, res) => {
  try {
    const { rows } = await pool.query(
      `SELECT id, codigo, tipo, valor, minimo_compra, usos_maximos, usos_actuales, activo, expira_en, creado_en
       FROM cupones ORDER BY creado_en DESC`
    );
    res.json({ ok: true, cupones: rows });
  } catch (err) {
    console.error('Error listarCupones:', err);
    res.status(500).json({ ok: false, mensaje: 'Error al obtener cupones' });
  }
};

// ─── ADMIN: POST /api/admin/cupones ───────────────────────────
exports.crearCupon = async (req, res) => {
  const { codigo, tipo, valor, minimo_compra, usos_maximos, expira_en } = req.body;
  if (!codigo?.trim() || !['porcentaje', 'fijo'].includes(tipo) || !valor || valor <= 0) {
    return res.status(400).json({ ok: false, mensaje: 'Código, tipo (porcentaje/fijo) y valor son requeridos' });
  }
  if (tipo === 'porcentaje' && valor > 100) {
    return res.status(400).json({ ok: false, mensaje: 'Un porcentaje no puede ser mayor a 100' });
  }
  try {
    const { rows } = await pool.query(
      `INSERT INTO cupones (codigo, tipo, valor, minimo_compra, usos_maximos, expira_en)
       VALUES ($1,$2,$3,$4,$5,$6) RETURNING id`,
      [codigo.trim().toUpperCase(), tipo, valor, minimo_compra || 0, usos_maximos || null, expira_en || null]
    );
    res.status(201).json({ ok: true, mensaje: 'Cupón creado', id: rows[0].id });
  } catch (err) {
    if (err.code === '23505') return res.status(409).json({ ok: false, mensaje: 'Ya existe un cupón con ese código' });
    console.error('Error crearCupon:', err);
    res.status(500).json({ ok: false, mensaje: 'Error al crear el cupón' });
  }
};

// ─── ADMIN: PUT /api/admin/cupones/:id ────────────────────────
exports.actualizarCupon = async (req, res) => {
  const { id } = req.params;
  const { activo, usos_maximos, expira_en, minimo_compra, valor } = req.body;
  try {
    await pool.query(
      `UPDATE cupones SET
        activo = COALESCE($1, activo),
        usos_maximos = $2,
        expira_en = $3,
        minimo_compra = COALESCE($4, minimo_compra),
        valor = COALESCE($5, valor)
       WHERE id = $6`,
      [activo, usos_maximos, expira_en, minimo_compra, valor, id]
    );
    res.json({ ok: true, mensaje: 'Cupón actualizado' });
  } catch (err) {
    console.error('Error actualizarCupon:', err);
    res.status(500).json({ ok: false, mensaje: 'Error al actualizar el cupón' });
  }
};

// ─── ADMIN: DELETE /api/admin/cupones/:id ─────────────────────
exports.eliminarCupon = async (req, res) => {
  const { id } = req.params;
  try {
    const { rows } = await pool.query('SELECT COUNT(*) FROM pedidos WHERE cupon_id = $1', [id]);
    if (Number(rows[0].count) > 0) {
      await pool.query('UPDATE cupones SET activo = FALSE WHERE id = $1', [id]);
      return res.json({ ok: true, mensaje: 'El cupón ya se usó en pedidos, se desactivó en vez de borrarse.' });
    }
    await pool.query('DELETE FROM cupones WHERE id = $1', [id]);
    res.json({ ok: true, mensaje: 'Cupón eliminado' });
  } catch (err) {
    console.error('Error eliminarCupon:', err);
    res.status(500).json({ ok: false, mensaje: 'Error al eliminar el cupón' });
  }
};

// ─── Helper reutilizable: valida un cupón contra un subtotal ──
// Lo usa tanto el endpoint de validar (checkout) como crearPedido
// (pagos.controller.js), para no duplicar la lógica de reglas.
const validarCuponInterno = async (codigo, subtotal) => {
  if (!codigo) return { valido: false, mensaje: 'Código requerido' };
  const { rows } = await pool.query(
    `SELECT * FROM cupones WHERE codigo = $1 AND activo = TRUE`,
    [codigo.trim().toUpperCase()]
  );
  const cupon = rows[0];
  if (!cupon) return { valido: false, mensaje: 'Cupón no válido' };
  if (cupon.expira_en && new Date(cupon.expira_en) < new Date()) {
    return { valido: false, mensaje: 'Este cupón ya expiró' };
  }
  if (cupon.usos_maximos != null && cupon.usos_actuales >= cupon.usos_maximos) {
    return { valido: false, mensaje: 'Este cupón ya alcanzó su límite de usos' };
  }
  if (subtotal < Number(cupon.minimo_compra)) {
    return { valido: false, mensaje: `Compra mínima de $${Number(cupon.minimo_compra).toLocaleString('es-CO')} para usar este cupón` };
  }
  const descuento = cupon.tipo === 'porcentaje'
    ? Math.round(subtotal * (Number(cupon.valor) / 100))
    : Math.min(Number(cupon.valor), subtotal);
  return { valido: true, cupon, descuento };
};
exports.validarCuponInterno = validarCuponInterno;

// ─── POST /api/pagos/validar-cupon (cliente, antes de pagar) ──
exports.validarCupon = async (req, res) => {
  const { codigo, subtotal } = req.body;
  if (!codigo || subtotal == null) return res.status(400).json({ ok: false, mensaje: 'Faltan datos' });
  try {
    const resultado = await validarCuponInterno(codigo, Number(subtotal));
    if (!resultado.valido) return res.status(400).json({ ok: false, mensaje: resultado.mensaje });
    res.json({ ok: true, descuento: resultado.descuento, cupon_id: resultado.cupon.id, codigo: resultado.cupon.codigo });
  } catch (err) {
    console.error('Error validarCupon:', err);
    res.status(500).json({ ok: false, mensaje: 'Error al validar el cupón' });
  }
};
