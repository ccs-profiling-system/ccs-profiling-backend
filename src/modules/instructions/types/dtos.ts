/**
 * Instruction Module DTOs
 * Data Transfer Objects for instruction management
 * 
 * Requirements: 14.2
 */

/**
 * CreateInstructionDTO - Input for creating new instruction
 */
export interface CreateInstructionDTO {
  subject_code: string;
  subject_name: string;
  description?: string;
  credits: number;
  curriculum_year: string;
}

/**
 * UpdateInstructionDTO - Input for updating instruction
 */
export interface UpdateInstructionDTO {
  subject_code?: string;
  subject_name?: string;
  description?: string;
  credits?: number;
  curriculum_year?: string;
}

/**
 * InstructionResponseDTO - Output returned to clients
 */
export interface InstructionResponseDTO {
  id: string;
  subject_code: string;
  subject_name: string;
  description?: string;
  credits: number;
  curriculum_year: string;
  created_at: string;
  updated_at: string;
}

/**
 * InstructionListResponseDTO - Paginated list output
 */
export interface InstructionListResponseDTO {
  data: InstructionResponseDTO[];
  meta: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

/**
 * InstructionFilters - Query filters for listing instructions
 */
export interface InstructionFilters {
  search?: string;
  subject_code?: string;
  curriculum_year?: string;
  page?: number;
  limit?: number;
}
