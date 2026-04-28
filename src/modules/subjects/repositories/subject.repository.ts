import { eq, and, or, like, isNull, sql, desc } from 'drizzle-orm/pg-core';
import { db } from '../../../db';
import { subjects, syllabus, lessons } from '../../../db/schema';
import { NewSubject, Subject } from '../types';
import { ListSubjectsQueryDto } from '../types/dtos';

/**
 * Subject Repository
 * Handles database operations for subjects
 */
export class SubjectRepository {
  /**
   * Find all subjects with pagination and filters
   */
  async findAll(query: ListSubjectsQueryDto) {
    const { search, curriculumId, semester, yearLevel, type, page = 1, limit = 20 } = query;
    const offset = (page - 1) * limit;

    // Build where conditions
    const conditions = [isNull(subjects.deleted_at)];

    if (search) {
      conditions.push(
        or(
          like(subjects.code, `%${search}%`),
          like(subjects.name, `%${search}%`),
          like(subjects.description, `%${search}%`)
        )!
      );
    }

    if (curriculumId) {
      conditions.push(eq(subjects.curriculum_id, curriculumId));
    }

    if (semester) {
      conditions.push(eq(subjects.semester, semester));
    }

    if (yearLevel) {
      conditions.push(eq(subjects.year_level, yearLevel));
    }

    if (type) {
      conditions.push(eq(subjects.type, type));
    }

    // Get total count
    const [{ count }] = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(subjects)
      .where(and(...conditions));

    // Get paginated results
    const results = await db
      .select()
      .from(subjects)
      .where(and(...conditions))
      .orderBy(desc(subjects.created_at))
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
   * Find subject by ID with syllabus and lessons
   */
  async findById(id: string) {
    const [subject] = await db
      .select()
      .from(subjects)
      .where(and(eq(subjects.id, id), isNull(subjects.deleted_at)));

    if (!subject) {
      return undefined;
    }

    // Get syllabus
    const [subjectSyllabus] = await db
      .select()
      .from(syllabus)
      .where(and(eq(syllabus.subject_id, id), isNull(syllabus.deleted_at)));

    // Get lessons
    const subjectLessons = await db
      .select()
      .from(lessons)
      .where(and(eq(lessons.subject_id, id), isNull(lessons.deleted_at)))
      .orderBy(lessons.week);

    return {
      ...subject,
      syllabus: subjectSyllabus || null,
      lessons: subjectLessons,
    };
  }

  /**
   * Find subject by code
   */
  async findByCode(code: string): Promise<Subject | undefined> {
    const [result] = await db
      .select()
      .from(subjects)
      .where(and(eq(subjects.code, code), isNull(subjects.deleted_at)));

    return result;
  }

  /**
   * Create new subject
   */
  async create(data: NewSubject): Promise<Subject> {
    const [result] = await db.insert(subjects).values(data).returning();
    return result;
  }

  /**
   * Update subject by ID
   */
  async update(id: string, data: Partial<NewSubject>): Promise<Subject | undefined> {
    const [result] = await db
      .update(subjects)
      .set({ ...data, updated_at: new Date() })
      .where(and(eq(subjects.id, id), isNull(subjects.deleted_at)))
      .returning();

    return result;
  }

  /**
   * Soft delete subject by ID
   */
  async softDelete(id: string): Promise<boolean> {
    const [result] = await db
      .update(subjects)
      .set({ deleted_at: new Date() })
      .where(and(eq(subjects.id, id), isNull(subjects.deleted_at)))
      .returning();

    return !!result;
  }

  /**
   * Restore soft-deleted subject
   */
  async restore(id: string): Promise<Subject | undefined> {
    const [result] = await db
      .update(subjects)
      .set({ deleted_at: null })
      .where(eq(subjects.id, id))
      .returning();

    return result;
  }

  /**
   * Permanently delete subject
   */
  async permanentDelete(id: string): Promise<boolean> {
    const result = await db.delete(subjects).where(eq(subjects.id, id));
    return result.rowCount > 0;
  }

  /**
   * Get deleted subjects
   */
  async findDeleted() {
    return await db
      .select()
      .from(subjects)
      .where(sql`${subjects.deleted_at} IS NOT NULL`)
      .orderBy(desc(subjects.deleted_at));
  }
}
