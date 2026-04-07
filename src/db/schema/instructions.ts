import { pgTable, varchar, text, integer, index, uniqueIndex } from 'drizzle-orm/pg-core';
import { uuidPrimaryKey, timestampsWithSoftDelete } from './utils';

/**
 * Instructions table schema
 * 
 * Stores curriculum, subject, and syllabus information.
 * Supports soft delete for audit trail preservation.
 * 
 */
export const instructions = pgTable('instructions', {
  id: uuidPrimaryKey(),
  subject_code: varchar('subject_code', { length: 50 }).notNull(),
  subject_name: varchar('subject_name', { length: 255 }).notNull(),
  description: text('description'),
  credits: integer('credits').notNull(),
  curriculum_year: varchar('curriculum_year', { length: 20 }).notNull(), // e.g., '2023-2024'
  ...timestampsWithSoftDelete,
}, (table) => ({
  // Unique constraint on (subject_code, curriculum_year) to prevent duplicates
  subjectCodeCurriculumYearUnique: uniqueIndex('instructions_subject_code_curriculum_year_unique')
    .on(table.subject_code, table.curriculum_year),
  // Index for query optimization 
  subjectCodeIdx: index('instructions_subject_code_idx').on(table.subject_code),
}));
