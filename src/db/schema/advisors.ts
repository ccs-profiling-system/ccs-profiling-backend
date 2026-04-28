import { pgTable, varchar, text, date, time, integer, boolean, timestamp, uuid, index } from 'drizzle-orm/pg-core';
import { uuidPrimaryKey, timestamps } from './utils';
import { students } from './students';
import { faculty } from './faculty';
import { users } from './users';

/**
 * Student Advisors table schema
 * 
 * Stores student-advisor assignments linking students to their assigned faculty advisors.
 * Each student can have one advisor at a time.
 * 
 */
export const studentAdvisors = pgTable('student_advisors', {
  id: uuidPrimaryKey(),
  student_id: uuid('student_id').references(() => students.id, { onDelete: 'cascade' }).notNull(),
  faculty_id: uuid('faculty_id').references(() => faculty.id, { onDelete: 'cascade' }).notNull(),
  assigned_date: date('assigned_date').notNull(),
  ...timestamps,
}, (table) => ({
  // Index on student_id for query optimization
  studentIdIdx: index('student_advisors_student_id_idx').on(table.student_id),
  // Index on faculty_id for query optimization
  facultyIdIdx: index('student_advisors_faculty_id_idx').on(table.faculty_id),
}));

/**
 * Advisor Messages table schema
 * 
 * Stores message history between students and their advisors.
 * Tracks sender role and read status for message management.
 * 
 */
export const advisorMessages = pgTable('advisor_messages', {
  id: uuidPrimaryKey(),
  student_id: uuid('student_id').references(() => students.id, { onDelete: 'cascade' }).notNull(),
  faculty_id: uuid('faculty_id').references(() => faculty.id, { onDelete: 'cascade' }).notNull(),
  sender_id: uuid('sender_id').references(() => users.id, { onDelete: 'cascade' }).notNull(),
  sender_role: varchar('sender_role', { length: 20 }).notNull(), // 'student', 'faculty'
  message_content: text('message_content').notNull(),
  is_read: boolean('is_read').default(false).notNull(),
  sent_at: timestamp('sent_at').defaultNow().notNull(),
  ...timestamps,
}, (table) => ({
  // Index on student_id for query optimization
  studentIdIdx: index('advisor_messages_student_id_idx').on(table.student_id),
  // Index on faculty_id for query optimization
  facultyIdIdx: index('advisor_messages_faculty_id_idx').on(table.faculty_id),
  // Index on sent_at for ordering
  sentAtIdx: index('advisor_messages_sent_at_idx').on(table.sent_at),
}));

/**
 * Advisor Slots table schema
 * 
 * Stores available time slots for advisor appointments.
 * Faculty create slots that students can book for appointments.
 * 
 */
export const advisorSlots = pgTable('advisor_slots', {
  id: uuidPrimaryKey(),
  faculty_id: uuid('faculty_id').references(() => faculty.id, { onDelete: 'cascade' }).notNull(),
  slot_date: date('slot_date').notNull(),
  start_time: time('start_time').notNull(),
  end_time: time('end_time').notNull(),
  duration_minutes: integer('duration_minutes').notNull(),
  is_booked: boolean('is_booked').default(false).notNull(),
  ...timestamps,
}, (table) => ({
  // Index on faculty_id for query optimization
  facultyIdIdx: index('advisor_slots_faculty_id_idx').on(table.faculty_id),
  // Index on slot_date for filtering
  slotDateIdx: index('advisor_slots_slot_date_idx').on(table.slot_date),
  // Index on is_booked for filtering available slots
  isBookedIdx: index('advisor_slots_is_booked_idx').on(table.is_booked),
}));

/**
 * Advisor Appointments table schema
 * 
 * Stores booked appointments between students and advisors.
 * Links to advisor_slots to track which slot was booked.
 * Tracks appointment status and advisor notes.
 * 
 */
export const advisorAppointments = pgTable('advisor_appointments', {
  id: uuidPrimaryKey(),
  student_id: uuid('student_id').references(() => students.id, { onDelete: 'cascade' }).notNull(),
  faculty_id: uuid('faculty_id').references(() => faculty.id, { onDelete: 'cascade' }).notNull(),
  slot_id: uuid('slot_id').references(() => advisorSlots.id, { onDelete: 'cascade' }).notNull(),
  appointment_date: date('appointment_date').notNull(),
  start_time: time('start_time').notNull(),
  end_time: time('end_time').notNull(),
  purpose: text('purpose').notNull(),
  status: varchar('status', { length: 50 }).notNull().default('scheduled'), // 'scheduled', 'completed', 'cancelled'
  advisor_notes: text('advisor_notes'),
  ...timestamps,
}, (table) => ({
  // Index on student_id for query optimization
  studentIdIdx: index('advisor_appointments_student_id_idx').on(table.student_id),
  // Index on faculty_id for query optimization
  facultyIdIdx: index('advisor_appointments_faculty_id_idx').on(table.faculty_id),
  // Index on slot_id for query optimization
  slotIdIdx: index('advisor_appointments_slot_id_idx').on(table.slot_id),
  // Index on appointment_date for ordering
  appointmentDateIdx: index('advisor_appointments_appointment_date_idx').on(table.appointment_date),
  // Index on status for filtering
  statusIdx: index('advisor_appointments_status_idx').on(table.status),
}));
