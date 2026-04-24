/**
 * Approval System Validation Schemas
 * 
 * Zod validation schemas for the approval system API endpoints.
 * Includes schemas for change request submission, approval decisions,
 * bulk operations, pagination, and filtering.
 * 
 * Requirements: 17.1-17.7, 18.1-18.9
 */

import { z } from 'zod';

// ============================================================================
// Enum Validators
// ============================================================================

/**
 * Entity type enum validation
 * Valid values: student, faculty, event, research
 * 
 * Requirements: 17.1, 18.1
 */
export const entityTypeEnum = z.enum(['student', 'faculty', 'event', 'research']);

export type EntityType = z.infer<typeof entityTypeEnum>;

/**
 * Category enum validation
 * Valid values: research, event, profile, general
 * 
 * Requirements: 17.1, 18.1
 */
export const categoryEnum = z.enum(['research', 'event', 'profile', 'general']);

export type Category = z.infer<typeof categoryEnum>;

/**
 * Approval status enum validation
 * Valid values: draft, pending, approved, rejected, withdrawn, failed, conflicted
 * 
 * Requirements: 17.1, 18.1
 */
export const approvalStatusEnum = z.enum([
  'draft',
  'pending',
  'approved',
  'rejected',
  'withdrawn',
  'failed',
  'conflicted',
]);

export type ApprovalStatus = z.infer<typeof approvalStatusEnum>;

// ============================================================================
// Change Request Submission Schemas
// ============================================================================

/**
 * Submit change request schema
 * Used for POST /api/v1/approvals
 * 
 * Requirements: 1.1-1.6, 17.1-17.7
 */
export const submitChangeRequestSchema = z.object({
  entity_type: entityTypeEnum,
  entity_id: z.string().uuid('Invalid entity ID format'),
  category: categoryEnum,
  change_details: z.record(z.any()).refine(
    (val) => Object.keys(val).length > 0,
    { message: 'Change details cannot be empty' }
  ),
  idempotency_key: z.string().min(1).max(255).optional(),
});

export type SubmitChangeRequestInput = z.infer<typeof submitChangeRequestSchema>;

// ============================================================================
// Approval Decision Schemas
// ============================================================================

/**
 * Approve request schema
 * Used for PATCH /api/v1/approvals/:id/approve
 * 
 * Requirements: 5.1-5.7, 17.1-17.7
 */
export const approveRequestSchema = z.object({
  comments: z.string().max(2000).optional(),
});

export type ApproveRequestInput = z.infer<typeof approveRequestSchema>;

/**
 * Reject request schema
 * Used for PATCH /api/v1/approvals/:id/reject
 * 
 * Requirements: 5.1-5.7, 17.1-17.7
 */
export const rejectRequestSchema = z.object({
  comments: z.string().min(1, 'Comments are required when rejecting').max(2000),
});

export type RejectRequestInput = z.infer<typeof rejectRequestSchema>;

/**
 * Withdraw request schema
 * Used for PATCH /api/v1/approvals/:id/withdraw
 * No body required
 * 
 * Requirements: 2.1-2.7, 17.1-17.7
 */
export const withdrawRequestSchema = z.object({});

export type WithdrawRequestInput = z.infer<typeof withdrawRequestSchema>;

// ============================================================================
// Bulk Operation Schemas
// ============================================================================

/**
 * Bulk approve schema
 * Used for POST /api/v1/approvals/bulk-approve
 * 
 * Requirements: 8.1-8.7, 17.1-17.7
 */
export const bulkApproveSchema = z.object({
  approvalIds: z
    .array(z.string().uuid('Invalid approval ID format'))
    .min(1, 'At least one approval ID is required')
    .max(100, 'Maximum 100 approval IDs allowed'),
  atomic: z.boolean().optional().default(false),
  comments: z.string().max(2000).optional(),
});

export type BulkApproveInput = z.infer<typeof bulkApproveSchema>;

/**
 * Bulk reject schema
 * Used for POST /api/v1/approvals/bulk-reject
 * 
 * Requirements: 8.1-8.7, 17.1-17.7
 */
export const bulkRejectSchema = z.object({
  approvalIds: z
    .array(z.string().uuid('Invalid approval ID format'))
    .min(1, 'At least one approval ID is required')
    .max(100, 'Maximum 100 approval IDs allowed'),
  comments: z.string().min(1, 'Comments are required for bulk rejection').max(2000),
  atomic: z.boolean().optional().default(false),
});

export type BulkRejectInput = z.infer<typeof bulkRejectSchema>;

// ============================================================================
// Pagination Schema
// ============================================================================

/**
 * Pagination schema for list endpoints
 * Default page: 1, default pageSize: 20, max pageSize: 100
 * 
 * Requirements: 17.1-17.7, 18.1-18.9
 */
export const paginationSchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  pageSize: z.coerce.number().int().positive().max(100).default(20),
});

export type PaginationParams = z.infer<typeof paginationSchema>;

// ============================================================================
// Filter Schema
// ============================================================================

/**
 * Date range schema for filtering
 * 
 * Requirements: 7.1-7.6, 17.1-17.7
 */
export const dateRangeSchema = z.object({
  start_date: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'Invalid date format. Expected YYYY-MM-DD')
    .optional(),
  end_date: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'Invalid date format. Expected YYYY-MM-DD')
    .optional(),
});

export type DateRange = z.infer<typeof dateRangeSchema>;

/**
 * Filter schema for approval list endpoints
 * Used for GET /api/v1/approvals/pending, /api/v1/approvals/history, etc.
 * 
 * Requirements: 2.1-2.7, 4.1-4.6, 7.1-7.6, 17.1-17.7
 */
export const filterSchema = z.object({
  status: approvalStatusEnum.optional(),
  entity_type: entityTypeEnum.optional(),
  category: categoryEnum.optional(),
  submitter_id: z.string().uuid('Invalid submitter ID format').optional(),
  reviewer_id: z.string().uuid('Invalid reviewer ID format').optional(),
  start_date: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'Invalid date format. Expected YYYY-MM-DD')
    .optional(),
  end_date: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'Invalid date format. Expected YYYY-MM-DD')
    .optional(),
});

export type FilterParams = z.infer<typeof filterSchema>;

/**
 * Combined query schema for list endpoints (pagination + filters)
 * 
 * Requirements: 2.1-2.7, 4.1-4.6, 7.1-7.6, 17.1-17.7
 */
export const listQuerySchema = paginationSchema.merge(filterSchema);

export type ListQueryParams = z.infer<typeof listQuerySchema>;

// ============================================================================
// ID Parameter Schema
// ============================================================================

/**
 * ID parameter validation schema (UUID)
 * Used for validating route parameters like :id
 * 
 * Requirements: 17.1-17.7
 */
export const idParamSchema = z.object({
  id: z.string().uuid('Invalid UUID format'),
});

export type IdParam = z.infer<typeof idParamSchema>;

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Calculate pagination metadata
 * 
 * @param total - Total number of items
 * @param page - Current page number
 * @param pageSize - Items per page
 * @returns Pagination metadata object
 */
export function calculatePaginationMeta(
  total: number,
  page: number,
  pageSize: number
): {
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
} {
  return {
    total,
    page,
    pageSize,
    totalPages: Math.ceil(total / pageSize),
  };
}

/**
 * Calculate pagination offset
 * 
 * @param page - Current page number
 * @param pageSize - Items per page
 * @returns Offset for database query
 */
export function calculateOffset(page: number, pageSize: number): number {
  return (page - 1) * pageSize;
}
