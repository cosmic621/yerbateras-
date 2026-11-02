const express = require('express');
const pool = require('../config/db');
const { obtenerSecciones } = require('../controllers/sitio.controller');
const router = express.Router();

const { listarBanners } = require('../controllers/banners.controller');
router.get('/secciones', obtenerSecciones);
router.get('/banners', listarBanners);

router.get('/config', async (req, res) => {
  const { rows } = await pool.query('SELECT clave, valor FROM configuracion_tienda');
  const config = rows.reduce((acc, r) => ({ ...acc, [r.clave]: r.valor }), {});
  res.json({ ok: true, config });
});

module.exports = router;
