const express = require('express');
const router = express.Router();
const { verificarToken, intentarAutenticar } = require('../middlewares/auth.middleware');
const {
  listarServicios,
  obtenerDisponibilidad,
  iniciarPagoCita,
  misCitas,
  reprogramarCita,
} = require('../controllers/citas.controller');

// Públicas (funcionan con o sin cuenta)
router.get('/servicios', listarServicios);
router.get('/disponibilidad', obtenerDisponibilidad);
router.post('/iniciar-pago', intentarAutenticar, iniciarPagoCita);

// Cliente autenticado: ver y reprogramar sus propias citas
router.get('/mis-citas', verificarToken, misCitas);
router.patch('/:id/reprogramar', verificarToken, reprogramarCita);

module.exports = router;
