const express = require('express');
const router = express.Router();
const apiController = require('../controllers/apiController'); 
const auth = require('../middlewares/authMiddleware'); // <-- Tu middleware de protección

// Aplicar el middleware de autenticación de forma global a todas las rutas de este archivo
router.use(auth);

// Listar roles dinámicos para los selects -> GET http://localhost:5000/api/tipos-usuario
router.get('/tipos-usuario', apiController.getTiposUsuario);

// Listar dependencias de la UNNE para los selects -> GET http://localhost:5000/api/dependencias
router.get('/dependencias', apiController.getDependencias);

module.exports = router;