import { pgTable, varchar, uuid, index } from 'drizzle-orm/pg-core';
import { uuidPrimaryKey, timestampsWithSoftDelete } from './utils';
import { users } from './users';

/**
 * Faculty table schema
 * 
 * Stores faculty profile data linked to user accounts.
 * Supports soft delete for audit trail preservation.
 * 
 */
export const faculty = pgTable('faculty', {
  id: uuidPrimaryKey(),
  faculty_id: varchar('faculty_id', { length: 50 }).notNull().unique(),
  user_id: uuid('user_id').references(() => users.id, { onDelete: 'cascade' }),
  first_name: varchar('first_name', { length: 100 }).notNull(),
  last_name: varchar('last_name', { length: 100 }).notNull(),
  middle_name: varchar('middle_name', { length: 100 }),
  email: varchar('email', { length: 255 }).notNull(),
  phone: varchar('phone', { length: 20 }),
  department: varchar('department', { length: 100 }).notNull(),
  position: varchar('position', { length: 100 }),
  specialization: varchar('specialization', { length: 255 }),
  status: varchar('status', { length: 50 }).default('active'), // 'active', 'inactive'
  ...timestampsWithSoftDelete,
}, (table) => ({
  // Indexes for query optimization 
  facultyIdIdx: index('faculty_faculty_id_idx').on(table.faculty_id),
  firstNameIdx: index('faculty_first_name_idx').on(table.first_name),
  lastNameIdx: index('faculty_last_name_idx').on(table.last_name),
  departmentIdx: index('faculty_department_idx').on(table.department),
  userIdIdx: index('faculty_user_id_idx').on(table.user_id),
}));
