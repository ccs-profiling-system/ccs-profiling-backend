/**
 * Student Service
 * Business logic layer for student operations
 * 
 * Requirements: 2.1, 2.5, 2.6, 2.7, 10.1, 10.2, 10.3, 10.4, 19.1, 19.2, 19.3
 */

import { StudentRepository } from '../repositories/student.repository';
import { UserRepository } from '../../users/repositories/user.repository';
import { EntityCounterRepository } from '../../../db/repositories/entityCounter.repository';
import { SkillRepository } from '../../skills/repositories/skill.repository';
import { ViolationRepository } from '../../violations/repositories/violation.repository';
import { AffiliationRepository } from '../../affiliations/repositories/affiliation.repository';
import { AcademicHistoryRepository } from '../../academic-history/repositories/academicHistory.repository';
import { EnrollmentRepository } from '../../enrollments/repositories/enrollment.repository';
import { AuditLogger, AuditContext } from '../../../shared/utils/auditLogger';
import { Database } from '../../../db';
import { NotFoundError, ConflictError } from '../../../shared/errors';
import { generateUUIDv7 } from '../../../shared/utils/uuid';
import { IDGenerator } from '../../../shared/utils/idGenerator';
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
    private entityCounterRepository: EntityCounterRepository,
    private skillRepository: SkillRepository,
    private violationRepository: ViolationRepository,
    private affiliationRepository: AffiliationRepository,
    private academicHistoryRepository: AcademicHistoryRepository,
    private enrollmentRepository: EnrollmentRepository,
    private auditLogger: AuditLogger,
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
   * Automatically generates UUID v7 and human-readable student_id
   * Requirements: 2.1, 2.6, 19.1
   */
  async createStudent(data: CreateStudentDTO, auditContext?: AuditContext): Promise<StudentResponseDTO> {
    // Check for duplicate email
    const existingEmail = await this.studentRepository.findByEmail(data.email);
    if (existingEmail) {
      throw new ConflictError('Email already exists');
    }

    // If student_id is provided (backward compatibility), check for duplicates
    if (data.student_id) {
      const existingStudent = await this.studentRepository.findByStudentId(data.student_id);
      if (existingStudent) {
        throw new ConflictError('Student ID already exists');
      }
    }

    // If create_user_account is true, use createStudentWithUser
    if (data.create_user_account) {
      return await this.createStudentWithUser(data, auditContext);
    }

    // Generate IDs within a transaction
    return await this.db.transaction(async (tx) => {
      // Generate UUID v7 for primary key
      const id = generateUUIDv7();

      // Generate human-readable student_id if not provided
      const studentId = data.student_id || await this.generateStudentId(tx);

      // Create student without user account
      const student = await this.studentRepository.create(
        {
          id,
          student_id: studentId,
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

      // Log audit event (Requirement: 19.1)
      if (auditContext) {
        await this.auditLogger.logCreate(
          'student',
          student.id,
          this.toResponseDTO(student),
          auditContext,
          tx
        );
      }

      return this.toResponseDTO(student);
    });
  }

  /**
   * Create student with linked user account in a single transaction
   * Automatically generates UUID v7 and human-readable student_id
   * Requirements: 2.2, 26.2, 26.3, 26.4, 26.7, 19.1
   */
  async createStudentWithUser(data: CreateStudentDTO, auditContext?: AuditContext): Promise<StudentResponseDTO> {
    // Check for duplicate email
    const existingEmail = await this.studentRepository.findByEmail(data.email);
    if (existingEmail) {
      throw new ConflictError('Email already exists');
    }

    // If student_id is provided (backward compatibility), check for duplicates
    if (data.student_id) {
      const existingStudent = await this.studentRepository.findByStudentId(data.student_id);
      if (existingStudent) {
        throw new ConflictError('Student ID already exists');
      }
    }

    // Check if user with this email already exists
    const existingUser = await this.userRepository.findByEmail(data.email);
    if (existingUser) {
      throw new ConflictError('User account with this email already exists');
    }

    // Create user account and student profile in single transaction
    return await this.db.transaction(async (tx) => {
      // Generate UUID v7 for primary key
      const id = generateUUIDv7();

      // Generate human-readable student_id if not provided
      const studentId = data.student_id || await this.generateStudentId(tx);

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
          id,
          student_id: studentId,
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

      // Log audit event (Requirement: 19.1)
      if (auditContext) {
        await this.auditLogger.logCreate(
          'student',
          student.id,
          this.toResponseDTO(student),
          auditContext,
          tx
        );
      }

      // If any step fails, entire transaction rolls back automatically
      return this.toResponseDTO(student);
    });
  }

  /**
   * Update student by ID
   * Requirement: 2.6, 19.2
   */
  async updateStudent(id: string, data: UpdateStudentDTO, auditContext?: AuditContext): Promise<StudentResponseDTO> {
    // Check if student exists and capture before state
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

    // Log audit event (Requirement: 19.2)
    if (auditContext) {
      await this.auditLogger.logUpdate(
        'student',
        id,
        this.toResponseDTO(existing),
        this.toResponseDTO(updated),
        auditContext
      );
    }

    return this.toResponseDTO(updated);
  }

  /**
   * Delete student by ID (soft delete)
   * Requirement: 2.7, 19.3
   */
  async deleteStudent(id: string, auditContext?: AuditContext): Promise<void> {
    const existing = await this.studentRepository.findById(id);
    if (!existing) {
      throw new NotFoundError('Student not found');
    }

    await this.studentRepository.softDelete(id);

    // Log audit event (Requirement: 19.3)
    if (auditContext) {
      await this.auditLogger.logDelete(
        'student',
        id,
        this.toResponseDTO(existing),
        auditContext
      );
    }
  }

  /**
   * Get complete student profile with aggregated data
   * Fetches student, skills, violations, affiliations, academic history, and enrollments
   * Uses batch queries to prevent N+1 query problems
   * Requirements: 10.1, 10.2, 10.3, 10.4
   */
  async getStudentProfile(id: string): Promise<StudentProfileDTO> {
    const student = await this.studentRepository.findById(id);
    if (!student) {
      throw new NotFoundError('Student not found');
    }

    // Fetch all related data in parallel using Promise.all for optimal performance
    // Each repository uses batch query methods (findByStudentIds) to prevent N+1 queries
    const [skills, violations, affiliations, academicHistory, enrollments] = await Promise.all([
      this.skillRepository.findByStudentIds([id]),
      this.violationRepository.findByStudentIds([id]),
      this.affiliationRepository.findByStudentIds([id]),
      this.academicHistoryRepository.findByStudentIds([id]),
      this.enrollmentRepository.findByStudentIds([id]),
    ]);

    // Transform aggregated data to StudentProfileDTO
    return {
      ...this.toResponseDTO(student),
      skills: skills.map((skill) => ({
        id: skill.id,
        skill_name: skill.skill_name,
        proficiency_level: skill.proficiency_level || undefined,
        years_of_experience: skill.years_of_experience || undefined,
        created_at: skill.created_at.toISOString(),
        updated_at: skill.updated_at.toISOString(),
      })),
      violations: violations.map((violation) => ({
        id: violation.id,
        violation_type: violation.violation_type,
        description: violation.description,
        violation_date: violation.violation_date,
        resolution_status: violation.resolution_status,
        resolution_notes: violation.resolution_notes || undefined,
        resolved_at: violation.resolved_at ? violation.resolved_at.toISOString() : undefined,
        created_at: violation.created_at.toISOString(),
        updated_at: violation.updated_at.toISOString(),
      })),
      affiliations: affiliations.map((affiliation) => ({
        id: affiliation.id,
        organization_name: affiliation.organization_name,
        role: affiliation.role || undefined,
        start_date: affiliation.start_date,
        end_date: affiliation.end_date || undefined,
        is_active: affiliation.is_active,
        created_at: affiliation.created_at.toISOString(),
        updated_at: affiliation.updated_at.toISOString(),
      })),
      academic_history: academicHistory.map((record) => ({
        id: record.id,
        subject_code: record.subject_code,
        subject_name: record.subject_name,
        grade: parseFloat(record.grade),
        semester: record.semester,
        academic_year: record.academic_year,
        credits: record.credits,
        remarks: record.remarks || undefined,
        created_at: record.created_at.toISOString(),
        updated_at: record.updated_at.toISOString(),
      })),
      enrollments: enrollments.map((item) => ({
        id: item.enrollment.id,
        instruction_id: item.enrollment.instruction_id,
        subject_code: item.instruction?.subject_code || '',
        subject_name: item.instruction?.subject_name || '',
        enrollment_status: item.enrollment.enrollment_status,
        semester: item.enrollment.semester,
        academic_year: item.enrollment.academic_year,
        enrolled_at: item.enrollment.enrolled_at?.toISOString() || new Date().toISOString(),
        created_at: item.enrollment.created_at.toISOString(),
        updated_at: item.enrollment.updated_at.toISOString(),
      })),
    };
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

  /**
   * Generate human-readable student ID
   * Format: S-YYYY-0001
   * 
   * @param tx - Transaction context (required)
   * @returns Generated student ID
   */
  private async generateStudentId(
    tx: Parameters<Parameters<Database['transaction']>[0]>[0]
  ): Promise<string> {
    const currentYear = IDGenerator.getCurrentYear();

    // Ensure counter exists for current year
    await this.entityCounterRepository.getOrCreateCounter('student', currentYear, tx);

    // Increment counter and get new sequence
    const sequence = await this.entityCounterRepository.incrementCounter('student', currentYear, tx);

    // Generate human-readable ID
    return IDGenerator.generate('student', sequence, currentYear);
  }

  /**
   * Get soft-deleted students (admin only)
   * Requirements: 28.5
   */
  async getDeletedStudents(filters?: StudentFilters): Promise<StudentListResponseDTO> {
    const result = await this.studentRepository.findDeleted(filters);

    return {
      data: result.data.map((student) => this.toResponseDTO(student)),
      meta: result.meta,
    };
  }

  /**
   * Restore soft-deleted student
   * Requirements: 28.7
   */
  async restoreStudent(id: string, auditContext?: AuditContext): Promise<StudentResponseDTO> {
    // Find student including deleted
    const student = await this.studentRepository.findByIdIncludingDeleted(id);
    if (!student) {
      throw new NotFoundError('Student not found');
    }

    if (!student.deleted_at) {
      throw new ConflictError('Student is not deleted');
    }

    // Restore student
    await this.studentRepository.restore(id);

    // Log audit
    if (auditContext) {
      await this.auditLogger.log({
        user_id: auditContext.user_id,
        action_type: 'restore',
        entity_type: 'student',
        entity_id: id,
        before_state: { deleted_at: student.deleted_at },
        after_state: { deleted_at: null },
        ip_address: auditContext.ip_address,
        user_agent: auditContext.user_agent,
      });
    }

    // Fetch and return restored student
    const restored = await this.studentRepository.findById(id);
    return this.toResponseDTO(restored!);
  }

  /**
   * Permanently delete student (hard delete)
   * Requirements: 28.6
   */
  async permanentDeleteStudent(id: string, auditContext?: AuditContext): Promise<void> {
    // Find student including deleted
    const student = await this.studentRepository.findByIdIncludingDeleted(id);
    if (!student) {
      throw new NotFoundError('Student not found');
    }

    // Log audit before deletion
    if (auditContext) {
      await this.auditLogger.log({
        user_id: auditContext.user_id,
        action_type: 'permanent_delete',
        entity_type: 'student',
        entity_id: id,
        before_state: student,
        after_state: null,
        ip_address: auditContext.ip_address,
        user_agent: auditContext.user_agent,
      });
    }

    // Permanently delete
    await this.studentRepository.permanentDelete(id);
  }
}
