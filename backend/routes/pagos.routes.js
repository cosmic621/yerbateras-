const express = require('express');
const { verificarToken, requiereVerificado } = require('../middlewares/auth.middleware');
const c = require('../controllers/pagos.controller');

const router = express.Router();
router.post('/webhook', c.webhook);
router.post('/create-intent', verificarToken, requiereVerificado, c.crearPaymentIntent);
router.post('/confirmar', verificarToken, c.confirmarPago);
module.exports = router;
