/**
 * Enrollment Service
 * Business logic layer for enrollment operations
 * 
 */

import { EnrollmentRepository } from '../repositories/enrollment.repository';
import { StudentRepository } from '../../students/repositories/student.repository';
import { InstructionRepository } from '../../instructions/repositories/instruction.repository';
import { NotFoundError, ConflictError } from '../../../shared/errors';
import { generateUUIDv7 } from '../../../shared/utils/uuid';
import {
  CreateEnrollmentDTO,
  UpdateEnrollmentDTO,
  EnrollmentResponseDTO,
  EnrollmentListResponseDTO,
  EnrollmentFilters,
} from '../types';

export class EnrollmentService {
  constructor(
    private enrollmentRepository: EnrollmentRepository,
    private studentRepository: StudentRepository,
    private instructionRepository: InstructionRepository
  ) {}

  /**
   * Get enrollment by ID
   */
  async getEnrollment(id: string): Promise<EnrollmentResponseDTO> {
    const result = await this.enrollmentRepository.findById(id);
    if (!result) {
      throw new NotFoundError('Enrollment not found');
    }
    return this.toResponseDTO(result);
  }

  /**
   * List enrollments with pagination and filters
   */
  async listEnrollments(filters?: EnrollmentFilters): Promise<EnrollmentListResponseDTO> {
    const result = await this.enrollmentRepository.findAll(filters);
    return {
      data: result.data.map((item) => this.toResponseDTO(item)),
      meta: result.meta,
    };
  }

  /**
   * Get enrollments by student ID
   */
  async getEnrollmentsByStudent(studentId: string): Promise<EnrollmentResponseDTO[]> {
    // Verify student exists
    const student = await this.studentRepository.findById(studentId);
    if (!student) {
      throw new NotFoundError('Student not found');
    }

    const results = await this.enrollmentRepository.findByStudentId(studentId);
    return results.map((item) => this.toResponseDTO(item));
  }

  /**
   * Get enrollments by instruction ID
   */
  async getEnrollmentsByInstruction(instructionId: string): Promise<EnrollmentResponseDTO[]> {
    // Verify instruction exists
    const instruction = await this.instructionRepository.findById(instructionId);
    if (!instruction) {
      throw new NotFoundError('Instruction not found');
    }

    const results = await this.enrollmentRepository.findByInstructionId(instructionId);
    return results.map((item) => this.toResponseDTO(item));
  }

  /**
   * Create a new enrollment
   * Validates duplicate enrollment prevention
   */
  async createEnrollment(data: CreateEnrollmentDTO): Promise<EnrollmentResponseDTO> {
    // Verify student exists
    const student = await this.studentRepository.findById(data.student_id);
    if (!student) {
      throw new NotFoundError('Student not found');
    }

    // Verify instruction exists
    const instruction = await this.instructionRepository.findById(data.instruction_id);
    if (!instruction) {
      throw new NotFoundError('Instruction not found');
    }

    const duplicate = await this.enrollmentRepository.findDuplicate(
      data.student_id,
      data.instruction_id,
      data.semester,
      data.academic_year
    );

    if (duplicate) {
      throw new ConflictError(
        `Student is already enrolled in ${instruction.subject_code} for ${data.semester} semester ${data.academic_year}`
      );
    }

    // Generate UUID v7 for primary key
    const id = generateUUIDv7();

    // Create enrollment
    const enrollment = await this.enrollmentRepository.create({
      id,
      student_id: data.student_id,
      instruction_id: data.instruction_id,
      enrollment_status: 'enrolled',
      semester: data.semester,
      academic_year: data.academic_year,
    });

    // Fetch with instruction details for response
    const result = await this.enrollmentRepository.findById(enrollment.id);
    if (!result) {
      throw new NotFoundError('Enrollment not found after creation');
    }

    return this.toResponseDTO(result);
  }

  /**
   * Update enrollment by ID
   */
  async updateEnrollment(id: string, data: UpdateEnrollmentDTO): Promise<EnrollmentResponseDTO> {
    // Check if enrollment exists
    const existing = await this.enrollmentRepository.findById(id);
    if (!existing) {
      throw new NotFoundError('Enrollment not found');
    }

    // Update enrollment
    await this.enrollmentRepository.update(id, data);

    // Fetch updated enrollment with instruction details
    const result = await this.enrollmentRepository.findById(id);
    if (!result) {
      throw new NotFoundError('Enrollment not found after update');
    }

    return this.toResponseDTO(result);
  }

  /**
   * Delete enrollment by ID
   */
  async deleteEnrollment(id: string): Promise<void> {
    const existing = await this.enrollmentRepository.findById(id);
    if (!existing) {
      throw new NotFoundError('Enrollment not found');
    }

    await this.enrollmentRepository.delete(id);
  }

  /**
   * Transform database entity to response DTO
   */
  private toResponseDTO(result: any): EnrollmentResponseDTO {
    const enrollment = result.enrollment;
    const instruction = result.instruction;

    return {
      id: enrollment.id,
      student_id: enrollment.student_id,
      instruction_id: enrollment.instruction_id,
      subject_code: instruction?.subject_code || '',
      subject_name: instruction?.subject_name || '',
      enrollment_status: enrollment.enrollment_status,
      semester: enrollment.semester,
      academic_year: enrollment.academic_year,
      enrolled_at: enrollment.enrolled_at?.toISOString() || enrollment.created_at.toISOString(),
      created_at: enrollment.created_at.toISOString(),
      updated_at: enrollment.updated_at.toISOString(),
    };
  }
}
