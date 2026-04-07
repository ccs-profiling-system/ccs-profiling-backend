/**
 * Reports Schema
 * Database schema for report generation history
 */

import { pgTable, uuid, varchar, timestamp, integer, text } from 'drizzle-orm/pg-core';
import { users } from './users';

export const reports = pgTable('reports', {
  id: uuid('id').primaryKey().defaultRandom(),
  report_type: varchar('report_type', { length: 50 }).notNull(),
  report_name: varchar('report_name', { length: 255 }).notNull(),
  file_name: varchar('file_name', { length: 255 }).notNull(),
  file_path: text('file_path').notNull(),
  file_size: integer('file_size').notNull(),
  format: varchar('format', { length: 20 }).notNull(),
  status: varchar('status', { length: 20 }).notNull().default('completed'),
  generated_by: uuid('generated_by').references(() => users.id).notNull(),
  parameters: text('parameters'),
  created_at: timestamp('created_at').defaultNow().notNull(),
  updated_at: timestamp('updated_at').defaultNow().notNull(),
});

export type Report = typeof reports.$inferSelect;
export type NewReport = typeof reports.$inferInsert;
