const express = require('express');
const c = require('../controllers/auth.controller');
const { verificarToken, validarInputs } = require('../middlewares/auth.middleware');
const { limitarIntentos } = require('../middlewares/limitador');

// Ya no hay cuentas de clientes: el unico login que existe es el del administrador (/admin).
const router = express.Router();
router.post('/admin-login', limitarIntentos({ max: 5 }), validarInputs([
  { campo: 'email', tipo: 'email', requerido: true },
  { campo: 'password', requerido: true },
]), c.loginAdmin);
router.get('/me', verificarToken, c.obtenerPerfil);
module.exports = router;
