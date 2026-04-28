import path from 'path';
import { LessonRepository } from '../repositories/lesson.repository';
import { CreateLessonDto, UpdateLessonDto } from '../types/dtos';
import { AppError } from '../../../shared/utils/appError';
import { deleteUploadedFile, getFileUrl } from '../../../shared/middleware/upload.middleware';

/**
 * Lesson Service
 * Business logic for lesson management
 */
export class LessonService {
  constructor(private lessonRepository: LessonRepository) {}

  /**
   * Get all lessons for a subject
   */
  async getLessonsBySubjectId(subjectId: string) {
    return await this.lessonRepository.findBySubjectId(subjectId);
  }

  /**
   * Get lesson by ID
   */
  async getLessonById(id: string) {
    const lesson = await this.lessonRepository.findById(id);

    if (!lesson) {
      throw new AppError('Lesson not found', 404);
    }

    return lesson;
  }

  /**
   * Create new lesson
   */
  async createLesson(data: CreateLessonDto, file?: Express.Multer.File) {
    let fileUrl: string | undefined;
    let fileName: string | undefined;
    let fileSize: number | undefined;

    if (data.contentType === 'file') {
      if (!file) {
        throw new AppError('File is required when content type is "file"', 400);
      }

      fileUrl = getFileUrl(file.filename, 'lessons');
      fileName = file.originalname;
      fileSize = file.size;
    }

    const newLesson = await this.lessonRepository.create({
      subject_id: data.subjectId,
      week: data.week,
      title: data.title,
      description: data.description,
      type: data.type,
      content_type: data.contentType,
      file_url: fileUrl,
      file_name: fileName,
      file_size: fileSize,
      external_link: data.externalLink,
    });

    return newLesson;
  }

  /**
   * Update lesson
   */
  async updateLesson(id: string, data: UpdateLessonDto, file?: Express.Multer.File) {
    const existing = await this.lessonRepository.findById(id);
    if (!existing) {
      throw new AppError('Lesson not found', 404);
    }

    const updateData: any = {};

    if (data.week !== undefined) updateData.week = data.week;
    if (data.title) updateData.title = data.title;
    if (data.description !== undefined) updateData.description = data.description;
    if (data.type) updateData.type = data.type;
    if (data.contentType) updateData.content_type = data.contentType;
    if (data.externalLink !== undefined) updateData.external_link = data.externalLink;

    // Handle file upload
    if (file) {
      // Delete old file if exists
      if (existing.file_url) {
        const oldFilePath = path.join(process.cwd(), existing.file_url);
        deleteUploadedFile(oldFilePath);
      }

      updateData.file_url = getFileUrl(file.filename, 'lessons');
      updateData.file_name = file.originalname;
      updateData.file_size = file.size;
      updateData.content_type = 'file';
    }

    // If switching to link, clear file data
    if (data.contentType === 'link') {
      if (existing.file_url) {
        const oldFilePath = path.join(process.cwd(), existing.file_url);
        deleteUploadedFile(oldFilePath);
      }
      updateData.file_url = null;
      updateData.file_name = null;
      updateData.file_size = null;
    }

    const updated = await this.lessonRepository.update(id, updateData);

    if (!updated) {
      throw new AppError('Failed to update lesson', 500);
    }

    return updated;
  }

  /**
   * Delete lesson
   */
  async deleteLesson(id: string) {
    const existing = await this.lessonRepository.findById(id);
    if (!existing) {
      throw new AppError('Lesson not found', 404);
    }

    // Delete file if exists
    if (existing.file_url) {
      const filePath = path.join(process.cwd(), existing.file_url);
      deleteUploadedFile(filePath);
    }

    const deleted = await this.lessonRepository.softDelete(id);

    if (!deleted) {
      throw new AppError('Failed to delete lesson', 500);
    }

    return { message: 'Lesson deleted successfully' };
  }
}
