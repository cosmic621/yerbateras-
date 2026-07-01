const express = require('express');
const pool = require('../config/db');
const router = express.Router();

router.get('/config', async (req, res) => {
  const { rows } = await pool.query('SELECT clave, valor FROM configuracion_tienda');
  const config = rows.reduce((acc, r) => ({ ...acc, [r.clave]: r.valor }), {});
  res.json({ ok: true, config });
});

module.exports = router;
