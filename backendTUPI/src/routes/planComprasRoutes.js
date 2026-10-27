import express from 'express';
// Importación por defecto de tu middleware de autenticación
import auth from '../middlewares/authMiddleware.js';

// TODAS las funciones importadas desde un ÚNICO controlador
import { 
  getEstadoPlan, 
  getRubros, 
  getBienesPorRubro, 
  crearSolicitud, 
  getHistorialSolicitudes, 
  getSolicitudesPendientes,
  updateSolicitud, 
  evaluarSolicitud,
  deleteSolicitud,
  descargarPDFSolicitud,
  descargarExcelSolicitud
} from '../controllers/PlanComprasController.js';

const router = express.Router();

// 🔒 APLICACIÓN GLOBAL DEL MIDDLEWARE DE AUTENTICACIÓN
// Esto garantiza que req.usuario quede poblado antes de cada endpoint
router.use(auth);

// --- Rutas del Usuario Solicitante ---
router.get('/estado', getEstadoPlan);
router.get('/rubros', getRubros);
router.get('/bienes-por-rubro', getBienesPorRubro);
router.post('/solicitudes', crearSolicitud);
router.get('/solicitudes-historial', getHistorialSolicitudes); // 👈 Filtra solo por el usuario logueado
router.put('/solicitudes/:id', updateSolicitud);
router.delete('/solicitudes/:id', deleteSolicitud);

// --- Rutas de Administración y Evaluaciones ---
router.get('/solicitudes-pendientes', getSolicitudesPendientes); // 👈 Carga bandeja global
router.post('/solicitudes/:id/evaluar', evaluarSolicitud);

// --- Exportaciones ---
router.get('/solicitudes/:id/pdf', descargarPDFSolicitud);
router.get('/solicitudes/:id/excel', descargarExcelSolicitud);

export default router;