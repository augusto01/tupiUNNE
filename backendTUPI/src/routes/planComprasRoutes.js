const { Router } = require('express');

const { 
    getEstadoPlan, 
    updateConfiguracionPlan, 
    getRubros, 
    getBienesPorRubro, 
    crearSolicitud 
} = require('../controllers/planComprasController.js');

// 👈 Importar usando el nombre correcto del archivo
const authMiddleware = require('../middlewares/authMiddleware.js');

const router = Router();

// 🔒 Aplicar middleware a todas las rutas
router.use(authMiddleware);

// Rutas de administración de fechas y estado
router.get('/estado', getEstadoPlan);
router.put('/configuracion', updateConfiguracionPlan);

// Rutas para generación de solicitudes (Checklist)
router.get('/rubros', getRubros);
router.get('/bienes-por-rubro', getBienesPorRubro);
router.post('/solicitudes', crearSolicitud);

module.exports = router;