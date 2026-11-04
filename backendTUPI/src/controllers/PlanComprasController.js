import planComprasRepository from '../repositories/PlanComprasRepository.js';
import { generarPDFSolicitud, generarPDFConsolidado } from '../services/pdfService.js';
import { generarExcelSolicitud, generarExcelConsolidado } from '../services/excelService.js';

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

// 2b. Obtener lista de Áreas (filtradas por dependencia si corresponde)
export const getAreas = async (req, res) => {
  try {
    const dependenciaId = req.user?.dependencia_id || req.query.dependencia_id || null;
    const areas = await planComprasRepository.getAreas(dependenciaId);
    return res.json(areas);
  } catch (error) {
    console.error('Error al obtener áreas por UOC:', error);
    return res.status(500).json({ error: 'Error al obtener la lista de áreas' });
  }
};

// 3. Obtener bienes por Rubro (Soporta opción "TODOS" o vacío)
export const getBienesPorRubro = async (req, res) => {
  const { rubro_id } = req.query;

  try {
    let bienes;
    if (!rubro_id || rubro_id === '' || rubro_id === 'TODOS') {
      bienes = await planComprasRepository.getTodosLosBienes();
    } else {
      bienes = await planComprasRepository.getBienesPorRubro(rubro_id);
    }
    return res.json(bienes);
  } catch (error) {
    console.error('Error al obtener bienes:', error);
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
  const { nro_convocatoria, area_id, observaciones, bienes_seleccionados, renglones, estado } = req.body;
  const usuarioId = req.usuario?.usuario_id ?? req.usuario?.id ?? req.user?.usuario_id ?? req.user?.id;
  const estadoFinal = estado ?? 'PENDIENTE';
  const convocatoria = nro_convocatoria ?? 'CDC:2026/01';
  const listaBienes = renglones || bienes_seleccionados || [];

  if (!usuarioId) {
    return res.status(401).json({ error: 'Usuario no identificado o sesión inválida.' });
  }

  if (!listaBienes || !Array.isArray(listaBienes) || listaBienes.length === 0) {
    return res.status(400).json({ error: 'Debe enviar al menos un bien para generar la solicitud.' });
  }

  try {
    const solicitudId = await planComprasRepository.crearSolicitud({
      usuario_id: usuarioId,
      area_id: area_id || null,
      nro_convocatoria: convocatoria,
      observaciones: observaciones || null,
      estado: estadoFinal,
      renglones: listaBienes
    });

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
      return res.status(401).json({ error: 'No autorizado.' });
    }
    const historialPropio = await planComprasRepository.getSolicitudesPorUsuario(usuarioId);
    return res.json(historialPropio);
  } catch (error) {
    console.error('Error al obtener el historial personal:', error);
    return res.status(500).json({ error: 'Error interno al consultar su historial.' });
  }
};

// 7. Obtener Solicitudes Pendientes
export const getSolicitudesPendientes = async (req, res) => {
  try {
    const usuarioLogueado = req.usuario || req.user || {};
    const tipoUsuarioId = Number(usuarioLogueado.tipo_usuario_id || usuarioLogueado.tipo_usuario || 0);
    const dependenciaId = usuarioLogueado.dependencia_id || usuarioLogueado.dependenciaId;

    let respuesta = [];
    if ((tipoUsuarioId === 3 || tipoUsuarioId === 4) && dependenciaId) {
      respuesta = await planComprasRepository.getSolicitudesPorDependencia(dependenciaId);
    } else {
      respuesta = await planComprasRepository.getSolicitudesPendientes();
    }
    return res.json(Array.isArray(respuesta) ? respuesta : []);
  } catch (error) {
    console.error('Error al obtener solicitudes pendientes:', error);
    return res.status(500).json({ error: 'Error al consultar las solicitudes pendientes.' });
  }
};

// 8. Actualizar Solicitud / Borrador
export const updateSolicitud = async (req, res) => {
  const { id } = req.params;
  const { nro_convocatoria, area_id, observaciones, estado, renglones, bienes_seleccionados } = req.body;
  const listaRenglones = renglones || bienes_seleccionados || [];

  if (!Array.isArray(listaRenglones) || listaRenglones.length === 0) {
    return res.status(400).json({ error: 'La solicitud debe incluir al menos un bien.' });
  }

  try {
    const nuevoEstado = estado || 'PENDIENTE';
    const nroConvocatoriaFinal = nro_convocatoria || 'CDC:2026/01';

    await planComprasRepository.updateSolicitud(
      id, area_id, nroConvocatoriaFinal, nuevoEstado, listaRenglones, observaciones
    );

    return res.json({ mensaje: 'Solicitud actualizada exitosamente.', id });
  } catch (error) {
    console.error('Error al actualizar solicitud:', error);
    return res.status(500).json({ error: 'Error interno al actualizar la solicitud.' });
  }
};

// 9. Evaluar Solicitud
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
    return res.json({ message: 'Evaluación registrada con éxito.' });
  } catch (error) {
    console.error('Error al procesar evaluación:', error);
    return res.status(500).json({ error: 'Error al actualizar el estado.' });
  }
};

// 10. Eliminar Solicitud
export const deleteSolicitud = async (req, res) => {
  const { id } = req.params;
  try {
    await planComprasRepository.deleteSolicitud(id);
    return res.json({ message: 'Solicitud eliminada correctamente.' });
  } catch (error) {
    console.error('Error al eliminar:', error);
    return res.status(500).json({ error: 'Error al eliminar la solicitud.' });
  }
};

// 11 y 12. Descargas Individuales (PDF / Excel)
export const descargarPDFSolicitud = async (req, res) => {
  const { id } = req.params;
  try {
    const detalle = await planComprasRepository.findSolicitudConDetalle(id);
    if (!detalle || detalle.solicitud.estado !== 'APROBADA') {
      return res.status(403).json({ error: 'Solicitud no encontrada o no aprobada.' });
    }
    generarPDFSolicitud(res, detalle.solicitud, detalle.renglones);
  } catch (error) {
    res.status(500).json({ error: 'Error al generar el PDF.' });
  }
};

export const descargarExcelSolicitud = async (req, res) => {
  const { id } = req.params;
  try {
    const detalle = await planComprasRepository.findSolicitudConDetalle(id);
    if (!detalle || detalle.solicitud.estado !== 'APROBADA') {
      return res.status(403).json({ error: 'Solicitud no encontrada o no aprobada.' });
    }
    await generarExcelSolicitud(res, detalle.solicitud, detalle.renglones);
  } catch (error) {
    res.status(500).json({ error: 'Error al generar el Excel.' });
  }
};

// 13 y 14. Exportaciones Consolidadas
export const exportarPdfConsolidado = async (req, res) => {
  try {
    const solicitudes = await planComprasRepository.findAllSolicitudesAprobadasConDetalle();
    if (!solicitudes.length) return res.status(404).json({ error: 'No hay solicitudes aprobadas.' });
    generarPDFConsolidado(res, solicitudes);
  } catch (error) {
    res.status(500).json({ error: 'Error al generar PDF consolidado.' });
  }
};

export const exportarExcelConsolidado = async (req, res) => {
  try {
    const solicitudes = await planComprasRepository.findAllSolicitudesAprobadasConDetalle();
    if (!solicitudes.length) return res.status(404).json({ error: 'No hay solicitudes aprobadas.' });
    await generarExcelConsolidado(res, solicitudes);
  } catch (error) {
    res.status(500).json({ error: 'Error al generar Excel consolidado.' });
  }
};