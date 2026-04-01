/**
 * Enrollment Module DTOs
 * Data Transfer Objects for enrollment management
 * 
 * Requirements: 9.2
 */

/**
 * CreateEnrollmentDTO - Input for creating new enrollment
 */
export interface CreateEnrollmentDTO {
  student_id: string;
  instruction_id: string;
  semester: '1st' | '2nd' | 'summer';
  academic_year: string;
}

/**
 * UpdateEnrollmentDTO - Input for updating enrollment
 */
export interface UpdateEnrollmentDTO {
  enrollment_status?: 'enrolled' | 'dropped' | 'completed';
}

/**
 * EnrollmentResponseDTO - Output returned to clients
 */
export interface EnrollmentResponseDTO {
  id: string;
  student_id: string;
  instruction_id: string;
  subject_code: string;
  subject_name: string;
  enrollment_status: string;
  semester: string;
  academic_year: string;
  enrolled_at: string;
  created_at: string;
  updated_at: string;
}

/**
 * EnrollmentListResponseDTO - Paginated list output
 */
export interface EnrollmentListResponseDTO {
  data: EnrollmentResponseDTO[];
  meta: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

/**
 * EnrollmentFilters - Query filters for listing enrollments
 */
export interface EnrollmentFilters {
  student_id?: string;
  instruction_id?: string;
  semester?: string;
  academic_year?: string;
  enrollment_status?: string;
  page?: number;
  limit?: number;
}
