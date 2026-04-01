/**
 * Academic History Service
 * Business logic layer for academic history operations
 * 
 * Requirements: 8.1, 8.2, 8.3, 8.4
 */

import { AcademicHistoryRepository } from '../repositories/academicHistory.repository';
import { StudentRepository } from '../../students/repositories/student.repository';
import { NotFoundError } from '../../../shared/errors';
import { generateUUIDv7 } from '../../../shared/utils/uuid';
import {
  CreateAcademicHistoryDTO,
  UpdateAcademicHistoryDTO,
  AcademicHistoryResponseDTO,
  AcademicHistoryListResponseDTO,
  AcademicHistoryFilters,
  GPAResponseDTO,
} from '../types';

export class AcademicHistoryService {
  constructor(
    private academicHistoryRepository: AcademicHistoryRepository,
    private studentRepository: StudentRepository
  ) {}

  /**
   * Get academic history record by ID
   * Requirement: 8.1
   */
  async getAcademicHistory(id: string): Promise<AcademicHistoryResponseDTO> {
    const record = await this.academicHistoryRepository.findById(id);
    if (!record) {
      throw new NotFoundError('Academic history record not found');
    }
    return this.toResponseDTO(record);
  }

  /**
   * List academic history records with pagination and filters
   * Requirements: 8.1, 8.3
   */
  async listAcademicHistory(filters?: AcademicHistoryFilters): Promise<AcademicHistoryListResponseDTO> {
    const result = await this.academicHistoryRepository.findAll(filters);
    return {
      data: result.data.map((record) => this.toResponseDTO(record)),
      meta: result.meta,
    };
  }

  /**
   * Get academic history records by student ID
   * Requirement: 8.3
   */
  async getAcademicHistoryByStudent(studentId: string): Promise<AcademicHistoryResponseDTO[]> {
    // Verify student exists
    const student = await this.studentRepository.findById(studentId);
    if (!student) {
      throw new NotFoundError('Student not found');
    }

    const records = await this.academicHistoryRepository.findByStudentId(studentId);
    return records.map((record) => this.toResponseDTO(record));
  }

  /**
   * Create a new academic history record
   * Requirements: 8.1, 8.2
   */
  async createAcademicHistory(data: CreateAcademicHistoryDTO): Promise<AcademicHistoryResponseDTO> {
    // Verify student exists
    const student = await this.studentRepository.findById(data.student_id);
    if (!student) {
      throw new NotFoundError('Student not found');
    }

    // Generate UUID v7 for primary key
    const id = generateUUIDv7();

    // Create academic history record
    const record = await this.academicHistoryRepository.create({
      id,
      student_id: data.student_id,
      subject_code: data.subject_code,
      subject_name: data.subject_name,
      grade: data.grade.toString(), // Convert to string for decimal storage
      semester: data.semester,
      academic_year: data.academic_year,
      credits: data.credits,
      remarks: data.remarks,
    });

    return this.toResponseDTO(record);
  }

  /**
   * Update academic history record by ID
   * Requirement: 8.1
   */
  async updateAcademicHistory(id: string, data: UpdateAcademicHistoryDTO): Promise<AcademicHistoryResponseDTO> {
    // Check if record exists
    const existing = await this.academicHistoryRepository.findById(id);
    if (!existing) {
      throw new NotFoundError('Academic history record not found');
    }

    // Prepare update data
    const updateData: any = { ...data };
    if (data.grade !== undefined) {
      updateData.grade = data.grade.toString(); // Convert to string for decimal storage
    }

    // Update record
    const updated = await this.academicHistoryRepository.update(id, updateData);
    if (!updated) {
      throw new NotFoundError('Academic history record not found after update');
    }

    return this.toResponseDTO(updated);
  }

  /**
   * Delete academic history record by ID
   * Requirement: 8.1
   */
  async deleteAcademicHistory(id: string): Promise<void> {
    const existing = await this.academicHistoryRepository.findById(id);
    if (!existing) {
      throw new NotFoundError('Academic history record not found');
    }

    await this.academicHistoryRepository.delete(id);
  }

  /**
   * Calculate GPA for a student
   * Requirement: 8.4
   */
  async calculateGPA(studentId: string): Promise<GPAResponseDTO> {
    // Verify student exists
    const student = await this.studentRepository.findById(studentId);
    if (!student) {
      throw new NotFoundError('Student not found');
    }

    const gpaData = await this.academicHistoryRepository.calculateGPA(studentId);

    return {
      student_id: studentId,
      gpa: gpaData.gpa,
      total_credits: gpaData.total_credits,
      total_grade_points: gpaData.total_grade_points,
      records_count: gpaData.records_count,
    };
  }

  /**
   * Transform database entity to response DTO
   */
  private toResponseDTO(record: any): AcademicHistoryResponseDTO {
    return {
      id: record.id,
      student_id: record.student_id,
      subject_code: record.subject_code,
      subject_name: record.subject_name,
      grade: parseFloat(record.grade), // Convert back to number
      semester: record.semester,
      academic_year: record.academic_year,
      credits: record.credits,
      remarks: record.remarks || undefined,
      created_at: record.created_at.toISOString(),
      updated_at: record.updated_at.toISOString(),
    };
  }
}
