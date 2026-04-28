import { pgTable, varchar, text, integer, bigint, uuid, index } from 'drizzle-orm/pg-core';
import { uuidPrimaryKey, timestampsWithSoftDelete } from './utils';
import { subjects } from './subjects';

/**
 * Lessons table schema
 * 
 * Stores weekly lesson content for subjects.
 * Supports both file uploads and external links.
 * Multiple lessons per subject organized by week.
 * Supports soft delete for audit trail preservation.
 * 
 * @example
 * {
 *   subject_id: "uuid",
 *   week: 1,
 *   title: "Introduction to Programming Concepts",
 *   type: "lecture",
 *   content_type: "file",
 *   file_url: "/uploads/lessons/cs101-week1.pdf"
 * }
 */
export const lessons = pgTable('lessons', {
  id: uuidPrimaryKey(),
  subject_id: uuid('subject_id').references(() => subjects.id, { onDelete: 'cascade' }).notNull(),
  week: integer('week').notNull(), // 1-52
  title: varchar('title', { length: 255 }).notNull(),
  description: text('description'),
  type: varchar('type', { length: 50 }).notNull(), // lecture, laboratory, discussion, examination, project
  content_type: varchar('content_type', { length: 20 }).notNull(), // 'file' or 'link'
  file_url: text('file_url'),
  file_name: varchar('file_name', { length: 255 }),
  file_size: bigint('file_size', { mode: 'number' }), // in bytes
  external_link: text('external_link'),
  ...timestampsWithSoftDelete,
}, (table) => ({
  // Indexes for query optimization
  subjectIdIdx: index('lessons_subject_id_idx').on(table.subject_id),
  weekIdx: index('lessons_week_idx').on(table.week),
  typeIdx: index('lessons_type_idx').on(table.type),
}));
