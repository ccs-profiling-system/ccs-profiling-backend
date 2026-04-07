/**
 * Student Module DTOs
 * Data Transfer Objects for student management
 * 
 */

/**
 * CreateStudentDTO - Input for creating new students
 * 
 * Note: student_id is now system-generated and should not be provided by clients.
 * The system will automatically generate a human-readable ID in the format S-YYYY-0001.
 */
export interface CreateStudentDTO {
  student_id?: string; // System-generated, optional for backward compatibility
  first_name: string;
  last_name: string;
  middle_name?: string;
  email: string;
  phone?: string;
  date_of_birth?: string;
  address?: string;
  year_level?: number;
  program?: string;
  create_user_account?: boolean;
}

/**
 * UpdateStudentDTO - Input for updating students
 */
export interface UpdateStudentDTO {
  first_name?: string;
  last_name?: string;
  middle_name?: string;
  email?: string;
  phone?: string;
  date_of_birth?: string;
  address?: string;
  year_level?: number;
  program?: string;
  status?: 'active' | 'inactive' | 'graduated';
}

/**
 * StudentResponseDTO - Output returned to clients
 */
export interface StudentResponseDTO {
  id: string;
  student_id: string;
  first_name: string;
  last_name: string;
  middle_name?: string;
  email: string;
  phone?: string;
  date_of_birth?: string;
  address?: string;
  year_level?: number;
  program?: string;
  status: string;
  created_at: string;
  updated_at: string;
}

/**
 * StudentListResponseDTO - Paginated list output
 */
export interface StudentListResponseDTO {
  data: StudentResponseDTO[];
  meta: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

/**
 * StudentProfileDTO - Aggregated profile with related data
 * Used for complete student profile view
 */
export interface StudentProfileDTO extends StudentResponseDTO {
  skills: Array<{
    id: string;
    skill_name: string;
    proficiency_level?: string;
    years_of_experience?: number;
    created_at: string;
    updated_at: string;
  }>;
  violations: Array<{
    id: string;
    violation_type: string;
    description: string;
    violation_date: string;
    resolution_status: string;
    resolution_notes?: string;
    resolved_at?: string;
    created_at: string;
    updated_at: string;
  }>;
  affiliations: Array<{
    id: string;
    organization_name: string;
    role?: string;
    start_date: string;
    end_date?: string;
    is_active: boolean;
    created_at: string;
    updated_at: string;
  }>;
  academic_history: Array<{
    id: string;
    subject_code: string;
    subject_name: string;
    grade: number;
    semester: string;
    academic_year: string;
    credits: number;
    remarks?: string;
    created_at: string;
    updated_at: string;
  }>;
  enrollments: Array<{
    id: string;
    instruction_id: string;
    subject_code: string;
    subject_name: string;
    enrollment_status: string;
    semester: string;
    academic_year: string;
    enrolled_at: string;
    created_at: string;
    updated_at: string;
  }>;
}

/**
 * StudentFilters - Query filters for listing students
 */
export interface StudentFilters {
  search?: string;
  program?: string;
  year_level?: number;
  status?: string;
  page?: number;
  limit?: number;
}

/**
 * StudentStatsDTO - Student statistics
 */
export interface StudentStatsDTO {
  total_students: number;
  active_students: number;
  inactive_students: number;
  graduated_students: number;
  students_by_program: Record<string, number>;
  students_by_year_level: Record<string, number>;
  students_by_status: Record<string, number>;
  recent_enrollments: number; // Last 30 days
  average_gpa?: number;
  generated_at: string;
}
