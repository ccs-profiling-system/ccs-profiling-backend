import { pgTable, varchar, date, text, index, uuid } from 'drizzle-orm/pg-core';
import { uuidPrimaryKey, timestamps } from './utils';
import { students } from './students';
import { instructions } from './instructions';

/**
 * Attendance table schema
 * 
 * Stores student attendance records for courses.
 * Tracks attendance status (present, absent, late, excused) with optional remarks.
 * 
 */
export const attendance = pgTable('attendance', {
  id: uuidPrimaryKey(),
  instruction_id: uuid('instruction_id')
    .notNull()
    .references(() => instructions.id, { onDelete: 'cascade' }),
  student_id: uuid('student_id')
    .notNull()
    .references(() => students.id, { onDelete: 'cascade' }),
  date: date('date').notNull(),
  status: varchar('status', { length: 20 }).notNull(), // 'present', 'absent', 'late', 'excused'
  remarks: text('remarks'),
  recorded_by: uuid('recorded_by'), // Faculty user_id who recorded the attendance
  ...timestamps,
}, (table) => ({
  // Indexes for query optimization
  instructionIdIdx: index('attendance_instruction_id_idx').on(table.instruction_id),
  studentIdIdx: index('attendance_student_id_idx').on(table.student_id),
  dateIdx: index('attendance_date_idx').on(table.date),
  instructionDateIdx: index('attendance_instruction_date_idx').on(table.instruction_id, table.date),
}));
