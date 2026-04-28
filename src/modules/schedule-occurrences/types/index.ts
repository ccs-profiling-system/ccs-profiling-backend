import { scheduleOccurrences } from '../../../db/schema';

/**
 * Schedule Occurrence type from database schema
 */
export type ScheduleOccurrence = typeof scheduleOccurrences.$inferSelect;
export type NewScheduleOccurrence = typeof scheduleOccurrences.$inferInsert;
