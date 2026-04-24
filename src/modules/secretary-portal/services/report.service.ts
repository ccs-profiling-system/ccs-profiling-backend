/**
 * Report Service
 * Handles report generation for students, faculty, and events
 * 
 * Requirements: 10.1-10.9, 10.12
 */

import { db } from '../../../db';
import { students } from '../../../db/schema/students';
import { faculty } from '../../../db/schema/faculty';
import { events } from '../../../db/schema/events';
import { eq, and, gte, lte, isNull, sql } from 'drizzle-orm';
import PDFDocument from 'pdfkit';
import ExcelJS from 'exceljs';
import { logReportGeneration, extractIpAddress, extractUserAgent } from '../utils/auditLogger';

export type ReportFormat = 'pdf' | 'excel' | 'csv';

export interface ReportFilters {
  startDate?: string;
  endDate?: string;
  status?: string;
  yearLevel?: number;
  program?: string;
  department?: string;
  position?: string;
  eventType?: string;
}

export interface ReportResult {
  buffer: Buffer;
  contentType: string;
  filename: string;
}

/**
 * Generate student report
 * 
 * @param format - Report format (pdf, excel, csv)
 * @param filters - Report filters
 * @param userId - User generating the report
 * @param req - Express request object for audit logging
 * @returns Report buffer with content type and filename
 * 
 * Requirements: 10.1, 10.5-10.9
 */
export async function generateStudentReport(
  format: ReportFormat,
  filters: ReportFilters = {},
  userId?: string,
  req?: any
): Promise<ReportResult> {
  // Build query with filters
  const conditions = [isNull(students.deleted_at)];
  
  if (filters.status) {
    conditions.push(eq(students.status, filters.status));
  }
  
  if (filters.yearLevel) {
    conditions.push(eq(students.year_level, filters.yearLevel));
  }
  
  if (filters.program) {
    conditions.push(eq(students.program, filters.program));
  }
  
  if (filters.startDate) {
    conditions.push(gte(students.created_at, new Date(filters.startDate)));
  }
  
  if (filters.endDate) {
    conditions.push(lte(students.created_at, new Date(filters.endDate)));
  }

  // Query students
  const studentData = await db
    .select({
      student_id: students.student_id,
      first_name: students.first_name,
      last_name: students.last_name,
      email: students.email,
      phone: students.phone,
      year_level: students.year_level,
      program: students.program,
      status: students.status,
      created_at: students.created_at,
    })
    .from(students)
    .where(and(...conditions))
    .orderBy(students.last_name, students.first_name);

  // Log report generation
  if (userId && req) {
    await logReportGeneration(
      userId,
      'student',
      filters,
      extractIpAddress(req),
      extractUserAgent(req)
    );
  }

  // Generate report based on format
  switch (format) {
    case 'pdf':
      return generateStudentPDF(studentData);
    case 'excel':
      return generateStudentExcel(studentData);
    case 'csv':
      return generateStudentCSV(studentData);
    default:
      throw new Error(`Unsupported format: ${format}`);
  }
}

/**
 * Generate faculty report
 * 
 * @param format - Report format (pdf, excel, csv)
 * @param filters - Report filters
 * @param userId - User generating the report
 * @param req - Express request object for audit logging
 * @returns Report buffer with content type and filename
 * 
 * Requirements: 10.2, 10.5-10.9
 */
export async function generateFacultyReport(
  format: ReportFormat,
  filters: ReportFilters = {},
  userId?: string,
  req?: any
): Promise<ReportResult> {
  // Build query with filters
  const conditions = [isNull(faculty.deleted_at)];
  
  if (filters.status) {
    conditions.push(eq(faculty.status, filters.status));
  }
  
  if (filters.department) {
    conditions.push(eq(faculty.department, filters.department));
  }
  
  if (filters.position) {
    conditions.push(eq(faculty.position, filters.position));
  }
  
  if (filters.startDate) {
    conditions.push(gte(faculty.created_at, new Date(filters.startDate)));
  }
  
  if (filters.endDate) {
    conditions.push(lte(faculty.created_at, new Date(filters.endDate)));
  }

  // Query faculty
  const facultyData = await db
    .select({
      faculty_id: faculty.faculty_id,
      first_name: faculty.first_name,
      last_name: faculty.last_name,
      email: faculty.email,
      phone: faculty.phone,
      department: faculty.department,
      position: faculty.position,
      specialization: faculty.specialization,
      status: faculty.status,
      created_at: faculty.created_at,
    })
    .from(faculty)
    .where(and(...conditions))
    .orderBy(faculty.last_name, faculty.first_name);

  // Log report generation
  if (userId && req) {
    await logReportGeneration(
      userId,
      'faculty',
      filters,
      extractIpAddress(req),
      extractUserAgent(req)
    );
  }

  // Generate report based on format
  switch (format) {
    case 'pdf':
      return generateFacultyPDF(facultyData);
    case 'excel':
      return generateFacultyExcel(facultyData);
    case 'csv':
      return generateFacultyCSV(facultyData);
    default:
      throw new Error(`Unsupported format: ${format}`);
  }
}

/**
 * Generate event report
 * 
 * @param format - Report format (pdf, excel, csv)
 * @param filters - Report filters
 * @param userId - User generating the report
 * @param req - Express request object for audit logging
 * @returns Report buffer with content type and filename
 * 
 * Requirements: 10.3, 10.5-10.9
 */
export async function generateEventReport(
  format: ReportFormat,
  filters: ReportFilters = {},
  userId?: string,
  req?: any
): Promise<ReportResult> {
  // Build query with filters
  const conditions = [isNull(events.deleted_at)];
  
  if (filters.status) {
    conditions.push(eq(events.status, filters.status));
  }
  
  if (filters.eventType) {
    conditions.push(eq(events.event_type, filters.eventType));
  }
  
  if (filters.startDate) {
    conditions.push(gte(events.event_date, filters.startDate));
  }
  
  if (filters.endDate) {
    conditions.push(lte(events.event_date, filters.endDate));
  }

  // Query events
  const eventData = await db
    .select({
      event_name: events.event_name,
      event_type: events.event_type,
      event_date: events.event_date,
      start_time: events.start_time,
      end_time: events.end_time,
      location: events.location,
      organizer: events.organizer,
      max_participants: events.max_participants,
      status: events.status,
      created_at: events.created_at,
    })
    .from(events)
    .where(and(...conditions))
    .orderBy(events.event_date);

  // Log report generation
  if (userId && req) {
    await logReportGeneration(
      userId,
      'event',
      filters,
      extractIpAddress(req),
      extractUserAgent(req)
    );
  }

  // Generate report based on format
  switch (format) {
    case 'pdf':
      return generateEventPDF(eventData);
    case 'excel':
      return generateEventExcel(eventData);
    case 'csv':
      return generateEventCSV(eventData);
    default:
      throw new Error(`Unsupported format: ${format}`);
  }
}

// ============================================================================
// PDF Generation Functions
// ============================================================================

/**
 * Generate student PDF report
 * 
 * Requirements: 10.7
 */
function generateStudentPDF(data: any[]): ReportResult {
  const doc = new PDFDocument({ margin: 50 });
  const chunks: Buffer[] = [];

  doc.on('data', (chunk) => chunks.push(chunk));

  // Header
  doc.fontSize(20).text('Student Report', { align: 'center' });
  doc.moveDown();
  doc.fontSize(10).text(`Generated: ${new Date().toLocaleString()}`, { align: 'center' });
  doc.moveDown(2);

  // Table header
  doc.fontSize(10).font('Helvetica-Bold');
  const startY = doc.y;
  doc.text('Student ID', 50, startY, { width: 80, continued: true });
  doc.text('Name', 130, startY, { width: 120, continued: true });
  doc.text('Email', 250, startY, { width: 150, continued: true });
  doc.text('Year', 400, startY, { width: 40, continued: true });
  doc.text('Program', 440, startY, { width: 80, continued: true });
  doc.text('Status', 520, startY, { width: 60 });
  doc.moveDown();

  // Draw line
  doc.moveTo(50, doc.y).lineTo(580, doc.y).stroke();
  doc.moveDown(0.5);

  // Table rows
  doc.font('Helvetica').fontSize(9);
  data.forEach((student) => {
    const y = doc.y;
    const name = `${student.first_name} ${student.last_name}`;
    
    doc.text(student.student_id || '', 50, y, { width: 80, continued: true });
    doc.text(name, 130, y, { width: 120, continued: true });
    doc.text(student.email || '', 250, y, { width: 150, continued: true });
    doc.text(student.year_level?.toString() || '', 400, y, { width: 40, continued: true });
    doc.text(student.program || '', 440, y, { width: 80, continued: true });
    doc.text(student.status || '', 520, y, { width: 60 });
    doc.moveDown(0.5);

    // Add new page if needed
    if (doc.y > 700) {
      doc.addPage();
    }
  });

  // Footer
  doc.fontSize(8).text(`Total Records: ${data.length}`, 50, doc.y + 20);

  doc.end();

  return new Promise((resolve) => {
    doc.on('end', () => {
      resolve({
        buffer: Buffer.concat(chunks),
        contentType: 'application/pdf',
        filename: `student-report-${Date.now()}.pdf`,
      });
    });
  });
}

/**
 * Generate faculty PDF report
 * 
 * Requirements: 10.7
 */
function generateFacultyPDF(data: any[]): ReportResult {
  const doc = new PDFDocument({ margin: 50 });
  const chunks: Buffer[] = [];

  doc.on('data', (chunk) => chunks.push(chunk));

  // Header
  doc.fontSize(20).text('Faculty Report', { align: 'center' });
  doc.moveDown();
  doc.fontSize(10).text(`Generated: ${new Date().toLocaleString()}`, { align: 'center' });
  doc.moveDown(2);

  // Table header
  doc.fontSize(10).font('Helvetica-Bold');
  const startY = doc.y;
  doc.text('Faculty ID', 50, startY, { width: 80, continued: true });
  doc.text('Name', 130, startY, { width: 120, continued: true });
  doc.text('Email', 250, startY, { width: 150, continued: true });
  doc.text('Department', 400, startY, { width: 100, continued: true });
  doc.text('Status', 500, startY, { width: 60 });
  doc.moveDown();

  // Draw line
  doc.moveTo(50, doc.y).lineTo(580, doc.y).stroke();
  doc.moveDown(0.5);

  // Table rows
  doc.font('Helvetica').fontSize(9);
  data.forEach((facultyMember) => {
    const y = doc.y;
    const name = `${facultyMember.first_name} ${facultyMember.last_name}`;
    
    doc.text(facultyMember.faculty_id || '', 50, y, { width: 80, continued: true });
    doc.text(name, 130, y, { width: 120, continued: true });
    doc.text(facultyMember.email || '', 250, y, { width: 150, continued: true });
    doc.text(facultyMember.department || '', 400, y, { width: 100, continued: true });
    doc.text(facultyMember.status || '', 500, y, { width: 60 });
    doc.moveDown(0.5);

    // Add new page if needed
    if (doc.y > 700) {
      doc.addPage();
    }
  });

  // Footer
  doc.fontSize(8).text(`Total Records: ${data.length}`, 50, doc.y + 20);

  doc.end();

  return new Promise((resolve) => {
    doc.on('end', () => {
      resolve({
        buffer: Buffer.concat(chunks),
        contentType: 'application/pdf',
        filename: `faculty-report-${Date.now()}.pdf`,
      });
    });
  });
}

/**
 * Generate event PDF report
 * 
 * Requirements: 10.7
 */
function generateEventPDF(data: any[]): ReportResult {
  const doc = new PDFDocument({ margin: 50 });
  const chunks: Buffer[] = [];

  doc.on('data', (chunk) => chunks.push(chunk));

  // Header
  doc.fontSize(20).text('Event Report', { align: 'center' });
  doc.moveDown();
  doc.fontSize(10).text(`Generated: ${new Date().toLocaleString()}`, { align: 'center' });
  doc.moveDown(2);

  // Table header
  doc.fontSize(10).font('Helvetica-Bold');
  const startY = doc.y;
  doc.text('Event Name', 50, startY, { width: 150, continued: true });
  doc.text('Type', 200, startY, { width: 80, continued: true });
  doc.text('Date', 280, startY, { width: 80, continued: true });
  doc.text('Location', 360, startY, { width: 120, continued: true });
  doc.text('Status', 480, startY, { width: 80 });
  doc.moveDown();

  // Draw line
  doc.moveTo(50, doc.y).lineTo(580, doc.y).stroke();
  doc.moveDown(0.5);

  // Table rows
  doc.font('Helvetica').fontSize(9);
  data.forEach((event) => {
    const y = doc.y;
    
    doc.text(event.event_name || '', 50, y, { width: 150, continued: true });
    doc.text(event.event_type || '', 200, y, { width: 80, continued: true });
    doc.text(event.event_date || '', 280, y, { width: 80, continued: true });
    doc.text(event.location || '', 360, y, { width: 120, continued: true });
    doc.text(event.status || '', 480, y, { width: 80 });
    doc.moveDown(0.5);

    // Add new page if needed
    if (doc.y > 700) {
      doc.addPage();
    }
  });

  // Footer
  doc.fontSize(8).text(`Total Records: ${data.length}`, 50, doc.y + 20);

  doc.end();

  return new Promise((resolve) => {
    doc.on('end', () => {
      resolve({
        buffer: Buffer.concat(chunks),
        contentType: 'application/pdf',
        filename: `event-report-${Date.now()}.pdf`,
      });
    });
  });
}

// ============================================================================
// Excel Generation Functions
// ============================================================================

/**
 * Generate student Excel report
 * 
 * Requirements: 10.8
 */
async function generateStudentExcel(data: any[]): Promise<ReportResult> {
  const workbook = new ExcelJS.Workbook();
  const worksheet = workbook.addWorksheet('Students');

  // Define columns with proper formatting
  worksheet.columns = [
    { header: 'Student ID', key: 'student_id', width: 15 },
    { header: 'First Name', key: 'first_name', width: 20 },
    { header: 'Last Name', key: 'last_name', width: 20 },
    { header: 'Email', key: 'email', width: 30 },
    { header: 'Phone', key: 'phone', width: 15 },
    { header: 'Year Level', key: 'year_level', width: 12 },
    { header: 'Program', key: 'program', width: 20 },
    { header: 'Status', key: 'status', width: 12 },
    { header: 'Created At', key: 'created_at', width: 20 },
  ];

  // Style header row
  worksheet.getRow(1).font = { bold: true };
  worksheet.getRow(1).fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: 'FFE0E0E0' },
  };

  // Add data rows
  data.forEach((student) => {
    worksheet.addRow({
      student_id: student.student_id,
      first_name: student.first_name,
      last_name: student.last_name,
      email: student.email,
      phone: student.phone,
      year_level: student.year_level,
      program: student.program,
      status: student.status,
      created_at: student.created_at ? new Date(student.created_at).toLocaleString() : '',
    });
  });

  // Generate buffer
  const buffer = await workbook.xlsx.writeBuffer();

  return {
    buffer: Buffer.from(buffer),
    contentType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    filename: `student-report-${Date.now()}.xlsx`,
  };
}

/**
 * Generate faculty Excel report
 * 
 * Requirements: 10.8
 */
async function generateFacultyExcel(data: any[]): Promise<ReportResult> {
  const workbook = new ExcelJS.Workbook();
  const worksheet = workbook.addWorksheet('Faculty');

  // Define columns with proper formatting
  worksheet.columns = [
    { header: 'Faculty ID', key: 'faculty_id', width: 15 },
    { header: 'First Name', key: 'first_name', width: 20 },
    { header: 'Last Name', key: 'last_name', width: 20 },
    { header: 'Email', key: 'email', width: 30 },
    { header: 'Phone', key: 'phone', width: 15 },
    { header: 'Department', key: 'department', width: 20 },
    { header: 'Position', key: 'position', width: 20 },
    { header: 'Specialization', key: 'specialization', width: 30 },
    { header: 'Status', key: 'status', width: 12 },
    { header: 'Created At', key: 'created_at', width: 20 },
  ];

  // Style header row
  worksheet.getRow(1).font = { bold: true };
  worksheet.getRow(1).fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: 'FFE0E0E0' },
  };

  // Add data rows
  data.forEach((facultyMember) => {
    worksheet.addRow({
      faculty_id: facultyMember.faculty_id,
      first_name: facultyMember.first_name,
      last_name: facultyMember.last_name,
      email: facultyMember.email,
      phone: facultyMember.phone,
      department: facultyMember.department,
      position: facultyMember.position,
      specialization: facultyMember.specialization,
      status: facultyMember.status,
      created_at: facultyMember.created_at ? new Date(facultyMember.created_at).toLocaleString() : '',
    });
  });

  // Generate buffer
  const buffer = await workbook.xlsx.writeBuffer();

  return {
    buffer: Buffer.from(buffer),
    contentType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    filename: `faculty-report-${Date.now()}.xlsx`,
  };
}

/**
 * Generate event Excel report
 * 
 * Requirements: 10.8
 */
async function generateEventExcel(data: any[]): Promise<ReportResult> {
  const workbook = new ExcelJS.Workbook();
  const worksheet = workbook.addWorksheet('Events');

  // Define columns with proper formatting
  worksheet.columns = [
    { header: 'Event Name', key: 'event_name', width: 30 },
    { header: 'Event Type', key: 'event_type', width: 15 },
    { header: 'Event Date', key: 'event_date', width: 15 },
    { header: 'Start Time', key: 'start_time', width: 12 },
    { header: 'End Time', key: 'end_time', width: 12 },
    { header: 'Location', key: 'location', width: 25 },
    { header: 'Organizer', key: 'organizer', width: 20 },
    { header: 'Max Participants', key: 'max_participants', width: 18 },
    { header: 'Status', key: 'status', width: 15 },
    { header: 'Created At', key: 'created_at', width: 20 },
  ];

  // Style header row
  worksheet.getRow(1).font = { bold: true };
  worksheet.getRow(1).fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: 'FFE0E0E0' },
  };

  // Add data rows
  data.forEach((event) => {
    worksheet.addRow({
      event_name: event.event_name,
      event_type: event.event_type,
      event_date: event.event_date,
      start_time: event.start_time,
      end_time: event.end_time,
      location: event.location,
      organizer: event.organizer,
      max_participants: event.max_participants,
      status: event.status,
      created_at: event.created_at ? new Date(event.created_at).toLocaleString() : '',
    });
  });

  // Generate buffer
  const buffer = await workbook.xlsx.writeBuffer();

  return {
    buffer: Buffer.from(buffer),
    contentType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    filename: `event-report-${Date.now()}.xlsx`,
  };
}

// ============================================================================
// CSV Generation Functions
// ============================================================================

/**
 * Generate student CSV report
 * 
 * Requirements: 10.9
 */
function generateStudentCSV(data: any[]): ReportResult {
  const headers = [
    'Student ID',
    'First Name',
    'Last Name',
    'Email',
    'Phone',
    'Year Level',
    'Program',
    'Status',
    'Created At',
  ];

  const rows = data.map((student) => [
    escapeCSV(student.student_id),
    escapeCSV(student.first_name),
    escapeCSV(student.last_name),
    escapeCSV(student.email),
    escapeCSV(student.phone),
    escapeCSV(student.year_level?.toString()),
    escapeCSV(student.program),
    escapeCSV(student.status),
    escapeCSV(student.created_at ? new Date(student.created_at).toLocaleString() : ''),
  ]);

  const csv = [headers.join(','), ...rows.map((row) => row.join(','))].join('\n');

  return {
    buffer: Buffer.from(csv, 'utf-8'),
    contentType: 'text/csv',
    filename: `student-report-${Date.now()}.csv`,
  };
}

/**
 * Generate faculty CSV report
 * 
 * Requirements: 10.9
 */
function generateFacultyCSV(data: any[]): ReportResult {
  const headers = [
    'Faculty ID',
    'First Name',
    'Last Name',
    'Email',
    'Phone',
    'Department',
    'Position',
    'Specialization',
    'Status',
    'Created At',
  ];

  const rows = data.map((facultyMember) => [
    escapeCSV(facultyMember.faculty_id),
    escapeCSV(facultyMember.first_name),
    escapeCSV(facultyMember.last_name),
    escapeCSV(facultyMember.email),
    escapeCSV(facultyMember.phone),
    escapeCSV(facultyMember.department),
    escapeCSV(facultyMember.position),
    escapeCSV(facultyMember.specialization),
    escapeCSV(facultyMember.status),
    escapeCSV(facultyMember.created_at ? new Date(facultyMember.created_at).toLocaleString() : ''),
  ]);

  const csv = [headers.join(','), ...rows.map((row) => row.join(','))].join('\n');

  return {
    buffer: Buffer.from(csv, 'utf-8'),
    contentType: 'text/csv',
    filename: `faculty-report-${Date.now()}.csv`,
  };
}

/**
 * Generate event CSV report
 * 
 * Requirements: 10.9
 */
function generateEventCSV(data: any[]): ReportResult {
  const headers = [
    'Event Name',
    'Event Type',
    'Event Date',
    'Start Time',
    'End Time',
    'Location',
    'Organizer',
    'Max Participants',
    'Status',
    'Created At',
  ];

  const rows = data.map((event) => [
    escapeCSV(event.event_name),
    escapeCSV(event.event_type),
    escapeCSV(event.event_date),
    escapeCSV(event.start_time),
    escapeCSV(event.end_time),
    escapeCSV(event.location),
    escapeCSV(event.organizer),
    escapeCSV(event.max_participants?.toString()),
    escapeCSV(event.status),
    escapeCSV(event.created_at ? new Date(event.created_at).toLocaleString() : ''),
  ]);

  const csv = [headers.join(','), ...rows.map((row) => row.join(','))].join('\n');

  return {
    buffer: Buffer.from(csv, 'utf-8'),
    contentType: 'text/csv',
    filename: `event-report-${Date.now()}.csv`,
  };
}

/**
 * Escape CSV field value
 * 
 * Handles proper escaping for CSV format:
 * - Wraps fields containing commas, quotes, or newlines in double quotes
 * - Escapes double quotes by doubling them
 * 
 * Requirements: 10.9
 */
function escapeCSV(value: any): string {
  if (value === null || value === undefined) {
    return '';
  }

  const stringValue = String(value);

  // If the value contains comma, quote, or newline, wrap in quotes and escape quotes
  if (stringValue.includes(',') || stringValue.includes('"') || stringValue.includes('\n')) {
    return `"${stringValue.replace(/"/g, '""')}"`;
  }

  return stringValue;
}
