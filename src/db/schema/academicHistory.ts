import { pgTable, varchar, decimal, integer, index, uuid } from 'drizzle-orm/pg-core';
import { uuidPrimaryKey, timestamps } from './utils';
import { students } from './students';

/**
 * Academic History table schema
 * 
 * Stores student grade records and academic performance history.
 * Tracks subject grades, credits, and academic period information.
 * 
 * Requirements: 8.2, 23.2, 29.4
 */
export const academicHistory = pgTable('academic_history', {
  id: uuidPrimaryKey(),
  student_id: uuid('student_id')
    .notNull()
    .references(() => students.id, { onDelete: 'cascade' }),
  subject_code: varchar('subject_code', { length: 50 }).notNull(),
  subject_name: varchar('subject_name', { length: 200 }).notNull(),
  grade: decimal('grade', { precision: 4, scale: 2 }).notNull(),
  semester: varchar('semester', { length: 20 }).notNull(), // '1st', '2nd', 'summer'
  academic_year: varchar('academic_year', { length: 20 }).notNull(), // e.g., '2023-2024'
  credits: integer('credits').notNull(),
  remarks: varchar('remarks', { length: 50 }), // 'passed', 'failed', 'incomplete'
  ...timestamps,
}, (table) => ({
  // Indexes for query optimization (Requirements 23.2, 29.4)
  studentIdIdx: index('academic_history_student_id_idx').on(table.student_id),
  semesterAcademicYearIdx: index('academic_history_semester_academic_year_idx')
    .on(table.semester, table.academic_year),
}));
