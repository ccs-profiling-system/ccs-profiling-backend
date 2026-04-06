/**
 * Faculty Repository
 * Database access layer for faculty operations
 * 
 * Requirements: 3.1, 3.4, 3.5, 28.2, 28.4
 */

import { eq, and, isNull, or, ilike, sql } from 'drizzle-orm';
import { Database } from '../../../db';
import { faculty } from '../../../db/schema';
import { FacultyFilters } from '../types';
import { calculateOffset, normalizePaginationParams } from '../../../shared/utils/pagination';
import { createPaginationMeta } from '../../../shared/utils/apiResponse';

export interface CreateFacultyData {
  id?: string; // Optional UUID v7, generated if not provided
  faculty_id: string;
  user_id?: string;
  first_name: string;
  last_name: string;
  middle_name?: string;
  email: string;
  phone?: string;
  department: string;
  position?: string;
  specialization?: string;
}

export interface UpdateFacultyData {
  first_name?: string;
  last_name?: string;
  middle_name?: string;
  email?: string;
  phone?: string;
  department?: string;
  position?: string;
  specialization?: string;
  status?: string;
}

export class FacultyRepository {
  constructor(private db: Database) {}

  /**
   * Find faculty by UUID (excludes soft-deleted)
   * Requirement: 3.4
   */
  async findById(id: string) {
    const result = await this.db
      .select()
      .from(faculty)
      .where(and(eq(faculty.id, id), isNull(faculty.deleted_at)))
      .limit(1);

    return result[0] || null;
  }

  /**
   * Find faculty by faculty_id (excludes soft-deleted)
   * Requirement: 3.4
   */
  async findByFacultyId(facultyId: string) {
    const result = await this.db
      .select()
      .from(faculty)
      .where(and(eq(faculty.faculty_id, facultyId), isNull(faculty.deleted_at)))
      .limit(1);

    return result[0] || null;
  }

  /**
   * Find all faculty with pagination and filters (excludes soft-deleted)
   * Supports search by name or faculty_id
   * Supports filter by department
   * Requirements: 3.4, 28.4, 27.1, 27.2, 27.3, 27.4, 27.5, 27.6, 27.7
   */
  async findAll(filters?: FacultyFilters) {
    // Normalize pagination parameters
    const { page, limit } = normalizePaginationParams(
      { page: filters?.page, limit: filters?.limit },
      10,
      100
    );
    const offset = calculateOffset(page, limit);

    // Build where conditions
    const conditions = [isNull(faculty.deleted_at)];

    // Search by name or faculty_id
    if (filters?.search) {
      const searchTerm = `%${filters.search}%`;
      conditions.push(
        or(
          ilike(faculty.first_name, searchTerm),
          ilike(faculty.last_name, searchTerm),
          ilike(faculty.faculty_id, searchTerm)
        )!
      );
    }

    // Filter by department
    if (filters?.department) {
      conditions.push(eq(faculty.department, filters.department));
    }

    // Filter by status
    if (filters?.status) {
      conditions.push(eq(faculty.status, filters.status));
    }

    // Get total count
    const countResult = await this.db
      .select({ count: sql<number>`count(*)` })
      .from(faculty)
      .where(and(...conditions));

    const total = Number(countResult[0]?.count || 0);

    // Get paginated results
    const results = await this.db
      .select()
      .from(faculty)
      .where(and(...conditions))
      .limit(limit)
      .offset(offset)
      .orderBy(faculty.created_at);

    // Requirement 27.6 - Return empty data array when no records found
    return {
      data: results,
      meta: createPaginationMeta(page, limit, total),
    };
  }

  /**
   * Create a new faculty
   * Requirement: 3.1
   */
  async create(data: CreateFacultyData, tx?: Database) {
    const dbInstance = tx || this.db;
    const result = await dbInstance.insert(faculty).values(data).returning();

    return result[0];
  }

  /**
   * Update faculty by ID
   * Requirement: 3.4
   */
  async update(id: string, data: UpdateFacultyData, tx?: Database) {
    const dbInstance = tx || this.db;
    const result = await dbInstance
      .update(faculty)
      .set({
        ...data,
        updated_at: new Date(),
      })
      .where(eq(faculty.id, id))
      .returning();

    return result[0] || null;
  }

  /**
   * Soft delete faculty by ID
   * Requirements: 3.5, 28.2
   */
  async softDelete(id: string) {
    await this.db
      .update(faculty)
      .set({
        deleted_at: new Date(),
        updated_at: new Date(),
      })
      .where(eq(faculty.id, id));
  }

  /**
   * Restore soft-deleted faculty
   * Requirement: 28.2
   */
  async restore(id: string) {
    await this.db
      .update(faculty)
      .set({
        deleted_at: null,
        updated_at: new Date(),
      })
      .where(eq(faculty.id, id));
  }

  /**
   * Find faculty by email (excludes soft-deleted)
   */
  async findByEmail(email: string) {
    const result = await this.db
      .select()
      .from(faculty)
      .where(and(eq(faculty.email, email), isNull(faculty.deleted_at)))
      .limit(1);

    return result[0] || null;
  }
}
