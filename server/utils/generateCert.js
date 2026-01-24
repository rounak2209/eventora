const PDFDocument = require('pdfkit');

const generateCertificatePDF = (data, dataCallback, endCallback) => {
  const doc = new PDFDocument({ layout: 'landscape', size: 'A4' });

  doc.on('data', dataCallback);
  doc.on('end', endCallback);

  // 1. Border (Fancy Look)
  doc.rect(20, 20, doc.page.width - 40, doc.page.height - 40).stroke('#4F46E5');

  // 2. Title
  doc.font('Helvetica-Bold').fontSize(30).fillColor('#4F46E5').text('CERTIFICATE OF PARTICIPATION', { align: 'center', valign: 'center' });
  doc.moveDown();

  // 3. Body Text
  doc.font('Helvetica').fontSize(20).fillColor('black').text(`This is to certify that`, { align: 'center' });
  doc.moveDown();

  // 4. Student Name (Bada dikhana hai)
  doc.font('Helvetica-Bold').fontSize(35).text(data.studentName, { align: 'center', underline: true });
  doc.moveDown();

  // 5. Team Info (Agar team hai to dikhao, nahi to skip)
  if (data.teamName) {
    doc.fontSize(20).font('Helvetica').text(`from Team: ${data.teamName}`, { align: 'center' });
    doc.moveDown();
  }

  // 6. Event Details
  doc.fontSize(20).font('Helvetica').text(`has successfully participated in the event`, { align: 'center' });
  doc.fontSize(25).font('Helvetica-Bold').fillColor('#4F46E5').text(data.eventName, { align: 'center' });
  
  doc.moveDown();
  doc.fontSize(15).fillColor('black').text(`Date: ${new Date(data.date).toDateString()}`, { align: 'center' });

  // 7. Verification Link & QR Logic (Fake Certificate Rokne ke liye)
  doc.moveDown(2);
  doc.fontSize(12).fillColor('gray').text(`Certificate ID: ${data.certificateId}`, { align: 'center' });
  doc.text(`Verify at: ${data.verifyUrl}`, { align: 'center', link: data.verifyUrl, underline: true });

  doc.end();
};

module.exports = { generateCertificatePDF };