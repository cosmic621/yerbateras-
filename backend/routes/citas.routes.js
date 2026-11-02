const express = require('express');
const router = express.Router();
const { limitarIntentos } = require('../middlewares/limitador');
const {
  listarServicios, obtenerDisponibilidad, iniciarPagoCita, verCitaGestion, reprogramarCita,
} = require('../controllers/citas.controller');

// Todo es público: no hay cuentas. Para ver/reprogramar una cita se usa el enlace privado del correo.
router.get('/servicios', listarServicios);
router.get('/disponibilidad', obtenerDisponibilidad);
router.post('/iniciar-pago', iniciarPagoCita);
router.get('/gestion/:token', verCitaGestion);
router.patch('/gestion/:token/reprogramar', reprogramarCita);

module.exports = router;
