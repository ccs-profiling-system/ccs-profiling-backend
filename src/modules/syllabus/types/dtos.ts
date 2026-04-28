/**
 * Data Transfer Objects for Syllabus Module
 */

export interface CreateSyllabusDto {
  subjectId: string;
  title: string;
  description?: string;
  contentType: 'file' | 'link';
  externalLink?: string;
  file?: Express.Multer.File;
}

export interface UpdateSyllabusDto {
  title?: string;
  description?: string;
  contentType?: 'file' | 'link';
  externalLink?: string;
  file?: Express.Multer.File;
}

export interface SyllabusResponseDto {
  id: string;
  subjectId: string;
  title: string;
  description?: string | null;
  contentType: string;
  fileUrl?: string | null;
  fileName?: string | null;
  fileSize?: number | null;
  fileType?: string | null;
  externalLink?: string | null;
  created_at: Date;
  updated_at: Date;
}
