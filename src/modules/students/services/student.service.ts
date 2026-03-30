/**
 * Student Service
 * Business logic layer for student operations
 * 
 * Requirements: 2.1, 2.5, 2.6, 2.7
 */

import { StudentRepository } from '../repositories/student.repository';
import { UserRepository } from '../../users/repositories/user.repository';
import { Database } from '../../../db';
import { NotFoundError, ConflictError } from '../../../shared/errors';
import {
  CreateStudentDTO,
  UpdateStudentDTO,
  StudentResponseDTO,
  StudentListResponseDTO,
  StudentProfileDTO,
  StudentFilters,
} from '../types';

export class StudentService {
  constructor(
    private studentRepository: StudentRepository,
    private userRepository: UserRepository,
    private db: Database
  ) {}

  /**
   * Get student by ID
   * Requirement: 2.5
   */
  async getStudent(id: string): Promise<StudentResponseDTO> {
    const student = await this.studentRepository.findById(id);
    if (!student) {
      throw new NotFoundError('Student not found');
    }
    return this.toResponseDTO(student);
  }

  /**
   * List students with pagination and filters
   * Requirement: 2.5
   */
  async listStudents(filters?: StudentFilters): Promise<StudentListResponseDTO> {
    const result = await this.studentRepository.findAll(filters);
    return {
      data: result.data.map((student) => this.toResponseDTO(student)),
      meta: result.meta,
    };
  }

  /**
   * Create a new student
   * Optionally creates a linked user account
   * Requirements: 2.1, 2.6
   */
  async createStudent(data: CreateStudentDTO): Promise<StudentResponseDTO> {
    // Check for duplicate student_id
    const existingStudent = await this.studentRepository.findByStudentId(data.student_id);
    if (existingStudent) {
      throw new ConflictError('Student ID already exists');
    }

    // Check for duplicate email
    const existingEmail = await this.studentRepository.findByEmail(data.email);
    if (existingEmail) {
      throw new ConflictError('Email already exists');
    }

    // If create_user_account is true, use createStudentWithUser
    if (data.create_user_account) {
      return await this.createStudentWithUser(data);
    }

    // Create student without user account
    const student = await this.studentRepository.create({
      student_id: data.student_id,
      first_name: data.first_name,
      last_name: data.last_name,
      middle_name: data.middle_name,
      email: data.email,
      phone: data.phone,
      date_of_birth: data.date_of_birth,
      address: data.address,
      year_level: data.year_level,
      program: data.program,
    });

    return this.toResponseDTO(student);
  }

  /**
   * Create student with linked user account in a single transaction
   * Requirements: 2.2, 26.2, 26.3, 26.4, 26.7
   */
  async createStudentWithUser(data: CreateStudentDTO): Promise<StudentResponseDTO> {
    // Check for duplicate student_id
    const existingStudent = await this.studentRepository.findByStudentId(data.student_id);
    if (existingStudent) {
      throw new ConflictError('Student ID already exists');
    }

    // Check for duplicate email
    const existingEmail = await this.studentRepository.findByEmail(data.email);
    if (existingEmail) {
      throw new ConflictError('Email already exists');
    }

    // Check if user with this email already exists
    const existingUser = await this.userRepository.findByEmail(data.email);
    if (existingUser) {
      throw new ConflictError('User account with this email already exists');
    }

    // Create user account and student profile in single transaction
    return await this.db.transaction(async (tx) => {
      // Generate temporary password
      const tempPassword = await this.generateTemporaryPassword();

      // Step 1: Create user account
      const user = await this.userRepository.create(
        {
          email: data.email,
          password_hash: tempPassword,
          role: 'student',
        },
        tx
      );

      // Step 2: Create student profile linked to user
      const student = await this.studentRepository.create(
        {
          student_id: data.student_id,
          user_id: user.id,
          first_name: data.first_name,
          last_name: data.last_name,
          middle_name: data.middle_name,
          email: data.email,
          phone: data.phone,
          date_of_birth: data.date_of_birth,
          address: data.address,
          year_level: data.year_level,
          program: data.program,
        },
        tx
      );

      // If any step fails, entire transaction rolls back automatically
      return this.toResponseDTO(student);
    });
  }

  /**
   * Update student by ID
   * Requirement: 2.6
   */
  async updateStudent(id: string, data: UpdateStudentDTO): Promise<StudentResponseDTO> {
    // Check if student exists
    const existing = await this.studentRepository.findById(id);
    if (!existing) {
      throw new NotFoundError('Student not found');
    }

    // Check for duplicate email if being updated
    if (data.email && data.email !== existing.email) {
      const duplicate = await this.studentRepository.findByEmail(data.email);
      if (duplicate) {
        throw new ConflictError('Email already exists');
      }
    }

    const updated = await this.studentRepository.update(id, data);
    if (!updated) {
      throw new NotFoundError('Student not found');
    }

    return this.toResponseDTO(updated);
  }

  /**
   * Delete student by ID (soft delete)
   * Requirement: 2.7
   */
  async deleteStudent(id: string): Promise<void> {
    const existing = await this.studentRepository.findById(id);
    if (!existing) {
      throw new NotFoundError('Student not found');
    }

    await this.studentRepository.softDelete(id);
  }

  /**
   * Get complete student profile with aggregated data
   * Requirement: 10.1
   */
  async getStudentProfile(id: string): Promise<StudentProfileDTO> {
    const student = await this.studentRepository.findById(id);
    if (!student) {
      throw new NotFoundError('Student not found');
    }

    // For now, return basic profile
    // Related data (skills, violations, etc.) will be added when those modules are implemented
    return this.toResponseDTO(student);
  }

  /**
   * Transform database entity to response DTO
   */
  private toResponseDTO(student: any): StudentResponseDTO {
    return {
      id: student.id,
      student_id: student.student_id,
      first_name: student.first_name,
      last_name: student.last_name,
      middle_name: student.middle_name || undefined,
      email: student.email,
      phone: student.phone || undefined,
      date_of_birth: student.date_of_birth || undefined,
      address: student.address || undefined,
      year_level: student.year_level || undefined,
      program: student.program || undefined,
      status: student.status,
      created_at: student.created_at.toISOString(),
      updated_at: student.updated_at.toISOString(),
    };
  }

  /**
   * Generate temporary password for new user accounts
   */
  private async generateTemporaryPassword(): Promise<string> {
    const bcrypt = await import('bcrypt');
    const tempPassword = Math.random().toString(36).slice(-8);
    return bcrypt.hash(tempPassword, 10);
  }
}
