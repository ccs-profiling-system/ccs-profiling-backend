/**
 * Skill Service
 * Business logic layer for skill operations
 * 
 */

import { SkillRepository } from '../repositories/skill.repository';
import { StudentRepository } from '../../students/repositories/student.repository';
import { NotFoundError } from '../../../shared/errors';
import { generateUUIDv7 } from '../../../shared/utils/uuid';
import {
  CreateSkillDTO,
  UpdateSkillDTO,
  SkillResponseDTO,
  SkillListResponseDTO,
  SkillFilters,
} from '../types';

export class SkillService {
  constructor(
    private skillRepository: SkillRepository,
    private studentRepository: StudentRepository
  ) {}

  /**
   * Get skill record by ID
   */
  async getSkill(id: string): Promise<SkillResponseDTO> {
    const record = await this.skillRepository.findById(id);
    if (!record) {
      throw new NotFoundError('Skill record not found');
    }
    return this.toResponseDTO(record);
  }

  /**
   * List skill records with pagination and filters
   */
  async listSkills(filters?: SkillFilters): Promise<SkillListResponseDTO> {
    const result = await this.skillRepository.findAll(filters);
    return {
      data: result.data.map((record) => this.toResponseDTO(record)),
      meta: result.meta,
    };
  }

  /**
   * Get skill records by student ID
   */
  async getSkillsByStudent(studentId: string): Promise<SkillResponseDTO[]> {
    // Verify student exists
    const student = await this.studentRepository.findById(studentId);
    if (!student) {
      throw new NotFoundError('Student not found');
    }

    const records = await this.skillRepository.findByStudentId(studentId);
    return records.map((record) => this.toResponseDTO(record));
  }

  /**
   * Create a new skill record
   */
  async createSkill(data: CreateSkillDTO): Promise<SkillResponseDTO> {
    // Verify student exists
    const student = await this.studentRepository.findById(data.student_id);
    if (!student) {
      throw new NotFoundError('Student not found');
    }

    // Generate UUID v7 for primary key
    const id = generateUUIDv7();

    // Create skill record
    const record = await this.skillRepository.create({
      id,
      student_id: data.student_id,
      skill_name: data.skill_name,
      category: data.category,
      proficiency_level: data.proficiency_level,
      years_of_experience: data.years_of_experience,
    });

    return this.toResponseDTO(record);
  }

  /**
   * Update skill record by ID
   */
  async updateSkill(id: string, data: UpdateSkillDTO): Promise<SkillResponseDTO> {
    // Check if record exists
    const existing = await this.skillRepository.findById(id);
    if (!existing) {
      throw new NotFoundError('Skill record not found');
    }

    // Update record
    const updated = await this.skillRepository.update(id, data);
    if (!updated) {
      throw new NotFoundError('Skill record not found after update');
    }

    return this.toResponseDTO(updated);
  }

  /**
   * Delete skill record by ID
   */
  async deleteSkill(id: string): Promise<void> {
    const existing = await this.skillRepository.findById(id);
    if (!existing) {
      throw new NotFoundError('Skill record not found');
    }

    await this.skillRepository.delete(id);
  }

  /**
   * Transform database entity to response DTO
   */
  private toResponseDTO(record: any): SkillResponseDTO {
    return {
      id: record.id,
      student_id: record.student_id,
      skill_name: record.skill_name,
      category: record.category,
      proficiency_level: record.proficiency_level || undefined,
      years_of_experience: record.years_of_experience || undefined,
      created_at: record.created_at.toISOString(),
      updated_at: record.updated_at.toISOString(),
    };
  }
}
