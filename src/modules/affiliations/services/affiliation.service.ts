/**
 * Affiliation Service
 * Business logic layer for affiliation operations
 * 
 */

import { AffiliationRepository } from '../repositories/affiliation.repository';
import { StudentRepository } from '../../students/repositories/student.repository';
import { NotFoundError } from '../../../shared/errors';
import { generateUUIDv7 } from '../../../shared/utils/uuid';
import {
  CreateAffiliationDTO,
  UpdateAffiliationDTO,
  AffiliationResponseDTO,
  AffiliationListResponseDTO,
  AffiliationFilters,
} from '../types';

export class AffiliationService {
  constructor(
    private affiliationRepository: AffiliationRepository,
    private studentRepository: StudentRepository
  ) {}

  /**
   * Get affiliation record by ID
   */
  async getAffiliation(id: string): Promise<AffiliationResponseDTO> {
    const record = await this.affiliationRepository.findById(id);
    if (!record) {
      throw new NotFoundError('Affiliation record not found');
    }
    return this.toResponseDTO(record);
  }

  /**
   * List affiliation records with pagination and filters
   */
  async listAffiliations(filters?: AffiliationFilters): Promise<AffiliationListResponseDTO> {
    const result = await this.affiliationRepository.findAll(filters);
    return {
      data: result.data.map((record) => this.toResponseDTO(record)),
      meta: result.meta,
    };
  }

  /**
   * Get affiliation records by student ID
   */
  async getAffiliationsByStudent(studentId: string): Promise<AffiliationResponseDTO[]> {
    // Verify student exists
    const student = await this.studentRepository.findById(studentId);
    if (!student) {
      throw new NotFoundError('Student not found');
    }

    const records = await this.affiliationRepository.findByStudentId(studentId);
    return records.map((record) => this.toResponseDTO(record));
  }

  /**
   * Create a new affiliation record
   */
  async createAffiliation(data: CreateAffiliationDTO): Promise<AffiliationResponseDTO> {
    // Verify student exists
    const student = await this.studentRepository.findById(data.student_id);
    if (!student) {
      throw new NotFoundError('Student not found');
    }

    // Generate UUID v7 for primary key
    const id = generateUUIDv7();

    // Create affiliation record
    const record = await this.affiliationRepository.create({
      id,
      student_id: data.student_id,
      organization_name: data.organization_name,
      role: data.role,
      start_date: data.start_date,
      end_date: data.end_date,
    });

    return this.toResponseDTO(record);
  }

  /**
   * Update affiliation record by ID
   */
  async updateAffiliation(id: string, data: UpdateAffiliationDTO): Promise<AffiliationResponseDTO> {
    // Check if record exists
    const existing = await this.affiliationRepository.findById(id);
    if (!existing) {
      throw new NotFoundError('Affiliation record not found');
    }

    // Update record
    const updated = await this.affiliationRepository.update(id, data);
    if (!updated) {
      throw new NotFoundError('Affiliation record not found after update');
    }

    return this.toResponseDTO(updated);
  }

  /**
   * Delete affiliation record by ID
   */
  async deleteAffiliation(id: string): Promise<void> {
    const existing = await this.affiliationRepository.findById(id);
    if (!existing) {
      throw new NotFoundError('Affiliation record not found');
    }

    await this.affiliationRepository.delete(id);
  }

  /**
   * End an affiliation record
   * Updates end_date and sets is_active to false
   */
  async endAffiliation(id: string, endDate: string): Promise<AffiliationResponseDTO> {
    // Check if record exists
    const existing = await this.affiliationRepository.findById(id);
    if (!existing) {
      throw new NotFoundError('Affiliation record not found');
    }

    // Update record with end date and set is_active to false
    const updated = await this.affiliationRepository.update(id, {
      end_date: endDate,
      is_active: false,
    });

    if (!updated) {
      throw new NotFoundError('Affiliation record not found after update');
    }

    return this.toResponseDTO(updated);
  }

  /**
   * Transform database entity to response DTO
   */
  private toResponseDTO(record: any): AffiliationResponseDTO {
    return {
      id: record.id,
      student_id: record.student_id,
      organization_name: record.organization_name,
      role: record.role || undefined,
      start_date: record.start_date instanceof Date 
        ? record.start_date.toISOString().split('T')[0] 
        : record.start_date,
      end_date: record.end_date 
        ? (record.end_date instanceof Date 
          ? record.end_date.toISOString().split('T')[0] 
          : record.end_date)
        : undefined,
      is_active: record.is_active,
      created_at: record.created_at.toISOString(),
      updated_at: record.updated_at.toISOString(),
    };
  }
}
