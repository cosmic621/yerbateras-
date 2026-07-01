// routes/auth.routes.js
const express = require('express');
const router = express.Router();
const c = require('../controllers/auth.controller');
const { verificarToken, validarInputs } = require('../middlewares/auth.middleware');

router.post('/register', validarInputs([
  { campo: 'nombre', requerido: true, min: 2 },
  { campo: 'email', tipo: 'email', requerido: true },
  { campo: 'password', requerido: true, min: 8 }
]), c.registrar);

router.get('/verify-email', c.verificarEmail);
router.post('/login', validarInputs([
  { campo: 'email', tipo: 'email', requerido: true },
  { campo: 'password', requerido: true }
]), c.login);
router.post('/google', c.loginGoogle);
router.post('/send-otp', validarInputs([{ campo: 'telefono', tipo: 'phone', requerido: true }]), c.enviarOtp);
router.post('/verify-otp', c.verificarOtp);
router.get('/me', verificarToken, c.obtenerPerfil);

module.exports = router;