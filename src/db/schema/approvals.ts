import { pgTable, varchar, uuid, text, jsonb, timestamp, integer, index } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';
import { uuidPrimaryKey, timestamps, softDelete } from './utils';
import { users } from './users';
import { z } from 'zod';

/**
 * Enum Types
 */

// Approval status enum
export const ApprovalStatus = {
  DRAFT: 'draft',
  PENDING: 'pending',
  APPROVED: 'approved',
  REJECTED: 'rejected',
  WITHDRAWN: 'withdrawn',
  FAILED: 'failed',
  CONFLICTED: 'conflicted',
} as const;

export type ApprovalStatusType = typeof ApprovalStatus[keyof typeof ApprovalStatus];

// Entity type enum
export const EntityType = {
  STUDENT: 'student',
  FACULTY: 'faculty',
  EVENT: 'event',
  RESEARCH: 'research',
} as const;

export type EntityTypeType = typeof EntityType[keyof typeof EntityType];

// Category enum
export const Category = {
  RESEARCH: 'research',
  EVENT: 'event',
  PROFILE: 'profile',
  GENERAL: 'general',
} as const;

export type CategoryType = typeof Category[keyof typeof Category];

/**
 * Approvals table schema
 * 
 * Manages change request workflow for various entities (students, faculty, events, research).
 * Secretaries submit change requests which are reviewed and approved/rejected by admins or department chairs.
 * Includes conflict detection, audit trail, and support for bulk operations.
 */
export const approvals = pgTable('approvals', {
  id: uuidPrimaryKey(),
  
  // Entity identification
  entity_type: varchar('entity_type', { length: 50 }).notNull(), // 'student', 'faculty', 'event', 'research'
  entity_id: uuid('entity_id').notNull(),
  category: varchar('category', { length: 50 }).notNull(), // 'research', 'event', 'profile', 'general'
  
  // Change details
  change_details: jsonb('change_details').notNull(), // Requested changes
  original_data: jsonb('original_data'), // Snapshot of entity at submission
  
  // Workflow status
  status: varchar('status', { length: 50 }).notNull(), // 'draft', 'pending', 'approved', 'rejected', 'withdrawn', 'failed', 'conflicted'
  
  // User references
  submitter_id: uuid('submitter_id').notNull().references(() => users.id, { onDelete: 'no action' }),
  reviewer_id: uuid('reviewer_id').references(() => users.id, { onDelete: 'no action' }),
  
  // Timestamps
  submission_timestamp: timestamp('submission_timestamp').defaultNow(),
  decision_timestamp: timestamp('decision_timestamp'),
  application_timestamp: timestamp('application_timestamp'),
  
  // Additional details
  comments: text('comments'),
  department_id: varchar('department_id', { length: 100 }), // Department scope key (currently department name/program)
  
  // Conflict detection and retry logic
  entity_version: integer('entity_version'),
  retry_count: integer('retry_count').default(0).notNull(),
  failure_reason: text('failure_reason'),
  
  // Idempotency support
  idempotency_key: varchar('idempotency_key', { length: 255 }).unique(),
  
  ...timestamps,
  ...softDelete,
}, (table) => ({
  // Indexes for query performance
  statusIdx: index('idx_approvals_status').on(table.status),
  submitterIdx: index('idx_approvals_submitter').on(table.submitter_id),
  reviewerIdx: index('idx_approvals_reviewer').on(table.reviewer_id),
  departmentIdx: index('idx_approvals_department').on(table.department_id),
  submissionTsIdx: index('idx_approvals_submission_ts').on(table.submission_timestamp),
  idempotencyIdx: index('idx_approvals_idempotency').on(table.idempotency_key),
}));

/**
 * Relations
 */
export const approvalsRelations = relations(approvals, ({ one }) => ({
  submitter: one(users, {
    fields: [approvals.submitter_id],
    references: [users.id],
    relationName: 'approval_submitter',
  }),
  reviewer: one(users, {
    fields: [approvals.reviewer_id],
    references: [users.id],
    relationName: 'approval_reviewer',
  }),
  // Note: department relation will be added when departments table is created
}));

/**
 * Type exports for use in application code
 */
export type Approval = typeof approvals.$inferSelect;
export type InsertApproval = typeof approvals.$inferInsert;
export type SelectApproval = typeof approvals.$inferSelect;

/**
 * Zod Schemas for validation
 */

// Zod schema for entity_type validation
const entityTypeSchema = z.enum([
  EntityType.STUDENT,
  EntityType.FACULTY,
  EntityType.EVENT,
  EntityType.RESEARCH,
]);

// Zod schema for category validation
const categorySchema = z.enum([
  Category.RESEARCH,
  Category.EVENT,
  Category.PROFILE,
  Category.GENERAL,
]);

// Zod schema for status validation
const approvalStatusSchema = z.enum([
  ApprovalStatus.DRAFT,
  ApprovalStatus.PENDING,
  ApprovalStatus.APPROVED,
  ApprovalStatus.REJECTED,
  ApprovalStatus.WITHDRAWN,
  ApprovalStatus.FAILED,
  ApprovalStatus.CONFLICTED,
]);

// Insert approval schema for creating new approvals
export const insertApprovalSchema = z.object({
  entity_type: entityTypeSchema,
  entity_id: z.string().uuid(),
  category: categorySchema,
  change_details: z.record(z.any()), // JSONB - flexible object
  original_data: z.record(z.any()).optional().nullable(),
  status: approvalStatusSchema,
  submitter_id: z.string().uuid(),
  reviewer_id: z.string().uuid().optional().nullable(),
  submission_timestamp: z.date().optional(),
  decision_timestamp: z.date().optional().nullable(),
  application_timestamp: z.date().optional().nullable(),
  comments: z.string().optional().nullable(),
  department_id: z.string().max(100).optional().nullable(),
  entity_version: z.number().int().optional().nullable(),
  retry_count: z.number().int().default(0),
  failure_reason: z.string().optional().nullable(),
  idempotency_key: z.string().max(255).optional().nullable(),
  deleted_at: z.date().optional().nullable(),
});

// Select approval schema for reading approvals
export const selectApprovalSchema = z.object({
  id: z.string().uuid(),
  entity_type: entityTypeSchema,
  entity_id: z.string().uuid(),
  category: categorySchema,
  change_details: z.record(z.any()),
  original_data: z.record(z.any()).nullable(),
  status: approvalStatusSchema,
  submitter_id: z.string().uuid(),
  reviewer_id: z.string().uuid().nullable(),
  submission_timestamp: z.date().nullable(),
  decision_timestamp: z.date().nullable(),
  application_timestamp: z.date().nullable(),
  comments: z.string().nullable(),
  department_id: z.string().nullable(),
  entity_version: z.number().int().nullable(),
  retry_count: z.number().int(),
  failure_reason: z.string().nullable(),
  idempotency_key: z.string().nullable(),
  created_at: z.date(),
  updated_at: z.date(),
  deleted_at: z.date().nullable(),
});
