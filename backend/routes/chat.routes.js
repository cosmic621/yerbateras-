const express = require('express');
const router = express.Router();
const { enviarMensaje } = require('../controllers/chat.controller');

router.post('/', enviarMensaje);

module.exports = router;
