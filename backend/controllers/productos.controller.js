const pool = require('../config/db');
const path = require('path');
const fs = require('fs');

// ─── LISTAR productos (público, con filtros) ──────────────
const listarProductos = async (req, res) => {
  const { categoria, buscar, destacados, page = 1, limit = 12 } = req.query;
  const offset = (page - 1) * limit;

  let where = ['p.activo = TRUE'];
  const params = [];

  if (categoria) { params.push(categoria); where.push(`c.slug = $${params.length}`); }
  if (buscar)    { params.push(`%${buscar}%`); where.push(`(p.nombre ILIKE $${params.length} OR p.descripcion_corta ILIKE $${params.length})`); }
  if (destacados === 'true') where.push('p.destacado = TRUE');

  const whereClause = where.length ? 'WHERE ' + where.join(' AND ') : '';

  try {
    const countQ = await pool.query(
      `SELECT COUNT(*) FROM productos p LEFT JOIN categorias c ON p.categoria_id = c.id ${whereClause}`,
      params
    );

    params.push(limit, offset);
    const { rows } = await pool.query(
      `SELECT p.id, p.nombre, p.descripcion_corta, p.precio, p.precio_descuento,
              p.stock, p.imagen_principal, p.certificacion_invima,
              p.presentacion, p.destacado, p.calificacion_promedio, p.total_resenas,
              c.nombre AS categoria, c.slug AS categoria_slug
       FROM productos p
       LEFT JOIN categorias c ON p.categoria_id = c.id
       ${whereClause}
       ORDER BY p.destacado DESC, p.creado_en DESC
       LIMIT $${params.length - 1} OFFSET $${params.length}`,
      params
    );
    res.json({
      ok: true,
      productos: rows,
      total: parseInt(countQ.rows[0].count),
      pagina: parseInt(page),
      totalPaginas: Math.ceil(parseInt(countQ.rows[0].count) / limit)
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ ok: false, mensaje: 'Error al obtener productos' });
  }
};

// ─── DETALLE de un producto ────────────────────────────────
const obtenerProducto = async (req, res) => {
  try {
    const { rows } = await pool.query(
      `SELECT p.*, c.nombre AS categoria, c.slug AS categoria_slug
       FROM productos p
       LEFT JOIN categorias c ON p.categoria_id = c.id
       WHERE p.id = $1 AND p.activo = TRUE`,
      [req.params.id]
    );
    if (!rows[0]) return res.status(404).json({ ok: false, mensaje: 'Producto no encontrado' });

    // Reseñas aprobadas
    const resenas = await pool.query(
      `SELECT r.calificacion, r.titulo, r.contenido, r.creado_en, u.nombre AS autor
       FROM resenas r JOIN usuarios u ON r.usuario_id = u.id
       WHERE r.producto_id = $1 AND r.aprobada = TRUE ORDER BY r.creado_en DESC LIMIT 10`,
      [req.params.id]
    );

    res.json({ ok: true, producto: rows[0], resenas: resenas.rows });
  } catch (err) {
    res.status(500).json({ ok: false, mensaje: 'Error al obtener producto' });
  }
};

// ─── CREAR producto (admin) ────────────────────────────────
const crearProducto = async (req, res) => {
  const {
    nombre, descripcion, descripcion_corta, precio, precio_descuento,
    stock, stock_minimo, categoria_id, sku, certificacion_invima,
    principio_activo, indicaciones, contraindicaciones, presentacion,
    peso_gramos, destacado
  } = req.body;

  const imagen_principal = req.file ? `/uploads/${req.file.filename}` : null;

  try {
    const { rows } = await pool.query(
      `INSERT INTO productos (nombre, descripcion, descripcion_corta, precio, precio_descuento,
        stock, stock_minimo, categoria_id, imagen_principal, sku, certificacion_invima,
        principio_activo, indicaciones, contraindicaciones, presentacion, peso_gramos, destacado)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17)
       RETURNING *`,
      [nombre, descripcion, descripcion_corta, precio, precio_descuento || null,
       stock || 0, stock_minimo || 5, categoria_id || null, imagen_principal,
       sku || null, certificacion_invima || null, principio_activo || null,
       indicaciones || null, contraindicaciones || null, presentacion || null,
       peso_gramos || null, destacado === 'true' || destacado === true]
    );

    // Registrar movimiento de inventario
    if (parseInt(stock) > 0) {
      await pool.query(
        `INSERT INTO inventario_movimientos (producto_id, tipo, cantidad, stock_antes, stock_despues, motivo, usuario_id)
         VALUES ($1,'entrada',$2,0,$3,'Creación de producto',$4)`,
        [rows[0].id, stock, stock, req.usuario.id]
      );
    }

    res.status(201).json({ ok: true, mensaje: 'Producto creado', producto: rows[0] });
  } catch (err) {
    console.error(err);
    res.status(500).json({ ok: false, mensaje: 'Error al crear producto' });
  }
};

// ─── ACTUALIZAR producto (admin) ───────────────────────────
const actualizarProducto = async (req, res) => {
  const { id } = req.params;
  const campos = req.body;
  if (req.file) campos.imagen_principal = `/uploads/${req.file.filename}`;

  try {
    // Stock tracking
    if (campos.stock !== undefined) {
      const prev = await pool.query('SELECT stock FROM productos WHERE id = $1', [id]);
      if (prev.rows[0]) {
        const diff = parseInt(campos.stock) - parseInt(prev.rows[0].stock);
        if (diff !== 0) {
          await pool.query(
            `INSERT INTO inventario_movimientos (producto_id, tipo, cantidad, stock_antes, stock_despues, motivo, usuario_id)
             VALUES ($1,$2,$3,$4,$5,'Ajuste manual admin',$6)`,
            [id, diff > 0 ? 'entrada' : 'salida', Math.abs(diff), prev.rows[0].stock, campos.stock, req.usuario.id]
          );
        }
      }
    }

    const sets = Object.keys(campos).map((k, i) => `${k} = $${i + 1}`).join(', ');
    const vals = Object.values(campos);
    vals.push(id);

    const { rows } = await pool.query(
      `UPDATE productos SET ${sets} WHERE id = $${vals.length} RETURNING *`,
      vals
    );
    if (!rows[0]) return res.status(404).json({ ok: false, mensaje: 'Producto no encontrado' });
    res.json({ ok: true, mensaje: 'Producto actualizado', producto: rows[0] });
  } catch (err) {
    res.status(500).json({ ok: false, mensaje: 'Error al actualizar producto' });
  }
};

// ─── ELIMINAR producto (admin, soft delete) ────────────────
const eliminarProducto = async (req, res) => {
  try {
    await pool.query('UPDATE productos SET activo = FALSE WHERE id = $1', [req.params.id]);
    res.json({ ok: true, mensaje: 'Producto desactivado' });
  } catch (err) {
    res.status(500).json({ ok: false, mensaje: 'Error al eliminar producto' });
  }
};

// ─── CATEGORÍAS ────────────────────────────────────────────
const listarCategorias = async (req, res) => {
  try {
    const { rows } = await pool.query(
      `SELECT c.*, COUNT(p.id) AS total_productos
       FROM categorias c
       LEFT JOIN productos p ON p.categoria_id = c.id AND p.activo = TRUE
       WHERE c.activa = TRUE
       GROUP BY c.id ORDER BY c.nombre`
    );
    res.json({ ok: true, categorias: rows });
  } catch (err) {
    res.status(500).json({ ok: false, mensaje: 'Error al obtener categorías' });
  }
};

module.exports = { listarProductos, obtenerProducto, crearProducto, actualizarProducto, eliminarProducto, listarCategorias };
