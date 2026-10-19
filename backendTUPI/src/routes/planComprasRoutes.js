// src/routes/PlanComprasRoutes.js
const { Router } = require('express');
const { 
  getEstadoPlan, 
  getRubros, 
  getBienesPorRubro, 
  updateConfiguracionPlan, 
  crearSolicitud,
  getHistorialSolicitudes,
  updateSolicitud,
  deleteSolicitud
} = require('../controllers/planComprasController');
const authMiddleware = require('../middlewares/authMiddleware');

const router = Router();

// Aplicar middleware de autenticación
router.use(authMiddleware);

// Rutas del Plan Anual de Compras
router.get('/estado', getEstadoPlan);
router.get('/rubros', getRubros);
router.get('/bienes-por-rubro', getBienesPorRubro);
router.put('/configuracion', updateConfiguracionPlan);

// Rutas de Solicitudes, Borradores e Historial
router.post('/solicitudes', crearSolicitud);
router.get('/solicitudes-historial', getHistorialSolicitudes);
router.put('/solicitudes/:id', updateSolicitud);
router.delete('/solicitudes/:id', deleteSolicitud);

// Exportación mediante CommonJS
module.exports = router;