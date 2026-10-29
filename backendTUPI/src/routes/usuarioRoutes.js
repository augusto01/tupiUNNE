const express = require('express');
const router = express.Router();
const usuarioController = require('../controllers/UsuarioController');

// Catálogos
router.get('/tipos-usuario', (req, res) => usuarioController.listarTiposUsuario(req, res));
router.get('/dependencias', (req, res) => usuarioController.listarDependencias(req, res));

//  RUTA PÚBLICA (NO debe llevar middleware de auth/token JWT)
router.post('/activar-cuenta', (req, res) => usuarioController.activarCuenta(req, res));



// CRUD de Usuarios
// GET /api/usuarios
router.get('/', (req, res) => usuarioController.listar(req, res));

// POST /api/usuarios
router.post('/', (req, res) => usuarioController.crear(req, res));

// PUT /api/usuarios/:id
router.put('/:id', (req, res) => usuarioController.modificar(req, res));

// PATCH /api/usuarios/:id/baja
router.patch('/:id/baja', (req, res) => usuarioController.toggleBaja(req, res));



module.exports = router;