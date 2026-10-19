const { Router } = require('express');

// Importar los métodos individualmente desestructurándolos del controlador
const { 
    getEstadoPlan, 
    updateConfiguracionPlan, 
    getRubros, 
    getBienesPorRubro, 
    crearSolicitud 
} = require('../controllers/PlanComprasController');
const auth = require('../middlewares/authMiddleware.js');

const router = Router();

// 🔒 Aplicar middleware de autenticación a todas las rutas
router.use(auth);

// Rutas de administración de fechas y estado
router.get('/estado', getEstadoPlan);
router.put('/configuracion', updateConfiguracionPlan);

// Rutas para generación de solicitudes (Checklist)
router.get('/rubros', getRubros);
router.get('/bienes-por-rubro', getBienesPorRubro);
router.post('/solicitudes', crearSolicitud);

module.exports = router;