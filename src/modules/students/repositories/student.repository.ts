/**
 * Student Repository
 * Database access layer for student operations
 * 
 */

import { eq, and, isNull, or, ilike, sql } from 'drizzle-orm';
import { Database } from '../../../db';
import { students } from '../../../db/schema';
import { StudentFilters } from '../types';
import { calculateOffset, normalizePaginationParams } from '../../../shared/utils/pagination';
import { createPaginationMeta } from '../../../shared/utils/apiResponse';

export interface CreateStudentData {
  id?: string; // Optional UUID v7, generated if not provided
  student_id: string;
  user_id?: string;
  first_name: string;
  last_name: string;
  middle_name?: string;
  email: string;
  phone?: string;
  date_of_birth?: string;
  address?: string;
  year_level?: number;
  program?: string;
}

export interface UpdateStudentData {
  first_name?: string;
  last_name?: string;
  middle_name?: string;
  email?: string;
  phone?: string;
  date_of_birth?: string;
  address?: string;
  year_level?: number;
  program?: string;
  status?: string;
}

export class StudentRepository {
  constructor(private db: Database) {}

  /**
   * Find student by UUID (excludes soft-deleted)
   */
  async findById(id: string) {
    const result = await this.db
      .select()
      .from(students)
      .where(and(eq(students.id, id), isNull(students.deleted_at)))
      .limit(1);

    return result[0] || null;
  }

  /**
   * Find student by student_id (excludes soft-deleted)
   */
  async findByStudentId(studentId: string) {
    const result = await this.db
      .select()
      .from(students)
      .where(and(eq(students.student_id, studentId), isNull(students.deleted_at)))
      .limit(1);

    return result[0] || null;
  }

  /**
   * Find all students with pagination and filters (excludes soft-deleted)
   * Supports search by name or student_id
   */
  async findAll(filters?: StudentFilters) {
    // Normalize pagination parameters
    const { page, limit } = normalizePaginationParams(
      { page: filters?.page, limit: filters?.limit },
      10,
      100
    );
    const offset = calculateOffset(page, limit);

    // Build where conditions
    const conditions = [isNull(students.deleted_at)];

    // Search by name or student_id
    if (filters?.search) {
      const searchTerm = `%${filters.search}%`;
      conditions.push(
        or(
          ilike(students.first_name, searchTerm),
          ilike(students.last_name, searchTerm),
          ilike(students.student_id, searchTerm)
        )!
      );
    }

    // Filter by program
    if (filters?.program) {
      conditions.push(eq(students.program, filters.program));
    }

    // Filter by year_level
    if (filters?.year_level) {
      conditions.push(eq(students.year_level, filters.year_level));
    }

    // Filter by status
    if (filters?.status) {
      conditions.push(eq(students.status, filters.status));
    }

    // Get total count
    const countResult = await this.db
      .select({ count: sql<number>`count(*)` })
      .from(students)
      .where(and(...conditions));

    const total = Number(countResult[0]?.count || 0);

    // Get paginated results
    const results = await this.db
      .select()
      .from(students)
      .where(and(...conditions))
      .limit(limit)
      .offset(offset)
      .orderBy(students.created_at);

    return {
      data: results,
      meta: createPaginationMeta(page, limit, total),
    };
  }

  /**
   * Create a new student
   */
  async create(data: CreateStudentData, tx?: Database) {
    const dbInstance = tx || this.db;
    const result = await dbInstance.insert(students).values(data).returning();

    return result[0];
  }

  /**
   * Update student by ID
   */
  async update(id: string, data: UpdateStudentData, tx?: Database) {
    const dbInstance = tx || this.db;
    const result = await dbInstance
      .update(students)
      .set({
        ...data,
        updated_at: new Date(),
      })
      .where(eq(students.id, id))
      .returning();

    return result[0] || null;
  }

  /**
   * Soft delete student by ID
   */
  async softDelete(id: string) {
    await this.db
      .update(students)
      .set({
        deleted_at: new Date(),
        updated_at: new Date(),
      })
      .where(eq(students.id, id));
  }

  /**
   * Restore soft-deleted student
   */
  async restore(id: string) {
    await this.db
      .update(students)
      .set({
        deleted_at: null,
        updated_at: new Date(),
      })
      .where(eq(students.id, id));
  }

  /**
   * Find soft-deleted students (admin only)
   */
  async findDeleted(filters?: StudentFilters) {
    // Normalize pagination parameters
    const { page, limit } = normalizePaginationParams(
      { page: filters?.page, limit: filters?.limit },
      10,
      100
    );
    const offset = calculateOffset(page, limit);

    // Build where conditions - only include deleted records
    const conditions = [sql`${students.deleted_at} IS NOT NULL`];

    // Search by name or student_id
    if (filters?.search) {
      const searchTerm = `%${filters.search}%`;
      conditions.push(
        or(
          ilike(students.first_name, searchTerm),
          ilike(students.last_name, searchTerm),
          ilike(students.student_id, searchTerm)
        )!
      );
    }

    // Filter by program
    if (filters?.program) {
      conditions.push(eq(students.program, filters.program));
    }

    // Filter by year_level
    if (filters?.year_level) {
      conditions.push(eq(students.year_level, filters.year_level));
    }

    // Get total count
    const countResult = await this.db
      .select({ count: sql<number>`count(*)` })
      .from(students)
      .where(and(...conditions));

    const total = Number(countResult[0]?.count || 0);

    // Get paginated results
    const results = await this.db
      .select()
      .from(students)
      .where(and(...conditions))
      .limit(limit)
      .offset(offset)
      .orderBy(students.deleted_at);

    return {
      data: results,
      meta: createPaginationMeta(page, limit, total),
    };
  }

  /**
   * Permanently delete student by ID (hard delete)
   */
  async permanentDelete(id: string) {
    await this.db
      .delete(students)
      .where(eq(students.id, id));
  }

  /**
   * Find student by ID including soft-deleted (for restore/permanent delete operations)
   */
  async findByIdIncludingDeleted(id: string) {
    const result = await this.db
      .select()
      .from(students)
      .where(eq(students.id, id))
      .limit(1);

    return result[0] || null;
  }

  /**
   * Find student by email (excludes soft-deleted)
   */
  async findByEmail(email: string) {
    const result = await this.db
      .select()
      .from(students)
      .where(and(eq(students.email, email), isNull(students.deleted_at)))
      .limit(1);

    return result[0] || null;
  }
}
