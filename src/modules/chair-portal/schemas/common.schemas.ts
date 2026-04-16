/**
 * Common Validation Schemas for Chair Portal
 * Zod schemas for validating common input patterns across chair portal endpoints
 * 
 * Requirements: 3.4, 3.10, 3.14, 10.5
 */

import { z } from 'zod';

/**
 * Schema for pagination parameters
 * Used across all list endpoints
 */
export const paginationSchema = z.object({
  page: z.string()
    .regex(/^\d+$/)
    .transform(Number)
    .default('1')
    .refine((val) => val >= 1, { message: 'Page must be at least 1' }),
  limit: z.string()
    .regex(/^\d+$/)
    .transform(Number)
    .default('10')
    .refine((val) => val >= 1 && val <= 100, { message: 'Limit must be between 1 and 100' }),
});

/**
 * Schema for approval actions
 * Used when approving students, research, schedules, events
 */
export const approvalSchema = z.object({
  approver_notes: z.string().optional(),
});

/**
 * Schema for rejection actions
 * Used when rejecting students, research, schedules, events
 */
export const rejectionSchema = z.object({
  rejection_reason: z.string()
    .min(10, 'Rejection reason must be at least 10 characters')
    .max(1000, 'Rejection reason must be at most 1000 characters'),
});

/**
 * Schema for workflow state validation
 * Validates workflow state enum values
 */
export const workflowStateSchema = z.enum(['draft', 'pending_approval', 'approved', 'rejected'], {
  errorMap: () => ({ message: 'Workflow state must be one of: draft, pending_approval, approved, rejected' }),
});
