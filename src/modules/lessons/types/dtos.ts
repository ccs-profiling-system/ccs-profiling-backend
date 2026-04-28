/**
 * Data Transfer Objects for Lessons Module
 */

export interface CreateLessonDto {
  subjectId: string;
  week: number;
  title: string;
  description?: string;
  type: 'lecture' | 'laboratory' | 'discussion' | 'examination' | 'project';
  contentType: 'file' | 'link';
  externalLink?: string;
  file?: Express.Multer.File;
}

export interface UpdateLessonDto {
  week?: number;
  title?: string;
  description?: string;
  type?: 'lecture' | 'laboratory' | 'discussion' | 'examination' | 'project';
  contentType?: 'file' | 'link';
  externalLink?: string;
  file?: Express.Multer.File;
}

export interface ListLessonsQueryDto {
  subjectId?: string;
  week?: number;
  type?: 'lecture' | 'laboratory' | 'discussion' | 'examination' | 'project';
}

export interface LessonResponseDto {
  id: string;
  subjectId: string;
  week: number;
  title: string;
  description?: string | null;
  type: string;
  contentType: string;
  fileUrl?: string | null;
  fileName?: string | null;
  fileSize?: number | null;
  externalLink?: string | null;
  created_at: Date;
  updated_at: Date;
}
