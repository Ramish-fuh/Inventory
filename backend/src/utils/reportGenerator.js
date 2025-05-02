import PDFDocument from 'pdfkit';
import ExcelJS from 'exceljs';
import { Readable } from 'stream';

export const generatePDFReport = async (assets) => {
  const doc = new PDFDocument();
  const chunks = [];

  return new Promise((resolve, reject) => {
    // Handle document chunks
    doc.on('data', chunk => chunks.push(chunk));
    doc.on('end', () => resolve(Buffer.concat(chunks)));
    doc.on('error', reject);

    // Add content to PDF
    doc.fontSize(20).text('Asset Inventory Report', { align: 'center' });
    doc.moveDown();
    doc.fontSize(12);

    // Add timestamp
    doc.text(`Generated on: ${new Date().toLocaleString()}`, { align: 'right' });
    doc.moveDown();

    // Add table headers
    const headers = ['Name', 'Category', 'Status', 'Location', 'Assigned To'];
    let yPos = doc.y;
    let xPos = 50;
    headers.forEach(header => {
      doc.text(header, xPos, yPos);
      xPos += 100;
    });

    doc.moveDown();
    // Add horizontal line
    doc.moveTo(50, doc.y).lineTo(550, doc.y).stroke();
    doc.moveDown();

    // Add assets data
    assets.forEach(asset => {
      let y = doc.y;
      doc.text(asset.name || '', 50, y);
      doc.text(asset.category || '', 150, y);
      doc.text(asset.status || '', 250, y);
      doc.text(asset.location || '', 350, y);
      doc.text(asset.assignedTo || '', 450, y);
      doc.moveDown();
    });

    doc.end();
  });
};

export const generateExcelReport = async (assets) => {
  const workbook = new ExcelJS.Workbook();
  const worksheet = workbook.addWorksheet('Asset Inventory');

  // Add headers
  worksheet.columns = [
    { header: 'Name', key: 'name', width: 30 },
    { header: 'Category', key: 'category', width: 15 },
    { header: 'Status', key: 'status', width: 15 },
    { header: 'Location', key: 'location', width: 20 },
    { header: 'Assigned To', key: 'assignedTo', width: 20 },
    { header: 'Serial Number', key: 'serialNumber', width: 20 },
    { header: 'Purchase Date', key: 'purchaseDate', width: 15 },
    { header: 'Warranty Expiry', key: 'warrantyExpiry', width: 15 }
  ];

  // Style the header row
  worksheet.getRow(1).font = { bold: true };
  worksheet.getRow(1).fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: 'FFE0E0E0' }
  };

  // Add data
  assets.forEach(asset => {
    worksheet.addRow({
      name: asset.name,
      category: asset.category,
      status: asset.status,
      location: asset.location,
      assignedTo: asset.assignedTo,
      serialNumber: asset.serialNumber,
      purchaseDate: asset.purchaseDate ? new Date(asset.purchaseDate).toLocaleDateString() : '',
      warrantyExpiry: asset.warrantyExpiry ? new Date(asset.warrantyExpiry).toLocaleDateString() : ''
    });
  });

  // Generate buffer
  return await workbook.xlsx.writeBuffer();
};