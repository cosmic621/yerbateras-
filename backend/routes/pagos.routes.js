const express = require('express');
const c = require('../controllers/pagos.controller');
const cuponesC = require('../controllers/cupones.controller');

const router = express.Router();
router.post('/webhook', c.webhook);
router.post('/crear-pedido', c.crearPedido);          // sin cuenta: datos del cliente van en el pedido
router.get('/estado/:reference', c.consultarEstado);
router.post('/validar-cupon', cuponesC.validarCupon);
module.exports = router;
