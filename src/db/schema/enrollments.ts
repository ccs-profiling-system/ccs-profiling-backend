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
  // Unique constraint to prevent duplicate enrollments 
  studentInstructionSemesterYearUnique: uniqueIndex('enrollments_student_instruction_semester_year_unique')
    .on(table.student_id, table.instruction_id, table.semester, table.academic_year),
    // Indexes for query optimization 
  studentIdIdx: index('enrollments_student_id_idx').on(table.student_id),
  instructionIdIdx: index('enrollments_instruction_id_idx').on(table.instruction_id),
  semesterAcademicYearIdx: index('enrollments_semester_academic_year_idx')
    .on(table.semester, table.academic_year),
}));
