/**
 * Reports Module DTOs
 * Data Transfer Objects for report generation
 * 
 */

/**
 * ReportRequestDTO - Input for generating reports
 */
export interface StudentProfileReportRequestDTO {
  student_id: string;
  format?: 'pdf'; // Only PDF for student profiles
}

export interface FacultyProfileReportRequestDTO {
  faculty_id: string;
  format?: 'pdf'; // Only PDF for faculty profiles
}

export interface EnrollmentReportRequestDTO {
  semester?: string;
  academic_year?: string;
  program?: string;
  format?: 'excel'; // Only Excel for enrollment reports
}

export interface AnalyticsReportRequestDTO {
  report_type: 'gpa' | 'skills' | 'violations' | 'research' | 'enrollments';
  start_date?: string;
  end_date?: string;
  format?: 'pdf'; // Only PDF for analytics reports
}

/**
 * ReportResponseDTO - Output returned to clients
 */
export interface ReportResponseDTO {
  id: string;
  report_type: string;
  format: string;
  file_name: string;
  file_size: number;
  generated_at: string;
  download_url?: string;
}

/**
 * Report generation result (internal)
 */
export interface ReportGenerationResult {
  buffer: Buffer;
  fileName: string;
  mimeType: string;
}
