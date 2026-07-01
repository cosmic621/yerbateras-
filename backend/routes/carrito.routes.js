const express = require('express');
const { verificarToken, requiereVerificado } = require('../middlewares/auth.middleware');
const c = require('../controllers/carrito.controller');

const router = express.Router();
router.use(verificarToken, requiereVerificado);
router.get('/', c.obtenerCarrito);
router.post('/items', c.agregarItem);
router.put('/items/:item_id', c.actualizarItem);
router.delete('/items/:item_id', c.eliminarItem);
router.delete('/', c.limpiarCarrito);
module.exports = router;
