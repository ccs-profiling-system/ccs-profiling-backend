import { CurriculumRepository } from '../repositories/curriculum.repository';
import { CreateCurriculumDto, UpdateCurriculumDto, ListCurriculumQueryDto } from '../types/dtos';
import { AppError } from '../../../shared/utils/appError';

/**
 * Curriculum Service
 * Business logic for curriculum management
 */
export class CurriculumService {
  constructor(private curriculumRepository: CurriculumRepository) {}

  /**
   * List all curriculum with pagination and filters
   */
  async listCurriculum(query: ListCurriculumQueryDto) {
    return await this.curriculumRepository.findAll(query);
  }

  /**
   * Get curriculum by ID
   */
  async getCurriculumById(id: string) {
    const curriculum = await this.curriculumRepository.findById(id);

    if (!curriculum) {
      throw new AppError('Curriculum not found', 404);
    }

    return curriculum;
  }

  /**
   * Create new curriculum
   */
  async createCurriculum(data: CreateCurriculumDto) {
    // Check if code already exists
    const existing = await this.curriculumRepository.findByCode(data.code);
    if (existing) {
      throw new AppError('Curriculum with this code already exists', 409);
    }

    const newCurriculum = await this.curriculumRepository.create({
      code: data.code,
      name: data.name,
      description: data.description,
      program: data.program,
      year: data.year,
      effective_date: data.effectiveDate,
      status: data.status || 'draft',
      total_units: 0,
    });

    return newCurriculum;
  }

  /**
   * Update curriculum by ID
   */
  async updateCurriculum(id: string, data: UpdateCurriculumDto) {
    // Check if curriculum exists
    const existing = await this.curriculumRepository.findById(id);
    if (!existing) {
      throw new AppError('Curriculum not found', 404);
    }

    // If updating code, check for duplicates
    if (data.code && data.code !== existing.code) {
      const duplicate = await this.curriculumRepository.findByCode(data.code);
      if (duplicate) {
        throw new AppError('Curriculum with this code already exists', 409);
      }
    }

    const updateData: any = {};
    if (data.code) updateData.code = data.code;
    if (data.name) updateData.name = data.name;
    if (data.description !== undefined) updateData.description = data.description;
    if (data.program) updateData.program = data.program;
    if (data.year) updateData.year = data.year;
    if (data.totalUnits !== undefined) updateData.total_units = data.totalUnits;
    if (data.status) updateData.status = data.status;
    if (data.effectiveDate) updateData.effective_date = data.effectiveDate;

    const updated = await this.curriculumRepository.update(id, updateData);

    if (!updated) {
      throw new AppError('Failed to update curriculum', 500);
    }

    return updated;
  }

  /**
   * Delete curriculum by ID (soft delete)
   */
  async deleteCurriculum(id: string) {
    const existing = await this.curriculumRepository.findById(id);
    if (!existing) {
      throw new AppError('Curriculum not found', 404);
    }

    const deleted = await this.curriculumRepository.softDelete(id);

    if (!deleted) {
      throw new AppError('Failed to delete curriculum', 500);
    }

    return { message: 'Curriculum deleted successfully' };
  }

  /**
   * Restore soft-deleted curriculum
   */
  async restoreCurriculum(id: string) {
    const restored = await this.curriculumRepository.restore(id);

    if (!restored) {
      throw new AppError('Curriculum not found or already active', 404);
    }

    return restored;
  }

  /**
   * Permanently delete curriculum
   */
  async permanentDeleteCurriculum(id: string) {
    const deleted = await this.curriculumRepository.permanentDelete(id);

    if (!deleted) {
      throw new AppError('Curriculum not found', 404);
    }

    return { message: 'Curriculum permanently deleted' };
  }

  /**
   * Get deleted curriculum
   */
  async getDeletedCurriculum() {
    return await this.curriculumRepository.findDeleted();
  }
}
