const express = require('express');
const { verificarToken, soloAdmin } = require('../middlewares/auth.middleware');
const { descargarExcel, descargarPDF } = require('../controllers/reportes.controller');

const router = express.Router();
router.use(verificarToken, soloAdmin);

router.get('/excel', descargarExcel);
router.get('/pdf',   descargarPDF);

module.exports = router;
