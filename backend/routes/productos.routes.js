const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const c = require('../controllers/productos.controller');
const { verificarToken, soloAdmin } = require('../middlewares/auth.middleware');

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, path.join(__dirname, '../uploads')),
  filename: (req, file, cb) => cb(null, `prod_${Date.now()}${path.extname(file.originalname)}`)
});
const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    if (!file.mimetype.startsWith('image/')) return cb(new Error('Solo imágenes'));
    cb(null, true);
  }
});

// Públicas
router.get('/', c.listarProductos);
router.get('/categorias', c.listarCategorias);
router.get('/:id', c.obtenerProducto);

// Admin
router.post('/', verificarToken, soloAdmin, upload.single('imagen'), c.crearProducto);
router.put('/:id', verificarToken, soloAdmin, upload.single('imagen'), c.actualizarProducto);
router.delete('/:id', verificarToken, soloAdmin, c.eliminarProducto);

module.exports = router;
