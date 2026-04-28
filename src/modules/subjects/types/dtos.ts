/**
 * Data Transfer Objects for Subjects Module
 */

export interface CreateSubjectDto {
  code: string;
  name: string;
  units: number;
  semester: number;
  yearLevel: number;
  description?: string;
  prerequisites?: string[];
  corequisites?: string[];
  type: 'core' | 'elective' | 'major' | 'minor' | 'general_education';
  lectureHours?: number;
  laboratoryHours?: number;
  objectives?: string[];
  topics?: string[];
  curriculumId: string;
}

export interface UpdateSubjectDto {
  code?: string;
  name?: string;
  units?: number;
  semester?: number;
  yearLevel?: number;
  description?: string;
  prerequisites?: string[];
  corequisites?: string[];
  type?: 'core' | 'elective' | 'major' | 'minor' | 'general_education';
  lectureHours?: number;
  laboratoryHours?: number;
  objectives?: string[];
  topics?: string[];
  curriculumId?: string;
}

export interface ListSubjectsQueryDto {
  search?: string;
  curriculumId?: string;
  semester?: number;
  yearLevel?: number;
  type?: 'core' | 'elective' | 'major' | 'minor' | 'general_education';
  page?: number;
  limit?: number;
}

export interface SubjectResponseDto {
  id: string;
  code: string;
  name: string;
  units: number;
  semester: number;
  yearLevel: number;
  description?: string | null;
  prerequisites?: string[] | null;
  corequisites?: string[] | null;
  type: string;
  lectureHours: number;
  laboratoryHours: number;
  objectives?: string[] | null;
  topics?: string[] | null;
  curriculumId: string;
  syllabus?: any;
  lessons?: any[];
  created_at: Date;
  updated_at: Date;
}
