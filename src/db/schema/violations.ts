import { pgTable, varchar, text, date, timestamp, index, uuid } from 'drizzle-orm/pg-core';
import { uuidPrimaryKey, timestamps } from './utils';
import { students } from './students';

/**
 * Violations table schema
 * 
 * Stores student disciplinary records separately from the student profile.
 * Supports cascade delete to maintain referential integrity.
 * 
 * Requirements: 6.2, 23.2, 23.4, 29.4
 */
export const violations = pgTable('violations', {
  id: uuidPrimaryKey(),
  student_id: uuid('student_id')
    .notNull()
    .references(() => students.id, { onDelete: 'cascade' }),
  violation_type: varchar('violation_type', { length: 100 }).notNull(),
  description: text('description').notNull(),
  violation_date: date('violation_date').notNull(),
  resolution_status: varchar('resolution_status', { length: 50 }).default('pending').notNull(), // 'pending', 'resolved', 'dismissed'
  resolution_notes: text('resolution_notes'),
  resolved_at: timestamp('resolved_at'),
  ...timestamps,
}, (table) => ({
  // Index for query optimization (Requirement 29.4)
  studentIdIdx: index('violations_student_id_idx').on(table.student_id),
}));
