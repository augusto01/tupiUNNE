import ExcelJS from 'exceljs';

const formatCurrency = (val) => parseFloat(val || 0);

/**
 * 1. Genera el Excel de una SOLA solicitud con subtotales por rubro y formato completo
 */
export const generarExcelSolicitud = async (res, solicitud, renglones) => {
  const workbook = new ExcelJS.Workbook();
  workbook.creator = 'Sistema TUPI - UNNE';
  
  const worksheet = workbook.addWorksheet(`Solicitud #${solicitud.id}`);

  // Título Principal
  worksheet.mergeCells('A1:J1');
  const titleCell = worksheet.getCell('A1');
  titleCell.value = 'UNIVERSIDAD NACIONAL DEL NORDESTE - PLAN ANUAL DE COMPRAS';
  titleCell.font = { name: 'Arial', size: 14, bold: true, color: { argb: 'FFFFFFFF' } };
  titleCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF0F172A' } };
  titleCell.alignment = { horizontal: 'center', vertical: 'middle' };
  worksheet.getRow(1).height = 30;

  worksheet.addRow([]);

  // Bloque de metadatos con fondo amarillo institucional extendido de A hasta J
  const r1 = worksheet.addRow(['N° Solicitud:', solicitud.id, '', '', 'Fecha Emisión:', solicitud.fecha_creacion ? new Date(solicitud.fecha_creacion).toLocaleDateString('es-AR') : 'N/A', '', '', '', '']);
  const r2 = worksheet.addRow(['Solicitante:', `${solicitud.usuario_nombre || ''} ${solicitud.usuario_apellido || ''}`, '', '', 'Convocatoria:', solicitud.nro_convocatoria || 'CDC:2026/01', '', '', '', '']);
  const r3 = worksheet.addRow(['Área Origen:', solicitud.area_nombre || 'Sin Área Asignada', '', '', 'UOC / Dependencia:', solicitud.dependencia_nombre || 'Rectorado', '', '', '', '']);
  const r4 = worksheet.addRow(['Autorizado por:', solicitud.admin_nombre ? `${solicitud.admin_nombre} ${solicitud.admin_apellido}` : 'Pendiente / Sistema', '', '', 'Estado:', solicitud.estado, '', '', '', '']);

  [r1, r2, r3, r4].forEach((row) => {
    row.getCell(1).font = { bold: true };
    row.getCell(5).font = { bold: true };
    // Asegurar fondo amarillo desde col A hasta J
    for (let col = 1; col <= 10; col++) {
      row.getCell(col).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFEF08A' } };
    }
  });

  worksheet.addRow([]);

  const headerRow = worksheet.addRow([
    'Rubro', 'Inciso', 'Partida Principal', 'Partida Parcial',
    'Bien / Descripción', 'Trimestre', 'Cantidad', 'Precio Unit. ($)', 'Subtotal ($)', 'Observación'
  ]);
  
  headerRow.eachCell((cell) => {
    cell.font = { bold: true, color: { argb: 'FFFFFFFF' } };
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF0284C7' } };
    cell.alignment = { horizontal: 'center', vertical: 'middle' };
  });

  worksheet.autoFilter = `A${headerRow.number}:J${headerRow.number}`;

  const renglonesOrdenados = [...renglones].sort((a, b) => {
    const rubroA = (a.rubro_nombre || a.rubro || 'SIN RUBRO').localeCompare(b.rubro_nombre || b.rubro || 'SIN RUBRO');
    if (rubroA !== 0) return rubroA;
    const incisoA = (a.inciso || '').localeCompare(b.inciso || '');
    if (incisoA !== 0) return incisoA;
    const ppA = (a.partida_principal || '').localeCompare(b.partida_principal || '');
    if (ppA !== 0) return ppA;
    return (a.partida_parcial || '').localeCompare(b.partida_parcial || '');
  });

  let granTotal = 0;
  let rubroActual = null;
  let subtotalRubro = 0;

  const insertarSubtotalRubro = (nombreRubro, montoSubtotal) => {
    const subRow = worksheet.addRow(['', '', '', `SUBTOTAL ${nombreRubro}:`, '', '', '', '', montoSubtotal, '']);
    worksheet.mergeCells(`D${subRow.number}:H${subRow.number}`);
    
    subRow.getCell(4).font = { bold: true, color: { argb: 'FF0369A1' } };
    subRow.getCell(4).alignment = { horizontal: 'right' };
    subRow.getCell(9).font = { bold: true, color: { argb: 'FF0369A1' } };
    subRow.getCell(9).numFmt = '$#,##0.00';
    
    subRow.eachCell((cell) => {
      cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFE0F2FE' } };
    });
    worksheet.addRow();
  };

  renglonesOrdenados.forEach((item, index) => {
    const nombreRubro = item.rubro_nombre || item.rubro || 'SIN RUBRO';
    const cant = parseInt(item.cantidad, 10) || 1;
    const precio = formatCurrency(item.precio_unitario);
    const subtotal = cant * precio;

    if (rubroActual !== null && rubroActual !== nombreRubro) {
      insertarSubtotalRubro(rubroActual, subtotalRubro);
      subtotalRubro = 0;
    }

    rubroActual = nombreRubro;
    subtotalRubro += subtotal;
    granTotal += subtotal;

    const row = worksheet.addRow([
      nombreRubro,
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

    row.getCell(7).alignment = { horizontal: 'center' };
    row.getCell(8).numFmt = '$#,##0.00';
    row.getCell(9).numFmt = '$#,##0.00';

    if (index === renglonesOrdenados.length - 1) {
      insertarSubtotalRubro(rubroActual, subtotalRubro);
    }
  });

  worksheet.addRow([]);
  const filaTotal = worksheet.addRow(['', '', '', '', '', '', '', 'TOTAL GENERAL:', granTotal, '']);
  filaTotal.getCell(8).font = { bold: true, size: 11 };
  filaTotal.getCell(9).font = { bold: true, size: 12, color: { argb: 'FFFFFFFF' } };
  filaTotal.getCell(9).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF0369A1' } };
  filaTotal.getCell(9).numFmt = '$#,##0.00';

  worksheet.columns = [
    { width: 25 }, { width: 22 }, { width: 25 }, { width: 28 }, { width: 35 },
    { width: 16 }, { width: 10 }, { width: 16 }, { width: 18 }, { width: 30 }
  ];

  res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
  res.setHeader('Content-Disposition', `attachment; filename="Solicitud_${solicitud.id}.xlsx"`);
  await workbook.xlsx.write(res);
  res.end();
};

/**
 * 2. Genera el Excel CONSOLIDADO con Panel de Filtros Superior y Encabezados Amarillos Completos (A-J)
 */
export const generarExcelConsolidado = async (res, solicitudesConDetalle, tituloReporte = 'REPORTE CONSOLIDADO - PLAN ANUAL DE COMPRAS') => {
  const workbook = new ExcelJS.Workbook();
  workbook.creator = 'Sistema TUPI - UNNE';

  const worksheet = workbook.addWorksheet('Plan Anual Consolidado');

  // Título Principal Global
  worksheet.mergeCells('A1:J1');
  const titleCell = worksheet.getCell('A1');
  titleCell.value = tituloReporte.toUpperCase();
  titleCell.font = { name: 'Arial', size: 14, bold: true, color: { argb: 'FFFFFFFF' } };
  titleCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF0F172A' } };
  titleCell.alignment = { horizontal: 'center', vertical: 'middle' };
  worksheet.getRow(1).height = 30;

  worksheet.addRow([]);

  // 🎛️ PANEL DE FILTROS Y SELECCIÓN SUPERIOR CON DROPDOWNS
  const panelTitle = worksheet.addRow(['PANEL DE FILTRADO RÁPIDO Y SELECCIÓN']);
  worksheet.mergeCells(`A${panelTitle.number}:J${panelTitle.number}`);
  panelTitle.getCell(1).font = { bold: true, size: 11, color: { argb: 'FFFFFFFF' } };
  panelTitle.getCell(1).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF334155' } };
  panelTitle.getCell(1).alignment = { horizontal: 'center', vertical: 'middle' };

  // Extraer listas únicas para los dropdowns
  const listaSolicitudes = [...new Set(solicitudesConDetalle.map(s => String(s.solicitud.id)))].join(',');
  const listaAreas = [...new Set(solicitudesConDetalle.map(s => s.solicitud.area_nombre || 'Sin Área'))].join(',');
  const listaAutorizantes = [...new Set(solicitudesConDetalle.map(s => s.solicitud.admin_nombre ? `${s.solicitud.admin_nombre} ${s.solicitud.admin_apellido}` : 'Sistema'))].join(',');

  const f1 = worksheet.addRow(['Filtrar N° Solicitud:', '', 'Filtrar Área:', '', 'Filtrar Autorizado por:', '', '', '', '', '']);
  const f2 = worksheet.addRow(['[Seleccione o escriba]', '', '[Seleccione o escriba]', '', '[Seleccione o escriba]', '', '', '', '', '']);

  [f1, f2].forEach((row) => {
    for (let c = 1; c <= 10; c++) {
      row.getCell(c).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF8FAFC' } };
      row.getCell(c).border = { top: { style: 'thin', color: { argb: 'FFCBD5E1' } }, bottom: { style: 'thin', color: { argb: 'FFCBD5E1' } } };
    }
  });

  // Aplicar validaciones de datos (Dropdowns) en las celdas de selección superior
  worksheet.dataValidations.add('B3', {
    type: 'list',
    allowBlank: true,
    formulae: [`"${listaSolicitudes}"`]
  });

  worksheet.dataValidations.add('D3', {
    type: 'list',
    allowBlank: true,
    formulae: [`"${listaAreas}"`]
  });

  worksheet.dataValidations.add('F3', {
    type: 'list',
    allowBlank: true,
    formulae: [`"${listaAutorizantes}"`]
  });

  worksheet.addRow([]);
  worksheet.addRow([]);

  let granTotalGeneral = 0;

  solicitudesConDetalle.forEach(({ solicitud, renglones }, solIndex) => {
    // 📋 Bloque de Encabezado en Amarillo Claro extendido de la columna A hasta la J
    const r1 = worksheet.addRow(['N° Solicitud:', solicitud.id, '', '', 'Fecha Emisión:', solicitud.fecha_creacion ? new Date(solicitud.fecha_creacion).toLocaleDateString('es-AR') : 'N/A', '', '', '', '']);
    const r2 = worksheet.addRow(['Solicitante:', `${solicitud.usuario_nombre || ''} ${solicitud.usuario_apellido || ''}`, '', '', 'Convocatoria:', solicitud.nro_convocatoria || 'CDC:2026/01', '', '', '', '']);
    const r3 = worksheet.addRow(['Área Origen:', solicitud.area_nombre || 'Sin Área Asignada', '', '', 'UOC / Dependencia:', solicitud.dependencia_nombre || 'Rectorado', '', '', '', '']);
    const r4 = worksheet.addRow(['Autorizado por:', solicitud.admin_nombre ? `${solicitud.admin_nombre} ${solicitud.admin_apellido}` : 'Pendiente / Sistema', '', '', 'Estado:', solicitud.estado, '', '', '', '']);

    [r1, r2, r3, r4].forEach((row) => {
      row.getCell(1).font = { bold: true };
      row.getCell(5).font = { bold: true };
      // Rellenar de amarillo toda la fila desde la columna 1 (A) hasta la 10 (J)
      for (let col = 1; col <= 10; col++) {
        row.getCell(col).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFEF08A' } };
      }
    });

    worksheet.addRow([]);

    // Cabecera de la tabla de renglones
    const headerRow = worksheet.addRow([
      'Rubro', 'Inciso', 'Partida Principal', 'Partida Parcial',
      'Bien / Descripción', 'Trimestre', 'Cantidad', 'Precio Unit. ($)', 'Subtotal ($)', 'Observación'
    ]);
    
    headerRow.eachCell((cell) => {
      cell.font = { bold: true, color: { argb: 'FFFFFFFF' } };
      cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF0284C7' } };
      cell.alignment = { horizontal: 'center', vertical: 'middle' };
    });

    // 🎯 Habilitar los filtros desplegables automáticos (Dropdowns) de Excel
    worksheet.autoFilter = `A${headerRow.number}:J${headerRow.number}`;

    const renglonesOrdenados = [...renglones].sort((a, b) => {
      const rubroA = (a.rubro_nombre || a.rubro || 'SIN RUBRO').localeCompare(b.rubro_nombre || b.rubro || 'SIN RUBRO');
      if (rubroA !== 0) return rubroA;
      const incisoA = (a.inciso || '').localeCompare(b.inciso || '');
      if (incisoA !== 0) return incisoA;
      const ppA = (a.partida_principal || '').localeCompare(b.partida_principal || '');
      if (ppA !== 0) return ppA;
      return (a.partida_parcial || '').localeCompare(b.partida_parcial || '');
    });

    let rubroActual = null;
    let subtotalRubro = 0;
    let totalSolicitud = 0;

    const insertarSubtotalRubroConsolidado = (nombreRubro, montoSubtotal) => {
      const subRow = worksheet.addRow(['', '', '', `SUBTOTAL ${nombreRubro}:`, '', '', '', '', montoSubtotal, '']);
      worksheet.mergeCells(`D${subRow.number}:H${subRow.number}`);
      
      subRow.getCell(4).font = { bold: true, color: { argb: 'FF0369A1' } };
      subRow.getCell(4).alignment = { horizontal: 'right' };
      subRow.getCell(9).font = { bold: true, color: { argb: 'FF0369A1' } };
      subRow.getCell(9).numFmt = '$#,##0.00';
      
      subRow.eachCell((cell) => {
        cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFE0F2FE' } };
      });
      worksheet.addRow();
    };

    renglonesOrdenados.forEach((item, index) => {
      const nombreRubro = item.rubro_nombre || item.rubro || 'SIN RUBRO';
      const cant = parseInt(item.cantidad, 10) || 1;
      const precio = formatCurrency(item.precio_unitario);
      const subtotal = cant * precio;

      if (rubroActual !== null && rubroActual !== nombreRubro) {
        insertarSubtotalRubroConsolidado(rubroActual, subtotalRubro);
        subtotalRubro = 0;
      }

      rubroActual = nombreRubro;
      subtotalRubro += subtotal;
      totalSolicitud += subtotal;
      granTotalGeneral += subtotal;

      const row = worksheet.addRow([
        nombreRubro,
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

      row.getCell(7).alignment = { horizontal: 'center' };
      row.getCell(8).numFmt = '$#,##0.00';
      row.getCell(9).numFmt = '$#,##0.00';

      if (index === renglonesOrdenados.length - 1) {
        insertarSubtotalRubroConsolidado(rubroActual, subtotalRubro);
      }
    });

    // 💵 Total General de esta Solicitud Individual
    const filaTotalSol = worksheet.addRow(['', '', '', '', '', '', '', `TOTAL SOLICITUD #${solicitud.id}:`, totalSolicitud, '']);
    filaTotalSol.getCell(8).font = { bold: true, size: 10 };
    filaTotalSol.getCell(9).font = { bold: true, size: 11, color: { argb: 'FFFFFFFF' } };
    filaTotalSol.getCell(9).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF0284C7' } };
    filaTotalSol.getCell(9).numFmt = '$#,##0.00';

    // 🎨 Franja / Separador visual entre solicitud y solicitud
    if (solIndex < solicitudesConDetalle.length - 1) {
      worksheet.addRow([]);
      const separatorRow = worksheet.addRow([`--- FIN DE SOLICITUD #${solicitud.id} ---`]);
      worksheet.mergeCells(`A${separatorRow.number}:J${separatorRow.number}`);
      separatorRow.getCell(1).font = { italic: true, bold: true, size: 9, color: { argb: 'FF475569' } };
      separatorRow.getCell(1).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF1F5F9' } };
      separatorRow.getCell(1).alignment = { horizontal: 'center' };
    }
  });

  worksheet.addRow([]);
  worksheet.addRow([]);

  // 💰 Gran Total General de todo el reporte
  const filaGranTotal = worksheet.addRow(['', '', '', '', '', '', '', 'GRAN TOTAL GENERAL:', granTotalGeneral, '']);
  filaGranTotal.getCell(8).font = { bold: true, size: 11 };
  filaGranTotal.getCell(9).font = { bold: true, size: 12, color: { argb: 'FFFFFFFF' } };
  filaGranTotal.getCell(9).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF0369A1' } };
  filaGranTotal.getCell(9).numFmt = '$#,##0.00';

  worksheet.columns = [
    { width: 25 }, { width: 22 }, { width: 25 }, { width: 28 }, { width: 35 },
    { width: 16 }, { width: 10 }, { width: 16 }, { width: 18 }, { width: 30 }
  ];

  res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
  res.setHeader('Content-Disposition', `attachment; filename="Plan_Anual_Compras_Consolidado.xlsx"`);
  await workbook.xlsx.write(res);
  res.end();
};