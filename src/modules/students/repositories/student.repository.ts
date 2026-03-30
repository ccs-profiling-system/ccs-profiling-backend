/**
 * Student Repository
 * Database access layer for student operations
 * 
 * Requirements: 2.1, 2.5, 2.7, 28.2, 28.4
 */

import { eq, and, isNull, or, like, sql } from 'drizzle-orm';
import { Database } from '../../../db';
import { students } from '../../../db/schema';
import { StudentFilters } from '../types';

export interface CreateStudentData {
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
   * Requirement: 2.5
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
   * Requirement: 2.5
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
   * Requirements: 2.5, 28.4
   */
  async findAll(filters?: StudentFilters) {
    const page = filters?.page || 1;
    const limit = Math.min(filters?.limit || 10, 100); // Max 100 items per page
    const offset = (page - 1) * limit;

    // Build where conditions
    const conditions = [isNull(students.deleted_at)];

    // Search by name or student_id
    if (filters?.search) {
      const searchTerm = `%${filters.search}%`;
      conditions.push(
        or(
          like(students.first_name, searchTerm),
          like(students.last_name, searchTerm),
          like(students.student_id, searchTerm)
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
      meta: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * Create a new student
   * Requirement: 2.1
   */
  async create(data: CreateStudentData, tx?: Database) {
    const dbInstance = tx || this.db;
    const result = await dbInstance.insert(students).values(data).returning();

    return result[0];
  }

  /**
   * Update student by ID
   * Requirement: 2.6
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
   * Requirements: 2.7, 28.2
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
   * Requirement: 28.2
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
