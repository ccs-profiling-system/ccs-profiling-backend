/**
 * Research Module DTOs
 * Data Transfer Objects for research management
 * 
 * Requirements: 12.2
 */

/**
 * CreateResearchDTO - Input for creating new research
 */
export interface CreateResearchDTO {
  title: string;
  abstract?: string;
  research_type: 'thesis' | 'capstone' | 'publication';
  status?: 'ongoing' | 'completed' | 'published';
  start_date?: string;
  completion_date?: string;
  publication_url?: string;
  author_ids: string[];
  adviser_ids: string[];
}

/**
 * UpdateResearchDTO - Input for updating research
 */
export interface UpdateResearchDTO {
  title?: string;
  abstract?: string;
  research_type?: 'thesis' | 'capstone' | 'publication';
  status?: 'ongoing' | 'completed' | 'published';
  start_date?: string;
  completion_date?: string;
  publication_url?: string;
}

/**
 * ResearchResponseDTO - Output returned to clients
 */
export interface ResearchResponseDTO {
  id: string;
  title: string;
  abstract?: string;
  research_type: string;
  status: string;
  start_date?: string;
  completion_date?: string;
  publication_url?: string;
  authors: Array<{
    id: string;
    student_id: string;
    name: string;
    author_order: number;
  }>;
  advisers: Array<{
    id: string;
    faculty_id: string;
    name: string;
    adviser_role: string;
  }>;
  created_at: string;
  updated_at: string;
}

/**
 * ResearchListResponseDTO - Paginated list output
 */
export interface ResearchListResponseDTO {
  data: ResearchResponseDTO[];
  meta: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

/**
 * AddAuthorDTO - Input for adding authors
 */
export interface AddAuthorDTO {
  student_id: string;
  author_order: number;
}

/**
 * AddAdviserDTO - Input for adding advisers
 */
export interface AddAdviserDTO {
  faculty_id: string;
  adviser_role?: string;
}

/**
 * ResearchFilters - Query filters for listing research
 */
export interface ResearchFilters {
  search?: string;
  research_type?: string;
  status?: string;
  page?: number;
  limit?: number;
}
