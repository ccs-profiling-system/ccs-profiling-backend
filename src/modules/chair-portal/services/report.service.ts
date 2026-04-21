/**
 * Report Service for Department Chair Portal
 * 
 * Provides analytics and report generation functionality for department chairs.
 * All operations are department-scoped to ensure multi-tenant data isolation.
 * 
 * Features:
 * - Student statistics (enrollment trends, status distribution, year level breakdown)
 * - Faculty statistics (department distribution, teaching load analysis, research supervision)
 * - Report export in PDF and Excel formats
 * 
 * Requirements: 8.1, 8.2, 8.3, 8.4, 8.5, 8.6, 8.7, 8.8, 8.9, 8.10, 8.11, 8.12, 8.13, 13.9, 13.11
 */

import { db } from '../../../db';
import { students, faculty, schedules, research, researchAdvisers } from '../../../db/schema';
import { eq, and, isNull, sql } from 'drizzle-orm';
import PDFDocument from 'pdfkit';
import ExcelJS from 'exceljs';

/**
 * Student statistics filters
 */
export interface StudentStatsFilters {
  year_level?: number;
  status?: string;
}

/**
 * Student statistics response
 */
export interface StudentStats {
  totalStudents: number;
  enrollmentTrends: {
    year_level: number;
    count: number;
  }[];
  statusDistribution: {
    status: string;
    count: number;
    percentage: number;
  }[];
  yearLevelBreakdown: {
    year_level: number;
    count: number;
    percentage: number;
  }[];
}

/**
 * Faculty statistics response
 */
export interface FacultyStats {
  totalFaculty: number;
  departmentDistribution: {
    department: string;
    count: number;
    percentage: number;
  }[];
  teachingLoadAnalysis: {
    faculty_id: string;
    faculty_name: string;
    total_schedules: number;
    department: string;
  }[];
  researchSupervisionCounts: {
    faculty_id: string;
    faculty_name: string;
    research_count: number;
    department: string;
  }[];
}

/**
 * Report generation result
 */
export interface ReportGenerationResult {
  buffer: Buffer;
  fileName: string;
  mimeType: string;
}

export class ReportService {
  /**
   * Get student statistics for a department
   * 
   * Provides:
   * - Total student count
   * - Enrollment trends by year level
   * - Status distribution (active, inactive, graduated, pending_approval, etc.)
   * - Year level breakdown with percentages
   * 
   * All data is filtered by department scope (program field in students table).
   * 
   * @param departmentId - Department ID to scope the statistics
   * @param filters - Optional filters for year_level and status
   * @returns Student statistics
   * 
   * Requirements: 8.1, 8.2, 8.3, 8.4, 13.9
   */
  async getStudentStats(
    departmentId: string,
    filters?: StudentStatsFilters
  ): Promise<StudentStats> {
    // Build base conditions
    const conditions = [
      eq(students.program, departmentId),
      isNull(students.deleted_at),
    ];

    // Add optional filters
    if (filters?.year_level) {
      conditions.push(eq(students.year_level, filters.year_level));
    }
    if (filters?.status) {
      conditions.push(eq(students.status, filters.status));
    }

    // Query 1: Total students
    const totalResult = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(students)
      .where(and(...conditions));

    const totalStudents = totalResult[0]?.count || 0;

    // Query 2: Enrollment trends by year level
    const enrollmentTrendsResult = await db
      .select({
        year_level: students.year_level,
        count: sql<number>`count(*)::int`,
      })
      .from(students)
      .where(and(...conditions))
      .groupBy(students.year_level)
      .orderBy(students.year_level);

    const enrollmentTrends = enrollmentTrendsResult
      .filter(r => r.year_level !== null)
      .map(r => ({
        year_level: r.year_level!,
        count: r.count,
      }));

    // Query 3: Status distribution
    const statusDistributionResult = await db
      .select({
        status: students.status,
        count: sql<number>`count(*)::int`,
      })
      .from(students)
      .where(and(...conditions))
      .groupBy(students.status);

    const statusDistribution = statusDistributionResult.map(r => ({
      status: r.status || 'unknown',
      count: r.count,
      percentage: totalStudents > 0 ? (r.count / totalStudents) * 100 : 0,
    }));

    // Query 4: Year level breakdown (same as enrollment trends but with percentages)
    const yearLevelBreakdown = enrollmentTrends.map(trend => ({
      year_level: trend.year_level,
      count: trend.count,
      percentage: totalStudents > 0 ? (trend.count / totalStudents) * 100 : 0,
    }));

    return {
      totalStudents,
      enrollmentTrends,
      statusDistribution,
      yearLevelBreakdown,
    };
  }

  /**
   * Get faculty statistics for a department
   * 
   * Provides:
   * - Total faculty count
   * - Department distribution (should be 100% for the queried department)
   * - Teaching load analysis (schedules per faculty)
   * - Research supervision counts (research projects per faculty)
   * 
   * All data is filtered by department scope.
   * 
   * @param departmentId - Department ID to scope the statistics
   * @returns Faculty statistics
   * 
   * Requirements: 8.5, 8.6, 8.7, 13.9
   */
  async getFacultyStats(departmentId: string): Promise<FacultyStats> {
    // Query 1: Total faculty in department
    const totalResult = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(faculty)
      .where(
        and(
          eq(faculty.department, departmentId),
          isNull(faculty.deleted_at)
        )
      );

    const totalFaculty = totalResult[0]?.count || 0;

    // Query 2: Department distribution (for consistency, though should be 100% for one department)
    const departmentDistributionResult = await db
      .select({
        department: faculty.department,
        count: sql<number>`count(*)::int`,
      })
      .from(faculty)
      .where(
        and(
          eq(faculty.department, departmentId),
          isNull(faculty.deleted_at)
        )
      )
      .groupBy(faculty.department);

    const departmentDistribution = departmentDistributionResult.map(r => ({
      department: r.department,
      count: r.count,
      percentage: totalFaculty > 0 ? (r.count / totalFaculty) * 100 : 0,
    }));

    // Query 3: Teaching load analysis (schedules per faculty)
    const teachingLoadResult = await db
      .select({
        faculty_id: faculty.id,
        faculty_name: sql<string>`${faculty.first_name} || ' ' || ${faculty.last_name}`,
        department: faculty.department,
        total_schedules: sql<number>`count(${schedules.id})::int`,
      })
      .from(faculty)
      .leftJoin(schedules, and(
        eq(schedules.faculty_id, faculty.id),
        isNull(schedules.deleted_at)
      ))
      .where(
        and(
          eq(faculty.department, departmentId),
          isNull(faculty.deleted_at)
        )
      )
      .groupBy(faculty.id, faculty.first_name, faculty.last_name, faculty.department)
      .orderBy(sql`count(${schedules.id}) DESC`);

    const teachingLoadAnalysis = teachingLoadResult.map(r => ({
      faculty_id: r.faculty_id,
      faculty_name: r.faculty_name,
      total_schedules: r.total_schedules,
      department: r.department,
    }));

    // Query 4: Research supervision counts
    const researchSupervisionResult = await db
      .select({
        faculty_id: faculty.id,
        faculty_name: sql<string>`${faculty.first_name} || ' ' || ${faculty.last_name}`,
        department: faculty.department,
        research_count: sql<number>`count(distinct ${research.id})::int`,
      })
      .from(faculty)
      .leftJoin(researchAdvisers, eq(researchAdvisers.faculty_id, faculty.id))
      .leftJoin(research, and(
        eq(research.id, researchAdvisers.research_id),
        isNull(research.deleted_at)
      ))
      .where(
        and(
          eq(faculty.department, departmentId),
          isNull(faculty.deleted_at)
        )
      )
      .groupBy(faculty.id, faculty.first_name, faculty.last_name, faculty.department)
      .orderBy(sql`count(distinct ${research.id}) DESC`);

    const researchSupervisionCounts = researchSupervisionResult.map(r => ({
      faculty_id: r.faculty_id,
      faculty_name: r.faculty_name,
      research_count: r.research_count,
      department: r.department,
    }));

    return {
      totalFaculty,
      departmentDistribution,
      teachingLoadAnalysis,
      researchSupervisionCounts,
    };
  }

  /**
   * Export report in specified format
   * 
   * Generates PDF or Excel reports for various report types:
   * - student_stats: Student statistics report
   * - faculty_stats: Faculty statistics report
   * - schedule_summary: Schedule summary (placeholder)
   * - event_summary: Event summary (placeholder)
   * - research_summary: Research summary (placeholder)
   * 
   * @param reportType - Type of report to generate
   * @param format - Export format (pdf or excel)
   * @param departmentId - Department ID to scope the report
   * @returns Report generation result with buffer, filename, and mime type
   * @throws Error if report type or format is unsupported
   * 
   * Requirements: 8.8, 8.9, 8.10, 8.11, 8.12, 8.13, 13.11
   */
  async exportReport(
    reportType: string,
    format: string,
    departmentId: string
  ): Promise<ReportGenerationResult> {
    // Validate report type
    const validReportTypes = [
      'student_stats',
      'faculty_stats',
      'schedule_summary',
      'event_summary',
      'research_summary',
    ];

    if (!validReportTypes.includes(reportType)) {
      throw new Error(
        `Unsupported report type: ${reportType}. Supported types: ${validReportTypes.join(', ')}`
      );
    }

    // Validate format
    if (format !== 'pdf' && format !== 'excel') {
      throw new Error('Unsupported format. Supported formats: pdf, excel');
    }

    // Generate report based on type and format
    if (reportType === 'student_stats') {
      return format === 'pdf'
        ? this.generateStudentStatsPDF(departmentId)
        : this.generateStudentStatsExcel(departmentId);
    } else if (reportType === 'faculty_stats') {
      return format === 'pdf'
        ? this.generateFacultyStatsPDF(departmentId)
        : this.generateFacultyStatsExcel(departmentId);
    } else {
      // Placeholder for other report types
      throw new Error(`Report type ${reportType} is not yet implemented`);
    }
  }

  /**
   * Generate student statistics PDF report
   */
  private async generateStudentStatsPDF(departmentId: string): Promise<ReportGenerationResult> {
    const stats = await this.getStudentStats(departmentId);

    const doc = new PDFDocument({ margin: 50 });
    const chunks: Buffer[] = [];

    doc.on('data', (chunk) => chunks.push(chunk));

    // Header
    doc.fontSize(20).text('Student Statistics Report', { align: 'center' });
    doc.moveDown();
    doc.fontSize(12).text(`Department: ${departmentId}`, { align: 'center' });
    doc.fontSize(12).text(`Generated: ${new Date().toLocaleDateString()}`, { align: 'center' });
    doc.moveDown(2);

    // Total Students
    doc.fontSize(16).text('Overview', { underline: true });
    doc.moveDown();
    doc.fontSize(12);
    doc.text(`Total Students: ${stats.totalStudents}`);
    doc.moveDown(2);

    // Status Distribution
    doc.fontSize(16).text('Status Distribution', { underline: true });
    doc.moveDown();
    doc.fontSize(12);
    stats.statusDistribution.forEach((item) => {
      doc.text(`• ${item.status}: ${item.count} (${item.percentage.toFixed(2)}%)`);
    });
    doc.moveDown(2);

    // Year Level Breakdown
    doc.fontSize(16).text('Year Level Breakdown', { underline: true });
    doc.moveDown();
    doc.fontSize(12);
    stats.yearLevelBreakdown.forEach((item) => {
      doc.text(`• Year ${item.year_level}: ${item.count} (${item.percentage.toFixed(2)}%)`);
    });
    doc.moveDown(2);

    // Finalize PDF
    doc.end();

    const buffer = await new Promise<Buffer>((resolve) => {
      doc.on('end', () => {
        resolve(Buffer.concat(chunks));
      });
    });

    return {
      buffer,
      fileName: `student-stats-${departmentId}-${Date.now()}.pdf`,
      mimeType: 'application/pdf',
    };
  }

  /**
   * Generate student statistics Excel report
   */
  private async generateStudentStatsExcel(departmentId: string): Promise<ReportGenerationResult> {
    const stats = await this.getStudentStats(departmentId);

    const workbook = new ExcelJS.Workbook();
    
    // Overview sheet
    const overviewSheet = workbook.addWorksheet('Overview');
    overviewSheet.columns = [
      { header: 'Metric', key: 'metric', width: 30 },
      { header: 'Value', key: 'value', width: 20 },
    ];
    overviewSheet.getRow(1).font = { bold: true };
    overviewSheet.addRow({ metric: 'Total Students', value: stats.totalStudents });
    overviewSheet.addRow({ metric: 'Department', value: departmentId });
    overviewSheet.addRow({ metric: 'Generated', value: new Date().toLocaleDateString() });

    // Status Distribution sheet
    const statusSheet = workbook.addWorksheet('Status Distribution');
    statusSheet.columns = [
      { header: 'Status', key: 'status', width: 20 },
      { header: 'Count', key: 'count', width: 15 },
      { header: 'Percentage', key: 'percentage', width: 15 },
    ];
    statusSheet.getRow(1).font = { bold: true };
    stats.statusDistribution.forEach((item) => {
      statusSheet.addRow({
        status: item.status,
        count: item.count,
        percentage: `${item.percentage.toFixed(2)}%`,
      });
    });

    // Year Level Breakdown sheet
    const yearLevelSheet = workbook.addWorksheet('Year Level Breakdown');
    yearLevelSheet.columns = [
      { header: 'Year Level', key: 'year_level', width: 15 },
      { header: 'Count', key: 'count', width: 15 },
      { header: 'Percentage', key: 'percentage', width: 15 },
    ];
    yearLevelSheet.getRow(1).font = { bold: true };
    stats.yearLevelBreakdown.forEach((item) => {
      yearLevelSheet.addRow({
        year_level: item.year_level,
        count: item.count,
        percentage: `${item.percentage.toFixed(2)}%`,
      });
    });

    const buffer = await workbook.xlsx.writeBuffer();

    return {
      buffer: Buffer.from(buffer),
      fileName: `student-stats-${departmentId}-${Date.now()}.xlsx`,
      mimeType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    };
  }

  /**
   * Generate faculty statistics PDF report
   */
  private async generateFacultyStatsPDF(departmentId: string): Promise<ReportGenerationResult> {
    const stats = await this.getFacultyStats(departmentId);

    const doc = new PDFDocument({ margin: 50 });
    const chunks: Buffer[] = [];

    doc.on('data', (chunk) => chunks.push(chunk));

    // Header
    doc.fontSize(20).text('Faculty Statistics Report', { align: 'center' });
    doc.moveDown();
    doc.fontSize(12).text(`Department: ${departmentId}`, { align: 'center' });
    doc.fontSize(12).text(`Generated: ${new Date().toLocaleDateString()}`, { align: 'center' });
    doc.moveDown(2);

    // Total Faculty
    doc.fontSize(16).text('Overview', { underline: true });
    doc.moveDown();
    doc.fontSize(12);
    doc.text(`Total Faculty: ${stats.totalFaculty}`);
    doc.moveDown(2);

    // Teaching Load Analysis
    doc.fontSize(16).text('Teaching Load Analysis', { underline: true });
    doc.moveDown();
    doc.fontSize(12);
    if (stats.teachingLoadAnalysis.length > 0) {
      stats.teachingLoadAnalysis.forEach((item) => {
        doc.text(`• ${item.faculty_name}: ${item.total_schedules} schedules`);
      });
    } else {
      doc.text('No teaching load data available');
    }
    doc.moveDown(2);

    // Research Supervision
    doc.fontSize(16).text('Research Supervision', { underline: true });
    doc.moveDown();
    doc.fontSize(12);
    if (stats.researchSupervisionCounts.length > 0) {
      stats.researchSupervisionCounts.forEach((item) => {
        doc.text(`• ${item.faculty_name}: ${item.research_count} research projects`);
      });
    } else {
      doc.text('No research supervision data available');
    }
    doc.moveDown(2);

    // Finalize PDF
    doc.end();

    const buffer = await new Promise<Buffer>((resolve) => {
      doc.on('end', () => {
        resolve(Buffer.concat(chunks));
      });
    });

    return {
      buffer,
      fileName: `faculty-stats-${departmentId}-${Date.now()}.pdf`,
      mimeType: 'application/pdf',
    };
  }

  /**
   * Generate faculty statistics Excel report
   */
  private async generateFacultyStatsExcel(departmentId: string): Promise<ReportGenerationResult> {
    const stats = await this.getFacultyStats(departmentId);

    const workbook = new ExcelJS.Workbook();
    
    // Overview sheet
    const overviewSheet = workbook.addWorksheet('Overview');
    overviewSheet.columns = [
      { header: 'Metric', key: 'metric', width: 30 },
      { header: 'Value', key: 'value', width: 20 },
    ];
    overviewSheet.getRow(1).font = { bold: true };
    overviewSheet.addRow({ metric: 'Total Faculty', value: stats.totalFaculty });
    overviewSheet.addRow({ metric: 'Department', value: departmentId });
    overviewSheet.addRow({ metric: 'Generated', value: new Date().toLocaleDateString() });

    // Teaching Load sheet
    const teachingLoadSheet = workbook.addWorksheet('Teaching Load');
    teachingLoadSheet.columns = [
      { header: 'Faculty Name', key: 'faculty_name', width: 30 },
      { header: 'Total Schedules', key: 'total_schedules', width: 20 },
      { header: 'Department', key: 'department', width: 20 },
    ];
    teachingLoadSheet.getRow(1).font = { bold: true };
    stats.teachingLoadAnalysis.forEach((item) => {
      teachingLoadSheet.addRow({
        faculty_name: item.faculty_name,
        total_schedules: item.total_schedules,
        department: item.department,
      });
    });

    // Research Supervision sheet
    const researchSheet = workbook.addWorksheet('Research Supervision');
    researchSheet.columns = [
      { header: 'Faculty Name', key: 'faculty_name', width: 30 },
      { header: 'Research Count', key: 'research_count', width: 20 },
      { header: 'Department', key: 'department', width: 20 },
    ];
    researchSheet.getRow(1).font = { bold: true };
    stats.researchSupervisionCounts.forEach((item) => {
      researchSheet.addRow({
        faculty_name: item.faculty_name,
        research_count: item.research_count,
        department: item.department,
      });
    });

    const buffer = await workbook.xlsx.writeBuffer();

    return {
      buffer: Buffer.from(buffer),
      fileName: `faculty-stats-${departmentId}-${Date.now()}.xlsx`,
      mimeType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    };
  }
}
