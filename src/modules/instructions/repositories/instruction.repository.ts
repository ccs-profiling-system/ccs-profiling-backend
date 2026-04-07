/**
 * Instruction Repository
 * Database access layer for instruction operations
 * 
 */

import { eq, and, isNull, or, like, sql } from 'drizzle-orm';
import { Database } from '../../../db';
import { instructions } from '../../../db/schema';
import { InstructionFilters } from '../types';
import { calculateOffset, normalizePaginationParams } from '../../../shared/utils/pagination';
import { createPaginationMeta } from '../../../shared/utils/apiResponse';

export interface CreateInstructionData {
  id?: string; // Optional UUID v7, generated if not provided
  subject_code: string;
  subject_name: string;
  description?: string;
  credits: number;
  curriculum_year: string;
}

export interface UpdateInstructionData {
  subject_code?: string;
  subject_name?: string;
  description?: string;
  credits?: number;
  curriculum_year?: string;
}

export class InstructionRepository {
  constructor(private db: Database) {}

  /**
   * Find instruction by UUID (excludes soft-deleted)
   */
  async findById(id: string) {
    const result = await this.db
      .select()
      .from(instructions)
      .where(and(eq(instructions.id, id), isNull(instructions.deleted_at)))
      .limit(1);

    return result[0] || null;
  }

  /**
   * Find instruction by subject_code (excludes soft-deleted)
   */
  async findBySubjectCode(subjectCode: string, curriculumYear?: string) {
    const conditions = [
      eq(instructions.subject_code, subjectCode),
      isNull(instructions.deleted_at),
    ];

    if (curriculumYear) {
      conditions.push(eq(instructions.curriculum_year, curriculumYear));
    }

    const result = await this.db
      .select()
      .from(instructions)
      .where(and(...conditions))
      .limit(1);

    return result[0] || null;
  }

  /**
   * Find instructions by curriculum year (excludes soft-deleted)
   */
  async findByCurriculumYear(curriculumYear: string) {
    return await this.db
      .select()
      .from(instructions)
      .where(and(
        eq(instructions.curriculum_year, curriculumYear),
        isNull(instructions.deleted_at)
      ))
      .orderBy(instructions.subject_code);
  }

  /**
   * Find all instructions with pagination and filters (excludes soft-deleted)
   * Supports search by subject_code or subject_name
   * Supports filter by curriculum_year
   */
  async findAll(filters?: InstructionFilters) {
    // Normalize pagination parameters
    const { page, limit } = normalizePaginationParams(
      { page: filters?.page, limit: filters?.limit },
      10,
      100
    );
    const offset = calculateOffset(page, limit);

    // Build where conditions
    const conditions = [isNull(instructions.deleted_at)];

    // Search by subject_code or subject_name
    if (filters?.search) {
      const searchTerm = `%${filters.search}%`;
      conditions.push(
        or(
          like(instructions.subject_code, searchTerm),
          like(instructions.subject_name, searchTerm)
        )!
      );
    }

    // Filter by subject_code
    if (filters?.subject_code) {
      conditions.push(eq(instructions.subject_code, filters.subject_code));
    }

    // Filter by curriculum_year
    if (filters?.curriculum_year) {
      conditions.push(eq(instructions.curriculum_year, filters.curriculum_year));
    }

    // Get total count
    const countResult = await this.db
      .select({ count: sql<number>`count(*)` })
      .from(instructions)
      .where(and(...conditions));

    const total = Number(countResult[0]?.count || 0);

    // Get paginated results
    const results = await this.db
      .select()
      .from(instructions)
      .where(and(...conditions))
      .limit(limit)
      .offset(offset)
      .orderBy(instructions.curriculum_year, instructions.subject_code);

    return {
      data: results,
      meta: createPaginationMeta(page, limit, total),
    };
  }

  /**
   * Create a new instruction
   */
  async create(data: CreateInstructionData, tx?: Database) {
    const dbInstance = tx || this.db;
    const result = await dbInstance.insert(instructions).values(data).returning();

    return result[0];
  }

  /**
   * Update instruction by ID
   */
  async update(id: string, data: UpdateInstructionData, tx?: Database) {
    const dbInstance = tx || this.db;
    const result = await dbInstance
      .update(instructions)
      .set({
        ...data,
        updated_at: new Date(),
      })
      .where(eq(instructions.id, id))
      .returning();

    return result[0] || null;
  }

  /**
   * Soft delete instruction by ID
   */
  async softDelete(id: string) {
    await this.db
      .update(instructions)
      .set({
        deleted_at: new Date(),
        updated_at: new Date(),
      })
      .where(eq(instructions.id, id));
  }

  /**
   * Restore soft-deleted instruction
   */
  async restore(id: string) {
    await this.db
      .update(instructions)
      .set({
        deleted_at: null,
        updated_at: new Date(),
      })
      .where(eq(instructions.id, id));
  }

  /**
   * Find soft-deleted instructions (admin only)
   */
  async findDeleted(filters?: InstructionFilters) {
    // Normalize pagination parameters
    const { page, limit } = normalizePaginationParams(
      { page: filters?.page, limit: filters?.limit },
      10,
      100
    );
    const offset = calculateOffset(page, limit);

    // Build where conditions - only include deleted records
    const conditions = [sql`${instructions.deleted_at} IS NOT NULL`];

    // Search by subject_code or subject_name
    if (filters?.search) {
      const searchTerm = `%${filters.search}%`;
      conditions.push(
        or(
          like(instructions.subject_code, searchTerm),
          like(instructions.subject_name, searchTerm)
        )!
      );
    }

    // Filter by subject_code
    if (filters?.subject_code) {
      conditions.push(eq(instructions.subject_code, filters.subject_code));
    }

    // Filter by curriculum_year
    if (filters?.curriculum_year) {
      conditions.push(eq(instructions.curriculum_year, filters.curriculum_year));
    }

    // Get total count
    const countResult = await this.db
      .select({ count: sql<number>`count(*)` })
      .from(instructions)
      .where(and(...conditions));

    const total = Number(countResult[0]?.count || 0);

    // Get paginated results
    const results = await this.db
      .select()
      .from(instructions)
      .where(and(...conditions))
      .limit(limit)
      .offset(offset)
      .orderBy(instructions.deleted_at);

    return {
      data: results,
      meta: createPaginationMeta(page, limit, total),
    };
  }

  /**
   * Permanently delete instruction by ID (hard delete)
   */
  async permanentDelete(id: string) {
    await this.db
      .delete(instructions)
      .where(eq(instructions.id, id));
  }

  /**
   * Find instruction by ID including soft-deleted (for restore/permanent delete operations)
   */
  async findByIdIncludingDeleted(id: string) {
    const result = await this.db
      .select()
      .from(instructions)
      .where(eq(instructions.id, id))
      .limit(1);

    return result[0] || null;
  }
}
