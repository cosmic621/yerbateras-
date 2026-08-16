const express = require('express');
const router = express.Router();
const { suscribir } = require('../controllers/newsletter.controller');

router.post('/suscribir', suscribir);

module.exports = router;
