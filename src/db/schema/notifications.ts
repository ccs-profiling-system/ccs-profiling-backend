import { pgTable, varchar, text, boolean, timestamp, uuid, index } from 'drizzle-orm/pg-core';
import { uuidPrimaryKey, timestamps } from './utils';
import { students } from './students';

/**
 * Notifications table schema
 * 
 * Stores system-generated notifications sent to students.
 * Tracks read status and read timestamp for notification management.
 * 
 */
export const notifications = pgTable('notifications', {
  id: uuidPrimaryKey(),
  student_id: uuid('student_id').references(() => students.id, { onDelete: 'cascade' }).notNull(),
  title: varchar('title', { length: 200 }).notNull(),
  message: text('message').notNull(),
  type: varchar('type', { length: 50 }).notNull(), // 'academic', 'financial', 'event', 'system'
  is_read: boolean('is_read').default(false).notNull(),
  read_at: timestamp('read_at'),
  ...timestamps,
}, (table) => ({
  // Index on student_id for query optimization
  studentIdIdx: index('notifications_student_id_idx').on(table.student_id),
  // Index on is_read for filtering unread notifications
  isReadIdx: index('notifications_is_read_idx').on(table.is_read),
  // Index on created_at for ordering by date
  createdAtIdx: index('notifications_created_at_idx').on(table.created_at),
}));
