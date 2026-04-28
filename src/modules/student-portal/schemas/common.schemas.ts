/**
 * Common Zod Validation Schemas
 * 
 * Shared validation schemas used across the student portal API.
 * Includes pagination, field validators, and enum validators.
 * 
 */

import { z } from 'zod';

// ============================================================================
// Pagination Schemas
// ============================================================================

/**
 * Pagination schema for list endpoints
 * Default page: 1, default limit: 10, max limit: 100
 * 
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
 * Email validation schema
 * Validates standard email format
 * 
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

/**
 * Phone validation schema
 * Validates phone number format (digits, spaces, dashes, plus, parentheses)
 * Length: 10-15 characters
 * 
 */
export const phoneSchema = z
  .string()
  .regex(/^[\d\s\-\+\(\)]+$/, 'Invalid phone number format')
  .min(10, 'Phone number must be at least 10 characters')
  .max(15, 'Phone number must not exceed 15 characters');

/**
 * Optional phone validation schema
 */
export const optionalPhoneSchema = z
  .string()
  .regex(/^[\d\s\-\+\(\)]+$/, 'Invalid phone number format')
  .min(10, 'Phone number must be at least 10 characters')
  .max(15, 'Phone number must not exceed 15 characters')
  .optional();

/**
 * Date validation schema (ISO 8601 format)
 * Format: YYYY-MM-DD
 * 
 */
export const dateSchema = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, 'Invalid date format. Expected YYYY-MM-DD');

/**
 * Optional date validation schema
 */
export const optionalDateSchema = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, 'Invalid date format. Expected YYYY-MM-DD')
  .optional();

/**
 * DateTime validation schema (ISO 8601 format)
 * Format: YYYY-MM-DDTHH:mm:ss or YYYY-MM-DDTHH:mm:ss.sssZ
 * 
 */
export const dateTimeSchema = z
  .string()
  .datetime({ message: 'Invalid datetime format. Expected ISO 8601 format' });

/**
 * Optional datetime validation schema
 */
export const optionalDateTimeSchema = z
  .string()
  .datetime({ message: 'Invalid datetime format. Expected ISO 8601 format' })
  .optional();

/**
 * UUID validation schema
 * Validates UUID v4 format
 */
export const uuidSchema = z
  .string()
  .uuid('Invalid UUID format');

/**
 * Non-empty string validation schema
 */
export const nonEmptyStringSchema = z
  .string()
  .trim()
  .min(1, 'Field cannot be empty');

/**
 * Optional non-empty string validation schema
 */
export const optionalNonEmptyStringSchema = z
  .string()
  .trim()
  .min(1, 'Field cannot be empty')
  .optional();

// ============================================================================
// Enum Validators
// ============================================================================

/**
 * Notification type enum validation
 * Valid values: academic, financial, event, system
 * 
 */
export const notificationTypeSchema = z.enum([
  'academic',
  'financial',
  'event',
  'system',
]);

export type NotificationType = z.infer<typeof notificationTypeSchema>;

/**
 * Enrollment status enum validation
 * Valid values: enrolled, dropped, completed
 * 
 */
export const enrollmentStatusSchema = z.enum([
  'enrolled',
  'dropped',
  'completed',
]);

export type EnrollmentStatus = z.infer<typeof enrollmentStatusSchema>;

/**
 * Academic standing enum validation
 * Valid values: Good Standing, Probation
 * 
 */
export const academicStandingSchema = z.enum([
  'Good Standing',
  'Probation',
]);

export type AcademicStanding = z.infer<typeof academicStandingSchema>;

/**
 * Research application status enum validation
 * Valid values: pending, accepted, rejected
 * 
 */
export const researchApplicationStatusSchema = z.enum([
  'pending',
  'accepted',
  'rejected',
]);

export type ResearchApplicationStatus = z.infer<typeof researchApplicationStatusSchema>;

/**
 * Event registration status enum validation
 * Valid values: registered, cancelled, attended
 * 
 */
export const eventRegistrationStatusSchema = z.enum([
  'registered',
  'cancelled',
  'attended',
]);

export type EventRegistrationStatus = z.infer<typeof eventRegistrationStatusSchema>;

/**
 * Appointment status enum validation
 * Valid values: scheduled, completed, cancelled
 * 
 */
export const appointmentStatusSchema = z.enum([
  'scheduled',
  'completed',
  'cancelled',
]);

export type AppointmentStatus = z.infer<typeof appointmentStatusSchema>;

/**
 * Message sender role enum validation
 * Valid values: student, faculty
 * 
 */
export const messageSenderRoleSchema = z.enum([
  'student',
  'faculty',
]);

export type MessageSenderRole = z.infer<typeof messageSenderRoleSchema>;

// ============================================================================
// Common Request Validators
// ============================================================================

/**
 * ID parameter validation schema
 * Used for validating route parameters like :id, :notificationId, etc.
 */
export const idParamSchema = z.object({
  id: uuidSchema,
});

/**
 * Student ID parameter validation schema
 */
export const studentIdParamSchema = z.object({
  studentId: uuidSchema,
});

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
 * 
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
