/**
 * Academic History Module DTOs
 * Data Transfer Objects for academic history management
 * 
 */

/**
 * CreateAcademicHistoryDTO - Input for creating new academic history record
 */
export interface CreateAcademicHistoryDTO {
  student_id: string;
  subject_code: string;
  subject_name: string;
  grade: number;
  semester: '1st' | '2nd' | 'summer';
  academic_year: string;
  credits: number;
  remarks?: 'passed' | 'failed' | 'incomplete';
}

/**
 * UpdateAcademicHistoryDTO - Input for updating academic history record
 */
export interface UpdateAcademicHistoryDTO {
  subject_code?: string;
  subject_name?: string;
  grade?: number;
  semester?: '1st' | '2nd' | 'summer';
  academic_year?: string;
  credits?: number;
  remarks?: 'passed' | 'failed' | 'incomplete';
}

/**
 * AcademicHistoryResponseDTO - Output returned to clients
 */
export interface AcademicHistoryResponseDTO {
  id: string;
  student_id: string;
  subject_code: string;
  subject_name: string;
  grade: number;
  semester: string;
  academic_year: string;
  credits: number;
  remarks?: string;
  created_at: string;
  updated_at: string;
}

/**
 * AcademicHistoryListResponseDTO - Paginated list output
 */
export interface AcademicHistoryListResponseDTO {
  data: AcademicHistoryResponseDTO[];
  meta: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

/**
 * AcademicHistoryFilters - Query filters for listing academic history
 */
export interface AcademicHistoryFilters {
  student_id?: string;
  semester?: string;
  academic_year?: string;
  page?: number;
  limit?: number;
}

/**
 * GPAResponseDTO - GPA calculation result
 */
export interface GPAResponseDTO {
  student_id: string;
  gpa: number;
  total_credits: number;
  total_grade_points: number;
  records_count: number;
}
