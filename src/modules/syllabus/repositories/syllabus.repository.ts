import { eq, and, isNull } from 'drizzle-orm';
import { db } from '../../../db';
import { syllabus } from '../../../db/schema';
import { NewSyllabus, Syllabus } from '../types';

/**
 * Syllabus Repository
 * Handles database operations for syllabus
 */
export class SyllabusRepository {
  /**
   * Find syllabus by subject ID
   */
  async findBySubjectId(subjectId: string): Promise<Syllabus | undefined> {
    const [result] = await db
      .select()
      .from(syllabus)
      .where(and(eq(syllabus.subject_id, subjectId), isNull(syllabus.deleted_at)));

    return result;
  }

  /**
   * Find syllabus by ID
   */
  async findById(id: string): Promise<Syllabus | undefined> {
    const [result] = await db
      .select()
      .from(syllabus)
      .where(and(eq(syllabus.id, id), isNull(syllabus.deleted_at)));

    return result;
  }

  /**
   * Create new syllabus
   */
  async create(data: NewSyllabus): Promise<Syllabus> {
    const [result] = await db.insert(syllabus).values(data).returning();
    return result;
  }

  /**
   * Update syllabus by subject ID
   */
  async updateBySubjectId(subjectId: string, data: Partial<NewSyllabus>): Promise<Syllabus | undefined> {
    const [result] = await db
      .update(syllabus)
      .set({ ...data, updated_at: new Date() })
      .where(and(eq(syllabus.subject_id, subjectId), isNull(syllabus.deleted_at)))
      .returning();

    return result;
  }

  /**
   * Soft delete syllabus by subject ID
   */
  async softDeleteBySubjectId(subjectId: string): Promise<boolean> {
    const [result] = await db
      .update(syllabus)
      .set({ deleted_at: new Date() })
      .where(and(eq(syllabus.subject_id, subjectId), isNull(syllabus.deleted_at)))
      .returning();

    return !!result;
  }

  /**
   * Permanently delete syllabus by subject ID
   */
  async permanentDeleteBySubjectId(subjectId: string): Promise<boolean> {
    const result = await db
      .delete(syllabus)
      .where(eq(syllabus.subject_id, subjectId));
    
    return Array.isArray(result) ? result.length > 0 : true;
  }
}
