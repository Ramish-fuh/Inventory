import PDFDocument from 'pdfkit';
import ExcelJS from 'exceljs';
import logger from './logger.js';
import SystemLog from '../models/SystemLog.js';

export const generatePDFReport = async (data, type = 'asset') => {
  try {
    logger.info(`Starting PDF report generation for ${type}`, {
      count: data.length
    });

    const startTime = Date.now();
    const doc = new PDFDocument();
    const chunks = [];

    doc.on('data', chunk => chunks.push(chunk));

    // Add content to PDF
    doc.fontSize(20).text(`${type.charAt(0).toUpperCase() + type.slice(1)} Report`, { align: 'center' });
    doc.moveDown(2);
    doc.fontSize(12);

    // Add timestamp
    doc.text(`Generated on: ${new Date().toLocaleString()}`, { align: 'right' });
    doc.moveDown(2);

    // Define column widths and positions based on type
    const pageWidth = doc.page.width - 100; // 50px margin on each side
    let columns;

    if (type === 'activity') {
      columns = [
        { header: 'Timestamp', width: pageWidth * 0.2 },
        { header: 'User', width: pageWidth * 0.15 },
        { header: 'Category', width: pageWidth * 0.15 },
        { header: 'Action', width: pageWidth * 0.2 },
        { header: 'Details', width: pageWidth * 0.3 }
      ];
    } else if (type === 'system') {
      columns = [
        { header: 'Timestamp', width: pageWidth * 0.15 },
        { header: 'Level', width: pageWidth * 0.1 },
        { header: 'Service', width: pageWidth * 0.15 },
        { header: 'Message', width: pageWidth * 0.3 },
        { header: 'Details', width: pageWidth * 0.3 }
      ];
    } else {
      // Asset report columns (existing implementation)
      columns = [
        { header: 'Name', width: pageWidth * 0.25 },
        { header: 'Category', width: pageWidth * 0.15 },
        { header: 'Status', width: pageWidth * 0.15 },
        { header: 'Location', width: pageWidth * 0.2 },
        { header: 'Assigned To', width: pageWidth * 0.25 }
      ];
    }

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

    // Add data
    data.forEach(item => {
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
        if (type === 'activity') {
          switch (index) {
            case 0: value = new Date(item.timestamp).toLocaleString(); break;
            case 1: value = item.user ? `${item.user.fullName} (${item.user.username})` : 'System'; break;
            case 2: value = item.category || ''; break;
            case 3: value = item.action || ''; break;
            case 4: value = item.details || ''; break;
          }
        } else if (type === 'system') {
          switch (index) {
            case 0: value = new Date(item.timestamp).toLocaleString(); break;
            case 1: value = item.level || ''; break;
            case 2: value = item.service || ''; break;
            case 3: value = item.message || ''; break;
            case 4: value = typeof item.details === 'object' ? JSON.stringify(item.details, null, 2) : (item.details || ''); break;
          }
        } else {
          // Asset report (existing implementation)
          switch (index) {
            case 0: value = item.name || ''; break;
            case 1: value = item.category || ''; break;
            case 2: value = item.status || ''; break;
            case 3: value = item.location || ''; break;
            case 4: value = item.assignedTo || ''; break;
          }
        }

        doc.text(value, xPos, yPos, {
          width: column.width,
          align: 'left'
        });
        xPos += column.width;
      });

      // Move down for the next row
      doc.moveDown();
    });

    return new Promise((resolve, reject) => {
      doc.on('end', () => {
        const buffer = Buffer.concat(chunks);
        const duration = Date.now() - startTime;

        logger.info(`PDF ${type} report generated successfully`, {
          size: buffer.length,
          duration,
          count: data.length
        });

        SystemLog.create({
          level: 'info',
          message: `PDF ${type} report generated`,
          service: 'report-generator',
          metadata: {
            type: 'pdf',
            reportType: type,
            size: buffer.length,
            duration,
            count: data.length
          }
        }).catch(err => logger.error('Error logging PDF generation', { error: err }));

        resolve(buffer);
      });

      doc.end();
    });
  } catch (error) {
    logger.error(`Error generating PDF ${type} report`, {
      error: error.message,
      stack: error.stack,
      count: data.length
    });

    await SystemLog.create({
      level: 'error',
      message: `Error generating PDF ${type} report`,
      service: 'report-generator',
      metadata: {
        type: 'pdf',
        reportType: type,
        error: error.message,
        count: data.length
      },
      trace: error.stack
    });

    throw error;
  }
};

export const generateExcelReport = async (data, type = 'asset') => {
  try {
    logger.info(`Starting Excel report generation for ${type}`, {
      count: data.length
    });

    const startTime = Date.now();
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet(`${type.charAt(0).toUpperCase() + type.slice(1)} Report`);

    // Add report generation info
    worksheet.getCell('A1').value = `${type.charAt(0).toUpperCase() + type.slice(1)} Report`;
    worksheet.getCell('A2').value = `Generated on: ${new Date().toLocaleString()}`;
    worksheet.mergeCells('A1:H1');
    worksheet.mergeCells('A2:H2');
    
    // Style the title and date
    worksheet.getCell('A1').font = { bold: true, size: 14 };
    worksheet.getCell('A1').alignment = { horizontal: 'center' };
    worksheet.getCell('A2').alignment = { horizontal: 'right' };
    
    // Add empty row for spacing
    worksheet.addRow([]);

    // Add headers based on type
    let headers;
    if (type === 'activity') {
      headers = ['Timestamp', 'User', 'Category', 'Action', 'Details'];
      worksheet.columns = [
        { width: 20 }, // Timestamp
        { width: 30 }, // User
        { width: 15 }, // Category
        { width: 20 }, // Action
        { width: 50 }  // Details
      ];
    } else if (type === 'system') {
      headers = ['Timestamp', 'Level', 'Service', 'Message', 'Details'];
      worksheet.columns = [
        { width: 20 }, // Timestamp
        { width: 10 }, // Level
        { width: 15 }, // Service
        { width: 40 }, // Message
        { width: 50 }  // Details
      ];
    } else {
      // Asset report (existing implementation)
      headers = ['Name', 'Category', 'Status', 'Location', 'Assigned To'];
      worksheet.columns = [
        { width: 30 }, // Name
        { width: 15 }, // Category
        { width: 15 }, // Status
        { width: 20 }, // Location
        { width: 20 }  // Assigned To
      ];
    }

    const headerRow = worksheet.addRow(headers);

    // Style the header row
    headerRow.font = { bold: true };
    headerRow.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FFE0E0E0' }
    };

    // Add data
    data.forEach(item => {
      let rowData;
      if (type === 'activity') {
        rowData = [
          new Date(item.timestamp).toLocaleString(),
          item.user ? `${item.user.fullName} (${item.user.username})` : 'System',
          item.category || '',
          item.action || '',
          item.details || ''
        ];
      } else if (type === 'system') {
        rowData = [
          new Date(item.timestamp).toLocaleString(),
          item.level || '',
          item.service || '',
          item.message || '',
          typeof item.details === 'object' ? JSON.stringify(item.details, null, 2) : (item.details || '')
        ];
      } else {
        // Asset report (existing implementation)
        rowData = [
          item.name || '',
          item.category || '',
          item.status || '',
          item.location || '',
          item.assignedTo || ''
        ];
      }
      worksheet.addRow(rowData);
    });

    // Style level column for system logs
    if (type === 'system') {
      worksheet.eachRow((row, rowNumber) => {
        if (rowNumber > 4) { // Skip header rows
          const levelCell = row.getCell(2);
          switch (levelCell.value?.toLowerCase()) {
            case 'error':
              levelCell.fill = {
                type: 'pattern',
                pattern: 'solid',
                fgColor: { argb: 'FFFF0000' }
              };
              break;
            case 'warn':
              levelCell.fill = {
                type: 'pattern',
                pattern: 'solid',
                fgColor: { argb: 'FFFF9900' }
              };
              break;
            case 'info':
              levelCell.fill = {
                type: 'pattern',
                pattern: 'solid',
                fgColor: { argb: 'FF00FF00' }
              };
              break;
          }
        }
      });
    }

    const buffer = await workbook.xlsx.writeBuffer();
    const duration = Date.now() - startTime;

    logger.info(`Excel ${type} report generated successfully`, {
      size: buffer.length,
      duration,
      count: data.length
    });

    await SystemLog.create({
      level: 'info',
      message: `Excel ${type} report generated`,
      service: 'report-generator',
      metadata: {
        type: 'excel',
        reportType: type,
        size: buffer.length,
        duration,
        count: data.length
      }
    });

    return buffer;
  } catch (error) {
    logger.error(`Error generating Excel ${type} report`, {
      error: error.message,
      stack: error.stack,
      count: data.length
    });

    await SystemLog.create({
      level: 'error',
      message: `Error generating Excel ${type} report`,
      service: 'report-generator',
      metadata: {
        type: 'excel',
        reportType: type,
        error: error.message,
        count: data.length
      },
      trace: error.stack
    });

    throw error;
  }
};