// src/routes/solicitudRoutes.js
const express = require('express');
const {
  registrarSolicitud,
  obtenerSolicitudes
} = require('../controllers/solicitudController');

const router = express.Router();

router.post('/', registrarSolicitud);
router.get('/', obtenerSolicitudes);

module.exports = router;
