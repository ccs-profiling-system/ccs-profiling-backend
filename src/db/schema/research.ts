import { pgTable, varchar, text, date, uuid, index, integer, unique } from 'drizzle-orm/pg-core';
import { uuidPrimaryKey, timestampsWithSoftDelete, timestamps } from './utils';
import { students } from './students';
import { faculty } from './faculty';

/**
 * Research table schema
 * 
 * Stores research project, thesis, and publication data.
 * Supports soft delete for audit trail preservation.
 * 
 * Requirements: 12.2, 23.2, 28.1, 29.4, 29.7
 */
export const research = pgTable('research', {
  id: uuidPrimaryKey(),
  title: varchar('title', { length: 500 }).notNull(),
  abstract: text('abstract'),
  research_type: varchar('research_type', { length: 50 }).notNull(), // 'thesis', 'capstone', 'publication'
  status: varchar('status', { length: 50 }).default('ongoing'), // 'ongoing', 'completed', 'published'
  start_date: date('start_date'),
  completion_date: date('completion_date'),
  publication_url: varchar('publication_url', { length: 500 }),
  ...timestampsWithSoftDelete,
}, (table) => ({
  // Indexes for query optimization (Requirement 29.7)
  titleIdx: index('research_title_idx').on(table.title),
  statusIdx: index('research_status_idx').on(table.status),
}));

/**
 * Research Authors junction table schema
 * 
 * Links students to research projects as authors.
 * Tracks author order for proper attribution.
 * 
 * Requirements: 12.3, 23.2, 29.4
 */
export const researchAuthors = pgTable('research_authors', {
  id: uuidPrimaryKey(),
  research_id: uuid('research_id').references(() => research.id, { onDelete: 'cascade' }).notNull(),
  student_id: uuid('student_id').references(() => students.id, { onDelete: 'cascade' }).notNull(),
  author_order: integer('author_order').notNull(), // 1 for first author, 2 for second, etc.
  ...timestamps,
}, (table) => ({
  // Indexes for query optimization (Requirement 29.4)
  researchIdIdx: index('research_authors_research_id_idx').on(table.research_id),
  studentIdIdx: index('research_authors_student_id_idx').on(table.student_id),
  // Unique constraint to prevent duplicate author entries (Requirement 23.2)
  uniqueResearchStudent: unique('research_authors_research_student_unique').on(table.research_id, table.student_id),
}));

/**
 * Research Advisers junction table schema
 * 
 * Links faculty to research projects as advisers.
 * Tracks adviser role (primary adviser, co-adviser, etc.).
 * 
 * Requirements: 12.4, 23.2, 29.4
 */
export const researchAdvisers = pgTable('research_advisers', {
  id: uuidPrimaryKey(),
  research_id: uuid('research_id').references(() => research.id, { onDelete: 'cascade' }).notNull(),
  faculty_id: uuid('faculty_id').references(() => faculty.id, { onDelete: 'cascade' }).notNull(),
  adviser_role: varchar('adviser_role', { length: 100 }).default('adviser'), // 'adviser', 'co-adviser', 'panel-member'
  ...timestamps,
}, (table) => ({
  // Indexes for query optimization (Requirement 29.4)
  researchIdIdx: index('research_advisers_research_id_idx').on(table.research_id),
  facultyIdIdx: index('research_advisers_faculty_id_idx').on(table.faculty_id),
  // Unique constraint to prevent duplicate adviser entries (Requirement 23.2)
  uniqueResearchFaculty: unique('research_advisers_research_faculty_unique').on(table.research_id, table.faculty_id),
}));
