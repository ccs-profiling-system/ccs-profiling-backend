import { pgTable, varchar, text, date, time, integer, uuid, index } from 'drizzle-orm/pg-core';
import { uuidPrimaryKey, timestampsWithSoftDelete, timestamps } from './utils';
import { students } from './students';
import { faculty } from './faculty';

/**
 * Events table schema
 * 
 * Stores academic and institutional event data.
 * Supports soft delete for audit trail preservation.
 * 
 */
export const events = pgTable('events', {
  id: uuidPrimaryKey(),
  event_name: varchar('event_name', { length: 255 }).notNull(),
  event_type: varchar('event_type', { length: 50 }).notNull(), // 'seminar', 'workshop', 'defense', 'competition'
  description: text('description'),
  event_date: date('event_date').notNull(),
  start_time: time('start_time'),
  end_time: time('end_time'),
  location: varchar('location', { length: 255 }),
  organizer: varchar('organizer', { length: 200 }),
  max_participants: integer('max_participants'),
  registration_deadline: date('registration_deadline'),
  status: varchar('status', { length: 50 }).default('draft').notNull(), // 'draft', 'pending_approval', 'approved', 'rejected', 'cancelled'
  department_id: varchar('department_id', { length: 100 }), // Department scope for multi-tenant isolation
  ...timestampsWithSoftDelete,
}, (table) => ({
  // Indexes for query optimization 
  eventNameIdx: index('events_event_name_idx').on(table.event_name),
  eventDateIdx: index('events_event_date_idx').on(table.event_date),
  eventTypeIdx: index('events_event_type_idx').on(table.event_type),
  statusIdx: index('events_status_idx').on(table.status),
  departmentIdIdx: index('events_department_id_idx').on(table.department_id),
}));

/**
 * Event Participants junction table schema
 * 
 * Links students and faculty to events with participation details.
 * Supports both student and faculty participants.
 * 
 */
export const eventParticipants = pgTable('event_participants', {
  id: uuidPrimaryKey(),
  event_id: uuid('event_id').references(() => events.id, { onDelete: 'cascade' }).notNull(),
  student_id: uuid('student_id').references(() => students.id, { onDelete: 'cascade' }),
  faculty_id: uuid('faculty_id').references(() => faculty.id, { onDelete: 'cascade' }),
  participation_role: varchar('participation_role', { length: 100 }), // 'participant', 'organizer', 'speaker', 'facilitator'
  attendance_status: varchar('attendance_status', { length: 50 }).default('registered'), // 'registered', 'attended', 'absent', 'cancelled'
  ...timestamps,
}, (table) => ({
  // Indexes for query optimization
  eventIdIdx: index('event_participants_event_id_idx').on(table.event_id),
  studentIdIdx: index('event_participants_student_id_idx').on(table.student_id),
  facultyIdIdx: index('event_participants_faculty_id_idx').on(table.faculty_id),
}));
