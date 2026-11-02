const express = require('express');
const c = require('../controllers/carrito.controller');

const router = express.Router();
router.post('/validar', c.validarCarrito);   // publico: el carrito vive en el navegador
module.exports = router;
