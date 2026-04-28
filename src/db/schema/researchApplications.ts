import { pgTable, varchar, text, date, uuid, index, unique } from 'drizzle-orm/pg-core';
import { uuidPrimaryKey, timestamps } from './utils';
import { research } from './research';
import { students } from './students';

/**
 * Research Applications table schema
 * 
 * Stores student applications to research opportunities posted by faculty.
 * Tracks application status and faculty feedback.
 * Prevents duplicate applications with unique constraint on (research_id, student_id).
 * 
 */
export const researchApplications = pgTable('research_applications', {
  id: uuidPrimaryKey(),
  research_id: uuid('research_id').references(() => research.id, { onDelete: 'cascade' }).notNull(),
  student_id: uuid('student_id').references(() => students.id, { onDelete: 'cascade' }).notNull(),
  application_date: date('application_date').notNull(),
  statement_of_interest: text('statement_of_interest').notNull(),
  status: varchar('status', { length: 50 }).notNull().default('pending'), // 'pending', 'accepted', 'rejected'
  faculty_feedback: text('faculty_feedback'),
  ...timestamps,
}, (table) => ({
  // Index on student_id for query optimization
  studentIdIdx: index('research_applications_student_id_idx').on(table.student_id),
  // Index on research_id for query optimization
  researchIdIdx: index('research_applications_research_id_idx').on(table.research_id),
  // Index on status for filtering
  statusIdx: index('research_applications_status_idx').on(table.status),
  // Unique constraint to prevent duplicate applications
  uniqueResearchStudent: unique('research_applications_research_student_unique').on(table.research_id, table.student_id),
}));
