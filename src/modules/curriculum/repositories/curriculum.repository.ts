import { eq, and, or, like, isNull, sql, desc } from 'drizzle-orm';
import { db } from '../../../db';
import { curriculum } from '../../../db/schema';
import { NewCurriculum, Curriculum } from '../types';
import { ListCurriculumQueryDto } from '../types/dtos';

/**
 * Curriculum Repository
 * Handles database operations for curriculum
 */
export class CurriculumRepository {
  /**
   * Find all curriculum with pagination and filters
   */
  async findAll(query: ListCurriculumQueryDto) {
    const { search, program, year, status, page = 1, limit = 20 } = query;
    const offset = (page - 1) * limit;

    // Build where conditions
    const conditions = [isNull(curriculum.deleted_at)];

    if (search) {
      conditions.push(
        or(
          like(curriculum.code, `%${search}%`),
          like(curriculum.name, `%${search}%`),
          like(curriculum.program, `%${search}%`)
        )!
      );
    }

    if (program) {
      conditions.push(eq(curriculum.program, program));
    }

    if (year) {
      conditions.push(eq(curriculum.year, year));
    }

    if (status) {
      conditions.push(eq(curriculum.status, status));
    }

    // Get total count
    const [{ count }] = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(curriculum)
      .where(and(...conditions));

    // Get paginated results
    const results = await db
      .select()
      .from(curriculum)
      .where(and(...conditions))
      .orderBy(desc(curriculum.created_at))
      .limit(limit)
      .offset(offset);

    return {
      data: results,
      meta: {
        page,
        limit,
        total: count,
        totalPages: Math.ceil(count / limit),
      },
    };
  }

  /**
   * Find curriculum by ID
   */
  async findById(id: string): Promise<Curriculum | undefined> {
    const [result] = await db
      .select()
      .from(curriculum)
      .where(and(eq(curriculum.id, id), isNull(curriculum.deleted_at)));

    return result;
  }

  /**
   * Find curriculum by code
   */
  async findByCode(code: string): Promise<Curriculum | undefined> {
    const [result] = await db
      .select()
      .from(curriculum)
      .where(and(eq(curriculum.code, code), isNull(curriculum.deleted_at)));

    return result;
  }

  /**
   * Create new curriculum
   */
  async create(data: NewCurriculum): Promise<Curriculum> {
    const [result] = await db.insert(curriculum).values(data).returning();
    return result;
  }

  /**
   * Update curriculum by ID
   */
  async update(id: string, data: Partial<NewCurriculum>): Promise<Curriculum | undefined> {
    const [result] = await db
      .update(curriculum)
      .set({ ...data, updated_at: new Date() })
      .where(and(eq(curriculum.id, id), isNull(curriculum.deleted_at)))
      .returning();

    return result;
  }

  /**
   * Soft delete curriculum by ID
   */
  async softDelete(id: string): Promise<boolean> {
    const [result] = await db
      .update(curriculum)
      .set({ deleted_at: new Date() })
      .where(and(eq(curriculum.id, id), isNull(curriculum.deleted_at)))
      .returning();

    return !!result;
  }

  /**
   * Restore soft-deleted curriculum
   */
  async restore(id: string): Promise<Curriculum | undefined> {
    const [result] = await db
      .update(curriculum)
      .set({ deleted_at: null })
      .where(eq(curriculum.id, id))
      .returning();

    return result;
  }

  /**
   * Permanently delete curriculum
   */
  async permanentDelete(id: string): Promise<boolean> {
    const result = await db.delete(curriculum).where(eq(curriculum.id, id));
    return result.rowCount > 0;
  }

  /**
   * Get deleted curriculum
   */
  async findDeleted() {
    return await db
      .select()
      .from(curriculum)
      .where(sql`${curriculum.deleted_at} IS NOT NULL`)
      .orderBy(desc(curriculum.deleted_at));
  }
}
