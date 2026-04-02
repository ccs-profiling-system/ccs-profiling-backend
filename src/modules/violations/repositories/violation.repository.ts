/**
 * Violation Repository
 * Database access layer for violation operations
 * 
 * Requirements: 6.1, 6.3
 */

import { eq, and, inArray, sql } from 'drizzle-orm';
import { Database } from '../../../db';
import { violations } from '../../../db/schema';
import { ViolationFilters } from '../types';

export interface CreateViolationData {
  id?: string; // Optional UUID v7, generated if not provided
  student_id: string;
  violation_type: string;
  description: string;
  violation_date: string;
}

export interface UpdateViolationData {
  violation_type?: string;
  description?: string;
  violation_date?: string;
  resolution_status?: string;
  resolution_notes?: string;
  resolved_at?: Date | null;
}

export class ViolationRepository {
  constructor(private db: Database) {}

  /**
   * Find violation record by UUID
   * Requirement: 6.1
   */
  async findById(id: string) {
    const result = await this.db
      .select()
      .from(violations)
      .where(eq(violations.id, id))
      .limit(1);

    return result[0] || null;
  }

  /**
   * Find violation records by student ID
   * Requirement: 6.3
   */
  async findByStudentId(studentId: string) {
    return await this.db
      .select()
      .from(violations)
      .where(eq(violations.student_id, studentId))
      .orderBy(violations.violation_date);
  }

  /**
   * Batch query to find violations by multiple student IDs
   * Prevents N+1 query problem
   * Requirement: 6.3
   */
  async findByStudentIds(studentIds: string[]) {
    if (studentIds.length === 0) {
      return [];
    }

    return await this.db
      .select()
      .from(violations)
      .where(inArray(violations.student_id, studentIds))
      .orderBy(violations.violation_date);
  }

  /**
   * Find all violation records with pagination and filters
   * Requirements: 6.1, 6.3
   */
  async findAll(filters?: ViolationFilters) {
    const page = filters?.page || 1;
    const limit = Math.min(filters?.limit || 10, 100); // Max 100 items per page
    const offset = (page - 1) * limit;

    // Build where conditions
    const conditions = [];

    // Filter by student_id
    if (filters?.student_id) {
      conditions.push(eq(violations.student_id, filters.student_id));
    }

    // Filter by resolution_status
    if (filters?.resolution_status) {
      conditions.push(eq(violations.resolution_status, filters.resolution_status));
    }

    // Get total count
    const countResult = await this.db
      .select({ count: sql<number>`count(*)` })
      .from(violations)
      .where(conditions.length > 0 ? and(...conditions) : undefined);

    const total = Number(countResult[0]?.count || 0);

    // Get paginated results
    const results = await this.db
      .select()
      .from(violations)
      .where(conditions.length > 0 ? and(...conditions) : undefined)
      .limit(limit)
      .offset(offset)
      .orderBy(violations.violation_date);

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
   * Create a new violation record
   * Requirement: 6.1
   */
  async create(data: CreateViolationData, tx?: Database) {
    const dbInstance = tx || this.db;
    const result = await dbInstance.insert(violations).values(data).returning();

    return result[0];
  }

  /**
   * Update violation record by ID
   * Requirement: 6.3
   */
  async update(id: string, data: UpdateViolationData, tx?: Database) {
    const dbInstance = tx || this.db;
    const result = await dbInstance
      .update(violations)
      .set({
        ...data,
        updated_at: new Date(),
      })
      .where(eq(violations.id, id))
      .returning();

    return result[0] || null;
  }

  /**
   * Delete violation record by ID
   * Requirement: 6.3
   */
  async delete(id: string) {
    await this.db.delete(violations).where(eq(violations.id, id));
  }
}
