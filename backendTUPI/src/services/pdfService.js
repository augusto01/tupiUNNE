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
 * 1. Genera PDF individual de comprobante de Solicitud con Total al pie
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
  doc.rect(30, currentY, 535, 20).fill('#0284c7');
  doc.fillColor('#ffffff').fontSize(8).font('Helvetica-Bold');
  doc.text('Item', 35, currentY + 6);
  doc.text('Bien / Descripción', 65, currentY + 6);
  doc.text('Trimestre', 270, currentY + 6);
  doc.text('Cant.', 350, currentY + 6);
  doc.text('Precio Unit.', 395, currentY + 6);
  doc.text('Subtotal', 485, currentY + 6);

  currentY += 20;

  doc.font('Helvetica').fontSize(8).fillColor('#334155');
  let montoTotalGlobal = 0;

  renglones.forEach((r, i) => {
    if (currentY > 730) {
      doc.addPage();
      currentY = 40;
    }

    const cantidad = parseInt(r.cantidad, 10) || 1;
    const precio = parseFloat(r.precio_unitario) || 0;
    const subtotal = cantidad * precio;
    montoTotalGlobal += subtotal;

    doc.text((i + 1).toString(), 35, currentY + 5);
    doc.text(r.bien_descripcion || r.descripcion || '', 65, currentY + 5, { width: 195 });
    doc.text(r.trimestre || '1ER TRIMESTRE', 270, currentY + 5);
    doc.text(cantidad.toString(), 350, currentY + 5);
    doc.text(`$${precio.toLocaleString('es-AR', { minimumFractionDigits: 2 })}`, 395, currentY + 5);
    doc.text(`$${subtotal.toLocaleString('es-AR', { minimumFractionDigits: 2 })}`, 485, currentY + 5);

    currentY += 22;
    doc.moveTo(30, currentY).lineTo(565, currentY).stroke('#e2e8f0');
  });

  // 🎯 CAJA DE MONTO TOTAL AL PIE DE LA TABLA
  currentY += 5;
  if (currentY > 740) {
    doc.addPage();
    currentY = 40;
  }

  doc.rect(350, currentY, 215, 22).fillAndStroke('#f1f5f9', '#cbd5e1');
  doc.fillColor('#0f172a').fontSize(8.5).font('Helvetica-Bold');
  doc.text('Monto Total Estimado:', 360, currentY + 7);
  doc.fillColor('#0284c7').fontSize(9.5).text(`$${montoTotalGlobal.toLocaleString('es-AR', { minimumFractionDigits: 2 })}`, 460, currentY + 7, { align: 'right', width: 95 });

  doc.end();
};

/**
 * 2. Genera PDF CONSOLIDADO de todas las solicitudes con totales
 */
export const generarPDFConsolidado = (res, solicitudesConDetalle) => {
  const doc = new PDFDocument({ margin: 30, size: 'A4' });

  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader('Content-Disposition', 'inline; filename="Plan_Anual_Consolidado.pdf"');
  doc.pipe(res);

  const rutaLogo = obtenerRutaLogo();
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
  doc.moveDown(1);

  let currentY = doc.y;
  let granTotalGeneral = 0;

  solicitudesConDetalle.forEach(({ solicitud, renglones }) => {
    if (currentY > 680) {
      doc.addPage();
      currentY = 40;
    }

    const autorizante = solicitud.admin_nombre ? `${solicitud.admin_nombre} ${solicitud.admin_apellido}` : 'Pendiente';

    doc.fontSize(9).fillColor('#0f172a').font('Helvetica-Bold')
       .text(`Solicitud #${solicitud.id} - Área: ${solicitud.area_nombre || 'General'} (${solicitud.dependencia_nombre || 'UNNE'})`, 30, currentY);
    
    currentY += 13;
    doc.fontSize(7.5).fillColor('#475569').font('Helvetica')
       .text(`Solicitante: ${solicitud.usuario_nombre || ''} ${solicitud.usuario_apellido || ''} | Autorizado por: ${autorizante} | Convocatoria: ${solicitud.nro_convocatoria || ''}`, 30, currentY);
    
    currentY += 11;

    doc.rect(30, currentY, 535, 16).fill('#0284c7');
    doc.fillColor('#ffffff').fontSize(8).font('Helvetica-Bold');
    doc.text('Bien / Descripción', 35, currentY + 4);
    doc.text('Trimestre', 270, currentY + 4);
    doc.text('Cant.', 350, currentY + 4);
    doc.text('Precio Unit.', 395, currentY + 4);
    doc.text('Subtotal', 485, currentY + 4);

    currentY += 16;
    doc.font('Helvetica').fontSize(8).fillColor('#334155');

    let subtotalSolicitud = 0;

    renglones.forEach((r) => {
      if (currentY > 740) {
        doc.addPage();
        currentY = 40;
      }

      const cantidad = parseInt(r.cantidad, 10) || 1;
      const precio = parseFloat(r.precio_unitario) || 0;
      const subtotal = cantidad * precio;
      subtotalSolicitud += subtotal;
      granTotalGeneral += subtotal;

      doc.text(r.bien_descripcion || r.descripcion || '', 35, currentY + 4, { width: 225 });
      doc.text(r.trimestre || '1ER TRIMESTRE', 270, currentY + 4);
      doc.text(cantidad.toString(), 350, currentY + 4);
      doc.text(`$${precio.toLocaleString('es-AR', { minimumFractionDigits: 2 })}`, 395, currentY + 4);
      doc.text(`$${subtotal.toLocaleString('es-AR', { minimumFractionDigits: 2 })}`, 485, currentY + 4);

      currentY += 16;
    });

    // Total parcial por solicitud
    currentY += 3;
    doc.font('Helvetica-Bold').fontSize(8).fillColor('#0369a1');
    doc.text(`Subtotal Solicitud #${solicitud.id}: $${subtotalSolicitud.toLocaleString('es-AR', { minimumFractionDigits: 2 })}`, 380, currentY, { align: 'right', width: 185 });
    
    currentY += 18;
    doc.moveTo(30, currentY).lineTo(565, currentY).stroke('#cbd5e1');
    currentY += 15;
  });

  // Gran Total Global al final del consolidado
  if (currentY > 720) {
    doc.addPage();
    currentY = 40;
  }

  currentY += 10;
  doc.rect(320, currentY, 245, 25).fillAndStroke('#0f172a', '#0f172a');
  doc.fillColor('#ffffff').fontSize(9).font('Helvetica-Bold');
  doc.text('GRAN TOTAL CONSOLIDADO:', 330, currentY + 8);
  doc.text(`$${granTotalGeneral.toLocaleString('es-AR', { minimumFractionDigits: 2 })}`, 450, currentY + 8, { align: 'right', width: 110 });

  doc.end();
};