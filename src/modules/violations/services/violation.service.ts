/**
 * Violation Service
 * Business logic layer for violation operations
 * 
 * Requirements: 6.1, 6.3, 6.4
 */

import { ViolationRepository } from '../repositories/violation.repository';
import { StudentRepository } from '../../students/repositories/student.repository';
import { NotFoundError } from '../../../shared/errors';
import { generateUUIDv7 } from '../../../shared/utils/uuid';
import {
  CreateViolationDTO,
  UpdateViolationDTO,
  ViolationResponseDTO,
  ViolationListResponseDTO,
  ViolationFilters,
} from '../types';

export class ViolationService {
  constructor(
    private violationRepository: ViolationRepository,
    private studentRepository: StudentRepository
  ) {}

  /**
   * Get violation record by ID
   * Requirement: 6.1
   */
  async getViolation(id: string): Promise<ViolationResponseDTO> {
    const record = await this.violationRepository.findById(id);
    if (!record) {
      throw new NotFoundError('Violation record not found');
    }
    return this.toResponseDTO(record);
  }

  /**
   * List violation records with pagination and filters
   * Requirements: 6.1, 6.3
   */
  async listViolations(filters?: ViolationFilters): Promise<ViolationListResponseDTO> {
    const result = await this.violationRepository.findAll(filters);
    return {
      data: result.data.map((record) => this.toResponseDTO(record)),
      meta: result.meta,
    };
  }

  /**
   * Get violation records by student ID
   * Requirement: 6.3
   */
  async getViolationsByStudent(studentId: string): Promise<ViolationResponseDTO[]> {
    // Verify student exists
    const student = await this.studentRepository.findById(studentId);
    if (!student) {
      throw new NotFoundError('Student not found');
    }

    const records = await this.violationRepository.findByStudentId(studentId);
    return records.map((record) => this.toResponseDTO(record));
  }

  /**
   * Create a new violation record
   * Requirements: 6.1, 6.2
   */
  async createViolation(data: CreateViolationDTO): Promise<ViolationResponseDTO> {
    // Verify student exists
    const student = await this.studentRepository.findById(data.student_id);
    if (!student) {
      throw new NotFoundError('Student not found');
    }

    // Generate UUID v7 for primary key
    const id = generateUUIDv7();

    // Create violation record
    const record = await this.violationRepository.create({
      id,
      student_id: data.student_id,
      violation_type: data.violation_type,
      description: data.description,
      violation_date: data.violation_date,
    });

    return this.toResponseDTO(record);
  }

  /**
   * Update violation record by ID
   * Requirement: 6.3
   */
  async updateViolation(id: string, data: UpdateViolationDTO): Promise<ViolationResponseDTO> {
    // Check if record exists
    const existing = await this.violationRepository.findById(id);
    if (!existing) {
      throw new NotFoundError('Violation record not found');
    }

    // Update record
    const updated = await this.violationRepository.update(id, data);
    if (!updated) {
      throw new NotFoundError('Violation record not found after update');
    }

    return this.toResponseDTO(updated);
  }

  /**
   * Delete violation record by ID
   * Requirement: 6.3
   */
  async deleteViolation(id: string): Promise<void> {
    const existing = await this.violationRepository.findById(id);
    if (!existing) {
      throw new NotFoundError('Violation record not found');
    }

    await this.violationRepository.delete(id);
  }

  /**
   * Resolve a violation record
   * Updates resolution_status to 'resolved' and sets resolved_at timestamp
   * Requirement: 6.4
   */
  async resolveViolation(id: string, resolutionNotes?: string): Promise<ViolationResponseDTO> {
    // Check if record exists
    const existing = await this.violationRepository.findById(id);
    if (!existing) {
      throw new NotFoundError('Violation record not found');
    }

    // Update record with resolved status and timestamp
    const updated = await this.violationRepository.update(id, {
      resolution_status: 'resolved',
      resolution_notes: resolutionNotes,
      resolved_at: new Date(),
    });

    if (!updated) {
      throw new NotFoundError('Violation record not found after update');
    }

    return this.toResponseDTO(updated);
  }

  /**
   * Transform database entity to response DTO
   */
  private toResponseDTO(record: any): ViolationResponseDTO {
    return {
      id: record.id,
      student_id: record.student_id,
      violation_type: record.violation_type,
      description: record.description,
      violation_date: record.violation_date,
      resolution_status: record.resolution_status,
      resolution_notes: record.resolution_notes || undefined,
      resolved_at: record.resolved_at ? record.resolved_at.toISOString() : undefined,
      created_at: record.created_at.toISOString(),
      updated_at: record.updated_at.toISOString(),
    };
  }
}
