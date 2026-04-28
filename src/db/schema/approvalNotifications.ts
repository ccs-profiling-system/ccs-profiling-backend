import { pgTable, varchar, text, boolean, timestamp, uuid, index } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';
import { uuidPrimaryKey } from './utils';
import { users } from './users';
import { approvals } from './approvals';
import { z } from 'zod';

/**
 * Enum Types
 */

// Notification type enum
export const NotificationType = {
  APPROVAL_APPROVED: 'approval_approved',
  APPROVAL_REJECTED: 'approval_rejected',
  CONFLICT_DETECTED: 'conflict_detected',
  APPLICATION_FAILED: 'application_failed',
} as const;

export type NotificationTypeType = typeof NotificationType[keyof typeof NotificationType];

// Notification priority enum
export const NotificationPriority = {
  LOW: 'low',
  MEDIUM: 'medium',
  HIGH: 'high',
} as const;

export type NotificationPriorityType = typeof NotificationPriority[keyof typeof NotificationPriority];

/**
 * Approval Notifications table schema
 * 
 * Stores system-generated notifications for approval workflow events.
 * Notifies users about approval decisions, conflicts, and application failures.
 * 
 */
export const approvalNotifications = pgTable('approval_notifications', {
  id: uuidPrimaryKey(),
  
  // User and change request references
  user_id: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  change_request_id: uuid('change_request_id').references(() => approvals.id, { onDelete: 'cascade' }),
  
  // Notification details
  type: varchar('type', { length: 50 }).notNull(), // 'approval_approved', 'approval_rejected', 'conflict_detected', 'application_failed'
  message: text('message').notNull(),
  priority: varchar('priority', { length: 20 }).default('medium').notNull(), // 'low', 'medium', 'high'
  
  // Read status
  read_status: boolean('read_status').default(false).notNull(),
  
  // Timestamp
  created_at: timestamp('created_at').defaultNow().notNull(),
}, (table) => ({
  // Composite index for efficient querying by user, read status, and date
  userReadCreatedIdx: index('idx_approval_notifications_user_read_created').on(
    table.user_id,
    table.read_status,
    table.created_at
  ),
}));

/**
 * Relations
 */
export const approvalNotificationsRelations = relations(approvalNotifications, ({ one }) => ({
  user: one(users, {
    fields: [approvalNotifications.user_id],
    references: [users.id],
    relationName: 'approval_notification_user',
  }),
  changeRequest: one(approvals, {
    fields: [approvalNotifications.change_request_id],
    references: [approvals.id],
    relationName: 'approval_notification_approval',
  }),
}));

/**
 * Type exports for use in application code
 */
export type ApprovalNotification = typeof approvalNotifications.$inferSelect;
export type InsertApprovalNotification = typeof approvalNotifications.$inferInsert;
export type SelectApprovalNotification = typeof approvalNotifications.$inferSelect;

// Alias exports for consistency with task requirements
export type Notification = ApprovalNotification;
export type InsertNotification = InsertApprovalNotification;
export type SelectNotification = SelectApprovalNotification;

/**
 * Zod Schemas for validation
 */

// Zod schema for notification type validation
const notificationTypeSchema = z.enum([
  NotificationType.APPROVAL_APPROVED,
  NotificationType.APPROVAL_REJECTED,
  NotificationType.CONFLICT_DETECTED,
  NotificationType.APPLICATION_FAILED,
]);

// Zod schema for notification priority validation
const notificationPrioritySchema = z.enum([
  NotificationPriority.LOW,
  NotificationPriority.MEDIUM,
  NotificationPriority.HIGH,
]);

// Insert notification schema for creating new notifications
export const insertNotificationSchema = z.object({
  user_id: z.string().uuid(),
  change_request_id: z.string().uuid().optional().nullable(),
  type: notificationTypeSchema,
  message: z.string().min(1),
  priority: notificationPrioritySchema.default(NotificationPriority.MEDIUM),
  read_status: z.boolean().default(false),
  created_at: z.date().optional(),
});

// Alias for consistency
export const insertApprovalNotificationSchema = insertNotificationSchema;

// Select notification schema for reading notifications
export const selectNotificationSchema = z.object({
  id: z.string().uuid(),
  user_id: z.string().uuid(),
  change_request_id: z.string().uuid().nullable(),
  type: notificationTypeSchema,
  message: z.string(),
  priority: notificationPrioritySchema,
  read_status: z.boolean(),
  created_at: z.date(),
});

// Alias for consistency
export const selectApprovalNotificationSchema = selectNotificationSchema;
