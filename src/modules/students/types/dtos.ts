/**
 * Student Module DTOs
 * Data Transfer Objects for student management
 * 
 * Requirements: 2.3, 2.5, 10.1
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
  // Note: Related data (skills, violations, affiliations, etc.) 
  // will be added when those modules are implemented
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
