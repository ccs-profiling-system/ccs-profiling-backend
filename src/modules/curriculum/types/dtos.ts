/**
 * Data Transfer Objects for Curriculum Module
 */

export interface CreateCurriculumDto {
  code: string;
  name: string;
  description?: string;
  program: string;
  year: string;
  effectiveDate: string;
  status?: 'draft' | 'active' | 'inactive';
}

export interface UpdateCurriculumDto {
  code?: string;
  name?: string;
  description?: string;
  program?: string;
  year?: string;
  totalUnits?: number;
  status?: 'draft' | 'active' | 'inactive';
  effectiveDate?: string;
}

export interface ListCurriculumQueryDto {
  search?: string;
  program?: string;
  year?: string;
  status?: 'draft' | 'active' | 'inactive';
  page?: number;
  limit?: number;
}

export interface CurriculumResponseDto {
  id: string;
  code: string;
  name: string;
  description?: string | null;
  program: string;
  year: string;
  totalUnits: number;
  status: string;
  effectiveDate: string;
  subjects?: any[];
  created_at: Date;
  updated_at: Date;
}
