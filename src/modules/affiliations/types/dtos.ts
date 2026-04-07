/**
 * Affiliations Module DTOs
 * Data Transfer Objects for affiliations management
 * 
 */

/**
 * CreateAffiliationDTO - Input for creating new affiliation record
 */
export interface CreateAffiliationDTO {
  student_id: string;
  organization_name: string;
  role?: string;
  start_date: string;
  end_date?: string;
}

/**
 * UpdateAffiliationDTO - Input for updating affiliation record
 */
export interface UpdateAffiliationDTO {
  organization_name?: string;
  role?: string;
  start_date?: string;
  end_date?: string;
  is_active?: boolean;
}

/**
 * AffiliationResponseDTO - Output returned to clients
 */
export interface AffiliationResponseDTO {
  id: string;
  student_id: string;
  organization_name: string;
  role?: string;
  start_date: string;
  end_date?: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

/**
 * AffiliationListResponseDTO - Paginated list output
 */
export interface AffiliationListResponseDTO {
  data: AffiliationResponseDTO[];
  meta: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

/**
 * AffiliationFilters - Query filters for listing affiliations
 */
export interface AffiliationFilters {
  student_id?: string;
  is_active?: boolean;
  page?: number;
  limit?: number;
}
