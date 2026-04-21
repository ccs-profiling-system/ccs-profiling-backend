/**
 * Student Service
 * 
 * Provides business logic for student management in the department chair portal.
 * All operations are department-scoped to ensure multi-tenant data isolation.
 * 
 * Features:
 * - List students with pagination and filtering
 * - Get individual student details
 * - Approve/reject students with workflow validation
 * - Audit logging for approval/rejection actions
 * 
 * Requirements: 3.1, 3.2, 3.5, 3.8, 3.9, 3.11, 3.12, 3.13, 3.15, 11.1, 11.5, 13.1, 13.6
 */

import { db } from '../../../db';
import { students } from '../../../db/schema';
import { eq, and, isNull, or, ilike, sql } from 'drizzle-orm';
import { PaginatedResponse, PaginationParams } from '../types';
import { validateApprovalState, validateRejectionState } from '../utils/workflowValidation';
import { AuditLogRepository, CreateAuditLogData } from '../../audit-logs/repositories/auditLog.repository';

/**
 * Student filters for list queries
 */
export interface StudentFilters extends PaginationParams {
  status?: string;
  year_level?: number;
  search?: string;
}

/**
 * Student response DTO
 */
export interface StudentDTO {
  id: string;
  student_id: string;
  user_id: string | null;
  first_name: string;
  last_name: string;
  middle_name: string | null;
  email: string;
  phone: string | null;
  date_of_birth: string | null;
  address: string | null;
  year_level: number | null;
  program: string | null;
  status: string;
  created_at: string;
  updated_at: string;
}

/**
 * Approval action data
 */
export interface ApprovalData {
  approver_notes?: string;
}

/**
 * Rejection action data
 */
export interface RejectionData {
  rejection_reason: string;
}

export class StudentService {
  private auditLogRepository: AuditLogRepository;

  constructor() {
    this.auditLogRepository = new AuditLogRepository(db);
  }

  /**
   * List students with pagination and filtering
   * 
   * Supports filtering by:
   * - status: Filter by student status (active, pending_approval, etc.)
   * - year_level: Filter by year level
   * - search: Search by name or email (case-insensitive)
   * 
   * All results are scoped to the specified department.
   * 
   * @param departmentId - Department ID to scope the query
   * @param filters - Pagination and filter parameters
   * @returns Paginated list of students
   * 
   * Requirements: 3.1, 3.2, 3.3, 3.4, 13.1, 13.6
   */
  async listStudents(
    departmentId: string,
    filters: StudentFilters
  ): Promise<PaginatedResponse<StudentDTO>> {
    const page = filters.page || 1;
    const limit = Math.min(filters.limit || 10, 100);
    const offset = (page - 1) * limit;

    // Build filter conditions
    const conditions = [
      eq(students.program, departmentId),
      isNull(students.deleted_at),
    ];

    // Add status filter
    if (filters.status) {
      conditions.push(eq(students.status, filters.status));
    }

    // Add year level filter
    if (filters.year_level !== undefined) {
      conditions.push(eq(students.year_level, filters.year_level));
    }

    // Add search filter (name or email)
    if (filters.search) {
      const searchPattern = `%${filters.search}%`;
      conditions.push(
        or(
          ilike(students.first_name, searchPattern),
          ilike(students.last_name, searchPattern),
          ilike(students.email, searchPattern)
        )!
      );
    }

    // Get total count
    const countResult = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(students)
      .where(and(...conditions));

    const total = countResult[0]?.count || 0;

    // Get paginated results
    const results = await db
      .select()
      .from(students)
      .where(and(...conditions))
      .limit(limit)
      .offset(offset)
      .orderBy(sql`${students.created_at} DESC`);

    return {
      data: results.map(this.toDTO),
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * Get student by ID with department validation
   * 
   * Validates that the student belongs to the specified department.
   * Returns null if student doesn't exist or is outside department scope.
   * 
   * @param id - Student ID
   * @param departmentId - Department ID to validate scope
   * @returns Student details or null if not found
   * 
   * Requirements: 3.5, 3.6, 3.7, 13.2, 13.7
   */
  async getStudentById(id: string, departmentId: string): Promise<StudentDTO | null> {
    const result = await db
      .select()
      .from(students)
      .where(
        and(
          eq(students.id, id),
          eq(students.program, departmentId),
          isNull(students.deleted_at)
        )
      )
      .limit(1);

    if (!result[0]) {
      return null;
    }

    return this.toDTO(result[0]);
  }

  /**
   * Approve a student
   * 
   * Validates:
   * - Student exists and belongs to department
   * - Student status is 'pending_approval'
   * 
   * On success:
   * - Updates student status to 'approved'
   * - Creates audit log entry
   * 
   * @param id - Student ID
   * @param departmentId - Department ID to validate scope
   * @param approvalData - Approval data including optional notes
   * @param userId - ID of user performing the approval
   * @returns Updated student or null if not found
   * @throws Error if student is not in valid state for approval
   * 
   * Requirements: 3.8, 3.9, 3.10, 3.11, 11.1, 11.5
   */
  async approveStudent(
    id: string,
    departmentId: string,
    approvalData: ApprovalData,
    userId: string
  ): Promise<StudentDTO | null> {
    // Get student and validate department scope
    const student = await this.getStudentById(id, departmentId);
    if (!student) {
      return null;
    }

    // Validate workflow state
    const validation = validateApprovalState(student.status as any);
    if (!validation.valid) {
      throw new Error(validation.error);
    }

    // Update student status
    const updateResult = await db
      .update(students)
      .set({
        status: 'approved',
        updated_at: new Date(),
      })
      .where(eq(students.id, id))
      .returning();

    const updatedStudent = updateResult[0];

    // Create audit log entry
    const auditLogData: CreateAuditLogData = {
      user_id: userId,
      action_type: 'approve',
      entity_type: 'student',
      entity_id: id,
      before_state: { status: student.status },
      after_state: { 
        status: 'approved',
        approver_notes: approvalData.approver_notes,
      },
    };

    await this.auditLogRepository.create(auditLogData);

    return this.toDTO(updatedStudent);
  }

  /**
   * Reject a student
   * 
   * Validates:
   * - Student exists and belongs to department
   * - Student status is 'pending_approval'
   * 
   * On success:
   * - Updates student status to 'rejected'
   * - Creates audit log entry with rejection reason
   * 
   * @param id - Student ID
   * @param departmentId - Department ID to validate scope
   * @param rejectionData - Rejection data including required reason
   * @param userId - ID of user performing the rejection
   * @returns Updated student or null if not found
   * @throws Error if student is not in valid state for rejection
   * 
   * Requirements: 3.12, 3.13, 3.14, 3.15, 11.1, 11.5
   */
  async rejectStudent(
    id: string,
    departmentId: string,
    rejectionData: RejectionData,
    userId: string
  ): Promise<StudentDTO | null> {
    // Get student and validate department scope
    const student = await this.getStudentById(id, departmentId);
    if (!student) {
      return null;
    }

    // Validate workflow state
    const validation = validateRejectionState(student.status as any);
    if (!validation.valid) {
      throw new Error(validation.error);
    }

    // Update student status
    const updateResult = await db
      .update(students)
      .set({
        status: 'rejected',
        updated_at: new Date(),
      })
      .where(eq(students.id, id))
      .returning();

    const updatedStudent = updateResult[0];

    // Create audit log entry
    const auditLogData: CreateAuditLogData = {
      user_id: userId,
      action_type: 'reject',
      entity_type: 'student',
      entity_id: id,
      before_state: { status: student.status },
      after_state: { 
        status: 'rejected',
        rejection_reason: rejectionData.rejection_reason,
      },
    };

    await this.auditLogRepository.create(auditLogData);

    return this.toDTO(updatedStudent);
  }

  /**
   * Transform database entity to DTO
   */
  private toDTO(student: any): StudentDTO {
    return {
      id: student.id,
      student_id: student.student_id,
      user_id: student.user_id,
      first_name: student.first_name,
      last_name: student.last_name,
      middle_name: student.middle_name,
      email: student.email,
      phone: student.phone,
      date_of_birth: student.date_of_birth,
      address: student.address,
      year_level: student.year_level,
      program: student.program,
      status: student.status,
      created_at: student.created_at.toISOString(),
      updated_at: student.updated_at.toISOString(),
    };
  }
}
