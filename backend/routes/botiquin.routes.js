const express = require('express');
const router = express.Router();
const { obtenerInicio, obtenerSiguiente } = require('../controllers/botiquin.controller');

router.get('/inicio', obtenerInicio);
router.get('/respuestas/:id/siguiente', obtenerSiguiente);

module.exports = router;
