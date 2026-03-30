import { pgTable, varchar, timestamp, boolean, index } from 'drizzle-orm/pg-core';
import { uuidPrimaryKey, timestampsWithSoftDelete } from './utils';

/**
 * Users table schema
 * 
 * Stores authentication and authorization data for all system users.
 * Supports three roles: admin, faculty, and student.
 */
export const users = pgTable('users', {
  id: uuidPrimaryKey(),
  email: varchar('email', { length: 255 }).notNull().unique(),
  password_hash: varchar('password_hash', { length: 255 }).notNull(),
  role: varchar('role', { length: 50 }).notNull(), // 'admin', 'faculty', 'student'
  is_active: boolean('is_active').default(true).notNull(),
  last_login: timestamp('last_login'),
  ...timestampsWithSoftDelete,
}, (table) => ({
  emailIdx: index('users_email_idx').on(table.email),
  roleIdx: index('users_role_idx').on(table.role),
}));
