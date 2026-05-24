const PDFDocument = require('pdfkit');
const ExcelJS = require('exceljs');
const fs = require('fs');
const path = require('path');

/**
 * Generates a PDF report from data
 * @param {String} title - Report title
 * @param {Array} columns - [{header: 'Name', key: 'name'}]
 * @param {Array} data - Array of objects
 * @returns {Promise<Buffer>}
 */
exports.generatePDF = async (title, columns, data) => {
    return new Promise((resolve, reject) => {
        try {
            const doc = new PDFDocument({ margin: 50, size: 'A4' });
            const buffers = [];
            doc.on('data', buffers.push.bind(buffers));
            doc.on('end', () => resolve(Buffer.concat(buffers)));

            // Header
            doc.fillColor('#1e293b').fontSize(24).font('Helvetica-Bold').text(title, { align: 'center' });
            doc.fontSize(10).font('Helvetica').text(`Generated on: ${new Date().toLocaleString()}`, { align: 'center' });
            doc.moveDown(2);

            // Table Header
            const startX = 50;
            let currentY = doc.y;
            const colWidth = (doc.page.width - 100) / columns.length;

            doc.fillColor('#f8fafc').rect(startX, currentY, doc.page.width - 100, 20).fill();
            doc.fillColor('#1e293b').fontSize(10).font('Helvetica-Bold');
            
            columns.forEach((col, i) => {
                doc.text(col.header, startX + (i * colWidth) + 5, currentY + 5, { width: colWidth - 10, align: 'left' });
            });
            
            currentY += 20;
            doc.font('Helvetica').fontSize(9);

            // Table Rows
            data.forEach((row, rowIndex) => {
                // Check if we need a new page
                if (currentY > doc.page.height - 100) {
                    doc.addPage();
                    currentY = 50;
                }

                // Zebra striping
                if (rowIndex % 2 === 0) {
                    doc.fillColor('#f1f5f9').rect(startX, currentY, doc.page.width - 100, 15).fill();
                }

                doc.fillColor('#334155');
                columns.forEach((col, i) => {
                    const value = row[col.key]?.toString() || '-';
                    doc.text(value, startX + (i * colWidth) + 5, currentY + 3, { width: colWidth - 10, align: 'left' });
                });
                currentY += 15;
            });

            // Footer
            const range = doc.bufferedPageRange();
            for (let i = range.start; i < range.start + range.count; i++) {
                doc.switchToPage(i);
                doc.fillColor('#94a3b8').fontSize(8).text(
                    `Page ${i + 1} of ${range.count} - Confidential Report`,
                    50,
                    doc.page.height - 50,
                    { align: 'center', width: 500 }
                );
            }

            doc.end();
        } catch (error) {
            reject(error);
        }
    });
};

/**
 * Generates an Excel report from data
 * @param {String} sheetName
 * @param {Array} columns - [{header: 'Name', key: 'name', width: 20}]
 * @param {Array} data
 * @returns {Promise<Buffer>}
 */
exports.generateExcel = async (sheetName, columns, data) => {
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet(sheetName);

    worksheet.columns = columns;

    // Style header
    worksheet.getRow(1).font = { bold: true };
    worksheet.getRow(1).fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FFE2E8F0' }
    };

    worksheet.addRows(data);

    return await workbook.xlsx.writeBuffer();
};
