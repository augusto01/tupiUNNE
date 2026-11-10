import express from 'express';
import auth from '../middlewares/authMiddleware.js';

import { 
  getEstadoPlan, 
  getRubros, 
  getAreas, 
  getBienesPorRubro, 
  crearSolicitud, 
  getHistorialSolicitudes, 
  getSolicitudesPendientes,
  updateSolicitud, 
  evaluarSolicitud,
  deleteSolicitud,
  descargarPDFSolicitud,
  descargarExcelSolicitud,
  exportarExcelUniversidad,
  exportarExcelDependencia,
  exportarPdfUniversidad,
  exportarPdfDependencia
} from '../controllers/PlanComprasController.js';

const router = express.Router();

// Aplicación global del middleware de autenticación
router.use(auth);

// --- Rutas del Usuario Solicitante ---
router.get('/estado', getEstadoPlan);
router.get('/rubros', getRubros);
router.get('/areas', getAreas); 
router.get('/bienes-por-rubro', getBienesPorRubro);
router.post('/solicitudes', crearSolicitud);
router.get('/solicitudes-historial', getHistorialSolicitudes);
router.put('/solicitudes/:id', updateSolicitud);
router.delete('/solicitudes/:id', deleteSolicitud);

// --- Rutas de Administración y Evaluaciones ---
router.get('/solicitudes-pendientes', getSolicitudesPendientes);
router.post('/solicitudes/:id/evaluar', evaluarSolicitud);

// --- Exportaciones individuales ---
router.get('/solicitudes/:id/pdf', descargarPDFSolicitud);
router.get('/solicitudes/:id/excel', descargarExcelSolicitud);

// --- Rutas de exportación masiva (Utilizan el middleware 'auth' aplicado globalmente arriba) ---
router.get('/exportar/universidad', exportarExcelUniversidad);
router.get('/exportar/dependencia', exportarExcelDependencia);
router.get('/exportar/universidad/pdf', exportarPdfUniversidad);
router.get('/exportar/dependencia/pdf', exportarPdfDependencia);

export default router;