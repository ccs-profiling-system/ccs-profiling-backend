import { pgTable, varchar, text, integer, uuid, index, uniqueIndex } from 'drizzle-orm/pg-core';
import { uuidPrimaryKey, timestampsWithSoftDelete } from './utils';
import { curriculum } from './curriculum';

/**
 * Subjects table schema
 * 
 * Stores detailed subject/course information linked to curriculum.
 * Includes prerequisites, corequisites, learning objectives, and topics.
 * Supports soft delete for audit trail preservation.
 * 
 * @example
 * {
 *   code: "CS101",
 *   name: "Introduction to Programming",
 *   units: 3,
 *   semester: 1,
 *   year_level: 1,
 *   type: "core",
 *   lecture_hours: 2,
 *   laboratory_hours: 1
 * }
 */
export const subjects = pgTable('subjects', {
  id: uuidPrimaryKey(),
  code: varchar('code', { length: 50 }).notNull(),
  name: varchar('name', { length: 255 }).notNull(),
  units: integer('units').notNull(),
  semester: integer('semester').notNull(), // 1 or 2
  year_level: integer('year_level').notNull(), // 1, 2, 3, or 4
  description: text('description'),
  prerequisites: text('prerequisites').array(), // Array of subject codes
  corequisites: text('corequisites').array(), // Array of subject codes
  type: varchar('type', { length: 50 }).notNull(), // core, elective, major, minor, general_education
  lecture_hours: integer('lecture_hours').default(0).notNull(),
  laboratory_hours: integer('laboratory_hours').default(0).notNull(),
  objectives: text('objectives').array(), // Learning objectives
  topics: text('topics').array(), // Topics covered
  curriculum_id: uuid('curriculum_id').references(() => curriculum.id, { onDelete: 'cascade' }).notNull(),
  ...timestampsWithSoftDelete,
}, (table) => ({
  // Unique constraint on code
  codeUnique: uniqueIndex('subjects_code_unique').on(table.code),
  // Indexes for query optimization
  codeIdx: index('subjects_code_idx').on(table.code),
  curriculumIdIdx: index('subjects_curriculum_id_idx').on(table.curriculum_id),
  semesterIdx: index('subjects_semester_idx').on(table.semester),
  yearLevelIdx: index('subjects_year_level_idx').on(table.year_level),
  typeIdx: index('subjects_type_idx').on(table.type),
}));
