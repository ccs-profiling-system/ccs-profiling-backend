/**
 * Common Zod Validation Schemas for Secretary Portal
 * 
 * Shared validation schemas used across the secretary portal API.
 * Includes pagination, field validators, and enum validators.
 * 
 * Requirements: 13.1-13.12
 */

import { z } from 'zod';

// ============================================================================
// Pagination Schemas
// ============================================================================

/**
 * Pagination schema for list endpoints
 * Default page: 1, default limit: 10, max limit: 100
 * 
 * Requirements: 13.1, 13.2, 13.3
 */
export const paginationSchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(10),
});

export type PaginationParams = z.infer<typeof paginationSchema>;

// ============================================================================
// Common Field Validators
// ============================================================================

/**
 * ID parameter validation schema (UUID)
 * Used for validating route parameters like :id
 * 
 * Requirements: 13.1
 */
export const idParamSchema = z.object({
  id: z.string().uuid('Invalid UUID format'),
});

/**
 * Date range validation schema (ISO 8601 format)
 * Format: YYYY-MM-DD
 * 
 * Requirements: 13.6
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

/**
 * Email validation schema (RFC 5322)
 * 
 * Requirements: 13.5
 */
export const emailSchema = z
  .string()
  .email('Invalid email format')
  .min(1, 'Email is required');

/**
 * Optional email validation schema
 */
export const optionalEmailSchema = z
  .string()
  .email('Invalid email format')
  .optional();

// ============================================================================
// Enum Validators
// ============================================================================

/**
 * Day of week enum validation
 * Valid values: monday, tuesday, wednesday, thursday, friday, saturday, sunday
 * 
 * Requirements: 13.7
 */
export const dayEnum = z.enum([
  'monday',
  'tuesday',
  'wednesday',
  'thursday',
  'friday',
  'saturday',
  'sunday',
]);

export type DayOfWeek = z.infer<typeof dayEnum>;

/**
 * Semester enum validation
 * Valid values: 1st, 2nd, summer
 * 
 * Requirements: 13.7
 */
export const semesterEnum = z.enum(['1st', '2nd', 'summer']);

export type Semester = z.infer<typeof semesterEnum>;

/**
 * Event type enum validation
 * Valid values: seminar, workshop, defense, competition, conference, meeting, other
 * 
 * Requirements: 13.7
 */
export const eventTypeEnum = z.enum([
  'seminar',
  'workshop',
  'defense',
  'competition',
  'conference',
  'meeting',
  'other',
]);

export type EventType = z.infer<typeof eventTypeEnum>;

/**
 * Research type enum validation
 * Valid values: thesis, capstone, publication, grant
 * 
 * Requirements: 13.7
 */
export const researchTypeEnum = z.enum(['thesis', 'capstone', 'publication', 'grant']);

export type ResearchType = z.infer<typeof researchTypeEnum>;

/**
 * Document category enum validation
 * Valid values: memo, policy, form, report, other
 * 
 * Requirements: 13.7
 */
export const documentCategoryEnum = z.enum(['memo', 'policy', 'form', 'report', 'other']);

export type DocumentCategory = z.infer<typeof documentCategoryEnum>;

/**
 * Report format enum validation
 * Valid values: pdf, excel, csv
 * 
 * Requirements: 13.7
 */
export const reportFormatEnum = z.enum(['pdf', 'excel', 'csv']);

export type ReportFormat = z.infer<typeof reportFormatEnum>;

/**
 * Approval status enum validation
 * Valid values: draft, pending_approval, approved, rejected, withdrawn
 * 
 * Requirements: 13.7
 */
export const approvalStatusEnum = z.enum([
  'draft',
  'pending_approval',
  'approved',
  'rejected',
  'withdrawn',
]);

export type ApprovalStatus = z.infer<typeof approvalStatusEnum>;

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Calculate pagination metadata
 * 
 * @param total - Total number of items
 * @param page - Current page number
 * @param limit - Items per page
 * @returns Pagination metadata object
 */
export function calculatePaginationMeta(
  total: number,
  page: number,
  limit: number
): {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
} {
  return {
    total,
    page,
    limit,
    totalPages: Math.ceil(total / limit),
  };
}

/**
 * Calculate pagination offset
 * 
 * @param page - Current page number
 * @param limit - Items per page
 * @returns Offset for database query
 */
export function calculateOffset(page: number, limit: number): number {
  return (page - 1) * limit;
}
