import { pgTable, varchar, uuid, text, jsonb, integer, timestamp, index } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';
import { uuidPrimaryKey, timestamps } from './utils';
import { users } from './users';
import { z } from 'zod';

/**
 * Enum Types
 */

// Job type enum
export const JobType = {
  BULK_APPROVE: 'bulk_approve',
  BULK_REJECT: 'bulk_reject',
  NOTIFICATION_DELIVERY: 'notification_delivery',
  ARCHIVAL: 'archival',
} as const;

export type JobTypeType = typeof JobType[keyof typeof JobType];

// Job status enum
export const JobStatus = {
  QUEUED: 'queued',
  PROCESSING: 'processing',
  COMPLETED: 'completed',
  FAILED: 'failed',
} as const;

export type JobStatusType = typeof JobStatus[keyof typeof JobStatus];

/**
 * Background Jobs table schema
 * 
 * Stores asynchronous job processing information for long-running operations.
 * Used for bulk operations, notification delivery, and archival tasks.
 * 
 * Job Types:
 * - bulk_approve: Process multiple approval requests
 * - bulk_reject: Process multiple rejection requests
 * - notification_delivery: Deliver notifications to users
 * - archival: Archive old records
 * 
 * Job Status Flow:
 * queued → processing → completed/failed
 */
export const backgroundJobs = pgTable('background_jobs', {
  id: uuidPrimaryKey(),
  
  // Job classification
  job_type: varchar('job_type', { length: 100 }).notNull(), // 'bulk_approve' | 'bulk_reject' | 'notification_delivery' | 'archival'
  status: varchar('status', { length: 50 }).notNull(), // 'queued' | 'processing' | 'completed' | 'failed'
  
  // Job data
  payload: jsonb('payload').notNull(), // Input data for the job
  result: jsonb('result'), // Output data after job completion
  error: text('error'), // Error message if job failed
  
  // Retry tracking
  retry_count: integer('retry_count').default(0).notNull(),
  
  // User tracking
  initiated_by: uuid('initiated_by').references(() => users.id, { onDelete: 'no action' }),
  
  // Lifecycle timestamps
  started_at: timestamp('started_at'),
  completed_at: timestamp('completed_at'),
  
  ...timestamps,
}, (table) => ({
  // Composite index for job queue processing (status + created_at for FIFO)
  statusCreatedAtIdx: index('background_jobs_status_created_at_idx').on(table.status, table.created_at),
}));

/**
 * Relations
 */
export const backgroundJobsRelations = relations(backgroundJobs, ({ one }) => ({
  initiator: one(users, {
    fields: [backgroundJobs.initiated_by],
    references: [users.id],
    relationName: 'background_job_initiator',
  }),
}));

/**
 * Type exports for use in application code
 */
export type BackgroundJob = typeof backgroundJobs.$inferSelect;
export type InsertBackgroundJob = typeof backgroundJobs.$inferInsert;
export type SelectBackgroundJob = typeof backgroundJobs.$inferSelect;

/**
 * Zod Schemas for validation
 */

// Zod schema for job_type validation
const jobTypeSchema = z.enum([
  JobType.BULK_APPROVE,
  JobType.BULK_REJECT,
  JobType.NOTIFICATION_DELIVERY,
  JobType.ARCHIVAL,
]);

// Zod schema for status validation
const jobStatusSchema = z.enum([
  JobStatus.QUEUED,
  JobStatus.PROCESSING,
  JobStatus.COMPLETED,
  JobStatus.FAILED,
]);

// Insert background job schema for creating new jobs
export const insertBackgroundJobSchema = z.object({
  job_type: jobTypeSchema,
  status: jobStatusSchema,
  payload: z.record(z.any()), // JSONB - flexible object
  result: z.record(z.any()).optional().nullable(),
  error: z.string().optional().nullable(),
  retry_count: z.number().int().default(0),
  initiated_by: z.string().uuid().optional().nullable(),
  started_at: z.date().optional().nullable(),
  completed_at: z.date().optional().nullable(),
});

// Select background job schema for reading jobs
export const selectBackgroundJobSchema = z.object({
  id: z.string().uuid(),
  job_type: jobTypeSchema,
  status: jobStatusSchema,
  payload: z.record(z.any()),
  result: z.record(z.any()).nullable(),
  error: z.string().nullable(),
  retry_count: z.number().int(),
  initiated_by: z.string().uuid().nullable(),
  created_at: z.date(),
  updated_at: z.date(),
  started_at: z.date().nullable(),
  completed_at: z.date().nullable(),
});
