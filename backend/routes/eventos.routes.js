const express = require('express');
const c = require('../controllers/eventos.controller');

const router = express.Router();
router.get('/proximos', c.proximosEventos);
router.get('/', c.listarEventos);
module.exports = router;
