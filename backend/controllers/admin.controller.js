const pool = require('../config/db');

// ─── DASHBOARD: métricas del negocio ──────────────────────
const getDashboard = async (req, res) => {
  try {
    const [ventas, pedidos, usuarios, productos, ventasMes] = await Promise.all([
      pool.query(`SELECT COALESCE(SUM(total),0) AS total_ventas FROM pedidos WHERE estado = 'pagado'`),
      pool.query(`SELECT
        COUNT(*) FILTER(WHERE estado='pendiente') AS pendientes,
        COUNT(*) FILTER(WHERE estado='pagado') AS pagados,
        COUNT(*) FILTER(WHERE estado='enviado') AS enviados,
        COUNT(*) FILTER(WHERE estado='entregado') AS entregados,
        COUNT(*) AS total
        FROM pedidos`),
      pool.query(`SELECT COUNT(DISTINCT LOWER(email_cliente)) AS total FROM pedidos WHERE email_cliente IS NOT NULL`),
      pool.query(`SELECT COUNT(*) AS total, COUNT(*) FILTER(WHERE stock <= stock_minimo) AS bajo_stock FROM productos WHERE activo = TRUE`),
      pool.query(`
        SELECT DATE_TRUNC('day', creado_en) AS dia,
               SUM(total) AS ventas,
               COUNT(*) AS pedidos
        FROM pedidos
        WHERE estado = 'pagado' AND creado_en >= NOW() - INTERVAL '30 days'
        GROUP BY dia ORDER BY dia
      `)
    ]);

    res.json({
      ok: true,
      metricas: {
        total_ventas: parseFloat(ventas.rows[0].total_ventas),
        pedidos: pedidos.rows[0],
        total_usuarios: parseInt(usuarios.rows[0].total),
        productos: productos.rows[0],
        ventas_30_dias: ventasMes.rows
      }
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ ok: false, mensaje: 'Error al obtener dashboard' });
  }
};

// ─── INVENTARIO: todos los productos con stock ────────────
const getInventario = async (req, res) => {
  try {
    const { rows } = await pool.query(
      `SELECT p.id, p.nombre, p.sku, p.stock, p.stock_minimo, p.precio,
              p.activo, p.imagen_principal, c.nombre AS categoria,
              CASE WHEN p.stock = 0 THEN 'agotado'
                   WHEN p.stock <= p.stock_minimo THEN 'bajo'
                   ELSE 'ok' END AS estado_stock
       FROM productos p
       LEFT JOIN categorias c ON p.categoria_id = c.id
       ORDER BY estado_stock, p.nombre`
    );
    res.json({ ok: true, inventario: rows });
  } catch (err) {
    res.status(500).json({ ok: false, mensaje: 'Error al obtener inventario' });
  }
};

// ─── PEDIDOS: listar todos ────────────────────────────────
const getPedidos = async (req, res) => {
  const { estado, page = 1, limit = 20 } = req.query;
  const offset = (page - 1) * limit;
  let where = [];
  const params = [];
  if (estado) { params.push(estado); where.push(`p.estado = $${params.length}`); }

  const whereClause = where.length ? 'WHERE ' + where.join(' AND ') : '';
  try {
    params.push(limit, offset);
    const { rows } = await pool.query(
      `SELECT p.id, p.numero_pedido, p.total, p.estado, p.creado_en,
              COALESCE(p.nombre_cliente, u.nombre) AS cliente, COALESCE(p.email_cliente, u.email) AS email,
              COALESCE(p.telefono_cliente, u.telefono) AS telefono, p.direccion_envio, p.ciudad_envio, p.departamento_envio,
              p.notas_cliente, p.notas_admin
       FROM pedidos p
       LEFT JOIN usuarios u ON p.usuario_id = u.id
       ${whereClause}
       ORDER BY p.creado_en DESC
       LIMIT $${params.length - 1} OFFSET $${params.length}`,
      params
    );
    res.json({ ok: true, pedidos: rows });
  } catch (err) {
    res.status(500).json({ ok: false, mensaje: 'Error al obtener pedidos' });
  }
};

// ─── CAMBIAR estado de pedido ─────────────────────────────
const cambiarEstadoPedido = async (req, res) => {
  const { id } = req.params;
  const { estado, notas_admin } = req.body;
  const estados = ['pendiente','pagado','preparando','enviado','entregado','cancelado'];
  if (!estados.includes(estado)) {
    return res.status(400).json({ ok: false, mensaje: 'Estado inválido' });
  }
  try {
    const { rows } = await pool.query(
      'UPDATE pedidos SET estado=$1, notas_admin=$2 WHERE id=$3 RETURNING *',
      [estado, notas_admin || null, id]
    );
    if (!rows[0]) return res.status(404).json({ ok: false, mensaje: 'Pedido no encontrado' });
    res.json({ ok: true, pedido: rows[0] });
  } catch (err) {
    res.status(500).json({ ok: false, mensaje: 'Error al actualizar pedido' });
  }
};

// ─── CLIENTES: quienes han hecho pedidos (ya no hay cuentas de cliente) ───
const getUsuarios = async (req, res) => {
  try {
    const { rows } = await pool.query(
      `SELECT LOWER(COALESCE(p.email_cliente, u.email)) AS email,
              MAX(COALESCE(p.nombre_cliente, u.nombre)) AS nombre,
              MAX(COALESCE(p.telefono_cliente, u.telefono)) AS telefono,
              COUNT(*) AS total_pedidos,
              COALESCE(SUM(p.total) FILTER (WHERE p.estado IN ('pagado','preparando','enviado','entregado')), 0) AS total_gastado,
              MAX(p.creado_en) AS ultimo_pedido
       FROM pedidos p LEFT JOIN usuarios u ON p.usuario_id = u.id
       WHERE COALESCE(p.email_cliente, u.email) IS NOT NULL
       GROUP BY LOWER(COALESCE(p.email_cliente, u.email))
       ORDER BY MAX(p.creado_en) DESC`
    );
    res.json({ ok: true, usuarios: rows });
  } catch (err) {
    console.error('Error getUsuarios:', err);
    res.status(500).json({ ok: false, mensaje: 'Error al obtener clientes' });
  }
};

// ─── TOGGLE activo/inactivo usuario ───────────────────────
const toggleUsuario = async (req, res) => {
  try {
    const { rows } = await pool.query(
      'UPDATE usuarios SET activo = NOT activo WHERE id = $1 RETURNING id, activo',
      [req.params.id]
    );
    res.json({ ok: true, usuario: rows[0] });
  } catch (err) {
    res.status(500).json({ ok: false, mensaje: 'Error al actualizar usuario' });
  }
};

// ─── AJUSTE manual de stock ───────────────────────────────
const ajustarStock = async (req, res) => {
  const { producto_id, cantidad, tipo, motivo } = req.body;
  if (!producto_id || !cantidad || !tipo) {
    return res.status(400).json({ ok: false, mensaje: 'producto_id, cantidad y tipo son requeridos' });
  }
  try {
    const prod = await pool.query('SELECT stock FROM productos WHERE id = $1', [producto_id]);
    if (!prod.rows[0]) return res.status(404).json({ ok: false, mensaje: 'Producto no encontrado' });

    const stockAntes = parseInt(prod.rows[0].stock);
    const stockDespues = tipo === 'entrada' ? stockAntes + parseInt(cantidad) : stockAntes - parseInt(cantidad);

    if (stockDespues < 0) {
      return res.status(400).json({ ok: false, mensaje: 'El ajuste resultaría en stock negativo' });
    }

    await pool.query('UPDATE productos SET stock = $1 WHERE id = $2', [stockDespues, producto_id]);
    await pool.query(
      `INSERT INTO inventario_movimientos (producto_id, tipo, cantidad, stock_antes, stock_despues, motivo, usuario_id)
       VALUES ($1,$2,$3,$4,$5,$6,$7)`,
      [producto_id, tipo, cantidad, stockAntes, stockDespues, motivo || 'Ajuste manual', req.usuario.id]
    );

    res.json({ ok: true, mensaje: 'Stock ajustado', stock_nuevo: stockDespues });
  } catch (err) {
    res.status(500).json({ ok: false, mensaje: 'Error al ajustar stock' });
  }
};

// ─── CONFIGURACIÓN de la tienda ───────────────────────────
const getConfiguracion = async (req, res) => {
  try {
    const { rows } = await pool.query('SELECT clave, valor, descripcion FROM configuracion_tienda ORDER BY clave');
    const config = rows.reduce((acc, r) => ({ ...acc, [r.clave]: r.valor }), {});
    res.json({ ok: true, configuracion: config });
  } catch (err) {
    res.status(500).json({ ok: false, mensaje: 'Error al obtener configuración' });
  }
};

const actualizarConfiguracion = async (req, res) => {
  const { clave, valor } = req.body;
  try {
    await pool.query(
      `INSERT INTO configuracion_tienda (clave, valor) VALUES ($1,$2)
       ON CONFLICT (clave) DO UPDATE SET valor = $2, actualizado_en = NOW()`,
      [clave, valor]
    );
    res.json({ ok: true, mensaje: 'Configuración actualizada' });
  } catch (err) {
    res.status(500).json({ ok: false, mensaje: 'Error al actualizar configuración' });
  }
};

// ─── CATEGORÍAS (admin) ────────────────────────────────────
const generarSlug = (texto) => texto
  .toLowerCase()
  .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
  .replace(/[^a-z0-9]+/g, '-')
  .replace(/(^-|-$)/g, '');

const getCategorias = async (req, res) => {
  try {
    const { rows } = await pool.query(
      `SELECT c.id, c.nombre, c.descripcion, c.slug, c.imagen_url, c.activa,
              COUNT(p.id) FILTER (WHERE p.activo = TRUE) AS total_productos
       FROM categorias c LEFT JOIN productos p ON p.categoria_id = c.id
       GROUP BY c.id ORDER BY c.nombre`
    );
    res.json({ ok: true, categorias: rows });
  } catch (err) {
    console.error('Error getCategorias:', err);
    res.status(500).json({ ok: false, mensaje: 'Error al obtener categorías' });
  }
};

const crearCategoria = async (req, res) => {
  const { nombre, descripcion, imagen_url } = req.body;
  if (!nombre?.trim()) return res.status(400).json({ ok: false, mensaje: 'El nombre es requerido' });
  try {
    const slug = generarSlug(nombre);
    const { rows } = await pool.query(
      `INSERT INTO categorias (nombre, descripcion, slug, imagen_url) VALUES ($1,$2,$3,$4) RETURNING id`,
      [nombre.trim(), descripcion || null, slug, imagen_url || null]
    );
    res.status(201).json({ ok: true, mensaje: 'Categoría creada', id: rows[0].id });
  } catch (err) {
    if (err.code === '23505') return res.status(409).json({ ok: false, mensaje: 'Ya existe una categoría con ese nombre' });
    console.error('Error crearCategoria:', err);
    res.status(500).json({ ok: false, mensaje: 'Error al crear la categoría' });
  }
};

const actualizarCategoria = async (req, res) => {
  const { id } = req.params;
  const { nombre, descripcion, imagen_url, activa } = req.body;
  try {
    const slug = nombre ? generarSlug(nombre) : undefined;
    await pool.query(
      `UPDATE categorias SET
        nombre = COALESCE($1, nombre),
        slug = COALESCE($2, slug),
        descripcion = COALESCE($3, descripcion),
        imagen_url = COALESCE($4, imagen_url),
        activa = COALESCE($5, activa)
       WHERE id = $6`,
      [nombre || null, slug || null, descripcion, imagen_url, activa, id]
    );
    res.json({ ok: true, mensaje: 'Categoría actualizada' });
  } catch (err) {
    if (err.code === '23505') return res.status(409).json({ ok: false, mensaje: 'Ya existe una categoría con ese nombre' });
    console.error('Error actualizarCategoria:', err);
    res.status(500).json({ ok: false, mensaje: 'Error al actualizar la categoría' });
  }
};

// Borrado seguro: si tiene productos asociados, solo se desactiva (para no
// romper productos existentes); si no tiene ninguno, se borra de verdad.
const eliminarCategoria = async (req, res) => {
  const { id } = req.params;
  try {
    const { rows } = await pool.query('SELECT COUNT(*) FROM productos WHERE categoria_id = $1', [id]);
    if (Number(rows[0].count) > 0) {
      await pool.query('UPDATE categorias SET activa = FALSE WHERE id = $1', [id]);
      return res.json({ ok: true, mensaje: 'La categoría tiene productos asociados, se desactivó en vez de borrarse.' });
    }
    await pool.query('DELETE FROM categorias WHERE id = $1', [id]);
    res.json({ ok: true, mensaje: 'Categoría eliminada' });
  } catch (err) {
    console.error('Error eliminarCategoria:', err);
    res.status(500).json({ ok: false, mensaje: 'Error al eliminar la categoría' });
  }
};

// ─── LÍNEAS DE CUIDADO (admin) ──────────────────────────────
const getLineasCuidado = async (req, res) => {
  try {
    const { rows } = await pool.query(
      `SELECT lc.id, lc.nombre, lc.descripcion, lc.slug, lc.orden, lc.activa,
              COUNT(DISTINCT plc.producto_id) AS total_productos
       FROM lineas_cuidado lc
       LEFT JOIN producto_lineas_cuidado plc ON plc.linea_id = lc.id
       GROUP BY lc.id ORDER BY lc.orden, lc.nombre`
    );
    res.json({ ok: true, lineas: rows });
  } catch (err) {
    console.error('Error getLineasCuidado:', err);
    res.status(500).json({ ok: false, mensaje: 'Error al obtener líneas de cuidado' });
  }
};

const crearLineaCuidado = async (req, res) => {
  const { nombre, descripcion, orden } = req.body;
  if (!nombre?.trim()) return res.status(400).json({ ok: false, mensaje: 'El nombre es requerido' });
  try {
    const slug = generarSlug(nombre);
    const { rows } = await pool.query(
      `INSERT INTO lineas_cuidado (nombre, descripcion, slug, orden) VALUES ($1,$2,$3,$4) RETURNING id`,
      [nombre.trim(), descripcion || null, slug, orden || 0]
    );
    res.status(201).json({ ok: true, mensaje: 'Línea de cuidado creada', id: rows[0].id });
  } catch (err) {
    if (err.code === '23505') return res.status(409).json({ ok: false, mensaje: 'Ya existe una línea con ese nombre' });
    console.error('Error crearLineaCuidado:', err);
    res.status(500).json({ ok: false, mensaje: 'Error al crear la línea de cuidado' });
  }
};

const actualizarLineaCuidado = async (req, res) => {
  const { id } = req.params;
  const { nombre, descripcion, orden, activa } = req.body;
  try {
    const slug = nombre ? generarSlug(nombre) : undefined;
    await pool.query(
      `UPDATE lineas_cuidado SET
        nombre = COALESCE($1, nombre), slug = COALESCE($2, slug),
        descripcion = COALESCE($3, descripcion), orden = COALESCE($4, orden), activa = COALESCE($5, activa)
       WHERE id = $6`,
      [nombre || null, slug || null, descripcion, orden, activa, id]
    );
    res.json({ ok: true, mensaje: 'Línea de cuidado actualizada' });
  } catch (err) {
    if (err.code === '23505') return res.status(409).json({ ok: false, mensaje: 'Ya existe una línea con ese nombre' });
    console.error('Error actualizarLineaCuidado:', err);
    res.status(500).json({ ok: false, mensaje: 'Error al actualizar la línea de cuidado' });
  }
};

const eliminarLineaCuidado = async (req, res) => {
  const { id } = req.params;
  try {
    const { rows } = await pool.query('SELECT COUNT(*) FROM producto_lineas_cuidado WHERE linea_id = $1', [id]);
    if (Number(rows[0].count) > 0) {
      await pool.query('UPDATE lineas_cuidado SET activa = FALSE WHERE id = $1', [id]);
      return res.json({ ok: true, mensaje: 'La línea tiene productos asociados, se desactivó en vez de borrarse.' });
    }
    await pool.query('DELETE FROM lineas_cuidado WHERE id = $1', [id]);
    res.json({ ok: true, mensaje: 'Línea de cuidado eliminada' });
  } catch (err) {
    console.error('Error eliminarLineaCuidado:', err);
    res.status(500).json({ ok: false, mensaje: 'Error al eliminar la línea de cuidado' });
  }
};

// ─── PRODUCTOS Y KITS (admin: incluye los desactivados) ────
const getProductosAdmin = async (req, res) => {
  const { tipo } = req.query; // 'kit' | 'producto' | undefined
  const where = tipo === 'kit' ? 'WHERE p.es_kit = TRUE' : tipo === 'producto' ? 'WHERE p.es_kit = FALSE' : '';
  try {
    const { rows } = await pool.query(
      `SELECT p.id, p.nombre, p.descripcion, p.descripcion_corta, p.precio, p.precio_descuento, p.stock, p.stock_minimo,
              p.categoria_id, p.presentacion, p.principio_activo, p.indicaciones, p.imagen_principal,
              p.destacado, p.activo, p.es_kit, p.contenido_kit, p.temporada, c.nombre AS categoria
       FROM productos p LEFT JOIN categorias c ON p.categoria_id = c.id
       ${where} ORDER BY p.activo DESC, p.es_kit DESC, p.nombre`
    );
    res.json({ ok: true, productos: rows });
  } catch (err) {
    console.error('Error getProductosAdmin:', err);
    res.status(500).json({ ok: false, mensaje: 'Error al obtener productos' });
  }
};

const toggleProducto = async (req, res) => {
  try {
    const { rows } = await pool.query(
      'UPDATE productos SET activo = NOT activo WHERE id = $1 RETURNING id, activo', [req.params.id]
    );
    if (!rows[0]) return res.status(404).json({ ok: false, mensaje: 'Producto no encontrado' });
    res.json({ ok: true, producto: rows[0] });
  } catch (err) {
    console.error('Error toggleProducto:', err);
    res.status(500).json({ ok: false, mensaje: 'Error al actualizar el producto' });
  }
};

// ─── DESTACADOS Y PROMOCIONES ─────────────────────────────
const toggleDestacado = async (req, res) => {
  try {
    const { rows } = await pool.query('UPDATE productos SET destacado = NOT destacado WHERE id = $1 RETURNING id, destacado', [req.params.id]);
    if (!rows[0]) return res.status(404).json({ ok: false, mensaje: 'Producto no encontrado' });
    res.json({ ok: true, producto: rows[0] });
  } catch (err) {
    console.error('Error toggleDestacado:', err);
    res.status(500).json({ ok: false, mensaje: 'Error al actualizar el producto' });
  }
};

// body: { porcentaje: 1..90 }  -> pone precio_descuento ;  { porcentaje: null/0 } -> quita la promocion
const fijarPromocion = async (req, res) => {
  const pct = req.body.porcentaje === null || req.body.porcentaje === '' ? 0 : Number(req.body.porcentaje);
  if (!Number.isFinite(pct) || pct < 0 || pct > 90) {
    return res.status(400).json({ ok: false, mensaje: 'El descuento debe estar entre 1% y 90%' });
  }
  try {
    const { rows } = await pool.query(
      `UPDATE productos SET precio_descuento = CASE WHEN $1::numeric > 0 THEN ROUND(precio * (1 - $1::numeric / 100)) ELSE NULL END
       WHERE id = $2 RETURNING id, precio, precio_descuento`,
      [pct, req.params.id]
    );
    if (!rows[0]) return res.status(404).json({ ok: false, mensaje: 'Producto no encontrado' });
    res.json({ ok: true, producto: rows[0] });
  } catch (err) {
    console.error('Error fijarPromocion:', err);
    res.status(500).json({ ok: false, mensaje: 'Error al actualizar la promoción' });
  }
};

module.exports = {
  getDashboard, getInventario, getPedidos, cambiarEstadoPedido,
  getUsuarios, toggleUsuario, ajustarStock, getConfiguracion, actualizarConfiguracion,
  getCategorias, crearCategoria, actualizarCategoria, eliminarCategoria,
  getLineasCuidado, crearLineaCuidado, actualizarLineaCuidado, eliminarLineaCuidado,
  getProductosAdmin, toggleProducto, toggleDestacado, fijarPromocion,
};
