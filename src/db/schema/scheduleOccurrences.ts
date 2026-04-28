import { pgTable, uuid, date, boolean, text, index, uniqueIndex, timestamp } from 'drizzle-orm/pg-core';
import { uuidPrimaryKey } from './utils';
import { schedules } from './schedules';

/**
 * Schedule Occurrences table schema
 * 
 * Stores individual occurrences of recurring schedules.
 * Allows cancellation of specific occurrences without affecting the base schedule.
 * Each occurrence represents a single instance of a recurring schedule.
 * 
 * @example
 * {
 *   schedule_id: "uuid",
 *   occurrence_date: "2026-01-05",
 *   is_cancelled: false,
 *   cancellation_reason: null
 * }
 */
export const scheduleOccurrences = pgTable('schedule_occurrences', {
  id: uuidPrimaryKey(),
  schedule_id: uuid('schedule_id').references(() => schedules.id, { onDelete: 'cascade' }).notNull(),
  occurrence_date: date('occurrence_date').notNull(),
  is_cancelled: boolean('is_cancelled').default(false).notNull(),
  cancellation_reason: text('cancellation_reason'),
  created_at: timestamp('created_at').defaultNow().notNull(),
}, (table) => ({
  // Unique constraint: one occurrence per schedule per date
  scheduleIdDateUnique: uniqueIndex('schedule_occurrences_schedule_id_date_unique')
    .on(table.schedule_id, table.occurrence_date),
  // Indexes for query optimization
  scheduleIdIdx: index('schedule_occurrences_schedule_id_idx').on(table.schedule_id),
  occurrenceDateIdx: index('schedule_occurrences_date_idx').on(table.occurrence_date),
  isCancelledIdx: index('schedule_occurrences_is_cancelled_idx').on(table.is_cancelled),
}));
