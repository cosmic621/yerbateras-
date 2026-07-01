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
      pool.query(`SELECT COUNT(*) AS total FROM usuarios WHERE rol_id = 2`),
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
              u.nombre AS cliente, u.email
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

// ─── USUARIOS: listar clientes ────────────────────────────
const getUsuarios = async (req, res) => {
  try {
    const { rows } = await pool.query(
      `SELECT u.id, u.nombre, u.apellido, u.email, u.telefono,
              u.verificado, u.activo, u.creado_en, u.ultimo_login,
              r.nombre AS rol,
              COUNT(p.id) AS total_pedidos,
              COALESCE(SUM(p.total) FILTER(WHERE p.estado='pagado'), 0) AS total_gastado
       FROM usuarios u
       JOIN roles r ON u.rol_id = r.id
       LEFT JOIN pedidos p ON p.usuario_id = u.id
       GROUP BY u.id, r.nombre
       ORDER BY u.creado_en DESC`
    );
    res.json({ ok: true, usuarios: rows });
  } catch (err) {
    res.status(500).json({ ok: false, mensaje: 'Error al obtener usuarios' });
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

module.exports = {
  getDashboard, getInventario, getPedidos, cambiarEstadoPedido,
  getUsuarios, toggleUsuario, ajustarStock, getConfiguracion, actualizarConfiguracion
};
