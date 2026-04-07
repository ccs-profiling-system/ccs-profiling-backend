import { pgTable, varchar, time, uuid, index } from 'drizzle-orm/pg-core';
import { uuidPrimaryKey, timestampsWithSoftDelete } from './utils';
import { instructions } from './instructions';
import { faculty } from './faculty';

/**
 * Schedules table schema
 * 
 * Stores class, exam, and consultation scheduling information.
 * Links to instructions and faculty for schedule assignments.
 * Supports soft delete for audit trail preservation.
 * 
 */
export const schedules = pgTable('schedules', {
  id: uuidPrimaryKey(),
  schedule_type: varchar('schedule_type', { length: 50 }).notNull(), // 'class', 'exam', 'consultation'
  instruction_id: uuid('instruction_id').references(() => instructions.id, { onDelete: 'cascade' }),
  faculty_id: uuid('faculty_id').references(() => faculty.id, { onDelete: 'cascade' }),
  room: varchar('room', { length: 100 }).notNull(),
  day: varchar('day', { length: 20 }).notNull(), // 'monday', 'tuesday', etc.
  start_time: time('start_time').notNull(),
  end_time: time('end_time').notNull(),
  semester: varchar('semester', { length: 20 }).notNull(), // '1st', '2nd', 'summer'
  academic_year: varchar('academic_year', { length: 20 }).notNull(), // e.g., '2023-2024'
  ...timestampsWithSoftDelete,
}, (table) => ({
  // Indexes for query optimization 
  roomIdx: index('schedules_room_idx').on(table.room),
  facultyIdIdx: index('schedules_faculty_id_idx').on(table.faculty_id),
  dayIdx: index('schedules_day_idx').on(table.day),
  semesterAcademicYearIdx: index('schedules_semester_academic_year_idx')
    .on(table.semester, table.academic_year),
  instructionIdIdx: index('schedules_instruction_id_idx').on(table.instruction_id),
}));
