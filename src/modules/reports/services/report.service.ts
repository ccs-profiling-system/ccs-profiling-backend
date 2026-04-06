/**
 * Report Service
 * Generates PDF and Excel reports for various entities
 * 
 * Requirements: 17.1, 17.2, 17.3, 17.4, 17.5, 17.6, 17.7
 */

import PDFDocument from 'pdfkit';
import ExcelJS from 'exceljs';
import { StudentService } from '../../students/services/student.service';
import { FacultyService } from '../../faculty/services/faculty.service';
import { EnrollmentRepository } from '../../enrollments/repositories/enrollment.repository';
import { AnalyticsService } from '../../analytics/services/analytics.service';
import {
  StudentProfileReportRequestDTO,
  FacultyProfileReportRequestDTO,
  EnrollmentReportRequestDTO,
  AnalyticsReportRequestDTO,
  ReportGenerationResult,
} from '../types';

export class ReportService {
  constructor(
    private studentService: StudentService,
    private facultyService: FacultyService,
    private enrollmentRepository: EnrollmentRepository,
    private analyticsService: AnalyticsService
  ) {}

  /**
   * Generate student profile report (PDF)
   * Requirements: 17.1, 17.3
   */
  async generateStudentProfileReport(
    request: StudentProfileReportRequestDTO
  ): Promise<ReportGenerationResult> {
    // Fetch student profile data
    const profile = await this.studentService.getStudentProfile(request.student_id);

    // Create PDF document
    const doc = new PDFDocument({ margin: 50 });
    const chunks: Buffer[] = [];

    doc.on('data', (chunk) => chunks.push(chunk));

    // Header
    doc.fontSize(20).text('Student Profile Report', { align: 'center' });
    doc.moveDown();
    doc.fontSize(12).text(`Generated: ${new Date().toLocaleDateString()}`, { align: 'center' });
    doc.moveDown(2);

    // Student Information
    doc.fontSize(16).text('Personal Information', { underline: true });
    doc.moveDown();
    doc.fontSize(12);
    doc.text(`Student ID: ${profile.student_id}`);
    doc.text(`Name: ${profile.first_name} ${profile.middle_name || ''} ${profile.last_name}`);
    doc.text(`Email: ${profile.email}`);
    if (profile.phone) doc.text(`Phone: ${profile.phone}`);
    if (profile.program) doc.text(`Program: ${profile.program}`);
    if (profile.year_level) doc.text(`Year Level: ${profile.year_level}`);
    doc.text(`Status: ${profile.status}`);
    doc.moveDown(2);

    // Skills
    if (profile.skills.length > 0) {
      doc.fontSize(16).text('Skills', { underline: true });
      doc.moveDown();
      doc.fontSize(12);
      profile.skills.forEach((skill) => {
        doc.text(
          `• ${skill.skill_name}${
            skill.proficiency_level ? ` (${skill.proficiency_level})` : ''
          }${skill.years_of_experience ? ` - ${skill.years_of_experience} years` : ''}`
        );
      });
      doc.moveDown(2);
    }

    // Academic History
    if (profile.academic_history.length > 0) {
      doc.fontSize(16).text('Academic History', { underline: true });
      doc.moveDown();
      doc.fontSize(12);
      profile.academic_history.forEach((record) => {
        doc.text(
          `• ${record.subject_code} - ${record.subject_name}: ${record.grade} (${record.semester} ${record.academic_year})`
        );
      });
      doc.moveDown(2);
    }

    // Enrollments
    if (profile.enrollments.length > 0) {
      doc.fontSize(16).text('Current Enrollments', { underline: true });
      doc.moveDown();
      doc.fontSize(12);
      profile.enrollments.forEach((enrollment) => {
        doc.text(
          `• ${enrollment.subject_code} - ${enrollment.subject_name} (${enrollment.enrollment_status})`
        );
      });
      doc.moveDown(2);
    }

    // Affiliations
    if (profile.affiliations.length > 0) {
      doc.fontSize(16).text('Affiliations', { underline: true });
      doc.moveDown();
      doc.fontSize(12);
      profile.affiliations.forEach((affiliation) => {
        doc.text(
          `• ${affiliation.organization_name}${affiliation.role ? ` - ${affiliation.role}` : ''} (${
            affiliation.is_active ? 'Active' : 'Inactive'
          })`
        );
      });
      doc.moveDown(2);
    }

    // Violations
    if (profile.violations.length > 0) {
      doc.fontSize(16).text('Violations', { underline: true });
      doc.moveDown();
      doc.fontSize(12);
      profile.violations.forEach((violation) => {
        doc.text(
          `• ${violation.violation_type} (${violation.violation_date}): ${violation.resolution_status}`
        );
      });
      doc.moveDown(2);
    }

    // Finalize PDF
    doc.end();

    // Wait for PDF generation to complete
    const buffer = await new Promise<Buffer>((resolve) => {
      doc.on('end', () => {
        resolve(Buffer.concat(chunks));
      });
    });

    return {
      buffer,
      fileName: `student-profile-${profile.student_id}-${Date.now()}.pdf`,
      mimeType: 'application/pdf',
    };
  }

  /**
   * Generate faculty profile report (PDF)
   * Requirements: 17.1, 17.4
   */
  async generateFacultyProfileReport(
    request: FacultyProfileReportRequestDTO
  ): Promise<ReportGenerationResult> {
    // Fetch faculty profile data
    const faculty = await this.facultyService.getFaculty(request.faculty_id);

    // Create PDF document
    const doc = new PDFDocument({ margin: 50 });
    const chunks: Buffer[] = [];

    doc.on('data', (chunk) => chunks.push(chunk));

    // Header
    doc.fontSize(20).text('Faculty Profile Report', { align: 'center' });
    doc.moveDown();
    doc.fontSize(12).text(`Generated: ${new Date().toLocaleDateString()}`, { align: 'center' });
    doc.moveDown(2);

    // Faculty Information
    doc.fontSize(16).text('Personal Information', { underline: true });
    doc.moveDown();
    doc.fontSize(12);
    doc.text(`Faculty ID: ${faculty.faculty_id}`);
    doc.text(`Name: ${faculty.first_name} ${faculty.middle_name || ''} ${faculty.last_name}`);
    doc.text(`Email: ${faculty.email}`);
    if (faculty.phone) doc.text(`Phone: ${faculty.phone}`);
    doc.text(`Department: ${faculty.department}`);
    if (faculty.position) doc.text(`Position: ${faculty.position}`);
    if (faculty.specialization) doc.text(`Specialization: ${faculty.specialization}`);
    doc.text(`Status: ${faculty.status}`);
    doc.moveDown(2);

    // Finalize PDF
    doc.end();

    // Wait for PDF generation to complete
    const buffer = await new Promise<Buffer>((resolve) => {
      doc.on('end', () => {
        resolve(Buffer.concat(chunks));
      });
    });

    return {
      buffer,
      fileName: `faculty-profile-${faculty.faculty_id}-${Date.now()}.pdf`,
      mimeType: 'application/pdf',
    };
  }

  /**
   * Generate enrollment report (Excel)
   * Requirements: 17.2, 17.5
   */
  async generateEnrollmentReport(
    request: EnrollmentReportRequestDTO
  ): Promise<ReportGenerationResult> {
    // Fetch enrollment data
    const enrollments = await this.enrollmentRepository.findAll({
      semester: request.semester,
      academic_year: request.academic_year,
    });

    // Create Excel workbook
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Enrollments');

    // Define columns
    worksheet.columns = [
      { header: 'Subject Code', key: 'subject_code', width: 15 },
      { header: 'Subject Name', key: 'subject_name', width: 30 },
      { header: 'Semester', key: 'semester', width: 15 },
      { header: 'Academic Year', key: 'academic_year', width: 15 },
      { header: 'Status', key: 'status', width: 15 },
      { header: 'Enrolled At', key: 'enrolled_at', width: 20 },
    ];

    // Style header row
    worksheet.getRow(1).font = { bold: true };
    worksheet.getRow(1).fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FFD3D3D3' },
    };

    // Add data rows
    enrollments.data.forEach((enrollment) => {
      worksheet.addRow({
        subject_code: enrollment.instruction?.subject_code || 'N/A',
        subject_name: enrollment.instruction?.subject_name || 'N/A',
        semester: enrollment.enrollment.semester,
        academic_year: enrollment.enrollment.academic_year,
        status: enrollment.enrollment.enrollment_status,
        enrolled_at: enrollment.enrollment.enrolled_at?.toISOString() || 'N/A',
      });
    });

    // Generate buffer
    const buffer = await workbook.xlsx.writeBuffer();

    return {
      buffer: Buffer.from(buffer),
      fileName: `enrollment-report-${request.semester || 'all'}-${
        request.academic_year || 'all'
      }-${Date.now()}.xlsx`,
      mimeType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    };
  }

  /**
   * Generate analytics report (PDF)
   * Requirements: 17.1, 17.6
   */
  async generateAnalyticsReport(
    request: AnalyticsReportRequestDTO
  ): Promise<ReportGenerationResult> {
    // Create PDF document
    const doc = new PDFDocument({ margin: 50 });
    const chunks: Buffer[] = [];

    doc.on('data', (chunk) => chunks.push(chunk));

    // Header
    doc.fontSize(20).text('Analytics Report', { align: 'center' });
    doc.moveDown();
    doc.fontSize(12).text(`Generated: ${new Date().toLocaleDateString()}`, { align: 'center' });
    doc.fontSize(12).text(`Report Type: ${request.report_type.toUpperCase()}`, { align: 'center' });
    doc.moveDown(2);

    // Generate report based on type
    switch (request.report_type) {
      case 'gpa': {
        const data = await this.analyticsService.getGPADistribution();
        doc.fontSize(16).text('GPA Distribution', { underline: true });
        doc.moveDown();
        doc.fontSize(12);
        doc.text(`Average GPA: ${data.average_gpa}`);
        doc.text(`Median GPA: ${data.median_gpa}`);
        doc.text(`Highest GPA: ${data.highest_gpa}`);
        doc.text(`Lowest GPA: ${data.lowest_gpa}`);
        doc.text(`Total Students with Grades: ${data.total_students_with_grades}`);
        doc.moveDown();
        doc.text('GPA Ranges:');
        data.gpa_ranges.forEach((range) => {
          doc.text(`  ${range.range}: ${range.count} students (${range.percentage.toFixed(2)}%)`);
        });
        break;
      }

      case 'skills': {
        const data = await this.analyticsService.getSkillDistribution();
        doc.fontSize(16).text('Skills Distribution', { underline: true });
        doc.moveDown();
        doc.fontSize(12);
        doc.text(`Total Skills: ${data.total_skills}`);
        doc.text(`Unique Skills: ${data.unique_skills}`);
        doc.text(`Students with Skills: ${data.students_with_skills}`);
        doc.moveDown();
        doc.text('Top 10 Skills:');
        data.top_skills.forEach((skill, index) => {
          doc.text(
            `  ${index + 1}. ${skill.skill_name}: ${skill.count} (${skill.percentage.toFixed(2)}%)`
          );
        });
        break;
      }

      case 'violations': {
        const data = await this.analyticsService.getViolationTrends();
        doc.fontSize(16).text('Violation Trends', { underline: true });
        doc.moveDown();
        doc.fontSize(12);
        doc.text(`Total Violations: ${data.total_violations}`);
        doc.text(`Students with Violations: ${data.students_with_violations}`);
        doc.text(`Average Violations per Student: ${data.average_violations_per_student}`);
        doc.moveDown();
        doc.text('Violations by Type:');
        data.violations_by_type.forEach((type) => {
          doc.text(`  ${type.violation_type}: ${type.count} (${type.percentage.toFixed(2)}%)`);
        });
        break;
      }

      case 'research': {
        const data = await this.analyticsService.getResearchMetrics();
        doc.fontSize(16).text('Research Metrics', { underline: true });
        doc.moveDown();
        doc.fontSize(12);
        doc.text(`Total Research: ${data.total_research}`);
        doc.text(`Completed Research: ${data.completed_research}`);
        doc.text(`Ongoing Research: ${data.ongoing_research}`);
        doc.text(`Published Research: ${data.published_research}`);
        doc.text(`Total Authors: ${data.total_authors}`);
        doc.text(`Average Authors per Research: ${data.average_authors_per_research}`);
        doc.moveDown();
        doc.text('Research by Type:');
        data.research_by_type.forEach((type) => {
          doc.text(`  ${type.research_type}: ${type.count} (${type.percentage.toFixed(2)}%)`);
        });
        break;
      }

      case 'enrollments': {
        const data = await this.analyticsService.getEnrollmentTrends();
        doc.fontSize(16).text('Enrollment Trends', { underline: true });
        doc.moveDown();
        doc.fontSize(12);
        doc.text(`Total Enrollments: ${data.total_enrollments}`);
        doc.text(`Current Semester Enrollments: ${data.current_semester_enrollments}`);
        doc.text(`Enrollment Growth Rate: ${data.enrollment_growth_rate}%`);
        doc.moveDown();
        doc.text('Enrollments by Status:');
        data.enrollments_by_status.forEach((status) => {
          doc.text(`  ${status.status}: ${status.count} (${status.percentage.toFixed(2)}%)`);
        });
        break;
      }
    }

    // Finalize PDF
    doc.end();

    // Wait for PDF generation to complete
    const buffer = await new Promise<Buffer>((resolve) => {
      doc.on('end', () => {
        resolve(Buffer.concat(chunks));
      });
    });

    return {
      buffer,
      fileName: `analytics-${request.report_type}-${Date.now()}.pdf`,
      mimeType: 'application/pdf',
    };
  }
}
