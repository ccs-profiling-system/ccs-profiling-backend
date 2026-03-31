/**
 * Faculty Module DTOs
 * Data Transfer Objects for faculty management
 * 
 * Requirements: 3.2, 3.4
 */

/**
 * CreateFacultyDTO - Input for creating new faculty
 */
export interface CreateFacultyDTO {
  faculty_id: string;
  first_name: string;
  last_name: string;
  middle_name?: string;
  email: string;
  phone?: string;
  department: string;
  position?: string;
  specialization?: string;
  create_user_account?: boolean;
}

/**
 * UpdateFacultyDTO - Input for updating faculty
 */
export interface UpdateFacultyDTO {
  first_name?: string;
  last_name?: string;
  middle_name?: string;
  email?: string;
  phone?: string;
  department?: string;
  position?: string;
  specialization?: string;
  status?: 'active' | 'inactive';
}

/**
 * FacultyResponseDTO - Output returned to clients
 */
export interface FacultyResponseDTO {
  id: string;
  faculty_id: string;
  first_name: string;
  last_name: string;
  middle_name?: string;
  email: string;
  phone?: string;
  department: string;
  position?: string;
  specialization?: string;
  status: string;
  created_at: string;
  updated_at: string;
}

/**
 * FacultyListResponseDTO - Paginated list output
 */
export interface FacultyListResponseDTO {
  data: FacultyResponseDTO[];
  meta: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

/**
 * FacultyFilters - Query filters for listing faculty
 */
export interface FacultyFilters {
  search?: string;
  department?: string;
  status?: string;
  page?: number;
  limit?: number;
}
