import { pgTable, varchar, time, uuid, index, boolean, date } from 'drizzle-orm/pg-core';
import { uuidPrimaryKey, timestampsWithSoftDelete } from './utils';
import { instructions } from './instructions';
import { faculty } from './faculty';
import { rooms } from './rooms';

/**
 * Schedules table schema
 * 
 * Stores class, exam, and consultation scheduling information.
 * Links to instructions (which link to subjects), faculty, and rooms for schedule assignments.
 * Supports recurring schedules with pattern and end date.
 * Supports soft delete for audit trail preservation.
 * 
 * Uses instruction_id as single source of truth:
 *   schedules.instruction_id → instructions.subject_code → subjects.code
 * 
 * @example
 * {
 *   schedule_type: "class",
 *   instruction_id: "uuid",
 *   faculty_id: "uuid",
 *   room_id: "uuid",
 *   day: "monday",
 *   start_time: "09:00",
 *   end_time: "10:30",
 *   is_recurring: true,
 *   recurrence_pattern: "weekly",
 *   recurrence_end_date: "2026-05-31"
 * }
 */
export const schedules = pgTable('schedules', {
  id: uuidPrimaryKey(),
  schedule_type: varchar('schedule_type', { length: 50 }).notNull(), // 'class', 'exam', 'consultation'
  instruction_id: uuid('instruction_id').references(() => instructions.id, { onDelete: 'set null' }),
  faculty_id: uuid('faculty_id').references(() => faculty.id, { onDelete: 'set null' }),
  room_id: uuid('room_id').references(() => rooms.id, { onDelete: 'set null' }),
  room: varchar('room', { length: 100 }).notNull(), // Keep for backward compatibility
  day: varchar('day', { length: 20 }).notNull(), // 'monday', 'tuesday', etc.
  start_time: time('start_time').notNull(),
  end_time: time('end_time').notNull(),
  semester: varchar('semester', { length: 20 }).notNull(), // '1st', '2nd', 'summer'
  academic_year: varchar('academic_year', { length: 20 }).notNull(), // e.g., '2023-2024'
  is_recurring: boolean('is_recurring').default(false).notNull(),
  recurrence_pattern: varchar('recurrence_pattern', { length: 20 }), // 'weekly', 'biweekly', 'monthly'
  recurrence_end_date: date('recurrence_end_date'),
  ...timestampsWithSoftDelete,
}, (table) => ({
  // Indexes for query optimization 
  roomIdx: index('schedules_room_idx').on(table.room),
  roomIdIdx: index('schedules_room_id_idx').on(table.room_id),
  facultyIdIdx: index('schedules_faculty_id_idx').on(table.faculty_id),
  dayIdx: index('schedules_day_idx').on(table.day),
  semesterAcademicYearIdx: index('schedules_semester_academic_year_idx')
    .on(table.semester, table.academic_year),
  instructionIdIdx: index('schedules_instruction_id_idx').on(table.instruction_id),
  isRecurringIdx: index('schedules_is_recurring_idx').on(table.is_recurring),
}));
