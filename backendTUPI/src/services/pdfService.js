import PDFDocument from 'pdfkit';
import path from 'path';
import fs from 'fs';

const obtenerRutaLogo = () => {
  const rutasPosibles = [
    path.resolve('../frontend/public/logo-unne.png'),
    path.resolve('../frontendTUPI/public/logo-unne.png'),
    path.resolve('public/logo-unne.png'),
    path.resolve('../public/logo-unne.png')
  ];

  for (const ruta of rutasPosibles) {
    if (fs.existsSync(ruta)) return ruta;
  }
  return null;
};

export const generarPDFSolicitud = (res, sol, renglones) => {
  const doc = new PDFDocument({ margin: 40, size: 'A4' });

  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader('Content-Disposition', `attachment; filename=Solicitud_Autorizada_${sol.id}.pdf`);
  doc.pipe(res);

  // Encabezado
  const logoPath = obtenerRutaLogo();
  if (logoPath) {
    doc.image(logoPath, 40, 35, { width: 60 });
  }

  doc.fillColor('#0f172a').fontSize(16).font('Helvetica-Bold').text('UNIVERSIDAD NACIONAL DEL NORDESTE', 110, 40);
  doc.fillColor('#0284c7').fontSize(12).font('Helvetica-Bold').text('SISTEMA TUPI - COMPROBANTE DE SOLICITUD AUTORIZADA', 110, 60);
  doc.fillColor('#64748b').fontSize(9).font('Helvetica').text('Plan Anual de Compras y Contrataciones (PAC)', 110, 75);

  doc.moveTo(40, 105).lineTo(555, 105).strokeColor('#0284c7').lineWidth(2).stroke();

  // Bloque Metadatos
  doc.rect(40, 115, 515, 75).fillAndStroke('#f8fafc', '#e2e8f0');

  doc.fillColor('#1e293b').fontSize(9).font('Helvetica-Bold');
  doc.text('Solicitud N°:', 50, 125).font('Helvetica').text(`#${sol.id}`, 120, 125);
  doc.font('Helvetica-Bold').text('Convocatoria:', 50, 140).font('Helvetica').text(`${sol.nro_convocatoria || 'CDC:2026/01'}`, 120, 140);
  doc.font('Helvetica-Bold').text('Dependencia:', 50, 155).font('Helvetica').text(`${sol.dependencia_nombre || 'Rectorado UNNE'}`, 120, 155);

  doc.font('Helvetica-Bold').text('Solicitante:', 300, 125).font('Helvetica').text(`${sol.usuario_nombre} ${sol.usuario_apellido}`, 370, 125);
  doc.font('Helvetica-Bold').text('Email:', 300, 140).font('Helvetica').text(`${sol.usuario_email}`, 370, 140);
  doc.font('Helvetica-Bold').text('Fecha Emisión:', 300, 155).font('Helvetica').text(`${new Date(sol.fecha_creacion).toLocaleDateString('es-AR')}`, 370, 155);

  // Tabla Renglones
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

  // Total General
  doc.rect(40, y, 515, 26).fillAndStroke('#e0f2fe', '#0284c7');
  doc.fillColor('#0369a1').fontSize(10).font('Helvetica-Bold');
  doc.text('MONTO TOTAL GENERAL ESTIMADO:', 50, y + 8);
  doc.text(`$ ${totalGeneral.toLocaleString('es-AR', { minimumFractionDigits: 2 })}`, 415, y + 8, { width: 130, align: 'right' });

  y += 45;

  // Pie y Firma
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
};