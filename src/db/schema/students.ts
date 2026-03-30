import { pgTable, varchar, text, integer, date, index, uuid } from 'drizzle-orm/pg-core';
import { uuidPrimaryKey, timestampsWithSoftDelete } from './utils';
import { users } from './users';

/**
 * Students table schema
 * 
 * Stores student profile data linked to user accounts.
 * Supports soft delete for audit trail preservation.
 * 
 * Requirements: 2.3, 23.1, 23.2, 23.3, 23.5, 28.1, 29.1, 29.5
 */
export const students = pgTable('students', {
  id: uuidPrimaryKey(),
  student_id: varchar('student_id', { length: 50 }).notNull().unique(),
  user_id: uuid('user_id').references(() => users.id, { onDelete: 'cascade' }),
  first_name: varchar('first_name', { length: 100 }).notNull(),
  last_name: varchar('last_name', { length: 100 }).notNull(),
  middle_name: varchar('middle_name', { length: 100 }),
  email: varchar('email', { length: 255 }).notNull(),
  phone: varchar('phone', { length: 20 }),
  date_of_birth: date('date_of_birth'),
  address: text('address'),
  year_level: integer('year_level'),
  program: varchar('program', { length: 100 }),
  status: varchar('status', { length: 50 }).default('active'), // 'active', 'inactive', 'graduated'
  ...timestampsWithSoftDelete,
}, (table) => ({
  // Indexes for query optimization (Requirement 29.1, 29.5)
  studentIdIdx: index('students_student_id_idx').on(table.student_id),
  firstNameIdx: index('students_first_name_idx').on(table.first_name),
  lastNameIdx: index('students_last_name_idx').on(table.last_name),
  emailIdx: index('students_email_idx').on(table.email),
  userIdIdx: index('students_user_id_idx').on(table.user_id),
}));
