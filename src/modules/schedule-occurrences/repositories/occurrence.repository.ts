import { eq, and, gte, lte, between } from 'drizzle-orm';
import { db } from '../../../db';
import { scheduleOccurrences } from '../../../db/schema';
import { NewScheduleOccurrence, ScheduleOccurrence } from '../types';

/**
 * Schedule Occurrence Repository
 * Handles database operations for schedule occurrences
 */
export class OccurrenceRepository {
  /**
   * Find all occurrences for a schedule
   */
  async findByScheduleId(scheduleId: string, start?: string, end?: string): Promise<ScheduleOccurrence[]> {
    const conditions = [eq(scheduleOccurrences.schedule_id, scheduleId)];

    if (start && end) {
      conditions.push(between(scheduleOccurrences.occurrence_date, start, end));
    } else if (start) {
      conditions.push(gte(scheduleOccurrences.occurrence_date, start));
    } else if (end) {
      conditions.push(lte(scheduleOccurrences.occurrence_date, end));
    }

    return await db
      .select()
      .from(scheduleOccurrences)
      .where(and(...conditions))
      .orderBy(scheduleOccurrences.occurrence_date);
  }

  /**
   * Find occurrence by ID
   */
  async findById(id: string): Promise<ScheduleOccurrence | undefined> {
    const [result] = await db
      .select()
      .from(scheduleOccurrences)
      .where(eq(scheduleOccurrences.id, id));

    return result;
  }

  /**
   * Create new occurrence
   */
  async create(data: NewScheduleOccurrence): Promise<ScheduleOccurrence> {
    const [result] = await db.insert(scheduleOccurrences).values(data).returning();
    return result;
  }

  /**
   * Create multiple occurrences
   */
  async createMany(data: NewScheduleOccurrence[]): Promise<ScheduleOccurrence[]> {
    if (data.length === 0) return [];
    return await db.insert(scheduleOccurrences).values(data).returning();
  }

  /**
   * Cancel occurrence
   */
  async cancel(id: string, reason: string): Promise<ScheduleOccurrence | undefined> {
    const [result] = await db
      .update(scheduleOccurrences)
      .set({
        is_cancelled: true,
        cancellation_reason: reason,
      })
      .where(eq(scheduleOccurrences.id, id))
      .returning();

    return result;
  }

  /**
   * Restore cancelled occurrence
   */
  async restore(id: string): Promise<ScheduleOccurrence | undefined> {
    const [result] = await db
      .update(scheduleOccurrences)
      .set({
        is_cancelled: false,
        cancellation_reason: null,
      })
      .where(eq(scheduleOccurrences.id, id))
      .returning();

    return result;
  }

  /**
   * Delete all occurrences for a schedule
   */
  async deleteByScheduleId(scheduleId: string): Promise<boolean> {
    const result = await db
      .delete(scheduleOccurrences)
      .where(eq(scheduleOccurrences.schedule_id, scheduleId));

    return Array.isArray(result) ? result.length > 0 : true;
  }
}
