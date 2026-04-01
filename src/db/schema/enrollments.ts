import { pgTable, varchar, timestamp, index, uniqueIndex, uuid } from 'drizzle-orm/pg-core';
import { uuidPrimaryKey, timestamps } from './utils';
import { students } from './students';
import { instructions } from './instructions';

/**
 * Enrollments table schema
 * 
 * Stores student course enrollment records linking students to instructions.
 * Tracks enrollment status and academic period information.
 * 
 * Requirements: 9.2, 23.2, 23.4, 29.4, 29.9
 */
export const enrollments = pgTable('enrollments', {
  id: uuidPrimaryKey(),
  student_id: uuid('student_id')
    .notNull()
    .references(() => students.id, { onDelete: 'cascade' }),
  instruction_id: uuid('instruction_id')
    .notNull()
    .references(() => instructions.id, { onDelete: 'cascade' }),
  enrollment_status: varchar('enrollment_status', { length: 50 })
    .notNull()
    .default('enrolled'), // 'enrolled', 'dropped', 'completed'
  semester: varchar('semester', { length: 20 }).notNull(), // '1st', '2nd', 'summer'
  academic_year: varchar('academic_year', { length: 20 }).notNull(), // e.g., '2023-2024'
  enrolled_at: timestamp('enrolled_at').defaultNow(),
  ...timestamps,
}, (table) => ({
  // Unique constraint to prevent duplicate enrollments (Requirement 9.5)
  studentInstructionSemesterYearUnique: uniqueIndex('enrollments_student_instruction_semester_year_unique')
    .on(table.student_id, table.instruction_id, table.semester, table.academic_year),
  // Indexes for query optimization (Requirements 23.2, 29.4, 29.9)
  studentIdIdx: index('enrollments_student_id_idx').on(table.student_id),
  instructionIdIdx: index('enrollments_instruction_id_idx').on(table.instruction_id),
  semesterAcademicYearIdx: index('enrollments_semester_academic_year_idx')
    .on(table.semester, table.academic_year),
}));
