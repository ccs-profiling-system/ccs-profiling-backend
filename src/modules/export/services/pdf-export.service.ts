import PDFDocument from 'pdfkit';
import { Readable } from 'stream';

/**
 * PDF Export Service
 * Generates PDF documents for various data exports
 */
export class PdfExportService {
  /**
   * Generate PDF for instructions data
   * 
   * @param data - Instructions data to export
   * @returns Readable stream of PDF content
   */
  generateInstructionsPdf(data: any[]): Readable {
    const doc = new PDFDocument({ margin: 50 });

    // Add title
    doc
      .fontSize(20)
      .text('Instructions Report', { align: 'center' })
      .moveDown();

    // Add generation date
    doc
      .fontSize(10)
      .text(`Generated: ${new Date().toLocaleString()}`, { align: 'right' })
      .moveDown();

    // Add table headers
    doc.fontSize(12).text('Curriculum and Subjects', { underline: true }).moveDown(0.5);

    // Add data rows
    data.forEach((item, index) => {
      doc
        .fontSize(10)
        .text(`${index + 1}. ${item.code} - ${item.name}`)
        .fontSize(9)
        .text(`   Program: ${item.program || 'N/A'}`)
        .text(`   Units: ${item.units || 'N/A'}`)
        .text(`   Semester: ${item.semester || 'N/A'}`)
        .moveDown(0.5);
    });

    // Finalize PDF
    doc.end();

    return doc as unknown as Readable;
  }

  /**
   * Generate PDF for schedules data
   * 
   * @param data - Schedules data to export
   * @returns Readable stream of PDF content
   */
  generateSchedulesPdf(data: any[]): Readable {
    const doc = new PDFDocument({ margin: 50 });

    // Add title
    doc
      .fontSize(20)
      .text('Schedules Report', { align: 'center' })
      .moveDown();

    // Add generation date
    doc
      .fontSize(10)
      .text(`Generated: ${new Date().toLocaleString()}`, { align: 'right' })
      .moveDown();

    // Add table headers
    doc.fontSize(12).text('Class Schedules', { underline: true }).moveDown(0.5);

    // Add data rows
    data.forEach((item, index) => {
      doc
        .fontSize(10)
        .text(`${index + 1}. ${item.subject_code || 'N/A'} - ${item.subject_name || 'N/A'}`)
        .fontSize(9)
        .text(`   Faculty: ${item.faculty_name || 'N/A'}`)
        .text(`   Room: ${item.room || 'N/A'}`)
        .text(`   Day: ${item.day || 'N/A'}`)
        .text(`   Time: ${item.start_time || 'N/A'} - ${item.end_time || 'N/A'}`)
        .text(`   Semester: ${item.semester || 'N/A'} ${item.academic_year || ''}`)
        .moveDown(0.5);
    });

    // Finalize PDF
    doc.end();

    return doc as unknown as Readable;
  }
}
