import ExcelJS from 'exceljs';

export const generarExcelSolicitud = async (res, sol, renglones) => {
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

  // Titulo
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

  // Encabezados de tabla
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

  // Fila Total
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
};