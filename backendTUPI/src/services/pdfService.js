import PDFDocument from 'pdfkit';
import fs from 'fs';
import path from 'path';

// Helper para ubicar el logo de la UNNE
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

/**
 * 1. Genera PDF individual de comprobante de Solicitud con Rubro en columna independiente y holgura vertical
 */
export const generarPDFSolicitud = (res, solicitud, renglones) => {
  const doc = new PDFDocument({ margin: 30, size: 'A4' });

  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader('Content-Disposition', `inline; filename="Solicitud_Autorizada_${solicitud.id}.pdf"`);
  doc.pipe(res);

  const rutaLogo = obtenerRutaLogo();
  if (rutaLogo) {
    try {
      doc.image(rutaLogo, 255, 20, { width: 75 });
      doc.y = 105;
    } catch (e) {
      doc.y = 40;
    }
  } else {
    doc.y = 40;
  }

  // Encabezado Institucional
  doc.fillColor('#0f172a').fontSize(13).font('Helvetica-Bold').text('UNIVERSIDAD NACIONAL DEL NORDESTE', { align: 'center' });
  doc.fontSize(10).fillColor('#0284c7').text('COMPROBANTE OFICIAL DE SOLICITUD DE COMPRAS', { align: 'center' });
  doc.moveDown(0.6);

  const autorizanteTexto = solicitud.admin_nombre ? `${solicitud.admin_nombre} ${solicitud.admin_apellido}` : 'Pendiente / Sistema';
  const metaY = doc.y;
  
  doc.rect(30, metaY, 535, 80).fillAndStroke('#f8fafc', '#cbd5e1');

  doc.fillColor('#0f172a').fontSize(8.5).font('Helvetica-Bold');
  doc.text(`N° Solicitud: #${solicitud.id}`, 40, metaY + 10);
  doc.font('Helvetica').text(`Solicitante: ${solicitud.usuario_nombre || ''} ${solicitud.usuario_apellido || ''}`, 40, metaY + 23);
  doc.text(`Área Origen: ${solicitud.area_nombre || 'Sin Área Asignada'}`, 40, metaY + 36);
  doc.text(`UOC / Dependencia: ${solicitud.dependencia_nombre || 'Rectorado UNNE'}`, 40, metaY + 49);
  doc.text(`Autorizado por: ${autorizanteTexto}`, 40, metaY + 62);

  doc.text(`Fecha: ${solicitud.fecha_creacion ? new Date(solicitud.fecha_creacion).toLocaleDateString('es-AR') : 'N/A'}`, 320, metaY + 10);
  doc.text(`Convocatoria: ${solicitud.nro_convocatoria || 'CDC:2026/01'}`, 320, metaY + 23);
  doc.text(`Estado: ${solicitud.estado}`, 320, metaY + 36);
  if (solicitud.observaciones) {
    doc.text(`Obs: ${solicitud.observaciones}`, 320, metaY + 49, { width: 230 });
  }

  doc.y = metaY + 95;

  let currentY = doc.y;
  
  // Cabecera de la tabla con columnas independientes
  doc.rect(30, currentY, 535, 20).fillAndStroke('#0284c7', '#0284c7');
  doc.fillColor('#ffffff').fontSize(7.5).font('Helvetica-Bold');
  doc.text('Rubro', 35, currentY + 6);
  doc.text('Bien / Descripción', 125, currentY + 6);
  doc.text('Trimestre', 275, currentY + 6);
  doc.text('Cant.', 345, currentY + 6);
  doc.text('Precio Unit.', 385, currentY + 6);
  doc.text('Subtotal', 485, currentY + 6);

  currentY += 20;

  const renglonesOrdenados = [...renglones].sort((a, b) => {
    const rubroA = (a.rubro_nombre || a.rubro || 'SIN RUBRO').localeCompare(b.rubro_nombre || b.rubro || 'SIN RUBRO');
    if (rubroA !== 0) return rubroA;
    return (a.bien_descripcion || a.descripcion || '').localeCompare(b.bien_descripcion || b.descripcion || '');
  });

  let montoTotalGlobal = 0;
  let rubroActual = null;
  let subtotalRubro = 0;

  const dibujarSubtotalRubro = (nombreRubro, monto) => {
    if (currentY + 18 > 730) {
      doc.addPage();
      currentY = 40;
    }
    doc.rect(30, currentY, 535, 16).fillAndStroke('#e0f2fe', '#cbd5e1');
    doc.fillColor('#0369a1').fontSize(8).font('Helvetica-Bold');
    doc.text(`SUBTOTAL ${nombreRubro.toUpperCase()}:`, 40, currentY + 4);
    doc.text(`$${monto.toLocaleString('es-AR', { minimumFractionDigits: 2 })}`, 470, currentY + 4, { align: 'right', width: 90 });
    currentY += 16;
  };

  renglonesOrdenados.forEach((r) => {
    const nombreRubro = r.rubro_nombre || r.rubro || 'SIN RUBRO';
    const descText = r.bien_descripcion || r.descripcion || '';
    const cantidad = parseInt(r.cantidad, 10) || 1;
    const precio = parseFloat(r.precio_unitario) || 0;
    const subtotal = cantidad * precio;

    if (rubroActual !== null && rubroActual !== nombreRubro) {
      dibujarSubtotalRubro(rubroActual, subtotalRubro);
      subtotalRubro = 0;
    }

    rubroActual = nombreRubro;
    subtotalRubro += subtotal;
    montoTotalGlobal += subtotal;

    const heightDesc = doc.heightOfString(descText, { width: 145 });
    const heightRubro = doc.heightOfString(nombreRubro, { width: 80 });
    const rowHeight = Math.max(heightDesc, heightRubro) + 16; // Margen superior e inferior amplio para evitar solapamientos

    if (currentY + rowHeight > 730) {
      doc.addPage();
      currentY = 40;
    }

    // Dibujar celdas con bordes limpios
    doc.rect(30, currentY, 90, rowHeight).stroke('#cbd5e1');  // Rubro
    doc.rect(120, currentY, 155, rowHeight).stroke('#cbd5e1'); // Descripción
    doc.rect(275, currentY, 70, rowHeight).stroke('#cbd5e1');  // Trimestre
    doc.rect(345, currentY, 35, rowHeight).stroke('#cbd5e1');  // Cantidad
    doc.rect(380, currentY, 90, rowHeight).stroke('#cbd5e1');  // Precio Unit.
    doc.rect(470, currentY, 95, rowHeight).stroke('#cbd5e1');  // Subtotal

    doc.font('Helvetica').fontSize(8).fillColor('#334155');
    const textY = currentY + 8; // Posición Y con holgura para que no toque los bordes

    doc.font('Helvetica-Bold').fontSize(7.5).fillColor('#0284c7').text(nombreRubro, 35, textY, { width: 80 });
    doc.font('Helvetica').fontSize(8).fillColor('#334155').text(descText, 125, textY, { width: 145 });
    doc.text(r.trimestre || '1ER TRIMESTRE', 280, textY, { width: 60, align: 'center' });
    doc.text(cantidad.toString(), 348, textY, { width: 30, align: 'center' });
    doc.text(`$${precio.toLocaleString('es-AR', { minimumFractionDigits: 2 })}`, 385, textY, { width: 80, align: 'right' });
    doc.text(`$${subtotal.toLocaleString('es-AR', { minimumFractionDigits: 2 })}`, 475, textY, { width: 85, align: 'right' });

    currentY += rowHeight;
  });

  if (rubroActual) {
    dibujarSubtotalRubro(rubroActual, subtotalRubro);
  }

  // 🎯 CAJA DE MONTO TOTAL AL PIE DE LA TABLA
  currentY += 8;
  if (currentY > 740) {
    doc.addPage();
    currentY = 40;
  }

  doc.rect(350, currentY, 215, 24).fillAndStroke('#0f172a', '#0f172a');
  doc.fillColor('#ffffff').fontSize(9).font('Helvetica-Bold');
  doc.text('MONTO TOTAL ESTIMADO:', 360, currentY + 8);
  doc.text(`$${montoTotalGlobal.toLocaleString('es-AR', { minimumFractionDigits: 2 })}`, 460, currentY + 8, { align: 'right', width: 95 });

  doc.end();
};

/**
 * 2. Genera PDF CONSOLIDADO asegurando que cada solicitud comience en una página nueva
 */
export const generarPDFConsolidado = (res, solicitudesConDetalle) => {
  const doc = new PDFDocument({ margin: 30, size: 'A4' });

  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader('Content-Disposition', 'inline; filename="Plan_Anual_Consolidado.pdf"');
  doc.pipe(res);

  const rutaLogo = obtenerRutaLogo();
  let granTotalGeneral = 0;

  solicitudesConDetalle.forEach(({ solicitud, renglones }, index) => {
    // 🎯 Forzar una página nueva para cada solicitud (excepto la primera)
    if (index > 0) {
      doc.addPage();
    }

    // Cabecera institucional en cada página de solicitud
    if (rutaLogo) {
      try {
        doc.image(rutaLogo, 255, 20, { width: 70 });
        doc.y = 95;
      } catch (e) {
        doc.y = 40;
      }
    } else {
      doc.y = 40;
    }

    doc.fillColor('#0f172a').fontSize(13).font('Helvetica-Bold').text('UNIVERSIDAD NACIONAL DEL NORDESTE', { align: 'center' });
    doc.fontSize(10).fillColor('#0284c7').text('REPORTE CONSOLIDADO DEL PLAN ANUAL DE COMPRAS', { align: 'center' });
    doc.moveDown(0.8);

    let currentY = doc.y;
    const autorizante = solicitud.admin_nombre ? `${solicitud.admin_nombre} ${solicitud.admin_apellido}` : 'Pendiente';

    doc.fontSize(9).fillColor('#0f172a').font('Helvetica-Bold')
       .text(`Solicitud #${solicitud.id} - Área: ${solicitud.area_nombre || 'General'} (${solicitud.dependencia_nombre || 'UNNE'})`, 30, currentY);
    
    currentY += 13;
    doc.fontSize(7.5).fillColor('#475569').font('Helvetica')
       .text(`Solicitante: ${solicitud.usuario_nombre || ''} ${solicitud.usuario_apellido || ''} | Autorizado por: ${autorizante} | Convocatoria: ${solicitud.nro_convocatoria || ''}`, 30, currentY);
    
    currentY += 14;

    // Cabecera de la tabla con columna de Rubro separada
    doc.rect(30, currentY, 535, 16).fillAndStroke('#0284c7', '#0284c7');
    doc.fillColor('#ffffff').fontSize(7.5).font('Helvetica-Bold');
    doc.text('Rubro', 35, currentY + 4);
    doc.text('Bien / Descripción', 125, currentY + 4);
    doc.text('Trimestre', 275, currentY + 4);
    doc.text('Cant.', 345, currentY + 4);
    doc.text('Precio Unit.', 380, currentY + 4);
    doc.text('Subtotal', 485, currentY + 4);

    currentY += 16;

    const renglonesOrdenados = [...renglones].sort((a, b) => {
      const rubroA = (a.rubro_nombre || a.rubro || 'SIN RUBRO').localeCompare(b.rubro_nombre || b.rubro || 'SIN RUBRO');
      if (rubroA !== 0) return rubroA;
      return (a.bien_descripcion || a.descripcion || '').localeCompare(b.bien_descripcion || b.descripcion || '');
    });

    let subtotalSolicitud = 0;
    let rubroActual = null;
    let subtotalRubro = 0;

    const dibujarSubtotalRubroConsolidado = (nombreRubro, monto) => {
      if (currentY + 16 > 740) {
        doc.addPage();
        currentY = 40;
      }
      doc.rect(30, currentY, 535, 14).fillAndStroke('#e0f2fe', '#cbd5e1');
      doc.fillColor('#0369a1').fontSize(7.5).font('Helvetica-Bold');
      doc.text(`SUBTOTAL ${nombreRubro.toUpperCase()}:`, 40, currentY + 3);
      doc.text(`$${monto.toLocaleString('es-AR', { minimumFractionDigits: 2 })}`, 470, currentY + 3, { align: 'right', width: 90 });
      currentY += 14;
    };

    renglonesOrdenados.forEach((r) => {
      const nombreRubro = r.rubro_nombre || r.rubro || 'SIN RUBRO';
      const descText = r.bien_descripcion || r.descripcion || '';
      
      if (rubroActual !== null && rubroActual !== nombreRubro) {
        dibujarSubtotalRubroConsolidado(rubroActual, subtotalRubro);
        subtotalRubro = 0;
      }

      rubroActual = nombreRubro;
      const cantidad = parseInt(r.cantidad, 10) || 1;
      const precio = parseFloat(r.precio_unitario) || 0;
      const subtotal = cantidad * precio;
      subtotalRubro += subtotal;
      subtotalSolicitud += subtotal;
      granTotalGeneral += subtotal;

      const heightDesc = doc.heightOfString(descText, { width: 145 });
      const heightRubro = doc.heightOfString(nombreRubro, { width: 80 });
      const rowHeight = Math.max(heightDesc, heightRubro) + 14; // Margen superior e inferior holgado

      if (currentY + rowHeight > 740) {
        doc.addPage();
        currentY = 40;
      }

      // Dibujar bordes de celdas
      doc.rect(30, currentY, 90, rowHeight).stroke('#cbd5e1');
      doc.rect(120, currentY, 155, rowHeight).stroke('#cbd5e1');
      doc.rect(275, currentY, 70, rowHeight).stroke('#cbd5e1');
      doc.rect(345, currentY, 35, rowHeight).stroke('#cbd5e1');
      doc.rect(380, currentY, 90, rowHeight).stroke('#cbd5e1');
      doc.rect(470, currentY, 95, rowHeight).stroke('#cbd5e1');

      doc.font('Helvetica').fontSize(8).fillColor('#334155');
      const textY = currentY + 7;

      doc.font('Helvetica-Bold').fontSize(7).fillColor('#0284c7').text(nombreRubro, 35, textY, { width: 80 });
      doc.font('Helvetica').fontSize(7.5).fillColor('#334155').text(descText, 125, textY, { width: 145 });

      doc.text(r.trimestre || '1ER TRIMESTRE', 280, textY, { width: 60, align: 'center' });
      doc.text(cantidad.toString(), 348, textY, { width: 30, align: 'center' });
      doc.text(`$${precio.toLocaleString('es-AR', { minimumFractionDigits: 2 })}`, 385, textY, { width: 80, align: 'right' });
      doc.text(`$${subtotal.toLocaleString('es-AR', { minimumFractionDigits: 2 })}`, 475, textY, { width: 85, align: 'right' });

      currentY += rowHeight;
    });

    if (rubroActual) {
      dibujarSubtotalRubroConsolidado(rubroActual, subtotalRubro);
    }

    // Total parcial por solicitud
    currentY += 6;
    if (currentY > 730) {
      doc.addPage();
      currentY = 40;
    }

    doc.font('Helvetica-Bold').fontSize(8.5).fillColor('#0284c7');
    doc.text(`Subtotal Solicitud #${solicitud.id}: $${subtotalSolicitud.toLocaleString('es-AR', { minimumFractionDigits: 2 })}`, 380, currentY, { align: 'right', width: 185 });
  });

  // Gran Total Global al final del consolidado (en página nueva o al cierre)
  if (doc.y > 680) {
    doc.addPage();
  } else {
    doc.moveDown(2);
  }

  const finalY = doc.y + 15;
  doc.rect(320, finalY, 245, 25).fillAndStroke('#0f172a', '#0f172a');
  doc.fillColor('#ffffff').fontSize(9).font('Helvetica-Bold');
  doc.text('GRAN TOTAL CONSOLIDADO:', 330, finalY + 8);
  doc.text(`$${granTotalGeneral.toLocaleString('es-AR', { minimumFractionDigits: 2 })}`, 450, finalY + 8, { align: 'right', width: 110 });

  doc.end();
};