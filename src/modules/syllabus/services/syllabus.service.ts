import path from 'path';
import { SyllabusRepository } from '../repositories/syllabus.repository';
import { CreateSyllabusDto, UpdateSyllabusDto } from '../types/dtos';
import { AppError } from '../../../shared/utils/appError';
import { deleteUploadedFile, getFileUrl } from '../../../shared/middleware/upload.middleware';

/**
 * Syllabus Service
 * Business logic for syllabus management
 */
export class SyllabusService {
  constructor(private syllabusRepository: SyllabusRepository) {}

  /**
   * Get syllabus by subject ID
   */
  async getSyllabusBySubjectId(subjectId: string) {
    const syllabus = await this.syllabusRepository.findBySubjectId(subjectId);

    if (!syllabus) {
      throw new AppError('Syllabus not found for this subject', 404);
    }

    return syllabus;
  }

  /**
   * Create or update syllabus for a subject
   */
  async createSyllabus(data: CreateSyllabusDto, file?: Express.Multer.File) {
    // Check if syllabus already exists for this subject
    const existing = await this.syllabusRepository.findBySubjectId(data.subjectId);
    if (existing) {
      throw new AppError('Syllabus already exists for this subject. Use update instead.', 409);
    }

    let fileUrl: string | undefined;
    let fileName: string | undefined;
    let fileSize: number | undefined;
    let fileType: string | undefined;

    if (data.contentType === 'file') {
      if (!file) {
        throw new AppError('File is required when content type is "file"', 400);
      }

      fileUrl = getFileUrl(file.filename, 'syllabus');
      fileName = file.originalname;
      fileSize = file.size;
      fileType = file.mimetype;
    }

    const newSyllabus = await this.syllabusRepository.create({
      subject_id: data.subjectId,
      title: data.title,
      description: data.description,
      content_type: data.contentType,
      file_url: fileUrl,
      file_name: fileName,
      file_size: fileSize,
      file_type: fileType,
      external_link: data.externalLink,
    });

    return newSyllabus;
  }

  /**
   * Update syllabus for a subject
   */
  async updateSyllabus(subjectId: string, data: UpdateSyllabusDto, file?: Express.Multer.File) {
    const existing = await this.syllabusRepository.findBySubjectId(subjectId);
    if (!existing) {
      throw new AppError('Syllabus not found for this subject', 404);
    }

    const updateData: any = {};

    if (data.title) updateData.title = data.title;
    if (data.description !== undefined) updateData.description = data.description;
    if (data.contentType) updateData.content_type = data.contentType;
    if (data.externalLink !== undefined) updateData.external_link = data.externalLink;

    // Handle file upload
    if (file) {
      // Delete old file if exists
      if (existing.file_url) {
        const oldFilePath = path.join(process.cwd(), existing.file_url);
        deleteUploadedFile(oldFilePath);
      }

      updateData.file_url = getFileUrl(file.filename, 'syllabus');
      updateData.file_name = file.originalname;
      updateData.file_size = file.size;
      updateData.file_type = file.mimetype;
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
      updateData.file_type = null;
    }

    const updated = await this.syllabusRepository.updateBySubjectId(subjectId, updateData);

    if (!updated) {
      throw new AppError('Failed to update syllabus', 500);
    }

    return updated;
  }

  /**
   * Delete syllabus for a subject
   */
  async deleteSyllabus(subjectId: string) {
    const existing = await this.syllabusRepository.findBySubjectId(subjectId);
    if (!existing) {
      throw new AppError('Syllabus not found for this subject', 404);
    }

    // Delete file if exists
    if (existing.file_url) {
      const filePath = path.join(process.cwd(), existing.file_url);
      deleteUploadedFile(filePath);
    }

    const deleted = await this.syllabusRepository.softDeleteBySubjectId(subjectId);

    if (!deleted) {
      throw new AppError('Failed to delete syllabus', 500);
    }

    return { message: 'Syllabus deleted successfully' };
  }
}
