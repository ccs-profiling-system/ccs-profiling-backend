/**
 * Skills Module DTOs
 * Data Transfer Objects for skills management
 * 
 * Requirements: 5.2
 */

/**
 * CreateSkillDTO - Input for creating new skill record
 */
export interface CreateSkillDTO {
  student_id: string;
  skill_name: string;
  proficiency_level?: 'beginner' | 'intermediate' | 'advanced' | 'expert';
  years_of_experience?: number;
}

/**
 * UpdateSkillDTO - Input for updating skill record
 */
export interface UpdateSkillDTO {
  skill_name?: string;
  proficiency_level?: 'beginner' | 'intermediate' | 'advanced' | 'expert';
  years_of_experience?: number;
}

/**
 * SkillResponseDTO - Output returned to clients
 */
export interface SkillResponseDTO {
  id: string;
  student_id: string;
  skill_name: string;
  proficiency_level?: string;
  years_of_experience?: number;
  created_at: string;
  updated_at: string;
}

/**
 * SkillListResponseDTO - Paginated list output
 */
export interface SkillListResponseDTO {
  data: SkillResponseDTO[];
  meta: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

/**
 * SkillFilters - Query filters for listing skills
 */
export interface SkillFilters {
  student_id?: string;
  proficiency_level?: string;
  page?: number;
  limit?: number;
}
