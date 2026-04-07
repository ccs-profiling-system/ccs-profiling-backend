/**
 * Enrollment Repository
 * Database access layer for enrollment operations
 * 
 */

import { eq, and, inArray, sql } from 'drizzle-orm';
import { Database } from '../../../db';
import { enrollments, instructions } from '../../../db/schema';
import { EnrollmentFilters } from '../types';
import { calculateOffset, normalizePaginationParams } from '../../../shared/utils/pagination';
import { createPaginationMeta } from '../../../shared/utils/apiResponse';

export interface CreateEnrollmentData {
  id?: string; // Optional UUID v7, generated if not provided
  student_id: string;
  instruction_id: string;
  enrollment_status?: string;
  semester: string;
  academic_year: string;
}

export interface UpdateEnrollmentData {
  enrollment_status?: string;
}

export class EnrollmentRepository {
  constructor(private db: Database) {}

  /**
   * Find enrollment by UUID
   */
  async findById(id: string) {
    const result = await this.db
      .select({
        enrollment: enrollments,
        instruction: instructions,
      })
      .from(enrollments)
      .leftJoin(instructions, eq(enrollments.instruction_id, instructions.id))
      .where(eq(enrollments.id, id))
      .limit(1);

    return result[0] || null;
  }

  /**
   * Find enrollments by student ID
   */
  async findByStudentId(studentId: string) {
    return await this.db
      .select({
        enrollment: enrollments,
        instruction: instructions,
      })
      .from(enrollments)
      .leftJoin(instructions, eq(enrollments.instruction_id, instructions.id))
      .where(eq(enrollments.student_id, studentId))
      .orderBy(enrollments.academic_year, enrollments.semester);
  }

  /**
   * Find enrollments by instruction ID
   */
  async findByInstructionId(instructionId: string) {
    return await this.db
      .select({
        enrollment: enrollments,
        instruction: instructions,
      })
      .from(enrollments)
      .leftJoin(instructions, eq(enrollments.instruction_id, instructions.id))
      .where(eq(enrollments.instruction_id, instructionId))
      .orderBy(enrollments.academic_year, enrollments.semester);
  }

  /**
   * Batch query to find enrollments by multiple student IDs
   * Prevents N+1 query problem
   */
  async findByStudentIds(studentIds: string[]) {
    if (studentIds.length === 0) {
      return [];
    }

    return await this.db
      .select({
        enrollment: enrollments,
        instruction: instructions,
      })
      .from(enrollments)
      .leftJoin(instructions, eq(enrollments.instruction_id, instructions.id))
      .where(inArray(enrollments.student_id, studentIds))
      .orderBy(enrollments.academic_year, enrollments.semester);
  }

  /**
   * Find all enrollments with pagination and filters
   */
  async findAll(filters?: EnrollmentFilters) {
    // Normalize pagination parameters
    const { page, limit } = normalizePaginationParams(
      { page: filters?.page, limit: filters?.limit },
      10,
      100
    );
    const offset = calculateOffset(page, limit);

    // Build where conditions
    const conditions = [];

    // Filter by student_id
    if (filters?.student_id) {
      conditions.push(eq(enrollments.student_id, filters.student_id));
    }

    // Filter by instruction_id
    if (filters?.instruction_id) {
      conditions.push(eq(enrollments.instruction_id, filters.instruction_id));
    }

    // Filter by semester
    if (filters?.semester) {
      conditions.push(eq(enrollments.semester, filters.semester));
    }

    // Filter by academic_year
    if (filters?.academic_year) {
      conditions.push(eq(enrollments.academic_year, filters.academic_year));
    }

    // Filter by enrollment_status
    if (filters?.enrollment_status) {
      conditions.push(eq(enrollments.enrollment_status, filters.enrollment_status));
    }

    // Get total count
    const countResult = await this.db
      .select({ count: sql<number>`count(*)` })
      .from(enrollments)
      .where(conditions.length > 0 ? and(...conditions) : undefined);

    const total = Number(countResult[0]?.count || 0);

    // Get paginated results with instruction details
    const results = await this.db
      .select({
        enrollment: enrollments,
        instruction: instructions,
      })
      .from(enrollments)
      .leftJoin(instructions, eq(enrollments.instruction_id, instructions.id))
      .where(conditions.length > 0 ? and(...conditions) : undefined)
      .limit(limit)
      .offset(offset)
      .orderBy(enrollments.academic_year, enrollments.semester);

    return {
      data: results,
      meta: createPaginationMeta(page, limit, total),
    };
  }

  /**
   * Check if enrollment already exists
   * Used for duplicate prevention
   */
  async findDuplicate(
    studentId: string,
    instructionId: string,
    semester: string,
    academicYear: string
  ) {
    const result = await this.db
      .select()
      .from(enrollments)
      .where(
        and(
          eq(enrollments.student_id, studentId),
          eq(enrollments.instruction_id, instructionId),
          eq(enrollments.semester, semester),
          eq(enrollments.academic_year, academicYear)
        )
      )
      .limit(1);

    return result[0] || null;
  }

  /**
   * Create a new enrollment
   */
  async create(data: CreateEnrollmentData, tx?: Database) {
    const dbInstance = tx || this.db;
    const result = await dbInstance.insert(enrollments).values(data).returning();

    return result[0];
  }

  /**
   * Update enrollment by ID
   */
  async update(id: string, data: UpdateEnrollmentData, tx?: Database) {
    const dbInstance = tx || this.db;
    const result = await dbInstance
      .update(enrollments)
      .set({
        ...data,
        updated_at: new Date(),
      })
      .where(eq(enrollments.id, id))
      .returning();

    return result[0] || null;
  }

  /**
   * Delete enrollment by ID
   */
  async delete(id: string) {
    await this.db.delete(enrollments).where(eq(enrollments.id, id));
  }
}
