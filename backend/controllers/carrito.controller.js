const pool = require('../config/db');

// ─── OBTENER carrito del usuario ───────────────────────────
const obtenerCarrito = async (req, res) => {
  try {
    const carrito = await obtenerOCrearCarrito(req.usuario.id);
    const { rows } = await pool.query(
      `SELECT ci.id, ci.cantidad, ci.precio_unitario,
              p.id AS producto_id, p.nombre, p.imagen_principal,
              p.precio, p.stock, p.presentacion,
              (ci.cantidad * ci.precio_unitario) AS subtotal
       FROM carrito_items ci
       JOIN productos p ON ci.producto_id = p.id
       WHERE ci.carrito_id = $1`,
      [carrito.id]
    );
    const total = rows.reduce((s, i) => s + parseFloat(i.subtotal), 0);
    res.json({ ok: true, carrito_id: carrito.id, items: rows, total });
  } catch (err) {
    res.status(500).json({ ok: false, mensaje: 'Error al obtener carrito' });
  }
};

// ─── AGREGAR item al carrito ───────────────────────────────
const agregarItem = async (req, res) => {
  const { producto_id, cantidad = 1 } = req.body;
  if (!producto_id) return res.status(400).json({ ok: false, mensaje: 'producto_id requerido' });

  try {
    // Verificar producto y stock
    const prod = await pool.query(
      'SELECT id, precio, stock FROM productos WHERE id = $1 AND activo = TRUE', [producto_id]
    );
    if (!prod.rows[0]) return res.status(404).json({ ok: false, mensaje: 'Producto no disponible' });
    if (prod.rows[0].stock < cantidad) {
      return res.status(400).json({ ok: false, mensaje: `Stock insuficiente. Disponible: ${prod.rows[0].stock}` });
    }

    const carrito = await obtenerOCrearCarrito(req.usuario.id);

    // Upsert item
    await pool.query(
      `INSERT INTO carrito_items (carrito_id, producto_id, cantidad, precio_unitario)
       VALUES ($1,$2,$3,$4)
       ON CONFLICT (carrito_id, producto_id)
       DO UPDATE SET cantidad = carrito_items.cantidad + $3, actualizado_en = NOW()`,
      [carrito.id, producto_id, cantidad, prod.rows[0].precio]
    );

    res.json({ ok: true, mensaje: 'Producto agregado al carrito' });
  } catch (err) {
    res.status(500).json({ ok: false, mensaje: 'Error al agregar al carrito' });
  }
};

// ─── ACTUALIZAR cantidad de un item ───────────────────────
const actualizarItem = async (req, res) => {
  const { item_id } = req.params;
  const { cantidad } = req.body;
  if (!cantidad || cantidad < 1) {
    return res.status(400).json({ ok: false, mensaje: 'Cantidad inválida' });
  }
  try {
    // Verificar stock
    const item = await pool.query(
      `SELECT ci.*, p.stock FROM carrito_items ci
       JOIN productos p ON ci.producto_id = p.id WHERE ci.id = $1`,
      [item_id]
    );
    if (!item.rows[0]) return res.status(404).json({ ok: false, mensaje: 'Item no encontrado' });
    if (item.rows[0].stock < cantidad) {
      return res.status(400).json({ ok: false, mensaje: `Stock insuficiente. Disponible: ${item.rows[0].stock}` });
    }
    await pool.query(
      'UPDATE carrito_items SET cantidad = $1, actualizado_en = NOW() WHERE id = $2',
      [cantidad, item_id]
    );
    res.json({ ok: true, mensaje: 'Cantidad actualizada' });
  } catch (err) {
    res.status(500).json({ ok: false, mensaje: 'Error al actualizar item' });
  }
};

// ─── ELIMINAR item del carrito ─────────────────────────────
const eliminarItem = async (req, res) => {
  try {
    await pool.query('DELETE FROM carrito_items WHERE id = $1', [req.params.item_id]);
    res.json({ ok: true, mensaje: 'Producto eliminado del carrito' });
  } catch (err) {
    res.status(500).json({ ok: false, mensaje: 'Error al eliminar item' });
  }
};

// ─── LIMPIAR carrito ───────────────────────────────────────
const limpiarCarrito = async (req, res) => {
  try {
    const carrito = await obtenerOCrearCarrito(req.usuario.id);
    await pool.query('DELETE FROM carrito_items WHERE carrito_id = $1', [carrito.id]);
    res.json({ ok: true, mensaje: 'Carrito vaciado' });
  } catch (err) {
    res.status(500).json({ ok: false, mensaje: 'Error al limpiar carrito' });
  }
};

// ─── Helper: obtener o crear carrito activo ────────────────
const obtenerOCrearCarrito = async (usuario_id) => {
  const { rows } = await pool.query(
    'SELECT id FROM carritos WHERE usuario_id = $1 AND activo = TRUE', [usuario_id]
  );
  if (rows[0]) return rows[0];
  const ins = await pool.query(
    'INSERT INTO carritos (usuario_id) VALUES ($1) RETURNING id', [usuario_id]
  );
  return ins.rows[0];
};

module.exports = { obtenerCarrito, agregarItem, actualizarItem, eliminarItem, limpiarCarrito };
