import { pgTable, varchar, text, integer, date, index, uniqueIndex } from 'drizzle-orm/pg-core';
import { uuidPrimaryKey, timestampsWithSoftDelete } from './utils';

/**
 * Curriculum table schema
 * 
 * Stores curriculum information for different programs and years.
 * Each curriculum represents a complete program of study with associated subjects.
 * Supports soft delete for audit trail preservation.
 * 
 * @example
 * {
 *   code: "BSCS-2024",
 *   name: "Bachelor of Science in Computer Science",
 *   program: "Computer Science",
 *   year: "2024",
 *   status: "active"
 * }
 */
export const curriculum = pgTable('curriculum', {
  id: uuidPrimaryKey(),
  code: varchar('code', { length: 50 }).notNull(),
  name: varchar('name', { length: 255 }).notNull(),
  description: text('description'),
  program: varchar('program', { length: 100 }).notNull(),
  year: varchar('year', { length: 10 }).notNull(),
  total_units: integer('total_units').default(0).notNull(),
  status: varchar('status', { length: 20 }).default('draft').notNull(), // draft, active, inactive
  effective_date: date('effective_date').notNull(),
  ...timestampsWithSoftDelete,
}, (table) => ({
  // Unique constraint on code
  codeUnique: uniqueIndex('curriculum_code_unique').on(table.code),
  // Index for query optimization
  programIdx: index('curriculum_program_idx').on(table.program),
  yearIdx: index('curriculum_year_idx').on(table.year),
  statusIdx: index('curriculum_status_idx').on(table.status),
}));
