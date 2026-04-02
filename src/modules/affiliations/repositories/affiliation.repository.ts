/**
 * Affiliation Repository
 * Database access layer for affiliation operations
 * 
 * Requirements: 7.1, 7.3
 */

import { eq, and, inArray, sql } from 'drizzle-orm';
import { Database } from '../../../db';
import { affiliations } from '../../../db/schema';
import { AffiliationFilters } from '../types';

export interface CreateAffiliationData {
  id?: string; // Optional UUID v7, generated if not provided
  student_id: string;
  organization_name: string;
  role?: string;
  start_date: string;
  end_date?: string;
}

export interface UpdateAffiliationData {
  organization_name?: string;
  role?: string;
  start_date?: string;
  end_date?: string;
  is_active?: boolean;
}

export class AffiliationRepository {
  constructor(private db: Database) {}

  /**
   * Find affiliation record by UUID
   * Requirement: 7.1
   */
  async findById(id: string) {
    const result = await this.db
      .select()
      .from(affiliations)
      .where(eq(affiliations.id, id))
      .limit(1);

    return result[0] || null;
  }

  /**
   * Find affiliation records by student ID
   * Requirement: 7.3
   */
  async findByStudentId(studentId: string) {
    return await this.db
      .select()
      .from(affiliations)
      .where(eq(affiliations.student_id, studentId))
      .orderBy(affiliations.start_date);
  }

  /**
   * Batch query to find affiliations by multiple student IDs
   * Prevents N+1 query problem
   * Requirement: 7.3
   */
  async findByStudentIds(studentIds: string[]) {
    if (studentIds.length === 0) {
      return [];
    }

    return await this.db
      .select()
      .from(affiliations)
      .where(inArray(affiliations.student_id, studentIds))
      .orderBy(affiliations.start_date);
  }

  /**
   * Find all affiliation records with pagination and filters
   * Requirements: 7.1, 7.3
   */
  async findAll(filters?: AffiliationFilters) {
    const page = filters?.page || 1;
    const limit = Math.min(filters?.limit || 10, 100); // Max 100 items per page
    const offset = (page - 1) * limit;

    // Build where conditions
    const conditions = [];

    // Filter by student_id
    if (filters?.student_id) {
      conditions.push(eq(affiliations.student_id, filters.student_id));
    }

    // Filter by is_active
    if (filters?.is_active !== undefined) {
      conditions.push(eq(affiliations.is_active, filters.is_active));
    }

    // Get total count
    const countResult = await this.db
      .select({ count: sql<number>`count(*)` })
      .from(affiliations)
      .where(conditions.length > 0 ? and(...conditions) : undefined);

    const total = Number(countResult[0]?.count || 0);

    // Get paginated results
    const results = await this.db
      .select()
      .from(affiliations)
      .where(conditions.length > 0 ? and(...conditions) : undefined)
      .limit(limit)
      .offset(offset)
      .orderBy(affiliations.start_date);

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
   * Create a new affiliation record
   * Requirement: 7.1
   */
  async create(data: CreateAffiliationData, tx?: Database) {
    const dbInstance = tx || this.db;
    const result = await dbInstance.insert(affiliations).values(data).returning();

    return result[0];
  }

  /**
   * Update affiliation record by ID
   * Requirement: 7.1
   */
  async update(id: string, data: UpdateAffiliationData, tx?: Database) {
    const dbInstance = tx || this.db;
    const result = await dbInstance
      .update(affiliations)
      .set({
        ...data,
        updated_at: new Date(),
      })
      .where(eq(affiliations.id, id))
      .returning();

    return result[0] || null;
  }

  /**
   * Delete affiliation record by ID
   * Requirement: 7.1
   */
  async delete(id: string) {
    await this.db.delete(affiliations).where(eq(affiliations.id, id));
  }
}
