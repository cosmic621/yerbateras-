const express = require('express');
const router = express.Router();
const c = require('../controllers/productos.controller');
const resenasC = require('../controllers/resenas.controller');
const { verificarToken, soloAdmin } = require('../middlewares/auth.middleware');

const { upload } = require('../config/upload');

// Públicas
router.get('/', c.listarProductos);
router.get('/categorias', c.listarCategorias);
router.get('/lineas-cuidado', c.listarLineasCuidado);
router.get('/:id', c.obtenerProducto);

// Admin
router.post('/', verificarToken, soloAdmin, upload.single('imagen'), c.crearProducto);
router.put('/:id', verificarToken, soloAdmin, upload.single('imagen'), c.actualizarProducto);
router.delete('/:id', verificarToken, soloAdmin, c.eliminarProducto);

module.exports = router;
