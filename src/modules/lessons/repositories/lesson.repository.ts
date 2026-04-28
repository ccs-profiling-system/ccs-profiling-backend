import { eq, and, isNull } from 'drizzle-orm';
import { db } from '../../../db';
import { lessons } from '../../../db/schema';
import { NewLesson, Lesson } from '../types';

/**
 * Lesson Repository
 * Handles database operations for lessons
 */
export class LessonRepository {
  /**
   * Find all lessons by subject ID
   */
  async findBySubjectId(subjectId: string): Promise<Lesson[]> {
    return await db
      .select()
      .from(lessons)
      .where(and(eq(lessons.subject_id, subjectId), isNull(lessons.deleted_at)))
      .orderBy(lessons.week);
  }

  /**
   * Find lesson by ID
   */
  async findById(id: string): Promise<Lesson | undefined> {
    const [result] = await db
      .select()
      .from(lessons)
      .where(and(eq(lessons.id, id), isNull(lessons.deleted_at)));

    return result;
  }

  /**
   * Create new lesson
   */
  async create(data: NewLesson): Promise<Lesson> {
    const [result] = await db.insert(lessons).values(data).returning();
    return result;
  }

  /**
   * Update lesson by ID
   */
  async update(id: string, data: Partial<NewLesson>): Promise<Lesson | undefined> {
    const [result] = await db
      .update(lessons)
      .set({ ...data, updated_at: new Date() })
      .where(and(eq(lessons.id, id), isNull(lessons.deleted_at)))
      .returning();

    return result;
  }

  /**
   * Soft delete lesson by ID
   */
  async softDelete(id: string): Promise<boolean> {
    const [result] = await db
      .update(lessons)
      .set({ deleted_at: new Date() })
      .where(and(eq(lessons.id, id), isNull(lessons.deleted_at)))
      .returning();

    return !!result;
  }

  /**
   * Permanently delete lesson by ID
   */
  async permanentDelete(id: string): Promise<boolean> {
    const result = await db.delete(lessons).where(eq(lessons.id, id));
    return Array.isArray(result) ? result.length > 0 : true;
  }
}
