import { pgTable, varchar, text, bigint, uuid, index, uniqueIndex } from 'drizzle-orm/pg-core';
import { uuidPrimaryKey, timestampsWithSoftDelete } from './utils';
import { subjects } from './subjects';

/**
 * Syllabus table schema
 * 
 * Stores syllabus information for subjects.
 * Supports both file uploads and external links.
 * One syllabus per subject (enforced by unique constraint).
 * Supports soft delete for audit trail preservation.
 * 
 * @example
 * {
 *   subject_id: "uuid",
 *   title: "CS101 - Introduction to Programming Syllabus",
 *   content_type: "file",
 *   file_url: "/uploads/syllabus/cs101-syllabus.pdf",
 *   file_name: "CS101 Syllabus - Fall 2024.pdf"
 * }
 */
export const syllabus = pgTable('syllabus', {
  id: uuidPrimaryKey(),
  subject_id: uuid('subject_id').references(() => subjects.id, { onDelete: 'cascade' }).notNull(),
  title: varchar('title', { length: 255 }).notNull(),
  description: text('description'),
  content_type: varchar('content_type', { length: 20 }).notNull(), // 'file' or 'link'
  file_url: text('file_url'),
  file_name: varchar('file_name', { length: 255 }),
  file_size: bigint('file_size', { mode: 'number' }), // in bytes
  file_type: varchar('file_type', { length: 100 }), // MIME type
  external_link: text('external_link'),
  ...timestampsWithSoftDelete,
}, (table) => ({
  // Unique constraint: one syllabus per subject
  subjectIdUnique: uniqueIndex('syllabus_subject_id_unique').on(table.subject_id),
  // Index for query optimization
  subjectIdIdx: index('syllabus_subject_id_idx').on(table.subject_id),
}));
