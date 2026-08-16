const pool = require('../config/db');
const path = require('path');
const fs = require('fs');

// Guarda el set de lineas de cuidado de un producto (reemplaza las que tenia).
// lineas_cuidado puede venir como array real (JSON) o como string JSON
// (form-data por el upload de imagen manda todo como texto).
const guardarLineasCuidado = async (producto_id, lineas_cuidado) => {
  if (lineas_cuidado === undefined) return; // no se toco este campo, no hacer nada
  let ids = lineas_cuidado;
  if (typeof ids === 'string') {
    try { ids = JSON.parse(ids); } catch { ids = ids ? [ids] : []; }
  }
  if (!Array.isArray(ids)) ids = [];
  ids = ids.map(Number).filter(n => !isNaN(n));

  await pool.query('DELETE FROM producto_lineas_cuidado WHERE producto_id = $1', [producto_id]);
  for (const linea_id of ids) {
    await pool.query(
      'INSERT INTO producto_lineas_cuidado (producto_id, linea_id) VALUES ($1,$2) ON CONFLICT DO NOTHING',
      [producto_id, linea_id]
    );
  }
};

// ─── LISTAR productos (público, con filtros) ──────────────
const ORDENES = {
  relevancia:    'p.destacado DESC, p.creado_en DESC',
  precio_asc:    'COALESCE(p.precio_descuento, p.precio) ASC',
  precio_desc:   'COALESCE(p.precio_descuento, p.precio) DESC',
  calificacion:  'p.calificacion_promedio DESC, p.total_resenas DESC',
  recientes:     'p.creado_en DESC',
  mas_vendidos:  'p.ventas_totales DESC, p.calificacion_promedio DESC',
};

const listarProductos = async (req, res) => {
  const { categoria, linea_cuidado, buscar, destacados, orden, page = 1, limit = 12 } = req.query;
  const offset = (page - 1) * limit;
  const orderBy = ORDENES[orden] || ORDENES.relevancia;

  let where = ['p.activo = TRUE'];
  const params = [];

  if (categoria) { params.push(categoria); where.push(`c.slug = $${params.length}`); }
  if (linea_cuidado) {
    params.push(linea_cuidado);
    where.push(`EXISTS (
      SELECT 1 FROM producto_lineas_cuidado plc
      JOIN lineas_cuidado lc ON lc.id = plc.linea_id
      WHERE plc.producto_id = p.id AND lc.slug = $${params.length}
    )`);
  }
  if (buscar)    { params.push(`%${buscar}%`); where.push(`(p.nombre ILIKE $${params.length} OR p.descripcion_corta ILIKE $${params.length})`); }
  if (destacados === 'true') where.push('p.destacado = TRUE');

  const whereClause = where.length ? 'WHERE ' + where.join(' AND ') : '';

  try {
    const countQ = await pool.query(
      `SELECT COUNT(*) FROM productos p
       LEFT JOIN categorias c ON p.categoria_id = c.id
       ${whereClause}`,
      params
    );

    params.push(limit, offset);
    const { rows } = await pool.query(
      `SELECT p.id, p.nombre, p.descripcion_corta, p.precio, p.precio_descuento,
              p.stock, p.imagen_principal, p.certificacion_invima,
              p.presentacion, p.destacado, p.calificacion_promedio, p.total_resenas
              , c.nombre AS categoria, c.slug AS categoria_slug
       FROM productos p
       LEFT JOIN categorias c ON p.categoria_id = c.id
       ${whereClause}
       ORDER BY ${orderBy}
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

    const lineas = await pool.query(
      `SELECT lc.id, lc.nombre, lc.slug FROM producto_lineas_cuidado plc
       JOIN lineas_cuidado lc ON lc.id = plc.linea_id
       WHERE plc.producto_id = $1 AND lc.activa = TRUE`,
      [req.params.id]
    );

    res.json({ ok: true, producto: rows[0], resenas: resenas.rows, lineas_cuidado: lineas.rows });
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
    peso_gramos, destacado, lineas_cuidado
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

    await guardarLineasCuidado(rows[0].id, lineas_cuidado);

    res.status(201).json({ ok: true, mensaje: 'Producto creado', producto: rows[0] });
  } catch (err) {
    console.error(err);
    res.status(500).json({ ok: false, mensaje: 'Error al crear producto' });
  }
};

// ─── ACTUALIZAR producto (admin) ───────────────────────────
const actualizarProducto = async (req, res) => {
  const { id } = req.params;
  const campos = { ...req.body };
  const lineas_cuidado = campos.lineas_cuidado;
  delete campos.lineas_cuidado; // no es una columna de productos, se guarda aparte
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

    let producto;
    if (Object.keys(campos).length > 0) {
      const sets = Object.keys(campos).map((k, i) => `${k} = $${i + 1}`).join(', ');
      const vals = Object.values(campos);
      vals.push(id);
      const { rows } = await pool.query(
        `UPDATE productos SET ${sets} WHERE id = $${vals.length} RETURNING *`,
        vals
      );
      producto = rows[0];
    } else {
      const { rows } = await pool.query('SELECT * FROM productos WHERE id = $1', [id]);
      producto = rows[0];
    }
    if (!producto) return res.status(404).json({ ok: false, mensaje: 'Producto no encontrado' });

    await guardarLineasCuidado(id, lineas_cuidado);

    res.json({ ok: true, mensaje: 'Producto actualizado', producto });
  } catch (err) {
    console.error(err);
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

// ─── LÍNEAS DE CUIDADO (navegación principal, público) ─────
const listarLineasCuidado = async (req, res) => {
  try {
    const { rows } = await pool.query(
      `SELECT lc.id, lc.nombre, lc.slug, lc.descripcion, COUNT(DISTINCT plc.producto_id) AS total_productos
       FROM lineas_cuidado lc
       LEFT JOIN producto_lineas_cuidado plc ON plc.linea_id = lc.id
       LEFT JOIN productos p ON p.id = plc.producto_id AND p.activo = TRUE
       WHERE lc.activa = TRUE
       GROUP BY lc.id ORDER BY lc.orden, lc.nombre`
    );
    res.json({ ok: true, lineas: rows });
  } catch (err) {
    console.error(err);
    res.status(500).json({ ok: false, mensaje: 'Error al obtener líneas de cuidado' });
  }
};

module.exports = { listarProductos, obtenerProducto, crearProducto, actualizarProducto, eliminarProducto, listarCategorias, listarLineasCuidado };
