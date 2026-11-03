import PDFDocument from 'pdfkit';
import fs from 'fs';
import path from 'path';

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
  renglones.forEach((r, i) => {
    if (currentY > 750) {
      doc.addPage();
      currentY = 40;
    }

    const cantidad = parseInt(r.cantidad, 10) || 1;
    const precio = parseFloat(r.precio_unitario) || 0;
    const subtotal = cantidad * precio;

    doc.text((i + 1).toString(), 35, currentY + 5);
    doc.text(r.bien_descripcion || r.descripcion || '', 65, currentY + 5, { width: 195 });
    doc.text(r.trimestre || '1ER TRIMESTRE', 270, currentY + 5);
    doc.text(cantidad.toString(), 350, currentY + 5);
    doc.text(`$${precio.toLocaleString('es-AR', { minimumFractionDigits: 2 })}`, 395, currentY + 5);
    doc.text(`$${subtotal.toLocaleString('es-AR', { minimumFractionDigits: 2 })}`, 485, currentY + 5);

    currentY += 22;
    doc.moveTo(30, currentY).lineTo(565, currentY).stroke('#e2e8f0');
  });

  doc.end();
};