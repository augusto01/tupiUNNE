import db from '../config/db.js';
import PDFDocument from 'pdfkit';
import ExcelJS from 'exceljs';
import path from 'path';
import fs from 'fs';

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
    const query = `
      SELECT habilitado, mensaje 
      FROM configuracion_plan_compras 
      ORDER BY id DESC LIMIT 1
    `;
    const [rows] = await db.query(query);

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

// 2. Obtener lista de Rubros (Tabla `rubro`)
export const getRubros = async (req, res) => {
  try {
    const query = `
      SELECT rubro_id, \`desc\` AS rubro_nombre 
      FROM rubro 
      ORDER BY \`desc\` ASC
    `;
    const [rows] = await db.query(query);
    return res.json(rows);
  } catch (error) {
    console.error('Error al obtener la lista de rubros:', error);
    return res.status(500).json({ error: 'Error al consultar los rubros en la base de datos.' });
  }
};

// 3. Obtener bienes por Rubro (Filtra por `rubro_id`)
export const getBienesPorRubro = async (req, res) => {
  const { rubro_id } = req.query;

  if (!rubro_id) {
    return res.status(400).json({ error: 'Debe especificar el parámetro rubro_id.' });
  }

  try {
    const query = `
      SELECT 
        bien_id,
        descripcion,
        inciso,
        partida_principal,
        partida_parcial,
        trimestre,
        COALESCE(NULLIF(precio_unitario, 0), ROUND(1000 + (RAND() * 49000), 2)) AS precio_unitario,
        COALESCE(observacion, '') AS observacion
      FROM bienes
      WHERE rubro_id = ?
      ORDER BY descripcion ASC
    `;

    const [bienes] = await db.query(query, [rubro_id ?? null]);
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
    const query = `
      INSERT INTO configuracion_plan_compras (habilitado, mensaje) 
      VALUES (?, ?)
    `;
    await db.query(query, [habilitado ? 1 : 0, mensaje ?? '']);
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

  let connection;

  try {
    connection = await db.getConnection();
    await connection.beginTransaction();

    const [solicitudResult] = await connection.query(
      `INSERT INTO solicitudes (usuario_id, nro_convocatoria, fecha_creacion, estado) 
       VALUES (?, ?, NOW(), ?)`,
      [usuarioId, convocatoria, estadoFinal]
    );

    const solicitudId = solicitudResult.insertId;

    const valoresRegistros = bienes_seleccionados.map((item) => [
      solicitudId,
      item.bien_id ?? item.id ?? null,
      item.cantidad_solicitada ?? item.cantidad ?? 1,
      item.precio_unitario ?? 0.00,
      item.observacion ?? ''
    ]);

    await connection.query(
      `INSERT INTO solicitud_registros 
       (id_solicitud, bien_id, cantidad, precio_unitario, observacion) 
       VALUES ?`,
      [valoresRegistros]
    );

    await connection.commit();

    return res.status(201).json({
      message: 'Solicitud registrada correctamente',
      solicitudId
    });
  } catch (error) {
    if (connection) await connection.rollback();
    console.error('Error al guardar la solicitud de compras:', error);
    return res.status(500).json({ error: 'Ocurrió un error al procesar la solicitud en la base de datos.' });
  } finally {
    if (connection) connection.release();
  }
};

// 6. Obtener Historial PROPIO del Usuario (SOLO SUS SOLICITUDES)
export const getHistorialSolicitudes = async (req, res) => {
  try {
    // 1. Extracción del ID del usuario autenticado desde el middleware 'auth'
    const usuarioId = req.usuario?.usuario_id || req.usuario?.id || req.user?.usuario_id || req.user?.id;

    // 2. Si no hay ID de usuario válido, rechazar la petición sin consultar la DB
    if (!usuarioId) {
      return res.status(401).json({ 
        error: 'No autorizado. Se requiere una sesión válida para consultar su historial.' 
      });
    }

    // 3. Consulta con filtro ESTRICTO por el usuario logueado (s.usuario_id = ?)
    const querySolicitudes = `
      SELECT 
        s.id, 
        s.usuario_id, 
        s.nro_convocatoria, 
        s.fecha_creacion, 
        s.estado, 
        s.fecha_solicitud,
        s.usuario_autorizante,
        s.motivo_rechazo,
        u.nombre AS usuario_nombre, 
        u.apellido AS usuario_apellido,
        d.nombre AS dependencia_nombre,
        admin.nombre AS admin_nombre,
        admin.apellido AS admin_apellido
      FROM solicitudes s
      JOIN usuario u ON s.usuario_id = u.usuario_id
      LEFT JOIN usuario admin ON s.usuario_autorizante = admin.usuario_id
      LEFT JOIN dependencias d ON u.dependencia_id = d.dependencia_id
      WHERE s.usuario_id = ?
      ORDER BY s.id DESC
    `;

    const [solicitudes] = await db.query(querySolicitudes, [usuarioId]);

    // Si el usuario aún no creó solicitudes, devolver array vacío []
    if (!solicitudes || solicitudes.length === 0) {
      return res.json([]);
    }

    // 4. Obtener renglones únicamente de las solicitudes pertenecientes a este usuario
    const ids = solicitudes.map((s) => s.id);

    const queryRegistros = `
      SELECT 
        sr.id,
        sr.id_solicitud AS solicitud_id,
        sr.bien_id,
        sr.cantidad,
        sr.precio_unitario,
        sr.observacion,
        b.descripcion AS bien_descripcion,
        b.trimestre
      FROM solicitud_registros sr
      JOIN bienes b ON sr.bien_id = b.bien_id
      WHERE sr.id_solicitud IN (?)
    `;
    const [registros] = await db.query(queryRegistros, [ids]);

    // 5. Vincular los renglones correspondientes
    const historialPropio = solicitudes.map((sol) => ({
      ...sol,
      renglones: registros.filter((r) => r.solicitud_id === sol.id)
    }));

    return res.json(historialPropio);
  } catch (error) {
    console.error('Error al obtener el historial personal:', error);
    return res.status(500).json({ error: 'Error interno al consultar su historial de solicitudes.' });
  }
};

// 7. Obtener TODAS las Solicitudes Pendientes / General (BANDEJA ADMINISTRATIVA)
export const getSolicitudesPendientes = async (req, res) => {
  try {
    const querySolicitudes = `
      SELECT 
        s.id, 
        s.nro_convocatoria, 
        s.fecha_creacion, 
        s.estado, 
        s.usuario_id,
        s.usuario_autorizante,
        s.motivo_rechazo,
        u.nombre AS usuario_nombre, 
        u.apellido AS usuario_apellido, 
        u.email AS usuario_email,
        admin.nombre AS admin_nombre,
        admin.apellido AS admin_apellido,
        admin.email AS admin_email,
        d.nombre AS dependencia_nombre
      FROM solicitudes s
      JOIN usuario u ON s.usuario_id = u.usuario_id
      LEFT JOIN usuario admin ON s.usuario_autorizante = admin.usuario_id
      LEFT JOIN dependencias d ON u.dependencia_id = d.dependencia_id
      ORDER BY s.id DESC
    `;

    const [solicitudes] = await db.query(querySolicitudes);

    if (!solicitudes || solicitudes.length === 0) {
      return res.json([]);
    }

    const ids = solicitudes.map((s) => s.id);

    const queryRegistros = `
      SELECT 
        sr.id,
        sr.id_solicitud AS solicitud_id,
        sr.bien_id,
        sr.cantidad,
        sr.precio_unitario,
        sr.observacion,
        b.descripcion AS bien_descripcion,
        b.trimestre
      FROM solicitud_registros sr
      JOIN bienes b ON sr.bien_id = b.bien_id
      WHERE sr.id_solicitud IN (?)
    `;
    const [registros] = await db.query(queryRegistros, [ids]);

    const respuesta = solicitudes.map((sol) => ({
      ...sol,
      renglones: registros.filter((r) => r.solicitud_id === sol.id)
    }));

    return res.json(respuesta);
  } catch (error) {
    console.error('Error al obtener solicitudes pendientes:', error);
    return res.status(500).json({ error: 'Error al consultar las solicitudes pendientes.' });
  }
};

// 8. Actualizar Solicitud / Borrador (Edición y Reenvío)
export const updateSolicitud = async (req, res) => {
  const { id } = req.params;
  const { nro_convocatoria, estado, renglones, bienes_seleccionados } = req.body;

  const listaRenglones = renglones || bienes_seleccionados || [];

  if (!Array.isArray(listaRenglones) || listaRenglones.length === 0) {
    return res.status(400).json({ 
      error: 'La solicitud debe incluir al menos un bien para ser procesada.' 
    });
  }

  const connection = await db.getConnection();

  try {
    await connection.beginTransaction();

    const nuevoEstado = estado || 'PENDIENTE';
    const nroConvocatoriaFinal = nro_convocatoria || 'CDC:2026/01';

    await connection.query(
      `UPDATE solicitudes 
       SET nro_convocatoria = ?, 
           estado = ?, 
           motivo_rechazo = NULL, 
           fecha_creacion = NOW() 
       WHERE id = ?`,
      [nroConvocatoriaFinal, nuevoEstado, id]
    );

    await connection.query(
      `DELETE FROM solicitud_registros WHERE id_solicitud = ?`,
      [id]
    );

    const queryRenglones = `
      INSERT INTO solicitud_registros (id_solicitud, bien_id, cantidad, precio_unitario, observacion) 
      VALUES ?
    `;

    const valuesRenglones = listaRenglones.map((r) => [
      id,
      parseInt(r.bien_id || r.id, 10),
      parseInt(r.cantidad || r.cantidad_solicitada, 10) || 1,
      parseFloat(r.precio_unitario) || 0,
      r.observacion ? r.observacion.trim() : ''
    ]);

    await connection.query(queryRenglones, [valuesRenglones]);

    await connection.commit();

    return res.json({ 
      mensaje: nuevoEstado === 'BORRADOR' 
        ? 'Borrador actualizado correctamente.' 
        : 'Solicitud actualizada y reenviada exitosamente a revisión.',
      id 
    });

  } catch (error) {
    await connection.rollback();
    console.error('Error al actualizar solicitud:', error);
    return res.status(500).json({ 
      error: 'Error interno del servidor al actualizar la solicitud.' 
    });
  } finally {
    connection.release();
  }
};

// 9. Evaluar Solicitud (Aprobar o Rechazar por el Administrador)
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
    const query = `
      UPDATE solicitudes 
      SET 
        estado = ?, 
        usuario_autorizante = ?,
        motivo_rechazo = ?
      WHERE id = ?
    `;

    const motivoFinal = estado === 'RECHAZADA' ? motivo_rechazo.trim() : null;

    await db.query(query, [estado, adminId, motivoFinal, id]);

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
  let connection;

  try {
    connection = await db.getConnection();
    await connection.beginTransaction();

    await connection.query(`DELETE FROM solicitud_registros WHERE id_solicitud = ?`, [id]);
    await connection.query(`DELETE FROM solicitudes WHERE id = ?`, [id]);

    await connection.commit();
    return res.json({ message: 'Solicitud eliminada correctamente.' });
  } catch (error) {
    if (connection) await connection.rollback();
    console.error('Error al eliminar la solicitud:', error);
    return res.status(500).json({ error: 'Error al eliminar la solicitud.' });
  } finally {
    if (connection) connection.release();
  }
};

// 11. Generar e imprimir PDF (Solo APROBADA)
export const descargarPDFSolicitud = async (req, res) => {
  const { id } = req.params;

  try {
    const [solRows] = await db.query(
      `SELECT 
        s.id, s.nro_convocatoria, s.fecha_creacion, s.estado,
        u.nombre AS usuario_nombre, u.apellido AS usuario_apellido, u.email AS usuario_email,
        admin.nombre AS admin_nombre, admin.apellido AS admin_apellido, admin.email AS admin_email,
        d.nombre AS dependencia_nombre
       FROM solicitudes s
       JOIN usuario u ON s.usuario_id = u.usuario_id
       LEFT JOIN usuario admin ON s.usuario_autorizante = admin.usuario_id
       LEFT JOIN dependencias d ON u.dependencia_id = d.dependencia_id
       WHERE s.id = ?`,
      [id]
    );

    if (solRows.length === 0) {
      return res.status(404).json({ error: 'Solicitud no encontrada.' });
    }

    const sol = solRows[0];

    if (sol.estado !== 'APROBADA') {
      return res.status(403).json({ 
        error: 'Únicamente está permitido emitir documentos de solicitudes APROBADAS.' 
      });
    }

    const [renglones] = await db.query(
      `SELECT sr.cantidad, sr.precio_unitario, sr.observacion, b.descripcion, b.trimestre
       FROM solicitud_registros sr
       JOIN bienes b ON sr.bien_id = b.bien_id
       WHERE sr.id_solicitud = ?`,
      [id]
    );

    const doc = new PDFDocument({ margin: 40, size: 'A4' });
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename=Solicitud_Autorizada_${sol.id}.pdf`);
    doc.pipe(res);

    const logoPath = obtenerRutaLogo();
    if (logoPath) {
      doc.image(logoPath, 40, 35, { width: 60 });
    }

    doc.fillColor('#0f172a').fontSize(16).font('Helvetica-Bold').text('UNIVERSIDAD NACIONAL DEL NORDESTE', 110, 40);
    doc.fillColor('#0284c7').fontSize(12).font('Helvetica-Bold').text('SISTEMA TUPI - COMPROBANTE DE SOLICITUD AUTORIZADA', 110, 60);
    doc.fillColor('#64748b').fontSize(9).font('Helvetica').text('Plan Anual de Compras y Contrataciones (PAC)', 110, 75);

    doc.moveTo(40, 105).lineTo(555, 105).strokeColor('#0284c7').lineWidth(2).stroke();

    doc.rect(40, 115, 515, 75).fillAndStroke('#f8fafc', '#e2e8f0');

    doc.fillColor('#1e293b').fontSize(9).font('Helvetica-Bold');
    doc.text('Solicitud N°:', 50, 125).font('Helvetica').text(`#${sol.id}`, 120, 125);
    doc.font('Helvetica-Bold').text('Convocatoria:', 50, 140).font('Helvetica').text(`${sol.nro_convocatoria || 'CDC:2026/01'}`, 120, 140);
    doc.font('Helvetica-Bold').text('Dependencia:', 50, 155).font('Helvetica').text(`${sol.dependencia_nombre || 'Rectorado UNNE'}`, 120, 155);

    doc.font('Helvetica-Bold').text('Solicitante:', 300, 125).font('Helvetica').text(`${sol.usuario_nombre} ${sol.usuario_apellido}`, 370, 125);
    doc.font('Helvetica-Bold').text('Email:', 300, 140).font('Helvetica').text(`${sol.usuario_email}`, 370, 140);
    doc.font('Helvetica-Bold').text('Fecha Emisión:', 300, 155).font('Helvetica').text(`${new Date(sol.fecha_creacion).toLocaleDateString('es-AR')}`, 370, 155);

    let y = 205;

    doc.rect(40, y, 515, 22).fill('#0284c7');
    doc.fillColor('#ffffff').fontSize(8).font('Helvetica-Bold');
    doc.text('BIEN / DESCRIPCIÓN', 48, y + 7, { width: 190 });
    doc.text('TRIMESTRE', 240, y + 7, { width: 75, align: 'center' });
    doc.text('CANT.', 320, y + 7, { width: 45, align: 'center' });
    doc.text('PRECIO UNIT.', 370, y + 7, { width: 80, align: 'right' });
    doc.text('SUBTOTAL', 455, y + 7, { width: 90, align: 'right' });

    y += 22;
    let totalGeneral = 0;

    renglones.forEach((r, index) => {
      const cantidad = parseInt(r.cantidad, 10) || 1;
      const precio = parseFloat(r.precio_unitario) || 0;
      const subtotal = cantidad * precio;
      totalGeneral += subtotal;

      const bgRow = index % 2 === 0 ? '#ffffff' : '#f1f5f9';
      doc.rect(40, y, 515, 20).fill(bgRow);

      doc.fillColor('#0f172a').fontSize(8).font('Helvetica');
      doc.text(r.descripcion || 'Bien Institucional', 48, y + 5, { width: 190, lineBreak: false });
      doc.text(r.trimestre || '1ER TRIMESTRE', 240, y + 5, { width: 75, align: 'center' });
      doc.text(`${cantidad}`, 320, y + 5, { width: 45, align: 'center' });
      doc.text(`$ ${precio.toLocaleString('es-AR', { minimumFractionDigits: 2 })}`, 370, y + 5, { width: 80, align: 'right' });
      doc.fillColor('#0369a1').font('Helvetica-Bold');
      doc.text(`$ ${subtotal.toLocaleString('es-AR', { minimumFractionDigits: 2 })}`, 455, y + 5, { width: 90, align: 'right' });

      y += 20;
    });

    doc.rect(40, y, 515, 26).fillAndStroke('#e0f2fe', '#0284c7');
    doc.fillColor('#0369a1').fontSize(10).font('Helvetica-Bold');
    doc.text('MONTO TOTAL GENERAL ESTIMADO:', 50, y + 8);
    doc.text(`$ ${totalGeneral.toLocaleString('es-AR', { minimumFractionDigits: 2 })}`, 415, y + 8, { width: 130, align: 'right' });

    y += 45;

    doc.rect(40, y, 515, 55).fillAndStroke('#f8fafc', '#cbd5e1');
    doc.fillColor('#0f172a').fontSize(9).font('Helvetica-Bold');
    doc.text('AUTORIZACIÓN INSTITUCIONAL', 50, y + 10);
    
    doc.fontSize(8.5).font('Helvetica').fillColor('#334155');
    const adminNom = `${sol.admin_nombre || 'Dirección de Gestión'} ${sol.admin_apellido || ''}`.trim();
    const adminEmail = sol.admin_email || 'rectorado@unne.edu.ar';
    
    doc.text(`Solicitud autorizada por: ${adminNom}`, 50, y + 26);
    doc.text(`Correo Institucional: ${adminEmail}`, 50, y + 38);
    doc.fillColor('#16a34a').font('Helvetica-Bold').text('ESTADO: AUTORIZADO Y VALIDADO EN SISTEMA', 310, y + 26, { align: 'right' });

    doc.fontSize(7).fillColor('#94a3b8').text('Documento digital generado automáticamente por TUPI UNNE - Universidad Nacional del Nordeste.', 40, 780, { align: 'center' });

    doc.end();
  } catch (error) {
    console.error('Error generando PDF:', error);
    res.status(500).json({ error: 'Error al generar el PDF.' });
  }
};

// 12. Exportar Solicitud a Excel (Solo APROBADA)
export const descargarExcelSolicitud = async (req, res) => {
  const { id } = req.params;

  try {
    const [solRows] = await db.query(
      `SELECT 
        s.id, s.nro_convocatoria, s.fecha_creacion, s.estado,
        u.nombre AS usuario_nombre, u.apellido AS usuario_apellido, u.email AS usuario_email,
        admin.nombre AS admin_nombre, admin.apellido AS admin_apellido, admin.email AS admin_email,
        d.nombre AS dependencia_nombre
       FROM solicitudes s
       JOIN usuario u ON s.usuario_id = u.usuario_id
       LEFT JOIN usuario admin ON s.usuario_autorizante = admin.usuario_id
       LEFT JOIN dependencias d ON u.dependencia_id = d.dependencia_id
       WHERE s.id = ?`,
      [id]
    );

    if (solRows.length === 0) {
      return res.status(404).json({ error: 'Solicitud no encontrada.' });
    }

    const sol = solRows[0];

    if (sol.estado !== 'APROBADA') {
      return res.status(403).json({ 
        error: 'Únicamente está permitido emitir documentos de solicitudes APROBADAS.' 
      });
    }

    const [renglones] = await db.query(
      `SELECT sr.cantidad, sr.precio_unitario, sr.observacion, b.descripcion, b.trimestre
       FROM solicitud_registros sr
       JOIN bienes b ON sr.bien_id = b.bien_id
       WHERE sr.id_solicitud = ?`,
      [id]
    );

    const workbook = new ExcelJS.Workbook();
    const sheet = workbook.addWorksheet(`Solicitud_${sol.id}`);

    sheet.columns = [
      { key: 'item', width: 8 },
      { key: 'descripcion', width: 40 },
      { key: 'trimestre', width: 18 },
      { key: 'cantidad', width: 12 },
      { key: 'precio_unitario', width: 18 },
      { key: 'subtotal', width: 20 },
      { key: 'observacion', width: 30 }
    ];

    sheet.mergeCells('A1:G1');
    const titleCell = sheet.getCell('A1');
    titleCell.value = 'UNIVERSIDAD NACIONAL DEL NORDESTE - PLAN ANUAL DE COMPRAS';
    titleCell.font = { name: 'Arial', size: 14, bold: true, color: { argb: 'FFFFFFFF' } };
    titleCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF0284C7' } };
    titleCell.alignment = { horizontal: 'center', vertical: 'middle' };
    sheet.getRow(1).height = 30;

    sheet.addRow([]);
    sheet.addRow(['Solicitud N°:', `#${sol.id}`, '', 'Solicitante:', `${sol.usuario_nombre} ${sol.usuario_apellido}`]);
    sheet.addRow(['Convocatoria:', sol.nro_convocatoria, '', 'Email:', sol.usuario_email]);
    sheet.addRow(['Dependencia:', sol.dependencia_nombre || 'Rectorado UNNE', '', 'Fecha:', new Date(sol.fecha_creacion).toLocaleDateString('es-AR')]);
    sheet.addRow(['Estado:', sol.estado, '', 'Autorizado por:', `${sol.admin_nombre || 'Administración'} (${sol.admin_email || 'rectorado@unne.edu.ar'})`]);
    sheet.addRow([]);

    for (let r = 3; r <= 6; r++) {
      sheet.getCell(`A${r}`).font = { bold: true };
      sheet.getCell(`D${r}`).font = { bold: true };
    }

    const headerRow = sheet.addRow(['N°', 'Bien / Descripción', 'Trimestre', 'Cantidad', 'Precio Unit ($)', 'Subtotal ($)', 'Observaciones']);
    headerRow.height = 24;

    headerRow.eachCell((cell) => {
      cell.font = { bold: true, color: { argb: 'FFFFFFFF' } };
      cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF0369A1' } };
      cell.alignment = { horizontal: 'center', vertical: 'middle' };
    });

    let totalGeneral = 0;

    renglones.forEach((r, idx) => {
      const cantidad = parseInt(r.cantidad, 10) || 1;
      const precio = parseFloat(r.precio_unitario) || 0;
      const subtotal = cantidad * precio;
      totalGeneral += subtotal;

      const dataRow = sheet.addRow([
        idx + 1,
        r.descripcion,
        r.trimestre || '1ER TRIMESTRE',
        cantidad,
        precio,
        subtotal,
        r.observacion || ''
      ]);

      dataRow.getCell(1).alignment = { horizontal: 'center' };
      dataRow.getCell(3).alignment = { horizontal: 'center' };
      dataRow.getCell(4).alignment = { horizontal: 'center' };
      dataRow.getCell(5).numFmt = '$#,##0.00';
      dataRow.getCell(6).numFmt = '$#,##0.00';
      dataRow.getCell(6).font = { bold: true, color: { argb: 'FF0369A1' } };
    });

    const totalRow = sheet.addRow(['', 'MONTO TOTAL GENERAL ESTIMADO', '', '', '', totalGeneral, '']);
    totalRow.height = 24;
    sheet.mergeCells(`B${totalRow.number}:E${totalRow.number}`);

    const totalLabelCell = sheet.getCell(`B${totalRow.number}`);
    totalLabelCell.font = { bold: true, size: 11, color: { argb: 'FF0369A1' } };
    totalLabelCell.alignment = { horizontal: 'right', vertical: 'middle' };

    const totalValueCell = sheet.getCell(`F${totalRow.number}`);
    totalValueCell.font = { bold: true, size: 11, color: { argb: 'FF0369A1' } };
    totalValueCell.numFmt = '$#,##0.00';
    totalValueCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFE0F2FE' } };

    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename=Solicitud_${sol.id}.xlsx`);

    await workbook.xlsx.write(res);
    res.end();
  } catch (error) {
    console.error('Error generando Excel:', error);
    res.status(500).json({ error: 'Error al generar el Excel.' });
  }
};