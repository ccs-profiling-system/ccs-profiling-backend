/**
 * Faculty Module DTOs
 * Data Transfer Objects for faculty management
 * 
 */

/**
 * CreateFacultyDTO - Input for creating new faculty
 * 
 * Note: faculty_id is now system-generated and should not be provided by clients.
 * The system will automatically generate a human-readable ID in the format F-YYYY-0001.
 */
export interface CreateFacultyDTO {
  faculty_id?: string; // System-generated, optional for backward compatibility
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

/**
 * FacultyStatsDTO - Faculty statistics
 */
export interface FacultyStatsDTO {
  total_faculty: number;
  active_faculty: number;
  inactive_faculty: number;
  faculty_by_department: Record<string, number>;
  faculty_by_position: Record<string, number>;
  faculty_by_status: Record<string, number>;
  recent_additions: number; // Last 30 days
  generated_at: string;
}
