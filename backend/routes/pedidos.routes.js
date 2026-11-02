const express = require('express');
const pool = require('../config/db');
const { limitarIntentos } = require('../middlewares/limitador');

const router = express.Router();

// GET /api/pedidos/seguimiento?numero=YRB-2026-000001&email=cliente@correo.com
// Se exigen AMBOS datos, asi nadie puede consultar pedidos ajenos adivinando el numero.
router.get('/seguimiento', limitarIntentos({ max: 15 }), async (req, res) => {
  const numero = String(req.query.numero || '').trim().toUpperCase();
  const email = String(req.query.email || '').trim().toLowerCase();
  const falla = () => { res.locals.falloLogin?.(); return res.status(404).json({ ok: false, mensaje: 'No encontramos un pedido con esos datos' }); };
  if (!numero || !email) return falla();
  try {
    const { rows } = await pool.query(
      `SELECT id, numero_pedido, estado, subtotal, descuento, costo_envio, total, creado_en,
              nombre_cliente, direccion_envio, ciudad_envio, departamento_envio
       FROM pedidos WHERE numero_pedido = $1 AND LOWER(email_cliente) = $2`,
      [numero, email]
    );
    if (!rows[0]) return falla();
    const items = await pool.query(
      'SELECT nombre_producto AS nombre, imagen_producto AS imagen, cantidad, precio_unitario, subtotal FROM pedido_items WHERE pedido_id = $1',
      [rows[0].id]
    );
    res.json({ ok: true, pedido: { ...rows[0], items: items.rows } });
  } catch (err) {
    console.error('Error seguimiento pedido:', err);
    res.status(500).json({ ok: false, mensaje: 'Error al consultar el pedido' });
  }
});

module.exports = router;
