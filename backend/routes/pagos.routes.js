const express = require('express');
const { verificarToken, requiereVerificado } = require('../middlewares/auth.middleware');
const c = require('../controllers/pagos.controller');
const cuponesC = require('../controllers/cupones.controller');

const router = express.Router();
router.post('/webhook', c.webhook);
router.post('/crear-pedido', verificarToken, requiereVerificado, c.crearPedido);
router.get('/estado/:reference', verificarToken, c.consultarEstado);
router.post('/validar-cupon', verificarToken, cuponesC.validarCupon);
module.exports = router;
