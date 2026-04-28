import { pgTable, varchar, timestamp, boolean, index } from 'drizzle-orm/pg-core';
import { uuidPrimaryKey, timestampsWithSoftDelete } from './utils';

/**
 * Users table schema
 * 
 * Stores authentication and authorization data for all system users.
 * Supports five roles: admin, department_chair, faculty, secretary, and student.
 */
export const users = pgTable('users', {
  id: uuidPrimaryKey(),
  email: varchar('email', { length: 255 }).notNull().unique(),
  password_hash: varchar('password_hash', { length: 255 }).notNull(),
  role: varchar('role', { length: 50 }).notNull(), // 'admin', 'department_chair', 'faculty', 'secretary', 'student'
  is_active: boolean('is_active').default(true).notNull(),
  last_login: timestamp('last_login'),
  ...timestampsWithSoftDelete,
}, (table) => ({
  // Indexes for query optimization
  emailIdx: index('users_email_idx').on(table.email),
  roleIdx: index('users_role_idx').on(table.role),
}));
