import express from 'express';
import { 
  getEstadoPlan, 
  getRubros, 
  getBienesPorRubro, 
  crearSolicitud, 
  getHistorialSolicitudes, 
  updateSolicitud, 
  deleteSolicitud,
  descargarExcelSolicitud
} from '../controllers/PlanComprasController.js';

import { 
  getSolicitudesPendientes, 
  evaluarSolicitud, 
  descargarPDFSolicitud 
} from '../controllers/solicitudesController.js';

const router = express.Router();

// Rutas de Plan de Compras existentes
router.get('/estado', getEstadoPlan);
router.get('/rubros', getRubros);
router.get('/bienes-por-rubro', getBienesPorRubro);
router.post('/solicitudes', crearSolicitud);
router.get('/solicitudes-historial', getHistorialSolicitudes);
router.put('/solicitudes/:id', updateSolicitud);
router.delete('/solicitudes/:id', deleteSolicitud);

// 🚨 NUEVAS RUTAS PARA ADMINISTRACIÓN Y AUTORIZACIONES (Faltaban en el backend)
router.get('/solicitudes-pendientes', getSolicitudesPendientes);
router.post('/solicitudes/:id/evaluar', evaluarSolicitud);
router.get('/solicitudes/:id/pdf', descargarPDFSolicitud);
router.get('/solicitudes/:id/excel', descargarExcelSolicitud); // 👈

export default router;