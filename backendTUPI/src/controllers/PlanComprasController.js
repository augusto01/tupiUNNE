import planComprasRepository from '../repositories/PlanComprasRepository.js';
import PDFDocument from 'pdfkit';
import ExcelJS from 'exceljs';
import path from 'path';
import fs from 'fs';
import { generarPDFSolicitud } from '../services/pdfService.js';
import { generarExcelSolicitud } from '../services/excelService.js';

// Helper para encontrar el logo en la carpeta public del frontend
const obtenerRutaLogo = () => {
  const rutasPosibles = [
    path.resolve('../frontend/public/logo-unne.png'),
    path.resolve('../frontendTUPI/public/logo-unne.png'),
    path.resolve('public/logo-unne.png'),
    path.resolve('../public/logo-unne.png')
  ];

  for (const ruta of rutasPosibles) {
    if (fs.existsSync(ruta)) {
      return ruta;
    }
  }
  return null;
};

// 1. Obtener el estado del Plan Anual
export const getEstadoPlan = async (req, res) => {
  try {
    const rows = await planComprasRepository.getEstadoPlan();

    if (rows.length > 0) {
      return res.json({
        habilitado: Boolean(rows[0].habilitado),
        mensaje: rows[0].mensaje || ''
      });
    }

    return res.json({ habilitado: true, mensaje: '' });
  } catch (error) {
    console.error('Error al verificar estado del plan:', error.message);
    return res.json({ habilitado: true, mensaje: '' });
  }
};

// 2. Obtener lista de Rubros
export const getRubros = async (req, res) => {
  try {
    const rows = await planComprasRepository.getRubros();
    return res.json(rows);
  } catch (error) {
    console.error('Error al obtener la lista de rubros:', error);
    return res.status(500).json({ error: 'Error al consultar los rubros en la base de datos.' });
  }
};

// 3. Obtener bienes por Rubro
export const getBienesPorRubro = async (req, res) => {
  const { rubro_id } = req.query;

  if (!rubro_id) {
    return res.status(400).json({ error: 'Debe especificar el parámetro rubro_id.' });
  }

  try {
    const bienes = await planComprasRepository.getBienesPorRubro(rubro_id);
    return res.json(bienes);
  } catch (error) {
    console.error('Error al obtener bienes por rubro:', error);
    return res.status(500).json({ error: 'Error al consultar el catálogo de bienes.' });
  }
};

// 4. Configuración del Plan
export const updateConfiguracionPlan = async (req, res) => {
  const { habilitado, mensaje } = req.body;

  try {
    await planComprasRepository.updateConfiguracionPlan(habilitado, mensaje);
    return res.json({ message: 'Configuración del plan actualizada correctamente' });
  } catch (error) {
    console.error('Error al actualizar la configuración:', error);
    return res.status(500).json({ error: 'Error al guardar la configuración en la base de datos.' });
  }
};

// 5. Crear Solicitud
export const crearSolicitud = async (req, res) => {
  const { nro_convocatoria, bienes_seleccionados, estado } = req.body;
  const usuarioId = req.usuario?.usuario_id ?? req.usuario?.id ?? req.user?.usuario_id ?? req.user?.id;
  const estadoFinal = estado ?? 'PENDIENTE';
  const convocatoria = nro_convocatoria ?? 'CDC:2026/01';

  if (!usuarioId) {
    return res.status(401).json({ error: 'Usuario no identificado.' });
  }

  if (!bienes_seleccionados || !Array.isArray(bienes_seleccionados) || bienes_seleccionados.length === 0) {
    return res.status(400).json({ error: 'Debe enviar al menos un bien para generar la solicitud.' });
  }

  try {
    const solicitudId = await planComprasRepository.crearSolicitud(
      usuarioId, 
      convocatoria, 
      estadoFinal, 
      bienes_seleccionados
    );

    return res.status(201).json({
      message: 'Solicitud registrada correctamente',
      solicitudId
    });
  } catch (error) {
    console.error('Error al guardar la solicitud de compras:', error);
    return res.status(500).json({ error: 'Ocurrió un error al procesar la solicitud en la base de datos.' });
  }
};

// 6. Obtener Historial PROPIO del Usuario
export const getHistorialSolicitudes = async (req, res) => {
  try {
    const usuarioId = req.usuario?.usuario_id || req.usuario?.id || req.user?.usuario_id || req.user?.id;

    if (!usuarioId) {
      return res.status(401).json({ 
        error: 'No autorizado. Se requiere una sesión válida para consultar su historial.' 
      });
    }

    const historialPropio = await planComprasRepository.getSolicitudesPorUsuario(usuarioId);
    return res.json(historialPropio);
  } catch (error) {
    console.error('Error al obtener el historial personal:', error);
    return res.status(500).json({ error: 'Error interno al consultar su historial de solicitudes.' });
  }
};

// 7. Obtener Solicitudes Pendientes (Bandeja por Rol/Dependencia)
export const getSolicitudesPendientes = async (req, res) => {
  try {
    const usuarioLogueado = req.usuario || req.user || {};
    
    // Normalizamos tipo_usuario_id a número
    const tipoUsuarioId = Number(usuarioLogueado.tipo_usuario_id || usuarioLogueado.tipo_usuario || 0);
    
    // Leemos la dependencia buscando en todas las propiedades posibles
    const dependenciaId = usuarioLogueado.dependencia_id || usuarioLogueado.dependenciaId;

    console.log(`🔍 Petición de pendientes - Tipo Usuario: ${tipoUsuarioId}, Dependencia ID: ${dependenciaId}`);

    let respuesta;

    // Con la nueva jerarquía:
    // ID 1 (SuperAdmin) y ID 2 (Administrador) -> Ven TODAS las solicitudes
    // ID 3 (Autorizante) y ID 4 (Usuario) -> Ven SOLO su UOC / Dependencia
    if ((tipoUsuarioId === 3 || tipoUsuarioId === 4) && dependenciaId) {
      respuesta = await planComprasRepository.getSolicitudesPorDependencia(dependenciaId);
    } else {
      // Si es Admin/SuperAdmin O si el usuario Autorizante no tiene dependencia asignada
      respuesta = await planComprasRepository.getSolicitudesPendientes();
    }

    return res.json(respuesta);
  } catch (error) {
    console.error('Error al obtener solicitudes pendientes:', error);
    return res.status(500).json({ error: 'Error al consultar las solicitudes pendientes.' });
  }
};

// 8. Actualizar Solicitud / Borrador
export const updateSolicitud = async (req, res) => {
  const { id } = req.params;
  const { nro_convocatoria, estado, renglones, bienes_seleccionados } = req.body;

  const listaRenglones = renglones || bienes_seleccionados || [];

  if (!Array.isArray(listaRenglones) || listaRenglones.length === 0) {
    return res.status(400).json({ 
      error: 'La solicitud debe incluir al menos un bien para ser procesada.' 
    });
  }

  try {
    const nuevoEstado = estado || 'PENDIENTE';
    const nroConvocatoriaFinal = nro_convocatoria || 'CDC:2026/01';

    await planComprasRepository.updateSolicitud(id, nroConvocatoriaFinal, nuevoEstado, listaRenglones);

    return res.json({ 
      mensaje: nuevoEstado === 'BORRADOR' 
        ? 'Borrador actualizado correctamente.' 
        : 'Solicitud actualizada y reenviada exitosamente a revisión.',
      id 
    });
  } catch (error) {
    console.error('Error al actualizar solicitud:', error);
    return res.status(500).json({ 
      error: 'Error interno del servidor al actualizar la solicitud.' 
    });
  }
};

// 9. Evaluar Solicitud (Aprobar o Rechazar)
export const evaluarSolicitud = async (req, res) => {
  const { id } = req.params;
  const { estado, motivo_rechazo } = req.body;
  const adminId = req.usuario?.usuario_id ?? req.usuario?.id ?? req.user?.usuario_id ?? req.user?.id ?? 1;

  if (!['APROBADA', 'RECHAZADA'].includes(estado)) {
    return res.status(400).json({ error: 'Estado no válido.' });
  }

  if (estado === 'RECHAZADA' && (!motivo_rechazo || !motivo_rechazo.trim())) {
    return res.status(400).json({ error: 'Debe ingresar un motivo para rechazar la solicitud.' });
  }

  try {
    const motivoFinal = estado === 'RECHAZADA' ? motivo_rechazo.trim() : null;
    await planComprasRepository.evaluarSolicitud(id, estado, adminId, motivoFinal);

    return res.json({ 
      message: estado === 'APROBADA' 
        ? 'Solicitud aprobada exitosamente.' 
        : 'Solicitud rechazada con retroalimentación registrada.' 
    });
  } catch (error) {
    console.error('Error al procesar evaluación:', error);
    return res.status(500).json({ error: 'Error al actualizar el estado de la solicitud.' });
  }
};

// 10. Eliminar Solicitud / Borrador
export const deleteSolicitud = async (req, res) => {
  const { id } = req.params;

  try {
    await planComprasRepository.deleteSolicitud(id);
    return res.json({ message: 'Solicitud eliminada correctamente.' });
  } catch (error) {
    console.error('Error al eliminar la solicitud:', error);
    return res.status(500).json({ error: 'Error al eliminar la solicitud.' });
  }
};

// 11. Descargar PDF
export const descargarPDFSolicitud = async (req, res) => {
  const { id } = req.params;

  try {
    const detalle = await planComprasRepository.findSolicitudConDetalle(id);

    if (!detalle) {
      return res.status(404).json({ error: 'Solicitud no encontrada.' });
    }

    const { solicitud: sol, renglones } = detalle;

    if (sol.estado !== 'APROBADA') {
      return res.status(403).json({ 
        error: 'Únicamente está permitido emitir documentos de solicitudes APROBADAS.' 
      });
    }

    // Delegamos la generación del PDF al servicio especializado
    generarPDFSolicitud(res, sol, renglones);

  } catch (error) {
    console.error('Error generando PDF:', error);
    res.status(500).json({ error: 'Error al generar el PDF.' });
  }
};

// 12. Descargar Excel
export const descargarExcelSolicitud = async (req, res) => {
  const { id } = req.params;

  try {
    const detalle = await planComprasRepository.findSolicitudConDetalle(id);

    if (!detalle) {
      return res.status(404).json({ error: 'Solicitud no encontrada.' });
    }

    const { solicitud: sol, renglones } = detalle;

    if (sol.estado !== 'APROBADA') {
      return res.status(403).json({ 
        error: 'Únicamente está permitido emitir documentos de solicitudes APROBADAS.' 
      });
    }

    // Delegamos la generación del Excel al servicio especializado
    await generarExcelSolicitud(res, sol, renglones);

  } catch (error) {
    console.error('Error generando Excel:', error);
    res.status(500).json({ error: 'Error al generar el Excel.' });
  }
};