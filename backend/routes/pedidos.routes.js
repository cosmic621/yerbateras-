const express = require('express');
const { verificarToken, requiereVerificado } = require('../middlewares/auth.middleware');
const pool = require('../config/db');

const router = express.Router();
router.use(verificarToken, requiereVerificado);

router.get('/', async (req, res) => {
  const { rows } = await pool.query(
    `SELECT p.id, p.numero_pedido, p.total, p.estado, p.creado_en,
            json_agg(json_build_object('nombre', pi.nombre_producto, 'cantidad', pi.cantidad, 'imagen', pi.imagen_producto)) AS items
     FROM pedidos p
     LEFT JOIN pedido_items pi ON pi.pedido_id = p.id
     WHERE p.usuario_id = $1
     GROUP BY p.id ORDER BY p.creado_en DESC`,
    [req.usuario.id]
  );
  res.json({ ok: true, pedidos: rows });
});

router.get('/:id', async (req, res) => {
  const { rows } = await pool.query(
    `SELECT p.*, d.direccion, d.ciudad, d.departamento
     FROM pedidos p LEFT JOIN direcciones d ON p.direccion_id = d.id
     WHERE p.id = $1 AND p.usuario_id = $2`,
    [req.params.id, req.usuario.id]
  );
  if (!rows[0]) return res.status(404).json({ ok: false, mensaje: 'Pedido no encontrado' });
  const items = await pool.query('SELECT * FROM pedido_items WHERE pedido_id = $1', [req.params.id]);
  res.json({ ok: true, pedido: { ...rows[0], items: items.rows } });
});

module.exports = router;
