import { pgTable, varchar, date, integer, index, uniqueIndex, uuid, check } from 'drizzle-orm/pg-core';
import { sql } from 'drizzle-orm';
import { uuidPrimaryKey, timestamps } from './utils';
import { students } from './students';
import { instructions } from './instructions';

/**
 * Student Participation table schema
 * 
 * Stores daily participation scores for students in courses.
 * Faculty can record participation scores (1-5 scale) with optional remarks.
 * 
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
  // Unique constraint to prevent duplicate participation records for same student/course/date
  instructionStudentDateUnique: uniqueIndex('student_participation_instruction_student_date_unique')
    .on(table.instruction_id, table.student_id, table.date),
  // Check constraint to ensure participation_score is between 1 and 5
  participationScoreCheck: check(
    'student_participation_score_check',
    sql`${table.participation_score} >= 1 AND ${table.participation_score} <= 5`
  ),
  // Indexes for query optimization
  instructionIdIdx: index('student_participation_instruction_id_idx').on(table.instruction_id),
  studentIdIdx: index('student_participation_student_id_idx').on(table.student_id),
  dateIdx: index('student_participation_date_idx').on(table.date),
}));
