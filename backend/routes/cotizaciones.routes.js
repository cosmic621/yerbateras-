const express = require('express');
const router = express.Router();
const { crearCotizacion } = require('../controllers/cotizaciones.controller');

router.post('/', crearCotizacion);

module.exports = router;
