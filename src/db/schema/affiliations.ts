import { pgTable, varchar, date, boolean, index, uuid } from 'drizzle-orm/pg-core';
import { uuidPrimaryKey, timestamps } from './utils';
import { students } from './students';

/**
 * Affiliations table schema
 * 
 * Stores student organization and club memberships separately from the student profile.
 * Supports cascade delete to maintain referential integrity.
 * 
 */
export const affiliations = pgTable('affiliations', {
  id: uuidPrimaryKey(),
  student_id: uuid('student_id')
    .notNull()
    .references(() => students.id, { onDelete: 'cascade' }),
  organization_name: varchar('organization_name', { length: 200 }).notNull(),
  role: varchar('role', { length: 100 }),
  start_date: date('start_date').notNull(),
  end_date: date('end_date'),
  is_active: boolean('is_active').default(true).notNull(),
  ...timestamps,
}, (table) => ({
  // Index for query optimization
  studentIdIdx: index('affiliations_student_id_idx').on(table.student_id),
}));
