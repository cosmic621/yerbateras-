const express = require('express');
const c = require('../controllers/talleres.controller');

const router = express.Router();
router.get('/', c.listarTalleres);
router.post('/inscribir', c.iniciarInscripcion);
router.post('/inscripciones/:id/saldo', c.iniciarPagoSaldo);
module.exports = router;
