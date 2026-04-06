/**
 * Faculty Service
 * Business logic layer for faculty operations
 * 
 * Requirements: 3.1, 3.4, 3.5
 */

import { FacultyRepository } from '../repositories/faculty.repository';
import { UserRepository } from '../../users/repositories/user.repository';
import { EntityCounterRepository } from '../../../db/repositories/entityCounter.repository';
import { Database } from '../../../db';
import { NotFoundError, ConflictError } from '../../../shared/errors';
import { generateUUIDv7 } from '../../../shared/utils/uuid';
import { IDGenerator } from '../../../shared/utils/idGenerator';
import {
  CreateFacultyDTO,
  UpdateFacultyDTO,
  FacultyResponseDTO,
  FacultyListResponseDTO,
  FacultyFilters,
} from '../types';

export class FacultyService {
  constructor(
    private facultyRepository: FacultyRepository,
    private userRepository: UserRepository,
    private entityCounterRepository: EntityCounterRepository,
    private db: Database
  ) {}

  /**
   * Get faculty by ID
   * Requirement: 3.4
   */
  async getFaculty(id: string): Promise<FacultyResponseDTO> {
    const faculty = await this.facultyRepository.findById(id);
    if (!faculty) {
      throw new NotFoundError('Faculty not found');
    }
    return this.toResponseDTO(faculty);
  }

  /**
   * List faculty with pagination and filters
   * Requirement: 3.4
   */
  async listFaculty(filters?: FacultyFilters): Promise<FacultyListResponseDTO> {
    const result = await this.facultyRepository.findAll(filters);
    return {
      data: result.data.map((faculty) => this.toResponseDTO(faculty)),
      meta: result.meta,
    };
  }

  /**
   * Create a new faculty
   * Optionally creates a linked user account
   * Automatically generates UUID v7 and human-readable faculty_id
   * Requirements: 3.1, 3.4
   */
  async createFaculty(data: CreateFacultyDTO): Promise<FacultyResponseDTO> {
    // Check for duplicate email
    const existingEmail = await this.facultyRepository.findByEmail(data.email);
    if (existingEmail) {
      throw new ConflictError('Email already exists');
    }

    // If faculty_id is provided (backward compatibility), check for duplicates
    if (data.faculty_id) {
      const existingFaculty = await this.facultyRepository.findByFacultyId(data.faculty_id);
      if (existingFaculty) {
        throw new ConflictError('Faculty ID already exists');
      }
    }

    // If create_user_account is true, use createFacultyWithUser
    if (data.create_user_account) {
      return await this.createFacultyWithUser(data);
    }

    // Generate IDs within a transaction
    return await this.db.transaction(async (tx) => {
      // Generate UUID v7 for primary key
      const id = generateUUIDv7();

      // Generate human-readable faculty_id if not provided
      const facultyId = data.faculty_id || await this.generateFacultyId(tx);

      // Create faculty without user account
      const faculty = await this.facultyRepository.create(
        {
          id,
          faculty_id: facultyId,
          first_name: data.first_name,
          last_name: data.last_name,
          middle_name: data.middle_name,
          email: data.email,
          phone: data.phone,
          department: data.department,
          position: data.position,
          specialization: data.specialization,
        },
        tx
      );

      return this.toResponseDTO(faculty);
    });
  }

  /**
   * Create faculty with linked user account in a single transaction
   * Automatically generates UUID v7 and human-readable faculty_id
   * Requirements: 3.2, 26.5, 26.7
   */
  async createFacultyWithUser(data: CreateFacultyDTO): Promise<FacultyResponseDTO> {
    // Check for duplicate email
    const existingEmail = await this.facultyRepository.findByEmail(data.email);
    if (existingEmail) {
      throw new ConflictError('Email already exists');
    }

    // If faculty_id is provided (backward compatibility), check for duplicates
    if (data.faculty_id) {
      const existingFaculty = await this.facultyRepository.findByFacultyId(data.faculty_id);
      if (existingFaculty) {
        throw new ConflictError('Faculty ID already exists');
      }
    }

    // Check if user with this email already exists
    const existingUser = await this.userRepository.findByEmail(data.email);
    if (existingUser) {
      throw new ConflictError('User account with this email already exists');
    }

    // Create user account and faculty profile in single transaction
    return await this.db.transaction(async (tx) => {
      // Generate UUID v7 for primary key
      const id = generateUUIDv7();

      // Generate human-readable faculty_id if not provided
      const facultyId = data.faculty_id || await this.generateFacultyId(tx);

      // Generate temporary password
      const tempPassword = await this.generateTemporaryPassword();

      // Step 1: Create user account
      const user = await this.userRepository.create(
        {
          email: data.email,
          password_hash: tempPassword,
          role: 'faculty',
        },
        tx
      );

      // Step 2: Create faculty profile linked to user
      const faculty = await this.facultyRepository.create(
        {
          id,
          faculty_id: facultyId,
          user_id: user.id,
          first_name: data.first_name,
          last_name: data.last_name,
          middle_name: data.middle_name,
          email: data.email,
          phone: data.phone,
          department: data.department,
          position: data.position,
          specialization: data.specialization,
        },
        tx
      );

      // If any step fails, entire transaction rolls back automatically
      return this.toResponseDTO(faculty);
    });
  }

  /**
   * Update faculty by ID
   * Requirement: 3.4
   */
  async updateFaculty(id: string, data: UpdateFacultyDTO): Promise<FacultyResponseDTO> {
    // Check if faculty exists
    const existing = await this.facultyRepository.findById(id);
    if (!existing) {
      throw new NotFoundError('Faculty not found');
    }

    // Check for duplicate email if being updated
    if (data.email && data.email !== existing.email) {
      const duplicate = await this.facultyRepository.findByEmail(data.email);
      if (duplicate) {
        throw new ConflictError('Email already exists');
      }
    }

    const updated = await this.facultyRepository.update(id, data);
    if (!updated) {
      throw new NotFoundError('Faculty not found');
    }

    return this.toResponseDTO(updated);
  }

  /**
   * Delete faculty by ID (soft delete)
   * Requirement: 3.5
   */
  async deleteFaculty(id: string): Promise<void> {
    const existing = await this.facultyRepository.findById(id);
    if (!existing) {
      throw new NotFoundError('Faculty not found');
    }

    await this.facultyRepository.softDelete(id);
  }

  /**
   * Transform database entity to response DTO
   */
  private toResponseDTO(faculty: any): FacultyResponseDTO {
    return {
      id: faculty.id,
      faculty_id: faculty.faculty_id,
      first_name: faculty.first_name,
      last_name: faculty.last_name,
      middle_name: faculty.middle_name || undefined,
      email: faculty.email,
      phone: faculty.phone || undefined,
      department: faculty.department,
      position: faculty.position || undefined,
      specialization: faculty.specialization || undefined,
      status: faculty.status,
      created_at: faculty.created_at.toISOString(),
      updated_at: faculty.updated_at.toISOString(),
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

  /**
   * Generate human-readable faculty ID
   * Format: F-YYYY-0001
   * 
   * @param tx - Transaction context (required)
   * @returns Generated faculty ID
   */
  private async generateFacultyId(
    tx: Parameters<Parameters<Database['transaction']>[0]>[0]
  ): Promise<string> {
    const currentYear = IDGenerator.getCurrentYear();

    // Ensure counter exists for current year
    await this.entityCounterRepository.getOrCreateCounter('faculty', currentYear, tx);

    // Increment counter and get new sequence
    const sequence = await this.entityCounterRepository.incrementCounter('faculty', currentYear, tx);

    // Generate human-readable ID
    return IDGenerator.generate('faculty', sequence, currentYear);
  }

  /**
   * Get soft-deleted faculty (admin only)
   * Requirements: 28.5
   */
  async getDeletedFaculty(filters?: FacultyFilters): Promise<FacultyListResponseDTO> {
    const result = await this.facultyRepository.findDeleted(filters);

    return {
      data: result.data.map((faculty) => this.toResponseDTO(faculty)),
      meta: result.meta,
    };
  }

  /**
   * Restore soft-deleted faculty
   * Requirements: 28.7
   */
  async restoreFaculty(id: string): Promise<FacultyResponseDTO> {
    // Find faculty including deleted
    const faculty = await this.facultyRepository.findByIdIncludingDeleted(id);
    if (!faculty) {
      throw new NotFoundError('Faculty not found');
    }

    if (!faculty.deleted_at) {
      throw new ConflictError('Faculty is not deleted');
    }

    // Restore faculty
    await this.facultyRepository.restore(id);

    // Fetch and return restored faculty
    const restored = await this.facultyRepository.findById(id);
    return this.toResponseDTO(restored!);
  }

  /**
   * Permanently delete faculty (hard delete)
   * Requirements: 28.6
   */
  async permanentDeleteFaculty(id: string): Promise<void> {
    // Find faculty including deleted
    const faculty = await this.facultyRepository.findByIdIncludingDeleted(id);
    if (!faculty) {
      throw new NotFoundError('Faculty not found');
    }

    // Permanently delete
    await this.facultyRepository.permanentDelete(id);
  }
}
