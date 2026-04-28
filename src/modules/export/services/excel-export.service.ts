import ExcelJS from 'exceljs';
import { Readable } from 'stream';

/**
 * Excel Export Service
 * Generates Excel spreadsheets for various data exports
 */
export class ExcelExportService {
  /**
   * Generate Excel for instructions data
   * 
   * @param data - Instructions data to export
   * @returns Readable stream of Excel content
   */
  async generateInstructionsExcel(data: any[]): Promise<Readable> {
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Instructions');

    // Add headers
    worksheet.columns = [
      { header: 'Code', key: 'code', width: 15 },
      { header: 'Name', key: 'name', width: 30 },
      { header: 'Program', key: 'program', width: 20 },
      { header: 'Units', key: 'units', width: 10 },
      { header: 'Semester', key: 'semester', width: 10 },
      { header: 'Year Level', key: 'yearLevel', width: 12 },
      { header: 'Type', key: 'type', width: 15 },
      { header: 'Status', key: 'status', width: 12 },
    ];

    // Style headers
    worksheet.getRow(1).font = { bold: true };
    worksheet.getRow(1).fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FFE0E0E0' },
    };

    // Add data rows
    data.forEach((item) => {
      worksheet.addRow({
        code: item.code || '',
        name: item.name || '',
        program: item.program || '',
        units: item.units || '',
        semester: item.semester || '',
        yearLevel: item.year_level || item.yearLevel || '',
        type: item.type || '',
        status: item.status || '',
      });
    });

    // Generate buffer and convert to stream
    const buffer = await workbook.xlsx.writeBuffer();
    const stream = new Readable();
    stream.push(buffer);
    stream.push(null);

    return stream;
  }

  /**
   * Generate Excel for schedules data
   * 
   * @param data - Schedules data to export
   * @returns Readable stream of Excel content
   */
  async generateSchedulesExcel(data: any[]): Promise<Readable> {
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Schedules');

    // Add headers
    worksheet.columns = [
      { header: 'Subject Code', key: 'subjectCode', width: 15 },
      { header: 'Subject Name', key: 'subjectName', width: 30 },
      { header: 'Faculty', key: 'faculty', width: 25 },
      { header: 'Room', key: 'room', width: 15 },
      { header: 'Day', key: 'day', width: 12 },
      { header: 'Start Time', key: 'startTime', width: 12 },
      { header: 'End Time', key: 'endTime', width: 12 },
      { header: 'Semester', key: 'semester', width: 10 },
      { header: 'Academic Year', key: 'academicYear', width: 15 },
      { header: 'Type', key: 'type', width: 15 },
    ];

    // Style headers
    worksheet.getRow(1).font = { bold: true };
    worksheet.getRow(1).fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FFE0E0E0' },
    };

    // Add data rows
    data.forEach((item) => {
      worksheet.addRow({
        subjectCode: item.subject_code || '',
        subjectName: item.subject_name || '',
        faculty: item.faculty_name || '',
        room: item.room || '',
        day: item.day || '',
        startTime: item.start_time || '',
        endTime: item.end_time || '',
        semester: item.semester || '',
        academicYear: item.academic_year || '',
        type: item.schedule_type || '',
      });
    });

    // Generate buffer and convert to stream
    const buffer = await workbook.xlsx.writeBuffer();
    const stream = new Readable();
    stream.push(buffer);
    stream.push(null);

    return stream;
  }
}
