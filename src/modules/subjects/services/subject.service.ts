import { SubjectRepository } from '../repositories/subject.repository';
import { CreateSubjectDto, UpdateSubjectDto, ListSubjectsQueryDto } from '../types/dtos';
import { AppError } from '../../../shared/utils/appError';

/**
 * Subject Service
 * Business logic for subject management
 */
export class SubjectService {
  constructor(private subjectRepository: SubjectRepository) {}

  /**
   * List all subjects with pagination and filters
   */
  async listSubjects(query: ListSubjectsQueryDto) {
    return await this.subjectRepository.findAll(query);
  }

  /**
   * Get subject by ID with syllabus and lessons
   */
  async getSubjectById(id: string) {
    const subject = await this.subjectRepository.findById(id);

    if (!subject) {
      throw new AppError('Subject not found', 404);
    }

    return subject;
  }

  /**
   * Create new subject
   */
  async createSubject(data: CreateSubjectDto) {
    // Check if code already exists
    const existing = await this.subjectRepository.findByCode(data.code);
    if (existing) {
      throw new AppError('Subject with this code already exists', 409);
    }

    const newSubject = await this.subjectRepository.create({
      code: data.code,
      name: data.name,
      units: data.units,
      semester: data.semester,
      year_level: data.yearLevel,
      description: data.description,
      prerequisites: data.prerequisites || [],
      corequisites: data.corequisites || [],
      type: data.type,
      lecture_hours: data.lectureHours || 0,
      laboratory_hours: data.laboratoryHours || 0,
      objectives: data.objectives || [],
      topics: data.topics || [],
      curriculum_id: data.curriculumId,
    });

    return newSubject;
  }

  /**
   * Update subject by ID
   */
  async updateSubject(id: string, data: UpdateSubjectDto) {
    // Check if subject exists
    const existing = await this.subjectRepository.findById(id);
    if (!existing) {
      throw new AppError('Subject not found', 404);
    }

    // If updating code, check for duplicates
    if (data.code && data.code !== existing.code) {
      const duplicate = await this.subjectRepository.findByCode(data.code);
      if (duplicate) {
        throw new AppError('Subject with this code already exists', 409);
      }
    }

    const updateData: any = {};
    if (data.code) updateData.code = data.code;
    if (data.name) updateData.name = data.name;
    if (data.units !== undefined) updateData.units = data.units;
    if (data.semester !== undefined) updateData.semester = data.semester;
    if (data.yearLevel !== undefined) updateData.year_level = data.yearLevel;
    if (data.description !== undefined) updateData.description = data.description;
    if (data.prerequisites !== undefined) updateData.prerequisites = data.prerequisites;
    if (data.corequisites !== undefined) updateData.corequisites = data.corequisites;
    if (data.type) updateData.type = data.type;
    if (data.lectureHours !== undefined) updateData.lecture_hours = data.lectureHours;
    if (data.laboratoryHours !== undefined) updateData.laboratory_hours = data.laboratoryHours;
    if (data.objectives !== undefined) updateData.objectives = data.objectives;
    if (data.topics !== undefined) updateData.topics = data.topics;
    if (data.curriculumId) updateData.curriculum_id = data.curriculumId;

    const updated = await this.subjectRepository.update(id, updateData);

    if (!updated) {
      throw new AppError('Failed to update subject', 500);
    }

    return updated;
  }

  /**
   * Delete subject by ID (soft delete)
   */
  async deleteSubject(id: string) {
    const existing = await this.subjectRepository.findById(id);
    if (!existing) {
      throw new AppError('Subject not found', 404);
    }

    const deleted = await this.subjectRepository.softDelete(id);

    if (!deleted) {
      throw new AppError('Failed to delete subject', 500);
    }

    return { message: 'Subject deleted successfully' };
  }

  /**
   * Restore soft-deleted subject
   */
  async restoreSubject(id: string) {
    const restored = await this.subjectRepository.restore(id);

    if (!restored) {
      throw new AppError('Subject not found or already active', 404);
    }

    return restored;
  }

  /**
   * Permanently delete subject
   */
  async permanentDeleteSubject(id: string) {
    const deleted = await this.subjectRepository.permanentDelete(id);

    if (!deleted) {
      throw new AppError('Subject not found', 404);
    }

    return { message: 'Subject permanently deleted' };
  }

  /**
   * Get deleted subjects
   */
  async getDeletedSubjects() {
    return await this.subjectRepository.findDeleted();
  }
}
