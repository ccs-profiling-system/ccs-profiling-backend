/**
 * Violations Module DTOs
 * Data Transfer Objects for violations management
 * 
 */

/**
 * CreateViolationDTO - Input for creating new violation record
 */
export interface CreateViolationDTO {
  student_id: string;
  violation_type: string;
  description: string;
  violation_date: string;
}

/**
 * UpdateViolationDTO - Input for updating violation record
 */
export interface UpdateViolationDTO {
  violation_type?: string;
  description?: string;
  violation_date?: string;
  resolution_status?: 'pending' | 'resolved' | 'dismissed';
  resolution_notes?: string;
}

/**
 * ViolationResponseDTO - Output returned to clients
 */
export interface ViolationResponseDTO {
  id: string;
  student_id: string;
  violation_type: string;
  description: string;
  violation_date: string;
  resolution_status: string;
  resolution_notes?: string;
  resolved_at?: string;
  created_at: string;
  updated_at: string;
}

/**
 * ViolationListResponseDTO - Paginated list output
 */
export interface ViolationListResponseDTO {
  data: ViolationResponseDTO[];
  meta: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

/**
 * ViolationFilters - Query filters for listing violations
 */
export interface ViolationFilters {
  student_id?: string;
  resolution_status?: string;
  page?: number;
  limit?: number;
}
