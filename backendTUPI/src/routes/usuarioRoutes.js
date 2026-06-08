const express = require('express');
const router = express.Router();
const usuarioController = require('../controllers/UsuarioController');
const auth = require('../middlewares/authMiddleware'); // <-- Importamos el middleware de protección

// Aplicar el middleware de autenticación a todas las rutas de este archivo
router.use(auth);

// Listar todos los operadores -> GET http://localhost:5000/api/usuarios
router.get('/', usuarioController.listar);

// Alta de nuevo operador -> POST http://localhost:5000/api/usuarios
router.post('/', usuarioController.crear);

// Modificación del registro -> PUT http://localhost:5000/api/usuarios/:id
router.put('/:id', usuarioController.modificar);

// Cambio de estado (baja lógica) -> PATCH http://localhost:5000/api/usuarios/:id/toggle-status
router.patch('/:id/toggle-status', usuarioController.toggleBaja);

module.exports = router;