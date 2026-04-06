/**
 * Search Module DTOs
 * Data Transfer Objects for search operations
 * 
 * Requirements: 18.1, 18.2, 18.3, 18.4
 */

/**
 * SearchRequestDTO - Input for search operations
 */
export interface SearchRequestDTO {
  q: string; // Search query
  type?: 'students' | 'faculty' | 'events' | 'research'; // Entity type filter
  page?: number;
  limit?: number;
}

/**
 * StudentSearchResultDTO - Student search result
 * Requirement: 18.1
 */
export interface StudentSearchResultDTO {
  id: string;
  student_id: string;
  first_name: string;
  last_name: string;
  middle_name?: string;
  email: string;
  program?: string;
  year_level?: number;
  status: string;
}

/**
 * FacultySearchResultDTO - Faculty search result
 * Requirement: 18.2
 */
export interface FacultySearchResultDTO {
  id: string;
  faculty_id: string;
  first_name: string;
  last_name: string;
  middle_name?: string;
  email: string;
  department: string;
  position?: string;
  status: string;
}

/**
 * EventSearchResultDTO - Event search result
 * Requirement: 18.3
 */
export interface EventSearchResultDTO {
  id: string;
  event_name: string;
  event_type: string;
  description?: string;
  event_date: string;
  location?: string;
}

/**
 * ResearchSearchResultDTO - Research search result
 * Requirement: 18.4
 */
export interface ResearchSearchResultDTO {
  id: string;
  title: string;
  abstract?: string;
  research_type: string;
  status: string;
  authors: string[]; // Array of author names
}

/**
 * SearchResponseDTO - Output returned to clients
 */
export interface SearchResponseDTO {
  students?: StudentSearchResultDTO[];
  faculty?: FacultySearchResultDTO[];
  events?: EventSearchResultDTO[];
  research?: ResearchSearchResultDTO[];
  meta: {
    total: number;
    query: string;
    type?: string;
  };
}

/**
 * EntitySearchResponseDTO - Generic entity search response
 */
export interface EntitySearchResponseDTO<T> {
  data: T[];
  meta: {
    total: number;
    query: string;
  };
}
