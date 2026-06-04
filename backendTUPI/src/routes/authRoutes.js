const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const verificarToken = require('../middlewares/authMiddleware');

// Ruta pública para loguearse
router.post('/login', authController.login);

// Ruta de prueba protegida para verificar que el middleware ande joya
router.get('/verificar-sesion', verificarToken, (req, res) => {
  res.json({ 
    autenticado: true, 
    message: `Token válido. Sesión activa de: ${req.usuario.nombre}` 
  });
});

module.exports = router;