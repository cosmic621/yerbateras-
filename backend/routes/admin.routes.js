const express = require('express');
const { verificarToken, soloAdmin } = require('../middlewares/auth.middleware');
const c = require('../controllers/admin.controller');

const router = express.Router();
router.use(verificarToken, soloAdmin);
router.get('/dashboard', c.getDashboard);
router.get('/inventario', c.getInventario);
router.post('/inventario/ajuste', c.ajustarStock);
router.get('/pedidos', c.getPedidos);
router.patch('/pedidos/:id/estado', c.cambiarEstadoPedido);
router.get('/usuarios', c.getUsuarios);
router.patch('/usuarios/:id/toggle', c.toggleUsuario);
router.get('/configuracion', c.getConfiguracion);
router.put('/configuracion', c.actualizarConfiguracion);
module.exports = router;
