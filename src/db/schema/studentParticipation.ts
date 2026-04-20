import { pgTable, varchar, date, integer, index, uuid, unique, check } from 'drizzle-orm/pg-core';
import { sql } from 'drizzle-orm';
import { uuidPrimaryKey, timestamps } from './utils';
import { instructions } from './instructions';
import { students } from './students';

/**
 * Student Participation table schema
 * 
 * Tracks daily student participation and engagement in courses.
 * Faculty members can record participation scores (1-5 scale) with optional remarks.
 * 
 * Participation Score Scale:
 * - 1: Minimal/No participation
 * - 2: Below average participation
 * - 3: Average participation
 * - 4: Above average participation
 * - 5: Excellent/Outstanding participation
 * 
 * Constraints:
 * - One participation record per student per course per date
 * - Score must be between 1 and 5 (inclusive)
 * - Cascade delete when instruction or student is deleted
 */
export const studentParticipation = pgTable('student_participation', {
  id: uuidPrimaryKey(),
  instruction_id: uuid('instruction_id')
    .notNull()
    .references(() => instructions.id, { onDelete: 'cascade' }),
  student_id: uuid('student_id')
    .notNull()
    .references(() => students.id, { onDelete: 'cascade' }),
  date: date('date').notNull(),
  participation_score: integer('participation_score').notNull(),
  remarks: varchar('remarks', { length: 500 }),
  ...timestamps,
}, (table) => ({
  // Unique constraint: one record per student per course per date
  uniqueParticipation: unique('student_participation_unique').on(
    table.instruction_id,
    table.student_id,
    table.date
  ),
  // Check constraint: score between 1 and 5
  scoreCheck: check(
    'participation_score_check',
    sql`${table.participation_score} >= 1 AND ${table.participation_score} <= 5`
  ),
  // Indexes for query optimization
  instructionIdIdx: index('student_participation_instruction_id_idx').on(table.instruction_id),
  studentIdIdx: index('student_participation_student_id_idx').on(table.student_id),
  dateIdx: index('student_participation_date_idx').on(table.date),
}));
