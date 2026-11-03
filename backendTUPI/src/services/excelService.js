import ExcelJS from 'exceljs';

const formatCurrency = (val) => parseFloat(val || 0);

/**
 * 1. Genera el Excel de una SOLA solicitud
 */
export const generarExcelSolicitud = async (res, solicitud, renglones) => {
  const workbook = new ExcelJS.Workbook();
  workbook.creator = 'Sistema TUPI - UNNE';
  
  const worksheet = workbook.addWorksheet(`Solicitud #${solicitud.id}`);

  // Encabezado Institucional
  worksheet.mergeCells('A1:I1');
  const titleCell = worksheet.getCell('A1');
  titleCell.value = 'UNIVERSIDAD NACIONAL DEL NORDESTE - PLAN ANUAL DE COMPRAS';
  titleCell.font = { name: 'Arial', size: 14, bold: true, color: { argb: 'FFFFFFFF' } };
  titleCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF0F172A' } };
  titleCell.alignment = { horizontal: 'center', vertical: 'middle' };
  worksheet.getRow(1).height = 30;

  worksheet.addRow([]);
  worksheet.addRow(['N° Solicitud:', solicitud.id, '', 'Fecha Emisión:', solicitud.fecha_creacion ? new Date(solicitud.fecha_creacion).toLocaleDateString('es-AR') : 'N/A']);
  worksheet.addRow(['Solicitante:', `${solicitud.usuario_nombre || ''} ${solicitud.usuario_apellido || ''}`, '', 'Convocatoria:', solicitud.nro_convocatoria || 'CDC:2026/01']);
  worksheet.addRow(['Área Origen:', solicitud.area_nombre || 'Sin Área Asignada', '', 'UOC / Dependencia:', solicitud.dependencia_nombre || 'Rectorado UNNE']);
  worksheet.addRow(['Autorizado por:', solicitud.admin_nombre ? `${solicitud.admin_nombre} ${solicitud.admin_apellido}` : 'Pendiente / Sistema', '', 'Estado:', solicitud.estado]);
  worksheet.addRow([]);

  for (let r = 3; r <= 6; r++) {
    worksheet.getCell(`A${r}`).font = { bold: true };
    worksheet.getCell(`D${r}`).font = { bold: true };
  }

  const headerRow = worksheet.addRow([
    'Inciso',
    'Partida Principal',
    'Partida Parcial',
    'Bien / Descripción',
    'Trimestre',
    'Cantidad',
    'Precio Unit. ($)',
    'Subtotal ($)',
    'Observación'
  ]);
  
  headerRow.eachCell((cell) => {
    cell.font = { bold: true, color: { argb: 'FFFFFFFF' } };
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF0284C7' } };
    cell.alignment = { horizontal: 'center', vertical: 'middle' };
  });

  const renglonesOrdenados = [...renglones].sort((a, b) => {
    const incisoA = (a.inciso || '').localeCompare(b.inciso || '');
    if (incisoA !== 0) return incisoA;
    const ppA = (a.partida_principal || '').localeCompare(b.partida_principal || '');
    if (ppA !== 0) return ppA;
    return (a.partida_parcial || '').localeCompare(b.partida_parcial || '');
  });

  let granTotal = 0;

  renglonesOrdenados.forEach((item) => {
    const cant = parseInt(item.cantidad, 10) || 1;
    const precio = formatCurrency(item.precio_unitario);
    const subtotal = cant * precio;
    granTotal += subtotal;

    const row = worksheet.addRow([
      item.inciso || 'N/A',
      item.partida_principal || 'N/A',
      item.partida_parcial || 'N/A',
      item.bien_descripcion || item.descripcion,
      item.trimestre || '1ER TRIMESTRE',
      cant,
      precio,
      subtotal,
      item.observacion || ''
    ]);

    row.getCell(6).alignment = { horizontal: 'center' };
    row.getCell(7).numFmt = '$#,##0.00';
    row.getCell(8).numFmt = '$#,##0.00';
  });

  worksheet.addRow([]);
  const filaTotal = worksheet.addRow(['', '', '', '', '', '', 'TOTAL GENERAL:', granTotal, '']);
  filaTotal.getCell(7).font = { bold: true, size: 11 };
  filaTotal.getCell(8).font = { bold: true, size: 12, color: { argb: 'FFFFFFFF' } };
  filaTotal.getCell(8).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF0369A1' } }; // Fondo destacado
  filaTotal.getCell(8).numFmt = '$#,##0.00';

  worksheet.columns = [
    { width: 22 }, { width: 25 }, { width: 28 }, { width: 35 },
    { width: 16 }, { width: 10 }, { width: 16 }, { width: 18 }, { width: 30 }
  ];

  res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
  res.setHeader('Content-Disposition', `attachment; filename="Solicitud_${solicitud.id}.xlsx"`);
  await workbook.xlsx.write(res);
  res.end();
};

/**
 * 2. Genera el Excel CONSOLIDADO con separadores claros entre solicitudes y Autorizado por
 */
export const generarExcelConsolidado = async (res, solicitudesConDetalle) => {
  const workbook = new ExcelJS.Workbook();
  workbook.creator = 'Sistema TUPI - UNNE';

  const worksheet = workbook.addWorksheet('Plan Anual Consolidado');

  worksheet.mergeCells('A1:L1');
  const titleCell = worksheet.getCell('A1');
  titleCell.value = 'REPORTE CONSOLIDADO DE SOLICITUDES - PLAN ANUAL DE COMPRAS UNNE';
  titleCell.font = { name: 'Arial', size: 14, bold: true, color: { argb: 'FFFFFFFF' } };
  titleCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF0F172A' } };
  titleCell.alignment = { horizontal: 'center', vertical: 'middle' };
  worksheet.getRow(1).height = 30;

  const headerRow = worksheet.addRow([
    'ID Sol.',
    'Fecha',
    'Área Origen',
    'Autorizado por',
    'Inciso',
    'Partida Principal',
    'Partida Parcial',
    'Bien / Descripción',
    'Trimestre',
    'Cant.',
    'Precio Unit. ($)',
    'Subtotal ($)'
  ]);

  headerRow.eachCell((cell) => {
    cell.font = { bold: true, color: { argb: 'FFFFFFFF' } };
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF0284C7' } };
    cell.alignment = { horizontal: 'center', vertical: 'middle' };
  });

  let granTotalGeneral = 0;

  solicitudesConDetalle.forEach(({ solicitud, renglones }, index) => {
    const autorizante = solicitud.admin_nombre ? `${solicitud.admin_nombre} ${solicitud.admin_apellido}` : 'Pendiente';
    
    // Ordenar renglones por partida
    const renglonesOrdenados = [...renglones].sort((a, b) => {
      const incA = (a.inciso || '').localeCompare(b.inciso || '');
      if (incA !== 0) return incA;
      const ppA = (a.partida_principal || '').localeCompare(b.partida_principal || '');
      if (ppA !== 0) return ppA;
      return (a.partida_parcial || '').localeCompare(b.partida_parcial || '');
    });

    renglonesOrdenados.forEach((r) => {
      const cant = parseInt(r.cantidad, 10) || 1;
      const precio = formatCurrency(r.precio_unitario);
      const subtotal = cant * precio;
      granTotalGeneral += subtotal;

      const row = worksheet.addRow([
        solicitud.id,
        solicitud.fecha_creacion ? new Date(solicitud.fecha_creacion).toLocaleDateString('es-AR') : '',
        solicitud.area_nombre || 'Sin Área',
        autorizante,
        r.inciso || 'N/A',
        r.partida_principal || 'N/A',
        r.partida_parcial || 'N/A',
        r.bien_descripcion || r.descripcion,
        r.trimestre || '1ER TRIMESTRE',
        cant,
        precio,
        subtotal
      ]);

      row.getCell(10).alignment = { horizontal: 'center' };
      row.getCell(11).numFmt = '$#,##0.00';
      row.getCell(12).numFmt = '$#,##0.00';
    });

    // 🎯 Línea divisoria o fila de separación sutil al terminar cada solicitud individual en el masivo
    if (index < solicitudesConDetalle.length - 1) {
      const separatorRow = worksheet.addRow([`--- Fin Solicitud #${solicitud.id} ---`]);
      worksheet.mergeCells(`A${separatorRow.number}:L${separatorRow.number}`);
      separatorRow.getCell(1).font = { italic: true, size: 9, color: { argb: 'FF64748B' } };
      separatorRow.getCell(1).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF1F5F9' } };
      separatorRow.getCell(1).alignment = { horizontal: 'center' };
    }
  });

  worksheet.addRow([]);
  const filaTotal = worksheet.addRow(['', '', '', '', '', '', '', '', '', '', 'TOTAL GENERAL:', granTotalGeneral]);
  filaTotal.getCell(11).font = { bold: true, size: 11 };
  filaTotal.getCell(12).font = { bold: true, size: 12, color: { argb: 'FFFFFFFF' } };
  filaTotal.getCell(12).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF0369A1' } }; // Destacado institucional
  filaTotal.getCell(12).numFmt = '$#,##0.00';

  worksheet.columns = [
    { width: 10 }, { width: 12 }, { width: 25 }, { width: 22 },
    { width: 20 }, { width: 22 }, { width: 25 }, { width: 35 },
    { width: 16 }, { width: 10 }, { width: 16 }, { width: 18 }
  ];

  res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
  res.setHeader('Content-Disposition', 'attachment; filename="Plan_Anual_Compras_Consolidado.xlsx"');
  await workbook.xlsx.write(res);
  res.end();
};