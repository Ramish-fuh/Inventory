import PDFDocument from 'pdfkit';
import ExcelJS from 'exceljs';
import { Readable } from 'stream';

export const generatePDFReport = async (assets) => {
  const doc = new PDFDocument();
  const chunks = [];

  return new Promise((resolve, reject) => {
    doc.on('data', chunk => chunks.push(chunk));
    doc.on('end', () => resolve(Buffer.concat(chunks)));
    doc.on('error', reject);

    // Add content to PDF
    doc.fontSize(20).text('Asset Inventory Report', { align: 'center' });
    doc.moveDown(2);
    doc.fontSize(12);

    // Add timestamp
    doc.text(`Generated on: ${new Date().toLocaleString()}`, { align: 'right' });
    doc.moveDown(2);

    // Define column widths and positions
    const pageWidth = doc.page.width - 100; // 50px margin on each side
    const columns = [
      { header: 'Name', width: pageWidth * 0.25 },
      { header: 'Category', width: pageWidth * 0.15 },
      { header: 'Status', width: pageWidth * 0.15 },
      { header: 'Location', width: pageWidth * 0.2 },
      { header: 'Assigned To', width: pageWidth * 0.25 }
    ];

    // Calculate starting position
    let xPos = 50;
    let yPos = doc.y;

    // Draw table header
    doc.font('Helvetica-Bold');
    columns.forEach(column => {
      doc.text(column.header, xPos, yPos, {
        width: column.width,
        align: 'left'
      });
      xPos += column.width;
    });
    
    // Add horizontal line
    doc.moveDown();
    yPos = doc.y;
    doc.moveTo(50, yPos).lineTo(550, yPos).stroke();
    doc.moveDown();

    // Reset font
    doc.font('Helvetica');

    // Add assets data
    assets.forEach(asset => {
      // Check if we need a new page
      if (doc.y > doc.page.height - 100) {
        doc.addPage();
        doc.y = 50;
      }

      yPos = doc.y;
      xPos = 50;

      // Draw each column with proper width and wrapping
      columns.forEach((column, index) => {
        let value = '';
        switch (index) {
          case 0: value = asset.name || ''; break;
          case 1: value = asset.category || ''; break;
          case 2: value = asset.status || ''; break;
          case 3: value = asset.location || ''; break;
          case 4: value = asset.assignedTo || ''; break;
        }

        doc.text(value, xPos, yPos, {
          width: column.width,
          align: 'left'
        });
        xPos += column.width;
      });

      // Move down for the next row, considering the highest content
      doc.moveDown();
    });

    doc.end();
  });
};

export const generateExcelReport = async (assets) => {
  const workbook = new ExcelJS.Workbook();
  const worksheet = workbook.addWorksheet('Asset Inventory');

  // Add report generation info
  worksheet.getCell('A1').value = 'Asset Inventory Report';
  worksheet.getCell('A2').value = `Generated on: ${new Date().toLocaleString()}`;
  worksheet.mergeCells('A1:H1');
  worksheet.mergeCells('A2:H2');
  
  // Style the title and date
  worksheet.getCell('A1').font = { bold: true, size: 14 };
  worksheet.getCell('A1').alignment = { horizontal: 'center' };
  worksheet.getCell('A2').alignment = { horizontal: 'right' };
  
  // Add empty row for spacing
  worksheet.addRow([]);

  // Add headers
  const headerRow = worksheet.addRow([
    'Name',
    'Category',
    'Status',
    'Location',
    'Assigned To',
    'Serial Number',
    'Purchase Date',
    'Warranty Expiry',
    'License Expiry',
    'Next Maintenance'
  ]);

  // Style the header row
  headerRow.font = { bold: true };
  headerRow.fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: 'FFE0E0E0' }
  };

  // Set column widths
  worksheet.columns = [
    { width: 30 }, // Name
    { width: 15 }, // Category
    { width: 15 }, // Status
    { width: 20 }, // Location
    { width: 20 }, // Assigned To
    { width: 20 }, // Serial Number
    { width: 15 }, // Purchase Date
    { width: 15 }, // Warranty Expiry
    { width: 15 }, // License Expiry
    { width: 15 }  // Next Maintenance
  ];

  // Add data
  assets.forEach(asset => {
    const row = worksheet.addRow([
      asset.name,
      asset.category,
      asset.status,
      asset.location,
      asset.assignedTo,
      asset.serialNumber,
      asset.purchaseDate ? new Date(asset.purchaseDate).toLocaleDateString() : '',
      asset.warrantyExpiry ? new Date(asset.warrantyExpiry).toLocaleDateString() : '',
      asset.licenseExpiry ? new Date(asset.licenseExpiry).toLocaleDateString() : '',
      asset.nextMaintenance ? new Date(asset.nextMaintenance).toLocaleDateString() : ''
    ]);

    // Add conditional formatting for dates
    const today = new Date();
    const critical = new Date();
    const warning = new Date();
    const notice = new Date();
    critical.setDate(today.getDate() + 7);  // Critical: 7 days
    warning.setDate(today.getDate() + 15);  // Warning: 15 days
    notice.setDate(today.getDate() + 30);   // Notice: 30 days

    // Color code expiring dates
    [7, 8, 9].forEach(colIndex => { // Warranty, License, and Maintenance columns
      const dateValue = row.getCell(colIndex).value;
      if (dateValue) {
        const date = new Date(dateValue);
        if (date <= critical) {
          row.getCell(colIndex).fill = {
            type: 'pattern',
            pattern: 'solid',
            fgColor: { argb: 'FFFF0000' } // Red for critical
          };
        } else if (date <= warning) {
          row.getCell(colIndex).fill = {
            type: 'pattern',
            pattern: 'solid',
            fgColor: { argb: 'FFFF9900' } // Orange for warning
          };
        } else if (date <= notice) {
          row.getCell(colIndex).fill = {
            type: 'pattern',
            pattern: 'solid',
            fgColor: { argb: 'FFFFFF00' } // Yellow for notice
          };
        }
      }
    });
  });

  // Add legend
  worksheet.addRow([]);
  worksheet.addRow(['Color Legend']);
  const legendRows = [
    ['Critical (≤ 7 days)', 'FFFF0000'],
    ['Warning (≤ 15 days)', 'FFFF9900'],
    ['Notice (≤ 30 days)', 'FFFFFF00']
  ];

  legendRows.forEach(([text, color]) => {
    const row = worksheet.addRow([text]);
    row.getCell(1).fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: color }
    };
  });

  // Generate buffer
  return await workbook.xlsx.writeBuffer();
};